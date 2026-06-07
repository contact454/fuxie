# Layer 1 — Automated QA Summary (audit-2026-06)

Vai chinh: Content QA / Linguistic Reviewer · Read-only reuse-first pass.

> Lưu ý môi trường: `pnpm`/`corepack` không có trên PATH của máy chạy audit. Các script QA được chạy **nguyên trạng** qua binary `tsx` cục bộ (`node_modules/.bin/tsx`) — đúng các lệnh mà `package.json` bọc (`qa:content` = `tsx scripts/content-qa.ts`, v.v.). Không sửa script.

| Script (lệnh gốc) | Lệnh đã chạy | Exit | Kết quả tóm tắt | Phủ chiều |
| --- | --- | --- | --- | --- |
| `pnpm qa:content` | `tsx scripts/content-qa.ts` | 0 | Scanned 1193 files, 0 errors, 0 warnings. Report `tmp/content-qa-report.md` | D6 (schema/integrity), một phần D1/D3 |
| `pnpm check:locale-parity` | `tsx scripts/check-locale-parity.ts` | 0 | vi=929 ⇄ de=929 keys; 262 tsx file scan OK | D5 (UI messages parity) |
| `pnpm qa:copy-style` | `tsx scripts/copy-style-audit.ts` | 1 | Scanned 1921 files: **1 error, 1148 warnings** | D4 (mojibake/style) — **phạm vi UI** |
| `pnpm qa:learning-quality` | `tsx scripts/content-qa.ts` + `tsx scripts/generate-content-quality-assets.ts` | 0 | 1193 records, 60 spot-check samples, 1278 learning outcomes, **transcript source ready 0/268** | D2/D3/D7 |

## Diễn giải quan trọng (scope)

1. **`content-qa.ts` báo 0 lỗi/0 cảnh báo trên 1193 file content.** Đây là gate schema/integrity hiện hành — nghĩa là D6 ở mức structural mà gate này phủ đã sạch. Audit Layer 2 vẫn phải kiểm các chiều gate này KHÔNG phủ (Genus, CEFR, đáp án đúng-sai, dịch nghĩa).
2. **`copy-style-audit.ts` quét `apps/web` (UI layer), KHÔNG quét `content/`.** 0/1149 issue chạm `content/`. Toàn bộ 1149 issue (1 mojibake error tại `apps/web/messages/vi.json:344`, 583 hardcoded copy, 279 raw hex, 230 arbitrary text-size, 56 emoji) thuộc về spec UI khác (`fuxie-ui-ux-audit-fix` / `learner-copy-localization-backfill`), KHÔNG phải nội dung học. → **Mojibake trong `content/` (D4) phải quét trực tiếp** ở Layer 2 (script `tmp/content-audit.mjs`), không thể dựa vào copy-style.
3. **`check:locale-parity`** đo parity của UI messages (`apps/web/messages/{vi,de}.json`), không đo parity field trong `content/`. → **Locale parity field-level trong content (D5) phải kiểm trực tiếp.**
4. **`transcript source ready: 0/268`** — tín hiệu D7: 268 item listening/speaking chưa có transcript source verified. Cần đối chiếu ở D7.

## Báo cáo có sẵn đã đối chiếu (read-only)

- `tmp/content-qa-report.md` (vừa sinh, 0 vi phạm).
- `detailed_compounds_audit_report.md`, `qa_report.md` — đối chiếu ở D1/D6.
- `current_violations*.txt`, `parity-violations*.txt` — thuộc UI layer (t() discipline), không phải content.
- `docs/content-quality/cefr-audit-checklist.md`, `bilingual-style-guide.md` — rubric D2/D4.

## Kết luận Layer 1

Gate tự động hiện có **không phủ** phần lớn rủi ro nội dung học (Genus, CEFR fit, đáp án đúng/sai, dịch nghĩa, mojibake trong content, field parity trong content). Layer 2 phải bổ sung một pass quét trực tiếp `content/` cho các chiều machine-checkable (D5 required field, D6 enum/index/id/orphan/audio, D4 mojibake-in-content, D9 coverage) cộng review thủ công có rubric cho các chiều phán đoán (D1 Genus, D2 CEFR, D3 đáp án/sư phạm, D7 transcript, D8 exam).
