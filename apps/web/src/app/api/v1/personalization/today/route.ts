import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth/server-auth'
import { getTodayPlan } from '@/lib/personalization/today-plan'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const serverUser = await getServerUser()
        if (!serverUser) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const data = await getTodayPlan(serverUser.userId)
        return NextResponse.json({ success: true, data })
    } catch (err) {
        console.error('[Personalization] Today plan error:', err)
        return NextResponse.json(
            { success: false, error: 'Failed to build today plan' },
            { status: 500 },
        )
    }
}
