/**
 * color-token.spec.ts — Unit coverage for detector 1.3 (Off-token
 * color usage, excluding Reward Amber containment).
 *
 * Vai chinh: QA Automation Engineer
 * Vai phoi hop: Frontend Engineer, Product Designer
 *
 * Spec source-of-truth:
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/bugfix.md § 1.3 (bug
 *     conditions 1, 2, 3, 4, 5) and § 2.3 (expected behavior).
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/bugfix.md § 2.10 row 1.3
 *     (severity), § 2.11 (evidence keys: literal, nearestToken,
 *     deltaE).
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/tasks.md task 3.6 — required
 *     test coverage:
 *       (a) Bright Sky tokens used → 0 findings.
 *       (b) literal hex `#1da1f2` outside tokens → exactly one
 *           valid Finding.
 *       (c) near-token (ΔE between 0 and 3) → finding flagged with
 *           kind="near-token".
 *       (d) `--fuxie-energy` share > 5% on lesson player → P1
 *           finding.
 *       (e) Reward Amber `#FFB703` violations → NOT flagged here
 *           (deferred to detector 1.4).
 *
 * The tests construct the audit context via `createJsdomRouteLoader`
 * (the same harness used by the spacing and typography detector
 * tests). Findings are validated end-to-end against
 * `validateFinding` to confirm the detector would not be dropped
 * by the entry point in task 3.14.
 */

import { describe, expect, it } from 'vitest'

import type { Finding } from '../../../../apps/web/audit/ui-ux/finding-schema'
import { validateFinding } from '../../../../apps/web/audit/ui-ux/finding-validator'
import {
    BRIGHT_SKY_TOKENS,
    FUXIE_ENERGY_HEX,
    REWARD_AMBER_HEX,
    ciede2000,
    detectColorToken,
    sRgbHexToLab,
} from '../../../../apps/web/audit/ui-ux/detectors/color-token'
import { createJsdomRouteLoader } from '../../../../apps/web/audit/ui-ux/runtime/harness'
import type { AuditContext } from '../../../../apps/web/audit/ui-ux/runtime/harness'

// =============================================================================
// SECTION 1 — Helpers.
// =============================================================================

const VIEWPORT_360x640 = { width: 360, height: 640 } as const
const VIEWPORT_375x667 = { width: 375, height: 667 } as const
const VIEWPORT_414x896 = { width: 414, height: 896 } as const

async function buildContext(
    body: string,
    route = '/learn/listening',
    viewport: { width: number; height: number } = VIEWPORT_414x896,
): Promise<AuditContext> {
    const loader = createJsdomRouteLoader({ htmlProvider: () => body })
    return loader.load({ route, viewport })
}

