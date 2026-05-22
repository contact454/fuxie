// Feature: fuxie-learning-world-lab-v0, Properties 6 + 7 + 8: World_Map
//
// Vai chinh: QA Automation Engineer
// Vai phoi hop: Frontend Engineer
//
// Spec ref: `.kiro/specs/fuxie-learning-world-lab-v0/requirements.md`
// Requirement 12.2  — objectAt(in-bounds integer) returns occupant or null
// Requirement 12.3  — objectAt(invalid) rejects, no state mutation
// Requirement 12.4  — isFreeFor returns true iff every footprint cell is
//                     empty or already occupied by `object` itself
// Requirement 12.5  — add() marks every footprint cell as occupied
// Requirement 12.6  — rejected add leaves state and version unchanged
// Requirement 12.7  — remove() clears only cells previously marked by
//                     that object
// Requirement 12.8  — rejected remove leaves state and version unchanged
// Requirement 12.9  — version starts at 0, increments by exactly 1 on
//                     each successful mutation, never decreases
//
// Test plan (mirrors task 5.2):
//
//   Property 6 — World_Map model-based occupancy:
//     For each iteration, build a fresh fixed 8x8 IsoGrid + WorldMap and
//     mirror it with a brute-force 2D-array oracle (a `(WorldObject |
//     null)[8][8]` plus an insertion-order array). Generate a random
//     sequence of 1..30 add/remove commands. After each command, assert:
//       - worldMap.objectAt(gx, gy) === modelCells[gy][gx] for every cell
//       - worldMap.getVersion() === successfulMutationCount
//       - worldMap.objects() matches the model insertion order
//     Validates: Requirements 12.2, 12.4, 12.5, 12.7, 12.9.
//
//   Property 7 — World_Map failure atomicity:
//     Build a populated WorldMap with random non-colliding objects, plus
//     a "candidate" object that WILL collide with one of them or fall off
//     the grid. Snapshot every observable state (version, objects(),
//     objectAt of every cell, members). Try add(candidate); assert it
//     throws OCCUPANCY_COLLISION or OUT_OF_BOUNDS, and every snapshot is
//     unchanged. Same shape for remove() of an unregistered object,
//     which must throw OBJECT_NOT_REGISTERED with no state change.
//     Validates: Requirements 12.6, 12.8.
//
//   Property 8 — World_Map rejects invalid objectAt input:
//     Sweep non-integer / non-numeric / NaN / +-Infinity / null /
//     undefined / string args, asserting INVALID_GRID_INPUT. Sweep
//     in-type integer but out-of-grid coordinates, asserting
//     OUT_OF_BOUNDS. State must remain unchanged across every
//     rejected call.
//     Validates: Requirement 12.3.
//
// Validates: Requirements 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9.

import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import {
    IsoGrid,
    LearningWorldError,
    WorldMap,
    createWorldObject,
} from '@/lib/learning-world'
import type { WorldObject, WorldObjectInput } from '@/lib/learning-world'

const NUM_RUNS = 100

// ---------------------------------------------------------------------------
// Fixed grid + helpers
// ---------------------------------------------------------------------------

const COLS = 8
const ROWS = 8

function freshGrid(): IsoGrid {
    return new IsoGrid({ tileWidth: 64, tileHeight: 32, cols: COLS, rows: ROWS })
}

/**
 * Brute-force 2D-array model oracle. Stores the `WorldObject` occupying
 * each cell or `null` when empty. Index order is `cells[gy][gx]` so
 * iteration order in tests reads as "row by row".
 */
type ModelCells = (WorldObject | null)[][]

function emptyModel(): ModelCells {
    const rows: ModelCells = []
    for (let y = 0; y < ROWS; y++) {
        const row: (WorldObject | null)[] = new Array(COLS).fill(null)
        rows.push(row)
    }
    return rows
}

