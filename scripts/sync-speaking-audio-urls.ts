/**
 * Sync Speaking lesson sentence audioUrl fields to Cloudflare R2 URLs.
 *
 * Default mode is a dry run. Add --apply to update the database.
 * The script loads .env first for R2 config, then --env-file for DB config.
 *
 * Examples:
 *   pnpm exec tsx scripts/sync-speaking-audio-urls.ts
 *   pnpm exec tsx scripts/sync-speaking-audio-urls.ts --verify-r2
 *   pnpm exec tsx scripts/sync-speaking-audio-urls.ts --apply --verify-r2
 */

import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { Client } from 'pg'

type Level = 'a1' | 'a2' | 'b1' | 'b2' | 'c1' | 'c2'

type Args = {
  apply: boolean
  envFile: string
  level?: Level
  overwrite: boolean
  verifyR2: boolean
}

type AudioCandidate = {
  level: Level
  topicSlug: string
  lessonNumber: number
  sentenceIndex: number
  localFile: string
  localExists: boolean
  r2Key: string
  publicUrl: string
  r2Exists?: boolean
}

type RawContent = {
  topicSlug: string
  cefrLevel: string
  lessons: Array<{
    lessonNumber: number
    sentences: unknown[]
  }>
}

type SyncStats = {
  contentTopics: number
  contentSentences: number
  localMissing: number
  r2Missing: number
  dbLessonsScanned: number
  dbLessonsWithInvalidJson: number
  dbSentencesScanned: number
  dbSentencesAlreadyFilled: number
  dbSentencesWouldSet: number
  dbSentencesMissingCandidate: number
  dbLessonsWouldUpdate: number
  dbLessonsUpdated: number
}

type DbLesson = {
  id: string
  level: string
  lessonNumber: number
  exercisesJson: unknown
  topicSlug: string
}

const LEVELS: Level[] = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2']
const CONTENT_ROOT = path.resolve('content')
const AUDIO_OUTPUT_DIR = path.resolve(
  '..',
  '8-Audio-Factory',
  'data',
  'output',
  'Sprechen-Nachsprechen-Phase2',
)

function parseArgs(): Args {
  const args: Args = {
    apply: false,
    envFile: '.env.production',
    overwrite: false,
    verifyR2: false,
  }

  for (const arg of process.argv.slice(2)) {
    if (arg === '--apply') args.apply = true
    else if (arg === '--overwrite') args.overwrite = true
    else if (arg === '--verify-r2') args.verifyR2 = true
    else if (arg.startsWith('--env-file=')) args.envFile = arg.slice('--env-file='.length)
    else if (arg.startsWith('--level=')) {
      const level = arg.slice('--level='.length).toLowerCase()
      if (!LEVELS.includes(level as Level)) {
        throw new Error(`Unsupported level: ${level}`)
      }
      args.level = level as Level
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }

  return args
}

function normalizeLevel(value: string): Level {
  const level = value.toLowerCase()
  if (!LEVELS.includes(level as Level)) {
    throw new Error(`Unsupported CEFR level: ${value}`)
  }
  return level as Level
}

function topicUpper(topicSlug: string): string {
  return topicSlug.split('-').slice(1).join('-').toUpperCase()
}

function padLesson(lessonNumber: number): string {
  return String(lessonNumber).padStart(2, '0')
}

function candidateId(topicSlug: string, lessonNumber: number, sentenceIndex: number): string {
  return `${topicSlug}:${lessonNumber}:${sentenceIndex}`
}

function buildR2Key(level: Level, topicSlug: string, lessonNumber: number, sentenceIndex: number): string {
  return `L-SPR-${level.toUpperCase()}-${topicUpper(topicSlug)}-${padLesson(lessonNumber)}-S${sentenceIndex}.mp3`
}

function loadAudioCandidates(args: Args, publicUrl: string): Map<string, AudioCandidate> {
  const candidates = new Map<string, AudioCandidate>()
  const levels = args.level ? [args.level] : LEVELS

  for (const level of levels) {
    const contentDir = path.join(CONTENT_ROOT, level, 'speaking')
    if (!fs.existsSync(contentDir)) continue

    for (const file of fs.readdirSync(contentDir).filter(name => name.endsWith('.json')).sort()) {
      const contentPath = path.join(contentDir, file)
      const content = JSON.parse(fs.readFileSync(contentPath, 'utf-8')) as RawContent
      const contentLevel = normalizeLevel(content.cefrLevel || level)

      for (const lesson of content.lessons || []) {
        for (let i = 0; i < (lesson.sentences || []).length; i++) {
          const sentenceIndex = i + 1
          const localFile = path.join(
            AUDIO_OUTPUT_DIR,
            content.topicSlug,
            `s${padLesson(lesson.lessonNumber)}_${sentenceIndex}.mp3`,
          )
          const r2Key = buildR2Key(contentLevel, content.topicSlug, lesson.lessonNumber, sentenceIndex)
          candidates.set(candidateId(content.topicSlug, lesson.lessonNumber, sentenceIndex), {
            level: contentLevel,
            topicSlug: content.topicSlug,
            lessonNumber: lesson.lessonNumber,
            sentenceIndex,
            localFile,
            localExists: fs.existsSync(localFile),
            r2Key,
            publicUrl: `${publicUrl}/${r2Key}`,
          })
        }
      }
    }
  }

  return candidates
}

async function verifyCandidatesOnR2(candidates: Map<string, AudioCandidate>, concurrency = 16) {
  const bucket = process.env.R2_BUCKET
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

  if (!bucket || !accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('R2_BUCKET, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY are required for --verify-r2')
  }

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  })

  const items = Array.from(candidates.values())
  let nextIndex = 0

  async function worker() {
    while (nextIndex < items.length) {
      const current = items[nextIndex++]
      try {
        const result = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: current.r2Key }))
        current.r2Exists = (result.ContentLength ?? 0) > 0
      } catch {
        current.r2Exists = false
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker))
}

