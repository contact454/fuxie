# Requirements Document

Vai chinh: Frontend Engineer
Vai phoi hop: Design System Designer, Project Manager / Delivery Manager

## Introduction

Spec `gamified-ui-asset-rollout` đã đóng và ship một CI gate `pnpm check:quick` chain qua `lint:asset-paths` → `check:asset-integrity` → `check:asset-audit` → `check:locale-parity` → `check:state-shell-coverage` → `test:property` (xem `.github/workflows/ci.yml`). Gate đó hiện đang **fail trên `main`** vì hai khoản nợ codebase đã được spec mẹ xác định trong DoD pack `docs/design/release/gamified-ui-asset-rollout-dod.md` dưới dạng Risk R1 + Risk R2:

- **Risk R1 — Hardcoded asset paths**: 5 vị trí literal `/mascot-3d/...` còn sót lại trong `apps/web/src/**/*.tsx` không đi qua Asset Registry helper, làm `pnpm lint:asset-paths` exit non-zero.
- **Risk R2 — Asset audit coverage 23.08%**: chỉ 24/104 file optimized được Asset Registry tham chiếu, có 8 forbidden refs trong `FUXIE_FOUNDATION_ASSETS` trỏ vào `/mascot-3d/foundation/`, và 80 file optimized không được component nào tham chiếu cũng chưa archive — làm `pnpm check:asset-audit` exit non-zero (coverage < 95%, có orphans, có forbidden refs).

Feature này KHÔNG sinh asset mới, KHÔNG đổi UX/UI, KHÔNG thay đổi public API của Asset Registry, KHÔNG đụng vào locale parity (đã được tách thành sibling spec `learner-copy-localization-backfill`) và KHÔNG đụng vào visual QA screenshot capture (sibling spec `visual-qa-screenshot-capture`). Mục tiêu duy nhất là dọn nợ kỹ thuật vừa đủ để gate `pnpm check:quick` exit 0 end-to-end trên fresh checkout, và 295 property tests trong `tests/**/*.spec.{ts,tsx}` vẫn xanh.

Mục tiêu chính:

1. Đưa `pnpm lint:asset-paths` về exit 0 bằng cách wire 5 hardcoded path qua Asset Registry helper, hoặc annotate `// asset-registry-allow` cho các trường hợp dev-only hợp lệ kèm justification.
2. Đưa `pnpm check:asset-audit` về exit 0: coverage ≥ 95%, 0 orphans, 0 forbidden refs vào `raw|concept|foundation|reference-parts`, 0 optimized-preference issues.
3. Đưa `pnpm check:quick` về exit 0 end-to-end trên fresh checkout, không regress 295 property tests đã ship.
4. Tái sử dụng (KHÔNG re-implement) helpers thuần đã có: `findForbiddenLiterals`, `isExcludedBasename`, `EXCLUDED_BASENAMES`, `ALLOW_COMMENT` trong `scripts/lint-asset-registry-references.ts`; `computeCoverage`, `findOrphans`, `findForbiddenRefs`, `findOptimizedPreferenceIssues`, `auditInvariant`, `COVERAGE_THRESHOLD`, `FORBIDDEN_FOLDER_TOKENS` trong `scripts/asset-audit-core.ts`; helper map + `PLACEHOLDER_ASSET` trong `apps/web/src/lib/mascot/fuxie-assets.ts`; `pickWorldProp`/world-tag map trong `fuxie-world-tags.ts`. Bug `Object.prototype.hasOwnProperty.call` totality fix giữ nguyên.

Phạm vi (in-scope):

- 5 vị trí literal asset path còn sót đo được tại commit hiện tại của `main`:
  - `apps/web/src/components/gamification/fuxie-live-3d.tsx:445` → `/mascot-3d/imagegen-fullbody/v10`
  - `apps/web/src/components/onboarding/OnboardingWizard.tsx:242` → `/mascot-3d/states/global/fuxie-global-fuxie-auth-welcomer.webp`
  - `apps/web/src/components/onboarding/OnboardingWizard.tsx:492` → `/mascot-3d/states/v2/fuxie-state-result-celebration-512.webp`
  - `apps/web/src/components/shared/InstallPrompt.tsx:76` → `/mascot-3d/states/global/fuxie-global-fuxie-auth-welcomer.webp`
  - `apps/web/src/components/shared/mobile-shell.tsx:83` → `/mascot-3d/states/global/fuxie-global-fuxie-auth-welcomer.webp`
- 8 forbidden refs trong `FUXIE_FOUNDATION_ASSETS` (các value trỏ vào `/mascot-3d/foundation/v1/...`).
- 80 file optimized hiện không được Asset Registry tham chiếu trong các root mà `pnpm check:asset-audit` quét: `apps/web/public/mascot-3d/optimized/`, `apps/web/public/mascot-3d/world/optimized/`, `apps/web/public/mascot-3d/ui/optimized/`, `apps/web/public/reward-assets/optimized/`.
- File `docs/design/asset-archive.md` (format `Path | Reason | Archived by | Date` đã có từ task 2.4 spec mẹ).

