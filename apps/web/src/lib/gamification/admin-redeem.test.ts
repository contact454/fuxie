import { FucoinLedgerType, ShopRedeemRequestStatus } from '@fuxie/database'
import { describe, expect, it, vi } from 'vitest'

import {
    AdminRedeemReviewError,
    countShopRedeemRequestsByStatus,
    fulfillShopRedeemRequest,
    getAdminRedeemQueueCounts,
    listShopRedeemRequests,
    reviewShopRedeemRequest,
    type AdminRedeemDbClient,
} from './admin-redeem'

const redeemRow = {
    id: 'redeem-1',
    itemId: 'streak-freeze',
    itemTitle: 'Streak Freeze',
    itemCategory: 'support',
    itemBenefit: 'Bảo vệ streak 1 ngày',
    cost: 120,
    walletBalanceAtRequest: 150,
    status: ShopRedeemRequestStatus.PENDING,
    statusReason: 'Awaiting approval',
    requestedAt: new Date('2026-04-29T09:00:00.000Z'),
    reviewedAt: null,
    fulfilledAt: null,
    updatedAt: new Date('2026-04-29T09:00:00.000Z'),
    user: {
        email: 'learner@example.com',
        profile: {
            displayName: 'Learner',
            currentLevel: 'A1',
        },
    },
}

function mockTx(
    status: ShopRedeemRequestStatus = ShopRedeemRequestStatus.PENDING,
    walletBalance = 150,
    options: {
        itemId?: string
        itemTitle?: string
        fulfilledAt?: Date | null
    } = {}
) {
    const itemId = options.itemId ?? redeemRow.itemId
    const itemTitle = options.itemTitle ?? redeemRow.itemTitle
    const fulfilledAt = options.fulfilledAt ?? null

    return {
        userStreak: {
            upsert: vi.fn().mockResolvedValue({
                userId: 'user-1',
                freezesAvailable: 2,
            }),
        },
        userWallet: {
            findUnique: vi.fn()
                .mockResolvedValueOnce({
                    balance: walletBalance,
                    lifetimeEarned: walletBalance,
                    lifetimeSpent: 0,
                })
                .mockResolvedValue({
                    balance: Math.max(0, walletBalance - redeemRow.cost),
                    lifetimeEarned: walletBalance,
                    lifetimeSpent: redeemRow.cost,
                }),
            updateMany: vi.fn().mockResolvedValue({
                count: walletBalance >= redeemRow.cost ? 1 : 0,
            }),
        },
        fucoinLedger: {
            create: vi.fn().mockResolvedValue({
                id: 'ledger-1',
            }),
        },
        shopRedeemRequest: {
            findMany: vi.fn().mockResolvedValue([redeemRow]),
            findUnique: vi.fn().mockResolvedValue({
                id: redeemRow.id,
                userId: 'user-1',
                itemId,
                itemTitle,
                cost: redeemRow.cost,
                status,
                fulfilledAt,
            }),
            update: vi.fn().mockResolvedValue({
                ...redeemRow,
                status: ShopRedeemRequestStatus.APPROVED,
                statusReason: 'Approved',
                reviewedAt: new Date('2026-04-29T10:00:00.000Z'),
            }),
            groupBy: vi.fn().mockResolvedValue([
                {
                    status: ShopRedeemRequestStatus.PENDING,
                    _count: { _all: 2 },
                },
                {
                    status: ShopRedeemRequestStatus.APPROVED,
                    _count: { _all: 1 },
                },
            ]),
            count: vi.fn().mockResolvedValue(1),
        },
    } as unknown as AdminRedeemDbClient
}

