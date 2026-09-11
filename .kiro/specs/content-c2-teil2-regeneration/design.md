# Design Document

Vai chinh: German Content Writer
Vai phoi hop: German Academic Lead, German Curriculum Designer, Content QA / Linguistic Reviewer

## Overview

Thay nội dung placeholder của **12 bài Lückentext C2 Teil 2** (C2-T2-001…012) bằng bài cloze C2 thật đúng tiêu đề/chủ đề. Cùng họ defect như `content-c2-placeholder-regeneration` (T1/T3) nhưng định dạng **Teil 2 khác**: không phải `article.text` + `questions[]` mà là `section_cloze` gồm `text` (8 ô `{1}`–`{8}`) + `sections[]` (A–I: 8 câu đúng + distractor) + `answers` (map ô→section).

Nguyên tắc:

- **Một file = một đơn vị review độc lập** (12 file), mỗi file qua Academic_Signoff + gate.
- **Giữ schema, thay nội dung**: chỉ `section_cloze.{title,text,sections,answers,distractor}` thay; mọi khoá cấu trúc, `metadata`, `images`, `scoring`, `qa`, `learningOutcomes` giữ; `cefrAudit.verdict` cập nhật.
- **Khác nhau thật** giữa 12 file (không filler chung, không copy chéo).
- **Không lan ngoài 12 file**; C2-T1/T3 + skill khác bất biến.
- **Generator gốc** xử lý ở ticket riêng.

## Architecture

```mermaid
flowchart TD
  A[12 Placeholder_Cloze C2-T2-001..012] --> B[Mỗi file: đọc title + topic]
  B --> C[Viết Real_Cloze C2 đúng chủ đề<br/>thân bài 8 ô {1}-{8} + 9 sections A-I<br/>German Content Writer]
  C --> D[Map answers ô->section + distractor<br/>Cloze_Answer_Integrity]
  D --> E[Academic_Signoff: chủ đề + ngữ pháp + C2 + logic ô↔câu]
  E --> F[Apply script: giữ schema, thay section_cloze<br/>dry-run + validate 8 ô + answers hợp lệ + no-dup + topic]
  F --> G[qa:content + PBT: opener=0 + overlap<0.5 + answers⊂sections + topic-match]
  G --> H[đóng finding C2-T2 + ticket generator gốc]
```

## Components and Interfaces

### Component 1: `content/c2/reading/C2-T2-001..012.json` (target)

Giữ khung; thay `section_cloze`:

```jsonc
{
  "id": "C2-T2-001", "level": "C2", "teil": 2,        // giữ
  "topic": "Rechtsphilosophie",                          // giữ (cloze phải khớp)
  "section_cloze": {
    "title": "Die Legitimation staatlicher Gewalt",      // giữ/tinh chỉnh
    "text": "<Real_Cloze: thân bài THẬT về chủ đề, 8 ô {1}-{8} mạch lạc>",
    "sections": [ /* A-I: 8 câu đúng + ≥1 distractor, khớp ngữ cảnh */ ],
    "answers": { "1": "G", "2": "D", ... },              // map 8 ô -> section id tồn tại
    "distractor": "C"                                      // section không điền ô nào
  },
  "metadata": { ... }, "images": [ ... ], "scoring": { ... },  // giữ
  "qa": { ... }, "cefrAudit": { ... }, "learningOutcomes": [ ... ]  // giữ; verdict cập nhật
}
```

### Component 2: Worklist + scan (phạm vi + cổng)

- Worklist: C2-T2-001…012 (Task 1 xác nhận đủ 12 + topic từng file).
- Cổng đóng: scan opener-generic `/Der folgende Bericht untersucht das Thema .* aus interdisziplinärer Perspektive/` = 0 trên 12 file; overlap thân cloze mọi cặp < 0.5; topic-keyword ⊂ thân cloze.

### Component 3: Apply script (dry-run + validate schema)

