# Requirements Document

## Introduction

V1.1 of the **Fuxie Learning World Lab** ("Zone Clarity" slice) is an internal-only polish iteration that builds on the V0 foundation and the V1 polish-1 gate. V0 proved the engine (grid math, camera, occupancy, semantic fallback). V1 polish-1 raised the lab to a "real internal prototype" feel with hotspot contrast, first-viewport composition, a basic path connector, and a canvas stage/frame, reaching ~70-72% visual wow at 18 files / 276 passing tests.

The remaining problem is interpretive, not technical: the world still reads as one large composite visual cluster. Reviewers cannot identify, at a glance, that the scene contains seven distinct learning destinations, each mapped to a specific learning intent. V1.1 must turn `/fuxie-world-lab` from "pretty engine demo" into a clear **learning map**, where each destination is visually and semantically distinct, the path/waypoint structure is data-driven, and the seven learning intents are understandable within 3 seconds of viewing.

This slice remains strictly internal: no production Dashboard, Course, or Skill Player surfaces are touched, no learner-state writes occur, no audio is introduced, and no scene authoring/admin builder is exposed. The deliverable is a clearer learning-world prototype suitable for Codex review, not a production learner surface.

## Glossary

- **Lab_Route**: The internal Next.js page at `apps/web/src/app/fuxie-world-lab/page.tsx` mounted at URL path `/fuxie-world-lab`. Internal-only, not linked from production navigation.
- **Learning_World_Core**: The framework-agnostic TypeScript library at `apps/web/src/lib/learning-world/`. Pure TypeScript with no React/Next/UI imports.
- **Learning_World_Canvas**: The React component at `apps/web/src/components/learning-world/LearningWorldCanvas.tsx` that mounts the canvas and the Hotspot_List.
- **World_Scene**: The scene type in `apps/web/src/lib/learning-world/world-scene.ts` describing grid metadata, camera, terrain, and `WorldObject` entries. In V1.1, extended with optional **Zone_Metadata**.
- **World_Object**: An interactive or decorative object placed on the world grid (existing V0 type).
- **Zone**: A V1.1 first-class scene concept describing one learning destination. Each Zone maps to exactly one interactive `WorldObject` and carries a `learningIntent`, a stable `shortLabel`, and a visual or grid anchor for placing a `Marker`.
- **Zone_Metadata**: The optional `zones` array on a `WorldScene`. Pure TypeScript shape: `{ id, objectId, title, shortLabel, learningIntent, visualAnchor?, gridAnchor?, href?, order? }`.
- **Marker**: A small DOM-overlay or canvas-rendered visual element (label, pin, chip pointer) that identifies a Zone in the rendered scene. Markers are restrained, not callout cards.
- **Hotspot_List**: The semantic, keyboard-reachable DOM list of interactive destinations rendered alongside the canvas (existing V0 surface). In V1.1, its order MUST equal Zone order.
- **Hotspot_Chip**: A single `<li>` item inside the Hotspot_List, visually styled as a chip and bearing the Zone's `shortLabel`.
- **Waypoint**: A scene-defined connector point used to draw the visual path between Zones. Waypoint data lives in `World_Scene`, not in component code.
- **Zone_Graph**: The set of Zones plus the ordered Waypoints that connect them, used by the renderer to draw path connectors. Replaces the V1 polish-1 `objects[0]` hub assumption.
- **Learning_Intent**: A short human-readable phrase describing what a Zone teaches or unlocks (for example, "listening", "writing", "spaced review"). Used for reviewer comprehension, not for learner-facing copy.
- **Visual_Wow**: Internal subjective Codex review score on the lab's first-impression visual quality, reported as a percentage.
- **Reviewer_3s_Test**: The internal acceptance test in which a Codex reviewer is shown the lab for ~3 seconds and asked to confirm: (a) it is a Fuxie learning world, (b) there are 7 destinations, (c) each maps to a learning intent, (d) keyboard/semantic order matches the visual order.
- **Production_Surface**: Any production Dashboard, Course, or Skill Player route or component. The V1.1 slice MUST NOT modify these.
- **Reduced_Motion_Preference**: The browser-reported preference exposed via the CSS media query `prefers-reduced-motion: reduce`.
- **Core_Artwork_Bounds**: Optional rectangular bounds, in image-local CSS pixels relative to the WorldObject's rendered sprite or image origin (top-left = (0,0)), describing the area considered the WorldObject's primary readable artwork. When projected to viewport CSS pixels for occlusion checks, the rect is transformed by the same scale and translation applied to the WorldObject's sprite. If omitted, the test SHALL treat the entire projected sprite/image bounding box as the Core_Artwork_Bounds (full-image fallback). Expressed on `WorldObject` as `coreArtworkBounds?: { x: number; y: number; width: number; height: number }` with finite IEEE-754 values, `width >= 1`, `height >= 1`, all in image-local CSS pixels.
- **Fuxie_Asset_Registry**: The repository's existing curated set of art assets sourced and approved for Fuxie product use, distinct from third-party Mykonos-themed assets. Located under the asset registry conventions already documented in the V0 spec; not re-enumerated here.
- **Connector_Segment_List**: The renderer's deterministic output for the connector layer of a given scene, expressed as `ReadonlyArray<{ fromX: number; toX: number; fromY: number; toY: number }>` in CSS pixels relative to the canvas viewport. Used as the equality target for the path-graph permutation regression test in Requirement 2.

