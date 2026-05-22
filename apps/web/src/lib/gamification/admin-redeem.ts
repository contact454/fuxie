import { Prisma, ShopRedeemRequestStatus, prisma } from '@fuxie/database'

import { FucoinSpendError, spendFucoin } from './fucoin'
import { recordAnalyticsEvent } from '@/lib/analytics/events'

export type AdminRedeemReviewAction = 'approve' | 'reject'
export type AdminRedeemFulfillmentState = 'awaiting' | 'fulfilled'
export type AdminRedeemDbClient = Prisma.TransactionClient | typeof prisma

export interface AdminRedeemRequestRow {
    id: string
    itemId: string
    itemTitle: string
    itemCategory: string
    itemBenefit: string
    cost: number
    walletBalanceAtRequest: number
    status: ShopRedeemRequestStatus
    statusReason: string | null
    requestedAt: Date
    reviewedAt: Date | null
    fulfilledAt: Date | null
    updatedAt: Date
    user: {
        email: string
        profile: {
            displayName: string | null
            currentLevel: string
        } | null
    }
}

export interface AdminRedeemStatusCount {
    status: ShopRedeemRequestStatus
    count: number
}

export interface AdminRedeemQueueCounts {
    statuses: AdminRedeemStatusCount[]
    awaitingFulfillment: number
}

export class AdminRedeemReviewError extends Error {
    constructor(
        message: string,
        public readonly status: number,
        public readonly code:
            | 'not_found'
            | 'not_pending'
            | 'not_approved'
            | 'already_fulfilled'
            | 'invalid_action'
            | 'insufficient_funds'
            | 'unsupported_reward'
            | 'missing_reject_reason'
    ) {
        super(message)
        this.name = 'AdminRedeemReviewError'
    }
}

const redeemRequestSelect = {
    id: true,
    itemId: true,
    itemTitle: true,
    itemCategory: true,
    itemBenefit: true,
    cost: true,
    walletBalanceAtRequest: true,
    status: true,
    statusReason: true,
    requestedAt: true,
    reviewedAt: true,
    fulfilledAt: true,
    updatedAt: true,
    user: {
        select: {
            email: true,
            profile: {
                select: {
                    displayName: true,
                    currentLevel: true,
                },
            },
        },
    },
} satisfies Prisma.ShopRedeemRequestSelect

export async function listShopRedeemRequests(
    tx: AdminRedeemDbClient,
    input: {
        status?: ShopRedeemRequestStatus
        fulfillment?: AdminRedeemFulfillmentState
        take?: number
    } = {}
): Promise<AdminRedeemRequestRow[]> {
    return tx.shopRedeemRequest.findMany({
        where: buildRedeemRequestWhere(input),
        orderBy: { requestedAt: 'desc' },
        take: input.take ?? 50,
        select: redeemRequestSelect,
    })
}

export async function countShopRedeemRequestsByStatus(
    tx: AdminRedeemDbClient
): Promise<AdminRedeemStatusCount[]> {
    const rows = await tx.shopRedeemRequest.groupBy({
        by: ['status'],
        _count: {
            _all: true,
        },
    })

    return rows.map((row) => ({
        status: row.status,
        count: row._count._all,
    }))
}

export async function getAdminRedeemQueueCounts(
    tx: AdminRedeemDbClient
): Promise<AdminRedeemQueueCounts> {
    const [statuses, awaitingFulfillment] = await Promise.all([
        countShopRedeemRequestsByStatus(tx),
        tx.shopRedeemRequest.count({
            where: {
                status: ShopRedeemRequestStatus.APPROVED,
                fulfilledAt: null,
            },
        }),
    ])

    return {
        statuses,
        awaitingFulfillment,
    }
}

