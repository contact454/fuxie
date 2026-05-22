/**
 * Adapted from Mykonos `TileMap` (lib/iso/tile-map.js, isometric tile-map
 * occupancy index and footprint marking conventions). MIT License, see
 * THIRD_PARTY_NOTICES.
 *
 * Tile-map / occupancy index for foreground `WorldObject`s placed on an
 * `IsoGrid`. Framework-agnostic: no React, Next, or DOM identifiers
 * appear in this file. All failure paths throw a typed
 * `LearningWorldError` so callers can branch on `code` without string
 * matching. See Requirement 12 in the V0 spec for the full contract.
 */

import { LearningWorldError } from './errors'
import type { IsoGrid } from './iso-grid'
import type { WorldObject } from './world-object'

/**
 * Configuration for a `WorldMap`. The grid is captured by reference and
 * its bounds are used to validate every footprint at `add`-time. Two
 * `WorldMap` instances built against different grids are independent and
 * non-interchangeable.
 */
export interface WorldMapConfig {
    readonly grid: IsoGrid
}

function invalidGridInput(message: string): LearningWorldError {
    return new LearningWorldError('INVALID_GRID_INPUT', `WorldMap: ${message}`)
}

function outOfBounds(message: string): LearningWorldError {
    return new LearningWorldError('OUT_OF_BOUNDS', `WorldMap: ${message}`)
}

function occupancyCollision(message: string): LearningWorldError {
    return new LearningWorldError('OCCUPANCY_COLLISION', `WorldMap: ${message}`)
}

function objectNotRegistered(message: string): LearningWorldError {
    return new LearningWorldError(
        'OBJECT_NOT_REGISTERED',
        `WorldMap: ${message}`,
    )
}

/**
 * Builds the canonical cell-key string used to index into `cells`.
 * The format `${gx},${gy}` is stable, collision-free for integer
 * coordinates, and avoids allocating an Object/Map-of-Maps per row.
 */
function cellKey(gx: number, gy: number): string {
    return `${gx},${gy}`
}

/**
 * Tile-map / occupancy index over an `IsoGrid`. Tracks which cell is
 * occupied by which `WorldObject`, supports O(1) `objectAt` lookups, and
 * exposes a monotonic version counter that increments by exactly 1 on
 * each successful mutation (Requirement 12.9).
 *
 * Construction is cheap; the map starts empty with `version === 0`. The
 * map does **not** re-validate `WorldObject` field shapes on `add`: the
 * documented contract is that `object` was produced by
 * `createWorldObject(input, grid)` against the same grid the map was
 * built with. `add` does, however, validate that the footprint corner
 * lies inside the grid (re-using `IsoGrid.inBounds`) so a stale or
 * mismatched object is rejected with `OUT_OF_BOUNDS` rather than
 * silently corrupting the cell map.
 */
export class WorldMap {
    public readonly grid: IsoGrid

    /** Cell -> object occupying that cell. Keys are `${gx},${gy}` strings. */
    private readonly cells: Map<string, WorldObject> = new Map()

    /** Membership set: enables O(1) `remove` validation by reference equality. */
    private readonly members: Set<WorldObject> = new Set()

    /** Stable insertion order, exposed via `objects()` snapshots. */
    private readonly insertionOrder: WorldObject[] = []

    /** Monotonic counter starting at 0; +1 on each successful mutation. */
    private version: number = 0

    constructor(config: WorldMapConfig) {
        if (config === null || typeof config !== 'object') {
            throw invalidGridInput(
                `config must be an object, got ${String(config)}`,
            )
        }
        const { grid } = config
        if (
            grid === null ||
            typeof grid !== 'object' ||
            typeof (grid as IsoGrid).inBounds !== 'function'
        ) {
            throw invalidGridInput(
                `config.grid must be an IsoGrid, got ${String(grid)}`,
            )
        }
        this.grid = grid
    }

    /**
     * Returns the current version counter. Starts at 0 and increments by
     * exactly 1 on each successful `add` or `remove`. Never decreases
     * (Requirement 12.9).
     */
    public getVersion(): number {
        return this.version
    }

    /**
     * Returns the `WorldObject` occupying cell `(gx, gy)`, or `null` if
     * the cell is empty (Requirement 12.2).
     *
     * Throws:
     *   - `INVALID_GRID_INPUT` for non-numeric / `NaN` / `±Infinity` /
     *     non-integer coordinates.
     *   - `OUT_OF_BOUNDS` for in-type integer coordinates that fall
     *     outside `[0, cols) × [0, rows)`.
     *
     * Implementation is a single `Map` lookup, so the 10ms upper bound
     * from Requirement 12.2 holds with comfortable margin.
     */
    public objectAt(gx: number, gy: number): WorldObject | null {
        this.assertIntegerCoord('gx', gx)
        this.assertIntegerCoord('gy', gy)
        if (!this.grid.inBounds(gx, gy)) {
            throw outOfBounds(
                `(gx, gy) = (${gx}, ${gy}) is outside grid bounds [0, ${this.grid.cols}) x [0, ${this.grid.rows})`,
            )
        }
        const found = this.cells.get(cellKey(gx, gy))
        return found === undefined ? null : found
    }

