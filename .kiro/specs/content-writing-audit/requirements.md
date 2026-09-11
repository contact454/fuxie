# Requirements Document

Vai chinh: German Content Writer
Vai phoi hop: German Academic Lead, German Curriculum Designer, Content QA / Linguistic Reviewer

## Introduction

Status_Board (`content-program-quality`) chạy cổng máy phát hiện cell **writing/A1** dính D2 (duplicate). Đọc trực tiếp xác minh: nhiều bài Schreiben Teil-1 A1 dùng **`modelAnswer` (Musterlösung) giống hệt nhau** dù khác topic — vd W-A1-T1-001 (topic "Deutschkurs") và W-A1-T1-002 (topic "Bibliothek") đều có cùng bộ dữ liệu giả "Familienname: Nguyen, Vorname: Linh, Geburtsdatum: 01.01.1998, Adresse: Hauptstrasse 12…". Học viên thấy cùng một đáp án mẫu cho các tình huống điền form khác nhau (đăng ký khoá học vs thẻ thư viện) → defect nội dung.

Spec này audit + remediate module **writing toàn bộ 6 level (A1–C2, 230 bài)**: (1) sửa cụm modelAnswer dùng chung đã xác nhận ở A1, (2) quét đủ writing các level để tìm cụm tương tự, (3) thiết lập tiêu chí chất lượng writing (đề bài + Musterlösung + rubric) cho cổng máy + Academic_Signoff. Là workstream con của chương trình `content-program-quality`.

Inventory writing: A1 35 · A2 35 · B1 50 · B2 40 · C1 35 · C2 35 = **230 bài**.

Source-of-truth:
- `docs/content-quality/audit-2026-06/content-remediation-master-plan.md` (chương trình tổng).
- `docs/content-quality/audit-2026-06/status-board.json` (cell writing/A1 defect).
- `scripts/content-quality-gate.ts` (cổng D1–D6) + `scripts/content-status-board.ts`.
- `content/{a1..c2}/writing/*.json` (230 bài target + schema).
- `docs/content-quality/cefr-audit-checklist.md` (writing: đề bài + Musterlösung đúng level).

Phạm vi (in-scope):
- Sửa modelAnswer dùng chung ở writing/A1 (mỗi topic một Musterlösung riêng, dữ liệu phù hợp tình huống).
- Quét đủ 230 bài writing tìm cụm modelAnswer/instruction trùng bất hợp lệ.
- Tiêu chí writing cho cổng + Academic_Signoff.

Phạm vi (out-of-scope):
- KHÔNG đụng module khác (reading/listening/vocabulary/grammar/speaking).
- Khung đề (Aufgabenstellung/instruction) dùng chung HỢP LỆ giữa các bài cùng Teil KHÔNG tính là defect — chỉ Musterlösung/nội dung học trùng mới tính.
- KHÔNG sửa generator gốc (ticket riêng).

## Glossary

- **Shared_ModelAnswer**: nhiều bài writing khác topic dùng chung `modelAnswer` (cùng dữ liệu giả) — defect.
- **Legit_Shared_Frame**: phần đề bài/khung (instruction, formFields nhãn) dùng chung hợp lệ giữa các bài cùng Teil — KHÔNG phải defect.
- **Real_ModelAnswer**: Musterlösung mới đúng topic + tình huống + level, dữ liệu phù hợp ngữ cảnh.
- **Academic_Signoff**: German Academic Lead duyệt đề bài + Musterlösung + rubric đúng level + đúng tiếng Đức.

## Requirements

### Requirement 1: Loại bỏ modelAnswer dùng chung (writing/A1 + cụm phát hiện)

**User Story:** As a German Content Writer, I want mỗi bài writing có Musterlösung riêng phù hợp topic, so that học viên không thấy cùng đáp án mẫu cho các tình huống khác nhau.

#### Acceptance Criteria

1. WHEN spec đóng, THE không cặp bài writing nào (cùng level) SHALL có `modelAnswer` trùng (overlap nội dung chuẩn hoá ≥ 0.5) trừ khi khung là Legit_Shared_Frame được xác nhận.
2. THE các bài A1 Teil-1 đã phát hiện (W-A1-T1-*) SHALL có Real_ModelAnswer đúng topic (Deutschkurs, Bibliothek… dữ liệu phù hợp).
3. THE việc phân biệt Shared_ModelAnswer (defect) vs Legit_Shared_Frame (hợp lệ) SHALL do người (Content QA + Academic) xác nhận, không chỉ máy.

### Requirement 2: Quét đủ writing 6 level

**User Story:** As a Content QA Reviewer, I want quét đủ 230 bài writing, so that không bỏ sót cụm trùng ở level khác.

#### Acceptance Criteria

1. THE cổng máy SHALL chạy D2 (duplicate modelAnswer) trên đủ 230 bài writing 6 level.
2. THE kết quả SHALL phân loại theo cell + liệt kê cặp trùng để người xác minh.
3. IF phát hiện cụm trùng mới, THEN cụm đó SHALL được thêm vào worklist.

### Requirement 3: Tiêu chí chất lượng writing + bảo toàn schema

**User Story:** As a German Academic Lead, I want tiêu chí Done cho writing + chỉ field nội dung thay, so that gate đo đúng và schema không vỡ.

#### Acceptance Criteria

1. THE mỗi bài đạt Done SHALL có: đề bài rõ đúng level, Musterlösung đúng topic + đạt độ dài/min-max words, rubric hợp lệ.
2. THE chỉ `modelAnswer` (và field nội dung học liên quan) SHALL thay; schema (`id`, `teil`, `rubric`, `formFields`, `cefrAudit`, `learningOutcomes`…) giữ.
3. WHEN `pnpm qa:content` chạy sau spec, THE gate SHALL exit 0; `tests/content-audit/*` xanh.
4. THE `cefrAudit.verdict` cũ SHALL cập nhật phản ánh trạng thái mới.

### Requirement 4: Review gate + truy vết

**User Story:** As a Project Manager, I want mỗi bài qua Academic_Signoff, so that writing đạt chuẩn trước khi ship.

#### Acceptance Criteria

1. THE mỗi Real_ModelAnswer SHALL qua Academic_Signoff trước khi đạt.
2. THE công việc SHALL theo từng cell/đơn vị, mỗi đơn vị qua gate trước khi sang.
3. WHEN hoàn tất, THE cell writing trong Status_Board + signoff-manifest SHALL cập nhật.
4. IF còn bài chưa Academic_Signoff, THEN bài đó SHALL không merge để release.
