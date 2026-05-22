# Fuxie Gamification Pilot Balance

## Sprint Defaults

- Keep the current shop catalog and prices unchanged during the pilot.
- Keep the learning Fucoin daily cap unchanged until the first readout shows a clear need.
- Keep real gifts, cash-like rewards, shipping, vouchers, leaderboard, and social competition out of scope.
- Treat `streak-freeze` as the first safe digital reward with automatic fulfillment.

## Metrics Contract

- Active learners: learners with a meaningful learning action or motivation/economy event in the selected range.
- Lesson completion rate: learners with meaningful learning actions divided by active learners.
- Repeat study within 7 days: learners with meaningful actions on at least two distinct days within a 7-day span.
- Reward-only users: learners with redeem-request behavior but no meaningful learning action in the selected range.
- Fucoin earned: sum of `fucoin_earned.metadata.amount`.
- Fucoin spent: sum of approved shop request costs reviewed in the selected range.
- Pending SLA: pending shop requests older than 48 hours.

## Health Thresholds

- Reward-only rate above 20% is a warning.
- Fucoin spend above 80% of Fucoin earned in the selected range is a warning.
- Any pending request older than 48 hours is an operations warning.

## Weekly Pilot Ritual

- PM and Data review `/admin/gamification` once per week using the latest 14-day cohort window.
- Green state: keep catalog prices and Fucoin cap frozen, continue pilot, and log the readout date.
- Yellow state: do not expand shop; Product and Gamification write a tuning proposal before any price or cap change.
- Red state: Operations and PM clear pending reward queue issues before pilot launch or expansion.

## Warning Action Map

- `reward_only_rate_high`: move learner CTA priority back to quests, freeze shop expansion, and review mission pacing.
- `spend_to_earn_rate_high`: keep cap/prices fixed, pause reward expansion, and prepare a tuning proposal from cohort data.
- `pending_reward_queue_over_sla`: escalate admin review, approve/reject supported digital rewards, and require fulfillment or rejection notes.

## Adaptive Quest Pacing v1

- Learner pacing states: `healthy`, `needs_learning_nudge`, `reward_only_risk`, `streak_recovery`, `low_repeat_study`.
- `reward_only_risk`: reward request in the last 7 days with no meaningful learning action; show a learning CTA before shop CTA.
- `streak_recovery`: learner has prior XP, current streak is zero, and study days are low; prioritize a short restart quest.
- `low_repeat_study`: fewer than two meaningful study days and low weekly minutes; prioritize a short repeat-study quest.
- `needs_learning_nudge`: SRS due or today's goal not yet complete; keep the next learning action prominent.
- Track `gamification_intervention_shown` and `gamification_intervention_clicked`; use existing `meaningful_action_completed` for follow-through.

## Skill Mastery Paths v1

- Mastery dimensions: `vocabulary`, `grammar`, `listening`, `reading`, `writing`, `speaking`, plus CEFR level when available.
- Progress inputs: only `meaningful_action_completed` events; click, redeem, and shop behavior do not advance mastery.
- Mastery milestone: 10 meaningful completions per skill for the pilot readout; quality score is averaged when score/accuracy metadata exists.
- Dashboard shows daily quest first, then a compact mastery path, next badge preview, and next quest CTA.
- Result payloads can include `skillMasteryProgress`, `nextBadgePreview`, `badgeReceipt`, and `masteryReason`; missing mastery data must not block the learning result.
- Admin readout aggregates mastery by skill, CEFR level, badge unlocks, mastery views, and receipt clicks.

## Vocabulary Quest Episode v1

- V1 applies only to `vocabulary` + `mixed` practice.
- Episode contract: `episodeId`, `themeSlug`, `cefrLevel`, objective, 3 checkpoints, reward preview, and `nextEpisodeHref`.
- Checkpoints are `discover`, `recall`, and `lock_in`, computed from the current mixed practice question count.
- XP, Fucoin, streak, mastery, and badge receipts still come only from the existing submit route after meaningful completion.
- Track `quest_episode_started`, `quest_episode_checkpoint_reached`, and `quest_episode_completed` with minimal metadata: episode id, theme slug, CEFR level, checkpoint id, question count, and accuracy band.
- Admin readout shows episode starts, checkpoint reach, completions, drop-off, accuracy band split, and repeat study after episode.

