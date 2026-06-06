import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth/server-auth'
import { LeaderboardClientDynamic } from '@/components/leaderboard/LeaderboardClientDynamic'

export const metadata = {
    title: 'Fuxie 🦊 — Rangliste',
    description: 'Bảng xếp hạng · Wer lernt am meisten?',
}

export default async function LeaderboardPage({
    searchParams,
}: {
    searchParams: Promise<{ fixture?: string; state?: string }>
}) {
    const params = await searchParams
    const user = await getServerUser()
    if (!user) redirect('/login')

    return (
        <LeaderboardClientDynamic
            fixture={params.fixture}
            state={params.state}
        />
    )
}
