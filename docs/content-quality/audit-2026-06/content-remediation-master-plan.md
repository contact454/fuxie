# Fuxie — Kế hoạch tổng Remediation & QA toàn bộ Content (A1–C2, mọi module)

Vai chinh: Project Manager / Delivery Manager
Vai phoi hop: Content QA / Linguistic Reviewer, German Academic Lead, German Curriculum Designer, AI / LLM Engineer, CTO / Tech Lead, Speech / Audio Engineer

Ngày lập: 2026-06 · Trạng thái: Đang thực thi · Liên quan: PR #21 (`chore/content-audit-remediation-2026-06`)

> Mục tiêu của tài liệu này: thay cách vá lắt nhắt từng cụm bằng **một chương trình (program) thống nhất** quản lý chất lượng + remediation cho **toàn bộ 1.187 item content**, mọi module, A1→C2. Một inventory, một bộ cổng QA, một bảng theo dõi, một định nghĩa "Done".

## Cập nhật thực thi 2026-06-10

- `scripts/content-status-board.ts`: 36/36 cell `qaMachine=pass`; `cells with machine defect: 0`.
- D3 topic-match: 36/36 cell `D3=pass`; 6 listening items regenerated for real topic mismatch, 16 functional-topic false positives covered by audited semantic evidence in `topic-evidence-overrides.json`.
- `scripts/content-qa.ts`: 1.193 file scanned, 0 errors, 0 warnings.
- `scripts/content-d7-signoff-sweep.ts`: D7 register đã tạo từ board + manifest + sample packs, bao phủ 36/36 cell, 120 general review inputs, và 1.482 Vocabulary D7 review rows; 0 sample file thiếu.
- Grammar D7 advisory: 6/6 grammar cells now have a uniform 3-exercise scaffold; C1/C2 remediation adds recognition + production practice while leaving final native signoff pending.
- Speaking D7 advisory: 48/48 files and 2,304 sentences checked; 79 pseudo-IPA and 6 blank IPA entries remediated, while final native signoff remains pending.
- Writing D7 advisory: 230/230 files checked and 216 model answers remediated for objective length/template/token blockers; final native and exam-authenticity signoff remains pending.
- Vocabulary D7 advisory: 369/369 files and 10,461 entries checked; 239 files carry D7 remediation notes for objective schema, lexeme, semantic, and present-conjugation blockers. No `auto_generated_needs_spot_check` conjugations remain; `vocabulary-d7-review-pack.{json,md,csv}` now queues 1.482 rows (626 P1) for loanword policy, plural morphology, genus/article policy, semantic definition, example fit, and final native signoff.
- `docs/content-quality/audit-2026-06/cell-ownership-map.md`: đã gán owner/workstream cho đủ 36 cell.
- `.github/workflows/ci.yml`: CI `check-quick` chạy `pnpm qa:german-lint --diff` với LanguageTool service + PBT.
- `scripts/content-generation-guard.ts`: guard foundation chặn D1/D2/D3/D4/D5 trước khi generator ghi nội dung.
- Tồn đọng không được tự chứng nhận: 35/36 cell còn `academicSignoff=pending`; 6/6 listening cell còn `audio=pending`. Vì vậy chương trình hiện **machine-clean**, chưa **release-signed** toàn bộ; register D7 dùng để điều phối quyết định còn lại, không tự ký thay reviewer.

---

## 1. Inventory thật (đếm 2026-06, READ-ONLY)

| level | reading | listening | writing | speaking | vocabulary | grammar | TỔNG |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| A1 | 30 | 32 | 35 | 10 | 21 | 1 | 129 |
| A2 | 40 | 40 | 35 | 8 | 26 | 1 | 150 |
| B1 | 50 | 44 | 50 | 6 | 42 | 1 | 193 |
| B2 | 50 | 48 | 40 | 10 | 60 | 1 | 209 |
| C1 | 48 | 52 | 35 | 8 | 75 | 1 | 219 |
| C2 | 48 | 52 | 35 | 6 | 145 | 1 | 287 |
| **TỔNG** | **266** | **268** | **230** | **48** | **369** | **6** | **1187** |

