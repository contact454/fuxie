import { redirect, notFound } from 'next/navigation'
import { cache } from 'react'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'
import { LessonPlayer } from '@/components/listening/lesson-player'

const getListeningLesson = cache(async (lessonId: string) => {
    return prisma.listeningLesson.findUnique({
        where: { lessonId },
        include: {
            questions: {
                orderBy: { sortOrder: 'asc' },
                select: {
                    id: true,
                    questionNumber: true,
                    questionType: true,
                    questionText: true,
                    questionTextVi: true,
                    options: true,
                    sortOrder: true,
                },
            },
        },
    })
})

export async function generateMetadata({ params }: { params: Promise<{ lessonId: string }> }) {
    const { lessonId } = await params
    const lesson = await getListeningLesson(lessonId)
    return {
        title: lesson ? `Fuxie 🦊 — ${lesson.topic}` : 'Fuxie 🦊 — Hörverstehen',
        description: lesson?.title ?? 'German listening comprehension exercise',
    }
}

// Max replay mapping per CEFR level (Goethe rules)
const MAX_PLAYS: Record<string, number> = {
    A1: 2, A2: 2, B1: 2, B2: 2, C1: 2, C2: 1,
}

export default async function ListeningLessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
    const serverUser = await getServerUser()
    if (!serverUser) redirect('/login')

    const { lessonId } = await params

    const lesson = await getListeningLesson(lessonId)

    if (!lesson) notFound()

    return (
        <LessonPlayer
            lessonId={lesson.lessonId}
            title={lesson.title}
            topic={lesson.topic}
            cefrLevel={lesson.cefrLevel}
            teil={lesson.teil}
            teilName={lesson.teilName}
            taskType={lesson.taskType}
            audioUrl={lesson.audioUrl}
            audioDuration={lesson.audioDuration}
            backgroundScene={lesson.backgroundScene}
            questions={lesson.questions.map(q => ({ ...q, options: q.options as string[] }))}
            transcript={lesson.transcript as any}
            maxPlays={MAX_PLAYS[lesson.cefrLevel] || 2}
        />
    )
}