export async function reviewShopRedeemRequest(
    tx: AdminRedeemDbClient,
    input: {
        requestId: string
        action: AdminRedeemReviewAction
        reason?: string
    }
): Promise<AdminRedeemRequestRow> {
    if (input.action !== 'approve' && input.action !== 'reject') {
        throw new AdminRedeemReviewError('Invalid review action', 400, 'invalid_action')
    }

    const request = await tx.shopRedeemRequest.findUnique({
        where: { id: input.requestId },
        select: {
            id: true,
            userId: true,
            itemId: true,
            itemTitle: true,
            itemCategory: true,
            cost: true,
            status: true,
        },
    })

    if (!request) {
        throw new AdminRedeemReviewError('Redeem request not found', 404, 'not_found')
    }

    if (request.status !== ShopRedeemRequestStatus.PENDING) {
        throw new AdminRedeemReviewError('Redeem request is no longer pending', 409, 'not_pending')
    }

    if (input.action === 'approve' && request.itemCategory === 'real_gift') {
        throw new AdminRedeemReviewError('Real gifts remain locked for this pilot', 409, 'unsupported_reward')
    }

    if (input.action === 'reject' && request.itemCategory === 'real_gift' && !input.reason?.trim()) {
        throw new AdminRedeemReviewError('Rejecting a locked real gift request requires a reason', 400, 'missing_reject_reason')
    }

    const nextStatus = input.action === 'approve'
        ? ShopRedeemRequestStatus.APPROVED
        : ShopRedeemRequestStatus.REJECTED
    const statusReason = input.reason?.trim()
        || (input.action === 'approve'
            ? 'Approved and Fucoin spent. Awaiting fulfillment.'
            : 'Rejected by admin. Fucoin has not been spent.')
    let walletBalanceAfter: number | null = null
    let duplicateSpend = false

    if (input.action === 'approve') {
        try {
            const spendReceipt = await spendFucoin(tx, {
                userId: request.userId,
                amount: request.cost,
                sourceType: 'shop:redeem',
                sourceId: request.id,
                reason: `Redeem approved: ${request.itemTitle}`,
                metadata: {
                    requestId: request.id,
                    itemId: request.itemId,
                    itemTitle: request.itemTitle,
                    approvalGuard: 'admin_approved_spend',
                },
            })
            walletBalanceAfter = spendReceipt.walletBalance
            duplicateSpend = spendReceipt.duplicate
        } catch (error) {
            if (error instanceof FucoinSpendError && error.code === 'insufficient_funds') {
                throw new AdminRedeemReviewError('Learner wallet no longer has enough Fucoin', 402, 'insufficient_funds')
            }

            throw error
        }
    }

    const updated = await tx.shopRedeemRequest.update({
        where: { id: input.requestId },
        data: {
            status: nextStatus,
            statusReason,
            reviewedAt: new Date(),
        },
        select: redeemRequestSelect,
    })

    await recordAnalyticsEvent(tx, {
        userId: request.userId,
        role: 'LEARNER',
        eventName: input.action === 'approve' ? 'reward_redeem_approved' : 'reward_redeem_rejected',
        source: 'admin.rewards.redeem.review',
        actionId: request.id,
        metadata: {
            item_id: request.itemId,
            category: request.itemCategory,
            cost: request.cost,
            request_id: request.id,
            wallet_balance_after: walletBalanceAfter,
            duplicate_spend: duplicateSpend,
        },
    })

    return updated
}

export async function fulfillShopRedeemRequest(
    tx: AdminRedeemDbClient,
    input: {
        requestId: string
        reason?: string
    }
): Promise<AdminRedeemRequestRow> {
    const request = await tx.shopRedeemRequest.findUnique({
        where: { id: input.requestId },
        select: {
            id: true,
            userId: true,
            itemId: true,
            itemTitle: true,
            itemCategory: true,
            status: true,
            fulfilledAt: true,
        },
    })

    if (!request) {
        throw new AdminRedeemReviewError('Redeem request not found', 404, 'not_found')
    }

    if (request.status !== ShopRedeemRequestStatus.APPROVED) {
        throw new AdminRedeemReviewError('Redeem request must be approved before fulfillment', 409, 'not_approved')
    }

    if (request.fulfilledAt) {
        throw new AdminRedeemReviewError('Redeem request has already been fulfilled', 409, 'already_fulfilled')
    }

    const fulfillmentResult = await applySafeInAppFulfillment(tx, request)

    const updated = await tx.shopRedeemRequest.update({
        where: { id: input.requestId },
        data: {
            fulfilledAt: new Date(),
            statusReason: input.reason?.trim()
                || fulfillmentResult.statusReason,
        },
        select: redeemRequestSelect,
    })

    await recordAnalyticsEvent(tx, {
        userId: request.userId,
        role: 'LEARNER',
        eventName: 'reward_redeem_fulfilled',
        source: 'admin.rewards.redeem.fulfill',
        actionId: request.id,
        metadata: {
            item_id: request.itemId,
            category: request.itemCategory,
            request_id: request.id,
            automatic_grant: fulfillmentResult.automaticGrant,
        },
    })

    return updated
}

async function applySafeInAppFulfillment(
    tx: AdminRedeemDbClient,
    request: {
        userId: string
        itemId: string
        itemTitle: string
    }
): Promise<{ statusReason: string; automaticGrant: boolean }> {
    if (request.itemId !== 'streak-freeze') {
        return {
            statusReason: 'Marked fulfilled by admin. Manual delivery recorded; no automatic unlock was executed.',
            automaticGrant: false,
        }
    }

    await tx.userStreak.upsert({
        where: { userId: request.userId },
        update: {
            freezesAvailable: { increment: 1 },
        },
        create: {
            userId: request.userId,
            freezesAvailable: 1,
        },
    })

    return {
        statusReason: `Marked fulfilled. ${request.itemTitle} granted (+1 freeze).`,
        automaticGrant: true,
    }
}

function buildRedeemRequestWhere(input: {
    status?: ShopRedeemRequestStatus
    fulfillment?: AdminRedeemFulfillmentState
}): Prisma.ShopRedeemRequestWhereInput | undefined {
    if (input.fulfillment === 'awaiting') {
        return {
            status: ShopRedeemRequestStatus.APPROVED,
            fulfilledAt: null,
        }
    }

    if (input.fulfillment === 'fulfilled') {
        return {
            status: ShopRedeemRequestStatus.APPROVED,
            fulfilledAt: { not: null },
        }
    }

    return input.status ? { status: input.status } : undefined
}
