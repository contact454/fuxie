/**
 * Visual QA Capture Spec — generates one Playwright test per Capture_Manifest entry
 * and writes a PNG to `docs/design/visual-audit/qa-runs/2026-05-16/<evidencePath>`.
 *
 * Vai chinh: QA Automation Engineer
 * Vai phoi hop: Frontend Engineer, Project Manager / Delivery Manager
 *
 * Spec source-of-truth:
 *   - .kiro/specs/visual-qa-screenshot-capture/requirements.md
 *       Req 3.1, 3.2  — manifest-driven test generation
 *       Req 3.3, 3.7, 3.8 — output path + PNG validity
 *       Req 3.4, 3.5  — viewport setup (mobile 390×844 / desktop 1440×1100)
 *       Req 3.6        — state drivers (queryParam | routeIntercept | mockFetch | seedReset | none)
 *       Req 3.9        — single navigation guard, no behavioral assertions
 *       Req 3.10       — 60s timeout + structured error (surface, state, viewport, reason)
 *       Req 4.2        — FUXIE_PLAYWRIGHT_SKIP_SEEDED guard
 *       Req 9.4        — emulateMedia({ reducedMotion: 'reduce' }) for animation-prone states
 *       Req 11.2       — write JSON summary on non-zero exit
 *       Req 11.3       — FUXIE_CAPTURE_ONLY env filter
 *   - .kiro/specs/visual-qa-screenshot-capture/design.md
 *       Decision 1     — manifest schema
 *       Decision 2     — driver kind per <surface, state>
 *   - docs/design/visual-qa-manifest-schema-notes.md
 *       PM resolution: state enum extended with `result` (1 entry: exam.result.mobile);
 *       v1 manifest uses only `none` and `routeIntercept` drivers — `queryParam`,
 *       `mockFetch`, and `seedReset` branches are kept for forward-compat per Req 3.6.
 *
 * Capture-only contract (Req 3.9): every test contains exactly one navigation
 * guard `expect(page).toHaveURL(...)` and zero behavioral assertions. Failures
 * MUST surface a structured message with all four tokens (surface, state,
 * viewport, reason) so the operator can fix the seed/route and re-run with
 * `FUXIE_CAPTURE_ONLY=<surface>`.
 */

import { expect, test, type Page, type Route } from '@playwright/test'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import * as path from 'node:path'

// -----------------------------------------------------------------------------
// Module discovery — load manifest synchronously before any test.describe runs.
// Anchor at `__dirname` (CommonJS-style) so the spec resolves the manifest
// regardless of which cwd Playwright was invoked with. perf.spec.ts uses the
// same pattern, ensuring Slow 4G integration and capture share one TS loader.
// -----------------------------------------------------------------------------

const WORKSPACE_ROOT = path.resolve(__dirname, '..', '..')
const MANIFEST_PATH = path.join(
    WORKSPACE_ROOT,
    'tests',
    'integration',
    'visual-capture.manifest.json',
)
const VISUAL_AUDIT_FOLDER = path.join(
    WORKSPACE_ROOT,
    'docs',
    'design',
    'visual-audit',
    'qa-runs',
    '2026-05-16',
)
const SUMMARY_PATH = path.join(
    WORKSPACE_ROOT,
    'tmp',
    'playwright',
    'visual-capture-summary.json',
)

// Per Req 3.10, every Playwright action and the test body itself must abort
// within 60s. The default in playwright.config.ts is 90s for perf — capture
// is faster and uses the tighter spec budget.
const TEST_TIMEOUT_MS = 60_000

// -----------------------------------------------------------------------------
// Manifest schema (mirrors design.md §Decision 1 + schema-notes.md `result`
// extension). Kept as a local type so this spec stays decoupled from the
// validator under tests/property/.
// -----------------------------------------------------------------------------

type ViewportKind = 'mobile' | 'desktop'
type StateKind =
    | 'default'
    | 'empty'
    | 'locked'
    | 'error'
    | 'success'
    | 'result'

type StateDriver =
    | { kind: 'none' }
    | { kind: 'queryParam'; param: string; value: string }
    | {
          kind: 'routeIntercept'
          pattern: string
          fulfill: {
              status: number
              body?: unknown
              contentType?: string
          }
      }
    | {
          kind: 'mockFetch'
          handlers: Array<{
              pattern: string
              fulfill: { status: number; body?: unknown; contentType?: string }
          }>
      }
    | { kind: 'seedReset'; endpoint: string }

