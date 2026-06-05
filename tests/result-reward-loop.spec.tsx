/**
 * Result_Reward_Loop — Property-Based Tests (task 6.4 of spec
 * `gamified-ui-asset-rollout`).
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: Gamification Designer (earned-window pacing, receipt copy)
 *
 * Property wired in this file:
 *
 *   - Property 15 (task 6.4) — Result_Reward_Loop Earned + Receipt Contract
 *     For any (earnedDurationMs, xpEarned, fucoinEarned, accuracy,
 *     timeSpentSeconds) drawn from the design's input space:
 *
 *       1. Earned-phase duration ∈ [1.2s, 2.0s] (Req 7.1, 7.2): the
 *          FSM clamps any raw `earnedDurationMs` into the spec window
 *          before the `earned` phase mounts. Reduced-motion is a
 *          separate path (clamp to 0) and is asserted in the FSM unit
 *          tests; this property locks the standard motion path.
 *
 *       2. Auto-advance (Req 7.1): the FSM transitions `earned →
 *          receipt` on `EARNED_TIMER_ELAPSED` without any user tap
 *          (no `PRIMARY_ACTION_TRIGGERED` event is required to
 *          progress).
 *
 *       3. Receipt content within ranges (Req 7.3): the rendered
 *          receipt surface includes XP ≥ 0, Fucoin ≥ 0, accuracy
 *          0..100 (rounded integer), and a time string formatted as
 *          mm:ss with mm ≤ 99.
 *
 *       4. Exactly one `data-role="primary-cta"` (Req 7.4 / Property
 *          8 / Req 11.5): the receipt phase exposes exactly one
 *          Primary_CTA selector so the single-Primary_CTA invariant
 *          holds.
 *
 *     Validates: Requirements 7.1, 7.2, 7.3, 7.4
 *
 * Test framework
 * --------------
 * Vitest + fast-check (`numRuns: 100` per task brief). The root
 * `vitest.property.config.ts` runs in `node` environment, matching
 * `tests/mascot-role.spec.tsx` and `tests/ui-primitives.spec.tsx`. We
 * therefore use `react-dom/server.renderToStaticMarkup` to obtain
 * the receipt-phase markup without needing a paint engine.
 *
 * Why we render the legacy presentational shell, not the FSM driver
 * -----------------------------------------------------------------
 * The component exposed by `result-reward-loop.tsx` ships in two
 * modes:
 *   - "legacy presentational" (no `fsm` prop): renders the receipt
 *     UI directly — this is what the `earned → receipt` auto-advance
 *     transitions to.
 *   - "FSM-driven" (`fsm={...}`): mounts a `'saving'` shell and runs
 *     the save effect on the client. SSR captures the saving shell
 *     only, because `useEffect` does not run during
 *     `renderToStaticMarkup`.
 *
 * The receipt-content + single-Primary_CTA assertions therefore
 * target the legacy renderer, which is the *canonical* receipt-phase
 * UI inside the FSM wrapper (see `ResultRewardLoopFSM` in the
 * production source: it composes `<ResultRewardLoopLegacy>` once
 * `phase === 'receipt'`). The earned-window + auto-advance
 * assertions cover the FSM transitions purely at the reducer layer
 * — that layer is the source of truth for the [1.2s, 2.0s] clamp
 * and the no-user-tap auto-advance contract.
 */

import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import { renderToStaticMarkup } from 'react-dom/server'
import { NextIntlClientProvider } from 'next-intl'
import viMessages from '../apps/web/messages/vi.json'

import {
    ResultRewardLoop,
    type ResultRewardLoopAction,
} from '@/components/gamification/result-reward-loop'
import type { RewardPreviewItem } from '@/components/gamification/quest-visuals'
import {
    EARNED_DURATION_MAX_MS,
    EARNED_DURATION_MIN_MS,
    clampEarnedDurationMs,
    initResultRewardLoopState,
    resultRewardLoopReducer,
    type ResultRewardLoopState,
} from '@/components/gamification/result-reward-loop-fsm'

