import { describe, expect, it } from 'vitest'
import fc from 'fast-check'

import { LearningWorldError } from '../errors'
import { type CameraConfig, WorldCamera } from '../world-camera'

/**
 * Property tests for `WorldCamera`.
 *
 * Property 2: World_Camera transform invertibility
 *   Validates: Requirements 11.1, 11.2
 *
 * Property 3: World_Camera setZoom is clamp-then-identity
 *   Validates: Requirements 11.3, 11.5, 11.6, 11.7
 *
 * Property 4: World_Camera rejects invalid construction
 *   Validates: Requirements 11.4
 *
 * Property 5: World_Camera invalid setZoom leaves state unchanged
 *   Validates: Requirements 11.8
 *
 * Each property runs at least 100 iterations via `fc.assert(..., { numRuns: 100 })`.
 */

const NUM_RUNS = 100
const COORD_LIMIT = 1e6
const PAN_LIMIT = 1e5
const ROUND_TRIP_TOLERANCE = 1e-6

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/**
 * Produces a `CameraConfig` whose bounds are valid:
 *   - `minZoom` in (0, 10]
 *   - `maxZoom` in [minZoom, 100]
 *   - `initialZoom` is finite and inside [minZoom, maxZoom]
 *   - `initialPanX`, `initialPanY` finite, in [-1e5, 1e5]
 */
const validConfigArb = fc
    .record({
        minZoom: fc.double({
            min: 0.01,
            max: 10,
            noNaN: true,
            noDefaultInfinity: true,
        }),
        maxDelta: fc.double({
            min: 0,
            max: 90,
            noNaN: true,
            noDefaultInfinity: true,
        }),
        initialZoomFraction: fc.double({
            min: 0,
            max: 1,
            noNaN: true,
            noDefaultInfinity: true,
        }),
        initialPanX: fc.double({
            min: -PAN_LIMIT,
            max: PAN_LIMIT,
            noNaN: true,
            noDefaultInfinity: true,
        }),
        initialPanY: fc.double({
            min: -PAN_LIMIT,
            max: PAN_LIMIT,
            noNaN: true,
            noDefaultInfinity: true,
        }),
    })
    .filter(
        ({ minZoom }) =>
            Number.isFinite(minZoom) && minZoom > 0 && minZoom <= 10,
    )
    .map(
        ({
            minZoom,
            maxDelta,
            initialZoomFraction,
            initialPanX,
            initialPanY,
        }): CameraConfig => {
            const maxZoom = Math.min(100, minZoom + maxDelta)
            const initialZoom = minZoom + initialZoomFraction * (maxZoom - minZoom)
            return {
                minZoom,
                maxZoom,
                initialZoom,
                initialPanX,
                initialPanY,
            }
        },
    )

/** Finite numeric in `[-COORD_LIMIT, COORD_LIMIT]` for screenToWorld inputs. */
const finiteCoordArb = fc.double({
    min: -COORD_LIMIT,
    max: COORD_LIMIT,
    noNaN: true,
    noDefaultInfinity: true,
})

/**
 * Safety margin (1 ULP-ish) shrink applied to derived coord bounds so that FP
 * rounding in the forward transform cannot push the intermediate coordinate
 * just outside the camera's documented `[-1e6, 1e6]` input domain.
 */
const ROUND_TRIP_SAFETY = 1 - 1e-9

/** Fraction in `[-1, 1]` used to scale a derived coord into a safe sub-range. */
const unitFractionArb = fc.double({
    min: -1,
    max: 1,
    noNaN: true,
    noDefaultInfinity: true,
})

/**
 * Round-trip-safe input for `worldToScreen(screenToWorld(sx, sy))`.
 *
 * Yields `(config, sx, sy)` where the intermediate world point produced by
 * `screenToWorld` is guaranteed to lie within `[-1e6, 1e6]`, the documented
 * input domain of `worldToScreen`. Bound: `|sx| ≤ (COORD_LIMIT - |panX|) * zoom`.
 */
