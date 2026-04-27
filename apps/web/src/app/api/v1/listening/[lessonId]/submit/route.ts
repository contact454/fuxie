import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@fuxie/database'
import { cookies } from 'next/headers'
import { getServerUser } from '@/lib/auth/server-auth'
import { z } from 'zod'
import { gradeListeningSubmission } from '@/lib/assessment/submission-grading'
import { calculateListeningXp, recordLearningActivity } from '@/lib/progress/learning-activity'
import { invalidateLearnerProgressCaches } from '@/lib/progress/cache-invalidation'

const ListeningSubmitSchema = z.object({
    answers: z.record(z.string(), z.string()),
    timeTaken: z.number().int().min(0).optional(),
    listenCount: z.number().int().min(1).optional(),
})

// POST /api/v1/listening/:lessonId/submit — Submit listening answers
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ lessonId: string }> }
) {
    try {
        const serverUser = await getServerUser()
        if (!serverUser) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const { lessonId } = await params
        const body = await req.json()
        const parsed = ListeningSubmitSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            )
        }
        const { answers, timeTaken, listenCount } = parsed.data


        // Get lesson with correct answers
        const lesson = await prisma.listeningLesson.findUnique({
            where: { lessonId },
            include: {
                questions: {
                    orderBy: { sortOrder: 'asc' },
                    select: {
                        id: true,
                        questionNumber: true,
                        questionText: true,
                        questionType: true,
                        options: true,
                        correctAnswer: true,
                        explanation: true,
                        explanationTrans: true,
                    },
                },
            },
        })

        if (!lesson) {
            return NextResponse.json(
                { success: false, error: 'Lesson not found' },
                { status: 404 }
            )
        }

        const locale = (await cookies()).get('NEXT_LOCALE')?.value || 'vi'
        const { score, totalQuestions, percentage, responseData, questionResults } =
            gradeListeningSubmission(
                lesson.questions.map((question) => ({
                    ...question,
                    explanationTrans: question.explanationTrans as Record<string, string> | null,
                })),
                answers,
                locale
            )
        const baseXpEarned = calculateListeningXp(percentage)

        // Save attempt + unified learning activity
        const { attempt, progress } = await prisma.$transaction(async (tx) => {
            const newAttempt = await tx.listeningAttempt.create({
                data: {
                    userId: serverUser.userId,
                    lessonId: lesson.id,
                    score,
                    totalQuestions,
                    percentage,
                    timeTaken: timeTaken ?? null,
                    listenCount: listenCount ?? 1,
                    responses: {
                        create: responseData,
                    },
                },
            })

            const activity = await recordLearningActivity(tx, {
                userId: serverUser.userId,
                exerciseId: lesson.lessonId,
                score,
                maxScore: totalQuestions,
                percentScore: percentage,
                xpEarned: baseXpEarned,
                timeSpentSeconds: timeTaken ?? null,
                exercisesCompleted: 1,
            })

            return {
                attempt: newAttempt,
                progress: activity,
            }
        })

        invalidateLearnerProgressCaches(serverUser.userId).catch(() => {})

        return NextResponse.json({
            success: true,
            data: {
                attemptId: attempt.id,
                score,
                totalQuestions,
                percentage,
                xpEarned: progress.xpEarned,
                streak: progress.streak,
                timeTaken,
                listenCount,
                questionResults,
            },
        })
    } catch (error) {
        console.error('[Listening Submit API] Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to submit answers' },
            { status: 500 }
        )
    }
}
