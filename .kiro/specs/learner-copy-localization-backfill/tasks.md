# Implementation Plan: Learner Copy Localization Backfill

## Overview

Backfill 5 hard-coded learner-facing strings in `apps/web/src/components/writing/writing-player.tsx` (lines 622, 658, 666, 722, 760) into the next-intl namespace `WritingPlayer`, with verbatim Vietnamese values in `apps/web/messages/vi.json` and Translation_Review-approved German values in `apps/web/messages/de.json`. Execution follows the 5-phase rollout in design.md: pre-implementation baseline → translation review → JSON edits → component swap → verification → DoD update. No new property tests are introduced; the existing 21 locale-parity property tests (numRuns=100) plus `pnpm check:locale-parity` are the acceptance gate.

Vai chinh: Vietnamese-German Localization Specialist
Vai phoi hop: German Content Writer, Frontend Engineer, Project Manager / Delivery Manager

## Tasks

- [x] 1. Phase 0 — Pre-implementation baseline
  - Establish a known-good baseline before any edits so the post-change deltas are unambiguous.
  - Owner: Frontend Engineer (with PM tracking).

  - [x] 1.1 Run `pnpm check:locale-parity` baseline
    - Execute `pnpm check:locale-parity` from repo root.
    - Confirm the script reports exactly 5 t()-discipline violations in `apps/web/src/components/writing/writing-player.tsx` at lines 622, 658, 666, 722, 760.
    - Capture stdout/stderr into the PR description as the "before" snapshot.
    - _Requirements: 6.1, 6.2_

  - [x] 1.2 Run `pnpm test:property` baseline
    - Execute `pnpm test:property` from repo root.
    - Confirm all 21 locale-parity property tests are green at `numRuns=100`.
    - Capture the run summary into the PR description as the "before" snapshot.
    - _Requirements: 6.3, 6.4_

- [x] 2. Phase 1 — Translation review preparation
  - Produce 5 CEFR-A2/B1-appropriate German strings before any code edits, with explicit sign-off recorded.
  - Owner: Vietnamese-German Localization Specialist.

  - [x] 2.1 Draft 5 German values for the `WritingPlayer` namespace
    - For each leaf, propose and verify the German value:
      - `WritingPlayer.promptHeader` → "Aufgabenstellung"
      - `WritingPlayer.grafikLabel` → "Grafik"
      - `WritingPlayer.contentPointsHeader` → "Inhaltspunkte:"
      - `WritingPlayer.draftPlaceholder` → "Schreibe deinen Text hier..." (use "du" tone)
      - `WritingPlayer.submitLabel` → "Einreichen"
    - Verify each value is CEFR A2–B1 appropriate, contains no rare or low-frequency vocabulary, and matches the learner-facing register established in `apps/web/messages/de.json`.
    - _Requirements: 4.1, 4.2, 4.3_

  - [x]* 2.2 Cross-review with German Content Writer
    - Optional second-pair-of-eyes review if the Localization Specialist is uncertain about any wording.
    - Capture any change in the draft notes before moving on.
    - _Requirements: 4.4_

  - [x] 2.3 Document final 5 German values with sign-off
    - Add the 5 final German values into the PR description in a clearly labelled table.
    - Include role-based sign-off line: Localization Specialist (translation), and (when 2.2 was used) German Content Writer (cross-review).
    - _Requirements: 4.1, 4.8_