describe('admin redeem review', () => {
    it('lists pending redeem requests', async () => {
        const tx = mockTx()
        const result = await listShopRedeemRequests(tx, {
            status: ShopRedeemRequestStatus.PENDING,
        })

        expect(result).toHaveLength(1)
        expect(result[0]).toMatchObject({
            id: 'redeem-1',
            status: ShopRedeemRequestStatus.PENDING,
            user: { email: 'learner@example.com' },
        })
        expect(tx.shopRedeemRequest.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: { status: ShopRedeemRequestStatus.PENDING },
        }))
    })

    it('approves a pending request by writing a spend ledger and updating the wallet', async () => {
        const tx = mockTx()
        const result = await reviewShopRedeemRequest(tx, {
            requestId: 'redeem-1',
            action: 'approve',
            reason: 'Approved',
        })

        expect(result.status).toBe(ShopRedeemRequestStatus.APPROVED)
        expect(tx.fucoinLedger.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                userId: 'user-1',
                amount: 120,
                type: FucoinLedgerType.SPEND,
                sourceType: 'shop:redeem',
                sourceId: 'redeem-1',
            }),
        }))
        expect(tx.userWallet.updateMany).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({
                userId: 'user-1',
                balance: { gte: 120 },
            }),
            data: expect.objectContaining({
                balance: { decrement: 120 },
                lifetimeSpent: { increment: 120 },
            }),
        }))
        expect(tx.shopRedeemRequest.update).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                status: ShopRedeemRequestStatus.APPROVED,
                statusReason: 'Approved',
            }),
        }))
    })

    it('rejects approval when learner wallet is no longer enough', async () => {
        const tx = mockTx(ShopRedeemRequestStatus.PENDING, 17)

        await expect(reviewShopRedeemRequest(tx, {
            requestId: 'redeem-1',
            action: 'approve',
        })).rejects.toMatchObject({
            status: 402,
            code: 'insufficient_funds',
        } satisfies Partial<AdminRedeemReviewError>)
        expect(tx.fucoinLedger.create).not.toHaveBeenCalled()
        expect(tx.shopRedeemRequest.update).not.toHaveBeenCalled()
    })

    it('rejects a pending request without spending Fucoin', async () => {
        const tx = mockTx()
        await reviewShopRedeemRequest(tx, {
            requestId: 'redeem-1',
            action: 'reject',
            reason: 'Rejected',
        })

        expect(tx.fucoinLedger.create).not.toHaveBeenCalled()
        expect(tx.userWallet.updateMany).not.toHaveBeenCalled()
        expect(tx.shopRedeemRequest.update).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                status: ShopRedeemRequestStatus.REJECTED,
                statusReason: 'Rejected',
            }),
        }))
    })

    it('counts requests by status for admin filters', async () => {
        const tx = mockTx()
        const result = await countShopRedeemRequestsByStatus(tx)

        expect(result).toEqual([
            { status: ShopRedeemRequestStatus.PENDING, count: 2 },
            { status: ShopRedeemRequestStatus.APPROVED, count: 1 },
        ])
        expect(tx.shopRedeemRequest.groupBy).toHaveBeenCalledWith({
            by: ['status'],
            _count: {
                _all: true,
            },
        })
    })

    it('counts the approved awaiting fulfillment queue', async () => {
        const tx = mockTx()
        const result = await getAdminRedeemQueueCounts(tx)

        expect(result.awaitingFulfillment).toBe(1)
        expect(tx.shopRedeemRequest.count).toHaveBeenCalledWith({
            where: {
                status: ShopRedeemRequestStatus.APPROVED,
                fulfilledAt: null,
            },
        })
    })

    it('marks approved streak-freeze requests as fulfilled and grants one freeze without additional spend', async () => {
        const tx = mockTx(ShopRedeemRequestStatus.APPROVED)
        await fulfillShopRedeemRequest(tx, {
            requestId: 'redeem-1',
            reason: 'Manual delivery completed',
        })

        expect(tx.userStreak.upsert).toHaveBeenCalledWith({
            where: { userId: 'user-1' },
            update: {
                freezesAvailable: { increment: 1 },
            },
            create: {
                userId: 'user-1',
                freezesAvailable: 1,
            },
        })
        expect(tx.fucoinLedger.create).not.toHaveBeenCalled()
        expect(tx.userWallet.updateMany).not.toHaveBeenCalled()
        expect(tx.shopRedeemRequest.update).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                statusReason: 'Manual delivery completed',
                fulfilledAt: expect.any(Date),
            }),
        }))
    })

    it('marks non-safe in-app rewards as fulfilled without applying automatic effects', async () => {
        const tx = mockTx(ShopRedeemRequestStatus.APPROVED, 150, {
            itemId: 'fuxie-sky-outfit',
            itemTitle: 'Fuxie Sky Outfit',
        })
        await fulfillShopRedeemRequest(tx, {
            requestId: 'redeem-1',
        })

        expect(tx.userStreak.upsert).not.toHaveBeenCalled()
        expect(tx.fucoinLedger.create).not.toHaveBeenCalled()
        expect(tx.userWallet.updateMany).not.toHaveBeenCalled()
        expect(tx.shopRedeemRequest.update).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                statusReason: 'Marked fulfilled by admin. Manual delivery recorded; no automatic unlock was executed.',
                fulfilledAt: expect.any(Date),
            }),
        }))
    })

    it('blocks duplicate fulfillment so safe in-app rewards cannot be granted twice', async () => {
        const tx = mockTx(ShopRedeemRequestStatus.APPROVED, 150, {
            fulfilledAt: new Date('2026-04-29T11:00:00.000Z'),
        })

        await expect(fulfillShopRedeemRequest(tx, {
            requestId: 'redeem-1',
        })).rejects.toMatchObject({
            status: 409,
            code: 'already_fulfilled',
        } satisfies Partial<AdminRedeemReviewError>)
        expect(tx.userStreak.upsert).not.toHaveBeenCalled()
        expect(tx.shopRedeemRequest.update).not.toHaveBeenCalled()
    })

    it('blocks fulfillment before approval', async () => {
        const tx = mockTx(ShopRedeemRequestStatus.PENDING)

        await expect(fulfillShopRedeemRequest(tx, {
            requestId: 'redeem-1',
        })).rejects.toMatchObject({
            status: 409,
            code: 'not_approved',
        } satisfies Partial<AdminRedeemReviewError>)
        expect(tx.userStreak.upsert).not.toHaveBeenCalled()
    })

    it('rejects review for non-pending requests', async () => {
        await expect(reviewShopRedeemRequest(mockTx(ShopRedeemRequestStatus.APPROVED), {
            requestId: 'redeem-1',
            action: 'reject',
        })).rejects.toMatchObject({
            status: 409,
            code: 'not_pending',
        } satisfies Partial<AdminRedeemReviewError>)
    })
})
