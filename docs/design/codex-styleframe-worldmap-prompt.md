# Codex — Style Frame World Map (bước đầu tiên của redesign)

Mục tiêu: render **một** style frame (màn World Map) để **chốt phong cách** trước khi nhân rộng. Đây là "mẫu vàng" mọi asset sau sẽ kế thừa. Chưa render gì khác cho tới khi frame này được duyệt.

Engine: gpt-image-2 trên Codex. Khổ mobile dọc.

## Chọn renderer (prompt giống nhau cho cả hai)
Phần **STYLE LOCK + SCENE** bên dưới là tool-agnostic — dùng được bất kể renderer. Chỉ cách gọi khác nhau:
- **Ưu tiên — image-gen native của Codex:** nếu Codex có công cụ/skill sinh ảnh built-in (dùng credential OpenAI sẵn của Codex), dùng nó → **không cần `OPENAI_API_KEY` riêng**. Feed nguyên prompt, yêu cầu portrait + 3 biến thể.
- **Fallback — CLI `gpt-image` (wuyoscar):** wrapper bên thứ ba, đọc biến môi trường `OPENAI_API_KEY` (không tự đọc `.env`). Trước khi chạy: `export OPENAI_API_KEY=sk-...` trong shell Codex. Tốn phí theo ảnh (medium ~$0.04).

> **Mascot Fuxie — màu chuẩn (QUAN TRỌNG):** Fuxie là cáo **xanh sky-blue**, mặt/ngực/bụng/chóp đuôi **trắng**, mặc **hoodie teal**. **KHÔNG phải cáo cam/nâu.** Để khóa màu, feed thêm ảnh nhận diện gốc làm reference: `apps/web/public/mascot-3d/concept/fuxie-3d-master-style-sheet.png`.

## Bản đồ khu làng ↔ chủ đề từ vựng A1 (dùng nội dung thật)
Làng A1 khởi đầu gồm 6 khu, gắn với theme có thật trong `content/a1/vocabulary`:
- **Marktplatz (chợ)** → Essen und Trinken / Einkaufen
- **Wohnhaus (nhà ở)** → Wohnen
- **Familienhaus** → Familie und Freunde
- **Schulhaus (trường)** → Schule & Klassenzimmer
- **Bahnhof (ga)** → Reisen und Verkehr
- **Brunnenplatz (quảng trường có đài phun)** → điểm trung tâm (Kommunikation)

Slice từ vựng đầu tiên neo vào **Marktplatz**, nên mascot đứng cạnh chợ.

## Lệnh render — 3 biến thể để chọn (chất lượng medium, rẻ, nhanh)

```bash
gpt-image -n 3 --size portrait --quality medium -f fig/worldmap-styleframe.png -p '
STYLE LOCK (mandatory, identical across all images):
- 2.5D dimetric isometric, true 2:1 angle (~26.57°), single light source top-left, soft shadow lower-right.
- Flat color blocks + ONE soft shadow layer + subtle inner stroke. NO photorealism, NO complex gradients, NO texture photos.
- Palette ONLY these hex: bg #F3FBFF, sky-blue #54A8E4 & #60A8E4, deep blue #3C78A8, deep ink #173B56, teal #2EC4B6, white #FFFFFF, accent #FF8A3D (<=5% area), reward amber #FFB703 (reward objects only).
- Warm, premium-minimal, cozy German village. Generous negative space. Rounded, tactile shapes.
- Mascot "Fuxie": a friendly fox-like coach, SAME proportions every time — BRIGHT SKY-BLUE fur (#60A8E4, shading #3C78A8), WHITE face/chest/belly/inner-ears/tail-tip, TEAL hoodie (#2EC4B6), warm eyes, soft rounded ears. Flat 2.5D matching the world. Fuxie is NOT an orange or brown fox.
NEGATIVE: no text/letters in image, no UI chrome, no drop-shadow harshness, no neon, no clutter, no realistic lighting, no multiple light sources, NO orange or brown fox, no realistic fur.

SCENE: a cozy isometric German learning village as a mobile game world map, portrait orientation.
A soft cobblestone path winds vertically through the village connecting six small location buildings, spaced with generous breathing room:
a market stall with awning (Marktplatz), a half-timbered residential house (Wohnhaus), a warm family house (Familienhaus),
a little schoolhouse with a bell (Schulhaus), a small train station (Bahnhof), and a central fountain plaza (Brunnenplatz).
On the path between buildings sit a few clean, empty rounded NODE spots (flat circular pads, no icons, no text) marking clickable lesson points.
The fox mascot Fuxie stands beside the market stall in an idle-wave pose.
Cream sky background, gentle rolling ground, a few simple trees and bushes, soft long shadows.
Leave clear empty margins at top (for a status bar) and bottom (for a tab bar).
'
```

