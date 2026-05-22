// Feature: visual-qa-screenshot-capture, Property 4: Reproducibility — same-commit MAPD ≤ 2.0/255
//
// Vai chinh: QA Automation Engineer
// Vai phoi hop: Frontend Engineer
//
// Spec ref: `.kiro/specs/visual-qa-screenshot-capture/design.md`
// §"Correctness Properties / Property 4" + Decision 7. The diff
// script `scripts/visual-capture-diff.ts` decodes each paired PNG,
// converts to grayscale via luma weighting, resizes to 256×256
// (bilinear), computes MAPD = `mean(|a[i] − b[i]|)`, and exits 0 iff
// every paired MAPD ≤ 2.0/255.
//
//   Clause a — for any byte-identical PNG inputs, MAPD = 0.
//   Clause b — exit code is 0 iff every MAPD ≤ 2.0/255.
//   Clause c — bilinear resize is deterministic across calls.
//   Clause d — MAPD increases monotonically with perturbation
//     magnitude (sanity / shape check on the metric).
//
// We DO NOT decode real PNGs here (that would require pngjs and a
// Playwright run). Instead we synthesise grayscale buffers directly
// — the diff script's *logic* (luma → resize → MAPD → threshold) is
// what the property test exercises.
//
// Validates: Requirements 9.1, 9.2.

import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import {
    bilinearResize,
    deriveDiffExitCode,
    mapd,
    MAPD_THRESHOLD,
} from './_helpers'

const NUM_RUNS = 100
const TARGET = 256

// ---------------------------------------------------------------------------
// Generators.
// ---------------------------------------------------------------------------

/**
 * A small grayscale buffer with explicit width × height so the test
 * can drive the bilinear resampler with reasonable input sizes. We
 * keep dimensions ≤ 64 to keep the property suite fast.
 */
const arbGrayscaleBuffer = fc
    .record({
        w: fc.integer({ min: 4, max: 64 }),
        h: fc.integer({ min: 4, max: 64 }),
    })
    .chain(({ w, h }) =>
        fc.uint8Array({ minLength: w * h, maxLength: w * h }).map((bytes) => ({
            w,
            h,
            bytes,
        })),
    )

const arbSquareBuffer = fc
    .integer({ min: 4, max: 64 })
    .chain((n) =>
        fc.uint8Array({ minLength: n * n, maxLength: n * n }).map((bytes) => ({ n, bytes })),
    )

