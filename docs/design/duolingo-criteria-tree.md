# Cây tiêu chí Duolingo — bản đối chiếu chi tiết (Fuxie parity)

Date: 2026-07-01 · Nguồn: `duolingo-deep-dive.md`. Đây là **nguồn đối chiếu chuẩn**; rubric phẳng (`duolingo-parity-rubric.md`, dims A–L) là bản tóm tắt của cây này.

Ký hiệu mỗi lá: **[MUST]/[NICE]** · **{UI}** = redesign làm được / **{PROD}** = cần product/backend (ngoài phạm vi redesign UI, chỉ đánh dấu gap) · *Đo* = cách kiểm.
Trạng thái điền: ✅ đạt · ⚠️ một phần · ❌ chưa · — chưa đo.

---

## 1. Hệ thị giác (Visual system)
### 1.1 Typography
- [ ] 1.1.1 Font display rounded-đậm (Duo: Feather Bold) — Fuxie: **Nunito 800–900**. *Đo:* computed font-weight tiêu đề. [MUST]{UI}
- [ ] 1.1.2 Font UI/body rounded (Duo: DIN Next Rounded) — Fuxie: **Nunito 400–600**. [MUST]{UI}
- [ ] 1.1.3 Letter-spacing thoáng (Duo ~0.05em headline). *Đo:* CSS letter-spacing. [NICE]{UI}
- [ ] 1.1.4 Từ/câu hỏi trọng tâm **≥22px**. *Đo:* px. [MUST]{UI}
- [ ] 1.1.5 Nhãn nút **≥15px, ≥600**. [MUST]{UI}
- [ ] 1.1.6 Thang chữ từ token (display/h1/h2/body/caption), không cỡ tuỳ tiện. [MUST]{UI}
- [ ] 1.1.7 line-height body ~1.4–1.6, dễ đọc. [NICE]{UI}

### 1.2 Màu
- [ ] 1.2.1 **Một primary bão hoà cho MỌI CTA** (Duo Green → Fuxie `--fuxie-action #54A8E4`). *Đo:* mọi primary-cta cùng nền. [MUST]{UI}
- [ ] 1.2.2 Semantic rõ: success xanh lá, danger đỏ, reward amber. [MUST]{UI}
- [ ] 1.2.3 Kỷ luật bảng màu (≤ ~6 màu chủ). [MUST]{UI}
- [ ] 1.2.4 Reward-amber containment (chỉ subtree reward). [MUST]{UI}
- [ ] 1.2.5 Energy/accent ≤5% diện tích. [MUST]{UI}

### 1.3 Nút & control (chữ ký "tactile")
- [ ] 1.3.1 Nút có **gờ dưới đặc ≥3–4px** màu đậm hơn (Duo: box-shadow 0 4px 0). *Đo:* px gờ. [MUST]{UI}
- [ ] 1.3.2 Cao **≥48px** (khuyến 56–60px). *Đo:* px. [MUST]{UI}
- [ ] 1.3.3 Bấm **lún** (translateY + gờ co) ~≤120ms. *Đo:* xem transition/quay clip. [MUST]{UI}
- [ ] 1.3.4 Bo góc từ token, đồng nhất. [MUST]{UI}
- [ ] 1.3.5 Disabled state rõ (Check mờ khi chưa chọn). [MUST]{UI}
- [ ] 1.3.6 Vùng chạm ≥44px (khuyến ≥48px). [MUST]{UI}

### 1.4 Surface & card
- [ ] 1.4.1 Vùng làm bài **nền sạch** (không art rối sau chữ). [MUST]{UI}
- [ ] 1.4.2 Card nội dung nền đặc, tương phản cao, bóng/viền rõ. [MUST]{UI}
- [ ] 1.4.3 Một hệ surface thống nhất (token elevation/radius). [MUST]{UI}

### 1.5 Iconography
- [ ] 1.5.1 Icon cùng vật liệu (currency/gem/xp/streak cùng bộ 2.5D). [MUST]{UI}
- [ ] 1.5.2 Kích thước icon nhất quán (~20–24px header). [NICE]{UI}

### 1.6 Spacing & layout
- [ ] 1.6.1 Grid 4pt; nhịp khối ≥16px. [MUST]{UI}
- [ ] 1.6.2 Mobile-first, không "desktop nén". [MUST]{UI}
- [ ] 1.6.3 Safe-area inset (tai thỏ/gesture bar). [MUST]{UI}

## 2. Tương tác & phản hồi
- [ ] 2.1.1 Luồng **chọn/nhập → Kiểm tra → phản hồi → Tiếp tục** (không auto-advance hụt hẫng). [MUST]{UI}
- [ ] 2.2.1 4 trạng thái đáp án phân biệt bằng **màu khối**: default/selected/correct/wrong. [MUST]{UI}
- [ ] 2.3.1 **Feedback footer** đúng=xanh / sai=đỏ, chiếm phần dưới màn. [MUST]{UI}
- [ ] 2.3.2 Sai **hiện đáp án đúng**; không phạt gắt. [MUST]{UI}
- [ ] 2.3.3 CTA **"Tiếp tục"** to, tactile. [MUST]{UI}
- [ ] 2.3.4 Âm thanh đúng/sai. [NICE]{UI}
- [ ] 2.3.5 Haptic (rung nhẹ) khi sai — honor reduced-motion. [NICE]{UI}
- [ ] 2.4.1 Micro-interaction ở **mọi** phần tử bấm. [MUST]{UI}