Phạm vi (out-of-scope):

- Sinh asset mới hoặc tinh chỉnh visual của asset đã có.
- Thay đổi public API của Asset Registry helpers (`getFuxieMascotSrc`, `getFuxieWorldPropSrc`, `getFuxieUiFrameSrc`, `getFuxieModuleMascotSrc`, `getFuxieGameMascotSrc`, `getFuxieFoundationAssetSrc`, `getFuxieLiving3dAsset`, `getRewardAssetSrc`, `getShopItemAssetSrc`, `getCefrBadgeAssetSrc`, `pickWorldProp`).
- Thay đổi 7 typed registry maps (`FUXIE_3D_ASSETS`, `FUXIE_MASCOT_STATES`, `FUXIE_MODULE_MASCOTS`, `FUXIE_WORLD_PROPS`, `FUXIE_UI_FRAMES`, `FUXIE_LIVING_3D_ASSETS`, `REWARD_ASSETS`) ở mức cấu trúc — chỉ thêm key mới hoặc relocate value, không xóa key đang được consumer sử dụng.
- Locale parity / `t()` discipline cleanup → sibling spec `learner-copy-localization-backfill`.
- Visual QA screenshot capture → sibling spec `visual-qa-screenshot-capture`.
- Bất kỳ refactor nào của 295 property tests đã ship; spec này chỉ duy trì tính xanh.

Source-of-truth tài liệu:

- `.kiro/specs/gamified-ui-asset-rollout/requirements.md` (Requirement 1 Asset Registry, Requirement 2 Coverage/Orphan, đặc biệt Req 1.3, 1.5, 2.1, 2.3, 2.5).
- `.kiro/specs/gamified-ui-asset-rollout/design.md` (§A Asset Registry, §A.1 World Prop tags).
- `docs/design/release/gamified-ui-asset-rollout-dod.md` (Risk R1, R2 — bối cảnh nợ kỹ thuật).
- `docs/design/asset-archive.md` (format và ownership convention).
- `scripts/lint-asset-registry-references.ts`, `scripts/asset-audit.ts`, `scripts/asset-audit-core.ts` (helpers tái sử dụng).

## Glossary

