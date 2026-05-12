from __future__ import annotations

import importlib.util
import json
import math
from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
BLENDER_DIR = ROOT / "blender" / "fuxie"
MODEL_DIR = ROOT / "assets" / "models"
PUBLIC_LIVE_DIR = ROOT / "apps" / "web" / "public" / "mascot-3d" / "live"

V18_SCRIPT = BLENDER_DIR / "create_fuxie_motion_polish_rig_v18.py"
spec = importlib.util.spec_from_file_location("fuxie_v18_base", V18_SCRIPT)
if spec is None or spec.loader is None:
    raise RuntimeError(f"Cannot load V18 motion rig script: {V18_SCRIPT}")
v18 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(v18)
v17 = v18.v17
v16 = v18.v16
v6b = v18.v6b


BLEND_PATH = BLENDER_DIR / "Fuxie_Character_v19_motion_balance_rig.blend"
GLB_PATH = MODEL_DIR / "Fuxie_Character_v19_motion_balance_rig.glb"
FBX_PATH = MODEL_DIR / "Fuxie_Character_v19_motion_balance_rig.fbx"
PREVIEW_PATH = BLENDER_DIR / "Fuxie_preview_v19_motion_balance_rig.png"
MANIFEST_PATH = BLENDER_DIR / "Fuxie_Character_v19_motion_balance_rig_manifest.json"
PUBLIC_GLB_PATH = PUBLIC_LIVE_DIR / "fuxie-motion-balance-rig-v19.glb"
PUBLIC_POSTER_PATH = PUBLIC_LIVE_DIR / "fuxie-motion-balance-rig-v19-poster.png"
PUBLIC_MANIFEST_PATH = PUBLIC_LIVE_DIR / "fuxie-motion-balance-rig-v19.json"
GENERATED_DIR = BLENDER_DIR / "generated" / "v19_motion_balance"
UNIFIED_SOURCE_ATLAS = GENERATED_DIR / "Fuxie_V19_MotionBalanceSourceClean.png"

CLIPS = {
    "idle": {"frames": 120, "description": "Balanced 60fps idle: visible breathing, soft head/ear/tail overlap, stable feet."},
    "wave": {"frames": 96, "description": "Balanced wave: readable greeting arc with restrained deformation for source-locked texture."},
    "talk": {"frames": 120, "description": "Balanced talk: mouth beat, head nod, and right-hand cue without stretching the torso."},
    "listen": {"frames": 120, "description": "Balanced listen: clear attentive tilt with ear/tail secondary motion."},
    "reward": {"frames": 96, "description": "Balanced reward: joyful mascot bounce, smaller limb angles, stronger timing."},
    "tryAgain": {"frames": 120, "description": "Balanced encouragement: friendly nod and small hand cue."},
}


def key_bone(armature: bpy.types.Object, bone_name: str, frame: int, loc=None, rot=None, scale=None) -> None:
    v6b.key_bone(armature, bone_name, frame, loc=loc, rot=rot, scale=scale)


def make_clip(armature: bpy.types.Object, name: str, frames: int, animator) -> None:
    v6b.make_clip(armature, name, frames, animator)


