# Controlled Beta Issue Log

Status: `blocked_by_missing_evidence`

## Issue Rules

- P0 blocks login, onboarding, core learning action, data/privacy safety, role boundary, or creates unsafe claim.
- P1 blocks major learner flow, materially hurts activation/retention, or creates misleading AI/exam/audio interpretation.
- P2 is usability friction, confusing copy, non-blocking analytics gap, or support issue.
- Do not add a runtime fix candidate without source evidence and owner.

## Issues

| Issue ID | Source | Category | Severity | Evidence summary | Owner | Next action | Acceptance signal | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ISSUE-SHORTFALL-001 | Phase 63 source decision | `ops_support_issue` | N/A | Community/manual outreach is selected, but no learner cohort, feedback, analytics, smoke, or support evidence exists yet; no runtime issue can be selected | Project Manager / Delivery Manager | Keep first-fix gate blocked until sourced beta evidence exists | At least one real P0/P1 candidate has source, owner, next action, acceptance signal, and verification path | `closed` |
| ISSUE-BETA-001 | Verified smoke result (`smoke:full-local`) | `technical_defect` | P0 | Dev auth login did not return a cookie for role learner. Auth is failing locally, blocking onboarding and learning. | CTO / Tech Lead | Fix local Dev Auth environment configuration or implementation to ensure dev cookie is returned. | `pnpm smoke:full-local` passes Dev auth login | `closed` |
| ISSUE-BETA-002 | Verified eval result (`check:ai-eval`) | `technical_defect` | P0 | Provider-backed AI eval blocked by missing provider key. | AI / LLM Engineer | Configure provider key locally or fix environment loading. | `pnpm eval:ai -- --provider` passes without `blocked_missing_provider_key` | `closed` |

## Fix Selection Note

Current first fix readiness: `blocked_by_missing_evidence`.

Phase 63 note: implementation remains blocked because the only recorded item is a recruitment source decision, not learner evidence or a runtime defect.
