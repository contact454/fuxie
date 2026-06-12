# Requirements Document

Vai chinh: CTO / Tech Lead
Vai phoi hop: German Academic Lead, Content QA / Linguistic Reviewer

## Introduction

Đợt audit `fuxie-content-quality-audit` (`docs/content-quality/audit-2026-06/`) đã ghi nhận backlog `RB-P1-01`: **23 entry vocabulary** ở c1/c2 (và 2 ở a2) có `"wordType": "PHRASE"`, nhưng enum TypeScript `WORD_TYPES` trong `packages/shared/src/types/index.ts` KHÔNG chứa `PHRASE`. Điều tra code cho thấy đây là **desync giữa các nguồn enum**, không phải lỗi data:

- **Prisma DB enum `WordType`** (`packages/database/prisma/schema.prisma:64–76`) **ĐÃ có `PHRASE`** (line 75). DB chấp nhận giá trị này.
- **Script `scripts/fix-c2-vocab-quality.ts`** liệt kê `PHRASE` trong `VALID_WORD_TYPES` và dùng làm fallback hợp lệ; `scripts/fix-c1-vocab-quality.ts` remap `PRÄPOSITIONALPHRASE → PHRASE`.
- **Content data** (23 entry) dùng `PHRASE` nhất quán cho các cụm cố định / thành ngữ (`per se`, `sui generis`, `mutatis mutandis`, `im Spannungsfeld`, …) — đúng về mặt ngôn ngữ cho từ vựng C1/C2.
- **DUY NHẤT** `packages/shared/src/types/index.ts` (`WORD_TYPES`) lạc hậu, thiếu `PHRASE`. Hệ quả: `WordTypeSchema = z.enum(WORD_TYPES)` (`packages/shared/src/validators/index.ts:19`) sẽ **reject** dữ liệu hợp lệ mà DB và content đều chấp nhận.

Spec này là **engineering reconciliation** thuần: đồng bộ TS enum `WORD_TYPES` thành source-of-truth khớp với Prisma DB enum và content thật bằng cách **thêm `PHRASE`**. Đây là quyết định kiến trúc/type (CTO/Tech Lead owns), với German Academic Lead xác nhận `PHRASE` là một wordType ngôn ngữ hợp lệ và Content QA xác nhận 23 entry dùng đúng.

Phạm vi (in-scope):

- Thêm `'PHRASE'` vào mảng `WORD_TYPES` trong `packages/shared/src/types/index.ts` để khớp Prisma enum `WordType`.
- Đảm bảo `WordTypeSchema` (z.enum) chấp nhận `PHRASE` (tự động khi enum được mở rộng — không sửa validator riêng).
- Giữ `pnpm qa:content` xanh và `pnpm typecheck` xanh.
- Đóng finding `RB-P1-01` (`F-0001`, `F-0002`, `F-0006`…`F-0026`) trong audit backlog.

Phạm vi (out-of-scope):

- KHÔNG đổi giá trị `wordType` của bất kỳ content entry nào (data đã đúng; chỉ type lạc hậu).
- KHÔNG đổi Prisma schema (đã có `PHRASE`); KHÔNG migration DB.
- KHÔNG sửa `scripts/fix-c1-vocab-quality.ts` / `fix-c2-vocab-quality.ts` (đã coi `PHRASE` hợp lệ).
- KHÔNG đụng finding khác của audit (P0 Genus đã xong; P2 schema drift; Layer 2 pending).
- KHÔNG thêm wordType mới ngoài `PHRASE`.

Source-of-truth:

- `packages/shared/src/types/index.ts` (`WORD_TYPES` — file cần sửa).
- `packages/shared/src/validators/index.ts` (`WordTypeSchema = z.enum(WORD_TYPES)`).
- `packages/database/prisma/schema.prisma` (`enum WordType` đã có `PHRASE`, line 64–76 — reference, không sửa).
- `scripts/fix-c2-vocab-quality.ts` (`VALID_WORD_TYPES` đã có `PHRASE` — reference).
- `docs/content-quality/audit-2026-06/findings.csv` + `remediation-backlog.md` (`RB-P1-01`).

## Glossary

