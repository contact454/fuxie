# B2 Listening — Defective_File worklist (Task 2.1)

Vai chinh: Content QA / Linguistic Reviewer · Vai phoi hop: German Academic Lead

Xác minh đọc trực tiếp (Req 7) + scan overlap/topic. **Đã đọc trực tiếp** cặp `001-T1 ≡ 011-T1`: transcript **giống hệt 100%** (cùng đoạn "Ernährung der Zukunft / Insekten als Nahrungsmittel"), nhưng 011-T1 khai `topic = "Schlafforschung und Gesundheit"` → vừa nhân bản verbatim vừa sai topic. Xác nhận P0.

## Defective_File B2 (20 / 48 file)

### Lớp A — transcript nhân bản verbatim (overlap = 1.00), 16 file
Mẫu N↔N+10, cả 4 Teil:

| Nguồn | Bản sao | Teil |
| --- | --- | --- |
| L-B2-GOETHE-001-T1..T4 | L-B2-GOETHE-011-T1..T4 | T1–T4 |
| L-B2-GOETHE-002-T1..T4 | L-B2-GOETHE-012-T1..T4 | T1–T4 |

### Lớp B — topic↔transcript mismatch, 11 file (giao một phần với lớp A)
`002-T1`, `002-T4` (Alternative Wohnformen), `003-T3` (Arbeitstechniken und Konzentration), `004-T3` (Praktikumserfahrungen im Studium), `008-T3`, `008-T4` (Prüfungsangst bewältigen), `011-T2`, `011-T3` (Schlafforschung), `012-T1`, `012-T2`, `012-T4` (Künstliche Intelligenz im Alltag).

> Lưu ý: `011-*` và `012-*` vừa là bản sao của `001-*`/`002-*` (lớp A) vừa khai topic mới không khớp transcript copy (lớp B) — đây chính là cơ chế defect: block 011/012 được gán topic mới nhưng nhét lại transcript cũ.

### UNION Defective_File B2 (20 file)
```
L-B2-GOETHE-001-T1, 001-T2, 001-T3, 001-T4,
L-B2-GOETHE-002-T1, 002-T2, 002-T3, 002-T4,
L-B2-GOETHE-003-T3, 004-T3, 008-T3, 008-T4,
L-B2-GOETHE-011-T1, 011-T2, 011-T3, 011-T4,
L-B2-GOETHE-012-T1, 012-T2, 012-T3, 012-T4
```

## Hướng xử lý (Task 2.2)
- `011-*`, `012-*`: viết transcript MỚI đúng topic khai báo (Schlafforschung, KI im Alltag) — KHÔNG copy `001-*`/`002-*`.
- `001-*`, `002-*`: giữ chủ đề gốc (Ernährung der Zukunft, Alternative Wohnformen) nhưng kiểm lại topic khai báo có khớp transcript không; nếu lệch thì sửa transcript hoặc topic theo Academic_Signoff.
- `003-T3`, `004-T3`, `008-T3/T4`: chỉ lệch topic (không thuộc cặp copy) — viết lại transcript đúng topic khai báo.
- Mỗi file: câu hỏi mới bám transcript + đánh dấu Audio_Restubbing; overlap chéo < 0.5; dupRatio nội bộ < 0.2.

> AI-advisory, READ-ONLY: danh sách từ scan + 1 cặp đọc trực tiếp. Cần German Academic Lead xác nhận đủ trước khi viết nội dung (Req 7.2).
