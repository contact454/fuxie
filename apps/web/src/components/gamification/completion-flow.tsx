'use client'

/**
 * CompletionFlow — shared completion handler that triggers the
 * `ResultRewardLoop` after a successful save.
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: Gamification Designer (CTA copy: "Tiếp tục" / "Học bài kế tiếp")
 *
 * Spec source-of-truth:
 *   - Task 12.1 (gamified-ui-asset-rollout)
 *   - design.md §D (Result_Reward_Loop FSM)
 *   - requirements.md Req 7.1, 7.2, 7.3, 7.4, 7.6, 7.7, 10.5
 *
 * Rationale:
 *   The vocabulary microgame, listening session, and exam submit paths
 *   all share the same completion contract — once a save succeeds, show
 *   the earned reveal within the 1.2–2.0s window, auto-advance to the
 *   receipt, and on save failure keep the lesson data unconsumed while
 *   surfacing a "Thử lại" CTA up to 3 retries.
 *
 *   Rather than each surface re-implementing the FSM glue around
 *   `ResultRewardLoop`, this module exposes:
 *
 *     - `CompletionFlow` — a thin React wrapper that:
 *         · runs the FSM when the surface owns the save (`mode='save'`),
 *           or
 *         · short-circuits the saving phase when the surface already
 *           persisted the result before mounting (`mode='alreadySaved'`),
 *           which still gives the learner the canonical earned/receipt
 *           sequence under the FSM's amber containment rules.
 *     - `chooseCompletionPrimaryCtaLabel()` — pure helper that picks
 *       "Học bài kế tiếp" when a next step is queued and "Tiếp tục"
 *       otherwise (matches design §I.5 + Req 7.4).
 *     - `assertEarnedDurationMsInRange()` — invariant-friendly check
 *       used by tests to guard against the earned phase drifting outside
 *       the 1.2–2.0s spec window (Req 7.1, 7.2).
 *
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.6, 7.7, 10.5
 */

import type { ReactNode } from 'react'
import { useCallback, useMemo } from 'react'

import {
    EARNED_DURATION_DEFAULT_MS,
    EARNED_DURATION_MAX_MS,
    EARNED_DURATION_MIN_MS,
    type ResultRewardLoopPhase,
} from '@/components/gamification/result-reward-loop-fsm'
import {
    ResultRewardLoop,
    type ResultRewardLoopAction,
    type ResultRewardLoopMetric,
    type ResultRewardLoopStreakReceipt,
} from '@/components/gamification/result-reward-loop'
import type { RewardPreviewItem } from '@/components/gamification/quest-visuals'

// -----------------------------------------------------------------------------
// Public types
// -----------------------------------------------------------------------------

/**
 * Skill categories shared with `ResultRewardLoop`. Re-exported so callers
 * can keep their imports anchored at this module without re-fetching the
 * underlying primitives.
 */
export type CompletionFlowSkill =
    | 'vocabulary'
    | 'listening'
    | 'reading'
    | 'writing'
    | 'speaking'
    | 'exam'

/**
 * Whether the surface owns the save itself (FSM drives `onSave` on mount)
 * or the save already completed upstream and we just want the canonical
 * earned → receipt animation.
 *
 * - `save`         The surface delegates the save to the FSM. Errors keep
 *                  the lesson data unconsumed and surface "Thử lại" up to
 *                  `MAX_RETRY_ATTEMPTS` (3).
 * - `alreadySaved` The surface has already persisted the result before
 *                  mounting `<CompletionFlow>`. The FSM still runs but
 *                  resolves immediately, producing the earned phase
 *                  within the [1.2, 2.0]s window before the receipt.
 */
export type CompletionFlowMode = 'save' | 'alreadySaved'

/**
 * Stable shape passed to the FSM's `onSave`. The shared handler accepts
 * a request descriptor — surfaces hand us the URL + body and we run the
 * fetch. This keeps retry semantics identical across skill players.
 */
