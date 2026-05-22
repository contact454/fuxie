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
| R-007 | P1 | AI grading/tutor quality may be unverified with real providers | Phase 29 defines eval cases, rubric, fallback cases, cost/latency gates, and provider-run requirements | AI / LLM Engineer | Run provider-backed evals and failure-mode smoke before stronger AI claims | AI behavior and cost status known |
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
| R-013 | GitHub Actions Node 20 deprecation warning from PR #4 CI was traced to `actions/checkout@v4`, `actions/setup-node@v4`, and `pnpm/action-setup@v4`; PR #5 updates those actions to v6, opts JavaScript actions into Node 24, and passes CI without the Node 20 action deprecation warning | Closed for CI deprecation warning |

## Phase 28 Current Evidence

Collected on 2026-05-12:

| Risk | Evidence update | Status |
| --- | --- | --- |
| R-007 | AI coach product scope is defined with separated tutor/writing/speaking/grading/hint/weak-skill surfaces, bounded claims, fallback states, and Phase 29 eval handoff | Open; ready for eval plan |
| R-011 | AI coach brief keeps B2C Vietnamese learner progress as the primary motion and prevents AI feature expansion from becoming an unbounded product surface | Mitigated for coach scope |

## Phase 29 Current Evidence

Collected on 2026-05-12:

| Risk | Evidence update | Status |
| --- | --- | --- |
| R-007 | Eval plan now defines A1/A2/B1/B2 cases, Vietnamese learner mistake coverage, scoring rubric, provider failure cases, cost/latency gates, and academic review requirements | Partially mitigated; provider-backed eval run still required |
| R-008 | Speaking support eval includes audio permission denial, transcript-quality uncertainty, and text/self-check fallback expectations | Open; fallback coverage defined |

## Phase 30 Current Evidence

Collected on 2026-05-12:

| Risk | Evidence update | Status |
| --- | --- | --- |
| R-011 | Weekly CEFR progress metric keeps product focus on completed learning actions, caps AI contribution, and separates engagement proxies from learning outcomes | Mitigated for measurement scope |

## Phase 31 Current Evidence

Collected on 2026-05-12:

| Risk | Evidence update | Status |
| --- | --- | --- |
| R-012 | Motivation loop brief ties mascot moments, rewards, XP, streaks, and Fucoin to meaningful study actions instead of decorative engagement | Mitigated for motivation scope |
| R-011 | Reward-only engagement is explicitly excluded from learning progress and tracked as a risk signal | Mitigated for product focus |

## Phase 32 Current Evidence

Collected on 2026-05-12:

| Risk | Evidence update | Status |
| --- | --- | --- |
| R-011 | Retention event map anchors D1/D7/D30 on meaningful action completion and separates reward-only activity from learning retention | Mitigated for retention measurement |
| R-012 | Mission, streak, reward, and lifecycle events have quality checks to prevent decorative activity from being reported as progress | Mitigated for event scope |

## Phase 33 Current Evidence

Collected on 2026-05-12:

| Risk | Evidence update | Status |
| --- | --- | --- |
| R-011 | Backlog closure confirms the Phase 19 cycle is complete and future work should start as an implementation cycle rather than more parallel planning | Mitigated for cycle closure |

## Phase 41-47 Current Evidence

Collected on 2026-05-13:

| Risk | Evidence update | Status |
| --- | --- | --- |
| R-006 | `pnpm qa:content` scanned 1193 files with 0 errors and 0 warnings; human academic spot-check and signoff remain required for stronger CEFR/exam claims | Partially mitigated; human signoff pending |
| R-007 | `pnpm eval:ai` passed 5/5 offline cases and `pnpm check:ai-eval` passed with provider blocker recorded; provider-backed eval remains blocked by missing `GEMINI_API_KEY` or `GOOGLE_AI_API_KEY` | Partially mitigated; provider quality evidence still blocked |
| R-008 | AI service tests passed 12 files / 36 tests and offline speaking eval passed 1/1; speaking/browser/provider smoke remains blocked because AI service, DB/Redis, and provider prerequisites were not available | Open with clearer blocker |
| R-010 | `pnpm --filter @fuxie/web test` passed 47 files / 171 tests including teacher/admin analytics routes; `pnpm smoke:full-local` reached teacher/admin checks, but DB/API prerequisites failed because local Postgres/Redis were unreachable and Docker Desktop daemon was not running | Partially mitigated by tests; UI smoke remains blocked |
| R-011 | Growth beta cohort plan now defines 30-50 learner B2C beta, activation/retention/progress metrics, and guardrails against broad B2B expansion before learner signal | Mitigated for beta planning |
| R-013 | `pnpm env:audit` and `pnpm security:secrets` passed; service audit warns only on unavailable DB/Redis local services | Mitigated for static checks; service readiness blocked |

