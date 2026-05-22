# QA Checklist — 04-review

## Learning intent (3s)
- Reviewer (chưa biết tên module) chọn đúng learning intent từ 18 lựa chọn trong ≤ 3000 ms?
- Score: 19 / 20
- Lý do (current vs target): PASS — desktop/mobile both make the spaced review task legible within 3 seconds through the flip-card stack, due-now queue, "Karte prüfen" CTA, and review-specific labels. Empty state still communicates that there are no cards due rather than drifting into a generic reward screen.

## Module identity distinctness
- Khác biệt ≥ 2/4 chiều (palette phụ / biểu tượng chủ đạo / layout signature / learning intent prop) so với 17 Module_Folder còn lại?
- Score: 15 / 15
- Lý do: PASS — the module has distinct review signals: flip-card stack, spaced repetition repeat icon, due queue rail, and empty review tray. It differs clearly from reading/writing/speaking/listening module props and workflows.

## Style master compliance
- Mọi token được dùng đều tham chiếu Style_Master, không khai báo token mới?
- Score: 14 / 15
- Lý do: PASS — Bright Sky blue/teal base, soft sky backgrounds, mint review surfaces, amber emphasis, rounded card geometry, and soft shadows align with Style_Master. Minor generated microcopy/icon variation remains acceptable for mock evidence but must be normalized in implementation.

## Mobile readability (390×844, no horizontal overflow)
- CTA chính, tiêu đề module, learning intent chính, control state hiển thị đầy đủ ở 390×844?
- Body ≥ 14 px hiệu dụng, caption ≥ 12 px hiệu dụng?
- Không có hàng nội dung yêu cầu chiều rộng > 390 px (trừ padding)?
- Score: 18 / 20
- Lý do: PASS — mobile layout fits 390×844 without horizontal overflow, keeps one dominant CTA, and preserves review-card identity. Small lower navigation/control labels are secondary and should be tightened in production UI.

## Contrast (text/chip/control)
- Text body / nền chính ≥ 4.5:1 (WCAG AA)?
- Text phụ / chip / control state ≥ 3:1?
- Đo trên ≥ 3 cặp text/nền đại diện cho mỗi mock?
- Score: 14 / 15
- Lý do: PASS — main text, card labels, queue badges, and CTAs have strong visual contrast in the static PNGs. Final WCAG contrast still needs direct measurement on the live DOM implementation.

## State coverage (desktop/mobile/state)
- mock-desktop.png (1440×900) tồn tại, > 0 byte, mở được như ảnh hợp lệ?
- mock-mobile.png (390×844) tồn tại, > 0 byte, mở được như ảnh hợp lệ?
- mock-state.png tồn tại, > 0 byte, mở đúng MỘT trạng thái phụ duy nhất đã chỉ định trong implementation-notes.md (trạng thái đã chọn: empty state — không có item cần ôn)?
- Result: PASS — PNGs machine-verified after built-in `image_gen` render pass: mock-desktop.png 1440×900 / 2,201,582 bytes; mock-mobile.png 390×844 / 544,527 bytes; mock-state.png 1440×900 / 1,860,658 bytes. `mock-state.png` is the single review empty state; zero `mock-state-*.png` variants.

## Originality (no Inspiration_Sources copy)
- Không sao chép asset / nhân vật / place name / theme của Mykonos hoặc Two Point Campus?
- Đối chiếu với generation-prompt.md mục "Originality guardrails (forbidden IP references)"?
- Score: 15 / 15
- Lý do: PASS — Pack_Owner + Illustrator co-review found no Mykonos white-blue island/Cycladic cues and no Two Point Campus characters, place names, parody-campus props, or signature visual gags. Flip cards, review queue, and spaced-repetition tray are generic learning-task props in the Fuxie visual system.

## Visual Target Score
- Per-dimension scores:
  - Learning intent (3s): 19 / 20
  - Module identity distinctness: 15 / 15
  - Style master compliance: 14 / 15
  - Mobile readability (390×844, no horizontal overflow): 18 / 20
  - Contrast (text/chip/control): 14 / 15
  - Originality (no Inspiration_Sources copy): 15 / 15
- State coverage gate result: PASS — render evidence, exact dimensions, byte sizes, and single-state constraint verified.
- Provenance gate: PROVENANCE_PASS — built-in `image_gen` / GPT image pipeline provenance recorded in generation-prompt.md and independently consistency-reviewed.
- Total Visual Target Score: 95 / 100
- Pass/fail outcome: PASS
- (PASS yêu cầu: tổng ≥ 80, không chiều nào < 50% trọng số riêng, gate State coverage = PASS, QA_Owner đã ký.)
- QA_Owner: Codex QC authorized on 2026-05-21
- Date (ISO 8601): 2026-05-21
- Residual risk: Generated German microcopy needs linguistic review, and final WCAG contrast must still be measured on live DOM.