`scripts/apply-c2-teil2-regen.ts` (mẫu theo `apply-c2-article-regen.ts`, nhưng cho cloze):

- Nhận id → { title?, text, sections[], answers, distractor }.
- `--dry-run` in diff (độ dài text cũ→mới, số ô, số sections).
- Validate trước khi ghi: `text` có đúng 8 placeholder `{1}`–`{8}`; `answers` map đủ 8 ô; mọi section id trong `answers` ∈ `sections[].id`; `distractor` ∈ `sections[].id` và KHÔNG ∈ `answers`; opener-generic = 0; keyword topic ⊂ text.
- Giữ schema (chỉ thay `section_cloze`); ghi UTF-8 no BOM.

### Component 4: Reference (không sửa)

| Nguồn | Vai trò |
| --- | --- |
| `content/c2/reading/C2-T1-001..004.json` | Mẫu nội dung C2 thật (chất lượng) |
| `scripts/apply-c2-article-regen.ts` | Mẫu apply-script + validate pattern |
| `docs/content-quality/cefr-audit-checklist.md` | C2 reading: level fit + đáp án xác minh |
| `scripts/content-qa.ts`, `tests/content-audit/*` | Gate giữ xanh |

## Design Decisions

### Decision 1: Apply-script riêng cho Teil 2 (cloze), không tái dùng apply T1/T3

Định dạng Teil 2 (`section_cloze` + ô `{n}` + map answers) khác hẳn `article.text` + `questions[]`. Justification: validate đặc thù cloze (8 ô, answers↔sections, distractor).

**Validates: Req 3.1, Req 3.4**

### Decision 2: Một file = một đơn vị review + Academic_Signoff

Mỗi bài là chủ đề học thuật riêng (Rechtsphilosophie, Kognitionswissenschaft…) cần chuyên môn + kiểm logic ô↔câu.

**Validates: Req 5.1, Req 5.2**

### Decision 3: Validate toàn vẹn cloze trước khi ghi

Assert 8 ô, answers map đủ + id tồn tại, distractor không ∈ answers, opener=0, topic ⊂ text.

**Validates: Req 1.2, Req 3.1, Req 3.3, Req 3.4**

### Decision 4: Giữ schema, cập nhật `cefrAudit` sai

**Validates: Req 4.2, Req 4.5**

## Data Models

### Phạm vi

```
12 file C2-T2 placeholder = C2-T2-001..012 · 8 ô/file = 96 ô điền
giữ: schema, metadata, images, scoring, qa, learningOutcomes
thay: section_cloze.{title,text,sections,answers,distractor} + cefrAudit.verdict
ngoài phạm vi (bất biến): C2-T1/T3, B2/C1/A-level, skill khác
```

### Invariants sau spec

- 0 file worklist còn opener-generic (Req 1.4).
- Mọi cặp: overlap thân cloze < 0.5 (Req 2.1).
- Mỗi file: đúng 8 ô; answers map đủ; mọi id ∈ sections; distractor ∉ answers (Req 3.1, 3.4).
- Mỗi file: keyword topic ⊂ text (Req 1.1).
- `qa:content` exit 0; PBT xanh (Req 4.3, 4.4).
- C2-T1/T3 + skill khác byte-identical (Req 4.1).

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system.*

Property 1: No Placeholder Remains

_For any_ file trong worklist, `section_cloze.text` sau spec SHALL KHÔNG khớp khuôn opener-generic và SHALL nói đúng `topic`/`title`.

**Validates: Requirements 1.1, 1.2, 1.4**

Property 2: Cloze Structure Integrity

_For any_ file, `section_cloze.text` SHALL có đúng 8 ô `{1}`–`{8}`; `answers` SHALL map đủ 8 ô tới section id ∈ `sections[]`; `distractor` SHALL ∈ `sections[]` và ∉ `answers`.

**Validates: Requirements 3.1, 3.3, 3.4**

Property 3: No Duplicate Cloze

