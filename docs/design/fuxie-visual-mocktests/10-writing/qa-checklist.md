# QA Checklist — 10-writing

## Learning intent (3s)
- Reviewer (chưa biết tên module) chọn đúng learning intent từ 18 lựa chọn trong ≤ 3000 ms?
- Score: 19 / 20
- Lý do (current vs target): PASS — active editor, visible cursor, draft text, prompt card, hint chips, and `Text pruefen`/`Text verbessern` CTA make "Viết câu / đoạn văn với hint cấu trúc" clear within the first viewport. Minor deduction because generated mockcopy still needs production linguistic review.

## Module identity distinctness
- Khác biệt ≥ 2/4 chiều (palette phụ / biểu tượng chủ đạo / layout signature / learning intent prop) so với 17 Module_Folder còn lại?
- Score: 15 / 15
- Lý do: PASS — pen/cursor iconography, writing canvas, post-office composition, hint rail/chips, plum accent palette, and inline structure feedback make `10-writing` distinct from the other module identities.

## Style master compliance
- Mọi token được dùng đều tham chiếu Style_Master, không khai báo token mới?
- Score: 13 / 15
- Lý do: PASS — rendered mocks follow Bright Sky shell colors, rounded card/radius language, soft shadows, large touch targets, and clear CTA hierarchy. Deductions retained because generated PNG typography is not tokenized production DOM and desktop/state crops sit close to the app-shell edges.

## Mobile readability (390×844, no horizontal overflow)
- CTA chính, tiêu đề module, learning intent chính, control state hiển thị đầy đủ ở 390×844?
- Body ≥ 14 px hiệu dụng, caption ≥ 12 px hiệu dụng?
- Không có hàng nội dung yêu cầu chiều rộng > 390 px (trừ padding)?
- Score: 18 / 20
- Lý do: PASS — mobile mock shows title, prompt, editor, draft text, hint chips, bottom nav, and one dominant CTA without visible horizontal overflow. Minor deduction because the top/title/progress area is taller than the strict ≤ 64 px target and should be tightened in production.

## Contrast (text/chip/control)
- Text body / nền chính ≥ 4.5:1 (WCAG AA)?
- Text phụ / chip / control state ≥ 3:1?
- Đo trên ≥ 3 cặp text/nền đại diện cho mỗi mock?
- Score: 13 / 15
- Lý do: PASS — editor text, hint chips, primary CTA, and inline error feedback are visually legible on the rendered PNGs. Deductions retained because WCAG contrast can only be fully measured on final live DOM/text colors and some secondary chip labels are visually small.

## State coverage (desktop/mobile/state)
- mock-desktop.png (1440×900) tồn tại, > 0 byte, mở được như ảnh hợp lệ?
- mock-mobile.png (390×844) tồn tại, > 0 byte, mở được như ảnh hợp lệ?
- mock-state.png tồn tại, > 0 byte, mở đúng MỘT trạng thái phụ duy nhất đã chỉ định trong implementation-notes.md (trạng thái đã chọn: error state — thiếu yêu cầu cấu trúc, feedback inline)?
- Result: PASS — PNGs machine-verified after built-in `image_gen` render pass: mock-desktop.png 1440×900 / 2,609,720 bytes; mock-mobile.png 390×844 / 571,775 bytes; mock-state.png 1440×900 / 2,471,101 bytes. `mock-state.png` is the single writing-structure-error state with inline feedback; zero `mock-state-*.png` variants.

## Originality (no Inspiration_Sources copy)
- Không sao chép asset / nhân vật / place name / theme của Mykonos hoặc Two Point Campus?
- Đối chiếu với generation-prompt.md mục "Originality guardrails (forbidden IP references)"?
- Score: 15 / 15
- Lý do: PASS — Pack_Owner + Illustrator co-review found no Mykonos white-blue island/Cycladic cues and no Two Point Campus characters, place names, parody-campus props, or signature visual gags. Post-office writing counter, pen/cursor, and editor assets are generic learning-task props in the Fuxie visual system.

## Visual Target Score
- Per-dimension scores:
  - Learning intent (3s): 19 / 20
  - Module identity distinctness: 15 / 15
  - Style master compliance: 13 / 15
  - Mobile readability (390×844, no horizontal overflow): 18 / 20
  - Contrast (text/chip/control): 13 / 15
  - Originality (no Inspiration_Sources copy): 15 / 15
- State coverage gate result: PASS — render evidence, exact dimensions, byte sizes, and single-state constraint verified.
- Provenance gate: PROVENANCE_PASS — built-in `image_gen` / GPT image pipeline provenance recorded in generation-prompt.md.
- Total Visual Target Score: 93 / 100
- Pass/fail outcome: PASS
- (PASS yêu cầu: tổng ≥ 80, không chiều nào < 50% trọng số riêng, gate State coverage = PASS, QA_Owner đã ký.)
- QA_Owner: Codex QC authorized on 2026-05-21
- Date (ISO 8601): 2026-05-21
- Residual risk: Desktop/state crops sit close to app-shell edges, generated German mockcopy needs linguistic review, and final WCAG contrast must still be measured on live DOM.
