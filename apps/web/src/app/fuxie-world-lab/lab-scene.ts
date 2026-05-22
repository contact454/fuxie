/**
 * Original Fuxie code (no Mykonos lift). Composes the V0 demo `WorldScene`
 * for the internal `/fuxie-world-lab` route from the existing
 * `Fuxie_Asset_Registry`.
 *
 * Read-only consumer of `@/lib/mascot/fuxie-assets` and
 * `@/lib/mascot/fuxie-world-tags`; this file does not modify either source.
 *
 * Validates: Requirements 1.3, 1.4, 1.5, 1.6, 1.8.
 *
 * Scope notes:
 * - The 6 required slots (village square, course signpost, library, radio
 *   booth, post office, market) are always present (Requirement 1.3).
 * - The optional review garden is included iff `'reviewGarden' in
 *   FUXIE_WORLD_PROPS` (Requirement 1.6); no other optional named object is
 *   ever included in V0 (Requirement 1.8).
 * - Every `WorldObject` is built via `createWorldObject(input, grid)` so
 *   field-shape (`INVALID_OBJECT`) and grid-bounds (`OUT_OF_BOUNDS`) errors
 *   surface at scene-build time, not at paint time.
 * - Asset resolution is total: `getFuxieWorldPropSrc` falls through to a
 *   placeholder for unknown keys, so even a registry rename keeps the
 *   scene mountable (Requirement 1.5).
 *
 * Owner: Frontend Engineer.
 * Co-author: CTO / Tech Lead (architecture review).
 */

import {
    createWorldObject,
    IsoGrid,
    type WorldObject,
    type WorldScene,
} from '@/lib/learning-world'
import {
    FUXIE_WORLD_PROPS,
    getFuxieWorldPropSrc,
} from '@/lib/mascot/fuxie-assets'
import { pickWorldProp } from '@/lib/mascot/fuxie-world-tags'

/**
 * Static grid metadata for the V0 demo scene. 10×10 cells with 64×32 tiles
 * matches the design document's documented configuration.
 */
const GRID_CONFIG = {
    tileWidth: 64,
    tileHeight: 32,
    cols: 10,
    rows: 10,
} as const

/**
 * Camera bounds for the V0 demo scene. `initialZoom` is reserved for the
 * React wrapper; the core `CameraConfig` accepts it as an optional hint.
 */
const CAMERA_CONFIG = {
    minZoom: 0.5,
    maxZoom: 2.0,
    initialZoom: 1.0,
} as const

/**
 * Slot blueprints for the 6 required `WorldObject`s. The `(gx, gy)` and
 * footprint values are the documented design choices (design.md →
 * Components → `lab-scene.ts`). Asset keys are resolved via
 * `pickWorldProp` so the table is robust to additions to the registry.
 */
const REQUIRED_SLOTS = [
    {
        id: 'villageSquare',
        gx: 3,
        gy: 3,
        w: 2,
        d: 2,
        ariaLabel: 'Village square',
        href: '/fuxie-world-lab#village-square',
        tags: ['village', 'plaza'] as const,
    },
    {
        id: 'courseSignpost',
        gx: 1,
        gy: 4,
        w: 1,
        d: 1,
        ariaLabel: 'Course signpost',
        href: '/fuxie-world-lab#course',
        tags: ['signpost', 'path'] as const,
    },
    {
        id: 'library',
        gx: 5,
        gy: 1,
        w: 2,
        d: 2,
        ariaLabel: 'Library',
        href: '/fuxie-world-lab#library',
        tags: ['library'] as const,
    },
    {
        id: 'radioBooth',
        gx: 1,
        gy: 6,
        w: 2,
        d: 2,
        ariaLabel: 'Radio booth',
        href: '/fuxie-world-lab#radio',
        tags: ['radio', 'studio'] as const,
    },
    {
        id: 'postOffice',
        gx: 5,
        gy: 5,
        w: 2,
        d: 2,
        ariaLabel: 'Post office',
        href: '/fuxie-world-lab#post-office',
        tags: ['desk', 'workshop'] as const,
    },
    {
        id: 'marketStall',
        gx: 4,
        gy: 7,
        w: 2,
        d: 1,
        ariaLabel: 'Market',
        href: '/fuxie-world-lab#market',
        tags: ['market', 'shop'] as const,
    },
] as const

/**
 * Optional 7th slot — review garden. Included iff the registry exposes the
 * `reviewGarden` key (Requirement 1.6). The slot is never silently swapped
 * for any other optional named object (Requirement 1.8).
 */
