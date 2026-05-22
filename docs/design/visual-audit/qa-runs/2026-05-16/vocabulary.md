# Visual QA — `vocabulary` (Collection Book)

- **Surface ID**: `vocabulary`
- **Route**: `/vocabulary`
- **Date**: 2026-05-16
- **Owner**: PM
- **Co-authors**: FE (Playwright capture), GD (state semantics), DSD (collection card frame token)
- **Spec refs**:
  - `requirements.md` Req 5 (Vocabulary Collection Book), Req 11, Req 16, Req 20.1 / 20.4
  - `design.md` §I.3 (Vocabulary Collection Book)
  - `apps/web/src/lib/mascot/mascot-role.ts` `SURFACE_MASCOT_CONFIG.vocabulary`

## State coverage

| State | Mascot role | Required? |
| --- | --- | --- |
| `default` | `companion` | yes |
| `empty` | `guard` | yes |
| `error` | `guard` | yes |
| `locked` | — | n/a |

Verified by `pnpm check:state-shell-coverage`.

## Default state checklist

| # | Item | Spec ref | Status | Evidence |
| --- | --- | --- | --- | --- |
| V1 | Each card has exactly one `data-card-state ∈ {new, learning, mastered}` plus distinct image+text indicators per state | Req 5.1 | PASS — Property 12 (`tests/vocabulary-card.spec.tsx`) | `screenshots/vocabulary/vocabulary-default-mobile.png` (PENDING) |
| V2 | Two independent testers can identify each state without reading code | Req 5.1 | PENDING — sign-off requires GD + DSD review during capture pass | `screenshots/vocabulary/vocabulary-default-mobile.png` (PENDING) |
| V3 | Mastered card applies frame from `FUXIE_UI_FRAMES.collectionCardFrame` within 1s of state transition | Req 5.2 | PASS — jsdom timer test in vocabulary card test | n/a |
| V4 | Frame load failure falls back to `--fuxie-success` border + non-blocking toast; mastered state preserved | Req 5.6 | PASS — `<Image>` onError fallback; state not mutated | n/a |
| V5 | Mascot `companion` (`FUXIE_3D_ASSETS.vocabularyCoach`) | Req 5.3, Req 12 | PASS — `MascotRoleHost` resolves from `SURFACE_MASCOT_CONFIG.vocabulary.default` | `screenshots/vocabulary/vocabulary-default-mobile.png` (PENDING) |

## Empty state checklist (0 words)

| # | Item | Spec ref | Status | Evidence |
| --- | --- | --- | --- | --- |
| V-E1 | Mascot `guard`, copy localized vi/de (≤ 140 chars) | Req 5.5, Req 11.3, Req 12.6 | PASS — `<StateShell state="empty">` for `vocabulary` | `screenshots/vocabulary/vocabulary-empty-mobile.png` (PENDING) |
| V-E2 | Single Primary_CTA "Học từ đầu tiên" inside first viewport | Req 5.5, Req 11.3 | PASS — Property 7 + Property 8 | `screenshots/vocabulary/vocabulary-empty-mobile.png` (PENDING) |
| V-E3 | No reward amber | Req 11.7, Req 16.5 | PASS — Property 9 | `screenshots/vocabulary/vocabulary-empty-mobile.png` (PENDING) |

## Error state checklist

| # | Item | Spec ref | Status | Evidence |
| --- | --- | --- | --- | --- |
| V-Er1 | Mascot `guard`, single Primary_CTA "Thử lại", secondary "Về Dashboard" | Req 11.5, Req 12.6 | PASS — `<StateShell state="error">` | `screenshots/vocabulary/vocabulary-error-mobile.png` (PENDING) |
| V-Er2 | Retry rate-limit; no reward amber | Req 11.6, Req 11.7 | PASS — `createRetryGuard`, Property 9 | n/a |

## Cross-cutting

| Item | Spec ref | Status |
| --- | --- | --- |
| Single Primary_CTA per non-default state | Req 19.8–19.10 | PASS — Property 8 |
| Primary_CTA in first viewport at 390×844 | Req 19.3 | PASS — Property 7 |
| Reward amber containment | Req 19.4 | PASS — Property 9 |
| Reduced-motion discipline | Req 19.5 | PASS — Property 10 |

## Result

- **Failing items**: 0
- **Pending items**: V2 sign-off (tester independence) + screenshot capture for default/empty/error.
