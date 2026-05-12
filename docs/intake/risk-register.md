# Fuxie Risk Register

Date: 2026-05-12

## Risk Levels

- P0: Blocks safe baseline or can harm users/data/release.
- P1: Blocks confident beta or core learning quality.
- P2: Important improvement but not a baseline blocker.

## Active Risks

| ID | Priority | Risk | Evidence | Owner | Mitigation | Acceptance signal |
| --- | --- | --- | --- | --- | --- | --- |
| R-001 | P0 | Dirty working tree contains mixed operating model, runtime UI changes, and generated artifact | Phase 2 classified governance docs, intake docs, runtime UI diffs, generated `sw.js`, and local ignored outputs | Project Manager / Delivery Manager | Audit runtime UI intent/risk before release; keep docs and generated artifact grouped separately | No unknown high-risk diff remains |
| R-002 | P0 | Release gates must remain current for the baseline | Phase 1 gates passed; Phase 2 did not edit runtime source | QA Automation Engineer | Rerun gates only when tracked source changes require it | Current gate log exists |
| R-003 | P0 | Env/service drift could break local smoke or deploy readiness | Phase 7: Docker Redis/Postgres healthy and `pnpm env:audit:services` passed | DevOps / Cloud Engineer | Keep local Docker services running for smoke and document service expectations | Env and service audit pass without readiness warnings |
| R-004 | P0 | Auth/role guard regressions could affect learner, teacher, admin separation | Phase 7: full local smoke passed for learner, teacher, admin, AI health, and DB health | QA Automation Engineer | Keep smoke result current before release slices | Role-scoped smoke documented |
| R-005 | P0 | Database schema/generate/migration drift could break runtime | Phase 7: `pnpm db:generate` passed after stopping the web process that locked Prisma DLL | Backend Engineer | Stop DLL-locking local web process before future generate runs if needed | `pnpm db:generate` passes with no unexpected tracked changes |
| R-006 | P1 | Large content changes may contain semantic German/CEFR errors | `change-audit-plan.md` flags content QA as highest risk | Content QA / Linguistic Reviewer | Run content QA and spot-check A1, B2, C1, C2 | Content blockers cleared or listed |
| R-007 | P1 | AI grading/tutor quality may be unverified with real providers | AI service queue/generation/audio/grading flagged high risk | AI / LLM Engineer | Define eval set and provider smoke | AI behavior and cost status known |
| R-008 | P1 | Speaking/live audio may fail in browser/provider edge cases | Chat live voice and audio are recent risk areas | Speech / Audio Engineer | Browser permission and provider smoke | Speaking status documented |
| R-009 | P1 | Personalized cache or analytics changes may show stale learner data | Performance doc mentions cache keys/invalidation checks | Backend Engineer | Review cache keys and mutation invalidation | Stale-data smoke passes |
| R-010 | P1 | Teacher/admin analytics may be correct in tests but unverified in UI | `change-audit-plan.md` flags authenticated UI check needed | Product Manager EdTech | Manual teacher/admin smoke | Teacher/admin workflow status known |
| R-011 | P1 | Product direction may spread team across learner, teacher, AI, mascot, and growth simultaneously | Fuxie has many active surfaces | CEO / General Manager | Approve 90-day focus and sequencing | Roadmap has one primary growth motion |
| R-012 | P2 | Mascot/game-feel assets may become decorative or inconsistent | 3D mascot docs define production rules | Product Designer | Create mascot use map and role rules | Mascot usage supports learning moments |
| R-013 | P2 | Local performance budgets and CI hygiene warnings may be noisy in dev mode | Performance doc notes warm medians over local budgets; Phase 22 addresses GitHub Actions Node 20 deprecation warning | CTO / Tech Lead | Treat perf local as trend signal, bundle as release gate; keep CI action runtime warning current | Perf status recorded without blocking incorrectly; CI deprecation warning has owner decision |
| R-014 | P2 | Vocabulary CTA API failure has limited user-facing feedback | Phase 20 added inline learner-facing feedback for failed `/api/v1/srs/cards` attempts and `pnpm check:quick` passed | Frontend Engineer | Closed in Phase 20 post-RC polish | Failed practice-open attempt tells learner what happened and how to retry |

## Phase 1 Current Evidence

