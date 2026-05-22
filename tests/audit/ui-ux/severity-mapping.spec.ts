/**
 * severity-mapping.spec.ts — Unit coverage for `assignSeverity`
 * shipped by task 3.2.
 *
 * Vai chinh: QA Automation Engineer
 * Vai phoi hop: Frontend Engineer, Product Designer
 *
 * Spec source-of-truth:
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/bugfix.md § 2.10
 *     (Severity Mapping per defect class) — every row of the
 *     table is covered by one test below.
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/bugfix.md § 2.4 ii (auto-P0
 *     for non-exempt 1.4) and § 2.4 iii (user-content exception).
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/bugfix.md § 2.7 iii (auto-P0
 *     when 1.7 exposes a stack trace).
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/tasks.md task 3.2 ("Add
 *     unit tests covering every row in the severity table 2.10 —
 *     one test per (defectClass × qualifier combination) row").
 *
 * Convention: each `it(...)` block names the (class, severity,
 * qualifier) row from § 2.10 it covers, so a reviewer can map the
 * test back to the canonical table without context-switching.
 */

import { describe, expect, it } from 'vitest'

import {
    ALIGNMENT_P0_MIN_DRIFT_PX,
    ALIGNMENT_P1_DRIFT_RANGE_PX,
    ALIGNMENT_P2_MAX_DRIFT_PX,
    ASSET_AREA_RATIO_P1_THRESHOLD,
    ASSET_RHYTHM_P1_MIN_DRIFT_PX_EXCLUSIVE,
    ASSET_RHYTHM_P2_DRIFT_RANGE_PX,
    COMPONENT_PATTERN_P2_MAX_DRIFT_PX,
    FUXIE_ENERGY_MAX_VIEWPORT_SHARE,
    NEAR_TOKEN_DELTA_E_MAX_EXCLUSIVE,
    NEAR_TOKEN_DELTA_E_MIN_EXCLUSIVE,
    SPACING_P2_MAX_DRIFT_PX,
    SPACING_P2_MIN_DRIFT_PX,
    TOUCH_TARGET_MIN_PX,
    assignSeverity,
} from '../../../apps/web/audit/ui-ux/severity-mapping'

// =============================================================================
// SECTION 1 — § 2.10 row 1.1 Spacing.
// =============================================================================

describe('assignSeverity — 1.1 Spacing rows from § 2.10', () => {
    it('1.1 P0: overlap caused by spacing ⇒ P0', () => {
        expect(
            assignSeverity('1.1', {
                hasOverlapOrTouchTargetBreak: true,
            }),
        ).toBe('P0')
    })

    it('1.1 P0: touch target broken (< 44×44 px) ⇒ P0', () => {
        // Detector encodes the broken touch target via the same
        // qualifier flag; the numeric floor lives in
        // `TOUCH_TARGET_MIN_PX`.
        expect(TOUCH_TARGET_MIN_PX).toBe(44)
        expect(
            assignSeverity('1.1', {
                hasOverlapOrTouchTargetBreak: true,
                isPrimaryTaskSurface: true,
            }),
        ).toBe('P0')
    })

    it('1.1 P1: cross-route inconsistency for same component role ⇒ P1', () => {
        expect(
            assignSeverity('1.1', {
                isCrossRouteInconsistency: true,
            }),
        ).toBe('P1')
    })

    it('1.1 P2: single-instance off-token drift inside ±[1, 3] px ⇒ P2', () => {
        for (
            let drift = SPACING_P2_MIN_DRIFT_PX;
            drift <= SPACING_P2_MAX_DRIFT_PX;
            drift++
        ) {
            expect(assignSeverity('1.1', { spacingDriftPx: drift })).toBe('P2')
            expect(assignSeverity('1.1', { spacingDriftPx: -drift })).toBe('P2')
        }
    })
})

// =============================================================================
// SECTION 2 — § 2.10 row 1.2 Typography.
// =============================================================================

