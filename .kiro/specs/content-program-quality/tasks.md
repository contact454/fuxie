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
  - `scripts/content-status-board.ts`: chạy cổng máy D1–D5 (tái dùng `lib/listening-scan`, `lib/cefr-stem-markers`, `apply-c2-article-regen`, `apply-c2-teil2-regen`) + đọc manifest → sinh `docs/content-quality/audit-2026-06/status-board.{md,json}` với 36 cell.
  - **Cập nhật 2026-06-10:** sau remediation C1/C2 listening, board hiện `36/36 qaMachine=pass`, `cells with machine defect: 0`; `academicSignoff/audio` vẫn đọc từ manifest và chưa tự động ký.
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 3. Signoff manifest D7 (người cập nhật)
  - Tạo `docs/content-quality/audit-2026-06/signoff-manifest.json` khởi tạo 36 cell, `signoff: pending` (trung thực: CHƯA có người Đức duyệt cell nào). Board đọc manifest cho D7 + audio; máy không tự đặt Done-đủ.
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 4. CI hook chặn PR content
  - `.github/workflows/ci.yml` job `check-quick` đã chạy Tier-1 German gate `pnpm qa:german-lint --diff` với LanguageTool service container và không `continue-on-error`.
  - `pnpm test:property --exclude "**/exploration.spec.ts"` giữ PBT content-audit/program-quality trong CI; `program-quality.spec.ts` bảo vệ board completeness, SSOT reuse, và no-machine-auto-signoff.
  - _Requirements: 2.4, 6.3_

- [x] 5. Hợp nhất spec con + gán chủ cell
  - Bảng ánh xạ cell → spec con/owner đã ghi tại `docs/content-quality/audit-2026-06/cell-ownership-map.md`.
  - Reading remediation được gắn vào `content-c2-placeholder-regeneration`, `content-c2-teil2-regeneration`, `content-c2-teil3-regeneration`, `content-cefr-stem-regeneration`, `reading-explanation-regeneration`.
  - Listening B1–C2 được gắn vào `content-listening-regeneration`; listening A1/A2 vào listening spot-check + audio parity.
  - Cell chưa có spec remediation riêng được gán owner/workstream: `content-vocabulary-audit` (369 item), `content-writing-audit`, `content-speaking-grammar-audit`.
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 6. Fix generator gốc + guard (Đợt 0)
  - [x] Guard foundation: `scripts/content-generation-guard.ts` cung cấp `validateGeneratedBatch`/`assertGeneratedBatchClean` để generator gọi trước khi ghi `content/`.
  - [x] Guard tái dùng SSOT: `GENERIC_OPENER/_T2`, `BROKEN_STEM_MARKERS`, `overlapScore` qua `cellDuplicatePairs`, `internalDupRatio`, và `topicKeywords`/content extraction hiện có.
  - [x] Tests: `tests/content-audit/content-generation-guard.spec.ts` chứng minh guard reject D1 filler, D2 duplicate batch, D3 topic mismatch, D4 looped transcript, D5 broken-stem và pass batch sạch.
  - [ ] Còn lại: truy nguồn module/prompt/commit sinh ra 5 cụm defect lịch sử và cắm guard trực tiếp vào generator sản xuất đang tạo content mới (nếu generator đó còn active).
  - _Requirements: 4.3, 6.4_

- [x] 7. Báo cáo + tiêu chí đợt + bàn giao governance
  - Scanner xuất `status-board.{md,json}` theo cell; trạng thái hiện tại: 36/36 cell `Done (máy)`, 1/36 `Done (đủ)`.
  - `cell-ownership-map.md` định nghĩa owner, next gate, và quy tắc governance: Status_Board là nguồn máy, signoff manifest là nguồn D7/audio.
  - Release criterion giữ nguyên: "Done (đủ)" cần Academic_Signoff và listening audio không pending; các cell pending không được coi là release-signed dù machine-clean.
  - _Requirements: 4.1, 4.4, 6.1, 6.2, 6.3_

## Notes

- **Chương trình điều phối, KHÔNG viết nội dung** — D7 (chất lượng học thuật) bắt buộc German Academic Lead, là nút thắt nguồn lực con người trên 1.187 item.
- **Tái dùng SSOT** — mọi sub-gate gọi lại marker/validator đã có, không định nghĩa lại.
- **Đợt 0 (Task 1,2,3,4,6) thuần kỹ thuật** — chạy ngay không cần chuyên gia Đức; chặn tái sinh trước khi viết lại.
- **READ-ONLY `content/`** tới khi có sign-off; nội dung AI là nháp advisory ngoài `content/`.
- **Không auto-commit artifact** tự sinh (sw.js, report json) — báo owner.
