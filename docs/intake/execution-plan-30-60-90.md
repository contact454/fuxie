# Fuxie 30/60/90-Day Execution Plan

Date: 2026-05-12

## Operating Principle

The first 30 days make Fuxie governable. The next 30 days improve the learning core. The following 30 days launch a measured beta motion.

Phase 4 refresh: the execution plan now follows the Phase 3 positioning. Fuxie prioritizes B2C Vietnamese self-study learners, measures weekly meaningful CEFR progress, and sequences work through Learn, Coach, and Motivate. Teacher/admin remains supporting scope and future B2B channel.

## Days 0-30: Intake And Stabilization

| Workstream | Outcome | Owner | Acceptance criteria |
| --- | --- | --- | --- |
| Handover control | All active repo changes and docs are classified | Project Manager / Delivery Manager | No unknown high-risk diff remains |
| Release gates | Minimum gate matrix has current pass/fail status | QA Automation Engineer | Typecheck, tests, content QA, secret audit, build status recorded |
| Technical baseline | Architecture, DB, AI, env, smoke status documented | CTO / Tech Lead | `technical-baseline-report.md` updated with current gate results |
| Risk control | P0 risks have owners and mitigations | Operations Manager | `risk-register.md` has no unowned P0 item |
| Product focus | North Star, target user, and first 90-day priorities approved | Product Manager EdTech | Roadmap has metrics and owner per milestone |
| Content quality | CEFR and content QA risks identified | German Academic Lead | A1/B2/C1/C2 spot-check and content QA status recorded |
| UX/game audit | Learner dashboard, onboarding, rewards, mascot use reviewed | Product Designer | UX priority list created |

## Days 15-21: Product Repositioning Insert

Phase 3 refines the product direction inside the first 30-day intake window. It does not unlock feature implementation while Phase 2 P0 blockers remain open.

| Workstream | Outcome | Owner | Acceptance criteria |
| --- | --- | --- | --- |
| Positioning | Fuxie is framed as an AI-powered German learning platform for Vietnamese learners | Product Manager EdTech | Primary segment, product promise, and non-goals are explicit |
| Learner journey | Onboarding, dashboard, study action, feedback, and review loop are mapped | Product Designer | Learner can identify what to do next and why it matters |
| AI coach | Tutor, writing, speaking, grading, fallback, eval, and cost scope are defined | AI / LLM Engineer | AI claims are tied to eval and cost constraints |
| Motivation loop | Missions, XP, streak, Fucoin, rewards, and mascot support real study actions | Product Designer | Game mechanics map to learning behavior |
| Roadmap guardrail | Phase 2 P0 blockers remain visible as release blockers | CEO / General Manager | No feature implementation starts before blocker closure or explicit acceptance |

## Days 22-30: Implementation-Ready Planning And Baseline Closure

| Workstream | Outcome | Owner | Dependency | Acceptance criteria |
| --- | --- | --- | --- | --- |
| P0 closure | R-003, R-004, and R-005 are closed, downgraded, or explicitly accepted | Project Manager / Delivery Manager | DevOps, QA, Backend/CTO follow-up | Each P0 has result, owner, next action, and acceptance signal |
| Generated artifact policy | `apps/web/public/sw.js` keep/regenerate/restore decision is recorded | CTO / Tech Lead | Clean build policy | Release slice has explicit artifact decision |
| Runtime UI audit | Dashboard, gamification, leaderboard, vocabulary diffs are classified by intent/risk | Frontend Engineer + Product Designer | Dirty working tree group | UI diffs are accepted, split, or held out |
| Learner activation PRD | First meaningful study action is specified | Product Manager EdTech | Phase 3 North Star | PRD includes target user, metric, non-goals, and edge cases |
| Onboarding/dashboard UX spec | Next best study action and progress hierarchy are specified | Product Designer | Learner activation PRD | UX spec covers mobile, desktop, empty, and error states |
| AI coach eval plan | Tutor, writing, speaking, grading, fallback, and cost evals are specified | AI / LLM Engineer | Phase 3 AI coach scope | Eval cases and pass/fail criteria exist |
| Motivation loop brief | Missions, XP, streak, Fucoin, rewards, and mascot map to study behavior | Gamification Designer | Phase 3 Motivate pillar | Reward loop reinforces study completion |

## Phase 5 Backlog Source

The implementation-ready backlog is tracked in `phase-5-implementation-ready-backlog.md`.

