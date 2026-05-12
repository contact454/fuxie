# Phase 5: Implementation-Ready Backlog

Date: 2026-05-12

## Role-Gate Compliance

Vai chinh: Project Manager / Delivery Manager
Vai phoi hop: Product Manager EdTech, CTO / Tech Lead, QA Automation Engineer

This Phase 5 backlog pass was started under the mandatory role-gate workflow:

- `task-startup-checklist.md` was read.
- `task-role-router.md` was read.
- The Project Manager / Delivery Manager, Product Manager EdTech, CTO / Tech Lead, and QA Automation Engineer profiles were read.
- The task domain is backlog creation, sequencing, ownership, dependencies, and release readiness.
- Phase 5 creates implementation-ready work items but does not implement runtime product changes.

## Phase Objective

Phase 5 converts the Phase 4 delivery plan into the first implementation-ready backlog. Each backlog item must be assignable to one primary role, include support roles where needed, state dependencies, define acceptance criteria, and name the release or documentation gate required to close it.

## Backlog Rules

- Every backlog item has one primary owner.
- Support roles advise or unblock, but the primary owner is accountable.
- P0 baseline blockers must be handled before product feature implementation.
- Product requirement items can be drafted while P0 blockers remain open.
- Runtime code, schema, content JSON, deploy config, and generated artifacts are not changed by this backlog document.
- Each future task must rerun the mandatory Role-Gate before execution.

## Priority Definitions

| Priority | Meaning | Handling rule |
| --- | --- | --- |
| P0 | Blocks safe baseline, release confidence, data safety, or auth/smoke readiness | Resolve or explicitly accept before release candidate |
| P1 | Needed for implementation-ready product work or confident beta | Plan immediately after P0 stabilization path is clear |
| P2 | Useful for beta polish or operating maturity | Queue after P0/P1 capacity is protected |

## Backlog A: Baseline Blockers

| ID | Priority | Work item | Primary owner | Support roles | Dependency | Acceptance signal |
| --- | --- | --- | --- | --- | --- | --- |
| BL-001 | P0 | Restore Redis/service readiness | DevOps / Cloud Engineer | CTO / Tech Lead, QA Automation Engineer | Current env points Redis to `localhost:6380` | `pnpm env:audit:services` has no unaccepted Redis warning |
| BL-002 | P0 | Execute full local smoke | QA Automation Engineer | DevOps / Cloud Engineer, CTO / Tech Lead | Web, AI, DB, Redis, dev auth available | `pnpm smoke:full-local` result captured for learner, teacher, admin, AI health, and DB health |
| BL-003 | P0 | Clear Prisma generate blocker | Backend Engineer | CTO / Tech Lead | Windows EPERM rename on Prisma query engine DLL | `pnpm db:generate` passes with no unexpected tracked changes |
| BL-004 | P0 | Decide generated `sw.js` policy | CTO / Tech Lead | Project Manager / Delivery Manager | `apps/web/public/sw.js` changed during build | Keep/regenerate/restore decision recorded before release slice |
| BL-005 | P0 | Audit runtime UI dirty files | Frontend Engineer | Product Designer, Project Manager / Delivery Manager | Existing dirty dashboard/gamification/leaderboard/vocabulary files | Each file is accepted, split, held out, or escalated with owner decision |
| BL-006 | P0 | Baseline acceptance review | Project Manager / Delivery Manager | CTO / Tech Lead, QA Automation Engineer, Operations Manager | BL-001 through BL-005 status known | Baseline is accepted, conditionally accepted, or blocked with explicit owner next actions |

## Backlog B: Product Requirements

| ID | Priority | Work item | Primary owner | Support roles | Dependency | Acceptance signal |
| --- | --- | --- | --- | --- | --- | --- |
| PR-001 | P1 | Learner activation PRD | Product Manager EdTech | Product Designer, Data / Analytics Engineer | Phase 3 positioning | PRD defines first meaningful study action, target user, metric, non-goals, and edge cases |
| PR-002 | P1 | Onboarding UX spec | Product Designer | Product Manager EdTech, Frontend Engineer | PR-001 | Level, goal, exam target, daily time, empty state, and mobile behavior are specified |
| PR-003 | P1 | Daily dashboard UX spec | Product Designer | Product Manager EdTech, Frontend Engineer | PR-001 | Next best study action, progress signal, and primary CTA hierarchy are specified |
| PR-004 | P1 | AI coach product brief | Product Manager EdTech | AI / LLM Engineer, German Academic Lead | Phase 3 Coach pillar | Tutor, writing, speaking, grading, fallback, and scope boundaries are defined |
| PR-005 | P1 | AI eval plan | AI / LLM Engineer | QA Automation Engineer, German Academic Lead | PR-004 | Eval cases for A1/A2/B1/B2, Vietnamese learner mistakes, cost, latency, and failure cases are defined |
| PR-006 | P1 | Motivation loop brief | Gamification Designer | Product Manager EdTech, Product Designer | Phase 3 Motivate pillar | Missions, XP, streak, Fucoin, rewards, and mascot moments map to real study actions |
| PR-007 | P1 | Teacher/admin support brief | Product Manager EdTech | QA Automation Engineer, CTO / Tech Lead | Phase 3 teacher/admin scope | Support workflows are bounded and not competing with B2C learner priority |
| PR-008 | P2 | Beta cohort brief | Growth Lead | CEO / General Manager, Data / Analytics Engineer | PR-001 metrics | Cohort source, size target, onboarding path, and measurement owner are defined |

