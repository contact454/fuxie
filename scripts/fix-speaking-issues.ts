/**
 * Fix all issues found by audit-speaking.ts
 * 
 * CRITICAL:
 * 1. a1-alltag:s01 "Guten Morgen!" → duplicate of a1-begruessung:s01
 * 2. a1-familie:s02 IPA: ˌhast → hast
 * 
 * WARNING:
 * 3. a1-begruessung:s05 IPA: t͡svanʦɪç → noted as acceptable
 * 4. a1-begruessung:s08 "Ingenieur" not strict A1 → change to "Lehrer"
 * 5. a1-essen-trinken:s05 "Möchten Sie" → fix VN translation
 * 6. a1-alltag:s03 IPA: /ˈkafe/ → /ˈkafɛ/
 * 7. a1-wegbeschreibung:s05 "Gehen Sie" → fix VN translation
 * 8. a1-wegbeschreibung:s07 "Fahren Sie" → fix VN translation
 * 9. a1-koerper-gesundheit:s04 "Arzttermin" → simplify
 * 10. a1-koerper-gesundheit:s08 "regelmäßig" → replace with "jeden Tag"
 * 
 * Usage: npx tsx scripts/fix-speaking-issues.ts
 */

import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

dotenv.config({ path: path.resolve(__dirname, '../apps/web/.env') })

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } }
})

interface Sentence {
  id: string
  textDe: string
  textVi: string
  ipa: string
  audioUrl: string
  expectedDurationSec: number
  pronunciationNotes?: string
}

const FIXES: Record<string, Record<string, Partial<Sentence>>> = {
  // ═══ CRITICAL 1: Duplicate "Guten Morgen!" in a1-alltag ═══
  'a1-alltag-01-nachsprechen': {
    's01': {
      textDe: 'Ich stehe um sieben Uhr auf.',
      textVi: 'Tôi thức dậy lúc bảy giờ.',
      ipa: '/ɪç ˈʃteːə ʊm ˈziːbn̩ uːɐ̯ aʊ̯f/',
      expectedDurationSec: 2.5,
      pronunciationNotes: "Chú ý: 'st' ở đầu từ phát âm /ʃt/. 'Uhr' có âm 'r' nuốt /uːɐ̯/.",
    },
    // Also fix s02 since s01 changed → s02 "Ich stehe auf" now overlaps
    's02': {
      textDe: 'Ich frühstücke um acht Uhr.',
      textVi: 'Tôi ăn sáng lúc tám giờ.',
      ipa: '/ɪç ˈfʁyːʃtʏkə ʊm axt uːɐ̯/',
      expectedDurationSec: 2.5,
      pronunciationNotes: "Chú ý: 'ü' trong 'frühstücke' phát âm tròn môi /yː/.",
    },
  },

  // ═══ CRITICAL 2: IPA error in a1-familie:s02 ═══
  'a1-familie-01-nachsprechen': {
    's02': {
      ipa: '/hast duː ɡəˈʃvɪstɐ/',  // Remove incorrect ˌ
    },
  },

  // ═══ WARNING: a1-begruessung:s08 "Ingenieur" → A2 vocab ═══
  'a1-begruessung-01-nachsprechen': {
    's05': {
      // Fix "25" written as number → spell it out and fix IPA note
      textDe: 'Ich bin fünfundzwanzig Jahre alt.',
      ipa: '/ɪç bɪn ˈfʏnfʊntˌt͡svanʦɪç ˈjaːʁə alt/',
    },
    's08': {
      textDe: 'Ich arbeite als Lehrer und wohne in Berlin.',
      textVi: 'Tôi làm giáo viên và sống ở Berlin.',
      ipa: '/ɪç ˈaʁbaɪ̯tə als ˈleːʁɐ ʊnt ˈvoːnə ɪn bɛʁˈliːn/',
      pronunciationNotes: "Chú ý: 'r' trong 'Lehrer' và 'Berlin' phát âm cuống họng /ʁ/. 'ei' trong 'arbeite' phát âm giống 'ai' trong tiếng Anh 'my'.",
    },
  },

  // ═══ WARNING: a1-essen-trinken:s05 Sie→Bạn translation ═══
  'a1-essen-trinken-01-nachsprechen': {
    's05': {
      textVi: 'Quý vị có muốn uống gì không?', // Formal "Sie" → "Quý vị"
    },
  },

  // ═══ WARNING: a1-alltag:s03 IPA Kaffee ═══
  // Already handled in s01/s02 fix above. s03 "Ich trinke Kaffee" stays
  // but fix its IPA
  // Note: this lesson_id is a1-alltag-01-nachsprechen
  // s03 fix is part of a1-alltag too:

  // ═══ WARNING: a1-wegbeschreibung Sie→Bạn ═══
  'a1-wegbeschreibung-01-nachsprechen': {
    's05': {
      textVi: 'Quý vị đi thẳng đến bưu điện.', // Sie → Quý vị
    },
    's07': {
      textVi: 'Quý vị đi tàu điện ngầm đến sân bay.', // Sie → Quý vị
    },
    's08': {
      textVi: 'Xin lỗi, trạm xe buýt gần nhất ở đâu ạ?', // Add ạ for formality
    },
  },

  // ═══ WARNING: a1-koerper-gesundheit vocab ═══
  'a1-koerper-gesundheit-01-nachsprechen': {
    's04': {
      textDe: 'Ich brauche einen Termin beim Arzt.',
      textVi: 'Tôi cần một cuộc hẹn với bác sĩ.',
      ipa: '/ɪç ˈbraʊ̯xə ˈaɪ̯nən tɛʁˈmiːn baɪ̯m aʁt͡st/',
      pronunciationNotes: "Chú ý: 'ch' trong 'brauche' là âm xát vòm mềm. 'r' trong 'Termin' và 'Arzt' phát âm cuống họng /ʁ/.",
    },
    's08': {
      textDe: 'Ich esse gesundes Essen und mache jeden Tag Sport.',
      textVi: 'Tôi ăn thức ăn lành mạnh và tập thể thao mỗi ngày.',
      ipa: '/ɪç ˈɛsə ɡəˈzʊndəs ˈɛsn̩ ʊnt ˈmaxə ˈjeːdn̩ taːk ʃpɔʁt/',
      pronunciationNotes: "Chú ý: 'ss' trong 'Essen' phát âm như 's'. 'ch' trong 'mache' là âm xát vòm mềm.",
    },
  },
}

