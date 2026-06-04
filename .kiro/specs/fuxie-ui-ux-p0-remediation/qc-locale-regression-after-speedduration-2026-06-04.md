# QC Report - Locale Regression After `speedDuration`

Vai chinh: QA Automation Engineer  
Vai phoi hop: CTO / Tech Lead, Full-stack Engineer, Project Manager / Delivery Manager

## Input

Antigravity reported adding `Listening.speedDuration` to `vi`, `de`, and `en`, and reported all checks passing.

## Verdict

Not release-ready.

`Listening.speedDuration` was added, but Codex QC found that the `vi` and `de` message files no longer contain several P0 remediation keys that the current code calls. This likely happened when `git checkout apps/web/messages/vi.json` and `git checkout apps/web/messages/de.json` were used during the translation edit flow.

The locale parity check still passes because both `vi` and `de` are missing the same keys. This is exactly the kind of "green check, red runtime" trap this QC layer is meant to catch.

## Verified Good

The following are good in the current workspace:

- `Listening.speedDuration` exists in `apps/web/messages/vi.json`.
- `Listening.speedDuration` exists in `apps/web/messages/de.json`.
- `Listening.speedDuration` exists in `apps/web/messages/en.json`.
- `apps/web/src/components/listening/lesson-player.tsx` uses `defaultPlaybackSpeed` safely.

Commands already run by Codex after the listening TypeScript fix:

- JSON parse: pass.
- `next typegen .`: pass.
- `tsc --noEmit`: pass.
- `check-locale-parity`: pass.
- `check-visual-audit-pack`: pass.
- `npm run test`: pass, 102 files / 836 tests.

## Blocking Finding

### P0 runtime risk: restored code references keys missing from `vi/de`

Code references:

- `apps/web/src/components/session/SessionPlayer.tsx`
  - `UI.quitSessionTitle`
  - `UI.quitSessionDescription`
  - `UI.stayInLesson`
  - `UI.exitLesson`
  - `UI.confirmExitAria`
- `apps/web/src/components/grammar/LessonPlayer.tsx`
  - same `UI.*` keys above through `useTranslations('UI')`
- `apps/web/src/components/writing/writing-player.tsx`
  - `WritingPlayer.quitTitle`
  - `WritingPlayer.quitDescription`
  - `WritingPlayer.quitStay`
  - `WritingPlayer.quitExit`
- `apps/web/src/components/grammar/ExerciseRenderer.tsx`
  - `Grammar.gradingUnavailableTitle`
  - `Grammar.gradingUnavailableDetail`
  - `Grammar.gradingRetry`
- `apps/web/src/components/chat/VideoCallLayout.tsx`
  - `Chat.videoCall.feedbackUnavailable`

Current evidence:

```text
rg "confirmExitAria|stayInLesson|exitLesson|quitSessionTitle|quitSessionDescription|gradingUnavailableTitle|gradingUnavailableDetail|gradingRetry|feedbackUnavailable|quitTitle|quitDescription|quitStay|quitExit" apps/web/messages/vi.json apps/web/messages/de.json -n
```

Current result:

- No matches for the required P0 keys in `vi.json` or `de.json`.
- The same keys do exist in `en.json`, which confirms the intended shape.

## Required Fix

Restore the missing P0 remediation locale keys in both `vi.json` and `de.json`, while keeping the newly added `Listening.speedDuration`.

Do not change application code for this task.

## Ready-To-Use Prompt For Antigravity

