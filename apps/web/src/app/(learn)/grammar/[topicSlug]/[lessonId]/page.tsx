import { notFound, redirect } from 'next/navigation'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'
import { LessonPlayer } from '@/components/grammar/LessonPlayer'
import type { TheoryBlock, GrammarExercise } from '@/components/grammar/types'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ topicSlug: string; lessonId: string }> }) {
    const { lessonId } = await params
    const lesson = await prisma.grammarLesson.findUnique({
        where: { id: lessonId },
    })
    return {
        title: lesson ? `Fuxie 🦊 — ${lesson.titleVi}` : 'Fuxie — Grammatik',
    }
}

export default async function LessonPage({ params }: { params: Promise<{ topicSlug: string; lessonId: string }> }) {
    const { topicSlug, lessonId } = await params
    const serverUser = await getServerUser()
    if (!serverUser) redirect('/login')

    const lesson = await prisma.grammarLesson.findUnique({
        where: { id: lessonId },
    })

    if (!lesson) notFound()

    // Parse JSON fields
    const theoryBlocks: TheoryBlock[] = lesson.theoryJson
        ? ((lesson.theoryJson as any).blocks ?? [])
        : []

    const exercises: GrammarExercise[] = (lesson.exercisesJson as any[]) ?? []

    return (
        <LessonPlayer
            lessonId={lesson.id}
            titleDe={lesson.titleDe}
            titleVi={lesson.titleVi}
            level={lesson.level}
            lessonType={lesson.lessonType}
            estimatedMin={lesson.estimatedMin}
            theoryBlocks={theoryBlocks}
            exercises={exercises}
            topicSlug={topicSlug}
        />
    )
}
