# Requirements Document

## Introduction

V0 of the **Fuxie Learning World Lab** is an internal-only proof slice that validates a reusable isometric world/canvas engine inside Fuxie before adopting it in production Dashboard, Course, or Skill Player surfaces. The slice ports a small, focused subset of the Mykonos voxel engine (MIT) into a framework-agnostic `learning-world` core (grid math, camera, world object, world map, scene type), wraps it in a thin React canvas component, and exposes it through a single internal route `/fuxie-world-lab` that renders one static Fuxie-themed scene composed from existing Fuxie registry assets (village square, course signpost/path, library, radio booth, post office, market/shop, optional review garden).

The lab is an engineering risk-reducer, not a learner feature. It must prove that grid math, camera transforms, and the object/occupancy model are correct, accessible, idle-cheap, and visually crisp on desktop and mobile, while leaving production learner flows and learner progress completely untouched. Substantial code adapted from Mykonos must carry MIT attribution; Mykonos's Greek-island theme must not appear in Fuxie UI.

After Kiro completes V0, Codex performs browser-use QA (desktop and mobile screenshots) before any decision to extend the engine into production surfaces.

## Glossary

- **Learning_World_Core**: The framework-agnostic TypeScript library at `apps/web/src/lib/learning-world/` containing `iso-grid.ts`, `world-camera.ts`, `world-object.ts`, `world-map.ts`, and `world-scene.ts`. Must not import React or any UI framework.
- **Iso_Grid**: Pure isometric grid math module (`iso-grid.ts`) ported from Mykonos `IsoGrid`. Provides `cellToScreen` and `screenToCell` plus grid metadata.
- **World_Camera**: Camera module (`world-camera.ts`) ported from Mykonos `Camera`. Provides pan, zoom, zoom bounds, `screenToWorld`, and `worldToScreen`.
- **World_Object**: Object model (`world-object.ts`) ported from Mykonos `PlacedObject`. Holds grid position, footprint, asset key, optional state, and produces an isometric paint sort key.
- **World_Map**: Tile-map / occupancy index (`world-map.ts`) ported from Mykonos `TileMap`. Tracks which cells are occupied, supports `objectAt`, `isFreeFor`, and exposes a version counter for cache invalidation.
- **World_Scene**: Scene type (`world-scene.ts`) describing a single static scene: grid metadata, terrain entries, and `WorldObject` entries.
- **Learning_World_Canvas**: React component at `apps/web/src/components/learning-world/LearningWorldCanvas.tsx` that mounts a `<canvas>`, drives the core, and exposes a semantic DOM fallback.
- **Hotspot_List**: A semantic, non-canvas list of interactive world objects rendered in the DOM alongside the canvas, providing accessible, keyboard-reachable equivalents for canvas hotspots.
- **Lab_Route**: The internal Next.js page at `apps/web/src/app/fuxie-world-lab/page.tsx` mounted at URL path `/fuxie-world-lab`.
- **Fuxie_Asset_Registry**: The existing asset metadata source at `apps/web/src/lib/mascot/fuxie-assets.ts` and tag taxonomy at `apps/web/src/lib/mascot/fuxie-world-tags.ts`. The lab MUST source asset paths from this registry.
- **Mykonos_Source**: The MIT-licensed reference repository cloned at `tmp/vendor-research/mykonos-island-voxels`. Used as a code reference only; its Greek-island visual theme MUST NOT be imported into Fuxie UI.
- **Production_Surface**: Any of the production Dashboard, Course, or Skill Player code paths and their routes (e.g. `/dashboard`, `/course`, skill player routes). The V0 slice MUST NOT modify these.
- **Reduced_Motion_Preference**: The browser-reported user preference exposed via the CSS media query `prefers-reduced-motion: reduce`.
- **Idle_State**: A frame in which no input event, animation, or scene mutation has occurred since the previous rendered frame.
- **Round_Trip**: Applying a transformation and then its inverse and observing the result equals the original input within a documented tolerance.

## Requirements

### Requirement 1: Internal Lab Route Renders a Fuxie Scene

**User Story:** As a Fuxie Frontend Engineer, I want a dedicated internal route that renders a Fuxie-themed isometric scene, so that I can verify the reused world engine works end-to-end without touching production surfaces.

#### Acceptance Criteria

