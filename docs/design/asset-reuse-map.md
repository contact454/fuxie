# Fuxie Asset Reuse Map

Date: 2026-06-03. Owner: Product Designer (asset governance) + Project Manager.

Purpose: a fast "do we already have this?" lookup so **Antigravity wires existing
assets** and **Codex renders only true gaps**. Reuse-first is a binding rule
(`.agents/workflows/three-agent-delivery-model.md`).

## TL;DR — the library is large and already wired

Codex has already produced a full production asset set, all resolved through a
typed registry with placeholder fallbacks. For most learner/gamification surfaces
the answer is **"already exists, just wire it."** New renders are the exception.

## Where assets live (source of truth)

| Group | Registry (import this) | Files on disk |
| --- | --- | --- |
| Mascot poses (states, module, gamification, 3D, living-3D) | `apps/web/src/lib/mascot/fuxie-assets.ts` → `fuxie-global-assets.ts` | `apps/web/public/mascot-3d/{states,optimized,core,world,ui,live,...}/` |
| World props (village square, mission board, course signpost path, library desk, radio booth console, post office counter, market stall, exam hall, dojo…) | `FUXIE_WORLD_PROPS` in `fuxie-assets.ts` | `apps/web/public/mascot-3d/world/optimized/{v1,v2}/` |
| UI frames (notice board, course checkpoint node, collection card, audio broadcast panel, letter receipt, **result-reveal frame**, **market-shelf frame**, empty-state signpost) | `FUXIE_UI_FRAMES` in `fuxie-assets.ts` | `apps/web/public/mascot-3d/ui/optimized/v1/` |
| Reward items (**Fucoin**, XP star, CEFR badges A1–B2, streak-freeze, hint-ticket, unlock-key, German postcard, inventory/market prop; + village variants) | `apps/web/src/components/gamification/reward-assets.ts` | `apps/web/public/reward-assets/optimized/` |
| Vocab / grammar / reading / theme / exam illustrations | `apps/web/public/images/{vocab,grammar,reading,themes,exams}/` | same |
| Living 3D mascot (GLB + poster + frames) | `FUXIE_LIVING_3D_ASSETS` in `fuxie-assets.ts` | `apps/web/public/mascot-3d/live/` |

Helpers are **total** (unknown key → `PLACEHOLDER_ASSET` + dev warning):
`getFuxieMascotSrc`, `getFuxieModuleMascotSrc`, `getFuxieGameMascotSrc`,
`getFuxieWorldPropSrc`, `getFuxieUiFrameSrc`, `getFuxieLiving3dAsset`.

## Deeper references (don't re-derive these)

- Surface→asset usage map: `docs/design/asset-generation/fuxie-global-village-surface-usage-map.md`
- Production asset map (JSON): `docs/design/asset-generation/fuxie-global-village-production-asset-map.json`
- Public surface map (JSON): `docs/design/asset-generation/fuxie-global-village-public-surface-map.json`
- Contact sheets (batches A–D): `docs/design/asset-generation/*-contact-sheet.png`
- Mockup target board: `docs/design/visual-audit/fuxie-gamefication-mockup-board-v2.png`
- App-state screenshots (current vs target): `docs/design/visual-audit/screenshots/`
- Village/style guide + generation rules: `docs/design/fuxie-german-village-concept.md`

## Reuse coverage for the current backlog slices

| Slice | Assets needed | Status |
| --- | --- | --- |
| Slice A — Session P0 fix | mascot poses (have), village/dojo props (have); real audio is a **data** concern (`vocabData.audioUrl`), not an asset render | **No new assets** |
| Slice B — Dashboard wow-gap | Fucoin coin (`REWARD_ASSETS.fucoin`), XP star, result-reveal frame, mascot reward pose — all present and used elsewhere | **No new assets** |

## When Codex renders (the only triggers)

1. Claude's Asset plan in a `docs/delivery/` spec confirms **no registry key fits**.
2. The brief follows `fuxie-german-village-concept.md` (Bright Sky palette, original IP, clear silhouette at small size).
3. Output: chroma-key `#ff00ff` background → local removal → transparent 512px PNG + runtime WebP under `public/`.
4. A registry key is added so the asset is reachable via a helper (no raw paths in components).

If none of the above is true, Codex does nothing for that slice.