## Quest Episode Framework + Listening Episode v1

- Shared episode contract supports `vocabulary`, `listening`, and `reading`: `episodeId`, `skill`, `sourceId`, `cefrLevel`, objective, checkpoints, reward preview, and `nextEpisodeHref`.
- Listening checkpoints are `preview`, `gist`, and `details`, computed from the existing listening question count.
- Listening submit remains the source of truth for grading, XP, Fucoin, streak, mastery, and badge preview; no reward is granted for play, briefing, or checkpoint events.
- Track the same episode event names with skill/source metadata; admin readout splits episodes by skill, level, accuracy, checkpoint, and theme where available.

## Reading Quest Episode + Cross-Skill Episode Map v1

- Shared episode contract now supports `vocabulary`, `listening`, and `reading`.
- Reading checkpoints are `scan`, `understand`, and `prove`, computed from the existing reading question count.
- Reading submit remains the source of truth for grading, XP, Fucoin, streak, mastery, and badge preview; no reward is granted for briefing, scroll, click, or checkpoint events.
- Track the same episode event names with reading metadata: episode id, exercise id, CEFR level, checkpoint id, question count, and accuracy band.
- Admin readout uses `Episodes By Skill` as the cross-skill episode map for vocabulary, listening, and reading before expanding to grammar/writing/speaking.

## Grammar Quest Episode + Weakness-Based Routing v1

- Shared episode contract now supports `grammar` alongside vocabulary, listening, and reading.
- Grammar checkpoints are `notice`, `apply`, and `explain`, computed from the existing grammar exercise count.
- Grammar progress submit remains the source of truth for XP, Fucoin, streak, mastery, and badge preview; no reward is granted for briefing, theory view, click, or checkpoint events.
- Result receipt can include weakness-aware `nextEpisodeHref`: retry if accuracy is below 70%, otherwise route toward the next weak skill or Today Plan action with `/grammar` fallback.
- Track the same episode event names with grammar metadata: episode id, lesson id, CEFR level, checkpoint id, question count, and accuracy band.
- Admin readout uses `Episodes By Skill` for vocabulary, listening, reading, and grammar; no separate dashboard is required.

## Writing Quest Episode + AI Feedback Evidence v1

- Shared episode contract now supports `writing` alongside the four auto-graded skills.
- Writing checkpoints are `plan`, `draft`, and `revise`, computed from local draft progress and minimum word target.
- Writing submit remains the source of truth for AI grading, XP, streak, mastery, and persistent badge unlocks; no reward is granted for briefing, typing, checkpoint reach, or feedback view.
- `questEpisodeReceipt` is returned only after valid writing episode metadata and successful AI grading.
- AI grading failures record `ai_feedback_failed` evidence but do not create writing attempts, learning progress, badge unlocks, or completed episode events.
- Admin readout adds Writing AI Evidence: submitted, graded, feedback generated, feedback failed, failure rate, and meaningful follow-through after writing episode.
- Analytics metadata stays minimal: episode id, exercise id, CEFR level, checkpoint id/count, score band, feedback state. Submitted text and prompt content are never stored in analytics.
- Rollback rule: disable the Writing Episode shell and stop sending `questEpisode` metadata; writing submit/reward behavior remains intact.

## Speaking Quest Episode + Pronunciation Evidence v1

