# Phase 48: Company-Wide Reassessment Refresh

Date: 2026-05-13

## Role-Gate Compliance

Vai chinh: Operations Manager
Vai phoi hop: CEO / General Manager, CTO / Tech Lead, Product Manager EdTech

This reassessment refresh was started under the mandatory role-gate workflow:

- `task-startup-checklist.md` was read.
- `task-role-router.md` was read.
- Operations Manager was selected as the primary role because this is a company-wide coordination and operating-readiness task.
- CEO / General Manager, CTO / Tech Lead, and Product Manager EdTech were selected as support roles for strategy, technical readiness, and product judgement.
- The selected personnel profiles were read before execution.

## Executive Verdict

Fuxie remains **post-baseline and implementation-ready with beta-readiness conditions**.

After Phase 41-47, the company has stronger evidence than Phase 40:

- AI offline eval, AI service tests, content QA, web tests, core tests, env audit, and secret audit have current passing evidence.
- Growth/beta cohort and operating budget/staffing plans now exist.
- Teacher/admin analytics and speaking/audio have clearer smoke blockers, not vague unknowns.
- Provider-backed AI eval and Academic Lead final signoff remain open.

The company is approved to continue implementation and controlled beta preparation. It is not approved for broad public beta claims, official exam scoring claims, strong AI grading claims, or pronunciation precision claims until the remaining P1 blockers are closed or explicitly accepted by owners.

## All-Hands Workstream Review

| Workstream | Primary owner | Current status | Evidence source | Remaining blocker | Next action | Acceptance signal |
| --- | --- | --- | --- | --- | --- | --- |
| Leadership / Strategy | CEO / General Manager | Accepted with focus guardrails | Phase 40, Phase 46 | Public beta claim boundaries still depend on P1 blockers | Keep B2C Vietnamese learners as the primary motion | One 90-day priority stack and approved beta claim policy |
| Product / Learner Experience | Product Manager EdTech | Accepted with continued iteration | Phases 23-27, Phase 40, Phase 46 | Learner beta should not expand into broad B2B before signal | Keep dashboard/onboarding work tied to weekly CEFR progress | Activation and weekly progress readouts are reviewed weekly |
| Engineering / Architecture | CTO / Tech Lead | Accepted | Phase 41 command evidence | Full local smoke currently blocked by local services | Keep slice-based implementation and release gates | `pnpm check:quick`, `pnpm test:core`, and release gates remain current |
| AI Module | AI / LLM Engineer | Accepted with conditions | Phase 39, Phase 42 | Provider-backed eval missing key; Academic Lead final signoff pending | Complete provider eval and final signoff chain | R-007 closed, downgraded, or accepted by AI + Academic owners |
| Speech / Audio | Speech / Audio Engineer | Blocked for beta claim | Phase 43 | Browser/provider smoke blocked by service/provider prerequisites | Start DB/Redis/AI service and run speaking/audio smoke | R-008 has browser permission, provider, fallback, and privacy evidence |
| Learning / Content | Head of German Pedagogy / Academic Lead | Accepted with human signoff pending | Phase 44 | Automated QA passed, but human academic spot-check remains | Review A1-B2 priority path and exam-claim wording | R-006 has sample-level approve/revise/block decisions |
| Design / Gamification | Product Designer / Gamification Designer | Accepted with scope discipline | Phases 31-32, Phase 40 | Mascot/reward work must not become decorative or reward-only | Keep game loop tied to meaningful learning actions | Motivation metrics separate reward-only users from learners progressing |
| QA / Release | QA Automation Engineer | Accepted | Phase 41 | Full smoke blocked by DB/Redis/AI local readiness | Re-run smoke only when prerequisites are available | Current pass/fail/blocked gate matrix before beta candidate |
| DevOps / Security | DevOps / Cloud Engineer / Security Privacy Consultant | Accepted with service blocker | Phase 41 | Docker Desktop/local DB/Redis unavailable during latest smoke | Restore local service readiness and rerun env service audit | `pnpm env:audit:services` passes without DB/Redis warnings |
| Data / Analytics | Data / Analytics Engineer | Accepted for internal v1 | Phases 26, 30, 32, 41, 45 | Teacher/admin UI smoke blocked by DB-backed API readiness | Validate admin readouts in a live local environment | Admin activation/progress/motivation/AI readouts load under admin role |
| Growth / Beta | Growth Lead | Accepted as operating plan | Phase 46 | Cohort should wait for beta blockers or explicit exclusions | Prepare 30-50 learner beta brief after gates are current | Beta cohort has target, funnel, support loop, and weekly review cadence |
| Ops / Finance / HR | Operations Manager / Finance Admin Officer / HR Talent Partner | Accepted as rough plan | Phase 47 | Final numbers require CEO runway and provider/infra assumptions | Convert rough plan into budget spreadsheet after CEO inputs | 90-day budget has headcount, provider, infra, content, QA, and growth lines |
| Legal / Compliance | Legal / Compliance Advisor | Needs owner action | Phase 40, Phase 47 | Public claims, AI/audio data, privacy terms not formally reviewed | Review claim language, audio data policy, and AI analytics privacy | Legal/privacy approval before public beta copy |

