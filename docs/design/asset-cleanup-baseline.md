# Asset Registry Cleanup — Baseline Snapshot

**Date:** 2026-05-16
**Commit SHA:** a20c207a
**Coverage:** 23.08% (24 / 104 optimized files referenced)
**Orphan count:** 0 (already neutralized — all 80 archive entries present in `docs/design/asset-archive.md`)
**Forbidden ref count:** 8 (all under `FUXIE_FOUNDATION_ASSETS.*`, paths in `/mascot-3d/foundation/v1/`)
**Property test status:** see Task 1.3

## Notes for the cleanup plan

- Tooling driver: `pnpm check:asset-audit` (= `tsx --tsconfig apps/web/tsconfig.json scripts/asset-audit.ts`).
- Exit code on this commit: **1** (FAIL) — failure is driven entirely by the two findings above (coverage < 95% and 8 forbidden refs).
- Phase 1 (Decision 2 — extract `FUXIE_FOUNDATION_ASSETS` to `scripts/`) targets the **8 forbidden refs**.
- Phase 3 (Decision 4 — orphan classification) targets the **coverage gap**: even though the audit currently reports `Orphans: (none)` because all 80 files are pre-listed in `docs/design/asset-archive.md`, those 80 files still sit at 0 production references. Phase 3 must split them into `wire-into-registry` / keep-archived / `delete` so coverage clears the 95% threshold.
- The "80 orphan files" referenced in `tasks.md` Task 1.1 are the entries currently parked in `docs/design/asset-archive.md`; the audit treats them as resolved-via-archive, but the cleanup spec still needs to classify them per Phase 3.

## `pnpm check:asset-audit` baseline output

### Console summary (stderr — failure reason)

```
check:asset-audit FAILED:
  - coverage 23.08% < threshold 95% (24/104 optimized files referenced)
  - 8 registry value(s) inside forbidden folders

Forbidden references:
  FUXIE_FOUNDATION_ASSETS.turnaround → /mascot-3d/foundation/v1/fuxie-foundation-01-turnaround.png (/foundation/)
  FUXIE_FOUNDATION_ASSETS.expressions → /mascot-3d/foundation/v1/fuxie-foundation-02-expressions.png (/foundation/)
  FUXIE_FOUNDATION_ASSETS.material-palette → /mascot-3d/foundation/v1/fuxie-foundation-03-material-palette.png (/foundation/)
  FUXIE_FOUNDATION_ASSETS.badge-neckerchief → /mascot-3d/foundation/v1/fuxie-foundation-04-badge-neckerchief.png (/foundation/)
  FUXIE_FOUNDATION_ASSETS.tail-design → /mascot-3d/foundation/v1/fuxie-foundation-05-tail-design.png (/foundation/)
  FUXIE_FOUNDATION_ASSETS.scale-readability → /mascot-3d/foundation/v1/fuxie-foundation-06-scale-readability.png (/foundation/)
  FUXIE_FOUNDATION_ASSETS.proportions → /mascot-3d/foundation/v1/fuxie-foundation-07-proportions.png (/foundation/)
  FUXIE_FOUNDATION_ASSETS.hero-reference → /mascot-3d/foundation/v1/fuxie-foundation-08-hero-reference.png (/foundation/)

Report written to tmp/asset-audit.md
Exit code: 1
```

### Full structured report (`tmp/asset-audit.md`)

