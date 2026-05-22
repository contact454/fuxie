/**
 * Unit tests for the shared completion-flow handler.
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: Gamification Designer (CTA labels)
 *
 * Spec source-of-truth:
 *   - Task 12.1 (gamified-ui-asset-rollout)
 *   - design.md §D / §I.5
 *   - requirements.md Req 7.1, 7.2, 7.3, 7.4, 7.6, 7.7, 10.5
 *
 * The component itself is integration-tested at the surface level (the
 * Vitest config runs in `node` so we cover only the pure / network
 * helpers here; FSM transitions are already pinned by
 * `result-reward-loop-fsm.test.ts`).
 *
 * Validates: Requirements 7.1, 7.2, 7.4, 7.6
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
    EARNED_DURATION_DEFAULT_MS,
    EARNED_DURATION_MAX_MS,
    EARNED_DURATION_MIN_MS,
} from '@/components/gamification/result-reward-loop-fsm'

import {
    assertEarnedDurationMsInRange,
    buildSaveThunk,
    chooseCompletionPrimaryCtaLabel,
} from './completion-flow'

// ---------------------------------------------------------------------------
// chooseCompletionPrimaryCtaLabel
// ---------------------------------------------------------------------------

describe('chooseCompletionPrimaryCtaLabel — design §I.5 / Req 7.4', () => {
    it('returns "Học bài kế tiếp" when a next step is queued', () => {
        expect(chooseCompletionPrimaryCtaLabel({ hasNextStep: true })).toBe(
            'Học bài kế tiếp',
        )
    })

    it('returns "Tiếp tục" when no next step is queued', () => {
        expect(chooseCompletionPrimaryCtaLabel({ hasNextStep: false })).toBe(
            'Tiếp tục',
        )
    })

    it('is a pure function — same input always returns the same output', () => {
        const a = chooseCompletionPrimaryCtaLabel({ hasNextStep: true })
        const b = chooseCompletionPrimaryCtaLabel({ hasNextStep: true })
        expect(a).toBe(b)
    })
})

// ---------------------------------------------------------------------------
// assertEarnedDurationMsInRange — Req 7.1, 7.2
// ---------------------------------------------------------------------------

describe('assertEarnedDurationMsInRange — Req 7.1, 7.2', () => {
    it('passes a value that is already inside the [1.2s, 2.0s] window', () => {
        expect(assertEarnedDurationMsInRange(1500)).toBe(1500)
        expect(assertEarnedDurationMsInRange(EARNED_DURATION_MIN_MS)).toBe(
            EARNED_DURATION_MIN_MS,
        )
        expect(assertEarnedDurationMsInRange(EARNED_DURATION_MAX_MS)).toBe(
            EARNED_DURATION_MAX_MS,
        )
    })

    it('clamps a value below the minimum to EARNED_DURATION_MIN_MS', () => {
        expect(assertEarnedDurationMsInRange(800)).toBe(EARNED_DURATION_MIN_MS)
    })

    it('clamps a value above the maximum to EARNED_DURATION_MAX_MS', () => {
        expect(assertEarnedDurationMsInRange(5000)).toBe(EARNED_DURATION_MAX_MS)
    })

    it('falls back to the default when the input is non-finite', () => {
        expect(assertEarnedDurationMsInRange(Number.NaN)).toBe(
            EARNED_DURATION_DEFAULT_MS,
        )
        expect(assertEarnedDurationMsInRange(Number.POSITIVE_INFINITY)).toBe(
            EARNED_DURATION_DEFAULT_MS,
        )
    })

    it('throws in strict mode when below the minimum', () => {
        expect(() => assertEarnedDurationMsInRange(800, { strict: true })).toThrow(
            RangeError,
        )
    })

    it('throws in strict mode when above the maximum', () => {
        expect(() => assertEarnedDurationMsInRange(5000, { strict: true })).toThrow(
            RangeError,
        )
    })

    it('throws in strict mode when input is non-finite', () => {
        expect(() =>
            assertEarnedDurationMsInRange(Number.NaN, { strict: true }),
        ).toThrow(RangeError)
    })
})

// ---------------------------------------------------------------------------
// buildSaveThunk — Req 7.6 (errors keep lesson data unconsumed)
// ---------------------------------------------------------------------------

describe('buildSaveThunk — Req 7.6, 7.7', () => {
    let originalFetch: typeof fetch | undefined

    beforeEach(() => {
        originalFetch = globalThis.fetch
    })

    afterEach(() => {
        if (originalFetch) {
            globalThis.fetch = originalFetch
        } else {
            // @ts-expect-error — tearing down the test stub.
            delete globalThis.fetch
        }
    })

    it('issues a POST with JSON-encoded body when one is supplied', async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ success: true }), { status: 200 }),
        )
        globalThis.fetch = fetchMock as unknown as typeof fetch

        const thunk = buildSaveThunk({
            url: '/api/v1/listening/abc/submit',
            body: { answers: { q1: 'A' } },
        })
        await thunk()

        expect(fetchMock).toHaveBeenCalledTimes(1)
        const [url, init] = fetchMock.mock.calls[0]!
        expect(url).toBe('/api/v1/listening/abc/submit')
        expect(init.method).toBe('POST')
        expect(init.headers).toEqual({ 'Content-Type': 'application/json' })
        expect(init.body).toBe(JSON.stringify({ answers: { q1: 'A' } }))
    })

    it('throws when the response is non-2xx so the FSM transitions to `error`', async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            new Response('boom', { status: 500, statusText: 'Server Error' }),
        )
        globalThis.fetch = fetchMock as unknown as typeof fetch

        const thunk = buildSaveThunk({ url: '/api/v1/exam/abc/submit' })
        await expect(thunk()).rejects.toThrow(/save failed: 500/i)
    })

    it('throws when `validate()` returns false even on a 200 response', async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ success: false }), { status: 200 }),
        )
        globalThis.fetch = fetchMock as unknown as typeof fetch

        const thunk = buildSaveThunk({
            url: '/api/v1/vocabulary/microgame/submit',
            body: { themeSlug: 'cafe' },
            validate: (_, parsed) =>
                Boolean((parsed as { success?: boolean })?.success),
        })
        await expect(thunk()).rejects.toThrow(/rejected by validator/i)
    })

    it('invokes onSuccess with the parsed body when the save succeeds', async () => {
        const payload = { success: true, score: 12 }
        const fetchMock = vi.fn().mockResolvedValue(
            new Response(JSON.stringify(payload), { status: 200 }),
        )
        globalThis.fetch = fetchMock as unknown as typeof fetch

        const onSuccess = vi.fn()
        const thunk = buildSaveThunk(
            { url: '/api/v1/listening/abc/submit', body: { answers: {} } },
            onSuccess,
        )
        await thunk()

        expect(onSuccess).toHaveBeenCalledTimes(1)
        expect(onSuccess).toHaveBeenCalledWith(payload)
    })

    it('does not set Content-Type when no body is provided', async () => {
        const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
        globalThis.fetch = fetchMock as unknown as typeof fetch

        const thunk = buildSaveThunk({ url: '/api/v1/exam/abc/submit' })
        await thunk()

        const [, init] = fetchMock.mock.calls[0]!
        expect(init.headers).toEqual({})
        expect(init.body).toBeUndefined()
    })

    it('honours custom headers passed via the request descriptor', async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ ok: true }), { status: 200 }),
        )
        globalThis.fetch = fetchMock as unknown as typeof fetch

        const thunk = buildSaveThunk({
            url: '/api/v1/exam/abc/submit',
            body: { answers: [] },
            headers: { 'X-Idempotency-Key': 'abc' },
        })
        await thunk()

        const [, init] = fetchMock.mock.calls[0]!
        expect(init.headers).toEqual({
            'Content-Type': 'application/json',
            'X-Idempotency-Key': 'abc',
        })
    })
})
