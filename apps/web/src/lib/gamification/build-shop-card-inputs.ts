/**
 * Pure adapter that maps the server-side shop data shape onto the
 * `ClassifyShopItemInput` lattice used by `classifyShopItemState`.
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: Gamification Designer (state semantics)
 *
 * Spec source-of-truth:
 *   - Task 13.2 (gamified-ui-asset-rollout)
 *   - design.md §I.6 (Shop / Inventory)
 *   - requirements.md Req 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 *
 * Why this exists:
 *   The shop page receives a `FuxieShopCatalogItem[]` from the server, plus
 *   a list of recent redeem requests and the reward inventory snapshot. The
 *   backbone client classifies each card via `classifyShopItemState`, which
 *   takes a normalized `ClassifyShopItemInput`. Rather than build that input
 *   inline in the React tree (and re-derive it on every render or every
 *   pending-state mutation), the mapping is split out so it can be unit
 *   tested without a DOM and reused if other surfaces (mission board shop
 *   preview, dashboard) want the same lattice.
 *
 * Validates: Requirements 8.2, 8.3, 8.4, 8.5, 8.6
 */

import {
    classifyShopItemState,
    type ClassifyShopItemInput,
    type ShopItem,
    type ShopItemState,
    type UnlockRequirement,
} from './classify-shop-item'
import type { FuxieShopCatalogItem } from './shop'

export interface ShopCardInputSource {
    /** All catalog items the page received from the server. */
    catalog: ReadonlyArray<FuxieShopCatalogItem>
    /** Wallet snapshot in Fucoin. */
    walletFucoin: number
    /**
     * Item ids the learner already owns (fulfilled redeems, granted
     * cosmetics, etc.). Production source: server-side inventory query.
     */
    ownedItemIds: ReadonlyArray<string>
    /**
     * Item ids with an in-flight redeem request. Production sources include
     * any `recentRequests` row whose `status === 'PENDING'`, plus any client
     * id added optimistically by the redeem submit handler.
     */
    pendingItemIds: ReadonlyArray<string>
    /** Optional unlock context (level / streak / badges). */
    unlocks?: {
        level?: number
        streak?: number
        badges?: ReadonlyArray<string>
    }
}

/**
 * Classification result paired with its source catalog item, ready for
 * rendering by the shop card grid.
 */
export interface ClassifiedShopCard {
    item: FuxieShopCatalogItem
    state: ShopItemState
    /**
     * Number of Fucoin still needed to reach `item.cost`. Always
     * `>= 0`. For non-`unaffordable` states this is `0` so the consumer can
     * render the hint conditionally without re-deriving the math.
     */
    missingFucoin: number
}

/**
 * Translate a `FuxieShopCatalogItem` into the minimal `ShopItem` shape
 * understood by `classifyShopItemState`.
 *
 * Mapping rules:
 *  - `id` and `cost → price` carry over.
 *  - `status === 'preview_locked'` (e.g. real-gift items) becomes a
 *    permanent unlock gate so the card classifies as `locked`. We model it
 *    via a synthetic badge requirement that can never be satisfied through
 *    the unlock context, which keeps `classifyShopItemState` pure.
 *
 * Validates: Requirement 8.2
 */
export function toShopItem(catalogItem: FuxieShopCatalogItem): ShopItem {
    const isPreviewLocked = catalogItem.status === 'preview_locked'

    const unlock: UnlockRequirement | undefined = isPreviewLocked
        ? {
              // Synthetic badge that no learner has — keeps the item locked
              // until the catalog flips it to `requestable`.
              requiredBadges: ['__shop:preview-locked'],
          }
        : undefined

    return {
        id: catalogItem.id,
        price: Math.max(0, Math.floor(catalogItem.cost)),
        unlock,
    }
}

/**
 * Build the per-card classification input for every item in the catalog.
 *
 * Pure: identical inputs ⇒ identical outputs, no IO, no mutation.
 */
export function buildShopCardInputs(source: ShopCardInputSource): ClassifyShopItemInput[] {
    const ownedSet = new Set(source.ownedItemIds)
    const pendingSet = new Set(source.pendingItemIds)
    const wallet = { fucoin: clampWalletForDisplay(source.walletFucoin) }
    const inventory = {
        ownedItemIds: Array.from(ownedSet),
    }
    const unlocks = {
        level: source.unlocks?.level,
        streak: source.unlocks?.streak,
        badges: source.unlocks?.badges,
    }
    const pendingRequests = Array.from(pendingSet).map((itemId) => ({ itemId }))

    return source.catalog.map((catalogItem) => ({
        item: toShopItem(catalogItem),
        wallet,
        inventory,
        unlocks,
        pendingRequests,
    }))
}

/**
 * Convenience that pairs each catalog item with its classified state and
 * the missing-Fucoin delta. The shop UI renders directly off this list.
 */
export function classifyShopCards(source: ShopCardInputSource): ClassifiedShopCard[] {
    const inputs = buildShopCardInputs(source)
    return source.catalog.map((catalogItem, index) => {
        const classification = classifyShopItemState(inputs[index]!)
        const missingFucoin =
            classification === 'unaffordable'
                ? Math.max(
                      0,
                      Math.floor(catalogItem.cost) - clampWalletForDisplay(source.walletFucoin),
                  )
                : 0
        return {
            item: catalogItem,
            state: classification,
            missingFucoin,
        }
    })
}

/** Req 8.1 — wallet displays clamp to the inclusive range 0..9_999_999. */
export const WALLET_DISPLAY_MIN = 0
export const WALLET_DISPLAY_MAX = 9_999_999

/**
 * Saturate a wallet value to the documented display range so the UI can
 * never show a negative or overflowing balance even if the upstream API
 * returns garbage.
 *
 * Validates: Requirement 8.1
 */
export function clampWalletForDisplay(value: number): number {
    if (!Number.isFinite(value)) {
        return WALLET_DISPLAY_MIN
    }
    const floored = Math.floor(value)
    if (floored < WALLET_DISPLAY_MIN) return WALLET_DISPLAY_MIN
    if (floored > WALLET_DISPLAY_MAX) return WALLET_DISPLAY_MAX
    return floored
}
