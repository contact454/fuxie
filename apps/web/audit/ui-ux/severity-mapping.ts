/**
 * severity-mapping.ts — Encode the severity table from
 * `bugfix.md` § 2.10 as code.
 *
 * Vai chinh: QA Automation Engineer
 * Vai phoi hop: Frontend Engineer, Product Designer
 *
 * Spec source-of-truth:
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/bugfix.md § 2.10
 *     (Severity Mapping per defect class) — the canonical table
 *     this module encodes.
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/bugfix.md § 2.4 ii
 *     (auto-P0 for every non-exempt 1.4 finding) and § 2.7 iii
 *     (auto-P0 when 1.7 exposes a stack trace).
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/design.md § Fix
 *     Implementation item 3 ("Encode severity mapping `2.10`
 *     as code. Severity is assigned by detector, not by
 *     the test reader").
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/tasks.md task 3.2.
 *
 * Contract:
 *   - `assignSeverity(defectClass, qualifiers): "P0" | "P1" | "P2"`
 *     is total — every (class, qualifier) pair from the § 2.10
 *     table maps to exactly one severity. Each branch cites the
 *     row in § 2.10 it implements.
 *   - The qualifier shape is shared: detectors may leave fields
 *     they do not measure as `undefined`; the function is
 *     conservative and falls through to the lowest severity row
 *     consistent with the qualifier set.
 *   - Numeric thresholds from § 2.10 are exported as named
 *     constants so detectors and unit tests reference the same
 *     values rather than duplicating literals.
 *
 * Severity is assigned by code only. The `tests/audit/ui-ux/
 * severity-mapping.spec.ts` suite covers every row of the table
 * and asserts the mapping is reproducible.
 */

import type { DefectClass, Severity } from './finding-schema'

// =============================================================================
// SECTION 1 — Numeric thresholds from `bugfix.md` § 2.10 + supporting clauses.
// =============================================================================

/**
 * Touch target minimum size in px on each axis. Below this, a 1.1
 * spacing violation that breaks the target is auto-P0
 * (`bugfix.md` § 2.10 row 1.1 P0).
 *
 * 44×44 CSS px is the WCAG 2.5.5 / Apple HIG floor adopted by the
 * audit; any computed click/tap region smaller than this on either
 * axis is considered "broken".
 */
export const TOUCH_TARGET_MIN_PX = 44

/**
 * 1.1 P2 row in § 2.10: a single-instance off-token spacing drift
 * inside ±1 to ±3 px is the polish-only band. Drifts > 3 px are
 * not P2 — they fall through to the cross-route P1 row when they
 * are also a cross-route inconsistency, otherwise they remain P2
 * by default since `bugfix.md` does not split that case further.
 */
export const SPACING_P2_MIN_DRIFT_PX = 1
export const SPACING_P2_MAX_DRIFT_PX = 3

/**
 * 1.3 row in § 2.10: the `--fuxie-energy` viewport-area share is
 * a violation when it exceeds 5 % (`bugfix.md` § 1.3 condition 5
 * and § 2.3 v).
 */
export const FUXIE_ENERGY_MAX_VIEWPORT_SHARE = 0.05

/**
 * 1.3 row in § 2.10 P2: CIEDE2000 ΔE strictly between 0 and 3
 * against the nearest canonical Bright Sky token ⇒ "near token"
 * (`bugfix.md` § 1.3 condition 4 and § 2.3 iv).
 */
export const NEAR_TOKEN_DELTA_E_MIN_EXCLUSIVE = 0
export const NEAR_TOKEN_DELTA_E_MAX_EXCLUSIVE = 3

/**
 * 1.5 alignment thresholds from § 2.10:
 *   - P0: drift ≥ 4 px on primary task surface.
 *   - P1: sibling start-edge drift 2–3 px; center-axis drift 3–4 px.
 *   - P2: drift ≤ 2 px outside primary task surface.
 */
export const ALIGNMENT_P0_MIN_DRIFT_PX = 4
export const ALIGNMENT_P1_DRIFT_RANGE_PX: readonly [number, number] = [2, 3]
export const ALIGNMENT_P2_MAX_DRIFT_PX = 2

/**
 * 1.6 P2 row in § 2.10: KPI card border-radius drift ≤ 2 px is
 * polish-only.
 */
export const COMPONENT_PATTERN_P2_MAX_DRIFT_PX = 2