/** True iff every footprint cell is null or === object. Mirrors WorldMap.isFreeFor. */
function modelIsFreeFor(
    model: ModelCells,
    object: WorldObject,
    gx: number,
    gy: number,
): boolean {
    const { w, d } = object.footprint
    if (gx < 0 || gy < 0 || gx + w > COLS || gy + d > ROWS) return false
    for (let i = 0; i < w; i++) {
        for (let j = 0; j < d; j++) {
            const occ = model[gy + j]![gx + i]
            if (occ !== null && occ !== object) return false
        }
    }
    return true
}

function modelMark(model: ModelCells, object: WorldObject): void {
    const { gx, gy, footprint } = object
    const { w, d } = footprint
    for (let i = 0; i < w; i++) {
        for (let j = 0; j < d; j++) {
            model[gy + j]![gx + i] = object
        }
    }
}

function modelClearByIdentity(model: ModelCells, object: WorldObject): void {
    for (let y = 0; y < ROWS; y++) {
        const row = model[y]!
        for (let x = 0; x < COLS; x++) {
            if (row[x] === object) row[x] = null
        }
    }
}

/** Assert that the WorldMap and the brute-force model agree everywhere. */
function expectModelInSync(
    map: WorldMap,
    model: ModelCells,
    insertionOrder: readonly WorldObject[],
    expectedVersion: number,
): void {
    expect(map.getVersion()).toBe(expectedVersion)
    expect(map.objects()).toEqual(insertionOrder)

    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            const got = map.objectAt(x, y)
            const want = model[y]![x]
            // Strict identity check: same `WorldObject` reference (or both null).
            if (want === null) {
                expect(got).toBeNull()
            } else {
                expect(got).toBe(want)
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/**
 * Yields a {gx, gy, w, d} tuple where the origin is in [0, COLS) x [0, ROWS)
 * and the footprint corner is also in-grid. We then post-filter to clamp
 * w/d so the back corner stays in bounds; this keeps `arbValidPlacement`
 * cheap and avoids fast-check's filter-rejection guard.
 */
const arbValidPlacement = fc
    .record({
        gx: fc.integer({ min: 0, max: COLS - 1 }),
        gy: fc.integer({ min: 0, max: ROWS - 1 }),
        wRaw: fc.integer({ min: 1, max: COLS }),
        dRaw: fc.integer({ min: 1, max: ROWS }),
    })
    .map(({ gx, gy, wRaw, dRaw }) => {
        const w = Math.min(wRaw, COLS - gx)
        const d = Math.min(dRaw, ROWS - gy)
        return { gx, gy, w, d }
    })

/** Yields a valid `WorldObjectInput` for the 8x8 grid. */
const arbValidInput = arbValidPlacement.chain((p) =>
    fc
        .record({
            id: fc.string({ minLength: 1, maxLength: 16 }),
            assetKey: fc.string({ minLength: 1, maxLength: 24 }),
        })
        .map(
            ({ id, assetKey }): WorldObjectInput => ({
                id,
                gx: p.gx,
                gy: p.gy,
                footprint: { w: p.w, d: p.d },
                assetKey,
            }),
        ),
)

/**
 * A command in the model-based test:
 *   - kind: 'add'    -> new candidate input (may collide; that is the point)
 *   - kind: 'remove' -> pick the i-th currently-registered object, if any
 */
type Command =
    | { kind: 'add'; input: WorldObjectInput }
    | { kind: 'remove'; index: number }

const arbCommand: fc.Arbitrary<Command> = fc.oneof(
    { weight: 3, arbitrary: arbValidInput.map((input) => ({ kind: 'add' as const, input })) },
    {
        weight: 1,
        arbitrary: fc
            .integer({ min: 0, max: 31 })
            .map((index) => ({ kind: 'remove' as const, index })),
    },
)

const arbCommands = fc.array(arbCommand, { minLength: 1, maxLength: 30 })

// ---------------------------------------------------------------------------
// Property 6 — Model-based occupancy
// ---------------------------------------------------------------------------

describe('Property 6 — World_Map model-based occupancy (Req 12.2, 12.4, 12.5, 12.7, 12.9)', () => {
    it('agrees with a brute-force 2D-array oracle after every command', () => {
        fc.assert(
            fc.property(arbCommands, (commands) => {
                const grid = freshGrid()
                const map = new WorldMap({ grid })
                const model: ModelCells = emptyModel()
                const insertionOrder: WorldObject[] = []
                let expectedVersion = 0

                // Initial state agrees: empty grid, version 0, objects() === [].
                expectModelInSync(map, model, insertionOrder, expectedVersion)

                for (const cmd of commands) {
                    if (cmd.kind === 'add') {
                        // Build the WorldObject; we already constrained the
                        // footprint to fit, so createWorldObject must succeed.
                        const obj = createWorldObject(cmd.input, grid)

                        // Predict whether `add` should succeed. The model
                        // mirrors WorldMap's three-step add: bounds, then
                        // collision, then commit.
                        const free = modelIsFreeFor(model, obj, obj.gx, obj.gy)
                        // Sanity: WorldMap.isFreeFor agrees with the model
                        // before we mutate. Validates Requirement 12.4.
                        expect(map.isFreeFor(obj, obj.gx, obj.gy)).toBe(free)

                        if (free) {
                            // No collision -> commit on both sides.
                            map.add(obj)
                            modelMark(model, obj)
                            insertionOrder.push(obj)
                            expectedVersion += 1
                        } else {
                            // Collision -> WorldMap.add must throw and leave
                            // state untouched. We only check the throw shape
                            // here; full atomicity across the public surface
                            // is covered by Property 7.
                            let threw: unknown = null
                            try {
                                map.add(obj)
                            } catch (err) {
                                threw = err
                            }
                            expect(threw).toBeInstanceOf(LearningWorldError)
                            expect((threw as LearningWorldError).code).toBe(
                                'OCCUPANCY_COLLISION',
                            )
                        }
                    } else {
                        // 'remove': pick the i-th registered object via
                        // insertionOrder, when one exists.
                        if (insertionOrder.length === 0) continue
                        const idx = cmd.index % insertionOrder.length
                        const victim = insertionOrder[idx]!
                        map.remove(victim)
                        modelClearByIdentity(model, victim)
                        insertionOrder.splice(idx, 1)
                        expectedVersion += 1
                    }

                    // After every command, both sides must agree on every
                    // observable surface (Req 12.2, 12.5, 12.7, 12.9).
                    expectModelInSync(map, model, insertionOrder, expectedVersion)
                }
            }),
            { numRuns: NUM_RUNS },
        )
    })
})

// ---------------------------------------------------------------------------
// Property 7 — Failure atomicity
// ---------------------------------------------------------------------------

/**
 * Builds a `WorldMap` populated with up to 5 non-colliding random
 * objects on the 8x8 grid. Returns the map plus the inserted objects
 * (in insertion order) for downstream snapshotting.
 */
function buildPopulatedMap(
    inputs: ReadonlyArray<WorldObjectInput>,
): { map: WorldMap; grid: IsoGrid; objects: WorldObject[] } {
    const grid = freshGrid()
    const map = new WorldMap({ grid })
    const objects: WorldObject[] = []
    for (const input of inputs) {
        const obj = createWorldObject(input, grid)
        if (map.isFreeFor(obj, obj.gx, obj.gy)) {
            map.add(obj)
            objects.push(obj)
        }
    }
    return { map, grid, objects }
}

interface MapSnapshot {
    readonly version: number
    readonly objects: readonly WorldObject[]
    /** Flattened cell snapshot, indexed as [y * COLS + x]. */
    readonly cells: ReadonlyArray<WorldObject | null>
}

function snapshotMap(map: WorldMap): MapSnapshot {
    const cells: (WorldObject | null)[] = []
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            cells.push(map.objectAt(x, y))
        }
    }
    return {
        version: map.getVersion(),
        objects: map.objects(),
        cells,
    }
}

