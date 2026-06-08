# Content Review Board — One-shot 1.282 Reading Explanation

Spec: `fuxie-content-review-board` · Task 6.1 · Component 6 (one-shot runner).

Vai chinh: AI / LLM Engineer · Vai phoi hop: Content QA / Linguistic Reviewer, German Academic Lead, QA Automation Engineer, DevOps

> Chạy **1 lượt** cổng QA 2 tầng trên toàn bộ **1282** câu hỏi reading có đáp án (answer-bearing) do AI sinh (PR #21). READ-ONLY: KHÔNG sửa `content/`, chỉ đọc và xuất tài liệu vào thư mục này.

## ⚠️ Đọc trước — khách quan vs advisory

Mỗi item mang **HAI nhãn tách biệt** (không bao giờ gộp thành "approved"):

1. **Objective (Tier-1, CÓ THẨM QUYỀN, miễn phí, deterministic).** Cột `objective_verdict` = `PASS|FAIL` dựa trên kiểm tra answer-key/enum/genus chạy thật, offline. Đây là con số đáng tin để de-risk PR #21.
2. **Subjective (Tier-2, ADVISORY, chỉ là GỢI Ý).** Các cột `subjective_label`, `confidence`, `red_flag` đến từ **board mô phỏng (mock)** trừ khi chạy `--provider`. Cột `subjective_source` ghi rõ nguồn.

`Chưa được người rành tiếng Đức duyệt.` — mọi nhãn subjective đều mang ghi chú này. Không item nào được tự gán "approved".

### Vì sao gần như tất cả item đều `escalate`?

Lần chạy này dùng **Tier-2 mock** (mặc định, không tốn credit). Red-team mù mô phỏng **không thật sự tự giải** được câu hỏi nên nó luôn bất đồng một cách thận trọng → `red_flag=true` → `confidence` không thể đạt `high` → **không item nào được `advisory-pass`**. Đây là kết quả **trung thực và cố ý**: máy KHÔNG được tự chứng nhận chất lượng tiếng Đức khi chưa có model/người thật duyệt. Vì vậy:

- Hãy đọc cột **`objective_verdict` (Tier-1)** như tín hiệu THẬT.
- Coi cột subjective là **placeholder** cho tới khi chạy `--provider` hoặc người rành tiếng Đức duyệt.

## Kết quả lần chạy này

| Chỉ số | Giá trị |
| --- | ---: |
| Tổng item (answer-bearing) | 1282 |
| Objective PASS (Tier-1) | 1282 |
| Objective FAIL (Tier-1) | 0 |
| advisory-pass (low-assurance) | 0 |
| escalate (vào hàng đợi) | 1282 |
| red_flag | 1282 |
| subjective_source | mock |
| LanguageTool | không (offline, deterministic) |

### Phân bố theo level

| Level | Items |
| --- | ---: |
| a1 | 150 |
| a2 | 200 |
| b1 | 250 |
| b2 | 250 |
| c1 | 168 |
| c2 | 264 |

### Ghi chú hạ tầng Tier-1

- (không có) — Tier-1 chạy deterministic offline, không cần credit.

## Ước tính chi phí (Req 7.3)

In trước khi gọi provider để chủ sở hữu quyết định tiêu credit:

| Kịch bản | Calls | $/call | Tổng ước tính |
| --- | ---: | ---: | ---: |
| Free-tier / mock (lần chạy này) | 5128 | $0.0000 | $0.0000 |
| Ví dụ provider trả phí | 5128 | $0.0010 | $5.3844 |

Mỗi item tốn 4 call (3 reviewer + 1 red-team). Lần chạy mock = **$0.0000** (không tốn credit).

## Các file trong gói

| File | Nội dung |
| --- | --- |
| `per-item.csv` | 1282 dòng: `file, item_id, level, type, objective_verdict, tier1_findings, subjective_label, confidence, red_flag, status, subjective_source`. |
| `escalation-queue.csv` | Các item `status=escalate` + cột `escalation_reason` để người duyệt ưu tiên. |
| `recall-report.md` | Báo cáo recall của mutation calibration (task 5.1) — **KHÔNG** ghi đè bởi script này. |
| `README.md` | Tài liệu này. |

## Ngưỡng + cách vận hành cổng (gate)

**Quy tắc status (Component 4 / Req 5.4–5.5):**

- `advisory-pass (low-assurance)` ⟺ `objective=PASS` ∧ `confidence=high` ∧ `red_flag=false`. Vẫn kèm "chưa người duyệt".
- ngược lại ⟹ `escalate` (vào `escalation-queue.csv`).

**Cách dùng kết quả:**

1. **Ưu tiên P0** mọi dòng `objective_verdict=FAIL` — đây là lỗi answer-key/enum/genus deterministic, gần như chắc chắn là lỗi thật cần sửa.
2. Mở `escalation-queue.csv`, đọc `escalation_reason`; lọc `objective=FAIL` trước, rồi tới `red_flag` (khi đã chạy provider thật).
3. Người rành tiếng Đức duyệt phần subjective; chỉ khi đó mới có "duyệt" theo chất lượng chủ quan.
4. `item_id` + `file` truy vết ngược về `content/*/reading/*.json` và khớp với `explanation-review/full-traceability.csv` (cùng `item_id`).

## Tái chạy

```
node_modules\.bin\tsx.cmd scripts\content-review-board-run.ts --dry-run   # in cost, không ghi
node_modules\.bin\tsx.cmd scripts\content-review-board-run.ts             # chạy mock, ghi gói này
```

READ-ONLY với `content/` (hash byte-identical trước/sau). `--provider` được để dành làm điểm nối Tier-2 thật và **không** được kích hoạt trong script một-lượt này để bảo vệ credit.