/**
 * 1.9 P1 row: the asset visual-area / primary-CTA visual-area
 * ratio is a violation above 2.0 (`bugfix.md` § 1.9 condition b
 * and § 2.9 ii).
 */
export const ASSET_AREA_RATIO_P1_THRESHOLD = 2.0

/**
 * 1.9 spacing-drift bands in § 2.10:
 *   - P1: spacing drift > 2 px around the hero illustration.
 *   - P2: spacing drift 1–2 px.
 */
export const ASSET_RHYTHM_P1_MIN_DRIFT_PX_EXCLUSIVE = 2
export const ASSET_RHYTHM_P2_DRIFT_RANGE_PX: readonly [number, number] = [1, 2]

// =============================================================================
// SECTION 2 — Qualifier shape.
// =============================================================================

/**
 * Qualifiers describe everything a detector measured about the
 * candidate finding that the § 2.10 table cares about. Every
 * field is optional; detectors set only those that are relevant
 * to the defect class they emit.
 *
 * Field reference (each cites the § 2.10 row that consumes it):
 *
 *   - `isPrimaryTaskSurface` — true when the route is one of the
 *     lesson player / exercise screens (`(learn)/listening`,
 *     `(learn)/reading`, `(learn)/writing`, `(learn)/speaking`,
 *     `(learn)/grammar`, `(learn)/vocabulary`) or `(learn)/dashboard`
 *     (design.md § Glossary entry "Primary task surface").
 *
 *   - `hasOverlapOrTouchTargetBreak` — 1.1 P0: spacing causes
 *     overlap with neighbour, OR computed tap-target falls below
 *     `TOUCH_TARGET_MIN_PX` on either axis.
 *
 *   - `isHeadingVsBody` — 1.2 P0: heading and adjacent body share
 *     the same `font-size` and `font-weight` so the heading is
 *     indistinguishable. False when only the body↔caption pair
 *     is too close (that is the 1.2 P1 row).
 *
 *   - `isCrossRouteInconsistency` — 1.1 P1 row: same component
 *     role renders with different spacing across two `(learn)/**`
 *     routes (no state-attribute explains the diff).
 *
 *   - `isLiteralHexNamedColor` — 1.3 P1 row when paired with
 *     `isPrimaryCta`: literal hex / named CSS color used on the
 *     primary CTA.
 *
 *   - `isPrimaryCta` — true when the offending node is the
 *     primary CTA of its surface. Combined with
 *     `isLiteralHexNamedColor` to elevate 1.3 to P1 per § 2.10.
 *
 *   - `fuxieEnergyShareExceeds5Percent` — 1.3 P1/P2 row: the
 *     measured `--fuxie-energy` viewport-area share is above
 *     `FUXIE_ENERGY_MAX_VIEWPORT_SHARE`. Whether it lands on
 *     P1 or P2 depends on `isLessonPlayer`.
 *
 *   - `isLessonPlayer` — refines 1.3 P1 vs P2 for `--fuxie-energy`
 *     overshoot per § 2.10 ("`--fuxie-energy` > 5% on lesson
 *     player" is P1; on other surfaces is P2).
 *
 *   - `ctaOverflowsContainer` — 1.5 P0: CTA bounding rect
 *     overlaps container by > 0 px so the CTA is partly
 *     un-tappable.
 *
 *   - `alignmentDriftPx` — 1.5 numeric driver: |drift| in CSS
 *     pixels. Combined with `isPrimaryTaskSurface` to bucket P0
 *     vs P1 vs P2.
 *
 *   - `is1_2_BodyVsCaption` — 1.2 P1 row: body↔caption pair on
 *     primary task surface is too close OR exceeds the 3-combo
 *     limit OR uses a font-size literal off-token.
 *
 *   - `is1_2_SecondaryBlockOnly` — 1.2 P2 row: the violation is
 *     contained inside a secondary block (footer, meta) rather
 *     than the main content body.
 *
 *   - `isModalLayoutDriftFullAction` — 1.6 P0 row: the same
 *     action's modal renders with full layout drift across two
 *     surfaces.
 *
 *   - `isCtaPaddingDashboardVsLesson` — 1.6 P1 row: primary CTA
 *     padding differs between dashboard and lesson routes.
 *
 *   - `componentPatternDriftPx` — 1.6 P2 numeric driver: the
 *     component-pattern drift in CSS pixels (e.g. KPI card
 *     border-radius). Drifts ≤ `COMPONENT_PATTERN_P2_MAX_DRIFT_PX`
 *     are P2.
 *
 *   - `exposesStackTrace` — 1.7 P0 row (auto): `error.tsx` leaks
 *     a runtime stack trace to the learner.
 *
 *   - `is1_7_EmptyMissingMessageOrCta` / `is1_7_NotFoundMissingRecovery`
 *     — 1.7 P1 row.
 *
 *   - `is1_7_LoadingSpinnerOnly` / `is1_7_EmptyMissingVisual` —
 *     1.7 P2 row.
 *
 *   - `is1_8_CtaLabelTruncated` / `is1_8_PrimaryHeadingWrapOverlap`
 *     — 1.8 P0 row.
 *
 *   - `is1_8_BodyDescriptionTruncatedNotReadableElsewhere` —
 *     1.8 P1 row.
 *
 *   - `is1_8_SecondaryDescriptionTruncatedReadableElsewhere` —
 *     1.8 P2 row.
 *
 *   - `assetPushesCtaBelowFold` — 1.9 P0 row: hero asset pushes
 *     the primary CTA below the 375×667 fold.
 *
 *   - `assetAreaRatioVsCta` — 1.9 P1 numeric driver: asset visual
 *     area / primary CTA visual area. Above
 *     `ASSET_AREA_RATIO_P1_THRESHOLD` ⇒ P1.
 *
 *   - `assetSpacingDriftPx` — 1.9 P1/P2 numeric driver around the
 *     hero. > 2 px ⇒ P1; 1–2 px ⇒ P2.
 *
 *   - `nearTokenDeltaE` — 1.3 P2 numeric driver: CIEDE2000 ΔE
 *     against the nearest Bright Sky token. Strictly between
 *     `NEAR_TOKEN_DELTA_E_MIN_EXCLUSIVE` and
 *     `NEAR_TOKEN_DELTA_E_MAX_EXCLUSIVE` ⇒ P2.
 *
 *   - `spacingDriftPx` — 1.1 P2 numeric driver. Single-instance
 *     off-token drift in ±[`SPACING_P2_MIN_DRIFT_PX`,
 *     `SPACING_P2_MAX_DRIFT_PX`] ⇒ P2.
 *
 *   - `is1_4_Exempt` — 1.4 row exception flag for user-content
 *     (`bugfix.md` § 2.4 iii). When true, severity follows the
 *     caller's normal mapping (1.4 exempt findings are not P0).
 *     The validator is the actual gate; this flag exists so the
 *     mapping function can fall through cleanly.
 */
