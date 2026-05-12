# Phase 32: Retention Event Map

Date: 2026-05-12

## Role-Gate Compliance

Vai chinh: Data / Analytics Engineer
Vai phoi hop: Growth Lead, Gamification Designer

This Phase 32 event map was started under the mandatory role-gate workflow:

- `task-startup-checklist.md` was read.
- `task-role-router.md` was read.
- The Data / Analytics Engineer, Growth Lead, and Gamification Designer profiles were read.
- The task domain is retention metrics, lifecycle growth measurement, mission/streak/reward instrumentation, cohort reporting, and privacy boundaries.

## Objective

Close `P19-D2`: define the retention event map for Fuxie.

This map connects D1/D7/D30 retention, mission completion, streak behavior, rewards, and weekly meaningful CEFR progress without collecting unnecessary learner content.

## Retention Questions

```text
Do learners come back after their first meaningful study action?
Do missions, streaks, rewards, and weekly progress correlate with useful repeat study?
```

## Primary Retention Metrics

| Metric | Definition | Window |
| --- | --- | --- |
| D1 learner retention | Activated learner returns and completes at least one meaningful action on day 1 after activation date | Activation date + 1 day |
| D7 learner retention | Activated learner completes at least one meaningful action during days 1-7 after activation | Activation date + 7 days |
| D30 learner retention | Activated learner completes at least one meaningful action during days 1-30 after activation | Activation date + 30 days |
| Weekly progress retention | Learner reaches weekly meaningful CEFR progress in two consecutive 7-day windows | Rolling 7-day windows |
| Mission-driven retention | Learner completes a mission and returns for another meaningful action in the next window | D1/D7 |

Retention is based on completed learning actions, not only app opens.

## Learner Scope

| Field | Rule |
| --- | --- |
| Included users | B2C learner role |
| Anchor event | `activation_completed` preferred; fallback to first `meaningful_action_completed` if activation event is unavailable |
| Exclusions | Teacher/admin roles, dev/test accounts where identifiable, duplicate accounts, missing stable user id |
| Cohort grain | Activation date, signup week, current CEFR level, target exam, acquisition source when available |

## Core Event Map

| Event | Trigger | Required properties | Notes |
| --- | --- | --- | --- |
| `activation_completed` | Learner completes onboarding plus first meaningful action | `user_id`, `activation_action_type`, `hours_to_activation`, `cohort_date`, `timestamp` | Retention anchor |
| `meaningful_action_completed` | Learner completes qualifying study action | `user_id`, `action_id`, `action_type`, `level`, `skill`, `source`, `duration_seconds`, `timestamp` | Retention truth |
| `weekly_progress_reached` | Learner reaches 3 qualifying actions in 7-day window | `user_id`, `weekly_progress_action_count`, `ai_action_count_capped`, `progress_week_start`, `timestamp` | North Star milestone |
| `mission_viewed` | Mission appears to learner | `user_id`, `mission_id`, `mission_type`, `level`, `skill`, `source`, `timestamp` | Funnel input |
| `mission_started` | Learner starts mission | `user_id`, `mission_id`, `action_type`, `level`, `skill`, `timestamp` | Mission funnel |
| `mission_completed` | Learner completes mission action | `user_id`, `mission_id`, `mission_type`, `action_type`, `xp_awarded`, `fucoin_awarded`, `timestamp` | Mission effectiveness |
| `streak_advanced` | Streak increases after meaningful action | `user_id`, `streak_count`, `action_type`, `timestamp` | Habit signal |
| `streak_freeze_earned` | Learner earns freeze through learning | `user_id`, `freeze_balance`, `source_action_type`, `timestamp` | Economy signal |
| `streak_freeze_used` | Freeze protects streak | `user_id`, `freeze_balance`, `reason`, `timestamp` | Recovery signal |
| `streak_reset` | Streak ends after missed window | `user_id`, `previous_streak_count`, `days_missed`, `timestamp` | Churn risk signal |
| `reward_claimed` | Learner claims reward/shop item | `user_id`, `reward_id`, `reward_type`, `fucoin_cost`, `source`, `timestamp` | Motivation signal only |
| `reward_viewed` | Learner views reward/shop surface | `user_id`, `surface`, `timestamp` | Engagement diagnostic |
| `return_session_started` | Learner returns after inactive period | `user_id`, `days_since_last_meaningful_action`, `source`, `timestamp` | Lifecycle trigger input |

## Derived Cohort Fields

