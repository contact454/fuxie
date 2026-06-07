# Requirements Document

Vai chinh: CTO / Tech Lead
Vai phoi hop: Backend Engineer, Frontend Engineer

## Introduction

Đợt audit `fuxie-content-quality-audit` (`docs/content-quality/audit-2026-06/`) ghi nhận `RB-P2-01` (finding `F-0027`): **schema field-naming drift** trong nội dung học. Hai quy ước đặt tên cùng tồn tại:

- **camelCase** ở vocabulary / grammar / course.json (`meaningVi`, `titleDe`, `article`, `wordType`).
- **snake_case** ở reading / listening (`teil`, `teil_name`, `task_type`, `target_grammar`, `target_vocabulary`, `word_count`, `audio_file`, `topic_id`, `linked_text`, `total_points`, `pass_threshold`).
- Speaking từng có field drift (A1 `textDe`/`textVi`/`pronunciationNotes` vs A2+ `german`/`vietnamese`/`pronunciationTips` — xem `CHANGELOG.md`).

Audit đã phân loại đây là **P2 (polish, không chặn baseline)** và remediation-backlog đánh dấu **ACCEPTED/DEFERRED** vì rủi ro migration lớn hơn lợi ích thẩm mỹ. Spec này **CHỈ là tài liệu quyết định (requirements + design + blast-radius analysis)** để công ty chốt có nên migrate hay không. **KHÔNG execute** trong spec này — nếu được duyệt, tasks/execution sẽ ở một spec/đợt riêng có owner CTO/Tech Lead + Backend + Frontend và test đầy đủ.

Bối cảnh kỹ thuật quan trọng (đo tại baseline, điều tra repo thật):

- **Prisma DB ĐÃ dùng camelCase** (`teilName`, `taskType`, `audioUrl`, `questionType`, `linkedText`). Các seeder (`seed-listening.ts`, `seed-reading-writing.ts`, `seed-listening-questions.ts`, `seed-dev-data.ts`) đã **map snake_case → camelCase tại thời điểm ingest**. → DB KHÔNG phải là blocker.
- snake_case chỉ tồn tại trong **raw content JSON** + một số ít consumer đọc trực tiếp JSON. Consumer đo được: `teil_name` (5 code ref), `task_type` (7), `topic_id` (2), `linked_text` (2); `target_grammar`/`target_vocabulary`/`word_count`/`audio_file`/`total_points`/`pass_threshold` = **0 runtime consumer** (chỉ seeder + content QA scripts đọc, và UI đọc `word_count` thủ công có fallback cả hai cách).
- Số occurrence trong content: `teil`=2120, `teil_name`=534, `task_type`=268, `target_grammar`=246, `target_vocabulary`=246, `word_count`=236, `audio_file`=268, `topic_id`=266, `linked_text`=50, `total_points`=534, `pass_threshold`=534.

Phạm vi (in-scope của spec tài liệu này):

- Phân tích đầy đủ blast-radius (content + DB + seeders + scripts + UI).
- Liệt kê các phương án migration + đánh giá rủi ro/lợi ích.
- Đưa ra khuyến nghị (recommendation) cho công ty quyết.
- Định nghĩa tiêu chí thành công + chiến lược test + rollback NẾU migration được duyệt.

Phạm vi (out-of-scope):

- KHÔNG execute migration trong spec này (không sửa content/code/DB).
- KHÔNG đổi schema Prisma (đã camelCase).
- KHÔNG quyết thay công ty — spec đưa khuyến nghị, quyết định cuối thuộc CEO/CTO.

Source-of-truth:

- `docs/content-quality/audit-2026-06/findings.csv` (`F-0027`) + `remediation-backlog.md` (`RB-P2-01`).
- `packages/database/prisma/schema.prisma` (đã camelCase).
- Seeders: `packages/database/prisma/seed-listening.ts`, `seed-reading-writing.ts`, `seed-listening-questions.ts`, `seed-dev-data.ts`, `seed-grammar.ts`.
- Runtime: `apps/web/src/components/reading/reading-client.tsx`, `app/(learn)/reading/page.tsx`.
- QA: `scripts/content-qa.ts`, `generate-content-quality-assets.ts`, `generate-reading-content.ts`.

## Glossary

- **Snake_Field**: Một trường content dùng snake_case trong reading/listening: `teil_name`, `task_type`, `target_grammar`, `target_vocabulary`, `word_count`, `audio_file`, `topic_id`, `linked_text`, `total_points`, `pass_threshold`. (`teil` là một từ đơn, không có biến thể camel.)
- **Camel_Equivalent**: Tên camelCase tương ứng (`teilName`, `taskType`, `targetGrammar`, …) — đa số ĐÃ dùng ở Prisma.
- **Ingest_Mapping**: Logic trong seeder map Snake_Field → camelCase DB column tại thời điểm `prisma db seed`.
- **Runtime_Consumer**: Code đọc Snake_Field trực tiếp từ content JSON tại runtime (không qua DB). Đo được: rất ít, chủ yếu `word_count` (có fallback) và `task_type`/`teil_name` trong tooling.
- **Migration_Option**: Một trong các phương án xử lý drift (xem Requirement 3).
- **Blast_Radius**: Tập file/tầng bị ảnh hưởng nếu rename: content JSON (~5,600 occurrence), seeders (10 file), QA scripts, UI (defensive reads).

