# Design Critique — Slice #1 Từ vựng (M1–M5)

Date: 2026-07-01 · Skill: design:design-critique · Stage: refinement
Bằng chứng: 5 screenshot mobile trong `screenshots/`.

## Overall Impression
Từng màn riêng lẻ thì ổn, nhưng **đặt cạnh nhau thấy chắp vá** vì đang tồn tại **3 ngôn ngữ thị giác không được hoà vào một lớp chung**, và **mỗi màn một kiểu nền + header**. Đây là vấn đề *cohesion của design system*, không phải thiếu asset.

## Gốc rễ "chấp vá" — 3 register va nhau
1. **Minh hoạ 2.5D giàu chi tiết** (làng, quầy chợ, vật phẩm) — ấm, bóng mềm, có khối.
2. **UI chrome phẳng & generic** (TopBar xanh đậm, thẻ trắng, pill trắng, thanh tiến độ mảnh) — phẳng lì, "khô", craft thấp hơn hẳn minh hoạ.
3. **Mascot cel-shaded bóng** — 3D/bóng hơn cả hai cái trên.

Ba register này không chia sẻ vật liệu chung (bóng, viền, độ khối) nên mắt đọc ra "3 nguồn khác nhau dán lại".

## Consistency (nguồn chính của vấn đề)
| Yếu tố | Vấn đề | Khuyến nghị |
|---|---|---|
| Nền màn | M1 làng đầy; M2 nửa làng/nửa panel trắng; **M3 gần như trắng trơn**; M4 trắng + burst | Một hệ nền chung: mọi màn ngồi trên **nền trời-kem + motif đất isometric mờ**; nội dung nằm trong panel "kính mờ" bo tròn thống nhất |
| Surface/thẻ | Thẻ **trắng** (M3/M4) vs panel **tinted** (M2) vs không thẻ (M1) | Bỏ thẻ trắng thuần; dùng chung 1 loại panel (nền `--fuxie-blue-100`, bóng `--fuxie-shadow-card`, bo `--radius-lg`) |
| Header | M1/M4 bar xanh đậm; M2 chỉ back+title; M3 thanh progress | **Một hệ header**: cùng chiều cao/nền/độ bo; biến thể "world" (streak/gem/XP) và "in-lesson" (back/close + progress) phải cùng khung |
| Icon | Coin/gem/star ở TopBar là icon phẳng kiểu emoji, lệch hẳn vật phẩm painterly | Một bộ icon thống nhất, cùng vật liệu 2.5D với vật phẩm reward |
| Mascot | Bóng/3D hơn thế giới, khác scale giữa các màn | Thêm cùng bóng mềm/rim của thế giới cho mascot; cố định scale |

## M3 Gameplay — điểm chấp vá nặng nhất
Màn M3 gần như **trắng trơn**, word-card nhỏ trôi giữa khoảng trống, tương phản hẳn với M1/M2 lộng lẫy → cú "rơi" thị giác lớn nhất. **Đáng chú ý: asset `m3-study-backdrop.png` đã render nhưng KHÔNG được dùng.** Đưa backdrop này (làm nền mờ sau panel kính) sẽ kéo M3 về cùng thế giới.

## Visual Hierarchy
- M3: thứ tự đọc ổn (từ → nghe → đáp án) nhưng thiếu "sân khấu" cho word-card; nó không đủ nổi.
- M4: hierarchy tốt (burst → tiêu đề → chip → CTA).
- M1: node số to hơi lấn công trình; nên là ring/huy hiệu gọn đặt ở chân công trình.

## Accessibility (sơ bộ từ ảnh)
- TopBar xanh đậm chữ trắng: tương phản tốt. Text xám nhạt ở M2/M4 (mô tả) cần kiểm ≥4.5:1.
- Touch target pill/đáp án: đạt. Node trên map: đảm bảo ≥44px vùng chạm.

## What Works Well
- M1 World Map full-bleed: thế giới thống nhất, thoáng, đúng vibe.
- M4 Reward: hierarchy + containment amber chuẩn, cảm giác thưởng rõ.
- Fuxie đã đúng màu sky-blue, nhất quán giữa các pose.

## Priority Recommendations (theo tác động)
1. **Lớp "UI skin" thống nhất (Antigravity)** — 1 nền chung (trời-kem + đất mờ) + 1 loại panel kính mờ + 1 hệ header cho mọi màn. Bỏ thẻ trắng thuần. Đây là đòn xoá ~70% cảm giác chắp vá.
2. **Dùng backdrop cho M3 (Antigravity)** — đặt `m3-study-backdrop.png` mờ sau panel kính; word-card thành panel nổi lớn hơn. Kéo M3 về cùng thế giới.
3. **Thống nhất bộ icon TopBar (Codex)** — render coin/gem/XP-star cùng vật liệu 2.5D với vật phẩm reward, thay icon emoji-phẳng.
4. **Hoà mascot vào thế giới (Codex/Antigravity)** — thêm bóng mềm/rim nhất quán, cố định scale mọi màn.
5. **Node map gọn lại (Antigravity)** — ring/huy hiệu ở chân công trình thay vì ô số to lấn nhà.

> Kết luận: đây là bài toán **thống nhất design-system giữa minh hoạ ↔ UI ↔ mascot**, không phải vẽ thêm. Ưu tiên #1 và #2 sẽ xoá phần lớn cảm giác chắp vá ngay.