```text
Bạn là Antigravity, coder chính của Fuxie.

Codex QC xác nhận bạn đã thêm `Listening.speedDuration`, nhưng phát hiện `vi.json` và `de.json` đã bị mất lại nhiều key P0 remediation trước đó. `check-locale-parity` vẫn pass vì cả vi/de cùng thiếu key, nhưng code hiện tại sẽ gọi các key này và có nguy cơ crash runtime.

Phạm vi:
- Chỉ sửa `apps/web/messages/vi.json`
- Chỉ sửa `apps/web/messages/de.json`
- Không sửa `apps/web/messages/en.json` trong task này.
- Không sửa code TSX.
- Không đụng `apps/web/public/sw.js`.

Giữ lại key hiện có:
- `Listening.speedDuration`

Thêm lại các key sau vào cả vi/de:

Namespace `UI`:
- `confirmExitAria`
- `stayInLesson`
- `exitLesson`
- `quitSessionTitle`
- `quitSessionDescription`

Namespace `WritingPlayer`:
- `quitTitle`
- `quitDescription`
- `quitStay`
- `quitExit`

Namespace `Chat.videoCall`:
- `feedbackUnavailable`

Namespace `Grammar`:
- `gradingUnavailableTitle`
- `gradingUnavailableDetail`
- `gradingRetry`

Suggested vi copy:
- `UI.confirmExitAria`: `Xác nhận rời khỏi bài học`
- `UI.stayInLesson`: `Ở lại`
- `UI.exitLesson`: `Rời khỏi`
- `UI.quitSessionTitle`: `Rời khỏi phiên học này?`
- `UI.quitSessionDescription`: `Tiến độ, tim và XP của phiên này có thể chưa được lưu. Ở lại nếu em vẫn muốn hoàn thành thử thách.`
- `WritingPlayer.quitTitle`: `Rời khỏi bài viết này?`
- `WritingPlayer.quitDescription`: `Bản nháp hiện tại chưa được nộp. Nếu rời đi bây giờ, nội dung em đã viết có thể bị mất.`
- `WritingPlayer.quitStay`: `Viết tiếp`
- `WritingPlayer.quitExit`: `Rời bài viết`
- `Chat.videoCall.feedbackUnavailable`: `Chưa tạo được nhận xét phát âm. Dữ liệu cuộc gọi vẫn được giữ; hãy thử lại sau.`
- `Grammar.gradingUnavailableTitle`: `Chưa chấm được câu trả lời này`
- `Grammar.gradingUnavailableDetail`: `Kết nối hoặc AI chấm bài có thể đang chậm. Câu trả lời của em chưa bị tính sai; hãy thử lại.`
- `Grammar.gradingRetry`: `Thử chấm lại`

Suggested de copy:
- `UI.confirmExitAria`: `Verlassen der Lernaktivität bestätigen`
- `UI.stayInLesson`: `Bleiben`
- `UI.exitLesson`: `Verlassen`
- `UI.quitSessionTitle`: `Diese Session verlassen?`
- `UI.quitSessionDescription`: `Fortschritt, Herzen und XP aus dieser Session sind möglicherweise noch nicht gespeichert. Bleib, wenn du die Herausforderung noch abschließen möchtest.`
- `WritingPlayer.quitTitle`: `Diese Schreibaufgabe verlassen?`
- `WritingPlayer.quitDescription`: `Dein aktueller Entwurf wurde noch nicht abgegeben. Wenn du jetzt gehst, kann dein geschriebener Text verloren gehen.`
- `WritingPlayer.quitStay`: `Weiter schreiben`
- `WritingPlayer.quitExit`: `Schreibaufgabe verlassen`
- `Chat.videoCall.feedbackUnavailable`: `Aussprachefeedback konnte noch nicht erstellt werden. Die Anrufdaten wurden behalten; bitte versuche es später erneut.`
- `Grammar.gradingUnavailableTitle`: `Diese Antwort konnte noch nicht bewertet werden`
- `Grammar.gradingUnavailableDetail`: `Die Verbindung oder der KI-Korrektor ist möglicherweise langsam. Deine Antwort wurde nicht als falsch gezählt; bitte versuche es erneut.`
- `Grammar.gradingRetry`: `Erneut bewerten`

Verification:
1. JSON parse `apps/web/messages/vi.json`, `de.json`, `en.json`.
2. `npx tsx scripts/check-locale-parity.ts`
3. `npx next typegen .`
4. `npx tsc --noEmit`
5. `npm run test`
6. Static check:
   `rg "confirmExitAria|stayInLesson|exitLesson|quitSessionTitle|quitSessionDescription|gradingUnavailableTitle|gradingUnavailableDetail|gradingRetry|feedbackUnavailable|quitTitle|quitDescription|quitStay|quitExit|speedDuration" apps/web/messages/vi.json apps/web/messages/de.json -n`

Expected:
- All listed keys appear in both `vi.json` and `de.json`.
- `check-locale-parity` key count should increase back above the current 911-key state.
- TypeScript and tests remain green.
```

## Release Readiness Impact

Do not stage or merge until these locale keys are restored in `vi/de`.
