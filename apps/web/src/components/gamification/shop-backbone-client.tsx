'use client'

/**
 * ShopBackboneClient — backbone-compliant shop surface.
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: Design System Designer (marketShelfFrame, dim/greyscale tokens),
 *               Gamification Designer (state semantics)
 *
 * Spec source-of-truth:
 *   - Tasks 13.2 + 13.3 (gamified-ui-asset-rollout)
 *   - design.md §I.6 (Shop / Inventory)
 *   - requirements.md Req 8.1, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10
 *
 * Contract (machine-checkable):
 *   - Renders a sticky-top wallet pill with `data-role="shop-wallet"` showing
 *     Fucoin and XP, both saturated to 0–9_999_999 (Req 8.1).
 *   - Renders one card per catalog item with `data-card-state` ∈
 *     `{affordable, unaffordable, owned, pending, locked}` (Req 8.2).
 *   - Visual treatments per state (Req 8.3, 8.4, 8.5, 8.6):
 *       * affordable   → bright Bright-Sky CTA "Đổi" (`<PrimaryCta>` enabled)
 *       * unaffordable → dim card, "Đổi" disabled, hint `còn thiếu N coin`
 *       * owned        → marketShelfFrame overlay, secondary "Trang bị"
 *       * pending      → spinner overlay, disabled, no `data-role="primary-cta"`
 *       * locked       → greyscale card, lock icon, NO purchase CTA
 *   - Error state via `<StateShell>` with the most recent cached wallet
 *     snapshot (Req 8.10).
 *
 * Task 13.3 additions:
 *   - Pending requests auto-revert after 10s based on the current wallet
 *     balance with a non-blocking `role="status"` toast (Req 8.7). The
 *     timer FSM lives in `shop-pending-revert.ts` so the revert behaviour
 *     is unit-testable without a DOM.
 *   - Inventory tab ("Kho đồ") shows the last 200 owned items in a
 *     vertical scroll list, each rendered through `getShopItemAssetSrc`
 *     (Req 8.8).
 *   - Equipping an owned cosmetic flips the mascot pose synchronously via
 *     `pickShopMascotPose` so the visible mascot diff lands well within
 *     the 1-second budget (Req 8.9).
 *
 * Notes:
 *   - Reward amber appears ONLY inside subtrees marked
 *     `data-reward-state="preview"` (the affordable Fucoin badge), keeping
 *     Property 9 (reward amber containment) honest in this state.
 */

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { Coins, Loader2, LockKeyhole, ShieldCheck, Sparkles, Star } from 'lucide-react'

import { MascotRoleHost } from '@/components/gamification/mascot-role-host'
import { StateShell } from '@/components/gamification/state-shell'
import { PrimaryCta } from '@/components/ui/primary-cta'
import { fx } from '@/components/ui/fuxie-ui'
import { getShopItemAssetSrc } from '@/components/gamification/reward-assets'
import { FUXIE_UI_FRAMES, getFuxieMascotSrc } from '@/lib/mascot/fuxie-assets'
import {
    WALLET_DISPLAY_MAX,
    classifyShopCards,
    clampWalletForDisplay,
    type ClassifiedShopCard,
} from '@/lib/gamification/build-shop-card-inputs'
import type { FuxieShopCatalogItem } from '@/lib/gamification/shop'
import type { ShopItemState } from '@/lib/gamification/classify-shop-item'
import {
    PENDING_REVERT_TIMEOUT_MS,
    confirmPending,
    createPendingRevertStore,
    listPendingItemIds,
    markPending,
    releaseExpired,
    type PendingShopRevertStore,
} from '@/lib/gamification/shop-pending-revert'
import { pickShopMascotPose } from '@/lib/gamification/shop-cosmetic-pose'

// -----------------------------------------------------------------------------
// Public types
// -----------------------------------------------------------------------------

export interface ShopBackboneWallet {
    /** Fucoin balance in the documented display range 0..9_999_999. */
    fucoin: number
    /** XP balance in the documented display range 0..9_999_999. */
    xp: number
}

export interface ShopBackboneInventory {
    /** Item ids the learner already owns (fulfilled redeems / cosmetics). */
    ownedItemIds: ReadonlyArray<string>
    /** Optional id of the currently equipped cosmetic. */
    equippedItemId?: string | null
}

export interface ShopBackboneUnlocks {
    level?: number
    streak?: number
    badges?: ReadonlyArray<string>
}

