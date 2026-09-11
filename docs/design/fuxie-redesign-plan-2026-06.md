# Fuxie Redesign Plan — Vertical Slice "Từ vựng"

Date: 2026-06-30
Vai chinh: Product Designer / UX-UI Designer (điều phối)
Vai phoi hop: Design System Designer, Gamification Designer, Frontend Engineer (Antigravity), Image Production (Codex / gpt-image-2.0)

Tài liệu này là sản phẩm của buổi grill-me ngày 2026-06-30. Nó **thay thế** cách tiếp cận dàn trải của `learner-ui-design-production-plan.md` bằng một chiến lược **vertical slice** có kiểm soát. Mọi quyết định dưới đây đã được chốt với chủ dự án.

---

## 0. Mười một quyết định nền (đã chốt)

1. Vấn đề là **cả visual lẫn UX**, sản phẩm lệch khỏi tầm nhìn — mới ~10%, chắp vá.
2. Tầm nhìn **Learning World** vẫn đúng → mục tiêu là **thực thi lại cho ra hồn**, không đổi định hướng.
3. **Rebuild lớp UI**, giữ nguyên lõi: `packages/database`, `packages/srs-engine`, `apps/ai-service`, toàn bộ `content/` (A1–C2).
4. Được phép **vẽ lại Information Architecture** trong giới hạn: **không thêm tính năng học mới, không đổi nội dung bài**.
5. **Mobile-first.** Desktop là bản mở rộng.
6. **Vertical slice trước**, chủ đề **Từ vựng (Vocabulary)**. Luồng: mở app → world map → vào bài → làm dạng bài → nhận reward.
7. Nghiệm thu **A+B**: trực giác chủ dự án + sánh ngang chuẩn tham chiếu.
8. Chuẩn tham chiếu: **Duolingo** (gameplay/feedback loop), **Mykonos voxel** (world-first/art thống nhất), **Monument Valley** (premium tối giản).
9. Art **2.5D isometric phẳng có gu**; mascot **giữ nhận diện**, blend lại cho khớp phong cách mới (không để mascot 3D-render lạc tông giữa thế giới phẳng).
10. Phân vai: **Claude (điều phối)** = design system + spec + prompt + ticket + nghiệm thu · **Codex** = render asset **và mockup màn hình** làm vật đối chiếu · **Antigravity** = code UI, **không đụng lõi**.
11. Mockup = **chuẩn art-direction (look & feel)**, số liệu chính xác lấy từ design tokens + spec. Quy trình: **style frame duyệt trước → nhân rộng → Antigravity code bám mockup đã duyệt**.

---

## 1. Chẩn đoán: vì sao bản hiện tại "chắp vá"

Dựa trên khảo sát code thật (`packages/ui` chỉ có `tokens`, `components/` phân tán theo 20+ skill folder, kho `mascot-3d` đồ sộ, token contract "Bright Sky" rất chặt nhưng UI chưa bám). Năm nguyên nhân gốc:

1. **Không có "mẫu vàng" để neo.** Asset batch A–E đã sinh ra (location plates, UI frames, mascot poses, reward objects, 6 mockup) nhưng được làm dàn trải cho 14 surface cùng lúc, không màn nào hoàn chỉnh end-to-end → không có chuẩn để các màn còn lại đối chiếu.
2. **Art thiếu đồng nhất.** Mascot dùng look 3D-render (rig `.glb` + poster PNG) trong khi world props lại theo hướng khác → mỗi tấm một ánh sáng/tỉ lệ/góc, ráp lại trông vá. Đây là bệnh kinh điển khi sinh ảnh AI không có style lock.
3. **Token đúng nhưng component sai.** Hệ token "Bright Sky" rất kỷ luật (reward-amber containment, energy budget ≤5%, Primary_CTA discipline) nhưng `packages/ui/src` gần như rỗng — component thực tế nằm rải rác trong `apps/web`, không tái sử dụng, nên mỗi màn tự "diễn giải" token một kiểu.
4. **IA vẫn card-heavy.** `components/dashboard` còn `stat-card`, `quick-action`, `DashboardMockupClient`… — tức màn chính vẫn là dashboard card, chưa phải "world-first" như tầm nhìn. `learning-world/LearningWorldCanvas` tồn tại nhưng chưa là trục chính của trải nghiệm.
5. **Mobile là hạng hai.** Layout được dựng kiểu desktop rồi nén xuống mobile, ngược với nguyên tắc "handheld game" trong nghiên cứu.

