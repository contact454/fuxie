# Requirements Document

Vai chinh: German Content Writer
Vai phoi hop: German Academic Lead, Content QA / Linguistic Reviewer, AI / LLM Engineer

## Introduction

Đợt review Kiro-agent (cổng `fuxie-content-review-board`) phát hiện một **lỗi generator hệ thống** ở câu hỏi (stem) reading trình độ cao: pipeline sinh câu hỏi Teil "Kommentar verstehen" đã **ghép một khung câu hỏi generic với một mảnh sub-prompt thô**, tạo ra `stem` vừa **sai ngữ pháp tiếng Đức** vừa **lệch ý so với đáp án**. Ví dụ thật:

- `C2-T1-001` Q4: *"Welche epistemologische Position vertritt der Autor bezüglich **fordert Hart bezüglich** Recht und Moral?"*
- `C2-T1-001` Q8: *"Was lässt sich aus der kritischen Betrachtung von **Warum hält Hart die Trennung von** für die Gesamtthese ableiten?"*
- `B2-T2-003` Q4: *"Was könnte man dem Autor **bezüglich fordert der Autor bezüglich** der Fördermittelvergabe entgegen…"*

Quét READ-ONLY toàn bộ 1.282 câu reading (heuristic high-precision) cho thấy lỗi tập trung 100% ở **B2/C1/C2** (A1/A2/B1 sạch), khoảng **108 câu** dính cờ. Đây là nội dung **learner-facing**: học viên đọc câu hỏi sai ngữ pháp và không khớp đáp án. `qa:content` và metadata `cefrAudit: aligned/passed` KHÔNG bắt được (vì answer-key vẫn trỏ option hợp lệ).

Spec này regenerate các `stem` hỏng thành câu hỏi tiếng Đức **đúng ngữ pháp, mạch lạc, khớp đáp án + bằng chứng**, có German Academic Lead duyệt, giữ nguyên đáp án và mọi field khác. Kèm 2 finding phụ phát hiện cùng đợt: một số `key_evidence`/`explanation.de` dẫn bằng chứng sai (vd `C2-T1-001` Q3 trích câu về Kelsen cho câu hỏi về Radbruch), và lỗi từ vựng Đức trong text nguồn (vd `C2-T1-002`: "Die **intellectual** Debatten" → "intellektuellen").

Source-of-truth:

- `docs/content-quality/audit-2026-06/review-board/cefr-stem-worklist.csv` (danh sách câu bị cờ: file + item_id + level + type + stem).
- `docs/content-quality/audit-2026-06/review-board/kiro-pilot/c2-reading-findings.md` (mô tả lỗi + quy mô).
- `content/{b2,c1,c2}/reading/*.json` (target).
- `scripts/content-qa.ts` + `tests/content-audit/*` (gate giữ xanh).
- `scripts/content-german-lint.ts` (`qa:german-lint` — kiểm ngữ pháp Đức của stem mới khi có LanguageTool).

Phạm vi (in-scope):

- Regenerate `stem` của các câu reading bị cờ ở B2/C1/C2 (~108 câu) thành câu hỏi đúng ngữ pháp + khớp đáp án.
- Sửa các `key_evidence`/`explanation.de` dẫn bằng chứng SAI được phát hiện trong cùng câu (vd `C2-T1-001` Q3).
- Sửa lỗi từ vựng Đức trong text reading nguồn được phát hiện (vd "intellectual" → "intellektuellen").
- Giữ `qa:content` + `tests/content-audit/*` xanh; `qa:german-lint` không phát sinh lỗi ngữ pháp mới trên stem đã sửa.

Phạm vi (out-of-scope):

- KHÔNG đổi `answer`/`options` của bất kỳ câu nào (answer-key đã đúng — red-team xác nhận đáp án khớp).
- KHÔNG đụng A1/A2/B1 reading (đã sạch theo scan).
- KHÔNG đụng listening/vocabulary/grammar/writing/speaking.
- KHÔNG viết lại các stem vốn đã đúng (chỉ câu bị cờ + câu human reviewer xác nhận hỏng).
- KHÔNG sửa generator gốc trong spec này (ghi nhận để CTO/AI xử lý riêng); ở đây sửa dữ liệu đầu ra.

## Glossary

