# Implementation Plan — C2 Listening Regeneration

Vai chinh: German Content Writer
Vai phoi hop: German Academic Lead, German Curriculum Designer, Content QA / Linguistic Reviewer, Speech / Audio Engineer

## Overview

Sinh lại nội dung nghe thật cho toàn bộ 52 file C2 listening (`L-C2-GOETHE-001…018`, Teil 1/2/3). Mỗi file: transcript thật đúng `topic`/`title`, các đoạn/hội thoại khác nhau thật (không lặp, không copy chéo ID), bộ câu hỏi mới bám transcript, đánh dấu cần re-record audio. Một lesson = một đơn vị review + Academic_Signoff. Giữ schema, chỉ thay `transcript` + `questions[]` (+ `metadata.gespraech_count`, `cefrAudit.verdict`). Cổng đóng: overlap mọi cặp < 0.5 + topic-match 100% + dupRatio nội bộ < 0.2 + đáp án verify-được.

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1"], "description": "Foundation: scan listening chính thức + apply script (dry-run, validate schema/answer/no-dup/topic) + PBT Property 1-5 + cổng. Độc lập." },
    { "wave": 2, "tasks": ["2.1", "2.2", "2.3"], "description": "Lessons 001-003 (T1/T2/T3 + nguồn copy của 011/012/013). Phụ thuộc wave 1." },
    { "wave": 3, "tasks": ["2.4", "2.5", "2.6"], "description": "Lessons 004-006 (+ nguồn 014/015/016). Phụ thuộc wave 2." },
    { "wave": 4, "tasks": ["2.7", "2.8", "2.9"], "description": "Lessons 007-009 (+ nguồn 017). Phụ thuộc wave 3." },
    { "wave": 5, "tasks": ["2.10", "2.11", "2.12"], "description": "Lessons 010-012. Phụ thuộc wave 4." },
    { "wave": 6, "tasks": ["2.13", "2.14", "2.15"], "description": "Lessons 013-015. Phụ thuộc wave 5." },
    { "wave": 7, "tasks": ["2.16", "2.17", "2.18"], "description": "Lessons 016-018. Phụ thuộc wave 6." },
    { "wave": 8, "tasks": ["3"], "description": "Verify toàn cục + đóng finding + ticket generator + handoff audio. Phụ thuộc 2.18." }
  ]
}
```

Hard ordering: foundation trước; mỗi lesson qua Academic_Signoff + gate trước khi merge; verify tổng cuối. Lưu ý cặp nhân bản N↔N+10 (vd 003↔013): khi viết lesson nguồn (003) và lesson đích (013) phải đảm bảo nội dung KHÁC nhau — kiểm overlap chéo ngay sau mỗi wave.

## Tasks

- [ ] 1. Foundation — scan + apply script + cổng + PBT
  - Chính thức hoá script scan listening (từ `tmp-scan-c2-listening`): đo (a) ma trận overlap transcript chuẩn hoá bỏ nhãn narrator, (b) keyword `topic` ⊂ transcript, (c) dupRatio nội bộ dialogue. READ-ONLY.
  - Tạo `scripts/apply-c2-listening-regen.ts`: nhận nội dung mới (id → {transcript.lines[], questions[], gespraech_count?}); `--dry-run` in diff; validate `answer` hợp `task_type`, `key_evidence` ⊂ transcript mới, overlap chéo < 0.5, dupRatio nội bộ < 0.2, keyword topic ⊂ transcript; giữ schema; set `transcript.status` cần re-record + `cefrAudit.verdict = pending_reaudit`; ghi UTF-8 no BOM.
  - Thêm `tests/content-audit/c2-listening.spec.ts`: Property 1 (overlap < 0.5 mọi cặp), Property 2 (topic-match), Property 3 (dupRatio < 0.2), Property 4 (answer/key_evidence ⊂ transcript), Property 5 (scope hash).
  - _Requirements: 1.1, 1.3, 2.1, 3.2, 4.2, 5.1, 5.2_

- [ ] 2. Regenerate từng lesson (Real_Transcript + câu hỏi + Audio_Restubbing, Academic_Signoff)

  - [ ] 2.1 Lesson 001 — T1/T2/T3
    - Viết Real_Transcript C2 đúng `topic`/`title` từng Teil + câu hỏi mới bám transcript; các đoạn khác nhau thật (dupRatio < 0.2); Academic_Signoff; apply (dry-run→ghi); đánh dấu Audio_Restubbing; qa:content + PBT xanh.
    - _Requirements: 1.1, 2.1, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 5.2, 5.3, 6.1, 6.2_

  - [ ] 2.2 Lesson 002 — T1/T2/T3 (topic "Studentenwohnungsnot"; nguồn copy của 012)
    - Như 2.1. Đảm bảo khác hẳn lesson 012.
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 5.2, 5.3, 6.1, 6.2_

  - [ ] 2.3 Lesson 003 — T1/T2/T3 (nguồn copy của 013; sửa cấu trúc "5 Sendungen" giả + câu lạc đề ở 003-T1)
    - Như 2.1. Đảm bảo khác hẳn lesson 013.
    - _Requirements: 1.1, 1.2, 2.1, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 5.2, 5.3, 6.1, 6.2_

  - [ ] 2.4 Lesson 004 — T1/T2/T3 (nguồn copy của 014)
    - Như 2.1. Đảm bảo khác hẳn lesson 014.
    - _Requirements: 1.1, 1.2, 2.1, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 5.2, 5.3, 6.1, 6.2_

  - [ ] 2.5 Lesson 005 — T1/T2/T3 (topic "Städtischer Wärmeinseleffekt"; nguồn copy của 015)
    - Như 2.1. Đảm bảo khác hẳn lesson 015.
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 5.2, 5.3, 6.1, 6.2_

  - [ ] 2.6 Lesson 006 — T1/T2/T3 (topic "Einrichtungsstile als Kulturausdruck"; nguồn copy của 016)
    - Như 2.1. Đảm bảo khác hẳn lesson 016.
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 5.2, 5.3, 6.1, 6.2_

  - [ ] 2.7 Lesson 007 — T1/T2/T3 (nguồn copy của 017)
    - Như 2.1. Đảm bảo khác hẳn lesson 017.
    - _Requirements: 1.1, 1.2, 2.1, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 5.2, 5.3, 6.1, 6.2_

  - [ ] 2.8 Lesson 008 — T1/T2/T3 (nguồn copy của 018-T1)
    - Như 2.1. Đảm bảo khác hẳn 018-T1.
    - _Requirements: 1.1, 1.2, 2.1, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 5.2, 5.3, 6.1, 6.2_

  - [ ] 2.9 Lesson 009 — T1/T2/T3
    - Như 2.1.
    - _Requirements: 1.1, 2.1, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 5.2, 5.3, 6.1, 6.2_

  - [ ] 2.10 Lesson 010 — T1/T2/T3
    - Như 2.1.
    - _Requirements: 1.1, 2.1, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 5.2, 5.3, 6.1, 6.2_

  - [ ] 2.11 Lesson 011 — T1/T2/T3 (topic "Künstlerische Authentizität und Kommerz"; hiện copy 001)
    - Như 2.1. Đảm bảo khác hẳn lesson 001.
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 5.2, 5.3, 6.1, 6.2_

  - [ ] 2.12 Lesson 012 — T1/T2/T3 (topic "Biotechnologie und Lebensmittelsicherheit"; hiện copy 002)
    - Như 2.1. Đảm bảo khác hẳn lesson 002.
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 5.2, 5.3, 6.1, 6.2_

  - [ ] 2.13 Lesson 013 — T1/T2/T3 (topic "Reformpädagogik in der Praxis"; hiện copy 003 = P0)
    - Như 2.1. Đảm bảo khác hẳn lesson 003 + đúng chủ đề Reformpädagogik.
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 5.2, 5.3, 6.1, 6.2_

  - [ ] 2.14 Lesson 014 — T1/T2/T3 (topic "Philosophie des Minimalismus"; hiện copy 004)
    - Như 2.1. Đảm bảo khác hẳn lesson 004.
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 5.2, 5.3, 6.1, 6.2_

  - [ ] 2.15 Lesson 015 — T1/T2/T3 (topic "Architektur und kollektives Gedächtnis"; hiện copy 005)
    - Như 2.1. Đảm bảo khác hẳn lesson 005.
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 5.2, 5.3, 6.1, 6.2_

  - [ ] 2.16 Lesson 016 — T1/T2/T3 (topic "Digitale Souveränität Europas"; hiện copy 006)
    - Như 2.1. Đảm bảo khác hẳn lesson 006.
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 5.2, 5.3, 6.1, 6.2_

  - [ ] 2.17 Lesson 017 — T1/T2/T3 (topic "Translationswissenschaft und Maschine"; hiện copy 007)
    - Như 2.1. Đảm bảo khác hẳn lesson 007.
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 5.2, 5.3, 6.1, 6.2_

  - [ ] 2.18 Lesson 018 — T1 (topic "Whistleblowing und institutionelle Ethik"; hiện copy 008)
    - Như 2.1. Đảm bảo khác hẳn 008-T1.
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 5.2, 5.3, 6.1, 6.2_

- [ ] 3. Verify toàn cục + đóng finding + handoff
  - Ma trận overlap 52×52 < 0.5 (Property 1); keyword topic ⊂ transcript mọi file (Property 2); dupRatio nội bộ < 0.2 mọi file (Property 3); answer hợp task_type + key_evidence ⊂ transcript mọi câu (Property 4).
  - `qa:content` exit 0; `tests/content-audit/*` xanh; listening level khác + skill khác byte-identical (Property 5).
  - Mọi file đổi transcript được đánh dấu Audio_Restubbing; cập nhật `cefrAudit.verdict`.
  - Đóng finding trong `cross-content-duplicate-scan.md` (tham chiếu commit); mở ticket riêng cho AI/CTO sửa generator gốc; handoff danh sách 52 file cho Speech/Audio Engineer để re-record MP3.
  - _Requirements: 1.1, 2.1, 3.2, 4.2, 5.1, 5.4, 5.5, 6.3, 6.4, 6.6_

## Notes

- **Viết lại CẢ transcript lẫn câu hỏi** (answer cũ vô giá trị vì gắn transcript lỗi).
- **Một lesson = một đơn vị review**, Academic_Signoff bắt buộc; theo đúng định dạng đề thi Goethe C2 từng Teil.
- **Chống cả 3 lớp lỗi cùng lúc**: không trùng chéo ID (overlap < 0.5), đúng chủ đề (topic ⊂ transcript), không lặp vòng nội bộ (dupRatio < 0.2).
- **Cặp N↔N+10** (001↔011 … 008↔018): viết nguồn và đích KHÁC nhau; kiểm overlap chéo ngay sau mỗi wave.
- **Audio MP3** không render trong spec này — chỉ đánh dấu cần re-record + handoff Speech/Audio Engineer (Audio_Restubbing).
- **Giữ schema**; chỉ thay `transcript`/`questions[]` (+ gespraech_count, status, cefrAudit.verdict). Validate trước khi ghi.
- **Generator gốc** (sinh transcript trùng/lệch/cấu trúc giả) xử lý ở ticket riêng (AI/LLM Engineer + CTO).
- Quy mô lớn (52 file × 3 lớp lỗi) — ưu tiên cao; cần German Academic Lead duyệt thực chất, không tự động hoá phần nội dung học thuật.
