# Reading Explanation Review Pack — 2026-06

Vai chinh: Content QA / Linguistic Reviewer
Vai phoi hop: German Academic Lead, Vietnamese-German Localization Specialist, German Curriculum Designer

> Gói tài liệu để **người rành tiếng Đức duyệt thủ công** 1.282 lời giải (explanation) phần Reading đã được tái sinh ở commit `755326d25` (nhánh `chore/content-audit-remediation-2026-06`, PR #21). Toàn bộ nội dung đó do AI sinh, **CHƯA ai duyệt**. Gói này là READ-ONLY: KHÔNG sửa `content/`, chỉ đọc và xuất tài liệu review.

## ⚠️ Nguyên tắc tối quan trọng

- **Cột `verdict` để TRỐNG.** Kiro/máy KHÔNG tự chấm, KHÔNG tự đánh "approved". Chỉ người duyệt điền.
- Pre-screen chỉ gắn **cờ khách quan** (objective signal), KHÔNG phán đoán hay/dở tiếng Đức.
- Mọi dòng đều truy vết được: `file_path` + `item_id` + giá trị field thật.

## Bối cảnh dữ liệu

- Phạm vi: **1.282** câu hỏi reading có đáp án (answer-bearing), trong `content/*/reading/*.json`.
- Mỗi câu có: `id`, `teil`, `type` ∈ {multiple_choice, matching, richtig_falsch, ja_nein, matching_ab, detail_extraction}, phần đề (`stem`/`statement`/`situation`), `options` (nếu trắc nghiệm), `answer`, và `explanation.{de, key_evidence, key_vocabulary, vi}`.
- Phân loại nguồn của `explanation.de` (so với commit cha `db63af82d`):
  - **translate-only (rich = 698)**: `de` gốc đã tốt, regen chỉ dịch sang `vi`.
  - **rewritten (templated/thin = 584)**: `de` gốc là khuôn mẫu/quá ngắn → AI **viết lại lập luận tiếng Đức**. Nhóm này **rủi ro cao hơn** → được oversample trong mẫu.

## Các file trong gói

| File | Nội dung |
| --- | --- |
| `README.md` | Tài liệu này — hướng dẫn + phương pháp + ngưỡng. |
| `rubric.md` | Tiêu chí pass/fail 4 chiều cho từng item. |
| `sample-review.csv` | Mẫu phân tầng (toàn bộ item bị cờ + lõi đại diện), **cột verdict TRỐNG** — bảng làm việc của người duyệt. |
| `full-traceability.csv` | Toàn bộ 1.282 item + `prescreen_flags` (truy vết đầy đủ). |
| `prescreen-summary.md` | Số cờ theo loại + danh sách item bị cờ HARD. |
| `signoff.md` | Sheet ký duyệt: người duyệt, ngày, pass-rate theo tầng, verdict tổng, quy tắc ngưỡng. |

## Phương pháp pre-screen (Layer A — máy, khách quan)

Quét toàn bộ 1.282 item, gắn cờ khi có tín hiệu KHÁCH QUAN. **Không** đánh giá chất lượng tiếng Đức.

**HARD flags** (lỗi cấu trúc cụ thể → bắt buộc duyệt, ép hết vào mẫu):
- `no_key_evidence` — thiếu field `key_evidence`.
- `de_template_residue` — `de` còn khuôn "Die richtige Antwort ist…".
- `de_too_thin` — `de` < 15 ký tự.
- `vi_boilerplate_or_empty` — `vi` rỗng hoặc còn đuôi boilerplate cũ ("Hãy đối chiếu với thông tin then chốt…").
- `vi_no_answer_ref` — `vi` không nhắc đáp án / "Đáp án" / phương án nào.
- `mojibake` — ký tự thay thế / chuỗi mojibake trong `de` hoặc `vi`.

**SOFT flags** (heuristic → oversample, không ép toàn bộ):
- `de_low_evidence_overlap` — `de` chia sẻ < 50% token nội dung của `key_evidence` (dung sai diễn giải lại, không bắt trích nguyên văn).
- `de_len_anomaly` / `vi_len_anomaly` — độ dài < 40% trung vị cùng level (outlier đáng liếc qua).

> Kết quả lần chạy này: **0 HARD flag** (cấu trúc regen sạch), 178 item dính SOFT flag. Chi tiết ở `prescreen-summary.md`.

## Phương pháp chọn mẫu (Layer B — tái lập được)

- **Seed:** `fuxie-explanation-review-2026-06`. Thứ tự chọn = `md5(seed + "|" + file#index)` (hash ổn định, không dùng RNG ngẫu nhiên → chạy lại cho kết quả y hệt).
- **Phân tầng:** level (a1–c2) × type (6 loại) — đảm bảo mỗi tầng có mặt ≥ 1.
- **Cấu trúc mẫu (cột `selection_reason`):**
  1. `flagged` — **bắt buộc**: TẤT CẢ item dính cờ pre-screen (hard + soft) đều vào mẫu.
  2. `stratified` — lõi đại diện: oversample `rewritten` (≥ 60), oversample C1/C2 (≥ 30), phủ mỗi tầng (level×type) ≥ 1, và thêm item **không-cờ** đến khi đạt ≥ 72 (đường nền để ước lượng pass-rate không thiên lệch).
- **Kích thước mẫu:** không cố định 150–180 như ước tính ban đầu — vì 178 item chạm cờ pre-screen (đều bắt buộc duyệt), mẫu lần này = **~250 item**. Đây là hệ quả trung thực của số cờ, không phải cap nhân tạo.

> Lưu ý thống kê: pass-rate dùng cho ngưỡng nên tính trên **toàn mẫu**; nếu muốn ước lượng baseline không thiên lệch cho cả 1.282 item, lọc `selection_reason = stratified` (đặc biệt nhóm không-cờ) để xem riêng. Item `flagged` là nhóm rủi-ro-cao đã chủ đích gom lại để soi kỹ.

## Ngưỡng chấp nhận (người duyệt chốt cuối)

Tính trên **mẫu** đã duyệt:
- **approve**: pass-rate ≥ 99% **và** 0 lỗi P0/P1 (dạy sai đáp án / sai ngữ pháp Đức).
- **approve-with-fixes**: pass-rate 95–99%, chỉ lỗi nhỏ (P2), 0 P0/P1.
- **reject**: pass-rate < 95% **hoặc** có ≥ 1 lỗi P0.

> Bất kỳ lỗi "dạy sai đáp án" hoặc "sai ngữ pháp Đức" (P0/P1) trong mẫu → coi như **batch chưa đạt**: mở fix-spec và **mở rộng mẫu** ở tầng liên quan.

## Cách duyệt (quy trình cho reviewer)

1. Mở `sample-review.csv` (UTF-8). Mỗi dòng đọc: `prompt`, `answer`, `key_evidence`, `de`, `vi`.
2. Áp `rubric.md` cho 4 chiều. Điền `verdict` ∈ {pass, fix, fail}, `error_dimension` ∈ {German, pedagogy, CEFR, VN}, và `note`.
3. Ưu tiên các dòng có `prescreen_flags`, `selection_reason=flagged`, và `de_class=rewritten`.
4. Khi xong: điền `signoff.md` (pass-rate theo tầng + verdict tổng) và ký tên + ngày.

## Tái chạy gói

```
node_modules\.bin\tsx.cmd scripts\build-explanation-review-pack.ts
```
READ-ONLY với `content/`; chỉ ghi vào thư mục này. Chạy lại cho kết quả tái lập (cùng seed).
