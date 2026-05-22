# Phase 54: Controlled Beta Evidence Intake Sprint

Date: 2026-05-13

## Role-Gate Compliance

Vai chinh: Project Manager / Delivery Manager
Vai phoi hop: Operations Manager, Product Manager EdTech, CTO / Tech Lead

This phase was implemented under the mandatory role-gate workflow:

- `task-startup-checklist.md` was read.
- `task-role-router.md` was read.
- Project Manager / Delivery Manager was selected because this phase collects beta evidence, classifies blockers, and decides whether a fix slice can be selected.
- Operations Manager, Product Manager EdTech, and CTO / Tech Lead profiles were read as support roles.
- No runtime code, schema, content JSON, AI prompt, provider config, or deploy config is changed in this phase.

## Team Acceptance Review

Phase 53 is accepted as triage infrastructure and remains blocked on real cohort evidence. The triage board, taxonomy, severity rules, scoring model, and first implementation slice rules are ready, but no evidence-backed P0/P1 issue exists yet.

| Function | Verdict | Notes |
| --- | --- | --- |
| Project / Delivery | Accepted with dependency | Phase 53 can receive evidence, but cannot select a runtime slice yet |
| Operations | Accepted with dependency | Cohort roster and invite status remain missing |
| Product Manager EdTech | Accepted | Learner friction must come from real feedback, observed behavior, or analytics |
| CTO / Tech Lead | Accepted with conditions | Runtime work requires reproducible issue evidence and a verification path |

## Objective

Collect the first controlled beta evidence needed to move Phase 53 from `waiting_for_cohort_data` toward `ready_for_fix_selection`.

Because no real 30-50 learner cohort roster, learner feedback log, issue log, or cohort analytics readout is recorded in repo docs yet, Phase 54 closes as **evidence intake prepared, cohort evidence still pending**.

## Evidence Search Result

| Evidence area | Current finding | Status |
| --- | --- | --- |
| Cohort roster | No real 30-50 learner roster recorded in repo docs | `waiting_for_cohort_data` |
| Learner feedback | Only template/sample pilot feedback is referenced; no real learner feedback batch recorded | `waiting_for_cohort_data` |
| Issue log | No evidence-backed beta P0/P1/P2 issue log recorded | `waiting_for_cohort_data` |
| Analytics readout | Analytics helpers/readouts exist, but no cohort snapshot is recorded for Phase 54 | `waiting_for_cohort_data` |
| Targeted fix slice | No evidence-backed P0/P1 issue exists, so no runtime slice is selected | `blocked_by_missing_evidence` |

## Intake Board

### Cohort Roster Intake

| Field | Required value | Current value | Owner | Status |
| --- | --- | --- | --- | --- |
| Cohort size | 30-50 learners | Not recorded | Operations Manager | `waiting_for_cohort_data` |
| Segment | Vietnamese German learners | Not recorded | Operations Manager | `waiting_for_cohort_data` |
| Level mix | A1-B1 preferred | Not recorded | Product Manager EdTech | `waiting_for_cohort_data` |
| Status labels | `invited`, `active`, `responded`, `dropped`, `blocked` | Not recorded | Operations Manager | `waiting_for_cohort_data` |
| Consent/feedback notes | Recorded per learner or anonymized alias | Not recorded | Operations Manager | `waiting_for_cohort_data` |

### Feedback Intake

| Evidence type | Required fields | Current value | Owner | Status |
| --- | --- | --- | --- | --- |
| Onboarding feedback | source, summary, surface, category, severity | Not recorded | Product Manager EdTech | `waiting_for_cohort_data` |
| Dashboard next-action feedback | source, summary, surface, category, severity | Not recorded | Product Manager EdTech | `waiting_for_cohort_data` |
| First meaningful action feedback | source, summary, surface, category, severity | Not recorded | Product Manager EdTech | `waiting_for_cohort_data` |
| AI/reward feedback | source, summary, surface, category, severity | Not recorded | Product Manager EdTech | `waiting_for_cohort_data` |

### Issue Intake

| Issue state | Definition | Current count | Required action |
| --- | --- | --- | --- |
| `ready_for_fix_selection` | P0/P1 has source, owner, severity, next action, acceptance signal | 0 | Do not select implementation slice |
| `blocked_by_missing_evidence` | Issue is suspected but lacks source/repro/analytics/feedback | 0 | Keep collecting evidence |
| `waiting_for_cohort_data` | No learner or cohort data yet | All issue areas | Continue Phase 52 cohort operations |

### Analytics Snapshot Intake

| Metric | Current value | Owner | Status |
| --- | --- | --- | --- |
| Activation | Not recorded for cohort | Data / Analytics Engineer | `waiting_for_cohort_data` |
| D1 retention | Not recorded for cohort | Data / Analytics Engineer | `waiting_for_cohort_data` |
| D7 retention | Not recorded for cohort | Data / Analytics Engineer | `waiting_for_cohort_data` |
| Weekly meaningful CEFR progress | Not recorded for cohort | Data / Analytics Engineer | `waiting_for_cohort_data` |
| Motivation quality | Not recorded for cohort | Data / Analytics Engineer | `waiting_for_cohort_data` |
| AI feedback reliability | Not recorded for cohort | Data / Analytics Engineer | `waiting_for_cohort_data` |

## First Implementation Slice Decision

No first runtime implementation slice is selected in Phase 54.

Reason: Phase 53 requires at least one evidence-backed P0/P1 issue before choosing a fix slice, and Phase 54 found no recorded cohort roster, learner feedback, issue log, or cohort analytics readout.

## Guardrails Still Active

- No official Goethe/Telc/OSD scoring claim.
- No provider-validated AI grading claim.
- No pronunciation precision claim.
- No public legal/privacy-approved marketing claim.
- No broad feature expansion before evidence-backed triage.

## Next Actions

| Priority | Action | Owner | Acceptance signal |
| --- | --- | --- | --- |
| P1 | Record cohort roster or explicitly mark recruitment shortfall | Operations Manager | 30-50 learners or documented shortfall with next recruitment action |
| P1 | Collect first learner feedback batch | Product Manager EdTech | Feedback entries have source, surface, category, severity, owner |
| P1 | Export first cohort analytics snapshot | Data / Analytics Engineer | Activation, retention, progress, motivation, and AI feedback readout recorded or blocker documented |
| P1 | Convert real issues into Phase 53 taxonomy | Project Manager / Delivery Manager | Each P0/P1 issue has owner, severity, next action, acceptance signal |
| P2 | Select one implementation slice only after evidence exists | Project Manager / Delivery Manager + CTO | One P0/P1 slice selected with tests and acceptance criteria |

## Acceptance Criteria

Phase 54 is complete when:

- The repo state is checked for cohort evidence.
- Missing cohort evidence is recorded as `waiting_for_cohort_data`, not failure.
- No implementation slice is selected without evidence.
- Owners and next actions are assigned for roster, feedback, issue, and analytics intake.
- README and risk register link this phase.
- Documentation hygiene passes.

## Recommended Next Step

Continue **Phase 52 cohort operations** until real evidence exists, then run **Phase 55: Evidence-Backed First Fix Slice Selection** to select one implementation slice from Phase 53.
