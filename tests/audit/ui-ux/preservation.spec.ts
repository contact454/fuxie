/**
 * preservation.spec.ts — Property 2: Preservation property tests.
 *
 * Vai chinh: QA Automation Engineer
 * Vai phoi hop: Frontend Engineer, Product Designer
 *
 * Spec source-of-truth:
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/bugfix.md § Unchanged Behavior
 *     3.1–3.7, § Property — Preservation Checking, § Introduction §
 *     Finding Schema.
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/design.md § Correctness
 *     Properties (Property 2), § Testing Strategy § Preservation
 *     Checking, § Fix Implementation item 7 (reference viewports).
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/tasks.md task 2.
 *   - tests/audit/ui-ux/preservation-baseline.md (the verbatim
 *     observation log — this file's assertions encode that log).
 *
 * Property under test
 * -------------------
 * **Property 2 — Preservation.** For every input X with
 * `NOT isBugCondition(X)` (compliant DOM at ≤ 480px, OR viewport
 * ≥ 768px, OR `ownedByOtherSpec(X)`), `auditPass'(X)` SHALL produce a
 * result that matches the unchanged-behavior contract from bugfix.md
 * § 3.1–3.7:
 *   (i)   compliant input at ≤ 480px              → 0 findings;
 *   (ii)  desktop viewport ∈ [768, 1920]          → no action:"fix";
 *   (iii) ownedByOtherSpec cluster                → action:"forward"
 *                                                   with the right
 *                                                   targetSpec;
 *   (iv)  existing test suite list                → identical
 *                                                   pass/fail to the
 *                                                   recorded
 *                                                   baseline.
 *
 * Why this test runs against UNFIXED code first (observation-first)
 * ------------------------------------------------------------------
 * Per the bugfix workflow's Preservation Checking step (design.md §
 * Testing Strategy § Preservation Checking), 2.A / 2.B / 2.D MUST
 * pass on the UNFIXED `auditPass` shim — this confirms the baselines
 * we are committing to preserve. After task 3.14 lands `auditPass'`
 * (exported as `auditPassPrime` from
 * `apps/web/audit/ui-ux/index.ts`), task 3.16 re-runs THIS file —
 * flipping the `auditPass` import below is the only change needed.
 *
 * 2.C is parked at `it.skip` because it tests forward routing, which
 * does not exist until task 3.13 lands `ownedByOtherSpec` mapping.
 * Tasks.md task 3.16 un-skips 2.C.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
 */

import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import { JSDOM, VirtualConsole } from 'jsdom'
import { spawnSync } from 'node:child_process'
import * as fs from 'node:fs'
import { createRequire } from 'node:module'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

// =============================================================================
// SECTION 1 — Local mirror of the Finding Schema and the unfixed
// `auditPass`. Kept structurally identical to
// `tests/audit/ui-ux/exploration.spec.ts` § Section 1–2 so flipping
// the import in task 3.16 is a one-line change and so this file stays
// independent of the not-yet-existing production module.
// =============================================================================

type DefectClass =
    | '1.1'
    | '1.2'
    | '1.3'
    | '1.4'
    | '1.5'
    | '1.6'
    | '1.7'
    | '1.8'
    | '1.9'

type Severity = 'P0' | 'P1' | 'P2'

type TargetSpec =
    | 'gamified-ui-asset-rollout'
    | 'learner-copy-localization-backfill'
    | 'visual-qa-screenshot-capture'
    | 'asset-registry-cleanup'

interface Finding {
    defectClass: DefectClass
    severity: Severity
    route: string
    component: string
    evidence: Record<string, unknown>
    expected: string
    screenshotPath: string
    forwardTo: TargetSpec | null
    action: 'fix' | 'forward'
    exempt?: 'user-content'
}

interface AuditInput {
    route: string
    component: string
    viewport: { width: number; height: number }
    renderedDom: Document
    window: Window & typeof globalThis
}

type AuditPass = (X: AuditInput) => Finding[]

/**
 * Current `auditPass` — modeled per design.md § Glossary entry
 * "auditPass". Returns `[]` for every input because no detector for
 * defect classes 1.1–1.9 exists in the current QA surface. Identical
 * shim to `tests/audit/ui-ux/exploration.spec.ts` § Section 2; task
 * 3.16 swaps both files to import `auditPassPrime`.
 */