## Requirements

### Requirement 1: Scene-defined Zones for Seven Learning Destinations

**User Story:** As a Product Manager EdTech, I want each of the seven learning destinations to be defined as first-class scene metadata, so that the lab reads as a structured learning map rather than a single visual cluster.

#### Acceptance Criteria

1. THE World_Scene type SHALL expose an optional `zones` field of type `ReadonlyArray<Zone>` declared in `apps/web/src/lib/learning-world/world-scene.ts`; `zones` omitted and `zones === []` SHALL be treated equivalently as "no zones".
2. THE Zone type SHALL include the fields `id` (trimmed string, length 1 to 64 after trimming), `objectId` (trimmed string, length 1 to 64 after trimming, referencing exactly one `WorldObject.id` in the same scene), `title` (trimmed string, length 1 to 80 after trimming), `shortLabel` (trimmed string, length 1 to 24 after trimming), and `learningIntent` (trimmed string, length 1 to 80 after trimming); all five fields SHALL be required and non-empty after trimming.
3. THE Zone type SHALL include at least one of `visualAnchor` (object `{ x: number, y: number }` with finite IEEE-754 values where `x` and `y` are each in the closed interval [-10000, 10000]) or `gridAnchor` (object `{ gx: integer, gy: integer }` with safe-integer values each in the closed interval [0, 1023]), and MAY include both; `NaN` and `±Infinity` SHALL be rejected.
4. THE Zone type SHALL include optional `href` (non-empty trimmed string, length 1 to 200 after trimming) and optional `order` (integer in the closed interval [0, 999]); THE Zone type SHALL NOT declare a `target` field in V1.1.
5. WHEN `buildLabScene()` is invoked with no arguments, THE Lab_Route SHALL produce a scene whose `zones` array contains exactly seven Zone entries at indices 0..6 in the declaration order: village square, course signpost, library, radio booth, post office, market, review garden.
6. THE seven Zone entries SHALL each declare a `learningIntent` whose value, after trimming, exactly matches the documented case-sensitive string: village square = "orientation/home hub", course signpost = "continue course / next lesson", library = "reading/vocabulary/references", radio booth = "listening/pronunciation", post office = "writing/messages/submissions", market = "shop/rewards/Fucoin preview", review garden = "spaced repetition/review".
7. WHEN `buildLabScene()` is invoked twice in the same process, THE returned scenes SHALL be deeply equal, AND subsequent calls SHALL NOT mutate any prior returned scene.
8. WHEN two Zones in the same scene declare the same `objectId`, THEN THE scene builder SHALL throw a typed `LearningWorldError`, SHALL NOT return a partial scene, and the Learning_World_Canvas SHALL NOT mount.
9. WHEN a Zone declares an `objectId` that does not match any `WorldObject.id` in the same scene, THEN THE scene builder SHALL throw a typed `LearningWorldError` and the Learning_World_Canvas SHALL NOT mount.
10. IF any Zone declares a malformed anchor (out-of-range coordinates, non-finite numbers, or both `visualAnchor` and `gridAnchor` absent), THEN THE scene builder SHALL throw a typed `LearningWorldError` and the Learning_World_Canvas SHALL NOT mount.
11. WHEN `zones` is omitted or empty, THE Learning_World_Canvas SHALL render the scene with zero Markers and zero path connectors, SHALL still render `WorldObject` entries, and SHALL NOT throw.
12. A Zone's referenced `WorldObject` is "interactive" if and only if it (a) exposes exactly one focusable element reachable via sequential keyboard focus, (b) is activatable by both pointer click and keyboard Enter or Space, and (c) emits exactly one navigation intent per activation; non-interactive `WorldObject` entries SHALL NOT be referenced by a Zone's `objectId`.

### Requirement 2: Path Connectors Driven by Zone Graph, Not by `objects[0]`

**User Story:** As a CTO/Tech Lead, I want path connectors to come from scene-defined waypoints rather than the legacy `objects[0]` hub assumption, so that the renderer is data-driven and resilient to scene reordering.

#### Acceptance Criteria