Collected on 2026-05-12:

| Risk | Evidence update | Status |
| --- | --- | --- |
| R-001 | Working tree remains dirty; `pnpm build` also changed tracked generated artifact `apps/web/public/sw.js` | Open |
| R-002 | `pnpm check:quick`, `pnpm test:core`, `pnpm qa:content`, `pnpm security:secrets`, and `pnpm build` passed | Evidence collected |
| R-003 | `pnpm security:secrets` passed; env audit still needs safe execution | Partially clear |
| R-004 | Core auth/role tests passed; manual learner/teacher/admin smoke still required | Open |
| R-005 | Build/tests passed; Prisma generate/migration drift still needs controlled check | Open |

## Phase 2 Current Evidence

Collected on 2026-05-12:

| Risk | Evidence update | Status |
| --- | --- | --- |
| R-001 | Dirty tree is classified into governance docs, intake docs, runtime UI diffs, generated `apps/web/public/sw.js`, and local ignored outputs | Partially closed; runtime UI intent still needs owner audit |
| R-002 | Main gates from Phase 1 remain current because Phase 2 did not modify runtime source | Evidence current |
| R-003 | `pnpm env:audit` passed; `pnpm env:audit:services` warns Redis unreachable at `localhost:6380` | Open for service readiness |
| R-004 | `pnpm smoke:full-local` was not run because service prerequisites are unavailable; executable smoke plan documented in Phase 2 | Open |
| R-005 | `pnpm db:generate` failed with `EPERM` when renaming `query_engine-windows.dll.node` | Open |

## Phase 3 Current Evidence

Collected on 2026-05-12:

| Risk | Evidence update | Status |
| --- | --- | --- |
| R-007 | AI coach scope now requires eval cases, fallback handling, and cost constraints before strong product claims | Open; product guardrail added |
| R-011 | Product positioning now prioritizes B2C Vietnamese self-study learners first, with teacher/admin as support/future B2B | Mitigated for roadmap focus |
| R-012 | Motivation loop now requires missions, XP, streak, Fucoin, rewards, and mascot use to map to real study actions | Mitigated for product planning; design audit still needed |

## Phase 4 Current Evidence

Collected on 2026-05-12:

| Risk | Evidence update | Status |
| --- | --- | --- |
| R-001 | Phase 4 release checklist requires runtime UI diffs to be accepted, split, or held out before release candidate | Open for UI owner audit |
| R-003 | Phase 4 treats Redis/service readiness as a release guardrail, not a planning blocker | Open until service warning clears or is accepted |
| R-004 | Phase 4 requires full local smoke result or explicit blocker acceptance before release candidate | Open |
| R-005 | Phase 4 requires `pnpm db:generate` pass or CTO-accepted alternate before release candidate | Open |
| R-011 | 30/60/90 plan now sequences one primary B2C learner motion before broader beta expansion | Mitigated for delivery focus |

## Phase 5 Current Evidence

Collected on 2026-05-12:

| Risk | Evidence update | Status |
| --- | --- | --- |
| R-001 | Phase 5 backlog item BL-005 assigns runtime UI dirty audit to Frontend Engineer with Product Designer support | Open; owner and acceptance signal defined |
| R-003 | Phase 5 backlog item BL-001 assigns Redis/service readiness to DevOps / Cloud Engineer | Open; owner and acceptance signal defined |
| R-004 | Phase 5 backlog item BL-002 assigns full local smoke execution to QA Automation Engineer | Open; owner and acceptance signal defined |
| R-005 | Phase 5 backlog item BL-003 assigns Prisma generate blocker to Backend Engineer with CTO support | Open; owner and acceptance signal defined |
| R-007 | Phase 5 backlog items PR-004, PR-005, and QA-004 require AI coach scope, eval plan, and QA plan before AI claims are strengthened | Open; backlog path defined |
| R-011 | Phase 5 backlog preserves one primary B2C learner activation path before beta expansion | Mitigated for execution |

## Phase 6 Current Evidence

Collected on 2026-05-12:

