/**
 * Generate Audio Factory–compatible JSON scripts for 80 Nachsprechen sentences.
 * 
 * 1. Reads sentences from the speaking_lessons DB
 * 2. Creates one JSON script per sentence in Audio Factory format
 * 3. Outputs to 8-Audio-Factory/data/scripts/Sprechen-Nachsprechen/
 * 
 * Usage: npx tsx scripts/gen-speaking-audio.ts
 * Then render: cd 8-Audio-Factory && python3 batch_produce.py --scripts-dir data/scripts/Sprechen-Nachsprechen
 */

import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

dotenv.config({ path: path.resolve(__dirname, '../apps/web/.env') })

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } }
})

// Audio Factory path — adjust if needed
const AUDIO_FACTORY_DIR = path.resolve(__dirname, '../../8-Audio-Factory')
const SCRIPTS_OUTPUT_DIR = path.join(AUDIO_FACTORY_DIR, 'data/scripts/Sprechen-Nachsprechen')

// Voice profile for clear, neutral German pronunciation model
const MODEL_VOICE = {
  speaker: 'Modell_Sprecher',
  speaker_role: 'pronunciation_model',
  voice_description: 'A 30-year-old clear German female with a warm, neutral mid-register voice. Precise Hochdeutsch pronunciation with ideal articulation speed for language learners. Clear enunciation of each syllable, natural rhythm, no regional accent. Studio-quality microphone, close distance.',
  instruct_control: '[Speak slowly and clearly as a pronunciation model for German language learners. Articulate each word precisely with natural intonation. Maintain consistent warm, encouraging tone.]',
  emotion: 'neutral' as const,
  speed: 0.65,   // Slower for learner comprehension
  pause_after: 0.5,
  engine: 'qwen3' as const,
}

interface NachsprechenSentence {
  id: string
  textDe: string
  textVi: string
  ipa: string
  audioUrl: string
  expectedDurationSec: number
  pronunciationNotes?: string
}

function createAudioScript(
  lessonId: string,
  sentenceId: string,
  topicSlug: string,
  level: string,
  sentence: NachsprechenSentence,
  idx: number,
) {
  return {
    lesson_id: `L-SPR-${level.toUpperCase()}-${topicSlug.toUpperCase()}-${String(idx + 1).padStart(2, '0')}`,
    level: level.toUpperCase(),
    title: `Nachsprechen: ${sentence.textDe}`,
    board: 'FUXIE',
    teil: 0,
    teil_name: 'Nachsprechen',
    task_type: 'repeat_after_me',
    topic: topicSlug,
    background_scene: 'none',
    background_sfx_volume: 0,
    output_filename: `Sprechen-Nachsprechen/${topicSlug}/${sentenceId}.mp3`,
    lines: [
      {
        ...MODEL_VOICE,
        text: sentence.textDe,
      },
    ],
  }
}

async function main() {
  console.log('🎙️  Generating Audio Factory Scripts for Nachsprechen')
  console.log('=' .repeat(60))

  // Fetch all speaking lessons with exercises
  const lessons = await prisma.speakingLesson.findMany({
    where: {
      exerciseType: 'nachsprechen',
      status: 'PUBLISHED',
    },
    include: { topic: true },
    orderBy: { sortOrder: 'asc' },
  })

  if (lessons.length === 0) {
    console.log('❌ No nachsprechen lessons found in DB')
    return
  }

  let totalScripts = 0
  let totalTopics = 0

  for (const lesson of lessons) {
    const topicSlug = lesson.topic.slug
    const exerciseData = lesson.exercisesJson as { sentences: NachsprechenSentence[] }
    const sentences = exerciseData.sentences || []

    if (sentences.length === 0) {
      console.log(`  ⚠️ ${topicSlug}: no sentences, skipping`)
      continue
    }

    // Create output directory for this topic
    const topicDir = path.join(SCRIPTS_OUTPUT_DIR, topicSlug)
    fs.mkdirSync(topicDir, { recursive: true })

    console.log(`\n📁 ${topicSlug} (${sentences.length} sentences)`)

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i]
      const sentenceId = sentence.id || `s${String(i + 1).padStart(2, '0')}`
      const scriptFileName = `L-SPR-${topicSlug.toUpperCase()}-${String(i + 1).padStart(2, '0')}.json`

      // Create Audio Factory script
      const script = createAudioScript(lesson.id, sentenceId, topicSlug, lesson.level || 'A1', sentence, i)

      // Write to scripts directory (flat — batch_produce.py discovers L-*.json)
      const scriptPath = path.join(SCRIPTS_OUTPUT_DIR, scriptFileName)
      fs.writeFileSync(scriptPath, JSON.stringify(script, null, 2), 'utf-8')

      console.log(`  ✅ ${scriptFileName} → "${sentence.textDe.substring(0, 40)}..."`)
      totalScripts++
    }

    totalTopics++
  }

  // Create a manifest for tracking
  const manifestPath = path.join(SCRIPTS_OUTPUT_DIR, '_manifest.json')
  fs.writeFileSync(manifestPath, JSON.stringify({
    type: 'sprechen-nachsprechen',
    level: 'A1',
    totalTopics,
    totalScripts,
    generatedAt: new Date().toISOString(),
    renderCommand: `cd ${AUDIO_FACTORY_DIR} && python3 batch_produce.py --scripts-dir data/scripts/Sprechen-Nachsprechen`,
  }, null, 2), 'utf-8')

  console.log('\n' + '=' .repeat(60))
  console.log(`🎉 DONE!`)
  console.log(`   Topics: ${totalTopics}`)
  console.log(`   Scripts: ${totalScripts}`)
  console.log(`   Output dir: ${SCRIPTS_OUTPUT_DIR}`)
  console.log(`\n📋 Next step — render on GPU server:`)
  console.log(`   cd ${AUDIO_FACTORY_DIR}`)
  console.log(`   python3 batch_produce.py --scripts-dir data/scripts/Sprechen-Nachsprechen`)
  console.log(`\n📋 Then deploy MP3s to Fuxie:`)
  console.log(`   cp -r ${AUDIO_FACTORY_DIR}/data/output/Sprechen-Nachsprechen/* \\`)
  console.log(`     apps/web/public/audio/speaking/a1/`)

  await prisma.$disconnect()
}

main().catch(console.error)