1. THE Lab_Route SHALL be served at the URL path `/fuxie-world-lab` and SHALL complete its initial server response within 3 seconds of the request.
2. WHEN a user navigates to `/fuxie-world-lab`, THE Lab_Route SHALL mount the Learning_World_Canvas with one Fuxie demo scene within 5 seconds of route navigation start.
3. THE Fuxie demo scene SHALL include all 6 required World_Object categories, all sourced from the Fuxie_Asset_Registry: village square, course signpost or course path, library, radio booth, post office, and market or shop.
4. WHEN the Lab_Route finishes its first render, THE Learning_World_Canvas SHALL contain at least one painted World_Object pixel within the visible viewport and SHALL NOT be a fully blank canvas.
5. IF a required Fuxie_Asset_Registry asset for the demo scene fails to load, THEN THE Lab_Route SHALL render the remaining World_Objects, display a non-blocking inline error indicator naming the failed asset, and SHALL NOT abort scene mount.
6. WHERE a `review garden` Asset_Key exists in the Fuxie_Asset_Registry, THE Fuxie demo scene SHALL include the review garden World_Object as an optional seventh object additive to the 6 required categories.
7. THE Lab_Route SHALL be reachable only by direct path entry to `/fuxie-world-lab` and SHALL NOT be linked from any production navigation menu, footer, sitemap, or in-app link. THE Lab_Route MAY be served unauthenticated to allow Codex browser-use QA, and SHALL NOT be gated by any feature flag that would block Codex from reaching it.
8. THE Fuxie demo scene SHALL NOT include other named optional objects beyond the review garden in V0.
9. WHERE technically feasible within the existing Next.js metadata pattern, THE Lab_Route SHALL include `<meta name="robots" content="noindex,nofollow">` so that the route is not crawlable; failure to add this meta tag SHALL NOT block V0 sign-off.

### Requirement 2: No Modification of Production Surfaces

**User Story:** As a CTO/Tech Lead, I want the V0 slice to be strictly additive, so that production Dashboard, Course, and Skill Player flows remain unaffected while the engine is being validated.

#### Acceptance Criteria

1. THE V0 slice SHALL NOT add, modify, rename, move, or delete any file inside production Dashboard, Course, or Skill Player route directories under `apps/web/src/app/` or their component directories.
2. THE V0 slice SHALL NOT change any exported page component, exported metadata, or route handler of any route that exists prior to the V0 slice.
3. IF a shared UI primitive consumed by a Production_Surface is modified by the V0 slice, THEN the modification SHALL be additive only (new exports, no signature changes, no default-prop changes, no rendered-DOM changes for existing call sites) and the slice SHALL fail review otherwise.
4. WHEN the repository's existing test command is executed after the V0 slice is applied, 100% of tests that passed on the base branch SHALL still pass, and no test file outside the V0 slice's own new test directories SHALL be modified.
5. THE V0 slice SHALL only add new files under `apps/web/src/lib/learning-world/`, `apps/web/src/components/learning-world/`, `apps/web/src/app/fuxie-world-lab/`, the matching test directories, and the third-party notice file specified in Requirement 6.
6. IF the repository's build, type-check, or lint commands report any new error after the V0 slice is applied that did not exist on the base branch, THEN the V0 slice SHALL be considered incomplete.

### Requirement 3: Framework-Agnostic Learning World Core

**User Story:** As a CTO/Tech Lead, I want the `learning-world` core to be framework-agnostic, so that the engine can be reused in any rendering host without coupling to React or Next.js.

#### Acceptance Criteria

