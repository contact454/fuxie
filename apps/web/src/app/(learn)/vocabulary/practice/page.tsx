/**
 * `/vocabulary/practice` learner surface.
 *
 * Wires the backbone hero (mascot=companion + Primary_CTA "Bắt đầu") above
 * the existing PracticeHub theme path. When the learner has no vocabulary
 * cards yet (Req 5.5), the page short-circuits to a `<StateShell>`
 * empty-state with mascot=guard + Primary_CTA "Học từ đầu tiên".
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: Gamification Designer (companion semantics)
 *
 * Spec source-of-truth:
 *   - Task 10.2 (gamified-ui-asset-rollout)
 *   - design.md §I.3 (Vocabulary Collection Book)
 *   - requirements.md Req 5.3, 5.5, 11.3
 */

import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { getServerUser } from '@/lib/auth/server-auth'
import {
    getVocabularyLevels,
    getVocabularyThemes,
    mapVocabularyThemes,
    type CefrLevel,
} from '@/lib/content/vocabulary'
import { getLearnerVocabularyCardCount } from '@/lib/srs/stats'
import { PracticeHubDynamic } from '@/components/vocabulary/PracticeHubDynamic'
import { StateShell } from '@/components/gamification/state-shell'
import { VocabularyPracticeHero } from '@/components/vocabulary/vocabulary-practice-hero'

export const metadata = {
    title: 'Fuxie - Luyện từ vựng',
    description: 'Bài luyện từ vựng: trắc nghiệm, ghép cặp, chính tả và nhiều dạng khác',
}

async function getThemesForPractice(cefrLevel: CefrLevel, locale: string) {
    return mapVocabularyThemes(await getVocabularyThemes(cefrLevel)).map((t) => ({
        ...t,
        nameNative: (t.translations as Record<string, string>)?.[locale] || '',
    }))
}

export default async function PracticePage() {
    const serverUser = await getServerUser()
    if (!serverUser) redirect('/login')

    const t = await getTranslations('Vocabulary')
    const [availableLevels, learnerCardCount] = await Promise.all([
        getVocabularyLevels(),
        getLearnerVocabularyCardCount(serverUser.userId),
    ])
    const defaultLevel: CefrLevel = availableLevels[0] || 'A1'

    // Req 5.5: empty state when the learner has no vocabulary cards yet.
    // Mascot=guard (resolved via SURFACE_MASCOT_CONFIG['vocabulary'].empty)
    // + single Primary_CTA "Học từ đầu tiên" inside the first viewport.
    if (learnerCardCount === 0) {
        return (
            <div className="mx-auto max-w-2xl px-4 py-8">
                <StateShell
                    surfaceId="vocabulary"
                    state="empty"
                    title={t('emptyState.title')}
                    message={t('emptyState.message')}
                    primaryCta={{
                        label: t('emptyState.ctaLabel'),
                        href: '/course',
                    }}
                />
            </div>
        )
    }

    const themes = await getThemesForPractice(
        defaultLevel,
        serverUser.uiLanguage || 'vi',
    )

    // Default-state Primary_CTA "Bắt đầu" jumps into the first theme's mixed
    // practice run. Falls back to `/vocabulary` when no themes are seeded
    // for the level (defensive — themes seeded by content pipeline).
    const firstTheme = themes[0]
    const ctaHref = firstTheme
        ? `/vocabulary/practice/mixed?theme=${firstTheme.slug}&level=${defaultLevel}`
        : '/vocabulary'

    return (
        <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
            <VocabularyPracticeHero
                eyebrow={t('practice.eyebrow', { level: defaultLevel })}
                title={t('practice.title')}
                message={t('practice.message')}
                ctaLabel={t('practice.ctaLabel')}
                ctaHref={ctaHref}
            />

            <PracticeHubDynamic
                themes={themes}
                availableLevels={availableLevels}
                initialLevel={defaultLevel}
            />
        </div>
    )
}
