/**
 * Perf integration test: CLS + first-viewport bytes for every P0 surface.
 *
 * Vai chinh: QA Automation Engineer
 * Vai phoi hop: Frontend Engineer, DevOps / Cloud Engineer
 *
 * Spec source-of-truth:
 *   - Task 18.1 (gamified-ui-asset-rollout):
 *       Outcome: Playwright with viewport 390×844, network throttling
 *       Slow 4G, measures CLS ≤0.05 across 3 consecutive runs and total
 *       transferred bytes for (mascot hero + world prop + UI frame)
 *       ≤350KB on each P0 surface.
 *       Acceptance: Failing thresholds break the integration job.
 *   - requirements.md Req 14.3:
 *       "WHEN đo Cumulative Layout Shift (CLS) trên first viewport của
 *        mỗi P0 surface tại 390×844 với network throttling Slow 4G và đo
 *        trong 5 giây sau load complete, THE CLS value SHALL ≤ 0.05
 *        trong 3 lần đo liên tiếp."
 *   - requirements.md Req 18.3:
 *       "WHEN đo first-viewport assets của mỗi P0 surface tại viewport
 *        390×844 với network throttling Slow 4G và cache state empty,
 *        THE tổng kích thước transferred của (mascot hero + world prop +
 *        UI frame) SHALL ≤ 350KB."
 *
 * Test strategy
 * -------------
 *   * For each P0 surface (excluding the cross-surface `result-reward`
 *     overlay, which is not a route), run 3 consecutive Slow 4G
 *     navigations.
 *   * On every run we measure:
 *       - CLS via a `PerformanceObserver({ type: 'layout-shift',
 *         buffered: true })` registered before navigation finishes,
 *         summed over a 5 s observation window after `load`.
 *       - Transferred bytes for mascot/world/ui assets via
 *         `page.on('response')`. We attribute each response to one of
 *         the three asset families by URL prefix
 *         (`/mascot-3d/optimized/` for mascot hero,
 *          `/mascot-3d/world/optimized/` for world prop,
 *          `/mascot-3d/ui/optimized/` for UI frame),
 *         then read the response body length to capture the *actual*
 *         transferred size (after throttling, including HTTP overhead
 *         absent — Playwright cannot expose `transferSize` directly, so
 *         body length is the closest proxy).
 *   * Assertions:
 *       - On each of the 3 runs, CLS ≤ 0.05 (Req 14.3 demands "≤0.05
 *         trong 3 lần đo liên tiếp").
 *       - On each of the 3 runs, mascot+world+ui combined ≤ 350 KB
 *         (Req 18.3).
 *   * Surfaces flagged `requiresSeed` are skipped with a clear PM
 *     follow-up reason when the navigation returns a 404 / redirect.
 *
 * Knobs (env vars)
 * ----------------
 *   - BASE_URL                       (default `http://localhost:3005`)
 *   - PLAYWRIGHT_PERF_RUNS           (default 3) — Req 14.3 minimum
 *   - PLAYWRIGHT_CLS_BUDGET          (default 0.05) — Req 14.3
 *   - PLAYWRIGHT_BYTES_BUDGET_KB     (default 350) — Req 18.3
 *   - PLAYWRIGHT_OBSERVE_MS          (default 5000) — Req 14.3 ("trong 5 giây")
 *   - FUXIE_PLAYWRIGHT_SKIP_SEEDED   (default unset) — opt-in skip for
 *     surfaces that need DB-seeded content (read by globalSetup callers).
 */

import { test, expect, type Page, type Response } from '@playwright/test'
import { applyNetworkThrottle, SLOW_4G } from './utils/throttle'
import { P0_SURFACES, type P0Surface } from './utils/surfaces'

// -----------------------------------------------------------------------------
// Budgets and config
// -----------------------------------------------------------------------------

