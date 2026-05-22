# Requirements Document

## Introduction

Spec `gamified-ui-asset-rollout` đã đóng với DoD pack ghi nhận 3 risk follow-up. Đây là spec **R3 — Visual QA Screenshot Capture** (MEDIUM risk).

Sau khi `gamified-ui-asset-rollout` ship, 13 file checklist visual QA tại `docs/design/visual-audit/qa-runs/2026-05-16/` (một file cho mỗi P0 surface) đã được commit. Mỗi file liệt kê 5–10 mục evidence dạng `screenshots/<surface>/<surface>-<state>-<viewport>.png (PENDING capture)`. Spec compliance và automated checks (property tests, `pnpm check:state-shell-coverage`, `pnpm check:locale-parity`, perf integration, a11y integration) đã PASS — nhưng **bằng chứng hình ảnh** vẫn ở trạng thái PENDING vì việc capture yêu cầu seeded local DB cộng với một Playwright run riêng.

DoD pack `docs/design/release/gamified-ui-asset-rollout-dod.md` ghi rõ:

> **R3 (MEDIUM)**: Visual QA screenshots are PENDING — capture requires seeded local DB + Playwright run per `docs/design/learner-ui-visual-qa-runbook.md`. PENDING ≠ FAIL per runbook policy.

Feature này **đóng** R3. Cụ thể:

1. Thêm một Playwright spec mới chuyên dụng cho **capture-only** (không assertion) — đi qua từng P0 surface và mỗi state đã được declare trong checklist, lưu PNG đúng đường dẫn checklist đã viết.
2. Mở rộng `scripts/seed-dev-data.ts` để 5 surface `requiresSeed` (`reading`, `listening`, `speaking`, `writing`, `exam`) có fixture đầy đủ; không surface nào được soft-skip trong run capture.
3. Commit toàn bộ PNG đã capture vào `docs/design/visual-audit/qa-runs/2026-05-16/screenshots/<surface>/...`.
4. Cập nhật 13 file checklist: mọi marker `(PENDING capture)` cho mục có `screenshots/<surface>/...` flip sang `(PASS — captured <date>)` với link relative tới đúng file PNG; các mục `n/a` (đã verified bằng unit test) giữ nguyên.
5. Update DoD pack: R3 chuyển từ 🟠 MEDIUM PENDING → 🟢 RESOLVED, có cross-link tới folder screenshots mới.
6. Bộ capture phải REPRODUCIBLE: fresh checkout → `pnpm db:seed:dev` → dev server với `FUXIE_DEV_AUTH_ENABLED=true` → `pnpm test:integration:capture` đều cho ra cùng tập PNG (cho phép pixel-diff tolerance cho font/aliasing).
7. Property suite + perf integration + a11y integration **giữ nguyên kết quả pass** sau khi merge spec này — feature này CHỈ thêm capture, không thay đổi assertion ở các spec hiện có.

**Spec scope (in-scope):**

- Tạo file `tests/integration/visual-capture.spec.ts` (Playwright, capture-only).
- Tạo command pnpm `test:integration:capture` (gọi Playwright với spec capture).
- Mở rộng `scripts/seed-dev-data.ts` cho `R-A1-DEV-001` → `A1-T1-001`, `L-A1-DEV-001` → `L-A1-GOETHE-001-T1`, `W-A1-DEV-001` → `W-A1-T1-001`, hoặc bổ sung alias upsert sao cho tất cả 5 surface seeded chạy được tại đường dẫn `surfaces.ts` đã declare.
- Commit PNG vào `docs/design/visual-audit/qa-runs/2026-05-16/screenshots/<surface>/...`.
- Edit 13 file checklist tại `docs/design/visual-audit/qa-runs/2026-05-16/` để flip marker.
- Edit DoD pack `docs/design/release/gamified-ui-asset-rollout-dod.md` cập nhật R3.
- Cấu hình `tests/integration/playwright.config.ts` để spec capture không bật Slow 4G throttling và không bật `screenshot: only-on-failure` (capture là output chính, không phải debug artifact).

**Spec scope (out-of-scope):**