export interface ShopBackboneClientProps {
    wallet: ShopBackboneWallet
    inventory: ShopBackboneInventory
    unlocks?: ShopBackboneUnlocks
    catalog: ReadonlyArray<FuxieShopCatalogItem>
    /**
     * Item ids that already have an in-flight redeem request from the most
     * recent server fetch. The component augments this set with
     * client-optimistic ids when the learner taps "Đổi".
     */
    initialPendingItemIds?: ReadonlyArray<string>
    /**
     * Submit handler for the redeem POST. The component sets the item to
     * `pending` while the promise is in flight, removes it on resolve, and
     * delegates error toast handling back to the caller. Defaults to the
     * existing `/api/v1/rewards/shop/{itemId}/redeem` endpoint.
     */
    onRedeemRequest?: (itemId: string) => Promise<RedeemSubmitOutcome>
    /**
     * Equip handler for owned items. Task 13.3 will wire mascot updates;
     * 13.2 keeps the call optional and renders a non-primary CTA.
     */
    onEquipItem?: (itemId: string) => void | Promise<void> // locale-allow
}

export interface RedeemSubmitOutcome {
    /** Whether the request was accepted by the server. */
    ok: boolean
    /** Optional UI-friendly message; surfaced to the caller via toast. */
    message?: string
}

// -----------------------------------------------------------------------------
// Constants — copy + cache key
// -----------------------------------------------------------------------------

const SURFACE_ID = 'rewards-shop' as const

/** localStorage key for the cached wallet snapshot used by the error state. */
export const SHOP_WALLET_CACHE_KEY = 'fuxie:rewards-shop:wallet-cache:v1'

/**
 * Req 8.8 — the inventory tab shows at most the most recent 200 owned
 * items. The list is capped client-side so the surface stays responsive
 * even when the server returns a longer history.
 */
export const INVENTORY_TAB_MAX_ITEMS = 200

const COPY = {
    walletAriaLabel: 'Ví Fucoin và điểm XP',
    fucoinLabel: 'Fucoin',
    xpLabel: 'XP',
    ctaRedeem: 'Đổi',
    ctaEquip: 'Trang bị',
    ctaEquipped: 'Đã trang bị',
    ctaPending: 'Đang xử lý',
    ctaLocked: 'Chưa mở',
    hintMissing: (missing: number) =>
        `Còn thiếu ${missing.toLocaleString('vi-VN')} coin`,
    badgeOwned: 'Đã sở hữu',
    badgeLocked: 'Cần mở khóa',
    badgePending: 'Đang chờ duyệt',
    badgePreviewReward: '+1 vật phẩm',
    errorTitle: 'Shop tạm thời không phản hồi',
    errorMessage:
        'Fuxie không tải được danh sách quà. Hãy thử lại — ví của em vẫn được giữ nguyên ở giá trị gần nhất.',
    errorRetryLabel: 'Thử lại',
    emptyTitle: 'Shop chưa có vật phẩm',
    emptyMessage:
        'Quà mới đang được Fuxie chuẩn bị. Em hãy quay lại sau hoặc tiếp tục học để tích Fucoin nhé.',
    emptyCtaLabel: 'Tiếp tục học',
    tabShop: 'Cửa hàng',
    tabInventory: 'Kho đồ',
    inventoryEmptyTitle: 'Chưa có vật phẩm',
    inventoryEmptyMessage:
        'Học mỗi ngày để tích Fucoin và đổi vật phẩm — kho đồ sẽ xuất hiện tại đây.',
    inventoryAriaLabel: 'Danh sách vật phẩm đã sở hữu',
    pendingRevertToast: (title: string) =>
        `Yêu cầu đổi "${title}" chưa được duyệt sau 10 giây — Fuxie đã hoàn về trạng thái trước đó. Em có thể thử lại khi sẵn sàng.`,
    pendingRevertGenericToast:
        'Yêu cầu đổi quà chưa được duyệt sau 10 giây — Fuxie đã hoàn về trạng thái trước đó.',
} as const

// -----------------------------------------------------------------------------
// Wallet cache (Req 8.10)
// -----------------------------------------------------------------------------

interface CachedWalletSnapshot {
    fucoin: number
    xp: number
    cachedAt: number
}

function readCachedWallet(): CachedWalletSnapshot | null {
    if (typeof window === 'undefined') return null
    try {
        const raw = window.localStorage.getItem(SHOP_WALLET_CACHE_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw) as Partial<CachedWalletSnapshot>
        if (
            typeof parsed.fucoin !== 'number' ||
            typeof parsed.xp !== 'number' ||
            typeof parsed.cachedAt !== 'number'
        ) {
            return null
        }
        return {
            fucoin: clampWalletForDisplay(parsed.fucoin),
            xp: clampWalletForDisplay(parsed.xp),
            cachedAt: parsed.cachedAt,
        }
    } catch {
        return null
    }
}

function writeCachedWallet(wallet: ShopBackboneWallet): void {
    if (typeof window === 'undefined') return
    try {
        const snapshot: CachedWalletSnapshot = {
            fucoin: clampWalletForDisplay(wallet.fucoin),
            xp: clampWalletForDisplay(wallet.xp),
            cachedAt: Date.now(),
        }
        window.localStorage.setItem(SHOP_WALLET_CACHE_KEY, JSON.stringify(snapshot))
    } catch {
        // localStorage may be unavailable (private mode / quota); ignore so
        // the surface still renders correctly without the cache.
    }
}

