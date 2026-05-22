# Implementation Plan: Fuxie Learning World Lab V0

> Vai chinh: Project Manager / Delivery Manager
> Vai phoi hop: CTO / Tech Lead, QA Automation Engineer
>
> Source of truth: `requirements.md` (Requirements 1–16) and `design.md` in this folder.
> Implementation language: **TypeScript** (matches existing `apps/web` workspace; design specifies TS throughout).

## Overview

Convert the V0 design into a series of incremental coding prompts. Each task builds on the previous ones and ends with wiring things together; there is no orphaned code. The slice is strictly additive: only new files under `apps/web/src/lib/learning-world/`, `apps/web/src/components/learning-world/`, `apps/web/src/app/fuxie-world-lab/`, the matching `__tests__/` directories, and `apps/web/THIRD_PARTY_NOTICES.md` are touched. No new CI job, no new `scripts/` entry, no new `package.json` script is introduced.

Module and unit tests live under the web workspace and run via `pnpm --filter @fuxie/web test`, which is included in `pnpm test:core`. Root-level property tests, if any are added under `vitest.property.config.ts`, run via `pnpm test:property`, which is included in `pnpm check:quick`. V0 introduces no new package scripts, no new CI jobs, and no new `package.json` entries. All property tests use `fast-check` (already a root devDependency) with at least 100 iterations per property.

## Tasks

- [x] 1. Set up Learning_World_Core scaffolding and shared error type
  - [x] 1.1 Create core scaffolding (`errors.ts`, `world-canvas-context.ts`, `index.ts`)
    - Create directory `apps/web/src/lib/learning-world/`
    - Create `errors.ts` exporting `LearningWorldError` class and `LearningWorldErrorCode` union (codes: `INVALID_GRID_CONFIG`, `INVALID_GRID_INPUT`, `INVALID_CAMERA_CONFIG`, `INVALID_CAMERA_INPUT`, `INVALID_CONTEXT`, `INVALID_OBJECT`, `OUT_OF_BOUNDS`, `OCCUPANCY_COLLISION`, `OBJECT_NOT_REGISTERED`)
    - Create `world-canvas-context.ts` exporting `WorldCanvasContext` interface (exactly 8 methods: `clearRect`, `fillRect`, `drawImage`, `save`, `restore`, `translate`, `scale`, `setTransform`), `WorldImageSource` interface (`width`, `height`, opaque `__brand`), and `isWorldCanvasContext(value): value is WorldCanvasContext` predicate
    - Create empty barrel `index.ts` re-exporting the types/values added so far
    - No imports from `react`, `react-dom`, `next`, `next/`, `@fuxie/ui`; no top-level reference to `window`, `document`, `HTMLCanvasElement`, `HTMLElement`, `navigator`, `localStorage`, `sessionStorage`, `requestAnimationFrame`
    - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.6, 3.7, 3.9_

- [x] 2. Implement Iso_Grid module
  - [x] 2.1 Implement `iso-grid.ts`
    - Add MIT attribution header in the first 10 lines naming `Mykonos IsoGrid` and stating "MIT License, see THIRD_PARTY_NOTICES"
    - Export `IsoGridConfig`, `ScreenPoint`, `CellPoint` interfaces
    - Export `IsoGrid` class with readonly `tileWidth`, `tileHeight`, `cols`, `rows`; constructor throws `LearningWorldError('INVALID_GRID_CONFIG', ...)` for non-integer or out-of-range tile sizes ([1, 1024]) or `cols`/`rows` < 1
    - Implement pure `cellToScreen(gx, gy)` and `screenToCell(sx, sy)` that throw `LearningWorldError('INVALID_GRID_INPUT', ...)` on `NaN` / `±Infinity` / non-numeric
    - Implement `inBounds(gx, gy)` returning `true` iff both are integers in `[0, cols) × [0, rows)`
    - Add `IsoGrid` and types to the barrel `index.ts`
    - _Requirements: 6.2, 10.1, 10.2, 10.4, 10.5, 10.6_

  - [x] 2.2 Write property tests for Iso_Grid
    - File: `apps/web/src/lib/learning-world/__tests__/iso-grid.test.ts`
    - **Property 1: Iso_Grid round-trip and validation**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7**
    - Use `fast-check` ≥100 iterations + explicit examples for 4 corners, center, and ≥16 interior cells of an 8×8 grid

- [x] 3. Implement World_Camera module
  - [x] 3.1 Implement `world-camera.ts`
    - Add MIT attribution header naming `Mykonos Camera` (first 10 lines)
    - Export `CameraConfig`, `WorldPoint`, `ScreenPoint` types
    - Export `WorldCamera` class with readonly `minZoom`, `maxZoom`; constructor throws `LearningWorldError('INVALID_CAMERA_CONFIG', ...)` when `minZoom <= 0`, `maxZoom < minZoom`, or any bound is non-finite
    - Implement `getZoom`, `getPan`, `setPan`
    - Implement `setZoom(z)` that clamps numeric input into `[minZoom, maxZoom]` and silently leaves state unchanged for `NaN` / `±Infinity` / `null` / `undefined` / non-numeric, while invoking an injected `onError?: (e: LearningWorldError) => void` callback with `INVALID_CAMERA_INPUT`
    - Implement pure `screenToWorld(sx, sy)` and `worldToScreen(wx, wy)` accepting finite numerics in `[-1e6, 1e6]` and round-tripping within `1e-6`; never mutate camera state
    - Add to the barrel
    - _Requirements: 6.2, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8_

  - [x] 3.2 Write property tests for World_Camera
    - File: `apps/web/src/lib/learning-world/__tests__/world-camera.test.ts`
    - **Property 2: World_Camera transform invertibility** — Validates: Requirements 11.1, 11.2
    - **Property 3: World_Camera setZoom is clamp-then-identity** — Validates: Requirements 11.3, 11.5, 11.6, 11.7
    - **Property 4: World_Camera rejects invalid construction** — Validates: Requirements 11.4
    - **Property 5: World_Camera invalid setZoom leaves state unchanged** — Validates: Requirements 11.8
    - Use `fast-check` ≥100 iterations per property

