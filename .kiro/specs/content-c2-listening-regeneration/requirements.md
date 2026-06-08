# Requirements Document

Vai chinh: German Content Writer
Vai phoi hop: German Academic Lead, German Curriculum Designer, Content QA / Linguistic Reviewer, Speech / Audio Engineer

## Introduction

Đợt đánh giá Kiro-agent (cổng `fuxie-content-review-board`, đợt audit 2026-06) đã đọc trực tiếp và quét định lượng **toàn bộ 52 file C2 listening** (`content/c2/listening/L-C2-GOETHE-001-T1 … 018-T1`, các Teil 1/2/3). Kết quả xác nhận một **cụm lỗi P0/P1 hệ thống** giống họ filler đã thấy ở C2 reading, nhưng nặng hơn vì lan toàn bộ corpus:

| Lớp lỗi | Mức | Quy mô (scan định lượng) | Mô tả |
| --- | --- | --- | --- |
| **A. Transcript nhân bản verbatim giữa các ID** | P0 | **22 cặp overlap = 1.0** (lời journalist giống 100% sau khi bỏ nhãn narrator) | Block GOETHE-011…018 là **bản sao y nguyên lời thoại** của block 001…008 theo mẫu N ↔ N+10 (001↔011, 002↔012, …, 008↔018). Học viên gặp lại đúng bài nghe ở 2 ID khác nhau. |
| **B. Topic/title không khớp transcript** | P0 | **29 file** | `topic`/`title`/`audio_file`/`learningOutcomes` khai một chủ đề (vd 013-T1 = "Reformpädagogik in der Praxis") nhưng `transcript` nói chủ đề khác (vd 013-T1 thực chất là "Berliner Mauer in Schulbüchern" copy từ 003-T1). Câu hỏi bám transcript → lệch hoàn toàn topic khai báo. |
| **C. Cấu trúc "N Sendungen/Gespräche" giả** | P1 | **52/52 file** (dupRatio 0.56–0.75) | Transcript khai "Sie hören fünf Radiosendungen" + nhãn "Sendung 1–5" nhưng thực chất là **một số ít đoạn văn lặp vòng** nối lại, không phải N bản tin/hội thoại khác nhau. Câu hỏi đôi khi lạc đề so với monolog (vd 003-T1 hỏi "Die Person kommt aus Köln/Frankreich" trên monolog học thuật về sách giáo khoa). |

Hệ quả: **toàn bộ 52 bài nghe C2 không thể ship** — học viên hoặc nghe trùng nội dung ở 2 ID, hoặc nghe nội dung không khớp chủ đề được hứa, hoặc luyện một cấu trúc đề thi giả. Metadata `cefrAudit.verdict = "aligned"` ở đây **sai** vì audit chỉ rà metadata, không đọc transcript.

Đối chiếu phương pháp: lỗi này cùng họ "generator nhét nội dung lặp/placeholder" như spec `content-c2-placeholder-regeneration` (reading) đã xử lý. Khác biệt: ở đây là **listening** (có transcript + audio_file + cấu trúc Teil đặc thù Goethe C2) và **lan 100% corpus** thay vì 8 file.

Spec này **sinh lại nội dung nghe thật** cho 52 file C2 listening: viết transcript thật đúng `topic`/`title` của từng file, theo đúng định dạng đề thi Goethe C2 (Teil 1 Radiosendungen ja/nein, Teil 2/3 theo task_type tương ứng), với các đoạn/hội thoại **khác nhau thật sự** (không lặp vòng, không copy giữa các ID), kèm bộ câu hỏi mới bám transcript, có German Academic Lead duyệt.

Source-of-truth:

- `docs/content-quality/audit-2026-06/review-board/kiro-pilot/cross-content-duplicate-scan.md` (phát hiện + bằng chứng + số liệu scan 52 file).
- `scripts/scan-content-placeholders.ts` (scanner READ-ONLY tái dùng).
- `content/c2/listening/L-C2-GOETHE-*.json` (52 file target + schema hiện hữu).
- `.kiro/specs/content-c2-placeholder-regeneration/` (mẫu spec + apply-script + cổng đã làm cho reading).
- `docs/content-quality/cefr-audit-checklist.md` (C2 listening: level fit, câu hỏi bám transcript).
- `scripts/content-qa.ts` + `tests/content-audit/*` (gate giữ xanh).

Phạm vi (in-scope):