export interface SeverityQualifiers {
    // Surface qualifiers.
    isPrimaryTaskSurface?: boolean
    isLessonPlayer?: boolean
    isPrimaryCta?: boolean

    // 1.1 Spacing.
    hasOverlapOrTouchTargetBreak?: boolean
    isCrossRouteInconsistency?: boolean
    spacingDriftPx?: number

    // 1.2 Typography.
    isHeadingVsBody?: boolean
    is1_2_BodyVsCaption?: boolean
    is1_2_SecondaryBlockOnly?: boolean

    // 1.3 Color.
    isLiteralHexNamedColor?: boolean
    fuxieEnergyShareExceeds5Percent?: boolean
    nearTokenDeltaE?: number

    // 1.4 Reward containment.
    is1_4_Exempt?: boolean

    // 1.5 Alignment.
    ctaOverflowsContainer?: boolean
    alignmentDriftPx?: number

    // 1.6 Component pattern.
    isModalLayoutDriftFullAction?: boolean
    isCtaPaddingDashboardVsLesson?: boolean
    componentPatternDriftPx?: number

    // 1.7 State quality.
    exposesStackTrace?: boolean
    is1_7_EmptyMissingMessageOrCta?: boolean
    is1_7_NotFoundMissingRecovery?: boolean
    is1_7_LoadingSpinnerOnly?: boolean
    is1_7_EmptyMissingVisual?: boolean

    // 1.8 Text overflow.
    is1_8_CtaLabelTruncated?: boolean
    is1_8_PrimaryHeadingWrapOverlap?: boolean
    is1_8_BodyDescriptionTruncatedNotReadableElsewhere?: boolean
    is1_8_SecondaryDescriptionTruncatedReadableElsewhere?: boolean

