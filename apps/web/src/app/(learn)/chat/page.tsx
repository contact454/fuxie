import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth/server-auth'
import { ChatClient } from '@/components/chat/ChatClient'

export const metadata = {
    title: 'Fuxie 🦊 — Chat mit Fuxie',
    description: 'Trò chuyện tiếng Đức với Fuxie — KI-Sprachtutor theo chuẩn CEFR',
}

export default async function ChatPage() {
    const serverUser = await getServerUser()
    if (!serverUser) redirect('/login')

    return <ChatClient />
}
