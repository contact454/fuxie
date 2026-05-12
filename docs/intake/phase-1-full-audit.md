# Phase 1: Full Audit & Baseline Evidence

Date: 2026-05-12

## Role-Gate Compliance

Vai chinh: Operations Manager
Vai phoi hop: CTO / Tech Lead, QA Automation Engineer, Product Manager EdTech

This Phase 1 audit was started under the mandatory role-gate workflow:

- `task-startup-checklist.md` was read.
- `task-role-router.md` was read.
- The Operations Manager, CTO / Tech Lead, QA Automation Engineer, and Product Manager EdTech profiles were read.
- The work is audit and evidence gathering. Runtime source, API contracts, database schema, AI service behavior, deploy config, and content JSON are not changed in Phase 1 unless a confirmed P0 blocker is approved by CTO + Operations.

## Phase Objective

Phase 1 runs on Day 2-7. The goal is to convert Phase 0 handover into current evidence: verification gate results, system status, dirty working tree classification, product/UX audit queue, AI/content/security audit queue, and a Phase 2 stabilization backlog.

## Day 2 Gate Log

These commands were run from the repo root on 2026-05-12.

| Order | Gate | Command | Status | Evidence | Owner |
| --- | --- | --- | --- | --- | --- |
| 1 | Typecheck | `pnpm check:quick` | Pass | Turbo typecheck passed across scoped packages; web route types generated successfully | QA Automation Engineer |
| 2 | Core tests | `pnpm test:core` | Pass | SRS: 5 tests passed; web: 29 files / 94 tests passed; AI service: 6 files / 14 tests passed | QA Automation Engineer |
| 3 | Content QA | `pnpm qa:content` | Pass | 1191 content files scanned; 0 errors, 0 warnings; report at `tmp/content-qa-report.md` | Content QA / Linguistic Reviewer |
| 4 | Secret audit | `pnpm security:secrets` | Pass | No secret literals found in tracked or untracked files | Security / Privacy Consultant |
| 5 | Production build | `pnpm build` | Pass | AI service build and Next.js production build passed; 74 static pages generated | CTO / Tech Lead |

## Day 2 Working Tree Evidence

After the build, `git status --short` still shows the pre-existing dirty runtime UI files plus a generated service worker artifact:

| Group | Files / areas | Current evidence | Owner | Phase 1 action |
| --- | --- | --- | --- | --- |
| Group 1: Company operating model | `.agents/`, `AGENTS.md`, `.gitignore` | Governance files are still untracked/modified as expected | Operations Manager | Keep grouped as operating model docs |
| Group 2: Intake planning docs | `docs/intake/` | Intake docs are untracked as expected | Operations Manager | Keep grouped as intake docs |
| Group 3: Runtime UI dirty files | `globals.css`, dashboard, gamification, leaderboard, vocabulary components | Still dirty; not edited by Phase 1 gate runs | Project Manager / Delivery Manager | Audit intent and risk before release |
| Group 4: Build-generated artifact | `apps/web/public/sw.js` | `pnpm build` changed the tracked generated service worker by 2 lines | CTO / Tech Lead | Decide in Phase 2 whether to keep/regenerate or restore via approved process |
| Group 5: Unknown/local/generated | Newly discovered local files, if any | None identified beyond `tmp/content-qa-report.md` ignored output | Project Manager / Delivery Manager | Continue monitoring |

## Day 3 Technical Baseline Audit Queue

| Audit item | Owner | Input | First action | Acceptance signal |
| --- | --- | --- | --- | --- |
| Monorepo subsystem map | CTO / Tech Lead | `apps/`, `packages/`, `services/`, root scripts | Confirm ownership and boundaries | Technical baseline map updated |
| Auth and role boundaries | Backend Engineer | middleware, auth routes, dev-auth, role tests | Review learner/teacher/admin protection | Role smoke plan ready |
| Database drift | Backend Engineer | Prisma package and DB scripts | Check generate/migration status without unsafe schema changes | DB drift status documented |
| Cache and personalized data | Backend Engineer | dashboard/SRS/vocab/teacher/admin cache paths | Confirm user-scoped keys and invalidation | Stale-data risk accepted or queued |
| AI service startup | AI / LLM Engineer | `apps/ai-service` health, queue, provider env | Confirm behavior with missing/present Redis/providers | AI health matrix ready |
| STT service status | Speech / Audio Engineer | `services/stt-service` | Confirm role in current app flows | STT integration status documented |

## Day 4 Product & UX Surface Audit Queue

