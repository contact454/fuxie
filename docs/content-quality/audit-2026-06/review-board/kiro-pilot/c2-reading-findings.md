# Kiro-agent Review — C2 Reading: lỗi P1 hệ thống (Teil "Kommentar verstehen")

Spec: `fuxie-content-review-board` · Follow-up · Kiro-agent (German Linguist + CEFR/Pedagogy + Red-team).

Vai chinh: Content QA / Linguistic Reviewer · Vai phoi hop: German Academic Lead, AI / LLM Engineer

## 🔴 P0 — 8 bài đọc C2 là NỘI DUNG PLACEHOLDER TRÙNG LẶP (sai chủ đề hoàn toàn)

> **✅ ĐÃ XỬ LÝ (RESOLVED) — spec `content-c2-placeholder-regeneration`.** Cả 8 file C2-T1-005…012 đã được **viết lại hoàn toàn** bằng bài đọc C2 thật, đúng tiêu đề/chủ đề (Multilateralismus, kopernikanische Wende, Adorno-Kulturindustrie, Rawls, CRISPR-Medizinethik, Distant Reading, Säkularisierung, Hard Problem of Consciousness) + 10 câu MC mới/bài. Cổng đóng đã verify: **generic-opener = 0**, **broken-stem = 0** trên 8 file; mọi câu có `answer ∈ options` + `key_evidence` là chuỗi con verbatim của `article.text`; `qa:content` exit 0; `tests/content-audit` 253/253 xanh. C2-T1-001..004 + skill khác **không đổi**. Nội dung do AI (Kiro-agent) soạn — vẫn để ngỏ **human German sign-off** tuỳ chọn. Generator gốc (nhét filler) cần ticket riêng cho AI/LLM Engineer + CTO. Xem `tasks.md` (2.1–2.8 + 3 = [x]).

**C2-T1-005 … C2-T1-012** (8 file) có 8 tiêu đề/chủ đề KHÁC nhau nhưng **dùng CHUNG một bài đọc filler** về "triết học khoa học / Thomas Kuhn / thuyết tương đối nhận thức". Bằng chứng: cả 8 `article.text` đều chứa "Thomas Kuhn" + "erkenntnistheoretische" và dài ~2.26–2.30k ký tự gần y hệt; đều mở đầu bằng khuôn *"Der vorliegende Kommentar widmet sich dem Thema … aus einer kritisch-analytischen Perspektive"*.

| File | title | topic | Bài đọc thực tế |
| --- | --- | --- | --- |
| C2-T1-005 | Der Multilateralismus in der Krise | Internationale Beziehungen | filler Kuhn ❌ |
| C2-T1-006 | Die kopernikanische Wende | Wissenschaftsgeschichte | filler Kuhn (tạm gần) ⚠️ |
| C2-T1-007 | Adornos Kulturindustrie-These | Kulturtheorie | filler Kuhn ❌ |
| C2-T1-008 | Rawls' Theorie der Gerechtigkeit | Wirtschaftsethik | filler Kuhn ❌ |
| C2-T1-009 | CRISPR und die Grenzen des Menschenmöglichen | Medizinethik | filler Kuhn ❌ |
| C2-T1-010 | Distant Reading als Forschungsmethode | Digitale Geisteswissenschaften | filler Kuhn ❌ |
| C2-T1-011 | Säkularisierung und die Rückkehr des Religiösen | Religionswissenschaft | filler Kuhn ❌ |
| C2-T1-012 | Das Hard Problem des Bewusstseins | Kognitionswissenschaft | filler Kuhn ❌ |

→ **Mức P0**: 8 bài học C2 (80 câu hỏi) là nội dung placeholder, KHÔNG dạy đúng chủ đề ghi trên tiêu đề/ảnh. Không thể ship. Khác với C2-T1-001..004 (Rechtsphilosophie/Thomas Mann/Quantenmechanik/Wittgenstein) — 4 bài này là **nội dung thật, riêng biệt, tiếng Đức tốt**. Có vẻ generator sinh 4 bài thật rồi nhét filler cho phần còn lại.

→ **Cần spec riêng (regenerate nội dung 8 bài C2, có thể lan sang teil/level khác)** — quét `article.text` trùng lặp + khuôn opener generic để xác định toàn bộ phạm vi. Đây là lỗi nội dung, không phải lỗi stem.

## ✅ Batch C2-T1-003 / 004 / 005 (Kiro-agent, 30 câu) — đã đánh giá kĩ

- **Đáp án: 30/30 đúng** (red-team tự giải mù, khớp).
- **Tiếng Đức:** C2-T1-003 (Quantenmechanik) + C2-T1-004 (Wittgenstein) viết **tốt, đúng C2, học thuật, không lỗi**. C2-T1-005 ngữ pháp ổn nhưng là **filler sai chủ đề** (xem P0 trên).
- **Stem hỏng:** lan rộng (đa số câu mỗi file) — đã nằm trong worklist.



> Chấm 2 file đầu C2 reading (`C2-T1-001` Rechtsphilosophie, `C2-T1-002` Klassische Literatur — 20 câu MC). **Đáp án 20/20 đúng** (red-team tự giải mù, khớp). NHƯNG phát hiện **lỗi P1 hệ thống** ở câu hỏi + lời giải — `qa:content` và `cefrAudit: aligned/passed` KHÔNG bắt được. → **ESCALATE, KHÔNG advisory-pass.**

## ⚠️ P1-A — Câu hỏi (stem) hỏng do bug ghép template (learner-facing, sai ngữ pháp Đức)

> **✅ ĐÃ XỬ LÝ (RESOLVED) — spec `content-cefr-stem-regeneration`.** Toàn bộ broken-stem ở B2/C1/C2 reading đã được viết lại thành câu hỏi đúng ngữ pháp, khớp đáp án có sẵn (answer/options bất biến — tool assert). Sửa **vượt** phạm vi marker: mọi stem hỏng trong từng file đụng tới (b2: 21 file/77 stem, c1: 9 file/44 stem, c2: 16 file/~95 stem). Kèm 2 fix Evidence_Mismatch (C1-T2-005 Q7, C1-T2-012 Q4 + C2-T1-001 Q3) và textFix lỗi từ Đức (C2-T1-002 "intellectual"→"intellektuellen", C2-T3-012 "rationais"→"rationales"). Cổng đóng: **scan Broken_Stem b2/c1/c2 = 0**; `qa:content` exit 0; `tests/content-audit` 253/253 xanh. Generator gốc → ticket `TICKET-content-generator-filler-rootcause.md`.

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

