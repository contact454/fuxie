import { describe, expect, it } from 'vitest'
import { ShopRedeemRequestStatus } from '@fuxie/database'

import { buildFuxieRewardInventory, buildFuxieShopCatalog, getFuxieShopPreview } from './shop'

describe('Fuxie shop catalog', () => {
    it('builds locked preview items with affordability progress', () => {
        const catalog = buildFuxieShopCatalog(150)
        const streakFreeze = catalog.find((item) => item.id === 'streak-freeze')
        const mocktest = catalog.find((item) => item.id === 'mocktest-unlock')

        expect(streakFreeze).toMatchObject({
            cost: 120,
            canAfford: true,
            walletProgress: 100,
            status: 'preview_locked',
            statusLabel: 'Đủ Fucoin',
            redeemPreview: {
                stage: 'preview_locked',
                ctaLabel: 'Tạo request đổi quà',
            },
        })
        expect(mocktest).toMatchObject({
            cost: 300,
            canAfford: false,
            walletProgress: 50,
            statusLabel: 'Đang tích',
            redeemPreview: {
                ctaLabel: 'Xem điều kiện đổi',
            },
        })
    })

    it('returns a sorted dashboard preview without exposing redeemable items', () => {
        const preview = getFuxieShopPreview(1000, 3)

        expect(preview).toHaveLength(3)
        expect(preview.map((item) => item.id)).toEqual([
            'streak-freeze',
            'fuxie-sky-outfit',
            'coach-hint-pack',
        ])
        expect(preview.every((item) => item.status === 'preview_locked')).toBe(true)
        expect(preview.every((item) => item.redeemPreview.policy.length > 0)).toBe(true)
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
