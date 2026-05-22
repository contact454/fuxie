# Visual QA Capture — Phase 0 Baseline

**Date**: 2026-05-16
**Spec context**: closes Risk **R3** of `gamified-ui-asset-rollout` DoD pack
**Spec folder**: `.kiro/specs/visual-qa-screenshot-capture/`
**Vai chinh**: QA Automation Engineer
**Vai phoi hop**: Project Manager / Delivery Manager

This document is the Phase 0 deliverable for spec `visual-qa-screenshot-capture` (Tasks 1.1 → 1.4). It establishes the baseline against which the Capture_Manifest (Task 2.1) and the Capture_Spec (Task 4) will be authored.

> **Total entries to capture**: **122** (combined PENDING markers — every `\(PENDING\)` and `\(PENDING capture\)` literal in the 13 checklist files is a one-to-one screenshot evidence marker; see §1 discrepancy note).

---

## §1 — PENDING marker baseline (Task 1.1)

### Method

Counted PENDING markers in `docs/design/visual-audit/qa-runs/2026-05-16/*.md` (excluding `README.md`) using `Select-String -Pattern "\(PENDING\)"` and `Select-String -Pattern "\(PENDING capture\)"` for both literal forms.

### Per-file counts

| File | `(PENDING capture)` | `(PENDING)` | **Total PENDING** |
| --- | ---: | ---: | ---: |
| dashboard.md | 12 | 0 | 12 |
| course.md | 0 | 15 | 15 |
| vocabulary.md | 0 | 7 | 7 |
| vocabulary-practice.md | 0 | 3 | 3 |
| vocabulary-microgames.md | 0 | 6 | 6 |
| reading.md | 0 | 12 | 12 |
| listening.md | 0 | 10 | 10 |
| speaking.md | 0 | 8 | 8 |
| speaking-roleplay.md | 0 | 7 | 7 |
| writing.md | 0 | 8 | 8 |
| review.md | 0 | 10 | 10 |
| rewards-shop.md | 0 | 14 | 14 |
| exam.md | 0 | 10 | 10 |
| **TOTAL** | **12** | **110** | **122** |

### Discrepancy with Task 1.1 literal grep

Task 1.1 specifies `grep -c '(PENDING capture)' …`, which would yield only **12** markers (all in `dashboard.md`). The other 12 checklist files use the shorter literal `(PENDING)`. Both forms are functionally PENDING markers per the runbook semantic (a screenshot has not yet been captured), so the **true baseline = 122**.

The acceptance script `scripts/check-visual-audit-pack.ts` (Decision 6, Invariant I1) MUST therefore match BOTH literal forms via regex `\(PENDING( capture)?\)` to detect any leftover marker after the marker-flip step (Phase 6, Task 7.1). The marker-flip script (Decision 5) MUST also match both literal forms.

> **Followup for the manifest authoring (Task 2.1)**: the Capture_Manifest is keyed by unique `<surface, state, viewport>` triple (Decision 1, Property P1.2), so it contains **44** entries (not 122) — see §3 + §4 for the triple count. The 122 marker-flip count in §1 is the count the marker-flip script (Decision 5) operates on, not the manifest size. Property 1's bijection clause (Property P1, design.md) is verified against the **44**-entry manifest mirroring the **44** declared triples in the baseline.

### Note on adjacent non-counted PENDING text

`vocabulary.md` row **V2** carries an additional plain-text `PENDING — sign-off requires GD + DSD review during capture pass` in the Status column. This is **not** captured by the `\(PENDING\)` regex (no surrounding parens), so it does not contribute to the §1 counts. It is a tester sign-off followup that flips when GD + DSD review the captured PNG; the marker-flip script does not touch it.

> **Manifest entry count (Task 2.1)**: **44** entries — one per unique `<surface, state, viewport>` triple from §3/§4. The 122 marker total in §1 is the marker-flip count, not the manifest size.

