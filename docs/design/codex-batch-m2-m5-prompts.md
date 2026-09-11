# Codex — Batch asset & mockup M2–M5 (sau khi final World Map được duyệt)

Reference đồng nhất: **`fig/worldmap-styleframe-final.png`** (mẫu vàng đã duyệt). Mọi prompt dưới đây feed file này làm `-i` để kế thừa góc/ánh sáng/màu/nét. Dùng `image_gen` native của Codex.

> **Mascot Fuxie — màu chuẩn (QUAN TRỌNG):** Fuxie là cáo **xanh sky-blue**, mặt/ngực/bụng/chóp đuôi **trắng**, mặc **hoodie teal**. **KHÔNG phải cáo cam/nâu.** Để chắc màu, có thể feed thêm ảnh nhận diện gốc làm reference: `apps/web/public/mascot-3d/concept/fuxie-3d-master-style-sheet.png` (hoặc `core/fuxie-3d-core-happy-wave.png`).

STYLE LOCK prefix (dán đầu MỌI prompt — giống bản World Map):
```
STYLE LOCK (mandatory, identical across all images):
- 2.5D dimetric isometric, true 2:1 angle (~26.57°), single light source top-left, soft shadow lower-right.
- Flat color blocks + ONE soft shadow layer + subtle inner stroke. NO photorealism, NO complex gradients, NO texture photos.
- Palette ONLY these hex: bg #F3FBFF, sky-blue #54A8E4 & #60A8E4, deep blue #3C78A8, deep ink #173B56, teal #2EC4B6, white #FFFFFF, accent #FF8A3D (<=5% area), reward amber #FFB703 (reward objects only).
- Warm, premium-minimal, cozy German village. Generous negative space. Rounded, tactile shapes.
- Mascot "Fuxie": a friendly fox-like coach, SAME proportions every time — BRIGHT SKY-BLUE fur (#60A8E4, shading #3C78A8), WHITE face/chest/belly/inner-ears/tail-tip, TEAL hoodie (#2EC4B6), warm eyes, soft rounded ears. Flat 2.5D. Fuxie is NOT an orange or brown fox.
NEGATIVE: no text/letters, no UI chrome, no harsh shadows, no neon, no clutter, no realistic lighting, no multiple light sources, NO orange or brown fox, no realistic fur.
```

## Đợt 1 — ASSET (nền & mascot), reference = final
1. **M2 — Marktplatz close-up plate** → `fig/m2-markt-plate.png`, portrait, high, `-i final`
   SCENE: close iso view of the market stall (Marktplatz) with awning, fruit/bread crates, a blank chalkboard sign (NO text), Fuxie beside it in a presenting pose, one paw raised. Empty soft space above for a title panel. Same palette/angle/light as reference.
2. **Mascot pose sheet** → `fig/fuxie-poses.png`, square 1024, high, transparent bg, `-i final`
   SCENE: the Fuxie fox in 4 poses, IDENTICAL proportions, evenly spaced, isolated on transparent background: (1) idle-wave, (2) correct-cheer (happy, thumbs-up energy), (3) wrong-oops (gentle shrug), (4) level-up-jump. Flat 2.5D, same style as reference.
3. **M3 — gameplay backdrop** → `fig/m3-study-backdrop.png`, portrait, medium, `-i final`
   SCENE: a minimal iso study nook with lots of empty central space for a vocabulary card to sit on, very calm and uncluttered, Fuxie small in the lower-right cheering. No UI, no text.
4. **M4 — village reward objects** → `fig/m4-reward-objects.png`, square 1024, high, transparent bg, `-i final`
   SCENE: a set of 4 isolated village reward objects on transparent background, evenly spaced: a bronze market medal, a bread-loaf trophy, a small lantern, a flag pennant. Reward amber #FFB703 IS allowed here. Flat 2.5D, same style as reference.

## Đợt 2 — MOCKUP MÀN (vật đối chiếu khi code; chữ = placeholder)
Khổ mobile dọc 1080x2340. Reference = final. Chữ luôn là khối placeholder, KHÔNG chữ thật.
5. **Mockup M2 Lesson Intro** → `fig/mock-m2-intro.png`, `-i final`
   SCENE: full mobile screen mockup of a lesson intro: top half shows the Marktplatz scene, bottom half a rounded info panel with placeholder text blocks (word count, time) and one prominent primary button (placeholder label). Status bar margin top, tab bar margin bottom. Show hierarchy/spacing/color only.
6. **Mockup M3 Gameplay** → `fig/mock-m3-gameplay.png`, `-i final`
   SCENE: full mobile screen mockup of a vocabulary gameplay screen: top progress bar, a large word-image card centered, four answer tiles in a 2x2 grid below (placeholder text), Fuxie in lower corner. Placeholder shapes for all text.
7. **Mockup M4 Reward** → `fig/mock-m4-reward.png`, `-i final`
   SCENE: full mobile screen mockup of a reward receipt: a reward burst with amber accents (this subtree may use #FFB703), a village reward object, placeholder XP/streak chips, and a primary button to return to the map. Celebratory but premium-minimal.

## Checklist duyệt batch (Claude + chủ dự án)
- [ ] Mọi asset cùng góc/nguồn sáng/bảng màu với final (không tấm nào lạc tông).
- [ ] Mascot giữ đúng tỉ lệ ở cả 4 pose.
- [ ] Reward amber chỉ xuất hiện ở M4 (reward objects/receipt), không ở M2/M3.
- [ ] Mockup: chữ đều là placeholder, có chừa lề status/tab bar.
- [ ] Không tấm nào rối; vẫn premium-minimal.

> Mockup chỉ là đích thẩm mỹ. Khi Antigravity code, số đo + chữ thật lấy từ tokens + spec, không pixel-match ảnh.