```markdown
# Asset Audit Report

Status: ❌ FAIL

Roots scanned (recursive):
- `apps/web/public/mascot-3d/optimized/`
- `apps/web/public/mascot-3d/world/optimized/`
- `apps/web/public/mascot-3d/ui/optimized/`
- `apps/web/public/reward-assets/optimized/`

Archive doc: `docs\design\asset-archive.md` — present (80 entries)

## Coverage (Req 2.1)

- Threshold: ≥ 95%
- Files on disk: 104
- Files referenced by registry: 24
- Coverage: **23.08%** ✗

## Orphans (Req 2.2)

Optimized files that are not referenced by the registry **and** not listed
in `docs\design\asset-archive.md`. Resolve by either wiring the file into a registry
key or adding an archive entry.

_(none)_

## Forbidden folder references (Req 2.3)

Registry values inside `raw/`, `concept/`, `foundation/`, or
`reference-parts/` are not allowed.

- `FUXIE_FOUNDATION_ASSETS.turnaround` → `/mascot-3d/foundation/v1/fuxie-foundation-01-turnaround.png` (matched `/foundation/`)
- `FUXIE_FOUNDATION_ASSETS.expressions` → `/mascot-3d/foundation/v1/fuxie-foundation-02-expressions.png` (matched `/foundation/`)
- `FUXIE_FOUNDATION_ASSETS.material-palette` → `/mascot-3d/foundation/v1/fuxie-foundation-03-material-palette.png` (matched `/foundation/`)
- `FUXIE_FOUNDATION_ASSETS.badge-neckerchief` → `/mascot-3d/foundation/v1/fuxie-foundation-04-badge-neckerchief.png` (matched `/foundation/`)
- `FUXIE_FOUNDATION_ASSETS.tail-design` → `/mascot-3d/foundation/v1/fuxie-foundation-05-tail-design.png` (matched `/foundation/`)
- `FUXIE_FOUNDATION_ASSETS.scale-readability` → `/mascot-3d/foundation/v1/fuxie-foundation-06-scale-readability.png` (matched `/foundation/`)
- `FUXIE_FOUNDATION_ASSETS.proportions` → `/mascot-3d/foundation/v1/fuxie-foundation-07-proportions.png` (matched `/foundation/`)
- `FUXIE_FOUNDATION_ASSETS.hero-reference` → `/mascot-3d/foundation/v1/fuxie-foundation-08-hero-reference.png` (matched `/foundation/`)

## Optimized-preference issues (Req 2.4)

Registry values that point at `.png`/`.jpg`/`.jpeg` while a sibling
`.webp` with the same basename exists in the same directory. The
registry must prefer the `.webp`.

_(none)_

## Registry references missing on disk

(These are normally caught by `pnpm check:asset-integrity` but are
listed here for completeness; they do **not** count toward orphans.)

_(none)_
```

## Reproduction notes

- Local pwsh did not have `pnpm` on PATH; the npm script `check:asset-audit` was executed directly via the bundled `tsx` binary using the exact same command line:
  ```
  node_modules\.bin\tsx.cmd --tsconfig apps\web\tsconfig.json scripts\asset-audit.ts
  ```
- This is a 1:1 substitute for `pnpm check:asset-audit` per `package.json`.


## After Phase 1 (Decision 2 — extract-tooling)

**Date:** 2026-05-16
**Forbidden ref count:** 0 (was 8) ✅
**Coverage:** 23.08% (unchanged — targeted by Phase 3)
**Property test status:** 295 passed ✅
**Audit exit code:** 1 (driven by coverage only, not forbidden refs)

### Fixes applied to unblock Phase 1 verification:

- **Bug A** — removed `FUXIE_FOUNDATION_ASSETS` from `collectRegistryEntries()` `stringMaps` in `scripts/asset-audit.ts`, including the now-unused `FUXIE_FOUNDATION_ASSETS` import. Updated the top-of-file comment block to clarify that FOUNDATION is intentionally excluded from the production registry-entry collection per design Decision 2; `findForbiddenRefs` therefore returns 0 entries even though the FOUNDATION map still resolves the same eight `/mascot-3d/foundation/v1/...` paths via `scripts/foundation-assets.ts` for tooling consumers.
- **Bug B** — `tests/asset-registry.spec.ts` was still importing `FUXIE_FOUNDATION_ASSETS` and `getFuxieFoundationAssetSrc` from `../apps/web/src/lib/mascot/fuxie-assets` even though Task 2.2 had already removed the FOUNDATION block from that module. The named imports therefore resolved to `undefined` at module evaluation, crashing `Object.values(FUXIE_FOUNDATION_ASSETS)` inside `buildValidPathsUnion()`. Rewired both imports to `../scripts/foundation-assets` (the new home per Decision 2) and added a brief comment block explaining the move so future readers do not re-introduce the regression. As a defense-in-depth measure, `scripts/foundation-assets.ts` was also updated to inline `PLACEHOLDER_ASSET` as a local `const` instead of cross-importing it from `apps/web/src/lib/mascot/fuxie-assets`, removing the only remaining cross-module dependency from the tooling registry.

### Verification commands

