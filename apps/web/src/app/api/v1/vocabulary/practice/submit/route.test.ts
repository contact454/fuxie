import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
    withAuthMock,
    getDbUserByFirebaseUidMock,
    cookiesMock,
    vocabularyFindManyMock,
    createAttemptMock,
    transactionMock,
    recordLearningActivityMock,
    awardLearningFucoinMock,
    invalidateLearnerProgressCachesMock,
} = vi.hoisted(() => ({
    withAuthMock: vi.fn(),
    getDbUserByFirebaseUidMock: vi.fn(),
    cookiesMock: vi.fn(),
    vocabularyFindManyMock: vi.fn(),
    createAttemptMock: vi.fn(),
    transactionMock: vi.fn(),
    recordLearningActivityMock: vi.fn(),
    awardLearningFucoinMock: vi.fn(),
    invalidateLearnerProgressCachesMock: vi.fn(),
}))

vi.mock('@/lib/auth/middleware', () => ({
    withAuth: withAuthMock,
    AuthError: class AuthError extends Error {},
}))

vi.mock('@/lib/auth/db-user', () => ({
    getDbUserByFirebaseUid: getDbUserByFirebaseUidMock,
}))

vi.mock('next/headers', () => ({
    cookies: cookiesMock,
}))

vi.mock('@fuxie/database', () => ({
    prisma: {
        vocabularyItem: {
            findMany: vocabularyFindManyMock,
        },
        $transaction: transactionMock,
    },
}))

vi.mock('@/lib/progress/learning-activity', () => ({
    recordLearningActivity: recordLearningActivityMock,
}))

vi.mock('@/lib/progress/cache-invalidation', () => ({
    invalidateLearnerProgressCaches: invalidateLearnerProgressCachesMock,
}))

vi.mock('@/lib/gamification/fucoin', () => ({
    awardLearningFucoin: awardLearningFucoinMock,
}))

import { POST } from './route'

describe('POST /api/v1/vocabulary/practice/submit', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        withAuthMock.mockResolvedValue({ userId: 'user-1' })
        getDbUserByFirebaseUidMock.mockResolvedValue({ id: 'db-user-1' })
        cookiesMock.mockResolvedValue({
            get: vi.fn().mockReturnValue({ value: 'vi' }),
        })
        vocabularyFindManyMock.mockResolvedValue([
            {
                id: '11111111-1111-1111-1111-111111111111',
                word: 'Apfel',
                article: 'MASKULIN',
                translations: { vi: 'quả táo', en: 'apple' },
                exampleSentence1: 'Ich esse einen Apfel.',
            },
        ])
        createAttemptMock.mockResolvedValue({ id: 'attempt-1' })
        recordLearningActivityMock.mockResolvedValue({
            xpEarned: 25,
            baseXpEarned: 25,
            streakBonusXp: 0,
            streak: {
                currentStreak: 5,
                isNewDay: false,
            },
        })
        awardLearningFucoinMock.mockResolvedValue({
            fucoinEarned: 5,
            walletBalance: 21,
            duplicate: false,
            intendedAmount: 5,
            dailyCap: 60,
            dailyEarnedBefore: 0,
            dailyRemainingAfter: 55,
            capReached: false,
        })
        invalidateLearnerProgressCachesMock.mockResolvedValue(undefined)
        transactionMock.mockImplementation(async (callback: (tx: any) => Promise<any>) =>
            callback({
                vocabExerciseAttempt: {
                    create: createAttemptMock,
                },
            })
        )
    })

    it('grades the submission and persists the attempt inside a transaction', async () => {
        const response = await POST({
            json: async () => ({
                exerciseType: 'mc',
                themeSlug: 'essen',
                cefrLevel: 'A1',
                timeTaken: 4,
                answers: [
                    {
                        questionId: 'q1',
                        answer: 'quả táo',
                        correctAnswer: '',
                        wordId: '11111111-1111-1111-1111-111111111111',
                        questionType: 'de_to_native',
                    },
                ],
            }),
        } as any)

        expect(response.status).toBe(200)
        await expect(response.json()).resolves.toMatchObject({
            success: true,
            data: {
                attemptId: 'attempt-1',
                correctCount: 1,
                accuracy: 100,
                xpEarned: 25,
                fucoinEarned: 5,
                walletBalance: 21,
            },
        })

        expect(vocabularyFindManyMock).toHaveBeenCalledOnce()
        expect(createAttemptMock).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    userId: 'db-user-1',
                    themeSlug: 'essen',
                    correctCount: 1,
                }),
            })
        )
        expect(recordLearningActivityMock).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                userId: 'db-user-1',
                exerciseId: 'vocab:A1:essen:mc',
                score: 1,
                maxScore: 1,
                percentScore: 100,
                xpEarned: 25,
                exercisesCompleted: 1,
                analytics: {
                    actionId: 'attempt-1',
                    actionType: 'vocabulary_practice',
                    level: 'A1',
                    skill: 'WORTSCHATZ',
                    source: 'vocabulary.practice.submit',
                    metadata: {
                        theme_slug: 'essen',
                        exercise_type: 'mc',
                    },
                },
            })
        )
        expect(awardLearningFucoinMock).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                userId: 'db-user-1',
                kind: 'activity',
                sourceType: 'learning:vocabulary',
                sourceId: 'attempt-1',
                accuracy: 100,
            })
        )
        expect(invalidateLearnerProgressCachesMock).toHaveBeenCalledWith('db-user-1')
    })

    it('returns a validation error for malformed payloads', async () => {
        const response = await POST({
            json: async () => ({
                exerciseType: 'mc',
                themeSlug: 'essen',
                cefrLevel: 'A1',
                answers: 'invalid',
            }),
        } as any)

        expect(response.status).toBe(400)
        await expect(response.json()).resolves.toMatchObject({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
            },
        })
    })

    it('returns an episode receipt for vocabulary mixed quest episodes', async () => {
        const response = await POST({
            json: async () => ({
                exerciseType: 'mixed',
                themeSlug: 'essen',
                cefrLevel: 'A1',
                timeTaken: 12,
                questEpisode: {
                    episodeId: 'vocab-episode:A1:essen',
                    themeSlug: 'essen',
                    cefrLevel: 'A1',
                    checkpointCount: 3,
                    nextEpisodeHref: '/vocabulary/practice/mixed?theme=essen&level=A1',
                },
                answers: [
                    {
                        questionId: 'q1',
                        answer: 'quả táo',
                        correctAnswer: '',
                        wordId: '11111111-1111-1111-1111-111111111111',
                        questionType: 'de_to_native',
                    },
                ],
            }),
        } as any)

        expect(response.status).toBe(200)
        await expect(response.json()).resolves.toMatchObject({
            success: true,
            data: {
                questEpisodeReceipt: {
                    episodeId: 'vocab-episode:A1:essen',
                    themeSlug: 'essen',
                    cefrLevel: 'A1',
                    accuracyBand: 'mastered',
                    completedCheckpoints: 3,
                    checkpointCount: 3,
                    recommendedAction: 'next_episode',
                },
                nextEpisodeHref: '/vocabulary/practice/mixed?theme=essen&level=A1',
            },
        })
        expect(recordLearningActivityMock).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                exerciseId: 'vocab:A1:essen:mixed',
                analytics: expect.objectContaining({
                    metadata: expect.objectContaining({
                        episode_id: 'vocab-episode:A1:essen',
                        checkpoint_count: 3,
                    }),
                }),
            })
        )
    })
})
