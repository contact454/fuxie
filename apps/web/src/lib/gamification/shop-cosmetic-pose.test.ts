import { describe, expect, it } from 'vitest'

import { FUXIE_MASCOT_STATES } from '@/lib/mascot/fuxie-assets'

import {
    DEFAULT_SHOP_COMPANION_POSE,
    SHOP_COSMETIC_POSE_OVERRIDES,
    pickShopMascotPose,
    resolveShopMascotAssetPath,
} from './shop-cosmetic-pose'

/**
 * Co-located unit tests for the shop cosmetic-pose mapping.
 *
 * Why pure-helper tests:
 *   Task 13.3 requires "equipping updates mascot within 1 second" with the
 *   acceptance "mascot diff after equip" (Req 8.9). The React component
 *   resolves the new pose synchronously from `pickShopMascotPose`, so the
 *   "diff after equip" contract is fully captured by asserting that
 *   `resolveShopMascotAssetPath(equippedId) ≠ resolveShopMascotAssetPath(null)`
 *   for every override entry. No DOM is required.
 *
 * Validates: Requirement 8.9
 */

describe('pickShopMascotPose — Req 8.9 (equip → mascot diff)', () => {
    it('returns the default companion pose when nothing is equipped', () => {
        expect(pickShopMascotPose(null)).toBe(DEFAULT_SHOP_COMPANION_POSE)
        expect(pickShopMascotPose(undefined)).toBe(DEFAULT_SHOP_COMPANION_POSE)
    })

    it('falls back to the default pose for unknown cosmetic ids', () => {
        expect(pickShopMascotPose('unknown-cosmetic')).toBe(
            DEFAULT_SHOP_COMPANION_POSE,
        )
    })

    it('every override resolves to a different mascot asset path than the default', () => {
        const baselinePath = resolveShopMascotAssetPath(null)
        for (const [itemId, poseKey] of Object.entries(SHOP_COSMETIC_POSE_OVERRIDES)) {
            expect(
                pickShopMascotPose(itemId),
                `override for "${itemId}" must map to "${poseKey}"`,
            ).toBe(poseKey)
            const equippedPath = resolveShopMascotAssetPath(itemId)
            expect(
                equippedPath,
                `mascot diff after equipping "${itemId}" — path must change`,
            ).not.toBe(baselinePath)
            expect(equippedPath).toBe(FUXIE_MASCOT_STATES[poseKey])
        }
    })

    it('the Sky Outfit cosmetic is mapped (the canonical equip example for Req 8.9)', () => {
        expect(SHOP_COSMETIC_POSE_OVERRIDES['fuxie-sky-outfit']).toBeDefined()
        expect(resolveShopMascotAssetPath('fuxie-sky-outfit')).not.toBe(
            resolveShopMascotAssetPath(null),
        )
    })

    it('is referentially stable for identical inputs (pure mapping)', () => {
        expect(pickShopMascotPose('fuxie-sky-outfit')).toBe(
            pickShopMascotPose('fuxie-sky-outfit'),
        )
    })
})
