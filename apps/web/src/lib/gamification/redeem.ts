import { Prisma, ShopRedeemRequestStatus } from '@fuxie/database'

import { getWalletSummary, type EconomyDbClient, type WalletSummary } from './fucoin'
import { getFuxieShopCatalogItem, type FuxieShopCatalogItem } from './shop'

export const FUXIE_SHOP_REDEEM_SPEND_ENABLED = false

export type ShopRedeemStatus =
    | 'preview_locked'
    | 'not_found'
    | 'insufficient_funds'
    | 'pending_created'
    | 'pending_existing'

export interface ShopRedeemRequestSummary {
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
}

export interface ShopRedeemPreviewContract {
    status: ShopRedeemStatus
    spendEnabled: boolean
    confirmationRequired: boolean
    canAfford: boolean
    wouldSpend: number
    missingFucoin: number
    wallet: WalletSummary
    item: Pick<FuxieShopCatalogItem, 'id' | 'title' | 'category' | 'categoryLabel' | 'benefit' | 'cost' | 'status' | 'statusLabel' | 'walletProgress'> | null
    request?: ShopRedeemRequestSummary | null
    guard: {
        reason: ShopRedeemStatus
        message: string
        policy: string[]
    }
}

export class ShopRedeemError extends Error {
    constructor(
        message: string,
        public readonly status: number,
        public readonly code: ShopRedeemStatus,
        public readonly payload?: ShopRedeemPreviewContract
    ) {
        super(message)
        this.name = 'ShopRedeemError'
    }
}

export async function buildShopRedeemPreviewContract(
    tx: EconomyDbClient,
    input: { userId: string; itemId: string }
): Promise<ShopRedeemPreviewContract> {
    const wallet = await getWalletSummary(tx, input.userId)
    const item = getFuxieShopCatalogItem(input.itemId, wallet.balance)

    if (!item) {
        throw new ShopRedeemError('Shop item not found', 404, 'not_found')
    }

    const missingFucoin = Math.max(0, item.cost - wallet.balance)

    return {
        status: 'preview_locked',
        spendEnabled: FUXIE_SHOP_REDEEM_SPEND_ENABLED,
        confirmationRequired: true,
        canAfford: item.canAfford,
        wouldSpend: item.cost,
        missingFucoin,
        wallet,
        item: {
            id: item.id,
            title: item.title,
            category: item.category,
            categoryLabel: item.categoryLabel,
            benefit: item.benefit,
            cost: item.cost,
            status: item.status,
            statusLabel: item.statusLabel,
            walletProgress: item.walletProgress,
        },
        guard: {
            reason: 'preview_locked',
            message: 'Redeem request có thể vào hàng chờ, nhưng spend/fulfillment thật vẫn đang khóa.',
            policy: item.redeemPreview.policy,
        },
    }
}

export async function createShopRedeemRequest(
    tx: EconomyDbClient,
    input: { userId: string; itemId: string }
): Promise<ShopRedeemPreviewContract> {
    const contract = await buildShopRedeemPreviewContract(tx, input)
    const item = getFuxieShopCatalogItem(input.itemId, contract.wallet.balance)

    if (!item) {
        throw new ShopRedeemError('Shop item not found', 404, 'not_found')
    }

    if (!contract.canAfford) {
        throw new ShopRedeemError(
            'Insufficient Fucoin for this reward',
            402,
            'insufficient_funds',
            {
                ...contract,
                status: 'insufficient_funds',
                guard: {
                    ...contract.guard,
                    reason: 'insufficient_funds',
                    message: `Cần thêm ${contract.missingFucoin.toLocaleString('vi-VN')} Fucoin trước khi tạo request đổi quà.`,
                },
            }
        )
    }

    const existing = await tx.shopRedeemRequest.findFirst({
        where: {
            userId: input.userId,
            itemId: item.id,
            status: ShopRedeemRequestStatus.PENDING,
        },
        select: shopRedeemRequestSelect,
    })

    if (existing) {
        return withRedeemRequest(contract, existing, 'pending_existing')
    }

    try {
        const request = await tx.shopRedeemRequest.create({
            data: {
                userId: input.userId,
                itemId: item.id,
                itemTitle: item.title,
                itemCategory: item.category,
                itemBenefit: item.benefit,
                cost: item.cost,
                walletBalanceAtRequest: contract.wallet.balance,
                status: ShopRedeemRequestStatus.PENDING,
                statusReason: 'Awaiting approval. No Fucoin has been spent yet.',
                itemSnapshot: buildItemSnapshot(item, contract.wallet.balance),
            },
            select: shopRedeemRequestSelect,
        })

        return withRedeemRequest(contract, request, 'pending_created')
    } catch (error) {
        if (isUniqueConstraintError(error)) {
            const request = await tx.shopRedeemRequest.findFirstOrThrow({
                where: {
                    userId: input.userId,
                    itemId: item.id,
                    status: ShopRedeemRequestStatus.PENDING,
                },
                select: shopRedeemRequestSelect,
            })

            return withRedeemRequest(contract, request, 'pending_existing')
        }

        throw error
    }
}

const shopRedeemRequestSelect = {
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
} satisfies Prisma.ShopRedeemRequestSelect

export async function listUserShopRedeemRequests(
    tx: EconomyDbClient,
    input: {
        userId: string
        status?: ShopRedeemRequestStatus
        take?: number
    }
): Promise<ShopRedeemRequestSummary[]> {
    return tx.shopRedeemRequest.findMany({
        where: {
            userId: input.userId,
            ...(input.status ? { status: input.status } : {}),
        },
        orderBy: { requestedAt: 'desc' },
        take: input.take ?? 6,
        select: shopRedeemRequestSelect,
    })
}

function withRedeemRequest(
    contract: ShopRedeemPreviewContract,
    request: ShopRedeemRequestSummary,
    status: 'pending_created' | 'pending_existing'
): ShopRedeemPreviewContract {
    return {
        ...contract,
        status,
        request,
        guard: {
            ...contract.guard,
            reason: status,
            message: status === 'pending_created'
                ? 'Đã tạo request đổi quà ở trạng thái pending. Fucoin chưa bị trừ.'
                : 'Request đổi quà pending đã tồn tại. Fucoin chưa bị trừ.',
        },
    }
}

function buildItemSnapshot(item: FuxieShopCatalogItem, walletBalance: number): Prisma.InputJsonValue {
    return {
        id: item.id,
        title: item.title,
        category: item.category,
        categoryLabel: item.categoryLabel,
        benefit: item.benefit,
        cost: item.cost,
        walletBalanceAtRequest: walletBalance,
        status: item.status,
        previewTag: item.previewTag,
    }
}

function isUniqueConstraintError(error: unknown) {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}
