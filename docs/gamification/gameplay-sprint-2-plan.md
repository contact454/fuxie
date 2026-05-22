# Gameplay Sprint 2 Plan: Microgame Mechanics And Roleplay Completion v1

Date: 2026-05-14

## Summary

Sprint 1 created the Gameplay Experience And Bug Triage Pod and baseline readout. Sprint 1.5 closed the key P2/P3 polish items: microgame CTA clarity, roleplay control accessibility, clearer roleplay receipt copy, campaign progress explanation, and dashboard entry points.

Sprint 2 should now move from polished shells to deeper playable loops.

Primary goal: make two gameplay surfaces feel meaningfully more game-like without changing the reward economy:

- Vocabulary Microgames become more than entry cards by adding lightweight in-flow mechanics and post-round clarity.
- German Situation Roleplay gets a clearer completed-turn boundary and learner-friendly receipt/follow-up loop.

Decision: keep Sprint 2 narrow. Do not open new reward economy, leaderboard, social competition, or new skill templates.

## Roles

| Role | Owner Area |
| --- | --- |
| Project Manager / Delivery Manager | Sprint cadence, blockers, release gate, final readout. |
| Product Manager EdTech | Scope, learner value, acceptance criteria, non-goals. |
| Gamification Designer | Microgame loop rules, roleplay completion pacing, anti-farming. |
| Full-stack Engineer | Implementation across UI, route integration, analytics metadata. |
| QA Automation Engineer | Regression, smoke, accessibility checks, release risk. |
| Product Designer | Mobile ergonomics, CTA hierarchy, feedback clarity. |
| Data / Analytics Engineer | Event/readout integrity and cohort metric definitions. |

## Rules

- No leaderboard/social expansion.
- No real gift, voucher, shipping, cash-like reward, or new shop spend behavior.
- No Fucoin cap, shop price, catalog, or spend behavior change.
- No XP/Fucoin for click, opening a page, choosing a mode, briefing, checkpoint, animation, or retry.
- Completion/reward evidence remains tied to meaningful learning submit or scored speaking completion.
- Analytics metadata must not include raw text, audio, transcript, prompt, submitted answer, or PII.
- Sprint 2 must keep Sprint 1.5 smoke surfaces green.

## Sprint Objectives

1. Improve Vocabulary Microgame Pack from "hub into practice" to "clear playable mode selection with round intent, success criteria, and post-round expectation."
2. Improve German Situation Roleplay from "safe scenario shell" to "scored roleplay loop with obvious completion boundary and next action."
3. Add focused analytics/readout markers for gameplay quality without expanding economy.
4. Keep the Gameplay QA Pod running in parallel and produce Sprint 2 gameplay + bug readout.

## Workstreams

### Workstream 1: Vocabulary Microgame Mechanics v1

Goal: each microgame has distinct player expectation before entering the existing practice route.

Tasks:

- Define mode-specific success criteria:
  - Speed Match: fast recognition and submit completion.
  - Cloze Streak: context recall and streak of correct answers.
  - Boss Review: mixed mastery check.
- Add a compact "round contract" to each card:
  - Objective.
  - What counts as completion.
  - What reward receipt appears after submit.
  - Recommended next action after round.
- Add mode-specific `next action` copy:
  - Speed Match -> Cloze Streak.
  - Cloze Streak -> Boss Review.
  - Boss Review -> Campaign Map.
- Keep practice route source of truth for grading/reward.

Acceptance:

- Learner can tell how the three modes differ before clicking.
- No XP/Fucoin is awarded on mode selection.
- Browser smoke finds unique CTA, objective, completion rule, and next action for each mode.

### Workstream 2: Roleplay Completion Loop v1

Goal: learner understands what must happen for roleplay to count.

Tasks:

- Add in-player completion checklist:
  - Listen to scenario.
  - Record at least one response.
  - End roleplay to view receipt.
- Improve receipt states:
  - `practice_note`: ended without scored response.
  - `completed_scored`: at least one scored response.
- Add next action:
  - Low score -> retry roleplay.
  - Clear score -> next speaking lesson or next scenario.
- Keep no standalone XP/Fucoin for roleplay v1.