- [x] 4. Implement World_Object module and factory
  - [x] 4.1 Implement `world-object.ts`
    - Add MIT attribution header naming `Mykonos PlacedObject` (first 10 lines)
    - Export `Footprint`, `WorldObject`, `WorldObjectInput` interfaces
    - Export `createWorldObject(input, grid)` factory: accept iff `id` non-empty string, `gx`/`gy` integers, `footprint.w`/`d` integers in `[1, 64]`, `assetKey` length 1..128, `ariaLabel` (if present) length 1..200, and both `(gx, gy)` and the footprint corner `(gx + w - 1, gy + d - 1)` satisfy `grid.inBounds(...)`; throw `INVALID_OBJECT` for field-shape failures and `OUT_OF_BOUNDS` for grid-bounds failures; produce no partial output on rejection
    - Export `sortKey(o)` returning `(o.gx + o.footprint.w - 1) + (o.gy + o.footprint.d - 1)`
    - Export `isInteractive(o)` returning `o.href !== undefined || o.ariaLabel !== undefined`
    - Add to the barrel
    - _Requirements: 6.2, 12.1, 12.10_

  - [x] 4.2 Write property tests for World_Object
    - File: `apps/web/src/lib/learning-world/__tests__/world-object.test.ts`
    - **Property 9: createWorldObject field validation and grid-bounds rejection** — Validates: Requirements 12.1
    - **Property 10: World_Object sortKey orders back-to-front** — Validates: Requirements 12.10
    - Use `fast-check` ≥100 iterations per property

- [x] 5. Implement World_Map occupancy module
  - [x] 5.1 Implement `world-map.ts`
    - Add MIT attribution header naming `Mykonos TileMap` (first 10 lines)
    - Export `WorldMapConfig` and `WorldMap` class with internal `cells: Map<string, WorldObject>` keyed by `${gx},${gy}`, `members: Set<WorldObject>`, `insertionOrder: WorldObject[]`, monotonic `version: number` starting at 0
    - Implement `getVersion()`, `objectAt(gx, gy)` (throws `INVALID_GRID_INPUT` for non-integer / non-numeric / NaN / Infinity, throws `OUT_OF_BOUNDS` for in-type but out-of-grid coordinates, returns object or `null` within 10ms), `isFreeFor(object, gx, gy)`
    - Implement `add(object)`: validate footprint fits inside the grid via `IsoGrid.inBounds` for the back corner; throw `OUT_OF_BOUNDS` for footprint extending beyond the grid; throw `OCCUPANCY_COLLISION` if any footprint cell is occupied by a different object; on success mark every footprint cell, update `members`/`insertionOrder`, and increment `version` by exactly 1; on rejection leave cells, members, and version unchanged
    - Implement `remove(object)`: throw `OBJECT_NOT_REGISTERED` if not in `members`; clear only cells whose value `===` the removed object; remove from `members`/`insertionOrder`; increment `version` by exactly 1
    - Implement `objects()` returning a readonly snapshot in insertion order
    - Add to the barrel
    - _Requirements: 6.2, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9_

  - [x] 5.2 Write property tests for World_Map
    - File: `apps/web/src/lib/learning-world/__tests__/world-map.test.ts`
    - **Property 6: World_Map model-based occupancy** — Validates: Requirements 12.2, 12.4, 12.5, 12.7, 12.9
    - **Property 7: World_Map failure atomicity** — Validates: Requirements 12.6, 12.8
    - **Property 8: World_Map rejects invalid `objectAt` input** — Validates: Requirements 12.3
    - Use `fast-check` ≥100 iterations per property; brute-force 2D-array model oracle for Property 6

- [x] 6. Implement World_Scene type
  - [x] 6.1 Implement `world-scene.ts`
    - Create `world-scene.ts` exporting `TerrainEntry` and `WorldScene` interfaces (grid metadata, optional camera, terrain entries, objects, `canvasAriaLabel` 1..200 chars, optional `canvasAriaLabelledBy`)
    - This file is original Fuxie code (no Mykonos lift) and carries no Mykonos header
    - Every type in the transitive closure of `WorldScene` is plain TypeScript with zero React, Next, or DOM-only identifiers
    - Add to the barrel
    - _Requirements: 3.1, 3.8, 3.9_

