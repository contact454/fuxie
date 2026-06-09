# Implementation Plan — C2 Teil 2 Cloze Regeneration

Vai chinh: German Content Writer
Vai phoi hop: German Academic Lead, German Curriculum Designer, Content QA / Linguistic Reviewer

## Overview

Thay nội dung placeholder của 12 bài Lückentext C2 Teil 2 (C2-T2-001…012, mỗi bài 8 ô) bằng bài cloze C2 thật đúng tiêu đề/chủ đề. Một file = một đơn vị review + Academic_Signoff. Giữ schema, chỉ thay `section_cloze.{title,text,sections,answers,distractor}`. Cổng đóng: 0 opener-generic + overlap thân cloze mọi cặp < 0.5 + đúng 8 ô + answers map hợp lệ + topic ⊂ text.

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1"], "description": "Foundation: apply-script Teil 2 (dry-run, validate 8 ô + answers + no-dup + topic + opener) + PBT Property 1-4 + cổng. Độc lập." },
    { "wave": 2, "tasks": ["2.1", "2.2", "2.3"], "description": "C2-T2-001/002/003. Phụ thuộc wave 1." },
    { "wave": 3, "tasks": ["2.4", "2.5", "2.6"], "description": "C2-T2-004/005/006. Phụ thuộc wave 2." },
    { "wave": 4, "tasks": ["2.7", "2.8", "2.9"], "description": "C2-T2-007/008/009. Phụ thuộc wave 3." },
    { "wave": 5, "tasks": ["2.10", "2.11", "2.12"], "description": "C2-T2-010/011/012. Phụ thuộc wave 4." },
    { "wave": 6, "tasks": ["3"], "description": "Verify toàn cục + đóng finding C2-T2 + ticket generator gốc. Phụ thuộc 2.12." }
  ]
}
```

Hard ordering: foundation trước; mỗi file qua Academic_Signoff + gate trước khi merge; verify tổng cuối. Kiểm overlap chéo ngay sau mỗi wave để 12 bài khác nhau thật.

## Tasks

- [ ] 1. Foundation — apply-script Teil 2 + cổng + PBT
  - Tạo `scripts/apply-c2-teil2-regen.ts`: nhận id → {title?, text, sections[], answers, distractor}; `--dry-run` in diff; validate `text` đúng 8 ô `{1}`–`{8}`, `answers` map đủ 8 ô tới section id ∈ `sections[]`, `distractor` ∈ `sections[]` và ∉ `answers`, opener-generic = 0, keyword topic ⊂ text; giữ schema (chỉ thay `section_cloze` + `cefrAudit.verdict`); ghi UTF-8 no BOM.
  - Thêm cổng scan opener-generic `/Der folgende Bericht untersucht das Thema .* aus interdisziplinärer Perspektive/` = 0 + overlap thân cloze chéo < 0.5 trên 12 file.
  - Thêm `tests/content-audit/c2-teil2.spec.ts`: Property 1 (0 opener + topic-match), Property 2 (cấu trúc 8 ô + answers), Property 3 (overlap < 0.5), Property 4 (scope hash).
  - Task 1 cũng xác nhận worklist đủ 12 file + topic từng file.
  - _Requirements: 1.4, 2.1, 3.1, 3.3, 3.4, 4.1, 4.2_

- [ ] 2. Regenerate từng bài (Real_Cloze, Academic_Signoff)

  - [ ] 2.1 C2-T2-001 — Rechtsphilosophie (Die Legitimation staatlicher Gewalt)
    - Viết Real_Cloze C2 đúng chủ đề (8 ô mạch lạc + sections A–I + answers + distractor); Academic_Signoff; apply (dry-run→ghi); qa:content + PBT xanh.
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 4.2, 4.3, 5.1, 5.2_

  - [ ] 2.2 C2-T2-002 — (topic theo file)
    - Như 2.1.
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 4.2, 5.1, 5.2_

  - [ ] 2.3 C2-T2-003 — (topic theo file)
    - Như 2.1.
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 4.2, 5.1, 5.2_

  - [ ] 2.4 C2-T2-004 — (topic theo file)
    - Như 2.1.
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 4.2, 5.1, 5.2_

  - [ ] 2.5 C2-T2-005 — (topic theo file)
    - Như 2.1.
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 4.2, 5.1, 5.2_

  - [ ] 2.6 C2-T2-006 — (topic theo file)
    - Như 2.1.
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 4.2, 5.1, 5.2_

  - [ ] 2.7 C2-T2-007 — (topic theo file)
    - Như 2.1.
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 4.2, 5.1, 5.2_

  - [ ] 2.8 C2-T2-008 — (topic theo file)
    - Như 2.1.
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 4.2, 5.1, 5.2_

  - [ ] 2.9 C2-T2-009 — (topic theo file)
    - Như 2.1.
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 4.2, 5.1, 5.2_

  - [ ] 2.10 C2-T2-010 — (topic theo file)
    - Như 2.1.
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 4.2, 5.1, 5.2_

  - [ ] 2.11 C2-T2-011 — (topic theo file)
    - Như 2.1.
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 4.2, 5.1, 5.2_

  - [ ] 2.12 C2-T2-012 — Kognitionswissenschaft (Embodied Cognition)
    - Như 2.1.
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 4.2, 5.1, 5.2_

- [ ] 3. Verify toàn cục + đóng finding
  - Scan opener-generic = 0 trên 12 file (Property 1); topic ⊂ text mọi file.
  - Property 2: mỗi file đúng 8 ô + answers map đủ + id ∈ sections + distractor ∉ answers.
  - Property 3: overlap thân cloze mọi cặp < 0.5.
  - `qa:content` exit 0; `tests/content-audit/*` xanh; C2-T1/T3 + skill khác byte-identical (Property 4).
  - Đóng finding C2-T2 trong `cross-content-duplicate-scan.md` (tham chiếu commit mỗi file); mở/gộp ticket generator gốc cho AI/CTO.
  - _Requirements: 1.4, 2.1, 3.1, 4.1, 4.3, 4.4, 5.3, 5.4_

## Notes

- **Viết lại CẢ thân cloze lẫn sections + answers** (filler cũ vô giá trị) — định dạng Teil 2 khác T1/T3.
- **Một file = một đơn vị review**, Academic_Signoff bắt buộc; noi mẫu C2-T1-001..004 về độ sâu + register.
- **Giữ schema**; chỉ thay `section_cloze` + `cefrAudit.verdict`. Validate 8 ô + answers↔sections + distractor + topic trước khi ghi.
- **12 bài khác nhau thật** (overlap < 0.5); kiểm chéo sau mỗi wave.
- **Không lan ngoài 12 file**; C2-T1/T3 + skill khác bất biến (Property 4).
- **Generator gốc** xử lý ở ticket riêng (gộp với ticket filler đã mở nếu cùng pipeline).
- Đây là **P0** — khép phần còn lại của C2 reading (T1/T3 đã xong ở spec trước).