function expectSnapshotsEqual(a: MapSnapshot, b: MapSnapshot): void {
    expect(a.version).toBe(b.version)
    expect(a.objects).toEqual(b.objects)
    expect(a.cells.length).toBe(b.cells.length)
    for (let i = 0; i < a.cells.length; i++) {
        expect(a.cells[i]).toBe(b.cells[i])
    }
}

/** Up to 5 distinct, non-colliding inputs for the map prelude. */
const arbPreludeInputs = fc.array(arbValidInput, { minLength: 1, maxLength: 5 })

describe('Property 7 — World_Map failure atomicity (Req 12.6, 12.8)', () => {
    it('rejected add(...) leaves cells, members, objects(), and version unchanged', () => {
        fc.assert(
            fc.property(
                arbPreludeInputs,
                arbValidInput,
                (preludeInputs, candidateInput) => {
                    const { map, grid, objects } = buildPopulatedMap(preludeInputs)

                    // Skip the (occasional) iteration where the prelude
                    // failed to seat a single object: there is nothing for
                    // a candidate to collide with, so we cannot exercise
                    // the rejection branch on this iteration.
                    fc.pre(objects.length > 0)

                    // Force a collision: place the candidate so its origin
                    // sits on an already-occupied cell of the first
                    // inserted object. This guarantees an
                    // OCCUPANCY_COLLISION.
                    const seed = objects[0]!
                    const colliderInput: WorldObjectInput = {
                        ...candidateInput,
                        // Origin = seed origin. This cell is occupied,
                        // and the candidate is a fresh object so the
                        // "or already occupied by `object` itself" branch
                        // doesn't apply.
                        gx: seed.gx,
                        gy: seed.gy,
                        // Force a 1x1 footprint so the collision is on
                        // the origin itself. We do not need to go bigger
                        // to exercise atomicity, and a 1x1 footprint is
                        // always in-bounds when the origin is in-bounds.
                        footprint: { w: 1, d: 1 },
                        // Make sure the collider is a *different*
                        // WorldObject reference than `seed`; ids may be
                        // the same in principle, but identity is what
                        // matters to WorldMap.
                        id: `${candidateInput.id}-collider`,
                    }
                    const collider = createWorldObject(colliderInput, grid)
                    expect(collider).not.toBe(seed)

                    const before = snapshotMap(map)

                    let threw: unknown = null
                    try {
                        map.add(collider)
                    } catch (err) {
                        threw = err
                    }
                    expect(threw).toBeInstanceOf(LearningWorldError)
                    expect((threw as LearningWorldError).code).toBe(
                        'OCCUPANCY_COLLISION',
                    )

                    const after = snapshotMap(map)
                    expectSnapshotsEqual(before, after)
                },
            ),
            { numRuns: NUM_RUNS },
        )
    })

    it('rejected remove(...) of an unregistered object leaves everything unchanged', () => {
        fc.assert(
            fc.property(
                arbPreludeInputs,
                arbValidInput,
                (preludeInputs, strangerInput) => {
                    const { map, grid, objects } = buildPopulatedMap(preludeInputs)

                    // Build a fresh, unregistered WorldObject. It must be
                    // a different reference than every member; even when
                    // its (gx, gy, footprint) coincide with one that was
                    // registered, identity is what `members` uses.
                    const stranger = createWorldObject(strangerInput, grid)
                    for (const o of objects) expect(stranger).not.toBe(o)

                    const before = snapshotMap(map)

                    let threw: unknown = null
                    try {
                        map.remove(stranger)
                    } catch (err) {
                        threw = err
                    }
                    expect(threw).toBeInstanceOf(LearningWorldError)
                    expect((threw as LearningWorldError).code).toBe(
                        'OBJECT_NOT_REGISTERED',
                    )

                    const after = snapshotMap(map)
                    expectSnapshotsEqual(before, after)
                },
            ),
            { numRuns: NUM_RUNS },
        )
    })

    it('add() rejected for OUT_OF_BOUNDS (footprint corner spills past grid) leaves state unchanged', () => {
        fc.assert(
            fc.property(arbPreludeInputs, (preludeInputs) => {
                const { map, grid } = buildPopulatedMap(preludeInputs)

                // Construct a "spillover" object: place a 1x1 object at the
                // far corner of the grid, then synthesize a new WorldObject
                // by hand whose footprint extends past the grid. We bypass
                // `createWorldObject` here because that factory rejects
                // OUT_OF_BOUNDS at construction; we want to see WorldMap.add
                // reject it at add-time, exercising 12.6 in the bounds path.
                //
                // This is a deliberate breach of the documented contract
                // ("produce object via createWorldObject(input, grid)"),
                // and is the only way to get a malformed candidate to
                // WorldMap.add for atomicity testing.
                const spillover: WorldObject = {
                    id: 'spillover',
                    gx: COLS - 1,
                    gy: ROWS - 1,
                    footprint: { w: 2, d: 2 },
                    assetKey: 'spill',
                }

                const before = snapshotMap(map)

                let threw: unknown = null
                try {
                    map.add(spillover)
                } catch (err) {
                    threw = err
                }
                expect(threw).toBeInstanceOf(LearningWorldError)
                expect((threw as LearningWorldError).code).toBe('OUT_OF_BOUNDS')

                const after = snapshotMap(map)
                expectSnapshotsEqual(before, after)
            }),
            { numRuns: NUM_RUNS },
        )
    })
})

