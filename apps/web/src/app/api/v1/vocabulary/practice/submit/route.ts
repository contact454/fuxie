import { z } from 'zod'
import { Prisma, prisma } from '@fuxie/database'
import { cookies } from 'next/headers'
import { withAuth } from '@/lib/auth/middleware'
import { getDbUserByFirebaseUid } from '@/lib/auth/db-user'
import { handleApiError } from '@/lib/api/error-handler'
import { NextRequest, NextResponse } from 'next/server'
import { gradeVocabularySubmission, type VocabularyWordInfo } from '@/lib/assessment/submission-grading'
import { awardLearningFucoin } from '@/lib/gamification/fucoin'
import { buildLearningQuestRewardPayload } from '@/lib/gamification/learning-quest-rewards'
import { getLearningQuestMasteryPayload } from '@/lib/gamification/skill-mastery-data'
import { buildVocabularyQuestEpisodeReceipt } from '@/lib/gamification/vocabulary-quest-episode'
import { recordLearningActivity } from '@/lib/progress/learning-activity'
import { invalidateLearnerProgressCaches } from '@/lib/progress/cache-invalidation'

const VALID_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
const VALID_TYPES = ['mc', 'matching', 'spelling', 'cloze', 'scramble', 'speed', 'mixed'] as const

const submitSchema = z.object({
    exerciseType: z.enum(VALID_TYPES),
    themeSlug: z.string(),
    cefrLevel: z.enum(VALID_LEVELS),
    timeTaken: z.number().min(0).optional(),
    questEpisode: z.object({
        episodeId: z.string().max(180),
        themeSlug: z.string().max(120),
        cefrLevel: z.enum(VALID_LEVELS),
        checkpointCount: z.number().int().min(1).max(6),
        nextEpisodeHref: z.string().max(240).optional(),
    }).optional(),
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
        const { exerciseType, themeSlug, cefrLevel, timeTaken, answers, questEpisode } = submitSchema.parse(body)
        const eligibleQuestEpisode = exerciseType === 'mixed'
            && questEpisode
            && questEpisode.themeSlug === themeSlug
            && questEpisode.cefrLevel === cefrLevel
            ? questEpisode
            : null

        const wordIds = [...new Set(answers.map(a => a.wordId).filter((id): id is string => Boolean(id)))]
        const wordMap = new Map<string, VocabularyWordInfo>()

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
                wordMap.set(word.id, {
                    word: word.word,
                    article: word.article,
                    translations: isStringRecord(word.translations) ? word.translations : null,
                    exampleSentence1: word.exampleSentence1,
                })
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
                    details: { results } as Prisma.InputJsonValue,
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
                analytics: {
                    actionId: attempt.id,
                    actionType: 'vocabulary_practice',
                    level: cefrLevel,
                    skill: 'WORTSCHATZ',
                    source: 'vocabulary.practice.submit',
                    metadata: {
                        theme_slug: themeSlug,
                        exercise_type: exerciseType,
                        ...(eligibleQuestEpisode ? {
                            episode_id: eligibleQuestEpisode.episodeId,
                            checkpoint_count: eligibleQuestEpisode.checkpointCount,
                        } : {}),
                    },
                },
            })

            const fucoin = await awardLearningFucoin(tx, {
                userId: user.id,
                kind: 'activity',
                sourceType: 'learning:vocabulary',
                sourceId: attempt.id,
                accuracy,
                reason: `Vocabulary ${cefrLevel} ${themeSlug}`,
                metadata: {
                    attemptId: attempt.id,
                    exerciseType,
                    themeSlug,
                    cefrLevel,
                    accuracy,
                    ...(eligibleQuestEpisode ? {
                        episodeId: eligibleQuestEpisode.episodeId,
                        checkpointCount: eligibleQuestEpisode.checkpointCount,
                    } : {}),
                },
            })

            return {
                attempt,
                progress,
                fucoin,
            }
        })

        invalidateLearnerProgressCaches(user.id).catch(() => {})
        const mastery = await getLearningQuestMasteryPayload({
            userId: user.id,
            skill: 'vocabulary',
            currentLevel: cefrLevel,
            sourceActionId: result.attempt.id,
            sourceActionType: 'vocabulary_practice',
            source: 'vocabulary.practice.submit',
            persistBadgeUnlock: true,
        }).catch(() => ({}))
        const questEpisodeReceipt = eligibleQuestEpisode
            ? buildVocabularyQuestEpisodeReceipt({
                episodeId: eligibleQuestEpisode.episodeId,
                themeSlug,
                cefrLevel,
                accuracy,
                totalQuestions: answers.length,
                answeredQuestions: answers.length,
                checkpointCount: eligibleQuestEpisode.checkpointCount,
                nextEpisodeHref: eligibleQuestEpisode.nextEpisodeHref,
            })
            : null

        return NextResponse.json({
            success: true,
            data: {
                attemptId: result.attempt.id,
                exerciseType,
                totalQuestions: answers.length,
                correctCount,
                accuracy: Math.round(accuracy),
                xpEarned: result.progress.xpEarned,
                fucoinEarned: result.fucoin.fucoinEarned,
                walletBalance: result.fucoin.walletBalance,
                fucoinDuplicate: result.fucoin.duplicate,
                fucoinIntended: result.fucoin.intendedAmount,
                fucoinDailyCap: result.fucoin.dailyCap,
                fucoinDailyEarned: (result.fucoin.dailyEarnedBefore ?? 0) + result.fucoin.fucoinEarned,
                fucoinDailyRemaining: result.fucoin.dailyRemainingAfter,
                fucoinCapReached: result.fucoin.capReached,
                streak: result.progress.streak,
                ...(questEpisodeReceipt ? {
                    questEpisodeReceipt,
                    nextEpisodeHref: questEpisodeReceipt.nextEpisodeHref,
                } : {}),
                ...buildLearningQuestRewardPayload({
                    skill: 'vocabulary',
                    xpEarned: result.progress.xpEarned,
                    fucoin: result.fucoin,
                    streak: result.progress.streak,
                    ...mastery,
                }),
                results,
            },
        })
    } catch (error) {
        return handleApiError(error)
    }
}

function isStringRecord(value: Prisma.JsonValue): value is Record<string, string> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return false
    }

    return Object.values(value).every((item) => typeof item === 'string')
}
