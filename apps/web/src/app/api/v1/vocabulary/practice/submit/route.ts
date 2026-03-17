import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@fuxie/database'
import { withAuth } from '@/lib/auth/middleware'
import { handleApiError } from '@/lib/api/error-handler'

const VALID_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
const VALID_TYPES = ['mc', 'matching', 'spelling', 'cloze', 'scramble', 'speed'] as const

const submitSchema = z.object({
    exerciseType: z.enum(VALID_TYPES),
    themeSlug: z.string(),
    cefrLevel: z.enum(VALID_LEVELS),
    timeTaken: z.number().min(0).optional(),
    answers: z.array(z.object({
        questionId: z.string(),
        answer: z.string(),
        correctAnswer: z.string(),
    })),
})

// XP calculation
function calculateXp(answers: { isCorrect: boolean }[], timeTaken?: number): number {
    let xp = 0
    let streak = 0

    for (const a of answers) {
        if (a.isCorrect) {
            streak++
            const base = 5
            const streakBonus = Math.min(streak - 1, 2) * 3 // max +6
            xp += base + streakBonus
        } else {
            streak = 0
        }
    }

    // Perfect round bonus
    if (answers.every(a => a.isCorrect)) {
        xp += 20
    }

    // Speed bonus (if total time < 3s per question)
    if (timeTaken && answers.length > 0 && timeTaken / answers.length < 3) {
        xp += answers.filter(a => a.isCorrect).length * 2
    }

    return xp
}

/**
 * POST /api/v1/vocabulary/practice/submit
 * Grade answers and save attempt
 */
export async function POST(req: NextRequest) {
    try {
        const { userId } = await withAuth(req)
        const body = await req.json()
        const { exerciseType, themeSlug, cefrLevel, timeTaken, answers } = submitSchema.parse(body)

        // Grade each answer
        const results = answers.map(a => {
            const isCorrect = a.answer.trim().toLowerCase() === a.correctAnswer.trim().toLowerCase()
            return {
                questionId: a.questionId,
                userAnswer: a.answer,
                correctAnswer: a.correctAnswer,
                isCorrect,
            }
        })

        const correctCount = results.filter(r => r.isCorrect).length
        const accuracy = answers.length > 0 ? (correctCount / answers.length) * 100 : 0
        const xpEarned = calculateXp(results, timeTaken)

        // Save attempt
        const attempt = await prisma.vocabExerciseAttempt.create({
            data: {
                userId,
                exerciseType,
                themeSlug,
                cefrLevel,
                totalQuestions: answers.length,
                correctCount,
                score: xpEarned,
                timeTaken: timeTaken ?? null,
                accuracy,
                details: { results } as any,
            },
        })

        // Update user XP
        await prisma.userProfile.updateMany({
            where: { userId },
            data: { totalXp: { increment: xpEarned } },
        })

        return NextResponse.json({
            success: true,
            data: {
                attemptId: attempt.id,
                exerciseType,
                totalQuestions: answers.length,
                correctCount,
                accuracy: Math.round(accuracy),
                xpEarned,
                results,
            },
        })
    } catch (error) {
        return handleApiError(error)
    }
}