    // 1.9 Asset rhythm.
    assetPushesCtaBelowFold?: boolean
    assetAreaRatioVsCta?: number
    assetSpacingDriftPx?: number
}

// =============================================================================
// SECTION 3 — `assignSeverity` per `bugfix.md` § 2.10.
// =============================================================================

/**
 * Assign the severity that `bugfix.md` § 2.10 mandates for the
 * given `(defectClass, qualifiers)` pair. Pure function — same
 * input always yields the same output, so detectors and tests can
 * call it freely.
 *
 * The decision tree below mirrors the § 2.10 table row by row,
 * highest severity first, falling through to the next row only if
 * the qualifier(s) for the higher severity are absent. Each branch
 * is annotated with the table row it implements.
 */
export function assignSeverity(
    defectClass: DefectClass,
    qualifiers: SeverityQualifiers,
): Severity {
    switch (defectClass) {
        case '1.1':
            return assignSeverity_1_1(qualifiers)
        case '1.2':
            return assignSeverity_1_2(qualifiers)
        case '1.3':
            return assignSeverity_1_3(qualifiers)
        case '1.4':
            return assignSeverity_1_4(qualifiers)
        case '1.5':
            return assignSeverity_1_5(qualifiers)
        case '1.6':
            return assignSeverity_1_6(qualifiers)
        case '1.7':
            return assignSeverity_1_7(qualifiers)
        case '1.8':
            return assignSeverity_1_8(qualifiers)
        case '1.9':
            return assignSeverity_1_9(qualifiers)
        default: {
            // Defensive: TypeScript already narrows `defectClass`
            // to the closed enumeration. This branch exists so a
            // future class addition is caught at compile time.
            const exhaustive: never = defectClass
            throw new Error(
                `severity-mapping: unhandled defectClass=${JSON.stringify(exhaustive)}`,
            )
        }
    }
}

// -----------------------------------------------------------------------------
// 1.1 Spacing (§ 2.10 row 1.1)
//   P0: overlap OR touch target broken (≥ 44×44 px floor).
//   P1: cross-route inconsistency for same component role.
//   P2: single-instance off-token drift in ±[1, 3] px.
// -----------------------------------------------------------------------------
function assignSeverity_1_1(q: SeverityQualifiers): Severity {
    if (q.hasOverlapOrTouchTargetBreak === true) {
        return 'P0'
    }
    if (q.isCrossRouteInconsistency === true) {
        return 'P1'
    }
    // P2 drift band: |drift| in [SPACING_P2_MIN_DRIFT_PX,
    // SPACING_P2_MAX_DRIFT_PX]. When the detector did not provide
    // `spacingDriftPx` we still default to P2 — § 2.10 gives no
    // P1 row for "single off-token" outside cross-route, so the
    // polish-only severity is the safe floor.
    if (q.spacingDriftPx !== undefined) {
        const drift = Math.abs(q.spacingDriftPx)
        if (drift >= SPACING_P2_MIN_DRIFT_PX && drift <= SPACING_P2_MAX_DRIFT_PX) {
            return 'P2'
        }
    }
    return 'P2'
}

// -----------------------------------------------------------------------------
// 1.2 Typography (§ 2.10 row 1.2)
//   P0: heading↔body indistinguishable on primary task surface.
//   P1: body↔caption on primary task surface; size off-token at any
//        surface; > 3 size/weight combos on primary task surface.
//   P2: violation only in a secondary block (footer, meta).
// -----------------------------------------------------------------------------
function assignSeverity_1_2(q: SeverityQualifiers): Severity {
    if (q.isHeadingVsBody === true && q.isPrimaryTaskSurface === true) {
        return 'P0'
    }
    if (q.is1_2_SecondaryBlockOnly === true) {
        return 'P2'
    }
    if (q.is1_2_BodyVsCaption === true && q.isPrimaryTaskSurface === true) {
        return 'P1'
    }
    // The remaining § 2.10 P1 sub-rows ("size off-token at any
    // surface"; "> 3 size/weight combos on primary task surface")
    // are encoded as the catch-all P1 default for this class —
    // any 1.2 finding that is neither auto-P0 nor secondary-only
    // is surface-quality enough to warrant P1.
    return 'P1'
}

