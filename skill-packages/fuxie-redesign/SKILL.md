---
name: fuxie-redesign
description: >
  Orchestrate a UI/UX redesign slice for the Fuxie German-learning app, coordinating
  Claude (design system + specs), Codex (gpt-image-2 asset & mockup rendering), and
  Antigravity (frontend code). Use this skill whenever work touches the Fuxie learner
  UI: redesigning or adding a screen, building a new vocabulary/listening/speaking
  lesson or gameplay flow, generating a batch of village/mascot/reward assets, writing
  Codex image prompts, or writing Antigravity implementation tickets. Trigger even if
  the user just says "let's redo the dashboard", "make the lesson screen", "render the
  world map", "new asset batch", "spec the reward screen", or "next slice" — anything
  that produces Fuxie learner-facing UI or art should go through this skill so the
  output stays on-vision (Learning World, 2.5D isometric, mobile-first) and avoids the
  patchy/AI-slop look. Do NOT use for backend, content authoring (A1–C2 lessons), the
  SRS engine, or the ai-service — those are out of scope and must not be modified.
---

# Fuxie Redesign Orchestrator

This skill captures the agreed workflow for rebuilding Fuxie's learner UI. The goal is to
make every new screen or asset feel like it belongs to one coherent, polished learning
game — not a patchwork. The root cause of the old "chắp vá" (patchy) build was the lack of
a single locked standard to copy from, so this skill's whole job is to enforce that standard.

## The vision (do not drift from this)

- **Learning World, world-first.** The main surface is a German-village world map, not a
  list of cards. The world explains progress, place, reward, and identity.
- **Art style: 2.5D isometric, flat, premium-minimal.** One dimetric angle, one light
  source, disciplined palette, soft shadows. References: Mykonos voxel (world unity),
  Monument Valley (premium minimalism), Duolingo (gameplay/feedback loop).
- **Mobile-first.** Design for the phone as a polished handheld game; desktop expands later.
- **Rebuild the UI layer only.** Keep the core untouched: `packages/database`,
  `packages/srs-engine`, `apps/ai-service`, and all `content/` (A1–C2). You may re-organize
  navigation/IA, but never add new learning features or change lesson content.

If a request would violate any of these, stop and flag it before proceeding.

## Who does what

- **Claude (you):** run alignment, produce the design-system tokens + per-screen specs,
  write the Codex prompts, write the Antigravity tickets, and run acceptance. You own
  "correct & precise" (exact numbers, copy, token names).
- **Codex (gpt-image-2):** renders assets AND full-screen mockups that serve as visual
  reference targets. Codex owns "beautiful & consistent". See `references/style-lock.md`.
- **Antigravity:** writes the frontend code, matching the approved mockups and pulling all
  exact values from tokens/specs. See `references/antigravity-tickets.md`.

## Workflow (run in this order)

### 1. Align before building
If the change is non-trivial or under-specified, grill the user first (one question at a
time, each with a recommended answer) until the slice's scope, screens, and success bar are
clear. Capture the locked decisions in a short list before producing anything.

### 2. Spec the slice
Write, in prose: the IA (what the learner sees and how they move through it), the screen
list, and per-screen layout intent. Pull colors/spacing/type/motion from the design tokens
(semantic "Bright Sky" names already in `apps/web/src/app/globals.css`, plus the 2.5D
additions). Never invent ad-hoc values — that is how the old build fragmented.

### 3. Style-frame first, then scale (image pipeline)
This sequencing is the single most important anti-patchwork rule.
1. Have Codex render ONE style frame (the hero screen, usually the world map).
2. Get the user to approve the style. If not approved, iterate the frame — do NOT render
   the rest yet.
3. Once approved, render the remaining assets/mockups, **using the approved frame as a
   reference image (`-i`)** so they inherit its lighting, palette, and line weight.
4. Every prompt carries the STYLE LOCK prefix verbatim. See `references/style-lock.md`.

### 4. Tickets for Antigravity
Turn the spec into thin vertical-slice tickets (one path end-to-end: token → component →
screen → check). Each ticket names the approved mockup it must match and restates the
core-boundary ban. See `references/antigravity-tickets.md`.

### 5. Acceptance — both gates must pass
Run the A+B checklist in `references/acceptance.md` before anything is considered done, and
before scaling the pattern to other skills/screens. Mockups are an art-direction reference
only; correctness is judged against tokens + spec, never pixel-matched to AI images
(gpt-image renders text/Ui imprecisely).

## Key files in this skill
- `references/style-lock.md` — the STYLE LOCK prefix, per-asset prompt patterns, gpt-image
  flags, and the reference-image consistency trick. Read before writing any Codex prompt.
- `references/antigravity-tickets.md` — ticket template + the core-boundary contract.
- `references/acceptance.md` — the A+B acceptance checklist (objective + intuition gates).
