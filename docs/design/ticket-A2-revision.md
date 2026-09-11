# TICKET-A2-REV — World Map: full-bleed + neo node đúng art

A2 đã chạy (TopBar, 6 WorldNode, BottomNav, nối DB, check:quick xanh) nhưng **chưa đạt Gate B thị giác**. Vòng sửa này tập trung vào cảm giác "world-first" và độ khớp với mẫu vàng. Vẫn KHÔNG đụng lõi.

Matches mockup: `fig/worldmap-styleframe-final.png` (cảnh tràn màn, không phải ảnh đóng hộp).

## Vấn đề cần sửa
1. **Thế giới đang "đóng hộp" giữa màn, mảng trắng lớn trên/dưới.** Phải để map **full-bleed**: phủ hết chiều ngang, lấp tối đa chiều dọc giữa TopBar và BottomNav.
   - Đặt `background` trang = `var(--fuxie-blue-50)` (#F3FBFF) để mọi khoảng trống **hòa với màu trời** của map, không còn nền trắng.
   - **Bỏ khung/viền** của `IsoPlate` ở use-case nền-thế-giới (IsoPlate frame chỉ dùng cho asset card). Map nền không có border, không bo góc lộ mép.
   - Phone cao hơn tỉ lệ ảnh (2:3) → cho map **cuộn dọc** (overflow-y) với plate phủ full width, neo TOP; path chạy tiếp xuống dưới đúng tinh thần "thế giới còn tiếp". TopBar/BottomNav là overlay cố định nổi trên map.
2. **Neo lại tọa độ 6 node theo art final thực tế** (toạ độ % theo bbox công trình trong `worldmap-styleframe-final.png`):
   - Node 1 **Marktplatz = góc trái-trên**, ngay trên quầy chợ (đang bị đặt giữa-trên → sai).
   - 2 Wohnhaus (phải-trên), 3 Schulhaus (phải-giữa), 4 Brunnenplatz (giữa), 5 Familienhaus (trái-giữa), 6 Bahnhof (trái-dưới) — căn đúng vào từng nhà.
   - **Không để node che mascot Fuxie** (cạnh chợ): đặt ring/badge node lệch khỏi mascot, hoặc thu nhỏ, để Fuxie luôn nhìn thấy.
3. WorldNode mở (node 1) giữ là Primary_CTA duy nhất; node khóa mờ + ổ khóa; mastered = vương miện (logic A2 giữ nguyên).

## Ràng buộc (giữ nguyên)
- Không đụng database/srs-engine/ai-service/content. Style qua `var(--fuxie-*)`. Touch target ≥44px. Reward-amber containment + energy ≤5% + Primary_CTA discipline. Tôn trọng `useReducedMotion`/DPR. Plate tĩnh.

## Acceptance
- [ ] Map full-bleed, KHÔNG còn mảng trắng đóng hộp; khoảng trống (nếu có) mang màu `--fuxie-blue-50` hòa với trời.
- [ ] 6 node neo đúng từng công trình; node 1 trên quầy chợ; Fuxie vẫn thấy rõ.
- [ ] Đặt cạnh `worldmap-styleframe-final.png`: cảm giác cùng một thế giới, tràn màn, không phải ảnh dán.
- [ ] `pnpm check:quick` xanh + visual-capture cập nhật (mobile + desktop) khớp.
- [ ] Chỉ chạm `apps/web` (+`packages/ui` nếu cần chỉnh IsoPlate cho biến thể không-viền); lõi nguyên vẹn.

> Nếu `IsoPlate` cần biến thể full-bleed không viền, thêm prop (vd `bleed`/`frameless`) trong `packages/ui` thay vì hardcode tại màn.
