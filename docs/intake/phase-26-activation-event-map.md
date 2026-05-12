# Phase 26: Activation Event Map

Date: 2026-05-12

## Role-Gate Compliance

Vai chinh: Data / Analytics Engineer
Vai phoi hop: Product Manager EdTech, Frontend Engineer

This Phase 26 event map was started under the mandatory role-gate workflow:

- `task-startup-checklist.md` was read.
- `task-role-router.md` was read.
- The Data / Analytics Engineer, Product Manager EdTech, and Frontend Engineer profiles were read.
- The task domain is event design, metric definition, privacy boundary, and data quality planning.

## Objective

Define the activation event map needed to measure the Phase 23 activation metric:

```text
Activated learner = completes onboarding and completes one meaningful study action within 24 hours.
```

This is a measurement spec only. It does not implement analytics code.

## Metric Definition

| Field | Definition |
| --- | --- |
| Metric name | Learner activation rate |
| Numerator | New B2C learners who complete onboarding and complete one meaningful study action within 24 hours |
| Denominator | New B2C learner accounts that reach onboarding |
| Window | 24 hours from `onboarding_started` or registration timestamp if onboarding start is unavailable |
| Cohorts | Daily and weekly signup cohorts |
| Exclusions | Teacher/admin roles, test/dev accounts where identifiable, duplicate anonymous sessions |
| Reporting grain | User-day and cohort-week |

Supporting metrics:

- Onboarding start rate.
- Onboarding completion rate.
- Dashboard next-action view rate.
- Dashboard next-action click-through rate.
- Meaningful action start rate.
- Meaningful action completion rate.
- Median time to activation.
- Day 1 return after activation.

## Event Naming Convention

Use lower snake case:

```text
<surface>_<object>_<verb>
```

Examples:

- `onboarding_started`
- `dashboard_next_action_clicked`
- `meaningful_action_completed`

Event names should describe learner behavior, not implementation internals.

## Core Event Map

| Event | Trigger | Required properties | Notes |
| --- | --- | --- | --- |
| `onboarding_started` | Learner enters onboarding | `user_id`, `role`, `source`, `timestamp` | First denominator signal |
| `onboarding_goal_selected` | Learner selects goal/exam/target level | `user_id`, `goal_type`, `target_level`, `target_exam`, `timestamp` | Do not require exam |
| `onboarding_daily_time_selected` | Learner selects daily time | `user_id`, `daily_study_minutes`, `timestamp` | Future field if not persisted yet |
| `placement_started` | Placement test begins | `user_id`, `question_count_target`, `timestamp` | Optional support event |
| `placement_completed` | Placement result calculated | `user_id`, `estimated_level`, `answered_count`, `timestamp` | No raw answer content |
| `onboarding_completed` | Profile save succeeds | `user_id`, `estimated_level`, `target_level`, `target_exam`, `daily_study_minutes`, `timestamp` | Activation prerequisite |
| `onboarding_save_failed` | Profile save fails | `user_id`, `error_category`, `timestamp` | No stack traces or secrets |
| `dashboard_next_action_viewed` | Dashboard primary recommendation renders | `user_id`, `action_id`, `action_type`, `level`, `skill`, `source`, `estimated_minutes`, `timestamp` | First dashboard handoff signal |
| `dashboard_next_action_clicked` | Learner clicks primary CTA | `user_id`, `action_id`, `action_type`, `level`, `skill`, `source`, `timestamp` | Maps to existing `MeasuredLink` flows |
| `dashboard_secondary_action_clicked` | Learner clicks secondary action | `user_id`, `action_id`, `action_type`, `source`, `timestamp` | Support metric only |
| `meaningful_action_started` | Study action begins | `user_id`, `action_id`, `action_type`, `level`, `skill`, `source`, `timestamp` | Normalizes cross-surface starts |
| `meaningful_action_completed` | Study action reaches completion criteria | `user_id`, `action_id`, `action_type`, `level`, `skill`, `duration_seconds`, `xp_awarded`, `timestamp` | Activation completion input |
| `activation_completed` | System derives onboarding + completion within 24h | `user_id`, `activation_action_type`, `hours_to_activation`, `cohort_date`, `timestamp` | Derived event or model output |

## Meaningful Action Completion Rules

