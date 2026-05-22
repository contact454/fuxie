import { redirect } from 'next/navigation'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'
import {
    getVocabularyLevels,
    getVocabularyThemes,
    mapVocabularyThemes,
    type CefrLevel,
} from '@/lib/content/vocabulary'
import {
    getVocabularyDueCountsByLevel,
    getVocabularyReviewBucketCounts,
    getVocabularyThemeSrsProgress,
} from '@/lib/srs/stats'
import { ReviewClientDynamic } from '@/components/srs/ReviewClientDynamic'
import { ReviewBackboneHero } from '@/components/review/review-backbone-hero'
import type { ReactNode } from 'react'

export const metadata = {
    title: 'Fuxie - Ôn tập SRS',
    description: 'Ôn từ vựng bằng flashcard và lịch nhắc SRS',
}

const REVIEW_VISUAL_QA_LEVELS = ['A1', 'A2', 'B1']
const REVIEW_VISUAL_QA_THEMES = [
    {
        id: 'visual-review-food',
        slug: 'visual-review-food',
        name: 'Essen und Trinken',
        nameNative: 'Ăn uống',
        cefrLevel: 'A1',
        imageUrl: null,
        wordCount: 24,
        srsProgress: { total: 24, learned: 24, due: 0 },
    },
    {
        id: 'visual-review-time',
        slug: 'visual-review-time',
        name: 'Termine und Zeit',
        nameNative: 'Lịch hẹn và thời gian',
        cefrLevel: 'A1',
        imageUrl: null,
        wordCount: 18,
        srsProgress: { total: 18, learned: 18, due: 0 },
    },
]

function isReviewVisualQaFixture(params: { fixture?: string } | undefined) {
    return process.env.NODE_ENV !== 'production' && params?.fixture === 'visual-qa'
}

function ReviewRouteShell({
    visualState,
    children,
}: {
    visualState: 'default' | 'empty'
    children: ReactNode
}) {
    return (
        <div
            className="max-w-5xl mx-auto px-4 py-8"
            data-route="review"
            data-slice="slice-1"
            data-module="04-review"
            data-visual-state={visualState}
        >
            {children}
        </div>
    )
}

async function getThemesForLevel(userId: string, cefrLevel: CefrLevel, locale: string) {
    const themes = await getVocabularyThemes(cefrLevel)

    const srsMap = await getVocabularyThemeSrsProgress(userId, cefrLevel)

    return mapVocabularyThemes(themes).map(theme => ({
        ...theme,
        nameNative: (theme.translations as Record<string, string>)?.[locale] || '',
        srsProgress: srsMap[theme.id]
            ? {
                total: srsMap[theme.id]!.total,
                learned: srsMap[theme.id]!.learned,
                due: srsMap[theme.id]!.due,
            }
            : { total: 0, learned: 0, due: 0 },
    }))
}

async function getDueCounts(userId: string) {
    return getVocabularyDueCountsByLevel(userId)
}

/**
 * Resolve the backbone hero state from the bucketed SRS counts per Req 9.4.
 *
 * - `empty`   when both `dueToday` and `overdue` are 0 — Mascot=cheer,
 *             Primary_CTA "Học bài mới" (Req 9.4).
 * - `default` otherwise — Mascot=coach, Primary_CTA "Ôn ngay"
 *             (Req 9.1).
 *
 * The `error` branch is owned by `error.tsx` via `<StateShell>` so this
 * function never returns `'error'` (Req 9.6).
 */
function resolveReviewHeroState(buckets: {
    dueToday: number
    overdue: number
}): 'default' | 'empty' {
    if (buckets.dueToday === 0 && buckets.overdue === 0) {
        return 'empty'
    }
    return 'default'
}

