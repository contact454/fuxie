import { redirect } from 'next/navigation'
import { prisma } from '@fuxie/database'

import { ShopBackboneClient } from '@/components/gamification/shop-backbone-client'
import { ShopCatalogClientDynamic } from '@/components/gamification/ShopCatalogClientDynamic'
import { getServerUser } from '@/lib/auth/server-auth'
import { listUserShopRedeemRequests } from '@/lib/gamification/redeem'
import { getFuxieShopCatalogForUser } from '@/lib/gamification/shop'
import { calculateFuxieXpLevel } from '@/lib/gamification/xp-level'

/**
 * Rewards Shop surface (task 13.2).
 *
 * Renders the backbone-compliant `ShopBackboneClient` first — sticky-top
 * wallet (Fucoin + XP), 5-state cards (`affordable | unaffordable | owned |
 * pending | locked`) with the Bright Sky CTA palette and marketShelfFrame
 * overlay for owned items. The richer redeem-flow UI from
 * `ShopCatalogClientDynamic` is rendered below the fold so existing flows
 * (preview modal, history, inventory) continue to work while task 13.3 wires
 * the pending-timeout / inventory tab / equip-mascot updates.
 *
 * Validates: Requirements 8.1, 8.3, 8.4, 8.5, 8.6, 8.10
 */
export default async function RewardsShopPage({
    searchParams,
}: {
    searchParams: Promise<{ fixture?: string; state?: string }>
}) {
    const params = await searchParams
    const isVisualQa = process.env.NODE_ENV !== 'production' && params.fixture === 'visual-qa'

    if (isVisualQa && params.state === 'empty') {
        return (
            <div className="min-h-[100dvh] bg-[var(--fuxie-blue-50)]">
                <ShopBackboneClient
                    wallet={{
                        fucoin: 200,
                        xp: 320,
                    }}
                    inventory={{
                        ownedItemIds: [],
                        equippedItemId: null,
                    }}
                    catalog={[]}
                />
            </div>
        )
    }

    if (isVisualQa && params.state === 'error') {
        return (
            <div className="min-h-[100dvh] bg-[var(--fuxie-blue-50)]">
                <ShopBackboneClient
                    wallet={{
                        fucoin: 200,
                        xp: 320,
                    }}
                    inventory={{
                        ownedItemIds: [],
                        equippedItemId: null,
                    }}
                    catalog={[]}
                    initialErrorMessage="Shop tạm thời không phản hồi"
                />
            </div>
        )
    }

    const serverUser = await getServerUser()

    if (!serverUser) {
        redirect('/login')
    }

    const [shop, recentRequests, profile] = await Promise.all([
        getFuxieShopCatalogForUser(serverUser.userId),
        listUserShopRedeemRequests(prisma, {
            userId: serverUser.userId,
            take: 6,
        }),
        prisma.userProfile.findUnique({
            where: { userId: serverUser.userId },
            select: { totalXp: true },
        }),
    ])

    const xpLevel = calculateFuxieXpLevel(profile?.totalXp ?? 0)

    // Owned items = redeem requests that have been fulfilled. Streak-freeze
    // grants are tracked separately in the inventory snapshot but they ALSO
    // surface as fulfilled redeems, so this single list covers the cosmetic
    // and learning categories needed by Req 8.5. Task 13.3 will fold the
    // dedicated streak-freeze inventory in.
    const ownedItemIds = recentRequests
        .filter((request) => request.status === 'APPROVED' && request.fulfilledAt !== null)
        .map((request) => request.itemId)

    // In-flight redeem requests come from rows still in PENDING — task 13.3
    // adds the 10s client-side revert based on the same identifier set.
    const initialPendingItemIds = recentRequests
        .filter((request) => request.status === 'PENDING')
        .map((request) => request.itemId)

    return (
        <div className="min-h-[100dvh] bg-[var(--fuxie-blue-50)]">
            <ShopBackboneClient
                wallet={{
                    fucoin: shop.wallet.balance,
                    xp: xpLevel.totalXp,
                }}
                inventory={{
                    ownedItemIds,
                    equippedItemId: null,
                }}
                catalog={shop.catalog}
                initialPendingItemIds={initialPendingItemIds}
            />

            <ShopCatalogClientDynamic
                wallet={shop.wallet}
                dailyFucoin={shop.dailyFucoin}
                rewardInventory={{
                    ...shop.rewardInventory,
                    lastFulfilledReward: shop.rewardInventory.lastFulfilledReward
                        ? {
                              ...shop.rewardInventory.lastFulfilledReward,
                              fulfilledAt:
                                  shop.rewardInventory.lastFulfilledReward.fulfilledAt.toISOString(),
                          }
                        : null,
                    streakFreezeTimeline: shop.rewardInventory.streakFreezeTimeline.map((item) => ({
                        ...item,
                        usedAt: item.usedAt.toISOString(),
                    })),
                }}
                catalog={shop.catalog}
                recentRequests={recentRequests.map((request) => ({
                    ...request,
                    requestedAt: request.requestedAt.toISOString(),
                    reviewedAt: request.reviewedAt?.toISOString() ?? null,
                    fulfilledAt: request.fulfilledAt?.toISOString() ?? null,
                    updatedAt: request.updatedAt.toISOString(),
                }))}
            />
        </div>
    )
}
