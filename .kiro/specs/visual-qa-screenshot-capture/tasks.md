# Implementation Plan: Visual QA Screenshot Capture

**Vai chinh:** QA Automation Engineer
**Vai phoi hop:** Frontend Engineer, Project Manager / Delivery Manager

> Role-gate ref: `.agents/personnel/qa-automation-engineer.md` (test plan + acceptance gates), `.agents/personnel/frontend-engineer.md` (PNG review post-capture), `.agents/personnel/project-manager-delivery-manager.md` (DoD pack flip ownership).

## Overview

Convert the design's 8-phase rollout plan into a series of incremental, code-level tasks that close Risk R3 of the `gamified-ui-asset-rollout` DoD pack. Each leaf task is a discrete coding action: edit a file, generate a manifest, write a Playwright spec, add a property test, run an acceptance script.

**Execution model:**

- Phases 0–4 + Phases 6–8 are deterministic file edits and runnable in any environment.
- **Phase 5 (Task 6) is the actual Playwright capture run** and requires a live dev server + seeded DB. If executed inside a sandbox that lacks those prerequisites, Task 6.2 is deferred to a human/CI environment and downstream tasks that depend on PNG outputs (Task 7, parts of Task 8) defer with it.
- Property tests (Task 10) are pure-logic Vitest property tests — fully runnable in any environment, including sandboxed CI.

**Marker key:**

- `*` postfix on a sub-task checkbox = optional/should-have task (skip-able for MVP without breaking the workflow). Standard Kiro spec format.
- ⚠️ = environment-blocked task (cannot run inside a sandbox without dev server + seeded DB).

## Tasks

- [x] 1. Phase 0 — Baseline & state driver mapping
  - [x] 1.1 Count PENDING markers in 13 checklist files
    - Run `grep -c '(PENDING capture)' docs/design/visual-audit/qa-runs/2026-05-16/*.md` to get a per-file count.
    - Sum the per-file counts to derive the total baseline marker count.
    - Save the per-file counts and total to `docs/design/visual-qa-baseline.md` (new file) under section "PENDING marker baseline".
    - _Reference: Req 1.7_

  - [x] 1.2 Inspect surface table to verify 13 surface IDs and `requiresSeed` flags
    - Read `tests/integration/utils/surfaces.ts` and locate the `P0_SURFACES` export.
    - Verify the table contains exactly 13 entries with the surface IDs declared in the design's Data Models table.
    - Document the resulting `<id, requiresSeed>` mapping in the same `docs/design/visual-qa-baseline.md` under section "P0 surface table".
    - _Reference: Req 2_

  - [x] 1.3 Derive per-surface state set from the 13 checklist files
    - Read each Markdown file under `docs/design/visual-audit/qa-runs/2026-05-16/*.md` (excluding `README.md`).
    - For every surface, extract the set of states declared (`default`, `empty`, `error`, `locked`, `success`) from the existing `(PENDING capture)` lines.
    - Document the resulting `<surface → state set>` mapping in `docs/design/visual-qa-baseline.md` under section "Per-surface state set".
    - _Reference: Req 1.3, Req 1.4_

  - [x] 1.4 Identify state driver per `<surface, state>` pair
    - For each `<surface, state>` pair derived in Task 1.3, choose one driver kind: `queryParam`, `routeIntercept`, `mockFetch`, or `seedReset`. Default state uses `none`.
    - Use the per-surface table from Decision 2 in design.md as the starting point; resolve any state not listed via the route inspection rules in Decision 2.
    - Document the resulting `<surface, state> → stateDriver` mapping in `docs/design/visual-qa-baseline.md` under section "State driver mapping".
    - _Reference: Decision 2_

- [x] 2. Phase 1 — Manifest authoring
  - [x] 2.1 Generate the Capture_Manifest JSON file
    - Create `tests/integration/visual-capture.manifest.json` as a JSON array.
    - Emit one entry per `<surface, state, viewport>` triple derived from the Phase 0 baseline (Tasks 1.3 + 1.4).
    - Each entry conforms to Decision 1's schema: `surface`, `state`, `viewport`, `route`, `evidencePath`, `requiresSeed`, optional `stateDriver`.
    - `evidencePath` matches the regex `^screenshots/<surface>/<surface>-<state>-<viewport>\.png$` (Req 6.1).
    - `requiresSeed` mirrors `P0_SURFACES[surface].requiresSeed` (Req 1.5).
    - _Reference: Decision 1, Req 1.1, Req 1.2, Req 1.3, Req 1.4, Req 1.5, Req 1.6, Req 1.7_

  - [x] 2.2 Validate manifest invariants offline
    - Write a short validator (inline `tsx` invocation or a node script under `tmp/`) that asserts:
      - (a) `manifest.length === <baseline marker count from Task 1.1>`.
      - (b) Every entry passes the schema described in Decision 1 (string enums, `route` starts with `/`, `evidencePath` regex match).
      - (c) No duplicate `<surface, state, viewport>` triples.
    - Validator must exit non-zero on any violation. Used as a one-time gate before committing the manifest.
    - _Reference: Property P1, Req 1.6, Req 1.7_