```
# Audit gate
node_modules\.bin\tsx.cmd --tsconfig apps\web\tsconfig.json scripts\asset-audit.ts
# → forbidden = 0, coverage 23.08%, exit 1 (coverage only)

# Property tests
node_modules\.bin\vitest.cmd run --config vitest.property.config.ts --passWithNoTests
# → Test Files 16 passed (16) / Tests 295 passed | 4 skipped (299)
```


## After Phase 2 (Decision 1 + Decision 3 component swaps)

**Date:** 2026-05-16
**Commit SHA:** a20c207a (working tree)
**lint:asset-paths exit code:** 1 — by design (see below)
**Property test status:** 295 passed | 4 skipped (16 test files) ✅

### 5 Phase-2 baseline literals — all resolved

- `apps/web/src/components/gamification/fuxie-live-3d.tsx:445` (now line 442–445 area) → `Allow_Comment` directive `// asset-registry-allow: dev-only debugger preview for layered imagegen-fullbody canvas, not learner-facing` (Task 3.1)
- `apps/web/src/components/onboarding/OnboardingWizard.tsx:242` → `getFuxieMascotSrc('authWelcomer')` (Task 3.2)
- `apps/web/src/components/onboarding/OnboardingWizard.tsx:492` → `getFuxieMascotSrc('resultCelebration')` (Task 3.3)
- `apps/web/src/components/shared/InstallPrompt.tsx:76` → `getFuxieMascotSrc('authWelcomer')` (Task 3.4)
- `apps/web/src/components/shared/mobile-shell.tsx:83` → `getFuxieMascotSrc('authWelcomer')` (Task 3.5)

### Phase 2 verification — Property 2 (`Asset_Registry_Reference_Discipline`)

- `tests/asset-discipline.spec.ts` → 13 / 13 cases passed.
- Property 1 (`every-asset-key-resolves`, `tests/asset-registry.spec.ts`) → 12 / 12 passed (4 skipped — same as Phase-1 baseline).
- Property 3 (locale-parity), Property 4 (mascot-role / others) all green inside the 295-passed total.

### Why `lint:asset-paths` still exits 1 (pre-existing tracked debt, NOT a Phase 2 regression)

Property 2's spec file explicitly documents the lint script's role as a **separate tracker for pre-existing violations**, not a property-test gate:

> "We deliberately do NOT walk `apps/web/src/`. The codebase currently ships 96 known violations (per task 2.6 audit report); the lint script catches them at script level. The property test verifies the *contract* of the classifier so a regression in the classifier is loud, while pre-existing violations stay tracked by the lint job."
> — `tests/asset-discipline.spec.ts`, lines 26–32

After Phase 2 the lint reports **91 violations** (96 baseline − 5 resolved by Phase 2 = 91). All 91 are outside the Phase 2 scope (`Requirements 3.1–3.5`). They live in:

- `apps/web/src/app/fuxie-live-qa/page.tsx` — 41 violations (dev-only QA page; production-gated via `notFound()` when `NODE_ENV === 'production'`).
- `apps/web/src/components/gamification/fuxie-live-3d.tsx` — 43 violations inside the `FUXIE_RIGGED_3D_ASSET_SETS` v6b–v19 rig configuration block (`model` / `poster` / `manifest` triples), plus 1 at line 326 (`textureLoader.loadAsync` template literal inside the V10 layered debugger preview path; same dev-only context as line 445 already annotated by Task 3.1, but the literal ships inside a template-string interpolation rather than a module-level constant — out of Phase 2 scope to mutate).
- `apps/web/src/app/not-found.tsx`, `apps/web/src/app/page.tsx`, `apps/web/src/components/auth/LoginClient.tsx`, `apps/web/src/components/auth/RegisterClient.tsx` — 4 violations referencing `/mascot-3d/states/global/...` which already exist as `Asset_Key` entries in `FUXIE_GLOBAL_MASCOT_STATES`. Candidates for swap to `getFuxieGlobalMascotStateSrc(...)` in a future phase.
- `apps/web/src/components/course/course-node.test.tsx` — 2 violations in test-fixture reward-asset literals.

### Why we did NOT add a second `Allow_Comment` to `fuxie-live-3d.tsx:326` in this task