- [x] 7. Implement core paint orchestration
  - [x] 7.1 Implement `render.ts`
    - Export `Viewport`, `RenderInputs` interfaces and `paint(ctx, inputs)` function
    - Validate `ctx` via `isWorldCanvasContext`; throw `LearningWorldError('INVALID_CONTEXT', ...)` on null/undefined/non-conformant; on rejection do not call any method on `ctx` and do not mutate any input
    - On success: `setTransform` to map CSS pixels to backing-store pixels using `viewport.devicePixelRatio` (already clamped); `clearRect` for the entire viewport; paint background using `fillRect` (and optional isometric diamond outlines via `setTransform`/`translate`/`scale`/`fillRect` only); paint `map.objects()` sorted ascending by `sortKey` via `drawImage` per object using `images.get(assetKey)`; skip objects whose `assetKey` is missing from `images`
    - V0 ships zero terrain entries; do not call `drawImage` for terrain
    - Add to the barrel
    - _Requirements: 1.4, 3.5, 3.7, 9.1, 12.10_

  - [x] 7.2 Write property test for paint context validation
    - File: `apps/web/src/lib/learning-world/__tests__/render.test.ts`
    - **Property 11: paint() rejects non-conformant WorldCanvasContext**
    - **Validates: Requirements 3.7**
    - Use a `Proxy`-wrapped 8-method mock; iterate over each missing-method variant plus `null` / `undefined`; assert zero method invocations recorded and `WorldMap.getVersion()` unchanged
    - Use `fast-check` ≥100 iterations

- [x] 8. Add forbidden-import and DOM-leak static scan tests
  - [x] 8.1 Write static import / token scan
    - File: `apps/web/src/lib/learning-world/__tests__/forbidden-imports.test.ts`
    - Parse every `.ts`/`.tsx` under `apps/web/src/lib/learning-world/`; assert no `import` line begins with `react`, `react-dom`, `next`, `next/`, `@fuxie/ui`
    - Assert no source contains the literal tokens `CanvasRenderingContext2D`, `HTMLCanvasElement`, `HTMLElement`, `Window`, `Document`, `Navigator`, `setInterval`
    - Assert no source contains an unconditional top-level `requestAnimationFrame(` call (matched by syntactic context, not just text)
    - Runs via existing `pnpm --filter @fuxie/web test`; no new CI job, no new script
    - _Requirements: 3.2, 3.3, 3.4, 3.6, 3.9, 8.4_

  - [x] 8.2 Write `WorldCanvasContext` predicate test
    - File: `apps/web/src/lib/learning-world/__tests__/world-canvas-context.test.ts`
    - Assert `isWorldCanvasContext` returns `true` for a fully-populated 8-method mock and `false` for each variant missing exactly one method, plus `null`/`undefined`/non-object inputs
    - _Requirements: 3.5, 3.7_

- [x] 9. Checkpoint - Core complete and pure
  - Ensure all tests pass, ask the user if questions arise.
  - Continue only when all required tests in previous waves pass.
  - Do not proceed if any verification task in a prior wave was skipped.
  - If a verification task could not be implemented due to a missing repository testing pattern, the exception must be explicitly justified by the cited requirement (for example, Requirement 13.4).

