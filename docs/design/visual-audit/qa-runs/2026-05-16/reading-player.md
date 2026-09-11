# Visual QA — `reading-player`

- **Surface ID**: `reading-player`
- **Route**: `/reading/[exerciseId]`
- **Date**: 2026-05-16
- **Owner**: PM
- **Co-authors**: FE (Playwright capture), GD (motivation copy), DSD (radio booth scrim + tokens)

## State coverage

| State | Mascot role | Required? |
| --- | --- | --- |
| `passage` | `coach` | yes |
| `selected` | `coach` | yes |
| `correct` | `celebrate` | yes |
| `wrong` | `thinking` | yes |
| `result` | `celebrate` | yes |

## Player state checklist

| # | Item | Spec ref | Status | Evidence |
| --- | --- | --- | --- | --- |
| RP1 | Immersive overlay layout with X exit button and progress bar | Req 6.2 | PASS | `screenshots/reading-player/reading-player-passage-mobile.png` (PASS — captured 2026-05-16) |
| RP2 | Bounding box of passage text is base font 16px with line-height 1.6 | Req 6.2 | PASS | `screenshots/reading-player/reading-player-passage-mobile.png` (PASS — captured 2026-05-16) |
| RP3 | Option selected highlight state | Req 6.3 | PASS | `screenshots/reading-player/reading-player-selected-mobile.png` (PASS — captured 2026-05-16) |
| RP4 | Correct answer feedback footer with green styling | Req 6.4 | PASS | `screenshots/reading-player/reading-player-correct-mobile.png` (PASS — captured 2026-05-16) |
| RP5 | Incorrect answer feedback footer with correct answer revealed | Req 6.4 | PASS | `screenshots/reading-player/reading-player-wrong-mobile.png` (PASS — captured 2026-05-16) |
| RP6 | Results summary screen with completed checkpoints | Req 6.5 | PASS | `screenshots/reading-player/reading-player-result-mobile.png` (PASS — captured 2026-05-16) |

## Cross-cutting (every state)

| Item | Spec ref | Status |
| --- | --- | --- |
| Single Primary_CTA per state | Req 19.8–19.10 | PASS |
| Reward amber containment | Req 19.4 | PASS |

## Result

- **Failing items**: 0
- **Pending items**: 0
