# Trình CEO/CTO — Chương trình Chất lượng Content Fuxie (A1–C2)

Vai chinh: Project Manager / Delivery Manager
Vai phoi hop: CTO / Tech Lead, Content QA / Linguistic Reviewer, German Academic Lead, AI / LLM Engineer

Ngày: 2026-06 · PR #21 (`chore/content-audit-remediation-2026-06`) · 1 trang để quyết

---

## 1. Tóm tắt điều hành (TL;DR)

Audit phát hiện content do generator sinh có **một họ bug hệ thống** (filler/placeholder, nội dung nhân bản, sai chủ đề, cấu trúc giả, câu hỏi lỗi nối template) trên reading + listening. Thay vì vá lẻ, đã dựng **một chương trình kiểm soát chất lượng toàn bộ 1.187 item / 36 cell (6 module × 6 level)**: cổng QA tự động, bảng trạng thái, lộ trình 5 đợt.

**Tình trạng:** hạ tầng + chẩn đoán đã xong và đáng tin. **Nút thắt còn lại là nguồn lực người duyệt tiếng Đức (D7)** — AI không thay được. Cần CEO quyết.

## 2. Quy mô & mức độ (số thật, đã xác minh đọc)

- Inventory: **1.187 item** — reading 266, listening 268, writing 230, speaking 48, vocabulary 369, grammar 6.
- **Defect thật ở 7 cell** (sau khi lọc nhiễu cổng):

| Cell | Lỗi | Quy mô | Mức |
| --- | --- | --- | --- |
| reading/C2 (Teil 2) | cloze filler dùng chung | 12 bài | P0 |
| listening/C2 | nhân bản + cấu trúc giả | 44+ bài | P0 |
| listening/B2 | nhân bản 011≡001, 012≡002 | 20 bài | P0 |
| listening/B1 | nhân bản 011≡001 | ~8 bài | P0 |
| listening/C1 | trùng một phần | ~16 bài | P1 |
| writing/A1 | Musterlösung dùng chung | ~10 bài | P2 |
| reading/B1 | câu hỏi lỗi nối template | 1 bài | P1 |

- **Đã chữa nội dung** (chờ người Đức duyệt): reading C2 Teil 1 + Teil 3 (20 bài) + broken-stem B2/C1/C2 (~93 câu).
- **Sạch theo máy:** vocabulary, grammar, speaking, reading A1/A2, writing A2–C2, listening A1/A2 (cần đọc mẫu xác nhận chất lượng học thuật).

## 3. Đã làm xong (không tốn thêm nguồn lực)

- ✅ Cổng QA tự động hợp nhất **D1–D6** (filler, nhân bản, sai chủ đề, cấu trúc giả, câu hỏi lỗi, đáp án không xác minh được) — tái dùng một nguồn logic, **20 property-test xanh**.
- ✅ **Status_Board 36 cell** sinh tự động từ scanner (dashboard kiểm soát).
- ✅ 5 spec con remediation + 1 umbrella spec + master plan + ticket nguyên nhân gốc.
- ✅ Quy trình apply có dry-run + validate (đã chứng minh end-to-end với 12 nháp C2-T2 + 1 nháp listening B2).

## 4. Rủi ro & sự thật cần biết

- **Chưa người rành tiếng Đức duyệt (D7) bất kỳ cell nào.** Mọi nội dung AI soạn là **nháp advisory**, chưa ghi vào `content/` để release.
- AI làm được: hạ tầng, scanner, nháp nội dung, dry-run. **AI KHÔNG thay được** đánh giá chất lượng học thuật + độ chính xác tiếng Đức.
- Audio listening: transcript sửa ⇒ MP3 cũ lệch, cần re-record (Speech/Audio Engineer).

## 5. 4 quyết định cần CEO/CTO

1. **Duyệt mô hình chương trình** (36 cell + cổng + 5 đợt) thay vì vá lẻ? (khuyến nghị: có)
2. **Nguồn lực German Academic Lead cho D7**: nội bộ hay thuê thêm reviewer bản ngữ? (đây là nút thắt quyết tiến độ)
3. **Ưu tiên Đợt 0** (fix generator gốc + cắm CI) để chặn tái sinh trước khi viết lại? (khuyến nghị: có — làm ngay, không cần chuyên gia Đức)
4. **Phạm vi release đầu** = chốt 4 cụm P0 (C2-T2 + listening C2/B2/B1)?

## 6. Đề xuất lộ trình sau khi duyệt

- **Đợt 0 (ngay, kỹ thuật):** cắm cổng vào CI + fix generator gốc → chặn tái sinh.
- **Đợt 1 (cần D7):** đóng 4 cụm P0 — đã có nháp/spec sẵn.
- **Đợt 2–3:** xác minh phần còn lại + audit chất lượng D7 toàn diện + re-record audio.
- **Đợt 4:** 36 cell đạt "Done đủ" + cổng CI thường trực.

## 7. Tham chiếu
- Master plan: `docs/content-quality/audit-2026-06/content-remediation-master-plan.md`
- Status_Board: `docs/content-quality/audit-2026-06/status-board.md`
- Tìm defect chi tiết: `docs/content-quality/audit-2026-06/review-board/kiro-pilot/cross-content-duplicate-scan.md`
- Ticket nguyên nhân gốc: `docs/content-quality/audit-2026-06/review-board/TICKET-content-generator-filler-rootcause.md`
- Specs: `.kiro/specs/content-program-quality`, `content-c2-teil2-regeneration`, `content-listening-regeneration`, `content-writing-audit`, `content-c2-placeholder-regeneration`, `content-c2-teil3-regeneration`, `content-cefr-stem-regeneration`

> Trung thực: số liệu defect từ cổng tự động + đọc xác minh mẫu; chất lượng học thuật toàn bộ vẫn cần người Đức duyệt. READ-ONLY `content/` tới khi có sign-off.
