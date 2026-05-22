# Phase 50: Beta Readiness Blocker Closure Sprint

Date: 2026-05-13

## Role-Gate Compliance

Vai chinh: Project Manager / Delivery Manager
Vai phoi hop: Operations Manager, CTO / Tech Lead, QA Automation Engineer

This closure sprint was executed under the mandatory role-gate workflow:

- `task-startup-checklist.md` was read.
- `task-role-router.md` was read.
- Project Manager / Delivery Manager was selected because this task closes a multi-workstream release-readiness sprint.
- Operations Manager, CTO / Tech Lead, and QA Automation Engineer profiles were read as support roles.
- Specialist owner evidence was classified through the Phase 49 workstream matrix without changing runtime code, schema, content JSON, AI prompts, or deploy config.

## Sprint Objective

Execute the Phase 49 beta-readiness blocker closure masterplan, collect current evidence for the seven open blocker groups, update the risk position, and produce a final beta readiness verdict.

## Executive Verdict

Fuxie is **beta-ready with exclusions** for a controlled B2C Vietnamese learner beta.

Core learner readiness improved materially because local services were restored, static/core gates passed, AI service health was reachable, and full local smoke passed across learner, teacher, admin, API, DB, and AI health surfaces.

The beta must exclude or conservatively word these claims until the listed blockers are closed:

- No official Goethe/Telc/OSD scoring or pass/fail claims.
- No strong claim that AI grading is provider-validated or academically final.
- No precise pronunciation scoring claim.
- No provider-backed speaking/audio claim.
- No public beta marketing copy that has not passed legal/privacy review.

## Command Evidence

| Check | Result | Evidence |
| --- | --- | --- |
| `pnpm env:audit` | Pass | No env issues reported |
| Initial `pnpm env:audit:services` | Warn | DB/Redis unavailable before Docker Desktop was started |
| Docker daemon | Pass | Docker Desktop started; server version `29.2.1` |
| `docker compose up -d postgres redis` | Pass | `fuxie-postgres-vector` and `fuxie-redis` healthy |
| Rerun `pnpm env:audit:services` | Pass | No service readiness issues reported |
| AI service health | Pass | `http://localhost:3001/health` returned ok with Redis queues healthy |
| Web health | Pass | `http://localhost:3012/api/v1/health` returned ok with DB connected |
| `pnpm check:quick` | Pass | Static quick check completed |
| `pnpm test:core` | Pass | SRS 5 tests, web 178 tests, AI service 36 tests passed |
| `pnpm qa:content` | Pass | 1193 files scanned, 0 errors, 0 warnings |
| `pnpm security:secrets` | Pass | Secret audit completed |
| `pnpm check:ai-eval` | Conditional pass | Offline eval passed 5/5; provider run blocked by missing `GEMINI_API_KEY` / `GOOGLE_AI_API_KEY` |
| `pnpm smoke:full-local` | Pass | AI health, web DB health, learner pages/APIs, teacher page/API, admin page/API passed using web port 3012 and AI port 3001 |

## Seven Workstream Closure Status

