import { FucoinLedgerType, Prisma, prisma } from '@fuxie/database'
import { recordAnalyticsEvent } from '@/lib/analytics/events'

export type EconomyDbClient = Prisma.TransactionClient | typeof prisma

export type LearningFucoinKind =
    | 'activity'
    | 'lesson'
    | 'writing'
    | 'exam_attempt'
    | 'exam_pass'

export interface WalletSummary {
    balance: number
    lifetimeEarned: number
    lifetimeSpent: number
}

export interface AwardFucoinInput {
    userId: string
    amount: number
    sourceType: string
    sourceId: string
    reason: string
    metadata?: Prisma.InputJsonValue
}

export interface AwardFucoinResult {
    fucoinEarned: number
    walletBalance: number
    duplicate: boolean
    intendedAmount?: number
    dailyCap?: number
    dailyEarnedBefore?: number
    dailyRemainingAfter?: number
    capReached?: boolean
}

export interface SpendFucoinInput {
    userId: string
    amount: number
    sourceType: string
    sourceId: string
    reason: string
    metadata?: Prisma.InputJsonValue
}

export interface SpendFucoinResult {
    fucoinSpent: number
    walletBalance: number
    duplicate: boolean
}

export class FucoinSpendError extends Error {
    constructor(
        message: string,
        public readonly code: 'invalid_amount' | 'insufficient_funds'
    ) {
        super(message)
        this.name = 'FucoinSpendError'
    }
}

export interface LearningFucoinInput {
    userId: string
    kind: LearningFucoinKind
    sourceType: string
    sourceId: string
    accuracy?: number | null
    reason: string
    metadata?: Prisma.InputJsonValue
}

export const LEARNING_FUCOIN_DAILY_CAP = 60

const BASE_LEARNING_FUCOIN: Record<LearningFucoinKind, number> = {
    activity: 3,
    lesson: 5,
    writing: 8,
    exam_attempt: 10,
    exam_pass: 20,
}

export function calculateLearningFucoin(input: { kind: LearningFucoinKind; accuracy?: number | null }) {
    const base = BASE_LEARNING_FUCOIN[input.kind]
    const perfectBonus = input.accuracy !== null && input.accuracy !== undefined && input.accuracy >= 100 ? 2 : 0

    return base + perfectBonus
}

export async function getWalletSummary(tx: EconomyDbClient, userId: string): Promise<WalletSummary> {
    const wallet = await tx.userWallet.findUnique({
        where: { userId },
        select: {
            balance: true,
            lifetimeEarned: true,
            lifetimeSpent: true,
        },
    })

    return wallet ?? {
        balance: 0,
        lifetimeEarned: 0,
        lifetimeSpent: 0,
    }
}

export async function getLearningFucoinDailyProgress(tx: EconomyDbClient, userId: string) {
    const earnedToday = await getLearningFucoinEarnedToday(tx, userId)
    const remaining = Math.max(0, LEARNING_FUCOIN_DAILY_CAP - earnedToday)

    return {
        earnedToday,
        dailyCap: LEARNING_FUCOIN_DAILY_CAP,
        remaining,
        capReached: remaining <= 0,
    }
}

export async function awardFucoin(tx: EconomyDbClient, input: AwardFucoinInput): Promise<AwardFucoinResult> {
    const amount = Math.max(0, Math.floor(input.amount))
    if (amount <= 0) {
        const wallet = await getWalletSummary(tx, input.userId)
        return { fucoinEarned: 0, walletBalance: wallet.balance, duplicate: false }
    }

    // Check unique constraint beforehand to prevent aborting database transactions in PostgreSQL
    const existing = await tx.fucoinLedger.findUnique({
        where: {
            userId_sourceType_sourceId: {
                userId: input.userId,
                sourceType: input.sourceType,
                sourceId: input.sourceId,
            },
        },
    })
    if (existing) {
        const wallet = await getWalletSummary(tx, input.userId)
        return { fucoinEarned: 0, walletBalance: wallet.balance, duplicate: true }
    }

    try {
        await tx.fucoinLedger.create({
            data: {
                userId: input.userId,
                amount,
                type: FucoinLedgerType.EARN,
                sourceType: input.sourceType,
                sourceId: input.sourceId,
                reason: input.reason,
                ...(input.metadata ? { metadata: input.metadata } : {}),
            },
        })
    } catch (error) {
        if (isUniqueConstraintError(error)) {
            const wallet = await getWalletSummary(tx, input.userId)
            return { fucoinEarned: 0, walletBalance: wallet.balance, duplicate: true }
        }

        throw error
    }

    const wallet = await tx.userWallet.upsert({
        where: { userId: input.userId },
        update: {
            balance: { increment: amount },
            lifetimeEarned: { increment: amount },
        },
        create: {
            userId: input.userId,
            balance: amount,
            lifetimeEarned: amount,
            lifetimeSpent: 0,
        },
        select: {
            balance: true,
        },
    })

    return { fucoinEarned: amount, walletBalance: wallet.balance, duplicate: false }
}

