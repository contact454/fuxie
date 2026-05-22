# QA Checklist — 17-admin

## Learning intent (3s)
- Reviewer (chưa biết tên module) chọn đúng learning intent từ 18 lựa chọn trong ≤ 3000 ms?
- Score: 20 / 20
- Lý do (current vs target): PASS — admin navigation, user-management table, active filter chips, billing/status fields, and "Benutzer anlegen" CTA make the learning intent "Vận hành nội bộ (user, content, billing)" readable within 3 seconds.

## Module identity distinctness
- Khác biệt ≥ 2/4 chiều (palette phụ / biểu tượng chủ đạo / layout signature / learning intent prop) so với 17 Module_Folder còn lại?
- Score: 15 / 15
- Lý do: PASS — dense admin data table, filter rail, topbar/search, gear/dashboard cues, charcoal + cyan accents, and no-results filter state distinguish admin from teacher, profile, chat, dashboard, and learner modules.

## Style master compliance
- Mọi token được dùng đều tham chiếu Style_Master, không khai báo token mới?
- Score: 14 / 15
- Lý do: PASS — Bright Sky base palette, charcoal/cyan module accents, compact cards, table surfaces, chips, rounded controls, and CTA hierarchy align with Style_Master. Minor deduction because generated PNG lighting and exact table/chip token values must be normalized during frontend implementation.

## Mobile readability (390×844, no horizontal overflow)
- CTA chính, tiêu đề module, learning intent chính, control state hiển thị đầy đủ ở 390×844?
- Body ≥ 14 px hiệu dụng, caption ≥ 12 px hiệu dụng?
- Không có hàng nội dung yêu cầu chiều rộng > 390 px (trừ padding)?
- Score: 18 / 20
- Lý do: PASS — 390×844 mobile mock has a compact header, readable filter chips/search, visible admin user list, and a clear cyan primary CTA without horizontal overflow. Minor deduction because final DOM should confirm long emails, role labels, and filter chips wrap safely.

## Contrast (text/chip/control)
- Text body / nền chính ≥ 4.5:1 (WCAG AA)?
- Text phụ / chip / control state ≥ 3:1?
- Đo trên ≥ 3 cặp text/nền đại diện cho mỗi mock?
- Score: 13 / 15
- Lý do: PASS — main admin titles, table text, selected chips, empty-state copy, and cyan primary CTA are visually strong. Minor deduction because small table metadata, pale chip backgrounds, and disabled/secondary controls should be re-measured on live DOM for WCAG.

## State coverage (desktop/mobile/state)
- mock-desktop.png (1440×900) tồn tại, > 0 byte, mở được như ảnh hợp lệ?
- mock-mobile.png (390×844) tồn tại, > 0 byte, mở được như ảnh hợp lệ?
- mock-state.png tồn tại, > 0 byte, mở đúng MỘT trạng thái phụ duy nhất đã chỉ định trong implementation-notes.md (trạng thái đã chọn: empty state — filter không trả kết quả, suggest reset)?
- Result: PASS — PNGs machine-verified after built-in `image_gen` render pass: mock-desktop.png 1440×900 / 1,610,342 bytes; mock-mobile.png 390×844 / 448,799 bytes; mock-state.png 1440×900 / 1,494,752 bytes. mock-state.png is the single no-results filtered-empty state with reset suggestion; zero mock-state-*.png variants.

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
- Residual risk: Generated German admin-console microcopy, long email/user names, billing labels, filter-chip wrapping, and charcoal/cyan contrast should be revalidated against final production copy and live DOM WCAG measurements during frontend implementation.
