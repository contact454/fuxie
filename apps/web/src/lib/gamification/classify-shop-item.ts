/**
 * Pure shop-item state classifier.
 *
 * Implements the boolean lattice from gamified-ui-asset-rollout design §I.6
 * (and Property 16) so every consumer of the shop UI agrees on the visual
 * state of an item without re-deriving it.
 *
 * Lattice (priority highest → lowest):
 *   locked       ⇔ unlocks_unsatisfied(item)
 *   owned        ⇔ ¬locked ∧ inventory.contains(item)
 *   pending      ⇔ ¬locked ∧ ¬owned ∧ pendingRequests.contains(item)
 *   affordable   ⇔ ¬locked ∧ ¬owned ∧ ¬pending ∧ wallet.fucoin ≥ item.price
 *   unaffordable ⇔ ¬locked ∧ ¬owned ∧ ¬pending ∧ wallet.fucoin < item.price
 *
 * Validates: Requirement 8.2.
 */

export type ShopItemState =
    | 'affordable'
    | 'unaffordable'
    | 'owned'
    | 'pending'
    | 'locked'

export interface ShopItem {
    id: string
    /** Price in Fucoin. Non-negative integer. */
    price: number
    /** Optional unlock requirements (level, streak, badges). Empty/absent ⇒ no gate. */
    unlock?: UnlockRequirement
}

/**
 * Optional gating conditions an item may declare. Any non-null field that the
 * provided UnlockSet does not satisfy puts the item into `locked`.
 */
export interface UnlockRequirement {
    /** Minimum learner level required. */
    minLevel?: number
    /** Minimum current streak (days) required. */
    minStreak?: number
    /** Badges that must all be present in `unlocks.badges`. */
    requiredBadges?: ReadonlyArray<string>
}

export interface Wallet {
    /** Current Fucoin balance. Non-negative integer expected. */
    fucoin: number
}

export interface Inventory {
    /** Item ids the learner already owns. */
    ownedItemIds: ReadonlyArray<string>
}

export interface UnlockSet {
    /** Current learner level (e.g. XP-derived). */
    level?: number
    /** Current consecutive-day streak. */
    streak?: number
    /** Badges/achievements the learner has earned. */
    badges?: ReadonlyArray<string>
}

export interface PendingRequest {
    itemId: string
}

export interface ClassifyShopItemInput {
    item: ShopItem
    wallet: Wallet
    inventory: Inventory
    unlocks: UnlockSet
    pendingRequests: ReadonlyArray<PendingRequest>
}

/**
 * Classify a shop item into exactly one of the five states.
 *
 * Pure: identical inputs always produce identical output, no IO, no mutation.
 */
export function classifyShopItemState(input: ClassifyShopItemInput): ShopItemState {
    const { item, wallet, inventory, unlocks, pendingRequests } = input

    if (isLocked(item, unlocks)) {
        return 'locked'
    }

    if (inventory.ownedItemIds.includes(item.id)) {
        return 'owned'
    }

    if (pendingRequests.some((request) => request.itemId === item.id)) {
        return 'pending'
    }

    return wallet.fucoin >= item.price ? 'affordable' : 'unaffordable'
}

function isLocked(item: ShopItem, unlocks: UnlockSet): boolean {
    const requirement = item.unlock
    if (!requirement) {
        return false
    }

    if (typeof requirement.minLevel === 'number') {
        const level = unlocks.level ?? 0
        if (level < requirement.minLevel) {
            return true
        }
    }

    if (typeof requirement.minStreak === 'number') {
        const streak = unlocks.streak ?? 0
        if (streak < requirement.minStreak) {
            return true
        }
    }

    if (requirement.requiredBadges && requirement.requiredBadges.length > 0) {
        const earned = unlocks.badges ?? []
        const earnedSet = new Set(earned)
        for (const badge of requirement.requiredBadges) {
            if (!earnedSet.has(badge)) {
                return true
            }
        }
    }

    return false
}
