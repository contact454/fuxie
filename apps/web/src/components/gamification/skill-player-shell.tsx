'use client'

/**
 * SkillPlayerShell — composition wrapper used by Reading and Listening
 * (and reusable by Speaking / Writing) to satisfy task 11.1 of
 * `gamified-ui-asset-rollout`.
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: Design System Designer (world prop scrim, palette),
 *               Gamification Designer (progress + reward copy)
 *
 * Composition contract (Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.10, 6.11,
 * 11.5):
 *   - Renders `SkillMotivationLayer` sticky-top with `worldPropTags`
 *     forwarded so the Reading surface picks `library`-tag props and the
 *     Listening surface picks `studio` / `radio`-tag props
 *     (Requirements 6.4, 6.5).
 *   - Renders the player content (`children`) as a sibling marked
 *     `data-role="skill-content"` so the layer's bounding box never
 *     overlaps the content area (Requirement 6.2). The children stay
 *     mounted across error/retry transitions so progress is preserved
 *     (Requirement 6.10 — "giữ nguyên progress đã lưu").
 *   - Renders a bottom Primary_CTA via the design-system primitive so the
 *     surface has a single Primary_CTA per state (Property 8).
 *
 * Asset / audio failure handling (Requirements 6.10, 6.11, 11.5):
 *   - On mount the shell starts a `loadTimeoutMs` (default 10_000 ms)
 *     timer. The host signals readiness via the controlled `assetLoaded`
 *     prop (Reading flips it to `true` when the passage data resolves;
 *     Listening flips it to `true` on `<audio>` `loadedmetadata` and to
 *     `false` again on `<audio>` `error`).
 *   - If `assetLoaded !== true` when the timer fires the shell enters the
 *     `error` state and replaces the bottom CTA with `<PrimaryCta>Thử lại`.
 *     The children stay mounted so the player can keep its in-memory
 *     progress.
 *   - Tapping "Thử lại" increments `retryCount`, calls `onRetry` with the
 *     new attempt number, and restarts the 10-second timer. After three
 *     consecutive failures the CTA downgrades to `variant="secondary"`
 *     (no more `data-role="primary-cta"`) and the shell renders a
 *     localized fallback message (Requirement 6.11).
 *
 * The shell is intentionally renderless beyond the layer / content / CTA
 * frame; the consuming page composes it with whatever player it needs
 * (`ReadingPlayerDynamic`, `LessonPlayerDynamic`, …).
 *
 * Validates: Requirements 6.1, 6.2, 6.3, 6.10, 6.11, 11.5
 */

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import {
    SkillMotivationLayer,
    type SkillMotivationSurfaceId,
} from '@/components/gamification/skill-motivation-layer'
import { PrimaryCta } from '@/components/ui/primary-cta'
import { fx } from '@/components/ui/fuxie-ui'
import type { RewardAssetKey } from '@/components/gamification/reward-assets'
import type { WorldTag } from '@/lib/mascot/fuxie-world-tags'

// -----------------------------------------------------------------------------
// Public types
// -----------------------------------------------------------------------------

/**
 * Asset/audio load timeout floor. Requirement 6.10 mandates a 10-second
 * deadline before showing the error state. Exposed as a constant so unit
 * tests can pass a smaller value (e.g. 50 ms) without depending on the
 * literal `10_000` magic number.
 */
export const SKILL_PLAYER_LOAD_TIMEOUT_MS = 10_000

/**
 * Hard cap on consecutive failed retries before the CTA downgrades.
 * Requirement 6.11: "Sau 3 lần retry liên tiếp fail … CTA 'Thử lại'
 * SHALL chuyển sang trạng thái secondary".
 */
export const SKILL_PLAYER_MAX_RETRIES = 3

/**
 * Phase exposed on the root container via `data-skill-player-phase`. Tests
 * use this attribute to assert FSM transitions deterministically.
 *
 *   - `loading` — initial state, the 10-second timer is armed.
 *   - `ready`   — the host signaled `assetLoaded === true`.
 *   - `error`   — the timer fired before the asset was ready and the
 *                  retry budget is not yet exhausted.
 *   - `blocked` — three consecutive failed retries; CTA downgraded to
 *                  secondary, fallback message rendered.
 */
export type SkillPlayerPhase = 'loading' | 'ready' | 'error' | 'blocked'

