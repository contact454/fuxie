import { describe, it, expect } from 'vitest'

import {
    EARNED_DURATION_DEFAULT_MS,
    EARNED_DURATION_MAX_MS,
    EARNED_DURATION_MIN_MS,
    MAX_RETRY_ATTEMPTS,
    REDUCED_MOTION_BUDGET_MS,
    clampEarnedDurationMs,
    dataRewardStateForPhase,
    initResultRewardLoopState,
    remainingRetries,
    resultRewardLoopReducer,
    shouldRenderEarnedAnimation,
    type ResultRewardLoopEvent,
    type ResultRewardLoopState,
} from './result-reward-loop-fsm'

/**
 * Unit tests for the Result_Reward_Loop FSM (task 6.2).
 *
 * Acceptance (task 6.2): "test simulates a save error, retry chain, and
 * reduced-motion skip." These tests cover those three flows plus the
 * spec-window assertions on earned-phase duration.
 *
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7
 */

function run(
    initial: ResultRewardLoopState,
    events: ResultRewardLoopEvent[],
): ResultRewardLoopState {
    return events.reduce(resultRewardLoopReducer, initial)
}

describe('result-reward-loop-fsm: clampEarnedDurationMs', () => {
    it('Requirement 7.2: clamps earned duration into [1.2s, 2.0s]', () => {
        expect(clampEarnedDurationMs(800, false)).toBe(EARNED_DURATION_MIN_MS)
        expect(clampEarnedDurationMs(1200, false)).toBe(1200)
        expect(clampEarnedDurationMs(1500, false)).toBe(1500)
        expect(clampEarnedDurationMs(2000, false)).toBe(2000)
        expect(clampEarnedDurationMs(5000, false)).toBe(EARNED_DURATION_MAX_MS)
    })

    it('Requirement 7.5: reduced-motion forces duration to 0', () => {
        expect(clampEarnedDurationMs(1500, true)).toBe(0)
        expect(clampEarnedDurationMs(0, true)).toBe(0)
        expect(clampEarnedDurationMs(99999, true)).toBe(0)
    })

    it('non-finite input falls back to default duration', () => {
        expect(clampEarnedDurationMs(Number.NaN, false)).toBe(EARNED_DURATION_DEFAULT_MS)
        expect(clampEarnedDurationMs(Number.POSITIVE_INFINITY, false)).toBe(EARNED_DURATION_DEFAULT_MS)
    })
})

describe('result-reward-loop-fsm: initial state', () => {
    it('starts in `saving` with retryCount=0 and clamped earned duration by default', () => {
        const s = initResultRewardLoopState()
        expect(s.phase).toBe('saving')
        expect(s.retryCount).toBe(0)
        expect(s.reducedMotion).toBe(false)
        expect(s.earnedDurationMs).toBe(EARNED_DURATION_DEFAULT_MS)
    })

    it('Requirement 7.5: reduced-motion init produces earnedDurationMs=0', () => {
        const s = initResultRewardLoopState({ reducedMotion: true, earnedDurationMs: 1800 })
        expect(s.reducedMotion).toBe(true)
        expect(s.earnedDurationMs).toBe(0)
    })
})

describe('result-reward-loop-fsm: happy path saving → earned → receipt', () => {
    it('Requirement 7.1: SAVE_SUCCEEDED transitions saving → earned', () => {
        const s = run(initResultRewardLoopState(), [{ type: 'SAVE_SUCCEEDED' }])
        expect(s.phase).toBe('earned')
        expect(s.retryCount).toBe(0)
    })

    it('Requirement 7.1: EARNED_TIMER_ELAPSED transitions earned → receipt without tap', () => {
        const s = run(initResultRewardLoopState(), [
            { type: 'SAVE_SUCCEEDED' },
            { type: 'EARNED_TIMER_ELAPSED' },
        ])
        expect(s.phase).toBe('receipt')
    })

    it('Requirement 7.6: data-reward-state is `earned` then `receipt`, never set on saving/error/blocked', () => {
        expect(dataRewardStateForPhase('saving')).toBeNull()
        expect(dataRewardStateForPhase('earned')).toBe('earned')
        expect(dataRewardStateForPhase('receipt')).toBe('receipt')
        expect(dataRewardStateForPhase('error')).toBeNull()
        expect(dataRewardStateForPhase('blocked')).toBeNull()
    })

    it('PRIMARY_ACTION_TRIGGERED is idempotent on receipt', () => {
        const s1 = run(initResultRewardLoopState(), [
            { type: 'SAVE_SUCCEEDED' },
            { type: 'EARNED_TIMER_ELAPSED' },
        ])
        const s2 = resultRewardLoopReducer(s1, { type: 'PRIMARY_ACTION_TRIGGERED' })
        expect(s2.phase).toBe('receipt')
        expect(s2).toEqual(s1)
    })
})

