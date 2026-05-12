# Phase 14: PR / Release Handoff

Date: 2026-05-12

## Role-Gate Compliance

Vai chinh: Project Manager / Delivery Manager
Vai phoi hop: QA Automation Engineer, CTO / Tech Lead

This Phase 14 handoff pass was started under the mandatory role-gate workflow:

- `task-startup-checklist.md` was read.
- `task-role-router.md` was read.
- The Project Manager / Delivery Manager, QA Automation Engineer, and CTO / Tech Lead profiles were read.
- The task domain is PR handoff, release notes, gate evidence, residual risk, and next-step coordination.

## Phase Objective

Phase 14 prepares the outward-facing release handoff for branch `codex/fuxie-release-readiness`.

This phase does not push the branch or create a PR automatically.

## Current Git State

| Item | Status |
| --- | --- |
| Branch | `codex/fuxie-release-readiness` |
| Working tree | Clean |
| Handoff commit | Phase 14 handoff docs committed on this branch |
| Push status | Not performed in Phase 14 |
| PR creation | Not performed in Phase 14 |

## RC Commit Stack

```text
ccab57e docs: add mandatory Fuxie company role gate
043289f docs: add Fuxie intake and RC baseline evidence
81222da feat: polish Fuxie learner dashboard and study surfaces
5c0101a docs: record phase 12 commit execution
04d9731 chore: update generated service worker artifact
8a12948 docs: record service worker artifact decision
<phase-14> docs: prepare RC release handoff
```

## PR Title

```text
Prepare Fuxie baseline RC package
```

## PR Body Draft

```markdown
## Summary

Prepares Fuxie for baseline RC review under the internal software company operating model.

This PR adds the mandatory Role-Gate governance system, personnel profiles, intake and baseline documentation, learner-facing UI polish, and the generated Serwist service worker artifact aligned with the current production build.

## Scope

- Add mandatory Role-Gate workflow for every Fuxie task.
- Add personnel profiles for the internal software company model.
- Add Phase 0-14 intake, stabilization, RC packaging, visual QA, staging, and artifact decision docs.
- Commit the runtime UI candidate slice signed off in Phase 10.
- Commit the generated `apps/web/public/sw.js` artifact after a passing `pnpm build`.

## Evidence

- `pnpm db:generate`: pass in Phase 7.
- `pnpm env:audit:services`: pass in Phase 7.
- `pnpm smoke:full-local`: pass in Phase 7 with web `http://localhost:3012` and AI `http://localhost:3001`.
- `pnpm check:quick`: pass in Phase 8.
- `pnpm test:core`: pass in Phase 8.
- `pnpm qa:content`: pass in Phase 8.
- `pnpm security:secrets`: pass in Phase 8.
- `pnpm build`: pass in Phase 8 and rerun pass in Phase 13 before `sw.js` commit.
- Phase 10 visual QA: pass for dashboard, mobile shell, vocabulary, practice hub, and leaderboard.

## Residual P2 Follow-Ups

- Add learner-facing error feedback for vocabulary CTA failure.
- Review dashboard mascot image priority to remove the LCP warning observed during visual QA.

## Release Notes

- Fuxie now has a documented company-style operating model with mandatory role routing.
- Baseline intake and risk evidence are captured through Phase 14.
- Local baseline blockers were closed for DB/Prisma, service readiness, dev-auth, AI health, and full smoke.
- Learner dashboard, vocabulary, practice hub, leaderboard, mascot/reward, and mobile shell candidate UI are ready for RC review.
- Generated `sw.js` is committed separately as a Serwist build artifact.

## Rollback Plan

- Revert governance docs independently if the operating model must be adjusted.
- Revert intake docs independently if handoff docs need restructuring.
- Revert runtime UI commit `81222da` independently for learner UI rollback.
- Revert generated service worker commit `04d9731` independently if build artifact policy changes.

## Checklist

- [x] Role-Gate governance added.
- [x] Intake docs added.
- [x] Runtime UI candidate committed separately.
- [x] Generated service worker artifact committed separately.
- [x] Working tree clean.
- [x] Residual risks documented as P2.
- [ ] Branch pushed.
- [ ] PR opened.
```

## Release Handoff Checklist

| Item | Status | Owner |
| --- | --- | --- |
| Working tree clean | Complete | Project Manager / Delivery Manager |
| RC commit stack documented | Complete | Project Manager / Delivery Manager |
| PR title/body prepared | Complete | Project Manager / Delivery Manager |
| Gate evidence listed | Complete | QA Automation Engineer |
| Residual P2 follow-ups listed | Complete | QA Automation Engineer |
| Generated artifact decision recorded | Complete | CTO / Tech Lead |
| Branch push | Pending approval | Project Manager / Delivery Manager |
| PR creation | Pending approval | Project Manager / Delivery Manager |

## Commands To Run After Approval

Push the branch:

```powershell
git push -u origin codex/fuxie-release-readiness
```

Then create a PR with the title and body above using the repository's preferred GitHub workflow.

## Acceptance Status

| Criterion | Status |
| --- | --- |
| Clean working tree confirmed | Pass |
| PR title prepared | Pass |
| PR body prepared | Pass |
| Release evidence included | Pass |
| Residual risks included | Pass |
| No unapproved push performed | Pass |

## Next Planned Step: Phase 15 Push And PR Creation

Phase 15 should run only after explicit approval to push/create a PR:

1. Push `codex/fuxie-release-readiness`.
2. Create PR with the Phase 14 title/body.
3. Attach release evidence and residual P2 follow-ups.
4. Report PR URL and final branch status.

Phase 15 status update: completed in `phase-15-push-and-pr-creation.md`. PR created at `https://github.com/contact454/fuxie/pull/2`.
