# Rubric — Duyệt lời giải Reading (4 chiều)

Vai chinh: Content QA / Linguistic Reviewer
Vai phoi hop: German Academic Lead, Vietnamese-German Localization Specialist

> Áp cho từng item trong `sample-review.csv`. Mỗi item chấm 4 chiều. `verdict` tổng của item = chiều xấu nhất (fail > fix > pass).

## Thang verdict mỗi item

- **pass** — cả 4 chiều đạt.
- **fix** — có lỗi nhỏ (P2) ở ≥ 1 chiều nhưng KHÔNG dạy sai đáp án và KHÔNG sai ngữ pháp Đức.
- **fail** — có ≥ 1 lỗi P0/P1 (dạy sai đáp án, sai ngữ pháp Đức nghiêm trọng, hoặc dẫn bằng chứng sai).

## Phân loại mức lỗi

- **P0** — Dạy sai: `de`/`vi` justify một đáp án KHÁC với `answer`, hoặc dẫn `key_evidence` mâu thuẫn với đáp án. (Học viên học sai.)
- **P1** — Sai ngữ pháp/chính tả tiếng Đức rõ ràng (Genus/Kasus/chia động từ/trật tự từ sai), hoặc giải thích Đức lập luận sai logic dù đáp án đúng.
- **P2** — Lỗi nhỏ: diễn đạt vụng, dịch Việt thiếu tự nhiên, dài/ngắn bất hợp lý, dùng từ trên/dưới level nhẹ — không ảnh hưởng tính đúng.

---

## Chiều 1 — Tiếng Đức đúng (`error_dimension = German`)

`explanation.de` phải đúng:
- Ngữ pháp: chia động từ, Kasus, Genus (der/die/das), trật tự từ, giới từ.
- Chính tả + dấu (ä/ö/ü/ß), viết hoa danh từ.
- Tự nhiên, đúng phong cách giải thích (không máy móc).

**Cờ liên quan:** `de_template_residue`, `de_too_thin`, `de_len_anomaly`, `mojibake`.
- **fail (P1)** nếu sai ngữ pháp/chính tả làm sai nghĩa hoặc gây hiểu lầm.
- **fix (P2)** nếu chỉ vụng/thiếu trau chuốt.

## Chiều 2 — Lập luận justify đáp án bằng `key_evidence` (`error_dimension = pedagogy`)

- `de` phải giải thích **vì sao `answer` đúng**, dựa trên `key_evidence` (trích/diễn giải đúng đoạn trong bài).
- Với `richtig_falsch`/`ja_nein`: phải chỉ ra bằng chứng khẳng định/phủ định đúng chiều.
- Với trắc nghiệm: nên nói vì sao phương án đúng đúng (và nếu có, vì sao phương án nhiễu sai).

**Cờ liên quan:** `de_low_evidence_overlap`, `no_key_evidence`.
- **fail (P0)** nếu lập luận justify đáp án SAI (dẫn tới đáp án khác `answer`), hoặc `key_evidence` mâu thuẫn đáp án.
- **fix (P2)** nếu lập luận đúng nhưng chưa bám sát bằng chứng / hơi chung chung.

## Chiều 3 — Hợp CEFR level (`error_dimension = CEFR`)

- Ngôn ngữ giải thích phù hợp level item (a1–c2): A1/A2 đơn giản, ngắn; C1/C2 có thể phức tạp hơn.
- Không dùng cấu trúc/từ vựng vượt xa level một cách không cần thiết (nhất là phần `de` ở A1/A2).

**Cờ liên quan:** (đánh giá thủ công; tham khảo `level` + `de_len_anomaly`).
- **fix (P2)** nếu lệch level nhẹ. **fail** hiếm — chỉ khi lệch level nghiêm trọng làm học viên không hiểu nổi.

## Chiều 4 — Tiếng Việt chính xác + tự nhiên (`error_dimension = VN`)

`explanation.vi` phải:
- Dịch/diễn giải ĐÚNG nội dung `de` (không bịa, không lệch nghĩa).
- Tự nhiên với người Việt học tiếng Đức; thuật ngữ nhất quán.
- Nhắc rõ đáp án và bằng chứng.

**Cờ liên quan:** `vi_boilerplate_or_empty`, `vi_no_answer_ref`, `vi_len_anomaly`, `mojibake`.
- **fail (P0)** nếu `vi` dịch sai dẫn tới hiểu sai đáp án.
- **fix (P2)** nếu chỉ thiếu tự nhiên / lặp khuôn.

---

## Bảng tổng hợp nhanh

| Chiều | error_dimension | Mức lỗi nặng nhất | Cờ pre-screen gợi ý |
| --- | --- | --- | --- |
| 1. Tiếng Đức đúng | German | P1 | de_template_residue, de_too_thin, de_len_anomaly, mojibake |
| 2. Justify bằng evidence | pedagogy | **P0** | de_low_evidence_overlap, no_key_evidence |
| 3. Hợp CEFR | CEFR | P2 (hiếm fail) | de_len_anomaly |
| 4. Tiếng Việt | VN | **P0** | vi_boilerplate_or_empty, vi_no_answer_ref, vi_len_anomaly, mojibake |

> Lưu ý: cờ pre-screen chỉ là **gợi ý khách quan**, KHÔNG phải kết luận. Item không có cờ vẫn có thể fail; item có cờ vẫn có thể pass. Người duyệt quyết định.
