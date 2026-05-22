# Antigravity Masterplan: Fuxie Open Tasks Handoff

Date: 2026-05-13

## Role-Gate Compliance

Vai chinh: Project Manager / Delivery Manager
Vai phoi hop: Operations Manager, Product Manager EdTech, CEO / General Manager

This handoff was prepared under the mandatory Fuxie role-gate workflow:

- `task-startup-checklist.md` was read.
- `task-role-router.md` was read.
- Project Manager / Delivery Manager was selected because this handoff owns open-task sequencing, owner visibility, blockers, and delivery gates.
- Operations Manager, Product Manager EdTech, and CEO / General Manager profiles were read as support roles.
- This file is a handoff masterplan only. It must not be treated as learner evidence, runtime implementation, or beta proof.

## Purpose

The Codex quota is exhausted. This document packages all remaining Fuxie work so Antigravity with Gemini Pro High can continue without losing context.

The plan is deliberately detailed. Gemini should use it to:

- Continue from Phase 64, not restart the project.
- Keep all privacy and claim guardrails active.
- Execute only tasks that are supported by real evidence.
- Avoid fabricated learner data.
- Choose exactly one runtime implementation slice only after a real P0/P1 issue exists.

## Current Project State

Fuxie is `controlled-beta-ready-with-exclusions`.

Phases 0-64 are complete as documentation, governance, implementation, or evidence-tracking phases.

Latest completed phase:

- `docs/intake/phase-64-controlled-beta-outreach-execution-tracker.md`

Current beta operations status:

- Recruitment source decision: `community_outreach_selected`
- Invite Batch 001: `ready_to_send_claim_safe_outreach`
- Outreach tracker: `ready_for_outreach_execution`
- First-fix readiness: `blocked_by_missing_evidence`
- Runtime implementation: blocked until real evidence exists

Current main blocker:

- No real learner alias.
- No real learner feedback.
- No real cohort activity.
- No aggregate analytics snapshot.
- No real P0/P1 issue candidate.

## Files Gemini Must Read First

Read these files before planning or editing:

1. `.agents/workflows/task-startup-checklist.md`
2. `.agents/workflows/task-role-router.md`
3. `.agents/personnel/project-manager-delivery-manager.md`
4. `.agents/personnel/operations-manager.md`
5. `.agents/personnel/product-manager-edtech.md`
6. `docs/intake/README.md`
7. `docs/intake/risk-register.md`
8. `docs/intake/phase-64-controlled-beta-outreach-execution-tracker.md`
9. `docs/beta/controlled-beta/first-fix-readiness.md`
10. `docs/beta/controlled-beta/outreach-tracker.csv`
11. `docs/beta/controlled-beta/invite-batch-001.md`
12. `docs/beta/controlled-beta/cohort-roster.csv`
13. `docs/beta/controlled-beta/learner-feedback.md`
14. `docs/beta/controlled-beta/analytics-snapshot.md`
15. `docs/beta/controlled-beta/issue-log.md`
16. `docs/beta/controlled-beta/guardrail-checklist.md`

If the task shifts into engineering implementation, rerun the role gate and switch to the correct engineering primary role.

## Non-Negotiable Guardrails

Do not create fake learner data.

Do not record:

- Real names
- Emails
- Phone numbers
- Addresses
- Account IDs
- Private support messages
- Raw learner submissions
- Raw answers
- Audio transcripts
- Provider payloads
- Secrets

Keep these exclusions active:

- No official Goethe/Telc/OSD scoring claim.
- No provider-validated AI grading claim.
- No pronunciation precision claim.
- No public legal/privacy-approved marketing claim.
- No teacher/admin expansion as the primary beta promise.

Do not change runtime code, schema, content JSON, AI prompts, provider config, or deploy config unless a later evidence-backed phase explicitly selects a runtime implementation slice.

## Master Execution Order

### Step 1: Verify Workspace State