const auditPass: AuditPass = (_X) => []

// =============================================================================
// SECTION 2 — Pinned reference viewports per design.md § Fix
// Implementation item 7 + bugfix.md § Introduction § Scope (In).
// =============================================================================

const MOBILE_VIEWPORTS = [
    { width: 360, height: 640 },
    { width: 375, height: 667 },
    { width: 414, height: 896 },
] as const

const DESKTOP_VIEWPORT_MIN_W = 768
const DESKTOP_VIEWPORT_MAX_W = 1920
const DESKTOP_VIEWPORT_MIN_H = 600
const DESKTOP_VIEWPORT_MAX_H = 1200

// =============================================================================
// SECTION 3 — Compliant token vocabularies. These mirror the canonical
// design tokens declared in apps/web/src/app/globals.css (Bright Sky
// palette + --text-*-size + --space-*) and the Tailwind theme used by
// (learn)/** routes. Keeping them inline avoids cross-module coupling
// while we are still in the bugfix-workflow's observation phase.
// =============================================================================

/**
 * 4px-multiple integers used as the canonical spacing baseline
 * (`bugfix.md` § 1.1, § 2.1). Generators draw from this set so every
 * synthesized fixture is, by construction, compliant with the spacing
 * baseline. The PBT 2.A assertion then becomes a pure existence test
 * over this finite vocabulary × the DOM-shape generator.
 */
const COMPLIANT_SPACING_PX = [0, 4, 8, 12, 16, 20, 24, 32, 40, 48] as const

/** Bright Sky background tokens that are valid on a Primary_CTA fill. */
const BRIGHT_SKY_BG_TOKENS = [
    'var(--fuxie-action)',
    'var(--fuxie-action-hover)',
    'var(--fuxie-blue-500)',
    'var(--fuxie-blue-600)',
] as const

/** Bright Sky tokens that may legitimately appear on chrome/cards. */
const BRIGHT_SKY_CHROME_TOKENS = [
    'var(--fuxie-blue-50)',
    'var(--fuxie-blue-100)',
    'var(--fuxie-blue-200)',
    'transparent',
] as const

/**
 * `--text-*-size` tokens declared in `apps/web/src/app/globals.css`
 * (`bugfix.md` § 1.2 condition (c) and § 2.2 (i)). The generator
 * picks heading vs body sizes from non-overlapping tiers so the
 * 1.125× / 200-weight ratio rule from § 2.2 (ii) is satisfied by
 * construction.
 */
const HEADING_TEXT_SIZE_TOKENS = [
    'var(--text-xl-size)',
    'var(--text-2xl-size)',
    'var(--text-3xl-size)',
] as const

const BODY_TEXT_SIZE_TOKENS = [
    'var(--text-sm-size)',
    'var(--text-base-size)',
] as const

/** Compliant `(learn)/*` routes used by the spec — bugfix.md § Scope (In). */
const COMPLIANT_LEARN_ROUTES = [
    'apps/web/src/app/(learn)/dashboard/page.tsx',
    'apps/web/src/app/(learn)/course/page.tsx',
    'apps/web/src/app/(learn)/reading/page.tsx',
    'apps/web/src/app/(learn)/listening/page.tsx',
    'apps/web/src/app/(learn)/writing/page.tsx',
    'apps/web/src/app/(learn)/speaking/page.tsx',
    'apps/web/src/app/(learn)/grammar/page.tsx',
    'apps/web/src/app/(learn)/vocabulary/page.tsx',
] as const

// =============================================================================
// SECTION 4 — JSDOM harness. Identical signature to
// `tests/audit/ui-ux/exploration.spec.ts` § Section 5 so a single
// import flip in task 3.16 swaps both files at once.
// =============================================================================

