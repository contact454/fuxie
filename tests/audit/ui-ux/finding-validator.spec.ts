/**
 * finding-validator.spec.ts — Unit tests for the unified Finding
 * runtime validator shipped by task 3.1.
 *
 * Vai chinh: QA Automation Engineer
 * Vai phoi hop: Frontend Engineer, Product Designer
 *
 * Spec source-of-truth:
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/bugfix.md § Introduction
 *     § Finding Schema (generic fields).
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/bugfix.md § 2.4 (auto-P0 for
 *     non-exempt 1.4) and § 2.7 iii (auto-P0 when 1.7 exposes a stack
 *     trace).
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/bugfix.md § 2.11 (per-class
 *     evidence requirements).
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/tasks.md task 3.1 ("Add unit
 *     tests for the validator that confirm: valid Findings pass;
 *     Findings missing any generic field are rejected; Findings
 *     missing class-specific evidence keys are rejected; Auto-P0
 *     violations are rejected").
 *
 * Notes:
 *   - These are pure unit tests. They import the production validator
 *     directly via a relative path so they remain runnable from the
 *     root vitest config (`vitest.property.config.ts`) without
 *     depending on path aliases. The exploration / preservation
 *     specs alongside this file follow the same convention.
 *   - The fixtures keep evidence payloads minimal — only the fields
 *     required by the per-class evidence schema. Real detectors will
 *     emit richer evidence; the validator is intentionally permissive
 *     about extra fields.
 */

import { describe, expect, it } from 'vitest'

import {
    type DefectClass,
    type Finding,
    type TargetSpec,
} from '../../../apps/web/audit/ui-ux/finding-schema'
import { validateFinding } from '../../../apps/web/audit/ui-ux/finding-validator'

// =============================================================================
// SECTION 1 — Per-class minimal valid evidence payloads. Each entry
// matches CLASS_EVIDENCE_REQUIREMENTS in `class-evidence-schema.ts`.
// Detectors will emit richer evidence at runtime; the validator only
// asserts presence + non-null value of these required keys.
// =============================================================================

const MINIMAL_EVIDENCE: Record<DefectClass, Record<string, unknown>> = {
    '1.1': {
        property: 'padding-top',
        computedValue: '14px',
        expectedToken: '--space-3 (12px) or --space-4 (16px)',
    },
    '1.2': {
        fontSize: '16px',
        fontWeight: 600,
        expectedTokenSet: '--text-*-size',
    },
    '1.3': {
        literal: '#1da1f2',
        nearestToken: '--fuxie-action',
        deltaE: 7.4,
    },
    '1.4': {
        nodeSelector: '[data-fixture="reward-leak-1-4"]',
        ancestorChain: 'main > [data-fixture="reward-leak-1-4"]',
        computedColorHex: '#FFB703',
    },
    '1.5': {
        kind: 'cta-overflows-container',
        firstSelector: '[data-fixture="cta-overflow-1-5"]',
        secondSelector: '[data-container="form"]',
        driftPx: 4,
    },
    '1.6': {
        routeA: 'apps/web/src/app/(learn)/dashboard/page.tsx',
        routeB: 'apps/web/src/app/(learn)/course/page.tsx',
        selectorA: '[data-pair="A"] .kpi-card',
        selectorB: '[data-pair="B"] .kpi-card',
        computedStyleA: { paddingTop: '12px', paddingBottom: '12px' },
        computedStyleB: { paddingTop: '16px', paddingBottom: '16px' },
        screenshotA: 'audit-reports/ui-ux/screens/1-6-A.png',
        screenshotB: 'audit-reports/ui-ux/screens/1-6-B.png',
    },
    '1.7': {
        stateKind: 'error',
        missingComponents: ['recovery-cta'],
        // Default to false; the auto-P0 path is exercised in its own
        // test block below with `exposesStackTrace: true`.
        exposesStackTrace: false,
    },
    '1.8': {
        containerSelector: '[data-fixture="overflow-1-8"]',
        overflowKind: 'fixed-width-truncation',
        syntheticString: 'Geschwindigkeitsbegrenzungsschild-Übung starten',
    },
    '1.9': {
        assetSelector: '[data-fixture="asset-oversize-1-9"]',
        assetAreaPx2: 135_000,
        primaryCtaAreaPx2: 15_092,
        aboveTheFoldShare: 0.54,
        pushesCtaBelowFold: true,
    },
}

