/**
 * harness.ts — Playwright + JSDOM hybrid audit runner for `auditPass'`.
 *
 * Vai chinh: QA Automation Engineer
 * Vai phoi hop: Frontend Engineer, Product Designer
 *
 * Spec source-of-truth:
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/bugfix.md § Bug Condition
 *     pseudocode — the audit input is `X = { route, component,
 *     viewport, renderedDom, computedStyles }`. The harness
 *     materializes that X for every detector.
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/bugfix.md § 3.5 — viewport
 *     ≥ 768px MUST keep current behavior; the harness short-circuits
 *     before any detector runs.
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/design.md § Glossary entry
 *     "auditPass'" — unified audit pass yielding `Finding[]`.
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/design.md § Fix Implementation
 *     item 7 — pinned reference viewports and desktop pass-through.
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/tasks.md task 3.3.
 *
 * Architecture:
 *   1. `RouteLoader` is the abstraction every audit run plugs in.
 *      Two implementations are anticipated:
 *        - `JsdomRouteLoader` (default, ships in this file): pure
 *          jsdom + a caller-supplied `htmlProvider`. CI-friendly,
 *          runs under vitest with no browser.
 *        - `PlaywrightRouteLoader` (declared via `RouteLoader` only;
 *          the concrete factory lives in
 *          `playwright-route-loader.ts` to be added in a follow-up
 *          subtask). Importing Playwright at module scope here would
 *          break vitest property runs that exclude Playwright specs;
 *          keeping the loader behind the interface prevents that.
 *   2. `loadRouteContext` materializes `{ renderedDom,
 *      computedStyles, window, viewport, route }` for detectors,
 *      enforcing the pinned viewport set when `enforceMobile` is on.
 *   3. `runHarness` wraps a list of detectors. When `viewport.width
 *      >= 768`, it short-circuits to `changesProposed: ∅` per
 *      Preservation 3.5; otherwise it loads the route, calls every
 *      detector with the audit context, aggregates findings, and
 *      partitions them into `findings` and `changesProposed`
 *      (everything except `action: "forward"` is a proposed change).
 *
 * The harness deliberately does NOT validate findings — `task 3.1`'s
 * `validateFinding` is the gate (composed by `task 3.14`'s entry
 * point). The harness's job is materializing X correctly.
 */

import { JSDOM, VirtualConsole } from 'jsdom'

import type { Finding } from '../finding-schema'
import {
    assertPinnedViewport,
    isDesktopViewport,
    type ViewportLike,
} from './viewport'

// =============================================================================
// SECTION 1 — Audit context shape (matches design.md § Glossary's
// audit input X).
// =============================================================================

/**
 * `getComputedStyle`-shaped accessor yielded to detectors. Bound to
 * the loaded DOM's `window` so detectors can read computed values
 * (font-size, padding, color, …) the same way they would in a real
 * browser. The pseudoElt parameter mirrors the DOM API.
 */
export type ComputedStylesFn = (
    element: Element,
    pseudoElt?: string | null,
) => CSSStyleDeclaration

/**
 * The materialized audit context X. Detectors take this and emit
 * `Finding[]`. Mirrors the input shape declared in `bugfix.md`
 * § Bug Condition pseudocode and design.md § Glossary entry
 * "Bug_Condition".
 *
 * `dispose` releases the underlying jsdom (or Playwright page) so
 * tests don't accumulate `Window` references across runs.
 */
export interface AuditContext {
    readonly route: string
    readonly viewport: ViewportLike
    readonly renderedDom: Document
    readonly window: Window & typeof globalThis
    readonly computedStyles: ComputedStylesFn
    readonly dispose: () => Promise<void> | void
}

// =============================================================================
// SECTION 2 — RouteLoader abstraction.
// =============================================================================

/**
 * RouteLoader is the seam between the audit pipeline and the
 * underlying rendering engine. The Playwright implementation will
 * live in `playwright-route-loader.ts` (follow-up subtask) and is
 * referenced through this interface so this module never imports
 * `@playwright/test` — that import would break vitest property
 * runs which intentionally exclude Playwright specs (see
 * `vitest.property.config.ts` exclude list).
 *
 * Implementations MUST:
 *   - Apply the requested viewport before yielding the DOM.
 *   - Provide a `getComputedStyle`-shaped accessor that reads from
 *     the loaded DOM's window, not from any global / test runner
 *     window.
 *   - Return a `dispose` callback that fully tears down the
 *     resource (jsdom: close window; Playwright: close page).
 */
export interface RouteLoader {
    readonly name: string
    load(args: {
        route: string
        viewport: ViewportLike
    }): Promise<AuditContext>
}

// =============================================================================
// SECTION 3 — JsdomRouteLoader (default, CI-friendly).
// =============================================================================

/**
 * Caller-supplied function returning the HTML body for a given
 * `(route, viewport)` pair. The audit pipeline injects this when
 * constructing a `JsdomRouteLoader` — it lets the loader stay
 * agnostic about how routes are rendered (Next.js
 * `renderToStaticMarkup`, fixture HTML files on disk, inline
 * fixtures in tests, etc.).
 *
 * Returning a string is enough; the loader is responsible for
 * wrapping the body into a full `<!DOCTYPE html>` document.
 */
