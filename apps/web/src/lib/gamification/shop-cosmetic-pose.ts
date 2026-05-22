/**
 * Pure mapping from "currently equipped cosmetic itemId" → mascot pose
 * key (a member of `FUXIE_MASCOT_STATES`) used by the rewards-shop
 * surface.
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: Gamification Designer (cosmetic ↔ pose mapping)
 *
 * Spec source-of-truth:
 *   - Task 13.3 (gamified-ui-asset-rollout)
 *   - design.md §B (Mascot_Role system), §I.6 (Shop / Inventory)
 *   - requirements.md Req 8.9 — "When learner equip một item từ Inventory,
 *     THE Shop_Surface SHALL cập nhật mascot hiển thị item đó trong vòng
 *     1 giây."
 *
 * Why a pure helper:
 *   The mascot resolution must be deterministic so the test environment
 *   can assert that equipping a cosmetic produces a different mascot
 *   asset than the unequipped baseline (the task acceptance: "mascot diff
 *   after equip"). Resolving via `getFuxieMascotSrc` against this table
 *   guarantees identical inputs ⇒ identical outputs without needing a
 *   DOM.
 *
 * Mapping rules:
 *   - Default (nothing equipped) → `shopApproval` — the canonical
 *     `companion` pose for `surfaceId="rewards-shop"` declared in
 *     `pickMascotPoseKey`.
 *   - Each cosmetic id maps to a distinct `FuxieMascotState` whose
 *     resolved `getFuxieMascotSrc` path differs from the default. The
 *     React component renders the result through `MascotRoleHost`'s
 *     `role="companion"` channel so the role contract is preserved
 *     (Req 12.4); only the pose asset changes.
 *
 * Validates: Requirement 8.9
 */

import { FUXIE_MASCOT_STATES, type FuxieMascotState } from '@/lib/mascot/fuxie-assets'

/** The default companion pose used when no cosmetic is equipped. */
export const DEFAULT_SHOP_COMPANION_POSE: FuxieMascotState = 'shopApproval'

/**
 * Per-cosmetic pose override. Keys are catalog `itemId`s; values must be
 * `FuxieMascotState` keys whose resolved path differs from
 * {@link DEFAULT_SHOP_COMPANION_POSE} so equipping produces a visible
 * mascot diff (Req 8.9). Items missing from this table fall back to the
 * default pose so unrecognised cosmetic ids never crash the surface.
 */
export const SHOP_COSMETIC_POSE_OVERRIDES: Readonly<Record<string, FuxieMascotState>> = {
    // The Sky Outfit cosmetic flips Fuxie into the "result celebration"
    // pose — distinct asset path, distinct vibe (the outfit is the brand
    // celebratory cosmetic per design §F).
    'fuxie-sky-outfit': 'resultCelebration',
}

/**
 * Resolve the mascot pose key the shop should render based on the
 * currently equipped cosmetic item. `null`/`undefined` ⇒ default pose.
 *
 * Pure: identical inputs ⇒ identical output, no IO.
 *
 * Validates: Requirement 8.9
 */
export function pickShopMascotPose(
    equippedItemId: string | null | undefined,
): FuxieMascotState {
    if (!equippedItemId) {
        return DEFAULT_SHOP_COMPANION_POSE
    }
    return SHOP_COSMETIC_POSE_OVERRIDES[equippedItemId] ?? DEFAULT_SHOP_COMPANION_POSE
}

/**
 * Internal: resolve the pose key to its asset path. Useful for tests
 * that want to assert "the asset path differs after equip" without
 * coupling to a specific pose name.
 */
export function resolveShopMascotAssetPath(
    equippedItemId: string | null | undefined,
): string {
    const poseKey = pickShopMascotPose(equippedItemId)
    return FUXIE_MASCOT_STATES[poseKey]
}