- [x] 10. Build the React canvas wrapper and hooks
  - [x] 10.1 Implement reduced-motion hook with pure helper
    - Create `apps/web/src/components/learning-world/useReducedMotion.ts`
    - Export pure helper `resolveReducedMotionPreference(reader)` returning `'reduce'` when reader throws / returns `undefined` / `null` / `{ matches: !== false }`, and `'no-preference'` only when reader returns `{ matches: false }`
    - Export `useReducedMotion()` hook subscribing to `matchMedia('(prefers-reduced-motion: reduce)')` change events; defaults to `'reduce'` if `matchMedia` is unavailable or throws
    - _Requirements: 5.1, 5.2, 5.3, 5.6_

  - [x] 10.2 Write property test for reduced-motion helper
    - File: `apps/web/src/components/learning-world/__tests__/useReducedMotion.test.ts`
    - **Property 12: Reduced-motion read defaults to `'reduce'`**
    - **Validates: Requirements 5.6**
    - Use `fast-check` ≥100 iterations against the pure helper (no DOM)

  - [x] 10.3 Implement device-pixel-ratio hook with pure sizing helper
    - Create `apps/web/src/components/learning-world/useDevicePixelRatio.ts`
    - Export pure helper `computeBackingStoreSize(cssWidth, cssHeight, dpr)` returning `{ width: max(1, floor(cssWidth × min(toFiniteOrOne(dpr), 3))), height: max(1, floor(cssHeight × min(toFiniteOrOne(dpr), 3))) }` where `toFiniteOrOne(x) = Number.isFinite(x) && x > 0 ? x : 1`
    - Export `useDevicePixelRatio()` returning `min(window.devicePixelRatio || 1, 3)` and reacting to monitor migration via `matchMedia('(resolution: ...)')`
    - _Requirements: 9.1, 9.5_

  - [x] 10.4 Write property test for backing-store sizing
    - File: `apps/web/src/components/learning-world/__tests__/useDevicePixelRatio.test.ts`
    - **Property 16: Backing-store sizing**
    - **Validates: Requirements 9.1**
    - Use `fast-check` ≥100 iterations including `dpr` in `[0, 10]`, `NaN`, `undefined`

  - [x] 10.5 Implement resize-observer hook with debounce
    - Create `apps/web/src/components/learning-world/useResizeObserver.ts`
    - 100ms-debounced size emission; falls back to `window.addEventListener('resize', ...)` debouncer when `ResizeObserver` is unavailable
    - Expose pure helper `debounceCoalesceCount(events, windowMs)` (or equivalent) used by Property 17
    - _Requirements: 9.4_

  - [x] 10.6 Write property test for resize debounce
    - File: `apps/web/src/components/learning-world/__tests__/useResizeObserver.test.ts`
    - **Property 17: Resize debounce coalesces to one re-render**
    - **Validates: Requirements 9.4**
    - Use `fast-check` ≥100 iterations with synthetic timers (`vi.useFakeTimers()`)

  - [x] 10.7 Implement canvas-render-tap test hook
    - Create `apps/web/src/components/learning-world/canvas-render-tap.ts`
    - Export `wrapContextWithTrace(ctx, onCall)` that returns a structurally compatible `WorldCanvasContext` recording every method invocation as a `ContextCallTrace` for idle / coalescing tests
    - _Requirements: 8.5_

  - [x] 10.8 Implement `HotspotList` component
    - Create `apps/web/src/components/learning-world/HotspotList.tsx`
    - Export pure helper `buildHotspotItems(scene)` that returns an array (one per `isInteractive` object, in declaration order) with `accessibleName = ariaLabel ?? id ?? assetKey` (never empty) and `href = o.href` (preserved as `undefined` when absent)
    - Render `<ul>` with one `<li><a href>` (or `<li><button>` when `href` absent) per interactive `WorldObject`
    - When `canvasUnavailable` prop is true, render a `role="status"` line above the list announcing "Canvas unavailable; destinations remain reachable" but keep the list operational
    - Both `<a>` and `<button>` items activate via Enter and Space (native behavior)
    - _Requirements: 4.1, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [x] 10.9 Write property test for `buildHotspotItems`
    - File: `apps/web/src/components/learning-world/__tests__/HotspotList.test.ts`
    - **Property 18: Hotspot list pure-helper invariants**
    - **Validates: Requirements 4.1, 4.3, 4.4, 4.6**
    - Use `fast-check` ≥100 iterations against the pure helper (no DOM)

  - [x] 10.10 Implement `LearningWorldCanvas` component
    - Create `apps/web/src/components/learning-world/LearningWorldCanvas.tsx` (Client Component shell that is server-renderable for the `<canvas>` + `<HotspotList>` outer wrapper)
    - Render exactly one `<canvas aria-label={scene.canvasAriaLabel}>` element and exactly one `<HotspotList scene={scene} canvasUnavailable={...}>` child; the page must not render an additional `<HotspotList>`
    - On hydration: read `useReducedMotion`, `useDevicePixelRatio`, acquire 2D context (if `null`, set `canvasUnavailable=true` within 2s and rely on `HotspotList` fallback), optionally wrap the context with `wrapContextWithTrace` when `onContextCall` prop is provided, build `IsoGrid`/`WorldCamera`/`WorldMap`, hydrate map from `scene.objects` via `createWorldObject` when needed, load images per `assetKey` independently and populate a `failedAssetKeys` set on per-asset `onerror`, then call `paint` once
    - On first successful paint, set `data-fuxie-lab-ready="true"` on the `<canvas>` for Codex polling
    - Render a non-blocking `<div role="status">` near the canvas that names every key in `failedAssetKeys`; never abort scene mount
    - Implement `requestPaint()` using a single `rafIdRef` to coalesce overlapping triggers within one frame
    - Trigger `requestPaint` only on: pointer down/move-during-drag/up, wheel/button zoom step, keyboard activation of a Hotspot_List item updating in-memory selection, debounced resize, and `prefers-reduced-motion` media-query change
    - No `setInterval`, no unconditional `requestAnimationFrame` loop, no `useSyncExternalStore` subscription to `WorldMap.getVersion()`; on unmount, `cancelAnimationFrame(rafIdRef.current)` and remove all listeners
    - Wrap `paint` in try/catch; on throw, log to console and keep the last successful frame
    - Single-pointer drag for pan; discrete wheel/button increments for zoom; no momentum, no inertia, no pinch-zoom, no two-finger rotate
    - Install dev-only `fetch` shim inside a `useEffect` (gated by `process.env.NODE_ENV !== 'production'`) that captures `originalFetch`, replaces `window.fetch` with a wrapper that `console.warn`s on `POST`/`PUT`/`PATCH`/`DELETE` then delegates without blocking, and restores `window.fetch = originalFetch` in the effect cleanup; the shim does not patch storage APIs
    - No audio API (`AudioContext`, `HTMLAudioElement`, `web-audio-api`) is imported; no scene mutation API is exposed; nothing writes to `localStorage`/`sessionStorage`/cookies/IndexedDB
    - _Requirements: 1.4, 1.5, 4.1, 4.2, 4.7, 5.1, 5.2, 5.3, 5.4, 5.5, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.4, 9.5, 9.6, 15.4, 16.3, 16.4, 16.7_

  - [x] 10.11 Write property tests for idle and coalescing
    - File: `apps/web/src/lib/learning-world/__tests__/idle-renderer.test.ts`
    - **Property 13: Idle frames produce zero observable context calls** — Validates: Requirements 8.1, 8.4, 8.5
    - **Property 14: Input-burst coalescing** — Validates: Requirements 8.2
    - **Property 15: Manual `requestPaint` coalescing across `WorldMap` mutations** — Validates: Requirements 8.3
    - Use `fast-check` ≥100 iterations per property; `vi.useFakeTimers()` plus a `Proxy`-wrapped tap context

- [x] 11. Checkpoint - React layer mounts and is idle-cheap
  - Ensure all tests pass, ask the user if questions arise.
  - Continue only when all required tests in previous waves pass.
  - Do not proceed if any verification task in a prior wave was skipped.
  - If a verification task could not be implemented due to a missing repository testing pattern, the exception must be explicitly justified by the cited requirement (for example, Requirement 13.4).

