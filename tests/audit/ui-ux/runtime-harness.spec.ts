/**
 * runtime-harness.spec.ts — Unit coverage for the Playwright + JSDOM
 * hybrid harness shipped by task 3.3.
 *
 * Vai chinh: QA Automation Engineer
 * Vai phoi hop: Frontend Engineer, Product Designer
 *
 * Spec source-of-truth:
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/bugfix.md § Bug Condition
 *     pseudocode — the audit input X.
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/bugfix.md § 3.5 — desktop
 *     pass-through.
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/design.md § Fix Implementation
 *     item 7 — pinned reference viewports + desktop short-circuit.
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/tasks.md task 3.3.
 *
 * The tests focus on the three contracts task 3.3 requires:
 *   1. Harness loads a route, applies the requested viewport, and
 *      yields `{ renderedDom, computedStyles }` to detectors.
 *   2. Desktop pass-through: viewport.width >= 768 short-circuits to
 *      `changesProposed: ∅` per Preservation 3.5 — and the route is
 *      NOT loaded in that case (no detector is invoked).
 *   3. Unpinned mobile viewport throws by default; opt-in batch mode
 *      maps to `status: "skip-unpinned"`.
 */

import { describe, expect, it } from 'vitest'

import type { Finding } from '../../../apps/web/audit/ui-ux/finding-schema'
import {
    type AuditContext,
    type Detector,
    type RouteLoader,
    createJsdomRouteLoader,
    loadRouteContext,
    runHarness,
} from '../../../apps/web/audit/ui-ux/runtime/harness'
import { UnpinnedViewportError } from '../../../apps/web/audit/ui-ux/runtime/viewport'

// =============================================================================
// SECTION 1 — Helpers.
// =============================================================================

/**
 * Minimal valid Finding fixture used by detectors below. The shape
 * matches `bugfix.md` § Introduction § Finding Schema; the harness
 * does not validate findings (that's task 3.1's validator), so the
 * payload here only needs to satisfy the TS type.
 */
function buildFinding(overrides: Partial<Finding> = {}): Finding {
    return {
        defectClass: '1.1',
        severity: 'P1',
        route: 'apps/web/src/app/(learn)/dashboard/page.tsx',
        component: '[data-fixture="harness-spec"]',
        evidence: {
            property: 'padding-top',
            computedValue: '14px',
            expectedToken: '--space-3 (12px) or --space-4 (16px)',
        },
        expected: 'token-or-rule reference per bugfix.md § 2.1',
        screenshotPath: 'audit-reports/ui-ux/screens/harness-spec.png',
        forwardTo: null,
        action: 'fix',
        ...overrides,
    }
}

/**
 * A loader that records every load() call and returns a tiny audit
 * context. Used to confirm the harness short-circuits without
 * loading on desktop.
 */
function createSpyLoader(): {
    loader: RouteLoader
    calls: Array<{ route: string; viewport: { width: number; height: number } }>
} {
    const calls: Array<{
        route: string
        viewport: { width: number; height: number }
    }> = []
    const loader: RouteLoader = {
        name: 'spy',
        async load({ route, viewport }) {
            calls.push({
                route,
                viewport: { width: viewport.width, height: viewport.height },
            })
            // Build a minimal jsdom-backed context using the real
            // jsdom loader so the returned `AuditContext` is shape-
            // compatible with detectors.
            const inner = createJsdomRouteLoader({
                htmlProvider: () => '<main data-spy="ok"></main>',
            })
            return inner.load({ route, viewport })
        },
    }
    return { loader, calls }
}

// =============================================================================
// SECTION 2 — JsdomRouteLoader yields { renderedDom, computedStyles }.
// =============================================================================

