import { FUXIE_GLOBAL_REWARD_ITEMS } from '@/lib/mascot/fuxie-global-assets'
import { PLACEHOLDER_ASSET } from '@/lib/mascot/fuxie-assets'

export const REWARD_ASSETS = {
    fucoin: '/reward-assets/optimized/fuxie-item-fucoin-512.webp',
    fucoinVillage: '/reward-assets/optimized/fuxie-item-fucoin-village-512.webp',
    streakFreeze: '/reward-assets/optimized/fuxie-item-streak-freeze-512.webp',
    streakFreezeSnowglobe: '/reward-assets/optimized/fuxie-item-streak-freeze-snowglobe-512.webp',
    hintTicket: '/reward-assets/optimized/fuxie-item-hint-ticket-512.webp',
    hintTicketVillage: '/reward-assets/optimized/fuxie-item-hint-ticket-village-512.webp',
    unlockKey: '/reward-assets/optimized/fuxie-item-unlock-key-512.webp',
    unlockKeySignpost: '/reward-assets/optimized/fuxie-item-unlock-key-signpost-512.webp',
    fuxieSkyOutfit: '/reward-assets/optimized/fuxie-item-fuxie-sky-outfit-512.webp',
    germanPostcard: '/reward-assets/optimized/fuxie-item-german-postcard-512.webp',
    xpStar: '/reward-assets/optimized/fuxie-item-xp-star-512.webp',
    xpStarVillage: '/reward-assets/optimized/fuxie-item-xp-star-village-512.webp',
    cefrBadges: '/reward-assets/optimized/fuxie-item-cefr-badges-512.webp',
    cefrBadgeNodeSet: '/reward-assets/optimized/fuxie-item-cefr-badge-node-set-512.webp',
    cefrBadgeA1: '/reward-assets/optimized/fuxie-item-cefr-badge-a1-512.webp',
    cefrBadgeA2: '/reward-assets/optimized/fuxie-item-cefr-badge-a2-512.webp',
    cefrBadgeB1: '/reward-assets/optimized/fuxie-item-cefr-badge-b1-512.webp',
    cefrBadgeB2: '/reward-assets/optimized/fuxie-item-cefr-badge-b2-512.webp',
    inventoryMarketProp: '/reward-assets/optimized/fuxie-item-inventory-market-prop-512.webp',
    streakFreezeCrystal: FUXIE_GLOBAL_REWARD_ITEMS.streakFreezeCrystal,
    fucoinPouch: FUXIE_GLOBAL_REWARD_ITEMS.fucoinPouch,
    xpStarBundle: FUXIE_GLOBAL_REWARD_ITEMS.xpStarBundle,
    coachHintTicket: FUXIE_GLOBAL_REWARD_ITEMS.coachHintTicket,
    mocktestUnlockKey: FUXIE_GLOBAL_REWARD_ITEMS.mocktestUnlockKey,
    speakingFeedbackPass: FUXIE_GLOBAL_REWARD_ITEMS.speakingFeedbackPass,
    fuxieSkyOutfitToken: FUXIE_GLOBAL_REWARD_ITEMS.fuxieSkyOutfitToken,
    learningGiftVoucher: FUXIE_GLOBAL_REWARD_ITEMS.learningGiftVoucher,
    rewardChestSmall: FUXIE_GLOBAL_REWARD_ITEMS.rewardChestSmall,
    dailyGoalStamp: FUXIE_GLOBAL_REWARD_ITEMS.dailyGoalStamp,
} as const

export type RewardAssetKey = keyof typeof REWARD_ASSETS

/**
 * Emit a console warning when a reward-asset lookup misses, but only in
 * development. Production keeps the log noise off so a missing key falls
 * through silently to {@link PLACEHOLDER_ASSET}.
 *
 * Validates: Requirements 1.6, 18.2
 */
function warnRewardAssetMiss(group: string, key: string): void {
    if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn(
            `[asset-registry] miss: group="${group}" key="${key}" — falling back to PLACEHOLDER_ASSET`,
        )
    }
}

/**
 * Resolve a `REWARD_ASSETS` key to its public path. Total: unknown keys fall
 * through to {@link PLACEHOLDER_ASSET} with a dev-only console warning.
 *
 * Validates: Requirements 1.1, 1.2, 1.6, 18.2
 */
export function getRewardAssetSrc(key: string): string {
    if (Object.prototype.hasOwnProperty.call(REWARD_ASSETS, key)) {
        return REWARD_ASSETS[key as RewardAssetKey]
    }
    warnRewardAssetMiss('REWARD_ASSETS', key)
    return PLACEHOLDER_ASSET
}

/**
 * Resolve a shop-item id (and optional category) to a reward asset path.
 *
 * Always returns a `string`. Known item ids and categories map to specific
 * reward visuals; anything else falls back to the generic Fucoin pouch so the
 * shop still has a renderable card. The fallback is a *known* asset, so
 * unrecognised inputs do not surface as `PLACEHOLDER_ASSET` — they surface as
 * the generic shop coin instead, matching the existing UX for unmapped items.
 *
 * Validates: Requirements 1.1, 1.2, 1.6
 */
export function getShopItemAssetSrc(itemId: string, category?: string | null): string {
    if (itemId === 'streak-freeze') return REWARD_ASSETS.streakFreezeCrystal
    if (itemId === 'fuxie-sky-outfit') return REWARD_ASSETS.fuxieSkyOutfitToken
    if (itemId === 'coach-hint-pack') return REWARD_ASSETS.coachHintTicket
    if (itemId === 'mocktest-unlock') return REWARD_ASSETS.mocktestUnlockKey
    if (itemId === 'speaking-feedback-pass') return REWARD_ASSETS.speakingFeedbackPass
    if (itemId === 'fuxie-real-gift-voucher') return REWARD_ASSETS.learningGiftVoucher
    if (category === 'support') return REWARD_ASSETS.coachHintTicket
    if (category === 'learning') return REWARD_ASSETS.mocktestUnlockKey
    if (category === 'cosmetic') return REWARD_ASSETS.fuxieSkyOutfitToken
    if (category === 'real_gift') return REWARD_ASSETS.learningGiftVoucher
    return REWARD_ASSETS.fucoinPouch
}

/**
 * Resolve a CEFR level (`'A1'..'B2'`) to its badge asset path.
 *
 * Always returns a `string`. Recognised levels map to per-level badges;
 * `null`, `undefined`, or unrecognised levels fall back to the generic CEFR
 * node-set badge so node UI stays renderable.
 *
 * Validates: Requirements 1.1, 1.2, 1.6
 */
export function getCefrBadgeAssetSrc(level?: string | null): string {
    if (level === 'A1') return REWARD_ASSETS.cefrBadgeA1
    if (level === 'A2') return REWARD_ASSETS.cefrBadgeA2
    if (level === 'B1') return REWARD_ASSETS.cefrBadgeB1
    if (level === 'B2') return REWARD_ASSETS.cefrBadgeB2
    return REWARD_ASSETS.cefrBadgeNodeSet
}