// -----------------------------------------------------------------------------
// Default redeem submit (POST /api/v1/rewards/shop/[itemId]/redeem)
// -----------------------------------------------------------------------------

async function defaultRedeemSubmit(itemId: string): Promise<RedeemSubmitOutcome> {
    try {
        const response = await fetch(`/api/v1/rewards/shop/${itemId}/redeem`, {
            method: 'POST',
        })
        const payload = (await response.json().catch(() => ({}))) as {
            success?: boolean
            error?: string
            data?: { guard?: { message?: string } }
        }
        if (payload.success) {
            return {
                ok: true,
                message: payload.data?.guard?.message,
            }
        }
        return {
            ok: false,
            message: payload.error ?? 'Không tạo được request đổi quà.',
        }
    } catch (error) {
        return {
            ok: false,
            message: error instanceof Error ? error.message : 'Lỗi mạng khi đổi quà.',
        }
    }
}


// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

type ShopTab = 'shop' | 'inventory'

interface RevertToast {
    /** Stable id so consecutive reverts don't collapse in React lists. */
    id: number
    /** Already-localized message body. */
    message: string
}

export function ShopBackboneClient({
    wallet,
    inventory,
    unlocks,
    catalog,
    initialPendingItemIds,
    onRedeemRequest,
    onEquipItem,
}: ShopBackboneClientProps) {
    // Saturate wallet display values (Req 8.1).
    const displayFucoin = clampWalletForDisplay(wallet.fucoin)
    const displayXp = clampWalletForDisplay(wallet.xp)

    // Pending revert FSM (Req 8.7). Seeded with the server-supplied PENDING
    // ids so even rows that arrived from the API revert if the catalog is
    // not refreshed within 10 seconds. The store's `seededAt` is the page
    // mount time — a rough but safe upper bound on how stale the entries
    // are when the client takes over.
    const [pendingStore, setPendingStore] = useState<PendingShopRevertStore>(() =>
        createPendingRevertStore({
            initialPendingItemIds,
            seededAt: typeof Date !== 'undefined' ? Date.now() : 0,
        }),
    )
    const [revertToasts, setRevertToasts] = useState<ReadonlyArray<RevertToast>>([])
    const toastIdRef = useRef(0)

    // Keep the most-recent catalog title lookup so revert toasts can show a
    // friendly label even after the card is no longer pending. Falls back to
    // the generic toast copy when the id is unknown.
    const catalogTitleById = useMemo(() => {
        const map = new Map<string, string>()
        for (const item of catalog) {
            map.set(item.id, item.title)
        }
        return map
    }, [catalog])

    const pendingItemIds = listPendingItemIds(pendingStore)

    const [, startRedeemTransition] = useTransition()
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const [activeTab, setActiveTab] = useState<ShopTab>('shop')
    const [equippedItemId, setEquippedItemId] = useState<string | null>(
        inventory.equippedItemId ?? null,
    )

    // Reconcile the equipped item when the parent passes a fresh inventory
    // snapshot (e.g. after a successful catalog refresh).
    useEffect(() => {
        setEquippedItemId(inventory.equippedItemId ?? null)
    }, [inventory.equippedItemId])

    // Persist the latest wallet snapshot so the error state can rehydrate.
    useEffect(() => {
        writeCachedWallet({ fucoin: displayFucoin, xp: displayXp })
    }, [displayFucoin, displayXp])

    // Schedule a single setTimeout per pending entry so the FSM revert
    // matches the wall-clock 10-second window (Req 8.7). Each entry is
    // tracked by its `addedAt` so repeated mounts cannot reset the deadline.
    useEffect(() => {
        if (pendingStore.entries.length === 0) {
            return
        }
        const now = Date.now()
        const timers: ReturnType<typeof setTimeout>[] = []
        for (const entry of pendingStore.entries) {
            const remaining = entry.addedAt + pendingStore.ttlMs - now
            const delay = Math.max(0, remaining)
            const timer = setTimeout(() => {
                applyExpiredRevert(Date.now())
            }, delay)
            timers.push(timer)
        }
        return () => {
            for (const timer of timers) {
                clearTimeout(timer)
            }
        }
        // We intentionally re-subscribe whenever the entry set or TTL
        // changes — markPending / confirmPending replace the array
        // reference, which is the cheapest way to keep timers in sync.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pendingStore.entries, pendingStore.ttlMs])

    const applyExpiredRevert = useCallback((now: number) => {
        setPendingStore((current) => {
            const { store: next, expired } = releaseExpired(current, now)
            if (expired.length === 0) {
                return current
            }
            // Surface a non-blocking toast per expired id (Req 8.7).
            setRevertToasts((toasts) => {
                const additions: RevertToast[] = expired.map((itemId) => {
                    toastIdRef.current += 1
                    const title = catalogTitleById.get(itemId)
                    return {
                        id: toastIdRef.current,
                        message: title
                            ? COPY.pendingRevertToast(title)
                            : COPY.pendingRevertGenericToast,
                    }
                })
                return [...toasts, ...additions]
            })
            return next
        })
    }, [catalogTitleById])

    const dismissToast = useCallback((id: number) => {
        setRevertToasts((toasts) => toasts.filter((toast) => toast.id !== id))
    }, [])

    // Classify every catalog item into one of the 5 states (Req 8.2).
    const classifiedCards = useMemo<ClassifiedShopCard[]>(
        () =>
            classifyShopCards({
                catalog,
                walletFucoin: displayFucoin,
                ownedItemIds: inventory.ownedItemIds,
                pendingItemIds,
                unlocks,
            }),
        [catalog, displayFucoin, inventory.ownedItemIds, pendingItemIds, unlocks],
    )

    // Inventory tab: latest 200 owned items rendered with `getShopItemAssetSrc`
    // (Req 8.8). The order is "newest first" — the parent passes
    // `ownedItemIds` already sorted by acquisition date, so we just slice.
    const inventoryItems = useMemo(
        () => buildInventoryItems(inventory.ownedItemIds, catalog),
        [inventory.ownedItemIds, catalog],
    )

    const handleRedeem = useCallback(
        (itemId: string) => {
            // Optimistically mark the item as pending so the card flips to
            // its spinner+disabled visual immediately (Req 8.6) and starts
            // the 10-second revert timer (Req 8.7).
            const now = Date.now()
            setPendingStore((current) => markPending(current, itemId, now))
            setErrorMessage(null)

            const submit = onRedeemRequest ?? defaultRedeemSubmit
            startRedeemTransition(async () => {
                const outcome = await submit(itemId)
                if (!outcome.ok) {
                    setErrorMessage(outcome.message ?? null)
                    setPendingStore((current) => confirmPending(current, itemId))
                }
                // On success the server tracks the request as PENDING; the
                // client-side revert FSM keeps the card disabled until the
                // 10-second TTL elapses or the next catalog refresh confirms
                // the entry. We rely on the parent re-fetching `catalog` to
                // reconcile.
            })
        },
        [onRedeemRequest],
    )

    const handleEquip = useCallback(
        (itemId: string) => {
            // Optimistic mascot update (Req 8.9). Setting state in the same
            // event handler triggers a synchronous re-render, so the new
            // mascot pose lands well within the 1-second budget.
            setEquippedItemId((current) => (current === itemId ? current : itemId))
            if (onEquipItem) {
                void onEquipItem(itemId)
            }
        },
        [onEquipItem],
    )

    // The error state is currently driven by the most recent redeem submit
    // failure when the catalog is empty.
    if (errorMessage && classifiedCards.length === 0) {
        const cached = readCachedWallet()
        const fallbackWallet: ShopBackboneWallet = cached
            ? { fucoin: cached.fucoin, xp: cached.xp }
            : { fucoin: displayFucoin, xp: displayXp }
        return (
            <div className="mx-auto w-full max-w-3xl px-4 py-6">
                <ShopWalletPill wallet={fallbackWallet} stale />
                <StateShell
                    surfaceId={SURFACE_ID}
                    state="error"
                    title={COPY.errorTitle}
                    message={errorMessage}
                    primaryCta={{
                        label: COPY.errorRetryLabel,
                        onClick: () => setErrorMessage(null),
                    }}
                />
            </div>
        )
    }

    // Empty state — Req 11.1: every learner surface declares `empty`. The
    // shop is "empty" when the catalog ships zero items (no rewards seeded
    // yet, or all items hidden by feature flags). Wallet stays visible so
    // the learner sees their balance, then a `<StateShell>` carries the
    // single Primary_CTA back to /course (Req 11.3).
    if (!errorMessage && classifiedCards.length === 0) {
        return (
            <div className="mx-auto w-full max-w-3xl px-4 py-6">
                <ShopWalletPill wallet={{ fucoin: displayFucoin, xp: displayXp }} />
                <StateShell
                    surfaceId={SURFACE_ID}
                    state="empty"
                    title={COPY.emptyTitle}
                    message={COPY.emptyMessage}
                    primaryCta={{
                        label: COPY.emptyCtaLabel,
                        href: '/course',
                    }}
                />
            </div>
        )
    }

    const mascotPoseSrc = getFuxieMascotSrc(pickShopMascotPose(equippedItemId))

    return (
        <section
            data-role="shop-backbone"
            data-surface-id={SURFACE_ID}
            data-equipped-item-id={equippedItemId ?? undefined}
            data-active-tab={activeTab}
            className="mx-auto w-full max-w-3xl px-4 pb-6"
        >
            {/* Sticky-top wallet so it stays inside the first viewport (Req 8.1). */}
            <div className="sticky top-0 z-10 -mx-4 bg-[var(--fuxie-blue-50)]/95 px-4 pb-3 pt-3 backdrop-blur supports-[backdrop-filter]:bg-[var(--fuxie-blue-50)]/80">
                <ShopWalletPill wallet={{ fucoin: displayFucoin, xp: displayXp }} />
                {errorMessage ? (
                    <p
                        role="status"
                        className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 ring-1 ring-rose-200"
                    >
                        {errorMessage}
                    </p>
                ) : null}
            </div>

            <div className="mt-3 flex items-center gap-3">
                <span
                    data-role="shop-mascot"
                    data-mascot-pose-src={mascotPoseSrc}
                    className="inline-flex shrink-0 items-center"
                >
                    <MascotRoleHost
                        surfaceId={SURFACE_ID}
                        state="default"
                        size={56}
                    />
                </span>
                <div>
                    <h1 className="text-base font-extrabold text-[var(--fuxie-blue-900)]">
                        Cửa hàng Fuxie
                    </h1>
                    <p className="text-xs font-semibold text-[var(--fuxie-blue-700)]">
                        Đổi Fucoin lấy phụ kiện cho Fuxie hoặc tiện ích học tập.
                    </p>
                </div>
            </div>

            <ShopTabs activeTab={activeTab} onChange={setActiveTab} />

            {activeTab === 'shop' ? (
                <ul
                    className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2"
                    data-role="shop-card-grid"
                >
                    {classifiedCards.map((card) => (
                        <li key={card.item.id}>
                            <ShopItemCard
                                card={card}
                                equippedItemId={equippedItemId}
                                onRedeem={handleRedeem}
                                onEquip={handleEquip}
                            />
                        </li>
                    ))}
                </ul>
            ) : (
                <InventoryList
                    items={inventoryItems}
                    equippedItemId={equippedItemId}
                    onEquip={handleEquip}
                />
            )}

            <RevertToastTray toasts={revertToasts} onDismiss={dismissToast} />
        </section>
    )
}

// -----------------------------------------------------------------------------
// Wallet pill (Req 8.1)
// -----------------------------------------------------------------------------

function ShopWalletPill({
    wallet,
    stale = false,
}: {
    wallet: ShopBackboneWallet
    stale?: boolean
}) {
    const fucoin = clampWalletForDisplay(wallet.fucoin)
    const xp = clampWalletForDisplay(wallet.xp)
    return (
        <div
            data-role="shop-wallet"
            data-wallet-stale={stale ? 'true' : undefined}
            aria-label={COPY.walletAriaLabel}
            className={fx(
                'flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-[var(--fuxie-blue-200)]',
                stale && 'opacity-90 ring-[var(--fuxie-blue-700)]/30',
            )}
        >
            <WalletStat
                label={COPY.fucoinLabel}
                value={fucoin}
                icon={<Coins className="h-4 w-4 text-[var(--fuxie-blue-700)]" aria-hidden="true" />}
                testRole="wallet-fucoin"
            />
            <span className="h-8 w-px bg-[var(--fuxie-blue-200)]" aria-hidden="true" />
            <WalletStat
                label={COPY.xpLabel}
                value={xp}
                icon={<Star className="h-4 w-4 text-[var(--fuxie-blue-700)]" aria-hidden="true" />}
                testRole="wallet-xp"
            />
            {stale ? (
                <span
                    data-role="shop-wallet-stale-flag"
                    className="rounded-full bg-[var(--fuxie-blue-100)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--fuxie-blue-700)]"
                >
                    Cached
                </span>
            ) : null}
        </div>
    )
}

function WalletStat({
    label,
    value,
    icon,
    testRole,
}: {
    label: string
    value: number
    icon: React.ReactNode
    testRole: string
}) {
    const display = value === WALLET_DISPLAY_MAX ? '9.999.999' : value.toLocaleString('vi-VN')
    return (
        <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[var(--fuxie-blue-50)]">
                {icon}
            </span>
            <div className="min-w-0 leading-tight">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--fuxie-blue-700)]/75">
                    {label}
                </p>
                <p
                    data-role={testRole}
                    className="text-base font-black text-[var(--fuxie-blue-900)]"
                >
                    {display}
                </p>
            </div>
        </div>
    )
}


