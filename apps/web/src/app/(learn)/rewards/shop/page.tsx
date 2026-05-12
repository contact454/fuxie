import { redirect } from 'next/navigation'
import { prisma } from '@fuxie/database'

import { ShopCatalogClientDynamic } from '@/components/gamification/ShopCatalogClientDynamic'
import { getServerUser } from '@/lib/auth/server-auth'
import { listUserShopRedeemRequests } from '@/lib/gamification/redeem'
import { getFuxieShopCatalogForUser } from '@/lib/gamification/shop'

export default async function RewardsShopPage() {
    const serverUser = await getServerUser()

    if (!serverUser) {
        redirect('/login')
    }

    const [shop, recentRequests] = await Promise.all([
        getFuxieShopCatalogForUser(serverUser.userId),
        listUserShopRedeemRequests(prisma, {
            userId: serverUser.userId,
            take: 6,
        }),
    ])

    return (
        <ShopCatalogClientDynamic
            wallet={shop.wallet}
            dailyFucoin={shop.dailyFucoin}
            rewardInventory={{
                ...shop.rewardInventory,
                lastFulfilledReward: shop.rewardInventory.lastFulfilledReward
                    ? {
                        ...shop.rewardInventory.lastFulfilledReward,
                        fulfilledAt: shop.rewardInventory.lastFulfilledReward.fulfilledAt.toISOString(),
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
    )
}