## 3. Motion & mascot
- [ ] 3.1.1 Mascot **≥5 trạng thái cảm xúc** (idle/đúng/sai/level-up/nhắc). [MUST]{UI}
- [ ] 3.1.2 Mascot phản ứng theo kết quả ngay trên màn bài. [MUST]{UI}
- [ ] 3.2.1 Chuyển pose mượt (bounce/tween). [NICE]{UI}
- [ ] 3.3.1 Khoảnh khắc **ăn mừng** ở reward/level-up. [MUST]{UI}
- [ ] 3.4.1 **Honor `prefers-reduced-motion` theo OS, mặc định** (vượt Duo). [MUST]{UI}
- [ ] 3.5.1 Token timing/easing (tap 120ms, reward 480ms, ease-tactile). [MUST]{UI}

## 4. Gamification (tầng hệ thống)
- [ ] 4.1.1 **XP** mọi hoạt động, hiển thị header nhất quán. [MUST]{UI+PROD}
- [ ] 4.2.1 **Streak** + 4.2.2 **Streak Freeze** + 4.2.3 tín hiệu loss-aversion (mascot buồn/nhắc). [MUST]{PROD}
- [ ] 4.3.1 **Daily goal** tuỳ chỉnh + tiến độ ngày. [MUST]{PROD}
- [ ] 4.4.1 **League/leaderboard** tuần (thăng/giáng). [MUST]{PROD}
- [ ] 4.5.1 **Hearts/mistakes** (sai tốn, refill). [MUST]{PROD}
- [ ] 4.6.1 **Gems** + 4.6.2 **shop** có đánh đổi thật. [MUST]{PROD}
- [ ] 4.7.1 **Daily quests**. [MUST]{PROD}
- [ ] 4.8.1 **Badges** (personal records + awards). [MUST]{PROD}
- [ ] 4.9.1 **Friend streak/challenge** (xã hội). [NICE]{PROD}
- [ ] 4.10.1 Phân tầng theo chặng (day-1 / ~day-7 / dài hạn). [MUST]{PROD}

## 5. Cấu trúc & điều hướng
- [ ] 5.1.1 **World/path map** world-first (không list card). [MUST]{UI}
- [ ] 5.2.1 Bottom nav tab rõ, active state. [MUST]{UI}
- [ ] 5.3.1 Cấu trúc phiên: node → chuỗi bài ngắn → tổng kết. [MUST]{UI}
- [ ] 5.4.1 **Lesson immersive** (ẩn chrome khi làm bài). [MUST]{UI}

## 6. Onboarding & first-run
- [ ] 6.1.1 **Play-first, profile-second** (học bài đầu + XP trước khi buộc đăng ký). [MUST]{UI+PROD}
- [ ] 6.2.1 Onboarding **phân tán** (tooltip/modal ngữ cảnh, empty-state). [MUST]{UI}
- [ ] 6.3.1 Phân loại trình độ đầu vào (placement/segmentation). [NICE]{PROD}

## 7. Nội dung & sư phạm (adjacency — {PROD}, chỉ đánh dấu, KHÔNG thuộc redesign)
- [ ] 7.1.1 Đa dạng dạng bài (mc/nghe/ghép/điền/nói…). [MUST]{PROD}
- [ ] 7.2.1 Spaced repetition/SRS. [MUST]{PROD}
- [ ] 7.3.1 Adaptive difficulty. [NICE]{PROD}

## 8. Accessibility (WCAG AA+)
- [ ] 8.1.1 Touch ≥44px (khuyến ≥48px). [MUST]{UI}
- [ ] 8.2.1 Contrast chữ ≥4.5:1; phi văn bản ≥3:1. *Đo:* accessibility-review/devtools. [MUST]{UI}
- [ ] 8.3.1 Focus ring rõ + keyboard reachable. [MUST]{UI}
- [ ] 8.4.1 Label/aria đầy đủ; alt cho ảnh; screen-reader ok. [MUST]{UI}
- [ ] 8.5.1 reduced-motion (xem 3.4.1). [MUST]{UI}
- [ ] 8.6.1 Ngôn ngữ UI nhất quán (tiếng Việt cho chrome; tiếng Đức chỉ ở nội dung học). [MUST]{UI}

## 9. Performance & platform
- [ ] 9.1.1 Asset lớn tĩnh; chỉ state nhỏ animate. [MUST]{UI}
- [ ] 9.2.1 Đủ state-shell: loading/empty/error mỗi surface. [MUST]{UI}
- [ ] 9.3.1 Responsive; desktop mở rộng từ mobile. [MUST]{UI}

---

## Map rubric ↔ cây
A(nút)=1.3 · B(chữ)=1.1 · C(tương phản/nền)=1.2.*,1.4,8.2 · D(state+feedback)=2.* · E(motion)=3.* · F(spacing)=1.6 · G(nhất quán)=1.*,5.2 · H(a11y)=8.* · J(gamification)=4.* · K(onboarding)=6.* · L(mascot)=3.1–3.4.

## Ghi chú phạm vi (quan trọng)
Các nhánh **{PROD}** (phần lớn mục 4 gamification, 6.3, 7) **không nằm trong redesign UI** — chúng cần quyết định sản phẩm + backend. Redesign chỉ đảm bảo **giao diện/khung sẵn sàng** cho chúng (vd hiển thị XP/streak/gem, chỗ cho league/shop). Khi chấm parity toàn nền tảng, {PROD} tính là **gap sản phẩm**, tô riêng, không đổ lỗi cho lớp UI.
