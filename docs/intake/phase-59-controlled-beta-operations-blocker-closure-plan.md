# Phase 59: Controlled Beta Operations Blocker Closure Plan

Date: 2026-05-13

## Role-Gate Compliance

Vai chinh: Project Manager / Delivery Manager
Vai phoi hop: Operations Manager, Product Manager EdTech, CTO / Tech Lead

This phase was implemented under the mandatory role-gate workflow:

- `task-startup-checklist.md` was read.
- `task-role-router.md` was read.
- Project Manager / Delivery Manager was selected because this phase owns blocker closure sequencing, owner cadence, and first-fix readiness control.
- Operations Manager, Product Manager EdTech, and CTO / Tech Lead profiles were read as support roles.
- No runtime code, schema, content JSON, AI prompt, provider config, or deploy config is changed in this phase.

## Team Acceptance Review

Phase 58 is accepted with escalation. The team agrees that the current blocker is `controlled_beta_operations_blocker`, not a runtime defect.

Fuxie cannot choose a first implementation slice until the team records real controlled beta evidence.

| Function | Verdict | Notes |
| --- | --- | --- |
| Project / Delivery | Accepted with closure plan | Runtime work remains blocked until evidence-backed P0/P1 exists |
| Operations | Owner action required | Owns recruitment source, invite process, learner aliases, and cohort status |
| Product Manager EdTech | Owner action required | Owns feedback capture and friction classification |
| CTO / Tech Lead | Accepted with condition | Runtime slice requires verification path and evidence-backed acceptance signal |

## Objective

Close the controlled beta operations blocker by creating a practical path to gather the minimum evidence required for first-fix selection.

Phase 59 does not create learner data, does not invent feedback, and does not choose a runtime slice.

## Recruitment Source Plan

Target cohort: 30-50 Vietnamese German learners.

| Source | Owner | Use | Acceptance signal |
| --- | --- | --- | --- |
| Existing Fuxie waitlist or internal learner contacts | Operations Manager | First invite pool if available | Privacy-safe aliases added to `cohort-roster.csv` |
| DMF Schule / partner learner pool | Operations Manager + Sales / Partnership Manager | Secondary invite pool if approved | Invite source documented without PII |
| Community/manual outreach | Growth Lead + Operations Manager | Backup recruitment channel | Recruitment shortfall reason documented if unavailable |

Learner records must use aliases only. Do not record names, emails, phone numbers, addresses, account identifiers, or private support messages in repo docs.

## Invite, Consent, And Feedback Flow

| Step | Owner | Output | Acceptance signal |
| --- | --- | --- | --- |
| Prepare invite batch | Operations Manager | Alias list with status `invited` | 30-50 aliases or approved recruitment shortfall |
| Confirm consent/feedback permission | Operations Manager | Privacy-safe consent note | Consent note avoids PII and private details |
| Observe first learner session | Product Manager EdTech | Feedback item for onboarding, dashboard, first action, AI, or reward | Feedback has source, surface, category, severity, owner, next action |
| Capture aggregate analytics | Data / Analytics Engineer | Activation/retention/progress/motivation/AI readout when activity exists | Aggregate snapshot, no raw learner data |
| Review first-fix readiness | Project Manager / Delivery Manager + CTO / Tech Lead | Candidate gate decision | P0/P1 candidate has source, owner, acceptance signal, verification path |

Allowed learner statuses:

- `invited`
- `active`
- `responded`
- `dropped`
- `blocked`

## Owner Cadence

| Cadence | Owner | Agenda | Output |
| --- | --- | --- | --- |
| Daily until blocker closes | Operations Manager | Recruitment progress and blocked invite sources | Updated blocker status |
| Twice weekly | Product Manager EdTech | Feedback intake and friction classification | Feedback log or feedback shortfall |
| Twice weekly after learner activity | Data / Analytics Engineer | Aggregate readout readiness | Analytics snapshot or data blocker |
| Weekly | Project Manager / Delivery Manager | First-fix readiness review | Keep blocked, rerun selection, or escalate |

## Minimum Evidence Package

First-fix selection can run only when the repo has:

- At least one real privacy-safe cohort entry or approved recruitment shortfall.
- At least one sourced feedback item, aggregate analytics readout, or real issue candidate.
- If selecting a runtime fix: one P0/P1 candidate with source, severity, owner, next action, acceptance signal, and verification path.
- Guardrails still active for exam scoring, provider-validated AI grading, pronunciation precision, and public legal/privacy claims.

## Escalation Rule

If recruitment cannot start, keep the result as `operations_blocker_still_open` and record:

- Blocker reason.
- Owner.
- Next action.
- External dependency if any.
- Date for next recheck.

If minimum evidence appears, mark `operations_blocker_ready_to_close` and rerun evidence-backed first-fix selection in the next phase.

## Current Decision

Current result: `operations_blocker_still_open`.

Reason: the repo still contains only controlled beta operations blocker records, not real learner cohort evidence.

Runtime implementation remains blocked.

## Next Step

Phase 60 should be one of:

- **First Fix Selection Rerun**, if evidence appears and at least one P0/P1 candidate is complete.
- **Beta Operations Escalation Review**, if recruitment, feedback, and analytics evidence remain unavailable.

## Acceptance Criteria

Phase 59 is complete when:

- Phase 58 escalation is reviewed.
- Recruitment source plan is defined.
- Invite, consent, and feedback flow is defined.
- Owner cadence is explicit.
- Minimum evidence package is explicit.
- `first-fix-readiness.md` remains blocked until real P0/P1 evidence exists.
- README and risk register reference Phase 59.
- No runtime/schema/content/prompt/provider/deploy files are changed.
- Documentation hygiene passes.

