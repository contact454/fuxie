# Requirements Document

## Introduction

Spec `gamified-ui-asset-rollout` đã đóng với CI gate `pnpm check:quick` enforcing hai contract qua `scripts/check-locale-parity.ts`: (1) **locale parity** giữa `apps/web/messages/vi.json` và `apps/web/messages/de.json`, và (2) **t() discipline** — mọi learner-facing string trong `apps/web/src/**/*.tsx` phải đi qua `t(...)` của next-intl. Half (1) hiện tại pass (vi=180 keys ⇄ de=180 keys). Half (2) đang fail trên đúng **5 vi phạm** tập trung trong một file duy nhất: `apps/web/src/components/writing/writing-player.tsx`.

Spec này là follow-up risk **R-locale parity** — một trong 3 follow-up sau khi gamified rollout đóng. Mục tiêu rất hẹp và cụ thể: wrap đúng 5 string Việt còn sót vào `t()`, thêm key tương ứng vào cả `vi.json` và `de.json`, và đảm bảo bản dịch tiếng Đức được Vietnamese-German Localization Specialist (chính) hoặc German Content Writer (phối hợp) review thay vì auto-translate raw — vì đây là copy hiển thị trên surface CEFR-graded mà learner đọc trực tiếp.

Phạm vi (in-scope):

- 5 vi phạm hiện có trong `apps/web/src/components/writing/writing-player.tsx`:
  - line 622, `[jsx-text]`: "Đề bài"
  - line 658, `[jsx-text]`: "Biểu đồ"
  - line 666, `[jsx-text]`: "📋 Ý cần viết:"
  - line 722, `[jsx-attr]`: `placeholder="Viết bài của em tại đây..."`
  - line 760, `[jsx-text]`: "Nộp bài →"
- Thêm key mới vào cả `apps/web/messages/vi.json` và `apps/web/messages/de.json` dưới namespace `WritingPlayer`.
- Translation_Review trên các giá trị tiếng Đức mới trước khi merge.
- Giữ `pnpm check:locale-parity` xanh (cả 2 half), giữ `tests/locale-parity.spec.ts` (21 property test ở `numRuns: 100`) xanh.
- Đảm bảo `pnpm check:quick` exit 0 end-to-end sau khi spec này, `asset-registry-cleanup`, và `visual-qa-screenshot-capture` cùng merge.

Phạm vi (out-of-scope):

- Hardcoded asset paths và asset audit coverage (covered by sibling spec `asset-registry-cleanup`).
- Visual QA screenshot capture (covered by sibling spec `visual-qa-screenshot-capture`).
- Adding new learner-facing copy beyond the 5 violations đã liệt kê.
- Refactoring chính `scripts/check-locale-parity.ts` hoặc `tests/locale-parity.spec.ts`.
- Bổ sung locale thứ ba (chỉ vi + de).
- Rephrase / rewrite tiếng Việt nguồn (Source_Locale text được giữ nguyên verbatim).

Source-of-truth tài liệu:

- `scripts/check-locale-parity.ts` (script đang ship; expose `flattenLocaleJson`, `checkLocaleParityFromJson`, `looksLikeLearnerCopy`, `isInsideTCall`, `classifyLocaleKey`, `validateLocaleValueLength`, hằng số `KEY_KIND_MIN_LENGTH`, `KEY_KIND_MAX_LENGTH`, `LEARNER_ATTRS`, `ALLOW_COMMENT = '// locale-allow'`).
- `tests/locale-parity.spec.ts` (21 property test, `numRuns: 100`, đang green).
- `apps/web/messages/vi.json`, `apps/web/messages/de.json` (namespace.leaf shape, ví dụ `Dashboard.greetingDefault`, `SkillPlayer.continueLabel`).
- `apps/web/src/components/writing/writing-player.tsx` (target file).
- `docs/design/release/gamified-ui-asset-rollout-dod.md` (Risk R1 ghi rõ follow-up này).