- Shared episode contract now supports `speaking` for `nachsprechen`; `roleplay` and conversation keep their existing flow.
- Speaking checkpoints are `listen`, `record`, and `refine`, computed from sentence practice progress.
- Speaking progress remains the source of truth for XP, streak, mastery, and persistent badge unlocks; no reward is granted for mic open, playing model audio, retry, briefing, or checkpoint reach.
- `questEpisodeReceipt` is returned only after valid `nachsprechen` episode metadata and a meaningful score from `/api/v1/speaking/progress`.
- Pronunciation evaluation failures record `ai_feedback_failed` evidence but do not create completed episode events or persistent badge unlocks.
- Admin readout adds Speaking Pronunciation Evidence: submitted, evaluated, feedback generated, feedback failed, score bands, failure rate, and meaningful follow-through after speaking episode.
- Analytics metadata stays minimal: episode id, lesson id, topic slug, CEFR level, checkpoint id/count, sentence count, score band, feedback state. Audio, transcript, prompt, and raw spoken text are never stored in analytics.
- Rollback rule: disable the Speaking Episode shell and stop sending `questEpisode` metadata; speaking evaluate/progress behavior remains intact.

## Six-Skill Pilot Launch Hardening v1

- Required smoke fixture gate: `pnpm smoke:gamification-fixtures` from the repo root.
- The fixture gate must pass the database check and all six learner paths: vocabulary, listening, reading, grammar, writing, and speaking.
- The database check verifies the `analytics_events` table and reports the latest applied migrations so migration drift is visible before browser smoke.
- Grammar smoke uses a stable published A1 lesson with exercises. If a local dev DB has grammar topics but no lessons, run the content/dev seed first; the seed fallback creates `pilot-a1-grammar-episode-01-E`.
- Admin evidence source of truth remains `/admin/gamification`; the readout must show `Episodes By Skill`, Writing AI Evidence, Speaking Pronunciation Evidence, badge unlock evidence, and the reward/economy guardrails.
- Browser smoke launch paths come from the fixture gate output and should be checked before pilot launch on desktop and mobile widths.
- Rollback rule: disable the affected episode shell for the failing skill and stop sending its `questEpisode` metadata. Keep submit/progress grading, XP/Fucoin/streak, badge preview, and economy behavior unchanged.
- If browser smoke shows a Next.js runtime overlay for missing `.next/server` manifests or Turbopack runtime chunks, treat it as an environment smoke blocker, not a gamification release decision. Rebuild or restart the web server from a clean `.next` before accepting or rejecting the pilot gate.

## Six-Skill Pilot Gate Checklist

- `pnpm smoke:gamification-fixtures` passes with database, migration, and six-skill path output.
- `/admin/gamification` loads for admin and remains protected from non-admin users.
- `Episodes By Skill` contains evidence buckets for vocabulary, listening, reading, grammar, writing, and speaking when pilot events exist.
- Writing evidence reports submitted, graded, feedback generated, feedback failed, failure rate, and follow-through without submitted text or prompt metadata.
- Speaking evidence reports submitted, evaluated, feedback generated, feedback failed, score bands, failure rate, and follow-through without audio, transcript, prompt, or raw speech metadata.
- Shop guardrails remain frozen: no real gift, voucher, shipping, cash-like reward, price change, cap change, or new spend behavior.
- Final release gate includes web tests, web typecheck, fixture smoke, and targeted browser smoke for admin gamification plus one path per skill.

## Lesson Gameplay Polish v1

- Goal: make the first-screen lesson experience feel like a playable learning episode, not just a practice/result wrapper.
- Flagship scope: Vocabulary mixed practice and Speaking `nachsprechen`.
- Shared UI primitives: `QuestCheckpointRail` shows active/done checkpoint state; `GameplayFeedbackMoment` gives compact in-lesson feedback after an answer or pronunciation result.
- Vocabulary polish: briefing mini-path, checkpoint rail during practice, right/wrong micro-feedback, result receipt and next episode CTA remain tied to submit completion.
- Speaking polish: intro challenge path, live `listen -> record -> refine` rail, pronunciation feedback moment after evaluation, summary receipt for speaking mastery and next episode.
- Economy guardrail: no XP/Fucoin is awarded for briefing, click, audio play, checkpoint view, animation, or retry. Rewards still come only from meaningful completion routes.
- Rollback rule: remove the new visual primitives from the affected lesson shell; keep existing submit/progress routes, XP/Fucoin/streak, badge persistence, and analytics allowlist unchanged.

