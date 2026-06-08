# TICKET — Root-cause: Reading-Generator nhét "Kuhn-Filler" placeholder vào nội dung C2 (và rủi ro lan rộng)

- **Priority:** P0 (root cause của defect đã remediate ở spec `content-c2-placeholder-regeneration`)
- **Owner đề xuất:** AI / LLM Engineer (chinh) · CTO / Tech Lead (phoi hop) · Content QA / Linguistic Reviewer (verify)
- **Status:** OPEN
- **Phát hiện bởi:** Kiro-agent content review pilot (spec `fuxie-content-review-board`)
- **Liên quan:** PR #21 (`chore/content-audit-remediation-2026-06`), commit `41b06808c`
- **Ngày mở:** 2026-06

## Bối cảnh

Spec `content-c2-placeholder-regeneration` đã **chữa triệu chứng**: viết lại 8 bài đọc C2 (C2-T1-005…012) vốn dùng CHUNG một đoạn filler ("Wissenschaftsphilosophie / Thomas Kuhn / erkenntnistheoretischer Relativismus") với chỉ danh từ chủ đề ở câu 1 bị thay — hoàn toàn lệch tiêu đề/chủ đề. Đây là **bản vá nội dung**, KHÔNG sửa nguyên nhân gốc trong pipeline sinh nội dung.

## Triệu chứng gốc cần điều tra

1. **Filler placeholder:** Generator reading (Teil "Kommentar verstehen") sinh được 4 bài thật (C2-T1-001..004) rồi **nhét cùng một đoạn filler** cho các bài còn lại thay vì sinh bài thật hoặc fail rõ ràng. Cần tìm: bước nào trong pipeline rơi vào nhánh "filler/fallback", vì sao không báo lỗi.
2. **Broken-stem (lỗi nối template):** Cùng generator ghép "frame câu hỏi generic + sub-prompt thô" tạo stem sai ngữ pháp/lệch đáp án — quét READ-ONLY cho thấy **B2=11, C1=12, C2=70 (~93 câu)**. Cùng pipeline, xử lý ở spec `content-cefr-stem-regeneration`.

## Yêu cầu (Definition of Done)

- [ ] Xác định module/prompt/bước sinh ra (a) filler opener `Der vorliegende … widmet sich dem Thema …` và (b) stem nối template; truy ra commit/script gốc.
- [ ] Thêm **fail-fast guard trong generator**: nếu output dính `GENERIC_OPENER` (xem `scripts/apply-c2-article-regen.ts`) hoặc khớp `BROKEN_STEM_MARKERS` (xem `scripts/lib/cefr-stem-markers.ts`) → reject/raise, KHÔNG ghi ra `content/`.
- [ ] Thêm guard "duplicate article body" (phát hiện nhiều file chia sẻ `article.text` gần-trùng) ở khâu sinh hàng loạt.
- [ ] Cắm các cổng deterministic trên vào CI (tái dùng `qa:german-lint` / Tier-1 của `fuxie-content-review-board`) để chặn tái sinh placeholder/broken-stem ở PR mới.
- [ ] Quét toàn bộ level/teil để xác nhận không còn cụm filler nào khác ngoài 8 file đã chữa (mở rộng `GENERIC_OPENER` scan ra a1..c2 + listening nếu cần).

## Phạm vi & ràng buộc

- READ-ONLY `content/` khi điều tra; mọi sửa generator + guard phải có test.
- Không tái sinh đè nội dung đã human/AI-verify nếu chưa có sign-off.
- Re-dùng markers từ `scripts/apply-c2-article-regen.ts` + `scripts/lib/cefr-stem-markers.ts` làm single source of truth (đừng định nghĩa lại).

## Tham chiếu

- Finding: `docs/content-quality/audit-2026-06/review-board/kiro-pilot/c2-reading-findings.md` (P0 = RESOLVED + bảng quy mô broken-stem).
- Spec đã chữa nội dung: `.kiro/specs/content-c2-placeholder-regeneration/`.
- Spec đang chữa stem: `.kiro/specs/content-cefr-stem-regeneration/`.
- Cổng QA thường trực: `.kiro/specs/fuxie-content-review-board/` (Tier-1 `qa:german-lint`).
