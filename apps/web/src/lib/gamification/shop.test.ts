import { describe, expect, it } from 'vitest'
import { ShopRedeemRequestStatus } from '@fuxie/database'

import { buildFuxieRewardInventory, buildFuxieShopCatalog, getFuxieShopPreview } from './shop'

describe('Fuxie shop catalog', () => {
    it('builds requestable digital items with affordability progress', () => {
        const catalog = buildFuxieShopCatalog(150)
        const streakFreeze = catalog.find((item) => item.id === 'streak-freeze')
        const mocktest = catalog.find((item) => item.id === 'mocktest-unlock')

        expect(streakFreeze).toMatchObject({
            cost: 120,
            canAfford: true,
            walletProgress: 100,
            status: 'requestable',
            statusLabel: expect.any(String),
            redeemPreview: {
                stage: 'requestable',
                ctaLabel: expect.any(String),
            },
        })
        expect(mocktest).toMatchObject({
            cost: 300,
            canAfford: false,
            walletProgress: 50,
            status: 'requestable',
            statusLabel: expect.any(String),
            redeemPreview: {
                ctaLabel: expect.any(String),
            },
        })
    })

    it('returns a sorted dashboard preview with requestable digital rewards', () => {
        const preview = getFuxieShopPreview(1000, 3)

        expect(preview).toHaveLength(3)
        expect(preview.map((item) => item.id)).toEqual([
            'streak-freeze',
            'fuxie-sky-outfit',
            'coach-hint-pack',
        ])
        expect(preview.every((item) => item.status === 'requestable')).toBe(true)
        expect(preview.every((item) => item.redeemPreview.policy.length > 0)).toBe(true)
    })

    it('keeps real gifts locked even when the wallet can afford the preview price', () => {
        const catalog = buildFuxieShopCatalog(1000)
        const realGift = catalog.find((item) => item.id === 'fuxie-real-gift-voucher')

        expect(realGift).toMatchObject({
            status: 'preview_locked',
            canAfford: false,
            statusLabel: expect.any(String),
            redeemPreview: {
                stage: 'preview_locked',
                ctaLabel: expect.any(String),
            },
        })
    })

    it('summarizes owned rewards from streak and redeem request state', () => {
        const inventory = buildFuxieRewardInventory({
            streak: {
                freezesAvailable: 2,
                freezesUsed: 1,
            },
            statusCounts: [
                { status: ShopRedeemRequestStatus.PENDING, count: 3 },
                { status: ShopRedeemRequestStatus.APPROVED, count: 5 },
            ],
            awaitingFulfillment: 2,
            fulfilledStreakFreeze: 1,
            lastFulfilledReward: {
                itemId: 'streak-freeze',
                itemTitle: 'Streak Freeze',
                fulfilledAt: new Date('2026-04-29T10:00:00.000Z'),
            },
            streakFreezeTimeline: [
                {
                    id: 'freeze-usage-1',
                    usedAt: new Date('2026-04-29T09:00:00.000Z'),
                    protectedStreak: 7,
                    freezesRemaining: 1,
                    missedDays: 1,
                    sourceType: 'exercise',
                    sourceId: 'listening:a1:01',
                },
            ],
        })

        expect(inventory).toMatchObject({
            streakFreezeAvailable: 2,
            streakFreezeUsed: 1,
            pendingRedeemRequests: 3,
            awaitingFulfillment: 2,
            fulfilledRewards: 3,
            fulfilledStreakFreeze: 1,
            streakFreezeTimeline: [
                {
                    id: 'freeze-usage-1',
                    protectedStreak: 7,
                    freezesRemaining: 1,
                    missedDays: 1,
                },
            ],
            lastFulfilledReward: {
                itemTitle: 'Streak Freeze',
            },
        })
    })
})
