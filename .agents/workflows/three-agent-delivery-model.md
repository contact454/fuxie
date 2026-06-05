---
description: Execution model for Fuxie — Claude plans/manages/QCs and writes specs; Antigravity writes code; Codex renders assets. Reuse-first.
---

# Fuxie Three-Agent Delivery Model

Effective 2026-06-03. This is a binding working rule, layered on top of the
role gate in `AGENTS.md` and `company-operating-model.md`. It defines WHO does
WHAT across the three agents that build Fuxie.

## Agents and responsibilities

| Agent | Tooling (as configured by owner) | Owns | Must NOT do |
| --- | --- | --- | --- |
| **Claude** (this agent) | Claude Code | Planning, project management, QC, and authoring Requirements / Tech Design / Task List / handoff prompts. Reviews returned work against acceptance criteria. | Does **not** write or edit production/runtime code or assets. Plans and inspects only. |
| **Antigravity** | Gemini ("3.5 Flash") | Primary code execution: implements the Tech Design + Task List exactly, runs gates (`pnpm check:quick`, `pnpm test:core`, `pnpm build`), reports results. | Does **not** invent product, UX, or content decisions; if a spec is ambiguous, it asks Claude rather than guessing. |
| **Codex** | GPT Image 2.0 (image/asset skill) | Renders images and assets **only when an asset is missing** from the registry, per a Claude-written asset brief. Optimizes + exports to `public/`. | Does **not** render assets that already exist; does **not** change runtime logic. |

> Tooling names recorded as stated by the owner. Note: the existing in-repo
> image pipeline (`scripts/gen-all-vocab-images.ts`, `apps/web/lib/ai/image-models.ts`,
> `.agents/workflows/generate-images.md`) uses Gemini image models — keep it as
> the reference pipeline if Codex needs to integrate with repo scripts.

## The delivery loop

```
Claude: Plan ──► Claude: Spec package ──► Handoff prompt(s)
                                            │
                         ┌──────────────────┴───────────────────┐
                         ▼                                       ▼
              Antigravity: implement code            Codex: render assets (only if missing)
                         │                                       │
                         └──────────────────┬────────────────────┘
                                            ▼
                                   Claude: QC vs acceptance
                                            │
                              pass ─────────┴───────── fail → back to spec/handoff
                                            ▼
                                      Integrate / next slice
```

Claude stays in the loop between every step: nothing ships without a Claude QC
pass against the written acceptance criteria.

## Spec package contract (what Claude writes per slice)

Every implementation slice gets ONE handoff doc under `docs/delivery/` with these
sections, in this order:

1. **Context & Goal** — one paragraph: the user-visible problem and the win.
2. **Requirements** — numbered, testable `R-n` statements (functional + non-functional). Use "SHALL".
3. **Tech Design** — exact files (`path:line`), data shapes already available, the change per file, and reuse targets (existing components/registry keys). Call out what NOT to touch.
4. **Asset plan** — list registry keys/paths to reuse. If an asset is missing, write a Codex brief; otherwise state "no new assets".
5. **Task List** — ordered `T-n` checklist Antigravity executes, each ≤ ~1 file or 1 concern, each mapped to the `R-n` it satisfies.
6. **Acceptance criteria / QC checklist** — how Claude will verify (gates to run, states to check, screenshots/URLs). Binary pass/fail.
7. **Antigravity prompt** — a ready-to-paste work order (see contract below).
8. **Codex prompt** — only if Asset plan found a gap; else "none".

## Handoff prompt contract

Per `company-operating-model.md`, every prompt handed to Antigravity or Codex must state:
**role · objective · repo context · exact files/commands to inspect · acceptance criteria · expected report format.** Keep prompts copy-paste runnable, with absolute repo context and no hidden assumptions.

## Asset reuse-first rule

Before any new render, check the registry — most needs are already covered:

- Mascot poses / world props / UI frames: `apps/web/src/lib/mascot/fuxie-assets.ts` (+ `fuxie-global-assets`). Files under `apps/web/public/mascot-3d/`.
- Reward items (Fucoin, XP star, CEFR badges, streak-freeze, hint-ticket, unlock-key, postcard, inventory prop): `apps/web/src/components/gamification/reward-assets.ts`. Files under `apps/web/public/reward-assets/optimized/`.
- Surface→asset maps & contact sheets: `docs/design/asset-generation/`, `docs/design/asset-reuse-map.md`.

Codex renders a new asset ONLY when Claude's Asset plan confirms no registry key
fits. New assets follow the style guide in `docs/design/fuxie-german-village-concept.md`
and the chroma-key → transparent-WebP export rule, then get a registry key.

## QC checklist Claude runs on returned work

- Acceptance criteria met, item by item (binary).
- Gates green: `pnpm check:quick`, `pnpm test:core`, and `pnpm build` where relevant.
- No fake/placeholder UI shipped (no dead buttons, no simulated data presented as real).
- Errors are learner-facing where the spec requires it (no silent `console.error`).
- Only the files named in the Tech Design changed (no scope creep); diff reviewed.
- Reused existing assets/components; new renders only where the Asset plan allowed.

## File locations

- Handoff packages (work orders for Antigravity/Codex): `docs/delivery/`.
- Planning / audits / PRDs / UX specs: `docs/intake/` (phase-numbered).
- Asset inventory & reuse map: `docs/design/asset-reuse-map.md`.
- These working rules: this file, referenced from `company-operating-model.md`.
