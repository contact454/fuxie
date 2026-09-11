# Requirements Document

Vai chinh: German Content Writer
Vai phoi hop: Vietnamese-German Localization Specialist, German Academic Lead

## Introduction

Đợt audit `fuxie-content-quality-audit` (`docs/content-quality/audit-2026-06/`) đã ghi nhận backlog `RB-P2-02`: **100% `explanation.vi` của reading questions ở cả 6 level (1,282 item) là template boilerplate** — chuỗi cố định "Đáp án đúng là X. Hãy đối chiếu với thông tin then chốt trong bài đọc." — KHÔNG nêu bằng chứng cụ thể tại sao đáp án đúng. Trái lại, listening explanations đã cụ thể (không bị flag). Đây là vấn đề **giá trị sư phạm** (D3): learner đọc giải thích không học được gì.

Điều tra dữ liệu cho thấy hai nhóm rõ rệt (đo tại baseline audit):

- **698 question có `explanation.de` GIÀU** (lập luận cụ thể + `key_evidence` trích từ text). Với nhóm này, sửa = **dịch `de` → `vi` tự nhiên** (Vietnamese-German Localization Specialist chủ công), không cần viết lại tiếng Đức.
- **582 question có `explanation.de` TEMPLATED** (dạng "Die richtige Antwort ist b: …" — chỉ lặp đáp án + trích text, không lập luận). Với nhóm này, **German Content Writer phải viết lại lập luận `de` thật trước**, rồi mới dịch sang `vi`.
- **2 question có `explanation.de` rỗng/quá ngắn** → viết mới cả `de` lẫn `vi`.

Spec này là **spec remediation thứ ba** từ audit (sau `content-genus-enum-fix` P0 và `vocab-wordtype-enum-reconcile` P1). Mục tiêu: thay 1,282 `explanation.vi` boilerplate bằng giải thích tiếng Việt cụ thể (nêu bằng chứng + lý do), giữ đáp án và mọi field khác nguyên vẹn. Đây là khối lượng lớn nên cần batch theo level + sign-off học thuật.

Phạm vi (in-scope):

- Thay `explanation.vi` của **1,282 reading question** (a1=150, a2=200, b1=250, b2=250, c1=168, c2=264) từ boilerplate sang giải thích cụ thể.
- Với 582 question có `explanation.de` templated: viết lại `explanation.de` thành lập luận thật trước khi dịch.
- Với 2 question `de` rỗng: viết mới `de` + `vi`.
- Giữ `pnpm qa:content` xanh và 4 PBT `tests/content-audit/*.spec.ts` xanh.
- Đóng finding `RB-P2-02` (`F-2001`…`F-2006`).

Phạm vi (out-of-scope):

- KHÔNG đổi `answer` / `correctIndex` / đáp án của bất kỳ question nào (answer integrity audit đã xác nhận sạch).
- KHÔNG đổi `options` / `statement` / `stem` / `question` / text bài đọc.
- KHÔNG đụng listening explanations (đã cụ thể, không bị flag).
- KHÔNG đổi schema, không đổi `key_evidence` đã đúng (chỉ bổ sung nếu thiếu).
- KHÔNG đụng `explanation.de` đã GIÀU (698 question — chỉ dịch sang vi).
- KHÔNG đổi vocabulary/grammar/writing/speaking/course.

Source-of-truth:

- `docs/content-quality/audit-2026-06/findings.csv` (`F-2001`…`F-2006`) + `remediation-backlog.md` (`RB-P2-02`).
- `docs/content-quality/audit-2026-06/` traceability (full item list trong `tmp/findings-d3-trace.json` của đợt audit).
- `content/<level>/reading/*.json` (target).
- `docs/content-quality/bilingual-style-guide.md` (chuẩn dịch VI).
- `docs/content-quality/cefr-audit-checklist.md` (Reading: "question answer is supported by text evidence").
- `scripts/content-qa.ts` + `tests/content-audit/*.spec.ts` (gate giữ xanh).

## Glossary

