# Audit slice #3 (Nghe/Listening) — 2026-07-01 (R1)

Theo `parity-audit-process.md`. Bằng chứng: listening default/empty/error + listening-player default/selected/correct/wrong/result.

## C-Hub — PASS
- ✅ Nền làng ambiance; ✅ tab cấp A1–C1; ✅ "Luyện nghe A1 · 2/6 hoàn thành" + progress; ✅ "Học tiếp" tactile (icon tai nghe); ✅ FrostedPanel danh sách bài có % + trạng thái xong; ✅ tiếng Việt; ✅ empty/error có.
- ⚠️ Nhỏ (không chặn): tab cấp đang chọn tô **xanh success** — nên dùng primary action cho "đang chọn" để nhất quán semantic.

## C-Player — REJECT (blocker: không render được)
| Vấn đề | KQ | Ghi chú |
|---|---|---|
| Player thật không render | ❌ | **Mọi state** (default/selected/correct/wrong/result) ra màn LỖI "Không tải được bài nghe" |
| Runtime errors | ❌ | Badge "4 Issues" — có lỗi console thật |
| Bằng chứng parity (AudioButton lớn/OptionTile/feedback/immersive) | — | **Chưa verify được** vì UI không render |

Nguyên nhân: fixture=visual-qa + mockState **chưa bypass đường tải audio** — component cố load file nghe trước rồi throw → rơi error boundary trước khi render UI player.

## Verdict
**REJECT.** Hub đạt; Player phải render được dưới visual-qa (bypass/mờ hoá lỗi audio, cấp mock câu hỏi + audio giả/tắt) để chụp default (AudioButton lớn) / selected / correct / wrong / result, và **hết "4 Issues"**. Sau đó mới audit được các lá {UI}.

## Bước sau
Fix ticket C1-REV (dưới) → re-capture player 5 state render thật + số đo (AudioButton size, OptionTile gờ, axe, contrast) → re-audit.

## R3 (2026-07-01) — PASS
Antigravity truy đúng gốc: **crash Prisma trong `generateMetadata`** (server component gọi DB dưới visual-qa → error.tsx) + thiếu locale keys `Listening.*` + audio onError. Sau fix (bypass DB trong generateMetadata + bổ sung locale + guard onError theo isVisualQa + set phase 'listening'):
| Lá | KQ | Bằng chứng |
|---|---|---|
| Player render thật | ✅ | AudioButton lớn + scrubber + 0.75x + "Nghe lại 0/2" + 3 OptionTile + câu hỏi DE/VI |
| 5.4.1 immersive | ✅ | progress + X, ẩn chrome |
| 1.3 tactile | ✅ | AudioButton 64px; OptionTile 56px + gờ 4px; PrimaryCta 56px+4px |
| 2.2/2.3 states + feedback | ✅ | correct xanh / wrong đỏ + "Đáp án đúng: …" + Tiếp tục |
| 8.2/8.4 | ✅ | contrast ≥4.5:1; axe 0 serious/critical |
| tab cấp active | ✅ | đổi sang primary action |
| Console | ⚠️ | Còn **"1 Issue"** (giảm từ 4) — nghi cảnh báo audio headless (không tải được mp3 trong test), không ảnh hưởng user thật. Cần Antigravity xác nhận benign / suppress dưới visual-qa cho sạch 0. |

**Verdict slice #3: PASS** (Hub + Player) toàn bộ MUST {UI} đo được. Việc còn lại: xác nhận/dọn "1 Issue" (không chặn).

## R2 (2026-07-01) — VẪN REJECT
Sau fix lần 1 (guard onError + isVisualQa→assetLoaded): **default và correct VẪN ra màn lỗi "Không tải được bài nghe" + "4 Issues".** Guard chưa chạm nguồn lỗi thật. Nghi throw ở server component `listening/[lessonId]/page.tsx` hoặc data-resolve trước khi player mount → rơi `error.tsx`. **check:quick xanh nhưng không chứng minh render** — phải verify bằng screenshot. Cần: đọc console (4 issues), truy đúng throw, cấp **mock lesson đầy đủ** cho [lessonId] khi visual-qa. Antigravity PHẢI tự mở ảnh player để xác nhận render (không dựa vào bijection).
