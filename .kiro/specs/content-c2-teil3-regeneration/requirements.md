# Requirements — C2 Teil-3 Filler Article Regeneration

Vai chinh: German Content Writer
Vai phoi hop: German Academic Lead, German Curriculum Designer, Content QA / Linguistic Reviewer

## Introduction

12 bài đọc C2 Teil 3 ("Wissenschaftlicher Text", `C2-T3-001…012`) dùng **chung một bài đọc filler** ("Der wissenschaftliche Diskurs um das Thema '<topic>' hat…") — chỉ thay danh từ chủ đề ở câu 1 và đoạn kết, nội dung 6 đoạn còn lại y hệt nhau (epistemologische Grundlegung / interdisziplinäre Integration / Anwendung). Tiêu đề mỗi bài (z. B. "Algorithmische Rechtsprechung", "Cyber-Diplomatie", "Computational Creativity") KHÔNG khớp nội dung. Cùng họ defect với P0 đã xử lý ở `content-c2-placeholder-regeneration` (C2-T1-005…012). Stem đã được sửa ngữ pháp ở `content-cefr-stem-regeneration`, nhưng **bài đọc vẫn là placeholder**.

Mục tiêu: thay nội dung filler bằng bài đọc C2 học thuật thật, đúng tiêu đề/chủ đề + 6 câu MC mới khớp bài. Giữ schema, tái dùng `scripts/apply-c2-article-regen.ts`.

## Requirements

### Requirement 1 — Real, on-topic C2 article
**User Story:** Là học viên C2, tôi muốn mỗi bài đọc Teil 3 là một văn bản học thuật thật đúng tiêu đề, để luyện đọc hiểu đúng chủ đề.
#### Acceptance Criteria
1. WHEN một bài C2-T3 được regenerate THEN `article.text` MỚI phải đúng chủ đề của `title`/`topic` và KHÔNG còn khuôn filler (`GENERIC_OPENER` = 0).
2. WHEN viết bài THEN độ dài ≥ 200 ký tự, văn phong học thuật C2 (Nominalisierung, Passiv, Konjunktiv), không lẫn từ tiếng Anh không cần thiết.
3. WHEN regenerate THEN giữ nguyên schema file (`id`, `level`, `teil`, `scoring`, `qa`, `cefrAudit`, `learningOutcomes`, `images`).

### Requirement 2 — New verifiable questions
**User Story:** Là học viên, tôi muốn câu hỏi khớp bài và đáp án kiểm chứng được.
#### Acceptance Criteria
1. WHEN regenerate THEN giữ đúng số câu hỏi hiện có của file (6).
2. WHEN tạo câu hỏi THEN mỗi câu có `stem` đúng ngữ pháp (không dính `BROKEN_STEM_MARKERS`), `options` ≥ 2, `answer ∈ options`.
3. WHEN tạo lời giải THEN `key_evidence` là chuỗi con verbatim của `article.text` MỚI; có `de` + `vi`.

### Requirement 3 — Scope & invariants
**User Story:** Là maintainer, tôi muốn thay đổi chỉ giới hạn ở 12 file C2-T3.
#### Acceptance Criteria
1. WHEN apply THEN chỉ `article.title`/`article.text` + `questions[]` của 12 file C2-T3 thay đổi.
2. WHEN hoàn tất THEN các skill/level/teil khác (gồm C2-T1) byte-identical.
3. WHEN apply THEN ghi UTF-8 no BOM; `qa:content` exit 0; `tests/content-audit/*` xanh.

### Requirement 4 — Honest labelling
**User Story:** Là owner, tôi muốn biết nội dung là AI-authored, chưa người rành tiếng Đức duyệt.
#### Acceptance Criteria
1. WHEN regenerate THEN nội dung được đánh dấu AI-authored (Kiro-agent), pending optional human German sign-off.
2. WHEN đóng spec THEN finding C2-T3 filler được tham chiếu resolved + ticket generator gốc giữ nguyên.
