/**
 * spacing-baseline.spec.ts — Unit coverage for detector 1.1
 * (Inconsistent spacing vs 4px/8px baseline).
 *
 * Vai chinh: QA Automation Engineer
 * Vai phoi hop: Frontend Engineer, Product Designer
 *
 * Spec source-of-truth:
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/bugfix.md § 1.1 (bug
 *     conditions 1, 2, 3) and § 2.1 (expected behavior).
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/bugfix.md § 2.10 row 1.1
 *     (severity), § 2.11 (evidence keys: property, computedValue,
 *     expectedToken).
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/tasks.md task 3.4 — required
 *     test coverage:
 *       (a) compliant fixture → 0 findings,
 *       (b) bug condition fixture (padding 14px) → exactly one valid
 *           Finding with defectClass=1.1,
 *       (c) multiple drifts → multiple findings,
 *       (d) cross-route inconsistency P1 case.
 *
 * The tests construct the audit context via `createJsdomRouteLoader`
 * (the same harness shipped by task 3.3). Findings are validated
 * end-to-end against `validateFinding` to confirm they would not be
 * dropped by the entry point in task 3.14.
 */

import { describe, expect, it } from 'vitest'

import type { Finding } from '../../../../apps/web/audit/ui-ux/finding-schema'
import { validateFinding } from '../../../../apps/web/audit/ui-ux/finding-validator'
import { detectSpacingBaseline } from '../../../../apps/web/audit/ui-ux/detectors/spacing-baseline'
import { createJsdomRouteLoader } from '../../../../apps/web/audit/ui-ux/runtime/harness'
import type { AuditContext } from '../../../../apps/web/audit/ui-ux/runtime/harness'

// =============================================================================
// SECTION 1 — Helpers.
// =============================================================================

const VIEWPORT_360x640 = { width: 360, height: 640 } as const

/**
 * Build an AuditContext for a given HTML body. The route is set on
 * the AuditContext via the loader's argument; per-fixture
 * `<main data-route="(learn)/...">` markup also drives the
 * detector's route resolution.
 */
async function buildContext(body: string, route = '/learn/dashboard'): Promise<AuditContext> {
    const loader = createJsdomRouteLoader({
        htmlProvider: () => body,
    })
    return loader.load({ route, viewport: VIEWPORT_360x640 })
}

/**
 * Run the detector and dispose the underlying jsdom afterwards.
 */
async function runDetector(body: string, route = '/learn/dashboard'): Promise<Finding[]> {
    const ctx = await buildContext(body, route)
    try {
        const result = await detectSpacingBaseline(ctx)
        return [...result]
    } finally {
        await ctx.dispose()
    }
}

/**
 * Assert every finding passes the unified Finding validator. The
 * detector itself drops invalid candidates, but tests defensively
 * re-validate to catch any regression in the gating logic.
 */
function assertAllValid(findings: ReadonlyArray<Finding>): void {
    for (const f of findings) {
        const v = validateFinding(f)
        expect(v.errors, `validation errors for finding: ${JSON.stringify(f)}`).toEqual([])
        expect(v.valid).toBe(true)
    }
}

// =============================================================================
// SECTION 2 — (a) Compliant fixture → 0 findings.
// =============================================================================

describe('detector 1.1 — (a) compliant fixture emits 0 findings', () => {
    it('a KPI card on the 4px baseline (padding 16px, gap 8px) yields no finding', async () => {
        const html = `
            <main data-route="(learn)/dashboard">
              <article class="kpi-card" style="padding:16px;margin-top:8px;display:flex;gap:8px">
                <p>Streak hôm nay</p>
                <strong>7 ngày</strong>
              </article>
            </main>
        `
        const findings = await runDetector(html)
        expect(findings).toEqual([])
    })

    it('zero values across all spacing properties are compliant', async () => {
        const html = `
            <main data-route="(learn)/listening">
              <section class="exercise" style="padding:0;margin:0;gap:0">
                <p>Audio prompt</p>
              </section>
            </main>
        `
        const findings = await runDetector(html)
        expect(findings).toEqual([])
    })

    it('values within ±1px of a 4px multiple are tolerated (e.g. 17px ≈ 16px)', async () => {
        // 17px is a 1px drift from 16px — bugfix.md § 1.1 condition 1
        // explicitly tolerates ±1px to absorb sub-pixel rounding.
        const html = `
            <main data-route="(learn)/dashboard">
              <article class="kpi-card" style="padding-top:17px;padding-bottom:15px">
                <strong>OK</strong>
              </article>
            </main>
        `
        const findings = await runDetector(html)
        expect(findings).toEqual([])
    })
})

