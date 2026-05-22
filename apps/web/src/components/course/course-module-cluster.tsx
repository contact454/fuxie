/**
 * CourseModuleClusterHeader — header that identifies a Course Path module
 * cluster with exactly one module mascot (Req 4.9 / Property 23) plus an
 * optional CEFR badge for `completed`/`mastered` clusters (Req 4.6 / 4.7).
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: Gamification Designer (per-cluster mascot mapping)
 *
 * Spec source-of-truth:
 *   - Task 9.2 (gamified-ui-asset-rollout)
 *   - design.md §I.2 (Course Path module mascot per cluster)
 *   - requirements.md Req 4.8, 4.9, 4.10
 *
 * Contract (machine-checkable):
 *   1. The root `<section>` always carries `data-cluster-id` matching the
 *      prop (Property 23 — pin each cluster).
 *   2. Renders **exactly one** element with `data-role="course-module-mascot"`
 *      (Req 4.9 — “mỗi cụm hiển thị đúng một mascot”). This is enforced
 *      structurally by the component (only one mascot is ever emitted).
 *   3. The mascot pose resolves through `getFuxieModuleMascotSrc(key)` so
 *      no hardcoded mascot-3d paths leak into surface code (Req 1.2).
 *      An unknown key falls through to `PLACEHOLDER_ASSET` per the registry
 *      contract.
 *   4. If the mascot image does NOT fire `onLoad` within 3000ms, OR fires
 *      `onError`, the component swaps to a **neutral placeholder** node
 *      tagged `data-role="course-module-mascot-placeholder"` and the cluster
 *      content (badges, header copy, child nodes) is not blocked
 *      (Req 4.10).
 *   5. For `completed`/`mastered` clusters, a CEFR receipt badge from
 *      `getCefrBadgeAssetSrc(level)` is rendered alongside the mascot
 *      (Req 4.6, 4.7). The same 3s/onError placeholder rule applies to the
 *      badge slot independently of the mascot slot.
 *
 * Layout: this is a presentational header — children (e.g. course nodes)
 * render below as a sibling section. It’s intentionally small so consumers
 * can compose it above their existing module timelines.
 */

'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

import {
    REWARD_ASSETS,
    getCefrBadgeAssetSrc,
} from '@/components/gamification/reward-assets'
import {
    FUXIE_MODULE_MASCOTS,
    PLACEHOLDER_ASSET,
    getFuxieModuleMascotSrc,
    type FuxieModuleMascot,
} from '@/lib/mascot/fuxie-assets'
import { fx } from '@/components/ui/fuxie-ui'

// -----------------------------------------------------------------------------
// Public types
// -----------------------------------------------------------------------------

/**
 * Status of an asset slot in the cluster header. Mirrors the
 * `vocabulary-card`’s frame-applied tri-state so the contract stays
 * consistent across the codebase.
 *
 *   - `loading`     until the underlying `<Image>` fires `onLoad` OR the
 *                   3s budget expires (Req 4.10).
 *   - `loaded`      once `onLoad` fires within the 3s budget.
 *   - `placeholder` if `onError` fires OR the 3s timer expires before
 *                   `onLoad` (Req 4.10).
 */
export type CourseModuleAssetStatus = 'loading' | 'loaded' | 'placeholder'

export interface CourseModuleClusterHeaderProps {
    /** Stable identifier for the cluster (module slug). Pinned to `data-cluster-id`. */
    clusterId: string
    /**
     * Visible cluster label (e.g. module title, vi or de). Required so the
     * header is not silent for screen readers.
     */
    label: string
    /** Optional secondary line shown under the label. */
    subtitle?: string
    /**
     * Module mascot key from `FUXIE_MODULE_MASCOTS`. When omitted, defaults
     * to `'course'` — the per-design module mascot for Course Path
     * clusters (design §I.2). Unknown keys fall through to
     * `PLACEHOLDER_ASSET` via `getFuxieModuleMascotSrc`.
     */
    mascotKey?: FuxieModuleMascot | string
    /**
     * Whether to render the CEFR receipt badge alongside the mascot. The
     * Course Path renders it for `completed`/`mastered` clusters
     * (Req 4.6, 4.7). The badge slot has its own load-fallback state
     * independent of the mascot slot.
     */
    showCefrBadge?: boolean
    /** CEFR level used to resolve the receipt badge asset (e.g. `"A1"`). */
    cefrLevel?: string
    /** Children rendered after the header chrome (typically the cluster’s nodes). */
    children?: ReactNode
    /** Extra class names appended to the root `<section>`. */
    className?: string
    /**
     * Override the asset-load timeout. Defaults to 3000ms per Req 4.10.
     * Tests pass a smaller value to exercise the timeout path without
     * waiting 3 seconds.
     */
    loadTimeoutMs?: number
    /**
     * Test escape hatch — set the initial mascot/badge slot status. The
     * jsdom environment is not configured for this workspace, so this is
     * how the placeholder render path becomes assertable from `node`
     * vitest. Defaults to `loading`.
     *
     * Mirrors the same pattern used by `vocabulary-card.tsx` for its
     * mastered frame fallback.
     */
    initialMascotStatus?: CourseModuleAssetStatus
    initialBadgeStatus?: CourseModuleAssetStatus
}