> Kết luận: không phải làm sai tầm nhìn, mà là **làm thiếu một chuẩn thực thi đủ hoàn chỉnh để nhân rộng**. Vertical slice giải đúng bệnh này.

---

## 2. Định hướng nghệ thuật — "Fuxie Learning World 2.5D"

### 2.1 Ba trụ phong cách (tổng hợp 3 chuẩn tham chiếu)

| Trụ | Lấy từ | Áp dụng cho Fuxie |
| --- | --- | --- |
| **World-first, isometric** | Mykonos voxel | Màn chính là bản đồ làng Đức isometric, không phải list card. Mỗi khu = một kỹ năng/chủ đề. |
| **Premium tối giản** | Monument Valley | Bảng màu kỷ luật, hình khối đơn giản, bóng mềm, nhiều khoảng thở. Không nhồi chi tiết. |
| **Gameplay & feedback loop** | Duolingo | Vòng: hành động → phản hồi tức thì → reward → tiến độ rõ. Micro-interaction tactile ở mọi nút. |

### 2.2 Quy tắc art bắt buộc (để ép đồng nhất — chống bệnh "vá")

- **Một góc isometric duy nhất:** 2:1 dimetric (~26.57°), nguồn sáng từ trên-trái, bóng mềm đổ xuống-phải. **Mọi** asset thế giới tuân theo.
- **Hình khối phẳng, không texture ảnh thực:** màu khối + bóng mềm 1 lớp + viền trong nhẹ. Cấm gradient phức tạp, cấm photoreal.
- **Bảng màu khóa theo "Bright Sky" hiện có** (mục 3) — Codex nhận đúng hex, không tự chế màu.
- **Mascot Fuxie:** giữ hình dáng/màu cáo nhận diện, **vẽ lại ở dạng 2.5D phẳng** đồng bộ thế giới. Bản 3D-render chỉ dùng cho 1 vị trí "linh vật chính" tĩnh (splash/onboarding), không rải khắp UI.
- **Tỉ lệ asset cố định:** location plate 1:1 (1024²), prop nhỏ 1:1 (512²), mascot pose 3:4. Khai báo trong mọi prompt.

---

## 3. Design tokens — tiến hóa từ "Bright Sky", không đập bỏ

Giữ nguyên tên semantic token đang là source-of-truth ở `apps/web/src/app/globals.css` (và contract trong `.kiro/specs/gamified-ui-asset-rollout/`). Redesign **bổ sung** lớp tokens cho 2.5D, không phá hợp đồng cũ.

### 3.1 Giữ nguyên (color core)

| Token | Hex | Vai trò |
| --- | --- | --- |
| `--fuxie-blue-500` / `--fuxie-action` | `#54A8E4` | Brand primary / Primary CTA |
| `--fuxie-action-hover` | `#3C93D1` | CTA hover/pressed |
| `--fuxie-blue-900` | `#173B56` | Body text / scrim |
| `--fuxie-success` | `#2EC4B6` | Tiến độ / mastered |
| `--fuxie-energy` | `#FF8A3D` | Accent ≤5% diện tích |
| `--fuxie-reward` | `#FFB703` | Reward amber (chỉ trong subtree reward) |
| `--fuxie-blue-50` | `#F3FBFF` | Nền trang |

> Reward-amber containment + energy budget ≤5% + Primary_CTA discipline: **giữ nguyên hiệu lực**. Component mới phải pass property test `tests/reward-amber-containment.spec.tsx`.

### 3.2 Bổ sung mới (cho 2.5D & mobile-first) — Antigravity thêm vào `:root` + `packages/ui/src/tokens`

