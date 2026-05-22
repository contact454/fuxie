/**
 * finding-schema.ts — Unified Finding Schema for `auditPass'`.
 *
 * Vai chinh: QA Automation Engineer
 * Vai phoi hop: Frontend Engineer, Product Designer
 *
 * Spec source-of-truth:
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/bugfix.md § Introduction
 *     § Finding Schema (canonical generic fields).
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/bugfix.md § 2.10 (severity)
 *     and § 2.11 (per-class evidence).
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/design.md § Fix Implementation
 *     item 1 (Finding Schema is the contract every detector emits).
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/tasks.md task 3.1.
 *
 * This module declares the TypeScript types only. Runtime validation
 * (including auto-P0 invariants and per-class evidence checks) lives
 * in `./finding-validator.ts`. Per-class evidence-key requirements
 * live in `./class-evidence-schema.ts`.
 *
 * Tests/audit/ui-ux/exploration.spec.ts and preservation.spec.ts
 * deliberately duplicate this contract inline so they remain
 * self-contained while still being able to flip to importing from
 * here after task 3.16. Any change here MUST keep the local mirrors
 * in those tests in semantic sync until that flip happens.
 */

/** Defect classes per `bugfix.md` § Bug Analysis 1.1–1.9. */
export type DefectClass =
    | '1.1'
    | '1.2'
    | '1.3'
    | '1.4'
    | '1.5'
    | '1.6'
    | '1.7'
    | '1.8'
    | '1.9'

/** Severity per `bugfix.md` § Severity Definition + § 2.10 mapping. */
export type Severity = 'P0' | 'P1' | 'P2'

/**
 * Spec routing targets for findings whose fix is owned by a sibling
 * spec. Source: `bugfix.md` § Scope (Out) and design.md
 * § Glossary entry "Forward".
 */
export type TargetSpec =
    | 'gamified-ui-asset-rollout'
    | 'learner-copy-localization-backfill'
    | 'visual-qa-screenshot-capture'
    | 'asset-registry-cleanup'

/**
 * Action taken on a finding by `auditPass'`. `"fix"` means the fix is
 * inside this spec's scope; `"forward"` means the fix is owned by
 * another spec and `forwardTo` MUST be set.
 */
export type FindingAction = 'fix' | 'forward'

/**
 * Unified Finding shape. Every detector under
 * `apps/web/audit/ui-ux/detectors/*` MUST emit objects that pass
 * `validateFinding` from `./finding-validator.ts`.
 *
 * The fields match `bugfix.md` § Introduction § Finding Schema, with
 * two additions made explicit for downstream tooling:
 *   - `action`: required by design.md § Fix Implementation item 1 to
 *     distinguish in-scope fixes from forwards.
 *   - `exempt`: optional marker, present only for `defectClass = "1.4"`
 *     when the node is user-content per `bugfix.md` § 1.4 condition 3.
 */
export interface Finding {
    defectClass: DefectClass
    severity: Severity
    /**
     * Route path under `apps/web/src/app/(learn)/**`. For paired
     * findings (defectClass `"1.6"`) this MAY be a composite string
     * `"<routeA> + <routeB>"` for human-readable display; the paired
     * routes MUST also be present in `evidence.routeA` /
     * `evidence.routeB` per the per-class evidence schema.
     */
    route: string
    /** React component path or DOM selector that pinpoints the node. */
    component: string
    /**
     * Class-specific evidence payload. Shape is enforced at runtime by
     * `validateFinding` against the table in `./class-evidence-schema.ts`.
     */
    evidence: Record<string, unknown>
    /**
     * Token reference, rule reference, or short prose describing the
     * expected (correct) behavior. MUST be non-empty.
     */
    expected: string
    /** Path to the ≤ 480px screenshot capturing the defect. */
    screenshotPath: string
    /**
     * Spec to forward to when the fix is owned elsewhere; `null` when
     * the fix lives inside this spec.
     */
    forwardTo: TargetSpec | null
    /**
     * `"fix"` means in-scope; `"forward"` means out-of-scope and
     * `forwardTo` MUST be a non-null `TargetSpec` value.
     */
    action: FindingAction
    /**
     * Set ONLY when `defectClass === "1.4"` and the node is
     * user-uploaded content per `bugfix.md` § 1.4 condition 3.
     * Exempt findings are NOT P0 and do NOT fail the audit run gate.
     */
    exempt?: 'user-content'
}

/** Closed enumeration of allowed defect classes. */
export const ALLOWED_DEFECT_CLASSES: ReadonlyArray<DefectClass> = [
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

/** Closed enumeration of allowed severities. */
export const ALLOWED_SEVERITIES: ReadonlyArray<Severity> = ['P0', 'P1', 'P2']

/** Closed enumeration of allowed forward targets. */
export const ALLOWED_TARGET_SPECS: ReadonlyArray<TargetSpec> = [
    'gamified-ui-asset-rollout',
    'learner-copy-localization-backfill',
    'visual-qa-screenshot-capture',
    'asset-registry-cleanup',
]

/** Closed enumeration of allowed actions. */
export const ALLOWED_ACTIONS: ReadonlyArray<FindingAction> = ['fix', 'forward']