// -----------------------------------------------------------------------------
// 1.3 Color (§ 2.10 row 1.3)
//   P0: (none — Reward Amber containment is class 1.4).
//   P1: literal hex/named on primary CTA; `--fuxie-energy` > 5 % on
//        lesson player.
//   P2: near-token (0 < ΔE < 3) elsewhere; `--fuxie-energy` > 5 % on
//        other surfaces.
// -----------------------------------------------------------------------------
function assignSeverity_1_3(q: SeverityQualifiers): Severity {
    // P1 sub-row a: literal hex/named on primary CTA.
    if (q.isLiteralHexNamedColor === true && q.isPrimaryCta === true) {
        return 'P1'
    }
    // P1 sub-row b: --fuxie-energy share > 5 % on the lesson player.
    if (q.fuxieEnergyShareExceeds5Percent === true && q.isLessonPlayer === true) {
        return 'P1'
    }
    // P2 sub-row b: --fuxie-energy share > 5 % on other surfaces.
    if (q.fuxieEnergyShareExceeds5Percent === true) {
        return 'P2'
    }
    // P2 sub-row a: near-token computed colour, ΔE strictly inside
    // (NEAR_TOKEN_DELTA_E_MIN_EXCLUSIVE, NEAR_TOKEN_DELTA_E_MAX_EXCLUSIVE).
    if (q.nearTokenDeltaE !== undefined) {
        if (
            q.nearTokenDeltaE > NEAR_TOKEN_DELTA_E_MIN_EXCLUSIVE &&
            q.nearTokenDeltaE < NEAR_TOKEN_DELTA_E_MAX_EXCLUSIVE
        ) {
            return 'P2'
        }
    }
    // Catch-all: a 1.3 finding without a P1 or near-token P2 trigger
    // is still off-token (literal hex/named anywhere, Tailwind
    // arbitrary, etc.) so § 2.10 puts it on the P1 row by default.
    return 'P1'
}

// -----------------------------------------------------------------------------
// 1.4 Reward containment (§ 2.10 row 1.4 + § 2.4 ii–iii)
//   P0: every non-exempt violation (auto-P0).
//   Exempt findings (`exempt: "user-content"`) are NOT P0; the
//   table itself does not assign P1/P2 for them, so the audit
//   surfaces them at P1 by convention (preservation of the
//   exception per § 2.4 iii).
// -----------------------------------------------------------------------------
function assignSeverity_1_4(q: SeverityQualifiers): Severity {
    if (q.is1_4_Exempt === true) {
        return 'P1'
    }
    return 'P0'
}

// -----------------------------------------------------------------------------
// 1.5 Alignment (§ 2.10 row 1.5)
//   P0: CTA overflows container blocking tap; OR drift ≥ 4 px on
//        primary task surface.
//   P1: sibling start-edge drift 2–3 px; center-axis drift 3–4 px.
//   P2: drift ≤ 2 px outside primary task.
// -----------------------------------------------------------------------------
function assignSeverity_1_5(q: SeverityQualifiers): Severity {
    if (q.ctaOverflowsContainer === true) {
        return 'P0'
    }
    const drift = q.alignmentDriftPx
    if (
        drift !== undefined &&
        drift >= ALIGNMENT_P0_MIN_DRIFT_PX &&
        q.isPrimaryTaskSurface === true
    ) {
        return 'P0'
    }
    if (drift !== undefined) {
        // P2 row first: § 2.10 says "drift ≤ 2 px outside primary
        // task" is polish-only. This branch must outrank the
        // overlapping P1 sibling-drift band (2–3 px) when the
        // surface is not primary, otherwise drift = 2 on a meta
        // surface would inflate to P1.
        if (
            drift <= ALIGNMENT_P2_MAX_DRIFT_PX &&
            q.isPrimaryTaskSurface !== true
        ) {
            return 'P2'
        }
        const [p1Min, p1Max] = ALIGNMENT_P1_DRIFT_RANGE_PX
        if (drift >= p1Min && drift <= p1Max) {
            return 'P1'
        }
        if (drift > p1Max && drift < ALIGNMENT_P0_MIN_DRIFT_PX) {
            // 3-to-just-under-4 covers the "center-axis 3–4 px" P1
            // sub-row when not otherwise upgraded to P0.
            return 'P1'
        }
    }
    // Default: alignment finding without a quantified drift on a
    // non-primary surface stays P2.
    if (q.isPrimaryTaskSurface !== true) {
        return 'P2'
    }
    // Primary task surface, drift unknown / unbucketed ⇒ P1 floor.
    return 'P1'
}