export interface CompletionFlowSaveRequest {
    /** Canonical save URL (e.g. `/api/v1/listening/{lessonId}/submit`). */
    url: string
    /** HTTP method. Defaults to `'POST'`. */
    method?: 'POST' | 'PUT' | 'PATCH'
    /** JSON body. Stringified before send. */
    body?: unknown
    /** Optional headers (Content-Type defaults to JSON when body is set). */
    headers?: Record<string, string>
    /**
     * Optional response validator. When provided, a `false` return value
     * (or a thrown error) is treated as a save failure. This lets the
     * lesson data stay unconsumed when an HTTP 200 still indicates a
     * domain-level error (`{ success: false, error: ... }`).
     */
    validate?: (response: Response, parsed: unknown) => boolean | Promise<boolean>
}

/**
 * Props shared between the two completion-flow modes.
 */
interface CompletionFlowBaseProps {
    /** Skill bucket — drives mascot pose + accent in the underlying loop. */
    skill: CompletionFlowSkill
    /** Localized title shown in the receipt phase. */
    title: string
    /** Localized supporting copy. */
    message: string
    /** "12/15" style score label. */
    scoreLabel: string
    /** Detail line under the score (e.g. "Câu đúng"). */
    scoreDetail: string
    /** Accuracy in [0, 100], rounded to int. */
    accuracy: number
    /** XP earned for this completion. Use `0` when ungraded. */
    xpEarned: number
    /** Whether the result has been graded server-side. Defaults to `true`. */
    graded?: boolean
    /** Optional metric chips (time, accuracy breakdowns, etc.). */
    attemptMeta?: ResultRewardLoopMetric[]
    /** Reward preview chips shown on the receipt. */
    rewardPreview: RewardPreviewItem[]
    /** Streak receipt — when present, surfaces the "freeze used" badge. */
    streakReceipt?: ResultRewardLoopStreakReceipt
    /**
     * Whether this completion has a queued next step. Drives the primary
     * CTA label between "Học bài kế tiếp" (true) and "Tiếp tục" (false)
     * (Req 7.4 / design §I.5). Surfaces can override the resolved label
     * via `primaryAction.label`.
     */
    hasNextStep?: boolean
    /**
     * Primary CTA descriptor. The shared handler resolves the label
     * automatically when this is omitted. When present, the caller wins —
     * surfaces that need a custom analytics handler can pass their own
     * `onClick` while the loop still controls the layout.
     */
    primaryAction?: ResultRewardLoopAction
    /** Secondary action — typically "Luyện lại" or skill-specific replay. */
    secondaryAction: ResultRewardLoopAction
    /** Optional dashboard escape hatch. */
    dashboardAction?: ResultRewardLoopAction
    /** Coach panel copy (next-step coaching). */
    coachTitle?: string
    coachMessage?: string
    /** Honour `prefers-reduced-motion: reduce` (Req 7.5). */
    reducedMotion?: boolean
    /**
     * Earned-phase duration override. Clamped to
     * `[EARNED_DURATION_MIN_MS, EARNED_DURATION_MAX_MS]` (Req 7.1, 7.2).
     */
    earnedDurationMs?: number
    /** Forwarded to the loop wrapper for layout overrides. */
    className?: string
    /** Notified after every FSM phase transition. */
    onPhaseChange?: (phase: ResultRewardLoopPhase) => void
    /** Override for the retry CTA label (defaults to "Thử lại"). */
    retryLabel?: string
    /**
     * Localized copy hooks for the per-mode rendering. Optional — if
     * omitted, the underlying `ResultRewardLoop` falls back to its
     * default Vietnamese copy.
     */
    children?: ReactNode
}

/**
 * Mode-discriminated props.
 */
