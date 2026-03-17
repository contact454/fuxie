import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'

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
        const { answers, timeTaken } = body as {
            answers: Record<string, string>  // { questionId: userAnswer }
            timeTaken?: number
        }

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

        // Grade answers
        let score = 0
        const totalQuestions = exercise.questions.length
        const responseData: { questionId: string; userAnswer: string; isCorrect: boolean }[] = []
        const questionResults: {
            questionId: string
            questionNumber: number
            questionType: string
            statement: string
            linkedText: string | null
            options: unknown
            userAnswer: string
            correctAnswer: string
            isCorrect: boolean
            explanation: unknown
        }[] = []

        for (const q of exercise.questions) {
            const userAnswer = answers[q.id] || ''
            const isCorrect = userAnswer.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()
            if (isCorrect) score++

            responseData.push({ questionId: q.id, userAnswer, isCorrect })
            questionResults.push({
                questionId: q.id,
                questionNumber: q.questionNumber,
                questionType: q.questionType,
                statement: q.statement,
                linkedText: q.linkedText,
                options: q.options,
                userAnswer,
                correctAnswer: q.correctAnswer,
                isCorrect,
                explanation: q.explanation,
            })
        }

        const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0

        // Save attempt
        const attempt = await prisma.readingAttempt.create({
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

        return NextResponse.json({
            success: true,
            data: {
                attemptId: attempt.id,
                score,
                totalQuestions,
                percentage,
                timeTaken,
                questionResults,
            },
        })
    } catch (error) {
        console.error('[Reading Submit API] Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to submit answers' },
            { status: 500 }
        )
    }
}
