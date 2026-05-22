import { describe, it, expect } from 'vitest'

import {
    applySkillPlayerFsmEvent,
    SKILL_PLAYER_LOAD_TIMEOUT_MS,
    SKILL_PLAYER_MAX_RETRIES,
    type SkillPlayerFsmState,
} from './skill-player-shell'

/**
 * Unit tests for the asset-failure FSM that powers
 * {@link SkillPlayerShell}.
 *
 * The component itself is exercised at the surface level via Playwright /
 * jsdom (out of scope here); these tests pin the pure transition logic so
 * future regressions are caught without spinning up React.
 *
 * Validates: Requirements 6.10, 6.11
 */

const initial: SkillPlayerFsmState = { phase: 'loading', failureCount: 0 }

describe('SkillPlayerShell FSM — public constants', () => {
    it('pins the 10-second load deadline mandated by Requirement 6.10', () => {
        // Requirement 6.10 — "trong vòng 10 giây kể từ khi route navigate".
        expect(SKILL_PLAYER_LOAD_TIMEOUT_MS).toBe(10_000)
    })

    it('pins the 3-failure downgrade threshold mandated by Requirement 6.11', () => {
        expect(SKILL_PLAYER_MAX_RETRIES).toBe(3)
    })
})

describe('SkillPlayerShell FSM — happy path', () => {
    it('transitions loading → ready on `asset-loaded`', () => {
        const next = applySkillPlayerFsmEvent(initial, { type: 'asset-loaded' })
        expect(next).toEqual({ phase: 'ready', failureCount: 0 })
    })

    it('ignores stale `timeout` events once the asset is ready', () => {
        const ready: SkillPlayerFsmState = { phase: 'ready', failureCount: 0 }
        const next = applySkillPlayerFsmEvent(ready, { type: 'timeout' })
        expect(next).toBe(ready)
    })

    it('recovers to ready and resets failureCount on `asset-loaded` from any phase', () => {
        const errored: SkillPlayerFsmState = { phase: 'error', failureCount: 2 }
        const next = applySkillPlayerFsmEvent(errored, { type: 'asset-loaded' })
        expect(next).toEqual({ phase: 'ready', failureCount: 0 })

        const blocked: SkillPlayerFsmState = { phase: 'blocked', failureCount: 3 }
        const recovered = applySkillPlayerFsmEvent(blocked, { type: 'asset-loaded' })
        expect(recovered).toEqual({ phase: 'ready', failureCount: 0 })
    })
})

describe('SkillPlayerShell FSM — error path (Requirement 6.10)', () => {
    it('transitions loading → error on `timeout`, incrementing failureCount', () => {
        const next = applySkillPlayerFsmEvent(initial, { type: 'timeout' })
        expect(next).toEqual({ phase: 'error', failureCount: 1 })
    })

    it('transitions loading → error on `asset-error`, incrementing failureCount', () => {
        const next = applySkillPlayerFsmEvent(initial, { type: 'asset-error' })
        expect(next).toEqual({ phase: 'error', failureCount: 1 })
    })

    it('transitions ready → error on `asset-error` (e.g. <audio> error after metadata loaded)', () => {
        const ready: SkillPlayerFsmState = { phase: 'ready', failureCount: 0 }
        const next = applySkillPlayerFsmEvent(ready, { type: 'asset-error' })
        expect(next).toEqual({ phase: 'error', failureCount: 1 })
    })

    it('returns to loading on `retry` without changing failureCount (failures tick on outcome, not click)', () => {
        const errored: SkillPlayerFsmState = { phase: 'error', failureCount: 1 }
        const next = applySkillPlayerFsmEvent(errored, { type: 'retry' })
        expect(next).toEqual({ phase: 'loading', failureCount: 1 })
    })
})

describe('SkillPlayerShell FSM — 3-failure downgrade (Requirement 6.11)', () => {
    it('downgrades to `blocked` on the third consecutive `timeout`', () => {
        let state = initial
        state = applySkillPlayerFsmEvent(state, { type: 'timeout' })
        expect(state).toEqual({ phase: 'error', failureCount: 1 })

        state = applySkillPlayerFsmEvent(state, { type: 'retry' })
        state = applySkillPlayerFsmEvent(state, { type: 'timeout' })
        expect(state).toEqual({ phase: 'error', failureCount: 2 })

        state = applySkillPlayerFsmEvent(state, { type: 'retry' })
        state = applySkillPlayerFsmEvent(state, { type: 'timeout' })
        expect(state).toEqual({ phase: 'blocked', failureCount: 3 })
    })

    it('downgrades to `blocked` on three mixed timeout / asset-error failures', () => {
        let state = initial
        state = applySkillPlayerFsmEvent(state, { type: 'asset-error' })
        state = applySkillPlayerFsmEvent(state, { type: 'retry' })
        state = applySkillPlayerFsmEvent(state, { type: 'timeout' })
        state = applySkillPlayerFsmEvent(state, { type: 'retry' })
        state = applySkillPlayerFsmEvent(state, { type: 'asset-error' })

        expect(state).toEqual({ phase: 'blocked', failureCount: 3 })
    })

    it('caps failureCount at SKILL_PLAYER_MAX_RETRIES even with extra timeouts', () => {
        const blocked: SkillPlayerFsmState = { phase: 'blocked', failureCount: 3 }
        const next = applySkillPlayerFsmEvent(blocked, { type: 'asset-error' })
        // Already at the cap — failureCount must not overflow the contract.
        expect(next.failureCount).toBeLessThanOrEqual(SKILL_PLAYER_MAX_RETRIES)
        expect(next.phase).toBe('blocked')
    })

    it('treats `retry` from `blocked` as a no-op (CTA is secondary, clicks inert)', () => {
        const blocked: SkillPlayerFsmState = { phase: 'blocked', failureCount: 3 }
        const next = applySkillPlayerFsmEvent(blocked, { type: 'retry' })
        expect(next).toBe(blocked)
    })
})

describe('SkillPlayerShell FSM — preserved progress invariant (Requirement 6.10)', () => {
    it('progress (failureCount) stays monotonic across retry chains', () => {
        let state = initial
        const observed: number[] = [state.failureCount]

        for (let i = 0; i < 5; i++) {
            state = applySkillPlayerFsmEvent(state, { type: 'timeout' })
            observed.push(state.failureCount)
            if (state.phase === 'blocked') break
            state = applySkillPlayerFsmEvent(state, { type: 'retry' })
            observed.push(state.failureCount)
        }

        // The counter only ticks up on a *failure* (timeout / asset-error),
        // never on a `retry` click — so progress accounting matches the
        // "third failure downgrades the CTA" contract verbatim.
        for (let i = 1; i < observed.length; i++) {
            expect(observed[i]).toBeGreaterThanOrEqual(observed[i - 1]!)
        }

        expect(state.phase).toBe('blocked')
        expect(state.failureCount).toBe(SKILL_PLAYER_MAX_RETRIES)
    })
})
