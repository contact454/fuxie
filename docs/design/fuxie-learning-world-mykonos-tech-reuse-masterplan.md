# Fuxie Learning World: Mykonos Tech Reuse Masterplan

Date: 2026-05-17

## Role Gate

Primary role: Product Manager EdTech

Support roles: CTO / Tech Lead, Product Designer, QA Automation Engineer

Operating contract:

- Kiro owns implementation.
- Codex owns product direction, QA control, visual quality gates, and scope discipline.
- Mykonos is a technical reference and reusable MIT source, not the Fuxie art direction.

## Executive Decision

Fuxie should not only "learn from" `boona13/mykonos-island-voxels`. We should reuse the proven parts that are already small, modular, and compatible with Fuxie's current stack:

- Isometric grid math.
- Camera pan and zoom model.
- Pointer, touch, pinch, keyboard input patterns.
- Layered canvas renderer with dirty flags.
- Asset manifest and loader concepts.
- Tile map occupancy index.
- Lightweight local save/load pattern for preview tools.
- WebAudio one-shot sound routing.

Fuxie should not copy the Mykonos theme. The visible world must become a German-learning world: village square, course signpost path, library, radio booth, speaking cafe, writing post office, grammar workshop, market, review garden, exam hall, and reward inventory.

## Why This Fits Fuxie

Fuxie already has the right raw material:

- Asset registry: `apps/web/src/lib/mascot/fuxie-assets.ts`.
- World tag taxonomy: `apps/web/src/lib/mascot/fuxie-world-tags.ts`.
- Dashboard hero: `apps/web/src/components/dashboard/dashboard-backbone-hero.tsx`.
- Course path: `apps/web/src/components/course/CourseClient.tsx`.
- Skill player shell: `apps/web/src/components/gamification/skill-player-shell.tsx`.
- Skill motivation layer: `apps/web/src/components/gamification/skill-motivation-layer.tsx`.
- Quest visuals: `apps/web/src/components/gamification/quest-visuals.tsx`.

The gap is not "more cards". The gap is a reusable world layer that turns these assets into a coherent spatial interface.

## Company-Wide Kickoff

Formal gate roles remain limited to the selected primary and support roles. The following lanes represent the whole-company kickoff for ideation, execution, and review.

| Lane | Owner | Mission |
| --- | --- | --- |
| Product direction | Product Manager EdTech | Keep every world feature tied to learning outcomes and learner clarity. |
| Engineering architecture | CTO / Tech Lead | Decide what is copied, adapted, rewritten in TypeScript, or left as concept. |
| Implementation | Kiro | Build the selected slices in Fuxie. |
| Design direction | Product Designer | Convert Mykonos-level wow into Fuxie's German learning village. |
| Design system | Design System Designer | Turn scene, depth, motion, and HUD rules into reusable tokens and components. |
| QA | QA Automation Engineer + Codex | Browser-use screenshots, mobile checks, asset checks, accessibility and performance gates. |
| Visual QA | Codex | Reject screens that look card-heavy, generic, cluttered, or not recognizably Fuxie. |
| German academics | German Academic Lead | Ensure game language never weakens Goethe/Telc seriousness. |
| Content | Content Strategist | Remove combat/hunting metaphors and keep learner copy supportive. |
| Gamification | Gamification Designer | Connect progress, rewards, streaks, shop, and inventory to the world metaphor. |
| Art/assets | Illustrator / 3D Artist | Produce or curate Fuxie world plates and prop cutouts with one coherent style. |
| Motion | Motion Designer | Define tactile animations and reduced-motion equivalents. |
| Accessibility | Accessibility Specialist | Ensure canvas scenes have semantic alternatives and keyboard-safe controls. |
| Performance | Performance Engineer | Keep canvas/world scenes idle-cheap and mobile-safe. |
| Legal | Legal/Compliance | Preserve MIT notices and prevent theme/IP copying. |

## Mykonos Tech Reuse Matrix

