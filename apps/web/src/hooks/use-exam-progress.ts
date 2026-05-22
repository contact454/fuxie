'use client'

/**
 * useExamProgress — React glue for the exam timer + offline recovery FSM.
 *
 * Vai chinh: Frontend Engineer
 *
 * Spec source-of-truth:
 *   - Task 15.2 (gamified-ui-asset-rollout)
 *   - design.md §I.8 (Exam — formal credibility)
 *   - requirements.md Req 10.3, 10.6, 10.7
 *
 * What this hook does (and only this):
 *   1. Restores `{ remainingMs, answers }` from `localStorage` on mount
 *      when a fresh-enough snapshot exists (Req 10.7 — 60-min recovery).
 *   2. Drives a 1s `setInterval` that decrements the timer through the
 *      pure {@link exam-timer-controller} FSM. Time only flows while
 *      online — `offline` events flip the FSM to `'paused'` (Req 10.6).
 *   3. Persists progress every 5s through {@link saveExamProgress}
 *      (`localStorage` key `exam:{examId}:progress`, Req 10.6).
 *   4. Fires `onAutoSubmit` exactly once when the timer hits 00:00,
 *      scheduled via `setTimeout(0)` so submission happens within the
 *      2s SLA from displaying 00:00 (Req 10.3).
 *   5. Exposes `clear()` so the host can drop the snapshot after a
 *      confirmed server submit, and `flush()` so the host can persist
 *      ad-hoc (e.g. before navigating away).
 *
 * What this hook is NOT:
 *   - It does NOT submit by itself — submission semantics + retries are
 *     owned by `ExamSessionClient` (Req 7 retry rules live there).
 *   - It does NOT mutate `answers` — the host owns answer state and
 *     hands the latest snapshot in via `getAnswers`.
 *
 * The pure controller (`exam-timer-controller.ts`) and storage helpers
 * (`exam-progress-storage.ts`) are unit-tested in node-env vitest. This
 * hook is the thin glue that wires DOM events + intervals to those
 * helpers; behaviour-level tests live alongside `ExamSessionClient`.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

import {
    createExamTimerState,
    isPausedForOffline,
    markSubmitting,
    setOnline,
    shouldAutoSubmit,
    tick,
    type ExamTimerState,
} from '@/lib/exam/exam-timer-controller'
import {
    EXAM_PROGRESS_SAVE_INTERVAL_MS,
    clearExamProgress,
    getBrowserExamStorage,
    loadExamProgress,
    saveExamProgress,
    type LocalExamProgress,
} from '@/lib/exam/exam-progress-storage'

// -----------------------------------------------------------------------------
// Public types
// -----------------------------------------------------------------------------

export interface UseExamProgressOptions {
    /** Exam attempt identifier — used as the `localStorage` namespace. */
    examId: string
    /**
     * Total time budget for the attempt in ms. Used as the seed when no
     * recovery snapshot exists (Req 10.7 fallback).
     */
    totalMs: number
    /**
     * Whether the host has finished bootstrap and is ready for the timer
     * to run. Until `true` the hook stays idle (avoids ticking through
     * the loading state).
     */
    enabled: boolean
    /**
     * Callback the host fires when `remainingMs` reaches 0. Called at
     * most once; called within the 2s SLA from hitting 00:00 (Req 10.3).
     */
    onAutoSubmit: () => void
    /**
     * Lazy getter for the latest answers payload. Invoked by the 5s
     * save interval so the hook can persist without re-rendering when
     * answers change.
     */
    getAnswers: () => Record<string, unknown>
}

export interface UseExamProgressResult {
    /** Remaining time in milliseconds. Updates each tick. */
    remainingMs: number
    /** Mirror of `navigator.onLine` (subscribed to online/offline events). */
    isOnline: boolean
    /**
     * `true` while the timer is paused because the device is offline
     * (Req 10.6 — "Tiếp tục" disabled until reconnect).
     */
    isPaused: boolean
    /**
     * `true` when the hook bootstrapped from a saved snapshot rather
     * than the `totalMs` seed. Useful for the host to surface a
     * "recovered" toast (Req 10.7).
     */
    restored: boolean
    /**
     * The timestamp recorded for the start of this attempt — kept stable
     * across saves so the TTL anchor (Req 10.7) is preserved.
     */
    startedAt: string
    /** Persist the current snapshot immediately (host-driven flush). */
    flush: () => void
    /** Drop the persisted snapshot — call after a confirmed server submit. */
    clear: () => void
    /**
     * Mark the controller as `submitting` so further ticks become no-ops
     * while the submit network request is in flight.
     */
    markSubmitting: () => void
}

// -----------------------------------------------------------------------------
// Hook
// -----------------------------------------------------------------------------

const TICK_INTERVAL_MS = 1_000

