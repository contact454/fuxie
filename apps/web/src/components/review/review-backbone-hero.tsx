/**
 * ReviewBackboneHero — first-viewport backbone block for the Review surface
 * (`/review`).
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: Gamification Designer (batch reward preview),
 *               Design System Designer (color tokens)
 *
 * Spec source-of-truth:
 *   - Task 14.1 (gamified-ui-asset-rollout)
 *   - design.md §I.7 (Review surface)
 *   - requirements.md Req 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 *
 * Responsibility:
 *   Render the first-viewport block of `/review` so that on mobile the
 *   learner sees, top→bottom:
 *     1. Mascot (`coach` for default, `cheer` for empty/reached-goal,
 *        `guard` for error — error branch is owned by `error.tsx`).
 *     2. Two saturated counters: items due today (Bright Sky blue) and
 *        items overdue (deep blue). Numbers > 9999 render as "9999+"
 *        (Req 9.2). Red is forbidden (Req 9.3).
 *     3. Single Primary_CTA (≥48×48 dp via `variant="review"`).
 *        - default → "Ôn ngay"   (Req 9.1)
 *        - empty   → "Học bài mới" (Req 9.4)
 *        - error   → owned by `error.tsx` (StateShell with "Thử lại",
 *          NOT "Ôn ngay" per Req 9.6).
 *     4. Reward preview chip "chưa nhận" while default state has pending
 *        items (Req 9.5). Carries `data-reward-state="preview"` so the
 *        Bright Sky / amber palette guard recognises the subtree
 *        (Req 16.1, 16.2).
 *
 * The hero is intentionally a thin server-renderable presentational block
 * — interactive session orchestration lives in `ReviewClient` below the
 * hero. The "Ôn ngay" CTA links to the in-page anchor `#review-session`
 * so it stays inside the first viewport budget and works without
 * client-side hydration.
 *
 * Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5
 *            (Req 9.6 is asserted by the absence of "Ôn ngay" / presence
 *             of "Thử lại" in the surface's `error.tsx`.)
 */

import Link from 'next/link'

import { MascotRoleHost } from '@/components/gamification/mascot-role-host'
import { PrimaryCta } from '@/components/ui/primary-cta'
import { fx } from '@/components/ui/fuxie-ui'

// -----------------------------------------------------------------------------
// Public types
// -----------------------------------------------------------------------------

export type ReviewHeroState = 'default' | 'empty'

export interface ReviewBackboneHeroProps {
    /**
     * `default` — at least one due-today or overdue item exists.
     *             Mascot=coach, CTA="Ôn ngay", reward preview "chưa nhận"
     *             rendered.
     * `empty`   — both `dueToday` and `overdue` are 0 (Req 9.4).
     *             Mascot=cheer (learner reached goal), CTA="Học bài mới".
     */
    state: ReviewHeroState
    /** Items whose `nextReviewAt` falls inside today's calendar day. */
    dueToday: number
    /** Items whose `nextReviewAt` is before the start of today. */
    overdue: number
    /** Localized label for the due-today counter (e.g. "Hôm nay đến hạn"). */
    dueLabel: string
    /** Localized label for the overdue counter (e.g. "Quá hạn"). */
    overdueLabel: string
    /**
     * Localized Primary_CTA label.
     * - default → "Ôn ngay"
     * - empty   → "Học bài mới"
     */
    ctaLabel: string
    /** Internal href the Primary_CTA navigates to. */
    ctaHref: string
    /** Localized hero title (eyebrow). */
    title: string
    /** Localized hero supporting copy. */
    message: string
    /**
     * Localized reward-preview chip label shown while default state still
     * has pending items (Req 9.5). Defaults to "chưa nhận".
     */
    rewardPreviewLabel?: string
}

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

/** Req 9.2 — display ceiling for due/overdue counts. */
export const REVIEW_DISPLAY_CEILING = 9999

/**
 * Saturate a non-negative integer into the Review hero counter format.
 *
 * - Negative values are clamped to 0 (defensive — the SRS bucket counts
 *   are non-negative by construction).
 * - Non-integers are floored.
 * - Values strictly greater than `REVIEW_DISPLAY_CEILING` (9999) render
 *   as `"9999+"` per Req 9.2.
 *
 * Validates: Requirement 9.2
 */
export function formatReviewCount(value: number): string {
    if (!Number.isFinite(value) || value <= 0) {
        return '0'
    }
    const n = Math.floor(value)
    if (n > REVIEW_DISPLAY_CEILING) {
        return `${REVIEW_DISPLAY_CEILING}+`
    }
    return String(n)
}

const DEFAULT_REWARD_PREVIEW_LABEL = 'chưa nhận'

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

/**
 * Composition-only block. Server-renderable. Does NOT own SRS session
 * state — that stays in the `ReviewClient` below it.
 */
