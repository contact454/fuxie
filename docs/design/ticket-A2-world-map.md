# TICKET-A2 — Màn World Map (vertical slice từ vựng, M1 + M5)

Handoff cho **Antigravity**. Lắp các primitives của A1 thành màn World Map — màn chính world-first, thay cho dashboard card-heavy.

Matches mockup: **`fig/worldmap-styleframe-final.png`** (mẫu vàng đã duyệt — art-direction reference, KHÔNG pixel-match; số đo lấy từ tokens).
Scope: `apps/web/src/app/(learn)/dashboard` + `apps/web/src/components/learning-world` + `apps/web/src/components/dashboard`. Dùng primitives từ `@fuxie/ui/components`.
Blocked by: TICKET-A1 (done).

## Core boundary (bắt buộc)
KHÔNG đụng `packages/database`, `packages/srs-engine`, `apps/ai-service`, `content/`. Đọc dữ liệu tiến độ/khóa học qua API/hook hiện có; không đổi schema, không thêm tính năng học. Tuân thủ role gate AGENTS.md.

## Quyết định IA đã chốt
- Màn `dashboard` trở thành **World Map world-first** (không còn là lưới card). Giữ route cũ để không vỡ điều hướng.
- **6 location = 6 node.** `WorldNode` overlay **lên từng công trình** trong ảnh nền (không dùng pad tròn rời). 6 khu, gắn theme A1 thật:
  1. Marktplatz → Essen und Trinken / Einkaufen (khu của slice từ vựng đầu, **mở** sẵn)
  2. Wohnhaus → Wohnen
  3. Familienhaus → Familie und Freunde
  4. Schulhaus → Schule & Klassenzimmer
  5. Brunnenplatz → Kommunikation (điểm trung tâm)
  6. Bahnhof → Reisen und Verkehr
- Trạng thái node: `locked` (mờ) / `open` (sáng) / `mastered` (vương miện). Slice đầu: Marktplatz `open`, còn lại `locked`.

## Việc cần làm (end-to-end)
1. **Nền thế giới:** render `fig/worldmap-styleframe-final.png` làm plate tĩnh qua `IsoPlate` (KHÔNG animate). Dùng `learning-world/LearningWorldCanvas` + `HotspotList` để đặt overlay theo tọa độ; tôn trọng `useReducedMotion`, `useDevicePixelRatio` đã có.
2. **WorldNode overlay** lên 6 công trình theo tọa độ hotspot (toạ độ tỉ lệ %, không hardcode px theo ảnh). Tap node `open` → điều hướng vào lesson intro (M2). Node `locked` không bấm được, không dùng reward amber.
3. **TopBar (mobile):** avatar + `StreakPill` + gem/đếm tiến độ, đặt trong vùng lề trên ảnh đã chừa, dùng `safe-area-inset-top`.
4. **BottomNav (mobile):** 3 tab Thế giới / Ôn tập / Hồ sơ, `safe-area-inset-bottom`, tab "Thế giới" active.
5. **M5 (map sau reward):** khi quay lại map sau khi hoàn thành Marktplatz, node đó chuyển `mastered` (vương miện) và sáng hơn — tạo cảm giác "thế giới lớn lên". Trạng thái lấy từ tiến độ hiện có, không bịa.
6. **Desktop:** mở rộng từ layout mobile (căn giữa, max-width), không dựng layout desktop riêng.

## Ràng buộc (giữ từ A1)
- Mọi giá trị màu/spacing/elevation/motion qua `var(--fuxie-*)`; không hardcode.
- Touch target ≥ 44px; focus ring; `touch-action: manipulation`.
- Reward-amber containment, energy ≤5%, Primary_CTA discipline còn nguyên.
- Plate lớn tĩnh; chỉ state-change nhỏ mới animate (`--fuxie-dur-tap`, `--fuxie-ease-tactile`).

## Acceptance
- [ ] `pnpm check:quick` xanh (gồm reward-amber containment + visual-audit + locale parity).
- [ ] Thêm entry visual-capture cho màn World Map (mobile + desktop) vào manifest; screenshot khớp.
- [ ] So sánh mắt với `worldmap-styleframe-final.png`: cùng look & feel (góc, màu, bố cục, khoảng thở).
- [ ] Mobile: TopBar/BottomNav không đè art; mọi node ≥44px; Marktplatz `open`, 5 node còn lại `locked`.
- [ ] `git diff --name-only` cho thấy chỉ chạm `apps/web` + `packages/ui`; lõi nguyên vẹn (lưu ý: working tree có thay đổi cũ không liên quan — chỉ xét file có mtime của phiên này).
- [ ] `pnpm --filter @fuxie/ui typecheck` xanh nếu có thêm/đổi primitive.

> Mockup M2–M5 (lesson intro, gameplay, reward) đang được Codex render; A2 chỉ cần bản final World Map nên làm được ngay. Khi xong, handoff lại để Claude verify + ráp tiếp M2 (lesson intro).
