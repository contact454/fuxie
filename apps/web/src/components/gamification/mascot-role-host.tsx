'use client'

import type { ReactNode } from 'react'

import {
    FuxieRoleMascot,
    type FuxieMascotMotion,
} from '@/components/gamification/quest-visuals'
import {
    getFuxieMascotSrc,
    type FuxieMascotState,
} from '@/lib/mascot/fuxie-assets'
import {
    SURFACE_MASCOT_CONFIG,
    type MascotRole,
    type SurfaceId,
    type SurfaceState,
} from '@/lib/mascot/mascot-role'

/**
 * Surface-aware mascot host. Resolves Mascot_Role from
 * `SURFACE_MASCOT_CONFIG[surfaceId].states[state]`, validates the role-rule
 * invariants from Requirements 12.5–12.9, and renders a `FuxieRoleMascot`
 * with a stable `data-mascot-role` attribute (or nothing for role `silent`).
 *
 * Validates: Requirements 12.4, 12.5, 12.6, 12.7, 12.8, 12.9
 */

// -----------------------------------------------------------------------------
// Public types
// -----------------------------------------------------------------------------

export interface MascotRoleHostProps {
    /** Surface identifier — must be a key of `SURFACE_MASCOT_CONFIG`. */
    surfaceId: SurfaceId
    /**
     * Current surface state. Defaults to `'default'`. Missing entries in the
     * config table fall back to role `silent` (Requirement 12.3).
     */
    state?: SurfaceState
    /**
     * Optional explicit role override. When provided, bypasses the config
     * lookup but is still validated against the cheer/guard/silent
     * invariants (Requirements 12.5–12.7).
     */
    role?: MascotRole
    /**
     * `true` iff the surface just earned a reward (Reward_State === 'earned').
     * Required to legitimize a `cheer` role outside of an empty-reached-goal
     * context (Requirement 12.5).
     */
    rewardEarned?: boolean
    /**
     * `true` iff the surface is in an `empty` state AND the learner has
     * reached the goal (e.g. "you’re all caught up"). Together with
     * `state === 'empty'` this legitimizes `cheer` (Requirement 12.5).
     */
    emptyReachedGoal?: boolean
    /**
     * `true` iff the exam surface is in `in-progress`. Forces role `silent`
     * (Requirement 12.7).
     */
    examInProgress?: boolean
    /** Pixel size forwarded to `FuxieRoleMascot`. */
    size?: number
    /** Motion class forwarded to `FuxieRoleMascot`. */
    motion?: FuxieMascotMotion
    /** Optional accessible alt text override. */
    alt?: string
    /** Whether Next/Image should be marked priority (above-the-fold). */
    priority?: boolean
    /** Wrapper className. */
    className?: string
    /** Mascot image className passed through to `FuxieRoleMascot`. */
    imageClassName?: string
    /**
     * Optional overlay content (greeting bubble, badge chip, etc.). Rendered
     * inside the mascot wrapper as siblings of the mascot. Ignored when role
     * resolves to `silent` (component renders nothing).
     */
    children?: ReactNode
}

// -----------------------------------------------------------------------------
// Pose resolution
// -----------------------------------------------------------------------------

/**
 * Per-surface companion pose key. Companion is the only role with surface
 * variation — others use a single canonical pose (Requirement 12.4).
 */
const COMPANION_POSE_BY_SURFACE: Partial<Record<SurfaceId, FuxieMascotState>> = {
    'speaking-roleplay': 'roleplayWaiter',
    vocabulary: 'microgameReferee',
    'vocabulary-practice': 'microgameReferee',
    'vocabulary-microgames': 'microgameReferee',
    'rewards-shop': 'shopApproval',
}

/**
 * Map a validated `(role, surfaceId, state)` triple to a pose key in
 * `FUXIE_MASCOT_STATES`. The returned key is always a valid `FuxieMascotState`
 * so `getFuxieMascotSrc` resolves without going through the placeholder
 * fallback.
 *
 * Validates: Requirement 12.4
 */
