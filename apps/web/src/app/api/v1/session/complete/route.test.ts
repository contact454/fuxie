import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const {
    withAuthMock,
    getDbUserByFirebaseUidMock,
    transactionMock,
    srsCardUpdateMock,
    srsCardFindFirstMock,
    srsCardCreateMock,
    grammarProgressUpdateManyMock,
    recordLearningActivityMock,
    invalidateLearnerProgressCachesMock,
    invalidateLearnerSrsCachesMock,
} = vi.hoisted(() => ({
    withAuthMock: vi.fn(),
    getDbUserByFirebaseUidMock: vi.fn(),
    transactionMock: vi.fn(),
    srsCardUpdateMock: vi.fn(),
    srsCardFindFirstMock: vi.fn(),
    srsCardCreateMock: vi.fn(),
    grammarProgressUpdateManyMock: vi.fn(),
    recordLearningActivityMock: vi.fn(),
    invalidateLearnerProgressCachesMock: vi.fn(),
    invalidateLearnerSrsCachesMock: vi.fn(),
}))

vi.mock('@/lib/auth/middleware', () => ({
    withAuth: withAuthMock,
    AuthError: class AuthError extends Error {},
    NotFoundError: class NotFoundError extends Error {},
}))

vi.mock('@/lib/auth/db-user', () => ({
    getDbUserByFirebaseUid: getDbUserByFirebaseUidMock,
}))

vi.mock('@/lib/progress/learning-activity', () => ({
    recordLearningActivity: recordLearningActivityMock,
}))

vi.mock('@/lib/progress/cache-invalidation', () => ({
    invalidateLearnerProgressCaches: invalidateLearnerProgressCachesMock,
    invalidateLearnerSrsCaches: invalidateLearnerSrsCachesMock,
}))

vi.mock('@fuxie/database', () => ({
    prisma: {
        $transaction: transactionMock,
    },
}))

import { POST } from './route'

const now = new Date('2026-09-11T07:00:00.000Z')
const review = (data: unknown, correct = true) => ({ type: 'VOCAB_REVIEW', correct, data })
const complete = (results: unknown[], extra: Record<string, unknown> = {}) => POST({
    json: async () => ({ totalXp: 40, heartsRemaining: 4, level: 'A1', results, ...extra }),
} as any)
const cardNotFound = { success: false, error: { code: 'NOT_FOUND', message: 'Card not found' } }

function expectNoCompletionEffects() {
    expect(srsCardFindFirstMock).not.toHaveBeenCalled()
    expect(srsCardCreateMock).not.toHaveBeenCalled()
    expect(grammarProgressUpdateManyMock).not.toHaveBeenCalled()
    expect(recordLearningActivityMock).not.toHaveBeenCalled()
    expect(invalidateLearnerSrsCachesMock).not.toHaveBeenCalled()
    expect(invalidateLearnerProgressCachesMock).not.toHaveBeenCalled()
}

