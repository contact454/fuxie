# Implementation Plan — CEFR Reading Stem Regeneration

Vai chinh: German Content Writer
Vai phoi hop: German Academic Lead, Content QA / Linguistic Reviewer, AI / LLM Engineer

## Overview

Sửa ~108 `stem` reading hỏng do bug ghép-template ở B2/C1/C2 (Teil "Kommentar verstehen") thành câu hỏi đúng ngữ pháp + khớp đáp án; sửa kèm Evidence_Mismatch + lỗi từ Đức phát hiện cùng đợt. Đáp án/options bất biến. Batch theo level (b2→c1→c2), mỗi batch qua Academic_Signoff + gate. Nguồn phạm vi: `cefr-stem-worklist.csv`.

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1"], "description": "Foundation: verifier marker + apply script (dry-run, assert answer/options) + PBT Property 1/2/3." },
    { "wave": 2, "tasks": ["2.1"], "description": "Batch b2 (11). Phụ thuộc wave 1." },
    { "wave": 3, "tasks": ["2.2"], "description": "Batch c1 (12). Phụ thuộc 2.1." },
    { "wave": 4, "tasks": ["2.3"], "description": "Batch c2 (70). Phụ thuộc 2.2." },
    { "wave": 5, "tasks": ["3"], "description": "Verify toàn cục + đóng finding. Phụ thuộc 2.3." }
  ]
}
```

Hard ordering: batch tuần tự b2→c1→c2 để rút kinh nghiệm review từ ít→nhiều; mỗi batch qua gate trước khi sang batch kế.

## Tasks

- [x] 1. Foundation — verifier + apply script + PBT
  - Viết verifier `Broken_Stem` (tái dùng marker đã lập worklist): liệt kê câu còn dính cờ; exit khác 0 nếu > 0 trong phạm vi đã sửa.
  - Tạo `scripts/regenerate-cefr-stems.ts`: đọc bản vá (file, item_id, new_stem, [new_key_evidence], [new_de], [text_fix]); `--dry-run` in diff; `--level`; chỉ ghi stem/key_evidence/explanation.de/article.text; assert `answer`/`options` bất biến.
  - Thêm `tests/content-audit/cefr-stem.spec.ts`: Property 1 (0 broken stem trên Worklist sau sửa), Property 2 (answer/options snapshot bất biến).
  - _Requirements: 1.5, 3.1, 4.3_

- [x] 2. Regenerate theo batch level

  - [x] 2.1 Batch b2 (11 câu)
    - Với mỗi câu Worklist b2: đọc stem + answer + key_evidence + đoạn text; viết Clean_Stem khớp đáp án (German Content Writer); sửa Evidence_Mismatch/lỗi từ nếu có; Academic_Signoff.
    - Apply `--level b2` (dry-run → áp); `qa:content` + `qa:german-lint` + `tests/content-audit/*` xanh.
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 3.1, 3.4, 3.5, 4.1, 4.2_

  - [x] 2.2 Batch c1 (12 câu)
    - Như 2.1 cho c1.
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 3.1, 4.1, 4.2_

  - [x] 2.3 Batch c2 (70 câu)
    - Như 2.1 cho c2 (gồm C2-T1-001 Q3 Evidence_Mismatch + C2-T1-002 "intellectual"→"intellektuellen").
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 3.1, 4.1, 4.2_

- [x] 3. Verify toàn cục + đóng finding
  - Verifier: 0 câu Worklist còn Broken_Stem (Property 1).
  - Property 2: `answer`/`options` trước/sau bất biến toàn reading.
  - `qa:content` exit 0; `qa:german-lint` 0 lỗi mới; `tests/content-audit/*` xanh.
  - Cập nhật `cefr-stem-worklist.csv` (resolved) + đóng finding trong `c2-reading-findings.md`; mở ticket riêng cho AI/CTO sửa generator gốc.
  - _Requirements: 1.5, 2.1, 3.1, 3.2, 3.3, 4.4_

## Notes

- **Chỉ chạm `stem` (+ key_evidence/explanation.de/article.text khi cần).** Đáp án, `options`, scoring, metadata, A1/A2/B1, skill khác — bất khả xâm phạm (Req 3). Script assert answer/options bất biến + Property 2/3 bảo vệ.
- **Viết lại để KHỚP đáp án có sẵn** (red-team đã xác nhận đáp án đúng) — KHÔNG đổi đáp án.
- **Academic_Signoff bắt buộc** cho mọi stem C-level trước merge.
- **Batch b2→c1→c2**, mỗi batch qua qa:content + qa:german-lint + PBT.
- Generator gốc (nguyên nhân ghép-template) xử lý ở ticket riêng (AI/LLM Engineer + CTO) để ngăn tái phát ở nội dung sinh mới.