| Field | Logic |
| --- | --- |
| `activation_date` | Date of first `activation_completed` |
| `retention_day` | Calendar day difference from activation date |
| `d1_retained` | At least one `meaningful_action_completed` on activation date + 1 |
| `d7_retained` | At least one `meaningful_action_completed` during days 1-7 |
| `d30_retained` | At least one `meaningful_action_completed` during days 1-30 |
| `mission_completion_rate` | `mission_completed / mission_started` |
| `mission_return_rate` | Mission completers who complete a meaningful action in next retention window |
| `streak_recovery_rate` | Freeze or recovery mission users who return to meaningful action within 7 days |
| `reward_only_engagement_rate` | Reward/shop activity without meaningful action in same or next session |

## Retention Dashboard Outline

The first retention dashboard should show:

- Activated learner cohorts by activation week.
- D1, D7, and D30 learner retention.
- Weekly progress retention over consecutive 7-day windows.
- Mission viewed -> started -> completed funnel.
- Mission completion by mission type and CEFR level.
- Streak distribution and streak recovery usage.
- Reward viewed/claimed rate and reward-only engagement rate.
- Retention split by weekly progress reached vs not reached.
- Retention split by action mix: vocabulary/SRS, skill practice, exam, AI-capped feedback.

## Growth Interpretation

| Pattern | Interpretation | Recommended action |
| --- | --- | --- |
| D1 low after activation | First session may not create a strong return reason | Improve next-day mission and lifecycle reminder |
| D7 low but D1 healthy | Habit loop is not forming | Tune weekly progress missions and streak recovery |
| Mission completion high, retention low | Missions may be too shallow or repetitive | Connect missions to next skill progression |
| Streak resets correlate with churn | Streak pressure may be discouraging | Improve freeze, soft restart, and recovery copy |
| Reward claims high, progress low | Rewards may be decorative | Reprice or relink rewards to meaningful actions |
| AI-heavy users retain but non-AI progress low | Coach may entertain more than teach | Push AI users into concrete practice completion |

## Event Quality Checks

| Check | Expected threshold |
| --- | --- |
| `activation_completed` missing for activated learners | Investigate if above 5% |
| `meaningful_action_completed` missing stable user id | Exclude; investigate if above 2% |
| Duplicate `mission_completed` for same mission/session | Deduplicate to first completion |
| `streak_advanced` without meaningful action | Should be 0 |
| `reward_claimed` counted as meaningful progress | Should be 0 |
| Teacher/admin included in retention cohorts | Should be 0 |
| D1/D7/D30 based on page view only | Should be 0 |

## Privacy Boundaries

Do not collect raw:

- Writing submissions.
- Speaking transcripts or audio.
- AI chat messages.
- Free-text learner answers.
- Provider request/response bodies.
- Sensitive lifecycle message content.

Allowed metadata:

- User id or pseudonymous stable id.
- Role, cohort date, level, target exam, action type, mission type, reward type, streak count, timing, source, completion status, coarse error category.

## Lifecycle Measurement Hooks

Lifecycle campaigns are not implemented in this phase, but future reminders should be measurable with:

| Event | Required properties |
| --- | --- |
| `lifecycle_message_sent` | `user_id`, `campaign_id`, `channel`, `trigger_type`, `timestamp` |
| `lifecycle_message_opened` | `user_id`, `campaign_id`, `channel`, `timestamp` |
| `lifecycle_message_clicked` | `user_id`, `campaign_id`, `destination`, `timestamp` |
| `lifecycle_return_completed` | `user_id`, `campaign_id`, `action_type`, `hours_to_return`, `timestamp` |

Growth guardrail: lifecycle messaging must not promise official exam outcomes or pressure learners with shame-based copy.

## Acceptance Criteria

Phase 32 is accepted when:

- D1/D7/D30 retention metrics have anchor event, numerator, denominator, filters, and windows.
- Mission, streak, reward, and weekly progress events are defined.
- Reward-only engagement is separated from learning progress.
- Dashboard outline and growth interpretation are actionable.
- Privacy-sensitive content is excluded.
- Event quality checks prevent misleading retention reporting.

## Residual Risks

| Risk | Mitigation |
| --- | --- |
| Retention may be inflated by page views | Use meaningful action completion as retention truth |
| Reward activity may masquerade as learning | Track reward-only engagement separately |
| Lifecycle campaigns may overclaim | Require education-claim guardrails |
| Missing activation event may block cohorting | Use first meaningful action fallback and flag data quality gap |

## Next Planned Step: Backlog Closure Review

All Phase 19 backlog items are now mapped to complete phases. The next operating step should be a closure review:

1. Route through Operations Manager with Project Manager / Delivery Manager and Product Manager EdTech support.
2. Confirm Phase 20-32 completion status.
3. Confirm no open `P19-*` items remain.
4. Decide the next implementation cycle from the completed specs.
