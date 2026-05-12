import { NextRequest, NextResponse } from 'next/server'

import { getServerUser } from '@/lib/auth/server-auth'
import { claimMissionReward, MissionClaimError } from '@/lib/gamification/missions'
import { invalidateLearnerProgressCaches } from '@/lib/progress/cache-invalidation'

export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ missionId: string }> }
) {
    try {
        const serverUser = await getServerUser()
        if (!serverUser) {
            return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
        }

        const { missionId } = await params
        const result = await claimMissionReward(serverUser.userId, missionId)
        invalidateLearnerProgressCaches(serverUser.userId).catch(() => {})

        return NextResponse.json({
            success: true,
            data: result,
        })
    } catch (error) {
        if (error instanceof MissionClaimError) {
            return NextResponse.json({ success: false, error: error.message }, { status: error.status })
        }

        console.error('[Mission Claim API] Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to claim mission' }, { status: 500 })
    }
}
