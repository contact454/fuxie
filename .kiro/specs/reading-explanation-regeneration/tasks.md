# Implementation Plan — Reading Explanation Regeneration (RB-P2-02)

Vai chinh: German Content Writer
Vai phoi hop: Vietnamese-German Localization Specialist, German Academic Lead

## Overview

Thay 1,282 `explanation.vi` boilerplate của reading questions (6 level) bằng giải thích tiếng Việt cụ thể nêu bằng chứng + lý do. Đáp án + mọi nội dung khác giữ nguyên. Batch theo level (a1→c2), mỗi level một review gate.

3 luồng theo chất lượng `explanation.de`: Rich_De (698, chỉ dịch) · Templated_De (582, viết lại de rồi dịch) · Thin_De (2, viết mới). Đóng backlog `RB-P2-02`.

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1"], "description": "Foundation: phân loại 3 luồng + script batch có dry-run + PBT Property 1/2/3." },
    { "wave": 2, "tasks": ["2.1"], "description": "Batch a1 (150). Phụ thuộc wave 1." },
    { "wave": 3, "tasks": ["2.2"], "description": "Batch a2 (200). Phụ thuộc 2.1." },
    { "wave": 4, "tasks": ["2.3"], "description": "Batch b1 (250). Phụ thuộc 2.2." },
    { "wave": 5, "tasks": ["2.4"], "description": "Batch b2 (250). Phụ thuộc 2.3." },
    { "wave": 6, "tasks": ["2.5"], "description": "Batch c1 (168). Phụ thuộc 2.4." },
    { "wave": 7, "tasks": ["2.6"], "description": "Batch c2 (264). Phụ thuộc 2.5." },
    { "wave": 8, "tasks": ["3"], "description": "Đóng RB-P2-02 + verify toàn cục. Phụ thuộc 2.6." }
  ]
}
```

Hard ordering: batch theo level tuần tự (a1→c2) để rút kinh nghiệm review từ level thấp. Mỗi batch phải qua gate trước khi sang level kế.

## Tasks

- [x] 1. Foundation — phân loại + script batch + PBT
  - Viết verifier phân loại mỗi reading question vào Rich_De / Templated_De / Thin_De; xác nhận tổng = 1,282 và split 698/582/2.
  - Tạo `scripts/regenerate-reading-explanations.ts` với `--dry-run`, `--level`, chỉ ghi explanation; assert `answer`/`options`/`stem`/`statement` bất biến.
  - Thêm `tests/content-audit/reading-explanation.spec.ts`: Property 1 (0 Boilerplate_Vi, vi non-empty), Property 2 (answer snapshot bất biến).
  - _Requirements: 1.5, 2.1, 3.1, 3.4, 5.3_

- [x] 2. Regenerate theo batch level

  - [x] 2.1 Batch a1 (150 question)
    - Phân loại Rich/Templated/Thin; viết lại `explanation.de` cho Templated/Thin → Academic_Signoff; dịch `de → vi` cụ thể → Translation_Review.
    - Chạy script `--level a1` (dry-run → áp dụng); `pnpm qa:content` + `tests/content-audit/*` xanh.
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.5, 3.5, 3.6, 4.1, 4.2, 4.3_

  - [x] 2.2 Batch a2 (200 question)
    - Như 2.1 cho a2.
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.5, 4.1, 4.2, 4.3_

  - [x] 2.3 Batch b1 (250 question)
    - Như 2.1 cho b1.
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.5, 4.1, 4.2, 4.3_

  - [x] 2.4 Batch b2 (250 question)
    - Như 2.1 cho b2.
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.5, 4.1, 4.2, 4.3_

  - [x] 2.5 Batch c1 (168 question)
    - Như 2.1 cho c1 (register học thuật C1).
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.5, 4.1, 4.2, 4.3_

  - [x] 2.6 Batch c2 (264 question)
    - Như 2.1 cho c2 (register học thuật C2).
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.5, 4.1, 4.2, 4.3_

- [x] 3. Verify toàn cục + đóng finding
  - Verifier: 0 Boilerplate_Vi trên toàn reading; 1,282 question có Specific_Vi (Property 1).
  - Property 2 (answer integrity): `answer`/`correctIndex` trước/sau bất biến (1,282 đáp án).
  - `pnpm qa:content` exit 0; `tests/content-audit/*.spec.ts` 18/18 xanh (gate zero-boilerplate bật).
  - Cập nhật `remediation-backlog.md`: `RB-P2-02` (`F-2001`…`F-2006`) → resolved. Cập nhật baseline hash audit.
  - _Requirements: 1.5, 1.6, 3.1, 3.2, 3.3, 5.1, 5.4, 5.5_

## Notes

- **Chỉ chạm `explanation`.** Đáp án, `options`, `stem`/`statement`, text bài đọc, listening, vocabulary/grammar/writing/speaking/course — bất khả xâm phạm (Req 3). Script assert answer bất biến + Property 2/3 bảo vệ.
- **de-trước-vi-sau** cho 584 question Templated/Thin: viết lập luận Đức trước khi dịch. 698 Rich_De chỉ dịch.
- **Batch theo level, ưu tiên a1→c2.** Mỗi batch qua qa:content + PBT trước khi merge.
- **Truy vết audit.** Đóng `RB-P2-02` trong `docs/content-quality/audit-2026-06/`.
- KHÔNG sửa `scripts/content-qa.ts`, 4 PBT cũ, hay reading generator gốc.
- Khối lượng nội dung lớn (1,282 item); giải thích VI grounded theo evidence thật của từng item (không phải template mới).
