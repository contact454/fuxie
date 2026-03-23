import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth/server-auth'
import { LeaderboardClient } from '@/components/leaderboard/LeaderboardClient'

export const metadata = {
    title: 'Fuxie 🦊 — Rangliste',
    description: 'Bảng xếp hạng · Wer lernt am meisten?',
}

export default async function LeaderboardPage() {
    const user = await getServerUser()
    if (!user) redirect('/login')

    return <LeaderboardClient />
}
