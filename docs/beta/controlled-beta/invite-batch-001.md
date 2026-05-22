# Controlled Beta Invite Batch 001

Status: `ready_to_send_claim_safe_outreach`

Date prepared: 2026-05-13

Selected channel: `community_outreach_selected`

Execution tracker: `docs/beta/controlled-beta/outreach-tracker.csv`

Owner: Operations Manager

Support: Product Manager EdTech, Growth Lead, Data / Analytics Engineer

## Purpose

Recruit the first 30-50 B2C Vietnamese learners of German for controlled beta evidence.

This batch is for evidence collection, not public launch.

## Claim-Safe Outreach Rules

- Say Fuxie is in controlled beta.
- Say the beta is for Vietnamese learners practicing German.
- Say feedback will help improve onboarding, dashboard next action, first learning action, AI practice support, and motivation loop.
- Do not claim official Goethe/Telc/OSD scoring.
- Do not claim provider-validated AI grading.
- Do not claim pronunciation precision.
- Do not claim public legal/privacy approval.
- Do not record real names, emails, phone numbers, addresses, account identifiers, private messages, raw submissions, transcripts, provider payloads, or secrets in repo docs.

## Outreach Copy Draft

Fuxie is opening a small controlled beta for Vietnamese learners who are studying German.

We are looking for early learners to try onboarding, the daily study suggestion, the first practice action, and optional AI practice support. The goal is to learn where the product is helpful or confusing, not to provide official exam scoring.

If you join, feedback will be recorded only as a privacy-safe learner alias and summarized notes. Please do not send private documents or sensitive personal information through the feedback channel.

## Intake Steps

| Step | Owner | Output | Status |
| --- | --- | --- | --- |
| Send claim-safe invite through selected community/manual channel | Operations Manager | First outreach sent | `ready_to_send` |
| Assign privacy-safe learner alias after real response | Operations Manager | `cohort-roster.csv` row | `waiting_for_response` |
| Capture first feedback item after activity | Product Manager EdTech | `learner-feedback.md` entry | `waiting_for_activity` |
| Add aggregate readout after activity exists | Data / Analytics Engineer | `analytics-snapshot.md` update | `waiting_for_activity` |
| Log P0/P1 issue only if evidence supports it | Project Manager / Delivery Manager | `issue-log.md` entry | `waiting_for_evidence` |

## Completion Criteria

Invite Batch 001 becomes evidence-ready when at least one real learner alias is recorded without PII and at least one feedback, aggregate metric, or issue evidence item exists.

Until then, first-fix selection remains blocked.
