# Phase 52: Controlled Beta Cohort Operations

Date: 2026-05-13

## Role-Gate Compliance

Vai chinh: Project Manager / Delivery Manager
Vai phoi hop: Operations Manager, CTO / Tech Lead, Product Manager EdTech

This phase was implemented under the mandatory role-gate workflow:

- `task-startup-checklist.md` was read.
- `task-role-router.md` was read.
- Project Manager / Delivery Manager was selected because this is a cross-functional beta operations and measurement plan.
- Operations Manager, CTO / Tech Lead, and Product Manager EdTech profiles were read as support roles.
- No runtime code, schema, content JSON, AI prompt, provider config, or deploy config is changed in this phase.

## Team Acceptance Review

Phase 51 is accepted with minor documentation polish. The launch pack correctly keeps Fuxie at **controlled-beta-ready-with-exclusions**, makes remaining exclusions explicit, assigns owners, and avoids over-claiming provider, academic, speaking/audio, or legal readiness.

| Function | Verdict | Notes |
| --- | --- | --- |
| Project / Delivery | Accepted | Phase 51 has clear owners, exclusions, go/no-go rules, and Phase 52 handoff |
| Operations | Accepted | Cohort operations can proceed as a managed beta ritual |
| CTO / Tech Lead | Accepted with conditions | Phase 50 technical evidence remains valid, but gates must rerun when source/env/provider/content changes land |
| Product Manager EdTech | Accepted with exclusions | B2C learner beta is the right next step; teacher/admin and public marketing remain secondary |

## Objective

Run the first controlled beta cohort as an operations and measurement cycle, not a feature-expansion cycle. The goal is to learn whether Vietnamese German learners can complete onboarding, understand the dashboard next action, perform a first meaningful learning action, and return for continued progress.

## Cohort Definition

| Item | Decision |
| --- | --- |
| Cohort size | 30-50 learners |
| Primary segment | Vietnamese learners studying German |
| Preferred level | A1-B1 for first cohort signal |
| Primary promise | Practice support, learning path clarity, next action, habit loop |
| Excluded promise | Official exam scoring, provider-validated AI grading, pronunciation precision, public legal-approved marketing claims |
| Beta state labels | `invited`, `active`, `responded`, `dropped`, `blocked` |

## Workstreams

| Workstream | Owner | Output | Acceptance signal |
| --- | --- | --- | --- |
| Cohort setup | Operations Manager | Cohort roster, invite status, consent and feedback tracking | 30-50 learners classified by beta state |
| Learner journey validation | Product Manager EdTech | Feedback log for onboarding, dashboard next action, and first meaningful action | Top friction points ranked with evidence |
| Release monitoring | QA Automation Engineer | Daily smoke/gate watch plan during cohort window | No untriaged P0/P1 defect remains |
| Technical support | CTO / Tech Lead | Incident triage and rollback owner matrix | Every production-like blocker has severity, owner, and next action |
| Analytics readout | Data / Analytics Engineer | Activation, D1/D7 retention, weekly progress, motivation loop, and AI feedback readout | Cohort metrics exported as internal JSON or report |
| Academic guardrail | German Academic Lead | CEFR/exam claim review for learner-facing feedback | No feedback implies official scoring or final CEFR grading |
| Legal/privacy guardrail | Legal / Compliance Advisor | Data-handling and public-claim review notes | No unapproved public claim or sensitive data exposure |

## Operating Cadence

| Cadence | Owner | Action |
| --- | --- | --- |
| Before invites | Operations Manager | Confirm cohort roster, exclusion wording, support channel, and issue triage owner |
| Before invites | QA Automation Engineer | Confirm whether Phase 50 gates remain current or must rerun |
| Daily during beta | Project Manager / Delivery Manager | Review P0/P1 issues, owners, blockers, and learner response status |
| Twice weekly | Product Manager EdTech | Review friction themes from feedback and learning behavior |
| Weekly | Data / Analytics Engineer | Produce activation, retention, progress, motivation, and AI feedback readout |
| Weekly | CTO / Tech Lead | Review technical incidents, smoke status, and rollback readiness |
| Weekly | Academic Lead + Legal | Review claim safety, exam wording, and sensitive-data handling |

## Measurement Plan

| Metric | Source | Interpretation |
| --- | --- | --- |
| Activation | `onboarding_completed` plus first `meaningful_action_completed` within 24h | Measures whether onboarding and dashboard handoff create first learning action |
| D1/D7 retention | Meaningful learning action after activation | Measures return-to-study behavior, not page views |
| Weekly meaningful CEFR progress | At least 3 deduplicated meaningful actions in rolling 7 days | Measures learning consistency across level/skill/action type |
| Motivation quality | Mission/streak/Fucoin/reward overlap with meaningful action | Detects reward-only engagement |
| AI feedback reliability | `ai_feedback_generated` vs `ai_feedback_failed` by flow | Tracks AI usefulness and failure risk without strong quality claims |
| Support load | Issue log and cohort responses | Identifies friction that needs product or ops follow-up |

## Issue Triage Rules

| Severity | Definition | Required action |
| --- | --- | --- |
| P0 | Blocks login, onboarding, core learning action, data/privacy safety, or role boundary | Stop expansion, assign owner immediately, document workaround or rollback |
| P1 | Blocks major learner flow or creates misleading AI/exam/audio claim | Assign owner within daily review and keep beta exclusion visible |
| P2 | Usability friction, confusing copy, or non-blocking analytics gap | Add to ranked follow-up backlog with evidence |

## Beta Exclusion Enforcement

These exclusions remain active throughout Phase 52:

- AI feedback is practice support only.
- Exam work must not claim official Goethe/Telc/OSD score or pass probability.
- Speaking/pronunciation must not claim precise scoring until browser/provider smoke evidence exists.
- Public marketing copy must wait for legal/privacy review.
- Teacher/admin is not the primary beta promise.

## Rerun Triggers

| Trigger | Required check |
| --- | --- |
| Runtime or API change | `pnpm check:quick`, focused tests, affected smoke path |
| Content change | `pnpm qa:content` and Academic Lead spot-check if beta-critical |
| Provider key added | `pnpm check:ai-eval` with provider run |
| DB/Redis/service restart | `pnpm env:audit:services` and health checks |
| Launch candidate | `pnpm smoke:full-local` when DB/Redis/web/AI/dev-auth are available |
| Public beta copy change | Legal/privacy claim matrix review |

## Acceptance Criteria

Phase 52 is complete when:

- Cohort roster and invite status exist for 30-50 learners.
- Every learner is classified as `invited`, `active`, `responded`, `dropped`, or `blocked`.
- Beta exclusions are visible to the internal team and reflected in any learner-facing copy.
- Activation, D1/D7 retention, weekly progress, motivation loop, AI feedback, and support load have first readout evidence.
- Every P0/P1 issue has severity, owner, next action, and current status.
- Team can decide whether to continue beta, pause beta, or move into targeted product fixes.

## Recommended Next Step

After Phase 52, the next implementation cycle should be **Phase 53: Beta Feedback Triage And Targeted Fix Backlog**. That phase should convert cohort evidence into ranked fixes, separate product friction from technical defects, and choose the first runtime implementation slice.