- Pixel-diff regression testing (tách thành spec tương lai).
- Hardcoded asset path / locale parity cleanup (đã có sibling spec — Risk R1).
- Re-run runbook cho design change khác — spec này capture **trạng thái hiện tại** của UI sau khi `gamified-ui-asset-rollout` đóng.
- Bổ sung state mới vào 13 file checklist ngoài những state đã declare.
- Capture viewport desktop 1440×1100 — runbook coi desktop là OPTIONAL; spec này **không** đặt desktop làm acceptance bắt buộc, nhưng cho phép capture nếu checklist file đã liệt kê đường dẫn `-desktop.png`.

**Source-of-truth tài liệu:**

- `docs/design/visual-audit/qa-runs/2026-05-16/` — 13 file checklist + `README.md` index (output target).
- `docs/design/learner-ui-visual-qa-runbook.md` — runbook chuẩn capture (viewport, filename suffix, role-gate).
- `docs/design/release/gamified-ui-asset-rollout-dod.md` — Risk R3 sẽ được flip ở spec này.
- `tests/integration/playwright.config.ts` — config Playwright hiện có (Chromium, 390×844 mobile, dev-auth via globalSetup).
- `tests/integration/global-setup.ts` — minted learner cookie via `/api/dev-auth/login?role=learner`.
- `tests/integration/utils/surfaces.ts` — danh sách 13 P0 surface với route + flag `requiresSeed`.
- `scripts/seed-dev-data.ts` — seed script hiện tại.

## Glossary

- **Capture_Run**: Một lần chạy hoàn chỉnh của Capture_Spec từ start tới end, đi qua mọi Surface_State của mọi P0 surface trong P0_Surface_Set, và ghi tất cả Evidence_Path tương ứng vào filesystem. Một Capture_Run được nhận diện bằng `<YYYY-MM-DD>` của ngày run.
- **P0_Surface_Set**: Tập hợp 13 P0 learner surface được liệt kê trong `tests/integration/utils/surfaces.ts` `P0_SURFACES`: `dashboard`, `course`, `vocabulary`, `vocabulary-practice`, `vocabulary-microgames`, `reading`, `listening`, `speaking`, `speaking-roleplay`, `writing`, `review`, `rewards-shop`, `exam`. Tập này khớp với hàng trong bảng tại `docs/design/visual-audit/qa-runs/2026-05-16/README.md`.
- **Surface_State**: Một state hiển thị mà Checklist_File của một surface đã declare đường dẫn `screenshots/<surface>/<surface>-<state>-<viewport>.png`. Tập state khả dĩ là `default`, `empty`, `locked`, `error`, `success`. Một surface có ít nhất 3 state (`default`, `empty`, `error`) và có thể có thêm `locked` (khi surface đó có gating) hoặc `success` (khi Checklist_File đã liệt kê).
- **Evidence_Path**: Đường dẫn relative dạng `screenshots/<surface>/<surface>-<state>-<viewport>.png` đã được liệt kê trong cột Evidence của một Checklist_File. Ví dụ: `screenshots/dashboard/dashboard-default-mobile.png`. Đường dẫn này là **contract** giữa Checklist_File và Capture_Run — Capture_Spec phải ghi PNG ra đúng đường dẫn này (anchor tại Visual_Audit_Folder).
- **Seeded_Surface**: Một P0 surface có flag `requiresSeed: true` trong `tests/integration/utils/surfaces.ts`, gồm `reading` (`A1-T1-001`), `listening` (`L-A1-GOETHE-001-T1`), `speaking` (`dev-a1-begruessung-01`), `writing` (`W-A1-T1-001`), `exam` (`dev-a1-goethe-mini`). Một Seeded_Surface chỉ render được nội dung học khi DB local có fixture tương ứng.
- **Capture_Spec**: File Playwright `tests/integration/visual-capture.spec.ts` được tạo bởi feature này. Capture_Spec không chạy assertion về behavior — chỉ điều hướng tới mỗi `<surface, state>` pair và lưu PNG. Capture_Spec sử dụng cùng `globalSetup`, cùng learner cookie, cùng viewport 390×844 với `playwright.config.ts` hiện có.
- **Visual_Audit_Folder**: Thư mục `docs/design/visual-audit/qa-runs/2026-05-16/` (cố định cho Capture_Run này). PNG được ghi vào subfolder `screenshots/<surface>/`. Spec này KHÔNG tạo folder ngày khác.
- **Checklist_File**: Một trong 13 file Markdown tại Visual_Audit_Folder, mỗi file đại diện cho một P0 surface. Tên file khớp với surface ID (`dashboard.md`, `course.md`, ..., `exam.md`). Mỗi file liệt kê các Surface_State của surface đó cùng với Evidence_Path tương ứng.
- **Pending_Marker**: Chuỗi text `(PENDING capture)` xuất hiện trong cột Evidence của một Checklist_File, ngay sau một đường dẫn Evidence_Path. Pending_Marker có thể đếm được bằng grep regex `\(PENDING capture\)` trên Visual_Audit_Folder.
- **Pass_Marker**: Chuỗi text dạng `(PASS — captured 2026-05-16)` thay thế Pending_Marker sau khi capture thành công. Format: `(PASS — captured <YYYY-MM-DD>)` với `<YYYY-MM-DD>` là ngày của Capture_Run.
- **Reproducibility_Tolerance**: Mức sai khác cho phép giữa hai Capture_Run cùng commit + cùng DB seed — đo bằng Mean Absolute Pixel Difference (MAPD) tính trên ảnh thang xám resize về 256×256, cho phép ≤ 2.0 / 255 (≈ 0.78%) để tha cho font hinting và anti-aliasing across OS/browser builds.
- **Capture_Manifest**: File JSON `tests/integration/visual-capture.manifest.json` được tạo bởi feature này. Manifest liệt kê đầy đủ `<surface, state, viewport, evidence_path, route, requiresSeed>` tuple mà Capture_Spec sẽ duyệt qua. Manifest là single source of truth cho cả Capture_Spec và bước flip marker.