export function ReviewBackboneHero({
    state,
    dueToday,
    overdue,
    dueLabel,
    overdueLabel,
    ctaLabel,
    ctaHref,
    title,
    message,
    rewardPreviewLabel = DEFAULT_REWARD_PREVIEW_LABEL,
}: ReviewBackboneHeroProps) {
    const isDefault = state === 'default'
    // Req 9.4 — empty state is keyed off zero due AND zero overdue.
    // We trust the parent's classification but cross-check so a
    // misconfigured `state` cannot expose the "Ôn ngay" CTA on a hero
    // with zero items.
    const isEmpty = state === 'empty'

    const dueDisplay = formatReviewCount(dueToday)
    const overdueDisplay = formatReviewCount(overdue)

    return (
        <section
            data-role="review-backbone-hero"
            data-surface-id="review"
            data-surface-state={state}
            className={fx(
                'relative flex w-full flex-col gap-4',
                'rounded-3xl bg-[var(--fuxie-blue-50)] px-5 py-5',
                'ring-1 ring-[var(--fuxie-blue-200)]/60',
                'sm:px-6 sm:py-6',
            )}
        >
            {/* Title row — mascot + headline (Req 9.4 mascot rules). */}
            <div className="flex items-start gap-4">
                <MascotRoleHost
                    surfaceId="review"
                    state={state}
                    // Req 9.4 — empty state uses cheer role; the hero
                    // owner has already validated `dueToday + overdue === 0`,
                    // which legitimizes cheer via the
                    // `state === 'empty' && emptyReachedGoal === true`
                    // invariant in MascotRoleHost (Req 12.5).
                    emptyReachedGoal={isEmpty}
                    size={72}
                    priority
                />
                <div className="min-w-0 flex-1">
                    <h1
                        data-role="review-hero-title"
                        className="text-base font-extrabold leading-snug text-[var(--fuxie-blue-900)] sm:text-lg"
                    >
                        {title}
                    </h1>
                    <p
                        data-role="review-hero-message"
                        className="mt-1 text-xs font-semibold leading-relaxed text-[var(--fuxie-blue-700)]"
                    >
                        {message}
                    </p>
                </div>
            </div>

            {/* Counters — Req 9.2 (saturation), Req 9.3 (Bright Sky for due,
                deep blue for overdue, never red).
                The `data-review-bucket` attribute makes property tests
                deterministic without parsing visual style. */}
            <div className="grid grid-cols-2 gap-3">
                <div
                    data-role="review-counter"
                    data-review-bucket="due-today"
                    data-review-count={Math.max(0, Math.floor(dueToday) || 0)}
                    className={fx(
                        'flex flex-col items-start gap-1 rounded-2xl bg-white px-4 py-3',
                        'ring-1 ring-[var(--fuxie-blue-200)]',
                    )}
                >
                    <span className="text-[10px] font-black uppercase tracking-wide text-[var(--fuxie-blue-600)]">
                        {dueLabel}
                    </span>
                    <span
                        data-role="review-counter-value"
                        className="text-3xl font-black leading-none text-[var(--fuxie-action)]"
                    >
                        {dueDisplay}
                    </span>
                </div>
                <div
                    data-role="review-counter"
                    data-review-bucket="overdue"
                    data-review-count={Math.max(0, Math.floor(overdue) || 0)}
                    className={fx(
                        'flex flex-col items-start gap-1 rounded-2xl bg-white px-4 py-3',
                        'ring-1 ring-[var(--fuxie-blue-200)]',
                    )}
                >
                    <span className="text-[10px] font-black uppercase tracking-wide text-[var(--fuxie-blue-600)]">
                        {overdueLabel}
                    </span>
                    <span
                        data-role="review-counter-value"
                        className="text-3xl font-black leading-none text-[var(--fuxie-blue-900)]"
                    >
                        {overdueDisplay}
                    </span>
                </div>
            </div>

            {/* Reward preview — Req 9.5. The chip carries
                `data-reward-state="preview"` so reward-amber containment
                checks (Req 16.1, 16.2) recognise the subtree as a
                legitimate reward zone. The "chưa nhận" label only shows
                in the default (still-pending) state. */}
            {isDefault ? (
                <div
                    data-role="review-reward-preview"
                    data-reward-state="preview"
                    data-reward-context="true"
                    className={fx(
                        'inline-flex items-center gap-2 self-start rounded-full px-3 py-1',
                        'bg-[#FFF7E0] text-xs font-black text-[var(--fuxie-blue-900)]',
                        'ring-1 ring-inset ring-[var(--fuxie-reward,#FFB703)]/40',
                    )}
                >
                    <span aria-hidden="true">🎁</span>
                    <span data-role="review-reward-preview-label">
                        {rewardPreviewLabel}
                    </span>
                </div>
            ) : null}

            {/* Single Primary_CTA — Req 9.1 / 9.4.
                `variant="review"` enforces ≥48×48 dp via PrimaryCta. */}
            <div className="flex" data-cta-context={state}>
                <PrimaryCta
                    asChild
                    variant="review"
                    className="w-full sm:w-auto"
                >
                    <Link href={ctaHref}>{ctaLabel}</Link>
                </PrimaryCta>
            </div>
        </section>
    )
}
