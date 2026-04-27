import { z } from 'zod'
import { prisma } from '@fuxie/database'
import { cookies } from 'next/headers'
import { withAuth } from '@/lib/auth/middleware'
import { getDbUserByFirebaseUid } from '@/lib/auth/db-user'
import { handleApiError } from '@/lib/api/error-handler'
import { NextRequest, NextResponse } from 'next/server'
import { gradeVocabularySubmission } from '@/lib/assessment/submission-grading'
import { recordLearningActivity } from '@/lib/progress/learning-activity'
import { invalidateLearnerProgressCaches } from '@/lib/progress/cache-invalidation'

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

/**
 * POST /api/v1/vocabulary/practice/submit
 * Grade answers and save attempt
 */
export async function POST(req: NextRequest) {
    try {
        const auth = await withAuth(req)
        const user = await getDbUserByFirebaseUid(auth.userId)
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            )
        }

        const body = await req.json()
        const { exerciseType, themeSlug, cefrLevel, timeTaken, answers } = submitSchema.parse(body)

        const wordIds = [...new Set(answers.map(a => a.wordId).filter((id): id is string => Boolean(id)))]
        const wordMap = new Map<string, {
            word: string
            article: string | null
            translations: any
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
                    translations: true,
                    exampleSentence1: true,
                },
            })

            for (const word of words) {
                wordMap.set(word.id, word)
            }
        }

        const locale = (await cookies()).get('NEXT_LOCALE')?.value || 'vi'

        const { results, correctCount, accuracy, xpEarned } = gradeVocabularySubmission(
            answers,
            locale,
            wordMap,
            timeTaken
        )

        const result = await prisma.$transaction(async (tx) => {
            const attempt = await tx.vocabExerciseAttempt.create({
                data: {
                    userId: user.id,
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

            const progress = await recordLearningActivity(tx, {
                userId: user.id,
                exerciseId: `vocab:${cefrLevel}:${themeSlug}:${exerciseType}`,
                score: correctCount,
                maxScore: answers.length,
                percentScore: accuracy,
                xpEarned,
                timeSpentSeconds: timeTaken ?? null,
                exercisesCompleted: 1,
            })

            return {
                attempt,
                progress,
            }
        })

        invalidateLearnerProgressCaches(user.id).catch(() => {})

        return NextResponse.json({
            success: true,
            data: {
                attemptId: result.attempt.id,
                exerciseType,
                totalQuestions: answers.length,
                correctCount,
                accuracy: Math.round(accuracy),
                xpEarned: result.progress.xpEarned,
                streak: result.progress.streak,
                results,
            },
        })
    } catch (error) {
        return handleApiError(error)
    }
}