## Requirements

### Requirement 1: Capture manifest là single source of truth

**User Story:** As a QA Automation Engineer, I want one machine-readable manifest enumerating every screenshot the run will produce, so that capture, marker flipping, and DoD reporting all agree on the same set.

#### Acceptance Criteria

1. THE Capture_Manifest SHALL tồn tại tại đường dẫn `tests/integration/visual-capture.manifest.json` ở thời điểm sau khi feature này merge.
2. THE Capture_Manifest SHALL chứa một mảng entry; mỗi entry SHALL có đúng các field `surface` (string thuộc P0_Surface_Set), `state` (string thuộc tập `{"default","empty","locked","error","success"}`), `viewport` (string thuộc tập `{"mobile","desktop"}`), `route` (string bắt đầu bằng `/`), `evidencePath` (string relative bắt đầu bằng `screenshots/<surface>/`), và `requiresSeed` (boolean).
3. THE Capture_Manifest SHALL chứa ít nhất một entry với `viewport="mobile"` cho mỗi cặp `<surface, state>` mà Checklist_File của surface đó đã liệt kê Evidence_Path dạng `<surface>-<state>-mobile.png`.
4. WHEN một Checklist_File chứa Evidence_Path dạng `<surface>-<state>-desktop.png`, THE Capture_Manifest SHALL chứa entry tương ứng với `viewport="desktop"`.
5. WHEN trường `surface` của một entry trong P0_Surface_Set có `requiresSeed: true` (theo `tests/integration/utils/surfaces.ts`), THE Capture_Manifest SHALL set `requiresSeed: true` cho mọi entry với `surface` đó.
6. THE Capture_Manifest SHALL có đúng một entry duy nhất cho mỗi tuple `<surface, state, viewport>` (không trùng lặp).
7. WHEN feature này merge, THE Capture_Manifest SHALL chứa ít nhất một entry tương ứng với mỗi Pending_Marker trong Visual_Audit_Folder ở commit ngay trước khi merge.

### Requirement 2: Seed script đảm bảo mọi Seeded_Surface có nội dung

**User Story:** As a QA Automation Engineer, I want `pnpm db:seed:dev` to populate the exact fixtures the seeded P0 routes resolve, so that no surface gets soft-skipped during capture.

#### Acceptance Criteria

