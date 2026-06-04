# QC Final Report - ConfirmExitDialog Action Hierarchy

Vai chinh: Project Manager / Delivery Manager  
Vai phoi hop: QA Automation Engineer, Product Designer / UX/UI Designer, CTO / Tech Lead

## Input

Antigravity applied Codex QC follow-up for `apps/web/src/components/ui/confirm-exit-dialog.tsx`.

Previous blocker:

- Safe action `stayLabel` was styled as secondary.
- Destructive action `exitLabel` was styled as filled primary.

## Verdict

Resolved.

The `ConfirmExitDialog` now matches the P0 flow-safeguard contract:

- Stay action remains first.
- Stay action receives initial focus through `stayButtonRef`.
- Stay action is now the filled primary brand action.
- Leave action remains second.
- Leave action is now secondary/neutral outline.
- Mobile layout remains stacked via `flex flex-col sm:flex-row gap-3`.
- Both buttons retain visible `focus-visible` outlines.

## Code Inspection

File:

- `apps/web/src/components/ui/confirm-exit-dialog.tsx`

Relevant current classes:

- Stay button: `bg-[var(--fuxie-action)] text-white hover:bg-[var(--fuxie-action-hover)]`
- Leave button: `border border-[var(--fuxie-blue-200)] bg-white text-[var(--fuxie-blue-700)] hover:bg-[var(--fuxie-blue-50)]`

This satisfies:

- `docs/design/mockups/fuxie-p0-confirm-exit-dialog.md`
- `.kiro/specs/fuxie-ui-ux-p0-remediation/design.md` Contract 6
- `.kiro/specs/fuxie-ui-ux-p0-remediation/tasks.md` Wave 0.4

## Verification Performed By Codex

Commands/results:

- JSON parse for `apps/web/messages/vi.json`, `de.json`, `en.json`: pass.
- `next typegen .` from `apps/web`: pass.
- `check-locale-parity`: pass.
  - `vi=923 keys`
  - `de=923 keys`
  - TSX scan: 262 files.
- `check-visual-audit-pack`: pass.
  - 44 PNGs verified.
  - 4 invariants pass.
- `tsc --noEmit`: fails only on known unrelated baseline:
  - `src/components/listening/lesson-player.tsx(429,81): Type 'number | undefined' is not assignable to type 'string | number | Date'.`
- `npm run test` from `apps/web`: pass.
  - 102 test files passed.
  - 836 tests passed.

## Notes

Test stderr included known/non-failing noise:

- `next-intl` `timeZone` environment fallback warning in SSR-style tests.
- Mocked failure logs for writing grade, mission claim, and Firebase key guard tests.

These do not block this P0 remediation because the Vitest suite exited successfully.

## Residual Risks

- Full `tsc --noEmit` is still blocked by an unrelated listening lesson baseline error.
- Browser-level manual/E2E smoke was not run by Codex in this final QC pass; the action hierarchy was verified by code inspection and the available automated gates.
- `apps/web/public/sw.js` remains dirty from before this workstream and is outside this P0 remediation scope.

## Release Readiness

P0 `ConfirmExitDialog` action hierarchy is release-ready.

The broader P0 remediation can proceed to staging/commit review once the team accepts the documented unrelated TypeScript baseline blocker or assigns it as a separate fix.