export function pickMascotPoseKey(
    role: Exclude<MascotRole, 'silent'>,
    surfaceId: SurfaceId,
    state: SurfaceState,
): FuxieMascotState {
    if (role === 'coach') {
        return 'sessionFocusCoach'
    }
    if (role === 'companion') {
        return COMPANION_POSE_BY_SURFACE[surfaceId] ?? 'roleplayWaiter'
    }
    if (role === 'cheer') {
        return 'resultCelebration'
    }
    // role === 'guard'
    if (state === 'empty') {
        return 'calmEmpty'
    }
    return 'errorRepairHelper'
}

// -----------------------------------------------------------------------------
// Role resolution + validation
// -----------------------------------------------------------------------------

export type MascotRoleViolationCode =
    | 'cheer-without-reward-or-empty-goal'
    | 'guard-outside-locked-empty-error'
    | 'exam-in-progress-must-be-silent'

export interface MascotRoleResolution {
    /** The role that will actually be rendered (after validation + fallback). */
    role: MascotRole
    /** The role originally requested (override or config). */
    requestedRole: MascotRole
    /** `true` iff the requested role passed the invariants. */
    valid: boolean
    /** Violation reason when `valid === false`, otherwise `null`. */
    violation: MascotRoleViolationCode | null
}

/**
 * Inputs required to resolve and validate a Mascot_Role for a given render.
 * Mirrors `MascotRoleHostProps` with required state field.
 */
export interface ResolveMascotRoleInput {
    surfaceId: SurfaceId
    state: SurfaceState
    role?: MascotRole
    rewardEarned?: boolean
    emptyReachedGoal?: boolean
    examInProgress?: boolean
}

/**
 * Pure resolver used by `MascotRoleHost`. Splits role lookup, invariant
 * checks, and dev/prod fallback into something testable without a DOM.
 *
 * Logic:
 *  1. Exam in-progress (`surfaceId === 'exam' && examInProgress`) ⇒ requested
 *     role must be `silent` (Requirement 12.7).
 *  2. Otherwise the requested role is the explicit `role` override if
 *     provided, else `SURFACE_MASCOT_CONFIG[surfaceId].states[state] ??
 *     'silent'` (Requirements 12.2–12.3).
 *  3. `cheer` is only valid when `rewardEarned === true` OR
 *     (`state === 'empty' && emptyReachedGoal === true`) (Requirement 12.5).
 *  4. `guard` is only valid when `state ∈ {locked, empty, error}`
 *     (Requirement 12.6).
 *
 * Returns the validation outcome. Does NOT throw — callers decide how to
 * react in dev vs production (Requirement 12.9).
 *
 * Validates: Requirements 12.2, 12.3, 12.5, 12.6, 12.7, 12.9
 */
export function resolveMascotRole(
    input: ResolveMascotRoleInput,
): MascotRoleResolution {
    const {
        surfaceId,
        state,
        role: roleOverride,
        rewardEarned = false,
        emptyReachedGoal = false,
        examInProgress = false,
    } = input

    const configRole =
        SURFACE_MASCOT_CONFIG[surfaceId].states[state] ?? 'silent'
    const requestedRole: MascotRole = roleOverride ?? configRole

    // (1) Exam in-progress invariant — Requirement 12.7.
    if (surfaceId === 'exam' && examInProgress) {
        if (requestedRole !== 'silent') {
            return {
                role: 'silent',
                requestedRole,
                valid: false,
                violation: 'exam-in-progress-must-be-silent',
            }
        }
        return {
            role: 'silent',
            requestedRole,
            valid: true,
            violation: null,
        }
    }

    // (2) Cheer invariant — Requirement 12.5.
    if (requestedRole === 'cheer') {
        const cheerAllowed =
            rewardEarned === true ||
            (state === 'empty' && emptyReachedGoal === true)
        if (!cheerAllowed) {
            return {
                role: 'silent',
                requestedRole,
                valid: false,
                violation: 'cheer-without-reward-or-empty-goal',
            }
        }
    }

    // (3) Guard invariant — Requirement 12.6.
    if (requestedRole === 'guard') {
        const guardAllowed =
            state === 'locked' || state === 'empty' || state === 'error'
        if (!guardAllowed) {
            return {
                role: 'silent',
                requestedRole,
                valid: false,
                violation: 'guard-outside-locked-empty-error',
            }
        }
    }

    return {
        role: requestedRole,
        requestedRole,
        valid: true,
        violation: null,
    }
}

