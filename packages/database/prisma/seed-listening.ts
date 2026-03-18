/**
 * seed-listening.ts
 * 
 * Seeds ListeningLesson from Audio-Factory manifest + script files.
 * Questions are NOT seeded (they don't exist yet — need AI generation).
 * 
 * Usage:
 *   DATABASE_URL="..." npx tsx prisma/seed-listening.ts
 */

import { PrismaClient, CefrLevel } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const prisma = new PrismaClient()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const AUDIO_FACTORY = path.resolve(__dirname, '../../../../8-Audio-Factory')
const MANIFEST_PATH = path.join(AUDIO_FACTORY, 'data/manifests/listening_lesson_manifest.json')
const SCRIPTS_DIR = path.join(AUDIO_FACTORY, 'data/scripts')

const LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

interface ManifestLesson {
  id: string
  level: string
  module_id: string
  lesson_index: number
  title: string
  topic: string
  audio_type: string
  question_format: string
  estimated_question_count: number
  estimated_audio_minutes: number
  goethe_alignment: string
  status: string
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
  background_scene: string
  output_filename: string
  lines: any[]
}

async function main() {
  console.log('🎧 Fuxie Listening Seed')
  console.log('========================\n')

  // Read manifest
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error('❌ Manifest not found:', MANIFEST_PATH)
    process.exit(1)
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'))
  const manifestLessons: ManifestLesson[] = manifest.lessons
  console.log(`📋 Manifest: ${manifestLessons.length} lessons\n`)

  // Build script lookup: lesson_id -> script data
  const scriptMap = new Map<string, ScriptFile>()
  for (const level of LEVELS) {
    const levelDir = path.join(SCRIPTS_DIR, level)
    if (!fs.existsSync(levelDir)) continue
    // Recurse into Teil subdirectories
    const teilDirs = fs.readdirSync(levelDir, { withFileTypes: true })
      .filter((d: any) => d.isDirectory())
    for (const teilDir of teilDirs) {
      const teilPath = path.join(levelDir, teilDir.name)
      const jsonFiles = fs.readdirSync(teilPath).filter((f: any) => f.endsWith('.json'))
      for (const file of jsonFiles) {
        try {
          const data: ScriptFile = JSON.parse(fs.readFileSync(path.join(teilPath, file), 'utf-8'))
          if (data.lesson_id) {
            scriptMap.set(data.lesson_id, data)
          }
        } catch {}
      }
    }
  }
  console.log(`📂 Scripts loaded: ${scriptMap.size}\n`)

  let totalLessons = 0
  let errors = 0

  // Map manifest lesson_id format (A1-L001) to script lesson_id format (L-A1-GOETHE-001-T1)
  // We'll iterate through scripts directly since they have the correct lesson_id for the DB
  for (const [lessonId, script] of scriptMap) {
    try {
      const level = script.level as CefrLevel
      if (!LEVELS.includes(level)) continue

      // Try to find manifest entry
      const manifestEntry = manifestLessons.find(m => 
        m.level === level && m.topic?.toLowerCase().includes(script.topic?.toLowerCase()?.slice(0, 10))
      )

      const audioFilename = script.output_filename || `${lessonId}.mp3`
      const audioUrl = `/audio/listening/${level}/${audioFilename}`

      await prisma.listeningLesson.upsert({
        where: { lessonId },
        update: {
          cefrLevel: level,
          board: script.board || 'GOETHE',
          teil: script.teil,
          teilName: script.teil_name,
          title: script.title || manifestEntry?.title || lessonId,
          topic: script.topic || manifestEntry?.topic || '',
          taskType: script.task_type || manifestEntry?.question_format || 'mc_abc',
          audioUrl,
          backgroundScene: script.background_scene || null,
          transcript: script.lines || null,
          sortOrder: totalLessons + 1,
        },
        create: {
          lessonId,
          cefrLevel: level,
          board: script.board || 'GOETHE',
          teil: script.teil,
          teilName: script.teil_name,
          title: script.title || manifestEntry?.title || lessonId,
          topic: script.topic || manifestEntry?.topic || '',
          taskType: script.task_type || manifestEntry?.question_format || 'mc_abc',
          audioUrl,
          backgroundScene: script.background_scene || null,
          transcript: script.lines || null,
          sortOrder: totalLessons + 1,
        },
      })
      totalLessons++
    } catch (err: any) {
      console.error(`  ⚠️  Error ${lessonId}: ${err.message?.slice(0, 80)}`)
      errors++
    }
  }

  // Summary
  console.log('\n========================')
  console.log('📊 LISTENING SEED SUMMARY')
  console.log('========================')
  for (const level of LEVELS) {
    const count = await prisma.listeningLesson.count({ where: { cefrLevel: level } })
    if (count > 0) console.log(`  ${level}: ${count} lessons`)
  }
  const total = await prisma.listeningLesson.count()
  console.log(`  Total: ${total} lessons`)
  if (errors > 0) console.log(`  Errors: ${errors}`)
  console.log('\n✅ Listening seed complete! 🦊')
  console.log('  ⚠️  Questions not yet seeded (need AI generation)')
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
