/**
 * Seed A1 Speaking (Nachsprechen) Content Phase 2
 * 
 * Reads all 10 topic JSONs from content/a1/speaking/
 * and upserts SpeakingLesson records into the database with 6 sentences each.
 * 
 * Usage: npx tsx scripts/seed-speaking.ts
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '../apps/web/.env') })

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } }
})

const CONTENT_BASE_DIR = path.resolve(__dirname, '../content')
const LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2']

const NACHSPRECHEN_CONFIG = {
  maxRecordingSec: 10,
  minAccuracyToPass: 70,
  attemptsAllowed: 3,
  showIPA: true,
  showTranslation: true,
  autoPlayModel: true,
}

async function main() {
  console.log('🎤 Seeding Speaking Phase 2 Content for All Levels')
  console.log('=' .repeat(50))

  let topicsCreated = 0
  let totalLessons = 0
  let totalSentences = 0

  for (const level of LEVELS) {
    const contentDir = path.join(CONTENT_BASE_DIR, level, 'speaking')
    if (!fs.existsSync(contentDir)) {
      console.warn(`⚠️ Skipped: Content dir not found: ${contentDir}`)
      continue
    }

    const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.json')).sort()
    console.log(`\n📌 Found ${files.length} topics in ${level.toUpperCase()}`)

    for (let i = 0; i < files.length; i++) {
      const filePath = path.join(contentDir, files[i])
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

    console.log(`\n[${i + 1}/${files.length}] Upserting topic: ${data.titleDe}...`)

    // 1. Upsert Topic
    const dbTopic = await prisma.speakingTopic.upsert({
      where: { slug: data.topicSlug },
      update: {
        titleDe: data.titleDe,
        titleVi: data.titleVi,
        status: 'PUBLISHED',
        updatedAt: new Date(),
      },
      create: {
        slug: data.topicSlug,
        titleDe: data.titleDe,
        titleVi: data.titleVi,
        cefrLevel: data.cefrLevel || 'A1',
        sortOrder: i + 1,
        status: 'PUBLISHED',
      },
    })
    topicsCreated++

    // 2. Upsert Lessons
    const lessons = data.lessons || []
    for (const lesson of lessons) {
      const lessonId = lesson.lessonId
      
      await prisma.speakingLesson.upsert({
        where: { id: lessonId },
        update: {
          titleDe: lesson.titleDe,
          titleVi: lesson.titleVi,
          exercisesJson: { sentences: lesson.sentences },
          updatedAt: new Date(),
        },
        create: {
          id: lessonId,
          topicId: dbTopic.id,
          level: data.cefrLevel || 'A1',
          lessonType: 'E',
          lessonNumber: lesson.lessonNumber,
          titleDe: lesson.titleDe,
          titleVi: lesson.titleVi,
          exerciseType: 'nachsprechen',
          exercisesJson: { sentences: lesson.sentences },
          configJson: NACHSPRECHEN_CONFIG,
          estimatedMin: 5,
          sortOrder: lesson.lessonNumber,
          status: 'PUBLISHED',
        },
      })

      totalLessons++
      totalSentences += lesson.sentences.length
      console.log(`  ✅ Lesson seeded: ${lessonId} (${lesson.sentences.length} sentences)`)
      }
    }
  }

  console.log('\n' + '=' .repeat(50))
  console.log(`🎉 DONE SEEDING!`)
  console.log(`   Topics: ${topicsCreated}`)
  console.log(`   Lessons: ${totalLessons}`)
  console.log(`   Total Sentences DB Linked: ${totalSentences}`)

  await prisma.$disconnect()
}

main().catch(console.error)
