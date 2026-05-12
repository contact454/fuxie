import { NextResponse } from 'next/server'

import { getServerUser } from '@/lib/auth/server-auth'
import { getFuxieShopCatalogForUser } from '@/lib/gamification/shop'

export async function GET() {
    try {
        const serverUser = await getServerUser()
        if (!serverUser) {
            return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
        }

        const shop = await getFuxieShopCatalogForUser(serverUser.userId)

        return NextResponse.json({
            success: true,
            data: shop,
        })
    } catch (error) {
        console.error('[Shop API] Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to load shop catalog' }, { status: 500 })
    }
}