- **Reading_Question**: Một entry trong `questions[]` của file `content/<level>/reading/*.json` (không phải `.qa.json` sidecar). Có trường đáp án (`answer`/`correctIndex`) và `explanation`.
- **Boilerplate_Vi**: Giá trị `explanation.vi` khớp một trong các template chung: bắt đầu "Đáp án đúng là …" và kết thúc "Hãy đối chiếu với thông tin then chốt trong bài (đọc|nghe)." — không nêu bằng chứng cụ thể.
- **Specific_Vi**: Giá trị `explanation.vi` mới: nêu rõ (a) bằng chứng từ text (paraphrase `key_evidence`), (b) lý do đáp án đúng (và vì sao đáp án sai bị loại nếu áp dụng), bằng tiếng Việt tự nhiên, KHÔNG dùng template.
- **Rich_De**: `explanation.de` chứa lập luận cụ thể (≥ 15 ký tự, KHÔNG bắt đầu "Die richtige Antwort ist"). 698 question.
- **Templated_De**: `explanation.de` dạng "Die richtige Antwort ist X: … Die relevante Textstelle lautet: …" — chỉ lặp đáp án. 582 question.
- **Thin_De**: `explanation.de` rỗng hoặc < 15 ký tự. 2 question.
- **Translation_Review**: Quy trình Vietnamese-German Localization Specialist (chính cho dịch) review `Specific_Vi`: nghĩa bảo toàn, tiếng Việt tự nhiên, không false friend, đúng tone learner.
- **Academic_Signoff**: German Academic Lead xác nhận `explanation.de` mới (cho Templated_De/Thin_De) đúng ngữ pháp + đúng lập luận + đúng level CEFR.
- **Content_QA_Gate**: `pnpm qa:content` (`scripts/content-qa.ts`). Baseline 0 lỗi.
- **Audit_PBT**: 4 spec `tests/content-audit/*.spec.ts` (read-only invariant, coverage, evidence-gate, severity). Phải giữ xanh.

## Requirements

### Requirement 1: Thay boilerplate `explanation.vi` bằng giải thích cụ thể

**User Story:** As a German Content Writer, I want mọi `explanation.vi` của reading question nêu bằng chứng + lý do cụ thể, so that learner hiểu tại sao đáp án đúng thay vì đọc câu chung chung.

#### Acceptance Criteria

1. WHEN spec này đóng, THE mỗi Reading_Question SHALL có `explanation.vi` là Specific_Vi (KHÔNG còn khớp mẫu Boilerplate_Vi).
2. THE Specific_Vi của mỗi question SHALL tham chiếu bằng chứng cụ thể từ text (paraphrase hoặc trích `key_evidence`), KHÔNG dùng cụm "Hãy đối chiếu với thông tin then chốt trong bài đọc" như toàn bộ nội dung.
3. WHERE question có nhiều lựa chọn (`options`), THE Specific_Vi SHOULD nêu ngắn gọn vì sao đáp án đúng đúng (và nếu hữu ích, vì sao distractor chính bị loại).
4. THE Specific_Vi SHALL là tiếng Việt tự nhiên theo `docs/content-quality/bilingual-style-guide.md`, không mojibake, không chèn nguyên câu tiếng Đức (trừ trích dẫn ngắn có chủ đích trong dấu nháy).
5. THE số Reading_Question được sửa SHALL bằng đúng 1,282 (a1=150, a2=200, b1=250, b2=250, c1=168, c2=264); không bỏ sót level nào.
6. IF sau khi sửa, một scan phát hiện còn Reading_Question có Boilerplate_Vi, THEN spec SHALL không được tag Done.

### Requirement 2: Viết lại `explanation.de` cho nhóm Templated/Thin trước khi dịch

**User Story:** As a German Academic Lead, I want `explanation.de` templated/thin được viết lại thành lập luận thật, so that bản dịch tiếng Việt dựa trên giải thích Đức có giá trị chứ không nhân bản template.

#### Acceptance Criteria

