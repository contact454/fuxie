/**
 * Writing exercise player surface — composes the existing
 * `WritingPlayerDynamic` inside the gamified-ui-asset-rollout backbone
 * (task 11.3 of `gamified-ui-asset-rollout`).
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: Design System Designer (world prop scrim),
 *               Gamification Designer (progress + reward copy)
 *
 * Composition contract:
 *  - Wraps the surface in `SkillPlayerShell` (via `WritingSkillShell`)
 *    with `surfaceId="writing"` and `worldPropTags={['desk', 'workshop']}`
 *    so the world prop resolves to `postOffice` / `postOfficeCounter`
 *    (Requirement 6.8) via `pickWorldProp` — symmetric with the Reading
 *    (`['library']`) and Listening (`['studio', 'radio']`) surfaces from
 *    task 11.1.
 *  - The shell renders the editor area inside its `data-role="skill-content"`
 *    wrapper so the motivation layer's sticky-top placement keeps the two
 *    bounding boxes disjoint (design §C, Requirement 6.2 / Property 13).
 *  - Renders a bottom Primary_CTA `Tiếp tục` pointing to `/writing` so
 *    the learner has the canonical next-action even when the inner
 *    player is mid-session (Property 8 / Requirement 11.5).
 *  - Provides asset-failure handling: if the dynamic chunk does not
 *    mount within 10 seconds the shell flips into an error state with a
 *    single Primary_CTA `Thử lại`; after three consecutive failures the
 *    CTA downgrades to secondary and a localized fallback message
 *    points the learner back to `/dashboard` (Requirement 6.10, 6.11).
 *
 * The internal `WritingPlayer` keeps its own submit button as a plain
 * `<button>` (no `data-role="primary-cta"`), so this page renders exactly
 * one Primary_CTA per Property 8 (Requirement 19.8).
 *
 * Validates: Requirements 6.1, 6.2, 6.3, 6.8, 6.10, 6.11, 11.5
 */

import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getTranslations } from 'next-intl/server'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'
import { WritingSkillShell } from '@/components/writing/writing-skill-shell'
import { buildWritingQuestCheckpoints } from '@/lib/gamification/writing-quest-episode'
import {
    isSlice2VisualQaFixture,
    Slice2WritingErrorFixture,
    type Slice2VisualQaParams,
} from '@/components/visual-fixtures/slice-2-skill-fixtures'

export async function generateMetadata({
    params,
    searchParams,
}: {
    params: Promise<{ exerciseId: string }>
    searchParams?: Promise<{ fixture?: string }>
}) {
    const { exerciseId } = await params
    return {
        title: `Fuxie 🦊 — Schreiben ${exerciseId}`,
    }
}

