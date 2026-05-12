import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth/server-auth'
import { ExamSessionClientDynamic } from '@/components/exam/ExamSessionClientDynamic'

export const metadata = {
    title: 'Fuxie - Bài thi thử',
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

    return <ExamSessionClientDynamic examId={examId} />
}
