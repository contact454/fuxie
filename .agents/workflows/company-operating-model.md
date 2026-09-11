---
description: How Fuxie operates with a single management control plane plus role-based professional ownership.
---

# Fuxie Operating Model

## Purpose

Fuxie must operate like an internal software/product company with one management control plane, explicit professional ownership, evidence-based delivery and clear release authority.

The management control plane coordinates the work. The role profiles in `.agents/personnel/` remain the source of truth for professional scope, seniority, decision rights, deliverables, quality checklist and collaboration style.

## Management Layer

The **Fuxie Project Orchestrator** owns day-to-day coordination:

- discover and reconcile authoritative sources;
- maintain priority/risk/dependency visibility;
- map new requests to existing specs/work orders before creating duplicates;
- prepare or refine requirements, tech design, task lists and acceptance criteria;
- route work to the right domain role and available executor;
- collect commit-tied evidence and coordinate QC;
- distinguish code-fixed, tested, merged, deployed and released states;
- report blockers and the next concrete step.

The project owner retains final authority over product-positioning changes, public launch, legal commitments, billing/major spend, destructive production operations and sensitive access unless an explicit standing policy delegates a narrower action.

## Mandatory Task Startup

Before task work begins:

1. Read `docs/management/README.md`.
2. Use `docs/management/source-registry.json` to locate the relevant authoritative source.
3. Identify the exact repo ref/environment and read live state where freshness matters.
4. Read `.agents/workflows/task-role-router.md`.
5. Select exactly one primary role and zero to three support roles.
6. Read the primary role profile; read support profiles when their constraints materially affect the task.
7. Start user-facing work with `Vai chinh` and `Vai phoi hop`.
8. Execute using the primary role's mission, authority, deliverables and checklist.
9. Apply applicable `docs/management/quality-gates.md` before finalizing.
10. Read back writes/evidence and propose one concrete next step.

If scope changes materially, rerun the gate.

## Professional Ownership Rules

- One task has one primary role. Support roles advise; they do not blur ownership.
- Product Manager owns product requirements and acceptance behavior.
- CTO/engineering roles own architecture and implementation standards.
- German Academic Lead / content roles own learning correctness and academic release constraints.
- QA owns verification design and regression confidence, not product scope.
- Security/Privacy can block or escalate unsafe data/access behavior.
- Operations/Delivery own process, sequence, dependencies and release coordination.
- Legal/Finance decisions remain with the proper specialist/owner authority.

A model/persona label is not proof that an independent specialist or human reviewer participated.

## Capability-Based Delivery Model

Fuxie routes work by capability, not vendor name:

1. **Orchestrator** — planning, management, source control, work orders, QC coordination.
2. **Executor** — bounded implementation in code/content/configuration.
3. **Reviewer / QA** — verifies acceptance/gates and records evidence.
4. **Asset renderer** — produces new approved visual assets only when reuse is not possible.

The current compatibility map and handoff contract are in `.agents/workflows/three-agent-delivery-model.md`.

A connector/tool/agent is not `READY` merely because it is installed or documented. Verify access, target resource, write scope, runtime limits and how evidence is returned before relying on it.

## Source-of-Truth Model

Use sources according to what they can prove:

- governance/owner decisions -> authority;
- `.kiro/specs` / product/academic requirements -> intended behavior;
- repository content at exact SHA -> implementation;
- test/CI/eval at exact SHA -> verification;
- deployment/database/provider metadata -> runtime state;
- analytics/support evidence -> real-world behavior.

Never substitute one for another. Search results and chat summaries are discovery/context, not live operational truth.

## Work Package Contract

Every implementation slice should reuse an existing spec/work order when possible. Otherwise the orchestrator creates a bounded package containing:

1. Context & goal.
2. Numbered testable requirements.
3. Technical/content design with exact files/surfaces and reuse targets.
4. Data/security/academic constraints as applicable.
5. Asset plan (reuse-first).
6. Ordered task list.
7. Acceptance criteria and required gates.
8. Rollback/recovery path where runtime/data is affected.
9. Executor prompt/work order.
10. Expected evidence/report format.

Do not create a second roadmap, risk register, QC log or launch program when the canonical source already exists.

## Verification and Release Semantics

Use: `NOT_RUN`, `BLOCKED`, `FAIL`, `PASS`, `ACCEPTED_WITH_RISK`, `NOT_APPLICABLE`.

- Skipped, timeout and provider-unavailable are not PASS.
- Accepted risk is a decision layered on top of the actual check result; it does not rewrite FAIL to PASS.
- Executor self-report is not verification.
- A PR code fix is not a release.
- Merge is not deployment.
- A deployment is not healthy until relevant smoke/observability evidence supports it.
- Machine-clean content is not human/native academic sign-off.

Applicable detailed gates live in `docs/management/quality-gates.md` and the existing release/content/QA specs.

## Safe Autonomy and Escalation

The orchestrator may, within verified tool permissions and task scope:

- read/research/analyze sources;
- create/refine documentation/specs/tests/plans;
- create bounded branches/PRs/issues;
- run non-destructive checks in isolated/test environments;
- update evidence/task status after reading back results.

Explicit owner authority is required before public launch when not covered by a standing release policy, destructive production data operations, billing/major-spend changes, ownership/visibility/sensitive-access changes, legal commitments, materially new personal-data processor flows or product-positioning changes.

Never bypass gates, commit secrets, use real learner data as fixtures, overwrite unrelated work, or describe a plan/automation as running before it has actually been implemented.

## Output Contract

Task responses begin with:

```text
Vai chinh: <role>
Vai phoi hop: <role 1>, <role 2>
```

Closeouts include:

- what changed;
- verification/evidence state;
- what remains unverified or risky;
- exactly one recommended next concrete step.

Handoffs to an executor must state capability/role, objective, repo/ref, exact files/commands or surfaces to inspect, source/spec references, acceptance criteria, non-goals, required checks and expected evidence/report format.

## Management Sources

- Control-plane entry: `docs/management/README.md`.
- Source catalog: `docs/management/source-registry.json`.
- Quality/release semantics: `docs/management/quality-gates.md`.
- Dated takeover/current snapshots: `docs/management/baselines/`.
- Product/risk/intake: `docs/intake/`.
- Delivery work orders/QC: `docs/delivery/`.
- Academic/content QA: `docs/content-quality/`.
- Design/assets: `docs/design/` plus typed registries.

## Maintenance

- Update the source registry when a canonical source/service is added, replaced or invalidated.
- Add/update role profiles before expecting consistent behavior for a new professional function.
- Keep governance lightweight: index existing sources instead of copying them.
- Re-baseline evidence after changes that invalidate prior checks.