// ---------------------------------------------------------------------------
// Property 8 — objectAt input rejection
// ---------------------------------------------------------------------------

interface NamedCase {
    readonly label: string
    readonly value: unknown
}

/** Inputs that are non-numeric, NaN, +-Infinity, or non-integer numbers. */
const INVALID_NON_INTEGER: ReadonlyArray<NamedCase> = [
    { label: 'NaN', value: Number.NaN },
    { label: '+Infinity', value: Number.POSITIVE_INFINITY },
    { label: '-Infinity', value: Number.NEGATIVE_INFINITY },
    { label: '1.5 (non-integer)', value: 1.5 },
    { label: '-0.25 (non-integer)', value: -0.25 },
    { label: 'null', value: null },
    { label: 'undefined', value: undefined },
    { label: 'string "3"', value: '3' },
    { label: 'empty object {}', value: {} },
    { label: 'true (boolean)', value: true },
]

/**
 * Generator for non-integer-but-numeric inputs. We deliberately exclude
 * the integer band so generated examples always exercise the
 * INVALID_GRID_INPUT branch.
 */
const arbNonIntegerCoord = fc.oneof(
    fc.constant(Number.NaN),
    fc.constant(Number.POSITIVE_INFINITY),
    fc.constant(Number.NEGATIVE_INFINITY),
    fc.float({ noInteger: true, noNaN: true, min: -100, max: 100 }),
)