export type CompletionFlowProps =
    | (CompletionFlowBaseProps & {
        mode: 'save'
        /** Save request descriptor — the FSM owns the network call. */
        saveRequest: CompletionFlowSaveRequest
        /**
         * Notified once the save resolves successfully. Surfaces can use
         * this to update local state (e.g. switch to the "results" phase)
         * without racing the FSM.
         */
        onSaveSucceeded?: (parsed: unknown) => void
        /** Notified after the loop's MAX_RETRY_ATTEMPTS chain blocks. */
        onSaveBlocked?: () => void
    })
    | (CompletionFlowBaseProps & {
        mode: 'alreadySaved'
        /**
         * Optional async confirmation hook for the "already-saved" mode.
         * Resolves immediately by default. Surfaces can use this to hold
         * the earned phase open until a follow-up sync (e.g. analytics
         * flush) completes.
         */
        confirmSave?: () => Promise<void>
    })

// -----------------------------------------------------------------------------
// Pure helpers (testable in node env)
// -----------------------------------------------------------------------------

/**
 * Choose the primary CTA label per design §I.5 + Req 7.4.
 *
 * - When the completion has a queued next step (`hasNextStep === true`),
 *   the CTA reads "Học bài kế tiếp".
 * - Otherwise, the CTA reads "Tiếp tục".
 *
 * Pure — same input always returns the same output. Surfaces can safely
 * memoise the result.
 *
 * Validates: Requirements 7.4
 */
export function chooseCompletionPrimaryCtaLabel(input: { hasNextStep: boolean }): string {
    return input.hasNextStep ? 'Học bài kế tiếp' : 'Tiếp tục'
}

/**
 * Assert that `earnedDurationMs` falls inside the [1.2s, 2.0s] window
 * mandated by Req 7.1 + 7.2. Returns the clamped value so callers can
 * use the helper to guard a configurable knob.
 *
 * @throws RangeError when the input is outside the window AND the caller
 *         opts into strict mode via `{ strict: true }`. Without strict
 *         mode the value is silently clamped (matching the FSM's behaviour).
 *
 * Validates: Requirements 7.1, 7.2
 */
export function assertEarnedDurationMsInRange(
    durationMs: number,
    options: { strict?: boolean } = {},
): number {
    if (!Number.isFinite(durationMs)) {
        if (options.strict) {
            throw new RangeError(
                `earnedDurationMs must be finite; received ${String(durationMs)}`,
            )
        }
        return EARNED_DURATION_DEFAULT_MS
    }
    if (durationMs < EARNED_DURATION_MIN_MS) {
        if (options.strict) {
            throw new RangeError(
                `earnedDurationMs (${durationMs}) below ${EARNED_DURATION_MIN_MS}ms (Req 7.1)`,
            )
        }
        return EARNED_DURATION_MIN_MS
    }
    if (durationMs > EARNED_DURATION_MAX_MS) {
        if (options.strict) {
            throw new RangeError(
                `earnedDurationMs (${durationMs}) above ${EARNED_DURATION_MAX_MS}ms (Req 7.2)`,
            )
        }
        return EARNED_DURATION_MAX_MS
    }
    return Math.round(durationMs)
}

/**
 * Build a thunk that performs the save request described by
 * `CompletionFlowSaveRequest`. Surfaced for tests so they can verify the
 * fetch contract without mounting React.
 *
 * The thunk:
 *   1. Issues the request with JSON encoding when a body is supplied.
 *   2. Parses the response as JSON (best-effort).
 *   3. Optionally calls `validate(response, parsed)`.
 *   4. Throws on non-2xx status OR when `validate` returns `false`.
 *
 * Errors propagate to the FSM, which transitions the loop to `error`
 * (or `blocked` after MAX_RETRY_ATTEMPTS).
 *
 * Validates: Requirements 7.6
 */
