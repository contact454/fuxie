'use client'

import Image from 'next/image'
import type { ReactNode } from 'react'

import {
    MascotRoleHost,
} from '@/components/gamification/mascot-role-host'
import {
    REWARD_ASSETS,
    getRewardAssetSrc,
    type RewardAssetKey,
} from '@/components/gamification/reward-assets'
import { getFuxieWorldPropSrc } from '@/lib/mascot/fuxie-assets'
import type { SurfaceId } from '@/lib/mascot/mascot-role'
import {
    pickWorldProp,
    type WorldTag,
} from '@/lib/mascot/fuxie-world-tags'

/**
 * Skill_Motivation_Layer — sticky-top motivation banner shared by Reading,
 * Listening, Speaking, and Writing players (design §C of
 * `gamified-ui-asset-rollout`).
 *
 * Layout invariants (Requirements 6.1, 6.2, 6.3, 13.4):
 *  - `data-role="skill-motivation-layer"` on the root element.
 *  - Sticky-top container with `height: min(20vh, 169px)` and a hard
 *    `max-height: 169px` cap.
 *  - Three horizontal zones, declared in this order so the DOM order matches
 *    visual order:
 *      1. Mascot zone — mascot role `coach` rendered through
 *         {@link MascotRoleHost}.
 *      2. Progress zone — text exactly matches the regex `^\d+/\d+$` with
 *         `done ≤ total`.
 *      3. Reward preview zone — exactly one node with
 *         `data-reward-state="preview"` carrying an asset from
 *         `REWARD_ASSETS` and a learner-facing label (e.g. "+10 Fucoin").
 *  - Never overlaps the surface’s content area: the layer is a separate DOM
 *    subtree (sticky element) and the consuming surface renders
 *    `data-role="skill-content"` as a sibling. The two subtrees do not nest,
 *    so their bounding boxes are disjoint by construction.
 *
 * Reduced motion (Requirement 13.2):
 *  - When `reducedMotion === true`, the mascot is rendered with motion
 *    `none` so no `animate-coach` class is emitted.
 *
 * Owner: Gamification Designer.
 * Co-author: Frontend Engineer.
 *
 * Validates: Requirements 6.1, 6.2, 6.3, 13.4
 */

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/**
 * Subset of `SurfaceId` whose `default` mascot role is `coach`. The motivation
 * layer is only valid on these surfaces (design §B.1 + §C). Listed
 * explicitly so consumers cannot accidentally attach the layer to e.g. the
 * exam surface (which is `silent`) or vocabulary (which is `companion`).
 */
export type SkillMotivationSurfaceId = Extract<
    SurfaceId,
    'reading' | 'listening' | 'speaking' | 'writing'
>

