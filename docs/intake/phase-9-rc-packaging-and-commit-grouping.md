# Phase 9: RC Packaging And Commit Grouping

Date: 2026-05-12

## Role-Gate Compliance

Vai chinh: Project Manager / Delivery Manager
Vai phoi hop: CTO / Tech Lead, QA Automation Engineer, Product Designer / UX/UI Designer

This Phase 9 RC packaging pass was started under the mandatory role-gate workflow:

- `task-startup-checklist.md` was read.
- `task-role-router.md` was read.
- The Project Manager / Delivery Manager, CTO / Tech Lead, QA Automation Engineer, and Product Designer / UX/UI Designer profiles were read.
- The task domain is release packaging, commit grouping, release notes, rollback ownership, and baseline acceptance coordination.

## Phase Objective

Phase 9 turns the Phase 8 RC governance decision into a packaging plan. It defines what belongs in each commit/staging group, what is held out, what requires owner signoff, and what release notes/rollback ownership should accompany an RC candidate.

Phase 9 does not run `git add` automatically because runtime UI diffs and generated `sw.js` still require explicit signoff before real staging.

## Current Source State

Tracked modified files:

```text
M .gitignore
M apps/web/public/sw.js
M apps/web/src/app/globals.css
M apps/web/src/components/dashboard/dashboard-client.tsx
M apps/web/src/components/gamification/quest-visuals.tsx
M apps/web/src/components/leaderboard/LeaderboardClient.tsx
M apps/web/src/components/vocabulary/practice-hub.tsx
M apps/web/src/components/vocabulary/vocabulary-client.tsx
```

Untracked release-governance files:

```text
AGENTS.md
.agents/personnel/*.md
.agents/workflows/company-operating-model.md
.agents/workflows/task-role-router.md
.agents/workflows/task-startup-checklist.md
docs/intake/*.md
```

Held out by `.gitignore`:

```text
.agents/workflows/generate-images.md
```

Reason: the current governance `.gitignore` only permits the mandatory operating workflows. `generate-images.md` is not part of the mandatory Role-Gate slice.

## Commit Group Plan

| Group | Purpose | Files | Owner | Stage decision |
| --- | --- | --- | --- | --- |
| G1 Governance operating model | Enforce mandatory Role-Gate and personnel model | `AGENTS.md`, `.gitignore`, `.agents/personnel/*.md`, `.agents/workflows/company-operating-model.md`, `.agents/workflows/task-role-router.md`, `.agents/workflows/task-startup-checklist.md` | Project Manager / Delivery Manager | Ready to stage |
| G2 Intake and baseline documentation | Preserve Phase 0-9 evidence, plans, risk register, roadmap, baseline report | `docs/intake/*.md` | Project Manager / Delivery Manager | Ready to stage |
| G3 Runtime UI candidate slice | Learner-facing UI improvements in dashboard, vocabulary, leaderboard, gamification, mobile shell | `apps/web/src/app/globals.css`, dashboard, gamification, leaderboard, vocabulary files | Product Designer / UX/UI Designer + QA Automation Engineer | Conditional; stage only after Product/QA signoff |
| G4 Generated service worker artifact | Serwist clean-build generated service worker | `apps/web/public/sw.js` | CTO / Tech Lead | Conditional; stage only if CTO chooses to commit generated artifact |
| G5 Local/generated outputs | Logs, content QA report, temporary local outputs | `tmp/*`, ignored local files | QA Automation Engineer | Do not stage |

## Suggested Staging Commands

Do not run these until the responsible owner approves each group.

Governance slice:

```powershell
git add AGENTS.md .gitignore .agents/personnel .agents/workflows/company-operating-model.md .agents/workflows/task-role-router.md .agents/workflows/task-startup-checklist.md
```

Intake docs slice:

```powershell
git add docs/intake
```

Runtime UI candidate slice:

```powershell
git add apps/web/src/app/globals.css apps/web/src/components/dashboard/dashboard-client.tsx apps/web/src/components/gamification/quest-visuals.tsx apps/web/src/components/leaderboard/LeaderboardClient.tsx apps/web/src/components/vocabulary/practice-hub.tsx apps/web/src/components/vocabulary/vocabulary-client.tsx
```

Generated service worker artifact:

```powershell
git add apps/web/public/sw.js
```

## Release Notes Draft

### Governance

- Added mandatory Role-Gate operating model for all Fuxie tasks.
- Added personnel profiles for the internal software company model.
- Added task router and startup checklist to force role selection and profile reading before work.

### Intake And Baseline

- Added Phase 0-9 intake documentation.
- Established current-state audit, risk register, technical baseline report, North Star roadmap, and 30/60/90 execution plan.
- Closed local baseline blockers for Redis/Postgres readiness, Prisma generate, web health, dev-auth, AI health, and full local smoke.

### Runtime UI Candidate

- Improved mobile shell bottom spacing.
- Added image optimization hints for mascot/theme images.
- Improved vocabulary practice CTA states and SRS card API failure handling.
- Added richer leaderboard empty/error state with dashboard/review recovery paths.

### Generated Artifact

- `apps/web/public/sw.js` is generated by Serwist during `pnpm build` and should only be included if CTO accepts generated artifacts in the RC.

## Rollback Ownership

| Area | Rollback owner | Rollback path |
| --- | --- | --- |
| Governance docs | Project Manager / Delivery Manager | Revert governance commit group only |
| Intake docs | Project Manager / Delivery Manager | Revert intake docs commit group only |
| Runtime UI | Frontend Engineer + Product Designer | Revert runtime UI commit group or hold out from RC |
| Generated `sw.js` | CTO / Tech Lead | Regenerate from clean build or restore tracked artifact by policy |
| Release gates | QA Automation Engineer | Stop RC promotion and rerun gate matrix after rollback |

## RC Package Checklist

| Checklist item | Status | Owner |
| --- | --- | --- |
| Role-Gate governance ready | Ready | Project Manager / Delivery Manager |
| Intake docs ready | Ready | Project Manager / Delivery Manager |
| Runtime UI signoff complete | Pending | Product Designer / UX/UI Designer + QA Automation Engineer |
| `sw.js` stage decision complete | Pending | CTO / Tech Lead |
| Release gates pass | Complete | QA Automation Engineer |
| Full local smoke pass | Complete | QA Automation Engineer |
| Baseline acceptance note created | Complete | Project Manager / Delivery Manager |
| Rollback owner named | Complete | Project Manager / Delivery Manager |

## Baseline Acceptance Decision

Fuxie is accepted as a local baseline candidate for RC packaging.

Accepted evidence:

- `pnpm db:generate` passes.
- `pnpm env:audit:services` passes.
- `pnpm smoke:full-local` passes with web port 3012 and AI port 3001.
- `pnpm check:quick` passes.
- `pnpm test:core` passes.
- `pnpm qa:content` passes.
- `pnpm security:secrets` passes.
- `pnpm build` passes.

Conditions before final release:

- Runtime UI visual/product signoff.
- CTO decision on generated `sw.js`.
- Commit grouping is staged separately.
- Optional browser visual QA for mobile shell, leaderboard, dashboard, and vocabulary.

## Phase 9 Acceptance Status

| Criterion | Status |
| --- | --- |
| Commit groups defined | Pass |
| Hold-out files identified | Pass |
| Release notes drafted | Pass |
| Rollback owner defined | Pass |
| Baseline acceptance note created | Pass |
| No unapproved staging performed | Pass |

## Next Planned Step: Phase 10 Visual QA And Final RC Signoff

Phase 10 should run focused visual/product QA before final release:

1. Verify mobile shell bottom spacing.
2. Verify dashboard mascot priority behavior.
3. Verify gamification and vocabulary image sizing.
4. Verify vocabulary CTA loading/error states.
5. Verify leaderboard empty/error state on desktop and mobile.
6. Capture final Product Designer + QA signoff.