1. THE V1.1 slice SHALL remove all renderer logic that reads `objects[0]` as a hub; the connector renderer SHALL be a pure function of `WorldScene.waypoints` and/or `WorldScene.zoneGraph` and SHALL NOT depend on the array order of `WorldScene.objects`.
2. THE Waypoint type SHALL be `{ id: string; x: number; y: number }` where `id` is a trimmed string of length 1 to 64 after trimming, and `x` and `y` are finite IEEE-754 numbers; `NaN` and `±Infinity` SHALL be rejected.
3. THE Zone_Graph type SHALL be `zoneGraph?: { edges: ReadonlyArray<{ fromZoneId: string; toZoneId: string }> }` where each `fromZoneId` and `toZoneId` is a trimmed string of length 1 to 64 after trimming; both endpoints SHALL reference Zone `id` values present in the same scene's `zones` array, AND `fromZoneId !== toZoneId` (no self-loops); edges that violate either condition SHALL be treated as invalid per criterion 8.
4. WHEN both `waypoints` and `zoneGraph` are present on a scene, THE renderer SHALL apply the following precedence ladder for connector geometry:
   1. IF `waypoints` is present and contains at least two valid entries, THE renderer SHALL draw connectors from `waypoints` ONLY and SHALL ignore `zoneGraph` for connector geometry.
   2. ELSE IF `zoneGraph` is present and contains at least one valid edge, THE renderer SHALL draw connectors from valid `zoneGraph` edges, deriving each edge's geometry from the source Zone's projected anchor (`visualAnchor` if present, else `gridAnchor` projected to viewport CSS pixels) to the target Zone's projected anchor.
   3. ELSE THE renderer SHALL skip the connector layer.
5. WHEN `waypoints` and `zoneGraph` are both omitted, THE Learning_World_Canvas SHALL skip the connector layer, SHALL NOT throw, SHALL NOT log at error level, and SHALL still mount the scene.
6. IF `waypoints` is present and contains fewer than two valid entries, OR contains any entry with non-finite `x` or `y`, OR contains duplicate `id` values, THEN THE renderer SHALL skip the `waypoints` connector layer for that scene, SHALL fall through to the `zoneGraph` branch of criterion 4 if applicable, and SHALL NOT throw.
7. WHEN `waypoints` contains N valid entries with `2 <= N <= 256` and is the selected branch per criterion 4, THE renderer SHALL draw exactly `N - 1` connector segments in array order (index 0 to index 1, ..., index N-2 to index N-1), on a layer above zone background and below interactive `WorldObject` entries.
8. IF a `zoneGraph` edge references a Zone id absent from the scene's `zones` array, OR is a self-loop where `fromZoneId === toZoneId`, THEN THE renderer SHALL skip that edge, SHALL render the remaining valid edges, and SHALL NOT throw.
9. THE V1.1 slice SHALL include a unit test that permutes `WorldScene.objects` (including moving non-zone objects into and out of index 0) and asserts that the renderer produces a deterministic, deeply-equal Connector_Segment_List for the same scene under any permutation of `WorldScene.objects`; the assertion SHALL compare the segment list as a `ReadonlyArray<{ fromX: number; fromY: number; toX: number; toY: number }>` via deep equality and SHALL NOT assert pixel-level or byte-level equality of the rendered canvas.

### Requirement 3: Visual Zone Markers Distinguishable at Three Viewports

**User Story:** As a Product Designer, I want each Zone to have a small, restrained visual marker so that the seven destinations are individually distinguishable without obscuring the artwork.

#### Acceptance Criteria

1. WHEN a scene declares Zones, THE Learning_World_Canvas SHALL render exactly one Marker per Zone, anchored to the Zone's `visualAnchor` or `gridAnchor`, where `visualAnchor` takes precedence when both are present.
2. Markers MAY be implemented as DOM overlay elements OR as canvas-rendered shapes. Canvas-rendered Markers SHALL expose a test-only API returning, for each visible Marker, its Zone `id` and an axis-aligned bounding box `{ x, y, width, height }` in CSS pixels. DOM Markers SHALL be discoverable via `getBoundingClientRect()`.
3. WHEN the lab is rendered at viewport 390x844 CSS px (devicePixelRatio normalized to 2), in steady state (no in-flight tween, all marker images decoded), THE Markers SHALL produce zero pairwise visual overlap among visible Markers, where overlap is defined as bounding-box intersection area strictly greater than 0 CSS px.
4. WHEN the lab is rendered at viewport 1280x800 CSS px in steady state, all seven Markers SHALL produce zero pairwise visual overlap measured as in criterion 3.
5. Marker labels SHALL use the Zone's `shortLabel` text and SHALL NOT exceed 24 visible characters.
6. Marker text SHALL achieve a contrast ratio of at least 4.5:1 against its rendered background per WCAG 2.1 SC 1.4.3, computed via the relative-luminance formula on the result of `getComputedStyle().color` and the effective background color sampled at the marker's geometric center, with alpha-compositing for any transparent layers.
7. Markers SHALL NOT obscure more than 15 percent of any required `WorldObject` `Core_Artwork_Bounds` rectangle (projected to viewport CSS pixels), where occlusion equals (intersection area of the Marker bounding box and the projected `coreArtworkBounds`) divided by (area of the projected `coreArtworkBounds`); IF a `WorldObject` does not declare `coreArtworkBounds`, THEN THE test SHALL use the WorldObject's full projected sprite or image bounding box as the fallback Core_Artwork_Bounds for this calculation.
8. WHILE the Reduced_Motion_Preference matches `(prefers-reduced-motion: reduce)`, THE Markers SHALL render in a steady state with `getComputedStyle().animationName === "none"` and `transitionProperty === "none"` for non-essential properties (no idle pulse, no hover bobbing, no entrance tween).
9. WHEN the user toggles `prefers-reduced-motion` after mount, THE Markers SHALL react via the `MediaQueryList` `change` event within 200 ms by cancelling any in-flight non-essential animation and assuming the steady state in criterion 8, without remounting the canvas.
10. WHEN a Hotspot_Chip receives `:focus-visible` (keyboard) OR `:hover` or `pointerenter` (mouse), THE corresponding Marker SHALL receive a visible highlight (for example, increased outline width or background tint) within 100 ms, with identical visual treatment for both input modalities.
11. IF the chip-to-marker highlight wiring in criterion 10 cannot be implemented within the V1.1 slice, THEN THE failure SHALL be recorded as a known gap in the Codex QA report referenced in Requirement 9 and SHALL NOT block V1.1 sign-off.