// -----------------------------------------------------------------------------
// Shop item card (Req 8.3, 8.4, 8.5, 8.6)
// -----------------------------------------------------------------------------

interface ShopItemCardProps {
    card: ClassifiedShopCard
    equippedItemId: string | null
    onRedeem: (itemId: string) => void
    onEquip?: (itemId: string) => void | Promise<void> // locale-allow
}

function ShopItemCard({ card, equippedItemId, onRedeem, onEquip }: ShopItemCardProps) {
    const { item, state, missingFucoin } = card
    const assetSrc = getShopItemAssetSrc(item.id, item.category)
    const isEquipped = state === 'owned' && equippedItemId === item.id

    const stateClasses = stateVisualClasses(state)

    return (
        <article
            data-card-state={state}
            data-card-equipped={isEquipped ? 'true' : undefined}
            data-shop-item-id={item.id}
            className={fx(
                'relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white p-4 shadow-sm transition',
                stateClasses,
            )}
        >
            {/* Owned cards get the marketShelfFrame overlay (Req 8.5). */}
            {state === 'owned' ? (
                <Image
                    src={FUXIE_UI_FRAMES.marketShelfFrame}
                    alt=""
                    aria-hidden="true"
                    width={120}
                    height={120}
                    className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 object-contain opacity-60"
                />
            ) : null}

            {/* Pending overlay (Req 8.6). */}
            {state === 'pending' ? (
                <div
                    role="status"
                    aria-live="polite"
                    data-role="shop-pending-overlay"
                    className="pointer-events-none absolute inset-0 grid place-items-center bg-white/70 backdrop-blur-sm"
                >
                    <Loader2
                        className="h-8 w-8 animate-spin text-[var(--fuxie-blue-700)]"
                        aria-label={COPY.ctaPending}
                    />
                </div>
            ) : null}

            <div className="flex items-start gap-3">
                <span
                    className={fx(
                        'grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[var(--fuxie-blue-50)] p-1.5 ring-1 ring-[var(--fuxie-blue-200)]',
                        state === 'locked' && 'grayscale',
                    )}
                >
                    <Image
                        src={assetSrc}
                        alt=""
                        width={48}
                        height={48}
                        className="h-full w-full object-contain"
                    />
                </span>
                <div className="min-w-0 flex-1">
                    <h2 className="line-clamp-2 text-sm font-extrabold leading-tight text-[var(--fuxie-blue-900)]">
                        {item.title}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-xs font-semibold text-[var(--fuxie-blue-700)]">
                        {item.description}
                    </p>
                </div>
                <ShopItemBadge state={state} />
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
                <ShopItemPrice cost={item.cost} state={state} />
                {state === 'unaffordable' ? (
                    <p
                        data-role="shop-card-hint"
                        className="text-right text-xs font-bold text-[var(--fuxie-blue-700)]"
                    >
                        {COPY.hintMissing(missingFucoin)}
                    </p>
                ) : null}
            </div>

            <div className="mt-4 flex flex-col gap-2">
                <ShopItemAction
                    state={state}
                    isEquipped={isEquipped}
                    itemId={item.id}
                    onRedeem={onRedeem}
                    onEquip={onEquip}
                />
            </div>
        </article>
    )
}

