# QA Checklist — 00-style-master

## Learning intent (3s)
- Reviewer (chưa biết tên module) chọn đúng learning intent từ 18 lựa chọn trong ≤ 3000 ms?
- Score: 19 / 20
- Lý do (current vs target): Codex QC verdict 2026-05-17 — "Desktop, mobile, and state all read as a Fuxie style-master / design-system mock within 3 seconds." Score adopted from Codex QC pass-candidate after Pack_Owner co-review.

## Token coverage
- Style_Master mô tả đủ token (color/typography/spacing/radius/shadow/icon) cho 17 Module_Folder downstream?
- Score: 14 / 15
- Lý do: Codex QC verdict — "Palette, type, icons, buttons, states, mascot, badge/progress samples, contrast cards, and isometric/elevation cues are visible." Token Registry trong implementation-notes.md liệt kê đủ primary palette (5), secondary palette (≥ 18), typography (5), spacing (6), radius (3), shadow (2), icon family (≥ 17), mascot, illustration, isometric staging.

## Style master compliance
- Mọi token được dùng đều tham chiếu Style_Master, không khai báo token mới?
- Score: 14 / 15
- Lý do: Codex QC verdict — "Strong Fuxie Bright Sky palette, controlled teal/amber emphasis, consistent rounded/chunky game UI language." Style_Master IS canonical, không có token nào được khai báo ngoài Token Registry.

## Mobile readability (390×844, no horizontal overflow)
- CTA chính, tiêu đề module, learning intent chính, control state hiển thị đầy đủ ở 390×844?
- Body ≥ 14 px hiệu dụng, caption ≥ 12 px hiệu dụng?
- Không có hàng nội dung yêu cầu chiều rộng > 390 px (trừ padding)?
- Score: 18 / 20
- Lý do: Codex QC verdict — "Mobile hierarchy is clear at 390x844; labels are larger and cleaner than the previous pass. Minor generated text remains mock-only." `mock-mobile.png` machine-verified at 390×844 (IHDR `00 00 01 86 00 00 03 4C` = 390×844).

## Contrast (text/chip/control)
- Text body / nền chính ≥ 4.5:1 (WCAG AA)?
- Text phụ / chip / control state ≥ 3:1?
- Đo trên ≥ 3 cặp text/nền đại diện cho mỗi mock?
- Score: 14 / 15
- Lý do: Codex QC verdict — "Major UI surfaces appear high-contrast." Three representative pairs reviewed via Codex QC (primary CTA text/background, state card text/background, mobile token/card text/background). In-image WCAG numbers were treated as visual hint only, not adopted as evidence per Requirement 4 AC 4. Final measurement-based audit deferred to post-PASS implementation phase.

## State coverage (desktop/mobile/state)
- mock-desktop.png (1440×900) tồn tại, > 0 byte, mở được như ảnh hợp lệ?
- mock-mobile.png (390×844) tồn tại, > 0 byte, mở được như ảnh hợp lệ?
- mock-state.png tồn tại, > 0 byte, mở đúng MỘT trạng thái phụ duy nhất đã chỉ định trong implementation-notes.md (trạng thái đã chọn: interaction primary state — CTA hover/focus + chip selected + state swatches (success/warning/danger))?
- Result: PASS
- Machine verification (2026-05-17):
  - `mock-desktop.png`: PNG signature `89 50 4E 47 0D 0A 1A 0A` valid; IHDR `00 00 05 A0 00 00 03 84` = 1440×900; size 1 889 886 bytes (> 0). PASS.
  - `mock-mobile.png`: PNG signature valid; IHDR `00 00 01 86 00 00 03 4C` = 390×844; size 467 597 bytes (> 0). PASS.
  - `mock-state.png`: PNG signature valid; IHDR `00 00 05 A0 00 00 03 84` = 1440×900; size 1 880 593 bytes (> 0). Codex QC confirms exactly one state — interaction-primary (default/hover/focus/pressed/disabled, selected chips, status cards). PASS.
  - All three reference exactly one mock-state.png; zero `mock-state-*.png` variants. PASS.

## Originality (no Inspiration_Sources copy)
- Không sao chép asset / nhân vật / place name / theme của Mykonos hoặc Two Point Campus?
- Đối chiếu với generation-prompt.md mục "Originality guardrails (forbidden IP references)"?
- Score: 13 / 15
- Lý do: Codex QC verdict — "No obvious direct copying. Inspiration reads as abstract technique/design feeling, not protected assets." Originality co-review by Pack_Owner + Illustrator / 3D Mascot Artist (delegated sign-off via Kiro on 2026-05-17 based on Codex QC report) confirms:
  - Mykonos: no Greek-island theme, no Cycladic architecture, no white-blue domes, no Mediterranean place identity. PASS.
  - Two Point Campus: no characters, no logos, no room/prop parody, no campus gag/signature look. PASS.
  - Other third-party IP: none cited; none observed. PASS.

## Visual Target Score
- Per-dimension scores:
  - Learning intent (3s): 19 / 20
  - Token coverage: 14 / 15
  - Style master compliance: 14 / 15
  - Mobile readability (390×844, no horizontal overflow): 18 / 20
  - Contrast (text/chip/control): 14 / 15
  - Originality (no Inspiration_Sources copy): 13 / 15
- State coverage gate result: PASS
- Total Visual Target Score: 92 / 100
- Pass/fail outcome: PASS
- (PASS yêu cầu: tổng ≥ 80 ✓, không chiều nào < 50% trọng số riêng ✓ [min 50% thresholds: Learning ≥ 10, Token ≥ 7.5, Style master ≥ 7.5, Mobile ≥ 10, Contrast ≥ 7.5, Originality ≥ 7.5 — tất cả đều thoả], gate State coverage = PASS ✓, QA_Owner đã ký ✓.)
- QA_Owner: QA_Owner (delegated sign-off via Kiro on 2026-05-17 — score adopted from Codex QC 2026-05-17, Pack_Owner authorized on 2026-05-17)
- Pack_Owner co-sign (Originality): Pack_Owner (delegated sign-off via Kiro on 2026-05-17 based on Codex QC report)
- Date (ISO 8601): 2026-05-17
- Provenance: see [`.kiro/specs/fuxie-visual-mocktest-pack/codex-style-master-visual-qc-2026-05-17.md`](../../../.kiro/specs/fuxie-visual-mocktest-pack/codex-style-master-visual-qc-2026-05-17.md) for the Codex QC pass-candidate report (provisional 92/100). Pack_Owner authorized adoption of these scores as the official sign-off in the user message of 2026-05-17.
- Sign-off effect: `00-style-master` PASS unlocks Wave 2..18. Wave 2 (`01-dashboard`) is now READY_FOR_CODEX_RENDER per render-queue.json / render-queue.md.
