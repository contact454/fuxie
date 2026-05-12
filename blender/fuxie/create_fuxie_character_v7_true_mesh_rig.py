from __future__ import annotations

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

BLEND_PATH = BLENDER_DIR / "Fuxie_Character_v7_true_mesh_rig.blend"
GLB_PATH = MODEL_DIR / "Fuxie_Character_v7_true_mesh_rig.glb"
FBX_PATH = MODEL_DIR / "Fuxie_Character_v7_true_mesh_rig.fbx"
PREVIEW_PATH = BLENDER_DIR / "Fuxie_preview_v7_true_mesh_rig.png"
MANIFEST_PATH = BLENDER_DIR / "Fuxie_Character_v7_true_mesh_rig_manifest.json"
PUBLIC_GLB_PATH = PUBLIC_LIVE_DIR / "fuxie-true-mesh-v7.glb"
PUBLIC_POSTER_PATH = PUBLIC_LIVE_DIR / "fuxie-true-mesh-v7-poster.png"
PUBLIC_MANIFEST_PATH = PUBLIC_LIVE_DIR / "fuxie-true-mesh-v7.json"

CLIPS = {
    "idle": {"frames": 120, "description": "Smooth breathing, head bob, tail sway, and ear twitch at 60fps."},
    "wave": {"frames": 96, "description": "Left-hand wave with chest counter-sway and tail follow-through."},
    "talk": {"frames": 120, "description": "Jaw/mouth open-close, head nod, and hand gesture loop."},
    "listen": {"frames": 120, "description": "Attentive head tilt, ear focus, and gentle tail motion."},
    "reward": {"frames": 96, "description": "In-place hop with squash/stretch, arms up, and fast tail wag."},
    "tryAgain": {"frames": 120, "description": "Supportive nod, small hand wave, and soft posture."},
}

COLORS = {
    "fur_blue": (0.075, 0.51, 0.88, 1.0),
    "fur_shadow": (0.04, 0.34, 0.72, 1.0),
    "cream": (0.92, 0.88, 0.80, 1.0),
    "ear_inner": (0.86, 0.63, 0.57, 1.0),
    "hoodie": (0.02, 0.66, 0.70, 1.0),
    "hoodie_shadow": (0.02, 0.42, 0.48, 1.0),
    "pants": (0.03, 0.22, 0.42, 1.0),
    "shoe": (0.03, 0.43, 0.86, 1.0),
    "white": (0.98, 0.98, 0.94, 1.0),
    "black": (0.02, 0.02, 0.025, 1.0),
    "amber": (1.00, 0.58, 0.08, 1.0),
    "token": (0.15, 0.50, 0.95, 1.0),
    "gold": (1.00, 0.74, 0.20, 1.0),
}


def ensure_dirs() -> None:
    BLENDER_DIR.mkdir(parents=True, exist_ok=True)
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_LIVE_DIR.mkdir(parents=True, exist_ok=True)


def clear_scene() -> None:
    bpy.ops.object.mode_set(mode="OBJECT") if bpy.ops.object.mode_set.poll() else None
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def make_collection(name: str) -> bpy.types.Collection:
    collection = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(collection)
    return collection


def link_only(obj: bpy.types.Object, collection: bpy.types.Collection) -> bpy.types.Object:
    collection.objects.link(obj)
    for existing in list(obj.users_collection):
        if existing != collection:
            existing.objects.unlink(obj)
    return obj


def material(name: str, color: tuple[float, float, float, float], roughness: float = 0.72) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Roughness"].default_value = roughness
        if "Metallic" in bsdf.inputs:
            bsdf.inputs["Metallic"].default_value = 0.0
    return mat


def image_material(name: str, image_path: Path) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    tex = nodes.new("ShaderNodeTexImage")
    tex.image = bpy.data.images.load(str(image_path), check_existing=True)
    if bsdf:
        mat.node_tree.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
        bsdf.inputs["Roughness"].default_value = 0.86
    return mat


def shade_smooth(obj: bpy.types.Object) -> bpy.types.Object:
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    try:
        bpy.ops.object.shade_smooth()
    except RuntimeError:
        pass
    obj.select_set(False)
    return obj


