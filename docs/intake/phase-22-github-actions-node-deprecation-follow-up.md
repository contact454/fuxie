# Phase 22: GitHub Actions Node 20 Deprecation Follow-Up

Date: 2026-05-12

## Role-Gate Compliance

Vai chinh: DevOps / Cloud Engineer
Vai phoi hop: CTO / Tech Lead, QA Automation Engineer

This Phase 22 implementation was started under the mandatory role-gate workflow:

- `task-startup-checklist.md` was read.
- `task-role-router.md` was read.
- The DevOps / Cloud Engineer, CTO / Tech Lead, and QA Automation Engineer profiles were read.
- The task domain is CI/CD maintenance, runner compatibility, and release-gate hygiene.

## Objective

Close `P19-A3`: address the GitHub Actions Node.js 20 deprecation warning observed in PR checks.

## Source Evidence

PR #4 CI run `25721811675` completed successfully but emitted this warning during job cleanup:

```text
Node.js 20 actions are deprecated.
```

The warning listed these actions:

- `actions/checkout@v4`
- `actions/setup-node@v4`
- `pnpm/action-setup@v4`

The warning also stated that GitHub Actions will force JavaScript actions to Node.js 24 by default starting June 2, 2026, and recommended opting in with:

```text
FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true
```

## Decision

Set the workflow-level environment variable `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` in `.github/workflows/ci.yml`.

Rationale:

- This follows the exact migration path surfaced by GitHub Actions.
- It tests current actions against Node.js 24 before the default change.
- It avoids speculative action major-version changes.
- It keeps the existing CI job, Node 22 project runtime, pnpm setup, and gate command unchanged.

## Implementation Notes

Changed file:

- `.github/workflows/ci.yml`

Behavior:

- JavaScript actions in the CI workflow opt into the upcoming Node.js 24 action runtime.
- Project dependency installation and verification still use `actions/setup-node` with `node-version: 22`.
- No application runtime, package, lockfile, schema, content, or deployment config changes are included.

## Acceptance Evidence

| Criterion | Status | Evidence |
| --- | --- | --- |
| Node 20 action deprecation has owner decision | Pass | Workflow opts into Node 24 action runtime |
| CI gate behavior remains the same | Pending PR CI | `pnpm check` command and Node 22 project runtime unchanged |
| No secrets or env values exposed | Pass | Only non-secret GitHub Actions migration flag added |
| No runtime app change | Pass | Change is confined to CI workflow and intake docs |

## Verification Plan

- Open a PR and wait for GitHub Actions `verify`.
- Confirm whether the Node 20 deprecation warning disappears or changes.
- Keep Vercel checks observed but treat GitHub Actions `verify` as the primary gate for this task.

## Next Planned Step: Phase 23 Learner Activation PRD

Phase 23 should begin Track B with `P19-B1`:

1. Route through Product Manager EdTech with Product Designer and Data / Analytics Engineer support.
2. Define the first meaningful study action for Vietnamese self-study German learners.
3. Specify activation metric, non-goals, edge cases, and acceptance criteria.
