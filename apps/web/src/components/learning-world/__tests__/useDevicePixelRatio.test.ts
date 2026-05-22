// Feature: fuxie-learning-world-lab-v0, Property 16: Backing-store sizing
//
// Vai chinh: QA Automation Engineer
// Vai phoi hop: Frontend Engineer
//
// Spec ref: `.kiro/specs/fuxie-learning-world-lab-v0/requirements.md`
// Requirement 9.1: "THE Learning_World_Canvas SHALL size its backing store
// using `min(window.devicePixelRatio, 3.0)` so that rendered images appear
// non-blurry on high-DPI displays without unbounded memory growth."
//
// This file exercises the pure helper `computeBackingStoreSize` from
// `../useDevicePixelRatio`. The helper is intentionally DOM-free, so
// these tests run in the Vitest `node` environment and never import
// `react-dom`, `jsdom`, `window`, `document`, or any other browser API.
//
// Helper contract (see `apps/web/src/components/learning-world/useDevicePixelRatio.ts`):
//
//     toFiniteOrOne(x)             = Number.isFinite(x) && x > 0 ? x : 1
//     safeDpr                      = min(toFiniteOrOne(dpr), 3)
//     safeCssW                     = toFiniteOrOne(cssWidth)
//     safeCssH                     = toFiniteOrOne(cssHeight)
//     computeBackingStoreSize(...) = {
//         width:  max(1, floor(safeCssW * safeDpr)),
//         height: max(1, floor(safeCssH * safeDpr)),
//     }
//
// Test plan (mirrors task 10.4):
//
//   - Property 16.1 — model match: for random `cssWidth`, `cssHeight` in
//     `[1, 4096]` and random `dpr` covering `[0, 10]`, `NaN`, `±Infinity`,
//     `undefined`, negatives, and non-numeric values, the helper output
//     equals an independent JavaScript-side reference model. ≥100
//     fast-check iterations.
//
//   - Property 16.2 — output well-formedness: for the same generator
//     space, the returned `width` / `height` are always integers ≥ 1.
//     ≥100 fast-check iterations.
//
//   - Property 16.3 — explicit examples: `dpr` ∈ {1, 2, 3, 4 (capped),
//     `NaN`, `undefined`, 0, -1, +Infinity}, plus degenerate
//     `cssWidth`/`cssHeight` (`0`, `NaN`, `undefined`).
//
// Validates: Requirements 9.1

import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import { computeBackingStoreSize } from '../useDevicePixelRatio'

const NUM_RUNS = 100

// ---------------------------------------------------------------------------
// Reference model
// ---------------------------------------------------------------------------

/**
 * Mirrors the `toFiniteOrOne` helper colocated with `computeBackingStoreSize`.
 * Defined inline here so this test asserts against the spec text in the
 * task description rather than importing the implementation under test.
 */
function modelToFiniteOrOne(x: unknown): number {
    return typeof x === 'number' && Number.isFinite(x) && x > 0 ? x : 1
}

/**
 * Independent JS-side model of `computeBackingStoreSize` (see
 * Requirement 9.1 spec text in the task description).
 */
function modelBackingStoreSize(
    cssWidth: number,
    cssHeight: number,
    dpr: number,
): { width: number; height: number } {
    const safeDpr = Math.min(modelToFiniteOrOne(dpr), 3)
    const safeCssW = modelToFiniteOrOne(cssWidth)
    const safeCssH = modelToFiniteOrOne(cssHeight)
    return {
        width: Math.max(1, Math.floor(safeCssW * safeDpr)),
        height: Math.max(1, Math.floor(safeCssH * safeDpr)),
    }
}

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/**
 * Typical CSS dimensions: integers in `[1, 4096]`. The lab canvas is
 * mounted inside a Next.js page that may go up to roughly the 4K
 * viewport range; we generate the full integer span there so the
 * backing-store math is exercised at the upper end too.
 */
const arbCssDim = fc.integer({ min: 1, max: 4096 })

/**
 * "DPR-typical" finite numbers in `[0, 10]`. Includes 0 (treated as 1
 * by `toFiniteOrOne`), the canonical 1 / 2 / 3 displays, and the cap-
 * exceeding value 4..10 (treated as the cap of 3).
 */
const arbDprTypical = fc.double({
    min: 0,
    max: 10,
    noNaN: true,
    noDefaultInfinity: true,
})

/**
 * "DPR-degenerate" values: every shape `toFiniteOrOne` is documented to
 * fall back to `1` for, plus a couple of non-numeric shapes a misbehaved
 * caller might pass in. The implementation under test types `dpr` as
 * `number`, but the contract still has to defend against `NaN`,
 * `±Infinity`, negatives, and `undefined` (per the task description).
 */