## Requirements

### Requirement 1: Phân tích blast-radius đầy đủ

**User Story:** As a CTO / Tech Lead, I want một bức tranh blast-radius chính xác, so that quyết định migrate dựa trên dữ liệu chứ không phải cảm tính.

#### Acceptance Criteria

1. THE spec SHALL liệt kê mọi Snake_Field cùng số occurrence trong content/ (đã đo: 11 field, ~5,600 occurrence).
2. THE spec SHALL liệt kê mọi code consumer của từng Snake_Field, phân biệt **seed-time** (seeder) vs **runtime** (UI/API) vs **tooling** (QA scripts).
3. THE spec SHALL xác nhận trạng thái Prisma schema (đã camelCase) và cơ chế Ingest_Mapping hiện tại.
4. THE spec SHALL xác định field nào có 0 runtime consumer (an toàn đổi) vs field nào có runtime consumer (cần cẩn trọng).
5. THE phân tích SHALL dựa trên grep/scan repo thật tại baseline, không phỏng đoán.

### Requirement 2: Đánh giá rủi ro & lợi ích

**User Story:** As a CEO / General Manager, I want hiểu rủi ro vs lợi ích, so that ưu tiên đúng so với các việc khác.

#### Acceptance Criteria

1. THE spec SHALL nêu lợi ích của việc unify (nhất quán schema, dễ maintain, giảm nhầm lẫn khi viết content/tooling mới).
2. THE spec SHALL nêu rủi ro: regression seeder/UI/QA, dung lượng diff lớn (~5,600 thay đổi), khả năng bỏ sót consumer ẩn, chi phí review.
3. THE spec SHALL phân loại severity giữ nguyên P2 (không chặn baseline) — migration là "nợ kỹ thuật polish", không khẩn cấp.
4. THE spec SHALL ước lượng effort tương đối (S/M/L) cho mỗi Migration_Option.

### Requirement 3: Các phương án migration

**User Story:** As a CTO / Tech Lead, I want các phương án rõ ràng với trade-off, so that chọn được hướng phù hợp.

#### Acceptance Criteria

1. THE spec SHALL trình bày ít nhất 3 Migration_Option:
   - **Option A — Status quo (defer):** giữ drift, ghi nhận là known issue. Effort: 0. Rủi ro: 0.
   - **Option B — Unify content sang camelCase:** rename Snake_Field → Camel_Equivalent trong content JSON + cập nhật seeders + tooling + UI. Effort: L.
   - **Option C — Compatibility shim:** thêm một lớp normalize đọc content (chấp nhận cả hai spelling) ở một helper chung, không đổi content JSON. Effort: M.
2. WHERE Option B được chọn, THE spec SHALL yêu cầu execution ở spec riêng có codemod script (dry-run + assert), batch theo skill/level, test đầy đủ.
3. WHERE Option C được chọn, THE spec SHALL định nghĩa helper normalize + nơi đặt + test contract.
4. THE spec SHALL đưa ra **khuyến nghị** rõ ràng (recommendation) kèm lý do.

### Requirement 4: Tiêu chí thành công & test (nếu migrate)

**User Story:** As a QA Automation Engineer, I want tiêu chí thành công đo được nếu migration chạy, so that biết khi nào an toàn.

#### Acceptance Criteria

1. IF migration (Option B/C) được duyệt và execute ở spec sau, THEN `pnpm qa:content` SHALL exit 0 và `pnpm test:property` (gồm `tests/content-audit/*`) SHALL giữ xanh.
2. IF Option B execute, THEN mọi đáp án + nội dung learner-facing SHALL bất biến (chỉ tên field đổi); seeder vẫn ingest đúng DB camelCase.
3. THE spec SHALL định nghĩa một verifier: 0 Snake_Field còn lại trong content/ sau Option B (hoặc 100% reads đi qua shim sau Option C).
4. THE spec SHALL định nghĩa rollback: revert theo batch (Option B) hoặc gỡ shim (Option C) là sạch.

### Requirement 5: Spec này không execute

**User Story:** As a Project Manager / Delivery Manager, I want spec này chỉ là tài liệu quyết định, so that không có thay đổi runtime nào xảy ra trước khi công ty chốt.

#### Acceptance Criteria

1. THE spec này SHALL KHÔNG sửa bất kỳ file nào trong content/, packages/, apps/, scripts/ (ngoài tài liệu spec của chính nó).
2. THE spec này SHALL KHÔNG có tasks.md execution; nếu migration được duyệt, một spec mới (ví dụ `content-schema-camel-migration`) SHALL được mở với tasks + codemod.
3. THE finding `RB-P2-01` SHALL giữ trạng thái ACCEPTED/DEFERRED cho tới khi công ty quyết; spec này cập nhật backlog với link tới phân tích.
4. IF công ty quyết Option A (status quo), THEN `RB-P2-01` SHALL được đóng là "won't-fix (accepted drift)" với lý do ghi rõ.
