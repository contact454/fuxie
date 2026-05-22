// Feature: fuxie-learning-world-lab-v0, Task 12.2: buildLabScene unit test
//
// Vai chinh: QA Automation Engineer
// Vai phoi hop: Frontend Engineer
//
// Spec ref: `.kiro/specs/fuxie-learning-world-lab-v0/requirements.md`
// Requirement 1.3 (6 required World_Object categories present)
// Requirement 1.6 (review garden included iff registry exposes 'reviewGarden')
// Requirement 1.8 (no other optional named object beyond review garden)
//
// This file exercises the pure scene builder implemented in
// `apps/web/src/app/fuxie-world-lab/lab-scene.ts`. It is a unit test
// (per the task description), not a property test, so we use plain
// vitest assertions and call `buildLabScene()` exactly once.
//
// The test plan mirrors the task spec for 12.2:
//
//   1. Each of the 6 required slots is present at the documented
//      `(gx, gy)` and footprint `(w, d)`:
//        villageSquare    (3, 3) (2, 2)
//        courseSignpost   (1, 4) (1, 1)
//        library          (5, 1) (2, 2)
//        radioBooth       (1, 6) (2, 2)
//        postOffice       (5, 5) (2, 2)
//        marketStall      (4, 7) (2, 1)
//      and the optional 7th slot, when included, is exactly:
//        reviewGarden     (7, 4) (1, 2)
//
//   2. Review garden inclusion is gated on `'reviewGarden' in
//      FUXIE_WORLD_PROPS`. No other optional named object is ever
//      included (the set of object ids is exactly the 6 required ids,
//      plus reviewGarden iff the registry exposes the key).
//
//   3. Every `assetKey` carried by the scene resolves through
//      `getFuxieWorldPropSrc` to a non-empty `/`-prefixed string. The
//      registry helper is total (unknown keys fall through to the
//      placeholder), so we don't pin an exact URL — only the contract
//      that resolution always produces a usable public path.
//
// Validates: Requirements 1.3, 1.6, 1.8.

import { describe, expect, it } from 'vitest'

import { buildLabScene } from '@/app/fuxie-world-lab/lab-scene'
import {
    FUXIE_WORLD_PROPS,
    getFuxieWorldPropSrc,
} from '@/lib/mascot/fuxie-assets'

/** Documented blueprint for the 6 required slots (design.md → lab-scene). */
const REQUIRED_SLOTS = [
    { id: 'villageSquare', gx: 3, gy: 3, w: 2, d: 2 },
    { id: 'courseSignpost', gx: 1, gy: 4, w: 1, d: 1 },
    { id: 'library', gx: 5, gy: 1, w: 2, d: 2 },
    { id: 'radioBooth', gx: 1, gy: 6, w: 2, d: 2 },
    { id: 'postOffice', gx: 5, gy: 5, w: 2, d: 2 },
    { id: 'marketStall', gx: 4, gy: 7, w: 2, d: 1 },
] as const

const REVIEW_GARDEN_SLOT = {
    id: 'reviewGarden',
    gx: 7,
    gy: 4,
    w: 1,
    d: 2,
} as const