const screenRoundTripArb = fc
    .tuple(validConfigArb, unitFractionArb, unitFractionArb)
    .map(([config, fx, fy]) => {
        const zoom = config.initialZoom ?? config.minZoom
        const panX = config.initialPanX ?? 0
        const panY = config.initialPanY ?? 0
        // Two constraints on sx:
        //   1) |sx| <= COORD_LIMIT          (input domain of screenToWorld)
        //   2) |sx/zoom + panX| <= COORD_LIMIT, i.e.
        //      |sx| <= (COORD_LIMIT - |panX|) * zoom
        //                                    (so the intermediate world point
        //                                    stays in worldToScreen's input
        //                                    domain)
        const sxBound = Math.min(
            COORD_LIMIT,
            Math.max(0, (COORD_LIMIT - Math.abs(panX)) * zoom),
        ) * ROUND_TRIP_SAFETY
        const syBound = Math.min(
            COORD_LIMIT,
            Math.max(0, (COORD_LIMIT - Math.abs(panY)) * zoom),
        ) * ROUND_TRIP_SAFETY
        return { config, sx: fx * sxBound, sy: fy * syBound }
    })

/**
 * Round-trip-safe input for `screenToWorld(worldToScreen(wx, wy))`.
 *
 * Yields `(config, wx, wy)` where the intermediate screen point produced by
 * `worldToScreen` is guaranteed to lie within `[-1e6, 1e6]`, the documented
 * input domain of `screenToWorld`. Bound: `|wx - panX| ≤ COORD_LIMIT / zoom`,
 * combined with the input-domain bound `|wx| ≤ COORD_LIMIT`.
 */
const worldRoundTripArb = fc
    .tuple(validConfigArb, unitFractionArb, unitFractionArb)
    .map(([config, fx, fy]) => {
        const zoom = config.initialZoom ?? config.minZoom
        const panX = config.initialPanX ?? 0
        const panY = config.initialPanY ?? 0
        const halfWidthX = (COORD_LIMIT / zoom) * ROUND_TRIP_SAFETY
        const halfWidthY = (COORD_LIMIT / zoom) * ROUND_TRIP_SAFETY
        const minWx = Math.max(-COORD_LIMIT, panX - halfWidthX)
        const maxWx = Math.min(COORD_LIMIT, panX + halfWidthX)
        const minWy = Math.max(-COORD_LIMIT, panY - halfWidthY)
        const maxWy = Math.min(COORD_LIMIT, panY + halfWidthY)
        const centerX = (minWx + maxWx) / 2
        const centerY = (minWy + maxWy) / 2
        const halfX = (maxWx - minWx) / 2
        const halfY = (maxWy - minWy) / 2
        return {
            config,
            wx: centerX + fx * halfX,
            wy: centerY + fy * halfY,
        }
    })

/** Any finite double — used as generic numeric input for setZoom. */
const finiteNumberArb = fc.double({
    noNaN: true,
    noDefaultInfinity: true,
})

/** Non-finite numbers for invalid setZoom input. */
const nonFiniteNumberArb = fc.constantFrom(
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
)

/**
 * Invalid `setZoom` inputs covering every variant called out by Requirement 11.8:
 * NaN, ±Infinity, null, undefined, non-numeric (string, object, array, boolean).
 */
const invalidZoomInputArb = fc.oneof(
    nonFiniteNumberArb,
    fc.constant(null),
    fc.constant(undefined),
    fc.string(),
    fc.boolean(),
    fc.array(fc.integer(), { maxLength: 4 }),
    fc.record({ value: fc.integer() }),
)

// ---------------------------------------------------------------------------
// Property 2: World_Camera transform invertibility
// ---------------------------------------------------------------------------

