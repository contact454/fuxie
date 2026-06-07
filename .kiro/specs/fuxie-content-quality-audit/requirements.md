# Requirements Document

Vai chinh: Content QA / Linguistic Reviewer
Vai phoi hop: German Academic Lead, German Curriculum Designer, Vietnamese-German Localization Specialist, Exam Prep Specialist

## Introduction

Fuxie là nền tảng học tiếng Đức cho người Việt (CEFR A1–C2, song ngữ VI/DE). Toàn bộ nội dung học nằm dưới `content/<level>/<skill>/*.json` với `level ∈ {a1,a2,b1,b2,c1,c2}` và `skill ∈ {grammar, listening, reading, speaking, vocabulary, writing}`, cộng với `content/<level>/course.json` (modules, vocabularyThemes, grammarTopics, examTypes = GOETHE/TELC/ÖSD) và `content/<level>/grammar/grammar-topics.json`. Tổng đo được tại baseline: **1,194 file JSON** (1,188 file skill + 6 `course.json`).

Spec này là một **đợt kiểm duyệt CHỈ-AUDIT (read-only)** toàn diện mảng nội dung học. Mục tiêu duy nhất là **phát hiện, phân loại, và chứng cứ hóa** lỗi nội dung trên 9 chiều chất lượng (chính tả/ngữ pháp Đức, CEFR fit, sư phạm, dịch Việt, song ngữ/đầy đủ trường, nhất quán schema/toàn vẹn dữ liệu, audio/script, hợp lệ đề thi, độ phủ/cân bằng) và xuất ra một bộ deliverable có cấu trúc để chuẩn bị cho các spec remediation về sau. **Đợt này KHÔNG sửa bất kỳ file nội dung nào** trong `content/`.

Schema hiện KHÔNG đồng nhất — đây là một sự kiện cần audit, không phải lỗi cần sửa trong đợt này:

- `vocabulary` / `grammar` / `course.json` dùng **camelCase** (`meaningVi`, `titleDe`, `article = MASKULIN|FEMININ|NEUTRUM`, `wordType = NOMEN|VERB|...`).
- `reading` / `listening` dùng **snake_case** (`teil`, `teil_name`, `target_grammar`, `word_count`, `audio_file`, `questions[].type = richtig_falsch | mc_abc | ...`).
- `speaking` từng có field drift (A1: `textDe`/`textVi`/`pronunciationNotes`; A2+: `german`/`vietnamese`/`pronunciationTips`) — xem `CHANGELOG.md`.

Phạm vi (in-scope):

- Toàn bộ A1–C2 × 6 kỹ năng + `course.json` mỗi level + `grammar-topics.json` mỗi level.
- Tính hợp lệ cấu trúc đề thi (Goethe / Telc / ÖSD) cho item dạng thi.
- Quét toàn bộ; nếu dùng lấy mẫu (sampling) ở chiều review-sâu thì phải nêu rõ phương pháp + lý do trong báo cáo.
- Lớp tự động (Layer 1): chạy và nhúng kết quả các script QA hiện có; tham chiếu các báo cáo có sẵn.
- Lớp review-sâu (Layer 2): áp rubric Content QA + German Academic Lead lên nội dung thật.

Phạm vi (out-of-scope, đợt này):

- KHÔNG sửa, thêm, xóa, hay format lại bất kỳ file nào trong `content/`.
- KHÔNG đụng code, UI, asset, audio file.
- KHÔNG đổi schema (chỉ ghi nhận lỗi schema như finding, không migrate).
- KHÔNG sửa script QA (`scripts/content-qa.ts`, `scripts/check-locale-parity.ts`, `scripts/copy-style-audit.ts`, v.v.) — chỉ chạy nguyên trạng.
- Remediation (sửa lỗi) để dành cho các spec follow-up; spec này chỉ sinh backlog candidate.

Source-of-truth tài liệu và công cụ:

- Script QA có sẵn (định nghĩa trong `package.json`): `pnpm qa:content` (`scripts/content-qa.ts`), `pnpm check:locale-parity` (`scripts/check-locale-parity.ts`), `pnpm qa:copy-style` (`scripts/copy-style-audit.ts`), `pnpm qa:learning-quality` (`scripts/content-qa.ts` + `scripts/generate-content-quality-assets.ts`).
- Báo cáo có sẵn: `detailed_compounds_audit_report.md`, `qa_report.md`, `docs/content-quality/**`, `current_violations.txt` / `current_violations_utf8.txt`, `parity-violations.txt` / `parity-violations-utf8.txt`.
- Định nghĩa severity: `docs/intake/risk-register.md` § Risk Levels (P0/P1/P2).
- Tham chiếu pedagogy/CEFR: `docs/content-quality/cefr-audit-checklist.md`, `docs/content-quality/bilingual-style-guide.md`, `docs/content-quality/learning-outcome-map-report.md`.

## Glossary

- **Content_Item**: Một đơn vị nội dung được audit, định danh bằng cặp `(file_path, item_id)`. Với file chứa nhiều item (ví dụ `questions[]`, `words[]`), mỗi entry con là một Content_Item riêng; với file đơn (ví dụ một `reading` text task), file là một Content_Item. `course.json` và `grammar-topics.json` mỗi file là một Content_Item cấp metadata.
- **Audit_Universe**: Tập toàn bộ 1,194 file JSON dưới `content/`, gồm 1,188 file skill (6 level × 6 skill) + 6 `course.json`. Là phạm vi đếm cho coverage.
- **Audit_Dimension**: Một trong 9 chiều chất lượng được audit, đánh số D1–D9 (xem § Requirements 1–9).
- **Finding**: Một bản ghi lỗi/rủi ro được phát hiện, gồm tối thiểu `{finding_id, level, skill, file_path, item_id, dimension, severity, evidence, recommended_fix}`. Mỗi Finding SHALL evidence-gated (xem Evidence).
- **Evidence**: Chứng cứ cụ thể cho một Finding — gồm `file_path`, `item_id`, và một trích dẫn verbatim từ nội dung thật (hoặc dòng output script) đủ để người review tái lập mà không cần đoán.
- **Severity**: Mức độ nghiêm trọng theo `docs/intake/risk-register.md` § Risk Levels: **P0** = hại người học / sai đáp án / sai tiếng Đức; **P1** = lệch CEFR / dịch sai / thiếu field bắt buộc; **P2** = polish (không chặn).
- **Layer_1_Automated**: Bước chạy các script QA hiện có nguyên trạng và tổng hợp output, không sửa script. Gồm `pnpm qa:content`, `pnpm check:locale-parity`, `pnpm qa:copy-style`, `pnpm qa:learning-quality`.
- **Layer_2_Review**: Bước review-sâu bằng người/rubric trên nội dung thật, áp rubric Content QA + German Academic Lead, với mẫu đại diện mỗi skill/level + quét toàn bộ ở vùng rủi ro cao (đáp án, exam item, compound noun).
- **High_Risk_Zone**: Vùng nội dung phải quét 100% (không chỉ lấy mẫu): trường đáp án (`answer`, `correctIndex`, `correct`, `solution`), item dạng đề thi (Goethe/Telc/ÖSD), compound noun tiếng Đức, và mọi trường learner-facing chứa đáp án/giải thích.
- **Sampling_Method**: Phương pháp lấy mẫu cho Layer_2_Review khi không quét 100% một chiều — phải ghi rõ kích thước mẫu, cách chọn (ngẫu nhiên/phân tầng theo level×skill), và lý do.
- **Mojibake**: Lỗi encoding làm ký tự Việt/Đức (dấu, umlaut, ß) hiển thị sai (ví dụ `Ã¼` thay cho `ü`). Phát hiện qua `pnpm qa:copy-style` và quét thủ công.
- **Locale_Parity**: Tính đầy đủ song ngữ — mọi trường learner-facing cần cả DE và VI đều có đủ cả hai, không thiếu một phía. Đo một phần qua `pnpm check:locale-parity` (cho UI messages) và qua review trường nội dung (`meaningVi`, `exampleTranslation*`, `explanation.de`/`explanation.vi`).
- **Orphan_Reference**: Một tham chiếu trong `course.json` hoặc `grammar-topics.json` (module/theme/topic/examType) trỏ tới một id hoặc file không tồn tại trong `content/`; hoặc một `audio_file` path không tồn tại trên đĩa.
- **Exam_Validity**: Tính khớp giữa cấu trúc Teil + rubric của một exam-style item và đặc tả thật của Goethe/Telc/ÖSD cho level tương ứng.
- **Coverage_Matrix**: Ma trận `level × skill` ghi số Content_Item đã audit và số Finding theo từng ô.
- **Remediation_Backlog**: Danh sách nhóm Finding ưu tiên theo severity; mỗi nhóm là một candidate fix-spec về sau.
- **Audit_Output_Dir**: Thư mục `docs/content-quality/audit-2026-06/` chứa toàn bộ deliverable của spec này.
- **Read_Only_Invariant**: Ràng buộc bất biến rằng không file nào dưới `content/` bị thay đổi nội dung (mtime/hash giữ nguyên) trong suốt và sau đợt audit.

