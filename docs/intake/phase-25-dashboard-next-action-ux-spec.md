# Phase 25: Dashboard Next-Action UX Spec

Date: 2026-05-12

## Role-Gate Compliance

Vai chinh: Product Designer
Vai phoi hop: Product Manager EdTech, Frontend Engineer

This Phase 25 UX spec was started under the mandatory role-gate workflow:

- `task-startup-checklist.md` was read.
- `task-role-router.md` was read.
- The Product Designer, Product Manager EdTech, and Frontend Engineer profiles were read.
- The task domain is dashboard UX hierarchy, next-action interaction design, responsive behavior, and implementation-ready acceptance criteria.

## Objective

Close `P19-B3`: specify dashboard UX for the primary next action after onboarding.

This is a UX/spec phase only. It does not change runtime code.

## UX Goal

The dashboard should answer one question in the first viewport:

```text
What should I study now?
```

The answer must be a single dominant next action connected to the learner's current level, goal, daily time, and progress.

## Inputs

- Phase 23 Learner Activation PRD.
- Phase 24 Onboarding UX Spec.
- Existing dashboard surfaces: header, stats, content section, mission control, today plan quest section, streak-freeze coach, quick actions.

## Current Starting Point

The dashboard already has a `TodayPlanQuestSection` that can present a primary quest, coach copy, reward preview, goal progress, SRS review stats, and secondary quests.

UX risk:

- The dashboard has many motivating modules, so the first meaningful action must remain visually dominant.
- Secondary cards, missions, rewards, and shop access should support the primary action instead of competing with it.

## First Viewport Hierarchy

Recommended order:

1. Greeting and learner context.
2. Primary next-action panel.
3. Progress/reward confirmation supporting that action.
4. Secondary actions below the fold or visually quieter.

The primary next-action panel should contain:

| Element | UX requirement |
| --- | --- |
| Eyebrow | Short context: `Next best action`, `Ngày 1`, `Ôn tập đến hạn`, or exam-aware variant |
| Title | Concrete action, not a generic slogan |
| Reason | One sentence explaining why this action matters |
| Time | Estimated minutes based on plan/daily time |
| Reward | XP/Fucoin/streak/reward preview tied to completion |
| Primary CTA | One dominant button |
| Progress | Today's minutes or action progress |
| Coach | Fuxie tip reinforces why to do this now |

## Next-Action Priority Rules

Use the Phase 23 order:

1. Due SRS review if due cards exist.
2. Vocabulary practice for the learner's current CEFR level if no due review exists.
3. Reading/listening/writing/speaking starter task if a skill goal is explicit.
4. Exam practice if exam path is explicit and level-appropriate.
5. AI tutor orientation only as fallback.

UX copy rules:

- Say what to do, not just where to go.
- Mention level or goal when helpful.
- Avoid overpromising exam outcomes.
- Use Vietnamese learner-friendly copy.

## Screen States

### Fresh Start

When the learner has just completed onboarding or has no activity:

- Eyebrow: `Ngày 1`.
- Primary action: starter vocabulary or level-appropriate review.
- Coach copy explains this is the first small win.
- Progress starts at 0 but should not feel empty or punitive.

Acceptance criteria:

- Learner sees one clear CTA above secondary modules.
- Empty progress is framed as a beginning, not failure.

### Due Review

When SRS due count is greater than zero:

- Primary action should prioritize review.
- Copy references memory retention.
- Reward preview can mention streak/XP.

Acceptance criteria:

- Learner understands review is time-sensitive.
- The review CTA does not compete with vocabulary exploration CTA.

### No Due Review

When no due review exists:

- Recommend current-level vocabulary or skill starter.
- Show this as proactive progress, not "nothing to do."

Acceptance criteria:

- Dashboard still has a meaningful first action.
- Secondary actions are available but visually quieter.

### Exam-Focused Learner

When target exam exists:

- Keep CEFR daily action primary.
- Add exam relevance label where appropriate.
- Do not replace all daily learning with mock exam pressure.

Acceptance criteria:

- Exam path feels acknowledged.
- Daily CEFR progress remains the core habit.

### Completed Today

When primary action is completed:

- Show completion state.
- Offer a secondary next action.
- Highlight progress/reward already earned.

Acceptance criteria:

- Learner can stop with satisfaction or continue naturally.
- Completed state does not look broken or empty.

### Error / Unavailable Data

When dashboard data is missing or partially unavailable:

- Use safe default current-level action.
- Show inline recovery copy.
- Avoid blank panels.

Acceptance criteria:

- Learner always has a visible next action or recovery CTA.
- Error copy is actionable and not technical.

## Mobile Behavior

- Primary next-action panel appears before dense stats and secondary cards.
- CTA spans full width or has enough touch target area.
- Time/reward/progress metadata wraps cleanly.
- Mascot/coach visual must not push the CTA below a reasonable first viewport.
- Secondary quest cards become stacked and visually lighter.

## Desktop Behavior

- Primary next-action panel can use a two-column layout: action on left, coach/progress on right.
- Secondary cards sit below, not beside the main CTA when they dilute hierarchy.
- Header and stats should not bury the primary recommendation.

## Accessibility

- Primary CTA has unique, descriptive text.
- The primary action panel has a clear heading.
- Progress bars include readable text values.
- Error messages use alert semantics where appropriate.
- Link/button roles remain native and keyboard accessible.

## Instrumentation Hooks For Phase 26

UX elements should map cleanly to these analytics events:

| UX element | Event input |
| --- | --- |
| Primary next-action panel renders | `dashboard_next_action_viewed` |
| Primary CTA click | `dashboard_next_action_clicked` |
| Secondary action click | `dashboard_secondary_action_clicked` |
| Completion state shown | `meaningful_action_completed` or downstream completion event |
| Empty/error fallback shown | `dashboard_next_action_fallback_viewed` |

Do not put raw learner writing/speaking content into dashboard action events.

## Non-Goals

- No runtime implementation in this phase.
- No new recommendation algorithm.
- No new analytics SDK implementation.
- No redesign of every dashboard module.
- No teacher/admin dashboard changes.

## UX Acceptance Criteria

Phase 25 is accepted when:

- Dashboard first viewport hierarchy is specified.
- Primary next-action states are defined for fresh start, due review, no due review, exam focus, completed today, and data error.
- Mobile and desktop behavior are specified.
- Analytics handoff points are named for Phase 26.
- Secondary modules are explicitly subordinate to the primary action.

## Next Planned Step: Phase 26 Activation Event Map

Phase 26 should handle `P19-C4` or the activation event map dependency:

1. Route through Data / Analytics Engineer with Product Manager EdTech and Frontend Engineer support.
2. Map onboarding, dashboard next action, meaningful action start/completion, and activation completion events.
3. Define event properties, privacy boundaries, and data quality checks.
