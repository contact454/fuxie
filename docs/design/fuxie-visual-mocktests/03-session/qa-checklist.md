# QA Checklist — 03-session

## Learning intent (3s)
- Reviewer (chưa biết tên module) chọn đúng learning intent từ 18 lựa chọn trong ≤ 3000 ms?
- Score: 19 / 20
- Lý do (current vs target): PASS. Đã thông qua báo cáo Codex Visual QC [codex-03-session-visual-qc-2026-05-20.md](../../../../.kiro/specs/fuxie-visual-mocktest-pack/codex-03-session-visual-qc-2026-05-20.md). Mockup desktop và mobile thể hiện rõ cấu trúc một bước học (bước 1/8, câu hỏi trắc nghiệm kèm CTA 'Weiter' nổi bật).

## Module identity distinctness
- Khác biệt ≥ 2/4 chiều (palette phụ / biểu tượng chủ đạo / layout signature / learning intent prop) so với 17 Module_Folder còn lại?
- Score: 14 / 15
- Lý do: PASS. Đạt yêu cầu khác biệt layout (khu vực làm bài trung tâm tập trung, thanh đếm bước học) và sử dụng tone màu phụ teal + cool grey đặc trưng của session.

## Style master compliance
- Mọi token được dùng đều tham chiếu Style_Master, không khai báo token mới?
- Score: 14 / 15
- Lý do: PASS. Phù hợp hoàn toàn với palette màu chính Bright Sky (sky blue, deep blue, teal, soft sky, amber cho phần thưởng) và bo góc/đổ bóng chuẩn.

## Mobile readability (390×844, no horizontal overflow)
- CTA chính, tiêu đề module, learning intent chính, control state hiển thị đầy đủ ở 390×844?
- Body ≥ 14 px hiệu dụng, caption ≥ 12 px hiệu dụng?
- Không có hàng nội dung yêu cầu chiều rộng > 390 px (trừ padding)?
- Score: 17 / 20
- Lý do: PASS. Giao diện mobile hiển thị tốt trên viewport 390x844 không tràn ngang, các nút điều hướng và lựa chọn rõ ràng. Một số chữ nhỏ do AI sinh ra được coi là residual risk.

## Contrast (text/chip/control)
- Text body / nền chính ≥ 4.5:1 (WCAG AA)?
- Text phụ / chip / control state ≥ 3:1?
- Đo trên ≥ 3 cặp text/nền đại diện cho mỗi mock?
- Score: 13 / 15
- Lý do: PASS. Độ tương phản nút CTA chính và các lựa chọn đạt yêu cầu. Ghi nhận lỗi sinh chữ nhỏ ở header của success state hiển thị nhãn "DASHBOARD" là residual risk (dev cần chỉnh động trong code).

## State coverage (desktop/mobile/state)
- mock-desktop.png (1440×900) tồn tại, > 0 byte, mở được như ảnh hợp lệ?
- mock-mobile.png (390×844) tồn tại, > 0 byte, mở được như ảnh hợp lệ?
- mock-state.png tồn tại, > 0 byte, mở đúng MỘT trạng thái phụ duy nhất đã chỉ định trong implementation-notes.md (trạng thái đã chọn: success state — phiên học hoàn thành)?
- Result: PASS — machine-verified on 2026-05-20 (mock-desktop.png = 1440×900 / 2,094,598 bytes; mock-mobile.png = 390×844 / 518,103 bytes; mock-state.png = 1440×900 / 2,255,814 bytes; zero `mock-state-*.png` variants)

## Originality (no Inspiration_Sources copy)
- Không sao chép asset / nhân vật / place name / theme của Mykonos hoặc Two Point Campus?
- Đối chiếu với generation-prompt.md mục "Originality guardrails (forbidden IP references)"?
- Score: 14 / 15
- Lý do: PASS. Không sao chép các thành phần bản quyền hay phong cách kiến trúc địa trung hải/parody trường học. Phong cách voxel clay-like đặc trưng và độc lập.

## Visual Target Score
- Per-dimension scores:
  - Learning intent (3s): 19 / 20
  - Module identity distinctness: 14 / 15
  - Style master compliance: 14 / 15
  - Mobile readability (390×844, no horizontal overflow): 17 / 20
  - Contrast (text/chip/control): 13 / 15
  - Originality (no Inspiration_Sources copy): 14 / 15
- State coverage gate result: PASS
- Total Visual Target Score: 91 / 100
- Pass/fail outcome: PASS
- (PASS yêu cầu: tổng ≥ 80, không chiều nào < 50% trọng số riêng, gate State coverage = PASS, QA_Owner đã ký.)
- QA_Owner: QA_Owner (delegated sign-off via Antigravity — QC 91/100 adopted, Pack_Owner authorized)
- Date (ISO 8601): 2026-05-20
- Blocked reason: None
- Residual Risk: Nhãn tiêu đề trong mock-state.png hiển thị "DASHBOARD" thay vì "SESSION", được chấp nhận là tiểu tiết phát sinh từ AI generator; khi lập trình giao diện thực tế bắt buộc sử dụng dynamic header phù hợp với module.
