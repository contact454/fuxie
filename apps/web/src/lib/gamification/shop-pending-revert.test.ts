import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
    PENDING_REVERT_TIMEOUT_MS,
    confirmPending,
    createPendingRevertStore,
    listPendingItemIds,
    markPending,
    releaseExpired,
} from './shop-pending-revert'

/**
 * Co-located unit tests for the shop pending-revert FSM.
 *
 * Why pure-helper tests:
 *   The 10-second auto-revert (Req 8.7) is the heart of task 13.3. The
 *   workspace runs vitest in the `node` environment (no jsdom), so the
 *   timer behaviour is exercised through the FSM directly with
 *   `vi.useFakeTimers`. The React layer in `ShopBackboneClient` is a
 *   thin glue that delegates timing decisions to this module, which means
 *   a passing test here is sufficient to guarantee "revert at 10s" without
 *   booting a DOM.
 *
 * Validates: Requirement 8.7
 */

describe('shop-pending-revert — Req 8.7 (auto-revert after 10 seconds)', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-05-20T00:00:00.000Z'))
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('exposes the canonical 10_000ms TTL the requirement asks for', () => {
        expect(PENDING_REVERT_TIMEOUT_MS).toBe(10_000)
    })

    it('seeds initial pending ids with a shared timestamp', () => {
        const store = createPendingRevertStore({
            initialPendingItemIds: ['streak-freeze', 'mocktest-unlock'],
            seededAt: 1_000,
        })
        expect(store.entries).toHaveLength(2)
        expect(store.entries.every((e) => e.addedAt === 1_000)).toBe(true)
        expect(store.ttlMs).toBe(PENDING_REVERT_TIMEOUT_MS)
    })

    it('deduplicates initial pending ids', () => {
        const store = createPendingRevertStore({
            initialPendingItemIds: ['streak-freeze', 'streak-freeze'],
            seededAt: 0,
        })
        expect(store.entries).toHaveLength(1)
    })

    it('markPending is idempotent and preserves the original addedAt', () => {
        const t0 = Date.now()
        const seeded = createPendingRevertStore({ seededAt: t0 })
        const first = markPending(seeded, 'streak-freeze', t0)
        // Advance time and "mark again" — the deadline must not slip.
        vi.advanceTimersByTime(3_000)
        const second = markPending(first, 'streak-freeze', Date.now())
        expect(second).toBe(first)
        expect(second.entries).toHaveLength(1)
        expect(second.entries[0]!.addedAt).toBe(t0)
    })

    it('confirmPending removes the entry and is a no-op for unknown ids', () => {
        const t0 = Date.now()
        let store = createPendingRevertStore({ seededAt: t0 })
        store = markPending(store, 'streak-freeze', t0)
        store = markPending(store, 'mocktest-unlock', t0)
        const next = confirmPending(store, 'streak-freeze')
        expect(listPendingItemIds(next)).toEqual(['mocktest-unlock'])
        const same = confirmPending(next, 'unknown-id')
        expect(same).toBe(next)
    })

    it('releaseExpired returns no expirations BEFORE the 10s deadline', () => {
        const t0 = Date.now()
        let store = createPendingRevertStore({ seededAt: t0 })
        store = markPending(store, 'streak-freeze', t0)

        // Tick to 9.999s — must NOT expire yet.
        vi.advanceTimersByTime(PENDING_REVERT_TIMEOUT_MS - 1)
        const intermediate = releaseExpired(store, Date.now())
        expect(intermediate.expired).toEqual([])
        expect(intermediate.store).toBe(store)
        expect(listPendingItemIds(intermediate.store)).toEqual(['streak-freeze'])
    })

    it('releaseExpired flips the entry exactly AT the 10s boundary', () => {
        const t0 = Date.now()
        let store = createPendingRevertStore({ seededAt: t0 })
        store = markPending(store, 'streak-freeze', t0)

        // Tick to exactly 10s — Req 8.7 says "đạt timeout 10 giây", so this
        // must count as expired.
        vi.advanceTimersByTime(PENDING_REVERT_TIMEOUT_MS)
        const result = releaseExpired(store, Date.now())
        expect(result.expired).toEqual(['streak-freeze'])
        expect(listPendingItemIds(result.store)).toEqual([])
    })

    it('subsequent releaseExpired calls do not double-fire the same id', () => {
        const t0 = Date.now()
        let store = createPendingRevertStore({ seededAt: t0 })
        store = markPending(store, 'streak-freeze', t0)
        vi.advanceTimersByTime(PENDING_REVERT_TIMEOUT_MS)

        const first = releaseExpired(store, Date.now())
        expect(first.expired).toEqual(['streak-freeze'])
        const second = releaseExpired(first.store, Date.now())
        expect(second.expired).toEqual([])
        expect(second.store).toBe(first.store)
    })

    it('only expires the entries whose own TTL has elapsed', () => {
        const t0 = Date.now()
        let store = createPendingRevertStore({ seededAt: t0 })
        store = markPending(store, 'streak-freeze', t0)
        // Mark a second entry 4 seconds later.
        vi.advanceTimersByTime(4_000)
        store = markPending(store, 'mocktest-unlock', Date.now())

        // Advance to t0 + 10s — only the first entry expires.
        vi.advanceTimersByTime(PENDING_REVERT_TIMEOUT_MS - 4_000)
        const result = releaseExpired(store, Date.now())
        expect(result.expired).toEqual(['streak-freeze'])
        expect(listPendingItemIds(result.store)).toEqual(['mocktest-unlock'])

        // Advance the remaining 4s — the second entry expires now.
        vi.advanceTimersByTime(4_000)
        const tail = releaseExpired(result.store, Date.now())
        expect(tail.expired).toEqual(['mocktest-unlock'])
        expect(listPendingItemIds(tail.store)).toEqual([])
    })

    it('honours custom ttlMs overrides for tests / future tuning', () => {
        const store = createPendingRevertStore({ ttlMs: 1_000 })
        const t0 = Date.now()
        const next = markPending(store, 'streak-freeze', t0)
        vi.advanceTimersByTime(999)
        expect(releaseExpired(next, Date.now()).expired).toEqual([])
        vi.advanceTimersByTime(1)
        expect(releaseExpired(next, Date.now()).expired).toEqual(['streak-freeze'])
    })
})
