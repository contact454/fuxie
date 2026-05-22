# Phase 38: AI Eval Controlled Fixture Patch

Date: 2026-05-13

## Role-Gate Compliance

Vai chinh: AI / LLM Engineer
Vai phoi hop: Head of German Pedagogy / Academic Lead, QA Automation Engineer, Data / Analytics Engineer

This implementation was started under the mandatory role-gate workflow:

- `task-startup-checklist.md` was read.
- `task-role-router.md` was read.
- The AI / LLM Engineer, German Academic Lead, QA Automation Engineer, and Data / Analytics Engineer profiles were read.
- The task domain is controlled AI eval fixture patching, academic approval handoff, QA validation, and privacy-safe evidence.

## Objective

Create a controlled patch workflow for `scripts/fixtures/ai-eval-harness/baseline.json`.

The workflow must let Fuxie preview candidate eval fixture changes from Phase 37 proposals, while preventing accidental baseline mutation. This slice adds tooling and validation. It does not apply a real fixture change unless the operator explicitly passes `--apply` and the proposal plan is not blocked.

## Role Ownership

| Area | Owner | Rule |
| --- | --- | --- |
| Academic approval source | Head of German Pedagogy / Academic Lead | Owns whether a follow-up becomes a fixture case |
| Controlled patch generation | AI / LLM Engineer | Converts approved proposals into candidate cases and patch preview |
| Regression validation | QA Automation Engineer | Verifies candidate fixture still passes eval harness and report stays privacy-safe |
| Evidence metadata | Data / Analytics Engineer | May track patch counts/status internally, not learner analytics |

## Patch Rules

- Preview mode never writes `baseline.json`.
- Apply mode requires explicit `--apply`.
- Blocked expansion plans cannot be applied.
- `manual_review` proposals cannot be applied automatically.
- Candidate case IDs must not already exist.
- Candidate cases clone the source synthetic eval case and rename it to the approved follow-up ID.
- Reports omit provider prompt text and raw provider output.
- Runtime AI behavior is unchanged by this workflow.

## Command

Preview controlled fixture patch:

```bash
pnpm eval:ai:controlled-fixture-patch
```

Default outputs:

```text
tmp/ai-eval-runs/controlled-fixture-preview.json
tmp/ai-eval-runs/controlled-fixture-patch.md
```

Apply a validated patch to the baseline fixture:

```bash
pnpm eval:ai:controlled-fixture-patch -- --apply
```

Limit to specific proposals:

```bash
pnpm eval:ai:controlled-fixture-patch -- --proposal FX-AI-A1-WRITE-001-FOLLOWUP-01
```

## Acceptance Evidence

Required local verification:

- `pnpm eval:ai:controlled-fixture-patch`
- `pnpm --filter @fuxie/ai-service test -- eval-controlled-fixture-patch`
- `pnpm --filter @fuxie/ai-service test`
- `pnpm check:quick`
- `git diff --check`

When a real apply happens, also run:

- `pnpm eval:ai`
- `pnpm eval:ai:academic-review`
- `pnpm eval:ai:academic-signoff -- --require-final`

## Residual Risk

| Risk | Status | Mitigation |
| --- | --- | --- |
| No real proposal exists yet | Accepted | Tooling previews no-op safely until Academic Lead signoff produces proposals |
| Candidate fixture may need deeper pedagogical rewrite | Controlled | This workflow creates synthetic candidate cases only; Academic Lead still owns signoff |
| Apply mode could mutate baseline fixture | Controlled | Requires explicit `--apply` and blocks unsafe/manual-review proposals |

## Next Planned Step

The next implementation cycle should be **AI Eval Prompt Backlog From Fixture Patch Slice**:

1. Convert controlled fixture patch changes into prompt backlog items.
2. Keep prompt implementation separate from fixture evidence.
3. Re-run eval, review pack, signoff, and controlled fixture patch after prompt changes.
