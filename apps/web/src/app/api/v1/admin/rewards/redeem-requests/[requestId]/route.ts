import { NextResponse } from 'next/server'
import { prisma } from '@fuxie/database'
import { z } from 'zod'

import { getServerUser } from '@/lib/auth/server-auth'
import { AdminRedeemReviewError, fulfillShopRedeemRequest, reviewShopRedeemRequest } from '@/lib/gamification/admin-redeem'

const reviewSchema = z.object({
    action: z.enum(['approve', 'reject', 'fulfill']),
    reason: z.string().trim().max(500).optional(),
})

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ requestId: string }> }
) {
    try {
        const serverUser = await getServerUser()
        if (!serverUser || serverUser.role !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
        }

        const parsed = reviewSchema.safeParse(await request.json())
        if (!parsed.success) {
            return NextResponse.json({
                success: false,
                error: parsed.error.issues.map((issue) => issue.message).join('; '),
            }, { status: 400 })
        }

        const { requestId } = await params
        const result = await prisma.$transaction((tx) => {
            if (parsed.data.action === 'fulfill') {
                return fulfillShopRedeemRequest(tx, {
                    requestId,
                    reason: parsed.data.reason,
                })
            }

            return reviewShopRedeemRequest(tx, {
                requestId,
                action: parsed.data.action,
                reason: parsed.data.reason,
            })
        })

        return NextResponse.json({
            success: true,
            data: result,
        })
    } catch (error) {
        if (error instanceof AdminRedeemReviewError) {
            return NextResponse.json({
                success: false,
                error: error.message,
                code: error.code,
            }, { status: error.status })
        }

        console.error('[Admin Redeem Review API] Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to review redeem request' }, { status: 500 })
    }
}
