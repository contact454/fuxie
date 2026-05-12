# Fuxie V8 Hunyuan3D Pipeline

This folder contains the local orchestration notes and contracts for the V8 production-track pipeline:

1. Prepare Fuxie reference inputs from the existing 3D render set.
2. Generate 3-5 mesh candidates with Hunyuan3D 2.1.
3. Clean and validate the chosen mesh in Blender.
4. Rig with UniRig, then polish weights and add game animation clips in Blender.
5. Export GLB/FBX and QA in `fuxie-live-qa`.

Do not commit downloaded model checkpoints or external tool repositories. They live under `.ai3d/`, which is ignored.

V7B remains the runtime fallback until V8 is visually approved.
