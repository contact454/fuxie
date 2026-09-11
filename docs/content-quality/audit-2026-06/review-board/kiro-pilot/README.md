# Content Review Board — PILOT do Kiro-agent chấm trực tiếp (không qua API)

Spec: `fuxie-content-review-board` · Follow-up · Tier-2 reviewer = **chính model trên Kiro** (không gọi provider ngoài).

Vai chinh: AI / LLM Engineer · Vai phoi hop: Content QA / Linguistic Reviewer, German Academic Lead, Vietnamese-German Localization Specialist

> ⚠️ **PILOT — tập con 35 item** (7 file A1 reading × 5 câu: A1-T1-002..008). Đây là chạy thử để chứng minh giá trị review thật, KHÔNG phải audit đầy đủ 1.282.

## Cách chạy (quan trọng)

Thay vì gọi model free-tier qua OpenRouter (đã chứng minh wiring chạy được nhưng dính rate-limit nặng), lượt này **Kiro-agent đóng vai 4 reviewer + red-team và tự chấm** từng item:

- **German Linguist / CEFR-Pedagogy / VN Localization**: đọc trực tiếp `explanation.de`, `key_evidence`, `explanation.vi`, đáp án, đoạn văn → chấm từng chiều.
- **Red-team mù đáp án**: tự giải từng câu **dựa trên đoạn văn nhưng KHÔNG nhìn `answer`/`explanation`**, rồi đối chiếu với đáp án lưu. Lệch = `red_flag`.
- Model chấm (Kiro-agent) **khác** model free-tier đã sinh nội dung → đúng tinh thần "ý kiến độc lập" (Req 2.2).

> ⚠️ Đây vẫn là **AI-advisory**. Kiro-agent là model mạnh nhưng **không phải người rành tiếng Đức được chứng nhận** → kết quả vẫn **"chưa được người rành tiếng Đức duyệt"**, chưa phải chứng nhận production.

## Kết quả (20 item)

| Chỉ số | Giá trị |
| --- | ---: |
| Tổng item | 35 |
| Objective PASS (Tier-1) | 35 |
| Objective FAIL | 0 |
| Đáp án đúng (red-team đối chiếu) | 35/35 |
| red_flag (dạy sai đáp án) | 0 |
| advisory-pass (low-assurance) | 32 |
| escalate | 3 |

### 3 item escalate (lỗi P2 — nhỏ, KHÔNG sai đáp án)

Cả 3 cùng một loại: `explanation.de` **trích dẫn không nguyên văn** đoạn trong bài (đáp án vẫn đúng):

- `A1-T1-004.json` Q5 — trích "Ich brauche Hilfe." thiếu "mit den Wörtern".
- `A1-T1-005.json` Q4 — trích "einen Balkon" bỏ "schönen".
- `A1-T1-005.json` Q5 — trích "dritter Stock" thay vì đúng dạng "im dritten Stock".

→ Đề xuất: chỉnh `explanation.de` trích **đúng nguyên văn** đoạn dẫn. Không ảnh hưởng tính đúng của đáp án.

## Finding cấp batch (style — P3, không chặn)

`explanation.vi` ở cả 20 item theo đúng một khuôn: *"Đáp án: X. Nhận định: „...". Bằng chứng trong bài: „...". Đối chiếu nhận định với đoạn này trong bài để thấy vì sao."* — **chính xác và item-specific** (có dẫn nhận định + bằng chứng cụ thể, KHÔNG còn là boilerplate cũ), nhưng câu đóng *"Đối chiếu nhận định... để thấy vì sao"* là **filler chung**, không thật sự giải thích. Đề xuất một lượt biên tập style (Localization Specialist) cho phần kết tự nhiên + giải thích hơn. Đây là vấn đề hệ thống cấp batch, nên xử lý 1 lần, không phải lỗi từng item.

## Finding về thiết kế red-team (cho spec)

Với reading comprehension (richtig_falsch), red-team **cần đoạn văn** để tự giải. `buildRedTeamPayload` hiện chỉ truyền `stem + options` (không có đoạn văn) → red-team tự động YẾU cho reading (không thể quyết đúng/sai nếu thiếu bài đọc). Lượt Kiro-agent này giải có đoạn văn nhưng vẫn mù `answer`/`explanation` — đúng cách cho reading. **Đề xuất cập nhật spec**: với skill reading, payload red-team nên gồm đoạn văn liên kết + câu hỏi, chỉ ẩn `answer`/`explanation`.

## Nhãn objective vs subjective

- **Objective (Tier-1, có thẩm quyền, miễn phí):** cột `objective_verdict`. Cả 20 = PASS.
- **Subjective (Kiro-agent advisory):** `german`, `cefr`, `vn`, `consensus`, `confidence`, `status`. `subjective_source=kiro-agent`. **Chưa được người rành tiếng Đức duyệt.**
- Không gộp thành "approved". `advisory-pass (low-assurance)` chỉ là gợi ý độ tin thấp khi PASS ∧ confidence cao ∧ không red_flag.

## File

| File | Nội dung |
| --- | --- |
| `per-item.csv` | 20 dòng review chi tiết (mỗi chiều + red-team + note). |
| `README.md` | Tài liệu này. |

## Đề xuất bước kế tiếp

1. **Nhân rộng** cách Kiro-agent chấm cho thêm item (mỗi lượt một batch nhỏ để không tràn context) — cho kết quả advisory thật, miễn phí, không rate-limit.
2. Mở **fix nhỏ** cho 3 item P2 (trích nguyên văn `explanation.de`) — gom vào một spec sửa nhẹ.
3. **Style pass** cấp batch cho phần kết `explanation.vi` (Localization Specialist).
4. Vẫn cần **người rành tiếng Đức** ký duyệt cuối trước khi coi là đạt chất lượng production.
