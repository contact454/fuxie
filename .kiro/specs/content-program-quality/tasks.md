# Implementation Plan — Content Program Quality (A1–C2, mọi module)

Vai chinh: Project Manager / Delivery Manager
Vai phoi hop: Content QA / Linguistic Reviewer, German Academic Lead, AI / LLM Engineer, CTO / Tech Lead, Speech / Audio Engineer

## Overview

Dựng khung chương trình quản lý chất lượng + remediation cho 1.187 item (36 cell). Spec này làm **hạ tầng điều phối** (cổng QA thống nhất D1–D6, Status_Board, manifest sign-off D7, CI, hợp nhất spec con) — KHÔNG viết nội dung học thuật (việc đó ở spec con + cần German Academic Lead). Lộ trình 5 đợt; Đợt 0 thuần kỹ thuật chạy ngay.

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1"], "description": "Cổng QA thống nhất D1-D6 (gom SSOT) + PBT parity. Độc lập." },
    { "wave": 2, "tasks": ["2", "3"], "description": "Status_Board generator + signoff manifest 36 cell. Phụ thuộc wave 1." },
    { "wave": 3, "tasks": ["4"], "description": "CI hook chặn PR content vi phạm D1-D6. Phụ thuộc wave 2." },
    { "wave": 4, "tasks": ["5"], "description": "Hợp nhất spec con + gán chủ cell chưa có spec. Phụ thuộc wave 2." },
    { "wave": 5, "tasks": ["6"], "description": "Generator gốc fix + guard (Đợt 0 của master plan). Phụ thuộc wave 1." },
    { "wave": 6, "tasks": ["7"], "description": "Báo cáo định kỳ + tiêu chí từng đợt + bàn giao governance. Phụ thuộc 2,3,4,5,6." }
  ]
}
```

## Tasks

- [x] 1. Cổng QA thống nhất D1–D6 (gom SSOT, không định nghĩa lại)
  - `scripts/content-quality-gate.ts`: engine canonical gom 6 sub-gate — D1 opener (`hasGenericOpener`/`_T2`), D2 duplicate (`cellDuplicatePairs` dùng `overlapScore`), D3 topic (`transcriptMatchesTopic`, **advisory/warn**), D4 fake-segment (`internalDupRatio`), D5 broken-stem (`isBrokenStem`), D6 answer-integrity (key_evidence ⊂ content). Tái dùng SSOT, không định nghĩa lại marker.
  - `itemContentText` trích nội dung học theo module (reading article/cloze, listening transcript, writing modelAnswer loại prompt).
  - `tests/content-audit/program-quality.spec.ts` — **7/7 xanh**: Property 1 (board 36 cell/1187), Property 2 (gate khớp marker gốc + D6), Property 3 (không máy tự duyệt).
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 2. Status_Board generator (36 cell, sinh từ scanner)
  - `scripts/content-status-board.ts`: chạy cổng máy D1–D5 (tái dùng `lib/listening-scan`, `lib/cefr-stem-markers`, `apply-c2-article-regen`, `apply-c2-teil2-regen`) + đọc manifest → sinh `docs/content-quality/audit-2026-06/status-board.{md,json}` với 36 cell. **Đã chạy: 36 cell / 1187 item, 11 cell có defect máy.**
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 3. Signoff manifest D7 (người cập nhật)
  - Tạo `docs/content-quality/audit-2026-06/signoff-manifest.json` khởi tạo 36 cell, `signoff: pending` (trung thực: CHƯA có người Đức duyệt cell nào). Board đọc manifest cho D7 + audio; máy không tự đặt Done-đủ.
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 4. CI hook chặn PR content
  - Cắm cổng máy (Task 1) vào CI: PR đụng `content/**` chạy D1–D6, fail nếu vi phạm mới so baseline; tái dùng `vitest.property.config.ts` + `tests/content-audit/*`.
  - _Requirements: 2.4, 6.3_

- [ ] 5. Hợp nhất spec con + gán chủ cell
  - Bảng ánh xạ cell → spec con: reading C2-T1/T3 (done), C2-T2 (`content-c2-teil2-regeneration`), stems (`content-cefr-stem-regeneration`), listening B1–C2 (`content-listening-regeneration`).
  - Đề xuất spec con MỚI cho cell chưa có chủ: `content-vocabulary-audit` (369 item), `content-writing-audit`, `content-speaking-grammar-audit`.
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 6. Fix generator gốc + guard (Đợt 0)
  - Theo ticket `TICKET-content-generator-filler-rootcause.md` (5 cụm): điều tra module/prompt sinh D1–D4 + thêm fail-fast guard reject output dính GENERIC_OPENER/_T2, BROKEN_STEM_MARKERS, overlap≥0.5, dupRatio≥0.2, topic mismatch — KHÔNG ghi `content/`.
  - _Requirements: 4.3, 6.4_

- [ ] 7. Báo cáo + tiêu chí đợt + bàn giao governance
  - Scanner xuất số defect còn lại theo cell định kỳ; định nghĩa tiêu chí hoàn thành mỗi đợt (số cell Done máy / Done đủ).
  - Property 4: `content/` READ-ONLY tới khi sign-off (hash/CI).
  - Cập nhật master plan + Status_Board làm dashboard chính thức; bàn giao cho PM theo dõi.
  - _Requirements: 4.1, 4.4, 6.1, 6.2, 6.3_

## Notes

- **Chương trình điều phối, KHÔNG viết nội dung** — D7 (chất lượng học thuật) bắt buộc German Academic Lead, là nút thắt nguồn lực con người trên 1.187 item.
- **Tái dùng SSOT** — mọi sub-gate gọi lại marker/validator đã có, không định nghĩa lại.
- **Đợt 0 (Task 1,2,3,4,6) thuần kỹ thuật** — chạy ngay không cần chuyên gia Đức; chặn tái sinh trước khi viết lại.
- **READ-ONLY `content/`** tới khi có sign-off; nội dung AI là nháp advisory ngoài `content/`.
- **Không auto-commit artifact** tự sinh (sw.js, report json) — báo owner.
