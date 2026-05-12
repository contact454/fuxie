# Phase 31: Motivation Loop Brief

Date: 2026-05-12

## Role-Gate Compliance

Vai chinh: Gamification Designer
Vai phoi hop: Product Manager EdTech, Product Designer

This Phase 31 brief was started under the mandatory role-gate workflow:

- `task-startup-checklist.md` was read.
- `task-role-router.md` was read.
- The Gamification Designer, Product Manager EdTech, and Product Designer profiles were read.
- The task domain is missions, XP, streaks, Fucoin, rewards, mascot moments, retention loops, and learning-safe game mechanics.

## Objective

Close `P19-D1`: define the motivation loop brief for Fuxie.

This brief maps missions, XP, streak, Fucoin, rewards, and Fuxie mascot moments to real study actions so the game layer supports learning instead of distracting from it.

## Motivation Principle

```text
Reward effort that produces German learning evidence, not empty engagement.
```

Fuxie's game layer should make learners feel guided, encouraged, and proud of small wins. It should never make learners feel punished, tricked, or pushed into meaningless clicks.

## Core Loop

| Step | Learner experience | System behavior |
| --- | --- | --- |
| 1. See next action | Dashboard shows one clear mission tied to level/goal | Mission uses current CEFR level, skill, due review, or exam goal |
| 2. Complete study | Learner finishes a meaningful action | Completion event verifies learning effort |
| 3. Receive feedback | Learner sees result, correction, progress, or encouragement | Reward is tied to action quality/completion |
| 4. Earn reward | Learner receives XP/Fucoin/streak progress | Economy grants predictable, modest reward |
| 5. Choose next step | Learner sees one follow-up mission | Loop points back to weekly CEFR progress |

## Mission Types

| Mission type | Example | Counts for weekly CEFR progress | Reward rule |
| --- | --- | --- | --- |
| Daily starter | Complete one A1 vocabulary practice | Yes | Small XP + small Fucoin |
| Due review | Finish today's SRS review batch | Yes | Higher priority XP, streak eligible |
| Skill builder | Submit a short writing or speaking attempt | Yes | XP + feedback bonus |
| Exam prep | Complete one exam-style task | Yes | XP + exam-path badge progress |
| AI retry | Improve one answer after AI feedback | Yes, AI-capped by metric | XP for retry, not for passive chat |
| Recovery | Return after missed day with 5-minute action | Yes if completed | Streak freeze or soft restart |
| Explore | Open shop, mascot, or profile | No | Cosmetic or navigation only, no learning XP |

## XP Rules

| Rule | Decision |
| --- | --- |
| XP source | Award XP for completed meaningful study actions |
| Page views | No XP |
| Reward-only clicks | No XP |
| AI chat | XP only when tied to feedback/retry learning loop |
| Daily cap | Cap routine XP to reduce inflation |
| Difficulty modifier | Slight bonus for writing, speaking, exam tasks, or longer skill work |
| Quality modifier | Use cautiously; do not punish beginners harshly |

Recommended first balance:

| Action | Base XP |
| --- | --- |
| SRS/vocabulary completion | 10 XP |
| Reading/listening completion | 12 XP |
| Writing/speaking submission | 15 XP |
| Exam-style task | 18 XP |
| AI retry after feedback | 8 XP |
| Daily mission completion bonus | 5 XP |

## Fucoin Rules

Fucoin should feel fun but remain controlled.

| Rule | Decision |
| --- | --- |
| Earn | Award small Fucoin amounts for completed learning missions |
| Spend | Cosmetic rewards, mascot items, streak freeze, theme accents, learner celebration moments |
| Do not sell advantage | No pay-to-win learning shortcuts |
| Avoid inflation | Weekly earn cap and modest shop pricing |
| Avoid pressure | Do not make recovery impossible after missed days |

Recommended first balance:

| Action | Fucoin |
| --- | --- |
| Daily mission completion | 2 |
| Weekly 3-action progress reached | 8 |
| Writing/speaking retry | 2 |
| Exam practice completion | 3 |
| Recovery mission | 1 |

## Streak Rules

Streaks should encourage return without shame.

| Scenario | Behavior |
| --- | --- |
| Learner completes one meaningful action today | Streak advances |
| Learner only opens app | Streak does not advance |
| Learner misses one day with freeze available | Freeze can protect streak once |
| Learner misses multiple days | Show soft restart and recovery mission |
| Learner returns after break | Celebrate return, do not shame |
| Learner is overloaded | Offer 5-minute mission |

Streak copy should avoid guilt language. The mascot should say "start small again" rather than "you failed".

