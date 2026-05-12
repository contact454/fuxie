from __future__ import annotations

import importlib.util
import json
import math
import shutil
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
BLENDER_DIR = ROOT / "blender" / "fuxie"
REFERENCE_DIR = BLENDER_DIR / "references"
MODEL_DIR = ROOT / "assets" / "models"
PUBLIC_LIVE_DIR = ROOT / "apps" / "web" / "public" / "mascot-3d" / "live"

FRONT_REFERENCE = REFERENCE_DIR / "fuxie_ref_front.png"
THREE_QUARTER_REFERENCE = REFERENCE_DIR / "fuxie_ref_three_quarter.png"
SIDE_REFERENCE = REFERENCE_DIR / "fuxie_ref_side.png"
BACK_REFERENCE = REFERENCE_DIR / "fuxie_ref_back.png"
FACES_REFERENCE = REFERENCE_DIR / "fuxie_ref_faces.png"
TAIL_REFERENCE = REFERENCE_DIR / "fuxie_ref_tail_material.png"

BLEND_PATH = BLENDER_DIR / "Fuxie_Character_v7b_true_mesh_polish.blend"
GLB_PATH = MODEL_DIR / "Fuxie_Character_v7b_true_mesh_polish.glb"
FBX_PATH = MODEL_DIR / "Fuxie_Character_v7b_true_mesh_polish.fbx"
PREVIEW_PATH = BLENDER_DIR / "Fuxie_preview_v7b_true_mesh_polish.png"
MANIFEST_PATH = BLENDER_DIR / "Fuxie_Character_v7b_true_mesh_polish_manifest.json"
PUBLIC_GLB_PATH = PUBLIC_LIVE_DIR / "fuxie-true-mesh-v7b.glb"
PUBLIC_POSTER_PATH = PUBLIC_LIVE_DIR / "fuxie-true-mesh-v7b-poster.png"
PUBLIC_MANIFEST_PATH = PUBLIC_LIVE_DIR / "fuxie-true-mesh-v7b.json"

BASE_SCRIPT = BLENDER_DIR / "create_fuxie_character_v7_true_mesh_rig.py"
spec = importlib.util.spec_from_file_location("fuxie_v7_base", BASE_SCRIPT)
if spec is None or spec.loader is None:
    raise RuntimeError(f"Cannot load base V7 script: {BASE_SCRIPT}")
v7 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(v7)


CLIPS = v7.CLIPS

COLORS = {
    "fur_blue": (0.055, 0.49, 0.84, 1.0),
    "fur_light": (0.10, 0.62, 0.95, 1.0),
    "fur_shadow": (0.035, 0.31, 0.67, 1.0),
    "cream": (0.93, 0.90, 0.84, 1.0),
    "cream_shadow": (0.80, 0.76, 0.68, 1.0),
    "ear_inner": (0.83, 0.62, 0.56, 1.0),
    "hoodie": (0.02, 0.63, 0.66, 1.0),
    "hoodie_light": (0.05, 0.75, 0.75, 1.0),
    "hoodie_shadow": (0.015, 0.38, 0.43, 1.0),
    "bandana": (0.02, 0.28, 0.80, 1.0),
    "pants": (0.025, 0.21, 0.39, 1.0),
    "shoe": (0.03, 0.42, 0.82, 1.0),
    "white": (0.98, 0.98, 0.94, 1.0),
    "black": (0.025, 0.022, 0.02, 1.0),
    "brown": (0.36, 0.17, 0.055, 1.0),
    "amber": (0.98, 0.57, 0.07, 1.0),
    "token": (0.12, 0.48, 0.92, 1.0),
    "gold": (1.00, 0.74, 0.20, 1.0),
}


def ensure_dirs() -> None:
    BLENDER_DIR.mkdir(parents=True, exist_ok=True)
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_LIVE_DIR.mkdir(parents=True, exist_ok=True)


def mat(name: str, color: tuple[float, float, float, float], roughness: float = 0.76) -> bpy.types.Material:
    material = v7.material(f"Fuxie_V7B_{name}", color, roughness)
    material.use_nodes = True
    material.diffuse_color = color
    material.use_backface_culling = False
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        if "Alpha" in bsdf.inputs:
            bsdf.inputs["Alpha"].default_value = color[3]
        if "Metallic" in bsdf.inputs:
            bsdf.inputs["Metallic"].default_value = 0.0
    return material