## Phase 48 Current Evidence

Collected on 2026-05-13:

| Risk | Evidence update | Status |
| --- | --- | --- |
| R-006 | All-hands reassessment confirms automated content QA is accepted, but human Academic Lead spot-check is required before stronger CEFR/exam claims | Partially mitigated; human signoff remains beta-readiness blocker |
| R-007 | All-hands reassessment confirms offline AI eval/tooling is accepted, but provider-backed eval and Academic Lead final signoff remain required before strong AI grading claims | Partially mitigated; provider and academic signoff blockers remain |
| R-008 | All-hands reassessment keeps speaking/audio blocked for beta claim until browser permission, provider availability, low-confidence fallback, and privacy evidence exist | Open; next action is speaking/audio smoke after service readiness |
| R-010 | All-hands reassessment keeps teacher/admin analytics UI conditional until DB/Redis/AI prerequisites are restored and role-scoped smoke passes | Partially mitigated by tests; live UI smoke remains blocked |
| R-011 | Phase 48 explicitly prioritizes beta-readiness blockers before feature expansion and preserves B2C Vietnamese learners as the primary product motion | Mitigated for company focus |
| R-013 | Phase 48 treats static env/security checks as accepted but local service readiness as the next DevOps gate before smoke or beta claims | Mitigated for static checks; service readiness gate open |

## Phase 49 Current Evidence

Collected on 2026-05-13:

| Risk | Evidence update | Status |
| --- | --- | --- |
| R-006 | Phase 49 assigns Academic Lead final signoff as a required beta-readiness workstream with AI signoff JSON and A1-B2/exam-claim sample decisions as acceptance signals | Open; closure sprint planned |
| R-007 | Phase 49 assigns provider-backed AI eval to AI / LLM Engineer and requires `pnpm check:ai-eval` provider completion or CTO + AI owner accepted blocker with conservative wording | Open; closure sprint planned |
| R-008 | Phase 49 assigns speaking/audio smoke to Speech / Audio Engineer with permission-denied, provider-unavailable, low-confidence transcript, success path, and privacy evidence required | Open; closure sprint planned |
| R-010 | Phase 49 assigns teacher/admin analytics UI smoke to Product Manager EdTech after DB/API readiness, with role-scoped pages and admin readouts as acceptance signals | Open; closure sprint planned |
| R-013 | Phase 49 makes service/static checks part of the command checklist and keeps missing local services classified as blocked prerequisites rather than product failures | Open for service readiness; static checks remain mitigated |

## Phase 50 Current Evidence

Collected on 2026-05-13:

| Risk | Evidence update | Status |
| --- | --- | --- |
| R-003 | Docker Desktop was started, `docker compose up -d postgres redis` restored local Postgres/Redis, AI service health returned ok on port 3001, web health returned ok on port 3012, and rerun `pnpm env:audit:services` passed | Closed for local beta evidence |
| R-004 | `pnpm smoke:full-local` passed AI health, web DB health, learner pages/APIs, teacher page/API, and admin page/API using web port 3012 and AI port 3001 | Closed for current source state |
| R-006 | `pnpm qa:content` scanned 1193 files with 0 errors and 0 warnings, but Academic Lead final signoff JSON still has pending reviewer, overall decision, and case decisions | Partially mitigated; human signoff pending |
| R-007 | `pnpm check:ai-eval` passed offline eval 5/5 and generated readout evidence; provider-backed eval remains blocked because `GEMINI_API_KEY` / `GOOGLE_AI_API_KEY` is missing | Partially mitigated; provider quality evidence blocked |
| R-008 | `/speaking` page passed full local smoke and offline speaking eval passed, but browser microphone/provider speaking smoke and pronunciation/privacy edge cases remain incomplete | Conditional/open for speaking beta claim |
| R-010 | Full local smoke passed teacher page/API and admin page/API; deeper admin analytics readout manual verification remains a follow-up before wider beta | Partially closed for controlled beta |
| R-013 | `pnpm check:quick`, `pnpm test:core`, `pnpm qa:content`, `pnpm security:secrets`, `pnpm env:audit`, `pnpm env:audit:services`, and `pnpm smoke:full-local` passed; provider eval blocker is explicitly classified | Closed for current beta evidence |

