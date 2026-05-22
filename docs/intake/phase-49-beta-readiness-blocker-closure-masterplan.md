# Phase 49: Beta Readiness Blocker Closure Masterplan

Date: 2026-05-13

## Role-Gate Compliance

Vai chinh: Project Manager / Delivery Manager
Vai phoi hop: Operations Manager, CTO / Tech Lead, Product Manager EdTech

This masterplan was started under the mandatory role-gate workflow:

- `task-startup-checklist.md` was read.
- `task-role-router.md` was read.
- Project Manager / Delivery Manager was selected because this is a multi-workstream blocker closure sprint.
- Operations Manager, CTO / Tech Lead, and Product Manager EdTech profiles were read as support roles.

## Goal

Close, downgrade, or formally accept the seven open beta-readiness blocker groups identified in Phase 48 so Fuxie can make a clear beta decision:

- `beta-ready`
- `beta-ready with exclusions`
- `not beta-ready`

This phase is a delivery masterplan and tracking document. It does not change runtime code, schema, content JSON, AI prompts, provider config, or deploy config.

## Owner Matrix

| Workstream | Primary owner | Support roles | Current status | Acceptance signal |
| --- | --- | --- | --- | --- |
| Local service readiness | DevOps / Cloud Engineer | CTO / Tech Lead, QA Automation Engineer | Open; latest service audit warned DB/Redis unavailable | `pnpm env:audit:services` passes without DB/Redis warnings and AI health is reachable |
| Full local smoke | QA Automation Engineer | DevOps / Cloud Engineer, Product Manager EdTech | Blocked by service readiness | `pnpm smoke:full-local` passes or every failure has owner and blocker reason |
| Provider-backed AI eval | AI / LLM Engineer | CTO / Tech Lead, German Academic Lead | Blocked by missing provider key | `pnpm check:ai-eval` has provider run completed, or blocker is accepted with conservative AI wording |
| Academic Lead final signoff | Head of German Pedagogy / Academic Lead | AI / LLM Engineer, Content QA / Linguistic Reviewer | Open; signoff pending | AI signoff JSON and content A1-B2 sample decisions have no beta-critical pending cases |
| Speaking/audio smoke | Speech / Audio Engineer | AI / LLM Engineer, QA Automation Engineer | Blocked by service/provider readiness | Permission denied, provider unavailable, low-confidence transcript, success path, and privacy behavior are documented |
| Teacher/admin analytics UI smoke | Product Manager EdTech | QA Automation Engineer, Data / Analytics Engineer | Blocked by DB/API readiness | Teacher/admin pages and admin analytics readouts load under correct roles |
| Legal/privacy beta review | Legal / Compliance Advisor | Security / Privacy Consultant, CEO / General Manager | Open; not formally reviewed | Approved beta claim matrix and data-handling notes exist |

## Dependency Order

1. Restore local service readiness.
2. Run service checks.
3. Run core static/test gates.
4. Run AI eval gate.
5. Run full local smoke.
6. Complete Academic Lead signoff and content sample decisions.
7. Run speaking/audio smoke.
8. Run teacher/admin analytics UI smoke.
9. Complete legal/privacy beta review.
10. Produce beta readiness decision.

## Command Checklist

| Step | Command or action | Owner | Expected result | If blocked |
| --- | --- | --- | --- | --- |
| Service static audit | `pnpm env:audit` | DevOps / Cloud Engineer | No env issues | Document exact env file/key blocker without printing secrets |
| Service availability audit | `pnpm env:audit:services` | DevOps / Cloud Engineer | DB and Redis reachable | Mark service readiness blocked; do not run full smoke as product failure |
| Typecheck | `pnpm check:quick` | QA Automation Engineer | Pass | Assign failing package to CTO / owning engineer |
| Core tests | `pnpm test:core` | QA Automation Engineer | Pass | Assign failing suite owner and block beta decision |
| Content QA | `pnpm qa:content` | Content QA / Linguistic Reviewer | 0 errors, 0 warnings | Assign blockers to Academic Lead + Content QA |
| Secret audit | `pnpm security:secrets` | Security / Privacy Consultant | Pass | Escalate immediately; do not continue beta claim review |
| AI eval gate | `pnpm check:ai-eval` | AI / LLM Engineer | Offline pass and provider run complete or accepted blocker | Keep AI claims practice-only |
| Full local smoke | `pnpm smoke:full-local` | QA Automation Engineer | Pass | Classify each failure as service, role/auth, API, AI, or product blocker |

Provider keys must only be supplied through the local environment and must never be written to docs, logs, commits, or screenshots.

## Evidence Log Template

| Workstream | Status | Evidence | Owner decision | Risk update |
| --- | --- | --- | --- | --- |
| Local service readiness | pending | n/a | pending | R-003/R-004/R-010 |
| Full local smoke | pending | n/a | pending | R-004/R-010 |
| Provider-backed AI eval | pending | n/a | pending | R-007 |
| Academic Lead final signoff | pending | n/a | pending | R-006/R-007 |
| Speaking/audio smoke | pending | n/a | pending | R-008 |
| Teacher/admin analytics UI smoke | pending | n/a | pending | R-010 |
| Legal/privacy beta review | pending | n/a | pending | Legal/compliance |

## Beta Decision Rules

| Decision | Required conditions |
| --- | --- |
| `beta-ready` | Service audit, core gates, AI eval, full smoke, Academic Lead signoff, speaking/audio smoke, teacher/admin smoke, and legal/privacy review all pass or are non-applicable |
| `beta-ready with exclusions` | Core learner beta gates pass, but one or more non-core surfaces are explicitly excluded from beta claims, such as speaking/audio or teacher/admin |
| `not beta-ready` | Core learner gates fail, privacy/security risk remains open, AI/content claims cannot be safely worded, or service smoke cannot be completed/accepted |

## Scope Guardrails

- Do not add features while closing these blockers.
- Do not change schema, prompts, content JSON, or deploy config unless a later routed implementation task approves it.
- Do not count reward-only behavior as learning progress.
- Do not market official Goethe/Telc/OSD scoring.
- Treat missing Docker/local services as blocked prerequisites, not product failure.
- Treat provider eval without keys as blocked; keep AI wording conservative.

## Risk Register Updates Required After Execution

| Risk | Required update |
| --- | --- |
| R-006 | Academic signoff status for content and exam-claim samples |
| R-007 | Provider-backed eval status and AI claim decision |
| R-008 | Speaking/audio browser/provider smoke status |
| R-010 | Teacher/admin analytics UI smoke status |
| R-013 | Service/static gate and CI hygiene status |

## Acceptance Criteria

Phase 49 is accepted when:

- All seven blocker groups have owner, dependency, command/action, and acceptance signal.
- Execution can be run without implementer decision-making.
- Beta decision rules are explicit.
- README links this phase.
- Risk register records that Phase 49 creates the closure sprint plan.
- Documentation hygiene passes.

## Next Planned Step

Execute **Phase 50: Beta Readiness Blocker Closure Sprint** using this masterplan as the source of truth. Phase 50 should collect live command evidence, service status, signoff artifacts, smoke results, legal/privacy decision, and the final beta readiness verdict.
