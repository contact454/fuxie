# Phase 34: AI Eval CI Gate

Date: 2026-05-13

## Role-Gate Compliance

Vai chinh: AI / LLM Engineer
Vai phoi hop: QA Automation Engineer, DevOps / Cloud Engineer, Data / Analytics Engineer

This implementation was started under the mandatory role-gate workflow:

- `task-startup-checklist.md` was read.
- `task-role-router.md` was read.
- The AI / LLM Engineer, QA Automation Engineer, DevOps / Cloud Engineer, and Data / Analytics Engineer profiles were read.
- The task domain is AI eval quality, CI release evidence, optional provider measurement, and privacy-safe reporting.

## Objective

Make AI eval evidence part of the lightweight CI/release gate without requiring provider secrets.

## Gate Design

The new gate is `pnpm check:ai-eval`.

It runs:

1. `pnpm eval:ai`
   - Offline fixture harness.
   - Blocks CI if rubric, CEFR, fallback, score tolerance, or overclaim checks fail.
2. `pnpm eval:ai -- --provider --allow-provider-blocked`
   - Attempts provider-backed evaluation only when a provider key is present.
   - If no `GEMINI_API_KEY` or `GOOGLE_AI_API_KEY` exists, writes a blocked artifact instead of failing CI.
3. `pnpm eval:ai:readout -- --report-path tmp/ai-eval-runs/readout.md`
   - Produces a readout of completed or blocked provider runs.
   - Readout includes run status, pass rate, latency, cost, blockers, model split, and prompt-version split.

## CI Behavior

`.github/workflows/ci.yml` now runs `pnpm check:ai-eval` after the standard `pnpm check` step and prints `tmp/ai-eval-runs/readout.md` to CI logs.

This keeps the release signal explicit:

- Offline AI eval failures block CI.
- Missing provider key is recorded as `blocked_missing_provider_key`, not treated as product failure.
- Provider-backed failures block only when the provider run actually completes and eval cases fail.

## Privacy And Safety

- No eval output is written to `analytics_events`.
- No learner PII, raw submissions, transcripts, audio, prompts, provider payloads, tokens, or secrets are printed by the readout.
- Provider raw output stays inside controlled eval artifacts only when provider mode runs with a key.
- The CI log readout intentionally omits provider raw output.

## Acceptance Evidence

Required local verification:

- `pnpm check:ai-eval`
- `pnpm --filter @fuxie/ai-service test`
- `pnpm check:quick`
- `git diff --check`

## Residual Risk

| Risk | Status | Mitigation |
| --- | --- | --- |
| Provider quality is still unmeasured when no key is present | Accepted for CI | Blocked artifact records missing key; offline harness still blocks regressions |
| Provider raw output could be sensitive | Controlled | Readout omits raw output; artifacts stay under `tmp/ai-eval-runs` |
| CI runtime increases | Low | Offline fixture is small; provider mode is blocked quickly without key |

## Next Planned Step

The next implementation cycle should be **AI Eval Academic Review Pack Slice**:

1. Convert provider/offline eval readouts into a compact review pack for German Academic Lead.
2. Add sample-level review checklist for CEFR fit, German correctness, Vietnamese usefulness, and exam-claim caution.
3. Keep academic signoff separate from automated CI status.
