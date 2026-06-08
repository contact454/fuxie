# DRAFT stem rewrites (Kiro-agent) — CHỜ Academic sign-off

Spec: `content-cefr-stem-regeneration` · Task 2 draft (KHÔNG áp vào content).

Vai chinh: German Content Writer (draft = Kiro-agent) · Vai phoi hop: German Academic Lead

> ⚠️ **DRAFT — chưa áp, chưa duyệt.** `cefr-stem-draft-patch.json` chứa 9 stem viết lại + 1 fix evidence + 1 textFix cho 2 file C2 (`C2-T1-001`, `C2-T1-002`). Đây là bản nháp do Kiro-agent đề xuất, **PHẢI được German Academic Lead duyệt** trước khi áp bằng `scripts/regenerate-cefr-stems.ts --patch ...`. Kiro-agent KHÔNG phải người rành tiếng Đức được chứng nhận.

## Stem nháp (khớp đáp án có sẵn)

| Item | Đáp án | Stem nháp |
| --- | --- | --- |
| 001 Q4 | c | Was fordert Hart hinsichtlich des Verhältnisses von Recht und Moral? |
| 001 Q5 | b | Wodurch versucht Dworkin, den Gegensatz zwischen Positivismus und Naturrecht zu überwinden? |
| 001 Q6 | c | Mit welcher mythologischen Figur bezeichnet Dworkin den idealen Richter? |
| 001 Q7 | c | Welche historische Erfahrung verlieh der Debatte eine existenzielle Dimension? |
| 001 Q8 | b | Warum hält Hart die begriffliche Trennung von Recht und Moral für wichtig? |
| 002 Q1 | b | Als was fungiert die Ironie im Werk Thomas Manns? |
| 002 Q2 | b | Wodurch manifestiert sich die Ironie in den Buddenbrooks? |
| 002 Q4 | b | Worin enden die Debatten zwischen Settembrini und Naphta? |
| 002 Q10 | b | Was bot die Ironie in einer ideologisch polarisierten Zeit? |
| 001 Q3 | b | (stem + fix evidence trích đúng câu Radbruch — xem patch) |

## Kết quả dry-run (đã verify, KHÔNG ghi content)

`tsx scripts/regenerate-cefr-stems.ts --patch cefr-stem-draft-patch.json --dry-run`:
- **Đủ 13 thay đổi áp sạch, 0 lỗi** (sau khi nâng tool): Q3 stem+key_evidence+de, Q4–Q8 stem (001); Q1 stem+textFix(x4), Q2/Q4/Q10 stem (002).
- answer/options **bất biến** (assert qua); content/ **KHÔNG đổi** (dry-run).

## Tool follow-up (Task 1 mở rộng — ĐÃ LÀM)
- ✅ `regenerate-cefr-stems.ts`: đã thêm **thay-theo-question-scope** cho `stem`/`key_evidence`/`explanation.de` (tránh "not unique") + **`textFix.all`** (replace mọi occurrence cùng lỗi).
- ✅ Dry-run lại đủ **13 thay đổi áp sạch, 0 lỗi** (Q3 stem+evidence+de, Q4–Q8 stem, Q1 stem+textFix x4, Q2/Q4/Q10 stem); answer/options bất biến; content/ KHÔNG đổi.
- ✅ PBT `tests/content-audit` 243/243 pass (+3 test question-scope/textFix.all).
- Sau khi Academic duyệt stem → bỏ `--dry-run` để áp 2 file này, rồi mở rộng ra ~108 câu theo batch (spec tasks 2.1–2.3).

## Trạng thái
- content/ **không đổi** (dry-run). Đây là bản nháp + bằng chứng quy trình áp an toàn, chờ người duyệt.