## Backlog C: QA And Release Readiness

| ID | Priority | Work item | Primary owner | Support roles | Dependency | Acceptance signal |
| --- | --- | --- | --- | --- | --- | --- |
| QA-001 | P0 | Gate currency policy | QA Automation Engineer | CTO / Tech Lead, Project Manager / Delivery Manager | Current Phase 1 gate evidence | Rule states when to rerun `check:quick`, `test:core`, `qa:content`, `security:secrets`, and `build` |
| QA-002 | P0 | Full local smoke checklist | QA Automation Engineer | DevOps / Cloud Engineer | BL-001 service readiness | Checklist covers web, AI, DB, Redis, dev auth, learner, teacher, admin |
| QA-003 | P1 | Learner activation test plan | QA Automation Engineer | Product Manager EdTech, Frontend Engineer | PR-001 through PR-003 | Test plan covers activation happy path, empty states, auth, and mobile risk |
| QA-004 | P1 | AI coach evaluation QA plan | QA Automation Engineer | AI / LLM Engineer, German Academic Lead | PR-004 and PR-005 | Eval execution and pass/fail reporting format are defined |
| QA-005 | P1 | Content QA release rule | Content QA / Linguistic Reviewer | German Academic Lead, QA Automation Engineer | Existing `pnpm qa:content` pass | Blocking severity rules and spot-check ownership are documented |
| QA-006 | P1 | Beta release checklist | QA Automation Engineer | CTO / Tech Lead, Project Manager / Delivery Manager | BL and PR status known | Checklist includes gates, smoke, P0 risk status, residual risk statement, and rollback owner |

## Backlog D: Data And Measurement

| ID | Priority | Work item | Primary owner | Support roles | Dependency | Acceptance signal |
| --- | --- | --- | --- | --- | --- | --- |
| DA-001 | P1 | Weekly meaningful CEFR progress metric spec | Data / Analytics Engineer | Product Manager EdTech | Phase 3 North Star | Metric definition covers event inputs, learner scope, and reporting window |
| DA-002 | P1 | Activation event map | Data / Analytics Engineer | Product Manager EdTech, Frontend Engineer | PR-001 | First meaningful study action and onboarding events are mapped |
| DA-003 | P2 | Retention event map | Data / Analytics Engineer | Growth Lead, Gamification Designer | PR-006 | D1/D7/D30, mission completion, streak, reward interaction events are mapped |
| DA-004 | P2 | AI cost and usefulness reporting spec | Data / Analytics Engineer | AI / LLM Engineer | PR-005 | Cost per active learner and feedback usefulness are measurable |

## Sequencing

Recommended sequence:

1. BL-001, BL-003, BL-004, BL-005 in parallel where owners are available.
2. BL-002 after Redis, web, AI, DB, and dev auth prerequisites are ready.
3. BL-006 after all baseline blocker statuses are known.
4. PR-001, PR-004, and PR-006 can proceed as documentation/planning while P0 blockers are being closed.
5. PR-002, PR-003, PR-005, PR-007 follow their parent briefs.
6. QA-001 and QA-002 proceed immediately because they support blocker closure.
7. QA-003 through QA-006 proceed after the relevant product requirements exist.
8. DA-001 and DA-002 proceed after PR-001, then DA-003 and DA-004 as beta planning matures.

## Definition Of Ready

A backlog item is ready for execution when:

- Role-Gate has been rerun for the specific task.
- One primary owner is named.
- Dependencies are available or explicitly marked blocked.
- Acceptance signal is measurable.
- Required files, commands, or docs are identified.
- Risk level is clear.
- The task states whether runtime code changes are allowed.

## Definition Of Done

A backlog item is done when:

- Acceptance signal is met or the blocker is explicitly accepted by the accountable owner.
- Evidence is written into the relevant intake document.
- `git status --short` is checked when commands or edits occur.
- Tests/gates are run when required, or skipped with reason.
- Any residual risk has an owner and next action.

## Phase 5 Acceptance Criteria

Phase 5 is complete when:

- Baseline blocker backlog exists.
- Product requirements backlog exists.
- QA/release backlog exists.
- Data/measurement backlog exists.
- Every item has primary owner, support roles, dependency, and acceptance signal.
- Sequencing is explicit.
- Future implementation tasks can be routed through `task-role-router.md` without ambiguity.

## Next Planned Step: Phase 6 First Backlog Execution

The first execution phase should start with the baseline blockers:

1. BL-001 Restore Redis/service readiness.
2. BL-003 Clear Prisma generate blocker.
3. BL-004 Decide generated `sw.js` policy.
4. BL-005 Audit runtime UI dirty files.
5. BL-002 Execute full local smoke once prerequisites are ready.

Product requirement drafting can run in parallel, but release work should wait for baseline acceptance.
