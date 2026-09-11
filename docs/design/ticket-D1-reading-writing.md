# TICKET-D1 — Slice #4 Đọc (Reading) + Viết (Writing)

Handoff cho **Antigravity**. Nhân rộng chuẩn vàng sang Đọc & Viết (mỗi kỹ năng: hub + player). Reskin bằng primitives; **không đụng lõi** `apps/ai-service`, `content/`, `srs-engine`, `database` (chỉ reskin + wiring; giữ nguyên chấm/AI grading). Đạt **Duolingo-parity rubric** (`duolingo-parity-rubric.md` + cây).

Scope: `apps/web/src/app/(learn)/reading/*` + `components/reading/*`; `apps/web/src/app/(learn)/writing/*` + `components/writing/*`. Dùng `@fuxie/ui/components`. Tuân thủ AGENTS.md.

## Bài học BẮT BUỘC áp từ slice #3 (tránh lặp lỗi)
- Dưới `fixture=visual-qa`: **bypass DB/ai ở CẢ `generateMetadata` LẪN data-resolve** của route `[exerciseId]` (server component) → cấp **mock exercise đầy đủ**, KHÔNG throw, KHÔNG rơi `error.tsx`.
- **Verify bằng mắt**: tự mở screenshot xác nhận render THẬT (không phải màn lỗi). `check:quick` xanh KHÔNG đủ (bijection khớp cả ảnh lỗi). Hết badge "Issues".

## Reading — Hub + Player
**R-Hub** (`reading/page.tsx`): world ambiance; danh sách bài đọc theo cấp (card/nút tactile, trạng thái); TopBar nhất quán; PrimaryCta "Bắt đầu"; mascot; empty/loading/error.
**R-Player** (`reading/[exerciseId]` + `reading-player`): **immersive** (ẩn chrome, progress + X); **nền sạch**; **passage** đọc trên card nền đặc, typography dễ đọc (line-height ~1.6, cỡ ≥16px), cuộn mượt; câu hỏi hiểu dùng **OptionTile** tactile + luồng **chọn → Kiểm tra → feedback footer (đúng/sai + đáp án đúng + Tiếp tục)**; (tuỳ chọn) nút dịch/hi-light đã có (`use-reading-translate`) giữ lại, gọn; hết bài → tổng kết kiểu reward.

## Writing — Hub + Player
**W-Hub** (`writing/page.tsx`): tương tự R-Hub (danh sách bài viết theo cấp).
**W-Player** (`writing/[exerciseId]` + `writing-player`): **immersive**; **prompt/đề** trên card rõ; **ô nhập lớn** (textarea) đủ cao, chữ ≥16px, có đếm ký tự/từ nếu đã có; **PrimaryCta "Nộp bài"** tactile; sau nộp hiển thị **kết quả/chấm** (giữ nguyên AI grading từ ai-service — chỉ reskin phần hiển thị: điểm, nhận xét, gợi ý) trong panel rõ ràng + CTA tiếp tục. Mascot phản ứng.

## Ràng buộc (giữ chuẩn slice trước)
- Style qua `var(--fuxie-*)`; nút tactile ≥48px + gờ ≥4px + lún; touch ≥44px; textarea focus ring rõ.
- Một primary cho CTA; semantic màu; reward-amber chỉ ở tổng kết; nhãn UI **tiếng Việt** qua i18n (KHÔNG để nhãn tiếng Đức lọt — rà kỹ như slice #3); prefers-reduced-motion.
- Passage/đề dài: đảm bảo tương phản + cỡ chữ đọc lâu không mỏi (đọc là hành động chính, nội dung là vua).

## Acceptance (theo parity-audit-process)
- [ ] `pnpm check:quick` + `pnpm --filter @fuxie/ui typecheck` xanh.
- [ ] Visual-capture (fixture=visual-qa, render THẬT không lỗi): reading-hub (default/empty), reading-player (passage + câu hỏi/selected/correct/wrong/result); writing-hub (default/empty), writing-player (đề + ô nhập/đã nhập/kết quả) — mobile.
- [ ] **Số đo**: min-height + gờ OptionTile/PrimaryCta; chiều cao textarea; axe 0 serious/critical; contrast ≥4.5:1 (đặc biệt passage); touch ≥44px.
- [ ] Immersive: player che hub hoàn toàn; hết badge "Issues".
- [ ] Scorecard {UI} cho 4 màn — mọi MUST ✅.
- [ ] `git diff` chỉ apps/web (+packages/ui nếu cần); ai-service/content/srs-engine/database nguyên vẹn.
- [ ] Gửi screenshot render THẬT đủ state + số đo + log console về Claude để audit.

> Nói (Speaking) để slice sau (cần UI mic + chấm phát âm riêng).