After dedup against `(surface, state, viewport)` triples (the manifest's uniqueness key per Decision 1 / Property P1.2), several PENDING markers on different rows of the same checklist resolve to the **same** triple — e.g. `dashboard.md` rows D1, D2, D3, D4, D5 all reference `screenshots/dashboard/dashboard-default-mobile.png` (one PNG covers 5 spec items). The manifest needs **one entry per unique triple**, not one per PENDING marker; the marker-flip script (Decision 5) flips every line that references that PNG, so the 122 marker-flips → 44 manifest entries → 44 PNG files contract holds. See §3 + §4 for the **37 unique `<surface, state>` pairs** which expand to **44 unique `<surface, state, viewport>` triples** after counting the 7 desktop variants declared across 7 files.

---

## §2 — P0 surface table (Task 1.2)

### Source

`tests/integration/utils/surfaces.ts` `P0_SURFACES` export — verified 13 entries.

### Mapping

| # | Surface ID | Route | `requiresSeed` | Notes |
| ---: | --- | --- | :---: | --- |
| 1 | `dashboard` | `/dashboard` | false | Village Square hero |
| 2 | `course` | `/course?level=A1` | false | A1 course path with gating |
| 3 | `vocabulary` | `/vocabulary` | false | Collection book |
| 4 | `vocabulary-practice` | `/vocabulary/practice` | false | Practice entry, default-only state coverage |
| 5 | `vocabulary-microgames` | `/vocabulary/microgames` | false | Microgames hub; `success` via Result_Reward_Loop |
| 6 | `reading` | `/reading/A1-T1-001` | **true** | Seed alias `R-A1-DEV-001 → A1-T1-001` (Task 3.1) |
| 7 | `listening` | `/listening/L-A1-GOETHE-001-T1` | **true** | Seed alias `L-A1-DEV-001 → L-A1-GOETHE-001-T1` |
| 8 | `speaking` | `/speaking/dev-a1-begruessung-01` | **true** | ID already matches; verify lesson seed present |
| 9 | `speaking-roleplay` | `/speaking/roleplay?scenario=self-intro&level=A1` | false | Companion mascot opposite avatar |
| 10 | `writing` | `/writing/W-A1-T1-001` | **true** | Seed alias `W-A1-DEV-001 → W-A1-T1-001` |
| 11 | `review` | `/review` | false | Bright-Sky/deep-blue counts; `cheer` mascot in empty (reached-goal) |
| 12 | `rewards-shop` | `/rewards/shop` | false | Wallet pill + 4 item states; `success` overlay post-redeem |
| 13 | `exam` | `/exam/dev-a1-goethe-mini` | **true** | Silent mascot in default; ID already matches; verify template seed |

**Seeded surfaces** (`requiresSeed: true`): `reading`, `listening`, `speaking`, `writing`, `exam` — 5 surfaces, matching design.md Decision 3 alias upserts.

**Route note vs design.md Decision 2 table**: design.md mentions intercepts on `/api/courses/A1` and `/api/learner/dashboard`; the actual P0 route for `course` is `/course?level=A1` (not `/course`). The state-driver mapping below uses the actual P0 routes from `surfaces.ts` and the API patterns suggested by the design doc.

---

## §3 — Per-surface state set (Task 1.3)

### Method

For each of the 13 checklist files, extracted the set of `state` tokens that appear inside `screenshots/<surface>/<surface>-<state>-<viewport>.png` paths on lines that are explicitly screenshot evidence (lines containing both an `evidencePath` and a PENDING marker). Lines marked `n/a (...)` were excluded.

### Mapping

| Surface | States declared | Viewports declared | PENDING screenshot count |
| --- | --- | --- | ---: |
| dashboard | default, empty, error | mobile + desktop (default) | 12 |
| course | default, empty, locked, error | mobile + desktop (default C9) | 15 |
| vocabulary | default, empty, error | mobile | 7 (V2 evidence is a screenshot PENDING; the V2 Status text "PENDING — sign-off requires GD + DSD review" is plain text without parens and is not counted) |
| vocabulary-practice | default | mobile | 3 |
| vocabulary-microgames | default, success | mobile | 6 |
| reading | default, empty, error | mobile + desktop (default R6, R9) | 12 |
| listening | default, empty, error | mobile + desktop (default L3) | 10 |
| speaking | default, empty, error | mobile + desktop (default SP3) | 8 |
| speaking-roleplay | default, error | mobile + desktop (default SR3) | 7 |
| writing | default, empty, error | mobile + desktop (default W3) | 8 |
| review | default, empty, error | mobile | 10 |
| rewards-shop | default, empty, error, success | mobile | 14 |
| exam | default, error, **result** (post-submit) | mobile | 10 |

### Findings

- **`exam` uses state `result`, not `success`**, in its evidence paths (`screenshots/exam/exam-result-mobile.png`). The Capture_Manifest schema (design.md §Decision 1, Data Models) declares `state ∈ {default, empty, locked, error, success}` — `result` is not in the enum.
  - **Recommended resolution**: either (a) extend the manifest schema enum to `{default, empty, locked, error, success, result}` (PM approval needed — schema change), or (b) rename the 3 PENDING evidence paths in `exam.md` from `exam-result-mobile.png` to `exam-success-mobile.png` (PM approval needed — checklist edit). Option (b) aligns `exam` with `vocabulary-microgames` and `rewards-shop`, both of which use `success` for their post-submit Result_Reward_Loop captures. **Carry to Task 2.1 manifest authoring** for explicit decision.
- **`vocabulary.md` row V2** carries an additional plain-text "PENDING — sign-off requires GD + DSD review" in its Status column (not a `\(PENDING\)` literal — see §1 note). It is a tester sign-off followup that flips after GD + DSD review the captured PNG; it does not produce a separate manifest entry.
- **Course state set is 4 states** (`default, empty, locked, error`) — broader than design.md's planning best-estimate table (which lists `default, locked, error` for course). Manifest must include `course-empty-mobile.png`.
- **rewards-shop state set is 4 states** (`default, empty, error, success`) — design.md's planning best-estimate table lists `default, locked, error` for rewards-shop. Reality has no `locked` state (RS7 covers locked **items inside the catalog**, captured under default state) and adds `empty` + `success`. Manifest must use the actual 4-state set.
- **vocabulary-practice and speaking-roleplay** have no `empty` state in their checklists — empty/error short-circuit to the parent vocabulary / speaking surface (per `SURFACE_MASCOT_CONFIG` declarations).

---

## §4 — State driver mapping (Task 1.4)

### Method

For each `<surface, state>` pair derived in §3, selected one driver kind per design.md §Decision 2, using:

1. The per-surface mapping table in design.md §Decision 2 as the starting point.
2. Decision 2's general rules for unlisted pairs:
   - `default` state → driver `none` (direct navigation).
   - `error` states → driver `routeIntercept` returning HTTP 500 on the surface's primary API endpoint.
   - `empty` states → driver `routeIntercept` returning an empty/zero payload, except `dashboard.empty` which prefers `seedReset`.
   - `locked` states → driver `routeIntercept` returning a locked-payload variant.
   - `success` states → driver `routeIntercept` returning a "completed" payload (no `?completed=1` query-param affordance is documented in any surface, so route intercept is the safe default).
3. Viewport is **not** a driver dimension — the same driver applies to mobile and desktop captures of the same `(surface, state)` pair.

### Mapping

| Surface | State | Driver kind | Driver detail | Notes |
| --- | --- | --- | --- | --- |
| dashboard | default | `none` | direct nav `/dashboard` | both mobile + desktop |
| dashboard | empty | `seedReset` | dev-only `/api/dev/reset-learner` (fallback: `routeIntercept` `**/api/learner/dashboard` → `{ streak: 0, xp: 0, quests: [] }`) | Decision 2 line 1 |
| dashboard | error | `routeIntercept` | `**/api/learner/dashboard` → status 500 | Decision 2 line 2 |
| course | default | `none` | direct nav `/course?level=A1` | both mobile + desktop |
| course | empty | `routeIntercept` | `**/api/courses/A1` → `{ units: [] }` | Not in Decision 2 table; derived from rule "empty states → routeIntercept empty payload" |
| course | locked | `routeIntercept` | `**/api/courses/A1` → all units `locked: true` | Decision 2 line 3 |
| course | error | `routeIntercept` | `**/api/courses/A1` → status 500 | Decision 2 line 4 |
| vocabulary | default | `none` | direct nav `/vocabulary` | mobile only |
| vocabulary | empty | `routeIntercept` | `**/api/vocabulary*` (list endpoint) → `{ items: [] }` | Decision 2 line 5 |
| vocabulary | error | `routeIntercept` | `**/api/vocabulary*` → status 500 | derived |
| vocabulary-practice | default | `none` | direct nav `/vocabulary/practice` | mobile only; no other states |
| vocabulary-microgames | default | `none` | direct nav `/vocabulary/microgames` | mobile only |
| vocabulary-microgames | success | `routeIntercept` | `**/api/vocabulary/microgames/submit` → `{ status: "earned", xp: 25, fucoin: 10 }` (drives `<ResultRewardLoop>` to earned phase) | Decision 2 line 7 generic; needs `prefers-reduced-motion: reduce` per Req 9.4 |
| reading | default | `none` | direct nav `/reading/A1-T1-001` (requires seed) | both mobile + desktop |
| reading | empty | `routeIntercept` | `**/api/reading/*` → empty payload | Not in Decision 2 (Decision 2 lists `error`+`success` for skill players); derived |
| reading | error | `routeIntercept` | `**/api/reading/*` → status 500 | Decision 2 line 6 |
| listening | default | `none` | direct nav `/listening/L-A1-GOETHE-001-T1` (requires seed) | both mobile + desktop |
| listening | empty | `routeIntercept` | `**/api/listening/*` → empty payload | derived |
| listening | error | `routeIntercept` | `**/api/listening/*` → status 500 | Decision 2 line 6 |
| speaking | default | `none` | direct nav `/speaking/dev-a1-begruessung-01` (requires seed) | both mobile + desktop |
| speaking | empty | `routeIntercept` | `**/api/speaking/*` → empty payload | derived |
| speaking | error | `routeIntercept` | `**/api/speaking/*` → status 500 | Decision 2 line 6 |
| speaking-roleplay | default | `none` | direct nav `/speaking/roleplay?scenario=self-intro&level=A1` | both mobile + desktop |
| speaking-roleplay | error | `routeIntercept` | `**/api/speaking/roleplay/*` → status 500 | derived |
| writing | default | `none` | direct nav `/writing/W-A1-T1-001` (requires seed) | both mobile + desktop |
| writing | empty | `routeIntercept` | `**/api/writing/*` → empty payload | derived |
| writing | error | `routeIntercept` | `**/api/writing/*` → status 500 | Decision 2 line 6 |
| review | default | `none` | direct nav `/review` | mobile only |
| review | empty | `routeIntercept` | `**/api/review/next` → `{ next: null, due: 0, overdue: 0 }` | Decision 2 line 8 |
| review | error | `routeIntercept` | `**/api/review/next` → status 500 | derived |
| rewards-shop | default | `none` | direct nav `/rewards/shop` | mobile only |
| rewards-shop | empty | `routeIntercept` | `**/api/rewards/shop/items` → `{ items: [] }` | derived |
| rewards-shop | error | `routeIntercept` | `**/api/rewards/shop/items` → status 500 | derived |
| rewards-shop | success | `routeIntercept` | `**/api/rewards/shop/redeem` → `{ status: "earned", item: {...} }` (drives post-redeem Result_Reward_Loop overlay) | Decision 2 line 9 generic; needs `prefers-reduced-motion: reduce` per Req 9.4 |
| exam | default | `none` | direct nav `/exam/dev-a1-goethe-mini` (requires seed) | mobile only; verify silent mascot |
| exam | error | `routeIntercept` | `**/api/exam/*` → status 500 | Decision 2 line 10 |
| exam | result (post-submit) | `routeIntercept` | `**/api/exam/*/submit` → `{ status: "graded", xp, fucoin, accuracy, time }` (drives Result_Reward_Loop) | **Schema enum mismatch** (see §3 finding); pending PM decision on `result` vs `success` rename |

### Driver kind summary

| Driver kind | Count | % of `<surface,state>` pairs |
| --- | ---: | ---: |
| `none` | 13 | 35% |
| `routeIntercept` | 23 | 62% |
| `seedReset` | 1 | 3% (dashboard.empty primary; intercept fallback documented) |
| `mockFetch` | 0 | 0% (no surface needs multi-endpoint mock) |
| `queryParam` | 0 | 0% (no surface documents a `?state=` knob) |

**Total `<surface, state>` pairs**: 37 (across 13 surfaces).

**Unique `<surface, state, viewport>` triples** (manifest entries — Decision 1 uniqueness key):

| Source | Mobile | Desktop | Total |
| --- | ---: | ---: | ---: |
| dashboard | 3 | 1 | 4 |
| course | 4 | 1 | 5 |
| vocabulary | 3 | 0 | 3 |
| vocabulary-practice | 1 | 0 | 1 |
| vocabulary-microgames | 2 | 0 | 2 |
| reading | 3 | 1 | 4 |
| listening | 3 | 1 | 4 |
| speaking | 3 | 1 | 4 |
| speaking-roleplay | 2 | 1 | 3 |
| writing | 3 | 1 | 4 |
| review | 3 | 0 | 3 |
| rewards-shop | 4 | 0 | 4 |
| exam | 3 | 0 | 3 |
| **TOTAL** | **37** | **7** | **44** |

**Manifest entry count** = **44** unique triples. The 122 PENDING markers in §1 expand to fewer manifest entries because each surface checklist references the same PNG path on multiple rows (e.g. `dashboard.md` rows D1–D5 all point to `screenshots/dashboard/dashboard-default-mobile.png` — 5 markers, 1 PNG, 1 manifest entry, 5 marker-flips on capture success).

### Followups for Phase 1 (Task 2.1)

1. **PM decision on `exam.result` vs `exam.success`** — block before manifest authoring.
2. **Confirm dev-only seed-reset endpoint** for `dashboard.empty` (Decision 2 line 1 mentions "fall back to routeIntercept if seed reset is not available"); if no endpoint exists, switch driver to `routeIntercept` outright.
3. **Confirm actual API endpoint patterns** for each surface during manifest authoring — the patterns above are best-estimates from runbook and surface naming; final patterns must be verified by `pnpm dev:web` + browser DevTools per surface OR by reading `apps/web/src/app/api/**` route handlers.
4. **`vocabulary-microgames.success` and `rewards-shop.success`** — verify whether the success payload alone is sufficient to drive the surface to the captured frame, or whether an additional learner-initiated tap is required (in which case capture spec must include a tap step before screenshot).

---

## Summary

- **§1**: 122 PENDING markers across 13 files (12 `(PENDING capture)` + 110 `(PENDING)`). All 122 are screenshot-evidence markers; the only non-counted PENDING text is a Status-column note in `vocabulary.md` row V2 (plain text without parens).
- **§2**: 13 P0 surfaces verified in `tests/integration/utils/surfaces.ts`; 5 require seed (reading, listening, speaking, writing, exam).
- **§3**: 37 unique `<surface, state>` pairs derived from PENDING evidence paths; expand to **44** unique `<surface, state, viewport>` triples (37 mobile + 7 desktop). One schema mismatch (`exam.result` not in design.md state enum) flagged for Task 2.1 decision.
- **§4**: Driver mapping covers all 37 pairs — 13 `none`, 23 `routeIntercept`, 1 `seedReset` (with intercept fallback). No surface needs `queryParam` or `mockFetch`.

**Next task**: Task 2.1 (Capture_Manifest authoring) consumes this baseline. The manifest must contain **44 entries** (one per unique `<surface, state, viewport>` triple); the acceptance script (Task 8.1) verifies the bijection of triples ↔ PNG ↔ checklist marker, where one PNG → one marker-flip per row that references it (typically multiple rows per PNG).


---

## Phase 7 acceptance — pre-capture baseline (Task 8.2)

**Date stamp**: 2026-05-16 23:53:48 +07:00 (Asia/Ho_Chi_Minh)
**Command**: `npm run check:visual-audit` (workspace root; underlying invocation is `tsx scripts/check-visual-audit-pack.ts`).
**Exit code observed**: **1** (non-zero — by design at this phase; see "Sandbox limitation" below).

### Why this section exists

Task 8.2 is the Phase 7 acceptance gate. The script `scripts/check-visual-audit-pack.ts` enforces the 4 invariants from design.md §Decision 6 (I1–I4). Two of those invariants depend on PNG files produced by Phase 5 (Task 6.2 — the actual Playwright capture run), which is environment-blocked: it requires a live `pnpm dev:web` instance with `FUXIE_DEV_AUTH_ENABLED=true` plus a seeded DB (`pnpm db:seed:dev` after Task 3.1). **Neither prerequisite is available in the sandbox executing the spec workflow**, therefore the literal task instruction "iterate until exit code is 0" cannot be satisfied here.

The PM (orchestrator) decision was to produce a documented baseline of the script output rather than fake a green run. This section becomes part of the PR description so the operator who runs Phase 5 knows exactly which violations should disappear after capture.

### Per-invariant violation counts

| Invariant | Source-of-truth (design.md §Decision 6) | Violations | Expected after Phase 5 |
| ---: | --- | ---: | ---: |
| **I1** | Zero `(PENDING capture)` AND `(PENDING)` markers under `qa-runs/2026-05-16/` | **122** | 0 (marker-flip step in Task 7.1 rewrites every PENDING line that has a matching PNG) |
| **I2** | Every `evidencePath` referenced by checklist OR manifest has a PNG on disk | **44** | 0 (one PNG per manifest entry) |
| **I3** | Every PNG is referenced by both a checklist AND the manifest | **0** (skipped — 0 PNGs on disk; vacuously true per script logic) | 0 |
| **I4** | Every PNG begins with magic bytes `89 50 4E 47 0D 0A 1A 0A` | **0** (vacuously true — no PNGs to validate) | 0 |
| **Total** | — | **166** violations | **0** |

### Sanity-check against Phase 0 baseline + manifest size

- I1 = 122 matches §1 PENDING marker total (12 long-form + 110 short-form). ✅
- I2 = 44 matches §4 manifest entry count (37 mobile + 7 desktop unique `<surface, state, viewport>` triples). ✅
- I3 = 0 matches §4 manifest size before any PNG capture exists. ✅
- I4 = 0 matches §4 manifest size before any PNG capture exists. ✅

The script's emitted note confirms the I3 short-circuit: `[check:visual-audit] note: 0 PNG files found under docs/design/visual-audit/qa-runs/2026-05-16/screenshots/ — I3 was skipped. Run \`pnpm test:integration:capture\` to produce captures.`

### One representative line per invariant (traceability)

Pulled verbatim from the captured stderr stream of the run (stored at `tmp/visual-audit-baseline.stderr.log` for forensic reference).

- **I1 representative** — `docs/design/visual-audit/qa-runs/2026-05-16/course.md:28  (PENDING)`
- **I2 representative** — `docs/design/visual-audit/qa-runs/2026-05-16/screenshots/course/course-default-desktop.png` referenced by `tests/integration/visual-capture.manifest.json:[5]` and `docs/design/visual-audit/qa-runs/2026-05-16/course.md:36`.
- **I3 representative** — n/a; the script's note emitted instead: `0 PNG files found under docs/design/visual-audit/qa-runs/2026-05-16/screenshots/ — I3 was skipped`.
- **I4 representative** — n/a; no PNG to read first 8 bytes from. The check is vacuously satisfied.

### Final summary line emitted

```
[check:visual-audit] FAILED — 166 violation(s) across I1=122 I2=44 I3=0 I4=0.
```

### Expected post-Phase-5 state

After Task 6.2 (`pnpm test:integration:capture`) succeeds and Task 7.1 (marker-flip) runs:

- 44 PNG files exist under `docs/design/visual-audit/qa-runs/2026-05-16/screenshots/` (one per manifest entry).
- 122 `(PENDING)` / `(PENDING capture)` markers are rewritten to `(PASS — captured 2026-05-16)` (multiple checklist rows can reference the same PNG; the marker-flip script flips every row that matches).
- `npm run check:visual-audit` (or `pnpm check:visual-audit`) **exits 0** with the message: `[check:visual-audit] OK — 44 PNG(s) verified, all 4 invariants pass.`
- All 4 invariants are green (I1=0, I2=0, I3=0, I4=0).

### Operator runbook for Phase 5 → Phase 7 green flip

1. Pull the branch on a machine with `pnpm` available (Vercel CI box, FE dev laptop, or any environment with Postgres + Node 22+).
2. `pnpm install`.
3. `pnpm db:seed:dev` (this picks up the Task 3.1 alias upserts so the 5 seeded surfaces resolve at the IDs declared in `tests/integration/utils/surfaces.ts`).
4. In a separate shell: `FUXIE_DEV_AUTH_ENABLED=true pnpm dev:web`.
5. `pnpm test:integration:capture` — expect exit 0 and 44 PNGs written under `docs/design/visual-audit/qa-runs/2026-05-16/screenshots/`.
6. Run the marker-flip script (Task 7.1) — flips 122 markers; preserves `n/a (...)` lines and `evidencePath` byte content per Decision 5.
7. `pnpm check:visual-audit` — expect exit 0 with all 4 invariants green.
8. Continue with Tasks 7.2, 8.4, 9.x as planned.

### Constraint notes

- The script and the manifest were **not modified** during this validation pass — read-only verification only, per the orchestrator's instruction.
- Forensic raw stderr lives at `tmp/visual-audit-baseline.stderr.log` (336 lines of clean per-violation listing) for any operator who wants to spot-check the categorisation above. The corresponding stdout is empty, which is consistent with the script's design (success goes to stdout, failures to stderr).


---

## Spec close — orchestrator final checkpoint (Task 11)

**Date stamp**: 2026-05-16 (Asia/Ho_Chi_Minh)
**Vai chinh**: Project Manager / Delivery Manager
**Vai phoi hop**: QA Automation Engineer, DevOps / Cloud Engineer

### Sandbox completion stats

- **44 / 51 tasks completed** in the sandbox (**86.3 %**).
- **7 / 51 tasks deferred** to the operator's environment (**13.7 %**) — Tasks 6.1, 6.2★, 7.1, 7.2, 8.4★, 9.1, 9.2, 9.3. (★ = optional in the spec's Kiro convention; runbook still expects 6.2 to run because 7.1, 8.4, and 9.x depend on its outputs.)
- All 7 deferrals are blocked solely on prerequisites that do not exist in the sandbox: `pnpm dev:web` with `FUXIE_DEV_AUTH_ENABLED=true`, a seeded Postgres DB carrying the Phase 2 alias upserts, and the 44 PNG outputs of `pnpm test:integration:capture`.