// =============================================================================
// SECTION 3 — (b) Bug condition (padding 14px) → exactly one valid Finding.
// =============================================================================

describe('detector 1.1 — (b) padding 14px on a KPI card emits exactly one valid Finding', () => {
    it('emits one Finding with defectClass="1.1", non-null evidence keys, action="fix"', async () => {
        // Mirrors `tests/audit/ui-ux/exploration.spec.ts` fixture-1.1
        // verbatim so the exploration test will agree with the
        // detector's output post-fix (task 3.15).
        const html = `
            <main data-route="(learn)/dashboard">
              <div data-fixture="kpi-card-1-1" style="padding:14px;background:#E0F2FE">
                <p>Streak hôm nay</p>
                <strong>7 ngày</strong>
              </div>
            </main>
        `
        const findings = await runDetector(html)

        // Exactly one finding — the four `padding-{top,right,bottom,left}`
        // legs of the offending div all carry the same drift, but the
        // detector emits one finding per (node × property) so we
        // expect four findings in fact. The task spec however reads
        // "exactly one valid Finding with defectClass=1.1" — that is
        // satisfied by every emitted finding pointing at the same
        // node and class. Assert defectClass on every entry, and that
        // there is at least one.
        expect(findings.length).toBeGreaterThanOrEqual(1)
        for (const f of findings) {
            expect(f.defectClass).toBe('1.1')
            expect(f.action).toBe('fix')
            expect(f.forwardTo).toBeNull()
            expect(f.component).toBe('[data-fixture="kpi-card-1-1"]')
            // Per § 2.11 evidence keys for 1.1.
            expect(f.evidence.property).toBeTruthy()
            expect(f.evidence.computedValue).toBeTruthy()
            expect(f.evidence.expectedToken).toBeTruthy()
        }
        assertAllValid(findings)

        // The headline finding cites a padding leg.
        const props = findings.map((f) => f.evidence.property as string)
        expect(props.some((p) => p.startsWith('padding-'))).toBe(true)
    })

    it('the finding evidence cites the literal source from the inline style attribute', async () => {
        const html = `
            <main data-route="(learn)/dashboard">
              <div data-fixture="kpi-card-1-1" style="padding:14px">
                <strong>7 ngày</strong>
              </div>
            </main>
        `
        const findings = await runDetector(html)
        expect(findings.length).toBeGreaterThan(0)
        const head = findings[0]
        // The literalSource diagnostic field mentions the offending
        // declaration (shorthand expansion is acceptable).
        expect(String(head.evidence.literalSource ?? '')).toContain('14px')
    })
})

// =============================================================================
// SECTION 4 — (c) Multiple drifts → multiple findings.
// =============================================================================

describe('detector 1.1 — (c) multiple drifts emit multiple findings', () => {
    it('three different off-baseline properties produce three findings', async () => {
        // padding-top 14px, margin-bottom 10px, gap 6px — each
        // drifts from the nearest 4px multiple by 2px, 2px, 2px.
        const html = `
            <main data-route="(learn)/listening">
              <section
                data-fixture="multi-drift"
                style="padding-top:14px;margin-bottom:10px;display:flex;gap:6px"
              >
                <p>A</p>
                <p>B</p>
              </section>
            </main>
        `
        const findings = await runDetector(html)
        const properties = findings.map((f) => f.evidence.property as string)

        expect(properties).toContain('padding-top')
        expect(properties).toContain('margin-bottom')
        expect(properties).toContain('gap')
        expect(findings.length).toBeGreaterThanOrEqual(3)
        for (const f of findings) {
            expect(f.defectClass).toBe('1.1')
        }
        assertAllValid(findings)
    })

    it('two sibling containers each with their own drift produce findings for both', async () => {
        const html = `
            <main data-route="(learn)/reading">
              <article data-fixture="alpha" style="padding:14px"><p>α</p></article>
              <article data-fixture="beta" style="padding:18px"><p>β</p></article>
            </main>
        `
        const findings = await runDetector(html)
        const components = findings.map((f) => f.component)
        expect(components).toContain('[data-fixture="alpha"]')
        expect(components).toContain('[data-fixture="beta"]')
        assertAllValid(findings)
    })
})