// -----------------------------------------------------------------------------
// Public constants
// -----------------------------------------------------------------------------

/**
 * Default load budget for the mascot + badge slots. Req 4.10 anchors this at
 * 3 seconds — exposed as a constant so tests can pin against the same value
 * the runtime uses.
 */
export const COURSE_MODULE_ASSET_LOAD_TIMEOUT_MS = 3000

/**
 * Default mascot key when no per-module override is supplied. Course Path
 * clusters use the `'course'` module mascot per design §I.2 / FUXIE_MODULE_MASCOTS.
 */
export const COURSE_MODULE_DEFAULT_MASCOT_KEY: FuxieModuleMascot = 'course'

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * Resolve a mascot pose for a cluster. Pure: tests can pin the rule without
 * rendering. Falls through to the `'course'` mascot when no key is supplied
 * AND through `getFuxieModuleMascotSrc` (which falls through to
 * `PLACEHOLDER_ASSET`) for unknown keys.
 *
 * Validates: Requirements 1.2, 4.9
 */
export function resolveModuleMascotSrc(key: string | undefined): string {
    if (!key) return FUXIE_MODULE_MASCOTS[COURSE_MODULE_DEFAULT_MASCOT_KEY]
    return getFuxieModuleMascotSrc(key)
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

/**
 * Single header used above a module cluster of course nodes.
 *
 * Validates: Requirements 4.6, 4.7, 4.8, 4.9, 4.10
 */
export function CourseModuleClusterHeader({
    clusterId,
    label,
    subtitle,
    mascotKey,
    showCefrBadge = false,
    cefrLevel,
    children,
    className = '',
    loadTimeoutMs = COURSE_MODULE_ASSET_LOAD_TIMEOUT_MS,
    initialMascotStatus = 'loading',
    initialBadgeStatus = 'loading',
}: CourseModuleClusterHeaderProps) {
    const mascotSrc = resolveModuleMascotSrc(mascotKey)
    const badgeSrc = showCefrBadge ? getCefrBadgeAssetSrc(cefrLevel) : null

    return (
        <section
            data-role="course-module-cluster"
            data-cluster-id={clusterId}
            className={fx(
                'flex flex-col gap-2 rounded-2xl bg-white/80 p-3 shadow-sm',
                'ring-1 ring-[var(--fuxie-blue-200,#CCE4F0)]',
                className,
            )}
        >
            <header className="flex items-center gap-3">
                {/* Singleton mascot slot (Req 4.9 / Property 23). */}
                <ModuleMascotSlot
                    clusterId={clusterId}
                    src={mascotSrc}
                    initialStatus={initialMascotStatus}
                    timeoutMs={loadTimeoutMs}
                />

                <div className="min-w-0 flex-1">
                    <h2
                        data-role="course-module-cluster-label"
                        className="truncate text-sm font-bold text-[#173B56]"
                    >
                        {label}
                    </h2>
                    {subtitle ? (
                        <p className="mt-0.5 truncate text-xs font-semibold text-[#3C78A8]">
                            {subtitle}
                        </p>
                    ) : null}
                </div>

                {/* Optional CEFR receipt badge (Req 4.6, 4.7). */}
                {showCefrBadge && badgeSrc ? (
                    <CefrBadgeSlot
                        clusterId={clusterId}
                        src={badgeSrc}
                        cefrLevel={cefrLevel}
                        initialStatus={initialBadgeStatus}
                        timeoutMs={loadTimeoutMs}
                    />
                ) : null}
            </header>

            {children}
        </section>
    )
}

// -----------------------------------------------------------------------------
// Internal: ModuleMascotSlot
// -----------------------------------------------------------------------------

interface ModuleMascotSlotProps {
    clusterId: string
    src: string
    initialStatus: CourseModuleAssetStatus
    timeoutMs: number
}

/**
 * Renders **exactly one** mascot element per cluster:
 *  - `data-role="course-module-mascot"`           when status ∈ {loading, loaded}
 *  - `data-role="course-module-mascot-placeholder"` when status === 'placeholder'
 *
 * The two are mutually exclusive so Property 23 holds even during fallback —
 * the cluster always emits one and only one mascot-shaped element.
 */
function ModuleMascotSlot({
    clusterId,
    src,
    initialStatus,
    timeoutMs,
}: ModuleMascotSlotProps) {
    const [status, setStatus] = useState<CourseModuleAssetStatus>(initialStatus)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Start the 3s budget on mount / src change. If `onLoad` doesn’t fire
    // before the timer expires we flip to `placeholder` (Req 4.10).
    useEffect(() => {
        if (status !== 'loading') return undefined

        timerRef.current = setTimeout(() => {
            setStatus((prev) => (prev === 'loading' ? 'placeholder' : prev))
            timerRef.current = null
            // Dev-only signal so a missed asset surfaces in the console
            // (matches the Asset Registry warning convention in
            // `fuxie-assets.ts`).
            if (process.env.NODE_ENV === 'development') {
                // eslint-disable-next-line no-console
                console.warn(
                    `[course-module-cluster] mascot timed out after ${timeoutMs}ms ` +
                        `for cluster="${clusterId}" src="${src}" — falling back to placeholder.`,
                )
            }
        }, timeoutMs)

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current)
                timerRef.current = null
            }
        }
    }, [src, timeoutMs, status, clusterId])

    const handleLoad = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }
        setStatus((prev) => (prev === 'placeholder' ? 'placeholder' : 'loaded'))
    }, [])

    const handleError = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }
        setStatus('placeholder')
    }, [])

    if (status === 'placeholder') {
        return (
            <span
                data-role="course-module-mascot-placeholder"
                data-cluster-id={clusterId}
                data-mascot-status="placeholder"
                aria-hidden="true"
                // Neutral round chip: same footprint as the mascot so the
                // node layout doesn’t shift when fallback kicks in.
                className={fx(
                    'inline-flex h-12 w-12 shrink-0 items-center justify-center',
                    'rounded-full bg-[var(--fuxie-blue-100,#E4F0F0)]',
                    'text-[#3C78A8] text-base font-bold',
                    'ring-1 ring-[var(--fuxie-blue-200,#CCE4F0)]',
                )}
            >
                {/* Generic neutral marker — explicitly NOT reward amber. */}
                <span aria-hidden="true">·</span>
            </span>
        )
    }

    return (
        <span
            data-role="course-module-mascot"
            data-cluster-id={clusterId}
            data-mascot-status={status}
            className="relative inline-flex h-12 w-12 shrink-0 items-center justify-center"
        >
            <Image
                src={src}
                alt=""
                aria-hidden="true"
                width={48}
                height={48}
                onLoad={handleLoad}
                onError={handleError}
                className="h-full w-full object-contain"
                priority={false}
            />
        </span>
    )
}

