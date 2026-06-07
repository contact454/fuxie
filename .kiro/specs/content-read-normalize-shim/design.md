# Design Document

Vai chinh: CTO / Tech Lead
Vai phoi hop: Backend Engineer, Frontend Engineer

## Overview

Thực thi Option C của `content-schema-naming-unify`: thêm read-normalize shim `@fuxie/shared/content-schema` chuẩn hoá content record về camelCase tại điểm đọc, KHÔNG đổi content JSON/seeder/DB. Code đọc nhất quán; rủi ro data = 0. Helper opt-in, áp dụng dần.

## Architecture

Shim nằm ở ranh giới đọc content, không can thiệp luồng seed/DB:

```mermaid
flowchart LR
  C[content/*.json<br/>snake + camel mixed] --> N[normalizeContentRecord<br/>@fuxie/shared/content-schema]
  N --> U[consumer đọc camelCase nhất quán<br/>UI / tooling opt-in]
  C -.->|seeder giữ nguyên, không qua shim| DB[(Prisma DB)]
```

Nguyên tắc: shim chỉ ở **đường đọc**; seeder/DB không đổi (Req 3.1, 3.2). Consumer opt-in (Req 3.3).

## Components and Interfaces

### Component 1: `packages/shared/src/content-schema/index.ts`

```ts
export interface NormalizedContentRecord { [k: string]: unknown }

export function normalizeContentRecord(
  raw: Record<string, unknown>,
): NormalizedContentRecord
```

- Pure, không mutate input (Req 1.4).
- Map Snake_Field → Camel_Equivalent theo bảng cố định; camel ưu tiên nếu trùng (Req 1.2).
- Pass-through field lạ (Req 1.3).
- Đệ quy nông vào `metadata`, `scoring`, `explanation` (Req 2.4).

### Component 2: `packages/shared/package.json` exports

Thêm `"./content-schema": "./src/content-schema/index.ts"` vào exports map (Req 1.6).

### Component 3: Consumer mẫu (opt-in, nếu không regress)

`reading-client.tsx` / `reading/page.tsx` `getReadingWordCount` có thể đọc qua shim. Chỉ áp dụng nếu render bất biến (Req 3.4, 4.4).

### Design Decisions

#### Decision 1: Shim đọc thay vì rename content

Tránh blast-radius Option B (seeder/QA-gate/audio/DB-blob). Đạt nhất quán code, rủi ro data 0.

**Validates: Req 3.1, Req 3.2**

#### Decision 2: camel ưu tiên khi trùng spelling

Nếu record có cả `word_count` và `wordCount`, lấy `wordCount` (giả định camel đã chuẩn). Idempotent vì lần 2 chỉ thấy camel.

**Validates: Req 1.2, Req 2.2**

#### Decision 3: Opt-in, không ép refactor

Helper không phá consumer cũ; migrate dần ngoài spec. Giảm rủi ro.

**Validates: Req 3.3**

## Data Models

### Snake_Field → Camel_Equivalent

| Snake_Field | Camel_Equivalent |
| --- | --- |
| `teil_name` | `teilName` |
| `task_type` | `taskType` |
| `target_grammar` | `targetGrammar` |
| `target_vocabulary` | `targetVocabulary` |
| `word_count` | `wordCount` |
| `audio_file` | `audioFile` |
| `topic_id` | `topicId` |
| `linked_text` | `linkedText` |
| `total_points` | `totalPoints` |
| `pass_threshold` | `passThreshold` |
| `key_evidence` | `keyEvidence` |
| `key_vocabulary` | `keyVocabulary` |
| `generated_at` | `generatedAt` |
| `regenerated_at` | `regeneratedAt` |
| `source_script` | `sourceScript` |

Nested normalize nông: `metadata`, `scoring`, `explanation` (object) được normalize đệ quy một cấp.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system.*

Property 1: Spelling-Agnostic — snake ≡ camel input

_For any_ cặp record chỉ khác spelling (snake vs camel) của cùng các field với cùng value, `normalizeContentRecord(snake)` SHALL deep-equal `normalizeContentRecord(camel)`.

**Validates: Requirements 2.1**

Property 2: Idempotent — normalize hai lần ≡ một lần

_For any_ record `x`, `normalizeContentRecord(normalizeContentRecord(x))` SHALL deep-equal `normalizeContentRecord(x)`.

**Validates: Requirements 2.2**

Property 3: Value-Invariance — chỉ key đổi, value giữ

_For any_ field trong input, value tương ứng trong output SHALL bằng value gốc (chỉ tên key có thể đổi snake→camel); không field nào bị mất.

**Validates: Requirements 1.3, 2.3**

## Error Handling

| Tình huống | Phát hiện | Xử lý |
| --- | --- | --- |
| Input không phải object | type guard trong helper | trả nguyên input (no-op) |
| Cả hai spelling cùng tồn tại | logic camel-ưu-tiên | lấy camel, bỏ snake (Decision 2) |
| Consumer mẫu gây đổi render | UI smoke | revert consumer, chỉ ship helper (Req 4.4) |
| Mutate input ngoài ý muốn | test no-mutation | helper clone, không sửa raw (Req 1.4) |

## Testing Strategy

### PBT applicability assessment

Helper có property universal rõ ràng (spelling-agnostic, idempotent, value-invariance) → đúng loại PBT. Dùng fast-check sinh record ngẫu nhiên với mix snake/camel.

### Test plan

| Test | Tool | Pass criteria | Validates |
| --- | --- | --- | --- |
| PBT spelling-agnostic | vitest + fast-check | snake ≡ camel output | Property 1 |
| PBT idempotent | vitest + fast-check | normalize² ≡ normalize | Property 2 |
| PBT value-invariance + no-mutation | vitest + fast-check | value giữ, input không mutate | Property 3, Req 1.4 |
| typecheck | tsc | xanh | Req 3.5 |
| qa:content | tsx scripts/content-qa.ts | exit 0 | Req 4.3 |
| existing PBT | test:property | giữ xanh | Req 4.2 |

## Rollout Plan

### Sequencing

1. Tạo `content-schema/index.ts` + export map.
2. Viết PBT (Property 1/2/3).
3. Chạy typecheck + test:property + qa:content.
4. (Tùy chọn) áp dụng consumer mẫu nếu render bất biến.
5. Cập nhật `RB-P2-01` trong backlog: Option C đã ship (code-level unify); Option B (content rename) vẫn defer.

### Rollback

Gỡ module + export map + test. Vì opt-in và không đụng content/DB, gỡ sạch, không hệ quả.
