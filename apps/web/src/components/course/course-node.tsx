/**
 * CourseNode — single node in the Course Path.
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: Design System Designer (visual treatment per state)
 *
 * Spec source-of-truth:
 *   - Task 9.1 (gamified-ui-asset-rollout)
 *   - design.md §I.2 (Course Path node state table)
 *   - requirements.md Req 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 *
 * Contract (machine-checkable):
 *   - Renders exactly one of 5 states via `data-node-state ∈
 *     {locked, available, in-progress, completed, mastered}` (Req 4.1).
 *   - The `available` node passed `isPrimaryCta=true` carries
 *     `data-role="primary-cta"`; secondary `available` nodes use
 *     `data-cta-variant="secondary"` (Req 4.2, 4.3).
 *   - `in-progress` exposes `data-progress-value` ∈ [0, 100] and renders a
 *     visible 0–100 progress ring (Req 4.5).
 *   - `locked` renders a tooltip with `role="tooltip"` whose CSS opacity
 *     transitions from 0 → 1 in 150ms (≤ 200ms, Req 4.4); the tooltip
 *     copy describes the prerequisite (≤ 140 chars, Req 11.4).
 *   - `completed` renders the CEFR receipt badge from REWARD_ASSETS via
 *     `getCefrBadgeAssetSrc(level)` (Req 4.6).
 *   - `mastered` adds a gold ring + the `cefrBadgeNodeSet` mastered badge
 *     (Req 4.7).
 *
 * Layout: single `<li>` so this component composes cleanly into a vertical
 * `<ol data-role="course-path">` (Req 4.8 — vertical scroll on < 768px).
 */

'use client'

import Image from 'next/image'
import { CheckCircle2, LockKeyhole, Sparkles } from 'lucide-react'

import { MeasuredLink } from '@/components/performance/measured-link'
import { PrimaryCta } from '@/components/ui/primary-cta'
import {
    REWARD_ASSETS,
    getCefrBadgeAssetSrc,
} from '@/components/gamification/reward-assets'
import { FUXIE_UI_FRAMES } from '@/lib/mascot/fuxie-assets'
import { fx } from '@/components/ui/fuxie-ui'

// -----------------------------------------------------------------------------
// Public types
// -----------------------------------------------------------------------------

export const COURSE_NODE_STATES = [
    'locked',
    'available',
    'in-progress',
    'completed',
    'mastered',
] as const

export type CourseNodeState = (typeof COURSE_NODE_STATES)[number]

