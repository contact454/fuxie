// Feature: fuxie-learning-world-lab-v0, Property 9 + 10: World_Object factory
//
// Vai chinh: QA Automation Engineer
// Vai phoi hop: Frontend Engineer
//
// Spec ref: `.kiro/specs/fuxie-learning-world-lab-v0/requirements.md`
// Requirement 12.1 (createWorldObject field validation + grid-bounds rejection)
// Requirement 12.10 (sortKey orders back-to-front)
//
// This file exercises the pure factory + sort helpers implemented in
// `apps/web/src/lib/learning-world/world-object.ts`. Test plan mirrors
// the task spec for 4.2:
//
//   Property 9 — createWorldObject:
//     a. Valid inputs on a fixed 8x8 grid produce a WorldObject whose
//        fields match the input verbatim.
//     b. Invalid field-shape inputs (id, gx, gy, footprint, assetKey,
//        ariaLabel) throw `LearningWorldError` with code === 'INVALID_OBJECT'.
//     c. Out-of-bounds inputs (origin off-grid, or footprint corner
//        off-grid) throw `LearningWorldError` with code === 'OUT_OF_BOUNDS'.
//     ≥100 fast-check iterations per variant family.
//
//   Property 10 — sortKey orders back-to-front:
//     For any two valid WorldObjects on a 16x16 grid:
//       sortKey(o) === (o.gx + o.footprint.w - 1) + (o.gy + o.footprint.d - 1)
//       sortKey is deterministic (same input ⇒ same output).
//     Plus explicit examples covering one back-to-front pair, one
//     front-to-back pair, and at least one tie pair sharing equal depth.
//     ≥100 fast-check iterations.
//
// Validates: Requirements 12.1, 12.10.

import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import {
    IsoGrid,
    LearningWorldError,
    createWorldObject,
    isInteractive,
    sortKey,
} from '@/lib/learning-world'
import type { WorldObject, WorldObjectInput } from '@/lib/learning-world'

const NUM_RUNS = 100

// ---------------------------------------------------------------------------
// Fixed grids
// ---------------------------------------------------------------------------

/** 8x8 grid used for Property 9 (createWorldObject). */
const GRID_8 = new IsoGrid({
    tileWidth: 64,
    tileHeight: 32,
    cols: 8,
    rows: 8,
})
const GRID_8_COLS = 8
const GRID_8_ROWS = 8

/** 16x16 grid used for Property 10 (sortKey). Larger so footprints
 * have room to roam without immediately running out of bounds. */
const GRID_16 = new IsoGrid({
    tileWidth: 64,
    tileHeight: 32,
    cols: 16,
    rows: 16,
})
const GRID_16_COLS = 16
const GRID_16_ROWS = 16

// ---------------------------------------------------------------------------
// Generators (Property 9)
// ---------------------------------------------------------------------------

/**
 * A valid `WorldObjectInput` on `GRID_8`. The footprint is constrained so
 * that the back corner `(gx + w - 1, gy + d - 1)` is also in bounds. The
 * optional fields are independently included or omitted so we exercise
 * both paths through `createWorldObject`.
 */
const arbValidInput8: fc.Arbitrary<WorldObjectInput> = fc
    .record({
        id: fc.string({ minLength: 1, maxLength: 32 }).filter((s) => s.length >= 1),
        gx: fc.integer({ min: 0, max: GRID_8_COLS - 1 }),
        gy: fc.integer({ min: 0, max: GRID_8_ROWS - 1 }),
        // We pick w/d up to 64 (the type max) but later constrain them to
        // fit the grid via `chain` below.
        footprint: fc.record({
            w: fc.integer({ min: 1, max: 64 }),
            d: fc.integer({ min: 1, max: 64 }),
        }),
        assetKey: fc.string({ minLength: 1, maxLength: 128 }),
        ariaLabel: fc.option(fc.string({ minLength: 1, maxLength: 200 }), {
            nil: undefined,
        }),
        href: fc.option(fc.string({ minLength: 0, maxLength: 64 }), {
            nil: undefined,
        }),
        meta: fc.option(
            fc.dictionary(
                fc.string({ minLength: 1, maxLength: 8 }),
                fc.oneof(fc.integer(), fc.string(), fc.boolean()),
                { maxKeys: 4 },
            ),
            { nil: undefined },
        ),
    })
    .chain((rec) => {
        // Constrain footprint to fit on `GRID_8` from the chosen origin.
        const maxW = GRID_8_COLS - rec.gx
        const maxD = GRID_8_ROWS - rec.gy
        return fc
            .record({
                w: fc.integer({ min: 1, max: maxW }),
                d: fc.integer({ min: 1, max: maxD }),
            })
            .map((fp) => ({ ...rec, footprint: fp }))
    })

