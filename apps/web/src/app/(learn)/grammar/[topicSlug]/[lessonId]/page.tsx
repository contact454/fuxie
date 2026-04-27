import { notFound, redirect } from 'next/navigation'
import { cache } from 'react'
import { prisma } from '@fuxie/database'
import { cookies } from 'next/headers'
import { getServerUser } from '@/lib/auth/server-auth'
import { LessonPlayerDynamic } from '@/components/grammar/LessonPlayerDynamic'
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
        title: lesson ? `Fuxie 🦊 — ${(lesson.translations as any)?.['vi'] || lesson.titleDe}` : 'Fuxie — Grammatik',
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

    const locale = (await cookies()).get('NEXT_LOCALE')?.value || 'vi'

    return (
        <LessonPlayerDynamic
            lessonId={lesson.id}
            titleDe={lesson.titleDe}
            titleNative={(lesson.translations as any)?.[locale] || lesson.titleDe}
            level={lesson.level}
            lessonType={lesson.lessonType}
            estimatedMin={lesson.estimatedMin}
            theoryBlocks={theoryBlocks}
            exercises={exercises}
            topicSlug={topicSlug}
        />
    )
}
