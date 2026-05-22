# Visual QA — `speaking`

- **Surface ID**: `speaking`
- **Route**: `/speaking/[lessonId]` (seeded: `/speaking/dev-a1-begruessung-01`)
- **Date**: 2026-05-16
- **Owner**: PM
- **Co-authors**: FE (Playwright capture), GD (cafe coach copy), DSD (cafe scrim + tokens)
- **Spec refs**:
  - `requirements.md` Req 6 (Skill players), Req 7, Req 11, Req 16, Req 20.1 / 20.4
  - `design.md` §I.4
  - `apps/web/src/lib/mascot/mascot-role.ts` `SURFACE_MASCOT_CONFIG.speaking`

## State coverage

| State | Mascot role | Required? |
| --- | --- | --- |
| `default` | `coach` | yes |
| `empty` | `guard` | yes |
| `error` | `guard` | yes |

## Default state checklist

| # | Item | Spec ref | Status | Evidence |
| --- | --- | --- | --- | --- |
| SP1 | `Skill_Motivation_Layer` ≤ `min(20vh, 169px)`, fully inside first viewport | Req 6.1, Req 6.2 | PASS — Property 13 | `screenshots/speaking/speaking-default-mobile.png` (PENDING) |
| SP2 | Mascot `coach`, progress text `done/total`, reward preview chip | Req 6.3 | PASS — Property 13 | `screenshots/speaking/speaking-default-mobile.png` (PENDING) |
| SP3 | World prop resolved via `pickWorldProp(['cafe','plaza'])` → tags ⊇ `{cafe, plaza, town-square}` (e.g. `chatCafe` / `speakingStageCafe`) | Req 6.6 | PASS — Property 14 | `screenshots/speaking/speaking-default-desktop.png` (PENDING) |
| SP4 | Mic + transcript area marked `data-role="skill-content"`, disjoint from layer | Req 6.2 | PASS — Property 13 disjoint check | `screenshots/speaking/speaking-default-mobile.png` (PENDING) |
| SP5 | Single Primary_CTA in first viewport | Req 14.1, Req 19.3 | PASS — Property 7 | `screenshots/speaking/speaking-default-mobile.png` (PENDING) |
| SP6 | Reward amber confined to reward preview subtree | Req 6.9, Req 19.4 | PASS — Property 9 | `screenshots/speaking/speaking-default-mobile.png` (PENDING) |

## Error state checklist

| # | Item | Spec ref | Status | Evidence |
| --- | --- | --- | --- | --- |
| SP-Er1 | Single Primary_CTA "Thử lại"; mascot `guard` | Req 6.10, Req 11.5 | PASS — `<StateShell state="error">` | `screenshots/speaking/speaking-error-mobile.png` (PENDING) |
| SP-Er2 | 3 retries fail → downgrade + fallback | Req 6.11 | PASS — `createRetryGuard` | n/a |

## Empty state checklist

| # | Item | Spec ref | Status | Evidence |
| --- | --- | --- | --- | --- |
| SP-E1 | Mascot `guard`, single Primary_CTA, copy ≤ 140 chars vi/de | Req 11.3 | PASS — `<StateShell state="empty">` | `screenshots/speaking/speaking-empty-mobile.png` (PENDING) |

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