- [x] 12. Build the lab route and demo scene
  - [x] 12.1 Implement `lab-scene.ts`
    - Create `apps/web/src/app/fuxie-world-lab/lab-scene.ts`
    - Import `getFuxieWorldPropSrc`, `FUXIE_WORLD_PROPS` from `@/lib/mascot/fuxie-assets` and `pickWorldProp` from `@/lib/mascot/fuxie-world-tags` (read-only consumers; do not modify those files)
    - Export `buildLabScene()` that returns a `WorldScene` with `grid: { tileWidth: 64, tileHeight: 32, cols: 10, rows: 10 }`, `camera: { minZoom: 0.5, maxZoom: 2.0, initialZoom: 1.0 }`, `terrain: []`, `canvasAriaLabel: 'Fuxie Learning World preview scene'`, and 6 required object slots (village square, course signpost, library, radio booth, post office, market) at the documented `(gx, gy)` and footprints, all built via `createWorldObject(input, grid)` so field-shape and grid-bounds errors surface at scene-build time
    - Conditionally include the optional review garden iff `'reviewGarden' in FUXIE_WORLD_PROPS`; never include any other optional named object
    - Resolve every `assetKey` via `getFuxieWorldPropSrc`; if a key resolves to the registry's placeholder, still mount the scene
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 1.8_

  - [x] 12.2 Write unit test for `buildLabScene`
    - File: `apps/web/src/lib/learning-world/__tests__/lab-scene.test.ts`
    - Assert all 6 required slots present with documented coordinates and footprints
    - Assert review garden is included iff `'reviewGarden' in FUXIE_WORLD_PROPS`, and that no other optional named object is ever included
    - Assert every `assetKey` resolves via `getFuxieWorldPropSrc`
    - _Requirements: 1.3, 1.6, 1.8_

  - [x] 12.3 Implement lab route layout with noindex metadata
    - Create `apps/web/src/app/fuxie-world-lab/layout.tsx`
    - Export Next.js `metadata` with `title: 'Fuxie Learning World Lab'` and `robots: { index: false, follow: false }`; failure to emit the meta tag does not block V0 sign-off
    - _Requirements: 1.9_

  - [x] 12.4 Implement lab route page
    - Create `apps/web/src/app/fuxie-world-lab/page.tsx` as a Server Component
    - Call `buildLabScene()` and render exactly `<LearningWorldCanvas scene={scene} />`; do not render `<HotspotList>` here (the canvas component owns it)
    - Emit an inline `<noscript>` block describing the route purpose and listing scene destinations
    - Route is reachable unauthenticated by direct URL `/fuxie-world-lab`; not gated by any feature flag
    - _Requirements: 1.1, 1.2, 1.7, 4.1, 4.2_

  - [x] 12.5 Write lab-route isolation test
    - File: `apps/web/src/lib/learning-world/__tests__/lab-route-isolation.test.ts`
    - Scan every `.ts`/`.tsx` under `apps/web/src/components/` and `apps/web/src/app/` (excluding `apps/web/src/app/fuxie-world-lab/**`) for the substring `/fuxie-world-lab`
    - Assert zero matches so the route is not linked from production navigation, footer, sitemap, or any in-app link
    - _Requirements: 1.7_

- [x] 13. Add learner-state read-only enforcement test
  - [x] 13.1 Write learner-state deny-list test
    - File: `apps/web/src/lib/learning-world/__tests__/learner-state-deny-list.test.ts`
    - Parse every `.ts`/`.tsx` under `apps/web/src/lib/learning-world/`, `apps/web/src/components/learning-world/`, and `apps/web/src/app/fuxie-world-lab/`
    - Assert no `import` line targets any module under: `@/lib/learner`, `@/lib/srs`, `@/lib/progress`, `@/lib/analytics`, `@/lib/xp`, `@/lib/streak`, `@/lib/fucoin`, `@/lib/persistence`, `@/lib/storage` (write helpers), `@/server/`, `@/api/`, `@fuxie/srs-engine`, `@fuxie/database`
    - Keep the deny-list as a typed constant in the same file so it can be extended; runs via existing test command, no new CI job, no new script
    - _Requirements: 7.1, 16.1, 16.5_

