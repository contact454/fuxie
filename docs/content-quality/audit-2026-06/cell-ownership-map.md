# Content Program Cell Ownership Map

Vai chinh: Project Manager / Delivery Manager  
Vai phoi hop: Content QA / Linguistic Reviewer, German Academic Lead, Audio Script & Voice Producer

Generated for the Kiro content-audit remediation program, 2026-06. This map assigns each of the 36 level x module cells to a workstream owner and states the current evidence source.

## Current Gate Summary

- Inventory: 36 cells, 1,187 content files/items tracked by `docs/content-quality/audit-2026-06/status-board.json`.
- Machine gate: 36/36 cells `qaMachine=pass` after `scripts/content-status-board.ts` on 2026-06-10.
- D3 topic-match: 36/36 cells `d3=pass`; 16 semantic evidence overrides are audited in `topic-evidence-overrides.json` and remain non-D7 evidence.
- Academic signoff: 1/36 cells signed in `signoff-manifest.json`; remaining cells require German Academic Lead or delegated native reviewer signoff before "Done (du)".
- Audio: 6/6 listening cells remain `audio=pending`; regenerated transcripts require Audio_Restubbing before release-grade listening signoff.
- Release stance: machine-clean, not fully release-signed.

## Ownership Table

| Cell | Files | Machine | Academic | Audio | Primary workstream | Owner | Next gate |
| --- | ---: | --- | --- | --- | --- | --- | --- |
| reading/A1 | 30 | pass | pending | n/a | `content-program-quality` spot-check | German Academic Lead | D7 sample/full signoff |
| listening/A1 | 32 | pass | pending | pending | `content-program-quality` listening spot-check | Audio Script & Voice Producer | D7 + audio parity |
| writing/A1 | 35 | pass | pending | n/a | `content-writing-audit` | German Academic Lead | D7 writing prompt/model review |
| speaking/A1 | 10 | pass | pending | n/a | `content-speaking-grammar-audit` | German Academic Lead | D7 speaking prompt review |
| vocabulary/A1 | 21 | pass | pending | n/a | `content-vocabulary-audit` | German Academic Lead | D7 vocab sample/full review |
| grammar/A1 | 1 | pass | pending | n/a | `content-speaking-grammar-audit` | German Academic Lead | D7 grammar review |
| reading/A2 | 40 | pass | pending | n/a | `content-program-quality` spot-check | German Academic Lead | D7 sample/full signoff |
| listening/A2 | 40 | pass | pending | pending | `content-program-quality` listening spot-check | Audio Script & Voice Producer | D7 + audio parity |
| writing/A2 | 35 | pass | pending | n/a | `content-writing-audit` | German Academic Lead | D7 writing prompt/model review |
| speaking/A2 | 8 | pass | pending | n/a | `content-speaking-grammar-audit` | German Academic Lead | D7 speaking prompt review |
| vocabulary/A2 | 26 | pass | pending | n/a | `content-vocabulary-audit` | German Academic Lead | D7 vocab sample/full review |
| grammar/A2 | 1 | pass | pending | n/a | `content-speaking-grammar-audit` | German Academic Lead | D7 grammar review |
| reading/B1 | 50 | pass | pending | n/a | `reading-explanation-regeneration` + spot-check | German Academic Lead | D7 reading review |
| listening/B1 | 44 | pass | pending | pending | `content-listening-regeneration` | Audio Script & Voice Producer | D7 + Audio_Restubbing |
| writing/B1 | 50 | pass | pending | n/a | `content-writing-audit` | German Academic Lead | D7 writing prompt/model review |
| speaking/B1 | 6 | pass | pending | n/a | `content-speaking-grammar-audit` | German Academic Lead | D7 speaking prompt review |
| vocabulary/B1 | 42 | pass | pending | n/a | `content-vocabulary-audit` | German Academic Lead | D7 vocab sample/full review |
| grammar/B1 | 1 | pass | pending | n/a | `content-speaking-grammar-audit` | German Academic Lead | D7 grammar review |
| reading/B2 | 50 | pass | pending | n/a | `content-cefr-stem-regeneration` + explanations | German Academic Lead | D7 reading review |
| listening/B2 | 48 | pass | pending | pending | `content-listening-regeneration` | Audio Script & Voice Producer | D7 + Audio_Restubbing |
| writing/B2 | 40 | pass | pending | n/a | `content-writing-audit` | German Academic Lead | D7 writing prompt/model review |
| speaking/B2 | 10 | pass | pending | n/a | `content-speaking-grammar-audit` | German Academic Lead | D7 speaking prompt review |
| vocabulary/B2 | 60 | pass | pending | n/a | `content-vocabulary-audit` | German Academic Lead | D7 vocab sample/full review |
| grammar/B2 | 1 | pass | pending | n/a | `content-speaking-grammar-audit` | German Academic Lead | D7 grammar review |
| reading/C1 | 48 | pass | pending | n/a | `content-cefr-stem-regeneration` + explanations | German Academic Lead | D7 reading review |
| listening/C1 | 52 | pass | pending | pending | `content-listening-regeneration` | Audio Script & Voice Producer | D7 + Audio_Restubbing |
| writing/C1 | 35 | pass | pending | n/a | `content-writing-audit` | German Academic Lead | D7 writing prompt/model review |
| speaking/C1 | 8 | pass | pending | n/a | `content-speaking-grammar-audit` | German Academic Lead | D7 speaking prompt review |
| vocabulary/C1 | 75 | pass | pending | n/a | `content-vocabulary-audit` | German Academic Lead | D7 vocab sample/full review |
| grammar/C1 | 1 | pass | pending | n/a | `content-speaking-grammar-audit` | German Academic Lead | D7 grammar review |
| reading/C2 | 48 | pass | signed | n/a | `content-c2-placeholder-regeneration`, `content-c2-teil2-regeneration`, `content-c2-teil3-regeneration`, `content-cefr-stem-regeneration` | German Academic Lead | Optional native spot-check |
| listening/C2 | 52 | pass | pending | pending | `content-listening-regeneration` | Audio Script & Voice Producer | D7 + Audio_Restubbing |
| writing/C2 | 35 | pass | pending | n/a | `content-writing-audit` | German Academic Lead | D7 writing prompt/model review |
| speaking/C2 | 6 | pass | pending | n/a | `content-speaking-grammar-audit` | German Academic Lead | D7 speaking prompt review |
| vocabulary/C2 | 145 | pass | pending | n/a | `content-vocabulary-audit` | German Academic Lead | D7 vocab sample/full review |
| grammar/C2 | 1 | pass | pending | n/a | `content-speaking-grammar-audit` | German Academic Lead | D7 grammar review |

## Governance Rules

- `scripts/content-status-board.ts` remains the machine-status source of truth.
- `docs/content-quality/audit-2026-06/topic-evidence-overrides.json` may clear D3 only when the evidence term is present in the content and audit metadata is complete; it does not grant academic signoff.
- `docs/content-quality/audit-2026-06/signoff-manifest.json` remains the human/audio status source of truth.
- A content cell can be called "Done (may)" when D1-D6 pass.
- A content cell can be called "Done (du)" only after D7 is signed and, for listening, audio is no longer pending.
- AI-authored or AI-remediated content remains advisory until German Academic Lead/native reviewer signoff is recorded.
