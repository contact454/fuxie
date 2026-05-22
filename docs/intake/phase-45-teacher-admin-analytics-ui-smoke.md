# Phase 45: Teacher / Admin Analytics UI Smoke Slice

Date: 2026-05-13

## Role-Gate Compliance

Vai chinh: Product Manager EdTech
Vai phoi hop: QA Automation Engineer, Data / Analytics Engineer

The Project Manager routed this as a product/QA verification cycle. QA Automation Engineer profile was read; Data / Analytics Engineer owns metric interpretation through existing analytics helpers and endpoints.

## Objective

Verify teacher/admin analytics UI confidence and separate real product blockers from local environment blockers.

## Evidence Collected

Command:

```bash
pnpm smoke:full-local
```

Observed result:

- Learner pages rendered with HTTP 200 for `/dashboard`, `/vocabulary`, `/grammar`, `/reading`, `/listening`, `/writing`, `/speaking`, `/exam`, `/review`, and `/chat`.
- Web DB health returned 503 because Prisma could not reach `127.0.0.1:5434`.
- AI health failed with network error because AI service was not reachable.
- Learner APIs returned 500 because DB-backed dependencies were unavailable.
- Teacher page, teacher classrooms API, admin page, and admin ops API failed under the same DB/API prerequisite issue.
- `pnpm env:audit:services` also warned DB and Redis were unreachable.
- `docker compose up -d postgres redis` was blocked because Docker Desktop daemon was not running.

## Product Interpretation

The smoke did not clear teacher/admin analytics UI. It also did not prove a teacher/admin product regression because the local DB/Redis/AI prerequisites were unavailable.

The current state is **blocked pending environment readiness**.

## Required Smoke Matrix

| Surface | Required check | Acceptance signal |
| --- | --- | --- |
| Teacher home | `/teacher` loads with teacher role | HTTP 200 and no server error page |
| Teacher classrooms | `/api/v1/teacher/classrooms` | `success` response |
| Admin home | `/admin` loads with admin role | HTTP 200 and no server error page |
| Admin ops | `/api/v1/admin/ops/summary` | `success` response |
| Admin activation analytics | `/api/v1/admin/analytics/activation` | Admin-only JSON readout |
| Admin learning progress analytics | `/api/v1/admin/analytics/learning-progress` | Admin-only JSON readout |
| Admin motivation analytics | `/api/v1/admin/analytics/motivation-loop` | Admin-only JSON readout |
| Admin AI eval analytics | `/api/v1/admin/analytics/ai-eval` | Admin-only JSON readout |

## Acceptance Status

Accepted:

- Smoke script covers teacher and admin role paths.
- Analytics route tests exist in the repo for activation, learning progress, motivation loop, gamification pilot, and AI eval readouts.

Blocked:

- Local DB/Redis and AI service prerequisites.
- Teacher/admin UI smoke final pass.

## Next Action

Start DB/Redis and AI service, then rerun `pnpm smoke:full-local`. If it passes, run focused admin analytics route tests before beta.
