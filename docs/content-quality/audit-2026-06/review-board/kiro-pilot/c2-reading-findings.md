# Kiro-agent Review — C2 Reading: lỗi P1 hệ thống (Teil "Kommentar verstehen")

Spec: `fuxie-content-review-board` · Follow-up · Kiro-agent (German Linguist + CEFR/Pedagogy + Red-team).

Vai chinh: Content QA / Linguistic Reviewer · Vai phoi hop: German Academic Lead, AI / LLM Engineer

> Chấm 2 file đầu C2 reading (`C2-T1-001` Rechtsphilosophie, `C2-T1-002` Klassische Literatur — 20 câu MC). **Đáp án 20/20 đúng** (red-team tự giải mù, khớp). NHƯNG phát hiện **lỗi P1 hệ thống** ở câu hỏi + lời giải — `qa:content` và `cefrAudit: aligned/passed` KHÔNG bắt được. → **ESCALATE, KHÔNG advisory-pass.**

## ⚠️ P1-A — Câu hỏi (stem) hỏng do bug ghép template (learner-facing, sai ngữ pháp Đức)

Nhiều `stem` là **chuỗi template generic + mảnh câu hỏi thật bị nối ẩu** → vừa sai ngữ pháp vừa lệch ý so với đáp án. Ví dụ:

- `C2-T1-001` Q4: *"Welche epistemologische Position vertritt der Autor bezüglich **fordert Hart bezüglich** Recht und Moral?"* — hai động từ "vertritt…fordert" dính nhau, vô nghĩa.
- `C2-T1-001` Q8: *"Was lässt sich aus der kritischen Betrachtung von **Warum hält Hart die Trennung von** für die Gesamtthese ableiten?"* — cụt "Trennung von für".
- `C2-T1-001` Q5/Q6/Q7: khung *"Inwiefern widersprechen sich die Ausführungen zu … mit der Gesamtthese?"* nhưng đáp án chỉ là **nhớ chi tiết** (Herkules / Nationalsozialismus) → khung hỏi "mâu thuẫn với luận đề" KHÔNG khớp loại đáp án.
- `C2-T1-002` Q2: *"Welche methodologische Implikation hat die Analyse von **sich die Ironie in den Buddenbrooks**?"* — "Analyse von sich die Ironie" hỏng.
- `C2-T1-002` Q4/Q5/Q8/Q10: cùng kiểu nối ẩu ("…von Worauf bleibt unausgesprochen", "…zu Haltung drückt Manns Ironie aus bleibt unausgesprochen").

→ Đây là **bug generator** (ghép frame câu hỏi + sub-prompt thô), nhiều khả năng lan ra **toàn bộ C2/C1 reading Teil "Kommentar verstehen"**. Mức **P1**: học viên đọc câu hỏi sai ngữ pháp + lệch ý. Cần regenerate stem (không auto-fix được — phải sinh lại + người duyệt).

## ⚠️ P1-B — Từ tiếng Anh lẫn trong text tiếng Đức

`C2-T1-002` article.text: *"Die **intellectual** Debatten zwischen Settembrini und Naphta…"* → phải là **"intellektuellen"**. Lỗi từ vựng/chính tả Đức ngay trong bài đọc nguồn. (LanguageTool sẽ bắt nếu chạy; đây là bằng chứng giá trị của Tier-1 LT.)

## ⚠️ P1-C — Lời giải dẫn bằng chứng SAI (dù đáp án đúng)

`C2-T1-001` Q3 hỏi về diễn biến tư tưởng của Radbruch (đáp án b "vom Positivisten zum Kritiker" — đúng). Nhưng `key_evidence` + `de` lại trích **câu về Kelsen** ("Während der Rechtspositivismus in der Tradition Hans Kelsens…"), KHÔNG phải câu chứng minh ("Radbruch, selbst einst ein überzeugter Positivist, vollzog… eine intellektuelle Kehrtwende"). → Lời giải **không justify đáp án**. Mức P1 sư phạm.

## P2 — key_evidence cắt cụt + lời giải khuôn

Mọi `key_evidence`/`de` bị cắt cứng giữa từ ("…des…", "…m…", "…gerech…") và `de` chỉ là khuôn *"Die Textstelle „…" belegt die richtige Antwort (X)."* — đúng nhưng không thật sự giải thích. `reasoning` chỉ "ergibt sich aus dem Textkontext" (rỗng). Style P2/P3.

## Nhãn

| File | Đáp án (red-team) | German | Pedagogy/CEFR | Verdict |
| --- | --- | --- | --- | --- |
| C2-T1-001 (10 câu) | 10/10 đúng, redFlag=false | **FAIL** (stem hỏng P1) | concern (Q3 evidence sai, key_evidence cụt) | **escalate** |
| C2-T1-002 (10 câu) | 10/10 đúng, redFlag=false | **FAIL** (stem hỏng P1 + "intellectual" P1) | concern | **escalate** |

Objective (Tier-1 answer-key) vẫn PASS (đáp án trỏ option hợp lệ) — nhưng **subjective FAIL**: đây đúng là loại lỗi chỉ review (LT + reviewer) bắt được, không phải answer-key check.

## Đề xuất bước kế tiếp

1. **KHẨN: quét toàn bộ C1/C2 reading** (heuristic: stem chứa 2 cụm nghi vấn, hoặc khớp các frame "Inwiefern widersprechen sich… mit der Gesamtthese" / "Welche epistemologische Position vertritt der Autor bezüglich …" + mảnh nối). Em có thể viết scan READ-ONLY.
2. **Mở spec regenerate stem C1/C2 reading** (German Content Writer + Academic Lead) — đây là lỗi nội dung thật, không vá tay từng câu được.
3. Chạy **Tier-1 LanguageTool** trên text reading để bắt các lỗi như "intellectual".
4. Sửa P1-C (Q3 evidence) trong đợt regenerate.

> Không auto-sửa: stem hỏng cần sinh lại có người duyệt; vượt phạm vi auto-edit an toàn.

## 📊 Quy mô lan rộng (quét READ-ONLY toàn bộ 1.282 câu reading)

Heuristic high-precision (stem chứa marker ghép-template: "bezüglich <động từ>", "von Warum/Worin/Worauf", "Ausführungen zu … mit der Gesamtthese", nối đôi "über … über …"):

| Level | Câu hỏng / tổng |
| --- | --- |
| a1 | 0 / 150 |
| a2 | 0 / 200 |
| b1 | 0 / 250 |
| b2 | **11** / 250 |
| c1 | **12** / 168 |
| c2 | **70** / 264 |
| **Tổng** | **93 / 1.282 (7.3%)** |

→ Lỗi tập trung 100% ở **B2/C1/C2** (Teil "Kommentar verstehen") — đúng giả thuyết bug generator ở pipeline sinh câu hỏi trình độ cao. A1/A2/B1 sạch. Đây là con số THẬT để mở spec regenerate có phạm vi rõ ràng (93 câu / ~ nhiều file B2-C2).