- [x] 3. Phase 2 — Seed extension
  - [x] 3.1 Add 4 alias upserts to the dev seed script
    - Edit `scripts/seed-dev-data.ts` to add 4 idempotent alias upserts (one block per surface):
      - `R-A1-DEV-001` → `A1-T1-001` on table `ReadingExercise`.
      - `L-A1-DEV-001` → `L-A1-GOETHE-001-T1` on table `ListeningLesson` (+ ≥1 `ListeningQuestion`).
      - `W-A1-DEV-001` → `W-A1-T1-001` on table `WritingExercise`.
      - exam template alias on table `ExamTemplate` (+ ≥1 `ExamSection` + ≥1 `ExamTask`).
    - Each upsert uses the table's natural unique key so re-running the script yields zero new rows.
    - Where a legacy fixture file exists (e.g. `content/a1/reading/A1-T1-001.json`), read once and write twice (legacy ID + surface-table ID).
    - _Reference: Req 2.1, Req 2.2, Req 2.3, Req 2.4, Req 2.5, Req 2.6, Decision 3_

  - [ ]* 3.2 Add idempotence test for the seed extension
    - Add a test that runs the seed extension twice and asserts the row count for each affected table is unchanged after the second run.
    - Prefer an in-memory or sqlite test DB. If neither is available in this repo, document the test as deferred to a human-run integration check in `tests/integration/README.md`.
    - _Reference: Req 2.6_

- [x] 4. Phase 3 — Capture_Spec implementation
  - [x] 4.1 Create the Playwright capture spec
    - Create `tests/integration/visual-capture.spec.ts`.
    - Load `tests/integration/visual-capture.manifest.json` synchronously at module discovery time (before `test.describe`).
    - Emit one `test('<surface> / <state> / <viewport>', ...)` invocation per manifest entry.
    - _Reference: Req 3.1, Req 3.2, Decision 1_

  - [x] 4.2 Implement state drivers per manifest entry
    - For each entry, dispatch on `entry.stateDriver.kind`:
      - `queryParam`: append `?<param>=<value>` to `entry.route` before navigation.
      - `routeIntercept`: install `page.route(pattern, route => route.fulfill(...))` before navigation.
      - `mockFetch`: install one or more route handlers per the entry's declaration.
      - `seedReset`: call the dev-only reset endpoint; only allowed when `FUXIE_DEV_AUTH_ENABLED=true`.
      - `none` / undefined: navigate directly.
    - _Reference: Req 3.6, Decision 2_

  - [x] 4.3 Implement viewport setup
    - Set viewport to `390 × 844` for `entry.viewport === 'mobile'` and `1440 × 1100` for `entry.viewport === 'desktop'` before navigation.
    - _Reference: Req 3.4, Req 3.5_

  - [x] 4.4 Write screenshot to absolute evidencePath
    - Compute absolute output path: `<workspace_root>/docs/design/visual-audit/qa-runs/2026-05-16/<entry.evidencePath>`.
    - Call `page.screenshot({ path: <absolute>, fullPage: true })` after the surface reaches its declared state.
    - Ensure parent directory exists before writing (mkdir-p).
    - _Reference: Req 3.3, Req 3.7, Req 3.8_

  - [x] 4.5 Emulate `prefers-reduced-motion: reduce` for animation-prone states
    - For entries with `state ∈ {loading, success}` (and globally as a cheap drift-suppressor), call `page.emulateMedia({ reducedMotion: 'reduce' })` before navigation.
    - _Reference: Req 9.4_

  - [x] 4.6 Implement single navigation guard
    - After navigation, assert `expect(page).toHaveURL(<expected pattern>)` exactly once per test.
    - No additional behavioral assertions in this spec (the spec is capture-only).
    - _Reference: Req 3.9_

  - [x] 4.7 Implement 60 s timeout with structured error
    - Set Playwright `actionTimeout` and per-test timeout to 60 s.
    - On timeout, fail the test with a message containing all four tokens: `surface`, `state`, `viewport`, `reason`.
    - _Reference: Req 3.10_

  - [x] 4.8 Implement `FUXIE_CAPTURE_ONLY` env filter
    - Read `process.env.FUXIE_CAPTURE_ONLY` once at module load.
    - When set, narrow the executed entry set to entries whose `surface ∈ split(env, ',')`. Skip the rest with `test.skip`.
    - _Reference: Req 11.3_

  - [x] 4.9 Implement `FUXIE_PLAYWRIGHT_SKIP_SEEDED` guard
    - In a `beforeAll` hook, if `process.env.FUXIE_PLAYWRIGHT_SKIP_SEEDED === '1'`, fail immediately with the message: `Capture run requires seeded surfaces; FUXIE_PLAYWRIGHT_SKIP_SEEDED is incompatible with \`pnpm test:integration:capture\`.`
    - _Reference: Req 4.2_

  - [x] 4.10 Write summary file on non-zero exit
    - In a global teardown / reporter hook, when the run finishes with one or more failures, write a JSON summary to `tmp/playwright/visual-capture-summary.json` grouping entries by status (`passed`, `failed`, `skipped`) with their `(surface, state, viewport, reason)` tuples.
    - _Reference: Req 11.2_