```
/* Elevation — bóng mềm thống nhất cho thế giới phẳng */
--fuxie-shadow-iso:   0 8px 16px -8px rgba(23,59,86,.28);
--fuxie-shadow-card:  0 2px 8px -2px rgba(23,59,86,.16);
--fuxie-shadow-press: 0 1px 2px rgba(23,59,86,.24) inset;

/* Bo góc — tactile, game-like */
--fuxie-radius-sm: 10px;  --fuxie-radius-md: 16px;  --fuxie-radius-lg: 24px;  --fuxie-radius-pill: 999px;

/* Spacing scale 4pt, mobile-first */
--fuxie-space-1: 4px; --2: 8px; --3: 12px; --4: 16px; --5: 24px; --6: 32px; --7: 48px;

/* Typography — 1 typeface, scale gọn cho mobile */
--fuxie-font: "Nunito", system-ui, sans-serif;   /* tròn, ấm, hợp game học */
--fuxie-text-display: 28/34; --h1: 22/28; --h2: 18/24; --body: 16/24; --caption: 13/18;

/* Motion — chỉ ở state-change, asset lớn đứng yên (Req hiệu năng) */
--fuxie-ease-tactile: cubic-bezier(.2,.8,.2,1.2);  /* elastic nhẹ */
--fuxie-dur-tap: 120ms; --dur-reward: 480ms;

/* Touch target tối thiểu mobile */
--fuxie-tap-min: 44px;
```

### 3.3 Component primitives cần dựng trong `packages/ui` (dùng chung, hết "mỗi màn một kiểu")

`PrimaryCta`, `IsoPlate` (khung asset isometric), `ScenePanel` (panel học nổi trên thế giới), `RewardBurst`, `ProgressRing`, `WorldNode` (điểm trên map), `OptionTile` (ô đáp án), `AudioButton`, `StreakPill`, `TopBar (mobile)`, `BottomNav (mobile)`.

---

## 4. Vertical slice "Từ vựng" — IA & đặc tả 5 màn

### 4.1 IA mới (world-first, mobile)

```
[Splash + Mascot 3D]
      ↓
[WORLD MAP]  ← màn chính, thay cho dashboard card
   • Làng Đức isometric, mỗi khu = 1 chủ đề từ vựng
   • Node sáng = mở; node mờ = khóa; node có vương miện = mastered
   • Mascot đứng ở node hiện tại; streak pill + tiến độ ở TopBar
      ↓ (tap node "Chợ / Markt")
[LESSON INTRO — ScenePanel]
   • Cảnh khu chợ + mascot giới thiệu chủ đề
   • Số từ, thời gian ước tính, nút "Bắt đầu" (PrimaryCta)
      ↓
[GAMEPLAY — vòng lặp 1 từ/lượt]
   • Dạng bài từ vựng (chọn ảnh↔từ / nghe↔chọn / ghép cặp)
   • Phản hồi tức thì: đúng → success + chip tiến độ; sai → rung nhẹ + đáp án đúng
   • Thanh tiến độ lượt ở trên; mascot phản ứng theo kết quả
      ↓ (hết lượt)
[REWARD RECEIPT]
   • RewardBurst amber, vật phẩm làng (Batch D), XP, streak +1
   • Node trên map "mọc" thêm 1 công trình → quay lại map thấy thế giới lớn lên
```

Không thêm tính năng mới: 3 dạng bài trên đều đã tồn tại trong `components/vocabulary/exercises`. Chỉ tổ chức & trình bày lại.

### 4.2 Đặc tả từng màn (rút gọn — chi tiết số liệu nằm ở tokens)

**M1 — World Map** (`(learn)/dashboard` → đổi thành trục world, dùng `learning-world/LearningWorldCanvas`)
- Nền: 1 location plate isometric tĩnh (asset Codex), KHÔNG animate.
- Lớp UI nổi: TopBar (avatar, streak pill, gem), các `WorldNode` đặt theo tọa độ hotspot (`HotspotList`).
- BottomNav 3 mục: Thế giới / Ôn tập / Hồ sơ.
- Tap node → chuyển M2. Reduced-motion & DPR đã có hook sẵn (`useReducedMotion`, `useDevicePixelRatio`).

**M2 — Lesson Intro** (`ScenePanel`)
- Bố cục: cảnh khu (½ trên) + panel thông tin (½ dưới) + PrimaryCta "Bắt đầu".
- Mascot pose "giới thiệu" (Batch C).

**M3 — Gameplay** (`vocabulary/exercises` + `OptionTile`, `AudioButton`)
- 1 từ/màn, tối đa 4 `OptionTile`. Tap = micro-interaction tactile (120ms, ease elastic).
- Đúng: viền `--fuxie-success`, tiến độ +1. Sai: rung nhẹ, hiện đáp án, không trừ điểm gắt.
- Mascot góc dưới phản ứng (đúng/sai/cổ vũ).

