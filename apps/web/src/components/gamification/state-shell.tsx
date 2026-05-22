'use client'

/**
 * StateShell — shared chrome for the non-default states `empty`, `locked`,
 * and `error` of every P0 Learner_Surface.
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: Design System Designer (copy length, secondary action),
 *               Gamification Designer (mascot=guard rules)
 *
 * Spec source-of-truth:
 *   - Task 16.1 (gamified-ui-asset-rollout)
 *   - design.md §I.9 (Locked / Empty / Error patterns)
 *   - requirements.md Req 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7
 *
 * Contract (machine-checkable):
 *   - Renders exactly one Primary_CTA per render via `<PrimaryCta variant="primary">`
 *     (Req 11.3, 11.4, 11.5; Property 8).
 *   - For `state === 'error'`, also renders a secondary "Về Dashboard"
 *     action via `<PrimaryCta variant="secondary">` which strips
 *     `data-role="primary-cta"` so the Single Primary_CTA invariant holds.
 *   - For `state === 'empty' | 'locked'`, the localized copy (`message`)
 *     must be ≤ 140 characters (Req 11.3, 11.4). In development the
 *     component throws; in production it truncates with an ellipsis to
 *     stay safe.
 *   - Retry rate-limit (Req 11.6): if the user taps Primary_CTA
 *     "Thử lại" >3 times within 60s, the CTA disables for 30s and a
 *     connection-hint subline appears.
 *   - Reward amber/celebration is forbidden in these states (Req 11.7,
 *     16.5): the shell never sets `data-reward-state` or
 *     `data-reward-context`, never uses `var(--fuxie-reward)`, and only
 *     renders neutral / Bright Sky tokens.
 *
 * Notes:
 *   - The retry rate-limit is exposed as a pure helper
 *     (`createRetryGuard`) and a React hook (`useRetryGuard`) so the rule
 *     can be unit-tested without a DOM (node env vitest).
 *   - The host surface is responsible for translating copy via next-intl;
 *     this component takes already-localized strings as props
 *     (Req 17.4 stays the host's responsibility).
 */

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

import { MascotRoleHost } from '@/components/gamification/mascot-role-host'
import { PrimaryCta } from '@/components/ui/primary-cta'
import { fx } from '@/components/ui/fuxie-ui'
import type { SurfaceId, SurfaceState } from '@/lib/mascot/mascot-role'

// -----------------------------------------------------------------------------
// Public types
// -----------------------------------------------------------------------------

/**
 * The closed set of states StateShell knows how to render. The `default`
 * and `success` states are intentionally excluded — those flows are owned
 * by each surface's main composition (Req 11.1).
 */
export type StateShellState = Extract<SurfaceState, 'empty' | 'locked' | 'error'>

export interface StateShellAction {
    /** Localized label, already passed through `t()` by the caller. */
    label: string
    /** Click handler. Mutually exclusive with `href`. */
    onClick?: () => void | Promise<void>
    /** Internal navigation target. Mutually exclusive with `onClick`. */
    href?: string
}

export interface StateShellProps {
    /** Surface identifier — forwarded to `MascotRoleHost` for pose pick. */
    surfaceId: SurfaceId
    /** One of `empty` | `locked` | `error` (Req 11.1, 11.2). */
    state: StateShellState
    /** Short title (already localized). Optional. */
    title?: string
    /**
     * Localized message body. For `empty` / `locked` MUST be ≤ 140 chars
     * (Req 11.3 / 11.4). Dev throws on violation; prod truncates.
     */
    message: string
    /** Single Primary_CTA for the state (Req 11.3 / 11.4 / 11.5). */
    primaryCta: StateShellAction
    /**
     * Secondary action used on `error` to expose "Về Dashboard"
     * (Req 11.5). Defaults to `{ label: 'Về Dashboard', href: '/dashboard' }`
     * when `state === 'error'` and no override is provided.
     */
    secondaryCta?: StateShellAction
    /**
     * Optional connection-hint copy shown when the rate-limit kicks in.
     * Defaults to a Vietnamese hint per Req 11.6. Callers should localize
     * this when surface locale ≠ vi.
     */
    connectionHintCopy?: string
    /** Optional className applied to the root section. */
    className?: string
}

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

