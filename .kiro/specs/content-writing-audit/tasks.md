# Implementation Plan — Content Writing Audit (A1–C2)

Vai chinh: German Content Writer
Vai phoi hop: German Academic Lead, German Curriculum Designer, Content QA / Linguistic Reviewer

## Overview

Audit + remediate module writing 6 level (230 bài). Defect đã xác nhận: writing/A1 Teil-1 modelAnswer dùng chung. Workstream con của `content-program-quality`. Giữ schema, chỉ thay `modelAnswer`. Một cell = một đơn vị review + Academic_Signoff. Cổng đóng: overlap modelAnswer cùng level < 0.5 + độ dài đúng + qa:content xanh.

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1"], "description": "Cổng D2 modelAnswer + apply-writing-regen + PBT Property 1-3. Độc lập." },
    { "wave": 2, "tasks": ["2"], "description": "Quét 230 bài + người phân loại Shared vs Legit → worklist. Phụ thuộc wave 1." },
    { "wave": 3, "tasks": ["3.1"], "description": "Sửa writing/A1 (cụm đã xác nhận). Phụ thuộc wave 2." },
    { "wave": 4, "tasks": ["3.2"], "description": "Sửa cụm phát hiện thêm ở level khác (nếu có). Phụ thuộc wave 2." },
    { "wave": 5, "tasks": ["4"], "description": "Verify + cập nhật board + manifest. Phụ thuộc 3.1,3.2." }
  ]
}
```

## Tasks

- [ ] 1. Cổng D2 modelAnswer + apply-writing-regen + PBT
  - Bổ sung trích `modelAnswer` riêng cho writing; chạy `cellDuplicatePairs` (`content-quality-gate`) trên `modelAnswer` (không toàn item) để tránh false-positive Legit_Shared_Frame.
  - Tạo `scripts/apply-writing-regen.ts`: nhận id → {modelAnswer, ...}; `--dry-run`; validate độ dài trong [minWords,maxWords], overlap < 0.5 với bài khác cùng level, topic-relevant; giữ schema; ghi no BOM.
  - `tests/content-audit/writing-audit.spec.ts`: Property 1 (no shared modelAnswer), Property 2 (scope), Property 3 (length fit).
  - _Requirements: 1.1, 2.1, 3.1, 3.2_

- [ ] 2. Quét 230 bài + phân loại → worklist
  - Chạy cổng D2 trên đủ 230 bài writing 6 level; xuất cặp trùng theo cell.
  - Người (Content QA + German Academic Lead) phân loại Shared_ModelAnswer (defect) vs Legit_Shared_Frame (hợp lệ); chốt worklist.
  - _Requirements: 2.1, 2.2, 2.3, 1.3_

- [ ] 3. Remediate theo cell

  - [ ] 3.1 writing/A1 (cụm đã xác nhận — modelAnswer dùng chung)
    - Viết Real_ModelAnswer riêng cho từng bài A1 Teil-1 đúng topic (Deutschkurs, Bibliothek… dữ liệu phù hợp tình huống); Academic_Signoff; apply (dry-run→ghi); qa:content xanh.
    - _Requirements: 1.1, 1.2, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2_

  - [ ] 3.2 Cụm phát hiện thêm (level khác, nếu Task 2 chốt)
    - Như 3.1 cho từng cụm.
    - _Requirements: 1.1, 3.1, 3.2, 3.3, 4.1, 4.2_

- [ ] 4. Verify + cập nhật board
  - Property 1 (overlap modelAnswer < 0.5 mọi level), Property 2 (scope), Property 3 (length).
  - `qa:content` exit 0; `tests/content-audit/*` xanh; bài ngoài worklist byte-identical.
  - Cập nhật cell writing trong Status_Board + signoff-manifest.
  - _Requirements: 1.1, 3.2, 3.3, 4.3, 4.4_

## Notes

- **Chỉ so `modelAnswer`** (không toàn item) — đề bài/khung dùng chung hợp lệ KHÔNG tính defect.
- **Người phân loại** Shared vs Legit; Academic_Signoff bắt buộc.
- **Giữ schema**; chỉ thay modelAnswer + cefrAudit.verdict.
- Workstream con của `content-program-quality`; dùng chung cổng + board.
- Quy mô defect ban đầu nhỏ (writing/A1 ~10 bài); Task 2 xác định tổng thật.