- [x] 14. Add MIT attribution
  - [x] 14.1 Author `THIRD_PARTY_NOTICES.md` and verify per-file headers
    - Create or append to `apps/web/THIRD_PARTY_NOTICES.md`
    - Add section "Mykonos Voxel Engine — MIT License" containing the verbatim Mykonos copyright line and the full MIT license text
    - Add a subsection mapping each adapted Fuxie file path (`iso-grid.ts`, `world-camera.ts`, `world-object.ts`, `world-map.ts`, `world-canvas-context.ts` if/when adapted) to its upstream Mykonos module
    - Verify each adapted file already carries its first-10-lines header comment from earlier tasks
    - Do NOT copy any Mykonos image, audio, video, font, or stylesheet asset
    - Do NOT use the Mykonos Greek-island theme, place names, character names, or themed props anywhere in the lab scene
    - Add a manual review checklist row per adapted file to the V0 PR description (one checkbox for "header comment present", one for "THIRD_PARTY_NOTICES entry present")
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 15. Wire and verify end-to-end
  - [x] 15.1 Wire the slice
    - Confirm `apps/web/src/lib/learning-world/index.ts` re-exports the public surface (`IsoGrid`, `WorldCamera`, `WorldMap`, `createWorldObject`, `sortKey`, `isInteractive`, `paint`, `isWorldCanvasContext`, `LearningWorldError`, plus the public types) and nothing referencing React/Next/DOM-only types
    - Confirm `LearningWorldCanvas` imports the core only via `@/lib/learning-world` and the asset registry only via `@/lib/mascot/...`
    - Confirm `app/fuxie-world-lab/page.tsx` renders only `<LearningWorldCanvas scene={scene} />`
    - _Requirements: 1.2, 1.4, 2.5, 3.1, 3.6, 3.9_

  - [x] 15.2 Verify existing-test parity
    - Run `pnpm --filter @fuxie/web test`, `pnpm test:property`, `pnpm test:core`, and `pnpm check:quick` on the V0 branch and the base branch; record pass/fail counts and total wall time for each
    - Assert: no test that passed on base fails on V0; V0 pass count equals base pass count plus the V0-introduced tests; total time stays under 15 minutes; no test file outside V0's own new test directories has been modified
    - If parity fails, fix the regression before proceeding (do not modify test files outside V0's own new test directories)
    - _Requirements: 2.4, 2.6, 14.1, 14.2, 14.3, 14.4_

  - [x] 15.3 Document Codex browser-use QA handoff
    - Append a "Codex Browser-Use QA Handoff" section to this `tasks.md` (under "Notes") that lists the local commands: `pnpm install`; `pnpm --filter @fuxie/web dev`; navigate to `http://localhost:3005/fuxie-world-lab`
    - Document the ready-state indicator: `<canvas data-fuxie-lab-ready="true">` is set on first successful paint and the Hotspot_List `<ul>` exists with the expected `<li>` count
    - Document the QA observations Codex captures per viewport (390×844 mobile; 1280×800 and 1920×1080 desktop): full-page screenshots, zero unhandled console errors during 10s post-load, all 6 required objects visible at desktop widths without clipping, no horizontal scroll on body at 390×844, and DevTools Network/Application panel observations for 60s post-mount (zero `POST`/`PUT`/`PATCH`/`DELETE`, zero new `localStorage`/`sessionStorage`/cookie/IndexedDB writes attributable to the lab origin)
    - _Requirements: 7.2, 7.3, 7.5, 9.2, 9.3, 15.1, 15.2, 15.3, 15.4_

- [x] 16. Final checkpoint - V0 ready for Codex visual QA
  - Ensure all tests pass, ask the user if questions arise.
  - Continue only when all required tests in previous waves pass.
  - Do not proceed if any verification task in a prior wave was skipped.
  - If a verification task could not be implemented due to a missing repository testing pattern, the exception must be explicitly justified by the cited requirement (for example, Requirement 13.4).

## Notes

- All listed verification tasks are required for V0 sign-off when they cite a numbered requirement. No test or static-scan task may be skipped for MVP if it is the verification artifact for a SHALL requirement. If a verification task is impossible due to a missing repository testing pattern, it must be explicitly justified by the relevant requirement exception (for example, Requirement 13.4 covers the absence of a React component testing pattern in V0).
- Each task references specific requirements for traceability.
- Property tests validate universal correctness properties from the design's "Correctness Properties" section.
- Unit / static-scan tests validate specific examples, edge cases, and the additivity contract.
- Requirement 13 (component smoke test) is intentionally not automated in V0: the repository does not currently provide a React component testing pattern (no `@testing-library/react`); per Requirement 13.4 this is documented and the gap is covered by Properties 12 and 18 at the helper level plus Codex browser-use QA at the visual level.
- License compliance (Requirement 6) is enforced by per-file header comments + `THIRD_PARTY_NOTICES.md` + a manual PR-checklist row per adapted file. No CI job, no script, no `package.json` change is introduced (Requirement 6.5).
- The V0 slice is strictly additive: only new files under `apps/web/src/lib/learning-world/`, `apps/web/src/components/learning-world/`, `apps/web/src/app/fuxie-world-lab/`, the matching `__tests__/` directories, and `apps/web/THIRD_PARTY_NOTICES.md` are touched (Requirement 2).

### Codex Browser-Use QA Handoff

Local setup:

1. `pnpm install` (from repository root).
2. `pnpm --filter @fuxie/web dev` (starts the Next.js dev server on port 3005 by default — confirm via the package.json `dev` script).
3. Navigate to `http://localhost:3005/fuxie-world-lab` in a Chromium-based browser using Codex browser-use tooling.

Ready-state indicator:

- The `<canvas>` element is mounted with `data-fuxie-lab-ready="true"` after the first successful paint completes. Codex should poll for this attribute as the cue that hydration finished and the canvas is ready to screenshot.
- A `<ul>` rendered by `<HotspotList>` follows the canvas in DOM order. Its `<li>` count equals the number of interactive scene objects (6 required + optional review garden when present).

Per-viewport observations (capture for each):

- **Mobile**: 390×844.
- **Desktop (small)**: 1280×800.
- **Desktop (large)**: 1920×1080.

For each viewport, Codex captures:

- A full-page screenshot saved with viewport size in the filename.
- Browser console output: assert zero unhandled errors during the 10 seconds following load.
- All 6 required `WorldObject`s (village square, course signpost, library, radio booth, post office, market stall) are visible without clipping at desktop widths.
- At the 390×844 mobile viewport: `document.body.scrollWidth <= document.body.clientWidth` (zero horizontal scroll on body).

DevTools verification (60-second window post-mount, per session, lab origin only):

- **Network panel**: zero `POST`, `PUT`, `PATCH`, or `DELETE` requests originate from the lab origin.
- **Application panel**: zero new `localStorage` / `sessionStorage` / cookie / IndexedDB writes attributable to the lab origin.

If any of the above checks fail, capture the failure in the QA report and route back to the engineering owner before extending the engine into production surfaces.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "3.1", "6.1"] },
    { "id": 2, "tasks": ["2.2", "3.2", "4.1", "8.1", "8.2"] },
    { "id": 3, "tasks": ["4.2", "5.1", "10.1", "10.3", "10.5", "10.7"] },
    { "id": 4, "tasks": ["5.2", "7.1", "10.2", "10.4", "10.6", "10.8", "12.3", "14.1"] },
    { "id": 5, "tasks": ["7.2", "10.9", "10.10", "12.1"] },
    { "id": 6, "tasks": ["10.11", "12.2", "12.4", "13.1"] },
    { "id": 7, "tasks": ["12.5", "15.1"] },
    { "id": 8, "tasks": ["15.2", "15.3"] }
  ]
}
```


## Visual Pass 2 — Post-Codex Visual QA

After the first browser QA pass Codex flagged the lab as 32% visual-wow.
The following additive work raised the score by adding auto-fit camera
math, a real terrain/stage layer, drop shadows, sky/ground gradient, and
a visible "Scene destinations" companion panel.

- [x] VP2.1 Add auto-fit camera helper (`lib/learning-world/camera-fit.ts`)
  - Pure module exporting `combineRects`, `computeAutoFitCamera`,
    `SceneBounds`, `AutoFitConfig`, `AutoFitResult`. Framework-agnostic;
    no React/Next/DOM identifiers.
  - Algorithm: clamp `min(availableW/contentW, availableH/contentH)` to
    `[minZoom, maxZoom]`; pan such that bounds center maps to viewport
    center via `(world − pan) × zoom`.
  - Throws `LearningWorldError('INVALID_CAMERA_CONFIG', ...)` for invalid
    config; returns `null` for degenerate (zero-area) bounds.
  - _Requirements: 11 (camera math correctness extension)_

- [x] VP2.2 Property tests for camera-fit
  - File: `apps/web/src/lib/learning-world/__tests__/camera-fit.test.ts`
  - Properties A–E (bounds membership, invalid-rect skip, viewport
    centering within 1e-6, zoom clamp, invalid-config rejection).
  - 100 fast-check iterations per property + 11 explicit invalid-config
    cases + 1 degenerate-bounds case. **17 tests, all green.**

- [x] VP2.3 Stage rendering in `render.ts`
  - Added vertical sky/ground gradient as 32 horizontal `fillRect`
    strips with interpolated colors.
  - Added isometric tile field over the full grid as 4-band diamond
    approximations per cell with alternating tile colors.
  - Added grid-line dots at every cell intersection.
  - Added drop-shadow band under each sprite (paint order:
    shadow → sprite, preserves `sortKey`).
  - Color management via duck-typed `fillStyle` setter: production hosts
    expose it on real 2D contexts; mock 8-method seams used by V0 tests
    do not, so the same paint pipeline runs everywhere without breaking
    the 8-method `WorldCanvasContext` contract (Requirement 3.5
    unchanged).
  - _Requirements: 1.4, 1.5, 8 (idle invariants preserved), 9.6_

- [x] VP2.4 React-layer auto-fit + DOM stage frame in `LearningWorldCanvas.tsx`
  - On image load + viewport resize, re-runs auto-fit via
    `computeAutoFitCamera` and applies via `WorldCamera.setZoom` /
    `setPan`.
  - Outer frame inline-styled with radial gradient and lab-shadow; inner
    canvas wrapper preserves `overflow: hidden` for clipping; visible
    "Scene destinations" panel rendered OUTSIDE the canvas wrapper as a
    sibling so it cannot be clipped (Codex visual-pass-2 finding 4).
  - HotspotList still rendered exactly once per scene (Requirement 4.1).
  - _Requirements: 4.1, 4.7, 9.4, 9.5, 9.6, 16.7_

- [x] VP2.5 Paint drawImage count test
  - File: `apps/web/src/lib/learning-world/__tests__/paint-draw-count.test.ts`
  - Builds the V0 lab scene, hydrates `WorldMap` from
    `scene.objects`, supplies stub images for every `assetKey`, runs
    `paint()` against a recording context.
  - Asserts `drawImage` count `>= 6` (one per required slot) and that
    the count equals the number of objects with resolved images.
  - Second test asserts `fillRect` count `>= 32` (sky-strip floor),
    proving the gradient + tile-field paths execute. **2 tests, both green.**
  - _Requirements: 1.4, 1.5, 12.10_

### Visual-Pass-2 Verification Summary

- **All V0 tests green**: 17 files / 271 tests pass (252 baseline + 17
  camera-fit + 2 paint-draw-count). Wall time 1.3 s.
- **Local Playwright smoke** (`tmp/v0-smoke/smoke-pass-2.mjs`,
  ad-hoc, not in CI):
  - 390×844: canvasRect 358×224, hotspots 7, panelVisible true,
    canvasUniqueColors 3,490, sky/ground gradient confirmed, 0 console
    errors.
  - 1280×800: canvasRect 1088×680, hotspots 7, panelVisible true,
    canvasUniqueColors 15,542, 0 console errors.
  - 1920×1080: canvasRect 1088×680, hotspots 7, panelVisible true,
    canvasUniqueColors 15,542, 0 console errors.
  - All viewports: `data-fuxie-lab-ready="true"` set within 15 s; zero
    horizontal scroll on body; no clipped-roof frame at mobile.
- Screenshots saved at
  `tmp/browser-qa/fuxie-world-lab-v0-visual-pass-2/{mobile-390x844,
  desktop-1280x800, desktop-1920x1080}.png` per the Codex handoff request.


## V1 Polish 1 — Post-conditional-GO Visual / Accessibility

After visual-pass-2, Codex granted **conditional GO to V1** but required
visual + accessibility polish before any new feature scope. The
following additive work targets Codex's three remaining findings:

- [x] V1P1.1 Hotspot panel contrast + chip styling
  - Inline-styled chip render in `HotspotList.tsx`: text `#e5f0ff` on
    `rgba(255,255,255,0.10)` over the lab panel. Computed contrast ≈
    10:1 against the composite panel background, comfortably above WCAG
    AA's 4.5:1.
  - Hover / `focus-visible` / active states ship via a scoped `<style>`
    block gated by `[data-fuxie-lab-hotspot]` so they cannot leak.
    Focus ring: 2px solid `#3b82f6` with 2px offset.
  - `border-radius: 8px` per spec; `white-space: nowrap` on chips with
    `flex-wrap: wrap` on the list so labels never overflow at 390 px
    mobile and reflow cleanly on narrow viewports.
  - _Codex visual-pass-2 finding #1; Requirements 4.1, 4.5_

