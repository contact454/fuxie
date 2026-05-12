# Phase 4: 30/60/90 Execution Plan Refresh

Date: 2026-05-12

## Role-Gate Compliance

Vai chinh: Project Manager / Delivery Manager
Vai phoi hop: Product Manager EdTech, CTO / Tech Lead, QA Automation Engineer

This Phase 4 execution planning pass was started under the mandatory role-gate workflow:

- `task-startup-checklist.md` was read.
- `task-role-router.md` was read.
- The Project Manager / Delivery Manager, Product Manager EdTech, CTO / Tech Lead, and QA Automation Engineer profiles were read.
- The task domain is delivery planning, milestone sequencing, dependency tracking, and release readiness.
- Phase 4 does not implement runtime product features while Phase 2 P0 blockers remain open.

## Phase Objective

Phase 4 refreshes the 30/60/90 execution plan after Phase 3 repositioning. The goal is to translate Fuxie's new product direction into sequenced work with owners, dependencies, acceptance criteria, and release gates.

Phase 4 does not replace Phase 2 stabilization. It creates a delivery map so the team can start cleanly once P0 blockers are closed or explicitly accepted by CTO + Operations.

## Execution Principles

- One primary growth motion: B2C Vietnamese self-study German learners.
- One North Star: weekly meaningful CEFR progress.
- Three product pillars: Learn, Coach, Motivate.
- Teacher/admin remains supporting scope and future B2B channel.
- No release candidate while unresolved P0 risks block baseline acceptance.
- Every milestone must have one accountable owner and one measurable acceptance signal.

## Release Guardrails From Phase 2

| Risk | Current status | Delivery impact | Owner | Release requirement |
| --- | --- | --- | --- | --- |
| R-003 Redis/service readiness | Open | Blocks reliable full local smoke | DevOps / Cloud Engineer | `pnpm env:audit:services` clears Redis warning or CTO accepts alternate service config |
| R-004 role smoke blocked | Open | Blocks learner/teacher/admin confidence | QA Automation Engineer | `pnpm smoke:full-local` result captured or explicit blocker plan accepted |
| R-005 Prisma generate failing | Open | Blocks clean DB/client baseline confidence | Backend Engineer | `pnpm db:generate` passes with no unexpected tracked changes |
| Generated `sw.js` decision | Open before release | Blocks clean release slice | CTO / Tech Lead | Regenerate from clean build or restore by policy |
| Runtime UI dirty files | Open before release | Blocks UI change acceptance | Frontend Engineer + Product Designer | Intent/risk audit completed and release grouping approved |

## Milestone Map

| Window | Milestone | Primary owner | Support roles | Dependency | Acceptance signal |
| --- | --- | --- | --- | --- | --- |
| Days 22-30 | Baseline acceptance readiness | Project Manager / Delivery Manager | CTO / Tech Lead, QA Automation Engineer | Phase 2 P0 blockers | P0 status is closed, downgraded, or explicitly accepted |
| Days 22-30 | Learner activation PRD | Product Manager EdTech | Product Designer, Data / Analytics Engineer | Phase 3 positioning | PRD defines target user, first meaningful action, metrics, and non-goals |
| Days 22-30 | Onboarding/dashboard UX spec | Product Designer | Product Manager EdTech, Frontend Engineer | Learner activation PRD | Primary CTA, progress signal, and mobile behavior are specified |
| Days 22-30 | AI coach brief and eval plan | AI / LLM Engineer | Product Manager EdTech, German Academic Lead | Phase 3 AI coach scope | Eval cases, fallback behavior, and cost metrics are defined |
| Days 22-30 | Motivation loop brief | Gamification Designer | Product Manager EdTech, Product Designer | Phase 3 Motivate pillar | Missions/rewards/mascot map to study actions |
| Days 31-45 | Learning core implementation slice 1 | Full-stack Engineer | QA Automation Engineer, Product Designer | Baseline acceptance | Onboarding/dashboard slice passes focused QA |
| Days 31-45 | AI feedback evaluation slice | AI / LLM Engineer | QA Automation Engineer, German Academic Lead | AI eval plan | Initial writing/speaking eval report exists |
| Days 46-60 | Teacher/admin support confidence | Product Manager EdTech | QA Automation Engineer, CTO / Tech Lead | Role smoke readiness | Teacher/admin support scope and smoke results documented |
| Days 61-75 | Beta cohort preparation | Growth Lead | Product Manager EdTech, Data / Analytics Engineer | Activation metrics defined | Cohort source, size target, onboarding plan, and instrumentation are ready |
| Days 76-90 | Beta release candidate | CTO / Tech Lead | QA Automation Engineer, Project Manager / Delivery Manager | Stable baseline and beta scope | Release checklist signed off |

## Days 22-30 Detailed Plan

