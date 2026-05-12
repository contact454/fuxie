# Phase 19: Post-Merge Product / Engineering Backlog Kickoff

Date: 2026-05-12

## Role-Gate Compliance

Vai chinh: Product Manager EdTech
Vai phoi hop: Project Manager / Delivery Manager, CTO / Tech Lead, Frontend Engineer

This Phase 19 pass was started under the mandatory role-gate workflow:

- `task-startup-checklist.md` was read.
- `task-role-router.md` was read.
- The Product Manager EdTech, Project Manager / Delivery Manager, CTO / Tech Lead, and Frontend Engineer profiles were read.
- The task domain is product backlog kickoff, post-merge sequencing, owner assignment, and acceptance criteria.

## Phase Objective

Phase 19 converts the merged baseline RC package into the next executable backlog. The goal is to start product and engineering work without losing the governance discipline established during intake.

The baseline is now on `master`, so the next cycle can move from intake/stabilization into measured implementation.

## Current Starting Point

| Area | Status |
| --- | --- |
| Baseline RC package | Merged into `master` |
| Master CI | Passing after post-merge verification |
| Working tree | Clean at Phase 18 verification |
| Remaining blocker class | No known P0 blocker from RC handoff |
| Remaining known follow-ups | P2 product/UI polish and P1 product planning |

## Product Direction For Next Cycle

Primary product focus remains:

```text
Vietnamese self-study German learners first.
```

The next cycle should improve the first meaningful learner journey:

1. Understand learner level, goal, exam target, and daily study time.
2. Show one clear next best study action.
3. Let the learner complete a meaningful study action.
4. Give feedback, reward, and progress signal.
5. Measure whether the learner repeats meaningful progress during the week.

## Kickoff Backlog

### Track A: Immediate P2 Polish

| ID | Priority | Work item | Primary owner | Support roles | Acceptance criteria |
| --- | --- | --- | --- | --- | --- |
| P19-A1 | P2 | Add learner-facing error feedback for vocabulary CTA failure | Frontend Engineer | Product Designer, QA Automation Engineer | Complete in Phase 20; if `/api/v1/srs/cards` fails, learner sees a clear retryable message; no console-only failure |
| P19-A2 | P2 | Review dashboard mascot image priority | Frontend Engineer | Product Designer, CTO / Tech Lead | Complete in Phase 21; above-the-fold mascot LCP warning is resolved or explicitly accepted with reason |
| P19-A3 | P2 | Add GitHub Actions Node 20 deprecation follow-up | DevOps / Cloud Engineer | CTO / Tech Lead, QA Automation Engineer | CI action versions or runner settings have an owner decision before GitHub's Node 24 default change |

### Track B: Learner Activation Core

| ID | Priority | Work item | Primary owner | Support roles | Acceptance criteria |
| --- | --- | --- | --- | --- | --- |
| P19-B1 | P1 | Learner activation PRD | Product Manager EdTech | Product Designer, Data / Analytics Engineer | Defines first meaningful study action, target learner, metric, non-goals, and edge cases |
| P19-B2 | P1 | Onboarding UX spec | Product Designer | Product Manager EdTech, Frontend Engineer | Specifies level, goal, exam target, daily time, empty state, mobile behavior, and error states |
| P19-B3 | P1 | Daily dashboard next-action spec | Product Designer | Product Manager EdTech, Frontend Engineer | Dashboard answers "what should I study now?" with clear progress and CTA hierarchy |
| P19-B4 | P1 | Learner activation test plan | QA Automation Engineer | Product Manager EdTech, Frontend Engineer | Covers happy path, auth, empty state, mobile, failure, and regression risk |

### Track C: Coach And Measurement