describe('Property 2: World_Camera transform invertibility', () => {
    it('worldToScreen(screenToWorld(sx, sy)) ≈ (sx, sy) within 1e-6', () => {
        fc.assert(
            fc.property(screenRoundTripArb, ({ config, sx, sy }) => {
                const camera = new WorldCamera(config)
                const world = camera.screenToWorld(sx, sy)
                expect(Number.isFinite(world.wx)).toBe(true)
                expect(Number.isFinite(world.wy)).toBe(true)

                const screen = camera.worldToScreen(world.wx, world.wy)
                expect(Math.abs(screen.x - sx)).toBeLessThanOrEqual(
                    ROUND_TRIP_TOLERANCE,
                )
                expect(Math.abs(screen.y - sy)).toBeLessThanOrEqual(
                    ROUND_TRIP_TOLERANCE,
                )
            }),
            { numRuns: NUM_RUNS },
        )
    })

    it('screenToWorld(worldToScreen(wx, wy)) ≈ (wx, wy) within 1e-6', () => {
        fc.assert(
            fc.property(worldRoundTripArb, ({ config, wx, wy }) => {
                const camera = new WorldCamera(config)
                const screen = camera.worldToScreen(wx, wy)
                expect(Number.isFinite(screen.x)).toBe(true)
                expect(Number.isFinite(screen.y)).toBe(true)

                const world = camera.screenToWorld(screen.x, screen.y)
                expect(Math.abs(world.wx - wx)).toBeLessThanOrEqual(
                    ROUND_TRIP_TOLERANCE,
                )
                expect(Math.abs(world.wy - wy)).toBeLessThanOrEqual(
                    ROUND_TRIP_TOLERANCE,
                )
            }),
            { numRuns: NUM_RUNS },
        )
    })

    it('camera state is unchanged across pure transforms', () => {
        fc.assert(
            fc.property(
                validConfigArb,
                finiteCoordArb,
                finiteCoordArb,
                (config, sx, sy) => {
                    const camera = new WorldCamera(config)
                    const zoomBefore = camera.getZoom()
                    const panBefore = camera.getPan()

                    camera.screenToWorld(sx, sy)
                    camera.worldToScreen(sx, sy)

                    expect(camera.getZoom()).toBe(zoomBefore)
                    expect(camera.getPan()).toEqual(panBefore)
                },
            ),
            { numRuns: NUM_RUNS },
        )
    })
})

// ---------------------------------------------------------------------------
// Property 3: World_Camera setZoom is clamp-then-identity
// ---------------------------------------------------------------------------

describe('Property 3: World_Camera setZoom is clamp-then-identity', () => {
    it('setZoom(z) clamps below minZoom, above maxZoom, and is identity in-range', () => {
        fc.assert(
            fc.property(validConfigArb, finiteNumberArb, (config, z) => {
                const camera = new WorldCamera(config)
                camera.setZoom(z)
                const after = camera.getZoom()

                if (z < config.minZoom) {
                    expect(after).toBe(config.minZoom)
                } else if (z > config.maxZoom) {
                    expect(after).toBe(config.maxZoom)
                } else {
                    expect(after).toBe(z)
                }
                expect(after).toBeGreaterThanOrEqual(config.minZoom)
                expect(after).toBeLessThanOrEqual(config.maxZoom)
            }),
            { numRuns: NUM_RUNS },
        )
    })
})

// ---------------------------------------------------------------------------
// Property 4: World_Camera rejects invalid construction
// ---------------------------------------------------------------------------

/**
 * Generator for invalid camera configs covering every documented failure mode:
 *   - minZoom <= 0
 *   - maxZoom < minZoom
 *   - non-finite minZoom
 *   - non-finite maxZoom
 *   - non-numeric minZoom
 *   - non-numeric maxZoom
 */
