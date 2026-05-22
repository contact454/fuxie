# Learner UI Visual QA Runbook

Date: 2026-05-14

## Purpose

This runbook operationalizes Batch 1 of the Fuxie Learner UI + Design Production Plan. It tells UI/UX, Design System, Mascot/Asset, and Gamification reviewers what to open, capture, and score before the next UI implementation slice.

Use the manifest at `docs/design/visual-audit/learner-ui-screenshot-manifest.json` as the source of truth for routes, expected screenshot filenames, asset refs, and QA focus notes.

## Local Setup

1. Start the web app on port 3005.
2. Enable dev learner auth:

```powershell
$env:FUXIE_DEV_AUTH_ENABLED="true"
```

3. If data is stale or empty, follow `docs/beta/dev-checklist.md` and seed the local QA database.
4. Sign in through dev auth for each route:

```text
http://localhost:3005/api/dev-auth/login?role=learner&redirect=<encoded-route>
```

Example:

```text
http://localhost:3005/api/dev-auth/login?role=learner&redirect=%2Fdashboard
```

## Screenshot Standard

Capture two viewports for each manifest surface:

| Viewport | Size | Filename suffix |
| --- | --- | --- |
| Desktop | 1440 x 1100 | `-desktop.png` |
| Mobile | 390 x 844 | `-mobile.png` |

Save files using the exact manifest paths:

```text
docs/design/visual-audit/screenshots/<surface>-village-v1-desktop.png
docs/design/visual-audit/screenshots/<surface>-village-v1-mobile.png
```

Do not replace older screenshots. Keep existing evidence files for before/after comparison.

## Reviewer Scorecard

Score each surface from 1 to 5.

| Criterion | What 5 means |
| --- | --- |
| CTA clarity | Learner can tell what to do next within 3 seconds |
| Game loop clarity | Learn -> earn -> progress/unlock is visible without reading everything |
| Asset fit | Mascot/prop/reward art has a clear job and matches the surface role |
| Mobile fit | No overlap, no cramped controls, no mascot-driven layout shift |
| System consistency | Uses shared Fuxie colors, reward language, motion, and component patterns |
| Learning restraint | Game layer supports study and never competes with content |

Minimum bar before UI implementation:

- P0 surfaces average at least 4.0.
- No P0 surface scores below 3 for CTA clarity or mobile fit.
- Any asset with unclear purpose is removed from the implementation slice or moved to backlog.

## Team Responsibilities

| Team | Owns |
| --- | --- |
| UI/UX | Journey clarity, CTA hierarchy, mobile fit, empty/error state usefulness |
| Design System | Reusable component/frame rules, token consistency, motion/reduced-motion rules |
| Mascot/Asset | Asset readability, filename/dimension discipline, Fuxie identity, IP safety |
| Gamification | Reward honesty, mission clarity, non-shaming streak language, economy comprehension |

## Batch 1 Workflow

1. Run the inventory script:

```powershell
& "$env:APPDATA\npm\pnpm.cmd" exec tsx scripts/learner-ui-visual-audit.ts
```

2. Review `tmp/learner-ui-visual-audit.md`.
3. Capture missing P0 screenshots first.
4. Fill manual scores in the report or a follow-up issue.
5. Promote only validated gaps into the next image generation or UI implementation batch.

## Local Docker DB Notes

For learner browser QA, make sure commands that touch Prisma use the same local DB as the web app.

The root `.env` and `apps/web/.env` should point to the local Docker database on `127.0.0.1:5434`. The package-level `packages/database/.env` may point elsewhere, so override the env explicitly before local seed or Prisma checks:

```powershell
$dbUrl = (Get-Content -LiteralPath ".env" | Where-Object { $_ -match "^DATABASE_URL=" } | Select-Object -First 1) -replace "^DATABASE_URL=", ""
$dbUrl = $dbUrl.Trim().Trim('"')
$env:DATABASE_URL = $dbUrl
$env:DATABASE_URL_UNPOOLED = $dbUrl
& "$env:APPDATA\npm\pnpm.cmd" db:seed:dev
```

Use these local seed player routes for skill-player screenshots:

| Skill | Route |
| --- | --- |
| Reading | `/reading/R-A1-DEV-001` |
| Listening | `/listening/L-A1-DEV-001` |
| Writing | `/writing/W-A1-DEV-001` |
| Speaking | `/speaking/dev-a1-begruessung-01` |

If the install prompt covers the bottom reward cards in mobile screenshots, dismiss it before final scoring.

## Stop Rules

Stop and reroute before implementation if:

- A P0 route cannot be opened with dev learner auth.
- A required reward, mission, or wallet state is missing from local seed data.
- A proposed asset resembles external game IP.
- A mascot/prop hides learning content or weakens the CTA.
- A reward moment celebrates a capped, duplicate, or pending reward as if it were newly earned.