## Requirements

### Requirement 1: D1 — Chính tả & ngữ pháp tiếng Đức

**User Story:** As a Content QA / Linguistic Reviewer, I want mọi lỗi chính tả và ngữ pháp tiếng Đức trong nội dung được phát hiện và chứng cứ hóa, so that learner không học phải tiếng Đức sai.

#### Acceptance Criteria

1. WHEN auditor quét một Content_Item chứa text tiếng Đức, THE Audit SHALL kiểm các lớp lỗi: ß/umlaut (ä/ö/ü/ß), viết hoa danh từ (Nomen luôn viết hoa), Genus & quán từ (`article` khớp danh từ), số nhiều (`plural`), chia động từ, Kasus (Nominativ/Akkusativ/Dativ/Genitiv), và trật tự từ.
2. WHEN một danh từ trong skill `vocabulary` có `article` không khớp với Genus chuẩn của danh từ đó (ví dụ `article = MASKULIN` cho một danh từ giống cái), THE Audit SHALL ghi một Finding với `dimension = D1`, `severity = P0`, và Evidence gồm `file_path`, `item_id` (word), trích dẫn `word` + `article` thật.
3. WHEN một text tiếng Đức chứa lỗi chính tả ß/umlaut (ví dụ `Strasse` nơi cần `Straße`, hoặc `uber` nơi cần `über`) mà không phải biến thể chính tả Thụy Sĩ hợp lệ có chủ đích, THE Audit SHALL ghi một Finding với `dimension = D1` và `severity` ∈ {P0, P1} tùy mức ảnh hưởng tới người học.
4. WHERE một danh từ tiếng Đức xuất hiện trong text learner-facing nhưng được viết thường (không viết hoa), THE Audit SHALL ghi Finding D1 với Evidence là câu chứa danh từ đó.
5. THE Audit SHALL quét 100% trường đáp án và giải thích tiếng Đức (High_Risk_Zone) cho lỗi D1, không lấy mẫu ở vùng này.
6. IF auditor không chắc một cấu trúc tiếng Đức là lỗi hay biến thể hợp lệ, THEN THE Finding SHALL được đánh dấu cần German Academic Lead sign-off thay vì tự kết luận, và severity tạm gán theo nguyên tắc thận trọng (nghi sai đáp án → P0).
7. THE recommended_fix của mỗi Finding D1 SHALL mô tả sửa đề xuất cụ thể (ví dụ `article: MASKULIN → FEMININ`) NHƯNG SHALL KHÔNG được áp dụng vào file content trong đợt này (Read_Only_Invariant).

### Requirement 2: D2 — Đúng cấp CEFR

**User Story:** As a German Academic Lead, I want mỗi Content_Item được kiểm độ khó so với level khai báo, so that nội dung A1 không lẫn ngữ pháp B2 và ngược lại.

#### Acceptance Criteria

