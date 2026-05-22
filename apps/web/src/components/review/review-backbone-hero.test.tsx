/**
 * ReviewBackboneHero — snapshot/contract tests.
 *
 * Vai chinh: Frontend Engineer
 *
 * Spec source-of-truth:
 *   - Task 14.1 (gamified-ui-asset-rollout)
 *   - requirements.md Req 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 *
 * These tests check the CTA rules for the three Review surface states
 * (default / empty / error) the task acceptance calls out:
 *
 *   - Default — exactly one `data-role="primary-cta"` whose label is
 *     "Ôn ngay"; due-today counter uses `var(--fuxie-action)` (Bright
 *     Sky), overdue counter uses `var(--fuxie-blue-900)` (deep blue);
 *     reward preview chip with label "chưa nhận" is rendered (Req 9.5).
 *   - Empty — exactly one `data-role="primary-cta"` whose label is
 *     "Học bài mới"; the "Ôn ngay" CTA is NOT rendered; reward preview
 *     chip is suppressed (Req 9.4).
 *   - Error — exactly one `data-role="primary-cta"` whose label is
 *     "Thử lại"; the "Ôn ngay" CTA is NOT rendered (Req 9.6).
 *
 * Saturation rules (Req 9.2) are also covered here because they are
 * structural to the default-state hero and must survive any future
 * refactor of the counter cells.
 */

import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import { StateShell } from '@/components/gamification/state-shell'

import {
    REVIEW_DISPLAY_CEILING,
    ReviewBackboneHero,
    formatReviewCount,
} from './review-backbone-hero'

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function renderDefault(overrides: { dueToday?: number; overdue?: number } = {}) {
    return renderToStaticMarkup(
        <ReviewBackboneHero
            state="default"
            dueToday={overrides.dueToday ?? 12}
            overdue={overrides.overdue ?? 3}
            dueLabel="Hôm nay đến hạn"
            overdueLabel="Quá hạn"
            title="Giữ trí nhớ luôn nóng"
            message="Mỗi lượt ôn là một vòng giữ từ vựng khỏi rơi khỏi trí nhớ."
            ctaLabel="Ôn ngay"
            ctaHref="#review-session"
            rewardPreviewLabel="chưa nhận"
        />,
    )
}

function renderEmpty() {
    return renderToStaticMarkup(
        <ReviewBackboneHero
            state="empty"
            dueToday={0}
            overdue={0}
            dueLabel="Hôm nay đến hạn"
            overdueLabel="Quá hạn"
            title="Hôm nay đã sạch nợ ôn"
            message="Không có thẻ nào đến hạn. Đây là lúc tốt nhất để học thêm từ mới."
            ctaLabel="Học bài mới"
            ctaHref="/course"
        />,
    )
}

function renderError() {
    // The error state is owned by the surface's `error.tsx` via StateShell.
    // We render the same StateShell composition the boundary uses so the
    // snapshot test asserts the exact CTA shape Req 9.6 demands without
    // pulling in a Next.js error boundary harness.
    return renderToStaticMarkup(
        <StateShell
            surfaceId="review"
            state="error"
            title="Không tải được Ôn tập"
            message="Đã có lỗi khi tải dữ liệu ôn tập. Bạn thử lại nhé."
            primaryCta={{ label: 'Thử lại', onClick: () => {} }}
        />,
    )
}

function countMatches(html: string, pattern: RegExp): number {
    return (html.match(pattern) ?? []).length
}

// -----------------------------------------------------------------------------
// Default state — Req 9.1, 9.2, 9.3, 9.5
// -----------------------------------------------------------------------------

describe('ReviewBackboneHero — default state', () => {
    it('renders exactly one Primary_CTA with label "Ôn ngay" (Req 9.1)', () => {
        const html = renderDefault()
        expect(countMatches(html, /data-role="primary-cta"/g)).toBe(1)
        expect(html).toContain('Ôn ngay')
        expect(html).not.toContain('>Học bài mới<')
        expect(html).not.toContain('>Thử lại<')
    })

    it('exposes the surface state on the root for stable test selectors', () => {
        const html = renderDefault()
        expect(html).toContain('data-role="review-backbone-hero"')
        expect(html).toContain('data-surface-id="review"')
        expect(html).toContain('data-surface-state="default"')
    })

    it('renders due-today in Bright Sky blue and overdue in deep blue (Req 9.3)', () => {
        const html = renderDefault({ dueToday: 7, overdue: 2 })

        // Bright Sky blue token for due-today.
        const dueCellMatch = html.match(
            /data-review-bucket="due-today"[\s\S]*?data-role="review-counter-value"[^>]*>([\s\S]*?)<\/span>/,
        )
        expect(dueCellMatch, 'due-today counter cell must be rendered').not.toBeNull()
        expect(dueCellMatch![0]).toContain('text-[var(--fuxie-action)]')
        expect(dueCellMatch![0]).not.toContain('red')

        // Deep blue token for overdue.
        const overdueCellMatch = html.match(
            /data-review-bucket="overdue"[\s\S]*?data-role="review-counter-value"[^>]*>([\s\S]*?)<\/span>/,
        )
        expect(overdueCellMatch, 'overdue counter cell must be rendered').not.toBeNull()
        expect(overdueCellMatch![0]).toContain('text-[var(--fuxie-blue-900)]')
        expect(overdueCellMatch![0]).not.toContain('red')

        // No red text token anywhere in the hero (Req 9.3).
        expect(html).not.toMatch(/text-(red|rose)-\d+/)
    })

    it('renders the "chưa nhận" reward preview chip with reward-state=preview (Req 9.5, 16.1)', () => {
        const html = renderDefault()
        expect(html).toContain('data-role="review-reward-preview"')
        expect(html).toContain('data-reward-state="preview"')
        expect(html).toContain('chưa nhận')
    })

    it('saturates the displayed counter at 9999+ for values above the ceiling (Req 9.2)', () => {
        const html = renderDefault({ dueToday: 10_000, overdue: 99_999 })
        // The visible counter labels show the saturated form, but the
        // raw count remains in the data attribute so analytics / a11y
        // can read the true value.
        expect(html).toMatch(
            /data-review-bucket="due-today"[\s\S]*?data-review-count="10000"/,
        )
        expect(html).toMatch(
            /data-review-bucket="due-today"[\s\S]*?data-role="review-counter-value"[^>]*>9999\+<\/span>/,
        )
        expect(html).toMatch(
            /data-review-bucket="overdue"[\s\S]*?data-review-count="99999"/,
        )
        expect(html).toMatch(
            /data-review-bucket="overdue"[\s\S]*?data-role="review-counter-value"[^>]*>9999\+<\/span>/,
        )
    })

    it('passes through values within the ceiling unchanged (Req 9.2)', () => {
        const html = renderDefault({ dueToday: 0, overdue: 9_999 })
        expect(html).toMatch(
            /data-review-bucket="due-today"[\s\S]*?data-role="review-counter-value"[^>]*>0<\/span>/,
        )
        expect(html).toMatch(
            /data-review-bucket="overdue"[\s\S]*?data-role="review-counter-value"[^>]*>9999<\/span>/,
        )
    })
})