function hasUsableAudio(candidate: AudioCandidate | undefined, verifyR2: boolean): candidate is AudioCandidate {
  if (!candidate) return false
  return verifyR2 ? candidate.r2Exists === true : candidate.localExists
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function maskHost(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return '(invalid public URL)'
  }
}

async function main() {
  const args = parseArgs()

  dotenv.config({ path: path.resolve('.env'), quiet: true })
  dotenv.config({ path: path.resolve(args.envFile), override: true, quiet: true })
  process.env.NODE_ENV = 'production'

  const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, '')
  if (!publicUrl) throw new Error('R2_PUBLIC_URL is required')
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required')

  const candidates = loadAudioCandidates(args, publicUrl)
  if (args.verifyR2) {
    await verifyCandidatesOnR2(candidates)
  }

  const stats: SyncStats = {
    contentTopics: new Set(Array.from(candidates.values()).map(item => item.topicSlug)).size,
    contentSentences: candidates.size,
    localMissing: Array.from(candidates.values()).filter(item => !item.localExists).length,
    r2Missing: args.verifyR2 ? Array.from(candidates.values()).filter(item => item.r2Exists !== true).length : 0,
    dbLessonsScanned: 0,
    dbLessonsWithInvalidJson: 0,
    dbSentencesScanned: 0,
    dbSentencesAlreadyFilled: 0,
    dbSentencesWouldSet: 0,
    dbSentencesMissingCandidate: 0,
    dbLessonsWouldUpdate: 0,
    dbLessonsUpdated: 0,
  }

  const topicSlugs = Array.from(new Set(Array.from(candidates.values()).map(item => item.topicSlug)))
  const db = new Client({ connectionString: process.env.DATABASE_URL })
  await db.connect()

  const queryParams: unknown[] = [topicSlugs]
  const levelFilter = args.level ? 'AND l.level = $2' : ''
  if (args.level) queryParams.push(args.level.toUpperCase())

  const lessons = (await db.query<DbLesson>(
    `
      SELECT
        l.id,
        l.level,
        l."lessonNumber",
        l."exercisesJson",
        t.slug AS "topicSlug"
      FROM speaking_lessons l
      JOIN speaking_topics t ON t.id = l."topicId"
      WHERE t.slug = ANY($1)
      ${levelFilter}
      ORDER BY l.level ASC, l.id ASC
    `,
    queryParams,
  )).rows

  stats.dbLessonsScanned = lessons.length

  const examples: Array<{ lessonId: string; from: string; to: string }> = []
  for (const lesson of lessons) {
    const nextJson = cloneJson(lesson.exercisesJson ?? {}) as { sentences?: Array<Record<string, unknown>> }
    if (!Array.isArray(nextJson.sentences)) {
      stats.dbLessonsWithInvalidJson++
      continue
    }

    let lessonChanged = false
    for (let i = 0; i < nextJson.sentences.length; i++) {
      stats.dbSentencesScanned++
      const sentence = nextJson.sentences[i]!
      const currentUrl = typeof sentence.audioUrl === 'string' ? sentence.audioUrl : ''

      if (currentUrl.trim() && !args.overwrite) {
        stats.dbSentencesAlreadyFilled++
        continue
      }

      const candidate = candidates.get(candidateId(lesson.topicSlug, lesson.lessonNumber, i + 1))
      if (!hasUsableAudio(candidate, args.verifyR2)) {
        stats.dbSentencesMissingCandidate++
        continue
      }

      if (currentUrl === candidate.publicUrl) {
        stats.dbSentencesAlreadyFilled++
        continue
      }

      if (examples.length < 5) {
        examples.push({ lessonId: lesson.id, from: currentUrl || '(empty)', to: candidate.publicUrl })
      }

      sentence.audioUrl = candidate.publicUrl
      lessonChanged = true
      stats.dbSentencesWouldSet++
    }

    if (!lessonChanged) continue
    stats.dbLessonsWouldUpdate++

    if (args.apply) {
      await db.query(
        `
          UPDATE speaking_lessons
          SET "exercisesJson" = $1::jsonb, "updatedAt" = NOW()
          WHERE id = $2
        `,
        [JSON.stringify(nextJson), lesson.id],
      )
      stats.dbLessonsUpdated++
    }
  }

  await db.end()

  console.log(JSON.stringify({
    mode: args.apply ? 'apply' : 'dry-run',
    envFile: args.envFile,
    level: args.level ?? 'all',
    overwrite: args.overwrite,
    verifyR2: args.verifyR2,
    publicHost: maskHost(publicUrl),
    audioOutputDir: AUDIO_OUTPUT_DIR,
    stats,
    examples,
  }, null, 2))

  if (!args.apply) {
    console.log('Dry run only. Re-run with --apply to write DB updates.')
  }
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
