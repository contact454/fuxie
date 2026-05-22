# Implementation Plan — Fuxie UI/UX Audit & Fix

> **Vai chinh:** QA Automation Engineer
> **Vai phoi hop:** Frontend Engineer, Product Designer

## Overview

Bug fix here = build `auditPass'` (a unified UI/UX audit detector pipeline) so the QA pass stops missing defect classes 1.1–1.9 at viewport ≤ 480px on `apps/web/src/app/(learn)/**`. We do NOT fix individual visual defects in the learner app inside this spec — we ship the detector + Finding schema + triage logic + forward routing, and the resulting findings list is consumed by downstream specs.

Reference viewports pinned by the audit: 360×640, 375×667, 414×896.

The flow follows the bugfix requirements-first methodology:

1. Task 1 writes the **bug condition exploration test** (Property 1) and runs it on the unfixed `auditPass` to surface counterexamples for all 9 defect classes.
2. Task 2 writes the **preservation property tests** (Property 2) and observes baselines on the unfixed code so the recorded behavior is what gets preserved post-fix.
3. Task 3 implements `auditPass'` as 9 detectors + unified Finding schema + severity mapping + forward routing + CI gate, then re-runs Property 1 and Property 2 to confirm the fix.
4. Task 4 is the final checkpoint.

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": ["1", "2"],
      "description": "Write Property 1 (bug condition exploration) and Property 2 (preservation) tests against the UNFIXED auditPass. Both tasks are independent and run in parallel."
    },
    {
      "wave": 2,
      "tasks": ["3.1", "3.2", "3.3"],
      "description": "Foundation for auditPass': unified Finding schema + validator, severity mapping table 2.10, and reference-viewport-pinned harness. Required by all detectors. Depends on wave 1."
    },
    {
      "wave": 3,
      "tasks": ["3.4", "3.5", "3.6", "3.7", "3.8", "3.9", "3.10", "3.11", "3.12"],
      "description": "Implement detectors 1.1–1.9 in parallel. Each consumes the foundation from wave 2 and emits Findings via the validator. Depends on wave 2."
    },
    {
      "wave": 4,
      "tasks": ["3.13"],
      "description": "Forward routing and ownedByOtherSpec map. Depends on wave 3 (detectors must exist before forward routing can wrap them)."
    },
    {
      "wave": 5,
      "tasks": ["3.14"],
      "description": "auditPassPrime entry point + CI gate composing schema, severity, harness, all 9 detectors, forward routing. Depends on wave 4."
    },
    {
      "wave": 6,
      "tasks": ["3.15", "3.16"],
      "description": "Re-run Property 1 (exploration) and Property 2 (preservation) tests against auditPass'. Both verifications are independent and run in parallel. Depends on wave 5."
    },
    {
      "wave": 7,
      "tasks": ["4"],
      "description": "Final checkpoint: full audit suite + existing test list + CI gate sanity. Depends on wave 6."
    }
  ]
}
```

Hard ordering rules (in addition to the wave graph):

- Tasks 1 and 2 MUST be completed and run on UNFIXED code before any sub-task under 3 begins (this is the bugfix workflow's core rule — exploration before fix).
- 3.1, 3.2, 3.3 are foundation and must precede 3.4–3.13.
- 3.14 composes everything and must precede 3.15 and 3.16.
- Task 4 is gated on 3.15 AND 3.16 both passing.

## Tasks

- [x] 1. Write bug condition exploration test (BEFORE implementing `auditPass'`)
  - **Property 1: Bug Condition** - `auditPass` misses defect classes 1.1–1.9 at viewport ≤ 480px
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms `auditPass` is blind to most defect classes and lacks a unified Finding schema (root causes 1, 2, 3, 4, 5, 6, 7 in design.md § Hypothesized Root Cause).
  - **DO NOT attempt to fix the test or the code when it fails.**
  - **NOTE**: This test encodes the expected behavior of `auditPass'(X)` per Fix Checking pseudocode in design.md § Testing Strategy. It will validate the fix when it passes after implementation.
  - **GOAL**: Surface counterexamples proving 7/9 defect classes (1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 1.9) are not detected at all, and the partially-covered classes (1.4, 1.7) emit output that does not conform to the Finding Schema in `bugfix.md` § Introduction § Finding Schema.
  - **Scoped PBT Approach**: For deterministic miss cases, scope the property to concrete fixture DOMs that exactly match the `isBugCondition` pseudocode in design.md § Bug Details § Bug Condition. Place fixtures and the harness at `tests/audit/ui-ux/exploration.spec.ts`.
  - **Test fixtures (one per defect class, all rendered with viewport pinned to one of {360×640, 375×667, 414×896}):**
    - 1.1 Spacing (P1): KPI card with `padding: 14px` (literal, not a 4px multiple, no `--space-*` token) at 360×640.
    - 1.2 Typography (P1): heading + body both `font-size: 16px` + `font-weight: 600` in the same semantic block at 375×667.
    - 1.3 Color (P1): button with inline `style="background:#1da1f2"` (literal hex outside Bright Sky tokens) at 414×896.
    - 1.4 Reward containment (auto-P0): `<button style="background:#FFB703">Tiếp tục</button>` whose ancestor chain does NOT match `[data-reward-state="preview"|"earned"|"receipt"]` or `[data-reward-context="true"]`, at 360×640. Note this case is partially covered by `tests/reward-amber-containment.spec.tsx` — the exploration test must additionally assert that the existing pass does NOT emit a Finding object conforming to the unified schema (`defectClass`, `severity`, `evidence`, `expected`, `screenshotPath`, `forwardTo`, `action`).
    - 1.5 Alignment (P0): primary CTA bounding rect overlaps container right edge by 4px at 375×667.
    - 1.6 Component pattern paired (P1): two route fixtures rendering KPI cards with `p-3` vs `p-4`, no `data-variant` / `aria-disabled` / `data-loading` / `data-selected` to explain the diff (this is the canonical counterexample from `bugfix.md` § Counterexample).
    - 1.7 Error exposes stack (auto-P0): `error.tsx` fixture rendering `<pre>{stack}</pre>` at 360×640.
    - 1.8 Layout-driven text overflow (P1): button label receives synthetic DE compound noun (40 chars) inside container with `width: 200px` fixed and no `min-width: 0` on flex ancestor at 360×640.
    - 1.9 Asset oversize (P0): hero illustration occupies 50% of above-the-fold area at 375×667, primary CTA pushed below the fold.
  - **Assertion against unfixed code (`auditPass`)**: For each fixture, call the audit harness pointing at the current `auditPass` and assert that EITHER no finding is emitted, OR the emitted output fails the unified Finding schema validator (missing one or more of `defectClass`, `severity`, `route`, `component`, `evidence`, `expected`, `screenshotPath`, `forwardTo`, `action`, or wrong severity per `bugfix.md` § 2.10).
  - Run test on UNFIXED code.
  - **EXPECTED OUTCOME**: Test FAILS — at minimum 7 of the 9 fixtures (1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 1.9) yield zero findings; fixtures 1.4 and 1.7 yield findings that don't conform to the unified Finding Schema.
  - Document counterexamples in `tests/audit/ui-ux/exploration-findings.md`: per defect class, record (a) fixture path, (b) viewport, (c) `auditPass` output observed, (d) gap vs Finding Schema, (e) which root cause hypothesis from design.md § Hypothesized Root Cause it confirms.
  - Mark task complete when the test is written, run, and the per-class counterexample log is committed.
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9_

