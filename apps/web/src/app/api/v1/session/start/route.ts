import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { handleApiError } from '@/lib/api/error-handler'
import { buildDailySession } from '@/lib/session/builder'
import type { CefrLevel } from '@fuxie/database'

export async function GET(req: NextRequest) {
    try {
        const auth = await withAuth(req)
        
        // Extract level parameter
        const { searchParams } = new URL(req.url)
        const levelStr = searchParams.get('level')
        
        // Use requested level or default to B1 (should query UserProfile ideally if not provided)
        const level = (levelStr ?? 'B1') as CefrLevel

        const items = await buildDailySession(auth.userId, level)

        return NextResponse.json({ success: true, data: { items, level } })
    } catch (err) {
        return handleApiError(err)
    }
}
