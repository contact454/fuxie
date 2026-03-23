import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth/server-auth'
import { ExamSessionClient } from '@/components/exam/ExamSessionClient'

export const metadata = {
    title: 'Fuxie 🦊 — Prüfung',
    description: 'Bài thi đang diễn ra',
}

export default async function ExamSessionPage({
    params,
}: {
    params: Promise<{ examId: string }>
}) {
    const user = await getServerUser()
    if (!user) redirect('/login')

    const { examId } = await params

    return <ExamSessionClient examId={examId} />
}
