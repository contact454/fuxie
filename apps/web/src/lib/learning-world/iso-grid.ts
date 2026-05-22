/**
 * Adapted from Mykonos `IsoGrid` (lib/iso/iso-grid.js, BSD-style isometric
 * projection math). MIT License, see THIRD_PARTY_NOTICES.
 *
 * Pure isometric grid math. Framework-agnostic: no React, Next, or DOM
 * identifiers appear in this file. All failure paths throw a typed
 * `LearningWorldError` so callers can branch on `code` without string
 * matching. See Requirement 10 in the V0 spec for the full contract.
 */

import { LearningWorldError } from './errors'

/**
 * Configuration for an isometric grid. All fields are integers; tile sizes
 * are clamped at construction time, and `cols` / `rows` must be at least 1.
 */
export interface IsoGridConfig {
    /** Integer in [1, 1024]. Width of one cell in unscaled screen px. */
    readonly tileWidth: number
    /** Integer in [1, 1024]. Height of one cell in unscaled screen px. */
    readonly tileHeight: number
    /** Integer >= 1. Grid is `cols` cells wide. */
    readonly cols: number
    /** Integer >= 1. Grid is `rows` cells deep. */
    readonly rows: number
}

/** Unscaled screen-space point produced by `cellToScreen`. */
export interface ScreenPoint {
    readonly x: number
    readonly y: number
}

/** Integer cell coordinate produced by `screenToCell`. */
export interface CellPoint {
    readonly gx: number
    readonly gy: number
}

const TILE_MIN = 1
const TILE_MAX = 1024

function isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value)
}

function assertFiniteCoord(name: string, value: unknown): asserts value is number {
    if (!isFiniteNumber(value)) {
        throw new LearningWorldError(
            'INVALID_GRID_INPUT',
            `IsoGrid: ${name} must be a finite number, got ${String(value)}`,
        )
    }
}

/**
 * Pure isometric grid: maps integer cells `(gx, gy)` to unscaled screen
 * points and back. The projection used here is the standard "diamond"
 * (a.k.a. "2:1") isometric mapping:
 *
 *     x = (gx - gy) * (tileWidth  / 2)
 *     y = (gx + gy) * (tileHeight / 2)
 *
 * The inverse is:
 *
 *     gx = ( x / (tileWidth/2) + y / (tileHeight/2) ) / 2
 *     gy = ( y / (tileHeight/2) - x / (tileWidth/2) ) / 2
 *
 * For any integer `(gx, gy)` in bounds, `screenToCell(cellToScreen(gx, gy))`
 * recovers `(gx, gy)` exactly after rounding (Requirement 10.3, Round_Trip).
 */
export class IsoGrid {
    public readonly tileWidth: number
    public readonly tileHeight: number
    public readonly cols: number
    public readonly rows: number

    constructor(config: IsoGridConfig) {
        if (config === null || typeof config !== 'object') {
            throw new LearningWorldError(
                'INVALID_GRID_CONFIG',
                `IsoGrid: config must be an object, got ${String(config)}`,
            )
        }

        const { tileWidth, tileHeight, cols, rows } = config

        assertTileDimension('tileWidth', tileWidth)
        assertTileDimension('tileHeight', tileHeight)
        assertGridExtent('cols', cols)
        assertGridExtent('rows', rows)

        this.tileWidth = tileWidth
        this.tileHeight = tileHeight
        this.cols = cols
        this.rows = rows
    }

    /**
     * Maps an integer cell coordinate to an unscaled screen point. Accepts
     * any finite numeric `(gx, gy)` — including out-of-bounds and
     * non-integer values — so that callers can use it during pan/zoom math
     * without first clamping. Throws `INVALID_GRID_INPUT` for `NaN`,
     * `±Infinity`, or non-numeric arguments (Requirement 10.5).
     */
    public cellToScreen(gx: number, gy: number): ScreenPoint {
        assertFiniteCoord('gx', gx)
        assertFiniteCoord('gy', gy)

        const halfW = this.tileWidth / 2
        const halfH = this.tileHeight / 2

        return {
            x: (gx - gy) * halfW,
            y: (gx + gy) * halfH,
        }
    }

    /**
     * Maps an unscaled screen point back to the nearest integer cell. The
     * inverse is computed in continuous coordinates and rounded with
     * `Math.round`, which is exact for any `(sx, sy)` produced by
     * `cellToScreen` for integer cells. Throws `INVALID_GRID_INPUT` for
     * `NaN`, `±Infinity`, or non-numeric arguments (Requirement 10.5).
     */
    public screenToCell(sx: number, sy: number): CellPoint {
        assertFiniteCoord('sx', sx)
        assertFiniteCoord('sy', sy)

        const halfW = this.tileWidth / 2
        const halfH = this.tileHeight / 2

        const a = sx / halfW
        const b = sy / halfH

        const gxFloat = (a + b) / 2
        const gyFloat = (b - a) / 2

        return {
            gx: Math.round(gxFloat),
            gy: Math.round(gyFloat),
        }
    }

    /**
     * True iff both coordinates are integers and lie in
     * `[0, cols) × [0, rows)`. Non-numeric, `NaN`, or `±Infinity` inputs
     * return `false` rather than throwing — `inBounds` is a predicate, not
     * a validator (Requirement 10 boundary contract).
     */
    public inBounds(gx: number, gy: number): boolean {
        if (!isFiniteNumber(gx) || !isFiniteNumber(gy)) return false
        if (!Number.isInteger(gx) || !Number.isInteger(gy)) return false
        return gx >= 0 && gx < this.cols && gy >= 0 && gy < this.rows
    }
}

function assertTileDimension(name: 'tileWidth' | 'tileHeight', value: unknown): void {
    if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value)) {
        throw new LearningWorldError(
            'INVALID_GRID_CONFIG',
            `IsoGrid: ${name} must be an integer in [${TILE_MIN}, ${TILE_MAX}], got ${String(value)}`,
        )
    }
    if (value < TILE_MIN || value > TILE_MAX) {
        throw new LearningWorldError(
            'INVALID_GRID_CONFIG',
            `IsoGrid: ${name} must be in [${TILE_MIN}, ${TILE_MAX}], got ${value}`,
        )
    }
}

function assertGridExtent(name: 'cols' | 'rows', value: unknown): void {
    if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value)) {
        throw new LearningWorldError(
            'INVALID_GRID_CONFIG',
            `IsoGrid: ${name} must be an integer >= 1, got ${String(value)}`,
        )
    }
    if (value < 1) {
        throw new LearningWorldError(
            'INVALID_GRID_CONFIG',
            `IsoGrid: ${name} must be >= 1, got ${value}`,
        )
    }
}
