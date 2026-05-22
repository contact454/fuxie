# Bugfix Requirements Document — Fuxie UI/UX Audit & Fix

> **Vai chính:** Product Designer
> **Vai phối hợp:** Product Manager EdTech, Frontend Engineer, QA Automation Engineer

## Introduction

Đợt audit này coi **độ thiếu polish thị giác (visual cleanliness defect)** trên learner app của Fuxie là một **bug có thể tái lập**, thay vì một dự án redesign mở. Học viên Việt Nam của Fuxie chủ yếu học trên điện thoại (≤ 480px), nên bất kỳ inconsistency nào về spacing, typography hierarchy, color usage, alignment, hoặc component rendering trên mobile đều làm giảm khả năng tập trung học và hạ thấp cảm nhận chất lượng sản phẩm.

Mục tiêu của spec này là tạo ra một **findings list được triage theo P0/P1/P2** cho toàn bộ learner surfaces — không phải fix luôn trong cùng spec. Mỗi finding sẽ là một bug instance độc lập, có thể chuyển thành task hoặc spec con sau.

### Scope (In)

Learner app `apps/web/src/app/(learn)/**` trên breakpoint **mobile (≤ 480px)** là ưu tiên P0; tablet/desktop được kiểm tra ở mức regression-prevention. Viewport tham chiếu đo lường: 360×640 và 414×896 (đại diện iPhone SE-class và mid-tier Android).

Các surface bắt buộc audit:

- **Lesson player & exercise screens:** `(learn)/listening`, `(learn)/reading`, `(learn)/writing`, `(learn)/speaking`, `(learn)/grammar`, `(learn)/vocabulary` (bao gồm `practice/`, `microgames/`).
- **Dashboard & navigation chính:** `(learn)/dashboard`, `(learn)/course`, `(learn)/layout.tsx`, `(learn)/session`.
- **Gamification surfaces:** `(learn)/badges`, `(learn)/campaign`, `(learn)/leaderboard`, `(learn)/rewards/shop`, các thành phần XP / streak / Fucoin / mission ở header và dashboard.
- **Onboarding & profile:** flow placement test, profile/settings của học viên.
- **Empty / loading / error states:** `loading.tsx`, `error.tsx`, `not-found.tsx` ở mọi route trên.

### Scope (Out — đã được handle bởi spec khác)

Các vùng sau **không** được mở finding ở spec này để tránh duplicate. Nếu phát hiện vấn đề thuộc các vùng này, finding phải được forward sang spec tương ứng:

- **Vị trí / lựa chọn / containment của gamified illustration assets** → `gamified-ui-asset-rollout`. Spec này chỉ phát hiện *visual cleanliness* defect xung quanh asset (ví dụ: spacing giữa asset và CTA), không phán xét chính asset đó.
- **Tooling chụp screenshot và pipeline visual regression** → `visual-qa-screenshot-capture`. Spec này *tiêu thụ* output của tool đó nếu có, không xây tool.
- **Wording, microcopy, dịch DE↔VI, tone of voice của learner copy** → `learner-copy-localization-backfill`. Spec này chỉ flag khi copy bị **truncate / overflow / wrap xấu** vì lý do layout, không phán xét nội dung copy.
- **Asset registry và filename hygiene** → `asset-registry-cleanup`.

### Severity Definition

| Severity | Định nghĩa | Ví dụ |
| --- | --- | --- |
| **P0** | Làm hỏng task chính trên mobile (học viên không hoàn thành được bài) hoặc vi phạm reward-amber containment rule | CTA "Tiếp tục" bị che; text exercise bị cắt; `--fuxie-reward` xuất hiện ngoài Reward_State subtree |
| **P1** | Inconsistency rõ ràng làm giảm chất lượng cảm nhận, không chặn task | Cùng card render với padding khác nhau giữa 2 màn; typography scale lệch 2 bậc trong cùng block |
| **P2** | Polish nhẹ, ưu tiên thấp | Border radius lệch 2px; icon stroke-width khác cùng cluster |

### Finding Schema (Contract)

Mỗi finding trong báo cáo cuối SHALL có tối thiểu các field sau, để Phase Design và Phase Tasks có hợp đồng dữ liệu rõ:

