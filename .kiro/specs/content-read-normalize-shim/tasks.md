# Implementation Plan — Content Read-Normalize Shim (Option C / RB-P2-01)

Vai chinh: CTO / Tech Lead
Vai phoi hop: Backend Engineer, Frontend Engineer

## Overview

Ship read-normalize shim `@fuxie/shared/content-schema` để code đọc content nhất quán camelCase, KHÔNG đổi content/seeder/DB. Helper opt-in, có PBT bảo chứng. Đóng RB-P2-01 ở mức Option C.

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1"], "description": "Tạo module normalizeContentRecord + export map." },
    { "wave": 2, "tasks": ["2"], "description": "PBT Property 1/2/3. Phụ thuộc 1." },
    { "wave": 3, "tasks": ["3"], "description": "Gate: typecheck + test:property + qa:content. Phụ thuộc 2." }
  ]
}
```

## Tasks

- [x] 1. Tạo module shim + export
  - Tạo `packages/shared/src/content-schema/index.ts` export `normalizeContentRecord(raw)` + type `NormalizedContentRecord`.
  - Map 15 Snake_Field → Camel_Equivalent (bảng design); camel ưu tiên khi trùng; pass-through field lạ; không mutate input; normalize nông `metadata`/`scoring`/`explanation`.
  - Thêm `"./content-schema": "./src/content-schema/index.ts"` vào `packages/shared/package.json` exports.
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 2. PBT cho helper
  - Thêm `tests/content-audit/content-normalize.spec.ts`: Property 1 (spelling-agnostic), Property 2 (idempotent), Property 3 (value-invariance + no-mutation) dùng fast-check.
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 4.1_

- [x] 3. Gate + đóng finding
  - `pnpm typecheck` (tsc shared) xanh; `pnpm test:property` (gồm test mới + `tests/content-audit/*`) xanh; `pnpm qa:content` exit 0.
  - Cập nhật `docs/content-quality/audit-2026-06/remediation-backlog.md`: RB-P2-01 → Option C shipped (code-level unify); Option B (content rename) vẫn defer.
  - _Requirements: 3.5, 4.2, 4.3_

## Notes

- **Code-only, 0 rủi ro data.** KHÔNG đụng content/, seeder, DB, audio pipeline (Req 3.1, 3.2).
- **Opt-in.** Consumer cũ chạy nguyên; migrate dần ngoài spec.
- Consumer mẫu (`reading-client.tsx`) chỉ áp dụng nếu render bất biến; nếu nghi ngờ → chỉ ship helper + test (Req 3.4, 4.4).
- Đóng RB-P2-01 ở mức Option C; Option B (rename content) cần môi trường DB cho seed-smoke, vẫn defer.
