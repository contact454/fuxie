# Requirements Document

Vai chinh: German Content Writer
Vai phoi hop: German Academic Lead, German Curriculum Designer, Content QA / Linguistic Reviewer, Speech / Audio Engineer

## Introduction

Đợt đánh giá Kiro-agent (cổng `fuxie-content-review-board`, audit 2026-06) đã quét sâu **toàn bộ 196 file listening** trên 4 level (B1/B2/C1/C2, `L-{LEVEL}-GOETHE-*`, các Teil) bằng phép đo overlap thật (cửa sổ 60 ký tự chuẩn hoá, bỏ nhãn narrator) + dupRatio nội bộ + đối chiếu topic↔transcript. Kết quả xác nhận **cùng một cụm bug generator hệ thống** lan cả 4 level, mức độ khác nhau:

| Level | Files | Cặp transcript trùng ~exact (≥0.95) | File dính overlap | Topic↔transcript lệch | Lặp vòng nội bộ (cấu trúc giả) |
| --- | --- | --- | --- | --- | --- |
| **B1** | 44 | 4 (`001-T{1..4} ≡ 011-T{1..4}`) | 8 | 14 | 0 |
| **B2** | 48 | 8 (`001≡011`, `002≡012`, cả 4 Teil) | 16 | 11 | 0 |
| **C1** | 52 | 0 (8 cặp overlap 0.5–0.95 một phần) | 16 | 7 | 0 |
| **C2** | 52 | 22 (`001..008 ≡ 011..018`) | 44 | 29 | **52** |

Ba lớp lỗi (mức độ tuỳ level):

- **A. Transcript nhân bản verbatim giữa các ID** (mẫu N ↔ N+10): block lesson sau là bản sao lời thoại block lesson đầu. Học viên gặp lại đúng bài nghe ở 2 ID. Nặng nhất ở C2 (8 lesson), gọn hơn ở B1/B2 (1–2 lesson), một phần ở C1.
- **B. Topic/title không khớp transcript**: `topic`/`title`/`learningOutcomes` khai một chủ đề nhưng `transcript` nói chủ đề khác (vd C2-013-T1 khai "Reformpädagogik" nhưng transcript là "Berliner Mauer"). Lan cả 4 level (B1: 14, B2: 11, C1: 7, C2: 29).
- **C. Cấu trúc "N Sendungen/Gespräche" giả**: transcript khai N đoạn + nhãn nhưng thực chất là vài đoạn lặp vòng. Hiện chỉ đo thấy rõ ở C2 (52/52 file) — B1/B2/C1 cần xác minh đọc.

Hệ quả: bài nghe trùng nội dung giữa các ID, hoặc nội dung không khớp chủ đề được hứa, hoặc luyện cấu trúc đề thi giả. Không thể ship. Metadata `cefrAudit.verdict = "aligned"` ở các file này **sai** vì audit chỉ rà metadata, không đọc transcript.

Spec này **gom việc regenerate listening cho cả 4 level** (B1/B2/C1/C2) — thay spec cũ `content-c2-listening-regeneration` (chỉ C2) vì cùng một bug generator nên xử lý thống nhất hiệu quả hơn. Mỗi file lỗi: viết transcript thật đúng `topic`/`title`/`teil`/`task_type`, các đoạn/hội thoại khác nhau thật (không lặp, không copy chéo ID), bộ câu hỏi mới bám transcript, có German Academic Lead duyệt, đánh dấu cần re-record audio.

Source-of-truth:

- `docs/content-quality/audit-2026-06/review-board/kiro-pilot/cross-content-duplicate-scan.md` (phát hiện + số liệu scan 196 file listening + 1.187 file toàn corpus).
- `scripts/scan-content-placeholders.ts` (scanner READ-ONLY tái dùng; sẽ bổ sung scan listening overlap chính thức).
- `content/{b1,b2,c1,c2}/listening/L-*-GOETHE-*.json` (196 file target + schema hiện hữu).
- `.kiro/specs/content-c2-placeholder-regeneration/` (mẫu spec + apply-script + cổng đã làm cho reading).
- `docs/content-quality/cefr-audit-checklist.md` (listening: level fit, câu hỏi bám transcript).
- `scripts/content-qa.ts` + `tests/content-audit/*` (gate giữ xanh).

Phạm vi (in-scope):

- Sinh lại `transcript` thật cho các file listening **lỗi** ở B1/B2/C1/C2, đúng `topic`/`title`/`teil`/`task_type`, đúng register từng level, các đoạn khác nhau thật (không lặp, không copy chéo ID).
- Sinh lại câu hỏi mỗi file lỗi bám transcript mới (`statement`/`options` + `answer` + `key_evidence` + `explanation.de` + `explanation.vi`).
- Bỏ cấu trúc "N Sendungen/Gespräche" giả (chủ yếu C2) → tạo N đoạn khác nhau thật hoặc chỉnh số đoạn cho khớp.
- Đánh dấu transcript đã đổi là cần re-record (audio MP3 do Speech/Audio Engineer xử lý stream riêng); Academic_Signoff từng file.
- Giữ `qa:content` + PBT xanh.

