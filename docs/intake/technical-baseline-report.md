# Fuxie Technical Baseline Report

Date: 2026-05-12

## Baseline Goal

Create a reliable technical baseline before feature expansion. The baseline must describe what exists, what is verified, what is blocked, and what needs owner follow-up.

## System Map

| Subsystem | Path | Responsibility | Baseline status |
| --- | --- | --- | --- |
| Web app | `apps/web` | Learner, teacher, admin, auth, API routes, UI | Existing; current dirty UI files require classification |
| AI service | `apps/ai-service` | Chat, generation, grading, audio, health | Existing; provider and queue smoke required |
| STT service | `services/stt-service` | Speech-to-text support | Existing; integration status unknown |
| Database package | `packages/database` | Prisma schema/client workflow | Existing; drift/generate status must be verified |
| SRS engine | `packages/srs-engine` | Spaced repetition logic | Existing; included in `test:core` |
| Shared packages | `packages/shared`, `packages/ui` | Shared logic and UI | Existing; audit for runtime imports needed |
| Content | `content/` | CEFR learning data | Existing; content QA required |
| Assets | `apps/web/public`, `assets/`, `blender/` | Mascot, reward, audio/image/model assets | Existing; production asset map required |
| Scripts | `scripts/` | QA, smoke, perf, seed, sync, generation tooling | Existing; runtime/tooling separation required |

## Verification Gates

| Gate | Command | Owner | Baseline expectation |
| --- | --- | --- | --- |
| Typecheck | `pnpm check:quick` | QA Automation Engineer | Must pass before baseline acceptance |
| Core tests | `pnpm test:core` | QA Automation Engineer | Must pass or failures documented with owner |
| Content QA | `pnpm qa:content` | Content QA / Linguistic Reviewer | Must pass or content blockers documented |
| Secret audit | `pnpm security:secrets` | Security / Privacy Consultant | Must pass |
| Production build | `pnpm build` | CTO / Tech Lead | Must pass before release candidate |
| Bundle budget | `pnpm check:bundle` | CTO / Tech Lead | Must pass after production build |
| Local smoke | `pnpm smoke:full-local` | DevOps / Cloud Engineer | Run when DB/Redis/local services are available |
| Production smoke | `pnpm smoke:production` | DevOps / Cloud Engineer | Run only with correct production env and safeguards |
| Performance trend | `pnpm perf:local:warn` | CTO / Tech Lead | Trend signal, not sole release blocker |

## Phase 1 Current Gate Results

Collected on 2026-05-12:

| Gate | Command | Status | Notes |
| --- | --- | --- | --- |
| Typecheck | `pnpm check:quick` | Pass | Turbo typecheck passed; web route types generated |
| Core tests | `pnpm test:core` | Pass | SRS: 5 tests; web: 94 tests; AI service: 14 tests |
| Content QA | `pnpm qa:content` | Pass | 1191 files scanned; 0 errors, 0 warnings |
| Secret audit | `pnpm security:secrets` | Pass | No secret literals found |
| Production build | `pnpm build` | Pass | Build passed; generated `apps/web/public/sw.js` changed and needs classification |
| Local smoke | `pnpm smoke:full-local` | Not run | Requires local service readiness decision |
| Production smoke | `pnpm smoke:production` | Not run | Requires production env safeguards |
| Performance trend | `pnpm perf:local:warn` | Not run | Trend-only gate, not required for Day 2 evidence |

## Phase 2 Stabilization Results

Collected on 2026-05-12:

| Check | Command | Status | Notes |
| --- | --- | --- | --- |
| Dirty tree capture | `git status --short` | Classified | Known groups: governance docs, intake docs, runtime UI diffs, generated `sw.js`, local ignored outputs |
| Generated service worker artifact | `git diff -- apps/web/public/sw.js` | Decision recorded | Keep as latest generated artifact evidence for now; CTO must regenerate from clean build or restore by policy before release candidate |
| Prisma generate | `pnpm db:generate` | Fail/open | Fails on Windows `EPERM` rename for `apps/web/generated/prisma/query_engine-windows.dll.node`; no new tracked changes appeared afterward |
| Env audit | `pnpm env:audit` | Pass | No env issues found |
| Service env audit | `pnpm env:audit:services` | Pass with warning | Redis target at `localhost:6380` is not reachable in root `.env` and `apps/web/.env` |
| Full local smoke | `pnpm smoke:full-local` | Blocked | Not run because local service prerequisites are not ready |

## Phase 6 First Backlog Execution Results

Collected on 2026-05-12:

| Check | Command / evidence | Status | Notes |
| --- | --- | --- | --- |
| Redis service readiness | `docker compose up -d redis` then `pnpm env:audit:services` | Pass | Redis is healthy at `localhost:6380`; env service audit reports no issues |
| Postgres service readiness | `docker compose ps` | Pass | `fuxie-postgres-vector` is healthy at host port 5434 |
| Prisma generate | `pnpm db:generate` | Fail/open | Still fails with Windows `EPERM` rename of Prisma query engine DLL |
| Prisma file lock | Exclusive open check on `apps/web/generated/prisma/query_engine-windows.dll.node` | Blocked | File is locked by another process, likely active local Node/Next process |
| Web health | `http://localhost:3012/api/v1/health` | Fail/open | Returns 500 Internal Server Error |
| Dev auth smoke prerequisite | `http://localhost:3012/api/dev-auth/login?role=learner&redirect=%2Fdashboard` | Fail/open | Returns 500 response |
| AI health | `http://localhost:3001/health` | Blocked/open | Unable to connect |
| Full local smoke | `pnpm smoke:full-local` | Not run | Known prerequisites fail, so full smoke is deferred |
| Generated `sw.js` policy | `apps/web/next.config.ts` Serwist config | Classified | `public/sw.js` is generated by `@serwist/next` and should not be hand-edited |
| Runtime UI dirty audit | Git diff review | Classified | UI diffs need Product Designer + Frontend signoff before release |

## Phase 7 Baseline Blocker Closure Results

Collected on 2026-05-12:

| Check | Command / evidence | Status | Notes |
| --- | --- | --- | --- |
| Prisma DLL lock | Stopped repo-local Next/PostCSS processes, then exclusive open check | Pass | Prisma query engine DLL became unlocked |
| Prisma generate | `pnpm db:generate` | Pass | Generated Prisma Client v6.19.2 to `apps/web/generated/prisma`; no new tracked changes |
| Docker services | `docker compose ps` | Pass | Postgres healthy at 5434; Redis healthy at 6380 |
| Env service audit | `pnpm env:audit:services` | Pass | No env issues found |
| Web health | `http://localhost:3012/api/v1/health` | Pass | 200, DB connected |
| Dev auth | `/api/dev-auth/login?role=learner&redirect=/dashboard` | Pass | 307 with `fuxie-dev-user=learner` cookie |
| AI health | `http://localhost:3001/health` | Pass | 200, `fuxie-ai-service`, Redis queues healthy |
| Full local smoke | `SMOKE_WEB_URL=http://localhost:3012 SMOKE_AI_URL=http://localhost:3001 pnpm smoke:full-local` | Pass | Learner, teacher, admin, AI health, DB health, and core learner APIs passed |

## Phase 8 Release Candidate Governance Results

Collected on 2026-05-12:

| Gate | Command | Status | Notes |
| --- | --- | --- | --- |
| Typecheck | `pnpm check:quick` | Pass | Turbo typecheck passed; web route types generated |
| Core tests | `pnpm test:core` | Pass | SRS 5 tests, web 94 tests, AI service 14 tests passed |
| Content QA | `pnpm qa:content` | Pass | 1191 files scanned; 0 errors, 0 warnings |
| Secret audit | `pnpm security:secrets` | Pass | No secret literals found in tracked or untracked files |
| Production build | `pnpm build` | Pass | AI service and Next.js production build passed; Serwist bundled `/sw.js`; 74 static pages generated |
| Web health after build | `http://localhost:3012/api/v1/health` | Pass | Web dev server restarted after build; DB connected |

Release candidate governance status:

- Runtime UI diffs are conditionally accepted for RC candidate preparation, pending Product Designer + QA signoff before final release.
- `apps/web/public/sw.js` is treated as a clean-build generated Serwist artifact and must not be hand-edited.
- Final release still requires staging/commit grouping and optional visual QA for the runtime UI slice.

## Phase 10 Visual QA Results

Collected on 2026-05-12:

| Check | Evidence | Status | Notes |
| --- | --- | --- | --- |
| Desktop visual QA | `/leaderboard` and `/vocabulary` at `1280x720` | Pass | Empty state and vocabulary world map load into readable desktop layouts after skeleton state resolves |
| Mobile visual QA | `/dashboard`, `/vocabulary`, `/vocabulary/practice`, `/leaderboard` at `390x844` | Pass | Bottom nav, CTAs, mascot imagery, and first-path vocabulary cards remain readable and usable |
| Browser log review | In-app browser console warning/error collection | Pass with P2 note | One Next.js image priority warning for a dashboard mascot LCP image |
| Static UI state review | `vocabulary-client.tsx`, `practice-hub.tsx`, `LeaderboardClient.tsx`, `quest-visuals.tsx` | Pass with P2 note | Leaderboard error state exists; vocabulary CTA API failure should gain user-visible feedback later |

