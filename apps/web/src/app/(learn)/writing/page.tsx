import { redirect } from 'next/navigation'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'
import { WritingClient } from '@/components/writing/writing-client'

export const dynamic = 'force-dynamic'

export const metadata = {
    title: 'Fuxie 🦊 — Schreibtraining',
    description: 'Deutsche Schreibtraining — Practice writing by CEFR level with AI feedback',
}

type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

async function getWritingData(userId: string | null, cefrLevel: CefrLevel) {
    const exercises = await prisma.writingExercise.findMany({
        where: { cefrLevel },
        orderBy: [{ teil: 'asc' }, { sortOrder: 'asc' }],
        select: {
            id: true,
            exerciseId: true,
            cefrLevel: true,
            teil: true,
            teilName: true,
            topic: true,
            textType: true,
            register: true,
            minWords: true,
            maxWords: true,
            timeMinutes: true,
            maxScore: true,
            sortOrder: true,
        },
    })

    // Get user's completion data
    let completedExercises: Record<string, { bestScore: number; maxScore: number; attempts: number }> = {}
    if (userId) {
        const attempts = await prisma.writingAttempt.findMany({
            where: { userId },
            select: {
                exerciseId: true,
                totalScore: true,
                maxScore: true,
            },
        })
        for (const a of attempts) {
            const existing = completedExercises[a.exerciseId]
            const score = a.totalScore ?? 0
            const max = a.maxScore ?? 25
            if (!existing || score > existing.bestScore) {
                completedExercises[a.exerciseId] = {
                    bestScore: score,
                    maxScore: max,
                    attempts: (existing?.attempts ?? 0) + 1,
                }
            } else {
                completedExercises[a.exerciseId] = {
                    ...existing,
                    attempts: existing.attempts + 1,
                }
            }
        }
    }

    // Group by Teil
    const teilMap: Record<number, {
        teil: number
        teilName: string
        exercises: Array<{
            id: string
            exerciseId: string
            topic: string
            textType: string
            register: string
            minWords: number
            maxWords: number | null
            timeMinutes: number
            completion: { bestScore: number; maxScore: number; attempts: number } | null
        }>
    }> = {}

    for (const ex of exercises) {
        if (!teilMap[ex.teil]) {
            teilMap[ex.teil] = { teil: ex.teil, teilName: ex.teilName, exercises: [] }
        }
        teilMap[ex.teil]!.exercises.push({
            id: ex.id,
            exerciseId: ex.exerciseId,
            topic: ex.topic,
            textType: ex.textType,
            register: ex.register,
            minWords: ex.minWords,
            maxWords: ex.maxWords,
            timeMinutes: ex.timeMinutes,
            completion: completedExercises[ex.id] ?? null,
        })
    }

    const teile = Object.values(teilMap).sort((a, b) => a.teil - b.teil)
    const totalExercises = exercises.length
    const totalCompleted = Object.keys(completedExercises).length

    return { teile, totalExercises, totalCompleted }
}

async function getAvailableLevels(): Promise<CefrLevel[]> {
    const levels = await prisma.writingExercise.findMany({
        select: { cefrLevel: true },
        distinct: ['cefrLevel'],
        orderBy: { cefrLevel: 'asc' },
    })
    if (levels.length === 0) return ['A1']
    return levels.map(l => l.cefrLevel as CefrLevel)
}

export default async function WritingPage() {
    const serverUser = await getServerUser()
    if (!serverUser) redirect('/login')

    const availableLevels = await getAvailableLevels()
    const defaultLevel: CefrLevel = availableLevels[0] || 'A1'
    const data = await getWritingData(serverUser.userId, defaultLevel)

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <WritingClient
                teile={data.teile}
                totalExercises={data.totalExercises}
                totalCompleted={data.totalCompleted}
                availableLevels={availableLevels}
                initialLevel={defaultLevel}
            />
        </div>
    )
}
