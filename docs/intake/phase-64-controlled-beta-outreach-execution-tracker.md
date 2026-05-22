# Phase 64: Controlled Beta Outreach Execution Tracker

Date: 2026-05-13

## Role-Gate Compliance

Vai chinh: Project Manager / Delivery Manager
Vai phoi hop: Operations Manager, Product Manager EdTech, Data / Analytics Engineer

This phase was implemented under the mandatory role-gate workflow:

- `task-startup-checklist.md` was read.
- `task-role-router.md` was read.
- Project Manager / Delivery Manager was selected because this phase owns execution tracking, blocker visibility, and first-fix gating.
- Operations Manager, Product Manager EdTech, and Data / Analytics Engineer profiles were read as support roles.
- No runtime code, schema, content JSON, AI prompt, provider config, or deploy config is changed in this phase.

## Team Acceptance Review

Phase 63 is accepted as source decision and invite-batch readiness.

The team agrees that `community_outreach_selected` closes the open recruitment-source decision. It does not close learner evidence, feedback, analytics, or first-fix selection because those require real learner activity.

Phase 64 adds the missing execution tracker so the selected outreach path can be run and audited without adding PII or fabricated cohort data.

## Execution Tracker

Tracker file: `docs/beta/controlled-beta/outreach-tracker.csv`.

Tracker status: `ready_for_outreach_execution`.

| Work item | Owner | Status | Next action | Acceptance signal |
| --- | --- | --- | --- | --- |
| Prepare outreach tracker | Project Manager / Delivery Manager | Complete | Keep tracker privacy-safe | Tracker exists with owners, statuses, and no PII |
| Send first claim-safe outreach | Operations Manager | Ready | Use `invite-batch-001.md` copy in selected community/manual channel | Outreach row becomes `sent` with date and owner |
| Record response without PII | Operations Manager | Waiting | Add learner alias only after real response | `cohort-roster.csv` has at least one real alias row |
| Capture first feedback | Product Manager EdTech | Waiting | Summarize feedback after learner activity | `learner-feedback.md` has sourced privacy-safe feedback |
| Add first aggregate readout | Data / Analytics Engineer | Waiting | Summarize cohort metrics after activity exists | `analytics-snapshot.md` has aggregate cohort metrics |
| Rerun first-fix selection | Project Manager / Delivery Manager | Blocked | Wait for P0/P1 candidate with source evidence | `first-fix-readiness.md` checklist is complete |

## Outreach Cadence

| Cadence | Owner | Action | Evidence |
| --- | --- | --- | --- |
| Day 0 | Operations Manager | Send first community/manual outreach | Outreach tracker row marked `sent` |
| Day 2 | Operations Manager | Check replies and assign aliases for real responders only | Cohort roster updated without PII |
| Day 3-5 | Product Manager EdTech | Capture first learner feedback after activity | Feedback log updated |
| Day 5-7 | Data / Analytics Engineer | Add aggregate readout if any learner activity exists | Analytics snapshot updated |
| Day 7 | Project Manager / Delivery Manager | Decide whether first-fix selection can rerun | First-fix readiness updated |

## Guardrails

- Do not record real names, emails, phone numbers, addresses, account identifiers, private messages, raw submissions, transcripts, provider payloads, or secrets.
- Do not create synthetic learner aliases.
- Do not record public campaign metrics as learner evidence unless a learner actually responds or becomes active.
- Keep existing exclusions active: no official exam scoring, no provider-validated AI grading, no pronunciation precision, no public legal/privacy-approved marketing claim.

## Current Decision

Decision: `ready_for_outreach_execution`.

Runtime implementation remains blocked.

Reason: outreach can now be executed outside the repo, but no real learner evidence exists yet.

## Next Step

Phase 65 should be one of:

- **First Fix Selection Rerun From Cohort Evidence**, if real P0/P1 evidence appears.
- **Controlled Beta Outreach Response Review**, if outreach is sent but produces no learner activity.

## Acceptance Criteria

Phase 64 is complete when:

- Outreach tracker exists.
- Owners, statuses, next actions, and acceptance signals are explicit.
- First-fix readiness remains blocked until real P0/P1 evidence exists.
- README and risk register reference Phase 64.
- No runtime/schema/content/prompt/provider/deploy files are changed.
- Documentation hygiene passes.
