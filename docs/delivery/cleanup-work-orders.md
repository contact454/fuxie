# Cleanup work orders — repo gate debt

Owner: Claude (spec/QC). Date: 2026-06-03. These clear the **pre-existing** gate
failures surfaced during Slice A–C QC (see `qc-log.md`). They are tooling/i18n/QA
chores, not feature slices. None are caused by the feature work.

## CW-1 — Recalibrate `check:asset-audit` coverage (DevOps)

**Problem:** `pnpm check:quick` bails at `check:asset-audit`: optimized-asset coverage
49% (50/102) < 95% threshold. But the **orphans check is clean** — the 52 unreferenced
files are intentionally listed in `docs/design/asset-archive.md`. The coverage metric
doesn't credit archived files, so it can never pass.

**Fix:** in `scripts/asset-audit.ts`, compute coverage as `referenced / (total − archived)`
(or exclude archived basenames from the denominator). Keep the orphans/forbidden/optimized-
preference checks unchanged. Verify against `Req 2.1`.

**Acceptance:** `pnpm check:asset-audit` passes with archived files credited; `pnpm check:quick`
proceeds past it (then reflects only genuine issues).

```
ROLE: DevOps/Tooling Engineer for Fuxie. Fixed scope.
OBJECTIVE: Recalibrate scripts/asset-audit.ts coverage so archived files (docs/design/asset-archive.md) are not counted against the 95% threshold (coverage = referenced / (total − archived)). Do not weaken the orphans/forbidden/optimized-preference checks.
ACCEPTANCE: pnpm check:asset-audit passes on the current tree; orphans still reported if any appear; explain the formula change in the script comment. REPORT: diff + before/after audit output.
```

## CW-2 — i18n backlog: hardcoded copy → messages (i18n)

**Problem:** `check:locale-parity` = 364 violations (repo-wide hardcoded DE/VN copy). Worst
offenders are the mock-styled surfaces `DashboardMockupClient.tsx` and `SessionPlayer.tsx`
(hardcoded German greetings/labels). Also: wrap the one string our work added,
`MultipleChoice.tsx:299 "💡 Erklärung:"`.

**Fix (phase it):** move learner-facing strings into `apps/web/messages/{vi,de}.json` and use
`next-intl t()`; use `// locale-allow` only for genuinely route-local non-learner copy.
Start with `MultipleChoice.tsx:299`, then `DashboardMockupClient.tsx`, then `SessionPlayer.tsx`,
then the long tail. This is sizable — do in batches, gate each batch on `pnpm check:locale-parity`
trending down.

**Acceptance (per batch):** the targeted files have zero locale-parity violations; no UI regression.

```
ROLE: i18n Engineer for Fuxie (next-intl). Phased scope — confirm batch boundaries first.
OBJECTIVE: Reduce check:locale-parity violations by moving hardcoded learner-facing DE/VN copy into apps/web/messages/{vi,de}.json with t(). BATCH 1: apps/web/src/components/session/exercises/MultipleChoice.tsx (incl. "💡 Erklärung:") + dashboard/DashboardMockupClient.tsx + session/SessionPlayer.tsx. Keep keys consistent with existing message structure; // locale-allow only for non-learner route-local strings.
ACCEPTANCE: the batch files report zero locale-parity violations; pnpm build green; no visible copy regression (same rendered text). REPORT: diff, before/after violation counts, ALL gates.
```

## CW-3 — Regenerate visual-audit screenshot set (QA)

**Problem:** `check:visual-audit` = 166 violations, mostly "0 PNG files found under
`docs/design/visual-audit/qa-runs/2026-05-16/screenshots/`" + manifest references to
missing captures.

**Fix:** run `pnpm test:integration:capture` to (re)generate the screenshot set the
manifest expects, then re-run `pnpm check:visual-audit`. May require a running dev server /
seed data — confirm prerequisites first. If the 2026-05-16 run is stale, update the
manifest/run date instead of regenerating against an old baseline.

**Acceptance:** `pnpm check:visual-audit` passes (or violations reflect only genuine visual
diffs to triage), with captures present.

```
ROLE: QA Automation Engineer for Fuxie. Confirm environment prerequisites before running.
OBJECTIVE: Resolve check:visual-audit's 166 violations: regenerate the screenshot captures via pnpm test:integration:capture for the manifest (tests/integration/visual-capture.manifest.json), or update the qa-run date if 2026-05-16 is stale. Note: Slice C-1 just changed the shared chrome to deep-blue — new captures should reflect that.
ACCEPTANCE: captures present; pnpm check:visual-audit passes or lists only genuine diffs to triage. REPORT: command output, what was regenerated, residual violations.
```

## Sequencing note
CW-1 unblocks `check:quick` (so later checks in the chain run). CW-2/CW-3 reduce the
standing red. None block the feature slices, but all should land before any
"all gates green / release candidate" claim.