/**
 * Validates: Requirements 10.3, 10.6, 10.7
 */
export function useExamProgress({
    examId,
    totalMs,
    enabled,
    onAutoSubmit,
    getAnswers,
}: UseExamProgressOptions): UseExamProgressResult {
    // ---- one-time bootstrap (recovery vs fresh seed) ------------------------
    const bootstrapRef = useRef<{
        timer: ExamTimerState
        startedAt: string
        restored: boolean
    } | null>(null)

    if (bootstrapRef.current === null) {
        const storage = getBrowserExamStorage()
        const nowMs = typeof Date !== 'undefined' ? Date.now() : 0
        const online =
            typeof navigator !== 'undefined' ? navigator.onLine : true
        let snapshot: LocalExamProgress | null = null
        if (storage !== null) {
            snapshot = loadExamProgress(storage, examId, nowMs)
        }
        if (snapshot !== null) {
            bootstrapRef.current = {
                timer: createExamTimerState(snapshot.remainingMs, online),
                startedAt: snapshot.startedAt,
                restored: true,
            }
        } else {
            bootstrapRef.current = {
                timer: createExamTimerState(totalMs, online),
                startedAt: new Date(nowMs).toISOString(),
                restored: false,
            }
        }
    }

    const [state, setState] = useState<ExamTimerState>(
        bootstrapRef.current.timer,
    )
    const startedAt = bootstrapRef.current.startedAt
    const restored = bootstrapRef.current.restored

    // Latest-state ref so interval callbacks can read without re-binding.
    const stateRef = useRef(state)
    useEffect(() => {
        stateRef.current = state
    }, [state])

    // ---- auto-submit one-shot guard -----------------------------------------
    const autoSubmitFiredRef = useRef(false)
    const onAutoSubmitRef = useRef(onAutoSubmit)
    useEffect(() => {
        onAutoSubmitRef.current = onAutoSubmit
    }, [onAutoSubmit])

    useEffect(() => {
        if (!shouldAutoSubmit(state)) return
        if (autoSubmitFiredRef.current) return
        autoSubmitFiredRef.current = true
        // Schedule on the macrotask queue so React commits the 00:00
        // frame before the host's submit handler runs. The 0ms delay
        // keeps us well inside the 2s SLA (Req 10.3).
        const handle = setTimeout(() => {
            onAutoSubmitRef.current()
        }, 0)
        return () => clearTimeout(handle)
    }, [state])

    // ---- 1s tick interval ---------------------------------------------------
    useEffect(() => {
        if (!enabled) return
        if (state.status !== 'running') return
        if (!state.online) return

        const id = setInterval(() => {
            setState(prev => tick(prev, TICK_INTERVAL_MS))
        }, TICK_INTERVAL_MS)
        return () => clearInterval(id)
    }, [enabled, state.status, state.online])

    // ---- online / offline subscription --------------------------------------
    useEffect(() => {
        if (typeof window === 'undefined') return
        const handleOnline = () => setState(prev => setOnline(prev, true))
        const handleOffline = () => setState(prev => setOnline(prev, false))
        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)
        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    // ---- 5s save cadence ----------------------------------------------------
    const getAnswersRef = useRef(getAnswers)
    useEffect(() => {
        getAnswersRef.current = getAnswers
    }, [getAnswers])

    const flush = useCallback(() => {
        const storage = getBrowserExamStorage()
        if (storage === null) return
        const current = stateRef.current
        if (
            current.status === 'expired' ||
            current.status === 'submitting'
        ) {
            // Snapshot the final remaining time before terminal phases
            // so a reload during the auto-submit window still recovers
            // a sane state (the host clears the snapshot after a
            // confirmed server submit).
        }
        saveExamProgress(
            storage,
            {
                examId,
                startedAt,
                remainingMs: current.remainingMs,
                answers: getAnswersRef.current(),
            },
            Date.now(),
        )
    }, [examId, startedAt])

    useEffect(() => {
        if (!enabled) return
        if (state.status !== 'running') return
        if (!state.online) return
        const id = setInterval(() => {
            flush()
        }, EXAM_PROGRESS_SAVE_INTERVAL_MS)
        return () => clearInterval(id)
    }, [enabled, state.status, state.online, flush])

    // ---- imperative helpers exposed to host ---------------------------------
    const clear = useCallback(() => {
        const storage = getBrowserExamStorage()
        if (storage === null) return
        clearExamProgress(storage, examId)
    }, [examId])

    const markSubmittingExternal = useCallback(() => {
        setState(prev => markSubmitting(prev))
    }, [])

    return {
        remainingMs: state.remainingMs,
        isOnline: state.online,
        isPaused: isPausedForOffline(state),
        restored,
        startedAt,
        flush,
        clear,
        markSubmitting: markSubmittingExternal,
    }
}
