# Parity Audit Process — cách dùng cây tiêu chí

Date: 2026-07-01 · Biến `duolingo-criteria-tree.md` thành cơ chế chấm định kỳ. Rubric/skill trỏ về đây.

## Nguyên tắc
- **Chỉ chấm {UI}** để gate merge/nhân rộng. **{PROD}** ghi vào Product Gap Register, không chặn UI.
- Mỗi lá phải có **bằng chứng** (screenshot/số đo/clip), không chấm bằng cảm giác.
- **1 MUST {UI} ❌ = REJECT** → sinh fix ticket với đúng target trong cây.

## Cadence (khi nào chấm)
1. **Per-ticket mini-audit:** sau mỗi ticket Antigravity/Codex, chấm các lá liên quan tới màn vừa đụng.
2. **Slice audit:** cuối mỗi slice, chấm full các lá {UI} cho các surface của slice → điền scorecard rubric.
3. **Platform audit:** trước khi launch / theo mốc, chấm toàn bộ surface (bảng scorecard toàn nền tảng).

## Phân vai
- **Antigravity** (thu bằng chứng khi làm ticket):
  - Chụp **đủ state**: default + selected + correct + wrong + feedback footer + empty/error/loading (qua fixture=visual-qa, lưu vào qa-runs).
  - Xuất **số đo** cho các lá numeric (xem "Measurement kit") — dạng JSON/log kèm handoff.
  - Chạy `design:accessibility-review`/axe trên DOM thật cho nhánh 8.
- **Claude** (chấm + gate):
  - Đọc bằng chứng, điền ✅/⚠️/❌ cho từng lá {UI}, tính MUST-pass.
  - Sinh fix ticket cho lá ❌ (kèm target từ cây). Ghi gap {PROD} vào register.
  - Trình scorecard + screenshot cho chủ dự án.
- **Chủ dự án:** ký Gate A (cảm nhận) trên bằng chứng đã trình; quyết các gap {PROD}.

## Measurement kit (đo lá thế nào)
| Loại lá | Ví dụ | Cách đo |
|---|---|---|
| Numeric CSS | 1.3.1 gờ ≥3–4px, 1.3.2 nút ≥48px, 1.1.4 chữ ≥22px | Đọc computed style trên DOM (devtools/script Playwright), log px/weight |
| Contrast/a11y | 8.2 contrast, 8.1 touch, 8.3 focus, 8.4 label | `design:accessibility-review` / axe trên live DOM |
| Trạng thái/feedback | 2.2 states, 2.3 footer | Screenshot từng state (selected/correct/wrong) |
| Motion | 1.3.3 lún, 2.4 tap, 3.* mascot | Clip ngắn hoặc kiểm transition token + quan sát |
| Hiện diện/bố cục | 1.2.1 một primary, 5.1 world-first, 8.6 ngôn ngữ UI | Screenshot + rà code |
| {PROD} | 4.* gamification, 7.* SRS | Xác nhận có/không ở tầng sản phẩm → register |

Gợi ý tự động hoá: thêm vào `check:quick` vài assert regression (vd primary-cta min-height, một-primary-color, reward-amber containment đã có) để lá numeric không tụt lại sau này.

## Cổng chốt (gate)
- Slice/màn **PASS** khi **mọi MUST {UI} = ✅**. ⚠️ phải fix hoặc có waiver ghi lý do. ❌ = REJECT.
- PASS {UI} → đủ điều kiện nhân rộng. Gap {PROD} không chặn nhưng phải nằm trong register có chủ.

## Product Gap Register (cho {PROD})
Ghi tại `docs/design/product-gap-register.md`: mỗi dòng = lá {PROD} chưa có, mức ưu tiên, cần backend gì, ai quyết. Rà lại mỗi platform audit.

## Vòng lặp
Audit → REJECT list → fix ticket (Antigravity/Codex, target lấy từ cây) → thu bằng chứng lại → re-audit → PASS → nhân rộng. Lặp cho từng slice/surface.

## Artefact mỗi lần audit
- Scorecard đã điền (trong `duolingo-parity-rubric.md` hoặc bản sao theo ngày).
- Bộ screenshot state (qa-runs).
- Danh sách fix ticket + gap {PROD}.
