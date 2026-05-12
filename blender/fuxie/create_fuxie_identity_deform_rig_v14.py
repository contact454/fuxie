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

V13_SCRIPT = BLENDER_DIR / "create_fuxie_deform_rig_v13.py"
V6B_SCRIPT = BLENDER_DIR / "create_fuxie_character_v6b_game_rig_cleanup.py"


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load {name}: {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


v13 = load_module("fuxie_v13_base", V13_SCRIPT)
v6b = load_module("fuxie_v6b_base", V6B_SCRIPT)

SOURCE_CUTOUT = BLENDER_DIR / "references" / "fuxie_ref_front_cutout.png"
FRONT_REFERENCE = BLENDER_DIR / "references" / "fuxie_ref_front.png"
THREE_QUARTER_REFERENCE = BLENDER_DIR / "references" / "fuxie_ref_three_quarter.png"
SIDE_REFERENCE = BLENDER_DIR / "references" / "fuxie_ref_side.png"
BACK_REFERENCE = BLENDER_DIR / "references" / "fuxie_ref_back.png"
FACES_REFERENCE = BLENDER_DIR / "references" / "fuxie_ref_faces.png"
TAIL_REFERENCE = BLENDER_DIR / "references" / "fuxie_ref_tail_material.png"
V10_SOURCE_REFERENCE = ROOT / "apps" / "web" / "public" / "mascot-3d" / "imagegen-fullbody" / "v10" / "fuxie_imagegen_fullbody_v10_source.png"

BLEND_PATH = BLENDER_DIR / "Fuxie_Character_v14_identity_deform_rig.blend"
GLB_PATH = MODEL_DIR / "Fuxie_Character_v14_identity_deform_rig.glb"
FBX_PATH = MODEL_DIR / "Fuxie_Character_v14_identity_deform_rig.fbx"
PREVIEW_PATH = BLENDER_DIR / "Fuxie_preview_v14_identity_deform_rig.png"
MANIFEST_PATH = BLENDER_DIR / "Fuxie_Character_v14_identity_deform_rig_manifest.json"
PUBLIC_GLB_PATH = PUBLIC_LIVE_DIR / "fuxie-identity-deform-rig-v14.glb"
PUBLIC_POSTER_PATH = PUBLIC_LIVE_DIR / "fuxie-identity-deform-rig-v14-poster.png"
PUBLIC_MANIFEST_PATH = PUBLIC_LIVE_DIR / "fuxie-identity-deform-rig-v14.json"
LAYER_DIR = BLENDER_DIR / "generated" / "v14_identity_deform_decals"

IDENTITY_DECAL_PARTS = {
    "Fuxie_Body_Hoodie",
    "Fuxie_Chest_Token",
    "Fuxie_Head",
    "Fuxie_Mouth_TalkOverlay",
}


def install_globals() -> None:
    for module in (v13, v13.v7):
        module.FRONT_REFERENCE = FRONT_REFERENCE
        module.THREE_QUARTER_REFERENCE = THREE_QUARTER_REFERENCE
        module.SIDE_REFERENCE = SIDE_REFERENCE
        module.BACK_REFERENCE = BACK_REFERENCE
        module.FACES_REFERENCE = FACES_REFERENCE
        module.TAIL_REFERENCE = TAIL_REFERENCE
        module.BLEND_PATH = BLEND_PATH
        module.GLB_PATH = GLB_PATH
        module.FBX_PATH = FBX_PATH
        module.PREVIEW_PATH = PREVIEW_PATH
        module.MANIFEST_PATH = MANIFEST_PATH
        module.PUBLIC_GLB_PATH = PUBLIC_GLB_PATH
        module.PUBLIC_POSTER_PATH = PUBLIC_POSTER_PATH
        module.PUBLIC_MANIFEST_PATH = PUBLIC_MANIFEST_PATH
        module.CLIPS = v13.CLIPS

    v6b.SOURCE_REFERENCE = SOURCE_CUTOUT
    v6b.FRONT_REFERENCE = FRONT_REFERENCE
    v6b.THREE_QUARTER_REFERENCE = THREE_QUARTER_REFERENCE
    v6b.SIDE_REFERENCE = SIDE_REFERENCE
    v6b.BACK_REFERENCE = BACK_REFERENCE
    v6b.FACES_REFERENCE = FACES_REFERENCE
    v6b.TAIL_REFERENCE = TAIL_REFERENCE
    v6b.LAYER_DIR = LAYER_DIR
    v6b.CLIPS = v13.CLIPS


def ensure_dirs() -> None:
    BLENDER_DIR.mkdir(parents=True, exist_ok=True)
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_LIVE_DIR.mkdir(parents=True, exist_ok=True)
    LAYER_DIR.mkdir(parents=True, exist_ok=True)


def rename_armature(armature: bpy.types.Object) -> None:
    armature.name = "Fuxie_V14_IdentityDeformRig_Armature"
    armature.data.name = "Fuxie_V14_IdentityDeformRig_Skeleton"


def soften_generated_face(meshes: list[bpy.types.Object]) -> None:
    # V14 lets source-locked face decals carry the recognizable face. The primitive face below stays as low-depth support.
    for obj in meshes:
        if obj.name in {"Fuxie_Eye_L_White", "Fuxie_Eye_R_White", "Fuxie_Eye_L_Iris", "Fuxie_Eye_R_Iris", "Fuxie_Eye_L_Pupil", "Fuxie_Eye_R_Pupil"}:
            obj.scale.y *= 0.55
        if obj.name in {"Fuxie_FaceMask", "Fuxie_Muzzle"}:
            obj.scale.y *= 0.70


def add_identity_decals(collection: bpy.types.Collection, armature: bpy.types.Object) -> list[bpy.types.Object]:
    layer_paths = v6b.generate_layer_textures()
    decals: list[bpy.types.Object] = []
    for source_part in v6b.PARTS:
        name = str(source_part["name"])
        if name not in IDENTITY_DECAL_PARTS:
            continue
        decal_part = dict(source_part)
        # Camera/front side is negative Y; keep these as facial/body surface decals, not limb cutouts.
        decal_part["layer"] = -0.62 - float(source_part.get("order", 0)) * 0.003
        obj = v6b.create_part_mesh(decal_part, collection, layer_paths[name])
        obj.name = f"Fuxie_V14_IdentityDecal_{name}"
        obj.data.name = f"{obj.name}_Mesh"
        obj["fuxie_v14_role"] = "identity_surface_decal_not_limb_cutout"
        v6b.bind_to_bone(obj, armature, str(source_part["bone"]))
        decals.append(obj)
    return decals


def add_reference_planes(reference_collection: bpy.types.Collection) -> None:
    refs = [
        ("Fuxie_V14_Reference_Front", FRONT_REFERENCE, 2.55, (-2.30, 0.35, 0.04)),
        ("Fuxie_V14_Reference_V10Coherent", V10_SOURCE_REFERENCE, 2.55, (2.30, 0.35, 0.04)),
        ("Fuxie_V14_Reference_Side", SIDE_REFERENCE, 2.20, (3.90, 0.35, 0.10)),
        ("Fuxie_V14_Reference_Back", BACK_REFERENCE, 2.20, (-3.90, 0.35, 0.10)),
        ("Fuxie_V14_Reference_Faces", FACES_REFERENCE, 1.0, (0, 0.35, 2.86)),
        ("Fuxie_V14_Reference_Tail", TAIL_REFERENCE, 0.82, (0, 0.35, -0.98)),
    ]
    for name, path, height, loc in refs:
        if path.exists():
            v13.v7.add_reference_plane(name, path, height, loc, reference_collection)


def write_manifest(character_collection: bpy.types.Collection, reference_collection: bpy.types.Collection, decals: list[bpy.types.Object]) -> None:
    meshes = [obj for obj in character_collection.objects if obj.type == "MESH"]
    armature = next((obj for obj in character_collection.objects if obj.type == "ARMATURE"), None)
    blended_meshes = [obj.name for obj in meshes if obj.get("fuxie_v13_deformation")]
    manifest = {
        "name": "Fuxie_Character_v14_identity_deform_rig",
        "status": "identity_restored_true_deforming_rig_candidate",
        "source_note": "V14 keeps V13 true deforming limb/tail meshes, and restores Fuxie identity with source-image decals only on face, hoodie, chest token, and mouth. No arm, leg, hand, foot, or tail cutout image parts are exported.",
        "references": [
            str(path.relative_to(ROOT)).replace("\\", "/")
            for path in [FRONT_REFERENCE, THREE_QUARTER_REFERENCE, SIDE_REFERENCE, BACK_REFERENCE, FACES_REFERENCE, TAIL_REFERENCE, SOURCE_CUTOUT, V10_SOURCE_REFERENCE]
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
            "identity_decals": [obj.name for obj in decals],
            "deforming_multi_weight_meshes": blended_meshes,
            "vertices_before_export_modifiers": sum(len(obj.data.vertices) for obj in meshes),
            "faces_before_export_modifiers": sum(len(obj.data.polygons) for obj in meshes),
            "bones": [bone.name for bone in armature.data.bones] if armature else [],
            "deform_bones": [bone.name for bone in armature.data.bones if bone.use_deform] if armature else [],
            "control_bones": [bone.name for bone in armature.data.bones if not bone.use_deform] if armature else [],
            "reference_planes": [obj.name for obj in reference_collection.objects],
            "fps": bpy.context.scene.render.fps,
            "clips": v13.CLIPS,
            "target_runtime": "60fps WebGL identity-restored deforming skeletal rig",
        },
        "rig_notes": [
            "Arms, legs, hands, feet, and tail remain real mesh/skinned deform rig parts.",
            "Only face/body identity surfaces use source image decals to recover Fuxie recognition.",
            "This is the compromise path between V10 visual identity and V13 true joint deformation.",
        ],
        "limits": [
            "V14 is still not a final unified production mesh.",
            "Surface decals should eventually be replaced by UV texture painting on the full mesh.",
            "Facial rig still needs blendshapes/eyelids after identity approval.",
        ],
        "next_step": "Browser QA V14 against V10/V12/V13, then polish mesh proportions and replace decals with a UV atlas.",
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")


def copy_public_assets() -> None:
    shutil.copy2(GLB_PATH, PUBLIC_GLB_PATH)
    shutil.copy2(PREVIEW_PATH, PUBLIC_POSTER_PATH)
    shutil.copy2(MANIFEST_PATH, PUBLIC_MANIFEST_PATH)


def main() -> None:
    install_globals()
    ensure_dirs()
    v13.v7.clear_scene()
    v13.v7.setup_scene()
    bpy.context.scene.camera.name = "Fuxie_V14_IdentityDeformRig_Camera"
    bpy.context.scene.render.fps = 60

    character_collection = v13.v7.make_collection("Fuxie_V14_IdentityDeformRig_Export")
    reference_collection = v13.v7.make_collection("Fuxie_V14_Source_References")
    armature = v13.v7.create_armature(character_collection)
    rename_armature(armature)
    meshes = v13.create_deform_character(character_collection, armature)
    soften_generated_face(meshes)
    decals = add_identity_decals(character_collection, armature)
    add_reference_planes(reference_collection)
    v13.v7.animate(armature)
    v13.v7.export_assets(character_collection)
    write_manifest(character_collection, reference_collection, decals)
    copy_public_assets()
    print(f"Saved V14 identity deform rig Blender file: {BLEND_PATH}")
    print(f"Exported V14 identity deform rig GLB: {GLB_PATH}")
    print(f"Exported V14 identity deform rig FBX: {FBX_PATH}")
    print(f"Rendered V14 identity deform rig preview: {PREVIEW_PATH}")


if __name__ == "__main__":
    main()
