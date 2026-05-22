# Phase 35: AI Eval Academic Review Pack

Date: 2026-05-13

## Role-Gate Compliance

Vai chinh: AI / LLM Engineer
Vai phoi hop: Head of German Pedagogy / Academic Lead, QA Automation Engineer, Data / Analytics Engineer

This implementation was started under the mandatory role-gate workflow:

- `task-startup-checklist.md` was read.
- `task-role-router.md` was read.
- The AI / LLM Engineer, German Academic Lead, QA Automation Engineer, and Data / Analytics Engineer profiles were read.
- The task domain is AI eval quality, academic signoff evidence, privacy-safe reporting, and QA coverage.

## Objective

Create a compact academic review pack for the German Academic Lead so automated AI eval results can be reviewed for learning quality before Fuxie makes stronger AI tutor, grading, speaking, or exam-practice claims.

This pack is intentionally separate from CI status:

- CI can say the automated eval gate passed.
- Only the German Academic Lead can sign off CEFR fit, German correctness, learner usefulness, and exam-claim caution.

## Implementation

New command:

```bash
pnpm eval:ai:academic-review
```

Default output:

```text
tmp/ai-eval-runs/academic-review-pack.md
```

The command reads:

- `scripts/fixtures/ai-eval-harness/baseline.json`
- optional provider artifacts from `tmp/ai-eval-runs/`

It writes a markdown review pack with:

- suite version and generated timestamp
- offline pass rate and latest provider evidence status
- cases grouped by CEFR level and AI surface
- controlled output excerpts
- academic checklist placeholders per case
- explicit pending signoff section

## Academic Review Dimensions

Every case is reviewed against:

- CEFR fit
- German correctness
- Vietnamese learner usefulness
- Exam-claim caution
- Retry usefulness
- Safety/privacy

## Privacy And Safety

The academic review pack must not include:

- learner PII
- raw learner submissions
- transcripts or audio
- prompts
- provider raw output
- tokens
- secrets
- provider payloads

The markdown renderer uses controlled `outputExcerpt` fields only. Provider prompts remain in the fixture for provider test execution but are not rendered into the review pack.

## Acceptance Evidence

Required local verification:

- `pnpm eval:ai:academic-review`
- `pnpm --filter @fuxie/ai-service test -- eval-academic-review-pack`
- `pnpm --filter @fuxie/ai-service test`
- `pnpm check:quick`
- `git diff --check`

## Residual Risk

| Risk | Status | Mitigation |
| --- | --- | --- |
| Automated eval can pass while academic quality is not approved | Controlled | Review pack marks signoff as pending and states CI pass is not academic signoff |
| Provider run may be blocked without local secrets | Accepted | Pack records latest provider status from artifact readout; offline fixture remains available |
| Controlled excerpts may still be too thin for final academic approval | Accepted for v1 | Academic Lead can request richer synthetic samples in a follow-up eval fixture cycle |

## Next Planned Step

The next implementation cycle should be **AI Eval Academic Signoff Workflow Slice**:

1. Add a lightweight signoff record format for Academic Lead decisions.
2. Track approved, changes-requested, and rejected eval cases without changing runtime AI behavior.
3. Feed academic review outcomes back into eval fixture updates and prompt backlog.