// -----------------------------------------------------------------------------
// 1.6 Component pattern (§ 2.10 row 1.6)
//   P0: modal layout drifts fully for the same action.
//   P1: CTA primary padding differs between dashboard and lesson.
//   P2: KPI card border-radius drift ≤ 2 px.
// -----------------------------------------------------------------------------
function assignSeverity_1_6(q: SeverityQualifiers): Severity {
    if (q.isModalLayoutDriftFullAction === true) {
        return 'P0'
    }
    if (q.isCtaPaddingDashboardVsLesson === true) {
        return 'P1'
    }
    const drift = q.componentPatternDriftPx
    if (
        drift !== undefined &&
        Math.abs(drift) <= COMPONENT_PATTERN_P2_MAX_DRIFT_PX
    ) {
        return 'P2'
    }
    // Default for cross-route component drift not otherwise
    // bucketed: P1 (cross-route inconsistency without a polish-
    // only quantifier).
    return 'P1'
}

// -----------------------------------------------------------------------------
// 1.7 State quality (§ 2.10 row 1.7 + § 2.7 iii)
//   P0: exposes stack trace / raw runtime error (auto-P0).
//   P1: empty state missing message or CTA; not-found missing
//        recovery CTA.
//   P2: loading shows spinner-only (no skeleton); empty missing
//        visual element.
// -----------------------------------------------------------------------------
function assignSeverity_1_7(q: SeverityQualifiers): Severity {
    if (q.exposesStackTrace === true) {
        return 'P0'
    }
    if (
        q.is1_7_EmptyMissingMessageOrCta === true ||
        q.is1_7_NotFoundMissingRecovery === true
    ) {
        return 'P1'
    }
    if (
        q.is1_7_LoadingSpinnerOnly === true ||
        q.is1_7_EmptyMissingVisual === true
    ) {
        return 'P2'
    }
    // Default for a 1.7 finding that did not specify which sub-row
    // applies: P1, since § 2.10 reserves P0 strictly for stack-
    // trace exposure and the table only places loading-spinner /
    // missing-visual on P2.
    return 'P1'
}

// -----------------------------------------------------------------------------
// 1.8 Layout-driven text overflow (§ 2.10 row 1.8)
//   P0: CTA label truncated; primary heading wraps overlap.
//   P1: body description truncated and full text not readable
//        elsewhere.
//   P2: secondary description truncated with ellipsis when full
//        text is readable elsewhere.
// -----------------------------------------------------------------------------
function assignSeverity_1_8(q: SeverityQualifiers): Severity {
    if (
        q.is1_8_CtaLabelTruncated === true ||
        q.is1_8_PrimaryHeadingWrapOverlap === true
    ) {
        return 'P0'
    }
    if (q.is1_8_BodyDescriptionTruncatedNotReadableElsewhere === true) {
        return 'P1'
    }
    if (q.is1_8_SecondaryDescriptionTruncatedReadableElsewhere === true) {
        return 'P2'
    }
    // Default: layout overflow without sub-row context lands on P1
    // (it is at minimum a body-content truncation, never an auto-P0).
    return 'P1'
}

// -----------------------------------------------------------------------------
// 1.9 Asset rhythm / oversize (§ 2.10 row 1.9)
//   P0: asset pushes primary CTA below the fold on 375×667.
//   P1: spacing drift > 2 px around hero illustration; OR
//        asset visual area > 2× primary CTA visual area.
//   P2: spacing drift 1–2 px; asset slightly off-rhythm.
// -----------------------------------------------------------------------------
function assignSeverity_1_9(q: SeverityQualifiers): Severity {
    if (q.assetPushesCtaBelowFold === true) {
        return 'P0'
    }
    if (
        q.assetAreaRatioVsCta !== undefined &&
        q.assetAreaRatioVsCta > ASSET_AREA_RATIO_P1_THRESHOLD
    ) {
        return 'P1'
    }
    const drift = q.assetSpacingDriftPx
    if (drift !== undefined) {
        if (drift > ASSET_RHYTHM_P1_MIN_DRIFT_PX_EXCLUSIVE) {
            return 'P1'
        }
        const [p2Min, p2Max] = ASSET_RHYTHM_P2_DRIFT_RANGE_PX
        if (drift >= p2Min && drift <= p2Max) {
            return 'P2'
        }
    }
    // Default: a 1.9 finding without quantified drift / ratio
    // lands on P2 (slightly off-rhythm).
    return 'P2'
}