1. WHEN auditor đánh giá một Content_Item ở level `L`, THE Audit SHALL so độ khó từ vựng, độ khó ngữ pháp, và độ dài văn bản với kỳ vọng CEFR cho `L` theo `docs/content-quality/cefr-audit-checklist.md`.
2. WHERE một `reading` hoặc `listening` item khai báo `target_grammar` hoặc `target_vocabulary` chứa mục vượt quá level `L` (ví dụ Konjunktiv II trong item A1), THE Audit SHALL ghi Finding `dimension = D2`, `severity = P1`, Evidence gồm mục vượt level cụ thể.
3. WHERE `word_count` / độ dài text của một item lệch đáng kể khỏi dải kỳ vọng CEFR cho level (quá ngắn hoặc quá dài so với checklist), THE Audit SHALL ghi Finding D2 với số đo thật so với dải kỳ vọng.
4. WHEN `target_grammar`/`target_vocabulary` của một item không phù hợp với chủ đề/level theo `course.json` của level đó, THE Audit SHALL ghi Finding D2 và tham chiếu mục `course.json` liên quan.
5. THE Audit SHALL áp dụng Sampling_Method cho D2 nếu không quét 100%, và SHALL ghi rõ kích thước mẫu + cách phân tầng theo `level × skill` + lý do trong báo cáo.
6. IF việc gán level đúng cho một item là phán đoán biên (borderline), THEN THE Finding SHALL đánh dấu cần German Academic Lead sign-off.

### Requirement 3: D3 — Chất lượng sư phạm

**User Story:** As a German Curriculum Designer, I want hướng dẫn, đáp án, distractor, giải thích, ví dụ, và trình tự module được kiểm chất lượng sư phạm, so that bài học dạy đúng và theo trình tự hợp lý.

#### Acceptance Criteria

1. WHEN auditor kiểm một item có đáp án (`answer`, `correctIndex`, `correct`, `solution`), THE Audit SHALL xác minh đáp án khai báo là đáp án đúng duy nhất theo nội dung; IF đáp án sai hoặc mơ hồ (nhiều lựa chọn đúng), THEN THE Audit SHALL ghi Finding `dimension = D3`, `severity = P0`.
2. THE Audit SHALL quét 100% trường đáp án (High_Risk_Zone) cho D3, không lấy mẫu.
3. WHERE một câu hỏi trắc nghiệm có distractor không hợp lý (trùng đáp án đúng, vô nghĩa, hoặc loại trừ được mà không cần hiểu nội dung), THE Audit SHALL ghi Finding D3 với `severity` ∈ {P1, P2} và trích dẫn distractor cụ thể.
4. WHERE giải thích (`explanation.de` / `explanation.vi` / `key_evidence`) không khớp đáp án đúng hoặc chứa thông tin sai, THE Audit SHALL ghi Finding D3 với `severity = P0` nếu gây hiểu sai kiến thức.
5. WHERE hướng dẫn (instruction/prompt) của một item không rõ ràng hoặc thiếu, THE Audit SHALL ghi Finding D3 với `severity` ∈ {P1, P2}.
6. WHEN auditor kiểm trình tự module trong `course.json`, THE Audit SHALL ghi Finding D3 nếu trình tự vi phạm nguyên tắc recognition→production hoặc thiếu prerequisite hợp lý theo nhận định của German Curriculum Designer.
7. WHERE một ví dụ tiếng Đức không tự nhiên (dịch máy, gượng ép, không phải cách người bản ngữ nói), THE Audit SHALL ghi Finding D3 và đánh dấu cần German Academic Lead hoặc German Content Writer xác nhận.

### Requirement 4: D4 — Chất lượng bản dịch tiếng Việt

**User Story:** As a Vietnamese-German Localization Specialist, I want bản dịch tiếng Việt được kiểm độ chính xác, tự nhiên, nhất quán thuật ngữ, và không mojibake, so that learner Việt hiểu đúng và đọc tự nhiên.

#### Acceptance Criteria

1. WHEN auditor kiểm trường tiếng Việt (`meaningVi`, `nameVi`, `exampleTranslation1/2`, `explanation.vi`, `textVi`/`vietnamese`), THE Audit SHALL xác minh nghĩa tiếng Việt bảo toàn nghĩa tiếng Đức nguồn; IF dịch sai nghĩa, THEN THE Audit SHALL ghi Finding `dimension = D4`, `severity = P1` (hoặc P0 nếu sai nghĩa dẫn tới hiểu sai đáp án).
2. WHERE một trường tiếng Việt chứa Mojibake (dấu/umlaut/ß hỏng encoding), THE Audit SHALL ghi Finding D4 với Evidence là chuỗi mojibake thật và đối chiếu output `pnpm qa:copy-style`.
3. WHERE một bản dịch tiếng Việt đúng nghĩa nhưng gượng/không tự nhiên, THE Audit SHALL ghi Finding D4 với `severity = P2`.
4. WHERE thuật ngữ tiếng Việt không nhất quán giữa các item/level (cùng khái niệm Đức dịch khác nhau bất nhất quán), THE Audit SHALL ghi Finding D4 và liệt kê các biến thể + `file_path` của từng biến thể, đối chiếu `docs/content-quality/bilingual-style-guide.md`.
5. WHERE một trường learner-facing thiếu bản dịch tiếng Việt bắt buộc (ví dụ `meaningVi` rỗng/thiếu, `exampleTranslation` thiếu khi có `exampleSentence`), THE Audit SHALL ghi Finding D4 với `severity = P1`.
6. THE Audit SHALL phản ánh kết quả mojibake từ Layer_1_Automated (`pnpm qa:copy-style`) vào findings và coverage, không bỏ sót dòng vi phạm nào trong `current_violations*.txt` / `parity-violations*.txt`.

