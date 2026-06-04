# QC Final Release Readiness - Fuxie Learner P0 Remediation

Vai chinh: QA Automation Engineer  
Vai phoi hop: CTO / Tech Lead, Full-stack Engineer, Project Manager / Delivery Manager

## Verdict

Release-ready from the Codex/QC perspective.

All previously identified blockers are resolved:

- `ConfirmExitDialog` action hierarchy is correct.
- Listening TypeScript baseline blocker is resolved.
- `Listening.speedDuration` exists in all message files.
- P0 remediation locale keys are restored in `vi` and `de`.
- Static and unit verification gates pass.

## Blockers Closed

### 1. ConfirmExitDialog action hierarchy

File:

- `apps/web/src/components/ui/confirm-exit-dialog.tsx`

Resolved state:

- `Stay` action is first, receives initial focus, and is visually primary.
- `Leave` action is second and visually secondary/neutral.
- Mobile layout remains stacked: `flex flex-col sm:flex-row gap-3`.

### 2. Listening TypeScript baseline

File:

- `apps/web/src/components/listening/lesson-player.tsx`

Resolved state:

```ts
const defaultPlaybackSpeed = DEFAULT_SPEEDS[cefrLevel] ?? 1.0
const [playbackSpeed, setPlaybackSpeed] = useState(defaultPlaybackSpeed)
```

The rendered translation call now uses:

```tsx
t('speedDuration', { speed: defaultPlaybackSpeed, time: formatTime(duration || 180) })
```

### 3. Locale runtime keys

Required P0 keys are present in `vi`, `de`, and `en` where applicable:

- `UI.confirmExitAria`
- `UI.stayInLesson`
- `UI.exitLesson`
- `UI.quitSessionTitle`
- `UI.quitSessionDescription`
- `WritingPlayer.quitTitle`
- `WritingPlayer.quitDescription`
- `WritingPlayer.quitStay`
- `WritingPlayer.quitExit`
- `Chat.videoCall.feedbackUnavailable`
- `Grammar.gradingUnavailableTitle`
- `Grammar.gradingUnavailableDetail`
- `Grammar.gradingRetry`
- `Listening.speedDuration`

## Verification Performed By Codex

Commands/results:

- JSON parse for `apps/web/messages/vi.json`, `de.json`, `en.json`: pass.
- `check-locale-parity`: pass.
  - `vi=924 keys`
  - `de=924 keys`
  - TSX scan: 262 files.
- `check-visual-audit-pack`: pass.
  - 44 PNGs verified.
  - 4 invariants pass.
- `next typegen .`: pass.
- `tsc --noEmit`: pass.
- `npm run test`: pass.
  - 102 test files passed.
  - 836 tests passed.

## Non-Blocking Notes

Vitest emitted known/non-failing stderr noise:

- `next-intl` `timeZone` environment fallback warning in SSR-style tests.
- Mocked failure logs for writing grade, mission claim, and Firebase key guard tests.

These do not block release readiness because the suite exits successfully.

## Git Hygiene Notes

Do not stage unrelated files:

- `apps/web/public/sw.js` remains dirty from before this workstream and is out of scope.
- Temporary/untracked audit/log files in the repo root remain out of scope.

Stage only the P0 remediation files and intentionally included spec/mockup/QC artifacts.

## Recommended Next Step

Proceed to safe staging and commit review.