/** A "junk" arbitrary used for type-shape invalidation: emits values that
 * are guaranteed not to be a non-empty string. */
const arbNotNonEmptyString = fc.oneof(
    fc.constant(''),
    fc.constant(null),
    fc.constant(undefined),
    fc.integer(),
    fc.boolean(),
    fc.constant({}),
    fc.constant([]),
)

/** Numbers and non-numbers that are not integers. */
const arbNotInteger = fc.oneof(
    fc.constant(Number.NaN),
    fc.constant(Number.POSITIVE_INFINITY),
    fc.constant(Number.NEGATIVE_INFINITY),
    fc.float({ noInteger: true, noNaN: true }),
    fc.constant(null),
    fc.constant(undefined),
    fc.string({ minLength: 1, maxLength: 4 }),
    fc.constant({}),
)

/** Values that are not in the closed range [1, 64] when treated as a
 * footprint dimension: 0, negatives, anything > 64, non-integers, or
 * non-numbers. */
const arbBadFootprintDim = fc.oneof(
    fc.constant(0),
    fc.integer({ min: -32, max: -1 }),
    fc.integer({ min: 65, max: 1024 }),
    fc.constant(1.5),
    fc.constant(Number.NaN),
    fc.constant(Number.POSITIVE_INFINITY),
    fc.constant(Number.NEGATIVE_INFINITY),
    fc.constant(null),
    fc.constant(undefined),
    fc.string({ minLength: 1, maxLength: 4 }),
)

/** assetKey shapes that violate length 1..128 or non-string. */
const arbBadAssetKey = fc.oneof(
    fc.constant(''),
    fc.string({ minLength: 129, maxLength: 200 }),
    fc.integer(),
    fc.boolean(),
    fc.constant(null),
    fc.constant(undefined),
    fc.constant({}),
)

/** ariaLabel shapes that violate length 1..200 (when present) or non-string. */
const arbBadAriaLabel = fc.oneof(
    fc.constant(''),
    fc.string({ minLength: 201, maxLength: 240 }),
    fc.integer(),
    fc.boolean(),
    fc.constant({}),
)

/**
 * Helper: build a known-good baseline input on `GRID_8`. Tests then mutate
 * a single field to its bad value and assert the factory rejects.
 */
function baselineGood8(): WorldObjectInput {
    return {
        id: 'obj-1',
        gx: 1,
        gy: 1,
        footprint: { w: 2, d: 2 },
        assetKey: 'key',
    }
}

// ---------------------------------------------------------------------------
// Property 9.1 — Valid inputs round-trip through createWorldObject
// ---------------------------------------------------------------------------

