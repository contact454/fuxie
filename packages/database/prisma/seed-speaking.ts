/**
 * seed-speaking.ts
 * 
 * Seeds SpeakingTopic + SpeakingLesson from rich content JSON files
 * for ALL CEFR levels (A1–C1).
 *
 * Handles field name differences between A1 format and A2–C1 format:
 *   A1:      textDe, textVi, pronunciationNotes, expectedDurationSec
 *   A2–C1:   german, vietnamese, pronunciationTips, (no duration)
 *
 * Usage:
 *   DATABASE_URL="..." npx tsx prisma/seed-speaking.ts
 */

import { PrismaClient, Prisma } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const prisma = new PrismaClient()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const CONTENT_ROOT = path.resolve(__dirname, '../../../content')
const LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'] as const

// ─── Icon lookup by topic keyword ───────────────────────────────────────────
const ICON_MAP: Record<string, string> = {
  'alltag': '🌅',
  'begruessung': '👋',
  'einkaufen': '🛒',
  'essen': '🍽️',
  'trinken': '🍽️',
  'familie': '👨‍👩‍👧',
  'freizeit': '⚽',
  'koerper': '💪',
  'gesundheit': '💊',
  'wegbeschreibung': '🗺️',
  'wetter': '🌤️',
  'jahreszeiten': '🌤️',
  'wohnen': '🏠',
  'arbeit': '💼',
  'lernen': '📚',
  'reisen': '✈️',
  'umwelt': '🌍',
  'medien': '📱',
  'kultur': '🎭',
  'wissenschaft': '🔬',
  'philosophie': '🤔',
  'politik': '🏛️',
  'wirtschaft': '📈',
  'kunst': '🎨',
  'sprache': '💬',
  'technologie': '🚀',
  'gesellschaft': '🤝',
}

function getIcon(slug: string): string {
  // e.g. "a2-essen" → check "essen"
  const parts = slug.split('-').slice(1) // remove level prefix
  for (const part of parts) {
    if (ICON_MAP[part]) return ICON_MAP[part]
  }
  return '🎤'
}

// ─── Types ──────────────────────────────────────────────────────────────────

/** Unified sentence after normalization */
interface NormalizedSentence {
  id: string
  textDe: string
  textVi: string
  ipa: string
  audioUrl: string
  expectedDurationSec: number
  pronunciationNotes: string
}

/** Raw content file (union of A1 and A2+ formats) */
interface RawContentFile {
  topicSlug: string
  cefrLevel: string
  titleDe: string
  titleVi: string
  lessons: Array<{
    lessonId: string
    topicSlug?: string
    lessonNumber: number
    titleDe: string
    titleVi: string
    originalSentence?: string
    sentences: Array<{
      id: string
      // A1 format
      textDe?: string
      textVi?: string
      pronunciationNotes?: string
      expectedDurationSec?: number
      // A2+ format
      german?: string
      vietnamese?: string
      pronunciationTips?: string
      // Common
      ipa: string
      audioUrl: string
    }>
  }>
}

// ─── Normalization ──────────────────────────────────────────────────────────

function normalizeSentence(raw: RawContentFile['lessons'][0]['sentences'][0]): NormalizedSentence {
  const textDe = raw.textDe || raw.german || ''
  const textVi = raw.textVi || raw.vietnamese || ''
  const pronunciationNotes = raw.pronunciationNotes || raw.pronunciationTips || ''
  const expectedDurationSec = raw.expectedDurationSec || Math.max(2, Math.ceil(textDe.split(' ').length * 0.6))

  return {
    id: raw.id,
    textDe,
    textVi,
    ipa: raw.ipa,
    audioUrl: raw.audioUrl,
    expectedDurationSec,
    pronunciationNotes,
  }
}

/** Ensure lessonId ends with "-nachsprechen" for consistency */
function normalizeLessonId(lessonId: string): string {
  if (lessonId.endsWith('-nachsprechen')) return lessonId
  return `${lessonId}-nachsprechen`
}

// ─── Level-specific config ──────────────────────────────────────────────────

function getConfigForLevel(level: string) {
  const base = {
    showIPA: true,
    showTranslation: true,
    autoPlayModel: true,
  }

  switch (level.toUpperCase()) {
    case 'A1':
      return { ...base, maxRecordingSec: 10, minAccuracyToPass: 60, attemptsAllowed: 3 }
    case 'A2':
      return { ...base, maxRecordingSec: 12, minAccuracyToPass: 55, attemptsAllowed: 3 }
    case 'B1':
      return { ...base, maxRecordingSec: 15, minAccuracyToPass: 50, attemptsAllowed: 3 }
    case 'B2':
      return { ...base, maxRecordingSec: 20, minAccuracyToPass: 45, attemptsAllowed: 4 }
    case 'C1':
      return { ...base, maxRecordingSec: 25, minAccuracyToPass: 40, attemptsAllowed: 4 }
    case 'C2':
      return { ...base, maxRecordingSec: 30, minAccuracyToPass: 35, attemptsAllowed: 5 }
    default:
      return { ...base, maxRecordingSec: 15, minAccuracyToPass: 50, attemptsAllowed: 3 }
  }
}