def add_triangle(
    name: str,
    points: list[tuple[float, float, float]],
    material: bpy.types.Material,
    collection: bpy.types.Collection,
) -> bpy.types.Object:
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(points, [], [(0, 1, 2)])
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    obj.data.materials.append(material)
    collection.objects.link(obj)
    return obj


def add_quad(
    name: str,
    points: list[tuple[float, float, float]],
    material: bpy.types.Material,
    collection: bpy.types.Collection,
) -> bpy.types.Object:
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(points, [], [(0, 1, 2, 3)])
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    obj.data.materials.append(material)
    collection.objects.link(obj)
    return obj


def create_armature(collection: bpy.types.Collection) -> bpy.types.Object:
    armature = v7.create_armature(collection)
    armature.name = "Fuxie_V7B_TrueMesh_Armature"
    armature.data.name = "Fuxie_V7B_TrueMesh_Skeleton"
    return armature


def create_character(collection: bpy.types.Collection, armature: bpy.types.Object) -> list[bpy.types.Object]:
    mats = {key: mat(key, value) for key, value in COLORS.items()}
    objects: list[tuple[bpy.types.Object, str]] = []

    add_sphere = v7.add_uv_sphere
    add_cube = v7.add_cube
    add_cone = v7.add_cone
    add_cylinder = v7.add_cylinder
    add_torus = v7.add_torus

    # Chibi hoodie body, shorter and rounder than V7, matching the reference silhouette.
    objects.append((add_sphere("Fuxie_Body_Hoodie", (0, -0.02, 1.02), (0.42, 0.27, 0.44), mats["hoodie"], collection, 36, 18), "chest"))
    objects.append((add_sphere("Fuxie_Belly_Cream", (0, -0.272, 0.98), (0.23, 0.045, 0.32), mats["cream"], collection, 28, 12), "chest"))
    objects.append((add_sphere("Fuxie_Hood_Left_Bulk", (-0.23, -0.12, 1.27), (0.16, 0.08, 0.13), mats["hoodie_shadow"], collection, 20, 8), "chest"))
    objects.append((add_sphere("Fuxie_Hood_Right_Bulk", (0.23, -0.12, 1.27), (0.16, 0.08, 0.13), mats["hoodie_shadow"], collection, 20, 8), "chest"))
    objects.append((add_torus("Fuxie_Hood_Rim", (0, -0.215, 1.36), 0.315, 0.026, mats["hoodie_shadow"], collection, (math.pi / 2, 0, 0)), "chest"))
    objects.append((add_cube("Fuxie_Jacket_Left_Panel", (-0.145, -0.282, 0.99), (0.105, 0.020, 0.345), mats["hoodie_light"], collection, 0.035), "chest"))
    objects.append((add_cube("Fuxie_Jacket_Right_Panel", (0.145, -0.282, 0.99), (0.105, 0.020, 0.345), mats["hoodie_light"], collection, 0.035), "chest"))
    objects.append((add_cylinder("Fuxie_Zipper_Line", (0, -0.312, 0.99), 0.008, 0.62, mats["white"], collection, (0, 0, 0), 12), "chest"))
    objects.append((add_cylinder("Fuxie_Drawstring_L", (-0.16, -0.302, 1.18), 0.011, 0.36, mats["white"], collection, (0.11, 0, 0), 12), "chest"))
    objects.append((add_cylinder("Fuxie_Drawstring_R", (0.16, -0.302, 1.18), 0.011, 0.36, mats["white"], collection, (-0.11, 0, 0), 12), "chest"))
    objects.append((add_sphere("Fuxie_Drawstring_Knot_L", (-0.17, -0.306, 0.995), (0.030, 0.015, 0.030), mats["white"], collection, 12, 6), "chest"))
    objects.append((add_sphere("Fuxie_Drawstring_Knot_R", (0.17, -0.306, 0.995), (0.030, 0.015, 0.030), mats["white"], collection, 12, 6), "chest"))
    objects.append((add_quad("Fuxie_Bandana_Triangle", [(-0.255, -0.326, 1.305), (0.255, -0.326, 1.305), (0.095, -0.338, 1.115), (-0.095, -0.338, 1.115)], mats["bandana"], collection), "chest"))
    objects.append((add_sphere("Fuxie_Bandana_Knot", (0, -0.352, 1.205), (0.044, 0.011, 0.038), mats["white"], collection, 16, 8), "chest"))
    objects.append((add_sphere("Fuxie_Chest_Token", (0, -0.366, 1.235), (0.043, 0.010, 0.043), mats["white"], collection, 18, 8), "chest"))
    objects.append((add_sphere("Fuxie_Token_Mark", (0, -0.380, 1.235), (0.022, 0.004, 0.025), mats["token"], collection, 14, 6), "chest"))
    objects.append((add_cube("Fuxie_Pocket_L", (-0.27, -0.302, 0.84), (0.065, 0.010, 0.020), mats["cream"], collection, 0.010), "chest"))
    objects.append((add_cube("Fuxie_Pocket_R", (0.27, -0.302, 0.84), (0.065, 0.010, 0.020), mats["cream"], collection, 0.010), "chest"))
    objects.append((add_cube("Fuxie_Shorts_L", (-0.15, -0.02, 0.60), (0.17, 0.18, 0.13), mats["pants"], collection, 0.050), "hips"))
    objects.append((add_cube("Fuxie_Shorts_R", (0.15, -0.02, 0.60), (0.17, 0.18, 0.13), mats["pants"], collection, 0.050), "hips"))

    # Head and fox identity.
    objects.append((add_sphere("Fuxie_Head", (0, -0.035, 1.80), (0.54, 0.40, 0.43), mats["fur_blue"], collection, 48, 24), "head"))
    objects.append((add_sphere("Fuxie_Forehead_Light", (0, -0.392, 1.96), (0.30, 0.028, 0.18), mats["fur_light"], collection, 24, 10), "head"))
    objects.append((add_sphere("Fuxie_Cheek_L", (-0.23, -0.392, 1.64), (0.24, 0.070, 0.125), mats["cream"], collection, 28, 12), "head"))
    objects.append((add_sphere("Fuxie_Cheek_R", (0.23, -0.392, 1.64), (0.24, 0.070, 0.125), mats["cream"], collection, 28, 12), "head"))
    objects.append((add_sphere("Fuxie_Muzzle", (0, -0.466, 1.59), (0.215, 0.088, 0.115), mats["cream"], collection, 28, 12), "jaw"))
    objects.append((add_sphere("Fuxie_Chin_Cream", (0, -0.405, 1.48), (0.26, 0.050, 0.070), mats["cream"], collection, 20, 8), "head"))
    for side, sign in [("L", -1), ("R", 1)]:
        objects.append((add_sphere(f"Fuxie_Cheek_Fluff_{side}_A", (sign * 0.42, -0.405, 1.66), (0.115, 0.025, 0.060), mats["cream"], collection, 16, 6), "head"))
        objects.append((add_sphere(f"Fuxie_Cheek_Fluff_{side}_B", (sign * 0.43, -0.398, 1.56), (0.105, 0.023, 0.052), mats["cream"], collection, 16, 6), "head"))
        objects.append((add_sphere(f"Fuxie_Blue_Side_Fluff_{side}", (sign * 0.52, -0.185, 1.58), (0.095, 0.045, 0.090), mats["fur_blue"], collection, 16, 8), "head"))

    objects.append((add_sphere("Fuxie_Nose", (0, -0.552, 1.685), (0.074, 0.044, 0.040), mats["black"], collection, 24, 10), "head"))
    objects.append((add_sphere("Fuxie_Mouth_Dark", (0, -0.542, 1.535), (0.118, 0.024, 0.046), mats["black"], collection, 20, 8), "jaw"))
    objects.append((add_sphere("Fuxie_Tongue", (0, -0.565, 1.515), (0.078, 0.012, 0.025), mat("tongue", (0.77, 0.28, 0.24, 1.0)), collection, 16, 8), "jaw"))

    # Wide fox ears with visible inner pink and white fluff.
    for side, sign in [("L", -1), ("R", 1)]:
        objects.append((add_cone(f"Fuxie_Ear_{side}_Outer", (sign * 0.405, -0.010, 2.20), 0.210, 0.76, mats["fur_blue"], collection, (0.36, sign * -0.42, sign * 0.50), 56), f"ear.{side}.01"))
        objects.append((add_cone(f"Fuxie_Ear_{side}_Inner", (sign * 0.405, -0.058, 2.18), 0.130, 0.57, mats["ear_inner"], collection, (0.36, sign * -0.42, sign * 0.50), 36), f"ear.{side}.01"))
        objects.append((add_sphere(f"Fuxie_Ear_{side}_WhiteFluff_A", (sign * 0.315, -0.095, 1.98), (0.055, 0.020, 0.095), mats["white"], collection, 12, 6), f"ear.{side}.01"))
        objects.append((add_sphere(f"Fuxie_Ear_{side}_WhiteFluff_B", (sign * 0.375, -0.100, 1.91), (0.050, 0.020, 0.085), mats["white"], collection, 12, 6), f"ear.{side}.01"))

    objects.append((add_cone("Fuxie_Hair_Tuft_Center", (0, -0.37, 2.195), 0.070, 0.24, mats["fur_light"], collection, (0.85, 0, 0.20), 24), "head"))
    objects.append((add_cone("Fuxie_Hair_Tuft_L", (-0.075, -0.365, 2.14), 0.060, 0.20, mats["fur_light"], collection, (0.70, -0.15, -0.28), 24), "head"))
    objects.append((add_cone("Fuxie_Hair_Tuft_R", (0.075, -0.365, 2.14), 0.060, 0.20, mats["fur_light"], collection, (0.70, 0.15, 0.28), 24), "head"))

    for side, x in [("L", -0.18), ("R", 0.18)]:
        objects.append((add_sphere(f"Fuxie_Eye_{side}_Rim", (x, -0.430, 1.81), (0.108, 0.030, 0.133), mats["black"], collection, 28, 12), "head"))
        objects.append((add_sphere(f"Fuxie_Eye_{side}_White", (x, -0.451, 1.81), (0.092, 0.020, 0.116), mats["white"], collection, 28, 12), "head"))
        objects.append((add_sphere(f"Fuxie_Eye_{side}_Iris_Outer", (x, -0.468, 1.795), (0.056, 0.010, 0.073), mats["amber"], collection, 20, 8), "head"))
        objects.append((add_sphere(f"Fuxie_Eye_{side}_Iris_Inner", (x, -0.477, 1.792), (0.043, 0.007, 0.060), mats["brown"], collection, 18, 8), "head"))
        objects.append((add_sphere(f"Fuxie_Eye_{side}_Pupil", (x, -0.486, 1.792), (0.030, 0.005, 0.048), mats["black"], collection, 16, 8), "head"))
        objects.append((add_sphere(f"Fuxie_Eye_{side}_Highlight_Main", (x - 0.030, -0.493, 1.858), (0.017, 0.0035, 0.023), mats["white"], collection, 12, 6), "head"))
        objects.append((add_sphere(f"Fuxie_Eye_{side}_Highlight_Small", (x + 0.027, -0.494, 1.825), (0.010, 0.0035, 0.013), mats["white"], collection, 10, 5), "head"))
        objects.append((add_cube(f"Fuxie_Brow_{side}", (x, -0.442, 1.980), (0.072, 0.007, 0.010), mats["black"], collection, 0.012), "head"))

    # Rounded limbs with visible cuffs and shoe stripes.
    for side, sign in [("L", -1), ("R", 1)]:
        arm_x = sign * 0.45
        objects.append((add_sphere(f"Fuxie_UpperArm_{side}", (arm_x, -0.035, 1.03), (0.100, 0.095, 0.235), mats["hoodie"], collection, 22, 10), f"upper_arm.{side}"))
        objects.append((add_sphere(f"Fuxie_Forearm_{side}", (sign * 0.55, -0.055, 0.79), (0.092, 0.086, 0.205), mats["hoodie"], collection, 22, 10), f"forearm.{side}"))
        objects.append((add_sphere(f"Fuxie_Sleeve_Cuff_{side}", (sign * 0.56, -0.064, 0.66), (0.095, 0.025, 0.035), mats["cream"], collection, 16, 6), f"forearm.{side}"))
        objects.append((add_sphere(f"Fuxie_Hand_{side}", (sign * 0.58, -0.075, 0.56), (0.104, 0.085, 0.105), mats["fur_blue"], collection, 20, 10), f"hand.{side}"))
        objects.append((add_sphere(f"Fuxie_Thigh_{side}", (sign * 0.17, -0.02, 0.46), (0.12, 0.10, 0.19), mats["pants"], collection, 20, 10), f"upper_leg.{side}"))
        objects.append((add_sphere(f"Fuxie_Shin_{side}", (sign * 0.22, -0.02, 0.25), (0.090, 0.075, 0.155), mats["cream_shadow"], collection, 18, 8), f"shin.{side}"))
        objects.append((add_sphere(f"Fuxie_Shoe_{side}", (sign * 0.27, -0.190, 0.10), (0.175, 0.13, 0.072), mats["shoe"], collection, 22, 8), f"foot.{side}"))
        objects.append((add_sphere(f"Fuxie_Shoe_Toe_{side}", (sign * 0.31, -0.286, 0.10), (0.165, 0.070, 0.056), mats["white"], collection, 18, 8), f"foot.{side}"))
        objects.append((add_cube(f"Fuxie_Shoe_Lace_{side}_A", (sign * 0.27, -0.306, 0.155), (0.060, 0.006, 0.010), mats["white"], collection, 0.006), f"foot.{side}"))
        objects.append((add_cube(f"Fuxie_Shoe_Lace_{side}_B", (sign * 0.27, -0.311, 0.125), (0.062, 0.006, 0.010), mats["white"], collection, 0.006), f"foot.{side}"))

    # Larger, softer right-side tail, with a cream tip like the reference.
    objects.append((add_sphere("Fuxie_Tail_Base", (0.39, 0.12, 0.78), (0.20, 0.13, 0.17), mats["fur_shadow"], collection, 24, 10), "tail.01"))
    objects.append((add_sphere("Fuxie_Tail_Mid", (0.69, 0.13, 0.98), (0.34, 0.17, 0.22), mats["fur_blue"], collection, 32, 14), "tail.02"))
    objects.append((add_sphere("Fuxie_Tail_UpperBlue", (0.88, 0.12, 1.14), (0.27, 0.14, 0.18), mats["fur_light"], collection, 24, 10), "tail.02"))
    objects.append((add_sphere("Fuxie_Tail_Tip_Cream", (1.04, 0.11, 1.25), (0.22, 0.12, 0.145), mats["white"], collection, 22, 10), "tail.03"))

    objects.append((add_sphere("Fuxie_Shadow", (0, 0.05, 0.035), (0.72, 0.10, 0.020), mat("shadow", (0.02, 0.12, 0.18, 0.22)), collection, 32, 8), "root"))

    v7.bind_many(objects, armature)
    return [obj for obj, _ in objects]


