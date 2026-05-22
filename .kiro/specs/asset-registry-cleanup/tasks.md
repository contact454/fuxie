# Implementation Plan: Asset Registry Cleanup

## Overview

This plan executes the asset registry cleanup in five phases as defined in `design.md`:

- **Phase 0** — Capture baseline state of orphans, forbidden refs, and property tests before any change.
- **Phase 1** — Decision 2: extract `FUXIE_FOUNDATION_ASSETS` out of `apps/web/src` into `scripts/` so the audit no longer flags it.
- **Phase 2** — Decisions 1 + 3: swap the 5 hardcoded `/fuxie-mascot/...` paths to registry helper calls (or annotate the dev-only debugger preview).
- **Phase 3** — Decision 4: classify all 80 orphan assets into `wire-into-registry` / `archive` / `delete` and apply each verdict.
- **Phase 4** — Final smoke chain + DoD update on `gamified-ui-asset-rollout`.

All work is **frontend-only** (TypeScript / TSX edits, registry config, docs). No backend, no infra, no production deploys. Property tests are NOT rewritten — the existing 4 properties in `tests/asset-registry.spec.ts` are the acceptance gate and must keep passing after every phase.

## Tasks

- [x] 1. Phase 0 — Investigation & baseline snapshot
  - Capture pre-cleanup state so we can prove deltas at the end of each phase and during PR review.

  - [x] 1.1 Capture `pnpm check:asset-audit` baseline
    - Run `pnpm check:asset-audit` from repo root and pipe full output (orphan list of 80 files + 8 forbidden ref entries) into `docs/design/asset-cleanup-baseline.md`.
    - Add a short header in that file: date, commit SHA, coverage %, orphan count, forbidden-ref count.
    - This file is the "before" snapshot referenced by the DoD update in Task 5.2.
    - _Requirements: 1.1, 1.2, 9.1_

  - [x] 1.2 Snapshot `FUXIE_FOUNDATION_ASSETS` consumers
    - Run `rg "FUXIE_FOUNDATION_ASSETS|getFuxieFoundationAssetSrc" apps/web/src scripts/` and append the result to `docs/design/asset-cleanup-baseline.md` under a "FOUNDATION consumers" section.
    - Predicted: 0 production consumers; if any are found in `apps/web/src/**`, list them so Task 2.3 can rewire them.
    - _Requirements: 2.1, 2.2_

  - [x] 1.3 Capture `pnpm test:property` baseline
    - Run `pnpm test:property` and confirm all 4 properties (~295 generated cases) pass on the current commit.
    - Append the test summary line to `docs/design/asset-cleanup-baseline.md`.
    - This is the regression baseline gate referenced by Tasks 2.4, 3.6, and 4.6.
    - _Requirements: 9.1, 9.2_