- [x] V1P1.2 First-viewport composition tightened
  - Outer frame `maxWidth: 1080`, padding 12, gap 10. Stage aspect
    ratio changed from 16:10 to 16:9 so canvas height drops by ~60 px
    at 1280×800 (594 px instead of 660 px) — frees vertical room for
    the panel heading and first-row chips above the fold.
  - At 1280×800: panel heading top = 629 px, first chip top = 655 px,
    fully visible. At 390×844: panel top = 228 px, first chip top =
    267 px, fully visible.
  - _Codex visual-pass-2 finding #3; Requirements 9.2, 9.5_

- [x] V1P1.3 Visual zone separation — path-connector overlay
  - New `paintPathConnectors` step in `render.ts` (between terrain and
    object pass) renders a hub-and-spoke route from the first
    registered object's footprint center to every other object's
    footprint center as a sequence of small `fillRect` dots. Uses the
    8-method seam unchanged (no `lineTo` / `stroke`); pulls from the
    new `pathRoute` palette color.
  - Reads as "village → destinations" without committing the lab to a
    specific path graph. Combined with the chip pills in the panel
    below, the 7 zones now read as distinct destinations even at mobile
    widths.
  - _Codex visual-pass-2 finding #2; Requirements 1.4, 12.10_

- [x] V1P1.4 V1 hotspot styling test
  - File: `apps/web/src/components/learning-world/__tests__/HotspotList-styling.test.tsx`.
  - Renders the component via `react-dom/server.renderToStaticMarkup`
    (no React Testing Library — Requirement 13.4 still applies) and
    asserts the SSR HTML carries the V1 chip styling: text color
    `#e5f0ff`, translucent background, no underline, 8 px radius,
    nowrap, plus the scoped pseudo-class style block with hover /
    focus-visible / active selectors.
  - 5 tests, all green.

