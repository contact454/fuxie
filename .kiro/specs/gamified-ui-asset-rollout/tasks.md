# Implementation Plan: Gamified UI Asset Rollout

Vai chinh: Project Manager / Delivery Manager
Vai phoi hop: Frontend Engineer, Gamification Designer, Design System Designer

## Overview

Convert the feature design into a sequenced implementation plan that wires the existing 7-map Asset Registry, three backbone components (`MascotRoleHost`, `SkillMotivationLayer`, `ResultRewardLoop`), and 13 P0 learner surfaces into shippable code under `apps/web/src/`. Each task builds on previous steps so there is no orphaned code: registry foundations → CI guardrails → shared design-system primitives → backbone components → surface integration (Dashboard → Course → Vocabulary → Skill players → Result loop → Shop → Review → Exam → Locked/Empty/Error) → property test coverage → DoD sign-off.

**Implementation language**: TypeScript (existing Next.js workspace `apps/web/`).
**Target file roots**: `apps/web/src/lib/mascot/`, `apps/web/src/components/gamification/`, `apps/web/src/components/ui/`, `apps/web/src/app/(learn)/**`, `apps/web/src/hooks/`, `scripts/`, `apps/web/messages/`, `tests/`, `docs/design/`.
**Ownership legend** (each leaf task carries an `Owner:` annotation):
- `FE` — Frontend Engineer (component code, surface wiring, hooks)
- `GD` — Gamification Designer (loop tuning, reward pacing, copy of motivation layer/result loop)
- `DSD` — Design System Designer (tokens, scrim/CTA primitives, palette governance)
- `PM` — Project Manager / Delivery Manager (release checklist, DoD gating, QA-runbook execution coordination)

## Tasks

- [x] 1. Asset Registry foundation and lookup totality
  - [x] 1.1 Add `PLACEHOLDER_ASSET` constant and finalize 7-map exports in `fuxie-assets.ts` / `reward-assets.ts`
    - Owner: FE
    - Outcome: `apps/web/src/lib/mascot/fuxie-assets.ts` exports `PLACEHOLDER_ASSET = '/mascot-3d/optimized/fuxie-placeholder-512.webp'` and the 6 typed maps (`FUXIE_3D_ASSETS`, `FUXIE_MASCOT_STATES`, `FUXIE_MODULE_MASCOTS`, `FUXIE_WORLD_PROPS`, `FUXIE_UI_FRAMES`, `FUXIE_LIVING_3D_ASSETS`). `apps/web/src/components/gamification/reward-assets.ts` exports `REWARD_ASSETS` plus `getRewardAssetSrc`.
    - Acceptance: `tsc --noEmit` passes; every map value is a string literal under `apps/web/public/`.
    - _Requirements: 1.1, 1.6_

  - [x] 1.2 Implement total lookup helpers with placeholder fallback and dev warnings
    - Owner: FE
    - Outcome: `getFuxieMascotSrc`, `getFuxieWorldPropSrc`, `getFuxieUiFrameSrc`, `getFuxieModuleMascotSrc`, `getFuxieGameMascotSrc`, `getFuxieFoundationAssetSrc`, `getFuxieLiving3dAsset`, `getRewardAssetSrc`, `getShopItemAssetSrc`, `getCefrBadgeAssetSrc` all return `string` (never null); on key miss they return `PLACEHOLDER_ASSET` and `console.warn` only when `process.env.NODE_ENV === 'development'`.
    - Acceptance: a manual jest scratch import resolving an unknown key returns `PLACEHOLDER_ASSET`.
    - _Requirements: 1.2, 1.6, 18.2_

  - [x] 1.3 Add World Prop tag map and `pickWorldProp(tags)` helper
    - Owner: FE
    - Co-author: DSD (tag taxonomy review)
    - Outcome: new file `apps/web/src/lib/mascot/fuxie-world-tags.ts` exporting `FUXIE_WORLD_PROP_TAGS`, `WorldTag` union, `pickWorldProp(tags: WorldTag[]): FuxieWorldProp` with deterministic fallback `villageSquare`.
    - Acceptance: `pickWorldProp(['library'])` returns a key whose tag set intersects `['library', 'library-shelf', 'reading-room']`.
    - _Requirements: 6.4, 6.5, 6.6, 6.7, 6.8_

  - [x]* 1.4 Property test: Asset Registry Integrity + Lookup Totality
    - Owner: FE
    - **Property 1: Asset Registry Integrity** — for every `(group, key)`, `fs.existsSync(public/<path>)` is true.
    - **Property 3: Lookup Totality with Placeholder** — for any `s ∈ String`, `getFuxieMascotSrc(s) ∈ valid_paths ∪ {PLACEHOLDER_ASSET}` and miss ⇒ `PLACEHOLDER_ASSET`.
    - File: `tests/asset-registry.spec.ts` using `fast-check` with `numRuns: 100`.
    - **Validates: Requirements 1.1, 1.4, 1.5, 1.6, 19.1**

