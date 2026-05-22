/**
 * Playwright config for Fuxie integration / perf tests.
 *
 * Vai chinh: QA Automation Engineer
 * Vai phoi hop: Frontend Engineer, DevOps / Cloud Engineer
 *
 * Spec source-of-truth:
 *   - Task 18.1 (gamified-ui-asset-rollout) — CLS ≤0.05 across 3 runs and
 *     transferred bytes (mascot hero + world prop + UI frame) ≤350KB on
 *     each P0 surface, viewport 390×844, network throttling Slow 4G.
 *   - requirements.md Req 14.3 (CLS budget) and Req 18.3 (bytes budget).
 *
 * Conventions
 * -----------
 *   * Chromium-only — Slow 4G throttling and CLS measurement use CDP
 *     primitives (`Network.emulateNetworkConditions`, the layout-shift
 *     PerformanceObserver), so tests are pinned to Chromium.
 *   * Viewport `{ width: 390, height: 844 }` matches the iPhone 13/14
 *     logical mobile breakpoint defined in the spec glossary
 *     (First_Viewport_Mobile).
 *   * The dev server is expected at `BASE_URL` (default
 *     `http://localhost:3005` — `apps/web` `dev` script port). The
 *     `webServer` block boots `pnpm dev:web` automatically when
 *     `PLAYWRIGHT_AUTOSTART_WEB=1`; otherwise a developer must start
 *     `pnpm dev:web` manually beforehand.
 *   * The `globalSetup` script seeds a learner cookie via the
 *     `/api/dev-auth/login` endpoint (`FUXIE_DEV_AUTH_ENABLED=true`
 *     must be set on the dev server). The cookie is persisted to
 *     `tmp/playwright/learner-storage.json` and reused by every test
 *     via `use.storageState`.
 */

import { defineConfig, devices } from '@playwright/test'
import * as path from 'node:path'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3005'
const AUTOSTART_WEB = process.env.PLAYWRIGHT_AUTOSTART_WEB === '1'
// Resolve workspace-root-anchored artifact paths so Playwright writes to
// the gitignored `tmp/` folder regardless of which cwd the runner is
// invoked from.
const WORKSPACE_ROOT = path.resolve(__dirname, '..', '..')
const STORAGE_PATH = path.join(
    WORKSPACE_ROOT,
    'tmp',
    'playwright',
    'learner-storage.json',
)

export default defineConfig({
    testDir: '.',
    // Only run Playwright-flavoured specs from this directory. The
    // existing `a11y.spec.ts` (task 18.2) is a Vitest + JSDOM suite that
    // happens to live in the same folder; it must not be picked up by
    // the Playwright runner. Future Playwright suites should be named
    // either `perf.spec.ts`, `visual-capture.spec.ts`, or
    // `*.pw.spec.ts`.
    //
    // `visual-capture.spec.ts` is the spec
    // `visual-qa-screenshot-capture` capture run. It is bound to the
    // `chromium-mobile-capture` project (see `projects` below) by
    // `pnpm test:integration:capture` invoking Playwright with
    // `--project chromium-mobile-capture`. The perf project
    // (`chromium-mobile-slow4g`) is left untouched — Slow 4G
    // throttling must not run during capture (Req 5.4, Decision 4).
    testMatch: [
        '**/perf.spec.ts',
        '**/visual-capture.spec.ts',
        '**/*.pw.spec.ts',
    ],
    // Perf and a11y suites are intentionally serial — Slow 4G throttling
    // and CLS measurement are sensitive to host-machine contention.
    fullyParallel: false,
    workers: 1,
    forbidOnly: !!process.env.CI,
    // CLS measurement waits 5 s (Req 14.3) plus navigation/throttle slack;
    // 90 s per test gives headroom on slow CI hardware.
    timeout: 90_000,
    expect: { timeout: 15_000 },
    reporter: process.env.CI
        ? [['list'], ['junit', { outputFile: path.join(WORKSPACE_ROOT, 'tmp', 'playwright', 'junit.xml') }]]
        : 'list',
    outputDir: path.join(WORKSPACE_ROOT, 'tmp', 'playwright', 'output'),
    globalSetup: path.resolve(__dirname, 'global-setup.ts'),
    use: {
        baseURL: BASE_URL,
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        // Storage state is written by global-setup.
        storageState: STORAGE_PATH,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        actionTimeout: 15_000,
        navigationTimeout: 60_000,
    },
    projects: [
        {
            name: 'chromium-mobile-slow4g',
            use: {
                ...devices['Pixel 5'],
                viewport: { width: 390, height: 844 },
                deviceScaleFactor: 3,
                isMobile: true,
                hasTouch: true,
                storageState: STORAGE_PATH,
                // Slow 4G throttling is applied per test via CDP in
                // `tests/integration/utils/throttle.ts` because Playwright
                // does not expose CDP throttling in the project config.
            },
        },
        {
            // Capture project for spec
            // `visual-qa-screenshot-capture` (Decision 4).
            //
            // Two surgical opt-outs vs. `chromium-mobile-slow4g`:
            //
            //   1. Slow 4G throttling is NOT registered. Capture uses
            //      the default network speed (Req 5.4) so we never
            //      record a partial-render frame.
            //   2. `screenshot: 'off'` (Req 5.3) — the capture spec
            //      itself calls `page.screenshot({ path: <evidencePath> })`
            //      to write the PNG into
            //      `docs/design/visual-audit/qa-runs/2026-05-16/screenshots/`.
            //      Playwright must not also drop a debug screenshot
            //      into `outputDir`, otherwise
            //      `pnpm check:visual-audit` flags an orphan PNG.
            //
            // The viewport is the global mobile breakpoint
            // (390 × 844). Desktop captures (1440 × 1100) are set
            // per-test by the spec via `page.setViewportSize` based on
            // each manifest entry's `viewport` field.
            name: 'chromium-mobile-capture',
            use: {
                ...devices['Pixel 5'],
                viewport: { width: 390, height: 844 },
                deviceScaleFactor: 3,
                isMobile: true,
                hasTouch: true,
                storageState: STORAGE_PATH,
                screenshot: 'off',
            },
        },
    ],
    webServer: AUTOSTART_WEB
        ? {
              command: 'npx pnpm --filter @fuxie/web dev',
              url: BASE_URL,
              cwd: path.resolve(__dirname, '..', '..'),
              reuseExistingServer: !process.env.CI,
              timeout: 180_000,
              env: {
                  FUXIE_DEV_AUTH_ENABLED: 'true',
                  NODE_ENV: 'development',
              },
          }
        : undefined,
})
