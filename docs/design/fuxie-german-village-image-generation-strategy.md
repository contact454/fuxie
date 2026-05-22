# Fuxie German Village Image Generation Strategy

Date: 2026-05-15

## Direction

This is the active image generation strategy for developing Fuxie into a German-learning village. The goal is not to avoid generating images. The goal is to generate the right images in the right order so UI development, game feel, and asset production move together.

The learner UI becomes a connected village through repeatable visual systems:

- location plates for each learning surface,
- frames and panels for UI states,
- mascot poses for learning moments,
- reward objects that feel native to the village,
- high-fidelity UI mockups that guide implementation.

Existing assets are continuity references, not blockers. New generated assets should extend the village language and then be integrated into `FUXIE_WORLD_PROPS`, `FUXIE_MODULE_MASCOTS`, `FUXIE_MASCOT_STATES`, `REWARD_ASSETS`, and shared UI components.

## Source Of Truth

The production queue lives in:

- `docs/design/visual-audit/fuxie-german-village-image-generation-manifest.json`

Current queue: 5 batches, 36 planned generated assets, 22 P0 assets.

Generated runtime status on 2026-05-15:

- Batch A: 8/8 location plates generated and integrated through `FUXIE_WORLD_PROPS`.
- Batch B: 8/8 UI frames generated and mapped through `FUXIE_UI_FRAMES`.
- Batch C: 8/8 mascot learning-moment poses generated as v2-derived runtime assets and mapped through `FUXIE_MASCOT_STATES`.
- Batch D: 6/6 village-native reward objects generated and mapped through `REWARD_ASSETS`.
- Batch E: 6/6 UI mockups generated under `docs/design/visual-audit/mockups/` as implementation references.

Generate the queue report with:

```powershell
& "$env:APPDATA\npm\pnpm.cmd" exec tsx scripts/fuxie-image-generation-plan.ts
```

The report is written to:

- `tmp/fuxie-image-generation-plan.md`
- `tmp/fuxie-image-generation-plan.json`

## Team Split

| Team | Owns | Output |
| --- | --- | --- |
| UI/UX | Screen job, layout slot, CTA hierarchy | Mockup brief and placement rule |
| Design System | Reusable frame anatomy, sizing, states | Component mapping and token guidance |
| Illustrator / 3D | Image prompt, style consistency, asset QA | Generated PNG/WebP source pack |
| Gamification | Reward meaning, unlock logic, progression feel | Reward/state rules and economy-safe copy |

## Production Batches

### Batch A: P0 Village Location Plates

Purpose: make every core learner surface feel like part of one German village without turning the app into a full map.

Generate first:

- Dashboard: Village Square + Mission Board.
- Course: Signpost Path.
- Vocabulary: Collection Book Table.
- Reading: Library Desk.
- Listening: Radio Booth Console.
- Speaking: Speaking Stage + Chat Cafe corner.
- Writing: Post Office Counter.
- Shop: Market Stall + Backpack.

Use these as compact surface anchors, not page backgrounds. They should sit in hero corners, state panels, or reward rails.

### Batch B: UI Frames And Panels

Purpose: give the village layer reusable UI containers.

Generate:

- notice board frame,
- course checkpoint node,
- collection card frame,
- audio broadcast panel,
- letter receipt frame,
- result reveal frame,
- market shelf frame,
- empty-state signpost.

These are the highest-value assets for implementation because they map directly to reusable components.

### Batch C: Mascot State Poses

Purpose: make Fuxie react to learning moments instead of floating as decoration.

Generated:

- quest planner,
- gentle correction,
- listening focus,
- speaking record,
- writing delivery,
- shop approval,
- result celebration,
- calm empty state.

Each pose must read at 64px and 96px.

Production note: the initial native image-generation pass drifted away from Fuxie's mascot identity on some prompts. The accepted Batch C pack therefore uses approved v1 mascot/gamification states as source references and exports v2-derived 512px WebP runtime assets. This keeps the UI development track moving while preserving identity consistency.

### Batch D: Reward Objects

Purpose: make XP, Fucoin, streak freeze, hints, unlocks, and CEFR progress feel like village artifacts.

Generated:

- XP star token,
- Fucoin token,
- Streak Freeze snowglobe,
- CEFR badge node set,
- Hint Ticket coupon,
- Unlock Key signpost charm.

Reward assets must stay visually honest: earned is celebratory, receipt is calm, pending is restrained.

### Batch E: UI Mockups

Purpose: give frontend and product a visual target before code polish.

Generated:

- Dashboard Village Square mockup,
- Course Path mockup,
- Vocabulary Collection Book mockup,
- Skill Player Motivation mockup,
- Market Inventory mockup,
- Result Receipt mockup.

Mockups are not runtime assets. They guide layout and interaction decisions.

## Prompt Contract

Use this shared prompt block for every generated image:

```text
Create an original Fuxie German-learning village asset for an educational game UI. Use a polished 3D clay-like mobile game style with soft matte forms, clean silhouettes, and readable shapes at small sizes. The world should feel like a cozy German-learning village with study tools, signs, books, post, radio, market, badges, and learning rewards. Use Fuxie Bright Sky colors: sky blue #60A8E4, deep blue #3C78A8, teal #2EC4B6, soft sky #F3FBFF, and amber #FFB703 only for reward emphasis. Keep the design original, not based on any existing game IP. Avoid clutter, dark fantasy, beige/brown dominance, leaf motifs, unreadable text, and decorative props that compete with the learning task.
```

## Integration Rules

- Runtime assets use 512px WebP with clean transparent alpha unless a mockup requires a full frame.
- Keep source PNGs or high-res generations under `docs/design/asset-generation/source/`.
- Keep optimized runtime files under `apps/web/public/mascot-3d/...` or `apps/web/public/reward-assets/...`.
- Update asset maps only after exported files pass small-size QA.
- Use assets in UI only when they support CTA, feedback, reward, progression, locked, empty, or error states.

## Development Order

1. Generate Batch A and Batch B for P0 surfaces.
2. Integrate frames into shared components before adding more decorative props.
3. Integrate and QA Batch C mascot poses across player feedback and result states.
4. Integrate and QA Batch D reward objects across reward preview, result reveal, shop, and Dashboard ledger states.
5. Use Batch E mockups to drive the next P0 implementation polish slice for Dashboard, Course, Vocabulary, Skill Player, Market/Inventory, and Result Receipt.

The next development slice should start with Dashboard, Course, Vocabulary, Skill Player, and Shop because those surfaces show the clearest learn -> earn -> progress loop.
