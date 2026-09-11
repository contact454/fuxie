# Requirements Document

Vai chinh: Content QA / Linguistic Reviewer
Vai phoi hop: German Academic Lead

## Introduction

Đợt audit `fuxie-content-quality-audit` (read-only, `docs/content-quality/audit-2026-06/`) đã phát hiện **3 finding P0** về Genus enum sai trong nội dung học, tất cả nằm trong một file duy nhất: `content/a2/vocabulary/20-wetter-klima.json`. Ba danh từ giống cái (`Temperatur`, `Wolke`, `Jahreszeit`) được khai báo `"article": "FEMINUM"` — một lỗi chính tả của giá trị enum hợp lệ `FEMININ`. Giá trị `FEMINUM` không nằm trong enum `GENDERS = ['MASKULIN','FEMININ','NEUTRUM']` (`packages/shared/src/types/index.ts`), nên đây là dữ liệu Genus sai gây hại học tập (learner học sai quán từ) — backlog xếp **P0** theo `docs/intake/risk-register.md`.

Spec này là **spec remediation** đầu tiên xuất phát từ backlog audit (`RB-P0-01`). Mục tiêu rất hẹp: sửa đúng 3 giá trị `FEMINUM → FEMININ` trong một file, không đụng gì khác. Đây là sửa typo enum, KHÔNG đổi nghĩa, KHÔNG đổi schema, KHÔNG đổi Genus thực (cả 3 từ vốn đã là giống cái — `die Temperatur`, `die Wolke`, `die Jahreszeit`).

Phạm vi (in-scope):

- Sửa đúng 3 occurrence `"article": "FEMINUM"` → `"article": "FEMININ"` trong `content/a2/vocabulary/20-wetter-klima.json` (line 261 `Temperatur`, line 289 `Wolke`, line 404 `Jahreszeit`).
- Giữ `pnpm qa:content` (`scripts/content-qa.ts`) xanh (đang 0 lỗi).
- Đóng finding `RB-P0-01` (`F-0003`, `F-0004`, `F-0005`) trong audit backlog.

Phạm vi (out-of-scope):

- Mọi finding khác trong audit (P1 `PHRASE`, P2 schema drift) — spec riêng.
- Đổi enum `WORD_TYPES`/`GENDERS` trong code.
- Đổi nghĩa, ví dụ, bản dịch, plural, hay bất kỳ field nào ngoài `article` của 3 entry.
- Bất kỳ file content nào khác ngoài `content/a2/vocabulary/20-wetter-klima.json`.
- Migrate schema, đổi field naming.

Source-of-truth:

- `docs/content-quality/audit-2026-06/findings.csv` (findings `F-0003`, `F-0004`, `F-0005`).
- `docs/content-quality/audit-2026-06/remediation-backlog.md` (`RB-P0-01`).
- `packages/shared/src/types/index.ts` (`GENDERS = ['MASKULIN','FEMININ','NEUTRUM']`).
- `scripts/content-qa.ts` (gate kiểm content).
- `docs/intake/risk-register.md` § Risk Levels (định nghĩa P0).

## Glossary

- **Target_File**: File duy nhất trong scope sửa: `content/a2/vocabulary/20-wetter-klima.json`.
- **Genus_Enum**: Tập giá trị article hợp lệ `{MASKULIN, FEMININ, NEUTRUM}` định nghĩa bởi `GENDERS` trong `packages/shared/src/types/index.ts`. `FEMINUM` KHÔNG thuộc tập này.
- **Affected_Word**: Một trong 3 danh từ giống cái có `article="FEMINUM"`: `Temperatur` (line 261), `Wolke` (line 289), `Jahreszeit` (line 404).
- **Genus_Fix**: Thay đúng chuỗi `"article": "FEMINUM"` thành `"article": "FEMININ"`, không đổi byte nào khác của entry.
- **Content_QA_Gate**: Lệnh `pnpm qa:content` (chạy `scripts/content-qa.ts`). Baseline hiện tại: 0 lỗi, 0 cảnh báo trên 1193 file.
- **Audit_Finding**: Finding trong `docs/content-quality/audit-2026-06/findings.csv` — ở đây là `F-0003`, `F-0004`, `F-0005`.