- [x] 2. Phase 1 — Decision 2: extract FUXIE_FOUNDATION_ASSETS to scripts/
  - Move the unused FOUNDATION asset registry out of `apps/web/src` (which the audit scans) into `scripts/` (which the audit does not scan), so it stops being flagged as forbidden.

  - [x] 2.1 Create `scripts/foundation-assets.ts`
    - Create new file `scripts/foundation-assets.ts` exporting:
      - `FUXIE_FOUNDATION_ASSETS` literal (copy from current `apps/web/src/lib/mascot/fuxie-assets.ts`).
      - `FuxieFoundationAsset` type alias (`keyof typeof FUXIE_FOUNDATION_ASSETS`).
      - `getFuxieFoundationAssetSrc(key: FuxieFoundationAsset): string` helper.
    - Import `PLACEHOLDER_ASSET` from `apps/web/src/lib/mascot/fuxie-assets` so fallback behavior matches the original.
    - Add a top-of-file comment: "Tooling-only registry. Not bundled into apps/web. See .kiro/specs/asset-registry-cleanup/design.md Decision 2."
    - _Requirements: 2.1, 2.3_

  - [x] 2.2 Remove the FOUNDATION block from `apps/web/src/lib/mascot/fuxie-assets.ts`
    - Delete the `FUXIE_FOUNDATION_ASSETS` literal, the `FuxieFoundationAsset` type, and the `getFuxieFoundationAssetSrc` helper from `apps/web/src/lib/mascot/fuxie-assets.ts`.
    - Leave `FUXIE_MASCOT_STATES`, `FUXIE_WORLD_PROPS`, `FUXIE_UI_FRAMES`, `REWARD_ASSETS`, and `PLACEHOLDER_ASSET` untouched.
    - _Requirements: 2.1, 2.4_

  - [x] 2.3 Rewire any production consumers of FOUNDATION (if any)
    - For each consumer found in Task 1.2 inside `apps/web/src/**`:
      - If the consumer is a tooling/dev script, change its import to `scripts/foundation-assets.ts`.
      - If the consumer is real production code, replace the call with the appropriate `getFuxieMascotSrc(...)` / `getFuxieWorldPropSrc(...)` / `getFuxieUiFrameSrc(...)` equivalent and document the swap in the PR.
    - If Task 1.2 found 0 consumers, mark this task as N/A in the PR description.
    - _Requirements: 2.2, 2.3_

  - [x] 2.4 Verify Phase 1 with audit + property tests
    - Run `pnpm check:asset-audit` and confirm the forbidden-ref count drops from 8 → 0 (or to 0 + only entries unrelated to FOUNDATION, which would be a separate finding).
    - Run `pnpm test:property` and confirm Property 1 (`every-asset-key-resolves`) still passes.
    - Append the new audit summary to `docs/design/asset-cleanup-baseline.md` under a "After Phase 1" section.
    - _Requirements: 2.4, 9.1, 9.2_