1. WHEN `pnpm db:seed:dev` chạy thành công trên một database trống, THE seeded database SHALL chứa một `ReadingExercise` record với `exerciseId = "A1-T1-001"` và `status = "PUBLISHED"`.
2. WHEN `pnpm db:seed:dev` chạy thành công trên một database trống, THE seeded database SHALL chứa một `ListeningLesson` record với `lessonId = "L-A1-GOETHE-001-T1"` và ít nhất một `ListeningQuestion` liên kết.
3. WHEN `pnpm db:seed:dev` chạy thành công trên một database trống, THE seeded database SHALL chứa một `SpeakingLesson` record với `id = "dev-a1-begruessung-01"` và `status = "PUBLISHED"`.
4. WHEN `pnpm db:seed:dev` chạy thành công trên một database trống, THE seeded database SHALL chứa một `WritingExercise` record với `exerciseId = "W-A1-T1-001"` và `status = "PUBLISHED"`.
5. WHEN `pnpm db:seed:dev` chạy thành công trên một database trống, THE seeded database SHALL chứa một `ExamTemplate` record với `slug = "dev-a1-goethe-mini"` và `status = "PUBLISHED"`, cùng với ít nhất một `ExamSection` và một `ExamTask` liên kết.
6. WHEN `pnpm db:seed:dev` chạy lần thứ hai liên tiếp trên cùng database mà không reset, THE seed script SHALL idempotent (kết thúc với exit code 0 và database state giống lần chạy đầu, không tạo duplicate record).
7. WHEN dev server (`pnpm dev:web` với `FUXIE_DEV_AUTH_ENABLED=true`) chạy trên database đã seed, AND learner mở mỗi route trong `tests/integration/utils/surfaces.ts` `P0_SURFACES`, THE response SHALL trả về HTTP 200 và DOM `<title>` non-empty cho mỗi route.

### Requirement 3: Capture_Spec đi qua mọi entry trong manifest

**User Story:** As a QA Automation Engineer, I want one Playwright spec that produces every PNG referenced by the 13 checklist files, so that the run is auditable and reproducible.

#### Acceptance Criteria

1. THE Capture_Spec SHALL tồn tại tại đường dẫn `tests/integration/visual-capture.spec.ts` sau khi feature này merge.
2. THE Capture_Spec SHALL load Capture_Manifest tại thời điểm test discovery và sinh đúng một Playwright test case per entry, đặt tên test `"<surface> / <state> / <viewport>"`.
3. WHEN Capture_Spec chạy một test case, THE test case SHALL điều hướng tới `route` của entry đó trên `BASE_URL` (default `http://localhost:3005`), chờ trạng thái load complete, và lưu screenshot tại đường dẫn tuyệt đối `<workspace_root>/docs/design/visual-audit/qa-runs/2026-05-16/<entry.evidencePath>`.
4. WHEN entry có `viewport = "mobile"`, THE test case SHALL set viewport `390×844` trước khi điều hướng.
5. WHEN entry có `viewport = "desktop"`, THE test case SHALL set viewport `1440×1100` trước khi điều hướng.
6. WHEN entry có `state` ngoài `default`, THE test case SHALL drive surface vào đúng state đó trước khi capture, sử dụng các cơ chế đã được khai báo trong design (ví dụ: query param, mock fetch, intercept route, dev-only seed reset). THE driving mechanism cho mỗi `<surface, state>` SHALL được declare trong Capture_Manifest field tùy chọn `stateDriver` hoặc trong design document.
7. WHEN Capture_Spec đã ghi screenshot cho một entry, THE file PNG tại `<workspace_root>/docs/design/visual-audit/qa-runs/2026-05-16/<entry.evidencePath>` SHALL tồn tại với MIME type `image/png` và kích thước file ≥ 1 KB.
8. WHEN Capture_Spec đã ghi screenshot cho một entry với `viewport = "mobile"`, THE PNG dimensions SHALL là `390 × 844` pixel (logical) tại device-pixel-ratio đã declare trong `playwright.config.ts` projects, hoặc full-page nếu test case khai báo `fullPage: true` (chiều rộng vẫn là 390).
9. THE Capture_Spec SHALL chỉ chứa bước `await page.screenshot(...)` và các bước điều hướng / state-setup; THE Capture_Spec SHALL không chứa `expect(...)` về behavior của UI, ngoại trừ một guard duy nhất đảm bảo trang load tới `route` mong đợi (`expect(page).toHaveURL(...)` hoặc tương đương).
10. IF một test case không thể đạt state mong đợi sau timeout 60 giây, THEN THE test case SHALL fail với thông báo nhận diện được surface, state, viewport, và lý do.

