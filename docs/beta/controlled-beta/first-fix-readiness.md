# Controlled Beta First Fix Readiness

Status: `ready_for_first_fix_selection`

## Readiness Checklist

| Requirement | Current status | Owner |
| --- | --- | --- |
| At least one cohort roster entry or documented recruitment shortfall exists | `community_outreach_selected` on 2026-05-13; Outreach sent via Facebook and Email | Operations Manager |
| At least one feedback, issue, or analytics evidence item exists | `verified_smoke_result_recorded` | Project Manager / Delivery Manager |
| Candidate issue has source evidence | `smoke:full-local` | Project Manager / Delivery Manager |
| Candidate issue has severity P0 or P1 | P0 | Product Manager EdTech + CTO / Tech Lead |
| Candidate issue has owner and next action | CTO / Tech Lead | Project Manager / Delivery Manager |
| Candidate issue has acceptance signal and test/verification path | `pnpm smoke:full-local` passes Dev auth login | CTO / Tech Lead + QA Automation Engineer |
| Existing AI/exam/audio/legal exclusions remain enforced | Active | Project Manager / Delivery Manager |

## Decision

Selected first-fix slice: **ISSUE-BETA-001** (auth/access blocker fix)
Reason: `smoke:full-local` is failing locally because Dev Auth login does not return a cookie for role learner. This is a P0 blocker for onboarding and core learning flows. Fixing this allows the local smoke tests to pass and developers to work locally.

## Escalation

Current escalation: `cleared`.

## Next Step

Proceed to Phase 66 to document the First-Fix Selection, then implement the selected slice (Dev Auth fix) under the guidance of the CTO / Tech Lead.