def setup_scene() -> None:
    v7.setup_scene()
    scene = bpy.context.scene
    scene.render.fps = 60
    scene.render.resolution_x = 1200
    scene.render.resolution_y = 1200
    scene.world.color = (0.965, 0.985, 1.0)
    if scene.camera:
        scene.camera.name = "Fuxie_V7B_Camera"
        scene.camera.location = (0, -5.25, 1.34)
        scene.camera.rotation_euler = (Vector((0, 0, 1.36)) - scene.camera.location).to_track_quat("-Z", "Y").to_euler()
        scene.camera.data.ortho_scale = 2.90
    for obj in bpy.context.scene.objects:
        if obj.type == "LIGHT":
            obj.name = obj.name.replace("V7", "V7B")


def export_assets(character_collection: bpy.types.Collection) -> None:
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
    v7.select_collection(character_collection)
    props = bpy.ops.export_scene.gltf.get_rna_type().properties.keys()
    kwargs = {
        "filepath": str(GLB_PATH),
        "export_format": "GLB",
        "use_selection": True,
        "export_yup": True,
        "export_animations": True,
        "export_skins": True,
    }
    if "export_animation_mode" in props:
        kwargs["export_animation_mode"] = "NLA_TRACKS"
    if "export_nla_strips" in props:
        kwargs["export_nla_strips"] = True
    if "export_force_sampling" in props:
        kwargs["export_force_sampling"] = True
    bpy.ops.export_scene.gltf(**kwargs)
    v7.select_collection(character_collection)
    bpy.ops.export_scene.fbx(
        filepath=str(FBX_PATH),
        use_selection=True,
        object_types={"ARMATURE", "MESH"},
        add_leaf_bones=False,
        bake_anim=True,
        bake_anim_use_nla_strips=True,
        bake_anim_use_all_actions=False,
        apply_unit_scale=True,
    )
    bpy.context.scene.frame_set(1)
    bpy.context.scene.render.image_settings.file_format = "PNG"
    bpy.context.scene.render.filepath = str(PREVIEW_PATH)
    bpy.ops.render.render(write_still=True)


