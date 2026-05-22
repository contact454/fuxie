# Phase 42: AI Eval Prompt Backlog From Fixture Patch Slice

Date: 2026-05-13

## Role-Gate Compliance

Vai chinh: AI / LLM Engineer
Vai phoi hop: Head of German Pedagogy / Academic Lead, QA Automation Engineer

The AI / LLM Engineer, German Academic Lead, and QA Automation Engineer profiles were read before this cycle.

## Objective

Convert AI eval, academic review, fixture expansion, and controlled fixture patch evidence into a safe prompt backlog. Do not change prompts, provider behavior, or baseline fixtures without Academic Lead signoff.

## Execution Evidence

| Check | Result | Evidence |
| --- | --- | --- |
| Offline eval | Pass | `pnpm eval:ai`: 5/5 cases passed, average score 68, median latency 1800 ms, estimated cost USD 0.0143 |
| Provider-backed eval | Blocked | `blocked_missing_provider_key`; requires `GEMINI_API_KEY` or `GOOGLE_AI_API_KEY` |
| Academic review pack | Pass | `tmp/ai-eval-runs/academic-review-pack.md` generated |
| Academic signoff template | Pass | `tmp/ai-eval-runs/academic-signoff-template.json` and report generated |
| Fixture expansion | Pass | 0 follow-up actions, 0 proposals, no blockers |
| Controlled fixture patch | Pass | Preview mode, 0 candidate cases, no `baseline.json` mutation |
| CI-style AI eval gate | Pass with provider blocker | `pnpm check:ai-eval` completed and readout recorded provider key blocker |

## Prompt Backlog Decision

No prompt backlog item is created in this cycle because the Academic Lead signoff is still pending and fixture expansion produced zero follow-up actions.

The correct backlog trigger is:

1. Academic Lead reviews the generated signoff template.
2. Any case marked `changes_requested` includes explicit follow-up action.
3. `pnpm eval:ai:fixture-expansion -- --signoff <file> --require-final` generates candidate cases.
4. Controlled fixture patch previews candidate cases.
5. Only then can AI / LLM Engineer create prompt work items.

## Acceptance Status

Accepted:

- Offline AI eval workflow.
- Academic review pack generation.
- Signoff template generation.
- Proposal-only fixture expansion.
- Controlled fixture preview safety.

Conditional:

- Provider-backed quality remains blocked by missing key.
- Prompt backlog remains empty until Academic Lead records final decisions.

## Next Action

Academic Lead should complete the signoff JSON, then rerun fixture expansion with `--require-final`.
