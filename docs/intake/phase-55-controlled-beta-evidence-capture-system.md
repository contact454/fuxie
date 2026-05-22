# Phase 55: Controlled Beta Evidence Capture System

Date: 2026-05-13

## Role-Gate Compliance

Vai chinh: Project Manager / Delivery Manager
Vai phoi hop: Operations Manager, Product Manager EdTech, CTO / Tech Lead

This phase was implemented under the mandatory role-gate workflow:

- `task-startup-checklist.md` was read.
- `task-role-router.md` was read.
- Project Manager / Delivery Manager was selected because this phase creates the delivery evidence capture system for controlled beta.
- Operations Manager, Product Manager EdTech, and CTO / Tech Lead profiles were read as support roles.
- No runtime code, schema, content JSON, AI prompt, provider config, or deploy config is changed in this phase.

## Team Acceptance Review

Phase 54 is accepted as evidence check and remains blocked on real beta data. It correctly found no cohort roster, learner feedback, issue log, or analytics snapshot in repo docs, so no runtime implementation slice was selected.

| Function | Verdict | Notes |
| --- | --- | --- |
| Project / Delivery | Accepted | Phase 54 blocks fix selection until evidence exists |
| Operations | Accepted with dependency | Cohort roster needs a canonical capture location |
| Product Manager EdTech | Accepted with dependency | Learner feedback needs source, surface, category, severity, and owner |
| CTO / Tech Lead | Accepted with conditions | Runtime work must wait for evidence-backed P0/P1 with verification path |

## Objective

Create the canonical repo location and templates for controlled beta evidence so the team can record real cohort data before selecting any runtime implementation slice.

Canonical evidence folder:

```text
docs/beta/controlled-beta/
```

## Evidence Capture Files

| File | Owner | Purpose | Initial state |
| --- | --- | --- | --- |
| `cohort-roster.csv` | Operations Manager | Track learner aliases, segment, level, status, invite/activity dates, notes, owner | `waiting_for_cohort_data` |
| `learner-feedback.md` | Product Manager EdTech | Record learner feedback with source, surface, category, severity, owner, next action | `waiting_for_cohort_data` |
| `issue-log.md` | Project Manager / Delivery Manager | Track P0/P1/P2 issues using Phase 53 taxonomy | `waiting_for_cohort_data` |
| `analytics-snapshot.md` | Data / Analytics Engineer | Record activation, retention, progress, motivation, and AI feedback readout | `waiting_for_cohort_data` |
| `guardrail-checklist.md` | German Academic Lead + Legal / Compliance Advisor | Keep exam, AI, audio, privacy, and public-claim exclusions visible | Active guardrail |
| `first-fix-readiness.md` | Project Manager / Delivery Manager + CTO / Tech Lead | Decide whether evidence is sufficient to select exactly one runtime fix slice | `blocked_by_missing_evidence` |

## Evidence Rules

- Use learner aliases, not names, emails, phone numbers, addresses, or account identifiers.
- Do not record raw learner submissions, answer text, audio transcripts, provider payloads, secrets, stack traces with secrets, or private support messages.
- Summarize feedback in privacy-safe language.
- Keep beta exclusions active until owner evidence closes them.
- Do not select a runtime implementation slice unless `first-fix-readiness.md` confirms at least one P0/P1 issue has source, owner, severity, next action, and acceptance signal.

## Initial Evidence State

| Evidence area | Status | Reason |
| --- | --- | --- |
| Cohort roster | `waiting_for_cohort_data` | Template exists, real learner aliases not recorded yet |
| Learner feedback | `waiting_for_cohort_data` | Template exists, real feedback not recorded yet |
| Issue log | `waiting_for_cohort_data` | Template exists, real beta issues not recorded yet |
| Analytics snapshot | `waiting_for_cohort_data` | Template exists, real cohort readout not recorded yet |
| First fix readiness | `blocked_by_missing_evidence` | No evidence-backed P0/P1 issue exists yet |

## Next Decision Gate

Phase 56 should be **Evidence-Backed First Fix Slice Selection** after the evidence templates contain real beta data.

Phase 56 can start only when:

- At least one cohort roster entry exists, or recruitment shortfall is explicitly recorded.
- At least one feedback, issue, or analytics evidence item exists.
- Any candidate P0/P1 issue has source, severity, owner, next action, and acceptance signal.
- Existing AI/exam/audio/legal exclusions remain enforced.

## Acceptance Criteria

Phase 55 is complete when:

- The canonical evidence folder exists.
- All six evidence templates exist.
- Templates avoid raw PII and sensitive payload capture.
- README and risk register link this phase.
- No runtime/schema/content/prompt/provider/deploy files are changed.
- Documentation hygiene passes.
