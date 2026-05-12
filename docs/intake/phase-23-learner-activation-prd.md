# Phase 23: Learner Activation PRD

Date: 2026-05-12

## Role-Gate Compliance

Vai chinh: Product Manager EdTech
Vai phoi hop: Product Designer, Data / Analytics Engineer

This Phase 23 PRD was started under the mandatory role-gate workflow:

- `task-startup-checklist.md` was read.
- `task-role-router.md` was read.
- The Product Manager EdTech, Product Designer, and Data / Analytics Engineer profiles were read.
- The task domain is product requirements, learner journey definition, activation metrics, and acceptance criteria.

## Objective

Close `P19-B1`: define the learner activation PRD for Vietnamese self-study German learners.

This PRD is the product anchor for onboarding UX, dashboard next-action UX, activation event mapping, and activation QA.

## Target User

Primary user:

- Vietnamese learner studying German independently.
- Wants a clear daily path and confidence that the chosen action helps CEFR progress.
- May be learning for migration, work, study, or Goethe/Telc/OESD exam preparation.
- May not know their exact CEFR level.

Secondary user considerations:

- Exam-focused learner needs target exam and target level visible.
- Teacher/admin users are not the primary activation path in this slice.

## Problem

Fuxie has many learning surfaces: onboarding, dashboard, vocabulary, SRS review, reading, listening, writing, speaking, AI tutor, missions, rewards, teacher/admin. A new learner can finish registration but still not know the one study action to take next.

Activation must answer:

```text
What should I study now, and did it count as real German progress?
```

## Product Promise

After onboarding, Fuxie gives the learner one clear next study action tied to level, goal, and progress. When the learner completes that action, Fuxie shows feedback/reward/progress so the learner knows it counted.

## First Meaningful Study Action

The first meaningful study action is:

```text
Complete one level-appropriate learning action after onboarding and return to a progress/reward signal.
```

Preferred first action order:

1. Due SRS review if due cards exist.
2. Vocabulary practice for the learner's current CEFR level if no due review exists.
3. Reading/listening/writing/speaking starter task if a skill goal is explicit.
4. AI tutor guidance only as a fallback, not as the default activation action.

Meaningful action requirements:

- Tied to `currentLevel`, `targetLevel`, and optionally `targetExam`.
- Has a completion event or equivalent completion evidence.
- Gives learner-visible progress, feedback, XP/reward, or next-step confirmation.
- Can be repeated later as part of weekly meaningful CEFR progress.

## Current Product Starting Point

Existing surfaces already support parts of the activation journey:

| Surface | Current evidence | Product implication |
| --- | --- | --- |
| Registration | New user routes to onboarding | Activation can start immediately after account creation |
| Onboarding | Captures target exam, target level, placement result | Needs daily time and goal refinement later, but enough for first activation |
| Onboarding API | Saves estimated level, target level, target exam, onboarding completion | Profile data exists for dashboard personalization |
| Dashboard | Existing learner hub and mission/reward surfaces | Should expose one primary next action |
| Vocabulary/SRS | Vocabulary CTA and review flow exist | Good default first action candidate |

## User Journey

1. Learner registers or logs in.
2. If onboarding is incomplete, learner enters onboarding.
3. Learner selects target exam and target level.
4. Learner completes placement.
5. Fuxie saves estimated/current level and goal.
6. Dashboard presents one primary next action.
7. Learner completes the action.
8. Fuxie shows progress/reward/feedback and a next recommendation.

## Requirements

### Must Have

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| LA-001 | Onboarding result drives dashboard next action | Current CEFR level and goal are used to choose or label the first action |
| LA-002 | Dashboard has one primary next action | Learner sees one dominant CTA before secondary exploration |
| LA-003 | First action is meaningful | Action maps to SRS, vocab practice, skill task, writing/speaking submission, AI feedback loop, or exam practice |
| LA-004 | Completion is visible | Learner sees progress, reward, feedback, or completion confirmation |
| LA-005 | Activation is measurable | Event map can identify onboarding completion, first action started, first action completed, and time-to-complete |
| LA-006 | Empty states are useful | If no due review/content exists, learner gets a starter vocabulary or guided task |

