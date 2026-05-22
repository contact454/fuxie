# Implementation Notes — 00-style-master

## Module learning intent
Style master design system tokens cho toàn pack — nguồn ngôn ngữ visual gốc của Fuxie và canonical source cho 17 Module_Folder downstream.

## Layout grid (desktop)
- Viewport reference 1440×900 px.
- Style_Master mock thể hiện 10 yếu tố visual bắt buộc (Requirement 2 AC 1) trên một bảng tham chiếu: bảng màu chính + phụ, typography ladder, spacing ladder, radius ladder, shadow ladder, icon family, mascot tone, illustration sample, isometric staging convention.
- Grid columns 12; gutter 24 px; content max-width 1280 px.

## Layout grid (mobile 390×844)
- Viewport 390×844 px.
- Mobile mock thể hiện cùng 10 yếu tố ở dạng compact ladder (vertical stack), header ≤ 64 px, body ≥ 14 px, caption ≥ 12 px.

## Tokens used (color/typography/spacing/radius/shadow từ Style_Master)
- Style_Master IS Style_Master — đây là canonical token registry (mục Token registry bên dưới). Mọi giá trị được khai báo lần đầu tại đây.

## Token registry
Style_Master Token Registry — canonical source cho 17 Module_Folder downstream (Requirement 7 AC 3).

### Primary palette (≥ 5 tokens)

| Token | Value | Downstream modules |
| --- | --- | --- |
| `color.brand.skyBlue` | `#60A8E4` | All 17 modules — primary brand surface |
| `color.brand.deepBlue` | `#3C78A8` | All 17 modules — primary brand contrast / heading |
| `color.brand.teal` | `#2EC4B6` | All 17 modules — accent / success cue |
| `color.brand.softSky` | `#F3FBFF` | All 17 modules — surface base / canvas |
| `color.brand.amber` | `#FFB703` | 12-rewards (primary), 13-missions (cue) — reward emphasis ONLY |

### Secondary palette (≥ 3 tokens)

| Token | Value | Downstream modules |
| --- | --- | --- |
| `color.state.success` | TBD (mint family, contrast ≥ 3:1 trên softSky) | 03-session, 05-vocabulary, 09-reading, 12-rewards, 15-profile |
| `color.state.warning` | TBD (warm sand / amber muted) | 04-review, 13-missions |
| `color.state.danger` | TBD (rose / crimson family) | 06-grammar, 08-speaking, 10-writing, 11-exam, 16-teacher |
| `color.module.indigo` | TBD | 02-course |
| `color.module.coral` | TBD | 05-vocabulary |
| `color.module.violet` | TBD | 06-grammar |
| `color.module.deepNavy` | TBD | 07-listening |
| `color.module.rose` | TBD | 08-speaking |
| `color.module.sage` | TBD | 09-reading |
| `color.module.plum` | TBD | 10-writing |
| `color.module.crimson` | TBD | 11-exam |
| `color.module.gold` | TBD | 12-rewards |
| `color.module.emerald` | TBD | 13-missions |
| `color.module.periwinkle` | TBD | 14-chat |
| `color.module.mauve` | TBD | 15-profile |
| `color.module.slate` | TBD | 16-teacher |
| `color.module.charcoal` | TBD | 17-admin |
| `color.module.cyanAccent` | TBD | 17-admin |

### Typography tiers (≥ 5 tokens)

| Token | Value | Downstream modules |
| --- | --- | --- |
| `type.heading` | TBD (32 px / 40 lh / 700) | All 17 — module title |
| `type.subheading` | TBD (24 px / 32 lh / 600) | All 17 — block title |
| `type.body` | TBD (16 px / 24 lh / 400) — mobile hiệu dụng ≥ 14 px | All 17 — body copy |
| `type.caption` | TBD (12 px / 16 lh / 400) — mobile hiệu dụng ≥ 12 px | All 17 — chú thích |
| `type.label` | TBD (14 px / 20 lh / 600) | All 17 — button/chip/label |

### Spacing tiers (≥ 5 tokens)

| Token | Value | Downstream modules |
| --- | --- | --- |
| `space.4` | 4 px | All 17 — inline gap |
| `space.8` | 8 px | All 17 — tight stack |
| `space.12` | 12 px | All 17 — list gap |
| `space.16` | 16 px | All 17 — card padding base |
| `space.24` | 24 px | All 17 — section gap |
| `space.32` | 32 px | All 17 — major section gap |

### Radius tiers (≥ 3 tokens)

| Token | Value | Downstream modules |
| --- | --- | --- |
| `radius.sm` | 6 px | All 17 — chip / icon-button |
| `radius.md` | 12 px | All 17 — card |
| `radius.lg` | 20 px | All 17 — hero / CTA |