def add_uv_sphere(
    name: str,
    loc: tuple[float, float, float],
    scale: tuple[float, float, float],
    mat: bpy.types.Material,
    collection: bpy.types.Collection,
    segments: int = 32,
    rings: int = 16,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=loc, scale=scale)
    obj = bpy.context.object
    obj.name = name
    obj.data.name = f"{name}_Mesh"
    obj.data.materials.append(mat)
    shade_smooth(obj)
    return link_only(obj, collection)


def add_cube(
    name: str,
    loc: tuple[float, float, float],
    scale: tuple[float, float, float],
    mat: bpy.types.Material,
    collection: bpy.types.Collection,
    bevel: float = 0.02,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(location=loc, scale=scale)
    obj = bpy.context.object
    obj.name = name
    obj.data.name = f"{name}_Mesh"
    obj.data.materials.append(mat)
    if bevel > 0:
        mod = obj.modifiers.new(name="Fuxie_Game_Bevel", type="BEVEL")
        mod.width = bevel
        mod.segments = 4
        obj.modifiers.new(name="Fuxie_Game_WeightedNormals", type="WEIGHTED_NORMAL")
    return link_only(obj, collection)


def add_cone(
    name: str,
    loc: tuple[float, float, float],
    radius1: float,
    depth: float,
    mat: bpy.types.Material,
    collection: bpy.types.Collection,
    rotation: tuple[float, float, float] = (0, 0, 0),
    vertices: int = 48,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=radius1, radius2=0.03, depth=depth, location=loc, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.data.name = f"{name}_Mesh"
    obj.data.materials.append(mat)
    shade_smooth(obj)
    return link_only(obj, collection)


def add_cylinder(
    name: str,
    loc: tuple[float, float, float],
    radius: float,
    depth: float,
    mat: bpy.types.Material,
    collection: bpy.types.Collection,
    rotation: tuple[float, float, float] = (0, 0, 0),
    vertices: int = 32,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.data.name = f"{name}_Mesh"
    obj.data.materials.append(mat)
    shade_smooth(obj)
    return link_only(obj, collection)


def add_torus(
    name: str,
    loc: tuple[float, float, float],
    major_radius: float,
    minor_radius: float,
    mat: bpy.types.Material,
    collection: bpy.types.Collection,
    rotation: tuple[float, float, float] = (0, 0, 0),
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_torus_add(major_radius=major_radius, minor_radius=minor_radius, major_segments=32, minor_segments=8, location=loc, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.data.name = f"{name}_Mesh"
    obj.data.materials.append(mat)
    shade_smooth(obj)
    return link_only(obj, collection)


def create_armature(collection: bpy.types.Collection) -> bpy.types.Object:
    bpy.ops.object.armature_add(enter_editmode=True, location=(0, 0, 0))
    armature = bpy.context.object
    armature.name = "Fuxie_V7_TrueMesh_Armature"
    armature.data.name = "Fuxie_V7_TrueMesh_Skeleton"
    armature.show_in_front = True
    link_only(armature, collection)
    edit_bones = armature.data.edit_bones
    edit_bones.remove(edit_bones[0])
    specs = {
        "root": ((0, 0, 0.05), (0, 0, 0.35), None),
        "hips": ((0, 0, 0.60), (0, 0, 0.92), "root"),
        "spine": ((0, 0, 0.92), (0, 0, 1.22), "hips"),
        "chest": ((0, 0, 1.22), (0, 0, 1.48), "spine"),
        "neck": ((0, 0, 1.48), (0, 0, 1.63), "chest"),
        "head": ((0, 0, 1.63), (0, 0, 2.15), "neck"),
        "jaw": ((0, -0.17, 1.67), (0, -0.18, 1.52), "head"),
        "ear.L.01": ((-0.36, 0.00, 2.08), (-0.58, 0.00, 2.62), "head"),
        "ear.R.01": ((0.36, 0.00, 2.08), (0.58, 0.00, 2.62), "head"),
        "upper_arm.L": ((-0.36, 0, 1.26), (-0.58, 0, 1.03), "chest"),
        "forearm.L": ((-0.58, 0, 1.03), (-0.70, 0, 0.70), "upper_arm.L"),
        "hand.L": ((-0.70, 0, 0.70), (-0.73, 0, 0.56), "forearm.L"),
        "upper_arm.R": ((0.36, 0, 1.26), (0.58, 0, 1.03), "chest"),
        "forearm.R": ((0.58, 0, 1.03), (0.70, 0, 0.70), "upper_arm.R"),
        "hand.R": ((0.70, 0, 0.70), (0.73, 0, 0.56), "forearm.R"),
        "upper_leg.L": ((-0.18, 0, 0.66), (-0.24, 0, 0.38), "hips"),
        "shin.L": ((-0.24, 0, 0.38), (-0.28, 0, 0.16), "upper_leg.L"),
        "foot.L": ((-0.28, -0.06, 0.16), (-0.42, -0.24, 0.10), "shin.L"),
        "upper_leg.R": ((0.18, 0, 0.66), (0.24, 0, 0.38), "hips"),
        "shin.R": ((0.24, 0, 0.38), (0.28, 0, 0.16), "upper_leg.R"),
        "foot.R": ((0.28, -0.06, 0.16), (0.42, -0.24, 0.10), "shin.R"),
        "tail.01": ((0.30, 0.08, 0.82), (0.58, 0.12, 1.02), "hips"),
        "tail.02": ((0.58, 0.12, 1.02), (0.80, 0.10, 1.22), "tail.01"),
        "tail.03": ((0.80, 0.10, 1.22), (0.96, 0.08, 1.38), "tail.02"),
        "CTRL_root": ((-1.06, 0, 0.07), (1.06, 0, 0.07), None),
        "CTRL_body": ((-0.66, 0, 1.10), (0.66, 0, 1.10), None),
        "CTRL_head": ((-0.55, 0, 2.28), (0.55, 0, 2.28), None),
        "CTRL_tail": ((0.72, 0.10, 1.48), (1.10, 0.10, 1.62), None),
    }
    created = {}
    for name, (head, tail, parent) in specs.items():
        bone = edit_bones.new(name)
        bone.head = head
        bone.tail = tail
        if parent:
            bone.parent = created[parent]
            bone.use_connect = False
        if name.startswith("CTRL_"):
            bone.use_deform = False
        created[name] = bone
    bpy.ops.object.mode_set(mode="POSE")
    for bone in armature.pose.bones:
        bone.rotation_mode = "XYZ"
    bpy.ops.object.mode_set(mode="OBJECT")
    return armature


def bind_to_bone(obj: bpy.types.Object, armature: bpy.types.Object, bone_name: str) -> None:
    group = obj.vertex_groups.new(name=bone_name)
    group.add([vertex.index for vertex in obj.data.vertices], 1.0, "ADD")
    modifier = obj.modifiers.new(name="Fuxie_V7_Armature_Deform", type="ARMATURE")
    modifier.object = armature
    obj.parent = armature


def bind_many(objects: list[tuple[bpy.types.Object, str]], armature: bpy.types.Object) -> None:
    for obj, bone_name in objects:
        bind_to_bone(obj, armature, bone_name)


def create_character(collection: bpy.types.Collection, armature: bpy.types.Object) -> list[bpy.types.Object]:
    mats = {key: material(f"Fuxie_V7_{key}", value) for key, value in COLORS.items()}
    objects: list[tuple[bpy.types.Object, str]] = []

    # Body and outfit
    objects.append((add_uv_sphere("Fuxie_Body_Hoodie", (0, -0.01, 0.98), (0.38, 0.24, 0.43), mats["hoodie"], collection), "chest"))
    objects.append((add_uv_sphere("Fuxie_Belly_Cream", (0, -0.218, 0.95), (0.22, 0.040, 0.30), mats["cream"], collection, 24, 12), "chest"))
    objects.append((add_cube("Fuxie_Jacket_Left_Panel", (-0.14, -0.238, 0.96), (0.10, 0.018, 0.33), mats["hoodie"], collection, 0.028), "chest"))
    objects.append((add_cube("Fuxie_Jacket_Right_Panel", (0.14, -0.238, 0.96), (0.10, 0.018, 0.33), mats["hoodie"], collection, 0.028), "chest"))
    objects.append((add_uv_sphere("Fuxie_Bandana_Blue", (0, -0.238, 1.30), (0.27, 0.032, 0.15), mats["fur_shadow"], collection, 24, 10), "chest"))
    objects.append((add_torus("Fuxie_Hood_Rim", (0, -0.20, 1.38), 0.30, 0.022, mats["hoodie_shadow"], collection, (math.pi / 2, 0, 0)), "chest"))
    objects.append((add_cylinder("Fuxie_Drawstring_L", (-0.13, -0.255, 1.18), 0.012, 0.36, mats["white"], collection, (0.12, 0, 0)), "chest"))
    objects.append((add_cylinder("Fuxie_Drawstring_R", (0.13, -0.255, 1.18), 0.012, 0.36, mats["white"], collection, (-0.12, 0, 0)), "chest"))
    objects.append((add_uv_sphere("Fuxie_Chest_Token", (0, -0.275, 1.26), (0.06, 0.015, 0.06), mats["token"], collection, 24, 10), "chest"))
    objects.append((add_uv_sphere("Fuxie_Token_Mark", (0, -0.292, 1.27), (0.030, 0.005, 0.038), mats["white"], collection, 16, 8), "chest"))
    objects.append((add_cube("Fuxie_Shorts_L", (-0.15, -0.015, 0.62), (0.16, 0.19, 0.13), mats["pants"], collection, 0.045), "hips"))
    objects.append((add_cube("Fuxie_Shorts_R", (0.15, -0.015, 0.62), (0.16, 0.19, 0.13), mats["pants"], collection, 0.045), "hips"))

    # Head, ears, face
    objects.append((add_uv_sphere("Fuxie_Head", (0, -0.02, 1.82), (0.50, 0.40, 0.45), mats["fur_blue"], collection, 40, 20), "head"))
    objects.append((add_uv_sphere("Fuxie_Cheek_L", (-0.21, -0.355, 1.66), (0.21, 0.065, 0.12), mats["cream"], collection, 24, 10), "head"))
    objects.append((add_uv_sphere("Fuxie_Cheek_R", (0.21, -0.355, 1.66), (0.21, 0.065, 0.12), mats["cream"], collection, 24, 10), "head"))
    objects.append((add_uv_sphere("Fuxie_Muzzle", (0, -0.405, 1.62), (0.20, 0.09, 0.115), mats["cream"], collection, 24, 12), "jaw"))
    objects.append((add_uv_sphere("Fuxie_Nose", (0, -0.500, 1.69), (0.065, 0.040, 0.040), mats["black"], collection, 20, 10), "head"))
    objects.append((add_uv_sphere("Fuxie_Mouth", (0, -0.495, 1.55), (0.090, 0.020, 0.032), mats["black"], collection, 20, 8), "jaw"))
    objects.append((add_uv_sphere("Fuxie_Tongue", (0, -0.515, 1.525), (0.064, 0.012, 0.023), material("Fuxie_V7_tongue", (0.78, 0.28, 0.24, 1)), collection, 16, 8), "jaw"))
    objects.append((add_cone("Fuxie_Ear_L_Outer", (-0.35, -0.005, 2.22), 0.18, 0.70, mats["fur_blue"], collection, (0.28, -0.32, 0.36), 48), "ear.L.01"))
    objects.append((add_cone("Fuxie_Ear_R_Outer", (0.35, -0.005, 2.22), 0.18, 0.70, mats["fur_blue"], collection, (0.28, 0.32, -0.36), 48), "ear.R.01"))
    objects.append((add_cone("Fuxie_Ear_L_Inner", (-0.35, -0.045, 2.18), 0.105, 0.50, mats["ear_inner"], collection, (0.28, -0.32, 0.36), 32), "ear.L.01"))
    objects.append((add_cone("Fuxie_Ear_R_Inner", (0.35, -0.045, 2.18), 0.105, 0.50, mats["ear_inner"], collection, (0.28, 0.32, -0.36), 32), "ear.R.01"))
    objects.append((add_uv_sphere("Fuxie_Hair_Tuft_1", (0, -0.39, 2.23), (0.105, 0.032, 0.070), mats["fur_blue"], collection, 16, 8), "head"))
    objects.append((add_uv_sphere("Fuxie_Hair_Tuft_2", (-0.08, -0.38, 2.17), (0.090, 0.030, 0.055), mats["fur_blue"], collection, 16, 8), "head"))
    objects.append((add_uv_sphere("Fuxie_Hair_Tuft_3", (0.08, -0.38, 2.17), (0.090, 0.030, 0.055), mats["fur_blue"], collection, 16, 8), "head"))

    for side, x in [("L", -0.17), ("R", 0.17)]:
        objects.append((add_uv_sphere(f"Fuxie_Eye_{side}_White", (x, -0.405, 1.82), (0.092, 0.026, 0.118), mats["white"], collection, 24, 12), "head"))
        objects.append((add_uv_sphere(f"Fuxie_Eye_{side}_Iris", (x, -0.434, 1.81), (0.049, 0.012, 0.068), mats["amber"], collection, 18, 8), "head"))
        objects.append((add_uv_sphere(f"Fuxie_Eye_{side}_Pupil", (x, -0.447, 1.805), (0.030, 0.008, 0.046), mats["black"], collection, 16, 8), "head"))
        objects.append((add_uv_sphere(f"Fuxie_Eye_{side}_Highlight", (x - 0.023, -0.456, 1.857), (0.016, 0.004, 0.022), mats["white"], collection, 12, 6), "head"))
        objects.append((add_cube(f"Fuxie_Brow_{side}", (x, -0.43, 1.975), (0.073, 0.007, 0.008), mats["black"], collection, 0.01), "head"))

    # Limbs
    for side, sign in [("L", -1), ("R", 1)]:
        objects.append((add_uv_sphere(f"Fuxie_UpperArm_{side}", (sign * 0.39, -0.01, 1.04), (0.090, 0.090, 0.22), mats["hoodie"], collection, 20, 10), f"upper_arm.{side}"))
        objects.append((add_uv_sphere(f"Fuxie_Forearm_{side}", (sign * 0.50, -0.02, 0.80), (0.086, 0.080, 0.205), mats["hoodie"], collection, 20, 10), f"forearm.{side}"))
        objects.append((add_uv_sphere(f"Fuxie_Hand_{side}", (sign * 0.55, -0.06, 0.57), (0.100, 0.080, 0.100), mats["fur_blue"], collection, 20, 10), f"hand.{side}"))
        objects.append((add_uv_sphere(f"Fuxie_Thigh_{side}", (sign * 0.17, -0.01, 0.48), (0.12, 0.10, 0.19), mats["pants"], collection, 20, 10), f"upper_leg.{side}"))
        objects.append((add_uv_sphere(f"Fuxie_Shin_{side}", (sign * 0.22, -0.01, 0.27), (0.09, 0.075, 0.16), mats["cream"], collection, 18, 8), f"shin.{side}"))
        objects.append((add_uv_sphere(f"Fuxie_Shoe_{side}", (sign * 0.27, -0.18, 0.10), (0.17, 0.13, 0.07), mats["shoe"], collection, 20, 8), f"foot.{side}"))
        objects.append((add_uv_sphere(f"Fuxie_Shoe_Toe_{side}", (sign * 0.31, -0.27, 0.10), (0.16, 0.07, 0.055), mats["white"], collection, 18, 8), f"foot.{side}"))

    # Tail chain
    objects.append((add_uv_sphere("Fuxie_Tail_Base", (0.43, 0.13, 0.82), (0.20, 0.14, 0.18), mats["fur_blue"], collection, 24, 12), "tail.01"))
    objects.append((add_uv_sphere("Fuxie_Tail_Mid", (0.70, 0.13, 1.02), (0.30, 0.16, 0.20), mats["fur_blue"], collection, 24, 12), "tail.02"))
    objects.append((add_uv_sphere("Fuxie_Tail_Tip", (0.95, 0.12, 1.20), (0.21, 0.12, 0.15), mats["white"], collection, 20, 10), "tail.03"))

    # Ground shadow
    objects.append((add_uv_sphere("Fuxie_Shadow", (0, 0.05, 0.035), (0.72, 0.10, 0.020), material("Fuxie_V7_shadow", (0.02, 0.12, 0.18, 0.22)), collection, 32, 8), "root"))

    bind_many(objects, armature)
    return [obj for obj, _ in objects]


def add_reference_plane(
    name: str,
    image_path: Path,
    height: float,
    loc: tuple[float, float, float],
    collection: bpy.types.Collection,
) -> bpy.types.Object:
    image = bpy.data.images.load(str(image_path), check_existing=True)
    width = height * image.size[0] / image.size[1]
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    verts = [(-width / 2, 0, 0), (width / 2, 0, 0), (width / 2, 0, height), (-width / 2, 0, height)]
    mesh.from_pydata(verts, [], [(0, 1, 2, 3)])
    mesh.update()
    uv = mesh.uv_layers.new(name="ReferenceUV")
    coords = [(0, 0), (1, 0), (1, 1), (0, 1)]
    for poly in mesh.polygons:
        for loop_index in poly.loop_indices:
            uv.data[loop_index].uv = coords[mesh.loops[loop_index].vertex_index]
    obj = bpy.data.objects.new(name, mesh)
    obj.location = loc
    obj.hide_render = True
    obj.hide_viewport = True
    obj.data.materials.append(image_material(f"{name}_Material", image_path))
    collection.objects.link(obj)
    return obj


def key_bone(armature: bpy.types.Object, bone_name: str, frame: int, loc=None, rot=None, scale=None) -> None:
    bone = armature.pose.bones[bone_name]
    if loc is not None:
        bone.location = loc
        bone.keyframe_insert("location", frame=frame)
    if rot is not None:
        bone.rotation_euler = rot
        bone.keyframe_insert("rotation_euler", frame=frame)
    if scale is not None:
        bone.scale = scale
        bone.keyframe_insert("scale", frame=frame)


def reset_pose(armature: bpy.types.Object, frame: int) -> None:
    for bone in armature.pose.bones:
        bone.location = (0, 0, 0)
        bone.rotation_euler = (0, 0, 0)
        bone.scale = (1, 1, 1)
        bone.keyframe_insert("location", frame=frame)
        bone.keyframe_insert("rotation_euler", frame=frame)
        bone.keyframe_insert("scale", frame=frame)


def stash_action(owner: bpy.types.ID, name: str, action: bpy.types.Action, frames: int) -> None:
    action.name = name
    anim = owner.animation_data_create()
    track = anim.nla_tracks.new()
    track.name = name
    strip = track.strips.new(name, 1, action)
    strip.frame_start = 1
    strip.frame_end = frames


def make_clip(armature: bpy.types.Object, name: str, frames: int, animator) -> None:
    if armature.animation_data:
        armature.animation_data.action = None
    action = bpy.data.actions.new(f"Fuxie_V7_TrueMesh_{name}")
    armature.animation_data_create().action = action
    reset_pose(armature, 1)
    animator()
    reset_pose(armature, frames)
    stash_action(armature, name, action, frames)
    armature.animation_data.action = None


def animate(armature: bpy.types.Object) -> None:
    def idle() -> None:
        for frame, lift, body, head, tail in [(1, 0, 0, 0, 0), (30, 0.025, -0.012, 0.015, 0.13), (60, 0, 0, 0, 0), (90, 0.025, 0.012, -0.015, -0.13), (120, 0, 0, 0, 0)]:
            key_bone(armature, "root", frame, loc=(0, 0, lift), scale=(1, 1 + lift * 0.55, 1))
            key_bone(armature, "chest", frame, rot=(0, 0, body))
            key_bone(armature, "head", frame, rot=(0, 0, head))
            key_bone(armature, "tail.02", frame, rot=(0, 0, tail))
            key_bone(armature, "ear.L.01", frame, rot=(0, 0, -tail * 0.22))
            key_bone(armature, "ear.R.01", frame, rot=(0, 0, tail * 0.22))

    def wave() -> None:
        for frame, forearm, hand, body, tail in [(1, 0, 0, 0, 0), (12, -0.55, 0.25, -0.03, 0.10), (24, -1.25, -0.48, 0.04, -0.20), (36, -0.72, 0.55, -0.02, 0.20), (48, -1.28, -0.50, 0.04, -0.24), (72, -0.78, 0.42, -0.02, 0.16), (96, 0, 0, 0, 0)]:
            key_bone(armature, "chest", frame, rot=(0, 0, body))
            key_bone(armature, "upper_arm.L", frame, rot=(0, 0, forearm * 0.28))
            key_bone(armature, "forearm.L", frame, rot=(0, 0, forearm))
            key_bone(armature, "hand.L", frame, rot=(0, 0, hand))
            key_bone(armature, "head", frame, rot=(0, 0, -body * 0.7))
            key_bone(armature, "tail.02", frame, rot=(0, 0, tail))

    def talk() -> None:
        for frame in range(1, 121, 8):
            phase = frame // 8
            mouth = 1.0 + (0.26 if phase % 2 else 0.0)
            nod = 0.022 * math.sin(frame * 0.18)
            hand = 0.14 * math.sin(frame * 0.25)
            key_bone(armature, "root", frame, loc=(0, 0, 0.010 if phase % 2 else 0.0))
            key_bone(armature, "head", frame, rot=(0, 0, nod))
            key_bone(armature, "jaw", frame, scale=(1.0, mouth, 1.0), loc=(0, -0.010 if phase % 2 else 0, -0.014 if phase % 2 else 0))
            key_bone(armature, "forearm.R", frame, rot=(0, 0, hand))

    def listen() -> None:
        for frame, tilt, ear, tail in [(1, 0, 0, 0), (25, -0.12, 0.12, 0.08), (60, -0.18, 0.22, -0.06), (95, -0.12, 0.12, 0.08), (120, 0, 0, 0)]:
            key_bone(armature, "head", frame, rot=(0, 0, tilt))
            key_bone(armature, "chest", frame, rot=(0, 0, tilt * 0.22))
            key_bone(armature, "ear.L.01", frame, rot=(0, 0, ear))
            key_bone(armature, "ear.R.01", frame, rot=(0, 0, ear * 0.40))
            key_bone(armature, "tail.02", frame, rot=(0, 0, tail))

    def reward() -> None:
        for frame, lift, squash, arm_l, arm_r, tail in [(1, 0, 1, 0, 0, 0), (12, -0.02, 0.95, -0.2, 0.2, -0.18), (24, 0.15, 1.09, -1.0, 1.0, 0.34), (36, 0.03, 0.98, -0.58, 0.58, -0.30), (48, 0.12, 1.07, -1.05, 1.05, 0.34), (72, 0.02, 0.99, -0.34, 0.34, -0.18), (96, 0, 1, 0, 0, 0)]:
            key_bone(armature, "root", frame, loc=(0, 0, lift), scale=(1 / squash, squash, 1), rot=(0, 0, 0.04 * math.sin(frame)))
            key_bone(armature, "forearm.L", frame, rot=(0, 0, arm_l))
            key_bone(armature, "forearm.R", frame, rot=(0, 0, arm_r))
            key_bone(armature, "head", frame, rot=(0, 0, -0.05 * math.sin(frame * 0.22)))
            key_bone(armature, "tail.02", frame, rot=(0, 0, tail))

    def try_again() -> None:
        for frame, nod, hand, tail in [(1, 0, 0, 0), (30, 0.055, -0.18, 0.08), (60, -0.035, 0.12, -0.06), (90, 0.045, -0.12, 0.06), (120, 0, 0, 0)]:
            key_bone(armature, "head", frame, rot=(0, 0, nod))
            key_bone(armature, "forearm.L", frame, rot=(0, 0, hand))
            key_bone(armature, "tail.02", frame, rot=(0, 0, tail))

    make_clip(armature, "idle", 120, idle)
    make_clip(armature, "wave", 96, wave)
    make_clip(armature, "talk", 120, talk)
    make_clip(armature, "listen", 120, listen)
    make_clip(armature, "reward", 96, reward)
    make_clip(armature, "tryAgain", 120, try_again)


def setup_scene() -> None:
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.frame_start = 1
    scene.frame_end = 120
    scene.render.fps = 60
    scene.render.resolution_x = 1200
    scene.render.resolution_y = 1200
    scene.render.film_transparent = False
    try:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    except TypeError:
        scene.render.engine = "BLENDER_EEVEE"
    scene.world = scene.world or bpy.data.worlds.new("Fuxie_V7_TrueMesh_World")
    scene.world.color = (0.96, 0.985, 1.0)
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "Medium High Contrast"
    bpy.ops.object.light_add(type="AREA", location=(0, -4.2, 4.4))
    light = bpy.context.object
    light.name = "Fuxie_V7_KeyLight"
    light.data.energy = 420
    light.data.size = 4.5
    bpy.ops.object.light_add(type="POINT", location=(-2.0, -2.2, 2.1))
    fill = bpy.context.object
    fill.name = "Fuxie_V7_FillLight"
    fill.data.energy = 90
    bpy.ops.object.camera_add(location=(0, -5.2, 1.36))
    camera = bpy.context.object
    camera.name = "Fuxie_V7_Camera"
    camera.rotation_euler = (Vector((0, 0, 1.34)) - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = 3.05
    scene.camera = camera


def select_collection(collection: bpy.types.Collection) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    for obj in collection.objects:
        obj.select_set(True)
    armature = next((obj for obj in collection.objects if obj.type == "ARMATURE"), None)
    if armature:
        bpy.context.view_layer.objects.active = armature


def export_assets(character_collection: bpy.types.Collection) -> None:
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
    select_collection(character_collection)
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
    select_collection(character_collection)
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
        "name": "Fuxie_Character_v7_true_mesh_rig",
        "status": "true_mesh_game_rig_prototype",
        "source_note": "Stylized true-mesh 3D approximation built against the approved Fuxie 3D reference set. This is not a 100% reconstruction of an unavailable source mesh.",
        "references": [str(path.relative_to(ROOT)).replace("\\", "/") for path in [FRONT_REFERENCE, THREE_QUARTER_REFERENCE, SIDE_REFERENCE, BACK_REFERENCE, FACES_REFERENCE, TAIL_REFERENCE] if path.exists()],
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
            "First true-mesh volume pass: visual identity should be reviewed against V5/V6B before rollout.",
            "Weights are one-bone-per-part for predictable game animation; production deformation still needs blended weight paint.",
            "Textures are material colors, not painted UV atlas yet.",
        ],
        "next_step": "If V7 silhouette is approved, refine mesh proportions, add UV atlas/texture paint, then weight-paint blended joints for V7B.",
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")


def main() -> None:
    ensure_dirs()
    clear_scene()
    setup_scene()
    character_collection = make_collection("Fuxie_V7_TrueMesh_Export")
    reference_collection = make_collection("Fuxie_V7_Source_References")
    armature = create_armature(character_collection)
    create_character(character_collection, armature)
    add_reference_plane("Fuxie_V7_Reference_Front", FRONT_REFERENCE, 2.55, (-2.15, 0.35, 0.04), reference_collection)
    add_reference_plane("Fuxie_V7_Reference_ThreeQuarter", THREE_QUARTER_REFERENCE, 2.55, (2.15, 0.35, 0.04), reference_collection)
    add_reference_plane("Fuxie_V7_Reference_Side", SIDE_REFERENCE, 2.20, (3.75, 0.35, 0.10), reference_collection)
    add_reference_plane("Fuxie_V7_Reference_Back", BACK_REFERENCE, 2.20, (-3.75, 0.35, 0.10), reference_collection)
    add_reference_plane("Fuxie_V7_Reference_Faces", FACES_REFERENCE, 1.0, (0, 0.35, 2.86), reference_collection)
    add_reference_plane("Fuxie_V7_Reference_Tail", TAIL_REFERENCE, 0.82, (0, 0.35, -0.98), reference_collection)
    animate(armature)
    export_assets(character_collection)
    write_manifest(character_collection, reference_collection)
    copy_public_assets()
    print(f"Saved V7 true mesh Blender file: {BLEND_PATH}")
    print(f"Exported V7 true mesh GLB: {GLB_PATH}")
    print(f"Exported V7 true mesh FBX: {FBX_PATH}")
    print(f"Rendered V7 true mesh preview: {PREVIEW_PATH}")


if __name__ == "__main__":
    main()
