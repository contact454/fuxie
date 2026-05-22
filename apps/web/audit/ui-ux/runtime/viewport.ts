/**
 * viewport.ts — Reference-viewport pinning for `auditPass'`.
 *
 * Vai chinh: QA Automation Engineer
 * Vai phoi hop: Frontend Engineer, Product Designer
 *
 * Spec source-of-truth:
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/bugfix.md § Introduction §
 *     Scope (In) — "Viewport tham chiếu đo lường: 360×640 và
 *     414×896". The full pinned set covering iPhone SE-class /
 *     iPhone Plus-class / mid-tier Android is 360×640, 375×667,
 *     414×896.
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/bugfix.md § Bug Condition
 *     pseudocode — `viewport ≤ 480px (reference: 360x640, 375x667,
 *     414x896)`.
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/bugfix.md § 3.5 — viewport
 *     ≥ 768px (tablet) and ≥ 1024px (desktop) MUST keep current
 *     behavior; the audit MUST NOT propose changes there.
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/design.md § Fix
 *     Implementation item 7 — "Audit chạy ở 360×640, 375×667,
 *     414×896 cho ≤ 480px. Viewport ≥ 768px (tablet 768+, desktop
 *     1024+) pass-through không đề xuất."
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/tasks.md task 3.3.
 *
 * Contract:
 *   - `PINNED_VIEWPORTS` is the ONLY allowed mobile reference set.
 *     Detectors and the harness MUST run audits against members of
 *     this set when `enforceMobile` is on.
 *   - `assertPinnedViewport(viewport, { enforceMobile })` throws
 *     when `enforceMobile === true` and `viewport` is not a member
 *     of the pinned set. When `enforceMobile === false` it
 *     short-circuits — desktop pass-through (≥ 768 px) is handled
 *     by the harness, not by this guard.
 *   - `isDesktopViewport(viewport)` is the canonical predicate the
 *     harness uses to short-circuit per Preservation 3.5.
 *
 * Pure module: no jsdom, no Playwright. Safe to import from any
 * detector unit test.
 */

// =============================================================================
// SECTION 1 — Numeric breakpoints (`bugfix.md` § 3.5 / design.md
// § Fix Implementation item 7).
// =============================================================================

/**
 * Mobile audit ceiling in CSS px. Inputs with `viewport.width <=
 * MOBILE_BREAKPOINT_PX` are inside the bug condition's spatial
 * scope (`bugfix.md` § Bug Condition: `viewport.width ≤ 480`).
 */
export const MOBILE_BREAKPOINT_PX = 480

/**
 * Desktop pass-through floor in CSS px. Inputs with
 * `viewport.width >= DESKTOP_BREAKPOINT_PX` are out of scope —
 * Preservation 3.5 mandates the audit propose no changes there.
 */
export const DESKTOP_BREAKPOINT_PX = 768

// =============================================================================
// SECTION 2 — Pinned reference viewport set.
// =============================================================================

/**
 * Viewport descriptor used throughout the audit pipeline. The
 * `width` × `height` pair is in CSS px and matches the values used
 * by Playwright (`page.setViewportSize`) and JSDOM (the `window`
 * width/height the harness applies before yielding to detectors).
 */
export interface PinnedViewport {
    readonly w: number
    readonly h: number
}

/**
 * Canonical pinned viewport set. The order is deliberate:
 *   1. 360×640  — Android baseline (compact phones).
 *   2. 375×667  — iPhone SE-class (also the reference for above-
 *                 the-fold measurements in `bugfix.md` § 1.9 / § 2.9).
 *   3. 414×896  — iPhone Plus-class / mid-tier Android.
 *
 * Detectors that need a reference fold (defect class 1.9 in
 * particular) MUST measure against 375×667 per `bugfix.md` § 2.9 ii.
 */
export const PINNED_VIEWPORTS: ReadonlyArray<PinnedViewport> = [
    { w: 360, h: 640 },
    { w: 375, h: 667 },
    { w: 414, h: 896 },
] as const

/**
 * Reference viewport for above-the-fold area measurements
 * (`bugfix.md` § 1.9 condition (b) and § 2.9 (ii)). Detectors that
 * need a single canonical fold MUST use this value rather than
 * picking a member of `PINNED_VIEWPORTS` themselves.
 */
export const ABOVE_THE_FOLD_REFERENCE: PinnedViewport = { w: 375, h: 667 }

