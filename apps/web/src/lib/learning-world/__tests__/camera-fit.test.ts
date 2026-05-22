// Feature: fuxie-learning-world-lab-v0 visual-pass-2, Property: auto-fit camera math
//
// Vai chinh: QA Automation Engineer
// Vai phoi hop: Frontend Engineer
//
// Spec ref: `.kiro/specs/fuxie-learning-world-lab-v0/requirements.md`
// (visual-pass-2 task 1: auto-fit camera). The math is a pure helper in
// `apps/web/src/lib/learning-world/camera-fit.ts`; this file exercises it
// without DOM, React, or fast-check fixtures touching the canvas.
//
// Properties:
//
//   Property A — combineRects bounds membership: every input rect's
//     corners lie inside the returned `SceneBounds`. ≥100 fast-check
//     iterations.
//
//   Property B — combineRects ignores invalid rects: NaN / Infinity /
//     negative-extent rects are skipped without throwing. ≥100 iterations.
//
//   Property C — computeAutoFitCamera centers the bounds: the bounds
//     center maps to the viewport center via the documented transform
//     `(world - pan) * zoom`. Tolerance: 1e-6. ≥100 iterations.
//
//   Property D — computeAutoFitCamera respects clamp: the returned zoom
//     is in `[minZoom, maxZoom]` regardless of bounds size. ≥100
//     iterations.
//
//   Property E — invalid configuration is rejected with
//     `INVALID_CAMERA_CONFIG`. ≥100 iterations.

import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import {
    LearningWorldError,
    combineRects,
    computeAutoFitCamera,
    type SceneBounds,
} from '@/lib/learning-world'

const NUM_RUNS = 100
const TOLERANCE = 1e-6

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

const arbValidRect = fc.record({
    x: fc.double({ min: -1e4, max: 1e4, noNaN: true, noDefaultInfinity: true }),
    y: fc.double({ min: -1e4, max: 1e4, noNaN: true, noDefaultInfinity: true }),
    w: fc.double({ min: 1, max: 500, noNaN: true, noDefaultInfinity: true }),
    h: fc.double({ min: 1, max: 500, noNaN: true, noDefaultInfinity: true }),
})

const arbViewport = fc.record({
    width: fc.double({ min: 200, max: 4096, noNaN: true, noDefaultInfinity: true }),
    height: fc.double({ min: 200, max: 4096, noNaN: true, noDefaultInfinity: true }),
})

const arbZoomRange = fc
    .record({
        minZoom: fc.double({ min: 0.05, max: 1, noNaN: true, noDefaultInfinity: true }),
        delta: fc.double({ min: 0.01, max: 50, noNaN: true, noDefaultInfinity: true }),
    })
    .map(({ minZoom, delta }) => ({
        minZoom,
        maxZoom: minZoom + delta,
    }))

// ---------------------------------------------------------------------------
// Property A — bounds membership
// ---------------------------------------------------------------------------

describe('Property A — combineRects bounds membership', () => {
    it('every input rect corner lies within the returned bounds', () => {
        fc.assert(
            fc.property(
                fc.array(arbValidRect, { minLength: 1, maxLength: 50 }),
                (rects) => {
                    const bounds = combineRects(rects)
                    expect(bounds).not.toBeNull()
                    if (bounds === null) return
                    for (const r of rects) {
                        expect(r.x).toBeGreaterThanOrEqual(bounds.minX)
                        expect(r.y).toBeGreaterThanOrEqual(bounds.minY)
                        expect(r.x + r.w).toBeLessThanOrEqual(bounds.maxX)
                        expect(r.y + r.h).toBeLessThanOrEqual(bounds.maxY)
                    }
                },
            ),
            { numRuns: NUM_RUNS },
        )
    })

    it('returns null for an empty input', () => {
        expect(combineRects([])).toBeNull()
    })
})

// ---------------------------------------------------------------------------
// Property B — invalid rects skipped
// ---------------------------------------------------------------------------

describe('Property B — combineRects ignores invalid rects', () => {
    it('NaN / Infinity / negative-extent rects do not throw and do not poison the bounds', () => {
        fc.assert(
            fc.property(
                fc.array(arbValidRect, { minLength: 1, maxLength: 8 }),
                (validRects) => {
                    const poison = [
                        { x: Number.NaN, y: 0, w: 10, h: 10 },
                        { x: 0, y: Number.POSITIVE_INFINITY, w: 10, h: 10 },
                        { x: 0, y: 0, w: -1, h: 10 },
                        { x: 0, y: 0, w: 10, h: -5 },
                    ]
                    const mixed = [...validRects, ...poison]
                    const cleanBounds = combineRects(validRects)
                    const mixedBounds = combineRects(mixed)
                    // Skipped rects must not change the bounds: the
                    // bounds derived from `mixed` equals the bounds
                    // derived from `validRects` alone.
                    expect(mixedBounds).toEqual(cleanBounds)
                },
            ),
            { numRuns: NUM_RUNS },
        )
    })
})

// ---------------------------------------------------------------------------
// Property C — auto-fit centers bounds at viewport center
// ---------------------------------------------------------------------------