### Requirement 5: D5 — Song ngữ & đầy đủ trường learner-facing

**User Story:** As a Content QA / Linguistic Reviewer, I want mọi trường learner-facing có đủ DE + VI nơi cần và đạt locale parity, so that không có learner nào gặp trường rỗng hay thiếu một ngôn ngữ.

#### Acceptance Criteria

1. WHEN auditor kiểm một Content_Item, THE Audit SHALL xác định tập trường learner-facing bắt buộc theo skill (ví dụ vocabulary cần `word`, `article`, `meaningVi`, `exampleSentence1`, `exampleTranslation1`; listening question cần `question`, `options`, `answer`, `explanation.de`, `explanation.vi`).
2. WHERE một trường learner-facing bắt buộc bị thiếu, rỗng, hoặc whitespace-only, THE Audit SHALL ghi Finding `dimension = D5`, `severity = P1`, Evidence gồm tên trường thiếu + `item_id`.
3. WHERE một trường cần cả DE và VI nhưng chỉ có một phía (Locale_Parity gap), THE Audit SHALL ghi Finding D5 với `severity = P1` và chỉ rõ phía nào thiếu.
4. THE Audit SHALL phản ánh kết quả `pnpm check:locale-parity` (cho UI messages `apps/web/messages/{vi,de}.json`) vào findings, ghi rõ tổng số key mismatch nếu có.
5. WHERE một Content_Item ở skill `speaking` thể hiện field drift (A1 dùng `textDe`/`textVi`/`pronunciationNotes` vs A2+ dùng `german`/`vietnamese`/`pronunciationTips`), THE Audit SHALL ghi Finding D5 (drift gây thiếu/khác trường) và tham chiếu `CHANGELOG.md`; severity = P1 nếu trường learner-facing bị thiếu hệ quả, P2 nếu chỉ là khác tên không thiếu nội dung.

### Requirement 6: D6 — Nhất quán schema & toàn vẹn dữ liệu

**User Story:** As a Content QA / Linguistic Reviewer, I want schema drift, required-field thiếu, enum sai, đáp án sai index, id trùng, và tham chiếu mồ côi được phát hiện, so that dữ liệu nội dung toàn vẹn và máy đọc được.

#### Acceptance Criteria

1. WHEN auditor kiểm enum, THE Audit SHALL xác minh `article ∈ {MASKULIN, FEMININ, NEUTRUM}` và `wordType ∈` tập hợp lệ (`NOMEN`, `VERB`, `ADJEKTIV`, ...); IF một giá trị enum ngoài tập hợp lệ, THEN THE Audit SHALL ghi Finding `dimension = D6`, `severity = P1`.
2. WHERE một trường chỉ index đáp án (`correctIndex`, `answer`) trỏ ra ngoài phạm vi số lựa chọn thực có, THE Audit SHALL ghi Finding D6 với `severity = P0` (đáp án không resolve được).
3. WHERE hai Content_Item có cùng `id` trong phạm vi cần duy nhất (trong cùng skill/level hoặc toàn cục theo quy ước), THE Audit SHALL ghi Finding D6 với `severity = P1` và liệt kê cả hai `file_path`.
4. WHEN auditor kiểm `course.json` và `grammar-topics.json`, THE Audit SHALL phát hiện Orphan_Reference — module/theme/topic/examType trỏ tới id/file không tồn tại trong `content/` — và ghi Finding D6 với `severity = P1`.
5. WHERE một `audio_file` path khai báo trong `listening`/`speaking` item không tồn tại trên đĩa, THE Audit SHALL ghi Finding D6 (audio mồ côi) với `severity = P1`; verify chỉ kiểm tồn tại file (read-only stat), không phát/giải mã audio.
6. THE Audit SHALL ghi nhận schema field-naming drift (camelCase ở vocabulary/grammar/course vs snake_case ở reading/listening) như một Finding D6 cấp tài liệu (`severity = P2`, một Finding tổng hợp), KHÔNG đề xuất migrate trong đợt này (out-of-scope).
7. THE Audit SHALL phản ánh kết quả `pnpm qa:content` (`scripts/content-qa.ts`) vào findings D6 và đối chiếu với `qa_report.md`, không bỏ sót vi phạm nào script báo.
8. THE recommended_fix của Finding D6 SHALL mô tả sửa đề xuất NHƯNG SHALL KHÔNG áp dụng vào file (Read_Only_Invariant).