export interface SkillMotivationLayerProps {
    /** Surface identifier — must be one of the four skill players. */
    surfaceId: SkillMotivationSurfaceId
    /**
     * Number of items completed in the current player session. Coerced to
     * a non-negative integer at render time so the progress text remains
     * `^\d+/\d+$` even if upstream code passes a transient `NaN` or float.
     */
    done: number
    /**
     * Total number of items. Coerced to a non-negative integer at render
     * time and clamped to `>= done` so `done ≤ total` (Requirement 6.3.b).
     */
    total: number
    /**
     * Reward preview asset key. Must reference {@link REWARD_ASSETS}; unknown
     * keys fall back to `PLACEHOLDER_ASSET` via `getRewardAssetSrc`.
     * Defaults to `'fucoin'` so consumers can omit it for the canonical
     * "earn coins" preview.
     */
    rewardKey?: RewardAssetKey
    /**
     * Learner-facing reward label rendered in the preview zone (e.g.
     * `"+10 Fucoin"`). Required by Requirement 6.3.c — when omitted defaults
     * to `"+10 Fucoin"` so the preview always has a label.
     */
    rewardLabel?: string
    /**
     * Optional world tags forwarded to {@link pickWorldProp} to choose the
     * background identity asset (Requirements 6.4–6.8). When omitted or
     * empty, no background image is rendered (the consuming surface picks
     * the world prop on the content area instead).
     */
    worldPropTags?: WorldTag[]
    /**
     * `true` when the user prefers reduced motion. Strips the mascot motion
     * class so no transform/opacity loop animation is rendered
     * (Requirement 13.2).
     */
    reducedMotion?: boolean
    /**
     * Optional secondary content rendered in the progress zone (e.g. a
     * progress bar). Decorative — the canonical `done/total` text is always
     * rendered above it.
     */
    children?: ReactNode
    /** Optional additional class names applied to the root container. */
    className?: string
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * Coerce an arbitrary `number` to a non-negative integer. Used to keep the
 * progress text `done/total` matching the regex `^\d+/\d+$` even if upstream
 * code passes a `NaN`, `Infinity`, or floating value.
 */
function toNonNegativeInt(value: number): number {
    if (!Number.isFinite(value)) return 0
    const floored = Math.floor(value)
    return floored < 0 ? 0 : floored
}

/**
 * Hard size cap for the layer (Requirement 6.2). Exported so the property
 * test in task 6.3 can assert against the same constant.
 */
export const SKILL_MOTIVATION_LAYER_MAX_HEIGHT_PX = 169

/**
 * Inline style applied to the root container. Kept as a module-level
 * constant so tests can assert the cap via the rendered `style` string
 * without DOM layout.
 */
const ROOT_STYLE = {
    height: 'min(20vh, 169px)',
    maxHeight: `${SKILL_MOTIVATION_LAYER_MAX_HEIGHT_PX}px`,
} as const

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

/**
 * Sticky-top motivation banner for skill player surfaces. See module
 * docstring for layout invariants.
 */
export function SkillMotivationLayer({
    surfaceId,
    done,
    total,
    rewardKey = 'fucoin',
    rewardLabel = '+10 Fucoin',
    worldPropTags,
    reducedMotion = false,
    children,
    className = '',
}: SkillMotivationLayerProps) {
    const safeDone = toNonNegativeInt(done)
    const safeTotalRaw = toNonNegativeInt(total)
    // Requirement 6.3.b: done ≤ total. Clamp total up to done if the caller
    // passed an inconsistent pair so the rendered text stays well-formed.
    const safeTotal = safeTotalRaw < safeDone ? safeDone : safeTotalRaw
    const progressText = `${safeDone}/${safeTotal}`

    const rewardSrc = getRewardAssetSrc(rewardKey)

    const tags = worldPropTags ?? []
    const hasWorldProp = tags.length > 0
    const worldPropKey = hasWorldProp ? pickWorldProp(tags) : null
    const worldPropSrc = worldPropKey ? getFuxieWorldPropSrc(worldPropKey) : null

    return (
        <header
            data-role="skill-motivation-layer"
            data-surface-id={surfaceId}
            data-reduced-motion={reducedMotion ? 'true' : 'false'}
            // Sticky-top so the layer never overlaps the content area: the
            // surface renders `data-role="skill-content"` as a sibling
            // *after* this element, which keeps the two bounding boxes
            // disjoint along the vertical axis (Requirement 6.2).
            className={
                `sticky top-0 z-30 flex w-full items-center gap-3 ` +
                `overflow-hidden border-b border-[#8bd3ff]/30 ` +
                `bg-[#064987]/95 px-3 py-2 backdrop-blur text-white ${className}`
            }
            style={ROOT_STYLE}
        >
            {worldPropSrc ? (
                <Image
                    src={worldPropSrc}
                    alt=""
                    aria-hidden="true"
                    fill
                    sizes="100vw"
                    className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-25"
                    data-role="skill-motivation-world-prop"
                    data-world-prop-key={worldPropKey ?? undefined}
                />
            ) : null}

            {/* Zone 1: Mascot (role=coach) */}
            <div
                data-zone="mascot"
                className="relative flex h-full shrink-0 items-center justify-center"
            >
                <MascotRoleHost
                    surfaceId={surfaceId}
                    state="default"
                    size={64}
                    motion={reducedMotion ? 'none' : 'coach'}
                    priority
                    alt="Fuxie coach"
                />
            </div>

            {/* Zone 2: Progress text `done/total` */}
            <div
                data-zone="progress"
                className="relative flex min-w-0 flex-1 flex-col justify-center"
            >
                <p
                    data-progress-text=""
                    aria-label={`Tiến độ: ${safeDone} trên ${safeTotal}`}
                    className="text-base font-black tabular-nums text-white sm:text-lg"
                >
                    {progressText}
                </p>
                {children ? (
                    <div className="mt-1 min-w-0 text-xs font-semibold text-[#8bd3ff]">
                        {children}
                    </div>
                ) : null}
            </div>

            {/* Zone 3: Reward preview */}
            <div
                data-zone="reward-preview"
                data-reward-state="preview"
                data-reward-context="true"
                data-reward-key={rewardKey}
                className="relative flex h-full shrink-0 items-center gap-2 rounded-full bg-[#ffb703] px-3 py-1 shadow-md shadow-sky-950/20"
            >
                <Image
                    src={rewardSrc}
                    alt=""
                    aria-hidden="true"
                    width={40}
                    height={40}
                    className="h-7 w-7 shrink-0 object-contain drop-shadow-sm"
                />
                <span className="text-xs font-black text-[#173B56] sm:text-sm">
                    {rewardLabel}
                </span>
            </div>
        </header>
    )
}

// Re-export the asset map for consumers that compose their own preview label
// without round-tripping through the helper.
export { REWARD_ASSETS }