const NUM_RUNS = 100 as const

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Format `totalSeconds` as the receipt's `mm:ss` string. The receipt
 * surface enforces `mm ≤ 99` and `ss ∈ [0, 59]` per Requirement 7.3.
 * The helper is colocated with the test so generators can mirror the
 * exact string the production code is expected to render.
 */
function formatMmSs(totalSeconds: number): string {
    const clamped = Math.max(0, Math.min(99 * 60 + 59, Math.floor(totalSeconds)))
    const mm = Math.floor(clamped / 60)
    const ss = clamped % 60
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
    return `${pad(mm)}:${pad(ss)}`
}

/**
 * Count the number of regex matches in `html` using the global flag.
 * Used to assert "exactly one Primary_CTA per receipt".
 */
function countMatches(html: string, pattern: RegExp): number {
    if (!pattern.global) {
        throw new Error('countMatches requires a global regex')
    }
    return (html.match(pattern) ?? []).length
}

/**
 * Strip non-data attributes so generator-controlled labels do not
 * accidentally carry a literal "primary-cta" substring into the
 * Primary_CTA assertion.
 *
 * The single-Primary_CTA selector contract is `data-role="primary-cta"`
 * (design §I.5, Req 11.5, Property 8). We therefore count the
 * appearance of that exact attribute, which is unambiguous.
 */
const PRIMARY_CTA_ATTR_RE = /data-role="primary-cta"/g

// ---------------------------------------------------------------------------
// Generators (constrained to the input space mandated by Req 7.3)
// ---------------------------------------------------------------------------

/**
 * Earned-phase duration in milliseconds. Generator covers a wider
 * band than the spec window so the clamp is exercised on both sides;
 * Req 7.1/7.2 require the resulting clamped value to land in
 * [1200, 2000].
 */
const earnedDurationArb: fc.Arbitrary<number> = fc.integer({ min: 0, max: 5000 })

/** XP ≥ 0 (Req 7.3). Bound by a realistic ceiling that fits the receipt UI. */
const xpEarnedArb: fc.Arbitrary<number> = fc.integer({ min: 0, max: 9_999 })

/** Fucoin ≥ 0 (Req 7.3). Same realistic ceiling as XP. */
const fucoinEarnedArb: fc.Arbitrary<number> = fc.integer({ min: 0, max: 9_999 })

/** Accuracy ∈ [0, 100] rounded to integer (Req 7.3). */
const accuracyArb: fc.Arbitrary<number> = fc.integer({ min: 0, max: 100 })

/**
 * Time-spent in seconds, capped at 99:59 = 5_999 seconds (Req 7.3
 * `mm ≤ 99`). The generator allows 0 so the boundary is exercised.
 */
const timeSpentSecondsArb: fc.Arbitrary<number> = fc.integer({ min: 0, max: 99 * 60 + 59 })

/**
 * Skill enum the loop accepts. Matches the production
 * `ResultRewardLoopSkill` union without coupling to its private type
 * export.
 */
const skillArb: fc.Arbitrary<
    'vocabulary' | 'listening' | 'reading' | 'writing' | 'speaking' | 'exam'
> = fc.constantFrom('vocabulary', 'listening', 'reading', 'writing', 'speaking', 'exam')

// ---------------------------------------------------------------------------
// Receipt rendering helper
// ---------------------------------------------------------------------------

interface ReceiptRenderInput {
    skill: 'vocabulary' | 'listening' | 'reading' | 'writing' | 'speaking' | 'exam'
    xpEarned: number
    fucoinEarned: number
    accuracy: number
    timeSpentSeconds: number
}

