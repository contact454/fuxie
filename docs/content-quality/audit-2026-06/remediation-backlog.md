# Remediation Backlog — Content Quality Audit (audit-2026-06)

Backlog ưu tiên theo severity. Mỗi nhóm là một **candidate fix-spec** về sau. Đợt audit này KHÔNG sửa nội dung.

## RB-P0-01 — [P0] ✅ RESOLVED — Sửa Genus enum sai `FEMINUM` → `FEMININ`

- **Trạng thái:** RESOLVED (spec `content-genus-enum-fix`, 2026-06).
- **Phạm vi:** 3 entry a2/vocabulary (Temperatur, Wolke, Jahreszeit) trong `content/a2/vocabulary/20-wetter-klima.json`.
- **Findings (3):** F-0003, F-0004, F-0005 — đã sửa `"article": "FEMINUM"` → `"article": "FEMININ"`.
- **Verify:** `content/**` còn 0 occurrence `FEMINUM`; `qa:content` exit 0 (0 lỗi); JSON hợp lệ.
- **Genus sign-off:** German Academic Lead xác nhận cả 3 là giống cái thực (die Temperatur, die Wolke, die Jahreszeit).
- **Owner:** German Academic Lead + Content QA

## RB-P1-01 — [P1] ✅ RESOLVED — Giải quyết `wordType="PHRASE"` ngoài enum chuẩn

- **Trạng thái:** RESOLVED (spec `vocab-wordtype-enum-reconcile`, 2026-06).
- **Root cause:** TS enum desync — Prisma DB enum `WordType` (schema.prisma:75) ĐÃ có `PHRASE`, `scripts/fix-c2-vocab-quality.ts` coi `PHRASE` hợp lệ, 23 content entry dùng `PHRASE`; chỉ `WORD_TYPES` (TS) lạc hậu, thiếu `PHRASE` → `WordTypeSchema` có thể reject data hợp lệ.
- **Fix:** Thêm `'PHRASE'` vào `WORD_TYPES` (`packages/shared/src/types/index.ts`) — căn TS theo DB. KHÔNG đổi content data, KHÔNG migration DB.
- **Phạm vi:** 23 entry c1/c2 vocabulary (+2 a2 occurrence). Type-layer fix, 1 file.
- **Findings (23):** F-0001, F-0002, F-0006, F-0007, F-0008, F-0009, F-0010, F-0011, F-0012, F-0013, F-0014, F-0015, F-0016, F-0017, F-0018, F-0019, F-0020, F-0021, F-0022, F-0023, F-0024, F-0025, F-0026 — đã giải quyết.
- **Verify:** Enum_Parity TS⟷DB = true (11=11 gồm PHRASE); mọi content wordType `safeParse` OK; `pnpm qa:content` exit 0; shared `tsc --noEmit` exit 0; 0 exhaustive switch trên WordType.
- **Sign-off:** German Academic Lead xác nhận `PHRASE` hợp lệ cho cụm cố định/thành ngữ C1/C2.
- **Owner:** CTO/Tech Lead + German Academic Lead

## RB-P2-01 — [P2] 🟢 Option C SHIPPED + 🟢 Option B Phase 2a SHIPPED — Schema field-naming drift

- **Trạng thái:** Option C (shim) đã ship; **Option B Phase 2a** (codemod content key snake→camel cho nhóm 0-consumer) đã ship + verify.
- **Phase 2a (2026-06, content-only, an toàn):** codemod `scripts/codemod-snake-to-camel-content.mjs` đổi **45 snake KEY → camelCase** trong 535 file reading/listening — CHỈ key, value (`"richtig_falsch"`...) bất biến (codemod assert value-multiset + key-count, abort nếu lệch). Nhóm này là metadata/QA-sidecar **0 consumer** (đã grep verify).
  - **Verify 2a:** `qa:content` 0 lỗi; seed-smoke exit 0 (vocab/grammar/course); `tests/content-audit/*` 26/26 pass; 0 renamed-key còn sót; value-invariance giữ.
- **Phase 2b (DEFER — cần xác nhận riêng vì chạm production):** 22 key còn lại có consumer — seeder→DB-blob (`teil_name`, `task_type`, `key_evidence`, `key_vocabulary` ghi vào `explanationTrans` Json), runtime UI (`alt_text`, `extra_info`, `target_audience`, `word_count*`), QA-gate (`section_cloze`, `sentence_cloze`, `opinion_texts`), audio pipeline (`speaker_role`, `source_script`). Đổi nhóm này = thay shape dữ liệu DB đã seed + chạm audio/QA contract → cần trace runtime readers của `explanationTrans` + rollback plan + xác nhận của CTO/CEO trước khi làm.
- **Findings (1):** F-0027.
- **Lưu ý consumer mẫu:** `getReadingWordCount` (`reading/page.tsx`) đọc cả `word_count` lẫn segment `word_count_text_a..d` (segment không nằm trong map shim) → KHÔNG áp shim ở đây để tránh đổi hành vi render (đúng Req 3.4/4.4). Helper là opt-in; consumer migrate dần khi an toàn. Shim đã sẵn sàng cho các điểm đọc đơn giản.

## RB-P2-02 — [P2] ✅ RESOLVED — Reading `explanation.vi` boilerplate (không thực sự dạy)

