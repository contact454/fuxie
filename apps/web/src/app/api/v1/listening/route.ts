import { NextRequest, NextResponse } from 'next/server'
import { ZodError, z } from 'zod'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'
import {
    getListeningLessonList,
    groupListeningLessonsByTeil,
    type CefrLevel,
} from '@/lib/content/listening'

const VALID_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
const querySchema = z.object({ level: z.enum(VALID_LEVELS).default('A1') })

const PRIVATE_NO_STORE = {
    'Cache-Control': 'private, no-store',
} as const

/**
 * GET /api/v1/listening?level=A1
 * Authenticated listening hub payload with per-user completion for the requested CEFR level.
 */
export async function GET(req: NextRequest) {
    try {
        const serverUser = await getServerUser()
        if (!serverUser) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401, headers: PRIVATE_NO_STORE },
            )
        }

        const { level } = querySchema.parse({
            level: req.nextUrl.searchParams.get('level') || undefined,
        })

        const lessons = await getListeningLessonList(level as CefrLevel)
        const lessonIds = lessons.map((lesson) => lesson.id)

        const aggregates =
            lessonIds.length === 0
                ? []
                : await prisma.listeningAttempt.groupBy({
                      by: ['lessonId'],
                      where: {
                          userId: serverUser.userId,
                          lessonId: { in: lessonIds },
                      },
                      _max: {
                          score: true,
                          totalQuestions: true,
                      },
                      _count: {
                          _all: true,
                      },
                  })

        const completionByLesson: Record<
            string,
            { bestScore: number; totalQuestions: number; attempts: number }
        > = {}

        for (const row of aggregates) {
            completionByLesson[row.lessonId] = {
                bestScore: row._max.score ?? 0,
                totalQuestions: row._max.totalQuestions ?? 0,
                attempts: row._count._all,
            }
        }

        const teile = groupListeningLessonsByTeil(lessons).map((teil) => ({
            teil: teil.teil,
            teilName: teil.teilName,
            lessons: teil.lessons.map((lesson) => ({
                id: lesson.id,
                lessonId: lesson.lessonId,
                title: lesson.title,
                topic: lesson.topic,
                taskType: lesson.taskType,
                audioDuration: lesson.audioDuration,
                questionCount: lesson._count.questions,
                completion: completionByLesson[lesson.id] ?? null,
            })),
        }))

        const totalCompleted = Object.keys(completionByLesson).length

        return NextResponse.json(
            {
                success: true,
                data: {
                    level,
                    totalLessons: lessons.length,
                    totalCompleted,
                    teile,
                },
            },
            { headers: PRIVATE_NO_STORE },
        )
    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json(
                { success: false, error: 'Invalid CEFR level' },
                { status: 400, headers: PRIVATE_NO_STORE },
            )
        }

        console.error('[Listening API] Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to load listening data' },
            { status: 500, headers: PRIVATE_NO_STORE },
        )
    }
}
