# QA Checklist — 06-grammar

## Learning intent (3s)
- Reviewer (chưa biết tên module) chọn đúng learning intent từ 18 lựa chọn trong ≤ 3000 ms?
- Score: 19 / 20
- Lý do (current vs target): Giao diện bài học Akkusativ và banner quy tắc ngữ pháp hiển thị trực diện, hiểu ngay mục tiêu bài học trong 3 giây.

## Module identity distinctness
- Khác biệt ≥ 2/4 chiều (palette phụ / biểu tượng chủ đạo / layout signature / learning intent prop) so với 17 Module_Folder còn lại?
- Score: 14 / 15
- Lý do: Màu phụ violet + giấy trắng và hình ảnh sơ đồ ngữ pháp đặc trưng giúp phân biệt hoàn toàn với các module khác.

## Style master compliance
- Mọi token được dùng đều tham chiếu Style_Master, không khai báo token mới?
- Score: 14 / 15
- Lý do: Các token khoảng cách spacing và bo góc radius tuân thủ hoàn hảo thiết kế Style Master.

## Mobile readability (390×844, no horizontal overflow)
- CTA chính, tiêu đề module, learning intent chính, control state hiển thị đầy đủ ở 390×844?
- Body ≥ 14 px hiệu dụng, caption ≥ 12 px hiệu dụng?
- Không có hàng nội dung yêu cầu chiều rộng > 390 px (trừ padding)?
- Score: 18 / 20
- Lý do: Accordion layout hiển thị tốt trên mobile, header ≤ 64px, cỡ chữ tối thiểu $\ge$ 12px hiệu dụng, không tràn ngang.

## Contrast (text/chip/control)
- Text body / nền chính ≥ 4.5:1 (WCAG AA)?
- Text phụ / chip / control state ≥ 3:1?
- Đo trên ≥ 3 cặp text/nền đại diện cho mỗi mock?
- Score: 14 / 15
- Lý do: Độ tương phản văn bản/nền chính đạt chuẩn WCAG AA $\ge$ 4.5:1, các nút bấm/chip điều khiển $\ge$ 3:1.

## State coverage (desktop/mobile/state)
- mock-desktop.png (1440×900) tồn tại, > 0 byte, mở được như ảnh hợp lệ?
- mock-mobile.png (390×844) tồn tại, > 0 byte, mở được như ảnh hợp lệ?
- mock-state.png tồn tại, > 0 byte, mở đúng MỘT trạng thái phụ duy nhất đã chỉ định trong implementation-notes.md (trạng thái đã chọn: error state — sai pattern thường gặp với feedback chi tiết)?
- Result: PASS — machine-verified on 2026-05-21 (mock-desktop.png = 1440×900 / 2,044,971 bytes; mock-mobile.png = 390×844 / 418,887 bytes; mock-state.png = 1440×900 / 1,657,319 bytes; zero mock-state-*.png variants)

## Originality (no Inspiration_Sources copy)
- Không sao chép asset / nhân vật / place name / theme của Mykonos hoặc Two Point Campus?
- Đối chiếu với generation-prompt.md mục "Originality guardrails (forbidden IP references)"?
- Score: 15 / 15
- Lý do: Hoàn toàn không chứa kiến trúc trắng-xanh mái vòm Hy Lạp hay các nhân vật/chi tiết hài hước từ Two Point Campus.

## Visual Target Score
- Per-dimension scores:
  - Learning intent (3s): 19 / 20
  - Module identity distinctness: 14 / 15
  - Style master compliance: 14 / 15
  - Mobile readability (390×844, no horizontal overflow): 18 / 20
  - Contrast (text/chip/control): 14 / 15
  - Originality (no Inspiration_Sources copy): 15 / 15
- State coverage gate result: PASS
- Provenance gate: PROVENANCE_PASS
- Total Visual Target Score: 94 / 100
- Pass/fail outcome: PASS
- QA_Owner: Codex QC authorized on 2026-05-21
- Date (ISO 8601): 2026-05-21
- Residual risk: Không phát hiện rủi ro tồn dư trong scope visual đã kiểm.
