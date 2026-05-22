# ADR: `data-reward-state` / `data-reward-context` Attribute Contract

- **Status**: Accepted
- **Date**: 2026-05-20
- **Owner**: Gamification Designer (GD)
- **Co-author**: Design System Designer (DSD)
- **Feature**: `gamified-ui-asset-rollout`
- **Related**: `.kiro/specs/gamified-ui-asset-rollout/requirements.md`, `.kiro/specs/gamified-ui-asset-rollout/design.md` (§E "Reward_State handling", §Correctness Properties — Property 9), `.kiro/specs/gamified-ui-asset-rollout/tasks.md` (task 5.3)

## Context

Reward amber `#FFB703` (`var(--fuxie-reward)`) là tín hiệu cảm xúc duy nhất trong learner UI báo "bạn đang/sắp được thưởng". Nếu màu này rò rỉ ra ngoài subtree thực sự là reward, nó mất giá trị tín hiệu, tạo cảm giác pay-to-win, và phá study-first principle (Requirement 16, design §F).

Để có thể vừa cho phép đúng nơi vừa **chặn được bằng máy** (Property 9 — Reward Amber Containment), mọi node có `color`/`background-color` trong dải amber buộc phải nằm dưới một ancestor mang một trong hai data-attribute đã thỏa thuận:

- `data-reward-state="<state>"` — node đang ở một Reward_State chính thức.
- `data-reward-context="true"` — exception duy nhất cho streak amber (xem §Streak Amber Exception).

ADR này đóng băng hợp đồng đó để frontend, design system, và CI test (Property 9, Property 22) đều dựa trên cùng một bảng.

## Decision

### 1) Reward_State enum (đúng 5 giá trị)

`RewardState ∈ { preview, earned, receipt, locked, pending }` — khớp `apps/web/src/lib/mascot/mascot-role.ts` (design §Data Models). Mọi component reward-related (`RewardPreview`, `RewardRevealMoment`, `ResultRewardLoop`, `ShopItemCard`, `ReviewRewardChip`) phải set `data-reward-state="<state>"` lên node gốc của subtree reward đó.

### 2) Allowed colors per state

Token nguồn (đã khai báo trong `apps/web/src/app/globals.css`, design §F):

- `--fuxie-reward: #FFB703` — reward amber, **chỉ** dùng trong các state cho phép dưới đây.
- `--fuxie-action: #54A8E4`, `--fuxie-action-hover: #3C93D1` — Bright Sky blue cho Primary_CTA mặc định.
- `--fuxie-success: #2EC4B6` — success / progress.
- `--fuxie-blue-{600,700,900}` — text deep blue, scrim.
- Neutral / disabled tokens (`--fuxie-blue-{100,200,400}` cho dim, plus design-system disabled grey).

| `data-reward-state` | `--fuxie-reward` (`#FFB703`) cho phép trong subtree? | Palette còn lại được phép | Mascot_Role mặc định | Ghi chú |
| --- | --- | --- | --- | --- |
| `preview` | ✅ Có | Bright Sky blue, success token, neutral | `coach` hoặc `companion` | Reward asset từ `REWARD_ASSETS` + label (vd `+10 Fucoin`). Subtree thường nằm trong `Skill_Motivation_Layer`. |
| `earned` | ✅ Có | Bright Sky blue, success token | `cheer` | Animation reveal `[1200ms, 2000ms]` (Req 7.1, 7.2, 13.5). |
| `receipt` | ✅ Có | Bright Sky blue, success token, neutral | `cheer` hoặc `companion` | Hiển thị XP, Fucoin, accuracy, time spent + đúng 1 Primary_CTA. |
| `locked` | ❌ Cấm | Neutral / disabled, deep blue | `guard` | Dùng greyscale + lock icon + unlock copy. |
| `pending` | ❌ Cấm | Neutral, Bright Sky blue (spinner) | `companion` | Spinner overlay; revert sau 10s nếu timeout (Req 8.7). |

Cấm thêm:

- `--fuxie-energy: #FF8A3D` không bao giờ là fill của Primary_CTA hoặc secondary action button, và tổng diện tích pixel ≤ 5% surface (Req 16.3, Property 22).
- Các state `locked`/`empty`/`error` của bất kỳ surface nào không dùng `--fuxie-reward` cho stroke/fill/icon/text (Req 16.5, Req 11.7).
- Exam `in-progress` không dùng `--fuxie-reward` trên bất kỳ UI component nào (Req 10.1, Req 10.4).

