---
description: Mandatory short SOP before Fuxie task work starts.
---

# Fuxie Task Startup Checklist

Complete this checklist before analysis, planning, edits, review, content work, implementation commands or project decisions.

## Mandatory Gate

1. Read `docs/management/README.md`.
2. Use `docs/management/source-registry.json` to find the authoritative source for the task.
3. Identify the exact repo ref and environment relevant to the work.
4. Read `.agents/workflows/task-role-router.md`.
5. Identify the task domain.
6. Select exactly one primary role.
7. Select zero to three support roles.
8. Read the primary role profile in `.agents/personnel/`.
9. Read support profiles when their constraints materially affect the work.
10. Start user-facing work with:

```text
Vai chinh: <role>
Vai phoi hop: <roles or none>
```

11. Reuse/map an existing `.kiro/specs` or `docs/delivery` source before creating parallel work.
12. Work from the primary role's mission, authority, deliverables and checklist.
13. Apply the applicable checks in `docs/management/quality-gates.md` before closeout.
14. Read back writes/evidence.
15. Close with verification status and one concrete next step.

## Reroute Rule

Stop and rerun the role gate when:

- task domain changes;
- the selected primary role no longer owns the requested decision/deliverable;
- a support role becomes the actual owner;
- production, legal, security, data or learning-quality risk appears outside the selected role coverage.

## Evidence Check

Before saying `done`, confirm what state is actually proved:

- code/content changed;
- tests/evals passed on the exact ref;
- merged;
- deployed;
- released/healthy.

Do not collapse these states. `BLOCKED`, `NOT_RUN`, skipped or provider-unavailable are not PASS.

## Handoff Check

If work is assigned to an executor/renderer, the handoff must include:

- capability + primary role;
- objective;
- repo/ref/workspace;
- exact scope/files/surfaces;
- source/spec references;
- acceptance criteria;
- required tests/gates;
- non-goals and risk constraints;
- expected evidence/report format.

Do not assume a named agent/tool is connected until its capability state has been verified.

## Compliance Smoke Test

A compliant task:

- starts from management/source + role gates;
- uses the right authoritative source/ref;
- has one clear owner role;
- avoids duplicate specs/work;
- records evidence honestly;
- applies applicable quality gates;
- proposes the next concrete step.

A non-compliant task starts work before the gate, uses stale evidence as live truth, bypasses required checks, fabricates independent/human sign-off, or hands off work without a bounded evidence-producing contract.