function stateVisualClasses(state: ShopItemState): string {
    switch (state) {
        case 'affordable':
            return 'border-[var(--fuxie-action)]/35 ring-1 ring-[var(--fuxie-action)]/15'
        case 'unaffordable':
            // Dim the entire card so it visually recedes (Req 8.4).
            return 'border-[var(--fuxie-blue-200)] opacity-70 saturate-50'
        case 'owned':
            return 'border-[var(--fuxie-success)]/40 ring-1 ring-[var(--fuxie-success)]/20'
        case 'pending':
            return 'border-[var(--fuxie-blue-200)]'
        case 'locked':
            // Greyscale for locked cards (Req 8.2 / design §I.6).
            return 'border-slate-200 grayscale opacity-80'
    }
}

function ShopItemBadge({ state }: { state: ShopItemState }) {
    if (state === 'owned') {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--fuxie-success)]/12 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[var(--fuxie-success)] ring-1 ring-[var(--fuxie-success)]/30">
                <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                {COPY.badgeOwned}
            </span>
        )
    }
    if (state === 'locked') {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-600 ring-1 ring-slate-200">
                <LockKeyhole className="h-3 w-3" aria-hidden="true" />
                {COPY.badgeLocked}
            </span>
        )
    }
    if (state === 'pending') {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--fuxie-blue-50)] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[var(--fuxie-blue-700)] ring-1 ring-[var(--fuxie-blue-200)]">
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                {COPY.badgePending}
            </span>
        )
    }
    if (state === 'affordable') {
        // Affordable cards advertise the upcoming reward via a Reward_State
        // preview — kept inside `data-reward-state="preview"` so reward amber
        // is contained per Property 9.
        return (
            <span
                data-reward-state="preview"
                data-reward-context="true"
                className="inline-flex items-center gap-1 rounded-full bg-[var(--fuxie-reward)]/15 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[var(--fuxie-reward)] ring-1 ring-[var(--fuxie-reward)]/35"
            >
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                {COPY.badgePreviewReward}
            </span>
        )
    }
    return null
}

