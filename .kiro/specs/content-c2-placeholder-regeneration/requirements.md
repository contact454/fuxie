# Requirements Document

Vai chinh: German Content Writer
Vai phoi hop: German Academic Lead, German Curriculum Designer, Content QA / Linguistic Reviewer

## Introduction

Đợt đánh giá Kiro-agent (cổng `fuxie-content-review-board`) phát hiện một **lỗi P0 nội dung**: **8 bài đọc C2 Teil-1 "Kommentar verstehen" (C2-T1-005 … C2-T1-012) dùng chung MỘT bài văn placeholder** về "triết học khoa học / Thomas Kuhn / thuyết tương đối nhận thức". Mỗi file chỉ thay đúng **từ chủ đề ở câu mở đầu** (template *"Der vorliegende Kommentar widmet sich dem Thema {TOPIC} aus einer kritisch-analytischen Perspektive…"*), phần còn lại của `article.text` là filler giống nhau, **KHÔNG liên quan tiêu đề/chủ đề thật**:

| File | Tiêu đề (hứa hẹn) | Chủ đề | Bài đọc thực tế |
| --- | --- | --- | --- |
| C2-T1-005 | Der Multilateralismus in der Krise | Internationale Beziehungen | filler Kuhn |
| C2-T1-006 | Die kopernikanische Wende | Wissenschaftsgeschichte | filler Kuhn |
| C2-T1-007 | Adornos Kulturindustrie-These | Kulturtheorie | filler Kuhn |
| C2-T1-008 | Rawls' Theorie der Gerechtigkeit | Wirtschaftsethik | filler Kuhn |
| C2-T1-009 | CRISPR und die Grenzen des Menschenmöglichen | Medizinethik | filler Kuhn |
| C2-T1-010 | Distant Reading als Forschungsmethode | Digitale Geisteswissenschaften | filler Kuhn |
| C2-T1-011 | Säkularisierung und die Rückkehr des Religiösen | Vergleichende Religionswissenschaft | filler Kuhn |
| C2-T1-012 | Das Hard Problem des Bewusstseins | Kognitionswissenschaft | filler Kuhn |

Hệ quả: **8 bài học C2 = 80 câu hỏi** test nội dung sai hoàn toàn chủ đề. `qa:content` + metadata `cefrAudit: aligned/passed` bỏ sót (cấu trúc/đáp án hợp lệ, chỉ NỘI DUNG sai). Không thể ship.

Đối chiếu: **C2-T1-001..004** (Rechtsphilosophie / Thomas Mann / Quantenmechanik / Wittgenstein) là **nội dung thật, riêng biệt, tiếng Đức tốt** — KHÔNG thuộc phạm vi spec này. B2/C1 không dính khuôn filler (đã quét 46 bài, chỉ 8 file C2 này).

Spec này **sinh lại nội dung thật** cho 8 bài C2: viết `article.text` C2 đúng tiêu đề/chủ đề + bộ 10 câu hỏi mới (stem + options + answer + explanation) khớp bài đọc mới, có German Academic Lead duyệt. Đây là regenerate **toàn bài** (khác `content-cefr-stem-regeneration` chỉ sửa stem) — vì bài đọc sai thì câu hỏi cũ vô giá trị.

Source-of-truth:

- `docs/content-quality/audit-2026-06/review-board/c2-placeholder-worklist.csv` (8 file + title + topic + số câu).
- `docs/content-quality/audit-2026-06/review-board/kiro-pilot/c2-reading-findings.md` (mô tả P0 + bằng chứng).
- `content/c2/reading/C2-T1-001..004.json` (mẫu CẤU TRÚC + chất lượng nội dung C2 thật để noi theo).
- `docs/content-quality/cefr-audit-checklist.md` (C2 reading: level fit, answer supported by evidence).
- `scripts/content-qa.ts` + `tests/content-audit/*` (gate giữ xanh).

Phạm vi (in-scope):

- Sinh lại `article.text` (+ `article.title` giữ nguyên hoặc tinh chỉnh) cho 8 file C2 placeholder, đúng tiêu đề/chủ đề, đạt register C2.
- Sinh lại 10 câu hỏi/ file (stem đúng ngữ pháp + options + answer + key_evidence + explanation.de + explanation.vi) khớp bài đọc mới.
- Academic_Signoff cho từng bài; giữ `qa:content` + PBT xanh.

Phạm vi (out-of-scope):

- KHÔNG đụng C2-T1-001..004 (nội dung thật) hay B2/C1/A-level.
- KHÔNG đụng listening/vocabulary/grammar/writing/speaking.
- KHÔNG giữ câu hỏi cũ (vì gắn với bài filler) — answer cũ KHÔNG được bảo toàn ở spec này (khác các spec sửa-tại-chỗ trước).
- KHÔNG sửa generator gốc (mở ticket riêng cho AI/CTO để không tái sinh placeholder).

## Glossary