_For any_ cặp file (i, j) trong worklist, overlap thân `section_cloze.text` (chuẩn hoá) SHALL < 0.5.

**Validates: Requirements 2.1, 2.2**

Property 4: Scope Containment

_For any_ file ngoài 12 file worklist, nội dung SHALL byte-identical; trong phạm vi, chỉ `section_cloze` (+ cefrAudit.verdict) thay (schema giữ).

**Validates: Requirements 4.1, 4.2**

## Error Handling

| Tình huống | Phát hiện | Xử lý |
| --- | --- | --- |
| Cloze mới vẫn off-topic/filler | scan opener + Academic_Signoff + Property 1 | viết lại đúng chủ đề |
| Cloze mới trùng file khác | scan overlap + Property 3 | viết lại tới < 0.5 |
| Thiếu ô / answers map sai | validate + Property 2 | sửa text/answers |
| Section id trong answers không tồn tại | validate + Property 2 | sửa map |
| Đụng file ngoài phạm vi | Property 4 + hash diff | revert |
| qa:content/PBT regress | gate mỗi file | fix trước merge |

## Testing Strategy

### PBT applicability

- **Property 1 (No Placeholder):** scan opener = 0 + topic ⊂ text trên 12 file. Tự động.
- **Property 2 (Structure):** đúng 8 ô + answers map đủ + id ∈ sections + distractor ∉ answers. Tự động.
- **Property 3 (No Duplicate):** overlap thân cloze mọi cặp < 0.5. Tự động.
- **Property 4 (Scope):** hash file ngoài phạm vi byte-identical.

Thêm `tests/content-audit/c2-teil2.spec.ts` cho Property 1–4.

### Test plan

| Test | Tool | Pass criteria | Validates |
| --- | --- | --- | --- |
| No placeholder | scan/PBT | 0 opener + topic ⊂ text | Property 1, Req 1.4 |
| Cloze structure | PBT | 8 ô + answers map đủ + id∈sections + distractor∉answers | Property 2, Req 3.1 |
| No duplicate | PBT | overlap < 0.5 mọi cặp | Property 3, Req 2.1 |
| Scope | hash diff | ngoài 12 file byte-identical | Property 4, Req 4.1 |
| Content gate | `pnpm qa:content` | exit 0 | Req 4.3 |
| Academic signoff | German Academic Lead | chủ đề + ngữ pháp + C2 + logic ô↔câu | Req 5.1 |

### Manual verification

```bash
node_modules\.bin\tsx.cmd scripts\content-qa.ts
node node_modules\vitest\vitest.mjs run --config vitest.property.config.ts tests/content-audit
```

## Rollout Plan

### Ownership matrix

| Stream | Owner | Deliverable |
| --- | --- | --- |
| Viết Real_Cloze (12 bài) | German Content Writer | 12 bài Lückentext C2 thật + 96 ô |
| Academic sign-off | German Academic Lead | Duyệt chủ đề + ngữ pháp + C2 + logic ô↔câu |
| Khung sư phạm cloze | German Curriculum Designer | Độ khó ô + distractor công bằng |
| Apply script + cổng | Content QA / Linguistic Reviewer | dry-run, validate cloze, qa:content + PBT |
| Ticket generator gốc | AI / LLM Engineer + CTO | Fix pipeline không nhét cloze filler |

### Sequencing

1. Foundation: apply-script Teil 2 + scan opener + PBT Property 1–4.
2. Theo từng file (C2-T2-001 → … → 012). Mỗi file: viết Real_Cloze → Academic_Signoff → apply (dry-run→ghi) → qa:content + PBT → merge.
3. Sau 12 file: scan opener = 0, overlap < 0.5; đóng finding C2-T2 trong `cross-content-duplicate-scan.md`.
4. Mở/gộp ticket generator gốc.

### Rollback

Revert theo từng file (mỗi file một commit). Chỉ 12 file phạm vi đổi; revert đưa về cloze cũ — không ảnh hưởng C2-T1/T3 hay skill khác.
