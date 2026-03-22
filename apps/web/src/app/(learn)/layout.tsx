import type { Metadata } from 'next'
import { getServerUser } from '@/lib/auth/server-auth'
import { getDashboardUserContext, getTodayActivitySummary } from '@/lib/dashboard/request-data'
import { MobileShell } from '@/components/shared/mobile-shell'

export const metadata: Metadata = {
    title: 'Fuxie 🦊 — Lernen',
}

async function getDailyGoal() {
    try {
        const serverUser = await getServerUser()
        if (!serverUser) return undefined

        const [user, todayActivity] = await Promise.all([
            getDashboardUserContext(serverUser.userId),
            getTodayActivitySummary(serverUser.userId),
        ])

        return {
            currentMinutes: todayActivity?.totalMinutes ?? 0,
            goalMinutes: user?.profile?.studyGoalMinutes ?? user?.settings?.srsNewCardsPerDay ?? 15,
            xpEarned: todayActivity?.xpEarned ?? 0,
        }
    } catch {
        return undefined
    }
}

export default async function LearnLayout({ children }: { children: React.ReactNode }) {
    const dailyGoal = await getDailyGoal()

    return (
        <div className="flex min-h-screen bg-gray-50">
            <MobileShell dailyGoal={dailyGoal}>
                {children}
            </MobileShell>
        </div>
    )
}