| Backlog group | Purpose | First owner | Release impact |
| --- | --- | --- | --- |
| Backlog A: Baseline Blockers | Close Redis/service readiness, smoke, Prisma generate, `sw.js`, runtime UI audit | Project Manager / Delivery Manager | Blocks release candidate until closed or accepted |
| Backlog B: Product Requirements | Prepare learner activation, onboarding/dashboard, AI coach, motivation, teacher/admin briefs | Product Manager EdTech | Enables implementation after baseline acceptance |
| Backlog C: QA And Release Readiness | Define gate currency, smoke checklist, activation tests, AI QA, release checklist | QA Automation Engineer | Defines release confidence |
| Backlog D: Data And Measurement | Define North Star, activation, retention, AI cost/usefulness metrics | Data / Analytics Engineer | Enables beta measurement |

## Days 31-60: Learning Core Upgrade

Phase 19 post-merge kickoff: the baseline RC package is now on `master`, so Days 31-60 work should begin from the prioritized backlog in `phase-19-post-merge-backlog-kickoff.md`.

Recommended first post-RC implementation task:

- `P19-A1`: add learner-facing error feedback for vocabulary CTA failure.

| Theme | Outcome | Owner | Acceptance criteria |
| --- | --- | --- | --- |
| Learner onboarding | Level, goal, exam target, daily time captured or inferred | Product Manager EdTech | Focused tests and learner smoke pass for the slice |
| Daily dashboard | Learner sees next best study action and progress signal | Product Designer | Responsive design QA and route smoke pass |
| AI writing feedback | Rubric-based feedback, correction, explanation, and retry loop | AI / LLM Engineer | Eval report shows useful, level-appropriate feedback |
| Speaking practice | Recording, fallback, feedback, and privacy path clarified | Speech / Audio Engineer | Browser/provider smoke status known |
| Content QA pipeline | Automated and manual content QA workflow tightened | Content QA / Linguistic Reviewer | `pnpm qa:content` and manual spot-check signoff are current |
| Teacher/admin confidence | Support workflow and analytics smoke verified | QA Automation Engineer | Authenticated teacher/admin smoke documented |

## Days 61-90: Beta Launch Motion

| Theme | Outcome | Owner | Acceptance criteria |
| --- | --- | --- | --- |
| Beta cohort | First measured learner cohort defined | Growth Lead | Cohort source, size target, and onboarding plan approved |
| Retention instrumentation | Weekly meaningful progress, D1/D7/D30, mission completion, and AI feedback usefulness defined | Data / Analytics Engineer | Metrics definition and event map ready |
| Retention loop | Missions, streak, review, and AI coach tied to daily habit | Gamification Designer | Reward interactions require or reinforce study actions |
| Conversion readiness | Pricing or lead-capture assumption documented | CEO / General Manager | Business model assumption sheet approved |
| Quality dashboard | AI usefulness, eval pass rate, content issue severity, and cost per active learner visible | Data / Analytics Engineer | Dashboard spec or first report ready |
| AI cost dashboard | Cost per active learner and high-cost flows visible | AI / LLM Engineer | Cost metric definition approved |
| Release candidate | Beta release passes baseline gates | CTO / Tech Lead | Release checklist signed off |

## Staffing Plan

| Need | Timing | Default mode |
| --- | --- | --- |
| Senior Full-stack Engineer | Days 0-30 | Core internal |
| AI / LLM Engineer | Days 0-60 | Core internal or dedicated contractor |
| German Academic Lead | Days 0-60 | Core internal or senior consultant |
| Content QA / Linguistic Reviewer | Days 0-60 | Part-time to full-time as content volume grows |
| Product Designer | Days 0-60 | Core internal |
| Growth Lead | Days 31-90 | Part-time first, expand after beta signal |
| DevOps/Security | Days 0-90 | Consultant plus CTO ownership until scale |
| Finance/Admin | Days 31-90 | Fractional support until recurring revenue |

## Release Gate Policy

No beta release without:

- Classified working tree and commit groups.
- `pnpm check:quick` current result.
- `pnpm test:core` current result.
- `pnpm qa:content` current result.
- `pnpm security:secrets` current result.
- Production build result.
- Learner smoke result.
- AI service health status.
- Known P0 risks closed or explicitly accepted by CEO and CTO.
- Phase 3 product scope approved with Learn, Coach, and Motivate outcomes.
- Phase 4 milestone owners, dependencies, and acceptance signals approved.
- QA Automation Engineer states residual release risk.

## Review Cadence

- Daily P0 standup during Days 0-14.
- Twice-weekly product/technical risk review during Days 15-30.
- Weekly roadmap and metrics review during Days 31-90.
- Monthly staffing and budget review.

## Final Day 90 Success Definition

Fuxie has a stable beta-ready product foundation, a measured learner growth motion, visible AI/content quality metrics, and a role-based operating system that can continue delivery without losing control of scope or quality.
