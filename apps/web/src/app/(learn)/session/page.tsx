import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth/server-auth'
import { prisma } from '@fuxie/database'
import { SessionPlayer } from '@/components/session/SessionPlayer'

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

    const level = profile?.currentLevel || 'A1'

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <SessionPlayer level={level} />
        </div>
    )
}
