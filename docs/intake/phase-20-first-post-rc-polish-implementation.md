# Phase 20: First Post-RC Polish Implementation

Date: 2026-05-12

## Role-Gate Compliance

Vai chinh: Frontend Engineer
Vai phoi hop: Product Designer, QA Automation Engineer

This Phase 20 implementation was started under the mandatory role-gate workflow:

- `task-startup-checklist.md` was read.
- `task-role-router.md` was read.
- The Frontend Engineer, Product Designer, and QA Automation Engineer profiles were read.
- The task domain is UI component behavior, learner-facing error feedback, and focused release verification.

## Objective

Close `P19-A1`: add learner-facing error feedback when the vocabulary practice CTA cannot open review cards through `/api/v1/srs/cards`.

## Scope

Runtime scope is intentionally narrow:

- Update `apps/web/src/components/vocabulary/vocabulary-client.tsx`.
- Keep the existing vocabulary map and theme detail UI structure.
- Do not change API contracts, SRS behavior, routing, database schema, content JSON, or deploy config.

## Implementation Notes

The vocabulary client now keeps a visible practice error state for failed practice-open attempts.

Behavior:

- A retry starts by clearing the previous error.
- Theme selection and CEFR level switching clear stale errors.
- If the `/api/v1/srs/cards` request fails, the learner sees: `Chưa mở được ôn tập. Kiểm tra kết nối rồi thử lại nhé.`
- The message is rendered near the CTA surface that initiated the action.
- The alert uses `role="alert"` so the failure is not console-only.

## Acceptance Evidence

| Criterion | Status | Evidence |
| --- | --- | --- |
| Failed practice-open attempt tells learner what happened | Pass | Inline alert added for failed `/api/v1/srs/cards` request |
| Retry path exists | Pass | Retrying the same CTA clears the old error and calls the endpoint again |
| Stale errors do not linger across theme/level changes | Pass | Error state clears on theme selection and level switch success |
| No API/schema/content change | Pass | Change is contained to vocabulary client UI plus intake docs |

## Verification Plan

| Check | Result |
| --- | --- |
| `pnpm check:quick` | Pass |
| `git status --short` | Only Phase 20 runtime/docs files changed before commit |

## Risk Register Update

`R-014` can move from open P2 polish to closed because failed vocabulary CTA attempts now have visible learner feedback and `pnpm check:quick` passed.

## Next Planned Step: Phase 21 Dashboard Mascot LCP Review

Phase 21 should implement or decide `P19-A2`:

1. Route through Frontend Engineer with Product Designer and CTO / Tech Lead support.
2. Inspect the dashboard mascot/image priority warning.
3. Decide whether to set image priority, defer, or explicitly accept the warning.
4. Run the focused verification needed for the selected decision.
