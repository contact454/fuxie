# Fuxie vs Duolingo — vì sao còn "cùi" & cách sửa

Date: 2026-07-01 · Skill: design:design-critique · So sánh màn gameplay M3.

## Chẩn đoán cốt lõi
Art của Fuxie (làng, mascot, vật phẩm) đã đẹp. Cái "cùi" nằm ở **UI chrome craft** — nút/chữ/tương phản/phản hồi — và ở việc **để nền làng mờ phía sau vùng làm bài làm giảm tương phản, trông mờ đục**. Duolingo đầu tư mạnh đúng 4 thứ này và giữ **vùng bài tập sạch**.

## Bảng so sánh
| Yếu tố | Duolingo (đắt) | Fuxie hiện tại (cùi) | Sửa |
|---|---|---|---|
| **Nút bấm** | Khối đặc, cao ~56–60px, bo lớn, có **"gờ dưới" 3–4px đậm** → bấm được, lún khi nhấn | Pill mỏng, viền 1px, phẳng lì, không chiều sâu | Dựng nút **tactile 3D**: fill đặc + lip dưới + animation lún; cao 56–60px |
| **Chữ** | Rounded **đậm** (heavy), to, rõ | Trọng lượng vừa, hơi nhạt | Nunito **800**, tăng size câu hỏi/từ |
| **Tương phản** | Nội dung trên nền **sạch** (trắng/tối), chữ nổi bật | Chữ nằm trên **làng mờ đục** → mờ, khó đọc | Vùng bài tập **nền sạch**; bỏ/giảm mạnh làng mờ sau card |
| **Trạng thái đáp án** | Chọn = xanh đặc; đúng = xanh; sai = đỏ + rung; rõ ràng | Chỉ đổi viền nhạt | Fill màu đặc cho selected/correct/wrong (xanh/đỏ), rung khi sai |
| **Phản hồi** | **Bảng trượt dưới** xanh "Correct"/đỏ "Correct solution" + nút CONTINUE to | Đổi pose mascot + viền, quá nhẹ | Thêm **feedback footer** đúng/sai + CTA "Tiếp tục" to |
| **Nhịp khoảng cách** | Đều, rộng rãi | Hơi chật/không đều | Chuẩn hoá spacing 16–20px |

## Insight quan trọng (đảo 1 phần A5)
"World-first" đúng cho **map / intro / reward**. Nhưng **màn làm bài phải SẠCH** — nội dung là vua, nền tối giản. Để làng mờ sau quiz là lý do lớn khiến M3 trông đục/cùi. → Chuyển làng thành nền cho M1/M2/M4; **M3 dùng nền sạch** (trắng-kem đặc, hoặc tint rất nhẹ), dồn craft vào nút + chữ + phản hồi.

## Ưu tiên sửa (đòn bẩy giảm dần)
1. **Nút tactile (Antigravity)** — làm lại `OptionTile` + `PrimaryCta`: fill đặc, gờ dưới (lip), lún khi bấm, cao 56–60px, bo `--radius-lg`, chữ đậm. Thêm token `--fuxie-lip-*`. Đây là đòn lớn nhất.
2. **Nền gameplay sạch (Antigravity)** — bỏ/nhẹ hoá làng mờ sau vùng bài; card từ vựng thành nền đặc tương phản cao.
3. **Trạng thái + feedback footer (Antigravity)** — đúng=xanh, sai=đỏ+rung, footer "Tiếp tục".
4. **Typography (Antigravity)** — Nunito 800 cho tiêu đề/nút, tăng size.
5. **Nhịp spacing** — chuẩn hoá.

## Cần asset mới không?
Gần như KHÔNG — đây là việc code UI (Antigravity). Chỉ nên nhờ Codex render **1 mockup target M3 kiểu Duolingo** (nền sạch + nút tactile + chữ đậm) làm đích thẩm mỹ chung, còn cơ chế nút thì code.
