# Prompt - Antigravity Fix Listening TypeScript Baseline

Vai chinh: CTO / Tech Lead  
Vai phoi hop: Full-stack Engineer, QA Automation Engineer, Project Manager / Delivery Manager

## Context

The P0 remediation checks are otherwise green, but full TypeScript still fails on an unrelated listening baseline blocker:

```text
src/components/listening/lesson-player.tsx(429,81): error TS2322:
Type 'number | undefined' is not assignable to type 'string | number | Date'.
```

Root cause:

- The repo's TypeScript settings treat `DEFAULT_SPEEDS[cefrLevel]` as `number | undefined`.
- `playbackSpeed` initialization already falls back to `1.0`.
- The `speedDuration` translation interpolation at line 429 passes `DEFAULT_SPEEDS[cefrLevel]` directly, so `undefined` can reach `t(...)`.

## Ready-To-Use Prompt For Antigravity

```text
Bạn là Antigravity, coder chính của Fuxie.

Mục tiêu:
Fix TypeScript baseline blocker trong `apps/web/src/components/listening/lesson-player.tsx` để `tsc --noEmit` không còn lỗi `DEFAULT_SPEEDS[cefrLevel]` có thể undefined.

Phạm vi:
- Chỉ sửa `apps/web/src/components/listening/lesson-player.tsx` nếu đủ.
- Không đụng P0 remediation files khác.
- Không đụng `apps/web/public/sw.js`.
- Không đổi copy/i18n trừ khi route runtime chứng minh `speedDuration` đang thiếu key và cần xử lý trong task riêng.

Vị trí lỗi:
- `apps/web/src/components/listening/lesson-player.tsx:429`
- Current pattern:
  `t('speedDuration', { speed: DEFAULT_SPEEDS[cefrLevel], time: formatTime(duration || 180) })`

Yêu cầu fix:
1. Tạo một fallback speed typed chắc chắn, ví dụ:
   `const defaultPlaybackSpeed = DEFAULT_SPEEDS[cefrLevel] ?? 1.0`
2. Dùng `defaultPlaybackSpeed` cho initial state:
   `useState(defaultPlaybackSpeed)`
3. Dùng cùng `defaultPlaybackSpeed` trong interpolation `speedDuration`.
4. Không thay đổi behavior chọn speed, cycle speed, audio playback rate, hay quest analytics.
5. Không dùng non-null assertion `DEFAULT_SPEEDS[cefrLevel]!`; fix phải an toàn runtime cho CEFR string lạ.

Verification cần chạy:
1. `npx next typegen .` từ `apps/web`
2. `npx tsc --noEmit` từ `apps/web`
3. `npx tsx scripts/check-locale-parity.ts` từ repo root
4. `npx tsx scripts/check-visual-audit-pack.ts` từ repo root
5. `npm run test` từ `apps/web`

Expected result:
- `tsc --noEmit` pass hoàn toàn, không còn baseline listening error.
- Unit tests vẫn pass.

Output:
- Diff summary.
- Verification results.
- Nếu phát hiện `speedDuration` missing translation key khi chạy route/manual smoke, báo lại thành follow-up riêng thay vì gộp vào TS baseline fix.
```

## Codex QC Plan After Antigravity

Codex will verify:

- `DEFAULT_SPEEDS[cefrLevel]` is no longer passed directly to `t(...)`.
- The fallback is `?? 1.0`, not `|| 1.0`, unless Antigravity explains why falsy speed `0` is impossible and intentionally irrelevant.
- `tsc --noEmit` passes completely.
- No unrelated files are touched.