export default async function ReviewPage({
    searchParams,
}: {
    searchParams: Promise<{ state?: string; fixture?: string }>
}) {
    const params = await searchParams

    if (isReviewVisualQaFixture(params) && params.state === 'empty') {
        return (
            <ReviewRouteShell visualState="empty">
                <div className="mb-6" data-role="review-empty-state">
                    <ReviewBackboneHero
                        state="empty"
                        dueToday={0}
                        overdue={0}
                        dueLabel="Heute fällig"
                        overdueLabel="Überfällig"
                        title="Heute ist dein Review-Fach leer"
                        message="Keine Karten sind fällig. Du kannst entspannt neue Wörter lernen oder morgen wiederkommen."
                        ctaLabel="Neue Wörter lernen"
                        ctaHref="/course"
                    />
                </div>

                <div id="review-session">
                    <ReviewClientDynamic
                        themes={REVIEW_VISUAL_QA_THEMES}
                        availableLevels={REVIEW_VISUAL_QA_LEVELS}
                        initialLevel="A1"
                        dueCounts={{ A1: 0, A2: 0, B1: 0 }}
                        totalDueAll={0}
                    />
                </div>
            </ReviewRouteShell>
        )
    }

    const serverUser = await getServerUser()
    if (!serverUser) redirect('/login')

    // All 3 queries run in parallel instead of sequential
    const [profile, availableLevels, bucketCounts] = await Promise.all([
        prisma.userProfile.findFirst({
            where: { userId: serverUser.userId },
            select: { currentLevel: true },
        }),
        getVocabularyLevels(),
        getVocabularyReviewBucketCounts(serverUser.userId),
    ])
    const userLevel = (profile?.currentLevel ?? 'A1') as CefrLevel

    // Themes + per-level due counts also in parallel (used by ReviewClient)
    const [themes, dueCounts] = await Promise.all([
        getThemesForLevel(serverUser.userId, userLevel, serverUser.uiLanguage || 'vi'),
        getDueCounts(serverUser.userId),
    ])

    const totalDueAll = Object.values(dueCounts).reduce((s, n) => s + n, 0)

    const heroState = resolveReviewHeroState(bucketCounts)

    return (
        <ReviewRouteShell visualState={heroState}>
            {/* Backbone hero — Task 14.1, Req 9.1–9.5.
                Copy is rendered as plain Vietnamese strings to mirror the
                existing ReviewClient copy below; a Review namespace can be
                introduced when the surface is fully internationalized. */}
            <div className="mb-6" data-role={heroState === 'empty' ? 'review-empty-state' : undefined}>
                {heroState === 'default' ? (
                    <ReviewBackboneHero
                        state="default"
                        dueToday={bucketCounts.dueToday}
                        overdue={bucketCounts.overdue}
                        dueLabel="Hôm nay đến hạn"
                        overdueLabel="Quá hạn"
                        title="Giữ trí nhớ luôn nóng"
                        message="Mỗi lượt ôn là một vòng giữ từ vựng khỏi rơi khỏi trí nhớ. Fuxie ưu tiên thẻ đến hạn trước, rồi mới tới quá hạn."
                        ctaLabel="Ôn ngay"
                        ctaHref="#review-session"
                        rewardPreviewLabel="chưa nhận"
                    />
                ) : (
                    <ReviewBackboneHero
                        state="empty"
                        dueToday={0}
                        overdue={0}
                        dueLabel="Hôm nay đến hạn"
                        overdueLabel="Quá hạn"
                        title="Hôm nay đã sạch nợ ôn"
                        message="Không có thẻ nào đến hạn. Đây là lúc tốt nhất để học thêm từ mới và mở rộng kho từ của bạn."
                        ctaLabel="Học bài mới"
                        ctaHref="/course"
                    />
                )}
            </div>

            <div id="review-session">
                <ReviewClientDynamic
                    themes={themes}
                    availableLevels={availableLevels}
                    initialLevel={userLevel}
                    dueCounts={dueCounts}
                    totalDueAll={totalDueAll}
                />
            </div>
        </ReviewRouteShell>
    )
}
