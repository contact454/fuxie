# Gameplay Sprint 2 Readout: Microgame Mechanics And Roleplay Completion v1

Date: 2026-05-14

## Decision

Status: green for controlled pilot.

Sprint 2 kept the scope narrow: deepen Vocabulary Microgames and German Situation Roleplay without changing the reward economy.

## Implemented

- Vocabulary Microgame cards now show a round contract per mode:
  - success criteria.
  - completion rule.
  - receipt expectation after submit.
  - recommended next action.
- Microgame start analytics now includes safe mode metadata:
  - `gameplayMode`.
  - `completionRuleCode`.
  - `nextAction`.
- Situation Roleplay now has a visible completion checklist:
  - listen to the scenario.
  - record at least one scored response.
  - end roleplay to view receipt.
- Roleplay receipt now distinguishes:
  - `practice_note`: learner ended without a scored response.
  - `completed_scored`: learner ended after at least one scored response.
- Roleplay completion analytics only emits `quest_episode_completed` for `completed_scored`.

## Guardrails

- No leaderboard or social competition opened.
- No real gift, voucher, shipping, cash-like reward, or shop spend behavior changed.
- No Fucoin cap, shop price, catalog, or spend behavior changed.
- No XP/Fucoin added for click, opening page, mode selection, briefing, checklist, retry, or roleplay shell.
- Analytics metadata stays clear of raw speech, audio, transcript, prompt, submitted answer, and PII.

## QA Focus

- Microgames: verify unique objective, success criteria, completion rule, receipt expectation, next action, and primary start CTA.
- Roleplay: verify no-score receipt shows `practice_note` and scored path shows `completed_scored`.
- Regression: dashboard, campaign, badge album, admin gamification, and economy guardrails.

## Verification

- `npm --prefix apps/web test -- lesson-gameplay-expansion.test.ts`: pass, 1 file / 5 tests.
- `npx tsc --noEmit --pretty false` in `apps/web`: pass.
- `npm --prefix apps/web test`: pass, 59 files / 230 tests.
- Browser smoke in the in-app browser: pass for `/vocabulary/microgames?theme=a1-person&level=A1`, `/speaking/roleplay?scenario=self-intro&level=A1`, `/dashboard`, `/campaign`, `/badges`, and `/admin/gamification`.

## Release Note

Sprint 2 is ready for controlled pilot. Rollback is simple: hide the new roleplay checklist/receipt state copy and keep the underlying speaking conversation behavior unchanged.
