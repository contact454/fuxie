# Slice D — Fix hardcoded CEFR level in AI calls

Owner: Claude (spec/QC) → Antigravity (implement). Date: 2026-06-03. Assets: none.
Model: `.agents/workflows/three-agent-delivery-model.md`.

## Context & Goal

Grammar and Speaking send a **hardcoded `'A1'`** to the AI grading endpoints, so the
grade route picks the A1 model + rubric for **every** learner. B1–C2 learners are
graded with A1 expectations — "working AI" that is silently mis-grading. Fix: send the
real lesson CEFR level.

Confirmed sites:
- `apps/web/src/components/grammar/ExerciseRenderer.tsx:219` and `:517` — `cefrLevel: 'A1'` in two `/api/v1/grade` payloads (gap-fill-type and transformation).
- `apps/web/src/components/speaking/NachsprechenPlayer.tsx:251` — `formData.append('level', 'A1')` for `/api/v1/speaking/evaluate`. The real level is **already in scope** at `:85` (`cefrLevel ?? questEpisode.cefrLevel`).

## Requirements

- **R-1** Grammar AI grade calls SHALL send the lesson's real CEFR level (not `'A1'`).
- **R-2** Speaking evaluate SHALL send the real level via the existing `cefrLevel ?? questEpisode.cefrLevel`, not `'A1'`.
- **R-3** Last-resort default `'A1'` allowed ONLY if no level is resolvable.
- **R-4** No other hardcoded `'A1'` (or similar) remains in any AI request payload (grep to confirm).
- **R-NF** `pnpm build` + `pnpm test:core` green; grade/evaluate behavior otherwise unchanged.

## Tech Design

- **Speaking** (`NachsprechenPlayer.tsx:251`): replace `'A1'` with `cefrLevel ?? questEpisode.cefrLevel ?? 'A1'` (mirror the value already used at `:85`).
- **Grammar** (`ExerciseRenderer.tsx`): `ExerciseRenderer` needs the lesson level. Locate where it is rendered (`grammar/LessonPlayer.tsx`) and what level field the lesson/topic carries (e.g., `lesson.cefrLevel` / topic level). Thread a `cefrLevel` prop down to `ExerciseRenderer` and use it in both payloads (`:219`, `:517`). If a level prop already exists on the lesson data, reuse it; do not invent a new fetch.
- Confirm the grade route reads `cefrLevel` to select model/rubric (`app/api/v1/grade/route.ts`) so the threaded value takes effect.

## Asset plan
None. Codex: none.

## Task List (Antigravity)
- **T-1** (R-2): Speaking — use real level at `NachsprechenPlayer.tsx:251`.
- **T-2** (R-1): Grammar — thread `cefrLevel` from LessonPlayer → ExerciseRenderer; use in both grade payloads.
- **T-3** (R-4): Grep `apps/web/src` for `cefrLevel: 'A1'`, `append('level', 'A1'`, `level: 'A1'` in non-test files; fix any other AI-payload hardcodes found.
- **T-4** (R-NF): Build + test:core; report.

## Acceptance / QC
1. A B1 grammar lesson's free-text grade request sends `cefrLevel:'B1'` (verify via the request body / a log).
2. A B2 speaking lesson sends `level:'B2'` to evaluate.
3. No hardcoded AI-payload `'A1'` remains (grep clean, excluding tests/fixtures).
4. `pnpm build` + `pnpm test:core` green.

## Antigravity prompt (copy-paste)
```
ROLE: Frontend Engineer for Fuxie (Next.js, TS), executing a fixed spec. No UX decisions; ask if ambiguous.
OBJECTIVE: Slice D — stop sending hardcoded CEFR level 'A1' to AI endpoints; send the real lesson level.
REPO CONTEXT: root C:\Users\DMF Schule\9-Fuxie, app apps/web. Read docs/delivery/slice-D-ai-cefr-level.md.
SITES: apps/web/src/components/grammar/ExerciseRenderer.tsx:219 and :517 (cefrLevel:'A1' → real level, threaded as a prop from grammar/LessonPlayer.tsx using the lesson/topic CEFR level). apps/web/src/components/speaking/NachsprechenPlayer.tsx:251 (formData level 'A1' → cefrLevel ?? questEpisode.cefrLevel ?? 'A1', mirroring line 85). Then grep apps/web/src for any other AI-payload hardcoded 'A1' (cefrLevel:'A1' / append('level','A1') / level:'A1') in non-test files and fix.
CONSTRAINTS: do not add a new fetch; reuse the level already on lesson/episode data. Do not change grade/evaluate logic otherwise.
ACCEPTANCE: B1 grammar → cefrLevel:'B1' in /api/v1/grade body; B2 speaking → level:'B2' in /api/v1/speaking/evaluate; no AI-payload 'A1' hardcode remains (grep clean, excluding tests); pnpm build + pnpm test:core green; report check:quick honestly (asset-audit is a known pre-existing failure).
REPORT: diff hunks; grep result proving no remaining hardcode; ALL gate outputs.
```
## Codex prompt
None.
