/**
 * seed-reading-writing.ts
 * 
 * Seeds the production database with Reading exercises + Questions
 * and Writing exercises from the content/ directory.
 * 
 * Usage:
 *   DATABASE_URL="..." npx tsx prisma/seed-reading-writing.ts
 */

import { PrismaClient, CefrLevel } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const prisma = new PrismaClient()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const CONTENT_DIR = path.resolve(__dirname, '../../../content')

interface ReadingJson {
  id: string
  level: string
  teil: number
  teil_name: string
  topic: string
  topic_id: string
  metadata: any
  texts: any[]
  images: any[]
  questions: {
    id: string
    teil: number
    linked_text: string
    type: string
    statement: string
    answer: string
    points: number
    explanation: any
    options?: any
  }[]
  scoring: any
  qa?: any
}

interface WritingJson {
  id: string
  cefrLevel: string
  teil: number
  teilName: string
  textType: string
  register: string
  topic: string
  instruction: string
  instructionVi?: string
  situation: string
  contentPoints: any[]
  minWords: number
  maxWords?: number
  timeMinutes: number
  rubric: any
  maxScore: number
  formFields?: any[]
  sampleResponse?: string
  sourceText?: string
  sourceTextType?: string
  grafikUrl?: string
  grafikDesc?: string
  imageUrl?: string
}

async function seedReading() {
  let totalExercises = 0
  let totalQuestions = 0
  let errors = 0

  for (const level of LEVELS) {
    const readingDir = path.join(CONTENT_DIR, level.toLowerCase(), 'reading')
    if (!fs.existsSync(readingDir)) continue

    const files = fs.readdirSync(readingDir)
      .filter(f => f.endsWith('.json') && !f.includes('.qa.'))
      .sort()

    console.log(`  📖 ${level}: ${files.length} reading exercises`)

    for (let i = 0; i < files.length; i++) {
      try {
      const filePath = path.join(readingDir, files[i])
      const data: ReadingJson = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

      // Upsert ReadingExercise
      const exercise = await prisma.readingExercise.upsert({
        where: { exerciseId: data.id },
        update: {
          cefrLevel: level as CefrLevel,
          teil: data.teil,
          teilName: data.teil_name,
          topic: data.topic,
          textsJson: data.texts ?? [],
          imagesJson: data.images ?? null,
          scoringJson: data.scoring ?? null,
          metadataJson: data.metadata ?? null,
          sortOrder: i + 1,
        },
        create: {
          exerciseId: data.id,
          cefrLevel: level as CefrLevel,
          teil: data.teil,
          teilName: data.teil_name,
          topic: data.topic,
          textsJson: data.texts ?? [],
          imagesJson: data.images ?? null,
          scoringJson: data.scoring ?? null,
          metadataJson: data.metadata ?? null,
          sortOrder: i + 1,
        },
      })
      totalExercises++

      // Upsert ReadingQuestions
      if (data.questions && data.questions.length > 0) {
        for (let q = 0; q < data.questions.length; q++) {
          const question = data.questions[q]
          await prisma.readingQuestion.upsert({
            where: {
              exerciseId_questionNumber: {
                exerciseId: exercise.id,
                questionNumber: q + 1,
              },
            },
            update: {
              questionType: question.type,
              linkedText: question.linked_text ?? null,
              statement: question.statement || (question as any).situation || '',
              options: question.options ?? null,
              correctAnswer: String(question.answer ?? ''),
              points: question.points ?? 1,
              explanation: question.explanation ?? null,
              sortOrder: q + 1,
            },
            create: {
              exerciseId: exercise.id,
              questionNumber: q + 1,
              questionType: question.type,
              linkedText: question.linked_text ?? null,
              statement: question.statement || (question as any).situation || '',
              options: question.options ?? null,
              correctAnswer: String(question.answer ?? ''),
              points: question.points ?? 1,
              explanation: question.explanation ?? null,
              sortOrder: q + 1,
            },
          })
          totalQuestions++
        }
      }
      } catch (err: any) {
        console.error(`  ⚠️  Error processing ${files[i]}: ${err.message?.slice(0, 100)}`)
        errors++
      }
    }
  }

  return { exercises: totalExercises, questions: totalQuestions, errors }
}