describe('assignSeverity — 1.2 Typography rows from § 2.10', () => {
    it('1.2 P0: heading↔body indistinguishable on primary task surface ⇒ P0', () => {
        expect(
            assignSeverity('1.2', {
                isHeadingVsBody: true,
                isPrimaryTaskSurface: true,
            }),
        ).toBe('P0')
    })

    it('1.2 P1: body↔caption on primary task surface ⇒ P1', () => {
        expect(
            assignSeverity('1.2', {
                is1_2_BodyVsCaption: true,
                isPrimaryTaskSurface: true,
            }),
        ).toBe('P1')
    })

    it('1.2 P1: size off-token at any surface (default catch-all) ⇒ P1', () => {
        // The detector reports a font-size literal off-token; with
        // no heading↔body / secondary-only qualifier set, § 2.10
        // places the finding on the P1 row.
        expect(
            assignSeverity('1.2', {
                isPrimaryTaskSurface: false,
            }),
        ).toBe('P1')
    })

    it('1.2 P1: > 3 size/weight combos on primary task surface ⇒ P1', () => {
        // Encoded as the catch-all P1 default for a 1.2 finding on a
        // primary task surface that is neither auto-P0 nor secondary-
        // only.
        expect(
            assignSeverity('1.2', {
                isPrimaryTaskSurface: true,
            }),
        ).toBe('P1')
    })

    it('1.2 P2: violation only in a secondary block (footer, meta) ⇒ P2', () => {
        expect(
            assignSeverity('1.2', {
                is1_2_SecondaryBlockOnly: true,
            }),
        ).toBe('P2')
    })

    it('1.2 P0 NOT applied when heading↔body fires off-primary surface', () => {
        // Guard against severity inflation on secondary surfaces.
        expect(
            assignSeverity('1.2', {
                isHeadingVsBody: true,
                isPrimaryTaskSurface: false,
            }),
        ).toBe('P1')
    })
})

// =============================================================================
// SECTION 3 — § 2.10 row 1.3 Color.
// =============================================================================

describe('assignSeverity — 1.3 Color rows from § 2.10', () => {
    it('1.3 has no P0 row (Reward Amber containment is class 1.4)', () => {
        // The catch-all default for 1.3 is P1, not P0. Confirm no
        // qualifier combination inside § 2.10 row 1.3 elevates to P0.
        expect(
            assignSeverity('1.3', {
                isLiteralHexNamedColor: true,
                isPrimaryCta: true,
                fuxieEnergyShareExceeds5Percent: true,
                isLessonPlayer: true,
            }),
        ).not.toBe('P0')
    })

    it('1.3 P1: literal hex / named CSS color on primary CTA ⇒ P1', () => {
        expect(
            assignSeverity('1.3', {
                isLiteralHexNamedColor: true,
                isPrimaryCta: true,
            }),
        ).toBe('P1')
    })

    it('1.3 P1: --fuxie-energy share > 5 % on lesson player ⇒ P1', () => {
        // The threshold itself lives in `FUXIE_ENERGY_MAX_VIEWPORT_SHARE`;
        // detectors compute the share and set the boolean qualifier.
        expect(FUXIE_ENERGY_MAX_VIEWPORT_SHARE).toBe(0.05)
        expect(
            assignSeverity('1.3', {
                fuxieEnergyShareExceeds5Percent: true,
                isLessonPlayer: true,
            }),
        ).toBe('P1')
    })

    it('1.3 P2: near-token (0 < ΔE < 3) ⇒ P2', () => {
        const samples = [0.5, 1.0, 1.5, 2.5, 2.9]
        for (const dE of samples) {
            expect(
                dE > NEAR_TOKEN_DELTA_E_MIN_EXCLUSIVE &&
                    dE < NEAR_TOKEN_DELTA_E_MAX_EXCLUSIVE,
            ).toBe(true)
            expect(assignSeverity('1.3', { nearTokenDeltaE: dE })).toBe('P2')
        }
    })

    it('1.3 P2: --fuxie-energy share > 5 % on a non-lesson surface ⇒ P2', () => {
        expect(
            assignSeverity('1.3', {
                fuxieEnergyShareExceeds5Percent: true,
                isLessonPlayer: false,
            }),
        ).toBe('P2')
    })

    it('1.3 P2 NOT applied when ΔE = 0 (exact match) or ΔE ≥ 3', () => {
        // ΔE = 0 means the colour matches a token exactly — not a
        // finding. ΔE ≥ 3 is no longer the "near-token trap" band.
        expect(assignSeverity('1.3', { nearTokenDeltaE: 0 })).toBe('P1')
        expect(assignSeverity('1.3', { nearTokenDeltaE: 3 })).toBe('P1')
        expect(assignSeverity('1.3', { nearTokenDeltaE: 5 })).toBe('P1')
    })
})

// =============================================================================
// SECTION 4 — § 2.10 row 1.4 Reward containment.
// =============================================================================

describe('assignSeverity — 1.4 Reward containment rows from § 2.10', () => {
    it('1.4 P0: every non-exempt violation is auto-P0', () => {
        expect(assignSeverity('1.4', {})).toBe('P0')
        expect(
            assignSeverity('1.4', {
                isPrimaryTaskSurface: true,
            }),
        ).toBe('P0')
        expect(
            assignSeverity('1.4', {
                is1_4_Exempt: false,
            }),
        ).toBe('P0')
    })

    it('1.4 exempt user-content ⇒ NOT P0 (per § 2.4 iii)', () => {
        expect(
            assignSeverity('1.4', {
                is1_4_Exempt: true,
            }),
        ).toBe('P1')
    })
})