export interface SkillPlayerShellLabels {
    /** Bright Sky Primary_CTA shown while `phase === 'ready'`. */
    primaryCtaLabel: string
    /** Optional `aria-label` for the Primary_CTA (defaults to `primaryCtaLabel`). */
    primaryCtaAriaLabel?: string
    /** Localized retry CTA label (defaults to "Thử lại" — Req 6.10). */
    retryCtaLabel?: string
    /**
     * Localized fallback prose rendered above the downgraded CTA once
     * three retries have failed. Requirement 6.11 — the message must
     * direct the learner to check connection or return to `/dashboard`.
     */
    fallbackMessage?: string
    /** Optional progress-zone subline rendered inside the motivation layer. */
    progressSubline?: ReactNode
}

export interface SkillPlayerShellProps {
    /** Surface identifier — must be a skill player ID. */
    surfaceId: SkillMotivationSurfaceId
    /** Tags forwarded to `SkillMotivationLayer` for the world-prop pick. */
    worldPropTags: WorldTag[]
    /** Reward preview key (defaults to the layer's own default `'fucoin'`). */
    rewardKey?: RewardAssetKey
    /** Reward preview label (defaults to the layer's own default `'+10 Fucoin'`). */
    rewardLabel?: string
    /** Number of items completed in the current player session. */
    done: number
    /** Total number of items. */
    total: number
    /**
     * Controlled asset-loaded flag. The host should set it to `true` when
     * the player's primary asset (passage text, audio metadata, …) is
     * available; back to `false` when an explicit error event fires.
     * `undefined` is treated as "still loading".
     */
    assetLoaded: boolean | undefined
    /**
     * Optional explicit asset-error signal. When `true`, the shell jumps
     * straight to the `error` phase without waiting for the 10s timer.
     * Listening uses this so an `<audio>` `error` event can short-circuit
     * the timer.
     */
    assetError?: boolean
    /**
     * Called when the learner taps "Thử lại". Receives the new
     * attempt number (`1`, `2`, `3`). The host should re-fetch /
     * re-mount the asset; the shell will restart its timer.
     */
    onRetry?: (attempt: number) => void
    /** Override the load timeout (tests pass a smaller value). */
    loadTimeoutMs?: number
    /**
     * Optional href for the bottom Primary_CTA. When provided the CTA is
     * rendered as a `<Link>` via `asChild`; otherwise as a `<button>`.
     */
    primaryCtaHref?: string
    /** Click handler for the bottom Primary_CTA when no href is provided. */
    onPrimaryCta?: () => void
    /** Localized labels/copy. */
    labels: SkillPlayerShellLabels
    /** Player content rendered in the `data-role="skill-content"` area. */
    children: ReactNode
    /** Optional className applied to the outer wrapper (page layout). */
    className?: string
    /**
     * Test escape hatch — set the initial phase. Avoids fake timers in the
     * common `ready` / `error` / `blocked` rendering snapshots.
     */
    initialPhase?: SkillPlayerPhase
    /**
     * Test escape hatch — seed the consecutive-failure counter so a
     * snapshot can render the `blocked` state without driving the FSM
     * through three real retries. Clamped to `[0, SKILL_PLAYER_MAX_RETRIES]`.
     */
    initialFailureCount?: number
}

// -----------------------------------------------------------------------------
// FSM
// -----------------------------------------------------------------------------

/**
 * Pure FSM step used by both the React component and unit tests. Splitting
 * the transition logic out lets the property/unit tests assert the FSM
 * without rendering React or relying on fake timers.
 */
export interface SkillPlayerFsmState {
    phase: SkillPlayerPhase
    failureCount: number
}

export type SkillPlayerFsmEvent =
    | { type: 'asset-loaded' }
    | { type: 'asset-error' }
    | { type: 'timeout' }
    | { type: 'retry' }

/**
 * Apply a single event to the FSM. The transitions follow design §I.4 +
 * Requirements 6.10 / 6.11:
 *
 *   loading --asset-loaded--> ready
 *   loading --asset-error--> error  (failure++)
 *   loading --timeout--> error      (failure++)
 *
 *   ready  --asset-error--> error   (failure++)
 *   ready  --timeout--> ready       (no-op; the load already succeeded)
 *
 *   error  --retry--> loading       (caller refetches; shell restarts timer)
 *   error  --asset-loaded--> ready  (caller fixed the asset asynchronously)
 *
 *   blocked --retry--> blocked      (CTA is secondary; clicks are inert)
 *   blocked --asset-loaded--> ready (recovery from a server-side fix)
 *
 * When `failureCount` reaches `SKILL_PLAYER_MAX_RETRIES` (3) the phase
 * resolves to `blocked` no matter what the previous phase was — this is
 * how the CTA downgrade is enforced.
 */