- [x] 5. Phase 4 — Config + package.json wiring
  - [x] 5.1 Add `chromium-mobile-capture` Playwright project
    - Edit `tests/integration/playwright.config.ts` to add a new project `chromium-mobile-capture` as a sibling of `chromium-mobile-slow4g`.
    - Project does NOT register Slow 4G throttling.
    - Project sets `use: { screenshot: 'off' }`.
    - _Reference: Req 5.3, Req 5.4, Decision 4_

  - [x] 5.2 Adjust `testMatch` filters
    - Append `'**/visual-capture.spec.ts'` to the existing `testMatch` array in `tests/integration/playwright.config.ts`.
    - Confirm `vitest.property.config.ts` `testMatch` does not pick up the capture spec; add an exclusion rule if needed.
    - _Reference: Req 5.3, Req 10.4_

  - [x] 5.3 Add `test:integration:capture` pnpm script
    - Edit the workspace-root `package.json` to add the script `"test:integration:capture": "playwright test --config tests/integration/playwright.config.ts --project chromium-mobile-capture tests/integration/visual-capture.spec.ts"`.
    - _Reference: Req 5.1, Req 5.2_

  - [x] 5.4 Add `check:visual-audit` script and chain into `check:quick`
    - Edit `package.json` to add `"check:visual-audit": "tsx scripts/check-visual-audit-pack.ts"`.
    - Append the new step at the end of the existing `check:quick` chain so existing checks still fail-fast.
    - _Reference: Req 12.1, Req 12.5_

  - [x] 5.5 Document `test:integration:capture` in tests/integration README
    - Edit `tests/integration/README.md` to add a section documenting the new pnpm script, the prerequisites (`pnpm db:seed:dev`, `FUXIE_DEV_AUTH_ENABLED=true`), and the output path `docs/design/visual-audit/qa-runs/2026-05-16/screenshots/`.
    - _Reference: Req 5.5_

  - [x] 5.6 Document `scripts/visual-capture-diff.ts` in tests/integration README
    - Edit `tests/integration/README.md` to add a section explaining the reproducibility diff script (usage `tsx scripts/visual-capture-diff.ts <folderA> <folderB>` and the 2.0/255 MAPD threshold).
    - _Reference: Req 9.3_

- [ ] 6. Phase 5 — Capture run ⚠️ ENVIRONMENT BLOCKER

  > **⚠️ This phase requires a developer or CI machine with a live dev server and a seeded DB. It cannot complete inside a sandbox.** Task 6.2 must be deferred to a human-run if those prerequisites are absent. Tasks 7 and parts of 8 depend on the PNG outputs from this phase and defer with it.

  - [~] 6.1 Verify capture prerequisites
    - Confirm `pnpm dev:web` is running with `FUXIE_DEV_AUTH_ENABLED=true`.
    - Confirm `pnpm db:seed:dev` has been run after Task 3.1 lands (so the alias upserts are in the DB).
    - Spot-check one seeded P0 route (e.g. `/learn/reading/R-A1-DEV-001`) returns HTTP 200 with a non-empty `<title>`.
    - _Reference: Req 11.4_

  - [ ]* 6.2 Execute the capture run
    - Run `pnpm test:integration:capture` from the workspace root.
    - Expect exit code 0 and one PNG written per manifest entry.
    - **If the sandbox lacks a dev server or seeded DB, document this task as deferred** to the operator's environment in the spec PR description, listing the manifest entry count that will be produced.
    - _Reference: Req 3, Req 4_