The original Phase 2 task brief speculated that line 326 (`/mascot-3d/imagegen-fullbody/v10/${part.image}`) might be a "newly observed baseline" and asked Task 3.6 to annotate it if it surfaced. On closer inspection, the literal at line 326 is one of 43 pre-existing violations inside `fuxie-live-3d.tsx`, not a newly-introduced regression. Annotating only line 326 would not change the lint outcome (still 90 violations) and would imply the rest are forgotten, which is misleading. Phase 3 + Phase 4 are the correct place to triage all 43 `fuxie-live-3d.tsx` violations together as part of the broader dev-tooling-vs-learner-facing classification — at that point the right move is one umbrella decision (annotate-the-block-once vs swap-to-`getFuxieGlobalMascotStateSrc`) rather than a per-line annotation drip.

### Verification commands

```
# Property tests
node_modules\.bin\vitest.cmd run --config vitest.property.config.ts --passWithNoTests
# → Test Files 16 passed (16) / Tests 295 passed | 4 skipped (299), exit 0

# Asset-path lint (substitute for `pnpm lint:asset-paths` when pnpm is not on PATH)
node_modules\.bin\tsx.cmd scripts/lint-asset-registry-references.ts
# → 91 hardcoded asset paths reported, exit 1 (pre-existing tracked debt; Phase 3 + 4 will drive to 0)
```


## After Phase 3 (Decision 4 — hybrid wire+delete, Option 1 accepted)

**Date:** 2026-05-16
**Wire count:** 26 (11 new mascot keys + 7 world rewires + 8 UI rewires)
**Delete count:** 2 v1 webp orphans
**Archive doc updates:** 2 reason updates (rows 74 + 75 of classification table — `fuxie-item-fuxie-sky-outfit-512.png` and `fuxie-item-german-postcard-512.png`, both flipped from `seed — registry wiring pending §X` to `variant — png alongside webp, kept for rollback`) + 2 row removals (deleted `.webp` files for `course-signpost` and `badge-shelf`)
**Coverage:** 49.02% (50/102) — under the 95% threshold; **accepted per Option 1 PM decision**
**Forbidden refs:** 0 ✅ (still)
**Orphans:** 0 ✅ (still — deleted files removed from both disk and archive denominator)
**Preference issues:** 0 ✅ (still)
**Property test status:** 295 passed | 4 skipped ✅ (Property 1 + Property 2 + Property 3 + Property 4 all green)
**Audit exit code:** 1 (driven by coverage only)

### What changed in this phase

- **`apps/web/src/lib/mascot/fuxie-assets.ts`:**
  - Added 11 new `FUXIE_MASCOT_STATES` entries for `.webp` core/role/game seed plates (`coreCelebration`, `coreDailyMission`, `coreHappyWave`, `gameFucoinReward`, `gameStreakFreezeSaved`, `roleExamGuide`, `roleLibrarian`, `rolePostOffice`, `roleRadioHost`, `roleShopkeeper`, `roleSpeakingCoach`). Registry membership alone clears the orphan per Task 4.3 brief; no consumer call sites added.
  - Rewired 7 `FUXIE_WORLD_PROPS` keys from `/world/global/...` to `/world/optimized/v2/...` plates (`courseSignpostPath`, `collectionBookTable`, `readingLibraryDesk`, `radioBoothConsole`, `speakingStageCafe`, `postOfficeCounter`, `marketBackpackStall`).
  - Rewired 8 `FUXIE_UI_FRAMES` keys from `/ui/global/...` to `/ui/optimized/v1/...` frame plates (`noticeBoard`, `courseCheckpointNode`, `collectionCardFrame`, `audioBroadcastPanel`, `letterReceiptFrame`, `resultRevealFrame`, `marketShelfFrame`, `emptyStateSignpost`).
- **`apps/web/public/mascot-3d/world/optimized/v1/`:**
  - Deleted `fuxie-world-03-course-signpost-512.webp` (row 28 of classification — v1 webp not wired, no v2 variant for this surface other than the new `courseSignpostPath` plate which the .png sibling already covers for rollback).
  - Deleted `fuxie-world-16-badge-shelf-512.webp` (row 52 — same shape: not wired, no v2 plate; `.png` sibling is rollback).
