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

V7_SCRIPT = BLENDER_DIR / "create_fuxie_character_v7_true_mesh_rig.py"
V6B_SCRIPT = BLENDER_DIR / "create_fuxie_character_v6b_game_rig_cleanup.py"


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load {name}: {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


v7 = load_module("fuxie_v7_base", V7_SCRIPT)
v6b = load_module("fuxie_v6b_base", V6B_SCRIPT)

FRONT_REFERENCE = BLENDER_DIR / "references" / "fuxie_ref_front.png"
THREE_QUARTER_REFERENCE = BLENDER_DIR / "references" / "fuxie_ref_three_quarter.png"
SIDE_REFERENCE = BLENDER_DIR / "references" / "fuxie_ref_side.png"
BACK_REFERENCE = BLENDER_DIR / "references" / "fuxie_ref_back.png"
FACE_REFERENCE = ROOT / "apps" / "web" / "public" / "mascot-3d" / "reference-parts" / "fuxie_ref_part_front_head_face.png"
TAIL_REFERENCE = ROOT / "apps" / "web" / "public" / "mascot-3d" / "reference-parts" / "fuxie_ref_part_tail_material.png"
SOURCE_CUTOUT = BLENDER_DIR / "references" / "fuxie_ref_front_cutout.png"
V10_SOURCE = ROOT / "apps" / "web" / "public" / "mascot-3d" / "imagegen-fullbody" / "v10" / "fuxie_imagegen_fullbody_v10_source.png"

BLEND_PATH = BLENDER_DIR / "Fuxie_Character_v12_volume_rig.blend"
GLB_PATH = MODEL_DIR / "Fuxie_Character_v12_volume_rig.glb"
FBX_PATH = MODEL_DIR / "Fuxie_Character_v12_volume_rig.fbx"
PREVIEW_PATH = BLENDER_DIR / "Fuxie_preview_v12_volume_rig.png"
MANIFEST_PATH = BLENDER_DIR / "Fuxie_Character_v12_volume_rig_manifest.json"
PUBLIC_GLB_PATH = PUBLIC_LIVE_DIR / "fuxie-volume-rig-v12.glb"
PUBLIC_POSTER_PATH = PUBLIC_LIVE_DIR / "fuxie-volume-rig-v12-poster.png"
PUBLIC_MANIFEST_PATH = PUBLIC_LIVE_DIR / "fuxie-volume-rig-v12.json"
LAYER_DIR = BLENDER_DIR / "generated" / "v12_volume_rig_decals"

CLIPS = {
    "idle": {"frames": 120, "description": "60fps volume rig idle with breath, head bob, ear twitch, and tail sway."},
    "wave": {"frames": 96, "description": "60fps volume rig wave using arm, hand, head counter motion, and tail follow-through."},
    "talk": {"frames": 120, "description": "60fps volume rig talk with jaw/decal mouth pulse, head nod, and hand gesture."},
    "listen": {"frames": 120, "description": "60fps attentive listen pose with head tilt, focused ears, and soft tail motion."},
    "reward": {"frames": 96, "description": "60fps reward hop with squash/stretch, lifted arms, and fast tail wag."},
    "tryAgain": {"frames": 120, "description": "60fps encouraging nod with gentle hand cue and calm posture."},
}


def install_globals() -> None:
    for module in (v7,):
        module.FRONT_REFERENCE = FRONT_REFERENCE
        module.THREE_QUARTER_REFERENCE = THREE_QUARTER_REFERENCE
        module.SIDE_REFERENCE = SIDE_REFERENCE
        module.BACK_REFERENCE = BACK_REFERENCE
        module.FACES_REFERENCE = FACE_REFERENCE
        module.TAIL_REFERENCE = TAIL_REFERENCE
        module.BLEND_PATH = BLEND_PATH
        module.GLB_PATH = GLB_PATH
        module.FBX_PATH = FBX_PATH
        module.PREVIEW_PATH = PREVIEW_PATH
        module.MANIFEST_PATH = MANIFEST_PATH
        module.PUBLIC_GLB_PATH = PUBLIC_GLB_PATH
        module.PUBLIC_POSTER_PATH = PUBLIC_POSTER_PATH
        module.PUBLIC_MANIFEST_PATH = PUBLIC_MANIFEST_PATH
        module.CLIPS = CLIPS

    v6b.SOURCE_REFERENCE = SOURCE_CUTOUT
    v6b.FRONT_REFERENCE = FRONT_REFERENCE
    v6b.THREE_QUARTER_REFERENCE = THREE_QUARTER_REFERENCE
    v6b.SIDE_REFERENCE = SIDE_REFERENCE
    v6b.BACK_REFERENCE = BACK_REFERENCE
    v6b.FACES_REFERENCE = FACE_REFERENCE
    v6b.TAIL_REFERENCE = TAIL_REFERENCE
    v6b.LAYER_DIR = LAYER_DIR
    v6b.CLIPS = CLIPS


def ensure_dirs() -> None:
    BLENDER_DIR.mkdir(parents=True, exist_ok=True)
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_LIVE_DIR.mkdir(parents=True, exist_ok=True)
    LAYER_DIR.mkdir(parents=True, exist_ok=True)


def rename_armature(armature: bpy.types.Object) -> None:
    armature.name = "Fuxie_V12_VolumeRig_Armature"
    armature.data.name = "Fuxie_V12_VolumeRig_Skeleton"


def add_identity_decals(collection: bpy.types.Collection, armature: bpy.types.Object) -> list[bpy.types.Object]:
    layer_paths = v6b.generate_layer_textures()
    decals: list[bpy.types.Object] = []
    for part in v6b.PARTS:
        decal_part = dict(part)
        # Push source-locked texture slices slightly toward camera so they read over the volume pass.
        decal_part["layer"] = float(part.get("layer", 0.0)) - 0.54
        obj = v6b.create_part_mesh(decal_part, collection, layer_paths[str(part["name"])])
        obj.name = f"Fuxie_V12_Decal_{part['name']}"
        obj.data.name = f"{obj.name}_Mesh"
        obj["fuxie_v12_role"] = "source_locked_identity_decal"
        v6b.bind_to_bone(obj, armature, str(part["bone"]))
        decals.append(obj)
    return decals


def add_reference_planes(reference_collection: bpy.types.Collection) -> None:
    refs = [
        ("Fuxie_V12_Reference_Front", FRONT_REFERENCE, 2.55, (-2.25, 0.35, 0.04)),
        ("Fuxie_V12_Reference_V10Coherent", V10_SOURCE, 2.55, (2.25, 0.35, 0.04)),
        ("Fuxie_V12_Reference_Side", SIDE_REFERENCE, 2.20, (3.85, 0.35, 0.10)),
        ("Fuxie_V12_Reference_Back", BACK_REFERENCE, 2.20, (-3.85, 0.35, 0.10)),
        ("Fuxie_V12_Reference_Face", FACE_REFERENCE, 1.05, (0, 0.35, 2.86)),
        ("Fuxie_V12_Reference_Tail", TAIL_REFERENCE, 0.82, (0, 0.35, -0.98)),
    ]
    for name, image_path, height, location in refs:
        if image_path.exists():
            v7.add_reference_plane(name, image_path, height, location, reference_collection)


def write_manifest(character_collection: bpy.types.Collection, reference_collection: bpy.types.Collection, decal_count: int) -> None:
    meshes = [obj for obj in character_collection.objects if obj.type == "MESH"]
    armature = next((obj for obj in character_collection.objects if obj.type == "ARMATURE"), None)
    manifest = {
        "name": "Fuxie_Character_v12_volume_rig",
        "status": "volume_mesh_plus_source_locked_decals_candidate",
        "source_note": "V12 combines a stylized true-volume Fuxie mesh with source-locked Fuxie image decals for identity. It is generated from Fuxie 3D render references and is not a 100% reconstruction of an unavailable source mesh.",
        "references": [
            str(path.relative_to(ROOT)).replace("\\", "/")
            for path in [FRONT_REFERENCE, THREE_QUARTER_REFERENCE, SIDE_REFERENCE, BACK_REFERENCE, FACE_REFERENCE, TAIL_REFERENCE, SOURCE_CUTOUT, V10_SOURCE]
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
            "identity_decals": decal_count,
            "vertices_before_export_modifiers": sum(len(obj.data.vertices) for obj in meshes),
            "faces_before_export_modifiers": sum(len(obj.data.polygons) for obj in meshes),
            "bones": [bone.name for bone in armature.data.bones] if armature else [],
            "deform_bones": [bone.name for bone in armature.data.bones if bone.use_deform] if armature else [],
            "control_bones": [bone.name for bone in armature.data.bones if not bone.use_deform] if armature else [],
            "reference_planes": [obj.name for obj in reference_collection.objects],
            "fps": bpy.context.scene.render.fps,
            "clips": CLIPS,
            "target_runtime": "60fps WebGL volume rig candidate with V11/V10/V6B kept as baselines",
        },
        "rig_notes": [
            "Armature exports with skin and 6 animation clips.",
            "Volume body/head/limbs/tail are real mesh primitives bound to deform bones.",
            "Fuxie source decals are bound to matching bones to preserve the approved face, hoodie, token, tail, and silhouette while the volume pass is reviewed.",
        ],
        "limits": [
            "V12 is still a hybrid candidate; it is closer to a game rig than V11, but production-quality deformation still needs manual retopology and blended weight paint.",
            "The hidden side/back detail is approximated from available render references.",
            "The next polish pass should replace front decals with painted UV texture atlas once the volume silhouette is approved.",
        ],
        "next_step": "Browser QA V12 visibility/FPS, then compare identity against V11/V10/V6B before deciding whether to polish weight paint or rebuild topology.",
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")


def copy_public_assets() -> None:
    shutil.copy2(GLB_PATH, PUBLIC_GLB_PATH)
    shutil.copy2(PREVIEW_PATH, PUBLIC_POSTER_PATH)
    shutil.copy2(MANIFEST_PATH, PUBLIC_MANIFEST_PATH)


def main() -> None:
    install_globals()
    ensure_dirs()
    v7.clear_scene()
    v7.setup_scene()
    bpy.context.scene.camera.name = "Fuxie_V12_VolumeRig_Camera"
    bpy.context.scene.render.fps = 60

    character_collection = v7.make_collection("Fuxie_V12_VolumeRig_Export")
    reference_collection = v7.make_collection("Fuxie_V12_Source_References")
    armature = v7.create_armature(character_collection)
    rename_armature(armature)
    v7.create_character(character_collection, armature)
    decals = add_identity_decals(character_collection, armature)
    add_reference_planes(reference_collection)
    v7.animate(armature)
    v7.export_assets(character_collection)
    write_manifest(character_collection, reference_collection, len(decals))
    copy_public_assets()
    print(f"Saved V12 volume rig Blender file: {BLEND_PATH}")
    print(f"Exported V12 volume rig GLB: {GLB_PATH}")
    print(f"Exported V12 volume rig FBX: {FBX_PATH}")
    print(f"Rendered V12 volume rig preview: {PREVIEW_PATH}")


if __name__ == "__main__":
    main()
