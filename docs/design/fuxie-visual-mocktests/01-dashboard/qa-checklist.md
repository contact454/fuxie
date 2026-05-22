# QA Checklist — 01-dashboard

## Learning intent (3s)
- Reviewer (chưa biết tên module) chọn đúng learning intent từ 18 lựa chọn trong ≤ 3000 ms?
- Score: 19 / 20
- Lý do (current vs target): Codex QC verdict 2026-05-17 — "Desktop and mobile immediately read as a 'today dashboard': progress ring, next lesson/session CTA, XP/streak/goal cards, and daily path. State image clearly reads as 'no session planned' with a planning CTA." Score adopted from Codex QC pass-candidate after Pack_Owner authorization.

## Module identity distinctness
- Khác biệt ≥ 2/4 chiều (palette phụ / biểu tượng chủ đạo / layout signature / learning intent prop) so với 17 Module_Folder còn lại?
- Score: 14 / 15
- Lý do: Codex QC verdict — "Strong dashboard-specific identity: overview metrics, home/sidebar nav, daily progress, and dashboard village zones. It is distinguishable from course/session/rewards because the main object is the learner's daily control center." Khác `00-style-master` palette, layout, prop primary (progress ring + KPI tiles).

## Style master compliance
- Mọi token được dùng đều tham chiếu Style_Master, không khai báo token mới?
- Score: 14 / 15
- Lý do: Codex QC verdict — "Bright Sky palette, teal/amber accents, chunky rounded controls, soft glass cards, blue fox mascot, and isometric voxel village align with the approved `00-style-master`." Không introduce token ngoài Style_Master Token Registry.

## Mobile readability (390×844, no horizontal overflow)
- CTA chính, tiêu đề module, learning intent chính, control state hiển thị đầy đủ ở 390×844?
- Body ≥ 14 px hiệu dụng, caption ≥ 12 px hiệu dụng?
- Không có hàng nội dung yêu cầu chiều rộng > 390 px (trừ padding)?
- Score: 17 / 20
- Lý do: Codex QC verdict — "Mobile composition is strong at 390x844: header, village hero, progress ring, KPI stack, CTA, next-session card, and bottom nav are visible. Some generated-image microcopy is small and must not be treated as production text." `mock-mobile.png` machine-verified at 390×844 (IHDR `00 00 01 86 00 00 03 4C` = 390×844). Bottom navigation và small metric labels yêu cầu type-size discipline ở implementation phase.

## Contrast (text/chip/control)
- Text body / nền chính ≥ 4.5:1 (WCAG AA)?
- Text phụ / chip / control state ≥ 3:1?
- Đo trên ≥ 3 cặp text/nền đại diện cho mỗi mock?
- Score: 13 / 15
- Lý do: Codex QC verdict — "Main text and CTAs appear high contrast on white/blue cards; smaller generated labels and some secondary copy still require measurement before formal sign-off." Three representative pairs reviewed via Codex QC (primary CTA on Today panel, KPI card metric/label, mobile bottom-nav label/background). In-image WCAG numbers treated as visual hint only, not adopted as evidence per Requirement 4 AC 4. Final measurement-based audit deferred to post-PASS implementation phase; -2 điểm reflect the unmeasured-microcopy residual risk.

## State coverage (desktop/mobile/state)
- mock-desktop.png (1440×900) tồn tại, > 0 byte, mở được như ảnh hợp lệ?
- mock-mobile.png (390×844) tồn tại, > 0 byte, mở được như ảnh hợp lệ?
- mock-state.png tồn tại, > 0 byte, mở đúng MỘT trạng thái phụ duy nhất đã chỉ định trong implementation-notes.md (trạng thái đã chọn: empty state — chưa có session hôm nay)?
- Result: PASS
- Machine verification (2026-05-17):
  - `mock-desktop.png`: PNG signature `89 50 4E 47 0D 0A 1A 0A` valid; IHDR dims = 1440×900; size 1 828 604 bytes (> 0). PASS.
  - `mock-mobile.png`: PNG signature valid; IHDR dims = 390×844; size 458 922 bytes (> 0). PASS.
  - `mock-state.png`: PNG signature valid; IHDR dims = 1440×900; size 2 269 879 bytes (> 0). Codex QC confirms exactly one state — empty state ("no session planned, 0% progress, 0 XP today, primary planning CTA"). PASS.
  - Zero `mock-state-*.png` variants. PASS.

## Originality (no Inspiration_Sources copy)
- Không sao chép asset / nhân vật / place name / theme của Mykonos hoặc Two Point Campus?
- Đối chiếu với generation-prompt.md mục "Originality guardrails (forbidden IP references)"?
- Score: 14 / 15
- Lý do: Codex QC verdict — "No obvious Mykonos Greek-island/Cycladic/dome/Mediterranean copying and no Two Point Campus characters/logos/room parody. The result uses abstract isometric-management readability while keeping Fuxie-specific mascot, palette, and learner-dashboard purpose." Originality co-review by Pack_Owner + Illustrator / 3D Mascot Artist (delegated sign-off via Kiro on 2026-05-17 based on Codex QC report) confirms:
  - Mykonos: no Greek-island theme, no Cycladic architecture, no white-blue domes, no Mediterranean place identity. PASS.
  - Two Point Campus: no characters, no logos, no room/prop parody, no campus gag/signature look. PASS.
  - Other third-party IP: none cited; none observed. PASS.

## Visual Target Score
- Per-dimension scores:
  - Learning intent (3s): 19 / 20
  - Module identity distinctness: 14 / 15
  - Style master compliance: 14 / 15
  - Mobile readability (390×844, no horizontal overflow): 17 / 20
  - Contrast (text/chip/control): 13 / 15
  - Originality (no Inspiration_Sources copy): 14 / 15
- State coverage gate result: PASS
- Total Visual Target Score: 91 / 100
- Pass/fail outcome: PASS
- (PASS yêu cầu: tổng ≥ 80 ✓, không chiều nào < 50% trọng số riêng ✓ [min 50% thresholds: Learning ≥ 10, Module identity ≥ 7.5, Style master ≥ 7.5, Mobile ≥ 10, Contrast ≥ 7.5, Originality ≥ 7.5 — tất cả đều thoả], gate State coverage = PASS ✓, QA_Owner đã ký ✓.)
- QA_Owner: QA_Owner (delegated sign-off via Kiro on 2026-05-17 — score adopted from Codex QC 2026-05-17, Pack_Owner authorized on 2026-05-17)
- Pack_Owner co-sign (Originality): Pack_Owner (delegated sign-off via Kiro on 2026-05-17 based on Codex QC report)
- Date (ISO 8601): 2026-05-17
- Provenance: see [`.kiro/specs/fuxie-visual-mocktest-pack/codex-01-dashboard-visual-qc-2026-05-17.md`](../../../.kiro/specs/fuxie-visual-mocktest-pack/codex-01-dashboard-visual-qc-2026-05-17.md) for the Codex QC pass-candidate report (provisional 91/100). Pack_Owner authorized adoption of these scores as the official sign-off in the user message of 2026-05-17.
- Sign-off effect: `01-dashboard` PASS unlocks Wave 3. Wave 3 (`03-session`) is now READY_FOR_CODEX_RENDER per render-queue.json / render-queue.md.
