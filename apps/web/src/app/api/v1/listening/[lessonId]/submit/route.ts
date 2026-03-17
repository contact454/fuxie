import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'

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
        const { answers, timeTaken, listenCount } = body as {
            answers: Record<string, string>  // { questionId: userAnswer }
            timeTaken?: number
            listenCount?: number
        }

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
                        explanationVi: true,
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

        // Grade answers
        let score = 0
        const totalQuestions = lesson.questions.length
        const responseData: { questionId: string; userAnswer: string; isCorrect: boolean }[] = []
        const questionResults: {
            questionId: string
            questionNumber: number
            questionText: string
            options: unknown
            userAnswer: string
            correctAnswer: string
            isCorrect: boolean
            explanation: string | null
            explanationVi: string | null
        }[] = []

        for (const q of lesson.questions) {
            const userAnswer = answers[q.id] || ''
            const isCorrect = userAnswer.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()
            if (isCorrect) score++

            responseData.push({ questionId: q.id, userAnswer, isCorrect })
            questionResults.push({
                questionId: q.id,
                questionNumber: q.questionNumber,
                questionText: q.questionText,
                options: q.options,
                userAnswer,
                correctAnswer: q.correctAnswer,
                isCorrect,
                explanation: q.explanation,
                explanationVi: q.explanationVi,
            })
        }

        const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0

        // Save attempt
        const attempt = await prisma.listeningAttempt.create({
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

        return NextResponse.json({
            success: true,
            data: {
                attemptId: attempt.id,
                score,
                totalQuestions,
                percentage,
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
