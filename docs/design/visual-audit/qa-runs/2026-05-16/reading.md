# Visual QA — `reading`

- **Surface ID**: `reading`
- **Route**: `/reading/[exerciseId]` (seeded route: `/reading/R-A1-DEV-001`)
- **Date**: 2026-05-16
- **Owner**: PM
- **Co-authors**: FE (Playwright capture), GD (motivation copy), DSD (library scrim + tokens)
- **Spec refs**:
  - `requirements.md` Req 6 (Skill players), Req 7 (Result_Reward_Loop), Req 11, Req 14.1, Req 16, Req 20.1 / 20.4
  - `design.md` §I.4 (Skill players)
  - `apps/web/src/lib/mascot/mascot-role.ts` `SURFACE_MASCOT_CONFIG.reading`

## State coverage

| State | Mascot role | Required? |
| --- | --- | --- |
| `default` (in-progress) | `coach` | yes |
| `empty` | `guard` | yes |
| `error` | `guard` | yes |

## Default state checklist

| # | Item | Spec ref | Status | Evidence |
| --- | --- | --- | --- | --- |
| R1 | `Skill_Motivation_Layer` rendered with `data-role="skill-motivation-layer"`; bounding box ≤ `min(20vh, 169px)` and fully inside first viewport | Req 6.1, Req 6.2 | PASS — Property 13 (`tests/skill-motivation-layer.spec.tsx`) | `screenshots/reading/reading-default-mobile.png` (PENDING) |
| R2 | Layer bounding box does NOT intersect `[data-role="skill-content"]` | Req 6.2 | PASS — Property 13 | `screenshots/reading/reading-default-mobile.png` (PENDING) |
| R3 | Exactly one mascot with `data-mascot-role="coach"` | Req 6.3, Req 12.8 | PASS — Property 5 + Property 13 | `screenshots/reading/reading-default-mobile.png` (PENDING) |
| R4 | Progress text matches `^\d+/\d+$` with `done ≤ total` | Req 6.3 | PASS — Property 13 | `screenshots/reading/reading-default-mobile.png` (PENDING) |
| R5 | Exactly one reward preview with `data-reward-state="preview"` from `REWARD_ASSETS` | Req 6.3 | PASS — Property 13 | `screenshots/reading/reading-default-mobile.png` (PENDING) |
| R6 | World prop background resolved via `pickWorldProp(['library'])` → key whose tags ⊇ `{library, library-shelf, reading-room}` | Req 6.4 | PASS — Property 14 (`tests/skill-motivation-layer.spec.tsx`) | `screenshots/reading/reading-default-desktop.png` (PENDING) |
| R7 | Bottom Primary_CTA "Trả lời" / "Tiếp tục" inside first viewport | Req 14.1, Req 19.3 | PASS — Property 7 | `screenshots/reading/reading-default-mobile.png` (PENDING) |
| R8 | Reward amber `#FFB703` ONLY inside the reward preview subtree (no pixel outside) | Req 6.9, Req 16.1, Req 19.4 | PASS — Property 9 | `screenshots/reading/reading-default-mobile.png` (PENDING) |
| R9 | Scrim auto-applied where world-prop contrast < 4.5:1 | Req 15.3 | PASS — `<Scrim>` integration via FE/DSD | `screenshots/reading/reading-default-desktop.png` (PENDING) |

## Error state checklist (load fail >10s)

| # | Item | Spec ref | Status | Evidence |
| --- | --- | --- | --- | --- |
| R-Er1 | Single Primary_CTA "Thử lại"; mascot `guard` | Req 6.10, Req 11.5 | PASS — `<StateShell state="error">` | `screenshots/reading/reading-error-mobile.png` (PENDING) |
| R-Er2 | Progress preserved across retry; no reward animation | Req 6.10 | PASS — error path keeps `lessonState` immutable | n/a |
| R-Er3 | After 3 consecutive retry failures, "Thử lại" downgrades to secondary; localized fallback message shown | Req 6.11 | PASS — `createRetryGuard` rate-limit + downgrade | n/a (unit test) |

## Empty state checklist

| # | Item | Spec ref | Status | Evidence |
| --- | --- | --- | --- | --- |
| R-E1 | Mascot `guard`, single Primary_CTA, copy ≤ 140 chars vi/de | Req 11.3, Req 12.6 | PASS — `<StateShell state="empty">` | `screenshots/reading/reading-empty-mobile.png` (PENDING) |
| R-E2 | No reward amber | Req 11.7 | PASS — Property 9 | `screenshots/reading/reading-empty-mobile.png` (PENDING) |

## Result_Reward_Loop on completion (Req 7)

Covered by `vocabulary-microgames.md` checklist VM-S1 … VM-S5 (shared
`<ResultRewardLoop>` component); reading triggers the same FSM via
`completion-flow.tsx`.

## Cross-cutting

| Item | Spec ref | Status |
| --- | --- | --- |
| Single Primary_CTA per state | Req 19.8–19.10 | PASS — Property 8 |
| Primary_CTA in first viewport | Req 19.3 | PASS — Property 7 |
| Reward amber containment | Req 19.4 | PASS — Property 9 |
| Reduced-motion discipline | Req 19.5 | PASS — Property 10 |
| Bright Sky CTA palette | Req 16.4 | PASS — Property 22 |

## Result

- **Failing items**: 0
- **Pending items**: screenshot capture (default in-progress, empty, error).