```
{
  defectClass: "1.1" | "1.2" | ... | "1.9",
  severity:    "P0" | "P1" | "P2",
  route:       "apps/web/src/app/(learn)/...",
  component:   "<React component path | DOM selector>",
  evidence:    { ...class-specific fields... },
  expected:    "<token | rule reference>",
  screenshotPath: "<path to ≤480px screenshot>",
  forwardTo:   null | "gamified-ui-asset-rollout"
                    | "learner-copy-localization-backfill"
                    | "visual-qa-screenshot-capture"
                    | "asset-registry-cleanup"
}
```

## Bug Analysis

### Current Behavior (Defect)

Các clause sau mô tả các *kiểu* khiếm khuyết visual cleanliness mà QA pass này phải phát hiện được trên learner app ở breakpoint ≤ 480px. Mỗi kiểu là một **instance class** của bug condition; mỗi finding cụ thể trong báo cáo cuối là một **instance** của một class.

#### 1.1 Inconsistent spacing vs 4px/8px baseline

WHEN học viên mở một surface thuộc `apps/web/src/app/(learn)/**` trên viewport 360×640 hoặc 414×896, THE hệ thống có thể render với spacing không tuân thủ baseline 4px/8px được xác định bởi ÍT NHẤT một trong các điều kiện đo được sau:

1. Một trong các CSS property `padding-{top,right,bottom,left}`, `margin-{top,bottom}`, `gap`, `row-gap`, `column-gap` của một block-level container có computed value KHÔNG phải bội số nguyên của 4px (tolerance ±1px).
2. Hai instance của cùng một component role (button, card, list-item, modal, KPI tile, progress bar) trong hai route khác nhau dưới `(learn)/` có cùng property nói trên nhưng computed value lệch nhau > 1px mà không có state-attribute hợp lệ phân biệt (xem 2.6).
3. Một property nói trên dùng literal `Npx` thay vì spacing token `--space-*` đã khai báo trong `apps/web/src/app/globals.css` hoặc Tailwind theme tương ứng (`p-1`…`p-12`, `gap-1`…`gap-12`).

#### 1.2 Unclear typography hierarchy

WHEN học viên mở một surface thuộc `apps/web/src/app/(learn)/**` trên viewport ≤ 480px, THE hệ thống có thể render typography hierarchy mờ — được xác định bởi ÍT NHẤT một trong các điều kiện đo được sau trong cùng một semantic block (section/card/list-item/dialog body):

1. (a) Hai text node liền kề về cấp bậc ngữ nghĩa (ví dụ heading ↔ body, body ↔ caption) có computed `font-size` chênh lệch < 1.125x VÀ computed `font-weight` chênh lệch < 200 đơn vị.
2. (b) Block chứa > 3 tổ hợp `(font-size, font-weight)` phân biệt — không tính icon, badge, và inline emphasis (`<strong>`, `<em>`) lồng trong cùng câu của body.
3. (c) Một text node có vai trò ngữ nghĩa heading/title nhưng dùng size không thuộc tập token `{ --text-2xs-size, --text-xs-size, --text-sm-size, --text-base-size, --text-lg-size, --text-xl-size, --text-2xl-size, --text-3xl-size, --text-4xl-size, --text-5xl-size, --text-6xl-size, --text-7xl-size, --text-8xl-size }` đã khai báo trong `apps/web/src/app/globals.css`, HOẶC dùng cùng token với body của block đó.

#### 1.3 Off-token color usage (ngoài Reward_State containment — xem 1.4)

WHEN học viên mở một surface thuộc `apps/web/src/app/(learn)/**` trên viewport ≤ 480px, THE hệ thống có thể render color usage lệch tập token Bright Sky đã định nghĩa trong `apps/web/src/app/globals.css` thông qua ÍT NHẤT một trong các kiểu sau:

1. Literal `hex` / `rgb` / `rgba` / `hsl` / `hsla` xuất hiện trong className, `style`, hoặc inline style của một node thuộc surface.
2. Tailwind arbitrary color class dạng `bg-[...]` / `text-[...]` / `border-[...]` / `ring-[...]`.
3. Named CSS color (`red`, `blue`, `green`, …) trong className hoặc style.
4. Computed color của một node nằm "gần nhưng không bằng" một token Bright Sky — định nghĩa "gần" là CIEDE2000 ΔE ∈ (0, 3) so với token canonical gần nhất.
5. `--fuxie-energy` chiếm > 5% diện tích viewport theo phương pháp đo: union các bounding box hiển thị (clip vào viewport, loại trừ vùng bị che) của những node có computed `background-color` / `color` / `fill` / `border-color` resolve về `--fuxie-energy`, chia cho diện tích viewport ≤ 480px.