| Action type | Completion signal |
| --- | --- |
| `srs_review` | Review session completes at least one card batch or configured minimum |
| `vocabulary_practice` | Theme practice opens and learner completes a practice/review unit |
| `reading_task` | Reading exercise submitted or completed |
| `listening_task` | Listening lesson submitted or completed |
| `writing_submission` | Writing answer submitted and feedback shown |
| `speaking_submission` | Speaking attempt submitted or fallback task completed |
| `exam_practice` | Exam-style task submitted |
| `ai_feedback_loop` | AI tutor gives feedback after learner prompt/action; fallback only, not preferred default |

Completion should represent learning effort, not a page view.

## Standard Properties

All activation events should include:

| Property | Type | Rule |
| --- | --- | --- |
| `user_id` | string | Authenticated user id or stable pseudonymous id |
| `role` | string | Learner/teacher/admin where available |
| `timestamp` | ISO datetime | Server timestamp preferred |
| `session_id` | string | Optional but recommended |
| `locale` | string | `vi`, `de`, or current app locale where available |
| `level` | CEFR enum | A1-C2 when relevant |
| `skill` | enum | vocabulary, review, reading, listening, writing, speaking, exam, tutor |
| `source` | string | UI surface such as `onboarding`, `dashboard`, `mission`, `quick_action` |

## Privacy Boundaries

Do not collect:

- Raw writing answers.
- Raw speaking transcripts/audio.
- Raw AI chat messages.
- German/Vietnamese free-text learner submissions.
- Provider secrets, stack traces, or auth tokens.

Allowed metadata:

- Level, skill, action type, route/surface, timing, completion status, reward amount, and coarse error category.

## Existing Instrumentation Hooks

The repo already uses `MeasuredLink` with `flow` and `source` on several learner surfaces, including dashboard primary/secondary quest links. Phase 26 maps those UI hooks to analytics concepts but does not implement a new analytics SDK.

Recommended mapping:

| Existing hook | Analytics interpretation |
| --- | --- |
| `dashboard.quest.primary` | `dashboard_next_action_clicked` |
| `dashboard.quest.card.primary` | Primary action card engagement |
| `dashboard.quest.card.secondary` | `dashboard_secondary_action_clicked` |
| `dashboard.quick_action` | Secondary dashboard navigation |
| `vocabulary.practice.theme` | Meaningful action start candidate |

## Data Quality Checks

| Check | Expected threshold |
| --- | --- |
| `onboarding_completed` without `onboarding_started` | Investigate if above 5% |
| `dashboard_next_action_clicked` without viewed event | Investigate if above 10% |
| `meaningful_action_completed` without started event | Investigate by action type |
| Duplicate `activation_completed` per user | Should be deduplicated to first activation |
| Missing `level` for meaningful actions | Investigate if above 5% |
| Teacher/admin included in learner activation | Should be excluded |

## Dashboard Outline

Activation dashboard should show:

- New learners reaching onboarding.
- Onboarding completion rate.
- Next-action view and click-through rate.
- First meaningful action completion rate.
- Activation rate within 24 hours.
- Median time to activation.
- Activation split by current level, target level, goal type, and action type.
- Day 1 return for activated vs non-activated learners.

## Implementation Dependencies

| Dependency | Owner | Notes |
| --- | --- | --- |
| Event transport / analytics SDK decision | CTO / Tech Lead + Data / Analytics Engineer | Choose existing or lightweight internal logging path |
| Profile fields for goal/time | Product Manager EdTech + Backend Engineer | Needed if goal type and daily time are persisted |
| Frontend event emit points | Frontend Engineer | Onboarding, dashboard, and action surfaces |
| Server-side completion derivation | Backend Engineer + Data / Analytics Engineer | Avoid client-only activation truth where possible |

## Acceptance Criteria

Phase 26 is accepted when:

- Activation metric has numerator, denominator, filters, timeframe, and cohort grain.
- Core events and required properties are listed.
- Meaningful action completion rules are defined.
- Privacy-sensitive fields are explicitly excluded.
- Data quality checks and dashboard outline are defined.
- Implementation owners and dependencies are named.

## Next Planned Step: Phase 27 Learner Activation Test Plan

Phase 27 should handle `P19-B4`:

1. Route through QA Automation Engineer with Product Manager EdTech and Frontend Engineer support.
2. Define tests for onboarding, dashboard next action, activation happy path, empty states, mobile behavior, and failure states.
3. Use Phase 23-26 documents as inputs.
