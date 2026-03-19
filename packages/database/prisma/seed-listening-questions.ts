/**
 * seed-listening-questions.ts
 *
 * Seeds ListeningQuestion from the generated exercise JSON files.
 * Expects lessons to be already seeded (via seed-listening.ts).
 *
 * Usage:
 *   DATABASE_URL="..." npx tsx prisma/seed-listening-questions.ts
 */

import { PrismaClient, CefrLevel } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const prisma = new PrismaClient()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const CONTENT_DIR = path.resolve(__dirname, '../../../content')
const LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

interface ExerciseQuestion {
  id: string           // "Q1"
  gespraech?: number
  item?: number
  type: string         // "mc_abc", "richtig_falsch", "zuordnung", "ja_nein"
  question?: string    // MC question text
  statement?: string   // R/F statement text
  options?: Record<string, string> | number[]  // MC options or Zuordnung list
  answer: string | number
  points: number
  explanation: {
    de: string
    vi?: string
    key_evidence: string
    key_vocabulary: Array<{ word: string; meaning: string }>
  }
}

interface ExerciseFile {
  id: string            // "L-A1-GOETHE-001-T1"
  level: string
  teil: number
  teil_name: string
  task_type: string
  topic: string
  audio_file: string
  questions: ExerciseQuestion[]
  scoring: any
}

function formatOptions(q: ExerciseQuestion): string[] {
  if (q.options && typeof q.options === 'object' && !Array.isArray(q.options)) {
    // MC options: { "a": "...", "b": "...", "c": "..." }
    return Object.entries(q.options).map(([key, val]) => `${key}) ${val}`)
  }
  if (Array.isArray(q.options)) {
    return q.options.map(o => String(o))
  }
  // R/F or Ja/Nein
  if (q.type === 'richtig_falsch') return ['richtig', 'falsch']
  if (q.type === 'ja_nein') return ['ja', 'nein']
  return []
}

async function main() {
  console.log('🎧 Fuxie Listening QUESTIONS Seed')
  console.log('===================================\n')

  let totalQuestions = 0
  let totalLessonsUpdated = 0
  let errors = 0

  for (const level of LEVELS) {
    const listeningDir = path.join(CONTENT_DIR, level.toLowerCase(), 'listening')
    if (!fs.existsSync(listeningDir)) {
      console.log(`  ⚠️  No listening dir for ${level}`)
      continue
    }

    const files = fs.readdirSync(listeningDir).filter(f => f.endsWith('.json')).sort()
    console.log(`\n📂 ${level}: ${files.length} exercise files`)

    for (const file of files) {
      const filePath = path.join(listeningDir, file)
      try {
        const exercise: ExerciseFile = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
        const lessonId = exercise.id

        // Find the lesson in DB
        const lesson = await prisma.listeningLesson.findUnique({
          where: { lessonId },
          select: { id: true },
        })

        if (!lesson) {
          console.log(`  ⚠️  Lesson ${lessonId} not in DB — skipping`)
          continue
        }

        // Delete existing questions for this lesson (re-seed)
        await prisma.listeningQuestion.deleteMany({
          where: { lessonId: lesson.id },
        })

        // Insert questions
        for (let i = 0; i < exercise.questions.length; i++) {
          const q = exercise.questions[i]!
          const questionText = q.question || q.statement || ''
          const options = formatOptions(q)

          await prisma.listeningQuestion.create({
            data: {
              lessonId: lesson.id,
              questionNumber: i + 1,
              questionType: q.type,
              questionText,
              questionTextVi: q.explanation?.vi || null,
              options,
              correctAnswer: String(q.answer),
              explanation: q.explanation?.de || null,
              explanationVi: q.explanation?.vi || null,
              sortOrder: i + 1,
            },
          })
          totalQuestions++
        }

        totalLessonsUpdated++
        console.log(`  ✅ ${lessonId}: ${exercise.questions.length} questions seeded`)
      } catch (err: any) {
        console.error(`  ❌ ${file}: ${err.message?.slice(0, 100)}`)
        errors++
      }
    }
  }

  // Summary
  console.log('\n===================================')
  console.log('📊 QUESTIONS SEED SUMMARY')
  console.log('===================================')
  for (const level of LEVELS) {
    const count = await prisma.listeningQuestion.count({
      where: { lesson: { cefrLevel: level } },
    })
    console.log(`  ${level}: ${count} questions`)
  }
  const total = await prisma.listeningQuestion.count()
  console.log(`  Total: ${total} questions`)
  console.log(`  Lessons updated: ${totalLessonsUpdated}`)
  if (errors > 0) console.log(`  Errors: ${errors}`)
  console.log('\n✅ Listening Questions seed complete! 🦊')
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