- **Asset_Registry**: Tập hợp 7 typed map (`FUXIE_3D_ASSETS`, `FUXIE_MASCOT_STATES`, `FUXIE_MODULE_MASCOTS`, `FUXIE_WORLD_PROPS`, `FUXIE_UI_FRAMES`, `FUXIE_LIVING_3D_ASSETS`, `REWARD_ASSETS`) cộng với `FUXIE_FOUNDATION_ASSETS` và `FUXIE_GAMIFICATION_MASCOTS` được khai báo trong `apps/web/src/lib/mascot/fuxie-assets.ts` và `apps/web/src/components/gamification/reward-assets.ts`. Mỗi map là object literal với key string-literal và value là path string trỏ tới file dưới `apps/web/public/`.
- **Asset_Key**: Chuỗi định danh asset trong Asset_Registry (ví dụ `"villageSquare"`, `"resultCelebration"`, `"fucoinReward"`). Component KHÔNG được embed path string `/mascot-3d/...` hay `/reward-assets/...` mà phải gọi qua Asset_Key.
- **Asset_Registry_Helper**: Một trong các hàm thuần `getFuxieMascotSrc`, `getFuxieWorldPropSrc`, `getFuxieUiFrameSrc`, `getFuxieModuleMascotSrc`, `getFuxieGameMascotSrc`, `getFuxieFoundationAssetSrc`, `getFuxieLiving3dAsset`, `getRewardAssetSrc`, `getShopItemAssetSrc`, `getCefrBadgeAssetSrc` đã được spec mẹ ship. Mỗi helper trả `string` (không null), miss key → `PLACEHOLDER_ASSET`.
- **Hardcoded_Asset_Path**: String literal trong file `apps/web/src/**/*.{ts,tsx}` (ngoại trừ các file thuộc `EXCLUDED_BASENAMES` đã định trong `scripts/lint-asset-registry-references.ts`) match pattern `FORBIDDEN_LITERAL_PATTERN` (`['"\`]/(?:mascot-3d|reward-assets)/...['"\`]`) mà KHÔNG có comment `// asset-registry-allow` đứng cuối dòng.
- **Allow_Comment**: Đúng chuỗi `// asset-registry-allow` (định nghĩa bởi const `ALLOW_COMMENT` trong `scripts/lint-asset-registry-references.ts`) đứng trên cùng một line với literal hardcoded path. Khi xuất hiện, helper `findForbiddenLiterals` trả mảng rỗng cho line đó.
- **Optimized_Folder**: Một trong bốn thư mục public mà `scripts/asset-audit.ts` quét đệ quy: `apps/web/public/mascot-3d/optimized/`, `apps/web/public/mascot-3d/world/optimized/`, `apps/web/public/mascot-3d/ui/optimized/`, `apps/web/public/reward-assets/optimized/`. Định nghĩa hằng số trong `OPTIMIZED_ROOTS` của `scripts/asset-audit-core.ts`.
- **Forbidden_Folder**: Một trong bốn token đường dẫn `/raw/`, `/concept/`, `/foundation/`, `/reference-parts/` định nghĩa trong `FORBIDDEN_FOLDER_TOKENS` của `scripts/asset-audit-core.ts`. Asset_Registry value KHÔNG được chứa bất kỳ token nào trong tập này.
- **Forbidden_Ref**: Một entry `(group, key, value)` trong Asset_Registry mà `value` chứa ít nhất một token thuộc Forbidden_Folder. Khi feature mở (baseline đo): có 8 Forbidden_Ref trong `FUXIE_FOUNDATION_ASSETS`.
- **Coverage_Ratio**: Tỷ lệ file ảnh trong Optimized_Folder được Asset_Registry tham chiếu, tính bằng `computeCoverage(registryValues, optimizedFiles)` trong `scripts/asset-audit-core.ts`. Threshold định nghĩa bởi `COVERAGE_THRESHOLD = 0.95`. Vacuous pass (denominator = 0) trả 1.0.
- **Orphan_Asset**: File ảnh `.webp|.png|.jpg|.jpeg|.svg` tồn tại trong Optimized_Folder mà không được bất kỳ Asset_Registry value nào tham chiếu VÀ không có entry tương ứng trong Archive_Doc. Tính bằng `findOrphans(optimizedFiles, registryValues, archiveEntries)`.
- **Archive_Doc**: File `docs/design/asset-archive.md` với format Markdown table 4 cột `Path | Reason | Archived by | Date`, parse theo logic của `scripts/asset-audit.ts` (chỉ lấy hàng có cell đầu bắt đầu bằng `/`).
- **Optimized_Preference_Issue**: Một entry Asset_Registry mà `value` kết thúc bằng `.png`/`.jpg`/`.jpeg` trong khi cùng thư mục có một file `.webp` cùng basename. Tính bằng `findOptimizedPreferenceIssues(entries, optimizedFiles)`.
- **Audit_Verdict**: Object trả bởi `auditInvariant({optimizedFiles, registryEntries, archiveEntries})` chứa `{coverage, orphans, forbidden, preferenceIssues, pass}`. Pass khi `coverage.pct ≥ COVERAGE_THRESHOLD AND orphans.length === 0 AND forbidden.length === 0 AND preferenceIssues.length === 0`.
- **Quick_Gate**: Script aggregate `pnpm check:quick` trong `package.json` chain qua `lint:asset-paths` → `check:asset-integrity` → `check:asset-audit` → `check:locale-parity` → `check:state-shell-coverage` → `test:property`. Định nghĩa workflow trong `.github/workflows/ci.yml`.
- **Property_Test_Suite**: Tập 295 property test hiện có trong `tests/**/*.spec.{ts,tsx}` chạy bởi `pnpm test:property`. Trạng thái baseline: 295/295 pass.
- **Classification_Verdict**: Một trong ba quyết định cho mỗi Orphan_Asset trước khi audit chuyển xanh: `wire-into-registry` (thêm Asset_Key trỏ vào file), `archive` (thêm hàng vào Archive_Doc), hoặc `delete` (xóa file khỏi `apps/web/public/`).
- **Foundation_Resolution**: Một trong hai cách dọn 8 Forbidden_Ref trong `FUXIE_FOUNDATION_ASSETS`: (a) `relocate` — re-publish file foundation dưới `apps/web/public/mascot-3d/optimized/...` (hoặc một root non-forbidden) và update value, hoặc (b) `extract-tooling` — chuyển `FUXIE_FOUNDATION_ASSETS` ra một export tooling-only mà `scripts/asset-audit.ts` không quét. Thiết kế chọn cụ thể giữa (a) và (b) thuộc design phase.
- **Fresh_Checkout**: Một clone repo mới với `pnpm install` chạy lần đầu trên branch sau merge spec này, không có file lưu cache nào ngoài `node_modules/`.

## Requirements

### Requirement 1: `pnpm lint:asset-paths` trở về exit 0

**User Story:** As a frontend engineer, I want CI gate `lint:asset-paths` xanh trên `main`, so that PR nào thêm hardcoded path mới sẽ fail build và buộc chuyển qua Asset_Registry.

