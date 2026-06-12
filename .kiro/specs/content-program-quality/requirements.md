# Requirements Document

Vai chinh: Project Manager / Delivery Manager
Vai phoi hop: Content QA / Linguistic Reviewer, German Academic Lead, German Curriculum Designer, AI / LLM Engineer, CTO / Tech Lead, Speech / Audio Engineer

## Introduction

Đợt audit 2026-06 phát hiện nhiều cụm defect nội dung do generator (filler placeholder, transcript nhân bản, topic mismatch, cấu trúc giả, broken-stem) trên reading + listening. Việc xử lý tới nay diễn ra **lắt nhắt theo từng cụm** (mỗi defect một spec), khó kiểm soát tổng thể và không bao phủ các module chưa quét sâu.

Spec này nâng việc remediation lên **mức chương trình (program)**: một khung quản lý chất lượng + remediation duy nhất cho **toàn bộ 1.187 item content của Fuxie, 6 module × 6 level (A1–C2) = 36 cell**. Mục tiêu: một inventory, một bộ cổng QA deterministic chạy CI, một bảng theo dõi 36 cell, một định nghĩa "Done" thống nhất, và một lộ trình theo đợt — đồng thời **hợp nhất** các spec remediation hiện có thành workstream con (không bỏ, không làm lại).

Nguồn sự thật: `docs/content-quality/audit-2026-06/content-remediation-master-plan.md` (kế hoạch tổng + inventory + taxonomy + lộ trình + governance).

Inventory thật (đếm 2026-06):

| level | reading | listening | writing | speaking | vocabulary | grammar | TỔNG |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| A1 | 30 | 32 | 35 | 10 | 21 | 1 | 129 |
| A2 | 40 | 40 | 35 | 8 | 26 | 1 | 150 |
| B1 | 50 | 44 | 50 | 6 | 42 | 1 | 193 |
| B2 | 50 | 48 | 40 | 10 | 60 | 1 | 209 |
| C1 | 48 | 52 | 35 | 8 | 75 | 1 | 219 |
| C2 | 48 | 52 | 35 | 6 | 145 | 1 | 287 |
| **TỔNG** | **266** | **268** | **230** | **48** | **369** | **6** | **1187** |

Phạm vi (in-scope):

- Khung quản lý 36 cell: bảng trạng thái, cổng máy (D1–D6), Academic_Signoff (D7), audio (listening).
- Một CLI cổng QA thống nhất chạy CI trên mọi module/level.
- Lộ trình 5 đợt + governance + định nghĩa Done từng module.
- Điều phối (không thay thế) các spec con remediation đã/đang chạy.

Phạm vi (out-of-scope):

- KHÔNG tự viết lại nội dung học thuật trong spec này (việc đó ở các spec con + cần German Academic Lead).
- KHÔNG render audio MP3 (stream Speech/Audio Engineer).
- KHÔNG thay thế quy trình của các spec con đã hoàn thành.

## Glossary

- **Cell**: một ô (module × level), vd `reading/C2`, `listening/B2`. 36 cell tổng.
- **Defect taxonomy D1–D7**: D1 filler opener, D2 nội dung nhân bản, D3 topic mismatch, D4 cấu trúc giả, D5 broken-stem, D6 đáp án không xác minh được, D7 chất lượng học thuật/ngữ pháp (chỉ người duyệt).
- **Cổng máy (machine gate)**: tập kiểm deterministic D1–D6 chạy tự động (CI).
- **Academic_Signoff (D7)**: German Academic Lead duyệt nội dung thật — bắt buộc, không tự động hoá.
- **Done (máy)**: cell xanh toàn bộ D1–D6. **Done (đủ)**: thêm Academic_Signoff (+ audio nếu listening).
- **Status_Board**: bảng trạng thái 36 cell (machine / academic / audio / status).
- **Workstream con**: một spec remediation cụ thể (vd `content-listening-regeneration`) chạy dưới chương trình.

## Requirements

### Requirement 1: Inventory & bảng trạng thái 36 cell

**User Story:** As a Project Manager, I want một bảng trạng thái duy nhất cho 36 cell, so that toàn bộ tiến độ content kiểm soát được tại một chỗ.

#### Acceptance Criteria

1. THE chương trình SHALL duy trì Status_Board liệt kê đủ 36 cell (6 module × 6 level) với cột `qa_machine`, `academic_signoff`, `audio` (nếu listening), `status`.
2. THE Status_Board SHALL khớp inventory thật (tổng 1.187 item) và được tạo/cập nhật từ scanner, không nhập tay thủ công số liệu defect.
3. WHEN một cell đổi trạng thái, THE Status_Board SHALL phản ánh được nguồn (spec con / commit) tương ứng.