function ShopItemPrice({ cost, state }: { cost: number; state: ShopItemState }) {
    return (
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--fuxie-blue-700)]/75">
            <span className="mr-1 font-black text-[var(--fuxie-blue-900)]">
                {cost.toLocaleString('vi-VN')}
            </span>
            Fucoin
            {state === 'pending' ? (
                <span className="ml-2 text-[10px] normal-case text-[var(--fuxie-blue-700)]">
                    (chưa trừ)
                </span>
            ) : null}
        </p>
    )
}

function ShopItemAction({
    state,
    isEquipped,
    itemId,
    onRedeem,
    onEquip,
}: {
    state: ShopItemState
    isEquipped: boolean
    itemId: string
    onRedeem: (itemId: string) => void
    onEquip?: (itemId: string) => void | Promise<void> // locale-allow
}) {
    if (state === 'affordable') {
        return (
            <PrimaryCta
                variant="primary"
                onClick={() => onRedeem(itemId)}
                className="w-full"
            >
                {COPY.ctaRedeem}
            </PrimaryCta>
        )
    }

    if (state === 'unaffordable') {
        return (
            <PrimaryCta variant="primary" disabled className="w-full">
                {COPY.ctaRedeem}
            </PrimaryCta>
        )
    }

    if (state === 'pending') {
        return (
            <PrimaryCta variant="primary" disabled className="w-full">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                {COPY.ctaPending}
            </PrimaryCta>
        )
    }

    if (state === 'owned') {
        // Owned items expose "Trang bị" — kept non-primary unless this item
        // is the equipped one (Req 8.5).
        const label = isEquipped ? COPY.ctaEquipped : COPY.ctaEquip
        if (isEquipped) {
            return (
                <PrimaryCta variant="primary" disabled className="w-full">
                    {label}
                </PrimaryCta>
            )
        }
        return (
            <PrimaryCta
                variant="secondary"
                onClick={onEquip ? () => void onEquip(itemId) : undefined}
                disabled={!onEquip}
                className="w-full"
            >
                {label}
            </PrimaryCta>
        )
    }

    // Locked: no purchase CTA (Req 8.2 / design §I.6).
    return (
        <p
            role="note"
            className="rounded-xl bg-slate-50 px-3 py-2 text-center text-xs font-semibold text-slate-600 ring-1 ring-slate-200"
        >
            {COPY.ctaLocked}
        </p>
    )
}

