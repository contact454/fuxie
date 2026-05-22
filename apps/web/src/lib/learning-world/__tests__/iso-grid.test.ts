// Feature: fuxie-learning-world-lab-v0, Property 1: Iso_Grid round-trip and validation
//
// Vai chinh: QA Automation Engineer
// Vai phoi hop: Frontend Engineer
//
// Spec ref: `.kiro/specs/fuxie-learning-world-lab-v0/requirements.md`
// Requirement 10: "Iso Grid Math Correctness"
//
// This file exercises the pure isometric grid math implemented in
// `apps/web/src/lib/learning-world/iso-grid.ts`. The test plan mirrors the
// task spec for 2.2:
//
//   1. Round-trip: for any valid `IsoGridConfig` and any integer cell
//      `(gx, gy)` inside the grid, `screenToCell(cellToScreen(gx, gy))`
//      equals `(gx, gy)` exactly. Driven by `fast-check` with
//      `numRuns: 100`.
//   2. Explicit examples on a fixed 8x8 grid covering the four corners,
//      two centre cells, and at least 16 interior cells.
//   3. Validation tests: constructor rejects non-integer / out-of-range
//      `tileWidth`/`tileHeight` and `cols`/`rows < 1` with
//      `LearningWorldError` whose `code === 'INVALID_GRID_CONFIG'`.
//      `cellToScreen` and `screenToCell` reject non-finite / non-numeric
//      arguments with `code === 'INVALID_GRID_INPUT'`.
//   4. Determinism: same config + same input always yields identical
//      output across two independent `IsoGrid` instances, over
//      `numRuns: 100`.
//   5. `inBounds` predicate: returns `true` for in-range integers and
//      `false` for out-of-range, non-integer, or non-finite inputs;
//      it must never throw.
//
// Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7.

import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import { IsoGrid, LearningWorldError } from '@/lib/learning-world'

const NUM_RUNS = 100

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** Tile dimension: integer in `[1, 1024]` (Requirement 10.6). */
const arbTileDim = fc.integer({ min: 1, max: 1024 })

/** Grid extent: integer >= 1; capped at 64 to keep test scenes small. */
const arbGridExtent = fc.integer({ min: 1, max: 64 })

const arbGridConfig = fc.record({
    tileWidth: arbTileDim,
    tileHeight: arbTileDim,
    cols: arbGridExtent,
    rows: arbGridExtent,
})

/**
 * Yields a config plus an integer cell `(gx, gy)` strictly inside the
 * grid (Requirement 10.3 round-trip domain). `fc.nat({ max: cols - 1 })`
 * gives a non-negative integer in `[0, cols)`.
 */
const arbConfigAndCell = arbGridConfig.chain((config) =>
    fc.tuple(
        fc.constant(config),
        fc.nat({ max: config.cols - 1 }),
        fc.nat({ max: config.rows - 1 }),
    ),
)

// ---------------------------------------------------------------------------
// Property 1 — Round-trip across random configs and cells (Req 10.3)
// ---------------------------------------------------------------------------

describe('Property 1.1 — Iso_Grid round-trip across random configs (Req 10.1, 10.2, 10.3)', () => {
    it('screenToCell(cellToScreen(gx, gy)) === (gx, gy) for every in-bounds integer cell', () => {
        fc.assert(
            fc.property(arbConfigAndCell, ([config, gx, gy]) => {
                const grid = new IsoGrid(config)

                const screen = grid.cellToScreen(gx, gy)

                // Output components are finite numbers (Req 10.1).
                expect(Number.isFinite(screen.x)).toBe(true)
                expect(Number.isFinite(screen.y)).toBe(true)

                const cell = grid.screenToCell(screen.x, screen.y)

                // Output components are integers (Req 10.2).
                expect(Number.isInteger(cell.gx)).toBe(true)
                expect(Number.isInteger(cell.gy)).toBe(true)

                // Round-trip is exact (Req 10.3).
                expect(cell.gx).toBe(gx)
                expect(cell.gy).toBe(gy)
            }),
            { numRuns: NUM_RUNS },
        )
    })
})

// ---------------------------------------------------------------------------
// Explicit examples on a fixed 8x8 grid (Req 10.7)
// ---------------------------------------------------------------------------

/**
 * Fixed 8x8 grid for explicit-example coverage. Tile dimensions chosen
 * to be the canonical 2:1 isometric ratio also used by the V0 lab scene
 * (see `design.md`, "Lab scene grid metadata: 64 x 32").
 */