### Requirement 4: Semantic Accessibility Aligned to Zones

**User Story:** As a Product Designer validating accessibility, I want every visible Zone marker to have a matching Hotspot_Chip in the same order with a non-empty accessible name, so that keyboard and assistive-technology users perceive the same learning structure.

#### Acceptance Criteria

1. WHEN a scene declares Zones, THE Hotspot_List SHALL render exactly one Hotspot_Chip per Zone, expose itself as a single list container, and expose each Hotspot_Chip as a list item child of that container.
2. THE Hotspot_List SHALL render its chips in chip order: ascending finite-numeric Zone `order` first; ties or missing `order` are broken by the Zone's index in the `zones` array.
3. THE accessible name of each Hotspot_Chip SHALL equal the first non-empty trimmed value from the ladder Zone `title` then Zone `shortLabel` then Zone `id`, with length 1 to 200 characters after trimming.
4. IF all of `title`, `shortLabel`, and `id` are missing, empty after trimming, or exceed 200 characters after trimming, THEN THE Hotspot_List SHALL NOT render a Hotspot_Chip for that Zone.
5. WHEN the user presses Tab from the element immediately preceding the Hotspot_List, focus SHALL traverse Hotspot_Chips in the order defined by criterion 2; Shift+Tab from any focused Hotspot_Chip SHALL return focus to the previous chip, or to the element preceding the Hotspot_List when on the first chip.
6. WHILE a Hotspot_Chip has keyboard focus, THE Hotspot_Chip SHALL display a visible focus indicator with contrast ratio at least 3:1 versus the surrounding background, measured per WCAG 2.1 relative luminance.
7. WHERE the Marker highlight in Requirement 3 criterion 10 is implemented, WHEN a Hotspot_Chip gains keyboard focus, THE corresponding Marker SHALL receive that highlight within 100 ms; on focus loss the Marker SHALL remove the highlight within 100 ms unless still hovered.
8. WHEN a Hotspot_Chip without an `href` is activated by the activation gesture defined for its implementation path in criterion 9, THE Lab_Route SHALL update only in-memory selection or focus state for that Zone within the current page instance.
9. THE Hotspot_Chip activation behavior SHALL satisfy exactly one of the following two implementation paths, and the chosen path SHALL produce exactly one navigation intent per activation:
   - Path A (anchor element): IF the Hotspot_Chip is implemented as a native HTML anchor (`<a href="...">`), THEN activation SHALL occur on Enter following native browser behavior, AND the Hotspot_Chip SHALL NOT bind a custom Space-key handler. Space-key presses on a focused anchor SHALL behave per browser default (typically scroll the page) and SHALL NOT trigger navigation.
   - Path B (button-like element with a custom handler): IF the Hotspot_Chip is implemented as a non-anchor element (for example `<button>` or a `role="button"` element) that performs navigation imperatively, THEN activation SHALL occur on EITHER Enter or Space, AND the Space-key handler SHALL call `event.preventDefault()` to suppress page scroll AND SHALL trigger the navigation intent exactly once per key press (no double-trigger across `keydown` and `keyup`).
10. WHEN a Hotspot_Chip with a non-empty `href` is activated per the path selected in criterion 9, AND the `href` is an internal route, THE Lab_Route SHALL navigate via same-document SPA routing in the same browsing context, with no other state change; activation SHALL NOT open any new browsing context (no `target="_blank"` handling exists in V1.1).
11. IF a Hotspot_Chip is activated under either path in criterion 9, THEN, regardless of path, THE Lab_Route SHALL NOT issue HTTP POST/PUT/PATCH/DELETE, SHALL NOT write to `localStorage`, `sessionStorage`, or cookies, SHALL NOT open or write any IndexedDB database, and SHALL NOT emit any analytics or telemetry event from the activation handler.

