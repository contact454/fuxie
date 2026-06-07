# Implementation Plan — Vocab WordType Enum Reconcile (RB-P1-01)

Vai chinh: CTO / Tech Lead
Vai phoi hop: German Academic Lead, Content QA / Linguistic Reviewer

## Overview

Đồng bộ TS enum `WORD_TYPES` (`packages/shared/src/types/index.ts`) với Prisma DB enum `WordType` (đã có `PHRASE`) bằng cách **thêm `'PHRASE'`**. Đóng backlog `RB-P1-01` (23 entry `wordType="PHRASE"`). Fix ở type layer — KHÔNG đổi content data, KHÔNG migration DB.

Blast radius = 1 file type; validator + schema kế thừa qua `z.enum(WORD_TYPES)`.

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1"], "description": "Thêm 'PHRASE' vào WORD_TYPES." },
    { "wave": 2, "tasks": ["2"], "description": "Gate: typecheck + qa:content + enum parity / schema-accepts-content. Phụ thuộc wave 1." },
    { "wave": 3, "tasks": ["3"], "description": "Academic sign-off + đóng RB-P1-01. Phụ thuộc wave 2." }
  ]
}
```

## Tasks

- [x] 1. Thêm `'PHRASE'` vào TS enum `WORD_TYPES`
  - File: `packages/shared/src/types/index.ts`.
  - Append `'PHRASE'` vào mảng `WORD_TYPES` (sau `'NUMERALE'`), giữ nguyên thứ tự + các giá trị hiện có.
  - KHÔNG sửa `WordTypeSchema` trong `validators/index.ts` (kế thừa tự động qua `z.enum(WORD_TYPES)`).
  - KHÔNG sửa Prisma `schema.prisma` (đã có `PHRASE`).
  - KHÔNG đổi giá trị `wordType` của bất kỳ content entry nào.
  - _Requirements: 1.1, 1.2, 1.3, 1.5, 2.1, 2.2, 3.2_

- [x] 2. Gate: typecheck + content + enum parity
  - Chạy `pnpm typecheck` (hoặc tsc theo cấu hình repo) → xanh; nếu consumer `switch(WordType)` exhaustive vỡ, thêm `case 'PHRASE'` tối thiểu và liệt kê trong PR.
  - Chạy `pnpm qa:content` (môi trường không pnpm: `node_modules/.bin/tsx scripts/content-qa.ts`) → exit 0, 0 lỗi.
  - Verify Property 1 (Enum Parity): `new Set(WORD_TYPES)` == tập giá trị Prisma `WordType` (cả hai gồm `PHRASE`).
  - Verify Property 2 (Schema accepts content): mọi `wordType` trong `content/**/vocabulary/*.json` `safeParse` qua `WordTypeSchema` thành công (gồm 23 entry `PHRASE`).
  - Chạy `pnpm test:property` (nếu có) → không regress.
  - _Requirements: 1.4, 2.3, 3.1, 3.4, 3.5_

- [x] 3. Academic sign-off + đóng finding backlog
  - German Academic Lead xác nhận `PHRASE` là wordType ngôn ngữ hợp lệ cho cụm cố định / thành ngữ C1/C2 (`per se`, `sui generis`, `mutatis mutandis`, `im Spannungsfeld`, …).
  - Cập nhật `docs/content-quality/audit-2026-06/remediation-backlog.md`: `RB-P1-01` (`F-0001`, `F-0002`, `F-0006`–`F-0026`) → resolved, ghi root cause "TS enum desync — Prisma DB và content đã có PHRASE; TS enum lạc hậu".
  - KHÔNG sửa `scripts/fix-c*-vocab-quality.ts` (đã coi `PHRASE` hợp lệ).
  - _Requirements: 2.4, 3.3_

## Notes

- **Root cause = TS enum desync.** Prisma DB enum `WordType` đã có `PHRASE` (schema.prisma:75); `fix-c2-vocab-quality.ts` coi `PHRASE` hợp lệ; 23 content entry dùng `PHRASE`. Chỉ `WORD_TYPES` (TS) lạc hậu → validator có thể reject data hợp lệ. Fix = căn TS theo DB.
- **Fix type, không fix data.** KHÔNG đổi 23 entry; KHÔNG migration DB; blast radius = 1 file type.
- **Truy vết audit.** Spec này đóng `RB-P1-01` trong `docs/content-quality/audit-2026-06/`.
- Còn lại: `RB-P2-01` (schema field-naming drift) + Layer 2 pending (D2/D3/D4/D7/D8) là spec riêng.