### Requirement 4: Capture_Run không soft-skip Seeded_Surface

**User Story:** As a Project Manager, I want every seeded P0 surface to actually capture, not soft-skip, so that the DoD R3 risk closes with full evidence.

#### Acceptance Criteria

1. WHEN Capture_Spec chạy với DB đã seed bằng `pnpm db:seed:dev` và dev server có `FUXIE_DEV_AUTH_ENABLED=true`, THE test case của mỗi Seeded_Surface SHALL không skip và SHALL hoàn thành ghi PNG cho mỗi entry tương ứng.
2. IF env var `FUXIE_PLAYWRIGHT_SKIP_SEEDED=1` được set khi chạy Capture_Spec, THEN THE Capture_Spec SHALL fail với exit code khác 0 và thông báo: "Capture run requires seeded surfaces; FUXIE_PLAYWRIGHT_SKIP_SEEDED is incompatible with `pnpm test:integration:capture`."
3. IF route của một Seeded_Surface trả về HTTP status ≥ 400 hoặc redirect tới `/login`, THEN THE Capture_Spec SHALL fail test case đó với thông báo identify surface ID + status code + URL hiện tại, và Capture_Run tổng SHALL kết thúc với exit code khác 0.

### Requirement 5: Pnpm script và workflow integration

**User Story:** As a QA Automation Engineer, I want a one-shot pnpm command that wraps the capture run, so that operators can re-run capture on a fresh checkout without remembering Playwright flags.

#### Acceptance Criteria

1. THE `package.json` (workspace root) SHALL expose script `test:integration:capture` mà khi gọi `pnpm test:integration:capture` SHALL chạy Playwright với chỉ Capture_Spec (`tests/integration/visual-capture.spec.ts`) và project Chromium-mobile.
2. THE script `test:integration:capture` SHALL thoát với exit code 0 IF mọi entry trong Capture_Manifest đã được capture thành công, và exit code khác 0 trong các trường hợp còn lại.
3. THE `tests/integration/playwright.config.ts` SHALL bật `testMatch` cho file `visual-capture.spec.ts` (ngoài các pattern hiện tại), và SHALL không apply `screenshot: 'only-on-failure'` cho test case của Capture_Spec (vì screenshot LÀ output chính).
4. THE `tests/integration/playwright.config.ts` SHALL không apply Slow 4G throttling cho test case của Capture_Spec — capture dùng network speed mặc định để tránh artifact thiếu hình ảnh do timeout.
5. THE `tests/integration/README.md` SHALL được cập nhật để document script `test:integration:capture`, prerequisites (`pnpm db:seed:dev` + `FUXIE_DEV_AUTH_ENABLED=true`), và đường dẫn output `docs/design/visual-audit/qa-runs/2026-05-16/screenshots/`.

### Requirement 6: Output PNG đúng đường dẫn checklist

**User Story:** As a Frontend Engineer reviewing the visual QA pack, I want every committed PNG to land at the exact path each checklist file references, so that markdown links resolve without manual fix-up.

#### Acceptance Criteria

1. WHEN Capture_Run hoàn thành, THE Visual_Audit_Folder SHALL chứa một file PNG tại mỗi `<entry.evidencePath>` cho mọi entry trong Capture_Manifest.
2. WHEN Capture_Run hoàn thành, THE tổng số file PNG dưới `docs/design/visual-audit/qa-runs/2026-05-16/screenshots/` SHALL bằng đúng số entry trong Capture_Manifest.
3. THE every PNG được ghi bởi Capture_Run SHALL có magic bytes hợp lệ của định dạng PNG (`89 50 4E 47 0D 0A 1A 0A` ở 8 byte đầu).
4. WHERE một Checklist_File khai báo Evidence_Path không khớp với entry nào trong Capture_Manifest (orphan path), THE acceptance test SHALL fail với danh sách orphan để PM/FE quyết định bổ sung manifest hoặc xóa khỏi checklist.
5. WHERE Capture_Manifest có entry với `evidencePath` mà Checklist_File tương ứng không khai báo (unused entry), THE acceptance test SHALL fail với danh sách unused entry.

