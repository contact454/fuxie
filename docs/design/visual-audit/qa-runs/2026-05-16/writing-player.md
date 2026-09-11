# Visual QA — `writing-player`

- **Surface ID**: `writing-player`
- **Route**: `/writing/[exerciseId]`
- **Date**: 2026-05-16
- **Owner**: PM
- **Co-authors**: FE (Playwright capture), GD (motivation copy), DSD (radio booth scrim + tokens)

## State coverage

| State | Mascot role | Required? |
| --- | --- | --- |
| `editor-textarea` | `coach` | yes |
| `submitting` | `coach` | yes |
| `feedback` | `celebrate` | yes |

## Player state checklist

| # | Item | Spec ref | Status | Evidence |
| --- | --- | --- | --- | --- |
| WP1 | Immersive layout with input area and guidelines | Req 6.2 | PASS | `screenshots/writing-player/writing-player-editor-textarea-mobile.png` (PASS — captured 2026-05-16) |
| WP2 | Full-screen submitting loader with spinning mascot | Req 6.2 | PASS | `screenshots/writing-player/writing-player-submitting-mobile.png` (PASS — captured 2026-05-16) |
| WP3 | Feedback screen with tabbed layout showing critique and suggested rewrite | Req 6.3 | PASS | `screenshots/writing-player/writing-player-feedback-mobile.png` (PASS — captured 2026-05-16) |

## Cross-cutting (every state)

| Item | Spec ref | Status |
| --- | --- | --- |
| Single Primary_CTA per state | Req 19.8–19.10 | PASS |
| Reward amber containment | Req 19.4 | PASS |

## Result

- **Failing items**: 0
- **Pending items**: 0
