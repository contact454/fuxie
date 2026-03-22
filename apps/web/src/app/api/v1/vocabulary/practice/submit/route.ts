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
        wordId: z.string().uuid().optional(),
        questionType: z.string().optional(),
    })),
})

function buildDisplayWord(word: { word: string; article: string | null }) {
    if (!word.article) return word.word

    return `${word.article === 'MASKULIN' ? 'der' : word.article === 'FEMININ' ? 'die' : 'das'} ${word.word}`
}

function deriveCorrectAnswer(
    answer: { correctAnswer: string; questionType?: string; wordId?: string },
    word?: {
        word: string
        article: string | null
        meaningVi: string
        exampleSentence1: string | null
    }
) {
    if (!word) {
        return answer.correctAnswer
    }

    switch (answer.questionType) {
        case 'de_to_vi':
        case 'pair':
            return word.meaningVi
        case 'vi_to_de':
        case 'image_to_word':
        case 'audio_to_word':
            return buildDisplayWord(word)
        case 'spelling':
        case 'cloze':
            return word.word
        case 'scramble':
            return word.exampleSentence1 ?? answer.correctAnswer
        default:
            return answer.correctAnswer
    }
}

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

        const wordIds = [...new Set(answers.map(a => a.wordId).filter((id): id is string => Boolean(id)))]
        const wordMap = new Map<string, {
            word: string
            article: string | null
            meaningVi: string
            exampleSentence1: string | null
        }>()

        if (wordIds.length > 0) {
            const words = await prisma.vocabularyItem.findMany({
                where: {
                    id: { in: wordIds },
                    cefrLevel,
                    theme: { slug: themeSlug },
                },
                select: {
                    id: true,
                    word: true,
                    article: true,
                    meaningVi: true,
                    exampleSentence1: true,
                },
            })

            for (const word of words) {
                wordMap.set(word.id, word)
            }
        }

        // Grade each answer
        const results = answers.map(a => {
            const correctAnswer = deriveCorrectAnswer(a, a.wordId ? wordMap.get(a.wordId) : undefined)
            const isCorrect = a.answer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
            return {
                questionId: a.questionId,
                userAnswer: a.answer,
                correctAnswer,
                isCorrect,
            }
        })

        const correctCount = results.filter(r => r.isCorrect).length
        const accuracy = answers.length > 0 ? (correctCount / answers.length) * 100 : 0
        const xpEarned = calculateXp(results, timeTaken)

        // Save attempt + update XP atomically in a transaction
        const attempt = await prisma.$transaction(async (tx) => {
            const newAttempt = await tx.vocabExerciseAttempt.create({
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

            // Update user XP in same transaction (atomic — both succeed or both fail)
            await tx.userProfile.updateMany({
                where: { userId },
                data: { totalXp: { increment: xpEarned } },
            })

            return newAttempt
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
