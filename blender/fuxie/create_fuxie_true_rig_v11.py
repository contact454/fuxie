from __future__ import annotations

import importlib.util
import json
import shutil
from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
BLENDER_DIR = ROOT / "blender" / "fuxie"
MODEL_DIR = ROOT / "assets" / "models"
PUBLIC_LIVE_DIR = ROOT / "apps" / "web" / "public" / "mascot-3d" / "live"

BASE_SCRIPT = BLENDER_DIR / "create_fuxie_character_v6b_game_rig_cleanup.py"
spec = importlib.util.spec_from_file_location("fuxie_v6b_base", BASE_SCRIPT)
if spec is None or spec.loader is None:
    raise RuntimeError(f"Cannot load base V6B rig script: {BASE_SCRIPT}")
v6b = importlib.util.module_from_spec(spec)
spec.loader.exec_module(v6b)


SOURCE_REFERENCE = BLENDER_DIR / "references" / "fuxie_ref_front_cutout.png"
SOURCE_REFERENCE_FALLBACK = SOURCE_REFERENCE
FRONT_REFERENCE = ROOT / "apps" / "web" / "public" / "mascot-3d" / "reference-parts" / "fuxie_ref_part_front_full_body.png"
FACE_REFERENCE = ROOT / "apps" / "web" / "public" / "mascot-3d" / "reference-parts" / "fuxie_ref_part_front_head_face.png"
TAIL_REFERENCE = ROOT / "apps" / "web" / "public" / "mascot-3d" / "reference-parts" / "fuxie_ref_part_tail_material.png"
V10_SOURCE_REFERENCE = ROOT / "apps" / "web" / "public" / "mascot-3d" / "imagegen-fullbody" / "v10" / "fuxie_imagegen_fullbody_v10_source.png"

BLEND_PATH = BLENDER_DIR / "Fuxie_Character_v11_true_rig.blend"
GLB_PATH = MODEL_DIR / "Fuxie_Character_v11_true_rig.glb"
FBX_PATH = MODEL_DIR / "Fuxie_Character_v11_true_rig.fbx"
PREVIEW_PATH = BLENDER_DIR / "Fuxie_preview_v11_true_rig.png"
MANIFEST_PATH = BLENDER_DIR / "Fuxie_Character_v11_true_rig_manifest.json"
PUBLIC_GLB_PATH = PUBLIC_LIVE_DIR / "fuxie-true-rig-v11.glb"
PUBLIC_POSTER_PATH = PUBLIC_LIVE_DIR / "fuxie-true-rig-v11-poster.png"
PUBLIC_MANIFEST_PATH = PUBLIC_LIVE_DIR / "fuxie-true-rig-v11.json"
LAYER_DIR = BLENDER_DIR / "generated" / "v11_true_rig_layers"

SOURCE_WIDTH = 330
SOURCE_HEIGHT = 540
WORLD_HEIGHT = 2.72

CLIPS = {
    "idle": {"frames": 120, "description": "True GLB skeletal idle: breathing, head bob, tail sway, and ear twitch at 60fps."},
    "wave": {"frames": 96, "description": "True GLB skeletal wave: arm/hand chain wave with body sway and tail counter-motion."},
    "talk": {"frames": 120, "description": "True GLB skeletal talk: jaw overlay, head nod, and small hand gesture at 60fps."},
    "listen": {"frames": 120, "description": "True GLB skeletal listen: head tilt, ears focus, and attentive tail motion."},
    "reward": {"frames": 96, "description": "True GLB skeletal reward: squash/stretch hop, arms up, and fast tail wag."},
    "tryAgain": {"frames": 120, "description": "True GLB skeletal encouragement: nod and gentle hand cue."},
}

PARTS = [dict(part) for part in v6b.PARTS]


def install_v11_globals() -> None:
    source = SOURCE_REFERENCE if SOURCE_REFERENCE.exists() else SOURCE_REFERENCE_FALLBACK
    v6b.SOURCE_REFERENCE = source
    v6b.FRONT_REFERENCE = FRONT_REFERENCE
    v6b.THREE_QUARTER_REFERENCE = V10_SOURCE_REFERENCE
    v6b.SIDE_REFERENCE = FACE_REFERENCE
    v6b.BACK_REFERENCE = TAIL_REFERENCE
    v6b.FACES_REFERENCE = FACE_REFERENCE
    v6b.TAIL_REFERENCE = TAIL_REFERENCE
    v6b.BLEND_PATH = BLEND_PATH
    v6b.GLB_PATH = GLB_PATH
    v6b.FBX_PATH = FBX_PATH
    v6b.PREVIEW_PATH = PREVIEW_PATH
    v6b.MANIFEST_PATH = MANIFEST_PATH
    v6b.PUBLIC_GLB_PATH = PUBLIC_GLB_PATH
    v6b.PUBLIC_POSTER_PATH = PUBLIC_POSTER_PATH
    v6b.PUBLIC_MANIFEST_PATH = PUBLIC_MANIFEST_PATH
    v6b.LAYER_DIR = LAYER_DIR
    v6b.SOURCE_WIDTH = SOURCE_WIDTH
    v6b.SOURCE_HEIGHT = SOURCE_HEIGHT
    v6b.WORLD_HEIGHT = WORLD_HEIGHT
    v6b.SCALE = WORLD_HEIGHT / SOURCE_HEIGHT
    v6b.CLIPS = CLIPS
    v6b.PARTS = PARTS


