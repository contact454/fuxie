/**
 * RoleplayStage — speaking roleplay sub-route layout shell.
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: Gamification Designer (companion behavior)
 *
 * Spec source-of-truth:
 *   - Task 11.2 (gamified-ui-asset-rollout)
 *   - design.md §I.4 — "Speaking roleplay (Req 6.7): mascot `companion` đặt
 *     đối diện learner avatar trên trục ngang (`flex-direction: row-reverse`
 *     mobile, hoặc grid 2-col)."
 *   - requirements.md Req 6.7
 *
 * Layout invariants (Requirement 6.7):
 *   - Root container marker: `data-role="speaking-roleplay-stage"` so jsdom
 *     layout tests can locate the stage deterministically.
 *   - Single horizontal axis: a flex row container holds two slots,
 *     `[data-role="roleplay-mascot-slot"]` and
 *     `[data-role="roleplay-avatar-slot"]`. The container uses
 *     `justify-between` + `items-center`, which puts the two slots on the
 *     SAME y-axis with OPPOSITE x positions by construction (spec
 *     acceptance: "mascot and avatar share y-axis with opposite x
 *     positions").
 *   - The mascot is rendered through `MascotRoleHost` with
 *     `surfaceId="speaking-roleplay"` so the role is resolved through the
 *     canonical `SURFACE_MASCOT_CONFIG` (companion in the default state).
 *   - The learner avatar is a small circular placeholder rendered in the
 *     opposite slot — a real avatar component will swap in once a learner
 *     profile picture pipeline ships; the layout contract is independent
 *     of the avatar's contents.
 *
 * Why both flex AND grid: design.md allows either `flex-direction:
 * row-reverse` (mobile) or `grid 2-col`. We prefer `flex … justify-between`
 * because the y-axis sharing is provable from the static markup (single
 * row container, both slots `items-center`) without requiring a real
 * layout pass — which matches the testing constraints in this workspace
 * (vitest with `environment: 'node'`, no jsdom).
 */

import type { ReactNode } from 'react'

import { MascotRoleHost } from '@/components/gamification/mascot-role-host'

// -----------------------------------------------------------------------------
// Public types
// -----------------------------------------------------------------------------

export interface RoleplayStageProps {
    /**
     * Display name for the learner; rendered as initials inside the avatar
     * placeholder. Falls back to "?" when empty so the slot still occupies
     * the opposite x position on the row.
     */
    learnerName?: string | null
    /**
     * Optional accessible label for the mascot. Forwarded to
     * {@link MascotRoleHost} as `alt`.
     */
    mascotAlt?: string
    /** Pixel size for the mascot. Mirrored on the avatar so the y-axis matches. */
    slotSize?: number
    /** When `true`, strips the mascot speak motion class. */
    reducedMotion?: boolean
    /**
     * Optional content rendered between the two slots (e.g. a centered
     * scenario title chip). Decorative — does not affect the y-axis or
     * x-axis contract because the two slots are still the leftmost and
     * rightmost flex children of the row.
     */
    children?: ReactNode
    /** Wrapper className. */
    className?: string
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * Compute up to two initials for the learner avatar placeholder. Returns
 * `"?"` when the name is empty or non-alphabetic so the slot is never
 * collapsed (which would change the row's geometry).
 */
function pickInitials(name: string | null | undefined): string {
    if (!name) return '?'
    const tokens = name
        .trim()
        .split(/\s+/u)
        .filter((token) => token.length > 0)
    if (tokens.length === 0) return '?'
    if (tokens.length === 1) {
        const first = tokens[0]!
        const initial = first.charAt(0).toUpperCase()
        return initial.length === 0 ? '?' : initial
    }
    const first = tokens[0]!.charAt(0).toUpperCase()
    const last = tokens[tokens.length - 1]!.charAt(0).toUpperCase()
    return `${first}${last}`.replace(/[^A-Z\u00C0-\u024F]/gu, '') || '?'
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

/**
 * Speaking roleplay stage shell. Places the companion mascot and the
 * learner avatar on opposite ends of a single horizontal axis.
 *
 * Validates: Requirement 6.7
 */
export function RoleplayStage({
    learnerName,
    mascotAlt = 'Fuxie companion',
    slotSize = 96,
    reducedMotion = false,
    children,
    className = '',
}: RoleplayStageProps) {
    const initials = pickInitials(learnerName)

    return (
        <section
            data-role="speaking-roleplay-stage"
            data-surface-id="speaking-roleplay"
            className={
                // Sticky-ish hero band for the roleplay sub-route. The
                // container is a flex row so both slots share the same y
                // axis (`items-center`) and sit at opposite x positions
                // (`justify-between`). On md+ viewports we promote the
                // layout to a 2-column grid for visual breathing room
                // while preserving the same y-axis / opposite-x semantics.
                'roleplay-stage relative flex w-full items-center justify-between gap-4 ' +
                'rounded-3xl bg-[#F3FBFF] px-4 py-5 ring-1 ring-[#CCE4F0]/70 ' +
                'md:grid md:grid-cols-2 md:items-center md:gap-8 md:px-8 md:py-6 ' +
                className
            }
        >
            {/* Slot 1: companion mascot — leftmost x. */}
            <div
                data-role="roleplay-mascot-slot"
                data-axis="left"
                className="flex shrink-0 items-center justify-start md:justify-self-start"
                style={{ minWidth: `${slotSize}px`, minHeight: `${slotSize}px` }}
            >
                <MascotRoleHost
                    surfaceId="speaking-roleplay"
                    state="default"
                    size={slotSize}
                    motion={reducedMotion ? 'none' : 'speak'}
                    alt={mascotAlt}
                    priority
                />
            </div>

            {/* Optional centered slot for scenario title / status chips. */}
            {children ? (
                <div
                    data-role="roleplay-stage-center"
                    className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center md:static md:translate-x-0 md:translate-y-0 md:col-span-2 md:order-2 md:row-start-2"
                >
                    {children}
                </div>
            ) : null}

            {/* Slot 2: learner avatar — rightmost x, same y as slot 1. */}
            <div
                data-role="roleplay-avatar-slot"
                data-axis="right"
                className="flex shrink-0 items-center justify-end md:justify-self-end"
                style={{ minWidth: `${slotSize}px`, minHeight: `${slotSize}px` }}
            >
                <RoleplayLearnerAvatar
                    initials={initials}
                    size={slotSize}
                    name={learnerName ?? undefined}
                />
            </div>
        </section>
    )
}

// -----------------------------------------------------------------------------
// Learner avatar placeholder
// -----------------------------------------------------------------------------

interface RoleplayLearnerAvatarProps {
    initials: string
    size: number
    name?: string
}

/**
 * Round avatar placeholder used opposite the companion mascot. Renders a
 * Bright-Sky tinted circle with the learner's initials. Stable
 * `data-role="roleplay-avatar"` selector for layout tests.
 */
function RoleplayLearnerAvatar({
    initials,
    size,
    name,
}: RoleplayLearnerAvatarProps) {
    const accessibleLabel = name ? `Học viên: ${name}` : 'Học viên'
    return (
        <span
            data-role="roleplay-avatar"
            role="img"
            aria-label={accessibleLabel}
            className="inline-flex select-none items-center justify-center rounded-full bg-white text-base font-black text-[#173B56] shadow-md ring-2 ring-[#54A8E4] sm:text-lg"
            style={{
                width: `${size}px`,
                height: `${size}px`,
                lineHeight: `${size}px`,
            }}
        >
            {initials}
        </span>
    )
}

// Re-export for tests / surface composition.
export { RoleplayLearnerAvatar }
