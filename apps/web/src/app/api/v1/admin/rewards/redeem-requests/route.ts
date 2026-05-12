import { NextResponse } from 'next/server'
import { prisma, ShopRedeemRequestStatus } from '@fuxie/database'

import { getServerUser } from '@/lib/auth/server-auth'
import { getAdminRedeemQueueCounts, listShopRedeemRequests } from '@/lib/gamification/admin-redeem'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const serverUser = await getServerUser()
    if (!serverUser || serverUser.role !== 'ADMIN') {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const url = new URL(request.url)
    const statusParam = url.searchParams.get('status')?.toUpperCase()
    const fulfillment = statusParam === 'FULFILLMENT' ? 'awaiting' : undefined
    const status = statusParam === 'ALL'
        ? undefined
        : statusParam === 'FULFILLMENT'
        ? undefined
        : statusParam && isRedeemStatus(statusParam)
        ? statusParam
        : ShopRedeemRequestStatus.PENDING
    const [requests, counts] = await Promise.all([
        listShopRedeemRequests(prisma, {
            status,
            fulfillment,
            take: 100,
        }),
        getAdminRedeemQueueCounts(prisma),
    ])

    return NextResponse.json({
        success: true,
        data: requests,
        meta: {
            status: fulfillment ? 'FULFILLMENT' : status ?? 'ALL',
            counts,
        },
    })
}

function isRedeemStatus(status: string): status is ShopRedeemRequestStatus {
    return Object.values(ShopRedeemRequestStatus).includes(status as ShopRedeemRequestStatus)
}