#### Acceptance Criteria

1. WHEN `pnpm lint:asset-paths` được chạy trên Fresh_Checkout của branch sau khi spec đóng, THE Lint_Job SHALL exit với mã 0.
2. THE 5 Hardcoded_Asset_Path baseline được liệt kê trong Introduction (file:line tương ứng) SHALL được giải quyết theo đúng một trong hai cách: (a) string literal được loại bỏ và Component gọi Asset_Registry_Helper để resolve path; HOẶC (b) string literal được giữ và line đó kết thúc bằng Allow_Comment với justification dạng comment liền kề (cùng line hoặc trên line ngay phía trên) giải thích lý do (ví dụ "dev-only debugger preview, raw imagegen layered canvas").
3. WHERE Allow_Comment được dùng để giữ string literal, THE justification comment SHALL chỉ rõ asset đó là dev-only / debugger / raw imagegen layered preview, KHÔNG được dùng cho asset learner-facing đang ship trong production UI.
4. THE Asset_Registry public API (tên export, signature của 10 Asset_Registry_Helper liệt kê trong Glossary, shape của 7 typed map) SHALL không thay đổi. Component có thể thêm key mới vào map hiện hữu nhưng SHALL không xóa hoặc rename key đang được consumer khác sử dụng.
5. WHEN Component cần render một mascot pose (ví dụ `fuxie-state-result-celebration-512.webp`), THE Component SHALL gọi `getFuxieMascotSrc(key)` với một Asset_Key thuộc `FUXIE_MASCOT_STATES` (key đã có sẵn cho pose result-celebration là `'resultCelebration'`).
6. WHEN Component cần render mascot global welcomer (`fuxie-global-fuxie-auth-welcomer.webp`), THE Component SHALL resolve path qua Asset_Registry_Helper. IF Asset_Key tương ứng chưa tồn tại trong map nào, THEN THE registry SHALL được mở rộng bằng cách thêm key mới (không thay đổi shape map) và Component gọi helper bằng key đó.
7. IF sau khi spec đóng có một file `apps/web/src/**/*.{ts,tsx}` (ngoại trừ `EXCLUDED_BASENAMES`) chứa một Hardcoded_Asset_Path mà KHÔNG có Allow_Comment, THEN THE `pnpm lint:asset-paths` SHALL exit non-zero và liệt kê `<file>:<line>: <literal>` cho từng vi phạm — hành vi này được kế thừa trực tiếp từ `runLint` đã có trong `scripts/lint-asset-registry-references.ts`, KHÔNG được refactor trong spec này.

### Requirement 2: `pnpm check:asset-audit` trở về exit 0

**User Story:** As a frontend engineer, I want CI gate `check:asset-audit` xanh trên `main`, so that mọi file optimized đều có một quyết định rõ ràng và Asset_Registry không bao giờ trỏ vào folder cấm.

#### Acceptance Criteria