1. THE Learning_World_Core SHALL include at minimum `iso-grid.ts`, `world-camera.ts`, `world-object.ts`, `world-map.ts`, and `world-scene.ts` under `apps/web/src/lib/learning-world/`, and each file SHALL export at least one named symbol consumed by the others or by the React wrapper.
2. THE Learning_World_Core SHALL NOT import any module whose package name or path begins with `react`, `react-dom`, `next`, or any other UI framework package.
3. THE V0 slice SHALL include a unit test in the learning-world test directory `apps/web/src/lib/learning-world/__tests__/` that fails if any Learning_World_Core file imports a forbidden UI framework package per criterion 2; the test SHALL be runnable via the repository's existing test command and SHALL NOT require a new CI job, a new `scripts/` entry, or a new `package.json` script.
4. THE Learning_World_Core SHALL NOT reference any of the identifiers `window`, `document`, `HTMLCanvasElement`, `HTMLElement`, `navigator`, `localStorage`, `sessionStorage`, or `requestAnimationFrame` at module top level; any DOM-dependent operations SHALL be confined to functions that receive the relevant handles as parameters.
5. THE Learning_World_Core SHALL define and export a structural interface `WorldCanvasContext` whose method set is exactly `clearRect`, `fillRect`, `drawImage`, `save`, `restore`, `translate`, `scale`, and `setTransform`; rendering functions in the Learning_World_Core SHALL accept a `WorldCanvasContext` parameter rather than acquiring one internally.
6. THE Learning_World_Core public surface (exported types and exported function signatures) SHALL NOT export, re-export, or reference the DOM-only type `CanvasRenderingContext2D`; the React wrapper MAY pass a real `CanvasRenderingContext2D` at the call site because TypeScript structural typing is compatible with `WorldCanvasContext`.
7. IF a Learning_World_Core rendering function is invoked with a null, undefined, or structurally non-equivalent `WorldCanvasContext` argument (an argument missing any of the methods listed in criterion 5), THEN the function SHALL reject the invocation by throwing a typed error and SHALL NOT mutate any internal state.
8. THE Learning_World_Core SHALL expose a `WorldScene` type describing grid metadata, terrain entries, and `WorldObject` entries, instantiable from plain TypeScript or Node.js without importing React or Next.
9. THE exported `WorldScene` type and all types it transitively references SHALL contain zero references to React, Next, or DOM-only types (including `CanvasRenderingContext2D`, `HTMLCanvasElement`, `HTMLElement`, `Window`, `Document`, and `Navigator`).

### Requirement 4: Semantic Accessibility Fallback for the Canvas

**User Story:** As a Product Designer validating accessibility, I want every canvas-rendered hotspot to have a semantic DOM equivalent, so that keyboard and assistive-technology users can reach the same destinations.

#### Acceptance Criteria

1. WHEN the Learning_World_Canvas mounts a scene, THE Learning_World_Canvas SHALL render in the DOM exactly one focusable, keyboard-activatable Hotspot_List item per interactive World_Object in the active scene.
2. THE Learning_World_Canvas SHALL apply an accessible name of length 1 to 200 characters to the `<canvas>` element using `aria-label` or via `aria-labelledby` referencing an element that exists in the DOM at mount time.
3. WHEN an interactive World_Object has an `ariaLabel` defined in the scene, THE corresponding Hotspot_List item SHALL use that label as its accessible name.
4. IF an interactive World_Object has no `ariaLabel` or has an empty `ariaLabel`, THEN THE corresponding Hotspot_List item SHALL fall back to its scene-defined identifier or asset key as the accessible name and SHALL NOT render with an empty accessible name.
5. WHEN an interactive World_Object has an `href` defined in the scene, THE corresponding Hotspot_List item SHALL be activatable via Enter or Space keys and SHALL expose that destination as a navigable target.
6. WHEN a user presses Tab from any focusable element preceding the Hotspot_List, THE Hotspot_List items SHALL receive focus in scene-defined order without requiring pointer interaction with the canvas.
7. IF the canvas fails to mount or the rendering context is unavailable, THEN within 2 seconds THE Lab_Route SHALL render the Hotspot_List with a non-blocking status indicating the canvas is unavailable, so that scene destinations remain reachable.

### Requirement 5: Respect Reduced-Motion Preference

**User Story:** As a Product Designer, I want the lab to respect the user's reduced-motion preference, so that motion-sensitive users are not exposed to unnecessary animation.

#### Acceptance Criteria

1. WHILE the Reduced_Motion_Preference is `reduce`, THE Learning_World_Canvas SHALL NOT animate any non-essential transform, opacity, or color property with a duration greater than 0ms; non-essential elements include idle camera drift, hover bobbing, and decorative tweens.
2. WHILE the Reduced_Motion_Preference is `reduce`, THE Learning_World_Canvas SHALL render the static scene composition (background, mascot or world object sprites, and interactive object positions in resting state) within 500ms of mount.
3. WHEN the Reduced_Motion_Preference changes from any value to `reduce` during the session, THE Learning_World_Canvas SHALL apply the new preference within 1 second of the next user interaction or scene update without requiring a page reload.
4. WHILE the Reduced_Motion_Preference is `reduce`, THE Learning_World_Canvas SHALL still render zero-duration state-change feedback (focus rings, selection highlights, error indicators) so that essential affordances remain visible.
5. THE Learning_World_Canvas SHALL NOT autoplay any sound or audio cue in V0.
6. IF the Reduced_Motion_Preference cannot be read or returns an invalid value, THEN THE Learning_World_Canvas SHALL default to treating the preference as `reduce`.

