import { redirect } from 'next/navigation'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'
import { ListeningClient } from '@/components/listening/listening-client'

export const dynamic = 'force-dynamic'

export const metadata = {
    title: 'Fuxie 🦊 — Hörverstehen',
    description: 'Deutsche Hörverstehen — Practice listening comprehension by CEFR level',
}

type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

async function getListeningData(userId: string | null, cefrLevel: CefrLevel) {
    const lessons = await prisma.listeningLesson.findMany({
        where: { cefrLevel },
        orderBy: [{ teil: 'asc' }, { sortOrder: 'asc' }],
        select: {
            id: true,
            lessonId: true,
            cefrLevel: true,
            teil: true,
            teilName: true,
            title: true,
            topic: true,
            taskType: true,
            audioUrl: true,
            audioDuration: true,
            backgroundScene: true,
            sortOrder: true,
            _count: { select: { questions: true } },
        },
    })

    // Get user's completion data
    let completedLessons: Record<string, { bestScore: number; totalQuestions: number; attempts: number }> = {}
    if (userId) {
        const attempts = await prisma.listeningAttempt.findMany({
            where: { userId },
            select: {
                lessonId: true,
                score: true,
                totalQuestions: true,
            },
        })
        for (const a of attempts) {
            const existing = completedLessons[a.lessonId]
            if (!existing || a.score > existing.bestScore) {
                completedLessons[a.lessonId] = {
                    bestScore: a.score,
                    totalQuestions: a.totalQuestions,
                    attempts: (existing?.attempts ?? 0) + 1,
                }
            } else {
                completedLessons[a.lessonId] = {
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
        lessons: Array<{
            id: string
            lessonId: string
            title: string
            topic: string
            taskType: string
            audioDuration: number | null
            questionCount: number
            completion: { bestScore: number; totalQuestions: number; attempts: number } | null
        }>
    }> = {}

    for (const lesson of lessons) {
        if (!teilMap[lesson.teil]) {
            teilMap[lesson.teil] = {
                teil: lesson.teil,
                teilName: lesson.teilName,
                lessons: [],
            }
        }
        teilMap[lesson.teil]!.lessons.push({
            id: lesson.id,
            lessonId: lesson.lessonId,
            title: lesson.title,
            topic: lesson.topic,
            taskType: lesson.taskType,
            audioDuration: lesson.audioDuration,
            questionCount: lesson._count.questions,
            completion: completedLessons[lesson.id] ?? null,
        })
    }

    const teile = Object.values(teilMap).sort((a, b) => a.teil - b.teil)
    const totalLessons = lessons.length
    const totalCompleted = Object.keys(completedLessons).length

    return { teile, totalLessons, totalCompleted }
}

async function getAvailableLevels(): Promise<CefrLevel[]> {
    const levels = await prisma.listeningLesson.findMany({
        select: { cefrLevel: true },
        distinct: ['cefrLevel'],
        orderBy: { cefrLevel: 'asc' },
    })
    if (levels.length === 0) {
        // If no lessons yet, show A1 as default
        return ['A1']
    }
    return levels.map(l => l.cefrLevel as CefrLevel)
}

export default async function ListeningPage() {
    const serverUser = await getServerUser()
    if (!serverUser) redirect('/login')

    const availableLevels = await getAvailableLevels()
    const defaultLevel: CefrLevel = availableLevels[0] || 'A1'
    const data = await getListeningData(serverUser.userId, defaultLevel)

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <ListeningClient
                teile={data.teile}
                totalLessons={data.totalLessons}
                totalCompleted={data.totalCompleted}
                availableLevels={availableLevels}
                initialLevel={defaultLevel}
            />
        </div>
    )
}