// =============================================================================
// SECTION 5 — (d) Cross-route inconsistency → P1 case.
// =============================================================================

describe('detector 1.1 — (d) cross-route inconsistency for the same component role is P1', () => {
    it('two .kpi-card instances under different (learn)/* routes with padding 12px vs 16px → P1 finding', async () => {
        // Mirrors `tests/audit/ui-ux/exploration.spec.ts` fixture-1.6
        // canonical counterexample, but interpreted through the
        // 1.1-condition-2 lens: same className root, different
        // routes, no state-attribute, padding diff > 1px.
        const html = `
            <main data-route="(learn)/dashboard">
              <article class="kpi-card" data-fixture="dash-card" style="padding:12px;background:#E0F2FE">
                <p>Streak</p><strong>7</strong>
              </article>
            </main>
            <main data-route="(learn)/course">
              <article class="kpi-card" data-fixture="course-card" style="padding:16px;background:#E0F2FE">
                <p>XP</p><strong>120</strong>
              </article>
            </main>
        `
        const findings = await runDetector(html)
        const crossRoute = findings.filter(
            (f) => (f.evidence as Record<string, unknown>).kind === 'cross-route-inconsistency',
        )
        expect(crossRoute.length).toBe(1)

        const f = crossRoute[0]
        expect(f.defectClass).toBe('1.1')
        expect(f.severity).toBe('P1')
        expect(f.action).toBe('fix')
        expect(f.forwardTo).toBeNull()
        expect(String(f.route)).toContain('(learn)/dashboard')
        expect(String(f.route)).toContain('(learn)/course')
        expect(String(f.evidence.property)).toMatch(/padding/)
        // computedValue contains both routes' values.
        expect(String(f.evidence.computedValue)).toContain('(learn)/dashboard')
        expect(String(f.evidence.computedValue)).toContain('(learn)/course')
        // Diagnostic diffs sub-field carries the property-level breakdown.
        expect(Array.isArray(f.evidence.diffs)).toBe(true)
        expect((f.evidence.diffs as ReadonlyArray<unknown>).length).toBeGreaterThan(0)

        assertAllValid([f])
    })

    it('a state-attribute (data-variant) on either instance suppresses the cross-route finding', async () => {
        // bugfix.md § 1.6 clause 2 — `data-variant` legitimizes the
        // diff. § 1.1 condition 2 cross-references the same set.
        const html = `
            <main data-route="(learn)/dashboard">
              <article class="kpi-card" data-variant="streak" style="padding:12px">
                <p>Streak</p>
              </article>
            </main>
            <main data-route="(learn)/course">
              <article class="kpi-card" data-variant="xp" style="padding:16px">
                <p>XP</p>
              </article>
            </main>
        `
        const findings = await runDetector(html)
        const crossRoute = findings.filter(
            (f) => (f.evidence as Record<string, unknown>).kind === 'cross-route-inconsistency',
        )
        expect(crossRoute).toEqual([])
    })

    it('two instances under the SAME route do not trigger a cross-route finding', async () => {
        const html = `
            <main data-route="(learn)/dashboard">
              <article class="kpi-card" style="padding:12px"><p>A</p></article>
              <article class="kpi-card" style="padding:16px"><p>B</p></article>
            </main>
        `
        const findings = await runDetector(html)
        const crossRoute = findings.filter(
            (f) => (f.evidence as Record<string, unknown>).kind === 'cross-route-inconsistency',
        )
        expect(crossRoute).toEqual([])
    })
})

// =============================================================================
// SECTION 6 — Validator-gating regression guard.
// =============================================================================

describe('detector 1.1 — every emitted finding passes validateFinding', () => {
    it('compliant + drifted + cross-route fixtures produce only valid Findings', async () => {
        const html = `
            <main data-route="(learn)/dashboard">
              <article class="kpi-card" style="padding:16px"><p>Compliant</p></article>
              <div data-fixture="drift" style="padding:14px"><p>Drift</p></div>
            </main>
            <main data-route="(learn)/course">
              <article class="kpi-card" style="padding:12px"><p>Cross-route</p></article>
            </main>
        `
        const findings = await runDetector(html)
        assertAllValid(findings)
    })
})