**M4 — Reward Receipt** (`RewardBurst`, subtree `data-reward-state="earned"`)
- Amber chỉ trong subtree này (giữ containment). XP + streak + vật phẩm làng.
- CTA "Về làng" → M1 với node đã nâng cấp.

**M5 — Map sau reward** (M1 ở state mới)
- Node vừa học thêm công trình/độ sáng → cảm giác thế giới lớn lên. Đây là "khoảnh khắc wow" giữ chân.

---

## 5. Pipeline 3 bên & quy trình mockup-driven

```
Claude  ──(style guide + prompt + spec tokens)──►  Codex
  │                                                   │
  │                                          ① STYLE FRAME (1 màn: World Map)
  │  ◄──────────────── duyệt ◄─────────────────────────┘
  │   (chủ dự án OK phong cách?)  ── chưa ──► Codex render lại
  │                                                   │
  │                                          ② Render nốt M2–M5 mockup + asset
  │                                                   │
  └──(ticket + mockup đã duyệt + tokens)──►  Antigravity
                                                      │
                                          ③ Code bám mockup, dùng primitives packages/ui
                                                      │
  ◄──────────── Claude nghiệm thu (mục 7) ────────────┘
```

Nguyên tắc vàng: **không màn nào được code trước khi style frame của nó được duyệt.** Mockup là đích thẩm mỹ; số đo lấy từ tokens.

---

## 5b. Bộ skill dùng ở mỗi bước

Quy trình này được vận hành bằng các skill đã chọn (deep research: `fuxie-skill-stack-recommendation.md`). Skill **`fuxie-redesign`** là skill điều phối chính — gọi nó khi bắt đầu bất kỳ slice/màn/asset nào để cả 3 bên đi đúng chuẩn.

| Bước | Skill dùng | Vai trò trong bước | Chạy ở đâu |
| --- | --- | --- | --- |
| 0. Khởi động slice | **`fuxie-redesign`** | Nạp tầm nhìn + ranh giới lõi + phân vai; trigger cho mọi việc chạm UI/asset Fuxie | Cowork (đã cài) |
| 1. Căn chỉnh nhu cầu | **`grill-me`** | Quay người dùng tới khi chốt scope/màn/thước đo, mỗi câu một đáp án đề xuất | Cowork (đã cài) |
| 2. Spec slice | **`to-prd`** + plugin **`design`** (`design-system`, `ux-copy`) | Biến hội thoại thành PRD; chuẩn hóa tokens/typography + microcopy tiếng Đức | Cowork |
| 3a. Style frame (ảnh) | **`gpt-image`** (qua **`fuxie-redesign` → style-lock**) | Render 1 style frame có STYLE LOCK để duyệt phong cách | Codex |
| 3b. Nhân rộng asset/mockup | **`gpt-image`** với `-i style-frame` | Ép asset sau kế thừa ánh sáng/màu/nét của frame đã duyệt | Codex |
| 4. Ra ticket | **`to-issues`** (+ template trong `fuxie-redesign`) | Cắt spec thành ticket vertical-slice grab-được, kèm ranh giới lõi | Cowork |
| 4b. Bàn giao đa-agent | **`handoff`** | Gói ngữ cảnh + "suggested skills" để Antigravity/Codex tiếp nhận sạch | Cowork |
| 5. Code | (Antigravity) + Vercel **`web-interface-guidelines`**, Anthropic **`frontend-design`** | Audit a11y/touch-target ≥44px/reduced-motion; ép cam kết 1 art-direction, chống AI-slop | Antigravity |
| 6. Nghiệm thu | plugin **`design`** (`design-critique`, `accessibility-review`) + checklist A+B (mục 8) | Chấm chất lượng & a11y trước khi nhân rộng | Cowork |
| (Hậu kỳ ảnh) | **`adobe-for-creativity`** (`resize`, `social-variations`) | Resize/export asset đã render cho nhiều surface/tỉ lệ | Cowork (đã cài) |

> Đã cài sẵn: `fuxie-redesign`, `grill-me`, `to-prd`, `to-issues`, `handoff`, plugin `design`, `skill-creator`, `adobe-for-creativity`. Cài thêm bằng lệnh: `frontend-design` (Antigravity), Vercel `web-interface-guidelines` (Antigravity), `gpt-image` (Codex) — chi tiết: `docs/design/gpt-image2-skill-reference.md`.

