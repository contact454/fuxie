# Phase 30: Weekly Meaningful CEFR Progress Metric Spec

Date: 2026-05-12

## Role-Gate Compliance

Vai chinh: Data / Analytics Engineer
Vai phoi hop: Product Manager EdTech

This Phase 30 metric spec was started under the mandatory role-gate workflow:

- `task-startup-checklist.md` was read.
- `task-role-router.md` was read.
- The Data / Analytics Engineer and Product Manager EdTech profiles were read.
- The task domain is metric definition, event dependency, reporting window, learner scope, data quality, and privacy boundaries.

## Objective

Close `P19-C3`: define the weekly meaningful CEFR progress metric for Vietnamese self-study German learners.

This spec turns the Phase 3 North Star into a measurable product metric connected to activation events, AI coach actions, and non-AI study actions.

## Metric Name

```text
Weekly meaningful CEFR progress rate
```

## Product Question

```text
Are Vietnamese self-study learners repeating real German learning progress during the week, beyond just opening the app?
```

## Primary Metric Definition

| Field | Definition |
| --- | --- |
| Numerator | Active B2C learners who complete at least 3 meaningful CEFR progress actions in a rolling 7-day window |
| Denominator | Active B2C learners who have completed onboarding or started at least one meaningful action in the same 7-day window |
| Window | Rolling 7 days, reported daily and weekly |
| Cohort grain | Signup week, activation week, current CEFR level, target CEFR level, goal type, and target exam when available |
| Learner scope | B2C learner role only |
| Exclusions | Teacher/admin users, dev/test accounts where identifiable, duplicate accounts, events missing stable user id |
| Success threshold | Initial beta target: 25% of active onboarded learners reach 3 meaningful progress actions per week; revise after two beta cohorts |

## Meaningful CEFR Progress Action

A meaningful CEFR progress action is a completed learning action tied to level, skill, and learner goal.

| Action type | Counts toward metric | Completion signal |
| --- | --- | --- |
| `srs_review` | Yes | Review session completes configured card batch or minimum |
| `vocabulary_practice` | Yes | Learner completes a practice/review unit, not only opens theme |
| `reading_task` | Yes | Reading exercise submitted or completed |
| `listening_task` | Yes | Listening exercise submitted or completed |
| `writing_submission` | Yes | Writing answer submitted and feedback shown |
| `speaking_submission` | Yes | Speaking attempt submitted or fallback speaking task completed |
| `exam_practice` | Yes | Exam-style task submitted |
| `ai_feedback_loop` | Yes, capped | AI gives feedback after learner action and learner reaches retry/next-step state |
| `dashboard_next_action_clicked` | No | Engagement signal only; needs completion event |
| `page_view` | No | Not learning evidence |
| `reward_claimed` | No by itself | Motivation signal only; can join to completed action |

AI feedback loops count only when connected to a study action or a learner-submitted question about German learning. Generic open chat is excluded.

## Minimum Event Dependencies

| Event | Required properties | Role in metric |
| --- | --- | --- |
| `onboarding_completed` | `user_id`, `role`, `estimated_level`, `target_level`, `target_exam`, `timestamp` | Learner eligibility and cohort enrichment |
| `meaningful_action_started` | `user_id`, `action_id`, `action_type`, `level`, `skill`, `source`, `timestamp` | Funnel and data quality support |
| `meaningful_action_completed` | `user_id`, `action_id`, `action_type`, `level`, `skill`, `duration_seconds`, `xp_awarded`, `timestamp` | Primary metric input |
| `ai_feedback_completed` | `user_id`, `action_id`, `coach_surface`, `level`, `skill`, `feedback_type`, `timestamp` | AI action completion input when tied to learning |
| `activation_completed` | `user_id`, `activation_action_type`, `hours_to_activation`, `cohort_date`, `timestamp` | Cohort segmentation |

## Derived Fields

| Field | Logic |
| --- | --- |
| `progress_week_start` | Start date of the reporting 7-day window |
| `weekly_progress_action_count` | Count of qualifying completed actions per user in window |
| `weekly_progress_skill_count` | Distinct count of skills completed in window |
| `weekly_progress_level` | Most common level across qualifying actions, or current profile level if missing |
| `reached_weekly_progress` | `weekly_progress_action_count >= 3` |
| `ai_action_count_capped` | AI feedback loops count toward at most 1 of the 3 required actions |
| `non_ai_action_count` | Qualifying actions excluding AI feedback loops |

## Metric Formula

```text
weekly_meaningful_cefr_progress_rate =
  count(distinct user_id where reached_weekly_progress = true)
  /
  count(distinct eligible active B2C learner user_id)
```

