# Phase 56: Evidence-Backed First Fix Slice Selection

Date: 2026-05-13

## Role-Gate Compliance

Vai chinh: Project Manager / Delivery Manager
Vai phoi hop: Operations Manager, Product Manager EdTech, CTO / Tech Lead

This phase was implemented under the mandatory role-gate workflow:

- `task-startup-checklist.md` was read.
- `task-role-router.md` was read.
- Project Manager / Delivery Manager was selected because this phase owns delivery sequencing, fix selection readiness, and blocker visibility.
- Operations Manager, Product Manager EdTech, and CTO / Tech Lead profiles were read as support roles.
- No runtime code, schema, content JSON, AI prompt, provider config, or deploy config is changed in this phase.

## Team Acceptance Review

Phase 55 is accepted as evidence infrastructure. The canonical controlled beta evidence folder exists at `docs/beta/controlled-beta/`, and all required templates are present.

The team does not accept moving into runtime implementation yet because the templates still contain no real cohort evidence.

| Function | Verdict | Notes |
| --- | --- | --- |
| Project / Delivery | Accepted with blocker | Evidence capture exists, but first-fix selection is blocked until a complete P0/P1 candidate exists |
| Operations | Accepted with dependency | Cohort roster is still `waiting_for_cohort_data` |
| Product Manager EdTech | Accepted with dependency | Learner feedback and issue severity still need real source evidence |
| CTO / Tech Lead | Accepted with conditions | Runtime work remains blocked until there is an owner, acceptance signal, and verification path |

## Current Evidence State

| Evidence file | Current status | Evidence readout | Owner |
| --- | --- | --- | --- |
| `docs/beta/controlled-beta/cohort-roster.csv` | `waiting_for_cohort_data` | No learner alias or recruitment shortfall has been recorded | Operations Manager |
| `docs/beta/controlled-beta/learner-feedback.md` | `waiting_for_cohort_data` | No learner feedback item has been recorded | Product Manager EdTech |
| `docs/beta/controlled-beta/issue-log.md` | `waiting_for_cohort_data` | No P0/P1/P2 issue has been recorded | Project Manager / Delivery Manager |
| `docs/beta/controlled-beta/analytics-snapshot.md` | `waiting_for_cohort_data` | No activation, retention, progress, motivation, or AI feedback readout exists for the beta cohort | Data / Analytics Engineer |
| `docs/beta/controlled-beta/guardrail-checklist.md` | Active | Existing AI, exam, audio, legal, and teacher/admin guardrails remain active | German Academic Lead + Legal / Compliance Advisor |
| `docs/beta/controlled-beta/first-fix-readiness.md` | `blocked_by_missing_evidence` | No runtime implementation slice is selected | Project Manager / Delivery Manager + CTO / Tech Lead |

## First-Fix Readiness Decision

Decision: `blocked_by_missing_evidence`.

No runtime implementation slice is selected in Phase 56.

Reason: the controlled beta evidence files do not yet contain at least one complete P0/P1 issue with source evidence, severity, owner, next action, acceptance signal, and verification path.

## Candidate Issue Table

| Candidate | Source evidence | Severity | Owner | Next action | Acceptance signal | Verification path | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| None | No cohort, feedback, issue, or analytics evidence recorded yet | N/A | N/A | Continue evidence capture | At least one complete P0/P1 candidate exists | Defined by candidate owner once evidence exists | Not selected |

## Selection Rules

Future first-fix selection can only happen when at least one candidate issue has:

- Source evidence.
- Severity P0 or P1.
- Owner.
- Next action.
- Acceptance signal.
- Verification path.

If multiple candidates exist:

- P0 outranks P1.
- Learner activation, onboarding, dashboard next action, first meaningful action, data/privacy safety, role boundary, and unsafe AI/exam/audio claim issues outrank lower-impact friction.
- Exactly one first implementation slice is selected.
- Feature expansion remains blocked until beta evidence justifies it.

## Guardrails

The following exclusions remain active:

- No official Goethe/Telc/OSD scoring claim.
- No provider-validated AI grading claim.
- No pronunciation precision claim.
- No public legal/privacy-approved marketing claim.
- No teacher/admin expansion as the primary beta promise.

Evidence capture must continue using learner aliases only. Do not record names, emails, phone numbers, account identifiers, raw submissions, raw transcripts, provider payloads, secrets, stack traces with secrets, or private support messages.

## Next Step

Continue controlled beta evidence collection in `docs/beta/controlled-beta/`.

Phase 57 should be one of:

- **First Runtime Fix Slice Implementation**, only if Phase 56 is rerun with a complete evidence-backed P0/P1 candidate.
- **Controlled Beta Evidence Collection Follow-Up**, if cohort evidence is still missing.

## Acceptance Criteria

Phase 56 is complete when:

- Phase 55 evidence infrastructure is reviewed.
- All controlled beta evidence files are checked.
- First-fix readiness decision is recorded.
- Runtime implementation remains blocked unless a complete evidence-backed P0/P1 candidate exists.
- README and risk register reference Phase 56.
- No runtime/schema/content/prompt/provider/deploy files are changed.
- Documentation hygiene passes.