### Requirement 7: Flip Pending_Marker sang Pass_Marker

**User Story:** As a Project Manager, I want each checklist file's PENDING markers replaced with PASS markers automatically, so that the DoD pack reads green at a glance without manual edits.

#### Acceptance Criteria

1. WHEN Capture_Run hoàn thành thành công và mọi PNG đã được commit, THE 13 Checklist_File trong Visual_Audit_Folder SHALL chứa 0 instance của Pending_Marker (regex `\(PENDING capture\)`).
2. THE every line trong một Checklist_File mà ở revision trước chứa cả một Evidence_Path và Pending_Marker, sau commit của feature này SHALL chứa cùng Evidence_Path đó cộng với Pass_Marker (format `(PASS — captured 2026-05-16)`); Evidence_Path SHALL không thay đổi giữa hai revision.
3. WHEN một Checklist_File có dòng evidence với marker `n/a (...)` (tức là verified bằng unit test, không phải bằng screenshot), THE feature này SHALL không thay đổi dòng đó.
4. THE README index `docs/design/visual-audit/qa-runs/2026-05-16/README.md` SHALL được cập nhật ở phần "Owner sign-off": dòng `FE — capture pass` SHALL chuyển trạng thái từ `_pending_` sang `2026-05-16` cùng với note ngắn (≤ 80 ký tự) tham chiếu spec `visual-qa-screenshot-capture`.

### Requirement 8: Cập nhật DoD pack — flip R3

**User Story:** As a Project Manager, I want the gamified-ui-asset-rollout DoD pack updated in the same PR, so that R3 closes atomically with the capture evidence.

#### Acceptance Criteria

1. WHEN feature này merge, THE file `docs/design/release/gamified-ui-asset-rollout-dod.md` SHALL chứa entry cho Risk R3 với severity `🟢 RESOLVED` (thay vì `🟠 MEDIUM`).
2. THE entry R3 sau cập nhật SHALL chứa link relative tới `docs/design/visual-audit/qa-runs/2026-05-16/screenshots/` và link relative tới spec folder `.kiro/specs/visual-qa-screenshot-capture/`.
3. THE entry R3 sau cập nhật SHALL chứa note ngắn (≤ 200 ký tự) ghi rõ số PNG đã capture và ngày capture.
4. THE bảng "Sign-off table" trong DoD pack SHALL cập nhật dòng `FE` từ `⏳ Awaiting capture pass` sang `✅ Approved` với ngày 2026-05-16; dòng `GD` và `DSD` SHALL không thay đổi (review của họ thuộc Risk khác).
5. THE phần "Final decision" của DoD pack SHALL được cập nhật để loại R3 khỏi danh sách "Out of scope for this Done tag" — số bullet còn lại giảm từ 3 xuống 2 (chỉ còn R1 cleanup và R2 audit coverage).

### Requirement 9: Reproducibility tolerance — chạy lại không drift

**User Story:** As a Frontend Engineer reviewing reproducibility, I want a second capture run on the same commit to produce visually equivalent PNGs, so that we can detect intentional UI drift versus environmental noise.

#### Acceptance Criteria

1. WHEN Capture_Run thứ hai chạy trên cùng git commit của repo, cùng `pnpm db:seed:dev` đã chạy lại, và cùng dev server với cùng env vars, THE PNG mới sinh tại mỗi `evidencePath` SHALL có Mean Absolute Pixel Difference (MAPD) so với PNG đã commit ≤ 2.0 / 255 trên ảnh thang xám resize về 256×256.
2. THE feature này SHALL ship một script `scripts/visual-capture-diff.ts` chấp nhận hai folder PNG và in ra một dòng per file dạng `<evidencePath>: MAPD=<value>` cùng exit code 0 khi mọi MAPD ≤ Reproducibility_Tolerance, exit code khác 0 nếu có file vượt ngưỡng.
3. THE README integration tests SHALL document cách chạy `scripts/visual-capture-diff.ts` để verify Reproducibility_Tolerance.
4. WHERE một entry trong Capture_Manifest có `state` thuộc tập `{"loading","success"}` mà chứa animation ngẫu nhiên (ví dụ confetti seed thay đổi mỗi lần load), THE Capture_Spec SHALL áp dụng `prefers-reduced-motion: reduce` qua Playwright `emulateMedia` trước khi capture, để loại nguồn drift này.

