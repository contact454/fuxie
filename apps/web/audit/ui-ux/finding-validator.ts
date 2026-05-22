/**
 * finding-validator.ts — Runtime validator for unified Findings.
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
 *     evidence requirements; the table lives in
 *     `./class-evidence-schema.ts`).
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/design.md § Fix Implementation
 *     item 1 ("Findings missing required generic fields or
 *     class-specific evidence MUST be rejected before publish").
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/tasks.md task 3.1.
 *
 * Behaviour summary:
 *   - Validates the candidate is a plain object.
 *   - Requires non-empty strings for `route`, `component`, `expected`,
 *     `screenshotPath`.
 *   - Requires `defectClass`, `severity`, and `action` to be members
 *     of their closed enumerations.
 *   - Requires `forwardTo` to be `null` or a member of
 *     `ALLOWED_TARGET_SPECS`.
 *   - Enforces `action === "forward" ⇒ forwardTo !== null` (action /
 *     forwardTo coherence implied by `bugfix.md` § Introduction
 *     § Finding Schema and § 2.4 ii).
 *   - Requires `evidence` to be a plain object whose keys cover the
 *     class-specific evidence keys declared in
 *     `./class-evidence-schema.ts`. Missing keys, `undefined`, or
 *     `null` values are rejected.
 *   - Encodes auto-P0 invariants:
 *       * `defectClass === "1.4"` and `exempt !== "user-content"` ⇒
 *         `severity === "P0"`.
 *       * `defectClass === "1.7"` and `evidence.exposesStackTrace ===
 *         true` ⇒ `severity === "P0"`.
 *   - Returns a structured `ValidationResult` with `errors[]` rather
 *     than throwing — callers (detectors, the entry point in task
 *     3.14, CI gate) decide how to react.
 *
 * The local validator mirror in `tests/audit/ui-ux/exploration.spec.ts`
 * mirrors this behaviour exactly so the exploration test will pass
 * unchanged after task 3.16 flips its import here.
 */

import {
    ALLOWED_ACTIONS,
    ALLOWED_DEFECT_CLASSES,
    ALLOWED_SEVERITIES,
    ALLOWED_TARGET_SPECS,
    type DefectClass,
    type FindingAction,
    type Severity,
    type TargetSpec,
} from './finding-schema'
import { CLASS_EVIDENCE_REQUIREMENTS } from './class-evidence-schema'

/**
 * Result returned by `validateFinding`. `valid` is `true` only when
 * `errors.length === 0`. Detectors and the audit entry point (task
 * 3.14) MUST drop findings whose validation result is invalid before
 * publishing the report.
 */
export interface ValidationResult {
    valid: boolean
    /**
     * Human-readable reasons the candidate was rejected. Empty when
     * the candidate is a fully-shaped Finding. Each entry is meant to
     * be safe to surface in test reports and CI logs.
     */
    errors: ReadonlyArray<string>
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.length > 0
}

function isDefectClass(value: unknown): value is DefectClass {
    return (
        typeof value === 'string' &&
        (ALLOWED_DEFECT_CLASSES as ReadonlyArray<string>).includes(value)
    )
}

function isSeverity(value: unknown): value is Severity {
    return (
        typeof value === 'string' &&
        (ALLOWED_SEVERITIES as ReadonlyArray<string>).includes(value)
    )
}

function isFindingAction(value: unknown): value is FindingAction {
    return (
        typeof value === 'string' &&
        (ALLOWED_ACTIONS as ReadonlyArray<string>).includes(value)
    )
}

function isTargetSpec(value: unknown): value is TargetSpec {
    return (
        typeof value === 'string' &&
        (ALLOWED_TARGET_SPECS as ReadonlyArray<string>).includes(value)
    )
}

/**
 * Validate a Finding candidate against the unified schema and the
 * auto-P0 invariants from `bugfix.md` § 2.4 and § 2.7. The function
 * does NOT throw — callers inspect `result.errors`.
 */