/** Req 11.3 / 11.4 — empty/locked message hard cap. */
export const STATE_SHELL_COPY_MAX_LENGTH = 140

/** Req 11.6 — retry rate-limit window (ms). */
export const RETRY_WINDOW_MS = 60_000

/** Req 11.6 — rate-limit threshold (strictly >3 attempts in window ⇒ block). */
export const RETRY_MAX_ATTEMPTS_IN_WINDOW = 3

/** Req 11.6 — block duration once rate-limit triggers (ms). */
export const RETRY_BLOCK_DURATION_MS = 30_000

/** Default secondary action for `error` state (Req 11.5). */
const DEFAULT_DASHBOARD_ACTION: StateShellAction = {
    label: 'Về Dashboard',
    href: '/dashboard',
}

/** Default localized connection hint (Req 11.6). */
const DEFAULT_CONNECTION_HINT_VI =
    'Có vẻ kết nối đang chậm. Vui lòng kiểm tra mạng và thử lại sau giây lát.'

// -----------------------------------------------------------------------------
// Copy length validation (Req 11.3, 11.4)
// -----------------------------------------------------------------------------

function isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development'
}

/**
 * Enforces the ≤140-character rule on `empty` / `locked` localized copy.
 *
 * - Dev: throws so the caller is forced to shorten the copy.
 * - Prod: returns a safely truncated string (139 chars + `…`) so the UI
 *   does not break in the field.
 *
 * Validates: Requirements 11.3, 11.4
 */
export function enforceStateShellCopyLength(
    state: StateShellState,
    message: string,
): string {
    if (state === 'error') {
        return message
    }
    if (message.length <= STATE_SHELL_COPY_MAX_LENGTH) {
        return message
    }
    if (isDevelopment()) {
        throw new Error(
            `[StateShell] message for state "${state}" exceeds ${STATE_SHELL_COPY_MAX_LENGTH} characters (got ${message.length}). Shorten the copy or split it across surfaces.`,
        )
    }
    // Prod fallback: keep the surface usable with a hard truncate.
    return `${message.slice(0, STATE_SHELL_COPY_MAX_LENGTH - 1)}…`
}

// -----------------------------------------------------------------------------
// Retry guard (Req 11.6) — pure helper + React hook
// -----------------------------------------------------------------------------

export interface RetryGuardSnapshot {
    /** `true` when the Primary_CTA should be disabled. */
    blocked: boolean
    /**
     * Epoch ms at which the block lifts. `null` while not blocked.
     * Always `>` the current `now` value when `blocked === true`.
     */
    unblockAt: number | null
    /** Number of attempts currently inside the rolling 60s window. */
    attemptsInWindow: number
}

export interface RetryGuard {
    /**
     * Snapshot the current state at time `now`. Pure read — does not
     * advance the FSM; callers can use this to render disabled UI.
     */
    snapshot(now: number): RetryGuardSnapshot
    /**
     * Record a retry attempt at time `now`. Returns the snapshot AFTER
     * applying the attempt. If recording the attempt crosses the
     * `>RETRY_MAX_ATTEMPTS_IN_WINDOW` threshold, the guard transitions
     * into the blocked state for `RETRY_BLOCK_DURATION_MS`.
     *
     * If the guard is already blocked at `now`, the attempt is rejected
     * (snapshot returned with `blocked: true` and the existing
     * `unblockAt`). Callers SHOULD gate the click handler on
     * `snapshot(now).blocked === false`.
     */
    recordAttempt(now: number): RetryGuardSnapshot
    /** Reset the guard (used when the surface successfully recovers). */
    reset(): void
}

