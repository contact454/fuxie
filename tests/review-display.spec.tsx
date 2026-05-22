/**
 * review-display.spec.tsx — Property test for the Review surface display
 * contract.
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: QA Automation Engineer, Gamification Designer
 *
 * Spec source-of-truth:
 *   - Task 14.2 (gamified-ui-asset-rollout) — "Property 17: Review
 *     Display Number Saturation".
 *   - design.md §I.7 (Review surface)
 *   - requirements.md Req 9.2, Req 9.3
 *
 * Property 17 — Review Display Number Saturation
 * -----------------------------------------------
 * For any due/overdue input N ∈ [-1000, 50000] the Review hero MUST:
 *
 *   1. (Req 9.2 — pure helper) Saturate the displayed value via
 *      `formatReviewCount(N)`:
 *         - "0"      when N ≤ 0
 *         - String(N) when 0 < N ≤ 9999
 *         - "9999+"   when N > 9999
 *
 *   2. (Req 9.2 — render-level) Stamp the same saturated string into
 *      the rendered DOM under both counter cells
 *      (`data-review-bucket="due-today"` and `data-review-bucket="overdue"`).
 *
 *   3. (Req 9.3) Render the due-today counter in the Bright Sky blue
 *      action token (`text-[var(--fuxie-action)]`) and the overdue
 *      counter in deep blue (`text-[var(--fuxie-blue-900)]`); never
 *      use a red/rose token (`text-red-*`, `text-rose-*`) anywhere in
 *      the hero.
 *
 * The test runs at the repository root because the registry-coupled
 * specs in `tests/` already render production components against the
 * `@/...` alias defined by `vitest.property.config.ts`. The renderer
 * is `react-dom/server.renderToStaticMarkup` — same pattern as
 * `tests/mascot-role.spec.tsx` and the apps/web component-level test
 * for this same hero (`review-backbone-hero.test.tsx`).
 *
 * Validates: Requirements 9.2, 9.3
 */

import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import { renderToStaticMarkup } from 'react-dom/server'

import {
    REVIEW_DISPLAY_CEILING,
    ReviewBackboneHero,
    formatReviewCount,
} from '@/components/review/review-backbone-hero'

const NUM_RUNS = 100 as const

// -----------------------------------------------------------------------------
// Generators
// -----------------------------------------------------------------------------

/**
 * Bucket count input space per the task brief: integers in
 * [-1000, 50000]. The lower bound exercises the negative/clamp branch
 * (Req 9.2 boundary), the upper bound exercises the saturation branch
 * (Req 9.2 ceiling = 9999).
 */
const reviewCountArb: fc.Arbitrary<number> = fc.integer({
    min: -1000,
    max: 50_000,
})

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * Reference saturation contract from the task brief verbatim:
 *
 *   display(N) = "0"        when N ≤ 0
 *              = String(N)  when 0 < N ≤ 9999
 *              = "9999+"    when N > 9999
 *
 * Mirrors `formatReviewCount`. Kept independent so the property
 * actually checks the contract instead of asserting `f(N) === f(N)`.
 */
function expectedReviewDisplay(n: number): string {
    if (!Number.isFinite(n) || n <= 0) return '0'
    if (n > REVIEW_DISPLAY_CEILING) return `${REVIEW_DISPLAY_CEILING}+`
    return String(Math.floor(n))
}

/**
 * Render the Review hero in its `default` state with the given
 * (dueToday, overdue) pair. Default state is the only state whose hero
 * exposes both numeric counters (empty state collapses to zero on both
 * by construction — Req 9.4).
 */
function renderHero(dueToday: number, overdue: number): string {
    return renderToStaticMarkup(
        <ReviewBackboneHero
            state="default"
            dueToday={dueToday}
            overdue={overdue}
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

/**
 * Extract the rendered counter cell for a given bucket. Returns the
 * inner HTML of the `<span data-role="review-counter-value">` so the
 * test can assert both the displayed text and the surrounding color
 * token on the same span.
 */
function extractCounterCell(
    html: string,
    bucket: 'due-today' | 'overdue',
): { fragment: string; valueText: string } | null {
    const re = new RegExp(
        `data-review-bucket="${bucket}"[\\s\\S]*?<span[^>]*data-role="review-counter-value"[^>]*>([\\s\\S]*?)<\\/span>`,
    )
    const match = html.match(re)
    if (!match) return null
    return { fragment: match[0], valueText: match[1] }
}

// Forbidden red/rose Tailwind text tokens — Req 9.3 explicitly bans
// using a red alarming color for either bucket.
const RED_TOKEN_RE = /text-(?:red|rose)-\d+/

// -----------------------------------------------------------------------------
// Property 17 — pure helper
// -----------------------------------------------------------------------------

describe('Property 17: Review Display Number Saturation — formatReviewCount (Req 9.2)', () => {
    it('matches the saturation contract for every N ∈ [-1000, 50000]', () => {
        fc.assert(
            fc.property(reviewCountArb, (n) => {
                const expected = expectedReviewDisplay(n)
                expect(formatReviewCount(n)).toBe(expected)
            }),
            { numRuns: NUM_RUNS },
        )
    })

    it('returns "0" for every non-positive N', () => {
        fc.assert(
            fc.property(fc.integer({ min: -1000, max: 0 }), (n) => {
                expect(formatReviewCount(n)).toBe('0')
            }),
            { numRuns: NUM_RUNS },
        )
    })

    it('returns String(N) for every N ∈ [1, 9999]', () => {
        fc.assert(
            fc.property(fc.integer({ min: 1, max: REVIEW_DISPLAY_CEILING }), (n) => {
                expect(formatReviewCount(n)).toBe(String(n))
            }),
            { numRuns: NUM_RUNS },
        )
    })

    it('returns "9999+" for every N > 9999', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: REVIEW_DISPLAY_CEILING + 1, max: 50_000 }),
                (n) => {
                    expect(formatReviewCount(n)).toBe('9999+')
                },
            ),
            { numRuns: NUM_RUNS },
        )
    })
})

