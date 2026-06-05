# QC Antigravity AI Grading Smoke Guard Blocker - 2026-06-04

## Role Gate

- Primary role: QA Automation Engineer
- Support roles: Frontend Engineer

## Verdict

Blocked from staging.

Antigravity correctly moved the AI grading unavailable smoke case onto the grammar `ExerciseRenderer` path and the browser smoke now proves the localized fallback appears after `/api/v1/grade` returns `500`.

However, the production route guard is incomplete in the new grammar visual QA fixture path.

## Accepted Evidence

The corrected Playwright smoke case now:

- navigates to `/grammar/akkusativ-dativ/visual-lesson?fixture=visual-qa&state=grading-unavailable`
- mocks `**/api/v1/grade` with a `500` response
- starts the grammar lesson
- submits a gap-fill answer
- asserts the localized fallback banner `Chưa chấm được bài này`
- captures `tmp/manual-smoke-check/ai-grading-unavailable-mobile.png`

Independent Codex verification passed:

- `npx playwright test tests/integration/manual-smoke.pw.spec.ts --config tests/integration/playwright.config.ts --project chromium-mobile-capture`: 9/9 passed.
- `npx next typegen .` from `apps/web`: passed.
- `npx tsc --noEmit` from `apps/web`: passed.
- `npx tsx scripts/check-locale-parity.ts` from repo root: passed.
- `npx tsx scripts/check-visual-audit-pack.ts` from repo root: passed.
- `npm run test` from `apps/web`: passed, 102 test files and 836 tests.

## Blocking Finding

`apps/web/src/app/(learn)/grammar/[topicSlug]/[lessonId]/page.tsx` uses raw fixture checks:

```ts
if (visualParams?.fixture === 'visual-qa') {
```

and:

```ts
if (visualParams?.fixture === 'visual-qa' && visualParams?.state === 'grading-unavailable') {
```

Unlike `isSlice2VisualQaFixture`, these checks do not include:

```ts
process.env.NODE_ENV !== 'production'
```

Impact:

- In production, a user could add `?fixture=visual-qa&state=grading-unavailable`.
- The route could render the mock grammar lesson.
- This bypasses the normal auth/database lesson path.

## Required Fix

Use a non-production guard for the new grammar grading-unavailable fixture.

Recommended implementation:

```ts
function isGrammarGradingUnavailableVisualQaFixture(params: Slice2VisualQaParams | undefined) {
    return (
        process.env.NODE_ENV !== 'production' &&
        params?.fixture === 'visual-qa' &&
        params?.state === 'grading-unavailable'
    )
}
```

Then use this helper in both `generateMetadata` and the page render branch.

For metadata, either:

- use `isSlice2VisualQaFixture(visualParams, 'error') || isGrammarGradingUnavailableVisualQaFixture(visualParams)`, or
- define a metadata helper with the same production guard.

## Antigravity Follow-up Prompt

```text
Bạn là Antigravity. Codex QC đã xác nhận smoke case AI grading fallback giờ đã test đúng route grammar và assert đúng fallback, nhưng chưa được stage vì production guard còn thiếu.

File cần sửa:
- `apps/web/src/app/(learn)/grammar/[topicSlug]/[lessonId]/page.tsx`

Vấn đề:
- Code mới dùng `visualParams?.fixture === 'visual-qa'` trực tiếp trong `generateMetadata` và branch `state === 'grading-unavailable'`.
- Điều kiện này thiếu `process.env.NODE_ENV !== 'production'`.
- Trong production, query `?fixture=visual-qa&state=grading-unavailable` có thể render mock grammar lesson và bypass auth/DB.

Yêu cầu:
1. Thêm helper local, ví dụ `isGrammarGradingUnavailableVisualQaFixture(params)`, có đủ guard:
   - `process.env.NODE_ENV !== 'production'`
   - `params?.fixture === 'visual-qa'`
   - `params?.state === 'grading-unavailable'`
2. Dùng helper này trong page render branch.
3. Sửa `generateMetadata` để chỉ bypass DB metadata khi helper production-safe match, ví dụ:
   - `isSlice2VisualQaFixture(visualParams, 'error') || isGrammarGradingUnavailableVisualQaFixture(visualParams)`
4. Giữ test `tests/integration/manual-smoke.pw.spec.ts` đang assert fallback thật.
5. Chạy lại:
   - `npx playwright test tests/integration/manual-smoke.pw.spec.ts --config tests/integration/playwright.config.ts --project chromium-mobile-capture`
   - `npx next typegen .` trong `apps/web`
   - `npx tsc --noEmit` trong `apps/web`
   - `npx tsx scripts/check-locale-parity.ts` từ repo root
   - `npx tsx scripts/check-visual-audit-pack.ts` từ repo root
6. Báo lại diff ngắn và kết quả từng lệnh.
```