    /**
     * True iff every cell of `object`'s footprint placed at origin
     * `(gx, gy)` is either empty or already occupied by `object` itself
     * (Requirement 12.4). Returns `false` (not throws) when the
     * footprint extends outside grid bounds, because `isFreeFor` is a
     * predicate, not a validator: callers wanting an exception should
     * use `add`.
     */
    public isFreeFor(object: WorldObject, gx: number, gy: number): boolean {
        if (object === null || typeof object !== 'object') return false
        const fp = object.footprint
        if (fp === null || typeof fp !== 'object') return false
        const { w, d } = fp
        if (
            typeof gx !== 'number' ||
            typeof gy !== 'number' ||
            !Number.isInteger(gx) ||
            !Number.isInteger(gy) ||
            !Number.isInteger(w) ||
            !Number.isInteger(d)
        ) {
            return false
        }
        // Footprint must fit inside the grid for the answer to be meaningful.
        if (!this.grid.inBounds(gx, gy)) return false
        if (!this.grid.inBounds(gx + w - 1, gy + d - 1)) return false

        for (let i = 0; i < w; i++) {
            for (let j = 0; j < d; j++) {
                const occupant = this.cells.get(cellKey(gx + i, gy + j))
                if (occupant !== undefined && occupant !== object) {
                    return false
                }
            }
        }
        return true
    }

    /**
     * Registers `object` and marks every cell of its footprint as
     * occupied by it (Requirement 12.5).
     *
     * Throws:
     *   - `OUT_OF_BOUNDS` when the origin or footprint corner falls
     *     outside the grid.
     *   - `OCCUPANCY_COLLISION` when any footprint cell is currently
     *     occupied by a different `WorldObject`.
     *
     * Atomic: on rejection, neither `cells`, `members`,
     * `insertionOrder`, nor `version` is mutated (Requirement 12.6). On
     * success, `version` increments by exactly 1.
     *
     * `add` does not re-validate field shapes; produce `object` via
     * `createWorldObject(input, grid)` against the same grid this map
     * was built with.
     */
    public add(object: WorldObject): void {
        if (object === null || typeof object !== 'object') {
            // Defensive guard. Field-shape validation is the caller's job
            // (via `createWorldObject`); we only reject obviously-not-an-object
            // arguments so we never read `.gx` off `null` and silently no-op.
            throw outOfBounds(
                `add: object must be a WorldObject, got ${String(object)}`,
            )
        }
        const { gx, gy, footprint } = object
        const { w, d } = footprint

        // 1. Bounds check: origin and footprint corner must both be in grid.
        if (!this.grid.inBounds(gx, gy)) {
            throw outOfBounds(
                `add: origin (${gx}, ${gy}) is outside grid bounds [0, ${this.grid.cols}) x [0, ${this.grid.rows})`,
            )
        }
        const cornerX = gx + w - 1
        const cornerY = gy + d - 1
        if (!this.grid.inBounds(cornerX, cornerY)) {
            throw outOfBounds(
                `add: footprint corner (${cornerX}, ${cornerY}) is outside grid bounds for origin (${gx}, ${gy}) and footprint { w: ${w}, d: ${d} }`,
            )
        }

        // 2. Collect all keys and verify no foreign occupant. We collect
        //    keys up front so the second pass is a pure write; this is
        //    what makes `add` atomic on rejection.
        const keys: string[] = new Array(w * d)
        let k = 0
        for (let i = 0; i < w; i++) {
            for (let j = 0; j < d; j++) {
                const key = cellKey(gx + i, gy + j)
                const occupant = this.cells.get(key)
                if (occupant !== undefined && occupant !== object) {
                    throw occupancyCollision(
                        `add: cell (${gx + i}, ${gy + j}) is already occupied by a different WorldObject`,
                    )
                }
                keys[k++] = key
            }
        }

        // 3. Commit: write every cell, update membership, bump version.
        for (let n = 0; n < keys.length; n++) {
            this.cells.set(keys[n] as string, object)
        }
        if (!this.members.has(object)) {
            this.members.add(object)
            this.insertionOrder.push(object)
        }
        this.version += 1
    }

    /**
     * Unregisters `object` and clears every cell whose value is `===` to
     * it (Requirement 12.7). Cells occupied by other objects, including
     * cells that happen to fall under `object`'s former footprint due to
     * caller misuse, are left untouched.
     *
     * Throws `OBJECT_NOT_REGISTERED` if `object` is not in `members`
     * (Requirement 12.8). On rejection, neither `cells`, `members`,
     * `insertionOrder`, nor `version` is mutated. On success, `version`
     * increments by exactly 1.
     */
    public remove(object: WorldObject): void {
        if (!this.members.has(object)) {
            throw objectNotRegistered(
                `remove: object is not registered in this WorldMap`,
            )
        }

        // Clear only cells that reference this exact object. Iterating
        // the footprint is correct in the common case, but we walk
        // `cells` here for safety: if a caller previously violated the
        // single-grid invariant we still won't clear someone else's cell.
        // The grid is bounded, so this is O(cols * rows) worst case; for
        // V0 grids this is comfortably under 10k cells.
        for (const [key, occupant] of this.cells) {
            if (occupant === object) {
                this.cells.delete(key)
            }
        }

        this.members.delete(object)
        const idx = this.insertionOrder.indexOf(object)
        if (idx !== -1) {
            this.insertionOrder.splice(idx, 1)
        }
        this.version += 1
    }

    /**
     * Snapshot of every registered `WorldObject` in insertion order. The
     * returned array is a fresh copy, so callers may safely iterate it
     * while mutating the map; subsequent `add`/`remove` calls do not
     * affect previously-returned snapshots.
     */
    public objects(): readonly WorldObject[] {
        return this.insertionOrder.slice()
    }

    private assertIntegerCoord(name: string, value: unknown): asserts value is number {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            throw invalidGridInput(
                `${name} must be a finite number, got ${String(value)}`,
            )
        }
        if (!Number.isInteger(value)) {
            throw invalidGridInput(
                `${name} must be an integer, got ${value}`,
            )
        }
    }
}