## Phase 11 Staging Preparation Results

Collected on 2026-05-12:

| Check | Evidence | Status | Notes |
| --- | --- | --- | --- |
| Staging group plan | Governance, intake docs, runtime UI, generated `sw.js`, and hold-outs are separated | Pass | No git staging performed in Phase 11 |
| RC branch plan | Suggested branch `codex/fuxie-rc-baseline` | Prepared | Create only after explicit approval |
| Commit plan | Governance/docs/runtime/generated artifact split | Prepared | Recommended to keep rollback boundaries clean |
| `sw.js` policy | Stage, regenerate, or restore options documented | Pending CTO decision | Do not decide silently |

## Phase 12 Commit Execution Results

Collected on 2026-05-12:

| Check | Evidence | Status | Notes |
| --- | --- | --- | --- |
| Branch | `codex/fuxie-release-readiness` | Active | Existing release-readiness branch used |
| Governance group | `ccab57e` | Complete | Includes Role-Gate and personnel model |
| Intake docs group | `043289f` | Complete | Includes Phase 0-12 evidence |
| Runtime UI group | `81222da` | Complete | Includes Phase 10-signed runtime UI slice |
| Generated service worker | `apps/web/public/sw.js` | Held | Pending CTO/user decision |

## Phase 13 Generated Artifact Results

Collected on 2026-05-12:

| Check | Evidence | Status | Notes |
| --- | --- | --- | --- |
| Serwist config | `swDest: 'public/sw.js'` in `apps/web/next.config.ts` | Confirmed | `public/sw.js` is production-build generated |
| Production build | `pnpm build` | Pass | Serwist bundled `/sw.js`; web generated 74 static pages |
| Generated service worker | `04d9731` | Complete | `apps/web/public/sw.js` committed separately |

## Phase 14 Release Handoff Results

Collected on 2026-05-12:

| Check | Evidence | Status | Notes |
| --- | --- | --- | --- |
| Working tree | `git status --short` | Clean | No uncommitted tracked files |
| Branch | `codex/fuxie-release-readiness` | Ready | Push not performed in Phase 14 |
| PR draft | `phase-14-pr-release-handoff.md` | Complete | Includes title, body, gates, residual risks, release notes, rollback plan |

## Phase 15 PR Creation Results

Collected on 2026-05-12:

| Check | Evidence | Status | Notes |
| --- | --- | --- | --- |
| Branch push | `git push -u origin codex/fuxie-release-readiness` | Pass | Remote branch updated |
| Pull request | `https://github.com/contact454/fuxie/pull/2` | Created | Base `master`, head `codex/fuxie-release-readiness` |

## Phase 16 Merge Readiness Results

Collected on 2026-05-12:

| Check | Evidence | Status | Notes |
| --- | --- | --- | --- |
| PR mergeability | `gh pr view 2` | Pass | PR is mergeable |
| CI | `verify` | Pass | 2m59s |
| Vercel deployment | Vercel status context | Pass | Deployment completed |
| Vercel Preview Comments | Check run | Pass | Completed |
| Local working tree | `git status --short` | Pass | Clean |

## Phase 18 Post-Merge Verification Results

Collected on 2026-05-12:

| Check | Evidence | Status | Notes |
| --- | --- | --- | --- |
| PR merge | PR #2 | Pass | Merged at `2026-05-12T06:52:00Z` |
| Merge commit | `38e95e0c01e30bbbcc6101c7c320d51a2ae5a28d` | Pass | Local `master` HEAD matches |
| Master CI | `https://github.com/contact454/fuxie/actions/runs/25718494244` | Pass | Completed successfully |
| Working tree | `git status --short` | Pass | Clean |

## Phase 2 Smoke Prerequisites

`scripts/smoke-full-local.ts` requires:

- Web app reachable at `SMOKE_WEB_URL` or `http://localhost:3000`.
- AI service reachable at `SMOKE_AI_URL`, `AI_SERVICE_URL`, or `http://localhost:3001`.
- Dev auth login enabled and returning cookies for learner, teacher, and admin.
- Web DB health endpoint returning connected.
- DB/Redis/service dependencies available locally.

Current Phase 7 status: Redis, Postgres, web health, dev-auth, AI health, and full local smoke are passing for the local baseline.