### Requirement 7: D7 — Audio / script (listening & speaking)

**User Story:** As an Audio Script & Voice Producer (qua Content QA), I want transcript khớp script nguồn, audio file tồn tại, và pronunciation notes đúng, so that nội dung nghe/nói nhất quán giữa script và audio.

#### Acceptance Criteria

1. WHEN auditor kiểm một `listening` item có `metadata.source_script`, THE Audit SHALL kiểm transcript/nội dung câu hỏi khớp với script nguồn được tham chiếu; IF transcript lệch script nguồn theo cách đổi đáp án, THEN THE Audit SHALL ghi Finding `dimension = D7`, `severity = P0`.
2. WHERE `audio_file` được khai báo nhưng file không tồn tại trên đĩa, THE Audit SHALL ghi Finding D7 (liên kết với D6.5) với `severity = P1` và Evidence là path khai báo.
3. WHERE pronunciation notes (`pronunciationNotes` / `pronunciationTips`) chứa thông tin phát âm sai hoặc gây hiểu nhầm cho learner Việt, THE Audit SHALL ghi Finding D7 với `severity` ∈ {P1, P2} và đánh dấu cần German Academic Lead xác nhận.
4. THE Audit SHALL kiểm audio/script bằng đối chiếu read-only metadata + transcript text, SHALL KHÔNG phát/transcode audio và SHALL KHÔNG sửa script source.
5. THE Audit SHALL quét 100% các item listening/speaking có khai báo `audio_file` cho điều kiện tồn tại file (D7.2), không lấy mẫu cho check tồn tại.

### Requirement 8: D8 — Hợp lệ đề thi (Goethe / Telc / ÖSD)

**User Story:** As an Exam Prep Specialist, I want cấu trúc Teil + rubric của item dạng thi khớp với đặc tả Goethe/Telc/ÖSD cho level, so that learner luyện đúng định dạng thi thật.

#### Acceptance Criteria

1. WHEN một Content_Item là exam-style (khai báo `examType` / `teil` / `task_type` thuộc Goethe/Telc/ÖSD), THE Audit SHALL kiểm cấu trúc Teil (số phần, số câu, loại câu hỏi) khớp đặc tả thật của exam + level tương ứng.
2. WHERE `task_type` hoặc `questions[].type` (ví dụ `mc_abc`, `richtig_falsch`) không khớp định dạng hợp lệ của Teil khai báo cho exam đó, THE Audit SHALL ghi Finding `dimension = D8`, `severity = P1`, Evidence gồm exam + teil + type thật.
3. WHERE số lượng item hoặc điểm (`points`) của một Teil lệch đặc tả thi thật cho level, THE Audit SHALL ghi Finding D8 với `severity = P1`.
4. WHERE `examTypes` trong `course.json` khai báo một exam type không được hỗ trợ thật ở level đó (ví dụ ÖSD ở level không tồn tại), THE Audit SHALL ghi Finding D8 và đánh dấu cần Exam Prep Specialist sign-off.
5. THE Audit SHALL quét 100% các item exam-style (High_Risk_Zone) cho D8, không lấy mẫu.
6. THE Audit SHALL KHÔNG khẳng định liên kết chính thức với Goethe/Telc/ÖSD; mọi recommended_fix SHALL chỉ nói về độ khớp định dạng, không tuyên bố affiliation.

