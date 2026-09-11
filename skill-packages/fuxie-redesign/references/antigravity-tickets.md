# Antigravity ticket reference

Antigravity is the main code agent. It implements the UI layer only. These tickets turn a
spec into work it can pick up without re-deciding design.

## Core-boundary contract (restate in every ticket)
Do NOT modify `packages/database`, `packages/srs-engine`, `apps/ai-service`, or any
`content/` (A1–C2 lessons). The redesign is the presentation + navigation layer only. Reuse
existing learning logic and exercises; do not add new learning features.

## Ticket shape (thin vertical slice)
Each ticket is one end-to-end path: token → component (`packages/ui`) → screen
(`apps/web`) → check. Prefer many thin slices over few thick ones, so each is demoable on
its own.

```
TICKET <id> — <short title>
Matches mockup: <approved mockup filename> (art-direction reference only)
Scope: <which screen/flow>

What to build (end-to-end behavior, not layer-by-layer):
- <behavior 1>
- <behavior 2>

Exact values: pull from design tokens (semantic Bright Sky names in globals.css + the 2.5D
additions). Do NOT pixel-match the mockup or invent values.

Must respect: useReducedMotion, device pixel ratio, touch targets ≥ 44px, reward-amber
containment (var(--fuxie-reward) only inside [data-reward-state=earned|preview|receipt]),
energy ≤5% area, Primary_CTA palette discipline.

Core boundary: do NOT touch database / srs-engine / ai-service / content.

Acceptance:
- [ ] Matches approved mockup's look & feel
- [ ] pnpm check:quick passes (incl. reward-amber containment property test)
- [ ] Mobile + desktop screenshots captured for before/after
Blocked by: <ticket or "none — can start immediately">
```

## Reuse, don't reinvent
Components live in `packages/ui` and should be shared primitives (PrimaryCta, IsoPlate,
ScenePanel, WorldNode, OptionTile, RewardBurst, ProgressRing, AudioButton, mobile TopBar /
BottomNav). If a ticket needs a new visual element, add it as a primitive first, then use it
— this is what stops every screen from re-interpreting the design differently.

## Handoff note
When handing a ticket to Antigravity, include the approved mockup path and the relevant
token names. If using the mattpocock `handoff` / `to-issues` skills, generate the tickets
from the spec and reference the mockup and tokens by path rather than pasting them.
