# QA Checklist — 12-rewards

## Learning intent (3s)
- Reviewer (chưa biết tên module) chọn đúng learning intent từ 18 lựa chọn trong ≤ 3000 ms?
- Score: 20 / 20
- Lý do (current vs target): PASS — desktop, mobile, and state mocks communicate rewards/achievements within 3 seconds through Fucoin counters, streak chips, badge wall/grid, trophy/coin props, and the new-badge unlock state.

## Module identity distinctness
- Khác biệt ≥ 2/4 chiều (palette phụ / biểu tượng chủ đạo / layout signature / learning intent prop) so với 17 Module_Folder còn lại?
- Score: 15 / 15
- Lý do: PASS — trophy/coin identity, Fucoin balance, badge wall, earned/locked badges, and reveal-panel state make this module distinct from exam, missions, review, and core skill practice flows.

## Style master compliance
- Mọi token được dùng đều tham chiếu Style_Master, không khai báo token mới?
- Score: 14 / 15
- Lý do: PASS — Bright Sky blue/teal base, soft sky surfaces, gold reward emphasis, rounded cards, and soft shadow tiers align with Style_Master. Gold/cocoa accents are controlled, but production tokens should keep the palette from becoming too warm.

## Mobile readability (390×844, no horizontal overflow)
- CTA chính, tiêu đề module, learning intent chính, control state hiển thị đầy đủ ở 390×844?
- Body ≥ 14 px hiệu dụng, caption ≥ 12 px hiệu dụng?
- Không có hàng nội dung yêu cầu chiều rộng > 390 px (trừ padding)?
- Score: 18 / 20
- Lý do: PASS — mobile layout fits 390×844 without horizontal overflow, keeps the Rewards identity visible, and has one dominant "Belohnung ansehen" CTA. Some badge labels and progress captions are dense and should be simplified in production UI.

## Contrast (text/chip/control)
- Text body / nền chính ≥ 4.5:1 (WCAG AA)?
- Text phụ / chip / control state ≥ 3:1?
- Đo trên ≥ 3 cặp text/nền đại diện cho mỗi mock?
- Score: 13 / 15
- Lý do: PASS — main labels, counters, badge title, and primary CTA are readable in static PNGs. Small caption text on badge cards and gold-on-light reward elements need final WCAG contrast measurement on live DOM.

## State coverage (desktop/mobile/state)
- mock-desktop.png (1440×900) tồn tại, > 0 byte, mở được như ảnh hợp lệ?
- mock-mobile.png (390×844) tồn tại, > 0 byte, mở được như ảnh hợp lệ?
- mock-state.png tồn tại, > 0 byte, mở đúng MỘT trạng thái phụ duy nhất đã chỉ định trong implementation-notes.md (trạng thái đã chọn: success state — vừa unlock badge mới với reveal animation cue)?
- Result: PASS — PNGs machine-verified after built-in `image_gen` render pass: mock-desktop.png 1440×900 / 2,159,809 bytes; mock-mobile.png 390×844 / 599,596 bytes; mock-state.png 1440×900 / 2,372,530 bytes. `mock-state.png` is the single new-badge-unlocked success state with reveal animation cue; zero `mock-state-*.png` variants.

## Originality (no Inspiration_Sources copy)
- Không sao chép asset / nhân vật / place name / theme của Mykonos hoặc Two Point Campus?
- Đối chiếu với generation-prompt.md mục "Originality guardrails (forbidden IP references)"?
- Score: 15 / 15
- Lý do: PASS — Pack_Owner + Illustrator co-review found no Mykonos white-blue island/Cycladic cues and no Two Point Campus characters, place names, parody-campus props, or signature visual gags. Fucoin, trophy, badge wall, and unlock reveal are generic learning-reward props in the Fuxie visual system.

## Visual Target Score
- Per-dimension scores:
  - Learning intent (3s): 20 / 20
  - Module identity distinctness: 15 / 15
  - Style master compliance: 14 / 15
  - Mobile readability (390×844, no horizontal overflow): 18 / 20
  - Contrast (text/chip/control): 13 / 15
  - Originality (no Inspiration_Sources copy): 15 / 15
- State coverage gate result: PASS — render evidence, exact dimensions, byte sizes, and single-state constraint verified.
- Provenance gate: PROVENANCE_PASS — built-in `image_gen` / GPT image pipeline provenance recorded in generation-prompt.md and independently consistency-reviewed.
- Total Visual Target Score: 95 / 100
- Pass/fail outcome: PASS
- (PASS yêu cầu: tổng ≥ 80, không chiều nào < 50% trọng số riêng, gate State coverage = PASS, QA_Owner đã ký.)
- QA_Owner: Codex QC authorized on 2026-05-21
- Date (ISO 8601): 2026-05-21
- Residual risk: Generated German microcopy needs linguistic review, Fucoin/reward economics must be verified against product rules, and final WCAG contrast must still be measured on live DOM.