- **`docs/design/asset-archive.md`:**
  - Updated the reason for `/reward-assets/optimized/fuxie-item-fuxie-sky-outfit-512.png` and `/reward-assets/optimized/fuxie-item-german-postcard-512.png` from `seed — … registry wiring pending §X` to `variant — png alongside webp, kept for rollback`. The .webp counterparts are already wired via `REWARD_ASSETS.fuxieSkyOutfit` and `REWARD_ASSETS.germanPostcard`, so the canonical reason from the DSD-owned taxonomy is the variant-rollback line.
  - Removed 2 rows for the deleted `.webp` files (`fuxie-world-03-course-signpost-512.webp`, `fuxie-world-16-badge-shelf-512.webp`) — they no longer exist on disk so they cannot be archived.

### Why 26 wires, not 27

The classification draft proposed 27 wires (incl. `placeholder` as a `FUXIE_MASCOT_STATES` entry pointing at `fuxie-placeholder-512.webp`). Property 2 (`Asset_Key reference resolution`) and Property 3 (`Lookup Totality with Placeholder`) both encode the contract that **no declared key may resolve to `PLACEHOLDER_ASSET`** — the placeholder path is a sentinel reserved for the misses-fall-through path. Wiring `placeholder` produced counterexample `["placeholder"]` for both properties, confirming the sentinel contract is the property test's intended invariant. Backed out the wire; the file remains covered by the existing `placeholder asset — referenced via PLACEHOLDER_ASSET constant…` archive entry, so it is **not** an orphan in the audit.

### Why coverage is 49.02% and not ≥ 95%

Phase 3 applied only the verdicts that the FE classification draft + DSD review approved (`wire-into-registry` + `delete` for the 2 unambiguous v1 orphans). The remaining ~50 archive rows are `keep-archived` because:

- 13 `.png` reward-asset rollback variants alongside an already-wired `.webp` (Block E rows 68–80, plus rows 74/75 reason-updated).
- ~26 v1 world `.webp` / `.png` siblings whose surface is either now served by a v2 plate (rolled in here) or by a `/world/global/` asset (rollback path retained).
- A handful of `.png` siblings of newly-wired core/role/game `.webp` plates (Block A rows 1, 3, 5, 7, 9, 11, 13, 16, 18, 20, 22).

These archive rows count toward the audit's coverage **denominator** without adding to the **numerator**, so coverage hits 49.02%. Reaching ≥ 95% would require either deleting the long tail of rollback variants (DSD does not yet authorize this) or wiring placeholder keys for files no consumer references (registry bloat). Per Option 1 PM decision, this PR ships with the conservative wire+delete pass and hands off the long-tail decision as a **follow-up scope** for the next milestone.

### Follow-up scope (post-merge)

- DSD + PM decide whether to delete the ~13 `.png` rollback siblings of already-wired `.webp` files (low risk, easy to recover from source if needed) — this would lift coverage to roughly 50/(102 − 13) ≈ 56%.
- DSD decides whether the ~26 v1 world rollback files should be deleted now that v2 plates are wired (medium risk, larger surface) — this would lift coverage further but commits to no-rollback for v1.
- Any subsequent "wire all the things" pass on `FUXIE_MASCOT_STATES` for the 11 `.png` siblings of Block A would be an explicit Product Designer decision (registry naming and consumer wiring).

The DoD pack for `gamified-ui-asset-rollout` will note the residual coverage gap explicitly when Risks R1 (FOUNDATION ref) and R2 (hardcoded paths) are flipped to 🟢 RESOLVED, so reviewers see that "best-effort coverage" is the intended Spec A landing state.

### Verification commands

```
# Audit gate (forbidden / orphans / preference / coverage)
node_modules\.bin\tsx.cmd --tsconfig apps\web\tsconfig.json scripts\asset-audit.ts
# → forbidden = 0, orphans = 0, preference = 0, coverage 49.02% (50/102), exit 1 (coverage only)

# Property tests (Property 1 + Property 2 + Property 3 + Property 4 all green)
node_modules\.bin\vitest.cmd run --config vitest.property.config.ts --passWithNoTests
# → Test Files 16 passed (16) / Tests 295 passed | 4 skipped (299), exit 0
```


## Final smoke (Phase 4 — Option 1 acceptance)