### 3) Streak Amber Exception (`data-reward-context="true"`)

Streak là cơ chế reward duy nhất tồn tại bên ngoài flow `preview → earned → receipt` chính thức nhưng vẫn cần signal amber để giữ ý nghĩa "đang nuôi chuỗi học". Để chứa exception này một cách hình thức:

- **Điều kiện áp dụng**: streak chip có thể carry `data-reward-context="true"` **chỉ khi** `streak_count ≥ 1` trong vòng 24 giờ kể từ lần học gần nhất (`last_learned_at`). Khi `streak_count === 0` hoặc khoảng cách `now − last_learned_at > 24h`, streak chip phải drop attribute và chuyển về palette neutral / Bright Sky blue.
- **Phạm vi cho phép**: chỉ streak indicator (Dashboard streak chip, header streak badge nếu có) được phép mang `data-reward-context="true"`. Bất kỳ node nào khác đặt attribute này đều vi phạm contract.
- **Mascot_Role**: streak chip thuộc Dashboard `default` state, mascot role mặc định là `coach` (không `cheer` — `cheer` chỉ dành cho `Reward_State === 'earned'` hoặc `empty + reached_goal`, Req 12.5).
- **Markup mẫu**:

  ```tsx
  <span
    data-reward-context="true"
    data-streak-count={streakCount}
    style={{ color: 'var(--fuxie-reward)' }}
  >
    🔥 {streakCount} ngày
  </span>
  ```

### 4) Forbidden

- Bất kỳ DOM node nào có computed `color` hoặc `background-color` trong dải `rgb(255, 183, 3) ± 5%` từng kênh RGB **mà không có** một ancestor mang `data-reward-state ∈ {preview, earned, receipt}` **hoặc** `data-reward-context="true"` đều vi phạm contract và phải fail Property 9 trong CI (Req 19.4).
- Đặt `data-reward-context="true"` lên node không phải streak indicator.
- Đặt `data-reward-state="locked"` hoặc `data-reward-state="pending"` rồi dùng `--fuxie-reward` trong subtree đó.
- Hardcode `#FFB703` / `rgb(255, 183, 3)` inline thay vì đi qua `var(--fuxie-reward)` (làm CI khó scan; design system lint sẽ cảnh báo).

## Consequences

- Frontend chỉ cần bọc bất kỳ subtree reward bằng một wrapper với `data-reward-state` để dùng amber một cách hợp lệ — không cần class one-off.
- CI test Property 9 (Req 19.4) walk DOM của mỗi P0 surface và assert containment một cách hình thức.
- Streak amber có exception duy nhất, narrow, có điều kiện thời gian rõ ràng — không mở cửa cho amber rò rỉ ra navigation, hero text, hoặc decoration.
- Khi muốn thêm một state reward mới (ví dụ `bonus`), phải mở rộng enum `RewardState` ở `mascot-role.ts` + cập nhật bảng trong ADR này + cập nhật Property 9 cho phép state mới.

## Cross-links

- **Property 9 — Reward Amber Containment**: `.kiro/specs/gamified-ui-asset-rollout/design.md` §Correctness Properties → "Property 9: Reward Amber Containment". Test file dự kiến: `tests/reward-amber-containment.spec.tsx` (task 17.2).
- **Requirement 16.1**: phạm vi cho phép `#FFB703` (Reward_State `preview/earned/receipt` + streak ≥ 1 trong 24h).
- **Requirement 16.5**: cấm `#FFB703` trong state `locked/empty/error`.
- **Requirement 16.2**: cấm `#FFB703` làm fill/background của Primary_CTA, secondary button, hoặc surface background ngoài Reward_State hợp lệ.
- **Requirement 11.7**: state `locked/empty/error` không render reward amber animation hoặc visual treatment thuộc Reward_State `earned`.
- **Requirement 19.4**: test format và pass/fail cho Property 9 trong CI.
- **Design §E "Reward_State handling"**: bảng quy ước `data-reward-state` ↔ amber ↔ Mascot_Role.
- **Design §F "Bright Sky palette enforcement"**: token nguồn `--fuxie-reward` và quy tắc dùng.