- [x] 2. CI guardrails (lint, integrity, audit, locale parity)
  - [x] 2.1 Implement hardcoded-path lint script
    - Owner: FE
    - Outcome: `scripts/lint-asset-registry-references.ts` walks `apps/web/src/**/*.{ts,tsx}` (excluding `fuxie-assets.ts`, `fuxie-global-assets.ts`, `reward-assets.ts`, and their tests), greps for forbidden prefixes, fails non-zero with `<file>:<line>: <literal>`. Allow-comment escape `// asset-registry-allow`. Wired as `pnpm lint:asset-paths` in `package.json`.
    - Acceptance: Running on a fixture file containing `'/mascot-3d/raw/foo.png'` produces exit code 1.
    - _Requirements: 1.3_

  - [x] 2.2 Implement asset integrity check script
    - Owner: FE
    - Outcome: `scripts/asset-registry-integrity.ts` iterates 7 maps + alias map, asserts each value resolves to an existing file under `apps/web/public/`, fails with `<group>.<key>: <path>`. Wired as `pnpm check:asset-integrity`.
    - Acceptance: removing a referenced file makes the script exit non-zero.
    - _Requirements: 1.5_

  - [x] 2.3 Implement asset audit script (coverage, orphan, forbidden, optimized-preference)
    - Owner: FE
    - Co-author: DSD (archive doc format)
    - Outcome: `scripts/asset-audit.ts` enforces ≥95% coverage of optimized folders, flags orphans not listed in `docs/design/asset-archive.md`, fails on registry values inside `raw/|concept/|foundation/|reference-parts/`, and verifies `.webp` is preferred over `.png/.jpg` when both exist. Writes `tmp/asset-audit.md`. Wired as `pnpm check:asset-audit`.
    - Acceptance: Adding a new optimized file without a registry/archive entry fails the check.
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 18.1_

  - [x] 2.4 Create `docs/design/asset-archive.md` with seed entries
    - Owner: PM
    - Co-author: DSD
    - Outcome: file in the documented Markdown table format (`Path | Reason | Archived by | Date`) covering current orphans identified by `pnpm check:asset-audit`. Establish ownership convention for future archives.
    - Acceptance: `pnpm check:asset-audit` exits 0 after this file is committed.
    - _Requirements: 2.2, 2.5_

  - [x] 2.5 Implement locale parity + t() lint script
    - Owner: FE
    - Outcome: `scripts/check-locale-parity.ts` diffs keys of `apps/web/messages/vi.json` vs `de.json`, fails on missing keys or empty/whitespace-only values, and scans `apps/web/src/**/*.tsx` for learner-facing string literals not wrapped in `t()`. Wired as `pnpm check:locale-parity`.
    - Acceptance: Adding a key only to `vi.json` triggers a non-zero exit.
    - _Requirements: 17.1, 17.2, 17.3, 17.4_

  - [x] 2.6 Wire `pnpm check:quick` aggregate and CI workflow
    - Owner: PM
    - Co-author: FE
    - Outcome: `package.json` script `check:quick` chains lint:asset-paths → check:asset-integrity → check:asset-audit → check:locale-parity → test:property. CI workflow file (e.g. `.github/workflows/ci.yml`) runs `pnpm check:quick` on every PR and blocks merge on failure.
    - Acceptance: PR with intentional violation is blocked by CI.
    - _Requirements: 1.3, 1.5, 2.5, 17.2, 19_

  - [x]* 2.7 Property test: Asset Registry Reference Discipline
    - Owner: FE
    - **Property 2: Asset Registry Reference Discipline** — no source file under `apps/web/src/` (excluding registry files) contains forbidden path prefixes, and every Asset_Key referenced exists in the registry.
    - File: `tests/asset-discipline.spec.ts` using AST scan + `fast-check` with `numRuns: 100`.
    - **Validates: Requirements 1.2, 1.3, 19.2**

  - [x]* 2.8 Property test: Asset Audit Invariant
    - Owner: FE
    - **Property 4: Asset Audit Invariant** — coverage ≥0.95, every optimized file is referenced or archived or absent, registry values never under forbidden folders, optimized webp preferred.
    - File: `tests/asset-registry.spec.ts` (extends 1.4) with `numRuns: 100`.
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 18.1**

- [x] 3. Checkpoint — Foundation green
  - Ensure all CI scripts pass locally (`pnpm check:quick`), placeholder asset is committed, archive doc is current; ask the user if questions arise.

