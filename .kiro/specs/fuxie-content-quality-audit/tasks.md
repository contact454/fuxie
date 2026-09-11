# Implementation Plan — Fuxie Content Quality Audit (read-only)

Vai chinh: Content QA / Linguistic Reviewer
Vai phoi hop: German Academic Lead, German Curriculum Designer, Vietnamese-German Localization Specialist, Exam Prep Specialist

## Overview

Đợt này là kiểm duyệt CHỈ-AUDIT (read-only) toàn bộ 1,194 file nội dung học (`content/`), KHÔNG sửa nội dung. Output là 4 deliverable dưới `docs/content-quality/audit-2026-06/`: `report.md`, `findings.csv`, `coverage-matrix.md`, `remediation-backlog.md`.

Luồng:

1. Snapshot hash `content/` để bảo vệ Read_Only_Invariant + lập inventory (1,194 file, 36 ô level×skill + 6 course.json).
2. Chạy Layer 1 (4 script QA sẵn có, nguyên trạng) và nhúng output.
3. Review Layer 2 theo 9 chiều D1–D9 (100% High_Risk_Zone: đáp án, exam item, compound noun, audio_file existence; sampling phân tầng phần còn lại có ghi rõ phương pháp).
4. Hợp nhất findings qua evidence gate, build 4 deliverable.
5. Viết 4 PBT tooling test (read-only, coverage, evidence gate, severity consistency) và verify `content/` không đổi.
6. Checkpoint cuối.