export type HtmlProvider = (args: {
    route: string
    viewport: ViewportLike
}) => string | Promise<string>

/**
 * Options accepted by `createJsdomRouteLoader`.
 */
export interface JsdomRouteLoaderOptions {
    /**
     * Function returning the HTML body for the requested route +
     * viewport. Required.
     */
    readonly htmlProvider: HtmlProvider
    /**
     * URL the JSDOM document is created with. Defaults to
     * `https://fuxie.test/` so navigation, document.location, and
     * relative URL resolution behave like a real origin without
     * requiring network access.
     */
    readonly baseUrl?: string
    /**
     * If true, JSDOM forwards console output to the host
     * console. Defaults to false so audit runs are quiet.
     */
    readonly forwardConsole?: boolean
}

/**
 * Default JSDOM-based route loader. Wraps the caller-supplied HTML
 * body into a full document, applies the requested viewport via
 * `window.innerWidth` / `window.innerHeight`, and returns the
 * audit context.
 *
 * The viewport is applied two ways:
 *   - `Object.defineProperty(window, 'innerWidth' / 'innerHeight')`
 *     so detectors that read those properties get the pinned
 *     values.
 *   - The document root receives `data-audit-viewport-width` /
 *     `data-audit-viewport-height` attributes so detectors can
 *     branch on the viewport without re-reading window globals
 *     (useful for detectors written against a static DOM).
 */
export function createJsdomRouteLoader(
    options: JsdomRouteLoaderOptions,
): RouteLoader {
    const baseUrl = options.baseUrl ?? 'https://fuxie.test/'
    const forwardConsole = options.forwardConsole ?? false

    return {
        name: 'jsdom',
        async load({ route, viewport }) {
            const body = await options.htmlProvider({ route, viewport })

            const virtualConsole = new VirtualConsole()
            if (forwardConsole) {
                // Mirror jsdom errors into the host console only when
                // explicitly opted-in; default audits run silently to
                // avoid drowning vitest output with framework noise.
                virtualConsole.sendTo(console)
            }

            const html = `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8" /><meta name="viewport" content="width=${viewport.width}, initial-scale=1" /></head><body data-audit-route="${escapeAttr(
                route,
            )}">${body}</body></html>`

            const dom = new JSDOM(html, {
                url: baseUrl,
                pretendToBeVisual: true,
                runScripts: 'outside-only',
                virtualConsole,
            })

            applyViewportToWindow(
                dom.window as unknown as Window & typeof globalThis,
                viewport,
            )

            const documentElement = dom.window.document.documentElement
            documentElement.setAttribute(
                'data-audit-viewport-width',
                String(viewport.width),
            )
            documentElement.setAttribute(
                'data-audit-viewport-height',
                String(viewport.height),
            )

            const window = dom.window as unknown as Window & typeof globalThis
            const computedStyles: ComputedStylesFn = (element, pseudoElt) =>
                window.getComputedStyle(element, pseudoElt ?? null)

            return {
                route,
                viewport: { width: viewport.width, height: viewport.height },
                renderedDom: dom.window.document,
                window,
                computedStyles,
                dispose: () => {
                    try {
                        dom.window.close()
                    } catch {
                        // jsdom occasionally throws when closing during a
                        // microtask; the audit no longer needs the
                        // window so swallowing is safe.
                    }
                },
            }
        },
    }
}

function applyViewportToWindow(
    window: Window & typeof globalThis,
    viewport: ViewportLike,
): void {
    // Use defineProperty because jsdom's `Window.innerWidth` is a
    // configurable getter; direct assignment is silently ignored on
    // some jsdom builds.
    Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        get: () => viewport.width,
    })
    Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        get: () => viewport.height,
    })
    Object.defineProperty(window, 'outerWidth', {
        configurable: true,
        get: () => viewport.width,
    })
    Object.defineProperty(window, 'outerHeight', {
        configurable: true,
        get: () => viewport.height,
    })
}

function escapeAttr(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
}

// =============================================================================
// SECTION 4 — Detector signature + harness orchestration.
// =============================================================================

/**
 * Detector signature. Each defect-class detector (tasks 3.4–3.12)
 * receives an `AuditContext` and emits zero or more `Finding`s.
 *
 * Detectors MUST be pure with respect to `ctx.renderedDom` —
 * mutating the document mid-audit would cross-pollute later
 * detectors. The harness does not snapshot the DOM between
 * detectors; instead, it relies on this contract.
 */
export type Detector = (
    ctx: AuditContext,
) => ReadonlyArray<Finding> | Promise<ReadonlyArray<Finding>>

