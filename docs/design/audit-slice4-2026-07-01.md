# Audit slice #4 (Đọc + Viết) — 2026-07-01 (R1)

Theo `parity-audit-process.md`. Verify bằng mắt (không chỉ check:quick).

## Reading — REJECT (hỏng hoàn toàn dưới visual-qa)
- ❌ **reading-hub (default) VÀ reading-player (mọi state) đều ra màn LỖI** "Không tải được bài đọc" + badge "1 Issue".
- Nguyên nhân: bypass fixture=visual-qa **chưa ăn cho reading** — vẫn gọi DB (giống bệnh Nghe R1/R2). Cần fix y hệt Nghe R3.

## Writing — PARTIAL (render được, còn thô)
- ✅ Player render thật: editor quest (Plan/Draft/Revise) + feedback (ProgressRing 16/20, chip A1, nhận xét DE+VI, reward receipt). Immersive (không bottom nav).
- ⚠️ **Banner "+10 Fucoin"**: khối ellipse amber to, thô, thiếu premium — làm lại thành chip/pill gọn.
- ⚠️ **Microcopy "đao to búa lớn"** ("rèn giũa ngôn từ thành vũ khí", "cứ để tứ ngữ tuôn trào") — rút gọn, trung tính.
- ⚠️ **Chưa thấy textarea editor thật** (default hiện bước quest, không phải ô nhập) — cần capture state đang soạn (textarea lớn ≥16px).
- ⚠️ Rà "1 Issue" nếu còn.

## Verdict (R1)
**REJECT.** Reading: sửa fixture-bypass... Writing: sửa banner fucoin + microcopy + capture textarea editor.

## R2 (2026-07-01) — PASS
Antigravity truy đúng crash Reading: **thiếu map `correctAnswer` trong mock visual-qa → `q.correctAnswer.toLowerCase()` undefined → crash render** → error boundary. Sau fix (map correctAnswer + bypass generateMetadata):
| Màn | KQ | Bằng chứng |
|---|---|---|
| Reading player | ✅ | Passage "Eine E-Mail von Maria" + câu hỏi + OptionTile (A. Richtig xanh) + footer "Tuyệt vời!/Tiếp tục"; render thật |
| Writing editor | ✅ | Textarea lớn + focus ring + đếm từ "12/30-40 từ" + "Nộp bài"; microcopy đã rút gọn |
| Writing feedback | ✅ | ProgressRing 16/20 + chip A1 + nhận xét DE/VI + reward receipt |
| Banner fucoin | ✅ | Đã thành pill gọn (amber contained) |
| Số đo | ✅ | OptionTile/PrimaryCta 56px+gờ4px; textarea 16px/min-h 320px; axe 0; contrast ≥4.5:1 |

Nit nhỏ còn lại (không chặn): microcopy chiến lược đọc ("Quét tia X…") còn hơi bay — có thể rút gọn sau.

**Verdict slice #4: PASS** (Reading + Writing, hub + player). → 5/6 kỹ năng đạt chuẩn; còn Nói.
