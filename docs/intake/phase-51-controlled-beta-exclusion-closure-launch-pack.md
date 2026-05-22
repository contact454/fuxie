# Phase 51: Controlled Beta Exclusion Closure And Launch Pack

Date: 2026-05-13

## Role-Gate Compliance

Vai chinh: Project Manager / Delivery Manager
Vai phoi hop: Operations Manager, CTO / Tech Lead, Product Manager EdTech

This phase was started under the mandatory role-gate workflow:

- `task-startup-checklist.md` was read.
- `task-role-router.md` was read.
- Project Manager / Delivery Manager was selected because this phase coordinates launch readiness, exclusions, owners, and acceptance gates.
- Operations Manager, CTO / Tech Lead, and Product Manager EdTech profiles were read as support roles.
- The phase does not change runtime code, schema, content JSON, AI prompts, provider configuration, or deployment configuration.

## Goal

Convert the Phase 50 verdict into a controlled beta launch pack. The target is not to over-claim readiness; the target is to make the remaining exclusions explicit, assign owners, define exact closure evidence, and prepare the next execution step for a 30-50 learner B2C Vietnamese German beta.

## Team Nghiệm Thu Phase 50

| Function | Review verdict | Reason | Condition |
| --- | --- | --- | --- |
| Delivery / Project Management | Accepted | Phase 50 has command evidence, owner matrix, blocker status, and a clear verdict | Future beta work must keep owner and acceptance signal visible |
| Operations | Accepted | Intake board and risk register were updated without touching runtime scope | Launch pack must keep documentation lightweight and executable |
| CTO / Tech Lead | Accepted with conditions | Service readiness, health checks, core gates, and full local smoke passed | Provider-backed AI eval and browser/provider audio evidence remain required for stronger claims |
| Product Manager EdTech | Accepted with exclusions | Controlled B2C learner beta can proceed with conservative wording | Teacher/admin and AI/speaking claims must not become the primary promise |

## Current Beta Decision

Fuxie remains **controlled beta-ready with exclusions**.

The controlled beta may focus on:

- B2C Vietnamese learners.
- Learner onboarding.
- Dashboard next action.
- Vocabulary, review, reading, listening, writing, speaking page access, grammar, exam practice, and chat surfaces as practice experiences.
- Internal measurement of activation, retention, learning progress, motivation loop, and AI feedback events.

The controlled beta must not claim:

- Official Goethe/Telc/OSD scoring.
- Provider-validated AI grading accuracy.
- Academic-final CEFR grading.
- Precise pronunciation scoring.
- Public legal/privacy-reviewed marketing claims.

## Exclusion Closure Board

| Exclusion | Owner | Current status | Closure action | Acceptance signal |
| --- | --- | --- | --- | --- |
| Provider-backed AI eval | AI / LLM Engineer | Blocked; `GEMINI_API_KEY` and `GOOGLE_AI_API_KEY` are missing in local environment | Supply provider key through local env only and rerun `pnpm check:ai-eval` | Provider run completes and readout records quality/cost/latency result |
| Academic Lead final signoff | Head of German Pedagogy / Academic Lead | Open; academic signoff template exists but reviewer, overall decision, and case decisions remain pending | Human reviewer completes signoff JSON and validation runs with `--require-final` | No beta-critical pending cases for AI/content/exam-claim surfaces |
| Speaking/audio browser/provider smoke | Speech / Audio Engineer | Conditional; `/speaking` page and offline speaking eval pass, but browser/provider smoke is incomplete | Run microphone permission, denied-permission fallback, provider unavailable, low-confidence transcript, success path, and privacy checks | Speaking/audio smoke report records pass/fail/blocked with owner decision |
| Legal/privacy beta claim matrix | Legal / Compliance Advisor | Open; conservative guardrails exist but formal review is pending | Approve beta copy matrix and data-handling notes | Public claims and privacy handling are approved for controlled beta |
| Admin analytics live readout verification | Product Manager EdTech + QA Automation Engineer | Partially closed; role smoke passed, deeper readout manual verification remains follow-up | Fetch activation, learning-progress, motivation-loop, and AI readout endpoints under admin role | Admin readouts return expected JSON or blockers are documented |

## Controlled Beta Launch Pack

| Launch artifact | Owner | Status | Required content |
| --- | --- | --- | --- |
| Beta scope note | Product Manager EdTech | Ready in this phase | Target learner, allowed surfaces, excluded claims, success metrics |
| Technical readiness note | CTO / Tech Lead | Ready from Phase 50 evidence | Service readiness, smoke result, core gate result, known technical residual risks |
| QA release checklist | QA Automation Engineer | Ready from Phase 50 evidence | Gate commands, smoke command, rerun triggers, blocked-provider handling |
| Claim matrix | Legal / Compliance Advisor | Pending formal review | Allowed words, disallowed words, AI/exam/audio/privacy caveats |
| Academic signoff pack | German Academic Lead | Pending human signoff | AI eval cases, CEFR/exam caution, content spot-check decision |
| Beta operations checklist | Operations Manager | Ready in this phase | Cohort size, invite workflow, issue triage, weekly review ritual |
| Cohort measurement plan | Data / Analytics Engineer | Ready from prior analytics cycles | Activation, D1/D7/D30 retention, weekly meaningful CEFR progress, AI/motivation diagnostics |

