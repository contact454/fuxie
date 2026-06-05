# Slice C — Shared shell + reward parity

Owner: Claude (spec/QC) → Antigravity (implement), Product Designer (visual sign-off).
Date: 2026-06-03. Model: `.agents/workflows/three-agent-delivery-model.md`. Assets: none new.

> **STATUS: READY — design direction LOCKED 2026-06-03 (owner).** D1=deep-blue
> immersive chrome, D2=keep sidebar-only on desktop (align mobile header), D3=defer
> Fucoin/level chips to C-2. The Antigravity prompt at the bottom is now live.

## Context & Goal

Per the locked decision (`phase-34`, "shell + reward first"), align the **shared
skill chrome** to the Quest Worlds mock and keep module interiors untouched. A
fan-out audit found a critical architecture nuance:

**The mock fixture (`SkillFixtureShell`) is one monolithic shell. Production splits
the same responsibilities across three layers:**

| Fixture region | Real production owner | Path |
| --- | --- | --- |
| Top header (logo, level/XP/coin chips) | `MobileShell` header + `Sidebar` logo | `shared/mobile-shell.tsx:80`, `shared/sidebar.tsx:44` |
| Desktop nav + mobile bottom nav | `Sidebar` (desktop) + `MobileShell` bottom-nav | `sidebar.tsx:64`, `mobile-shell.tsx:156` |
| Sticky motivation banner + reward chip | `SkillMotivationLayer` (reading/listening/writing only) | `gamification/skill-motivation-layer.tsx:192` |
| Coach aside + XL stage mascot | **module interior** (`SkillMotivationRail`/`FuxieCoach` inside players) | `quest-visuals.tsx:761` |
| Bottom progress footer (Zurück/Weiter + bar) | **does not exist as shared chrome** — each player draws its own | — |

Every `(learn)` route is wrapped by `MobileShell`/`Sidebar` (`app/(learn)/layout.tsx:19`),
so **header + nav are the only true cross-skill surfaces** we can align without
editing any module interior.

## Scope

**IN SCOPE (shared chrome + shared reward components, zero interior edits):**
- `MobileShell` header + mobile bottom-nav restyle.
- `Sidebar` palette / active style / logo lockup / daily-goal card.
- `globals.css` chrome tokens (`.mobile-header`, `.bottom-nav*`, sidebar tokens).
- `SkillMotivationLayer` sticky banner + reward chip styling (the only shell-level reward surface; R/L/W).
- *(Optional)* restyle the **definitions** of `FuxieCoach` / `RewardPreview` / `RewardRevealMoment` in `quest-visuals.tsx` — propagates the reward-moment look to every skill at once (touch visual classes only, not call sites).

**OUT OF SCOPE — deferred to future per-module slices (D-prefix):**
- Coach aside + XL stage mascot (interior in every player).
- Bottom progress footer Zurück/Weiter + progress bar (no shared equivalent).
- Immersive full-screen content stage (player-owned).
These cannot be reached through shared chrome without editing module interiors,
which the locked decision forbids.

## Design decisions — LOCKED 2026-06-03 (owner)

- **D1 = Deep-blue immersive (CHROME only).** Shared chrome (header / sidebar /
  bottom-nav) flips to the mock palette: base/header `#075aa4` / `#064987`, borders
  `#8bd3ff/30`, active = teal `#2EC4B6`, amber `#FFB703` only for reward/XP accents.
  **Scope nuance:** "immersive" applies to the **chrome frame**, NOT the content area —
  each module renders its own content/cards (interior, untouched). This still matches
  dashboard/session's blue feel and the mock's "blue shell + light content card."
- **D2 = Keep sidebar-only on desktop.** No new desktop top bar. Align the **mobile**
  header to the mock; desktop keeps the (restyled, now deep-blue) left `Sidebar`.
- **D3 = Defer wallet chips to C-2.** No Fucoin/level chip in this slice — keep the
  existing XP chip (styled to match). Live wallet data plumbing is C-2.

## Requirements (after D1–D3 are locked)

- **R-1 — Header parity.** The shared mobile header (`mobile-shell.tsx:80-115`) SHALL match the locked visual direction (palette, logo lockup, chip set per D3).
- **R-2 — Nav parity.** Desktop `Sidebar` and mobile bottom-nav SHALL match the mock's palette and active state (active = teal per D1), keeping the existing route set + pathname-based active logic.
- **R-3 — Motivation/reward chip parity.** `SkillMotivationLayer` banner + reward chip SHALL match the mock reward styling. If the optional shared-component restyle is approved, `FuxieCoach`/`RewardPreview`/`RewardRevealMoment` definitions SHALL be restyled (visual classes only).
- **R-4 — No interior edits.** No edits to module players/exercise components (see must-not-touch). Parity for coach-aside/footer is explicitly deferred.
- **R-5 — No regression on bypassed routes.** Dashboard & Session (`isMockupAlignedRoute`) already bypass the shell; verify they are visually unchanged. Auth/onboarding chrome unaffected.
- **R-NF — Gates green** (`check:quick`, `test:core`, `build`); visual QA on vocabulary, grammar, reading, listening, writing, speaking, exam pages.

## Tech Design — edit list