| Workstream | Owner | Phase 50 status | Evidence | Remaining blocker | Acceptance signal |
| --- | --- | --- | --- | --- | --- |
| Local service readiness | DevOps / Cloud Engineer | Closed for local beta evidence | Docker Postgres/Redis healthy; `pnpm env:audit:services` passed; AI and web health reachable | Keep local services documented for future smoke runs | Service audit remains clean before beta run |
| Full local smoke | QA Automation Engineer | Closed for current source state | `pnpm smoke:full-local` passed learner, teacher, admin, API, DB, and AI checks | Rerun if source/env changes before release | Full smoke pass remains current |
| Provider-backed AI eval | AI / LLM Engineer | Blocked with accepted conservative wording | Offline eval passed 5/5; provider result blocked by missing provider key | Supply `GEMINI_API_KEY` or `GOOGLE_AI_API_KEY` through local env only | Provider-backed `pnpm check:ai-eval` completes or blocker remains explicitly accepted |
| Academic Lead final signoff | Head of German Pedagogy / Academic Lead | Open; human decision pending | Academic signoff template exists; reviewer, overall decision, and all 5 cases remain pending | Human Academic Lead must complete final signoff JSON | No beta-critical pending cases for AI/content claims |
| Speaking/audio smoke | Speech / Audio Engineer | Conditional; page smoke passed, provider/browser path still blocked | `/speaking` page passed full smoke; offline speaking eval passed; provider key and browser permission smoke not completed | Run browser permission, provider unavailable, low-confidence, success path, and privacy checks | Speaking/audio status documented with provider/browser evidence |
| Teacher/admin analytics UI smoke | Product Manager EdTech | Mostly closed for role smoke; deeper analytics readout manual check remains follow-up | Full smoke passed teacher page/API and admin page/API; route/unit tests previously covered analytics readouts | Optional manual fetch of admin activation/progress/motivation/AI readouts before wider beta | Role-scoped pages and readouts load under correct roles |
| Legal/privacy beta review | Legal / Compliance Advisor | Open; conservative guardrail accepted, formal review pending | Privacy-safe analytics rules and claim exclusions are documented | Legal/privacy owner must approve public beta claim matrix and data-handling notes | Approved claim matrix and data-handling notes exist |

## Beta Exclusion Matrix

| Area | Beta treatment | Owner to close exclusion |
| --- | --- | --- |
| AI tutor/chat | Allowed as practice support with fallback language | AI / LLM Engineer |
| Writing feedback | Allowed as practice feedback only | AI / LLM Engineer + German Academic Lead |
| Exam scoring | Excluded from official scoring/pass claims | German Academic Lead + Legal / Compliance Advisor |
| Speaking/pronunciation | Limited to practice support; no precision claim | Speech / Audio Engineer |
| Teacher/admin | Allowed for controlled internal/admin smoke; not positioned as primary beta promise | Product Manager EdTech |
| Public marketing copy | Must remain conservative until legal/privacy review | Legal / Compliance Advisor |

## Risk Decisions

| Risk | Phase 50 decision |
| --- | --- |
| R-003 | Closed for local beta evidence: env and service audits pass after Docker services were restored |
| R-004 | Closed for current source state: full local smoke passed across learner, teacher, admin, DB, and AI checks |
| R-006 | Partially mitigated: automated content QA passed, but human Academic Lead signoff remains required for stronger CEFR/exam claims |
| R-007 | Partially mitigated: offline AI eval passed; provider-backed eval remains blocked by missing provider key |
| R-008 | Conditional/open: speaking page and offline speaking eval passed, but browser/provider audio smoke remains incomplete |
| R-010 | Partially closed: role smoke passed; deeper admin analytics readout manual verification remains a follow-up before wider beta |
| R-013 | Closed for current beta evidence: static, core, security, content, service, and smoke gates passed or have explicit provider blocker classification |

## Next Actions

| Priority | Action | Owner | Acceptance signal |
| --- | --- | --- | --- |
| P1 | Supply provider key through local env and rerun provider-backed AI eval | AI / LLM Engineer | `pnpm check:ai-eval` records completed provider result |
| P1 | Complete Academic Lead signoff JSON | Head of German Pedagogy / Academic Lead | `academic-signoff` validation passes with `--require-final` |
| P1 | Run browser/provider speaking smoke | Speech / Audio Engineer | Success, denied-permission, provider-unavailable, low-confidence, and privacy cases documented |
| P1 | Complete legal/privacy claim matrix | Legal / Compliance Advisor | Approved beta claims and data-handling notes |
| P2 | Manually verify admin analytics readout endpoints in live dev-auth session | Product Manager EdTech + QA Automation Engineer | Activation/progress/motivation/AI readouts return expected JSON under admin role |

## Final Decision

Phase 50 closes the service readiness and full-smoke blockers and upgrades Fuxie from blocked beta readiness to **controlled beta-ready with exclusions**.

Feature expansion may proceed only after the next implementation task is explicitly routed. Any stronger AI, exam, pronunciation, or public marketing claim remains blocked until provider eval, Academic Lead final signoff, speaking/audio smoke, and legal/privacy review are complete.
