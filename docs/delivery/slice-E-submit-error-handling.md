# Slice E — Surface submit/sync errors with retry

Owner: Claude (spec/QC) → Antigravity (implement). Date: 2026-06-03. Assets: none.
Model: `.agents/workflows/three-agent-delivery-model.md`.

## Context & Goal

In the highest-stakes flows, submit/sync failures are swallowed with `console.error`
only — a learner who finishes a hard task on a flaky connection sees nothing happen and
loses XP/progress with no recovery. Make these failures learner-facing with retry, and
never lose the learner's answers. (Writing and Speaking already do this well — match
their idiom.)

Confirmed/again-locate sites (find the `catch` in each submit/sync path):
- Reading submit: `apps/web/src/components/reading/reading-player.tsx` (submit handler ~`:234`).
- Listening submit: `apps/web/src/components/listening/lesson-player.tsx` (submit ~`:284`).
- Grammar progress save: `apps/web/src/components/grammar/LessonPlayer.tsx` (progress POST ~`:246`).
- SRS rating sync: `apps/web/src/components/srs/review-client.tsx` (rating sync ~`:242`).

## Requirements

- **R-1** Reading & Listening: on submit/grade failure, the learner SHALL see an error message + a **Retry** action; selected answers SHALL be preserved (no reset).
- **R-2** Grammar progress & SRS rating: on sync failure, the learner SHALL get a non-blocking, learner-facing notice that progress didn't save, with retry; the local result UI may still proceed but must not silently imply a successful save.
- **R-3** Success behavior unchanged; no failure path remains `console.error`-only.
- **R-NF** `pnpm build` + `pnpm test:core` green.

## Tech Design

For each file: locate the `catch` that currently logs only; add an error state + UI and a
retry handler that re-invokes the same submit/sync call. **Reuse each module's existing
error idiom** — Writing (`writing-player.tsx`) and Speaking surface learner-facing errors
with retry; copy that pattern (error banner/toast + retry button) rather than inventing a
new one. Keep answers/timer/state intact across a failed attempt.

- Reading/Listening (R-1): block the "submitted/results" transition on failure; show retry; keep `answers` state.
- Grammar progress / SRS rating (R-2): these are background syncs — use a lightweight non-blocking toast/inline notice with retry; do not trap the learner.

## Asset plan
None. Codex: none.

## Task List (Antigravity)
- **T-1** (R-1): Reading submit — error + retry, preserve answers.
- **T-2** (R-1): Listening submit — error + retry, preserve answers.
- **T-3** (R-2): Grammar progress save — learner-facing sync-failed notice + retry.
- **T-4** (R-2): SRS rating sync — learner-facing sync-failed notice + retry.
- **T-5** (R-NF): Build + test:core; report.

## Acceptance / QC
1. Force the Reading/Listening submit API to fail → error message + Retry shown; answers NOT lost; retry succeeds when API recovers.
2. Force Grammar progress / SRS rating sync to fail → learner sees a non-blocking notice (not just console); retry available.
3. No remaining `catch(... console.error ...)`-only path in the four files.
4. `pnpm build` + `pnpm test:core` green.

## Antigravity prompt (copy-paste)
```
ROLE: Frontend Engineer for Fuxie (Next.js, TS, Tailwind), executing a fixed spec. No UX decisions; ask if ambiguous.
OBJECTIVE: Slice E — make swallowed submit/sync failures learner-facing with retry, without losing answers.
REPO CONTEXT: root C:\Users\DMF Schule\9-Fuxie, app apps/web. Read docs/delivery/slice-E-submit-error-handling.md. Reuse the existing error idiom from apps/web/src/components/writing/writing-player.tsx and speaking players (learner-facing error + retry).
SITES (locate the console-only catch in each): reading/reading-player.tsx (submit ~234), listening/lesson-player.tsx (submit ~284), grammar/LessonPlayer.tsx (progress save ~246), srs/review-client.tsx (rating sync ~242).
REQUIREMENTS: Reading/Listening submit failure → error + Retry, preserve selected answers (no reset). Grammar progress + SRS rating sync failure → non-blocking learner-facing notice + retry (don't trap the learner; don't falsely imply a save). Keep success paths unchanged. No failure path stays console.error-only.
ACCEPTANCE: simulate each API failing → learner sees error + retry, answers preserved, retry works on recovery; no console-only swallow remains in the 4 files; pnpm build + pnpm test:core green; report check:quick honestly (asset-audit is a known pre-existing failure).
REPORT: per-file diff hunks; how you simulated each failure; ALL gate outputs.
```
## Codex prompt
None.
