import { redirect } from 'next/navigation'
import { prisma, ShopRedeemRequestStatus } from '@fuxie/database'

import { getServerUser } from '@/lib/auth/server-auth'
import { getAdminRedeemQueueCounts, listShopRedeemRequests } from '@/lib/gamification/admin-redeem'
import RewardsReviewClient from './RewardsReviewClient'

export const dynamic = 'force-dynamic'

export default async function AdminRewardsPage() {
    const user = await getServerUser()

    if (!user || user.role !== 'ADMIN') {
        redirect('/admin')
    }

    const [requests, counts] = await Promise.all([
        listShopRedeemRequests(prisma, {
            status: ShopRedeemRequestStatus.PENDING,
            take: 100,
        }),
        getAdminRedeemQueueCounts(prisma),
    ])

    return (
        <RewardsReviewClient
            initialCounts={counts}
            initialRequests={requests.map((request) => ({
                ...request,
                requestedAt: request.requestedAt.toISOString(),
                reviewedAt: request.reviewedAt?.toISOString() ?? null,
                fulfilledAt: request.fulfilledAt?.toISOString() ?? null,
                updatedAt: request.updatedAt.toISOString(),
            }))}
        />
    )
}