## Lesson Gameplay Expansion v1

- Goal: add four learner-facing gameplay surfaces without changing the reward economy: Vocabulary Microgame Pack, German Situation Roleplay, Badge Album, and A1 Quest Campaign Map.
- Vocabulary Microgame Pack v1 surfaces `Speed Match`, `Cloze Streak`, and `Boss Review` through `/vocabulary/microgames`; each links to existing vocabulary submit flows so XP/Fucoin/streak still require meaningful completion.
- German Situation Roleplay v1 uses bounded A1 scenarios (`self-intro`, `cafe-order`) at `/speaking/roleplay`; it records scenario completion evidence but does not grant standalone XP/Fucoin.
- Badge Album v1 at `/badges` reuses persistent `Achievement` / `UserAchievement` and computed badge progress to show earned, ready, and locked states.
- Quest Campaign Map v1 at `/campaign` organizes an A1 starter path across vocabulary, speaking, listening, reading, and writing nodes; it is guidance, not a hard lock.
- Admin `/admin/gamification` now includes Lesson Gameplay Expansion readout: microgame starts/completions, roleplay starts/completions, campaign node starts, and splits by game/scenario/node/path.
- Analytics metadata stays minimal: `microgameId`, `themeSlug`, `scenarioId`, `campaignNodeId`, `campaignPathId`, skill, level, score band. No audio, transcript, prompt, submitted text, or learner PII is added.
- Rollback rule: hide `/vocabulary/microgames`, `/speaking/roleplay`, `/badges`, or `/campaign` links independently; existing lesson submit/progress, badge persistence, XP/Fucoin/streak, and shop guardrails remain unchanged.

## Badge Catalog v1

- `first-quest`: first meaningful completion.
- `three-day-return`: study on 3 distinct days.
- `srs-recovery`: 3 SRS review completions.
- `vocabulary-starter`, `grammar-starter`, `listening-starter`, `reading-starter`, `writing-starter`, `speaking-starter`: 2 meaningful completions in that skill.
- `balanced-learner`: 2 completions in at least 3 skills.
- `comeback`: return after a 7+ day study gap.
- `exam-prep`: 2 exam practice completions.

## Persistent Badge Unlocks v1

- Persistent unlocks use existing `Achievement` and `UserAchievement`; no schema migration is required.
- Pilot badge slugs map 1:1 to `PILOT_BADGE_CATALOG.id`; seed uses `conditionType = pilot_badge`, `conditionValue = 0`, and `xpReward = 0`.
- Badge receipt states are `preview`, `newly_unlocked`, and `already_earned`.
- Unlock service runs only after meaningful completion for vocabulary, listening, reading, grammar, writing, and speaking `nachsprechen` flows.
- `UserAchievement` remains idempotent through the existing unique key on `userId + achievementId`; duplicate completions do not emit another `badge_unlocked`.
- `badge_unlocked` metadata stays minimal: badge id, skill, CEFR level, source action id, and receipt state. No PII is added.
- Rollback rule: disable `persistBadgeUnlock` in completion routes; computed `nextBadgePreview` and mastery receipts continue to work without persistence.

## Decision Log Template

- Review date:
- Cohort window:
- Pilot state:
- Top intervention:
- Decision:
- Owner:
- Next review:

## Tuning Questions

- If reward-only risk is high, reduce shop prominence and strengthen next-learning CTA before changing prices.
- If spend-to-earn is high, review item prices before changing the earning cap.
- If pending SLA is missed, fix admin review workflow before opening more rewards.
- If `streak-freeze` demand is high but learning completion stays healthy, consider a small price increase only after a full pilot readout.

## Release Gate

- Admin can inspect pilot health from the gamification readout without database queries.
- Learner dashboard and shop point back to learning as the next action.
- Real gift remains locked in learner and admin flows.
- Tests pass for readout aggregation, admin route auth/date validation, shop redeem, approve/reject/fulfill, and wallet guardrails.
