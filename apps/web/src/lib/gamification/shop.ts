import { ShopRedeemRequestStatus, prisma } from '@fuxie/database'

import { getLearningFucoinDailyProgress, getWalletSummary } from './fucoin'

export type FuxieShopCategory = 'cosmetic' | 'learning' | 'support' | 'real_gift'
export type FuxieShopItemStatus = 'preview_locked'

export interface FuxieShopRedeemPreview {
    stage: FuxieShopItemStatus
    stageLabel: string
    ctaLabel: string
    confirmationCopy: string
    nextMilestone: string
    policy: string[]
}

export interface FuxieShopCatalogItem {
    id: string
    title: string
    description: string
    category: FuxieShopCategory
    categoryLabel: string
    benefit: string
    cost: number
    walletProgress: number
    canAfford: boolean
    status: FuxieShopItemStatus
    statusLabel: string
    lockedReason: string
    previewTag: string
    sortOrder: number
    redeemPreview: FuxieShopRedeemPreview
}

export interface FuxieRewardInventory {
    streakFreezeAvailable: number
    streakFreezeUsed: number
    streakFreezeTimeline: FuxieStreakFreezeTimelineItem[]
    pendingRedeemRequests: number
    awaitingFulfillment: number
    fulfilledRewards: number
    fulfilledStreakFreeze: number
    lastFulfilledReward: {
        itemId: string
        itemTitle: string
        fulfilledAt: Date
    } | null
}

export interface FuxieStreakFreezeTimelineItem {
    id: string
    usedAt: Date
    protectedStreak: number
    freezesRemaining: number
    missedDays: number
    sourceType: string
    sourceId: string
}

const CATEGORY_LABELS: Record<FuxieShopCategory, string> = {
    cosmetic: 'Mascot',
    learning: 'Unlock',
    support: 'Hint',
    real_gift: 'Gift',
}

const SHOP_CATALOG: Array<Omit<FuxieShopCatalogItem, 'categoryLabel' | 'walletProgress' | 'canAfford' | 'statusLabel' | 'lockedReason' | 'redeemPreview'>> = [
    {
        id: 'streak-freeze',
        title: 'Streak Freeze',
        description: 'Giữ chuỗi học khi có một ngày bận, không làm học viên mất nhịp.',
        category: 'support',
        benefit: 'Bảo vệ streak 1 ngày',
        cost: 120,
        status: 'preview_locked',
        previewTag: 'Daily safety',
        sortOrder: 10,
    },
    {
        id: 'fuxie-sky-outfit',
        title: 'Fuxie Sky Outfit',
        description: 'Trang phục xanh sáng cho mascot Fuxie trên Dashboard và result screen.',
        category: 'cosmetic',
        benefit: 'Cosmetic mascot',
        cost: 180,
        status: 'preview_locked',
        previewTag: 'Brand cosmetic',
        sortOrder: 20,
    },
    {
        id: 'coach-hint-pack',
        title: 'Gói gợi ý Fuxie',
        description: 'Thêm hint khi luyện bài khó, dùng cho bài nghe/đọc có nhiều bẫy.',
        category: 'support',
        benefit: '5 hint học tập',
        cost: 220,
        status: 'preview_locked',
        previewTag: 'Study support',
        sortOrder: 30,
    },
    {
        id: 'mocktest-unlock',
        title: 'Mở khóa mock test',
        description: 'Mở bài luyện thi nâng cao khi học viên đã tích đủ Fucoin.',
        category: 'learning',
        benefit: 'Advanced mock test',
        cost: 300,
        status: 'preview_locked',
        previewTag: 'Exam unlock',
        sortOrder: 40,
    },
    {
        id: 'speaking-feedback-pass',
        title: 'Speaking Feedback Pass',
        description: 'Một lượt feedback nói chi tiết hơn cho nhiệm vụ luyện phát âm.',
        category: 'learning',
        benefit: 'Deep feedback',
        cost: 420,
        status: 'preview_locked',
        previewTag: 'Premium practice',
        sortOrder: 50,
    },
    {
        id: 'fuxie-real-gift-voucher',
        title: 'Voucher quà học tập',
        description: 'Preview phần quà thật trong tương lai, chỉ mở khi vận hành reward ổn định.',
        category: 'real_gift',
        benefit: 'Real reward preview',
        cost: 900,
        status: 'preview_locked',
        previewTag: 'Coming later',
        sortOrder: 60,
    },
]

const REDEEM_GUARD_POLICY = [
    'Request pending không trừ Fucoin; ví và ledger được giữ nguyên.',
    'Admin phải review trước khi có bước approve/reject.',
    'Spend ledger và fulfillment thật vẫn khóa ở batch này.',
    'Quà thật hoặc unlock nhạy cảm cần quy trình vận hành riêng.',
]

