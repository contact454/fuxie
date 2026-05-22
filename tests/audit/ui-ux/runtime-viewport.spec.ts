/**
 * runtime-viewport.spec.ts — Unit coverage for the reference-viewport
 * pinning guard shipped by task 3.3.
 *
 * Vai chinh: QA Automation Engineer
 * Vai phoi hop: Frontend Engineer, Product Designer
 *
 * Spec source-of-truth:
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/bugfix.md § Introduction § Scope
 *     (In) and § Bug Condition pseudocode — the pinned reference set.
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/bugfix.md § 3.5 — desktop
 *     pass-through floor.
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/design.md § Fix Implementation
 *     item 7 — pinned reference viewports + desktop pass-through.
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/tasks.md task 3.3.
 */

import { describe, expect, it } from 'vitest'

import {
    ABOVE_THE_FOLD_REFERENCE,
    DESKTOP_BREAKPOINT_PX,
    MOBILE_BREAKPOINT_PX,
    PINNED_VIEWPORTS,
    UnpinnedViewportError,
    assertPinnedViewport,
    isDesktopViewport,
    isMobileAuditViewport,
    isPinnedViewport,
} from '../../../apps/web/audit/ui-ux/runtime/viewport'

// =============================================================================
// SECTION 1 — Pinned set + breakpoint constants.
// =============================================================================

describe('pinned reference viewports — constants', () => {
    it('exports exactly the 360×640, 375×667, 414×896 set required by bugfix.md § Bug Condition', () => {
        const flat = PINNED_VIEWPORTS.map((v) => `${v.w}x${v.h}`)
        expect(flat).toEqual(['360x640', '375x667', '414x896'])
    })

    it('every pinned viewport is at or below the mobile audit ceiling (≤ 480 px)', () => {
        for (const pv of PINNED_VIEWPORTS) {
            expect(pv.w).toBeLessThanOrEqual(MOBILE_BREAKPOINT_PX)
        }
    })

    it('uses 480 px as the mobile audit ceiling and 768 px as the desktop floor', () => {
        // Hard-coded in the spec — bugfix.md § Bug Condition pseudocode
        // (≤ 480) and § 3.5 (≥ 768). Guard against drift.
        expect(MOBILE_BREAKPOINT_PX).toBe(480)
        expect(DESKTOP_BREAKPOINT_PX).toBe(768)
    })

    it('uses 375×667 as the canonical above-the-fold reference (bugfix.md § 1.9 / § 2.9)', () => {
        expect(ABOVE_THE_FOLD_REFERENCE).toEqual({ w: 375, h: 667 })
    })
})

// =============================================================================
// SECTION 2 — Predicates.
// =============================================================================

describe('isPinnedViewport', () => {
    it('returns true for every member of PINNED_VIEWPORTS (exact match)', () => {
        for (const pv of PINNED_VIEWPORTS) {
            expect(
                isPinnedViewport({ width: pv.w, height: pv.h }),
            ).toBe(true)
        }
    })

    it('returns false when width matches but height does not', () => {
        // 360 is a pinned width but 800 is not the pinned 360×640
        // height, so the descriptor is not in the canonical set.
        expect(isPinnedViewport({ width: 360, height: 800 })).toBe(false)
    })

    it('returns false when height matches but width does not', () => {
        expect(isPinnedViewport({ width: 320, height: 640 })).toBe(false)
    })

    it('returns false for desktop viewports', () => {
        expect(isPinnedViewport({ width: 1280, height: 800 })).toBe(false)
        expect(isPinnedViewport({ width: 1024, height: 768 })).toBe(false)
    })

    it('uses exact-match semantics — no tolerance on width or height', () => {
        // 376×667 is one pixel off; intentionally rejected so audits
        // stay reproducible against the canonical set.
        expect(isPinnedViewport({ width: 376, height: 667 })).toBe(false)
        expect(isPinnedViewport({ width: 375, height: 668 })).toBe(false)
    })
})

describe('isDesktopViewport', () => {
    it('returns true at and above 768 px width (Preservation 3.5)', () => {
        expect(isDesktopViewport({ width: DESKTOP_BREAKPOINT_PX, height: 1024 })).toBe(true)
        expect(isDesktopViewport({ width: 1280, height: 800 })).toBe(true)
        expect(isDesktopViewport({ width: 1920, height: 1080 })).toBe(true)
    })

    it('returns false below 768 px width', () => {
        expect(isDesktopViewport({ width: 767, height: 1024 })).toBe(false)
        for (const pv of PINNED_VIEWPORTS) {
            expect(isDesktopViewport({ width: pv.w, height: pv.h })).toBe(false)
        }
    })
})

