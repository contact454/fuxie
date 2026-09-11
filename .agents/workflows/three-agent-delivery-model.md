---
description: Capability-based delivery model for Fuxie. Product names are mappings, not governance roles.
---

# Fuxie Capability-Based Delivery Model

Effective bootstrap revision: 2026-09-11.

This file keeps its historical path for compatibility, but Fuxie no longer hard-codes project authority to the names Claude, Antigravity or Codex. Governance uses capabilities so the workflow remains valid when tools, models, IDEs or connectors change.

## 1. Capabilities

| Capability | Owns | Must not do |
| --- | --- | --- |
| **Project Orchestrator** | Source discovery, prioritization proposals, planning, requirements/design/task packages, routing, evidence collection, QC coordination, status synthesis | Must not bypass domain-role authority, fabricate evidence/sign-off, or treat a tool as connected without verification |
| **Implementation Executor** | Bounded code/content/config implementation according to an approved work package; runs required checks available in its workspace | Must not invent product/UX/academic decisions outside the work package; must report ambiguity/blockers instead of guessing |
| **Reviewer / QA** | Verification against acceptance criteria, negative cases, regression, scope/diff review, evidence status | Must not convert skipped/blocked checks into PASS or self-certify independence when the same context/agent cannot provide it |
| **Asset Renderer** | New visual asset production only after an approved asset-gap brief | Must not render duplicates of existing registry assets or modify runtime logic unless separately assigned as executor |

Domain roles from `.agents/personnel/` are orthogonal to these capabilities. Example: a Backend Engineer can be the primary professional role while an Implementation Executor performs the actual edit.

## 2. Current mapping rules

Mappings are operational observations, not permanent authority:

- The current connected Fuxie project manager may act as **Project Orchestrator** when the owner has assigned that function and the management/source gate has been completed.
- Antigravity may act as an **Implementation Executor** only when a verified task interface/workspace is available and returns ref/log/evidence. Historical documentation that names Antigravity does not prove a current connection.
- Claude Code, Codex, or another coding environment may act as an **Implementation Executor** when it has the required repository/workspace access and the task is explicitly routed there.
- Image-generation tooling may act as **Asset Renderer** only after the asset plan confirms no suitable existing asset/registry key.
- A model switching personas is not by itself an independent human/native reviewer. Human/native sign-off remains a separate evidence type when required by the academic release policy.

## 3. Delivery loop

```text
Owner intent / canonical backlog
          |
          v
Project Orchestrator
  - role gate
  - source/ref verification
  - scope + acceptance
  - work package
          |
          +--------------------+
          |                    |
          v                    v
Implementation Executor    Asset Renderer (only if gap)
          |                    |
          +----------+---------+
                     v
              Reviewer / QA
             acceptance + gates
                     |
          fail/block | pass
              +------+- - - - - -> integrate / release gate
              |      
              v
       fix/spec clarification
              |
              +----> Orchestrator
```

No implementation is considered released until the relevant deployment/runtime evidence confirms the intended ref is active.

## 4. Work package contract

Every implementation slice reuses the existing `.kiro/specs` / `docs/delivery` source when possible. When a new bounded package is needed, it contains:

1. **Context & Goal** — user/system problem and expected win.
2. **Requirements** — numbered, testable functional/non-functional statements.
3. **Tech/Content Design** — exact files/surfaces/data shapes, reuse targets, constraints and what must not be touched.
4. **Risk constraints** — security/privacy/data/academic/production conditions applicable to the slice.
5. **Asset plan** — registry keys/paths to reuse; new render brief only when no suitable asset exists.
6. **Task List** — ordered, bounded steps mapped to requirements.
7. **Acceptance / QC** — binary criteria, negative cases and required gates.
8. **Rollback / Recovery** — when runtime/data/config changes can cause operational impact.
9. **Executor work order** — self-contained instructions.
10. **Expected evidence report** — changed files, commit/ref, commands/checks, results, artifacts, blockers and remaining risk.

## 5. Handoff contract

Every executor/render handoff must state:

- capability and primary professional role;
- objective;
- repository + base/head ref or workspace;
- exact files/surfaces/commands to inspect;
- canonical source/spec references;
- in-scope and out-of-scope work;
- acceptance criteria;
- tests/gates to run;
- data/security/academic constraints;
- expected evidence/report format.

An executor is never told simply "fix it" when the task can affect product behavior, learner data, academic correctness or release safety.

## 6. Asset reuse-first rule

Before rendering any new visual:

- inspect `apps/web/src/lib/mascot/fuxie-assets.ts` and related typed registries;
- inspect `apps/web/src/components/gamification/reward-assets.ts` where relevant;
- inspect `docs/design/asset-reuse-map.md` and approved visual source docs;
- reuse existing approved assets/components when they fit.

New assets require a documented gap, an approved brief and a registry/update plan. Asset generation does not authorize runtime-code changes by itself.

## 7. QC contract

Reviewer/QA checks applicable items from `docs/management/quality-gates.md` plus the work package acceptance criteria.

Minimum review questions:

- Did only approved scope change, or is expansion documented?
- Are positive and required negative paths covered?
- Are state-changing APIs owner/role-safe and input-validated?
- Are tests/gates tied to the current tree?
- Are learner-facing error/recovery states real rather than placeholder?
- Were existing assets/components reused?
- Are content/CEFR/audio/AI sign-offs represented accurately?
- Is rollback/recovery known for runtime/data changes?
- Is the claimed status code-fixed, tested, merged, deployed or released — and is evidence appropriate to that exact state?

## 8. Tool readiness states

Use these capability states for tools/agents/services:

- `UNKNOWN` — not assessed.
- `DISCOVERED` — exists in docs/catalog, access not tested.
- `READ_VERIFIED` — target resource can be read.
- `WRITE_VERIFIED` — safe bounded write/read-back completed.
- `EXECUTION_VERIFIED` — can execute bounded work and return logs/ref/evidence.
- `BLOCKED` — required access/config missing.
- `REVOKED/UNAVAILABLE` — intentionally disabled or unavailable.

Do not infer write/deploy/database/provider capability from an installed plugin alone.

## 9. Current management sources

- `docs/management/README.md`
- `docs/management/source-registry.json`
- `docs/management/quality-gates.md`
- `docs/management/baselines/`

These govern orchestration semantics. Existing product, launch, academic, design and technical specs retain authority over their own domains.