/**
 * exploration.spec.ts — Property 1: Bug Condition exploration test.
 *
 * Vai chinh: QA Automation Engineer
 * Vai phoi hop: Frontend Engineer, Product Designer
 *
 * Spec source-of-truth:
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/bugfix.md § Bug Analysis (1.1–1.9),
 *     § Expected Behavior (2.1–2.11), § Introduction § Finding Schema.
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/design.md § Bug Details § Bug
 *     Condition, § Hypothesized Root Cause, § Testing Strategy.
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/tasks.md task 1.
 *
 * Property under test
 * -------------------
 * **Property 1 — Bug Condition.** For every input X that satisfies
 * `isBugCondition(X)` (i.e. route ∈ apps/web/src/app/(learn)/**, viewport
 * ≤ 480px, X falls under at least one of defect classes 1.1–1.9, and X
 * is NOT `ownedByOtherSpec`), `auditPass(X)` SHALL emit exactly one
 * Finding conforming to the unified Finding Schema declared in
 * bugfix.md § Introduction § Finding Schema, with the severity assigned
 * by table § 2.10 and evidence shaped by § 2.11.
 *
 * Why this test must FAIL on unfixed code
 * ---------------------------------------
 * The current QA pass — modeled here by the local `auditPass` shim —
 * has detectors only for class 1.4 (via tests/reward-amber-containment
 * .spec.tsx) and partial 1.7 coverage (via tests/p0-surface-render
 * .spec.tsx); even those existing tests do NOT publish a unified
 * `Finding[]` JSON conforming to bugfix.md § Introduction's schema.
 * Classes 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 1.9 have no detector at all.
 * Therefore for every fixture below, the unfixed `auditPass` returns
 * `[]`, and the strict assertion "emit exactly one schema-valid
 * Finding" fails. That failure is the **success case** for the bugfix
 * workflow's exploration step (design.md § Testing Strategy §
 * Exploratory Bug Condition Checking) — it produces the
 * counterexamples documented in tests/audit/ui-ux/exploration-findings
 * .md and confirms root-cause hypotheses 1, 2, 3, 4, 5, 6, 7 from
 * design.md § Hypothesized Root Cause.
 *
 * After task 3 lands `auditPass'` (which `apps/web/audit/ui-ux/index.ts`
 * will export as `auditPassPrime` per task 3.14), this same file is
 * re-run by task 3.15. Flipping the `auditPass` import below to the
 * real entrypoint is the only change needed; the assertions encode
 * the post-fix expected behavior verbatim.
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9
 *            (mirrored as expected behavior 2.1, 2.2, 2.3, 2.4, 2.5,
 *            2.6, 2.7, 2.8, 2.9, 2.10, 2.11)
 */

import { describe, expect, it } from 'vitest'
import { JSDOM, VirtualConsole } from 'jsdom'

// =============================================================================
// SECTION 1 — Unified Finding Schema (bugfix.md § Introduction § Finding
// Schema). The validator stays inside this test file so it is independent
// of the production module (task 3.1 will export an authoritative
// `validateFinding` from `apps/web/audit/ui-ux/finding-validator.ts`; this
// local copy intentionally mirrors that contract so the test passes
// against the production validator post-fix without semantic drift.)
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

interface SchemaCheck {
    valid: boolean
    /**
     * Reasons the candidate fails the unified schema. Empty when the
     * candidate is a fully-shaped Finding. Used by the per-fixture
     * counterexample assertion to surface a precise gap-vs-schema
     * message into the test report.
     */
    gaps: string[]
}

const ALLOWED_DEFECT_CLASSES: ReadonlyArray<DefectClass> = [
    '1.1',
    '1.2',
    '1.3',
    '1.4',
    '1.5',
    '1.6',
    '1.7',
    '1.8',
    '1.9',
]

const ALLOWED_SEVERITIES: ReadonlyArray<Severity> = ['P0', 'P1', 'P2']