- [x] 4. Design system primitives (tokens, scrim, focus, motion)
  - [x] 4.1 Verify Bright Sky tokens and add reward/energy guardrails in `globals.css`
    - Owner: DSD
    - Outcome: confirm `--fuxie-blue-{50..900}`, `--fuxie-action`, `--fuxie-action-hover`, `--fuxie-success`, `--fuxie-energy`, `--fuxie-reward` exist; document in `docs/design/design-tokens.md`. Add lint rule or comment requiring `--fuxie-reward` only inside `[data-reward-state]`/`[data-reward-context]` selectors.
    - Acceptance: token names match design §F; doc references requirement clauses.
    - _Requirements: 16.1, 16.3, 16.4_

  - [x] 4.2 Implement `Scrim` component
    - Owner: FE
    - Co-author: DSD (intensity tokens)
    - Outcome: `apps/web/src/components/ui/scrim.tsx` with props `{ children, intensity?: 'soft' | 'strong' }`; soft = `rgba(255,255,255,0.8)`, strong = `rgba(23,59,86,0.85)`. Auto-applied by surfaces when world-prop background is detected and contrast falls below 4.5:1 (hook integration in 5.x).
    - Acceptance: Renders with `data-scrim-intensity` attribute matching prop.
    - _Requirements: 15.1, 15.3, 15.6_

  - [x] 4.3 Implement `useReducedMotion` hook
    - Owner: FE
    - Outcome: `apps/web/src/hooks/use-reduced-motion.ts` matches design §G; returns boolean reflecting `prefers-reduced-motion: reduce`, listens for changes, SSR-safe (initial value `false`).
    - Acceptance: Toggling the media query in jsdom updates the returned value within one render.
    - _Requirements: 13.2, 13.6_

  - [x] 4.4 Define animation class set and CSS rules constrained to transform/opacity
    - Owner: DSD
    - Co-author: FE
    - Outcome: `apps/web/src/styles/animations.css` (or extension of `globals.css`) declares the closed set `{animate-idle, animate-coach, animate-reward, animate-speak}`, every keyframe touches only `transform`/`opacity`, durations within `[120ms, 2000ms]`, with reduced-motion media query that strips them.
    - Acceptance: stylelint or visual review confirms no animated `top/left/width/height/margin/padding`.
    - _Requirements: 13.1, 13.2, 13.5, 13.7_

  - [x] 4.5 Implement `PrimaryCta` shared button primitive
    - Owner: DSD
    - Co-author: FE
    - Outcome: `apps/web/src/components/ui/primary-cta.tsx` enforces `data-role="primary-cta"`, ≥44×44 (≥48×48 prop variant for Review), Bright Sky background `var(--fuxie-action)`, focus outline ≥2px contrast ≥3:1, supports `disabled` and `secondary` variants (which strip `data-role`).
    - Acceptance: Storybook/dev render shows tap target ≥44×44 by computed style.
    - _Requirements: 14.1, 15.2, 15.4, 16.4, 19.3_

  - [x]* 4.6 Unit tests for Scrim, useReducedMotion, PrimaryCta
    - Owner: FE
    - Outcome: `tests/ui-primitives.spec.tsx` covering scrim attribute, hook toggle, primary-cta variants and tap-target size via `getBoundingClientRect`.
    - _Requirements: 13.2, 14.1, 15.2, 15.4_

- [x] 5. Mascot role system and reward state contract
  - [x] 5.1 Implement `MascotRole`, `RewardState`, `SurfaceState` types and `SURFACE_MASCOT_CONFIG`
    - Owner: GD
    - Co-author: FE
    - Outcome: `apps/web/src/lib/mascot/mascot-role.ts` exports the enums and the per-surface config table from design §B.1.
    - Acceptance: `MASCOT_ROLES` length is exactly 5; every P0 surface has an entry covering at least `default`.
    - _Requirements: 12.1, 12.2, 12.3_

  - [x] 5.2 Implement `MascotRoleHost` component with role validation
    - Owner: FE
    - Co-author: GD (rule semantics)
    - Outcome: `apps/web/src/components/gamification/mascot-role-host.tsx` resolves role from config + state, validates rules (cheer ⇒ earned/empty-reached-goal, guard ⇒ locked|empty|error, exam in-progress ⇒ silent), throws in dev / falls back to `silent` in prod, sets `data-mascot-role` attribute, picks pose key from `FUXIE_MASCOT_STATES`.
    - Acceptance: Rendering with mismatched role in dev mode throws an explicit error; prod fallback renders nothing for `silent`.
    - _Requirements: 12.4, 12.5, 12.6, 12.7, 12.8, 12.9_

  - [x] 5.3 Define `data-reward-state` / `data-reward-context` attribute contract
    - Owner: GD
    - Co-author: DSD
    - Outcome: short ADR `docs/design/reward-state-contract.md` listing the 5 states, allowed colors per state, and the streak amber exception (`data-reward-context="true"` when streak_count ≥ 1 within 24h).
    - Acceptance: doc cross-links Property 9 and Requirements 16.1, 16.5.
    - _Requirements: 16.1, 16.2, 16.5_

  - [x]* 5.4 Property test: Mascot Role Consistency + Reward State Enum
    - Owner: FE
    - **Property 5: Mascot_Role Consistency** — for any P0 surface and state, role ∈ {coach, companion, cheer, guard, silent} respecting cheer/guard/silent invariants.
    - **Property 6: Reward State Enum Discipline** — runtime values ∈ {preview, earned, receipt, locked, pending}.
    - **Property 23: Module Mascot Singleton** — each module cluster on Course renders exactly 1 module mascot.
    - File: `tests/mascot-role.spec.tsx` with `numRuns: 100`.
    - **Validates: Requirements 4.9, 12.1–12.9, 19.6, 19.7**

