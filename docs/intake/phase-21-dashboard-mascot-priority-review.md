# Phase 21: Dashboard Mascot Priority Review

Date: 2026-05-12

## Role-Gate Compliance

Vai chinh: Frontend Engineer
Vai phoi hop: Product Designer, CTO / Tech Lead

This Phase 21 implementation was started under the mandatory role-gate workflow:

- `task-startup-checklist.md` was read.
- `task-role-router.md` was read.
- The Frontend Engineer, Product Designer, and CTO / Tech Lead profiles were read.
- The task domain is dashboard UI performance polish and image-loading priority review.

## Objective

Close `P19-A2`: review the dashboard mascot image priority warning reported during Phase 10 visual QA.

## Source Evidence

Phase 10 browser log review reported a Next.js image priority warning for the dashboard mascot asset:

```text
fuxie-3d-game-streak-freeze-saved-512.webp
```

The relevant dashboard usage is the streak-freeze safety coach panel in `apps/web/src/components/dashboard/dashboard-client.tsx`, which passes the streak-freeze mascot through the shared `FuxieCoach` component.

## Decision

Resolve the warning by allowing `FuxieCoach` to forward a `priority` prop to its internal `next/image`, then mark the dashboard streak-freeze mascot as priority only when that mascot is actually used.

Rationale:

- The warning came from a dashboard mascot that can be treated as above-the-fold/LCP in the checked dashboard state.
- `FuxieCoach` is shared, so the fix must be opt-in instead of making every coach image priority.
- The change does not alter image source, sizing, layout, copy, data, API, schema, or asset files.

## Implementation Notes

Changed files:

- `apps/web/src/components/gamification/quest-visuals.tsx`
- `apps/web/src/components/dashboard/dashboard-client.tsx`

Behavior:

- `FuxieCoach` now accepts optional `priority?: boolean`.
- The prop is forwarded to the internal `Image`.
- The dashboard streak-freeze safety coach passes `priority={Boolean(latestUsage || hasFreezeReady)}` when using `FUXIE_3D_ASSETS.streakFreezeSaved`.

## Acceptance Evidence

| Criterion | Status | Evidence |
| --- | --- | --- |
| Dashboard mascot LCP priority warning is addressed | Pass | Streak-freeze coach image can now be marked `priority` |
| Shared component remains conservative | Pass | `FuxieCoach` defaults `priority` to `false` |
| No layout or content change | Pass | Image source, size, copy, and dashboard structure unchanged |
| No API/schema/content change | Pass | Change is contained to UI runtime and intake docs |

## Verification Plan

| Check | Result |
| --- | --- |
| `pnpm check:quick` | Pass |
| `git status --short` | Only Phase 21 runtime/docs files changed before commit |

## Next Planned Step: Phase 22 CI Node Deprecation Follow-Up

Phase 22 should handle `P19-A3`:

1. Route through DevOps / Cloud Engineer with CTO / Tech Lead and QA Automation Engineer support.
2. Inspect GitHub Actions workflow versions and the Node 20 deprecation warning.
3. Decide whether to update action versions now or record an explicit owner/date follow-up.
4. Run or wait for CI verification.
