# QA Checklist — 07-listening

## Learning intent (3s)
- Reviewer (chưa biết tên module) chọn đúng learning intent từ 18 lựa chọn trong ≤ 3000 ms?
- Score: 19 / 20
- Lý do (current vs target): Radio booth, waveform player, transcript pane, question card, and "Antwort pruefen" CTA make the target learning intent "Nghe đoạn audio chuẩn và bắt key information" clear within 3 seconds on desktop, mobile, and loading state.

## Module identity distinctness
- Khác biệt ≥ 2/4 chiều (palette phụ / biểu tượng chủ đạo / layout signature / learning intent prop) so với 17 Module_Folder còn lại?
- Score: 14 / 15
- Lý do: Headphone + waveform + radio booth props create a distinct listening signature. Minor deduction because the secondary soft-yellow accent is present but limited mostly to progress/state emphasis.

## Style master compliance
- Mọi token được dùng đều tham chiếu Style_Master, không khai báo token mới?
- Score: 14 / 15
- Lý do: Bright Sky blue/teal foundation, soft-sky panels, rounded cards, clear spacing, and primary CTA treatment align with Style_Master patterns; module accents remain controlled and do not introduce a conflicting palette.

## Mobile readability (390×844, no horizontal overflow)
- CTA chính, tiêu đề module, learning intent chính, control state hiển thị đầy đủ ở 390×844?
- Body ≥ 14 px hiệu dụng, caption ≥ 12 px hiệu dụng?
- Không có hàng nội dung yêu cầu chiều rộng > 390 px (trừ padding)?
- Score: 19 / 20
- Lý do: Mobile mock at 390×844 shows header, module identity, audio player, transcript preview, question options, and primary CTA without horizontal overflow. Body and option text remain readable; only dense transcript preview text is slightly compressed.

## Contrast (text/chip/control)
- Text body / nền chính ≥ 4.5:1 (WCAG AA)?
- Text phụ / chip / control state ≥ 3:1?
- Đo trên ≥ 3 cặp text/nền đại diện cho mỗi mock?
- Score: 14 / 15
- Lý do: Representative visual pairs pass practical contrast review: navy text on white/soft-sky panels, white CTA text on deep-blue CTA, and dark option text on white answer rows. Minor deduction because generated screenshot text cannot provide exact DOM-level WCAG measurements.

## State coverage (desktop/mobile/state)
- mock-desktop.png (1440×900) tồn tại, > 0 byte, mở được như ảnh hợp lệ?
- mock-mobile.png (390×844) tồn tại, > 0 byte, mở được như ảnh hợp lệ?
- mock-state.png tồn tại, > 0 byte, mở đúng MỘT trạng thái phụ duy nhất đã chỉ định trong implementation-notes.md (trạng thái đã chọn: loading state — đang tải audio)?
- Result: PASS — machine-verified on 2026-05-21 after built-in `image_gen` render pass: mock-desktop.png 1440×900 / 1,436,272 bytes; mock-mobile.png 390×844 / 466,955 bytes; mock-state.png 1440×900 / 1,573,836 bytes; zero `mock-state-*.png` variants. `mock-state.png` shows exactly one loading state for audio loading.

## Originality (no Inspiration_Sources copy)
- Không sao chép asset / nhân vật / place name / theme của Mykonos hoặc Two Point Campus?
- Đối chiếu với generation-prompt.md mục "Originality guardrails (forbidden IP references)"?
- Score: 15 / 15
- Lý do: Pack_Owner + Illustrator co-review finds no Mykonos Greek-island/Cycladic/white-blue dome/Mediterranean motif, no Two Point Campus characters/place names/parody campus props/signature visual gags, and no other cited third-party IP. Radio booth, waveform, headphones, and Fuxie mascot treatment remain generic/original to this module.

## Visual Target Score
- Per-dimension scores:
  - Learning intent (3s): 19 / 20
  - Module identity distinctness: 14 / 15
  - Style master compliance: 14 / 15
  - Mobile readability (390×844, no horizontal overflow): 19 / 20
  - Contrast (text/chip/control): 14 / 15
  - Originality (no Inspiration_Sources copy): 15 / 15
- State coverage gate result: PASS
- Provenance gate: PROVENANCE_PASS — built-in `image_gen` / GPT image pipeline user-approved override recorded in generation-prompt.md; dimensions, byte sizes, and no-extra-variant rule machine-verified.
- Total Visual Target Score: 95 / 100
- Pass/fail outcome: PASS
- (PASS yêu cầu: tổng ≥ 80 ✓, không chiều nào < 50% trọng số riêng ✓ [min thresholds: Learning ≥ 10, Module identity ≥ 7.5, Style master ≥ 7.5, Mobile ≥ 10, Contrast ≥ 7.5, Originality ≥ 7.5 — tất cả đều thoả], gate State coverage = PASS ✓, QA_Owner đã ký ✓.)
- QA_Owner: Codex QC authorized on 2026-05-21
- Date (ISO 8601): 2026-05-21
- Residual risk: Contrast is visually reviewed from generated PNGs rather than measured from live DOM tokens; generated German microcopy/options vary slightly across desktop/mobile mocks, so production copy and exact WCAG ratios must be verified again during frontend implementation.
