/**
 * Adapted from Mykonos `PlacedObject` (lib/iso/placed-object.js, isometric
 * placed-object data shape and footprint conventions). MIT License, see
 * THIRD_PARTY_NOTICES.
 *
 * Pure data + validation for foreground objects placed in a `WorldScene`.
 * Framework-agnostic: no React, Next, or DOM identifiers appear in this
 * file. Validation failures throw a typed `LearningWorldError` so callers
 * can branch on `code` without string matching (Requirement 12.1).
 */

import { LearningWorldError } from './errors'
import type { IsoGrid } from './iso-grid'

/**
 * Footprint occupied by a `WorldObject` in grid cells.
 *
 * NOTE: `world-scene.ts` declares an inline structurally-identical
 * `Footprint` so it remains type-checkable on its own. The barrel
 * re-exports the canonical type from this file.
 */
export interface Footprint {
    /** Integer in [1, 64]. Width in cells along +gx. */
    readonly w: number
    /** Integer in [1, 64]. Depth in cells along +gy. */
    readonly d: number
}

/**
 * Foreground object placed in a `WorldScene`. Produce instances via
 * `createWorldObject(input, grid)` so field-shape and grid-bounds
 * invariants are checked at construction time.
 *
 * NOTE: `world-scene.ts` declares an inline structurally-identical
 * `WorldObject` so `WorldScene` is type-checkable on its own. The barrel
 * re-exports the canonical type from this file.
 */
export interface WorldObject {
    /** Stable identifier used by ariaLabel fallbacks and add/remove. */
    readonly id: string
    /** Integer cell origin within the active grid. */
    readonly gx: number
    readonly gy: number
    readonly footprint: Footprint
    /** Asset key looked up against the host's image registry. 1..128 chars. */
    readonly assetKey: string
    /** Optional, for accessibility. 1..200 chars when present. */
    readonly ariaLabel?: string
    /** Optional anchor target for Hotspot_List items. */
    readonly href?: string
    /** Optional opaque per-object data; never used by the core. */
    readonly meta?: Readonly<Record<string, unknown>>
}

/**
 * Candidate input for `createWorldObject`. Same shape as `WorldObject` but
 * fields are not yet guaranteed valid. The factory normalizes and
 * validates before producing a `WorldObject`.
 */
export interface WorldObjectInput {
    readonly id: string
    readonly gx: number
    readonly gy: number
    readonly footprint: Footprint
    readonly assetKey: string
    readonly ariaLabel?: string
    readonly href?: string
    readonly meta?: Readonly<Record<string, unknown>>
}

const FOOTPRINT_MIN = 1
const FOOTPRINT_MAX = 64
const ASSET_KEY_MIN = 1
const ASSET_KEY_MAX = 128
const ARIA_LABEL_MIN = 1
const ARIA_LABEL_MAX = 200

function invalidObject(message: string): LearningWorldError {
    return new LearningWorldError('INVALID_OBJECT', `WorldObject: ${message}`)
}

function outOfBounds(message: string): LearningWorldError {
    return new LearningWorldError('OUT_OF_BOUNDS', `WorldObject: ${message}`)
}

/**
 * Validates and normalizes a candidate input into a `WorldObject`.
 *
 * Accepts iff:
 *   - `id` is a non-empty string,
 *   - `gx` and `gy` are integers,
 *   - `footprint.w` and `footprint.d` are integers in [1, 64],
 *   - `assetKey` is a string of length 1..128,
 *   - `ariaLabel`, when present, is a string of length 1..200,
 *   - `(gx, gy)` and the footprint corner `(gx + w - 1, gy + d - 1)` are
 *     in `grid` bounds.
 *
 * Throws synchronously and produces no partial output on rejection:
 *   - `LearningWorldError('INVALID_OBJECT', ...)` for any field-shape failure.
 *   - `LearningWorldError('OUT_OF_BOUNDS', ...)` when origin or footprint
 *     corner falls outside grid bounds.
 */
