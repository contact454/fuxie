import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
    withAuthMock,
    getDbUserByFirebaseUidMock,
    transactionMock,
    srsCardUpdateMock,
    srsCardFindFirstMock,
    srsCardCreateMock,
    grammarProgressUpdateManyMock,
    recordLearningActivityMock,
} = vi.hoisted(() => ({
    withAuthMock: vi.fn(),
    getDbUserByFirebaseUidMock: vi.fn(),
    transactionMock: vi.fn(),
    srsCardUpdateMock: vi.fn(),
    srsCardFindFirstMock: vi.fn(),
    srsCardCreateMock: vi.fn(),
    grammarProgressUpdateManyMock: vi.fn(),
    recordLearningActivityMock: vi.fn(),
}))

vi.mock('@/lib/auth/middleware', () => ({
    withAuth: withAuthMock,
}))

vi.mock('@/lib/auth/db-user', () => ({
    getDbUserByFirebaseUid: getDbUserByFirebaseUidMock,
}))

vi.mock('@/lib/progress/learning-activity', () => ({
    recordLearningActivity: recordLearningActivityMock,
}))

vi.mock('@fuxie/database', () => ({
    prisma: {
        $transaction: transactionMock,
    },
}))

import { POST } from './route'

describe('POST /api/v1/session/complete', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        withAuthMock.mockResolvedValue({ userId: 'firebase-user-1' })
        getDbUserByFirebaseUidMock.mockResolvedValue({ id: 'db-user-1' })
        srsCardUpdateMock.mockResolvedValue({})
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
        transactionMock.mockImplementation(async (callback: (tx: any) => Promise<any>) =>
            callback({
                srsCard: {
                    update: srsCardUpdateMock,
                    findFirst: srsCardFindFirstMock,
                    create: srsCardCreateMock,
                },
                grammarProgress: {
                    updateMany: grammarProgressUpdateManyMock,
                },
            })
        )
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
            {
                userId: 'db-user-1',
                exerciseId: 'session:A1',
                xpEarned: 40,
                lessonsCompleted: 1,
                srsReviewed: 1,
                wordsLearned: 1,
            }
        )
    })
})