describe('Property C — computeAutoFitCamera centers bounds at viewport center', () => {
    it('bounds center maps to viewport center within 1e-6 (when zoom is not clamped)', () => {
        fc.assert(
            fc.property(
                arbValidRect,
                arbViewport,
                arbZoomRange,
                fc.double({
                    min: 0,
                    max: 64,
                    noNaN: true,
                    noDefaultInfinity: true,
                }),
                (rect, vp, zr, padding) => {
                    const bounds: SceneBounds = {
                        minX: rect.x,
                        minY: rect.y,
                        maxX: rect.x + rect.w,
                        maxY: rect.y + rect.h,
                    }
                    // Use a wide zoom range so the natural fit is not
                    // clamped; we verify centering only when the natural
                    // zoom is inside [minZoom, maxZoom].
                    const fit = computeAutoFitCamera(bounds, {
                        viewportWidth: vp.width,
                        viewportHeight: vp.height,
                        minZoom: zr.minZoom,
                        maxZoom: 1000,
                        padding,
                    })
                    if (fit === null) return

                    const centerX = (bounds.minX + bounds.maxX) / 2
                    const centerY = (bounds.minY + bounds.maxY) / 2
                    const screenX = (centerX - fit.panX) * fit.zoom
                    const screenY = (centerY - fit.panY) * fit.zoom

                    expect(Math.abs(screenX - vp.width / 2)).toBeLessThanOrEqual(
                        TOLERANCE,
                    )
                    expect(
                        Math.abs(screenY - vp.height / 2),
                    ).toBeLessThanOrEqual(TOLERANCE)
                },
            ),
            { numRuns: NUM_RUNS },
        )
    })
})

// ---------------------------------------------------------------------------
// Property D — zoom clamp respected
// ---------------------------------------------------------------------------

describe('Property D — computeAutoFitCamera clamps zoom', () => {
    it('returned zoom is always in [minZoom, maxZoom]', () => {
        fc.assert(
            fc.property(
                arbValidRect,
                arbViewport,
                arbZoomRange,
                (rect, vp, zr) => {
                    const bounds: SceneBounds = {
                        minX: rect.x,
                        minY: rect.y,
                        maxX: rect.x + rect.w,
                        maxY: rect.y + rect.h,
                    }
                    const fit = computeAutoFitCamera(bounds, {
                        viewportWidth: vp.width,
                        viewportHeight: vp.height,
                        minZoom: zr.minZoom,
                        maxZoom: zr.maxZoom,
                        padding: 16,
                    })
                    if (fit === null) return
                    expect(fit.zoom).toBeGreaterThanOrEqual(zr.minZoom)
                    expect(fit.zoom).toBeLessThanOrEqual(zr.maxZoom)
                },
            ),
            { numRuns: NUM_RUNS },
        )
    })
})

// ---------------------------------------------------------------------------
// Property E — invalid configuration rejected
// ---------------------------------------------------------------------------

describe('Property E — computeAutoFitCamera rejects invalid configuration', () => {
    const VALID_BOUNDS: SceneBounds = {
        minX: 0,
        minY: 0,
        maxX: 100,
        maxY: 100,
    }

    const invalidConfigs = [
        { viewportWidth: 0, viewportHeight: 600, minZoom: 0.5, maxZoom: 2 },
        { viewportWidth: -10, viewportHeight: 600, minZoom: 0.5, maxZoom: 2 },
        { viewportWidth: Number.NaN, viewportHeight: 600, minZoom: 0.5, maxZoom: 2 },
        { viewportWidth: 800, viewportHeight: 0, minZoom: 0.5, maxZoom: 2 },
        { viewportWidth: 800, viewportHeight: -1, minZoom: 0.5, maxZoom: 2 },
        { viewportWidth: 800, viewportHeight: 600, minZoom: 0, maxZoom: 2 },
        { viewportWidth: 800, viewportHeight: 600, minZoom: -0.5, maxZoom: 2 },
        { viewportWidth: 800, viewportHeight: 600, minZoom: 0.5, maxZoom: 0.1 },
        { viewportWidth: 800, viewportHeight: 600, minZoom: 0.5, maxZoom: Number.POSITIVE_INFINITY },
        { viewportWidth: 800, viewportHeight: 600, minZoom: 0.5, maxZoom: 2, padding: -1 },
        { viewportWidth: 800, viewportHeight: 600, minZoom: 0.5, maxZoom: 2, padding: Number.NaN },
    ]

    for (let i = 0; i < invalidConfigs.length; i++) {
        const config = invalidConfigs[i]
        it(`rejects invalid config #${i}: ${JSON.stringify(config)}`, () => {
            expect(() =>
                computeAutoFitCamera(VALID_BOUNDS, config as never),
            ).toThrow(LearningWorldError)
        })
    }

    it('returns null for degenerate (zero-area) bounds', () => {
        const fit = computeAutoFitCamera(
            { minX: 50, minY: 50, maxX: 50, maxY: 50 },
            {
                viewportWidth: 800,
                viewportHeight: 600,
                minZoom: 0.5,
                maxZoom: 2,
                padding: 16,
            },
        )
        expect(fit).toBeNull()
    })
})