---

## 6. Prompt sẵn cho Codex (gpt-image-2.0)

### 6.1 Style-lock prefix — DÁN VÀO MỌI PROMPT

```
STYLE LOCK (mandatory, identical across all images):
- 2.5D dimetric isometric, true 2:1 angle (~26.57°), single light source top-left, soft shadow lower-right.
- Flat color blocks + ONE soft shadow layer + subtle inner stroke. NO photorealism, NO complex gradients, NO texture photos.
- Palette ONLY these hex: bg #F3FBFF, sky-blue #54A8E4 & #60A8E4, deep blue #3C78A8, deep ink #173B56, teal #2EC4B6, white #FFFFFF, accent #FF8A3D (≤5% area), reward amber #FFB703 (reward objects only).
- Warm, premium-minimal, cozy German village. Generous negative space. Rounded, tactile shapes.
- Mascot "Fuxie": a friendly fox-like coach, SAME proportions every time — BRIGHT SKY-BLUE fur (#60A8E4, shading #3C78A8), WHITE face/chest/belly/inner-ears/tail-tip, TEAL hoodie (#2EC4B6), warm eyes, soft rounded ears. Flat 2.5D matching the world. Fuxie is NOT an orange or brown fox.
NEGATIVE: no text/letters in image, no UI chrome, no drop-shadow harshness, no neon, no clutter, no realistic lighting, no multiple light sources, NO orange or brown fox, no realistic fur.
```

### 6.2 ① Style frame — World Map (render trước, duyệt trước)

```
[STYLE LOCK]
Scene: isometric German learning village seen as a game world map, mobile portrait 3:4.
A cobblestone path winds between 5 small location buildings: a market stall (Markt), a half-timbered study house, a post office, a small library, a fountain plaza. Empty rounded "node" spots sit on the path for clickable points (leave them clean, no icons). Sky-cream background, soft shadows, cozy. Mascot fox Fuxie stands near the market, waving.
Output: 1024x1365, flat 2.5D, palette-locked.
```

### 6.3 ② Sau khi duyệt — render nốt slice

- **M2 plate (Markt close-up):** `[STYLE LOCK] Close iso view of the market stall with fruit/bread crates, a chalkboard sign (blank, no text), Fuxie presenting with one paw raised. 1024x1365.`
- **M3 background (neutral study panel):** `[STYLE LOCK] Minimal iso study nook, soft empty backdrop for a vocabulary card to sit on, lots of negative space, Fuxie small in lower-right cheering pose. 1024x1365.`
- **M4 reward objects (Batch D continuity):** `[STYLE LOCK] A small set of 4 village reward objects on transparent bg: a bronze market medal, a bread loaf trophy, a lantern, a flag pennant. Reward amber #FFB703 allowed. 1024x1024, isolated, even spacing.`
- **Mascot pose sheet:** `[STYLE LOCK] Fuxie fox, 4 poses on transparent bg, identical proportions: idle-wave, correct-cheer, wrong-oops, level-up-jump. 1024x1024.`
- **OptionTile icon set (nếu cần ảnh từ vựng):** mỗi từ 1 ảnh `[STYLE LOCK] single object "<từ>" centered, flat 2.5D, transparent bg, 512x512`.

### 6.4 Mockup màn (vật đối chiếu khi code — look & feel, KHÔNG dùng làm spec số)

```
[STYLE LOCK] A full mobile screen MOCKUP (portrait 1080x2340) of the vocabulary gameplay screen:
top progress bar, a large word-image card centered, four answer tiles in a 2x2 grid below, Fuxie in lower corner. Use placeholder shapes for text (no real letters). Show the visual hierarchy, spacing rhythm, color usage we should match.
```

> Lưu ý ép buộc: **chữ trong mockup luôn là placeholder** — Antigravity lấy chữ thật + số đo từ tokens, chỉ bám bố cục/màu/tinh thần từ ảnh.

---

## 7. Ticket sẵn cho Antigravity

> Tuân thủ AGENTS.md role-gate. **Không đụng** `packages/database`, `packages/srs-engine`, `apps/ai-service`, `content/`.

