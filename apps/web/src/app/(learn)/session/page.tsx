import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth/server-auth'
import { prisma } from '@fuxie/database'
import { SessionPlayerDynamic } from '@/components/session/SessionPlayerDynamic'
import { buildDailySession } from '@/lib/session/builder'
import type { CefrLevel } from '@fuxie/database'

export const metadata = {
    title: 'Fuxie 🦊 — Tự Động Học',
    description: 'Học thông minh với lộ trình Fuxie được thiết kế riêng cho bạn.',
}

export default async function SessionPage() {
    const serverUser = await getServerUser()
    if (!serverUser) redirect('/login')

    const profile = await prisma.userProfile.findUnique({
        where: { userId: serverUser.userId },
        select: { currentLevel: true },
    })

    const level = (profile?.currentLevel || 'A1') as CefrLevel
    const initialItems = await buildDailySession(serverUser.userId, level)

    return (
        <div className="min-h-[100dvh] bg-gray-50 flex flex-col">
            <SessionPlayerDynamic level={level} initialItems={initialItems} />
        </div>
    )
}
