/**
 * Original Fuxie code (no Mykonos lift). This file carries no MIT/Mykonos
 * header per Requirement 6 (10+ contiguous adapted lines is the trigger;
 * `WorldScene` is a Fuxie-original scene descriptor and contains zero such
 * lines).
 *
 * Defines the static scene contract consumed by the Learning_World_Core
 * paint pipeline and by the React canvas wrapper. Every type in the
 * transitive closure of `WorldScene` is plain TypeScript: no React, no
 * Next, no DOM-only identifiers (Requirements 3.8, 3.9).
 */

import type { IsoGridConfig } from './iso-grid'
import type { CameraConfig } from './world-camera'

/**
 * Footprint occupied by a `WorldObject` in grid cells.
 *
 * NOTE: Task 4.1 (`world-object.ts`) defines the canonical `Footprint` type
 * shape. Until that module lands, this file declares the same structural
 * shape inline so `WorldScene` is type-checkable on its own. The two
 * definitions are intentionally structurally identical; once Task 4.1 ships
 * the canonical export, callers MAY import `Footprint` from
 * `./world-object` instead. The barrel `index.ts` re-exports the canonical
 * `Footprint` from `./world-object`, not from this file.
 */
interface Footprint {
    /** Integer in [1, 64]. Width in cells along +gx. */
    readonly w: number
    /** Integer in [1, 64]. Depth in cells along +gy. */
    readonly d: number
}

/**
 * Foreground object placed in a `WorldScene`.
 *
 * NOTE: Task 4.1 (`world-object.ts`) defines the canonical `WorldObject`
 * type and the `createWorldObject` factory. Until that module lands, this
 * file declares the same structural shape inline so `WorldScene` is
 * type-checkable on its own. The two definitions are intentionally
 * structurally identical; the barrel re-exports the canonical
 * `WorldObject` from `./world-object`, not from this file.
 */
interface WorldObject {
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
 * A single terrain tile painted before `WorldObject`s in scene declaration
 * order. V0 ships zero terrain entries; the type exists so future slices
 * can extend the demo scene without changing the public surface.
 */
export interface TerrainEntry {
    /** Integer cell origin. */
    readonly gx: number
    readonly gy: number
    /** Footprint defaults to `{ w: 1, d: 1 }` when omitted. */
    readonly footprint?: Footprint
    /** Asset key looked up against the host's image registry. */
    readonly assetKey: string
}

/**
 * Static, JSON-serializable description of one isometric scene.
 *
 * Consumed by the React canvas wrapper to build `IsoGrid`, `WorldCamera`,
 * and `WorldMap` instances; consumed by `paint()` to render terrain and
 * objects. Contains no React, Next, or DOM-only identifiers
 * (Requirements 3.8, 3.9).
 */
export interface WorldScene {
    /** Grid metadata used to construct the scene's `IsoGrid`. */
    readonly grid: IsoGridConfig

    /**
     * Optional camera config. When omitted, the React wrapper falls back
     * to its documented default camera bounds.
     */
    readonly camera?: CameraConfig

    /**
     * Background tiles painted before objects, in declaration order.
     * V0 ships an empty array; future slices may populate it.
     */
    readonly terrain: readonly TerrainEntry[]

    /**
     * Foreground objects. `paint()` sorts them by `sortKey()` at paint
     * time; declaration order is preserved for accessibility (the
     * Hotspot_List renders interactive objects in this order).
     */
    readonly objects: readonly WorldObject[]

    /**
     * Accessible name applied to the host `<canvas>` element via
     * `aria-label`. Length must be 1..200 characters (Requirement 4.2).
     */
    readonly canvasAriaLabel: string

    /**
     * Optional id of a DOM element to use as `aria-labelledby` on the
     * host `<canvas>` instead of `aria-label`. The element must exist in
     * the DOM at mount time (Requirement 4.2).
     */
    readonly canvasAriaLabelledBy?: string
}