export async function spendFucoin(tx: EconomyDbClient, input: SpendFucoinInput): Promise<SpendFucoinResult> {
    const amount = Math.max(0, Math.floor(input.amount))
    if (amount <= 0) {
        throw new FucoinSpendError('Spend amount must be greater than zero', 'invalid_amount')
    }

    const wallet = await getWalletSummary(tx, input.userId)
    if (wallet.balance < amount) {
        throw new FucoinSpendError('Insufficient Fucoin balance', 'insufficient_funds')
    }

    // Check unique constraint beforehand to prevent aborting database transactions in PostgreSQL
    const existing = await tx.fucoinLedger.findUnique({
        where: {
            userId_sourceType_sourceId: {
                userId: input.userId,
                sourceType: input.sourceType,
                sourceId: input.sourceId,
            },
        },
    })
    if (existing) {
        const currentWallet = await getWalletSummary(tx, input.userId)
        return { fucoinSpent: 0, walletBalance: currentWallet.balance, duplicate: true }
    }

    try {
        await tx.fucoinLedger.create({
            data: {
                userId: input.userId,
                amount,
                type: FucoinLedgerType.SPEND,
                sourceType: input.sourceType,
                sourceId: input.sourceId,
                reason: input.reason,
                ...(input.metadata ? { metadata: input.metadata } : {}),
            },
        })
    } catch (error) {
        if (isUniqueConstraintError(error)) {
            const currentWallet = await getWalletSummary(tx, input.userId)
            return { fucoinSpent: 0, walletBalance: currentWallet.balance, duplicate: true }
        }

        throw error
    }

    const update = await tx.userWallet.updateMany({
        where: {
            userId: input.userId,
            balance: { gte: amount },
        },
        data: {
            balance: { decrement: amount },
            lifetimeSpent: { increment: amount },
        },
    })

    if (update.count !== 1) {
        throw new FucoinSpendError('Insufficient Fucoin balance', 'insufficient_funds')
    }

    const updatedWallet = await getWalletSummary(tx, input.userId)
    return { fucoinSpent: amount, walletBalance: updatedWallet.balance, duplicate: false }
}

export async function awardLearningFucoin(
    tx: EconomyDbClient,
    input: LearningFucoinInput
): Promise<AwardFucoinResult> {
    const intendedAmount = calculateLearningFucoin(input)
    const dailyProgress = await getLearningFucoinDailyProgress(tx, input.userId)
    const dailyEarned = dailyProgress.earnedToday
    const remainingCap = dailyProgress.remaining
    const amount = Math.min(intendedAmount, remainingCap)

    const result = await awardFucoin(tx, {
        userId: input.userId,
        amount,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        reason: input.reason,
        metadata: input.metadata,
    })
    const enrichedResult = {
        ...result,
        intendedAmount,
        dailyCap: LEARNING_FUCOIN_DAILY_CAP,
        dailyEarnedBefore: dailyEarned,
        dailyRemainingAfter: Math.max(0, remainingCap - result.fucoinEarned),
        capReached: remainingCap <= intendedAmount,
    }

    if (!result.duplicate && result.fucoinEarned > 0) {
        await recordAnalyticsEvent(tx, {
            userId: input.userId,
            role: 'LEARNER',
            eventName: 'fucoin_earned',
            source: 'fucoin.learning_award',
            actionId: input.sourceId,
            metadata: {
                amount: result.fucoinEarned,
                intended_amount: intendedAmount,
                daily_cap: LEARNING_FUCOIN_DAILY_CAP,
                daily_earned_before: dailyEarned,
                daily_remaining_after: enrichedResult.dailyRemainingAfter,
                cap_reached: enrichedResult.capReached,
                source_type: input.sourceType,
                kind: input.kind,
            },
        })
    }

    return enrichedResult
}

async function getLearningFucoinEarnedToday(tx: EconomyDbClient, userId: string) {
    const today = startOfToday()
    const result = await tx.fucoinLedger.aggregate({
        where: {
            userId,
            type: FucoinLedgerType.EARN,
            sourceType: { startsWith: 'learning:' },
            createdAt: { gte: today },
        },
        _sum: { amount: true },
    })

    return result._sum.amount ?? 0
}

function startOfToday() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
}

function isUniqueConstraintError(error: unknown) {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}