### Should Have

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| LA-007 | Daily time is captured or inferred | Later UX spec includes daily time input or default assumption |
| LA-008 | Exam path is visible | Goethe/Telc/OESD learner sees exam relevance without replacing CEFR path |
| LA-009 | Mobile flow is first-class | Next action CTA and completion signal fit mobile viewport |
| LA-010 | AI tutor supports stuck moments | AI can explain next action or mistake, but does not replace the learning action |

### Not In Scope

- New monetization, subscription, pricing, or paywall behavior.
- New AI provider or autonomous curriculum generation.
- Teacher/admin activation.
- Large dashboard redesign before UX spec.
- Full analytics implementation before event map approval.

## Activation Metrics

Primary activation metric:

```text
Activated learner = completes onboarding and completes one meaningful study action within 24 hours.
```

Metric definition:

| Field | Definition |
| --- | --- |
| Numerator | Learners who complete onboarding and first meaningful study action within 24 hours |
| Denominator | New learner accounts that reach onboarding |
| Timeframe | Rolling daily and weekly cohorts |
| Filter | B2C learner role only; exclude teacher/admin/dev-test accounts where identifiable |
| Minimum evidence | Onboarding completion timestamp plus first meaningful action completion timestamp |

Supporting metrics:

- Onboarding completion rate.
- Dashboard next-action click-through rate.
- First action completion rate.
- Time from registration to first meaningful action.
- Day 1 return after activation.
- First week meaningful progress count.

## Event Inputs Needed

This PRD does not implement analytics, but Phase 24/Phase 26 must define or map events for:

| Event | Trigger |
| --- | --- |
| `onboarding_started` | Learner enters onboarding |
| `onboarding_completed` | Profile saves onboarding result |
| `dashboard_next_action_viewed` | Dashboard renders primary recommendation |
| `dashboard_next_action_clicked` | Learner clicks primary CTA |
| `meaningful_action_started` | Study action begins |
| `meaningful_action_completed` | Study action reaches completion criteria |
| `activation_completed` | Learner completes onboarding plus first meaningful action within 24 hours |

Privacy guardrail:

- Do not collect unnecessary free-text German/Vietnamese learner content in activation events.
- Store event metadata as level, skill, action type, source, and timing rather than raw learner submissions.

## Edge Cases

| Case | Expected behavior |
| --- | --- |
| Learner skips or fails onboarding save | Route to dashboard with safe default and prompt to retry profile setup |
| Placement estimates higher than target level | Explain the mismatch and recommend maintenance or target adjustment |
| No due review exists | Recommend current-level vocabulary starter or skill starter |
| Network/API failure on first action | Show learner-facing error and retry path |
| Learner is exam-focused | Label action with exam relevance where appropriate |
| Returning learner without events | Dashboard should still recommend one current-level action |

## Release Acceptance Criteria

Phase 23 PRD is accepted when:

- Target user and problem are explicit.
- First meaningful study action is defined.
- Must-have and non-goal scope are separated.
- Activation metric has numerator, denominator, timeframe, and filters.
- Event inputs are listed for Data / Analytics follow-up.
- UX and QA follow-up phases have clear dependencies.

## Dependencies

| Follow-up | Owner | Dependency |
| --- | --- | --- |
| Phase 24: Onboarding UX Spec | Product Designer | This PRD |
| Phase 25: Dashboard Next-Action UX Spec | Product Designer | This PRD |
| Phase 26: Activation Event Map | Data / Analytics Engineer | This PRD |
| Phase 27: Learner Activation Test Plan | QA Automation Engineer | UX specs and event map |

## Next Planned Step: Phase 24 Onboarding UX Spec

Phase 24 should handle `P19-B2`:

1. Route through Product Designer with Product Manager EdTech and Frontend Engineer support.
2. Specify onboarding screens for level, goal, exam target, daily time, placement result, error states, and mobile behavior.
3. Keep implementation out of scope until UX acceptance is clear.
