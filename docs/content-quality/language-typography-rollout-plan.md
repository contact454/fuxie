# Language, Copy, Typography & Text Color Rollout

Owner: Project Manager / Delivery Manager  
Execution team: Content QA / Linguistic Reviewer, Vietnamese-German Localization Specialist, Design System Designer, German Content Writer

## Current V1 Slice

- Fix the immediate Vietnamese mojibake blocker in `apps/web/messages/vi.json`.
- Add a standards document for writing, typography, text color, glossary, and release review.
- Add automated static audit tooling that reports blockers and warnings by owner.
- Align shared UI tokens with `apps/web/src/app/globals.css` so new work has one text-color vocabulary.
- Run `pnpm qa:copy-style:fix` when legacy mojibake appears, then rerun `pnpm qa:copy-style` until blocking errors are zero.

## Sweep Order

| Cluster                            | Owner                   | Done when                                                             |
| ---------------------------------- | ----------------------- | --------------------------------------------------------------------- |
| Navigation/Auth                    | Localization Specialist | No mojibake; CTA and error copy are natural.                          |
| Dashboard/Course                   | Design System Designer  | Primary action, text hierarchy, and reward language follow standards. |
| Vocabulary/Grammar                 | Content QA              | Terminology and CEFR wording are consistent.                          |
| Reading/Listening/Writing/Speaking | Content QA              | Instructions, hints, transcripts, and feedback are clear.             |
| Exam/Review                        | Content QA              | Exam tone is credible; review language is motivating but precise.     |
| Admin/Teacher                      | Design System Designer  | Operational copy remains restrained and scannable.                    |

## Risk Log

| Risk                                        | Mitigation                                                                    |
| ------------------------------------------- | ----------------------------------------------------------------------------- |
| Legacy screens contain many raw hex values. | Audit reports warnings first; only new work is blocked unless contrast fails. |
| Existing content volume is large.           | Sweep by level and skill instead of attempting one giant patch.               |
| Game tone can become childish.              | Localization review keeps tone energetic but exam-credible.                   |
| Dirty worktree can mix unrelated edits.     | Keep each sweep scoped to one cluster and verify with focused diffs.          |

## Acceptance Gates

- `pnpm qa:copy-style` runs and writes reports to `tmp/copy-style-audit.md` and `tmp/copy-style-audit.json`.
- `pnpm qa:copy-style:fix` is reserved for encoding repair sweeps and must be followed by content QA.
- Any `MOJIBAKE`, `INVALID_JSON`, or `MISSING_REQUIRED_LEARNER_TEXT` issue in learner-facing files blocks the sweep.
- Each patch names the owner for unresolved warnings.
- Visual QA is required for learner-facing screen changes on desktop and mobile.