- [x] 3. Phase 2 — Decisions 1 + 3: resolve 5 hardcoded asset paths
  - Swap learner-facing hardcoded `/fuxie-mascot/...` literals to `getFuxieMascotSrc(key)` calls so Property 2 (`no-hardcoded-public-fuxie-mascot-paths`) holds, and annotate the one dev-only exception.

  - [x] 3.1 Annotate dev-only debugger preview in `fuxie-live-3d.tsx`
    - In `apps/web/src/components/gamification/fuxie-live-3d.tsx` around line 445, add an `Allow_Comment` directive immediately above the hardcoded preview path:
      `// asset-registry-allow: dev-only debugger preview for layered imagegen-fullbody canvas, not learner-facing`
    - Do NOT change the path itself — this is the legitimate dev-tooling exception per Decision 1.
    - Verify the comment matches the exact regex consumed by `lint:asset-paths` (Property 2's allowlist directive).
    - _Requirements: 3.1, 3.5_

  - [x] 3.2 Swap hardcoded path in `OnboardingWizard.tsx:242`
    - In `apps/web/src/components/onboarding/OnboardingWizard.tsx` line 242, replace the hardcoded `/fuxie-mascot/...` literal with `getFuxieMascotSrc('authWelcomer')`.
    - Add the import `import { getFuxieMascotSrc } from "@/lib/mascot/fuxie-assets";` at the top of the file if not already present.
    - _Requirements: 3.2, 3.5_

  - [x] 3.3 Swap hardcoded path in `OnboardingWizard.tsx:492`
    - In `apps/web/src/components/onboarding/OnboardingWizard.tsx` line 492, replace the hardcoded `/fuxie-mascot/...` literal with `getFuxieMascotSrc('resultCelebration')`.
    - Reuse the import added in Task 3.2.
    - _Requirements: 3.2, 3.5_

  - [x] 3.4 Swap hardcoded path in `InstallPrompt.tsx:76`
    - In `apps/web/src/components/shared/InstallPrompt.tsx` line 76, replace the hardcoded `/fuxie-mascot/...` literal with `getFuxieMascotSrc('authWelcomer')`.
    - Add the import `import { getFuxieMascotSrc } from "@/lib/mascot/fuxie-assets";` at the top of the file.
    - _Requirements: 3.3, 3.5_

  - [x] 3.5 Swap hardcoded path in `mobile-shell.tsx:83`
    - In `apps/web/src/components/shared/mobile-shell.tsx` line 83, replace the hardcoded `/fuxie-mascot/...` literal with `getFuxieMascotSrc('authWelcomer')`.
    - Add the import `import { getFuxieMascotSrc } from "@/lib/mascot/fuxie-assets";` at the top of the file.
    - _Requirements: 3.4, 3.5_

  - [x] 3.6 Verify Phase 2 with lint + property tests
    - Run `pnpm lint:asset-paths` and confirm exit code 0 (no learner-facing hardcoded `/fuxie-mascot/...` literals remain).
    - Run `pnpm test:property` and confirm Property 2 still passes alongside Properties 1, 3, 4.
    - _Requirements: 3.5, 9.1, 9.2_

- [x] 4. Phase 3 — Decision 4: classify and resolve 80 orphan assets
  - For each of the 80 orphans flagged by `check:asset-audit`, FE drafts a verdict, DSD reviews the archive taxonomy, then FE applies the verdicts (wire / archive / delete).

  - [x] 4.1 Draft per-file orphan classification table
    - Create `docs/design/asset-orphan-classification.md` with a table: `Path | Verdict | Asset_Key (if wire) | Reason (if archive) | Notes`.
    - Verdict is one of: `wire-into-registry`, `archive`, `delete`.
    - For `wire-into-registry` rows, propose the target registry (`FUXIE_MASCOT_STATES` / `FUXIE_WORLD_PROPS` / `FUXIE_UI_FRAMES` / `REWARD_ASSETS`) and a candidate camelCase key.
    - For `archive` rows, propose a short reason from the taxonomy ("superseded by v2", "unused brand exploration", "duplicate of <key>", etc.).
    - For `delete` rows, justify why the file has zero historical value.
    - Pull the 80 paths directly from the audit output captured in Task 1.1.
    - _Requirements: 4.1, 4.2, 4.5_

  - [x] 4.2 ★ DSD review of archive reason taxonomy and verdicts
    - Design System Designer reviews `docs/design/asset-orphan-classification.md`.
    - DSD locks the closed set of archive reasons (taxonomy) and signs off on borderline `delete` calls.
    - FE iterates the table based on DSD feedback until DSD approves.
    - _Requirements: 4.2, 4.4_

  - [x] 4.3 Apply `wire-into-registry` verdicts
    - For every row in the classification table with verdict `wire-into-registry`, add a new key-value entry to the appropriate registry in `apps/web/src/lib/mascot/fuxie-assets.ts` (`FUXIE_MASCOT_STATES`, `FUXIE_WORLD_PROPS`, `FUXIE_UI_FRAMES`, or `REWARD_ASSETS`).
    - Use the camelCase asset key proposed in Task 4.1 / approved in Task 4.2.
    - Do NOT add new consumer call sites in this task — registry membership alone is sufficient to clear the orphan.
    - _Requirements: 4.1, 4.5_

  - [x] 4.4 Apply `archive` verdicts
    - The archive doc `docs/design/asset-archive.md` already exists from parent spec task 2.4 with header columns `Path | Reason | Archived by | Date` — do NOT recreate it.
    - For every row with verdict `archive`, append one row to `docs/design/asset-archive.md` using the DSD-approved reason from Task 4.2.
    - Format: `| /mascot-3d/optimized/... | <reason> | FE | YYYY-MM-DD |` (Path starts with `/`, Date is commit date).
    - Do NOT physically move the files; archive entry alone removes them from the orphan denominator (per design Decision 4 + Req 8.1).
    - _Requirements: 4.3, 4.4, 8.1, 8.3_

  - [x] 4.5 Apply `delete` verdicts
    - For every row with verdict `delete`, remove the file from `apps/web/public/` (and any sibling `*.webp` / `*.png` variants explicitly listed in the table).
    - Stage deletes as a separate commit so the diff is reviewable.
    - _Requirements: 4.3, 4.5_

  - [x] 4.6 Verify Phase 3 with audit + property tests
    - Run `pnpm check:asset-audit` and confirm: coverage ≥ 0.95, orphan count = 0, preference issue count = 0.
    - Run `pnpm test:property` and confirm Properties 1 and 4 still pass alongside 2 and 3.
    - Append the new audit summary to `docs/design/asset-cleanup-baseline.md` under "After Phase 3".
    - If any orphan remains or coverage is below 0.95, return to Task 4.1 and amend the classification table.
    - _Requirements: 4.5, 9.1, 9.2_

- [x] 5. Phase 4 — Final smoke chain & DoD update
  - Run the full smoke pipeline, update the parent rollout DoD risks, and prepare the PR sign-off table.

  - [x] 5.1 Run full smoke chain
    - Execute, in order, from repo root: `pnpm lint:asset-paths && pnpm check:asset-integrity && pnpm check:asset-audit && pnpm check:state-shell-coverage && pnpm test:property`.
    - All five commands MUST exit 0. If any fails, fix the underlying issue in the relevant phase task and rerun the full chain.
    - Append the final smoke output (or just the summary lines) to `docs/design/asset-cleanup-baseline.md` under "Final smoke".
    - _Requirements: 5.1, 5.2, 9.1, 9.2_

  - [x] 5.2 Update gamified-ui-asset-rollout DoD
    - In `docs/design/release/gamified-ui-asset-rollout-dod.md`, flip Risk **R1** (forbidden FOUNDATION ref) and Risk **R2** (hardcoded paths) from their current state to 🟢 **RESOLVED**.
    - Add a cross-link to `.kiro/specs/asset-registry-cleanup/` next to each resolved risk so future readers can trace the cleanup.
    - _Requirements: 6.1, 6.2_

  - [x] 5.3 ★ Update PR description with sign-off table
    - In the cleanup PR description, add a sign-off table with three rows:
      - **Frontend Engineer** — code changes (Phases 1–3, smoke).
      - **Design System Designer** — archive taxonomy and verdict review (Task 4.2).
      - **Project Manager / Delivery Manager** — delivery readiness, DoD update (Task 5.2), risk closure.
    - Each row has a checkbox and a name slot.
    - _Requirements: 7.1, 7.2_

- [x] 6. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `★` are optional/should-do (DSD review can be async, sign-off table is recommended but not strictly required for merge).
- All tasks reference specific requirements for traceability.
- No new property tests are written — the existing 4 properties in `tests/asset-registry.spec.ts` are the acceptance gate and are validated after each phase.
- Phase order is strict: Phase 1 (FOUNDATION extraction) before Phase 2 (path swaps) before Phase 3 (orphan classification), because each phase reduces the noise that the next phase's audit run needs to interpret.
- All file changes are frontend-only (TypeScript / TSX, registry config, docs). No backend or infra changes are in scope.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3"] },
    { "id": 3, "tasks": ["2.4"] },
    { "id": 4, "tasks": ["3.1", "3.2", "3.3", "3.4", "3.5"] },
    { "id": 5, "tasks": ["3.6"] },
    { "id": 6, "tasks": ["4.1"] },
    { "id": 7, "tasks": ["4.2"] },
    { "id": 8, "tasks": ["4.3", "4.4", "4.5"] },
    { "id": 9, "tasks": ["4.6"] },
    { "id": 10, "tasks": ["5.1"] },
    { "id": 11, "tasks": ["5.2", "5.3"] }
  ]
}
```
