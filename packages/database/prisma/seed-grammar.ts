/**
 * seed-grammar.ts
 * 
 * Seeds the database with grammar topics and lessons from the Grammatik-Factory.
 * Reads production/{A1..C2}/index.json + individual lesson JSONs.
 * 
 * Usage:
 *   npx tsx prisma/seed-grammar.ts
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const prisma = new PrismaClient()

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Path to the Grammatik-Factory production directory
const FACTORY_DIR = path.resolve(__dirname, '../../../../Grammatik-Factory/production')

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const

interface IndexTopic {
  topic_id: string
  title_de: string
  title_vi: string
  order: number
  lessons: string[]
  status: string
}

interface IndexFile {
  level: string
  total_topics: number
  total_lessons: number
  topics: IndexTopic[]
}

interface LessonFile {
  id: string
  level: string
  topic_id: string
  lesson_type: string  // E | V | A
  lesson_number: number
  title_de: string
  title_vi: string
  estimated_minutes: number
  tags: string[]
  theory: any         // null for A-lessons
  exercises: any[]
  metadata: any
}

async function main() {
  console.log('🏭 Grammatik Factory → Fuxie seed starting...\n')

  let totalTopics = 0
  let totalLessons = 0

  for (const level of LEVELS) {
    const levelDir = path.join(FACTORY_DIR, level)
    const indexPath = path.join(levelDir, 'index.json')

    if (!fs.existsSync(indexPath)) {
      console.warn(`⚠️  No index.json found for ${level}, skipping`)
      continue
    }

    const indexData: IndexFile = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))
    console.log(`📂 ${level}: ${indexData.total_topics} topics, ${indexData.total_lessons} lessons`)

    // Upsert topics
    for (const topic of indexData.topics) {
      const topicSlug = `${level.toLowerCase()}-${topic.topic_id}`
      
      await prisma.grammarTopic.upsert({
        where: { slug: topicSlug },
        update: {
          title: topic.title_de,
          titleDe: topic.title_de,
          titleVi: topic.title_vi,
          cefrLevel: level as any,
          sortOrder: topic.order,
          status: 'PUBLISHED',
        },
        create: {
          slug: topicSlug,
          title: topic.title_de,
          titleDe: topic.title_de,
          titleVi: topic.title_vi,
          cefrLevel: level as any,
          sortOrder: topic.order,
          status: 'PUBLISHED',
        },
      })
      totalTopics++

      // Find the GrammarTopic we just upserted to get its ID
      const dbTopic = await prisma.grammarTopic.findUnique({
        where: { slug: topicSlug },
        select: { id: true },
      })

      if (!dbTopic) {
        console.error(`❌ Could not find topic ${topicSlug} after upsert`)
        continue
      }

      // Read and insert each lesson for this topic
      for (const lessonId of topic.lessons) {
        // Find the lesson file — try common patterns
        const lessonFileName = `${lessonId}.json`
        const lessonPath = path.join(levelDir, lessonFileName)

        if (!fs.existsSync(lessonPath)) {
          console.warn(`  ⚠️  Lesson file not found: ${lessonFileName}`)
          continue
        }

        const lesson: LessonFile = JSON.parse(fs.readFileSync(lessonPath, 'utf-8'))

        // Determine sort order from lesson type
        const typeSortMap: Record<string, number> = { E: 1, V: 2, A: 3 }
        const sortOrder = (topic.order * 10) + (typeSortMap[lesson.lesson_type] ?? 0)

        await prisma.grammarLesson.upsert({
          where: { id: lesson.id },
          update: {
            topicId: dbTopic.id,
            level: level as any,
            lessonType: lesson.lesson_type,
            lessonNumber: lesson.lesson_number,
            titleDe: lesson.title_de,
            titleVi: lesson.title_vi,
            estimatedMin: lesson.estimated_minutes ?? 8,
            tags: lesson.tags ?? [],
            theoryJson: lesson.theory ?? undefined,
            exercisesJson: lesson.exercises,
            metadataJson: lesson.metadata ?? undefined,
            sortOrder,
            status: 'PUBLISHED',
          },
          create: {
            id: lesson.id,
            topicId: dbTopic.id,
            level: level as any,
            lessonType: lesson.lesson_type,
            lessonNumber: lesson.lesson_number,
            titleDe: lesson.title_de,
            titleVi: lesson.title_vi,
            estimatedMin: lesson.estimated_minutes ?? 8,
            tags: lesson.tags ?? [],
            theoryJson: lesson.theory ?? undefined,
            exercisesJson: lesson.exercises,
            metadataJson: lesson.metadata ?? undefined,
            sortOrder,
            status: 'PUBLISHED',
          },
        })
        totalLessons++
      }
    }
  }

  console.log(`\n✅ Seed complete!`)
  console.log(`   Topics: ${totalTopics}`)
  console.log(`   Lessons: ${totalLessons}`)

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error('❌ Seed failed:', e)
  prisma.$disconnect()
  process.exit(1)
})