## Phase 51 Current Evidence

Collected on 2026-05-13:

| Risk | Evidence update | Status |
| --- | --- | --- |
| R-006 | Phase 51 keeps Academic Lead final signoff as a launch exclusion: the signoff template exists, but reviewer, overall decision, and case decisions remain pending | Open; human signoff required before stronger CEFR/exam claims |
| R-007 | Phase 51 confirms provider keys are not present in local environment, so provider-backed eval remains excluded from beta claims while offline eval evidence stays accepted | Partially mitigated; provider evidence blocked |
| R-008 | Phase 51 keeps speaking/pronunciation claims limited to practice support until browser/provider audio smoke documents permission, fallback, success, low-confidence, and privacy paths | Conditional/open for speaking beta claim |
| R-010 | Phase 51 separates role-smoke readiness from deeper admin analytics verification and assigns live readout checks as Phase 52 follow-up | Partially closed for controlled beta |
| R-011 | Phase 51 narrows next execution to a 30-50 learner B2C controlled beta cohort and explicitly blocks broad teacher/admin or public marketing expansion | Mitigated for launch focus |
| R-013 | Phase 51 defines rerun triggers for `check:quick`, focused tests, `qa:content`, `env:audit:services`, `check:ai-eval`, and `smoke:full-local` before cohort launch if source/env/provider/content changes land | Closed for launch governance |

## Phase 52 Current Evidence

Collected on 2026-05-13:

| Risk | Evidence update | Status |
| --- | --- | --- |
| R-006 | Phase 52 keeps Academic Lead guardrails active during cohort operations and requires CEFR/exam claim review before any stronger learner-facing claim | Open; human academic signoff still required |
| R-007 | Phase 52 keeps AI feedback as practice support and measures generated/failed events without claiming provider-validated AI grading quality | Partially mitigated; provider-backed eval remains blocked |
| R-008 | Phase 52 keeps speaking/pronunciation claims excluded from precision wording until browser/provider smoke covers permission, fallback, success, low-confidence, and privacy paths | Conditional/open for speaking beta claim |
| R-010 | Phase 52 assigns admin analytics live readout verification to cohort measurement operations, while keeping teacher/admin outside the primary beta promise | Partially closed; deeper readout verification remains follow-up |
| R-011 | Phase 52 turns the next step into a 30-50 learner controlled B2C cohort with explicit non-goals for feature expansion, teacher/admin expansion, and public marketing | Mitigated for beta operations focus |
| R-013 | Phase 52 defines rerun triggers for runtime/API/content/provider/service changes and keeps Phase 50 gates as current unless those triggers occur | Closed for cohort governance |

## Phase 53 Current Evidence

Collected on 2026-05-13:

| Risk | Evidence update | Status |
| --- | --- | --- |
| R-006 | Phase 53 routes any content or CEFR issue into `content_academic_risk` with German Academic Lead ownership and keeps evidence required before stronger claims | Open; waiting for cohort/content evidence and human signoff |
| R-007 | Phase 53 routes AI tutor/grading/provider issues into `ai_audio_limitation` and keeps provider-validated AI quality claims excluded until evidence closes them | Partially mitigated; waiting for cohort/provider evidence |
| R-008 | Phase 53 routes speaking/audio issues into `ai_audio_limitation` and keeps pronunciation precision excluded until browser/provider smoke evidence exists | Conditional/open for speaking beta claim |
| R-010 | Phase 53 creates the issue and analytics readout intake templates needed to verify admin/readout gaps without making teacher/admin the primary beta promise | Partially closed; waiting for live readout evidence |
| R-011 | Phase 53 prevents feature expansion by requiring source evidence, severity, owner, next action, and acceptance signal before selecting one implementation slice | Mitigated for backlog discipline |
| R-013 | Phase 53 records empty cohort evidence as `waiting_for_cohort_data` and does not require runtime gates because no runtime/schema/content/prompt changes were made | Closed for docs-only triage governance |

## Phase 54 Current Evidence

Collected on 2026-05-13:

| Risk | Evidence update | Status |
| --- | --- | --- |
| R-006 | Phase 54 found no real cohort/content feedback batch in repo docs; academic/content risks remain under guardrail until learner evidence or human signoff exists | Open; waiting for cohort/content evidence and human signoff |
| R-007 | Phase 54 found no provider-backed or learner-cohort AI quality evidence; AI remains practice-support only and provider-validated claims stay excluded | Partially mitigated; waiting for provider/cohort evidence |
| R-008 | Phase 54 found no browser/provider speaking evidence from cohort operations; pronunciation precision remains excluded | Conditional/open for speaking beta claim |
| R-010 | Phase 54 found no cohort analytics snapshot or admin readout evidence recorded in repo docs; readout verification remains follow-up | Partially closed; waiting for live readout evidence |
| R-011 | Phase 54 blocks runtime fix selection because no evidence-backed P0/P1 cohort issue exists, preventing feature expansion from outrunning beta data | Mitigated for evidence discipline |
| R-013 | Phase 54 is docs/governance only and records no runtime/schema/content/prompt changes; runtime gates are not required for this docs-only phase | Closed for docs-only evidence intake |

## Phase 55 Current Evidence

Collected on 2026-05-13:

| Risk | Evidence update | Status |
| --- | --- | --- |
| R-006 | Phase 55 adds controlled beta evidence templates and guardrails that route CEFR/content concerns to Academic Lead without collecting raw learner submissions | Open; waiting for cohort/content evidence and human signoff |
| R-007 | Phase 55 keeps AI evidence privacy-safe and blocks provider-validated AI claims until provider-backed eval or cohort evidence exists | Partially mitigated; waiting for provider/cohort evidence |
| R-008 | Phase 55 keeps speaking/audio evidence under guardrail and blocks pronunciation precision claims until browser/provider smoke evidence exists | Conditional/open for speaking beta claim |
| R-010 | Phase 55 adds analytics snapshot and first-fix readiness templates so cohort/admin readout gaps can be recorded before any fix selection | Partially closed; waiting for live readout evidence |
| R-011 | Phase 55 strengthens evidence discipline by requiring controlled beta templates before selecting runtime work, preventing feature expansion without data | Mitigated for evidence capture |
| R-013 | Phase 55 is docs/evidence infrastructure only and does not modify runtime/schema/content/prompt/provider/deploy files; runtime gates are not required | Closed for docs-only evidence system |

## Phase 56 Current Evidence

Collected on 2026-05-13:

| Risk | Evidence update | Status |
| --- | --- | --- |
| R-006 | Phase 56 reviewed controlled beta evidence and found no cohort/content feedback item or academic signoff evidence; CEFR/exam guardrails remain active | Open; waiting for cohort/content evidence and human signoff |
| R-007 | Phase 56 found no provider-backed or cohort AI quality evidence in the controlled beta evidence files; AI grading remains practice-support only | Partially mitigated; waiting for provider/cohort evidence |
| R-008 | Phase 56 found no browser/provider speaking evidence or cohort audio issue in the controlled beta evidence files; pronunciation precision remains excluded | Conditional/open for speaking beta claim |
| R-010 | Phase 56 found no analytics snapshot or admin readout evidence for the controlled beta cohort; readout verification remains pending | Partially closed; waiting for live readout evidence |
| R-011 | Phase 56 blocks runtime fix selection because no complete evidence-backed P0/P1 candidate exists, preserving focus and preventing feature expansion without data | Mitigated for evidence-backed delivery discipline |
| R-013 | Phase 56 is a docs-only selection gate and does not modify runtime/schema/content/prompt/provider/deploy files; runtime gates are not required | Closed for docs-only selection governance |

## Phase 57 Current Evidence

Collected on 2026-05-13:

| Risk | Evidence update | Status |
| --- | --- | --- |
| R-006 | Phase 57 documents that no cohort/content feedback or human academic signoff evidence exists yet; follow-up owner remains Product Manager EdTech with Academic Lead escalation if content evidence appears | Open; evidence shortfall documented, follow up by 2026-05-20 |
| R-007 | Phase 57 documents that no provider-backed or cohort AI quality evidence exists yet; AI claims remain practice-support only | Partially mitigated; evidence shortfall documented, provider/cohort evidence still needed |
| R-008 | Phase 57 documents that no speaking/audio cohort evidence exists yet; pronunciation precision remains excluded | Conditional/open for speaking beta claim; evidence shortfall documented |
| R-010 | Phase 57 updates analytics evidence to `recruitment_or_evidence_shortfall`, so admin/cohort readout verification remains pending until active learner data exists | Partially closed; waiting for live readout evidence |
| R-011 | Phase 57 keeps implementation blocked, records shortfall owners, and prevents feature expansion without a complete evidence-backed P0/P1 candidate | Mitigated for evidence-backed delivery discipline |
| R-013 | Phase 57 is docs/evidence follow-up only and does not modify runtime/schema/content/prompt/provider/deploy files; runtime gates are not required | Closed for docs-only evidence follow-up |

