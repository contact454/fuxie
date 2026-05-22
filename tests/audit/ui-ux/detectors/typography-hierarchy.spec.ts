/**
 * typography-hierarchy.spec.ts — Unit coverage for detector 1.2
 * (Unclear typography hierarchy).
 *
 * Vai chinh: QA Automation Engineer
 * Vai phoi hop: Frontend Engineer, Product Designer
 *
 * Spec source-of-truth:
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/bugfix.md § 1.2 (bug
 *     conditions a, b, c) and § 2.2 (expected behavior).
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/bugfix.md § 2.10 row 1.2
 *     (severity), § 2.11 (evidence keys: fontSize, fontWeight,
 *     expectedTokenSet).
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/tasks.md task 3.5 — required
 *     test coverage:
 *       (a) compliant heading + body fixture → 0 findings,
 *       (b) bug condition: heading + body sharing font-size 16px
 *           and font-weight 600 in the same semantic block →
 *           exactly one valid Finding,
 *       (c) > 3 distinct (font-size, font-weight) combos in a
 *           block → finding,
 *       (d) inline emphasis exemption (strong/em) does not
 *           trigger.
 *
 * The tests construct the audit context via `createJsdomRouteLoader`
 * (the same harness shipped by task 3.3) — same pattern as
 * `spacing-baseline.spec.ts`.
 */

import { describe, expect, it } from 'vitest'

import type { Finding } from '../../../../apps/web/audit/ui-ux/finding-schema'
import { validateFinding } from '../../../../apps/web/audit/ui-ux/finding-validator'
import {
    detectTypographyHierarchy,
    TEXT_SIZE_TOKEN_PX,
} from '../../../../apps/web/audit/ui-ux/detectors/typography-hierarchy'
import { createJsdomRouteLoader } from '../../../../apps/web/audit/ui-ux/runtime/harness'
import type { AuditContext } from '../../../../apps/web/audit/ui-ux/runtime/harness'

// =============================================================================
// SECTION 1 — Helpers.
// =============================================================================

const VIEWPORT_375x667 = { width: 375, height: 667 } as const

async function buildContext(
    body: string,
    route = '/learn/dashboard',
): Promise<AuditContext> {
    const loader = createJsdomRouteLoader({ htmlProvider: () => body })
    return loader.load({ route, viewport: VIEWPORT_375x667 })
}

async function runDetector(
    body: string,
    route = '/learn/dashboard',
): Promise<Finding[]> {
    const ctx = await buildContext(body, route)
    try {
        const result = await detectTypographyHierarchy(ctx)
        return [...result]
    } finally {
        await ctx.dispose()
    }
}

function assertAllValid(findings: ReadonlyArray<Finding>): void {
    for (const f of findings) {
        const v = validateFinding(f)
        expect(
            v.errors,
            `validation errors for finding: ${JSON.stringify(f)}`,
        ).toEqual([])
        expect(v.valid).toBe(true)
    }
}

// =============================================================================
// SECTION 2 — Token-set sanity guard.
// =============================================================================

describe('detector 1.2 — token set mirrors apps/web/src/app/globals.css', () => {
    it('contains exactly the 13 --text-*-size tokens declared in globals.css', () => {
        const tokens = TEXT_SIZE_TOKEN_PX.map((t) => t.token)
        // Token names from globals.css §§ 117–130.
        expect(tokens).toEqual([
            '--text-2xs-size',
            '--text-xs-size',
            '--text-sm-size',
            '--text-base-size',
            '--text-lg-size',
            '--text-xl-size',
            '--text-2xl-size',
            '--text-3xl-size',
            '--text-4xl-size',
            '--text-5xl-size',
            '--text-6xl-size',
            '--text-7xl-size',
            '--text-8xl-size',
        ])
        const px = TEXT_SIZE_TOKEN_PX.map((t) => t.px)
        // Spot-check the canonical values: 11, 12, 14, 16, 18, 20, 24, 30,
        // 36, 48, 56, 64, 72 px.
        expect(px).toEqual([11, 12, 14, 16, 18, 20, 24, 30, 36, 48, 56, 64, 72])
    })
})

// =============================================================================
// SECTION 3 — (a) Compliant heading + body fixture → 0 findings.
// =============================================================================

describe('detector 1.2 — (a) compliant heading + body fixture emits 0 findings', () => {
    it('h2 (24px / 700) + p (16px / 400) inside a card yields no finding', async () => {
        // ratio = 24/16 = 1.5 ≥ 1.125x and weight delta = 300 ≥ 200,
        // so § 2.2 (ii) is satisfied. Both sizes are members of the
        // --text-*-size set (24 = --text-2xl, 16 = --text-base).
        const html = `
            <main data-route="(learn)/dashboard">
              <article data-fixture="compliant-card" style="padding:16px">
                <h2 style="font-size:24px;font-weight:700">Hôm nay học gì</h2>
                <p style="font-size:16px;font-weight:400">Bài 5 — Listening A1</p>
              </article>
            </main>
        `
        const findings = await runDetector(html)
        expect(findings).toEqual([])
    })

    it('heading + body + caption all on tokens with valid ratios yields no finding', async () => {
        // h2=24/700, p=16/400, small=12/400. Adjacent pairs:
        //   heading↔body: 24/16=1.5x  → ok.
        //   body↔caption: 16/12≈1.33x → ok.
        const html = `
            <main data-route="(learn)/listening">
              <article>
                <h2 style="font-size:24px;font-weight:700">Phần A</h2>
                <p style="font-size:16px;font-weight:400">Hướng dẫn</p>
                <small style="font-size:12px;font-weight:400">Tip: bật phụ đề</small>
              </article>
            </main>
        `
        const findings = await runDetector(html)
        expect(findings).toEqual([])
    })
})