describe('POST /api/v1/session/complete', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        vi.useFakeTimers({ toFake: ['Date'] })
        vi.setSystemTime(now)
        withAuthMock.mockResolvedValue({ userId: 'firebase-user-1' })
        getDbUserByFirebaseUidMock.mockResolvedValue({ id: 'db-user-1' })
        srsCardUpdateMock.mockResolvedValue({ count: 1 })
        srsCardFindFirstMock.mockResolvedValue(null)
        srsCardCreateMock.mockResolvedValue({})
        grammarProgressUpdateManyMock.mockResolvedValue({ count: 1 })
        recordLearningActivityMock.mockResolvedValue({
            xpEarned: 40,
            baseXpEarned: 40,
            streakBonusXp: 0,
            streak: {
                currentStreak: 2,
                isNewDay: false,
            },
        })
        invalidateLearnerProgressCachesMock.mockResolvedValue(undefined)
        invalidateLearnerSrsCachesMock.mockResolvedValue(undefined)
        transactionMock.mockImplementation(async (callback: (tx: any) => Promise<any>) =>
            callback({
                srsCard: {
                    updateMany: srsCardUpdateMock,
                    findFirst: srsCardFindFirstMock,
                    create: srsCardCreateMock,
                },
                grammarProgress: {
                    updateMany: grammarProgressUpdateManyMock,
                },
            })
        )
    })

    afterEach(() => vi.useRealTimers())

    it.each([true, false])('schedules an owned card with correct=%s using the authenticated DB owner', async (correct) => {
        const response = await complete(
            [review({ cardId: 'owned-card', userId: 'victim-user' }, correct)],
            { userId: 'victim-user' },
        )

        expect(response.status).toBe(200)
        expect(srsCardUpdateMock).toHaveBeenCalledExactlyOnceWith({
            where: { id: 'owned-card', userId: 'db-user-1' },
            data: { nextReviewAt: new Date(now.getTime() + (correct ? 86400000 : 0)) },
        })
        expect(recordLearningActivityMock).toHaveBeenCalledOnce()
        expect(invalidateLearnerSrsCachesMock).toHaveBeenCalledWith('db-user-1')
    })

    it.each(['foreign-card', 'missing-card', 'not-a-uuid', ' owned-card '])(
        'returns the same generic 404 for an unavailable raw card ID: %s', async (cardId) => {
            srsCardUpdateMock.mockResolvedValue({ count: 0 })
            const response = await complete([review({ cardId })])

            expect(response.status).toBe(404)
            await expect(response.json()).resolves.toEqual(cardNotFound)
            expect(srsCardUpdateMock).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: cardId, userId: 'db-user-1' },
            }))
            expectNoCompletionEffects()
        },
    )

    it.each([
        ['missing data', undefined],
        ['null data', null],
        ['missing card ID', {}],
        ['null card ID', { cardId: null }],
        ['empty card ID', { cardId: '' }],
        ['whitespace card ID', { cardId: ' \t\n ' }],
        ['numeric card ID', { cardId: 1 }],
        ['boolean card ID', { cardId: true }],
        ['array card ID', { cardId: ['owned-card'] }],
        ['object card ID', { cardId: { not: '' } }],
    ])('rejects %s before any database mutation', async (_label, data) => {
        const response = await complete([review(data)])

        expect(response.status).toBe(404)
        await expect(response.json()).resolves.toEqual(cardNotFound)
        expect(srsCardUpdateMock).not.toHaveBeenCalled()
        expectNoCompletionEffects()
    })

    it.each(['foreign', 'malformed'])('rejects a mixed batch when a later card is %s', async (kind) => {
        srsCardUpdateMock.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 })
        const response = await complete([
            review({ cardId: 'owned-card' }),
            review(kind === 'foreign' ? { cardId: 'foreign-card' } : {}),
            { type: 'VOCAB_NEW', correct: true, data: { itemId: 'word-1' } },
            { type: 'GRAMMAR', correct: true, data: { lessonId: 'grammar-1' } },
        ])

        expect(response.status).toBe(404)
        await expect(response.json()).resolves.toEqual(cardNotFound)
        expect(srsCardUpdateMock).toHaveBeenCalledTimes(kind === 'foreign' ? 2 : 1)
        expectNoCompletionEffects()
        // The isolated PostgreSQL probe, rather than this callback mock, proves rollback.
    })

    it('preserves progress-cache invalidation for a grammar-only session', async () => {
        const response = await complete([
            { type: 'GRAMMAR', correct: true, data: { lessonId: 'grammar-1' } },
        ])

        expect(response.status).toBe(200)
        expect(srsCardUpdateMock).not.toHaveBeenCalled()
        expect(recordLearningActivityMock).toHaveBeenCalledOnce()
        expect(invalidateLearnerProgressCachesMock).toHaveBeenCalledWith('db-user-1')
        expect(invalidateLearnerSrsCachesMock).not.toHaveBeenCalled()
    })

    it('maps mixed session results into the shared activity model', async () => {
        const response = await POST({
            json: async () => ({
                totalXp: 40,
                heartsRemaining: 4,
                level: 'A1',
                results: [
                    { type: 'VOCAB_REVIEW', correct: true, data: { cardId: 'card-1' } },
                    { type: 'VOCAB_NEW', correct: true, data: { itemId: 'word-1' } },
                    { type: 'GRAMMAR', correct: true, data: { lessonId: 'grammar-1' } },
                ],
            }),
        } as any)

        expect(response.status).toBe(200)
        await expect(response.json()).resolves.toEqual({
            success: true,
            data: {
                heartsRemaining: 4,
                level: 'A1',
            },
        })

        expect(srsCardFindFirstMock).toHaveBeenCalledWith({
            where: { userId: 'db-user-1', vocabularyItemId: 'word-1' },
        })
        expect(grammarProgressUpdateManyMock).toHaveBeenCalledWith({
            where: { userId: 'db-user-1', lessonId: 'grammar-1' },
            data: { completed: true, stars: 3 },
        })
        expect(recordLearningActivityMock).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                userId: 'db-user-1',
                exerciseId: 'session:A1',
                xpEarned: 40,
                lessonsCompleted: 1,
                srsReviewed: 1,
                wordsLearned: 1,
                analytics: {
                    actionId: 'session:A1',
                    actionType: 'lesson_session',
                    level: 'A1',
                    source: 'session.complete',
                    metadata: {
                        review_count: 1,
                        new_vocab_count: 1,
                        grammar_count: 1,
                    },
                },
            })
        )
        expect(invalidateLearnerSrsCachesMock).toHaveBeenCalledWith('db-user-1')
        expect(invalidateLearnerProgressCachesMock).not.toHaveBeenCalled()
    })
})
