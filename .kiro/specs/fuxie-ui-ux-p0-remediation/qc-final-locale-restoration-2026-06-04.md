# QC Final Locale Restoration - 2026-06-04

## Role Gate

- Primary role: Project Manager / Delivery Manager
- Support roles: QA Automation Engineer, CTO / Tech Lead

## Verdict

Release-ready for the scoped Sprint 1 UI/UX P0 remediation after Antigravity restored the missing `vi` and `de` locale keys introduced by the `speedDuration` update.

## What Was Re-verified

- Required `UI` confirm-exit keys exist in `en`, `vi`, and `de`:
  - `confirmExitAria`
  - `stayInLesson`
  - `exitLesson`
  - `quitSessionTitle`
  - `quitSessionDescription`
- Required `WritingPlayer` quit dialog keys exist in `en`, `vi`, and `de`:
  - `quitTitle`
  - `quitDescription`
  - `quitStay`
  - `quitExit`
- Required `Chat.videoCall.feedbackUnavailable` exists in `en`, `vi`, and `de`.
- Required `Grammar` grading-unavailable keys exist in `en`, `vi`, and `de`:
  - `gradingUnavailableTitle`
  - `gradingUnavailableDetail`
  - `gradingRetry`
- `Listening.lesson.speedDuration` exists in `en`, `vi`, and `de`.
- The message files have no unstaged diff after restoration; restored locale changes are included in the staged index.

## Verification Commands

Executed from `apps/web` unless otherwise noted:

- JSON parse check for `apps/web/messages/en.json`, `apps/web/messages/vi.json`, and `apps/web/messages/de.json`: passed.
- `npx tsx scripts/check-locale-parity.ts`: passed.
- `npx next typegen .`: passed.
- `npx tsx scripts/check-visual-audit-pack.ts`: passed.
- `npx tsc --noEmit`: passed.
- `npm run test`: passed, 102 test files and 836 tests.

## Residual Risks

- Browser-based manual smoke/E2E has not been run in this QC pass.
- `apps/web/public/sw.js` remains an existing unstaged workspace change and is intentionally outside this staged P0 remediation set.
- Temporary audit/log files remain untracked and intentionally unstaged.
- English listening localization remains minimal beyond the scoped `speedDuration` key; this is outside the current P0 `vi/de` parity restoration.

## Recommended Next Step

Commit the staged P0 remediation set, or run one browser smoke pass first for the highest-risk user flows:

- dashboard/navigation visual states
- vocabulary/grammar overflow layouts
- confirm-exit dialogs
- AI grading unavailable fallback
- video-call feedback unavailable state
