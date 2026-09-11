# TICKET-C1 — Slice #3 Nghe (Listening hub + player)

Handoff cho **Antigravity**. Nhân rộng chuẩn vàng (slice #1/#2) sang kỹ năng Nghe. Reskin bằng primitives; **không đụng lõi** `apps/ai-service`, `content/`, file audio, `srs-engine`, `database` (chỉ tái dùng logic phát audio + chấm). Phải đạt **Duolingo-parity rubric** (`duolingo-parity-rubric.md` + cây `duolingo-criteria-tree.md`).

Scope: `apps/web/src/app/(learn)/listening/*`, `apps/web/src/components/listening/*` (`listening-client`, `lesson-player`, `listening-skill-shell`). Dùng `@fuxie/ui/components`. Blocked by: slice #1 (primitives). Tuân thủ AGENTS.md.

## C-Hub — Listening landing (`(learn)/listening/page.tsx`)
- World ambiance (nền làng mờ như hub Ôn tập/M2); TopBar nhất quán (streak/gem/XP).
- Danh sách bài nghe theo cấp (A1…C1 — audio đã có trong `public/audio/listening`); mỗi mục là card/nút tactile, trạng thái khoá/mở/đã xong.
- `PrimaryCta` "Bắt đầu" tactile. Mascot. State-shell empty/loading/error.

## C-Player — Listening player (`listening/lesson-player` + `[lessonId]`)
- **Immersive** full-screen overlay như gameplay/session (ẩn TopBar/BottomNav qua `useSuppressLearnerMainChrome`); chỉ progress + nút X.
- Nền **sạch** (blue-50/trắng), tương phản cao.
- **AudioButton lớn, nổi bật** ở trung tâm (play/replay, ≥64px, state playing) — nghe là hành động chính; cho phép nghe lại.
- Câu hỏi hiểu: tái dùng dạng bài hiện có, **đáp án bằng OptionTile** (tactile, 4 trạng thái), luồng **chọn → Kiểm tra → feedback footer (đúng/sai + Tiếp tục)**; sai hiện đáp án đúng.
- Mascot phản ứng đúng/sai; hết bài → tổng kết kiểu reward M4 (XP + số câu đúng + CTA).
- (Nếu có transcript) nút hiện/ẩn transcript sau khi trả lời — tuỳ chọn, không bắt buộc.

## Ràng buộc (giữ chuẩn slice trước)
- Style qua `var(--fuxie-*)`; nút tactile ≥48px + gờ ≥4px + lún; AudioButton ≥64px; touch ≥44px.
- Một primary cho CTA; semantic màu; reward-amber chỉ ở tổng kết; nhãn UI **tiếng Việt** qua i18n (không hardcode; **không để nhãn tiếng Đức** như "Anhören/Abspielen" lọt UI).
- prefers-reduced-motion; asset lớn tĩnh.

## Acceptance (theo parity-audit-process)
- [ ] `pnpm check:quick` + `pnpm --filter @fuxie/ui typecheck` xanh.
- [ ] Visual-capture (fixture=visual-qa): listening-hub (default/empty/mobile), listening-player (trước khi trả lời có AudioButton lớn, state selected, correct, wrong, tổng kết) mobile.
- [ ] **Số đo**: min-height + gờ px của OptionTile/PrimaryCta, kích thước AudioButton; axe 0 serious/critical; contrast ≥4.5:1; touch ≥44px.
- [ ] Immersive: player che hub hoàn toàn (như slice #2 đã sửa).
- [ ] Điền scorecard {UI} 2 màn — mọi MUST ✅.
- [ ] `git diff` chỉ apps/web (+packages/ui nếu cần); ai-service/content/audio/srs-engine/database nguyên vẹn.
- [ ] Gửi screenshot đủ state + số đo về Claude để audit.

> Lưu ý học từ slice #2: đảm bảo overlay player thực sự che hub (fixed inset-0 z-50), và rà kỹ nhãn tiếng Đức lọt UI.
