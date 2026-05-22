/**
 * `/vocabulary/microgames` learner surface.
 *
 * Wires the backbone hero (mascot=companion + reward preview chip
 * "+10 Fucoin" + Primary_CTA "Bắt đầu") above the existing
 * VocabularyMicrogameHub. When the learner has no vocabulary cards yet
 * (Req 5.5), the page short-circuits to a `<StateShell>` empty-state with
 * mascot=guard + Primary_CTA "Học từ đầu tiên".
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: Gamification Designer (preview reward copy)
 *
 * Spec source-of-truth:
 *   - Task 10.2 (gamified-ui-asset-rollout)
 *   - design.md §I.3 (Vocabulary Collection Book — microgames preview)
 *   - design.md §E (Reward_State handling)
 *   - requirements.md Req 5.4, 5.5, 11.3
 */

import { redirect } from 'next/navigation'

import { getServerUser } from '@/lib/auth/server-auth'
import {
    getVocabularyLevels,
    getVocabularyThemes,
    mapVocabularyThemes,
    type CefrLevel,
} from '@/lib/content/vocabulary'
import { getLearnerVocabularyCardCount } from '@/lib/srs/stats'
import { VocabularyMicrogameHub } from '@/components/gameplay/VocabularyMicrogameHub'
import { StateShell } from '@/components/gamification/state-shell'
import { VocabularyMicrogamesHero } from '@/components/vocabulary/vocabulary-microgames-hero'
import { VOCABULARY_MICROGAMES } from '@/lib/gamification/lesson-gameplay-expansion'

export const metadata = {
    title: 'Fuxie - Vocabulary Microgames',
    description: 'Speed Match, Cloze Streak, and Boss Review for vocabulary practice.',
}

export default async function VocabularyMicrogamesPage({
    searchParams,
}: {
    searchParams?: Promise<{ theme?: string; level?: string }>
}) {
    const serverUser = await getServerUser()
    if (!serverUser) redirect('/login')

    const params = await searchParams
    const [availableLevels, learnerCardCount] = await Promise.all([
        getVocabularyLevels(),
        getLearnerVocabularyCardCount(serverUser.userId),
    ])

    // Req 5.5: empty state when the learner has no vocabulary cards yet.
    // Same `surfaceId="vocabulary"` mapping as the practice page so the
    // single source of truth in `SURFACE_MASCOT_CONFIG` resolves the
    // mascot=guard role automatically.
    if (learnerCardCount === 0) {
        return (
            <div className="mx-auto max-w-2xl px-4 py-8">
                <StateShell
                    surfaceId="vocabulary"
                    state="empty"
                    title="Bộ sưu tập của bạn còn trống"
                    message="Hãy bắt đầu với bài học đầu tiên để mở khóa thẻ từ vựng đầu tiên cho Fuxie."
                    primaryCta={{
                        label: 'Học từ đầu tiên',
                        href: '/course',
                    }}
                />
            </div>
        )
    }

    const initialLevel = (params?.level && availableLevels.includes(params.level as CefrLevel)
        ? params.level
        : availableLevels[0] || 'A1') as CefrLevel

    const themeGroups = await Promise.all(
        availableLevels.map(async (level) =>
            mapVocabularyThemes(await getVocabularyThemes(level as CefrLevel)),
        ),
    )
    const themes = themeGroups.flat().map((theme) => ({
        id: theme.id,
        slug: theme.slug,
        name: theme.name,
        nameNative:
            (theme.translations as Record<string, string>)?.[serverUser.uiLanguage || 'vi'] ||
            theme.name,
        cefrLevel: theme.cefrLevel,
        wordCount: theme.wordCount,
    }))

    // Default-state Primary_CTA "Bắt đầu" jumps into the first microgame
    // for the resolved theme. Falls back to the practice catalog when no
    // theme is available for the level.
    const initialThemeSlug =
        (params?.theme && themes.find((t) => t.slug === params.theme)?.slug) ??
        themes.find((t) => t.cefrLevel === initialLevel)?.slug ??
        themes[0]?.slug

    const firstMicrogame = VOCABULARY_MICROGAMES[0]
    const ctaHref =
        initialThemeSlug && firstMicrogame
            ? firstMicrogame.hrefForTheme(initialThemeSlug, initialLevel)
            : '/vocabulary/practice'

    return (
        <>
            <div className="mx-auto max-w-6xl px-4 pt-8">
                <VocabularyMicrogamesHero
                    eyebrow={`Trò chơi từ vựng • ${initialLevel}`}
                    title="Một ván ngắn, một phần thưởng nhỏ"
                    message="Hoàn thành ván để Fuxie ghi nhận điểm và thẻ thưởng vào sổ sưu tập."
                    ctaLabel="Bắt đầu"
                    ctaHref={ctaHref}
                    rewardLabel="+10 Fucoin"
                />
            </div>

            <VocabularyMicrogameHub
                themes={themes}
                availableLevels={availableLevels}
                initialLevel={initialLevel}
                initialTheme={params?.theme ?? null}
            />
        </>
    )
}
