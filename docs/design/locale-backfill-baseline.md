# Learner Copy Localization Backfill — Baseline Snapshot

This document captures the pre-implementation baseline state for the
`learner-copy-localization-backfill` spec. Sections are appended by
Tasks 1.1 and 1.2 independently; treat each section as a frozen
reference for the "before" half of the PR description.

## Property test baseline (locale-parity subset)

**Status:** PASS
**Locale-parity tests:** 21 passed at numRuns=100
**Overall property suite:** 295 tests passed (4 skipped, 299 total) across 16 test files
**Duration:** 15.22s

Captured by Task 1.2 via `pnpm test:property` (vitest run --config
vitest.property.config.ts --passWithNoTests). Exit code 0. Raw log
preserved at `tmp/property-baseline-locale-backfill.log`.

The 21 locale-parity tests live in `tests/locale-parity.spec.ts` and
exercise Property 18 (Locale Parity and t() Discipline) with `numRuns:
100` per assertion, covering:

- 5 parity invariants (Req 17.1, 17.2, 17.3, 17.8)
- 6 alt-text / greeting / decorative length classifications (Req 17.5, 17.6, 17.7)
- 6 t() discipline classifier checks (Req 17.4)
- 4 synthetic fault-injection cases over the shipping `vi.json` / `de.json`

This is the regression baseline gate referenced by Task 5.2 (post-change
verification). After Phases 2–3 land, `pnpm test:property` MUST still
report 21/21 green for `tests/locale-parity.spec.ts` and exit 0 overall.

## `pnpm check:locale-parity` baseline (Task 1.1)

**Date:** 2026-05-16
**Commit SHA:** a20c207a
**Locale parity status (vi.json ⇄ de.json):** PASS (vi=180 keys, de=180 keys)
**Total t()-discipline violations (workspace):** 419
**Violations in `apps/web/src/components/writing/writing-player.tsx`:** 11 (not 5)
**Script exit code:** 1 (FAIL — driven entirely by t() discipline half)

Captured by Task 1.1 via `pnpm check:locale-parity` (`tsx
scripts/check-locale-parity.ts`). Raw combined stdout/stderr preserved
verbatim at `tmp/locale-parity-baseline.txt` (40 KB).

### ⚠ Discrepancy with task expectation

The task description in `tasks.md` says:

> Confirm the script reports exactly 5 t()-discipline violations in
> `apps/web/src/components/writing/writing-player.tsx` at lines 622,
> 658, 666, 722, 760.

The actual baseline contradicts this in two ways:

1. **Script scope.** `check:locale-parity` scans every `.tsx` under
   `apps/web/src/`, not only `writing-player.tsx`. Total workspace
   violations on this commit: **419**.
2. **In-file count.** Within `writing-player.tsx` alone, the script
   flags **11 violations**, not 5:

   | Line | Kind     | Literal                                    | In spec scope? |
   |------|----------|--------------------------------------------|----------------|
   | 207  | jsx-text | `Bài báo`                                  | NO             |
   | 221  | jsx-text | `Bài thuyết trình`                         | NO             |
   | 416  | jsx-attr | `alt="Fuxie writing coach"`                | NO             |
   | 423  | jsx-text | `Geschätztes Niveau:`                      | NO             |
   | 440  | jsx-text | `Writing Quest Receipt`                    | NO             |
   | 504  | jsx-text | `💡 Gợi ý cải thiện:`                      | NO             |
   | 622  | jsx-text | `Đề bài`                                   | YES            |
   | 658  | jsx-text | `Biểu đồ`                                  | YES            |
   | 666  | jsx-text | `📋 Ý cần viết:`                           | YES            |
   | 722  | jsx-attr | `placeholder="Viết bài của em tại đây..."` | YES            |
   | 760  | jsx-text | `Nộp bài →`                                | YES            |

The 5 lines targeted by this spec (622, 658, 666, 722, 760) ARE all
present and DO match the literal contents named in tasks 3.1, 4.3–4.7
verbatim, so Phases 1–3 can proceed against those 5 leaves as
designed. But the post-change Phase 4 expectation that "`pnpm
check:locale-parity` exits 0" (task 5.1) WILL NOT hold after this
backfill — the remaining 6 violations in `writing-player.tsx` plus 408
elsewhere will keep the script exit code at 1.

This is a baseline finding from the Localization Specialist. It does
not block Phase 1 (translation drafting) or Phase 2 (JSON edits), but
PM / Frontend should reconcile the success criteria for Task 5.1
before merge planning. Options:

- **(A) Narrow the success criterion.** Re-scope task 5.1 to "exactly
  the 5 spec-named violations are gone from the t()-discipline output,
  and total violation count drops by 5". Script still exits 1
  workspace-wide.
- **(B) Widen the spec.** Add the other 6 in-file violations (and
  potentially other writing-flow surfaces) into this PR. This breaks
  the spec's stated 3-file blast radius (Req 7.1) and the "5 keys"
  framing.
- **(C) Defer.** Accept that script exit 0 is a multi-spec goal and
  treat this PR as one slice. Document remaining violations as a
  follow-up backlog item.

Recommendation (Localization Specialist + PM): **Option A**. It
preserves the spec's narrow scope (Req 7) and matches the spec's stated
intent (close R-locale parity for the writing-player surface that the
parent rollout actually shipped), without inflating PR scope or
breaking other slices.

### `pnpm check:locale-parity` baseline output (combined stdout + stderr)

Preserved verbatim. Truncated mid-output for readability; the full
40 KB log lives at `tmp/locale-parity-baseline.txt`.

```
> fuxie@ check:locale-parity C:\Users\DMF Schule\9-Fuxie
> tsx scripts/check-locale-parity.ts