Recommended companion metric:

```text
weekly_non_ai_progress_rate =
  count(distinct user_id where non_ai_action_count >= 2 and weekly_progress_action_count >= 3)
  /
  count(distinct eligible active B2C learner user_id)
```

The companion metric prevents AI chat usage from masking weak core learning behavior.

## Reporting Views

| View | Use |
| --- | --- |
| Overall weekly progress rate | North Star trend |
| By signup cohort | Measures product learning over cohorts |
| By activation status | Compares activated vs non-activated learners |
| By current CEFR level | Finds level-specific friction |
| By target exam | Checks exam-focused learner behavior |
| By action mix | Detects over-reliance on AI, vocabulary, or rewards |
| By source | Shows whether dashboard next action drives real completion |

## Data Quality Checks

| Check | Expected threshold |
| --- | --- |
| `meaningful_action_completed` missing `level` | Investigate if above 5% |
| `meaningful_action_completed` missing `skill` | Investigate if above 5% |
| Completed action without stable `user_id` | Exclude; investigate if above 2% |
| Duplicate completed action with same `action_id` in same session | Deduplicate to first completion |
| AI feedback action not tied to action or German learning intent | Exclude from primary metric |
| Teacher/admin included in denominator | Should be 0 |
| Reward-only activity counted as progress | Should be 0 |

## Privacy Boundaries

Do not include raw:

- Writing submissions.
- Speaking transcripts or audio.
- AI chat messages.
- Free-text learner answers.
- Provider request/response bodies.

Allowed metadata:

- User id or pseudonymous stable id.
- Role, level, target level, target exam, skill, action type, source, duration, completion status, reward amount, feedback type, coarse error category.

## Dashboard Outline

The first dashboard should show:

- Weekly meaningful CEFR progress rate.
- Eligible active learners.
- Median qualifying actions per learner.
- Distribution of 0, 1, 2, 3+ actions.
- Action mix: SRS, vocabulary, reading, listening, writing, speaking, exam, AI.
- AI-capped vs non-AI companion progress rate.
- Progress rate by current level and target exam.
- D1/D7 return split by reached vs not reached weekly progress.

## Product Interpretation

| Metric movement | Likely interpretation | Action |
| --- | --- | --- |
| Activation up, weekly progress flat | Learners start but do not repeat | Improve dashboard next action and mission loop |
| AI action mix high, non-AI progress low | Coach may be substituting for study | Tighten coach handoff to real actions |
| Vocabulary dominates, skill diversity low | Product may feel narrow | Add writing/speaking/reading next-action coverage |
| B1/B2 progress lower than A1/A2 | Advanced tasks may be too heavy | Review task length, feedback depth, and exam relevance |
| Reward claims up, progress flat | Motivation loop is decorative | Tie rewards more tightly to completed learning actions |

## Implementation Dependencies

| Dependency | Owner | Notes |
| --- | --- | --- |
| Meaningful action completion events | Frontend Engineer + Backend Engineer | Needed across learning surfaces |
| AI feedback completion event | AI / LLM Engineer + Data / Analytics Engineer | Must not log raw chat/submissions |
| Analytics transport and warehouse/model | CTO / Tech Lead + Data / Analytics Engineer | Required before dashboard |
| Test/dev account filtering | Backend Engineer + Data / Analytics Engineer | Prevents inflated beta metrics |
| Dashboard or report surface | Data / Analytics Engineer | Can start as BI/report before product UI |

## Acceptance Criteria

Phase 30 is accepted when:

- Numerator, denominator, filters, timeframe, and cohort grain are explicit.
- Meaningful action completion rules separate learning outcomes from engagement proxies.
- AI feedback is capped and cannot dominate the metric.
- Privacy-sensitive data is excluded.
- Data quality checks and dashboard outline are defined.
- Product interpretation connects metric movement to next decisions.

## Residual Risks

| Risk | Mitigation |
| --- | --- |
| Existing events may not yet capture all completion signals | Implementation slice must add instrumentation before dashboard claims |
| AI feedback may inflate progress | AI is capped to at most 1 of 3 required actions |
| Weekly target may be unrealistic early | Initial 25% beta threshold should be recalibrated after two cohorts |
| Missing level/skill metadata may reduce trust | Data quality checks flag missing values |

## Next Planned Step: Phase 31 Motivation Loop Brief

Phase 31 should handle `P19-D1`:

1. Route through Gamification Designer with Product Manager EdTech and Product Designer support.
2. Define missions, XP, streak, Fucoin, rewards, and mascot moments around real study actions.
3. Connect motivation mechanics to activation and weekly meaningful CEFR progress without encouraging empty engagement.