| Mykonos module | Reuse level | Fuxie target | Notes |
| --- | --- | --- | --- |
| `src/grid/IsoGrid.js` | Copy/adapt | `apps/web/src/lib/learning-world/iso-grid.ts` | Small pure math. Convert to TypeScript. Keep tests for `cellToScreen` and `screenToCell`. |
| `src/core/Camera.js` | Copy/adapt | `apps/web/src/lib/learning-world/world-camera.ts` | Pan, zoom, bounds, `screenToWorld`, `worldToScreen`. Add reduced-motion and mobile default zoom rules. |
| `src/grid/TileMap.js` | Adapt | `apps/web/src/lib/learning-world/world-map.ts` | The occupancy index and version counters are valuable. Fuxie should model learning locations, not free building placement in learner UI. |
| `src/building/PlacedObject.js` | Adapt | `apps/web/src/lib/learning-world/world-object.ts` | Keep footprint, sort key, and serialize shape. Rename to `WorldObject`. |
| `src/building/PlacementSystem.js` | Concept for internal tool | Optional admin/world lab route | Useful for a future internal scene builder. Not needed in learner UI v1. |
| `src/assets/assetManifest.js` | Adapt pattern | `apps/web/src/lib/learning-world/world-asset-manifest.ts` | Use Fuxie registry paths, tags, footprints, scale, anchor, shadow policy, unlock state. |
| `src/assets/assetLoader.js` | Copy/adapt carefully | `apps/web/src/lib/learning-world/world-asset-loader.ts` | High-DPI prerender, shadow canvas, contact points. Need Next/public asset compatibility. |
| `src/assets/imageToAsset.js` | Optional | Asset QA tooling | Useful for detecting anchors/silhouettes. Keep out of runtime unless needed. |
| `src/assets/voxelRenderer.js` | Concept only | Placeholder asset generation | Use only for internal placeholders. Fuxie should use designed WebP/PNG assets. |
| `src/core/Renderer.js` | Adapt architecture | `apps/web/src/lib/learning-world/world-renderer.ts` | Rebuild around Fuxie scenes. Keep cache layers, dirty flags, painter sorting, high-DPI scaling. |
| `src/core/InputManager.js` | Adapt selectively | `apps/web/src/lib/learning-world/world-input.ts` | Needed for pan, zoom, hotspot select, keyboard navigation. Avoid builder-only gestures in learner UI. |
| `src/storage/SaveSystem.js` | Adapt for preview only | `apps/web/src/lib/learning-world/world-preview-storage.ts` | LocalStorage can save internal preview state. Learner progress must stay in app data flows. |
| `src/ui/Audio.js` | Adapt | `apps/web/src/lib/learning-world/world-audio.ts` | Sound should be opt-in or respect user preference. Use short feedback sounds only. |
| `styles.css` | Concept only | Fuxie tokens/components | Do not copy the style wholesale. Extract layout lessons only. |
| PNG/audio assets | Avoid for product | Research only | MIT allows reuse, but the Greek island theme is not Fuxie. Do not ship these in learner UI. |

## Product Scope

### V0: Fuxie World Lab

Goal: Let Kiro prove the reused engine layer without touching learner-critical flows first.

Deliverables:

- Internal route or Storybook-style playground for one static Fuxie scene.
- Canvas renders a small isometric Fuxie village from existing registry assets.
- Pan/zoom works on desktop and mobile.
- Hotspots can be selected and mapped to app destinations.
- No learner progress mutation.

Exit gate:

- Desktop and mobile screenshots show a nonblank, crisp world.
- CPU goes quiet when idle.
- No missing image warnings for used assets.
- All hotspots have semantic labels outside the canvas.

### V1: Dashboard and Course Wow Pass

Goal: Make first impression feel like a coherent learning world instead of stacked cards.

Dashboard direction:

- Replace card-heavy first viewport with "Village Mission Board" composition.
- World snapshot supports the next learning action, not decorative noise.
- XP, streak, Fucoin remain compact HUD chips.
- Primary CTA is visible in first viewport on mobile.

Course direction:

- Convert course path into a spatial learning trail.
- Desktop can use isometric/horizontal path.
- Mobile must use vertical checkpoint trail, not clipped horizontal overflow.
- Current node, locked gates, and boss exam must read within 3 seconds.

Exit gate:

- User can identify "where I am", "what to do next", and "what I earn" in 3 seconds.
- No content shifts or text overflow at 390x844.
- Browser screenshots pass Codex visual review.

### V2: Skill Player Redesign

Goal: Use world identity without burying the learning task.

Skill player rules:

- Scene identity becomes a compact header or side rail.
- Exercise content must appear before reward panels.
- Writing prompt and textarea must be first-viewport visible.
- Listening audio control, answer options, and submit must be first-viewport visible.
- Speaking mic state must be central and trustworthy.
- Reading text/question must not be pushed below decorative content.

Exit gate:

- Every skill player passes first-viewport task visibility on mobile.
- Bottom nav and sticky CTA never overlap task controls.
- Copy tone is academic, encouraging, and CEFR-appropriate.

### V3: Shop, Rewards, Inventory

Goal: Make rewards physical and clear.

Direction:

