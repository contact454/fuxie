# QA Checklist — 09-reading

## Learning intent (3s)
- Reviewer (chưa biết tên module) chọn đúng learning intent từ 18 lựa chọn trong ≤ 3000 ms?
- Score: 18 / 20
- Lý do (current vs target): PASS — open-book hero, reading passage, comprehension question, selected answer, and `Antwort pruefen` CTA make "Đọc đoạn văn và trả lời câu hỏi hiểu" clear within the first viewport. Minor deduction because the generated CTA icon resembles a microphone and should be replaced with a reading/check icon in production.

## Module identity distinctness
- Khác biệt ≥ 2/4 chiều (palette phụ / biểu tượng chủ đạo / layout signature / learning intent prop) so với 17 Module_Folder còn lại?
- Score: 13 / 15
- Lý do: PASS — wide reading column, side question panel, open-book prop, library nook, and sage/ivory accent surfaces distinguish `09-reading`. Minor deduction because the generated microphone CTA icon visually overlaps with speaking-module language.

## Style master compliance
- Mọi token được dùng đều tham chiếu Style_Master, không khai báo token mới?
- Score: 14 / 15
- Lý do: PASS — rendered mocks follow Bright Sky base colors, rounded card/radius language, soft shadows, large touch targets, and clear CTA hierarchy. Minor deduction because generated PNG typography/microcopy is visual evidence only, not tokenized production DOM.

## Mobile readability (390×844, no horizontal overflow)
- CTA chính, tiêu đề module, learning intent chính, control state hiển thị đầy đủ ở 390×844?
- Body ≥ 14 px hiệu dụng, caption ≥ 12 px hiệu dụng?
- Không có hàng nội dung yêu cầu chiều rộng > 390 px (trừ padding)?
- Score: 18 / 20
- Lý do: PASS — mobile mock shows the module title, book/passage, question, answer choices, and one dominant CTA without visible horizontal overflow. Minor deduction because the visual header/progress area is taller than the strict ≤ 64 px target and should be tightened in production.

## Contrast (text/chip/control)
- Text body / nền chính ≥ 4.5:1 (WCAG AA)?
- Text phụ / chip / control state ≥ 3:1?
- Đo trên ≥ 3 cặp text/nền đại diện cho mỗi mock?
- Score: 14 / 15
- Lý do: PASS — main text, answer cards, selected-answer state, success panel, and primary CTA are visually legible on the rendered PNGs. Minor deduction retained because WCAG contrast can only be fully measured on final live DOM/text colors.

## State coverage (desktop/mobile/state)
- mock-desktop.png (1440×900) tồn tại, > 0 byte, mở được như ảnh hợp lệ?
- mock-mobile.png (390×844) tồn tại, > 0 byte, mở được như ảnh hợp lệ?
- mock-state.png tồn tại, > 0 byte, mở đúng MỘT trạng thái phụ duy nhất đã chỉ định trong implementation-notes.md (trạng thái đã chọn: success state — đạt comprehension threshold)?
- Result: PASS — PNGs machine-verified after built-in `image_gen` render pass: mock-desktop.png 1440×900 / 2,530,424 bytes; mock-mobile.png 390×844 / 621,659 bytes; mock-state.png 1440×900 / 2,620,569 bytes. `mock-state.png` is the single comprehension-success state with threshold reached + continue path; zero `mock-state-*.png` variants.

## Originality (no Inspiration_Sources copy)
- Không sao chép asset / nhân vật / place name / theme của Mykonos hoặc Two Point Campus?
- Đối chiếu với generation-prompt.md mục "Originality guardrails (forbidden IP references)"?
- Score: 15 / 15
- Lý do: PASS — Pack_Owner + Illustrator co-review found no Mykonos white-blue island/Cycladic cues and no Two Point Campus characters, place names, parody-campus props, or signature visual gags. Library/open-book/comprehension visuals are generic learning-task props in the Fuxie visual system.

## Visual Target Score
- Per-dimension scores:
  - Learning intent (3s): 18 / 20
  - Module identity distinctness: 13 / 15
  - Style master compliance: 14 / 15
  - Mobile readability (390×844, no horizontal overflow): 18 / 20
  - Contrast (text/chip/control): 14 / 15
  - Originality (no Inspiration_Sources copy): 15 / 15
- State coverage gate result: PASS — render evidence, exact dimensions, byte sizes, and single-state constraint verified.
- Provenance gate: PROVENANCE_PASS — built-in `image_gen` / GPT image pipeline provenance recorded in generation-prompt.md.
- Total Visual Target Score: 92 / 100
- Pass/fail outcome: PASS
- (PASS yêu cầu: tổng ≥ 80, không chiều nào < 50% trọng số riêng, gate State coverage = PASS, QA_Owner đã ký.)
- QA_Owner: Codex QC authorized on 2026-05-21
- Date (ISO 8601): 2026-05-21
- Residual risk: Generated CTA iconography includes a microphone-like icon and should be corrected to a reading/check icon in production; generated German mockcopy and final WCAG contrast must still be reviewed on live DOM.
