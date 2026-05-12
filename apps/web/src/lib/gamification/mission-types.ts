import type { FuxieShopCatalogItem } from './shop'

export type MissionBoardPeriod = 'daily' | 'monthly' | 'quarterly'
export type MissionBoardStatus = 'active' | 'claimable' | 'claimed' | 'locked'

export interface MissionBoardWallet {
    balance: number
    lifetimeEarned: number
    lifetimeSpent: number
}

export interface MissionBoardDailyFucoin {
    earnedToday: number
    dailyCap: number
    remaining: number
    capReached: boolean
}

export interface MissionBoardLedgerEntry {
    id: string
    amount: number
    type: string
    sourceType: string
    reason: string
    createdAt: string
}

export interface MissionBoardXpLevel {
    level: number
    title: string
    totalXp: number
    currentLevelXp: number
    nextLevelXp: number
    nextLevelTotalXp: number
    progress: number
}

export interface MissionBoardItem {
    id: string
    slug: string
    period: MissionBoardPeriod
    periodLabel: string
    periodKey: string
    title: string
    description: string
    href: string | null
    status: MissionBoardStatus
    progress: number
    currentValue: number
    targetValue: number
    xpReward: number
    fucoinReward: number
    sortOrder: number
}

export interface MissionBoardData {
    wallet: MissionBoardWallet
    dailyFucoin: MissionBoardDailyFucoin
    recentLedger: MissionBoardLedgerEntry[]
    xpLevel: MissionBoardXpLevel
    periods: Array<{
        period: MissionBoardPeriod
        label: string
        periodKey: string
        progress: number
        claimableCount: number
        missions: MissionBoardItem[]
    }>
    missions: MissionBoardItem[]
    shopPreview: FuxieShopCatalogItem[]
}
