import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth/server-auth'
import { ExamListClientDynamic } from '@/components/exam/ExamListClientDynamic'

export const metadata = {
    title: 'Fuxie - Luyện thi thử',
    description: 'Thi thử tiếng Đức theo chuẩn Goethe / telc / ÖSD',
}

export default async function ExamPage() {
    const user = await getServerUser()
    if (!user) redirect('/login')

    return <ExamListClientDynamic />
}