describe('Property 9.1 — createWorldObject accepts valid inputs (Req 12.1)', () => {
    it('returns a WorldObject whose fields match the input verbatim', () => {
        fc.assert(
            fc.property(arbValidInput8, (input) => {
                const o: WorldObject = createWorldObject(input, GRID_8)

                expect(o.id).toBe(input.id)
                expect(o.gx).toBe(input.gx)
                expect(o.gy).toBe(input.gy)
                expect(o.footprint.w).toBe(input.footprint.w)
                expect(o.footprint.d).toBe(input.footprint.d)
                expect(o.assetKey).toBe(input.assetKey)

                if (input.ariaLabel === undefined) {
                    expect(o.ariaLabel).toBeUndefined()
                } else {
                    expect(o.ariaLabel).toBe(input.ariaLabel)
                }
                if (input.href === undefined) {
                    expect(o.href).toBeUndefined()
                } else {
                    expect(o.href).toBe(input.href)
                }
                if (input.meta === undefined) {
                    expect(o.meta).toBeUndefined()
                } else {
                    expect(o.meta).toEqual(input.meta)
                }

                // Sanity: produced object satisfies `isInteractive`
                // exactly when href or ariaLabel is present.
                const expectedInteractive =
                    input.href !== undefined || input.ariaLabel !== undefined
                expect(isInteractive(o)).toBe(expectedInteractive)
            }),
            { numRuns: NUM_RUNS },
        )
    })
})

// ---------------------------------------------------------------------------
// Property 9.2 — Invalid field-shape inputs throw INVALID_OBJECT
// ---------------------------------------------------------------------------

function expectInvalidObject(fn: () => unknown, descriptor: string): void {
    let threw: unknown = null
    try {
        fn()
    } catch (err) {
        threw = err
    }
    if (threw === null) {
        throw new Error(
            `expected createWorldObject to throw for ${descriptor}, but it returned`,
        )
    }
    expect(threw).toBeInstanceOf(LearningWorldError)
    expect((threw as LearningWorldError).code).toBe('INVALID_OBJECT')
}

function expectOutOfBounds(fn: () => unknown, descriptor: string): void {
    let threw: unknown = null
    try {
        fn()
    } catch (err) {
        threw = err
    }
    if (threw === null) {
        throw new Error(
            `expected createWorldObject to throw for ${descriptor}, but it returned`,
        )
    }
    expect(threw).toBeInstanceOf(LearningWorldError)
    expect((threw as LearningWorldError).code).toBe('OUT_OF_BOUNDS')
}

describe('Property 9.2 — createWorldObject rejects invalid field shapes with INVALID_OBJECT (Req 12.1)', () => {
    it('rejects non-string / empty id', () => {
        fc.assert(
            fc.property(arbNotNonEmptyString, (badId) => {
                const input = { ...baselineGood8(), id: badId as string }
                expectInvalidObject(
                    () => createWorldObject(input, GRID_8),
                    `id=${String(badId)}`,
                )
            }),
            { numRuns: NUM_RUNS },
        )
    })

    it('rejects non-integer gx', () => {
        fc.assert(
            fc.property(arbNotInteger, (badGx) => {
                const input = { ...baselineGood8(), gx: badGx as number }
                expectInvalidObject(
                    () => createWorldObject(input, GRID_8),
                    `gx=${String(badGx)}`,
                )
            }),
            { numRuns: NUM_RUNS },
        )
    })

    it('rejects non-integer gy', () => {
        fc.assert(
            fc.property(arbNotInteger, (badGy) => {
                const input = { ...baselineGood8(), gy: badGy as number }
                expectInvalidObject(
                    () => createWorldObject(input, GRID_8),
                    `gy=${String(badGy)}`,
                )
            }),
            { numRuns: NUM_RUNS },
        )
    })

    it('rejects footprint.w outside [1, 64] or non-integer / non-numeric', () => {
        fc.assert(
            fc.property(arbBadFootprintDim, (badW) => {
                const input = {
                    ...baselineGood8(),
                    footprint: { w: badW as number, d: 1 },
                }
                expectInvalidObject(
                    () => createWorldObject(input, GRID_8),
                    `footprint.w=${String(badW)}`,
                )
            }),
            { numRuns: NUM_RUNS },
        )
    })

    it('rejects footprint.d outside [1, 64] or non-integer / non-numeric', () => {
        fc.assert(
            fc.property(arbBadFootprintDim, (badD) => {
                const input = {
                    ...baselineGood8(),
                    footprint: { w: 1, d: badD as number },
                }
                expectInvalidObject(
                    () => createWorldObject(input, GRID_8),
                    `footprint.d=${String(badD)}`,
                )
            }),
            { numRuns: NUM_RUNS },
        )
    })

    it('rejects assetKey outside length 1..128 or non-string', () => {
        fc.assert(
            fc.property(arbBadAssetKey, (badAssetKey) => {
                const input = {
                    ...baselineGood8(),
                    assetKey: badAssetKey as string,
                }
                expectInvalidObject(
                    () => createWorldObject(input, GRID_8),
                    `assetKey shape`,
                )
            }),
            { numRuns: NUM_RUNS },
        )
    })

    it('rejects ariaLabel (when present) outside length 1..200 or non-string', () => {
        fc.assert(
            fc.property(arbBadAriaLabel, (badAriaLabel) => {
                const input = {
                    ...baselineGood8(),
                    ariaLabel: badAriaLabel as string,
                }
                expectInvalidObject(
                    () => createWorldObject(input, GRID_8),
                    `ariaLabel shape`,
                )
            }),
            { numRuns: NUM_RUNS },
        )
    })

    it('rejects null / non-object input', () => {
        // Spot-checks for the input-shape guard at the top of the factory.
        for (const bad of [null, undefined, 'x', 1, true]) {
            expectInvalidObject(
                () => createWorldObject(bad as unknown as WorldObjectInput, GRID_8),
                `input=${String(bad)}`,
            )
        }
    })

    it('rejects null / non-object footprint', () => {
        for (const badFootprint of [null, undefined, 'x', 1, true]) {
            const input = {
                ...baselineGood8(),
                footprint: badFootprint as unknown as { w: number; d: number },
            }
            expectInvalidObject(
                () => createWorldObject(input, GRID_8),
                `footprint=${String(badFootprint)}`,
            )
        }
    })
})