### Requirement 5: Responsive Composition at Mobile, Desktop, and Wide Desktop

**User Story:** As a Product Designer, I want the world to remain readable and well-composed at mobile, standard desktop, and wide desktop, so that internal reviewers see a learning map at every test viewport.

#### Acceptance Criteria

1. WHEN the Lab_Route is rendered at CSS-pixel viewport 390x844 (DPR-independent), THE Hotspot_List SHALL expose all seven Zones as keyboard-reachable Hotspot_Chips, AND at least five of seven Markers SHALL be visible inside the canvas viewport without overlap as defined in Requirement 3, AND `document.body.scrollWidth <= document.body.clientWidth`.
2. WHEN the Lab_Route is rendered at 390x844, THE canvas and the first row of Hotspot_Chips SHALL both lie inside the first viewport (the rectangle `[0, 0, 390, 844]` with `window.scrollY === 0`, no scrolling required), with chip font size at least 12 CSS px and contrast ratio at least 4.5:1.
3. WHEN the Lab_Route is rendered at 1280x800, all seven Markers SHALL be visible inside the canvas viewport, OR at least five SHALL be visible and the remaining Markers SHALL be intentionally grouped into exactly one visible cluster DOM node bearing an accessible name (via `aria-label`, `aria-labelledby`, or visible text) reflecting the grouped Zones, plus a visible count indicator.
4. WHEN the Lab_Route is rendered at 1280x800, THE canvas and first row of Hotspot_Chips SHALL both lie inside the first viewport, AND `document.body.scrollWidth <= document.body.clientWidth`.
5. WHEN the Lab_Route is rendered at 1920x1080, THE canvas SHALL be horizontally centered within its content column, measured as `abs((canvas.offsetLeft + canvas.clientWidth / 2) - (parent.clientWidth / 2)) <= 1` CSS px.
6. AT viewport 1920x1080, the canvas rendered width SHALL satisfy `min(960, parent.clientWidth) <= canvas.clientWidth <= min(1280, parent.clientWidth)`, capping the upper bound to prevent edge-to-edge stretch.
7. WHEN the viewport is resized, THE Learning_World_Canvas SHALL recompute layout exactly once on the next `requestAnimationFrame`, with no more than one layout reflow per resize event, and SHALL NOT remount the canvas.
8. IF a Marker bounding box would intersect the canvas viewport edge at any tested viewport, THEN THE Learning_World_Canvas SHALL hide the Marker (`display: none`) or skip its render rather than draw it clipped.

### Requirement 6: Framework-agnostic Core Preserved

**User Story:** As a CTO/Tech Lead, I want Zone and Waypoint types to live in the framework-agnostic core, so that the engine remains portable and the production code paths are not coupled to the lab.

#### Acceptance Criteria

1. THE Zone, Waypoint, and Zone_Graph types SHALL be declared in files located under the directory `apps/web/src/lib/learning-world/` (the Learning_World_Core), SHALL be expressed as plain TypeScript `interface` or `type` declarations with no runtime class, decorator, or executable initializer at module top level, and SHALL be the only types in scope of the V1.1 static-scan check defined in criteria 4 through 7.
2. THE V1.1 static-scan check SHALL apply to the Scanned_File_Set defined as: (a) every NEW file introduced by V1.1 under `apps/web/src/lib/learning-world/`, AND (b) every EXISTING file under `apps/web/src/lib/learning-world/` whose content is modified by V1.1 in this branch (for example, `world-scene.ts` extended with `zones`, `waypoints`, or `zoneGraph`); the Scanned_File_Set explicitly INCLUDES `world-scene.ts` if V1.1 modifies it, even though it was previously covered by the V0 scan; the Scanned_File_Set SHALL exclude only files under `apps/web/src/lib/learning-world/` that V1.1 does NOT modify and does NOT introduce, AND SHALL exclude transitive ancestors outside `apps/web/src/lib/learning-world/`.
3. IF any file in the Scanned_File_Set contains an import statement whose module specifier exactly equals `react`, `react-dom`, or `next`, or begins with `react/`, `react-dom/`, `next/`, or `@fuxie/ui` (matching `@fuxie/ui` exactly or `@fuxie/ui/` as a prefix), THEN THE static-scan unit test SHALL fail and SHALL emit an error indicating the offending file path and module specifier; this rule SHALL apply to value imports, side-effect imports, namespace imports, re-exports (`export ... from`), dynamic `import(...)` calls, and `import type` / `export type` declarations alike.
4. IF any file in the Scanned_File_Set references any of the identifiers `HTMLElement`, `HTMLCanvasElement`, `CanvasRenderingContext2D`, `Window`, `Document`, or `Navigator` as a token in its source text outside line and block comments, THEN THE static-scan unit test SHALL fail and SHALL emit an error indicating the offending file path and identifier.
5. THE static-scan unit test SHALL be implemented under `apps/web/src/lib/learning-world/__tests__/`, SHALL determine violations by reading each file in the Scanned_File_Set as UTF-8 text and applying deterministic regular-expression matches against the raw source with comments stripped before matching, and SHALL NOT use a TypeScript or Babel AST parser, SHALL NOT add a runtime or dev dependency to `package.json`, SHALL NOT introduce a CI job, and SHALL NOT add a `package.json` script.
6. WHEN the static-scan unit test runs and the Scanned_File_Set is empty, THE static-scan unit test SHALL fail and SHALL emit an error indicating that no V1.1 changes under `apps/web/src/lib/learning-world/` were detected (no in-scope files were found).
7. IF any file in the Scanned_File_Set imports, directly or transitively through other files inside `apps/web/src/lib/learning-world/`, any module whose resolved path begins with `apps/web/src/app/dashboard/`, `apps/web/src/app/course/`, or any Skill Player route directory under `apps/web/src/app/`, THEN THE static-scan unit test SHALL fail and SHALL emit an error indicating the offending file path and forbidden import target.