- **Broken_Stem**: `stem` của một reading question chứa dấu hiệu ghép-template (vd "bezüglich <động từ>", "von Warum/Worin/Worauf", nối đôi "über … über …", khung "… mit der Gesamtthese" lệch loại đáp án) → sai ngữ pháp và/hoặc lệch ý đáp án.
- **Clean_Stem**: `stem` tiếng Đức đúng ngữ pháp, một câu hỏi mạch lạc, khớp đúng đáp án (`answer`) và bằng chứng (`key_evidence`) của câu đó, đúng register C-level.
- **Worklist**: `cefr-stem-worklist.csv` — danh sách câu bị cờ (file + item_id), nguồn phạm vi.
- **Evidence_Mismatch**: `key_evidence`/`explanation.de` trích đoạn KHÔNG chứng minh `answer` của câu (vd trích nhầm nhân vật/luận điểm).
- **Academic_Signoff**: German Academic Lead xác nhận stem mới đúng ngữ pháp + đúng ý + đúng level.
- **Content_QA_Gate**: `pnpm qa:content` (`scripts/content-qa.ts`), baseline 0 lỗi.
- **German_Lint_Gate**: `pnpm qa:german-lint` (Tier-1) — kiểm chính tả/ngữ pháp Đức khi LanguageTool khả dụng.

## Requirements

### Requirement 1: Regenerate câu hỏi hỏng thành câu đúng ngữ pháp + khớp đáp án

**User Story:** As a German Content Writer, I want mọi Broken_Stem được viết lại thành Clean_Stem, so that học viên C-level đọc câu hỏi đúng tiếng Đức và đúng ý.

#### Acceptance Criteria

1. WHEN spec đóng, THE mỗi câu reading trong Worklist (B2/C1/C2) SHALL có `stem` là Clean_Stem (không còn dấu hiệu ghép-template).
2. THE Clean_Stem SHALL đúng ngữ pháp tiếng Đức, là MỘT câu hỏi mạch lạc, không chứa hai mệnh đề hỏi nối ẩu.
3. THE Clean_Stem SHALL khớp đúng `answer` hiện có và được hỗ trợ bởi `key_evidence` của câu (cùng đoạn text nguồn).
4. THE Clean_Stem SHALL đúng register C-level (học thuật) phù hợp file, không hạ cấp xuống câu hỏi A-level.
5. IF sau khi sửa, scan heuristic vẫn phát hiện câu bị cờ trong Worklist, THEN spec SHALL không được tag Done.

### Requirement 2: Sửa bằng chứng dẫn sai + lỗi từ vựng Đức phát hiện cùng đợt

**User Story:** As a Content QA / Linguistic Reviewer, I want các Evidence_Mismatch và lỗi từ Đức được sửa, so that lời giải thực sự justify đáp án và text nguồn không có lỗi.

#### Acceptance Criteria

1. WHERE một câu được sửa có Evidence_Mismatch (vd `C2-T1-001` Q3 trích câu về Kelsen cho câu hỏi về Radbruch), THE `key_evidence` và `explanation.de` SHALL được sửa để trích đúng đoạn chứng minh `answer`.
2. WHERE text reading nguồn chứa lỗi từ vựng/chính tả tiếng Đức được phát hiện (vd `C2-T1-002`: "intellectual" → "intellektuellen"), THE lỗi đó SHALL được sửa.
3. THE việc sửa `key_evidence`/`explanation.de`/text SHALL KHÔNG đổi `answer`/`options`.

### Requirement 3: Bảo toàn đáp án + nội dung ngoài phạm vi

**User Story:** As a German Academic Lead, I want chỉ stem/evidence/lỗi-từ thay đổi, so that answer-key và phần đã đúng không bị ảnh hưởng.

#### Acceptance Criteria

1. THE spec SHALL KHÔNG đổi `answer`/`options`/`correctIndex` của bất kỳ câu nào.
2. THE spec SHALL chỉ đụng các file `content/{b2,c1,c2}/reading/*.json` có câu trong Worklist (cộng các câu human reviewer xác nhận hỏng thêm trong cùng file).
3. THE spec SHALL KHÔNG đụng A1/A2/B1 reading, listening, vocabulary, grammar, writing, speaking.
4. WHEN `pnpm qa:content` chạy sau spec, THE Content_QA_Gate SHALL exit 0.
5. WHEN `tests/content-audit/*` chạy sau spec, THE test SHALL giữ xanh (đặc biệt answer-integrity / read-only-invariant cập nhật baseline có chủ đích nếu cần).

### Requirement 4: Review gate + truy vết

**User Story:** As a Project Manager / Delivery Manager, I want stem mới qua Academic_Signoff và truy vết về Worklist, so that chất lượng được kiểm soát.

#### Acceptance Criteria

1. THE mỗi stem mới SHALL qua Academic_Signoff (German Academic Lead) trước khi coi là đạt.
2. THE công việc SHALL batch theo level (b2 → c1 → c2) hoặc theo file, mỗi batch qua gate trước khi sang batch kế.
3. WHERE dùng script hỗ trợ regenerate, THE script SHALL có `--dry-run` + diff review và chỉ ghi `stem`/`key_evidence`/`explanation.de`/`article.text` của câu trong phạm vi.
4. WHEN hoàn tất, THE `cefr-stem-worklist.csv` SHALL được cập nhật trạng thái (resolved) hoặc finding đóng trong `c2-reading-findings.md`.
5. IF còn câu chưa qua Academic_Signoff, THEN batch đó SHALL không được merge.
