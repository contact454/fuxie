import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth/server-auth'
import { ExamSessionClientDynamic } from '@/components/exam/ExamSessionClientDynamic'
import {
    isSlice2VisualQaFixture,
    Slice2ExamTimeoutFixture,
    type Slice2VisualQaParams,
} from '@/components/visual-fixtures/slice-2-skill-fixtures'

export const metadata = {
    title: 'Fuxie - Bài thi thử',
    description: 'Bài thi đang diễn ra',
}

export default async function ExamSessionPage({
    params,
    searchParams,
}: {
    params: Promise<{ examId: string }>
    searchParams?: Promise<Slice2VisualQaParams>
}) {
    const visualParams = await searchParams

    if (isSlice2VisualQaFixture(visualParams, 'timeout')) {
        return <Slice2ExamTimeoutFixture />
    }

    const user = await getServerUser()
    if (!user) redirect('/login')

    const { examId } = await params

    return <ExamSessionClientDynamic examId={examId} />
}