- Shop becomes market/backpack/shelf UI, not pale generic cards.
- Item states are explicit: affordable, unaffordable, owned, equipped, pending, locked.
- Reward reveal becomes a receipt or physical item moment.

Exit gate:

- A learner can explain why an item is or is not claimable in 3 seconds.
- Disabled controls always explain the reason.
- Pending/revert flows are visually distinct and test-covered.

## Proposed Architecture

### Runtime Core

Create a framework-agnostic world core:

```txt
apps/web/src/lib/learning-world/
  iso-grid.ts
  world-camera.ts
  world-map.ts
  world-object.ts
  world-scene.ts
  world-asset-manifest.ts
  world-asset-loader.ts
  world-renderer.ts
  world-input.ts
  world-audio.ts
```

Rules:

- No React imports in core files.
- Core accepts canvas/context, scene data, and callbacks.
- All asset paths come from Fuxie asset registry.
- No learner progress writes from this layer.
- Canvas is decorative/interactive, but semantic navigation and labels must exist in React DOM.

### React Layer

Create thin React wrappers:

```txt
apps/web/src/components/learning-world/
  LearningWorldCanvas.tsx
  LearningWorldHotspotList.tsx
  LearningWorldMiniMap.tsx
  DashboardWorldMissionBoard.tsx
  CourseWorldPath.tsx
  SkillSceneHeader.tsx
```

Rules:

- React owns routing, analytics, i18n, accessibility labels, loading states, and reduced-motion settings.
- Canvas owns only visual composition, pan/zoom, hover/press feedback, and noncritical interaction.

### Scene Model

Recommended scene shape:

```ts
type FuxieWorldScene = {
  id: string
  grid: { width: number; height: number; tileWidth: number; tileHeight: number }
  terrain: Array<{ id: string; gx: number; gy: number; assetKey: string }>
  objects: Array<{
    id: string
    gx: number
    gy: number
    assetKey: string
    footprint: { w: number; d: number }
    scale?: number
    state?: 'available' | 'active' | 'completed' | 'locked'
    href?: string
    ariaLabel?: string
  }>
}
```

## Kiro Implementation Backlog

### Epic 1: Tech Reuse Spike

1. Add MIT third-party notice for Mykonos if code is copied or substantially adapted.
2. Port `IsoGrid` to TypeScript with unit tests.
3. Port `Camera` to TypeScript with zoom bounds and viewport tests.
4. Create `WorldObject` and `WorldMap` from Mykonos object/occupancy model.
5. Build minimal `LearningWorldCanvas` with one static scene.

Definition of done:

- Unit tests cover grid math, camera transforms, occupancy, and sort order.
- Demo renders in browser on desktop and mobile.
- No production learner route depends on the spike until QA passes.

### Epic 2: Fuxie Asset Manifest

1. Build a Fuxie world manifest from existing registry assets.
2. Add footprint, scale, anchor, category, and semantic label metadata.
3. Add asset loader with high-DPI pre-render and fallback handling.
4. Add visual QA list of required first-scene assets.

Definition of done:

- No hardcoded image paths outside the manifest.
- Missing assets fall back visibly in development but do not break render.
- Above-fold assets use correct Next/image or canvas preload strategy.

### Epic 3: Renderer Adaptation

1. Implement layered canvas caches:
   - backdrop cache
   - platform/terrain cache
   - static object cache
   - live overlay
2. Implement dirty-flag rendering.
3. Add painter sorting by isometric depth.
4. Add simple shadow/contact grounding.
5. Add reduced-motion mode that disables nonessential animation.

Definition of done:

- Idle scenes stop redrawing.
- Zoomed scenes remain crisp on retina displays.
- Mobile low-end mode can reduce cache scale without visual breakage.

### Epic 4: Dashboard and Course Integration

1. Replace Dashboard card-heavy hero with `DashboardWorldMissionBoard`.
2. Replace Course horizontal overflow path with responsive `CourseWorldPath`.
3. Keep CTA and task intent visible in the first viewport.
4. Preserve existing analytics flow names.

Definition of done:

- Existing dashboard/course tests pass or are updated to new invariants.
- Browser screenshots pass desktop and mobile review.
- No route regression for `/dashboard` and `/course`.

### Epic 5: Skill Player Integration

1. Replace oversized motivation banner with `SkillSceneHeader`.
2. Move learning task above reward preview across skill players.
3. Add bottom safe-area protection.
4. Fix copy tone issues found in QA.

Definition of done:

- Writing textarea visible in first viewport on 390x844.
- Listening audio/options/submit visible in first viewport on 390x844.
- Sticky CTA cannot cover content or bottom navigation.

### Epic 6: Shop and Rewards