// -----------------------------------------------------------------------------
// Shop / Inventory tabs (Req 8.8)
// -----------------------------------------------------------------------------

interface ShopTabsProps {
    activeTab: ShopTab
    onChange: (next: ShopTab) => void
}

function ShopTabs({ activeTab, onChange }: ShopTabsProps) {
    const t = useTranslations('Gamification')
    return (
        <div
            role="tablist"
            aria-label={t('shopTabsAriaLabel')}
            data-role="shop-tablist"
            className="mt-4 inline-flex gap-1 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-[var(--fuxie-blue-200)]"
        >
            <ShopTabButton
                tab="shop"
                label={COPY.tabShop}
                activeTab={activeTab}
                onChange={onChange}
            />
            <ShopTabButton
                tab="inventory"
                label={COPY.tabInventory}
                activeTab={activeTab}
                onChange={onChange}
            />
        </div>
    )
}

function ShopTabButton({
    tab,
    label,
    activeTab,
    onChange,
}: {
    tab: ShopTab
    label: string
    activeTab: ShopTab
    onChange: (next: ShopTab) => void
}) {
    const active = activeTab === tab
    return (
        <button
            type="button"
            role="tab"
            aria-selected={active}
            data-role="shop-tab"
            data-shop-tab={tab}
            data-shop-tab-active={active ? 'true' : undefined}
            onClick={() => onChange(tab)}
            className={fx(
                'min-h-[44px] rounded-xl px-4 text-sm font-bold transition',
                active
                    ? 'bg-[var(--fuxie-action)] text-white shadow-sm'
                    : 'text-[var(--fuxie-blue-700)] hover:bg-[var(--fuxie-blue-50)]',
            )}
        >
            {label}
        </button>
    )
}

// -----------------------------------------------------------------------------
// Inventory tab list (Req 8.8)
// -----------------------------------------------------------------------------

interface InventoryRenderItem {
    itemId: string
    title: string
    description: string
    category: FuxieShopCatalogItem['category'] | null
    assetSrc: string
}

/**
 * Build the inventory render rows. Caps to the latest 200 entries
 * (Req 8.8). When a catalog entry is missing for an owned id (e.g. the
 * server returned a legacy id no longer in the active catalog), the row
 * still renders with `getShopItemAssetSrc(itemId, null)` so the surface
 * never drops the learner's history.
 */
function buildInventoryItems(
    ownedItemIds: ReadonlyArray<string>,
    catalog: ReadonlyArray<FuxieShopCatalogItem>,
): InventoryRenderItem[] {
    const sliced = ownedItemIds.slice(0, INVENTORY_TAB_MAX_ITEMS)
    const catalogById = new Map(catalog.map((item) => [item.id, item] as const))
    return sliced.map((itemId) => {
        const catalogItem = catalogById.get(itemId)
        return {
            itemId,
            title: catalogItem?.title ?? itemId,
            description: catalogItem?.description ?? 'Vật phẩm trong kho đồ của em.',
            category: catalogItem?.category ?? null,
            assetSrc: getShopItemAssetSrc(itemId, catalogItem?.category ?? null),
        }
    })
}

