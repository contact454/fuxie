# Kiro-agent — Quét placeholder/trùng lặp TOÀN BỘ content (READ-ONLY)

Vai chinh: Content QA / Linguistic Reviewer · Vai phoi hop: German Academic Lead, AI / LLM Engineer

Công cụ: `scripts/scan-content-placeholders.ts` (tái dùng được, READ-ONLY). Quét mọi `content/**/*.json`, phát hiện (1) generic-filler opener đã biết, (2) thân bài near-duplicate (≥200 ký tự, khớp 80 ký tự normalized đầu) — dấu hiệu filler do generator.

## Kết quả (dot 2026-06)

- **Generic-filler opener còn lại: 0** trên toàn repo → 2 họ filler (C2-T1 "Der vorliegende Kommentar…" + C2-T3 "Der wissenschaftliche Diskurs…") đã remediate trọn vẹn.
- **Near-duplicate body: 156 nhóm / 141 file.** Phân bố:

| skill/level | số file dính nhóm trùng |
| --- | --- |
| c2/listening | 44 |
| c1/writing | 35 |
| c2/writing | 35 |
| b2/reading | 14 |
| c2/reading | 7 |
| a2/reading | 2 |
| c1/listening | 2 |
| b1/writing | 1 |
| b2/writing | 1 |

## Phân tích sơ bộ (chưa xác nhận — cần người duyệt)

### Cập nhật: xác minh chi tiết c2/listening (so transcript đầy đủ)
So khớp **toàn bộ** transcript 52 file c2/listening (không chỉ 80 ký tự đầu):
- **Trùng 100% (identical): 0 cặp.** → KHÔNG có file nghe bị nhân bản y hệt.
- **Trùng đoạn lớn (54–81% verbatim overlap): nhiều cặp theo mẫu lesson N ↔ N+10** — vd `003-T1 ↔ 013-T1` (~81%), `004-T1 ↔ 014-T1` (~78%), `006-T1 ↔ 016-T1` (~78%), `005-T3 ↔ 015-T3` (~63%), `002-T3 ↔ 012-T3` (~62%), `007-T3 ↔ 017-T3` (~54%)…
- **Diễn giải:** block GOETHE-011…020 chia sẻ phần lớn transcript với 001…010 (cùng chủ đề + nhiều câu verbatim) nhưng đã được sửa đổi một phần. Mức **nghi P2–P1** tuỳ độ giống: học viên có thể gặp lại phần lớn nội dung nghe ở 2 ID. **Cần người rành tiếng Đức đọc từng cặp** để quyết: (a) đủ khác biệt → giữ; (b) gần trùng → regenerate bộ 011–020.

> Lưu ý phương pháp: overlap đo bằng prefix-substring xấp xỉ, KHÔNG phải diff chuẩn. Là tín hiệu sàng lọc, không phải kết luận. Đây là việc đọc-hiểu cần con người.

### ✅ Đã đọc trực tiếp (Kiro-agent) — XÁC NHẬN P0/P1 thật
Đọc cặp `003-T1 ↔ 013-T1`:
- **L-C2-GOETHE-013-T1 — P0 SAI CHỦ ĐỀ:** `topic`/`title`/`audio_file`/`learningOutcomes` khai báo **"Reformpädagogik in der Praxis"**, nhưng `transcript` là **y nguyên đoạn về "Berliner Mauer in Schulbüchern" của 003-T1** (copy). Câu hỏi của 013 (gds_h_01..03) lại đúng về Mauer → khớp transcript nhưng KHÔNG khớp topic của chính file. Cùng họ defect placeholder như C2 reading.
- **L-C2-GOETHE-003-T1 — P1 cấu trúc + câu hỏi lạc đề:** transcript khai "Sie hören fünf Radiosendungen" + nhãn "Sendung 1–5" nhưng thực chất là **một đoạn monolog Mauer lặp vòng** (không phải 5 bản tin khác nhau). Câu hỏi Q1/Q3/Q4 hỏi "Die Person kommt aus Köln/Frankreich/Konstanz" — **hoàn toàn lạc đề** với monolog học thuật về sách giáo khoa; `key_evidence` = "Die Berliner Mauer" (filler). Q2 "Schulbüchern wird erwähnt" tầm thường.

→ **Kết luận:** bộ c2/listening có **3 lớp defect**: (a) transcript nhân bản giữa các ID (block N+10 copy block N), (b) topic/title không khớp transcript, (c) câu hỏi lạc đề + cấu trúc "5 Sendungen" giả. Đây là defect nội dung thật, mức **P0/P1**, cần **spec regenerate listening riêng** (tương tự `content-c2-placeholder-regeneration`), KHÔNG vá nhanh được. Quy mô thật cần quét toàn bộ 52 file c2/listening (và có thể các level khác).


## Phân tích bổ sung (các skill khác)

- **c2/listening (44 file): NGHI VẤN CAO.** Các cặp như `L-C2-GOETHE-007 ≡ 017`, `008 ≡ 018` chia sẻ **nguyên đoạn transcript** (vd về "algorithmische Empfehlungssysteme", "unsichtbarer Schnitt"). Giống mẫu nhân bản lesson (block 001–010 bị copy thành 011–020?). Nếu đúng → học viên gặp lại y nguyên bài nghe ở 2 ID khác nhau. **Mức nghi P1.**
- **c1/writing + c2/writing (70 file): CẦN KIỂM TRA.** Có thể là **false positive** — đề bài Schreiben (Aufgabenstellung/Anweisung) thường dùng chung khung dài giống nhau hợp lệ. Phải đọc field cụ thể (instruction vs Musterlösung) trước khi kết luận.
- **b2/reading (14), a2/reading (2):** rải rác; b2-reading có thể là phần đề bài/khung lặp; cần soi từng cặp.
- **c2/reading (7):** dư âm cùng đoạn dẫn — cần xác nhận đã sạch sau remediation (C2-T1/T3 đã viết lại; 7 file này có thể là các đoạn ngắn lặp hợp lệ).

