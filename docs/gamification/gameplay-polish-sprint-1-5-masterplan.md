# Gameplay Polish Sprint 1.5 Masterplan

Date: 2026-05-14

## Purpose

Close the P2/P3 findings from Gameplay QA Sprint 1 so Fuxie can enter Sprint 2 with a cleaner learner gameplay baseline instead of carrying known friction forward.

## Sprint Goal

Move the current gameplay surfaces from `yellow` to `green/yellow-ready` by fixing:

- Repeated microgame CTA labels.
- Unlabeled active roleplay controls.
- Unclear roleplay completion/receipt state.
- Campaign progress copy that can confuse opened path progress with completed learning evidence.
- Missing dashboard entry points for the new gameplay surfaces.

## Scope

In scope:

- Vocabulary Microgame Pack CTA copy.
- German Situation Roleplay accessibility and receipt copy.
- Quest Campaign Map progress explanation.
- Dashboard quick-entry links to Microgames, Campaign Map, and Badge Album.
- Sprint readout update and browser smoke.

Out of scope:

- New gameplay modes.
- New reward catalog, shop spend, Fucoin cap, or item price changes.
- Leaderboard/social expansion.
- Real gift, voucher, shipping, or cash-like rewards.
- New database schema.

## Task Plan

| ID | Task | Owner | Acceptance |
| --- | --- | --- | --- |
| GPQA-FIX-001 | Replace repeated `Choi van nay` labels with game-specific labels | Full-stack Engineer | Each microgame link has unique visible and accessible text. |
| GPQA-FIX-002 | Add accessible labels to active roleplay controls | Full-stack Engineer | Close, finish, record, and stop buttons expose clear names. |
| GPQA-FIX-003 | Clarify roleplay completion and receipt | Gamification Designer + Full-stack Engineer | Learner can tell when a scored turn is needed and what receipt means. |
| GPQA-FIX-004 | Clarify campaign path vs node evidence copy | Product Designer + Data | Learner understands opened path progress vs completed learning signal. |
| GPQA-FIX-005 | Add dashboard entry points | Product Designer + Full-stack Engineer | Dashboard quick actions include Microgames, Campaign Map, and Badge Album. |
| GPQA-FIX-006 | Rerun smoke and update readout | QA Automation Engineer | Desktop/mobile smoke passes; release decision updated. |

## Release Criteria

- P2 findings GPQA-001 through GPQA-004 are fixed or explicitly downgraded.
- Dashboard offers clear entry points to gameplay surfaces.
- Browser smoke passes on desktop and mobile for microgames, roleplay, badge album, campaign, dashboard, and admin gamification.
- Typecheck passes.
- Reward/economy guardrails remain unchanged.

## Guardrails

- No XP/Fucoin for click, checkpoint, briefing, opening roleplay, or viewing album/map.
- Badge and reward receipt copy must stay tied to meaningful completion.
- Analytics metadata remains minimal and must not include audio, transcript, raw speech, prompt, submitted text, or PII.
- Shop/economy behavior remains frozen.

