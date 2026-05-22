import { describe, expect, it } from 'vitest'

import {
    classifyShopItemState,
    type ClassifyShopItemInput,
    type ShopItem,
} from './classify-shop-item'

const baseItem: ShopItem = {
    id: 'fuxie-sky-outfit',
    price: 180,
}

function buildInput(overrides: Partial<ClassifyShopItemInput> = {}): ClassifyShopItemInput {
    return {
        item: overrides.item ?? baseItem,
        wallet: overrides.wallet ?? { fucoin: 200 },
        inventory: overrides.inventory ?? { ownedItemIds: [] },
        unlocks: overrides.unlocks ?? {},
        pendingRequests: overrides.pendingRequests ?? [],
    }
}

describe('classifyShopItemState — truth table for the boolean lattice (design §I.6 / Property 16)', () => {
    it('returns "affordable" when no gate, not owned, not pending, and wallet ≥ price', () => {
        const state = classifyShopItemState(buildInput({
            wallet: { fucoin: 200 },
            item: { id: 'item', price: 180 },
        }))
        expect(state).toBe('affordable')
    })

    it('returns "affordable" at the exact price boundary (wallet === price)', () => {
        const state = classifyShopItemState(buildInput({
            wallet: { fucoin: 180 },
            item: { id: 'item', price: 180 },
        }))
        expect(state).toBe('affordable')
    })

    it('returns "unaffordable" when no gate, not owned, not pending, and wallet < price', () => {
        const state = classifyShopItemState(buildInput({
            wallet: { fucoin: 50 },
            item: { id: 'item', price: 180 },
        }))
        expect(state).toBe('unaffordable')
    })

    it('returns "owned" when the learner already has the item, regardless of price/wallet', () => {
        const state = classifyShopItemState(buildInput({
            wallet: { fucoin: 0 },
            inventory: { ownedItemIds: ['fuxie-sky-outfit'] },
        }))
        expect(state).toBe('owned')
    })

    it('returns "pending" when a redeem request is in flight and the item is not owned', () => {
        const state = classifyShopItemState(buildInput({
            wallet: { fucoin: 200 },
            pendingRequests: [{ itemId: 'fuxie-sky-outfit' }],
        }))
        expect(state).toBe('pending')
    })

    it('returns "locked" when an unlock condition (minLevel) is unsatisfied', () => {
        const state = classifyShopItemState(buildInput({
            item: {
                id: 'mocktest-unlock',
                price: 300,
                unlock: { minLevel: 5 },
            },
            wallet: { fucoin: 9999 },
            unlocks: { level: 3 },
        }))
        expect(state).toBe('locked')
    })

    // Priority guarantees: locked > owned > pending > affordable/unaffordable.

    it('prioritises "locked" over "owned" when both apply', () => {
        const state = classifyShopItemState(buildInput({
            item: {
                id: 'fuxie-sky-outfit',
                price: 180,
                unlock: { minStreak: 30 },
            },
            inventory: { ownedItemIds: ['fuxie-sky-outfit'] },
            unlocks: { streak: 2 },
        }))
        expect(state).toBe('locked')
    })

    it('prioritises "owned" over "pending" when both apply', () => {
        const state = classifyShopItemState(buildInput({
            inventory: { ownedItemIds: ['fuxie-sky-outfit'] },
            pendingRequests: [{ itemId: 'fuxie-sky-outfit' }],
        }))
        expect(state).toBe('owned')
    })

    it('prioritises "pending" over affordability when both apply', () => {
        const state = classifyShopItemState(buildInput({
            wallet: { fucoin: 9999 },
            pendingRequests: [{ itemId: 'fuxie-sky-outfit' }],
        }))
        expect(state).toBe('pending')
    })

    it('treats missing unlock field as no gate (returns affordable when balance suffices)', () => {
        const state = classifyShopItemState(buildInput({
            item: { id: 'no-gate', price: 100 },
            wallet: { fucoin: 100 },
        }))
        expect(state).toBe('affordable')
    })

    it('locks when any required badge is missing even if level and streak satisfy', () => {
        const state = classifyShopItemState(buildInput({
            item: {
                id: 'badge-gated',
                price: 100,
                unlock: {
                    minLevel: 2,
                    minStreak: 3,
                    requiredBadges: ['cefr-a2', 'streak-7'],
                },
            },
            wallet: { fucoin: 9999 },
            unlocks: {
                level: 5,
                streak: 30,
                badges: ['cefr-a2'],
            },
        }))
        expect(state).toBe('locked')
    })
})