const FIXED_GRID = new IsoGrid({
    tileWidth: 64,
    tileHeight: 32,
    cols: 8,
    rows: 8,
})

const FOUR_CORNERS: ReadonlyArray<readonly [number, number]> = [
    [0, 0],
    [7, 0],
    [0, 7],
    [7, 7],
]

const CENTRE_CELLS: ReadonlyArray<readonly [number, number]> = [
    [3, 3],
    [4, 4],
]

/**
 * Sixteen distinct interior cells of the 8x8 grid (i.e. cells with both
 * coordinates in `[1, 6]`, so neither coordinate touches a grid edge).
 * The set is hand-picked to cover both diagonals plus a couple of
 * off-diagonal points; the only constraint the spec places on this list
 * is that it contain at least 16 distinct interior cells.
 */
const SIXTEEN_INTERIOR_CELLS: ReadonlyArray<readonly [number, number]> = [
    [1, 1],
    [2, 2],
    [3, 3],
    [4, 4],
    [5, 5],
    [6, 6],
    [1, 6],
    [2, 5],
    [3, 4],
    [4, 3],
    [5, 2],
    [6, 1],
    [1, 3],
    [3, 1],
    [4, 6],
    [6, 4],
]

describe('Property 1.2 — Iso_Grid explicit-example round-trip on fixed 8x8 grid (Req 10.7)', () => {
    it.each(FOUR_CORNERS)('round-trips at corner (%i, %i)', (gx, gy) => {
        const screen = FIXED_GRID.cellToScreen(gx, gy)
        const cell = FIXED_GRID.screenToCell(screen.x, screen.y)
        expect(cell).toEqual({ gx, gy })
    })

    it.each(CENTRE_CELLS)('round-trips at centre cell (%i, %i)', (gx, gy) => {
        const screen = FIXED_GRID.cellToScreen(gx, gy)
        const cell = FIXED_GRID.screenToCell(screen.x, screen.y)
        expect(cell).toEqual({ gx, gy })
    })

    it.each(SIXTEEN_INTERIOR_CELLS)(
        'round-trips at interior cell (%i, %i)',
        (gx, gy) => {
            const screen = FIXED_GRID.cellToScreen(gx, gy)
            const cell = FIXED_GRID.screenToCell(screen.x, screen.y)
            expect(cell).toEqual({ gx, gy })
        },
    )

    it('covers at least the four corners, two centre cells, and 16 interior cells', () => {
        // Sanity-check the example sets so a future edit cannot silently
        // shrink coverage below the levels Requirement 10.7 mandates.
        expect(FOUR_CORNERS).toHaveLength(4)
        expect(CENTRE_CELLS.length).toBeGreaterThanOrEqual(2)
        expect(SIXTEEN_INTERIOR_CELLS.length).toBeGreaterThanOrEqual(16)

        const dedup = new Set(
            SIXTEEN_INTERIOR_CELLS.map(([gx, gy]) => `${gx},${gy}`),
        )
        expect(dedup.size).toBe(SIXTEEN_INTERIOR_CELLS.length)

        for (const [gx, gy] of SIXTEEN_INTERIOR_CELLS) {
            expect(gx).toBeGreaterThanOrEqual(1)
            expect(gx).toBeLessThanOrEqual(6)
            expect(gy).toBeGreaterThanOrEqual(1)
            expect(gy).toBeLessThanOrEqual(6)
        }
    })
})

// ---------------------------------------------------------------------------
// Construction validation (Req 10.6)
// ---------------------------------------------------------------------------

interface NamedCase {
    readonly label: string
    readonly value: unknown
}

const INVALID_TILE_DIMENSIONS: ReadonlyArray<NamedCase> = [
    { label: '0', value: 0 },
    { label: '-1', value: -1 },
    { label: '1025 (above max)', value: 1025 },
    { label: '1.5 (non-integer)', value: 1.5 },
    { label: 'NaN', value: Number.NaN },
    { label: '+Infinity', value: Number.POSITIVE_INFINITY },
    { label: '-Infinity', value: Number.NEGATIVE_INFINITY },
    { label: 'null', value: null },
    { label: 'undefined', value: undefined },
    { label: 'string "8"', value: '8' },
]

const INVALID_GRID_EXTENTS: ReadonlyArray<NamedCase> = [
    { label: '0', value: 0 },
    { label: '-1', value: -1 },
    { label: '1.5 (non-integer)', value: 1.5 },
    { label: 'NaN', value: Number.NaN },
    { label: '+Infinity', value: Number.POSITIVE_INFINITY },
    { label: '-Infinity', value: Number.NEGATIVE_INFINITY },
    { label: 'null', value: null },
    { label: 'undefined', value: undefined },
    { label: 'string "8"', value: '8' },
]