function InventoryList({
    items,
    equippedItemId,
    onEquip,
}: {
    items: ReadonlyArray<InventoryRenderItem>
    equippedItemId: string | null
    onEquip: (itemId: string) => void
}) {
    if (items.length === 0) {
        return (
            <div
                data-role="shop-inventory-empty"
                className="mt-4 rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-[var(--fuxie-blue-200)]"
            >
                <h2 className="text-base font-extrabold text-[var(--fuxie-blue-900)]">
                    {COPY.inventoryEmptyTitle}
                </h2>
                <p className="mt-2 text-sm font-semibold text-[var(--fuxie-blue-700)]">
                    {COPY.inventoryEmptyMessage}
                </p>
            </div>
        )
    }
    return (
        <ul
            role="list"
            data-role="shop-inventory-list"
            data-inventory-count={items.length}
            aria-label={COPY.inventoryAriaLabel}
            className="mt-4 max-h-[60vh] overflow-y-auto rounded-2xl bg-white shadow-sm ring-1 ring-[var(--fuxie-blue-200)]"
        >
            {items.map((item) => (
                <li
                    key={item.itemId}
                    data-role="shop-inventory-item"
                    data-shop-item-id={item.itemId}
                    data-inventory-equipped={
                        equippedItemId === item.itemId ? 'true' : undefined
                    }
                    className="flex items-center gap-3 border-b border-[var(--fuxie-blue-100)] px-4 py-3 last:border-b-0"
                >
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--fuxie-blue-50)] p-1.5 ring-1 ring-[var(--fuxie-blue-200)]">
                        <Image
                            src={item.assetSrc}
                            alt=""
                            width={40}
                            height={40}
                            className="h-full w-full object-contain"
                        />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-extrabold text-[var(--fuxie-blue-900)]">
                            {item.title}
                        </p>
                        <p className="truncate text-xs font-semibold text-[var(--fuxie-blue-700)]">
                            {item.description}
                        </p>
                    </div>
                    <InventoryEquipAction
                        itemId={item.itemId}
                        isEquipped={equippedItemId === item.itemId}
                        onEquip={onEquip}
                    />
                </li>
            ))}
        </ul>
    )
}

function InventoryEquipAction({
    itemId,
    isEquipped,
    onEquip,
}: {
    itemId: string
    isEquipped: boolean
    onEquip: (itemId: string) => void
}) {
    if (isEquipped) {
        return (
            <PrimaryCta variant="primary" disabled className="shrink-0">
                {COPY.ctaEquipped}
            </PrimaryCta>
        )
    }
    return (
        <PrimaryCta
            variant="secondary"
            onClick={() => onEquip(itemId)}
            className="shrink-0"
        >
            {COPY.ctaEquip}
        </PrimaryCta>
    )
}

// -----------------------------------------------------------------------------
// Revert toast tray (Req 8.7)
// -----------------------------------------------------------------------------

function RevertToastTray({
    toasts,
    onDismiss,
}: {
    toasts: ReadonlyArray<RevertToast>
    onDismiss: (id: number) => void
}) {
    // Auto-dismiss after 6s so the tray does not accumulate infinitely on a
    // long session. Each toast manages its own timer via the inner item to
    // avoid re-creating timeouts when other toasts arrive.
    return (
        <div
            role="status"
            aria-live="polite"
            data-role="shop-revert-toast-tray"
            data-toast-count={toasts.length}
            className="pointer-events-none fixed inset-x-0 bottom-4 z-30 mx-auto flex max-w-md flex-col items-center gap-2 px-4"
        >
            {toasts.map((toast) => (
                <RevertToastItem
                    key={toast.id}
                    toast={toast}
                    onDismiss={onDismiss}
                />
            ))}
        </div>
    )
}

const REVERT_TOAST_DISMISS_MS = 6_000

function RevertToastItem({
    toast,
    onDismiss,
}: {
    toast: RevertToast
    onDismiss: (id: number) => void
}) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss(toast.id)
        }, REVERT_TOAST_DISMISS_MS)
        return () => clearTimeout(timer)
    }, [toast.id, onDismiss])

    return (
        <div
            role="status"
            data-role="shop-revert-toast"
            data-toast-id={toast.id}
            className="pointer-events-auto w-full rounded-2xl bg-[var(--fuxie-blue-900)] px-4 py-3 text-xs font-semibold text-white shadow-lg ring-1 ring-black/10"
        >
            {toast.message}
        </div>
    )
}

// Re-export the timeout so callers / tests can read the canonical value
// without importing two modules.
export { PENDING_REVERT_TIMEOUT_MS }