LƯU Ý: vi phạm Reward_State containment cho `--fuxie-reward` được tách riêng sang **1.4** để tránh đếm trùng.

#### 1.4 Reward-amber containment violation (auto-P0)

WHEN học viên mở một surface bất kỳ thuộc `apps/web/src/app/(learn)/**` trên viewport ≤ 480px, THE hệ thống có thể render màu Reward Amber (#FFB703 ±5%) ở một node KHÔNG nằm trong subtree được phép, vi phạm contract của design tokens và Req 16.1 / 16.5 của spec `gamified-ui-asset-rollout`. Vi phạm được xác định bởi:

1. Định nghĩa "render Reward Amber" trên một node `n` là computed value của bất kỳ property nào sau đây có ΔE2000 < 5.0 so với #FFB703 trong sRGB / D65: `color`, `background-color`, `border-color`, `outline-color`, `fill`, `stroke`; HOẶC bất kỳ color stop nào trong `box-shadow` hoặc trong gradient của `background-image`.
2. Định nghĩa "out of subtree" bằng thuật toán: leo `parentElement` từ `n` (bao gồm chính `n`) tới `documentElement`; vi phạm xảy ra IF không có tổ tiên nào khớp một trong bốn selector cho phép: `[data-reward-state="preview"]`, `[data-reward-state="earned"]`, `[data-reward-state="receipt"]`, `[data-reward-context="true"]`.
3. Exception (không tính vi phạm): `<img>`, `<video>`, `<canvas>`, hoặc `background-image` trỏ tới user-uploaded content (host ≠ self hoặc thuộc CDN nội dung học viên trong audit config). Finding cho các node này được đánh dấu `exempt: "user-content"` và không tính P0.

#### 1.5 Alignment / grid misalignment

WHEN học viên mở một surface thuộc `apps/web/src/app/(learn)/**` trên viewport ≤ 480px, THE hệ thống có thể render alignment / grid lệch ở ÍT NHẤT một trong bốn dạng:

1. (a) **Baseline misalignment**: một text node và một icon/glyph nằm cùng flex/grid row có chênh lệch baseline > 2px.
2. (b) **Start-edge misalignment**: hai sibling cùng DOM parent + cùng role + cùng visual band có `left` (hoặc inline-start) lệch nhau > 1px khi không có lý do state.
3. (c) **Center-axis misalignment**: label và control liên kết (label ↔ input, label ↔ checkbox, label ↔ toggle) có center-axis lệch > 2px theo trục cross.
4. (d) **CTA tràn container**: một CTA hoặc interactive element có bounding rect vượt khỏi content container (overlap > 0px theo bất kỳ cạnh nào) hoặc ra ngoài safe-area padding.

#### 1.6 Component pattern inconsistency across routes

WHEN học viên mở hai surface khác nhau thuộc `apps/web/src/app/(learn)/**` trên viewport ≤ 480px cùng dùng một component pattern, THE hệ thống có thể render hai instance khác nhau ở các property style đã khai báo. "Cùng component pattern" được xác định theo precedence:

1. (1) Cùng React component import path (ưu tiên cao nhất).
2. (2) Cùng className root (BEM block hoặc Tailwind component class chính).
3. (3) Cùng semantic role + visual archetype (ví dụ: `role="button"` + visual = primary CTA).

Property được so sánh với tolerance 0px / exact match: `padding-{top,right,bottom,left}`, `border-radius`, `border-width`, `border-color`, `background-color`, `font-size`, `font-weight`, `height`, `gap`. Hai instance khác nhau ở các property này được tha thứ CHỈ KHI sự khác biệt được giải thích bởi một trong bốn state-attribute: `data-variant`, `aria-disabled`, `data-loading`, `data-selected`. Mọi inconsistency khác là vi phạm.

#### 1.7 Poor empty / loading / error states

WHEN học viên mở một route `loading.tsx` / `error.tsx` / `not-found.tsx` thuộc `apps/web/src/app/(learn)/**` trên viewport ≤ 480px, THE hệ thống có thể render state thiếu cấu trúc ở ÍT NHẤT một trong các dạng:

1. **Loading:** không có skeleton mà chỉ có spinner toàn trang, HOẶC skeleton có số block / vị trí tương đối / aspect ratio sai khác > 20% so với content thật sẽ render khi data về.
2. **Empty:** thiếu một trong (a) visual element (icon, illustration, hoặc empty-glyph), (b) một câu thông điệp tiếng Việt giải thích trạng thái, (c) ÍT NHẤT một CTA hoặc link dẫn tới hành động kế tiếp.
3. **Error:** thiếu calm message tiếng Việt, HOẶC thiếu CTA recovery thuộc tập {retry, dashboard, support}, HOẶC lộ stack trace / raw error message của runtime / framework cho học viên.
4. **Not-found:** thiếu CTA dẫn về một route known-good (mặc định `(learn)/dashboard`).

LƯU Ý: chất lượng tone/wording của message thuộc spec `learner-copy-localization-backfill`; class này chỉ phát hiện thiếu cấu trúc.

#### 1.8 Layout-driven text overflow / truncation / bad wrap

WHEN một text node trên surface thuộc `apps/web/src/app/(learn)/**` ở viewport ≤ 480px chứa nội dung tiếng Đức hoặc tiếng Việt dài, THE hệ thống có thể render layout-driven overflow ở ÍT NHẤT một trong các dạng:

1. (a) Container của text node làm xuất hiện horizontal scrollbar.
2. (b) Text node có `overflow: hidden` + `text-overflow: ellipsis` VÀ nội dung là meaningful (không phải decorative), không có cách hiển thị đầy đủ ở chỗ khác.
3. (c) Text wrap mid-word cho ngôn ngữ không phải CJK mà thiếu `overflow-wrap: anywhere | break-word` và làm vỡ layout.
4. (d) Container có `width: <Npx fixed>` thay vì `max-width` + `min-width: 0`, VÀ child text overflow.
5. (e) Ancestor flex/grid item thiếu `min-width: 0` khiến child đẩy container width vượt viewport.

Audit trigger để phát hiện: bơm một synthetic string tiếng Đức 40 ký tự (compound noun) và một synthetic string tiếng Việt 30 ký tự vào mọi dynamic text slot đã biết, sau đó re-measure. LƯU Ý: class này KHÔNG bao giờ đề xuất rút ngắn copy; đó là phạm vi `learner-copy-localization-backfill`.

#### 1.9 Poor asset spacing rhythm / oversized asset

WHEN học viên mở một surface thuộc `apps/web/src/app/(learn)/**` trên viewport ≤ 480px có **asset trang trí** (image, SVG, Lottie, hoặc CSS `background-image` dùng làm decoration/illustration; KHÔNG bao gồm functional icon là một phần của control có label — đó là phạm vi 1.5), THE hệ thống có thể render với:

1. (a) Gap giữa asset và sibling content gần nhất KHÔNG phải bội số 4px (tolerance ±1px), HOẶC margin/padding bao quanh asset dùng literal `Npx` thay vì spacing token đã khai báo.
2. (b) Visual area của asset > 2.0× visual area của primary CTA trong cùng above-the-fold (viewport tham chiếu iPhone SE-class 375×667).
3. (c) Asset chiếm > 40% above-the-fold area VÀ primary CTA bị đẩy một phần hoặc toàn phần xuống dưới fold.

LƯU Ý: class này chỉ đề xuất (a) thêm/bớt spacing token bao quanh asset, HOẶC (b) giảm bounding box của asset; KHÔNG đề xuất đổi asset, đổi mascot, hoặc reposition sang slot layout khác — những việc đó thuộc `gamified-ui-asset-rollout`.

### Expected Behavior (Correct)

Sau khi QA pass này hoàn thành, mỗi class defect ở trên có một quy tắc kiểm tra rõ ràng và một cấu trúc finding triage được.

#### 2.1 Spacing tuân thủ baseline 4px/8px

WHEN học viên mở một surface thuộc `apps/web/src/app/(learn)/**` trên viewport ≤ 480px, THE hệ thống SHALL render mọi block-level container thoả ĐỒNG THỜI:

1. (i) Mọi computed value của `padding-{top,right,bottom,left}`, `margin-{top,bottom}`, `gap`, `row-gap`, `column-gap` SHALL là bội số nguyên của 4px (tolerance ±1px) HOẶC khớp một spacing token canonical thuộc tập đã khai báo trong `apps/web/src/app/globals.css` và Tailwind theme (`--space-0`…`--space-12`, hoặc lớp `p-*` / `gap-*` tương ứng).
2. (ii) Hai instance của cùng component role trong hai route khác nhau dưới `(learn)/` SHALL có cùng computed value cho các property nói trên trừ khi state-attribute hợp lệ phân biệt (xem 2.6).
3. (iii) IF một property vi phạm (i) hoặc (ii), THEN audit pipeline SHALL phát sinh đúng một finding với severity được gán theo bảng 2.10 và evidence theo 2.11.

#### 2.2 Typography hierarchy phân tách rõ

WHEN học viên mở một surface thuộc `apps/web/src/app/(learn)/**` trên viewport ≤ 480px, THE hệ thống SHALL render mỗi semantic block thoả ĐỒNG THỜI:

1. (i) Mỗi text node SHALL dùng `font-size` thuộc tập token `--text-*-size` đã khai báo trong `apps/web/src/app/globals.css` (`--text-2xs-size` … `--text-8xl-size`); không chấp nhận size literal nằm ngoài tập này.
2. (ii) Giữa hai cấp ngữ nghĩa liền kề trong block (heading → body, body → caption), computed `font-size` SHALL chênh lệch ≥ 1.125x HOẶC computed `font-weight` SHALL chênh lệch ≥ 200 đơn vị.
3. (iii) Số tổ hợp `(font-size, font-weight)` phân biệt trong một semantic block SHALL ≤ 3 (heading + body + caption); inline emphasis trong body không tính là cấp riêng.
4. (iv) IF text node vi phạm (i)–(iii), THEN audit pipeline SHALL phát sinh đúng một finding với severity gán theo 2.10 và evidence theo 2.11.

#### 2.3 Color usage canonical Bright Sky

WHEN học viên mở một surface thuộc `apps/web/src/app/(learn)/**` trên viewport ≤ 480px, THE hệ thống SHALL chỉ dùng các token Bright Sky canonical từ `apps/web/src/app/globals.css`:

1. (i) Không node nào SHALL chứa literal `hex` / `rgb` / `rgba` / `hsl` / `hsla` trong className, `style`, hoặc inline style — phải dùng token.
2. (ii) Không node nào SHALL dùng Tailwind arbitrary color class `bg-[...]` / `text-[...]` / `border-[...]` / `ring-[...]` cho color thay cho token.
3. (iii) Không node nào SHALL dùng named CSS color cho color thay cho token.
4. (iv) IF computed color của một node có CIEDE2000 ΔE ∈ (0, 3) so với token canonical gần nhất, THEN đó là vi phạm (color đã gần như đúng nhưng không khớp).
5. (v) `--fuxie-energy` SHALL chiếm ≤ 5% viewport area theo phương pháp đo trong 1.3.5.
6. (vi) Vi phạm Reward_State containment cho `--fuxie-reward` được xử lý ở 2.4, không phát sinh finding ở class này.
7. (vii) IF vi phạm (i)–(v), THEN audit pipeline SHALL phát sinh đúng một finding với severity theo 2.10 và evidence theo 2.11 + nearest token + ΔE đo được.

#### 2.4 Reward-amber containment chặt — auto-P0

WHEN học viên mở một surface bất kỳ thuộc `apps/web/src/app/(learn)/**` trên viewport ≤ 480px, THE hệ thống SHALL ràng buộc:

1. (i) Mọi node mà computed value của `color`, `background-color`, `border-color`, `outline-color`, `fill`, `stroke`, hoặc bất kỳ color stop nào trong `box-shadow` / `background-image` gradient có ΔE2000 < 5.0 so với #FFB703 trong sRGB / D65, SHALL có ÍT NHẤT một tổ tiên (bao gồm chính node đó) khớp một trong bốn selector: `[data-reward-state="preview"]`, `[data-reward-state="earned"]`, `[data-reward-state="receipt"]`, `[data-reward-context="true"]`.
2. (ii) IF không có tổ tiên nào khớp, THEN audit pipeline SHALL phát sinh đúng một finding **auto-P0** với `forwardTo: "gamified-ui-asset-rollout"`, `spec-ref: ["16.1", "16.5"]`, và evidence: DOM selector path của node, ancestor selector chain, computed color value (sRGB hex), screenshot.
3. (iii) Exception: IF node là `<img>`, `<video>`, `<canvas>`, hoặc `background-image` trỏ tới user-uploaded content, THEN finding được đánh dấu `exempt: "user-content"` và KHÔNG tính P0.
4. (iv) Audit run SHALL fail (block release / merge gate) IF còn ÍT NHẤT một finding 1.4 chưa exempt và chưa resolve.

#### 2.5 Alignment nhất quán

WHEN học viên mở một surface thuộc `apps/web/src/app/(learn)/**` trên viewport ≤ 480px, THE hệ thống SHALL ràng buộc:

1. (i) **Baseline tolerance:** text + icon/glyph cùng flex/grid row SHALL có chênh lệch baseline ≤ 2px.
2. (ii) **Start-edge tolerance:** hai sibling cùng DOM parent + cùng role + cùng visual band SHALL có start-edge lệch nhau ≤ 1px.
3. (iii) **Center-axis tolerance:** label và control liên kết SHALL có center-axis lệch ≤ 2px.
4. (iv) **CTA containment:** mọi CTA / interactive element SHALL có bounding rect nằm hoàn toàn trong content container và safe-area padding (overlap = 0px).
5. (v) IF vi phạm (i)–(iv), THEN audit pipeline SHALL phát sinh đúng một finding với evidence: loại lệch, selector của cả hai phần, bounding rect (x, y, width, height), độ lệch đo được tính bằng px, screenshot.

#### 2.6 Component pattern nhất quán giữa các route

WHEN học viên mở hai surface khác nhau thuộc `apps/web/src/app/(learn)/**` cùng dùng một component pattern (xác định theo precedence trong 1.6), THE hệ thống SHALL ràng buộc:

1. (i) Hai instance SHALL có cùng computed value cho mỗi property: `padding-{top,right,bottom,left}`, `border-radius`, `border-width`, `border-color`, `background-color`, `font-size`, `font-weight`, `height`, `gap` (tolerance 0px / exact match).
2. (ii) Sự khác biệt SHALL được tha thứ CHỈ KHI ÍT NHẤT một trong bốn state-attribute giải thích: `data-variant`, `aria-disabled`, `data-loading`, `data-selected`.
3. (iii) IF vi phạm (i) và không có state-attribute trong (ii), THEN audit pipeline SHALL phát sinh đúng một finding paired tham chiếu cả hai route, hai selector, hai computed style snapshot, và hai screenshot. Không có evidence paired thì finding KHÔNG được publish.

#### 2.7 Empty / loading / error state đạt chuẩn

WHEN học viên mở một route `loading.tsx` / `error.tsx` / `not-found.tsx` thuộc `apps/web/src/app/(learn)/**` trên viewport ≤ 480px, THE hệ thống SHALL ràng buộc:

1. (i) **Loading:** SHALL có skeleton mirror layout của content thật theo count + relative position + aspect ratio với tolerance ±20% mỗi block; spinner-only fallback là vi phạm và sinh finding (P2 mặc định).
2. (ii) **Empty:** SHALL có (a) visual element, (b) một câu tiếng Việt giải thích trạng thái, (c) ÍT NHẤT một CTA. Thiếu mỗi thành phần phát sinh finding riêng theo bảng severity 2.10.
3. (iii) **Error:** SHALL có calm message tiếng Việt + recovery CTA thuộc {retry, dashboard, support}; SHALL NEVER lộ stack trace hoặc raw runtime error cho học viên — vi phạm là **P0** (privacy + UX).
4. (iv) **Not-found:** SHALL có message rõ + CTA về `(learn)/dashboard` hoặc route known-good khác; thiếu CTA recovery là **P1**.
5. (v) Evidence cho mỗi finding: route path, screenshot trigger được bằng simulated network throttling hoặc induced error/empty, DOM dump cho thấy presence/absence của các thành phần bắt buộc.
6. (vi) Chất lượng tone/wording được forward sang `learner-copy-localization-backfill`; class này chỉ flag thiếu cấu trúc.

#### 2.8 Layout safe wrap cho text dài

WHEN một text node trên surface thuộc `apps/web/src/app/(learn)/**` ở viewport ≤ 480px chứa nội dung dài (hoặc được audit bơm synthetic string DE 40 ký tự / VI 30 ký tự), THE hệ thống SHALL ràng buộc:

1. (i) Container của text node SHALL NOT làm xuất hiện horizontal scrollbar.
2. (ii) Text node với `overflow: hidden` + `text-overflow: ellipsis` SHALL chỉ áp dụng cho nội dung decorative HOẶC khi nội dung đầy đủ có thể đọc được ở chỗ khác (tooltip, modal, dedicated screen).
3. (iii) Text non-CJK SHALL có `overflow-wrap: anywhere` HOẶC `break-word` khi container có khả năng nhận compound dài.
4. (iv) Container có khả năng nhận text dài SHALL dùng `max-width` + `min-width: 0` thay cho `width: <Npx fixed>`.
5. (v) Mọi flex/grid item ancestor SHALL có `min-width: 0` để con không đẩy container vượt viewport.
6. (vi) IF vi phạm (i)–(v), THEN audit pipeline SHALL phát sinh đúng một finding ghi rõ "layout issue, copy is owned by learner-copy-localization-backfill", với evidence: route, selector, computed `overflow` / `text-overflow` / `min-width` / `width`, screenshot ở trạng thái synthetic-string-injected, độ dài content gốc. KHÔNG đề xuất rút copy.

#### 2.9 Asset spacing và prominence không lấn CTA

WHEN học viên mở một surface thuộc `apps/web/src/app/(learn)/**` trên viewport ≤ 480px có asset trang trí, THE hệ thống SHALL ràng buộc:

1. (i) Gap giữa asset và sibling content gần nhất SHALL là bội số 4px (tolerance ±1px), và margin/padding bao quanh asset SHALL dùng spacing token.
2. (ii) Visual area của asset SHALL ≤ 2.0× visual area của primary CTA trong cùng above-the-fold (viewport tham chiếu 375×667).
3. (iii) Asset SHALL NOT chiếm > 40% above-the-fold area khi điều đó đẩy primary CTA xuống dưới fold.
4. (iv) IF vi phạm (i), THEN finding KHÔNG forward (chỉ chỉnh spacing). IF vi phạm (ii) hoặc (iii), THEN finding SHALL kèm `forwardTo: "gamified-ui-asset-rollout"` (vì fix khả dĩ là giảm asset rendered size).
5. (v) Evidence cho mỗi finding: above-the-fold screenshot, asset bounding rect, primary CTA bounding rect, area ratio, computed margin/padding bao quanh asset.

#### 2.10 Severity Mapping (per defect class)

| Class | P0 | P1 | P2 |
| --- | --- | --- | --- |
| 1.1 | Vi phạm gây overlap, hoặc phá touch target ≥ 44×44px | Cross-route inconsistency cho cùng component role | Single-instance off-token trong [±1, ±3]px |
| 1.2 | Heading không phân biệt được với body trên primary task surface (vi phạm (ii) heading↔body) | body↔caption trên primary task surface; size off-token ở bất kỳ surface nào; > 3 size/weight combos trên primary task surface | Vi phạm chỉ ở secondary block (footer, meta) |
| 1.3 | (không P0 — Reward chuyển sang 1.4) | Literal hex/named trên primary CTA; `--fuxie-energy` > 5% trên lesson player | Computed near-token (0 < ΔE < 3) ở chỗ khác; `--fuxie-energy` > 5% ở surface khác |
| 1.4 | Mọi vi phạm không exempt (auto-P0, fail audit) | — | — |
| 1.5 | CTA tràn container chặn tap; lệch ≥ 4px ở primary task surface | Sibling start-edge lệch 2–3px; center-axis lệch 3–4px | Lệch ≤ 2px ngoài primary task |
| 1.6 | Modal layout drift hoàn toàn cho cùng action | CTA primary padding khác giữa dashboard và lesson | KPI card border-radius lệch ≤ 2px |
| 1.7 | Lộ stack trace/raw error cho học viên (auto-P0) | Empty state thiếu message hoặc CTA; not-found thiếu recovery | Loading thiếu skeleton (chỉ spinner); empty thiếu visual |
| 1.8 | CTA label truncated; primary heading wrap chồng lấn | Body description truncated mà nội dung không đọc được nơi khác | Secondary description truncated với ellipsis khi nội dung đầy đủ ở chỗ khác |
| 1.9 | Asset đẩy primary CTA xuống dưới fold trên 375×667 | Spacing lệch > 2px quanh hero illustration; asset > 2× CTA area | Spacing lệch 1–2px; asset hơi lấn nhịp |

#### 2.11 Required Evidence (per finding)

Mỗi finding SHALL có ít nhất các field generic theo Finding Schema (Introduction § Finding Schema), CỘNG thêm các field class-specific đã liệt kê trong từng clause 2.1–2.9. Finding thiếu evidence bắt buộc SHALL NOT được publish vào báo cáo cuối.

### Unchanged Behavior (Regression Prevention)

Các đầu ra hoặc hành vi sau **không** được thay đổi bởi pass QA này, vì chúng đã được sở hữu bởi các spec khác hoặc nằm ngoài bug condition C(X):

3.1 WHEN một thay đổi UI/UX được đề xuất chạm tới wording / microcopy / dịch DE↔VI THEN hệ thống SHALL CONTINUE TO để spec `learner-copy-localization-backfill` sở hữu quyết định về copy; finding của spec này chỉ mô tả layout impact và forward sang spec đó.

3.2 WHEN một finding chạm tới *vị trí, kích thước hoặc lựa chọn* của gamified illustration / mascot asset THEN hệ thống SHALL CONTINUE TO để spec `gamified-ui-asset-rollout` sở hữu quyết định; finding của spec này chỉ mô tả spacing / rhythm xung quanh asset và forward khi cần giảm rendered size.

3.3 WHEN một finding chạm tới tooling chụp screenshot, visual diff, hoặc pipeline regression THEN hệ thống SHALL CONTINUE TO để spec `visual-qa-screenshot-capture` sở hữu việc xây tooling; spec này chỉ tiêu thụ output của tool đó.

3.4 WHEN một finding chạm tới registry asset hoặc filename hygiene THEN hệ thống SHALL CONTINUE TO để spec `asset-registry-cleanup` sở hữu.

3.5 WHEN học viên dùng learner app trên viewport ≥ 768px (tablet) hoặc ≥ 1024px (desktop) ở các route đã polish trước đây THEN hệ thống SHALL CONTINUE TO render đúng theo trạng thái hiện tại; pass mobile-first này không được phép gây regression layout trên desktop.

3.6 WHEN một component đang dùng đúng token Bright Sky và đúng containment rule cho `--fuxie-reward` THEN hệ thống SHALL CONTINUE TO không bị flag; finding chỉ mở khi có vi phạm rõ ràng có evidence (screenshot + token expected vs actual + computed value).

3.7 WHEN một surface đã có loading/error/empty state đạt chuẩn (skeleton khớp shape, error có CTA recovery, empty có visual + CTA) THEN hệ thống SHALL CONTINUE TO giữ nguyên các state đó; pass này không refactor các state đã đạt chuẩn.

### Bug Condition (C(X)) — Pseudocode

```pascal
FUNCTION isBugCondition(X)
  INPUT: X = { route, component, viewport, renderedDom, computedStyles }
         where route ∈ apps/web/src/app/(learn)/**
               viewport ≤ 480px (reference: 360x640, 375x667, 414x896)
  OUTPUT: boolean

  // X là buggy nếu thuộc bất kỳ class defect nào trong 1.1–1.9
  // và KHÔNG thuộc scope sở hữu bởi spec khác (3.1–3.4).

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

### Property — Fix Checking

```pascal
// Property: Fix Checking — mỗi defect class phải sinh ra finding triage được
FOR ALL X WHERE isBugCondition(X) DO
  finding ← auditPass'(X)
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

// Audit run gate
ASSERT countFindings(severity = P0, defectClass = 1.4, exempt ≠ "user-content") = 0
       OR auditRun.status = "fail"
```

### Property — Preservation Checking

```pascal
// Property: Preservation Checking — non-buggy inputs không sinh finding,
// và nội dung thuộc spec khác được forward thay vì duplicate.
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT auditPass(X) = auditPass'(X)
END FOR

FOR ALL X WHERE ownedByOtherSpec(X) DO
  ASSERT auditPass'(X).action = "forward"
     AND auditPass'(X).targetSpec ∈ {
           "gamified-ui-asset-rollout",
           "visual-qa-screenshot-capture",
           "learner-copy-localization-backfill",
           "asset-registry-cleanup"
         }
END FOR

// Desktop regression guard
FOR ALL X WHERE X.viewport ≥ 768px DO
  ASSERT auditPass'(X).changesProposed = ∅
END FOR
```

### Counterexample (Illustrative)

- **Route:** `apps/web/src/app/(learn)/dashboard/page.tsx`
- **Viewport:** 390 × 844 (iPhone 13)
- **Defect class:** 1.6 (Component inconsistency)
- **Observed:** Streak card padding `p-3` (12px), XP card padding `p-4` (16px) trong cùng dashboard row, không có `data-variant` / `aria-disabled` / `data-loading` / `data-selected` phân biệt.
- **Expected:** Cùng padding token vì cùng pattern KPI card.
- **Severity:** P1 (CTA primary padding drift class).
- **Forward:** none.

Counterexample này là một *instance* mà QA pass đúng phải bắt được; nếu pass không bắt được, pass đang miss bug.
