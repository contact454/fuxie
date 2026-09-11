# TICKET-B1 — Slice #2 Ôn tập / SRS (Review hub + Review session)

Handoff cho **Antigravity**. Nhân rộng chuẩn vàng slice #1 sang luồng Ôn tập. Reskin bằng primitives sẵn có; **không đụng lõi** `packages/srs-engine` (chỉ tái dùng logic chấm/grade). Phải đạt **Duolingo-parity rubric** (`duolingo-parity-rubric.md` + cây `duolingo-criteria-tree.md`).

Scope: `apps/web/src/app/(learn)/review/*`, `apps/web/src/components/srs/*` (`review-client`, `review-session`, `flashcard`, `rating-buttons`), `apps/web/src/components/review/*`. Dùng `@fuxie/ui/components`.
Blocked by: slice #1 (primitives + tokens đã có). Core boundary: KHÔNG đụng srs-engine/database/ai-service/content — giữ nguyên thuật toán SRS, chỉ reskin trình bày + wiring UI. Tuân thủ AGENTS.md.

## B-Hub — Review landing (`(learn)/review/page.tsx` + `review/review-backbone-hero`)
- World ambiance: nền làng mờ (như M2/M4), KHÔNG phải nền trắng trơn.
- Hiển thị: số thẻ **đến hạn ôn** (từ srs-engine), streak, XP — dùng TopBar + chip nhất quán.
- `PrimaryCta` **"Bắt đầu ôn tập"** (tactile 56px + gờ 4px). Mascot Fuxie chào/khích lệ.
- State-shell: empty (không có thẻ đến hạn → "Hôm nay ôn xong rồi!"), loading, error.

## B-Session — Flashcard review (`srs/review-session` + `flashcard` + `rating-buttons`)
- **Immersive** như gameplay: ẩn TopBar/BottomNav, chỉ giữ progress + nút X (dùng `useSuppressLearnerMainChrome`).
- Nền **sạch** (blue-50/trắng, KHÔNG làng mờ sau thẻ) để tương phản tối đa.
- **Flashcard** = card nền đặc, bóng rõ, chữ đậm ≥22px; lật thẻ có micro-interaction (tôn trọng reduced-motion).
- **Rating buttons** (SRS grade: Again/Hard/Good/Easy → nhãn tiếng Việt "Lại/Khó/Được/Dễ") = **tactile 3D có gờ**, **màu khối phân biệt** (vd Lại=đỏ, Khó=cam, Được=xanh action, Dễ=xanh lá success). Giữ nguyên giá trị grade truyền vào srs-engine.
- Phản hồi nhẹ sau mỗi thẻ; mascot phản ứng.
- Hết phiên → màn tổng kết (tái dùng phong cách reward M4: XP + số thẻ đã ôn + "Về làng"/"Xong").

## Ràng buộc (giữ chuẩn slice #1)
- Style qua `var(--fuxie-*)`; nút tactile: cao ≥48px, gờ ≥4px, lún khi bấm; touch ≥44px.
- Một primary cho CTA chính; semantic màu đúng; reward-amber chỉ ở tổng kết.
- Nhãn UI **tiếng Việt** (nội dung học tiếng Đức); lấy qua i18n, không hardcode.
- prefers-reduced-motion; asset lớn tĩnh.

## Acceptance (theo parity-audit-process)
- [ ] `pnpm check:quick` + `pnpm --filter @fuxie/ui typecheck` xanh.
- [ ] Thêm visual-capture (fixture=visual-qa) cho: review-hub (default/empty/mobile), review-session (flashcard mặt trước, mặt sau + rating, tổng kết) mobile.
- [ ] **Số đo** (xuất như slice #1): computed min-height + gờ px của rating-buttons & PrimaryCta; axe 0 serious/critical; contrast chữ chính ≥4.5:1; touch ≥44px.
- [ ] Đối chiếu rubric: điền scorecard các lá {UI} cho 2 màn — mọi MUST ✅.
- [ ] `git diff` chỉ chạm apps/web (+packages/ui nếu cần); srs-engine/database/ai-service/content nguyên vẹn.
- [ ] Gửi screenshot đủ state + số đo về Claude để audit.

> Gamification sâu (league/hearts/quests) là {PROD} — không thuộc ticket này; xem `product-gap-register.md`.
