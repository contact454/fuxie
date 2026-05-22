# Language, Copy, Typography & Text Color QA Report

Owner: QA Automation Engineer  
Review partners: Content QA / Linguistic Reviewer, Vietnamese-German Localization Specialist, Design System Designer

## Objective

Execute the Fuxie language, copy, typography, and text-color sweep by removing learner-facing encoding blockers, establishing standards and gates, classifying remaining copy/style debt by cluster, and verifying the result with relevant QA and type checks.

## Evidence Checklist

| Requirement | Evidence | Status |
| --- | --- | --- |
| Repair learner-facing Vietnamese mojibake blockers | `npm run qa:copy-style --silent` reports 0 errors across 1647 files. Supplemental UTF-8 scan over `apps/web/messages`, `apps/web/src`, `content`, docs, and token scopes reports 0 files with Vietnamese mojibake patterns. | Pass |
| Keep learner content structurally valid | `npm run qa:content --silent` scans 1193 files and reports 0 errors, 0 warnings. | Pass |
| Establish language, typography, text-color, glossary, taxonomy, and checklist standards | `docs/content-quality/language-typography-text-color-standards.md` covers voice, VI/DE copy, typography, semantic text colors, glossary, error taxonomy, and release checklist. | Pass |
| Add rollout and cluster ownership | `docs/content-quality/language-typography-rollout-plan.md` defines sweep order, owners, risks, and acceptance gates. | Pass |
| Classify remaining debt by owner and cluster | `docs/content-quality/language-typography-sweep-backlog.md` and `tmp/copy-style-audit.json` now report 0 warnings after the five-sprint follow-up sweep. | Pass |
| Enforce audit gates | `scripts/copy-style-audit.ts` fails on mojibake, invalid learner JSON, and missing required localized learner messages; checksum-reviewed route-local copy is tracked in `docs/content-quality/copy-style-reviewed-files.json`, and changed files warn again. | Pass |
| Provide package commands | `package.json` defines `qa:copy-style`, `qa:copy-style:fix`, and `qa:text-visual`. Copy-style commands run through Node native TypeScript stripping to avoid local `tsx`/esbuild spawn failures. | Pass |
| Validate negative fixtures | `scripts/fixtures/copy-style-negative` intentionally triggers `MOJIBAKE_VIETNAMESE_ACCENT`, `RAW_HEX_COLOR`, `ARBITRARY_TEXT_SIZE`, and `TRACKING_ON_LONG_COPY`; fixture audit exits non-zero as expected. | Pass |
| Align semantic text tokens | `packages/ui/src/tokens/index.ts` and `apps/web/src/app/globals.css` contain aligned text tokens for primary, secondary, muted, subtle, inverse, brand, success, warning, danger, and reward. | Pass |
| Typecheck relevant workspaces | Direct `tsc --noEmit --pretty false` passes for `apps/web`, `apps/ai-service`, `packages/database`, `packages/shared`, `packages/srs-engine`, and `packages/ui`. | Pass |
| Root package-manager typecheck | `turbo run typecheck` cannot run because this environment has no `pnpm` binary for Turbo to invoke. Direct workspace typechecks were used instead. | Environment blocked |
| Runtime desktop/mobile pilot-route QA | Next CLI is blocked by sandbox fork policy, but direct `startServer()` in the same Node process works. Desktop and mobile user-agent smoke covered `/`, `/login`, `/onboarding`, `/dashboard`, `/course`, `/grammar`, and `/grammar/mocktest`; protected root/login redirect to dashboard, pilot pages return 200, and returned HTML has no mojibake. | Pass |

## Current Gate Results

- Copy/style audit: 0 errors, 0 warnings.
- Text visual audit: 0 errors, 0 warnings.
- Content QA: 0 errors, 0 warnings.
- Supplemental Vietnamese mojibake scan: 0 files with hits.
- Negative fixture audit: 3 expected mojibake errors and 3 expected visual warnings.
- Direct Next server smoke: desktop/mobile route checks pass for auth/onboarding, dashboard/course, and grammar pilot surfaces.
- Web typecheck: `node_modules/.bin/tsc.CMD --noEmit --pretty false` passes from `apps/web`.

## Residual Risk

Browser screenshot-level QA is still better for final release signoff, but the sandbox blocks the standard Next CLI fork path. The direct server-render smoke, static text visual audit, and token alignment checks cover the release-blocking language, typography, and text-color risks for this sweep.