// Also fix alltag s03 IPA separately
const ALLTAG_S03_IPA_FIX = '/ɪç ˈtʁɪŋkə ˈkafɛ/'

async function main() {
  console.log('🔧 Fixing Nachsprechen Issues')
  console.log('=' .repeat(50))

  let fixedCount = 0

  for (const [lessonId, sentenceFixes] of Object.entries(FIXES)) {
    const lesson = await prisma.speakingLesson.findUnique({ where: { id: lessonId } })
    if (!lesson) {
      console.log(`  ❌ Lesson not found: ${lessonId}`)
      continue
    }

    const exercisesJson = lesson.exercisesJson as { sentences: Sentence[] }
    const sentences = exercisesJson.sentences

    for (const [sentenceId, fix] of Object.entries(sentenceFixes)) {
      const idx = sentences.findIndex(s => s.id === sentenceId)
      if (idx === -1) {
        console.log(`  ❌ Sentence not found: ${lessonId}/${sentenceId}`)
        continue
      }

      // Apply fix (merge with existing)
      const original = sentences[idx]
      sentences[idx] = { ...original, ...fix }
      console.log(`  ✅ [${lessonId}:${sentenceId}] "${fix.textDe || original.textDe}" fixed`)
      fixedCount++
    }

    // Special: fix alltag s03 IPA
    if (lessonId === 'a1-alltag-01-nachsprechen') {
      const s03 = sentences.find(s => s.id === 's03')
      if (s03) {
        s03.ipa = ALLTAG_S03_IPA_FIX
        console.log(`  ✅ [${lessonId}:s03] IPA fixed to ${ALLTAG_S03_IPA_FIX}`)
        fixedCount++
      }
    }

    // Save back to DB
    await prisma.speakingLesson.update({
      where: { id: lessonId },
      data: {
        exercisesJson: { sentences },
        updatedAt: new Date(),
      },
    })
  }

  console.log(`\n✅ Fixed ${fixedCount} issues`)

  // ═══ Regenerate Audio Factory scripts for fixed sentences ═══
  console.log('\n🎙️  Regenerating Audio Factory scripts for fixed sentences...')
  const AUDIO_FACTORY_DIR = path.resolve(__dirname, '../../8-Audio-Factory')
  const SCRIPTS_DIR = path.join(AUDIO_FACTORY_DIR, 'data/scripts/Sprechen-Nachsprechen')

  const MODEL_VOICE = {
    speaker: 'Modell_Sprecher',
    speaker_role: 'pronunciation_model',
    voice_description: 'A 30-year-old clear German female with a warm, neutral mid-register voice. Precise Hochdeutsch pronunciation with ideal articulation speed for language learners. Clear enunciation of each syllable, natural rhythm, no regional accent. Studio-quality microphone, close distance.',
    instruct_control: '[Speak slowly and clearly as a pronunciation model for German language learners. Articulate each word precisely with natural intonation. Maintain consistent warm, encouraging tone.]',
    emotion: 'neutral',
    speed: 0.65,
    pause_after: 0.5,
    engine: 'qwen3',
  }

  for (const [lessonId] of Object.entries(FIXES)) {
    const lesson = await prisma.speakingLesson.findUnique({
      where: { id: lessonId },
      include: { topic: true },
    })
    if (!lesson) continue

    const exercisesJson = lesson.exercisesJson as { sentences: Sentence[] }
    const topicSlug = lesson.topic.slug

    for (let i = 0; i < exercisesJson.sentences.length; i++) {
      const s = exercisesJson.sentences[i]
      const scriptFileName = `L-SPR-${topicSlug.toUpperCase()}-${String(i + 1).padStart(2, '0')}.json`
      const scriptPath = path.join(SCRIPTS_DIR, scriptFileName)

      const script = {
        lesson_id: `L-SPR-${topicSlug.toUpperCase()}-${String(i + 1).padStart(2, '0')}`,
        level: 'A1',
        title: `Nachsprechen: ${s.textDe}`,
        board: 'FUXIE',
        teil: 0,
        teil_name: 'Nachsprechen',
        task_type: 'repeat_after_me',
        topic: topicSlug,
        background_scene: 'none',
        background_sfx_volume: 0,
        output_filename: `Sprechen-Nachsprechen/${topicSlug}/${s.id}.mp3`,
        lines: [{ ...MODEL_VOICE, text: s.textDe }],
      }

      fs.writeFileSync(scriptPath, JSON.stringify(script, null, 2), 'utf-8')
    }
    console.log(`  📝 Regenerated scripts for ${topicSlug}`)
  }

  console.log('\n🎉 All fixes applied and scripts regenerated!')
  await prisma.$disconnect()
}

main().catch(console.error)