1. WHERE Reading_Question thuộc nhóm Templated_De (582 question), THE `explanation.de` SHALL được viết lại thành lập luận cụ thể (nêu bằng chứng + lý do), KHÔNG còn bắt đầu bằng "Die richtige Antwort ist …" như toàn bộ nội dung.
2. WHERE Reading_Question thuộc nhóm Thin_De (2 question), THE `explanation.de` SHALL được viết mới (≥ 15 ký tự, có lập luận).
3. THE `explanation.de` mới SHALL đúng ngữ pháp tiếng Đức, tự nhiên, và phù hợp level CEFR của file (Academic_Signoff).
4. WHERE Reading_Question thuộc nhóm Rich_De (698 question), THE `explanation.de` SHALL được GIỮ NGUYÊN (chỉ dịch sang `vi`), trừ khi Academic Lead phát hiện lỗi.
5. THE `explanation.de` mới SHALL giữ/bổ sung `key_evidence` trích đúng từ text bài đọc (Reading rubric: answer supported by text evidence).

### Requirement 3: Bảo toàn đáp án và nội dung ngoài explanation

**User Story:** As a Content QA / Linguistic Reviewer, I want chỉ trường explanation thay đổi, so that answer integrity và nội dung bài đọc không bị ảnh hưởng.

#### Acceptance Criteria

1. THE spec này SHALL KHÔNG đổi `answer`, `correctIndex`, `correct`, hay `solution` của bất kỳ Reading_Question nào.
2. THE spec này SHALL KHÔNG đổi `options`, `statement`, `stem`, `question`, `texts`, `images`, `scoring`, hay metadata của file reading.
3. THE spec này SHALL KHÔNG đụng file dưới `content/<level>/{listening,vocabulary,grammar,speaking,writing}/` hay `course.json`.
4. THE spec này SHALL chỉ thay đổi trường `explanation.vi` (và `explanation.de` + `explanation.key_evidence` cho nhóm Templated/Thin) của reading question.
5. WHEN `pnpm qa:content` chạy sau spec, THE Content_QA_Gate SHALL exit 0 (không regress baseline 0 lỗi).
6. WHEN 4 Audit_PBT chạy sau spec, THE test SHALL giữ xanh; đặc biệt coverage vẫn = 1194 file và read-only-invariant test phản ánh thay đổi explanation là có chủ đích (cập nhật baseline hash nếu cần).

### Requirement 4: Batch theo level + review gate

**User Story:** As a Project Manager / Delivery Manager, I want công việc 1,282 item được batch theo level và có review gate, so that khối lượng lớn được kiểm soát chất lượng và truy vết.

#### Acceptance Criteria

1. THE công việc SHALL được chia batch theo level (a1 → a2 → b1 → b2 → c1 → c2), mỗi level là một đơn vị review độc lập.
2. THE mỗi batch level SHALL qua Translation_Review (Localization Specialist) cho `vi`, và Academic_Signoff (German Academic Lead) cho `de` mới (nếu có).
3. THE PR/commit của mỗi batch SHALL ghi rõ: số question sửa, số `de` viết lại, reviewer sign-off.
4. IF một batch level chưa qua review, THEN batch đó SHALL không được merge.
5. THE thứ tự ưu tiên SHALL từ level thấp (a1) lên cao, vì learner đông nhất ở level đầu và rủi ro hiểu sai cao hơn.

### Requirement 5: Đóng finding & không regress audit

**User Story:** As a Content QA / Linguistic Reviewer, I want finding audit được đóng và đợt audit không bị regress, so that remediation truy vết về nguồn.

#### Acceptance Criteria

1. WHEN toàn bộ 6 batch đóng, THE finding `RB-P2-02` (`F-2001`…`F-2006`) SHALL được đánh dấu resolved trong `docs/content-quality/audit-2026-06/remediation-backlog.md`, kèm tham chiếu PR/commit mỗi level.
2. THE spec này SHALL KHÔNG sửa `scripts/content-qa.ts`, `tests/content-audit/*.spec.ts`, hay reading-content generator (sửa trực tiếp data hoặc qua script remediation có review).
3. WHERE dùng script hỗ trợ để batch-update `explanation.vi`/`explanation.de`, THE script SHALL chỉ ghi vào trường explanation của reading question và SHALL có dry-run + diff review trước khi áp dụng.
4. IF sau remediation, audit D3 chạy lại phát hiện reading explanation vẫn boilerplate, THEN spec SHALL không được tag Done.
5. THE listening explanations SHALL không bị spec này đụng tới (giữ nguyên).
