# Third-Party Notices — `apps/web`

This file collects copyright and license notices for third-party code that
has been adapted into the Fuxie web application. New entries are appended
to this file; the file is strictly additive.

When a Fuxie source file adapts code from a third-party project, that file
also carries a first-10-lines header comment naming the upstream module
and its license, and the file path is listed in the relevant
"Adapted Modules in Fuxie" subsection below.

---

## Mykonos Voxel Engine — MIT License

Source: <https://github.com/boona13/mykonos-island-voxels>
Vendored research snapshot in this repository: `tmp/vendor-research/mykonos-island-voxels`.

The following copyright line and license text are reproduced verbatim from
the upstream `LICENSE` file:

> MIT License
>
> Copyright (c) 2026 boona13
>
> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all
> copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
> SOFTWARE.

### Adapted Modules in Fuxie

Each row maps a Fuxie source file to the upstream Mykonos module it was
adapted from. Only algorithmic structure and public-API conventions were
adapted; no Mykonos image, audio, video, font, or stylesheet asset is
copied into this repository. The Mykonos Greek-island theme, place names,
character names, and themed props are not used anywhere in the Fuxie
learning-world lab scene.

| Fuxie file | Upstream Mykonos module | Notes |
| --- | --- | --- |
| `apps/web/src/lib/learning-world/iso-grid.ts` | `src/grid/IsoGrid.js` (`IsoGrid`) | Diamond / 2:1 isometric projection math. |
| `apps/web/src/lib/learning-world/world-camera.ts` | `src/core/Camera.js` (`Camera`) | Pan / zoom transform, screen ↔ world inverse. |
| `apps/web/src/lib/learning-world/world-object.ts` | `src/building/PlacedObject.js` (`PlacedObject`) | Placed-object data shape and footprint conventions. |
| `apps/web/src/lib/learning-world/world-map.ts` | `src/grid/TileMap.js` (`TileMap`) | Tile-map / occupancy index and footprint marking. |
| `apps/web/src/lib/learning-world/world-canvas-context.ts` | `src/core/Camera.js` / canvas usage in `src/core/Renderer.js` | Lighter adaptation: structural canvas-context seam inspired by upstream canvas usage; no algorithmic copy. |

### Asset and Theme Exclusions

The following are **not** copied or used:

- Mykonos image assets (`assets/`, `asets reference.png`, `full city.png`).
- Mykonos audio assets (`*.ogg` files in the upstream root).
- Mykonos stylesheets (`styles.css`).
- Mykonos fonts and video.
- Greek-island theme, place names, character names, and themed props.

---

## V0 PR Manual Review Checklist

Reviewers MUST tick both columns for every adapted file before merging the
V0 lab PR. The PR description should reference this section by linking to
this file. The checklist is duplicated here so the artifact is stable and
auditable in the repository, not only in the PR thread.

For each adapted file:

- "Header comment present" means the file's first 10 lines contain a
  comment naming the Mykonos upstream module and its MIT license.
- "THIRD_PARTY_NOTICES entry present" means the file path appears in the
  "Adapted Modules in Fuxie" table above, with a non-empty upstream
  module mapping.

| Adapted file | Header comment present | THIRD_PARTY_NOTICES entry present |
| --- | --- | --- |
| `apps/web/src/lib/learning-world/iso-grid.ts` | [x] | [x] |
| `apps/web/src/lib/learning-world/world-camera.ts` | [x] | [x] |
| `apps/web/src/lib/learning-world/world-object.ts` | [x] | [x] |
| `apps/web/src/lib/learning-world/world-map.ts` | [x] | [x] |
| `apps/web/src/lib/learning-world/world-canvas-context.ts` | [x] | [x] |

> Initial verification by Task 14.1 implementer: all five files carry an
> MIT-attribution header comment within the first 10 lines, and all five
> file paths are listed in the "Adapted Modules in Fuxie" table above.
> Reviewers should still re-verify before merge.
>
> Observation flagged for follow-up (out of scope for this task): the
> in-file header parentheticals reference upstream paths under `lib/`
> (`lib/iso/iso-grid.js`, `lib/camera/camera.js`, `lib/iso/placed-object.js`,
> `lib/iso/tile-map.js`). The actual upstream layout in
> `tmp/vendor-research/mykonos-island-voxels` uses `src/grid/IsoGrid.js`,
> `src/core/Camera.js`, `src/building/PlacedObject.js`, and
> `src/grid/TileMap.js`. The canonical mapping in the table above uses
> the correct paths, so the legally-binding attribution is accurate.
> Aligning the in-file header parentheticals with the actual upstream
> paths is a small editorial fix that should be picked up by a separate
> task.

Reviewers should also confirm:

- [ ] No Mykonos image, audio, video, font, or stylesheet asset has been added under `apps/web/public/` or `apps/web/src/`.
- [ ] No Mykonos Greek-island theme, place names, character names, or themed props appear in the lab scene copy, asset keys, or aria-labels.