check:locale-parity OK — vi=180 keys, de=180 keys (apps\web\messages\vi.json ⇄ apps\web\messages\de.json)
check:locale-parity found 419 hardcoded learner-string literal(s) not wrapped in t():
  apps/web/src/app/(learn)/campaign/page.tsx:98 [jsx-text] : node.boss ?
  apps/web/src/app/(learn)/grammar/[topicSlug]/page.tsx:142 [jsx-text] Đã hoàn thành
  apps/web/src/app/(learn)/grammar/[topicSlug]/page.tsx:145 [jsx-text] Khóa
  ... (414 more lines elided — see tmp/locale-parity-baseline.txt for full list) ...
  apps/web/src/components/writing/writing-player.tsx:207 [jsx-text] Bài báo
  apps/web/src/components/writing/writing-player.tsx:221 [jsx-text] Bài thuyết trình
  apps/web/src/components/writing/writing-player.tsx:416 [jsx-attr] alt="Fuxie writing coach"
  apps/web/src/components/writing/writing-player.tsx:423 [jsx-text] Geschätztes Niveau:
  apps/web/src/components/writing/writing-player.tsx:440 [jsx-text] Writing Quest Receipt
  apps/web/src/components/writing/writing-player.tsx:504 [jsx-text] 💡 Gợi ý cải thiện:
  apps/web/src/components/writing/writing-player.tsx:622 [jsx-text] Đề bài
  apps/web/src/components/writing/writing-player.tsx:658 [jsx-text] Biểu đồ
  apps/web/src/components/writing/writing-player.tsx:666 [jsx-text] 📋 Ý cần viết:
  apps/web/src/components/writing/writing-player.tsx:722 [jsx-attr] placeholder="Viết bài của em tại đây..."
  apps/web/src/components/writing/writing-player.tsx:760 [jsx-text] Nộp bài →
Wrap learner-facing copy with next-intl `t()`, move the string to `apps/web/messages/{vi,de}.json`, or append `// locale-allow` to opt out for genuinely route-local copy.
 ELIFECYCLE  Command failed with exit code 1.
```

This is the regression baseline gate referenced by Task 5.1
(post-change verification). After Phases 2–3 land, `pnpm
check:locale-parity` SHALL still report locale parity PASS, AND the
five `writing-player.tsx` lines (622, 658, 666, 722, 760) SHALL be
absent from the t() discipline output. The total workspace violation
count is expected to drop from 419 → 414. The script's overall exit
code remains 1 (driven by the other 414 violations) until the broader
locale backfill effort completes.


## After Phase 3 (component swap + JSON)

**Date:** 2026-05-16
**Locale parity status:** PASS (vi=185 keys, de=185 keys, set equality OK) ✅
**t() discipline status:** 414 violations remaining (was 419, dropped exactly 5)
**5 spec-named violations resolved:**
- writing-player.tsx:622 (Đề bài) ✅
- writing-player.tsx:658 (Biểu đồ) ✅
- writing-player.tsx:666 (📋 Ý cần viết:) ✅
- writing-player.tsx:722 (placeholder) ✅
- writing-player.tsx:760 (Nộp bài →) ✅
**Property test status:** 21 locale-parity / 295 total green ✅
**Script overall exit code:** 1 (414 unrelated violations remain — accepted per Option A narrowed criterion)

### Note on remaining `writing-player.tsx` line numbers

The 6 out-of-scope writing-player.tsx violations baselined at lines 207,
221, 416, 423, 440, 504 now appear at lines **208, 222, 418, 425, 442,
506** in the post-Phase-3 scan. The shift (+1 / +2) is caused by the
`useTranslations` import (Task 4.1) and `useTranslations('WritingPlayer')`
hook call (Task 4.2) added at the top of the component. The literals
themselves are unchanged and remain out-of-scope per Option A.

| Baseline line | Post-Phase-3 line | Literal                     |
|---------------|-------------------|-----------------------------|
| 207           | 208               | `Bài báo`                   |
| 221           | 222               | `Bài thuyết trình`          |
| 416           | 418               | `alt="Fuxie writing coach"` |
| 423           | 425               | `Geschätztes Niveau:`       |
| 440           | 442               | `Writing Quest Receipt`     |
| 504           | 506               | `💡 Gợi ý cải thiện:`       |

### Verification commands re-run by Tasks 5.1 / 5.2

```text
pnpm check:locale-parity
→ check:locale-parity OK — vi=185 keys, de=185 keys
→ check:locale-parity found 414 hardcoded learner-string literal(s)
→ exit code 1 (driven by 414 unrelated workspace violations)

pnpm test:property
→ tests/locale-parity.spec.ts (21 tests) 3011ms ✓
→ Test Files  16 passed (16)
→ Tests       295 passed | 4 skipped (299)
→ exit code 0
```
