# Phase 7: Baseline Blocker Closure

Date: 2026-05-12

## Role-Gate Compliance

Vai chinh: DevOps / Cloud Engineer
Vai phoi hop: CTO / Tech Lead, Backend Engineer, QA Automation Engineer

This Phase 7 blocker closure pass was started under the mandatory role-gate workflow:

- `task-startup-checklist.md` was read.
- `task-role-router.md` was read.
- The DevOps / Cloud Engineer, CTO / Tech Lead, Backend Engineer, and QA Automation Engineer profiles were read.
- The task domain is local environment readiness, Prisma generation, service health, and smoke verification.
- Runtime UI source, database schema, content JSON, and deploy config were not edited.

## Phase Objective

Phase 7 closes the remaining Phase 6 baseline blockers:

1. Stop the local web/Node process holding the Prisma query engine DLL.
2. Rerun `pnpm db:generate`.
3. Restart web and AI services.
4. Confirm web, AI, DB, Redis, and dev-auth readiness.
5. Run full local smoke.
6. Record remaining release guardrails.

## Execution Summary

| Item | Status | Evidence | Owner |
| --- | --- | --- | --- |
| Prisma DLL lock | Closed | Stopped repo-local Next/PostCSS processes; exclusive DLL open changed to `UNLOCKED` | Backend Engineer |
| Prisma generate | Closed | `pnpm db:generate` passed and generated Prisma Client v6.19.2 | Backend Engineer |
| Redis/Postgres readiness | Closed | `docker compose ps` shows Postgres and Redis healthy | DevOps / Cloud Engineer |
| Env/service audit | Closed | `pnpm env:audit:services` passed with no env issues | DevOps / Cloud Engineer |
| Web health | Closed | `http://localhost:3012/api/v1/health` returned 200 with DB connected | DevOps / Cloud Engineer |
| Dev auth readiness | Closed | Learner dev-auth login returned 307 and a `fuxie-dev-user=learner` cookie | QA Automation Engineer |
| AI health | Closed | `http://localhost:3001/health` returned 200 and `fuxie-ai-service` | DevOps / Cloud Engineer |
| Full local smoke | Closed | `pnpm smoke:full-local` passed with `SMOKE_WEB_URL=http://localhost:3012` and `SMOKE_AI_URL=http://localhost:3001` | QA Automation Engineer |

## Process Closure

Stopped repo-local web processes that were holding the Prisma generated query engine DLL:

- Next dev process on port 3012.
- Next server child process.
- Web PostCSS child process.

Codex kernel and unrelated Node processes were not stopped.

After stopping these processes, the Prisma query engine DLL check returned:

```text
UNLOCKED
```

## Prisma Generate Result

Command run:

```text
pnpm db:generate
```

Result:

```text
Generated Prisma Client (v6.19.2) to .\..\..\apps\web\generated\prisma in 220ms
```

Warnings remain non-blocking:

- `package.json#prisma` is deprecated and should be migrated before Prisma 7.
- `prisma.config.ts` overrides deprecated `package.json#prisma`.
- Preview feature `driverAdapters` is deprecated.

`git status --short` after the command showed no new tracked changes beyond the known dirty groups.

## Service Restart

Started services:

- Web dev server: `pnpm --dir apps/web dev --port 3012`
- AI service: `pnpm --filter @fuxie/ai-service dev`
- Docker services: Postgres and Redis were already healthy.

Health checks:

| Check | Result |
| --- | --- |
| Web health | 200, DB connected |
| AI health | 200, service `fuxie-ai-service`, Redis queues healthy |
| Dev auth learner login | 307, dev-auth cookie returned |
| `pnpm env:audit:services` | Pass, no env issues |

## Full Local Smoke Result

Command run:

```text
SMOKE_WEB_URL=http://localhost:3012 SMOKE_AI_URL=http://localhost:3001 pnpm smoke:full-local
```

Result: pass.

Smoke coverage passed:

- AI health.
- Web DB health.
- Learner pages: dashboard, vocabulary, grammar, reading, listening, writing, speaking, exam, review, chat.
- Learner APIs: auth, vocabulary, themes, listening, reading, exams, personalization, SRS due.
- Teacher page and classrooms API.
- Admin page and ops API.

Notable timing note:

- Learner dashboard cold request took 8357ms; warm retry took 261ms.
- This is acceptable as smoke evidence but should be monitored as performance trend, not ignored.

## Current Running Local Services

After Phase 7:

- Docker Postgres is healthy at host port 5434.
- Docker Redis is healthy at host port 6380.
- Web dev server is running on port 3012.
- AI service is running on port 3001.

## Remaining Release Guardrails

| Guardrail | Status | Owner | Next action |
| --- | --- | --- | --- |
| Runtime UI dirty signoff | Open | Frontend Engineer + Product Designer | Accept, split, or hold out dirty UI diffs before release candidate |
| `apps/web/public/sw.js` artifact policy | Open before release | CTO / Tech Lead | Regenerate from clean build or restore by repo policy |
| Gate currency before release slice | Open before release | QA Automation Engineer | Rerun required gates if tracked source changes are included |
| Dashboard cold-start performance | Watch | CTO / Tech Lead | Treat as performance trend item if repeated after warm build |

## Git Status After Phase 7

`git status --short` after Phase 7 commands:

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

No new tracked runtime/schema/content/deploy changes were introduced by Phase 7 commands.

## Phase 7 Acceptance Status

| Criterion | Status |
| --- | --- |
| Prisma generate blocker closed | Pass |
| Redis/Postgres service readiness confirmed | Pass |
| Web health and dev-auth readiness confirmed | Pass |
| AI health confirmed | Pass |
| Full local smoke passed | Pass |
| Runtime code/schema/content/deploy config untouched | Pass |
| Remaining release guardrails documented | Pass |

## Next Planned Step: Phase 8 Release Candidate Governance

Phase 8 should prepare the governance path for a release candidate:

1. Decide whether runtime UI dirty files are accepted, split, or held out.
2. Decide `apps/web/public/sw.js` keep/regenerate/restore policy.
3. Rerun release gates if source changes are accepted into a release slice.
4. Produce a baseline acceptance note with residual risks and owners.
