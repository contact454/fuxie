# Requirements Document

Vai chinh: CTO / Tech Lead
Vai phoi hop: Backend Engineer, Frontend Engineer

## Introduction

Spec này thực thi **Option C** của quyết định `content-schema-naming-unify` (RB-P2-01): thay vì rename ~5,600 field trong content JSON (Option B — rủi ro cao, đụng seeder/QA-gate/audio-pipeline/DB-blob, cần `prisma db seed` smoke không có ở môi trường hiện tại), ta thêm một **lớp chuẩn hoá đọc (read-normalize shim)** — một helper thuần chấp nhận cả snake_case lẫn camelCase và trả về một shape camelCase nhất quán.

Mục tiêu: **code đọc content nhất quán** (một spelling), trong khi content JSON trên đĩa **giữ nguyên** (0 rủi ro seed/runtime/DB). Đây là cách cải thiện độ sạch ở tầng code mà không gánh blast-radius của Option B.

Bối cảnh (điều tra repo thật, từ decision doc):

- Content reading/listening dùng snake_case; vocabulary/grammar/course dùng camelCase.
- Prisma DB đã camelCase; seeder map snake→camel; nhưng `metadata`/`scoring` được seed nguyên trạng vào JSON blob (`metadataJson`/`scoringJson`) và đọc lại ở tooling + runtime UI (`reading-client.tsx` đọc `meta.word_count`).
- → Mọi rename content có blast-radius xuyên hệ thống. Shim tránh điều đó bằng cách chuẩn hoá tại điểm đọc.

Phạm vi (in-scope):

- Tạo module `@fuxie/shared/content-schema` export `normalizeContentRecord()` + các type camelCase chuẩn cho metadata/scoring/question fields.
- Helper chấp nhận cả hai spelling cho tập field đã biết (Snake_Field ↔ Camel_Equivalent), idempotent, spelling-agnostic.
- Property-based test cho helper (idempotent + tương đương snake/camel).
- KHÔNG đổi content JSON, KHÔNG đổi seeder/DB, KHÔNG bắt buộc refactor consumer (helper là opt-in; consumer có thể migrate dần).

Phạm vi (out-of-scope):

- KHÔNG rename field trong content/ (đó là Option B, defer).
- KHÔNG đổi Prisma schema, seeder, audio pipeline.
- KHÔNG bắt buộc tất cả consumer dùng shim ngay (migration consumer là dần dần, ngoài spec này; spec chỉ ship helper + test + ít nhất 1 consumer mẫu).

Source-of-truth:

- `.kiro/specs/content-schema-naming-unify/design.md` (quyết định Option C + mapping table).
- `packages/shared/package.json` (exports map: `@fuxie/shared/<subpath>` → `./src/<subpath>/index.ts`).
- `packages/shared/src/utils/index.ts` (style helper thuần).

## Glossary

- **Snake_Field**: field snake_case trong content reading/listening: `teil_name`, `task_type`, `target_grammar`, `target_vocabulary`, `word_count`, `audio_file`, `topic_id`, `linked_text`, `total_points`, `pass_threshold`, `key_evidence`, `key_vocabulary`, `generated_at`, `regenerated_at`, `source_script`.
- **Camel_Equivalent**: tên camelCase chuẩn (`teilName`, `taskType`, `targetGrammar`, …).
- **Normalize_Helper**: hàm `normalizeContentRecord(raw)` trả object có camelCase keys cho tập Snake_Field đã biết, giữ nguyên các field khác.
- **Spelling_Agnostic**: với input chỉ khác nhau ở spelling (snake vs camel) của cùng field, output `normalizeContentRecord` giống nhau.
- **Idempotent**: `normalizeContentRecord(normalizeContentRecord(x))` ≡ `normalizeContentRecord(x)`.
- **Content_Module**: module mới `packages/shared/src/content-schema/index.ts`, export qua `@fuxie/shared/content-schema`.

## Requirements

### Requirement 1: Module chuẩn hoá đọc content

**User Story:** As a Backend/Frontend Engineer, I want một helper chuẩn hoá content record về camelCase, so that code đọc content không phải quan tâm field là snake hay camel.

#### Acceptance Criteria

1. THE Content_Module SHALL export `normalizeContentRecord(raw: Record<string, unknown>): NormalizedContentRecord`.
2. THE Normalize_Helper SHALL map mỗi Snake_Field sang Camel_Equivalent khi field tồn tại; nếu cả hai spelling cùng tồn tại, ưu tiên camelCase (giả định camel là giá trị đã chuẩn).
3. THE Normalize_Helper SHALL giữ nguyên (pass-through) mọi field không thuộc tập Snake_Field đã biết, không làm mất dữ liệu.
4. THE Normalize_Helper SHALL KHÔNG mutate input (trả object mới).
5. THE Content_Module SHALL export type `NormalizedContentRecord` (hoặc tập type con) với key camelCase.
6. THE Content_Module SHALL được export qua `@fuxie/shared/content-schema` trong `packages/shared/package.json` exports map.

### Requirement 2: Đúng đắn của helper (idempotent + spelling-agnostic)

**User Story:** As a QA Automation Engineer, I want helper có property đảm bảo, so that nó an toàn dùng ở mọi điểm đọc content.

#### Acceptance Criteria

1. WHEN `normalizeContentRecord` nhận input snake_case và input camelCase tương đương (cùng giá trị, khác spelling), THE output SHALL bằng nhau (Spelling_Agnostic).
2. WHEN `normalizeContentRecord` được áp dụng hai lần, THE kết quả SHALL bằng áp dụng một lần (Idempotent).
3. THE giá trị (value) của mỗi field SHALL bất biến qua normalize — chỉ key đổi, không đổi value.
4. THE helper SHALL xử lý nested record nông cần thiết (ví dụ `metadata`, `scoring`, `explanation`) theo mapping đã định, hoặc tài liệu hoá rõ phạm vi nông/sâu.

### Requirement 3: Không đổi content/seeder/DB; consumer opt-in

**User Story:** As a CTO / Tech Lead, I want shim không gây blast-radius, so that độ sạch tăng ở tầng code mà rủi ro bằng 0 cho data.

#### Acceptance Criteria

1. THE spec này SHALL KHÔNG sửa bất kỳ file nào trong `content/`.
2. THE spec này SHALL KHÔNG sửa Prisma schema, seeder, hay audio pipeline.
3. THE helper SHALL là opt-in: consumer hiện tại tiếp tục chạy như cũ; chỉ những nơi chủ động import shim mới đổi hành vi.
4. THE spec này SHALL áp dụng shim cho **ít nhất 1 consumer mẫu** (ví dụ `reading-client.tsx` đọc `word_count`) để chứng minh đường dùng, NHƯNG chỉ khi không gây regression (UI render giữ nguyên).
5. WHEN `pnpm typecheck` chạy, THE kết quả SHALL xanh.

### Requirement 4: Test & gate

**User Story:** As a QA Automation Engineer, I want test bảo chứng helper, so that contract được giữ.

#### Acceptance Criteria

1. THE spec SHALL thêm property-based test cho `normalizeContentRecord` (Spelling_Agnostic + Idempotent + value-invariance) ở `tests/content-audit/` hoặc package shared test.
2. WHEN `pnpm test:property` chạy, THE test mới SHALL pass và các test hiện có (gồm `tests/content-audit/*`) SHALL giữ xanh.
3. WHEN `pnpm qa:content` chạy, THE kết quả SHALL exit 0 (không regress; helper không đụng content).
4. IF consumer mẫu (Req 3.4) gây thay đổi hành vi render, THEN spec SHALL revert consumer đó và chỉ ship helper + test.