→ 6 module × 6 level = **36 ô (cell)**. Đây là đơn vị quản lý của chương trình: mỗi cell có chủ, có cổng, có trạng thái Done riêng.

---

## 2. Hiện trạng defect đã biết (tới 2026-06)

Tổng hợp từ quét sâu 1.187 file (`cross-content-duplicate-scan.md`) + đọc trực tiếp xác minh.

| Module/Level | Defect | Mức | Trạng thái |
| --- | --- | --- | --- |
| reading C2-T1 (8 file) | filler placeholder "Der vorliegende Kommentar…" | P0 | ✅ đã chữa (`content-c2-placeholder-regeneration`) |
| reading C2-T3 (12 file) | filler "Der wissenschaftliche Diskurs…" | P0 | ✅ đã chữa (`content-c2-teil3-regeneration`) |
| reading C2-T2 (12 file) | filler cloze "Der folgende Bericht…" | P0 | 🔧 spec + 12 nháp dry-run pass, chờ duyệt (`content-c2-teil2-regeneration`) |
| reading B2/C1/C2 stems (~93 câu) | broken-stem nối template | P1 | ✅ đã chữa (`content-cefr-stem-regeneration`) |
| listening B1/B2/C1/C2 (~60+ file) | transcript nhân bản N↔N+10 + topic mismatch + cấu trúc "N Sendungen" giả | P0/P1 | ✅ sạch theo máy; còn D7 + Audio_Restubbing (`content-listening-regeneration`) |
| listening A1/A2/B1 D3 advisory | topic descriptor chức năng hoặc transcript lệch thật | P1/P2 | ✅ 6 item regenerate + 16 semantic evidence overrides; D3 board = pass |
| writing A1 (10 file) | nghi near-duplicate khung đề | nghi P2 / false-pos | ⏳ chưa xác minh đọc |
| vocabulary, grammar, speaking, reading A1/A2/B1, writing A2–C2, listening A1/A2 | — | — | ✅ sạch theo phép đo overlap/opener (cần đọc mẫu xác nhận) |

**Lưu ý quan trọng:** "sạch theo phép đo" = chưa phát hiện filler/duplicate bằng scanner tự động. **Chưa có người rành tiếng Đức duyệt nội dung học thuật** của bất kỳ cell nào. Đây là rủi ro tồn dư lớn nhất.

---

## 3. Phân loại defect (taxonomy) — để cổng QA bắt thống nhất

| Mã | Họ defect | Cách phát hiện (deterministic) | Module áp dụng |
| --- | --- | --- | --- |
| D1 | Filler/placeholder opener | regex GENERIC_OPENER(_T2) | reading, (listening intro) |
| D2 | Nội dung nhân bản giữa ID | overlapScore ≥ 0.5 trong cùng cell | reading, listening, writing |
| D3 | Topic ↔ nội dung mismatch | keyword(topic/title/opinion question) hoặc semantic evidence ⊂ nội dung | mọi module có topic |
| D4 | Cấu trúc giả ("N Sendungen/Gespräche") | dupRatio nội bộ ≥ 0.2 | listening |
| D5 | Broken-stem (nối template) | BROKEN_STEM_MARKERS | reading, listening questions |
| D6 | Đáp án không xác minh được | key_evidence ⊄ nội dung / answer ∉ options | mọi module có câu hỏi |
| D7 | Sai/yếu sư phạm + ngữ pháp Đức | **người duyệt** (German Academic Lead) | mọi module |

D1–D6 = **máy bắt được** (cổng CI). D7 = **bắt buộc người** — không tự động hoá.

---

## 4. Cổng QA thống nhất (một bộ, chạy CI trên mọi cell)

Hợp nhất các công cụ rời rạc đã xây thành **một CLI duy nhất** `scripts/content-qa.ts` (mở rộng) chạy mọi module/level:

1. `qa:content` (schema + cơ bản) — đã có, baseline 0.
2. `qa:duplicate` — overlapScore trong từng cell < 0.5 (tái dùng `lib/listening-scan.overlapScore`); mở rộng cho reading/writing field nội dung học.
3. `qa:opener` — GENERIC_OPENER + GENERIC_OPENER_T2 = 0.
4. `qa:topic-match` — keyword topic/title/opinion question hoặc audited semantic evidence ⊂ nội dung (`scripts/lib/topic-evidence.ts`).
5. `qa:stem` — BROKEN_STEM_MARKERS = 0.
6. `qa:answer-integrity` — key_evidence ⊂ nội dung + answer hợp lệ.
7. `qa:german-lint` — LanguageTool (khi có), lỗi ngữ pháp Đức = 0 mới.

Mỗi cell chỉ "Done (máy)" khi 1–7 xanh. "Done (đủ)" khi thêm **Academic_Signoff (D7)**.

---

## 5. Lộ trình theo đợt (wave) — ưu tiên theo rủi ro học viên

Nguyên tắc ưu tiên: (a) defect P0 đã xác nhận trước, (b) module nhiều người dùng + dễ lộ lỗi (reading/listening) trước, (c) cell lớn/khó (c2/vocabulary 145, c1/vocabulary 75) cần kế hoạch riêng.

### Đợt 0 — Hạ tầng & chặn nguồn (1–2 tuần, kỹ thuật, KHÔNG cần chuyên gia Đức)
- Hợp nhất cổng QA (mục 4) thành CLI + cắm CI chặn PR mới.
- **Fix generator gốc** (ticket `TICKET-content-generator-filler-rootcause.md`, 5 cụm) — guard fail-fast để KHÔNG tái sinh D1–D4.
- Chuẩn hoá apply-script (reading article / cloze / listening) + PBT — phần lớn đã có.

### Đợt 1 — Đóng P0 đã xác nhận (cần German Academic Lead duyệt)
- reading C2-T2 (12) — đã có 12 nháp, chỉ chờ duyệt → apply.
- listening C2 (≈44 file: 011–018 + topic-mismatch + cấu trúc giả).
- listening B2 (20 Defective_File đã chốt) — đã có 1 nháp mẫu.
- listening B1 (≈ block 011 + 14 topic-mismatch — cần Task xác minh).

### Đợt 2 — Quét xác minh + đóng phần nghi
- listening C1 (8 cặp partial — đọc xác nhận, loại false-positive).
- writing A1 (10 nghi — đọc field đề bài vs Musterlösung).
- **Đọc mẫu kiểm chứng** các cell "sạch theo máy" (random 5–10% mỗi cell) để bắt D7 mà máy không thấy.

### Đợt 3 — Audit chất lượng học thuật toàn diện (D7) + audio
- German Academic Lead duyệt thực chất theo cell (level fit, độ chính xác, sư phạm). Đây là khối lượng lớn nhất — cần kế hoạch nhân sự riêng (mục 7).
- Speech/Audio Engineer re-record MP3 cho mọi transcript listening đã đổi (Audio_Restubbing).
- vocabulary (369 item, lớn nhất) + grammar + speaking: audit theo tiêu chí module (mục 6).

### Đợt 4 — Chốt & phòng ngừa
- Toàn bộ 36 cell đạt "Done (đủ)".
- Cổng CI thường trực + báo cáo định kỳ (mục 8).
- Khoá quy trình: nội dung mới phải qua cổng + Academic_Signoff trước merge.

---

## 6. Tiêu chí chất lượng theo module (Definition of Done — D7)

- **Reading:** bài đọc thật đúng topic/level, đáp án trích được trong bài, distractor công bằng, register đúng CEFR, không filler/trùng.
- **Listening:** transcript thật đúng topic/level, các đoạn khác nhau thật, đúng định dạng Teil Goethe, câu hỏi bám transcript, audio khớp transcript.
- **Writing:** đề bài (Aufgabenstellung) rõ + Musterlösung/khung đánh giá đúng level; khung dùng chung hợp lệ KHÔNG tính là trùng (tinh chỉnh scanner để tránh false-positive).
- **Speaking:** prompt/tình huống đúng level + tiêu chí chấm; ít item (48) nên audit nhanh.
- **Vocabulary:** từ đúng danh sách CEFR, ví dụ/định nghĩa chính xác, không trùng lặp ngữ nghĩa; **cell lớn nhất (369)** → ưu tiên kiểm tự động + mẫu.
- **Grammar:** 1 item/level — kiểm thủ công nhanh.