- [ ] 7. Phase 6 — Marker flip (post-capture)
  - [~] 7.1 Flip PENDING markers to PASS in 13 checklist files
    - Run the marker-flip routine over `docs/design/visual-audit/qa-runs/2026-05-16/*.md` (excluding `README.md`).
    - For every line containing both an `evidencePath` and `(PENDING capture)`, replace `(PENDING capture)` with `(PASS — captured 2026-05-16)` only when a PNG exists at the resolved path.
    - Lines containing the `n/a (...)` marker are left byte-identical.
    - The `evidencePath` substring on each modified line is preserved byte-for-byte.
    - _Reference: Req 7.1, Req 7.2, Req 7.3, Decision 5_

  - [~] 7.2 Update `qa-runs/2026-05-16/README.md` sign-off row
    - Edit the "Owner sign-off" table: change the `FE — capture pass` row from `_pending_` to `2026-05-16` and add a short note (≤ 80 chars) referencing spec `visual-qa-screenshot-capture`.
    - _Reference: Req 7.4_

- [x] 8. Phase 7 — Acceptance + reproducibility scripts
  - [x] 8.1 Implement `scripts/check-visual-audit-pack.ts`
    - Create the script as a Node + TypeScript executable runnable via `tsx`.
    - Implement the four invariants from Decision 6:
      - I1: Zero `(PENDING capture)` markers under `docs/design/visual-audit/qa-runs/2026-05-16/`.
      - I2: Every `evidencePath` referenced by any checklist OR by the manifest has a matching PNG on disk.
      - I3: Every PNG under `qa-runs/2026-05-16/screenshots/**/*.png` is referenced by both at least one checklist and the manifest.
      - I4: Every PNG begins with the magic bytes `89 50 4E 47 0D 0A 1A 0A` at offset 0.
    - On any violation, exit non-zero and print a precise file:line list per invariant.
    - _Reference: Req 12.2, Req 12.3, Req 12.4, Decision 6_

  - [x] 8.2 Run `pnpm check:visual-audit` and verify all invariants pass
    - Execute the script via the new pnpm script.
    - Iterate on any reported violation until exit code is 0.
    - _Reference: Req 12_

  - [x] 8.3 Implement `scripts/visual-capture-diff.ts`
    - Create the script as a Node + TypeScript executable.
    - Decode each paired PNG with `pngjs`, convert to grayscale via luma weighting, resize to `256 × 256` (bilinear), compute MAPD, and exit 0 iff every paired MAPD is ≤ `2.0 / 255`.
    - Print per-pair `<evidencePath>: MAPD=<value>` lines for diagnostics.
    - _Reference: Req 9.2, Decision 7_

  - [ ]* 8.4 Run reproducibility verification
    - Run capture twice under identical environment, then run `tsx scripts/visual-capture-diff.ts <folderA> <folderB>`.
    - Expect exit code 0 (every paired MAPD within tolerance).
    - **Defers with Task 6.2 if dev server / seeded DB is unavailable in the current environment.**
    - _Reference: Req 9.1_

- [ ] 9. Phase 8 — DoD pack update
  - [~] 9.1 Flip R3 entry from MEDIUM to RESOLVED
    - Edit `docs/design/release/gamified-ui-asset-rollout-dod.md`: change the R3 risk entry from 🟠 MEDIUM to 🟢 RESOLVED.
    - Add a cross-link to the `qa-runs/2026-05-16/screenshots/` folder and to this spec folder.
    - Add a note (≤ 200 chars) recording the count of PNG files captured and the capture date `2026-05-16`.
    - _Reference: Req 8.1, Req 8.2, Req 8.3_

  - [~] 9.2 Update DoD pack sign-off table
    - Edit the same DoD pack: change the `FE` sign-off row from `⏳ Awaiting capture pass` to `✅ Approved` with the date `2026-05-16`.
    - _Reference: Req 8.4_

  - [~] 9.3 Remove R3 from "Out of scope for this Done tag"
    - Edit the "Final decision" section of the DoD pack: drop the R3 bullet from the "Out of scope" list (3 bullets → 2 bullets, R1 + R2 remain).
    - _Reference: Req 8.5_

