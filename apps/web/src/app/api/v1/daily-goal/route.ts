import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth/server-auth'
import { getDashboardUserContext, getTodayActivitySummary } from '@/lib/dashboard/request-data'

export async function GET() {
    try {
        const serverUser = await getServerUser()
        if (!serverUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const [user, todayActivity] = await Promise.all([
            getDashboardUserContext(serverUser.userId),
            getTodayActivitySummary(serverUser.userId),
        ])

        return NextResponse.json({
            currentMinutes: todayActivity?.totalMinutes ?? 0,
            goalMinutes: user?.profile?.studyGoalMinutes ?? user?.settings?.srsNewCardsPerDay ?? 15,
            xpEarned: todayActivity?.xpEarned ?? 0,
        })
    } catch {
        return NextResponse.json({ currentMinutes: 0, goalMinutes: 15, xpEarned: 0 })
    }
}
