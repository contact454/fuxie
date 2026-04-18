import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@fuxie/database'
import { cookies } from 'next/headers'
import { getServerUser } from '@/lib/auth/server-auth'
import { handleApiError } from '@/lib/api/error-handler'

const VALID_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
const querySchema = z.object({ level: z.enum(VALID_LEVELS).default('A1') })

export async function GET(req: NextRequest) {
    try {
        const serverUser = await getServerUser()
        if (!serverUser) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

        const { level } = querySchema.parse({
            level: req.nextUrl.searchParams.get('level') || undefined,
        })

        // Separate queries to avoid Prisma include issues
        const topics = await prisma.grammarTopic.findMany({
            where: { cefrLevel: level },
            orderBy: { sortOrder: 'asc' },
            select: { id: true, slug: true, titleDe: true, title: true, translations: true, cefrLevel: true, sortOrder: true },
        })

        const topicIds = topics.map((t) => t.id)
        const lessons = topicIds.length > 0
            ? await prisma.grammarLesson.findMany({
                where: { topicId: { in: topicIds } },
                orderBy: { sortOrder: 'asc' },
                select: { id: true, topicId: true, lessonType: true, lessonNumber: true, translations: true, estimatedMin: true },
            })
            : []

        const lessonsByTopic: Record<string, any[]> = {}
        for (const l of lessons) {
            if (!lessonsByTopic[l.topicId]) lessonsByTopic[l.topicId] = []
            lessonsByTopic[l.topicId]!.push(l)
        }

        let progressMap: Record<string, { score: number; stars: number; completed: boolean }> = {}
        if (lessons.length > 0) {
            const lessonIds = lessons.map((l: any) => l.id)
            const progressRows = await prisma.grammarProgress.findMany({
                where: { userId: serverUser.userId, lessonId: { in: lessonIds } },
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

        const locale = (await cookies()).get('NEXT_LOCALE')?.value || 'vi'

        const topicsWithProgress = topics.map((t: any) => {
            const topicLessons = lessonsByTopic[t.id] || []
            return {
                id: t.id,
                slug: t.slug,
                titleDe: t.titleDe ?? t.title ?? '',
                titleNative: (t.translations as any)?.[locale] || t.titleDe || '',
                cefrLevel: t.cefrLevel,
                lessons: topicLessons.map((l: any) => ({
                    id: l.id,
                    lessonType: l.lessonType,
                    lessonNumber: l.lessonNumber,
                    titleNative: (l.translations as any)?.[locale] || '',
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
        }, {
            headers: {
                'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
            },
        })
    } catch (error) {
        return handleApiError(error)
    }
}
