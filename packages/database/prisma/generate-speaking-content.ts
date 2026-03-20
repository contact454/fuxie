/**
 * generate-speaking-content.ts
 * 
 * Uses Gemini to expand Nachsprechen lessons from 1 sentence to 6 sentences,
 * adding textVi, IPA, pronunciationNotes for each sentence.
 * 
 * Usage:
 *   GEMINI_API_KEY="..." npx tsx prisma/generate-speaking-content.ts
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY is required')
  process.exit(1)
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

const AUDIO_FACTORY = path.resolve(__dirname, '../../../../8-Audio-Factory')
const SCRIPTS_DIR = path.join(AUDIO_FACTORY, 'data/scripts/Sprechen-Nachsprechen')
const OUTPUT_DIR = path.resolve(__dirname, '../../../content/a1/speaking')

// CEFR A1 topic metadata
const TOPIC_META: Record<string, { titleDe: string; titleVi: string; context: string }> = {
  'a1-alltag': { titleDe: 'Alltag', titleVi: 'Cuộc sống hàng ngày', context: 'daily routines, everyday activities, simple descriptions of daily life' },
  'a1-begruessung': { titleDe: 'Begrüßung & Vorstellung', titleVi: 'Chào hỏi & giới thiệu', context: 'greetings, introductions, polite phrases, meeting people' },
  'a1-einkaufen': { titleDe: 'Einkaufen', titleVi: 'Mua sắm', context: 'shopping, prices, quantities, stores, asking for items' },
  'a1-essen-trinken': { titleDe: 'Essen & Trinken', titleVi: 'Ăn uống', context: 'food, drinks, meals, ordering in restaurants, cooking' },
  'a1-familie': { titleDe: 'Familie', titleVi: 'Gia đình', context: 'family members, relationships, describing family' },
  'a1-freizeit': { titleDe: 'Freizeit & Hobbys', titleVi: 'Thời gian rảnh & sở thích', context: 'hobbies, sports, free time activities, weekends' },
  'a1-koerper-gesundheit': { titleDe: 'Körper & Gesundheit', titleVi: 'Cơ thể & sức khỏe', context: 'body parts, health, doctor visits, feeling ill' },
  'a1-wegbeschreibung': { titleDe: 'Wegbeschreibung', titleVi: 'Chỉ đường', context: 'directions, locations, getting around, public transport' },
  'a1-wetter-jahreszeiten': { titleDe: 'Wetter & Jahreszeiten', titleVi: 'Thời tiết & mùa', context: 'weather, seasons, temperature, clothing for weather' },
  'a1-wohnen': { titleDe: 'Wohnen', titleVi: 'Nhà ở', context: 'home, rooms, furniture, living situation, apartment' },
}

interface ScriptFile {
  lesson_id: string
  level: string
  title: string
  topic: string
  lines: Array<{ text: string }>
}

interface GeneratedSentence {
  id: string
  textDe: string
  textVi: string
  ipa: string
  audioUrl: string
  expectedDurationSec: number
  pronunciationNotes: string
}

interface GeneratedLesson {
  lessonId: string
  topicSlug: string
  lessonNumber: number
  titleDe: string
  titleVi: string
  originalSentence: string
  sentences: GeneratedSentence[]
}

async function generateLessonContent(
  topicSlug: string,
  lessonNum: number,
  originalSentence: string,
  topicContext: string
): Promise<GeneratedSentence[]> {
  const prompt = `Du bist ein Experte für Deutsch als Fremdsprache (DaF) auf A1-Niveau.

Erstelle 6 Sätze zum Thema "${topicContext}" für eine Nachsprechen-Übung (Repeat-After-Me) auf A1-Niveau.

Der Originalsatz ist: "${originalSentence}"

Die 6 Sätze sollen:
- Thematisch zum Originalsatz passen und das gleiche Vokabelfeld abdecken
- Von LEICHT → SCHWIERIGER verlaufen (Satz 1 am einfachsten, Satz 6 am komplexesten)
- NUR A1-Wortschatz verwenden (Goethe A1 Wortliste)
- Natürlich und alltagstauglich klingen
- Der erste Satz kann der Originalsatz sein

Antworte NUR mit einem JSON-Array. Für jeden Satz:
{
  "textDe": "Der deutsche Satz",
  "textVi": "Bản dịch tiếng Việt",
  "ipa": "IPA-Lautschrift des deutschen Satzes",
  "pronunciationNotes": "Ghi chú phát âm bằng tiếng Việt (tập trung vào âm khó cho người Việt: ch, sch, ü, ö, ä, z, r, w)",
  "expectedDurationSec": 3
}

Wichtig bei pronunciationNotes:
- Schreibe auf Vietnamesisch
- Fokus auf problematische Laute für Vietnamesen
- Kurz und praktisch (1-2 Sätze)
- Beispiel: "Chú ý: 'sch' đọc như 'sh' trong tiếng Anh. 'ch' đọc nhẹ từ cổ họng."

ANTWORTE NUR MIT DEM JSON-ARRAY, KEIN ANDERER TEXT.`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = text
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      jsonStr = jsonMatch[0]
    }
    
    const parsed = JSON.parse(jsonStr) as Array<{
      textDe: string
      textVi: string
      ipa: string
      pronunciationNotes: string
      expectedDurationSec: number
    }>

    return parsed.map((s, idx) => ({
      id: `s${idx + 1}`,
      textDe: s.textDe,
      textVi: s.textVi,
      ipa: s.ipa || '',
      audioUrl: `/audio/speaking/a1/${topicSlug}/s${String(lessonNum).padStart(2, '0')}.mp3`, // existing audio for first sentence
      expectedDurationSec: s.expectedDurationSec || Math.max(2, Math.ceil(s.textDe.split(' ').length * 0.6)),
      pronunciationNotes: s.pronunciationNotes || '',
    }))
  } catch (err: any) {
    console.error(`    ⚠️ Gemini error for ${topicSlug}-${lessonNum}: ${err.message?.slice(0, 80)}`)
    // Fallback: return single sentence with minimal data
    return [{
      id: 's1',
      textDe: originalSentence,
      textVi: '(Chưa dịch)',
      ipa: '',
      audioUrl: `/audio/speaking/a1/${topicSlug}/s${String(lessonNum).padStart(2, '0')}.mp3`,
      expectedDurationSec: Math.max(2, Math.ceil(originalSentence.split(' ').length * 0.6)),
      pronunciationNotes: '',
    }]
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  console.log('🎤 Fuxie Speaking Content Generator')
  console.log('====================================\n')

  if (!fs.existsSync(SCRIPTS_DIR)) {
    console.error('❌ Scripts not found:', SCRIPTS_DIR)
    process.exit(1)
  }

  // Ensure output directory
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  const scriptFiles = fs.readdirSync(SCRIPTS_DIR).filter(f => f.endsWith('.json')).sort()
  console.log(`📂 Found ${scriptFiles.length} Nachsprechen scripts\n`)

  // Group by topic
  const byTopic = new Map<string, ScriptFile[]>()
  for (const file of scriptFiles) {
    try {
      const data: ScriptFile = JSON.parse(fs.readFileSync(path.join(SCRIPTS_DIR, file), 'utf-8'))
      const topic = data.topic || 'unknown'
      if (!byTopic.has(topic)) byTopic.set(topic, [])
      byTopic.get(topic)!.push(data)
    } catch {}
  }

  let totalGenerated = 0
  let totalSentences = 0
  let errors = 0

  for (const [topicSlug, scripts] of byTopic) {
    const meta = TOPIC_META[topicSlug]
    if (!meta) {
      console.log(`  ⏭️ Skipping unknown topic: ${topicSlug}`)
      continue
    }

    console.log(`\n🎤 ${topicSlug} (${meta.titleVi}) — ${scripts.length} lessons`)
    
    // Sort by lesson number
    scripts.sort((a, b) => {
      const numA = parseInt(a.lesson_id.split('-').pop() || '0')
      const numB = parseInt(b.lesson_id.split('-').pop() || '0')
      return numA - numB
    })

    const topicLessons: GeneratedLesson[] = []

    for (let i = 0; i < scripts.length; i++) {
      const script = scripts[i]!
      const lessonNum = parseInt(script.lesson_id.split('-').pop() || `${i + 1}`)
      const originalSentence = script.lines[0]?.text || ''

      if (!originalSentence) {
        console.log(`  ⚠️ Empty sentence in ${script.lesson_id}`)
        errors++
        continue
      }

      console.log(`  📝 Lesson ${lessonNum}: "${originalSentence.slice(0, 40)}..."`)
      
      const sentences = await generateLessonContent(
        topicSlug,
        lessonNum,
        originalSentence,
        meta.context
      )

      topicLessons.push({
        lessonId: `${topicSlug}-${String(lessonNum).padStart(2, '0')}-nachsprechen`,
        topicSlug,
        lessonNumber: lessonNum,
        titleDe: script.title.replace('Nachsprechen: ', ''),
        titleVi: `Nhắc lại: ${meta.titleVi}`,
        originalSentence,
        sentences,
      })

      totalGenerated++
      totalSentences += sentences.length
      console.log(`     ✅ ${sentences.length} sentences generated`)

      // Rate limiting: 500ms between calls
      await sleep(500)
    }

    // Save topic output
    const outFile = path.join(OUTPUT_DIR, `${topicSlug}.json`)
    fs.writeFileSync(outFile, JSON.stringify({
      topicSlug,
      titleDe: meta.titleDe,
      titleVi: meta.titleVi,
      cefrLevel: 'A1',
      lessons: topicLessons,
    }, null, 2), 'utf-8')
    console.log(`  💾 Saved: ${outFile}`)
  }

  console.log('\n====================================')
  console.log('📊 GENERATION SUMMARY')
  console.log('====================================')
  console.log(`  Topics: ${byTopic.size}`)
  console.log(`  Lessons generated: ${totalGenerated}`)
  console.log(`  Total sentences: ${totalSentences}`)
  console.log(`  Avg sentences/lesson: ${totalGenerated > 0 ? Math.round(totalSentences / totalGenerated) : 0}`)
  if (errors > 0) console.log(`  Errors: ${errors}`)
  console.log(`\n  Output: ${OUTPUT_DIR}`)
  console.log('\n✅ Content generation complete! 🦊')
}

main().catch(e => {
  console.error('❌ Generation failed:', e)
  process.exit(1)
})
