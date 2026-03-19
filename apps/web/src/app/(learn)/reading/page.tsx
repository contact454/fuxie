import { redirect } from 'next/navigation'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'
import { ReadingClient } from '@/components/reading/reading-client'
import { unstable_cache } from 'next/cache'

export const dynamic = 'force-dynamic'

export const metadata = {
    title: 'Fuxie 🦊 — Leseverstehen',
    description: 'Deutsche Leseverstehen — Practice reading comprehension by CEFR level',
}

type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

async function getReadingData(userId: string | null, cefrLevel: CefrLevel) {
    // Parallelize independent queries
    const [exercises, completedExercises] = await Promise.all([
        prisma.readingExercise.findMany({
            where: { cefrLevel },
            orderBy: [{ teil: 'asc' }, { sortOrder: 'asc' }],
            select: {
                id: true,
                exerciseId: true,
                cefrLevel: true,
                teil: true,
                teilName: true,
                topic: true,
                metadataJson: true,
                sortOrder: true,
                _count: { select: { questions: true } },
            },
        }),
        userId
            ? prisma.readingAttempt.findMany({
                where: { userId },
                select: { exerciseId: true, score: true, totalQuestions: true },
            }).then(attempts => {
                const map: Record<string, { bestScore: number; totalQuestions: number; attempts: number }> = {}
                for (const a of attempts) {
                    const existing = map[a.exerciseId]
                    if (!existing || a.score > existing.bestScore) {
                        map[a.exerciseId] = { bestScore: a.score, totalQuestions: a.totalQuestions, attempts: (existing?.attempts ?? 0) + 1 }
                    } else {
                        map[a.exerciseId] = { ...existing, attempts: existing.attempts + 1 }
                    }
                }
                return map
            })
            : ({} as Record<string, { bestScore: number; totalQuestions: number; attempts: number }>),
    ])

    // Group by Teil
    const teilMap: Record<number, {
        teil: number
        teilName: string
        exercises: Array<{
            id: string
            exerciseId: string
            topic: string
            questionCount: number
            wordCount: number | null
            completion: { bestScore: number; totalQuestions: number; attempts: number } | null
        }>
    }> = {}

    for (const ex of exercises) {
        if (!teilMap[ex.teil]) {
            teilMap[ex.teil] = { teil: ex.teil, teilName: ex.teilName, exercises: [] }
        }
        const meta = ex.metadataJson as any
        teilMap[ex.teil]!.exercises.push({
            id: ex.id,
            exerciseId: ex.exerciseId,
            topic: ex.topic,
            questionCount: ex._count.questions,
            wordCount: meta?.word_count ?? null,
            completion: completedExercises[ex.id] ?? null,
        })
    }

    const teile = Object.values(teilMap).sort((a, b) => a.teil - b.teil)
    const totalExercises = exercises.length
    const totalCompleted = Object.keys(completedExercises).length

    return { teile, totalExercises, totalCompleted }
}

// Cache available levels — content changes rarely (revalidate every 1 hour)
const getAvailableLevels = unstable_cache(
    async (): Promise<CefrLevel[]> => {
        const levels = await prisma.readingExercise.findMany({
            select: { cefrLevel: true },
            distinct: ['cefrLevel'],
            orderBy: { cefrLevel: 'asc' },
        })
        if (levels.length === 0) return ['A1']
        return levels.map(l => l.cefrLevel as CefrLevel)
    },
    ['reading-available-levels'],
    { revalidate: 3600, tags: ['reading-levels'] }
)

export default async function ReadingPage() {
    const serverUser = await getServerUser()
    if (!serverUser) redirect('/login')

    const availableLevels = await getAvailableLevels()
    const defaultLevel: CefrLevel = availableLevels[0] || 'A1'
    const data = await getReadingData(serverUser.userId, defaultLevel)

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <ReadingClient
                teile={data.teile}
                totalExercises={data.totalExercises}
                totalCompleted={data.totalCompleted}
                availableLevels={availableLevels}
                initialLevel={defaultLevel}
            />
        </div>
    )
}
