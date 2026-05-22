/**
 * Listening lesson player surface — composes the existing
 * `LessonPlayerDynamic` inside the gamified-ui-asset-rollout backbone
 * (task 11.1 of `gamified-ui-asset-rollout`).
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: Design System Designer (world prop scrim),
 *               Gamification Designer (progress + reward copy)
 *
 * Composition contract:
 *  - Wraps the surface in `SkillPlayerShell` (via `ListeningSkillShell`)
 *    with `surfaceId="listening"` and `worldPropTags={['studio', 'radio']}`
 *    so the world prop resolves to `radioBooth` / `radioBoothConsole`
 *    (Requirement 6.5) via `pickWorldProp`.
 *  - The inner shell mounts a hidden `<audio preload="metadata">` probe
 *    bound to the lesson's `audioUrl`; `loadedmetadata` flips
 *    `assetLoaded=true` and `error` triggers `assetError`. If neither
 *    fires within 10 seconds the shell renders the error state with a
 *    single Primary_CTA `Thử lại`; three consecutive failures downgrade
 *    the CTA to secondary and surface a localized fallback message
 *    (Req 6.10, 6.11).
 *  - Renders a bottom Primary_CTA `Tiếp tục` pointing to `/listening` so
 *    the learner has the canonical next-action even when the inner
 *    player is mid-session (Property 8 / Req 11.5).
 *
 * Validates: Requirements 6.1, 6.2, 6.3, 6.5, 6.10, 6.11, 11.5
 */

import { redirect, notFound } from 'next/navigation'
import { cache } from 'react'
import { getTranslations } from 'next-intl/server'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'
import { ListeningSkillShell } from '@/components/listening/listening-skill-shell'
import {
    isSlice2VisualQaFixture,
    Slice2ListeningLoadingFixture,
    type Slice2VisualQaParams,
} from '@/components/visual-fixtures/slice-2-skill-fixtures'

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
                    translations: true,
                    options: true,
                    sortOrder: true,
                },
            },
        },
    })
})

export async function generateMetadata({
    params,
    searchParams,
}: {
    params: Promise<{ lessonId: string }>
    searchParams?: Promise<Slice2VisualQaParams>
}) {
    const visualParams = await searchParams
    if (isSlice2VisualQaFixture(visualParams, 'loading')) {
        return {
            title: 'Fuxie - Listening Visual QA',
            description: 'Slice 2 listening loading visual fixture',
        }
    }

    const { lessonId } = await params
    const lesson = await getListeningLesson(lessonId)
    return {
        title: lesson ? `Fuxie - ${lesson.topic}` : 'Fuxie - Luyện nghe',
        description: lesson?.title ?? 'Bài luyện nghe tiếng Đức',
    }
}

// Max replay mapping per CEFR level (Goethe rules)
const MAX_PLAYS: Record<string, number> = {
    A1: 2, A2: 2, B1: 2, B2: 2, C1: 2, C2: 1,
}

export default async function ListeningLessonPage({
    params,
    searchParams,
}: {
    params: Promise<{ lessonId: string }>
    searchParams?: Promise<Slice2VisualQaParams>
}) {
    const visualParams = await searchParams

    if (isSlice2VisualQaFixture(visualParams, 'loading')) {
        return <Slice2ListeningLoadingFixture />
    }

    const serverUser = await getServerUser()
    if (!serverUser) redirect('/login')

    const { lessonId } = await params

    const lesson = await getListeningLesson(lessonId)

    if (!lesson) notFound()

    const tSkill = await getTranslations('SkillPlayer')

    return (
        <div className="max-w-5xl mx-auto px-4 py-6">
            <ListeningSkillShell
                player={{
                    lessonId: lesson.lessonId,
                    title: lesson.title,
                    topic: lesson.topic,
                    cefrLevel: lesson.cefrLevel,
                    teil: lesson.teil,
                    teilName: lesson.teilName,
                    taskType: lesson.taskType,
                    audioUrl: lesson.audioUrl,
                    audioDuration: lesson.audioDuration,
                    backgroundScene: lesson.backgroundScene,
                    questions: lesson.questions.map(q => ({
                        ...q,
                        options: q.options as string[],
                        questionTextNative:
                            ((q.translations as Record<string, string>)?.[
                                serverUser.uiLanguage || 'vi'
                            ]) || null,
                    })),
                    transcript: lesson.transcript as any,
                    maxPlays: MAX_PLAYS[lesson.cefrLevel] || 2,
                }}
                primaryCtaHref="/listening"
                labels={{
                    primaryCtaLabel: tSkill('continueLabel'),
                    primaryCtaAriaLabel: tSkill('listeningContinueAriaLabel'),
                    retryCtaLabel: tSkill('retryLabel'),
                    fallbackMessage: tSkill('listeningFallbackMessage'),
                }}
            />
        </div>
    )
}