## Glossary

- **Locale_File**: Một file JSON lưu message dịch cho một locale duy nhất. Trong scope của spec này có đúng 2 Locale_File: `apps/web/messages/vi.json` (Source_Locale) và `apps/web/messages/de.json` (Target_Locale). Cấu trúc là JSON tree lồng theo namespace, lá là string.
- **Source_Locale**: `vi` (tiếng Việt). Mọi key mới được thêm trong spec này SHALL có giá trị tiếng Việt được copy verbatim từ literal đang hardcode trong `writing-player.tsx`, không rephrase.
- **Target_Locale**: `de` (tiếng Đức). Mọi key mới SHALL có giá trị tiếng Đức được Translation_Review xác nhận trước khi merge.
- **Key_Path**: Chuỗi định danh leaf trong Locale_File theo dạng dotted, ví dụ `WritingPlayer.promptHeader`. Namespace SHALL viết PascalCase, leaf SHALL viết camelCase, để khớp shape hiện có (`Dashboard.greetingDefault`, `SkillPlayer.continueLabel`).
- **t_Call**: Lời gọi hàm `t(...)` của next-intl trong file `.tsx`, dùng để resolve một Key_Path tại runtime sang chuỗi locale tương ứng. Ví dụ: `t('promptHeader')` bên trong scope `useTranslations('WritingPlayer')`. Phát hiện qua heuristic `isInsideTCall` của `scripts/check-locale-parity.ts`.
- **Allow_Comment**: Comment `// locale-allow` đặt cuối dòng để opt-out một literal khỏi t() lint. Spec này SHALL không thêm Allow_Comment mới — 5 vi phạm đều là learner copy thật, phải đi qua Locale_File.
- **Learner_Copy**: Chuỗi text learner đọc thấy trực tiếp trên UI. Heuristic `looksLikeLearnerCopy` flag string nếu chứa diacritic Việt/Đức HOẶC có ≥ 3 từ.
- **Translation_Review**: Quy trình mà Vietnamese-German Localization Specialist (vai chính) hoặc German Content Writer (vai phối hợp) đọc giá trị Target_Locale mới, xác nhận: (a) nghĩa nguồn được bảo toàn, (b) tiếng Đức tự nhiên ở mức CEFR phù hợp surface Writing, (c) không có false friend.
- **Property_Suite**: 21 property test trong `tests/locale-parity.spec.ts` chạy với `numRuns: 100`, validate contract của parity script. Spec này SHALL không thay đổi suite này; chỉ phải giữ xanh.
- **Writing_Player**: Component React tại `apps/web/src/components/writing/writing-player.tsx`. Là component duy nhất trong scope chỉnh sửa source code của spec này.
- **Parity_Gate**: Lệnh `pnpm check:locale-parity` (chạy bởi `scripts/check-locale-parity.ts`). Bao gồm cả half locale parity và half t() discipline.
- **Quick_Check**: Lệnh `pnpm check:quick` chuỗi gate trên CI, bao gồm Parity_Gate là một mắt xích.

## Requirements

### Requirement 1: t() wrapping cho 5 vi phạm hiện có trong Writing_Player

**User Story:** As a Vietnamese-German Localization Specialist, I want every learner-facing string in `writing-player.tsx` đi qua next-intl `t()`, so that copy có thể được dịch và CI gate không còn bị block.

#### Acceptance Criteria