| Work item | Owner | Output | Acceptance criteria | Blocker handling |
| --- | --- | --- | --- | --- |
| Close or accept R-003 | DevOps / Cloud Engineer | Service readiness note | Redis warning cleared or alternate config accepted | Escalate to CTO if local Redis remains unavailable |
| Close or accept R-004 | QA Automation Engineer | Full local smoke result | Learner, teacher, admin, AI health, and DB health status captured | If blocked, document exact missing service and owner |
| Close or accept R-005 | Backend Engineer | Prisma generate result | `pnpm db:generate` passes with no unexpected tracked changes | Escalate Windows file lock/process issue to CTO |
| Decide `sw.js` policy | CTO / Tech Lead | Generated artifact decision | Keep/regenerate/restore path recorded before release slice | Do not hand-edit generated file |
| Audit runtime UI dirty files | Frontend Engineer + Product Designer | UI diff audit | Intent, UX risk, and release grouping are explicit | Do not modify files during audit unless approved |
| Learner activation PRD | Product Manager EdTech | PRD | First meaningful action, success metric, edge cases, non-goals | Feature work waits for baseline acceptance |
| Onboarding/dashboard UX spec | Product Designer | UX spec | Next action and progress hierarchy are clear | Uses PRD as input |
| AI coach eval plan | AI / LLM Engineer | Eval plan | A1/A2/B1/B2 cases, Vietnamese learner mistakes, cost/fallback rules | Provider smoke remains separate |

## Days 31-60 Delivery Plan

| Theme | Deliverable | Owner | Acceptance criteria | Release gate |
| --- | --- | --- | --- | --- |
| Learner onboarding | Level, goal, exam target, and daily time flow | Product Manager EdTech | Learner profile data needed for daily path is captured or inferred | Focused tests and learner smoke |
| Daily dashboard | Next best study action and progress signal | Product Designer | Learner can tell what to do now within one screen | Responsive design QA and route smoke |
| AI writing feedback | Rubric, correction, explanation, retry path | AI / LLM Engineer | Eval set shows useful, level-appropriate feedback | AI eval report and cost check |
| Speaking practice | Permission-safe recording/fallback flow | Speech / Audio Engineer | Browser/provider failure modes are documented | Audio/provider smoke |
| Content QA pipeline | Blocking rules and semantic spot-check workflow | Content QA / Linguistic Reviewer | Content release blockers are explicit by severity | `pnpm qa:content` and manual spot-check signoff |
| Teacher/admin confidence | Support workflow and analytics smoke | QA Automation Engineer | Teacher/admin workflows are bounded and verified | Authenticated smoke result |

## Days 61-90 Delivery Plan

| Theme | Deliverable | Owner | Acceptance criteria | Release gate |
| --- | --- | --- | --- | --- |
| Beta cohort | First measured learner cohort | Growth Lead | Cohort source, size target, onboarding plan, and owner are approved | CEO approval |
| Retention instrumentation | D1/D7/D30, weekly meaningful progress, mission completion | Data / Analytics Engineer | Metrics definitions and event map are documented | Analytics QA |
| Motivation loop | Missions, streak, rewards, mascot tied to study actions | Gamification Designer | Reward interactions require or reinforce learning actions | Product and QA signoff |
| AI/content quality dashboard | AI usefulness, eval pass, content issue severity | Data / Analytics Engineer | Quality status visible for beta review | Dashboard/report signoff |
| Conversion readiness | Pricing or lead-capture assumption | CEO / General Manager | Business model assumption is explicit and measurable | CEO approval |
| Beta release candidate | Release package | CTO / Tech Lead | All required gates pass and P0 risks are closed/accepted | Release checklist signed off |

## Release Checklist

No beta release candidate can be cut unless:

- Working tree groups are classified and approved.
- Runtime UI dirty files are accepted, split, or removed by owner decision.
- `apps/web/public/sw.js` has an explicit keep/regenerate/restore decision.
- `pnpm db:generate` passes or CTO accepts a documented alternate.
- `pnpm env:audit` passes.
- `pnpm env:audit:services` has no unaccepted service warnings.
- `pnpm smoke:full-local` result is captured or explicitly accepted as blocked.
- `pnpm check:quick`, `pnpm test:core`, `pnpm qa:content`, `pnpm security:secrets`, and `pnpm build` are current for the release slice.
- Learn, Coach, and Motivate scope is approved by Product Manager EdTech.
- QA Automation Engineer states residual release risk.

## Delivery Cadence

| Cadence | Purpose | Owner | Output |
| --- | --- | --- | --- |
| Daily until P0 closure | P0 blocker review | Project Manager / Delivery Manager | Owner, next action, acceptance signal updated |
| Twice weekly during Days 22-60 | Product/engineering sync | Product Manager EdTech + CTO / Tech Lead | Scope and dependency decisions |
| Weekly during Days 31-90 | Roadmap and beta readiness review | CEO / General Manager | Priority and resource decisions |
| Before every release slice | Release gate review | QA Automation Engineer | Pass/fail/blocked report |

## Phase 4 Acceptance Criteria

Phase 4 is complete when:

- The 30/60/90 plan reflects the Phase 3 positioning.
- Every milestone has an owner, dependency, and acceptance signal.
- Phase 2 P0 blockers are represented as release guardrails.
- Days 22-30 work is limited to baseline closure and implementation-ready planning.
- Days 31-60 and Days 61-90 have clear deliverables and gates.
- The next phase can start with a concrete backlog instead of broad strategy.

## Next Planned Step: Phase 5 Implementation-Ready Backlog

After Phase 4, create the first implementation-ready backlog:

1. Baseline blocker backlog: R-003, R-004, R-005, `sw.js`, runtime UI audit.
2. Product requirements backlog: learner activation PRD, onboarding/dashboard UX, AI coach eval, motivation loop.
3. QA/release backlog: smoke readiness, gate rerun policy, release checklist.
4. Assign every backlog item to one primary role and one acceptance signal.