interface ManifestEntry {
    surface: string
    state: StateKind
    viewport: ViewportKind
    route: string
    evidencePath: string
    requiresSeed: boolean
    stateDriver?: StateDriver
}

// -----------------------------------------------------------------------------
// FUXIE_PLAYWRIGHT_SKIP_SEEDED guard (Req 4.2). Must throw at module discovery
// so the operator gets a single actionable error instead of N skipped tests.
// -----------------------------------------------------------------------------

if (process.env.FUXIE_PLAYWRIGHT_SKIP_SEEDED === '1') {
    throw new Error(
        'Capture run requires seeded surfaces; FUXIE_PLAYWRIGHT_SKIP_SEEDED is incompatible with `pnpm test:integration:capture`.',
    )
}

// -----------------------------------------------------------------------------
// Load + filter manifest. FUXIE_CAPTURE_ONLY (Req 11.3) accepts a comma-
// separated list of surface IDs; entries outside the list are skipped via
// `test.skip` with a stable reason so the summary file (Req 11.2) records
// them as `skipped` rather than `passed`.
// -----------------------------------------------------------------------------

const RAW_MANIFEST = JSON.parse(
    readFileSync(MANIFEST_PATH, 'utf8'),
) as ManifestEntry[]

const CAPTURE_ONLY = (process.env.FUXIE_CAPTURE_ONLY ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

const ENTRIES: ManifestEntry[] = RAW_MANIFEST
const ALLOWED_SURFACES: Set<string> | null =
    CAPTURE_ONLY.length > 0 ? new Set(CAPTURE_ONLY) : null

// -----------------------------------------------------------------------------
// Summary tracking (Req 11.2). We record every test outcome and write a
// single JSON file in `globalTeardown`-style logic via afterAll. The file is
// written unconditionally so successful runs also leave an audit trail; Req
// 11.2 only mandates the file on non-zero exit, but writing it always is a
// no-cost win for ops.
// -----------------------------------------------------------------------------

interface SummaryRecord {
    surface: string
    state: StateKind
    viewport: ViewportKind
    evidencePath: string
    status: 'passed' | 'failed' | 'skipped'
    reason?: string
}

const summary: SummaryRecord[] = []

function recordOutcome(record: SummaryRecord): void {
    summary.push(record)
}

// -----------------------------------------------------------------------------
// Test name + helpers
// -----------------------------------------------------------------------------

function testTitle(entry: ManifestEntry): string {
    return `${entry.surface} / ${entry.state} / ${entry.viewport}`
}

function viewportSize(viewport: ViewportKind): {
    width: number
    height: number
} {
    return viewport === 'mobile'
        ? { width: 390, height: 844 }
        : { width: 1440, height: 900 }
}

/**
 * Resolve the absolute output path for a manifest entry. Anchors at
 * `docs/design/visual-audit/qa-runs/2026-05-16/`. Per Req 3.7 we mkdir-p the
 * parent directory before `page.screenshot` writes, so a missing surface
 * subfolder never hard-fails the capture.
 */
function evidenceAbsolutePath(entry: ManifestEntry): string {
    return path.join(VISUAL_AUDIT_FOLDER, entry.evidencePath)
}

/**
 * Apply `?<param>=<value>` to a route string, preserving any existing query.
 * Used by the `queryParam` state driver (forward-compat — no v1 manifest
 * entry uses this driver, but Req 3.6 mandates we support it).
 */
function appendQueryParam(
    route: string,
    param: string,
    value: string,
): string {
    const separator = route.includes('?') ? '&' : '?'
    return `${route}${separator}${encodeURIComponent(param)}=${encodeURIComponent(value)}`
}

/**
 * Install a single route intercept. The body is JSON-serialised with
 * content-type `application/json` unless the entry overrides; status defaults
 * to 200 when omitted (defensive — manifest entries today always set status).
 */
async function installRouteIntercept(
    page: Page,
    pattern: string,
    fulfill: { status: number; body?: unknown; contentType?: string },
): Promise<void> {
    await page.route(pattern, async (route: Route) => {
        const status = fulfill.status ?? 200
        const contentType = fulfill.contentType ?? 'application/json'
        const bodyValue = fulfill.body
        // Empty body when status is e.g. 500 with no payload — return an
        // empty JSON object so the surface's error handling still parses.
        const body =
            bodyValue === undefined
                ? contentType.includes('json')
                    ? JSON.stringify({})
                    : ''
                : typeof bodyValue === 'string'
                  ? bodyValue
                  : JSON.stringify(bodyValue)
        await route.fulfill({ status, contentType, body })
    })
}

/**
 * Install all state-driver side-effects required by an entry before
 * navigation. Returns the (possibly rewritten) route to navigate to.
 *
 * Req 3.6 requires we cover all five driver kinds even when v1 manifest only
 * uses `none` and `routeIntercept` (per schema-notes.md). The branches for
 * `queryParam`, `mockFetch`, and `seedReset` are kept tiny but correct so a
 * future manifest update needs zero spec changes.
 */
async function applyStateDriver(
    page: Page,
    entry: ManifestEntry,
): Promise<string> {
    const driver = entry.stateDriver
    if (!driver || driver.kind === 'none') return entry.route

    switch (driver.kind) {
        case 'queryParam':
            return appendQueryParam(entry.route, driver.param, driver.value)
        case 'routeIntercept':
            await installRouteIntercept(page, driver.pattern, driver.fulfill)
            return entry.route
        case 'mockFetch':
            for (const handler of driver.handlers) {
                await installRouteIntercept(
                    page,
                    handler.pattern,
                    handler.fulfill,
                )
            }
            return entry.route
        case 'seedReset': {
            // Dev-only reset endpoint. Only allowed when the dev server has
            // FUXIE_DEV_AUTH_ENABLED=true — we delegate to the endpoint and
            // rely on the server to enforce the gate (returns 404 otherwise).
            const baseUrl = process.env.BASE_URL ?? 'http://localhost:3005'
            const resetUrl = `${baseUrl}${driver.endpoint}`
            const response = await page.request.post(resetUrl)
            if (!response.ok()) {
                throw new Error(
                    `seedReset failed: ${driver.endpoint} returned ${response.status()}`,
                )
            }
            return entry.route
        }
        default: {
            // Exhaustive check — TypeScript will error here if a new driver
            // kind is added to the union without a matching case.
            const _exhaustive: never = driver
            void _exhaustive
            return entry.route
        }
    }
}

/**
 * Build a structured error message satisfying Req 3.10. Every failure path
 * funnels through this helper so log scrapers can rely on the four-token
 * format.
 */
function structuredError(entry: ManifestEntry, reason: string): Error {
    return new Error(
        `[visual-capture] surface=${entry.surface} state=${entry.state} viewport=${entry.viewport} reason=${reason}`,
    )
}

// -----------------------------------------------------------------------------
// Test generation
// -----------------------------------------------------------------------------

test.describe('Visual QA capture', () => {
    test.describe.configure({ timeout: TEST_TIMEOUT_MS })

    for (const entry of ENTRIES) {
        const title = testTitle(entry)

        // FUXIE_CAPTURE_ONLY filter (Req 11.3): tests outside the allowlist
        // are still emitted (so the manifest size matches generated test
        // count) but skipped at runtime with a stable reason.
        const skippedByFilter =
            ALLOWED_SURFACES !== null && !ALLOWED_SURFACES.has(entry.surface)

        test.describe(title, () => {
            // Apply correct viewport configuration dynamically per viewport mode
            test.use({
                viewport: viewportSize(entry.viewport),
                deviceScaleFactor: 1,
                isMobile: entry.viewport === 'mobile',
                hasTouch: entry.viewport === 'mobile',
            })

            test('capture screen', async ({ page }) => {
                test.setTimeout(TEST_TIMEOUT_MS)
                test.info().annotations.push({
                    type: 'surface',
                    description: entry.surface,
                })
                test.info().annotations.push({
                    type: 'evidencePath',
                    description: entry.evidencePath,
                })

                if (skippedByFilter) {
                    recordOutcome({
                        surface: entry.surface,
                        state: entry.state,
                        viewport: entry.viewport,
                        evidencePath: entry.evidencePath,
                        status: 'skipped',
                        reason: `FUXIE_CAPTURE_ONLY filter excluded surface ${entry.surface}`,
                    })
                    test.skip(
                        true,
                        `FUXIE_CAPTURE_ONLY filter excluded surface ${entry.surface}`,
                    )
                    return
                }

                try {
                    // Req 9.4 — reduce motion for animation-prone states. Loading,
                    // success, and result frames all have animated entry; default
                    // / empty / error frames do not, so we narrow the call to
                    // those three states (the schema-notes.md §"`success`/`result`
                    // state capture timing" note explicitly calls out the
                    // emulateMedia step).
                    if (
                        entry.state === 'success' ||
                        entry.state === 'result'
                    ) {
                        await page.emulateMedia({ reducedMotion: 'reduce' })
                    }
                    // We additionally call it for `loading` per Req 9.4 even
                    // though no v1 manifest entry uses that state — kept for
                    // forward-compat when the manifest grows.
                    if ((entry.state as string) === 'loading') {
                        await page.emulateMedia({ reducedMotion: 'reduce' })
                    }

                    // Req 3.6 — state drivers. Returns the (possibly rewritten)
                    // route after side-effects are wired up.
                    const targetRoute = await applyStateDriver(page, entry)

                    // Req 3.3 + Req 3.10 — navigate with the 60s budget.
                    const navigation = await page.goto(targetRoute, {
                        timeout: TEST_TIMEOUT_MS,
                        waitUntil: 'load',
                    })
                    if (!navigation) {
                        throw structuredError(
                            entry,
                            `navigation returned no response for route=${targetRoute}`,
                        )
                    }

                    // Req 3.9 — single navigation guard. We assert the URL
                    // pathname matches the route; Playwright's `toHaveURL` accepts
                    // a regex when we need substring matching for query strings.
                    // We use a regex anchored to the path portion so query params
                    // appended by drivers don't break the assertion.
                    const expectedPathname = new URL(
                        targetRoute,
                        'http://placeholder.local',
                    ).pathname
                    await expect(page).toHaveURL(
                        new RegExp(
                            `${expectedPathname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
                        ),
                    )

                    // Wait for surface to render. `networkidle` works for static
                    // surfaces; for surfaces driven by routeIntercept the
                    // intercept short-circuits the network so idle is reached
                    // quickly. We cap the wait to keep the 60s budget.
                    await page
                        .waitForLoadState('networkidle', { timeout: 30_000 })
                        .catch(() => {
                            /* swallow — some surfaces keep long-poll connections;
                             * `load` already fired so the DOM is ready. */
                        })

                    // Req 3.7 — mkdir-p the evidence parent.
                    const absoluteOutPath = evidenceAbsolutePath(entry)
                    mkdirSync(path.dirname(absoluteOutPath), { recursive: true })

                    // Capture viewport-only PNG (fullPage: false) at absolute path.
                    await page.screenshot({
                        path: absoluteOutPath,
                        fullPage: false,
                        type: 'png',
                    })

                    recordOutcome({
                        surface: entry.surface,
                        state: entry.state,
                        viewport: entry.viewport,
                        evidencePath: entry.evidencePath,
                        status: 'passed',
                    })
                } catch (err) {
                    const reason =
                        err instanceof Error
                            ? err.message
                            : `non-Error throw: ${String(err)}`
                    recordOutcome({
                        surface: entry.surface,
                        state: entry.state,
                        viewport: entry.viewport,
                        evidencePath: entry.evidencePath,
                        status: 'failed',
                        reason,
                    })
                    // Re-throw with the structured token format so Playwright's
                    // own report and the JUnit reporter both carry the four
                    // tokens (Req 3.10).
                    throw structuredError(entry, reason)
                }
            })
        })
    }

    // Req 11.2 — write the run summary file. We always write so successful
    // runs leave an audit trail; the requirement only mandates the file on
    // non-zero exit but the cost is negligible.
    test.afterAll(async () => {
        try {
            mkdirSync(path.dirname(SUMMARY_PATH), { recursive: true })
            const grouped = {
                generatedAt: new Date().toISOString(),
                manifestPath: path.relative(WORKSPACE_ROOT, MANIFEST_PATH),
                totals: {
                    passed: summary.filter((s) => s.status === 'passed').length,
                    failed: summary.filter((s) => s.status === 'failed').length,
                    skipped: summary.filter((s) => s.status === 'skipped')
                        .length,
                },
                entries: summary,
            }
            writeFileSync(
                SUMMARY_PATH,
                JSON.stringify(grouped, null, 2),
                'utf8',
            )
        } catch (err) {
            // Best-effort — a write failure here must not mask a real test
            // failure. Surface as console warning only.
            // eslint-disable-next-line no-console
            console.warn(
                `[visual-capture] Failed to write summary file at ${SUMMARY_PATH}: ${
                    err instanceof Error ? err.message : String(err)
                }`,
            )
        }
    })
})
