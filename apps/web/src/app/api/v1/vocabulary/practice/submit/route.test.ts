import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
    withAuthMock,
    getDbUserByFirebaseUidMock,
    cookiesMock,
    vocabularyFindManyMock,
    createAttemptMock,
    transactionMock,
    recordLearningActivityMock,
    invalidateLearnerProgressCachesMock,
} = vi.hoisted(() => ({
    withAuthMock: vi.fn(),
    getDbUserByFirebaseUidMock: vi.fn(),
    cookiesMock: vi.fn(),
    vocabularyFindManyMock: vi.fn(),
    createAttemptMock: vi.fn(),
    transactionMock: vi.fn(),
    recordLearningActivityMock: vi.fn(),
    invalidateLearnerProgressCachesMock: vi.fn(),
}))

vi.mock('@/lib/auth/middleware', () => ({
    withAuth: withAuthMock,
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
})