## Engineering Intake Rules

- Classify current dirty files before editing them.
- Keep content JSON changes separate from app runtime changes.
- Keep AI service changes separate from web UI changes unless a flow requires both.
- Avoid schema changes until DB drift and migration status are known.
- Keep local/dev auth and production auth behavior clearly separated.
- Do not commit secrets, generated local caches, or large local artifacts.

## P0 Technical Questions

- Do all protected learner, teacher, and admin routes enforce role boundaries?
- Does current Prisma state match generated client and deployed DB expectations?
- Can the AI service start cleanly without Redis, and with Redis when configured?
- Are provider-dependent generation/audio/grading paths safely degraded when keys are missing?
- Are cache keys user-scoped for personalized data?
- Do smoke scripts fail clearly when required services are unavailable?

## Stable Baseline Candidate Criteria

The technical baseline is stable when:

- Working tree diffs are classified and grouped.
- P0 risks in `risk-register.md` have mitigation status.
- Required verification gates have current results.
- DB and Redis availability are documented.
- AI service health and provider-dependent statuses are documented.
- Learner, teacher, admin smoke status is known.

## Current Baseline Acceptance Status

As of Phase 7:

- Working tree classification: pass with runtime UI release caveat.
- Main gate status: pass from Phase 1; still current because Phase 2 did not modify runtime source.
- DB/Prisma status: pass for local baseline after stopping the process that locked the Prisma query engine DLL.
- Redis/service readiness: closed for local Docker environment.
- Learner/teacher/admin smoke: pass for local baseline.
- `apps/web/public/sw.js`: generated artifact decision recorded; final keep/restore/regenerate policy must be confirmed before release candidate.
- Remaining release guardrails: runtime UI dirty signoff, `sw.js` release policy, and gate rerun if tracked source changes are included in a release slice.

As of Phase 8:

- Release gates are current and passing for RC candidate preparation.
- Web dev service was restored on port 3012 after production build.
- Remaining final-release guardrails are UI visual/product signoff, `sw.js` staging policy, release grouping, and rollback ownership.

As of Phase 9:

- Fuxie is accepted as a local baseline candidate for RC packaging.
- Commit groups are defined for governance, intake docs, runtime UI, and generated service worker artifact.
- Release notes and rollback owners are drafted.
- Final release is still blocked on runtime UI visual/product signoff and CTO `sw.js` staging decision.

As of Phase 10:

- Runtime UI visual/product signoff is complete for RC packaging.
- No P0/P1 visual blocker was found in the targeted browser sweep.
- Remaining final-release blocker is the CTO decision for `apps/web/public/sw.js` plus explicit staging/branch approval.
- P2 follow-ups are vocabulary CTA user-facing error feedback and dashboard mascot image priority optimization.

As of Phase 11:

- Final staging and RC branch plan is ready.
- No git staging, branch creation, or commit was performed.
- Governance and intake docs are ready to stage once approved.
- Runtime UI is ready to stage once approved.
- `apps/web/public/sw.js` remains pending CTO/user decision.

As of Phase 12:

- Approved groups G1-G3 were executed as separate commits on `codex/fuxie-release-readiness`.
- `apps/web/public/sw.js` remains the only known tracked release artifact pending decision.
- Final RC closure still needs Phase 13 artifact decision and any required final gate confirmation.

As of Phase 13:

- The generated service worker artifact decision is closed.
- `apps/web/public/sw.js` was committed separately after a passing production build.
- The RC package is ready for PR/release handoff, with only P2 polish follow-ups remaining.

As of Phase 14:

- PR / release handoff is prepared.
- Working tree is clean.
- Push and PR creation remain pending explicit approval.

As of Phase 15:

- Branch `codex/fuxie-release-readiness` is pushed.
- PR #2 is open for review.
- Next readiness signal comes from CI and reviewer feedback.

As of Phase 16:

- PR #2 is merge-ready from QA / delivery perspective.
- CI and Vercel are passing.
- Remaining follow-ups are P2 post-RC polish items.

As of Phase 18:

- The baseline RC package is merged into `master`.
- Master CI is green on the merge commit.
- Local `master` is clean and synced.
- The next work should begin from the post-merge backlog kickoff.

## Handoff Notes For Engineers

When implementing after baseline acceptance:

- Start with role routing via `.agents/workflows/task-role-router.md`.
- Prefer existing Next.js, Prisma, Turbo, and package patterns.
- Add focused tests proportional to the risk.
- Update intake documents only when a baseline fact changes.
