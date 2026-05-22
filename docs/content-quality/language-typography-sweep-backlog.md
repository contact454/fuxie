# Language, Copy, Typography & Text Color Sweep Backlog

Owner: Project Manager / Delivery Manager  
Source: `tmp/copy-style-audit.json` after the five-sprint follow-up sweep

## Current Gate

- Blocking encoding/content errors: 0.
- Remaining warnings: 0.
- Warning policy: new warnings are release backlog unless they touch newly changed learner-facing UI, a release-critical flow, or a known low-contrast issue.
- Route-local hardcoded learner copy is tracked in `docs/content-quality/copy-style-reviewed-files.json`; checksums invalidate the signoff when a file changes.

## Warning Counts

| Code                     | Count | Owner                                     | Handling                                                                                                 |
| ------------------------ | ----: | ----------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `HARDCODED_LEARNER_COPY` |     0 | Vietnamese-German Localization Specialist | 803 existing route-local warnings were reviewed and checksum-signed; future changed files warn again.     |
| `RAW_HEX_COLOR`          |     0 | Design System Designer                    | Text colors now use semantic/theme tokens in the audited source.                                         |
| `ARBITRARY_TEXT_SIZE`    |     0 | Design System Designer                    | Learner-facing arbitrary text sizes were converted to the shared scale or rule false positives removed.  |
| `TRACKING_ON_LONG_COPY`  |     0 | Design System Designer                    | Wide tracking was removed from Vietnamese learner labels caught by the audit.                            |

## Cluster Order

| Cluster                            | Warnings | Next action                                                                            |
| ---------------------------------- | -------: | -------------------------------------------------------------------------------------- |
| Shared UI                          |        0 | Keep reusable copy in messages when reused; keep token-only text colors.                |
| Vocabulary/Grammar                 |        0 | Keep instruction text and feedback states under localization review.                    |
| Reading/Listening/Writing/Speaking |        0 | Keep player instructions, transcripts, and explanations checksum-reviewed.              |
| Dashboard/Course                   |        0 | Keep mission/reward language tokenized and reviewed before release.                     |
| Admin/Teacher                      |        0 | Keep operational tone restrained and avoid raw text colors.                             |
| Exam/Review                        |        0 | Preserve exam credibility while clarifying next actions and review states.              |
| Navigation/Auth                    |        0 | Keep labels short, localized, and encoding-clean.                                      |

## Definition Of Done Per Cluster

- No `MOJIBAKE_*`, `INVALID_JSON`, or `MISSING_REQUIRED_LEARNER_TEXT` issues.
- No release-critical hardcoded copy without localization review.
- No new raw hex text colors in learner-facing UI.
- No long sentence or paragraph uses wide tracking.
- Visual QA covers one desktop and one mobile viewport for changed learner screens.
