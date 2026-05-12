# Phase 0: Project Freeze & Handover Setup

Date: 2026-05-12

## Role-Gate Compliance

Vai chinh: Operations Manager
Vai phoi hop: Project Manager / Delivery Manager, CTO / Tech Lead, CEO / General Manager

This Phase 0 document was created under the mandatory role-gate workflow:

- `task-startup-checklist.md` was read.
- `task-role-router.md` was read.
- The Operations Manager, Project Manager / Delivery Manager, CTO / Tech Lead, and CEO / General Manager profiles were read.
- The work is limited to governance and documentation. No runtime code, app API, database schema, AI service, deploy config, or content JSON changes are in scope.

## Phase Objective

Phase 0 runs on Day 0-1. Its purpose is to make the unfinished Fuxie project governable before the team performs deep audits or new feature work.

By the end of Phase 0:

- Project scope is frozen.
- Every intake workstream has an owner.
- The dirty working tree is classified.
- P0 risks R-001 through R-005 have owners and next actions.
- Phase 1 has an audit queue with inputs, first actions, and acceptance signals.

## Project Freeze Notice

Until the stable baseline is accepted:

- Do not add new product features.
- Do not start broad refactors.
- Do not change database schema unless a confirmed P0 blocker requires it.
- Do not mix content-only changes with runtime app changes.
- Do not modify AI service behavior outside a confirmed P0 blocker.
- Do not change deploy or environment configuration unless required for P0 safety.
- Do not print, copy, or commit secrets.
- Do not release until the working tree is classified and the minimum gate matrix has current status.
- Every task must pass the mandatory role-gate before work begins.

Allowed Phase 0 work:

- Documentation, classification, owner assignment, risk routing, and Phase 1 queue preparation.

Not allowed in Phase 0:

- Runtime UI fixes, API changes, schema changes, content rewrites, AI prompt changes, test rewrites, deployment changes, or broad cleanup.

## Day 0: Freeze And Ownership

| Task | Owner | Input | Output | Acceptance signal |
| --- | --- | --- | --- | --- |
| Publish project freeze | Operations Manager | `docs/intake/README.md`, this Phase 0 document | Freeze rules visible in intake docs | Team has a single freeze policy |
| Classify working tree | Project Manager / Delivery Manager | `git status --short` | Dirty tree groups listed below | No unknown high-risk diff category |
| Confirm technical freeze | CTO / Tech Lead | Current repo state and technical baseline doc | P0-only technical rule | No new technical work enters Phase 0 |
| Confirm business assumption | CEO / General Manager | Product North Star doc | B2C-first intake assumption | Phase 1 product audit has a default lens |
| Assign workstream owners | Operations Manager | Intake streams table | Owner matrix below | No owner gaps |

## Working Tree Classification

Current `git status --short` shows a mixed working tree. Phase 0 only classifies these changes.

| Group | Files / areas | Owner | Phase 0 action | Phase 1 handoff |
| --- | --- | --- | --- | --- |
| Group 1: Company operating model | `.agents/`, `AGENTS.md`, `.gitignore` | Operations Manager | Treat as governance docs and tracking rules | Verify all required workflow files are tracked |
| Group 2: Intake planning docs | `docs/intake/` | Operations Manager | Treat as intake governance docs | Keep as source of truth for Phase 1 |
| Group 3: Runtime UI dirty files | `apps/web/src/app/globals.css`, dashboard, gamification, leaderboard, vocabulary components | Project Manager / Delivery Manager | Do not edit; mark as runtime diff needing audit | Assign to Frontend Engineer + Product Designer in Phase 1 |
| Group 4: Unknown/local/generated | Any newly discovered local files | Project Manager / Delivery Manager | Identify and classify before release | Ignore, document, or route to owner |

Runtime UI files currently visible in the dirty tree:

- `apps/web/src/app/globals.css`
- `apps/web/src/components/dashboard/dashboard-client.tsx`
- `apps/web/src/components/gamification/quest-visuals.tsx`
- `apps/web/src/components/leaderboard/LeaderboardClient.tsx`
- `apps/web/src/components/vocabulary/practice-hub.tsx`
- `apps/web/src/components/vocabulary/vocabulary-client.tsx`

## Technical Freeze Confirmation

The CTO / Tech Lead owns this rule:

- Only confirmed P0 blockers may bypass the freeze.
- P0 blocker categories are build failure, auth/role boundary failure, data loss risk, secret/security exposure, database drift blocking runtime, or AI service startup failure.
- All other technical work moves into the Phase 1 audit queue.
- Existing verification commands are not re-run as Phase 0 acceptance gates; they are Phase 1 audit tasks unless needed to validate a P0 blocker.

## Business Assumption Confirmation

The CEO / General Manager owns this temporary intake assumption:

- Primary intake lens: B2C Vietnamese learners studying German.
- Teacher/admin surfaces remain important as support operations and a future B2B channel.
- Product expansion waits until the baseline is stable and Phase 1 audits define risk and opportunity.

## Owner Matrix

| Workstream | Primary owner | Support roles | Phase 0 responsibility |
| --- | --- | --- | --- |
| Product | Product Manager EdTech | CEO / General Manager, Product Designer, Data / Analytics Engineer | Prepare product audit scope |
| Engineering | CTO / Tech Lead | Full-stack Engineer, Backend Engineer, Frontend Engineer | Prepare architecture and dirty runtime audit scope |
| AI | AI / LLM Engineer | German Academic Lead, Backend Engineer, Security / Privacy Consultant | Prepare AI tutor/grading/provider audit scope |
| Content | German Academic Lead | German Curriculum Designer, Content QA / Linguistic Reviewer | Prepare CEFR/content QA audit scope |
| Design | Product Designer | Gamification Designer, Illustrator / 3D Mascot Artist | Prepare UX, game-feel, and mascot audit scope |
| QA | QA Automation Engineer | DevOps / Cloud Engineer, Content QA / Linguistic Reviewer | Prepare release gate matrix |
| DevOps/Security | DevOps / Cloud Engineer | Security / Privacy Consultant, Backend Engineer | Prepare env, deploy, secret, DB/Redis status audit |
| Business/Growth | CEO / General Manager | Growth Lead, Sales / Partnership Manager, Finance / Admin Officer | Prepare GTM and staffing assumption audit |

## Day 1: Phase 1 Audit Queue

| Queue item | Owner | Input | First action | Acceptance signal |
| --- | --- | --- | --- | --- |
| Product surface audit | Product Manager EdTech | Current product surfaces and North Star doc | Map learner, teacher, and admin flows | Product audit checklist complete |
| Runtime UI diff audit | Frontend Engineer | Group 3 dirty files | Classify intent, risk, and visual impact | Runtime UI diff owner recommendation |
| Architecture baseline | CTO / Tech Lead | Monorepo, technical baseline doc | Map subsystems and P0 unknowns | Technical audit backlog created |
| Auth and role boundary audit | Backend Engineer | Auth routes and middleware | Review learner/teacher/admin boundaries | Role smoke plan ready |
| DB drift audit | Backend Engineer | Prisma package and DB scripts | Check generate/migration status | DB status documented |
| AI service audit | AI / LLM Engineer | `apps/ai-service` routes and provider assumptions | Review chat, grade, generate, audio, health | AI risk and eval plan ready |
| Content QA audit | Content QA / Linguistic Reviewer | `content/`, existing QA scripts | Plan content QA and A1/B2/C1/C2 spot checks | Content QA status path ready |
| Release gate matrix | QA Automation Engineer | Root `package.json` scripts | Schedule gate execution order | Gate log template ready |
| Env and secrets audit | DevOps / Cloud Engineer | Env audit and secret audit scripts | Define safe audit command sequence | Secret/env status path ready |
| UX/game/mascot audit | Product Designer | Design docs and mascot assets | Map production use and UX risks | Design audit priorities ready |
| GTM assumption audit | CEO / General Manager | Product North Star and growth assumptions | Confirm first segment and metric lens | GTM assumption sheet ready |

## P0 Risk Confirmation

| Risk | Owner | Next action | Closing signal |
| --- | --- | --- | --- |
| R-001 Dirty working tree contains mixed changes | Project Manager / Delivery Manager | Maintain classification above and update if status changes | No unknown high-risk diff remains |
| R-002 Release gates are stale | QA Automation Engineer | Prepare Phase 1 gate log for current run results | Current gate log exists |
| R-003 Secrets or env drift | DevOps / Cloud Engineer | Prepare safe secret/env audit sequence | Secret audit passes or blockers documented |
| R-004 Auth/role guard regression | Backend Engineer | Prepare protected-route smoke plan | Learner/teacher/admin role status documented |
| R-005 DB drift risk | Backend Engineer | Prepare Prisma generate/migration status check | DB drift status documented |

## Phase 0 Acceptance Criteria

Phase 0 is complete when:

- Every Phase 0 task starts with `Vai chinh` and `Vai phoi hop`.
- Working tree groups are documented.
- Workstream owners are assigned.
- Project freeze and technical freeze are explicit.
- The default business assumption is recorded.
- Phase 1 audit queue is ready.
- R-001 through R-005 have owner, next action, and closing signal.
- No runtime code, API, database schema, AI service, deploy config, or content JSON changes were made for Phase 0.

## Phase 0 Verification

After implementing this document:

- Confirm `docs/intake/README.md` links to this file.
- Confirm no runtime code files were modified by Phase 0 implementation.
- Confirm whitespace is clean in intake docs.
- Confirm `git status --short` still separates docs/governance changes from pre-existing runtime UI changes.