export default async function WritingExercisePage({
    params,
    searchParams,
}: {
    params: Promise<{ exerciseId: string }>
    searchParams?: Promise<{ fixture?: string; state?: string }>
}) {
    const visualParams = await searchParams
    const isVisualQa = visualParams?.fixture === 'visual-qa'

    if (isVisualQa) {
        const tSkill = await getTranslations('SkillPlayer')
        const mockExercise = {
            exerciseId: 'W-A1-GOETHE-001',
            cefrLevel: 'A1' as const,
            teil: 1,
            teilName: 'Viết thư cá nhân',
            topic: 'Einladung zur Party',
            textType: 'E-Mail',
            register: 'informal',
            instruction: 'Schreiben Sie eine E-Mail an Ihren Freund Peter. Laden Sie ihn zu Ihrer Geburtstagsparty am Samstag ein. Sagen Sie, wann die Party anfängt und was er mitbringen soll.',
            translations: {
                vi: 'Hãy viết một email cho người bạn Peter. Mời anh ấy đến bữa tiệc sinh nhật của bạn vào thứ Bảy. Hãy cho biết khi nào bữa tiệc bắt đầu và anh ấy nên mang theo thứ gì.',
                en: 'Write an email to your friend Peter. Invite him to your birthday party on Saturday. Say when the party starts and what he should bring.'
            },
            situation: 'Sie haben am Samstag Geburtstag und feiern eine Party.',
            contentPoints: [
                'Mời Peter đến bữa tiệc sinh nhật',
                'Thời gian bắt đầu bữa tiệc',
                ' PETER nên mang theo đồ ăn hoặc thức uống gì'
            ],
            formFields: null,
            sourceText: null,
            sourceTextType: null,
            grafikDesc: null,
            minWords: 30,
            maxWords: 40,
            timeMinutes: 15,
            maxScore: 25,
            rubricJson: null
        }

        const checkpoints = buildWritingQuestCheckpoints(mockExercise.minWords)
        const totalCheckpoints = checkpoints.length

        return (
            <div className="max-w-6xl mx-auto px-4 py-6">
                <WritingSkillShell
                    player={{
                        exerciseId: mockExercise.exerciseId,
                        cefrLevel: mockExercise.cefrLevel,
                        teil: mockExercise.teil,
                        teilName: mockExercise.teilName,
                        textType: mockExercise.textType,
                        register: mockExercise.register,
                        topic: mockExercise.topic,
                        instruction: mockExercise.instruction,
                        instructionNative: mockExercise.translations.vi,
                        situation: mockExercise.situation,
                        contentPoints: mockExercise.contentPoints,
                        formFields: mockExercise.formFields,
                        sourceText: mockExercise.sourceText,
                        sourceTextType: mockExercise.sourceTextType,
                        grafikDesc: mockExercise.grafikDesc,
                        minWords: mockExercise.minWords,
                        maxWords: mockExercise.maxWords,
                        timeMinutes: mockExercise.timeMinutes,
                        maxScore: mockExercise.maxScore,
                        rubricJson: mockExercise.rubricJson as any,
                        isVisualQa: true,
                        mockState: visualParams?.state || '',
                    } as any}
                    primaryCtaHref="/writing"
                    totalCheckpoints={totalCheckpoints}
                    labels={{
                        primaryCtaLabel: tSkill('continueLabel'),
                        primaryCtaAriaLabel: tSkill('writingContinueAriaLabel'),
                        retryCtaLabel: tSkill('retryLabel'),
                        fallbackMessage: tSkill('writingFallbackMessage'),
                    }}
                />
            </div>
        )
    }

    const serverUser = await getServerUser()
    if (!serverUser) redirect('/login')

    const { exerciseId } = await params
    const locale = (await cookies()).get('NEXT_LOCALE')?.value || 'vi'

    const exercise = await prisma.writingExercise.findUnique({
        where: { exerciseId },
    })

    if (!exercise) notFound()

    const tSkill = await getTranslations('SkillPlayer')

    // Map the writing quest checkpoints (plan / draft / revise) to the
    // `total` of the motivation layer's progress text. Resolving this
    // server-side keeps the label stable on first paint and satisfies
    // Property 13 / Requirement 6.3.b (`^\d+/\d+$` with `done ≤ total`).
    const checkpoints = buildWritingQuestCheckpoints(exercise.minWords)
    const totalCheckpoints = checkpoints.length

    return (
        <div className="max-w-6xl mx-auto px-4 py-6">
            <WritingSkillShell
                player={{
                    exerciseId: exercise.exerciseId,
                    cefrLevel: exercise.cefrLevel,
                    teil: exercise.teil,
                    teilName: exercise.teilName,
                    textType: exercise.textType,
                    register: exercise.register,
                    topic: exercise.topic,
                    instruction: exercise.instruction,
                    instructionNative:
                        (exercise.translations as any)?.[locale] ||
                        (exercise.translations as any)?.['en'] ||
                        '',
                    situation: exercise.situation,
                    contentPoints: exercise.contentPoints as string[],
                    formFields: exercise.formFields as any[] | null,
                    sourceText: exercise.sourceText,
                    sourceTextType: exercise.sourceTextType,
                    grafikDesc: exercise.grafikDesc,
                    minWords: exercise.minWords,
                    maxWords: exercise.maxWords,
                    timeMinutes: exercise.timeMinutes,
                    maxScore: exercise.maxScore,
                    rubricJson: exercise.rubricJson as any,
                }}
                primaryCtaHref="/writing"
                totalCheckpoints={totalCheckpoints}
                labels={{
                    primaryCtaLabel: tSkill('continueLabel'),
                    primaryCtaAriaLabel: tSkill('writingContinueAriaLabel'),
                    retryCtaLabel: tSkill('retryLabel'),
                    fallbackMessage: tSkill('writingFallbackMessage'),
                }}
            />
        </div>
    )
}