### Requirement 6: MIT Attribution for Adapted Mykonos Code

**User Story:** As a CTO/Tech Lead, I want MIT attribution preserved for any Mykonos-derived code, so that Fuxie remains compliant with the upstream license.

#### Acceptance Criteria

1. WHERE non-trivial code (defined as 10 or more contiguous lines, or any complete function, class, or module structure) in the Learning_World_Core is adapted from Mykonos_Source, THE V0 slice SHALL include a third-party notice file at `apps/web/THIRD_PARTY_NOTICES.md` (or the repository's existing equivalent) containing the verbatim Mykonos copyright line and the full MIT license text.
2. WHERE a Learning_World_Core source file adapts code from Mykonos_Source, THE V0 slice SHALL place an attribution comment within the first 10 lines of that file naming the upstream Mykonos module and stating "MIT License, see THIRD_PARTY_NOTICES".
3. THE V0 slice SHALL NOT copy any Mykonos image, audio, video, font, or stylesheet asset file into the Fuxie codebase.
4. THE Fuxie demo scene SHALL NOT use the Mykonos Greek-island visual theme, place names, character names, or themed props identifiable as originating from Mykonos_Source.
5. IF a Learning_World_Core file adapts Mykonos_Source code but is missing the required attribution comment or third-party notice entry, THEN the omission SHALL be caught by a documented manual review item in the V0 slice's tasks/PR checklist that lists each adapted file and verifies its attribution; the manual review item SHALL identify the offending file path and the missing attribution element. The V0 slice SHALL NOT introduce a new CI job, a new `scripts/` entry, or a new `package.json` script for license compliance.

### Requirement 7: World Layer Does Not Write Learner Progress

**User Story:** As a CTO/Tech Lead, I want the world layer to be read-only with respect to learner state, so that visual experimentation cannot corrupt learner progress.

#### Acceptance Criteria

1. THE Learning_World_Core SHALL NOT statically import any module from a documented deny-list of learner-progress modules, persistence helpers, analytics writers, or learner-state-mutating API clients; this rule SHALL be enforced by a unit test in the learning-world test directory `apps/web/src/lib/learning-world/__tests__/` that asserts the deny-list is not statically imported, runnable via the repository's existing test command, with no new CI job, no new `scripts/` entry, and no new `package.json` script.
2. WHILE the Learning_World_Canvas is rendered, over a continuous 60-second observation window starting at mount, THE Lab_Route SHALL issue zero HTTP POST, PUT, PATCH, or DELETE requests, verifiable by Codex browser-use QA inspecting the browser DevTools network panel.
3. WHILE the Lab_Route is mounted, over a continuous 60-second observation window starting at mount, THE Lab_Route SHALL NOT write to `localStorage`, `sessionStorage`, any cookie set via `document.cookie`, or any IndexedDB store, verifiable by Codex browser-use QA inspecting the browser DevTools application panel.
4. WHEN any Hotspot_List item is activated in the lab, THE Lab_Route SHALL only navigate via anchor `href` or update in-memory selection or focus state, and SHALL NOT trigger any network mutation request (POST, PUT, PATCH, DELETE) and SHALL NOT write to `localStorage`, `sessionStorage`, cookies, or IndexedDB during a 5-second post-activation window.
5. IF the world layer attempts to issue any operation matching criterion 1, 2, 3, or 4, THEN the violation SHALL be caught by Codex browser-use QA via network panel and application panel inspection (no XP, streak, or Fucoin comparison is required), and a developer-visible warning SHALL be emitted to the console identifying the attempted write so the violation is surfaced during local development.

### Requirement 8: Idle Renderer Does Not Continuously Redraw

**User Story:** As a CTO/Tech Lead, I want the canvas renderer to stop redrawing when nothing has changed, so that the lab does not waste CPU or battery.

#### Acceptance Criteria

1. WHILE the Learning_World_Canvas is in the Idle_State (no pending input event within the last 100ms and no World_Map version change since the last rendered frame), THE renderer SHALL issue zero observable 2D context calls (`clearRect`, `fillRect`, `drawImage`, `stroke`, `fill`, or any path command).
2. WHEN a user input event (pointer move while panning, pointer down, key press, wheel/zoom) occurs, THE renderer SHALL coalesce all inputs occurring within the same animation frame and produce at most one new frame for that animation frame.
3. WHEN a V0-controlled mutation increments the World_Map version counter and the same code path also invokes the Learning_World_Canvas repaint trigger (e.g. `requestPaint()`) within the same animation frame, THE renderer SHALL coalesce all such invocations within that animation frame into exactly one new frame on the next animation frame, or within 2 animation frames in test environments where `requestAnimationFrame` scheduling is approximated, and SHALL NOT produce any further frame until the next trigger fires.
4. THE Learning_World_Canvas SHALL NOT use `setInterval` or an unconditional `requestAnimationFrame` loop that runs while idle.
5. THE V0 slice SHALL expose a test hook counting observable 2D context calls per frame so that the idle no-redraw rule can be verified deterministically by automated tests.

### Requirement 9: Crisp Rendering on Desktop and Mobile Without Overflow

**User Story:** As a Product Designer validating visual feel, I want the lab scene to look crisp and contained on both desktop and mobile, so that the engine is judged on its real visual quality.

#### Acceptance Criteria

1. THE Learning_World_Canvas SHALL size its backing store using `min(window.devicePixelRatio, 3.0)` so that rendered images appear non-blurry on high-DPI displays without unbounded memory growth.
2. WHEN the Lab_Route is rendered at viewport 390x844, THE document body SHALL satisfy `scrollWidth <= clientWidth` (zero horizontal scroll).
3. WHEN the Lab_Route is rendered at any viewport width >= 1280px, THE Learning_World_Canvas SHALL clip zero pixels of any required World_Object from Requirement 1 criterion 3 within the available content column.
4. WHEN the viewport is resized, after a 100ms debounce THE Learning_World_Canvas SHALL update its CSS dimensions and backing-store dimensions on the next animation frame and SHALL re-render exactly once.
5. THE Learning_World_Canvas SHALL not overflow its parent container at any viewport width in the closed range [360px, 1920px], measured as `canvas.scrollWidth <= parent.clientWidth` and `canvas.scrollHeight <= parent.clientHeight`.
6. IF the canvas rendering context cannot be acquired or the backing store cannot be sized, THEN THE Learning_World_Canvas SHALL render the Hotspot_List fallback per Requirement 4 criterion 7 and SHALL NOT throw an unhandled exception.

### Requirement 10: Iso Grid Math Correctness

**User Story:** As a QA Automation Engineer, I want isometric grid math to be testable and correct, so that downstream camera and object code can rely on it.

#### Acceptance Criteria

1. THE Iso_Grid SHALL expose a pure function `cellToScreen(gx, gy)` that accepts finite numeric `gx` and `gy` and returns an object `{x, y}` of finite numbers in unscaled grid screen coordinates.
2. THE Iso_Grid SHALL expose a pure function `screenToCell(sx, sy)` that accepts finite numeric `sx` and `sy` and returns an object `{gx, gy}` of integers.
3. WHEN `cellToScreen(gx, gy)` is invoked for any integer `(gx, gy)` within the configured grid bounds, THE Iso_Grid SHALL satisfy `screenToCell(cellToScreen(gx, gy)) == (gx, gy)` (Round_Trip property).
4. THE Iso_Grid SHALL be configured by integer `tileWidth` and `tileHeight` in the closed range [1, 1024], and for the same configuration and inputs SHALL produce identical outputs (deterministic).
5. IF `cellToScreen` or `screenToCell` is invoked with NaN, +Infinity, -Infinity, or a non-numeric argument, THEN THE Iso_Grid SHALL reject the invocation by throwing a typed error and SHALL NOT return a value.
6. IF the Iso_Grid is configured with `tileWidth` or `tileHeight` outside [1, 1024] or non-integer, THEN construction SHALL fail by throwing a typed error and the API SHALL be unavailable for use.
7. THE V0 slice SHALL include unit tests in `apps/web/src/lib/learning-world/__tests__/iso-grid.test.ts` covering the Round_Trip property over a representative grid of at least 8x8 cells exercising the four corners, the center, and at least 16 interior cells.

### Requirement 11: World Camera Transform Correctness and Zoom Bounds

**User Story:** As a QA Automation Engineer, I want the camera transform to be invertible and zoom-bounded, so that pan and zoom never produce undefined behavior.

#### Acceptance Criteria

1. THE World_Camera SHALL expose pure functions `screenToWorld(sx, sy)` and `worldToScreen(wx, wy)` that accept finite numerics in `[-1e6, 1e6]` and return a coordinate pair of finite numbers without mutating camera state.
2. WHEN `screenToWorld(sx, sy)` is invoked for any finite `(sx, sy)` and any valid camera state, THE World_Camera SHALL satisfy `worldToScreen(screenToWorld(sx, sy))` equal to `(sx, sy)` with each component differing by at most `1e-6` in absolute value (Round_Trip property).
3. THE World_Camera SHALL clamp zoom into the inclusive interval `[minZoom, maxZoom]` where `minZoom > 0` and `maxZoom >= minZoom` are configured at construction.
4. IF the World_Camera is constructed with `minZoom <= 0`, `maxZoom < minZoom`, or any non-finite bound, THEN construction SHALL fail by throwing a typed error and the API SHALL be unavailable for use.
5. WHEN `setZoom(z)` is called with `z < minZoom`, THE World_Camera SHALL set zoom to `minZoom`.
6. WHEN `setZoom(z)` is called with `z > maxZoom`, THE World_Camera SHALL set zoom to `maxZoom`.
7. WHEN `setZoom(z)` is called with `z` in `[minZoom, maxZoom]`, THE World_Camera SHALL set zoom to `z` exactly (identity).
8. IF `setZoom(z)` is called with NaN, +Infinity, -Infinity, null, undefined, or a non-numeric value, THEN THE World_Camera SHALL leave zoom unchanged, SHALL emit a typed error signal, and SHALL NOT modify any other camera state.
9. THE V0 slice SHALL include unit tests in `apps/web/src/lib/learning-world/__tests__/world-camera.test.ts` covering: Round_Trip at boundary points and at least one interior point; clamp-below, clamp-above, and equal-to-bound `setZoom`; and all invalid input variants from criterion 8.

### Requirement 12: World Object and World Map Occupancy Correctness

**User Story:** As a QA Automation Engineer, I want occupancy and sort-order rules to be tested, so that scenes render in correct depth order without overlap collisions going undetected.

#### Acceptance Criteria

1. THE World_Object SHALL expose integer `gx` and `gy` within configured grid bounds, an `assetKey` string of length 1 to 128 characters, and a `footprint` of `{ w, d }` integers in the closed range [1, 64].
2. WHEN `objectAt(gx, gy)` is invoked with integer `(gx, gy)` within grid bounds, THE World_Map SHALL return the World_Object that occupies the queried cell, or null if no object occupies it, within 10ms.
3. IF `objectAt(gx, gy)` is invoked with `(gx, gy)` outside grid bounds, NaN, or non-integer, THEN THE World_Map SHALL reject by throwing a typed error and SHALL NOT mutate state.
4. THE World_Map SHALL expose `isFreeFor(object, gx, gy)` returning true when every cell of the object's footprint at that origin is unoccupied or occupied only by `object` itself, and false otherwise.
5. WHEN a World_Object is added at `(gx, gy)` with footprint `{ w, d }` and the footprint is within grid bounds and does not collide, THE World_Map SHALL mark every cell `(gx + i, gy + j)` for `0 <= i < w` and `0 <= j < d` as occupied by that object.
6. IF an add is rejected (out-of-bounds footprint or collision), THEN THE World_Map SHALL leave occupancy and version counter unchanged and SHALL signal rejection via a typed error or false return value.
7. WHEN a World_Object is removed, THE World_Map SHALL clear every cell previously marked by that object and SHALL NOT clear cells occupied by other objects.
8. IF a remove is invoked for an object not currently registered in the World_Map, THEN THE World_Map SHALL leave occupancy and version counter unchanged and SHALL signal rejection.
9. THE World_Map SHALL maintain a version counter initialized to 0 that strictly increases by exactly 1 on each successful add or remove and SHALL never decrease.
10. THE World_Object SHALL expose a deterministic numeric `sortKey` such that for any two objects `a` and `b` where `a` is geometrically behind `b` in isometric projection, `a.sortKey < b.sortKey`; ties SHALL only occur when `a` and `b` share the same back-to-front depth.
11. THE V0 slice SHALL include unit tests in `apps/web/src/lib/learning-world/__tests__/world-map.test.ts` (or `world-object.test.ts`) covering: multi-cell footprint occupancy, `objectAt` for occupied/free/out-of-bounds cells, `isFreeFor` for free/partial/full/out-of-bounds footprints, version increment on success and unchanged on rejection, and `sortKey` ordering for at least one back-to-front and one front-to-back pair.

### Requirement 13: Component Smoke Test for Learning World Canvas

**User Story:** As a QA Automation Engineer, I want a smoke test for the React canvas wrapper, so that obvious mount or fallback regressions fail fast.

#### Acceptance Criteria

1. WHERE the repository already provides a React component testing pattern (Vitest + Testing Library or equivalent), THE V0 slice SHALL include a smoke test for `LearningWorldCanvas` that asserts the component mounts without throwing within 5 seconds for a minimal valid scene containing 1 to 5 World_Objects.
2. WHERE the repository already provides a React component testing pattern, THE smoke test SHALL assert exactly one accessible Hotspot_List item exists per interactive World_Object in the test scene and that each item is reachable by keyboard.
3. IF the smoke test cannot complete (timeout, runner crash, or environment misconfiguration), THEN THE V0 slice SHALL fail CI with a clear error message identifying the smoke test as the failing step.
4. IF the repository does not currently provide a React component testing pattern, THEN THE V0 slice SHALL document this skip in the design phase and SHALL still ship the Learning_World_Core unit tests required by Requirements 10 through 12.

### Requirement 14: Existing Tests Continue to Pass

**User Story:** As a QA Automation Engineer, I want the existing test suite to remain green, so that V0 is provably non-disruptive before Codex runs visual QA.

#### Acceptance Criteria

1. WHEN the repository's existing test command is executed on the V0 branch, THE test run SHALL complete within 15 minutes and SHALL report zero failed tests, zero errored tests, and zero unexpectedly skipped tests beyond what was skipped on the base branch.
2. THE V0 test run SHALL pass at least the same count of tests as the base branch, plus the new tests added by this slice.
3. IF an existing test fails or errors as a side effect of the V0 slice, THEN THE V0 slice SHALL be considered incomplete until either the slice is corrected or the failure is documented and approved by the CTO/Tech Lead with a recorded justification.
4. IF the test run does not complete within 15 minutes, THEN THE V0 slice SHALL be considered incomplete and SHALL surface the timeout as a blocking failure.

Non-blocker note: WHERE the repository's existing CI already retains test reports or artifacts (logs, junit/xml output, or equivalent), the V0 slice SHALL attach its run reports to that existing retention; the V0 slice SHALL NOT introduce a new CI artifact retention policy, and the absence of a dedicated retention duration SHALL NOT block V0 sign-off.

### Requirement 15: Codex Browser-Use QA Handoff

**User Story:** As a CTO/Tech Lead, I want a clean handoff to Codex for browser-based QA, so that visual quality is validated before any decision to extend the engine into production surfaces.

#### Acceptance Criteria

1. WHEN the V0 slice is complete, THE Lab_Route SHALL load `/fuxie-world-lab` to a fully rendered scene within 10 seconds at viewports 390x844 (mobile) and at any size from 1280x800 up to 1920x1080 (desktop), with zero unhandled console errors during load.
2. WHEN an internal contributor runs the documented local command sequence, THE Lab_Route SHALL be reachable without any login credential, authentication token, or feature flag that is unavailable to internal contributors.
3. THE V0 slice SHALL document, in the design or tasks document, an ordered list of local commands required to start the dev server, the expected URL `/fuxie-world-lab`, and the ready-state indicator (e.g., "scene visible") that confirms the route is ready for screenshot capture.
4. IF the Lab_Route fails to render the scene within the 10-second budget in criterion 1, THEN THE Lab_Route SHALL display a deterministic visible error state (Hotspot_List fallback per Requirement 4 criterion 7) so that Codex captures a clear failure rather than a blank page.

### Requirement 16: Out of Scope for V0

**User Story:** As a CTO/Tech Lead, I want explicit scope limits for V0, so that the slice stays small and only validates the foundation.

#### Acceptance Criteria

1. THE V0 slice SHALL NOT modify any Production_Surface code path, and no V0-introduced module SHALL be imported by a Production_Surface module.
2. THE V0 slice SHALL NOT include a renderer asset cache layer, image preloader cache, or high-DPI pre-render pipeline beyond what is explicitly mandated by a numbered acceptance criterion in Requirement 9.
3. THE V0 slice SHALL NOT include advanced input gestures: pinch-zoom, two-finger rotate, momentum panning, or gesture inertia.
4. WHERE the V0 slice includes basic pan and zoom, THE input layer SHALL be limited to single-pointer drag for pan and discrete wheel or button increments for zoom; otherwise input SHALL be limited to keyboard activation of Hotspot_List items.
5. THE V0 slice SHALL NOT persist any world state to learner progress, server-side stores, shared cookies, localStorage, sessionStorage, or IndexedDB; world state SHALL exist only in memory and SHALL be discarded on reload.
6. THE V0 slice SHALL NOT introduce any interface that allows runtime creation, editing, repositioning, or removal of scene objects (no scene authoring tool, placement system, or admin builder UI).
7. THE V0 slice SHALL NOT introduce WebAudio playback, HTMLAudioElement playback, background music, or any audio output from V0 code paths.
8. IF the V0 slice introduces any code that violates criteria 1 through 7, THEN THE introduction SHALL be rejected at code review or CI, the Lab_Route SHALL preserve its prior working state, and the rejection SHALL be reported with the offending file and rule.

## Correctness Properties for Property-Based Testing

The following properties are recommended for property-based testing during the design and tasks phases. They are listed here so the design phase can plan generators and tolerances explicitly.

1. **Iso Grid Round-Trip (Requirement 10):** For all integer cell coordinates `(gx, gy)` within configured grid bounds, `screenToCell(cellToScreen(gx, gy)) == (gx, gy)`.
2. **Camera Transform Invertibility (Requirement 11):** For all finite screen points `(sx, sy)` and any valid camera state (pan offset within bounds, zoom in `[minZoom, maxZoom]`), `worldToScreen(screenToWorld(sx, sy))` equals `(sx, sy)` within absolute tolerance `1e-6`.
3. **Camera Zoom Clamp Idempotence (Requirement 11):** For any numeric input `z`, applying `setZoom(z)` twice yields the same camera state as applying it once, and the resulting zoom lies in `[minZoom, maxZoom]`.
4. **Occupancy Footprint Coverage (Requirement 12):** For any World_Object added at `(gx, gy)` with footprint `{ w, d }` inside grid bounds, every cell in the footprint rectangle is reported as occupied by that object via `objectAt`, and no cell outside the rectangle is newly occupied.
5. **Occupancy Add/Remove Round-Trip (Requirement 12):** For any sequence of adds followed by removing the same objects in reverse order on a World_Map starting empty and within grid bounds, the final occupancy state equals the initial empty state.
6. **isFreeFor Consistency (Requirement 12):** For any World_Map and any object footprint at `(gx, gy)` inside grid bounds, `isFreeFor` returns true if and only if every cell in the footprint either is unoccupied or is occupied by the object being queried.
7. **Sort Key Ordering (Requirement 12):** For any pair of World_Objects `a` and `b` such that `a` is geometrically behind `b` in isometric projection (lower combined `gx + gy` for non-overlapping footprints, with documented tie-break), `a.sortKey < b.sortKey`.
8. **Version Counter Monotonicity (Requirement 12):** For any sequence of successful add or remove operations on a World_Map, the version counter is monotonically non-decreasing and strictly increases on each successful operation.

Property-based testing is appropriate here because all targeted modules are pure, in-memory, and cheap to iterate. External services, AWS, persistence, and React rendering are explicitly excluded from property-based scope.

## Out of Scope

The following are explicitly out of scope for V0 and SHALL be addressed in later slices if and only if Codex visual QA approves continuation:

- Modifications to production Dashboard, Course, or Skill Player surfaces.
- Renderer asset cache layers, image preloaders, sprite atlases, and shadow-canvas grounding beyond minimal device-pixel-ratio scaling.
- Advanced input gestures (pinch-zoom, momentum pan, two-finger rotate).
- Persistence of world state to learner progress, databases, or shared cookies.
- Scene authoring, placement, or admin builder tooling.
- WebAudio playback or sound effects.
- Replacing or wrapping the Mykonos Greek-island visual theme; only the engine code is reused, never the theme.