## Phase 58 Current Evidence

Collected on 2026-05-13:

| Risk | Evidence update | Status |
| --- | --- | --- |
| R-006 | Phase 58 rechecked beta evidence and still found no cohort/content feedback or human academic signoff evidence; academic guardrails remain unchanged | Open; blocked by controlled beta operations evidence |
| R-007 | Phase 58 found no provider-backed or cohort AI quality evidence; AI claims remain practice-support only | Partially mitigated; provider/cohort evidence still missing |
| R-008 | Phase 58 found no speaking/audio cohort evidence; pronunciation precision remains excluded | Conditional/open for speaking beta claim; evidence still missing |
| R-010 | Phase 58 keeps analytics readout blocked because there is no active cohort data to aggregate | Partially closed; live readout evidence blocked by cohort operations |
| R-011 | Phase 58 escalates missing cohort evidence to `controlled_beta_operations_blocker` and keeps runtime/feature work blocked until evidence-backed P0/P1 candidate exists | Mitigated for evidence-backed delivery discipline |
| R-013 | Phase 58 is docs/evidence recheck only and does not modify runtime/schema/content/prompt/provider/deploy files; runtime gates are not required | Closed for docs-only readiness recheck |

## Phase 59 Current Evidence

Collected on 2026-05-13:

| Risk | Evidence update | Status |
| --- | --- | --- |
| R-006 | Phase 59 defines feedback and academic escalation flow, but no cohort/content feedback or human academic signoff evidence exists yet | Open; controlled beta operations blocker must close before evidence can be reviewed |
| R-007 | Phase 59 keeps AI evidence dependent on real cohort/provider data and does not relax practice-support wording | Partially mitigated; provider/cohort evidence still missing |
| R-008 | Phase 59 keeps speaking/audio claim guardrails active and requires real cohort/audio evidence before any pronunciation precision claim | Conditional/open for speaking beta claim; evidence still missing |
| R-010 | Phase 59 defines the aggregate analytics readout owner and minimum evidence package, but no active cohort data exists yet | Partially closed; readout blocked by cohort operations |
| R-011 | Phase 59 creates the operational closure plan for `controlled_beta_operations_blocker` and keeps runtime/feature work blocked until evidence-backed P0/P1 candidate exists | Mitigated for evidence-backed delivery discipline |
| R-013 | Phase 59 is docs/operations governance only and does not modify runtime/schema/content/prompt/provider/deploy files; runtime gates are not required | Closed for docs-only operations plan |

## Phase 60 Current Evidence

Collected on 2026-05-13:

| Risk | Evidence update | Status |
| --- | --- | --- |
| R-006 | Phase 60 keeps academic/content evidence blocked because no real learner cohort, feedback, or academic signoff input exists yet | Open; blocked by beta operations escalation |
| R-007 | Phase 60 keeps AI quality evidence dependent on real cohort/provider data and confirms no AI claim guardrail is relaxed | Partially mitigated; provider/cohort evidence still missing |
| R-008 | Phase 60 keeps speaking/audio claim guardrails active because no cohort/audio evidence exists | Conditional/open for speaking beta claim; evidence still missing |
| R-010 | Phase 60 confirms analytics readout cannot start without learner aliases and activity | Partially closed; readout blocked by recruitment execution |
| R-011 | Phase 60 records `operations_escalation_still_blocked` and keeps runtime/feature work blocked until recruitment produces evidence-backed P0/P1 candidate | Mitigated for evidence-backed delivery discipline |
| R-013 | Phase 60 is docs/escalation governance only and does not modify runtime/schema/content/prompt/provider/deploy files; runtime gates are not required | Closed for docs-only escalation review |

## Phase 61 Current Evidence

Collected on 2026-05-13:

