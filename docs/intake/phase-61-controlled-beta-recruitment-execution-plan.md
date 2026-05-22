# Phase 61: Controlled Beta Recruitment Execution Plan

Date: 2026-05-13

## Role-Gate Compliance

Vai chinh: Project Manager / Delivery Manager
Vai phoi hop: Operations Manager, Product Manager EdTech, Growth Lead

This phase was implemented under the mandatory role-gate workflow:

- `task-startup-checklist.md` was read.
- `task-role-router.md` was read.
- Project Manager / Delivery Manager was selected because this phase owns recruitment execution sequencing and first-fix gate control.
- Operations Manager, Product Manager EdTech, and Growth Lead profiles were read as support roles.
- No runtime code, schema, content JSON, AI prompt, provider config, or deploy config is changed in this phase.

## Team Acceptance Review

Phase 60 is accepted as escalation review and remains blocked. It correctly recorded that no recruitment source, learner aliases, feedback item, analytics snapshot, or issue candidate has been supplied yet.

Phase 61 converts that escalation into an execution-ready recruitment plan, while keeping runtime implementation blocked.

| Function | Verdict | Notes |
| --- | --- | --- |
| Project / Delivery | Accepted with blocker | First-fix selection remains blocked until evidence exists |
| Operations | Execution owner | Must confirm or reject recruitment channel before alias intake starts |
| Product Manager EdTech | Ready for handoff | Feedback surfaces and classification rules are ready |
| Growth Lead | Ready for outreach support | Outreach must stay claim-safe and evidence-safe |

## Execution Decision

Decision: `recruitment_execution_blocked`.

Reason: no recruitment channel is confirmed in repo evidence yet.

Phase 61 does not create learner aliases, feedback, analytics, or issue evidence. It defines the execution path that Operations can activate once a source is approved.

## Recruitment Execution Paths

| Priority | Channel | Owner | Action | Acceptance signal |
| --- | --- | --- | --- | --- |
| 1 | Existing Fuxie/internal learner contacts | Operations Manager | Confirm whether an internal learner pool exists | Channel status becomes `selected` or blocker reason is recorded |
| 2 | DMF Schule/partner learner pool | Operations Manager + Sales / Partnership Manager | Confirm partner approval for controlled beta invite | Partner source is approved without storing PII in repo |
| 3 | Community/manual outreach | Growth Lead + Operations Manager | Prepare claim-safe outreach path if no internal/partner pool exists | Outreach path creates privacy-safe alias intake |

Selected channel must be recorded before learner aliases are added.

## Alias Intake Rules

Use `docs/beta/controlled-beta/cohort-roster.csv` only for privacy-safe evidence.

Allowed fields:

- Learner alias.
- Segment.
- Approximate level band.
- Status.
- Invite date.
- First activity date.
- Consent/feedback note.
- Owner.

Disallowed:

- Real name.
- Email.
- Phone number.
- Address.
- Account identifier.
- Private support messages.
- Raw learner submissions or transcripts.

Allowed learner statuses:

- `invited`
- `active`
- `responded`
- `dropped`
- `blocked`

## Invite And Feedback Handoff

| Step | Owner | Output | Acceptance signal |
| --- | --- | --- | --- |
| Confirm selected channel | Operations Manager | Channel decision | One channel selected or blocker reason recorded |
| Prepare invite batch | Operations Manager | Privacy-safe alias rows | 30-50 aliases or smaller approved pilot batch |
| Confirm consent/feedback note | Operations Manager | Privacy-safe note | Consent captured without PII |
| Observe learner journey | Product Manager EdTech | Feedback item | Source, surface, category, severity, owner, next action |
| Prepare aggregate readout | Data / Analytics Engineer | Analytics snapshot after activity exists | Aggregate metrics only, no raw learner data |
| Review first-fix gate | Project Manager / Delivery Manager | Gate decision | P0/P1 candidate complete or remains blocked |

Feedback surfaces:

- Onboarding.
- Dashboard next action.
- First meaningful action.
- AI practice support.
- Reward loop.

## Outreach Constraints

Growth Lead may support invite copy and outreach planning, but all outreach must:

- Avoid official Goethe/Telc/OSD scoring claims.
- Avoid provider-validated AI grading claims.
- Avoid pronunciation precision claims.
- Avoid public legal/privacy approval claims.
- Avoid teacher/admin expansion as the primary beta promise.
- Separate learning value from marketing hype.

Public campaign metrics are not learner evidence until learner aliases and activity are recorded through the controlled beta evidence workflow.

## Evidence Update Cadence

| Cadence | Owner | Required update |
| --- | --- | --- |
| Daily while channel is blocked | Operations Manager | Channel status or blocker reason |
| After each invite batch | Operations Manager | Alias rows and status updates |
| After first learner activity | Product Manager EdTech | First sourced feedback item or feedback blocker |
| After first activity window | Data / Analytics Engineer | Aggregate activation/progress/readout status |
| Weekly | Project Manager / Delivery Manager | First-fix readiness review |

## First-Fix Gate

`first-fix-readiness.md` remains `blocked_by_missing_evidence`.

Do not rerun first-fix selection for a recruitment plan alone.

Rerun selection only when a real candidate has:

- Source evidence.
- Severity P0 or P1.
- Owner.
- Next action.
- Acceptance signal.
- Verification path.

## Next Step

Phase 62 should be one of:

- **Controlled Beta Invite Batch And Evidence Intake**, if a recruitment channel is selected.
- **Beta Recruitment Blocker Escalation**, if no channel can be confirmed.

## Acceptance Criteria

Phase 61 is complete when:

- Phase 60 escalation is reviewed.
- Recruitment execution paths are defined.
- Alias intake rules are explicit.
- Invite and feedback handoff is defined.
- Outreach constraints are claim-safe.
- Evidence update cadence is defined.
- `first-fix-readiness.md` remains blocked until real P0/P1 evidence exists.
- README and risk register reference Phase 61.
- No runtime/schema/content/prompt/provider/deploy files are changed.
- Documentation hygiene passes.