- [x] 3. Phase 2 — JSON file edits
  - Add the `WritingPlayer` namespace with 5 leaves to both locale files, preserving JSON validity and the existing 180-key baseline.
  - Owner: Frontend Engineer.

  - [x] 3.1 Append `WritingPlayer` namespace to `apps/web/messages/vi.json`
    - Add 5 leaves verbatim from current writing-player.tsx hard-coded strings:
      - `promptHeader`: "Đề bài"
      - `grafikLabel`: "Biểu đồ"
      - `contentPointsHeader`: "Ý cần viết:"
      - `draftPlaceholder`: "Viết bài của em tại đây..."
      - `submitLabel`: "Nộp bài"
    - Preserve existing key ordering convention used in `vi.json`.
    - _Requirements: 1.1, 1.2, 5.1_

  - [x] 3.2 Append `WritingPlayer` namespace to `apps/web/messages/de.json`
    - Add 5 leaves using the Translation_Review-approved values from task 2.3.
    - Preserve existing key ordering convention used in `de.json`.
    - _Requirements: 2.1, 2.2, 4.1, 5.1_

  - [x] 3.3 Verify JSON validity and key counts
    - Confirm both `apps/web/messages/vi.json` and `apps/web/messages/de.json` parse as valid JSON (`node -e "JSON.parse(require('fs').readFileSync('apps/web/messages/vi.json','utf8'))"` and equivalent for de).
    - Confirm leaf-key count = 185 in each locale (180 existing + 5 new).
    - _Requirements: 5.2, 5.3_

- [x] 4. Phase 3 — Component swap in `writing-player.tsx`
  - Replace 5 hard-coded strings with `t()` calls under the `WritingPlayer` namespace, preserving all surrounding emoji/arrow markup.
  - Owner: Frontend Engineer.
  - Target file: `apps/web/src/components/writing/writing-player.tsx`.

  - [x] 4.1 Add `useTranslations` import
    - At the top of `apps/web/src/components/writing/writing-player.tsx`, add `import { useTranslations } from 'next-intl'` if not already present.
    - _Requirements: 3.1_

  - [x] 4.2 Add `useTranslations` hook call
    - Inside the component function, after existing React hooks, add `const t = useTranslations('WritingPlayer')`.
    - _Requirements: 3.2_

  - [x] 4.3 Swap line 622 — promptHeader
    - Replace literal `Đề bài` with `{t('promptHeader')}` in the JSX at line 622.
    - _Requirements: 3.3, 1.1_

  - [x] 4.4 Swap line 658 — grafikLabel
    - Replace literal `Biểu đồ` with `{t('grafikLabel')}` in the JSX at line 658.
    - _Requirements: 3.3, 1.1_

  - [x] 4.5 Swap line 666 — contentPointsHeader
    - Replace literal `📋 Ý cần viết:` with `📋 {t('contentPointsHeader')}` in the JSX at line 666.
    - Keep the leading "📋 " emoji + space inline as plain JSX text (do not move into the message catalog).
    - _Requirements: 3.3, 3.4, 1.1_

  - [x] 4.6 Swap line 722 — draftPlaceholder
    - Replace `placeholder="Viết bài của em tại đây..."` with `placeholder={t('draftPlaceholder')}` in the textarea at line 722.
    - _Requirements: 3.3, 1.1_

  - [x] 4.7 Swap line 760 — submitLabel
    - Replace literal `Nộp bài →` with `{t('submitLabel')} →` in the JSX at line 760.
    - Keep the trailing " →" arrow inline as plain JSX text (do not move into the message catalog).
    - _Requirements: 3.3, 3.4, 1.1_