**TICKET-A1 — Tokens & primitives**
- Thêm tokens mục 3.2 vào `apps/web/src/app/globals.css` (`:root`, trên `@theme`) và export semantic từ `packages/ui/src/tokens`.
- Dựng primitives mục 3.3 trong `packages/ui/src/components` (mới). Storybook/fixture mỗi primitive.
- Pass `pnpm check:quick` (gồm reward-amber containment, locale parity, visual-audit).

**TICKET-A2 — M1 World Map (mobile-first)**
- Biến `(learn)/dashboard` thành world-first dùng `learning-world/LearningWorldCanvas` + plate tĩnh (asset Codex) + `WorldNode` theo `HotspotList`.
- TopBar + BottomNav mobile. Tôn trọng `useReducedMotion`, DPR. Plate KHÔNG animate.
- Đối chiếu style frame 6.2.

**TICKET-A3 — M2 Lesson Intro + M3 Gameplay**
- M2: `ScenePanel` + PrimaryCta. M3: tái dùng `vocabulary/exercises`, bọc bằng `OptionTile`/`AudioButton`, micro-interaction tactile (tokens motion).
- Phản hồi đúng/sai theo mục 4.2. Mascot pose từ sheet 6.3.

**TICKET-A4 — M4 Reward + M5 Map upgrade**
- `RewardBurst` trong subtree `data-reward-state="earned"`. Node map nâng cấp sau khi học xong.
- Đối chiếu mockup 6.4.

**TICKET-A5 — QA slice**
- Chụp before/after mobile + desktop, chạy `pnpm check:quick`, đối chiếu acceptance mục 7 (file gốc: mục 8 dưới).

---

## 8. Tiêu chí nghiệm thu (A + B)

**B — Sánh chuẩn (khách quan), pass hết mới qua:**
- [ ] Đặt cạnh ảnh Mykonos voxel: cùng đẳng "world thống nhất 1 góc, 1 nguồn sáng, 1 bảng màu".
- [ ] Đặt cạnh Duolingo: vòng hành động→phản hồi→reward rõ ràng, micro-interaction có ở mọi tap.
- [ ] Tinh thần Monument Valley: tối giản, nhiều khoảng thở, không nhồi chi tiết.
- [ ] 100% asset slice qua đúng STYLE LOCK (không tấm nào lạc góc/sáng/màu).
- [ ] Mobile: mọi touch target ≥ 44px; không có layout "desktop nén".
- [ ] Token contract còn nguyên: reward-amber containment + energy ≤5% + Primary_CTA discipline pass property test.

**A — Trực giác chủ dự án:**
- [ ] Mở app trên điện thoại, lướt M1→M5 một mạch, có cảm giác "đây là một game học thật, khoe được".
- [ ] Khoảnh khắc M5 (thế giới lớn lên sau khi học) tạo được "wow".

> Slice CHỈ được nhân rộng ra các kỹ năng/màn khác sau khi cả hai nhóm tick đầy đủ.

---

## 9. Thứ tự thực thi & bước kế tiếp

0. **(Claude)** Gọi skill **`fuxie-redesign`** để mở slice (nạp chuẩn + phân vai). Nếu scope chưa rõ → **`grill-me`**.
1. **(Claude)** Spec slice bằng **`to-prd`** + plugin **`design`**, rồi hoàn thiện style guide + giao prompt 6.2 cho Codex. ⟵ *next step ngay*
2. **(Codex)** **`gpt-image`** render style frame World Map → chủ dự án duyệt phong cách.
3. **(Codex)** **`gpt-image -i style-frame`** render nốt asset + mockup M2–M5.
4. **(Claude→Antigravity)** **`to-issues`** + **`handoff`** phát TICKET-A1 (tokens/primitives), song song với bước 2–3.
5. **(Antigravity)** A2→A4 bám mockup đã duyệt; audit bằng Vercel **`web-interface-guidelines`** + **`frontend-design`**.
6. **(Claude)** Nghiệm thu mục 8 bằng **`design`** (`design-critique`, `accessibility-review`) → quyết định nhân rộng.

**Next concrete step (theo AGENTS.md):** chốt prompt style-frame 6.2 và phát cho Codex; đồng thời phát TICKET-A1 cho Antigravity để dựng tokens/primitives không phụ thuộc asset.
