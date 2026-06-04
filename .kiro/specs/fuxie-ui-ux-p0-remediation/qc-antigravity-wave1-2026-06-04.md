# QC Report - Antigravity Wave 1/2 Intake

Vai chinh: Project Manager / Delivery Manager  
Vai phoi hop: QA Automation Engineer, Product Designer / UX/UI Designer, CTO / Tech Lead

## Input

Antigravity reported that Wave 1 and Wave 2 are complete, with one code hardening change in `apps/web/src/components/ui/confirm-exit-dialog.tsx`: mobile buttons now stack vertically using `flex flex-col sm:flex-row`.

## Verdict

Not release-ready yet.

Most reported verification results are consistent with local Codex QC, but one design-safety blocker remains in `ConfirmExitDialog`: the destructive exit action is styled as the filled primary action, while the safe stay action is styled as the secondary outline action.

This conflicts with:

- `docs/design/mockups/fuxie-p0-confirm-exit-dialog.md`
- `.kiro/specs/fuxie-ui-ux-p0-remediation/design.md` Contract 6
- `.kiro/specs/fuxie-ui-ux-p0-remediation/tasks.md` Wave 0.4

## Finding

### P0-blocking: Destructive exit is visually primary

File:

- `apps/web/src/components/ui/confirm-exit-dialog.tsx`

Current lines:

- Stay button around line 85: outline/white secondary style.
- Exit button around line 92: filled `bg-[var(--fuxie-action)] text-white` primary style.

Why this matters:

- The P0 flow-safeguard goal is to prevent accidental progress loss.
- Initial focus correctly lands on the stay button, but visual hierarchy currently promotes "Leave activity".
- Tests and typecheck do not catch this because it is a UX safety contract, not a compile/runtime failure.

Expected:

- Stay/cancel action is the primary filled button.
- Exit/destructive action is secondary/ghost/neutral, not filled primary and not red.
- Mobile order remains stacked with stay first and exit second.
- Desktop order can remain stay first and exit second unless Product decides otherwise.

## Verification Performed By Codex

Commands/results:

- JSON parse for `vi`, `de`, `en`: pass.
- `check-locale-parity`: pass, `vi=923 keys`, `de=923 keys`.
- `check-visual-audit-pack`: pass, 44 PNGs verified, 4 invariants pass.
- `next typegen .`: pass.
- `tsc --noEmit`: fails only on known unrelated baseline:
  - `src/components/listening/lesson-player.tsx(429,81): Type 'number | undefined' is not assignable to type 'string | number | Date'.`
- Static search `rg "onAnswer\(false" apps/web/src/components/grammar/ExerciseRenderer.tsx`: zero matches.

## Follow-Up Prompt For Antigravity

```text
Bạn là Antigravity, coder chính của Fuxie.

Codex QC đã review Wave 1/2 report. Tests/checks nhìn chung pass, nhưng còn 1 P0-blocking UX safety issue trong `apps/web/src/components/ui/confirm-exit-dialog.tsx`.

Issue:
Trong ConfirmExitDialog, destructive action `exitLabel` đang là nút filled primary:
`bg-[var(--fuxie-action)] text-white`
Trong khi safe action `stayLabel` đang là nút outline/secondary.

Điều này ngược với mockup/spec:
- `docs/design/mockups/fuxie-p0-confirm-exit-dialog.md`
- `.kiro/specs/fuxie-ui-ux-p0-remediation/design.md` Contract 6
- `.kiro/specs/fuxie-ui-ux-p0-remediation/tasks.md` Wave 0.4

Yêu cầu sửa:
1. Giữ mobile layout hiện tại: `flex flex-col sm:flex-row gap-3`.
2. Giữ button order hiện tại: stay trước, exit sau.
3. Đổi `stayLabel` thành primary filled brand action.
4. Đổi `exitLabel` thành secondary/ghost neutral action.
5. Không dùng red/error style cho exit.
6. Giữ focus initial vào stay button.
7. Giữ focus-visible ring cho cả hai nút.
8. Không đụng file ngoài `apps/web/src/components/ui/confirm-exit-dialog.tsx` trừ khi thật sự cần.

Verification:
- JSON parse messages không cần chạy lại nếu không đụng locale.
- Chạy `next typegen .`.
- Chạy `tsc --noEmit` và báo nếu chỉ còn known listening baseline error.
- Manual check: ở 360px, nút Stay ở trên là filled primary; nút Leave ở dưới là neutral/secondary.

Output:
- Diff summary.
- Verification results.
- Nếu không đồng ý với action hierarchy này, giải thích UX rationale trước khi sửa.
```

## Release Readiness Impact

The remediation should not be merged until this action hierarchy is corrected or explicitly overruled by Product Design.