- [x] 6. Skill_Motivation_Layer and Result_Reward_Loop backbone components
  - [x] 6.1 Implement `SkillMotivationLayer` component
    - Owner: GD
    - Co-author: FE
    - Outcome: `apps/web/src/components/gamification/skill-motivation-layer.tsx` matches design §C: sticky-top, height ≤ `min(20vh, 169px)`, three zones (mascot=coach, progress text `done/total`, reward preview), `data-role="skill-motivation-layer"`, accepts `worldPropTags` and `reducedMotion` props, never overlaps content area.
    - Acceptance: jsdom test asserts bounding box height ≤169 and disjoint from `[data-role="skill-content"]`.
    - _Requirements: 6.1, 6.2, 6.3, 13.4_

  - [x] 6.2 Extend `ResultRewardLoop` with FSM (saving → earned → receipt; error retries ≤3)
    - Owner: FE
    - Co-author: GD (timing 1.2–2.0s, copy)
    - Outcome: `apps/web/src/components/gamification/result-reward-loop.tsx` accepts the props from design §D, implements earned phase (1.2–2.0s, mascot=cheer, `data-reward-state="earned"`) auto-advancing to receipt (`data-reward-state="receipt"`) without tap, error path with `onRetry` capped at 3 attempts, reduced-motion skip path ≤200ms.
    - Acceptance: Playwright/jsdom test simulates a save error, retry chain, and reduced-motion skip.
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [x]* 6.3 Property test: Skill_Motivation_Layer Composition + Bounds + World Prop Tag Match
    - Owner: FE
    - **Property 13: Skill_Motivation_Layer Composition** — bounds ≤169px in viewport 390×844, exactly 1 mascot=coach, progress regex `^\d+/\d+$` with `done ≤ total`, exactly 1 reward preview from `REWARD_ASSETS`.
    - **Property 14: Skill World Prop Tag Match** — `pickWorldProp` resolves with intersecting tags per skill.
    - File: `tests/skill-motivation-layer.spec.tsx` with `numRuns: 100`.
    - **Validates: Requirements 6.1–6.8**

  - [x]* 6.4 Property test: Result_Reward_Loop Earned + Receipt Contract
    - Owner: FE
    - **Property 15: Result_Reward_Loop Earned + Receipt Contract** — earned ∈ [1.2s, 2.0s], auto-advances, receipt shows XP≥0, Fucoin≥0, accuracy 0..100, time mm:ss with mm≤99, exactly 1 `data-role="primary-cta"`.
    - File: `tests/result-reward-loop.spec.tsx` with `numRuns: 100`.
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

- [x] 7. Checkpoint — Backbone components ready
  - Ensure all tests pass; review `MascotRoleHost`, `SkillMotivationLayer`, `ResultRewardLoop` against the visual QA runbook smoke list; ask the user if questions arise.

- [x] 8. Dashboard surface (Village Square)
  - [x] 8.1 Wire `apps/web/src/app/(learn)/dashboard/page.tsx` to backbone
    - Owner: FE
    - Co-author: GD (greeting copy/loop), DSD (layout tokens)
    - Outcome: `default | empty | error` states render `MascotRoleHost surfaceId="dashboard"`, greeting localized vi/de, streak chip with `data-reward-context="true"` when streak ≥1, XP target, quest progress hero, single `PrimaryCta` (`Tiếp tục học` / `Tạo lộ trình` / `Thử lại`) inside first viewport.
    - Acceptance: Manual viewport check on 390×844 shows CTA y-bottom ≤844; empty state hides streak/XP/quest.
    - _Requirements: 3.1, 3.2, 3.3, 3.6, 3.7, 11.1, 11.3, 11.5_

  - [x] 8.2 Apply `villageSquare` background with scrim fallback
    - Owner: DSD
    - Co-author: FE
    - Outcome: Dashboard background uses `pickWorldProp(['village','plaza'])` resolved key; scrim auto-applies when contrast <4.5:1; missing key falls back to `--fuxie-blue-50`.
    - Acceptance: Removing `villageSquare` from registry still yields contrast-passing render.
    - _Requirements: 3.4, 3.5, 15.3_

