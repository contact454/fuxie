# Kiro Work-Order — Dựng Review Pack cho 1.282 reading explanation (RB-P2-02)

> Dán phần trong khung vào Kiro. Mục tiêu: Kiro **dựng một review pack** để người rành tiếng Đức (German Academic Lead) duyệt nhanh chất lượng 1.282 reading explanation do AI sinh (commit `755326d25`) — đây là điều kiện chặn merge PR #21. Kiro **không tự duyệt, không tự ký** nội dung mình sinh; chỉ dựng pack + pre-screen máy-kiểm-được để người duyệt làm nhanh.

---

Đây là work-order **dựng tài liệu review (READ-ONLY)**, KHÔNG sửa nội dung học. Output là review pack cho con người duyệt. Tuyệt đối KHÔNG tự đánh dấu "approved" cho bất kỳ item nào — cột verdict để TRỐNG cho người duyệt.

Role-gate: đọc `AGENTS.md` + `.agents/workflows/task-role-router.md`. **Vai chính: Content QA / Linguistic Reviewer.** Vai phối hợp: German Academic Lead, Vietnamese-German Localization Specialist, German Curriculum Designer. Bắt đầu output bằng `Vai chinh:` / `Vai phoi hop:`.

## Bối cảnh
- Commit `755326d25` (nhánh `chore/content-audit-remediation-2026-06`, PR #21) đã thay 1.282 `explanation.vi` của reading + viết lại 584 đoạn `explanation.de` (582 templated + 2 thin) — toàn bộ do AI sinh, CHƯA người duyệt.
- Nội dung ở `content/*/reading/*.json`. Mỗi question answer-bearing có: `id`, `teil`, `type` ∈ {multiple_choice, matching, richtig_falsch, ja_nein, matching_ab, detail_extraction}, `stem`|`statement`|`situation`, `options` (nếu MC), `answer`, `explanation.{de, key_evidence, key_vocabulary, vi}`.
- Phân loại `de` (dùng `scripts/classify-reading-explanations.ts`): rich=698 (chỉ dịch), templated→rewritten=582, thin=2. **Nhóm 584 de-rewritten rủi ro cao hơn** (AI viết lại lập luận tiếng Đức, không chỉ dịch).

## Phạm vi
TRONG: dựng review pack cho 1.282 explanation reading. NGOÀI: KHÔNG sửa content; KHÔNG tự chấm/ký; không đụng listening/vocabulary.

## Phương pháp
**Lớp A — Machine pre-screen (toàn bộ 1.282, chỉ tín hiệu KHÁCH QUAN, không phán đoán hay/dở tiếng Đức):** quét và gắn cờ:
- `de` không chứa/không phủ `key_evidence` (lập luận không dẫn đúng bằng chứng) → FLAG.
- `de` vẫn còn dạng template "Die richtige Antwort ist …" (lẽ ra đã viết lại) → FLAG.
- `vi` vẫn là boilerplate cũ ("Hãy đối chiếu với thông tin then chốt…") hoặc rỗng → FLAG.
- `vi` không nhắc tới đáp án/nội dung tương ứng → FLAG.
- bất thường độ dài (`de`/`vi` quá ngắn so với trung vị cùng level) → FLAG.
- mojibake/ký tự thay thế trong `de`/`vi` → FLAG.
Xuất `full-traceability.csv` (1.282 dòng) + tóm tắt số cờ theo loại.

**Lớp B — Mẫu phân tầng cho người duyệt (~150–180 item):**
- Phân tầng level (a1–c2) × type (6 loại); **seed cố định để tái lập**.
- Oversample nhóm **de-rewritten (584)** và **C1/C2** (tiếng Đức khó nhất).
- CỘNG: **tất cả item bị Lớp A gắn cờ** (duyệt bắt buộc, bất kể có trong mẫu ngẫu nhiên hay không).
- Mỗi dòng gồm: `file_path`, `item_id`, `level`, `type`, stem/statement/situation, `answer`, `key_evidence`, `de`, `vi`, `de_class` (rich/rewritten/thin), `prescreen_flags` — và **CỘT TRỐNG cho người duyệt**: `verdict` (pass/fix/fail), `error_dimension` (German/pedagogy/CEFR/VN), `note`.

## Deliverable (`docs/content-quality/audit-2026-06/explanation-review/`)
- `README.md` — hướng dẫn người duyệt + phương pháp chọn mẫu + seed + ngưỡng chấp nhận.
- `rubric.md` — tiêu chí pass/fail từng chiều: (1) tiếng Đức đúng (ngữ pháp/chính tả/Genus/Kasus), (2) lập luận đúng — explanation thật sự justify `answer` bằng `key_evidence`, (3) ngôn ngữ hợp CEFR level, (4) tiếng Việt chính xác + tự nhiên.
- `sample-review.csv` — ~150–180 dòng, cột verdict TRỐNG.
- `full-traceability.csv` — 1.282 dòng + `prescreen_flags`.
- `prescreen-summary.md` — số cờ theo loại + danh sách item FLAG (duyệt bắt buộc).
- `signoff.md` — sheet ký: tên người duyệt, ngày, pass-rate theo tầng, verdict tổng (approve / approve-with-fixes / reject), quy tắc ngưỡng.

## Ngưỡng chấp nhận (ghi trong README + signoff)
- Bất kỳ lỗi "dạy sai đáp án / sai ngữ pháp Đức" (P0/P1) nào trong mẫu → batch CHƯA đạt; mở fix-spec sửa + mở rộng mẫu.
- Đề xuất (người duyệt chốt con số cuối): pass-rate mẫu ≥99% và 0 P0/P1 → approve; 95–99% lỗi nhỏ → approve-with-fixes; <95% hoặc ≥1 P0 → reject.

## Ràng buộc
- READ-ONLY `content/`. Evidence-gated: mọi dòng dẫn `file_path` + `item_id` + giá trị field thật.
- Cột verdict để TRỐNG — Kiro KHÔNG tự điền. Pre-screen chỉ gắn cờ khách quan, không kết luận hay/dở tiếng Đức.
- Mẫu tái lập (ghi seed + phương pháp). UTF-8 sạch (verify bằng decode trực tiếp, không dựa console codepage).

## Acceptance
1. Đủ file pack ở `explanation-review/`.
2. `full-traceability.csv` = 1.282 dòng; `sample-review.csv` phân tầng + chứa mọi item-bị-cờ; cột verdict trống.
3. Pre-screen chạy trên cả 1.282; summary liệt kê item FLAG.
4. Rubric + signoff + README đủ để một người rành tiếng Đức duyệt độc lập (không cần Kiro giải thích thêm).
5. `content/` không đổi (read-only). Kết thúc bằng đề xuất bước kế: giao German Academic Lead duyệt → nếu ký approve thì merge PR #21; nếu có lỗi thì mở fix-spec.
