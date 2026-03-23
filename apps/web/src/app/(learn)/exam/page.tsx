import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth/server-auth'
import { ExamListClient } from '@/components/exam/ExamListClient'

export const metadata = {
    title: 'Fuxie 🦊 — Prüfung üben',
    description: 'Thi thử tiếng Đức theo chuẩn Goethe / telc / ÖSD',
}

export default async function ExamPage() {
    const user = await getServerUser()
    if (!user) redirect('/login')

    return <ExamListClient />
}