// =============================================================================
// SECTION 5 — § 2.10 row 1.5 Alignment.
// =============================================================================

describe('assignSeverity — 1.5 Alignment rows from § 2.10', () => {
    it('1.5 P0: CTA overflows container (blocks tap) ⇒ P0', () => {
        expect(
            assignSeverity('1.5', {
                ctaOverflowsContainer: true,
            }),
        ).toBe('P0')
    })

    it('1.5 P0: drift ≥ 4 px on primary task surface ⇒ P0', () => {
        for (const drift of [
            ALIGNMENT_P0_MIN_DRIFT_PX,
            ALIGNMENT_P0_MIN_DRIFT_PX + 1,
            10,
        ]) {
            expect(
                assignSeverity('1.5', {
                    alignmentDriftPx: drift,
                    isPrimaryTaskSurface: true,
                }),
            ).toBe('P0')
        }
    })

    it('1.5 P1: sibling start-edge drift 2–3 px ⇒ P1', () => {
        const [p1Min, p1Max] = ALIGNMENT_P1_DRIFT_RANGE_PX
        for (let drift = p1Min; drift <= p1Max; drift++) {
            // The P1 sibling row applies on primary task surfaces;
            // off-primary, the same drift would land on the P2
            // row ("drift ≤ 2 px outside primary task").
            expect(
                assignSeverity('1.5', {
                    alignmentDriftPx: drift,
                    isPrimaryTaskSurface: true,
                }),
            ).toBe('P1')
        }
    })

    it('1.5 P1: center-axis drift 3–4 px ⇒ P1 (when below P0 threshold)', () => {
        // 3 ≤ drift < 4 lands on the P1 center-axis row.
        expect(
            assignSeverity('1.5', {
                alignmentDriftPx: 3,
                isPrimaryTaskSurface: true,
            }),
        ).toBe('P1')
        expect(
            assignSeverity('1.5', {
                alignmentDriftPx: 3.5,
                isPrimaryTaskSurface: true,
            }),
        ).toBe('P1')
    })

    it('1.5 P2: drift ≤ 2 px outside primary task ⇒ P2', () => {
        for (let drift = 0; drift <= ALIGNMENT_P2_MAX_DRIFT_PX; drift++) {
            expect(
                assignSeverity('1.5', {
                    alignmentDriftPx: drift,
                    isPrimaryTaskSurface: false,
                }),
            ).toBe('P2')
        }
    })
})

// =============================================================================
// SECTION 6 — § 2.10 row 1.6 Component pattern.
// =============================================================================

describe('assignSeverity — 1.6 Component pattern rows from § 2.10', () => {
    it('1.6 P0: modal layout drift fully for the same action ⇒ P0', () => {
        expect(
            assignSeverity('1.6', {
                isModalLayoutDriftFullAction: true,
            }),
        ).toBe('P0')
    })

    it('1.6 P1: CTA primary padding differs between dashboard and lesson ⇒ P1', () => {
        expect(
            assignSeverity('1.6', {
                isCtaPaddingDashboardVsLesson: true,
            }),
        ).toBe('P1')
    })

    it('1.6 P2: KPI card border-radius drift ≤ 2 px ⇒ P2', () => {
        for (
            let drift = 0;
            drift <= COMPONENT_PATTERN_P2_MAX_DRIFT_PX;
            drift++
        ) {
            expect(
                assignSeverity('1.6', { componentPatternDriftPx: drift }),
            ).toBe('P2')
            expect(
                assignSeverity('1.6', { componentPatternDriftPx: -drift }),
            ).toBe('P2')
        }
    })
})

// =============================================================================
// SECTION 7 — § 2.10 row 1.7 State quality.
// =============================================================================

describe('assignSeverity — 1.7 State quality rows from § 2.10', () => {
    it('1.7 P0: stack trace exposed (auto-P0, § 2.7 iii) ⇒ P0', () => {
        expect(
            assignSeverity('1.7', {
                exposesStackTrace: true,
            }),
        ).toBe('P0')
    })

    it('1.7 P1: empty state missing message or CTA ⇒ P1', () => {
        expect(
            assignSeverity('1.7', {
                is1_7_EmptyMissingMessageOrCta: true,
            }),
        ).toBe('P1')
    })

    it('1.7 P1: not-found missing recovery CTA ⇒ P1', () => {
        expect(
            assignSeverity('1.7', {
                is1_7_NotFoundMissingRecovery: true,
            }),
        ).toBe('P1')
    })

    it('1.7 P2: loading shows spinner-only (no skeleton) ⇒ P2', () => {
        expect(
            assignSeverity('1.7', {
                is1_7_LoadingSpinnerOnly: true,
            }),
        ).toBe('P2')
    })

    it('1.7 P2: empty state missing visual element ⇒ P2', () => {
        expect(
            assignSeverity('1.7', {
                is1_7_EmptyMissingVisual: true,
            }),
        ).toBe('P2')
    })
})

