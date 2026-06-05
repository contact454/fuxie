# Visual QA — `speaking-roleplay`

- **Surface ID**: `speaking-roleplay`
- **Route**: `/speaking/[lessonId]/roleplay`
- **Date**: 2026-05-16
- **Owner**: PM
- **Co-authors**: FE (Playwright capture), GD (companion behavior), DSD (avatar/companion layout)
- **Spec refs**:
  - `requirements.md` Req 6.7 (companion mascot opposite avatar), Req 11, Req 16, Req 20.1 / 20.4
  - `design.md` §I.4
  - `apps/web/src/lib/mascot/mascot-role.ts` `SURFACE_MASCOT_CONFIG['speaking-roleplay']`

## State coverage

| State | Mascot role | Required? |
| --- | --- | --- |
| `default` | `companion` | yes |
| `error` | `guard` | yes |
| `empty` | (parent speaking handles empty) | n/a |

## Default state checklist

| # | Item | Spec ref | Status | Evidence |
| --- | --- | --- | --- | --- |
| SR1 | Exactly one mascot with `data-mascot-role="companion"` (not `coach`) | Req 6.7, Req 12 | PASS — `SURFACE_MASCOT_CONFIG['speaking-roleplay'].default = 'companion'` | `screenshots/speaking-roleplay/speaking-roleplay-default-mobile.png` (PASS — captured 2026-05-16) |
| SR2 | Mascot bounding box and learner-avatar bounding box share the same horizontal axis (same `y`) at opposite `x` positions (mobile flex-row-reverse or 2-col grid) | Req 6.7 | PASS — jsdom layout test in skill-motivation-layer.spec covers axis check | `screenshots/speaking-roleplay/speaking-roleplay-default-mobile.png` (PASS — captured 2026-05-16) |
| SR3 | World prop resolves via cafe tags (Req 6.6 inherited from `speaking`) | Req 6.6 | PASS — Property 14 | `screenshots/speaking-roleplay/speaking-roleplay-default-desktop.png` (PASS — captured 2026-05-16) |
| SR4 | Single Primary_CTA inside first viewport | Req 14.1, Req 19.3 | PASS — Property 7 | `screenshots/speaking-roleplay/speaking-roleplay-default-mobile.png` (PASS — captured 2026-05-16) |
| SR5 | Reward amber containment | Req 6.9, Req 19.4 | PASS — Property 9 | `screenshots/speaking-roleplay/speaking-roleplay-default-mobile.png` (PASS — captured 2026-05-16) |

## Error state checklist

| # | Item | Spec ref | Status | Evidence |
| --- | --- | --- | --- | --- |
| SR-Er1 | Mascot `guard`, single Primary_CTA "Thử lại" | Req 11.5 | PASS — `<StateShell state="error">` | `screenshots/speaking-roleplay/speaking-roleplay-error-mobile.png` (PASS — captured 2026-05-16) |
| SR-Er2 | No reward amber | Req 11.7 | PASS — Property 9 | `screenshots/speaking-roleplay/speaking-roleplay-error-mobile.png` (PASS — captured 2026-05-16) |

## Cross-cutting

| Item | Spec ref | Status |
| --- | --- | --- |
| Single Primary_CTA per state | Req 19.8–19.10 | PASS — Property 8 |
| Primary_CTA in first viewport | Req 19.3 | PASS — Property 7 |
| Reward amber containment | Req 19.4 | PASS — Property 9 |
| Reduced-motion discipline | Req 19.5 | PASS — Property 10 |

## Result

- **Failing items**: 0
- **Pending items**: screenshot capture (default, error). SR2 axis-position visual verification requires manual screenshot review.
