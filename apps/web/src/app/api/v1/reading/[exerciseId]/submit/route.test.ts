import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
    getServerUserMock,
    findExerciseMock,
    createAttemptMock,
    transactionMock,
    handleApiErrorMock,
    recordLearningActivityMock,
    invalidateLearnerProgressCachesMock,
} = vi.hoisted(
    () => ({
        getServerUserMock: vi.fn(),
        findExerciseMock: vi.fn(),
        createAttemptMock: vi.fn(),
        transactionMock: vi.fn(),
        handleApiErrorMock: vi.fn((error: unknown) =>
            Response.json(
                {
                    success: false,
                    error: {
                        code: 'TEST_ERROR',
                        message: error instanceof Error ? error.message : String(error),
                    },
                },
                { status: 500 }
            )
        ),
        recordLearningActivityMock: vi.fn(),
        invalidateLearnerProgressCachesMock: vi.fn(),
    })
)

vi.mock('@/lib/auth/server-auth', () => ({
    getServerUser: getServerUserMock,
}))

vi.mock('@/lib/api/error-handler', () => ({
    handleApiError: handleApiErrorMock,
}))

vi.mock('@fuxie/database', () => ({
    prisma: {
        readingExercise: {
            findUnique: findExerciseMock,
        },
        $transaction: transactionMock,
    },
}))

vi.mock('@/lib/progress/learning-activity', () => ({
    calculateReadingXp: vi.fn((percentage: number) => (percentage >= 100 ? 20 : 10)),
    recordLearningActivity: recordLearningActivityMock,
}))

vi.mock('@/lib/progress/cache-invalidation', () => ({
    invalidateLearnerProgressCaches: invalidateLearnerProgressCachesMock,
}))

import { POST } from './route'

describe('POST /api/v1/reading/[exerciseId]/submit', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        getServerUserMock.mockResolvedValue({ userId: 'user-1' })
        findExerciseMock.mockResolvedValue({
            id: 'reading-db-id',
            exerciseId: 'A1-T1-001',
            questions: [
                {
                    id: 'q1',
                    questionNumber: 1,
                    questionType: 'richtig_falsch',
                    statement: 'Aussage',
                    linkedText: 'TextA',
                    options: null,
                    correctAnswer: 'richtig',
                    points: 1,
                    explanation: { de: 'Begründung' },
                },
                {
                    id: 'q2',
                    questionNumber: 2,
                    questionType: 'mc_abc',
                    statement: 'Frage',
                    linkedText: null,
                    options: ['a', 'b', 'c'],
                    correctAnswer: 'b',
                    points: 1,
                    explanation: { de: 'Evidenz' },
                },
            ],
        })
        createAttemptMock.mockResolvedValue({ id: 'attempt-reading-1' })
        recordLearningActivityMock.mockResolvedValue({
            xpEarned: 10,
            baseXpEarned: 10,
            streakBonusXp: 0,
            streak: {
                currentStreak: 4,
                isNewDay: false,
            },
        })
        invalidateLearnerProgressCachesMock.mockResolvedValue(undefined)
        transactionMock.mockImplementation(async (callback: (tx: any) => Promise<any>) =>
            callback({
                readingAttempt: {
                    create: createAttemptMock,
                },
            })
        )
    })

    it('returns a graded reading attempt for authenticated users', async () => {
        const response = await POST(
            {
                json: async () => ({
                    answers: { q1: 'Richtig', q2: 'a' },
                    timeTaken: 42,
                }),
            } as any,
            { params: Promise.resolve({ exerciseId: 'A1-T1-001' }) }
        )

        expect(response.status).toBe(200)
        await expect(response.json()).resolves.toMatchObject({
            success: true,
            data: {
                attemptId: 'attempt-reading-1',
                score: 1,
                totalQuestions: 2,
                percentage: 50,
                xpEarned: 10,
            },
        })

        expect(createAttemptMock).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    userId: 'user-1',
                    exerciseId: 'reading-db-id',
                    score: 1,
                    percentage: 50,
                }),
            })
        )
        expect(recordLearningActivityMock).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                userId: 'user-1',
                exerciseId: 'A1-T1-001',
                score: 1,
                maxScore: 2,
                percentScore: 50,
                xpEarned: 10,
                exercisesCompleted: 1,
            })
        )
        expect(invalidateLearnerProgressCachesMock).toHaveBeenCalledWith('user-1')
    })

    it('returns 401 when the user is not authenticated', async () => {
        getServerUserMock.mockResolvedValueOnce(null)

        const response = await POST(
            { json: async () => ({ answers: {} }) } as any,
            { params: Promise.resolve({ exerciseId: 'A1-T1-001' }) }
        )

        expect(response.status).toBe(401)
        await expect(response.json()).resolves.toEqual({
            success: false,
            error: 'Not authenticated',
        })
    })
})
