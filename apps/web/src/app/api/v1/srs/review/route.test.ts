import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
    withAuthMock,
    getDbUserByFirebaseUidMock,
    findCardMock,
    transactionMock,
    srsCardUpdateMock,
    srsReviewLogCreateMock,
    recordLearningActivityMock,
    cacheInvalidatePrefixMock,
    calculateReviewMock,
} = vi.hoisted(() => ({
    withAuthMock: vi.fn(),
    getDbUserByFirebaseUidMock: vi.fn(),
    findCardMock: vi.fn(),
    transactionMock: vi.fn(),
    srsCardUpdateMock: vi.fn(),
    srsReviewLogCreateMock: vi.fn(),
    recordLearningActivityMock: vi.fn(),
    cacheInvalidatePrefixMock: vi.fn(),
    calculateReviewMock: vi.fn(),
}))

vi.mock('@/lib/auth/middleware', () => ({
    withAuth: withAuthMock,
    NotFoundError: class NotFoundError extends Error {},
}))

vi.mock('@/lib/auth/db-user', () => ({
    getDbUserByFirebaseUid: getDbUserByFirebaseUidMock,
}))

vi.mock('@/lib/cache/redis', () => ({
    cacheInvalidatePrefix: cacheInvalidatePrefixMock,
}))

vi.mock('@fuxie/srs-engine', () => ({
    calculateReview: calculateReviewMock,
}))

vi.mock('@/lib/progress/learning-activity', () => ({
    recordLearningActivity: recordLearningActivityMock,
}))

vi.mock('@/lib/srs/due-cards', () => ({
    countDueSrsCards: vi.fn(),
    getDueSrsCards: vi.fn(),
}))

vi.mock('@fuxie/shared/constants', () => ({
    XP_REWARDS: {
        SRS_CORRECT: 5,
    },
}))

vi.mock('@fuxie/database', () => ({
    prisma: {
        srsCard: {
            findFirst: findCardMock,
        },
        $transaction: transactionMock,
    },
}))

import { POST } from './route'

describe('POST /api/v1/srs/review', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        withAuthMock.mockResolvedValue({ userId: 'firebase-user-1' })
        getDbUserByFirebaseUidMock.mockResolvedValue({ id: 'db-user-1' })
        findCardMock.mockResolvedValue({
            id: '11111111-1111-1111-1111-111111111111',
            userId: 'db-user-1',
            interval: 1,
            repetitions: 2,
            easeFactor: 2.5,
            state: 1,
            lapseCount: 0,
        })
        calculateReviewMock.mockReturnValue({
            interval: 3,
            repetitions: 3,
            easeFactor: 2.6,
            state: 2,
            lapseCount: 0,
            nextReviewAt: new Date('2026-04-24T00:00:00.000Z'),
        })
        srsCardUpdateMock.mockResolvedValue({})
        srsReviewLogCreateMock.mockResolvedValue({})
        recordLearningActivityMock.mockResolvedValue({
            xpEarned: 5,
            baseXpEarned: 5,
            streakBonusXp: 0,
            streak: {
                currentStreak: 6,
                isNewDay: false,
            },
        })
        cacheInvalidatePrefixMock.mockResolvedValue(undefined)
        transactionMock.mockImplementation(async (callback: (tx: any) => Promise<any>) =>
            callback({
                srsCard: {
                    update: srsCardUpdateMock,
                },
                srsReviewLog: {
                    create: srsReviewLogCreateMock,
                },
            })
        )
    })

    it('updates the card and tracks unified activity', async () => {
        const response = await POST({
            json: async () => ({
                cardId: '11111111-1111-1111-1111-111111111111',
                rating: 'GOOD',
                responseTimeMs: 1200,
            }),
        } as any)

        expect(response.status).toBe(200)
        await expect(response.json()).resolves.toMatchObject({
            success: true,
            data: {
                cardId: '11111111-1111-1111-1111-111111111111',
                xpEarned: 5,
                streak: {
                    currentStreak: 6,
                },
            },
        })

        expect(recordLearningActivityMock).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                userId: 'db-user-1',
                xpEarned: 5,
                srsReviewed: 1,
                updateStreak: true,
                analytics: {
                    actionId: '11111111-1111-1111-1111-111111111111',
                    actionType: 'srs_review',
                    skill: 'SRS',
                    source: 'srs.review',
                    metadata: {
                        response_time_ms: 1200,
                    },
                },
            })
        )
        expect(cacheInvalidatePrefixMock).toHaveBeenCalledTimes(7)
        expect(cacheInvalidatePrefixMock).toHaveBeenCalledWith('srs:due:db-user-1')
        expect(cacheInvalidatePrefixMock).toHaveBeenCalledWith('srs:progress:db-user-1')
        expect(cacheInvalidatePrefixMock).toHaveBeenCalledWith('dash:stats:db-user-1')
        expect(cacheInvalidatePrefixMock).toHaveBeenCalledWith('dash:content:db-user-1')
        expect(cacheInvalidatePrefixMock).toHaveBeenCalledWith('dash:today-plan:db-user-1')
        expect(cacheInvalidatePrefixMock).toHaveBeenCalledWith('dash:mission-board:db-user-1')
        expect(cacheInvalidatePrefixMock).toHaveBeenCalledWith('personalization:today:db-user-1')
    })
})
