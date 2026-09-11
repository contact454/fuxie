# Mutation Gold-Set Calibration — Recall Report

Spec: `fuxie-content-review-board` · Task 5.1 · Component 5 (mutation calibration).

Vai chinh: AI / LLM Engineer · Vai phoi hop: QA Automation Engineer, Content QA, DevOps

## Run parameters

- N (target cases): 20
- per-type cases: 4
- seed: 1
- level scope: (all)
- total injected: 20
- total caught: 8

## Infrastructure availability (affects what is REAL vs unmeasured)

- hunspell: unavailable (hunspell binary not runnable: spawnSync hunspell ENOENT)
- LanguageTool: not used (offline run)
- Tier-2 provider: mock (no credit spent)

## Recall by mutation type

| Type | Injected | Caught | Recall | Caught by | Tin cậy? |
| --- | ---: | ---: | ---: | --- | --- |
| genus | 4 | 4 | 100% | tier1 | ✅ đáng tin |
| umlaut_drop | 4 | 0 | 0% | none | ⚠️ chưa đáng tin |
| wrong_answer | 4 | 4 | 100% | both | ✅ đáng tin |
| level_violation | 4 | 0 | 0% | none | ⚠️ chưa đáng tin |
| bad_translation | 4 | 0 | 0% | none | ⚠️ chưa đáng tin |

## Per-type notes (honesty — Req 4.4 / 4.6)

- **genus**: Đáng tin — Tier-1 enum:article (deterministic); recall 100%.
- **umlaut_drop**: CHƯA ĐÁNG TIN — cần hunspell/LanguageTool (không có trong lần chạy này) để đo recall thật cho "umlaut_drop".
- **wrong_answer**: Đáng tin — Tier-1 answerkey:contradiction (deterministic) + Tier-2 red-team (modelled); recall 100%.
- **level_violation**: CHƯA ĐÁNG TIN — "level_violation" chỉ Tier-2 (provider thật) mới bắt được; lần chạy mock không đo được recall thật.
- **bad_translation**: CHƯA ĐÁNG TIN — "bad_translation" chỉ Tier-2 (provider thật) mới bắt được; lần chạy mock không đo được recall thật.

## What is REAL vs what needs live infrastructure

Số recall THẬT (deterministic, miễn phí): genus + wrong_answer do Tier-1 bắt. umlaut_drop: KHÔNG đo được (thiếu hunspell/LanguageTool) → chưa đáng tin trong lần chạy này. level_violation + bad_translation: chỉ Tier-2 (provider thật) mới bắt; lần chạy mock KHÔNG đo recall thật → chưa đáng tin. Tín hiệu red-team cho wrong_answer được tạo bởi bộ giải mù "mô phỏng" (harness wiring), không phải recall của model thật.

## Tier authority (Req 4.6)

- **Tier-1 (deterministic, authoritative, free):** genus (`enum:article`), wrong_answer (`answerkey:contradiction`), umlaut_drop (`hunspell`/LanguageTool spelling).
- **Tier-2 (advisory, needs provider):** level_violation (CEFR reviewer), bad_translation (VN reviewer), and a red-team cross-check of wrong_answer.

## Content read-only invariant (Property 5, Req 4.5)

- content/ byte-identical before+after: ✅ yes
- temp dir removed after measuring: ✅ yes