// =============================================================================
// SECTION 4 — (b) Bug condition: heading + body sharing 16px / 600.
// =============================================================================

describe('detector 1.2 — (b) heading + body share font-size 16px / weight 600 → one valid Finding', () => {
    it('emits exactly one Finding for the adjacent-rank collapse, defectClass=1.2, action=fix', async () => {
        // Mirrors `tests/audit/ui-ux/exploration.spec.ts` fixture-1.2
        // verbatim so the exploration test will agree with the
        // detector's output post-fix (task 3.15). Conditions met:
        //   ratio = 16/16 = 1.0 < 1.125x AND
        //   weight delta = 600 - 600 = 0 < 200.
        const html = `
            <main data-route="(learn)/dashboard">
              <article data-fixture="card-1-2">
                <h2 style="font-size:16px;font-weight:600">Streak hôm nay</h2>
                <p style="font-size:16px;font-weight:600">7 ngày liên tiếp</p>
              </article>
            </main>
        `
        const findings = await runDetector(html)
        const collapsed = findings.filter(
            (f) => (f.evidence as Record<string, unknown>).kind === 'adjacent-rank-collapse',
        )
        expect(collapsed.length).toBe(1)

        const f = collapsed[0]
        expect(f.defectClass).toBe('1.2')
        expect(f.action).toBe('fix')
        expect(f.forwardTo).toBeNull()
        // Per § 2.10: heading↔body collapse on a primary task surface
        // (dashboard) is auto-P0.
        expect(f.severity).toBe('P0')
        // Per § 2.11 evidence keys for 1.2.
        expect(f.evidence.fontSize).toBeTruthy()
        expect(f.evidence.fontWeight).toBeTruthy()
        expect(f.evidence.expectedTokenSet).toBeTruthy()
        expect(String(f.evidence.expectedTokenSet)).toContain('--text-base-size')
        expect((f.evidence as Record<string, unknown>).rankPair).toBe(
            'heading↔body',
        )
        // Component points at the heading (the higher rank).
        expect(f.component.toLowerCase()).toMatch(/h2|heading/)

        assertAllValid(findings)
    })

    it('the same collapse on a secondary block downgrades to P2', async () => {
        // § 2.10 row 1.2 P2: violation only in a secondary block
        // (footer, meta). The detector recognises a `<footer>`
        // ancestor as a marker of a secondary block.
        const html = `
            <main data-route="(learn)/dashboard">
              <footer>
                <article data-fixture="footer-card">
                  <h3 style="font-size:16px;font-weight:600">Phụ trợ</h3>
                  <p style="font-size:16px;font-weight:600">Cùng size cùng weight</p>
                </article>
              </footer>
            </main>
        `
        const findings = await runDetector(html)
        const collapsed = findings.filter(
            (f) => (f.evidence as Record<string, unknown>).kind === 'adjacent-rank-collapse',
        )
        expect(collapsed.length).toBe(1)
        expect(collapsed[0].severity).toBe('P2')
        assertAllValid(findings)
    })
})

// =============================================================================
// SECTION 5 — (c) > 3 distinct (font-size, font-weight) combos in a block.
// =============================================================================

describe('detector 1.2 — (c) > 3 distinct (font-size, font-weight) combos emit a finding', () => {
    it('a block with 4 distinct combos yields an excess-combos finding', async () => {
        // Combos:
        //   (24, 700) — heading
        //   (18, 600) — sub-heading body rank
        //   (16, 400) — body
        //   (14, 500) — quasi-caption
        // = 4 distinct combos, exceeding MAX = 3.
        const html = `
            <main data-route="(learn)/dashboard">
              <section data-fixture="busy-section">
                <h2 style="font-size:24px;font-weight:700">A</h2>
                <p style="font-size:18px;font-weight:600">B</p>
                <p style="font-size:16px;font-weight:400">C</p>
                <p style="font-size:14px;font-weight:500">D</p>
              </section>
            </main>
        `
        const findings = await runDetector(html)
        const excess = findings.filter(
            (f) => (f.evidence as Record<string, unknown>).kind === 'excess-combos',
        )
        expect(excess.length).toBe(1)

        const f = excess[0]
        expect(f.defectClass).toBe('1.2')
        expect(f.action).toBe('fix')
        expect(f.forwardTo).toBeNull()
        expect((f.evidence as Record<string, unknown>).distinctCombosCount).toBe(4)
        expect((f.evidence as Record<string, unknown>).maxAllowed).toBe(3)
        // § 2.10 row 1.2 P1: > 3 combos on a primary task surface.
        expect(f.severity).toBe('P1')
        expect(f.evidence.fontSize).toBeTruthy()
        expect(f.evidence.fontWeight).toBeTruthy()
        expect(String(f.evidence.expectedTokenSet)).toContain('--text-')
        assertAllValid(findings)
    })

    it('exactly 3 distinct combos do NOT trigger excess-combos (boundary)', async () => {
        const html = `
            <main data-route="(learn)/dashboard">
              <section data-fixture="three-combos">
                <h2 style="font-size:24px;font-weight:700">A</h2>
                <p style="font-size:16px;font-weight:400">B</p>
                <small style="font-size:12px;font-weight:400">C</small>
              </section>
            </main>
        `
        const findings = await runDetector(html)
        const excess = findings.filter(
            (f) => (f.evidence as Record<string, unknown>).kind === 'excess-combos',
        )
        expect(excess).toEqual([])
    })
})

