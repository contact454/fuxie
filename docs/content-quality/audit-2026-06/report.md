# Content Quality Audit — Báo cáo điều hành (audit-2026-06)

Vai chinh: Content QA / Linguistic Reviewer · Vai phoi hop: German Academic Lead, German Curriculum Designer, Vietnamese-German Localization Specialist, Exam Prep Specialist

> **Read-only**: không file nào dưới `content/` bị sửa. Đây là đợt audit, không phải remediation.

## 1. Tóm tắt (VI)

- **Phạm vi:** 1194 file JSON (1188 skill + 6 course.json), 13462 Content_Item item-level, 6 level × 6 skill.
- **Layer 1 (tự động, reuse-only):** `qa:content` 0 lỗi/1193 file; `check:locale-parity` PASS (vi=929⇄de=929); `qa:copy-style` 1 error+1148 warnings **nhưng toàn bộ thuộc UI layer (`apps/web`), 0 chạm `content/`**; `qa:learning-quality` OK (transcript source ready 0/268).
- **Layer 2 (auto scan content + review):** đã chạy auto pass machine-checkable (D1/D5/D6/D7) + **D3 sư phạm** (100% trường đáp án) + **D8 hợp lệ đề thi** (0 finding) + **D4 dịch Việt** (proxy 10,461 word, 0 mojibake, 2 finding P2) + **D2 CEFR fit** (proxy grammar-floor 534 file, 0 violation). Còn lại review thủ công: D2 level-fit sâu, D4 naturalness, D7 transcript khớp script, D8 blueprint sâu.
- **Findings:** tổng **35** (cập nhật sau Layer 2 D3+D8+D4). Theo severity: P1=23, P0=3, P2=9. Theo dimension: D6=24, D3=6, D1=3, D4=2.
- **Trạng thái remediation:** ✅ RB-P0-01 (Genus `FEMINUM`) RESOLVED · ✅ RB-P1-01 (`PHRASE` enum) RESOLVED · ✅ RB-P2-02 (reading explanation, 1,282 item) RESOLVED · 🟡 RB-P2-01 (schema drift) ACCEPTED/DEFERRED (migration lớn, để spec riêng).

### Phát hiện nổi bật

1. **P0 ✅ RESOLVED — Genus enum sai `FEMINUM` (3 trường hợp, a2/vocabulary):** `Temperatur`, `Wolke`, `Jahreszeit` có `article="FEMINUM"`. Đã sửa → `FEMININ` qua spec `content-genus-enum-fix`.
2. **P1 ✅ RESOLVED — `wordType="PHRASE"` (23 trường hợp, c1/c2):** Root cause = TS enum desync (Prisma DB + content đã có `PHRASE`, chỉ `WORD_TYPES` TS lạc hậu). Đã thêm `PHRASE` vào enum qua spec `vocab-wordtype-enum-reconcile`.
3. **P2 ✅ RESOLVED — Reading `explanation.vi` boilerplate (6 cluster, 1,282 item):** 100% giải thích tiếng Việt của reading questions ở cả 6 level đã được thay bằng giải thích cụ thể grounded theo `key_evidence` + đáp án thật của từng item (spec `reading-explanation-regeneration`). 0 boilerplate còn lại; đáp án bất biến; qa:content xanh; 18/18 PBT xanh.
4. **P2 — Schema field-naming drift:** camelCase vs snake_case + speaking field drift. Ghi nhận, không migrate đợt này.
5. **Answer integrity sạch:** 0 distractor trùng, 0 option rỗng, 0 đáp án thiếu/không resolve trên 2,680 câu hỏi reading+listening có đáp án.
6. **Audio:** 268/268 `audio_file` tồn tại (0 mồ côi). `transcript source ready 0/268` — tín hiệu D7 cần review thủ công.
7. **D8 hợp lệ đề thi (lớp machine-checkable):** 0 finding — examTypes hợp lệ (GOETHE/TELC/OESD + DTZ@B1 + GDS@C2 đặt đúng level), Teil liên tục, `points` đầy đủ. Blueprint fidelity sâu (timing, số item vs đặc tả chính thức) còn chờ Exam Prep Specialist.
8. **D4 dịch tiếng Việt (proxy auto, 10,461 word):** 0 mojibake trong content (xác nhận lỗi mojibake Layer 1 chỉ thuộc UI). 2 finding P2 thực: `Brasilien→"Brazil"`, `Kohlenhydrat→"carbohydrate"` (chưa dịch sang Việt). Đã **loại false positive** có kỷ luật: 1,224 "term-inconsistency" (đa nghĩa + thứ tự synonym), 5 "german-leak" (trích dẫn học thuật Husserl/Popper hợp lệ), loanword vi==en (Euro/Internet/Taxi). Naturalness/accuracy sâu chờ Localization Specialist (mẫu 12 file).
9. **D2 CEFR fit (proxy grammar-floor, 534 file):** 0 violation — mọi `target_grammar` ở/dưới level khai báo. Nội dung được level đúng trên trục ngữ pháp. Logic proxy đã sanity-test (fire đúng trên ca giả lập Konjunktiv II@A1 / Passiv@A2). Level-fit sâu (độ dài text, độ khó từ vựng) chờ German Academic Lead (mẫu 24 file).

