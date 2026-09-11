# Coverage Matrix — Fuxie Content Quality Audit (audit-2026-06)

Read-only. Mỗi ô: `files / items` (audited) · `⚑N` = số finding. Mode = full (structural 100%) trừ khi đánh dấu `sampled`.

## Files & Items theo level × skill

| Level | grammar | listening | reading | speaking | vocabulary | writing | course.json | Tổng file |
|---|---|---|---|---|---|---|---|---|
| a1 | 1f/1i | 32f/160i | 31f/151i ⚑1 | 10f/10i | 21f/728i | 35f/35i | 1f | 131 |
| a2 | 1f/1i | 40f/200i | 40f/200i ⚑1 | 8f/8i | 26f/768i ⚑5 | 35f/35i | 1f | 151 |
| b1 | 1f/1i | 44f/330i | 50f/250i ⚑1 | 6f/6i | 42f/1194i | 50f/50i | 1f | 194 |
| b2 | 1f/1i | 48f/360i | 50f/250i ⚑1 | 10f/10i | 60f/2100i | 40f/40i | 1f | 210 |
| c1 | 1f/1i | 52f/170i | 48f/192i ⚑1 | 8f/8i | 75f/2638i ⚑7 | 35f/35i | 1f | 220 |
| c2 | 1f/1i | 52f/178i | 48f/276i ⚑1 | 6f/6i | 145f/3033i ⚑14 | 35f/35i | 1f | 288 |

**Tổng:** 1194 file (1188 skill + 6 course.json) · 13462 Content_Item (item-level). Findings: 33 (D1=3, D3=6, D6=24).

> **D3 (reading):** mỗi ô reading ⚑1 là một **cluster finding** đại diện cho toàn bộ `explanation.vi` boilerplate ở level đó (a1=150, a2=200, b1=250, b2=250, c1=168, c2=264 item — tổng 1,282 item). Listening explanations cụ thể, không bị flag. Full traceability ở `tmp/findings-d3-trace.json`.

## Chế độ quét theo chiều (D1–D9)

| Dim | Chiến lược | Mode |
|---|---|---|
| D1 Chính tả/ngữ pháp Đức | 100% đáp án/giải thích + Genus reference auto + sampling text | full (HRZ) + sampled |
| D2 CEFR fit | proxy grammar-floor 100% (534 file, 0 violation) + sampling thủ công level-fit | full (proxy) + sampled |
| D3 Sư phạm/đáp án | 100% trường đáp án (auto resolvability + distractor + explanation usefulness) + sampling thủ công | full (HRZ) + sampled |
| D4 Dịch Việt/mojibake | 100% scan mojibake-in-content + vi==en + term proxy (auto, 10,461 word) + sampling chất lượng thủ công | full + sampled |
| D5 Song ngữ/field | 100% required-field (auto) | full |
| D6 Schema/integrity | 100% structural (auto: enum, index, id, orphan, audio) + qa:content gate | full |
| D7 Audio/script | 100% audio_file existence (auto, 268/268 tồn tại) + transcript sampling | full + sampled |
| D8 Hợp lệ đề thi | 100% exam-style item: examType/Teil/points (auto, 0 finding) + blueprint fidelity sâu (Exam Prep Specialist pending) | full + pending review |
| D9 Độ phủ/cân bằng | toàn universe (matrix này) | full |