interface FixtureSpec {
    defectClass: DefectClass
    severity: Finding['severity']
    forwardTo: TargetSpec | null
    action: Finding['action']
    extra?: Partial<Finding>
}

const VALID_FIXTURES: ReadonlyArray<FixtureSpec> = [
    { defectClass: '1.1', severity: 'P1', forwardTo: null, action: 'fix' },
    { defectClass: '1.2', severity: 'P1', forwardTo: null, action: 'fix' },
    { defectClass: '1.3', severity: 'P1', forwardTo: null, action: 'fix' },
    {
        defectClass: '1.4',
        severity: 'P0',
        forwardTo: 'gamified-ui-asset-rollout',
        action: 'forward',
    },
    { defectClass: '1.5', severity: 'P0', forwardTo: null, action: 'fix' },
    { defectClass: '1.6', severity: 'P1', forwardTo: null, action: 'fix' },
    { defectClass: '1.7', severity: 'P1', forwardTo: null, action: 'fix' },
    { defectClass: '1.8', severity: 'P1', forwardTo: null, action: 'fix' },
    {
        defectClass: '1.9',
        severity: 'P0',
        forwardTo: 'gamified-ui-asset-rollout',
        action: 'forward',
    },
]

function buildFinding(spec: FixtureSpec): Finding {
    const base: Finding = {
        defectClass: spec.defectClass,
        severity: spec.severity,
        route: 'apps/web/src/app/(learn)/dashboard/page.tsx',
        component: `[data-fixture="finding-${spec.defectClass}"]`,
        evidence: { ...MINIMAL_EVIDENCE[spec.defectClass] },
        expected: 'token-or-rule reference per bugfix.md § 2.x',
        screenshotPath: `audit-reports/ui-ux/screens/${spec.defectClass}.png`,
        forwardTo: spec.forwardTo,
        action: spec.action,
    }
    return { ...base, ...(spec.extra ?? {}) }
}

// =============================================================================
// SECTION 2 — Valid Findings pass.
// =============================================================================

describe('validateFinding — valid Findings pass', () => {
    for (const fixture of VALID_FIXTURES) {
        it(`accepts a well-formed Finding for defectClass=${fixture.defectClass}`, () => {
            const finding = buildFinding(fixture)
            const result = validateFinding(finding)
            expect(
                result.valid,
                `expected valid=true; errors=\n  - ${result.errors.join('\n  - ')}`,
            ).toBe(true)
            expect(result.errors).toEqual([])
        })
    }

    it('accepts a 1.4 Finding marked exempt="user-content" with non-P0 severity', () => {
        // bugfix.md § 1.4 condition 3 + § 2.4 iii: user-content exemption
        // suppresses the auto-P0 invariant. P1 must validate.
        const finding = buildFinding({
            defectClass: '1.4',
            severity: 'P1',
            forwardTo: 'gamified-ui-asset-rollout',
            action: 'forward',
            extra: { exempt: 'user-content' },
        })
        const result = validateFinding(finding)
        expect(
            result.valid,
            `expected valid=true; errors=\n  - ${result.errors.join('\n  - ')}`,
        ).toBe(true)
    })

    it('accepts a 1.7 Finding without stack-trace exposure at non-P0 severity', () => {
        // bugfix.md § 2.7 iii only forces auto-P0 when exposesStackTrace
        // is true; absent the flag, the severity follows § 2.10.
        const finding = buildFinding({
            defectClass: '1.7',
            severity: 'P2',
            forwardTo: null,
            action: 'fix',
        })
        const result = validateFinding(finding)
        expect(result.valid).toBe(true)
    })
})

// =============================================================================
// SECTION 3 — Findings missing any generic field are rejected.
// =============================================================================

const GENERIC_STRING_FIELDS = [
    'route',
    'component',
    'expected',
    'screenshotPath',
] as const

