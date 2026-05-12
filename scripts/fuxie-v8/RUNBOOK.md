# Fuxie V8 External Tool Runbook

This runbook is intentionally explicit because Hunyuan3D and UniRig are external model/code stacks.

## 1. Confirmation Gate

Before running anything in this file, get action-time confirmation from the user. These steps clone external repositories and install/run newly acquired software/model code.

## 2. Local Environment Facts

Current detected baseline:

- GPU: NVIDIA GeForce RTX 3060 12GB
- CUDA driver/runtime visible through `nvidia-smi`
- Blender CLI: available at `C:\Program Files\Blender Foundation\Blender 5.1\blender.exe`
- Python currently detected by `py -0p`: Python 3.13 only

Hunyuan3D/UniRig should use an isolated Python 3.10 or 3.11 environment. Do not install their dependencies into the app workspace Python.

## 3. Setup External Tools

After confirmation, run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/fuxie-v8/setup_external_tools.ps1
```

If Python 3.10 is missing, install Python 3.10 first or use a conda/micromamba environment. Keep all tool clones and caches under `.ai3d/`.

## 4. Prepare Inputs

Already scaffolded:

```powershell
python scripts/fuxie-v8/prepare_fuxie_v8_inputs.py
```

Input manifest:

```text
blender/fuxie/hunyuan_v8/input/Fuxie_hunyuan_v8_input_manifest.json
```

## 5. Hunyuan Candidate Generation

Generate 3-5 candidates from the prepared primary front/three-quarter references. Prefer local low-VRAM settings first on RTX 3060 12GB.

Required candidate names:

```text
blender/fuxie/hunyuan_v8/candidates/fuxie_hunyuan_v8_c01.glb
blender/fuxie/hunyuan_v8/candidates/fuxie_hunyuan_v8_c02.glb
blender/fuxie/hunyuan_v8/candidates/fuxie_hunyuan_v8_c03.glb
```

Pick the best candidate and copy it to:

```text
blender/fuxie/hunyuan_v8/candidates/fuxie_hunyuan_v8_selected.glb
```

## 6. UniRig + Blender Finalization

Run UniRig against the selected mesh when available, then import the rigged output into Blender for polish. If UniRig output is not usable, the Blender finalizer provides a placeholder rig contract for animation/export so QA can continue, but production acceptance still requires weight polish.

Finalize/export:

```powershell
& "C:\Program Files\Blender Foundation\Blender 5.1\blender.exe" --background --python blender/fuxie/create_fuxie_character_v8_hunyuan_finalize.py
```

Validate:

```powershell
node scripts/fuxie-v8/validate_fuxie_v8_glb.mjs assets/models/Fuxie_Character_v8_hunyuan_animated.glb
pnpm --filter @fuxie/web typecheck
```

## 7. Browser QA

Open or reload:

```text
http://localhost:3032/fuxie-live-qa
```

Acceptance:

- V8 section appears after `apps/web/public/mascot-3d/live/fuxie-hunyuan-v8.glb` exists.
- Six V8 states run as WebGL.
- Console errors: 0.
- Runtime `data-fps`: at least 58 sustained, target 60.