export function applySkillPlayerFsmEvent(
    state: SkillPlayerFsmState,
    event: SkillPlayerFsmEvent,
): SkillPlayerFsmState {
    const clampFailures = (n: number) =>
        Math.max(0, Math.min(SKILL_PLAYER_MAX_RETRIES, n))

    switch (event.type) {
        case 'asset-loaded': {
            // Recovery from any phase. Reset failure counter so the surface
            // can fail another full cycle later if the asset breaks again.
            return { phase: 'ready', failureCount: 0 }
        }
        case 'asset-error': {
            const nextFailures = clampFailures(state.failureCount + 1)
            const phase: SkillPlayerPhase =
                nextFailures >= SKILL_PLAYER_MAX_RETRIES ? 'blocked' : 'error'
            return { phase, failureCount: nextFailures }
        }
        case 'timeout': {
            if (state.phase === 'ready') {
                // Once the asset is ready a stale timer is a no-op.
                return state
            }
            const nextFailures = clampFailures(state.failureCount + 1)
            const phase: SkillPlayerPhase =
                nextFailures >= SKILL_PLAYER_MAX_RETRIES ? 'blocked' : 'error'
            return { phase, failureCount: nextFailures }
        }
        case 'retry': {
            if (state.phase === 'blocked') {
                // CTA is secondary; clicks are inert by design.
                return state
            }
            return { phase: 'loading', failureCount: state.failureCount }
        }
    }
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function clampInitialFailureCount(value: number | undefined): number {
    if (value === undefined) return 0
    if (!Number.isFinite(value)) return 0
    const floored = Math.floor(value)
    if (floored < 0) return 0
    if (floored > SKILL_PLAYER_MAX_RETRIES) return SKILL_PLAYER_MAX_RETRIES
    return floored
}

const DEFAULT_RETRY_LABEL = 'Thử lại'
const DEFAULT_FALLBACK_MESSAGE =
    'Có vẻ kết nối đang gặp sự cố. Hãy kiểm tra mạng hoặc quay lại Dashboard và thử lại sau giây lát.'

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

/**
 * Wrap a skill player in the gamified composition (motivation layer +
 * content + bottom CTA) plus the asset-failure FSM. See module docstring
 * for invariants.
 */
export function SkillPlayerShell({
    surfaceId,
    worldPropTags,
    rewardKey,
    rewardLabel,
    done,
    total,
    assetLoaded,
    assetError = false,
    onRetry,
    loadTimeoutMs = SKILL_PLAYER_LOAD_TIMEOUT_MS,
    primaryCtaHref,
    onPrimaryCta,
    labels,
    children,
    className,
    initialPhase,
    initialFailureCount,
}: SkillPlayerShellProps) {
    const [state, setState] = useState<SkillPlayerFsmState>(() => ({
        phase: initialPhase ?? (assetLoaded === true ? 'ready' : 'loading'),
        failureCount: clampInitialFailureCount(initialFailureCount),
    }))

    const dispatch = useCallback((event: SkillPlayerFsmEvent) => {
        setState(prev => applySkillPlayerFsmEvent(prev, event))
    }, [])

    // Bridge the controlled `assetLoaded` prop to the FSM so the host can
    // signal readiness purely declaratively.
    useEffect(() => {
        if (assetLoaded === true) {
            dispatch({ type: 'asset-loaded' })
        }
    }, [assetLoaded, dispatch])

    // Explicit error short-circuit — Listening uses this on `<audio>` error.
    useEffect(() => {
        if (assetError) {
            dispatch({ type: 'asset-error' })
        }
    }, [assetError, dispatch])

    // 10-second load deadline. Re-armed every time the FSM re-enters
    // `loading` (initial mount + each retry). The timer is a no-op once
    // `phase === 'ready'` because the FSM ignores stale `timeout` events.
    useEffect(() => {
        if (state.phase !== 'loading') return
        if (typeof window === 'undefined') return
        const handle = window.setTimeout(() => {
            dispatch({ type: 'timeout' })
        }, loadTimeoutMs)
        return () => window.clearTimeout(handle)
    }, [state.phase, loadTimeoutMs, dispatch])

    const handleRetry = useCallback(() => {
        if (state.phase === 'blocked') return
        // Failure counter is unchanged here; it ticks on the next
        // `timeout` / `asset-error` event so the third *failure* is what
        // downgrades the CTA, not the third *click*.
        const nextAttempt = state.failureCount + 1
        dispatch({ type: 'retry' })
        onRetry?.(nextAttempt)
    }, [state.phase, state.failureCount, dispatch, onRetry])

    const phase = state.phase
    const isErrorState = phase === 'error' || phase === 'blocked'
    const isBlocked = phase === 'blocked'

    const retryLabel = labels.retryCtaLabel ?? DEFAULT_RETRY_LABEL
    const fallbackMessage = labels.fallbackMessage ?? DEFAULT_FALLBACK_MESSAGE

    // Bottom action bar — exactly one Primary_CTA per state (Property 8).
    const bottomCta = useMemo(() => {
        if (!isErrorState) {
            // Default state: surface’s next-action CTA.
            if (primaryCtaHref) {
                return (
                    <PrimaryCta
                        asChild
                        variant="primary"
                        className="w-full sm:w-auto"
                    >
                        <Link
                            href={primaryCtaHref}
                            aria-label={
                                labels.primaryCtaAriaLabel ?? labels.primaryCtaLabel
                            }
                        >
                            {labels.primaryCtaLabel}
                        </Link>
                    </PrimaryCta>
                )
            }
            return (
                <PrimaryCta
                    variant="primary"
                    className="w-full sm:w-auto"
                    onClick={onPrimaryCta}
                    aria-label={
                        labels.primaryCtaAriaLabel ?? labels.primaryCtaLabel
                    }
                >
                    {labels.primaryCtaLabel}
                </PrimaryCta>
            )
        }

        // Error / blocked state: "Thử lại" — primary while attempts ≤ 2,
        // downgraded to secondary on the third failure (Req 6.11).
        const variant = isBlocked ? 'secondary' : 'primary'
        return (
            <PrimaryCta
                variant={variant}
                className="w-full sm:w-auto"
                onClick={handleRetry}
                disabled={isBlocked}
                aria-disabled={isBlocked || undefined}
            >
                {retryLabel}
            </PrimaryCta>
        )
    }, [
        isErrorState,
        isBlocked,
        primaryCtaHref,
        onPrimaryCta,
        labels.primaryCtaLabel,
        labels.primaryCtaAriaLabel,
        retryLabel,
        handleRetry,
    ])

    return (
        <div
            data-role="skill-player-shell"
            data-surface-id={surfaceId}
            data-skill-player-phase={phase}
            data-failure-count={state.failureCount}
            className={fx('flex w-full flex-col gap-4', className)}
        >
            <SkillMotivationLayer
                surfaceId={surfaceId}
                done={done}
                total={total}
                rewardKey={rewardKey}
                rewardLabel={rewardLabel}
                worldPropTags={worldPropTags}
            >
                {labels.progressSubline}
            </SkillMotivationLayer>

            {/*
              Children stay mounted across error/retry transitions so the
              player keeps its progress (Requirement 6.10). The shell only
              annotates the wrapper; it does not unmount the player.
            */}
            <section
                data-role="skill-content"
                aria-label={`${surfaceId}-content`}
                className="relative"
            >
                {children}
            </section>

            {/*
              Fallback message rendered above the bottom CTA once retries
              are exhausted (Req 6.11). Pure prose — no reward amber, no
              celebration tokens.
            */}
            {isBlocked ? (
                <p
                    data-role="skill-player-fallback-message"
                    role="status"
                    className="rounded-2xl bg-[var(--fuxie-blue-50)] px-4 py-3 text-sm font-semibold text-[var(--fuxie-blue-700)]"
                >
                    {fallbackMessage}
                </p>
            ) : null}

            <div
                className="mt-2 flex justify-end"
                data-cta-context={isErrorState ? 'error' : 'default'}
            >
                {bottomCta}
            </div>
        </div>
    )
}