// -----------------------------------------------------------------------------
// Internal: CefrBadgeSlot
// -----------------------------------------------------------------------------

interface CefrBadgeSlotProps {
    clusterId: string
    src: string
    cefrLevel?: string
    initialStatus: CourseModuleAssetStatus
    timeoutMs: number
}

/**
 * Renders the receipt CEFR badge with the same 3s/onError fallback rule as
 * the mascot. Independent of the mascot slot so a single asset failure
 * never blocks both (Req 4.10 — “không block render của node”).
 */
function CefrBadgeSlot({
    clusterId,
    src,
    cefrLevel,
    initialStatus,
    timeoutMs,
}: CefrBadgeSlotProps) {
    const [status, setStatus] = useState<CourseModuleAssetStatus>(initialStatus)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        if (status !== 'loading') return undefined

        timerRef.current = setTimeout(() => {
            setStatus((prev) => (prev === 'loading' ? 'placeholder' : prev))
            timerRef.current = null
            if (process.env.NODE_ENV === 'development') {
                // eslint-disable-next-line no-console
                console.warn(
                    `[course-module-cluster] cefr-badge timed out after ${timeoutMs}ms ` +
                        `for cluster="${clusterId}" level="${cefrLevel ?? 'unknown'}" src="${src}" ` +
                        `— falling back to placeholder.`,
                )
            }
        }, timeoutMs)

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current)
                timerRef.current = null
            }
        }
    }, [src, timeoutMs, status, clusterId, cefrLevel])

    const handleLoad = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }
        setStatus((prev) => (prev === 'placeholder' ? 'placeholder' : 'loaded'))
    }, [])

    const handleError = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }
        setStatus('placeholder')
    }, [])

    if (status === 'placeholder') {
        return (
            <span
                data-role="course-module-cefr-badge-placeholder"
                data-cluster-id={clusterId}
                data-badge-status="placeholder"
                aria-hidden="true"
                className={fx(
                    'inline-flex h-7 w-7 shrink-0 items-center justify-center',
                    'rounded-full bg-[var(--fuxie-blue-100,#E4F0F0)]',
                    'text-[10px] font-black uppercase text-[#3C78A8]',
                    'ring-1 ring-[var(--fuxie-blue-200,#CCE4F0)]',
                )}
            >
                {(cefrLevel ?? '·').slice(0, 2)}
            </span>
        )
    }

    return (
        <span
            data-role="course-module-cefr-badge"
            data-cluster-id={clusterId}
            data-badge-status={status}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center"
        >
            <Image
                src={src}
                alt={cefrLevel ? `CEFR ${cefrLevel}` : ''}
                width={28}
                height={28}
                onLoad={handleLoad}
                onError={handleError}
                className="h-full w-full object-contain drop-shadow-sm"
                priority={false}
            />
        </span>
    )
}

// -----------------------------------------------------------------------------
// Re-exports for tests / consumers
// -----------------------------------------------------------------------------

export { PLACEHOLDER_ASSET, REWARD_ASSETS }