// =============================================================================
// SECTION 6 — (d) Inline emphasis exemption (<strong>/<em>) does NOT trigger.
// =============================================================================

describe('detector 1.2 — (d) inline emphasis (<strong>/<em>) is exempt from the count', () => {
    it('a body sentence with <strong>/<em>/<b>/<i> producing distinct (size,weight) does not inflate combos', async () => {
        // Each inline-emphasis tag carries its own size+weight,
        // but per § 1.2 (b) they MUST be excluded from the count.
        // The block has 3 valid ranks (heading, body, caption);
        // the inline emphasis nodes inside the body sentence MUST
        // NOT push the block over the 3-combo limit.
        const html = `
            <main data-route="(learn)/dashboard">
              <section data-fixture="inline-emphasis">
                <h2 style="font-size:24px;font-weight:700">Bài học</h2>
                <p style="font-size:16px;font-weight:400">
                  Hôm nay bạn cần
                  <strong style="font-size:18px;font-weight:700">tập trung</strong>
                  vào
                  <em style="font-size:14px;font-weight:500">phần listening</em>
                  <b style="font-size:20px;font-weight:800">A1</b>
                  <i style="font-size:13px;font-weight:300">tip</i>.
                </p>
                <small style="font-size:12px;font-weight:400">Mẹo nhỏ</small>
              </section>
            </main>
        `
        const findings = await runDetector(html)
        // No excess-combos finding (block has only 3 ranked combos).
        const excess = findings.filter(
            (f) => (f.evidence as Record<string, unknown>).kind === 'excess-combos',
        )
        expect(excess).toEqual([])
        // No adjacent-rank collapse either (24/16=1.5x and weight
        // delta=300 between heading and body; 16/12≈1.33x between
        // body and caption).
        const collapsed = findings.filter(
            (f) =>
                (f.evidence as Record<string, unknown>).kind ===
                'adjacent-rank-collapse',
        )
        expect(collapsed).toEqual([])
        // No heading-token violation (24px = --text-2xl-size).
        expect(findings).toEqual([])
    })

    it('a heading whose ONLY would-be sibling is an <em> sentence is not falsely flagged as off-token', async () => {
        // Defends against the regression where inline-emphasis
        // counted as a body rank and the heading was paired with
        // it for adjacent-rank checks.
        const html = `
            <main data-route="(learn)/dashboard">
              <section data-fixture="heading-with-em-only">
                <h2 style="font-size:24px;font-weight:700">Tiến độ</h2>
                <p style="font-size:16px;font-weight:400">
                  <em style="font-size:24px;font-weight:700">Bạn đã học 7 ngày liên tiếp</em>
                </p>
              </section>
            </main>
        `
        const findings = await runDetector(html)
        // The <em> is excluded; the heading↔body pair is
        // 24/16=1.5x → no collapse.
        expect(findings).toEqual([])
    })
})

// =============================================================================
// SECTION 7 — Validator-gating regression guard.
// =============================================================================

describe('detector 1.2 — every emitted finding passes validateFinding', () => {
    it('compliant + collapsed + excess-combos fixtures together yield only valid Findings', async () => {
        const html = `
            <main data-route="(learn)/dashboard">
              <article data-fixture="compliant">
                <h2 style="font-size:24px;font-weight:700">OK</h2>
                <p style="font-size:16px;font-weight:400">body</p>
              </article>
              <article data-fixture="collapsed">
                <h2 style="font-size:16px;font-weight:600">Same</h2>
                <p style="font-size:16px;font-weight:600">Same</p>
              </article>
              <section data-fixture="busy">
                <h2 style="font-size:24px;font-weight:700">A</h2>
                <p style="font-size:18px;font-weight:600">B</p>
                <p style="font-size:16px;font-weight:400">C</p>
                <p style="font-size:14px;font-weight:500">D</p>
              </section>
            </main>
        `
        const findings = await runDetector(html)
        expect(findings.length).toBeGreaterThan(0)
        assertAllValid(findings)
    })
})
