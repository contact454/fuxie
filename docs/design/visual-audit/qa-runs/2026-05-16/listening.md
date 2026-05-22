# Visual QA — `listening`

- **Surface ID**: `listening`
- **Route**: `/listening/[lessonId]` (seeded: `/listening/L-A1-DEV-001`)
- **Date**: 2026-05-16
- **Owner**: PM
- **Co-authors**: FE (Playwright capture), GD (motivation copy), DSD (radio booth scrim + tokens)
- **Spec refs**:
  - `requirements.md` Req 6 (Skill players), Req 7, Req 11, Req 16, Req 20.1 / 20.4
  - `design.md` §I.4
  - `apps/web/src/lib/mascot/mascot-role.ts` `SURFACE_MASCOT_CONFIG.listening`

## State coverage

| State | Mascot role | Required? |
| --- | --- | --- |
| `default` | `coach` | yes |
| `empty` | `guard` | yes |
| `error` | `guard` | yes |

## Default state checklist

| # | Item | Spec ref | Status | Evidence |
| --- | --- | --- | --- | --- |
| L1 | `Skill_Motivation_Layer` ≤ `min(20vh, 169px)`, fully inside first viewport, disjoint from skill-content | Req 6.1, Req 6.2 | PASS — Property 13 | `screenshots/listening/listening-default-mobile.png` (PENDING) |
| L2 | Exactly one `data-mascot-role="coach"`, one `^\d+/\d+$` progress, one `data-reward-state="preview"` | Req 6.3 | PASS — Property 13 | `screenshots/listening/listening-default-mobile.png` (PENDING) |
| L3 | World prop via `pickWorldProp(['studio','radio'])` → tags ⊇ `{studio, radio, broadcast-room}` (e.g. `radioBooth` / `radioBoothConsole`) | Req 6.5 | PASS — Property 14 | `screenshots/listening/listening-default-desktop.png` (PENDING) |
| L4 | Audio player area marked `data-role="skill-content"` | Req 6.2 | PASS — Property 13 disjoint check | `screenshots/listening/listening-default-mobile.png` (PENDING) |
| L5 | Bottom Primary_CTA in first viewport | Req 14.1, Req 19.3 | PASS — Property 7 | `screenshots/listening/listening-default-mobile.png` (PENDING) |
| L6 | Reward amber confined to reward preview subtree | Req 6.9, Req 19.4 | PASS — Property 9 | `screenshots/listening/listening-default-mobile.png` (PENDING) |

## Error state checklist (audio/asset >10s)

| # | Item | Spec ref | Status | Evidence |
| --- | --- | --- | --- | --- |
| L-Er1 | Single Primary_CTA "Thử lại"; mascot `guard`; progress preserved | Req 6.10, Req 11.5 | PASS — `<StateShell state="error">` | `screenshots/listening/listening-error-mobile.png` (PENDING) |
| L-Er2 | 3 consecutive failures → downgrade to secondary + fallback message | Req 6.11 | PASS — `createRetryGuard` | n/a |
| L-Er3 | No reward animation in error | Req 6.10 | PASS — Property 9 | `screenshots/listening/listening-error-mobile.png` (PENDING) |

## Empty state checklist

| # | Item | Spec ref | Status | Evidence |
| --- | --- | --- | --- | --- |
| L-E1 | Mascot `guard`, single Primary_CTA, copy ≤ 140 chars vi/de | Req 11.3 | PASS — `<StateShell state="empty">` | `screenshots/listening/listening-empty-mobile.png` (PENDING) |
| L-E2 | No reward amber | Req 11.7 | PASS — Property 9 | `screenshots/listening/listening-empty-mobile.png` (PENDING) |

## Result_Reward_Loop on completion

Same shared FSM as `vocabulary-microgames.md` VM-S1 … VM-S5.

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