function buildAuditInput(args: {
    label: string
    route: string
    component: string
    viewport: { width: number; height: number }
    bodyHtml: string
}): AuditInput {
    const virtualConsole = new VirtualConsole()
    virtualConsole.on('jsdomError', () => undefined)
    const dom = new JSDOM(
        `<!doctype html><html><head><title>${args.label}</title></head><body>${args.bodyHtml}</body></html>`,
        {
            virtualConsole,
            pretendToBeVisual: true,
        },
    )
    Object.defineProperty(dom.window, 'innerWidth', {
        value: args.viewport.width,
        configurable: true,
    })
    Object.defineProperty(dom.window, 'innerHeight', {
        value: args.viewport.height,
        configurable: true,
    })
    return {
        route: args.route,
        component: args.component,
        viewport: { ...args.viewport },
        renderedDom: dom.window.document,
        window: dom.window as unknown as Window & typeof globalThis,
    }
}

// =============================================================================
// SECTION 5 — fast-check arbitraries.
// =============================================================================

const arbCompliantSpacing = fc.constantFrom(...COMPLIANT_SPACING_PX)

const arbBrightSkyBgToken = fc.constantFrom(...BRIGHT_SKY_BG_TOKENS)
const arbBrightSkyChromeToken = fc.constantFrom(...BRIGHT_SKY_CHROME_TOKENS)

const arbHeadingTextSize = fc.constantFrom(...HEADING_TEXT_SIZE_TOKENS)
const arbBodyTextSize = fc.constantFrom(...BODY_TEXT_SIZE_TOKENS)

const arbLearnRoute = fc.constantFrom(...COMPLIANT_LEARN_ROUTES)

const arbMobileViewport = fc.constantFrom(...MOBILE_VIEWPORTS)

const arbDesktopViewport = fc.record({
    width: fc.integer({ min: DESKTOP_VIEWPORT_MIN_W, max: DESKTOP_VIEWPORT_MAX_W }),
    height: fc.integer({ min: DESKTOP_VIEWPORT_MIN_H, max: DESKTOP_VIEWPORT_MAX_H }),
})

/**
 * Generator for **compliant** mobile DOMs (PBT 2.A).
 *
 * Each fixture renders a section that — by construction — satisfies
 * every rule from bugfix.md § 2.1, § 2.2, § 2.3, § 2.4, and § 2.6:
 *
 *   - Spacing values draw from `COMPLIANT_SPACING_PX` (4px multiples).
 *   - Heading vs body sizes draw from disjoint tier sets, so the
 *     1.125× ratio rule from § 2.2 (ii) is satisfied by construction.
 *   - All colors come from the Bright Sky token vocabulary; reward
 *     amber appears ONLY inside a `[data-reward-state="earned"]`
 *     wrapper so § 2.4 containment is satisfied.
 *   - No literal hex / rgb / named CSS color is emitted anywhere.
 */
interface CompliantMobileFixture {
    route: string
    viewport: { width: number; height: number }
    bodyHtml: string
}

const arbCompliantMobileFixture: fc.Arbitrary<CompliantMobileFixture> = fc
    .record({
        route: arbLearnRoute,
        viewport: arbMobileViewport,
        sectionPadding: arbCompliantSpacing,
        sectionGap: arbCompliantSpacing,
        ctaPaddingX: arbCompliantSpacing,
        ctaPaddingY: arbCompliantSpacing,
        ctaMarginTop: arbCompliantSpacing,
        chromeBg: arbBrightSkyChromeToken,
        ctaBg: arbBrightSkyBgToken,
        headingSize: arbHeadingTextSize,
        bodySize: arbBodyTextSize,
        includeReward: fc.boolean(),
        rewardChipPadding: arbCompliantSpacing,
    })
    .map((p) => {
        // CTA height is fixed at 44px to satisfy the 44×44 touch target
        // rule from `bugfix.md` § 2.10 row 1.1 P0; this is a constant
        // because compliance, not the touch target, is what PBT 2.A
        // exercises.
        const ctaHeightPx = 44
        const rewardSubtree = p.includeReward
            ? `
              <div
                data-reward-state="earned"
                style="padding: ${p.rewardChipPadding}px; gap: 4px; display: flex"
              >
                <span style="background: var(--fuxie-reward); padding: 4px 8px">
                  +10 Fucoin
                </span>
              </div>
            `
            : ''
        return {
            route: p.route,
            viewport: p.viewport,
            bodyHtml: `
              <main data-route="${p.route}">
                <section
                  data-fixture="compliant-2-a"
                  style="
                    background: ${p.chromeBg};
                    padding: ${p.sectionPadding}px;
                    gap: ${p.sectionGap}px;
                    display: flex;
                    flex-direction: column;
                  "
                >
                  <h2 style="font-size: ${p.headingSize}; font-weight: 700; margin: 0">
                    Tổng quan hôm nay
                  </h2>
                  <p style="font-size: ${p.bodySize}; font-weight: 400; margin: 0">
                    Bạn còn 2 hoạt động để hoàn thành mục tiêu hôm nay.
                  </p>
                  ${rewardSubtree}
                  <button
                    data-role="primary-cta"
                    style="
                      background: ${p.ctaBg};
                      color: white;
                      padding: ${p.ctaPaddingY}px ${p.ctaPaddingX}px;
                      margin-top: ${p.ctaMarginTop}px;
                      height: ${ctaHeightPx}px;
                    "
                  >
                    Tiếp tục học
                  </button>
                </section>
              </main>
            `,
        }
    })

