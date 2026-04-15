import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth/server-auth'
import { prisma } from '@fuxie/database'
import { ChatClient } from '@/components/chat/ChatClient'
import type { CefrLevel } from '@/lib/constants/cefr'

export const metadata = {
    title: 'Fuxie 🦊 — Chat mit Fuxie',
    description: 'Trò chuyện tiếng Đức với Fuxie — KI-Sprachtutor theo chuẩn CEFR',
}

export default async function ChatPage() {
    const serverUser = await getServerUser()
    if (!serverUser) redirect('/login')

    // Fetch user profile for initial level and display name
    const profile = await prisma.userProfile.findUnique({
        where: { userId: serverUser.userId },
        select: {
            currentLevel: true,
            displayName: true,
        },
    })

    return (
        <ChatClient
            initialLevel={(profile?.currentLevel as CefrLevel) ?? 'A1'}
            displayName={profile?.displayName ?? undefined}
        />
    )
}
