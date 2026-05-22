/**
 * Shop Item State Classification — Property-Based Tests (task 13.4 of spec
 * `gamified-ui-asset-rollout`).
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: Gamification Designer, QA Automation Engineer
 *
 * Property wired in this file:
 *
 *   - Property 16 (task 13.4) — Shop Item State Classification
 *     For any tuple `(item, wallet, inventory, unlocks, pendingRequests)`,
 *     `classifyShopItemState(...)` returns exactly one state from the
 *     closed set `{affordable, unaffordable, owned, pending, locked}`
 *     and matches the boolean lattice in design §I.6:
 *
 *         locked       ⇔ unlocks_unsatisfied(item)
 *         owned        ⇔ ¬locked ∧ inventory.contains(item)
 *         pending      ⇔ ¬locked ∧ ¬owned ∧ pendingRequests.contains(item)
 *         affordable   ⇔ ¬locked ∧ ¬owned ∧ ¬pending ∧ wallet.fucoin ≥ item.price
 *         unaffordable ⇔ ¬locked ∧ ¬owned ∧ ¬pending ∧ wallet.fucoin < item.price
 *
 *     The priority chain (locked > owned > pending > affordable/unaffordable)
 *     is exercised by generators that intentionally satisfy multiple
 *     conditions at once.
 *
 *     Validates: Requirements 8.2, 8.3, 8.4, 8.5, 8.6.
 *
 * Test framework: Vitest + fast-check (`numRuns: 100` per task brief).
 * Sources the classifier via the relative `../apps/web/src/...` path —
 * same convention as `tests/asset-registry.spec.ts` — because the
 * root vitest config does not install the `@/...` path alias for
 * `tests/*.spec.ts`.
 */

import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import {
    classifyShopItemState,
    type ClassifyShopItemInput,
    type Inventory,
    type PendingRequest,
    type ShopItem,
    type ShopItemState,
    type UnlockRequirement,
    type UnlockSet,
    type Wallet,
} from '../apps/web/src/lib/gamification/classify-shop-item'

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

const NUM_RUNS = 100

/** Deterministic pool of item ids so collisions between item / inventory /
 * pending requests are non-trivially likely (lattice precedence coverage). */
const ITEM_ID_POOL = [
    'fuxie-sky-outfit',
    'fuxie-coach-hat',
    'sticker-cefr-a1',
    'streak-freezer',
    'mocktest-unlock-a2',
    'badge-festival',
    'inventory-prop',
    'cafe-roleplay-set',
] as const

const BADGE_POOL = [
    'cefr-a1',
    'cefr-a2',
    'cefr-b1',
    'streak-7',
    'streak-30',
    'mocktest-pass',
    'pilot-tester',
] as const

const itemIdArb = fc.constantFrom(...ITEM_ID_POOL)
const badgeArb = fc.constantFrom(...BADGE_POOL)

/** Arbitrary unlock requirement: each gate field is independently optional. */
const unlockRequirementArb: fc.Arbitrary<UnlockRequirement> = fc.record(
    {
        minLevel: fc.option(fc.integer({ min: 0, max: 50 }), { nil: undefined }),
        minStreak: fc.option(fc.integer({ min: 0, max: 365 }), { nil: undefined }),
        requiredBadges: fc.option(
            fc.uniqueArray(badgeArb, { minLength: 0, maxLength: 4 }),
            { nil: undefined },
        ),
    },
    { requiredKeys: [] },
)

const itemArb: fc.Arbitrary<ShopItem> = fc.record(
    {
        id: itemIdArb,
        price: fc.integer({ min: 0, max: 9_999_999 }),
        unlock: fc.option(unlockRequirementArb, { nil: undefined }),
    },
    { requiredKeys: ['id', 'price'] },
)

const walletArb: fc.Arbitrary<Wallet> = fc.record({
    fucoin: fc.integer({ min: 0, max: 9_999_999 }),
})

const inventoryArb: fc.Arbitrary<Inventory> = fc.record({
    ownedItemIds: fc.uniqueArray(itemIdArb, { minLength: 0, maxLength: ITEM_ID_POOL.length }),
})

