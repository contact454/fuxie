import { NextResponse } from 'next/server'

import { getServerUser } from '@/lib/auth/server-auth'
import { getMissionBoard } from '@/lib/gamification/missions'

export async function GET() {
    try {
        const serverUser = await getServerUser()
        if (!serverUser) {
            return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
        }

        const missionBoard = await getMissionBoard(serverUser.userId)

        return NextResponse.json({
            success: true,
            data: missionBoard,
        })
    } catch (error) {
        console.error('[Missions API] Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to load missions' }, { status: 500 })
    }
}
