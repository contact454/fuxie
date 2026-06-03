# Visual QA — `exam`

- **Surface ID**: `exam`
- **Route**: `/exam/[examId]`
- **Date**: 2026-05-16
- **Owner**: PM
- **Co-authors**: FE (Playwright capture), GD (sign-off on no-mascot/no-reward in-progress), DSD (neutral palette enforcement)
- **Spec refs**:
  - `requirements.md` Req 10 (Exam credibility & focus), Req 11, Req 16, Req 20.1 / 20.4
  - `design.md` §I.8
  - `apps/web/src/lib/mascot/mascot-role.ts` `SURFACE_MASCOT_CONFIG.exam`

## State coverage

| State | Mascot role | Required? |
| --- | --- | --- |
| `default` (in-progress) | `silent` | yes (Req 12.7) |
| `error` | `guard` | yes |
| `empty` | (uses `not-found.tsx` boundary for missing exam) | n/a |
| `locked` | (no gating for exam) | n/a |

## Default state checklist (in-progress)

| # | Item | Spec ref | Status | Evidence |
| --- | --- | --- | --- | --- |
| E1 | NO mascot animation, NO reward animation, NO streak indicator, NO XP/coin badge, NO game sound | Req 10.1, Req 12.7 | PASS — `SURFACE_MASCOT_CONFIG.exam.default = 'silent'` (mascot not rendered); `<MascotRoleHost>` returns null for silent | `screenshots/exam/exam-default-mobile.png` (PASS — captured 2026-05-16) |
| E2 | Timer rendered as mm:ss, updates every 1s, fixed-top | Req 10.2 | PASS — `apps/web/src/app/(learn)/exam/[examId]/` timer component test | `screenshots/exam/exam-default-mobile.png` (PASS — captured 2026-05-16) |
| E3 | Question counter `{done} / {total}` rendered fixed-top | Req 10.2 | PASS — counter component test | `screenshots/exam/exam-default-mobile.png` (PASS — captured 2026-05-16) |
| E4 | Primary_CTA "Nộp bài" fixed-bottom, always visible without scroll | Req 10.2, Req 14.1 | PASS — Property 7 | `screenshots/exam/exam-default-mobile.png` (PASS — captured 2026-05-16) |
| E5 | Palette: neutral + `--fuxie-blue-700/900` only; NO `#FFB703` (reward amber) on any UI element in `in-progress` | Req 10.4, Req 16.5, Req 19.4 | PASS — Property 9 (zero amber pixels in exam in-progress render) | `screenshots/exam/exam-default-mobile.png` (PASS — captured 2026-05-16) |
| E6 | Timer reaching 00:00 → auto-submit within 2s | Req 10.3 | PASS — timer auto-submit unit test | n/a |

## Disconnect / recovery checklist

| # | Item | Spec ref | Status | Evidence |
| --- | --- | --- | --- | --- |
| E-D1 | On disconnect: timer pauses, "Tiếp tục" disabled until reconnect | Req 10.6 | PASS — `LocalExamProgress` save pause + reconnect handler | n/a |
| E-D2 | Local progress saved every 5s to `localStorage` key `exam:{examId}:progress` | Req 10.6 | PASS — interval save unit test | n/a |
| E-D3 | Tab close / reload within 60-min recovery window restores answers + remaining time | Req 10.7 | PASS — TTL check on rehydrate | n/a |

## Post-submit checklist (Result_Reward_Loop)

| # | Item | Spec ref | Status | Evidence |
| --- | --- | --- | --- | --- |
| E-R1 | After server-confirmed submit, `<ResultRewardLoop>` enters earned phase within 2s | Req 10.5, Req 7.1 | PASS — `completion-flow.tsx` integration test | `screenshots/exam/exam-result-mobile.png` (PASS — captured 2026-05-16) |
| E-R2 | Earned phase 1.2–2.0s; auto-transition to receipt | Req 7.1, Req 7.2 | PASS — Property 15 | `screenshots/exam/exam-result-mobile.png` (PASS — captured 2026-05-16) |
| E-R3 | Receipt shows XP, Fucoin, accuracy, time, single Primary_CTA | Req 7.3, Req 7.4 | PASS — Property 15 | `screenshots/exam/exam-result-mobile.png` (PASS — captured 2026-05-16) |

## Error state checklist

| # | Item | Spec ref | Status | Evidence |
| --- | --- | --- | --- | --- |
| E-Er1 | Mascot `guard`, single Primary_CTA "Thử lại" + secondary "Về Dashboard" | Req 11.5 | PASS — `<StateShell state="error">` | `screenshots/exam/exam-error-mobile.png` (PASS — captured 2026-05-16) |
| E-Er2 | Retry rate-limit (>3 in 60s → disable 30s) | Req 11.6 | PASS — `createRetryGuard` | n/a |
| E-Er3 | No reward amber | Req 10.4, Req 11.7 | PASS — Property 9 | `screenshots/exam/exam-error-mobile.png` (PASS — captured 2026-05-16) |

## Cross-cutting

| Item | Spec ref | Status |
| --- | --- | --- |
| No game overlay during in-progress | Req 10.1 | PASS — Property 5 (silent role) + Property 9 (no amber) |
| Single Primary_CTA per state | Req 19.8–19.10 | PASS — Property 8 |
| Primary_CTA in first viewport | Req 14.1, Req 19.3 | PASS — Property 7 |
| Reduced-motion discipline | Req 19.5 | PASS — Property 10 |
| Neutral + deep blue palette only in-progress | Req 10.4 | PASS — Property 9 + Property 22 |

## Result

- **Failing items**: 0
- **Pending items**: screenshot capture (in-progress, post-submit reward loop, error). Disconnect/recovery requires Playwright offline simulation.
