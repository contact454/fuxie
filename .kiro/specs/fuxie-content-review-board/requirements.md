# Requirements Document

Vai chinh: AI / LLM Engineer
Vai phoi hop: German Academic Lead, Content QA / Linguistic Reviewer, QA Automation Engineer, DevOps / Cloud Engineer

## Introduction

Đợt remediation `audit-2026-06` đã tái sinh **1.282 reading `explanation`** (commit `755326d25`, PR #21) — toàn bộ AI sinh, **CHƯA người rành tiếng Đức duyệt**. Gói review thủ công (`docs/content-quality/audit-2026-06/explanation-review/`) đã dựng nhưng đội chưa có reviewer tiếng Đức để ký. Đây là rủi ro thường trực: mọi bài học mới/sửa sau này cũng sẽ thiếu cổng kiểm chất lượng đáng tin.

Spec này dựng **`fuxie-content-review-board`**: hạ tầng **cổng QA nội dung thường trực (permanent gate)** cho mọi nội dung học tiếng Đức, đồng thời **chạy 1 lượt** trên 1.282 reading explanation hiện tại để de-risk PR #21. Hai quyết định owner đã chốt là ràng buộc thiết kế bất di bất dịch:

1. **Cổng thường trực**, không phải one-off: board chạy như gate cho nội dung mới/sửa (giống `qa:content`), không chỉ một lần.
2. **Chưa có người rành tiếng Đức** → board **KHÔNG được tự chứng nhận chất lượng chủ quan**. Dựa tối đa vào tool **có thẩm quyền** (deterministic) + **red-team**; phần đánh giá chủ quan chỉ là **AI-advisory** + **hàng đợi escalate** chờ người duyệt.

Kiến trúc bắt buộc tách bạch **2 tầng**:

- **Tier 1 — Cổng deterministic** (citeable, blocking, chạy CI, miễn phí): LanguageTool de-DE + hunspell de_DE trên mọi chuỗi tiếng Đức của content; validate Genus/quán từ + số nhiều theo từ điển; validate `wordType`/enum; answer-key consistency (explanation/key_evidence không mâu thuẫn đáp án). Lỗi ở tầng này **chặn PR**.
- **Tier 2 — Agent Review Board** (advisory, provider-eval, on-demand/nightly): 4 reviewer agent chạy context độc lập bằng model khác model đã sinh nội dung — German Linguist, CEFR/Pedagogy, VN Localization, và Red-team **mù đáp án**. Aggregator → đồng thuận + confidence. **KHÔNG auto-approve** chất lượng chủ quan ra production.

Để biết tầng dò có đáng tin không khi chưa có người duyệt: **mutation gold-set calibration** — cấy lỗi đã biết vào bản sao tạm, đo **recall** theo từng loại lỗi.

Phạm vi (in-scope):

- Spec 3 file (`requirements.md` EARS + `design.md` + `tasks.md`) theo house style `.kiro/specs/`.
- Tier-1 script deterministic (gợi ý `scripts/content-german-lint.ts`, npm `qa:german-lint`) + wiring vào `.github/workflows/ci.yml` (job `check-quick`).
- Tier-2 harness mở rộng từ `scripts/ai-eval-harness.ts` & họ `eval:ai:*` (4 reviewer + red-team + aggregator) + ghi chú cost/credit.
- Script mutation-calibration + báo cáo recall theo loại lỗi.
- Kết quả 1 lượt trên 1.282 reading explanation: CSV per-item (objective + subjective + confidence) + escalation queue tại `docs/content-quality/audit-2026-06/review-board/`.
- README vận hành gate: cái gì verify khách quan, cái gì chỉ AI-advisory, ngưỡng, cách chạy.

Phạm vi (out-of-scope):

- KHÔNG auto-approve/auto-merge chất lượng chủ quan ra production khi chưa có người duyệt.
- KHÔNG sửa `content/` (mutation chỉ trên bản sao tạm; one-shot run là read-only).
- KHÔNG trùng lặp `qa:content` (`scripts/content-qa.ts`) — Tier-1 bổ sung lớp German-language lint, không lặp structural/enum-integrity đã có.
- KHÔNG thay người duyệt tiếng Đức: board cung cấp tín hiệu + hàng đợi, người vẫn là cấp chứng nhận cuối cho chủ quan.
- KHÔNG đụng listening/vocabulary/grammar/speaking/writing trong **one-shot run** (chỉ 1.282 reading explanation); nhưng Tier-1 **gate thường trực** áp cho mọi skill.

Source-of-truth & reuse:

- `scripts/ai-eval-harness.ts`, `apps/ai-service/src/lib/eval-harness.ts`, `scripts/ai-eval-provider-runner.ts` (harness eval nền).
- npm scripts: `eval:ai`, `eval:ai:readout`, `eval:ai:academic-review`, `eval:ai:academic-signoff`, `eval:ai:fixture-expansion`, `eval:ai:controlled-fixture-patch`.
- `docs/content-quality/cefr-audit-checklist.md`, `docs/content-quality/bilingual-style-guide.md` (rubric chuẩn).
- `.agents/personnel/` (German Academic Lead, Content QA, Localization, Curriculum Designer, Exam Prep — nguồn rubric reviewer).
- `docs/content-quality/audit-2026-06/explanation-review/` (pack review thủ công đã dựng — rubric + sample + traceability tái dùng).
- `scripts/content-qa.ts` (gate structural sẵn có — KHÔNG sửa, KHÔNG lặp).
- `.github/workflows/ci.yml` job `check-quick` (điểm cắm Tier-1).

## Glossary

- **Content_String_De**: Mọi chuỗi tiếng Đức trong một file content (vd `explanation.de`, `key_evidence`, `texts[].content`, `statement`, `stem`, `options` tiếng Đức) — đối tượng Tier-1 kiểm.
- **Tier1_Gate**: Bộ kiểm **deterministic** (LanguageTool de-DE + hunspell + dictionary Genus/plural + enum/wordType + answer-key consistency). Output là **Objective_Verdict** PASS/FAIL kèm finding citeable (file + path + rule + offset).
- **Tier1_Finding**: Một lỗi khách quan: `{ file, jsonPath, rule, severity (error|warning), message, offset, suggestion? }`. `severity=error` là **BLOCKING**.
- **Objective_Verdict**: Nhãn PASS/FAIL của một item/batch theo Tier-1, **có thẩm quyền** (deterministic, lặp lại được).
- **Tier2_Board**: 4 reviewer agent + aggregator chạy provider-backed, **advisory**.
- **Reviewer_Agent**: Một trong: `German_Linguist`, `CEFR_Pedagogy`, `VN_Localization`, `RedTeam_Blind`. Mỗi agent chạy **context độc lập**, model khác model sinh nội dung.
- **RedTeam_Blind**: Reviewer nhận **đề + options NHƯNG KHÔNG thấy `answer`/`explanation`**; tự giải; nếu đáp án nó suy ra **lệch** với đáp án đang lưu → **Red_Flag**.
- **Red_Flag**: Tín hiệu khách-quan-hoá từ red-team (lệch đáp án) — mạnh hơn ý kiến chủ quan, ưu tiên escalate.
- **Aggregator**: Thành phần tổng hợp output 4 reviewer → `{ consensus, confidence (high|medium|low), perDimension, redFlag }`.
- **Subjective_Label**: Nhãn `AI-ADVISORY` + confidence (high|medium|low) + câu bắt buộc "**chưa được người rành tiếng Đức duyệt**". **KHÔNG bao giờ** hiển thị là "approved".
- **Advisory_Pass_LowAssurance**: Trạng thái duy nhất board được tự gán khi `Objective_Verdict=PASS` **và** `confidence=high` **và** `redFlag=false` — vẫn mang câu "chưa người duyệt", KHÔNG phải chứng nhận production.
- **Escalation_Queue**: Hàng đợi item cần người tiếng Đức duyệt: mọi item `FAIL` Tier-1, hoặc `Red_Flag`, hoặc `confidence != high`.
- **Mutation_Gold_Set**: Bản sao **tạm** N item content được cấy lỗi đã biết (sai Genus, bỏ umlaut, sai đáp án, sai level, dịch sai). Dùng đo recall. Xoá sau đo; READ-ONLY với content thật.
- **Recall_By_Type**: Tỉ lệ % lỗi cấy bị board bắt được, tách theo từng loại lỗi.
- **Content_QA_Gate**: `pnpm qa:content` (`scripts/content-qa.ts`) — gate structural/enum sẵn có. Board KHÔNG lặp.

## Requirements

### Requirement 1: Tier-1 — Cổng tiếng Đức deterministic (blocking, citeable, CI)

**User Story:** As a QA Automation Engineer, I want một cổng kiểm tiếng Đức khách quan chặn được lỗi trước khi merge, so that lỗi chính tả/ngữ pháp/Genus/đáp-án có thể tin và chặn PR mà không cần ý kiến chủ quan.

#### Acceptance Criteria

1. THE Tier1_Gate SHALL chạy LanguageTool (de-DE) và hunspell (de_DE) trên mọi Content_String_De của file được kiểm, và phát ra Tier1_Finding cho mỗi lỗi chính tả/ngữ pháp.
2. THE Tier1_Gate SHALL validate Genus/quán từ (der/die/das) và số nhiều theo từ điển, và validate `wordType`/enum giá trị hợp lệ.
3. THE Tier1_Gate SHALL kiểm answer-key consistency: `explanation`/`key_evidence` KHÔNG mâu thuẫn `answer`/`correctIndex`, và `correctIndex`/`answer` trỏ tới một lựa chọn hợp lệ.
4. WHEN một Content_String_De có lỗi chính tả/ngữ pháp khách quan, THE Tier1_Finding tương ứng SHALL ghi `file`, `jsonPath`, `rule`, `message`, và offset/đoạn trích để truy vết (citeable).
5. IF có ≥ 1 Tier1_Finding với `severity=error`, THEN THE Tier1_Gate SHALL exit khác 0 (BLOCKING).
6. THE Tier1_Gate SHALL chạy được trên tập file thay đổi (diff-scoped) và trên toàn bộ một skill/level, giống mô hình `qa:content`.
7. THE Tier1_Gate SHALL được expose qua một npm script (gợi ý `qa:german-lint`) và cắm vào `.github/workflows/ci.yml` job `check-quick` ở chế độ block-on-error.
8. THE Tier1_Gate SHALL KHÔNG lặp lại các kiểm structural/required-field/enum đã có trong Content_QA_Gate; nếu cần enum, SHALL tái dùng nguồn enum chung.
9. WHERE LanguageTool server không khả dụng trong môi trường chạy, THE Tier1_Gate SHALL báo lỗi hạ tầng rõ ràng (phân biệt với content-fail) và SHALL KHÔNG báo PASS giả.

### Requirement 2: Tier-2 — Agent Review Board (advisory, 4 reviewer độc lập)

**User Story:** As an AI / LLM Engineer, I want 4 reviewer agent đánh giá nội dung ở các chiều chuyên môn bằng model độc lập, so that có tín hiệu chất lượng đa chiều mà không nhầm nó là chứng nhận production.

#### Acceptance Criteria

1. THE Tier2_Board SHALL gồm đúng 4 Reviewer_Agent: German_Linguist, CEFR_Pedagogy, VN_Localization, RedTeam_Blind.
2. THE mỗi Reviewer_Agent SHALL chạy trong **context độc lập** (không chia sẻ state/đáp án của nhau) và dùng model **khác** model đã sinh nội dung được review.
3. THE German_Linguist SHALL đánh giá ngữ pháp/Genus/Kasus sâu hơn tool; THE CEFR_Pedagogy SHALL đánh giá level-fit + lời giải justify đáp án bằng `key_evidence` + chất lượng distractor; THE VN_Localization SHALL đánh giá dịch chính xác/tự nhiên/thuật ngữ.
4. THE mỗi Reviewer_Agent SHALL trả structured output (schema cố định: `{ dimension, verdict, severity, rationale, evidence }`), KHÔNG free-text thuần.
5. THE rubric của mỗi Reviewer_Agent SHALL dẫn xuất từ `.agents/personnel/` + `docs/content-quality/cefr-audit-checklist.md` + `bilingual-style-guide.md`.
6. THE Tier2_Board SHALL được triển khai bằng cách **mở rộng** harness `scripts/ai-eval-harness.ts`/`eval:ai:*`, KHÔNG dựng harness song song mới.
7. THE Tier2_Board SHALL chạy on-demand/nightly (KHÔNG nằm trong gate PR blocking), và SHALL hỗ trợ chạy theo batch/level để kiểm soát chi phí.

### Requirement 3: Red-team mù đáp án

**User Story:** As a Content QA / Linguistic Reviewer, I want một reviewer tự giải câu hỏi mà không thấy đáp án, so that lỗi "dạy sai đáp án" được phát hiện khách quan thay vì tin lời giải có sẵn.

#### Acceptance Criteria

1. THE RedTeam_Blind SHALL nhận đề (`stem`/`statement`/`situation`) + `options` (nếu có) NHƯNG SHALL KHÔNG nhận `answer`/`correctIndex`/`explanation`/`key_evidence`.
2. THE RedTeam_Blind SHALL tự suy ra đáp án và trả `{ predictedAnswer, confidence, rationale }`.
3. WHEN `predictedAnswer` của RedTeam_Blind lệch với `answer` đang lưu, THE Aggregator SHALL gắn Red_Flag cho item đó.
4. THE item có Red_Flag SHALL luôn vào Escalation_Queue bất kể nhãn chủ quan khác.
5. THE quy trình SHALL đảm bảo đáp án không rò sang context red-team (kiểm bằng test: payload red-team không chứa trường đáp án/explanation).

### Requirement 4: Mutation gold-set calibration + recall theo loại lỗi

**User Story:** As an AI / LLM Engineer, I want đo được board bắt lỗi tốt đến đâu trên lỗi đã biết, so that biết tầng dò nào đáng tin khi chưa có người duyệt.

#### Acceptance Criteria

1. THE Mutation_Gold_Set SHALL được tạo trên **bản sao tạm** của N item, KHÔNG ghi vào `content/` thật.
2. THE quy trình SHALL cấy được tối thiểu các loại lỗi: sai Genus (vd FEMININ→FEMINUM), sai chính tả (bỏ umlaut), sai đáp án (đổi `answer`), sai level (chèn cấu trúc C1 vào A1), dịch sai (VN).
3. THE board SHALL được chạy trên bản cấy và Recall_By_Type SHALL được tính = (#lỗi cấy bị bắt)/(#lỗi cấy) cho từng loại.
4. WHERE Recall_By_Type của một loại thấp (dưới ngưỡng ghi trong README), THE báo cáo SHALL ghi rõ tầng dò loại đó **chưa đáng tin** (không che giấu).
5. WHEN đo xong, THE bản sao tạm SHALL bị xoá; THE content thật SHALL byte-identical trước/sau calibration.
6. THE báo cáo recall SHALL ghi cả loại lỗi do Tier-1 bắt (deterministic) vs loại chỉ Tier-2 bắt (advisory), để phân định thẩm quyền.

### Requirement 5: Nhãn trung thực — objective vs subjective tách biệt

**User Story:** As a CEO / General Manager, I want mọi output phân biệt rõ "đã verify khách quan" với "chỉ AI gợi ý chưa người duyệt", so that không ai nhầm nội dung AI-sinh là đã được chứng nhận chất lượng.

#### Acceptance Criteria

1. THE mỗi item và mỗi batch output SHALL mang **hai nhãn tách biệt**: Objective_Verdict (PASS/FAIL theo Tier-1) và Subjective_Label (AI-ADVISORY + confidence).
2. THE Subjective_Label SHALL luôn kèm câu rõ ràng "**chưa được người rành tiếng Đức duyệt**".
3. THE hệ thống SHALL KHÔNG gộp hai nhãn thành một chữ "approved" ở bất kỳ output, log, hay UI nào.
4. THE trạng thái Advisory_Pass_LowAssurance SHALL chỉ được gán khi Objective_Verdict=PASS **và** confidence=high **và** redFlag=false; và vẫn SHALL KHÔNG được coi là chứng nhận production.
5. IF Objective_Verdict=FAIL hoặc redFlag=true hoặc confidence != high, THEN item SHALL vào Escalation_Queue.
6. THE README SHALL phân định tường minh: cái gì verify khách quan (Tier-1, có thẩm quyền) vs cái gì chỉ AI-advisory (Tier-2, chờ người duyệt).

### Requirement 6: Chạy 1 lượt trên 1.282 reading explanation + escalation queue

**User Story:** As an AI / LLM Engineer, I want kết quả board cho toàn bộ 1.282 reading explanation hiện tại, so that owner có cơ sở khách quan để de-risk PR #21 và mở hàng đợi cho người duyệt.

#### Acceptance Criteria

1. WHEN one-shot run chạy, THE board SHALL xử lý đủ 1.282 reading explanation (answer-bearing) và sinh CSV per-item gồm: `file`, `item_id`, `level`, `type`, Objective_Verdict, Tier1_Finding tóm tắt, Subjective_Label, confidence, redFlag.
2. THE one-shot run SHALL sinh Escalation_Queue (mọi item FAIL Tier-1 / Red_Flag / confidence != high) ở `docs/content-quality/audit-2026-06/review-board/`.
3. THE deliverable one-shot SHALL đặt tại `docs/content-quality/audit-2026-06/review-board/` (CSV per-item + escalation queue + README + recall report).
4. THE one-shot run SHALL READ-ONLY với `content/` (không sửa item nào).
5. THE one-shot output SHALL tái dùng/tham chiếu pack thủ công `explanation-review/` (cùng item_id/traceability) thay vì dựng định danh mới.

### Requirement 7: Reuse-first, kiểm soát chi phí, không regress, READ-ONLY content

**User Story:** As a DevOps / Cloud Engineer, I want board tái dùng hạ tầng sẵn có, kiểm soát credit, và không phá gate hiện tại, so that vận hành bền vững và an toàn cho repo.

#### Acceptance Criteria

1. THE Tier-2 SHALL mở rộng từ `scripts/ai-eval-harness.ts` + họ `eval:ai:*`, KHÔNG tạo harness trùng lặp.
2. THE Tier-1 SHALL KHÔNG trùng `scripts/content-qa.ts`; nếu cần kiểm đã có, SHALL gọi/tham chiếu thay vì sao chép.
3. THE provider-backed run SHALL ghi **cost ước tính** (USD/credit) và SHALL chạy được theo batch/level để giới hạn chi phí mỗi lần.
4. THE spec này SHALL KHÔNG sửa `content/`, `scripts/content-qa.ts`, hay các PBT `tests/content-audit/*` hiện có theo hướng nới lỏng.
5. WHEN Tier-1 được cắm vào CI, THE job hiện có (`check-quick`, `verify`, `smoke-test`) SHALL không bị phá; Tier-1 thêm như bước block-on-error riêng.
6. THE mọi script mới SHALL có chế độ chạy không cần credit (Tier-1 hoàn toàn local; Tier-2 có `--dry-run`/đếm-cost trước khi gọi provider).
