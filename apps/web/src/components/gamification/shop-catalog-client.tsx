'use client'

import Image from 'next/image'
import { useMemo, useState, useTransition } from 'react'
import {
    ArrowRight,
    BookOpenCheck,
    CheckCircle2,
    Clock3,
    Coins,
    Gift,
    Info,
    Loader2,
    LockKeyhole,
    Palette,
    ShieldCheck,
    Sparkles,
    Trophy,
    X,
} from 'lucide-react'

import {
    FUXIE_3D_ASSETS,
    FuxieRoleMascot,
} from '@/components/gamification/quest-visuals'
import { REWARD_ASSETS, getShopItemAssetSrc } from '@/components/gamification/reward-assets'
import {
    FuxieBadge,
    FuxieLevelTabs,
    FuxiePanel,
    FuxieProgressBar,
    FuxieQuestCard,
    fuxieButtonClass,
    fx,
} from '@/components/ui/fuxie-ui'
import type {
    FuxieShopCatalogItem,
    FuxieShopCategory,
    FuxieRewardInventory,
} from '@/lib/gamification/shop'

type ShopFilter = 'all' | FuxieShopCategory
type RedeemFeedbackTone = 'success' | 'warning' | 'error'
type RedeemRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
type LearnerRewardInventoryData = Omit<FuxieRewardInventory, 'lastFulfilledReward' | 'streakFreezeTimeline'> & {
    lastFulfilledReward: {
        itemId: string
        itemTitle: string
        fulfilledAt: string
    } | null
    streakFreezeTimeline: Array<Omit<FuxieRewardInventory['streakFreezeTimeline'][number], 'usedAt'> & {
        usedAt: string
    }>
}

interface LearnerRedeemRequest {
    id: string
    itemId: string
    itemTitle: string
    itemCategory: string
    itemBenefit: string
    cost: number
    walletBalanceAtRequest: number
    status: RedeemRequestStatus
    statusReason: string | null
    requestedAt: string
    reviewedAt: string | null
    fulfilledAt: string | null
    updatedAt: string
}

interface ShopCatalogClientProps {
    wallet: {
        balance: number
        lifetimeEarned: number
        lifetimeSpent: number
    }
    dailyFucoin: {
        earnedToday: number
        dailyCap: number
        remaining: number
        capReached: boolean
    }
    rewardInventory: LearnerRewardInventoryData
    catalog: FuxieShopCatalogItem[]
    recentRequests: LearnerRedeemRequest[]
}

interface RedeemFeedback {
    tone: RedeemFeedbackTone
    title: string
    message: string
    requestId?: string
}

interface ShopRequestCelebrationData {
    itemId: string
    itemTitle: string
    cost: number
    requestId: string
    status: RedeemRequestStatus
    assetSrc: string
}

const FILTERS: ShopFilter[] = ['all', 'support', 'cosmetic', 'learning', 'real_gift']

const FILTER_LABELS: Record<ShopFilter, string> = {
    all: 'Tất cả',
    support: 'Hint',
    cosmetic: 'Mascot',
    learning: 'Unlock',
    real_gift: 'Gift',
}

const CATEGORY_META: Record<FuxieShopCategory, {
    icon: typeof Gift
    tone: 'brand' | 'reward' | 'success' | 'neutral'
    surface: string
}> = {
    support: {
        icon: Sparkles,
        tone: 'reward',
        surface: 'from-[#FFF7D6] via-white to-[#F3FBFF]',
    },
    cosmetic: {
        icon: Palette,
        tone: 'brand',
        surface: 'from-[#F3FBFF] via-white to-[#EAFBF8]',
    },
    learning: {
        icon: BookOpenCheck,
        tone: 'success',
        surface: 'from-[#EAFBF8] via-white to-[#F3FBFF]',
    },
    real_gift: {
        icon: Trophy,
        tone: 'neutral',
        surface: 'from-white via-[#F3FBFF] to-[#FFF7D6]',
    },
}

