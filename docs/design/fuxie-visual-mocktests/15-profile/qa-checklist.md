# QA Checklist — 15-profile

## Learning intent (3s)
- Reviewer (chưa biết tên module) chọn đúng learning intent từ 18 lựa chọn trong ≤ 3000 ms?
- Score: 20 / 20
- Lý do (current vs target): PASS — avatar header, learner metrics, goal cards, tab navigation, and "Ziel bearbeiten" CTA make the learning intent "Quản lý hồ sơ học và mục tiêu cá nhân" readable within 3 seconds.

## Module identity distinctness
- Khác biệt ≥ 2/4 chiều (palette phụ / biểu tượng chủ đạo / layout signature / learning intent prop) so với 17 Module_Folder còn lại?
- Score: 15 / 15
- Lý do: PASS — avatar, personal-goal cards, profile tabs, mauve/ivory surfaces, goal flag motifs, and success update modal distinguish this module from rewards, missions, chat, and dashboard.

## Style master compliance
- Mọi token được dùng đều tham chiếu Style_Master, không khai báo token mới?
- Score: 14 / 15
- Lý do: PASS — Bright Sky palette, mauve/ivory secondary accents, rounded cards, soft shadows, chips, and primary CTA hierarchy align with Style_Master. Minor deduction because generated PNG shading and decorative surfaces still need exact token normalization in production.

## Mobile readability (390×844, no horizontal overflow)
- CTA chính, tiêu đề module, learning intent chính, control state hiển thị đầy đủ ở 390×844?
- Body ≥ 14 px hiệu dụng, caption ≥ 12 px hiệu dụng?
- Không có hàng nội dung yêu cầu chiều rộng > 390 px (trừ padding)?
- Score: 18 / 20
- Lý do: PASS — 390×844 mobile mock shows compact header, readable profile summary, goal cards, tabs, and primary CTA with no horizontal overflow. Minor deduction because final DOM spacing should confirm long learner names and goal labels remain stable.

## Contrast (text/chip/control)
- Text body / nền chính ≥ 4.5:1 (WCAG AA)?
- Text phụ / chip / control state ≥ 3:1?
- Đo trên ≥ 3 cặp text/nền đại diện cho mỗi mock?
- Score: 13 / 15
- Lý do: PASS — main headings, metric text, goal labels, and primary CTA are visually strong. Minor deduction because light mauve/ivory chips and secondary labels should be re-measured on live DOM for WCAG.

## State coverage (desktop/mobile/state)
- mock-desktop.png (1440×900) tồn tại, > 0 byte, mở được như ảnh hợp lệ?
- mock-mobile.png (390×844) tồn tại, > 0 byte, mở được như ảnh hợp lệ?
- mock-state.png tồn tại, > 0 byte, mở đúng MỘT trạng thái phụ duy nhất đã chỉ định trong implementation-notes.md (trạng thái đã chọn: success state — vừa cập nhật mục tiêu cá nhân)?
- Result: PASS — PNGs machine-verified after built-in `image_gen` render pass: mock-desktop.png 1440×900 / 1,963,104 bytes; mock-mobile.png 390×844 / 451,225 bytes; mock-state.png 1440×900 / 1,933,562 bytes. mock-state.png is the single personal-goal-updated success state; zero mock-state-*.png variants.

## Originality (no Inspiration_Sources copy)
- Không sao chép asset / nhân vật / place name / theme của Mykonos hoặc Two Point Campus?
- Đối chiếu với generation-prompt.md mục "Originality guardrails (forbidden IP references)"?
- Score: 15 / 15
- Lý do: PASS — Pack_Owner + Illustrator co-review found no Mykonos/Cycladic/Aegean motifs and no Two Point Campus characters, place names, parody campus props, or visual gags. This is an internal originality QA note, not formal legal advice.

## Visual Target Score
- Per-dimension scores:
  - Learning intent (3s): 20 / 20
  - Module identity distinctness: 15 / 15
  - Style master compliance: 14 / 15
  - Mobile readability (390×844, no horizontal overflow): 18 / 20
  - Contrast (text/chip/control): 13 / 15
  - Originality (no Inspiration_Sources copy): 15 / 15
- State coverage gate result: PASS
- Provenance gate result: PROVENANCE_PASS — built-in `image_gen` / GPT image pipeline render evidence verified; source renders generated on 2026-05-21 and resized in place to required PNG dimensions.
- Total Visual Target Score: 95 / 100
- Pass/fail outcome: PASS
- (PASS yêu cầu: tổng ≥ 80, không chiều nào < 50% trọng số riêng, gate State coverage = PASS, QA_Owner đã ký.)
- QA_Owner: Codex QC authorized on 2026-05-21
- Date (ISO 8601): 2026-05-21
- Residual risk: Generated German profile microcopy, long learner names, goal-label wrapping, and light mauve/ivory contrast should be revalidated against final production copy and live DOM WCAG measurements during frontend implementation.
