import { describe, expect, it, vi } from 'vitest'
import { FucoinLedgerType, Prisma } from '@fuxie/database'

import {
    awardFucoin,
    awardLearningFucoin,
    calculateLearningFucoin,
    FucoinSpendError,
    LEARNING_FUCOIN_DAILY_CAP,
    spendFucoin,
    type EconomyDbClient,
} from './fucoin'

function uniqueConstraintError() {
    return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
    })
}

describe('Fucoin economy', () => {
    it('calculates base learning Fucoin and perfect bonus', () => {
        expect(calculateLearningFucoin({ kind: 'activity', accuracy: 80 })).toBe(3)
        expect(calculateLearningFucoin({ kind: 'lesson', accuracy: 100 })).toBe(7)
        expect(calculateLearningFucoin({ kind: 'writing' })).toBe(8)
        expect(calculateLearningFucoin({ kind: 'exam_pass', accuracy: 100 })).toBe(22)
    })

    it('creates a ledger entry and updates wallet balance', async () => {
        const tx = {
            fucoinLedger: {
                create: vi.fn().mockResolvedValue({}),
            },
            userWallet: {
                findUnique: vi.fn(),
                upsert: vi.fn().mockResolvedValue({ balance: 12 }),
            },
        }

        const result = await awardFucoin(tx as unknown as EconomyDbClient, {
            userId: 'user-1',
            amount: 12,
            sourceType: 'learning:vocabulary',
            sourceId: 'attempt-1',
            reason: 'Vocabulary practice',
        })

        expect(result).toEqual({
            fucoinEarned: 12,
            walletBalance: 12,
            duplicate: false,
        })
        expect(tx.fucoinLedger.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                userId: 'user-1',
                amount: 12,
                sourceType: 'learning:vocabulary',
                sourceId: 'attempt-1',
            }),
        })
        expect(tx.userWallet.upsert).toHaveBeenCalledWith(expect.objectContaining({
            where: { userId: 'user-1' },
            update: {
                balance: { increment: 12 },
                lifetimeEarned: { increment: 12 },
            },
        }))
    })

    it('does not award duplicate ledger sources twice', async () => {
        const tx = {
            fucoinLedger: {
                create: vi.fn().mockRejectedValue(uniqueConstraintError()),
            },
            userWallet: {
                findUnique: vi.fn().mockResolvedValue({
                    balance: 33,
                    lifetimeEarned: 40,
                    lifetimeSpent: 7,
                }),
                upsert: vi.fn(),
            },
        }

        const result = await awardFucoin(tx as unknown as EconomyDbClient, {
            userId: 'user-1',
            amount: 8,
            sourceType: 'learning:listening',
            sourceId: 'attempt-1',
            reason: 'Listening lesson',
        })

        expect(result).toEqual({
            fucoinEarned: 0,
            walletBalance: 33,
            duplicate: true,
        })
        expect(tx.userWallet.upsert).not.toHaveBeenCalled()
    })

    it('caps repeatable learning Fucoin per day', async () => {
        const tx = {
            fucoinLedger: {
                aggregate: vi.fn().mockResolvedValue({ _sum: { amount: LEARNING_FUCOIN_DAILY_CAP - 1 } }),
                create: vi.fn().mockResolvedValue({}),
            },
            userWallet: {
                findUnique: vi.fn(),
                upsert: vi.fn().mockResolvedValue({ balance: 101 }),
            },
        }

        const result = await awardLearningFucoin(tx as unknown as EconomyDbClient, {
            userId: 'user-1',
            kind: 'lesson',
            sourceType: 'learning:listening',
            sourceId: 'attempt-2',
            accuracy: 100,
            reason: 'Listening perfect',
        })

        expect(result.fucoinEarned).toBe(1)
        expect(tx.fucoinLedger.create).toHaveBeenCalledWith({
            data: expect.objectContaining({ amount: 1 }),
        })
    })

    it('spends Fucoin through an immutable spend ledger', async () => {
        const tx = {
            fucoinLedger: {
                create: vi.fn().mockResolvedValue({}),
            },
            userWallet: {
                findUnique: vi.fn()
                    .mockResolvedValueOnce({
                        balance: 150,
                        lifetimeEarned: 150,
                        lifetimeSpent: 0,
                    })
                    .mockResolvedValue({
                        balance: 30,
                        lifetimeEarned: 150,
                        lifetimeSpent: 120,
                    }),
                updateMany: vi.fn().mockResolvedValue({ count: 1 }),
            },
        }

        const result = await spendFucoin(tx as unknown as EconomyDbClient, {
            userId: 'user-1',
            amount: 120,
            sourceType: 'shop:redeem',
            sourceId: 'redeem-1',
            reason: 'Redeem approved',
        })

        expect(result).toEqual({
            fucoinSpent: 120,
            walletBalance: 30,
            duplicate: false,
        })
        expect(tx.fucoinLedger.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                type: FucoinLedgerType.SPEND,
                amount: 120,
                sourceType: 'shop:redeem',
                sourceId: 'redeem-1',
            }),
        })
        expect(tx.userWallet.updateMany).toHaveBeenCalledWith(expect.objectContaining({
            where: {
                userId: 'user-1',
                balance: { gte: 120 },
            },
            data: {
                balance: { decrement: 120 },
                lifetimeSpent: { increment: 120 },
            },
        }))
    })

    it('blocks spend when wallet balance is too low', async () => {
        const tx = {
            fucoinLedger: {
                create: vi.fn(),
            },
            userWallet: {
                findUnique: vi.fn().mockResolvedValue({
                    balance: 17,
                    lifetimeEarned: 17,
                    lifetimeSpent: 0,
                }),
                updateMany: vi.fn(),
            },
        }

        await expect(spendFucoin(tx as unknown as EconomyDbClient, {
            userId: 'user-1',
            amount: 120,
            sourceType: 'shop:redeem',
            sourceId: 'redeem-1',
            reason: 'Redeem approved',
        })).rejects.toBeInstanceOf(FucoinSpendError)
        expect(tx.fucoinLedger.create).not.toHaveBeenCalled()
        expect(tx.userWallet.updateMany).not.toHaveBeenCalled()
    })
})