describe('Property 1.3 — Iso_Grid constructor rejects invalid configuration (Req 10.6)', () => {
    it.each(INVALID_TILE_DIMENSIONS)(
        'rejects tileWidth=$label with INVALID_GRID_CONFIG',
        ({ value }) => {
            try {
                new IsoGrid({
                    tileWidth: value as number,
                    tileHeight: 32,
                    cols: 8,
                    rows: 8,
                })
                throw new Error('expected IsoGrid construction to throw')
            } catch (err) {
                expect(err).toBeInstanceOf(LearningWorldError)
                expect((err as LearningWorldError).code).toBe('INVALID_GRID_CONFIG')
            }
        },
    )

    it.each(INVALID_TILE_DIMENSIONS)(
        'rejects tileHeight=$label with INVALID_GRID_CONFIG',
        ({ value }) => {
            try {
                new IsoGrid({
                    tileWidth: 64,
                    tileHeight: value as number,
                    cols: 8,
                    rows: 8,
                })
                throw new Error('expected IsoGrid construction to throw')
            } catch (err) {
                expect(err).toBeInstanceOf(LearningWorldError)
                expect((err as LearningWorldError).code).toBe('INVALID_GRID_CONFIG')
            }
        },
    )

    it.each(INVALID_GRID_EXTENTS)(
        'rejects cols=$label with INVALID_GRID_CONFIG',
        ({ value }) => {
            try {
                new IsoGrid({
                    tileWidth: 64,
                    tileHeight: 32,
                    cols: value as number,
                    rows: 8,
                })
                throw new Error('expected IsoGrid construction to throw')
            } catch (err) {
                expect(err).toBeInstanceOf(LearningWorldError)
                expect((err as LearningWorldError).code).toBe('INVALID_GRID_CONFIG')
            }
        },
    )

    it.each(INVALID_GRID_EXTENTS)(
        'rejects rows=$label with INVALID_GRID_CONFIG',
        ({ value }) => {
            try {
                new IsoGrid({
                    tileWidth: 64,
                    tileHeight: 32,
                    cols: 8,
                    rows: value as number,
                })
                throw new Error('expected IsoGrid construction to throw')
            } catch (err) {
                expect(err).toBeInstanceOf(LearningWorldError)
                expect((err as LearningWorldError).code).toBe('INVALID_GRID_CONFIG')
            }
        },
    )

    it('accepts the boundary tile dimensions (1 and 1024)', () => {
        expect(
            () => new IsoGrid({ tileWidth: 1, tileHeight: 1, cols: 1, rows: 1 }),
        ).not.toThrow()
        expect(
            () =>
                new IsoGrid({
                    tileWidth: 1024,
                    tileHeight: 1024,
                    cols: 1,
                    rows: 1,
                }),
        ).not.toThrow()
    })

    it('records the supplied configuration on the instance verbatim', () => {
        const grid = new IsoGrid({
            tileWidth: 48,
            tileHeight: 24,
            cols: 5,
            rows: 7,
        })
        expect(grid.tileWidth).toBe(48)
        expect(grid.tileHeight).toBe(24)
        expect(grid.cols).toBe(5)
        expect(grid.rows).toBe(7)
    })
})

// ---------------------------------------------------------------------------
// cellToScreen / screenToCell input validation (Req 10.5)
// ---------------------------------------------------------------------------

const INVALID_COORDS: ReadonlyArray<NamedCase> = [
    { label: 'NaN', value: Number.NaN },
    { label: '+Infinity', value: Number.POSITIVE_INFINITY },
    { label: '-Infinity', value: Number.NEGATIVE_INFINITY },
    { label: 'null', value: null },
    { label: 'undefined', value: undefined },
    { label: 'string "abc"', value: 'abc' },
    { label: 'empty object {}', value: {} },
]

