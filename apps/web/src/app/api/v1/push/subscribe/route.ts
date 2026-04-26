import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@fuxie/database'
import { withDbAuth } from '@/lib/auth/middleware'
import { handleApiError } from '@/lib/api/error-handler'

export async function POST(req: NextRequest) {
    try {
        const auth = await withDbAuth(req)
        const body = await req.json()
        
        const { endpoint, keys } = body

        if (!endpoint || !keys?.p256dh || !keys?.auth) {
            return NextResponse.json({ success: false, message: 'Invalid subscription object' }, { status: 400 })
        }

        // Upsert subscription
        const sub = await prisma.pushSubscription.upsert({
            where: {
                userId_endpoint: {
                    userId: auth.userId,
                    endpoint: endpoint
                }
            },
            update: {
                p256dh: keys.p256dh,
                auth: keys.auth
            },
            create: {
                userId: auth.userId,
                endpoint: endpoint,
                p256dh: keys.p256dh,
                auth: keys.auth
            }
        })

        return NextResponse.json({ success: true, data: sub })
    } catch (err) {
        return handleApiError(err)
    }
}