Quy tắc cứng: KHÔNG file nào dưới `content/` được sửa. Mọi file ghi chỉ dưới `docs/content-quality/audit-2026-06/` và `tmp/`. Mỗi finding phải evidence-gated (file_path + item_id + trích dẫn verbatim).

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": ["1"],
      "description": "Snapshot hash content/ + lap inventory + scaffold Audit_Output_Dir. Nen tang cho moi viec sau."
    },
    {
      "wave": 2,
      "tasks": ["2", "3"],
      "description": "Chay Layer 1 (4 script QA) va viet PBT tooling test (read-only, coverage, evidence-gate, severity). Doc lap, chay song song. Phu thuoc wave 1."
    },
    {
      "wave": 3,
      "tasks": ["4.1", "4.2", "4.3", "4.4", "4.5", "4.6", "4.7", "4.8", "4.9"],
      "description": "Review Layer 2 theo 9 chieu D1-D9, sinh findings tho co evidence. Cac chieu doc lap, chay song song. Phu thuoc wave 2."
    },
    {
      "wave": 4,
      "tasks": ["5"],
      "description": "Hop nhat findings qua evidence gate + build 4 deliverable. Phu thuoc wave 3."
    },
    {
      "wave": 5,
      "tasks": ["6"],
      "description": "Chay 4 PBT tooling test tren deliverable + verify content/ hash khong doi. Phu thuoc wave 4."
    },
    {
      "wave": 6,
      "tasks": ["7"],
      "description": "Checkpoint cuoi: acceptance criteria + next step. Phu thuoc wave 5."
    }
  ]
}
```

Hard ordering rules (bổ sung cho wave graph):

- Task 1 (snapshot hash + inventory) PHẢI hoàn tất trước mọi task khác — đây là baseline Read_Only_Invariant.
- Task 2 (Layer 1) PHẢI chạy trước các sub-task của Task 4 (Layer 2 review nhúng output Layer 1).
- Task 5 (deliverable) gated trên toàn bộ sub-task của Task 4.
- Task 6 (PBT verify) gated trên Task 5; phải xác nhận `content/` hash khớp snapshot Task 1.

## Tasks

- [x] 1. Snapshot Read_Only baseline + lập inventory
  - Tạo thư mục output `docs/content-quality/audit-2026-06/` và `docs/content-quality/audit-2026-06/layer1/` (chỉ ghi ở đây + `tmp/`).
  - Snapshot hash mọi file dưới `content/` vào `tmp/content-hash-before.txt` (ví dụ `Get-ChildItem -Recurse content -Filter *.json | Get-FileHash`). Đây là baseline cho Read_Only_Invariant.
  - Lập inventory read-only: đếm Content_Item theo `level × skill`, ghi `tmp/inventory.json` với `{ files, totalFiles: 1194, matrix }`. Xác minh tổng = 1,194 file (1,188 skill + 6 course.json).
  - Phân loại file-level vs item-level (vocabulary `words[]`, listening/reading `questions[]` tách item).
  - Đánh dấu trước High_Risk_Zone cho từng file: vị trí trường đáp án (`answer`/`correctIndex`/`correct`/`solution`), exam-style item, audio_file path.
  - **EVIDENCE**: ghi `tmp/inventory.json` + `tmp/content-hash-before.txt`; xác nhận count khớp baseline matrix trong design.md § Component 1.
  - _Requirements: 9.1, 12.1, 12.4, 13.1_

- [x] 2. Chạy Layer 1 Automated (reuse-only, không sửa script)
  - Chạy nguyên trạng từ workspace root và capture stdout/stderr + exit code:
    - `pnpm qa:content` → `audit-2026-06/layer1/qa-content.log`
    - `pnpm check:locale-parity` → `audit-2026-06/layer1/locale-parity.log`
    - `pnpm qa:copy-style` → `audit-2026-06/layer1/copy-style.log`
    - `pnpm qa:learning-quality` → `audit-2026-06/layer1/learning-quality.log`
  - **QUAN TRỌNG**: nếu một script fail (exit non-zero), GHI output fail nguyên trạng làm evidence — KHÔNG sửa, skip, hay weaken script (Req 10.3).
  - Đối chiếu (chỉ đọc) các báo cáo có sẵn và trích phần liên quan: `detailed_compounds_audit_report.md` (D1 compounds), `qa_report.md` (D6), `current_violations*.txt` + `parity-violations*.txt` (D4/D5 mojibake & parity), `docs/content-quality/cefr-audit-checklist.md` + `bilingual-style-guide.md` (rubric D2/D4).
  - Tổng hợp `audit-2026-06/layer1/summary.md`: mỗi script → exit code, số vi phạm, lớp lỗi phủ.
  - **EVIDENCE**: 4 log file + summary; danh sách dòng vi phạm mojibake/parity không bỏ sót (Req 4.6, 5.4).
  - _Requirements: 4.6, 5.4, 10.1, 10.2, 10.3, 13.3_

- [x] 2.1 (Phối hợp Vietnamese-German Localization Specialist) Xác nhận mojibake & parity
  - Đối chiếu output `qa:copy-style` với `current_violations*.txt` / `parity-violations*.txt`; xác nhận mọi dòng mojibake được map thành finding D4 ở Task 4.4.
  - _Requirements: 4.2, 4.6, 5.4_

- [x] 3. Viết PBT tooling test cho pipeline & deliverable (read-only guards)
  - **Property 1 (Read-Only Invariant)**: test so hash `content/` trước (từ `tmp/content-hash-before.txt`) và sau; ASSERT set hash bằng nhau + không file thêm/xóa. Đặt tại `tests/content-audit/read-only-invariant.spec.ts`.
  - **Property 2 (Coverage Completeness)**: PBT đọc `coverage-matrix.md` (hoặc `tmp/inventory.json`); ASSERT Σ files mọi ô = 1194 và mọi file thuộc đúng một ô; ô sampled có `sampleRatio`. Đặt tại `tests/content-audit/coverage-completeness.spec.ts`.
  - **Property 3 (Evidence Gate)**: PBT sinh/đọc mọi dòng `findings.csv`; ASSERT mỗi finding đủ 9 trường, `file_path` tồn tại trong inventory, `evidence` khác rỗng, `severity ∈ {P0,P1,P2}`, `dimension ∈ {D1..D9}`. Đặt tại `tests/content-audit/evidence-gate.spec.ts`.
  - **Property 4 (Severity Consistency)**: PBT đối chiếu severity của cùng `finding_id` qua `findings.csv` + `remediation-backlog.md` + heatmap; ASSERT nhất quán + hợp lệ. Đặt tại `tests/content-audit/severity-consistency.spec.ts`.
  - **NOTE**: Property 1 chạy được ngay (snapshot có từ Task 1). Property 2/3/4 sẽ đỏ cho tới khi deliverable tồn tại (Task 5) — đánh dấu `it.skip` với comment "unblocks at task 6"; KHÔNG coi là regression.
  - Dùng `vitest` + `fast-check` (đã có trong repo, theo `vitest.property.config.ts`).
  - **EVIDENCE**: 4 spec file; Property 1 pass ngay; 2/3/4 skipped chờ Task 5.
  - _Requirements: 11.1, 11.2, 11.7, 12.3_

- [x] 4. Review Layer 2 theo 9 chiều D1–D9 (sinh findings thô có evidence)

  - [x] 4.1 D1 — Chính tả & ngữ pháp tiếng Đức _(German Academic Lead sign-off)_
    - Quét 100% trường đáp án + giải thích tiếng Đức (High_Risk_Zone); sampling phân tầng phần text còn lại có ghi rõ phương pháp.
    - Kiểm: ß/umlaut, viết hoa danh từ, Genus & `article` khớp, `plural`, chia động từ, Kasus, trật tự từ.
    - Đối chiếu `detailed_compounds_audit_report.md` cho compound nouns (quét 100% vùng này).
    - Mỗi finding: `dimension=D1`, severity (Genus sai/sai đáp án → P0), evidence verbatim (word + article/câu). Borderline → đánh dấu cần Academic Lead.
    - **KHÔNG** sửa file content; recommended_fix chỉ là đề xuất văn bản.
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [x] 4.2 D2 — Đúng cấp CEFR _(German Academic Lead sign-off)_
    - Sampling phân tầng theo `level × skill`; ghi rõ kích thước mẫu + cách chọn + lý do trong coverage matrix.
    - So độ khó từ vựng/ngữ pháp + độ dài text với `docs/content-quality/cefr-audit-checklist.md`; kiểm `target_grammar`/`target_vocabulary` vs level + `course.json`.
    - Finding D2 severity P1 cho mục vượt level; borderline → đánh dấu Academic Lead.
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 4.3 D3 — Chất lượng sư phạm _(Curriculum Designer + Academic Lead sign-off)_
    - Quét 100% trường đáp án (High_Risk_Zone): xác minh đáp án đúng duy nhất; sai/mơ hồ → P0.
    - Kiểm distractor hợp lý, giải thích khớp đáp án, hướng dẫn rõ, ví dụ tự nhiên, trình tự module trong `course.json` (recognition→production, prerequisite).
    - Finding D3 với severity tương ứng; ví dụ không tự nhiên → đánh dấu Academic Lead/Content Writer.
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 4.4 D4 — Chất lượng bản dịch tiếng Việt _(Vietnamese-German Localization Specialist sign-off)_
    - Nhúng 100% kết quả mojibake từ `qa:copy-style` (Task 2.1); review chất lượng dịch bằng sampling phân tầng.
    - Kiểm: nghĩa bảo toàn (`meaningVi`, `exampleTranslation*`, `explanation.vi`), mojibake, tự nhiên, nhất quán thuật ngữ (đối chiếu `bilingual-style-guide.md`), thiếu trường VI bắt buộc.
    - Severity: dịch sai nghĩa → P1 (P0 nếu đổi hiểu đáp án); gượng → P2; thiếu field → P1.
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 4.5 D5 — Song ngữ & đầy đủ trường learner-facing _(Content QA)_
    - Quét 100% required-field theo skill (vocabulary: word/article/meaningVi/exampleSentence1/exampleTranslation1; listening question: question/options/answer/explanation.de/explanation.vi).
    - Phát hiện trường thiếu/rỗng/whitespace, locale parity gap (chỉ DE hoặc chỉ VI), speaking field drift (A1 vs A2+, đối chiếu `CHANGELOG.md`).
    - Nhúng `check:locale-parity` cho UI messages. Severity P1 cho thiếu field/parity gap.
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 4.6 D6 — Nhất quán schema & toàn vẹn dữ liệu _(Content QA)_
    - Quét 100% structural: enum (`article`, `wordType`), `correctIndex`/`answer` trong phạm vi options, id trùng, Orphan_Reference (course.json/grammar-topics.json trỏ id/file không tồn tại), audio_file existence (read-only stat).
    - Ghi 1 finding tổng hợp D6.6 cho schema field-naming drift (camelCase vs snake_case) `severity=P2`, KHÔNG đề xuất migrate.
    - Nhúng `qa:content` output + đối chiếu `qa_report.md`, không bỏ sót vi phạm.
    - Severity: index ngoài phạm vi → P0; enum sai/orphan/id trùng → P1.
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

  - [x] 4.7 D7 — Audio / script (listening & speaking) _(Academic Lead sign-off)_
    - Quét 100% audio_file existence cho item có khai báo (read-only stat); transcript vs `metadata.source_script` bằng sampling + 100% nơi nghi đổi đáp án.
    - Transcript lệch đổi đáp án → P0; audio_file thiếu → P1; pronunciation notes sai → P1/P2 (đánh dấu Academic Lead).
    - **KHÔNG** phát/transcode audio, KHÔNG sửa script source.
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 4.8 D8 — Hợp lệ đề thi (Goethe/Telc/ÖSD) _(Exam Prep Specialist sign-off)_
    - Quét 100% exam-style item (High_Risk_Zone): cấu trúc Teil (số phần/câu/loại), `task_type`/`questions[].type` khớp định dạng Teil, số item/`points` khớp đặc tả thi cho level, `examTypes` trong course.json hợp lệ.
    - Severity P1 cho lệch định dạng; **KHÔNG** khẳng định affiliation chính thức (Req 8.6).
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [x] 4.9 D9 — Độ phủ & cân bằng _(Curriculum Designer)_
    - Tổng hợp toàn Audit_Universe: lập phần coverage cho `coverage-matrix.md` (số item + số finding mỗi ô); phát hiện lỗ hổng độ phủ (ô thấp bất thường) và item trùng lặp đáng kể.
    - Severity P2 cho mất cân đối/trùng lặp; ghi số đo so sánh + `file_path` trùng.
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 5. Hợp nhất findings qua evidence gate + build 4 deliverable
  - Gom findings thô từ 4.1–4.9; chạy evidence gate (reject finding thiếu `file_path`/`item_id`/`evidence`); gán `finding_id` tuần tự duy nhất.
  - Build `docs/content-quality/audit-2026-06/`:
    - `findings.csv` — header đúng thứ tự: `finding_id,level,skill,file_path,item_id,dimension,severity,evidence,recommended_fix`; UTF-8, CSV escape đúng dấu phẩy/xuống dòng, không mojibake.
    - `coverage-matrix.md` — ma trận `level × skill` (36 ô + 6 course.json) số item + số lỗi; đánh dấu ô `sampled` kèm tỷ lệ.
    - `report.md` — tóm tắt điều hành song ngữ (VI chính) + heatmap mật độ lỗi + **đề xuất bước kế tiếp**.
    - `remediation-backlog.md` — nhóm Finding thành candidate fix-spec, ưu tiên severity, tham chiếu `finding_id`.
  - Xác minh severity nhất quán định nghĩa `docs/intake/risk-register.md` (P0/P1/P2).
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 13.2, 13.4, 13.6_

- [x] 6. Verify deliverable bằng PBT + xác nhận Read_Only_Invariant
  - **QUAN TRỌNG**: chạy lại CHÍNH các test từ Task 3 — KHÔNG viết test mới.
  - Un-skip Property 2/3/4 (giờ deliverable đã tồn tại).
  - Chạy `tests/content-audit/*.spec.ts`:
    - Property 1: hash `content/` sau == `tmp/content-hash-before.txt` (Read_Only_Invariant) → PASS bắt buộc; nếu fail → có file content bị sửa → revert + fail audit (Req 12.3).
    - Property 2: Σ files = 1194, mọi file đúng một ô.
    - Property 3: mọi dòng `findings.csv` đủ trường + evidence.
    - Property 4: severity nhất quán cross-deliverable.
  - Verify `findings.csv` parse được, UTF-8, không mojibake.
  - **EXPECTED OUTCOME**: cả 4 property PASS; `content/` không đổi.
  - _Requirements: 11.2, 11.5, 11.7, 12.3, 13.5_

- [x] 7. Checkpoint cuối — acceptance + next step
  - Xác nhận toàn bộ acceptance criteria đợt audit (Req 13): 100% Content_Item phủ ở mức Layer 1 + structural (hoặc sampling có nêu phương pháp); mọi finding có severity + evidence + recommended_fix; Layer 1 đã chạy & nhúng; locale-parity + mojibake phản ánh trong findings; coverage matrix đầy đủ; backlog ưu tiên severity; KHÔNG file content nào bị sửa.
  - Xác nhận `report.md` kết thúc bằng đề xuất bước kế tiếp (chọn nhóm P0 đầu tiên trong `remediation-backlog.md` làm spec remediation đầu tiên).
  - Dọn file tạm thừa trong `tmp/` (giữ snapshot hash nếu cần audit lại).
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

## Notes

- **Read-only đợt này**: KHÔNG sửa/thêm/xóa/format bất kỳ file nào dưới `content/`. File ghi hợp lệ chỉ dưới `docs/content-quality/audit-2026-06/` và `tmp/`. Read_Only_Invariant được verify bằng so hash trước/sau (Task 1 ↔ Task 6).
- **Reuse-first**: KHÔNG phát minh gate mới và KHÔNG sửa script QA (`scripts/content-qa.ts`, `check-locale-parity.ts`, `copy-style-audit.ts`). Script fail vẫn ghi output nguyên trạng làm evidence.
- **Evidence-gated**: mỗi finding bắt buộc có `file_path` + `item_id` + trích dẫn verbatim; finding thiếu evidence không được publish.
- **Severity** theo `docs/intake/risk-register.md`: P0 = hại người học/sai đáp án/sai tiếng Đức; P1 = lệch CEFR/dịch sai/thiếu field bắt buộc; P2 = polish.
- **Sampling**: chiều dùng lấy mẫu phải ghi rõ phương pháp + lý do + tỷ lệ trong `coverage-matrix.md`. High_Risk_Zone (đáp án, exam item, compound noun, audio_file existence) luôn quét 100%.
- **Báo cáo song ngữ, tiếng Việt là chính**; `report.md` kết thúc bằng đề xuất bước kế tiếp cho giai đoạn remediation.
- Remediation (sửa lỗi thật) là các spec follow-up sau, ngoài phạm vi đợt này.
