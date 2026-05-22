import { config } from 'dotenv'
import path from 'node:path'
import { PrismaClient } from '../apps/web/generated/prisma'

config({ path: path.resolve(process.cwd(), '.env'), override: true })

type FixtureStatus = 'PASS' | 'FAIL'

type FixtureCheck = {
    skill: string
    status: FixtureStatus
    path?: string
    detail: string
}

type TableRow = { exists: boolean }
type MigrationRow = { migration_name: string }

const args = new Set(process.argv.slice(2))
const jsonOutput = args.has('--json')
const allowRemote = args.has('--allow-remote')

const prisma = new PrismaClient()

async function main() {
    const databaseUrl = process.env.DATABASE_URL
    assertSafeDatabaseUrl(databaseUrl)

    const [analyticsReady, latestMigrations, fixtures] = await Promise.all([
        hasTable('analytics_events'),
        latestAppliedMigrations(),
        collectFixtures(),
    ])

    const checks: FixtureCheck[] = [
        {
            skill: 'database',
            status: analyticsReady ? 'PASS' : 'FAIL',
            detail: analyticsReady
                ? 'analytics_events table is present.'
                : 'analytics_events table is missing; run migrations from the repo root before pilot smoke.',
        },
        ...fixtures,
    ]

    const failed = checks.filter((check) => check.status === 'FAIL')
    const payload = {
        database: redactDatabaseUrl(databaseUrl!),
        latestMigrations,
        checks,
        smokePaths: checks
            .filter((check) => check.path)
            .map((check) => ({ skill: check.skill, path: check.path })),
    }

    if (jsonOutput) {
        console.log(JSON.stringify(payload, null, 2))
    } else {
        console.log(`[gamification-fixtures] database=${payload.database}`)
        if (latestMigrations.length > 0) {
            console.log(`[gamification-fixtures] migrations=${latestMigrations.join(', ')}`)
        }
        for (const check of checks) {
            const suffix = check.path ? ` -> ${check.path}` : ''
            console.log(`[gamification-fixtures] ${check.status} ${check.skill}: ${check.detail}${suffix}`)
        }
    }

    if (failed.length > 0) {
        process.exitCode = 1
    }
}

function assertSafeDatabaseUrl(databaseUrl: string | undefined) {
    if (!databaseUrl) {
        throw new Error('DATABASE_URL is required. Run this script from the repo root so .env is loaded.')
    }

    const lowerUrl = databaseUrl.toLowerCase()
    const looksRemote = lowerUrl.includes('.neon.tech')
        || lowerUrl.includes('fuxie_prod')
        || lowerUrl.includes('sslmode=require')

    if (looksRemote && !allowRemote) {
        throw new Error('Refusing to run pilot fixture checks against a remote/prod-looking DATABASE_URL. Pass --allow-remote only for an intentional read-only ops check.')
    }
}

async function hasTable(tableName: string) {
    const rows = await prisma.$queryRaw<TableRow[]>`
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = ${tableName}
        ) AS "exists"
    `
    return rows[0]?.exists === true
}

async function latestAppliedMigrations() {
    const hasMigrationsTable = await hasTable('_prisma_migrations')
    if (!hasMigrationsTable) return []

    const rows = await prisma.$queryRaw<MigrationRow[]>`
        SELECT migration_name
        FROM _prisma_migrations
        WHERE finished_at IS NOT NULL
        ORDER BY finished_at DESC
        LIMIT 3
    `
    return rows.map((row) => row.migration_name)
}

async function collectFixtures(): Promise<FixtureCheck[]> {
    const [
        vocabulary,
        listening,
        reading,
        grammar,
        writing,
        speaking,
    ] = await Promise.all([
        findVocabularyFixture(),
        findListeningFixture(),
        findReadingFixture(),
        findGrammarFixture(),
        findWritingFixture(),
        findSpeakingFixture(),
    ])

    return [vocabulary, listening, reading, grammar, writing, speaking]
}

async function findVocabularyFixture(): Promise<FixtureCheck> {
    const preferred = await prisma.vocabularyTheme.findFirst({
        where: {
            slug: 'a1-person',
            cefrLevel: 'A1',
            items: { some: { status: 'PUBLISHED' } },
        },
        select: {
            slug: true,
            cefrLevel: true,
            _count: { select: { items: true } },
        },
    })
    const fallback = preferred ?? await prisma.vocabularyTheme.findFirst({
        where: {
            cefrLevel: 'A1',
            items: { some: { status: 'PUBLISHED' } },
        },
        orderBy: { sortOrder: 'asc' },
        select: {
            slug: true,
            cefrLevel: true,
            _count: { select: { items: true } },
        },
    })

    if (!fallback) {
        return fail('vocabulary', 'No A1 vocabulary theme with published words.')
    }

    return pass(
        'vocabulary',
        `/vocabulary/practice/mixed?theme=${fallback.slug}&level=${fallback.cefrLevel}`,
        `${fallback.slug} has ${fallback._count.items} words.`,
    )
}

