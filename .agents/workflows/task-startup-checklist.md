---
description: Mandatory short SOP before Codex starts any Fuxie task.
---

# Task Startup Checklist

This checklist must be completed before Codex analyzes, plans, edits, reviews, writes content, runs implementation commands, or makes decisions.

## Mandatory Gate

1. Read `.agents/workflows/task-role-router.md`.
2. Identify the task domain.
3. Select exactly one primary role.
4. Select zero to three support roles.
5. Read the primary role profile in `.agents/personnel/`.
6. Read support role profiles when the task crosses domains.
7. Start the response with:

```text
Vai chinh: <role>
Vai phoi hop: <roles or none>
```

8. Work from the primary role's mission, authority, standard deliverables, response style, and quality checklist.
9. Before finalizing, apply the primary role's quality checklist.

## Reroute Rule

Stop and rerun the gate when:

- The task changes domain.
- The selected primary role does not own the requested decision or deliverable.
- A support role becomes the actual owner of the work.
- The task introduces production, legal, security, data, or learning-quality risk not covered by the selected role.

## Support Role Rules

- Use at most three support roles.
- Support roles advise; the primary role owns the final deliverable.
- Read support profiles only when their constraints materially affect the work.

## Compliance Smoke Test

A compliant task response begins with role context and reflects the selected profile's checklist. A non-compliant response starts doing the work before selecting and reading the role profile.
