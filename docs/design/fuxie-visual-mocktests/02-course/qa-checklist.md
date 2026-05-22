# QA Checklist — 02-course

## Learning intent (3s)
- Reviewer (chưa biết tên module) chọn đúng learning intent từ 18 lựa chọn trong ≤ 3000 ms?
- Score: 19 / 20
- Lý do (current vs target): Khám phá lộ trình CEFR và chọn khóa học được nhận diện tức thì qua cấu trúc mục lục rõ ràng và sơ đồ "Dein Lernweg".

## Module identity distinctness
- Khác biệt ≥ 2/4 chiều (palette phụ / biểu tượng chủ đạo / layout signature / learning intent prop) so với 17 Module_Folder còn lại?
- Score: 14 / 15
- Lý do: Khác biệt rõ rệt qua lưới thẻ khóa học có kèm nhãn trình độ CEFR nổi bật và sơ đồ đường đi lộ trình học tập.

## Style master compliance
- Mọi token được dùng đều tham chiếu Style_Master, không khai báo token mới?
- Score: 14 / 15
- Lý do: Sử dụng chính xác bảng màu Fuxie Bright Sky (sky blue, deep blue, teal) và các token typography/radius chuẩn.

## Mobile readability (390×844, no horizontal overflow)
- CTA chính, tiêu đề module, learning intent chính, control state hiển thị đầy đủ ở 390×844?
- Body ≥ 14 px hiệu dụng, caption ≥ 12 px hiệu dụng?
- Không có hàng nội dung yêu cầu chiều rộng > 390 px (trừ padding)?
- Score: 19 / 20
- Lý do: Bố cục cột đơn thân thiện, cỡ chữ lớn dễ đọc, không có tràn ngang hay lỗi hiển thị trên thiết bị di động.

## Contrast (text/chip/control)
- Text body / nền chính ≥ 4.5:1 (WCAG AA)?
- Text phụ / chip / control state ≥ 3:1?
- Đo trên ≥ 3 cặp text/nền đại diện cho mỗi mock?
- Score: 14 / 15
- Lý do: Độ tương phản văn bản và nút bấm đạt chuẩn, đảm bảo tính khả dụng cao.

## State coverage (desktop/mobile/state)
- mock-desktop.png (1440×900) tồn tại, > 0 byte, mở được như ảnh hợp lệ?
- mock-mobile.png (390×844) tồn tại, > 0 byte, mở được như ảnh hợp lệ?
- mock-state.png tồn tại, > 0 byte, mở đúng MỘT trạng thái phụ duy nhất đã chỉ định trong implementation-notes.md (trạng thái đã chọn: loading state — đang tải catalog)?
- Result: PASS — machine-verified on 2026-05-20 (mock-desktop.png = 1440×900 / 2,052,390 bytes; mock-mobile.png = 390×844 / 564,673 bytes; mock-state.png = 1440×900 / 1,665,398 bytes; zero `mock-state-*.png` variants)

## Originality (no Inspiration_Sources copy)
- Không sao chép asset / nhân vật / place name / theme của Mykonos hoặc Two Point Campus?
- Đối chiếu với generation-prompt.md mục "Originality guardrails (forbidden IP references)"?
- Score: 15 / 15
- Lý do: Thiết kế gốc mang phong cách Fuxie, loại bỏ hoàn toàn các hình ảnh kiến trúc Địa Trung Hải hay các chi tiết đùa vui của Two Point Campus.

## Visual Target Score
- Per-dimension scores:
  - Learning intent (3s): 19 / 20
  - Module identity distinctness: 14 / 15
  - Style master compliance: 14 / 15
  - Mobile readability (390×844, no horizontal overflow): 19 / 20
  - Contrast (text/chip/control): 14 / 15
  - Originality (no Inspiration_Sources copy): 15 / 15
- State coverage gate result: PASS
- Total Visual Target Score: 95 / 100
- Pass/fail outcome: PASS
- QA_Owner: QA_Owner (delegated via Antigravity, Pack_Owner authorized; Codex QC 2026-05-20 adopted)
- Date (ISO 8601): 2026-05-20
- Residual risk: Không phát hiện rủi ro tồn dư trong scope visual đã kiểm.