## Beta Scope Note

### Target Cohort

- 30-50 Vietnamese learners studying German.
- Preferred first cohort: A1-B1 learners who can give feedback on onboarding, dashboard next action, vocabulary/review, and AI practice support.
- Exclude high-stakes exam users from any official-score messaging until Academic Lead and Legal approve stronger claims.

### Primary Success Metrics

| Metric | Definition | Target for first beta readout |
| --- | --- | --- |
| Activation | Onboarding completed plus first `meaningful_action_completed` within 24 hours | Establish baseline, not optimize yet |
| D1/D7 retention | Learner returns with meaningful learning action after activation | Establish baseline by cohort |
| Weekly meaningful CEFR progress | At least 3 deduplicated meaningful learning actions in 7 days | Establish baseline by level/skill/action type |
| AI feedback reliability | AI feedback generated vs failed by flow | Track failure rate and provider blockers |
| Motivation quality | Mission/streak/Fucoin/reward overlap with meaningful learning | Detect reward-only engagement |

### Non-Goals

- No warehouse or BI dashboard expansion.
- No new schema unless a future routed implementation cycle approves it.
- No official exam scoring claim.
- No public marketing push.
- No teacher/admin expansion as the primary beta promise.

## QA And Release Rerun Triggers

Rerun these before inviting the cohort if any tracked runtime, schema, env, provider, or content change lands:

| Trigger | Required check |
| --- | --- |
| Runtime or API change | `pnpm check:quick`, focused tests, and affected smoke path |
| Content change | `pnpm qa:content` and Academic Lead spot-check if beta-critical |
| Provider key added | `pnpm check:ai-eval` with provider run |
| DB/Redis/service restart | `pnpm env:audit:services` and health checks |
| Launch candidate | `pnpm smoke:full-local` when DB/Redis/web/AI/dev-auth are available |
| Public beta copy change | Legal/privacy claim matrix review |

## Launch Go / No-Go Rules

| Decision | Required conditions |
| --- | --- |
| `controlled-beta-ready` | Phase 50 gates remain current, cohort scope is B2C learner-only, exclusions are enforced, and issue triage is staffed |
| `controlled-beta-ready-with-exclusions` | Same as above, with provider AI eval, Academic signoff, speaking/audio, or legal review still pending and clearly excluded from claims |
| `hold-beta` | Core smoke/gates fail, privacy/security risk is open, or product copy would imply official AI/exam/audio claims without evidence |

Current decision: **controlled-beta-ready-with-exclusions**.

## Phase 52 Goal Plan: Controlled Beta Cohort Operations

### Objective

Run the first controlled beta cohort as an operations and measurement cycle, not a feature-expansion cycle.

### Workstreams

| Workstream | Primary owner | Output | Acceptance signal |
| --- | --- | --- | --- |
| Cohort setup | Operations Manager | Cohort roster, invite status, consent/feedback notes | 30-50 learners classified as invited/active/responded |
| Learner journey validation | Product Manager EdTech | Onboarding and dashboard next-action feedback log | Top friction points are ranked with evidence |
| Release monitoring | QA Automation Engineer | Daily smoke/gate watch during cohort window | No untriaged P0/P1 defects |
| Technical support | CTO / Tech Lead | Incident triage and rollback owner matrix | Any production-like blocker has owner and action |
| Analytics readout | Data / Analytics Engineer | Activation/retention/progress/motivation/AI readout | Cohort metrics exported as internal JSON/report |
| Academic safety | German Academic Lead | CEFR/exam claim review for learner-facing feedback | No beta feedback implies official scoring |
| Legal/privacy guardrail | Legal / Compliance Advisor | Data-handling and public-claim review notes | No unapproved public claim or sensitive data exposure |

### Acceptance Criteria

Phase 52 is complete when:

- Cohort size, learner segment, and invite status are documented.
- Beta exclusions are visible to internal team and reflected in copy.
- Activation, D1/D7 retention, weekly progress, motivation loop, and AI feedback metrics have a first readout.
- Every P0/P1 issue has owner, severity, next action, and status.
- Team can decide whether to continue beta, pause, or move into targeted product fixes.

## Phase 51 Acceptance Criteria

This phase is accepted when:

- Phase 50 changes are reviewed by team function and accepted with conditions.
- Remaining exclusions have owner, action, and acceptance signal.
- Controlled beta scope, non-goals, metrics, and go/no-go rules are explicit.
- README and risk register link the phase.
- No runtime code, schema, content JSON, AI prompt, provider config, or deploy config is changed.
- Documentation hygiene passes.
