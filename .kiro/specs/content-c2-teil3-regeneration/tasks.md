# Implementation Plan — C2 Teil-3 Filler Article Regeneration

Vai chinh: German Content Writer
Vai phoi hop: German Academic Lead, German Curriculum Designer, Content QA / Linguistic Reviewer

## Overview

Thay nội dung filler của 12 bài đọc C2 Teil 3 (C2-T3-001…012, mỗi bài 6 câu) bằng bài đọc C2 thật đúng tiêu đề + bộ câu hỏi mới. Tái dùng `scripts/apply-c2-article-regen.ts`. Cổng đóng: 0 `GENERIC_OPENER` trên 12 file + đáp án verify-được.

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1"], "description": "Foundation: mở rộng GENERIC_OPENER + tracker test C2-T3. Done." },
    { "wave": 2, "tasks": ["2.1"], "description": "C2-T3-001..003." },
    { "wave": 3, "tasks": ["2.2"], "description": "C2-T3-004..006. Phụ thuộc 2.1." },
    { "wave": 4, "tasks": ["2.3"], "description": "C2-T3-007..009. Phụ thuộc 2.2." },
    { "wave": 5, "tasks": ["2.4"], "description": "C2-T3-010..012. Phụ thuộc 2.3." },
    { "wave": 6, "tasks": ["3"], "description": "Verify tổng + đóng finding. Phụ thuộc 2.4." }
  ]
}
```

## Tasks

- [x] 1. Foundation — mở rộng opener-detector + tracker
  - Mở rộng `GENERIC_OPENER` (scripts/apply-c2-article-regen.ts) bắt "Der wissenschaftliche Diskurs um das Thema".
  - Thêm 12 file C2-T3 vào tracker `tests/content-audit/c2-placeholder.spec.ts`.
  - _Requirements: 1.1, 3.3_

- [x] 2. Regenerate từng wave (Real_Article + 6 câu)

  - [x] 2.1 C2-T3-001..003 (Rechtsphilosophie/AI, Narratologie, Emergenz)
    - Viết bài C2 thật + 6 câu MC/bài; apply (dry-run→ghi); qa:content + PBT xanh.
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.3, 4.1_

  - [x] 2.2 C2-T3-004..006 (Dekonstruktion, Cyber-Diplomatie, DNA)
    - Như 2.1.
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.3, 4.1_

  - [x] 2.3 C2-T3-007..009 (Identitätspolitik, Degrowth, Enhancement)
    - Như 2.1.
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.3, 4.1_

  - [x] 2.4 C2-T3-010..012 (Computational Creativity, Religion & Bioethik, Kognitive Verzerrungen)
    - Như 2.1.
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.3, 4.1_

- [x] 3. Verify tổng + đóng finding
  - `GENERIC_OPENER` = 0 trên 12 file; broken-stem c2 = 0; mọi câu answer∈options + key_evidence⊂article.text.
  - `qa:content` exit 0; `tests/content-audit/*` xanh; C2-T1 + skill khác bất biến.
  - Đóng finding C2-T3 filler; tham chiếu ticket generator gốc.
  - _Requirements: 1.1, 2.2, 2.3, 3.1, 3.2, 3.3, 4.2_

## Notes

- **Viết lại CẢ bài đọc lẫn câu hỏi**; giữ schema; answer cũ vô giá trị (gắn filler).
- **6 câu/bài** (không phải 10 như C2-T1) — tool tự giữ số câu hiện có.
- AI-authored (Kiro-agent), pending optional human German sign-off.
- Generator gốc → ticket `TICKET-content-generator-filler-rootcause.md`.
