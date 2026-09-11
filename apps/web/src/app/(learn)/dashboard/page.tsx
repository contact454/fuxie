import { Suspense, cache } from 'react'
import { redirect } from 'next/navigation'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'
import { getDashboardUserContext } from '@/lib/dashboard/request-data'
import { WorldMapDashboardClient } from '@/components/dashboard/WorldMapDashboardClient'

// Cache function để tối ưu hóa truy vấn
const getHeaderData = cache(async (userId: string) => {
    const user = await getDashboardUserContext(userId)
    const wallet = await prisma.userWallet.findUnique({
        where: { userId }
    })

    const profile = user?.profile
    const streak = user?.streak

    return {
        displayName: profile?.displayName ?? 'Learner',
        streakCount: streak?.currentStreak ?? 0,
        gemCount: wallet?.balance ?? 0,
        totalLessonsCompleted: profile?.totalLessonsCompleted ?? 0,
        xpCount: profile?.totalXp ?? 0,
    }
})

// Mocks cho fixture visual-qa
const DASHBOARD_VISUAL_QA_DATA = {
    displayName: 'Lina Nguyen',
    streakCount: 7,
    gemCount: 150,
    xpCount: 350,
    totalLessonsCompleted: 0, // open node 1, others locked
}

function DashboardRouteShell({
    visualState,
    children,
}: {
    visualState: 'default' | 'empty'
    children: React.ReactNode
}) {
    return (
        <div
            className="w-full"
            data-route="dashboard"
            data-slice="slice-1"
            data-module="01-dashboard"
            data-visual-state={visualState}
        >
            {children}
        </div>
    )
}

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ state?: string; fixture?: string; module?: string; mastered?: string }>
}) {
    const params = await searchParams
    const forceEmpty = params?.state === 'empty'
    const forceMastered = params?.mastered === '1'
    const isVisualQa = process.env.NODE_ENV !== 'production' && params?.fixture === 'visual-qa'

    if (isVisualQa) {
        return (
            <DashboardRouteShell visualState={forceEmpty ? 'empty' : 'default'}>
                <WorldMapDashboardClient
                    username={DASHBOARD_VISUAL_QA_DATA.displayName}
                    streakCount={DASHBOARD_VISUAL_QA_DATA.streakCount}
                    gemCount={DASHBOARD_VISUAL_QA_DATA.gemCount}
                    xpCount={DASHBOARD_VISUAL_QA_DATA.xpCount}
                    totalLessonsCompleted={forceEmpty ? 0 : (forceMastered ? 1 : 0)} // M5 test: mastered state renders crown and glow
                    forceEmpty={forceEmpty}
                />
            </DashboardRouteShell>
        )
    }

    const serverUser = await getServerUser()

    if (!serverUser) {
        redirect('/login')
    }

    const headerData = await getHeaderData(serverUser.userId)

    return (
        <DashboardRouteShell visualState={forceEmpty ? 'empty' : 'default'}>
            <WorldMapDashboardClient
                username={headerData.displayName}
                streakCount={headerData.streakCount}
                gemCount={headerData.gemCount}
                xpCount={headerData.xpCount}
                totalLessonsCompleted={forceEmpty ? 0 : headerData.totalLessonsCompleted}
                forceEmpty={forceEmpty}
            />
        </DashboardRouteShell>
    )
}
