import { ShopRedeemRequestStatus } from '@fuxie/database'
import { describe, expect, it, vi } from 'vitest'

import {
    buildShopRedeemPreviewContract,
    createShopRedeemRequest,
    ShopRedeemError,
} from './redeem'
import type { EconomyDbClient } from './fucoin'

const pendingRequest = {
    id: 'redeem-1',
    itemId: 'streak-freeze',
    itemTitle: 'Streak Freeze',
    itemCategory: 'support',
    itemBenefit: 'Bảo vệ streak 1 ngày',
    cost: 120,
    walletBalanceAtRequest: 150,
    status: ShopRedeemRequestStatus.PENDING,
    statusReason: 'Awaiting approval. No Fucoin has been spent yet.',
    requestedAt: new Date('2026-04-29T09:00:00.000Z'),
    reviewedAt: null,
    fulfilledAt: null,
    updatedAt: new Date('2026-04-29T09:00:00.000Z'),
}

function mockTx(
    balance: number,
    options: { existingPending?: typeof pendingRequest | null } = {}
) {
    const findFirst = vi.fn().mockResolvedValue(options.existingPending ?? null)
    const create = vi.fn().mockResolvedValue(pendingRequest)

    return {
        userWallet: {
            findUnique: vi.fn().mockResolvedValue({
                balance,
                lifetimeEarned: balance,
                lifetimeSpent: 0,
            }),
        },
        shopRedeemRequest: {
            findFirst,
            findMany: vi.fn().mockResolvedValue([pendingRequest]),
            create,
            findFirstOrThrow: vi.fn().mockResolvedValue(pendingRequest),
        },
        analyticsEvent: {
            create: vi.fn().mockResolvedValue({ id: 'event-1' }),
        },
    } as unknown as EconomyDbClient
}

describe('Fuxie shop redeem guard', () => {
    it('returns a locked preview contract without spending Fucoin', async () => {
        const tx = mockTx(150)
        const result = await buildShopRedeemPreviewContract(tx, {
            userId: 'user-1',
            itemId: 'streak-freeze',
        })

        expect(result).toMatchObject({
            status: 'requestable',
            spendEnabled: true,
            confirmationRequired: true,
            canAfford: true,
            wouldSpend: 120,
            missingFucoin: 0,
            item: {
                id: 'streak-freeze',
                status: 'requestable',
                statusLabel: expect.any(String),
            },
            guard: {
                reason: 'requestable',
            },
        })
        expect(tx.userWallet.findUnique).toHaveBeenCalledTimes(1)
    })

    it('creates a pending request when wallet can afford the item', async () => {
        const tx = mockTx(150)
        const result = await createShopRedeemRequest(tx, {
            userId: 'user-1',
            itemId: 'streak-freeze',
        })

        expect(result).toMatchObject({
            status: 'pending_created',
            spendEnabled: true,
            canAfford: true,
            wouldSpend: 120,
            request: {
                id: 'redeem-1',
                status: ShopRedeemRequestStatus.PENDING,
                walletBalanceAtRequest: 150,
            },
            guard: {
                reason: 'pending_created',
            },
        })
        expect(tx.shopRedeemRequest.create).toHaveBeenCalledTimes(1)
        expect(tx.analyticsEvent.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                userId: 'user-1',
                role: 'LEARNER',
                eventName: 'reward_redeem_requested',
                source: 'rewards.shop.redeem',
                actionId: 'redeem-1',
                metadata: expect.objectContaining({
                    item_id: 'streak-freeze',
                    category: 'support',
                    cost: 120,
                    wallet_balance: 150,
                    request_id: 'redeem-1',
                }),
            }),
        })
    })

    it('returns the existing pending request instead of creating a duplicate', async () => {
        const tx = mockTx(150, { existingPending: pendingRequest })
        const result = await createShopRedeemRequest(tx, {
            userId: 'user-1',
            itemId: 'streak-freeze',
        })

        expect(result.status).toBe('pending_existing')
        expect(result.request?.id).toBe('redeem-1')
        expect(tx.shopRedeemRequest.create).not.toHaveBeenCalled()
        expect(tx.analyticsEvent.create).not.toHaveBeenCalled()
    })

    it('blocks real gift requests while keeping the wallet untouched', async () => {
        const tx = mockTx(1000)

        await expect(createShopRedeemRequest(tx, {
            userId: 'user-1',
            itemId: 'fuxie-real-gift-voucher',
        })).rejects.toMatchObject({
            status: 423,
            code: 'real_gift_locked',
        } satisfies Partial<ShopRedeemError>)
        expect(tx.shopRedeemRequest.create).not.toHaveBeenCalled()
        expect(tx.analyticsEvent.create).not.toHaveBeenCalled()
    })

    it('lists learner redeem request history without mutating rewards', async () => {
        const { listUserShopRedeemRequests } = await import('./redeem')
        const tx = mockTx(150)
        const result = await listUserShopRedeemRequests(tx, {
            userId: 'user-1',
            take: 3,
        })

        expect(result).toHaveLength(1)
        expect(result[0]).toMatchObject({
            id: 'redeem-1',
            status: ShopRedeemRequestStatus.PENDING,
            itemCategory: 'support',
        })
        expect(tx.shopRedeemRequest.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: { userId: 'user-1' },
            take: 3,
        }))
    })

    it('reports missing Fucoin and does not create a request', async () => {
        const tx = mockTx(17)

        await expect(createShopRedeemRequest(tx, {
            userId: 'user-1',
            itemId: 'streak-freeze',
        })).rejects.toMatchObject({
            status: 402,
            code: 'insufficient_funds',
        } satisfies Partial<ShopRedeemError>)
        expect(tx.shopRedeemRequest.create).not.toHaveBeenCalled()
    })

    it('throws a typed error for unknown shop items', async () => {
        await expect(buildShopRedeemPreviewContract(mockTx(1000), {
            userId: 'user-1',
            itemId: 'missing-item',
        })).rejects.toMatchObject({
            status: 404,
            code: 'not_found',
        } satisfies Partial<ShopRedeemError>)
    })
})
