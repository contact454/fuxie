import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth/server-auth'
import { prisma } from '@fuxie/database'
import { ChatClientDynamic } from '@/components/chat/ChatClientDynamic'
import type { CefrLevel } from '@/lib/constants/cefr'
import {
    isSlice3VisualQaFixture,
    Slice3ChatLoadingFixture,
} from '@/components/visual-fixtures/slice-3-motivation-fixtures'

export const metadata = {
    title: 'Fuxie 🦊 — Chat mit Fuxie',
    description: 'Trò chuyện tiếng Đức với Fuxie — KI-Sprachtutor theo chuẩn CEFR',
}

export default async function ChatPage({ searchParams }: { searchParams: Promise<{ state?: string; fixture?: string }> }) {
    const visualParams = await searchParams
    if (isSlice3VisualQaFixture(visualParams, 'loading')) {
        return <Slice3ChatLoadingFixture />
    }

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
        <ChatClientDynamic
            initialLevel={(profile?.currentLevel as CefrLevel) ?? 'A1'}
            displayName={profile?.displayName ?? undefined}
        />
    )
}
