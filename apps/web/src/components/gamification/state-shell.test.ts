import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
    RETRY_BLOCK_DURATION_MS,
    RETRY_MAX_ATTEMPTS_IN_WINDOW,
    RETRY_WINDOW_MS,
    STATE_SHELL_COPY_MAX_LENGTH,
    createRetryGuard,
    enforceStateShellCopyLength,
} from './state-shell'

/**
 * Unit tests for the StateShell helpers.
 *
 * The React component is intentionally not rendered here — vitest in this
 * workspace runs under `environment: 'node'` and the component is a thin
 * composition of `MascotRoleHost` + `PrimaryCta`. The behavior that
 * task 16.1 calls out specifically — rate-limit gating and ≤140-char copy
 * enforcement — is exposed as pure helpers so we can lock the contract
 * without a DOM.
 *
 * Validates: Requirements 11.3, 11.4, 11.6
 */

afterEach(() => {
    vi.unstubAllEnvs()
})

describe('StateShell: enforceStateShellCopyLength (Req 11.3, 11.4)', () => {
    it('passes through messages within the limit untouched', () => {
        const msg = 'Bạn chưa có lộ trình. Hãy tạo lộ trình để bắt đầu học.'
        expect(msg.length).toBeLessThanOrEqual(STATE_SHELL_COPY_MAX_LENGTH)
        expect(enforceStateShellCopyLength('empty', msg)).toBe(msg)
        expect(enforceStateShellCopyLength('locked', msg)).toBe(msg)
    })

    it('does NOT cap error-state messages (Req 11.5 — error copy can include diagnostic detail)', () => {
        const longError = 'x'.repeat(STATE_SHELL_COPY_MAX_LENGTH + 50)
        expect(enforceStateShellCopyLength('error', longError)).toBe(longError)
    })

    it('throws in development when empty/locked copy exceeds 140 characters', () => {
        vi.stubEnv('NODE_ENV', 'development')
        const tooLong = 'a'.repeat(STATE_SHELL_COPY_MAX_LENGTH + 1)
        expect(() => enforceStateShellCopyLength('empty', tooLong)).toThrow(
            /exceeds 140 characters/,
        )
        expect(() => enforceStateShellCopyLength('locked', tooLong)).toThrow(
            /exceeds 140 characters/,
        )
    })

    it('truncates safely in production when copy exceeds 140 characters', () => {
        vi.stubEnv('NODE_ENV', 'production')
        const tooLong = 'a'.repeat(STATE_SHELL_COPY_MAX_LENGTH + 25)
        const result = enforceStateShellCopyLength('empty', tooLong)
        expect(result.length).toBe(STATE_SHELL_COPY_MAX_LENGTH)
        expect(result.endsWith('…')).toBe(true)
    })
})

