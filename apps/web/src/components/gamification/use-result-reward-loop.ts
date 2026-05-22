'use client'

/**
 * React glue around `result-reward-loop-fsm`.
 *
 * Drives the FSM by:
 *   - calling `onSave` on mount (or when `saveTrigger` changes) to perform
 *     the actual server save,
 *   - scheduling the earned-phase timer when entering `'earned'`,
 *   - exposing a `retry` callback that bridges the user tapping "Thử lại"
 *     to a fresh `onSave` invocation (capped at `MAX_RETRY_ATTEMPTS`).
 *
 * The hook is intentionally minimal — visual/transition behavior lives in
 * `ResultRewardLoop` (design §D). All deterministic logic (transitions,
 * retry cap, reduced-motion duration) lives in the pure FSM module so it
 * can be unit-tested in the existing node test environment.
 *
 * Validates: Requirements 7.1, 7.2, 7.5, 7.6, 7.7
 */

import { useCallback, useEffect, useReducer, useRef } from 'react'

import {
    EARNED_DURATION_DEFAULT_MS,
    MAX_RETRY_ATTEMPTS,
    initResultRewardLoopState,
    resultRewardLoopReducer,
    type ResultRewardLoopPhase,
    type ResultRewardLoopState,
} from './result-reward-loop-fsm'

export interface UseResultRewardLoopOptions {
    /** Async save action. Resolved → `earned`, rejected → `error`. */
    onSave: () => Promise<void>
    /** Earned-phase duration. Clamped to [1.2s, 2.0s]. Defaults to 1.5s. */
    earnedDurationMs?: number
    /** When `true`, earned timer is `0` and the FSM jumps to receipt
     *  within ≤ 200ms (Requirement 7.5). */
    reducedMotion?: boolean
    /** Optional change-token. When this value changes, the hook restarts
     *  the FSM (e.g. after a parent reset). Defaults to a stable value so
     *  saves run only on initial mount. */
    saveTrigger?: unknown
}

export interface UseResultRewardLoopResult {
    state: ResultRewardLoopState
    phase: ResultRewardLoopPhase
    /** Number of retry attempts left before the FSM blocks. */
    remainingRetries: number
    /** Trigger `onSave` again from the `error` phase. No-op outside `error`. */
    retry: () => void
}

export function useResultRewardLoop(
    options: UseResultRewardLoopOptions,
): UseResultRewardLoopResult {
    const reducedMotion = options.reducedMotion ?? false
    const earnedDurationMs = options.earnedDurationMs ?? EARNED_DURATION_DEFAULT_MS

    const [state, dispatch] = useReducer(
        resultRewardLoopReducer,
        { earnedDurationMs, reducedMotion },
        initResultRewardLoopState,
    )

    // Latest onSave ref so the save effect does not re-fire when the
    // caller passes a fresh-but-equivalent closure.
    const onSaveRef = useRef(options.onSave)
    useEffect(() => {
        onSaveRef.current = options.onSave
    }, [options.onSave])

    // Reduced-motion tracking — keep the FSM's `reducedMotion` flag and
    // clamped earned duration in sync with the prop.
    useEffect(() => {
        dispatch({ type: 'REDUCED_MOTION_CHANGED', reducedMotion })
    }, [reducedMotion])

    // Drive the save side-effect whenever we enter `saving`.
    useEffect(() => {
        if (state.phase !== 'saving') return
        let cancelled = false
        Promise.resolve()
            .then(() => onSaveRef.current())
            .then(() => {
                if (cancelled) return
                dispatch({ type: 'SAVE_SUCCEEDED' })
            })
            .catch(() => {
                if (cancelled) return
                dispatch({ type: 'SAVE_FAILED' })
            })
        return () => {
            cancelled = true
        }
        // We intentionally do not depend on `saveTrigger` here — every entry
        // into `'saving'` re-runs the save. SAVE_STARTED dispatches handle
        // re-entries from `error` via `retry()` and from external resets.
    }, [state.phase])

    // External reset via `saveTrigger`. When the trigger value changes we
    // dispatch `SAVE_STARTED` so the save effect re-runs.
    const lastTriggerRef = useRef(options.saveTrigger)
    useEffect(() => {
        if (lastTriggerRef.current === options.saveTrigger) return
        lastTriggerRef.current = options.saveTrigger
        dispatch({ type: 'SAVE_STARTED' })
    }, [options.saveTrigger])

    // Earned-phase auto-advance timer. Reduced-motion ⇒ duration 0 ⇒
    // `setTimeout(..., 0)` resolves on the next macrotask (≤ 200ms budget).
    useEffect(() => {
        if (state.phase !== 'earned') return
        const handle = setTimeout(() => {
            dispatch({ type: 'EARNED_TIMER_ELAPSED' })
        }, state.earnedDurationMs)
        return () => clearTimeout(handle)
    }, [state.phase, state.earnedDurationMs])

    const retry = useCallback(() => {
        dispatch({ type: 'RETRY_REQUESTED' })
    }, [])

    return {
        state,
        phase: state.phase,
        remainingRetries: Math.max(0, MAX_RETRY_ATTEMPTS - state.retryCount),
        retry,
    }
}