export function createWorldObject(
    input: WorldObjectInput,
    grid: IsoGrid,
): WorldObject {
    if (input === null || typeof input !== 'object') {
        throw invalidObject(`input must be an object, got ${String(input)}`)
    }
    if (grid === null || typeof grid !== 'object') {
        throw invalidObject(`grid must be an IsoGrid instance, got ${String(grid)}`)
    }

    const {
        id,
        gx,
        gy,
        footprint,
        assetKey,
        ariaLabel,
        href,
        meta,
    } = input

    // id: non-empty string.
    if (typeof id !== 'string' || id.length === 0) {
        throw invalidObject(`id must be a non-empty string, got ${String(id)}`)
    }

    // gx / gy: integers (finite numbers without fractional part).
    if (typeof gx !== 'number' || !Number.isInteger(gx)) {
        throw invalidObject(`gx must be an integer, got ${String(gx)}`)
    }
    if (typeof gy !== 'number' || !Number.isInteger(gy)) {
        throw invalidObject(`gy must be an integer, got ${String(gy)}`)
    }

    // footprint: object with integer w/d in [1, 64].
    if (footprint === null || typeof footprint !== 'object') {
        throw invalidObject(`footprint must be an object, got ${String(footprint)}`)
    }
    const { w, d } = footprint
    if (typeof w !== 'number' || !Number.isInteger(w)) {
        throw invalidObject(`footprint.w must be an integer, got ${String(w)}`)
    }
    if (w < FOOTPRINT_MIN || w > FOOTPRINT_MAX) {
        throw invalidObject(
            `footprint.w must be in [${FOOTPRINT_MIN}, ${FOOTPRINT_MAX}], got ${w}`,
        )
    }
    if (typeof d !== 'number' || !Number.isInteger(d)) {
        throw invalidObject(`footprint.d must be an integer, got ${String(d)}`)
    }
    if (d < FOOTPRINT_MIN || d > FOOTPRINT_MAX) {
        throw invalidObject(
            `footprint.d must be in [${FOOTPRINT_MIN}, ${FOOTPRINT_MAX}], got ${d}`,
        )
    }

    // assetKey: string of length 1..128.
    if (typeof assetKey !== 'string') {
        throw invalidObject(`assetKey must be a string, got ${String(assetKey)}`)
    }
    if (assetKey.length < ASSET_KEY_MIN || assetKey.length > ASSET_KEY_MAX) {
        throw invalidObject(
            `assetKey length must be in [${ASSET_KEY_MIN}, ${ASSET_KEY_MAX}], got ${assetKey.length}`,
        )
    }

    // ariaLabel: when present, string of length 1..200.
    if (ariaLabel !== undefined) {
        if (typeof ariaLabel !== 'string') {
            throw invalidObject(
                `ariaLabel must be a string when present, got ${String(ariaLabel)}`,
            )
        }
        if (
            ariaLabel.length < ARIA_LABEL_MIN ||
            ariaLabel.length > ARIA_LABEL_MAX
        ) {
            throw invalidObject(
                `ariaLabel length must be in [${ARIA_LABEL_MIN}, ${ARIA_LABEL_MAX}] when present, got ${ariaLabel.length}`,
            )
        }
    }

    // href: when present, must be a string. (Length is not constrained by
    // Requirement 12.1; the type contract is the only invariant we own.)
    if (href !== undefined && typeof href !== 'string') {
        throw invalidObject(`href must be a string when present, got ${String(href)}`)
    }

    // meta: when present, must be a plain object. We don't deep-validate.
    if (meta !== undefined && (meta === null || typeof meta !== 'object')) {
        throw invalidObject(`meta must be an object when present, got ${String(meta)}`)
    }

    // Grid bounds: origin and footprint far-corner must both be in bounds.
    if (typeof grid.inBounds !== 'function') {
        throw invalidObject('grid.inBounds is not a function; not an IsoGrid')
    }
    if (!grid.inBounds(gx, gy)) {
        throw outOfBounds(
            `(gx, gy) = (${gx}, ${gy}) is outside grid bounds`,
        )
    }
    const cornerX = gx + w - 1
    const cornerY = gy + d - 1
    if (!grid.inBounds(cornerX, cornerY)) {
        throw outOfBounds(
            `footprint corner (${cornerX}, ${cornerY}) is outside grid bounds for origin (${gx}, ${gy}) and footprint { w: ${w}, d: ${d} }`,
        )
    }

    // All checks passed. Build the normalized result. Optional fields are
    // only attached when defined so the produced object's key set matches
    // the input's intent.
    const result: {
        id: string
        gx: number
        gy: number
        footprint: Footprint
        assetKey: string
        ariaLabel?: string
        href?: string
        meta?: Readonly<Record<string, unknown>>
    } = {
        id,
        gx,
        gy,
        footprint: { w, d },
        assetKey,
    }
    if (ariaLabel !== undefined) result.ariaLabel = ariaLabel
    if (href !== undefined) result.href = href
    if (meta !== undefined) result.meta = meta

    return result
}

/**
 * Deterministic back-to-front sort key. Larger means painted later (front).
 * Returns the maximum back-corner depth so multi-cell objects sort by
 * their front-most cell. Ties only occur when two objects share the same
 * back-to-front depth (Requirement 12.10).
 */
export function sortKey(o: WorldObject): number {
    return (o.gx + o.footprint.w - 1) + (o.gy + o.footprint.d - 1)
}

/**
 * True iff the object is interactive — i.e. has either an `href` (anchor
 * target) or an `ariaLabel` (accessible name). The Hotspot_List is built
 * from interactive objects only (Requirement 4.1).
 */
export function isInteractive(o: WorldObject): boolean {
    return o.href !== undefined || o.ariaLabel !== undefined
}
