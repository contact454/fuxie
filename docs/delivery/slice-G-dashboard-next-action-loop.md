# Slice G - Dashboard next-action clarity + daily learning loop

Owner: Codex (spec/QC) -> Antigravity (implement). Date: 2026-06-12. Assets: none.
Model: `.agents/workflows/three-agent-delivery-model.md`.

## Role-Gate Compliance

Vai chinh: Product Manager EdTech
Vai phoi hop: Product Designer / UX/UI Designer, Frontend Engineer

This slice continues the UI/UX improvement sequence after Slice F. Slice F clarified first-run activation for onboarding and the empty dashboard. Slice G targets active self-study learners who have already started learning.

Grounding docs:

- `docs/intake/phase-25-dashboard-next-action-ux-spec.md`
- `docs/intake/phase-34-learning-experience-audit.md`
- `docs/delivery/slice-F-activation-guidance.md`
- the current UX survey in the task thread

Do not broaden this slice into content remediation, mock-test redesign, teacher/admin/parent surfaces, or reward-economy rebuilds.

## Context & Problem

The production dashboard currently renders through `DashboardClientDynamic`, which dynamically loads `DashboardMockupClient`.

For active learners, `DashboardMockupClient` already has a "TODAY" panel with a progress ring, a small next lesson card, and a large START button. However, the workflow is still not clear enough:

- The lesson card reads from `data.todayPlan?.actions?.[0]`, but the START button always routes through `handleStartSession()` to `/session`.
- The CTA label is generic (`START`) instead of action-specific.
- The first card does not consistently expose the action type, estimated time, reward/progress cue, and reason in a scan-friendly way.
- Board hotspots, missions, wallet, stats, and mascot encouragement can visually compete with the main daily action.

The learner should be able to answer this in 3-5 seconds:

```text
What should I study now, why, and how long will it take?
```

## Goal

Make the active dashboard's primary "TODAY" panel behave like a clear daily learning loop:

1. Show exactly one dominant next action.
2. Explain why this action matters.
3. Route the CTA to the same action shown in the card.
4. Keep missions, rewards, AI/chat, and map hotspots visually secondary.

## Requirements

- **R-1** The active dashboard `TODAY` panel SHALL derive its primary next action from existing `data.todayPlan.actions[0]` when available. If unavailable, it SHALL use a safe current-level vocabulary fallback. No new recommendation engine.
- **R-2** The primary CTA SHALL navigate to the same `href` as the displayed primary action. It SHALL NOT always route to `/session`.
- **R-3** The primary CTA label SHALL be action-aware and localized enough for the learner to understand the action: review SRS, learn vocabulary, practice listening/reading/writing/speaking, continue lesson, or safe fallback.
- **R-4** The visible primary task card SHALL include: eyebrow, action title, reason, estimated minutes, daily progress cue, and one reward/progress cue.
- **R-5** If the daily goal is already complete (`todayPlan.remainingMinutes <= 0` or equivalent existing data), the panel SHALL show a satisfying completed-today state and offer only one quieter next action if an existing secondary action is available.
- **R-6** Secondary modules (missions board, map hotspots, stats, Fucoin wallet, mascot encouragement, chat) SHALL remain visually subordinate to the primary action and SHALL NOT add another primary CTA above the fold.
- **R-7** Empty dashboard behavior from Slice F SHALL remain unchanged.
- **R-8** Mock test surfaces SHALL remain serious and unchanged. AI chat remains a support action, not the main path.
- **R-NF** Desktop-first, mobile-safe layout, accessibility, and existing dashboard data flows remain intact. `pnpm check:quick`, `pnpm test:core`, and `pnpm build` must pass.

## Non-Goals

- No backend schema changes.
- No new fetches or API routes.
- No new recommendation algorithm.
- No new assets.
- No redesign of the whole dashboard.
- No edits to content/audit dirty files.
- No teacher/admin/parent changes.
- No mock-test or reward-economy redesign.

## Tech Design

1. `apps/web/src/components/dashboard/DashboardMockupClient.tsx`
   - Add a small local helper to derive `primaryActionViewModel` from existing `data.todayPlan?.actions?.[0]`.
   - Include safe fallback values when `todayPlan` or `actions[0]` is absent.
   - Replace the active state "NEXT lesson card" content with this view model.
   - Replace `handleStartSession()` usage for the primary active CTA with routing to the view model `href`.
   - Keep empty-state CTA behavior unchanged.
   - Keep mission claim and reward reveal behavior unchanged.
   - Avoid a new component unless the helper would otherwise make the file harder to read.

2. `apps/web/messages/{vi,en,de}.json`
   - Add the minimum dashboard copy keys needed for action-aware labels and fallback copy.
   - Prefer Vietnamese learner clarity in `vi.json`; keep `en/de` complete for locale parity.

3. Tests / QA
   - If a lightweight test is practical, add coverage for "primary CTA href matches displayed action href" in the dashboard component or adapter layer.
   - If component testing is too brittle for this slice, document that choice and rely on visual QA plus existing gates.

