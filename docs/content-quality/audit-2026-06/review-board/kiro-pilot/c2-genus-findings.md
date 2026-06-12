# Kiro-agent Review — C2 Vocabulary Genus Findings

Spec: `fuxie-content-review-board` · Follow-up · German Linguist (Kiro-agent) thẩm định các cảnh báo `genus:article-usage` của Tier-1.

Vai chinh: Content QA / Linguistic Reviewer · Vai phoi hop: German Academic Lead, AI / LLM Engineer

> Tier-1 (deterministic) gắn **5 cảnh báo** `genus:article-usage` ở C2 vocabulary (conservative — chỉ warning, không chặn). Kiro-agent đóng vai German Linguist thẩm định từng cái dựa trên quy tắc Genus tiếng Đức + cách dùng trong ví dụ. **Kết quả: 3 lỗi Genus THẬT (P1) + 1 file dương-tính-giả.** READ-ONLY: chưa sửa `content/`.

## 3 lỗi Genus thật (P1 — dạy sai giống danh từ)

> ✅ **ĐÃ SỬA** (2026-06): cả 3 trường `article` đã đổi đúng. Verify: `qa:content` 0 lỗi · `qa:german-lint` chỉ còn 2 cảnh báo dương-tính-giả (Produktionsmittel) · PBT content-audit 229/229 xanh · diff chỉ đổi đúng 3 trường `article`, mọi field khác bất biến.

| # | File | jsonPath | Từ | `article` hiện tại | Đúng phải là | Bằng chứng |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `content/c2/vocabulary/06-anthropologie-ethnografie.json` | `words[0].article` | Kulturrelativismus | `NEUTRUM` ❌ | **`MASKULIN`** | Danh từ đuôi **-ismus luôn giống đực** (der Kapitalismus, der Relativismus). Ví dụ trong bài: "**Der** Kulturrelativismus postuliert…", "Kritiker **des** Kulturrelativismus" (gen. đực). |
| 2 | `content/c2/vocabulary/34-narratologie.json` | `words[5].article` | Paratext | `NEUTRUM` ❌ | **`MASKULIN`** | **-text → der Text** → der Paratext. Ví dụ: "**Der** Paratext, bestehend aus…", "Die Analyse **des** Paratextes" (gen. đực -es). |
| 3 | `content/c2/vocabulary/108-atonalitaet-schoenberg.json` | `words[3].article` | Klangfarbenmelodie | `NEUTRUM` ❌ | **`FEMININ`** | **-melodie → die Melodie** (giống cái) → die Klangfarbenmelodie. Ví dụ: "Schönberg postulierte **die** Klangfarbenmelodie" (acc. cái), "die Erforschung **der** Klangfarbenmelodie" (gen. cái). |

→ Đây là lỗi nội dung học thật: trường `article` enum sai sẽ dạy người học sai giống danh từ. Mức **P1** (sai ngữ pháp tiếng Đức, không phải sai đáp án bài tập nên không P0). Độ tin cao: quy tắc -ismus/-text/-melodie là bất biến, không chủ quan.

## 1 dương tính giả (article đúng — checker bắt nhầm)

| File | jsonPath | Từ | `article` | Phán định |
| --- | --- | --- | --- | --- |
| `content/c2/vocabulary/124-arbeitswerttheorie.json` | `words[2]` (ex1 + ex2) | Produktionsmittel | `NEUTRUM` ✓ | **ĐÚNG.** das Mittel → das Produktionsmittel (số ít). Cụm "**der** Produktionsmittel" trong ví dụ là **sở hữu cách số nhiều** (die Produktionsmittel → gen. der Produktionsmittel: "der Besitz **der** Produktionsmittel"), KHÔNG phải giống đực số ít. Checker hiểu nhầm "der" = nominativ đực. |

→ Đề xuất tinh chỉnh rule `genus:article-usage`: bỏ qua khi "der/die" đứng trước danh từ ở vị trí **gen./dativ** hoặc khi danh từ là dạng số nhiều (das Mittel ↔ die Mittel), để giảm dương tính giả.

## Đối chiếu mô hình 2 tầng (ý nghĩa)

- **Tier-1 (deterministic)** đúng vai: gắn **warning** (không chặn) cho cả 5 — vì phân biệt "article field sai" vs "cách dùng gen./pl." cần tri thức ngôn ngữ, không an toàn để auto-block.
- **Tier-2 (Kiro-agent advisory)** nâng 3/5 thành **P1 có độ tin cao** và loại 2/5 dương-tính-giả. Đây đúng là giá trị của tầng review: biến tín hiệu thô thành phán định hành động được — **nhưng vẫn cần German Academic Lead (người) xác nhận** trước khi sửa, theo nguyên tắc "chưa người duyệt".

## Đề xuất bước kế tiếp

1. **Mở spec sửa nhẹ** `content-c2-genus-fix` (giống `content-genus-enum-fix` P0 trước đây): đổi `article` của 3 từ `NEUTRUM`→đúng (MASKULIN ×2, FEMININ ×1), giữ mọi field khác; chạy `qa:content` + `qa:german-lint` + PBT. Nên có German Academic Lead xác nhận (dù quy tắc bất biến).
2. **Tinh chỉnh** rule `genus:article-usage` để bớt dương-tính-giả (gen./dativ/số nhiều).
3. Nhân rộng cách thẩm định này cho các cảnh báo Tier-1 còn lại ở level khác.