const ALLOWED_TARGET_SPECS: ReadonlyArray<TargetSpec> = [
    'gamified-ui-asset-rollout',
    'learner-copy-localization-backfill',
    'visual-qa-screenshot-capture',
    'asset-registry-cleanup',
]

/**
 * Class-specific evidence shape per bugfix.md § 2.11. The check is
 * intentionally narrow — it asserts that the keys required by the
 * class's evidence contract are present and non-null. Task 3.1 will
 * land the full Zod / Valibot schema; this local mirror keeps the
 * exploration test self-contained.
 */
const EVIDENCE_KEY_REQUIREMENTS: Record<DefectClass, ReadonlyArray<string>> = {
    '1.1': ['property', 'computedValue', 'expectedToken'],
    '1.2': ['fontSize', 'fontWeight', 'expectedTokenSet'],
    '1.3': ['literal', 'nearestToken', 'deltaE'],
    '1.4': ['nodeSelector', 'ancestorChain', 'computedColorHex'],
    '1.5': ['kind', 'firstSelector', 'secondSelector', 'driftPx'],
    // Paired evidence — bugfix.md § 2.6 (iii). Two routes, two
    // selectors, two computed-style snapshots, two screenshots.
    '1.6': [
        'routeA',
        'routeB',
        'selectorA',
        'selectorB',
        'computedStyleA',
        'computedStyleB',
        'screenshotA',
        'screenshotB',
    ],
    '1.7': ['stateKind', 'missingComponents', 'exposesStackTrace'],
    '1.8': ['containerSelector', 'overflowKind', 'syntheticString'],
    '1.9': [
        'assetSelector',
        'assetAreaPx2',
        'primaryCtaAreaPx2',
        'aboveTheFoldShare',
        'pushesCtaBelowFold',
    ],
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function validateFinding(candidate: unknown): SchemaCheck {
    const gaps: string[] = []

    if (!isPlainObject(candidate)) {
        return {
            valid: false,
            gaps: [
                'candidate is not an object (Finding Schema requires JSON object)',
            ],
        }
    }

    // Generic fields per bugfix.md § Introduction § Finding Schema.
    const requireString = (k: string) => {
        const v = candidate[k]
        if (typeof v !== 'string' || v.length === 0) {
            gaps.push(`missing or empty field: ${k}`)
        }
    }

    requireString('route')
    requireString('component')
    requireString('expected')
    requireString('screenshotPath')

    const defectClass = candidate.defectClass
    if (
        typeof defectClass !== 'string' ||
        !ALLOWED_DEFECT_CLASSES.includes(defectClass as DefectClass)
    ) {
        gaps.push(
            `invalid defectClass (got ${JSON.stringify(defectClass)}; expected one of ${ALLOWED_DEFECT_CLASSES.join(', ')})`,
        )
    }

    const severity = candidate.severity
    if (
        typeof severity !== 'string' ||
        !ALLOWED_SEVERITIES.includes(severity as Severity)
    ) {
        gaps.push(
            `invalid severity (got ${JSON.stringify(severity)}; expected one of ${ALLOWED_SEVERITIES.join(', ')})`,
        )
    }

    const action = candidate.action
    if (action !== 'fix' && action !== 'forward') {
        gaps.push(
            `invalid action (got ${JSON.stringify(action)}; expected "fix" or "forward")`,
        )
    }

    const forwardTo = candidate.forwardTo
    if (
        forwardTo !== null &&
        !(
            typeof forwardTo === 'string' &&
            ALLOWED_TARGET_SPECS.includes(forwardTo as TargetSpec)
        )
    ) {
        gaps.push(
            `invalid forwardTo (got ${JSON.stringify(forwardTo)}; expected null or one of ${ALLOWED_TARGET_SPECS.join(', ')})`,
        )
    }

    // forward routing coherence: action="forward" ⇒ forwardTo non-null.
    if (action === 'forward' && (forwardTo === null || forwardTo === undefined)) {
        gaps.push('action="forward" requires non-null forwardTo')
    }

    // Class-specific evidence (bugfix.md § 2.11).
    const evidence = candidate.evidence
    if (!isPlainObject(evidence)) {
        gaps.push('evidence missing or not an object')
    } else if (
        typeof defectClass === 'string' &&
        ALLOWED_DEFECT_CLASSES.includes(defectClass as DefectClass)
    ) {
        const required = EVIDENCE_KEY_REQUIREMENTS[defectClass as DefectClass]
        for (const k of required) {
            if (!(k in evidence) || evidence[k] === undefined || evidence[k] === null) {
                gaps.push(`evidence missing required key for ${defectClass}: ${k}`)
            }
        }
    }

    // Auto-P0 invariants per bugfix.md § 2.4 and § 2.7.
    if (
        defectClass === '1.4' &&
        candidate.exempt !== 'user-content' &&
        severity !== 'P0'
    ) {
        gaps.push(
            'defectClass=1.4 non-exempt MUST have severity=P0 (bugfix.md § 2.4 ii)',
        )
    }
    if (
        defectClass === '1.7' &&
        isPlainObject(evidence) &&
        evidence.exposesStackTrace === true &&
        severity !== 'P0'
    ) {
        gaps.push(
            'defectClass=1.7 with exposesStackTrace MUST have severity=P0 (bugfix.md § 2.7 iii)',
        )
    }

    return { valid: gaps.length === 0, gaps }
}

// =============================================================================
// SECTION 2 — `auditPass` shim representing the CURRENT (unfixed) QA pass.
//
// design.md § Hypothesized Root Cause documents that the current QA pass
// is a scattered set of test/lint surfaces (`reward-amber-containment
// .spec.tsx`, `p0-surface-render.spec.tsx`, …), none of which publish a
// unified `Finding[]` JSON for any of the 9 defect classes. This shim
// models that observation: it returns `[]` for every input. Task 3.14
// replaces the body with the real `auditPassPrime` (composing 9
// detectors + schema validator + severity mapping + forward router +
// CI gate). Flipping the import below is the only change task 3.15
// requires.
// =============================================================================

interface AuditInput {
    route: string
    component: string
    viewport: { width: number; height: number }
    /** JSDOM document representing the rendered UI for X. */
    renderedDom: Document
    /** Window providing `getComputedStyle` for the rendered DOM. */
    window: Window & typeof globalThis
}

type AuditPass = (X: AuditInput) => Finding[]

/**
 * Current `auditPass` — modeled per design.md § Glossary entry
 * "auditPass". Returns `[]` for every input because no detector for
 * defect classes 1.1–1.9 exists in the current QA surface. The
 * runtime contract for `tests/reward-amber-containment.spec.tsx` is
 * preserved by that suite directly; it is NOT the unified Finding[]
 * contract this property requires.
 */
const auditPass: AuditPass = (_X) => []

// =============================================================================
// SECTION 3 — Reference viewports (design.md § Fix Implementation item 7)
// =============================================================================

const VIEWPORT_360x640 = { width: 360, height: 640 } as const
const VIEWPORT_375x667 = { width: 375, height: 667 } as const
const VIEWPORT_414x896 = { width: 414, height: 896 } as const

// =============================================================================
// SECTION 4 — Fixture builders. Each fixture renders the minimum DOM that
// (a) satisfies `isBugCondition(X)` per design.md § Bug Details § Bug
// Condition, (b) maps to exactly one defect class 1.1–1.9. Routes are
// pinned under apps/web/src/app/(learn)/** so they fall inside the
// audit's mobile scope.
// =============================================================================

interface FixtureSpec {
    label: string
    defectClass: DefectClass
    expectedSeverity: Severity
    route: string
    component: string
    viewport: { width: number; height: number }
    /**
     * Returns the body innerHTML for the fixture. The harness wraps it
     * in a JSDOM document sized to the pinned viewport.
     */
    html: string
    /** Free-text description of the bug condition this fixture exercises. */
    bugConditionDescription: string
    /**
     * The Finding Schema fields a correct `auditPass'(X)` would emit.
     * Used in the failure message so reviewers can see exactly what
     * the unfixed pass is missing.
     */
    expectedFindingSketch: {
        expected: string
        evidenceKeys: ReadonlyArray<string>
        forwardTo: TargetSpec | null
        action: 'fix' | 'forward'
    }
}

const FIXTURES: ReadonlyArray<FixtureSpec> = [
    // ----- 1.1 Inconsistent spacing vs 4px/8px baseline (P1) ------------------
    {
        label: 'fixture-1.1 / KPI card padding 14px (literal, not 4px multiple, no --space token)',
        defectClass: '1.1',
        expectedSeverity: 'P1',
        route: 'apps/web/src/app/(learn)/dashboard/page.tsx',
        component: '[data-fixture="kpi-card-1-1"]',
        viewport: VIEWPORT_360x640,
        html: `
            <main data-route="(learn)/dashboard">
              <div data-fixture="kpi-card-1-1" style="padding:14px;background:#E0F2FE">
                <p>Streak hôm nay</p>
                <strong>7 ngày</strong>
              </div>
            </main>
        `,
        bugConditionDescription:
            'padding: 14px is a literal Npx outside the 4px multiple set and outside --space-* tokens (bugfix.md § 1.1 conditions 1 and 3).',
        expectedFindingSketch: {
            expected: 'padding ∈ multiple of 4px ±1px OR --space-* token',
            evidenceKeys: ['property', 'computedValue', 'expectedToken'],
            forwardTo: null,
            action: 'fix',
        },
    },

    // ----- 1.2 Unclear typography hierarchy (P1) -----------------------------
    {
        label: 'fixture-1.2 / heading and body share font-size 16px and font-weight 600',
        defectClass: '1.2',
        expectedSeverity: 'P1',
        route: 'apps/web/src/app/(learn)/reading/page.tsx',
        component: '[data-fixture="hierarchy-1-2"]',
        viewport: VIEWPORT_375x667,
        html: `
            <main data-route="(learn)/reading">
              <section data-fixture="hierarchy-1-2">
                <h2 style="font-size:16px;font-weight:600">Bài đọc số 1</h2>
                <p style="font-size:16px;font-weight:600">
                  Đoạn văn này nói về một ngày của Anna ở Berlin.
                </p>
              </section>
            </main>
        `,
        bugConditionDescription:
            'Heading and body in the same semantic block share font-size 16px and font-weight 600 — ratio 1.0× (< 1.125×) and weight delta 0 (< 200) (bugfix.md § 1.2 condition (a)).',
        expectedFindingSketch: {
            expected:
                'font-size ratio ≥ 1.125× OR font-weight delta ≥ 200 between adjacent semantic ranks; sizes ∈ --text-*-size token set',
            evidenceKeys: ['fontSize', 'fontWeight', 'expectedTokenSet'],
            forwardTo: null,
            action: 'fix',
        },
    },

    // ----- 1.3 Off-token color (P1) ------------------------------------------
    {
        label: 'fixture-1.3 / button with literal hex #1da1f2 outside Bright Sky tokens',
        defectClass: '1.3',
        expectedSeverity: 'P1',
        route: 'apps/web/src/app/(learn)/listening/page.tsx',
        component: '[data-fixture="off-token-1-3"]',
        viewport: VIEWPORT_414x896,
        html: `
            <main data-route="(learn)/listening">
              <button
                data-fixture="off-token-1-3"
                data-role="primary-cta"
                style="background:#1da1f2;color:white;padding:12px 16px"
              >
                Nghe lại
              </button>
            </main>
        `,
        bugConditionDescription:
            'Inline style uses literal hex #1da1f2 outside the Bright Sky --fuxie-action token set (bugfix.md § 1.3 condition 1).',
        expectedFindingSketch: {
            expected:
                'background-color via --fuxie-action / --fuxie-blue-* token; no literal hex/rgb/named color',
            evidenceKeys: ['literal', 'nearestToken', 'deltaE'],
            forwardTo: null,
            action: 'fix',
        },
    },

    // ----- 1.4 Reward Amber containment (auto-P0) ----------------------------
    {
        label: 'fixture-1.4 / Reward Amber #FFB703 outside Reward_State subtree',
        defectClass: '1.4',
        expectedSeverity: 'P0',
        route: 'apps/web/src/app/(learn)/dashboard/page.tsx',
        component: '[data-fixture="reward-leak-1-4"]',
        viewport: VIEWPORT_360x640,
        html: `
            <main data-route="(learn)/dashboard">
              <button
                data-fixture="reward-leak-1-4"
                style="background:#FFB703;color:#1f2937;padding:12px 16px"
              >
                Tiếp tục
              </button>
            </main>
        `,
        bugConditionDescription:
            'Button background ΔE2000 < 5.0 vs #FFB703, no ancestor matches [data-reward-state="preview|earned|receipt"] or [data-reward-context="true"] (bugfix.md § 1.4).',
        expectedFindingSketch: {
            expected:
                'Reward Amber renders ONLY inside Reward_State subtree (preview|earned|receipt) or [data-reward-context="true"]',
            evidenceKeys: ['nodeSelector', 'ancestorChain', 'computedColorHex'],
            forwardTo: 'gamified-ui-asset-rollout',
            action: 'forward',
        },
    },

    // ----- 1.5 Alignment / CTA overflow container by 4px (P0) ----------------
    {
        label: 'fixture-1.5 / primary CTA overlaps container right edge by 4px',
        defectClass: '1.5',
        expectedSeverity: 'P0',
        route: 'apps/web/src/app/(learn)/writing/page.tsx',
        component: '[data-fixture="cta-overflow-1-5"]',
        viewport: VIEWPORT_375x667,
        html: `
            <main data-route="(learn)/writing">
              <div data-container="form" style="position:relative;width:300px;padding:16px;border:1px solid #cbd5e1">
                <button
                  data-fixture="cta-overflow-1-5"
                  data-role="primary-cta"
                  style="position:absolute;left:16px;width:288px;height:44px;background:#0284c7;color:white"
                >
                  Gửi bài
                </button>
              </div>
            </main>
        `,
        bugConditionDescription:
            'Primary CTA at left:16px width:288px → right edge 304px overflows container right edge 300px by 4px (bugfix.md § 1.5 (d)).',
        expectedFindingSketch: {
            expected:
                'CTA bounding rect fully inside content container and safe-area padding (overlap = 0px)',
            evidenceKeys: ['kind', 'firstSelector', 'secondSelector', 'driftPx'],
            forwardTo: null,
            action: 'fix',
        },
    },

    // ----- 1.6 Component pattern paired drift (P1) ---------------------------
    {
        label: 'fixture-1.6 / KPI cards with p-3 vs p-4 across two routes, no state-attribute',
        defectClass: '1.6',
        expectedSeverity: 'P1',
        route: 'apps/web/src/app/(learn)/dashboard/page.tsx + apps/web/src/app/(learn)/course/page.tsx',
        component: '[data-fixture="kpi-pair-1-6"]',
        viewport: VIEWPORT_360x640,
        html: `
            <main data-route="(learn)/dashboard">
              <div data-fixture="kpi-pair-1-6" data-pair="A" data-route-tag="(learn)/dashboard">
                <article class="kpi-card" style="padding:12px;background:#E0F2FE">
                  <p>Streak</p><strong>7</strong>
                </article>
              </div>
            </main>
            <main data-route="(learn)/course">
              <div data-fixture="kpi-pair-1-6" data-pair="B" data-route-tag="(learn)/course">
                <article class="kpi-card" style="padding:16px;background:#E0F2FE">
                  <p>XP</p><strong>120</strong>
                </article>
              </div>
            </main>
        `,
        bugConditionDescription:
            'Two .kpi-card instances (same className root) on two different (learn)/* routes render with computed padding 12px vs 16px and carry no data-variant / aria-disabled / data-loading / data-selected to explain the diff (bugfix.md § 1.6 — canonical counterexample).',
        expectedFindingSketch: {
            expected:
                'Two instances of the same component pattern render with identical padding-* values, OR carry a state-attribute that explains the diff (bugfix.md § 2.6 i, ii)',
            evidenceKeys: [
                'routeA',
                'routeB',
                'selectorA',
                'selectorB',
                'computedStyleA',
                'computedStyleB',
                'screenshotA',
                'screenshotB',
            ],
            forwardTo: null,
            action: 'fix',
        },
    },

    // ----- 1.7 Error state exposes stack (auto-P0) ---------------------------
    {
        label: 'fixture-1.7 / error.tsx renders <pre>{stack}</pre>',
        defectClass: '1.7',
        expectedSeverity: 'P0',
        route: 'apps/web/src/app/(learn)/listening/error.tsx',
        component: '[data-fixture="stack-trace-1-7"]',
        viewport: VIEWPORT_360x640,
        html: `
            <main data-route="(learn)/listening" data-state="error">
              <section data-fixture="stack-trace-1-7">
                <h2>Đã xảy ra lỗi</h2>
                <pre>Error: ECONNRESET
    at TLSSocket.onConnectEnd (node:_tls_wrap:1645:7)
    at TLSSocket.emit (node:events:529:35)
    at endReadableNT (node:internal/streams/readable:1407:12)</pre>
              </section>
            </main>
        `,
        bugConditionDescription:
            'Error state renders raw runtime stack trace via <pre>{stack}</pre>, exposing internals to the learner (bugfix.md § 1.7 condition 3, § 2.7 iii).',
        expectedFindingSketch: {
            expected:
                'Error state renders calm Vietnamese message + recovery CTA ∈ {retry, dashboard, support}; NEVER exposes stack trace or raw runtime error string',
            evidenceKeys: ['stateKind', 'missingComponents', 'exposesStackTrace'],
            forwardTo: null,
            action: 'fix',
        },
    },

    // ----- 1.8 Layout-driven text overflow (P1) ------------------------------
    {
        label: 'fixture-1.8 / DE compound noun in fixed-width 200px button, flex ancestor missing min-width:0',
        defectClass: '1.8',
        expectedSeverity: 'P1',
        route: 'apps/web/src/app/(learn)/grammar/page.tsx',
        component: '[data-fixture="overflow-1-8"]',
        viewport: VIEWPORT_360x640,
        html: `
            <main data-route="(learn)/grammar">
              <div style="display:flex;align-items:center;gap:8px">
                <button
                  data-fixture="overflow-1-8"
                  style="width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;background:#0284c7;color:white;padding:12px 16px"
                >
                  Geschwindigkeitsbegrenzungsschild-Übung starten
                </button>
              </div>
            </main>
        `,
        bugConditionDescription:
            'Button label receives DE compound noun (~46 chars) inside container width:200px (fixed Npx), no max-width / min-width:0 on flex ancestor → ellipsis-truncated meaningful CTA label (bugfix.md § 1.8 (b), (d), (e)).',
        expectedFindingSketch: {
            expected:
                'Container uses max-width + min-width:0; flex/grid ancestor has min-width:0; meaningful CTA labels render in full at viewport ≤ 480px',
            evidenceKeys: ['containerSelector', 'overflowKind', 'syntheticString'],
            forwardTo: null,
            action: 'fix',
        },
    },

    // ----- 1.9 Asset oversize pushing CTA below fold (P0) --------------------
    {
        label: 'fixture-1.9 / hero illustration ~50% above-the-fold pushes primary CTA below fold',
        defectClass: '1.9',
        expectedSeverity: 'P0',
        route: 'apps/web/src/app/(learn)/campaign/page.tsx',
        component: '[data-fixture="asset-oversize-1-9"]',
        viewport: VIEWPORT_375x667,
        html: `
            <main data-route="(learn)/campaign" style="height:667px;overflow:hidden">
              <img
                data-fixture="asset-oversize-1-9"
                src="/illustrations/mascot-hero.svg"
                width="375"
                height="360"
                alt=""
                style="display:block;width:375px;height:360px"
              />
              <div style="height:280px;padding:16px">
                <h1 style="font-size:24px;font-weight:700;margin:0 0 12px">
                  Khởi động mission của bạn
                </h1>
                <p style="margin:0 0 12px">
                  Hoàn tất 5 bài học để mở khóa phần thưởng đặc biệt.
                </p>
              </div>
              <button
                data-role="primary-cta"
                style="margin-top:8px;width:343px;height:44px;background:#0284c7;color:white"
              >
                Bắt đầu mission
              </button>
            </main>
        `,
        bugConditionDescription:
            'Hero illustration at 375×360 occupies 360/667 ≈ 54% of above-the-fold area at viewport 375×667; primary CTA "Bắt đầu mission" lives below the 667px fold (bugfix.md § 1.9 (c), § 2.10 row 1.9 P0).',
        expectedFindingSketch: {
            expected:
                'Asset visual area ≤ 2.0× primary CTA visual area AND asset ≤ 40% of above-the-fold area when CTA would otherwise be pushed below fold',
            evidenceKeys: [
                'assetSelector',
                'assetAreaPx2',
                'primaryCtaAreaPx2',
                'aboveTheFoldShare',
                'pushesCtaBelowFold',
            ],
            forwardTo: 'gamified-ui-asset-rollout',
            action: 'forward',
        },
    },
]

// =============================================================================
// SECTION 5 — JSDOM harness. Builds an `AuditInput` X for each fixture
// and feeds it to `auditPass`. The viewport is encoded via the JSDOM
// `viewport` settings AND mirrored on the input record so detectors
// that don't query the window can read it directly.
// =============================================================================

function buildAuditInput(fixture: FixtureSpec): AuditInput {
    const virtualConsole = new VirtualConsole()
    virtualConsole.on('jsdomError', () => undefined)
    const dom = new JSDOM(
        `<!doctype html><html><head><title>${fixture.label}</title></head><body>${fixture.html}</body></html>`,
        {
            virtualConsole,
            pretendToBeVisual: true,
        },
    )
    // JSDOM doesn't lay out, but window.innerWidth/innerHeight let
    // detectors that gate on viewport.width ≤ 480 read the pinned size.
    Object.defineProperty(dom.window, 'innerWidth', {
        value: fixture.viewport.width,
        configurable: true,
    })
    Object.defineProperty(dom.window, 'innerHeight', {
        value: fixture.viewport.height,
        configurable: true,
    })
    return {
        route: fixture.route,
        component: fixture.component,
        viewport: { ...fixture.viewport },
        renderedDom: dom.window.document,
        window: dom.window as unknown as Window & typeof globalThis,
    }
}

interface FixtureCounterexample {
    fixture: FixtureSpec
    rawOutput: Finding[]
    schemaCheck: SchemaCheck | null
    /**
     * Human-readable summary of the gap between observed `auditPass`
     * output and the unified Finding Schema. Recorded into the test
     * failure message so the counterexample is visible in the report
     * AND in tests/audit/ui-ux/exploration-findings.md.
     */
    gapSummary: string
}

function runFixtureAgainstAuditPass(
    fixture: FixtureSpec,
): FixtureCounterexample {
    const X = buildAuditInput(fixture)
    const rawOutput = auditPass(X)

    if (rawOutput.length === 0) {
        return {
            fixture,
            rawOutput,
            schemaCheck: null,
            gapSummary:
                'auditPass emitted 0 findings — no detector exists for this defect class (root cause #1: missing detector; root cause #2: missing mobile viewport pin; root cause #3: missing unified Finding schema).',
        }
    }

    if (rawOutput.length !== 1) {
        return {
            fixture,
            rawOutput,
            schemaCheck: null,
            gapSummary: `auditPass emitted ${rawOutput.length} findings (Property 1 requires exactly one per bug-condition input).`,
        }
    }

    const check = validateFinding(rawOutput[0])
    return {
        fixture,
        rawOutput,
        schemaCheck: check,
        gapSummary: check.valid
            ? 'auditPass emitted exactly one schema-valid Finding (no gap).'
            : `auditPass emitted a Finding-shaped object but it fails the unified schema:\n  - ${check.gaps.join('\n  - ')}`,
    }
}

function formatExpectedFinding(fixture: FixtureSpec): string {
    const sketch = fixture.expectedFindingSketch
    return [
        `  defectClass: "${fixture.defectClass}"`,
        `  severity:    "${fixture.expectedSeverity}"`,
        `  route:       "${fixture.route}"`,
        `  component:   "${fixture.component}"`,
        `  evidence:    { ${sketch.evidenceKeys.map((k) => `${k}: <…>`).join(', ')} }`,
        `  expected:    "${sketch.expected}"`,
        `  screenshotPath: "<≤480px screenshot path>"`,
        `  forwardTo:   ${sketch.forwardTo === null ? 'null' : `"${sketch.forwardTo}"`}`,
        `  action:      "${sketch.action}"`,
    ].join('\n')
}

// =============================================================================
// SECTION 6 — Property 1 assertions. One `it(...)` per defect class so
// the test report shows 9 distinct counterexample lines when the suite
// fails on unfixed code (which is the success case for the bugfix
// workflow's Exploratory Bug Condition Checking step).
// =============================================================================

describe('Property 1 — Bug Condition: auditPass detects every defect class 1.1–1.9 at viewport ≤ 480px', () => {
    for (const fixture of FIXTURES) {
        it(`${fixture.label} → auditPass emits exactly one schema-valid Finding (defectClass ${fixture.defectClass}, expected severity ${fixture.expectedSeverity})`, () => {
            const cx = runFixtureAgainstAuditPass(fixture)

            const failureBanner = [
                '',
                `Bug-condition fixture: ${fixture.label}`,
                `Bug condition       : ${fixture.bugConditionDescription}`,
                `Viewport            : ${fixture.viewport.width}×${fixture.viewport.height}`,
                `Route               : ${fixture.route}`,
                '',
                `auditPass observed  : ${JSON.stringify(cx.rawOutput, null, 2)}`,
                '',
                `Gap vs Finding Schema:`,
                `  ${cx.gapSummary}`,
                '',
                `Expected post-fix Finding (sketch):`,
                formatExpectedFinding(fixture),
                '',
                'See tests/audit/ui-ux/exploration-findings.md for the full counterexample log.',
                '',
            ].join('\n')

            // Property 1 assertion — strict shape + severity + evidence
            // contract per bugfix.md § Introduction § Finding Schema,
            // § 2.10, § 2.11, § 2.4 (auto-P0 for 1.4), § 2.7 iii
            // (auto-P0 for 1.7 with exposesStackTrace).
            expect(
                cx.rawOutput.length,
                `Property 1 (Bug Condition) — auditPass MUST emit exactly one Finding for every input that satisfies isBugCondition. ${failureBanner}`,
            ).toBe(1)

            // The remaining assertions only run when length === 1 (the
            // earlier expect throws otherwise). Guarded explicitly so
            // TypeScript narrows the array.
            const finding = cx.rawOutput[0]!
            const check = validateFinding(finding)
            expect(
                check.valid,
                `Property 1 (Bug Condition) — emitted Finding fails unified schema validator. ${failureBanner}`,
            ).toBe(true)

            expect(
                (finding as Finding).defectClass,
                `Property 1 (Bug Condition) — defectClass mismatch. ${failureBanner}`,
            ).toBe(fixture.defectClass)

            expect(
                (finding as Finding).severity,
                `Property 1 (Bug Condition) — severity mismatch vs bugfix.md § 2.10. ${failureBanner}`,
            ).toBe(fixture.expectedSeverity)
        })
    }
})