export interface CourseNodeProps {
    /** Stable identifier (lesson/module slug or db id) used as React key + data-node-id. */
    nodeId: string
    /** Node ordinal in the path (1-based). Falls back to "·" if not numeric. */
    nodeNumber: number | null
    /** Display title (vi or de copy resolved upstream). */
    title: string
    /** Optional secondary line shown under the title. */
    subtitle?: string
    /** Current node state (Req 4.1). */
    state: CourseNodeState
    /**
     * Target route. Only consumed for non-locked states. Locked nodes do not
     * render an interactive anchor (Req 4.4 — gate is informational).
     */
    href: string
    /**
     * Whether this node is the *first* `available` node in the Course Path.
     * Only the first-available node receives `data-role="primary-cta"`.
     * Other `available` nodes render the secondary CTA variant (Req 4.2/4.3).
     * Ignored for non-`available` states.
     */
    isPrimaryCta: boolean
    /**
     * Progress percentage 0–100 for `in-progress` state. Coerced to integer
     * and clamped to [0, 100] at render (Req 4.5). Required for
     * `state === 'in-progress'`; ignored otherwise.
     */
    progress?: number
    /**
     * Localized prerequisite reason rendered in the tooltip when
     * `state === 'locked'`. ≤ 140 chars (Req 4.4 + Req 11.4).
     */
    lockedReason?: string
    /**
     * CEFR level used to resolve the receipt badge for `completed` state and
     * the mastered ring overlay for `mastered` state (Req 4.6, 4.7).
     */
    cefrLevel?: string
    /** Optional cluster (module) identifier — surfaces use this for Property 23. */
    clusterId?: string
    /** Analytics flow forwarded to MeasuredLink. */
    analyticsFlow?: string
    /** Click source forwarded to MeasuredLink. */
    analyticsSource?: string
    /** Extra class names appended to the root `<li>`. */
    className?: string
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * Coerce arbitrary progress input to an integer in [0, 100]. Used so that
 * `data-progress-value` always satisfies Req 4.5 even if upstream code
 * passes a `NaN`, negative, or float value.
 */
export function clampProgress(value: number | undefined): number {
    if (value === undefined || !Number.isFinite(value)) return 0
    const rounded = Math.round(value)
    if (rounded < 0) return 0
    if (rounded > 100) return 100
    return rounded
}

/**
 * Tap target floor for course nodes. Mirrors the Primary_CTA contract
 * (Req 15.2, ≥44×44 dp). Exported so tests can pin against the same value.
 */
export const COURSE_NODE_MIN_TAP_TARGET_PX = 56

// -----------------------------------------------------------------------------
// Visual treatment per state (design §I.2)
// -----------------------------------------------------------------------------

interface NodeVisualSpec {
    /** Outer chip class (background + ring). */
    chip: string
    /** Number/icon class. */
    number: string
}

const VISUAL_SPECS: Record<CourseNodeState, NodeVisualSpec> = {
    locked: {
        chip:
            'bg-slate-100 text-slate-400 ring-1 ring-slate-200 grayscale ' +
            'cursor-not-allowed',
        number: 'text-slate-400',
    },
    available: {
        // Filled Bright Sky — Primary_CTA visual when isPrimaryCta=true.
        // The PrimaryCta primitive applies the actual Bright Sky background
        // for the primary variant; for the secondary variant the chip is an
        // outline blue treatment.
        chip: 'ring-2 ring-[var(--fuxie-action)]',
        number: 'text-white',
    },
    'in-progress': {
        chip: 'bg-white ring-2 ring-[var(--fuxie-success)]',
        number: 'text-[color:var(--fuxie-success)]',
    },
    completed: {
        chip: 'bg-emerald-50 ring-2 ring-emerald-300',
        number: 'text-emerald-700',
    },
    mastered: {
        chip:
            'bg-gradient-to-br from-[#FFE9A8] to-[#F5C76A] ' +
            'ring-2 ring-[#FFB703] shadow-md shadow-amber-900/15',
        number: 'text-[#8A5A00]',
    },
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

/**
 * Single course node. See module docstring for invariants.
 *
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 */
export function CourseNode({
    nodeId,
    nodeNumber,
    title,
    subtitle,
    state,
    href,
    isPrimaryCta,
    progress,
    lockedReason,
    cefrLevel,
    clusterId,
    analyticsFlow = 'course.path.node',
    analyticsSource,
    className = '',
}: CourseNodeProps) {
    const visual = VISUAL_SPECS[state]
    const safeNumber = nodeNumber ?? null

    const safeProgress =
        state === 'in-progress' ? clampProgress(progress) : undefined

    return (
        <li
            data-role="course-node"
            data-node-id={nodeId}
            data-node-state={state}
            data-cluster-id={clusterId}
            className={fx(
                // `relative group/node` lets descendants opt into the locked
                // tooltip via group-hover / group-focus-within. Using a named
                // group avoids collisions with consumer `group/*` utilities.
                'relative flex w-full items-stretch gap-3 py-2',
                'group/node',
                className,
            )}
        >
            <NodeChip
                state={state}
                visual={visual}
                href={href}
                title={title}
                isPrimaryCta={isPrimaryCta}
                nodeNumber={safeNumber}
                progressValue={safeProgress}
                cefrLevel={cefrLevel}
                analyticsFlow={analyticsFlow}
                analyticsSource={analyticsSource ?? nodeId}
                lockedReason={lockedReason}
            />

            <div className="flex min-w-0 flex-1 flex-col justify-center">
                <h3
                    data-node-title
                    title={title}
                    className={fx(
                        'line-clamp-2 text-sm font-bold leading-snug text-[#173B56]',
                        state === 'locked' && 'text-slate-500',
                    )}
                >
                    {title}
                </h3>
                {subtitle ? (
                    <p className="mt-0.5 line-clamp-1 text-xs font-semibold text-[#3C78A8]">
                        {subtitle}
                    </p>
                ) : null}

                {state === 'in-progress' && safeProgress !== undefined ? (
                    <p
                        data-node-progress-text
                        className="mt-1 text-xs font-bold tabular-nums text-[color:var(--fuxie-success)]"
                    >
                        {safeProgress}%
                    </p>
                ) : null}

                {state === 'completed' || state === 'mastered' ? (
                    <p className="mt-0.5 text-xs font-bold uppercase text-emerald-700">
                        {state === 'mastered' ? 'Đã thuần thục' : 'Đã hoàn thành'}
                    </p>
                ) : null}
            </div>
        </li>
    )
}

// -----------------------------------------------------------------------------
// NodeChip — the round/square interactive chip for the node
// -----------------------------------------------------------------------------

interface NodeChipProps {
    state: CourseNodeState
    visual: NodeVisualSpec
    href: string
    title: string
    isPrimaryCta: boolean
    nodeNumber: number | null
    progressValue: number | undefined
    cefrLevel?: string
    analyticsFlow: string
    analyticsSource: string
    lockedReason?: string
}

function NodeChip({
    state,
    visual,
    href,
    title,
    isPrimaryCta,
    nodeNumber,
    progressValue,
    cefrLevel,
    analyticsFlow,
    analyticsSource,
    lockedReason,
}: NodeChipProps) {
    // Locked: render a non-interactive chip with the prerequisite tooltip.
    // No anchor so the locked state cannot be navigated to (Req 4.4).
    if (state === 'locked') {
        return (
            <span
                tabIndex={0}
                aria-disabled="true"
                aria-describedby={`${analyticsSource}-locked-tooltip`}
                className={fx(
                    'relative flex shrink-0 items-center justify-center',
                    'h-14 w-14 rounded-2xl text-base font-black',
                    visual.chip,
                    // 2px focus ring for accessibility (Req 15.4).
                    'outline-none focus-visible:outline focus-visible:outline-2',
                    'focus-visible:outline-offset-2 focus-visible:outline-[var(--fuxie-blue-700)]',
                )}
                style={{
                    minHeight: COURSE_NODE_MIN_TAP_TARGET_PX,
                    minWidth: COURSE_NODE_MIN_TAP_TARGET_PX,
                }}
            >
                <CheckpointFrame />
                <LockKeyhole className="relative z-10 h-5 w-5" aria-hidden="true" />
                <LockedTooltip
                    id={`${analyticsSource}-locked-tooltip`}
                    reason={lockedReason ?? `Chưa đủ điều kiện: ${title}`}
                />
            </span>
        )
    }

    // Available: route through PrimaryCta primitive so data attribute and
    // tap-target invariants are enforced from a single source of truth
    // (Req 14.1, 15.2, 19.3). PrimaryCta sets data-role="primary-cta" or
    // data-cta-variant="secondary" depending on variant.
    if (state === 'available') {
        const variant = isPrimaryCta ? 'primary' : 'secondary'
        return (
            <PrimaryCta
                asChild
                variant={variant}
                aria-label={`Vào học: ${title}`}
                className={fx(
                    'relative !h-14 !w-14 !rounded-2xl !p-0',
                    // Override PrimaryCta default chrome so the chip stays a
                    // square checkpoint but keeps the data-role contract.
                    isPrimaryCta ? '' : 'ring-1 ring-[var(--fuxie-action)]',
                )}
            >
                <MeasuredLink
                    href={href}
                    flow={analyticsFlow}
                    source={analyticsSource}
                >
                    <CheckpointFrame />
                    <span className={fx('relative z-10 text-base font-black', visual.number)}>
                        {nodeNumber ?? '·'}
                    </span>
                </MeasuredLink>
            </PrimaryCta>
        )
    }

    // in-progress / completed / mastered: not the Primary_CTA, but still
    // navigable so the learner can review the lesson. We render a plain
    // anchor so the Single-Primary_CTA invariant is preserved (Req 4.3,
    // Property 8).
    return (
        <MeasuredLink
            href={href}
            flow={analyticsFlow}
            source={analyticsSource}
            aria-label={`Mở: ${title}`}
            className={fx(
                'relative flex shrink-0 items-center justify-center',
                'h-14 w-14 rounded-2xl',
                visual.chip,
                'transition-transform hover:-translate-y-0.5',
                'outline-none focus-visible:outline focus-visible:outline-2',
                'focus-visible:outline-offset-2 focus-visible:outline-[var(--fuxie-blue-700)]',
            )}
            style={{
                minHeight: COURSE_NODE_MIN_TAP_TARGET_PX,
                minWidth: COURSE_NODE_MIN_TAP_TARGET_PX,
            }}
        >
            <CheckpointFrame />

            {state === 'in-progress' && progressValue !== undefined ? (
                <ProgressRing value={progressValue} />
            ) : null}

            <span className={fx('relative z-10 text-base font-black', visual.number)}>
                {state === 'completed' ? (
                    <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                ) : state === 'mastered' ? (
                    <Sparkles className="h-5 w-5" aria-hidden="true" />
                ) : (
                    nodeNumber ?? '·'
                )}
            </span>

            {state === 'completed' || state === 'mastered' ? (
                <BadgeOverlay state={state} cefrLevel={cefrLevel} />
            ) : null}
        </MeasuredLink>
    )
}

// -----------------------------------------------------------------------------
// Sub-elements
// -----------------------------------------------------------------------------

/** Decorative checkpoint frame from the UI Frames registry. */
function CheckpointFrame() {
    return (
        <Image
            src={FUXIE_UI_FRAMES.courseCheckpointNode}
            alt=""
            aria-hidden="true"
            width={56}
            height={56}
            className="absolute inset-0 h-full w-full object-contain opacity-[0.18]"
        />
    )
}

/**
 * Progress ring rendered inside `in-progress` nodes. Animates only `transform`
 * via the dasharray attribute (declarative SVG, no transition). Carries
 * `data-progress-value` so tests can assert Req 4.5 without a DOM layout.
 */
function ProgressRing({ value }: { value: number }) {
    // Circumference for r=14 ≈ 88. Reuses the constant from CourseClient.
    const circumference = 88
    const filled = (value / 100) * circumference
    return (
        <svg
            data-role="course-node-progress-ring"
            data-progress-value={value}
            viewBox="0 0 36 36"
            className="absolute inset-0 h-full w-full -rotate-90"
            aria-hidden="true"
        >
            <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke="rgba(46, 196, 182, 0.25)"
                strokeWidth="3"
            />
            <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke="var(--fuxie-success)"
                strokeWidth="3"
                strokeDasharray={`${filled} ${circumference}`}
                strokeLinecap="round"
            />
        </svg>
    )
}

/** Receipt / mastered badge stamp overlaid on completed/mastered chips. */
function BadgeOverlay({
    state,
    cefrLevel,
}: {
    state: 'completed' | 'mastered'
    cefrLevel?: string
}) {
    const src =
        state === 'mastered'
            ? REWARD_ASSETS.cefrBadgeNodeSet
            : getCefrBadgeAssetSrc(cefrLevel)

    return (
        <Image
            src={src}
            alt=""
            aria-hidden="true"
            width={28}
            height={28}
            data-role={
                state === 'mastered'
                    ? 'course-node-mastered-badge'
                    : 'course-node-completed-badge'
            }
            className={fx(
                'absolute -right-1.5 -top-1.5 h-7 w-7 object-contain drop-shadow-md',
                state === 'mastered' && 'ring-2 ring-[#FFB703] rounded-full',
            )}
        />
    )
}

/**
 * Locked-state tooltip. Uses `group-hover/node` and `group-focus-within/node`
 * so the tooltip fades in within 150ms (≤ 200ms, Req 4.4) on either pointer
 * hover or keyboard focus of the chip. Animates only `opacity` so the closed
 * motion set rule (Req 13.1) holds.
 */
function LockedTooltip({ id, reason }: { id: string; reason: string }) {
    // Trim defensively to the 140-char ceiling (Req 11.4) so a malformed
    // upstream string never breaks the bound.
    const safeReason = reason.length > 140 ? reason.slice(0, 137) + '…' : reason
    return (
        <span
            id={id}
            role="tooltip"
            data-role="course-node-locked-tooltip"
            className={fx(
                'pointer-events-none absolute left-1/2 top-full z-20 mt-2',
                'w-max max-w-[16rem] -translate-x-1/2 rounded-lg',
                'bg-[#173B56] px-3 py-1.5 text-xs font-semibold text-white',
                'shadow-md shadow-slate-900/20',
                // Closed-set animation: opacity-only, ≤ 200ms.
                'opacity-0 transition-opacity duration-150 ease-out',
                'group-hover/node:opacity-100 group-focus-within/node:opacity-100',
            )}
        >
            {safeReason}
        </span>
    )
}
