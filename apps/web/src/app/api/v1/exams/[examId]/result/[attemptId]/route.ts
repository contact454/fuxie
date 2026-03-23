import { NextResponse } from 'next/server'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'

/**
 * GET /api/v1/exams/[examId]/result/[attemptId]
 * Returns graded attempt results
 */
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ examId: string; attemptId: string }> }
) {
    try {
        const user = await getServerUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { attemptId } = await params

        const attempt = await prisma.examAttempt.findFirst({
            where: { id: attemptId, userId: user.userId },
            select: {
                id: true,
                totalScore: true,
                maxScore: true,
                percentScore: true,
                passed: true,
                scoreBreakdown: true,
                completedAt: true,
                answers: {
                    select: {
                        taskId: true,
                        score: true,
                        maxScore: true,
                        isCorrect: true,
                        rubricScores: true,
                    },
                },
            },
        })

        if (!attempt || !attempt.completedAt) {
            return NextResponse.json({ error: 'Result not found' }, { status: 404 })
        }

        const breakdown = attempt.scoreBreakdown as Record<string, { score: number; maxScore: number; skill: string }> | null

        return NextResponse.json({
            success: true,
            data: {
                attemptId: attempt.id,
                totalScore: attempt.totalScore,
                maxScore: attempt.maxScore,
                percentScore: attempt.percentScore,
                passed: attempt.passed,
                sectionScores: breakdown ? Object.values(breakdown) : [],
                answers: attempt.answers.map(a => ({
                    taskId: a.taskId,
                    score: a.score,
                    maxScore: a.maxScore,
                    isCorrect: a.isCorrect,
                    details: a.rubricScores ?? {},
                })),
            },
        })
    } catch (err) {
        console.error('Result fetch error:', err)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