/**
 * Render the Result_Reward_Loop in receipt mode (legacy
 * presentational shell — the canonical `phase === 'receipt'` markup
 * the FSM wrapper composes after auto-advance).
 *
 * Why legacy mode: see the file-level comment. The FSM driver mounts
 * a `'saving'` shell during SSR; we want the post-auto-advance
 * receipt markup, which the legacy shell renders directly.
 */
function renderReceipt(input: ReceiptRenderInput): string {
    const rewardPreview: RewardPreviewItem[] = [
        { type: 'xp', label: `+${input.xpEarned} XP`, detail: 'Kinh nghiệm' },
        { type: 'fucoin', label: `+${input.fucoinEarned} Fucoin`, detail: 'Ví Fuxie' },
    ]

    const timeStr = formatMmSs(input.timeSpentSeconds)

    const primaryAction: ResultRewardLoopAction = {
        // Production wires this from `chooseCompletionPrimaryCtaLabel`
        // — the label content does not affect the property.
        label: 'Tiếp tục',
        onClick: () => undefined,
    }
    const secondaryAction: ResultRewardLoopAction = {
        label: 'Luyện lại',
        onClick: () => undefined,
    }

    return renderToStaticMarkup(
        <NextIntlClientProvider locale="vi" messages={viMessages}>
        <ResultRewardLoop
            skill={input.skill}
            title="Hoàn thành"
            message="Đã lưu kết quả buổi học."
            scoreLabel={`${Math.round(input.accuracy)}%`}
            scoreDetail={`Thời gian ${timeStr}`}
            accuracy={input.accuracy}
            xpEarned={input.xpEarned}
            graded
            attemptMeta={[
                { label: 'Fucoin earned', value: `+${input.fucoinEarned} Fucoin` },
                { label: 'Time spent', value: timeStr, detail: 'mm:ss' },
            ]}
            rewardPreview={rewardPreview}
            primaryAction={primaryAction}
            secondaryAction={secondaryAction}
        />
        </NextIntlClientProvider>,
    )
}

// ===========================================================================
// Property 15 — Result_Reward_Loop Earned + Receipt Contract
// ===========================================================================

