# TICKET-A1 — Design tokens 2.5D + UI primitives

Handoff cho **Antigravity**. Ticket này độc lập với asset (chạy song song khi Codex render). Đây là nền design system mới — mọi màn slice sẽ dựng trên đây, nên làm chuẩn một lần.

Matches mockup: chưa cần (đây là tầng token/primitive, không phải màn).
Scope: `apps/web/src/app/globals.css` + `packages/ui` (`@fuxie/ui`).

## Core boundary (bắt buộc)
KHÔNG đụng `packages/database`, `packages/srs-engine`, `apps/ai-service`, `content/`. Ticket này chỉ thêm token + component trình bày. Không đổi logic học, không thêm tính năng học.

## Giữ nguyên hợp đồng token cũ
Không đổi tên/giá trị token "Bright Sky" hiện có. Reward-amber containment, energy ≤5%, Primary_CTA discipline vẫn hiệu lực (xem comment đầu `:root` + `docs/design/design-tokens.md`). Token mới chỉ **bổ sung**.

---

## Phần 1 — Thêm tokens 2.5D vào `:root`

Chèn **ngay trước dấu `}` đóng `:root`** (hiện ở dòng ~63, sau block `--fuxie-reward`) trong `apps/web/src/app/globals.css`:

```css
  /* ===== 2.5D / mobile-first additions (redesign 2026-06) ===== */
  /* Elevation — bóng mềm thống nhất cho thế giới phẳng */
  --fuxie-shadow-iso:   0 8px 16px -8px rgba(23,59,86,.28);
  --fuxie-shadow-card:  0 2px 8px -2px rgba(23,59,86,.16);
  --fuxie-shadow-press: inset 0 1px 2px rgba(23,59,86,.24);

  /* Bo góc — tactile, game-like */
  --fuxie-radius-sm: 10px;
  --fuxie-radius-md: 16px;
  --fuxie-radius-lg: 24px;
  --fuxie-radius-pill: 999px;

  /* Spacing 4pt */
  --fuxie-space-1: 4px;  --fuxie-space-2: 8px;  --fuxie-space-3: 12px;
  --fuxie-space-4: 16px; --fuxie-space-5: 24px; --fuxie-space-6: 32px; --fuxie-space-7: 48px;

  /* Typography — 1 typeface, scale mobile (font-size/line-height) */
  --fuxie-font: "Nunito", system-ui, sans-serif;
  --fuxie-text-display: 28px; --fuxie-leading-display: 34px;
  --fuxie-text-h1: 22px;      --fuxie-leading-h1: 28px;
  --fuxie-text-h2: 18px;      --fuxie-leading-h2: 24px;
  --fuxie-text-body: 16px;    --fuxie-leading-body: 24px;
  --fuxie-text-caption: 13px; --fuxie-leading-caption: 18px;

  /* Motion — chỉ ở state-change; asset lớn đứng yên */
  --fuxie-ease-tactile: cubic-bezier(.2,.8,.2,1.2);
  --fuxie-dur-tap: 120ms;
  --fuxie-dur-reward: 480ms;

  /* Touch target tối thiểu mobile */
  --fuxie-tap-min: 44px;
```

Nếu cần utility-class cho các giá trị này, khai báo tương ứng trong block `@theme` (dòng ~64) theo đúng cách Tailwind hiện dùng. `Nunito` phải được nạp như một webfont (next/font) — nếu chưa có, thêm trong layout gốc.

## Phần 2 — Mirror token vào `@fuxie/ui`

Trong `packages/ui/src/tokens/index.ts` thêm các export mới (giữ nguyên `colors` cũ):

```ts
export const elevation = {
  iso: "0 8px 16px -8px rgba(23,59,86,.28)",
  card: "0 2px 8px -2px rgba(23,59,86,.16)",
  press: "inset 0 1px 2px rgba(23,59,86,.24)",
} as const;
export const radius = { sm: 10, md: 16, lg: 24, pill: 999 } as const;
export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 24, 6: 32, 7: 48 } as const;
export const type = {
  display: { size: 28, leading: 34 }, h1: { size: 22, leading: 28 },
  h2: { size: 18, leading: 24 }, body: { size: 16, leading: 24 },
  caption: { size: 13, leading: 18 }, font: '"Nunito", system-ui, sans-serif',
} as const;
export const motion = { easeTactile: "cubic-bezier(.2,.8,.2,1.2)", durTap: 120, durReward: 480 } as const;
export const tapMin = 44 as const;
```

