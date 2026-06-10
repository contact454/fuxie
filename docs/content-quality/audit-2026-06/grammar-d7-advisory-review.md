# Grammar D7 Advisory Review

Vai chinh: German Academic Lead
Vai phoi hop: Content QA / Linguistic Reviewer

Date: 2026-06-10
Scope: `content/{a1,a2,b1,b2,c1,c2}/grammar/grammar-topics.json`

## Result

- Coverage: 6/6 grammar cells, 55 grammar topics.
- Machine evidence: `scripts/content-qa.ts` scans 1193 files with 0 errors and 0 warnings.
- Structural D7 readiness: every grammar topic now has at least 3 learner-facing exercises.
- Metadata readiness: every grammar topic keeps `cefrAudit.verdict=aligned` and at least one learning outcome.
- Academic status: advisory review only; `signoff-manifest.json` remains the source for final D7 signoff.

## Finding Closed

C1 and C2 grammar topics had only one exercise per topic, while A1-B2 had a three-exercise scaffold. This under-supported advanced learners because they received one controlled item but no recognition/production practice pattern.

Remediation:

- Added one recognition exercise per C1/C2 topic grounded in an existing example sentence.
- Added one production exercise per C1/C2 topic requiring a formal sentence with the target structure.
- Kept the original topic-specific exercise in every topic.
- Normalized prompt wording to avoid case/gender errors from inserting German topic titles after prepositions.

## Remaining D7 Boundary

This review does not mark the six grammar cells as native/human signed. A German Academic Lead or delegated native reviewer still needs to record final decisions in `signoff-manifest.json` before those cells can become `Done (du)`.

## Verification

- `node node_modules/tsx/dist/cli.mjs scripts/content-qa.ts`
- `node node_modules/vitest/vitest.mjs run tests/content-audit/grammar-d7-readiness.spec.ts --passWithNoTests`
