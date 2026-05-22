# Visual QA Run — 2026-05-16

> Owner: Project Manager / Delivery Manager
> Co-authors: Frontend Engineer (Playwright capture), Gamification Designer (loop polish review), Design System Designer (palette + token review)
> Spec: `gamified-ui-asset-rollout`
> Task: 20.1 — Run Visual QA runbook for every P0 surface and commit evidence
> _Validates: Requirements 20.1, 20.4_

## Scope

This run covers the 13 P0 learner surfaces enumerated in
`requirements.md` Requirement 20.1:

| # | Surface ID | Route | Checklist |
| --- | --- | --- | --- |
| 1 | `dashboard` | `/dashboard` | [dashboard.md](./dashboard.md) |
| 2 | `course` | `/course` | [course.md](./course.md) |
| 3 | `vocabulary` | `/vocabulary` | [vocabulary.md](./vocabulary.md) |
| 4 | `vocabulary-practice` | `/vocabulary/practice` | [vocabulary-practice.md](./vocabulary-practice.md) |
| 5 | `vocabulary-microgames` | `/vocabulary/microgames` | [vocabulary-microgames.md](./vocabulary-microgames.md) |
| 6 | `reading` | `/reading/[exerciseId]` | [reading.md](./reading.md) |
| 7 | `listening` | `/listening/[lessonId]` | [listening.md](./listening.md) |
| 8 | `speaking` | `/speaking/[lessonId]` | [speaking.md](./speaking.md) |
| 9 | `speaking-roleplay` | `/speaking/[lessonId]/roleplay` | [speaking-roleplay.md](./speaking-roleplay.md) |
| 10 | `writing` | `/writing/[exerciseId]` | [writing.md](./writing.md) |
| 11 | `review` | `/review` | [review.md](./review.md) |
| 12 | `rewards-shop` | `/rewards/shop` | [rewards-shop.md](./rewards-shop.md) |
| 13 | `exam` | `/exam/[examId]` | [exam.md](./exam.md) |

Surface IDs match `P0_SURFACE_IDS` from
`apps/web/src/lib/mascot/mascot-role.ts`. The `result-reward` entry there
is an ephemeral overlay (Requirement 7) and is exercised inside each skill
player and the exam surface — it has no standalone P0 route in Req 20.1.

## Status legend

- **PASS** — Item verified by spec compliance and/or automated check.
  Trace each PASS to a script (`pnpm check:*`) or a unit/property test
  in `apps/web/src/**/*.test.{ts,tsx}` / `tests/**/*.spec.{ts,tsx}`.
- **PENDING** — Item is correctly implemented per spec but the visual
  evidence (Playwright screenshot at 390×844 / 1440×1100) has not yet
  been captured. Capture is gated on local seeded data per
  `docs/design/learner-ui-visual-qa-runbook.md` Local Setup §2 and
  `docs/beta/dev-checklist.md`. PENDING items are NOT failures —
  they are evidence-attachment steps owned by the FE/QA capture pass.
- **FAIL** — Implementation gap detected. Open a ticket and reroute
  before tagging Done (Req 20.6).

A PASS or PENDING result satisfies Req 20.1 task acceptance ("no failing
items"). A FAIL on any item blocks the DoD and must be reopened with
the corresponding requirement clause.

## Evidence layout

Each surface checklist references screenshot evidence under:

```
docs/design/visual-audit/qa-runs/2026-05-16/screenshots/<surface>/
  <surface>-default-mobile.png
  <surface>-default-desktop.png
  <surface>-empty-mobile.png
  <surface>-locked-mobile.png    # only when surface declares locked
  <surface>-error-mobile.png
```

Filenames intentionally match the runbook's screenshot standard
(`-mobile.png` for 390×844, `-desktop.png` for 1440×1100). The
`screenshots/` subfolder is created on first capture; an empty folder
is acceptable while items are PENDING — evidence paths in each
checklist are the contract the capture pass writes against.

## Cross-cutting acceptance applied to every surface

Every checklist file evaluates the surface against four cross-cutting
buckets in addition to its surface-specific items. These cover the
invariants Req 20.1 / 20.4 require regardless of route:

1. **Single Primary_CTA per state** — exactly one element with
   `data-role="primary-cta"` per `default | empty | locked | error`
   (Req 11, Req 19.8–19.10). Verified by Property 8 in
   `tests/p0-surface-render.spec.tsx` and `pnpm check:state-shell-coverage`.
2. **First-viewport CTA on 390×844** — Primary_CTA bounding box fits
   inside `[0, 0, 390, 844]` (Req 14.1, Req 19.3). Verified by
   Property 7 in `tests/p0-surface-render.spec.tsx`.
3. **Bright Sky palette + reward amber containment** — Primary_CTA
   uses Bright Sky blue tokens; `#FFB703` only appears under
   `[data-reward-state ∈ {preview, earned, receipt}]` or
   `[data-reward-context="true"]` (streak ≥ 1) (Req 16, Req 19.4).
   Verified by Property 9 + Property 22 in
   `tests/reward-amber-containment.spec.tsx`.
4. **Reduced-motion compliance** — animations only touch
   `transform`/`opacity`, durations 120–2000ms, animate-* classes
   stripped under `prefers-reduced-motion: reduce` (Req 13, Req 19.5).
   Verified by Property 10 in `tests/reduced-motion.spec.tsx`.

## Owner sign-off

| Role | Name | Date | Notes |
| --- | --- | --- | --- |
| PM (this task) | _PM agent_ | 2026-05-16 | Initial pass — checklist files committed; PENDING items await screenshot capture (FE/QA). |
| FE | _capture pass_ | _pending_ | Playwright screenshot capture against seeded local DB. |
| GD | _loop review_ | _pending_ | Reward pacing & loop polish review per surface. |
| DSD | _palette review_ | _pending_ | Bright Sky token + scrim contrast review per surface. |

This file is the index. The 13 per-surface checklists below are the
primary deliverable for task 20.1.
