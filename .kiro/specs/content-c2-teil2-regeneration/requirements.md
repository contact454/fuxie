# Requirements Document

Vai chinh: German Content Writer
Vai phoi hop: German Academic Lead, German Curriculum Designer, Content QA / Linguistic Reviewer

## Introduction

Đợt quét sâu Kiro-agent (audit 2026-06, `cross-content-duplicate-scan.md`) phát hiện — và đã **đọc trực tiếp xác minh** — một **lỗi P0 nội dung** ở **C2 reading Teil 2 "Lückentext (Textabschnitte)"**: **toàn bộ 12 file C2-T2-001…012 dùng chung MỘT bài cloze placeholder**. Mỗi file chỉ thay `section_cloze.title` + tên chủ đề ở câu mở đầu (khuôn *"Der folgende Bericht untersucht das Thema '{TOPIC}' aus interdisziplinärer Perspektive…"*); 8 đoạn `{1}`–`{8}` của `section_cloze.text` là **filler generic giống hệt nhau** (về "Komplexität des Gegenstandes / empirische Studien / methodologische Herausforderungen / ethische Dimension / internationaler Vergleich…"), KHÔNG liên quan chủ đề thật. 9 câu `sections[]` A–I cũng là **cùng 9 câu**, chỉ đảo thứ tự gán nhãn + remap `answers`.

Bằng chứng đã đọc:

| File | topic | section_cloze.title | Thân cloze thực tế |
| --- | --- | --- | --- |
| C2-T2-001 | Rechtsphilosophie | Die Legitimation staatlicher Gewalt | filler generic |
| C2-T2-012 | Kognitionswissenschaft | Embodied Cognition | **filler generic y hệt 001** (8 đoạn trùng verbatim; sections A–I cùng câu, đảo nhãn) |

Scan overlap xác nhận 11 cặp ~exact (≥0.95) hội tụ về C2-T2-012 + cặp 007↔009 → toàn bộ block C2-T2-001…012 dính.

Hệ quả: **12 bài Lückentext C2 = 96 ô điền (8/ file)** test một bài đọc filler không khớp chủ đề. `qa:content` + metadata `cefrAudit: aligned` bỏ sót (cấu trúc/đáp án nội bộ hợp lệ, chỉ NỘI DUNG sai + trùng). Không thể ship. `cefrAudit.verdict = "aligned"` ở đây **sai** vì audit chỉ rà metadata, không đọc nội dung cloze.

Đối chiếu: spec `content-c2-placeholder-regeneration` đã xử lý cùng họ defect cho **Teil 1 + Teil 3** reading; **Teil 2 bị bỏ sót** trong đợt đó. Spec này khép phần còn lại của C2 reading.

Source-of-truth:

- `docs/content-quality/audit-2026-06/review-board/kiro-pilot/cross-content-duplicate-scan.md` (phát hiện + số liệu + xác minh đọc).
- `content/c2/reading/C2-T2-001…012.json` (12 file target + schema Teil 2).
- `.kiro/specs/content-c2-placeholder-regeneration/` (mẫu spec + apply-script + cổng đã làm cho T1/T3).
- `docs/content-quality/cefr-audit-checklist.md` (C2 reading: level fit, đáp án xác minh được).
- `scripts/content-qa.ts` + `tests/content-audit/*` (gate giữ xanh).

Phạm vi (in-scope):

- Sinh lại `section_cloze` thật cho 12 file C2-T2, đúng `topic`/`title`, đúng định dạng Teil 2 (thân bài có 8 ô `{1}`–`{8}` + `sections[]` A–I gồm 8 câu đúng + ≥1 distractor + `answers` map), register học thuật C2.
- Mỗi file nội dung **khác nhau thật** (không trùng filler chung, không copy chéo ID).
- Academic_Signoff từng file; giữ `qa:content` + PBT xanh.

Phạm vi (out-of-scope):

- KHÔNG đụng C2-T1/T3 (đã xử lý) hay B2/C1/A-level reading, listening, skill khác.
- KHÔNG giữ `section_cloze` cũ (filler) — `answers` cũ KHÔNG bảo toàn.
- KHÔNG sửa generator gốc (ticket riêng cho AI/LLM Engineer + CTO).

## Glossary

- **Placeholder_Cloze**: `section_cloze` dùng khuôn filler chung ("Der folgende Bericht untersucht das Thema '…' aus interdisziplinärer Perspektive"), 8 đoạn generic + 9 câu sections dùng chung, không khớp chủ đề.
- **Real_Cloze**: `section_cloze` mới đúng `title`/`topic`, thân bài C2 ~240–260 từ với 8 ô `{1}`–`{8}` mạch lạc, `sections[]` A–I (8 câu đúng + distractor) khớp ngữ cảnh từng ô, register học thuật C2.
- **Cloze_Answer_Integrity**: với mỗi ô `{n}`, câu được gán (`answers[n]` → section id) khớp ngữ nghĩa/cú pháp đoạn; distractor không điền được ô nào.
- **Academic_Signoff**: German Academic Lead duyệt Real_Cloze đúng chủ đề + ngữ pháp + C2 + mạch logic ô↔câu.
- **Content_QA_Gate**: `pnpm qa:content` — baseline 0 lỗi.

