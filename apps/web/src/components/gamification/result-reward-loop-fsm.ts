/**
 * Result Reward Loop — Finite State Machine (FSM)
 *
 * Pure, framework-agnostic state-machine for the Result_Reward_Loop surface
 * (design §D, task 6.2). The FSM is split out from the React component so the
 * transitions, retry counter, and reduced-motion skip path can be unit-tested
 * in the existing `node` test environment without jsdom.
 *
 * Phases (design §D state diagram):
 *
 *   ┌────────┐  save success    ┌────────┐  timer 1.2–2.0s   ┌─────────┐
 *   │ Saving │ ───────────────▶ │ Earned │ ────────────────▶ │ Receipt │
 *   └────────┘                  └────────┘                   └─────────┘
 *        │                                                        ▲
 *        │ save fail                                               │ user taps
 *        ▼                                                         │ Primary_CTA
 *   ┌────────┐  retry (≤ 3)                                        │
 *   │ Error  │ ─────────────────────────────────────────────────── │
 *   └────────┘                                                     │
 *        │ ≥ 3 fails                                               │
 *        ▼                                                         │
 *   ┌─────────┐                                                    │
 *   │ Blocked │                                                    │
 *   └─────────┘                                                    │
 *                                                                  ▼
 *                                                                [Done]
 *
 * Special path — reduced motion (Requirement 7.5, 13.3):
 *   Saving → Earned → Receipt completes within ≤ 200ms (animation skipped),
 *   so the FSM exposes a `reducedMotion` flag that callers honour by setting
 *   the earned phase duration to 0 and advancing immediately.
 *
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7
 */

// -----------------------------------------------------------------------------
// Constants — design §D
// -----------------------------------------------------------------------------

/**
 * Earned-phase duration window in milliseconds (Requirements 7.1, 7.2).
 * The component must stay on the `earned` phase for at least
 * `EARNED_DURATION_MIN_MS` and at most `EARNED_DURATION_MAX_MS` before
 * auto-advancing to `receipt`. Default `1500` lives in the middle of the
 * window.
 */
export const EARNED_DURATION_MIN_MS = 1200
export const EARNED_DURATION_MAX_MS = 2000
export const EARNED_DURATION_DEFAULT_MS = 1500

/**
 * Reduced-motion budget (Requirements 7.5, 13.3). With `prefers-reduced-motion:
 * reduce`, the FSM must advance from a successful save to `receipt` within
 * 200ms. The earned phase still mounts for one frame so the closing pose can
 * paint as a static frame — but the timer is configured to `0`.
 */
export const REDUCED_MOTION_BUDGET_MS = 200

/**
 * Maximum number of `onRetry` attempts before the FSM transitions to
 * `blocked` (Requirement 7.7). The cap counts attempts, not failures, so the
 * 3rd attempt failing transitions to `blocked` (and the next "Thử lại" CTA
 * is removed).
 */
export const MAX_RETRY_ATTEMPTS = 3

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/**
 * Discrete phases of the Result_Reward_Loop FSM.
 *
 * - `saving`  Save action in flight. No reward animation, no mascot cheer.
 * - `earned`  Save succeeded. Mascot=cheer, reward asset reveal animation
 *             active, `data-reward-state="earned"` on root.
 * - `receipt` Earned timer elapsed. Show XP/Fucoin/accuracy/time + 1
 *             Primary_CTA, `data-reward-state="receipt"`.
 * - `error`   Save failed and retries are still available. Show "Thử lại".
 * - `blocked` Save failed and `MAX_RETRY_ATTEMPTS` attempts have been used.
 *             Show "kiểm tra kết nối" and downgrade Primary_CTA to secondary.
 */
export type ResultRewardLoopPhase = 'saving' | 'earned' | 'receipt' | 'error' | 'blocked'

/**
 * FSM state. `retryCount` counts attempts that have already been made (i.e.
 * failed save calls or successful save calls — both increment). The FSM
 * blocks at `MAX_RETRY_ATTEMPTS` only on the failure path.
 */