## Requirements

### Requirement 1: Sửa 3 giá trị Genus enum sai

**User Story:** As a Content QA / Linguistic Reviewer, I want 3 giá trị `article="FEMINUM"` được sửa thành `FEMININ`, so that learner không học sai quán từ và dữ liệu Genus khớp enum hợp lệ.

#### Acceptance Criteria

1. WHEN spec này đóng, THE Target_File SHALL chứa `"article": "FEMININ"` cho entry `Temperatur` (thay cho `"article": "FEMINUM"`).
2. WHEN spec này đóng, THE Target_File SHALL chứa `"article": "FEMININ"` cho entry `Wolke` (thay cho `"article": "FEMINUM"`).
3. WHEN spec này đóng, THE Target_File SHALL chứa `"article": "FEMININ"` cho entry `Jahreszeit` (thay cho `"article": "FEMINUM"`).
4. WHEN spec này đóng, THE Target_File SHALL KHÔNG còn chứa chuỗi `FEMINUM` ở bất kỳ dòng nào.
5. THE toàn bộ content tree (`content/**/*.json`) SHALL KHÔNG còn chứa chuỗi `FEMINUM` ở bất kỳ file nào sau khi spec đóng.

### Requirement 2: Bảo toàn nội dung ngoài trường article

**User Story:** As a German Academic Lead, I want chỉ trường `article` của 3 entry thay đổi, so that nghĩa, ví dụ, bản dịch, và mọi field khác giữ nguyên.

#### Acceptance Criteria

1. THE Genus_Fix SHALL chỉ thay đổi giá trị của trường `article` của đúng 3 Affected_Word; KHÔNG thay đổi `word`, `plural`, `wordType`, `meaningVi`, `meaningEn`, `meaningDe`, `exampleSentence*`, `exampleTranslation*`, `imageUrl`, hay bất kỳ field nào khác.
2. THE Target_File SHALL giữ nguyên thứ tự entry và cấu trúc JSON (chỉ đổi 3 giá trị string `FEMINUM` → `FEMININ`).
3. THE giá trị `FEMININ` mới SHALL khớp Genus thực của cả 3 danh từ (đều giống cái: `die Temperatur`, `die Wolke`, `die Jahreszeit`) — German Academic Lead xác nhận trong PR.
4. THE PR SHALL chỉ thay đổi đúng 1 file: `content/a2/vocabulary/20-wetter-klima.json`.
5. IF reviewer phát hiện thay đổi trên file khác ngoài Target_File, THEN reviewer SHALL block merge cho tới khi loại bỏ thay đổi đó.

### Requirement 3: Gate và đóng finding

**User Story:** As a Project Manager / Delivery Manager, I want gate content xanh và finding audit được đóng, so that remediation truy vết được về audit nguồn.

#### Acceptance Criteria

1. WHEN `pnpm qa:content` chạy sau khi spec đóng, THE Content_QA_Gate SHALL exit 0 với 0 lỗi (không regress baseline).
2. THE Target_File SHALL vẫn parse được như JSON hợp lệ sau khi sửa.
3. WHEN spec đóng, THE 3 Audit_Finding (`F-0003`, `F-0004`, `F-0005`) SHALL được đánh dấu resolved trong `docs/content-quality/audit-2026-06/remediation-backlog.md` (`RB-P0-01` → resolved), kèm tham chiếu commit/PR.
4. THE spec này SHALL KHÔNG sửa `scripts/content-qa.ts` hay bất kỳ enum/type nào trong code.
5. IF sau khi sửa, một verifier quét `content/**` vẫn tìm thấy `FEMINUM`, THEN spec SHALL không được tag Done.