def copy_public_assets() -> None:
    shutil.copy2(GLB_PATH, PUBLIC_GLB_PATH)
    shutil.copy2(PREVIEW_PATH, PUBLIC_POSTER_PATH)
    shutil.copy2(MANIFEST_PATH, PUBLIC_MANIFEST_PATH)


def write_manifest(character_collection: bpy.types.Collection, reference_collection: bpy.types.Collection) -> None:
    meshes = [obj for obj in character_collection.objects if obj.type == "MESH"]
    armature = next((obj for obj in character_collection.objects if obj.type == "ARMATURE"), None)
    manifest = {
        "name": "Fuxie_Character_v7b_true_mesh_polish",
        "status": "image_guided_true_mesh_polish",
        "source_note": "Stylized true-mesh 3D approximation built directly against the approved Fuxie 3D reference image set. This is not a 100% reconstruction of an unavailable source mesh.",
        "identity_notes": [
            "Head, ears, eyes, cheeks, hoodie, bandana/token, shoes, and tail proportions are matched against the Fuxie front and three-quarter references.",
            "V7B keeps the real armature and six exported game animation clips from the V7 rig pipeline.",
            "This version favors Fuxie identity over procedural purity while staying lightweight for real-time WebGL.",
        ],
        "references": [
            str(path.relative_to(ROOT)).replace("\\", "/")
            for path in [FRONT_REFERENCE, THREE_QUARTER_REFERENCE, SIDE_REFERENCE, BACK_REFERENCE, FACES_REFERENCE, TAIL_REFERENCE]
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
            "reference_planes": [obj.name for obj in reference_collection.objects],
            "fps": bpy.context.scene.render.fps,
            "clips": CLIPS,
            "target_runtime": "60fps WebGL true mesh mascot rig",
        },
        "limits": [
            "Approximation from render images only, not a recovered original 3D mesh.",
            "Weights remain one-bone-per-part for stable game animation; production polish still needs blended weight paint.",
            "Material colors are procedural and image-guided; no final painted UV atlas yet.",
        ],
        "next_step": "Review V7B preview against the Fuxie 3D image set, then continue into UV/texture paint and blended deformation polish.",
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")


def main() -> None:
    ensure_dirs()
    v7.clear_scene()
    setup_scene()
    character_collection = v7.make_collection("Fuxie_V7B_TrueMesh_Export")
    reference_collection = v7.make_collection("Fuxie_V7B_Source_References")
    armature = create_armature(character_collection)
    create_character(character_collection, armature)
    v7.add_reference_plane("Fuxie_V7B_Reference_Front", FRONT_REFERENCE, 2.55, (-2.15, 0.35, 0.04), reference_collection)
    v7.add_reference_plane("Fuxie_V7B_Reference_ThreeQuarter", THREE_QUARTER_REFERENCE, 2.55, (2.15, 0.35, 0.04), reference_collection)
    v7.add_reference_plane("Fuxie_V7B_Reference_Side", SIDE_REFERENCE, 2.20, (3.75, 0.35, 0.10), reference_collection)
    v7.add_reference_plane("Fuxie_V7B_Reference_Back", BACK_REFERENCE, 2.20, (-3.75, 0.35, 0.10), reference_collection)
    v7.add_reference_plane("Fuxie_V7B_Reference_Faces", FACES_REFERENCE, 1.0, (0, 0.35, 2.86), reference_collection)
    v7.add_reference_plane("Fuxie_V7B_Reference_Tail", TAIL_REFERENCE, 0.82, (0, 0.35, -0.98), reference_collection)
    v7.animate(armature)
    export_assets(character_collection)
    write_manifest(character_collection, reference_collection)
    copy_public_assets()
    print(f"Saved V7B true mesh Blender file: {BLEND_PATH}")
    print(f"Exported V7B true mesh GLB: {GLB_PATH}")
    print(f"Exported V7B true mesh FBX: {FBX_PATH}")
    print(f"Rendered V7B true mesh preview: {PREVIEW_PATH}")


if __name__ == "__main__":
    main()
