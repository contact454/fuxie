import { notFound, redirect } from 'next/navigation'
import { cache } from 'react'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'
import { LessonPlayer } from '@/components/grammar/LessonPlayer'
import type { TheoryBlock, GrammarExercise } from '@/components/grammar/types'

const getGrammarLesson = cache(async (lessonId: string) => {
    return prisma.grammarLesson.findUnique({
        where: { id: lessonId },
    })
})

export async function generateMetadata({ params }: { params: Promise<{ topicSlug: string; lessonId: string }> }) {
    const { lessonId } = await params
    const lesson = await getGrammarLesson(lessonId)
    return {
        title: lesson ? `Fuxie 🦊 — ${lesson.titleVi}` : 'Fuxie — Grammatik',
    }
}

export default async function LessonPage({ params }: { params: Promise<{ topicSlug: string; lessonId: string }> }) {
    const { topicSlug, lessonId } = await params
    const serverUser = await getServerUser()
    if (!serverUser) redirect('/login')

    const lesson = await getGrammarLesson(lessonId)

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