- [x] 2. Write preservation property tests (BEFORE implementing `auditPass'`)
  - **Property 2: Preservation** - Non-buggy inputs, viewport ≥ 768px, scope-out inputs, and existing test surfaces remain unchanged
  - **IMPORTANT**: Follow observation-first methodology. Run the UNFIXED `auditPass` against non-bug-condition inputs, record actual outputs, then encode those outputs as property assertions. Place the suite at `tests/audit/ui-ux/preservation.spec.ts`.
  - **Property-based testing is required here** because preservation is universal across an open input domain (route × viewport × component × style permutation × language).
  - **Observed baselines on UNFIXED code (record verbatim before encoding):**
    - Run `tests/reward-amber-containment.spec.tsx` and record current pass/fail status. Preservation must keep this status identical post-fix.
    - Run `tests/p0-surface-render.spec.tsx`, `tests/result-reward-loop.spec.tsx`, `tests/review-display.spec.tsx`, `tests/skill-motivation-layer.spec.tsx`, `tests/vocabulary-card.spec.tsx`, `tests/ui-primitives.spec.tsx`, `tests/mascot-role.spec.tsx`, `tests/asset-discipline.spec.tsx`, `tests/course-path.spec.tsx`, `tests/locale-parity.spec.ts` and record current pass/fail status for each.
    - Render compliant fixture (correct Bright Sky tokens, `--fuxie-reward` only inside `[data-reward-state="earned"]`, all spacing on 4px multiples) at viewport 360×640 → observe `auditPass` emits 0 findings.
    - Render the SAME spacing/typography drift as the 1.1 fixture but at viewport 1280×800 → observe `auditPass` emits 0 findings (desktop pass-through).
    - Render fixture where text is truncated because the copy is 200 chars in a fit-content container (NOT a layout cause) → observe `auditPass` emits no layout fix recommendation.
  - **Property-based test cases (use fast-check or equivalent already in the repo):**
    - PBT 2.A — Compliant DOM, viewport ≤ 480px: arbitrary generates fixtures using only Bright Sky color tokens, only `--text-*-size` typography tokens, only 4px-multiple spacing, no Reward Amber outside Reward_State subtree, viewport ∈ {360×640, 375×667, 414×896}. **Assertion**: `auditPass(X) = ∅`.
    - PBT 2.B — Desktop viewport regression guard: arbitrary generates DOM with arbitrary spacing/typography/color drift, viewport.width ∈ [768, 1920]. **Assertion**: `auditPass(X)` emits no `action: "fix"` finding.
    - PBT 2.C — Owned-by-other-spec scope: arbitrary generates four fixture clusters keyed by `ownedByOtherSpec` reason (asset choice/position, wording/microcopy, screenshot tooling, registry/filename hygiene). **Assertion** (against the eventual `auditPass'`, written now and expected to pass after fix): outputs `action: "forward"` with `targetSpec` matching the cluster, never an `action: "fix"`.
    - PBT 2.D — Existing test suite invariance: a non-PBT integration step that re-runs the existing test list above and asserts identical pass/fail status to the recorded baseline.
  - **Verify on UNFIXED code (where applicable):**
    - PBT 2.A passes on `auditPass` (compliant input → no finding).
    - PBT 2.B passes on `auditPass` (desktop viewport → no fix recommendation).
    - PBT 2.D passes (existing suites pass at the recorded baseline).
    - PBT 2.C is recorded as expected-to-pass after fix only — it tests `auditPass'` forward routing which doesn't exist yet. Mark as `it.skip` with a clear comment "unblocks at task 3.x"; do NOT count this as a regression.
  - Run tests on UNFIXED code.
  - **EXPECTED OUTCOME**: PBT 2.A, 2.B, 2.D PASS on unfixed code (this confirms the baseline behaviors that must be preserved). PBT 2.C remains skipped pending implementation.
  - Mark task complete when the property suite is written, observed baselines are committed in `tests/audit/ui-ux/preservation-baseline.md`, and 2.A / 2.B / 2.D pass on unfixed code.
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [ ] 3. Fix for "auditPass blind to defect classes 1.1–1.9 and lacking unified Finding schema"

  - [x] 3.1 Encode the unified Finding Schema and runtime validator
    - Create `apps/web/audit/ui-ux/finding-schema.ts` exporting TypeScript type `Finding` with fields `defectClass` (`"1.1"|...|"1.9"`), `severity` (`"P0"|"P1"|"P2"`), `route`, `component`, `evidence`, `expected`, `screenshotPath`, `forwardTo` (`null` or one of the four `targetSpec` values), `action` (`"fix" | "forward"`), and `exempt?: "user-content"`.
    - Create `apps/web/audit/ui-ux/class-evidence-schema.ts` mapping each `defectClass` to the class-specific evidence shape required by `bugfix.md` § 2.11 (e.g., 1.6 requires paired evidence: two routes, two selectors, two computed-style snapshots, two screenshots).
    - Create `apps/web/audit/ui-ux/finding-validator.ts` exporting `validateFinding(f: Finding): ValidationResult`. Findings missing required generic fields or class-specific evidence MUST be rejected before publish.
    - Auto-P0 rules encoded here: `defectClass === "1.4" && !exempt` ⇒ `severity === "P0"`; `defectClass === "1.7" && evidence.exposesStackTrace` ⇒ `severity === "P0"`.
    - _Bug_Condition: `isBugCondition(X)` from design.md § Bug Details § Bug Condition_
    - _Expected_Behavior: Finding Schema in `bugfix.md` § Introduction; Required Evidence per class in `bugfix.md` § 2.11_
    - _Preservation: Existing test suites unchanged (Preservation 3.1–3.7); validator only rejects, never mutates upstream behavior_
    - _Requirements: 2.11_

  - [x] 3.2 Encode the severity mapping table 2.10
    - Create `apps/web/audit/ui-ux/severity-mapping.ts` exporting `assignSeverity(defectClass, qualifiers)` that returns `"P0" | "P1" | "P2"` per `bugfix.md` § 2.10.
    - Qualifiers must include: `isPrimaryTaskSurface` (lesson player + exercise screens + dashboard), `hasOverlapOrTouchTargetBreak`, `isHeadingVsBody`, `isCrossRouteInconsistency`, `isLiteralHexNamedColor`, `fuxieEnergyShareExceeds5Percent`, `ctaOverflowsContainer`, `isModalLayoutDriftFullAction`, `exposesStackTrace`, `assetPushesCtaBelowFold`, `assetAreaRatioVsCta`, `nearTokenDeltaE` (CIEDE2000), and the supporting numeric thresholds from `bugfix.md` § 2.10.
    - Severity is assigned by code only, never by the test reader.
    - _Bug_Condition: `isBugCondition(X)`_
    - _Expected_Behavior: severity per `bugfix.md` § 2.10 table_
    - _Preservation: Severity rules do not influence non-bug-condition inputs (Preservation 3.6, 3.7)_
    - _Requirements: 2.10_

  - [x] 3.3 Encode reference-viewport pinning and audit harness
    - Create `apps/web/audit/ui-ux/runtime/viewport.ts` exporting the pinned set `[{w:360,h:640},{w:375,h:667},{w:414,h:896}]` plus a guard that rejects any audit invocation outside that set when `enforceMobile` is true.
    - Create `apps/web/audit/ui-ux/runtime/harness.ts` providing a Playwright + jsdom hybrid runner that loads a route, applies one of the pinned viewports, and yields `{ renderedDom, computedStyles }` to detectors.
    - Desktop pass-through: when `viewport.width >= 768`, harness must short-circuit to `changesProposed: ∅` per Preservation 3.5.
    - _Bug_Condition: `X.viewport.width <= 480` per `isBugCondition`_
    - _Expected_Behavior: reference viewports 360×640 / 375×667 / 414×896 pinned (design.md § Fix Implementation item 7)_
    - _Preservation: viewport ≥ 768px short-circuits with no proposed changes (Preservation 3.5)_
    - _Requirements: 3.5_

  - [ ] 3.4 Implement detector 1.1 — Inconsistent spacing vs 4px/8px baseline
    - Create `apps/web/audit/ui-ux/detectors/spacing-baseline.ts`.
    - Scan computed `padding-{top,right,bottom,left}`, `margin-{top,bottom}`, `gap`, `row-gap`, `column-gap` of every block-level container under `(learn)/**`.
    - Flag if the value is not a 4px multiple within ±1px tolerance AND does not match a `--space-*` token from `apps/web/src/app/globals.css` or a Tailwind `p-*`/`gap-*` class. Also flag cross-route inconsistency for the same component role per `bugfix.md` § 1.1 condition 2 and condition 3.
    - Emit Finding with severity from §3.2 and evidence per `bugfix.md` § 2.11.
    - _Bug_Condition: `hasInconsistentSpacing(X)` per `bugfix.md` § 1.1_
    - _Expected_Behavior: `bugfix.md` § 2.1 (i)–(iii)_
    - _Preservation: do not flag values that match canonical `--space-*` tokens (Preservation 3.6)_
    - _Requirements: 2.1, 2.10, 2.11_

  - [ ] 3.5 Implement detector 1.2 — Unclear typography hierarchy
    - Create `apps/web/audit/ui-ux/detectors/typography-hierarchy.ts`.
    - Enforce `font-size` ∈ `--text-*-size` token set declared in `apps/web/src/app/globals.css`.
    - For each semantic block, assert adjacent semantic ranks (heading↔body, body↔caption) differ by `font-size` ratio ≥ 1.125x OR `font-weight` ≥ 200 units. Reject blocks with > 3 distinct `(font-size, font-weight)` combos (excluding `<strong>`/`<em>` inline emphasis and icon/badge).
    - _Bug_Condition: `hasUnclearTypographyHierarchy(X)` per `bugfix.md` § 1.2_
    - _Expected_Behavior: `bugfix.md` § 2.2 (i)–(iv)_
    - _Preservation: do not flag inline emphasis nested in body sentences (Preservation 3.6)_
    - _Requirements: 2.2, 2.10, 2.11_

  - [ ] 3.6 Implement detector 1.3 — Off-token color usage (excluding Reward containment)
    - Create `apps/web/audit/ui-ux/detectors/color-token.ts`.
    - Regex-detect literal `hex` / `rgb` / `rgba` / `hsl` / `hsla` in `className` / `style` / inline style; Tailwind arbitrary `bg-[…]` / `text-[…]` / `border-[…]` / `ring-[…]`; named CSS colors.
    - Compute CIEDE2000 ΔE in sRGB / D65 vs the nearest canonical Bright Sky token; flag when ΔE ∈ (0, 3) (the "near-but-not-equal" trap from `bugfix.md` § 1.3 condition 4).
    - Measure `--fuxie-energy` viewport area share via union of bounding boxes (clipped to viewport, excluding occluded regions); flag when share > 5% per `bugfix.md` § 1.3 condition 5.
    - **Do NOT** emit Findings for Reward Amber containment violations — those go to detector 1.4.
    - _Bug_Condition: `hasOffTokenColor(X)` per `bugfix.md` § 1.3 (excluding 1.4 cases)_
    - _Expected_Behavior: `bugfix.md` § 2.3 (i)–(vii)_
    - _Preservation: components already on canonical Bright Sky tokens are not flagged (Preservation 3.6)_
    - _Requirements: 2.3, 2.10, 2.11_

  - [ ] 3.7 Implement detector 1.4 — Reward Amber containment (auto-P0)
    - Create `apps/web/audit/ui-ux/detectors/reward-containment.ts`.
    - For every node where any of `color`, `background-color`, `border-color`, `outline-color`, `fill`, `stroke`, or any color stop in `box-shadow` / `background-image` gradient has ΔE2000 < 5.0 vs `#FFB703` (sRGB / D65), walk `parentElement` up to `documentElement`. Fail if no ancestor matches `[data-reward-state="preview"|"earned"|"receipt"]` or `[data-reward-context="true"]`.
    - Exception: tag finding with `exempt: "user-content"` when the node is `<img>` / `<video>` / `<canvas>` or a `background-image` URL whose host is on the user-content CDN allowlist; exempt findings are NOT P0.
    - Non-exempt findings: `severity = "P0"`, `forwardTo = "gamified-ui-asset-rollout"`, `evidence.specRef = ["16.1", "16.5"]`, `action = "forward"` (per `bugfix.md` § 2.4 ii — fix is owned by gamified-ui-asset-rollout).
    - Audit run gate: when at least one non-exempt 1.4 finding exists unresolved, set `auditRun.status = "fail"`.
    - **Co-existence with `tests/reward-amber-containment.spec.tsx`**: the existing test continues to assert the runtime contract; this detector does not replace it (Preservation 3.6).
    - _Bug_Condition: `violatesRewardAmberContainment(X)` per `bugfix.md` § 1.4_
    - _Expected_Behavior: `bugfix.md` § 2.4 (i)–(iv)_
    - _Preservation: existing `reward-amber-containment.spec.tsx` continues to pass; user-content exception preserved (Preservation 3.2, 3.6)_
    - _Requirements: 2.4, 2.10, 2.11_

  - [ ] 3.8 Implement detector 1.5 — Alignment / grid misalignment
    - Create `apps/web/audit/ui-ux/detectors/alignment.ts`.
    - Detect (a) baseline lift > 2px between text and icon/glyph in the same flex/grid row, (b) start-edge drift > 1px between siblings sharing DOM parent + role + visual band when no state-attribute explains it, (c) center-axis drift > 2px between label and its associated control on the cross axis, (d) CTA bounding rect overlap > 0px vs content container OR safe-area padding.
    - _Bug_Condition: `hasMisalignment(X)` per `bugfix.md` § 1.5_
    - _Expected_Behavior: `bugfix.md` § 2.5 (i)–(v)_
    - _Preservation: do not flag legitimate variant differences explained by `data-variant` etc. (Preservation 3.6)_
    - _Requirements: 2.5, 2.10, 2.11_

  - [ ] 3.9 Implement detector 1.6 — Component pattern inconsistency across routes
    - Create `apps/web/audit/ui-ux/detectors/component-pattern.ts`.
    - Group nodes by precedence: (1) same React component import path, (2) same className root, (3) same semantic role + visual archetype.
    - Compare exact (0px tolerance) values for `padding-{top,right,bottom,left}`, `border-radius`, `border-width`, `border-color`, `background-color`, `font-size`, `font-weight`, `height`, `gap` across two routes.
    - Forgive only when one of `data-variant`, `aria-disabled`, `data-loading`, `data-selected` distinguishes the instances.
    - **Paired evidence requirement**: Finding MUST include both routes, both selectors, both computed-style snapshots, and both screenshots — the validator from §3.1 rejects unpaired findings; do not publish them.
    - _Bug_Condition: `hasComponentInconsistencyVsSiblingRoute(X)` per `bugfix.md` § 1.6_
    - _Expected_Behavior: `bugfix.md` § 2.6 (i)–(iii)_
    - _Preservation: do not flag instances distinguished by valid state-attributes (Preservation 3.6)_
    - _Requirements: 2.6, 2.10, 2.11_

  - [ ] 3.10 Implement detector 1.7 — Empty / loading / error / not-found state
    - Create `apps/web/audit/ui-ux/detectors/state-quality.ts`.
    - For `loading.tsx`: assert skeleton mirrors content count + relative position + aspect ratio within ±20% per block; spinner-only fallback ⇒ P2 finding.
    - For `empty`: assert presence of (a) visual element, (b) Vietnamese-language message string, (c) at least one CTA. Each missing component emits a separate finding with severity per §2.10.
    - For `error.tsx`: assert calm Vietnamese-language message + recovery CTA ∈ {retry, dashboard, support}; assert NO stack trace / raw runtime error string is present in the rendered output. Stack-trace exposure ⇒ auto-P0 (per §3.1 rule).
    - For `not-found.tsx`: assert recovery CTA exists pointing to `(learn)/dashboard` or another known-good route; missing CTA ⇒ P1.
    - **Forward routing**: tone/wording quality issues are not flagged here — emit `action: "forward"` with `targetSpec: "learner-copy-localization-backfill"` when the only complaint is wording quality (Preservation 3.1).
    - _Bug_Condition: `hasPoorEmptyLoadingErrorState(X)` per `bugfix.md` § 1.7_
    - _Expected_Behavior: `bugfix.md` § 2.7 (i)–(vi)_
    - _Preservation: surfaces already meeting state quality bar are not refactored (Preservation 3.7); wording quality forwarded to learner-copy-localization-backfill (Preservation 3.1)_
    - _Requirements: 2.7, 2.10, 2.11_

  - [ ] 3.11 Implement detector 1.8 — Layout-driven text overflow
    - Create `apps/web/audit/ui-ux/detectors/text-overflow.ts`.
    - Inject synthetic strings into every dynamic text slot: DE compound noun (40 chars) and VI string (30 chars). Re-measure after injection.
    - Detect (a) horizontal scrollbar appearance at the container level, (b) `overflow:hidden` + `text-overflow:ellipsis` on meaningful (non-decorative) content with no alternate full-text reveal, (c) mid-word wrap on non-CJK text without `overflow-wrap: anywhere | break-word`, (d) `width: <Npx fixed>` instead of `max-width` + `min-width: 0`, (e) flex/grid ancestor missing `min-width: 0`.
    - **Layout-only**: Findings must include a note "layout issue, copy is owned by learner-copy-localization-backfill" and MUST NOT recommend shortening copy (Preservation 3.1).
    - _Bug_Condition: `hasLayoutDrivenTextOverflow(X)` per `bugfix.md` § 1.8_
    - _Expected_Behavior: `bugfix.md` § 2.8 (i)–(vi)_
    - _Preservation: never propose copy shortening; forward wording concerns (Preservation 3.1)_
    - _Requirements: 2.8, 2.10, 2.11_

  - [ ] 3.12 Implement detector 1.9 — Asset spacing rhythm and oversize
    - Create `apps/web/audit/ui-ux/detectors/asset-rhythm.ts`.
    - Identify decoration assets: `<img>`, inline `<svg>`, Lottie containers, CSS `background-image` used as decoration. Exclude functional icons that are part of a labeled control (those are detector 1.5's domain).
    - Check (a) gap between asset and nearest sibling content is a 4px multiple within ±1px AND uses spacing tokens; (b) asset visual area ≤ 2.0× primary CTA visual area within above-the-fold (reference viewport 375×667); (c) asset ≤ 40% of above-the-fold area when it would otherwise push primary CTA below the fold.
    - **Forward routing**: violations of (a) emit `action: "fix"` with `forwardTo: null` (spacing only). Violations of (b) or (c) emit `action: "forward"` with `forwardTo: "gamified-ui-asset-rollout"` (because the fix requires reducing rendered asset size, which that spec owns).
    - **Never** propose changing the asset itself, mascot identity, or repositioning to a different layout slot (Preservation 3.2).
    - _Bug_Condition: `hasPoorAssetSpacingRhythm(X)` per `bugfix.md` § 1.9_
    - _Expected_Behavior: `bugfix.md` § 2.9 (i)–(v)_
    - _Preservation: asset choice/position owned by gamified-ui-asset-rollout (Preservation 3.2)_
    - _Requirements: 2.9, 2.10, 2.11_

  - [ ] 3.13 Implement forward routing and `ownedByOtherSpec` map
    - Create `apps/web/audit/ui-ux/forward-routing.ts` exporting `ownedByOtherSpec(X)` returning `{ owned: boolean, targetSpec: "gamified-ui-asset-rollout" | "learner-copy-localization-backfill" | "visual-qa-screenshot-capture" | "asset-registry-cleanup" | null }`.
    - Mapping per `bugfix.md` § Scope (Out): asset position/choice ⇒ `gamified-ui-asset-rollout`; wording/microcopy/translation tone ⇒ `learner-copy-localization-backfill`; screenshot tooling / visual diff pipeline ⇒ `visual-qa-screenshot-capture`; asset registry / filename hygiene ⇒ `asset-registry-cleanup`.
    - When `owned === true`, top-level `auditPassPrime` MUST emit `action: "forward"` with the matching `targetSpec` and MUST NOT propose layout/style fixes inside this spec.
    - _Bug_Condition: `ownedByOtherSpec(X)` clause inside `isBugCondition`_
    - _Expected_Behavior: `bugfix.md` § Introduction § Scope (Out) and Preservation 3.1–3.4_
    - _Preservation: scope-out inputs forwarded, never duplicated (Preservation 3.1, 3.2, 3.3, 3.4)_
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ] 3.14 Wire `auditPassPrime` entry point and CI gate
    - Create `apps/web/audit/ui-ux/index.ts` exporting `auditPassPrime(X): { findings: Finding[]; status: "pass" | "fail"; changesProposed: Finding[] }`.
    - Compose the 9 detectors, the severity mapping, the validator, the forward router, and the harness.
    - CI gate: set `status = "fail"` when at least one non-exempt 1.4 finding exists OR at least one 1.7 finding has `evidence.exposesStackTrace`.
    - Output: write `Finding[]` JSON to `audit-reports/ui-ux/{run-id}.json`.
    - Add CLI: `pnpm audit:ui-ux [--route <path>] [--class <1.x>]` (or the equivalent project script runner) for targeted runs.
    - _Bug_Condition: full `isBugCondition(X)`_
    - _Expected_Behavior: design.md § Fix Implementation items 1–8; auto-P0 gates from `bugfix.md` § 2.4 iv and § 2.7 iii_
    - _Preservation: all preservation requirements composed at the entry point; un-flip PBT 2.C from `it.skip` to active here_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ] 3.15 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - `auditPass'` detects every defect class 1.1–1.9 with valid Findings
    - **IMPORTANT**: Re-run the SAME test from task 1 — do NOT write a new test.
    - The test from task 1 encodes the expected Fix Checking behavior. When it passes, the bug is resolved.
    - Run `tests/audit/ui-ux/exploration.spec.ts` against `auditPass'`.
    - **EXPECTED OUTCOME**: All 9 fixtures yield exactly one Finding each; severity matches `bugfix.md` § 2.10; evidence conforms to `classEvidenceSchema(defectClass)`; `defectClass = "1.4"` non-exempt forces `severity = "P0"` and the run status `"fail"`; `defectClass = "1.7"` with `exposesStackTrace` forces `severity = "P0"`.
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11_

  - [ ] 3.16 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-buggy inputs, viewport ≥ 768px, scope-out inputs, and existing test surfaces unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests.
    - Run `tests/audit/ui-ux/preservation.spec.ts`.
    - Un-skip PBT 2.C (forward routing) — it should now pass against `auditPass'`.
    - Re-run the full existing test list: `tests/reward-amber-containment.spec.tsx`, `tests/p0-surface-render.spec.tsx`, `tests/result-reward-loop.spec.tsx`, `tests/review-display.spec.tsx`, `tests/skill-motivation-layer.spec.tsx`, `tests/vocabulary-card.spec.tsx`, `tests/ui-primitives.spec.tsx`, `tests/mascot-role.spec.tsx`, `tests/asset-discipline.spec.tsx`, `tests/course-path.spec.tsx`, `tests/locale-parity.spec.ts`.
    - **EXPECTED OUTCOME**: PBT 2.A, 2.B, 2.C, 2.D all PASS. Existing test suites pass with status identical to the baseline recorded in `tests/audit/ui-ux/preservation-baseline.md`. No regressions.
    - Confirm all tests still pass after the fix.