- Sinh lại `transcript` thật cho 52 file C2 listening, đúng `topic`/`title`/`teil`/`task_type` từng file, đúng register C2, các đoạn/hội thoại khác nhau thật (không lặp, không copy chéo ID).
- Sinh lại câu hỏi mỗi file bám transcript mới (statement/options + answer + key_evidence + explanation.de + explanation.vi).
- Bỏ cấu trúc "N Sendungen/Gespräche" giả → hoặc tạo N đoạn khác nhau thật, hoặc chỉnh khai báo số đoạn cho khớp nội dung thật.
- Đánh dấu transcript là draft cần lồng tiếng lại (audio_file/MP3 do Speech/Audio Engineer xử lý ở stream riêng); Academic_Signoff cho từng file.
- Giữ `qa:content` + PBT xanh.

Phạm vi (out-of-scope):

- KHÔNG đụng listening level khác (A1–C1) hay skill khác (reading/writing/speaking/vocabulary/grammar) — trừ khi scan chứng minh cùng lỗi (mở spec riêng).
- KHÔNG tự render/replace file audio MP3 (chỉ đánh dấu cần re-record; pipeline audio do Speech/Audio Engineer).
- KHÔNG giữ câu hỏi cũ (gắn transcript lỗi) — answer cũ KHÔNG bảo toàn.
- KHÔNG sửa generator gốc (mở ticket riêng cho AI/LLM Engineer + CTO để không tái sinh transcript trùng/lệch).

## Glossary

- **Duplicated_Transcript**: transcript của một file là bản sao verbatim (overlap ≈ 1.0 sau chuẩn hoá, bỏ nhãn narrator) lời thoại của file khác (mẫu N ↔ N+10).
- **Topic_Mismatch**: `topic`/`title`/`learningOutcomes` của file khai một chủ đề nhưng `transcript` nói chủ đề khác.
- **Fake_Segment_Structure**: transcript khai "N Sendungen/Gespräche" + nhãn nhưng thực chất chỉ là một số ít đoạn văn lặp vòng (dupRatio nội bộ cao), không phải N đoạn khác nhau.
- **Real_Transcript**: transcript C2 mới đúng `topic`/`title`/`teil`/`task_type`, register học thuật C2, gồm các đoạn/hội thoại **khác nhau thật**, không lặp vòng, không trùng file khác.
- **Question_Set**: bộ câu hỏi mới của file khớp Real_Transcript: `statement`/`options`, `answer`, `explanation.{key_evidence, de, vi}` grounded trong transcript mới; `key_evidence` trích đúng từ transcript.
- **Academic_Signoff**: German Academic Lead duyệt Real_Transcript + Question_Set đúng chủ đề + đúng ngữ pháp + đúng C2 + đúng định dạng Teil.
- **Audio_Restubbing**: đánh dấu file cần lồng tiếng lại (transcript đã đổi ⇒ MP3 cũ lệch); việc render audio thuộc stream Speech/Audio Engineer, ngoài phạm vi sửa nội dung.
- **Content_QA_Gate**: `pnpm qa:content` — baseline 0 lỗi.

## Requirements

### Requirement 1: Loại bỏ transcript nhân bản giữa các ID

**User Story:** As a German Content Writer, I want mỗi file C2 listening có transcript riêng biệt, so that học viên không gặp lại đúng bài nghe ở hai ID khác nhau.

#### Acceptance Criteria

1. WHEN spec đóng, THE không cặp file nào trong 52 file C2 listening SHALL có overlap transcript (chuẩn hoá, bỏ nhãn narrator) ≥ 0.5.
2. THE block GOETHE-011…018 SHALL có transcript nội dung khác hẳn block 001…008 (không còn mẫu N ↔ N+10 copy).
3. IF scanner phát hiện cặp overlap ≥ 0.5 còn lại, THEN spec SHALL không được tag Done.

### Requirement 2: Transcript khớp chủ đề khai báo

**User Story:** As a German Academic Lead, I want transcript mỗi file đúng `topic`/`title` của file, so that học viên nghe đúng nội dung được hứa.

#### Acceptance Criteria

1. WHEN spec đóng, THE `transcript` của mỗi file SHALL nói đúng `topic` + `title` + `learningOutcomes` đã khai của file đó.
2. THE 29 file Topic_Mismatch (gồm 013-T1 "Reformpädagogik", 011-* "Künstlerische Authentizität", 012-* "Biotechnologie", 014-* "Minimalismus", 015-* "Architektur/Gedächtnis", 016-* "Digitale Souveränität", 017-* "Translationswissenschaft", 018-T1 "Whistleblowing", 002-* "Studentenwohnungsnot", 005-* "Wärmeinseleffekt", 006-* "Einrichtungsstile", 001-T2 "Textilrecycling") SHALL có transcript đúng chủ đề khai báo.
3. IF còn file mà keyword chủ đề (`topic`/`title`) không xuất hiện trong transcript, THEN file đó SHALL bị Academic_Signoff từ chối.

