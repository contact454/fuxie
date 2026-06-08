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

- **c2/listening (44 file): NGHI VẤN CAO.** Các cặp như `L-C2-GOETHE-007 ≡ 017`, `008 ≡ 018` chia sẻ **nguyên đoạn transcript** (vd về "algorithmische Empfehlungssysteme", "unsichtbarer Schnitt"). Giống mẫu nhân bản lesson (block 001–010 bị copy thành 011–020?). Nếu đúng → học viên gặp lại y nguyên bài nghe ở 2 ID khác nhau. **Mức nghi P1.**
- **c1/writing + c2/writing (70 file): CẦN KIỂM TRA.** Có thể là **false positive** — đề bài Schreiben (Aufgabenstellung/Anweisung) thường dùng chung khung dài giống nhau hợp lệ. Phải đọc field cụ thể (instruction vs Musterlösung) trước khi kết luận.
- **b2/reading (14), a2/reading (2):** rải rác; b2-reading có thể là phần đề bài/khung lặp; cần soi từng cặp.
- **c2/reading (7):** dư âm cùng đoạn dẫn — cần xác nhận đã sạch sau remediation (C2-T1/T3 đã viết lại; 7 file này có thể là các đoạn ngắn lặp hợp lệ).

## Đề xuất

1. **Ưu tiên xác minh c2/listening 44 file** (đọc transcript từng cặp). Nếu xác nhận nhân bản → mở spec regenerate listening tương tự cách đã làm reading.
2. Lọc false-positive ở writing: tinh chỉnh scanner để **chỉ so khớp field nội dung học** (vd `essay.text`, `article.text`, transcript) thay vì mọi chuỗi ≥200 ký tự (đề bài/khung dùng chung là hợp lệ).
3. Cắm scanner vào quy trình QA định kỳ; mở rộng `GENERIC_OPENERS` khi phát hiện khuôn mới.

> READ-ONLY: scan không sửa content. Đây là danh sách ứng viên cần người rành tiếng Đức xác nhận, KHÔNG phải defect đã chốt. Generator gốc xem ticket `TICKET-content-generator-filler-rootcause.md`.
