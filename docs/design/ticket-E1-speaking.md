# TICKET-E1 — Slice #5 Nói (Speaking hub + player + record UI + roleplay)

Handoff cho **Antigravity**. Slice cuối, phủ nốt learner UI. Đây **không chỉ reskin** — có UI mới cho ghi âm/chấm phát âm. **Không đụng lõi** `apps/ai-service` (chấm phát âm), `content/`, `srs-engine`, `database` — chỉ reskin + wiring + UI recorder. Đạt **Duolingo-parity rubric** + cây.

Scope: `apps/web/src/app/(learn)/speaking/*` (hub, `[lessonId]`, `roleplay`) + `components/speaking/*` (`AudioRecorder`, `NachsprechenPlayer`, `PresentationPlayer`, `TurnBasedSpeakingPlayer`, `roleplay-stage`, `SpeakingClient`, `SpeakingLessonPlayer`). Dùng `@fuxie/ui/components`. Tuân thủ AGENTS.md.

## Bài học BẮT BUỘC (từ slice #3/#4)
- Dưới `fixture=visual-qa`: bypass DB/ai ở **CẢ `generateMetadata` LẪN data-resolve** của mọi route speaking → mock đầy đủ, KHÔNG throw.
- Mic/ghi âm KHÔNG chạy được headless → **mock các state recorder** (idle/recording/recorded/scored) dưới visual-qa để chụp được, KHÔNG gọi getUserMedia thật.
- **Verify bằng mắt** (mở screenshot), không tin check:quick; dứt badge "Issues".

## S-Hub (`speaking/page.tsx`)
World ambiance; danh sách bài nói theo cấp/mode (card tactile, trạng thái); TopBar nhất quán; PrimaryCta "Bắt đầu"; mascot; empty/loading/error.

## S-Player — Record UI (mới) (`speaking/[lessonId]` + các *Player)
- **Immersive** (ẩn chrome, progress + X); nền **sạch**.
- **Câu/đề cần nói** trên card rõ, chữ ≥22px (kèm dịch nghĩa VI + nút Nghe mẫu AudioButton).
- **Nút RECORD lớn tròn** ở trung tâm (≥72px), là hành động chính. Các state:
  1. **idle**: mic + nhãn "Nhấn để nói" (primary action).
  2. **recording**: đỏ, có **waveform/level** + timer + nút Dừng; pulse (tôn trọng reduced-motion).
  3. **recorded**: nghe lại bản ghi (playback) + "Ghi lại" + PrimaryCta "Chấm điểm/Nộp".
  4. **scored**: **feedback phát âm** — vòng điểm + đánh dấu từng từ/âm (xanh đạt / cam tạm / đỏ sai) lấy từ ai-service (chỉ reskin hiển thị), + mascot phản ứng + "Tiếp tục".
- Hết bài → tổng kết kiểu reward.

## Roleplay (`speaking/roleplay` + `roleplay-stage`)
- Sân khấu hội thoại lượt: bong bóng thoại 2 phía (đối tác AI / người học), câu người học có nút record; reskin bong bóng + record theo token; immersive; mascot/nhân vật rõ.

## Ràng buộc (giữ chuẩn)
- Style qua `var(--fuxie-*)`; nút tactile ≥48px + gờ ≥4px; record button ≥72px; touch ≥44px; focus ring.
- Một primary cho CTA; semantic màu (record đỏ khi đang ghi = trạng thái, không phải reward); reward-amber chỉ ở tổng kết; nhãn UI **tiếng Việt** qua i18n (rà nhãn Đức); prefers-reduced-motion (tắt pulse/waveform-anim).

## Acceptance (theo parity-audit-process)
- [ ] `pnpm check:quick` + `pnpm --filter @fuxie/ui typecheck` xanh.
- [ ] Visual-capture (fixture=visual-qa, RENDER THẬT không lỗi): speaking-hub (default/empty); speaking-player state **idle / recording / recorded / scored**; speaking-roleplay (stage) — mobile.
- [ ] **Số đo**: kích thước record button, min-height + gờ PrimaryCta/OptionTile; axe 0 serious/critical; contrast ≥4.5:1; touch ≥44px.
- [ ] Immersive: player che hub; hết badge "Issues".
- [ ] Scorecard {UI} — mọi MUST ✅.
- [ ] `git diff` chỉ apps/web (+packages/ui nếu cần); ai-service/content/srs-engine/database nguyên vẹn.
- [ ] Gửi screenshot render THẬT đủ state + số đo + log console.

> Ghi chú {PROD}: chất lượng chấm phát âm (thuật toán) là ai-service — ngoài phạm vi; ticket chỉ lo UI hiển thị điểm/đánh dấu. Xem `product-gap-register.md`.
