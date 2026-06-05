# QC Antigravity Manual Smoke - 2026-06-04

## Role Gate

- Primary role: QA Automation Engineer
- Support roles: Frontend Engineer, Project Manager / Delivery Manager

## Verdict

Partially accepted.

The browser smoke run is useful for visual confidence across dashboard, navigation, vocabulary overflow, grammar fixture layout, confirm-exit dialog, and video feedback unavailable state. However, the AI grading unavailable smoke case is a false-positive test and must not be used as release evidence until corrected.

## Accepted Code Changes

### `apps/web/src/app/(learn)/session/page.tsx`

Accepted.

The `visual-qa` session fixture now bypasses database access for the active state as well as the success state. This keeps the fixture deterministic and allows browser smoke to load `/session?fixture=visual-qa` without requiring local Postgres.

The change remains gated behind:

- `process.env.NODE_ENV !== 'production'`
- `params.fixture === 'visual-qa'`

### `apps/web/src/components/session/SessionPlayer.tsx`

Accepted.

Adding `key={currentItem.id}` to the rendered exercise components prevents React from reusing internal exercise state when moving between session items with the same component type. This fixes the observed issue where consecutive multiple-choice items could retain stale `checked` or `selected` state.

## Rejected / Needs Follow-up

### `tests/integration/manual-smoke.pw.spec.ts`

Do not stage in its current form.

The suite passes, but the AI grading unavailable case does not assert the fallback. The run logged:

```text
[AI Grading Fallback] Retry banner visible: false
```

The screenshot `tmp/manual-smoke-check/ai-grading-unavailable-mobile.png` shows the session `TypingExercise` local incorrect-answer feedback, not the grammar AI grading unavailable fallback.

Root cause:

- The test routes through `/session?fixture=visual-qa&mockAudio=true`.
- The session `TypingExercise` performs local string matching.
- It does not call `/api/v1/grade`.
- Therefore, mocking `**/api/v1/grade` to return 500 cannot validate `ExerciseRenderer` fail-open behavior.

## Verification Results

Executed independently by Codex:

- `npx playwright test tests/integration/manual-smoke.pw.spec.ts --config tests/integration/playwright.config.ts --project chromium-mobile-capture`: passed 9/9, with the AI grading false-positive caveat above.
- `npx next typegen .` from `apps/web`: passed.
- `npx tsc --noEmit` from `apps/web`: passed.
- `npx tsx scripts/check-locale-parity.ts` from repo root: passed, `vi=924`, `de=924`.
- `npx tsx scripts/check-visual-audit-pack.ts` from repo root: passed, 44 PNGs and 4 invariants.
- `npm run test` from `apps/web`: passed, 102 test files and 836 tests.

## Residual Risk

The actual grammar AI grading unavailable fallback still needs a browser smoke test that targets the real `ExerciseRenderer` path and includes a hard assertion for the localized `gradingUnavailableTitle` or equivalent visible fallback UI.

## Antigravity Follow-up Prompt

```text
Bạn là Antigravity. Hãy sửa lại browser smoke test cho AI grading unavailable fallback.

Hiện tại `tests/integration/manual-smoke.pw.spec.ts` đang route qua `/session?fixture=visual-qa&mockAudio=true`, nhưng `SessionPlayer` typing exercise chỉ chấm local string match và không gọi `/api/v1/grade`. Vì vậy case này pass giả, log `Retry banner visible: false`, và screenshot chỉ hiện "Chưa đúng rồi!" thay vì fallback `gradingUnavailable`.

Yêu cầu:
1. Không sửa production code nếu không cần.
2. Sửa hoặc thay thế smoke case AI grading để target đúng grammar `ExerciseRenderer` flow có gọi `/api/v1/grade`.
3. Mock `**/api/v1/grade` trả 500.
4. Thực hiện thao tác submit trên grammar exercise để trigger fetch.
5. Assert cứng rằng fallback localized hiển thị, ví dụ key `Grammar.gradingUnavailableTitle` hoặc text VI tương ứng.
6. Nếu không tìm được route/fixture hiện có để trigger grammar API grading, hãy báo blocker rõ ràng và đề xuất fixture tối thiểu cần thêm, không tạo test pass mềm.
7. Chạy lại:
   - `npx playwright test tests/integration/manual-smoke.pw.spec.ts --config tests/integration/playwright.config.ts --project chromium-mobile-capture`
   - `npx tsc --noEmit` trong `apps/web`
   - `npx tsx scripts/check-locale-parity.ts` từ repo root
   - `npx tsx scripts/check-visual-audit-pack.ts` từ repo root

Báo lại route, viewport, assertion thật, screenshot path, và kết quả từng lệnh.
```