/**
 * Generator for **arbitrary drift at desktop viewports** (PBT 2.B).
 *
 * Spacing, typography, and color are all chosen to deliberately VIOLATE
 * § 2.1–§ 2.3 (literal Npx, identical heading/body sizes, literal
 * hex). The point is: even with maximum drift, a desktop viewport must
 * short-circuit per design.md § Fix Implementation item 7 — no
 * `action: "fix"` Finding is allowed.
 */
interface DesktopDriftFixture {
    route: string
    viewport: { width: number; height: number }
    bodyHtml: string
}

const arbDesktopDriftFixture: fc.Arbitrary<DesktopDriftFixture> = fc
    .record({
        route: arbLearnRoute,
        viewport: arbDesktopViewport,
        kpiPadding: fc.integer({ min: 1, max: 47 }), // literal Npx, not 4px-multiple aligned
        // Literal hex, intentionally outside the Bright Sky token set.
        // We avoid #FFB703 ±5% so 1.4 (Reward containment) stays out of
        // scope — PBT 2.B is about non-reward drift only.
        bgHex: fc.constantFrom('#1da1f2', '#7e57c2', '#26a69a', '#ef5350'),
        // Heading and body share font-size and font-weight (1.2 drift).
        sharedFontSizePx: fc.integer({ min: 12, max: 18 }),
        sharedFontWeight: fc.constantFrom(400, 500, 600),
    })
    .map((p) => {
        return {
            route: p.route,
            viewport: p.viewport,
            bodyHtml: `
              <main data-route="${p.route}">
                <div
                  data-fixture="drift-1-1-desktop"
                  style="padding: ${p.kpiPadding}px; background: ${p.bgHex}"
                >
                  <p>Streak hôm nay</p>
                  <strong>7 ngày</strong>
                </div>
                <section data-fixture="drift-1-2-desktop">
                  <h2 style="font-size: ${p.sharedFontSizePx}px; font-weight: ${p.sharedFontWeight}">
                    Bài đọc số 1
                  </h2>
                  <p style="font-size: ${p.sharedFontSizePx}px; font-weight: ${p.sharedFontWeight}">
                    Đoạn văn này nói về một ngày của Anna ở Berlin.
                  </p>
                </section>
              </main>
            `,
        }
    })

// =============================================================================
// SECTION 6 — PBT 2.A. Compliant DOM at viewport ≤ 480px → 0 findings.
//
// **Validates: Requirements 3.6** (a component already on canonical
// Bright Sky tokens + correct Reward containment is not flagged).
// **Validates: Requirements 3.7** (a state already meeting the bar is
// not refactored).
// =============================================================================

