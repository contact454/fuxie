# Fuxie Learning Content Release Candidate Signoff

Date: 2026-05-12  
Scope: Content + QA tooling only  
Primary role: Content QA / Linguistic Reviewer  
Support roles: German Academic Lead, German Curriculum Designer, German Content Writer

## Signoff Criteria

- `scripts/content-qa.ts` scans all content JSON files and reports 0 errors, 0 warnings.
- Listening content has complete transcript metadata and learner-visible script lines.
- Reading, listening, writing, and speaking content include CEFR audit metadata.
- Grammar, vocabulary, reading, listening, writing, speaking, and course content include learning outcomes.
- Semantic QA checks block serious evidence, transcript, metadata, and circular-definition issues.
- Style guide and CEFR audit checklist are present in `docs/content-quality/`.

## Team Decision

The content team may treat this package as release candidate when all automated checks pass and spot-check review finds no blocker in the sampled files.

## Residual Risk

Automated QA cannot fully prove naturalness, exam authenticity, or audio-script parity. Full human academic spot checks remain required before a production launch claim.