### Requirement 7: Visual Quality Target and Learning-Map Read

**User Story:** As a Product Manager EdTech, I want the lab to read as a learning map and to score at least 80 percent on the internal Visual_Wow scale, so that V1.1 is justified as a comprehension upgrade and not a cosmetic tweak.

#### Acceptance Criteria

1. WHEN the V1.1 slice browser-QA capture runs, THE V1.1 slice SHALL produce screenshots at exactly three viewports (390x844, 1280x800, and 1920x1080) and SHALL save them to the paths declared in Requirement 9, with all three files present and non-empty.
2. WHEN the Codex reviewer scores the V1.1 lab on the Visual_Wow scale, THE Codex reviewer SHALL record exactly one Visual_Wow score per V1.1 slice as an integer percentage from 0 to 100 in the Codex QA report referenced in Requirement 9, and that recorded score SHALL be at least 80.
3. WHEN the Codex reviewer applies the Reviewer_3s_Test, THE Codex reviewer SHALL record in the Codex QA report referenced in Requirement 9 a four-item checklist with an explicit pass or fail mark for each of: (a) the surface is identifiable as a Fuxie learning world, (b) seven destinations are countable, (c) each destination maps to a stated learning intent, and (d) the keyboard/semantic chip order matches the visual zone order; the Reviewer_3s_Test SHALL be marked failed if any one of (a), (b), (c), or (d) is marked fail.
4. THE rendered scene SHALL NOT read as a single composite image cluster, evidenced in the Codex QA report by an explicit confirmation that at least two distinct destination marker clusters are perceivable, that destination labels are legible without zooming the captured screenshot, and that a path or waypoint structure connecting destinations is visible.
5. THE V1.1 slice SHALL NOT (a) copy or import Mykonos-origin assets, (b) use Mykonos place names or Mykonos character names, (c) display Greek-island labels or text suggesting a Mykonos setting, or (d) intentionally reproduce the Mykonos Greek-island theme (for example, a coordinated palette and prop set chosen to evoke Mykonos). Existing assets sourced from the Fuxie_Asset_Registry that happen to use blue roofs, blue domes, or blue color tones are PERMITTED, provided they are not Mykonos-origin and are not arranged to recreate the Mykonos theme.

### Requirement 8: Testing - New and Preserved

**User Story:** As a QA Automation Engineer, I want preserved coverage plus targeted new tests, so that V1.1 ships without regressing the V0 / V1 polish-1 baseline of 276 passing tests.

#### Acceptance Criteria