- [x] 5. Phase 4 — Verification
  - Confirm the post-change state: locale parity passes, t() discipline passes, property tests still green, and visual smoke matches the design's emoji/arrow placement contract.
  - Owner: Frontend Engineer (automated checks); Localization Specialist + Frontend Engineer (manual smoke).

  - [x] 5.1 Run `pnpm check:locale-parity` — expect locale parity PASS + the 5 named violations gone
    - Execute `pnpm check:locale-parity` from repo root.
    - Confirm half 1 (locale parity between vi.json and de.json): PASS — vi=185 keys, de=185 keys (180 baseline + 5 new in WritingPlayer namespace).
    - Confirm half 2 (t() discipline): the 5 named violations at lines 622, 658, 666, 722, 760 of `apps/web/src/components/writing/writing-player.tsx` are ABSENT from the violation list.
    - Confirm total workspace violation count drops by exactly 5 (from 419 baseline to 414 post-change).
    - Note: Script overall exit code remains 1 (driven by the other 414 unrelated violations across the codebase). This is an accepted state — closing all 419 is a multi-spec effort outside this PR's blast radius (Req 7.1). The narrow success criterion for THIS spec is "the 5 spec-named violations are resolved", not "script exits 0".
    - Capture stdout into the PR description as the "after" snapshot.
    - _Requirements: 6.1, 6.2_

  - [x] 5.2 Run `pnpm test:property` — expect 21/21 green
    - Execute `pnpm test:property` from repo root.
    - Confirm all 21 locale-parity property tests still pass at `numRuns=100`.
    - Capture run summary into the PR description as the "after" snapshot.
    - _Requirements: 6.3, 6.4_

  - [ ]* 5.3 Manual smoke — `vi` locale render
    - Render the writing player in the `vi` locale (storybook or local dev session).
    - Verify all 5 strings display as the verbatim Vietnamese values from task 3.1.
    - Verify the "📋 " emoji still appears immediately to the left of `contentPointsHeader` and the " →" arrow still appears immediately to the right of `submitLabel`.
    - _Requirements: 3.4, 7.1_

  - [ ]* 5.4 Manual smoke — `de` locale render
    - Render the writing player in the `de` locale (storybook or local dev session).
    - Verify all 5 strings display the Translation_Review-approved German values from task 2.3.
    - Verify the "📋 " emoji and " →" arrow appear in the same positions as in the `vi` render.
    - _Requirements: 3.4, 7.2_

- [x] 6. Phase 5 — DoD update and PR sign-off
  - Update the release DoD record and finalize the PR with explicit cross-role sign-off.
  - Owner: Project Manager / Delivery Manager.

  - [x] 6.1 Update the gamified UI asset rollout DoD
    - In `docs/design/release/gamified-ui-asset-rollout-dod.md`, mark the **R-locale parity** row as 🟢 RESOLVED.
    - Add a cross-link from that row to `.kiro/specs/learner-copy-localization-backfill/`.
    - _Requirements: 7.3_

  - [x] 6.2 Finalize PR sign-off table
    - In the PR description, add a sign-off table with three rows:
      - Vietnamese-German Localization Specialist — translation values approved.
      - Frontend Engineer — code wiring + verification approved.
      - Project Manager / Delivery Manager — delivery and DoD update approved.
    - _Requirements: 4.8, 7.3_

## Notes

- Sub-tasks marked with `*` are optional. They can be skipped for a faster path to merge but are recommended whenever there is any wording uncertainty (2.2) or whenever the change touches visible JSX layout near emoji/arrows (5.3, 5.4).
- No new property tests are introduced. The existing 21 locale-parity property tests plus `pnpm check:locale-parity` are the acceptance gate; design.md does not define new universal correctness properties for this backfill.
- Each task references the granular requirement clauses it satisfies for traceability.
- Manual smoke tasks (5.3, 5.4) are kept as optional sub-tasks per the workflow constraint that end-to-end UI runs are not coding-agent tasks; they are tracked here so a human reviewer can claim them before merge.
- File paths used:
  - `apps/web/src/components/writing/writing-player.tsx` (lines 622, 658, 666, 722, 760)
  - `apps/web/messages/vi.json`
  - `apps/web/messages/de.json`
  - `docs/design/release/gamified-ui-asset-rollout-dod.md`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "2.1"] },
    { "id": 1, "tasks": ["2.2", "2.3"] },
    { "id": 2, "tasks": ["3.1", "3.2"] },
    { "id": 3, "tasks": ["3.3"] },
    { "id": 4, "tasks": ["4.1"] },
    { "id": 5, "tasks": ["4.2"] },
    { "id": 6, "tasks": ["4.3", "4.4", "4.5", "4.6", "4.7"] },
    { "id": 7, "tasks": ["5.1", "5.2"] },
    { "id": 8, "tasks": ["5.3", "5.4"] },
    { "id": 9, "tasks": ["6.1", "6.2"] }
  ]
}
```