- [x] 9. Course Path surface
  - [x] 9.1 Implement node state visuals and progress indicator
    - Owner: FE
    - Co-author: DSD (visual treatment per state)
    - Outcome: `apps/web/src/app/(learn)/course/page.tsx` (and node component) renders 5 states (`locked|available|in-progress|completed|mastered`) with the table in design §I.2; first `available` node carries `data-role="primary-cta"`; secondary available nodes use `data-cta-variant="secondary"`; `in-progress` shows progress 0–100; locked tooltip appears within 200ms.
    - Acceptance: Snapshot test confirms exactly one primary CTA across nodes.
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [x] 9.2 Render module mascots, badges, and 3s placeholder fallback
    - Owner: FE
    - Co-author: GD (per-cluster mascot mapping)
    - Outcome: Each module cluster renders exactly one `FUXIE_MODULE_MASCOTS` mascot with `data-cluster-id`; CEFR badge from `getCefrBadgeAssetSrc(level)` for `completed/mastered`; placeholder neutral if asset not loaded within 3s.
    - Acceptance: Forced load failure shows neutral placeholder without blocking node render.
    - _Requirements: 4.8, 4.9, 4.10_

  - [x]* 9.3 Property test: Course Path Node State Discipline + Module Mascot Singleton
    - Owner: FE
    - **Property 11: Course Path Node State Discipline** — every node has exactly one `data-node-state` ∈ {locked, available, in-progress, completed, mastered}; among `available`, exactly one carries `data-role="primary-cta"`, others `data-cta-variant="secondary"`; `in-progress.progress ∈ [0,100]`.
    - File: `tests/course-path.spec.tsx` with `numRuns: 100`. (Property 23 already covered by 5.4.)
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.5, 4.6, 4.7, 4.9**

- [x] 10. Vocabulary Collection surfaces
  - [x] 10.1 Implement vocabulary card with 3 visual states and mastered frame
    - Owner: FE
    - Co-author: GD (state semantics), DSD (frame token)
    - Outcome: card supports `data-card-state ∈ {new, learning, mastered}` plus `data-state-image-indicator` and `data-state-text-indicator`; mastered transition applies `FUXIE_UI_FRAMES.collectionCardFrame` within 1s; frame load fail falls back to `--fuxie-success` border + non-blocking toast.
    - Acceptance: Two testers can identify each state without code; toggling to mastered applies frame within 1s in jsdom timer test.
    - _Requirements: 5.1, 5.2, 5.6_

  - [x] 10.2 Wire `/vocabulary/practice` and `/vocabulary/microgames` surfaces
    - Owner: FE
    - Co-author: GD (preview reward copy)
    - Outcome: practice surface shows mascot=companion + Primary_CTA "Bắt đầu" within first viewport; microgames preview shows reward asset from `REWARD_ASSETS` with `data-reward-state="preview"` and label `+10 Fucoin`; empty state (0 words) uses mascot=guard + Primary_CTA "Học từ đầu tiên".
    - Acceptance: Manual mobile-viewport pass; empty state property test green.
    - _Requirements: 5.3, 5.4, 5.5, 11.3_

  - [x]* 10.3 Property test: Vocabulary Card Visual State Discipline
    - Owner: FE
    - **Property 12: Vocabulary Card Visual State Discipline** — each card has exactly one `data-card-state` and distinct image+text indicators per state; mastered card has frame applied or fallback border.
    - File: `tests/vocabulary-card.spec.tsx` with `numRuns: 100`.
    - **Validates: Requirements 5.1, 5.2, 5.6**

- [x] 11. Skill player surfaces (Reading, Listening, Speaking, Writing)
  - [x] 11.1 Compose Reading and Listening players around `SkillMotivationLayer`
    - Owner: FE
    - Co-author: DSD (world prop scrim), GD (progress + reward copy)
    - Outcome: `apps/web/src/app/(learn)/reading/[exerciseId]/page.tsx` and `listening/[lessonId]/page.tsx` render layer + content area + bottom Primary_CTA; world prop via `pickWorldProp(['library'])` / `pickWorldProp(['studio','radio'])`; error state on >10s asset/audio fail with single Primary_CTA "Thử lại"; 3-fail downgrade to secondary.
    - Acceptance: Asset failure simulation triggers error state with preserved progress.
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.10, 6.11, 11.5_

  - [x] 11.2 Compose Speaking player + roleplay sub-route
    - Owner: FE
    - Co-author: GD (companion behavior)
    - Outcome: `/speaking/[lessonId]/page.tsx` uses world tags `['cafe','plaza']`; `/speaking/[lessonId]/roleplay/page.tsx` places mascot=companion opposite learner avatar on the same horizontal axis (mobile `flex-direction: row-reverse` or grid 2-col).
    - Acceptance: jsdom layout test confirms mascot and avatar share y-axis with opposite x positions.
    - _Requirements: 6.6, 6.7_

  - [x] 11.3 Compose Writing player
    - Owner: FE
    - Outcome: `/writing/[exerciseId]/page.tsx` uses world tags `['desk','workshop']`; editor area marked `data-role="skill-content"`; bottom Primary_CTA "Tiếp tục".
    - Acceptance: Property 13 + Property 14 tests pass for writing.
    - _Requirements: 6.8_

  - [x] 11.4 Enforce reward amber containment in `in-progress` state across skill players
    - Owner: DSD
    - Co-author: FE
    - Outcome: Audit and remove any `#FFB703`/`rgb(255,183,3)±5%` outside the layer's reward preview subtree; ensure layout adds `data-reward-context="true"` only on the preview node.
    - Acceptance: Property 9 test green for all four skill surfaces.
    - _Requirements: 6.9, 16.1, 16.2_

