# Gameplay Sprint 2.5 Readout: Evidence And Anti-Skip Polish

Date: 2026-05-14

## Decision

Status: green for controlled pilot.

Sprint 2.5 tightens the gameplay evidence loop before opening Sprint 3. The scope stays deliberately small: reduce microgame skip risk, capture roleplay no-score exits safely, and make admin readout more actionable.

## Implemented

- Vocabulary Microgame cards no longer expose the next action as a clickable shortcut before the learner starts the round.
- The next step is now framed as `Sau khi xong round`, keeping the primary CTA focused on playing/submitting the current mode.
- Added client-safe `quest_episode_practice_note` analytics for roleplay exits without a scored response.
- Roleplay still emits `quest_episode_completed` only for `completed_scored`.
- Admin gamification readout now shows:
  - roleplay practice-note count.
  - roleplay receipt-state split.
  - existing roleplay scenario and score-band split.
- Event allowlist and API route tests now cover the practice-note event with safe metadata only.

## Guardrails

- No leaderboard/social expansion.
- No real gift, voucher, shipping, cash-like reward, or shop spend behavior changed.
- No Fucoin cap, shop price, catalog, or spend behavior changed.
- No XP/Fucoin for click, mode choice, next-action preview, briefing, checklist, retry, or roleplay practice-note.
- Analytics metadata remains free of raw audio, transcript, prompt, answer, submitted text, and PII.

## Verification

- `npm --prefix apps/web test -- analytics/events/route.test.ts gamification-pilot-readout.test.ts lesson-gameplay-expansion.test.ts`: pass, 3 files / 24 tests.
- `npx tsc --noEmit --pretty false` in `apps/web`: pass.
- `npm --prefix apps/web test`: pass, 59 files / 231 tests.
- Browser smoke in the in-app browser: pass for microgame anti-skip copy, roleplay `practice_note` receipt, and admin Roleplay Receipt States.

## Release Note

Sprint 2.5 is a pilot-quality polish slice. If needed, rollback is low-risk: hide the practice-note event emission and keep roleplay receipt UI behavior unchanged.