1. WHEN `pnpm check:asset-audit` được chạy trên Fresh_Checkout của branch sau khi spec đóng, THE Audit_Job SHALL exit với mã 0.
2. THE Coverage_Ratio đo được trên 4 Optimized_Folder SHALL ≥ `COVERAGE_THRESHOLD` (0.95) tại thời điểm spec đóng. Tính toán Coverage_Ratio SHALL dùng nguyên hàm `computeCoverage` trong `scripts/asset-audit-core.ts`, KHÔNG được duplicate logic.
3. THE Audit_Verdict trên fresh checkout SHALL có `forbidden.length === 0` — nghĩa là không Asset_Registry value nào chứa token thuộc Forbidden_Folder. Đặc biệt, 8 Forbidden_Ref baseline trong `FUXIE_FOUNDATION_ASSETS` SHALL được giải quyết bằng đúng một Foundation_Resolution: relocate hoặc extract-tooling.
4. WHERE Foundation_Resolution `relocate` được chọn, THE Asset_Registry value tương ứng SHALL được cập nhật để trỏ vào path mới dưới một thư mục không thuộc Forbidden_Folder, và file ảnh tương ứng SHALL tồn tại tại path mới trong `apps/web/public/`.
5. WHERE Foundation_Resolution `extract-tooling` được chọn, THE 8 entry foundation SHALL được di chuyển ra một export module riêng không nằm trong tập map mà `scripts/asset-audit.ts` đang scan trong hàm `collectRegistryEntries`. Bất kỳ component nào đang ship trong production UI SHALL không tiếp tục import từ export tooling-only này; chỉ tooling/dev script được phép.
6. THE Audit_Verdict trên fresh checkout SHALL có `orphans.length === 0` — nghĩa là 80 file optimized hiện chưa được tham chiếu SHALL có Classification_Verdict cho từng file: `wire-into-registry` (thêm Asset_Key trỏ vào file), `archive` (thêm hàng vào Archive_Doc), hoặc `delete` (xóa file khỏi `apps/web/public/`).
7. WHERE Classification_Verdict là `wire-into-registry`, THE Asset_Key mới SHALL được thêm vào một trong 7 typed map của Asset_Registry, và file path trong value SHALL match đúng public path của file (forward slash, leading `/`).
8. WHERE Classification_Verdict là `archive`, THE entry SHALL được thêm vào `docs/design/asset-archive.md` đúng format `Path | Reason | Archived by | Date` đã có; THE `Path` SHALL bắt đầu bằng `/`; THE `Reason` SHALL chọn từ tập canonical reason hiện có hoặc thêm reason mới có nghĩa rõ ràng; THE `Date` SHALL là ngày commit theo định dạng `YYYY-MM-DD`.
9. WHERE Classification_Verdict là `delete`, THE file SHALL được xóa khỏi `apps/web/public/` trong cùng PR; sau xóa file đó SHALL không còn xuất hiện trong output của `listImagesRecursively` mà `scripts/asset-audit.ts` thực hiện.
10. THE Audit_Verdict trên fresh checkout SHALL có `preferenceIssues.length === 0` — nghĩa là không Asset_Registry value nào trỏ vào `.png`/`.jpg`/`.jpeg` khi cùng thư mục có file `.webp` cùng basename. Logic dùng nguyên hàm `findOptimizedPreferenceIssues`.
11. THE pure helpers `computeCoverage`, `findOrphans`, `findForbiddenRefs`, `findOptimizedPreferenceIssues`, `auditInvariant` trong `scripts/asset-audit-core.ts` cùng các hằng số `COVERAGE_THRESHOLD`, `OPTIMIZED_ROOTS`, `IMAGE_EXTENSIONS`, `FORBIDDEN_FOLDER_TOKENS` SHALL được tái sử dụng nguyên trạng (không thay đổi signature, không thay đổi semantics). Bất kỳ refactor nào của các hàm này SHALL nằm ngoài phạm vi spec.

### Requirement 3: `pnpm check:quick` trở về exit 0 end-to-end

**User Story:** As a project manager, I want gate tổng `pnpm check:quick` xanh trên Fresh_Checkout, so that branch hiện tại của `main` chuyển từ "fail vì nợ kỹ thuật" sang "xanh vì đã trả nợ".

#### Acceptance Criteria

1. WHEN `pnpm check:quick` được chạy trên Fresh_Checkout của branch sau khi spec đóng, THE Quick_Gate SHALL exit với mã 0.
2. THE Quick_Gate SHALL chạy đầy đủ chuỗi `lint:asset-paths` → `check:asset-integrity` → `check:asset-audit` → `check:locale-parity` → `check:state-shell-coverage` → `test:property` mà KHÔNG bị spec này skip, comment-out, hoặc weaken bất kỳ bước nào trong `package.json` hoặc `.github/workflows/ci.yml`.
3. WHERE bước `check:locale-parity` đang fail trên `main` vì sibling spec `learner-copy-localization-backfill` chưa xong, THE spec này SHALL không tự fix locale parity và SHALL không được tag Done cho tới khi sibling spec đó cũng đóng. Riêng lint:asset-paths, check:asset-integrity, check:asset-audit, check:state-shell-coverage, test:property SHALL xanh khi chạy độc lập (`pnpm lint:asset-paths && pnpm check:asset-integrity && pnpm check:asset-audit && pnpm check:state-shell-coverage && pnpm test:property` exit 0).
4. WHEN spec này merge và tất cả sibling spec dọn nợ khác (locale parity, visual QA capture) cũng đã merge, THE `pnpm check:quick` SHALL exit 0 trên Fresh_Checkout của `main`.
5. THE CI workflow file `.github/workflows/ci.yml` SHALL không bị thay đổi để bypass hoặc soften bất kỳ bước nào của Quick_Gate. Chỉ thay đổi được phép là cập nhật phụ thuộc giữa step nếu thêm script mới (KHÔNG có yêu cầu thêm script trong spec này).

### Requirement 4: Property_Test_Suite không regress

**User Story:** As a QA engineer, I want 295 property test đã ship vẫn xanh sau cleanup, so that các invariant về Asset Registry totality, reference discipline, và audit invariant tiếp tục bảo vệ codebase.

#### Acceptance Criteria