def animate(armature: bpy.types.Object) -> None:
    # V19 sits between V17 and V18: more readable than V18, less warpy than V17.
    def idle() -> None:
        for frame, lift, body, head, tail, ear in [
            (1, 0.000, 0.000, 0.000, 0.000, 0.000),
            (24, 0.015, -0.006, 0.008, 0.045, 0.020),
            (60, 0.002, 0.000, 0.000, -0.010, 0.000),
            (90, 0.015, 0.006, -0.008, -0.045, -0.020),
            (120, 0.000, 0.000, 0.000, 0.000, 0.000),
        ]:
            key_bone(armature, "root", frame, loc=(0, 0, lift), rot=(0, 0, body), scale=(1, 1 + lift * 0.26, 1))
            key_bone(armature, "chest", frame, rot=(0, 0, body * 0.45))
            key_bone(armature, "head", frame, rot=(0, 0, head))
            key_bone(armature, "tail.01", frame, rot=(0, 0, tail * 0.40))
            key_bone(armature, "tail.02", frame, rot=(0, 0, tail))
            key_bone(armature, "tail.03", frame, rot=(0, 0, tail * 0.80))
            key_bone(armature, "ear.L.01", frame, rot=(0, 0, -ear))
            key_bone(armature, "ear.R.01", frame, rot=(0, 0, ear))

    def wave() -> None:
        for frame, upper, fore, hand, body, lift, tail in [
            (1, 0.00, 0.00, 0.00, 0.000, 0.000, 0.000),
            (10, -0.10, -0.26, -0.06, -0.012, 0.010, 0.026),
            (22, -0.18, -0.46, 0.24, 0.010, 0.024, -0.032),
            (34, -0.14, -0.36, -0.22, -0.010, 0.014, 0.026),
            (46, -0.20, -0.50, 0.26, 0.012, 0.024, -0.034),
            (58, -0.14, -0.36, -0.22, -0.010, 0.014, 0.026),
            (72, -0.18, -0.46, 0.24, 0.010, 0.020, -0.026),
            (96, 0.00, 0.00, 0.00, 0.000, 0.000, 0.000),
        ]:
            key_bone(armature, "root", frame, loc=(0, 0, lift), rot=(0, 0, body), scale=(1, 1 + lift * 0.20, 1))
            key_bone(armature, "upper_arm.L", frame, rot=(0, 0, upper))
            key_bone(armature, "forearm.L", frame, rot=(0, 0, fore))
            key_bone(armature, "hand.L", frame, rot=(0, 0, hand))
            key_bone(armature, "head", frame, rot=(0, 0, -body * 0.55))
            key_bone(armature, "tail.02", frame, rot=(0, 0, tail))
            key_bone(armature, "tail.03", frame, rot=(0, 0, tail * 0.72))

    def talk() -> None:
        for frame in range(1, 121, 8):
            phase = frame // 8
            pulse = 1.0 if phase % 2 else 0.0
            mouth_open = 1.0 + 0.095 * pulse
            nod = 0.010 * math.sin(frame * 0.17)
            gesture = 0.050 * math.sin(frame * 0.25)
            key_bone(armature, "root", frame, loc=(0, 0, 0.007 * pulse))
            key_bone(armature, "head", frame, rot=(0, 0, nod))
            key_bone(armature, "jaw", frame, loc=(0, 0, -0.007 * pulse), scale=(1.0, mouth_open, 1.0))
            key_bone(armature, "upper_arm.R", frame, rot=(0, 0, gesture * 0.40))
            key_bone(armature, "forearm.R", frame, rot=(0, 0, gesture))
            key_bone(armature, "tail.02", frame, rot=(0, 0, 0.020 * math.sin(frame * 0.12)))

    def listen() -> None:
        for frame, head, chest, ear_l, ear_r, tail in [
            (1, 0.000, 0.000, 0.000, 0.000, 0.000),
            (24, -0.060, -0.014, 0.060, 0.030, 0.034),
            (60, -0.090, -0.022, 0.100, 0.044, -0.026),
            (96, -0.060, -0.014, 0.060, 0.030, 0.034),
            (120, 0.000, 0.000, 0.000, 0.000, 0.000),
        ]:
            key_bone(armature, "head", frame, rot=(0, 0, head))
            key_bone(armature, "chest", frame, rot=(0, 0, chest))
            key_bone(armature, "ear.L.01", frame, rot=(0, 0, ear_l))
            key_bone(armature, "ear.R.01", frame, rot=(0, 0, ear_r))
            key_bone(armature, "tail.01", frame, rot=(0, 0, tail * 0.38))
            key_bone(armature, "tail.02", frame, rot=(0, 0, tail))
            key_bone(armature, "tail.03", frame, rot=(0, 0, tail * 0.70))

    def reward() -> None:
        for frame, lift, squash, upper_l, upper_r, fore_l, fore_r, tail in [
            (1, 0.000, 1.000, 0.000, 0.000, 0.000, 0.000, 0.000),
            (10, -0.012, 0.982, -0.040, 0.040, -0.090, 0.090, -0.050),
            (22, 0.070, 1.032, -0.190, 0.190, -0.330, 0.330, 0.125),
            (36, 0.014, 0.990, -0.090, 0.090, -0.180, 0.180, -0.105),
            (50, 0.050, 1.022, -0.200, 0.200, -0.350, 0.350, 0.120),
            (72, 0.010, 0.996, -0.070, 0.070, -0.130, 0.130, -0.055),
            (96, 0.000, 1.000, 0.000, 0.000, 0.000, 0.000, 0.000),
        ]:
            key_bone(armature, "root", frame, loc=(0, 0, lift), scale=(1 / squash, squash, 1), rot=(0, 0, 0.018 * math.sin(frame)))
            key_bone(armature, "upper_arm.L", frame, rot=(0, 0, upper_l))
            key_bone(armature, "upper_arm.R", frame, rot=(0, 0, upper_r))
            key_bone(armature, "forearm.L", frame, rot=(0, 0, fore_l))
            key_bone(armature, "forearm.R", frame, rot=(0, 0, fore_r))
            key_bone(armature, "head", frame, rot=(0, 0, -0.024 * math.sin(frame * 0.20)))
            key_bone(armature, "tail.02", frame, rot=(0, 0, tail))
            key_bone(armature, "tail.03", frame, rot=(0, 0, tail * 0.75))

    def try_again() -> None:
        for frame, nod, upper, fore, hand, tail in [
            (1, 0.000, 0.000, 0.000, 0.000, 0.000),
            (30, 0.030, -0.016, -0.070, -0.024, 0.030),
            (60, -0.018, 0.016, 0.050, 0.018, -0.020),
            (90, 0.024, -0.012, -0.055, -0.018, 0.024),
            (120, 0.000, 0.000, 0.000, 0.000, 0.000),
        ]:
            key_bone(armature, "head", frame, rot=(0, 0, nod))
            key_bone(armature, "upper_arm.L", frame, rot=(0, 0, upper))
            key_bone(armature, "forearm.L", frame, rot=(0, 0, fore))
            key_bone(armature, "hand.L", frame, rot=(0, 0, hand))
            key_bone(armature, "tail.02", frame, rot=(0, 0, tail))

    make_clip(armature, "idle", 120, idle)
    make_clip(armature, "wave", 96, wave)
    make_clip(armature, "talk", 120, talk)
    make_clip(armature, "listen", 120, listen)
    make_clip(armature, "reward", 96, reward)
    make_clip(armature, "tryAgain", 120, try_again)


