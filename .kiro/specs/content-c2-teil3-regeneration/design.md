# Design — C2 Teil-3 Filler Article Regeneration

Vai chinh: German Content Writer
Vai phoi hop: German Academic Lead, German Curriculum Designer, Content QA / Linguistic Reviewer

## Overview

Tái dùng nguyên `scripts/apply-c2-article-regen.ts` (đã dùng cho C2-T1-005…012). Tool nhận map `contentFile → {title?, text, questions[]}`, validate (≥200 ký tự, không `GENERIC_OPENER`, đúng số câu hiện có, mỗi câu `answer ∈ options` + `key_evidence` ⊂ `article.text` + stem không broken), giữ schema, `--dry-run`. `GENERIC_OPENER` đã mở rộng để bắt khuôn "Der wissenschaftliche Diskurs um das Thema".

## Architecture

- **Apply tool:** `scripts/apply-c2-article-regen.ts` (reuse, không sửa logic ngoài regex opener đã mở rộng).
- **Gate/PBT:** `tests/content-audit/c2-placeholder.spec.ts` mở rộng — thêm danh sách 12 file C2-T3 vào tracker, đóng gate khi cả C2-T1 + C2-T3 = 0 opener.
- **Patch tạm:** `tmp/c2-teil3-patch.json` (xoá sau khi apply).

## Content plan (12 bài, mỗi bài 6 câu MC)

| File | title | chủ đề bài đọc |
| --- | --- | --- |
| C2-T3-001 | Algorithmische Rechtsprechung | AI trong xét xử, bias thuật toán, trách nhiệm pháp lý |
| C2-T3-002 | Narrative Perspektiven in der Moderne | điểm nhìn trần thuật, unreliable narrator, stream of consciousness |
| C2-T3-003 | Emergenz als wissenschaftliches Prinzip | tính trồi, "more is different", khử giản luận |
| C2-T3-004 | Dekonstruktion und Bedeutung | Derrida, différance, bất ổn định nghĩa |
| C2-T3-005 | Cyber-Diplomatie | ngoại giao mạng, chuẩn mực quốc tế, attribution |
| C2-T3-006 | Die Entdeckung der DNA | Watson/Crick/Franklin, double helix, credit-Frage |
| C2-T3-007 | Identitätspolitik und Universalismus | identity politics vs universalism, Anerkennung |
| C2-T3-008 | Degrowth als alternatives Wirtschaftsmodell | hậu tăng trưởng, BIP-Kritik, suy giảm có kế hoạch |
| C2-T3-009 | Enhancement versus Therapie | ranh giới chữa bệnh – nâng cấp, neuro-enhancement |
| C2-T3-010 | Computational Creativity | sáng tạo của máy, generative models, Autorschaft |
| C2-T3-011 | Religion und Bioethik | tôn giáo & bioethics, Menschenwürde, đa nguyên |
| C2-T3-012 | Kognitive Verzerrungen und rationales Handeln | bias nhận thức, Kahneman, dual-process |

## Waves

- Wave 1: Foundation (regex opener mở rộng + cập nhật tracker test). Done trong task này.
- Waves 2–5: mỗi wave 3 bài (001-003, 004-006, 007-009, 010-012). Mỗi bài: bài đọc C2 ~230–300 từ + 6 câu MC, key_evidence verbatim. Dry-run → apply → qa:content + PBT.
- Wave 6: verify tổng + đóng finding.

## Invariants

- READ-ONLY ngoài 12 file C2-T3; answer/options là mới (viết lại cả câu hỏi) nhưng schema giữ.
- UTF-8 no BOM; `qa:content` exit 0; `tests/content-audit` xanh.