1. Build market/inventory scene treatment.
2. Add clear item-state matrix.
3. Add reward receipt and owned/equipped states.
4. Keep transaction state explicit and trustworthy.

Definition of done:

- Every disabled state explains why.
- Pending/revert cases are test-covered.
- Learner can distinguish owned, equipped, unaffordable, and locked quickly.

## Codex QA Gates

Codex should block progression if any gate fails.

### Visual Gate

- Screenshot every target at desktop and mobile.
- Score first impression, content clarity, CTA clarity, visual cohesion, mobile ergonomics.
- Reject if the screen still reads as generic card UI.
- Reject if the world is decorative but does not clarify progress or action.

### Learning Gate

- Current learning task visible within 3 seconds.
- Academic tone fits German learning and exam preparation.
- No combat, hunting, or pressure-heavy metaphors.
- Feedback and rewards never obscure the exercise.

### Accessibility Gate

- Canvas has semantic alternative controls or hotspot list.
- Keyboard user can reach the same destinations.
- Text contrast passes AA.
- Reduced motion disables nonessential movement.
- Sound is opt-in or preference-aware.

### Performance Gate

- Idle canvas does not keep drawing.
- No heavy per-frame image filters.
- No layout shifts from image loading.
- Mobile viewport does not jank during scroll, pan, or CTA interaction.

### Asset Gate

- No missing image paths.
- No Next image warnings for above-fold assets.
- Every world object has manifest metadata.
- Fuxie assets are coherent in style, scale, and shadow direction.

## Visual Quality Scorecard

Use this before every handoff to Kiro and after every Kiro implementation slice.

| Criterion | Pass standard |
| --- | --- |
| Fuxie identity | Recognizable without reading nav text. |
| Wow factor | First viewport feels like a living learning world. |
| Task priority | Exercise or next action is never visually secondary to decoration. |
| Spatial clarity | World locations explain progress, skill, reward, or route. |
| Mobile fit | No horizontal overflow, overlap, or hidden CTA on 390x844. |
| Cohesion | Palette, shadows, props, mascot, and rewards look from one universe. |
| Responsiveness | Desktop and mobile each feel intentionally composed. |
| Trust | Rewards, shop states, and learning progress are explicit. |

Minimum approval:

- Dashboard/Course: average 4.5/5, no criterion below 4.
- Skill player: average 4.3/5, task priority must be 5.
- Shop/rewards: average 4.3/5, trust must be 5.

## Legal and Attribution

Mykonos is MIT licensed. If Fuxie copies or substantially adapts source code:

- Keep the Mykonos copyright and MIT license notice in a third-party notice.
- Mark adapted files with a short attribution comment.
- Do not copy the Greek island visual theme into Fuxie learner UI.
- Do not ship Mykonos assets unless explicitly approved by product and legal.

Suggested notice:

```txt
Portions of the learning-world canvas architecture are adapted from
boona13/mykonos-island-voxels, Copyright (c) 2026 boona13, MIT License.
```

## Risks and Controls

| Risk | Control |
| --- | --- |
| Canvas becomes decoration | Every world object must map to progress, skill, reward, route, or state. |
| Learning task gets buried | Skill player QA requires first-viewport task visibility. |
| Implementation grows too large | Ship V0 lab, then Dashboard/Course, then skill shell, then shop. |
| Performance regression | Dirty flags and caches are mandatory, not optional. |
| Accessibility regression | Semantic hotspot list ships with every canvas scene. |
| Theme copying | Mykonos Greek assets are research-only. Fuxie uses German learning world assets. |
| Kiro rebuilds too much | Port only small reusable modules first; defer full editor features. |

## Immediate Next Actions

1. Kiro: create the `learning-world` folder and port `IsoGrid` plus tests.
2. Kiro: port `Camera` plus tests.
3. Kiro: create a single static Fuxie world scene using existing registry assets.
4. Codex: run browser-use QA on the V0 lab route at desktop and mobile.
5. Product/Design: approve the Fuxie world vocabulary before broad rollout.
6. Codex: block Dashboard/Course integration until V0 is crisp, idle-cheap, and accessible.

## Reference Material

- Research clone: `tmp/vendor-research/mykonos-island-voxels`
- Mykonos repo: `https://github.com/boona13/mykonos-island-voxels`
- Mykonos demo: `https://mykonos-island-voxels.netlify.app`
- Prior design research: `docs/design/fuxie-frontend-design-style-research.md`
- Browser QA report: `tmp/browser-qa/kiro-learning-ui-2026-05-17/fuxie-learning-ui-browser-qa-report.md`
