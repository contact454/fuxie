# Tasks - Fuxie Learner P0 Remediation

Vai chinh: Project Manager / Delivery Manager
Vai phoi hop: CTO / Tech Lead, QA Automation Engineer, Product Designer / UX/UI Designer

## Execution Rules

- Codex owns planning, mockups/assets, QA review, and Antigravity prompts.
- Antigravity owns app code changes.
- Codex should not patch product code for this spec unless anh explicitly changes the operating model again.
- Existing partial implementation in the worktree must be reviewed, not blindly trusted.
- `apps/web/public/sw.js` is dirty from before this handoff and must be ignored unless proven related.

## Current Known State

- A prior Codex pass appears to have implemented parts of TICKET-01 through TICKET-04.
- `next typegen .` was previously verified as passing.
- `check-locale-parity` for `vi` and `de` was previously verified as passing.
- `check-visual-audit-pack` was previously verified as passing.
- `tsc --noEmit` is currently blocked by unrelated baseline error in `apps/web/src/components/listening/lesson-player.tsx`.
- Direct Vitest execution may be blocked by local workspace resolver issues around `react-dom/server`.

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 0,
      "owner": "Codex",
      "tasks": ["0.1", "0.2", "0.3"],
      "goal": "Lock handoff docs and mockup/QC assets before code ownership moves to Antigravity"
    },
    {
      "wave": 1,
      "owner": "Antigravity",
      "tasks": ["1.1", "1.2", "1.3"],
      "goal": "Intake current worktree and decide keep/fix/revert-with-replacement for existing partial implementation"
    },
    {
      "wave": 2,
      "owner": "Antigravity",
      "tasks": ["2.1", "2.2", "2.3", "2.4"],
      "goal": "Complete implementation hardening for TICKET-01 through TICKET-04"
    },
    {
      "wave": 3,
      "owner": "Codex/QC",
      "tasks": ["3.1", "3.2", "3.3", "3.4"],
      "goal": "Verify acceptance criteria and write follow-up prompts for any failure"
    },
    {
      "wave": 4,
      "owner": "Codex + Antigravity",
      "tasks": ["4.1", "4.2"],
      "goal": "Release readiness decision and next handoff"
    }
  ]
}
```

## Wave 0 - Codex Planning, Mockup, and Handoff

- [x] 0.1 Rewrite requirements
  - Create a clear Requirements Document in `bugfix.md`.
  - Include in/out scope, glossary, acceptance criteria, and release readiness criteria.
  - _Requirements: 1, 2, 3, 4, 5, 6, 7_

- [x] 0.2 Rewrite technical design
  - Create a clear Technical Design in `design.md`.
  - Include contracts for contrast, reward containment, focus, German overflow, confirm exit, fail-open grading, video feedback, locale, and testing.
  - _Requirements: 1, 2, 3, 4, 5, 6, 7_

- [x] 0.3 Rewrite task list and owner split
  - Create this task list with owner, dependency, checks, and Antigravity prompt.
  - _Requirements: 7_

- [x] 0.4 Codex mockup: confirm-exit dialog
  - Produce a compact mockup artifact for the shared `ConfirmExitDialog`.
  - Mockup must show title, description, safe primary action, destructive secondary action, focus ring, and mobile width behavior.
  - Saved as `docs/design/mockups/fuxie-p0-confirm-exit-dialog.md`.
  - _Requirements: 5_

- [x] 0.5 Codex mockup: grading unavailable micro-state
  - Produce a compact mockup artifact for "grading unavailable, try again".
  - State must be neutral/system, not red/incorrect.
  - Include mobile and desktop compact versions.
  - Saved as `docs/design/mockups/fuxie-p0-grading-unavailable.md`.
  - _Requirements: 6_

- [x] 0.6 Codex visual token sheet
  - Produce a small token sheet for active nav, XP chip, focus ring, reward amber allowed zones, and German overflow examples.
  - Saved as `docs/design/mockups/fuxie-p0-token-sheet.md`.
  - _Requirements: 1, 2, 3, 4_

## Wave 1 - Antigravity Intake

- [ ] 1.1 Read source docs and current diff
  - Read `.kiro/specs/fuxie-ui-ux-p0-remediation/bugfix.md`.
  - Read `.kiro/specs/fuxie-ui-ux-p0-remediation/design.md`.
  - Read `.kiro/specs/fuxie-ui-ux-p0-remediation/tasks.md`.
  - Run `git status --short`.
  - Inspect current modified files related to this spec.
  - Do not modify `apps/web/public/sw.js`.
  - _Requirements: 7_

- [ ] 1.2 Classify existing partial implementation
  - For each touched file, decide:
    - `keep`: satisfies design contract.
    - `fix`: close gap with minimal patch.
    - `replace`: current partial implementation conflicts with contract.
  - Report the classification in the Antigravity response before editing.
  - _Requirements: 7_

- [ ] 1.3 Establish verification baseline
  - Parse `apps/web/messages/vi.json`, `apps/web/messages/de.json`, and `apps/web/messages/en.json`.
  - Run `next typegen .` from `apps/web`.
  - Run `check-locale-parity`.
  - Run `check-visual-audit-pack`.
  - Run `tsc --noEmit` and document whether only the known listening baseline error remains.
  - _Requirements: 7_

## Wave 2 - Antigravity Implementation Hardening

- [ ] 2.1 TICKET-01 contrast completion
  - Verify `dashboard-client.tsx` CEFR badge uses `theme.bg`, `theme.border`, and `theme.text`.
  - Verify `sidebar.tsx` and `mobile-shell.tsx` active nav use the locked navy-on-teal pair.
  - Finish a targeted sweep for real content using low-contrast `text-gray-400`, `text-slate-400`, or equivalent on learner surfaces.
  - Do not recolor decorative-only nodes unless detector proves they communicate required content.
  - Add or document contrast verification for touched surfaces.
  - Files to inspect:
    - `apps/web/src/components/dashboard/dashboard-client.tsx`
    - `apps/web/src/components/shared/sidebar.tsx`
    - `apps/web/src/components/shared/mobile-shell.tsx`
    - `apps/web/src/app/globals.css`
  - _Requirements: 1_

- [ ] 2.2 TICKET-02 reward amber and focus completion
  - Verify dashboard reward amber nodes have proper `data-reward-state` or `data-reward-context` ancestors.
  - Verify non-reward amber nodes are recolored to brand/neutral.
  - Verify header XP chip is brand blue plus white text.
  - Verify `MeasuredLink` provides a reusable focus-visible ring.
  - Add dark chrome focus override only where needed.
  - Run or document reward-amber containment verification.
  - Files to inspect:
    - `apps/web/src/components/dashboard/dashboard-client.tsx`
    - `apps/web/src/components/performance/measured-link.tsx`
    - `apps/web/src/components/shared/sidebar.tsx`
    - `apps/web/src/components/shared/mobile-shell.tsx`
    - `apps/web/src/app/globals.css`
  - _Requirements: 2, 3_

- [ ] 2.3 TICKET-03 German overflow completion
  - Verify grammar tables scroll horizontally and do not clip columns at 360 px.
  - Verify vocabulary theme titles are two-line clamp with full `title`.
  - Verify exercise option/pair/token classes wrap long German words safely.
  - Decide whether to add the optional `<De>` primitive in Sprint 1.
  - If adding `<De>`, apply only to high-risk German content call sites, not a repo-wide migration.
  - Add manual or automated synthetic long-word smoke notes.
  - Files to inspect:
    - `apps/web/src/components/grammar/grammar.module.css`
    - `apps/web/src/components/vocabulary/vocabulary-client.tsx`
    - `apps/web/src/components/vocabulary/exercises/exercise-ui.ts`
    - Optional `apps/web/src/components/ui/de.tsx`
  - _Requirements: 4_

- [ ] 2.4 TICKET-04 flow safeguards and fail-open completion
  - Verify shared `ConfirmExitDialog` exists and matches the design contract.
  - Verify `SessionPlayer.tsx` uses confirm exit for active sessions.
  - Verify `LessonPlayer.tsx` uses confirm exit for in-progress lessons.
  - Verify `writing-player.tsx` uses confirm exit only when draft/form input exists.
  - Verify all confirm-exit copy is i18n-backed.
  - Verify `ExerciseRenderer.tsx` no longer calls `onAnswer(false)` in AI grading error branches.
  - Verify grading unavailable state preserves learner input and supports retry.
  - Verify `VideoCallLayout.tsx` distinguishes feedback `ready` versus `unavailable`.
  - Files to inspect:
    - `apps/web/src/components/ui/confirm-exit-dialog.tsx`
    - `apps/web/src/components/session/SessionPlayer.tsx`
    - `apps/web/src/components/grammar/LessonPlayer.tsx`
    - `apps/web/src/components/writing/writing-player.tsx`
    - `apps/web/src/components/grammar/ExerciseRenderer.tsx`
    - `apps/web/src/components/chat/VideoCallLayout.tsx`
    - `apps/web/messages/vi.json`
    - `apps/web/messages/de.json`
    - `apps/web/messages/en.json`
  - _Requirements: 5, 6_

## Wave 3 - Codex/QC Verification

- [ ] 3.1 Static verification
  - Parse all three message JSON files.
  - Run `next typegen .`.
  - Run `check-locale-parity`.
  - Run `check-visual-audit-pack`.
  - Run `tsc --noEmit`.
  - If `tsc` fails only on the known listening baseline error, record it as unrelated and create a separate Antigravity prompt if anh wants it fixed.
  - _Requirements: 7_

- [ ] 3.2 Manual visual and interaction smoke
  - Mobile width 360 px:
    - Dashboard CEFR badge readable.
    - Active sidebar/bottom-nav text readable.
    - Header XP chip blue, not amber.
    - Grammar table columns reachable by horizontal scroll.
    - Long vocabulary title wraps to two lines.
  - Keyboard:
    - Tab through sidebar and bottom nav.
    - Focus ring visible at every nav link.
  - _Requirements: 1, 2, 3, 4_

- [ ] 3.3 Flow safeguard smoke
  - Session active exit opens confirm dialog.
  - Stay keeps current state.
  - Exit navigates to dashboard.
  - Grammar lesson in progress exit opens confirm dialog.
  - Writing draft exit opens confirm dialog only when there is content.
  - `Escape` closes dialog and preserves state.
  - _Requirements: 5_

- [ ] 3.4 AI failure smoke
  - Mock `/api/v1/grade` failure for each AI-graded branch touched.
  - Confirm answer is not marked wrong.
  - Confirm retry is available.
  - Mock video feedback parse failure.
  - Confirm unavailable message appears instead of no-errors message.
  - _Requirements: 6_

- [ ] 3.5 Codex review report
  - Summarize which AC passed.
  - List residual risks by severity.
  - Write a follow-up prompt for Antigravity for any failed AC.
  - _Requirements: 7_

## Wave 4 - Release Readiness

- [ ] 4.1 Delivery checkpoint
  - Requirements 1 through 6 pass or have explicit blocker.
  - Desktop preservation checked on touched surfaces.
  - Dirty unrelated files listed.
  - Anh decides whether to continue, stage, commit, or split into a PR.
  - _Requirements: 7_

- [x] 4.2 Optional baseline fix prompt
  - If anh wants the unrelated TypeScript baseline fixed in the same workstream, Codex reruns the role gate and writes a separate Antigravity prompt for `apps/web/src/components/listening/lesson-player.tsx`.
  - Prompt saved as `.kiro/specs/fuxie-ui-ux-p0-remediation/prompt-antigravity-fix-listening-ts-baseline-2026-06-04.md`.
  - _Requirements: 7_

## Ready-To-Use Prompt For Antigravity

```text
Bạn là Antigravity, coder chính của Fuxie.

