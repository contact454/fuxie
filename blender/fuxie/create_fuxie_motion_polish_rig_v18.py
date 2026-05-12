from __future__ import annotations

import importlib.util
import json
import math
import shutil
from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
BLENDER_DIR = ROOT / "blender" / "fuxie"
MODEL_DIR = ROOT / "assets" / "models"
PUBLIC_LIVE_DIR = ROOT / "apps" / "web" / "public" / "mascot-3d" / "live"

V17_SCRIPT = BLENDER_DIR / "create_fuxie_contour_source_skinned_rig_v17.py"
spec = importlib.util.spec_from_file_location("fuxie_v17_base", V17_SCRIPT)
if spec is None or spec.loader is None:
    raise RuntimeError(f"Cannot load V17 base rig script: {V17_SCRIPT}")
v17 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(v17)
v16 = v17.v16
v6b = v17.v6b


BLEND_PATH = BLENDER_DIR / "Fuxie_Character_v18_motion_polish_rig.blend"
GLB_PATH = MODEL_DIR / "Fuxie_Character_v18_motion_polish_rig.glb"
FBX_PATH = MODEL_DIR / "Fuxie_Character_v18_motion_polish_rig.fbx"
PREVIEW_PATH = BLENDER_DIR / "Fuxie_preview_v18_motion_polish_rig.png"
MANIFEST_PATH = BLENDER_DIR / "Fuxie_Character_v18_motion_polish_rig_manifest.json"
PUBLIC_GLB_PATH = PUBLIC_LIVE_DIR / "fuxie-motion-polish-rig-v18.glb"
PUBLIC_POSTER_PATH = PUBLIC_LIVE_DIR / "fuxie-motion-polish-rig-v18-poster.png"
PUBLIC_MANIFEST_PATH = PUBLIC_LIVE_DIR / "fuxie-motion-polish-rig-v18.json"
GENERATED_DIR = BLENDER_DIR / "generated" / "v18_motion_polish"
UNIFIED_SOURCE_ATLAS = GENERATED_DIR / "Fuxie_V18_MotionPolishSourceClean.png"

CLIPS = {
    "idle": {"frames": 120, "description": "Motion-polished 60fps idle: tiny breathing, stable torso, soft head/ear/tail accents."},
    "wave": {"frames": 96, "description": "Motion-polished wave: readable hand greeting without over-warping the source-locked arm."},
    "talk": {"frames": 120, "description": "Motion-polished talk: subtle jaw, head nod, and small hand cue."},
    "listen": {"frames": 120, "description": "Motion-polished listen: attentive head tilt and ear focus with stable feet."},
    "reward": {"frames": 96, "description": "Motion-polished reward: small game mascot bounce with contained arm/tail motion."},
    "tryAgain": {"frames": 120, "description": "Motion-polished encouragement: gentle nod and small hand cue, no sad slump."},
}


def install_globals() -> None:
    v6b.BLEND_PATH = BLEND_PATH
    v6b.GLB_PATH = GLB_PATH
    v6b.FBX_PATH = FBX_PATH
    v6b.PREVIEW_PATH = PREVIEW_PATH
    v6b.MANIFEST_PATH = MANIFEST_PATH
    v6b.PUBLIC_GLB_PATH = PUBLIC_GLB_PATH
    v6b.PUBLIC_POSTER_PATH = PUBLIC_POSTER_PATH
    v6b.PUBLIC_MANIFEST_PATH = PUBLIC_MANIFEST_PATH
    v6b.CLIPS = CLIPS
    v17.UNIFIED_SOURCE_ATLAS = UNIFIED_SOURCE_ATLAS
    v17.CLIPS = CLIPS
    v16.UNIFIED_SOURCE_ATLAS = UNIFIED_SOURCE_ATLAS
    v16.CLIPS = CLIPS


def ensure_dirs() -> None:
    BLENDER_DIR.mkdir(parents=True, exist_ok=True)
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_LIVE_DIR.mkdir(parents=True, exist_ok=True)
    GENERATED_DIR.mkdir(parents=True, exist_ok=True)


def key_bone(armature: bpy.types.Object, bone_name: str, frame: int, loc=None, rot=None, scale=None) -> None:
    v6b.key_bone(armature, bone_name, frame, loc=loc, rot=rot, scale=scale)


def make_clip(armature: bpy.types.Object, name: str, frames: int, animator) -> None:
    v6b.make_clip(armature, name, frames, animator)


