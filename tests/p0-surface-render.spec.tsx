/**
 * P0 surface render — Property-Based Tests for the Primary_CTA invariants
 * across every P0 learner surface (task 17.1 of spec
 * `gamified-ui-asset-rollout`).
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: QA Automation Engineer
 *
 * Properties wired in this file:
 *
 *   - Property 7 — First-viewport Primary_CTA on every P0 surface.
 *     For each P0 surface that owns a first-viewport backbone hero, the
 *     rendered markup contains exactly one node with
 *     `data-role="primary-cta"`. The bounding box `[0, 0, 390, 844]` and
 *     the ≥44×44 (≥48×48 for review) tap-target floor is verified
 *     through the design-system class tokens emitted by `PrimaryCta`
 *     (`min-h-[44px] min-w-[44px]` for `variant="primary"`,
 *     `min-h-[48px] min-w-[48px]` for `variant="review"`). JSDOM does
 *     not paint pixels — Playwright (task 18.1) owns the painted-pixel
 *     verification — so this property pins the structural facts:
 *       • exactly one Primary_CTA renders in the hero subtree (the only
 *         way the CTA could escape the first viewport is via a positive
 *         offset / scroll-only positioning, neither of which any P0 hero
 *         emits — they all compose `PrimaryCta` directly inside the
 *         hero's last layout slot);
 *       • the Primary_CTA carries the documented Tailwind tap-target
 *         tokens for its variant.
 *
 *   - Property 8 — Single Primary_CTA per non-default state.
 *     For each P0 surface × non-default state ∈ {locked, empty, error}
 *     rendered through `<StateShell>`, the markup contains exactly one
 *     `data-role="primary-cta"`. The error variant additionally renders
 *     a "Về Dashboard" secondary action — `PrimaryCta` strips the
 *     `data-role` attribute on `variant="secondary"` so the invariant
 *     stays exactly one (Req 11.5).
 *
 * Test framework: Vitest + fast-check (numRuns: 100 per task brief).
 * Rendering: `react-dom/server.renderToStaticMarkup` — same convention
 * the rest of this PBT suite uses (`tests/skill-motivation-layer.spec.tsx`,
 * `tests/result-reward-loop.spec.tsx`). The root `vitest.property.config.ts`
 * runs in `node` environment with the `@/` alias wired to `apps/web/src`.
 *
 * Validates: Requirements 3.1, 5.3, 9.1, 11.3, 11.4, 11.5, 14.1, 19.3,
 *            19.8, 19.9, 19.10
 */

import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactElement } from 'react'

import { DashboardBackboneHero } from '@/components/dashboard/dashboard-backbone-hero'
import { ReviewBackboneHero } from '@/components/review/review-backbone-hero'
import { ExamInProgressChrome } from '@/components/exam/ExamInProgressChrome'
import { VocabularyPracticeHero } from '@/components/vocabulary/vocabulary-practice-hero'
import { VocabularyMicrogamesHero } from '@/components/vocabulary/vocabulary-microgames-hero'
import {
    StateShell,
    type StateShellState,
} from '@/components/gamification/state-shell'
import {
    P0_SURFACE_IDS,
    SURFACE_MASCOT_CONFIG,
    type SurfaceId,
} from '@/lib/mascot/mascot-role'

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const NUM_RUNS = 100 as const

/**
 * Tap-target floor (Req 14.1, 15.2). The standard Primary_CTA emits
 * `min-h-[44px] min-w-[44px]` via `variantClasses.primary` in
 * `apps/web/src/components/ui/primary-cta.tsx`.
 */
const PRIMARY_TAP_TARGET_TOKENS = ['min-h-[44px]', 'min-w-[44px]'] as const

/**
 * Review's tap-target floor (Req 9.1). `variant="review"` emits
 * `min-h-[48px] min-w-[48px]`.
 */
const REVIEW_TAP_TARGET_TOKENS = ['min-h-[48px]', 'min-w-[48px]'] as const

/**
 * Bright Sky action background — required on every Primary_CTA across
 * variants `primary` and `review` (Req 16.4 / Property 22 — partial
 * coverage; full coverage in task 17.2).
 */
const BRIGHT_SKY_ACTION_TOKEN = 'bg-[var(--fuxie-action)]'

