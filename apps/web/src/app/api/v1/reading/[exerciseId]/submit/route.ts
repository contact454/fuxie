import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'
import { handleApiError } from '@/lib/api/error-handler'
import { gradeReadingSubmission } from '@/lib/assessment/submission-grading'
import { calculateReadingXp, recordLearningActivity } from '@/lib/progress/learning-activity'

const readingSubmitSchema = z.object({
    answers: z.record(z.string(), z.string()),   // { questionId: userAnswer }
    timeTaken: z.number().min(0).optional(),
})

// POST /api/v1/reading/:exerciseId/submit — Submit reading answers
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ exerciseId: string }> }
) {
    try {
        const serverUser = await getServerUser()
        if (!serverUser) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const { exerciseId } = await params
        const body = await req.json()
        const { answers, timeTaken } = readingSubmitSchema.parse(body)

        // Get exercise with correct answers
        const exercise = await prisma.readingExercise.findUnique({
            where: { exerciseId },
            include: {
                questions: {
                    orderBy: { sortOrder: 'asc' },
                    select: {
                        id: true,
                        questionNumber: true,
                        questionType: true,
                        statement: true,
                        linkedText: true,
                        options: true,
                        correctAnswer: true,
                        points: true,
                        explanation: true,
                    },
                },
            },
        })

        if (!exercise) {
            return NextResponse.json(
                { success: false, error: 'Exercise not found' },
                { status: 404 }
            )
        }

        const { score, totalQuestions, percentage, responseData, questionResults } =
            gradeReadingSubmission(exercise.questions, answers)
        const baseXpEarned = calculateReadingXp(percentage)

        // Save attempt + unified learning activity
        const { attempt, progress } = await prisma.$transaction(async (tx) => {
            const newAttempt = await tx.readingAttempt.create({
                data: {
                    userId: serverUser.userId,
                    exerciseId: exercise.id,
                    score,
                    totalQuestions,
                    percentage,
                    timeTaken: timeTaken ?? null,
                    responses: {
                        create: responseData,
                    },
                },
            })

            const activity = await recordLearningActivity(tx, {
                userId: serverUser.userId,
                exerciseId: exercise.exerciseId,
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
                questionResults,
            },
        })
    } catch (error) {
        return handleApiError(error)
    }
}