## Requirements

### Requirement 1: Sinh lại bài cloze thật đúng chủ đề

**User Story:** As a German Content Writer, I want 12 `section_cloze` placeholder được thay bằng bài Lückentext C2 thật đúng tiêu đề/chủ đề, so that học viên C2 luyện đúng nội dung được hứa.

#### Acceptance Criteria

1. WHEN spec đóng, THE mỗi file C2-T2-001…012 SHALL có `section_cloze` là Real_Cloze đúng `title` + `topic` của file đó.
2. THE Real_Cloze SHALL KHÔNG còn khuôn opener generic *"Der folgende Bericht untersucht das Thema … aus interdisziplinärer Perspektive"* và KHÔNG còn 8 đoạn filler chung.
3. THE Real_Cloze SHALL đúng ngữ pháp + register C2, độ dài tương đương baseline Teil 2 (~240–260 từ), có đúng 8 ô `{1}`–`{8}`.
4. IF sau khi sửa, scan opener-generic vẫn phát hiện file trong worklist, THEN spec SHALL không được tag Done.

### Requirement 2: Bài cloze khác nhau thật giữa các ID

**User Story:** As a Content QA / Linguistic Reviewer, I want 12 bài cloze khác nhau thật, so that không học viên nào gặp lại cùng bài ở ID khác.

#### Acceptance Criteria

1. WHEN spec đóng, THE không cặp file nào trong C2-T2-001…012 SHALL có overlap thân `section_cloze.text` (chuẩn hoá) ≥ 0.5.
2. THE bộ `sections[]` A–I SHALL khác nhau thật giữa các file (không phải cùng 9 câu đảo nhãn).

### Requirement 3: Toàn vẹn ô điền + đáp án xác minh được

**User Story:** As a German Academic Lead, I want mỗi ô điền có đúng một câu khớp và distractor không khớp, so that bài tập đo đúng khả năng đọc hiểu mạch lạc văn bản.

#### Acceptance Criteria

1. THE mỗi file SHALL có đúng 8 ô `{1}`–`{8}`; `answers` SHALL map đủ 8 ô, mỗi ô tới một section id tồn tại trong `sections[]`.
2. THE mỗi câu trong `answers` SHALL khớp ngữ nghĩa + cú pháp đoạn chứa ô tương ứng (Cloze_Answer_Integrity).
3. THE ít nhất một section SHALL là `distractor` không điền đúng ô nào.
4. THE mỗi section id dùng trong `answers` SHALL ∈ tập id của `sections[]` (không map tới id không tồn tại).

### Requirement 4: Bảo toàn schema + gate + không lan ngoài phạm vi

**User Story:** As a Content QA / Linguistic Reviewer, I want chỉ 12 file C2-T2 thay đổi và schema giữ nguyên, so that không phá gate hay đụng nội dung tốt.

#### Acceptance Criteria

1. THE spec SHALL chỉ đụng 12 file C2-T2-001…012; mọi file reading khác (C2-T1/T3 + B2/C1/A-level) + skill khác SHALL byte-identical.
2. THE schema mỗi file (`id`, `level`, `teil`, `teil_name`, `topic`, `metadata`, `section_cloze.{title,text,sections,answers,distractor}`, `images`, `scoring`, `qa`, `cefrAudit`, `learningOutcomes`) SHALL được giữ; chỉ giá trị `section_cloze` (title/text/sections/answers/distractor) thay.
3. WHEN `pnpm qa:content` chạy sau spec, THE Content_QA_Gate SHALL exit 0.
4. WHEN `tests/content-audit/*` chạy sau spec, THE test SHALL giữ xanh.
5. THE `cefrAudit.verdict` cũ (`aligned` sai) SHALL được cập nhật phản ánh trạng thái mới (pending re-audit / aligned sau Academic_Signoff thật).

### Requirement 5: Review gate + truy vết + chặn tái phát

**User Story:** As a Project Manager / Delivery Manager, I want mỗi bài qua Academic_Signoff và nguyên nhân gốc được xử lý, so that placeholder không lọt production và không tái sinh.

#### Acceptance Criteria

1. THE mỗi Real_Cloze SHALL qua Academic_Signoff trước khi coi là đạt.
2. THE công việc SHALL làm theo từng file (12 đơn vị review độc lập), mỗi file qua gate trước khi sang file kế.
3. WHEN hoàn tất, THE finding C2-T2 trong `cross-content-duplicate-scan.md` SHALL được đánh dấu resolved + tham chiếu commit.
4. THE nguyên nhân gốc (generator nhét cloze filler) SHALL được ghi nhận thành ticket riêng cho AI/LLM Engineer + CTO (gộp với ticket filler đã mở nếu cùng pipeline).
5. IF còn file chưa qua Academic_Signoff, THEN file đó SHALL không được merge.
