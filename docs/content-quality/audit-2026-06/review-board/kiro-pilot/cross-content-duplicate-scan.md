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