export function ShopCatalogClient({
    wallet,
    dailyFucoin,
    rewardInventory,
    catalog,
    recentRequests,
}: ShopCatalogClientProps) {
    const [activeFilter, setActiveFilter] = useState<ShopFilter>('all')
    const [previewItem, setPreviewItem] = useState<FuxieShopCatalogItem | null>(null)
    const [redeemFeedbackByItem, setRedeemFeedbackByItem] = useState<Record<string, RedeemFeedback>>({})
    const [redeemRequests, setRedeemRequests] = useState(recentRequests)
    const [requestCelebration, setRequestCelebration] = useState<ShopRequestCelebrationData | null>(null)
    const filteredCatalog = useMemo(() => {
        if (activeFilter === 'all') return catalog
        return catalog.filter((item) => item.category === activeFilter)
    }, [activeFilter, catalog])
    const nextItem = catalog.find((item) => !item.canAfford) ?? catalog[catalog.length - 1]
    const affordableCount = catalog.filter((item) => item.canAfford).length

    const handleFeedback = (itemId: string, feedback: RedeemFeedback) => {
        setRedeemFeedbackByItem((current) => ({
            ...current,
            [itemId]: feedback,
        }))
    }

    const handleRequestUpsert = (request: LearnerRedeemRequest) => {
        setRequestCelebration({
            itemId: request.itemId,
            itemTitle: request.itemTitle,
            cost: request.cost,
            requestId: request.id,
            status: request.status,
            assetSrc: getShopItemAssetSrc(request.itemId, request.itemCategory),
        })
        setRedeemRequests((current) => {
            const withoutCurrent = current.filter((item) => item.id !== request.id)
            return [request, ...withoutCurrent].slice(0, 6)
        })
    }

    return (
        <div className="min-h-[100dvh] bg-[#F7FBFD] px-4 py-6 sm:px-6 lg:px-8">
            <section className="relative overflow-hidden rounded-[28px] border border-white/80 bg-gradient-to-br from-[#F3FBFF] via-white to-[#D8F0F0] p-5 shadow-[0_24px_70px_rgba(60,120,168,0.14)] ring-1 ring-[#CCE4F0]/70 sm:p-6">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-stretch">
                    <div className="min-w-0">
                        <div className="mb-4 flex flex-wrap items-center gap-2">
                            <FuxieBadge tone="reward">
                                <Coins className="h-3.5 w-3.5" />
                                {wallet.balance.toLocaleString('vi-VN')} Fucoin
                            </FuxieBadge>
                            <FuxieBadge tone="brand">Shop Catalog v1</FuxieBadge>
                            <FuxieBadge tone="neutral">Pending Request v1</FuxieBadge>
                        </div>

                        <h1 className="max-w-3xl text-3xl font-black tracking-normal text-[#173B56] sm:text-4xl">
                            Fucoin dùng để mở phần thưởng nào?
                        </h1>
                        <p className="hidden">
                            Khi đủ Fucoin, em có thể tạo request đổi quà để admin review. Request pending chưa trừ ví, chưa giao quà và chưa unlock bài học.
                        </p>

                        <p className="mt-3 max-w-3xl text-sm font-semibold leading-relaxed text-[#3C78A8] sm:text-base">
                            Pending request chua tru vi. Khi admin approve, Fucoin se duoc spend qua ledger; khi fulfill, reward duoc ho tro se xuat hien trong inventory.
                        </p>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <ShopHeroStat label="Ví hiện có" value={wallet.balance.toLocaleString('vi-VN')} detail="Fucoin sẵn sàng" />
                            <ShopHeroStat label="Có thể request" value={`${affordableCount}/${catalog.length}`} detail="Đủ Fucoin để vào hàng chờ" />
                            <ShopHeroStat label="Hôm nay" value={`${dailyFucoin.earnedToday}/${dailyFucoin.dailyCap}`} detail="Daily learning cap" />
                            <ShopHeroStat label="Inventory" value={String(rewardInventory.streakFreezeAvailable)} detail="Streak Freeze ready" />
                        </div>
                    </div>

                    <FuxiePanel variant="soft" className="flex min-w-0 flex-col justify-between p-4">
                        <div>
                            <p className="text-xs font-black uppercase tracking-wide text-[#3C78A8]/70">Next target</p>
                            <h2 className="mt-1 text-xl font-black text-[#173B56]">{nextItem?.title ?? 'Tích Fucoin'}</h2>
                            <p className="mt-2 text-sm font-semibold leading-relaxed text-[#3C78A8]">
                                {nextItem?.redeemPreview.nextMilestone ?? 'Catalog đã sẵn sàng cho batch redeem tiếp theo.'}
                            </p>
                        </div>
                        <div className="mt-5">
                            <div className="mb-2 flex items-center justify-between text-xs font-black text-[#C67A00]">
                                <span>Fucoin hôm nay</span>
                                <span>{dailyFucoin.remaining} còn lại</span>
                            </div>
                            <FuxieProgressBar
                                value={dailyFucoin.dailyCap > 0 ? Math.round((dailyFucoin.earnedToday / dailyFucoin.dailyCap) * 100) : 0}
                                tone="reward"
                            />
                        </div>
                    </FuxiePanel>
                </div>
            </section>

            <LearnerRewardInventory inventory={rewardInventory} />
            {requestCelebration ? <ShopRequestCelebration celebration={requestCelebration} /> : null}
            <LearnerRedeemHistory requests={redeemRequests} />

            <section className="mt-6">
                <FuxieLevelTabs
                    items={FILTERS}
                    activeItem={activeFilter}
                    onSelect={setActiveFilter}
                    getLabel={(item) => FILTER_LABELS[item]}
                    getCount={(item) => item === 'all' ? catalog.length : catalog.filter((catalogItem) => catalogItem.category === item).length}
                    ariaLabel="Shop category filter"
                    className="mb-4"
                />

                <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                    {filteredCatalog.map((item) => (
                        <ShopItemCard
                            key={item.id}
                            item={item}
                            walletBalance={wallet.balance}
                            feedback={redeemFeedbackByItem[item.id]}
                            recentlyRequested={requestCelebration?.itemId === item.id}
                            onPreview={() => setPreviewItem(item)}
                        />
                    ))}
                </div>
            </section>

            <RedeemPreviewModal
                item={previewItem}
                walletBalance={wallet.balance}
                feedback={previewItem ? redeemFeedbackByItem[previewItem.id] : undefined}
                onFeedback={handleFeedback}
                onRequestUpsert={handleRequestUpsert}
                onClose={() => setPreviewItem(null)}
            />
        </div>
    )
}