def animate(armature: bpy.types.Object) -> None:
    # V18 intentionally uses smaller rotations than V17. Source-locked texture rigs read best with
    # stable mass and carefully placed accents rather than large skeletal swings.
    def idle() -> None:
        for frame, lift, body, head, tail, ear in [
            (1, 0.000, 0.000, 0.000, 0.000, 0.000),
            (30, 0.012, -0.004, 0.006, 0.030, 0.014),
            (60, 0.000, 0.000, 0.000, -0.006, 0.000),
            (90, 0.012, 0.004, -0.006, -0.030, -0.014),
            (120, 0.000, 0.000, 0.000, 0.000, 0.000),
        ]:
            key_bone(armature, "root", frame, loc=(0, 0, lift), rot=(0, 0, body), scale=(1, 1 + lift * 0.22, 1))
            key_bone(armature, "chest", frame, rot=(0, 0, body * 0.35))
            key_bone(armature, "head", frame, rot=(0, 0, head))
            key_bone(armature, "tail.01", frame, rot=(0, 0, tail * 0.35))
            key_bone(armature, "tail.02", frame, rot=(0, 0, tail))
            key_bone(armature, "tail.03", frame, rot=(0, 0, tail * 0.75))
            key_bone(armature, "ear.L.01", frame, rot=(0, 0, -ear))
            key_bone(armature, "ear.R.01", frame, rot=(0, 0, ear))

    def wave() -> None:
        for frame, upper, fore, hand, body, lift, tail in [
            (1, 0.00, 0.00, 0.00, 0.000, 0.000, 0.000),
            (12, -0.08, -0.22, -0.06, -0.010, 0.010, 0.018),
            (24, -0.14, -0.36, 0.18, 0.008, 0.020, -0.022),
            (36, -0.11, -0.30, -0.16, -0.008, 0.012, 0.018),
            (48, -0.15, -0.38, 0.20, 0.010, 0.020, -0.022),
            (60, -0.11, -0.30, -0.16, -0.008, 0.012, 0.018),
            (72, -0.14, -0.36, 0.18, 0.008, 0.018, -0.018),
            (96, 0.00, 0.00, 0.00, 0.000, 0.000, 0.000),
        ]:
            key_bone(armature, "root", frame, loc=(0, 0, lift), rot=(0, 0, body), scale=(1, 1 + lift * 0.18, 1))
            key_bone(armature, "upper_arm.L", frame, rot=(0, 0, upper))
            key_bone(armature, "forearm.L", frame, rot=(0, 0, fore))
            key_bone(armature, "hand.L", frame, rot=(0, 0, hand))
            key_bone(armature, "head", frame, rot=(0, 0, -body * 0.50))
            key_bone(armature, "tail.02", frame, rot=(0, 0, tail))
            key_bone(armature, "tail.03", frame, rot=(0, 0, tail * 0.70))

    def talk() -> None:
        for frame in range(1, 121, 10):
            phase = frame // 10
            mouth_open = 1.0 + (0.075 if phase % 2 else 0.0)
            nod = 0.008 * math.sin(frame * 0.16)
            gesture = 0.040 * math.sin(frame * 0.24)
            key_bone(armature, "root", frame, loc=(0, 0, 0.006 if phase % 2 else 0.0))
            key_bone(armature, "head", frame, rot=(0, 0, nod))
            key_bone(armature, "jaw", frame, loc=(0, 0, -0.006 if phase % 2 else 0.0), scale=(1.0, mouth_open, 1.0))
            key_bone(armature, "upper_arm.R", frame, rot=(0, 0, gesture * 0.35))
            key_bone(armature, "forearm.R", frame, rot=(0, 0, gesture))

    def listen() -> None:
        for frame, head, chest, ear_l, ear_r, tail in [
            (1, 0.000, 0.000, 0.000, 0.000, 0.000),
            (24, -0.050, -0.012, 0.050, 0.024, 0.026),
            (60, -0.075, -0.018, 0.085, 0.036, -0.020),
            (96, -0.050, -0.012, 0.050, 0.024, 0.026),
            (120, 0.000, 0.000, 0.000, 0.000, 0.000),
        ]:
            key_bone(armature, "head", frame, rot=(0, 0, head))
            key_bone(armature, "chest", frame, rot=(0, 0, chest))
            key_bone(armature, "ear.L.01", frame, rot=(0, 0, ear_l))
            key_bone(armature, "ear.R.01", frame, rot=(0, 0, ear_r))
            key_bone(armature, "tail.01", frame, rot=(0, 0, tail * 0.35))
            key_bone(armature, "tail.02", frame, rot=(0, 0, tail))
            key_bone(armature, "tail.03", frame, rot=(0, 0, tail * 0.65))

    def reward() -> None:
        for frame, lift, squash, upper_l, upper_r, fore_l, fore_r, tail in [
            (1, 0.000, 1.000, 0.000, 0.000, 0.000, 0.000, 0.000),
            (12, -0.010, 0.985, -0.030, 0.030, -0.070, 0.070, -0.040),
            (24, 0.052, 1.026, -0.150, 0.150, -0.250, 0.250, 0.100),
            (38, 0.012, 0.992, -0.080, 0.080, -0.160, 0.160, -0.080),
            (52, 0.036, 1.018, -0.170, 0.170, -0.280, 0.280, 0.100),
            (72, 0.010, 0.996, -0.060, 0.060, -0.110, 0.110, -0.050),
            (96, 0.000, 1.000, 0.000, 0.000, 0.000, 0.000, 0.000),
        ]:
            key_bone(armature, "root", frame, loc=(0, 0, lift), scale=(1 / squash, squash, 1), rot=(0, 0, 0.015 * math.sin(frame)))
            key_bone(armature, "upper_arm.L", frame, rot=(0, 0, upper_l))
            key_bone(armature, "upper_arm.R", frame, rot=(0, 0, upper_r))
            key_bone(armature, "forearm.L", frame, rot=(0, 0, fore_l))
            key_bone(armature, "forearm.R", frame, rot=(0, 0, fore_r))
            key_bone(armature, "head", frame, rot=(0, 0, -0.018 * math.sin(frame * 0.20)))
            key_bone(armature, "tail.02", frame, rot=(0, 0, tail))
            key_bone(armature, "tail.03", frame, rot=(0, 0, tail * 0.70))

    def try_again() -> None:
        for frame, nod, upper, fore, hand, tail in [
            (1, 0.000, 0.000, 0.000, 0.000, 0.000),
            (30, 0.024, -0.012, -0.055, -0.020, 0.024),
            (60, -0.014, 0.014, 0.040, 0.016, -0.018),
            (90, 0.020, -0.010, -0.045, -0.016, 0.020),
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
        "name": "Fuxie_Character_v18_motion_polish_rig",
        "status": "motion_polished_contour_source_skinned_candidate",
        "source_note": "V18 keeps V17's contour-cut source identity mesh and retunes all animation clips for source-locked motion: smaller joint rotations, stable feet/torso, softer tail/ear/head accents, and less texture warping. It is still a 2.5D source-locked approximation, not a recovered original 3D mesh.",
        "references": [
            str(path.relative_to(ROOT)).replace("\\", "/")
            for path in [
                v6b.SOURCE_REFERENCE,
                v6b.FRONT_REFERENCE,
                v6b.THREE_QUARTER_REFERENCE,
                v6b.SIDE_REFERENCE,
                v6b.BACK_REFERENCE,
                v6b.FACES_REFERENCE,
                v6b.TAIL_REFERENCE,
            ]
            if Path(path).exists()
        ],
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
            "source_atlas": str(v6b.SOURCE_REFERENCE.relative_to(ROOT)).replace("\\", "/"),
            "cleaned_source_atlas": str(UNIFIED_SOURCE_ATLAS.relative_to(ROOT)).replace("\\", "/"),
            "reference_planes": [obj.name for obj in reference_collection.objects],
            "fps": bpy.context.scene.render.fps,
            "clips": CLIPS,
            "target_runtime": "60fps WebGL contour source mesh with motion-polished clips",
        },
        "limits": [
            "V18 improves clip believability for the current source-locked rig, but does not solve missing true side/back volume.",
            "Large production-quality limb arcs still require a full 3D mesh or manually separated/painted volume surfaces.",
            "Tail edge cleanup remains limited by the source cutout until the atlas is manually painted.",
        ],
        "next_step": "Browser QA V18 against V17. If motion is accepted, use V18 as current live candidate and continue tail/edge cleanup.",
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")