1. WHEN the command `pnpm --filter @fuxie/web test -- src/lib/learning-world src/components/learning-world` is executed on the V1.1 branch on a CI runner of equivalent class to the V1 polish-1 baseline runner, THE wall-clock time from process start to process exit SHALL be at most 15 minutes, and the run SHALL report zero failed and zero errored tests.
2. IF any test recorded as passing in the V1 polish-1 baseline reporter output (committed at the V1 polish-1 tag) is reported skipped, pending, or todo on V1.1, THEN the run SHALL be treated as failed and the divergent test identifiers SHALL be surfaced in the failure output.
3. THE V1.1 branch SHALL preserve all 276 tests passing on the V1 polish-1 baseline AND SHALL add new tests covering criteria 5 through 10.
4. THE V1.1 slice SHALL include AT LEAST one focused test suite per category (Zone metadata validation, Hotspot_List order, path-graph no-`objects[0]`, graceful degradation, chip contrast, deny-list scan), co-located in a `__tests__/` directory adjacent to the module under test; categories MAY be split across multiple files when implementation grouping makes that natural; the only hard rule is that every category from criteria 5 through 10 SHALL have at least one passing assertion in some test file under the V1.1 branch.
5. THE Zone-metadata-validation test SHALL assert non-empty trimmed `id`, `objectId`, `title`, `shortLabel`, and `learningIntent` within their declared length bounds; that at least one of `visualAnchor` or `gridAnchor` is present; and that duplicate `objectId` across Zones is rejected per Requirement 1 criterion 8.
6. THE Hotspot_List-order test SHALL assert that rendered chip order equals the precedence rules of Requirement 4 criterion 2.
7. THE path-graph test SHALL assert that no permutation of `WorldScene.objects` (including moving non-zone objects in or out of index 0) changes the rendered connector geometry, per Requirement 2 criterion 9.
8. THE graceful-degradation test SHALL assert that scenes with `zones` omitted, with `waypoints` omitted, with fewer than two valid waypoints, with non-finite waypoint coordinates, or with duplicate waypoint ids render without throwing and without rendering connectors.
9. THE chip-contrast test SHALL assert that Hotspot_Chip computed `color` and computed `background-color` produce a ratio at least 4.5:1, computed by the WCAG 2.1 sRGB-to-linear transform and the relative-luminance formula `(L1 + 0.05) / (L2 + 0.05)`.
10. THE deny-list scan test SHALL assert that no file under `apps/web/src/lib/learning-world/`, `apps/web/src/components/learning-world/`, or `apps/web/src/app/fuxie-world-lab/` imports any production route module under `apps/web/src/app/dashboard/`, `apps/web/src/app/course/`, or any Skill Player route, AND SHALL assert that no learner-state writer module from the V0 deny-list (categories: course progress, lesson completion, XP, streak, Fucoin, exam attempts) is imported; the test SHALL cite the V0 spec for deny-list provenance rather than re-enumerate writer module paths.

### Requirement 9: Browser QA Handoff for Codex Review

**User Story:** As a QA Automation Engineer, I want a documented browser QA handoff so that Codex can run the lab locally, capture artifacts at three viewports, and produce a summary JSON for the gate review.

#### Acceptance Criteria

1. THE V1.1 slice SHALL document the exact local command sequence: `pnpm install` from the repository root, then `pnpm --filter @fuxie/web dev`.
2. IF the dev server is already running on the documented port, THEN THE Codex run SHALL reuse it (no second `pnpm dev` invocation); IF a non-Fuxie process is bound to the port, THEN THE Codex run SHALL fail-fast with a clear error and SHALL NOT produce screenshots or summary JSON.
3. THE V1.1 slice SHALL document the expected URL `/fuxie-world-lab` and the ready-state DOM indicator selector `canvas[data-fuxie-lab-ready="true"]`.
4. WHEN Codex performs browser QA, THE Codex run SHALL poll the ready-state selector at 250 ms intervals for a maximum of 30 seconds; IF the selector is not found within 30 seconds, THEN the run SHALL exit non-zero and SHALL NOT write any screenshot or summary JSON file.
5. WHEN the ready selector resolves, THE Codex run SHALL save screenshots to `tmp/browser-qa/fuxie-world-lab-v1-zone-clarity/mobile-390x844.png`, `tmp/browser-qa/fuxie-world-lab-v1-zone-clarity/desktop-1280x800.png`, and `tmp/browser-qa/fuxie-world-lab-v1-zone-clarity/desktop-1920x1080.png`; each screenshot SHALL be a viewport-only capture at exactly the configured size (no full-document scroll).
6. WHEN Codex performs browser QA, THE Codex run SHALL save a single `summary.json` at `tmp/browser-qa/fuxie-world-lab-v1-zone-clarity/summary.json` that is valid JSON parseable by `JSON.parse` (no comments, no trailing commas), containing per-viewport entries with fields `ready` (boolean), `viewport` (`{ width, height }`), `canvasRect` (`{ x, y, width, height }`), `panelRect` (`{ x, y, width, height }`), `hotspotCount` (integer), `zoneMarkerCount` (integer), `markerOverlapCount` (non-negative integer equal to the count of unordered marker pairs whose visible bounding-box intersection area in CSS pixels is strictly greater than 0), `bodyScrollWidth` (integer), `bodyClientWidth` (integer), `consoleErrors` (array of strings, severity "error" only, excluding "warn", "info", "log", and "debug"), `chipComputedStyle` (object `{ color, backgroundColor }` sampled from the first chip in the list at idle, no `:hover`, no `:focus`, via `getComputedStyle`), `networkMutationCount` (non-negative integer equal to the count of HTTP requests with method `POST`, `PUT`, `PATCH`, or `DELETE` observed during the 10-second window after the ready-state indicator appears), and `storageWriteCount` (non-negative integer equal to the count of `localStorage.setItem`, `sessionStorage.setItem`, `document.cookie` assignments, and IndexedDB write operations observed during the same 10-second window).
7. THE summary JSON SHALL show `consoleErrors` as an empty array for each viewport over the first 10 seconds after the ready-state indicator appears.
8. THE summary JSON SHALL show `bodyScrollWidth <= bodyClientWidth` at every tested viewport.
9. THE summary JSON SHALL show `hotspotCount === 7` and `zoneMarkerCount` per Requirement 5 visibility rules (at least 5 at 390x844; all 7 OR 5 plus a visible cluster at 1280x800; all 7 at 1920x1080).
10. THE summary JSON SHALL show `networkMutationCount === 0` AND `storageWriteCount === 0` for every viewport, providing runtime proof that the Lab_Route performed no learner-state writes during the 10-second post-ready window per the Not Allowed list.