### Requirement 3: Cấu trúc đề thi thật theo Teil (bỏ "N Sendungen" giả)

**User Story:** As a German Curriculum Designer, I want mỗi file theo đúng định dạng đề thi Goethe C2 của Teil tương ứng, so that học viên luyện đúng dạng thật.

#### Acceptance Criteria

1. WHERE file khai cấu trúc "N Sendungen/Gespräche" (vd `metadata.gespraech_count`, nhãn "Sendung 1…N"), THE transcript SHALL có đúng N đoạn/hội thoại **khác nhau thật** — HOẶC số đoạn khai báo SHALL được chỉnh cho khớp nội dung thật.
2. THE không file nào SHALL còn đoạn văn lặp vòng làm "Sendung/Gespräch" giả (dupRatio nội bộ giữa các đoạn dialogue < 0.2).
3. THE mỗi file SHALL giữ đúng `task_type` của Teil (vd Teil 1 = `ja_nein` Radiosendungen) và cấu trúc câu hỏi tương ứng.
4. THE câu hỏi mỗi file SHALL bám transcript (không lạc đề như "Die Person kommt aus Köln" trên monolog học thuật).

### Requirement 4: Bộ câu hỏi mới bám transcript, đáp án verify-được

**User Story:** As a Content QA / Linguistic Reviewer, I want câu hỏi mỗi file khớp transcript mới và đáp án trích được từ transcript, so that bài tập đo đúng nghe hiểu.

#### Acceptance Criteria

1. THE mỗi file SHALL có bộ câu hỏi mới với `statement`/`options`, `answer`, `explanation.{key_evidence, de, vi}`.
2. THE `answer` mỗi câu SHALL được hỗ trợ bởi `key_evidence` trích đúng (substring chuẩn hoá) từ transcript mới của chính file.
3. THE `key_evidence` SHALL KHÔNG là chuỗi filler tầm thường (vd chỉ "Die Berliner Mauer").
4. THE `explanation.vi` SHALL chính xác, tự nhiên, nêu vì sao đáp án đúng.

### Requirement 5: Bảo toàn schema + gate + đánh dấu audio + không lan ngoài phạm vi

**User Story:** As a Content QA / Linguistic Reviewer, I want chỉ 52 file C2 listening đổi và schema giữ nguyên, so that không phá gate và audio lệch được truy vết.

#### Acceptance Criteria

1. THE spec SHALL chỉ đụng 52 file C2 listening; mọi file listening level khác + skill khác SHALL byte-identical.
2. THE schema mỗi file (`id`, `level`, `teil`, `teil_name`, `task_type`, `topic`, `audio_file`, `metadata`, `questions[]`, `scoring`, `transcript`, `cefrAudit`, `learningOutcomes`) SHALL được giữ; chỉ giá trị `transcript`/`questions[]` (và `metadata.gespraech_count` nếu chỉnh số đoạn) thay.
3. WHEN transcript đổi, THE file SHALL được đánh dấu Audio_Restubbing (transcript status/note phản ánh cần re-record) để Speech/Audio Engineer xử lý MP3.
4. WHEN `pnpm qa:content` chạy sau spec, THE Content_QA_Gate SHALL exit 0; `tests/content-audit/*` SHALL xanh.
5. THE `cefrAudit` cũ (`verdict: aligned` sai) SHALL được cập nhật phản ánh trạng thái mới (pending re-audit hoặc aligned sau Academic_Signoff thật trên transcript mới).

### Requirement 6: Review gate + truy vết + chặn tái phát

**User Story:** As a Project Manager / Delivery Manager, I want mỗi file qua Academic_Signoff và nguyên nhân gốc được xử lý, so that transcript lỗi không lọt production và không tái sinh.

#### Acceptance Criteria

1. THE mỗi Real_Transcript + Question_Set SHALL qua Academic_Signoff trước khi coi là đạt.
2. THE công việc SHALL làm theo từng đơn vị review (theo lesson/Teil), mỗi đơn vị qua gate trước khi sang đơn vị kế.
3. WHEN hoàn tất, THE finding trong `cross-content-duplicate-scan.md` SHALL được đánh dấu resolved + tham chiếu commit.
4. THE nguyên nhân gốc (generator sinh transcript trùng/lệch chủ đề/cấu trúc giả) SHALL được ghi nhận thành ticket riêng cho AI/LLM Engineer + CTO.
5. IF còn file chưa qua Academic_Signoff, THEN file đó SHALL không được merge.
6. THE việc render lại audio MP3 cho transcript mới SHALL được giao Speech/Audio Engineer qua hạng mục Audio_Restubbing (ngoài phạm vi nội dung nhưng phải được truy vết).