def write_manifest(character_collection: bpy.types.Collection, reference_collection: bpy.types.Collection) -> None:
    meshes = [obj for obj in character_collection.objects if obj.type == "MESH"]
    armature = next((obj for obj in character_collection.objects if obj.type == "ARMATURE"), None)
    manifest = {
        "name": "Fuxie_Character_v19_motion_balance_rig",
        "status": "motion_balanced_contour_source_skinned_candidate",
        "source_note": "V19 keeps V18's contour source identity mesh and retunes all clips between V17's readability and V18's restraint. It adds clearer timing and secondary head/ear/tail overlap while avoiding extreme rotations that stretch the source-locked texture.",
        "outputs": {
            "blend": str(BLEND_PATH.relative_to(ROOT)).replace("\\", "/"),
            "glb": str(GLB_PATH.relative_to(ROOT)).replace("\\", "/"),
            "fbx": str(FBX_PATH.relative_to(ROOT)).replace("\\", "/"),
            "preview": str(PREVIEW_PATH.relative_to(ROOT)).replace("\\", "/"),
            "public_glb": str(PUBLIC_GLB_PATH.relative_to(ROOT)).replace("\\", "/"),
            "public_poster": str(PUBLIC_POSTER_PATH.relative_to(ROOT)).replace("\\", "/"),
            "public_manifest": str(PUBLIC_MANIFEST_PATH.relative_to(ROOT)).replace("\\", "/"),
        },
        "stats": {
            "mesh_objects": len(meshes),
            "vertices_before_export_modifiers": sum(len(obj.data.vertices) for obj in meshes),
            "faces_before_export_modifiers": sum(len(obj.data.polygons) for obj in meshes),
            "bones": [bone.name for bone in armature.data.bones] if armature else [],
            "deform_bones": [bone.name for bone in armature.data.bones if bone.use_deform] if armature else [],
            "control_bones": [bone.name for bone in armature.data.bones if not bone.use_deform] if armature else [],
            "grid": {"cols": v17.GRID_COLS, "rows": v17.GRID_ROWS},
            "cleaned_source_atlas": str(UNIFIED_SOURCE_ATLAS.relative_to(ROOT)).replace("\\", "/"),
            "reference_planes": [obj.name for obj in reference_collection.objects],
            "fps": bpy.context.scene.render.fps,
            "clips": CLIPS,
            "target_runtime": "60fps WebGL contour source mesh with balanced motion clips",
        },
        "limits": [
            "V19 improves animation timing on the current 2.5D source-locked rig.",
            "It still cannot achieve true volumetric limb arcs without a modeled/retopologized 3D mesh.",
            "Tail edge cleanup still needs manual atlas painting or a better generated source.",
        ],
        "next_step": "Browser QA V19 against V18; if it reads better, make V19 current candidate.",
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")


def main() -> None:
    v18.BLEND_PATH = BLEND_PATH
    v18.GLB_PATH = GLB_PATH
    v18.FBX_PATH = FBX_PATH
    v18.PREVIEW_PATH = PREVIEW_PATH
    v18.MANIFEST_PATH = MANIFEST_PATH
    v18.PUBLIC_GLB_PATH = PUBLIC_GLB_PATH
    v18.PUBLIC_POSTER_PATH = PUBLIC_POSTER_PATH
    v18.PUBLIC_MANIFEST_PATH = PUBLIC_MANIFEST_PATH
    v18.GENERATED_DIR = GENERATED_DIR
    v18.UNIFIED_SOURCE_ATLAS = UNIFIED_SOURCE_ATLAS
    v18.CLIPS = CLIPS
    v18.install_globals()
    v18.ensure_dirs()
    v6b.clear_scene()
    v16.setup_scene()

    character_collection = v6b.make_collection("Fuxie_V19_MotionBalanceRig_Export")
    reference_collection = v6b.make_collection("Fuxie_V19_Source_References")
    v16.write_clean_source_atlas()
    armature = v6b.create_armature(character_collection)
    v16.rename_armature(armature)
    armature.name = "Fuxie_V19_MotionBalanceRig_Armature"
    armature.data.name = "Fuxie_V19_MotionBalanceRig_Skeleton"

    v17.create_contour_mesh(character_collection, armature)
    shadow = v6b.add_shadow(character_collection)
    v6b.bind_to_bone(shadow, armature, "root")

    v16.add_reference_planes(reference_collection)
    animate(armature)
    v6b.export_assets(character_collection)
    write_manifest(character_collection, reference_collection)
    v18.copy_public_assets()
    print(f"Saved V19 motion balance rig Blender file: {BLEND_PATH}")
    print(f"Exported V19 motion balance rig GLB: {GLB_PATH}")
    print(f"Exported V19 motion balance rig FBX: {FBX_PATH}")
    print(f"Rendered V19 motion balance rig preview: {PREVIEW_PATH}")


if __name__ == "__main__":
    main()
