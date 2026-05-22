import { describe, expect, it } from 'vitest'

import {
    createExamTimerState,
    isPausedForOffline,
    markSubmitting,
    setOnline,
    shouldAutoSubmit,
    tick,
    type ExamTimerState,
} from './exam-timer-controller'

/**
 * Co-located unit tests for the exam timer FSM.
 *
 * Vai chinh: Frontend Engineer
 *
 * Spec source-of-truth:
 *   - Task 15.2 (gamified-ui-asset-rollout)
 *   - design.md §I.8 (Exam — formal credibility)
 *   - requirements.md Req 10.3, 10.6
 *
 * Every transition is a pure function over a serialisable state object so
 * the React glue (`useExamProgress`) can be exercised against behaviour
 * verified here without booting jsdom.
 */

const STARTED = (online: boolean): ExamTimerState =>
    createExamTimerState(35 * 60 * 1000, online)

describe('createExamTimerState', () => {
    it('starts running when online and time is positive', () => {
        const s = STARTED(true)
        expect(s.status).toBe('running')
        expect(s.remainingMs).toBe(35 * 60 * 1000)
        expect(s.online).toBe(true)
    })

    it('starts paused when offline', () => {
        const s = STARTED(false)
        expect(s.status).toBe('paused')
        expect(s.online).toBe(false)
    })

    it('starts expired when remainingMs is already zero', () => {
        const s = createExamTimerState(0, true)
        expect(s.status).toBe('expired')
        expect(s.remainingMs).toBe(0)
    })

    it('clamps negative or non-finite seeds to zero', () => {
        expect(createExamTimerState(-1, true).remainingMs).toBe(0)
        expect(createExamTimerState(Number.NaN, true).remainingMs).toBe(0)
    })
})

describe('tick — Req 10.6 (pause on disconnect)', () => {
    it('decrements remainingMs while running + online', () => {
        const s = STARTED(true)
        const next = tick(s, 5_000)
        expect(next.remainingMs).toBe(s.remainingMs - 5_000)
        expect(next.status).toBe('running')
    })

    it('is a no-op while paused (offline)', () => {
        const s = STARTED(false)
        expect(tick(s, 5_000)).toBe(s)
    })

    it('is a no-op while submitting', () => {
        const submitting = markSubmitting(STARTED(true))
        expect(tick(submitting, 5_000)).toBe(submitting)
    })

    it('is a no-op while expired', () => {
        const expired = createExamTimerState(0, true)
        expect(tick(expired, 5_000)).toBe(expired)
    })

    it('ignores zero or negative deltaMs', () => {
        const s = STARTED(true)
        expect(tick(s, 0)).toBe(s)
        expect(tick(s, -1_000)).toBe(s)
        expect(tick(s, Number.NaN)).toBe(s)
    })
})

describe('tick — Req 10.3 (transition to expired at 00:00)', () => {
    it('flips to expired when remainingMs hits zero', () => {
        const s = createExamTimerState(1_500, true)
        const next = tick(s, 1_500)
        expect(next.remainingMs).toBe(0)
        expect(next.status).toBe('expired')
    })

    it('flips to expired even when delta overshoots remaining time', () => {
        const s = createExamTimerState(800, true)
        const next = tick(s, 5_000)
        expect(next.remainingMs).toBe(0)
        expect(next.status).toBe('expired')
    })

    it('shouldAutoSubmit is true exactly when status is expired', () => {
        expect(shouldAutoSubmit(STARTED(true))).toBe(false)
        expect(shouldAutoSubmit(STARTED(false))).toBe(false)
        expect(
            shouldAutoSubmit(tick(createExamTimerState(1_000, true), 1_000)),
        ).toBe(true)
    })
})

describe('setOnline — Req 10.6 (pause/resume on connectivity change)', () => {
    it('running → paused when going offline', () => {
        const next = setOnline(STARTED(true), false)
        expect(next.status).toBe('paused')
        expect(next.online).toBe(false)
        // Time on the clock is preserved for resume.
        expect(next.remainingMs).toBe(STARTED(true).remainingMs)
    })

    it('paused → running when reconnecting', () => {
        const offline = STARTED(false)
        const reconnected = setOnline(offline, true)
        expect(reconnected.status).toBe('running')
        expect(reconnected.online).toBe(true)
    })

    it('isPausedForOffline mirrors the paused status', () => {
        expect(isPausedForOffline(STARTED(false))).toBe(true)
        expect(isPausedForOffline(STARTED(true))).toBe(false)
    })

    it('is a no-op when the connectivity bit does not change', () => {
        const s = STARTED(true)
        expect(setOnline(s, true)).toBe(s)
    })

    it('does not unpause an attempt that ran out of time while offline', () => {
        // Edge case: remainingMs was zero in the recovery snapshot.
        const s: ExamTimerState = {
            remainingMs: 0,
            online: false,
            status: 'paused',
        }
        const next = setOnline(s, true)
        expect(next.status).toBe('expired')
    })

    it('preserves expired status across connectivity changes', () => {
        const expired = createExamTimerState(0, true)
        expect(setOnline(expired, false).status).toBe('expired')
        expect(setOnline(expired, true).status).toBe('expired')
    })

    it('preserves submitting status across connectivity changes', () => {
        const submitting = markSubmitting(STARTED(true))
        expect(setOnline(submitting, false).status).toBe('submitting')
    })
})

describe('markSubmitting', () => {
    it('flips status to submitting once', () => {
        const s = STARTED(true)
        const next = markSubmitting(s)
        expect(next.status).toBe('submitting')
        // Idempotent — second call returns the same reference.
        expect(markSubmitting(next)).toBe(next)
    })
})