// =============================================================================
// SECTION 3 — Predicates.
// =============================================================================

/**
 * Loose viewport shape accepted by the predicates. Both Playwright
 * (`{ width, height }`) and the audit input X (design.md § Glossary
 * entry "Bug_Condition") use the same property names; the
 * pinned-set descriptors use `{ w, h }`. This shape covers either.
 */
export interface ViewportLike {
    readonly width: number
    readonly height: number
}

/**
 * Returns true when `viewport.width` x `viewport.height` matches a
 * member of `PINNED_VIEWPORTS` exactly (no tolerance). Exact-match
 * is intentional: the audit MUST run against the pinned reference
 * set so cross-route comparisons stay reproducible.
 */
export function isPinnedViewport(viewport: ViewportLike): boolean {
    for (const pv of PINNED_VIEWPORTS) {
        if (pv.w === viewport.width && pv.h === viewport.height) {
            return true
        }
    }
    return false
}

/**
 * Returns true when `viewport.width >= DESKTOP_BREAKPOINT_PX`.
 * The harness uses this to short-circuit per Preservation 3.5
 * (`bugfix.md` § 3.5 / design.md § Fix Implementation item 7).
 */
export function isDesktopViewport(viewport: ViewportLike): boolean {
    return viewport.width >= DESKTOP_BREAKPOINT_PX
}

/**
 * Returns true when `viewport.width <= MOBILE_BREAKPOINT_PX`. This
 * is the spatial half of `isBugCondition(X)`'s scope predicate
 * (`bugfix.md` § Bug Condition / design.md § Bug Details § Bug
 * Condition).
 */
export function isMobileAuditViewport(viewport: ViewportLike): boolean {
    return viewport.width <= MOBILE_BREAKPOINT_PX
}

// =============================================================================
// SECTION 4 — Guard.
// =============================================================================

/**
 * Options accepted by `assertPinnedViewport`.
 */
export interface AssertPinnedViewportOptions {
    /**
     * When true, the guard rejects any viewport that is not a member
     * of `PINNED_VIEWPORTS`. When false, the guard is a no-op —
     * callers running in desktop pass-through mode (handled by the
     * harness) skip the pinned check.
     */
    readonly enforceMobile: boolean
}

/**
 * Error thrown by `assertPinnedViewport` when the viewport is
 * outside the pinned set under `enforceMobile`. Exported so callers
 * can `instanceof`-test it in unit tests without coupling to the
 * exact message string.
 */
export class UnpinnedViewportError extends Error {
    readonly viewport: ViewportLike
    readonly pinnedViewports: ReadonlyArray<PinnedViewport>

    constructor(viewport: ViewportLike) {
        const pinnedList = PINNED_VIEWPORTS.map((v) => `${v.w}x${v.h}`).join(
            ', ',
        )
        super(
            `audit/ui-ux: viewport ${viewport.width}x${viewport.height} is not in the pinned reference set [${pinnedList}] (bugfix.md § Bug Condition + design.md § Fix Implementation item 7). When enforceMobile=true the audit MUST run against a pinned mobile viewport.`,
        )
        this.name = 'UnpinnedViewportError'
        this.viewport = viewport
        this.pinnedViewports = PINNED_VIEWPORTS
    }
}

/**
 * Guard used by detectors and the harness to reject audit
 * invocations against a non-pinned viewport when `enforceMobile`
 * is on. Returns `void`; throws `UnpinnedViewportError` on
 * violation.
 *
 * When `enforceMobile === false`, the function returns immediately
 * — desktop pass-through is the harness's responsibility (it
 * short-circuits to `changesProposed: ∅` per Preservation 3.5
 * before any detector runs).
 *
 * The viewport object MUST carry positive integer width / height.
 * A non-finite or non-positive viewport always throws regardless
 * of `enforceMobile`, since callers cannot meaningfully proceed
 * with such an input.
 */
export function assertPinnedViewport(
    viewport: ViewportLike,
    options: AssertPinnedViewportOptions,
): void {
    if (
        !Number.isFinite(viewport.width) ||
        !Number.isFinite(viewport.height) ||
        viewport.width <= 0 ||
        viewport.height <= 0
    ) {
        throw new UnpinnedViewportError(viewport)
    }
    if (!options.enforceMobile) {
        return
    }
    if (!isPinnedViewport(viewport)) {
        throw new UnpinnedViewportError(viewport)
    }
}
