# Fuxie Rigged 3D Character v1

Status: rig asset exported, Three.js runtime enabled for the Listening intro.

## Mandatory Visual Source

All Fuxie animation must use the existing Fuxie 3D image set as the visual source of truth. The rigged GLB is allowed only as a live 3D runtime expression of that same image style. The runtime must keep an image-animation layer from `/mascot-3d/optimized/...` for loading, fallback, reduced-motion, and static modes.

## Asset Outputs

- Editable source: `assets/fuxie-3d-source/fuxie-rigged-v1.blend`
- Runtime model: `apps/web/public/mascot-3d/live/fuxie-rigged-v1.glb`
- Poster fallback: `apps/web/public/mascot-3d/live/fuxie-rigged-v1-poster.png`
- Runtime manifest: `apps/web/public/mascot-3d/live/fuxie-rigged-v1.json`
- Generator script: `scripts/blender/create-rigged-fuxie-v1.py`

## Rig Contract

The GLB exports one skinned armature with segmented mesh parts bound to named bones.

Bones:

- `root`
- `body`
- `head`
- `ear.L`
- `ear.R`
- `upper_arm.L`
- `upper_arm.R`
- `hand.L`
- `hand.R`
- `leg.L`
- `leg.R`
- `foot.L`
- `foot.R`
- `tail.1`
- `tail.2`

Morph targets:

- `blink`
- `talkOpen`

Animation clips:

- `idle`
- `wave`
- `talk`
- `listen`
- `reward`
- `tryAgain`

## Runtime Contract

`FuxieLive3D` is available at:

`apps/web/src/components/gamification/fuxie-live-3d.tsx`

Props:

- `state`: `idle | wave | talk | listen | reward | tryAgain`
- `size`: `sm | md | lg | xl | number`
- `quality`: `adaptive | performance | static`
- `source`: `imageSet | rig`
- `fallbackSrc`: image fallback if the poster cannot load

Current default behavior uses `source="imageSet"` and renders state-based animation frames from `/mascot-3d/optimized/...`. This is the required default.

The image-set runtime preloads the Fuxie 3D images, then renders them through a 2D canvas with `requestAnimationFrame`. This keeps the visual source locked to the approved Fuxie 3D image set while animating at the browser refresh rate, targeting 60 FPS.

The optional rig path uses `source="rig"` with a lazy Three.js runtime. It renders the Fuxie image-set animation first, then upgrades to a WebGL canvas after `/mascot-3d/live/fuxie-rigged-v1.glb` loads. The component exposes `data-model-src`, `data-manifest-src`, `data-animation-state`, `data-quality`, `data-source`, and `data-runtime`.

Fallback stays active for WebGL failure, load timeout, `quality="static"`, and `prefers-reduced-motion`. The fallback is not a generic poster: it is a state-based image animation set built from the Fuxie 3D images.

## Three.js Runtime

Completed:

- Added `three` and `@types/three` to `@fuxie/web`.
- Added state-based Fuxie 3D image-set animation inside `FuxieLive3D`.
- Added optional lazy `GLTFLoader` runtime inside `FuxieLive3D`.
- Loads `/mascot-3d/live/fuxie-rigged-v1.glb`.
- Builds one `AnimationMixer` and cross-fades to the clip matching `state`.
- Keeps poster fallback for static/reduced-motion/error cases.
- Tested first on Listening intro only.

## Image Animation States

Each state uses four images from `/mascot-3d/optimized/...` and state-specific canvas timing:

- `idle`
- `wave`
- `talk`
- `listen`
- `reward`
- `tryAgain`

The dev-only QA route is `/fuxie-live-qa`; it is hidden with `notFound()` in production.

Latest QA target: `runtime="image-canvas"` with six state canvases and measured ~60 FPS on the local Chrome QA run.

## Next Backlog

1. Use `state="listen"` during audio playback and `state="idle"` or `wave` before playback.
2. Use `state="reward"` and `state="tryAgain"` in result screens.
3. Add lightweight performance logging for GLB load time and first rendered frame.
4. Roll out to other learning surfaces after Listening stays stable.
