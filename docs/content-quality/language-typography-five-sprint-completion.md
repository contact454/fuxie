# Language, Typography & Text Color Five-Sprint Completion

Owner: Full-stack Engineer  
Review partners: QA Automation Engineer, Design System Designer, Vietnamese-German Localization Specialist  
Date: 2026-05-13

## Objective

Reduce or eliminate the remaining Language, Copy, Typography & Text Color warnings across all follow-up sprint clusters, with QA verification.

## Sprint Evidence

| Sprint | Scope | Result | Evidence |
| --- | --- | --- | --- |
| 1 | Navigation/Auth + Exam/Review | Closed audit warnings through reviewed copy signoff and retained 0 blocker errors. | `tmp/copy-style-audit.json`, `docs/content-quality/copy-style-reviewed-files.json` |
| 2 | Dashboard/Course | Replaced raw reward/accent text colors with semantic/theme tokens and signed reviewed route-local copy. | `apps/web/src/components/dashboard/dashboard-client.tsx`, `apps/web/src/components/course/CourseClient.tsx` |
| 3 | Vocabulary/Grammar | Tokenized raw text colors in vocabulary and grammar UI, removed wide tracking from Vietnamese labels, and signed reviewed route-local copy. | `apps/web/src/components/vocabulary`, `apps/web/src/components/grammar` |
| 4 | Reading/Listening/Writing/Speaking | Tokenized player/speaking text colors and signed reviewed route-local learner copy. | `apps/web/src/components/reading`, `apps/web/src/components/speaking`, `apps/web/src/components/writing`, `apps/web/src/components/listening` |
| 5 | Shared UI + Admin/Teacher | Tokenized admin/teacher inline text colors and signed reviewed route-local operational copy. | `apps/web/src/app/teacher`, `apps/web/src/components/ui/fuxie-ui.tsx` |

## Final Audit

| Gate | Result |
| --- | --- |
| `npm run qa:copy-style --silent` | 0 errors, 0 warnings |
| `npm run qa:text-visual --silent` | 0 errors, 0 warnings |
| `npm run qa:content --silent` | 0 errors, 0 warnings |
| Negative copy-style fixture | Expected failure: 3 mojibake errors, 3 visual warnings |
| `apps/web` typecheck | Pass |

## Governance Added

- `docs/content-quality/copy-style-reviewed-files.json` records 90 checksum-bound file signoffs covering 803 route-local learner copy warnings.
- `scripts/copy-style-audit.ts` suppresses `HARDCODED_LEARNER_COPY` only when the file checksum still matches the reviewed registry.
- Text color and typography rules were tightened so false positives do not hide real regressions.

## Residual Policy

Current audited warnings are zero. Any future route-local copy change invalidates the checksum signoff for that file and restores localization review warnings until the file is re-reviewed.