async function seedWriting() {
  let totalExercises = 0
  let errors = 0

  for (const level of LEVELS) {
    const writingDir = path.join(CONTENT_DIR, level.toLowerCase(), 'writing')
    if (!fs.existsSync(writingDir)) continue

    const files = fs.readdirSync(writingDir)
      .filter(f => f.endsWith('.json'))
      .sort()

    console.log(`  ✍️  ${level}: ${files.length} writing exercises`)

    for (let i = 0; i < files.length; i++) {
      try {
      const filePath = path.join(writingDir, files[i])
      const data: WritingJson = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

      await prisma.writingExercise.upsert({
        where: { exerciseId: data.id },
        update: {
          cefrLevel: level as CefrLevel,
          teil: data.teil,
          teilName: data.teilName,
          textType: data.textType,
          register: data.register,
          topic: data.topic,
          instruction: data.instruction,
          instructionVi: data.instructionVi ?? null,
          situation: data.situation,
          contentPoints: data.contentPoints,
          sampleResponse: data.sampleResponse ?? null,
          formFields: data.formFields ?? null,
          sourceText: data.sourceText ?? null,
          sourceTextType: data.sourceTextType ?? null,
          grafikUrl: data.grafikUrl ?? null,
          grafikDesc: data.grafikDesc ?? null,
          minWords: data.minWords,
          maxWords: data.maxWords ?? null,
          timeMinutes: data.timeMinutes,
          rubricJson: data.rubric,
          maxScore: data.maxScore,
          sortOrder: i + 1,
          status: 'PUBLISHED',
        },
        create: {
          exerciseId: data.id,
          cefrLevel: level as CefrLevel,
          teil: data.teil,
          teilName: data.teilName,
          textType: data.textType,
          register: data.register,
          topic: data.topic,
          instruction: data.instruction,
          instructionVi: data.instructionVi ?? null,
          situation: data.situation,
          contentPoints: data.contentPoints,
          sampleResponse: data.sampleResponse ?? null,
          formFields: data.formFields ?? null,
          sourceText: data.sourceText ?? null,
          sourceTextType: data.sourceTextType ?? null,
          grafikUrl: data.grafikUrl ?? null,
          grafikDesc: data.grafikDesc ?? null,
          minWords: data.minWords,
          maxWords: data.maxWords ?? null,
          timeMinutes: data.timeMinutes,
          rubricJson: data.rubric,
          maxScore: data.maxScore,
          sortOrder: i + 1,
          status: 'PUBLISHED',
        },
      })
      totalExercises++
      } catch (err: any) {
        console.error(`  ⚠️  Error processing ${files[i]}: ${err.message?.slice(0, 100)}`)
        errors++
      }
    }
  }

  return { exercises: totalExercises, errors }
}

async function main() {
  console.log('🦊 Fuxie Reading + Writing Seed')
  console.log('================================\n')

  console.log('📖 Phase 1: Reading Exercises + Questions')
  console.log('------------------------------------------')
  const reading = await seedReading()
  console.log(`\n  Reading Exercises: ${reading.exercises}`)
  console.log(`  Reading Questions: ${reading.questions}`)

  console.log('\n✍️  Phase 2: Writing Exercises')
  console.log('------------------------------')
  const writing = await seedWriting()
  console.log(`\n  Writing Exercises: ${writing.exercises}`)

  // Summary counts
  console.log('\n================================')
  console.log('📊 SEED SUMMARY')
  console.log('================================')
  
  for (const level of LEVELS) {
    const readCount = await prisma.readingExercise.count({ where: { cefrLevel: level } })
    const writeCount = await prisma.writingExercise.count({ where: { cefrLevel: level } })
    if (readCount > 0 || writeCount > 0) {
      console.log(`  ${level}: ${readCount} reading, ${writeCount} writing`)
    }
  }
  
  const totalQuestions = await prisma.readingQuestion.count()
  console.log(`  Total Questions: ${totalQuestions}`)

  console.log('\n✅ Reading + Writing seed complete! 🦊')
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
