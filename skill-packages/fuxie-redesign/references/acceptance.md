# Acceptance — both gates must pass

A slice is only "done" — and only eligible to be scaled to other screens/skills — when both
the objective gate (B) and the intuition gate (A) pass. This two-gate rule exists because
the old build looked "fine" in isolation but fragmented in aggregate; B catches the
fragmentation, A catches the soul.

## Gate B0 — Duolingo-parity rubric (SÀN TỐI THIỂU, TOÀN NỀN TẢNG, bắt buộc)
Trước khi xét gì khác, MỌI màn learner-facing của toàn app phải đạt **tất cả tiêu chí MUST** trong `docs/design/duolingo-parity-rubric.md` v2 (cơ sở: `docs/design/duolingo-deep-dive.md`). Gồm A–H mỗi màn (nút tactile có gờ ≥48px; chữ ≥22px/≥700; contrast ≥4.5:1; 4 trạng thái đáp án + feedback Check→đúng/sai + Continue; nền bài sạch; motion; nhịp 4pt mobile-first; nhất quán; WCAG AA) **và** J/K/L tầng hệ thống (gamification: XP/streak/daily goal/league/hearts/gems/quest/badge; onboarding play-first; mascot ≥5 trạng thái + honor reduced-motion mặc định). Thiếu 1 MUST = REJECT, không merge/không nhân rộng. Sàn = **bằng Duolingo**; "thế giới/làng" là điểm vượt (NICE), không thay MUST.

**Cách chấm:** theo `docs/design/parity-audit-process.md` — chỉ gate các lá {UI} của cây `duolingo-criteria-tree.md`; mỗi lá cần bằng chứng (screenshot state/số đo/a11y). Lá {PROD} (gamification/SRS…) ghi `docs/design/product-gap-register.md`, không chặn UI. Antigravity thu bằng chứng + số đo khi làm ticket; Claude chấm scorecard + sinh fix ticket cho lá ❌.

## Gate B — objective (sánh chuẩn)
- [ ] Side-by-side with Mykonos voxel: same class of world unity — one angle, one light
      source, one palette across all assets.
- [ ] Side-by-side with Duolingo: action → instant feedback → reward loop is clear; every
      tappable element has a tactile micro-interaction.
- [ ] Monument Valley spirit: minimal, generous negative space, not cluttered.
- [ ] 100% of slice assets pass the STYLE LOCK (no asset off-angle, off-light, off-palette).
- [ ] Mobile: every touch target ≥ 44px; no "desktop-compressed" layout.
- [ ] Token contracts intact: reward-amber containment + energy ≤5% + Primary_CTA
      discipline all pass (`pnpm check:quick`).

## Gate A — intuition (chủ dự án)
- [ ] On a real phone, swiping the whole slice end-to-end feels like a real learning game
      you'd be proud to show.
- [ ] The "world grows after you learn" moment lands as a genuine reward.

## Scaling rule
Do not replicate the pattern across other skills/screens until both gates are green for the
slice. Scaling a half-right pattern is how patchiness spreads.