describe('isMobileAuditViewport', () => {
    it('returns true at and below 480 px width (bugfix.md § Bug Condition)', () => {
        expect(isMobileAuditViewport({ width: 480, height: 800 })).toBe(true)
        for (const pv of PINNED_VIEWPORTS) {
            expect(
                isMobileAuditViewport({ width: pv.w, height: pv.h }),
            ).toBe(true)
        }
    })

    it('returns false above 480 px width', () => {
        expect(isMobileAuditViewport({ width: 481, height: 800 })).toBe(false)
        expect(isMobileAuditViewport({ width: 768, height: 1024 })).toBe(false)
    })
})

// =============================================================================
// SECTION 3 — Guard `assertPinnedViewport`.
// =============================================================================

describe('assertPinnedViewport', () => {
    describe('enforceMobile=true', () => {
        it('does not throw for any pinned viewport', () => {
            for (const pv of PINNED_VIEWPORTS) {
                expect(() =>
                    assertPinnedViewport(
                        { width: pv.w, height: pv.h },
                        { enforceMobile: true },
                    ),
                ).not.toThrow()
            }
        })

        it('throws UnpinnedViewportError for an unpinned mobile viewport', () => {
            // 320×568 (iPhone 5/SE-1) is mobile but NOT in the pinned set.
            // The audit MUST reject so cross-route comparisons stay
            // reproducible against the canonical set.
            expect(() =>
                assertPinnedViewport(
                    { width: 320, height: 568 },
                    { enforceMobile: true },
                ),
            ).toThrowError(UnpinnedViewportError)
        })

        it('throws UnpinnedViewportError for a desktop viewport (the harness handles desktop, not the guard)', () => {
            // The guard is intentionally strict; desktop pass-through
            // is implemented by the harness short-circuit, not by
            // letting desktop slip past the guard.
            expect(() =>
                assertPinnedViewport(
                    { width: 1280, height: 800 },
                    { enforceMobile: true },
                ),
            ).toThrowError(UnpinnedViewportError)
        })

        it('attaches the offending viewport and the pinned set to the error', () => {
            try {
                assertPinnedViewport(
                    { width: 320, height: 568 },
                    { enforceMobile: true },
                )
                throw new Error('expected assertPinnedViewport to throw')
            } catch (err) {
                expect(err).toBeInstanceOf(UnpinnedViewportError)
                const e = err as UnpinnedViewportError
                expect(e.viewport).toEqual({ width: 320, height: 568 })
                expect(e.pinnedViewports).toBe(PINNED_VIEWPORTS)
                // The error message must name the offending viewport so
                // CI logs are actionable.
                expect(e.message).toContain('320x568')
                expect(e.message).toContain('360x640')
                expect(e.message).toContain('375x667')
                expect(e.message).toContain('414x896')
            }
        })
    })

    describe('enforceMobile=false', () => {
        it('does not throw for an unpinned mobile viewport', () => {
            // The harness opts out of the guard during desktop
            // pass-through; the guard MUST honour that and stay silent.
            expect(() =>
                assertPinnedViewport(
                    { width: 320, height: 568 },
                    { enforceMobile: false },
                ),
            ).not.toThrow()
        })

        it('does not throw for a desktop viewport', () => {
            expect(() =>
                assertPinnedViewport(
                    { width: 1280, height: 800 },
                    { enforceMobile: false },
                ),
            ).not.toThrow()
        })

        it('still rejects non-finite or non-positive viewports', () => {
            // A NaN / 0 / negative viewport is unusable regardless of
            // the enforcement mode — callers cannot proceed with such
            // an input, so the guard is total.
            expect(() =>
                assertPinnedViewport(
                    { width: 0, height: 640 },
                    { enforceMobile: false },
                ),
            ).toThrowError(UnpinnedViewportError)
            expect(() =>
                assertPinnedViewport(
                    { width: -360, height: 640 },
                    { enforceMobile: false },
                ),
            ).toThrowError(UnpinnedViewportError)
            expect(() =>
                assertPinnedViewport(
                    { width: Number.NaN, height: 640 },
                    { enforceMobile: false },
                ),
            ).toThrowError(UnpinnedViewportError)
            expect(() =>
                assertPinnedViewport(
                    { width: 360, height: Number.POSITIVE_INFINITY },
                    { enforceMobile: false },
                ),
            ).toThrowError(UnpinnedViewportError)
        })
    })
})