// ---------------------------------------------------------------------------
// Property 9.3 — Out-of-bounds inputs throw OUT_OF_BOUNDS
// ---------------------------------------------------------------------------

/**
 * Generates an integer origin that lies *outside* the 8x8 grid in at
 * least one axis. Coordinate range covers [-2, 9] which is just outside
 * the grid on either side.
 */
const arbOriginOutside8 = fc
    .tuple(fc.integer({ min: -2, max: 9 }), fc.integer({ min: -2, max: 9 }))
    .filter(([gx, gy]) => !GRID_8.inBounds(gx, gy))

/**
 * Generates an in-bounds origin combined with a footprint whose far
 * corner spills past the 8x8 grid edge. We pick origin in
 * `[0, cols)` and footprint dim in `[1, 64]`, then keep only those
 * tuples whose corner is out of bounds.
 */
const arbOriginInsideFootprintOutside8 = fc
    .record({
        gx: fc.integer({ min: 0, max: GRID_8_COLS - 1 }),
        gy: fc.integer({ min: 0, max: GRID_8_ROWS - 1 }),
        w: fc.integer({ min: 1, max: 64 }),
        d: fc.integer({ min: 1, max: 64 }),
    })
    .filter(({ gx, gy, w, d }) => {
        const cornerX = gx + w - 1
        const cornerY = gy + d - 1
        // Origin must be in bounds; corner must be out of bounds.
        return GRID_8.inBounds(gx, gy) && !GRID_8.inBounds(cornerX, cornerY)
    })