const arbDprDegenerate: fc.Arbitrary<unknown> = fc.oneof(
    fc.constant(Number.NaN),
    fc.constant(Number.POSITIVE_INFINITY),
    fc.constant(Number.NEGATIVE_INFINITY),
    fc.constant(undefined),
    fc.constant(null),
    fc.double({ min: -10, max: 0, noNaN: true, noDefaultInfinity: true }),
    fc.constant('1.5'),
    fc.constant({}),
)

const arbDprAny: fc.Arbitrary<unknown> = fc.oneof(arbDprTypical, arbDprDegenerate)

/**
 * "CSS-degenerate" values for `cssWidth` / `cssHeight` to exercise the
 * defensive `toFiniteOrOne` wrap on the dimension inputs. Same fallback
 * shapes as for DPR (Requirement 9.5 motivates the defensive wrap).
 */
const arbCssDegenerate: fc.Arbitrary<unknown> = fc.oneof(
    fc.constant(Number.NaN),
    fc.constant(Number.POSITIVE_INFINITY),
    fc.constant(Number.NEGATIVE_INFINITY),
    fc.constant(undefined),
    fc.constant(null),
    fc.double({ min: -1000, max: 0, noNaN: true, noDefaultInfinity: true }),
    fc.constant('512'),
    fc.constant({}),
)

const arbCssAny: fc.Arbitrary<unknown> = fc.oneof(arbCssDim, arbCssDegenerate)

// ---------------------------------------------------------------------------
// Property 16.1 — Output matches the JS-side reference model (Req 9.1)
// ---------------------------------------------------------------------------

describe('Property 16.1 — computeBackingStoreSize matches the spec model (Req 9.1)', () => {
    it('matches the model on random typical and degenerate inputs', () => {
        fc.assert(
            fc.property(arbCssAny, arbCssAny, arbDprAny, (cssW, cssH, dpr) => {
                const actual = computeBackingStoreSize(
                    cssW as number,
                    cssH as number,
                    dpr as number,
                )
                const expected = modelBackingStoreSize(
                    cssW as number,
                    cssH as number,
                    dpr as number,
                )
                expect(actual).toEqual(expected)
            }),
            { numRuns: NUM_RUNS },
        )
    })
})

// ---------------------------------------------------------------------------
// Property 16.2 — Output is always an integer ≥ 1 (Req 9.1)
// ---------------------------------------------------------------------------

describe('Property 16.2 — output is always an integer ≥ 1 (Req 9.1)', () => {
    it('width and height are integers >= 1 for every input combination', () => {
        fc.assert(
            fc.property(arbCssAny, arbCssAny, arbDprAny, (cssW, cssH, dpr) => {
                const { width, height } = computeBackingStoreSize(
                    cssW as number,
                    cssH as number,
                    dpr as number,
                )

                expect(Number.isInteger(width)).toBe(true)
                expect(Number.isInteger(height)).toBe(true)
                expect(width).toBeGreaterThanOrEqual(1)
                expect(height).toBeGreaterThanOrEqual(1)
            }),
            { numRuns: NUM_RUNS },
        )
    })
})

// ---------------------------------------------------------------------------
// Property 16.3 — DPR cap at 3 across the typical-DPR range (Req 9.1)
// ---------------------------------------------------------------------------

describe('Property 16.3 — DPR is capped at 3 across the typical range (Req 9.1)', () => {
    it('upper-bounds width/height by floor(cssDim * 3) for any finite positive dpr', () => {
        fc.assert(
            fc.property(arbCssDim, arbCssDim, arbDprTypical, (cssW, cssH, dpr) => {
                const { width, height } = computeBackingStoreSize(cssW, cssH, dpr)

                // Capping at dpr=3 means the backing store cannot grow past
                // floor(cssDim * 3), regardless of how high `dpr` runs.
                expect(width).toBeLessThanOrEqual(Math.floor(cssW * 3))
                expect(height).toBeLessThanOrEqual(Math.floor(cssH * 3))
            }),
            { numRuns: NUM_RUNS },
        )
    })
})

// ---------------------------------------------------------------------------
// Explicit examples for documented DPR / CSS-dim shapes (Req 9.1)
// ---------------------------------------------------------------------------

interface DprCase {
    readonly label: string
    readonly dpr: unknown
    readonly expectedMultiplier: number
}