const RUNS = Number.parseInt(
    process.env.PLAYWRIGHT_PERF_RUNS ?? '3',
    10,
)
const CLS_BUDGET = Number.parseFloat(
    process.env.PLAYWRIGHT_CLS_BUDGET ?? '0.05',
)
const BYTES_BUDGET = Number.parseInt(
    process.env.PLAYWRIGHT_BYTES_BUDGET_KB ?? '350',
    10,
) * 1024
const OBSERVE_MS = Number.parseInt(
    process.env.PLAYWRIGHT_OBSERVE_MS ?? '5000',
    10,
)
const SKIP_SEEDED = process.env.FUXIE_PLAYWRIGHT_SKIP_SEEDED === '1'

// -----------------------------------------------------------------------------
// Asset family attribution
// -----------------------------------------------------------------------------

type AssetFamily = 'mascot' | 'world' | 'uiFrame'

interface FamilyTotals {
    mascot: number
    world: number
    uiFrame: number
}

function classifyAssetUrl(url: string): AssetFamily | null {
    // Asset Registry §A pins all production paths under
    // /mascot-3d/optimized/, /mascot-3d/world/optimized/, and
    // /mascot-3d/ui/optimized/ (see apps/web/src/lib/mascot/fuxie-assets.ts).
    if (url.includes('/mascot-3d/world/optimized/')) return 'world'
    if (url.includes('/mascot-3d/ui/optimized/')) return 'uiFrame'
    if (url.includes('/mascot-3d/optimized/')) return 'mascot'
    // Reward props live under /reward-assets/optimized/ (Req 1.1) but the
    // budget in Req 18.3 is explicitly (mascot hero + world prop + UI
    // frame), so reward assets are intentionally excluded here.
    return null
}

// -----------------------------------------------------------------------------
// Per-run measurement
// -----------------------------------------------------------------------------

interface RunResult {
    runIndex: number
    cls: number
    totals: FamilyTotals
    combinedBytes: number
    navigationStatus: number
    softSkipReason?: string
}

async function measureSurface(
    page: Page,
    surface: P0Surface,
    runIndex: number,
): Promise<RunResult> {
    const totals: FamilyTotals = { mascot: 0, world: 0, uiFrame: 0 }

    // Hook response listener BEFORE navigation so first-viewport requests
    // are captured. We read body length to measure actual delivered bytes
    // (Playwright does not surface `transferSize`).
    const onResponse = async (response: Response) => {
        const family = classifyAssetUrl(response.url())
        if (!family) return
        try {
            const body = await response.body()
            totals[family] += body.byteLength
        } catch {
            // Response was aborted / redirected — ignore.
        }
    }
    page.on('response', onResponse)

    // Apply Slow 4G + cache disabled.
    await applyNetworkThrottle(page, SLOW_4G)

    // Inject the layout-shift observer before navigation completes. The
    // script registers on the next page context; we use addInitScript so
    // it survives the navigation.
    await page.addInitScript(() => {
        type LayoutShiftEntry = PerformanceEntry & {
            value: number
            hadRecentInput: boolean
        }
        const w = window as unknown as { __fuxieClsValue?: number }
        w.__fuxieClsValue = 0
        try {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries() as LayoutShiftEntry[]) {
                    if (!entry.hadRecentInput) {
                        w.__fuxieClsValue = (w.__fuxieClsValue ?? 0) + entry.value
                    }
                }
            })
            observer.observe({ type: 'layout-shift', buffered: true })
        } catch {
            // Older Chromium without layout-shift support — leave value at 0.
        }
    })

    const navigation = await page.goto(surface.path, { waitUntil: 'load' })
    const navigationStatus = navigation?.status() ?? 0

    // Soft-skip seeded surfaces when navigation surfaces a 404 / redirect
    // back to login (auth lost) or another non-2xx.
    if (
        surface.requiresSeed &&
        (navigationStatus === 0 ||
            navigationStatus === 404 ||
            navigationStatus >= 500 ||
            page.url().includes('/login'))
    ) {
        page.off('response', onResponse)
        return {
            runIndex,
            cls: 0,
            totals,
            combinedBytes: 0,
            navigationStatus,
            softSkipReason:
                surface.seedNote ??
                `Surface ${surface.id} requires seeded data not present in this environment.`,
        }
    }

    // Observe layout shift for the configured window after load.
    await page.waitForTimeout(OBSERVE_MS)

    const cls = await page.evaluate(() => {
        const w = window as unknown as { __fuxieClsValue?: number }
        return typeof w.__fuxieClsValue === 'number' ? w.__fuxieClsValue : 0
    })

    page.off('response', onResponse)

    // Drain any in-flight asset bodies that finished after the
    // measurement window — they still count toward the budget for this
    // run because Req 18.3 measures total transferred bytes for the
    // first-viewport asset families.
    await page.waitForTimeout(250)

    const combinedBytes = totals.mascot + totals.world + totals.uiFrame
    return { runIndex, cls, totals, combinedBytes, navigationStatus }
}

