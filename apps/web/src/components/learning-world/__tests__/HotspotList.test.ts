// Feature: fuxie-learning-world-lab-v0, Property 18: Hotspot list pure-helper invariants
//
// Vai chinh: QA Automation Engineer
// Vai phoi hop: Frontend Engineer
//
// Spec ref: `.kiro/specs/fuxie-learning-world-lab-v0/requirements.md`
// Requirement 4.1: one Hotspot_List item per interactive World_Object.
// Requirement 4.3: when a World_Object has `ariaLabel`, that label is the
//   item's accessible name.
// Requirement 4.4: when `ariaLabel` is missing or empty, fall back to the
//   scene-defined identifier or the asset key, never empty.
// Requirement 4.6: items appear in scene-defined (declaration) order.
//
// This file exercises the pure helper `buildHotspotItems` from
// `../HotspotList`, never touching React, the DOM, or the rendered
// component. Tests run in the Vitest `node` environment.
//
// Test plan (mirrors task 10.9):
//
//   Property 18.1 — Length matches isInteractive count (Req 4.1):
//     For any scene drawn from `arbScene`,
//       buildHotspotItems(scene).length
//         === scene.objects.filter(isInteractive).length
//
//   Property 18.2 — Order preservation (Req 4.6):
//     The returned items' ids appear in the same order as the
//     `isInteractive` source objects in `scene.objects`.
//
//   Property 18.3 — Accessible-name fallback chain (Req 4.3, 4.4):
//     For each returned item,
//       accessibleName = ariaLabel (when non-empty string)
//                      ?? id        (when non-empty string)
//                      ?? assetKey
//     and the resolved name is never empty.
//
//   Property 18.4 — href preservation (Req 4.3 + 4.4):
//     For each returned item, `item.href === sourceObject.href`. The
//     `undefined` case is preserved verbatim so the renderer can pick
//     `<a>` vs `<button>` without re-checking the source object.
//
// All four properties run ≥100 fast-check iterations.
//
// Validates: Requirements 4.1, 4.3, 4.4, 4.6.

import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import {
    buildHotspotItems,
    type HotspotItem,
} from '../HotspotList'
import {
    IsoGrid,
    createWorldObject,
    isInteractive,
} from '@/lib/learning-world'
import type {
    WorldObject,
    WorldObjectInput,
    WorldScene,
} from '@/lib/learning-world'

const NUM_RUNS = 100

// ---------------------------------------------------------------------------
// Fixed grid (16x16) for object placement
// ---------------------------------------------------------------------------

const GRID_COLS = 16
const GRID_ROWS = 16
const GRID = new IsoGrid({
    tileWidth: 64,
    tileHeight: 32,
    cols: GRID_COLS,
    rows: GRID_ROWS,
})

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/**
 * A valid `WorldObjectInput` on `GRID`. The footprint is constrained so
 * the back corner stays in bounds. `ariaLabel` and `href` are
 * independently optional so we cover all four interactive/non-interactive
 * permutations:
 *
 *   ariaLabel?  href?  isInteractive?
 *   ---------  -----  --------------
 *      no       no         no   (excluded from buildHotspotItems output)
 *      no       yes        yes
 *      yes      no         yes
 *      yes      yes        yes
 *
 * Notes for Property 18.3 (accessible-name fallback):
 *
 *   - `id` is generated from `fc.string({ minLength: 1, ... })` so the
 *     factory accepts it and the fallback chain's middle rung is always
 *     non-empty in practice. Property 18.3's expected-name oracle still
 *     guards against an empty `id` defensively.
 *
 *   - `ariaLabel`, when present, has `minLength: 1` per
 *     `createWorldObject`'s 1..200 contract. The helper additionally
 *     guards against empty strings produced by callers that bypass the
 *     factory; we mirror that guard in the oracle.
 */
const arbValidInput: fc.Arbitrary<WorldObjectInput> = fc
    .record({
        id: fc.string({ minLength: 1, maxLength: 32 }),
        gx: fc.integer({ min: 0, max: GRID_COLS - 1 }),
        gy: fc.integer({ min: 0, max: GRID_ROWS - 1 }),
        assetKey: fc.string({ minLength: 1, maxLength: 64 }),
        ariaLabel: fc.option(
            fc.string({ minLength: 1, maxLength: 200 }),
            { nil: undefined },
        ),
        href: fc.option(
            // Empty href is allowed by the factory's type contract — only
            // its `undefined`-vs-string distinction matters to
            // `isInteractive` and the helper's href preservation rule.
            fc.string({ minLength: 0, maxLength: 64 }),
            { nil: undefined },
        ),
    })
    .chain((rec) => {
        const maxW = GRID_COLS - rec.gx
        const maxD = GRID_ROWS - rec.gy
        return fc
            .record({
                w: fc.integer({ min: 1, max: maxW }),
                d: fc.integer({ min: 1, max: maxD }),
            })
            .map((fp) => ({ ...rec, footprint: fp }))
    })