Goal: confirm the handoff matches the repo.

Commands:

```powershell
git status --short
Get-Content docs/intake/README.md -Tail 40
Get-Content docs/beta/controlled-beta/first-fix-readiness.md
Get-Content docs/beta/controlled-beta/outreach-tracker.csv
```

Expected:

- Phase 64 exists in README.
- `first-fix-readiness.md` is still `blocked_by_missing_evidence`.
- `outreach-tracker.csv` has `OUTREACH-001` as `ready_to_send`.
- There may be many unrelated dirty files from prior work. Do not revert them.

### Step 2: Execute Or Record Outreach State

Primary role: Operations Manager.

Gemini cannot actually send messages outside the repo unless the user provides the external channel or asks Antigravity to operate that tool. If no real channel evidence is available, do not mark outreach as sent.

Allowed outcomes:

- `sent`: user provides confirmation that outreach was actually sent.
- `blocked_no_channel_details`: community outreach was selected but no actual community/channel is available.
- `blocked_pending_owner_action`: Operations has not sent it yet.

Update:

- `docs/beta/controlled-beta/outreach-tracker.csv`
- If useful, create `docs/intake/phase-65-controlled-beta-outreach-response-review.md`

Acceptance:

- Outreach row has honest status.
- No PII is stored.
- If sent, sent date is recorded.
- If blocked, blocker reason and next action are recorded.

### Step 3: Add Real Learner Aliases Only If Supplied

Primary role: Operations Manager.

Only do this if the user supplies real beta response evidence or explicitly says a learner responded.

Alias format:

- `L-BETA-001`
- `L-BETA-002`
- Continue sequentially.

Never store real identity.

Update:

- `docs/beta/controlled-beta/cohort-roster.csv`

Allowed status values:

- `invited`
- `active`
- `responded`
- `dropped`
- `blocked`

Required fields:

- `learner_alias`
- `segment`
- `level`
- `status`
- `invite_date`
- `first_activity_date`
- `consent_feedback_notes`
- `owner`

Acceptance:

- At least one real alias exists.
- Notes are privacy-safe.
- The row does not contain name, email, phone, account ID, raw message, or raw submission.

### Step 4: Capture First Feedback

Primary role: Product Manager EdTech.

Only do this after a learner gives real feedback or activity evidence exists.

Update:

- `docs/beta/controlled-beta/learner-feedback.md`

Feedback surfaces:

- onboarding
- dashboard next action
- first meaningful action
- AI practice support
- reward loop
- speaking/audio practice
- account/access/support

Categories:

- `product_friction`
- `technical_defect`
- `content_academic_risk`
- `ai_audio_limitation`
- `analytics_gap`
- `ops_support_issue`

Severity:

- P0: blocks login, onboarding, core learning action, data/privacy safety, role boundary, or creates unsafe claim.
- P1: blocks major learner flow, hurts activation/retention, or creates misleading AI/exam/audio interpretation.
- P2: confusing or annoying but not blocking.

Acceptance:

- Feedback has source, surface, category, severity, owner, next action, and status.
- Feedback is summarized, not copied raw.

### Step 5: Add Aggregate Analytics Snapshot

Primary role: Data / Analytics Engineer.

Only do this after real learner activity exists.

Update:

- `docs/beta/controlled-beta/analytics-snapshot.md`

Metrics to fill:

- Activation: onboarding plus first meaningful action within 24h.
- D1 retention: meaningful action on day 1 after activation.
- D7 retention: meaningful action within day 7 window.
- Weekly meaningful CEFR progress: at least 3 meaningful learning actions in 7 days.
- Motivation quality: reward/streak/mission activity compared with real learning activity.
- AI feedback reliability: generated vs failed AI feedback events.

Rules:

- Use aggregate counts only.
- Do not expose raw event metadata.
- Do not count dashboard clicks or reward-only activity as learning progress.
- If no activity exists, keep `N/A` and say why.

Acceptance:

- Snapshot has timeframe, count/rate, interpretation, owner, and follow-up.
- It is honest about missing data.

### Step 6: Create Issue Candidate Only From Evidence

Primary role: Project Manager / Delivery Manager.

Update:

- `docs/beta/controlled-beta/issue-log.md`

Only create a real candidate if there is evidence from:

- cohort roster
- learner feedback
- analytics snapshot
- support report
- verified smoke/gate result

Required issue fields:

- issue id
- source
- category
- severity
- evidence summary
- owner
- next action
- acceptance signal
- status

Issue ID format:

- `ISSUE-BETA-001`
- `ISSUE-BETA-002`

Acceptance:

- No issue is created from opinion alone.
- P0/P1 has a clear verification path.
- Product, CTO, or QA owner is named where appropriate.

### Step 7: Rerun First-Fix Selection

Primary role: Project Manager / Delivery Manager.

Only run this step if at least one real P0/P1 candidate exists.

Update:

- `docs/beta/controlled-beta/first-fix-readiness.md`
- Create `docs/intake/phase-66-first-fix-selection-rerun-from-cohort-evidence.md` if evidence is ready.

Selection rule:

- Pick exactly one first runtime slice.
- P0 beats P1.
- Learner activation and data/privacy safety beat feature nice-to-haves.
- Do not pick more than one slice.

Allowed first-fix slice types:

- onboarding blocker fix
- dashboard next-action blocker fix
- first meaningful action blocker fix
- auth/access blocker fix
- unsafe AI/exam/audio claim fix
- analytics data-quality fix if it blocks measurement

Acceptance:

- One selected slice or explicit `blocked_by_missing_evidence`.
- Owner, acceptance signal, and verification commands are named.
- Runtime implementation starts in a separate phase after selection.

### Step 8: Implement The Selected Runtime Slice

Primary role: depends on selected issue.

Use this routing:

- Frontend/UI issue: Frontend Engineer, support Product Designer and QA.
- API/DB issue: Backend Engineer, support DevOps and Security.
- Next.js full flow issue: Full-stack Engineer, support QA and Product Designer.
- Analytics issue: Data / Analytics Engineer, support Product and Backend.
- AI issue: AI / LLM Engineer, support German Academic Lead and Data.
- Speaking/audio issue: Speech / Audio Engineer, support AI and QA.
- Content/CEFR issue: German Academic Lead or Content QA, support Content Writer.

Implementation guardrails:

- Keep scope narrow.
- Do not combine unrelated fixes.
- Add/update tests near touched files.
- Do not touch content JSON unless the issue is explicitly content-related.
- Do not add a migration unless the selected issue requires it and CTO/Backend owns it.

Expected commands after implementation:

```powershell
pnpm --filter @fuxie/web test
pnpm check:quick
git diff --check
```

Additional commands only when relevant:

```powershell
pnpm test:core
pnpm qa:content
pnpm check:ai-eval
pnpm env:audit
pnpm env:audit:services
pnpm smoke:full-local
```

Smoke rule:

- Run `pnpm smoke:full-local` only when DB, Redis, web, AI service, and dev-auth are ready.
- If prerequisites are missing, document `blocked_by_prerequisite`, not product failure.

## Recommended Gemini Pro High Work Mode

Use Gemini Pro High as a deliberate multi-pass reviewer/executor.

### Pass 1: Context Compression

Ask Gemini:

```text
Read the Fuxie role gate and controlled beta evidence files. Summarize the current state in 20 bullets max. Do not propose implementation yet. Identify what is evidence, what is blocker, and what is forbidden.
```

Expected output:

- Phase 64 is latest.
- Outreach ready.
- No learner evidence.
- First-fix blocked.
- Guardrails active.

### Pass 2: Evidence Integrity Audit

Ask Gemini:

```text
Audit docs/beta/controlled-beta for privacy, fabricated data, missing owner, missing next action, and mismatched status. Produce a table of issues and patch only docs if needed. Do not touch runtime code.
```

