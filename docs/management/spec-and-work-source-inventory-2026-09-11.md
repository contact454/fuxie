# Fuxie Spec + Work-Source Inventory — 2026-09-11

This is a dated inventory. It distinguishes the default-branch baseline from the unmerged PR #21 overlay so management does not silently promote unmerged planning documents to `master` authority.

## 1. Refs inspected

- `master`: `c83760fadf57dae9319ebe8f4c64233602230ff0`
- `master` `.kiro/specs` tree: `7987341da1f90983ea1bdb538b80f2b79b2117c8`
- PR #21 observed head: `bdf7fd10780bd57397b8ac3944e8c9c35a68ed01`
- PR #21 `.kiro/specs` tree: `21f659432c779adf3f9839ad2260013063c17afd`

## 2. Default-branch spec inventory

`master` contains 9 top-level Kiro spec directories:

1. `asset-registry-cleanup`
2. `fuxie-learning-world-lab-v0`
3. `fuxie-learning-world-lab-v1-zone-clarity`
4. `fuxie-ui-ux-audit-fix`
5. `fuxie-ui-ux-p0-remediation`
6. `fuxie-visual-mocktest-pack`
7. `gamified-ui-asset-rollout`
8. `learner-copy-localization-backfill`
9. `visual-qa-screenshot-capture`

Presence does not mean active/open. Read each `tasks.md`/evidence before reactivating work.

## 3. PR #21 overlay

PR #21 retains the 9 baseline spec directories and adds 16 top-level spec workstreams:

1. `content-c2-placeholder-regeneration`
2. `content-c2-teil2-regeneration`
3. `content-c2-teil3-regeneration`
4. `content-cefr-stem-regeneration`
5. `content-genus-enum-fix`
6. `content-listening-regeneration`
7. `content-program-quality`
8. `content-read-normalize-shim`
9. `content-schema-naming-unify`
10. `content-vocabulary-audit`
11. `content-writing-audit`
12. `fuxie-content-quality-audit`
13. `fuxie-content-review-board`
14. `fuxie-public-launch-readiness`
15. `reading-explanation-regeneration`
16. `vocab-wordtype-enum-reconcile`

Therefore the observed PR #21 tree has 25 top-level spec directories in total.

## 4. Authority implications

### Master authority

The 9 specs present on `master` can be treated as default-branch repository sources, subject to task/evidence freshness.

### PR #21 candidate overlay

The 16 additions are **not default-branch sources yet**. When management needs them before merge, the source must be named with its exact PR/ref, for example:

`PR #21 @ bdf7fd10780bd57397b8ac3944e8c9c35a68ed01 : .kiro/specs/fuxie-public-launch-readiness/tasks.md`

Do not write a governance rule on `master` that assumes these paths already exist there.

### Public-launch program

The observed `fuxie-public-launch-readiness/tasks.md` defines R/M milestone work and is useful as the current candidate launch program, but it exists only in the PR #21 overlay at this baseline. It also contains historical tool-name handoff wording (`Claude`, `Antigravity`). Under the management control plane, those names are interpreted as capability mappings only; they do not override `AGENTS.md` or the capability-based delivery model after PR #22 is integrated.

If PR #21 is superseded, split or closed, the launch program must be deliberately promoted/rebased or replaced through an explicit decision. It must not disappear silently.

## 5. Content-workstream status caveat

The PR #21 content status document reports substantial automated remediation/QA completion, but also reports incomplete academic/native/audio sign-off. Therefore:

- do not reactivate a content regeneration spec solely because its directory exists;
- do not declare a content workstream released solely because machine gates are green;
- read its task/evidence status plus the content sign-off manifest before selecting new work.

## 6. Work-source policy selected for bootstrap

Fuxie will not create a second standalone project board during takeover.

Until a better native board is verified and provides clear additional value, use:

1. **GitHub Issues** — live unit of work for cross-cutting active tasks, blockers and ownership/status.
2. **`.kiro/specs` at an exact ref** — requirements/design/task source for substantial product/technical/content programs.
3. **`docs/delivery/`** — bounded executor work orders and QC/evidence history where already established.
4. **Pull Requests** — proposed repository change, review discussion and commit-tied CI evidence.
5. **`docs/intake/risk-register.md`** — risk source, not a task board.
6. **`docs/management/`** — source index/evidence semantics only, not a replacement backlog.

Bootstrap tracker: GitHub Issue #23.

This policy prevents duplicate task state from being maintained simultaneously in a new board, a Kiro task list and a management spreadsheet.

## 7. Duplicate/obsolete detection rules

Before opening work:

- search open GitHub Issues/PRs;
- search matching `.kiro/specs` names and requirements;
- search `docs/delivery` for an existing slice/work order;
- inspect relevant risk IDs;
- map the request to an existing source when possible;
- if a source is historical/obsolete, mark that explicitly rather than silently creating a near-duplicate.

## 8. Immediate rebaseline targets

The next inventory should focus on the workstreams that can gate safe release rather than every historical spec equally:

- release/env/DB/CI readiness;
- authentication/authorization and learner-data integrity;
- critical learning loop + UI P0;
- AI provider-backed eval/fallback/cost;
- speech/audio browser/provider readiness;
- academic/content sign-off and audio parity;
- analytics/cache integrity;
- legal/privacy/security pack;
- deployment/observability/rollback.

Those targets should be mapped to the candidate public-launch program at its exact PR #21 ref until that program is integrated into the default branch.