import { redirect } from 'next/navigation'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'
import { cacheGet, cacheSet } from '@/lib/cache/redis'
import { ListeningClientDynamic } from '@/components/listening/ListeningClientDynamic'
import { getListeningLessonList, getListeningLevels, type CefrLevel } from '@/lib/content/listening'

export const metadata = {
    title: 'Fuxie - Luyện nghe',
    description: 'Luyện nghe tiếng Đức theo trình độ CEFR',
}

type ListeningLessonList = Awaited<ReturnType<typeof getListeningLessonList>>

async function getCachedListeningLessonList(cefrLevel: CefrLevel): Promise<ListeningLessonList> {
    const cacheKey = `listening:lessons:v3:${cefrLevel}`
    const cached = await cacheGet<ListeningLessonList>(cacheKey)
    if (cached && cached.length > 0) return cached

    const lessons = await getListeningLessonList(cefrLevel)
    if (lessons.length > 0) {
        await cacheSet(cacheKey, lessons, 3600)
    }
    return lessons
}

async function getListeningData(userId: string | null, cefrLevel: CefrLevel) {
    const lessons = await getCachedListeningLessonList(cefrLevel)

    const lessonIds = lessons.map((lesson) => lesson.id)
    const completedLessons = userId && lessonIds.length > 0
        ? await prisma.listeningAttempt.findMany({
            where: {
                userId,
                lessonId: { in: lessonIds },
            },
            select: { lessonId: true, score: true, totalQuestions: true },
        }).then(attempts => {
            const map: Record<string, { bestScore: number; totalQuestions: number; attempts: number }> = {}
            for (const a of attempts) {
                const existing = map[a.lessonId]
                if (!existing || a.score > existing.bestScore) {
                    map[a.lessonId] = { bestScore: a.score, totalQuestions: a.totalQuestions, attempts: (existing?.attempts ?? 0) + 1 }
                } else {
                    map[a.lessonId] = { ...existing, attempts: existing.attempts + 1 }
                }
            }
            return map
        })
        : ({} as Record<string, { bestScore: number; totalQuestions: number; attempts: number }>)

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

export default async function ListeningPage() {
    const serverUser = await getServerUser()
    if (!serverUser) redirect('/login')

    const availableLevels = await getListeningLevels()
    const defaultLevel: CefrLevel = availableLevels[0] || 'A1'

    // Data loads with Redis cache — blazing fast on repeat visits
    const data = await getListeningData(serverUser.userId, defaultLevel)

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <ListeningClientDynamic
                teile={data.teile}
                totalLessons={data.totalLessons}
                totalCompleted={data.totalCompleted}
                availableLevels={availableLevels}
                initialLevel={defaultLevel}
            />
        </div>
    )
}