- [x] 12. Result Reward Loop integration into completion flows
  - [x] 12.1 Trigger `ResultRewardLoop` from each skill player and exam submit path
    - Owner: FE
    - Co-author: GD (CTA labels: "Tiếp tục" / "Học bài kế tiếp")
    - Outcome: shared completion handler in `apps/web/src/components/gamification/completion-flow.tsx` invokes `ResultRewardLoop` after a successful save; error path keeps lesson data unconsumed and surfaces "Thử lại" CTA up to 3 retries.
    - Acceptance: Integration test for vocabulary microgame, listening session, and exam submit triggers earned within 1.2–2.0s and receipt afterwards.
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.6, 7.7, 10.5_

- [x] 13. Shop / Inventory surface
  - [x] 13.1 Implement `classifyShopItemState` pure function
    - Owner: GD
    - Co-author: FE
    - Outcome: `apps/web/src/lib/gamification/classify-shop-item.ts` returning `'affordable' | 'unaffordable' | 'owned' | 'pending' | 'locked'` per the boolean lattice in design §I.6/Property 16.
    - Acceptance: Truth-table unit test covers all 5 branches.
    - _Requirements: 8.2_

  - [x] 13.2 Implement Shop card UI for the 5 states with frames and CTAs
    - Owner: FE
    - Co-author: DSD (marketShelfFrame, dim/greyscale tokens)
    - Outcome: `apps/web/src/app/(learn)/rewards/shop/page.tsx` renders wallet (Fucoin + XP, range 0–9_999_999) inside first viewport, item cards with `affordable/unaffordable/owned/pending/locked` visuals, "Đổi" enabled only when affordable, hint `còn thiếu N coin` for unaffordable, "Trang bị" non-primary unless equipped, spinner+disabled for pending, error state with cached wallet.
    - Acceptance: Manual mobile-viewport test confirms wallet visible without scroll.
    - _Requirements: 8.1, 8.3, 8.4, 8.5, 8.6, 8.10_

  - [x] 13.3 Implement pending timeout (10s revert), inventory tab, and equip mascot update
    - Owner: FE
    - Outcome: pending requests auto-revert after 10s based on current balance with non-blocking toast; inventory tab shows last 200 owned items (vertical scroll) using `getShopItemAssetSrc`; equipping updates mascot within 1s.
    - Acceptance: jsdom timer test confirms revert at 10s and mascot diff after equip.
    - _Requirements: 8.7, 8.8, 8.9_

  - [x]* 13.4 Property test: Shop Item State Classification
    - Owner: FE
    - **Property 16: Shop Item State Classification** — `classifyShopItemState` matches the boolean lattice for all `(item, wallet, inventory, unlocks, pendingRequests)`.
    - File: `tests/shop-state.spec.ts` with `numRuns: 100`.
    - **Validates: Requirements 8.2, 8.3, 8.4, 8.5, 8.6**

- [x] 14. Review surface
  - [x] 14.1 Implement Review hero with saturation and color discipline
    - Owner: FE
    - Co-author: GD (batch reward preview), DSD (color tokens)
    - Outcome: `/review/page.tsx` renders due (Bright Sky blue) and overdue (deep blue) counts with `9999+` saturation, single Primary_CTA "Ôn ngay" (≥48×48 dp) inside first viewport, reward preview "chưa nhận" while pending, empty state mascot=cheer + "Học bài mới", error state mascot=guard + "Thử lại" (no "Ôn ngay").
    - Acceptance: Snapshot tests for default/empty/error states confirm CTA rules.
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [x]* 14.2 Property test: Review Display Number Saturation
    - Owner: FE
    - **Property 17: Review Display Number Saturation** — `display(N)=N` for `N≤9999`, else `"9999+"`; due ∈ Bright Sky blue, overdue ∈ deep blue, never red.
    - File: `tests/review-display.spec.tsx` with `numRuns: 100`.
    - **Validates: Requirements 9.2, 9.3**