### Shadow tiers (≥ 2 tokens)

| Token | Value | Downstream modules |
| --- | --- | --- |
| `shadow.resting` | TBD (subtle, 2 layer, soft sky tint) | All 17 — card resting |
| `shadow.raised` | TBD (stronger, 2 layer, raised on hover/dialog) | All 17 — dialog / hover |

### Icon family (≥ 6 tokens)

| Token | Value | Downstream modules |
| --- | --- | --- |
| `icon.book` | friendly geometric line/fill | 09-reading (primary), 06-grammar |
| `icon.ear` | friendly geometric line/fill | 07-listening (primary) |
| `icon.mic` | friendly geometric line/fill | 08-speaking (primary) |
| `icon.pen` | friendly geometric line/fill | 10-writing (primary) |
| `icon.calendar` | friendly geometric line/fill | 13-missions (primary), 01-dashboard |
| `icon.target` | friendly geometric line/fill | 15-profile (primary), 13-missions |
| `icon.progressRing` | friendly geometric | 01-dashboard (primary) |
| `icon.cefrBadge` | friendly geometric | 02-course (primary) |
| `icon.flipCard` | friendly geometric | 04-review (primary) |
| `icon.flashcard` | friendly geometric | 05-vocabulary (primary) |
| `icon.timer` | friendly geometric | 11-exam (primary) |
| `icon.trophy` | friendly geometric | 12-rewards (primary) |
| `icon.flag` | friendly geometric | 13-missions (primary) |
| `icon.speechBubble` | friendly geometric | 14-chat (primary) |
| `icon.avatar` | friendly geometric | 15-profile (primary) |
| `icon.clipboard` | friendly geometric | 16-teacher (primary) |
| `icon.gear` | friendly geometric | 17-admin (primary) |

### Mascot tone

| Token | Value | Downstream modules |
| --- | --- | --- |
| `mascot.fuxie.sky` | Friendly, learner-supportive, sky-blue + teal palette khớp brand Fuxie. Không bắt chước nhân vật của Inspiration_Sources. | All 17 — mascot reference |

### Illustration style

| Token | Value | Downstream modules |
| --- | --- | --- |
| `illu.style.flatSoftDepth` | Flat-with-soft-depth, friendly, không photorealistic, không pixel-art, không Greek-island, không campus parody. ≥ 2 sample trong Style_Master. | All 17 — illustration reference |

### Isometric / world staging convention

| Token | Value | Downstream modules |
| --- | --- | --- |
| `stage.isometric` | Tile grid landmark đại diện, depth ordering nhất quán, camera framing cố định. Cảm hứng kỹ thuật trừu tượng — không dùng tỉ lệ / palette / silhouette của Mykonos. | All 17 (where applicable) |

## Responsive rules (breakpoint, reflow, ẩn/hiện)
- Breakpoints: ≤ 480 (mobile small), 481–768 (mobile/tablet), 769–1024 (tablet/desktop), ≥ 1025 (desktop).
- Reflow: side rails collapse → sheet hoặc tab trên ≤ 768 px.
- Body ≥ 14 px hiệu dụng và caption ≥ 12 px hiệu dụng trên 390×844.

## State chosen for mock-state.png + lý do
- Style_Master mock-state.png thể hiện token registry ở trạng thái "interaction primary" (CTA hover/focus + chip selected + state success/warning/danger swatches) để 17 module downstream đối chiếu state visual.
- Sub-flow phụ khác: deferred sang V2.

## Motion/interaction notes (nếu có)
- Token motion (durations + easings) sẽ được Motion Designer khai báo riêng; Style_Master chỉ note design intent (200 ms standard, 120 ms micro).

## Accessibility notes (focus order, ARIA cần lưu ý, contrast cụ thể)
- Mọi token text/nền chính phải đạt ≥ 4.5:1; text phụ / chip / control ≥ 3:1.
- Focus ring spec: 2 px outer, `color.brand.deepBlue`, offset 2 px.
- Mascot illustration phải có alt text mô tả ngắn cho screen reader.

## Originality notes (xác nhận không trùng Inspiration_Sources)
- Style_Master KHÔNG sao chép Mykonos (Greek-island visuals, Aegean palette, Cycladic architecture, white-blue domed buildings, Mediterranean village motifs) và KHÔNG sao chép Two Point Campus (characters, place names, themed props).
- Cảm hứng kỹ thuật (isometric staging) giữ ở mức trừu tượng.
- Pack_Owner + Illustrator / 3D Mascot Artist ký xác nhận sau render: PENDING.
- Tham chiếu chính thức sang [generation-prompt.md](./generation-prompt.md) làm canonical provenance.