- **Placeholder_Article**: `article.text` của một bài C2 dùng khuôn filler Kuhn (chỉ thay từ chủ đề câu đầu), không khớp tiêu đề/chủ đề.
- **Real_Article**: `article.text` C2 mới viết, đúng tiêu đề + chủ đề, ~250–340 từ, register học thuật C2 (Konjunktiv I/II, Nominalisierung, Partizipialkonstruktionen), tiếng Đức đúng + tự nhiên.
- **Question_Set**: 10 câu MC mới cho mỗi bài: `stem` (đúng ngữ pháp, không lỗi template-concat), `options` (a–d, distractor công bằng), `answer`, `explanation.{key_evidence, de, vi}` grounded trong Real_Article.
- **Academic_Signoff**: German Academic Lead duyệt Real_Article + Question_Set đúng nội dung chủ đề + đúng ngữ pháp + đúng C2.
- **Content_QA_Gate**: `pnpm qa:content` — baseline 0 lỗi.

## Requirements

### Requirement 1: Sinh lại bài đọc thật đúng chủ đề

**User Story:** As a German Content Writer, I want 8 `article.text` placeholder được thay bằng bài đọc C2 thật đúng tiêu đề/chủ đề, so that học viên C2 đọc đúng nội dung được hứa.

#### Acceptance Criteria

1. WHEN spec đóng, THE mỗi file trong worklist SHALL có `article.text` là Real_Article đúng `article.title` + `topic` của file đó (vd C2-T1-008 = nội dung thật về Rawls' Theorie der Gerechtigkeit).
2. THE Real_Article SHALL KHÔNG còn khuôn opener generic *"Der vorliegende Kommentar widmet sich dem Thema … aus einer kritisch-analytischen Perspektive"* và KHÔNG còn filler Kuhn (trừ khi chủ đề thật sự là Kuhn/Wissenschaftsgeschichte).
3. THE Real_Article SHALL đúng ngữ pháp + tự nhiên + register C2, độ dài tương đương mẫu C2-T1-001..004 (~250–340 từ).
4. IF sau khi sửa, scan opener-generic vẫn phát hiện file trong worklist, THEN spec SHALL không được tag Done.

### Requirement 2: Sinh lại bộ câu hỏi khớp bài đọc mới

**User Story:** As a German Academic Lead, I want 10 câu hỏi mỗi bài khớp bài đọc mới, so that bài tập đo đúng khả năng đọc hiểu chủ đề thật.

#### Acceptance Criteria

1. THE mỗi file SHALL có 10 câu MC mới, mỗi câu có `stem` đúng ngữ pháp (KHÔNG dấu hiệu template-concat), `options` a–d, `answer`, `explanation.{key_evidence, de, vi}`.
2. THE `answer` của mỗi câu SHALL được hỗ trợ bởi `key_evidence` trích đúng từ Real_Article (đáp án xác minh được trong bài).
3. THE distractor (phương án sai) SHALL hợp lý nhưng sai rõ ràng (không bẫy không công bằng).
4. THE `explanation.vi` SHALL chính xác, tự nhiên, nêu vì sao đáp án đúng — KHÔNG chỉ là khuôn filler.
5. THE câu hỏi mới SHALL KHÔNG còn dấu hiệu Broken_Stem (theo marker của `content-cefr-stem-regeneration`).

### Requirement 3: Bảo toàn cấu trúc + gate + không lan ngoài phạm vi

**User Story:** As a Content QA / Linguistic Reviewer, I want chỉ 8 file C2 thay đổi và schema giữ nguyên, so that không phá gate hay đụng nội dung tốt.

#### Acceptance Criteria

1. THE spec SHALL chỉ đụng 8 file trong worklist; mọi file reading khác (gồm C2-T1-001..004) + skill khác SHALL byte-identical.
2. THE schema mỗi file (các khoá `id`, `level`, `teil`, `article`, `questions[].{id,type,options,answer,points,explanation}`, `scoring`, `qa`, `cefrAudit`, `learningOutcomes`) SHALL được giữ; chỉ giá trị `article.text`/`article.title` + nội dung `questions[]` thay.
3. WHEN `pnpm qa:content` chạy sau spec, THE Content_QA_Gate SHALL exit 0.
4. WHEN `tests/content-audit/*` chạy sau spec, THE test SHALL giữ xanh (cập nhật baseline hash có chủ đích nếu cần).
5. THE `qa:german-lint` (khi có LanguageTool) SHALL không phát sinh lỗi ngữ pháp Đức mới trên 8 bài.

### Requirement 4: Review gate + truy vết + chặn tái phát

**User Story:** As a Project Manager / Delivery Manager, I want mỗi bài qua Academic_Signoff và nguyên nhân gốc được xử lý, so that placeholder không lọt ra production và không tái sinh.

#### Acceptance Criteria

1. THE mỗi Real_Article + Question_Set SHALL qua Academic_Signoff trước khi coi là đạt.
2. THE công việc SHALL làm theo từng file (8 đơn vị review độc lập), mỗi file qua gate trước khi sang file kế.
3. WHEN hoàn tất, THE finding P0 trong `c2-reading-findings.md` SHALL được đánh dấu resolved + tham chiếu commit mỗi file.
4. THE nguyên nhân gốc (generator nhét filler) SHALL được ghi nhận thành ticket riêng cho AI / LLM Engineer + CTO để ngăn tái phát.
5. IF còn file chưa qua Academic_Signoff, THEN file đó SHALL không được merge.
