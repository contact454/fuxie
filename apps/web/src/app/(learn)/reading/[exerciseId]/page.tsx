import { notFound, redirect } from 'next/navigation'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'
import { ReadingPlayer } from '@/components/reading/reading-player'

export async function generateMetadata({ params }: { params: Promise<{ exerciseId: string }> }) {
    const { exerciseId } = await params
    return {
        title: `Fuxie 🦊 — Lesen ${exerciseId}`,
    }
}

export default async function ReadingExercisePage({ params }: { params: Promise<{ exerciseId: string }> }) {
    const serverUser = await getServerUser()
    if (!serverUser) redirect('/login')

    const { exerciseId } = await params

    const exercise = await prisma.readingExercise.findUnique({
        where: { exerciseId },
        include: {
            questions: {
                orderBy: { sortOrder: 'asc' },
                select: {
                    id: true,
                    questionNumber: true,
                    questionType: true,
                    linkedText: true,
                    statement: true,
                    options: true,
                    correctAnswer: true,
                    points: true,
                    sortOrder: true,
                },
            },
        },
    })

    if (!exercise) notFound()

    return (
        <div className="max-w-5xl mx-auto px-4 py-6">
            <ReadingPlayer
                exerciseId={exercise.exerciseId}
                cefrLevel={exercise.cefrLevel}
                teil={exercise.teil}
                teilName={exercise.teilName}
                topic={exercise.topic}
                textsJson={exercise.textsJson as any}
                imagesJson={exercise.imagesJson as any}
                questions={exercise.questions.map(q => ({
                    id: q.id,
                    questionNumber: q.questionNumber,
                    questionType: q.questionType,
                    linkedText: q.linkedText,
                    statement: q.statement,
                    options: q.options as string[] | null,
                    sortOrder: q.sortOrder,
                }))}
            />
        </div>
    )
}
