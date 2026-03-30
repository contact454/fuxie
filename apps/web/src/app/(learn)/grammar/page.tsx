import { redirect } from 'next/navigation'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'
import { cacheWrap } from '@/lib/cache/redis'
import { GrammarClient } from '@/components/grammar/GrammarClient'

export const metadata = {
    title: 'Fuxie 🦊 — Grammatik',
    description: 'Deutsche Grammatik — Luyện ngữ pháp tiếng Đức từ A1 đến C2',
}

import type { CefrLevel } from '@/lib/types/cefr'

async function getGrammarData(userId: string | null, level: CefrLevel) {
    // Query topics and lessons separately to avoid Prisma include issues
    const topics = await cacheWrap(`grammar:topics:${level}`, 3600, () => prisma.grammarTopic.findMany({
        where: { cefrLevel: level },
        orderBy: { sortOrder: 'asc' },
        select: {
            id: true,
            slug: true,
            title: true,
            titleDe: true,
            titleVi: true,
            cefrLevel: true,
        },
    }))

    // Get all lessons for this level (use topicId to group)
    const topicIds = topics.map((t) => t.id)
    const lessons = await cacheWrap(`grammar:lessons:${level}`, 3600, async () => {
        if (topicIds.length === 0) return []
        return prisma.grammarLesson.findMany({
            where: { topicId: { in: topicIds } },
            orderBy: { sortOrder: 'asc' },
            select: {
                id: true,
                topicId: true,
                lessonType: true,
                lessonNumber: true,
                titleVi: true,
                estimatedMin: true,
            },
        })
    })

    // Group lessons by topicId
    const lessonsByTopic: Record<string, any[]> = {}
    for (const l of lessons) {
        if (!lessonsByTopic[l.topicId]) lessonsByTopic[l.topicId] = []
        lessonsByTopic[l.topicId]!.push(l)
    }

    // Get user progress
    let progressMap: Record<string, { score: number; stars: number; completed: boolean }> = {}
    if (userId && lessons.length > 0) {
        const lessonIds = lessons.map((l: any) => l.id)
        const progressRows = await prisma.grammarProgress.findMany({
            where: { userId, lessonId: { in: lessonIds } },
            select: {
                lessonId: true,
                score: true,
                stars: true,
                completed: true,
            },
        })
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

    return {
        topics: topicsWithProgress,
        totalTopics: topicsWithProgress.length,
        totalCompleted: topicsWithProgress.filter((t: any) => t.completedLessons === t.lessons.length).length,
    }
}

async function getAvailableLevels(): Promise<CefrLevel[]> {
    return cacheWrap('grammar:levels', 3600, async () => {
        const levels = await prisma.grammarTopic.findMany({
            select: { cefrLevel: true },
            distinct: ['cefrLevel'],
            orderBy: { cefrLevel: 'asc' },
        })
        if (levels.length === 0) return ['A1']
        return levels.map((l: any) => l.cefrLevel as CefrLevel)
    })
}

export default async function GrammarPage() {
    const serverUser = await getServerUser()
    if (!serverUser) redirect('/login')

    const availableLevels = await getAvailableLevels()
    const defaultLevel: CefrLevel = availableLevels[0]! || 'A1'
    const data = await getGrammarData(serverUser.userId, defaultLevel)

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <GrammarClient
                topics={data.topics}
                totalTopics={data.totalTopics}
                totalCompleted={data.totalCompleted}
                availableLevels={availableLevels}
                initialLevel={defaultLevel}
            />
        </div>
    )
}