describe('Property 2.A — Compliant mobile DOM at viewport ≤ 480px → auditPass returns []', () => {
    it('arbitrary compliant DOM at any of {360×640, 375×667, 414×896} produces zero findings', () => {
        fc.assert(
            fc.property(arbCompliantMobileFixture, (fixture) => {
                const X = buildAuditInput({
                    label: 'preservation-2-a',
                    route: fixture.route,
                    component: '[data-fixture="compliant-2-a"]',
                    viewport: fixture.viewport,
                    bodyHtml: fixture.bodyHtml,
                })

                const findings = auditPass(X)

                // Property 2 (i): compliant input at ≤ 480px → no
                // findings (bugfix.md § Property — Preservation
                // Checking, design.md § Correctness Properties P2).
                expect(findings).toEqual([])
            }),
            { numRuns: 100 },
        )
    })
})

// =============================================================================
// SECTION 7 — PBT 2.B. Desktop viewport regression guard. Arbitrary
// drift × viewport ∈ [768, 1920] → no `action: "fix"` finding.
//
// **Validates: Requirements 3.5** (viewport ≥ 768px short-circuit;
// existing desktop behavior preserved).
// =============================================================================

describe('Property 2.B — Desktop viewport regression guard: viewport ∈ [768, 1920] → no action:"fix"', () => {
    it('arbitrary drift × arbitrary desktop viewport produces no fix-action findings', () => {
        fc.assert(
            fc.property(arbDesktopDriftFixture, (fixture) => {
                const X = buildAuditInput({
                    label: 'preservation-2-b',
                    route: fixture.route,
                    component: '[data-fixture="drift-1-1-desktop"]',
                    viewport: fixture.viewport,
                    bodyHtml: fixture.bodyHtml,
                })

                const findings = auditPass(X)

                // Property 2 (ii): viewport ≥ 768px → no `action: "fix"`
                // (bugfix.md § 3.5, design.md § Fix Implementation item
                // 7). We keep `forward` Findings allowed on desktop in
                // principle (e.g. wording forwarded to
                // learner-copy-localization-backfill is route-scoped,
                // not viewport-scoped) — only `fix` is forbidden here.
                const fixFindings = findings.filter(
                    (f) => f.action === 'fix',
                )
                expect(fixFindings).toEqual([])
            }),
            { numRuns: 100 },
        )
    })
})

// =============================================================================
// SECTION 8 — PBT 2.C. Owned-by-other-spec scope → forward routing.
// PARKED at `it.skip` per tasks.md task 2 ("Mark as `it.skip` with a
// clear comment 'unblocks at task 3.x'"). Task 3.16 un-skips it after
// task 3.13 lands the forward router.
//
// **Validates: Requirements 3.1, 3.2, 3.3, 3.4** (scope-out inputs
// forwarded to the right targetSpec, never duplicated as fix
// recommendations).
// =============================================================================

interface ForwardCluster {
    label: string
    targetSpec: TargetSpec
    bodyHtml: string
}

/**
 * Four `ownedByOtherSpec` clusters per `bugfix.md` § Scope (Out):
 *   1) asset choice/position    → `gamified-ui-asset-rollout`
 *   2) wording/microcopy        → `learner-copy-localization-backfill`
 *   3) screenshot tooling       → `visual-qa-screenshot-capture`
 *   4) registry/filename hygiene → `asset-registry-cleanup`
 */
const FORWARD_CLUSTERS: ReadonlyArray<ForwardCluster> = [
    {
        label: 'asset-choice-position',
        targetSpec: 'gamified-ui-asset-rollout',
        bodyHtml: `
          <main data-route="apps/web/src/app/(learn)/campaign/page.tsx">
            <img
              data-cluster="asset-choice-position"
              src="/illustrations/mascot-hero.svg"
              width="375"
              height="360"
              alt=""
              style="width: 375px; height: 360px"
            />
          </main>
        `,
    },
    {
        label: 'wording-microcopy',
        targetSpec: 'learner-copy-localization-backfill',
        bodyHtml: `
          <main data-route="apps/web/src/app/(learn)/listening/page.tsx">
            <p
              data-cluster="wording-microcopy"
              style="
                max-width: max-content;
                min-width: 0;
                overflow-wrap: anywhere;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              "
            >
              Hôm nay bạn sẽ luyện kỹ năng nghe với một đoạn hội thoại dài về kế hoạch cuối tuần ở Berlin, bao gồm các chủ đề về di chuyển, ăn uống và các hoạt động ngoài trời cùng người bản xứ.
            </p>
          </main>
        `,
    },
    {
        label: 'screenshot-tooling',
        targetSpec: 'visual-qa-screenshot-capture',
        bodyHtml: `
          <main data-route="apps/web/src/app/(learn)/dashboard/page.tsx">
            <div
              data-cluster="screenshot-tooling"
              data-finding-source="visual-diff-pipeline"
            >
              <p>
                Visual diff pipeline reports a 12px regression vs golden,
                requiring an updated capture run.
              </p>
            </div>
          </main>
        `,
    },
    {
        label: 'registry-filename-hygiene',
        targetSpec: 'asset-registry-cleanup',
        bodyHtml: `
          <main data-route="apps/web/src/app/(learn)/badges/page.tsx">
            <img
              data-cluster="registry-filename-hygiene"
              src="/badges/Badge_Streak_3day_FINAL_v2.png"
              alt="Streak badge — 3 days"
            />
          </main>
        `,
    },
]

