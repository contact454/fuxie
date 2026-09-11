# Slice F - First-run activation guidance: onboarding + empty dashboard

Owner: Claude (spec/QC) -> Antigravity (implement). Date: 2026-06-12. Assets: none.
Model: `.agents/workflows/three-agent-delivery-model.md`.

## Role-Gate Compliance

Vai chinh: Product Manager EdTech
Vai phoi hop: Product Designer / UX/UI Designer, Frontend Engineer

This slice turns the approved activation UX into a clearer first-run experience for self-study learners. It is grounded in:

- `docs/intake/phase-23-learner-activation-prd.md`
- `docs/intake/phase-24-onboarding-ux-spec.md`
- `docs/intake/phase-25-dashboard-next-action-ux-spec.md`
- `docs/intake/phase-34-learning-experience-audit.md`
- the current UX survey from the task thread

Do not broaden scope to skill interiors, reward economy, mock-test redesign, teacher/admin/parent surfaces, or new backend work.

## Context & Goal

The current product already has onboarding, dashboard, and a strong gamified layer, but the first-run experience is still too thin:

- Onboarding collects level, goal, daily time, placement, and result, but it does not yet explain how Fuxie works in a way a first-time learner can instantly grasp.
- The dashboard empty state reads more like a stub than a guided start.
- The product should feel playful and game-like, but the learning loop must stay obvious and the mock test must remain serious.

Goal: make a new learner understand, in one flow, what Fuxie is, what to do first, and how the platform works in simple steps.

## Requirements

- **R-1** Onboarding welcome and result states SHALL explain Fuxie in 3 short steps: understand level, do the next study action, then review/mock test when ready.
- **R-2** Onboarding result SHALL show current level, target level, first action, and one dominant CTA. It SHALL not become a longer flow or add a new full step.
- **R-3** The dashboard empty state SHALL replace the plain informational block with a polished first-run guide panel that teaches the same 3-step logic and points the learner to the next action.
- **R-4** The guidance SHALL be hidden or collapsed for active learners once `profile.totalLessonsCompleted > 0` or the equivalent existing activation signal already available in dashboard data. No new fetch or schema is allowed.
- **R-5** AI chat and rewards SHALL stay support roles, not the main path. Mock test surfaces SHALL remain serious and visually distinct.
- **R-6** The visual language SHALL reuse existing Fuxie UI patterns and existing mascot assets only. No new assets, no new design-system primitives, no new recommendation engine.
- **R-NF** Desktop-first behavior, mobile-safe layout, accessibility, and existing learning flows remain intact. `pnpm check:quick`, `pnpm test:core`, and `pnpm build` must pass.

## Tech Design

1. `apps/web/src/components/onboarding/OnboardingWizard.tsx:268-597`
   - Update `WelcomeStep` and `ResultStep`.
   - Insert a compact 3-step activation explainer block in both places.
   - Keep the current 5-step flow unchanged.
   - Keep the existing `firstAction` logic and save flow untouched.

2. `apps/web/src/app/(learn)/dashboard/page.tsx:421-520`
   - Replace `DashboardEmptyDetail`'s plain `StateShell` block with a polished `FuxiePanel`-based guide.
   - Gate the guide off `resolveHeroState(header) === 'empty'`.
   - Keep the hero CTA to `/onboarding` as the primary action.

3. `apps/web/messages/{vi,en,de}.json`
   - Add a shared `Activation` namespace for the new guide copy.
   - Reuse the same copy in onboarding and dashboard.

4. Do not touch `apps/web/src/components/dashboard/dashboard-client.tsx`, `apps/web/src/components/ui/fuxie-ui.tsx`, or any skill module interiors unless a tiny local helper is absolutely required.

## Asset Plan

- No new assets.
- Reuse existing mascot art already present in onboarding/dashboard if a visual is needed.
- Lucide icons are fine if they keep the guide compact.
- Codex: none.

## Task List

- **T-1** (R-1, R-2): Add the shared 3-step activation explainer to onboarding welcome and result states.
- **T-2** (R-3, R-4): Replace the dashboard empty-state shell with a polished first-run guide panel.
- **T-3** (R-5): Tighten copy so AI chat stays secondary and mock test stays serious.
- **T-4** (R-6): Update vi/en/de strings and verify desktop/mobile fit with no layout drift.
- **T-5** (R-NF): Run gates and capture screenshots for onboarding and dashboard empty states.

## Acceptance / QC

1. `/onboarding?fixture=visual-qa&state=welcome` clearly explains what Fuxie is and how to start in 3 steps.
2. `/onboarding?fixture=visual-qa&state=result` shows current level, target level, first action, and one dominant CTA.
3. `/dashboard?fixture=visual-qa&state=empty` shows a polished first-run guide, not a dead-end shell.
4. Active learners do not see the guide once activation is complete (`profile.totalLessonsCompleted > 0` or equivalent existing signal).
5. Mock test and reward-heavy surfaces remain unchanged in seriousness and hierarchy.
6. `pnpm check:quick`, `pnpm test:core`, and `pnpm build` all pass.

## Antigravity Prompt

```text
ROLE: You are the Frontend Engineer for Fuxie (Next.js App Router, TypeScript, Tailwind). Execute a fixed UX spec. Do not invent product direction; if a copy/layout choice is ambiguous, stop and ask Claude.

OBJECTIVE: Slice F - first-run activation guidance. Make onboarding and the dashboard empty state explain how Fuxie works, what the learner should do first, and why the learning loop is learn -> review -> mock test. Keep AI chat and rewards secondary. Desktop first, mobile safe.

REPO CONTEXT: Repo root C:\Users\DMF Schule\9-Fuxie, app root apps/web. Read docs/delivery/slice-F-activation-guidance.md and .agents/workflows/three-agent-delivery-model.md before editing. Also inspect docs/intake/phase-23-learner-activation-prd.md, docs/intake/phase-24-onboarding-ux-spec.md, docs/intake/phase-25-dashboard-next-action-ux-spec.md, and docs/intake/phase-34-learning-experience-audit.md for the product intent.

EDIT ONLY: apps/web/src/components/onboarding/OnboardingWizard.tsx, apps/web/src/app/(learn)/dashboard/page.tsx, apps/web/messages/vi.json, apps/web/messages/en.json, apps/web/messages/de.json. Touch apps/web/src/app/(auth)/onboarding/page.tsx only if you absolutely need fixture/state wiring. Do not add a backend schema, new fetch, new assets, or a new recommendation engine.

FOR BROWSER QA: run `pnpm dev:web` and inspect the fixture URLs in the acceptance section on http://localhost:3005.

USE EXISTING DATA: the dashboard already exposes activation signals such as profile.totalLessonsCompleted. Reuse that existing state and hide/collapse the guide for active learners. Reuse existing Fuxie UI primitives and existing mascot assets only.

TASKS: implement T-1..T-5 exactly as written in the spec. Keep the current onboarding step count and the current dashboard activation logic; only improve guidance and hierarchy.

ACCEPTANCE: the three fixture URLs in the spec all look correct; active learners do not see the guide; mock test and reward-heavy surfaces remain unchanged; pnpm check:quick, pnpm test:core, and pnpm build all pass.

REPORT FORMAT: (1) per-file diff summary; (2) gates run and results; (3) exact URLs used for onboarding and dashboard QA; (4) confirmation that no new assets, backend changes, or mock-test/reward regressions were introduced; (5) any ambiguity or tradeoff you hit.
```

## Codex Prompt

None.