- [ ] 4. Checkpoint - Ensure all tests pass
  - Run the full audit suite: `tests/audit/ui-ux/exploration.spec.ts`, `tests/audit/ui-ux/preservation.spec.ts`, plus the existing test list.
  - Confirm `auditPassPrime` emits a JSON report at `audit-reports/ui-ux/{run-id}.json` with valid Finding schemas.
  - Confirm CI gate behavior: introduce a temporary fixture with a non-exempt 1.4 violation → run `status = "fail"`; remove fixture → run `status = "pass"`.
  - Confirm forward routing: fixtures classified as `ownedByOtherSpec` produce `action: "forward"` with the correct `targetSpec` and no `action: "fix"` findings inside this spec.
  - Confirm desktop viewport (≥ 768px) regression guard: arbitrary drift at desktop emits no `action: "fix"` finding.
  - Ensure all tests pass; if any fail, ask the user before proceeding (per quality checklist of QA Automation Engineer: state residual risk explicitly).

## Notes

- **Role gate**: This is QA tooling, so QA Automation Engineer is primary. Frontend Engineer supports for DOM / computed-style traversal patterns. Product Designer supports for the severity mapping in `bugfix.md` § 2.10 and for confirming the canonical Bright Sky / Reward Amber tokens — not for redesigning surfaces.
- **Scope discipline**: This spec ships a detector pipeline, not visual fixes. Any finding whose remedy lives in another spec MUST be emitted with `action: "forward"`. Forward targets: `gamified-ui-asset-rollout` (asset choice/position/size), `learner-copy-localization-backfill` (wording, microcopy, DE↔VI tone), `visual-qa-screenshot-capture` (screenshot tooling), `asset-registry-cleanup` (filename/registry hygiene).
- **Auto-P0 gates**: Defect class 1.4 (Reward Amber containment, non-exempt) and defect class 1.7 with `evidence.exposesStackTrace` both force `severity = "P0"` and `auditRun.status = "fail"`.
- **Viewport policy**: Audit is pinned to {360×640, 375×667, 414×896}. Inputs at viewport ≥ 768px short-circuit to `changesProposed: ∅` per Preservation 3.5.
- **PBT 2.C handling**: PBT 2.C in task 2 is initially `it.skip` because it tests `auditPass'` forward routing, which doesn't exist yet. It is un-skipped in task 3.16 — that transition is part of the fix verification.
- **Test placement**: New audit tests under `tests/audit/ui-ux/`; new audit module under `apps/web/audit/ui-ux/`. Existing tests under `tests/*.spec.{ts,tsx}` are NOT modified by this spec.
- **No copy or asset edits**: This spec must never propose copy shortening (forward to `learner-copy-localization-backfill`) or asset replacement / repositioning (forward to `gamified-ui-asset-rollout`).