Mục tiêu:
Hoàn thiện và harden spec P0 `.kiro/specs/fuxie-ui-ux-p0-remediation/` dựa trên Requirements, Technical Design, và Tasks hiện tại. Đây là việc code app; Codex giữ vai trò planner/QC/prompt, bạn là owner implementation.

Tài liệu bắt buộc đọc trước:
1. `.kiro/specs/fuxie-ui-ux-p0-remediation/bugfix.md`
2. `.kiro/specs/fuxie-ui-ux-p0-remediation/design.md`
3. `.kiro/specs/fuxie-ui-ux-p0-remediation/tasks.md`

Ngữ cảnh quan trọng:
- Worktree đã có partial implementation từ pass trước. Hãy review current diff trước, rồi phân loại mỗi file là keep/fix/replace.
- `apps/web/public/sw.js` đã dirty từ trước, không đụng vào trừ khi chứng minh liên quan.
- `tsc --noEmit` có baseline blocker unrelated tại `apps/web/src/components/listening/lesson-player.tsx` do `DEFAULT_SPEEDS[cefrLevel]` có thể undefined. Đừng giấu blocker này.
- Nếu `pnpm` không có trong PATH, dùng bundled Node trong Codex runtime để chạy Next/typecheck/tsx scripts.

Phạm vi code được phép sửa:
- `apps/web/src/components/dashboard/dashboard-client.tsx`
- `apps/web/src/components/shared/sidebar.tsx`
- `apps/web/src/components/shared/mobile-shell.tsx`
- `apps/web/src/components/performance/measured-link.tsx`
- `apps/web/src/app/globals.css`
- `apps/web/src/components/grammar/grammar.module.css`
- `apps/web/src/components/vocabulary/vocabulary-client.tsx`
- `apps/web/src/components/vocabulary/exercises/exercise-ui.ts`
- `apps/web/src/components/ui/confirm-exit-dialog.tsx`
- `apps/web/src/components/session/SessionPlayer.tsx`
- `apps/web/src/components/grammar/LessonPlayer.tsx`
- `apps/web/src/components/writing/writing-player.tsx`
- `apps/web/src/components/grammar/ExerciseRenderer.tsx`
- `apps/web/src/components/chat/VideoCallLayout.tsx`
- `apps/web/messages/vi.json`
- `apps/web/messages/de.json`
- `apps/web/messages/en.json`
- Optional only if justified: `apps/web/src/components/ui/de.tsx`

