# Phase 12: Approved Staging And Commit Execution

Date: 2026-05-12

## Role-Gate Compliance

Vai chinh: Project Manager / Delivery Manager
Vai phoi hop: CTO / Tech Lead, QA Automation Engineer, Product Designer / UX/UI Designer

This Phase 12 execution pass was started under the mandatory role-gate workflow:

- `task-startup-checklist.md` was read.
- `task-role-router.md` was read.
- The Project Manager / Delivery Manager, CTO / Tech Lead, QA Automation Engineer, and Product Designer / UX/UI Designer profiles were read.
- The task domain is approved staging, commit execution, release traceability, and remaining release-blocker tracking.

## Phase Objective

Phase 12 executes the approved parts of the RC package while preserving rollback boundaries.

Execution rule for this pass:

- Stage and commit G1 Governance.
- Stage and commit G2 Intake docs.
- Stage and commit G3 Runtime UI candidate.
- Do not stage G4 `apps/web/public/sw.js` until CTO/user decision is explicit.
- Do not stage G5 local/generated hold-outs.

## Branch Context

Current branch at execution start:

```text
codex/fuxie-release-readiness
```

No new branch is required because the workspace is already on a Codex release-readiness branch.

## Execution Plan

| Step | Scope | Files | Status |
| --- | --- | --- | --- |
| 1 | Governance commit | `AGENTS.md`, `.gitignore`, mandatory `.agents/personnel`, mandatory `.agents/workflows` | Complete: `ccab57e` |
| 2 | Intake docs commit | `docs/intake/*.md` | Complete: `043289f` |
| 3 | Runtime UI commit | Dashboard, gamification, leaderboard, vocabulary, global CSS runtime files | Complete: `81222da` |
| 4 | Generated `sw.js` | `apps/web/public/sw.js` | Held pending CTO/user decision |
| 5 | Final status check | `git status --short` | Complete; only `apps/web/public/sw.js` remains modified |

## Commit Messages

| Commit | Message |
| --- | --- |
| Governance | `docs: add mandatory Fuxie company role gate` |
| Intake docs | `docs: add Fuxie intake and RC baseline evidence` |
| Runtime UI | `feat: polish Fuxie learner dashboard and study surfaces` |

## Acceptance Criteria

| Criterion | Status |
| --- | --- |
| Role-Gate followed | Pass |
| Commit groups preserve rollback boundaries | Pass |
| `sw.js` remains unstaged | Pass |
| Local/generated hold-outs remain unstaged | Pass |
| Final git status is documented | Pass |

## Execution Results

Commits created:

```text
ccab57e docs: add mandatory Fuxie company role gate
043289f docs: add Fuxie intake and RC baseline evidence
81222da feat: polish Fuxie learner dashboard and study surfaces
```

Final uncommitted tracked file:

```text
M apps/web/public/sw.js
```

Reason: `apps/web/public/sw.js` is a generated Serwist artifact and remains held until CTO/user chooses stage, regenerate, or restore.

## Next Planned Step: Phase 13 CTO `sw.js` Decision And RC Finalization

Phase 13 should resolve the generated service worker artifact:

1. CTO decides whether to stage, regenerate and stage, or restore `apps/web/public/sw.js`.
2. If staged, create a separate generated-artifact commit.
3. If restored, record the policy and ensure build/deploy expectations remain valid.
4. Run or confirm the required release gate after the final artifact decision.
5. Prepare PR/release handoff.

Phase 13 status update: completed in `phase-13-cto-swjs-decision-and-rc-finalization.md`. The generated `sw.js` artifact was committed separately as `04d9731` after `pnpm build` passed.