const REVIEW_GARDEN_SLOT = {
    id: 'reviewGarden',
    gx: 7,
    gy: 4,
    w: 1,
    d: 2,
    ariaLabel: 'Review garden',
    href: '/fuxie-world-lab#review',
    tags: ['garden', 'review'] as const,
} as const

/**
 * Build the V0 demo `WorldScene`. Pure: returns a fresh scene each call,
 * does not read or mutate any global state, and performs no I/O.
 *
 * @returns A fully validated `WorldScene` ready to hand to
 *   `LearningWorldCanvas`. Field-shape and grid-bounds errors throw a
 *   `LearningWorldError` at this call site, which is intentional: the
 *   server component fails fast on a misconfigured demo scene.
 */
export function buildLabScene(): WorldScene {
    // Construct the IsoGrid up front so every WorldObject is validated
    // against the same grid the React wrapper will reconstruct from
    // `scene.grid` at hydration time.
    const grid = new IsoGrid(GRID_CONFIG)

    const objects: WorldObject[] = REQUIRED_SLOTS.map((slot) => {
        // pickWorldProp returns a FuxieWorldProp key; getFuxieWorldPropSrc
        // is consulted at paint time by the React layer, so we keep the
        // string key as the assetKey here. The asset resolver (used in
        // tests + the React layer) is total and falls through to a
        // placeholder if the registry key vanishes (Requirement 1.5).
        const assetKey = pickWorldProp([...slot.tags])
        return createWorldObject(
            {
                id: slot.id,
                gx: slot.gx,
                gy: slot.gy,
                footprint: { w: slot.w, d: slot.d },
                assetKey,
                ariaLabel: slot.ariaLabel,
                href: slot.href,
            },
            grid,
        )
    })

    // Optional 7th slot. The `'reviewGarden' in FUXIE_WORLD_PROPS` guard
    // is required so a future asset-registry cleanup that drops the key
    // does not crash the lab; the rest of the scene continues to mount.
    if ('reviewGarden' in FUXIE_WORLD_PROPS) {
        const assetKey = pickWorldProp([...REVIEW_GARDEN_SLOT.tags])
        objects.push(
            createWorldObject(
                {
                    id: REVIEW_GARDEN_SLOT.id,
                    gx: REVIEW_GARDEN_SLOT.gx,
                    gy: REVIEW_GARDEN_SLOT.gy,
                    footprint: {
                        w: REVIEW_GARDEN_SLOT.w,
                        d: REVIEW_GARDEN_SLOT.d,
                    },
                    assetKey,
                    ariaLabel: REVIEW_GARDEN_SLOT.ariaLabel,
                    href: REVIEW_GARDEN_SLOT.href,
                },
                grid,
            ),
        )
    }

    return {
        grid: GRID_CONFIG,
        camera: CAMERA_CONFIG,
        terrain: [],
        objects,
        canvasAriaLabel: 'Fuxie Learning World preview scene',
    }
}

/**
 * Resolve a scene's `assetKey` to a public path. Thin re-export of the
 * registry helper so the React layer can resolve assets without importing
 * `@/lib/mascot/fuxie-assets` directly.
 *
 * Total: unknown keys fall through to the registry's placeholder asset, so
 * the scene continues to mount even when a key is absent (Requirement 1.5).
 */
export function resolveLabAssetSrc(assetKey: string): string {
    return getFuxieWorldPropSrc(assetKey)
}

/**
 * Build a plain `Record<assetKey, url>` for every `assetKey` referenced by
 * the V0 demo scene. Plain data — JSON-serializable — so it can be passed
 * across the Next.js Server Component → Client Component boundary as a
 * prop. The lab page calls this server-side and hands the result to
 * `LearningWorldCanvas`, which converts it back into an `(assetKey) => url`
 * resolver for the internal image loader.
 *
 * Uses `getFuxieWorldPropSrc` so unknown keys fall through to the
 * placeholder; the scene remains mountable across registry renames
 * (Requirement 1.5).
 */
export function buildLabAssetSrcMap(
    scene: WorldScene,
): Readonly<Record<string, string>> {
    const map: Record<string, string> = {}
    for (const o of scene.objects) {
        if (typeof o.assetKey !== 'string' || o.assetKey.length === 0) continue
        if (o.assetKey in map) continue
        map[o.assetKey] = getFuxieWorldPropSrc(o.assetKey)
    }
    return map
}
