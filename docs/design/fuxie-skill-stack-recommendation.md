# Fuxie — Bộ Skill khuyến nghị (deep research)

Date: 2026-06-30
Mục tiêu: chọn bộ skill phục vụ redesign Fuxie cho 3 nhu cầu **A** (chất lượng & nhất quán thiết kế), **B** (nhất quán pipeline sinh asset AI), **E** (đóng gói quy trình thành skill Fuxie tái dùng).
Phương pháp: fan-out web search + đọc nguồn gốc + đối chiếu với plugin đã cài trong Cowork. Mỗi mục có: nhu cầu lấp, độ phổ biến/tin cậy, chi phí cài.

> Chú giải chi phí: **[Sẵn]** = đã cài trong Cowork, dùng ngay · **[1-chạm]** = cài qua marketplace/installer · **[Đóng gói]** = phải tự gói `.skill` hoặc `npx skills add` rồi import.

---

## Bộ khuyến nghị cuối cùng (theo thứ tự ưu tiên)

### Tầng 1 — Cài/ dùng ngay (đòn bẩy cao nhất)

1. **Plugin `design` (đã cài)** — `design-critique`, `design-system`, `accessibility-review`, `design-handoff`, `ux-copy`, `research-synthesis`. **[Sẵn]**
   - Lấp: **A** gần như trọn vẹn (critique, design system, a11y, handoff, copy).
   - Tin cậy: plugin chính trong Cowork của anh.
   - → Đây là xương sống chất lượng. Không cần cài thêm gì cho phần lớn nhu cầu A.

2. **Anthropic `frontend-design` skill** — chống "AI slop", ép cam kết một hướng thẩm mỹ trước khi code. **[1-chạm]**
   - Lấp: **A** (đúng bệnh "generic/chắp vá" của Fuxie). Buộc Claude chọn 1 art-direction và giữ nhất quán.
   - Tin cậy: **chính chủ Anthropic, 560k+ lượt cài** (2026) — skill design phổ biến nhất hệ sinh thái.
   - Cài: marketplace plugin Anthropic (`anthropics/claude-code` → `frontend-design`).

3. **`skill-creator` (đã cài)** — tạo/đóng gói skill. **[Sẵn]**
   - Lấp: **E** — dùng để đóng STYLE LOCK + ticket pattern + checklist nghiệm thu thành skill `fuxie-redesign` tái dùng.

### Tầng 2 — Nên thêm cho đúng nỗi đau cụ thể

4. **Vercel `web-interface-guidelines`** — audit UI theo 100+ heuristic. **[1-chạm]**
   - Lấp: **A** + mobile-first — kiểm tra touch target ≥44px, focus ring, reduced-motion, ARIA, keyboard. Khớp đúng yêu cầu mobile-first của Fuxie.
   - Tin cậy: Vercel-labs chính chủ; **installer hỗ trợ thẳng Antigravity** (`curl -fsSL https://vercel.com/design/guidelines/install | bash`) → cực hợp vì code chính của anh là Antigravity.

5. **`GPT-Image2-Skill` (wuyoscar)** — prompt gallery + agentic skill + CLI cho OpenAI gpt-image. **[Đóng gói]**
   - Lấp: **B** — đúng mô hình anh dùng (gpt-image-2.0 qua Codex). Cung cấp khuôn prompt nhất quán (genre → subject → setting → camera/lighting → exclude) — chính là thứ hệ thống hóa "STYLE LOCK" của ta.
   - Tin cậy: repo chuyên biệt cho GPT Image 2, đúng phiên bản; cần gói `.skill`.

6. **mattpocock `to-prd` + `to-issues` + `handoff`** — biến kế hoạch thành PRD → issue "vertical slice" độc lập → tài liệu bàn giao. **[Đóng gói]** (`npx skills@latest add mattpocock/skills`)
   - Lapse: **E** + điều phối — chuyển `fuxie-redesign-plan` thành ticket grab-được cho Antigravity và handoff cho Codex. `handoff` đặc biệt hợp luồng đa-agent.
   - Tin cậy: repo **149k sao**, cùng nhà với `grill-me` anh đang dùng.

### Tầng 3 — Tùy chọn, thêm nếu cần

7. **`adobe-for-creativity` (đã cài)** — `resize-photos-and-videos`, `create-social-variations`, `batch-edit-photos`. **[Sẵn]**
   - Lấp: **B** ở khâu *sau sinh* — resize/export asset đã render cho nhiều surface/tỉ lệ, đồng bộ hậu kỳ. (Không phải để *sinh* asset game.)

8. **`writing-great-skills` (mattpocock)** — chuẩn viết skill tốt. **[Đóng gói]**
   - Lấp: **E** — tài liệu tham chiếu để skill `fuxie-redesign` viết ra "xịn", trigger đúng.

9. **`prototype` (mattpocock)** — dựng nhiều biến thể UI bật/tắt trên một route. **[Đóng gói]**
   - Lấp: **A** — thử nhanh vài hướng art-direction trước khi chốt style frame.

---

## Bản đồ nhu cầu → skill

| Nhu cầu | Cài sẵn dùng ngay | Nên thêm |
| --- | --- | --- |
| **A** Chất lượng/nhất quán design | `design` plugin (full) | `frontend-design` (Anthropic), Vercel `web-interface-guidelines`, `prototype` |
| **B** Nhất quán pipeline ảnh AI | `adobe-for-creativity` (hậu kỳ) | `GPT-Image2-Skill` (sinh ảnh) |
| **E** Đóng gói skill Fuxie | `skill-creator` | mattpocock `to-prd`/`to-issues`/`handoff`, `writing-great-skills` |

## Bộ tối thiểu nếu chỉ chọn 4
1. `design` plugin **[Sẵn]** — chất lượng A.
2. `frontend-design` (Anthropic) **[1-chạm]** — diệt "chắp vá/generic".
3. `GPT-Image2-Skill` **[Đóng gói]** — nhất quán asset (B).
4. `skill-creator` **[Sẵn]** — đóng gói quy trình (E).

## Ghi chú độ tin cậy
- Số liệu lượt cài `frontend-design` dao động theo nguồn (277k tháng 3 → 560k+ giữa 2026) do tăng theo thời gian; xu hướng nhất quán: đây là skill design phổ biến nhất.
- Các skill GitHub (mattpocock, GPT-Image2-Skill) không cài 1-chạm trong Cowork — cần `.skill`/`npx skills add`; bù lại nguồn mở, sửa được.
- `adobe-for-creativity` mạnh ở ảnh thật/hậu kỳ, yếu ở *sinh* asset game phong cách 2.5D — đừng kỳ vọng nó thay Codex.
