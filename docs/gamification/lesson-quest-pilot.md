# Fuxie Lesson Quest Pilot

## Scope

This pilot turns normal learner actions into a clear quest loop:

1. Preview the quest and reward.
2. Complete meaningful learning activity.
3. Receive XP, Fucoin receipt, streak receipt, and next quest CTA.
4. Claim eligible daily, monthly, or quarterly missions from Mission Control.

Out of scope for this pilot: real shop spending, leaderboard/social competition, and new economy infrastructure.

## Reward Rules

- XP rewards learning progress and continues after the daily Fucoin cap is reached.
- Fucoin rewards meaningful learning actions and remains capped by the current learning daily cap.
- Streak advances only through `recordLearningActivity`; result screens expose a receipt instead of shame copy.
- Reward granting stays idempotent through `FucoinLedger` source type and source id.
- Writing and speaking can show reward receipts without opening new spend behavior.

## Quest Coverage

- Vocabulary and listening already award XP/Fucoin and now expose the shared quest reward payload.
- Reading now awards learning Fucoin and returns `rewardPreview`, `streakReceipt`, and `nextQuestHref`.
- Grammar progress now awards learning Fucoin and returns the same quest reward payload.
- Writing and speaking return shared XP/streak reward payloads without expanding shop spending.

## Mission Catalog

The pilot catalog contains 10 active mission definitions:

- Daily study minutes.
- Daily practice repetitions.
- Daily SRS review.
- Daily lesson quest.
- Monthly active days.
- Monthly study minutes.
- Monthly lesson quests.
- Quarterly XP.
- Quarterly exam attempts.
- Quarterly active learning days.

## Acceptance Criteria

- Learners see a consistent reward receipt after vocabulary, listening, reading, and grammar results.
- Reading and grammar update XP, streak, daily activity, Fucoin wallet, cache invalidation, and analytics.
- Mission claim remains one claim per mission per period.
- Shop remains preview/request-safe and does not spend Fucoin in this pilot.
- Web unit tests pass and typecheck passes for the touched code.