## Current Acceptance Snapshot

Accepted:

- Mandatory Role-Gate governance.
- Intake documentation and phase board.
- Baseline release process and current core test discipline.
- Learner activation measurement direction.
- Internal analytics readouts for activation, learning progress, motivation, and AI evaluation.
- Automated content QA gate.
- Growth beta operating plan.
- Rough budget and staffing operating plan.

Accepted with conditions:

- AI Coach V1, pending provider-backed eval and Academic Lead final signoff.
- Teacher/admin analytics, pending live UI smoke with DB/Redis/AI prerequisites.
- Speaking/audio, pending browser/provider smoke and fallback evidence.
- Content quality, pending human academic spot-check for stronger CEFR/exam claims.
- Beta cohort readiness, pending claim boundaries and gate status.

Blocked for beta/public claims:

- Official exam scoring or pass/fail readiness claim.
- Strong AI grading accuracy claim.
- Precise pronunciation or speaking quality claim.
- Full teacher/admin operational claim without role-scoped UI smoke.
- Production-like beta release claim without current service smoke.

## Top Open Blockers

| Blocker | Risk | Owner | Next action | Acceptance signal |
| --- | --- | --- | --- | --- |
| Provider-backed AI eval missing key | R-007 | AI / LLM Engineer | Provide `GEMINI_API_KEY` or `GOOGLE_AI_API_KEY` in local environment and rerun `pnpm check:ai-eval` | Provider run completes or blocker is formally accepted with safe product wording |
| Academic Lead final signoff pending | R-006, R-007 | Head of German Pedagogy / Academic Lead | Complete AI signoff JSON and content sample decisions | Final signoff has no pending cases for beta-critical surfaces |
| Speaking/audio smoke blocked | R-008 | Speech / Audio Engineer | Start DB/Redis/AI service and run browser/provider speaking smoke | Permission denied, provider unavailable, low confidence, and success path documented |
| Local service readiness unavailable | R-003, R-004, R-010 | DevOps / Cloud Engineer | Start Docker Desktop or equivalent services and rerun service audit | DB/Redis reachable and smoke prerequisites cleared |
| Teacher/admin UI smoke blocked | R-010 | Product Manager EdTech | Rerun role smoke after service readiness | Teacher/admin pages and analytics readouts load under correct roles |
| Legal/privacy beta review not complete | Legal/compliance risk | Legal / Compliance Advisor | Review AI/audio/analytics/privacy and public claim wording | Approved beta claim matrix and data-handling notes |

## Priority Decision

The company should execute **beta-readiness blockers before feature expansion**.

Priority order:

1. Restore local service readiness: DB, Redis, AI service, dev-auth.
2. Re-run smoke gates for learner, teacher, admin, AI health, and DB health.
3. Close AI provider-backed eval and Academic Lead signoff.
4. Close speaking/audio browser/provider smoke.
5. Confirm content sample signoff for A1-B2 first path.
6. Only then begin broader beta cohort recruitment or new feature expansion.

## Operating Rules For Next Cycle

- Every next task must start with Role-Gate.
- Do not count reward-only activity as learning progress.
- Do not log raw learner text, transcript, audio, prompt, provider payload, token, or secret in analytics.
- Do not market official Goethe/Telc/OSD scoring.
- Do not add new schema, prompts, or content changes while closing smoke blockers unless a specific blocker requires it.
- Treat blocked smoke as blocked only when prerequisites are unavailable; treat it as failure only after prerequisites are confirmed.

## Acceptance Decision

Decision: **All-hands reassessment refresh accepted**.

Fuxie is ready for continued implementation and controlled beta preparation, but not ready for broad public beta claims. The next operating milestone is a beta-readiness closure pass over R-006, R-007, R-008, R-010, and local service readiness.

## Next Planned Step

The next implementation cycle should be **Beta Readiness Blocker Closure Sprint**:

- Primary owner: Project Manager / Delivery Manager.
- Support: DevOps / Cloud Engineer, QA Automation Engineer, AI / LLM Engineer, German Academic Lead, Speech / Audio Engineer, Product Manager EdTech.
- Output: current service audit, full local smoke, provider AI eval status, Academic Lead signoff status, speaking/audio smoke status, and a final beta claim decision.
