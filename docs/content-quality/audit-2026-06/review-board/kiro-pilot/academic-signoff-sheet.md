# Academic Lead Sign-off Sheet — AI-authored C2 Remediation (PR #21)

Vai chinh: German Academic Lead (NGUOI DUYET) · Vai phoi hop: Content QA / Linguistic Reviewer, German Content Writer

Mục đích: người rành tiếng Đức ký duyệt nội dung AI-authored trước khi coi là "approved" cho production. Cột **Verdict / Reviewer / Date** để TRỐNG cho người duyệt điền. Kiro KHÔNG tự điền.

## Ngưỡng (đề xuất, người duyệt chốt)
- 0 lỗi P0/P1 (dạy sai đáp án / sai ngữ pháp Đức nghiêm trọng) trong mẫu → approve.
- Lỗi nhỏ lẻ (P2/P3) → approve-with-fixes.
- ≥1 P0/P1 → reject + mở fix-spec.

## Phạm vi cần duyệt

### A. C2 Teil 1 — bài đọc viết mới (spec `content-c2-placeholder-regeneration`), 8 file × 10 câu
| File | Chủ đề | Verdict | Reviewer | Date | Note |
| --- | --- | --- | --- | --- | --- |
| C2-T1-005 | Multilateralismus |  |  |  |  |
| C2-T1-006 | kopernikanische Wende |  |  |  |  |
| C2-T1-007 | Adorno Kulturindustrie |  |  |  |  |
| C2-T1-008 | Rawls Gerechtigkeit |  |  |  |  |
| C2-T1-009 | CRISPR Medizinethik |  |  |  |  |
| C2-T1-010 | Distant Reading |  |  |  |  |
| C2-T1-011 | Säkularisierung |  |  |  |  |
| C2-T1-012 | Hard Problem of Consciousness |  |  |  |  |

### B. C2 Teil 3 — bài đọc viết mới (spec `content-c2-teil3-regeneration`), 12 file × 6 câu
| File | Chủ đề | Verdict | Reviewer | Date | Note |
| --- | --- | --- | --- | --- | --- |
| C2-T3-001 | Algorithmische Rechtsprechung |  |  |  |  |
| C2-T3-002 | Narrative Perspektiven |  |  |  |  |
| C2-T3-003 | Emergenz |  |  |  |  |
| C2-T3-004 | Dekonstruktion |  |  |  |  |
| C2-T3-005 | Cyber-Diplomatie |  |  |  |  |
| C2-T3-006 | Entdeckung der DNA |  |  |  |  |
| C2-T3-007 | Identitätspolitik |  |  |  |  |
| C2-T3-008 | Degrowth |  |  |  |  |
| C2-T3-009 | Enhancement vs Therapie |  |  |  |  |
| C2-T3-010 | Computational Creativity |  |  |  |  |
| C2-T3-011 | Religion und Bioethik |  |  |  |  |
| C2-T3-012 | Kognitive Verzerrungen |  |  |  |  |

### C. Stem viết lại (spec `content-cefr-stem-regeneration`) — đáp án bất biến, chỉ kiểm tra ngữ pháp + khớp đáp án
| Nhóm | Phạm vi | Verdict | Reviewer | Date | Note |
| --- | --- | --- | --- | --- | --- |
| B2 reading | 21 file / 77 stem |  |  |  |  |
| C1 reading | 9 file / 44 stem |  |  |  |  |
| C2 reading | C2-T1-001..004 + C2-T3-001..012 stem |  |  |  |  |

## Đã verify tự động (Tier-1, KHÔNG thay người duyệt)
- generic-opener = 0; broken-stem b2/c1/c2 = 0; answer∈options 100%; key_evidence verbatim ⊂ article 100%.
- `qa:content` exit 0; `tests/content-audit` 254/254 xanh.

## Tổng kết của người duyệt
- Pass-rate mẫu: ____ %  | Số P0/P1: ____  | Verdict tổng: ☐ approve ☐ approve-with-fixes ☐ reject
- Người duyệt: ______________  Ngày: __________  Chữ ký: ______________