const arbForwardCluster = fc.constantFrom(...FORWARD_CLUSTERS)

describe('Property 2.C — Owned-by-other-spec scope → action:"forward" with correct targetSpec', () => {
    // Parked: unblocks at task 3.13 (forward routing) and is un-skipped
    // by task 3.16. Until then, `auditPass` has no router and the
    // assertion would always fail — which is not the bug we are
    // documenting in this preservation suite.
    it.skip('arbitrary ownedByOtherSpec cluster produces action:"forward" with the matching targetSpec — unblocks at task 3.13', () => {
        fc.assert(
            fc.property(
                arbForwardCluster,
                arbMobileViewport,
                (cluster, viewport) => {
                    const X = buildAuditInput({
                        label: `preservation-2-c-${cluster.label}`,
                        route: 'apps/web/src/app/(learn)/dashboard/page.tsx',
                        component: `[data-cluster="${cluster.label}"]`,
                        viewport,
                        bodyHtml: cluster.bodyHtml,
                    })

                    const findings = auditPass(X)

                    // Property 2 (iii): exactly one forward Finding
                    // with the matching targetSpec, and never an
                    // action:"fix" (bugfix.md § 3.1–3.4, design.md §
                    // Correctness Properties P2 (iii)).
                    expect(findings.length).toBeGreaterThanOrEqual(1)
                    for (const f of findings) {
                        expect(f.action).toBe('forward')
                        expect(f.forwardTo).toBe(cluster.targetSpec)
                    }
                },
            ),
            { numRuns: 50 },
        )
    })
})

// =============================================================================
// SECTION 9 — PBT 2.D. Existing test suite invariance.
//
// Non-PBT integration step per tasks.md task 2: re-run the existing
// test list named in tasks.md and assert identical pass/fail status to
// the recorded baseline in
// `tests/audit/ui-ux/preservation-baseline.md`. Implemented via
// `child_process.spawnSync` invoking vitest's binary on the targeted
// file list; `PRESERVATION_INTEGRATION_NESTED=1` is set on the child
// so the child run skips THIS describe block — preventing infinite
// recursion.
//
// **Validates: Requirements 3.6, 3.7** plus the implicit
// "existing-test-suite-invariance" clause in design.md §
// Preservation Requirements — Existing test surfaces.
// =============================================================================

interface BaselineExpectation {
    file: string
    expectedTests: number
}

/**
 * Mirrors `preservation-baseline.md` § A "Per-file baseline table"
 * verbatim. The runtime assertion checks each file individually so a
 * failure points at the exact regressing suite.
 */