describe('Property 1.4 — cellToScreen / screenToCell reject non-finite input (Req 10.5)', () => {
    it.each(INVALID_COORDS)(
        'cellToScreen rejects gx=$label with INVALID_GRID_INPUT',
        ({ value }) => {
            try {
                FIXED_GRID.cellToScreen(value as number, 0)
                throw new Error('expected cellToScreen to throw')
            } catch (err) {
                expect(err).toBeInstanceOf(LearningWorldError)
                expect((err as LearningWorldError).code).toBe('INVALID_GRID_INPUT')
            }
        },
    )

    it.each(INVALID_COORDS)(
        'cellToScreen rejects gy=$label with INVALID_GRID_INPUT',
        ({ value }) => {
            try {
                FIXED_GRID.cellToScreen(0, value as number)
                throw new Error('expected cellToScreen to throw')
            } catch (err) {
                expect(err).toBeInstanceOf(LearningWorldError)
                expect((err as LearningWorldError).code).toBe('INVALID_GRID_INPUT')
            }
        },
    )

    it.each(INVALID_COORDS)(
        'screenToCell rejects sx=$label with INVALID_GRID_INPUT',
        ({ value }) => {
            try {
                FIXED_GRID.screenToCell(value as number, 0)
                throw new Error('expected screenToCell to throw')
            } catch (err) {
                expect(err).toBeInstanceOf(LearningWorldError)
                expect((err as LearningWorldError).code).toBe('INVALID_GRID_INPUT')
            }
        },
    )

    it.each(INVALID_COORDS)(
        'screenToCell rejects sy=$label with INVALID_GRID_INPUT',
        ({ value }) => {
            try {
                FIXED_GRID.screenToCell(0, value as number)
                throw new Error('expected screenToCell to throw')
            } catch (err) {
                expect(err).toBeInstanceOf(LearningWorldError)
                expect((err as LearningWorldError).code).toBe('INVALID_GRID_INPUT')
            }
        },
    )
})

// ---------------------------------------------------------------------------
// Determinism (Req 10.4)
// ---------------------------------------------------------------------------

describe('Property 1.5 — Iso_Grid is deterministic across instances (Req 10.4)', () => {
    it('two grids with identical config produce identical outputs for the same input', () => {
        fc.assert(
            fc.property(arbConfigAndCell, ([config, gx, gy]) => {
                const a = new IsoGrid(config)
                const b = new IsoGrid(config)

                expect(a.cellToScreen(gx, gy)).toEqual(b.cellToScreen(gx, gy))

                const screen = a.cellToScreen(gx, gy)
                expect(a.screenToCell(screen.x, screen.y)).toEqual(
                    b.screenToCell(screen.x, screen.y),
                )
            }),
            { numRuns: NUM_RUNS },
        )
    })
})

// ---------------------------------------------------------------------------
// inBounds predicate
// ---------------------------------------------------------------------------

describe('Property 1.6 — inBounds is a non-throwing predicate (Req 10 boundary contract)', () => {
    it('returns true exactly for integer coordinates in [0, cols) x [0, rows)', () => {
        fc.assert(
            fc.property(
                arbGridConfig,
                fc.integer({ min: -8, max: 80 }),
                fc.integer({ min: -8, max: 80 }),
                (config, gx, gy) => {
                    const grid = new IsoGrid(config)
                    const expected =
                        gx >= 0 &&
                        gx < config.cols &&
                        gy >= 0 &&
                        gy < config.rows
                    expect(grid.inBounds(gx, gy)).toBe(expected)
                },
            ),
            { numRuns: NUM_RUNS },
        )
    })

    it('returns false for non-integer or non-finite inputs without throwing', () => {
        const grid = FIXED_GRID
        const NON_INTEGRAL: ReadonlyArray<NamedCase> = [
            { label: '1.5', value: 1.5 },
            { label: 'NaN', value: Number.NaN },
            { label: '+Infinity', value: Number.POSITIVE_INFINITY },
            { label: '-Infinity', value: Number.NEGATIVE_INFINITY },
            { label: 'null', value: null },
            { label: 'undefined', value: undefined },
            { label: 'string "3"', value: '3' },
        ]

        for (const { value } of NON_INTEGRAL) {
            expect(() => grid.inBounds(value as number, 0)).not.toThrow()
            expect(grid.inBounds(value as number, 0)).toBe(false)
            expect(() => grid.inBounds(0, value as number)).not.toThrow()
            expect(grid.inBounds(0, value as number)).toBe(false)
        }
    })

    it('returns false on the upper-bound edge (cols, rows) and true at (cols - 1, rows - 1)', () => {
        expect(FIXED_GRID.inBounds(8, 0)).toBe(false)
        expect(FIXED_GRID.inBounds(0, 8)).toBe(false)
        expect(FIXED_GRID.inBounds(7, 7)).toBe(true)
        expect(FIXED_GRID.inBounds(0, 0)).toBe(true)
        expect(FIXED_GRID.inBounds(-1, 0)).toBe(false)
        expect(FIXED_GRID.inBounds(0, -1)).toBe(false)
    })
})
