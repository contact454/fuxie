# Speaking D7 Advisory Review

Vai chinh: German Academic Lead
Vai phoi hop: Content QA / Linguistic Reviewer, Exam Prep Specialist

Date: 2026-06-10
Scope: `content/{a1,a2,b1,b2,c1,c2}/speaking/*.json`

## Result

- Coverage: 48/48 speaking files across 6/6 CEFR cells.
- Inventory checked: 384 lessons and 2,304 learner-facing speaking sentences.
- Structural readiness: every file has 8 lessons, every lesson has 6 sentences, and every file has the four-part pronunciation/fluency/accuracy/task-completion rubric.
- Metadata readiness: every file keeps aligned CEFR audit metadata and at least one learning outcome.
- Pronunciation guidance: 85 defective IPA entries were remediated; the corpus now has 0 blank IPA entries, 0 ASCII pseudo-IPA entries, and 0 corrupted or multiline IPA entries.
- Machine evidence: `scripts/content-qa.ts` scans 1,193 files with 0 errors and 0 warnings.
- Academic status: advisory review only; `signoff-manifest.json` remains the source for final D7 signoff.

## Findings Closed

The sentence-level sweep found 79 phonetic fields written as approximate Latin reading aids rather than IPA: 65 in A1 and 14 in A2. It also found six empty IPA fields in the first lesson of `c2-sprache.json`.

Remediation:

- Replaced the 79 pseudo-IPA values with German IPA generated from the current learner sentence.
- Added IPA guidance for all six affected C2 sentences.
- Restored standard German Umlaut spelling in the affected C2 learner text and pronunciation notes (`ä`, `ö`, `ü` instead of `ae`, `oe`, `ue`).
- Normalized generated IPA to one line and removed invalid placeholder symbols found during post-generation review.
- Added `speaking-d7-readiness.spec.ts` to guard the complete inventory, lesson/sentence counts, required bilingual fields, IPA integrity, CEFR metadata, and scoring rubric.

## Audio Boundary

All 2,304 speaking sentence records currently have an empty `audioUrl`. This review records that fact but does not classify it as a release blocker because the current signoff manifest only tracks audio parity for listening cells. Product and curriculum owners should make a separate decision before adding speaking audio as a release requirement.

## Remaining D7 Boundary

This advisory sweep does not mark the six speaking cells as native/human signed. A German Academic Lead or delegated native reviewer still needs to review communicative naturalness, pronunciation detail, CEFR fit, and exam-task fidelity, then record final decisions in `signoff-manifest.json`.

## Verification

- `node node_modules/tsx/dist/cli.mjs scripts/content-qa.ts`
- `node node_modules/vitest/vitest.mjs run tests/content-audit/speaking-d7-readiness.spec.ts --passWithNoTests`