### Requirement 9: D9 — Độ phủ & cân bằng

**User Story:** As a German Curriculum Designer, I want lỗ hổng và mất cân đối giữa level và skill cùng item trùng lặp được phát hiện, so that chương trình cân bằng và không lặp nội dung.

#### Acceptance Criteria

1. WHEN auditor tổng hợp Audit_Universe, THE Audit SHALL lập Coverage_Matrix `level × skill` với số Content_Item thực có mỗi ô (baseline đo được: a1=130, a2=150, b1=193, b2=209, c1=219, c2=287 file; tổng 1,188 + 6 course.json).
2. WHERE một ô `level × skill` có số item thấp bất thường so với các level lân cận (lỗ hổng độ phủ, ví dụ speaking giảm dần ở level cao), THE Audit SHALL ghi Finding `dimension = D9`, `severity = P2`, và nêu số đo so sánh.
3. WHERE hai Content_Item có nội dung trùng lặp đáng kể (cùng text/câu hỏi/từ vựng) trong phạm vi không nên trùng, THE Audit SHALL ghi Finding D9 với `severity = P2` và liệt kê các `file_path` trùng.
4. THE Coverage_Matrix SHALL ghi cả số item đã audit và số Finding mỗi ô để phục vụ heatmap mật độ lỗi.
5. IF một ô level×skill được audit bằng Sampling_Method thay vì 100%, THEN THE Coverage_Matrix SHALL đánh dấu ô đó là "sampled" kèm tỷ lệ mẫu.

### Requirement 10: Phương pháp hai lớp (reuse-first)

**User Story:** As a Content QA / Linguistic Reviewer, I want đợt audit tái dùng các gate tự động sẵn có trước khi review thủ công, so that không phát minh gate mới và không lãng phí công.

#### Acceptance Criteria

1. THE Audit SHALL chạy Layer_1_Automated gồm `pnpm qa:content`, `pnpm check:locale-parity`, `pnpm qa:copy-style`, `pnpm qa:learning-quality` và lưu output nguyên trạng vào Audit_Output_Dir trước khi bắt đầu Layer_2_Review.
2. THE Audit SHALL tham chiếu và đối chiếu các báo cáo có sẵn (`detailed_compounds_audit_report.md`, `qa_report.md`, `docs/content-quality/**`, `current_violations*.txt`, `parity-violations*.txt`) và nhúng phát hiện liên quan vào findings.
3. THE Audit SHALL KHÔNG sửa, weaken, hoặc skip bất kỳ script QA nào; nếu một script fail khi chạy, THE Audit SHALL ghi nhận output fail nguyên trạng như evidence thay vì sửa script.
4. THE Layer_2_Review SHALL áp rubric Content QA + German Academic Lead lên nội dung thật với mẫu đại diện mỗi `skill × level` cộng quét toàn bộ High_Risk_Zone (đáp án, exam item, compound noun).
5. IF Layer_1_Automated đã phát hiện một lớp lỗi đầy đủ (ví dụ mojibake), THEN THE Layer_2_Review SHALL không lặp lại quét toàn bộ lớp đó mà chỉ xác nhận mẫu và nhúng output tự động.

### Requirement 11: Cấu trúc Finding & deliverable

**User Story:** As a Project Manager / Delivery Manager, I want mọi finding có cấu trúc nhất quán và deliverable đầy đủ, so that remediation về sau triage được ngay.

#### Acceptance Criteria

1. THE mỗi Finding SHALL có đủ các trường: `finding_id`, `level`, `skill`, `file_path`, `item_id`, `dimension` (D1–D9), `severity` (P0/P1/P2), `evidence`, `recommended_fix`.
2. THE mỗi Finding SHALL evidence-gated: `file_path` khác rỗng, `item_id` xác định (hoặc `-` nếu finding cấp file), và `evidence` chứa trích dẫn verbatim cụ thể; IF một finding thiếu evidence cụ thể, THEN THE finding SHALL không được publish.
3. THE Audit SHALL xuất các deliverable sau dưới Audit_Output_Dir (`docs/content-quality/audit-2026-06/`):
   - `report.md` — tóm tắt điều hành (song ngữ, VI chính) + heatmap mật độ lỗi `level × skill`.
   - `findings.csv` — mỗi dòng là một Finding theo đúng tập trường ở AC1.
   - `coverage-matrix.md` — ma trận `level × skill` với số item & số lỗi (Requirement 9).
   - `remediation-backlog.md` — backlog ưu tiên theo severity; mỗi nhóm là một candidate fix-spec.