/**
 * Pure factory for the retry rate-limit FSM.
 *
 * Logic (Req 11.6):
 *   - Maintain a rolling list of attempt timestamps.
 *   - On each `recordAttempt(now)`, drop timestamps older than
 *     `now - RETRY_WINDOW_MS` (60s).
 *   - If the resulting list (after appending `now`) has size
 *     `> RETRY_MAX_ATTEMPTS_IN_WINDOW` (i.e. ≥ 4 attempts in 60s), enter
 *     blocked state until `now + RETRY_BLOCK_DURATION_MS` (30s).
 *   - While blocked, further `recordAttempt` calls are no-ops; once
 *     `now >= unblockAt`, blocking lifts and the attempt list is cleared
 *     so the learner gets a fresh window.
 *
 * Validates: Requirement 11.6
 */
export function createRetryGuard(): RetryGuard {
    const attempts: number[] = []
    let unblockAt: number | null = null

    const dropExpired = (now: number) => {
        const cutoff = now - RETRY_WINDOW_MS
        while (attempts.length > 0 && attempts[0]! < cutoff) {
            attempts.shift()
        }
    }

    const computeBlocked = (now: number): boolean => {
        if (unblockAt === null) {
            return false
        }
        if (now >= unblockAt) {
            unblockAt = null
            attempts.length = 0
            return false
        }
        return true
    }

    const snapshot = (now: number): RetryGuardSnapshot => {
        const blocked = computeBlocked(now)
        if (!blocked) {
            dropExpired(now)
        }
        return {
            blocked,
            unblockAt: blocked ? unblockAt : null,
            attemptsInWindow: attempts.length,
        }
    }

    const recordAttempt = (now: number): RetryGuardSnapshot => {
        // If we're still blocked, ignore the attempt.
        if (computeBlocked(now)) {
            return {
                blocked: true,
                unblockAt,
                attemptsInWindow: attempts.length,
            }
        }
        dropExpired(now)
        attempts.push(now)
        if (attempts.length > RETRY_MAX_ATTEMPTS_IN_WINDOW) {
            unblockAt = now + RETRY_BLOCK_DURATION_MS
            return {
                blocked: true,
                unblockAt,
                attemptsInWindow: attempts.length,
            }
        }
        return {
            blocked: false,
            unblockAt: null,
            attemptsInWindow: attempts.length,
        }
    }

    const reset = () => {
        attempts.length = 0
        unblockAt = null
    }

    return { snapshot, recordAttempt, reset }
}

/**
 * React hook wrapping `createRetryGuard` with stateful re-renders.
 *
 * Returns the current snapshot and an `attempt(callback)` helper that
 * gates the user's retry action through the rate-limit FSM.
 *
 * Validates: Requirement 11.6
 */