def create_armature(collection: bpy.types.Collection) -> bpy.types.Object:
    armature = v6b.create_armature(collection)
    armature.name = "Fuxie_V11_TrueRig_Armature"
    armature.data.name = "Fuxie_V11_TrueRig_Skeleton"
    return armature


def setup_scene() -> None:
    v6b.setup_scene()
    scene = bpy.context.scene
    scene.render.fps = 60
    scene.render.resolution_x = 1200
    scene.render.resolution_y = 1200
    scene.world.color = (0.965, 0.985, 1.0)
    if scene.camera:
        scene.camera.name = "Fuxie_V11_TrueRig_Camera"
        scene.camera.location = (0, -5.0, 1.34)
        scene.camera.data.ortho_scale = 3.18


def add_v11_reference_planes(reference_collection: bpy.types.Collection) -> None:
    refs = [
        ("Fuxie_V11_Reference_ApprovedFront", FRONT_REFERENCE, 2.55, (-2.30, 0.24, 0.04)),
        ("Fuxie_V11_Reference_V10Coherent", V10_SOURCE_REFERENCE, 2.55, (2.30, 0.24, 0.04)),
        ("Fuxie_V11_Reference_Face", FACE_REFERENCE, 1.10, (-3.85, 0.24, 1.15)),
        ("Fuxie_V11_Reference_Tail", TAIL_REFERENCE, 0.90, (3.85, 0.24, 0.62)),
    ]
    for name, path, height, location in refs:
        if path.exists():
            v6b.add_reference_plane(name, path, height, location, reference_collection)


def write_manifest(character_collection: bpy.types.Collection, reference_collection: bpy.types.Collection) -> None:
    meshes = [obj for obj in character_collection.objects if obj.type == "MESH"]
    armature = next((obj for obj in character_collection.objects if obj.type == "ARMATURE"), None)
    manifest = {
        "name": "Fuxie_Character_v11_true_rig",
        "status": "true_skeletal_glb_rig_candidate",
        "source_note": "Image-locked skeletal GLB rig built from Fuxie 3D render references. This is a true Blender armature/skin/animation export, but not a full volumetric sculpt reconstruction of an unavailable source mesh.",
        "references": [
            str(path.relative_to(ROOT)).replace("\\", "/")
            for path in [v6b.SOURCE_REFERENCE, FRONT_REFERENCE, V10_SOURCE_REFERENCE, FACE_REFERENCE, TAIL_REFERENCE]
            if path.exists()
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
            "parts": [{key: value for key, value in part.items() if key != "layer"} for part in PARTS],
            "reference_planes": [obj.name for obj in reference_collection.objects],
            "fps": bpy.context.scene.render.fps,
            "clips": CLIPS,
            "generated_layers": str(LAYER_DIR.relative_to(ROOT)).replace("\\", "/"),
            "target_runtime": "60fps WebGL skeletal GLB rig, with V10 canvas as fallback",
        },
        "limits": [
            "V11 is a true armature-driven GLB rig, but still uses image-segment planes to preserve Fuxie identity.",
            "The next production step is a cleaned full-volume mesh and blended weight paint for joints.",
            "Hidden-side geometry is not reconstructed from the 2D render references.",
        ],
        "next_step": "QA V11 WebGL clips against V10 canvas fallback, then decide whether to sculpt a full-volume V12 mesh or polish this skeletal rig.",
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")


def copy_public_assets() -> None:
    shutil.copy2(GLB_PATH, PUBLIC_GLB_PATH)
    shutil.copy2(PREVIEW_PATH, PUBLIC_POSTER_PATH)
    shutil.copy2(MANIFEST_PATH, PUBLIC_MANIFEST_PATH)


def main() -> None:
    install_v11_globals()
    v6b.ensure_dirs()
    LAYER_DIR.mkdir(parents=True, exist_ok=True)
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_LIVE_DIR.mkdir(parents=True, exist_ok=True)
    v6b.clear_scene()
    setup_scene()

    character_collection = v6b.make_collection("Fuxie_V11_TrueRig_Export")
    reference_collection = v6b.make_collection("Fuxie_V11_Source_References")
    layer_paths = v6b.generate_layer_textures()

    armature = create_armature(character_collection)
    for part in PARTS:
        obj = v6b.create_part_mesh(part, character_collection, layer_paths[str(part["name"])])
        v6b.bind_to_bone(obj, armature, str(part["bone"]))
    shadow = v6b.add_shadow(character_collection)
    v6b.bind_to_bone(shadow, armature, "root")

    add_v11_reference_planes(reference_collection)
    v6b.animate(armature)
    v6b.export_assets(character_collection)
    write_manifest(character_collection, reference_collection)
    copy_public_assets()
    print(f"Saved V11 true rig Blender file: {BLEND_PATH}")
    print(f"Exported V11 true rig GLB: {GLB_PATH}")
    print(f"Exported V11 true rig FBX: {FBX_PATH}")
    print(f"Rendered V11 true rig preview: {PREVIEW_PATH}")


if __name__ == "__main__":
    main()