export interface ResultRewardLoopState {
    phase: ResultRewardLoopPhase
    /**
     * Number of save attempts that have *failed* so far. Reaches
     * `MAX_RETRY_ATTEMPTS` on the failure path triggers `blocked`.
     */
    retryCount: number
    /** True iff `prefers-reduced-motion: reduce` is active for this loop. */
    reducedMotion: boolean
    /**
     * Duration the `earned` phase should remain mounted before the FSM
     * transitions to `receipt`. Always `0` while `reducedMotion === true`.
     * Otherwise clamped to `[EARNED_DURATION_MIN_MS, EARNED_DURATION_MAX_MS]`.
     */
    earnedDurationMs: number
}

/**
 * Discrete events the FSM accepts. Pure transitions — no side effects.
 */
export type ResultRewardLoopEvent =
    | { type: 'SAVE_STARTED' }
    | { type: 'SAVE_SUCCEEDED' }
    | { type: 'SAVE_FAILED' }
    | { type: 'EARNED_TIMER_ELAPSED' }
    | { type: 'RETRY_REQUESTED' }
    | { type: 'PRIMARY_ACTION_TRIGGERED' }
    | { type: 'REDUCED_MOTION_CHANGED'; reducedMotion: boolean }

/**
 * Init options — caller can pin a custom earned-phase duration (still
 * clamped to the spec window) and the initial reduced-motion setting.
 */