## Reward Catalog

| Reward | Purpose | Guardrail |
| --- | --- | --- |
| Streak freeze | Reduce anxiety after missed day | Limited earn/use frequency |
| Mascot accessory | Personalization and delight | Cosmetic only |
| Theme accent | Visual progression | Must not harm accessibility |
| Badge | Recognize learning milestone | Tied to completed skill/level action |
| Celebration animation | Reinforce completion | Short, not disruptive |
| Shop item | Long-term motivation | Priced to avoid grind |

## Mascot Moments

| Moment | Mascot job | UX requirement |
| --- | --- | --- |
| First mission of day | Encourage one clear action | Short copy near primary CTA |
| Mistake feedback | Normalize correction | Supportive tone, no over-cute distraction |
| Weekly progress reached | Celebrate real learning | Link celebration to completed actions |
| Missed day recovery | Reduce shame | Offer small restart mission |
| Exam prep milestone | Acknowledge effort | Avoid pass/fail or guaranteed outcome claims |
| Shop/reward reveal | Add delight | Keep secondary to study flow |

## Anti-Patterns

- Awarding XP for page views.
- Letting AI chat spam inflate progress.
- Rewarding shop activity like learning.
- Making streak loss feel punitive.
- Pushing long sessions when learner selected short daily time.
- Using mascot copy that hides errors or overpraises weak work.
- Creating reward inflation before beta measurement.

## Metrics

| Metric | Why it matters |
| --- | --- |
| Daily mission completion rate | Measures motivation loop usage |
| Weekly meaningful CEFR progress rate | Ensures game loop supports learning |
| Streak continuation rate | Measures habit formation |
| Streak recovery usage | Checks whether recovery reduces churn |
| Reward redemption rate | Measures reward interest |
| Reward-only engagement rate | Detects decorative or distracting mechanics |
| D1/D7/D30 retention by progress status | Links motivation to return behavior |

## Data Requirements

| Event | Required properties |
| --- | --- |
| `mission_viewed` | `user_id`, `mission_id`, `mission_type`, `level`, `skill`, `source`, `timestamp` |
| `mission_started` | `user_id`, `mission_id`, `action_type`, `level`, `skill`, `timestamp` |
| `mission_completed` | `user_id`, `mission_id`, `action_type`, `level`, `skill`, `xp_awarded`, `fucoin_awarded`, `timestamp` |
| `streak_advanced` | `user_id`, `streak_count`, `action_type`, `timestamp` |
| `streak_freeze_used` | `user_id`, `freeze_balance`, `reason`, `timestamp` |
| `reward_claimed` | `user_id`, `reward_id`, `reward_type`, `fucoin_cost`, `timestamp` |
| `weekly_progress_reached` | `user_id`, `weekly_progress_action_count`, `ai_action_count_capped`, `timestamp` |

Privacy rule: reward and mission events should use metadata only, never raw learner submissions, audio, transcripts, or AI chat content.

## UX Guardrails

- Primary mission stays visually connected to the dashboard next action.
- Reward preview should be clear but secondary to the learning action.
- Mobile layout must keep mission CTA and progress readable without crowding.
- Shop/reward surfaces should be discoverable, not dominant in the first learning viewport.
- Streak recovery should be one tap plus one real study action, not a confusing economy flow.

## Acceptance Criteria

Phase 31 is accepted when:

- Missions, XP, streak, Fucoin, rewards, and mascot moments map to meaningful study actions.
- Reward rules distinguish learning outcomes from engagement proxies.
- Streaks encourage return without shame.
- Economy guardrails prevent inflation and pay-to-win signals.
- Metrics and events are defined for retention and learning impact.
- Product/UX guardrails keep the primary study action dominant.

## Residual Risks

| Risk | Mitigation |
| --- | --- |
| Rewards may distract from study | Keep reward preview secondary and track reward-only engagement |
| XP inflation may weaken meaning | Use caps and action-based grants |
| Streak anxiety may discourage return | Add freeze and soft restart missions |
| Mascot may become decorative | Tie mascot moments to mission context and feedback |
| AI retry rewards may inflate progress | Respect Phase 30 AI cap and reward retry, not passive chat |

## Next Planned Step: Phase 32 Retention Event Map

Phase 32 should handle `P19-D2`:

1. Route through Data / Analytics Engineer with Growth Lead and Gamification Designer support.
2. Define D1/D7/D30 retention, mission completion, streak, reward, and weekly progress events.
3. Connect motivation signals to retention without collecting unnecessary learner content.