- [x] 15. Exam surface (formal credibility)
  - [x] 15.1 Implement exam in-progress chrome with no game overlay
    - Owner: FE
    - Co-author: DSD (neutral palette enforcement), GD (sign-off on no-mascot/no-reward in-progress)
    - Outcome: `/exam/[examId]/page.tsx` shows fixed-top timer mm:ss + counter "{done}/{total}", fixed-bottom Primary_CTA "Nộp bài"; no mascot animation, no reward animation, no streak, no XP/coin badge, no game sound; palette neutral + deep blue only.
    - Acceptance: Property 9 test confirms zero amber pixels in the in-progress state.
    - _Requirements: 10.1, 10.2, 10.4_

  - [x] 15.2 Implement timer auto-submit, disconnect pause/resume, and 60-min recovery
    - Owner: FE
    - Outcome: Timer reaching 00:00 auto-submits within 2s; on disconnect, timer pauses, local progress saves every 5s (`localStorage` key `exam:{examId}:progress`), "Tiếp tục" disabled until reconnect; tab close/reload within 60 min restores answers + remainingMs.
    - Acceptance: Mocked offline event triggers pause; reload within TTL restores state; `LocalExamProgress` shape matches design.
    - _Requirements: 10.3, 10.6, 10.7_

  - [x] 15.3 Wire post-submit Result_Reward_Loop trigger
    - Owner: FE
    - Outcome: After server-confirmed submission, `ResultRewardLoop` activates within 2s (re-uses 12.1).
    - Acceptance: Integration test from submit confirm → earned phase visible within 2s.
    - _Requirements: 10.5_

- [x] 16. Locked / Empty / Error pattern enforcement
  - [x] 16.1 Implement shared state-shell helper for non-default states
    - Owner: FE
    - Co-author: DSD (copy length, secondary action), GD (mascot=guard rules)
    - Outcome: `apps/web/src/components/gamification/state-shell.tsx` provides single Primary_CTA + secondary "Về Dashboard" for error, ≤140-char localized copy for empty/locked, retry rate-limit (>3 in 60s ⇒ disable 30s + connection hint), and forbids reward amber/celebration in these states.
    - Acceptance: Property 8 test green; rate-limit unit test passes.
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

  - [x] 16.2 Apply state-shell to all P0 surfaces missing locked/empty/error
    - Owner: FE
    - Outcome: Every P0 surface listed in Req 20.1 declares at least `default|empty|error` (and `locked` where gating exists) using `state-shell`.
    - Acceptance: Audit script (extension of 2.x) lists no surface missing required states.
    - _Requirements: 11.1, 11.2_

- [x] 17. Cross-surface property tests and motion/perf invariants
  - [x]* 17.1 Property test: First-viewport Primary_CTA + Single Primary_CTA per non-default state
    - Owner: FE
    - **Property 7: First-viewport Primary_CTA on every P0 surface** — bounding box inside [0,0,390,844], ≥44×44 (≥48×48 for review).
    - **Property 8: Single Primary_CTA per non-default state** — locked/empty/error states render exactly one `data-role="primary-cta"`.
    - File: `tests/p0-surface-render.spec.tsx` with `numRuns: 100`.
    - **Validates: Requirements 3.1, 5.3, 9.1, 11.3, 11.4, 11.5, 14.1, 19.3, 19.8, 19.9, 19.10**

  - [x]* 17.2 Property test: Reward Amber Containment + Bright Sky CTA palette
    - Owner: FE
    - **Property 9: Reward Amber Containment** — every node with `rgb(255,183,3)±5%` color/background must have an ancestor with `data-reward-context="true"` or `data-reward-state ∈ {preview, earned, receipt}`.
    - **Property 22: Bright Sky CTA Discipline** — Primary_CTA bg/border ∈ Bright Sky blues; energy orange ≤5% area, never on Primary_CTA.
    - File: `tests/reward-amber-containment.spec.tsx` with `numRuns: 100`.
    - **Validates: Requirements 6.9, 10.1, 10.4, 11.7, 16.1, 16.2, 16.3, 16.4, 16.5, 19.4**

  - [x]* 17.3 Property test: Reduced-motion Animation Discipline
    - Owner: FE
    - **Property 10: Reduced-motion Animation Discipline** — animations only touch transform/opacity, durations 120–2000ms; with `matchMedia(reduce).matches=true`, no node carries `{animate-idle, animate-coach, animate-reward, animate-speak}`; Result_Reward_Loop reduced-motion path renders within 200ms.
    - File: `tests/reduced-motion.spec.tsx` with `numRuns: 100`.
    - **Validates: Requirements 7.5, 13.1, 13.2, 13.3, 13.5, 19.5**

  - [x]* 17.4 Property test: Image Dimension Stability + Lazy Load + Live 3D gating
    - Owner: FE
    - **Property 19: Image Dimension Stability** — every `<Image>`/`<img>` has explicit width/height or aspect-ratio; placeholder dimensions match within ±1px.
    - **Property 20: Lazy Load Discipline** — non-first-viewport images use `loading="lazy"` or dynamic wrapper, IntersectionObserver threshold ≤200px.
    - **Property 21: Live 3D Visibility Gate** — `FuxieLive3DDynamic` only renders model when intersectionRatio ≥0.10.
    - File: `tests/image-perf.spec.tsx` with `numRuns: 100`.
    - **Validates: Requirements 14.2, 14.4, 18.4, 18.5_

  - [x]* 17.5 Property test: Locale Parity + t() Discipline
    - Owner: FE
    - **Property 18: Locale Parity and t() Discipline** — keys mirrored in vi/de, no empty values, every learner-facing string goes through `t()`, alt-text length 1–125 for meaningful, ≤200 for greetings, `""` for decorative.
    - File: `tests/locale-parity.spec.ts` with `numRuns: 100`.
    - **Validates: Requirements 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7, 17.8**

