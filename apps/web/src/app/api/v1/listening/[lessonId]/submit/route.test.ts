import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
    getServerUserMock,
    cookiesMock,
    findLessonMock,
    createAttemptMock,
    transactionMock,
    recordLearningActivityMock,
    awardLearningFucoinMock,
    invalidateLearnerProgressCachesMock,
} = vi.hoisted(() => ({
    getServerUserMock: vi.fn(),
    cookiesMock: vi.fn(),
    findLessonMock: vi.fn(),
    createAttemptMock: vi.fn(),
    transactionMock: vi.fn(),
    recordLearningActivityMock: vi.fn(),
    awardLearningFucoinMock: vi.fn(),
    invalidateLearnerProgressCachesMock: vi.fn(),
}))

vi.mock('@/lib/auth/server-auth', () => ({
    getServerUser: getServerUserMock,
}))

vi.mock('next/headers', () => ({
    cookies: cookiesMock,
}))

vi.mock('@fuxie/database', () => ({
    prisma: {
        listeningLesson: {
            findUnique: findLessonMock,
        },
        $transaction: transactionMock,
    },
}))

vi.mock('@/lib/progress/learning-activity', () => ({
    calculateListeningXp: vi.fn((percentage: number) => (percentage >= 100 ? 20 : 10)),
    recordLearningActivity: recordLearningActivityMock,
}))

vi.mock('@/lib/progress/cache-invalidation', () => ({
    invalidateLearnerProgressCaches: invalidateLearnerProgressCachesMock,
}))

vi.mock('@/lib/gamification/fucoin', () => ({
    awardLearningFucoin: awardLearningFucoinMock,
}))

import { POST } from './route'

describe('POST /api/v1/listening/[lessonId]/submit', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        getServerUserMock.mockResolvedValue({ userId: 'user-1' })
        cookiesMock.mockResolvedValue({
            get: vi.fn().mockReturnValue({ value: 'vi' }),
        })
        findLessonMock.mockResolvedValue({
            id: 'listening-db-id',
            lessonId: 'L-A1-GOETHE-001-T1',
            questions: [
                {
                    id: 'q1',
                    questionNumber: 1,
                    questionText: 'Was hören Sie?',
                    questionType: 'mc_abc',
                    options: ['a', 'b'],
                    correctAnswer: 'a',
                    explanation: 'Deutsch',
                    explanationTrans: { vi: 'Tiếng Việt' },
                },
            ],
        })
        createAttemptMock.mockResolvedValue({ id: 'attempt-listening-1' })
        recordLearningActivityMock.mockResolvedValue({
            xpEarned: 20,
            baseXpEarned: 20,
            streakBonusXp: 0,
            streak: {
                currentStreak: 2,
                isNewDay: false,
            },
        })
        awardLearningFucoinMock.mockResolvedValue({
            fucoinEarned: 7,
            walletBalance: 42,
            duplicate: false,
            intendedAmount: 7,
            dailyCap: 60,
            dailyEarnedBefore: 0,
            dailyRemainingAfter: 53,
            capReached: false,
        })
        invalidateLearnerProgressCachesMock.mockResolvedValue(undefined)
        transactionMock.mockImplementation(async (callback: (tx: any) => Promise<any>) =>
            callback({
                listeningAttempt: {
                    create: createAttemptMock,
                },
            })
        )
    })

    it('returns a graded listening attempt with localized explanations', async () => {
        const response = await POST(
            {
                json: async () => ({
                    answers: { q1: 'A' },
                    timeTaken: 18,
                    listenCount: 2,
                }),
            } as any,
            { params: Promise.resolve({ lessonId: 'L-A1-GOETHE-001-T1' }) }
        )

        expect(response.status).toBe(200)
        await expect(response.json()).resolves.toMatchObject({
            success: true,
            data: {
                attemptId: 'attempt-listening-1',
                score: 1,
                percentage: 100,
                xpEarned: 20,
                fucoinEarned: 7,
                walletBalance: 42,
                listenCount: 2,
                questionResults: [
                    expect.objectContaining({
                        explanationNative: 'Tiếng Việt',
                    }),
                ],
            },
        })

        expect(recordLearningActivityMock).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                userId: 'user-1',
                exerciseId: 'L-A1-GOETHE-001-T1',
                score: 1,
                maxScore: 1,
                percentScore: 100,
                xpEarned: 20,
                exercisesCompleted: 1,
            })
        )
        expect(awardLearningFucoinMock).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                userId: 'user-1',
                kind: 'lesson',
                sourceType: 'learning:listening',
                sourceId: 'attempt-listening-1',
                accuracy: 100,
            })
        )
        expect(invalidateLearnerProgressCachesMock).toHaveBeenCalledWith('user-1')
    })

    it('returns 404 when the lesson is missing', async () => {
        findLessonMock.mockResolvedValueOnce(null)

        const response = await POST(
            { json: async () => ({ answers: { q1: 'A' } }) } as any,
            { params: Promise.resolve({ lessonId: 'missing' }) }
        )

        expect(response.status).toBe(404)
        await expect(response.json()).resolves.toEqual({
            success: false,
            error: 'Lesson not found',
        })
    })
})