describe('buildLabScene', () => {
    // Build once: the function is pure and returns a fresh scene each
    // call, but a single build is enough to verify the structural
    // invariants the task asks us to assert.
    const scene = buildLabScene()

    describe('scene metadata', () => {
        it('uses the documented 10x10 grid configuration', () => {
            expect(scene.grid).toEqual({
                tileWidth: 64,
                tileHeight: 32,
                cols: 10,
                rows: 10,
            })
        })

        it('uses the documented camera bounds', () => {
            expect(scene.camera).toEqual({
                minZoom: 0.5,
                maxZoom: 2.0,
                initialZoom: 1.0,
            })
        })

        it('ships zero terrain entries in V0', () => {
            expect(scene.terrain).toEqual([])
        })

        it('sets the canvas accessible name', () => {
            expect(scene.canvasAriaLabel).toBe(
                'Fuxie Learning World preview scene',
            )
        })
    })

    describe('Requirement 1.3: 6 required World_Object slots present', () => {
        for (const slot of REQUIRED_SLOTS) {
            it(`includes "${slot.id}" at (${slot.gx}, ${slot.gy}) with footprint (${slot.w}, ${slot.d})`, () => {
                const obj = scene.objects.find((o) => o.id === slot.id)
                expect(obj, `expected object id="${slot.id}" in scene`).toBeDefined()
                if (!obj) return // narrow for TS; the assertion above already failed
                expect(obj.gx).toBe(slot.gx)
                expect(obj.gy).toBe(slot.gy)
                expect(obj.footprint.w).toBe(slot.w)
                expect(obj.footprint.d).toBe(slot.d)
            })
        }
    })

    describe('Requirement 1.6 + 1.8: optional review garden gating', () => {
        const hasReviewGardenKey = 'reviewGarden' in FUXIE_WORLD_PROPS

        it('includes review garden iff `reviewGarden` is in FUXIE_WORLD_PROPS', () => {
            const gardenObj = scene.objects.find(
                (o) => o.id === REVIEW_GARDEN_SLOT.id,
            )
            if (hasReviewGardenKey) {
                expect(
                    gardenObj,
                    'review garden key is present in the registry; the scene must include it',
                ).toBeDefined()
                if (!gardenObj) return
                expect(gardenObj.gx).toBe(REVIEW_GARDEN_SLOT.gx)
                expect(gardenObj.gy).toBe(REVIEW_GARDEN_SLOT.gy)
                expect(gardenObj.footprint.w).toBe(REVIEW_GARDEN_SLOT.w)
                expect(gardenObj.footprint.d).toBe(REVIEW_GARDEN_SLOT.d)
            } else {
                expect(
                    gardenObj,
                    'review garden key is absent from the registry; the scene must not include it',
                ).toBeUndefined()
            }
        })

        it('contains exactly 6 required slots plus the optional review garden when gated in', () => {
            const expectedCount = 6 + (hasReviewGardenKey ? 1 : 0)
            expect(scene.objects.length).toBe(expectedCount)
        })

        it('contains no optional named object beyond the review garden', () => {
            const allowedIds = new Set<string>([
                ...REQUIRED_SLOTS.map((s) => s.id),
                REVIEW_GARDEN_SLOT.id,
            ])
            const unexpected = scene.objects
                .map((o) => o.id)
                .filter((id) => !allowedIds.has(id))
            expect(
                unexpected,
                `scene must not include any optional named object beyond the documented 6 + 1; found: ${unexpected.join(', ')}`,
            ).toEqual([])
        })
    })

    describe('every assetKey resolves via getFuxieWorldPropSrc', () => {
        // Iterate the exact objects the scene exposes; the resolver is
        // total so this should never throw and should always yield a
        // non-empty `/`-prefixed public path (even when a key would fall
        // through to PLACEHOLDER_ASSET).
        for (const slot of REQUIRED_SLOTS) {
            it(`resolves the assetKey for "${slot.id}" to a non-empty /-prefixed path`, () => {
                const obj = scene.objects.find((o) => o.id === slot.id)
                expect(obj).toBeDefined()
                if (!obj) return
                const src = getFuxieWorldPropSrc(obj.assetKey)
                expect(typeof src).toBe('string')
                expect(src.length).toBeGreaterThan(0)
                expect(src.startsWith('/')).toBe(true)
            })
        }

        it('resolves every scene object including the optional review garden', () => {
            for (const obj of scene.objects) {
                const src = getFuxieWorldPropSrc(obj.assetKey)
                expect(typeof src).toBe('string')
                expect(src.length).toBeGreaterThan(0)
                expect(src.startsWith('/')).toBe(true)
            }
        })
    })
})