- [x] 18. Performance and accessibility integration tests
  - [x] 18.1 Author CLS and first-viewport bytes Playwright tests
    - Owner: FE
    - Outcome: `tests/integration/perf.spec.ts` runs Playwright with viewport 390×844, network throttling Slow 4G, measures CLS ≤0.05 across 3 consecutive runs and total transferred bytes for (mascot hero + world prop + UI frame) ≤350KB on each P0 surface.
    - Acceptance: Failing thresholds break the integration job.
    - _Requirements: 14.3, 18.3_

  - [x] 18.2 Add accessibility audit pass (axe + focus order)
    - Owner: DSD
    - Co-author: FE
    - Outcome: `tests/integration/a11y.spec.ts` runs jest-axe / Playwright axe on each P0 surface for default/empty/error states; verifies focus order matches DOM order and visible focus outline ≥2px contrast ≥3:1.
    - Acceptance: All P0 surfaces report zero serious/critical axe violations.
    - _Requirements: 4.2, 15.1, 15.2, 15.4, 15.5_

- [x] 19. Checkpoint — Surfaces and tests integrated
  - Ensure `pnpm check:quick` and `pnpm test:integration` pass; review the visual QA runbook smoke list against current surfaces; ask the user if questions arise.

- [x] 20. Definition of Done sign-off pack
  - [x] 20.1 Run Visual QA runbook for every P0 surface and commit evidence
    - Owner: PM
    - Co-author: FE (capture Playwright screenshots), GD (loop polish review), DSD (palette + token review)
    - Outcome: For each P0 surface in Req 20.1, create `docs/design/visual-audit/qa-runs/<YYYY-MM-DD>/<surface>.md` filled from `docs/design/learner-ui-visual-qa-runbook.md` with pass/fail per item and screenshot evidence paths.
    - Acceptance: All P0 surfaces have a checked-in checklist file with no failing items.
    - _Requirements: 20.1, 20.4_

  - [x] 20.2 Compile DoD release checklist and risk log
    - Owner: PM
    - Outcome: `docs/design/release/gamified-ui-asset-rollout-dod.md` listing AC1–AC5 of Req 20 with green/red status, owners for any open items, mitigation per risk, and a final "ready to tag Done" decision; cross-link CI run, asset audit report, and property test artifacts.
    - Acceptance: Document is reviewed and approved by PM before tagging Done; no AC is red.
    - _Requirements: 20.1, 20.2, 20.3, 20.5, 20.6_

- [x] 21. Final checkpoint — Ready to ship
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP (all are property/unit tests). Core implementation tasks remain mandatory.
- Each task references specific requirement clauses for traceability and carries an explicit owner from the Fuxie roster (FE, GD, DSD, PM).
- Backbone components (Asset Registry, MascotRoleHost, SkillMotivationLayer, ResultRewardLoop, state-shell, PrimaryCta) are built before any P0 surface integrates them, so no surface code is orphaned.
- Property tests align 1:1 with the 23 correctness properties in design §Correctness Properties; performance and accessibility are covered by Playwright + axe integration tests.
- The DoD pack (task 20) is gated by PM and turns the property suite, asset audit, locale parity, visual QA runbook, and risk log into a single sign-off artifact.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.3"] },
    { "id": 1, "tasks": ["1.2", "1.4", "4.1", "4.3", "4.4", "5.1", "5.3"] },
    { "id": 2, "tasks": ["2.1", "2.2", "2.5", "4.2", "4.5", "4.6", "5.2", "5.4", "13.1", "13.4"] },
    { "id": 3, "tasks": ["2.3", "2.7", "6.1", "6.2", "16.1"] },
    { "id": 4, "tasks": ["2.4", "2.8", "6.3", "6.4", "8.2", "9.1", "10.1", "11.3", "13.2", "14.1", "15.1", "16.2"] },
    { "id": 5, "tasks": ["2.6", "8.1", "9.2", "10.2", "11.1", "11.2", "11.4", "13.3", "14.2", "15.2"] },
    { "id": 6, "tasks": ["9.3", "10.3", "12.1", "15.3"] },
    { "id": 7, "tasks": ["17.1", "17.2", "17.3", "17.4", "17.5", "18.1", "18.2"] },
    { "id": 8, "tasks": ["20.1"] },
    { "id": 9, "tasks": ["20.2"] }
  ]
}
```