/** A valid `WorldObject` on `GRID`, produced via the factory so all
 * field-shape invariants hold. */
const arbValidObject: fc.Arbitrary<WorldObject> = arbValidInput.map((input) =>
    createWorldObject(input, GRID),
)

/** A small but non-trivial sequence of objects in scene-declaration
 * order. Empty arrays and arrays up to ~12 items are sampled. */
const arbObjects: fc.Arbitrary<readonly WorldObject[]> = fc.array(
    arbValidObject,
    { minLength: 0, maxLength: 12 },
)

/** A `WorldScene` with the generated objects and otherwise minimal
 * fields. Terrain is empty (V0 ships zero terrain entries). */
const arbScene: fc.Arbitrary<WorldScene> = arbObjects.map((objects) => ({
    grid: {
        tileWidth: GRID.tileWidth,
        tileHeight: GRID.tileHeight,
        cols: GRID.cols,
        rows: GRID.rows,
    },
    terrain: [],
    objects,
    canvasAriaLabel: 'test scene',
}))

// ---------------------------------------------------------------------------
// Oracles
// ---------------------------------------------------------------------------

/**
 * Mirror of the helper's accessible-name fallback chain. Kept independent
 * of the implementation so a regression in `HotspotList.tsx` (e.g.
 * dropping the empty-string guard on `ariaLabel`) is detected.
 */
function expectedAccessibleName(o: WorldObject): string {
    if (typeof o.ariaLabel === 'string' && o.ariaLabel.length > 0) {
        return o.ariaLabel
    }
    if (typeof o.id === 'string' && o.id.length > 0) {
        return o.id
    }
    return o.assetKey
}

// ---------------------------------------------------------------------------
// Property 18.1 — Length matches isInteractive count (Req 4.1)
// ---------------------------------------------------------------------------

describe('Property 18.1 — buildHotspotItems length matches isInteractive count (Req 4.1)', () => {
    it('returns one item per interactive object, and only for interactive objects', () => {
        fc.assert(
            fc.property(arbScene, (scene) => {
                const items = buildHotspotItems(scene)
                const interactiveCount = scene.objects.filter(isInteractive).length

                expect(items.length).toBe(interactiveCount)
            }),
            { numRuns: NUM_RUNS },
        )
    })

    it('explicit example: a non-interactive object is dropped from the output', () => {
        const interactive = createWorldObject(
            {
                id: 'a',
                gx: 0,
                gy: 0,
                footprint: { w: 1, d: 1 },
                assetKey: 'k1',
                ariaLabel: 'Square',
            },
            GRID,
        )
        const inert = createWorldObject(
            {
                id: 'b',
                gx: 1,
                gy: 1,
                footprint: { w: 1, d: 1 },
                assetKey: 'k2',
            },
            GRID,
        )
        const scene: WorldScene = {
            grid: {
                tileWidth: 64,
                tileHeight: 32,
                cols: GRID_COLS,
                rows: GRID_ROWS,
            },
            terrain: [],
            objects: [interactive, inert],
            canvasAriaLabel: 'test scene',
        }

        const items = buildHotspotItems(scene)
        expect(items.length).toBe(1)
        expect(items[0]?.id).toBe('a')
    })
})

// ---------------------------------------------------------------------------
// Property 18.2 — Order preservation (Req 4.6)
// ---------------------------------------------------------------------------

describe('Property 18.2 — buildHotspotItems preserves declaration order (Req 4.6)', () => {
    it('returned item ids match the order of interactive source objects', () => {
        fc.assert(
            fc.property(arbScene, (scene) => {
                const items = buildHotspotItems(scene)
                const interactiveIds = scene.objects
                    .filter(isInteractive)
                    .map((o) => o.id)
                const itemIds = items.map((i) => i.id)

                expect(itemIds).toEqual(interactiveIds)
            }),
            { numRuns: NUM_RUNS },
        )
    })
})

// ---------------------------------------------------------------------------
// Property 18.3 — Accessible-name fallback chain (Req 4.3, 4.4)
// ---------------------------------------------------------------------------