## CHỐT: biến thể C → render bản final nét cao

Đã duyệt: **C** (`fig/worldmap-styleframe-c.png`) làm mẫu vàng — thoáng nhất, lề mobile tốt, node sạch, đường uốn dọc đúng IA. Render final dùng C làm reference (`-i`) qua `image_gen` native của Codex (hoặc CLI nếu có key):

```
SCENE PROMPT (giữ nguyên STYLE LOCK prefix ở mục trên, rồi nối phần này):
Refine the reference image into the gold-standard World Map. Keep its winding vertical cobblestone
path and the airy, premium-minimal composition with generous empty margins. Six locations along the
path from top to bottom: market stall with Fuxie waving (top, this is the first lesson area),
half-timbered house, residential house, schoolhouse, central fountain plaza, train station (bottom).
Make the empty clickable NODE pads uniform: flat soft-edged circular pads resting on the path, evenly
spaced, no icons, no text. Crisper shapes, single top-left light, identical Bright Sky palette, soft
long shadows. Keep the top ~12% and bottom ~14% of the canvas clear of art (reserved for app status
bar and tab bar). Let the path continue past the bottom edge to imply more village below.
```

Gọi: `image_gen` native, input reference = `fig/worldmap-styleframe-c.png`, size portrait, quality high, output `fig/worldmap-styleframe-final.png`. (CLI tương đương: `gpt-image --size portrait --quality high -i fig/worldmap-styleframe-c.png -f fig/worldmap-styleframe-final.png -p '<STYLE LOCK + SCENE trên>'`)

### Verify bản final trước khi nhân rộng
- [ ] Lề trên ~12% + dưới ~14% thực sự trống (đặt thử TopBar/BottomNav không đè art).
- [ ] 6 node pad đồng nhất, sạch, không chữ/icon.
- [ ] Đường vẫn uốn dọc và chạy tiếp khỏi mép dưới (gợi thế giới còn tiếp).
- [ ] Giữ y nguyên góc/nguồn sáng/bảng màu của C; reward amber vẫn vắng mặt.
- [ ] Marktplatz (khu slice đầu) nổi bật, mascot cạnh chợ.

## Checklist DUYỆT style frame (chủ dự án + Claude)
- [ ] Đúng **1 góc isometric, 1 nguồn sáng** (không tấm nào lệch).
- [ ] Chỉ dùng đúng bảng màu Bright Sky; reward amber KHÔNG xuất hiện lung tung.
- [ ] Cảm giác **premium tối giản** (Monument Valley), nhiều khoảng thở — không rối.
- [ ] Thật sự là **một thế giới làng** (Mykonos voxel), không phải minh họa rời.
- [ ] Có **chừa lề trên/dưới** cho TopBar/BottomNav mobile.
- [ ] Node pad sạch, không chữ, không icon (chữ/nhãn sẽ do code render).
- [ ] Mascot Fuxie đúng tỉ lệ, hợp tông thế giới.

## Khi duyệt xong
→ Dùng bản final làm **reference image (`-i`)** cho mọi asset/mockup tiếp theo (M2–M5) để ép đồng nhất. Tham chiếu pattern: `references/style-lock.md` trong skill `fuxie-redesign` và mục 6 của `fuxie-redesign-plan-2026-06.md`.

> Nhắc: gpt-image render chữ không chuẩn → frame KHÔNG chứa chữ; mọi text + số đo lấy từ design tokens khi Antigravity code.
