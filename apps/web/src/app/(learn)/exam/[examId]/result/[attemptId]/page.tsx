import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth/server-auth'
import { ExamResultClientDynamic } from '@/components/exam/ExamResultClientDynamic'

export const metadata = {
    title: 'Fuxie 🦊 — Prüfungsergebnis',
    description: 'Kết quả bài thi',
}

export default async function ExamResultPage({
    params,
}: {
    params: Promise<{ examId: string; attemptId: string }>
}) {
    const user = await getServerUser()
    if (!user) redirect('/login')

    const { examId, attemptId } = await params

    return <ExamResultClientDynamic examId={examId} attemptId={attemptId} />
}