### Property suite final state

- Command: `pnpm test:property`.
- Result: **exit 0**, 21 test files, **342 passed | 4 skipped** (4 skipped are unrelated pre-existing skips), duration ≈ 13 s.
- Delta vs pre-spec baseline (16 files / 295 passed): **+5 files / +47 new tests**, regression-free across the original 295.
- Properties P1, P2, P3, P4 (design.md) all green at `numRuns: 100`.

### Acceptance script state

- Command: `pnpm check:visual-audit` (alias `npm run check:visual-audit`).
- Pre-capture baseline (this PR's snapshot): **exit 1**, 166 violations across I1=122 + I2=44 + I3=0 + I4=0 — fully expected, fully documented in §"Phase 7 acceptance — pre-capture baseline" above.
- Post-capture target (operator deliverable after step 5 of the runbook): **exit 0**, `OK — 44 PNG(s) verified, all 4 invariants pass.`
- Forensic raw stderr at `tmp/visual-audit-baseline.stderr.log` (336 lines, 26 994 bytes) for any operator who wants to spot-check the categorisation.

### Cross-link

Operator-facing closure document and runbook live in the spec PR template:
[`docs/design/release/visual-qa-screenshot-capture-pr-template.md`](./release/visual-qa-screenshot-capture-pr-template.md) — see §"Operator runbook" for the 8-step pass and §"Deferred to human / CI run" for the per-task blocking reason.

### Closure paragraph

This spec's sandbox-runnable scope is closed. The remaining 7 tasks are blocked solely on the operator running `pnpm test:integration:capture` on a developer machine with the documented prerequisites (Phase 5), then running the marker-flip routine (Phase 6), the post-capture acceptance script pass (Phase 7 re-run), and the DoD pack flip (Phase 8). Until those land, R3 stays 🟠 MEDIUM in `docs/design/release/gamified-ui-asset-rollout-dod.md`; once they land, R3 flips 🟠 → 🟢 and the parent rollout DoD pack records the closure date.