describe('Property 9.3 — createWorldObject rejects out-of-bounds origin or footprint with OUT_OF_BOUNDS (Req 12.1)', () => {
    it('rejects integer origin outside the grid', () => {
        fc.assert(
            fc.property(arbOriginOutside8, ([gx, gy]) => {
                const input: WorldObjectInput = {
                    ...baselineGood8(),
                    gx,
                    gy,
                    footprint: { w: 1, d: 1 },
                }
                expectOutOfBounds(
                    () => createWorldObject(input, GRID_8),
                    `origin=(${gx}, ${gy})`,
                )
            }),
            { numRuns: NUM_RUNS },
        )
    })

    it('rejects in-bounds origin whose footprint corner is outside the grid', () => {
        fc.assert(
            fc.property(
                arbOriginInsideFootprintOutside8,
                ({ gx, gy, w, d }) => {
                    const input: WorldObjectInput = {
                        ...baselineGood8(),
                        gx,
                        gy,
                        footprint: { w, d },
                    }
                    expectOutOfBounds(
                        () => createWorldObject(input, GRID_8),
                        `corner overflow at (${gx}, ${gy}) w=${w} d=${d}`,
                    )
                },
            ),
            { numRuns: NUM_RUNS },
        )
    })

    it('explicit examples — origin off-grid in each direction', () => {
        const cases: ReadonlyArray<readonly [number, number]> = [
            [-1, 0],
            [0, -1],
            [GRID_8_COLS, 0],
            [0, GRID_8_ROWS],
            [GRID_8_COLS, GRID_8_ROWS],
        ]
        for (const [gx, gy] of cases) {
            const input: WorldObjectInput = {
                ...baselineGood8(),
                gx,
                gy,
                footprint: { w: 1, d: 1 },
            }
            expectOutOfBounds(
                () => createWorldObject(input, GRID_8),
                `origin=(${gx}, ${gy})`,
            )
        }
    })

    it('explicit example — origin inside but footprint extends past the grid', () => {
        const input: WorldObjectInput = {
            ...baselineGood8(),
            gx: 7,
            gy: 7,
            footprint: { w: 2, d: 2 },
        }
        expectOutOfBounds(
            () => createWorldObject(input, GRID_8),
            'origin (7,7) with 2x2 footprint',
        )
    })
})

// ---------------------------------------------------------------------------
// Generators (Property 10)
// ---------------------------------------------------------------------------

/**
 * A valid WorldObject on `GRID_16`. Ids are generated independently so two
 * objects produced from this arbitrary will not necessarily collide --
 * Property 10 doesn't care about occupancy, only about `sortKey`.
 */
const arbValidObject16: fc.Arbitrary<WorldObject> = fc
    .record({
        id: fc.string({ minLength: 1, maxLength: 16 }),
        gx: fc.integer({ min: 0, max: GRID_16_COLS - 1 }),
        gy: fc.integer({ min: 0, max: GRID_16_ROWS - 1 }),
        assetKey: fc.string({ minLength: 1, maxLength: 32 }),
    })
    .chain((base) => {
        const maxW = GRID_16_COLS - base.gx
        const maxD = GRID_16_ROWS - base.gy
        return fc
            .record({
                w: fc.integer({ min: 1, max: maxW }),
                d: fc.integer({ min: 1, max: maxD }),
            })
            .map(({ w, d }) =>
                createWorldObject(
                    {
                        id: base.id,
                        gx: base.gx,
                        gy: base.gy,
                        footprint: { w, d },
                        assetKey: base.assetKey,
                    },
                    GRID_16,
                ),
            )
    })

// ---------------------------------------------------------------------------
// Property 10 — sortKey orders back-to-front (Req 12.10)
// ---------------------------------------------------------------------------

function expectedSortKey(o: WorldObject): number {
    return o.gx + o.footprint.w - 1 + (o.gy + o.footprint.d - 1)
}