// -----------------------------------------------------------------------------
// Static helpers
// -----------------------------------------------------------------------------

function countMatches(html: string, pattern: RegExp): number {
    const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`
    return (html.match(new RegExp(pattern.source, flags)) ?? []).length
}

/**
 * Count occurrences of `data-role="primary-cta"` in the rendered markup.
 * Property 7 / Property 8 both gate on this being exactly one.
 */
function countPrimaryCtas(html: string): number {
    return countMatches(html, /data-role="primary-cta"/)
}

/**
 * Extract the `class` attribute string of every node carrying
 * `data-role="primary-cta"`. Used to assert tap-target tokens
 * structurally (Property 7).
 */
function extractPrimaryCtaClassAttrs(html: string): string[] {
    const classes: string[] = []
    // `class` may appear before or after `data-role` on the cloned anchor —
    // capture the surrounding tag's class attribute regardless of order.
    const tagPattern = /<[a-zA-Z][^>]*\sdata-role="primary-cta"[^>]*>/g
    const tags = html.match(tagPattern) ?? []
    for (const tag of tags) {
        const classMatch = tag.match(/\sclass="([^"]*)"/)
        if (classMatch) {
            classes.push(classMatch[1])
        }
    }
    return classes
}

/**
 * Assert that the rendered Primary_CTA carries the documented design-token
 * class set for its variant. Tap-target floor and Bright Sky background
 * are both expressed as Tailwind class tokens that `PrimaryCta` always
 * emits, so the structural class-token check is a deterministic proxy
 * for the "≥44×44 / ≥48×48 inside [0,0,390,844]" Property 7 contract.
 */
function assertPrimaryCtaTapTargetTokens(
    html: string,
    expectedTapTargetTokens: ReadonlyArray<string>,
    label: string,
): void {
    const classAttrs = extractPrimaryCtaClassAttrs(html)
    expect(
        classAttrs.length,
        `[${label}] expected at least one Primary_CTA class attribute`,
    ).toBeGreaterThan(0)
    for (const cls of classAttrs) {
        for (const token of expectedTapTargetTokens) {
            expect(
                cls,
                `[${label}] Primary_CTA missing tap-target token "${token}". Class string: ${cls}`,
            ).toContain(token)
        }
        expect(
            cls,
            `[${label}] Primary_CTA missing Bright Sky action token "${BRIGHT_SKY_ACTION_TOKEN}". Class string: ${cls}`,
        ).toContain(BRIGHT_SKY_ACTION_TOKEN)
    }
}

// -----------------------------------------------------------------------------
// Surface fixtures — Property 7 (default first-viewport Primary_CTA)
// -----------------------------------------------------------------------------

interface DefaultSurfaceCase {
    label: string
    surfaceId: SurfaceId
    /**
     * Tap-target tokens the Primary_CTA must emit. Review uses ≥48×48 dp
     * (Req 9.1); every other P0 default hero uses the ≥44×44 floor
     * (Req 14.1, 15.2).
     */
    tapTargetTokens: ReadonlyArray<string>
    /**
     * Render function — must produce a deterministic ReactElement so
     * fast-check can re-render under the same sample without flaking.
     */
    render: () => ReactElement
}

/**
 * Per-surface default-state fixtures. Every component listed here owns
 * the first-viewport backbone block of its surface and renders exactly
 * one Primary_CTA via the design-system `PrimaryCta` primitive.
 *
 * Surfaces NOT listed here render their default state through page
 * compositions that are exercised by the per-surface unit tests
 * (Course path nodes, skill players' SkillMotivationLayer, Shop
 * ShopBackboneClient). Property 7 still applies to those surfaces; the
 * coverage is owned by their dedicated property tests so this file does
 * not need to set up server fixtures for them.
 */
const DEFAULT_SURFACE_CASES: ReadonlyArray<DefaultSurfaceCase> = [
    {
        label: 'dashboard / default',
        surfaceId: 'dashboard',
        tapTargetTokens: PRIMARY_TAP_TARGET_TOKENS,
        render: () => (
            <DashboardBackboneHero
                state="default"
                greeting="Chào An, hôm nay học A1.2.3"
                streakChipLabel="7 ngày streak"
                streakCount={7}
                xpLabel="30/50 XP hôm nay"
                questEyebrow="Quest hôm nay"
                questTitle="Hoàn thành Reading 1"
                questMessage="Còn 2 hoạt động — bạn đang trên đà."
                ctaLabel="Tiếp tục học"
                ctaHref="/course"
            />
        ),
    },
    {
        label: 'dashboard / empty',
        surfaceId: 'dashboard',
        tapTargetTokens: PRIMARY_TAP_TARGET_TOKENS,
        render: () => (
            <DashboardBackboneHero
                state="empty"
                greeting="Chào bạn mới"
                streakChipLabel="0 ngày"
                streakCount={0}
                xpLabel="0/50 XP"
                questEyebrow=""
                questTitle=""
                questMessage=""
                ctaLabel="Tạo lộ trình"
                ctaHref="/onboarding"
            />
        ),
    },
    {
        label: 'review / default',
        surfaceId: 'review',
        tapTargetTokens: REVIEW_TAP_TARGET_TOKENS,
        render: () => (
            <ReviewBackboneHero
                state="default"
                dueToday={12}
                overdue={3}
                dueLabel="Hôm nay đến hạn"
                overdueLabel="Quá hạn"
                ctaLabel="Ôn ngay"
                ctaHref="#review-session"
                title="Sẵn sàng ôn 15 thẻ"
                message="Bạn còn 12 thẻ hôm nay và 3 thẻ quá hạn."
            />
        ),
    },
    {
        label: 'review / empty',
        surfaceId: 'review',
        tapTargetTokens: REVIEW_TAP_TARGET_TOKENS,
        render: () => (
            <ReviewBackboneHero
                state="empty"
                dueToday={0}
                overdue={0}
                dueLabel="Hôm nay đến hạn"
                overdueLabel="Quá hạn"
                ctaLabel="Học bài mới"
                ctaHref="/course"
                title="Bạn đã ôn xong hôm nay"
                message="Quay lại sau 24 giờ để giữ trí nhớ tươi mới."
            />
        ),
    },
    {
        label: 'vocabulary-practice / default',
        surfaceId: 'vocabulary-practice',
        tapTargetTokens: PRIMARY_TAP_TARGET_TOKENS,
        render: () => (
            <VocabularyPracticeHero
                eyebrow="Luyện từ vựng • A1"
                title="Sẵn sàng luyện 12 thẻ"
                message="Bạn còn 12 thẻ hôm nay. Bắt đầu để giữ streak."
                ctaLabel="Bắt đầu"
                ctaHref="/vocabulary/practice/session"
            />
        ),
    },
    {
        label: 'vocabulary-microgames / default',
        surfaceId: 'vocabulary-microgames',
        tapTargetTokens: PRIMARY_TAP_TARGET_TOKENS,
        render: () => (
            <VocabularyMicrogamesHero
                eyebrow="Trò chơi từ vựng • A1"
                title="Săn Fucoin với 5 trò chơi"
                message="Mỗi trò chơi tặng phần thưởng nhỏ."
                ctaLabel="Bắt đầu"
                ctaHref="/vocabulary/microgames/session"
            />
        ),
    },
    {
        label: 'exam / default (in-progress)',
        surfaceId: 'exam',
        tapTargetTokens: PRIMARY_TAP_TARGET_TOKENS,
        render: () => (
            <ExamInProgressChrome
                remainingSeconds={23 * 60 + 45}
                done={3}
                total={25}
                onSubmit={() => {}}
            >
                <p data-role="exam-content-stub">Q1</p>
            </ExamInProgressChrome>
        ),
    },
]

// -----------------------------------------------------------------------------
// Surface fixtures — Property 8 (single Primary_CTA per non-default state)
// -----------------------------------------------------------------------------

/**
 * Subset of P0 surfaces that compose `<StateShell>` for non-default
 * states. The `result-reward` surface is an ephemeral overlay
 * (Req 7.6 owns its error path inline through `ResultRewardLoop`,
 * not `StateShell`) and is therefore excluded from the StateShell
 * fuzz — its single-Primary_CTA invariant is already covered by
 * Property 15 (task 6.4).
 */
const STATE_SHELL_SURFACE_IDS: ReadonlyArray<SurfaceId> = P0_SURFACE_IDS.filter(
    (id): id is SurfaceId => id !== 'result-reward',
)

/**
 * Closed set of non-default states StateShell renders (Req 11.1, 11.2).
 */
const NON_DEFAULT_STATES: ReadonlyArray<StateShellState> = [
    'empty',
    'locked',
    'error',
] as const

/**
 * Localized message arbitrary capped at the StateShell ≤140-char limit
 * (Req 11.3 / 11.4). Keeps fast-check from triggering the dev-mode
 * length guard while still exercising a wide input space.
 */
const messageArb: fc.Arbitrary<string> = fc
    .string({ minLength: 1, maxLength: 140 })
    // Strip control characters that break the renderer's whitespace
    // pre-formatting; visible content is what the contract cares about.
    .map((s) => s.replace(/[\u0000-\u001F\u007F]/g, ' ').slice(0, 140))
    .filter((s) => s.trim().length > 0)

/**
 * Localized CTA label generator. Excludes empty/whitespace-only strings
 * so the rendered Primary_CTA still carries visible text — the
 * `data-role="primary-cta"` attribute is set by the primitive regardless
 * of label content.
 */
const ctaLabelArb: fc.Arbitrary<string> = fc
    .string({ minLength: 1, maxLength: 32 })
    .map((s) => s.replace(/[\u0000-\u001F\u007F]/g, ' ').trim())
    .filter((s) => s.length > 0)

const stateShellSurfaceArb: fc.Arbitrary<SurfaceId> = fc.constantFrom(
    ...STATE_SHELL_SURFACE_IDS,
)

const stateShellStateArb: fc.Arbitrary<StateShellState> = fc.constantFrom(
    ...NON_DEFAULT_STATES,
)

// -----------------------------------------------------------------------------
// Property 7 — First-viewport Primary_CTA on every P0 surface
// -----------------------------------------------------------------------------

describe('Property 7: First-viewport Primary_CTA on every P0 surface (task 17.1)', () => {
    /**
     * Sanity guard so the per-case fuzzer never silently degrades into a
     * no-op suite if the fixture array drifts.
     */
    it('covers every P0 first-viewport hero component', () => {
        expect(DEFAULT_SURFACE_CASES.length).toBeGreaterThan(0)
        // The 5 components named in the task brief MUST be exercised.
        const labels = DEFAULT_SURFACE_CASES.map((c) => c.label)
        expect(labels).toEqual(
            expect.arrayContaining([
                expect.stringContaining('dashboard'),
                expect.stringContaining('review'),
                expect.stringContaining('vocabulary-practice'),
                expect.stringContaining('vocabulary-microgames'),
                expect.stringContaining('exam'),
            ]),
        )
    })

    for (const surfaceCase of DEFAULT_SURFACE_CASES) {
        describe(surfaceCase.label, () => {
            // The render function is deterministic, so fast-check fuzzes
            // a "rerender index" that the test re-renders against — this
            // gives `numRuns: 100` re-evaluations of the static-render
            // contract, matching the convention in
            // `tests/asset-registry.spec.ts`.
            it('renders exactly one data-role="primary-cta" (Property 7 / 8 / Req 19.3)', () => {
                fc.assert(
                    fc.property(fc.integer({ min: 0, max: 999 }), (_n) => {
                        const html = renderToStaticMarkup(surfaceCase.render())
                        const ctaCount = countPrimaryCtas(html)
                        if (ctaCount !== 1) {
                            throw new Error(
                                `[${surfaceCase.label}] expected exactly 1 Primary_CTA, found ${ctaCount}.`,
                            )
                        }
                        return true
                    }),
                    { numRuns: NUM_RUNS },
                )
            })

            it('Primary_CTA carries the design-system tap-target tokens (Req 14.1 / 9.1 / 15.2)', () => {
                fc.assert(
                    fc.property(fc.integer({ min: 0, max: 999 }), (_n) => {
                        const html = renderToStaticMarkup(surfaceCase.render())
                        assertPrimaryCtaTapTargetTokens(
                            html,
                            surfaceCase.tapTargetTokens,
                            surfaceCase.label,
                        )
                        return true
                    }),
                    { numRuns: NUM_RUNS },
                )
            })
        })
    }
})

// -----------------------------------------------------------------------------
// Property 8 — Single Primary_CTA per non-default state
// -----------------------------------------------------------------------------

describe('Property 8: Single Primary_CTA per non-default state (task 17.1)', () => {
    /**
     * Sanity guard: the StateShell surface set must cover every P0
     * surface bar `result-reward` (whose error path is owned by
     * `ResultRewardLoop` directly, not StateShell — Req 7.6).
     */
    it('covers every P0 surface that composes StateShell', () => {
        const expected = new Set<SurfaceId>(
            P0_SURFACE_IDS.filter((id) => id !== 'result-reward'),
        )
        const actual = new Set<SurfaceId>(STATE_SHELL_SURFACE_IDS)
        expect(actual).toEqual(expected)
        // SURFACE_MASCOT_CONFIG must declare every surface we render —
        // a missing entry would crash the resolver (`Cannot read
        // properties of undefined (reading 'states')`).
        for (const id of STATE_SHELL_SURFACE_IDS) {
            expect(SURFACE_MASCOT_CONFIG).toHaveProperty(id)
        }
    })

    it('renders exactly one Primary_CTA across (surface × {empty, locked, error}) — Req 11.3 / 11.4 / 11.5', () => {
        fc.assert(
            fc.property(
                stateShellSurfaceArb,
                stateShellStateArb,
                messageArb,
                ctaLabelArb,
                (surfaceId, state, message, ctaLabel) => {
                    const html = renderToStaticMarkup(
                        <StateShell
                            surfaceId={surfaceId}
                            state={state}
                            message={message}
                            primaryCta={{
                                label: ctaLabel,
                                onClick: () => {},
                            }}
                        />,
                    )

                    const ctaCount = countPrimaryCtas(html)
                    if (ctaCount !== 1) {
                        throw new Error(
                            `[StateShell ${surfaceId} / ${state}] expected exactly 1 Primary_CTA, found ${ctaCount}. Message="${message}", label="${ctaLabel}".`,
                        )
                    }

                    // Property 7 mirror: the StateShell Primary_CTA emits
                    // the standard ≥44×44 tap-target tokens (Req 11.3,
                    // 11.4, 14.1, 15.2). StateShell never escalates to
                    // the review variant — Review's locked/empty/error
                    // shells delegate to `<StateShell>` with the
                    // standard primary CTA per task 16.1.
                    assertPrimaryCtaTapTargetTokens(
                        html,
                        PRIMARY_TAP_TARGET_TOKENS,
                        `StateShell ${surfaceId} / ${state}`,
                    )
                    return true
                },
            ),
            { numRuns: NUM_RUNS },
        )
    })

    it('error state with default secondary "Về Dashboard" still renders exactly one Primary_CTA (Req 11.5)', () => {
        // The error variant of StateShell injects a secondary action
        // ("Về Dashboard"). PrimaryCta strips `data-role="primary-cta"`
        // when `variant="secondary"`, so the single-Primary_CTA invariant
        // must hold even though TWO PrimaryCta components are rendered.
        fc.assert(
            fc.property(
                stateShellSurfaceArb,
                messageArb,
                ctaLabelArb,
                (surfaceId, message, ctaLabel) => {
                    const html = renderToStaticMarkup(
                        <StateShell
                            surfaceId={surfaceId}
                            state="error"
                            message={message}
                            primaryCta={{
                                label: ctaLabel,
                                onClick: () => {},
                            }}
                        />,
                    )

                    // Exactly one primary-cta despite the secondary
                    // "Về Dashboard" anchor also being rendered.
                    const ctaCount = countPrimaryCtas(html)
                    if (ctaCount !== 1) {
                        throw new Error(
                            `[StateShell ${surfaceId} / error] expected exactly 1 Primary_CTA, found ${ctaCount}. Message="${message}", label="${ctaLabel}".`,
                        )
                    }

                    // The secondary action must be present (Req 11.5):
                    // PrimaryCta with `variant="secondary"` emits
                    // `data-cta-variant="secondary"`. Exactly one such
                    // node is expected on the error shell.
                    const secondaryCount = countMatches(
                        html,
                        /data-cta-variant="secondary"/,
                    )
                    expect(
                        secondaryCount,
                        `[StateShell ${surfaceId} / error] expected exactly 1 secondary action, found ${secondaryCount}.`,
                    ).toBe(1)
                    return true
                },
            ),
            { numRuns: NUM_RUNS },
        )
    })
})
