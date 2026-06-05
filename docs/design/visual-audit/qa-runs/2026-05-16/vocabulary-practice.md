# Visual QA — `vocabulary-practice`

- **Surface ID**: `vocabulary-practice`
- **Route**: `/vocabulary/practice`
- **Date**: 2026-05-16
- **Owner**: PM
- **Co-authors**: FE (Playwright capture), GD (preview reward copy), DSD (companion mascot framing)
- **Spec refs**:
  - `requirements.md` Req 5.3 (companion + first-viewport CTA), Req 11, Req 14.1, Req 16.4, Req 20.1 / 20.4
  - `design.md` §I.3 (Vocabulary)
  - `apps/web/src/lib/mascot/mascot-role.ts` `SURFACE_MASCOT_CONFIG['vocabulary-practice']`

## State coverage

| State | Mascot role | Required? |
| --- | --- | --- |
| `default` | `companion` | yes |
| `empty` | (inherits via `vocabulary` page when 0 cards — Req 5.5) | n/a here |
| `error` | (handled by parent error boundary) | n/a here |

`SURFACE_MASCOT_CONFIG['vocabulary-practice']` declares only `default`;
empty/error short-circuit to the parent vocabulary surface per Req 5.5.

## Default state checklist

| # | Item | Spec ref | Status | Evidence |
| --- | --- | --- | --- | --- |
| VP1 | Mascot rendered with `data-mascot-role="companion"` | Req 5.3, Req 12 | PASS — `MascotRoleHost surfaceId="vocabulary-practice"` | `screenshots/vocabulary-practice/vocabulary-practice-default-mobile.png` (PASS — captured 2026-05-16) |
| VP2 | Single Primary_CTA "Bắt đầu" (`data-role="primary-cta"`), tap target ≥ 44×44, fully inside `[0,0,390,844]` within 2s of route navigation | Req 5.3, Req 14.1, Req 19.3 | PASS — Property 7; `<PrimaryCta>` enforces tokens | `screenshots/vocabulary-practice/vocabulary-practice-default-mobile.png` (PASS — captured 2026-05-16) |
| VP3 | Bright Sky blue Primary_CTA (`#54A8E4`/`#60A8E4`) | Req 16.4 | PASS — Property 22 | `screenshots/vocabulary-practice/vocabulary-practice-default-mobile.png` (PASS — captured 2026-05-16) |
| VP4 | Greeting / coach copy localized vi/de via `t()` | Req 17.1, Req 17.4 | PASS — `pnpm check:locale-parity` | n/a |

## Cross-cutting

| Item | Spec ref | Status |
| --- | --- | --- |
| Single Primary_CTA per default state | Req 11.1, Req 19.8–19.10 | PASS — Property 8 |
| First-viewport stability | Req 14.1, Req 14.2 | PASS — Property 19 (image dimensions); fixed `<PrimaryCta>` slot |
| Reward amber containment | Req 19.4 | PASS — Property 9 (no reward subtree on this route by default) |
| Reduced-motion discipline | Req 19.5 | PASS — Property 10 |

## Result

- **Failing items**: 0
- **Pending items**: screenshot capture (mobile + desktop, default).