1. WHEN spec này merge, THE Writing_Player SHALL không chứa string literal "Đề bài" như JSX text node ở dòng nào.
2. WHEN spec này merge, THE Writing_Player SHALL không chứa string literal "Biểu đồ" như JSX text node ở dòng nào.
3. WHEN spec này merge, THE Writing_Player SHALL không chứa string literal "Ý cần viết:" như JSX text node ở dòng nào (emoji "📋" được phép giữ inline trong JSX cùng với t_Call cho phần text).
4. WHEN spec này merge, THE Writing_Player SHALL không chứa JSX attribute literal `placeholder="Viết bài của em tại đây..."` ở dòng nào.
5. WHEN spec này merge, THE Writing_Player SHALL không chứa string literal "Nộp bài" như JSX text node độc lập (mũi tên "→" được phép giữ inline trong JSX cùng với t_Call cho phần text).
6. THE Writing_Player SHALL resolve mỗi giá trị copy ở Acceptance Criteria 1 đến 5 qua đúng một t_Call dùng namespace `WritingPlayer` của next-intl, KHÔNG dùng concat string ở runtime để tái tạo nội dung literal.
7. THE Writing_Player SHALL không chứa Allow_Comment (`// locale-allow`) mới được thêm bởi spec này.
8. WHEN `pnpm check:locale-parity` chạy với scan root mặc định `apps/web/src/`, THE Parity_Gate SHALL exit 0 trên half t() discipline (zero hardcoded learner-string violation).

### Requirement 2: Key_Path và namespace conventions

**User Story:** As a Frontend Engineer maintaining message files, I want key mới tuân theo convention `Namespace.leaf` đang dùng, so that keys không bị scatter và search/diff dễ đọc.

#### Acceptance Criteria

1. THE 5 Key_Path mới được thêm SHALL nằm dưới đúng một namespace `WritingPlayer`.
2. THE 5 Key_Path mới SHALL có leaf segment viết camelCase (chữ cái đầu thường, không underscore, không dấu cách): `promptHeader`, `grafikLabel`, `contentPointsHeader`, `draftPlaceholder`, `submitLabel`.
3. THE namespace `WritingPlayer` SHALL viết PascalCase và xuất hiện như object key cấp 1 (top-level) trong cả `vi.json` và `de.json`.
4. THE 5 Key_Path mới SHALL không trùng tên với bất kỳ Key_Path nào đã tồn tại trong `vi.json` hoặc `de.json` trước khi spec này merge.
5. WHEN một component render Writing_Player, THE Writing_Player SHALL gọi `useTranslations('WritingPlayer')` và resolve các leaf qua `t('promptHeader')`, `t('grafikLabel')`, `t('contentPointsHeader')`, `t('draftPlaceholder')`, `t('submitLabel')`; giá trị Source_Locale tương ứng SHALL bằng đúng:
   - `promptHeader` → "Đề bài"
   - `grafikLabel` → "Biểu đồ"
   - `contentPointsHeader` → "Ý cần viết:"
   - `draftPlaceholder` → "Viết bài của em tại đây..."
   - `submitLabel` → "Nộp bài"
6. IF một Key_Path trong `WritingPlayer` được đặt với leaf chứa ký tự ngoài bộ `[A-Za-z0-9]` hoặc bắt đầu bằng chữ in hoa, THEN THE PR SHALL bị reviewer reject trước khi merge.

### Requirement 3: Locale parity giữa vi.json và de.json

**User Story:** As a Vietnamese-German Localization Specialist, I want mọi Key_Path trong vi.json đều có cặp trong de.json (và ngược lại), so that learner ở cả hai locale đều thấy text thay vì missing-key fallback.

#### Acceptance Criteria

