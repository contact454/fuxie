# Content Review Board — PILOT (Tier-2 provider THẬT, free-tier)

Spec: `fuxie-content-review-board` · Follow-up · Tier-2 `--provider` runner THẬT.

Vai chinh: AI / LLM Engineer · Vai phoi hop: QA Automation Engineer, German Academic Lead

> ⚠️ **PILOT — tập con giới hạn.** Lần chạy này dùng `--limit 6` nên CHỈ chấm **6** item (KHÔNG phải toàn bộ 1.282). Đây là chạy thử có giới hạn để kiểm chứng đường nối provider thật, không phải audit đầy đủ.

## Provider thật (free-tier, ~$0)

Tier-2 lần này gọi model THẬT qua OpenRouter, **chỉ dùng model `:free`** nên chi phí ~$0.

| Thành phần | Model (free-tier) |
| --- | --- |
| Reviewer board (3 reviewer) | `google/gemma-4-31b-it:free` |
| Red-team (mù đáp án) | `meta-llama/llama-3.3-70b-instruct:free` |
| Model SINH nội dung (để đối chiếu) | `kiro-content-pipeline` |

Reviewer/red-team model **KHÁC** model sinh nội dung (Req 2.2 — ý kiến độc lập). Concurrency tối đa = 1 (gọi tuần tự, backoff luỹ thừa khi 429/5xx).

## Số lần gọi provider + lỗi

| Chỉ số | Giá trị |
| --- | ---: |
| Tổng case (reviewer + red-team) | 24 |
| · reviewer cases | 18 |
| · red-team cases | 6 |
| Tổng lần gọi provider (kể cả retry) | 24 |
| Số lần retry (429/5xx) | 0 |
| Case lỗi → escalate thận trọng | 24 |
| · reviewer lỗi | 18 |
| · red-team lỗi | 6 |

Khi provider lỗi bền (hết retry) hoặc trả output sai schema: reviewer trả `concern` thận trọng, red-team trả output **không hợp lệ** → item luôn **escalate**, KHÔNG bao giờ bịa "pass".

## ⚠️ Khách quan vs advisory (vẫn áp dụng)

1. **Objective (Tier-1, CÓ THẨM QUYỀN, miễn phí).** Cột `objective_verdict` = `PASS|FAIL` từ kiểm tra answer-key/enum/genus deterministic. Đây là tín hiệu THẬT để de-risk PR #21.
2. **Subjective (Tier-2, ADVISORY).** Lần này `subjective_source=provider` → các cột `subjective_label`, `confidence`, `red_flag` là ý kiến **model THẬT** (free-tier). Nhưng vẫn chỉ là **advisory**:

> `Chưa được người rành tiếng Đức duyệt.`

Model thật có thể sai về tiếng Đức. Một item chỉ thực sự "đạt" về chất lượng chủ quan khi **người rành tiếng Đức** duyệt. `advisory-pass (low-assurance)` chỉ là tín hiệu yếu (PASS ∧ confidence=high ∧ ¬red_flag), không phải "approved".

## Kết quả pilot

| Chỉ số | Giá trị |
| --- | ---: |
| Item đã chấm (pilot) | 6 |
| Objective PASS (Tier-1) | 6 |
| Objective FAIL (Tier-1) | 0 |
| advisory-pass (low-assurance) | 0 |
| escalate | 6 |
| red_flag | 6 |
| subjective_source | provider |

### Phân bố theo level

| Level | Items |
| --- | ---: |
| a1 | 6 |

## Các file trong gói pilot

| File | Nội dung |
| --- | --- |
| `per-item.csv` | 6 dòng: `file, item_id, level, type, objective_verdict, tier1_findings, subjective_label, confidence, red_flag, status, subjective_source`. |
| `escalation-queue.csv` | Các item `status=escalate` + `escalation_reason`. |
| `README.md` | Tài liệu này. |

Gói pilot này nằm trong thư mục `pilot-provider/` để **không ghi đè** gói mock một-lượt ở thư mục cha. READ-ONLY với `content/` (hash byte-identical trước/sau).

