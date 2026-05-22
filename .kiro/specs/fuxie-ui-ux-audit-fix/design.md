# Fuxie UI/UX Audit & Fix — Bugfix Design

> **Vai chính:** Product Designer
> **Vai phối hợp:** Frontend Engineer, QA Automation Engineer, Design System Designer

## Overview

Spec này coi **độ thiếu polish thị giác trên learner app ở viewport ≤ 480px** là một bug có thể tái lập. Bug đó nằm ở chỗ pass QA hiện tại (gọi là `auditPass`) **không phát hiện** một hoặc nhiều class defect trong `1.1`–`1.9` đã định nghĩa ở `bugfix.md`, hoặc phát hiện thiếu evidence để triage được. "Fix" ở đây không phải đi sửa từng lỗi visual trong app — đó là output của các spec con sau — mà là **xây một QA pass mới (`auditPass'`) sinh ra một findings list có cấu trúc, được triage P0/P1/P2, có evidence đầy đủ, và biết forward sang spec khác khi nội dung không thuộc scope**.

Cách tiếp cận:

1. **Formalize bug condition** `C(X)` từ `bugfix.md` thành một detector có 9 sub-detector (mỗi class một detector), tất cả đều chạy được tự động khi có rendered DOM + computed styles.
2. **Define expected behavior** `P(finding)` cho output: schema đầy đủ, severity hợp lệ theo bảng `2.10`, evidence theo từng class theo `2.11`, và auto-P0 cho `1.4` (Reward Amber containment) và `1.7` exposed-stack-trace.
3. **Preservation**: trên non-buggy inputs (`¬C(X)`) không sinh finding; trên scope-out inputs (`ownedByOtherSpec`), sinh finding `forward` chứ không sinh finding fix. Các test hiện có (`reward-amber-containment.spec.tsx`, `p0-surface-render.spec.tsx`, …) phải tiếp tục pass.
4. **Hypothesize root cause**: pass hiện tại đang dựa vào kiểm tra rời rạc cho từng vùng (asset, reward, copy, …), nên thiếu (a) baseline thống nhất ở viewport mobile ≤ 480px, (b) bộ detector cho 1.1, 1.2, 1.5, 1.6, 1.8, 1.9, (c) finding schema chung và evidence schema theo class.
5. **Plan implementation**: giới thiệu một module audit chạy bằng Playwright + jsdom hybrid, output JSON theo schema, kèm CLI để chạy theo route hoặc theo class.
6. **Plan testing**: Exploratory bug-condition checking trước khi fix (chạy `auditPass'` chưa có detector và quan sát miss); Fix Checking (mỗi `C(X)` sinh đúng finding hợp lệ); Preservation Checking (¬C(X) → 0 finding; existing test suites tiếp tục pass; viewport ≥ 768px không đề xuất thay đổi).

Giữ scope chặt: spec này KHÔNG chỉnh wording, KHÔNG chọn lại asset, KHÔNG xây pipeline screenshot — chỉ xây detector + schema + triage logic và forward đúng nơi.

## Glossary