const EXISTING_TEST_SUITE_BASELINE: ReadonlyArray<BaselineExpectation> = [
    { file: 'tests/reward-amber-containment.spec.tsx', expectedTests: 43 },
    { file: 'tests/p0-surface-render.spec.tsx', expectedTests: 18 },
    { file: 'tests/result-reward-loop.spec.tsx', expectedTests: 3 },
    { file: 'tests/review-display.spec.tsx', expectedTests: 9 },
    { file: 'tests/skill-motivation-layer.spec.tsx', expectedTests: 10 },
    { file: 'tests/vocabulary-card.spec.tsx', expectedTests: 6 },
    { file: 'tests/ui-primitives.spec.tsx', expectedTests: 34 },
    { file: 'tests/mascot-role.spec.tsx', expectedTests: 11 },
    // Tasks.md spells this `tests/asset-discipline.spec.tsx`; the
    // file on disk is `.spec.ts` (renamed when its render helpers
    // moved to a non-JSX module). preservation-baseline.md § A
    // documents the rename and pins the on-disk filename here.
    { file: 'tests/asset-discipline.spec.ts', expectedTests: 13 },
    { file: 'tests/course-path.spec.tsx', expectedTests: 5 },
    { file: 'tests/locale-parity.spec.ts', expectedTests: 21 },
]

const EXPECTED_TOTAL_FILES = EXISTING_TEST_SUITE_BASELINE.length // 11
const EXPECTED_TOTAL_TESTS = EXISTING_TEST_SUITE_BASELINE.reduce(
    (sum, b) => sum + b.expectedTests,
    0,
) // 173

const NESTED_GUARD_ENV = 'PRESERVATION_INTEGRATION_NESTED'

/**
 * Resolve the workspace root via `__dirname` when the spec is loaded
 * as CJS (the default for vitest 3.x with this property config) and
 * fall back to `import.meta.url` when esbuild emits ESM. Either way,
 * we land at the repo root that holds `package.json`.
 */
const here =
    typeof __dirname === 'string'
        ? __dirname
        : path.dirname(fileURLToPath(import.meta.url))

const repoRoot = path.resolve(here, '../../..')

/**
 * `require.resolve` is not available on the ESM `import.meta`-only
 * path; `createRequire` gives us a working CJS resolver no matter
 * which module system esbuild settles on.
 */
const requireFromHere = createRequire(
    typeof __filename === 'string'
        ? __filename
        : fileURLToPath(import.meta.url),
)

function existsAt(rel: string): boolean {
    return fs.existsSync(path.resolve(repoRoot, rel))
}