describe('Property 4: MAPD reproducibility (visual-qa-screenshot-capture)', () => {
    // -----------------------------------------------------------------------
    // Clause a — identical buffers ⇒ MAPD = 0.
    // -----------------------------------------------------------------------

    describe('clause a — identical buffers ⇒ MAPD = 0 (Req 9.1)', () => {
        it('mapd(buf, buf) === 0 for any buffer', () => {
            fc.assert(
                fc.property(fc.uint8Array({ minLength: 0, maxLength: 4096 }), (buf) => {
                    expect(mapd(buf, buf)).toBe(0)
                }),
                { numRuns: NUM_RUNS },
            )
        })

        it('a copy of the buffer also yields MAPD = 0', () => {
            fc.assert(
                fc.property(fc.uint8Array({ minLength: 1, maxLength: 4096 }), (buf) => {
                    const copy = new Uint8Array(buf)
                    expect(mapd(buf, copy)).toBe(0)
                }),
                { numRuns: NUM_RUNS },
            )
        })
    })

    // -----------------------------------------------------------------------
    // Clause b — exit code is 0 iff every MAPD ≤ threshold.
    // -----------------------------------------------------------------------

    describe('clause b — exit code = 0 iff every MAPD ≤ 2.0/255 (Req 9.2)', () => {
        it('all-below-threshold ⇒ exit 0', () => {
            fc.assert(
                fc.property(
                    fc.array(fc.double({ min: 0, max: MAPD_THRESHOLD, noNaN: true }), {
                        minLength: 1,
                        maxLength: 30,
                    }),
                    (mapds) => {
                        expect(deriveDiffExitCode(mapds)).toBe(0)
                    },
                ),
                { numRuns: NUM_RUNS },
            )
        })

        it('a single value above threshold ⇒ exit 1', () => {
            fc.assert(
                fc.property(
                    fc.array(fc.double({ min: 0, max: MAPD_THRESHOLD, noNaN: true }), {
                        minLength: 0,
                        maxLength: 20,
                    }),
                    fc.double({
                        min: MAPD_THRESHOLD + 0.0001,
                        max: 255,
                        noNaN: true,
                    }),
                    fc.integer({ min: 0, max: 20 }),
                    (good, bad, insertAt) => {
                        const idx = Math.min(insertAt, good.length)
                        const mapds = [...good.slice(0, idx), bad, ...good.slice(idx)]
                        expect(deriveDiffExitCode(mapds)).toBe(1)
                    },
                ),
                { numRuns: NUM_RUNS },
            )
        })

        it('threshold value itself is treated as ≤ (boundary inclusive)', () => {
            expect(deriveDiffExitCode([MAPD_THRESHOLD])).toBe(0)
        })

        it('MAPD_THRESHOLD equals 2.0 (Decision 7)', () => {
            // Pin the threshold against accidental drift. Decision 7
            // declares the budget as 2.0/255. Our `mapd` returns values
            // in [0, 255], so the threshold lives in the same domain.
            expect(MAPD_THRESHOLD).toBe(2.0)
        })
    })

    // -----------------------------------------------------------------------
    // Clause c — bilinear resize is deterministic.
    // -----------------------------------------------------------------------

    describe('clause c — bilinear resize is deterministic (Decision 7)', () => {
        it('two calls with the same input yield byte-identical outputs', () => {
            fc.assert(
                fc.property(arbGrayscaleBuffer, (input) => {
                    const a = bilinearResize(input.bytes, input.w, input.h, TARGET, TARGET)
                    const b = bilinearResize(input.bytes, input.w, input.h, TARGET, TARGET)
                    expect(a.length).toBe(TARGET * TARGET)
                    expect(b.length).toBe(TARGET * TARGET)
                    expect(mapd(a, b)).toBe(0)
                }),
                { numRuns: NUM_RUNS },
            )
        })

        it('resize-then-MAPD on identical inputs yields 0', () => {
            fc.assert(
                fc.property(arbGrayscaleBuffer, (input) => {
                    const a = bilinearResize(input.bytes, input.w, input.h, TARGET, TARGET)
                    const b = bilinearResize(
                        new Uint8Array(input.bytes),
                        input.w,
                        input.h,
                        TARGET,
                        TARGET,
                    )
                    expect(mapd(a, b)).toBe(0)
                }),
                { numRuns: NUM_RUNS },
            )
        })

        it('resize is the identity when src dims equal dst dims', () => {
            fc.assert(
                fc.property(arbSquareBuffer, ({ n, bytes }) => {
                    const out = bilinearResize(bytes, n, n, n, n)
                    expect(out.length).toBe(bytes.length)
                    for (let i = 0; i < bytes.length; i += 1) {
                        expect(out[i]).toBe(bytes[i])
                    }
                }),
                { numRuns: NUM_RUNS },
            )
        })
    })

    // -----------------------------------------------------------------------
    // Clause d — MAPD shape check: monotonic in perturbation magnitude.
    //
    // For a constant grayscale buffer X and a perturbation `δ ∈ [0,
    // 255]`, MAPD(X, X + δ) (clamped) MUST equal δ. This pins the
    // metric's units (0..255) and gives a direct sanity check that
    // larger perturbations never produce smaller MAPD values.
    // -----------------------------------------------------------------------

    describe('clause d — MAPD scales linearly with constant perturbation', () => {
        it('MAPD between a constant buffer X and X + δ equals δ', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 0, max: 255 }),
                    fc.integer({ min: 0, max: 255 }),
                    fc.integer({ min: 1, max: 4096 }),
                    (base, delta, len) => {
                        const a = new Uint8Array(len).fill(base)
                        const b = new Uint8Array(len).fill(
                            Math.min(255, Math.max(0, base + delta)),
                        )
                        const expected = Math.abs((b[0] ?? 0) - (a[0] ?? 0))
                        expect(mapd(a, b)).toBe(expected)
                    },
                ),
                { numRuns: NUM_RUNS },
            )
        })

        it('two MAPDs from increasing perturbations are non-decreasing', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 0, max: 200 }),
                    fc.integer({ min: 0, max: 50 }),
                    fc.integer({ min: 0, max: 50 }),
                    fc.integer({ min: 1, max: 1024 }),
                    (base, d1, d2, len) => {
                        const small = Math.min(d1, d2)
                        const large = Math.max(d1, d2)
                        const a = new Uint8Array(len).fill(base)
                        const bSmall = new Uint8Array(len).fill(Math.min(255, base + small))
                        const bLarge = new Uint8Array(len).fill(Math.min(255, base + large))
                        expect(mapd(a, bSmall)).toBeLessThanOrEqual(mapd(a, bLarge))
                    },
                ),
                { numRuns: NUM_RUNS },
            )
        })
    })

    // -----------------------------------------------------------------------
    // Round-trip — full pipeline (resize + MAPD + exit-code derivation)
    // on identical PNGs reports a clean run.
    // -----------------------------------------------------------------------

    describe('round-trip — full diff pipeline on identical inputs reports exit 0', () => {
        it('two byte-identical PNG payloads produce exit code 0 after resize + MAPD', () => {
            fc.assert(
                fc.property(arbGrayscaleBuffer, (input) => {
                    const aResized = bilinearResize(input.bytes, input.w, input.h, TARGET, TARGET)
                    const bResized = bilinearResize(input.bytes, input.w, input.h, TARGET, TARGET)
                    const value = mapd(aResized, bResized)
                    expect(value).toBe(0)
                    expect(deriveDiffExitCode([value])).toBe(0)
                }),
                { numRuns: NUM_RUNS },
            )
        })
    })
})
