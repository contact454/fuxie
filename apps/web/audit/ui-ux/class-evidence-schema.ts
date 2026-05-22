/**
 * class-evidence-schema.ts — Per-class evidence requirements.
 *
 * Vai chinh: QA Automation Engineer
 * Vai phoi hop: Frontend Engineer, Product Designer
 *
 * Spec source-of-truth:
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/bugfix.md § 2.11 (Required
 *     Evidence per finding) and the per-class clauses § 2.1–§ 2.9
 *     that cite specific evidence fields.
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/design.md § Fix Implementation
 *     item 4 ("Encode evidence schema per class 2.11").
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/tasks.md task 3.1.
 *
 * The contract: each defect class lists the evidence keys whose
 * presence and non-null value the validator rejects without. The
 * keys are intentionally narrow — they are the minimum necessary
 * for downstream triage; detectors may add richer fields, but
 * they MUST include at least these.
 *
 * The local mirror in `tests/audit/ui-ux/exploration.spec.ts`
 * (`EVIDENCE_KEY_REQUIREMENTS`) intentionally matches this table
 * verbatim so flipping the import after task 3.16 is a no-op
 * semantically.
 */

import type { DefectClass } from './finding-schema'

/**
 * Required evidence keys per defect class. Keys MUST be present in
 * `Finding.evidence` and MUST NOT be `null` or `undefined` for the
 * finding to validate.
 *
 * Notes per class:
 *   - 1.1 Spacing (`bugfix.md` § 2.1): which property drifted, what
 *     value was computed, and which token was expected.
 *   - 1.2 Typography (`bugfix.md` § 2.2): the offending font-size /
 *     font-weight pair plus the canonical token set the value should
 *     belong to.
 *   - 1.3 Color (`bugfix.md` § 2.3): the literal value found, the
 *     nearest canonical token, and the CIEDE2000 ΔE distance.
 *   - 1.4 Reward containment (`bugfix.md` § 2.4): the offending DOM
 *     selector, its ancestor chain (used to prove no
 *     `[data-reward-state]` ancestor exists), and the computed colour
 *     in sRGB hex.
 *   - 1.5 Alignment (`bugfix.md` § 2.5): which kind of misalignment,
 *     the two selectors involved, and the drift in pixels.
 *   - 1.6 Component pattern (`bugfix.md` § 2.6 iii): paired evidence
 *     — two routes, two selectors, two computed-style snapshots, two
 *     screenshots. The validator rejects unpaired findings.
 *   - 1.7 State quality (`bugfix.md` § 2.7): which state kind, which
 *     required components are missing, and whether a stack trace was
 *     exposed (drives the auto-P0 invariant).
 *   - 1.8 Text overflow (`bugfix.md` § 2.8): the container selector,
 *     the kind of overflow detected, and the synthetic string used to
 *     trigger it.
 *   - 1.9 Asset rhythm (`bugfix.md` § 2.9): the asset selector, area
 *     measurements, above-the-fold share, and whether the asset
 *     pushes the primary CTA below the fold.
 */
export const CLASS_EVIDENCE_REQUIREMENTS: Readonly<
    Record<DefectClass, ReadonlyArray<string>>
> = {
    '1.1': ['property', 'computedValue', 'expectedToken'],
    '1.2': ['fontSize', 'fontWeight', 'expectedTokenSet'],
    '1.3': ['literal', 'nearestToken', 'deltaE'],
    '1.4': ['nodeSelector', 'ancestorChain', 'computedColorHex'],
    '1.5': ['kind', 'firstSelector', 'secondSelector', 'driftPx'],
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

/**
 * Returns the required evidence keys for a defect class. A thin
 * wrapper so call sites read declaratively.
 */
export function evidenceKeysFor(defectClass: DefectClass): ReadonlyArray<string> {
    return CLASS_EVIDENCE_REQUIREMENTS[defectClass]
}