export interface ResultRewardLoopInit {
    /** Initial phase. Defaults to `'saving'` so the FSM mirrors a fresh
     *  completion flow. Set to `'error'` when re-mounting after a previously
     *  failed save. */
    initialPhase?: ResultRewardLoopPhase
    /** Initial number of failures already accumulated. Defaults to `0`. */
    initialRetryCount?: number
    /** Earned-phase duration in milliseconds. Clamped to
     *  `[EARNED_DURATION_MIN_MS, EARNED_DURATION_MAX_MS]`. Defaults to
     *  `EARNED_DURATION_DEFAULT_MS`. Ignored when `reducedMotion === true`. */
    earnedDurationMs?: number
    /** Whether the host honours `prefers-reduced-motion: reduce`. Defaults
     *  to `false`. */
    reducedMotion?: boolean
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * Clamp an earned-phase duration into the spec-defined window
 * `[EARNED_DURATION_MIN_MS, EARNED_DURATION_MAX_MS]`. When `reducedMotion`
 * is on the duration is forced to `0` (Requirement 7.5).
 *
 * @internal exported for tests.
 */
export function clampEarnedDurationMs(durationMs: number, reducedMotion: boolean): number {
    if (reducedMotion) return 0
    if (!Number.isFinite(durationMs)) return EARNED_DURATION_DEFAULT_MS
    if (durationMs < EARNED_DURATION_MIN_MS) return EARNED_DURATION_MIN_MS
    if (durationMs > EARNED_DURATION_MAX_MS) return EARNED_DURATION_MAX_MS
    return Math.round(durationMs)
}

/**
 * Build the initial FSM state.
 *
 * Validates: Requirements 7.1, 7.2, 7.5, 7.7
 */
export function initResultRewardLoopState(
    init: ResultRewardLoopInit = {},
): ResultRewardLoopState {
    const reducedMotion = init.reducedMotion ?? false
    const earnedDurationMs = clampEarnedDurationMs(
        init.earnedDurationMs ?? EARNED_DURATION_DEFAULT_MS,
        reducedMotion,
    )
    const retryCount = Math.max(0, Math.min(MAX_RETRY_ATTEMPTS, init.initialRetryCount ?? 0))
    return {
        phase: init.initialPhase ?? 'saving',
        retryCount,
        reducedMotion,
        earnedDurationMs,
    }
}

// -----------------------------------------------------------------------------
// Reducer — pure transitions
// -----------------------------------------------------------------------------

/**
 * Apply a single event to the FSM state. Pure: same inputs ⇒ same outputs,
 * no I/O, no timers. The caller is responsible for scheduling
 * `EARNED_TIMER_ELAPSED` after `state.earnedDurationMs` ms and invoking the
 * actual save / retry side effects.
 *
 * Rules summary (design §D):
 *
 * - `saving`  + `SAVE_SUCCEEDED`         → `earned`
 * - `saving`  + `SAVE_FAILED`            → `error`     (retryCount += 1)
 *                                          OR `blocked` if retryCount + 1 === MAX
 * - `earned`  + `EARNED_TIMER_ELAPSED`   → `receipt`
 * - `error`   + `RETRY_REQUESTED`        → `saving`    (retryCount unchanged
 *                                          until a new SAVE_FAILED arrives)
 * - any phase + `REDUCED_MOTION_CHANGED` → updates `reducedMotion`
 *                                          and re-clamps `earnedDurationMs`
 *
 * Disallowed transitions are no-ops — the previous state is returned
 * unchanged so callers do not have to defensively guard against double
 * fires of timers or button clicks.
 *
 * Validates: Requirements 7.1, 7.2, 7.3, 7.6, 7.7
 */
export function resultRewardLoopReducer(
    state: ResultRewardLoopState,
    event: ResultRewardLoopEvent,
): ResultRewardLoopState {
    switch (event.type) {
        case 'SAVE_STARTED': {
            // Re-entering `saving` from any phase resets only the phase. Retry
            // count is preserved so the cap survives mount/unmount cycles.
            if (state.phase === 'saving') return state
            return { ...state, phase: 'saving' }
        }

        case 'SAVE_SUCCEEDED': {
            if (state.phase !== 'saving') return state
            return { ...state, phase: 'earned' }
        }

        case 'SAVE_FAILED': {
            if (state.phase !== 'saving') return state
            const nextRetryCount = state.retryCount + 1
            // Cap at MAX_RETRY_ATTEMPTS — the 3rd failed attempt transitions
            // to `blocked`. (Requirement 7.7)
            if (nextRetryCount >= MAX_RETRY_ATTEMPTS) {
                return {
                    ...state,
                    phase: 'blocked',
                    retryCount: MAX_RETRY_ATTEMPTS,
                }
            }
            return { ...state, phase: 'error', retryCount: nextRetryCount }
        }

        case 'EARNED_TIMER_ELAPSED': {
            if (state.phase !== 'earned') return state
            return { ...state, phase: 'receipt' }
        }

        case 'RETRY_REQUESTED': {
            // Only retry from `error`. `blocked` is terminal.
            if (state.phase !== 'error') return state
            return { ...state, phase: 'saving' }
        }

        case 'PRIMARY_ACTION_TRIGGERED': {
            // Receipt → component owner unmounts. The FSM does not track a
            // post-receipt phase; we leave the state as `receipt` so repeat
            // taps are idempotent.
            return state
        }

        case 'REDUCED_MOTION_CHANGED': {
            const reducedMotion = event.reducedMotion
            const earnedDurationMs = clampEarnedDurationMs(
                reducedMotion ? 0 : state.earnedDurationMs || EARNED_DURATION_DEFAULT_MS,
                reducedMotion,
            )
            return { ...state, reducedMotion, earnedDurationMs }
        }
    }
}

// -----------------------------------------------------------------------------
// Derived selectors
// -----------------------------------------------------------------------------

/**
 * `data-reward-state` value to set on the loop root for the current phase.
 * Returns `null` for phases that must NOT carry the attribute (Requirement
 * 7.6 — error/blocked never expose reward amber). The receipt and earned
 * phases are the only allow-list values for the loop root.
 */
export function dataRewardStateForPhase(phase: ResultRewardLoopPhase): 'earned' | 'receipt' | null {
    if (phase === 'earned') return 'earned'
    if (phase === 'receipt') return 'receipt'
    return null
}

/**
 * `data-loop-phase` value mirrors the FSM phase 1:1 so consumers and tests
 * can assert the current phase without depending on `data-reward-state`
 * (which is gated by the reward-amber containment rule).
 */
export function dataLoopPhase(phase: ResultRewardLoopPhase): ResultRewardLoopPhase {
    return phase
}

/**
 * True iff the FSM is in a phase where the earned-phase reveal animation
 * may run. Reduced-motion mode collapses this to `false` because the timer
 * is `0`ms and the host snaps straight to receipt.
 */
export function shouldRenderEarnedAnimation(state: ResultRewardLoopState): boolean {
    return state.phase === 'earned' && !state.reducedMotion
}

/**
 * Remaining retry attempts before the FSM blocks. `0` means the next
 * `SAVE_FAILED` transitions to `blocked`.
 */
export function remainingRetries(state: ResultRewardLoopState): number {
    return Math.max(0, MAX_RETRY_ATTEMPTS - state.retryCount)
}