describe('Property 15: Result_Reward_Loop Earned + Receipt Contract (task 6.4)', () => {
    // -------------------------------------------------------------------
    // Sub-property 15.a — Earned phase duration ∈ [1.2s, 2.0s] (Req 7.1, 7.2)
    // -------------------------------------------------------------------

    it('earned-phase duration is clamped into [1200ms, 2000ms] before scheduling auto-advance', () => {
        fc.assert(
            fc.property(earnedDurationArb, (rawMs) => {
                // Standard motion path — reducedMotion = false (the
                // reduced-motion clamp-to-0 path is locked in
                // `result-reward-loop-fsm.test.ts`).
                const state = initResultRewardLoopState({
                    earnedDurationMs: rawMs,
                    reducedMotion: false,
                })
                expect(state.earnedDurationMs).toBeGreaterThanOrEqual(EARNED_DURATION_MIN_MS)
                expect(state.earnedDurationMs).toBeLessThanOrEqual(EARNED_DURATION_MAX_MS)

                // Sanity: the helper used by the hook returns the
                // same clamped value (single source of truth).
                expect(clampEarnedDurationMs(rawMs, false)).toBe(state.earnedDurationMs)
            }),
            { numRuns: NUM_RUNS },
        )
    })

    // -------------------------------------------------------------------
    // Sub-property 15.b — Auto-advance from earned → receipt (Req 7.1)
    // -------------------------------------------------------------------

    it('FSM auto-advances from `earned` to `receipt` via the timer alone (no user tap)', () => {
        fc.assert(
            fc.property(earnedDurationArb, (rawMs) => {
                let state: ResultRewardLoopState = initResultRewardLoopState({
                    earnedDurationMs: rawMs,
                    reducedMotion: false,
                })
                expect(state.phase).toBe('saving')

                // Save resolves → earned (no user input).
                state = resultRewardLoopReducer(state, { type: 'SAVE_SUCCEEDED' })
                expect(state.phase).toBe('earned')

                // The auto-advance trigger is the timer event ONLY.
                // No `PRIMARY_ACTION_TRIGGERED` is dispatched here:
                // Req 7.1 mandates "tự động chuyển sang giai đoạn
                // `receipt` mà không yêu cầu learner tap".
                state = resultRewardLoopReducer(state, { type: 'EARNED_TIMER_ELAPSED' })
                expect(state.phase).toBe('receipt')
            }),
            { numRuns: NUM_RUNS },
        )
    })

    // -------------------------------------------------------------------
    // Sub-property 15.c — Receipt content within ranges (Req 7.3)
    //                  +  Sub-property 15.d — Exactly 1 Primary_CTA (Req 7.4)
    // -------------------------------------------------------------------

    it('receipt renders XP≥0, Fucoin≥0, accuracy 0..100, mm:ss with mm≤99, and exactly one data-role="primary-cta"', () => {
        fc.assert(
            fc.property(
                skillArb,
                xpEarnedArb,
                fucoinEarnedArb,
                accuracyArb,
                timeSpentSecondsArb,
                (skill, xpEarned, fucoinEarned, accuracy, timeSpentSeconds) => {
                    // ---- Generator-side sanity (Req 7.3 input ranges) ----
                    expect(xpEarned).toBeGreaterThanOrEqual(0)
                    expect(fucoinEarned).toBeGreaterThanOrEqual(0)
                    expect(accuracy).toBeGreaterThanOrEqual(0)
                    expect(accuracy).toBeLessThanOrEqual(100)
                    const timeStr = formatMmSs(timeSpentSeconds)
                    expect(timeStr).toMatch(/^\d{2}:\d{2}$/)
                    const [mmStr, ssStr] = timeStr.split(':')
                    const mm = Number(mmStr)
                    const ss = Number(ssStr)
                    expect(mm).toBeGreaterThanOrEqual(0)
                    expect(mm).toBeLessThanOrEqual(99)
                    expect(ss).toBeGreaterThanOrEqual(0)
                    expect(ss).toBeLessThanOrEqual(59)

                    // ---- Render the receipt phase ----
                    const html = renderReceipt({
                        skill,
                        xpEarned,
                        fucoinEarned,
                        accuracy,
                        timeSpentSeconds,
                    })

                    // 15.c.1 — XP earned (≥ 0) appears in the receipt.
                    // The legacy shell renders `+{xpEarned} XP` in the
                    // attempt-meta + reward-preview rows.
                    expect(html).toContain(`+${xpEarned} XP`)

                    // 15.c.2 — Fucoin earned (≥ 0) appears in the
                    // receipt. The reward preview emits `+N Fucoin`.
                    expect(html).toContain(`+${fucoinEarned} Fucoin`)

                    // 15.c.3 — Accuracy 0..100 (rounded integer)
                    // appears in the score circle / percentage
                    // headline.
                    const roundedAccuracy = Math.round(accuracy)
                    expect(html).toContain(`${roundedAccuracy}%`)

                    // 15.c.4 — Time mm:ss with mm ≤ 99 appears in the
                    // attempt-meta detail row.
                    expect(html).toContain(timeStr)

                    // 15.d — Exactly one `data-role="primary-cta"` on
                    // the receipt surface (Property 8 / Req 11.5 /
                    // Req 7.4). Disabled / secondary CTAs MUST NOT
                    // emit the attribute (PrimaryCta primitive
                    // contract — see `apps/web/src/components/ui/primary-cta.tsx`).
                    const primaryCtaCount = countMatches(html, PRIMARY_CTA_ATTR_RE)
                    expect(
                        primaryCtaCount,
                        `expected exactly 1 data-role="primary-cta" on the receipt surface, got ${primaryCtaCount}`,
                    ).toBe(1)
                },
            ),
            { numRuns: NUM_RUNS },
        )
    })
})