- **TS_Enum**: Mảng `WORD_TYPES` (as const) trong `packages/shared/src/types/index.ts`, nguồn cho type `WordType` và `WordTypeSchema`. Hiện có 10 giá trị, thiếu `PHRASE`.
- **DB_Enum**: Prisma enum `WordType` trong `schema.prisma` (line 64–76). Có 11 giá trị **gồm `PHRASE`**.
- **WordType_Schema**: `WordTypeSchema = z.enum(WORD_TYPES)` trong `packages/shared/src/validators/index.ts`. Validate input API; hiện reject `PHRASE`.
- **Phrase_Entry**: Một entry vocabulary có `"wordType": "PHRASE"`. Có 23 entry trên 17 file (a2 ×2, c1 ×7, c2 ×14 occurrence).
- **Enum_Parity**: Tình trạng TS_Enum và DB_Enum có cùng tập giá trị (sau spec: cả hai 11 giá trị gồm `PHRASE`).
- **Content_QA_Gate**: `pnpm qa:content` (`scripts/content-qa.ts`). Baseline: 0 lỗi.
- **Typecheck_Gate**: `pnpm typecheck`. Phải xanh sau khi mở rộng enum.

## Requirements

### Requirement 1: Đồng bộ TS_Enum với DB_Enum (thêm `PHRASE`)

**User Story:** As a CTO / Tech Lead, I want TS enum `WORD_TYPES` khớp với Prisma DB enum `WordType`, so that validator không reject dữ liệu hợp lệ mà DB và content đều chấp nhận.

#### Acceptance Criteria

1. WHEN spec này đóng, THE TS_Enum (`WORD_TYPES` trong `packages/shared/src/types/index.ts`) SHALL chứa giá trị `'PHRASE'`.
2. THE tập giá trị của TS_Enum sau spec SHALL bằng đúng tập giá trị của DB_Enum (`WordType` trong `schema.prisma`): `{NOMEN, VERB, ADJEKTIV, ADVERB, PRAEPOSITION, KONJUNKTION, PRONOMEN, ARTIKEL, PARTIKEL, NUMERALE, PHRASE}` — Enum_Parity đạt.
3. THE thay đổi SHALL chỉ thêm `'PHRASE'` vào mảng `WORD_TYPES`; KHÔNG xóa, rename, hay đổi thứ tự các giá trị hiện có.
4. WHEN `WordTypeSchema` được dùng để validate một input `wordType = "PHRASE"`, THE schema SHALL chấp nhận (parse thành công) thay vì reject.
5. THE spec này SHALL KHÔNG sửa Prisma `schema.prisma` (DB_Enum đã đúng) và SHALL KHÔNG chạy DB migration.

### Requirement 2: Không đổi content data

**User Story:** As a Content QA / Linguistic Reviewer, I want 23 Phrase_Entry giữ nguyên giá trị, so that fix là ở type layer chứ không phải data.

#### Acceptance Criteria

1. THE spec này SHALL KHÔNG đổi giá trị `wordType` của bất kỳ entry nào trong `content/**`.
2. THE 23 Phrase_Entry SHALL giữ nguyên `"wordType": "PHRASE"` sau spec.
3. WHEN `pnpm qa:content` chạy sau spec, THE Content_QA_Gate SHALL exit 0 (không regress baseline 0 lỗi).
4. THE German Academic Lead SHALL xác nhận trong PR rằng `PHRASE` là wordType ngôn ngữ hợp lệ cho cụm cố định / thành ngữ ở C1/C2 (ví dụ `per se`, `sui generis`, `mutatis mutandis`).

### Requirement 3: Gate type và đóng finding

**User Story:** As a CTO / Tech Lead, I want typecheck xanh và finding audit được đóng, so that thay đổi an toàn và truy vết được.

#### Acceptance Criteria

1. WHEN `pnpm typecheck` chạy sau spec, THE Typecheck_Gate SHALL xanh (type `WordType` giờ gồm `'PHRASE'`, không gây lỗi ở consumer).
2. THE thay đổi SHALL chỉ chạm file `packages/shared/src/types/index.ts` (validator tự kế thừa qua `z.enum(WORD_TYPES)`; KHÔNG sửa `validators/index.ts` trừ khi typecheck yêu cầu, và nếu có thì chỉ ở mức tối thiểu).
3. WHEN spec đóng, THE finding `RB-P1-01` (`F-0001`, `F-0002`, `F-0006`–`F-0026`) SHALL được đánh dấu resolved trong `docs/content-quality/audit-2026-06/remediation-backlog.md`, kèm ghi chú root cause "TS enum desync — DB đã có PHRASE".
4. IF việc thêm `PHRASE` làm bất kỳ test/consumer nào fail (ví dụ một `switch` exhaustiveness trên `WordType`), THEN THE spec SHALL xử lý consumer đó ở mức tối thiểu (thêm case) trước khi tag Done, và liệt kê consumer bị ảnh hưởng trong PR.
5. THE spec này SHALL KHÔNG weaken/skip bất kỳ gate nào (`qa:content`, `typecheck`, `test:property`).