// -----------------------------------------------------------------------------
// Property 17 — render-level (DOM stamps the same saturated string)
// -----------------------------------------------------------------------------

describe('Property 17: Review Display Number Saturation — rendered DOM (Req 9.2)', () => {
    it('the due-today counter cell renders the saturated display(N) for any (dueToday, overdue)', () => {
        fc.assert(
            fc.property(
                reviewCountArb,
                reviewCountArb,
                (dueToday, overdue) => {
                    const html = renderHero(dueToday, overdue)
                    const cell = extractCounterCell(html, 'due-today')

                    expect(cell, 'due-today counter cell must render').not.toBeNull()
                    expect(cell!.valueText).toBe(expectedReviewDisplay(dueToday))
                },
            ),
            { numRuns: NUM_RUNS },
        )
    })

    it('the overdue counter cell renders the saturated display(N) for any (dueToday, overdue)', () => {
        fc.assert(
            fc.property(
                reviewCountArb,
                reviewCountArb,
                (dueToday, overdue) => {
                    const html = renderHero(dueToday, overdue)
                    const cell = extractCounterCell(html, 'overdue')

                    expect(cell, 'overdue counter cell must render').not.toBeNull()
                    expect(cell!.valueText).toBe(expectedReviewDisplay(overdue))
                },
            ),
            { numRuns: NUM_RUNS },
        )
    })

    it('the literal "9999+" appears in both cells exactly when N > 9999', () => {
        fc.assert(
            fc.property(
                reviewCountArb,
                reviewCountArb,
                (dueToday, overdue) => {
                    const html = renderHero(dueToday, overdue)

                    const dueCell = extractCounterCell(html, 'due-today')!
                    const overdueCell = extractCounterCell(html, 'overdue')!

                    const dueSaturated = dueToday > REVIEW_DISPLAY_CEILING
                    const overdueSaturated = overdue > REVIEW_DISPLAY_CEILING

                    expect(dueCell.valueText === '9999+').toBe(dueSaturated)
                    expect(overdueCell.valueText === '9999+').toBe(
                        overdueSaturated,
                    )
                },
            ),
            { numRuns: NUM_RUNS },
        )
    })
})

// -----------------------------------------------------------------------------
// Property 17 — color discipline (Req 9.3)
// -----------------------------------------------------------------------------

describe('Property 17: Review Display Number Saturation — color discipline (Req 9.3)', () => {
    it('due ∈ Bright Sky blue (var(--fuxie-action)), overdue ∈ deep blue (var(--fuxie-blue-900))', () => {
        fc.assert(
            fc.property(
                reviewCountArb,
                reviewCountArb,
                (dueToday, overdue) => {
                    const html = renderHero(dueToday, overdue)
                    const dueCell = extractCounterCell(html, 'due-today')!
                    const overdueCell = extractCounterCell(html, 'overdue')!

                    // Due-today MUST use the Bright Sky action token, NOT
                    // the deep-blue overdue token.
                    expect(dueCell.fragment).toContain(
                        'text-[var(--fuxie-action)]',
                    )
                    expect(dueCell.fragment).not.toContain(
                        'text-[var(--fuxie-blue-900)]',
                    )

                    // Overdue MUST use the deep blue token, NOT the
                    // action token.
                    expect(overdueCell.fragment).toContain(
                        'text-[var(--fuxie-blue-900)]',
                    )
                    expect(overdueCell.fragment).not.toContain(
                        'text-[var(--fuxie-action)]',
                    )
                },
            ),
            { numRuns: NUM_RUNS },
        )
    })

    it('never renders a red/rose text token anywhere in the hero', () => {
        fc.assert(
            fc.property(
                reviewCountArb,
                reviewCountArb,
                (dueToday, overdue) => {
                    const html = renderHero(dueToday, overdue)
                    expect(html).not.toMatch(RED_TOKEN_RE)
                    // Belt-and-braces: the literal word "red" / "rose"
                    // must not appear in the rendered fragment for the
                    // counter cells.
                    expect(
                        extractCounterCell(html, 'due-today')!.fragment,
                    ).not.toMatch(RED_TOKEN_RE)
                    expect(
                        extractCounterCell(html, 'overdue')!.fragment,
                    ).not.toMatch(RED_TOKEN_RE)
                },
            ),
            { numRuns: NUM_RUNS },
        )
    })
})
