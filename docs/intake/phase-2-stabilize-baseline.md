# Phase 2: Stabilize The Baseline

Date: 2026-05-12

## Role-Gate Compliance

Vai chinh: Operations Manager
Vai phoi hop: CTO / Tech Lead, QA Automation Engineer, Project Manager / Delivery Manager

This Phase 2 stabilization pass was started under the mandatory role-gate workflow:

- `task-startup-checklist.md` was read.
- `task-role-router.md` was read.
- The Operations Manager, CTO / Tech Lead, QA Automation Engineer, and Project Manager / Delivery Manager profiles were read.
- The task domain is intake operations and baseline stabilization.
- Runtime UI source, app APIs, database schema, AI service behavior, content JSON, and deploy config are not changed in Phase 2 unless CTO + Operations approve a confirmed P0 blocker fix.

## Phase Objective

Phase 2 runs on Day 8-14. The goal is to convert Phase 1 audit evidence into a stable baseline decision: classify every dirty file group, document generated artifact handling, verify DB/Prisma readiness, verify env/service readiness, define smoke blockers, update P0 risks, and decide whether Phase 3 can begin.

## Day 8: Dirty Tree & Artifact Control

`git status --short` was captured before Phase 2 checks:

```text
 M .gitignore
 M apps/web/public/sw.js
 M apps/web/src/app/globals.css
 M apps/web/src/components/dashboard/dashboard-client.tsx
 M apps/web/src/components/gamification/quest-visuals.tsx
 M apps/web/src/components/leaderboard/LeaderboardClient.tsx
 M apps/web/src/components/vocabulary/practice-hub.tsx
 M apps/web/src/components/vocabulary/vocabulary-client.tsx
?? .agents/
?? AGENTS.md
?? docs/intake/
```

Final Phase 2 dirty tree classification:

| Group | Files / areas | Classification | Owner | Phase 2 decision |
| --- | --- | --- | --- | --- |
| G1: Governance docs | `.agents/`, `AGENTS.md`, `.gitignore` | Intentional operating model and workflow governance | Operations Manager | Keep grouped as governance/docs change set |
| G2: Intake docs | `docs/intake/` | Intentional intake and baseline documentation | Operations Manager | Keep grouped as intake change set |
| G3: Runtime UI diffs | `apps/web/src/app/globals.css`, dashboard, gamification, leaderboard, vocabulary components | Pre-existing runtime UI dirty files; not edited in Phase 2 | Frontend Engineer + Product Designer | Do not release until intent/risk is audited and grouped |
| G4: Generated artifact | `apps/web/public/sw.js` | Build-generated service worker artifact changed by `pnpm build` | CTO / Tech Lead | Keep as current generated artifact for now; regenerate from a clean build or restore by CTO decision before release |
| G5: Local ignored outputs | `tmp/content-qa-report.md` if present | Local QA output, ignored | QA Automation Engineer | Do not commit |

`apps/web/public/sw.js` decision:

- The file is a minified generated service worker artifact.
- `pnpm build` in Phase 1 passed and changed this tracked file.
- Phase 2 does not hand-edit or restore it.
- Current decision: keep it in the working tree as the latest generated artifact evidence.
- Before any release candidate, CTO must choose one explicit path:
  - Regenerate it from a clean build and include it in the release slice, or
  - Restore it if the repo policy is to avoid committing this generated output.

## Day 9: DB/Prisma Readiness

Command run:

```text
pnpm db:generate
```

Result: Fail.

Evidence:

```text
Prisma schema loaded from prisma\schema.prisma
Error:
EPERM: operation not permitted, rename 'C:\Users\DMF Schule\9-Fuxie\apps\web\generated\prisma\query_engine-windows.dll.node.tmp26704' -> 'C:\Users\DMF Schule\9-Fuxie\apps\web\generated\prisma\query_engine-windows.dll.node'
```

Additional notes:

- Prisma emitted warnings about deprecated `package.json#prisma`, Prisma config override, and deprecated preview feature `driverAdapters`.
- `git status --short` after the command showed no new tracked changes beyond the known dirty groups.
- No `db:push`, `db:migrate`, or destructive DB command was run.

Phase 2 status: DB/Prisma generate is blocked by a local file permission or file lock issue on Windows. Backend Engineer + CTO own the next action.

## Day 10: Env & Service Readiness

Command run:

```text
pnpm env:audit
```

Result: Pass.

Evidence:

```text
[env-audit] No env issues found
```

`git status --short` after the command showed no new tracked changes.

Command run:

```text
pnpm env:audit:services
```

Result: Pass with service warning.

Evidence:

```text
[env-audit] WARN .env: REDIS_URL target is not reachable at localhost:6380
[env-audit] WARN apps/web/.env: REDIS_URL target is not reachable at localhost:6380
```

`git status --short` after the command showed no new tracked changes.

Phase 2 status: env shape is valid, but Redis service readiness is blocked/unavailable locally.

## Day 11: Auth & Smoke Readiness

`pnpm smoke:full-local` was not run because prerequisites are not fully available.

Observed smoke prerequisites from `scripts/smoke-full-local.ts`:

- Web app must be reachable at `SMOKE_WEB_URL` or `http://localhost:3000`.
- AI service must be reachable at `SMOKE_AI_URL`, `AI_SERVICE_URL`, or `http://localhost:3001`.
- Dev auth login must return cookies for learner, teacher, and admin.
- Web DB health must return connected.
- Redis/service readiness is currently warned as unavailable by `pnpm env:audit:services`.

Blocked status:

| Smoke area | Status | Blocker / next action | Owner |
| --- | --- | --- | --- |
| Learner role smoke | Blocked | Start web app with dev auth and ready DB/Redis services | QA Automation Engineer |
| Teacher role smoke | Blocked | Start web app with dev auth and ready DB/Redis services | QA Automation Engineer |
| Admin role smoke | Blocked | Start web app with dev auth and ready DB/Redis services | QA Automation Engineer |
| AI health smoke | Blocked | Start AI service at configured smoke URL | AI / LLM Engineer |
| Web DB health | Blocked | Confirm DB and Redis service readiness | DevOps / Cloud Engineer |

Executable smoke plan when prerequisites are ready:

1. Start required local services: DB, Redis on configured port, web app, AI service.
2. Confirm `FUXIE_DEV_AUTH_ENABLED=true` for local smoke only.
3. Run `pnpm env:audit:services`.
4. Run `pnpm smoke:full-local`.
5. Capture pass/fail by learner, teacher, admin, AI health, and Web DB health.
6. Inspect `git status --short` after the command and document any generated changes.

## Day 12-13: Risk Closure

| Risk | Phase 2 evidence | Status | Owner | Next action | Acceptance signal |
| --- | --- | --- | --- | --- | --- |
| R-001 | Dirty tree is fully classified into governance docs, intake docs, runtime UI diffs, generated `sw.js`, and local ignored outputs | Partially closed | Project Manager / Delivery Manager | Audit runtime UI intent/risk before release | No unknown high-risk diff remains |
| R-002 | Phase 1 main gates remain current and green; no runtime source was edited in Phase 2 | Evidence current | QA Automation Engineer | Rerun only if tracked source changes require it | Gate log remains current |
| R-003 | `pnpm env:audit` passes; `pnpm env:audit:services` warns Redis unreachable | Open for service readiness | DevOps / Cloud Engineer | Start/verify Redis at `localhost:6380` or update env | Service audit has no readiness warnings |
| R-004 | Full local smoke not run because services are not ready; role smoke plan is documented | Open | QA Automation Engineer | Run `pnpm smoke:full-local` when web, AI, DB, Redis, and dev auth are ready | Learner/teacher/admin smoke result captured |
| R-005 | `pnpm db:generate` fails on Windows EPERM rename of Prisma query engine DLL | Open | Backend Engineer | Clear file lock/permission issue and rerun generate | `pnpm db:generate` passes with no unexpected tracked changes |

## Day 14: Baseline Acceptance Review

Baseline acceptance checklist:

| Criterion | Status | Evidence |
| --- | --- | --- |
| Working tree classified | Pass with release caveat | All known dirty files are assigned to groups and owners |
| Unknown high-risk diffs removed | Pass for unknowns; open for runtime intent | No unknown group remains, but runtime UI intent still needs Frontend/Product audit |
| Main release gates current | Pass | Phase 1 `check:quick`, `test:core`, `qa:content`, `security:secrets`, and `build` passed |
| DB/Prisma generate status documented | Fail/open | `pnpm db:generate` failed with EPERM rename |
| Env shape documented | Pass | `pnpm env:audit` passed |
| Service readiness documented | Blocked/open | Redis at `localhost:6380` unreachable |
| Learner/teacher/admin smoke documented | Blocked/open | Smoke plan exists; execution awaits local services |
| `sw.js` decision documented | Pass with release caveat | Keep as generated artifact evidence; CTO must regenerate or restore before release candidate |
| Runtime feature expansion still frozen | Pass | No feature work opened in Phase 2 |

Phase 3 readiness decision:

- Phase 3 Product Repositioning can start as planning and product strategy work.
- Phase 3 should not assume release readiness until R-003, R-004, and R-005 are closed or explicitly accepted by CTO + Operations.
- Runtime UI dirty files remain frozen for implementation until their intent/risk is audited.

## Phase 2 Stabilization Backlog

| Item | Priority | Owner | Next action | Acceptance signal |
| --- | --- | --- | --- | --- |
| Clear Prisma generate EPERM | P0 | Backend Engineer + CTO / Tech Lead | Stop locking process or fix permissions for `apps/web/generated/prisma/query_engine-windows.dll.node`, then rerun `pnpm db:generate` | Generate passes with no unexpected tracked changes |
| Restore Redis service readiness | P0 | DevOps / Cloud Engineer | Start Redis at `localhost:6380` or align env to reachable Redis | `pnpm env:audit:services` has no Redis warning |
| Execute full local smoke | P0 | QA Automation Engineer | Run once web, AI, DB, Redis, and dev auth are ready | Learner, teacher, admin, AI health, and DB health smoke results captured |
| Decide generated `sw.js` policy | P1 | CTO / Tech Lead | Regenerate from clean build or restore by policy before release candidate | Release slice contains explicit artifact decision |
| Audit runtime UI dirty files | P1 | Frontend Engineer + Product Designer | Review dashboard/gamification/leaderboard/vocabulary diffs for intent and UX risk | Runtime UI group accepted, split, or reverted by owner decision |

## Next Planned Step: Phase 3 Product Repositioning

Recommended Phase 3 planning focus:

1. Confirm North Star for Fuxie as an AI-powered German learning platform for Vietnamese learners.
2. Reframe roadmap into Learn, Coach, and Motivate pillars.
3. Audit learner dashboard/onboarding against the new positioning.
4. Audit AI tutor, speaking/writing feedback, rewards, and teacher/admin support as product pillars.
5. Keep engineering implementation frozen until the remaining Phase 2 P0 blockers are closed or accepted.
