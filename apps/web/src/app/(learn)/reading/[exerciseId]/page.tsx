/**
 * Reading exercise player surface — composes the existing
 * `ReadingPlayerDynamic` inside the gamified-ui-asset-rollout backbone
 * (task 11.1 of `gamified-ui-asset-rollout`).
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: Design System Designer (world prop scrim),
 *               Gamification Designer (progress + reward copy)
 *
 * Composition contract:
 *  - Wraps the surface in `SkillPlayerShell` with `surfaceId="reading"`
 *    and `worldPropTags={['library']}` so the world prop resolves to
 *    `library` / `readingLibraryDesk` (Requirement 6.4) via
 *    `pickWorldProp`.
 *  - Renders a bottom Primary_CTA `Tiếp tục` pointing to `/reading` so
 *    the learner has the canonical next-action even when the inner
 *    player is mid-session (Property 8 / Req 11.5).
 *  - Provides asset-failure handling: if the passage data does not
 *    surface within 10 seconds of mount the shell flips into an error
 *    state with a single Primary_CTA `Thử lại`; after three consecutive
 *    failures the CTA downgrades to secondary and a localized fallback
 *    message points the learner back to `/dashboard` (Req 6.10, 6.11).
 *
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.10, 6.11, 11.5
 */

import { notFound, redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'
import { ReadingSkillShell } from '@/components/reading/reading-skill-shell'
import {
    isSlice2VisualQaFixture,
    Slice2ReadingSuccessFixture,
    type Slice2VisualQaParams,
} from '@/components/visual-fixtures/slice-2-skill-fixtures'

export async function generateMetadata({ params }: { params: Promise<{ exerciseId: string }> }) {
    const { exerciseId } = await params
    return {
        title: `Fuxie - Luyện đọc ${exerciseId}`,
    }
}

export default async function ReadingExercisePage({
    params,
    searchParams,
}: {
    params: Promise<{ exerciseId: string }>
    searchParams?: Promise<Slice2VisualQaParams>
}) {
    const visualParams = await searchParams

    if (isSlice2VisualQaFixture(visualParams, 'success')) {
        return <Slice2ReadingSuccessFixture />
    }

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

    const tSkill = await getTranslations('SkillPlayer')

    return (
        <div className="max-w-5xl mx-auto px-4 py-6">
            <ReadingSkillShell
                player={{
                    exerciseId: exercise.exerciseId,
                    cefrLevel: exercise.cefrLevel,
                    teil: exercise.teil,
                    teilName: exercise.teilName,
                    topic: exercise.topic,
                    textsJson: exercise.textsJson as any,
                    imagesJson: exercise.imagesJson as any,
                    questions: exercise.questions.map(q => ({
                        id: q.id,
                        questionNumber: q.questionNumber,
                        questionType: q.questionType,
                        linkedText: q.linkedText,
                        statement: q.statement,
                        options: q.options as string[] | null,
                        sortOrder: q.sortOrder,
                    })),
                }}
                primaryCtaHref="/reading"
                labels={{
                    primaryCtaLabel: tSkill('continueLabel'),
                    primaryCtaAriaLabel: tSkill('readingContinueAriaLabel'),
                    retryCtaLabel: tSkill('retryLabel'),
                    fallbackMessage: tSkill('readingFallbackMessage'),
                }}
            />
        </div>
    )
}
