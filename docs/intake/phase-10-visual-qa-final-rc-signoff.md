# Phase 10: Visual QA And Final RC Signoff

Date: 2026-05-12

## Role-Gate Compliance

Vai chinh: Product Designer / UX/UI Designer
Vai phoi hop: QA Automation Engineer, Frontend Engineer, Project Manager / Delivery Manager

This Phase 10 visual QA pass was started under the mandatory role-gate workflow:

- `task-startup-checklist.md` was read.
- `task-role-router.md` was read.
- The Product Designer / UX/UI Designer, QA Automation Engineer, Frontend Engineer, and Project Manager / Delivery Manager profiles were read.
- The task domain is UX visual QA, release confidence, frontend behavior review, and final RC signoff coordination.

## Phase Objective

Phase 10 verifies whether the dirty runtime UI candidate slice is visually acceptable for RC packaging. It focuses on the learner-facing surfaces affected by the current runtime diffs:

- Dashboard and mobile shell.
- Gamification mascot/reward visual components.
- Vocabulary world map and practice hub.
- Vocabulary CTA loading/error behavior.
- Leaderboard empty/error experience on desktop and mobile.

Phase 10 does not change runtime code. Any P0 visual blocker must be rerouted to Frontend Engineer before implementation.

## Visual QA Environment

| Item | Value |
| --- | --- |
| Web URL | `http://localhost:3012` |
| Desktop viewport | `1280x720` |
| Mobile viewport | `390x844` |
| Auth state | Dev learner session already active |
| Checked routes | `/dashboard`, `/vocabulary`, `/vocabulary/practice`, `/leaderboard` |
| Browser logs | One Next.js image priority warning, no visual QA-blocking runtime error observed |

## Visual QA Results

| Surface | Evidence | Result | Notes |
| --- | --- | --- | --- |
| Mobile shell bottom spacing | `/dashboard` at `390x844`, scrolled through lower dashboard sections | Pass | Bottom navigation remains usable and final dashboard content has enough clearance. |
| Dashboard mascot priority behavior | `/dashboard` desktop and mobile | Pass with P2 note | Mascot supports next-best-action and safety coach moments. Browser reported an LCP priority hint for `fuxie-3d-game-streak-freeze-saved-512.webp`; not release-blocking, but should be optimized in a later UI/performance slice. |
| Gamification image sizing | Dashboard reward cards and mascot coach panels | Pass | Reward/mascot visuals fit their panels without overlapping text or controls. |
| Vocabulary world map | `/vocabulary` desktop and mobile | Pass | Desktop uses a strong two-column hero/map layout; mobile keeps the CEFR tabs, CTA, progress, and map readable. Theme nodes are horizontally scrollable where needed. |
| Vocabulary practice image sizing | `/vocabulary/practice` mobile | Pass | Circular theme images and labels fit, with no text/button overlap in the first path items. |
| Vocabulary CTA loading state | Static code and route behavior review | Pass with P2 note | CTA disables and changes label while opening review. API failure currently logs to console but does not show a user-facing error message. Track as P2 polish, not an RC blocker while gates and smoke pass. |
| Leaderboard empty state mobile | `/leaderboard` at `390x844` | Pass | Empty state is clear, mascot-centered, and has two recovery CTAs without overlap. |
| Leaderboard empty state desktop | `/leaderboard` at `1280x720` | Pass | Empty state remains centered and readable; CTA row is clear. |
| Leaderboard error state | Static code review | Pass with residual risk | Offline/error message is routed through the same empty-state component with recovery CTAs. Live forced-error simulation was not performed in Phase 10. |

## Findings

### Release-Blocking Findings

None found in the checked surfaces.

### Residual P2 Findings

| ID | Finding | Owner | Next action | Acceptance signal |
| --- | --- | --- | --- | --- |
| VQA-001 | Vocabulary practice CTA catches API failure with `console.error` only, without a visible user-facing failure message | Frontend Engineer | Add a small inline error/toast in a later polish slice | Failed `/api/v1/srs/cards` call tells learner what happened and how to retry |
| VQA-002 | Dashboard mascot LCP image can be marked priority when above the fold | Frontend Engineer | Review image priority on dashboard coach/mascot asset | No Next.js LCP priority warning for above-the-fold mascot |
| VQA-003 | Desktop routes can briefly show skeletons before data resolves | QA Automation Engineer | Keep as accepted loading behavior; only revisit if skeleton persists beyond normal API response | Loaded content replaces skeleton on dashboard, vocabulary, and leaderboard |

## Product Designer Signoff

Runtime UI candidate slice is visually acceptable for RC packaging.

This signoff covers visual hierarchy, responsive behavior, mascot/reward fit, mobile shell spacing, empty state clarity, and learner CTA clarity for the checked routes. It does not approve production release by itself.

## QA Signoff

No release-blocking visual regression was found in the targeted browser sweep. Phase 8 automated gates and Phase 7 full local smoke remain the main quality evidence for RC packaging.

Residual risk: live forced-error simulation for leaderboard and vocabulary CTA was not performed. Static code confirms error handling paths exist for leaderboard and console-only handling exists for vocabulary CTA.

## Final RC Signoff Matrix

| Gate | Status | Owner | Notes |
| --- | --- | --- | --- |
| Runtime UI visual signoff | Complete | Product Designer / UX/UI Designer | Approved for RC packaging with P2 follow-ups |
| Runtime UI QA signoff | Complete | QA Automation Engineer | No P0/P1 visual blocker observed |
| Runtime UI implementation ownership | Complete | Frontend Engineer | No runtime edit required in Phase 10 |
| Commit grouping | Ready | Project Manager / Delivery Manager | Use Phase 9 group plan |
| Generated `sw.js` decision | Still pending | CTO / Tech Lead | Must choose stage, restore, or regenerate before final commit |
| Final staging approval | Pending user/owner approval | Project Manager / Delivery Manager | Do not stage automatically |

## Acceptance Status

| Criterion | Status |
| --- | --- |
| Mobile shell bottom spacing verified | Pass |
| Dashboard mascot behavior verified | Pass with P2 performance note |
| Gamification and vocabulary image sizing verified | Pass |
| Vocabulary CTA loading/error state reviewed | Pass with P2 UX note |
| Leaderboard empty/error state reviewed | Pass |
| No runtime code edited | Pass |
| Runtime UI signoff decision recorded | Pass |

## Next Planned Step: Phase 11 Final Staging And RC Branch Preparation

Phase 11 should convert the accepted RC package into an explicit staging/branch plan:

1. Confirm whether the user wants files staged or only documented.
2. Ask CTO to decide `apps/web/public/sw.js`: stage generated artifact, restore tracked artifact, or regenerate from clean build.
3. Stage approved groups separately: governance, intake docs, runtime UI, and optional generated artifact.
4. Create an RC branch if requested.
5. Prepare commit messages and PR/release notes from Phase 9 and Phase 10 evidence.

Phase 11 status update: completed as a staging and branch preparation plan in `phase-11-final-staging-and-rc-branch-preparation.md`. No git staging was performed.