export function buildSaveThunk(
    request: CompletionFlowSaveRequest,
    onSuccess?: (parsed: unknown) => void,
): () => Promise<void> {
    const method = request.method ?? 'POST'
    const headers: Record<string, string> = {
        ...(request.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(request.headers ?? {}),
    }
    return async () => {
        const init: RequestInit = {
            method,
            headers,
            ...(request.body !== undefined
                ? { body: JSON.stringify(request.body) }
                : {}),
        }
        const response = await fetch(request.url, init)
        // Best-effort JSON parse so non-JSON 5xx responses still throw via
        // the !response.ok guard below without confusing the caller.
        let parsed: unknown = undefined
        try {
            parsed = await response.clone().json()
        } catch {
            parsed = undefined
        }

        if (!response.ok) {
            throw new Error(
                `CompletionFlow save failed: ${response.status} ${response.statusText}`,
            )
        }

        if (request.validate) {
            const ok = await request.validate(response, parsed)
            if (!ok) {
                throw new Error('CompletionFlow save rejected by validator')
            }
        }

        onSuccess?.(parsed)
    }
}

// -----------------------------------------------------------------------------
// React component
// -----------------------------------------------------------------------------

/**
 * Shared completion handler. See module docs for usage.
 *
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.6, 7.7, 10.5
 */
export function CompletionFlow(props: CompletionFlowProps): ReactNode {
    const {
        skill,
        title,
        message,
        scoreLabel,
        scoreDetail,
        accuracy,
        xpEarned,
        graded = true,
        attemptMeta,
        rewardPreview,
        streakReceipt,
        hasNextStep = false,
        primaryAction,
        secondaryAction,
        dashboardAction,
        coachTitle,
        coachMessage,
        reducedMotion = false,
        earnedDurationMs,
        className,
        onPhaseChange,
        retryLabel,
    } = props

    // Resolve the primary CTA label — pure helper keeps the rule
    // testable in isolation (Req 7.4).
    const resolvedPrimaryAction = useMemo<ResultRewardLoopAction>(() => {
        const base = primaryAction ?? { label: chooseCompletionPrimaryCtaLabel({ hasNextStep }) }
        if (base.label) return base
        return { ...base, label: chooseCompletionPrimaryCtaLabel({ hasNextStep }) }
    }, [primaryAction, hasNextStep])

    // Clamp the earned duration so we never violate the 1.2–2.0s window
    // even when callers pass a misconfigured value.
    const clampedEarnedDurationMs = useMemo(
        () => assertEarnedDurationMsInRange(earnedDurationMs ?? EARNED_DURATION_DEFAULT_MS),
        [earnedDurationMs],
    )

    // Build the FSM's onSave callback. In `alreadySaved` mode we resolve
    // immediately (or invoke the optional `confirmSave` hook). In `save`
    // mode we run the request thunk against the configured endpoint.
    const onSave = useCallback(async (): Promise<void> => {
        if (props.mode === 'alreadySaved') {
            if (props.confirmSave) {
                await props.confirmSave()
            }
            return
        }
        const thunk = buildSaveThunk(props.saveRequest, props.onSaveSucceeded)
        await thunk()
    }, [props])

    return (
        <ResultRewardLoop
            skill={skill}
            title={title}
            message={message}
            scoreLabel={scoreLabel}
            scoreDetail={scoreDetail}
            accuracy={accuracy}
            xpEarned={xpEarned}
            graded={graded}
            attemptMeta={attemptMeta}
            rewardPreview={rewardPreview}
            streakReceipt={streakReceipt}
            primaryAction={resolvedPrimaryAction}
            secondaryAction={secondaryAction}
            dashboardAction={dashboardAction}
            coachTitle={coachTitle}
            coachMessage={coachMessage}
            className={className}
            fsm={{
                onSave,
                earnedDurationMs: clampedEarnedDurationMs,
                reducedMotion,
                onPhaseChange,
                errorAction: retryLabel
                    ? { label: retryLabel, variant: 'primary' }
                    : undefined,
            }}
        />
    )
}

// Re-exports so call sites can pin a single import surface.
export {
    EARNED_DURATION_DEFAULT_MS,
    EARNED_DURATION_MAX_MS,
    EARNED_DURATION_MIN_MS,
} from '@/components/gamification/result-reward-loop-fsm'
export type { ResultRewardLoopPhase } from '@/components/gamification/result-reward-loop-fsm'
