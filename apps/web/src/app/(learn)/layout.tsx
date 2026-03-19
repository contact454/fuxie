import type { Metadata } from 'next'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'
import { MobileShell } from '@/components/shared/mobile-shell'

export const metadata: Metadata = {
    title: 'Fuxie 🦊 — Lernen',
}

export const dynamic = 'force-dynamic'

async function getDailyGoal() {
    try {
        const serverUser = await getServerUser()
        if (!serverUser) return undefined

        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)

        const [profile, todayActivity] = await Promise.all([
            prisma.userProfile.findUnique({
                where: { userId: serverUser.userId },
                select: { studyGoalMinutes: true },
            }),
            prisma.dailyActivity.findFirst({
                where: {
                    userId: serverUser.userId,
                    date: todayStart,
                },
                select: { totalMinutes: true, xpEarned: true },
            }),
        ])

        return {
            currentMinutes: todayActivity?.totalMinutes ?? 0,
            goalMinutes: profile?.studyGoalMinutes ?? 15,
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