async function runDetector(
    body: string,
    route = '/learn/listening',
    viewport: { width: number; height: number } = VIEWPORT_414x896,
): Promise<Finding[]> {
    const ctx = await buildContext(body, route, viewport)
    try {
        const result = await detectColorToken(ctx)
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
// SECTION 2 — Token table mirrors apps/web/src/app/globals.css.
// =============================================================================

describe('detector 1.3 — token set mirrors apps/web/src/app/globals.css :root', () => {
    it('contains the canonical Bright Sky tokens declared in globals.css', () => {
        const tokens = BRIGHT_SKY_TOKENS.map((t) => t.token)
        // Token names from globals.css :root + @theme.
        // `--fuxie-reward` is intentionally EXCLUDED because its
        // containment is detector 1.4's territory (bugfix.md § 1.3
        // trailing note).
        // Spot-check a representative subset rather than the full
        // list — the detector unit tests below exercise individual
        // tokens, and the @theme palette can grow without breaking
        // detector 1.3 contract.
        for (const expected of [
            '--fuxie-blue-500',
            '--fuxie-action',
            '--fuxie-action-hover',
            '--fuxie-success',
            '--fuxie-energy',
            '--color-text-primary',
            '--color-text-inverse',
        ]) {
            expect(tokens).toContain(expected)
        }
        // Reward Amber is excluded — confirm the contract.
        expect(tokens).not.toContain('--fuxie-reward')
        // Spot-check the canonical hex values.
        const map = new Map(BRIGHT_SKY_TOKENS.map((t) => [t.token, t.hex]))
        expect(map.get('--fuxie-blue-500')).toBe('#54a8e4')
        expect(map.get('--fuxie-action')).toBe('#54a8e4')
        expect(map.get('--fuxie-success')).toBe('#2ec4b6')
        expect(map.get('--fuxie-energy')).toBe('#ff8a3d')
        expect(map.get('--color-text-inverse')).toBe('#ffffff')
        expect(map.get('--color-text-primary')).toBe('#173b56')
    })
})

// =============================================================================
// SECTION 3 — CIEDE2000 reference data (Sharma / Wu / Dalal table 1).
// =============================================================================

describe('CIEDE2000 — Sharma / Wu / Dalal reference test data', () => {
    /**
     * Subset of the canonical reference table from
     *   "The CIEDE2000 Color-Difference Formula: Implementation Notes,
     *    Supplementary Test Data, and Mathematical Observations"
     *   (Color Research and Application, Wiley, 2005).
     *
     * The full table has 34 rows; we sample three to keep the
     * fixture tight while exercising the discontinuities of the
     * formula (h-prime branch, T term, Rt rotation).
     */
    const cases: ReadonlyArray<{ a: { L: number; a: number; b: number }; b: { L: number; a: number; b: number }; expected: number }> = [
        {
            // Row 1 — small chromaticity diff at L = 50.
            a: { L: 50, a: 2.6772, b: -79.7751 },
            b: { L: 50, a: 0, b: -82.7485 },
            expected: 2.0425,
        },
        {
            // Row 14 — high chroma at L = 50.
            a: { L: 50, a: 2.5, b: 0 },
            b: { L: 73, a: 25, b: -18 },
            expected: 27.1492,
        },
        {
            // Row 34 — neutral lightness pair.
            a: { L: 60.2574, a: -34.0099, b: 36.2677 },
            b: { L: 60.4626, a: -34.1751, b: 39.4387 },
            expected: 1.2644,
        },
    ]
    for (const c of cases) {
        it(`computes ΔE2000(L*=${c.a.L}, a*=${c.a.a}, b*=${c.a.b} ↔ L*=${c.b.L}, a*=${c.b.a}, b*=${c.b.b}) ≈ ${c.expected}`, () => {
            const dE = ciede2000(c.a, c.b)
            expect(Math.abs(dE - c.expected)).toBeLessThan(0.01)
        })
    }

    it('returns 0 for identical Lab triples', () => {
        const lab = sRgbHexToLab('#54a8e4')
        expect(ciede2000(lab, lab)).toBeLessThan(1e-9)
    })
})

// =============================================================================
// SECTION 4 — (a) Bright Sky tokens used → 0 findings.
// =============================================================================

describe('detector 1.3 — (a) Bright Sky tokens used emit 0 findings', () => {
    it('a primary CTA wired via var(--fuxie-action) yields no finding', async () => {
        const html = `
            <main data-route="(learn)/listening">
              <button
                data-fixture="compliant-cta"
                data-role="primary-cta"
                style="background:var(--fuxie-action);color:white;padding:12px 16px"
              >
                Bắt đầu
              </button>
            </main>
        `
        const findings = await runDetector(html, '/learn/listening')
        expect(findings).toEqual([])
    })

    it('Tailwind utility class wired to a Bright Sky token yields no finding', async () => {
        const html = `
            <main data-route="(learn)/listening">
              <span class="bg-fuxie-blue-500 text-white">Token via Tailwind utility</span>
            </main>
        `
        const findings = await runDetector(html, '/learn/listening')
        expect(findings).toEqual([])
    })

    it('arbitrary-value class referencing var(--fuxie-action) is treated as token, not literal', async () => {
        // `bg-[var(--fuxie-action)]/15` is a Tailwind arbitrary
        // value WRAPPING a token reference. Detector 1.3 condition
        // 2 targets literal arbitrary values; token references via
        // `var(...)` are still a token usage and MUST NOT flag.
        const html = `
            <main data-route="(learn)/dashboard">
              <span class="bg-[var(--fuxie-action)]/15">XP badge</span>
            </main>
        `
        const findings = await runDetector(html, '/learn/dashboard', VIEWPORT_360x640)
        expect(findings).toEqual([])
    })
})

// =============================================================================
// SECTION 5 — (b) Literal hex #1da1f2 outside tokens → exactly one valid Finding.
// =============================================================================

describe('detector 1.3 — (b) literal hex #1da1f2 emits exactly one valid Finding', () => {
    it('emits one Finding with defectClass="1.3", evidence keys per § 2.11, action="fix"', async () => {
        // Mirrors `tests/audit/ui-ux/exploration.spec.ts` fixture-1.3
        // verbatim so the exploration test agrees with the detector
        // post-fix (task 3.15). Conditions met: literal hex
        // `#1da1f2` in inline `style="background:..."` of a primary
        // CTA on the lesson-player surface (`(learn)/listening`).
        // ΔE2000 vs the nearest token (`--fuxie-action` = `#54a8e4`)
        // is well above 3, so the finding is NOT a near-token trap.
        const html = `
            <main data-route="(learn)/listening">
              <button
                data-fixture="off-token-1-3"
                data-role="primary-cta"
                style="background:#1da1f2;color:var(--color-text-inverse);padding:12px 16px"
              >
                Nghe lại
              </button>
            </main>
        `
        const findings = await runDetector(html, '/learn/listening', VIEWPORT_414x896)
        expect(findings).toHaveLength(1)
        const finding = findings[0]
        expect(finding.defectClass).toBe('1.3')
        expect(finding.action).toBe('fix')
        expect(finding.forwardTo).toBeNull()
        expect(finding.component).toBe('[data-fixture="off-token-1-3"]')
        // Evidence keys per bugfix.md § 2.11.
        expect(finding.evidence.literal).toBe('#1da1f2')
        // The nearest canonical token has hex `#54a8e4` —
        // `--fuxie-blue-500` and `--fuxie-action` share the same
        // value, so either is an acceptable nearest.
        expect(['--fuxie-blue-500', '--fuxie-action']).toContain(
            finding.evidence.nearestToken,
        )
        expect(typeof finding.evidence.deltaE).toBe('number')
        expect(finding.evidence.deltaE as number).toBeGreaterThan(3)
        // P1 row in § 2.10: literal hex on primary CTA.
        expect(finding.severity).toBe('P1')
        // The detector emits `kind: "literal"` for literal hex.
        expect(finding.evidence.kind).toBe('literal')
        assertAllValid(findings)
    })

    it('rgb() literal in style is also flagged as condition 1', async () => {
        const html = `
            <main data-route="(learn)/dashboard">
              <span data-fixture="rgb-literal" style="color:rgb(255, 87, 51)">Off token</span>
            </main>
        `
        const findings = await runDetector(html, '/learn/dashboard', VIEWPORT_360x640)
        // The single rgb() literal in `color` should produce one
        // finding. Other literals in the same value (e.g. `255`,
        // `87`, `51`) are part of the rgb expression and are
        // captured as a single literal.
        const literals = findings.filter((f) => (f.evidence.bugConditions as string[]).includes('1.3 condition 1'))
        expect(literals.length).toBeGreaterThanOrEqual(1)
        for (const f of literals) {
            expect(f.evidence.literal).toContain('rgb')
        }
        assertAllValid(findings)
    })

    it('Tailwind arbitrary `bg-[#0099ff]` is flagged as condition 2', async () => {
        const html = `
            <main data-route="(learn)/dashboard">
              <button data-fixture="tw-arbitrary" class="bg-[#0099ff] text-white">Tailwind arbitrary</button>
            </main>
        `
        const findings = await runDetector(html, '/learn/dashboard', VIEWPORT_360x640)
        expect(findings.length).toBeGreaterThanOrEqual(1)
        const arbitrary = findings.find((f) =>
            (f.evidence.bugConditions as string[]).includes('1.3 condition 2'),
        )
        expect(arbitrary).toBeDefined()
        expect(arbitrary!.evidence.kind).toBe('tailwind-arbitrary')
        assertAllValid(findings)
    })
})

// =============================================================================
// SECTION 6 — (c) Near-token (ΔE between 0 and 3) → kind="near-token".
// =============================================================================

describe('detector 1.3 — (c) near-token (0 < ΔE < 3) flagged with kind="near-token"', () => {
    it('a hex within ΔE ≈ 1 of --fuxie-action is flagged as near-token', async () => {
        // Construct a hex very close to the canonical
        // `--fuxie-action` = `#54a8e4`. `#56aae6` differs by ≈ 2 in
        // each channel, which lands inside the 0 < ΔE2000 < 3 band.
        // Sanity-check the ΔE first so the fixture stays robust if
        // the maths drift.
        const candidate = '#56aae6'
        const dE = ciede2000(
            sRgbHexToLab(candidate),
            sRgbHexToLab('#54a8e4'),
        )
        expect(dE).toBeGreaterThan(0)
        expect(dE).toBeLessThan(3)

        const html = `
            <main data-route="(learn)/dashboard">
              <button
                data-fixture="near-token"
                style="background:${candidate};color:white;padding:12px 16px"
              >
                Tiếp tục
              </button>
            </main>
        `
        const findings = await runDetector(html, '/learn/dashboard', VIEWPORT_360x640)
        expect(findings).toHaveLength(1)
        const finding = findings[0]
        expect(finding.defectClass).toBe('1.3')
        expect(finding.evidence.kind).toBe('near-token')
        // The nearest canonical token has hex `#54a8e4` —
        // `--fuxie-blue-500` and `--fuxie-action` share the same
        // value, so either is an acceptable nearest.
        expect(['--fuxie-blue-500', '--fuxie-action']).toContain(
            finding.evidence.nearestToken,
        )
        const reportedDeltaE = finding.evidence.deltaE as number
        expect(reportedDeltaE).toBeGreaterThan(0)
        expect(reportedDeltaE).toBeLessThan(3)
        // § 2.10 row 1.3 P2: near-token elsewhere is P2. Even on
        // dashboard (a primary task surface), the near-token band
        // routes to P2 via the `nearTokenDeltaE` qualifier.
        expect(finding.severity).toBe('P2')
        assertAllValid(findings)
    })
})

// =============================================================================
// SECTION 7 — (d) `--fuxie-energy` share > 5% on lesson player → P1 finding.
// =============================================================================

describe('detector 1.3 — (d) --fuxie-energy share > 5% on lesson player emits a P1 finding', () => {
    it('a hero block carrying var(--fuxie-energy) covering > 5% of the viewport is P1', async () => {
        // 414×896 viewport ⇒ area = 370 944 px². 5% = 18 547.2 px².
        // We render a hero of 380×60 = 22 800 px² (≈ 6.1%) which
        // exceeds the limit. The fixture sets
        // `data-bounding-rect="0,0,380,60"` so jsdom (which can't
        // measure layout) still resolves a non-zero rect.
        const html = `
            <main data-route="(learn)/listening">
              <div
                data-fixture="energy-hero"
                style="background:var(--fuxie-energy);width:380px;height:60px"
                data-bounding-rect="0,0,380,60"
              >
                Hôm nay là ngày học!
              </div>
            </main>
        `
        const findings = await runDetector(html, '/learn/listening', VIEWPORT_414x896)
        // The fixture itself uses `var(--fuxie-energy)` — a token
        // reference, NOT a literal — so the literal-scan pass does
        // not emit. The condition-5 area-share pass DOES emit
        // exactly one finding describing the share.
        expect(findings).toHaveLength(1)
        const finding = findings[0]
        expect(finding.defectClass).toBe('1.3')
        expect(finding.evidence.kind).toBe('fuxie-energy-area-share')
        expect(finding.evidence.nearestToken).toBe('--fuxie-energy')
        expect(typeof finding.evidence.sharePct).toBe('number')
        expect(finding.evidence.sharePct as number).toBeGreaterThan(5)
        // § 2.10 row 1.3 P1 sub-row b — `--fuxie-energy` > 5% on
        // lesson player ⇒ P1.
        expect(finding.severity).toBe('P1')
        assertAllValid(findings)
    })

    it('does not flag when the share stays at or below 5%', async () => {
        // 414×896 viewport ⇒ 5% = 18 547 px². 200×60 = 12 000 px²
        // (≈ 3.2%) is comfortably under.
        const html = `
            <main data-route="(learn)/listening">
              <div
                data-fixture="energy-small"
                style="background:var(--fuxie-energy);width:200px;height:60px"
                data-bounding-rect="0,0,200,60"
              >
                Nhỏ thôi
              </div>
            </main>
        `
        const findings = await runDetector(html, '/learn/listening', VIEWPORT_414x896)
        expect(findings).toEqual([])
    })
})

// =============================================================================
// SECTION 8 — (e) Reward Amber #FFB703 violations are NOT flagged here.
// =============================================================================

describe('detector 1.3 — (e) Reward Amber #FFB703 is deferred to detector 1.4', () => {
    it('a button styled with literal #FFB703 outside Reward_State subtree is NOT flagged', async () => {
        // Detector 1.3 MUST drop Reward Amber (bugfix.md § 1.3
        // trailing note: "vi phạm Reward_State containment cho
        // `--fuxie-reward` được tách riêng sang 1.4 để tránh đếm
        // trùng"). The fixture uses ONLY Reward Amber as the
        // literal — other text colours go via tokens — so the
        // assertion can isolate the Reward Amber filter cleanly.
        const html = `
            <main data-route="(learn)/dashboard">
              <button
                data-fixture="reward-leak-1-4"
                style="background:#FFB703;color:var(--color-text-primary);padding:12px 16px"
              >
                Tiếp tục
              </button>
            </main>
        `
        const findings = await runDetector(html, '/learn/dashboard', VIEWPORT_360x640)
        expect(findings).toEqual([])
    })

    it('Tailwind arbitrary `bg-[#FFB703]` is also deferred to detector 1.4', async () => {
        const html = `
            <main data-route="(learn)/dashboard">
              <button
                data-fixture="reward-arbitrary"
                class="bg-[#FFB703] text-white"
              >
                Reward via arbitrary
              </button>
            </main>
        `
        const findings = await runDetector(html, '/learn/dashboard', VIEWPORT_360x640)
        // Sanity: confirm the chosen hex is inside the Reward
        // Amber band so the test is exercising the right filter.
        const dE = ciede2000(sRgbHexToLab('#FFB703'), sRgbHexToLab(REWARD_AMBER_HEX))
        expect(dE).toBeLessThan(1)
        expect(findings).toEqual([])
    })

    it('Reward Amber inside a Reward_State subtree is also not 1.3 territory', async () => {
        // Even when Reward Amber is correctly contained, detector
        // 1.3 must not emit. The audit's class-1.4 detector (task
        // 3.7) is responsible for asserting containment.
        const html = `
            <main data-route="(learn)/dashboard">
              <section data-reward-state="earned">
                <span style="color:#FFB703">+10 Fucoin</span>
              </section>
            </main>
        `
        const findings = await runDetector(html, '/learn/dashboard', VIEWPORT_360x640)
        expect(findings).toEqual([])
    })

    it('FUXIE_ENERGY_HEX and REWARD_AMBER_HEX exports stay in sync with globals.css', () => {
        expect(FUXIE_ENERGY_HEX).toBe('#ff8a3d')
        expect(REWARD_AMBER_HEX).toBe('#ffb703')
    })
})
