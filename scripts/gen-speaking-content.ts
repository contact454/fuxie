/**
 * Generate A1 Nachsprechen exercise content using Gemini
 * and seed it into the speaking_topics and speaking_lessons tables.
 * 
 * Usage: npx tsx scripts/gen-speaking-content.ts
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../apps/web/.env') })

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } }
})
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// ===== A1 TOPIC DEFINITIONS =====
const A1_TOPICS = [
  { slug: 'a1-begruessung', titleDe: 'Begrüßung & Vorstellung', titleVi: 'Chào hỏi & Giới thiệu', icon: '👋' },
  { slug: 'a1-familie', titleDe: 'Familie & Freunde', titleVi: 'Gia đình & Bạn bè', icon: '👨‍👩‍👧' },
  { slug: 'a1-einkaufen', titleDe: 'Einkaufen & Zahlen', titleVi: 'Mua sắm & Số đếm', icon: '🛒' },
  { slug: 'a1-essen-trinken', titleDe: 'Essen & Trinken', titleVi: 'Ăn uống', icon: '🍽️' },
  { slug: 'a1-wohnen', titleDe: 'Wohnung & Haus', titleVi: 'Nhà ở', icon: '🏠' },
  { slug: 'a1-alltag', titleDe: 'Alltag & Tagesablauf', titleVi: 'Sinh hoạt hàng ngày', icon: '☀️' },
  { slug: 'a1-freizeit', titleDe: 'Freizeit & Hobbys', titleVi: 'Thời gian rảnh & Sở thích', icon: '⚽' },
  { slug: 'a1-wegbeschreibung', titleDe: 'Wegbeschreibung & Verkehr', titleVi: 'Chỉ đường & Giao thông', icon: '🗺️' },
  { slug: 'a1-koerper-gesundheit', titleDe: 'Körper & Gesundheit', titleVi: 'Cơ thể & Sức khỏe', icon: '🏥' },
  { slug: 'a1-wetter-jahreszeiten', titleDe: 'Wetter & Jahreszeiten', titleVi: 'Thời tiết & Mùa', icon: '🌤️' },
]

const NACHSPRECHEN_CONFIG = {
  maxRecordingSec: 10,
  minAccuracyToPass: 70,
  attemptsAllowed: 3,
  showIPA: true,
  showTranslation: true,
  autoPlayModel: true,
}

async function generateSentences(topic: typeof A1_TOPICS[0]): Promise<any[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompt = `Tạo 8 câu tiếng Đức chuẩn Goethe A1 cho chủ đề "${topic.titleDe}" (${topic.titleVi}).

YÊU CẦU:
- Câu ngắn, đơn giản, phù hợp level A1
- Dùng cấu trúc ngữ pháp A1 (Präsens, einfache Sätze)
- Từ vựng thuộc Goethe A1 Wortliste
- Sắp xếp từ dễ đến khó (3-6 từ → 6-10 từ)
- Mỗi câu phải thực tế, hữu dụng trong giao tiếp

Trả về JSON array, mỗi item:
{
  "id": "s01",
  "text_de": "Guten Morgen!",
  "text_vi": "Chào buổi sáng!",
  "ipa": "/ˈɡuːtn̩ ˈmɔʁɡn̩/",
  "expected_duration_sec": 1.5,
  "pronunciation_notes": "Chú ý: 'R' trong 'Morgen' phát âm cuống họng /ʁ/"
}

Chỉ trả JSON array thuần, không markdown, không giải thích.`

  const result = await model.generateContent(prompt)
  let text = result.response.text().trim()
  
  // Clean markdown fences if present
  text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  try {
    return JSON.parse(text)
  } catch (e) {
    console.error(`  ❌ JSON parse failed for ${topic.slug}:`, text.substring(0, 100))
    return []
  }
}

async function main() {
  console.log('🎤 Generating A1 Nachsprechen Content')
  console.log('=' .repeat(50))

  let totalSentences = 0
  let topicsCreated = 0

  for (let i = 0; i < A1_TOPICS.length; i++) {
    const topic = A1_TOPICS[i]
    console.log(`\n[${i + 1}/${A1_TOPICS.length}] ${topic.titleDe}...`)

    // 1. Generate sentences
    const sentences = await generateSentences(topic)
    if (sentences.length === 0) {
      console.log('  ⚠️ No sentences generated, skipping')
      continue
    }
    console.log(`  ✅ ${sentences.length} sentences generated`)

    // 2. Upsert topic
    const dbTopic = await prisma.speakingTopic.upsert({
      where: { slug: topic.slug },
      update: {
        titleDe: topic.titleDe,
        titleVi: topic.titleVi,
        status: 'PUBLISHED',
        updatedAt: new Date(),
      },
      create: {
        slug: topic.slug,
        titleDe: topic.titleDe,
        titleVi: topic.titleVi,
        cefrLevel: 'A1',
        sortOrder: i + 1,
        status: 'PUBLISHED',
      },
    })
    topicsCreated++

    // 3. Create lesson with exercises
    const lessonId = `${topic.slug}-01-nachsprechen`
    const formattedSentences = sentences.map((s: any, idx: number) => ({
      id: s.id || `s${String(idx + 1).padStart(2, '0')}`,
      textDe: s.text_de,
      textVi: s.text_vi,
      ipa: s.ipa,
      audioUrl: `/audio/speaking/a1/${topic.slug}/${s.id || `s${String(idx + 1).padStart(2, '0')}`}.mp3`,
      expectedDurationSec: s.expected_duration_sec || 3,
      pronunciationNotes: s.pronunciation_notes || null,
    }))

    await prisma.speakingLesson.upsert({
      where: { id: lessonId },
      update: {
        exercisesJson: { sentences: formattedSentences },
        updatedAt: new Date(),
      },
      create: {
        id: lessonId,
        topicId: dbTopic.id,
        level: 'A1',
        lessonType: 'E',
        lessonNumber: 1,
        titleDe: `Nachsprechen: ${topic.titleDe}`,
        titleVi: `Lặp lại: ${topic.titleVi}`,
        exerciseType: 'nachsprechen',
        exercisesJson: { sentences: formattedSentences },
        configJson: NACHSPRECHEN_CONFIG,
        estimatedMin: 5,
        sortOrder: 1,
        status: 'PUBLISHED',
      },
    })

    totalSentences += sentences.length
    console.log(`  ✅ Lesson seeded: ${lessonId}`)

    // Respect API rate limits
    await new Promise(r => setTimeout(r, 1000))
  }

  console.log('\n' + '=' .repeat(50))
  console.log(`🎉 DONE!`)
  console.log(`   Topics: ${topicsCreated}`)
  console.log(`   Sentences: ${totalSentences}`)
  console.log(`   Audio files needed: ${totalSentences}`)

  await prisma.$disconnect()
}

main().catch(console.error)
