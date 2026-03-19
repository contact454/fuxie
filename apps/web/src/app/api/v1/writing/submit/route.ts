import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'
import { gradeWriting } from '@/lib/ai/writing-grader'
import { handleApiError } from '@/lib/api/error-handler'

const writingSubmitSchema = z.object({
    exerciseId: z.string().min(1),
    submittedText: z.string().min(1),
    wordCount: z.number().int().min(0).optional(),
    timeSpentSeconds: z.number().min(0).optional(),
})

// POST /api/v1/writing/submit — Submit writing and get AI grading
export async function POST(req: NextRequest) {
    try {
        const serverUser = await getServerUser()
        if (!serverUser) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { exerciseId, submittedText, wordCount, timeSpentSeconds } = writingSubmitSchema.parse(body)

        // Fetch exercise details
        const exercise = await prisma.writingExercise.findUnique({
            where: { exerciseId },
        })

        if (!exercise) {
            return NextResponse.json({ success: false, error: 'Exercise not found' }, { status: 404 })
        }

        const rubric = exercise.rubricJson as any

        // Call AI grading
        const gradingResult = await gradeWriting({
            cefrLevel: exercise.cefrLevel,
            textType: exercise.textType,
            register: exercise.register,
            situation: exercise.situation,
            contentPoints: exercise.contentPoints as string[],
            submittedText,
            minWords: exercise.minWords,
            maxWords: exercise.maxWords,
            rubric,
        })

        // Extract individual criterion scores
        const criteriaMap: Record<string, number> = {}
        for (const c of gradingResult.criteria) {
            criteriaMap[c.id || c.name] = c.score
        }

        // Save attempt to database
        const attempt = await prisma.writingAttempt.create({
            data: {
                userId: serverUser.userId,
                exerciseId: exercise.id,
                submittedText,
                wordCount: wordCount || submittedText.trim().split(/\s+/).length,
                scoreInhalt: criteriaMap['Inhalt'] ?? criteriaMap['Vollständigkeit'] ?? null,
                scoreAngemessenheit: criteriaMap['Kommunikative Angemessenheit'] ?? criteriaMap['Formale Richtigkeit'] ?? null,
                scoreKorrektheit: criteriaMap['Korrektheit'] ?? null,
                scoreSpektrum: criteriaMap['Wortschatz & Strukturen'] ?? null,
                scoreKohaerenz: criteriaMap['Kohärenz & Kohäsion'] ?? null,
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

        return NextResponse.json({
            success: true,
            data: {
                attemptId: attempt.id,
                ...gradingResult,
            },
        })
    } catch (error: unknown) {
        // Check if it's an API key error
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
