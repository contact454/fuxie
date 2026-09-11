# TICKET-A4 — M4 Reward Receipt + M5 Map Upgrade (khép vòng slice từ vựng)

Handoff cho **Antigravity**. Hoàn tất vòng lặp: sau khi làm xong bài (M3) → màn thưởng (M4) → về World Map thấy khu vừa học "lớn lên" (M5). Reskin trên logic kết quả hiện có. KHÔNG đụng lõi.

Matches mockup: `fig/mock-m4-reward.png`. Assets: `fig/m4-reward-objects.png` (4 vật phẩm), `fig/fuxie-poses.png` (level-up-jump). Primitives: `RewardBurst`, `StreakPill`, `ProgressRing`, `PrimaryCta`, `IsoPlate`.
Scope: `apps/web/src/components/vocabulary/exercises/*` (đặc biệt `exercise-results.tsx`) + màn World Map ở A2. Blocked by: A3 (điểm thoát M3 đã có), A2/A2-REV (map).

## Core boundary (bắt buộc)
KHÔNG đụng `packages/database`, `packages/srs-engine`, `apps/ai-service`, `content/`. Tái dùng nguyên logic ghi kết quả/tiến độ hiện có (exercise player đã ghi XP/hoàn thành qua đường có sẵn). M4 chỉ **hiển thị** kết quả; không tự tính lại SRS. Tuân thủ AGENTS.md.

## M4 — Reward Receipt (bám mock-m4-reward)
1. Reskin `exercise-results` thành màn receipt: **`RewardBurst`** tia amber, đặt trong subtree gốc `data-reward-state="earned"` (đây là nơi DUY NHẤT được dùng `--fuxie-reward`).
2. Ở tâm burst: một **vật phẩm làng** từ `fig/m4-reward-objects.png` (vd huy chương/cúp bánh mì) — chọn theo loại reward hiện có, không bịa reward mới.
3. Chip kết quả: **XP** vừa nhận + **`StreakPill`** (streak) + số từ đã thuộc — lấy từ dữ liệu kết quả thật; dùng `ProgressRing` nếu hợp.
4. Mascot: pose **level-up-jump** từ sheet.
5. **`PrimaryCta` "Về làng"** → điều hướng về World Map (dashboard).
6. Premium tối giản, đúng mock; chữ/số lấy từ dữ liệu + tokens.

## M5 — Map upgrade (xác nhận vòng lặp)
1. Sau khi hoàn thành Marktplatz và về map: node Marktplatz phải là **`mastered`** (vương miện) + sáng hơn (A2 đã nối `totalLessonsCompleted>0`). Kiểm tra thật sự chạy end-to-end với dữ liệu thật (không chỉ fixture).
2. Cảm giác "thế giới lớn lên": có thể thêm micro-transition khi node đổi sang mastered (tôn trọng `prefers-reduced-motion`), nhưng plate nền vẫn tĩnh.
3. Không thêm công trình mới ngoài 6 khu đã có (giữ scope slice).

## Ràng buộc (giữ từ A1)
- Style qua `var(--fuxie-*)`; không hardcode. Touch target ≥44px; focus ring.
- **Reward-amber chỉ trong subtree `data-reward-state="earned"` của M4** — không rò ra M5/map. Energy ≤5%. Primary_CTA discipline.
- Tôn trọng `prefers-reduced-motion`. Asset lớn tĩnh; chỉ burst/transition nhỏ mới animate (`--fuxie-dur-reward`).

## Acceptance
- [ ] `pnpm check:quick` xanh — đặc biệt property test reward-amber-containment PHẢI xanh (amber chỉ ở M4 earned subtree).
- [ ] `pnpm --filter @fuxie/ui typecheck` xanh nếu đổi primitive.
- [ ] Visual-capture M4 (mobile+desktop) dùng `fixture=visual-qa` như M2/M3, render đúng (không error/overlay), khớp `mock-m4-reward.png`.
- [ ] Chứng minh vòng lặp M3→M4→M5: sau khi hoàn thành, map hiện Marktplatz mastered. Kèm screenshot map ở trạng thái mastered.
- [ ] `git diff` chỉ chạm `apps/web` (+`packages/ui` nếu cần); lõi nguyên vẹn.

> Xong A4 = vertical slice từ vựng khép kín. Kế tiếp: chốt slice theo checklist A+B (`references/acceptance.md`), rồi mới nhân rộng sang kỹ năng khác.