1. THE `vi.json` SHALL chứa đúng 5 Key_Path mới thuộc namespace `WritingPlayer`: `WritingPlayer.promptHeader`, `WritingPlayer.grafikLabel`, `WritingPlayer.contentPointsHeader`, `WritingPlayer.draftPlaceholder`, `WritingPlayer.submitLabel`.
2. THE `de.json` SHALL chứa đúng 5 Key_Path mới thuộc namespace `WritingPlayer` với cùng dotted path như Acceptance Criterion 1.
3. WHEN `flattenLocaleJson` được gọi trên cả hai Locale_File sau khi spec merge, THE set Key_Path của `vi.json` và `de.json` SHALL bằng nhau (set equality), tức không có Key_Path nào tồn tại ở đúng một Locale_File.
4. THE giá trị string của 5 Key_Path mới trong cả vi.json và de.json SHALL không phải empty và không phải whitespace-only (`value.trim().length > 0`).
5. WHEN `pnpm check:locale-parity` chạy với input mặc định, THE Parity_Gate SHALL exit 0 trên half locale parity với key count vi = key count de.
6. THE `vi.json` SHALL preserve verbatim các giá trị literal đang hardcode trong Writing_Player ở thời điểm spec mở, cụ thể không chỉnh dấu, dấu câu, viết hoa, hay khoảng trắng đầu/cuối, ngoại trừ đối với `contentPointsHeader` và `submitLabel` thì giá trị SHALL không bao gồm các glyph trang trí inline ("📋 " ở đầu của `contentPointsHeader`, " →" ở cuối của `submitLabel`) — các glyph đó được giữ inline trong JSX của Writing_Player.

### Requirement 4: Translation_Review cho giá trị Target_Locale

**User Story:** As a Vietnamese-German Localization Specialist (vai chính), I want bản dịch tiếng Đức được review bởi role có thẩm quyền localization thay vì paste thẳng từ máy dịch, so that learner trên CEFR-graded surface không gặp tiếng Đức gượng ép.

#### Acceptance Criteria

1. THE 5 giá trị tiếng Đức mới trong `de.json` SHALL được review và sign-off bởi Vietnamese-German Localization Specialist; IF specialist không khả dụng, THEN German Content Writer SHALL review thay (vai phối hợp). PR description SHALL ghi rõ tên/role đã sign-off.
2. THE giá trị tiếng Đức `WritingPlayer.promptHeader` SHALL là một danh từ hoặc cụm danh từ tự nhiên dùng làm header cho phần đề bài viết (proposal: "Aufgabenstellung"; final wording do Translation_Review chốt).
3. THE giá trị tiếng Đức `WritingPlayer.grafikLabel` SHALL là từ "Grafik" hoặc một biến thể xác nhận bởi Translation_Review để label phần biểu đồ trên UI Writing.
4. THE giá trị tiếng Đức `WritingPlayer.contentPointsHeader` SHALL là một header tự nhiên dịch nghĩa "things to write about" (proposal: "Inhaltspunkte:"; final wording do Translation_Review chốt) và SHALL không bao gồm emoji "📋".
5. THE giá trị tiếng Đức `WritingPlayer.draftPlaceholder` SHALL là một câu placeholder tự nhiên cho textarea draft, dùng "du" (informal) để khớp tone learner-friendly đang dùng (proposal: "Schreibe deinen Text hier..."; final wording do Translation_Review chốt).
6. THE giá trị tiếng Đức `WritingPlayer.submitLabel` SHALL là một động từ/cụm động từ ngắn ≤ 20 ký tự cho nút submit (proposal: "Einreichen"; final wording do Translation_Review chốt) và SHALL không bao gồm glyph "→".
7. THE giá trị tiếng Đức của 5 Key_Path mới SHALL được kiểm CEFR-appropriateness ở mức A2-B1 (mức target chính của Writing surface) — không từ chuyên biệt hiếm gặp, không câu phức tạp ≥ 2 mệnh đề phụ.
8. IF một giá trị Target_Locale chưa qua Translation_Review tại thời điểm submit PR, THEN PR SHALL không được merge — reviewer SHALL block merge.

### Requirement 5: Property_Suite và Quick_Check phải giữ xanh

**User Story:** As a Frontend Engineer, I want toàn bộ contract test đang ship của parity script tiếp tục pass sau spec này, so that spec không vô tình rớt regression.

#### Acceptance Criteria