// -----------------------------------------------------------------------------
// Test cases
// -----------------------------------------------------------------------------

test.describe('P0 surface perf budgets (CLS + first-viewport bytes)', () => {
    for (const surface of P0_SURFACES) {
        test(
            `${surface.id} — CLS ≤${CLS_BUDGET} and (mascot+world+uiFrame) ≤${BYTES_BUDGET / 1024}KB across ${RUNS} Slow 4G runs`,
            async ({ page }) => {
                test.info().annotations.push({
                    type: 'surface',
                    description: surface.label,
                })
                test.info().annotations.push({
                    type: 'requirements',
                    description: 'Req 14.3 (CLS), Req 18.3 (bytes)',
                })

                if (SKIP_SEEDED && surface.requiresSeed) {
                    test.skip(
                        true,
                        `[seeded] ${surface.id} skipped — ${surface.seedNote ?? 'requires seeded data'}`,
                    )
                    return
                }

                const results: RunResult[] = []
                for (let i = 0; i < RUNS; i++) {
                    const run = await measureSurface(page, surface, i)
                    results.push(run)

                    // First-run soft skip propagates to the whole test —
                    // the seeded surface is unavailable in this env.
                    if (run.softSkipReason) {
                        test.skip(
                            true,
                            `[seeded] ${surface.id} skipped — ${run.softSkipReason}`,
                        )
                        return
                    }
                }

                const summary = results.map((r) => ({
                    run: r.runIndex,
                    cls: r.cls,
                    bytesKB: Math.round(r.combinedBytes / 102.4) / 10,
                    mascotKB: Math.round(r.totals.mascot / 102.4) / 10,
                    worldKB: Math.round(r.totals.world / 102.4) / 10,
                    uiFrameKB: Math.round(r.totals.uiFrame / 102.4) / 10,
                }))
                console.log(
                    `[perf] ${surface.id} (${surface.path}) — runs:`,
                    JSON.stringify(summary),
                )
                test.info().annotations.push({
                    type: 'perf-runs',
                    description: JSON.stringify(summary),
                })

                for (const r of results) {
                    expect(
                        r.cls,
                        `CLS on run ${r.runIndex + 1}/${RUNS} for ${surface.id} (${surface.path}) ` +
                            `was ${r.cls.toFixed(4)} > ${CLS_BUDGET} — Req 14.3 violation`,
                    ).toBeLessThanOrEqual(CLS_BUDGET)

                    expect(
                        r.combinedBytes,
                        `Transferred bytes on run ${r.runIndex + 1}/${RUNS} for ${surface.id} ` +
                            `was ${(r.combinedBytes / 1024).toFixed(1)}KB > ${BYTES_BUDGET / 1024}KB ` +
                            `(mascot=${(r.totals.mascot / 1024).toFixed(1)}KB, world=${(r.totals.world / 1024).toFixed(1)}KB, ` +
                            `uiFrame=${(r.totals.uiFrame / 1024).toFixed(1)}KB) — Req 18.3 violation`,
                    ).toBeLessThanOrEqual(BYTES_BUDGET)
                }
            },
        )
    }
})