/**
 * Generator for in-type integer values that are guaranteed outside the
 * 8x8 grid on at least one axis. We pick from the bands [-32, -1] and
 * [COLS, COLS + 31]; either band, when handed to either coordinate, is
 * always strictly outside `[0, COLS) x [0, ROWS)`.
 */
const arbOutOfBoundsInteger = fc.oneof(
    fc.integer({ min: -32, max: -1 }),
    fc.integer({ min: COLS, max: COLS + 31 }),
)

describe('Property 8 — World_Map.objectAt rejects invalid input (Req 12.3)', () => {
    it('throws INVALID_GRID_INPUT for non-integer / non-numeric / NaN / Infinity gx', () => {
        const grid = freshGrid()
        const map = new WorldMap({ grid })
        const before = snapshotMap(map)

        fc.assert(
            fc.property(arbNonIntegerCoord, (badGx) => {
                let threw: unknown = null
                try {
                    map.objectAt(badGx as number, 0)
                } catch (err) {
                    threw = err
                }
                expect(threw).toBeInstanceOf(LearningWorldError)
                expect((threw as LearningWorldError).code).toBe('INVALID_GRID_INPUT')
            }),
            { numRuns: NUM_RUNS },
        )

        // State must remain unchanged after every rejected call (12.3).
        const after = snapshotMap(map)
        expectSnapshotsEqual(before, after)
    })

    it('throws INVALID_GRID_INPUT for non-integer / non-numeric / NaN / Infinity gy', () => {
        const grid = freshGrid()
        const map = new WorldMap({ grid })
        const before = snapshotMap(map)

        fc.assert(
            fc.property(arbNonIntegerCoord, (badGy) => {
                let threw: unknown = null
                try {
                    map.objectAt(0, badGy as number)
                } catch (err) {
                    threw = err
                }
                expect(threw).toBeInstanceOf(LearningWorldError)
                expect((threw as LearningWorldError).code).toBe('INVALID_GRID_INPUT')
            }),
            { numRuns: NUM_RUNS },
        )

        const after = snapshotMap(map)
        expectSnapshotsEqual(before, after)
    })

    it('throws OUT_OF_BOUNDS for in-type integer coordinates outside the grid', () => {
        const grid = freshGrid()
        const map = new WorldMap({ grid })
        const before = snapshotMap(map)

        fc.assert(
            fc.property(arbOutOfBoundsInteger, fc.integer({ min: -2, max: 9 }), (badGx, gy) => {
                let threw: unknown = null
                try {
                    map.objectAt(badGx, gy)
                } catch (err) {
                    threw = err
                }
                expect(threw).toBeInstanceOf(LearningWorldError)
                // gy might also be out of bounds; either way the only
                // legal failure code per Requirement 12.3 is OUT_OF_BOUNDS,
                // because both inputs are integers.
                expect((threw as LearningWorldError).code).toBe('OUT_OF_BOUNDS')
            }),
            { numRuns: NUM_RUNS },
        )

        fc.assert(
            fc.property(fc.integer({ min: -2, max: 9 }), arbOutOfBoundsInteger, (gx, badGy) => {
                let threw: unknown = null
                try {
                    map.objectAt(gx, badGy)
                } catch (err) {
                    threw = err
                }
                expect(threw).toBeInstanceOf(LearningWorldError)
                expect((threw as LearningWorldError).code).toBe('OUT_OF_BOUNDS')
            }),
            { numRuns: NUM_RUNS },
        )

        const after = snapshotMap(map)
        expectSnapshotsEqual(before, after)
    })

    it('explicit named cases for non-integer / non-numeric inputs', () => {
        const grid = freshGrid()
        const map = new WorldMap({ grid })

        for (const { label, value } of INVALID_NON_INTEGER) {
            let threw: unknown = null
            try {
                map.objectAt(value as number, 0)
            } catch (err) {
                threw = err
            }
            expect(threw, `gx=${label}`).toBeInstanceOf(LearningWorldError)
            expect((threw as LearningWorldError).code, `gx=${label}`).toBe(
                'INVALID_GRID_INPUT',
            )

            threw = null
            try {
                map.objectAt(0, value as number)
            } catch (err) {
                threw = err
            }
            expect(threw, `gy=${label}`).toBeInstanceOf(LearningWorldError)
            expect((threw as LearningWorldError).code, `gy=${label}`).toBe(
                'INVALID_GRID_INPUT',
            )
        }

        // State unchanged after every named rejection.
        expect(map.getVersion()).toBe(0)
        expect(map.objects()).toEqual([])
    })

    it('explicit named cases for in-type integer but out-of-bounds inputs', () => {
        const grid = freshGrid()
        const map = new WorldMap({ grid })

        const cases: ReadonlyArray<readonly [number, number]> = [
            [-1, 0],
            [0, -1],
            [COLS, 0],
            [0, ROWS],
            [COLS, ROWS],
            [-5, -5],
        ]
        for (const [gx, gy] of cases) {
            let threw: unknown = null
            try {
                map.objectAt(gx, gy)
            } catch (err) {
                threw = err
            }
            expect(threw, `(${gx}, ${gy})`).toBeInstanceOf(LearningWorldError)
            expect((threw as LearningWorldError).code, `(${gx}, ${gy})`).toBe(
                'OUT_OF_BOUNDS',
            )
        }

        expect(map.getVersion()).toBe(0)
        expect(map.objects()).toEqual([])
    })
})