export function buildFuxieRewardInventory(input: {
    streak?: {
        freezesAvailable?: number | null
        freezesUsed?: number | null
    } | null
    statusCounts?: Array<{
        status: ShopRedeemRequestStatus
        count: number
    }>
    awaitingFulfillment?: number
    fulfilledStreakFreeze?: number
    lastFulfilledReward?: FuxieRewardInventory['lastFulfilledReward']
    streakFreezeTimeline?: FuxieStreakFreezeTimelineItem[]
}): FuxieRewardInventory {
    const getStatusCount = (status: ShopRedeemRequestStatus) =>
        input.statusCounts?.find((item) => item.status === status)?.count ?? 0
    const awaitingFulfillment = Math.max(0, input.awaitingFulfillment ?? 0)

    return {
        streakFreezeAvailable: Math.max(0, input.streak?.freezesAvailable ?? 0),
        streakFreezeUsed: Math.max(0, input.streak?.freezesUsed ?? 0),
        streakFreezeTimeline: input.streakFreezeTimeline ?? [],
        pendingRedeemRequests: getStatusCount(ShopRedeemRequestStatus.PENDING),
        awaitingFulfillment,
        fulfilledRewards: Math.max(0, getStatusCount(ShopRedeemRequestStatus.APPROVED) - awaitingFulfillment),
        fulfilledStreakFreeze: Math.max(0, input.fulfilledStreakFreeze ?? 0),
        lastFulfilledReward: input.lastFulfilledReward ?? null,
    }
}

export function buildFuxieShopCatalog(walletBalance: number): FuxieShopCatalogItem[] {
    const safeBalance = Math.max(0, Math.floor(walletBalance))

    return SHOP_CATALOG
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((item) => {
            const walletProgress = item.cost > 0
                ? Math.min(100, Math.round((safeBalance / item.cost) * 100))
                : 100
            const canAfford = safeBalance >= item.cost
            const missingFucoin = Math.max(0, item.cost - safeBalance)

            return {
                ...item,
                categoryLabel: CATEGORY_LABELS[item.category],
                walletProgress,
                canAfford,
                statusLabel: canAfford ? 'Đủ Fucoin' : 'Đang tích',
                lockedReason: 'Redeem thật sẽ mở ở batch sau.',
                redeemPreview: {
                    stage: 'preview_locked',
                    stageLabel: 'Pending request v1',
                    ctaLabel: canAfford ? 'Tạo request đổi quà' : 'Xem điều kiện đổi',
                    confirmationCopy: `${item.title} hiện có thể được đưa vào hàng chờ review nếu ví đủ Fucoin. Request pending không trừ Fucoin cho tới khi approval/spend ledger thật được bật.`,
                    nextMilestone: canAfford
                        ? 'Ví đã đủ Fucoin để tạo request pending. Admin sẽ review trước khi fulfillment thật được mở.'
                        : `${missingFucoin.toLocaleString('vi-VN')} Fucoin nữa để chạm mốc ${item.cost.toLocaleString('vi-VN')} Fu.`,
                    policy: REDEEM_GUARD_POLICY,
                },
            }
        })
}

export function getFuxieShopPreview(walletBalance: number, limit = 4) {
    return buildFuxieShopCatalog(walletBalance).slice(0, limit)
}

export function getFuxieShopCatalogItem(itemId: string, walletBalance: number) {
    return buildFuxieShopCatalog(walletBalance).find((item) => item.id === itemId) ?? null
}

export async function getFuxieShopCatalogForUser(userId: string) {
    const [
        wallet,
        dailyFucoin,
        streak,
        streakFreezeTimeline,
        statusCounts,
        awaitingFulfillment,
        fulfilledStreakFreeze,
        lastFulfilledReward,
    ] = await Promise.all([
        getWalletSummary(prisma, userId),
        getLearningFucoinDailyProgress(prisma, userId),
        prisma.userStreak.findUnique({
            where: { userId },
            select: {
                freezesAvailable: true,
                freezesUsed: true,
            },
        }),
        prisma.streakFreezeUsage.findMany({
            where: { userId },
            orderBy: { usedAt: 'desc' },
            take: 3,
            select: {
                id: true,
                usedAt: true,
                protectedStreak: true,
                freezesRemaining: true,
                missedDays: true,
                sourceType: true,
                sourceId: true,
            },
        }),
        prisma.shopRedeemRequest.groupBy({
            by: ['status'],
            where: { userId },
            _count: { _all: true },
        }).then((rows) => rows.map((row) => ({
            status: row.status,
            count: row._count._all,
        }))),
        prisma.shopRedeemRequest.count({
            where: {
                userId,
                status: ShopRedeemRequestStatus.APPROVED,
                fulfilledAt: null,
            },
        }),
        prisma.shopRedeemRequest.count({
            where: {
                userId,
                itemId: 'streak-freeze',
                status: ShopRedeemRequestStatus.APPROVED,
                fulfilledAt: { not: null },
            },
        }),
        prisma.shopRedeemRequest.findFirst({
            where: {
                userId,
                status: ShopRedeemRequestStatus.APPROVED,
                fulfilledAt: { not: null },
            },
            orderBy: { fulfilledAt: 'desc' },
            select: {
                itemId: true,
                itemTitle: true,
                fulfilledAt: true,
            },
        }),
    ])

    return {
        wallet,
        dailyFucoin,
        catalog: buildFuxieShopCatalog(wallet.balance),
        rewardInventory: buildFuxieRewardInventory({
            streak,
            statusCounts,
            awaitingFulfillment,
            fulfilledStreakFreeze,
            streakFreezeTimeline,
            lastFulfilledReward: lastFulfilledReward?.fulfilledAt
                ? {
                    itemId: lastFulfilledReward.itemId,
                    itemTitle: lastFulfilledReward.itemTitle,
                    fulfilledAt: lastFulfilledReward.fulfilledAt,
                }
                : null,
        }),
    }
}
