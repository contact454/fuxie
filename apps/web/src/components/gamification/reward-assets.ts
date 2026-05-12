export const REWARD_ASSETS = {
    fucoin: '/reward-assets/optimized/fuxie-item-fucoin-512.webp',
    streakFreeze: '/reward-assets/optimized/fuxie-item-streak-freeze-512.webp',
    hintTicket: '/reward-assets/optimized/fuxie-item-hint-ticket-512.webp',
    unlockKey: '/reward-assets/optimized/fuxie-item-unlock-key-512.webp',
    fuxieSkyOutfit: '/reward-assets/optimized/fuxie-item-fuxie-sky-outfit-512.webp',
    germanPostcard: '/reward-assets/optimized/fuxie-item-german-postcard-512.webp',
    xpStar: '/reward-assets/optimized/fuxie-item-xp-star-512.webp',
    cefrBadges: '/reward-assets/optimized/fuxie-item-cefr-badges-512.webp',
    cefrBadgeA1: '/reward-assets/optimized/fuxie-item-cefr-badge-a1-512.webp',
    cefrBadgeA2: '/reward-assets/optimized/fuxie-item-cefr-badge-a2-512.webp',
    cefrBadgeB1: '/reward-assets/optimized/fuxie-item-cefr-badge-b1-512.webp',
    cefrBadgeB2: '/reward-assets/optimized/fuxie-item-cefr-badge-b2-512.webp',
    inventoryMarketProp: '/reward-assets/optimized/fuxie-item-inventory-market-prop-512.webp',
} as const

export type RewardAssetKey = keyof typeof REWARD_ASSETS

export function getShopItemAssetSrc(itemId: string, category?: string | null) {
    if (itemId === 'streak-freeze') return REWARD_ASSETS.streakFreeze
    if (itemId === 'fuxie-sky-outfit') return REWARD_ASSETS.fuxieSkyOutfit
    if (itemId === 'coach-hint-pack') return REWARD_ASSETS.hintTicket
    if (itemId === 'mocktest-unlock' || itemId === 'speaking-feedback-pass') return REWARD_ASSETS.unlockKey
    if (itemId === 'fuxie-real-gift-voucher') return REWARD_ASSETS.germanPostcard
    if (category === 'support') return REWARD_ASSETS.hintTicket
    if (category === 'learning') return REWARD_ASSETS.unlockKey
    if (category === 'cosmetic') return REWARD_ASSETS.fuxieSkyOutfit
    if (category === 'real_gift') return REWARD_ASSETS.germanPostcard
    return REWARD_ASSETS.fucoin
}

export function getCefrBadgeAssetSrc(level?: string | null) {
    if (level === 'A1') return REWARD_ASSETS.cefrBadgeA1
    if (level === 'A2') return REWARD_ASSETS.cefrBadgeA2
    if (level === 'B1') return REWARD_ASSETS.cefrBadgeB1
    if (level === 'B2') return REWARD_ASSETS.cefrBadgeB2
    return REWARD_ASSETS.cefrBadges
}