describe('result-reward-loop-fsm: save error + retry chain (Requirement 7.7)', () => {
    it('first SAVE_FAILED transitions saving → error and bumps retryCount to 1', () => {
        const s = run(initResultRewardLoopState(), [{ type: 'SAVE_FAILED' }])
        expect(s.phase).toBe('error')
        expect(s.retryCount).toBe(1)
        expect(remainingRetries(s)).toBe(MAX_RETRY_ATTEMPTS - 1)
    })

    it('RETRY_REQUESTED in `error` returns to `saving` (retryCount preserved until next failure)', () => {
        const s = run(initResultRewardLoopState(), [
            { type: 'SAVE_FAILED' },
            { type: 'RETRY_REQUESTED' },
        ])
        expect(s.phase).toBe('saving')
        expect(s.retryCount).toBe(1)
    })

    it('Requirement 7.7: simulates the full save-error retry chain capped at 3 attempts', () => {
        // Start saving → fail (1) → retry → fail (2) → retry → fail (3) ⇒ blocked
        let s: ResultRewardLoopState = initResultRewardLoopState()
        s = resultRewardLoopReducer(s, { type: 'SAVE_FAILED' })
        expect(s.phase).toBe('error')
        expect(s.retryCount).toBe(1)

        s = resultRewardLoopReducer(s, { type: 'RETRY_REQUESTED' })
        expect(s.phase).toBe('saving')

        s = resultRewardLoopReducer(s, { type: 'SAVE_FAILED' })
        expect(s.phase).toBe('error')
        expect(s.retryCount).toBe(2)

        s = resultRewardLoopReducer(s, { type: 'RETRY_REQUESTED' })
        expect(s.phase).toBe('saving')

        s = resultRewardLoopReducer(s, { type: 'SAVE_FAILED' })
        // 3rd failure ⇒ blocked, retry counter pinned at MAX
        expect(s.phase).toBe('blocked')
        expect(s.retryCount).toBe(MAX_RETRY_ATTEMPTS)
        expect(remainingRetries(s)).toBe(0)
    })

    it('RETRY_REQUESTED is a no-op once blocked (terminal phase)', () => {
        let s = initResultRewardLoopState()
        for (let i = 0; i < MAX_RETRY_ATTEMPTS; i++) {
            s = resultRewardLoopReducer(s, { type: 'SAVE_FAILED' })
            if (s.phase === 'error') {
                s = resultRewardLoopReducer(s, { type: 'RETRY_REQUESTED' })
            }
        }
        expect(s.phase).toBe('blocked')
        const after = resultRewardLoopReducer(s, { type: 'RETRY_REQUESTED' })
        expect(after).toEqual(s)
    })

    it('SAVE_SUCCEEDED is ignored when not in `saving` (e.g. after a failed save)', () => {
        const errored = run(initResultRewardLoopState(), [{ type: 'SAVE_FAILED' }])
        const after = resultRewardLoopReducer(errored, { type: 'SAVE_SUCCEEDED' })
        expect(after.phase).toBe('error')
    })
})

describe('result-reward-loop-fsm: reduced-motion skip path (Requirements 7.5, 13.3)', () => {
    it('reduced-motion init pins earned duration to 0 ⇒ reveal animation is skipped', () => {
        const s = initResultRewardLoopState({ reducedMotion: true })
        expect(s.earnedDurationMs).toBe(0)
        expect(REDUCED_MOTION_BUDGET_MS).toBe(200)

        // After SAVE_SUCCEEDED the loop is `earned` but `shouldRenderEarnedAnimation`
        // is false because reducedMotion=true.
        const earned = resultRewardLoopReducer(s, { type: 'SAVE_SUCCEEDED' })
        expect(earned.phase).toBe('earned')
        expect(shouldRenderEarnedAnimation(earned)).toBe(false)

        // The earned timer is 0ms, so the next macrotask transitions to receipt.
        const receipt = resultRewardLoopReducer(earned, { type: 'EARNED_TIMER_ELAPSED' })
        expect(receipt.phase).toBe('receipt')
    })

    it('REDUCED_MOTION_CHANGED to true mid-flow re-clamps earnedDurationMs to 0', () => {
        const s = initResultRewardLoopState({ earnedDurationMs: 1800 })
        expect(s.earnedDurationMs).toBe(1800)

        const updated = resultRewardLoopReducer(s, {
            type: 'REDUCED_MOTION_CHANGED',
            reducedMotion: true,
        })
        expect(updated.reducedMotion).toBe(true)
        expect(updated.earnedDurationMs).toBe(0)
    })

    it('REDUCED_MOTION_CHANGED back to false restores a clamped default duration', () => {
        const reduced = initResultRewardLoopState({ reducedMotion: true })
        const restored = resultRewardLoopReducer(reduced, {
            type: 'REDUCED_MOTION_CHANGED',
            reducedMotion: false,
        })
        expect(restored.reducedMotion).toBe(false)
        // Restored to the spec window — exact value is the default since the
        // previous earnedDurationMs was 0.
        expect(restored.earnedDurationMs).toBeGreaterThanOrEqual(EARNED_DURATION_MIN_MS)
        expect(restored.earnedDurationMs).toBeLessThanOrEqual(EARNED_DURATION_MAX_MS)
    })
})

describe('result-reward-loop-fsm: invalid transitions are no-ops', () => {
    it('EARNED_TIMER_ELAPSED outside `earned` is ignored', () => {
        const s = initResultRewardLoopState()
        const after = resultRewardLoopReducer(s, { type: 'EARNED_TIMER_ELAPSED' })
        expect(after).toEqual(s)
    })

    it('SAVE_FAILED in `earned` is ignored (only `saving` can fail)', () => {
        const earned = run(initResultRewardLoopState(), [{ type: 'SAVE_SUCCEEDED' }])
        const after = resultRewardLoopReducer(earned, { type: 'SAVE_FAILED' })
        expect(after).toEqual(earned)
    })

    it('SAVE_STARTED while already saving is a no-op (no double-fire)', () => {
        const s = initResultRewardLoopState()
        const after = resultRewardLoopReducer(s, { type: 'SAVE_STARTED' })
        expect(after).toBe(s)
    })

    it('SAVE_STARTED from `error` re-enters `saving` (manual reset path)', () => {
        const errored = run(initResultRewardLoopState(), [{ type: 'SAVE_FAILED' }])
        const restarted = resultRewardLoopReducer(errored, { type: 'SAVE_STARTED' })
        expect(restarted.phase).toBe('saving')
        expect(restarted.retryCount).toBe(1) // counter preserved
    })
})