function ShopHeroStat({
    label,
    value,
    detail,
}: {
    label: string
    value: string
    detail: string
}) {
    return (
        <div className="rounded-2xl bg-white/75 px-4 py-3 shadow-sm ring-1 ring-white/90">
            <p className="text-[11px] font-black uppercase tracking-wide text-[#3C78A8]/70">{label}</p>
            <p className="mt-1 text-2xl font-black text-[#173B56]">{value}</p>
            <p className="mt-0.5 truncate text-xs font-semibold text-[#3C78A8]/75">{detail}</p>
        </div>
    )
}

function ShopRequestCelebration({ celebration }: { celebration: ShopRequestCelebrationData }) {
    return (
        <section className="fuxie-shop-request-panel mt-6 overflow-hidden rounded-[28px] bg-gradient-to-r from-[#EAFBF8] via-white to-[#FFF7D6] p-4 shadow-sm ring-1 ring-[#2EC4B6]/25 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="relative grid h-[76px] w-[116px] shrink-0 place-items-center">
                        <FuxieRoleMascot
                            src={FUXIE_3D_ASSETS.shopkeeper}
                            alt="Fuxie shopkeeper"
                            size={72}
                            motion="reward"
                            className="absolute left-0 rounded-3xl bg-white/75 p-1 ring-1 ring-white"
                        />
                        <span className="absolute right-0 grid h-14 w-14 place-items-center rounded-2xl bg-white/90 p-1.5 shadow-sm ring-1 ring-[#FFD166]/55">
                            <Image
                                src={celebration.assetSrc}
                                alt=""
                                width={48}
                                height={48}
                                className="h-full w-full object-contain"
                            />
                        </span>
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-black uppercase tracking-wide text-[#148F7D]">Request added to queue</p>
                        <h2 className="mt-1 line-clamp-2 text-xl font-black text-[#173B56]">
                            {celebration.itemTitle}
                        </h2>
                        <p className="mt-1 text-sm font-semibold text-[#3C78A8]">
                            Fucoin chua bi tru. Admin se review request nay truoc khi xu ly reward.
                        </p>
                    </div>
                </div>
                <div className="grid shrink-0 grid-cols-2 gap-2 sm:min-w-[260px]">
                    <div className="rounded-2xl bg-[#FFF4D6] px-3 py-2 ring-1 ring-[#FFD166]/55">
                        <p className="text-[10px] font-black uppercase tracking-wide text-[#C67A00]/80">Cost</p>
                        <p className="mt-0.5 text-lg font-black text-[#C67A00]">{celebration.cost.toLocaleString('vi-VN')} Fu</p>
                    </div>
                    <div className="rounded-2xl bg-[#F3FBFF] px-3 py-2 ring-1 ring-[#CCE4F0]">
                        <p className="text-[10px] font-black uppercase tracking-wide text-[#3C78A8]/70">Status</p>
                        <p className="mt-0.5 text-lg font-black text-[#173B56]">{celebration.status.toLowerCase()}</p>
                    </div>
                </div>
            </div>
        </section>
    )
}

function LearnerRewardInventory({ inventory }: { inventory: LearnerRewardInventoryData }) {
    const lastFulfilled = inventory.lastFulfilledReward

    return (
        <section className="mt-6">
            <FuxiePanel className="overflow-hidden p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 gap-4">
                        <div className="hidden h-24 w-24 shrink-0 place-items-center rounded-[24px] bg-[#F3FBFF] p-2 shadow-sm ring-1 ring-[#CCE4F0]/80 sm:grid">
                            <Image
                                src={REWARD_ASSETS.inventoryMarketProp}
                                alt=""
                                width={88}
                                height={88}
                                className="h-full w-full object-contain drop-shadow-sm"
                            />
                        </div>
                        <div className="min-w-0">
                        <div className="inline-flex items-center gap-2 rounded-full bg-[#EAFBF8] px-3 py-1 text-xs font-black uppercase tracking-wide text-[#2E9F92]">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Reward Inventory
                        </div>
                        <h2 className="mt-3 text-xl font-black text-[#173B56]">Phan thuong da ve tai khoan</h2>
                        <p className="mt-1 max-w-2xl text-sm font-semibold leading-relaxed text-[#3C78A8]">
                            Fulfilled reward se hien o day de em biet minh dang so huu gi. Streak Freeze co the duoc dung boi he thong streak khi can bao ve chuoi hoc.
                        </p>
                        </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[480px]">
                        <InventoryStat
                            label="Streak Freeze"
                            value={inventory.streakFreezeAvailable}
                            detail={`${inventory.streakFreezeUsed} used`}
                            tone="brand"
                        />
                        <InventoryStat
                            label="Awaiting"
                            value={inventory.awaitingFulfillment}
                            detail="approved, not fulfilled"
                            tone="reward"
                        />
                        <InventoryStat
                            label="Fulfilled"
                            value={inventory.fulfilledRewards}
                            detail={`${inventory.fulfilledStreakFreeze} freeze grants`}
                            tone="success"
                        />
                    </div>
                </div>

                <div className="mt-4 rounded-2xl bg-[#F3FBFF] p-4 ring-1 ring-[#CCE4F0]/70">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-black text-[#173B56]">
                                {lastFulfilled ? `Gan nhat: ${lastFulfilled.itemTitle}` : 'Chua co reward nao duoc fulfilled'}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-[#3C78A8]">
                                {lastFulfilled
                                    ? `Fulfilled ${new Date(lastFulfilled.fulfilledAt).toLocaleString('vi-VN')}`
                                    : 'Tao request trong shop, doi admin approve va fulfill de inventory sang len.'}
                            </p>
                        </div>
                        <FuxieBadge tone={inventory.streakFreezeAvailable > 0 ? 'success' : 'neutral'} className="normal-case tracking-normal">
                            {inventory.streakFreezeAvailable > 0 ? 'Protected' : 'No freeze ready'}
                        </FuxieBadge>
                    </div>
                </div>

                <StreakFreezeTimeline timeline={inventory.streakFreezeTimeline} />
            </FuxiePanel>
        </section>
    )
}

function StreakFreezeTimeline({
    timeline,
}: {
    timeline: LearnerRewardInventoryData['streakFreezeTimeline']
}) {
    return (
        <div className="mt-4 rounded-2xl bg-white/85 p-4 ring-1 ring-[#CCE4F0]/70">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-sm font-black text-[#173B56]">Freeze timeline</p>
                    <p className="mt-1 text-xs font-semibold text-[#3C78A8]">
                        Recent receipts when Streak Freeze protected a learning day.
                    </p>
                </div>
                <FuxieBadge tone={timeline.length > 0 ? 'success' : 'neutral'} className="shrink-0 normal-case tracking-normal">
                    {timeline.length > 0 ? `${timeline.length} saved` : 'No receipt'}
                </FuxieBadge>
            </div>

            {timeline.length > 0 ? (
                <div className="mt-3 grid gap-3 lg:grid-cols-3">
                    {timeline.map((item) => (
                        <div key={item.id} className="rounded-2xl bg-[#F3FBFF] p-3 ring-1 ring-[#CCE4F0]/70">
                            <div className="flex items-start gap-3">
                                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-[#EAFBF8] text-[#148F7D] ring-1 ring-[#2EC4B6]/25">
                                    <ShieldCheck className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-black text-[#173B56]">
                                        Saved {item.protectedStreak}-day streak
                                    </p>
                                    <p className="mt-1 text-xs font-semibold leading-relaxed text-[#3C78A8]">
                                        Missed {item.missedDays} day{item.missedDays === 1 ? '' : 's'}.
                                        {' '}
                                        {item.freezesRemaining} freeze left.
                                    </p>
                                    <p className="mt-2 truncate text-[11px] font-bold uppercase tracking-wide text-[#3C78A8]/65">
                                        {item.sourceType}: {item.sourceId}
                                    </p>
                                    <p className="mt-1 text-[11px] font-semibold text-slate-400">
                                        {new Date(item.usedAt).toLocaleString('vi-VN')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="mt-3 rounded-2xl bg-[#F7FBFD] p-3 text-sm font-semibold leading-relaxed text-[#3C78A8] ring-1 ring-[#CCE4F0]/60">
                    No Streak Freeze has been used yet. When one protects the learner, the receipt will appear here.
                </div>
            )}
        </div>
    )
}

function InventoryStat({
    label,
    value,
    detail,
    tone,
}: {
    label: string
    value: number
    detail: string
    tone: 'brand' | 'reward' | 'success'
}) {
    const toneClass = {
        brand: 'bg-[#F3FBFF] text-[#3C78A8] ring-[#CCE4F0]/80',
        reward: 'bg-[#FFF7D6] text-[#C67A00] ring-[#FFD166]/55',
        success: 'bg-[#EAFBF8] text-[#148F7D] ring-[#2EC4B6]/25',
    }[tone]

    return (
        <div className={fx('rounded-2xl px-4 py-3 ring-1', toneClass)}>
            <p className="text-[11px] font-black uppercase tracking-wide opacity-75">{label}</p>
            <p className="mt-1 text-2xl font-black">{value.toLocaleString('vi-VN')}</p>
            <p className="mt-0.5 truncate text-xs font-semibold opacity-80">{detail}</p>
        </div>
    )
}

function LearnerRedeemHistory({ requests }: { requests: LearnerRedeemRequest[] }) {
    const pendingCount = requests.filter((request) => request.status === 'PENDING').length
    const awaitingCount = requests.filter((request) => request.status === 'APPROVED' && !request.fulfilledAt).length

    return (
        <section className="mt-6">
            <FuxiePanel className="p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-[#EAFBF8] px-3 py-1 text-xs font-black uppercase tracking-wide text-[#2E9F92]">
                            <Clock3 className="h-3.5 w-3.5" />
                            Request history
                        </div>
                        <h2 className="mt-3 text-xl font-black text-[#173B56]">Hàng chờ đổi quà của em</h2>
                        <p className="mt-1 max-w-2xl text-sm font-semibold leading-relaxed text-[#3C78A8]">
                            Pending là đang chờ review. Approved là Fucoin đã được spend qua ledger và đang chờ fulfill. Fulfilled là reward đã được xử lý hoặc đưa vào inventory nếu được hỗ trợ.
                        </p>
                    </div>
                    <div className="rounded-2xl bg-[#F3FBFF] px-4 py-3 text-sm ring-1 ring-[#CCE4F0]/80">
                        <p className="text-2xl font-black text-[#173B56]">{pendingCount}</p>
                        <p className="text-xs font-black text-[#2E9F92]">{awaitingCount} awaiting</p>
                        <p className="font-semibold text-[#3C78A8]">đang pending</p>
                    </div>
                </div>

                {requests.length > 0 ? (
                    <div className="mt-4 grid gap-3 lg:grid-cols-3">
                        {requests.slice(0, 3).map((request) => (
                            <RedeemRequestMiniCard key={request.id} request={request} />
                        ))}
                    </div>
                ) : (
                    <div className="mt-4 rounded-2xl bg-white/80 p-4 text-sm font-semibold leading-relaxed text-slate-600 ring-1 ring-white">
                        Chưa có request đổi quà. Khi đủ Fucoin, em có thể tạo request pending để admin review.
                    </div>
                )}
            </FuxiePanel>
        </section>
    )
}

function RedeemRequestMiniCard({ request }: { request: LearnerRedeemRequest }) {
    const meta = getRequestStatusMeta(request)
    const assetSrc = getShopItemAssetSrc(request.itemId, request.itemCategory)

    return (
        <div className={fx('rounded-2xl bg-white p-4 ring-1 ring-[#CCE4F0]/70', request.status === 'PENDING' && 'fuxie-shop-pending-card')}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#F3FBFF] p-1.5 ring-1 ring-[#CCE4F0]/70">
                        <Image src={assetSrc} alt="" width={40} height={40} className="h-full w-full object-contain" />
                    </span>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-black text-[#173B56]">{request.itemTitle}</p>
                        <p className="mt-1 text-xs font-semibold text-[#3C78A8]">{request.cost.toLocaleString('vi-VN')} Fucoin</p>
                    </div>
                </div>
                <span className={fx('shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide', meta.className)}>
                    {meta.label}
                </span>
            </div>
            <p className="mt-3 line-clamp-2 text-xs font-semibold leading-relaxed text-slate-500">
                {request.statusReason ?? request.itemBenefit}
            </p>
            <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                {new Date(request.requestedAt).toLocaleString('vi-VN')}
            </p>
        </div>
    )
}

function getRequestStatusMeta(request: LearnerRedeemRequest) {
    if (request.status === 'APPROVED' && request.fulfilledAt) {
        return {
            label: 'Fulfilled',
            className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
        }
    }

    if (request.status === 'APPROVED') {
        return {
            label: 'Awaiting',
            className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
        }
    }

    if (request.status === 'REJECTED') {
        return {
            label: 'Rejected',
            className: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100',
        }
    }

    if (request.status === 'CANCELLED') {
        return {
            label: 'Cancelled',
            className: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
        }
    }

    return {
        label: 'Pending',
        className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
    }
}

function ShopItemCard({
    item,
    walletBalance,
    feedback,
    recentlyRequested,
    onPreview,
}: {
    item: FuxieShopCatalogItem
    walletBalance: number
    feedback?: RedeemFeedback
    recentlyRequested: boolean
    onPreview: () => void
}) {
    const meta = CATEGORY_META[item.category]
    const remaining = Math.max(0, item.cost - walletBalance)
    const assetSrc = getShopItemAssetSrc(item.id, item.category)

    return (
        <FuxieQuestCard
            interactive={false}
            className={fx(
                `relative overflow-hidden p-4 ring-1 bg-gradient-to-br ${meta.surface}`,
                recentlyRequested
                    ? 'fuxie-shop-request-pop border-[#FFB703]/70 ring-[#FFD166]/70'
                    : item.canAfford
                        ? 'fuxie-shop-ready-card border-[#FFD166]/70 ring-[#FFD166]/50'
                        : 'ring-[#CCE4F0]/70'
            )}
        >
            {recentlyRequested ? (
                <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                    {[0, 1, 2, 3, 4].map((index) => (
                        <span
                            key={index}
                            className="fuxie-coin-burst absolute h-2.5 w-2.5 rounded-full bg-[#FFB703] shadow-[0_0_0_3px_rgba(255,183,3,0.18)]"
                            style={{
                                left: `${20 + index * 13}%`,
                                top: index % 2 === 0 ? '24%' : '72%',
                                animationDelay: `${index * 80}ms`,
                            }}
                        />
                    ))}
                </div>
            ) : null}
            <div className="flex h-full min-w-0 flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                    <span className={fx(
                        'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/85 p-1.5 shadow-sm ring-1 ring-white/90',
                        item.canAfford && 'fuxie-shop-ready-icon'
                    )}>
                        <Image
                            src={assetSrc}
                            alt=""
                            width={48}
                            height={48}
                            className="h-full w-full object-contain"
                        />
                    </span>
                    <div className="flex flex-wrap justify-end gap-1.5">
                        <FuxieBadge tone={meta.tone} className="normal-case tracking-normal">{item.categoryLabel}</FuxieBadge>
                        <FuxieBadge tone="neutral" className="normal-case tracking-normal">
                            <LockKeyhole className="h-3 w-3" />
                            Pending
                        </FuxieBadge>
                    </div>
                </div>

                <div className="min-w-0">
                    <h2 className="text-lg font-black leading-tight text-slate-950">{item.title}</h2>
                    <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600">{item.description}</p>
                    <p className="mt-2 inline-flex rounded-full bg-white/75 px-3 py-1 text-xs font-black text-[#3C78A8] ring-1 ring-white/90">
                        {item.benefit}
                    </p>
                </div>

                <div className="mt-auto rounded-2xl bg-white/75 p-3 ring-1 ring-white/90">
                    <div className="mb-2 flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-black uppercase tracking-wide text-[#C67A00]">Giá</p>
                            <p className="text-xl font-black text-[#173B56]">{item.cost.toLocaleString('vi-VN')} Fu</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-black uppercase tracking-wide text-[#3C78A8]/70">{item.statusLabel}</p>
                            <p className="text-sm font-black text-[#3C78A8]">{item.walletProgress}%</p>
                        </div>
                    </div>
                    <FuxieProgressBar value={item.walletProgress} tone={item.canAfford ? 'reward' : 'brand'} />
                    <p className="mt-2 text-xs font-semibold text-slate-500">
                        {item.canAfford
                            ? 'Ví đã đủ Fucoin để tạo request pending.'
                            : `Cần thêm ${remaining.toLocaleString('vi-VN')} Fucoin.`}
                    </p>
                    {feedback ? <RedeemFeedbackBox feedback={feedback} compact /> : null}
                    <button
                        type="button"
                        onClick={onPreview}
                        className={fuxieButtonClass(item.canAfford ? 'reward' : 'secondary', 'sm', 'mt-3 w-full overflow-hidden')}
                    >
                        <ShieldCheck className="h-4 w-4" />
                        {item.redeemPreview.ctaLabel}
                    </button>
                </div>
            </div>
        </FuxieQuestCard>
    )
}

function RedeemPreviewModal({
    item,
    walletBalance,
    feedback,
    onFeedback,
    onRequestUpsert,
    onClose,
}: {
    item: FuxieShopCatalogItem | null
    walletBalance: number
    feedback?: RedeemFeedback
    onFeedback: (itemId: string, feedback: RedeemFeedback) => void
    onRequestUpsert: (request: LearnerRedeemRequest) => void
    onClose: () => void
}) {
    const [isPending, startTransition] = useTransition()

    if (!item) return null

    const remaining = Math.max(0, item.cost - walletBalance)
    const progressLabel = item.canAfford
        ? 'Ví đã đủ Fucoin để tạo request pending.'
        : `Cần thêm ${remaining.toLocaleString('vi-VN')} Fucoin để đủ điều kiện.`

    const createRedeemRequest = () => {
        startTransition(async () => {
            try {
                const response = await fetch(`/api/v1/rewards/shop/${item.id}/redeem`, {
                    method: 'POST',
                })
                const payload = await response.json()

                if (payload.success) {
                    const status = payload.data?.status
                    const requestId = payload.data?.request?.id
                    onFeedback(item.id, {
                        tone: 'success',
                        title: status === 'pending_existing' ? 'Request đã có trong hàng chờ' : 'Đã tạo request pending',
                        message: payload.data?.guard?.message ?? 'Fucoin chưa bị trừ. Admin sẽ review request này.',
                        requestId,
                    })
                    if (payload.data?.request) {
                        onRequestUpsert(normalizeRedeemRequest(payload.data.request, item))
                    }
                    return
                }

                if (payload.code === 'insufficient_funds') {
                    onFeedback(item.id, {
                        tone: 'warning',
                        title: 'Chưa đủ Fucoin',
                        message: payload.data?.guard?.message ?? `Cần thêm ${remaining.toLocaleString('vi-VN')} Fucoin.`,
                    })
                    return
                }

                throw new Error(payload.error ?? 'Không tạo được request đổi quà.')
            } catch (error) {
                onFeedback(item.id, {
                    tone: 'error',
                    title: 'Request chưa được tạo',
                    message: error instanceof Error ? error.message : 'Có lỗi khi tạo request đổi quà.',
                })
            }
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/35 px-4 py-4 backdrop-blur-sm sm:items-center">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="redeem-preview-title"
                className="fuxie-shop-modal-in max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_28px_90px_rgba(15,23,42,0.22)] sm:p-6"
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                            <FuxieBadge tone="reward">
                                <Coins className="h-3.5 w-3.5" />
                                {item.cost.toLocaleString('vi-VN')} Fu
                            </FuxieBadge>
                            <FuxieBadge tone="neutral">{item.redeemPreview.stageLabel}</FuxieBadge>
                        </div>
                        <h2 id="redeem-preview-title" className="text-2xl font-black leading-tight text-[#173B56]">
                            Request đổi quà: {item.title}
                        </h2>
                        <p className="mt-2 text-sm font-semibold leading-relaxed text-[#3C78A8]">
                            {item.redeemPreview.confirmationCopy}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Đóng preview đổi quà"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F3FBFF] text-[#3C78A8] ring-1 ring-[#CCE4F0]/80 transition hover:bg-white"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <ShopHeroStat label="Ví của em" value={walletBalance.toLocaleString('vi-VN')} detail="Fucoin hiện có" />
                    <ShopHeroStat label="Giá item" value={item.cost.toLocaleString('vi-VN')} detail={item.categoryLabel} />
                    <ShopHeroStat label="Tiến độ" value={`${item.walletProgress}%`} detail={item.statusLabel} />
                </div>

                <div className="mt-5 rounded-2xl bg-[#F3FBFF] p-4 ring-1 ring-[#CCE4F0]/80">
                    <div className="mb-2 flex items-center justify-between gap-3 text-xs font-black text-[#3C78A8]">
                        <span>{progressLabel}</span>
                        <span>{item.walletProgress}%</span>
                    </div>
                    <FuxieProgressBar value={item.walletProgress} tone={item.canAfford ? 'reward' : 'brand'} />
                </div>

                {feedback ? <RedeemFeedbackBox feedback={feedback} /> : null}

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {item.redeemPreview.policy.map((policy) => (
                        <div key={policy} className="flex gap-3 rounded-2xl bg-white p-3 ring-1 ring-slate-100">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EAFBF8] text-[#2E9F92]">
                                <CheckCircle2 className="h-4 w-4" />
                            </span>
                            <p className="text-sm font-semibold leading-relaxed text-slate-600">{policy}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-5 rounded-2xl bg-[#FFF7D6] p-4 ring-1 ring-[#FFD166]/55">
                    <div className="flex gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFB703] text-white">
                            <Info className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <p className="text-sm font-black text-[#8A5A00]">Request pending chưa phải redeem hoàn tất</p>
                            <p className="mt-1 text-sm font-semibold leading-relaxed text-[#8A5A00]/80">
                                Tạo request chỉ đưa item vào hàng chờ admin review. Fucoin chưa bị trừ, chưa giao quà và chưa unlock nội dung.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        disabled={!item.canAfford || isPending}
                        onClick={createRedeemRequest}
                        className={fuxieButtonClass(item.canAfford ? 'reward' : 'secondary', 'md', 'disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-56')}
                    >
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                        {item.canAfford ? 'Tạo request pending' : 'Chưa đủ Fucoin'}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className={fuxieButtonClass('secondary', 'md', 'sm:min-w-36')}
                    >
                        Đã hiểu
                        <ArrowRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}

function normalizeRedeemRequest(
    request: Partial<LearnerRedeemRequest>,
    item: FuxieShopCatalogItem
): LearnerRedeemRequest {
    const now = new Date().toISOString()

    return {
        id: request.id ?? `${item.id}-${now}`,
        itemId: request.itemId ?? item.id,
        itemTitle: request.itemTitle ?? item.title,
        itemCategory: request.itemCategory ?? item.category,
        itemBenefit: request.itemBenefit ?? item.benefit,
        cost: request.cost ?? item.cost,
        walletBalanceAtRequest: request.walletBalanceAtRequest ?? 0,
        status: request.status ?? 'PENDING',
        statusReason: request.statusReason ?? null,
        requestedAt: request.requestedAt ? String(request.requestedAt) : now,
        reviewedAt: request.reviewedAt ? String(request.reviewedAt) : null,
        fulfilledAt: request.fulfilledAt ? String(request.fulfilledAt) : null,
        updatedAt: request.updatedAt ? String(request.updatedAt) : now,
    }
}

function RedeemFeedbackBox({
    feedback,
    compact = false,
}: {
    feedback: RedeemFeedback
    compact?: boolean
}) {
    const classes: Record<RedeemFeedbackTone, string> = {
        success: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
        warning: 'bg-amber-50 text-amber-800 ring-amber-200',
        error: 'bg-rose-50 text-rose-800 ring-rose-200',
    }

    return (
        <div className={fx('mt-4 rounded-2xl p-3 text-sm ring-1', feedback.tone === 'success' && 'fuxie-shop-feedback-pop', classes[feedback.tone])}>
            <p className="font-black">{feedback.title}</p>
            <p className={fx('mt-1 font-semibold leading-relaxed', compact && 'line-clamp-2')}>{feedback.message}</p>
            {feedback.requestId ? (
                <p className="mt-2 text-xs font-bold opacity-75">Request ID: {feedback.requestId}</p>
            ) : null}
        </div>
    )
}
