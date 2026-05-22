/**
 * Pending shop redeem revert store — pure FSM used by the shop surface to
 * auto-revert PENDING requests that never received a server response within
 * 10 seconds.
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: Gamification Designer (state semantics)
 *
 * Spec source-of-truth:
 *   - Task 13.3 (gamified-ui-asset-rollout)
 *   - design.md §I.6 (Shop / Inventory)
 *   - requirements.md Req 8.7
 *
 * Why a pure helper:
 *   The shop UI renders in a node-env vitest workspace (jsdom is not
 *   installed). Splitting the timer FSM out of the React component lets us
 *   exercise the 10-second revert deterministically with fake timers and
 *   keeps the React layer to thin glue code.
 *
 * Contract (machine-checkable):
 *   - `markPending(itemId, now)` records an entry; identical itemIds keep
 *     the EARLIEST `addedAt` so a duplicate optimistic mark cannot extend
 *     the deadline (Req 8.7 — revert based on the original request).
 *   - `confirm(itemId)` removes the entry (the server confirmed the
 *     request, so the inventory revalidation will reconcile it).
 *   - `releaseExpired(now)` returns the next store plus the list of
 *     itemIds whose `addedAt + ttlMs <= now` — these are the entries the
 *     UI should revert. The returned store no longer contains the expired
 *     entries so subsequent calls do not double-fire.
 *   - All operations are pure: identical inputs ⇒ identical output, no
 *     mutation of the input store, no IO.
 *
 * Validates: Requirement 8.7
 */

/** Req 8.7 — pending requests revert after 10 seconds without server response. */
export const PENDING_REVERT_TIMEOUT_MS = 10_000

export interface PendingShopEntry {
    /** Catalog item id awaiting server confirmation. */
    itemId: string
    /**
     * Epoch ms at which the optimistic pending mark was applied. Used as
     * the start of the 10-second TTL window. Always the EARLIEST mark — a
     * second `markPending` call for the same id keeps the original value.
     */
    addedAt: number
}

export interface PendingShopRevertStore {
    /**
     * Active pending entries, keyed by `itemId`. Stored as an array so the
     * React layer can pass it through `useState` without forcing a `Map`
     * dependency in the component tree.
     */
    entries: ReadonlyArray<PendingShopEntry>
    /** Configurable TTL — defaults to {@link PENDING_REVERT_TIMEOUT_MS}. */
    ttlMs: number
}

export interface PendingShopRevertStoreOptions {
    /** Initial pending ids (e.g. server-supplied PENDING redeem rows). */
    initialPendingItemIds?: ReadonlyArray<string>
    /** Reference timestamp used to seed the initial entries. */
    seededAt?: number
    /** Override the TTL. Useful for tests; production should keep the default. */
    ttlMs?: number
}

/**
 * Build the initial revert store. When server-supplied PENDING ids are
 * provided, they share the same `seededAt` timestamp — the next
 * `releaseExpired` call ≥ `seededAt + ttlMs` will revert them all.
 *
 * Validates: Requirement 8.7
 */
export function createPendingRevertStore(
    options: PendingShopRevertStoreOptions = {},
): PendingShopRevertStore {
    const ttlMs = sanitizeTtlMs(options.ttlMs)
    const seededAt = options.seededAt ?? 0
    const seenIds = new Set<string>()
    const entries: PendingShopEntry[] = []
    for (const itemId of options.initialPendingItemIds ?? []) {
        if (seenIds.has(itemId)) continue
        seenIds.add(itemId)
        entries.push({ itemId, addedAt: seededAt })
    }
    return { entries, ttlMs }
}

/**
 * Insert or keep a pending entry. Duplicate `markPending` calls for the
 * same id are idempotent — the original `addedAt` is preserved so a UI
 * re-render cannot reset the 10-second deadline (Req 8.7).
 */
export function markPending(
    store: PendingShopRevertStore,
    itemId: string,
    now: number,
): PendingShopRevertStore {
    if (store.entries.some((entry) => entry.itemId === itemId)) {
        return store
    }
    return {
        ...store,
        entries: [...store.entries, { itemId, addedAt: now }],
    }
}

/**
 * Remove a pending entry — used when the server confirmed the request,
 * the catalog refresh reconciled the state, or the user navigated away.
 * Returns the input store unchanged when `itemId` is not pending.
 */
export function confirmPending(
    store: PendingShopRevertStore,
    itemId: string,
): PendingShopRevertStore {
    if (!store.entries.some((entry) => entry.itemId === itemId)) {
        return store
    }
    return {
        ...store,
        entries: store.entries.filter((entry) => entry.itemId !== itemId),
    }
}

/**
 * Release every pending entry whose TTL has elapsed at the given `now`.
 * Returns the next store (without the expired entries) plus the list of
 * itemIds that just expired. The UI uses the latter to surface the
 * non-blocking revert toast and re-classify those cards based on the
 * current wallet balance (Req 8.7).
 *
 * The semantics use `>=` so that the boundary at exactly `addedAt + ttlMs`
 * counts as expired — this matches the requirement wording "after 10s"
 * and keeps the FSM aligned with `setTimeout(..., ttlMs)` callbacks.
 */
export function releaseExpired(
    store: PendingShopRevertStore,
    now: number,
): {
    store: PendingShopRevertStore
    expired: ReadonlyArray<string>
} {
    const remaining: PendingShopEntry[] = []
    const expired: string[] = []
    for (const entry of store.entries) {
        if (now - entry.addedAt >= store.ttlMs) {
            expired.push(entry.itemId)
        } else {
            remaining.push(entry)
        }
    }
    if (expired.length === 0) {
        return { store, expired }
    }
    return {
        store: { ...store, entries: remaining },
        expired,
    }
}

/**
 * Return the list of pending itemIds — convenience for the React layer
 * which already classifies cards by passing a `string[]` to the shop
 * card classifier.
 */
export function listPendingItemIds(
    store: PendingShopRevertStore,
): ReadonlyArray<string> {
    return store.entries.map((entry) => entry.itemId)
}

function sanitizeTtlMs(input?: number): number {
    if (typeof input !== 'number' || !Number.isFinite(input) || input <= 0) {
        return PENDING_REVERT_TIMEOUT_MS
    }
    return Math.floor(input)
}