---

## 7. Tổ chức & nguồn lực (nút thắt thật)

| Vai trò | Trách nhiệm | Ghi chú quy mô |
| --- | --- | --- |
| Project Manager / Delivery Manager | điều phối chương trình, bảng theo dõi 36 cell, gate review | — |
| Content QA / Linguistic Reviewer | cổng QA, scanner, apply-script, PBT | hạ tầng hầu hết đã có |
| **German Academic Lead** | **duyệt nội dung D7 (bắt buộc)** | **NÚT THẮT: ~1.187 item, cần kế hoạch nhân sự/thời gian; cân nhắc thuê thêm reviewer bản ngữ** |
| German Content Writer | viết lại nội dung defect | AI có thể soạn nháp, nhưng phải qua Academic_Signoff |
| German Curriculum Designer | khung sư phạm theo Teil/level | — |
| AI / LLM Engineer + CTO | fix generator gốc + cắm CI | chặn tái phát |
| Speech / Audio Engineer | re-record MP3 listening | phụ thuộc transcript chốt |

**Cảnh báo trung thực:** AI (Kiro) làm được hạ tầng + scanner + nháp nội dung + dry-run, nhưng **không thay được người rành tiếng Đức duyệt chất lượng học thuật**. Quy mô D7 trên 1.187 item là nút thắt chính — cần CEO quyết nguồn lực (số reviewer, thời gian, ngân sách thuê ngoài).

---

## 8. Governance & theo dõi

- **Một bảng trạng thái 36 cell** (module × level): mỗi cell có cột `qa-machine` (D1–D6), `academic-signoff` (D7), `audio` (nếu listening), `status`.
- Nguồn sự thật: thư mục `docs/content-quality/audit-2026-06/` + các spec `.kiro/specs/content-*`.
- Báo cáo định kỳ: scanner chạy CI, xuất số liệu defect còn lại theo cell.
- Cổng merge: PR đụng `content/` phải xanh toàn bộ cổng máy; nội dung mới/đổi cần Academic_Signoff.

---

## 9. Hợp nhất các spec hiện có vào chương trình

Các spec rời hiện tại trở thành **workstream con** của chương trình này (không bỏ, không làm lại):

- `content-c2-placeholder-regeneration` (reading C2-T1) — ✅ done.
- `content-c2-teil3-regeneration` (reading C2-T3) — ✅ done.
- `content-cefr-stem-regeneration` (stems) — ✅ done.
- `content-c2-teil2-regeneration` (reading C2-T2) — 🔧 đợt 1.
- `content-listening-regeneration` (listening B1–C2) — 🔧 đợt 1–2.
- (mới, đề xuất) `content-vocabulary-audit`, `content-writing-audit`, `content-speaking-grammar-audit` — đợt 3.

---

## 10. Quyết định cần CEO/CTO

1. **Duyệt mô hình chương trình** (36 cell + cổng thống nhất + 5 đợt) thay vì vá lẻ?
2. **Nguồn lực German Academic Lead** cho D7 trên 1.187 item — nội bộ hay thuê thêm reviewer bản ngữ?
3. **Ưu tiên đợt 0 (fix generator gốc)** để chặn tái sinh trước khi đổ công viết lại?
4. **Phạm vi đợt 1** — chốt 4 P0 (C2-T2 + listening C2/B2/B1) làm mốc release đầu tiên?

> READ-ONLY tới giờ: chưa ghi đè `content/`. Mọi nội dung mới do AI soạn đều ở dạng nháp AI-advisory, **chờ German Academic Lead sign-off** trước khi apply.