1. WHEN `pnpm check:locale-parity` chạy sau khi spec merge, THE Parity_Gate SHALL exit 0 (cả half locale parity và half t() discipline).
2. WHEN `tests/locale-parity.spec.ts` chạy với cấu hình hiện tại (`numRuns: 100`), THE Property_Suite SHALL có đúng 21 test passing và 0 test failing.
3. WHEN `pnpm check:quick` chạy sau khi spec này, sibling spec `asset-registry-cleanup`, và sibling spec `visual-qa-screenshot-capture` đều merge, THE Quick_Check SHALL exit 0 end-to-end.
4. THE spec này SHALL không sửa file `scripts/check-locale-parity.ts`.
5. THE spec này SHALL không sửa file `tests/locale-parity.spec.ts`.
6. IF sau khi sửa Writing_Player, scan của Parity_Gate phát hiện thêm hardcoded learner-string violation mới (regression do spec này tạo ra), THEN PR SHALL bị reviewer reject trước khi merge.

### Requirement 6: Tôn trọng inline glyph và emoji trên UI

**User Story:** As a Frontend Engineer, I want emoji và arrow glyph trên UI Writing được giữ visually như cũ, so that thị giác của Writing_Player không thay đổi sau khi wrap t().

#### Acceptance Criteria

1. WHEN learner mở Writing_Player ở locale `vi`, THE Writing_Player SHALL render emoji "📋" liền kề bên trái text "Ý cần viết:" với khoảng cách thị giác tương đương trước khi spec merge (emoji giữ inline trong JSX, không nằm trong giá trị t).
2. WHEN learner mở Writing_Player ở locale `vi`, THE Writing_Player SHALL render glyph "→" liền kề bên phải text "Nộp bài" trên submit button với khoảng cách thị giác tương đương trước khi spec merge (arrow giữ inline trong JSX, không nằm trong giá trị t).
3. WHEN learner mở Writing_Player ở locale `de`, THE Writing_Player SHALL render emoji "📋" liền kề bên trái giá trị t Target_Locale của `contentPointsHeader` (Translation_Review-approved wording) ở cùng vị trí thị giác như locale `vi`.
4. WHEN learner mở Writing_Player ở locale `de`, THE Writing_Player SHALL render glyph "→" liền kề bên phải giá trị t Target_Locale của `submitLabel` (Translation_Review-approved wording) trên submit button ở cùng vị trí thị giác như locale `vi`.
5. THE Writing_Player SHALL không inline emoji hoặc glyph khác trên 5 vùng đã wrap t() ngoài "📋" cho `contentPointsHeader` và "→" cho `submitLabel`.

### Requirement 7: Phạm vi sửa file giới hạn ở Writing_Player và Locale_File

**User Story:** As a Project Manager / Delivery Manager, I want spec này có blast radius nhỏ và predictable, so that risk không lan ra component khác và rollback nếu cần thì sạch.

#### Acceptance Criteria

1. THE PR thực thi spec này SHALL chỉ thay đổi nội dung của 3 file: `apps/web/src/components/writing/writing-player.tsx`, `apps/web/messages/vi.json`, `apps/web/messages/de.json`.
2. THE PR thực thi spec này SHALL không xóa Key_Path nào hiện có trong `vi.json` hoặc `de.json`.
3. THE PR thực thi spec này SHALL không sửa giá trị string của bất kỳ Key_Path nào hiện có (180 keys hiện tại) trong `vi.json` hoặc `de.json`.
4. THE PR thực thi spec này SHALL không thay đổi cấu hình next-intl, không thêm locale mới ngoài `vi` và `de`, không sửa file CI workflow `.github/workflows/ci.yml`.
5. IF reviewer phát hiện thay đổi trên file ngoài 3 file ở Acceptance Criterion 1, THEN reviewer SHALL block merge cho tới khi thay đổi đó hoặc được nhập vào sibling spec phù hợp, hoặc được loại khỏi PR này.
6. WHEN spec này merge, THE total Key_Path count trong mỗi Locale_File SHALL bằng đúng 185 (180 cũ + 5 mới).