**Edit (shared only):**
1. `apps/web/src/components/shared/mobile-shell.tsx` — header look + bottom-nav (+ chips only if D3=now).
2. `apps/web/src/components/shared/sidebar.tsx` — palette/active/logo/daily-goal card.
3. `apps/web/src/app/globals.css` — `.mobile-header` (`:448`), `.bottom-nav*` (`:586+`), sidebar tokens.
4. `apps/web/src/components/gamification/skill-motivation-layer.tsx` — banner + reward chip styling.
5. *(Optional)* `apps/web/src/components/gamification/quest-visuals.tsx` — restyle `FuxieCoach`/`RewardPreview`/`RewardRevealMoment` definitions only.

**MUST NOT TOUCH (interiors):** `components/vocabulary/**`, `grammar/{LessonPlayer,ExerciseRenderer,TheoryRenderer}.tsx`, `speaking/**`, `exam/**`, `listening/lesson-player.tsx`, `reading/reading-player.tsx`, `writing/writing-player.tsx`, the per-skill `*-skill-shell.tsx` composition, and `(learn)/**/page.tsx` wiring. The in-player `SkillMotivationRail`/`FuxieCoach`/footers are interior and stay.

## Asset plan
**No new assets.** Mascot poses, world props, reward art all resolve via the registry (`docs/design/asset-reuse-map.md`). Codex: none.

## Task List (after sign-off)
- **T-1** (R-1): MobileShell header → locked direction.
- **T-2** (R-2): Sidebar + bottom-nav palette/active.
- **T-3** (R-3): SkillMotivationLayer banner + reward chip; (optional) shared component restyle.
- **T-4** (R-5): Verify dashboard/session/auth unchanged.
- **T-5** (R-NF): Gates + visual QA on all 7 skill pages.

## Acceptance / QC (Claude)
1. All 7 skill pages show the locked shell look (header + nav) with no layout breakage.
2. Active nav item highlights correctly per pathname on every page.
3. Reward chip / shared reward components match the mock styling.
4. No module interior diffed; dashboard/session/auth visually unchanged.
5. `check:quick`, `test:core`, `build` green.

## Antigravity prompt (copy-paste)

```
ROLE: You are the Frontend Engineer for Fuxie (Next.js App Router, TypeScript, Tailwind + globals.css), executing a fixed visual-parity spec. Do not make UX decisions; if ambiguous, stop and ask.

OBJECTIVE: Slice C-1 — bring the SHARED skill chrome to the Quest Worlds deep-blue mock look with ZERO edits to module interiors. Deliver blue chrome (header / sidebar / bottom-nav) + aligned reward styling across all skill pages.

REPO CONTEXT: root C:\Users\DMF Schule\9-Fuxie, app at apps/web. Read docs/delivery/slice-C-shared-shell-reward-parity.md and .agents/workflows/three-agent-delivery-model.md. Target look = SkillFixtureShell in apps/web/src/components/visual-fixtures/slice-2-skill-fixtures.tsx (header/nav palette + active states).

LOCKED DIRECTION: D1 = deep-blue immersive CHROME only (#075aa4 / #064987, borders #8bd3ff/30, active teal #2EC4B6, amber #FFB703 only for reward/XP accent). Content areas stay as modules render them — do NOT push blue into content or interiors. D2 = desktop stays sidebar-only (no new top bar); align the mobile header only. D3 = NO Fucoin/level chips this slice (keep the existing XP chip, restyled); wallet chips are deferred to C-2.

EDIT ONLY: apps/web/src/components/shared/mobile-shell.tsx (mobile header + bottom-nav), apps/web/src/components/shared/sidebar.tsx (palette/active/logo/daily-goal card → deep blue), apps/web/src/app/globals.css (.mobile-header, .bottom-nav*, sidebar tokens), apps/web/src/components/gamification/skill-motivation-layer.tsx (banner + reward chip accent). OPTIONAL: apps/web/src/components/gamification/quest-visuals.tsx — restyle the VISUAL CLASSES of FuxieCoach / RewardPreview / RewardRevealMoment definitions only (propagates to all skills); do not change props or call sites.

MUST NOT TOUCH: any module interior — components/{vocabulary,grammar,speaking,exam}/**, listening/lesson-player.tsx, reading/reading-player.tsx, writing/writing-player.tsx, the per-skill *-skill-shell.tsx composition, and app/(learn)/**/page.tsx. No new data fetch; do not modify app/(learn)/layout.tsx data. Render no new assets.

REGRESSION GUARD: /dashboard and /session bypass the shell via isMockupAlignedRoute (mobile-shell.tsx:66-75) — confirm they are visually unchanged. Auth/onboarding chrome must be unaffected.

ACCEPTANCE: all 5 QC items in the spec pass; pnpm check:quick, pnpm test:core, pnpm build all green; visual QA on vocabulary, grammar, reading, listening, writing, speaking, exam (blue chrome, correct active nav item, content/interiors unchanged).

REPORT FORMAT: (1) per-file diff hunks; (2) gate outputs; (3) before/after screenshots of one skill page (desktop + mobile) + a dashboard screenshot proving it is unchanged; (4) confirmation that no interior / page.tsx / layout files changed; (5) any ambiguity you hit.
```

## Follow-on (deferred slices, not Slice C)
- **D-coach** — re-home or restyle the coach aside per module (interior).
- **D-footer** — shared bottom progress footer (needs per-player refactor).
- **C-2** — data-backed Fucoin/level chips in the shared header (wallet plumb into `(learn)/layout.tsx`).
