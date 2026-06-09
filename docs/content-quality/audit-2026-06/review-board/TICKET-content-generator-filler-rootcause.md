# TICKET — Root-cause: Content-Generator sinh filler/placeholder + nội dung trùng lặp trên nhiều skill/level (reading T1/T2/T3, broken-stem, listening N↔N+10)

- **Priority:** P0 (root cause của 5 cụm defect; nhiều cụm đã/đang remediate qua spec riêng)
- **Owner đề xuất:** AI / LLM Engineer (chinh) · CTO / Tech Lead (phoi hop) · Content QA / Linguistic Reviewer (verify)
- **Status:** OPEN
- **Phát hiện bởi:** Kiro-agent content review pilot (spec `fuxie-content-review-board`)
- **Liên quan:** PR #21 (`chore/content-audit-remediation-2026-06`)
- **Ngày mở:** 2026-06 · **Cập nhật:** 2026-06 (mở rộng từ 2 cụm → 5 cụm sau quét sâu 1.187 file)

## Bối cảnh

Spec `content-c2-placeholder-regeneration` đã **chữa triệu chứng**: viết lại 8 bài đọc C2 (C2-T1-005…012) vốn dùng CHUNG một đoạn filler ("Wissenschaftsphilosophie / Thomas Kuhn / erkenntnistheoretischer Relativismus") với chỉ danh từ chủ đề ở câu 1 bị thay — hoàn toàn lệch tiêu đề/chủ đề. Đây là **bản vá nội dung**, KHÔNG sửa nguyên nhân gốc trong pipeline sinh nội dung.

## Triệu chứng gốc cần điều tra

Quét sâu toàn bộ 1.187 file content (audit 2026-06, `cross-content-duplicate-scan.md`) xác nhận đây là **một họ bug generator hệ thống** biểu hiện ở **5 cụm** trên nhiều skill/level:

1. **Filler placeholder — C2 reading Teil 1 (`Der vorliegende Kommentar widmet sich dem Thema …`):** generator sinh 4 bài thật (C2-T1-001..004) rồi **nhét cùng một đoạn filler** cho phần còn lại. Cần tìm: bước nào rơi vào nhánh "filler/fallback", vì sao không báo lỗi. → **đã chữa** spec `content-c2-placeholder-regeneration`.
2. **Filler placeholder — C2 reading Teil 3 (`Der wissenschaftliche Diskurs um das Thema …`):** cùng khuôn, 12 file. → **đã chữa** spec `content-c2-teil3-regeneration`.
3. **Filler placeholder — C2 reading Teil 2 cloze (`Der folgende Bericht untersucht das Thema '…' aus interdisziplinärer Perspektive`):** 12 file C2-T2-001..012 dùng CHUNG một bài Lückentext filler (8 đoạn + 9 câu sections y hệt, chỉ đảo nhãn + remap answers). → spec MỚI `content-c2-teil2-regeneration` (foundation xong).
4. **Broken-stem (lỗi nối template):** ghép "frame câu hỏi generic + sub-prompt thô" → stem sai ngữ pháp/lệch đáp án. Quét: **B2=11, C1=12, C2=70**. → đã chữa spec `content-cefr-stem-regeneration`.
5. **Duplicate transcript listening (mẫu N↔N+10) + topic mismatch + cấu trúc "N Sendungen" giả:** generator listening copy verbatim block lesson đầu thành block sau (B1: 011≡001; B2: 011≡001, 012≡002; C2: 011..018≡001..008; C1 partial), khai topic không khớp transcript (B1:14, B2:11, C1:7, C2:29), và tạo "N Sendungen/Gespräche" giả bằng vài đoạn lặp vòng (C2: 52/52). → spec MỚI `content-listening-regeneration` (foundation xong).

## Yêu cầu (Definition of Done)

- [ ] Xác định module/prompt/bước sinh ra: (a) filler opener T1 `Der vorliegende … widmet sich dem Thema …`, (b) filler opener T3 `Der wissenschaftliche Diskurs um das Thema …`, (c) filler cloze T2 `Der folgende Bericht untersucht das Thema '…' aus interdisziplinärer Perspektive`, (d) stem nối template, (e) listening copy block N→N+10; truy ra commit/script gốc.
- [ ] Thêm **fail-fast guard trong generator**: nếu output dính bất kỳ `GENERIC_OPENER` (xem `scripts/apply-c2-article-regen.ts`), `GENERIC_OPENER_T2` (`scripts/apply-c2-teil2-regen.ts`), hoặc khớp `BROKEN_STEM_MARKERS` (`scripts/lib/cefr-stem-markers.ts`) → reject/raise, KHÔNG ghi ra `content/`.
- [ ] Thêm guard "duplicate body": phát hiện nhiều file chia sẻ `article.text` / `section_cloze.text` / transcript gần-trùng (tái dùng `overlapScore` của `scripts/lib/listening-scan.ts`) ở khâu sinh hàng loạt; chặn cả mẫu copy N↔N+10 trong listening.
- [ ] Thêm guard "topic↔nội dung": keyword `topic`/`title` phải xuất hiện trong nội dung học (transcript/article/cloze) — tái dùng `transcriptMatchesTopic`.
- [ ] Thêm guard "cấu trúc thật": nếu khai "N Sendungen/Gespräche" thì phải có N đoạn khác nhau thật (dupRatio nội bộ < 0.2).
- [ ] Cắm các cổng deterministic trên vào CI (tái dùng Tier-1 của `fuxie-content-review-board` + `tests/content-audit/*`) để chặn tái sinh ở PR mới.
- [ ] Đã quét toàn bộ level/teil (1.187 file) — xác nhận 5 cụm trên là toàn bộ defect đo được; A1/A2 reading, vocabulary, grammar, speaking, writing (trừ a1/writing nghi false-positive) sạch.

## Phạm vi & ràng buộc

- READ-ONLY `content/` khi điều tra; mọi sửa generator + guard phải có test.
- Không tái sinh đè nội dung đã human/AI-verify nếu chưa có sign-off.
- Re-dùng markers/helper làm single source of truth (đừng định nghĩa lại): `apply-c2-article-regen.ts`, `apply-c2-teil2-regen.ts`, `lib/cefr-stem-markers.ts`, `lib/listening-scan.ts`.
- **Audio:** transcript listening sau khi viết lại cần re-record MP3 (hạng mục Audio_Restubbing) — giao Speech/Audio Engineer, ngoài phạm vi guard generator nhưng phải truy vết.

## Tham chiếu

- Finding reading T1/T3: `docs/content-quality/audit-2026-06/review-board/kiro-pilot/c2-reading-findings.md`.
- Finding quét sâu (5 cụm, 1.187 file): `docs/content-quality/audit-2026-06/review-board/kiro-pilot/cross-content-duplicate-scan.md`.
- Spec đã chữa: `content-c2-placeholder-regeneration` (T1), `content-c2-teil3-regeneration` (T3), `content-cefr-stem-regeneration` (stem).
- Spec foundation xong, chờ viết nội dung: `content-c2-teil2-regeneration` (T2 cloze), `content-listening-regeneration` (B1/B2/C1/C2).
- Cổng QA thường trực: `.kiro/specs/fuxie-content-review-board/` (Tier-1 `qa:german-lint`).