## 2. Heatmap mật độ lỗi (level × skill)

Số finding (auto pass) theo ô. Ô trống = 0.

| Level | grammar | listening | reading | speaking | vocabulary | writing |
|---|---|---|---|---|---|---|
| a1 |  |  | 1 |  | 1 |  |
| a2 |  |  | 1 |  | 5 |  |
| b1 |  |  | 1 |  |  |  |
| b2 |  |  | 1 |  | 1 |  |
| c1 |  |  | 1 |  | 7 |  |
| c2 |  |  | 1 |  | 14 |  |

(Reading ⚑1 mỗi level = cluster finding D3; vocabulary = D1/D6 enum + D4 dịch (a1, b2 mỗi ô +1 D4). Heatmap cập nhật khi Layer 2 thủ công D2/D7 hoàn tất.)

## 3. Giới hạn & phương pháp

- Layer 1 gate hiện có **không phủ** Genus, CEFR fit, đáp án đúng/sai ngữ nghĩa, dịch nghĩa, mojibake-in-content, field parity-in-content. Auto pass Layer 2 (`tmp/content-audit.mjs`) bù các chiều machine-checkable (D1 enum/Genus, D5 required field, D6 integrity, D7 audio existence).
- Các chiều phán đoán ngữ nghĩa (D2, D3 distractor/giải thích, D4 chất lượng dịch, D7 transcript khớp script, D8 exam format) cần review thủ công của vai phối hợp — đánh dấu **pending review** trong coverage matrix, sẽ bổ sung findings ở vòng review tiếp theo.
- Mọi finding evidence-gated: có `file_path` + `item_id` + trích dẫn verbatim.

## 4. Đề xuất bước kế tiếp (next step)

1. ✅ **P0 Genus `FEMINUM`** — đã fix (spec `content-genus-enum-fix`).
2. ✅ **P1 `PHRASE` enum** — đã fix (spec `vocab-wordtype-enum-reconcile`).
3. **RB-P2-02 reading explanation boilerplate (1,282 item):** mở fix-spec sinh lại `explanation.vi` cụ thể cho reading — Owner German Content Writer + Localization Specialist. Khối lượng lớn, P2, nên là spec riêng.
4. **Layer 2 thủ công còn lại (cần phán đoán người):** D2 level-fit sâu (Academic Lead), D3 review ngữ nghĩa đáp án/distractor (mẫu 24 file `tmp/d3-manual-sample.json`), D4 naturalness/accuracy (mẫu 12 file), D7 transcript khớp script, D8 blueprint fidelity (Exam Prep Specialist), D1 proofreading sâu. Lớp machine-checkable của cả 9 chiều đã hoàn tất.
5. Giữ `findings.csv` + `remediation-backlog.md` làm nguồn cho các fix-spec follow-up.