## Suggested View Model

Antigravity may adjust naming, but the behavior should be equivalent:

```ts
type PrimaryDashboardActionView = {
  eyebrow: string
  title: string
  reason: string
  href: string
  ctaLabel: string
  estimatedMinutes: number
  rewardCue: string
  progressCue: string
}
```

Fallback rules:

- If `data.todayPlan?.actions?.[0]` exists, use its `title`, `reason`, `href`, `estimatedMinutes`, `type`, and `skill`.
- If no action exists, fallback to current-level vocabulary:
  - title: current-level vocabulary starter
  - href: `/vocabulary`
  - estimatedMinutes: `Math.max(5, data.profile.studyGoalMinutes || 10)`
- If `todayPlan.remainingMinutes <= 0`, show completed-today copy and use `actions[1]` as the quiet continue action if present; otherwise fallback to `/vocabulary`.

## Task List

- **T-1** (R-1, R-2): Derive a primary action view model and make the CTA route match it.
- **T-2** (R-3, R-4): Update the active `TODAY` panel with action-aware CTA, reason, minutes, and reward/progress cue.
- **T-3** (R-5): Add completed-today state using existing today-plan fields only.
- **T-4** (R-6, R-8): Keep missions, map hotspots, chat, rewards, and mock-test surfaces subordinate/unchanged.
- **T-5** (R-NF): Update locale strings and run gates/visual QA.

## Acceptance / QC

1. `/dashboard?fixture=visual-qa&state=default` shows one dominant active next action in the `TODAY` panel.
2. The displayed action title/reason and the primary CTA route refer to the same `todayPlan.actions[0]` action.
3. When no `todayPlan.actions[0]` exists, the dashboard still shows a concrete fallback action instead of generic START.
4. Completed-today state is satisfying and does not look empty or broken.
5. Empty dashboard from Slice F still renders the activation guide and remains unchanged.
6. Missions, wallet, map hotspots, and chat remain secondary to the primary next action.
7. No content/audit/sw/spec dirty files are staged or committed with this slice.
8. `pnpm check:quick`, `pnpm test:core`, and `pnpm build` pass.

## Antigravity Prompt

```text
ROLE: You are the Frontend Engineer for Fuxie (Next.js App Router, TypeScript, Tailwind). Execute a fixed UX spec. Do not invent product direction; if scope is ambiguous, stop and ask Codex.

OBJECTIVE: Slice G - dashboard next-action clarity + daily learning loop. For active self-study learners, make the dashboard answer "what should I study now?" with one clear daily action, one matching CTA, and scan-friendly reason/time/reward cues.

REPO CONTEXT: Repo root C:\Users\DMF Schule\9-Fuxie, app root apps/web. Read docs/delivery/slice-G-dashboard-next-action-loop.md, docs/intake/phase-25-dashboard-next-action-ux-spec.md, docs/intake/phase-34-learning-experience-audit.md, and .agents/workflows/three-agent-delivery-model.md before editing.

IMPORTANT WORKTREE WARNING: This branch has many dirty files unrelated to Slice G (content/audit/sw/spec docs). Do not stage, format, normalize, or edit unrelated files. Do not run broad formatters.

EDIT ONLY:
- apps/web/src/components/dashboard/DashboardMockupClient.tsx
- apps/web/messages/vi.json
- apps/web/messages/en.json
- apps/web/messages/de.json

Touch a test file only if you add a focused, low-brittleness test for the primary CTA/action matching behavior. Do not edit apps/web/src/app/(learn)/dashboard/page.tsx, dashboard-client.tsx, backend code, content files, service worker, or delivery docs unless Codex explicitly approves.

IMPLEMENTATION:
1. In DashboardMockupClient, derive a local primary action view model from existing data.todayPlan.actions[0].
2. Use fallback current-level vocabulary only when todayPlan/action data is absent.
3. Replace the active-state next lesson card and START button so the card title/reason/minutes and CTA href all refer to the same action.
4. Make the CTA label action-aware via localized Dashboard strings.
5. Add a completed-today state using existing todayPlan.remainingMinutes/currentMinutes/goalMinutes data only.
6. Preserve Slice F empty-state behavior.
7. Keep missions, wallet, map hotspots, chat, reward reveal, and mock-test surfaces unchanged and visually secondary.

VISUAL QA:
Run pnpm dev:web and inspect:
- http://localhost:3005/dashboard?fixture=visual-qa&state=default
- http://localhost:3005/dashboard?fixture=visual-qa&state=empty
Check desktop first, then a mobile viewport. Confirm text does not overflow and the CTA remains visible.

GATES:
- pnpm check:quick
- pnpm test:core
- pnpm build
- git diff --check -- <files you changed>
- git diff --stat -- <files you changed>

REPORT FORMAT:
1. Files changed.
2. How the primary action is derived.
3. Confirmation CTA href matches displayed action href.
4. Visual QA notes for default and empty dashboard.
5. Gate results.
6. Confirmation no unrelated dirty files were touched/staged.
```

## Codex Prompt

None.
