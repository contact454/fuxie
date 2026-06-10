# Content Quality Audit 2026-06 — Trạng thái điều hành

Vai chinh: Content QA / Linguistic Reviewer
Vai phoi hop: German Academic Lead, German Curriculum Designer, Vietnamese-German Localization Specialist, Exam Prep Specialist, CTO/Tech Lead, German Content Writer

> Tài liệu tổng hợp toàn chuỗi **audit → remediation** trên mảng nội dung học Fuxie (1,194 file JSON, 6 level × 6 skill). Read-only đối với `content/` ở phần audit; phần remediation chỉ sửa đúng trường được phép, có gate + verify.

## 1. Đợt audit (spec `fuxie-content-quality-audit`)

- **Phạm vi:** 1,194 file (1,188 skill + 6 course.json), 13,462 Content_Item item-level.
- **Phương pháp:** Layer 1 (reuse 4 script QA sẵn có) + Layer 2 (auto scan + proxy bán-tự-động + review).
- **Findings:** 35 (D6=24, D3=6, D1=3, D4=2 · severity P0=3, P1=23, P2=9).
- **Deliverables:** `report.md`, `findings.csv`, `coverage-matrix.md`, `remediation-backlog.md`, `layer1/`.
- **Bảo chứng:** 5 PBT spec `tests/content-audit/*.spec.ts` (18 test) — read-only invariant, coverage=1194, evidence-gate, severity-consistency, reading-explanation.

## 2. Trạng thái 9 chiều (machine-checkable layer)

| Chiều | Kết quả auto/proxy | Còn lại (thủ công) |
| --- | --- | --- |
| D1 chính tả/ngữ pháp Đức | 3 P0 Genus enum (đã fix) + 100% enum check | proofreading sâu |
| D2 CEFR fit | proxy grammar-floor 534 file, 0 violation | level-fit sâu (mẫu 24 file) |
| D3 sư phạm | answer integrity sạch; 1,282 reading explanation (đã fix) | review ngữ nghĩa đáp án (mẫu 24 file) |
| D4 dịch Việt | proxy 10,461 word, 0 mojibake, 2 P2 | naturalness (mẫu 12 file) |
| D5 song ngữ/field | 100% required-field check | — |
| D6 schema/integrity | 100% structural + qa:content | — |
| D7 audio/script | 268/268 audio tồn tại | transcript-khớp-script |
| D8 hợp lệ đề thi | examType/Teil/points 0 finding | blueprint fidelity sâu |
| D9 độ phủ/cân bằng | coverage matrix đầy đủ | — |

## 3. Remediation (4 spec con)

| Backlog | Spec | Trạng thái | Tóm tắt |
| --- | --- | --- | --- |
| RB-P0-01 | `content-genus-enum-fix` | ✅ RESOLVED | 3 `article="FEMINUM"` → `FEMININ` (a2/vocabulary). |
| RB-P1-01 | `vocab-wordtype-enum-reconcile` | ✅ RESOLVED | Thêm `PHRASE` vào TS enum `WORD_TYPES` khớp Prisma DB (23 entry). |
| RB-P2-02 | `reading-explanation-regeneration` | ✅ RESOLVED | 1,282 reading `explanation.vi` boilerplate → giải thích cụ thể grounded theo evidence; 584 `de` viết lại. |
| RB-P2-01 | `content-schema-naming-unify` (decision) + `content-read-normalize-shim` (Option C) + codemod 2a | 🟢 Option C + Phase 2a SHIPPED · 🟡 Phase 2b DEFER | C: shim đọc nhất quán. 2a: 45 content key 0-consumer đã camel hoá (535 file, verify qa:content+seed+PBT). 2b (22 key có consumer DB/UI/audio) cần xác nhận riêng vì chạm shape DB production. |

## 4. Bảo chứng kỹ thuật

- `pnpm qa:content` (= `tsx scripts/content-qa.ts`): **0 lỗi / 0 cảnh báo** trên 1193 file.
- `tsx scripts/content-status-board.ts`: **36/36 cell qaMachine=pass**, `cells with machine defect: 0` trên 1.187 tracked content files.
- `tsx scripts/content-d7-signoff-sweep.ts`: **36/36 cell** trong D7 register, **120 review inputs** (60 human spot-check + D2 24 + D3 24 + D4 12), **0 missing sample file**.
- `tests/content-audit/content-generation-guard.spec.ts` + `program-quality.spec.ts`: **13/13 pass** cho guard generator + board/gate invariants.
- `tests/content-audit/*.spec.ts`: **18/18 pass** (gate zero-boilerplate reading đã bật).
- Answer integrity: 1,282 đáp án reading bất biến (regenerate script assert immutable `answer`/`options`/`stem` mỗi file).
- Read-only invariant audit: nội dung chỉ đổi ở các remediation có chủ đích (genus 1 file, reading explanation 266 file); enum fix ở `packages/shared` (type layer).

## 5. Còn lại — cần phán đoán con người (không auto được)

- **Academic_Signoff toàn chương trình:** hiện `signoff-manifest.json` có 1/36 cell signed (`reading/C2`), 35/36 pending. Machine-clean không đồng nghĩa release-signed. D7 tracking hiện tập trung ở `docs/content-quality/audit-2026-06/d7-signoff-register.md`.
- **Audio_Restubbing listening:** 6/6 listening cell còn `audio=pending`; mọi transcript đã đổi cần audio parity/re-record trước khi gọi là Done đủ.

- **Review thủ công Layer 2 sâu:** D1 proofreading, D2 level-fit, D3 ngữ nghĩa đáp án, D4 naturalness, D7 transcript-khớp-script, D8 blueprint fidelity. Mẫu phân tầng đã lập sẵn (`tmp/d2-/d3-/d4-manual-sample.json`).
- **RB-P2-01 schema migration:** nếu công ty quyết chuẩn hoá, mở spec migration riêng (CTO/Tech Lead + Backend + Frontend).

## 6. Đề xuất bước kế tiếp

Phần tự động hoá của cả audit + 3 remediation P0/P1/P2 đã hoàn tất và verify. Việc còn lại là review chuyên môn con người (các vai phối hợp) trên các mẫu đã chuẩn bị, và quyết định chiến lược cho RB-P2-01. Không còn hạng mục auto nào tồn đọng.
