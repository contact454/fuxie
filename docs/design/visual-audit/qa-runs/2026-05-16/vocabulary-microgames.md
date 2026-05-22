# Visual QA — `vocabulary-microgames`

- **Surface ID**: `vocabulary-microgames`
- **Route**: `/vocabulary/microgames`
- **Date**: 2026-05-16
- **Owner**: PM
- **Co-authors**: FE (Playwright capture), GD (preview reward copy), DSD (preview chip token)
- **Spec refs**:
  - `requirements.md` Req 5.4 (preview reward chip), Req 7 (Result_Reward_Loop), Req 11, Req 16, Req 20.1 / 20.4
  - `design.md` §I.3, §I.5
  - `apps/web/src/lib/mascot/mascot-role.ts` `SURFACE_MASCOT_CONFIG['vocabulary-microgames']`

## State coverage

| State | Mascot role | Required? |
| --- | --- | --- |
| `default` | `companion` | yes |
| `success` | `cheer` | yes (Req 7.2 — earned phase via `<ResultRewardLoop>`) |
| `empty` | (no separate empty — uses parent vocabulary empty) | n/a |
| `error` | (parent error boundary) | n/a |

## Default state checklist (pre-tap)

| # | Item | Spec ref | Status | Evidence |
| --- | --- | --- | --- | --- |
| VM1 | Mascot `companion` rendered | Req 5, Req 12 | PASS — `SURFACE_MASCOT_CONFIG['vocabulary-microgames'].default = 'companion'` | `screenshots/vocabulary-microgames/vocabulary-microgames-default-mobile.png` (PENDING) |
| VM2 | Reward_State `preview`: image from `REWARD_ASSETS` + label "+10 Fucoin" rendered with `data-reward-state="preview"` and `data-reward-context="true"` | Req 5.4, Req 16.1 | PASS — Property 9; uses `getRewardAssetSrc` | `screenshots/vocabulary-microgames/vocabulary-microgames-default-mobile.png` (PENDING) |
| VM3 | Preview chip does NOT change until learner taps Primary_CTA "Bắt đầu" | Req 5.4 | PASS — state machine pure-function unit test | n/a |
| VM4 | Single Primary_CTA "Bắt đầu" inside first viewport | Req 11.1, Req 14.1 | PASS — Property 7 + Property 8 | `screenshots/vocabulary-microgames/vocabulary-microgames-default-mobile.png` (PENDING) |
| VM5 | Reward amber `#FFB703` only inside the `data-reward-state="preview"` subtree | Req 6.9, Req 16.1, Req 19.4 | PASS — Property 9 | `screenshots/vocabulary-microgames/vocabulary-microgames-default-mobile.png` (PENDING) |

## Success state checklist (Result_Reward_Loop)

| # | Item | Spec ref | Status | Evidence |
| --- | --- | --- | --- | --- |
| VM-S1 | Earned phase: mascot `cheer`, `data-reward-state="earned"`, animation 1.2–2.0s | Req 7.1, Req 7.2 | PASS — Property 15 (`tests/result-reward-loop.spec.tsx`) | `screenshots/vocabulary-microgames/vocabulary-microgames-success-mobile.png` (PENDING) |
| VM-S2 | Auto-transition to receipt without tap | Req 7.1 | PASS — Property 15 | n/a |
| VM-S3 | Receipt phase shows XP ≥ 0, Fucoin ≥ 0, accuracy 0–100, time mm:ss (mm ≤ 99); single Primary_CTA "Tiếp tục" / "Học bài kế tiếp" | Req 7.3, Req 7.4 | PASS — Property 15 | `screenshots/vocabulary-microgames/vocabulary-microgames-success-mobile.png` (PENDING) |
| VM-S4 | Reduced-motion: skip animation, render frame-final earned + receipt within 200ms | Req 7.5, Req 13.3 | PASS — Property 10 + result-reward-loop reduced-motion path | n/a |
| VM-S5 | Save fail does NOT enter earned phase; error state with "Thử lại" (≤ 3 retries) | Req 7.6, Req 7.7 | PASS — FSM `Saving → ErrorState → Blocked` (`result-reward-loop.tsx`) | n/a (unit test) |

## Cross-cutting

| Item | Spec ref | Status |
| --- | --- | --- |
| Single Primary_CTA per state | Req 19.8–19.10 | PASS — Property 8 |
| Primary_CTA in first viewport | Req 19.3 | PASS — Property 7 |
| Reward amber containment | Req 19.4 | PASS — Property 9 |
| Reduced-motion discipline | Req 19.5 | PASS — Property 10 |

## Result

- **Failing items**: 0
- **Pending items**: screenshot capture (default pre-tap, success earned phase, success receipt phase).