// -----------------------------------------------------------------------------
// Empty state — Req 9.4
// -----------------------------------------------------------------------------

describe('ReviewBackboneHero — empty state', () => {
    it('renders exactly one Primary_CTA with label "Học bài mới" (Req 9.4)', () => {
        const html = renderEmpty()
        expect(countMatches(html, /data-role="primary-cta"/g)).toBe(1)
        expect(html).toContain('Học bài mới')
        expect(html).not.toContain('>Ôn ngay<')
        expect(html).not.toContain('>Thử lại<')
    })

    it('declares the empty surface state on the root', () => {
        const html = renderEmpty()
        expect(html).toContain('data-surface-state="empty"')
    })

    it('does not render the "chưa nhận" reward preview chip when nothing is pending', () => {
        const html = renderEmpty()
        expect(html).not.toContain('data-role="review-reward-preview"')
        expect(html).not.toContain('chưa nhận')
    })

    it('uses mascot=cheer (per SURFACE_MASCOT_CONFIG.review.empty + emptyReachedGoal)', () => {
        const html = renderEmpty()
        // MascotRoleHost stamps the role on its root element.
        expect(html).toContain('data-mascot-role="cheer"')
        expect(html).toContain('data-mascot-surface="review"')
        expect(html).toContain('data-mascot-state="empty"')
    })

    it('keeps zero counters intact (no saturation regression)', () => {
        const html = renderEmpty()
        expect(html).toMatch(
            /data-review-bucket="due-today"[\s\S]*?data-role="review-counter-value"[^>]*>0<\/span>/,
        )
        expect(html).toMatch(
            /data-review-bucket="overdue"[\s\S]*?data-role="review-counter-value"[^>]*>0<\/span>/,
        )
    })
})

// -----------------------------------------------------------------------------
// Error state — Req 9.6
// -----------------------------------------------------------------------------

describe('Review surface — error state (StateShell)', () => {
    it('renders exactly one Primary_CTA with label "Thử lại" and NEVER "Ôn ngay" (Req 9.6)', () => {
        const html = renderError()
        expect(countMatches(html, /data-role="primary-cta"/g)).toBe(1)
        expect(html).toContain('Thử lại')
        expect(html).not.toContain('>Ôn ngay<')
    })

    it('uses mascot=guard for the error state', () => {
        const html = renderError()
        expect(html).toContain('data-mascot-role="guard"')
        expect(html).toContain('data-mascot-surface="review"')
        expect(html).toContain('data-mascot-state="error"')
    })

    it('does not expose any reward-preview subtree in the error state (Req 11.7)', () => {
        const html = renderError()
        expect(html).not.toContain('data-reward-state="preview"')
        expect(html).not.toContain('data-reward-state="earned"')
        expect(html).not.toContain('data-reward-state="receipt"')
    })
})

// -----------------------------------------------------------------------------
// Pure helper — formatReviewCount (Req 9.2)
// -----------------------------------------------------------------------------

describe('formatReviewCount — saturation contract (Req 9.2)', () => {
    it('renders integers up to the ceiling unchanged', () => {
        expect(formatReviewCount(0)).toBe('0')
        expect(formatReviewCount(1)).toBe('1')
        expect(formatReviewCount(123)).toBe('123')
        expect(formatReviewCount(REVIEW_DISPLAY_CEILING)).toBe('9999')
    })

    it('saturates anything above the ceiling to "9999+"', () => {
        expect(formatReviewCount(REVIEW_DISPLAY_CEILING + 1)).toBe('9999+')
        expect(formatReviewCount(50_000)).toBe('9999+')
        expect(formatReviewCount(Number.MAX_SAFE_INTEGER)).toBe('9999+')
    })

    it('clamps non-finite or negative values to "0"', () => {
        expect(formatReviewCount(-1)).toBe('0')
        expect(formatReviewCount(Number.NaN)).toBe('0')
        expect(formatReviewCount(Number.NEGATIVE_INFINITY)).toBe('0')
    })

    it('floors non-integer inputs', () => {
        expect(formatReviewCount(3.7)).toBe('3')
        expect(formatReviewCount(9999.9)).toBe('9999')
    })
})