4. THE `report.md` SHALL viết song ngữ với tiếng Việt là ngôn ngữ chính (VI trước, DE/EN phụ nơi cần), và SHALL kết thúc bằng đề xuất bước kế tiếp.
5. THE `findings.csv` SHALL có header đúng thứ tự trường ở AC1 và SHALL escape đúng các giá trị chứa dấu phẩy/xuống dòng (CSV hợp lệ, UTF-8, không mojibake).
6. THE `remediation-backlog.md` SHALL nhóm Finding thành các candidate fix-spec, mỗi nhóm có severity tổng hợp, phạm vi đề xuất, và tham chiếu các `finding_id` thuộc nhóm.
7. THE severity trong mọi deliverable SHALL nhất quán với định nghĩa trong `docs/intake/risk-register.md` § Risk Levels.

### Requirement 12: Read-only invariant & phạm vi đợt audit

**User Story:** As a CTO / Tech Lead, I want đảm bảo đợt audit không thay đổi nội dung nào, so that audit là an toàn và có thể chạy lại mà không rủi ro.

#### Acceptance Criteria

1. THE Audit SHALL KHÔNG sửa, thêm, xóa, di chuyển, hay format lại bất kỳ file nào dưới `content/` (Read_Only_Invariant).
2. THE Audit SHALL KHÔNG thay đổi code, UI, asset, audio file, hoặc schema definition.
3. WHEN đợt audit hoàn tất, THE tập file dưới `content/` SHALL có nội dung (hash) giống hệt trước khi audit bắt đầu; IF bất kỳ file content nào bị thay đổi, THEN đợt audit SHALL bị coi là vi phạm scope và phải revert thay đổi đó.
4. THE chỉ các file được phép tạo/ghi bởi spec này SHALL nằm dưới Audit_Output_Dir (`docs/content-quality/audit-2026-06/`) và (nếu cần) thư mục `tmp/` cho output script tạm.
5. THE recommended_fix trong findings SHALL là đề xuất văn bản, KHÔNG phải patch được áp dụng tự động trong đợt này.
6. IF auditor phát hiện một lỗi P0 nghiêm trọng (ví dụ sai đáp án gây hại học tập), THEN THE Audit SHALL ghi nó là P0 trong backlog với đề xuất ưu tiên fix sớm, NHƯNG vẫn KHÔNG tự sửa trong đợt audit này.

### Requirement 13: Tiêu chí nghiệm thu đợt audit

**User Story:** As a Content QA / Linguistic Reviewer, I want tiêu chí nghiệm thu rõ ràng cho đợt audit, so that biết khi nào đợt audit hoàn tất và đạt chuẩn.

#### Acceptance Criteria

1. THE Audit SHALL bao phủ 100% của 1,194 Content_Item ở mức tối thiểu là Layer_1_Automated + check cấu trúc; HOẶC nếu một chiều dùng Sampling_Method cho Layer_2_Review, THE báo cáo SHALL nêu rõ phương pháp + lý do cho chiều đó.
2. THE mỗi Finding SHALL có đủ `severity` + `evidence` + `recommended_fix` (Requirement 11.1, 11.2).
3. THE Layer_1_Automated SHALL đã được chạy và kết quả nhúng vào deliverable; Locale_Parity và Mojibake SHALL được phản ánh trong findings.
4. THE Coverage_Matrix SHALL đầy đủ cho cả 36 ô `level × skill` cộng 6 `course.json`; THE Remediation_Backlog SHALL ưu tiên theo severity.
5. THE đợt audit SHALL kết thúc với KHÔNG file nội dung nào dưới `content/` bị sửa (Read_Only_Invariant, Requirement 12.3).
6. THE deliverable cuối SHALL kết thúc bằng đề xuất bước kế tiếp (next concrete step) cho giai đoạn remediation.
