# Implementation Notes — 14-chat

## Module learning intent
Hỏi đáp với AI tutor / community.

## Layout grid (desktop)
- Viewport reference 1440×900 px.
- Thread center + composer bottom + side context (desktop wide).
- Vùng nội dung chính ≥ 60% chiều rộng viewport; CTA chính nổi bật nhất theo Requirement 5 AC 1.
- Spacing dùng thang Style_Master (gợi ý 4/8/12/16/24/32; chốt giá trị tại Style_Master implementation-notes Token registry).

## Layout grid (mobile 390×844)
- Viewport 390×844 px.
- Full-bleed thread + composer sticky bottom.
- Header ≤ 64 px (Requirement 5 AC 2). Không tràn ngang. Body ≥ 14 px hiệu dụng, caption ≥ 12 px (Requirement 4 AC 5).

## Tokens used (color/typography/spacing/radius/shadow từ Style_Master)
- Primary palette từ Bright Sky (Style_Master): sky blue `#60A8E4`, deep blue `#3C78A8`, teal `#2EC4B6`, soft sky `#F3FBFF`, amber `#FFB703` (chỉ cho reward emphasis).
- Secondary palette module-specific: periwinkle + neutral grey — tham chiếu vào Style_Master secondary palette tokens (sẽ chốt khi Style_Master Token registry hoàn thiện).
- Typography tiers: heading / subheading / body / caption / label theo Style_Master.
- Spacing tiers: 4 / 8 / 12 / 16 / 24 / 32 theo Style_Master.
- Radius tiers: small (chip/icon-button) / medium (card) / large (hero/CTA) theo Style_Master.
- Shadow tiers: resting / raised theo Style_Master.

## Component reuse (component nào đã có, component nào cần thêm)
- Reuse: AppShell (header + nav), Card, Button (primary/secondary), Chip, IconButton từ Style_Master component library.
- Add (P0): module-specific component cho prop "speech bubble" — định nghĩa biến thể trong Style_Master nếu reusable, hoặc local nếu module-only.

## Responsive rules (breakpoint, reflow, ẩn/hiện)
- Breakpoints theo Style_Master (gợi ý ≤ 480, 481–768, 769–1024, ≥ 1025).
- Reflow: trên ≤ 768 px chuyển sang mobile layout đã mô tả; trên ≥ 1025 px giữ desktop layout.
- Ẩn/hiện: side rail / secondary panel collapse trên mobile thành sheet hoặc tab.

## State chosen for mock-state.png + lý do
- Trạng thái đã chọn: **loading state — tutor đang trả lời (typing indicator)**.
- Lý do: trạng thái này là điểm đau / điểm mạnh đặc trưng nhất của module 14-chat; đại diện được Module_Identity ngay cả khi flow chính không khả dụng (Requirement 5 AC 3).
- Sub-flow phụ khác: deferred sang V2 (Requirement 3 AC 6; Requirement 4 AC 6).

## Motion/interaction notes (nếu có)
- Tương tác chính: trigger CTA chính → micro-feedback (focus ring + state change) trong ≤ 200 ms.
- Animation production thuộc Motion Designer; tại đây chỉ note design intent.

## Accessibility notes (focus order, ARIA cần lưu ý, contrast cụ thể)
- Focus order: header → nav → content (CTA chính có tabindex sớm) → footer/secondary actions.
- ARIA: role landmarks chuẩn (banner, navigation, main, contentinfo); live region cho state change (loading/success/error).
- Contrast: text body ≥ 4.5:1, text phụ / chip / control ≥ 3:1 (Requirement 4 AC 4).

## Originality notes (xác nhận không trùng Inspiration_Sources)
- Module 14-chat KHÔNG sao chép Mykonos (Greek-island visuals, Aegean palette, Cycladic architecture, white-blue domed buildings, Mediterranean village motifs) và KHÔNG sao chép Two Point Campus (characters, place names, themed props, campus parody buildings, mascot caricatures).
- Cảm hứng kỹ thuật (isometric staging) được giữ ở mức trừu tượng; không dùng tỉ lệ tile / palette / silhouette nhân vật của Inspiration_Sources.
- Render evidence present via built-in `image_gen`; Pack_Owner originality co-review + QA_Owner sign-off completed on 2026-05-21.
- Tham chiếu chính thức sang [generation-prompt.md](./generation-prompt.md) của module này làm canonical provenance cho danh sách forbidden IP references và prompt đã dùng (Requirement 9 AC 5).
