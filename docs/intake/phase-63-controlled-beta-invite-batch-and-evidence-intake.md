# Phase 63: Controlled Beta Invite Batch And Evidence Intake

Date: 2026-05-13

## Role-Gate Compliance

Vai chinh: Project Manager / Delivery Manager
Vai phoi hop: Operations Manager, Product Manager EdTech, Data / Analytics Engineer

This phase was implemented under the mandatory role-gate workflow:

- `task-startup-checklist.md` was read.
- `task-role-router.md` was read.
- Project Manager / Delivery Manager was selected because this phase owns blocker execution, owner visibility, and first-fix gating.
- Operations Manager, Product Manager EdTech, and Data / Analytics Engineer profiles were read as support roles.
- No runtime code, schema, content JSON, AI prompt, provider config, or deploy config is changed in this phase.

## Team Acceptance Review

Phase 62 is accepted as blocker escalation. It correctly identified that the only remaining executable beta blocker was the missing recruitment source decision.

Phase 63 executes the source decision with the least external dependency path:

Decision: `community_outreach_selected`.

Reason: the repository contains no evidence that an internal waitlist or partner learner pool is already approved. Community/manual outreach can start with claim-safe constraints while internal or partner sources remain optional later additions.

## Open Task Execution Status

| Open task | Owner | Phase 63 action | Current status | Acceptance signal |
| --- | --- | --- | --- | --- |
| Select recruitment channel | Operations Manager | Selected `community_outreach_selected` | Closed for channel decision | Source decision recorded in beta evidence |
| Start invite batch | Operations Manager | Created invite batch readiness record | Ready to execute outside repo | At least one learner alias is added after a real invite/response |
| Add learner aliases | Operations Manager | Kept blocked because no real learners were supplied | Blocked by real cohort data | Privacy-safe learner alias row exists without PII |
| Capture first learner feedback | Product Manager EdTech | Kept capture template ready | Blocked by learner activity | Sourced feedback has surface, category, severity, owner, next action |
| Create analytics snapshot | Data / Analytics Engineer | Kept aggregate readout template ready | Blocked by learner activity | Aggregate activation/retention/progress readout exists |
| Create real issue candidate | Project Manager / Delivery Manager | Kept first-fix gate blocked | Blocked by missing P0/P1 evidence | Real candidate has source, owner, severity, next action, acceptance signal, verification path |
| Rerun first-fix selection | Project Manager / Delivery Manager | Not rerun | Blocked by missing P0/P1 evidence | First-fix readiness checklist is complete |

## Invite Batch 001

Batch status: `ready_to_send_claim_safe_outreach`.

Selected source: `community_outreach_selected`.

Invite batch file: `docs/beta/controlled-beta/invite-batch-001.md`.

Target: 30-50 B2C Vietnamese learners of German, with A1-B1 preferred for first cohort signal.

Owner: Operations Manager.

Support: Product Manager EdTech, Growth Lead, Data / Analytics Engineer.

Required before recording learner evidence:

- Use learner aliases only.
- Do not record real names, emails, phone numbers, addresses, account identifiers, private messages, raw submissions, transcripts, provider payloads, or secrets.
- Do not claim official Goethe/Telc/OSD scoring.
- Do not claim provider-validated AI grading.
- Do not claim pronunciation precision.
- Do not claim public legal/privacy approval.

## Evidence Intake Trigger

After at least one real learner responds or becomes active, update:

- `docs/beta/controlled-beta/cohort-roster.csv`
- `docs/beta/controlled-beta/learner-feedback.md`
- `docs/beta/controlled-beta/analytics-snapshot.md`
- `docs/beta/controlled-beta/issue-log.md`
- `docs/beta/controlled-beta/first-fix-readiness.md`

## First-Fix Gate

The first-fix gate remains `blocked_by_missing_evidence`.

Reason: selecting a recruitment source is not the same as learner evidence. Runtime implementation remains blocked until a real P0/P1 candidate exists with source evidence, severity, owner, next action, acceptance signal, and verification path.

## Next Step

If real learner evidence appears, Phase 64 should be **First Fix Selection Rerun From Cohort Evidence**.

If no learner responds after the first invite batch window, Phase 64 should be **Controlled Beta Recruitment Conversion Review**.

## Acceptance Criteria

Phase 63 is complete when:

- The recruitment source decision is recorded.
- Invite Batch 001 is ready for claim-safe outreach.
- Evidence files reflect that learner aliases, feedback, analytics, and issue candidates still require real learner data.
- First-fix readiness remains blocked until real P0/P1 evidence exists.
- README and risk register reference Phase 63.
- No runtime/schema/content/prompt/provider/deploy files are changed.
- Documentation hygiene passes.