const invalidConfigArb = fc.oneof(
    // minZoom <= 0
    fc
        .record({
            minZoom: fc.double({
                min: -1e6,
                max: 0,
                noNaN: true,
                noDefaultInfinity: true,
            }),
            maxZoom: fc.double({
                min: 0,
                max: 100,
                noNaN: true,
                noDefaultInfinity: true,
            }),
        })
        .filter(({ minZoom }) => Number.isFinite(minZoom) && minZoom <= 0)
        .map(({ minZoom, maxZoom }) => ({ minZoom, maxZoom })),
    // maxZoom < minZoom (with positive minZoom)
    fc
        .record({
            minZoom: fc.double({
                min: 1,
                max: 100,
                noNaN: true,
                noDefaultInfinity: true,
            }),
            delta: fc.double({
                min: 0.01,
                max: 50,
                noNaN: true,
                noDefaultInfinity: true,
            }),
        })
        .filter(({ minZoom, delta }) =>
            Number.isFinite(minZoom) && Number.isFinite(delta) && delta > 0,
        )
        .map(({ minZoom, delta }) => ({
            minZoom,
            maxZoom: minZoom - delta,
        })),
    // non-finite minZoom
    fc.record({
        minZoom: nonFiniteNumberArb,
        maxZoom: fc.double({
            min: 1,
            max: 100,
            noNaN: true,
            noDefaultInfinity: true,
        }),
    }),
    // non-finite maxZoom
    fc.record({
        minZoom: fc.double({
            min: 1,
            max: 100,
            noNaN: true,
            noDefaultInfinity: true,
        }),
        maxZoom: nonFiniteNumberArb,
    }),
    // non-numeric minZoom
    fc.record({
        minZoom: fc.oneof(
            fc.constant(null as unknown as number),
            fc.constant(undefined as unknown as number),
            fc.string() as unknown as fc.Arbitrary<number>,
        ),
        maxZoom: fc.double({
            min: 1,
            max: 100,
            noNaN: true,
            noDefaultInfinity: true,
        }),
    }),
    // non-numeric maxZoom
    fc.record({
        minZoom: fc.double({
            min: 1,
            max: 100,
            noNaN: true,
            noDefaultInfinity: true,
        }),
        maxZoom: fc.oneof(
            fc.constant(null as unknown as number),
            fc.constant(undefined as unknown as number),
            fc.string() as unknown as fc.Arbitrary<number>,
        ),
    }),
)

describe('Property 4: World_Camera rejects invalid construction', () => {
    it('throws LearningWorldError(INVALID_CAMERA_CONFIG) for invalid bounds', () => {
        fc.assert(
            fc.property(invalidConfigArb, (raw) => {
                let caught: unknown
                try {
                    // Cast to bypass compile-time type-checking so we can drive the
                    // runtime guards with non-numeric inputs.
                    new WorldCamera(raw as unknown as CameraConfig)
                } catch (error) {
                    caught = error
                }

                expect(caught).toBeInstanceOf(LearningWorldError)
                expect((caught as LearningWorldError).code).toBe(
                    'INVALID_CAMERA_CONFIG',
                )
            }),
            { numRuns: NUM_RUNS },
        )
    })
})

// ---------------------------------------------------------------------------
// Property 5: World_Camera invalid setZoom leaves state unchanged
// ---------------------------------------------------------------------------

describe('Property 5: World_Camera invalid setZoom leaves state unchanged', () => {
    it('invalid setZoom preserves zoom and signals INVALID_CAMERA_INPUT exactly once', () => {
        fc.assert(
            fc.property(validConfigArb, invalidZoomInputArb, (config, bad) => {
                const errors: LearningWorldError[] = []
                const camera = new WorldCamera({
                    ...config,
                    onError: (e) => {
                        errors.push(e)
                    },
                })

                const zoomBefore = camera.getZoom()
                const panBefore = camera.getPan()

                camera.setZoom(bad as unknown as number)

                expect(camera.getZoom()).toBe(zoomBefore)
                expect(camera.getPan()).toEqual(panBefore)

                expect(errors).toHaveLength(1)
                expect(errors[0]).toBeInstanceOf(LearningWorldError)
                expect(errors[0]?.code).toBe('INVALID_CAMERA_INPUT')
            }),
            { numRuns: NUM_RUNS },
        )
    })
})
