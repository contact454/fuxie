# Fuxie Mandatory Management + Role Gate

Fuxie operates with one project-management control plane and a mandatory domain-role gate. The control plane coordinates work; domain roles own professional decisions and quality standards.

## Startup Gate

Do not analyze, plan, code, edit files, review code, write learning content, make product decisions, or run implementation commands until the startup gate is complete.

For every task:

1. Read `docs/management/README.md` and use `docs/management/source-registry.json` to locate authoritative sources.
2. Identify the exact repository ref/environment relevant to the task. Do not conflate `master`, PR head, preview and production.
3. Read `.agents/workflows/task-role-router.md`.
4. Classify the task domain.
5. Select exactly one primary role.
6. Select zero to three support roles.
7. Read the primary role profile in `.agents/personnel/`.
8. Read support role profiles when the task crosses product, engineering, content, design, QA, ops, growth, legal, security, finance or data boundaries.
9. Start user-facing work with:
   - `Vai chinh: <role>`
   - `Vai phoi hop: <roles or none>`
10. Execute from the primary role's mission, authority, deliverables and quality checklist.
11. Before implementation, reuse or map the existing `.kiro/specs` / `docs/delivery` source when one already covers the work.
12. Before finalizing, apply the applicable gates in `docs/management/quality-gates.md` plus the primary role's checklist.
13. Read back changed sources/evidence before reporting completion.
14. Close with one concrete next step.

## Management Authority

The Fuxie Project Orchestrator is the day-to-day management function. It owns source discovery, prioritization proposals, task decomposition, specification, routing, evidence collection, QC coordination, status synthesis and next-step recommendations.

The project owner retains final authority for product-direction changes, public launch decisions, legal commitments, billing/major spend, destructive production actions and sensitive-access changes unless a narrower standing policy explicitly delegates them.

The orchestrator does not replace domain ownership. Product, engineering, academic, security, QA, design, data and operations decisions must still route through the correct primary role.

## Capability-Based Delivery

Do not hard-code management semantics to a specific vendor, IDE or model name. Delivery uses capabilities:

- **Orchestrator** — plans, coordinates, specifies, collects evidence and QCs against acceptance.
- **Executor** — implements the bounded code/content/configuration work order.
- **Reviewer / QA** — independently verifies applicable acceptance and gates when independence is required.
- **Asset renderer** — creates new approved assets only when reuse is not possible.

A tool/agent is considered available only after access and its evidence-return path are verified. The compatibility mapping and handoff rules live in `.agents/workflows/three-agent-delivery-model.md`.

## Source and Evidence Rules

- Search results, chat summaries and old checkmarks are discovery/context, not current-state evidence.
- Governance says what is allowed; specs say what should exist; code at an exact ref says what is implemented; tests/evals say what was verified; deployment/provider metadata says what is running.
- `PASS`, `FAIL`, `BLOCKED`, `NOT_RUN`, `ACCEPTED_WITH_RISK` and `NOT_APPLICABLE` must not be collapsed into each other.
- Code in a PR is not released. Merge is not deployment. Machine-clean content is not human/native academic sign-off.
- Important evidence must be tied to ref/environment and revalidated when relevant code, content, prompt/model or environment changes.

## Safety and Change Control

- Use a branch/workspace for non-trivial writes.
- Do not force-push over unrelated work, bypass CI/security gates, disable tests to get green, commit secrets, use real learner data as fixtures or run destructive production operations without the required authority.
- Treat learner personal data/audio and provider credentials as restricted material; do not copy them into public repository docs or broad project context.
- If task scope introduces production, legal, security, data or learning-quality risk outside the selected primary role, rerun the role gate or explicitly add the appropriate support role.

## Enforcement

- If the management/source gate and primary role profile have not been read, the task has not started.
- If the scope changes materially, rerun the gate.
- A task closeout is incomplete without evidence status and the next concrete step.
- Executor self-report alone is not verification.
- A handoff is incomplete unless it states role/capability, objective, repo/ref, exact scope, source/spec references, acceptance criteria, required checks, non-goals and expected evidence/report format.
- Use `.agents/workflows/task-startup-checklist.md` as the short SOP and `.agents/workflows/company-operating-model.md` for the full operating model.