const unlockSetArb: fc.Arbitrary<UnlockSet> = fc.record(
    {
        level: fc.option(fc.integer({ min: 0, max: 60 }), { nil: undefined }),
        streak: fc.option(fc.integer({ min: 0, max: 400 }), { nil: undefined }),
        badges: fc.option(
            fc.uniqueArray(badgeArb, { minLength: 0, maxLength: BADGE_POOL.length }),
            { nil: undefined },
        ),
    },
    { requiredKeys: [] },
)

const pendingRequestArb: fc.Arbitrary<PendingRequest> = fc.record({
    itemId: itemIdArb,
})

const pendingRequestsArb: fc.Arbitrary<ReadonlyArray<PendingRequest>> = fc.array(
    pendingRequestArb,
    { minLength: 0, maxLength: 6 },
)

const inputArb: fc.Arbitrary<ClassifyShopItemInput> = fc.record({
    item: itemArb,
    wallet: walletArb,
    inventory: inventoryArb,
    unlocks: unlockSetArb,
    pendingRequests: pendingRequestsArb,
})

// ---------------------------------------------------------------------------
// Reference oracle — re-derives the lattice independently of the source
// implementation so that the test is not a tautology.
// ---------------------------------------------------------------------------

const VALID_STATES: ReadonlyArray<ShopItemState> = [
    'affordable',
    'unaffordable',
    'owned',
    'pending',
    'locked',
]

function isUnlocksUnsatisfied(item: ShopItem, unlocks: UnlockSet): boolean {
    const req = item.unlock
    if (!req) return false

    if (typeof req.minLevel === 'number' && (unlocks.level ?? 0) < req.minLevel) {
        return true
    }
    if (typeof req.minStreak === 'number' && (unlocks.streak ?? 0) < req.minStreak) {
        return true
    }
    if (req.requiredBadges && req.requiredBadges.length > 0) {
        const earned = new Set(unlocks.badges ?? [])
        for (const badge of req.requiredBadges) {
            if (!earned.has(badge)) return true
        }
    }
    return false
}

function expectedState(input: ClassifyShopItemInput): ShopItemState {
    const { item, wallet, inventory, unlocks, pendingRequests } = input

    if (isUnlocksUnsatisfied(item, unlocks)) return 'locked'
    if (inventory.ownedItemIds.includes(item.id)) return 'owned'
    if (pendingRequests.some((req) => req.itemId === item.id)) return 'pending'
    return wallet.fucoin >= item.price ? 'affordable' : 'unaffordable'
}

// ---------------------------------------------------------------------------
// Property 16: Shop Item State Classification
// ---------------------------------------------------------------------------