| Audit item | Owner | Input | First action | Acceptance signal |
| --- | --- | --- | --- | --- |
| Learner journey | Product Manager EdTech | dashboard, course, vocabulary, review, skills, chat | Map current happy path and gaps | Learner surface audit complete |
| Teacher/admin journey | Product Manager EdTech | teacher/admin pages and APIs | Map operational tasks and blockers | Teacher/admin workflow status known |
| Runtime UI diff audit | Frontend Engineer | Group 3 dirty UI files | Classify intent, UX risk, and release risk | Dirty UI recommendation ready |
| Mobile usability | Product Designer | learner dashboard and skill hubs | Identify layout/CTA risks | UX risk list ready |
| Rewards and mascot use | Gamification Designer | rewards/shop, missions, mascot surfaces | Verify learning-purpose alignment | Game-feel audit notes ready |

## Day 5 AI, Speech & Content Audit Queue

| Audit item | Owner | Input | First action | Acceptance signal |
| --- | --- | --- | --- | --- |
| AI tutor and grading | AI / LLM Engineer | chat, grade, generate routes | Define eval cases and failure modes | AI eval plan ready |
| Provider and cost risk | AI / LLM Engineer | provider env and usage paths | Identify high-cost or no-key behavior | AI cost risk status known |
| Speaking/audio | Speech / Audio Engineer | speaking routes, TTS/STT, browser permissions | Define smoke plan and fallback behavior | Audio status documented |
| CEFR/content quality | German Academic Lead | content QA results and sample content | Spot-check A1/B2/C1/C2 | Content quality notes ready |
| Linguistic QA | Content QA / Linguistic Reviewer | content QA report | Review pass result and remaining semantic risks | Content blockers listed or cleared |

## Day 6 DevOps/Security & Business/Growth Audit Queue

| Audit item | Owner | Input | First action | Acceptance signal |
| --- | --- | --- | --- | --- |
| Env readiness | DevOps / Cloud Engineer | env audit scripts and local env assumptions | Run safe env audit when approved | Env status documented |
| DB/Redis availability | DevOps / Cloud Engineer | smoke scripts, local services | Confirm service prerequisites | Smoke readiness known |
| Security/privacy | Security / Privacy Consultant | secret audit, auth, provider data flows | Review PII/audio/provider risks | Security notes ready |
| GTM assumption | CEO / General Manager | product roadmap and North Star | Confirm B2C-first learner segment | GTM assumption sheet ready |
| Metrics gaps | Data / Analytics Engineer | learning/progress/growth events | Define activation/retention/AI cost gaps | Metrics gap list ready |

## Day 7 Synthesis

| Output | Owner | Acceptance signal |
| --- | --- | --- |
| Phase 1 Audit Summary | Operations Manager | All workstreams have pass/fail/blocked/unknown status |
| Updated risk register | Project Manager / Delivery Manager | Every P0/P1/P2 finding has owner and next action |
| Phase 2 stabilization backlog | CTO / Tech Lead | Backlog contains only baseline stabilization work |
| Roadmap implication notes | Product Manager EdTech | Product plan reflects audit findings, not assumptions |

## Updated P0 Status

| Risk | Phase 1 evidence | Current status | Owner | Next action |
| --- | --- | --- | --- | --- |
| R-001 Dirty working tree | Still mixed; build added `apps/web/public/sw.js` generated artifact | Open | Project Manager / Delivery Manager | Classify runtime UI and generated SW artifact before release |
| R-002 Stale gates | Main gates rerun on 2026-05-12 and passed | Evidence collected | QA Automation Engineer | Add smoke/local env gates when services are available |
| R-003 Secrets/env drift | Secret audit passed; env audit not yet run | Partially clear | DevOps / Cloud Engineer | Run env audit safely in Phase 1/2 |
| R-004 Auth/role guard regression | Unit/route tests passed, but manual role smoke not run | Open | Backend Engineer | Prepare learner/teacher/admin smoke |
| R-005 DB drift | Build/tests passed; Prisma drift/generate status not separately checked | Open | Backend Engineer | Run DB generate/drift checks in controlled environment |

## Phase 2 Stabilization Candidates

Only baseline stabilization candidates are allowed to move forward:

- Resolve dirty working tree classification, including generated `sw.js`.
- Run or document local smoke prerequisites for learner, teacher, admin.
- Verify DB generate/migration state.
- Run env audit and service readiness checks.
- Review runtime UI dirty files for intent, risk, and release grouping.
- Build AI eval/provider smoke plan before changing AI behavior.

## Phase 1 Acceptance Criteria

Phase 1 is accepted when:

- Gate results have current status.
- R-001 through R-005 have evidence, owner, and next action.
- Dirty files are classified by intent, risk, and owner.
- Auth, DB drift, AI service health, env/secrets, and content QA have clear status.
- Phase 2 backlog contains only stabilization work, not feature expansion.

## Notes

- `pnpm build` passed but changed `apps/web/public/sw.js`, a tracked generated service worker artifact. This must be handled deliberately in Phase 2.
- `tmp/content-qa-report.md` was generated by content QA and is ignored local output.
- No runtime source files were intentionally edited during Phase 1 implementation.
