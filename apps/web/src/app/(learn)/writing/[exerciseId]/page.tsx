import { notFound, redirect } from 'next/navigation'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'
import { WritingPlayer } from '@/components/writing/writing-player'

export async function generateMetadata({ params }: { params: Promise<{ exerciseId: string }> }) {
    const { exerciseId } = await params
    return {
        title: `Fuxie 🦊 — Schreiben ${exerciseId}`,
    }
}

export default async function WritingExercisePage({ params }: { params: Promise<{ exerciseId: string }> }) {
    const serverUser = await getServerUser()
    if (!serverUser) redirect('/login')

    const { exerciseId } = await params

    const exercise = await prisma.writingExercise.findUnique({
        where: { exerciseId },
    })

    if (!exercise) notFound()

    return (
        <div className="max-w-6xl mx-auto px-4 py-6">
            <WritingPlayer
                exerciseId={exercise.exerciseId}
                cefrLevel={exercise.cefrLevel}
                teil={exercise.teil}
                teilName={exercise.teilName}
                textType={exercise.textType}
                register={exercise.register}
                topic={exercise.topic}
                instruction={exercise.instruction}
                instructionVi={exercise.instructionVi}
                situation={exercise.situation}
                contentPoints={exercise.contentPoints as string[]}
                formFields={exercise.formFields as any[] | null}
                sourceText={exercise.sourceText}
                sourceTextType={exercise.sourceTextType}
                grafikDesc={exercise.grafikDesc}
                minWords={exercise.minWords}
                maxWords={exercise.maxWords}
                timeMinutes={exercise.timeMinutes}
                maxScore={exercise.maxScore}
                rubricJson={exercise.rubricJson as any}
            />
        </div>
    )
}
