# Sign-off Sheet — Reading Explanation Review 2026-06

Vai chinh: Content QA / Linguistic Reviewer
Vai phoi hop: German Academic Lead, Vietnamese-German Localization Specialist, German Curriculum Designer

> Điền sau khi duyệt xong `sample-review.csv`. Verdict tổng quyết định PR #21 (`feat(content): regenerate reading explanations`) có được merge hay không.

## 1. Thông tin đợt duyệt

| Mục | Giá trị |
| --- | --- |
| Commit nội dung | `755326d25` (PR #21, nhánh `chore/content-audit-remediation-2026-06`) |
| Tổng item (full) | 1.282 |
| Kích thước mẫu | _(điền: số dòng `sample-review.csv`)_ |
| Seed mẫu | `fuxie-explanation-review-2026-06` |
| Ngày bắt đầu / kết thúc | _____ / _____ |

## 2. Người duyệt (ký)

| Vai trò | Tên | Ngày | Chữ ký |
| --- | --- | --- | --- |
| German Academic Lead | | | |
| Vietnamese-German Localization Specialist | | | |
| Content QA / Linguistic Reviewer | | | |

## 3. Kết quả theo tầng

> Pass-rate = (#pass) / (#đã duyệt) trong tầng.

| Tầng | #đã duyệt | #pass | #fix | #fail | #P0 | #P1 | Pass-rate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Theo level — a1 | | | | | | | |
| a2 | | | | | | | |
| b1 | | | | | | | |
| b2 | | | | | | | |
| c1 | | | | | | | |
| c2 | | | | | | | |
| Theo nguồn — rewritten | | | | | | | |
| translate-only | | | | | | | |
| Mục dính cờ (selection_reason=flagged) | | | | | | | |
| Lõi đại diện không-cờ (stratified) | | | | | | | |
| **TỔNG MẪU** | | | | | | | |

## 4. Áp ngưỡng

| Điều kiện | Đạt? |
| --- | --- |
| Pass-rate tổng mẫu ≥ 99% | ☐ |
| 0 lỗi P0 (dạy sai đáp án) | ☐ |
| 0 lỗi P1 (sai ngữ pháp Đức) | ☐ |

## 5. Verdict tổng (chọn 1)

- ☐ **APPROVE** — pass-rate ≥ 99% và 0 P0/P1. → Đồng ý merge PR #21.
- ☐ **APPROVE-WITH-FIXES** — pass-rate 95–99%, chỉ P2. → Liệt kê item `fix` vào fix-spec, merge sau khi sửa P2 (hoặc merge kèm follow-up ticket).
- ☐ **REJECT** — pass-rate < 95% hoặc ≥ 1 P0. → KHÔNG merge; mở fix-spec + mở rộng mẫu tầng liên quan.

## 6. Ghi chú & hành động tiếp theo

_(Liệt kê item P0/P1 phát hiện — file_path + item_id + mô tả lỗi; quyết định fix-spec; phạm vi mở rộng mẫu nếu reject.)_

---

_Chuẩn bị bởi Content QA / Linguistic Reviewer. Verdict do người duyệt chốt — máy không tự điền._
