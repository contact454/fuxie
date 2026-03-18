/**
 * seed-speaking.ts
 * 
 * Seeds SpeakingTopic + SpeakingLesson from Audio-Factory's
 * Sprechen-Nachsprechen scripts and local audio files.
 *
 * Usage:
 *   DATABASE_URL="..." npx tsx prisma/seed-speaking.ts
 */

import { PrismaClient, CefrLevel } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const prisma = new PrismaClient()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const AUDIO_FACTORY = path.resolve(__dirname, '../../../../8-Audio-Factory')
const SCRIPTS_DIR = path.join(AUDIO_FACTORY, 'data/scripts/Sprechen-Nachsprechen')

// Topic metadata (from directory names in public/audio/speaking/a1/)
const TOPIC_META: Record<string, { titleDe: string; titleVi: string }> = {
  'a1-alltag': { titleDe: 'Alltag', titleVi: 'Cuộc sống hàng ngày' },
  'a1-begruessung': { titleDe: 'Begrüßung & Vorstellung', titleVi: 'Chào hỏi & giới thiệu' },
  'a1-einkaufen': { titleDe: 'Einkaufen', titleVi: 'Mua sắm' },
  'a1-essen-trinken': { titleDe: 'Essen & Trinken', titleVi: 'Ăn uống' },
  'a1-familie': { titleDe: 'Familie', titleVi: 'Gia đình' },
  'a1-freizeit': { titleDe: 'Freizeit & Hobbys', titleVi: 'Thời gian rảnh & sở thích' },
  'a1-koerper-gesundheit': { titleDe: 'Körper & Gesundheit', titleVi: 'Cơ thể & sức khỏe' },
  'a1-wegbeschreibung': { titleDe: 'Wegbeschreibung', titleVi: 'Chỉ đường' },
  'a1-wetter-jahreszeiten': { titleDe: 'Wetter & Jahreszeiten', titleVi: 'Thời tiết & mùa' },
  'a1-wohnen': { titleDe: 'Wohnen', titleVi: 'Nhà ở' },
}

interface ScriptFile {
  lesson_id: string
  level: string
  title: string
  board: string
  teil: number
  teil_name: string
  task_type: string
  topic: string
  output_filename: string
  lines: any[]
}

async function main() {
  console.log('🎤 Fuxie Speaking Seed')
  console.log('========================\n')

  if (!fs.existsSync(SCRIPTS_DIR)) {
    console.error('❌ Scripts not found:', SCRIPTS_DIR)
    process.exit(1)
  }

  const scriptFiles = fs.readdirSync(SCRIPTS_DIR).filter((f: string) => f.endsWith('.json')).sort()
  console.log(`📂 Found ${scriptFiles.length} speaking scripts\n`)

  // Group scripts by topic
  const byTopic = new Map<string, ScriptFile[]>()
  for (const file of scriptFiles) {
    try {
      const data: ScriptFile = JSON.parse(fs.readFileSync(path.join(SCRIPTS_DIR, file), 'utf-8'))
      const topic = data.topic || 'unknown'
      if (!byTopic.has(topic)) byTopic.set(topic, [])
      byTopic.get(topic)!.push(data)
    } catch {}
  }

  let topicCount = 0
  let lessonCount = 0
  let errors = 0

  for (const [topicSlug, scripts] of byTopic) {
    try {
      const meta = TOPIC_META[topicSlug] || { titleDe: topicSlug, titleVi: topicSlug }

      // Upsert SpeakingTopic
      const topic = await prisma.speakingTopic.upsert({
        where: { slug: topicSlug },
        update: {
          titleDe: meta.titleDe,
          titleVi: meta.titleVi,
          cefrLevel: 'A1',
          sortOrder: topicCount + 1,
          status: 'PUBLISHED',
        },
        create: {
          slug: topicSlug,
          titleDe: meta.titleDe,
          titleVi: meta.titleVi,
          cefrLevel: 'A1',
          sortOrder: topicCount + 1,
          status: 'PUBLISHED',
        },
      })
      topicCount++
      console.log(`  🎤 ${topicSlug}: ${scripts.length} lessons`)

      // Sort scripts by lesson number
      scripts.sort((a, b) => {
        const numA = parseInt(a.lesson_id.split('-').pop() || '0')
        const numB = parseInt(b.lesson_id.split('-').pop() || '0')
        return numA - numB
      })

      // Upsert SpeakingLessons
      for (let i = 0; i < scripts.length; i++) {
        const script = scripts[i]
        const lessonNum = parseInt(script.lesson_id.split('-').pop() || `${i + 1}`)
        const lessonId = `${topicSlug}-${String(lessonNum).padStart(2, '0')}-nachsprechen`

        // Build exercises from lines
        const exercises = script.lines.map((line: any, idx: number) => ({
          id: `ex-${idx + 1}`,
          type: 'nachsprechen',
          promptDe: line.text || line.content || '',
          audioUrl: `/audio/speaking/${topicSlug}/s${String(lessonNum).padStart(2, '0')}.mp3`,
          order: idx + 1,
        }))

        await prisma.speakingLesson.upsert({
          where: { id: lessonId },
          update: {
            topicId: topic.id,
            level: 'A1',
            lessonType: 'E',
            lessonNumber: lessonNum,
            titleDe: script.title,
            titleVi: `Nhắc lại: ${meta?.titleVi || topicSlug}`,
            exerciseType: 'nachsprechen',
            exercisesJson: exercises,
            estimatedMin: 3,
            sortOrder: i + 1,
            status: 'PUBLISHED',
          },
          create: {
            id: lessonId,
            topicId: topic.id,
            level: 'A1',
            lessonType: 'E',
            lessonNumber: lessonNum,
            titleDe: script.title,
            titleVi: `Nhắc lại: ${meta?.titleVi || topicSlug}`,
            exerciseType: 'nachsprechen',
            exercisesJson: exercises,
            estimatedMin: 3,
            sortOrder: i + 1,
            status: 'PUBLISHED',
          },
        })
        lessonCount++
      }
    } catch (err: any) {
      console.error(`  ⚠️  Error ${topicSlug}: ${err.message?.slice(0, 80)}`)
      errors++
    }
  }

  console.log('\n========================')
  console.log('📊 SPEAKING SEED SUMMARY')
  console.log('========================')
  console.log(`  Topics: ${topicCount}`)
  console.log(`  Lessons: ${lessonCount}`)
  if (errors > 0) console.log(`  Errors: ${errors}`)
  console.log('\n✅ Speaking seed complete! 🦊')
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