describe('validateFinding — missing generic field is rejected', () => {
    for (const field of GENERIC_STRING_FIELDS) {
        it(`rejects a Finding with empty ${field}`, () => {
            const finding = buildFinding({
                defectClass: '1.1',
                severity: 'P1',
                forwardTo: null,
                action: 'fix',
            })
            ;(finding as Record<string, unknown>)[field] = ''
            const result = validateFinding(finding)
            expect(result.valid).toBe(false)
            expect(result.errors.some((e) => e.includes(field))).toBe(true)
        })

        it(`rejects a Finding with ${field} omitted entirely`, () => {
            const finding = buildFinding({
                defectClass: '1.1',
                severity: 'P1',
                forwardTo: null,
                action: 'fix',
            })
            delete (finding as Record<string, unknown>)[field]
            const result = validateFinding(finding)
            expect(result.valid).toBe(false)
            expect(result.errors.some((e) => e.includes(field))).toBe(true)
        })
    }

    it('rejects a Finding with an invalid defectClass', () => {
        const finding = buildFinding({
            defectClass: '1.1',
            severity: 'P1',
            forwardTo: null,
            action: 'fix',
        })
        ;(finding as Record<string, unknown>).defectClass = '9.9'
        const result = validateFinding(finding)
        expect(result.valid).toBe(false)
        expect(result.errors.some((e) => e.includes('defectClass'))).toBe(true)
    })

    it('rejects a Finding with an invalid severity', () => {
        const finding = buildFinding({
            defectClass: '1.1',
            severity: 'P1',
            forwardTo: null,
            action: 'fix',
        })
        ;(finding as Record<string, unknown>).severity = 'P9'
        const result = validateFinding(finding)
        expect(result.valid).toBe(false)
        expect(result.errors.some((e) => e.includes('severity'))).toBe(true)
    })

    it('rejects a Finding with an invalid action', () => {
        const finding = buildFinding({
            defectClass: '1.1',
            severity: 'P1',
            forwardTo: null,
            action: 'fix',
        })
        ;(finding as Record<string, unknown>).action = 'patch'
        const result = validateFinding(finding)
        expect(result.valid).toBe(false)
        expect(result.errors.some((e) => e.includes('action'))).toBe(true)
    })

    it('rejects a Finding with an invalid forwardTo', () => {
        const finding = buildFinding({
            defectClass: '1.1',
            severity: 'P1',
            forwardTo: null,
            action: 'fix',
        })
        ;(finding as Record<string, unknown>).forwardTo = 'unknown-spec'
        const result = validateFinding(finding)
        expect(result.valid).toBe(false)
        expect(result.errors.some((e) => e.includes('forwardTo'))).toBe(true)
    })

    it('rejects a Finding where action="forward" but forwardTo is null', () => {
        // design.md § Glossary entry "Forward" — forwarded findings
        // MUST identify the receiving spec.
        const finding = buildFinding({
            defectClass: '1.4',
            severity: 'P0',
            forwardTo: null,
            action: 'forward',
        })
        const result = validateFinding(finding)
        expect(result.valid).toBe(false)
        expect(
            result.errors.some((e) => e.includes('action="forward"')),
        ).toBe(true)
    })

    it('rejects a non-object candidate', () => {
        // Defensive: validator must not crash on garbage inputs that
        // sneak past the TypeScript types (e.g. JSON parsed from disk).
        const result = validateFinding(null)
        expect(result.valid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(0)
    })
})

// =============================================================================
// SECTION 4 — Findings missing class-specific evidence keys are rejected.
// =============================================================================

describe('validateFinding — missing class-specific evidence is rejected', () => {
    for (const fixture of VALID_FIXTURES) {
        const required = Object.keys(MINIMAL_EVIDENCE[fixture.defectClass])
        for (const key of required) {
            it(`rejects defectClass=${fixture.defectClass} when evidence.${key} is missing`, () => {
                const finding = buildFinding(fixture)
                const evidence = { ...finding.evidence }
                delete evidence[key]
                finding.evidence = evidence
                const result = validateFinding(finding)
                expect(result.valid).toBe(false)
                expect(
                    result.errors.some(
                        (e) =>
                            e.includes(`defectClass=${fixture.defectClass}`) &&
                            e.includes(key),
                    ),
                ).toBe(true)
            })

            it(`rejects defectClass=${fixture.defectClass} when evidence.${key} is null`, () => {
                const finding = buildFinding(fixture)
                finding.evidence = { ...finding.evidence, [key]: null }
                const result = validateFinding(finding)
                expect(result.valid).toBe(false)
                expect(
                    result.errors.some(
                        (e) =>
                            e.includes(`defectClass=${fixture.defectClass}`) &&
                            e.includes(key),
                    ),
                ).toBe(true)
            })
        }
    }

    it('rejects a Finding whose evidence is not an object', () => {
        const finding = buildFinding({
            defectClass: '1.1',
            severity: 'P1',
            forwardTo: null,
            action: 'fix',
        })
        ;(finding as Record<string, unknown>).evidence = 'not-an-object'
        const result = validateFinding(finding)
        expect(result.valid).toBe(false)
        expect(result.errors.some((e) => e.includes('evidence'))).toBe(true)
    })
})

// =============================================================================
// SECTION 5 — Auto-P0 invariants are enforced (bugfix.md § 2.4 ii,
// § 2.7 iii).
// =============================================================================

describe('validateFinding — auto-P0 invariants', () => {
    it('rejects defectClass="1.4" non-exempt with severity="P1"', () => {
        const finding = buildFinding({
            defectClass: '1.4',
            severity: 'P1',
            forwardTo: 'gamified-ui-asset-rollout',
            action: 'forward',
        })
        const result = validateFinding(finding)
        expect(result.valid).toBe(false)
        expect(
            result.errors.some((e) =>
                e.includes('defectClass="1.4" non-exempt MUST have severity="P0"'),
            ),
        ).toBe(true)
    })

    it('rejects defectClass="1.4" non-exempt with severity="P2"', () => {
        const finding = buildFinding({
            defectClass: '1.4',
            severity: 'P2',
            forwardTo: 'gamified-ui-asset-rollout',
            action: 'forward',
        })
        const result = validateFinding(finding)
        expect(result.valid).toBe(false)
        expect(
            result.errors.some((e) =>
                e.includes('defectClass="1.4" non-exempt MUST have severity="P0"'),
            ),
        ).toBe(true)
    })

    it('rejects defectClass="1.7" with exposesStackTrace=true and severity="P1"', () => {
        const finding = buildFinding({
            defectClass: '1.7',
            severity: 'P1',
            forwardTo: null,
            action: 'fix',
        })
        finding.evidence = {
            ...finding.evidence,
            exposesStackTrace: true,
        }
        const result = validateFinding(finding)
        expect(result.valid).toBe(false)
        expect(
            result.errors.some((e) =>
                e.includes(
                    'defectClass="1.7" with evidence.exposesStackTrace=true MUST have severity="P0"',
                ),
            ),
        ).toBe(true)
    })

    it('rejects defectClass="1.7" with exposesStackTrace=true and severity="P2"', () => {
        const finding = buildFinding({
            defectClass: '1.7',
            severity: 'P2',
            forwardTo: null,
            action: 'fix',
        })
        finding.evidence = {
            ...finding.evidence,
            exposesStackTrace: true,
        }
        const result = validateFinding(finding)
        expect(result.valid).toBe(false)
        expect(
            result.errors.some((e) =>
                e.includes(
                    'defectClass="1.7" with evidence.exposesStackTrace=true MUST have severity="P0"',
                ),
            ),
        ).toBe(true)
    })

    it('rejects exempt with an invalid value', () => {
        const finding = buildFinding({
            defectClass: '1.4',
            severity: 'P0',
            forwardTo: 'gamified-ui-asset-rollout',
            action: 'forward',
        })
        ;(finding as Record<string, unknown>).exempt = 'random-string'
        const result = validateFinding(finding)
        expect(result.valid).toBe(false)
        expect(result.errors.some((e) => e.includes('exempt'))).toBe(true)
    })

    it('rejects exempt="user-content" on a non-1.4 defect class', () => {
        const finding = buildFinding({
            defectClass: '1.5',
            severity: 'P0',
            forwardTo: null,
            action: 'fix',
        })
        ;(finding as Record<string, unknown>).exempt = 'user-content'
        const result = validateFinding(finding)
        expect(result.valid).toBe(false)
        expect(
            result.errors.some((e) =>
                e.includes('exempt="user-content" is only valid for defectClass="1.4"'),
            ),
        ).toBe(true)
    })
})