Phạm vi (out-of-scope):

- KHÔNG đụng listening A1/A2 (scan sạch theo phép đo) hay skill khác (reading/writing/speaking/vocabulary/grammar) — reading C2 Teil 2 + các cụm khác xử lý ở spec riêng.
- KHÔNG tự render/replace file audio MP3 (chỉ đánh dấu cần re-record).
- KHÔNG giữ câu hỏi cũ (gắn transcript lỗi).
- KHÔNG sửa generator gốc (ticket riêng cho AI/LLM Engineer + CTO).

## Glossary

- **Duplicated_Transcript**: transcript là bản sao verbatim (overlap ≥ 0.95 sau chuẩn hoá, bỏ nhãn narrator) lời thoại file khác (mẫu N ↔ N+10).
- **Partial_Overlap_Transcript**: overlap 0.5–0.95 với file khác (C1 chủ yếu) — cần đọc xác nhận.
- **Topic_Mismatch**: `topic`/`title`/`learningOutcomes` khai chủ đề khác với `transcript`.
- **Fake_Segment_Structure**: transcript khai "N Sendungen/Gespräche" nhưng chỉ là vài đoạn lặp vòng (dupRatio nội bộ cao).
- **Real_Transcript**: transcript mới đúng `topic`/`title`/`teil`/`task_type`, register đúng level, các đoạn khác nhau thật, không lặp/không trùng chéo.
- **Question_Set**: bộ câu hỏi mới bám Real_Transcript; `answer` hợp `task_type`, `key_evidence` trích đúng từ transcript mới.
- **Academic_Signoff**: German Academic Lead duyệt Real_Transcript + Question_Set đúng chủ đề + ngữ pháp + level + định dạng Teil.
- **Audio_Restubbing**: đánh dấu file cần lồng tiếng lại; render MP3 thuộc stream Speech/Audio Engineer.
- **Defective_File**: file listening dính ≥1 trong: Duplicated_Transcript, Partial_Overlap_Transcript, Topic_Mismatch, Fake_Segment_Structure.
- **Content_QA_Gate**: `pnpm qa:content` — baseline 0 lỗi.

## Requirements

### Requirement 1: Loại bỏ transcript nhân bản giữa các ID (mọi level)

**User Story:** As a German Content Writer, I want mỗi file listening có transcript riêng biệt trong cùng level, so that học viên không gặp lại đúng bài nghe ở hai ID.

#### Acceptance Criteria

1. WHEN spec đóng, THE không cặp file nào trong cùng một level (B1/B2/C1/C2) listening SHALL có overlap transcript (chuẩn hoá, bỏ nhãn narrator) ≥ 0.5.
2. THE các block bị copy (`B1: 011`, `B2: 011/012`, `C2: 011..018`) SHALL có transcript khác hẳn block nguồn (`001`, `001/002`, `001..008`).
3. THE các cặp partial-overlap C1 (0.5–0.95) SHALL được đọc xác minh; nếu trùng nội dung học → viết lại để overlap < 0.5.
4. IF scanner phát hiện cặp overlap ≥ 0.5 còn lại trong bất kỳ level nào, THEN spec SHALL không được tag Done.

### Requirement 2: Transcript khớp chủ đề khai báo (mọi level)

**User Story:** As a German Academic Lead, I want transcript mỗi file đúng `topic`/`title`, so that học viên nghe đúng nội dung được hứa.

#### Acceptance Criteria

1. WHEN spec đóng, THE `transcript` mỗi file SHALL nói đúng `topic` + `title` + `learningOutcomes` đã khai.
2. THE toàn bộ file Topic_Mismatch đã phát hiện (B1: 14, B2: 11, C1: 7, C2: 29) SHALL có transcript đúng chủ đề khai báo.
3. IF còn file mà keyword chủ đề (`topic`/`title`) không xuất hiện trong transcript, THEN file đó SHALL bị Academic_Signoff từ chối.

### Requirement 3: Cấu trúc đề thi thật theo Teil (bỏ "N Sendungen" giả)

**User Story:** As a German Curriculum Designer, I want mỗi file theo đúng định dạng đề thi Goethe của level + Teil tương ứng, so that học viên luyện đúng dạng thật.

#### Acceptance Criteria