- **Trạng thái:** RESOLVED (spec `reading-explanation-regeneration`, 2026-06). 1,282/1,282 reading question đã có `explanation.vi` cụ thể (0 boilerplate còn lại).
- **Phát hiện:** Layer 2 D3 (2026-06). 100% `explanation.vi` của reading questions ở cả 6 level là template chung — không nêu bằng chứng cụ thể.
- **Phạm vi:** 1,282 reading question trên 6 level (a1=150, a2=200, b1=250, b2=250, c1=168, c2=264) trong 266 file reading.
- **Findings (6 cluster):** F-2001 (a1), F-2002 (a2), F-2003 (b1), F-2004 (b2), F-2005 (c1), F-2006 (c2).
- **Cách giải quyết:** sinh giải thích VI grounded theo từng item (dẫn `key_evidence` thật + đáp án thật, theo từng loại câu hỏi: richtig_falsch/ja_nein/multiple_choice/detail_extraction/matching/matching_ab). 584 `explanation.de` templated/thin được viết lại thành lập luận cụ thể từ `key_evidence` trước khi dịch.
- **Verify:** 0 boilerplate còn lại (classifier); `de` class rich=1282/0/0; `pnpm qa:content` 0 lỗi; 1,282 đáp án bất biến (regenerate script assert answer/options/stem immutable mỗi file); 0 explanation.vi rỗng; 18/18 PBT `tests/content-audit/*` xanh (gate zero-boilerplate đã bật).
- **Tooling:** `scripts/reading-explanation-lib.ts`, `classify-reading-explanations.ts`, `build-reading-explanation-patch.ts`, `regenerate-reading-explanations.ts` (dry-run + immutable assert).
- **Owner:** German Content Writer + Vietnamese-German Localization Specialist + German Academic Lead.

## Pending Layer 2 (review thủ công — chưa có findings auto)

- **D1 chính tả/ngữ pháp Đức (proofreading sâu)** → ĐÃ chạy auto layer: 100% enum Genus/article check (sinh 3 finding P0 `FEMINUM` → đã RESOLVED) + đối chiếu `detailed_compounds_audit_report.md`. Còn lại proofreading sâu (chia động từ, Kasus, trật tự từ trong free text) → German Academic Lead trên mẫu phân tầng.

- **D3 (review thủ công bổ sung)** → German Academic Lead + Curriculum Designer: kiểm tính đúng ngữ nghĩa của đáp án + chất lượng distractor trên **mẫu phân tầng 24 file** (2 file/level×skill, danh sách `tmp/d3-manual-sample.json`). Auto pass đã phủ resolvability + distractor trùng + explanation boilerplate; phần ngữ nghĩa (đáp án có thực sự đúng theo text không, distractor có "bẫy" hợp lý không) cần người.

- **D2 CEFR fit** → ĐÃ chạy proxy grammar-floor trên 534 file reading+listening: **0 violation** — mọi `target_grammar` nằm ở/dưới level khai báo (Konjunktiv II/Passiv/Plusquamperfekt từ B1+, Konjunktiv I/Nominalisierung/Partizipialstrukturen từ B2+, Partizipialkonstruktionen từ C1+). Logic proxy đã sanity-test (fire đúng trên ca giả lập). Còn lại level-fit sâu (độ dài text vs dải CEFR, độ khó từ vựng, độ tinh tế ngữ nghĩa) → German Academic Lead review thủ công trên mẫu 24 file (`tmp/d2-manual-sample.json`).
- **D3 đáp án/distractor/giải thích ngữ nghĩa** → ĐÃ chạy auto pass (xem RB-P2-02 + auto resolvability/distractor); còn lại review ngữ nghĩa thủ công trên mẫu 24 file (`tmp/d3-manual-sample.json`).
- **D4 chất lượng dịch tiếng Việt** → ĐÃ chạy proxy auto pass trên 10,461 word: **0 mojibake trong content**, 2 finding P2 thực (Brasilien→"Brazil", Kohlenhydrat→"carbohydrate" — chưa dịch sang Việt). Còn lại review naturalness/accuracy thủ công trên mẫu 12 file (`tmp/d4-manual-sample.json`).
  - **Lưu ý phương pháp (đã loại false positive):** proxy term-inconsistency (1,224 hit) bị **loại** vì chủ yếu là đa nghĩa hợp lệ + thứ tự synonym ("là, ở, thì" vs "là, thì, ở") — không auto-flag được, cần người. German-char "leak" (5 hit) cũng loại vì là **trích dẫn học thuật hợp lệ** (Husserl, Popper) trong giải thích C2. vi==en loanword (Euro/Internet/Taxi…) loại vì hợp lệ.
- **D7 transcript khớp script (0/268 source ready)** → German Academic Lead + Audio.- **D8 hợp lệ đề thi Goethe/Telc/ÖSD** → ✅ Lớp machine-checkable đã chạy (D8 analyzer), **0 finding**: examTypes hợp lệ (GOETHE/TELC/OESD + DTZ@B1 + GDS@C2 đặt đúng level), Teil liên tục, `points` đầy đủ, sidecar `.qa.json` loại đúng. Còn lại blueprint fidelity sâu (timing, số item vs đặc tả chính thức) → Exam Prep Specialist (100% exam item).