1. WHEN `pnpm test:property` được chạy trên Fresh_Checkout của branch sau khi spec đóng, THE test runner SHALL exit với mã 0 và báo cáo `295 passed` (hoặc số ≥ 295 nếu spec có thêm test cho cleanup; spec KHÔNG bắt buộc thêm test mới).
2. THE Property 1 (Asset Registry Integrity) trong `tests/asset-registry.spec.ts` SHALL pass: với mọi `(group, key)` trong 7 typed map, `fs.existsSync(public/<value>)` trả `true` sau cleanup.
3. THE Property 2 (Asset Registry Reference Discipline) trong `tests/asset-discipline.spec.ts` SHALL pass: không file `apps/web/src/**/*.{ts,tsx}` (loại trừ `EXCLUDED_BASENAMES`) chứa Hardcoded_Asset_Path không có Allow_Comment.
4. THE Property 3 (Lookup Totality with Placeholder) trong `tests/asset-registry.spec.ts` SHALL pass: với mọi string `s` (gồm cả `__proto__`, `constructor`, `toString`, `hasOwnProperty`), `getFuxieMascotSrc(s)` trả một path thuộc tập value hợp lệ HOẶC `PLACEHOLDER_ASSET`. Bug fix `Object.prototype.hasOwnProperty.call` trong `apps/web/src/lib/mascot/fuxie-assets.ts` SHALL không bị revert.
5. THE Property 4 (Asset Audit Invariant) trong `tests/asset-registry.spec.ts` SHALL pass: với synthetic input có `orphans.length === 0`, `forbidden.length === 0`, `preferenceIssues.length === 0`, `coverage.pct ≥ 0.95`, `auditInvariant(input).pass === true`.
6. IF bất kỳ Property test nào (1–23 đã enumerated trong DoD §3) chuyển từ pass sang fail do thay đổi của spec này, THEN THE spec SHALL không được tag Done; THE PR SHALL được rollback hoặc fix trước khi merge.
7. THE spec này SHALL không thay đổi `numRuns` của bất kỳ property test nào, không skip test, không weaken assertion.

### Requirement 5: Per-violation guidance — 5 hardcoded paths

**User Story:** As a frontend engineer, I want hướng dẫn rõ cho từng vị trí hardcoded path, so that tôi biết khi nào dùng helper khi nào dùng allow-comment.

#### Acceptance Criteria

1. WHERE Hardcoded_Asset_Path nằm trong `apps/web/src/components/gamification/fuxie-live-3d.tsx` ở line 445 và trỏ vào `/mascot-3d/imagegen-fullbody/v10` (live debugger preview của layered canvas), THE Component SHALL được phép giữ literal kèm Allow_Comment với justification "dev-only debugger preview for layered imagegen-fullbody canvas, not learner-facing"; Component SHALL không render path này trên route learner-facing trong production build.
2. WHERE Hardcoded_Asset_Path nằm trong `apps/web/src/components/onboarding/OnboardingWizard.tsx` ở line 242 và trỏ vào `/mascot-3d/states/global/fuxie-global-fuxie-auth-welcomer.webp` (mascot greeting trong onboarding wizard, learner-facing), THE Component SHALL gọi Asset_Registry_Helper để resolve path và KHÔNG được dùng Allow_Comment.
3. WHERE Hardcoded_Asset_Path nằm trong `apps/web/src/components/onboarding/OnboardingWizard.tsx` ở line 492 và trỏ vào `/mascot-3d/states/v2/fuxie-state-result-celebration-512.webp` (mascot celebration trong onboarding wizard, learner-facing), THE Component SHALL gọi `getFuxieMascotSrc('resultCelebration')` (hoặc Asset_Key tương đương đã có trong `FUXIE_MASCOT_STATES`) và KHÔNG được dùng Allow_Comment.
4. WHERE Hardcoded_Asset_Path nằm trong `apps/web/src/components/shared/InstallPrompt.tsx` ở line 76 và trỏ vào `/mascot-3d/states/global/fuxie-global-fuxie-auth-welcomer.webp` (mascot trong install prompt, learner-facing), THE Component SHALL gọi Asset_Registry_Helper để resolve path và KHÔNG được dùng Allow_Comment.
5. WHERE Hardcoded_Asset_Path nằm trong `apps/web/src/components/shared/mobile-shell.tsx` ở line 83 và trỏ vào `/mascot-3d/states/global/fuxie-global-fuxie-auth-welcomer.webp` (mascot logo trên mobile header, learner-facing), THE Component SHALL gọi Asset_Registry_Helper để resolve path và KHÔNG được dùng Allow_Comment.
6. IF Asset_Key cần thiết cho ba vị trí trong AC2, AC4, AC5 (mascot global auth-welcomer) chưa tồn tại trong bất kỳ map nào của Asset_Registry, THEN THE registry SHALL thêm key mới vào `FUXIE_MASCOT_STATES` (hoặc map phù hợp khác) trỏ vào value `'/mascot-3d/states/global/fuxie-global-fuxie-auth-welcomer.webp'`, kèm comment ngắn ghi chú phạm vi sử dụng (auth/onboarding/install/mobile shell).
7. IF sau cleanup có vị trí thứ 6 hoặc lớn hơn xuất hiện do code bị edit không đụng tới spec này (ví dụ một PR khác merge cùng kỳ), THEN THE spec SHALL coi đó là baseline mới và yêu cầu xử lý cùng quy tắc trong AC1–AC6 trước khi tag Done; người sở hữu spec (Frontend Engineer) chịu trách nhiệm quét lại bằng `pnpm lint:asset-paths` ngay trước khi tag Done.

