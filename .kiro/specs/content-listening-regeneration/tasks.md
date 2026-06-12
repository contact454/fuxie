# Implementation Plan — Listening Regeneration (B1/B2/C1/C2)

Vai chinh: German Content Writer
Vai phoi hop: German Academic Lead, German Curriculum Designer, Content QA / Linguistic Reviewer, Speech / Audio Engineer

## Overview

Regenerate listening lỗi cho 4 level (B1 44 / B2 48 / C1 52 / C2 52 file). Mỗi file lỗi: transcript thật đúng `topic`/`title`, đoạn khác nhau thật (không lặp/không copy chéo ID), câu hỏi mới bám transcript, đánh dấu re-record audio. Mỗi level: xác minh đọc → chốt danh sách → sửa từng đơn vị → Academic_Signoff → gate. Thứ tự ưu tiên: B2 → B1 → C2 → C1. Giữ schema; chỉ thay `transcript` + `questions[]` (+ metadata số đoạn, `cefrAudit.verdict`). Cổng đóng mỗi level: overlap mọi cặp < 0.5 + topic-match 100% + dupRatio nội bộ < 0.2 + đáp án verify-được.

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1"], "description": "Foundation: scan listening đa-level + apply script (dry-run, validate schema/answer/no-dup/topic) + PBT Property 1-5 + cổng. Độc lập." },
    { "wave": 2, "tasks": ["2.1"], "description": "B2: xác minh đọc + chốt Defective_File list. Phụ thuộc wave 1." },
    { "wave": 3, "tasks": ["2.2"], "description": "B2: regenerate + Academic_Signoff + gate. Phụ thuộc 2.1." },
    { "wave": 4, "tasks": ["3.1"], "description": "B1: xác minh + chốt list. Phụ thuộc wave 1." },
    { "wave": 5, "tasks": ["3.2"], "description": "B1: regenerate + gate. Phụ thuộc 3.1." },
    { "wave": 6, "tasks": ["4.1"], "description": "C2: xác minh + chốt list (gồm cấu trúc giả 52/52). Phụ thuộc wave 1." },
    { "wave": 7, "tasks": ["4.2"], "description": "C2: regenerate + gate. Phụ thuộc 4.1." },
    { "wave": 8, "tasks": ["5.1"], "description": "C1: xác minh partial-overlap + chốt list. Phụ thuộc wave 1." },
    { "wave": 9, "tasks": ["5.2"], "description": "C1: regenerate + gate. Phụ thuộc 5.1." },
    { "wave": 10, "tasks": ["6"], "description": "Verify toàn cục + đóng finding + ticket generator + handoff audio. Phụ thuộc 2.2, 3.2, 4.2, 5.2." }
  ]
}
```

Hard ordering: foundation trước; mỗi level xác minh đọc trước khi sửa; mỗi đơn vị qua Academic_Signoff + gate trước merge; verify tổng cuối.

## Tasks

- [x] 1. Foundation — scan đa-level + apply script + cổng + PBT
  - Chính thức hoá scan listening đa-level: ma trận overlap trong từng level, keyword `topic` ⊂ transcript, dupRatio nội bộ dialogue. READ-ONLY. → `scripts/lib/listening-scan.ts` (`scanListeningLevel`, `overlapScore`, `internalDupRatio`, `transcriptMatchesTopic`).
  - Tạo `scripts/apply-listening-regen.ts`: nhận id → {transcript_lines[], questions[], gespraech_count?}; `--dry-run`; validate `answer` hợp `task_type`, `key_evidence` ⊂ transcript mới, dupRatio < 0.2, keyword topic ⊂ transcript (overlap chéo < 0.5 do cổng scanner đảm bảo); giữ schema; set `transcript.status = needs_audio_rerecord` + `cefrAudit.verdict = pending_reaudit`; ghi UTF-8 no BOM.
  - Thêm `tests/content-audit/listening-regen.spec.ts` (Property 1–5): **13/13 test xanh**; `qa:content` 0 lỗi (1193 file).
  - _Requirements: 1.1, 1.4, 2.1, 3.2, 4.2, 5.1, 5.2_

- [ ] 2. B2 listening (P0, gọn)
  - [x] 2.1 Xác minh đọc + chốt Defective_File (B2)
    - Đọc trực tiếp cặp ~exact (`001≡011`, `002≡012`, 4 Teil) + 11 file topic-mismatch; chốt danh sách sửa.
    - **Kết quả:** đọc trực tiếp `001-T1≡011-T1` (transcript giống hệt, 011 khai sai topic "Schlafforschung"). Chốt **20 file Defective_File** → `b2-defective-files.md`. Còn chờ German Academic Lead xác nhận đủ (Req 7.2).
    - _Requirements: 7.1, 7.2_
  - [ ] 2.2 Regenerate B2 + Academic_Signoff + gate
    - Viết Real_Transcript đúng chủ đề + câu hỏi mới từng file lỗi; đoạn khác nhau thật; Academic_Signoff; apply (dry-run→ghi); Audio_Restubbing; qa:content + PBT xanh.
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 5.2, 5.3, 5.5, 6.1, 6.2_

- [ ] 3. B1 listening (P0, gọn)
  - [ ] 3.1 Xác minh đọc + chốt Defective_File (B1)
    - Đọc cặp `001≡011` (4 Teil) + 14 file topic-mismatch; chốt danh sách.
    - _Requirements: 7.1, 7.2_
  - [ ] 3.2 Regenerate B1 + Academic_Signoff + gate
    - Như 2.2.
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 5.2, 5.3, 5.5, 6.1, 6.2_

- [ ] 4. C2 listening (P0/P1, nặng nhất)
  - [ ] 4.1 Xác minh đọc + chốt Defective_File (C2)
    - Đọc cặp `001..008 ≡ 011..018` + 29 topic-mismatch + cấu trúc "5 Sendungen" giả (52/52); chốt danh sách.
    - _Requirements: 7.1, 7.2_
  - [ ] 4.2 Regenerate C2 + Academic_Signoff + gate
    - Như 2.2, thêm: bỏ cấu trúc "N Sendungen" giả (tạo N đoạn khác nhau hoặc chỉnh số đoạn). Lưu ý cặp nguồn/đích phải khác hẳn.
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 5.2, 5.3, 5.5, 6.1, 6.2_

- [ ] 5. C1 listening (P1/P2, partial-overlap)
  - [ ] 5.1 Xác minh đọc partial-overlap + chốt Defective_File (C1)
    - Đọc 8 cặp overlap 0.5–0.95 + 7 topic-mismatch; loại file đủ khác biệt hợp lệ khỏi danh sách (tránh sửa nhầm).
    - _Requirements: 7.1, 7.2, 7.3, 1.3_
  - [ ] 5.2 Regenerate C1 (chỉ file đã chốt) + Academic_Signoff + gate
    - Như 2.2.
    - _Requirements: 1.1, 1.3, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 5.2, 5.3, 5.5, 6.1, 6.2_

- [ ] 6. Verify toàn cục + đóng finding + handoff
  - Mỗi level: ma trận overlap < 0.5 (Property 1); keyword topic ⊂ transcript (Property 2); dupRatio nội bộ < 0.2 (Property 3); answer hợp task_type + key_evidence ⊂ transcript (Property 4).
  - `qa:content` exit 0; `tests/content-audit/*` xanh; listening A1/A2 + skill khác byte-identical (Property 5).
  - Mọi file đổi transcript đánh dấu Audio_Restubbing; cập nhật `cefrAudit.verdict`.
  - Đóng finding trong `cross-content-duplicate-scan.md` (tham chiếu commit); mở ticket riêng cho AI/CTO sửa generator gốc; handoff danh sách file cho Speech/Audio Engineer re-record MP3.
  - _Requirements: 1.1, 2.1, 3.2, 4.2, 5.1, 5.4, 5.5, 6.3, 6.4, 6.6_

## Notes

- **Gom 4 level một spec** (cùng bug generator) — apply-script + cổng + PBT dùng chung, khác dữ liệu mỗi level.
- **Xác minh đọc trực tiếp trước** khi chốt phạm vi mỗi level (C1 partial dễ false-positive).
- **Viết lại CẢ transcript lẫn câu hỏi**; theo đúng định dạng Goethe từng level + Teil.
- **Chống 3 lớp lỗi**: không trùng chéo ID (overlap < 0.5), đúng chủ đề (topic ⊂ transcript), không lặp vòng (dupRatio < 0.2).
- **Audio MP3** không render trong spec — chỉ đánh dấu re-record + handoff Speech/Audio Engineer.
- **Giữ schema**; validate trước khi ghi.
- **Thứ tự**: B2 → B1 (gọn, đóng P0 sớm) → C2 (nặng) → C1 (partial). Quy mô lớn; cần German Academic Lead duyệt thực chất.
- **Generator gốc** xử lý ở ticket riêng.