## Phần 3 — Component primitives (`packages/ui/src/components`)

Tạo thư mục `packages/ui/src/components` và thêm export trong `packages/ui/package.json`:

```json
"exports": {
  "./tokens": "./src/tokens/index.ts",
  "./components": "./src/components/index.ts"
}
```

Dựng 11 primitives dùng chung (mỗi cái 1 file + 1 fixture/test). Tất cả style qua `var(--fuxie-*)` ở trên — **không hardcode màu/spacing**.

| Primitive | Mục đích | Yêu cầu chính |
| --- | --- | --- |
| `PrimaryCta` | Nút hành động chính | `data-role="primary-cta"`; nền chỉ `--fuxie-action`/`-hover`; cao ≥ `--fuxie-tap-min`; bo `--fuxie-radius-md`; press dùng `--fuxie-shadow-press` + `--fuxie-dur-tap` |
| `IsoPlate` | Khung chứa asset isometric (plate thế giới) | bóng `--fuxie-shadow-iso`; ảnh tĩnh, không animate; có slot alt |
| `ScenePanel` | Panel học nổi trên thế giới (lesson intro) | nền `--fuxie-blue-100`; bo `--fuxie-radius-lg`; bóng `--fuxie-shadow-card` |
| `WorldNode` | Điểm bài học trên map | 3 state: `locked`/`open`/`mastered`; vương miện chỉ khi mastered; tap target ≥44px; KHÔNG dùng reward amber ở state locked |
| `OptionTile` | Ô đáp án (gameplay) | tap tactile (`ease-tactile`,`dur-tap`); đúng→viền `--fuxie-success`; sai→rung nhẹ + lộ đáp án; ≥44px |
| `RewardBurst` | Hiệu ứng nhận thưởng | render trong subtree `[data-reward-state="earned"]`; amber hợp lệ ở đây; `--fuxie-dur-reward` |
| `ProgressRing` | Vòng tiến độ | dùng `--fuxie-success`; tôn trọng `prefers-reduced-motion` |
| `AudioButton` | Nút phát/ghi âm | icon rõ; ≥44px; state playing/recording; `aria-label` |
| `StreakPill` | Chỉ báo streak | ngoại lệ amber hợp lệ (`data-reward-context="true"`) |
| `TopBar` (mobile) | Thanh trên: avatar, streak, gem | cao gọn; an toàn vùng tai thỏ (safe-area-inset-top) |
| `BottomNav` (mobile) | Tab: Thế giới / Ôn tập / Hồ sơ | 3 mục; mỗi tab ≥44px; `safe-area-inset-bottom`; active state rõ |

`packages/ui/src/components/index.ts` re-export tất cả.

## Ràng buộc a11y / mobile (mọi primitive)
- Mọi phần tử bấm được: reachable bằng Tab, focus ring nhìn thấy, target ≥ `--fuxie-tap-min` (44px), `touch-action: manipulation`.
- Tôn trọng `prefers-reduced-motion` (đã có hook `useReducedMotion` trong `apps/web/src/components/learning-world`).
- `--fuxie-reward` chỉ trong subtree `[data-reward-state="earned"|"preview"|"receipt"]` hoặc `[data-reward-context="true"]`.
- `--fuxie-energy` ≤5% diện tích; không làm nền Primary_CTA.

## Acceptance
- [ ] `pnpm check:quick` xanh (gồm property test reward-amber-containment + visual-audit + locale parity).
- [ ] `pnpm --filter @fuxie/ui typecheck` xanh.
- [ ] Mỗi primitive có fixture/story render được; chụp được ảnh state ở mobile.
- [ ] Không có giá trị màu/spacing hardcode trong primitives (đều qua `var(--fuxie-*)`).
- [ ] Không file nào trong database/srs-engine/ai-service/content bị đụng (kiểm bằng `git diff --stat`).

Blocked by: none — có thể bắt đầu ngay.

> Khi xong: handoff lại để Claude ráp primitives vào màn World Map (TICKET-A2) bám mockup final của Codex.