describe('Property 16: Shop Item State Classification (task 13.4)', () => {
    it('classifyShopItemState returns exactly one state from the closed enum', () => {
        fc.assert(
            fc.property(inputArb, (input) => {
                const state = classifyShopItemState(input)
                expect(VALID_STATES).toContain(state)
            }),
            { numRuns: NUM_RUNS },
        )
    })

    it('classifyShopItemState matches the boolean lattice for all (item, wallet, inventory, unlocks, pendingRequests)', () => {
        fc.assert(
            fc.property(inputArb, (input) => {
                const actual = classifyShopItemState(input)
                const expected = expectedState(input)
                expect(actual).toBe(expected)
            }),
            { numRuns: NUM_RUNS },
        )
    })

    // Priority precedence: each of the four chained implications below
    // is exercised by overlapping the relevant condition with a
    // strictly-lower-priority one. Generators are constrained so the
    // overlap is not vacuous.

    it('priority: locked > owned (locked wins when both apply)', () => {
        fc.assert(
            fc.property(
                fc.record({
                    itemId: itemIdArb,
                    price: fc.integer({ min: 0, max: 9_999_999 }),
                    fucoin: fc.integer({ min: 0, max: 9_999_999 }),
                    minLevelGap: fc.integer({ min: 1, max: 10 }),
                    currentLevel: fc.integer({ min: 0, max: 20 }),
                    extraOwned: fc.uniqueArray(itemIdArb, { minLength: 0, maxLength: 3 }),
                    pending: pendingRequestsArb,
                }),
                ({ itemId, price, fucoin, minLevelGap, currentLevel, extraOwned, pending }) => {
                    // Force `locked` ∧ `owned` to overlap: minLevel is
                    // strictly above the learner's level AND the item id
                    // appears in the inventory.
                    const item: ShopItem = {
                        id: itemId,
                        price,
                        unlock: { minLevel: currentLevel + minLevelGap },
                    }
                    const owned = Array.from(new Set([...extraOwned, itemId]))
                    const input: ClassifyShopItemInput = {
                        item,
                        wallet: { fucoin },
                        inventory: { ownedItemIds: owned },
                        unlocks: { level: currentLevel },
                        pendingRequests: pending,
                    }
                    expect(classifyShopItemState(input)).toBe('locked')
                },
            ),
            { numRuns: NUM_RUNS },
        )
    })

    it('priority: owned > pending (owned wins when both apply)', () => {
        fc.assert(
            fc.property(
                fc.record({
                    itemId: itemIdArb,
                    price: fc.integer({ min: 0, max: 9_999_999 }),
                    fucoin: fc.integer({ min: 0, max: 9_999_999 }),
                    extraOwned: fc.uniqueArray(itemIdArb, { minLength: 0, maxLength: 3 }),
                    extraPending: fc.array(pendingRequestArb, { minLength: 0, maxLength: 3 }),
                }),
                ({ itemId, price, fucoin, extraOwned, extraPending }) => {
                    // Force `owned` ∧ `pending` to overlap and ensure no
                    // unlock gate fires (item.unlock is omitted).
                    const item: ShopItem = { id: itemId, price }
                    const owned = Array.from(new Set([...extraOwned, itemId]))
                    const pending: PendingRequest[] = [...extraPending, { itemId }]
                    const input: ClassifyShopItemInput = {
                        item,
                        wallet: { fucoin },
                        inventory: { ownedItemIds: owned },
                        unlocks: {},
                        pendingRequests: pending,
                    }
                    expect(classifyShopItemState(input)).toBe('owned')
                },
            ),
            { numRuns: NUM_RUNS },
        )
    })

    it('priority: pending > affordable/unaffordable (pending wins when both apply)', () => {
        fc.assert(
            fc.property(
                fc.record({
                    itemId: itemIdArb,
                    price: fc.integer({ min: 0, max: 9_999_999 }),
                    fucoin: fc.integer({ min: 0, max: 9_999_999 }),
                    extraPending: fc.array(pendingRequestArb, { minLength: 0, maxLength: 3 }),
                    otherInventory: fc.uniqueArray(itemIdArb, { minLength: 0, maxLength: 3 }),
                }),
                ({ itemId, price, fucoin, extraPending, otherInventory }) => {
                    // Inventory must NOT contain the item, otherwise the
                    // higher-priority `owned` branch would dominate.
                    const ownedItemIds = otherInventory.filter((id) => id !== itemId)
                    const item: ShopItem = { id: itemId, price }
                    const pending: PendingRequest[] = [...extraPending, { itemId }]
                    const input: ClassifyShopItemInput = {
                        item,
                        wallet: { fucoin },
                        inventory: { ownedItemIds },
                        unlocks: {},
                        pendingRequests: pending,
                    }
                    expect(classifyShopItemState(input)).toBe('pending')
                },
            ),
            { numRuns: NUM_RUNS },
        )
    })

    it('affordable iff wallet.fucoin ≥ item.price (boundary at equality), unaffordable otherwise', () => {
        fc.assert(
            fc.property(
                fc.record({
                    itemId: itemIdArb,
                    price: fc.integer({ min: 0, max: 9_999_999 }),
                    fucoin: fc.integer({ min: 0, max: 9_999_999 }),
                }),
                ({ itemId, price, fucoin }) => {
                    // Strip every higher-priority condition: no unlock
                    // gate, empty inventory, no pending requests.
                    const item: ShopItem = { id: itemId, price }
                    const input: ClassifyShopItemInput = {
                        item,
                        wallet: { fucoin },
                        inventory: { ownedItemIds: [] },
                        unlocks: {},
                        pendingRequests: [],
                    }
                    const actual = classifyShopItemState(input)
                    if (fucoin >= price) {
                        expect(actual).toBe('affordable')
                    } else {
                        expect(actual).toBe('unaffordable')
                    }
                },
            ),
            { numRuns: NUM_RUNS },
        )
    })

    it('purity: identical inputs always produce identical output', () => {
        fc.assert(
            fc.property(inputArb, (input) => {
                const a = classifyShopItemState(input)
                const b = classifyShopItemState(input)
                expect(a).toBe(b)
            }),
            { numRuns: NUM_RUNS },
        )
    })
})