/**
 * Documented DPR shapes the spec calls out. The "expected multiplier" is
 * the value `safeDpr = min(toFiniteOrOne(dpr), 3)` collapses to. For
 * `dpr = 4`, the cap kicks in and the multiplier becomes 3; for any
 * non-finite, non-positive, or non-numeric `dpr`, the multiplier
 * collapses to 1 via `toFiniteOrOne`.
 */
const DPR_CASES: ReadonlyArray<DprCase> = [
    { label: 'dpr = 1 (standard display)', dpr: 1, expectedMultiplier: 1 },
    { label: 'dpr = 2 (Retina)', dpr: 2, expectedMultiplier: 2 },
    { label: 'dpr = 3 (cap, exact)', dpr: 3, expectedMultiplier: 3 },
    { label: 'dpr = 4 (cap kicks in)', dpr: 4, expectedMultiplier: 3 },
    { label: 'dpr = 1.5 (fractional)', dpr: 1.5, expectedMultiplier: 1.5 },
    { label: 'dpr = NaN -> 1', dpr: Number.NaN, expectedMultiplier: 1 },
    { label: 'dpr = undefined -> 1', dpr: undefined, expectedMultiplier: 1 },
    { label: 'dpr = 0 -> 1', dpr: 0, expectedMultiplier: 1 },
    { label: 'dpr = -1 -> 1', dpr: -1, expectedMultiplier: 1 },
    { label: 'dpr = +Infinity -> 1', dpr: Number.POSITIVE_INFINITY, expectedMultiplier: 1 },
    { label: 'dpr = -Infinity -> 1', dpr: Number.NEGATIVE_INFINITY, expectedMultiplier: 1 },
]

describe('Property 16.4 — explicit DPR shapes produce documented multipliers (Req 9.1)', () => {
    it.each(DPR_CASES)('$label on a 100x200 canvas', ({ dpr, expectedMultiplier }) => {
        const cssWidth = 100
        const cssHeight = 200
        const { width, height } = computeBackingStoreSize(
            cssWidth,
            cssHeight,
            dpr as number,
        )
        expect(width).toBe(Math.max(1, Math.floor(cssWidth * expectedMultiplier)))
        expect(height).toBe(Math.max(1, Math.floor(cssHeight * expectedMultiplier)))
    })
})

interface CssDegenerateCase {
    readonly label: string
    readonly cssWidth: unknown
    readonly cssHeight: unknown
}

/**
 * Documented CSS-dimension degeneracies. `toFiniteOrOne` collapses each
 * one to `1`, so the resulting backing store is always at least 1 px on
 * the affected axis (a 0-sized backing store silently fails to
 * rasterize on some browsers — see the source-file comment).
 */
const CSS_DEGENERATE_CASES: ReadonlyArray<CssDegenerateCase> = [
    { label: 'cssWidth = 0 -> floor coerced to 1', cssWidth: 0, cssHeight: 200 },
    { label: 'cssWidth = NaN -> 1', cssWidth: Number.NaN, cssHeight: 200 },
    { label: 'cssWidth = undefined -> 1', cssWidth: undefined, cssHeight: 200 },
    { label: 'cssWidth = -50 -> 1', cssWidth: -50, cssHeight: 200 },
    { label: 'cssWidth = +Infinity -> 1', cssWidth: Number.POSITIVE_INFINITY, cssHeight: 200 },
    { label: 'cssHeight = 0 -> floor coerced to 1', cssWidth: 100, cssHeight: 0 },
    { label: 'cssHeight = NaN -> 1', cssWidth: 100, cssHeight: Number.NaN },
    { label: 'cssHeight = undefined -> 1', cssWidth: 100, cssHeight: undefined },
    { label: 'both axes degenerate', cssWidth: Number.NaN, cssHeight: undefined },
]

describe('Property 16.5 — degenerate CSS dims collapse to >=1 px on the affected axis (Req 9.1)', () => {
    it.each(CSS_DEGENERATE_CASES)('$label at dpr=2', ({ cssWidth, cssHeight }) => {
        const { width, height } = computeBackingStoreSize(
            cssWidth as number,
            cssHeight as number,
            2,
        )
        expect(width).toBe(
            Math.max(1, Math.floor(modelToFiniteOrOne(cssWidth) * 2)),
        )
        expect(height).toBe(
            Math.max(1, Math.floor(modelToFiniteOrOne(cssHeight) * 2)),
        )
        // And every output is still a positive integer.
        expect(Number.isInteger(width)).toBe(true)
        expect(Number.isInteger(height)).toBe(true)
        expect(width).toBeGreaterThanOrEqual(1)
        expect(height).toBeGreaterThanOrEqual(1)
    })
})