## Đề xuất

1. **Ưu tiên xác minh c2/listening 44 file** (đọc transcript từng cặp). Nếu xác nhận nhân bản → mở spec regenerate listening tương tự cách đã làm reading.
2. Lọc false-positive ở writing: tinh chỉnh scanner để **chỉ so khớp field nội dung học** (vd `essay.text`, `article.text`, transcript) thay vì mọi chuỗi ≥200 ký tự (đề bài/khung dùng chung là hợp lệ).
3. Cắm scanner vào quy trình QA định kỳ; mở rộng `GENERIC_OPENERS` khi phát hiện khuôn mới.

> READ-ONLY: scan không sửa content. Đây là danh sách ứng viên cần người rành tiếng Đức xác nhận, KHÔNG phải defect đã chốt. Generator gốc xem ticket `TICKET-content-generator-filler-rootcause.md`.

## Quét sâu TOÀN BỘ content (1.187 file) — overlap thật theo skill/level

Phương pháp nâng cấp: thay vì khớp 80 ký tự prefix, đo **overlap transcript/article thật** (cửa sổ 60 ký tự chuẩn hoá, bỏ nhãn narrator ở listening) + dupRatio nội bộ. Quét 1.187 file content.

### Bảng tổng (chỉ nhóm có defect)

| skill/level | files | cặp dup (≥0.5) | cặp ~exact (≥0.95) | file dính | idup nội bộ ≥0.3 |
| --- | --- | --- | --- | --- | --- |
| **c2/listening** | 52 | 22 | **22** | 44 | **52** |
| **c2/reading** | 48 | 87 | **11** | 19 | 0 |
| **b2/listening** | 48 | 8 | **8** | 16 | 0 |
| **c1/listening** | 52 | 8 | 0 | 16 | 0 |
| a1/writing | 35 | 45 | 0 | 10 | 0 |
| **b1/listening** | 44 | 4 | **4** | 8 | 0 |

(Các nhóm còn lại: 0 cặp — reading A1/A2/B1/B2/C1, writing A2/B1/B2/C1/C2, vocabulary, grammar, speaking đều sạch theo phép đo này.)

### Đặc tả cặp ~exact (đã in từng cặp)

- **c2/reading — 11 cặp ~0.95, TẤT CẢ ở Teil 2** (hội tụ về `C2-T2-012`, thêm `C2-T2-007↔009`). → **Teil 2 reading CHƯA từng remediate** (đợt trước chỉ làm C2-T1-005..012 + C2-T3-001..012). Đây là **cụm filler thật còn sót ở Teil 2**, cùng họ defect placeholder. **Mức P0** (cần xác minh đọc trực tiếp như đã làm T1/T3).
- **b2/listening — 8 cặp overlap = 1.00:** `L-B2-GOETHE-001-T{1,2,3,4} ≡ 011-T{1,2,3,4}` và `002 ≡ 012` (cả 4 Teil). Mẫu **N↔N+10 copy verbatim** y như c2/listening. **Mức P0.**
- **b1/listening — 4 cặp overlap = 1.00:** `L-B1-GOETHE-001-T{1,2,3,4} ≡ 011-T{1,2,3,4}`. Cùng bug. **Mức P0** (quy mô có thể lớn hơn 4 cặp đo được; cần quét đủ block).
- **c1/listening — 8 cặp 0.5–0.95 (0 exact):** overlap một phần, **mức P1/P2**, cần đọc xác minh.
- **a1/writing — 45 cặp, 0 exact:** nhiều khả năng **false positive** (đề/khung Schreiben A1 dùng chung hợp lệ). Cần đọc field cụ thể trước khi kết luận; tạm **không phải defect**.

### Kết luận quy mô thật (cập nhật)

Bug generator "transcript nhân bản N↔N+10" **KHÔNG chỉ ở C2** — lan **B1, B2, C1, C2 listening**. Và **C2 reading Teil 2** có cụm filler riêng chưa xử lý. Tổng ước tính cần remediate (đã trừ false-positive writing):

| Hạng mục | Mức | Quy mô ước tính |
| --- | --- | --- |
| c2/listening (3 lớp lỗi) | P0/P1 | 52 file — đã mở spec `content-c2-listening-regeneration` |
| c2/reading Teil 2 filler | P0 | ~12+ file (C2-T2-*) — CHƯA có spec |
| b2/listening N↔N+10 | P0 | ≥16 file (block 011–020 copy 001–010?) — CHƯA có spec |
| b1/listening N↔N+10 | P0 | ≥8 file — CHƯA có spec |
| c1/listening partial overlap | P1/P2 | ~16 file — cần xác minh |
| a1/writing | (false-pos?) | 10 file — cần đọc xác nhận, có thể không sửa |

> READ-ONLY: số liệu từ phép đo overlap xấp xỉ, là tín hiệu sàng lọc. Cặp ~exact (≥0.95) là bằng chứng mạnh; cặp 0.5–0.95 cần người đọc xác nhận. Chưa người rành tiếng Đức duyệt. Generator gốc xem ticket `TICKET-content-generator-filler-rootcause.md`.