| Risk | Evidence update | Status |
| --- | --- | --- |
| R-001 | Runtime UI dirty files were audited by diff size, likely intent, risk, and recommendation; signoff still required | Partially closed; owner signoff open |
| R-003 | `docker compose up -d redis` started Redis and `pnpm env:audit:services` now reports no env issues | Closed for local Docker environment |
| R-004 | Smoke remains blocked: web health/dev-auth on port 3012 return 500, AI health at port 3001 is unreachable | Open |
| R-005 | `pnpm db:generate` still fails; exclusive file-open check confirms Prisma query engine DLL is locked by another process | Open |

## Phase 7 Current Evidence

Collected on 2026-05-12:

| Risk | Evidence update | Status |
| --- | --- | --- |
| R-003 | Docker Postgres and Redis are healthy; `pnpm env:audit:services` passed with no env issues | Closed for local baseline |
| R-004 | Web health, dev-auth, AI health, and `pnpm smoke:full-local` passed using web port 3012 and AI port 3001 | Closed for local baseline |
| R-005 | Stopped repo-local Next processes, Prisma DLL became unlocked, and `pnpm db:generate` passed without new tracked changes | Closed for local baseline |
| R-001 | Runtime UI dirty files remain classified but still need accept/split/hold-out decision before release candidate | Open for release governance |

## Phase 8 Current Evidence

Collected on 2026-05-12:

| Risk | Evidence update | Status |
| --- | --- | --- |
| R-001 | Runtime UI diffs are conditionally accepted into RC candidate slice, with Product Designer + QA signoff required before final release | Partially closed; visual/product signoff open |
| R-002 | `pnpm check:quick`, `pnpm test:core`, `pnpm qa:content`, `pnpm security:secrets`, and `pnpm build` passed after source-slice governance | Closed for RC candidate |
| R-003 | Service readiness remained clean; web was restarted after build and health returned 200 | Closed for local baseline |
| R-004 | Phase 7 full local smoke remains current and passing for the same source state | Closed for local baseline |
| R-005 | Phase 7 Prisma generate pass remains current; no new tracked Prisma changes after gates | Closed for local baseline |
| R-012 | Runtime UI signoff specifically includes leaderboard empty/error state, vocabulary CTA state, and mobile shell visual QA | Open until visual QA completed |

## Phase 9 Current Evidence

Collected on 2026-05-12:

| Risk | Evidence update | Status |
| --- | --- | --- |
| R-001 | Commit groups are defined for governance, intake docs, runtime UI, generated artifact, and local hold-outs | Partially closed; staging pending approval |
| R-002 | Baseline acceptance note references current passing gate matrix | Closed for RC packaging |
| R-011 | RC package preserves one primary B2C learner motion and does not add new product expansion work | Mitigated |
| R-012 | Visual QA remains the final blocker for runtime UI final release signoff | Open until Phase 10 |

## Phase 10 Current Evidence

Collected on 2026-05-12:

| Risk | Evidence update | Status |
| --- | --- | --- |
| R-001 | Runtime UI visual/product QA completed for dashboard, mobile shell, vocabulary, practice hub, and leaderboard | Closed for RC packaging; staging still requires owner approval |
| R-012 | Mascot/reward visuals support learning moments in checked dashboard, vocabulary, and leaderboard states | Mitigated for RC candidate |
| R-014 | Vocabulary CTA has loading/disabled state; failed API path lacks visible learner feedback | Open as P2 polish, not RC blocker |

## Phase 11 Current Evidence

Collected on 2026-05-12:

| Risk | Evidence update | Status |
| --- | --- | --- |
| R-001 | Staging groups G1-G5 are defined with owners, commands, and approval requirements | Closed for planning; actual staging pending approval |
| R-002 | Phase 11 does not change runtime source, so Phase 8 gates remain the current RC evidence | Closed for planning |
| R-014 | P2 vocabulary CTA feedback remains outside RC blocker scope and is assigned to Frontend Engineer | Open as P2 polish |

## Phase 12 Current Evidence

Collected on 2026-05-12:

| Risk | Evidence update | Status |
| --- | --- | --- |
| R-001 | Approved commit groups G1-G3 were executed separately; generated `sw.js` remains held out | Closed for approved groups; G4 pending |
| R-002 | No new release gate has been run in Phase 12 before final artifact decision | Current Phase 8 evidence remains accepted until final RC artifact choice |
| R-014 | Vocabulary CTA feedback remains a P2 post-RC polish item | Open as P2 polish |