Acceptance:

- Ending without scored response clearly says it is not a completed episode.
- Ending after scored response clearly says it is completed evidence.
- Active player controls remain accessible.

### Workstream 3: Gameplay Analytics Evidence v1

Goal: PM/Data can tell whether Sprint 2 improves gameplay quality, not only clicks.

Tasks:

- Confirm existing event coverage:
  - `quest_episode_started`
  - `quest_episode_completed`
  - roleplay score band metadata
  - microgame id/theme metadata
- Add only safe missing metadata if needed:
  - `gameplayMode`
  - `completionRule`
  - `receiptState`
  - `nextAction`
- Extend admin readout copy if needed, not a new dashboard.

Acceptance:

- Admin readout can distinguish microgame starts/completions by mode.
- Roleplay completion can split practice note vs scored completion if events exist.
- Metadata contains no raw speech/text/audio/transcript/prompt/PII.

### Workstream 4: QA Pod Sprint 2 Pass

Goal: Gameplay QA runs alongside implementation, not after everything is done.

Tasks:

- Run scorecard before and after Sprint 2 changes.
- Test desktop and mobile.
- Test roleplay no-score and scored paths where feasible.
- Regression smoke:
  - Microgames.
  - Roleplay.
  - Badge Album.
  - Campaign Map.
  - Dashboard.
  - Admin Gamification.
- Verify economy guardrails.

Acceptance:

- No P0/P1.
- P2 has owner or is fixed before Sprint 2 close.
- Sprint 2 readout includes green/yellow/red decision per surface.

## 2-Week Plan

### Week 1: Design And First Implementation

Day 1:

- Finalize microgame round contracts and roleplay receipt states.
- Confirm analytics metadata allowlist.

Day 2:

- Implement microgame round contract cards and next-action copy.
- Add QA checklist updates.

Day 3:

- Implement roleplay completion checklist and receipt state copy.
- Keep active controls accessible.

Day 4:

- Add/adjust safe analytics metadata if needed.
- Confirm admin readout still renders.

Day 5:

- QA Pod mid-sprint pass.
- Fix P0/P1 immediately; schedule P2.

### Week 2: Stabilization And Gate

Day 1-2:

- Fix QA findings.
- Improve mobile spacing/copy.

Day 3:

- Run full tests and typecheck.
- Run desktop/mobile browser smoke.

Day 4:

- Produce Sprint 2 gameplay scorecard/readout.
- Confirm guardrails.

Day 5:

- Release decision:
  - Green: ready for broader controlled pilot.
  - Yellow: continue internal pilot with named P2 follow-ups.
  - Red/Blocked: do not expand pilot.

## Success Metrics

Primary:

- Microgame completion rate by mode.
- Roleplay scored completion rate.
- Repeat study after microgame/roleplay within 7 days.
- Gameplay QA score improvement from Sprint 1 baseline.

Secondary:

- Dashboard-to-gameplay click-through.
- Campaign node follow-through after microgame.
- Badge Album views after meaningful completion.
- No increase in reward-only behavior.

## Test Plan

Automated:

- `npm --prefix apps/web test`
- `npx tsc --noEmit --pretty false` in `apps/web`
- Existing gamification route/readout tests remain green.

Browser smoke:

- `/vocabulary/microgames?theme=a1-person&level=A1`
- `/speaking/roleplay?scenario=self-intro&level=A1`
- `/dashboard`
- `/campaign`
- `/badges`
- `/admin/gamification`
- Mobile `390x844` for learner surfaces.

Manual QA:

- Microgame mode differentiation.
- Roleplay no-score receipt.
- Roleplay scored receipt where local speech/AI allows.
- Campaign next-action continuity.
- Economy guardrails.

## Sprint 2 Exit Criteria

Sprint 2 is complete when:

- Microgame cards communicate distinct round mechanics.
- Roleplay has clear completion states and next actions.
- Admin/readout remains stable.
- Tests/typecheck pass.
- Desktop/mobile smoke pass.
- Gameplay QA Pod publishes Sprint 2 readout.
- Product can confidently decide whether to broaden controlled pilot or run another polish sprint.