**Date:** 2026-05-16
**Commit SHA:** a20c207a (working tree, post Phase 1 + 2 + 3)
**Smoke chain results:**

| Command | Exit | Status | Notes |
|---|---|---|---|
| `pnpm lint:asset-paths` | 1 | ACCEPTED-DEBT | 91 hardcoded paths reported (96 baseline − 5 resolved by Phase 2). All 91 are pre-existing tracked debt outside Phase 2 scope (`fuxie-live-qa/page.tsx` 41, `fuxie-live-3d.tsx` 44, `not-found.tsx`/`page.tsx`/`LoginClient.tsx`/`RegisterClient.tsx` 4, `course-node.test.tsx` 2). Out of scope per Phase 2 doc; tracked for follow-up. |
| `pnpm check:asset-integrity` | 0 | PASS ✅ | `verified 278 entries across 10 maps` — every registry value resolves to a file on disk. |
| `pnpm check:asset-audit` | 1 | ACCEPTED-DEBT | coverage 49.02% (50/102) < threshold 95%; **forbidden = 0, orphans = 0, preference = 0**. Coverage gap is the only failure dimension; accepted per Option 1 PM decision (long-tail rollback siblings + v1 world variants kept-archived; follow-up scope documented in "After Phase 3" section). |
| `pnpm check:state-shell-coverage` | 0 | PASS ✅ | 13 P0 surfaces, all required states declared (`dashboard`, `course`, `vocabulary`, `vocabulary-practice`, `vocabulary-microgames`, `reading`, `listening`, `speaking`, `speaking-roleplay`, `writing`, `review`, `rewards-shop`, `exam`). Zero missing states. |
| `pnpm test:property` | 0 | PASS ✅ | Test Files 16 passed (16) / Tests 295 passed \| 4 skipped (299), Duration 12.78s. Properties 1 (`every-asset-key-resolves`), 2 (`Asset_Registry_Reference_Discipline`), 3 (`Lookup Totality with Placeholder`), 4 (`mascot-role`) all green; Properties 9/11/15/18/22 also green (no regressions in adjacent surfaces). |

**Blocking gates:** all `0` exits where required — `check:asset-integrity` (0 ✅), `check:state-shell-coverage` (0 ✅), `test:property` (0 ✅).
**Accepted-debt gates:** `lint:asset-paths` (1, 91 violations = pre-existing baseline minus 5 Phase-2 resolutions) + `check:asset-audit` (1, coverage-only — 49.02% < 95%). Both accepted per Option 1 PM decision; follow-up scope documented in the "After Phase 3" section above (DSD-authorized rollback-variant deletions and v1 world cleanup would lift coverage in a subsequent milestone).

### Reproduction commands (pnpm-substitute via bundled tsx/vitest binaries; pnpm not on PATH)

```
node_modules\.bin\tsx.cmd scripts\lint-asset-registry-references.ts
# → 91 violations, exit 1 (ACCEPTED-DEBT)

node_modules\.bin\tsx.cmd --tsconfig apps\web\tsconfig.json scripts\asset-registry-integrity.ts
# → verified 278 entries across 10 maps, exit 0 (PASS)

node_modules\.bin\tsx.cmd --tsconfig apps\web\tsconfig.json scripts\asset-audit.ts
# → coverage 49.02% (50/102), forbidden=0/orphans=0/preference=0, exit 1 (ACCEPTED-DEBT — coverage only)

node_modules\.bin\tsx.cmd --tsconfig apps\web\tsconfig.json scripts\check-state-shell-coverage.ts
# → 13 P0 surfaces OK, exit 0 (PASS)

node_modules\.bin\vitest.cmd run --config vitest.property.config.ts --passWithNoTests
# → Test Files 16 passed (16), Tests 295 passed | 4 skipped (299), exit 0 (PASS)
```

**Phase 4 verdict:** smoke chain accepted under Option 1. Registry contract is sound (integrity 0), state-shell contract is sound (state-shell 0), property gates are green (test:property 0). The two non-zero exits (`lint:asset-paths`, `check:asset-audit`) are both confined to pre-existing tracked debt with documented follow-up paths and zero regression versus the Phase 0/1/2/3 baselines. Ready to proceed to Task 5.2 (DoD update on `gamified-ui-asset-rollout`).
