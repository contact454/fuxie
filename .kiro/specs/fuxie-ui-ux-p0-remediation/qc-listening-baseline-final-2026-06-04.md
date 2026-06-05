# QC Report - Listening TypeScript Baseline Follow-Up

Vai chinh: QA Automation Engineer  
Vai phoi hop: CTO / Tech Lead, Full-stack Engineer, Project Manager / Delivery Manager

## Input

Antigravity fixed the TypeScript baseline blocker in:

- `apps/web/src/components/listening/lesson-player.tsx`

## Verdict

Partially release-ready.

The TypeScript blocker is resolved and all automated gates run by Codex pass. However, Codex QC found one adjacent runtime/i18n blocker that the TypeScript fix did not introduce but exposes on the same rendered line:

- `Listening.speedDuration` is called in `lesson-player.tsx`.
- `Listening.speedDuration` is missing from `apps/web/messages/vi.json`.
- `Listening.speedDuration` is missing from `apps/web/messages/de.json`.
- `apps/web/messages/en.json` does not currently contain a full `Listening` namespace.

Because `check-locale-parity` compares `vi` and `de`, it still passes when both locales are missing the same key. This is a runtime rendering risk, not a static parity failure.

## Code Inspection

File:

- `apps/web/src/components/listening/lesson-player.tsx`

Confirmed fix:

```ts
const defaultPlaybackSpeed = DEFAULT_SPEEDS[cefrLevel] ?? 1.0
const [playbackSpeed, setPlaybackSpeed] = useState(defaultPlaybackSpeed)
```

Confirmed rendered usage:

```tsx
t('speedDuration', { speed: defaultPlaybackSpeed, time: formatTime(duration || 180) })
```

No direct `DEFAULT_SPEEDS[cefrLevel]` interpolation remains.

## Verification Performed By Codex

Commands/results:

- JSON parse for `vi`, `de`, `en`: pass.
- `next typegen .`: pass.
- `tsc --noEmit`: pass.
- `check-locale-parity`: pass.
  - `vi=923 keys`
  - `de=923 keys`
  - TSX scan: 262 files.
- `check-visual-audit-pack`: pass.
  - 44 PNGs verified.
  - 4 invariants pass.
- `npm run test`: pass.
  - 102 test files passed.
  - 836 tests passed.

## Finding

### P1 release-risk: Missing `Listening.speedDuration` message key

Evidence:

```text
rg "speedDuration" apps/web/messages
```

Result:

- No matches in `vi.json`, `de.json`, or `en.json`.
- Only code usage is in `apps/web/src/components/listening/lesson-player.tsx`.

Impact:

- The listening intro screen may throw a missing-message runtime error when rendering the instruction detail.
- The key is visible in the primary learner flow, so this should be fixed before staging/commit if the branch aims for clean release readiness.

## Ready-To-Use Prompt For Antigravity

```text
Bạn là Antigravity, coder chính của Fuxie.

Codex QC xác nhận TypeScript baseline fix ở `lesson-player.tsx` đã đúng và `tsc --noEmit` đã pass. Tuy nhiên còn một adjacent runtime/i18n blocker trên cùng rendered line:

`apps/web/src/components/listening/lesson-player.tsx` gọi:
`t('speedDuration', { speed: defaultPlaybackSpeed, time: formatTime(duration || 180) })`

Nhưng `Listening.speedDuration` chưa tồn tại trong:
- `apps/web/messages/vi.json`
- `apps/web/messages/de.json`

Yêu cầu sửa:
1. Thêm key `speedDuration` vào namespace `Listening` trong `vi.json`.
2. Thêm key `speedDuration` vào namespace `Listening` trong `de.json`.
3. Giữ placeholders `{speed}` và `{time}` đúng tên.
4. Không đổi code `lesson-player.tsx` nếu không cần.
5. Không đụng `apps/web/public/sw.js`.
6. Không backfill toàn bộ `en.json` trong task này. Nếu phát hiện app cần render Listening bằng locale `en`, báo thành follow-up `learner-copy-localization-backfill`, vì `en.json` hiện thiếu cả namespace `Listening` đầy đủ.

Suggested copy:
- vi: `Tốc độ đề xuất {speed}x · Thời lượng {time}`
- de: `Empfohlenes Tempo {speed}x · Dauer {time}`

Verification:
1. JSON parse `vi/de/en`.
2. `npx tsx scripts/check-locale-parity.ts` từ repo root.
3. `npx next typegen .` từ `apps/web`.
4. `npx tsc --noEmit` từ `apps/web`.
5. `npm run test` từ `apps/web`.
6. Static check: `rg "speedDuration" apps/web/messages apps/web/src/components/listening/lesson-player.tsx -n`.

Expected:
- `speedDuration` appears in `vi.json`, `de.json`, and the code usage.
- Locale parity still passes.
- TypeScript remains clean.
```

## Release Readiness Impact

Do not stage/commit as fully release-ready until the missing `Listening.speedDuration` key is fixed or Product explicitly accepts the runtime risk.
