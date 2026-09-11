# TICKET-A3 — M2 Lesson Intro + M3 Gameplay (slice từ vựng)

Handoff cho **Antigravity**. Ráp 2 màn của slice bằng primitives A1, bám 2 mockup đã duyệt. **Tái dùng** toàn bộ logic bài tập hiện có — chỉ reskin trình bày. KHÔNG đụng lõi.

Matches mockup: `fig/mock-m2-intro.png` (M2), `fig/mock-m3-gameplay.png` (M3). Assets: `fig/m2-markt-plate.png`, `fig/m3-study-backdrop.png`, `fig/fuxie-poses.png`.
Scope: `apps/web/src/app/(learn)/vocabulary/*` + `apps/web/src/components/vocabulary/*` (đặc biệt `exercises/`). Dùng `@fuxie/ui/components`.
Blocked by: A1 (done). Chạy song song với A2-REV được (khác route). Điều hướng vào từ node Marktplatz (đã wire ở A2).

## Core boundary (bắt buộc)
KHÔNG đụng `packages/database`, `packages/srs-engine`, `apps/ai-service`, `content/`. Tái dùng nguyên logic bài tập & dữ liệu từ `components/vocabulary/exercises` (`exercise-player-wrapper`, `mc-exercise`, `matching-exercise`, `spelling-exercise`...). Không đổi luật SRS, không đổi nội dung, không thêm dạng bài mới. Tuân thủ role gate AGENTS.md.

## Neo nội dung
Marktplatz → theme A1 **"Essen und Trinken" / "Einkaufen"** (`content/a1/vocabulary`). Lấy bộ từ qua đường dữ liệu hiện có; không hardcode từ vựng trong UI.

## M2 — Lesson Intro (bám mock-m2-intro)
1. Nửa trên: cảnh `IsoPlate` dùng `fig/m2-markt-plate.png` (tĩnh). Nửa dưới: `ScenePanel` bo `--fuxie-radius-lg`.
2. Trong panel: tiêu đề chủ đề (text thật từ dữ liệu), meta placeholder → số từ + thời gian ước tính (từ dữ liệu), và **`PrimaryCta` "Bắt đầu"** (nút chính duy nhất).
3. Mascot: pose idle-wave/presenting từ `fuxie-poses.png`.
4. Tap "Bắt đầu" → vào M3 (khởi động exercise player hiện có cho theme này).
5. Chữ/số đo lấy từ tokens + dữ liệu, KHÔNG pixel-match ảnh.

## M3 — Gameplay (bám mock-m3-gameplay)
1. Reskin `exercise-player-wrapper` cho dạng từ vựng: **1 từ/lượt**, tối đa 4 đáp án bằng **`OptionTile`** (2×2). Giữ nguyên logic chấm đúng/sai & tiến trình của player.
2. Trên cùng: `exercise-progress` reskin thành thanh tiến độ mảnh (dùng `--fuxie-success`).
3. Nghe: nếu item có audio → **`AudioButton`** (≥44px, aria-label).
4. Phản hồi tức thì:
   - Đúng → viền/`OptionTile` state success (`--fuxie-success`) + Fuxie pose **correct-cheer** + tiến độ +1.
   - Sai → rung nhẹ (`--fuxie-dur-tap`, `--fuxie-ease-tactile`), lộ đáp án đúng, Fuxie pose **wrong-oops**, KHÔNG trừ điểm gắt.
5. Mascot góc dưới (từ `fuxie-poses.png`), đổi pose theo kết quả.
6. Hết lượt → điều hướng sang M4 (reward) — màn M4 làm ở ticket sau; giờ chỉ cần điểm thoát đúng.

## Ràng buộc (giữ từ A1)
- Style qua `var(--fuxie-*)`; không hardcode. Touch target ≥44px; focus ring.
- Reward-amber containment (M2/M3 KHÔNG dùng amber), energy ≤5%, Primary_CTA discipline.
- Tôn trọng `prefers-reduced-motion` (rung/animation tắt khi user chọn giảm chuyển động).
- Asset lớn tĩnh; chỉ state-change nhỏ mới animate.

## Acceptance
- [ ] `pnpm check:quick` xanh (reward-amber containment + visual-audit + locale parity).
- [ ] `pnpm --filter @fuxie/ui typecheck` xanh nếu có đổi primitive.
- [ ] Thêm entry visual-capture cho M2 + M3 (mobile + desktop) vào manifest; screenshot khớp.
- [ ] Đặt cạnh `mock-m2-intro.png` / `mock-m3-gameplay.png`: cùng look & feel, mobile-first, không "desktop nén".
- [ ] Logic bài tập không đổi (chỉ reskin) — `git diff` không chạm exercise logic cốt lõi/SRS/content; chỉ `apps/web` (+`packages/ui` nếu bổ sung state cho OptionTile/AudioButton).
- [ ] Đúng/sai đổi pose Fuxie tương ứng; sai không trừng phạt gắt.

> Xong → handoff để Claude verify Gate B; kế tiếp TICKET-A4 (M4 Reward + M5 map upgrade).