describe('createJsdomRouteLoader — materializes audit context X', () => {
    it('loads a route, applies the viewport, and yields renderedDom + computedStyles', async () => {
        const loader = createJsdomRouteLoader({
            htmlProvider: ({ route, viewport }) =>
                `<main data-route="${route}" data-vw="${viewport.width}"><button id="cta" style="padding: 12px 16px; background: #1da1f2;">Tiếp tục</button></main>`,
        })

        const ctx = await loader.load({
            route: '/learn/dashboard',
            viewport: { width: 360, height: 640 },
        })

        try {
            // renderedDom is a real Document with the HTML applied.
            expect(ctx.renderedDom.querySelector('main')?.getAttribute('data-route')).toBe(
                '/learn/dashboard',
            )

            const cta = ctx.renderedDom.getElementById('cta')
            expect(cta).not.toBeNull()

            // computedStyles is bound to the loaded window — detectors
            // must read computed values via this accessor.
            const computed = ctx.computedStyles(cta as Element)
            expect(computed.paddingTop).toBe('12px')
            expect(computed.paddingLeft).toBe('16px')

            // The viewport is applied to window.innerWidth / innerHeight
            // and to the document root data-attributes.
            expect(ctx.window.innerWidth).toBe(360)
            expect(ctx.window.innerHeight).toBe(640)
            expect(
                ctx.renderedDom.documentElement.getAttribute(
                    'data-audit-viewport-width',
                ),
            ).toBe('360')
            expect(
                ctx.renderedDom.documentElement.getAttribute(
                    'data-audit-viewport-height',
                ),
            ).toBe('640')
        } finally {
            await ctx.dispose()
        }
    })

    it('routes the requested viewport into the htmlProvider call', async () => {
        let received: { width: number; height: number } | null = null
        const loader = createJsdomRouteLoader({
            htmlProvider: ({ viewport }) => {
                received = { width: viewport.width, height: viewport.height }
                return '<main></main>'
            },
        })
        const ctx = await loader.load({
            route: '/learn/listening',
            viewport: { width: 414, height: 896 },
        })
        await ctx.dispose()
        expect(received).toEqual({ width: 414, height: 896 })
    })

    it('encodes the route into a body data-attribute (escaping safely)', async () => {
        const loader = createJsdomRouteLoader({
            htmlProvider: () => '<p>ok</p>',
        })
        const ctx = await loader.load({
            route: '/learn/<script>alert(1)</script>',
            viewport: { width: 375, height: 667 },
        })
        try {
            const body = ctx.renderedDom.body
            // The route attribute is set safely-escaped; injection MUST
            // NOT yield a real <script> child of <body>.
            expect(body.getAttribute('data-audit-route')).toContain(
                '<script>alert(1)</script>',
            )
            expect(body.querySelector('script')).toBeNull()
        } finally {
            await ctx.dispose()
        }
    })
})

// =============================================================================
// SECTION 3 — Desktop pass-through (Preservation 3.5).
// =============================================================================

describe('runHarness — desktop pass-through (Preservation 3.5)', () => {
    it('viewport.width >= 768 short-circuits to changesProposed: ∅ without loading', async () => {
        const { loader, calls } = createSpyLoader()
        const detectorCalls: AuditContext[] = []
        const detector: Detector = (ctx) => {
            detectorCalls.push(ctx)
            return [buildFinding()]
        }

        const result = await runHarness({
            route: 'apps/web/src/app/(learn)/dashboard/page.tsx',
            viewport: { width: 1280, height: 800 },
            loader,
            detectors: [detector],
        })

        expect(result.status).toBe('skip-desktop')
        expect(result.findings).toEqual([])
        expect(result.changesProposed).toEqual([])
        // The route MUST NOT be loaded — that is the whole point of
        // Preservation 3.5: don't even render desktop.
        expect(calls).toHaveLength(0)
        expect(detectorCalls).toHaveLength(0)
    })

    it('returns skip-desktop exactly at the 768 px floor', async () => {
        const { loader } = createSpyLoader()
        const result = await runHarness({
            route: '/x',
            viewport: { width: 768, height: 1024 },
            loader,
            detectors: [],
        })
        expect(result.status).toBe('skip-desktop')
        expect(result.changesProposed).toEqual([])
    })

    it('still loads when the viewport is one px below the desktop floor (and pinned)', async () => {
        // 414×896 is the largest pinned mobile viewport. Confirm it
        // does NOT get short-circuited by mistake.
        const { loader, calls } = createSpyLoader()
        const result = await runHarness({
            route: '/learn/listening',
            viewport: { width: 414, height: 896 },
            loader,
            detectors: [],
        })
        expect(result.status).toBe('ran')
        expect(calls).toHaveLength(1)
        expect(calls[0].viewport).toEqual({ width: 414, height: 896 })
    })
})