1. WHERE file khai cấu trúc "N Sendungen/Gespräche", THE transcript SHALL có đúng N đoạn/hội thoại khác nhau thật — HOẶC số đoạn khai báo SHALL được chỉnh cho khớp nội dung thật.
2. THE không file nào SHALL còn đoạn lặp vòng làm "Sendung/Gespräch" giả (dupRatio nội bộ giữa các đoạn dialogue < 0.2).
3. THE mỗi file SHALL giữ đúng `task_type` + cấu trúc câu hỏi của level + Teil tương ứng.
4. THE câu hỏi mỗi file SHALL bám transcript (không lạc đề).

### Requirement 4: Bộ câu hỏi mới bám transcript, đáp án verify-được

**User Story:** As a Content QA / Linguistic Reviewer, I want câu hỏi mỗi file khớp transcript mới và đáp án trích được từ transcript, so that bài tập đo đúng nghe hiểu.

#### Acceptance Criteria

1. THE mỗi file lỗi SHALL có bộ câu hỏi mới với `statement`/`options`, `answer`, `explanation.{key_evidence, de, vi}`.
2. THE `answer` mỗi câu SHALL được hỗ trợ bởi `key_evidence` trích đúng (substring chuẩn hoá) từ transcript mới của chính file.
3. THE `key_evidence` SHALL KHÔNG là chuỗi filler tầm thường.
4. THE `explanation.vi` SHALL chính xác, tự nhiên, nêu vì sao đáp án đúng.

### Requirement 5: Bảo toàn schema + gate + đánh dấu audio + không lan ngoài phạm vi

**User Story:** As a Content QA / Linguistic Reviewer, I want chỉ file listening lỗi đổi và schema giữ nguyên, so that không phá gate và audio lệch được truy vết.

#### Acceptance Criteria

1. THE spec SHALL chỉ đụng file listening B1/B2/C1/C2 thuộc danh sách Defective_File; listening A1/A2 + skill khác SHALL byte-identical.
2. THE schema mỗi file (`id`, `level`, `teil`, `teil_name`, `task_type`, `topic`, `audio_file`, `metadata`, `questions[]`, `scoring`, `transcript`, `cefrAudit`, `learningOutcomes`) SHALL được giữ; chỉ giá trị `transcript`/`questions[]` (và `metadata` số đoạn nếu chỉnh) thay.
3. WHEN transcript đổi, THE file SHALL được đánh dấu Audio_Restubbing để Speech/Audio Engineer render MP3.
4. WHEN `pnpm qa:content` chạy sau spec, THE Content_QA_Gate SHALL exit 0; `tests/content-audit/*` SHALL xanh.
5. THE `cefrAudit` cũ (`verdict: aligned` sai) SHALL được cập nhật phản ánh trạng thái mới (pending re-audit / aligned sau Academic_Signoff thật).

### Requirement 6: Review gate + truy vết + chặn tái phát

**User Story:** As a Project Manager / Delivery Manager, I want mỗi file qua Academic_Signoff và nguyên nhân gốc được xử lý, so that transcript lỗi không lọt production và không tái sinh.

#### Acceptance Criteria

1. THE mỗi Real_Transcript + Question_Set SHALL qua Academic_Signoff trước khi coi là đạt.
2. THE công việc SHALL làm theo từng đơn vị review (theo level → lesson/Teil), mỗi đơn vị qua gate trước khi sang đơn vị kế.
3. WHEN hoàn tất, THE finding trong `cross-content-duplicate-scan.md` SHALL được đánh dấu resolved + tham chiếu commit.
4. THE nguyên nhân gốc (generator sinh transcript trùng/lệch/cấu trúc giả) SHALL được ghi nhận thành ticket riêng cho AI/LLM Engineer + CTO.
5. IF còn file chưa qua Academic_Signoff, THEN file đó SHALL không được merge.
6. THE việc render lại audio MP3 cho transcript mới SHALL được giao Speech/Audio Engineer qua hạng mục Audio_Restubbing (ngoài phạm vi nội dung nhưng phải được truy vết).

### Requirement 7: Xác minh đọc trực tiếp trước khi cố định phạm vi mỗi level

**User Story:** As a Content QA / Linguistic Reviewer, I want danh sách Defective_File mỗi level được xác minh bằng đọc trực tiếp (không chỉ tin số đo overlap), so that không sửa nhầm hoặc bỏ sót.

#### Acceptance Criteria

1. WHILE bắt đầu mỗi level, THE đội SHALL đọc trực tiếp mẫu các cặp ~exact + partial + topic-mismatch để xác nhận defect thật (như đã làm với C2-003/013).
2. THE danh sách Defective_File cuối cùng mỗi level SHALL được chốt sau xác minh đọc, KHÔNG chỉ dựa số đo overlap xấp xỉ.
3. IF một cặp partial-overlap (C1) thực chất đủ khác biệt khi đọc, THEN file đó SHALL được loại khỏi danh sách sửa (tránh sửa nhầm nội dung hợp lệ).