/**
 * Status returned by the harness for a single audit run.
 *   - `"ran"`: the route was loaded, detectors ran, findings are
 *     populated.
 *   - `"skip-desktop"`: the viewport was ≥ 768 px so the harness
 *     short-circuited per Preservation 3.5. `findings` and
 *     `changesProposed` are guaranteed empty.
 *   - `"skip-unpinned"`: the viewport was outside the pinned set
 *     and `enforceMobile` was true. `findings` and
 *     `changesProposed` are guaranteed empty. (The guard throws
 *     by default; this status appears only when the caller opted
 *     into `failOnUnpinned: false` for batch runs.)
 */
export type HarnessStatus = 'ran' | 'skip-desktop' | 'skip-unpinned'

/**
 * Result of a single harness invocation.
 *   - `findings` is every Finding emitted by any detector,
 *     unfiltered.
 *   - `changesProposed` is the subset that actually proposes a
 *     change inside this spec — i.e. `action !== "forward"`.
 *     Forwards are still in `findings` but excluded from
 *     `changesProposed` to encode design.md § Correctness
 *     Properties Property 2 clause (iii) (`ownedByOtherSpec → no
 *     fix proposal in this spec`).
 */
export interface HarnessResult {
    readonly status: HarnessStatus
    readonly route: string
    readonly viewport: ViewportLike
    readonly findings: ReadonlyArray<Finding>
    readonly changesProposed: ReadonlyArray<Finding>
}

/**
 * Options accepted by `runHarness`.
 */
export interface RunHarnessOptions {
    readonly route: string
    readonly viewport: ViewportLike
    readonly loader: RouteLoader
    readonly detectors: ReadonlyArray<Detector>
    /**
     * When true (default), audits with a viewport outside the
     * pinned reference set throw `UnpinnedViewportError`. Set to
     * false only when batching across many fixtures and the caller
     * wants `skip-unpinned` reported instead.
     */
    readonly enforceMobile?: boolean
    /**
     * When `enforceMobile` is true and the viewport is unpinned,
     * controls whether the harness throws (default) or returns a
     * `skip-unpinned` result. The pinned-set guard always rejects
     * a non-finite or non-positive viewport.
     */
    readonly failOnUnpinned?: boolean
}

/**
 * Run a single audit: load the route, run every detector, return
 * the aggregated findings + the subset that proposes in-spec
 * changes.
 *
 * Desktop pass-through (Preservation 3.5):
 *   When `viewport.width >= DESKTOP_BREAKPOINT_PX`, the harness
 *   returns immediately with `status: "skip-desktop"` and
 *   `changesProposed: []`. The route is NOT loaded; detectors are
 *   NOT invoked. This guarantees the audit cannot accidentally
 *   propose desktop changes per `bugfix.md` § 3.5.
 */
export async function runHarness(
    options: RunHarnessOptions,
): Promise<HarnessResult> {
    const enforceMobile = options.enforceMobile ?? true
    const failOnUnpinned = options.failOnUnpinned ?? true
    const { route, viewport, loader, detectors } = options

    // ---- Desktop pass-through (Preservation 3.5) ---------------------------
    if (isDesktopViewport(viewport)) {
        return {
            status: 'skip-desktop',
            route,
            viewport: { width: viewport.width, height: viewport.height },
            findings: [],
            changesProposed: [],
        }
    }

    // ---- Pinned-set enforcement (bugfix.md § Bug Condition reference set) --
    if (enforceMobile) {
        if (failOnUnpinned) {
            assertPinnedViewport(viewport, { enforceMobile: true })
        } else {
            try {
                assertPinnedViewport(viewport, { enforceMobile: true })
            } catch {
                return {
                    status: 'skip-unpinned',
                    route,
                    viewport: {
                        width: viewport.width,
                        height: viewport.height,
                    },
                    findings: [],
                    changesProposed: [],
                }
            }
        }
    }

    // ---- Materialize X and run detectors -----------------------------------
    const ctx = await loader.load({ route, viewport })
    try {
        const collected: Finding[] = []
        for (const detector of detectors) {
            const emitted = await detector(ctx)
            for (const finding of emitted) {
                collected.push(finding)
            }
        }
        const changesProposed = collected.filter(
            (f) => f.action !== 'forward',
        )
        return {
            status: 'ran',
            route,
            viewport: { width: viewport.width, height: viewport.height },
            findings: collected,
            changesProposed,
        }
    } finally {
        await ctx.dispose()
    }
}

/**
 * Lower-level helper — load a route into an `AuditContext` without
 * running any detector. Useful for detector unit tests that want
 * to drive the DOM directly. Callers MUST `await ctx.dispose()`
 * after they finish so jsdom windows don't leak across tests.
 *
 * The pinned-set guard runs the same way as in `runHarness`, with
 * the same desktop short-circuit semantics — but because there are
 * no detectors to skip, desktop callers receive `null`.
 */
export async function loadRouteContext(args: {
    route: string
    viewport: ViewportLike
    loader: RouteLoader
    enforceMobile?: boolean
}): Promise<AuditContext | null> {
    const enforceMobile = args.enforceMobile ?? true
    if (isDesktopViewport(args.viewport)) {
        return null
    }
    if (enforceMobile) {
        assertPinnedViewport(args.viewport, { enforceMobile: true })
    }
    return args.loader.load({ route: args.route, viewport: args.viewport })
}