- [x] 10. Property tests (offline, runnable in any environment)
  - [x] 10.1 Property test for manifest bijection
    - Create `tests/property/visual-capture/manifest-bijection.property.test.ts` using `fast-check` with `numRuns: 100`.
    - Generates synthetic baseline checklist + `P0_SURFACES` table and asserts Property 1's three clauses (schema validation, uniqueness of triples, bijection with PENDING markers).
    - _Reference: Property P1, Req 1_

  - [x] 10.2 Property test for spec generator
    - Create `tests/property/visual-capture/spec-generator.property.test.ts` using `fast-check` with `numRuns: 100`.
    - Drives a pure `generateSpec(manifest)` helper extracted from the capture spec module and asserts Property 2's seven clauses.
    - _Reference: Property P2_

  - [x] 10.3 Property tests for marker flip and PNG bijection
    - Create `tests/property/visual-capture/marker-flip.property.test.ts` using `fast-check` with `numRuns: 100`. Asserts Property 3's clauses 3 + 4 (markers flipped, n/a lines untouched, evidencePath byte-preserved).
    - Create `tests/property/visual-capture/png-bijection.property.test.ts` using `fast-check` with `numRuns: 100`. Asserts Property 3's clauses 1 + 2 (PNG ↔ manifest bijection, PNG magic bytes valid).
    - _Reference: Property P3_

  - [x] 10.4 Property test for MAPD computation
    - Create `tests/property/visual-capture/mapd.property.test.ts` using `fast-check` with `numRuns: 100`.
    - Asserts Property 4: identical inputs → MAPD = 0; exit code derived correctly from threshold; bilinear resize is deterministic across calls.
    - _Reference: Property P4_

  - [x] 10.5 Run the property suite and verify regression-free
    - Run `pnpm test:property`.
    - Expect: the 4 new property test files pass AND the existing 295 property tests remain green.
    - _Reference: Req 10.1_

- [x] 11. Final checkpoint — Ensure all tests pass
  - Ensure the property suite (Task 10) is green, the acceptance script (Task 8.2) is green, and the `pnpm check:quick` chain is green.
  - If Phase 5 (Task 6) was deferred to a human/CI environment, note this explicitly in the PR description; downstream Tasks 7, 8.4, and 9 also defer to that environment.
  - Ask the user if questions arise.

## Notes

- Sub-tasks marked with the `*` postfix (Kiro convention: `- [ ]* N.M ...`) are optional/should-have. They include the seed idempotence test (3.2), the capture run itself (6.2), and the reproducibility verification (8.4).
- Task 6 (Phase 5) is the only environment-blocked phase. Tasks 7 and 8.4 + 9.1's PNG-count note depend on its outputs and defer with it.
- Property tests (Task 10) are pure-logic Vitest tests and run fully in any environment, including sandboxes with no dev server.
- Each task references the granular requirement clauses or design Decisions/Properties it implements.
- Checkpoint task 11 verifies the green state of the test suite and the acceptance script before declaring the spec complete.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["1.4"] },
    { "id": 2, "tasks": ["2.1", "3.1"] },
    { "id": 3, "tasks": ["2.2", "3.2", "4.1", "5.1", "8.1", "8.3", "10.1", "10.2", "10.3", "10.4"] },
    { "id": 4, "tasks": ["4.2", "4.3", "4.4", "4.5", "4.6", "4.7", "4.8", "4.9", "4.10", "5.2", "5.3", "5.4", "5.5", "5.6", "10.5"] },
    { "id": 5, "tasks": ["6.1"] },
    { "id": 6, "tasks": ["6.2"] },
    { "id": 7, "tasks": ["7.1", "8.4"] },
    { "id": 8, "tasks": ["7.2", "8.2"] },
    { "id": 9, "tasks": ["9.1", "9.2", "9.3"] }
  ]
}
```

## Workflow Completion

This workflow has produced the planning artifacts (requirements, design, tasks). Implementation execution is a separate step:

- Open `tasks.md` and click "Start task" next to a task item to begin implementation.
- Phase 5 (Task 6) and its downstream tasks require a developer or CI environment with a live dev server and a seeded DB.