export function validateFinding(candidate: unknown): ValidationResult {
    const errors: string[] = []

    if (!isPlainObject(candidate)) {
        return {
            valid: false,
            errors: [
                'candidate is not a plain object (Finding Schema requires a JSON object)',
            ],
        }
    }

    // ---- Generic string fields (bugfix.md § Introduction § Finding Schema) --
    if (!isNonEmptyString(candidate.route)) {
        errors.push('missing or empty field: route')
    }
    if (!isNonEmptyString(candidate.component)) {
        errors.push('missing or empty field: component')
    }
    if (!isNonEmptyString(candidate.expected)) {
        errors.push('missing or empty field: expected')
    }
    if (!isNonEmptyString(candidate.screenshotPath)) {
        errors.push('missing or empty field: screenshotPath')
    }

    // ---- Closed enumerations -------------------------------------------------
    if (!isDefectClass(candidate.defectClass)) {
        errors.push(
            `invalid defectClass (got ${JSON.stringify(candidate.defectClass)}; expected one of ${ALLOWED_DEFECT_CLASSES.join(', ')})`,
        )
    }
    if (!isSeverity(candidate.severity)) {
        errors.push(
            `invalid severity (got ${JSON.stringify(candidate.severity)}; expected one of ${ALLOWED_SEVERITIES.join(', ')})`,
        )
    }
    if (!isFindingAction(candidate.action)) {
        errors.push(
            `invalid action (got ${JSON.stringify(candidate.action)}; expected one of ${ALLOWED_ACTIONS.join(', ')})`,
        )
    }

    // ---- forwardTo (null or TargetSpec) -------------------------------------
    const forwardTo = candidate.forwardTo
    if (forwardTo !== null && !isTargetSpec(forwardTo)) {
        errors.push(
            `invalid forwardTo (got ${JSON.stringify(forwardTo)}; expected null or one of ${ALLOWED_TARGET_SPECS.join(', ')})`,
        )
    }

    // ---- action / forwardTo coherence ---------------------------------------
    // bugfix.md § 2.4 ii forwards 1.4 findings to gamified-ui-asset-rollout
    // with action="forward". design.md § Glossary entry "Forward" makes
    // explicit that any "forward" action requires a non-null targetSpec.
    if (candidate.action === 'forward' && (forwardTo === null || forwardTo === undefined)) {
        errors.push('action="forward" requires non-null forwardTo')
    }

    // ---- exempt (only valid on 1.4) ------------------------------------------
    // bugfix.md § 1.4 condition 3 reserves `exempt: "user-content"` for
    // user-uploaded content. Other defect classes carrying `exempt` are
    // off-contract.
    if (candidate.exempt !== undefined) {
        if (candidate.exempt !== 'user-content') {
            errors.push(
                `invalid exempt value (got ${JSON.stringify(candidate.exempt)}; only "user-content" is allowed)`,
            )
        } else if (candidate.defectClass !== '1.4') {
            errors.push(
                `exempt="user-content" is only valid for defectClass="1.4" (got ${JSON.stringify(candidate.defectClass)})`,
            )
        }
    }

    // ---- evidence object + per-class keys (bugfix.md § 2.11) -----------------
    const evidence = candidate.evidence
    if (!isPlainObject(evidence)) {
        errors.push('evidence missing or not a plain object')
    } else if (isDefectClass(candidate.defectClass)) {
        const required = CLASS_EVIDENCE_REQUIREMENTS[candidate.defectClass]
        for (const key of required) {
            if (
                !(key in evidence) ||
                evidence[key] === undefined ||
                evidence[key] === null
            ) {
                errors.push(
                    `evidence missing required key for defectClass=${candidate.defectClass}: ${key}`,
                )
            }
        }
    }

    // ---- Auto-P0 invariants --------------------------------------------------
    // bugfix.md § 2.4 ii — non-exempt 1.4 MUST be P0.
    if (
        candidate.defectClass === '1.4' &&
        candidate.exempt !== 'user-content' &&
        candidate.severity !== 'P0'
    ) {
        errors.push(
            'defectClass="1.4" non-exempt MUST have severity="P0" (bugfix.md § 2.4 ii)',
        )
    }
    // bugfix.md § 2.7 iii — 1.7 exposing a stack trace MUST be P0.
    if (
        candidate.defectClass === '1.7' &&
        isPlainObject(evidence) &&
        evidence.exposesStackTrace === true &&
        candidate.severity !== 'P0'
    ) {
        errors.push(
            'defectClass="1.7" with evidence.exposesStackTrace=true MUST have severity="P0" (bugfix.md § 2.7 iii)',
        )
    }

    return { valid: errors.length === 0, errors }
}
