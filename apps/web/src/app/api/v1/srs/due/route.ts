import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth/server-auth'
import { getDueSrsCards } from '@/lib/srs/due-cards'

export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/srs/due?level=A1&limit=20
 * Returns due SRS cards for review, optionally filtered by CEFR level.
 */
export async function GET(req: NextRequest) {
    try {
        const serverUser = await getServerUser()
        if (!serverUser) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const level = searchParams.get('level')
        const limit = parseInt(searchParams.get('limit') ?? '20', 10)

        const now = new Date()
        const cards = await getDueSrsCards({
            userId: serverUser.userId,
            now,
            level: level ?? undefined,
            limit,
        })

        return NextResponse.json({ success: true, data: cards })
    } catch (err) {
        console.error('SRS due fetch error:', err)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
