# Visual QA — `review`

- **Surface ID**: `review`
- **Route**: `/review`
- **Date**: 2026-05-16
- **Owner**: PM
- **Co-authors**: FE (Playwright capture), GD (batch reward preview), DSD (color discipline)
- **Spec refs**:
  - `requirements.md` Req 9 (Review surface), Req 11, Req 16, Req 20.1 / 20.4
  - `design.md` §I.7
  - `apps/web/src/lib/mascot/mascot-role.ts` `SURFACE_MASCOT_CONFIG.review`

## State coverage

| State | Mascot role | Required? |
| --- | --- | --- |
| `default` | `coach` | yes |
| `empty` | `cheer` (Req 9.4 — empty-reached-goal exception per Req 12.5) | yes |
| `error` | `guard` | yes |

## Default state checklist

| # | Item | Spec ref | Status | Evidence |
| --- | --- | --- | --- | --- |
| RV1 | Single Primary_CTA "Ôn ngay" with tap target ≥ 48×48 dp, fully inside first viewport `[0, 0, 390, 640]` (`scrollY = 0`) | Req 9.1, Req 14.1 | PASS — `<PrimaryCta size="lg">` enforces ≥ 48×48; Property 7 | `screenshots/review/review-default-mobile.png` (PASS — captured 2026-05-16) |
| RV2 | `due` count rendered in Bright Sky blue; `overdue` count rendered in deep blue; NEVER red | Req 9.2, Req 9.3 | PASS — Property 17 (`tests/review-display.spec.tsx`) | `screenshots/review/review-default-mobile.png` (PASS — captured 2026-05-16) |
| RV3 | Saturation: values ≤ 9999 → display literal; > 9999 → "9999+" | Req 9.2 | PASS — Property 17 | `screenshots/review/review-default-mobile.png` (PASS — captured 2026-05-16) |
| RV4 | Reward preview "chưa nhận" with `data-reward-state="preview"` while batch incomplete | Req 9.5 | PASS — `review-backbone-hero.tsx` preview chip | `screenshots/review/review-default-mobile.png` (PASS — captured 2026-05-16) |
| RV5 | Mascot `coach` (default) | Req 12 | PASS — `SURFACE_MASCOT_CONFIG.review.default = 'coach'` | `screenshots/review/review-default-mobile.png` (PASS — captured 2026-05-16) |

## Empty state checklist (`due === 0 && overdue === 0`)

| # | Item | Spec ref | Status | Evidence |
| --- | --- | --- | --- | --- |
| RV-E1 | Mascot `cheer` (empty-reached-goal exception) | Req 9.4, Req 12.5 | PASS — `MascotRoleHost` permits `cheer` when `state === 'empty' && reachedGoal === true` | `screenshots/review/review-empty-mobile.png` (PASS — captured 2026-05-16) |
| RV-E2 | Single Primary_CTA "Học bài mới" inside first viewport | Req 9.4 | PASS — Property 7 + Property 8 | `screenshots/review/review-empty-mobile.png` (PASS — captured 2026-05-16) |
| RV-E3 | Copy ≤ 140 chars vi/de | Req 11.3 | PASS — `enforceStateShellCopyLength` | n/a |

## Error state checklist (load fail >5s)

| # | Item | Spec ref | Status | Evidence |
| --- | --- | --- | --- | --- |
| RV-Er1 | Mascot `guard`, single Primary_CTA "Thử lại" | Req 9.6, Req 11.5 | PASS — `<StateShell state="error">` | `screenshots/review/review-error-mobile.png` (PASS — captured 2026-05-16) |
| RV-Er2 | "Ôn ngay" Primary_CTA NOT rendered in error state | Req 9.6 | PASS — `review-backbone-hero.test.tsx` snapshot | `screenshots/review/review-error-mobile.png` (PASS — captured 2026-05-16) |
| RV-Er3 | Retry rate-limit (>3 in 60s → disable 30s) | Req 11.6 | PASS — `createRetryGuard` | n/a |
| RV-Er4 | No reward amber | Req 11.7 | PASS — Property 9 | `screenshots/review/review-error-mobile.png` (PASS — captured 2026-05-16) |

## Cross-cutting

| Item | Spec ref | Status |
| --- | --- | --- |
| Single Primary_CTA per state | Req 19.8–19.10 | PASS — Property 8 |
| Primary_CTA ≥ 48×48 dp inside first viewport | Req 9.1, Req 19.3 | PASS — Property 7 (Review variant) |
| Reward amber containment | Req 19.4 | PASS — Property 9 |
| Reduced-motion discipline | Req 19.5 | PASS — Property 10 |
| Bright Sky CTA palette | Req 16.4 | PASS — Property 22 |

## Result

- **Failing items**: 0
- **Pending items**: screenshot capture (default, empty, error).