// =============================================================================
// SECTION 4 — Pinned-set enforcement.
// =============================================================================

describe('runHarness — pinned-set enforcement', () => {
    it('throws UnpinnedViewportError for an unpinned mobile viewport with default options', async () => {
        const { loader } = createSpyLoader()
        await expect(
            runHarness({
                route: '/learn/dashboard',
                viewport: { width: 320, height: 568 },
                loader,
                detectors: [],
            }),
        ).rejects.toBeInstanceOf(UnpinnedViewportError)
    })

    it('returns skip-unpinned (instead of throwing) when failOnUnpinned=false', async () => {
        const { loader, calls } = createSpyLoader()
        const result = await runHarness({
            route: '/learn/dashboard',
            viewport: { width: 320, height: 568 },
            loader,
            detectors: [],
            failOnUnpinned: false,
        })
        expect(result.status).toBe('skip-unpinned')
        expect(result.findings).toEqual([])
        expect(result.changesProposed).toEqual([])
        // Like desktop pass-through, an unpinned-skip MUST NOT load
        // the route — otherwise we waste resources and let detectors
        // see arbitrary viewports.
        expect(calls).toHaveLength(0)
    })

    it('does not enforce the pinned set when enforceMobile=false (caller opts out)', async () => {
        const { loader, calls } = createSpyLoader()
        const result = await runHarness({
            route: '/learn/dashboard',
            viewport: { width: 320, height: 568 },
            loader,
            detectors: [],
            enforceMobile: false,
        })
        expect(result.status).toBe('ran')
        expect(calls).toHaveLength(1)
    })
})

// =============================================================================
// SECTION 5 — Detector aggregation + forward partitioning.
// =============================================================================