async function findListeningFixture(): Promise<FixtureCheck> {
    const lesson = await prisma.listeningLesson.findFirst({
        where: {
            cefrLevel: 'A1',
            questions: { some: {} },
        },
        orderBy: { sortOrder: 'asc' },
        select: {
            lessonId: true,
            cefrLevel: true,
            _count: { select: { questions: true } },
        },
    })

    if (!lesson) {
        return fail('listening', 'No A1 listening lesson with questions.')
    }

    return pass('listening', `/listening/${lesson.lessonId}`, `${lesson.lessonId} has ${lesson._count.questions} questions.`)
}

async function findReadingFixture(): Promise<FixtureCheck> {
    const exercise = await prisma.readingExercise.findFirst({
        where: {
            cefrLevel: 'A1',
            questions: { some: {} },
        },
        orderBy: { sortOrder: 'asc' },
        select: {
            exerciseId: true,
            cefrLevel: true,
            _count: { select: { questions: true } },
        },
    })

    if (!exercise) {
        return fail('reading', 'No A1 reading exercise with questions.')
    }

    return pass('reading', `/reading/${exercise.exerciseId}`, `${exercise.exerciseId} has ${exercise._count.questions} questions.`)
}

async function findGrammarFixture(): Promise<FixtureCheck> {
    const lessons = await prisma.grammarLesson.findMany({
        where: {
            level: 'A1',
            status: 'PUBLISHED',
            topic: { status: 'PUBLISHED' },
        },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        select: {
            id: true,
            exercisesJson: true,
            topic: { select: { slug: true } },
        },
        take: 30,
    })
    const lesson = lessons.find((item) => Array.isArray(item.exercisesJson) && item.exercisesJson.length > 0)

    if (!lesson) {
        return fail('grammar', 'No published A1 grammar lesson with exercises.')
    }

    const exerciseCount = Array.isArray(lesson.exercisesJson) ? lesson.exercisesJson.length : 0
    return pass('grammar', `/grammar/${lesson.topic.slug}/${lesson.id}`, `${lesson.id} has ${exerciseCount} exercises.`)
}

async function findWritingFixture(): Promise<FixtureCheck> {
    const exercise = await prisma.writingExercise.findFirst({
        where: {
            cefrLevel: 'A1',
            status: 'PUBLISHED',
        },
        orderBy: { sortOrder: 'asc' },
        select: {
            exerciseId: true,
            minWords: true,
        },
    })

    if (!exercise) {
        return fail('writing', 'No published A1 writing exercise.')
    }

    return pass('writing', `/writing/${exercise.exerciseId}`, `${exercise.exerciseId} requires at least ${exercise.minWords} words.`)
}

async function findSpeakingFixture(): Promise<FixtureCheck> {
    const lessons = await prisma.speakingLesson.findMany({
        where: {
            level: 'A1',
            exerciseType: 'nachsprechen',
            status: 'PUBLISHED',
            topic: { status: 'PUBLISHED' },
        },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        select: {
            id: true,
            exercisesJson: true,
        },
        take: 30,
    })
    const lesson = lessons.find((item) => {
        const value = item.exercisesJson as { sentences?: unknown[] } | null
        return Array.isArray(value?.sentences) && value.sentences.length > 0
    })

    if (!lesson) {
        return fail('speaking', 'No published A1 nachsprechen lesson with sentences.')
    }

    const value = lesson.exercisesJson as { sentences?: unknown[] } | null
    return pass('speaking', `/speaking/${lesson.id}`, `${lesson.id} has ${value?.sentences?.length ?? 0} sentences.`)
}

function pass(skill: string, path: string, detail: string): FixtureCheck {
    return { skill, status: 'PASS', path, detail }
}

function fail(skill: string, detail: string): FixtureCheck {
    return { skill, status: 'FAIL', detail }
}

function redactDatabaseUrl(databaseUrl: string) {
    try {
        const url = new URL(databaseUrl)
        const databaseName = url.pathname.replace(/^\/+/, '')
        return `${url.protocol}//${url.hostname}:${url.port || 'default'}/${databaseName}`
    } catch {
        return 'unparseable-database-url'
    }
}

main()
    .catch((error) => {
        console.error('[gamification-fixtures] Failed:', error instanceof Error ? error.message : String(error))
        process.exitCode = 1
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