// =============================================================================
// SECTION 8 — § 2.10 row 1.8 Layout-driven text overflow.
// =============================================================================

describe('assignSeverity — 1.8 Layout text-overflow rows from § 2.10', () => {
    it('1.8 P0: CTA label truncated ⇒ P0', () => {
        expect(
            assignSeverity('1.8', {
                is1_8_CtaLabelTruncated: true,
            }),
        ).toBe('P0')
    })

    it('1.8 P0: primary heading wrap overlaps neighbour ⇒ P0', () => {
        expect(
            assignSeverity('1.8', {
                is1_8_PrimaryHeadingWrapOverlap: true,
            }),
        ).toBe('P0')
    })

    it('1.8 P1: body description truncated and full text not readable elsewhere ⇒ P1', () => {
        expect(
            assignSeverity('1.8', {
                is1_8_BodyDescriptionTruncatedNotReadableElsewhere: true,
            }),
        ).toBe('P1')
    })

    it('1.8 P2: secondary description truncated with ellipsis when full text accessible elsewhere ⇒ P2', () => {
        expect(
            assignSeverity('1.8', {
                is1_8_SecondaryDescriptionTruncatedReadableElsewhere: true,
            }),
        ).toBe('P2')
    })
})

// =============================================================================
// SECTION 9 — § 2.10 row 1.9 Asset rhythm / oversize.
// =============================================================================

describe('assignSeverity — 1.9 Asset rhythm rows from § 2.10', () => {
    it('1.9 P0: asset pushes primary CTA below the 375×667 fold ⇒ P0', () => {
        expect(
            assignSeverity('1.9', {
                assetPushesCtaBelowFold: true,
            }),
        ).toBe('P0')
    })

    it('1.9 P1: spacing drift > 2 px around hero illustration ⇒ P1', () => {
        const drifts = [
            ASSET_RHYTHM_P1_MIN_DRIFT_PX_EXCLUSIVE + 1,
            ASSET_RHYTHM_P1_MIN_DRIFT_PX_EXCLUSIVE + 2,
            10,
        ]
        for (const drift of drifts) {
            expect(
                assignSeverity('1.9', { assetSpacingDriftPx: drift }),
            ).toBe('P1')
        }
    })

    it('1.9 P1: asset visual area > 2× primary CTA visual area ⇒ P1', () => {
        for (const ratio of [
            ASSET_AREA_RATIO_P1_THRESHOLD + 0.01,
            2.5,
            3.0,
            10,
        ]) {
            expect(
                assignSeverity('1.9', { assetAreaRatioVsCta: ratio }),
            ).toBe('P1')
        }
    })

    it('1.9 P2: spacing drift 1–2 px ⇒ P2', () => {
        const [p2Min, p2Max] = ASSET_RHYTHM_P2_DRIFT_RANGE_PX
        for (let drift = p2Min; drift <= p2Max; drift++) {
            expect(
                assignSeverity('1.9', { assetSpacingDriftPx: drift }),
            ).toBe('P2')
        }
    })

    it('1.9 P2: asset slightly off-rhythm (default catch-all) ⇒ P2', () => {
        // No fold push, ratio ≤ 2×, no quantified drift ⇒ P2.
        expect(
            assignSeverity('1.9', {
                assetAreaRatioVsCta: ASSET_AREA_RATIO_P1_THRESHOLD,
            }),
        ).toBe('P2')
    })
})

// =============================================================================
// SECTION 10 — Determinism and totality guard.
// =============================================================================

describe('assignSeverity — totality and determinism', () => {
    it('returns one of {P0, P1, P2} for every defect class with empty qualifiers', () => {
        const classes = [
            '1.1',
            '1.2',
            '1.3',
            '1.4',
            '1.5',
            '1.6',
            '1.7',
            '1.8',
            '1.9',
        ] as const
        for (const cls of classes) {
            const severity = assignSeverity(cls, {})
            expect(['P0', 'P1', 'P2']).toContain(severity)
        }
    })

    it('is deterministic — repeated calls with the same input yield the same severity', () => {
        const qualifiers = {
            isPrimaryTaskSurface: true,
            ctaOverflowsContainer: true,
        }
        const first = assignSeverity('1.5', qualifiers)
        for (let i = 0; i < 5; i++) {
            expect(assignSeverity('1.5', qualifiers)).toBe(first)
        }
    })
})
