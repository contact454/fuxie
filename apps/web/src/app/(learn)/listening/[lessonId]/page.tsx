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
 *  - Outer shell uses `hideDefaultPrimaryCta` so Start/Check/Continue
 *    inside the immersive player remain the sole primary actions.
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
                    correctAnswer: true,
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
    const isVisualQa = visualParams?.fixture === 'visual-qa'

    if (isVisualQa) {
        return {
            title: 'Fuxie - Luyện nghe Visual QA',
            description: 'Mock bài nghe tiếng Đức',
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

interface VisualQaQuestion {
    id: string
    questionNumber: number
    questionType: string
    questionText: string
    questionTextNative: string | null
    options: string[]
    correctAnswer: string
    sortOrder: number
    translations: Record<string, string>
}

interface VisualQaLesson {
    lessonId: string
    title: string
    topic: string
    cefrLevel: string
    teil: number
    teilName: string
    taskType: string
    audioUrl: string
    audioDuration: number
    backgroundScene: string
    questions: VisualQaQuestion[]
    transcript: {
        lines: Array<{ speaker: string; text: string }>
    }
    maxPlays: number
}

type LessonQuestion = {
    id: string
    questionNumber: number
    questionType: string
    questionText: string
    options: unknown
    correctAnswer: string
    sortOrder: number
    translations: unknown
    questionTextNative?: string | null
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

    const { lessonId } = await params
    const isVisualQa = visualParams?.fixture === 'visual-qa'
    const mockState = visualParams?.state || ''

    let lesson: VisualQaLesson | Awaited<ReturnType<typeof getListeningLesson>>
    let uiLanguage = 'vi'

    if (isVisualQa) {
        lesson = {
            lessonId: 'L-A1-GOETHE-001-T1',
            title: 'Bài nghe số 1', // locale-allow — visual fixture
            topic: 'Gặp gỡ ở văn phòng', // locale-allow — visual fixture
            cefrLevel: 'A1',
            teil: 1,
            teilName: 'Hội thoại ngắn', // locale-allow — visual fixture
            taskType: 'Trắc nghiệm', // locale-allow — visual fixture
            audioUrl: '/audio/listening/A1-Teil1.mp3',
            audioDuration: 120,
            backgroundScene: 'cafe',
            questions: [
                {
                    id: 'q1',
                    questionNumber: 1,
                    questionType: 'multiple_choice',
                    questionText: 'Wer ist Herr Land?', // locale-allow — German content
                    questionTextNative: 'Ai là ông Land?', // locale-allow — visual fixture
                    options: [
                        'Der neue Kollege aus Berlin', // locale-allow — German content
                        'Der Chef der Marketingabteilung', // locale-allow — German content
                        'Ein Kunde aus Hamburg', // locale-allow — German content
                    ],
                    correctAnswer: 'a',
                    sortOrder: 1,
                    translations: {},
                },
            ],
            transcript: {
                lines: [
                    { speaker: 'Frau Schmidt', text: 'Guten Tag, Herr Land. Willkommen in Berlin.' }, // locale-allow — German content
                    { speaker: 'Herr Land', text: 'Guten Tag, Frau Schmidt. Freut mich, Sie kennenzulernen.' }, // locale-allow — German content
                ],
            },
            maxPlays: 2,
        } satisfies VisualQaLesson
    } else {
        const serverUser = await getServerUser()
        if (!serverUser) redirect('/login')
        uiLanguage = serverUser.uiLanguage || 'vi'

        const dbLesson = await getListeningLesson(lessonId)
        if (!dbLesson) notFound()
        lesson = dbLesson
    }

    const tSkill = await getTranslations('SkillPlayer')

    const questions = (lesson.questions as LessonQuestion[]).map((q) => {
        const translations =
            q.translations && typeof q.translations === 'object'
                ? (q.translations as Record<string, string>)
                : {}
        const nativeFromFixture =
            typeof q.questionTextNative === 'string' ? q.questionTextNative : null
        const options = Array.isArray(q.options)
            ? (q.options as string[])
            : []

        return {
            id: q.id,
            questionNumber: q.questionNumber,
            questionType: q.questionType,
            questionText: q.questionText,
            options,
            correctAnswer: q.correctAnswer,
            sortOrder: q.sortOrder,
            questionTextNative: isVisualQa
                ? nativeFromFixture
                : translations[uiLanguage] || null,
        }
    })

    const transcript =
        lesson.transcript &&
        typeof lesson.transcript === 'object' &&
        lesson.transcript !== null
            ? (lesson.transcript as { lines?: Array<{ speaker?: string; text: string }> })
            : null

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
                    questions,
                    transcript,
                    maxPlays: MAX_PLAYS[lesson.cefrLevel] || 2,
                    mockState: isVisualQa ? mockState : undefined,
                    isVisualQa: isVisualQa,
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