| Risk | Evidence update | Status |
| --- | --- | --- |
| R-006 | Phase 61 defines feedback handoff surfaces and academic/content guardrails, but no cohort/content feedback or human signoff evidence exists yet | Open; blocked until recruitment execution produces learner evidence |
| R-007 | Phase 61 keeps AI evidence dependent on real learner activity and provider/cohort data; outreach cannot claim provider-validated AI grading | Partially mitigated; provider/cohort evidence still missing |
| R-008 | Phase 61 keeps speaking/audio claim guardrails in outreach and evidence capture; no pronunciation precision claim is allowed | Conditional/open for speaking beta claim; evidence still missing |
| R-010 | Phase 61 defines analytics readout cadence after learner activity, but no active cohort data exists yet | Partially closed; readout blocked until recruitment channel is selected and learners are active |
| R-011 | Phase 61 records `recruitment_execution_blocked` and keeps runtime/feature work blocked until recruitment creates evidence-backed P0/P1 candidate | Mitigated for evidence-backed delivery discipline |
| R-013 | Phase 61 is docs/recruitment governance only and does not modify runtime/schema/content/prompt/provider/deploy files; runtime gates are not required | Closed for docs-only recruitment plan |

## Phase 62 Current Evidence

Collected on 2026-05-13:

| Risk | Evidence update | Status |
| --- | --- | --- |
| R-006 | Phase 62 escalates missing recruitment channel, so academic/content evidence remains blocked until learner cohort evidence exists | Open; beta recruitment blocker escalated |
| R-007 | Phase 62 keeps AI evidence blocked by missing cohort/provider evidence and preserves practice-support-only claims | Partially mitigated; provider/cohort evidence still missing |
| R-008 | Phase 62 keeps speaking/audio evidence blocked by missing cohort evidence and preserves pronunciation claim exclusions | Conditional/open for speaking beta claim; evidence still missing |
| R-010 | Phase 62 confirms analytics readout cannot start because no recruitment channel or learner activity exists | Partially closed; readout blocked by recruitment channel decision |
| R-011 | Phase 62 records `beta_recruitment_blocker_escalated` and keeps runtime/feature work blocked until recruitment produces evidence-backed P0/P1 candidate | Mitigated for evidence-backed delivery discipline |
| R-013 | Phase 62 is docs/escalation governance only and does not modify runtime/schema/content/prompt/provider/deploy files; runtime gates are not required | Closed for docs-only recruitment escalation |

## Phase 63 Current Evidence

Collected on 2026-05-13:

| Risk | Evidence update | Status |
| --- | --- | --- |
| R-006 | Phase 63 selects `community_outreach_selected` as the beta recruitment path, but academic/content evidence still requires real learner feedback or human Academic Lead signoff | Open; waiting for cohort/content evidence and human signoff |
| R-007 | Phase 63 keeps AI claims practice-support only; no provider-backed or cohort AI quality evidence is created by source selection alone | Partially mitigated; provider/cohort evidence still missing |
| R-008 | Phase 63 keeps speaking/audio claim exclusions active; no pronunciation evidence exists until real learner activity or speaking/audio smoke evidence is captured | Conditional/open for speaking beta claim; evidence still missing |
| R-010 | Phase 63 moves analytics from blocked by source decision to blocked by learner activity; aggregate readout can start only after real aliases and activity exist | Partially closed; readout blocked by learner activity |
| R-011 | Phase 63 closes the recruitment source decision with `community_outreach_selected` while keeping runtime/feature work blocked until evidence-backed P0/P1 candidate exists | Mitigated for evidence-backed delivery discipline |
| R-013 | Phase 63 is docs/invite-readiness governance only and does not modify runtime/schema/content/prompt/provider/deploy files; runtime gates are not required | Closed for docs-only invite readiness |

## Phase 64 Current Evidence

Collected on 2026-05-13:

| Risk | Evidence update | Status |
| --- | --- | --- |
| R-006 | Phase 64 adds an outreach tracker, but academic/content evidence still requires real learner feedback or human Academic Lead signoff | Open; waiting for cohort/content evidence and human signoff |
| R-007 | Phase 64 preserves practice-support-only AI wording in outreach execution; no provider-backed or cohort AI quality evidence exists yet | Partially mitigated; provider/cohort evidence still missing |
| R-008 | Phase 64 keeps speaking/audio exclusions active during outreach execution; no pronunciation evidence exists yet | Conditional/open for speaking beta claim; evidence still missing |
| R-010 | Phase 64 creates an outreach tracker but analytics readout remains blocked until real aliases and activity exist | Partially closed; readout blocked by learner activity |
| R-011 | Phase 64 keeps feature/runtime work blocked and creates a concrete outreach execution path before any first-fix selection | Mitigated for evidence-backed delivery discipline |
| R-013 | Phase 64 is docs/outreach-tracker governance only and does not modify runtime/schema/content/prompt/provider/deploy files; runtime gates are not required | Closed for docs-only outreach tracking |

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
