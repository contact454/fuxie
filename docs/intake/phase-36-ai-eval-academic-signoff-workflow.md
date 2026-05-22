# Phase 36: AI Eval Academic Signoff Workflow

Date: 2026-05-13

## Role-Gate Compliance

Vai chinh: AI / LLM Engineer
Vai phoi hop: Head of German Pedagogy / Academic Lead, QA Automation Engineer, Data / Analytics Engineer

This implementation was started under the mandatory role-gate workflow:

- `task-startup-checklist.md` was read.
- `task-role-router.md` was read.
- The AI / LLM Engineer, German Academic Lead, QA Automation Engineer, and Data / Analytics Engineer profiles were read.
- The task domain is AI eval evidence, academic decision workflow, QA validation, and privacy-safe review metadata.

## Objective

Turn the Phase 35 academic review pack into a structured signoff workflow.

Fuxie needs a clear separation between:

- automated AI eval evidence
- German Academic Lead academic decision
- prompt or fixture follow-up backlog
- runtime AI behavior

This slice adds the workflow structure only. It does not change AI prompts, model routing, learner UI, analytics tables, or runtime grading behavior.

## Role Ownership

| Area | Owner | Rule |
| --- | --- | --- |
| Eval evidence and template generation | AI / LLM Engineer | Can generate review pack and signoff template, but cannot approve academic quality |
| Academic decision | Head of German Pedagogy / Academic Lead | Owns `approved`, `changes_requested`, and `rejected` decisions |
| Validation and regression protection | QA Automation Engineer | Owns tests that verify schema, rule enforcement, and report generation |
| Evidence metadata use | Data / Analytics Engineer | Can use signoff status as internal evidence metadata, not learner analytics |

## Decision Rules

Allowed case and overall decisions:

- `approved`
- `changes_requested`
- `rejected`

Draft templates can use `pending`.

Final signoff requires:

- reviewer role is `Head of German Pedagogy / Academic Lead`
- reviewer name is filled
- `reviewedAt` is an ISO timestamp
- every eval case has a decision
- every academic dimension has a decision
- `approved` cases have all dimensions approved
- `changes_requested` and `rejected` cases include at least one follow-up action
- overall decision matches the derived decision:
  - any rejected case means overall `rejected`
  - otherwise any changes-requested case means overall `changes_requested`
  - all approved cases means overall `approved`

## Academic Dimensions

Each case must be reviewed against:

- CEFR fit
- German correctness
- Vietnamese learner usefulness
- Exam-claim caution
- Retry usefulness
- Safety/privacy

## Commands

Generate a draft signoff template and markdown report:

```bash
pnpm eval:ai:academic-signoff
```

Default outputs:

```text
tmp/ai-eval-runs/academic-signoff-template.json
tmp/ai-eval-runs/academic-signoff-report.md
```

Validate a completed signoff file:

```bash
pnpm eval:ai:academic-signoff -- --signoff tmp/ai-eval-runs/academic-signoff-template.json --require-final
```

When `--require-final` is used, validation exits non-zero if the record is still pending, mismatched, or privacy unsafe.

## Privacy And Safety

The signoff record must not include:

- learner PII
- raw learner submissions
- transcripts
- audio files
- prompt text
- provider payloads
- tokens
- secrets

Reviewer notes and follow-up actions should reference eval case IDs and prompt/backlog actions, not raw learner data.

## Acceptance Evidence

Required local verification:

- `pnpm eval:ai:academic-signoff`
- `pnpm --filter @fuxie/ai-service test -- eval-academic-signoff`
- `pnpm --filter @fuxie/ai-service test`
- `pnpm check:quick`
- `git diff --check`

## Residual Risk

| Risk | Status | Mitigation |
| --- | --- | --- |
| Signoff template may stay pending indefinitely | Accepted for workflow v1 | Final validation can require non-pending decisions with `--require-final` |
| Reviewer notes could be too vague for prompt follow-up | Controlled | Changes-requested and rejected cases require follow-up actions |
| Signoff evidence could be mistaken for runtime behavior change | Controlled | Record has `runtimeEffect: none` and docs state no runtime AI change |

## Next Planned Step

The next implementation cycle should be **AI Eval Fixture Expansion From Academic Feedback Slice**:

1. Use completed signoff follow-up actions to update synthetic eval fixtures.
2. Add missing CEFR or surface cases requested by Academic Lead.
3. Keep provider prompt changes separate from academic signoff records.