def copy_public_assets() -> None:
    shutil.copy2(GLB_PATH, PUBLIC_GLB_PATH)
    shutil.copy2(PREVIEW_PATH, PUBLIC_POSTER_PATH)
    shutil.copy2(MANIFEST_PATH, PUBLIC_MANIFEST_PATH)


def main() -> None:
    install_globals()
    ensure_dirs()
    v6b.clear_scene()
    v16.setup_scene()

    character_collection = v6b.make_collection("Fuxie_V18_MotionPolishRig_Export")
    reference_collection = v6b.make_collection("Fuxie_V18_Source_References")
    v16.write_clean_source_atlas()
    armature = v6b.create_armature(character_collection)
    v16.rename_armature(armature)
    armature.name = "Fuxie_V18_MotionPolishRig_Armature"
    armature.data.name = "Fuxie_V18_MotionPolishRig_Skeleton"

    v17.create_contour_mesh(character_collection, armature)
    shadow = v6b.add_shadow(character_collection)
    v6b.bind_to_bone(shadow, armature, "root")

    v16.add_reference_planes(reference_collection)
    animate(armature)
    v6b.export_assets(character_collection)
    write_manifest(character_collection, reference_collection)
    copy_public_assets()
    print(f"Saved V18 motion polish rig Blender file: {BLEND_PATH}")
    print(f"Exported V18 motion polish rig GLB: {GLB_PATH}")
    print(f"Exported V18 motion polish rig FBX: {FBX_PATH}")
    print(f"Rendered V18 motion polish rig preview: {PREVIEW_PATH}")


if __name__ == "__main__":
    main()
