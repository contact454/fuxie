# Writing D7 Advisory Review

Vai chinh: German Academic Lead
Vai phoi hop: Content QA / Linguistic Reviewer, Exam Prep Specialist

Date: 2026-06-10
Scope: `content/{a1,a2,b1,b2,c1,c2}/writing/*.json`

## Result

- Coverage: 230/230 writing files across 6/6 CEFR cells and 13 level/Teil groups.
- Remediation: 216 model answers were regenerated or normalized: A1 21, A2 35, B1 50, B2 40, C1 35, C2 35.
- Length readiness: every model answer is within its declared `minWords`/`maxWords` range.
- Template readiness: 0 legacy meta-template answers, 0 weak `ich schreibe wegen` placeholders, and 0 known corrupted or ASCII-only generated tokens remain.
- Duplicate readiness: 0 exact model-answer duplicates and 0 near-exact pairs at the advisory threshold of 0.95 within a CEFR level.
- Structural readiness: all files retain their task prompt, situation, content points, rubric, aligned CEFR metadata, and learning outcomes.
- Academic status: advisory remediation only; final native review and `signoff-manifest.json` decisions remain pending.

## Findings Closed

The initial classifier selected 215 files and reported overlapping defect reasons:

- 169 model answers below `minWords`.
- 2 model answers above `maxWords`.
- 160 answers using a generic meta-template.
- 54 answers using the weak `ich schreibe wegen` placeholder.

The independent post-write audit found one additional A1 answer with an ASCII-only `Viele Gruesse` closing. It was added to the remediation set, bringing the final total to 216 files.

Remediation used the repository-local deterministic generator in `scripts/apply-writing-regen.ts`. No external AI provider was used. The script preserves the JSON schema, rewrites only model-answer quality fields and advisory notes, validates word ranges, rejects known templates/tokens, and screens exact or near-exact duplicates.

## Remaining D7 Boundary

This pass closes objective machine-detectable readiness blockers. It does not establish that every answer is idiomatic, pedagogically optimal, fully topic-specific, or exam-authentic. A German Academic Lead or delegated native reviewer must still review naturalness, CEFR fit, task fulfillment, register, and rubric alignment before changing any writing cell to signed.

The original Writing audit target of pairwise overlap below 0.5 is not claimed here. The implemented 0.95 threshold is an exact/near-exact blocker; lower-overlap shared frames require human classification to distinguish a defect from a legitimate exam-task structure.

## Verification

- `node node_modules/tsx/dist/cli.mjs scripts/apply-writing-regen.ts`
- `node node_modules/tsx/dist/cli.mjs scripts/content-qa.ts`
- `node node_modules/vitest/vitest.mjs run tests/content-audit/writing-d7-readiness.spec.ts --passWithNoTests`
- `node node_modules/tsx/dist/cli.mjs scripts/content-d7-signoff-sweep.ts --check`
- `node node_modules/vitest/vitest.mjs run tests/content-audit --passWithNoTests`
