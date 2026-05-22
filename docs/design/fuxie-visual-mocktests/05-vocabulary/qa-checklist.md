# QA Checklist — 05-vocabulary

## Learning intent (3s)
- Reviewer (chưa biết tên module) chọn đúng learning intent từ 18 lựa chọn trong ≤ 3000 ms?
- Score: 18 / 20
- Lý do (current vs target): Khám phá từ vựng qua thẻ flashcard trực quan rất rõ ràng và dễ hiểu ngay trong 3 giây.

## Module identity distinctness
- Khác biệt ≥ 2/4 chiều (palette phụ / biểu tượng chủ đạo / layout signature / learning intent prop) so với 17 Module_Folder còn lại?
- Score: 14 / 15
- Lý do: Sử dụng bảng màu coral + warm cream và layout thẻ flashcard đặc trưng tạo nên bản sắc độc lập so với các module khác.

## Style master compliance
- Mọi token được dùng đều tham chiếu Style_Master, không khai báo token mới?
- Score: 14 / 15
- Lý do: Tuân thủ chính xác hệ thống spacing, bán kính góc bo, màu sắc Bright Sky của Style Master.

## Mobile readability (390×844, no horizontal overflow)
- CTA chính, tiêu đề module, learning intent chính, control state hiển thị đầy đủ ở 390×844?
- Body ≥ 14 px hiệu dụng, caption ≥ 12 px hiệu dụng?
- Không có hàng nội dung yêu cầu chiều rộng > 390 px (trừ padding)?
- Score: 19 / 20
- Lý do: Bố cục mobile 390×844 hiển thị xuất sắc, kích cỡ chữ và cấu trúc nút bấm rõ ràng, không có hiện tượng tràn màn hình.

## Contrast (text/chip/control)
- Text body / nền chính ≥ 4.5:1 (WCAG AA)?
- Text phụ / chip / control state ≥ 3:1?
- Đo trên ≥ 3 cặp text/nền đại diện cho mỗi mock?
- Score: 14 / 15
- Lý do: Mọi cặp chữ/nền đều đạt độ tương phản chuẩn WCAG AA ≥ 4.5:1.

## State coverage (desktop/mobile/state)
- mock-desktop.png (1440×900) tồn tại, > 0 byte, mở được như ảnh hợp lệ?
- mock-mobile.png (390×844) tồn tại, > 0 byte, mở được như ảnh hợp lệ?
- mock-state.png tồn tại, > 0 byte, mở đúng MỘT trạng thái phụ duy nhất đã chỉ định trong implementation-notes.md (trạng thái đã chọn: success state — đã thuộc 10 từ)?
- Result: PASS — machine-verified on 2026-05-20 (mock-desktop.png = 1440×900 / 1,568,079 bytes; mock-mobile.png = 390×844 / 424,595 bytes; mock-state.png = 1440×900 / 1,457,417 bytes; zero mock-state-*.png variants)

## Originality (no Inspiration_Sources copy)
- Không sao chép asset / nhân vật / place name / theme của Mykonos hoặc Two Point Campus?
- Đối chiếu với generation-prompt.md mục "Originality guardrails (forbidden IP references)"?
- Score: 15 / 15
- Lý do: Hoàn toàn không sao chép asset / nhân vật / địa danh / chủ đề của Mykonos hay Two Point Campus; mascot là Fuxie-specific sky-blue + teal.

## Visual Target Score
- Per-dimension scores:
  - Learning intent (3s): 18 / 20
  - Module identity distinctness: 14 / 15
  - Style master compliance: 14 / 15
  - Mobile readability (390×844, no horizontal overflow): 19 / 20
  - Contrast (text/chip/control): 14 / 15
  - Originality (no Inspiration_Sources copy): 15 / 15
- State coverage gate result: PASS
- Provenance gate: PROVENANCE_PASS
- Total Visual Target Score: 94 / 100
- Pass/fail outcome: PASS
- QA_Owner: Codex QC authorized on 2026-05-21
- Date (ISO 8601): 2026-05-21
- Residual risk: Không phát hiện rủi ro tồn dư trong scope visual đã kiểm.