describe('runHarness — detector aggregation', () => {
    it('runs every detector with the same audit context and aggregates findings', async () => {
        const { loader } = createSpyLoader()
        const seenRoutes: string[] = []
        const detectorA: Detector = (ctx) => {
            seenRoutes.push(`A:${ctx.route}`)
            return [buildFinding({ defectClass: '1.1' })]
        }
        const detectorB: Detector = (ctx) => {
            seenRoutes.push(`B:${ctx.route}`)
            return [buildFinding({ defectClass: '1.5' })]
        }

        const result = await runHarness({
            route: '/learn/listening',
            viewport: { width: 360, height: 640 },
            loader,
            detectors: [detectorA, detectorB],
        })

        expect(result.status).toBe('ran')
        expect(seenRoutes).toEqual(['A:/learn/listening', 'B:/learn/listening'])
        expect(result.findings.map((f) => f.defectClass)).toEqual(['1.1', '1.5'])
    })

    it('partitions findings into changesProposed by excluding action="forward"', async () => {
        const { loader } = createSpyLoader()
        const detector: Detector = () => [
            buildFinding({ defectClass: '1.1', action: 'fix' }),
            buildFinding({
                defectClass: '1.4',
                severity: 'P0',
                action: 'forward',
                forwardTo: 'gamified-ui-asset-rollout',
            }),
        ]

        const result = await runHarness({
            route: '/learn/dashboard',
            viewport: { width: 375, height: 667 },
            loader,
            detectors: [detector],
        })

        expect(result.status).toBe('ran')
        // Both findings remain in the unfiltered list.
        expect(result.findings).toHaveLength(2)
        // ChangesProposed excludes the forward — design.md § Correctness
        // Properties Property 2 clause (iii): ownedByOtherSpec → no
        // fix proposal in this spec.
        expect(result.changesProposed).toHaveLength(1)
        expect(result.changesProposed[0].defectClass).toBe('1.1')
    })

    it('disposes the audit context after every run (no jsdom leak)', async () => {
        let disposed = false
        const loader: RouteLoader = {
            name: 'tracking',
            async load({ route, viewport }) {
                const inner = createJsdomRouteLoader({
                    htmlProvider: () => '<main></main>',
                })
                const ctx = await inner.load({ route, viewport })
                return {
                    ...ctx,
                    dispose: () => {
                        disposed = true
                        return ctx.dispose()
                    },
                }
            },
        }

        await runHarness({
            route: '/learn/dashboard',
            viewport: { width: 360, height: 640 },
            loader,
            detectors: [],
        })

        expect(disposed).toBe(true)
    })

    it('still disposes the audit context when a detector throws', async () => {
        let disposed = false
        const loader: RouteLoader = {
            name: 'tracking',
            async load({ route, viewport }) {
                const inner = createJsdomRouteLoader({
                    htmlProvider: () => '<main></main>',
                })
                const ctx = await inner.load({ route, viewport })
                return {
                    ...ctx,
                    dispose: () => {
                        disposed = true
                        return ctx.dispose()
                    },
                }
            },
        }
        const failing: Detector = () => {
            throw new Error('detector blew up')
        }

        await expect(
            runHarness({
                route: '/learn/dashboard',
                viewport: { width: 360, height: 640 },
                loader,
                detectors: [failing],
            }),
        ).rejects.toThrow('detector blew up')

        expect(disposed).toBe(true)
    })
})

// =============================================================================
// SECTION 6 — loadRouteContext (lower-level helper).
// =============================================================================

describe('loadRouteContext', () => {
    it('returns a usable audit context for a pinned mobile viewport', async () => {
        const loader = createJsdomRouteLoader({
            htmlProvider: () => '<main id="root"></main>',
        })
        const ctx = await loadRouteContext({
            route: '/learn/dashboard',
            viewport: { width: 375, height: 667 },
            loader,
        })
        expect(ctx).not.toBeNull()
        try {
            expect(ctx!.renderedDom.getElementById('root')).not.toBeNull()
            expect(ctx!.viewport).toEqual({ width: 375, height: 667 })
        } finally {
            await ctx!.dispose()
        }
    })

    it('returns null for a desktop viewport (Preservation 3.5)', async () => {
        const loader = createJsdomRouteLoader({
            htmlProvider: () => '<main></main>',
        })
        const ctx = await loadRouteContext({
            route: '/learn/dashboard',
            viewport: { width: 1280, height: 800 },
            loader,
        })
        expect(ctx).toBeNull()
    })

    it('throws UnpinnedViewportError for an unpinned mobile viewport with enforceMobile=true (default)', async () => {
        const loader = createJsdomRouteLoader({
            htmlProvider: () => '<main></main>',
        })
        await expect(
            loadRouteContext({
                route: '/learn/dashboard',
                viewport: { width: 320, height: 568 },
                loader,
            }),
        ).rejects.toBeInstanceOf(UnpinnedViewportError)
    })

    it('does not throw when enforceMobile=false', async () => {
        const loader = createJsdomRouteLoader({
            htmlProvider: () => '<main></main>',
        })
        const ctx = await loadRouteContext({
            route: '/learn/dashboard',
            viewport: { width: 320, height: 568 },
            loader,
            enforceMobile: false,
        })
        expect(ctx).not.toBeNull()
        await ctx!.dispose()
    })
})