## Phase 13 Current Evidence

Collected on 2026-05-12:

| Risk | Evidence update | Status |
| --- | --- | --- |
| R-001 | Generated `sw.js` decision completed and committed separately as `04d9731` | Closed for RC package |
| R-002 | `pnpm build` passed immediately before generated artifact commit | Closed for RC package |
| R-014 | Vocabulary CTA feedback remains a P2 post-RC polish item | Open as P2 polish |

## Phase 14 Current Evidence

Collected on 2026-05-12:

| Risk | Evidence update | Status |
| --- | --- | --- |
| R-001 | Working tree is clean and RC commit stack is documented for handoff | Closed for RC handoff |
| R-002 | Gate evidence is included in the PR body draft | Closed for RC handoff |
| R-014 | Vocabulary CTA feedback is included as a residual P2 follow-up in the PR body draft | Open as P2 polish |

## Phase 15 Current Evidence

Collected on 2026-05-12:

| Risk | Evidence update | Status |
| --- | --- | --- |
| R-001 | Branch pushed and PR #2 created for release review | Closed for PR handoff |
| R-002 | PR body includes gate evidence; CI/review response is the next source of truth | Pending CI/review |
| R-014 | Vocabulary CTA feedback remains listed as residual P2 | Open as P2 polish |

## Phase 16 Current Evidence

Collected on 2026-05-12:

| Risk | Evidence update | Status |
| --- | --- | --- |
| R-001 | PR #2 is mergeable and working tree is clean | Closed for merge readiness |
| R-002 | CI `verify`, Vercel, and Vercel Preview Comments all passed | Closed for merge readiness |
| R-014 | Vocabulary CTA feedback remains a documented residual P2, not a merge blocker | Open as P2 polish |

## Phase 18 Current Evidence

Collected on 2026-05-12:

| Risk | Evidence update | Status |
| --- | --- | --- |
| R-001 | PR #2 merged into `master`; local `master` is synced and clean | Closed for post-merge baseline |
| R-002 | Master CI succeeded on merge commit `38e95e0c01e30bbbcc6101c7c320d51a2ae5a28d` | Closed for post-merge baseline |
| R-014 | Vocabulary CTA feedback remains a P2 post-RC polish item | Open as P2 polish |

## Phase 19 Current Evidence

Collected on 2026-05-12:

| Risk | Evidence update | Status |
| --- | --- | --- |
| R-011 | Post-merge backlog preserves B2C learner activation as the first product motion | Mitigated for next cycle |
| R-014 | Vocabulary CTA feedback is selected as the first post-RC polish implementation item `P19-A1` | Open; ready for Phase 20 |
| R-013 | GitHub Actions Node 20 deprecation warning is captured as `P19-A3` | Open as CI hygiene follow-up |

## Phase 20 Current Evidence

Collected on 2026-05-12:

| Risk | Evidence update | Status |
| --- | --- | --- |
| R-014 | Vocabulary practice CTA now clears stale errors on retry/theme/level change, shows an inline learner-facing alert when `/api/v1/srs/cards` fails, and `pnpm check:quick` passed | Closed |

## Phase 22 Current Evidence

Collected on 2026-05-12:

| Risk | Evidence update | Status |
| --- | --- | --- |
| R-013 | GitHub Actions Node 20 deprecation warning from PR #4 CI was traced to `actions/checkout@v4`, `actions/setup-node@v4`, and `pnpm/action-setup@v4`; workflow now opts JavaScript actions into Node 24 with `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` | Pending PR CI |

## Risk Review Cadence

- Review P0 risks daily during Day 0-14.
- Review P1 risks twice per week during Day 15-30.
- P2 risks enter roadmap grooming after baseline acceptance.

## Escalation Rules

- Security, data leak, or auth boundary risks escalate immediately to CTO and Security / Privacy Consultant.
- CEFR correctness or exam claim risks escalate to German Academic Lead.
- Revenue, positioning, or staffing tradeoffs escalate to CEO / General Manager.
- Release confidence disputes escalate to Project Manager / Delivery Manager with QA evidence.

## Baseline Acceptance Gate

Baseline cannot be accepted while any P0 risk lacks an owner, mitigation, and current status.
