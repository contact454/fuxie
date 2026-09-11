# Visual QA — `listening-player`

- **Surface ID**: `listening-player`
- **Route**: `/listening/[lessonId]`
- **Date**: 2026-05-16
- **Owner**: PM
- **Co-authors**: FE (Playwright capture), GD (motivation copy), DSD (radio booth scrim + tokens)

## State coverage

| State | Mascot role | Required? |
| --- | --- | --- |
| `default` | `coach` | yes |
| `selected` | `coach` | yes |
| `correct` | `celebrate` | yes |
| `wrong` | `thinking` | yes |
| `result` | `celebrate` | yes |

## Player state checklist

| # | Item | Spec ref | Status | Evidence |
| --- | --- | --- | --- | --- |
| LP1 | Immersive overlay layout with X exit button and progress bar | Req 6.2 | PASS | `screenshots/listening-player/listening-player-default-mobile.png` (PASS — captured 2026-05-16) |
| LP2 | Large central AudioButton with playback control | Req 6.2 | PASS | `screenshots/listening-player/listening-player-default-mobile.png` (PASS — captured 2026-05-16) |
| LP3 | Option selected highlight state | Req 6.3 | PASS | `screenshots/listening-player/listening-player-selected-mobile.png` (PASS — captured 2026-05-16) |
| LP4 | Correct answer feedback footer with green styling | Req 6.4 | PASS | `screenshots/listening-player/listening-player-correct-mobile.png` (PASS — captured 2026-05-16) |
| LP5 | Incorrect answer feedback footer with correct answer revealed | Req 6.4 | PASS | `screenshots/listening-player/listening-player-wrong-mobile.png` (PASS — captured 2026-05-16) |
| LP6 | Results summary screen with completed checkpoints | Req 6.5 | PASS | `screenshots/listening-player/listening-player-result-mobile.png` (PASS — captured 2026-05-16) |

## Cross-cutting (every state)

| Item | Spec ref | Status |
| --- | --- | --- |
| Single Primary_CTA per state | Req 19.8–19.10 | PASS |
| Reward amber containment | Req 19.4 | PASS |

## Result

- **Failing items**: 0
- **Pending items**: 0