| ID | Priority | Work item | Primary owner | Support roles | Acceptance criteria |
| --- | --- | --- | --- | --- | --- |
| P19-C1 | P1 | AI coach product brief | Product Manager EdTech | AI / LLM Engineer, German Academic Lead | Defines tutor, writing, speaking, grading, fallback, scope boundaries, and non-goals |
| P19-C2 | P1 | AI eval plan | AI / LLM Engineer | QA Automation Engineer, German Academic Lead | Defines eval cases for A1/A2/B1/B2, Vietnamese learner mistakes, cost, latency, and provider failure |
| P19-C3 | P1 | Weekly meaningful CEFR progress metric spec | Data / Analytics Engineer | Product Manager EdTech | Defines events, learner scope, reporting window, and success threshold |
| P19-C4 | P1 | Activation event map | Data / Analytics Engineer | Product Manager EdTech, Frontend Engineer | Maps onboarding, first meaningful study action, dashboard CTA, and completion events |

### Track D: Motivation Loop

| ID | Priority | Work item | Primary owner | Support roles | Acceptance criteria |
| --- | --- | --- | --- | --- | --- |
| P19-D1 | P1 | Motivation loop brief | Gamification Designer | Product Manager EdTech, Product Designer | Missions, XP, streak, Fucoin, rewards, and mascot moments map to real study actions |
| P19-D2 | P2 | Retention event map | Data / Analytics Engineer | Growth Lead, Gamification Designer | D1/D7/D30, mission completion, streak, and reward events are defined |

## Recommended Sequencing

| Sequence | Work | Reason |
| --- | --- | --- |
| 1 | P19-A1, P19-A2, P19-A3 | Close known residual polish and CI hygiene while context is fresh |
| 2 | P19-B1 | Product anchor for all learner activation work |
| 3 | P19-B2, P19-B3, P19-C3, P19-C4 | Convert product intent into UX and measurement |
| 4 | P19-B4 | QA plan follows concrete PRD/specs |
| 5 | P19-C1, P19-C2 | AI coach scope and eval must be clear before stronger AI claims |
| 6 | P19-D1, P19-D2 | Motivation loop follows activation and measurement definitions |

## Definition Of Ready For Each Next Task

Before any item above starts:

- Mandatory Role-Gate is rerun.
- One primary role owns the work.
- Acceptance criteria are copied into the task.
- Files/commands/docs to touch are named.
- Test or review plan is stated.
- Scope explicitly says whether runtime code changes are allowed.

## Definition Of Done For This Backlog Cycle

This cycle is done when:

- P2 polish items are closed or intentionally deferred.
- Learner activation PRD is approved.
- Onboarding/dashboard UX specs are ready for implementation.
- Activation metrics and event map are ready.
- AI coach brief and eval plan are ready.
- Next implementation slice can be started with a clear owner and release gate.

## Immediate Next Task Recommendation

`P19-A1` was completed in Phase 20. Continue with `P19-A2`: review dashboard mascot image priority.

Recommended routing:

```text
Vai chinh: Frontend Engineer
Vai phoi hop: Product Designer, CTO / Tech Lead
```

Reason:

- It is a known residual P2 from Phase 10.
- It is small and localized.
- It addresses a focused Next.js image priority warning without changing product scope.
- It keeps shared mascot image priority opt-in instead of broad.

## Acceptance Status

| Criterion | Status |
| --- | --- |
| Post-merge backlog created | Pass |
| Owners assigned | Pass |
| P2 follow-ups carried forward | Pass |
| P1 learner activation path defined | Pass |
| Recommended next task selected | Pass |

## Next Planned Step: Phase 20 First Post-RC Polish Implementation

Phase 20 implements `P19-A1`:

1. Route through Frontend Engineer.
2. Inspect vocabulary CTA code.
3. Add learner-facing error feedback for `/api/v1/srs/cards` failure.
4. Add focused test or manual QA note.
5. Run affected checks.

Next planned step after Phase 20: Phase 21 should handle `P19-A2`, dashboard mascot image priority review.

## Phase 21 Status Update

Phase 21 implements `P19-A2`:

1. Route through Frontend Engineer.
2. Inspect dashboard mascot priority warning source.
3. Add opt-in `priority` forwarding to `FuxieCoach`.
4. Mark the dashboard streak-freeze coach mascot as priority when present.
5. Run affected checks.

Next planned step after Phase 21: Phase 22 should handle `P19-A3`, GitHub Actions Node 20 deprecation follow-up.
