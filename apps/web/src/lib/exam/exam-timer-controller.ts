/**
 * exam-timer-controller — pure FSM for the exam timer + connectivity state.
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: (none — pure logic, no design surface)
 *
 * Spec source-of-truth:
 *   - Task 15.2 (gamified-ui-asset-rollout)
 *   - design.md §I.8 (Exam — formal credibility)
 *   - requirements.md Req 10.3, 10.6
 *
 * Why a pure module:
 *   The repo runs vitest in the `node` environment (no jsdom — see
 *   `apps/web/vitest.config.ts`). Mirroring `lib/exam/exam-progress-storage.ts`
 *   (Task 15.2 storage) and `lib/gamification/shop-pending-revert.ts`
 *   (Task 13.3 revert FSM), all timer + connectivity transitions are
 *   modelled as pure functions over a serialisable state object. The
 *   React glue (`useExamProgress`) drives `setInterval` / `online` /
 *   `offline` and forwards every transition through these helpers, so
 *   the deterministic tests in this file are sufficient to guarantee
 *   Req 10.3 / 10.6 without booting a DOM.
 *
 * Contract (machine-checkable):
 *   - `tick(state, deltaMs)`:
 *       1. Only consumes time when `state.status === 'running'` AND
 *          `state.online === true` (Req 10.6 — "pause timer" on
 *          disconnect).
 *       2. Decrements `remainingMs` by `deltaMs`, clamped to ≥ 0.
 *       3. When `remainingMs` reaches 0 the status transitions to
 *          `'expired'` (Req 10.3 — auto-submit anchor).
 *   - `setOnline(state, online)`:
 *       1. Going `online → false` while `running` flips status to
 *          `'paused'` (Req 10.6 — "Tiếp tục" disabled until reconnect).
 *       2. Going `offline → true` while `paused` flips status back to
 *          `'running'` so the host can resume the interval.
 *       3. Never changes status when status is `'expired'` or
 *          `'submitting'` — those are terminal/owned by the host.
 *   - `markSubmitting(state)` and `markSubmitted(state)` are simple
 *     phase transitions used by the host to halt further ticks while
 *     a submission is in flight (no save/restore once finished).
 *
 *   All operations are pure: identical inputs ⇒ identical output, no
 *   IO, no mutation of the input object.
 */

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/**
 * Phases the host UI cares about:
 *   - `running`     : timer counting down (online).
 *   - `paused`      : timer halted because the device is offline (Req 10.6).
 *                     The "Tiếp tục" CTA stays disabled while in this state.
 *   - `expired`     : `remainingMs` reached 0 — host MUST auto-submit
 *                     within 2s of entering this state (Req 10.3).
 *   - `submitting`  : host has handed control to the network submit; the
 *                     controller stops decrementing time even on tick.
 */
export type ExamTimerStatus = 'running' | 'paused' | 'expired' | 'submitting'

export interface ExamTimerState {
    /** Remaining countdown in milliseconds. Always ≥ 0. */
    remainingMs: number
    /** Mirror of `navigator.onLine` (or the offline-event signal). */
    online: boolean
    /** Current phase — see {@link ExamTimerStatus}. */
    status: ExamTimerStatus
}

// -----------------------------------------------------------------------------
// Constructors
// -----------------------------------------------------------------------------

/**
 * Build the initial timer state for a fresh attempt.
 *
 * - `remainingMs` is floored and clamped to ≥ 0 so a negative seed cannot
 *   poison subsequent ticks.
 * - `status` defaults to `'running'` while online, `'paused'` while
 *   offline (consistent with Req 10.6 — disconnect mid-attempt).
 */
export function createExamTimerState(
    initialRemainingMs: number,
    online: boolean,
): ExamTimerState {
    const remainingMs = clampRemaining(initialRemainingMs)
    return {
        remainingMs,
        online,
        status: remainingMs === 0 ? 'expired' : online ? 'running' : 'paused',
    }
}

// -----------------------------------------------------------------------------
// Transitions
// -----------------------------------------------------------------------------

/**
 * Advance the timer by `deltaMs`.
 *
 * Time only flows while the controller is `running` AND `online`. Once
 * `remainingMs` hits 0 the status transitions to `'expired'` (Req 10.3
 * auto-submit anchor) and any further tick is a no-op.
 *
 * Validates: Requirements 10.3, 10.6
 */
export function tick(state: ExamTimerState, deltaMs: number): ExamTimerState {
    if (state.status !== 'running' || !state.online) return state
    if (!Number.isFinite(deltaMs) || deltaMs <= 0) return state

    const next = clampRemaining(state.remainingMs - deltaMs)
    if (next === 0) {
        return { ...state, remainingMs: 0, status: 'expired' }
    }
    return { ...state, remainingMs: next }
}

/**
 * Apply a connectivity transition.
 *
 *   - going offline while running ⇒ pause (Req 10.6 disconnect pause)
 *   - going back online while paused ⇒ resume running (Req 10.6 reconnect)
 *   - terminal phases (`expired`, `submitting`) never change phase here;
 *     the host owns those transitions.
 *
 * Validates: Requirement 10.6
 */
export function setOnline(
    state: ExamTimerState,
    online: boolean,
): ExamTimerState {
    if (state.online === online) return state
    if (state.status === 'expired' || state.status === 'submitting') {
        return { ...state, online }
    }
    if (!online && state.status === 'running') {
        return { ...state, online: false, status: 'paused' }
    }
    if (online && state.status === 'paused') {
        // Resume only when there is still time on the clock; if the
        // recovery snapshot was zero (edge case) jump straight to expired.
        if (state.remainingMs === 0) {
            return { ...state, online: true, status: 'expired' }
        }
        return { ...state, online: true, status: 'running' }
    }
    return { ...state, online }
}

/** Hand control to the host's submit path — further ticks become no-ops. */
export function markSubmitting(state: ExamTimerState): ExamTimerState {
    if (state.status === 'submitting') return state
    return { ...state, status: 'submitting' }
}

/**
 * Convenience predicate the host uses to know whether to fire a one-shot
 * auto-submit dispatch (Req 10.3 — within 2s of reaching 00:00).
 */
export function shouldAutoSubmit(state: ExamTimerState): boolean {
    return state.status === 'expired'
}

/**
 * Convenience predicate the host uses to gate the "Tiếp tục" CTA — must
 * stay disabled while the controller is paused (Req 10.6).
 */
export function isPausedForOffline(state: ExamTimerState): boolean {
    return state.status === 'paused'
}

// -----------------------------------------------------------------------------
// Internal helpers
// -----------------------------------------------------------------------------

function clampRemaining(value: number): number {
    if (!Number.isFinite(value)) return 0
    if (value <= 0) return 0
    return Math.floor(value)
}