describe('Property 10 — sortKey orders back-to-front (Req 12.10)', () => {
    it('sortKey(o) equals (gx + w - 1) + (gy + d - 1) for any valid object', () => {
        fc.assert(
            fc.property(arbValidObject16, (o) => {
                expect(sortKey(o)).toBe(expectedSortKey(o))
            }),
            { numRuns: NUM_RUNS },
        )
    })

    it('is total and consistent across pairs: aBack < bBack ⇒ sortKey(a) < sortKey(b); aBack === bBack ⇒ sortKey(a) === sortKey(b)', () => {
        fc.assert(
            fc.property(arbValidObject16, arbValidObject16, (a, b) => {
                const aBack = expectedSortKey(a)
                const bBack = expectedSortKey(b)
                const ka = sortKey(a)
                const kb = sortKey(b)

                // Each key matches the closed-form depth.
                expect(ka).toBe(aBack)
                expect(kb).toBe(bBack)

                // Ordering reflects back-corner depth on every axis.
                if (aBack < bBack) expect(ka).toBeLessThan(kb)
                if (aBack > bBack) expect(ka).toBeGreaterThan(kb)
                if (aBack === bBack) expect(ka).toBe(kb)
            }),
            { numRuns: NUM_RUNS },
        )
    })

    it('is deterministic — same input produces the same key', () => {
        fc.assert(
            fc.property(arbValidObject16, (o) => {
                expect(sortKey(o)).toBe(sortKey(o))
            }),
            { numRuns: NUM_RUNS },
        )
    })

    // -----------------------------------------------------------------------
    // Explicit examples (Requirement 12.11 — V0 unit-test mandate calls
    // for at least one back-to-front and one front-to-back pair).
    // -----------------------------------------------------------------------

    it('explicit back-to-front pair: a behind b ⇒ sortKey(a) < sortKey(b)', () => {
        const a = createWorldObject(
            {
                id: 'back',
                gx: 0,
                gy: 0,
                footprint: { w: 1, d: 1 },
                assetKey: 'k',
            },
            GRID_16,
        )
        const b = createWorldObject(
            {
                id: 'front',
                gx: 5,
                gy: 5,
                footprint: { w: 1, d: 1 },
                assetKey: 'k',
            },
            GRID_16,
        )
        expect(sortKey(a)).toBe(0)
        expect(sortKey(b)).toBe(10)
        expect(sortKey(a)).toBeLessThan(sortKey(b))
    })

    it('explicit front-to-back pair: a in front of b ⇒ sortKey(a) > sortKey(b)', () => {
        const a = createWorldObject(
            {
                id: 'front',
                gx: 7,
                gy: 7,
                footprint: { w: 1, d: 1 },
                assetKey: 'k',
            },
            GRID_16,
        )
        const b = createWorldObject(
            {
                id: 'back',
                gx: 1,
                gy: 1,
                footprint: { w: 1, d: 1 },
                assetKey: 'k',
            },
            GRID_16,
        )
        expect(sortKey(a)).toBe(14)
        expect(sortKey(b)).toBe(2)
        expect(sortKey(a)).toBeGreaterThan(sortKey(b))
    })

    it('explicit tie pair: equal back-to-front depth ⇒ equal sortKey', () => {
        // Two objects with different origins / footprints but the same
        // back-corner depth (gx + w - 1 + gy + d - 1).
        const a = createWorldObject(
            {
                id: 'a',
                gx: 2,
                gy: 4,
                footprint: { w: 1, d: 1 },
                assetKey: 'k',
            },
            GRID_16,
        )
        // a back: (2 + 0) + (4 + 0) = 6
        const b = createWorldObject(
            {
                id: 'b',
                gx: 1,
                gy: 1,
                footprint: { w: 3, d: 3 },
                assetKey: 'k',
            },
            GRID_16,
        )
        // b back: (1 + 2) + (1 + 2) = 6
        expect(sortKey(a)).toBe(6)
        expect(sortKey(b)).toBe(6)
        expect(sortKey(a)).toBe(sortKey(b))
    })

    it('multi-cell footprints sort by their back-most cell, not the origin', () => {
        // `near` has origin closer to the camera (smaller gx+gy) but a
        // big footprint, so its back corner ends up *behind* `far`'s
        // origin. Without the +w-1 / +d-1 correction the order would
        // flip, so this test guards against a regressing implementation
        // that returns just gx+gy.
        const near = createWorldObject(
            {
                id: 'near',
                gx: 0,
                gy: 0,
                footprint: { w: 6, d: 6 },
                assetKey: 'k',
            },
            GRID_16,
        )
        const far = createWorldObject(
            {
                id: 'far',
                gx: 4,
                gy: 4,
                footprint: { w: 1, d: 1 },
                assetKey: 'k',
            },
            GRID_16,
        )
        // near back: (0+5) + (0+5) = 10
        // far  back: (4+0) + (4+0) = 8
        expect(sortKey(near)).toBe(10)
        expect(sortKey(far)).toBe(8)
        expect(sortKey(near)).toBeGreaterThan(sortKey(far))
    })
})
