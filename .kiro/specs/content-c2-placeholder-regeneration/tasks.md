# Implementation Plan — C2 Placeholder Article Regeneration

Vai chinh: German Content Writer
Vai phoi hop: German Academic Lead, German Curriculum Designer, Content QA / Linguistic Reviewer

## Overview

Thay nội dung placeholder của 8 bài đọc C2 (C2-T1-005…012, mỗi bài 10 câu) bằng bài đọc C2 thật đúng tiêu đề/chủ đề + bộ câu hỏi mới khớp bài. Một file = một đơn vị review + Academic_Signoff. Giữ schema, chỉ thay `article.title`/`article.text` + `questions[]`. Cổng đóng: 0 opener-generic + 0 broken-stem + đáp án verify-được trong bài.

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1"], "description": "Foundation: apply script (dry-run, validate schema/answer/stem) + PBT Property 1/2/3 + cổng scan opener. Độc lập." },
    { "wave": 2, "tasks": ["2.1", "2.2"], "description": "Bài C2-T1-005 + 006. Phụ thuộc wave 1." },
    { "wave": 3, "tasks": ["2.3", "2.4"], "description": "Bài C2-T1-007 + 008. Phụ thuộc wave 2." },
    { "wave": 4, "tasks": ["2.5", "2.6"], "description": "Bài C2-T1-009 + 010. Phụ thuộc wave 3." },
    { "wave": 5, "tasks": ["2.7", "2.8"], "description": "Bài C2-T1-011 + 012. Phụ thuộc wave 4." },
    { "wave": 6, "tasks": ["3"], "description": "Verify toàn cục + đóng P0 + ticket generator gốc. Phụ thuộc 2.8." }
  ]
}
```

Hard ordering: foundation trước; mỗi bài qua Academic_Signoff + gate trước khi merge; verify tổng cuối.

## Tasks

- [x] 1. Foundation — apply script + cổng + PBT
  - Tạo `scripts/apply-c2-article-regen.ts`: nhận nội dung mới (file → {title?, text, questions[]}); `--dry-run` in diff; validate đúng 10 câu, `answer` ∈ options, `key_evidence` ⊂ `article.text`, `stem` không dính Broken_Stem marker; giữ schema; ghi UTF-8 no BOM.
  - Thêm cổng scan opener-generic (`/Der vorliegende … widmet sich dem Thema/`) = 0 trên 8 file; tái dùng `cefr-stem-markers.ts`.
  - Thêm `tests/content-audit/c2-placeholder.spec.ts`: Property 1 (0 opener trong 8 file), Property 2 (answer∈options + key_evidence⊂text), Property 3 (scope hash).
  - _Requirements: 1.4, 2.2, 2.5, 3.1, 3.2_

- [x] 2. Regenerate từng bài (Real_Article + 10 câu, Academic_Signoff)

  - [x] 2.1 C2-T1-005 — Der Multilateralismus in der Krise (Internationale Beziehungen)
    - Viết Real_Article C2 đúng chủ đề + 10 câu MC mới khớp bài; Academic_Signoff; apply (dry-run→ghi); qa:content + qa:german-lint + PBT xanh.
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 3.2, 3.3, 4.1, 4.2_

  - [x] 2.2 C2-T1-006 — Die kopernikanische Wende (Wissenschaftsgeschichte)
    - Như 2.1.
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 4.2_

  - [x] 2.3 C2-T1-007 — Adornos Kulturindustrie-These (Kulturtheorie)
    - Như 2.1.
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 4.2_

  - [x] 2.4 C2-T1-008 — Rawls' Theorie der Gerechtigkeit (Wirtschaftsethik)
    - Như 2.1.
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 4.2_

  - [x] 2.5 C2-T1-009 — CRISPR und die Grenzen des Menschenmöglichen (Medizinethik)
    - Như 2.1.
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 4.2_

  - [x] 2.6 C2-T1-010 — Distant Reading als Forschungsmethode (Digitale Geisteswissenschaften)
    - Như 2.1.
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 4.2_

  - [x] 2.7 C2-T1-011 — Säkularisierung und die Rückkehr des Religiösen (Vergleichende Religionswissenschaft)
    - Như 2.1.
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 4.2_

  - [x] 2.8 C2-T1-012 — Das Hard Problem des Bewusstseins (Kognitionswissenschaft)
    - Như 2.1.
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 4.2_

- [x] 3. Verify toàn cục + đóng P0
  - Scan opener-generic = 0 trên 8 file (Property 1); marker Broken_Stem = 0 trên câu mới (Req 2.5).
  - Property 2: mọi câu mới có answer∈options + key_evidence⊂article.text.
  - `qa:content` exit 0; `qa:german-lint` 0 lỗi mới; `tests/content-audit/*` xanh; C2-T1-001..004 + skill khác byte-identical (Property 3).
  - Đóng P0 trong `c2-reading-findings.md` (tham chiếu commit mỗi file); mở ticket riêng cho AI/CTO sửa generator gốc.
  - _Requirements: 1.4, 2.5, 3.1, 3.3, 3.4, 4.3, 4.4_

## Notes

- **Viết lại CẢ bài đọc lẫn câu hỏi** (answer cũ vô giá trị vì gắn filler) — khác spec genus/stem (sửa field tại chỗ).
- **Một file = một đơn vị review**, Academic_Signoff bắt buộc; noi mẫu C2-T1-001..004 về độ sâu + register.
- **Giữ schema**; chỉ thay `article.title`/`article.text` + `questions[]`. Validate answer∈options + key_evidence⊂article.text trước khi ghi.
- **Không lan ngoài 8 file**; C2-T1-001..004 + skill khác bất biến (Property 3).
- **Generator gốc** (nhét filler) xử lý ở ticket riêng (AI/LLM Engineer + CTO) để không tái sinh placeholder ở nội dung mới.
- Đây là **P0** — ưu tiên cao nhất trong các remediation đang mở.