Không làm:
- Không đổi mascot/reward asset art.
- Không rewrite copy ngoài các key i18n bắt buộc.
- Không đổi backend grading logic.
- Không đổi `apps/web/public/sw.js`.
- Không revert thay đổi không thuộc scope.
- Không đánh dấu task done nếu chưa có verification.

Yêu cầu implementation:
1. TICKET-01: CEFR badge dùng `theme.bg/theme.border/theme.text`; active nav dùng `#2EC4B6` + `var(--fuxie-blue-900)`; hoàn thiện sweep low-contrast text thật.
2. TICKET-02: reward amber chỉ trong reward subtree; XP chip luôn mounted dùng brand blue + white; `MeasuredLink` có focus-visible ring.
3. TICKET-03: grammar table scroll ngang không clip; vocab theme title line-clamp-2 + title; exercise tile/token wrap German long words; cân nhắc `<De>` chỉ cho high-risk callsite.
4. TICKET-04: confirm-exit cho session/grammar/writing; AI grading fail-open, không `onAnswer(false)` khi service lỗi; video feedback parse-fail hiển thị unavailable, không no-errors.

Verification cần chạy hoặc báo rõ nếu harness local không chạy được:
- JSON parse `apps/web/messages/vi.json`, `de.json`, `en.json`.
- `next typegen .` từ `apps/web`.
- `check-locale-parity`.
- `check-visual-audit-pack`.
- `tsc --noEmit`, ghi rõ nếu chỉ còn known listening baseline error.
- Static search trong `ExerciseRenderer.tsx` để đảm bảo không còn `onAnswer(false)` ở AI grading error branches.
- Manual smoke 360px cho contrast, XP chip, German overflow.
- Keyboard smoke sidebar/bottom-nav focus ring.
- Manual/mock smoke confirm-exit và fail-open grading.

Output mong muốn:
1. Tóm tắt keep/fix/replace của current diff trước khi sửa.
2. Danh sách file đã sửa.
3. Verification results, kèm command output summary.
4. Residual risks hoặc blockers.
```

## Codex Follow-Up Responsibilities

- After Antigravity reports back, Codex reviews diff against every acceptance criterion.
- If any AC fails, Codex writes the next narrow Antigravity prompt.
- If all AC pass, Codex writes release readiness summary and asks anh whether to stage/commit.
