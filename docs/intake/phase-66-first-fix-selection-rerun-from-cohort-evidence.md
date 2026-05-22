# Phase 66: First Fix Selection Rerun From Cohort Evidence

Date: 2026-05-13

## Role-Gate Compliance

- **Vai chinh**: Project Manager / Delivery Manager
- **Vai phoi hop**: Product Manager EdTech, CTO / Tech Lead, QA Automation Engineer
- **Checklist Applied**: Yes.
- **Reroute Triggered**: Yes. After this phase is accepted, the project transitions to CTO / Tech Lead and Full-stack Engineer for runtime implementation.

## Evidence Intake Review

- **Outreach Status**: Sent via Facebook and Email on 2026-05-13.
- **Learner Alias**: Awaiting real response (`0` created).
- **Verified Smoke Source**: The Fuxie local smoke pipeline (`pnpm smoke:full-local`) was successfully run.
- **Identified Blockers**:
  - `ISSUE-BETA-001` (P0): Dev Auth login did not return a cookie for role learner. This blocks all onboarding and learning features locally.
  - `ISSUE-BETA-002` (P0): Provider-backed AI eval is blocked by a missing provider key.

## First-Fix Selection

- **Selected Slice**: `ISSUE-BETA-001` (Auth/Access blocker fix).
- **Reasoning**: Without a functioning local Dev Auth system, we cannot simulate learner logins, authenticate API routes, or verify onboarding flows. This is a hard prerequisite for all feature work and beta testing.
- **Owner**: CTO / Tech Lead
- **Acceptance Signal**: `pnpm smoke:full-local` successfully logs in the dev learner and returns a valid cookie.

## Implementation Guardrails

- Focus strictly on fixing the local Dev Auth system.
- Do not build a production authentication system or change Prisma schema unless explicitly required for the local Dev Auth fix.
- Do not bundle `ISSUE-BETA-002` (AI Eval fix) into this slice.

## Next Steps

1. Reroute primary role to **CTO / Tech Lead** and support role to **Full-stack Engineer**.
2. Research the Dev Auth implementation (likely in `apps/web/src/app/api/auth` or `scripts/smoke-full-local.ts`).
3. Prepare the implementation plan for fixing the Dev Auth mechanism.
