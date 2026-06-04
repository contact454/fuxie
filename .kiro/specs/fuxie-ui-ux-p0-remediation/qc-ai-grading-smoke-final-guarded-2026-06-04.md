# QC AI Grading Smoke Final Guarded - 2026-06-04

## Role Gate

- Primary role: QA Automation Engineer
- Support roles: Full-stack Engineer, Project Manager / Delivery Manager

## Verdict

Accepted and ready to stage.

Antigravity fixed the previous production-guard blocker for the grammar AI grading unavailable smoke fixture.

## Accepted Changes

### `apps/web/src/app/(learn)/grammar/[topicSlug]/[lessonId]/page.tsx`

Accepted.

The grammar visual QA fixture path now uses helper checks that include:

```ts
process.env.NODE_ENV !== 'production'
```

This prevents production users from reaching mock grammar lesson data via `?fixture=visual-qa&state=grading-unavailable`.

The page now provides a deterministic non-production fixture for the `ExerciseRenderer` AI grading unavailable path.

### `tests/integration/manual-smoke.pw.spec.ts`

Accepted.

The AI grading unavailable smoke case now verifies the real grammar grading path instead of the local session typing exercise.

The test now:

- routes to `/grammar/akkusativ-dativ/visual-lesson?fixture=visual-qa&state=grading-unavailable`
- mocks `**/api/v1/grade` with a `500` response
- starts the grammar lesson
- fills a gap-fill answer
- clicks the check CTA
- hard-asserts the localized fallback banner `Chưa chấm được bài này`
- captures `tmp/manual-smoke-check/ai-grading-unavailable-mobile.png`

## Independent Verification

Executed by Codex:

- `npx playwright test tests/integration/manual-smoke.pw.spec.ts --config tests/integration/playwright.config.ts --project chromium-mobile-capture`: passed, 9/9 tests.
- `npx next typegen .` from `apps/web`: passed.
- `npx tsc --noEmit` from `apps/web`: passed.
- `npx tsx scripts/check-locale-parity.ts` from repo root: passed, `vi=924`, `de=924`.
- `npx tsx scripts/check-visual-audit-pack.ts` from repo root: passed, 44 PNGs and 4 invariants.
- `npm run test` from `apps/web`: passed, 102 test files and 836 tests.

## Residual Risk

The manual smoke suite remains a focused release smoke rather than a full E2E suite. It now provides valid evidence for the AI grading unavailable fallback, but broader authenticated grammar flows should still be covered by staging smoke before production release.

## Recommended Next Step

Commit the staged Sprint 1 P0 remediation set, then run staging smoke after deployment.
