import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@fuxie/database'

import { getServerUser } from '@/lib/auth/server-auth'
import { createShopRedeemRequest, ShopRedeemError } from '@/lib/gamification/redeem'

export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ itemId: string }> }
) {
    try {
        const serverUser = await getServerUser()
        if (!serverUser) {
            return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
        }

        const { itemId } = await params
        const result = await createShopRedeemRequest(prisma, {
            userId: serverUser.userId,
            itemId,
        })

        return NextResponse.json({
            success: true,
            data: result,
        }, { status: result.status === 'pending_created' ? 202 : 200 })
    } catch (error) {
        if (error instanceof ShopRedeemError) {
            return NextResponse.json({
                success: false,
                error: error.message,
                code: error.code,
                ...(error.payload ? { data: error.payload } : {}),
            }, { status: error.status })
        }

        console.error('[Shop Redeem API] Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to create redeem request' }, { status: 500 })
    }
}