- [x] V1P1.5 Polish-1 smoke
  - Script: `tmp/v0-smoke/smoke-v1-polish-1.mjs` (ad-hoc; not in CI).
  - Captures per-viewport: ready flag, canvas rect, panel rect,
    heading top, first-chip rect, computed chip color/background/font,
    body scroll/client width, hotspot count, canvas unique colors,
    `firstChipFullyVisible`, `headingAboveFold`.
  - Output (Codex-requested path):
    `tmp/browser-qa/fuxie-world-lab-v1-polish-1/{mobile-390x844,
    desktop-1280x800, desktop-1920x1080}.png` plus `summary.json`.
  - All three viewports verdict: ✓ PASS.

### V1 Polish 1 Verification Summary

| Viewport | Canvas | Panel top | First chip | Color | Hotspots | Console |
|---|---|---|---|---|---|---|
| 390×844 | 366×206 | 228 | 267 (fully visible) | rgb(229, 240, 255) | 7 | 0 |
| 1280×800 | 1056×594 | 616 | 655 (fully visible) | rgb(229, 240, 255) | 7 | 0 |
| 1920×1080 | 1056×594 | 616 | 655 (fully visible) | rgb(229, 240, 255) | 7 | 0 |

- **Targeted command**: `pnpm --filter @fuxie/web test -- src/lib/learning-world src/components/learning-world` → **18 files / 276 tests** (252 V0 baseline + 17 camera-fit + 2 paint-draw-count + 5 hotspot-styling). Wall time 1.35 s.
- **Codex finding #1 (chip color rgb(23,59,86))**: fixed → rgb(229, 240, 255), assertion in `HotspotList-styling.test.tsx` test #1.
- **Codex finding #2 (one cluster, no zones)**: fixed → path-connector hub-and-spoke + chip pills with 7 distinct labels.
- **Codex finding #3 (panel below fold at 1280×800)**: fixed → 16:9 aspect + tighter padding; `firstChipFullyVisible=true` at 1280×800 and 390×844.
- **No horizontal scroll** at any viewport.
- **No console errors** at any viewport.

### Residual Risks for V1 Polish 1

- The path-connector is a hub-and-spoke from `objects[0]`. If a future
  scene reorders `objects[]` so the village is no longer first, the
  visual hub will move. Tracked as a potential V1 polish-2 cleanup; for
  V0/V1 the lab scene's `REQUIRED_SLOTS` order is stable.
- The chip style sheet uses `dangerouslySetInnerHTML` in a server-
  renderable component. Content is a static module-scope string, so
  the XSS surface is zero, but a lint rule may flag it; we accept the
  warning as documented in the file header.
- Visual-wow score is subjective. Polish-1 raises measurable metrics
  (chip contrast 10:1, all rows above fold, path connector visible)
  but the next visual-wow gain likely comes from per-zone label
  markers or a parallax/lighting layer, both of which are V1 polish-2
  scope, not polish-1.
