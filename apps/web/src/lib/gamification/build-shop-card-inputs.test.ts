import { describe, expect, it } from 'vitest'

import {
    WALLET_DISPLAY_MAX,
    WALLET_DISPLAY_MIN,
    buildShopCardInputs,
    classifyShopCards,
    clampWalletForDisplay,
    toShopItem,
} from './build-shop-card-inputs'
import type { FuxieShopCatalogItem } from './shop'

/**
 * Unit tests for the shop-card input adapter (task 13.2).
 *
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */

const requestableCatalogItem: FuxieShopCatalogItem = {
    id: 'fuxie-sky-outfit',
    title: 'Fuxie Sky Outfit',
    description: 'Trang phục xanh sáng cho mascot.',
    category: 'cosmetic',
    categoryLabel: 'Mascot',
    benefit: 'Cosmetic mascot',
    cost: 180,
    walletProgress: 0,
    canAfford: false,
    status: 'requestable',
    statusLabel: 'Đang tích Fucoin',
    lockedReason: '',
    previewTag: 'Brand cosmetic',
    sortOrder: 20,
    redeemPreview: {
        stage: 'requestable',
        stageLabel: 'Đổi thưởng có kiểm duyệt',
        ctaLabel: 'Xem điều kiện',
        confirmationCopy: '',
        nextMilestone: '',
        policy: [],
    },
}

const previewLockedCatalogItem: FuxieShopCatalogItem = {
    ...requestableCatalogItem,
    id: 'fuxie-real-gift-voucher',
    title: 'Voucher quà học tập',
    category: 'real_gift',
    categoryLabel: 'Gift',
    cost: 900,
    status: 'preview_locked',
    statusLabel: 'Chưa mở',
    sortOrder: 60,
}

describe('clampWalletForDisplay (Req 8.1)', () => {
    it('saturates negative balances to the display minimum', () => {
        expect(clampWalletForDisplay(-1)).toBe(WALLET_DISPLAY_MIN)
        expect(clampWalletForDisplay(-9999)).toBe(WALLET_DISPLAY_MIN)
    })

    it('saturates balances above 9_999_999 to the display maximum', () => {
        expect(clampWalletForDisplay(WALLET_DISPLAY_MAX + 1)).toBe(WALLET_DISPLAY_MAX)
        expect(clampWalletForDisplay(1e12)).toBe(WALLET_DISPLAY_MAX)
    })

    it('floors fractional balances and passes valid integers through', () => {
        expect(clampWalletForDisplay(123.9)).toBe(123)
        expect(clampWalletForDisplay(0)).toBe(0)
        expect(clampWalletForDisplay(WALLET_DISPLAY_MAX)).toBe(WALLET_DISPLAY_MAX)
    })

    it('treats non-finite inputs as the display minimum', () => {
        expect(clampWalletForDisplay(Number.NaN)).toBe(WALLET_DISPLAY_MIN)
        expect(clampWalletForDisplay(Number.POSITIVE_INFINITY)).toBe(WALLET_DISPLAY_MIN)
    })
})

describe('toShopItem — preview_locked items become permanently locked (Req 8.2)', () => {
    it('returns no unlock requirement for requestable catalog items', () => {
        const item = toShopItem(requestableCatalogItem)
        expect(item.unlock).toBeUndefined()
        expect(item.price).toBe(180)
    })

    it('attaches a synthetic locked badge for preview_locked items', () => {
        const item = toShopItem(previewLockedCatalogItem)
        expect(item.unlock?.requiredBadges).toEqual(['__shop:preview-locked'])
        expect(item.price).toBe(900)
    })
})

describe('classifyShopCards — full lattice projected onto the catalog (Req 8.3, 8.4, 8.5, 8.6)', () => {
    const baseSource = {
        catalog: [requestableCatalogItem, previewLockedCatalogItem],
        ownedItemIds: [],
        pendingItemIds: [],
        unlocks: {},
    }

    it('projects to "affordable" for items the wallet can cover', () => {
        const cards = classifyShopCards({ ...baseSource, walletFucoin: 200 })
        const sky = cards.find((card) => card.item.id === 'fuxie-sky-outfit')!
        expect(sky.state).toBe('affordable')
        expect(sky.missingFucoin).toBe(0)
    })

    it('projects to "unaffordable" with the missing Fucoin delta', () => {
        const cards = classifyShopCards({ ...baseSource, walletFucoin: 50 })
        const sky = cards.find((card) => card.item.id === 'fuxie-sky-outfit')!
        expect(sky.state).toBe('unaffordable')
        expect(sky.missingFucoin).toBe(130)
    })

    it('projects to "owned" when the inventory contains the item', () => {
        const cards = classifyShopCards({
            ...baseSource,
            walletFucoin: 0,
            ownedItemIds: ['fuxie-sky-outfit'],
        })
        const sky = cards.find((card) => card.item.id === 'fuxie-sky-outfit')!
        expect(sky.state).toBe('owned')
        expect(sky.missingFucoin).toBe(0)
    })

    it('projects to "pending" while a redeem request is in flight', () => {
        const cards = classifyShopCards({
            ...baseSource,
            walletFucoin: 200,
            pendingItemIds: ['fuxie-sky-outfit'],
        })
        const sky = cards.find((card) => card.item.id === 'fuxie-sky-outfit')!
        expect(sky.state).toBe('pending')
    })

    it('projects preview_locked items to "locked" regardless of wallet balance', () => {
        const cards = classifyShopCards({ ...baseSource, walletFucoin: WALLET_DISPLAY_MAX })
        const realGift = cards.find((card) => card.item.id === 'fuxie-real-gift-voucher')!
        expect(realGift.state).toBe('locked')
    })

    it('saturates wallet display BEFORE classifying so overflow does not flip a card to affordable', () => {
        const cards = classifyShopCards({
            ...baseSource,
            walletFucoin: WALLET_DISPLAY_MAX + 50_000,
        })
        const sky = cards.find((card) => card.item.id === 'fuxie-sky-outfit')!
        expect(sky.state).toBe('affordable')
    })
})

describe('buildShopCardInputs — shape contract for the React tree', () => {
    it('returns one ClassifyShopItemInput per catalog row, in catalog order', () => {
        const inputs = buildShopCardInputs({
            catalog: [requestableCatalogItem, previewLockedCatalogItem],
            walletFucoin: 100,
            ownedItemIds: [],
            pendingItemIds: [],
        })
        expect(inputs.map((input) => input.item.id)).toEqual([
            'fuxie-sky-outfit',
            'fuxie-real-gift-voucher',
        ])
    })

    it('shares the wallet and inventory references across rows for memo stability', () => {
        const inputs = buildShopCardInputs({
            catalog: [requestableCatalogItem, previewLockedCatalogItem],
            walletFucoin: 100,
            ownedItemIds: ['streak-freeze'],
            pendingItemIds: ['fuxie-sky-outfit'],
        })
        expect(inputs[0]!.wallet).toBe(inputs[1]!.wallet)
        expect(inputs[0]!.inventory).toBe(inputs[1]!.inventory)
        expect(inputs[0]!.pendingRequests).toBe(inputs[1]!.pendingRequests)
    })
})
