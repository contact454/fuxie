# Gameplay Sprint 3 Readout

## Scope

Sprint 3 focuses on first-session gameplay continuity:

- Dashboard entry: A1 First Contact path.
- Vocabulary continuity: Speed Match -> Cloze Streak -> Boss Review -> Self-intro Roleplay.
- Campaign map: node states that explain available, in progress, ready for boss, and cleared.
- Roleplay QA harness: dev-only scored receipt path for browser smoke.
- Admin evidence: First Contact path starts, step split, and boss-to-roleplay follow-through.

## Guardrails

- No leaderboard, social competition, real gift, voucher, shipping, or cash-like reward.
- No Fucoin cap, shop price, catalog, or spend behavior changes.
- No XP/Fucoin for click, preview, checkpoint, QA harness, or retry.
- Analytics metadata stays safe: path id, step id, skill, level, score band, and route-level ids only.

## Acceptance

- Learner can start a compact First Contact path from dashboard.
- Vocabulary result screens point to the next gameplay step after meaningful submit.
- Campaign nodes show state and reason without hard-locking pilot learners.
- QA can create a roleplay scored receipt in development without touching reward logic.
- PM/Data can inspect First Contact starts, steps, and boss-to-roleplay follow-through in `/admin/gamification`.

## Rollback

Disable the dashboard First Contact section and result `gameplayNextStep` props. Existing vocabulary submits, campaign links, roleplay flow, and reward economy continue to work.
