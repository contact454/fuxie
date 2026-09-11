# Fuxie Management Control Plane

Status: bootstrap v0.1 — 2026-09-11

This directory is the management entrypoint for Fuxie. It does not replace product specs, code, QA logs, content sign-off, deployment state, or provider consoles. It tells the project orchestrator where authoritative evidence lives and how to combine it safely.

## 1. Authority model

The project owner retains final authority over product direction, public launch, legal commitments, billing/large spend, destructive production actions, and changes to sensitive access.

The Fuxie Project Orchestrator owns day-to-day coordination: source discovery, prioritization, work decomposition, task routing, specification, evidence collection, QC coordination, status reporting, and the next-step recommendation.

Domain roles in `.agents/personnel/` remain the decision framework for each task. Every task still has exactly one primary role and up to three support roles. The orchestrator is not a substitute for the domain owner.

Executors perform bounded implementation work. Reviewers/QAs verify explicit acceptance criteria. A tool or agent is not considered available until its access and evidence return path have been verified.

## 2. Source-of-truth hierarchy

Use each source only for the question it can prove:

1. Owner-approved governance/rules: what is allowed and who decides.
2. Product/academic/technical specification: what should exist.
3. Code/content at an exact commit: what is implemented in that tree.
4. Tests/CI/evals tied to that commit: what has been verified.
5. Deployment/provider/database metadata: what is actually running and where.
6. Analytics/support evidence: how real usage behaves.

Never convert one layer into another. In particular:

- code in a PR is not "released";
- a merged PR is not "deployed";
- machine-clean content is not "academic sign-off";
- skipped/blocked provider tests are not PASS;
- an old green run is not evidence for a changed tree;
- a role label in an AI workflow is not a human/native expert signature.

## 3. Canonical locations

| Domain | Canonical source |
| --- | --- |
| Startup and routing | `AGENTS.md`, `.agents/workflows/task-role-router.md`, `.agents/workflows/task-startup-checklist.md` |
| Operating model | `.agents/workflows/company-operating-model.md`, `.agents/workflows/three-agent-delivery-model.md` |
| Professional role constraints | `.agents/personnel/` |
| Product/program specs | `.kiro/specs/` |
| Intake, strategy, risk | `docs/intake/` |
| Delivery work orders and QC history | `docs/delivery/` |
| Content quality and sign-off | `docs/content-quality/` |
| Design/asset truth | `docs/design/` plus typed asset registries in code |
| Runtime implementation | `apps/`, `packages/`, `content/`, `scripts/`, `tests/` at an exact ref |
| CI | `.github/workflows/` plus GitHub Actions run/job evidence |
| Management source catalog | `docs/management/source-registry.json` |
| Release/quality rules | `docs/management/quality-gates.md` |
| Dated takeover snapshots | `docs/management/baselines/` |

Do not create a second roadmap, risk register, QC log, asset registry, or launch program when an authoritative one already exists. Link or extend the existing source.

## 4. Task lifecycle

Preferred statuses:

`Backlog -> Ready -> In progress -> In review -> Verified -> Released -> Closed`

Side states: `Blocked`, `Cancelled`.

Each implementation task must identify:

- ID or alias to an existing spec/ticket;
- objective and target user/system effect;
- in-scope and out-of-scope files/surfaces;
- source/spec references;
- dependencies and risks;
- executor and reviewer;
- base/head commit;
- acceptance criteria;
- required tests/gates;
- evidence location;
- rollback/recovery path;
- whether owner approval is required.

## 5. Evidence states

Use only these verification labels:

- `NOT_RUN`: required check has not executed.
- `BLOCKED`: execution could not complete because a dependency/access/provider was unavailable.
- `FAIL`: executed and did not meet acceptance.
- `PASS`: executed against the identified scope/ref and met acceptance.
- `ACCEPTED_WITH_RISK`: a decision accepts a known gap; it does not rewrite FAIL into PASS.
- `NOT_APPLICABLE`: documented reason the check does not apply.

Every important evidence item should carry the commit/tree, environment, command/check name, result, timestamp, and artifact/log reference when available.

## 6. Change and release boundaries

Default safe autonomy:

- read/analyze repository and connected project sources;
- create specifications, QA plans, risk notes, and management documents;
- create bounded development branches/PRs when repository write access is verified;
- run non-destructive checks in isolated/test environments;
- update task/evidence status after reading back the result.

Require explicit owner authority before:

- public production launch/promotion when not already covered by an approved release policy;
- destructive production migration/deletion;
- changing billing, ownership, repository visibility, sensitive access, or secrets;
- materially increasing paid-provider spend beyond an approved limit;
- legal commitments or sending personal data to a new provider;
- changing product positioning or an official assessment rubric.

Never bypass CI/security gates, disable tests to obtain green status, force-push over unrelated work, use real learner data as fixtures, commit secrets, or fabricate human academic review.

## 7. Management domains

The orchestrator tracks twelve domains as one product system:

1. Governance and delivery.
2. Product and learner journey.
3. Software architecture and implementation.
4. QA and regression.
5. Security and privacy.
6. Data, analytics, progress, SRS, caching, timezone semantics.
7. German pedagogy, CEFR, exam validity, localization and content QA.
8. AI tutor/grading/generation, evals, cost and fallback.
9. Speech/audio/STT/TTS/pronunciation pipelines.
10. UX, accessibility, localization and visual/mascot consistency.
11. Deployment, observability, backup/restore and incident recovery.
12. Growth, support and unit economics.

## 8. Current bootstrap sequence

1. Unify governance and source catalog without touching runtime behavior.
2. Verify actual write/read capabilities for GitHub, CI, preview deployment, database and provider environments.
3. Run management-system smoke cases: stale source, conflicting source, missing access, false PASS, duplicate task, sensitive-data handling and code-vs-release confusion.
4. Re-baseline technical/content/security status on the current working ref.
5. Drive one bounded slice end-to-end from requirement to verified evidence.
6. Continue the existing public-launch readiness program; do not create a competing launch plan.

## 9. Dashboard contract

The project owner should be able to see, from one synthesized view:

- current release objective;
- master/relevant PR/deployed commit distinction;
- top three priorities;
- open P0/P1 risks;
- quality gate matrix for the current release candidate;
- academic/content sign-off coverage;
- real AI/provider readiness and cost status;
- learner-facing incidents/errors;
- decisions requiring owner authority.

This page is an index and operating contract, not a copy of every underlying source.