## Scope

### Allowed Paths (read and write)

- `apps/web/src/lib/learning-world/` — extend types and renderer logic; add new modules.
- `apps/web/src/components/learning-world/` — extend `LearningWorldCanvas`, `HotspotList`, and add Marker/overlay components.
- `apps/web/src/app/fuxie-world-lab/` — extend the lab route, scene builder, and noindex layout metadata.
- New tests under matching `__tests__/` directories of the paths above.
- New internal smoke script under `tmp/v0-smoke/` or `tmp/v1-smoke/`.
- New browser QA artifacts under `tmp/browser-qa/fuxie-world-lab-v1-zone-clarity/`.

### Not Allowed

- THE V1.1 slice SHALL NOT modify Dashboard, Course, or Skill Player Production_Surface code paths.
- THE V1.1 slice SHALL NOT link `/fuxie-world-lab` from any production navigation, footer, sitemap, or in-app link.
- THE V1.1 slice SHALL NOT write learner progress, XP, streak, Fucoin, course progress, or lesson completion state.
- THE V1.1 slice SHALL NOT introduce audio (no `AudioContext`, no `HTMLAudioElement`, no audio asset import).
- THE V1.1 slice SHALL NOT introduce a runtime scene authoring or admin builder UI.
- THE V1.1 slice SHALL NOT copy or import Mykonos-origin assets, use Mykonos place names or character names, display Greek-island labels, or intentionally reproduce the Mykonos Greek-island theme; existing Fuxie_Asset_Registry assets that happen to use blue roofs, blue domes, or blue color tones remain permitted provided they are not Mykonos-origin and are not arranged to recreate the Mykonos theme.
- THE V1.1 slice SHALL NOT import React, Next.js, or any UI package into `apps/web/src/lib/learning-world/`.
- THE V1.1 slice SHALL NOT replace the existing engine; it SHALL extend conservatively.

## Non-Goals (Out of Scope for V1.1)

- Production Dashboard / Course / Skill Player integration.
- Real learner progress wiring (XP, streak, Fucoin, lesson state).
- Analytics events or telemetry.
- Audio (voiceover, ambient, SFX).
- Runtime scene editing inside the lab.
- New asset pipeline or sprite atlas.
- CEFR personalization.
- Reward economy logic.
- Teacher or admin world editor.
- New browsing context (`target="_blank"`) navigation from Hotspot_Chips is out of scope for V1.1.

## Design Direction

This section is constraint, not implementation; it informs `design.md` in the next phase.

- Keep the current polished dark-blue lab frame from V1 polish-1.
- Keep Hotspot_Chips readable; do not redesign the chip surface in this slice.
- Add clarity, not clutter: prefer small, restrained labels and pin-style markers over large callout cards.
- Use path and waypoint visuals to imply learning flow between zones.
- Make the world feel "alive enough" for internal review without being noisy.
- Avoid marketing landing-page aesthetics; this is an internal prototype, not a hero page.
- Ensure markers feel like map annotations, not UI overlays competing with the artwork.

## Go/No-Go Criteria for Codex Review

The V1.1 slice SHALL be considered "GO for internal V1.1" only when ALL of the following hold:

1. All seven Zones are defined in scene metadata per Requirement 1.
2. The `objects[0]` hub assumption is removed and the path graph is driven by Zone/Waypoint data per Requirement 2.
3. Zone Markers are visible and labeled at all three QA viewports (390x844, 1280x800, 1920x1080) per Requirements 3 and 5.
4. Hotspot_List order matches Zone order, and every chip has a non-empty accessible name per Requirement 4.
5. No Production_Surface files were modified per Scope and Requirement 6.
6. No learner-state writes occur during the 10-second post-ready QA window, evidenced by Requirement 4 criterion 11 (no HTTP POST/PUT/PATCH/DELETE, no `localStorage`/`sessionStorage`/cookie writes, no IndexedDB writes, no analytics from chip activation), Requirement 8 criterion 10 (deny-list scan: no learner-state writer modules imported), AND Requirement 9 criterion 10 (`networkMutationCount === 0` AND `storageWriteCount === 0` per viewport).
7. All 276 V1 polish-1 tests still pass, and the V1.1 new tests in Requirement 8 pass.
8. Browser QA artifacts are produced per Requirement 9 (three screenshots plus `summary.json`).
9. Codex Visual_Wow score is at least 80 percent per Requirement 7.

If any of the nine criteria fails, the slice SHALL be marked NO-GO for V1.1 and the failure SHALL be recorded in the Codex QA report before any further roadmap step is taken.