describe('Property 2.D — Existing test suite invariance (re-run + assert identical pass/fail)', () => {
    if (process.env[NESTED_GUARD_ENV] === '1') {
        // The CHILD vitest invocation re-imports this spec because
        // the property config glob matches `tests/**/*.spec.{ts,tsx}`.
        // Skip the integration step in the nested run; the child only
        // exercises 2.A / 2.B / 2.C, which is what we want.
        it.skip('skipping integration re-run inside nested child process', () => {
            /* nested guard */
        })
        return
    }

    it('all baseline files are present on disk (sentinel against accidental rename / delete)', () => {
        for (const b of EXISTING_TEST_SUITE_BASELINE) {
            expect(existsAt(b.file), `baseline file missing: ${b.file}`).toBe(true)
        }
    })

    it(
        're-running the baseline test list reproduces 11 files / 173 tests / 0 failures',
        { timeout: 5 * 60 * 1000 },
        () => {
            const targetedFiles = EXISTING_TEST_SUITE_BASELINE.map((b) => b.file)

            // Spawn vitest in a child process with the SAME config so
            // the run mirrors the baseline command captured in
            // `preservation-baseline.md` § A.
            const result = spawnSync(
                process.execPath,
                [
                    requireFromHere.resolve('vitest/dist/cli.js'),
                    'run',
                    '--config',
                    'vitest.property.config.ts',
                    '--reporter=json',
                    ...targetedFiles,
                ],
                {
                    cwd: repoRoot,
                    env: {
                        ...process.env,
                        [NESTED_GUARD_ENV]: '1',
                        // Force color off so JSON parsing is not
                        // confused by ANSI escapes if reporter mode
                        // changes.
                        FORCE_COLOR: '0',
                    },
                    encoding: 'utf-8',
                    timeout: 5 * 60 * 1000,
                    maxBuffer: 64 * 1024 * 1024,
                },
            )

            const stdout = result.stdout ?? ''
            const stderr = result.stderr ?? ''

            // Parse the JSON reporter output first if possible to extract rich failure info.
            const jsonStart = stdout.indexOf('{')
            let parsedJson: any = null
            if (jsonStart >= 0) {
                try {
                    parsedJson = JSON.parse(stdout.slice(jsonStart))
                } catch (e) {
                    // Ignore parse error initially
                }
            }

            if (result.status !== 0) {
                let failureSummary = ''
                if (parsedJson && parsedJson.testResults) {
                    const failures: string[] = []
                    for (const suite of parsedJson.testResults) {
                        for (const assertion of suite.assertionResults) {
                            if (assertion.status === 'failed') {
                                failures.push(
                                    `Suite: ${suite.name}\nTest: ${assertion.title}\nMessages:\n${(assertion.failureMessages || []).join('\n')}`
                                )
                            }
                        }
                    }
                    failureSummary = `Failed tests:\n${failures.join('\n\n')}`
                } else {
                    failureSummary = `Could not parse JSON report. Raw stdout:\n${stdout.slice(-4000)}\nRaw stderr:\n${stderr}`
                }
                console.error(`[DEBUG CHILD FAILURES] Vitest child process failed with status ${result.status}.\n${failureSummary}`)
            }

            // First line of defense: vitest exit code. Anything other
            // than 0 means at least one suite regressed.
            expect(
                result.status,
                `vitest exited with status=${result.status}. Detailed failures printed to console.error above.`,
            ).toBe(0)

            expect(
                jsonStart,
                `vitest JSON reporter output not found in stdout:\n${stdout.slice(0, 1000)}`,
            ).toBeGreaterThanOrEqual(0)

            interface VitestJsonReport {
                numTotalTestSuites: number
                numPassedTestSuites: number
                numFailedTestSuites: number
                numTotalTests: number
                numPassedTests: number
                numFailedTests: number
                testResults?: Array<{
                    name: string
                    assertionResults: Array<{ status: string }>
                }>
            }

            let parsed: VitestJsonReport
            try {
                parsed = JSON.parse(stdout.slice(jsonStart)) as VitestJsonReport
            } catch (err) {
                throw new Error(
                    `failed to parse vitest JSON report: ${(err as Error).message}\n${stdout.slice(jsonStart, jsonStart + 2000)}`,
                )
            }

            // Aggregate-level invariants. Vitest's JSON reporter
            // exposes `numTotalTestSuites` as the count of `describe`
            // blocks (not files) — so we count file-level entries via
            // `testResults.length`. `numTotalTests` is per-`it`.
            const fileEntries = parsed.testResults ?? []
            expect(parsed.numFailedTests, 'numFailedTests must be 0').toBe(0)
            expect(parsed.numFailedTestSuites, 'numFailedTestSuites must be 0').toBe(0)
            expect(
                fileEntries.length,
                `expected ${EXPECTED_TOTAL_FILES} files in JSON report, observed ${fileEntries.length}`,
            ).toBe(EXPECTED_TOTAL_FILES)
            expect(parsed.numTotalTests).toBe(EXPECTED_TOTAL_TESTS)
            expect(parsed.numPassedTests).toBe(EXPECTED_TOTAL_TESTS)

            // Per-file invariants. Each baseline file must appear in
            // the report and report at least its expected test count.
            // (We use `>=` rather than `===` so adding new tests to a
            // baseline suite is a green change — only DROPPING tests
            // or introducing failures is a regression.)
            const byBasename = new Map<string, number>()
            for (const r of fileEntries) {
                // r.name is an absolute path. Vitest normalizes
                // separators differently across platforms, so compare
                // forward-slash form.
                const norm = r.name.replace(/\\/g, '/')
                byBasename.set(norm, r.assertionResults.length)
            }
            for (const b of EXISTING_TEST_SUITE_BASELINE) {
                const fullPath = `${repoRoot.replace(/\\/g, '/')}/${b.file}`
                const observed = byBasename.get(fullPath)
                expect(
                    observed,
                    `baseline file ${b.file} not present in vitest JSON report (looked up "${fullPath}"). Available keys: ${Array.from(byBasename.keys()).join(', ')}`,
                ).not.toBeUndefined()
                expect(
                    observed,
                    `baseline file ${b.file} expected ≥ ${b.expectedTests} tests, observed ${observed}`,
                ).toBeGreaterThanOrEqual(b.expectedTests)
            }
        },
    )
})