### Requirement 2: Cổng QA deterministic thống nhất (D1–D6)

**User Story:** As a Content QA Reviewer, I want một CLI cổng QA chạy mọi module/level, so that defect máy-bắt-được bị chặn nhất quán.

#### Acceptance Criteria

1. THE chương trình SHALL cung cấp cổng deterministic cho: D1 (GENERIC_OPENER/_T2 = 0), D2 (overlap nội dung trong cell < 0.5), D3 (keyword topic ⊂ nội dung), D4 (dupRatio nội bộ listening < 0.2), D5 (BROKEN_STEM_MARKERS = 0), D6 (key_evidence ⊂ nội dung + answer hợp lệ).
2. THE các cổng SHALL tái dùng single-source-of-truth đã có (`apply-c2-article-regen`, `apply-c2-teil2-regen`, `lib/cefr-stem-markers`, `lib/listening-scan`) — KHÔNG định nghĩa lại marker/logic.
3. WHEN cổng chạy trên một cell, THE kết quả SHALL phân loại theo D1–D6 + liệt kê file vi phạm.
4. WHEN PR đụng `content/`, THE cổng máy SHALL chạy trong CI và chặn merge nếu có vi phạm D1–D6 mới.

### Requirement 3: Academic_Signoff (D7) bắt buộc

**User Story:** As a German Academic Lead, I want mỗi cell có nội dung mới/đổi phải qua sign-off, so that chất lượng học thuật + ngữ pháp Đức được đảm bảo trước khi ship.

#### Acceptance Criteria

1. THE một cell SHALL chỉ đạt "Done (đủ)" khi có Academic_Signoff (D7) ngoài cổng máy (D1–D6).
2. THE nội dung do AI soạn SHALL được đánh dấu "AI-advisory, pending German Academic Lead sign-off" cho tới khi có sign-off.
3. IF một cell chưa có Academic_Signoff, THEN nội dung mới của cell đó SHALL không được apply vào `content/` để release.
4. THE chương trình SHALL ghi nhận rõ rằng D7 là nút thắt nguồn lực con người, không tự động hoá được.

### Requirement 4: Lộ trình theo đợt & ưu tiên rủi ro

**User Story:** As a Delivery Manager, I want lộ trình 5 đợt rõ ràng, so that làm theo thứ tự ưu tiên rủi ro thay vì lắt nhắt.

#### Acceptance Criteria

1. THE chương trình SHALL theo 5 đợt: Đợt 0 (hạ tầng + fix generator gốc), Đợt 1 (đóng P0 đã xác nhận), Đợt 2 (xác minh phần nghi + đọc mẫu cell "sạch máy"), Đợt 3 (audit D7 toàn diện + audio), Đợt 4 (chốt + phòng ngừa).
2. THE Đợt 0 SHALL không phụ thuộc German Academic Lead (chỉ kỹ thuật) để chạy được ngay.
3. THE việc fix generator gốc (ticket 5 cụm) SHALL nằm trong Đợt 0 để chặn tái sinh trước khi đổ công viết lại.
4. THE mỗi đợt SHALL có tiêu chí hoàn thành đo được (số cell đạt Done, defect còn lại theo scanner).

### Requirement 5: Hợp nhất spec con & không trùng lặp

**User Story:** As a Project Manager, I want các spec remediation hiện có trở thành workstream con, so that không bỏ phí công đã làm và không làm lại.

#### Acceptance Criteria

1. THE chương trình SHALL tham chiếu các spec con hiện có (`content-c2-placeholder-regeneration`, `content-c2-teil3-regeneration`, `content-cefr-stem-regeneration`, `content-c2-teil2-regeneration`, `content-listening-regeneration`) + trạng thái của chúng.
2. THE chương trình SHALL chỉ định spec con mới cho các cell chưa có chủ (vd vocabulary, writing, speaking/grammar audit) thay vì gộp việc viết nội dung vào spec chương trình.
3. THE cổng máy + Status_Board SHALL áp dụng đồng nhất cho cả spec con cũ và mới.

### Requirement 6: Governance, READ-ONLY & truy vết

**User Story:** As a CTO, I want chương trình minh bạch và an toàn, so that không nội dung tốt nào bị phá và mọi thay đổi truy vết được.

#### Acceptance Criteria

1. WHILE chưa có Academic_Signoff, THE chương trình SHALL giữ `content/` READ-ONLY (chỉ nháp AI-advisory ngoài `content/`).
2. THE mọi thay đổi content SHALL theo từng đơn vị review + commit truy vết được + revert được.
3. THE chương trình SHALL xuất báo cáo định kỳ (scanner CI) về defect còn lại theo cell.
4. THE artifact sinh tự động (sw.js, report json) SHALL KHÔNG bị auto-commit; báo cáo cho owner.