describe('Property 18.3 — accessibleName follows ariaLabel ?? id ?? assetKey, never empty (Req 4.3, 4.4)', () => {
    it('each item.accessibleName matches the fallback oracle', () => {
        fc.assert(
            fc.property(arbScene, (scene) => {
                const items = buildHotspotItems(scene)
                const interactives = scene.objects.filter(isInteractive)

                // Property 18.1 already asserts equal lengths, but we
                // re-check here so a regression there does not silently
                // mask a fallback-chain bug below.
                expect(items.length).toBe(interactives.length)

                for (let i = 0; i < items.length; i++) {
                    const item = items[i] as HotspotItem
                    const source = interactives[i] as WorldObject

                    // Name matches the helper's documented chain.
                    expect(item.accessibleName).toBe(
                        expectedAccessibleName(source),
                    )
                    // And is never empty (Req 4.4).
                    expect(item.accessibleName.length).toBeGreaterThan(0)
                }
            }),
            { numRuns: NUM_RUNS },
        )
    })

    it('explicit example: ariaLabel wins over id and assetKey', () => {
        const o = createWorldObject(
            {
                id: 'identifier',
                gx: 0,
                gy: 0,
                footprint: { w: 1, d: 1 },
                assetKey: 'asset-key',
                ariaLabel: 'Aria Label Wins',
            },
            GRID,
        )
        const scene: WorldScene = {
            grid: {
                tileWidth: 64,
                tileHeight: 32,
                cols: GRID_COLS,
                rows: GRID_ROWS,
            },
            terrain: [],
            objects: [o],
            canvasAriaLabel: 'test scene',
        }
        const items = buildHotspotItems(scene)
        expect(items[0]?.accessibleName).toBe('Aria Label Wins')
    })

    it('explicit example: id wins when ariaLabel absent (object still interactive via href)', () => {
        // ariaLabel is absent, but href is present so the object remains
        // interactive and surfaces in the Hotspot_List output.
        const o = createWorldObject(
            {
                id: 'identifier',
                gx: 0,
                gy: 0,
                footprint: { w: 1, d: 1 },
                assetKey: 'asset-key',
                href: '/somewhere',
            },
            GRID,
        )
        const scene: WorldScene = {
            grid: {
                tileWidth: 64,
                tileHeight: 32,
                cols: GRID_COLS,
                rows: GRID_ROWS,
            },
            terrain: [],
            objects: [o],
            canvasAriaLabel: 'test scene',
        }
        const items = buildHotspotItems(scene)
        expect(items[0]?.accessibleName).toBe('identifier')
    })

    it('explicit example: bypass-factory empty ariaLabel + empty id falls back to assetKey', () => {
        // Synthesize an object that does NOT come from `createWorldObject`
        // so we can hit the empty-string guard in the helper. The factory
        // would reject these field shapes (Req 12.1), but the helper is
        // documented to be defensive against callers that bypass it.
        const synthetic: WorldObject = {
            id: '',
            gx: 0,
            gy: 0,
            footprint: { w: 1, d: 1 },
            assetKey: 'fallback-asset',
            ariaLabel: '',
            href: '/x',
        }
        const scene: WorldScene = {
            grid: {
                tileWidth: 64,
                tileHeight: 32,
                cols: GRID_COLS,
                rows: GRID_ROWS,
            },
            terrain: [],
            objects: [synthetic],
            canvasAriaLabel: 'test scene',
        }
        const items = buildHotspotItems(scene)
        expect(items[0]?.accessibleName).toBe('fallback-asset')
        expect(items[0]?.accessibleName.length).toBeGreaterThan(0)
    })
})

// ---------------------------------------------------------------------------
// Property 18.4 — href preservation (Req 4.3 + 4.4)
// ---------------------------------------------------------------------------

describe('Property 18.4 — buildHotspotItems preserves href verbatim (Req 4.3, 4.4)', () => {
    it('item.href === sourceObject.href, including the undefined case', () => {
        fc.assert(
            fc.property(arbScene, (scene) => {
                const items = buildHotspotItems(scene)
                const interactives = scene.objects.filter(isInteractive)

                for (let i = 0; i < items.length; i++) {
                    const item = items[i] as HotspotItem
                    const source = interactives[i] as WorldObject

                    if (source.href === undefined) {
                        expect(item.href).toBeUndefined()
                    } else {
                        expect(item.href).toBe(source.href)
                    }
                }
            }),
            { numRuns: NUM_RUNS },
        )
    })

    it('explicit example: href absent → item.href is undefined (button render path)', () => {
        const o = createWorldObject(
            {
                id: 'a',
                gx: 0,
                gy: 0,
                footprint: { w: 1, d: 1 },
                assetKey: 'k',
                ariaLabel: 'Square',
            },
            GRID,
        )
        const scene: WorldScene = {
            grid: {
                tileWidth: 64,
                tileHeight: 32,
                cols: GRID_COLS,
                rows: GRID_ROWS,
            },
            terrain: [],
            objects: [o],
            canvasAriaLabel: 'test scene',
        }
        const items = buildHotspotItems(scene)
        expect(items[0]?.href).toBeUndefined()
    })

    it('explicit example: href present → item.href preserved exactly (anchor render path)', () => {
        const o = createWorldObject(
            {
                id: 'a',
                gx: 0,
                gy: 0,
                footprint: { w: 1, d: 1 },
                assetKey: 'k',
                href: '/destination',
            },
            GRID,
        )
        const scene: WorldScene = {
            grid: {
                tileWidth: 64,
                tileHeight: 32,
                cols: GRID_COLS,
                rows: GRID_ROWS,
            },
            terrain: [],
            objects: [o],
            canvasAriaLabel: 'test scene',
        }
        const items = buildHotspotItems(scene)
        expect(items[0]?.href).toBe('/destination')
    })
})
