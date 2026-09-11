# Kiro Work-Order — Content Review Board (cổng QA nội dung đa-agent, tool-grounded)

> Dán phần trong khung vào Kiro để tạo **Spec mới** `fuxie-content-review-board`. Mục tiêu: dựng một **cổng QA nội dung thường trực** kiểm chất lượng từng bài học, thiết kế cho hoàn cảnh **chưa có người rành tiếng Đức** → dựa vào tool có thẩm quyền + red-team + nhãn trung thực, KHÔNG tự chứng nhận chất lượng chủ quan.

---

Tạo một **Spec mới** tên `fuxie-content-review-board` cho repo Fuxie. Đây là hạ tầng **cổng QA nội dung thường trực (permanent gate)** + chạy 1 lượt cho 1.282 reading explanation hiện tại. Sinh `requirements.md` (EARS), `design.md`, `tasks.md` theo house style `.kiro/specs/`.

Role-gate: đọc `AGENTS.md` + `.agents/workflows/task-role-router.md`. **Vai chính: AI / LLM Engineer.** Vai phối hợp: German Academic Lead, Content QA / Linguistic Reviewer, QA Automation Engineer, DevOps / Cloud Engineer. Bắt đầu output bằng `Vai chinh:` / `Vai phoi hop:`.

## Hai quyết định owner đã chốt (ràng buộc thiết kế)
1. **Cổng thường trực**: board chạy như gate cho mọi bài học mới/sửa, không chỉ một lần.
2. **Chưa có người rành tiếng Đức**: board KHÔNG được tự chứng nhận chất lượng chủ quan. Phải dựa tối đa vào tool có thẩm quyền + red-team; phần chủ quan chỉ là **AI-advisory** + hàng đợi escalate (cho người/CTV tương lai).

## Kiến trúc 2 tầng (BẮT BUỘC tách bạch)

**Tier 1 — Cổng deterministic (chặn được, chạy trong CI, miễn phí):**
- Chạy LanguageTool (de-DE, server local/Docker) + hunspell de_DE trên mọi chuỗi tiếng Đức của content → lỗi chính tả/ngữ pháp khách quan.
- Validate Genus/quán từ + số nhiều theo từ điển; validate `wordType`/enum.
- **Answer-key consistency**: với câu có đáp án, kiểm `explanation`/`key_evidence` không mâu thuẫn đáp án; `correctIndex`/`answer` hợp lệ.
- Đây là tầng **CITEABLE + BLOCKING**: lỗi ở đây là defect thật, chặn PR. Chạy trên file content thay đổi (như `qa:content`).

**Tier 2 — Agent Review Board (advisory, provider-eval, chạy on-demand/nightly):**
- 4 reviewer agent chạy **context độc lập**, model mạnh khác model đã sinh nội dung:
  1. German Linguist (ngữ pháp/Genus/Kasus sâu hơn tool).
  2. CEFR/Pedagogy (level-fit; lời giải có justify đáp án bằng `key_evidence`; distractor).
  3. VN Localization (dịch chính xác/tự nhiên/thuật ngữ).
  4. **Red-team mù đáp án**: nhận câu hỏi + options NHƯNG KHÔNG thấy `answer`/`explanation`; tự giải; lệch với đáp án lưu = cờ đỏ.
- Aggregator hợp nhất → điểm đồng thuận + confidence. **KHÔNG auto-approve chất lượng chủ quan ra production**; chỉ: đồng thuận-cao + 0 lỗi Tier-1 → "advisory-pass (low-assurance)"; còn lại → **escalate queue**.

## Hiệu chỉnh KHÔNG cần người — mutation gold-set
Vì chưa có người tiếng Đức để làm gold-set, validate độ nhạy bộ dò bằng **lỗi cấy**:
- Tạo bản sao tạm của N item, cấy lỗi đã biết: sai Genus (FEMININ→FEMINUM), sai chính tả (bỏ umlaut), sai đáp án (đổi `answer`), sai level (chèn cấu trúc C1 vào A1), dịch sai/loanword.
- Chạy board lên bản cấy → **đo recall** (board bắt được bao nhiêu % lỗi cấy).
- Báo cáo recall theo loại lỗi. Recall thấp ở loại nào → tầng dò loại đó chưa đáng tin, ghi rõ.
- Bản cấy là tạm (READ-ONLY với content thật; xoá sau đo).

## Nhãn trung thực (BẮT BUỘC trong mọi output)
Mỗi item + mỗi batch phải mang 2 nhãn tách biệt:
- **Objective**: PASS/FAIL theo Tier-1 (có thẩm quyền — tool + answer-key).
- **Subjective**: AI-ADVISORY confidence cao/vừa/thấp — **KÈM câu rõ "chưa được người rành tiếng Đức duyệt"**.
Tuyệt đối không gộp 2 nhãn thành một chữ "approved".

## Tận dụng sẵn có (reuse-first)
- Mở rộng pipeline eval đã có: `scripts/ai-eval-harness.ts`, `eval:ai:academic-review` (`scripts/ai-eval-academic-review-pack.ts`), `eval:ai:academic-signoff` (`scripts/ai-eval-academic-signoff.ts`).
- Role rubric lấy từ `.agents/personnel/` (German Academic Lead, Content QA, Localization, Curriculum Designer, Exam Prep).
- Chuẩn: `docs/content-quality/cefr-audit-checklist.md`, `docs/content-quality/bilingual-style-guide.md`.
- Tái dùng review pack vừa dựng: `docs/content-quality/audit-2026-06/explanation-review/` (sample + full-traceability).
- Gate CI: cắm Tier-1 vào `.github/workflows/ci.yml` + thêm script `package.json` (vd `qa:german-lint`).

## Deliverable
- Spec `fuxie-content-review-board` (requirements EARS + design + tasks).
- Tier-1 script (vd `scripts/content-german-lint.ts`) + wiring CI + script `package.json`.
- Tier-2 harness mở rộng từ ai-eval (4 reviewer + red-team + aggregator), có cost/credit note.
- Script mutation-calibration + báo cáo recall theo loại lỗi.
- Kết quả chạy 1 lượt trên 1.282 explanation: CSV per-item (objective + subjective + confidence) + escalation queue, đặt ở `docs/content-quality/audit-2026-06/review-board/`.
- README ghi rõ: cái gì đã verify khách quan, cái gì chỉ AI-advisory, ngưỡng, cách vận hành gate.

## Ràng buộc
- Tier-1 deterministic + citeable; Tier-2 agent ở context độc lập; red-team KHÔNG thấy đáp án.
- KHÔNG auto-approve chất lượng chủ quan ra production khi chưa có người duyệt.
- READ-ONLY với `content/` (board chỉ đọc + ghi báo cáo; mutation chỉ trên bản sao tạm).
- Provider-eval tốn credit → ghi rõ cost ước tính + cho chạy theo batch/level.
- Reuse-first; không phát minh gate trùng `qa:content`.

## Acceptance
1. Spec 3 file pass format; role-gate đúng.
2. Tier-1 chạy được, bắt ≥X% lỗi cấy (báo recall thực tế theo loại), chặn được defect khách quan, sẵn sàng cắm CI.
3. Tier-2 sinh advisory + confidence + escalation queue cho 1.282 item; red-team chạy mù đáp án.
4. Mọi output mang nhãn objective vs subjective tách biệt + câu "chưa người duyệt".
5. content/ không đổi. Kết thúc đề xuất: dùng kết quả objective để de-risk PR #21 (owner quyết ship ở mức advisory), và mở hàng đợi escalate cho người tiếng Đức khi có.
