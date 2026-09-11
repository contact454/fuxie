# Implementation Plan — Content Genus Enum Fix (RB-P0-01)

Vai chinh: Content QA / Linguistic Reviewer
Vai phoi hop: German Academic Lead

## Overview

Sửa đúng 3 giá trị enum sai `"article": "FEMINUM"` → `"article": "FEMININ"` trong file duy nhất `content/a2/vocabulary/20-wetter-klima.json` (entry `Temperatur`, `Wolke`, `Jahreszeit`). Đóng finding P0 `RB-P0-01` (`F-0003`, `F-0004`, `F-0005`) từ audit `audit-2026-06`.

Blast radius = 1 file, 3 chuỗi. Không đổi schema/code/nghĩa.

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1"], "description": "Sửa 3 article FEMINUM -> FEMININ trong Target_File." },
    { "wave": 2, "tasks": ["2"], "description": "Verify: qa:content xanh + 0 FEMINUM trong content/**. Phụ thuộc wave 1." },
    { "wave": 3, "tasks": ["3"], "description": "Sign-off Genus + đóng RB-P0-01 trong backlog. Phụ thuộc wave 2." }
  ]
}
```

## Tasks

- [x] 1. Sửa 3 giá trị `FEMINUM` → `FEMININ` trong Target_File
  - File: `content/a2/vocabulary/20-wetter-klima.json`.
  - Entry `Temperatur` (≈ line 261): `"article": "FEMINUM"` → `"article": "FEMININ"`.
  - Entry `Wolke` (≈ line 289): `"article": "FEMINUM"` → `"article": "FEMININ"`.
  - Entry `Jahreszeit` (≈ line 404): `"article": "FEMINUM"` → `"article": "FEMININ"`.
  - CHỈ đổi trường `article`; KHÔNG đụng `word`, `plural`, `wordType`, `meaning*`, `exampleSentence*`, `exampleTranslation*`, `imageUrl`.
  - Giữ nguyên cấu trúc JSON, thứ tự key, indent.
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2_

- [x] 2. Verify gate + enum validity
  - Chạy `pnpm qa:content` (môi trường không pnpm: `node_modules/.bin/tsx scripts/content-qa.ts`) → exit 0, 0 lỗi, file parse hợp lệ.
  - Verifier grep `FEMINUM` trên `content/**/*.json` → kỳ vọng **0 match**.
  - Verifier xác nhận 3 entry giờ có `article: "FEMININ"`.
  - _Requirements: 1.4, 1.5, 3.1, 3.2, 3.5_

- [x] 3. Genus sign-off + đóng finding backlog
  - German Academic Lead xác nhận cả 3 từ là giống cái thực: `die Temperatur`, `die Wolke`, `die Jahreszeit`.
  - Cập nhật `docs/content-quality/audit-2026-06/remediation-backlog.md`: đánh dấu `RB-P0-01` (`F-0003`, `F-0004`, `F-0005`) → resolved, kèm tham chiếu commit/PR.
  - KHÔNG sửa `scripts/content-qa.ts` hay enum/type trong code.
  - _Requirements: 2.3, 3.3, 3.4_

## Notes

- **Blast radius = 1 file.** Chỉ `content/a2/vocabulary/20-wetter-klima.json` được sửa; PR đụng file khác → block merge (Req 2.4, 2.5).
- **Sửa typo enum, không đổi Genus thực.** Cả 3 từ vốn đã giống cái; chỉ giá trị string viết sai (`FEMINUM`) được sửa thành `FEMININ` (∈ `GENDERS`).
- **Truy vết audit.** Spec này đóng `RB-P0-01` trong `docs/content-quality/audit-2026-06/`.
- Các finding khác của audit (P1 `PHRASE`, P2 schema drift, các chiều Layer 2 pending) là spec remediation riêng.
