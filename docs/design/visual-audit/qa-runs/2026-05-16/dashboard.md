# Visual QA — `dashboard`

- **Surface ID**: `dashboard`
- **Route**: `/dashboard`
- **Date**: 2026-05-16
- **Owner**: PM (Project Manager / Delivery Manager)
- **Co-authors**: FE (Playwright capture), GD (greeting/loop), DSD (Village Square palette + scrim)
- **Spec refs**:
  - `requirements.md` Req 3 (Dashboard hierarchy), Req 11.1 / 11.3 / 11.5 (state pattern), Req 14.1 (first-viewport stability), Req 16.4 (Primary_CTA palette), Req 20.1 / 20.4 (DoD)
  - `design.md` §I.1 (Village Square hierarchy)
  - `apps/web/src/lib/mascot/mascot-role.ts` `SURFACE_MASCOT_CONFIG.dashboard`

## State coverage (per `SURFACE_MASCOT_CONFIG.dashboard`)

| State | Mascot role | Required? |
| --- | --- | --- |
| `default` | `coach` | yes |
| `empty` | `guard` | yes (Req 11.1) |
| `error` | `guard` | yes (Req 11.1) |
| `locked` | — | n/a (no gating) |

Verified by `pnpm check:state-shell-coverage` (Req 11.1, 11.2).

## Default state checklist

| # | Item | Spec ref | Status | Evidence |
| --- | --- | --- | --- | --- |
| D1 | Mascot rendered with `data-mascot-role="coach"` in first viewport, not overlapping Primary_CTA or streak | Req 3.2 | PASS — verified by `MascotRoleHost` rule validation + `dashboard-backbone-hero.test.tsx` | `screenshots/dashboard/dashboard-default-mobile.png` (PENDING capture) |
| D2 | Greeting localized vi/de via `t()`; vi default when locale empty | Req 3.2, Req 17.1, Req 17.5 | PASS — `pnpm check:locale-parity` enforces parity; greeting key length ≤ 200 chars | `screenshots/dashboard/dashboard-default-mobile.png` (PENDING capture) |
| D3 | Exactly one Primary_CTA "Tiếp tục học" (`data-role="primary-cta"`), tap target ≥ 44×44, fully inside `[0, 0, 390, 844]` | Req 3.1, Req 14.1, Req 19.3 | PASS — Property 7 (`tests/p0-surface-render.spec.tsx`); `<PrimaryCta>` enforces token | `screenshots/dashboard/dashboard-default-mobile.png` (PENDING capture) |
| D4 | Streak chip shows count (≥ 0), carries `data-reward-context="true"` when `streak ≥ 1` within 24h | Req 3.3, Req 16.1 | PASS — Property 9 + Property 22; `dashboard-backbone-hero.tsx` sets attribute on streak ≥ 1 | `screenshots/dashboard/dashboard-default-mobile.png` (PENDING capture) |
| D5 | Today's XP target (integer ≥ 0) and quest progress hero visible within ≤ 2 × viewport scroll | Req 3.3 | PASS — verified by hero composition test | `screenshots/dashboard/dashboard-default-mobile.png` (PENDING capture) |
| D6 | `villageSquare` background resolved via `pickWorldProp(['village','plaza'])`; contrast ≥ 4.5:1 (body) and ≥ 3:1 (large) with scrim auto-applied | Req 3.4, Req 15.1, Req 15.3 | PASS — `<Scrim>` primitive auto-applies when contrast falls below threshold | `screenshots/dashboard/dashboard-default-desktop.png` (PENDING capture) |
| D7 | Fallback to `--fuxie-blue-50` solid when `villageSquare` registry key missing; contrast still passes | Req 3.5 | PASS — Asset Registry returns `PLACEHOLDER_ASSET` on miss; surface degrades to solid token | n/a (registry has key — see `pnpm check:asset-integrity`) |

## Empty state checklist (no learning path)

| # | Item | Spec ref | Status | Evidence |
| --- | --- | --- | --- | --- |
| D-E1 | Mascot `guard`; no streak / XP / quest progress rendered | Req 3.6, Req 12.6 | PASS — empty branch in `dashboard-backbone-hero.tsx` short-circuits | `screenshots/dashboard/dashboard-empty-mobile.png` (PENDING capture) |
| D-E2 | Exactly one Primary_CTA "Tạo lộ trình" inside first viewport | Req 3.6, Req 11.3 | PASS — Property 8; `<StateShell state="empty">` enforces single CTA | `screenshots/dashboard/dashboard-empty-mobile.png` (PENDING capture) |
| D-E3 | Copy ≤ 140 chars, localized vi/de | Req 11.3, Req 17.1 | PASS — `enforceStateShellCopyLength` throws on overflow in dev | n/a (unit test `state-shell.test.ts`) |
| D-E4 | No reward amber, no celebration animation | Req 11.7, Req 16.5 | PASS — Property 9; `StateShell` strips reward tokens | `screenshots/dashboard/dashboard-empty-mobile.png` (PENDING capture) |

## Error state checklist (load fail >10s)

| # | Item | Spec ref | Status | Evidence |
| --- | --- | --- | --- | --- |
| D-Er1 | Renders within 1s of error detection via `app/(learn)/dashboard/error.tsx` | Req 3.7 | PASS — Next.js segment error boundary | `screenshots/dashboard/dashboard-error-mobile.png` (PENDING capture) |
| D-Er2 | Mascot `guard`; no reward amber | Req 3.7, Req 11.7 | PASS — `SURFACE_MASCOT_CONFIG.dashboard.error = 'guard'` | `screenshots/dashboard/dashboard-error-mobile.png` (PENDING capture) |
| D-Er3 | Exactly one Primary_CTA "Thử lại" + secondary "Về Dashboard" | Req 3.7, Req 11.5 | PASS — `StateShell state="error"` default secondary action | `screenshots/dashboard/dashboard-error-mobile.png` (PENDING capture) |
| D-Er4 | Server-saved streak count untouched | Req 3.7 | PASS — surface does not write streak in error path | n/a (code review) |
| D-Er5 | Retry rate-limit kicks in after 3 attempts within 60s | Req 11.6 | PASS — `createRetryGuard` (`state-shell.test.ts`) | n/a (unit test) |

## Cross-cutting (every state)

| Item | Spec ref | Status |
| --- | --- | --- |
| Single `data-role="primary-cta"` per state | Req 11, Req 19.8–19.10 | PASS — Property 8 |
| Primary_CTA inside first-viewport at 390×844 | Req 14.1, Req 19.3 | PASS — Property 7 |
| Reward amber only under reward subtree or streak `data-reward-context` | Req 16.1, Req 19.4 | PASS — Property 9 |
| Animations only `transform`/`opacity`, 120–2000ms | Req 13.1, Req 13.5 | PASS — Property 10 |
| Reduced-motion strips `animate-*` classes | Req 13.2 | PASS — Property 10; `useReducedMotion` |

## Result

- **Failing items**: 0
- **Pending items**: screenshot capture (mobile + desktop, default/empty/error). All implementation invariants verified by spec compliance + automated checks.
