# Phase 37: AI Eval Fixture Expansion From Academic Feedback

Date: 2026-05-13

## Role-Gate Compliance

Vai chinh: AI / LLM Engineer
Vai phoi hop: Head of German Pedagogy / Academic Lead, QA Automation Engineer, Data / Analytics Engineer

This implementation was started under the mandatory role-gate workflow:

- `task-startup-checklist.md` was read.
- `task-role-router.md` was read.
- The AI / LLM Engineer, German Academic Lead, QA Automation Engineer, and Data / Analytics Engineer profiles were read.
- The task domain is AI eval fixture planning, academic feedback handoff, QA validation, and privacy-safe evidence.

## Objective

Turn completed academic signoff follow-up actions into a proposal-only fixture expansion backlog.

The goal is to make feedback actionable without silently changing the AI eval baseline. This cycle creates structured proposals for fixture updates, regression cases, and prompt backlog items; it does not mutate `baseline.json`, runtime prompts, model routing, learner UI, analytics tables, or production AI behavior.

## Role Ownership

| Area | Owner | Rule |
| --- | --- | --- |
| Academic feedback source | Head of German Pedagogy / Academic Lead | Owns signoff decisions and follow-up actions |
| Fixture expansion proposal | AI / LLM Engineer | Converts follow-up actions into proposal-only candidate fixture work |
| Validation | QA Automation Engineer | Verifies signoff validity, proposal generation, and report output |
| Evidence metadata | Data / Analytics Engineer | Can use proposal counts as internal process metadata only |

## Expansion Rules

- `approved` cases do not generate expansion proposals.
- `changes_requested` cases generate `update_existing_case` proposals.
- `rejected` cases generate `add_regression_case` proposals.
- Unknown or missing source cases require `manual_review`.
- Open academic dimensions become the proposal focus.
- Follow-up actions become prompt backlog handoff lines.
- No raw learner data, transcript, audio, provider payload, token, secret, or prompt text may be added.
- All generated output is `proposal_only`.

## Command

Generate a draft expansion proposal:

```bash
pnpm eval:ai:fixture-expansion
```

Default outputs:

```text
tmp/ai-eval-runs/fixture-expansion-proposal.json
tmp/ai-eval-runs/fixture-expansion-proposal.md
```

Validate a completed signoff before generating expansion proposals:

```bash
pnpm eval:ai:fixture-expansion -- --signoff tmp/ai-eval-runs/academic-signoff-template.json --require-final
```

When `--require-final` is used, invalid or pending signoff blocks expansion and exits non-zero.

## Acceptance Evidence

Required local verification:

- `pnpm eval:ai:fixture-expansion`
- `pnpm --filter @fuxie/ai-service test -- eval-fixture-expansion`
- `pnpm --filter @fuxie/ai-service test`
- `pnpm check:quick`
- `git diff --check`

## Residual Risk

| Risk | Status | Mitigation |
| --- | --- | --- |
| Draft signoff produces no useful proposals | Accepted | `--require-final` blocks until Academic Lead completes signoff |
| Follow-up actions may be too broad | Controlled | Proposal report keeps owner and dimension focus explicit |
| Fixture proposal may be mistaken for a baseline edit | Controlled | `fixtureEffect: proposal_only` and docs state no `baseline.json` mutation |

## Next Planned Step

The next implementation cycle should be **AI Eval Controlled Fixture Patch Slice**:

1. Take approved fixture expansion proposals.
2. Patch `scripts/fixtures/ai-eval-harness/baseline.json` in a small, reviewable commit.
3. Run offline eval, academic review pack, and signoff validation again.
