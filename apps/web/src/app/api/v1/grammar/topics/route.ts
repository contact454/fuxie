import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'

export async function GET(req: NextRequest) {
    const serverUser = await getServerUser()
    if (!serverUser) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const level = req.nextUrl.searchParams.get('level') || 'A1'

    // Separate queries to avoid Prisma include issues
    const topics = await (prisma as any).grammarTopic.findMany({
        where: { cefrLevel: level },
        orderBy: { sortOrder: 'asc' },
    }) as any[]

    const topicIds = topics.map((t: any) => t.id)
    const lessons = topicIds.length > 0
        ? await (prisma as any).grammarLesson.findMany({
            where: { topicId: { in: topicIds } },
            orderBy: { sortOrder: 'asc' },
        }) as any[]
        : []

    const lessonsByTopic: Record<string, any[]> = {}
    for (const l of lessons) {
        if (!lessonsByTopic[l.topicId]) lessonsByTopic[l.topicId] = []
        lessonsByTopic[l.topicId].push(l)
    }

    let progressMap: Record<string, { score: number; stars: number; completed: boolean }> = {}
    if (lessons.length > 0) {
        const lessonIds = lessons.map((l: any) => l.id)
        const progressRows = await (prisma as any).grammarProgress.findMany({
            where: { userId: serverUser.userId, lessonId: { in: lessonIds } },
        }) as any[]
        for (const p of progressRows) {
            progressMap[p.lessonId] = {
                score: p.score ?? 0,
                stars: p.stars ?? 0,
                completed: p.completed,
            }
        }
    }

    const topicsWithProgress = topics.map((t: any) => {
        const topicLessons = lessonsByTopic[t.id] || []
        return {
            id: t.id,
            slug: t.slug,
            titleDe: t.titleDe ?? t.title ?? '',
            titleVi: t.titleVi ?? '',
            cefrLevel: t.cefrLevel,
            lessons: topicLessons.map((l: any) => ({
                id: l.id,
                lessonType: l.lessonType,
                lessonNumber: l.lessonNumber,
                titleVi: l.titleVi,
                estimatedMin: l.estimatedMin,
                progress: progressMap[l.id] ?? null,
            })),
            totalStars: topicLessons.reduce((sum: number, l: any) => sum + (progressMap[l.id]?.stars ?? 0), 0),
            maxStars: topicLessons.length * 3,
            completedLessons: topicLessons.filter((l: any) => progressMap[l.id]?.completed).length,
        }
    })

    return NextResponse.json({
        topics: topicsWithProgress,
        totalTopics: topicsWithProgress.length,
        totalCompleted: topicsWithProgress.filter((t: any) => t.completedLessons === t.lessons.length).length,
    })
}
