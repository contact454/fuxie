# Implementation Plan — Fuxie Content Review Board

Vai chinh: AI / LLM Engineer
Vai phoi hop: German Academic Lead, Content QA / Linguistic Reviewer, QA Automation Engineer, DevOps / Cloud Engineer

## Overview

Dựng cổng QA nội dung 2 tầng: **Tier-1 deterministic** (LanguageTool + hunspell + dictionary + enum + answer-key, blocking, CI, miễn phí) và **Tier-2 agent board** (4 reviewer + red-team mù đáp án + aggregator, advisory, provider, nightly). Thêm **mutation calibration** đo recall, **nhãn trung thực** objective/subjective tách biệt, và **chạy 1 lượt** trên 1.282 reading explanation → CSV per-item + escalation queue. Reuse-first, READ-ONLY content, cost-aware.

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1.1", "1.2"], "description": "PBT guards (5 property) + scaffold Tier-1 lint khung. Độc lập." },
    { "wave": 2, "tasks": ["2.1", "2.2"], "description": "Tier-1: LanguageTool/hunspell + dictionary/enum + answer-key. Phụ thuộc 1.2." },
    { "wave": 3, "tasks": ["2.3"], "description": "Tier-1: CLI diff/skill/level + npm qa:german-lint. Phụ thuộc 2.1, 2.2." },
    { "wave": 4, "tasks": ["3.1"], "description": "CI wiring check-quick block-on-error. Phụ thuộc 2.3." },
    { "wave": 5, "tasks": ["4.1", "4.2"], "description": "Tier-2: reviewer prompts + red-team payload + structured schema. Phụ thuộc 1.1." },
    { "wave": 6, "tasks": ["4.3"], "description": "Tier-2: aggregator + dual-label combiner + cost note. Phụ thuộc 4.1, 4.2." },
    { "wave": 7, "tasks": ["5.1"], "description": "Mutation calibration + recall report. Phụ thuộc 2.3, 4.3." },
    { "wave": 8, "tasks": ["6.1"], "description": "One-shot run 1.282 + escalation queue + README. Phụ thuộc 4.3, 5.1." }
  ]
}
```

Hard ordering: Tier-1 (objective, miễn phí) hoàn chỉnh + calibration TRƯỚC khi tốn credit chạy Tier-2 one-shot. PBT guards lên đầu để bảo vệ mọi bước sau.

## Tasks

- [x] 1. Foundation — PBT guards + scaffold Tier-1

  - [x] 1.1 PBT cho 5 correctness property
    - Thêm `tests/content-audit/review-board.spec.ts`: Property 1 (error⇒FAIL+exit≠0), Property 2 (red-team payload không chứa `answer|correctIndex|solution|explanation|key_evidence`), Property 3 (output có 2 nhãn tách + `notReviewedNote` + không token "approved"), Property 4 (rủi ro⇒escalate), Property 5 (content hash bất biến). Dùng `fast-check`, chạy cùng `test:property`.
    - _Requirements: 1.5, 3.5, 5.1, 5.2, 5.3, 5.5, 4.5, 6.4_

  - [x] 1.2 Scaffold Tier-1 module
    - Tạo `scripts/content-german-lint.ts` với interface `Tier1Finding`/`Tier1Result`; scan Content_String_De từ file reading (tái dùng cách đọc của `reading-explanation-lib`); chưa nối LanguageTool (stub trả findings rỗng) nhưng đã có `objectiveVerdict` + exit-code logic.
    - _Requirements: 1.4, 1.5, 1.6_

- [x] 2. Tier-1 — Deterministic German Gate

  - [x] 2.1 LanguageTool + hunspell
    - Nối LanguageTool de-DE (server local/Docker `:8081`) + hunspell de_DE trên mọi Content_String_De; map kết quả → `Tier1Finding` (rule, offset, excerpt citeable). Health-check: server không chạy → `infraError` + exit code riêng, KHÔNG PASS giả.
    - _Requirements: 1.1, 1.4, 1.9_

  - [x] 2.2 Dictionary Genus/plural + enum + answer-key
    - Validate quán từ der/die/das + số nhiều theo từ điển noun; validate `wordType`/enum bằng cách **gọi enum chung** (`@fuxie/shared`), không sao chép; answer-key consistency (`correctIndex`/`answer` trỏ option hợp lệ, `key_evidence` có trong text, explanation không mâu thuẫn đáp án). KHÔNG lặp `content-qa.ts`.
    - _Requirements: 1.2, 1.3, 1.8, 7.2_

  - [x] 2.3 CLI + npm script
    - Thêm `--diff` (diff-scoped), `--skill`, `--level`, `--json`, `--report-path`; expose npm `qa:german-lint`. Chạy hoàn toàn local, không cần credit.
    - _Requirements: 1.6, 1.7, 7.6_

- [x] 3. CI wiring

  - [x] 3.1 Cắm Tier-1 vào `check-quick` (block-on-error)
    - Thêm bước `pnpm qa:german-lint --diff` vào job `check-quick` trong `.github/workflows/ci.yml`, block-on-error, sau `check:locale-parity`; xác nhận `verify`/`smoke-test` không bị phá.
    - _Requirements: 1.7, 7.5_

- [x] 4. Tier-2 — Agent Review Board

  - [x] 4.1 4 reviewer prompts + structured schema
    - Mở rộng `scripts/ai-eval-harness.ts`/họ `eval:ai:*` thêm surface review-board: German_Linguist, CEFR_Pedagogy, VN_Localization với rubric dẫn từ `.agents/personnel/` + `cefr-audit-checklist.md` + `bilingual-style-guide.md`; output theo schema `ReviewerOutput` (JSON-schema validate); context độc lập, model khác model sinh nội dung.
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 4.2 Red-team mù đáp án
    - `buildRedTeamPayload` chỉ lấy `stem`/`options` (KHÔNG đáp án/explanation); reviewer trả `{ predictedAnswer, confidence, rationale }`; so với `answer` lưu → `redFlag`. Test Property 2 phải xanh.
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

  - [x] 4.3 Aggregator + dual-label + cost
    - `Aggregator` → `{ consensus, confidence, perDimension, redFlag, estimatedCostUsd }`; `combineLabels` sinh ItemLabel 2 nhãn tách biệt + `notReviewedNote`; `advisory-pass (low-assurance)` chỉ khi PASS∧high∧¬redFlag; không sinh "approved"; `--dry-run` đếm cost trước gọi provider; chạy theo `--level`/`--batch-size`.
    - _Requirements: 2.7, 3.4, 5.1, 5.2, 5.3, 5.4, 5.5, 7.1, 7.3_

- [x] 5. Mutation gold-set calibration

  - [x] 5.1 Cấy lỗi + đo recall theo loại
    - `scripts/content-review-board-calibrate.ts`: copy N item ra `tmp/review-board-calibration/`, cấy 5 loại lỗi (genus, umlaut_drop, wrong_answer, level_violation, bad_translation); chạy board lên bản cấy; tính `Recall_By_Type` + phân định Tier-1 vs Tier-2 bắt; ghi loại recall thấp = "chưa đáng tin"; xoá bản tạm + assert content byte-identical.
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 6. One-shot run trên 1.282 reading explanation

  - [x] 6.1 Chạy board + sinh deliverable
    - `scripts/content-review-board-run.ts`: chạy Tier-1 + Tier-2 trên 1.282 reading explanation (READ-ONLY content), tái dùng `item_id`/traceability của `explanation-review/`; sinh `docs/content-quality/audit-2026-06/review-board/`: `per-item.csv` (objective + Tier1 findings + subjective + confidence + redFlag), `escalation-queue.csv`, `recall-report.md`, `README.md` (phân định khách quan vs advisory + ngưỡng + cách vận hành gate). Verify `git status -- content/` rỗng.
    - _Requirements: 5.6, 6.1, 6.2, 6.3, 6.4, 6.5, 7.4_

## Notes

- **Tách cứng 2 tầng.** Chỉ Tier-1 (deterministic, citeable, free) được chặn PR; Tier-2 (LLM, tốn credit, non-deterministic) chỉ advisory/nightly.
- **Không bao giờ "approved".** Mọi item/batch mang 2 nhãn tách biệt; subjective luôn kèm "chưa được người rành tiếng Đức duyệt".
- **Red-team mù đáp án** là tín hiệu objective-hoá cho lỗi "dạy sai đáp án" — payload không được chứa đáp án/explanation (Property 2).
- **Reuse-first.** Tier-2 mở rộng harness `ai-eval`; Tier-1 gọi enum chung + không lặp `content-qa.ts`.
- **READ-ONLY content.** Mutation chỉ trên bản tạm; one-shot chỉ đọc; assert `content/` bất biến (Property 5).
- **Cost-aware.** Provider chạy theo batch/level + `--dry-run` đếm cost trước.
- Kết thúc: dùng kết quả **objective** (Tier-1 + red-team) để owner de-risk PR #21 ở mức advisory (owner quyết ship), và mở **escalation queue** cho người rành tiếng Đức khi có.