### Requirement 6: Per-violation guidance — 8 forbidden refs trong `FUXIE_FOUNDATION_ASSETS`

**User Story:** As a design-system designer, I want 8 reference sheets foundation chuyển khỏi production registry hoặc khỏi forbidden folder, so that production audit không lẫn lộn giữa "learner asset" và "DSD reference sheet".

#### Acceptance Criteria

1. THE 8 entry hiện có trong `FUXIE_FOUNDATION_ASSETS` (`turnaround`, `expressions`, `material-palette`, `badge-neckerchief`, `tail-design`, `scale-readability`, `proportions`, `hero-reference`) SHALL được dọn bằng đúng một Foundation_Resolution.
2. WHERE Foundation_Resolution là `relocate`, THE 8 file ảnh foundation SHALL được copy hoặc move sang một thư mục không khớp Forbidden_Folder (gợi ý nhưng không bắt buộc: `apps/web/public/mascot-3d/optimized/foundation/...`); THE Asset_Registry value của `FUXIE_FOUNDATION_ASSETS` SHALL được cập nhật trỏ vào path mới; THE file gốc dưới `apps/web/public/mascot-3d/foundation/v1/...` có thể giữ (không yêu cầu xóa) miễn là không bị Asset_Registry value nào tham chiếu.
3. WHERE Foundation_Resolution là `extract-tooling`, THE map `FUXIE_FOUNDATION_ASSETS` và helper `getFuxieFoundationAssetSrc` SHALL được di chuyển sang một module mới (gợi ý nhưng không bắt buộc: `apps/web/src/lib/mascot/fuxie-foundation-tooling.ts` hoặc `scripts/foundation-assets.ts`) mà hàm `collectRegistryEntries` của `scripts/asset-audit.ts` KHÔNG import. Production component SHALL không tiếp tục import từ module tooling này.
4. WHEN spec đóng, THE quyết định Foundation_Resolution SHALL được ghi rõ trong design.md của spec này (design phase chọn giữa `relocate` và `extract-tooling`). Requirement này KHÔNG pre-decide giữa hai phương án.
5. IF có consumer hiện đang import `FUXIE_FOUNDATION_ASSETS` hoặc gọi `getFuxieFoundationAssetSrc(key)` ở vị trí ngoài registry/test files, THEN THE spec SHALL liệt kê các consumer đó trong design.md và quyết định: giữ consumer (nếu Foundation_Resolution là `relocate`) hoặc rewire consumer sang asset thay thế (nếu Foundation_Resolution là `extract-tooling`).
6. WHEN `pnpm check:asset-audit` chạy sau khi Foundation_Resolution được áp dụng, THE `findForbiddenRefs` SHALL trả mảng rỗng cho registry entries thu thập bởi `collectRegistryEntries`.

### Requirement 7: Per-violation guidance — 80 file optimized chưa tham chiếu

**User Story:** As a frontend engineer cộng đồng tác design-system designer, I want 80 file optimized được phân loại rõ wire/archive/delete, so that audit chuyển xanh mà không xóa nhầm asset cần dùng tương lai.

#### Acceptance Criteria

