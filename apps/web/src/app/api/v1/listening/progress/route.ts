import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'

// GET /api/v1/listening/progress — Get user's listening progress across levels
export async function GET(req: NextRequest) {
    try {
        const serverUser = await getServerUser()
        if (!serverUser) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const userId = serverUser.userId

        // Run both queries in parallel — they're independent
        const [attempts, totalLessonsByLevel] = await Promise.all([
            // Get listening attempts with only needed fields (avoids loading full lesson/question data)
            prisma.listeningAttempt.findMany({
                where: { userId },
                select: {
                    score: true,
                    totalQuestions: true,
                    percentage: true,
                    timeTaken: true,
                    completedAt: true,
                    lesson: {
                        select: {
                            cefrLevel: true,
                            teil: true,
                            lessonId: true,
                        },
                    },
                },
                orderBy: { completedAt: 'desc' },
            }),
            prisma.listeningLesson.groupBy({
                by: ['cefrLevel'],
                _count: true,
            }),
        ])

        // Aggregate by CEFR level
        const levelStats: Record<string, {
            level: string
            totalAttempts: number
            uniqueLessonsCompleted: number
            averageScore: number
            bestScore: number
            totalTimeSeconds: number
        }> = {}

        const lessonBests: Record<string, { score: number; total: number }> = {}

        for (const attempt of attempts) {
            const level = attempt.lesson.cefrLevel
            if (!levelStats[level]) {
                levelStats[level] = {
                    level,
                    totalAttempts: 0,
                    uniqueLessonsCompleted: 0,
                    averageScore: 0,
                    bestScore: 0,
                    totalTimeSeconds: 0,
                }
            }

            levelStats[level].totalAttempts++
            levelStats[level].totalTimeSeconds += attempt.timeTaken ?? 0

            // Track best score per lesson
            const key = `${level}-${attempt.lesson.lessonId}`
            const existing = lessonBests[key]
            if (!existing || attempt.percentage > (existing.score / existing.total * 100)) {
                lessonBests[key] = { score: attempt.score, total: attempt.totalQuestions }
            }
        }

        // Build totalLessonsMap from the parallel query result
        const totalLessonsMap: Record<string, number> = {}
        for (const g of totalLessonsByLevel) {
            totalLessonsMap[g.cefrLevel] = g._count
        }

        // Calculate unique lessons completed per level
        for (const [key] of Object.entries(lessonBests)) {
            const level = key.split('-')[0] ?? ''
            if (levelStats[level]) {
                levelStats[level].uniqueLessonsCompleted++
            }
        }

        for (const [key, best] of Object.entries(lessonBests)) {
            const level = key.split('-')[0] ?? ''
            if (levelStats[level]) {
                levelStats[level].bestScore = Math.max(
                    levelStats[level].bestScore,
                    Math.round((best.score / best.total) * 100)
                )
            }
        }

        // Calculate averages
        for (const stat of Object.values(levelStats)) {
            const levelAttempts = attempts.filter(a => a.lesson.cefrLevel === stat.level)
            const totalPercentage = levelAttempts.reduce((sum, a) => sum + a.percentage, 0)
            stat.averageScore = levelAttempts.length > 0
                ? Math.round(totalPercentage / levelAttempts.length)
                : 0
        }

        // Recent attempts (last 10)
        const recentAttempts = attempts.slice(0, 10).map(a => ({
            lessonId: a.lesson.lessonId,
            cefrLevel: a.lesson.cefrLevel,
            teil: a.lesson.teil,
            score: a.score,
            totalQuestions: a.totalQuestions,
            percentage: a.percentage,
            timeTaken: a.timeTaken,
            completedAt: a.completedAt.toISOString(),
        }))

        return NextResponse.json({
            success: true,
            data: {
                levelProgress: Object.values(levelStats),
                totalLessonsByLevel: totalLessonsMap,
                recentAttempts,
                totalAttempts: attempts.length,
            },
        })
    } catch (error) {
        console.error('[Listening Progress API] Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to load progress' },
            { status: 500 }
        )
    }
}