export function useRetryGuard(): {
    snapshot: RetryGuardSnapshot
    attempt: (callback?: () => void | Promise<void>) => void
} {
    const guardRef = useRef<RetryGuard | null>(null)
    if (guardRef.current === null) {
        guardRef.current = createRetryGuard()
    }
    const guard = guardRef.current

    const [snapshot, setSnapshot] = useState<RetryGuardSnapshot>(() =>
        guard.snapshot(typeof Date !== 'undefined' ? Date.now() : 0),
    )

    // Auto-clear the blocked banner once the unblock time passes.
    useEffect(() => {
        if (snapshot.unblockAt === null) {
            return
        }
        const delay = Math.max(0, snapshot.unblockAt - Date.now())
        const timer = setTimeout(() => {
            setSnapshot(guard.snapshot(Date.now()))
        }, delay + 16)
        return () => clearTimeout(timer)
    }, [snapshot.unblockAt, guard])

    const attempt = useCallback(
        (callback?: () => void | Promise<void>) => {
            const next = guard.recordAttempt(Date.now())
            setSnapshot(next)
            if (!next.blocked && callback) {
                void callback()
            }
        },
        [guard],
    )

    return { snapshot, attempt }
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function resolveSecondaryAction(
    state: StateShellState,
    override: StateShellAction | undefined,
): StateShellAction | null {
    if (override) {
        return override
    }
    if (state === 'error') {
        return DEFAULT_DASHBOARD_ACTION
    }
    return null
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

/**
 * Shared chrome for `empty` | `locked` | `error` states.
 *
 * Renders:
 *   - `MascotRoleHost` with role resolved to `guard` (Req 11.3 / 11.4 /
 *     11.5 + 12.6 via the per-surface config).
 *   - Optional title.
 *   - Localized message (≤140 chars enforced for `empty` / `locked`).
 *   - Single Primary_CTA (Req 11.3 / 11.4 / 11.5; Property 8).
 *   - Secondary "Về Dashboard" action only when `state === 'error'` or
 *     when explicitly provided (Req 11.5).
 *   - Connection hint subline once the rate-limit triggers (Req 11.6).
 *
 * NEVER renders reward amber, `data-reward-state`, `data-reward-context`,
 * or any class in the closed motion set `{animate-reward}` (Req 11.7,
 * 16.5).
 *
 * Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7
 */
export function StateShell({
    surfaceId,
    state,
    title,
    message,
    primaryCta,
    secondaryCta,
    connectionHintCopy,
    className,
}: StateShellProps) {
    const safeMessage = enforceStateShellCopyLength(state, message)
    const secondary = resolveSecondaryAction(state, secondaryCta)
    const { snapshot, attempt } = useRetryGuard()

    const isErrorState = state === 'error'
    // Rate-limit gating only applies to the `error` retry CTA (Req 11.6).
    const primaryDisabled = isErrorState && snapshot.blocked

    const handlePrimaryClick = () => {
        if (!isErrorState) {
            primaryCta.onClick?.()
            return
        }
        attempt(primaryCta.onClick)
    }

    const hint = connectionHintCopy ?? DEFAULT_CONNECTION_HINT_VI

    return (
        <section
            data-role="state-shell"
            data-surface-id={surfaceId}
            data-surface-state={state}
            className={fx(
                // Bright Sky neutral surface — no reward amber tokens.
                'flex w-full flex-col items-center gap-4 rounded-2xl',
                'bg-[var(--fuxie-blue-50)] px-6 py-8 text-center',
                'text-[color:var(--color-text-brand,#173B56)]',
                className,
            )}
        >
            <MascotRoleHost
                surfaceId={surfaceId}
                state={state}
                size={96}
                priority={false}
            />

            {title ? (
                <h2 className="text-lg font-extrabold text-[var(--fuxie-blue-900)]">
                    {title}
                </h2>
            ) : null}

            <p
                data-role="state-shell-message"
                className="max-w-prose text-sm leading-relaxed text-[var(--fuxie-blue-700)]"
            >
                {safeMessage}
            </p>

            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
                {primaryCta.href && !primaryDisabled ? (
                    <PrimaryCta asChild variant="primary">
                        <Link href={primaryCta.href}>{primaryCta.label}</Link>
                    </PrimaryCta>
                ) : (
                    <PrimaryCta
                        variant="primary"
                        onClick={handlePrimaryClick}
                        disabled={primaryDisabled}
                        aria-disabled={primaryDisabled || undefined}
                    >
                        {primaryCta.label}
                    </PrimaryCta>
                )}

                {secondary ? (
                    secondary.href ? (
                        <PrimaryCta asChild variant="secondary">
                            <Link href={secondary.href}>{secondary.label}</Link>
                        </PrimaryCta>
                    ) : (
                        <PrimaryCta
                            variant="secondary"
                            onClick={() => secondary.onClick?.()}
                        >
                            {secondary.label}
                        </PrimaryCta>
                    )
                ) : null}
            </div>

            {isErrorState && snapshot.blocked ? (
                <p
                    data-role="state-shell-connection-hint"
                    role="status"
                    className="max-w-prose text-xs font-semibold text-[var(--fuxie-blue-600)]"
                >
                    {hint}
                </p>
            ) : null}
        </section>
    )
}