// ─── CefrLevel enum mapping ─────────────────────────────────────────────────

function toCefrEnum(level: string): 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' {
  const upper = level.toUpperCase()
  if (['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(upper)) {
    return upper as 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  }
  return 'A1'
}

// ─── Main seed ──────────────────────────────────────────────────────────────

async function main() {
  console.log('🎤 Fuxie Speaking Seed — All Levels')
  console.log('====================================\n')

  let globalTopicOrder = 0
  let totalTopics = 0
  let totalLessons = 0
  let totalSentences = 0

  for (const level of LEVELS) {
    const contentDir = path.join(CONTENT_ROOT, level, 'speaking')
    if (!fs.existsSync(contentDir)) {
      console.log(`⏭️  ${level.toUpperCase()}: No content directory, skipping`)
      continue
    }

    const contentFiles = fs.readdirSync(contentDir).filter(f => f.endsWith('.json')).sort()
    if (contentFiles.length === 0) {
      console.log(`⏭️  ${level.toUpperCase()}: No JSON files, skipping`)
      continue
    }

    const cefrLevel = toCefrEnum(level)
    const config = getConfigForLevel(level)
    let levelTopics = 0
    let levelLessons = 0
    let levelSentences = 0

    console.log(`📂 ${cefrLevel}: ${contentFiles.length} topic files`)

    for (const file of contentFiles) {
      const filePath = path.join(contentDir, file)
      const data: RawContentFile = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

      globalTopicOrder++
      const icon = getIcon(data.topicSlug)

      // Upsert topic
      const topic = await prisma.speakingTopic.upsert({
        where: { slug: data.topicSlug },
        update: {
          titleDe: data.titleDe,
          titleVi: data.titleVi,
          description: icon,
          cefrLevel,
          sortOrder: globalTopicOrder,
          status: 'PUBLISHED',
        },
        create: {
          slug: data.topicSlug,
          titleDe: data.titleDe,
          titleVi: data.titleVi,
          description: icon,
          cefrLevel,
          sortOrder: globalTopicOrder,
          status: 'PUBLISHED',
        },
      })
      levelTopics++

      // Upsert lessons
      for (let i = 0; i < data.lessons.length; i++) {
        const lesson = data.lessons[i]!
        const lessonId = normalizeLessonId(lesson.lessonId)
        const sentences = lesson.sentences.map(normalizeSentence)
        const exercisesData = { sentences } as unknown as Prisma.InputJsonValue
        const configData = config as unknown as Prisma.InputJsonValue

        await prisma.speakingLesson.upsert({
          where: { id: lessonId },
          update: {
            topicId: topic.id,
            level: cefrLevel,
            lessonType: 'E',
            lessonNumber: lesson.lessonNumber,
            titleDe: lesson.titleDe,
            titleVi: lesson.titleVi,
            exerciseType: 'nachsprechen',
            exercisesJson: exercisesData,
            configJson: configData,
            estimatedMin: Math.max(3, Math.ceil(sentences.length * 0.5)),
            sortOrder: i + 1,
            status: 'PUBLISHED',
          },
          create: {
            id: lessonId,
            topicId: topic.id,
            level: cefrLevel,
            lessonType: 'E',
            lessonNumber: lesson.lessonNumber,
            titleDe: lesson.titleDe,
            titleVi: lesson.titleVi,
            exerciseType: 'nachsprechen',
            exercisesJson: exercisesData,
            configJson: configData,
            estimatedMin: Math.max(3, Math.ceil(sentences.length * 0.5)),
            sortOrder: i + 1,
            status: 'PUBLISHED',
          },
        })
        levelLessons++
        levelSentences += sentences.length
      }

      console.log(`  🎤 ${data.topicSlug}: ${data.lessons.length} lessons`)
    }

    console.log(`  ── ${cefrLevel} total: ${levelTopics} topics, ${levelLessons} lessons, ${levelSentences} sentences\n`)
    totalTopics += levelTopics
    totalLessons += levelLessons
    totalSentences += levelSentences
  }

  console.log('====================================')
  console.log(`📊 Grand total:`)
  console.log(`   Topics:    ${totalTopics}`)
  console.log(`   Lessons:   ${totalLessons}`)
  console.log(`   Sentences: ${totalSentences}`)
  console.log('\n✅ Speaking seed complete! 🦊')
}

main()
  .catch(e => { console.error('❌ Seed failed:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
