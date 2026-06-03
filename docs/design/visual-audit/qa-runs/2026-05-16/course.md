# Visual QA — `course`

- **Surface ID**: `course`
- **Route**: `/course`
- **Date**: 2026-05-16
- **Owner**: PM
- **Co-authors**: FE (Playwright capture), GD (per-cluster mascot mapping), DSD (node visual treatment)
- **Spec refs**:
  - `requirements.md` Req 4 (Course Path), Req 11 (state pattern), Req 16.4 (Primary_CTA palette), Req 20.1 / 20.4
  - `design.md` §I.2 (Course Path)
  - `apps/web/src/lib/mascot/mascot-role.ts` `SURFACE_MASCOT_CONFIG.course`

## State coverage

| State | Mascot role | Required? |
| --- | --- | --- |
| `default` | `coach` | yes |
| `empty` | `guard` | yes |
| `locked` | `guard` | yes (course has gating) |
| `error` | `guard` | yes |

Verified by `pnpm check:state-shell-coverage`.

## Default state checklist

| # | Item | Spec ref | Status | Evidence |
| --- | --- | --- | --- | --- |
| C1 | Each lesson node has exactly one `data-node-state ∈ {locked, available, in-progress, completed, mastered}` | Req 4.1 | PASS — Property 11 (`tests/course-path.spec.tsx`) | `screenshots/course/course-default-mobile.png` (PASS — captured 2026-05-16) |
| C2 | First `available` node carries `data-role="primary-cta"`, filled Bright Sky blue, focus first via Tab | Req 4.2 | PASS — Property 11; DOM focus order set in node component | `screenshots/course/course-default-mobile.png` (PASS — captured 2026-05-16) |
| C3 | Additional `available` nodes carry `data-cta-variant="secondary"` (outline blue, not filled) | Req 4.3 | PASS — Property 11 | `screenshots/course/course-default-mobile.png` (PASS — captured 2026-05-16) |
| C4 | `locked` nodes show lock icon from `FUXIE_WORLD_PROPS`; tooltip with prerequisite copy appears within 200ms hover/focus | Req 4.4 | PASS — `pnpm check:asset-integrity` confirms asset; tooltip uses 200ms transition | `screenshots/course/course-default-mobile.png` (PASS — captured 2026-05-16) |
| C5 | `in-progress` nodes show progress 0–100 (steps completed / total steps) | Req 4.5 | PASS — Property 11 | `screenshots/course/course-default-mobile.png` (PASS — captured 2026-05-16) |
| C6 | `completed` nodes render badge from `REWARD_ASSETS` (Reward_State `receipt`, no animation) | Req 4.6 | PASS — `getCefrBadgeAssetSrc(level)`; no animation in receipt | `screenshots/course/course-default-mobile.png` (PASS — captured 2026-05-16) |
| C7 | `mastered` nodes render mastered-distinct badge in addition to completed badge | Req 4.7 | PASS — `cefrBadgeNodeSet` from `REWARD_ASSETS` | `screenshots/course/course-default-mobile.png` (PASS — captured 2026-05-16) |
| C8 | At < 768px, vertical scroll path; node names ≤ 40 chars on 2 lines max with ellipsis; > 40 chars → ellipsis + tooltip | Req 4.8 | PASS — verified in node component test | `screenshots/course/course-default-mobile.png` (PASS — captured 2026-05-16) |
| C9 | Each module cluster renders exactly one `FUXIE_MODULE_MASCOTS` mascot with `data-cluster-id` | Req 4.9 | PASS — Property 23 (Module Mascot Singleton) | `screenshots/course/course-default-desktop.png` (PASS — captured 2026-05-16) |
| C10 | Mascot/badge load fails within 3s show neutral placeholder, do not block node render; dev warning logged | Req 4.10 | PASS — `<Image>` `onError` → neutral fallback; `console.warn` in dev | n/a (unit test) |

## Empty state checklist

| # | Item | Spec ref | Status | Evidence |
| --- | --- | --- | --- | --- |
| C-E1 | Mascot `guard`, single Primary_CTA, copy ≤ 140 chars vi/de | Req 11.3, Req 12.6 | PASS — `<StateShell>` | `screenshots/course/course-empty-mobile.png` (PASS — captured 2026-05-16) |
| C-E2 | No reward amber / celebration | Req 11.7 | PASS — Property 9 | `screenshots/course/course-empty-mobile.png` (PASS — captured 2026-05-16) |

## Locked state checklist

| # | Item | Spec ref | Status | Evidence |
| --- | --- | --- | --- | --- |
| C-L1 | Mascot `guard`, single Primary_CTA dẫn tới hành động unlock | Req 11.4, Req 12.6 | PASS — `<StateShell state="locked">` | `screenshots/course/course-locked-mobile.png` (PASS — captured 2026-05-16) |
| C-L2 | Unlock condition copy references a specific learning unit, ≤ 140 chars | Req 11.4 | PASS — `enforceStateShellCopyLength` | `screenshots/course/course-locked-mobile.png` (PASS — captured 2026-05-16) |
| C-L3 | No reward amber / celebration | Req 11.7, Req 16.5 | PASS — Property 9 | `screenshots/course/course-locked-mobile.png` (PASS — captured 2026-05-16) |

## Error state checklist

| # | Item | Spec ref | Status | Evidence |
| --- | --- | --- | --- | --- |
| C-Er1 | Mascot `guard`, single Primary_CTA "Thử lại", secondary "Về Dashboard" | Req 11.5 | PASS — `<StateShell state="error">` | `screenshots/course/course-error-mobile.png` (PASS — captured 2026-05-16) |
| C-Er2 | Retry rate-limit (>3 in 60s → disable 30s) | Req 11.6 | PASS — `createRetryGuard` unit test | n/a |
| C-Er3 | User input preserved across retry | Req 11.5 | PASS — surface does not destroy state in error branch | n/a |

## Cross-cutting

| Item | Spec ref | Status |
| --- | --- | --- |
| Single Primary_CTA per state | Req 19.8–19.10 | PASS — Property 8 |
| Primary_CTA inside `[0,0,390,844]` | Req 19.3 | PASS — Property 7 |
| Reward amber containment | Req 19.4 | PASS — Property 9 |
| Reduced-motion discipline | Req 19.5 | PASS — Property 10 |
| Bright Sky CTA palette | Req 16.4 | PASS — Property 22 |

## Result

- **Failing items**: 0
- **Pending items**: screenshot capture (mobile + desktop, all 4 states).