### Requirement 10: Bảo toàn các test suite đang xanh

**User Story:** As a QA Automation Engineer, I want the existing perf, a11y, and property suites to keep passing after this spec merges, so that capture work does not silently regress shipped checks.

#### Acceptance Criteria

1. WHEN feature này merge, THE command `pnpm test:property` SHALL kết thúc với exit code 0.
2. WHEN feature này merge và CI chạy `pnpm test:integration:perf` trên cùng cấu hình môi trường (DB đã seed, dev server có `FUXIE_DEV_AUTH_ENABLED=true`), THE perf suite SHALL kết thúc với exit code 0 và mọi assertion CLS ≤ 0.05 + bytes ≤ 350 KB SHALL giữ nguyên kết quả pass.
3. WHEN feature này merge, THE command `pnpm check:quick` (lint:asset-paths → check:asset-integrity → check:asset-audit → check:locale-parity → test:property) SHALL kết thúc với exit code 0.
4. THE Capture_Spec SHALL không nằm trong testMatch của `vitest.property.config.ts`.
5. THE Capture_Spec SHALL không sửa, xóa, hoặc thêm `expect(...)` vào `tests/integration/perf.spec.ts` hoặc `tests/integration/a11y.spec.tsx`.

### Requirement 11: Error handling và resume

**User Story:** As an operator running the capture pass, I want a clean failure mode when one surface breaks, so that I can fix the seed or the route and re-run only the failed entries.

#### Acceptance Criteria

1. IF một Capture_Spec test case fail (timeout, navigation error, hoặc state-driver error), THEN THE Playwright runner SHALL tiếp tục các test case còn lại của các surface khác (test isolation), và Capture_Run tổng SHALL kết thúc với exit code khác 0.
2. WHEN Capture_Run kết thúc với exit code khác 0, THE runner SHALL ghi một summary file tại `tmp/playwright/visual-capture-summary.json` chứa danh sách entry đã pass, đã fail, lý do fail (nếu có), và tổng thời gian chạy.
3. THE script `test:integration:capture` SHALL chấp nhận env var `FUXIE_CAPTURE_ONLY=<surface>` (giá trị là một surface ID thuộc P0_Surface_Set hoặc danh sách comma-separated); khi set, Capture_Spec SHALL chỉ chạy entry có `surface` thuộc danh sách đó.
4. IF dev server không phản hồi tại `BASE_URL` trong vòng 30 giây từ start của test case đầu tiên, THEN THE Capture_Spec SHALL fail nhanh với thông báo: "Dev server not reachable at <BASE_URL>. Start `pnpm dev:web` with FUXIE_DEV_AUTH_ENABLED=true before `pnpm test:integration:capture`."

### Requirement 12: Acceptance test cho marker flip + manifest sync

**User Story:** As a QA Automation Engineer, I want an automated check that the markdown markers and the screenshot folder agree, so that human edits during PR review do not silently break the contract.

#### Acceptance Criteria

1. THE feature này SHALL ship một script `scripts/check-visual-audit-pack.ts` được wire vào `package.json` script `check:visual-audit`.
2. WHEN `pnpm check:visual-audit` chạy, THE script SHALL fail với exit code khác 0 IF có bất kỳ Pending_Marker nào trong Visual_Audit_Folder (`docs/design/visual-audit/qa-runs/2026-05-16/`).
3. WHEN `pnpm check:visual-audit` chạy, THE script SHALL fail với exit code khác 0 IF có bất kỳ Evidence_Path nào trong các Checklist_File mà file PNG tương ứng không tồn tại tại Visual_Audit_Folder.
4. WHEN `pnpm check:visual-audit` chạy, THE script SHALL fail với exit code khác 0 IF có file PNG dưới `docs/design/visual-audit/qa-runs/2026-05-16/screenshots/` mà không có Evidence_Path tham chiếu nào trong Checklist_File hoặc Capture_Manifest.
5. THE CI workflow `pnpm check:quick` SHALL được cập nhật để gọi `check:visual-audit` sau khi tất cả check hiện tại pass — IF `check:visual-audit` fail, THEN THE PR SHALL bị block merge.