Expected output:

- No PII.
- No fake learner data.
- Any missing owner/status fixed in docs only.

### Pass 3: Outreach Execution Handoff

Ask Gemini:

```text
Prepare the next actionable Phase 65 based on the current outreach tracker. If no real outreach result is supplied, create an honest response review with status blocked_pending_owner_action. If the user supplies actual sent/response data, update outreach-tracker and cohort-roster without PII.
```

Expected output:

- Phase 65 doc.
- Tracker update.
- No fake alias unless user supplies real response.

### Pass 4: First-Fix Gate Decision

Ask Gemini:

```text
Check whether first-fix-readiness can move from blocked_by_missing_evidence to ready_for_first_fix_selection. Only mark ready if a real P0/P1 issue has source, severity, owner, next action, acceptance signal, and verification path.
```

Expected output:

- Ready or still blocked.
- Clear reason.

### Pass 5: Runtime Slice Implementation

Only use this pass after Pass 4 selects one slice.

Ask Gemini:

```text
Implement exactly one selected first-fix slice. Do not broaden scope. Add focused tests. Run the required gates. Summarize files changed, tests run, and remaining risks.
```

Expected output:

- Narrow code change.
- Tests.
- No unrelated refactor.

## Phase 65 Template

If no learner response exists, create:

- `docs/intake/phase-65-controlled-beta-outreach-response-review.md`

Suggested decision:

- `blocked_pending_owner_action` if outreach was not actually sent.
- `waiting_for_response` if outreach was sent but no response yet.
- `ready_for_alias_intake` if at least one real response exists.

Required sections:

- Role-Gate Compliance
- Team Acceptance Review
- Outreach Tracker Review
- Evidence State
- Decision
- Remaining Open Tasks
- Next Step
- Acceptance Criteria
- Test Plan

## Open Task Inventory

| Task | Owner | Current status | Can Gemini complete without external data? | Next action |
| --- | --- | --- | --- | --- |
| Send claim-safe outreach | Operations Manager | `ready_to_send` | No, unless user provides channel/send confirmation | Update `outreach-tracker.csv` honestly |
| Record learner alias | Operations Manager | Waiting | No | Add only after real response |
| Capture feedback | Product Manager EdTech | Waiting | No | Add only after real feedback/activity |
| Add analytics snapshot | Data / Analytics Engineer | Waiting | No | Add only after real activity |
| Create P0/P1 issue candidate | Project Manager / Delivery Manager | Waiting | No | Add only from evidence |
| Rerun first-fix selection | Project Manager / Delivery Manager | Blocked | No | Rerun after real P0/P1 candidate |
| Runtime implementation | Engineering role by domain | Blocked | No | Implement after one slice is selected |
| Academic final signoff | German Academic Lead | Pending | No, unless signoff evidence is supplied | Keep guardrails active |
| Provider-backed AI eval | AI / LLM Engineer | Pending | Only if provider key is locally available | Run `pnpm check:ai-eval` with provider evidence |
| Speaking/audio evidence | Speech / Audio Engineer | Pending | Partially, if services/browser/provider are available | Run smoke and document blocker/pass |
| Legal claim approval | Legal / Compliance Advisor | Pending | No, unless approval text is supplied | Keep public claims conservative |

## Definition Of Done For The Handoff

This masterplan is complete when:

- Antigravity can continue from Phase 64.
- All remaining work is sequenced.
- Every task has owner, blocker, next action, and acceptance signal.
- No learner evidence is fabricated.
- Gemini has exact prompts and pass structure.
- Runtime work remains blocked until evidence supports exactly one selected first-fix slice.

## Final Instruction To Gemini

Continue the project like a disciplined delivery lead, not like a feature generator.

The highest-value next move is not more product expansion. It is to get one real controlled-beta signal, classify it honestly, and only then choose one first fix.
