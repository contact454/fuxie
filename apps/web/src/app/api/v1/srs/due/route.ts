import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth/server-auth'
import { cacheWrap } from '@/lib/cache/redis'
import { getDueSrsCards } from '@/lib/srs/due-cards'

export const dynamic = 'force-dynamic'
const SRS_DUE_CACHE_TTL_SECONDS = 10

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

        const normalizedLimit = Math.min(Math.max(Number.isFinite(limit) ? limit : 20, 1), 50)
        const normalizedLevel = encodeURIComponent(level ?? 'all')
        const cards = await cacheWrap(
            `srs:due:${serverUser.userId}:${normalizedLevel}:${normalizedLimit}`,
            SRS_DUE_CACHE_TTL_SECONDS,
            () => getDueSrsCards({
                userId: serverUser.userId,
                level: level ?? undefined,
                limit: normalizedLimit,
            }),
        )

        return NextResponse.json({ success: true, data: cards })
    } catch (err) {
        console.error('SRS due fetch error:', err)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
