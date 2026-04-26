import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'
import { handleApiError } from '@/lib/api/error-handler'
import { cookies } from 'next/headers'
import { calculateWritingXp, recordLearningActivity } from '@/lib/progress/learning-activity'

const writingSubmitSchema = z.object({
    exerciseId: z.string().min(1),
    submittedText: z.string().min(1),
    wordCount: z.number().int().min(0).optional(),
    timeSpentSeconds: z.number().min(0).optional(),
})

// POST /api/v1/writing/submit - Submit writing and get AI grading
export async function POST(req: NextRequest) {
    try {
        const serverUser = await getServerUser()
        if (!serverUser) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { exerciseId, submittedText, wordCount, timeSpentSeconds } = writingSubmitSchema.parse(body)

        const exercise = await prisma.writingExercise.findUnique({
            where: { exerciseId },
        })

        if (!exercise) {
            return NextResponse.json({ success: false, error: 'Exercise not found' }, { status: 404 })
        }

        const rubric = exercise.rubricJson as any
        const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:3001'
        const locale = (await cookies()).get('NEXT_LOCALE')?.value || 'vi'

        const aiRes = await fetch(`${aiServiceUrl}/grade/writing`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cefrLevel: exercise.cefrLevel,
                textType: exercise.textType,
                register: exercise.register,
                situation: exercise.situation,
                contentPoints: exercise.contentPoints,
                submittedText,
                minWords: exercise.minWords,
                maxWords: exercise.maxWords,
                uiLanguage: locale,
                rubric,
            }),
            signal: AbortSignal.timeout(30000),
        })

        if (!aiRes.ok) {
            console.error('[Writing Grade] AI Service returned error status:', await aiRes.text())
            return NextResponse.json({ success: false, error: 'AI grading service unavailable' }, { status: 502 })
        }

        const json = await aiRes.json()
        if (!json.success || !json.data) {
            return NextResponse.json({ success: false, error: 'Invalid response from AI grading service' }, { status: 500 })
        }

        const gradingResult = json.data
        const baseXpEarned = calculateWritingXp()

        const criteriaMap: Record<string, number> = {}
        for (const c of gradingResult.criteria) {
            criteriaMap[c.id || c.name] = c.score
        }

        const result = await prisma.$transaction(async (tx) => {
            const attempt = await tx.writingAttempt.create({
                data: {
                    userId: serverUser.userId,
                    exerciseId: exercise.id,
                    submittedText,
                    wordCount: wordCount || submittedText.trim().split(/\s+/).length,
                    scoreInhalt: criteriaMap['Inhalt'] ?? criteriaMap['VollstÃ¤ndigkeit'] ?? null,
                    scoreAngemessenheit: criteriaMap['Kommunikative Angemessenheit'] ?? criteriaMap['Formale Richtigkeit'] ?? null,
                    scoreKorrektheit: criteriaMap['Korrektheit'] ?? null,
                    scoreSpektrum: criteriaMap['Wortschatz & Strukturen'] ?? null,
                    scoreKohaerenz: criteriaMap['KohÃ¤renz & KohÃ¤sion'] ?? null,
                    totalScore: gradingResult.totalScore,
                    maxScore: gradingResult.maxScore,
                    percentScore: gradingResult.percentScore,
                    feedbackOverall: gradingResult.overallFeedback,
                    feedbackJson: gradingResult.criteria,
                    correctionsJson: gradingResult.corrections,
                    estimatedLevel: gradingResult.estimatedLevel as any,
                    timeSpentSeconds: timeSpentSeconds || null,
                },
            })

            const progress = await recordLearningActivity(tx, {
                userId: serverUser.userId,
                exerciseId: exercise.exerciseId,
                score: gradingResult.totalScore,
                maxScore: gradingResult.maxScore,
                percentScore: gradingResult.percentScore,
                xpEarned: baseXpEarned,
                timeSpentSeconds: timeSpentSeconds ?? null,
                exercisesCompleted: 1,
            })

            return {
                attempt,
                progress,
            }
        })

        return NextResponse.json({
            success: true,
            data: {
                attemptId: result.attempt.id,
                xpEarned: result.progress.xpEarned,
                streak: result.progress.streak,
                ...gradingResult,
            },
        })
    } catch (error: unknown) {
        if (
            error instanceof Error &&
            (error.message.includes('API_KEY') || error.message.includes('GEMINI'))
        ) {
            return NextResponse.json(
                { success: false, error: 'AI service not configured. Please set GEMINI_API_KEY.' },
                { status: 503 }
            )
        }

        return handleApiError(error)
    }
}