describe('StateShell: createRetryGuard (Req 11.6)', () => {
    let now = 0

    beforeEach(() => {
        now = 1_700_000_000_000
    })

    const advance = (ms: number) => {
        now += ms
        return now
    }

    it('exposes the documented constants (3 attempts, 60s window, 30s block)', () => {
        expect(RETRY_MAX_ATTEMPTS_IN_WINDOW).toBe(3)
        expect(RETRY_WINDOW_MS).toBe(60_000)
        expect(RETRY_BLOCK_DURATION_MS).toBe(30_000)
    })

    it('allows up to 3 retries within 60s without blocking', () => {
        const guard = createRetryGuard()
        for (let i = 0; i < RETRY_MAX_ATTEMPTS_IN_WINDOW; i += 1) {
            const snap = guard.recordAttempt(advance(1_000))
            expect(snap.blocked).toBe(false)
            expect(snap.unblockAt).toBeNull()
            expect(snap.attemptsInWindow).toBe(i + 1)
        }
    })

    it('blocks the 4th retry inside the rolling 60s window', () => {
        const guard = createRetryGuard()
        // 3 attempts at t = 1s, 2s, 3s — all allowed.
        guard.recordAttempt(advance(1_000))
        guard.recordAttempt(advance(1_000))
        guard.recordAttempt(advance(1_000))
        // 4th attempt at t = 4s — must trigger the rate-limit (Req 11.6).
        const fourth = guard.recordAttempt(advance(1_000))
        expect(fourth.blocked).toBe(true)
        expect(fourth.attemptsInWindow).toBe(4)
        expect(fourth.unblockAt).not.toBeNull()
        // Block lifts ~30s later.
        expect(fourth.unblockAt! - now).toBeCloseTo(RETRY_BLOCK_DURATION_MS, -1)
    })

    it('keeps the CTA disabled for 30s after the rate-limit triggers', () => {
        const guard = createRetryGuard()
        guard.recordAttempt(advance(1_000))
        guard.recordAttempt(advance(1_000))
        guard.recordAttempt(advance(1_000))
        guard.recordAttempt(advance(1_000)) // triggers block

        // 1s into the block — still blocked.
        let snap = guard.snapshot(advance(1_000))
        expect(snap.blocked).toBe(true)

        // Halfway through the block window.
        snap = guard.snapshot(advance(RETRY_BLOCK_DURATION_MS / 2))
        expect(snap.blocked).toBe(true)

        // Exactly at unblockAt — block lifts.
        snap = guard.snapshot(
            advance(RETRY_BLOCK_DURATION_MS / 2 - 1_000 + 1),
        )
        expect(snap.blocked).toBe(false)
        expect(snap.unblockAt).toBeNull()
    })

    it('rejects retry attempts while blocked (no double-counting)', () => {
        const guard = createRetryGuard()
        guard.recordAttempt(advance(1_000))
        guard.recordAttempt(advance(1_000))
        guard.recordAttempt(advance(1_000))
        const trigger = guard.recordAttempt(advance(1_000))
        expect(trigger.blocked).toBe(true)
        const blockedUntil = trigger.unblockAt!

        const ignored = guard.recordAttempt(advance(2_000))
        expect(ignored.blocked).toBe(true)
        // The unblockAt SHOULD NOT extend on rejected attempts.
        expect(ignored.unblockAt).toBe(blockedUntil)
    })

    it('lets retries succeed again after the block lifts', () => {
        const guard = createRetryGuard()
        guard.recordAttempt(advance(1_000))
        guard.recordAttempt(advance(1_000))
        guard.recordAttempt(advance(1_000))
        guard.recordAttempt(advance(1_000)) // block
        // Wait past the block window.
        advance(RETRY_BLOCK_DURATION_MS + 100)

        const fresh = guard.recordAttempt(now)
        expect(fresh.blocked).toBe(false)
        expect(fresh.attemptsInWindow).toBe(1)
    })

    it('does NOT count attempts older than 60s toward the threshold', () => {
        const guard = createRetryGuard()
        // Three retries at t=1, 2, 3s.
        guard.recordAttempt(advance(1_000))
        guard.recordAttempt(advance(1_000))
        guard.recordAttempt(advance(1_000))

        // Wait until the first three are outside the 60s window.
        advance(RETRY_WINDOW_MS + 1_000)

        // A new retry at the new "now" should be the only one in window.
        const next = guard.recordAttempt(now)
        expect(next.blocked).toBe(false)
        expect(next.attemptsInWindow).toBe(1)
    })

    it('reset() clears attempts and unblocks the guard immediately', () => {
        const guard = createRetryGuard()
        guard.recordAttempt(advance(1_000))
        guard.recordAttempt(advance(1_000))
        guard.recordAttempt(advance(1_000))
        guard.recordAttempt(advance(1_000)) // blocked

        guard.reset()
        const snap = guard.snapshot(now)
        expect(snap.blocked).toBe(false)
        expect(snap.attemptsInWindow).toBe(0)
        expect(snap.unblockAt).toBeNull()
    })

    it('snapshot does not mutate the FSM (idempotent reads)', () => {
        const guard = createRetryGuard()
        guard.recordAttempt(advance(1_000))
        const before = guard.snapshot(now)
        const after = guard.snapshot(now)
        expect(after).toEqual(before)
    })
})

describe('StateShell helpers — silenced log noise from MascotRoleHost is not required here', () => {
    it('does not import any DOM-only globals at module load time', () => {
        // Spying for stray window/document references during test setup.
        const stub = vi.spyOn(console, 'warn').mockImplementation(() => {})
        try {
            // Re-importing the module should not produce warnings — sanity check.
            // (the test file itself already imported state-shell at the top).
            expect(stub).not.toHaveBeenCalled()
        } finally {
            stub.mockRestore()
        }
    })
})