/**
 * Build the explicit error string thrown in development when validation
 * fails. Format mirrors the task acceptance verbatim:
 *
 *   `[MascotRoleHost] role "X" not allowed for state "Y" on surface "Z" — reason: ...`
 */
export function formatMascotRoleViolation(
    resolution: MascotRoleResolution,
    surfaceId: SurfaceId,
    state: SurfaceState,
): string {
    const reason = describeViolation(resolution.violation)
    return `[MascotRoleHost] role "${resolution.requestedRole}" not allowed for state "${state}" on surface "${surfaceId}" — reason: ${reason}`
}

function describeViolation(code: MascotRoleViolationCode | null): string {
    switch (code) {
        case 'cheer-without-reward-or-empty-goal':
            return 'cheer requires rewardEarned===true OR state==="empty" && emptyReachedGoal===true (Requirement 12.5)'
        case 'guard-outside-locked-empty-error':
            return 'guard is only allowed when state ∈ {locked, empty, error} (Requirement 12.6)'
        case 'exam-in-progress-must-be-silent':
            return 'exam in-progress requires role "silent" (Requirement 12.7)'
        case null:
            return 'no violation'
    }
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

function isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development'
}

/**
 * Surface-aware mascot host (task 5.2 backbone component).
 *
 * Resolves a Mascot_Role from the per-surface configuration table, validates
 * the cheer/guard/silent invariants (Requirements 12.5–12.7), throws an
 * explicit error in development on violation, falls back to `silent` in
 * production (Requirement 12.9), and renders a `FuxieRoleMascot` with a
 * stable `data-mascot-role` attribute. Returns `null` for role `silent`.
 *
 * Validates: Requirements 12.4, 12.5, 12.6, 12.7, 12.8, 12.9
 */
export function MascotRoleHost({
    surfaceId,
    state = 'default',
    role: roleOverride,
    rewardEarned,
    emptyReachedGoal,
    examInProgress,
    size = 80,
    motion,
    alt,
    priority = false,
    className = '',
    imageClassName = '',
    children,
}: MascotRoleHostProps) {
    const resolution = resolveMascotRole({
        surfaceId,
        state,
        role: roleOverride,
        rewardEarned,
        emptyReachedGoal,
        examInProgress,
    })

    if (!resolution.valid) {
        if (isDevelopment()) {
            // Requirement 12.9: dev mode throws an explicit error so the
            // misuse is caught at component boundary.
            throw new Error(
                formatMascotRoleViolation(resolution, surfaceId, state),
            )
        }
        // Production: silently fall back to `silent` (renders nothing).
    }

    const role = resolution.role

    if (role === 'silent') {
        // Requirement 12.7 + Requirement 12.9 prod fallback: render nothing
        // but still preserve the surface’s layout via the parent.
        return null
    }

    const poseKey = pickMascotPoseKey(role, surfaceId, state)
    const src = getFuxieMascotSrc(poseKey)
    const resolvedMotion: FuxieMascotMotion =
        motion ?? defaultMotionForRole(role)
    const resolvedAlt = alt ?? `Fuxie ${role}`

    return (
        <span
            data-mascot-role={role}
            data-mascot-surface={surfaceId}
            data-mascot-state={state}
            className={`mascot-role-host inline-flex shrink-0 items-center justify-center ${className}`}
        >
            <FuxieRoleMascot
                src={src}
                alt={resolvedAlt}
                size={size}
                motion={resolvedMotion}
                priority={priority}
                imageClassName={imageClassName}
            />
            {children}
        </span>
    )
}

function defaultMotionForRole(
    role: Exclude<MascotRole, 'silent'>,
): FuxieMascotMotion {
    switch (role) {
        case 'coach':
            return 'coach'
        case 'cheer':
            return 'reward'
        case 'companion':
            return 'speak'
        case 'guard':
            return 'idle'
    }
}