- **Bug_Condition (C)**: Tập input `X = { route, component, viewport, renderedDom, computedStyles }` với `route ∈ apps/web/src/app/(learn)/**` và `viewport ≤ 480px` thoả ÍT NHẤT một trong 9 class defect 1.1–1.9 và KHÔNG thuộc `ownedByOtherSpec`.
- **Property (P)**: Hành vi đúng của `auditPass'(X)`: với `C(X)` sinh đúng một finding hợp lệ; với `¬C(X)` không sinh finding; với input thuộc spec khác sinh finding `action: "forward"` đúng `targetSpec`.
- **Preservation**: Hành vi không bị thay đổi bởi fix — bao gồm (a) các test hiện có (`reward-amber-containment.spec.tsx`, `p0-surface-render.spec.tsx`, `result-reward-loop.spec.tsx`, …) phải tiếp tục pass, (b) các route ≥ 768px không bị spec này đề xuất thay đổi, (c) các vùng thuộc spec khác (`gamified-ui-asset-rollout`, `learner-copy-localization-backfill`, `visual-qa-screenshot-capture`, `asset-registry-cleanup`) không bị spec này quyết định thay.
- **`auditPass`**: Pass QA hiện tại — tập rời rạc các test/lint hiện có, không bao phủ đủ 9 class defect và không có schema thống nhất.
- **`auditPass'`**: Pass QA sau fix — một module audit thống nhất output JSON `Finding[]` theo schema chung và evidence theo từng class.
- **Finding**: Một record JSON theo Finding Schema trong `bugfix.md` (Introduction § Finding Schema).
- **Defect Class**: Một trong 9 class `1.1`–`1.9` định nghĩa trong `bugfix.md` § Current Behavior.
- **Reward_State subtree**: Subtree trong DOM mà root khớp `[data-reward-state="preview"|"earned"|"receipt"]` hoặc `[data-reward-context="true"]`. Là vùng duy nhất được phép render `--fuxie-reward` (#FFB703 ±5%).
- **Forward**: Hành vi của `auditPass'` khi vấn đề thuộc scope spec khác — finding được publish nhưng `action="forward"` và `targetSpec` xác định, không gợi ý fix layout/style trong spec này.
- **Primary task surface**: Lesson player + exercise screens (`(learn)/listening`, `(learn)/reading`, `(learn)/writing`, `(learn)/speaking`, `(learn)/grammar`, `(learn)/vocabulary`) và `(learn)/dashboard`. Một số bậc severity trong bảng `2.10` chỉ áp dụng cho primary task surface.
- **Above-the-fold**: Vùng viewport hiển thị trước khi cuộn ở reference 375×667 (iPhone SE-class), dùng cho class `1.9`.
- **CIEDE2000 ΔE**: Khoảng cách màu trong sRGB / D65 dùng để xác định "off-token gần" (`1.3`) và "near reward amber" (`1.4`).

## Bug Details

### Bug Condition

Bug nằm ở pass QA hiện tại: với một input `X` thuộc bất kỳ class defect 1.1–1.9, `auditPass(X)` hiện tại có thể (a) không sinh finding nào, (b) sinh finding thiếu evidence, (c) sinh finding sai severity theo bảng `2.10`, hoặc (d) duplicate vấn đề thuộc spec khác thay vì forward. Đó là khoảng "miss bug" mà `auditPass'` phải đóng lại.

**Formal Specification:**

```
FUNCTION isBugCondition(X)
  INPUT: X = { route, component, viewport, renderedDom, computedStyles }
         where route ∈ apps/web/src/app/(learn)/**
               viewport.width ≤ 480
               (reference viewports: 360x640, 375x667, 414x896)
  OUTPUT: boolean

  // X là buggy nếu thuộc bất kỳ class defect nào trong 1.1–1.9
  // và KHÔNG thuộc scope spec khác.
  RETURN (
       hasInconsistentSpacing(X)                    // 1.1
    OR hasUnclearTypographyHierarchy(X)             // 1.2
    OR hasOffTokenColor(X)                          // 1.3 (excl. reward containment)
    OR violatesRewardAmberContainment(X)            // 1.4 — auto P0, fail audit
    OR hasMisalignment(X)                           // 1.5
    OR hasComponentInconsistencyVsSiblingRoute(X)   // 1.6
    OR hasPoorEmptyLoadingErrorState(X)             // 1.7
    OR hasLayoutDrivenTextOverflow(X)               // 1.8 — layout only
    OR hasPoorAssetSpacingRhythm(X)                 // 1.9 — spacing/prominence only
  )
  AND NOT ownedByOtherSpec(X)
END FUNCTION
```

Mỗi sub-detector ánh xạ chính xác vào điều kiện đo được trong `bugfix.md` § 1.x. Chi tiết evidence theo class giữ ở `2.11` để tránh duplicate.

### Examples

- **1.6 Component inconsistency** — Route: `(learn)/dashboard/page.tsx`, viewport 390×844. Streak card padding `p-3` (12px), XP card padding `p-4` (16px) trong cùng dashboard row, không có `data-variant`/`aria-disabled`/`data-loading`/`data-selected`. **Expected**: cùng padding token cho cùng pattern KPI card. **Severity**: P1. **Forward**: none. (Counterexample đã liệt kê ở `bugfix.md`.)
- **1.4 Reward containment violation (auto-P0)** — Route: `(learn)/dashboard/page.tsx`, viewport 360×640. Một button `Tiếp tục` ngoài Reward_State subtree có `background-color` resolve về `#FFB703` (ΔE2000 < 5.0). **Expected**: chỉ render trong subtree khớp `[data-reward-state]` hoặc `[data-reward-context="true"]`. **Severity**: P0 (auto). **Forward**: `gamified-ui-asset-rollout` (spec-ref `16.1`, `16.5`). Audit run `fail`.
- **1.1 Inconsistent spacing** — Route: `(learn)/lesson player`, viewport 375×667. CTA primary có `margin-top: 14px` (literal, không phải bội số 4px). **Expected**: bội số 4px hoặc token `--space-*`. **Severity**: P1 (cross-route inconsistency). **Forward**: none.
- **1.7 Error state exposes stack** — Route: `(learn)/listening/error.tsx`, viewport 414×896. Render hiện stack trace khi throttle network. **Severity**: P0 (auto). **Forward**: none. (Wording fix vẫn forward `learner-copy-localization-backfill` nếu áp dụng.)
- **1.9 Asset đẩy CTA xuống fold** — Route: `(learn)/campaign/page.tsx`, viewport 375×667. Hero illustration chiếm 45% above-the-fold area, primary CTA `Bắt đầu mission` bị đẩy xuống dưới fold. **Severity**: P0. **Forward**: `gamified-ui-asset-rollout` (vì fix khả dĩ là giảm rendered size).
- **Edge case (¬C(X), không sinh finding)** — Route: `(learn)/dashboard`, viewport 1280×800. Cùng padding drift tồn tại nhưng viewport ≥ 768px → ngoài scope; `auditPass'` SHALL không đề xuất thay đổi (Preservation 3.5).

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors (từ `bugfix.md` § Unchanged Behavior 3.1–3.7):**

- Wording, microcopy, dịch DE↔VI thuộc `learner-copy-localization-backfill`. `auditPass'` chỉ flag layout impact và forward.
- Vị trí, kích thước, lựa chọn của gamified illustration / mascot asset thuộc `gamified-ui-asset-rollout`. `auditPass'` chỉ flag spacing/rhythm và forward khi cần giảm rendered size.
- Tooling chụp screenshot, visual diff, pipeline regression thuộc `visual-qa-screenshot-capture`. `auditPass'` consume output, không xây.
- Registry asset, filename hygiene thuộc `asset-registry-cleanup`. Forward thay vì xử lý.
- Layout learner app trên viewport ≥ 768px (tablet) và ≥ 1024px (desktop) ở các route đã polish: `auditPass'` SHALL không đề xuất thay đổi.
- Component đang dùng đúng token Bright Sky và đúng containment rule cho `--fuxie-reward`: SHALL không bị flag.
- Surface đã có loading/error/empty state đạt chuẩn (skeleton mirror, error có CTA recovery, empty có visual + CTA): SHALL không bị refactor.

**Existing test surfaces phải tiếp tục pass sau khi `auditPass'` được merge:**

- `tests/reward-amber-containment.spec.tsx` (Reward_State subtree contract).
- `tests/p0-surface-render.spec.tsx` (P0 surface render baseline).
- `tests/result-reward-loop.spec.tsx`, `tests/review-display.spec.tsx`, `tests/skill-motivation-layer.spec.tsx`, `tests/vocabulary-card.spec.tsx`, `tests/ui-primitives.spec.tsx`, `tests/mascot-role.spec.tsx`, `tests/asset-discipline.spec.tsx`, `tests/course-path.spec.tsx`, `tests/locale-parity.spec.ts`.

**Scope:**

Mọi input `X` thuộc một trong các trường hợp sau SHALL không bị thay đổi behavior bởi fix này:

- `X.viewport.width ≥ 768`.
- `X` thoả `ownedByOtherSpec(X)` — sinh finding `action: "forward"` đúng `targetSpec`, không sinh đề xuất thay đổi layout/style.
- `X` không thoả bất kỳ class defect 1.1–1.9 — không sinh finding.
- Existing test suites nêu trên — kết quả pass/fail giữ nguyên.

## Hypothesized Root Cause

Dựa trên phân tích bug, các nguyên nhân khả dĩ:

1. **Thiếu detector cho phần lớn class defect**: pass QA hiện tại có coverage cho `1.4` (`reward-amber-containment.spec.tsx`) và một phần `1.7` (`p0-surface-render.spec.tsx`). 7 class còn lại (`1.1`, `1.2`, `1.3`, `1.5`, `1.6`, `1.8`, `1.9`) không có detector tương đương — nên QA bị mù với phần lớn defect ở viewport ≤ 480px.

2. **Không có baseline viewport mobile ≤ 480px ở pipeline test**: hầu hết test hiện có chạy ở default jsdom hoặc Playwright default viewport, không pin tới `360x640` / `375x667` / `414x896` như `bugfix.md` yêu cầu. Defect chỉ xuất hiện trên mobile sẽ bị miss.

3. **Không có Finding Schema thống nhất**: mỗi test hiện có report theo cách riêng (assertion message, snapshot diff, …). Không có cấu trúc JSON chung gồm `defectClass`, `severity`, `route`, `component`, `evidence`, `expected`, `screenshotPath`, `forwardTo` để Phase Tasks consume và triage.

4. **Không có severity mapping per class**: bảng `2.10` chưa được encode thành code; severity hiện tại do người đọc test gán bằng tay, không reproducible.

5. **Không có forward routing**: khi defect chạm vùng thuộc spec khác (asset, copy, screenshot, registry), hiện không có cơ chế phát finding `action="forward"`. Kết quả là duplicate hoặc miss tuỳ người đọc.

6. **Evidence không đầy đủ theo class**: ví dụ class `1.6` cần evidence paired (hai route, hai selector, hai computed style snapshot, hai screenshot) — hiện không enforce nên finding bị publish thiếu paired evidence.

7. **Auto-P0 gate chưa được encode**: `1.4` (Reward containment) phải fail audit run; `1.7` exposed-stack-trace phải auto-P0. Hiện không có gate ở CI.

## Correctness Properties

Property 1: Bug Condition — `auditPass'` phát hiện đúng mọi instance của class defect 1.1–1.9

_For any_ input `X` mà `isBugCondition(X)` trả về true (tức `X` thuộc `(learn)/**`, viewport ≤ 480px, thoả ÍT NHẤT một class defect 1.1–1.9, và KHÔNG `ownedByOtherSpec`), `auditPass'(X)` SHALL sinh đúng một finding với (i) `defectClass` ∈ `{1.1, …, 1.9}`, (ii) `severity` ∈ `{P0, P1, P2}` được gán đúng theo bảng severity `2.10`, (iii) các field bắt buộc `route`, `component`, `screenshotPath`, `expected` đều khác null, (iv) `evidence` thoả `classEvidenceSchema(finding.defectClass)` (`2.11`), (v) auto-P0 cho `defectClass = 1.4` không exempt và cho `1.7` exposed-stack-trace, và (vi) audit run `fail` khi tồn tại finding `1.4` không exempt chưa resolve.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11**

Property 2: Preservation — Non-buggy inputs, scope-out inputs, viewport ≥ 768px, và existing test surfaces không thay đổi

_For any_ input `X` mà `isBugCondition(X)` trả về false (bao gồm: không thoả class defect nào, hoặc `viewport.width ≥ 768`, hoặc `ownedByOtherSpec(X)`), `auditPass'(X)` SHALL produce kết quả khớp ràng buộc preservation: (i) nếu `X` không thoả class defect nào → 0 finding (`auditPass(X) = auditPass'(X) = ∅`), (ii) nếu `X.viewport.width ≥ 768` → `auditPass'(X).changesProposed = ∅`, (iii) nếu `ownedByOtherSpec(X)` → `auditPass'(X).action = "forward"` với `targetSpec ∈ {"gamified-ui-asset-rollout", "visual-qa-screenshot-capture", "learner-copy-localization-backfill", "asset-registry-cleanup"}` (không sinh finding fix layout/style), và (iv) các test suite hiện có (`reward-amber-containment.spec.tsx`, `p0-surface-render.spec.tsx`, `result-reward-loop.spec.tsx`, `review-display.spec.tsx`, `skill-motivation-layer.spec.tsx`, `vocabulary-card.spec.tsx`, `ui-primitives.spec.tsx`, `mascot-role.spec.tsx`, `asset-discipline.spec.tsx`, `course-path.spec.tsx`, `locale-parity.spec.ts`) tiếp tục pass với cùng kết quả như trước fix.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**

## Fix Implementation

### Changes Required

Giả định root cause analysis đúng (chi tiết ở § Hypothesized Root Cause), fix là xây `auditPass'` thành một module audit thống nhất.

**File**: `apps/web/audit/ui-ux/index.ts` (mới) + `apps/web/audit/ui-ux/detectors/*.ts` (mới) + `tests/audit/ui-ux/*.spec.ts` (mới). Tooling pin viewport tham chiếu nằm ở `apps/web/audit/ui-ux/runtime/viewport.ts`.

**Function**: `auditPassPrime(X): Finding[]` — entry point chạy 9 detector và emit `Finding[]` theo schema chung.

**Specific Changes**:

1. **Encode Finding Schema chung**: Tạo TypeScript type `Finding` khớp `bugfix.md` § Finding Schema (`defectClass`, `severity`, `route`, `component`, `evidence`, `expected`, `screenshotPath`, `forwardTo`) cộng `action: "fix" | "forward"`. Toàn bộ detector emit cùng shape; CI step validate JSON theo schema này trước khi publish.

2. **Encode 9 detector cho 1.1–1.9**: Mỗi detector là một function `(X) => Finding[]` đọc rendered DOM + computed styles, áp dụng đúng condition đã định nghĩa ở `bugfix.md` § 1.x.
   - 1.1 Spacing: scan computed `padding-*`, `margin-*`, `gap`, `row-gap`, `column-gap` với tolerance ±1px so với bội số 4px hoặc token `--space-*`.
   - 1.2 Typography: enforce token `--text-*-size` (đã verify tồn tại trong `apps/web/src/app/globals.css`), check ratio ≥ 1.125x hoặc weight delta ≥ 200, đếm tổ hợp `(font-size, font-weight)` ≤ 3 mỗi semantic block.
   - 1.3 Color: regex literal hex/rgb/hsl/named trong className/style, regex Tailwind arbitrary `bg-[…]`, ΔE2000 ∈ (0, 3) so với canonical Bright Sky token; đo viewport area của `--fuxie-energy` ≤ 5%.
   - 1.4 Reward containment: leo `parentElement` từ node có ΔE2000 < 5.0 so với `#FFB703`, fail nếu không có ancestor khớp `[data-reward-state="preview"|"earned"|"receipt"]` hoặc `[data-reward-context="true"]`; exception cho `<img>/<video>/<canvas>`/user-uploaded `background-image`.
   - 1.5 Alignment: đo baseline (text vs icon), start-edge của siblings cùng role + visual band, center-axis label ↔ control, CTA bounding rect vs container + safe-area.
   - 1.6 Component pattern: precedence (1) cùng React component import path, (2) cùng className root, (3) cùng semantic role + visual archetype; so sánh exact 9 property `padding-*`, `border-*`, `background-color`, `font-size`, `font-weight`, `height`, `gap`; tha thứ chỉ khi state-attribute hợp lệ phân biệt.
   - 1.7 Empty/loading/error/not-found state: detector chạy `loading.tsx`/`error.tsx`/`not-found.tsx` với simulated network throttling và induced error/empty; check skeleton mirror layout (count + relative position + aspect ratio ±20%), empty có (visual + message tiếng Việt + CTA), error không expose stack trace, not-found có CTA recovery.
   - 1.8 Layout-driven text overflow: bơm synthetic string DE 40 ký tự (compound noun) + VI 30 ký tự vào dynamic text slot, re-measure horizontal scrollbar / `overflow:hidden+ellipsis` / mid-word wrap / fixed `width:Npx` / missing `min-width:0` ở flex/grid ancestor.
   - 1.9 Asset spacing rhythm: detect decoration assets (img/svg/lottie/CSS background-image), đo gap với sibling content (bội số 4px ±1px), area ratio so với primary CTA ≤ 2.0x, area share above-the-fold ≤ 40% và CTA không bị đẩy xuống dưới fold.

3. **Encode severity mapping `2.10` thành code**: Bảng mapping per defect class + qualifier (primary task surface vs secondary block, has-overlap vs near-token, …). Severity được gán bởi detector, không bởi người đọc.

4. **Encode evidence schema per class `2.11`**: Mỗi detector emit `evidence` field theo `classEvidenceSchema(defectClass)`. Validator runtime reject finding thiếu evidence bắt buộc trước khi publish — đặc biệt class `1.6` yêu cầu paired evidence (hai route, hai selector, hai computed style snapshot, hai screenshot).

5. **Encode forward routing**: `ownedByOtherSpec(X)` map sang `targetSpec` cụ thể theo `bugfix.md` § Scope (Out): asset → `gamified-ui-asset-rollout`, copy/wording → `learner-copy-localization-backfill`, screenshot tooling → `visual-qa-screenshot-capture`, registry → `asset-registry-cleanup`. `auditPass'` emit finding với `action: "forward"` thay vì `"fix"`.

6. **CI gate**: Audit run `fail` khi tồn tại finding với `defectClass = 1.4` không `exempt: "user-content"` chưa resolve. Auto-P0 cho `1.7` exposed-stack-trace cũng block release.

7. **Reference viewports pinned**: Audit chạy ở 360×640, 375×667, 414×896 cho ≤ 480px. Viewport ≥ 768px (tablet 768+, desktop 1024+) pass-through không đề xuất.

8. **Output**: `Finding[]` JSON ghi vào `audit-reports/ui-ux/{run-id}.json` để Phase Tasks consume. Thư mục report là output của spec này, không phải spec `visual-qa-screenshot-capture`.

## Testing Strategy

### Validation Approach

Quy trình hai pha: (1) **Exploratory Bug Condition Checking** — viết test trên `auditPass` chưa fix để observe miss và xác nhận root cause; (2) **Fix Checking + Preservation Checking** — verify `auditPass'` phát hiện đúng `C(X)` và không thay đổi `¬C(X)` cùng existing test surfaces.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexample chứng minh `auditPass` hiện tại miss class defect 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 1.9 ở viewport ≤ 480px BEFORE implementing `auditPass'`. Confirm hoặc refute root cause "thiếu detector + thiếu schema". Nếu refute, re-hypothesize.

**Test Plan**: Viết test mô phỏng input `X` cho từng class defect bằng fixture DOM (jsdom) và feed vào `auditPass` hiện tại. Quan sát xem có finding nào được emit không, schema có đầy đủ không, severity có đúng `2.10` không. Chạy trên UNFIXED code.

**Test Cases**:

1. **1.1 Spacing fixture (P1)**: Render fixture với KPI card có `padding: 14px` ở viewport 360×640 (will fail on unfixed code — không có detector).
2. **1.2 Typography fixture (P1)**: Render fixture có heading + body cùng `font-size: 16px` cùng `font-weight: 600` (chênh 0%, 0 weight) ở viewport 375×667 (will fail on unfixed code).
3. **1.3 Color fixture (P1)**: Render fixture có button với `style="background:#1da1f2"` (literal hex) ở viewport 414×896 (will fail on unfixed code).
4. **1.4 Reward containment fixture (auto-P0)**: Render fixture có `<button style="background:#FFB703">Tiếp tục</button>` ngoài Reward_State subtree ở viewport 360×640 (PASS on unfixed code — `reward-amber-containment.spec.tsx` đã cover; dùng để verify preservation).
5. **1.5 Alignment fixture (P0/P1 tuỳ context)**: Render fixture có CTA tràn 4px khỏi container ở viewport 375×667 (will fail on unfixed code).
6. **1.6 Component pattern fixture paired (P1)**: Render hai route fixture với KPI card padding `p-3` vs `p-4`, không có `data-variant` (will fail on unfixed code — counterexample chính trong `bugfix.md`).
7. **1.7 Error exposes stack fixture (auto-P0)**: Render `error.tsx` fixture với `<pre>{stack}</pre>` ở viewport 360×640 (may partially fail on unfixed code — `p0-surface-render.spec.tsx` cover một phần).
8. **1.8 Text overflow fixture (P1)**: Bơm synthetic string DE 40 ký tự vào button label ở viewport 360×640, container `width: 200px` cố định (will fail on unfixed code).
9. **1.9 Asset oversize fixture (P0)**: Render hero illustration chiếm 50% above-the-fold area, primary CTA bị đẩy xuống dưới fold ở viewport 375×667 (will fail on unfixed code).
10. **Edge case — viewport ≥ 768px**: Cùng padding drift với 1.1, viewport 1024×768 (should NOT fire — preservation 3.5).
11. **Edge case — owned by other spec**: Wording dài bị truncate vì copy quá dài, không phải vì layout (should `forward` to `learner-copy-localization-backfill`, not fire fix).

**Expected Counterexamples**:

- 7/9 class defect (1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 1.9) hiện không được detect → confirm "thiếu detector".
- Class 1.4 và một phần 1.7 detect được nhưng output không theo Finding Schema chung → confirm "thiếu schema".
- Possible causes: thiếu module audit thống nhất, thiếu pin viewport ≤ 480px, thiếu severity mapping code, thiếu evidence validator.

### Fix Checking

**Goal**: Verify cho mọi input `X` thoả `isBugCondition(X)`, `auditPass'(X)` sinh đúng một finding hợp lệ.

**Pseudocode:**

```
FOR ALL X WHERE isBugCondition(X) DO
  finding := auditPassPrime(X)
  ASSERT finding.route IS NOT NULL
     AND finding.component IS NOT NULL
     AND finding.screenshotPath IS NOT NULL
     AND finding.expected IS NOT NULL
     AND finding.severity ∈ {P0, P1, P2}
     AND finding.defectClass ∈ {1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9}
     AND finding.evidence CONFORMS TO classEvidenceSchema(finding.defectClass)
     AND (finding.defectClass = 1.4 AND finding.exempt ≠ "user-content"
            ⇒ finding.severity = P0)
     AND (finding.defectClass = 1.7 AND finding.evidence.exposesStackTrace
            ⇒ finding.severity = P0)
END FOR

ASSERT countFindings(severity = P0, defectClass = 1.4, exempt ≠ "user-content") = 0
       OR auditRun.status = "fail"
```

### Preservation Checking

**Goal**: Verify cho mọi input `X` mà `NOT isBugCondition(X)`, `auditPass'(X)` không thay đổi behavior so với `auditPass(X)` ở các surface đã đạt chuẩn, viewport ≥ 768px, và scope thuộc spec khác.

**Pseudocode:**

```
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT auditPass(X) = auditPass'(X)
END FOR

FOR ALL X WHERE ownedByOtherSpec(X) DO
  ASSERT auditPassPrime(X).action = "forward"
     AND auditPassPrime(X).targetSpec ∈ {
           "gamified-ui-asset-rollout",
           "visual-qa-screenshot-capture",
           "learner-copy-localization-backfill",
           "asset-registry-cleanup"
         }
END FOR

FOR ALL X WHERE X.viewport.width ≥ 768 DO
  ASSERT auditPassPrime(X).changesProposed = ∅
END FOR
```

**Testing Approach**: Property-based testing cho preservation vì:

- Sinh nhiều fixture DOM tự động trên không gian input (route × viewport × component × style permutation).
- Bắt edge case mà manual unit test thường miss (ví dụ near-token color trong khoảng ΔE > 3 không nên fire 1.3).
- Cho guarantee mạnh rằng behavior không đổi cho mọi non-buggy input.

**Test Plan**: Quan sát behavior trên UNFIXED code cho (a) các surface đã đạt chuẩn (`reward-amber-containment.spec.tsx` baseline), (b) viewport ≥ 768px, (c) input `ownedByOtherSpec`. Sau fix, viết property-based test khẳng định `auditPass'(X)` cho ra cùng kết quả `auditPass(X)` ở các tập trên.

**Test Cases**:

1. **Reward containment preservation**: Run `tests/reward-amber-containment.spec.tsx` trước và sau fix → cùng pass, không thêm flaky finding.
2. **Desktop viewport preservation**: Property test sinh ngẫu nhiên fixture với `viewport.width ∈ [768, 1920]` và padding/typography drift tuỳ ý → ASSERT `auditPassPrime` không emit finding fix nào, không đề xuất thay đổi.
3. **Owned-by-other-spec preservation — wording**: Fixture có text truncated do nội dung quá dài (copy 200 ký tự) trong container fit-content, không phải do layout → ASSERT `forward` → `learner-copy-localization-backfill`.
4. **Owned-by-other-spec preservation — asset choice**: Fixture finding gợi ý đổi mascot → ASSERT `forward` → `gamified-ui-asset-rollout`, không emit fix layout trong spec này.
5. **Owned-by-other-spec preservation — screenshot tooling**: Fixture finding gợi ý xây screenshot pipeline → ASSERT `forward` → `visual-qa-screenshot-capture`.
6. **Owned-by-other-spec preservation — registry**: Fixture finding chạm filename hygiene → ASSERT `forward` → `asset-registry-cleanup`.
7. **Compliant component preservation**: Property test sinh fixture component đúng token Bright Sky + đúng Reward containment + đúng spacing baseline ở viewport ≤ 480px → ASSERT 0 finding.
8. **Compliant state preservation**: Fixture loading có skeleton mirror đúng shape, error có CTA recovery + không expose stack, empty có visual + message + CTA, not-found có CTA về `(learn)/dashboard` → ASSERT 0 finding.

### Unit Tests

- Detector unit cho từng class 1.1–1.9 với fixture tối thiểu (positive + negative case).
- Severity mapping unit (bảng `2.10`) cho mọi tổ hợp `(defectClass, qualifier)`.
- Evidence schema validator unit cho mỗi `classEvidenceSchema`.
- Forward routing unit cho 4 `targetSpec`.
- Token reference unit: validate token `--text-*-size`, `--space-*`, `--fuxie-energy`, `--fuxie-reward` đọc đúng từ `apps/web/src/app/globals.css`.
- Reference viewport pin unit: `360x640`, `375x667`, `414x896`.

### Property-Based Tests

- **PBT Property 1 (Bug Condition coverage)**: Sinh ngẫu nhiên fixture DOM thoả đúng một class defect 1.x ở viewport ≤ 480px → ASSERT `auditPassPrime` emit đúng một finding, đúng `defectClass`, đúng severity theo `2.10`, đúng evidence theo `2.11`.
- **PBT Property 2 (Preservation, ¬C(X))**: Sinh ngẫu nhiên fixture DOM compliant + viewport ≤ 480px + không thuộc spec khác → ASSERT 0 finding.
- **PBT Property 3 (Preservation, viewport ≥ 768px)**: Sinh ngẫu nhiên fixture có drift bất kỳ + viewport ∈ [768, 1920] → ASSERT 0 finding fix, không đề xuất thay đổi.
- **PBT Property 4 (Forward routing)**: Sinh ngẫu nhiên fixture thuộc một trong bốn `ownedByOtherSpec` cluster → ASSERT `action="forward"` + `targetSpec` đúng.
- **PBT Property 5 (Reward auto-P0 invariant)**: Sinh ngẫu nhiên fixture có node ΔE2000 < 5.0 so với `#FFB703` ngoài Reward_State subtree, không phải `<img>/<video>/<canvas>`/user-content → ASSERT `severity = P0` AND `auditRun.status = "fail"`.

### Integration Tests

- **Full audit run trên fixture suite**: Chạy `auditPassPrime` end-to-end trên fixture suite cover 9 class defect × 3 reference viewport × các route đại diện trong `(learn)/**` → verify JSON report có schema hợp lệ, severity đúng, evidence đầy đủ.
- **CI gate integration**: Verify audit run `fail` khi inject fixture 1.4 không exempt; `pass` khi remove fixture đó.
- **Cross-spec forward integration**: Chạy `auditPassPrime` trên fixture wording-overflow + asset-oversize → verify finding forward đúng `targetSpec` và không duplicate vào spec này.
- **Existing test suite regression**: Chạy toàn bộ `tests/*.spec.{ts,tsx}` (`reward-amber-containment`, `p0-surface-render`, `result-reward-loop`, `review-display`, `skill-motivation-layer`, `vocabulary-card`, `ui-primitives`, `mascot-role`, `asset-discipline`, `course-path`, `locale-parity`) trước và sau merge `auditPassPrime` → cùng kết quả pass.