1. WHEN spec đóng, THE 80 file optimized hiện liệt kê bởi `findOrphans(allOptimizedFiles, registryValues, archiveEntries)` (output của `pnpm check:asset-audit` trên `main` tại baseline) SHALL có Classification_Verdict riêng cho từng file.
2. THE quá trình classify từng file SHALL là FE+DSD work (Frontend Engineer wire vào registry, Design System Designer review archive reason và taxonomy). Requirement này KHÔNG pre-decide outcome cho từng file riêng lẻ; THE design phase và task phase SHALL produce bảng classification per-file.
3. WHEN file được classify là `wire-into-registry`, THE Asset_Key SHALL được thêm vào map phù hợp với loại asset (state → `FUXIE_MASCOT_STATES`, world prop → `FUXIE_WORLD_PROPS`, UI frame → `FUXIE_UI_FRAMES`, reward → `REWARD_ASSETS`, vv.); THE consumer mới (component thực sự render) hoặc consumer hiện hữu SHALL gọi helper bằng key mới — KHÔNG bắt buộc thêm consumer mới nếu chỉ wire để chứa asset cho tương lai, miễn là Asset_Registry integrity check (`pnpm check:asset-integrity`) vẫn pass.
4. WHEN file được classify là `archive`, THE entry SHALL match đúng format `docs/design/asset-archive.md` đã có (4 cột); THE `Reason` SHALL ưu tiên một trong các canonical reason đã có (`legacy v1 — superseded by v2 in registry`, `variant — png alongside webp, kept for rollback`, `seed — generated for future surface, registry wiring pending <task>`, vv.) hoặc thêm reason mới có nghĩa rõ ràng được DSD review.
5. WHEN file được classify là `delete`, THE file SHALL được xóa khỏi `apps/web/public/`. WHILE Audit_Job đang chạy sau khi xóa, THE file đó SHALL không xuất hiện trong output của `listImagesRecursively`.
6. THE tổng Coverage_Ratio sau khi áp đủ 3 loại Classification_Verdict cho 80 file SHALL ≥ 0.95 trên 4 Optimized_Folder. Spec đảm bảo điều này bằng cách yêu cầu Audit_Verdict pass trong Req 2.1 — KHÔNG bắt buộc tỷ lệ wire/archive/delete cụ thể.
7. WHEN spec đóng, THE design.md SHALL bao gồm bảng classification per-file (hoặc tham chiếu một artifact riêng) liệt kê: `Path | Verdict | Asset_Key (nếu wire) | Archive Reason (nếu archive)`. Bảng này phục vụ traceability và review của DSD/FE/PM.

### Requirement 8: Archive_Doc giữ nguyên format và ownership convention

**User Story:** As a design-system designer, I want format và ownership convention của `docs/design/asset-archive.md` không bị spec này phá, so that archive log tiếp tục searchable và auditable theo convention đã thiết lập.

#### Acceptance Criteria

1. THE format Markdown table 4 cột `Path | Reason | Archived by | Date` của `docs/design/asset-archive.md` SHALL không thay đổi.
2. THE parsing logic của `parseArchiveEntries` trong `scripts/asset-audit.ts` (chỉ lấy hàng có cell đầu bắt đầu bằng `/`, bỏ qua header và divider) SHALL không bị spec này thay đổi. Bất kỳ entry mới SHALL tuân thủ format đó để được parse đúng.
3. WHERE entry mới được thêm bởi spec này, THE cột `Archived by` SHALL ghi role hoặc tên ngắn (ví dụ `FE`, `DSD`, `PM`); THE cột `Date` SHALL theo định dạng `YYYY-MM-DD` ngày commit.
4. THE ownership convention đã ghi trong `docs/design/asset-archive.md` (DSD owns format và taxonomy; PM owns rollout schedule; engineering deletes là long-term resting state) SHALL được tôn trọng; THE spec này KHÔNG override convention đó.
5. IF entry archive nào được spec này thêm có `Reason` nằm ngoài tập canonical, THEN THE design.md SHALL giải thích lý do dùng reason mới và DSD SHALL review trước khi merge.

### Requirement 9: Phạm vi cleanup không lan ngoài hai risk

**User Story:** As a project manager, I want spec này chỉ giải quyết R1 + R2, so that các nợ kỹ thuật khác (locale parity, visual QA capture) không bị ghép nhầm vào đây làm scope creep.

#### Acceptance Criteria

1. THE spec này SHALL không thay đổi nội dung file dưới `apps/web/messages/vi.json` hoặc `apps/web/messages/de.json`.
2. THE spec này SHALL không thay đổi nội dung của 13 visual QA checklist file dưới `docs/design/visual-audit/qa-runs/2026-05-16/`.
3. THE spec này SHALL không thay đổi public API hoặc behavior của 3 backbone component (`MascotRoleHost`, `SkillMotivationLayer`, `ResultRewardLoop`) đã ship bởi spec mẹ.
4. THE spec này SHALL không thay đổi 13 P0 surface route file dưới `apps/web/src/app/(learn)/**` ngoại trừ trường hợp một surface chính là consumer của Hardcoded_Asset_Path trong Req 5 — và sửa đổi giới hạn ở việc swap literal sang Asset_Registry_Helper, KHÔNG đổi UX/UI.
5. IF trong quá trình thực hiện phát hiện thêm Hardcoded_Asset_Path mới hoặc Forbidden_Ref mới chưa có trong baseline, THEN THE người thực hiện SHALL xử lý chúng theo cùng quy tắc Req 1, Req 2, Req 5, Req 6, Req 7 và ghi chú trong PR; spec KHÔNG bắt buộc tách spec mới cho từng phát hiện.
6. WHEN spec đóng, THE Risk R1 và R2 trong `docs/design/release/gamified-ui-asset-rollout-dod.md` SHALL được cập nhật chuyển sang `🟢 RESOLVED` với cross-link tới spec này.
