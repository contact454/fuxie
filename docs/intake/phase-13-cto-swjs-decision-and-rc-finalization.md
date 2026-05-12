# Phase 13: CTO `sw.js` Decision And RC Finalization

Date: 2026-05-12

## Role-Gate Compliance

Vai chinh: CTO / Tech Lead
Vai phoi hop: Project Manager / Delivery Manager, QA Automation Engineer

This Phase 13 pass was started under the mandatory role-gate workflow:

- `task-startup-checklist.md` was read.
- `task-role-router.md` was read.
- The CTO / Tech Lead, Project Manager / Delivery Manager, and QA Automation Engineer profiles were read.
- The task domain is technical artifact policy, production build evidence, release finalization, and generated service worker ownership.

## Phase Objective

Phase 13 resolves the last RC blocker: whether `apps/web/public/sw.js` should be staged, regenerated, or restored.

## Technical Context

`apps/web/next.config.ts` configures Serwist as:

```ts
const withSerwist = withSerwistInit({
    swSrc: 'src/app/sw.ts',
    swDest: 'public/sw.js',
    disable: process.env.NODE_ENV !== 'production',
    reloadOnOnline: true,
})
```

This means `apps/web/public/sw.js` is a production-build generated service worker artifact. It is already tracked by the repository, so the release decision is whether to keep the generated output aligned with the current production build.

## Decision

Stage and commit the generated `apps/web/public/sw.js` artifact.

Rationale:

- The file is already tracked.
- `pnpm build` regenerates it through the documented Serwist path.
- The post-build diff was limited to `apps/web/public/sw.js`.
- The diff size was one insertion and one deletion in the bundled artifact.
- Keeping it as a separate commit preserves rollback boundaries.

## Verification Evidence

| Check | Command | Status | Notes |
| --- | --- | --- | --- |
| Production build | `pnpm build` | Pass | Web and AI service builds completed; Serwist bundled `/sw.js`; 74 web static pages generated |
| Dirty tree before artifact commit | `git status --short` | Expected | Only `apps/web/public/sw.js` was modified |
| Artifact diff size | `git diff --stat -- apps/web/public/sw.js` | Expected | `1 insertion(+), 1 deletion(-)` |
| Generated artifact commit | `git commit -m "chore: update generated service worker artifact"` | Complete | Commit `04d9731` |

## Commit Result

```text
04d9731 chore: update generated service worker artifact
```

## Final RC Commit Stack

```text
ccab57e docs: add mandatory Fuxie company role gate
043289f docs: add Fuxie intake and RC baseline evidence
81222da feat: polish Fuxie learner dashboard and study surfaces
5c0101a docs: record phase 12 commit execution
04d9731 chore: update generated service worker artifact
```

## Residual Release Notes

Remaining non-blocking P2 follow-ups:

- Add learner-facing error feedback for vocabulary CTA failure.
- Review dashboard mascot image priority to remove the LCP warning observed during visual QA.

## Acceptance Status

| Criterion | Status |
| --- | --- |
| CTO `sw.js` decision is explicit | Pass |
| Production build passed before artifact commit | Pass |
| Generated artifact committed separately | Pass |
| No runtime code changed in Phase 13 | Pass |
| Remaining risks are P2 only | Pass |

## Next Planned Step: Phase 14 PR / Release Handoff

Phase 14 should prepare the outward release handoff:

1. Confirm final `git status --short` is clean except any local ignored files.
2. Prepare PR title, PR body, and release notes from Phase 9-13.
3. Include gate evidence and residual P2 follow-ups.
4. Push branch and create PR only after explicit approval.
