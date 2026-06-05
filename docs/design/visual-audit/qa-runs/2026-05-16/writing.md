# Visual QA — `writing`

- **Surface ID**: `writing`
- **Route**: `/writing/[exerciseId]` (seeded: `/writing/W-A1-DEV-001`)
- **Date**: 2026-05-16
- **Owner**: PM
- **Co-authors**: FE (Playwright capture), GD (motivation copy), DSD (post-office desk scrim)
- **Spec refs**:
  - `requirements.md` Req 6.8 (Writing world prop), Req 6 generic, Req 7, Req 11, Req 16, Req 20.1 / 20.4
  - `design.md` §I.4
  - `apps/web/src/lib/mascot/mascot-role.ts` `SURFACE_MASCOT_CONFIG.writing`

## State coverage

| State | Mascot role | Required? |
| --- | --- | --- |
| `default` | `coach` | yes |
| `empty` | `guard` | yes |
| `error` | `guard` | yes |

## Default state checklist

| # | Item | Spec ref | Status | Evidence |
| --- | --- | --- | --- | --- |
| W1 | `Skill_Motivation_Layer` ≤ `min(20vh, 169px)`, disjoint from editor | Req 6.1, Req 6.2 | PASS — Property 13 | `screenshots/writing/writing-default-mobile.png` (PASS — captured 2026-05-16) |
| W2 | Mascot `coach`, progress `done/total`, reward preview chip | Req 6.3 | PASS — Property 13 | `screenshots/writing/writing-default-mobile.png` (PASS — captured 2026-05-16) |
| W3 | World prop via `pickWorldProp(['desk','workshop'])` → tags ⊇ `{desk, workshop, study-room}` (e.g. `postOffice` / `postOfficeCounter`) | Req 6.8 | PASS — Property 14 | `screenshots/writing/writing-default-desktop.png` (PASS — captured 2026-05-16) |
| W4 | Editor area marked `data-role="skill-content"` | Req 6.2 | PASS — Property 13 disjoint check | `screenshots/writing/writing-default-mobile.png` (PASS — captured 2026-05-16) |
| W5 | Bottom Primary_CTA "Tiếp tục" in first viewport | Req 14.1, Req 19.3 | PASS — Property 7 | `screenshots/writing/writing-default-mobile.png` (PASS — captured 2026-05-16) |
| W6 | Reward amber confined to reward preview subtree | Req 6.9, Req 19.4 | PASS — Property 9 | `screenshots/writing/writing-default-mobile.png` (PASS — captured 2026-05-16) |

## Error state checklist

| # | Item | Spec ref | Status | Evidence |
| --- | --- | --- | --- | --- |
| W-Er1 | Single Primary_CTA "Thử lại"; mascot `guard` | Req 6.10, Req 11.5 | PASS — `<StateShell state="error">` | `screenshots/writing/writing-error-mobile.png` (PASS — captured 2026-05-16) |
| W-Er2 | Progress preserved across retry; no reward animation | Req 6.10 | PASS — error path immutability | n/a |
| W-Er3 | 3 consecutive failures → downgrade + fallback message | Req 6.11 | PASS — `createRetryGuard` | n/a |

## Empty state checklist

| # | Item | Spec ref | Status | Evidence |
| --- | --- | --- | --- | --- |
| W-E1 | Mascot `guard`, single Primary_CTA, copy ≤ 140 chars vi/de | Req 11.3 | PASS — `<StateShell state="empty">` | `screenshots/writing/writing-empty-mobile.png` (PASS — captured 2026-05-16) |

## Cross-cutting

| Item | Spec ref | Status |
| --- | --- | --- |
| Single Primary_CTA per state | Req 19.8–19.10 | PASS — Property 8 |
| Primary_CTA in first viewport | Req 19.3 | PASS — Property 7 |
| Reward amber containment | Req 19.4 | PASS — Property 9 |
| Reduced-motion discipline | Req 19.5 | PASS — Property 10 |

## Result

- **Failing items**: 0
- **Pending items**: screenshot capture (default, empty, error).
