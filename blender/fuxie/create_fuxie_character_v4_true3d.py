from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Iterable

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
BLENDER_DIR = ROOT / "blender" / "fuxie"
REFERENCE_DIR = BLENDER_DIR / "references"
MODEL_DIR = ROOT / "assets" / "models"

FRONT_REFERENCE = REFERENCE_DIR / "fuxie_ref_front.png"
SIDE_REFERENCE = REFERENCE_DIR / "fuxie_ref_side.png"
BACK_REFERENCE = REFERENCE_DIR / "fuxie_ref_back.png"
FACES_REFERENCE = REFERENCE_DIR / "fuxie_ref_faces.png"
TAIL_REFERENCE = REFERENCE_DIR / "fuxie_ref_tail_material.png"

BLEND_PATH = BLENDER_DIR / "Fuxie_Character_v4_true3d.blend"
GLB_PATH = MODEL_DIR / "Fuxie_Character_v4_true3d.glb"
FBX_PATH = MODEL_DIR / "Fuxie_Character_v4_true3d.fbx"
PREVIEW_PATH = BLENDER_DIR / "Fuxie_preview_v4_true3d.png"
MANIFEST_PATH = BLENDER_DIR / "Fuxie_Character_v4_true3d_manifest.json"

CLIPS = {
    "idle": {"frames": 120, "description": "60fps breathing with ear and tail motion."},
    "wave": {"frames": 96, "description": "Simple greeting wave."},
    "talk": {"frames": 120, "description": "Light head motion and mouth shape key."},
}


def ensure_dirs() -> None:
    BLENDER_DIR.mkdir(parents=True, exist_ok=True)
    MODEL_DIR.mkdir(parents=True, exist_ok=True)


def clear_scene() -> None:
    bpy.ops.object.mode_set(mode="OBJECT") if bpy.ops.object.mode_set.poll() else None
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def collection(name: str) -> bpy.types.Collection:
    item = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(item)
    return item


def link_only(obj: bpy.types.Object, target: bpy.types.Collection) -> bpy.types.Object:
    target.objects.link(obj)
    for current in list(obj.users_collection):
        if current != target:
            current.objects.unlink(obj)
    return obj


def material(name: str, color: tuple[float, float, float, float], roughness: float = 0.72, metallic: float = 0.0) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Roughness"].default_value = roughness
        if "Metallic" in bsdf.inputs:
            bsdf.inputs["Metallic"].default_value = metallic
    return mat


def image_material(name: str, path: Path) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    image_node = nodes.new("ShaderNodeTexImage")
    image_node.image = bpy.data.images.load(str(path), check_existing=True)
    if bsdf:
        mat.node_tree.links.new(image_node.outputs["Color"], bsdf.inputs["Base Color"])
        bsdf.inputs["Roughness"].default_value = 0.80
    return mat


def apply_transform(obj: bpy.types.Object) -> bpy.types.Object:
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    obj.select_set(False)
    return obj


def shade_smooth(obj: bpy.types.Object) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    try:
        bpy.ops.object.shade_smooth()
    except RuntimeError:
        pass
    obj.select_set(False)


def add_uv(
    name: str,
    loc: tuple[float, float, float],
    scale: tuple[float, float, float],
    mat: bpy.types.Material,
    col: bpy.types.Collection,
    segments: int = 40,
    rings: int = 18,
    rotation: tuple[float, float, float] = (0, 0, 0),
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, radius=1, location=loc, rotation=rotation, scale=scale)
    obj = bpy.context.object
    obj.name = name
    obj.data.name = f"{name}_Mesh"
    obj.data.materials.append(mat)
    link_only(obj, col)
    shade_smooth(obj)
    apply_transform(obj)
    return obj


def add_cone(
    name: str,
    loc: tuple[float, float, float],
    radius1: float,
    radius2: float,
    depth: float,
    mat: bpy.types.Material,
    col: bpy.types.Collection,
    vertices: int = 36,
    rotation: tuple[float, float, float] = (0, 0, 0),
    scale_after: tuple[float, float, float] | None = None,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=radius1, radius2=radius2, depth=depth, location=loc, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.data.name = f"{name}_Mesh"
    if scale_after:
        obj.scale = scale_after
    obj.data.materials.append(mat)
    link_only(obj, col)
    shade_smooth(obj)
    apply_transform(obj)
    return obj


def add_cylinder_between(
    name: str,
    start: tuple[float, float, float],
    end: tuple[float, float, float],
    radius: float,
    mat: bpy.types.Material,
    col: bpy.types.Collection,
    vertices: int = 28,
) -> bpy.types.Object:
    start_v = Vector(start)
    end_v = Vector(end)
    direction = end_v - start_v
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=direction.length, location=start_v + direction * 0.5)
    obj = bpy.context.object
    obj.name = name
    obj.data.name = f"{name}_Mesh"
    obj.rotation_euler = direction.to_track_quat("Z", "Y").to_euler()
    obj.data.materials.append(mat)
    link_only(obj, col)
    shade_smooth(obj)
    apply_transform(obj)
    return obj


def add_box(
    name: str,
    loc: tuple[float, float, float],
    scale: tuple[float, float, float],
    mat: bpy.types.Material,
    col: bpy.types.Collection,
    rotation: tuple[float, float, float] = (0, 0, 0),
    bevel: float = 0.025,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(location=loc, rotation=rotation, scale=scale)
    obj = bpy.context.object
    obj.name = name
    obj.data.name = f"{name}_Mesh"
    obj.data.materials.append(mat)
    link_only(obj, col)
    apply_transform(obj)
    if bevel:
        mod = obj.modifiers.new(name="Fuxie_soft_bevel", type="BEVEL")
        mod.width = bevel
        mod.segments = 6
        obj.modifiers.new(name="Fuxie_weighted_normals", type="WEIGHTED_NORMAL")
    return obj


def add_curve(
    name: str,
    points: list[tuple[float, float, float]],
    mat: bpy.types.Material,
    col: bpy.types.Collection,
    bevel_depth: float = 0.01,
) -> bpy.types.Object:
    curve = bpy.data.curves.new(f"{name}_Curve", "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 20
    curve.bevel_depth = bevel_depth
    curve.bevel_resolution = 3
    spline = curve.splines.new("POLY")
    spline.points.add(len(points) - 1)
    for point, coord in zip(spline.points, points):
        point.co = (*coord, 1)
    obj = bpy.data.objects.new(name, curve)
    col.objects.link(obj)
    obj.data.materials.append(mat)
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.convert(target="MESH")
    obj = bpy.context.object
    obj.name = name
    obj.data.name = f"{name}_Mesh"
    shade_smooth(obj)
    return obj


def add_image_plane(name: str, image_path: Path, height: float, loc: tuple[float, float, float], col: bpy.types.Collection, hide_render: bool = False) -> bpy.types.Object:
    image = bpy.data.images.load(str(image_path), check_existing=True)
    width = height * image.size[0] / image.size[1]
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    verts = [(-width / 2, 0, 0), (width / 2, 0, 0), (width / 2, 0, height), (-width / 2, 0, height)]
    mesh.from_pydata(verts, [], [(0, 1, 2, 3)])
    mesh.update()
    uv = mesh.uv_layers.new(name="Fuxie_Reference_UV")
    coords = [(0, 0), (1, 0), (1, 1), (0, 1)]
    for poly in mesh.polygons:
        for loop_index in poly.loop_indices:
            uv.data[loop_index].uv = coords[mesh.loops[loop_index].vertex_index]
    obj = bpy.data.objects.new(name, mesh)
    obj.location = loc
    obj.data.materials.append(image_material(f"{name}_Material", image_path))
    col.objects.link(obj)
    obj.hide_render = hide_render
    return obj


def add_shape_key_scale(obj: bpy.types.Object, key_name: str, scale_xyz: tuple[float, float, float]) -> bpy.types.ShapeKey:
    if not obj.data.shape_keys:
        obj.shape_key_add(name="Basis")
    key = obj.shape_key_add(name=key_name)
    center = sum((v.co for v in obj.data.vertices), Vector()) / len(obj.data.vertices)
    for index, vertex in enumerate(obj.data.vertices):
        offset = vertex.co - center
        key.data[index].co = center + Vector((offset.x * scale_xyz[0], offset.y * scale_xyz[1], offset.z * scale_xyz[2]))
    key.value = 0
    return key


def create_armature(col: bpy.types.Collection) -> bpy.types.Object:
    bpy.ops.object.armature_add(enter_editmode=True, location=(0, 0, 0))
    armature = bpy.context.object
    armature.name = "Fuxie_V4_Armature"
    armature.data.name = "Fuxie_V4_GameReady_Skeleton"
    armature.show_in_front = True
    link_only(armature, col)
    edit_bones = armature.data.edit_bones
    edit_bones.remove(edit_bones[0])
    specs = {
        "root": ((0, 0, 0.04), (0, 0, 0.34), None),
        "hips": ((0, 0, 0.64), (0, 0, 0.96), "root"),
        "spine": ((0, 0, 0.96), (0, 0, 1.26), "hips"),
        "chest": ((0, 0, 1.26), (0, 0, 1.48), "spine"),
        "neck": ((0, 0, 1.48), (0, 0, 1.66), "chest"),
        "head": ((0, 0, 1.66), (0, 0, 2.26), "neck"),
        "ear.L": ((-0.29, -0.02, 2.10), (-0.58, -0.02, 2.64), "head"),
        "ear.R": ((0.29, -0.02, 2.10), (0.58, -0.02, 2.64), "head"),
        "upper_arm.L": ((-0.44, -0.02, 1.25), (-0.70, -0.08, 0.98), "chest"),
        "forearm.L": ((-0.70, -0.08, 0.98), (-0.86, -0.12, 0.70), "upper_arm.L"),
        "hand.L": ((-0.86, -0.12, 0.70), (-0.95, -0.14, 0.60), "forearm.L"),
        "upper_arm.R": ((0.44, -0.02, 1.25), (0.70, -0.08, 0.98), "chest"),
        "forearm.R": ((0.70, -0.08, 0.98), (0.86, -0.12, 0.70), "upper_arm.R"),
        "hand.R": ((0.86, -0.12, 0.70), (0.95, -0.14, 0.60), "forearm.R"),
        "upper_leg.L": ((-0.20, 0, 0.55), (-0.25, -0.03, 0.32), "hips"),
        "shin.L": ((-0.25, -0.03, 0.32), (-0.30, -0.06, 0.16), "upper_leg.L"),
        "foot.L": ((-0.30, -0.06, 0.16), (-0.45, -0.24, 0.10), "shin.L"),
        "upper_leg.R": ((0.20, 0, 0.55), (0.25, -0.03, 0.32), "hips"),
        "shin.R": ((0.25, -0.03, 0.32), (0.30, -0.06, 0.16), "upper_leg.R"),
        "foot.R": ((0.30, -0.06, 0.16), (0.45, -0.24, 0.10), "shin.R"),
        "tail.01": ((0.34, 0.20, 0.86), (0.58, 0.42, 1.03), "hips"),
        "tail.02": ((0.58, 0.42, 1.03), (0.78, 0.56, 1.24), "tail.01"),
        "tail.03": ((0.78, 0.56, 1.24), (0.92, 0.54, 1.45), "tail.02"),
    }
    created: dict[str, bpy.types.EditBone] = {}
    for name, (head, tail, parent) in specs.items():
        bone = edit_bones.new(name)
        bone.head = head
        bone.tail = tail
        if parent:
            bone.parent = created[parent]
            bone.use_connect = False
        created[name] = bone
    bpy.ops.object.mode_set(mode="POSE")
    for bone in armature.pose.bones:
        bone.rotation_mode = "XYZ"
    bpy.ops.object.mode_set(mode="OBJECT")
    return armature


def bind(obj: bpy.types.Object, armature: bpy.types.Object, bone_name: str) -> None:
    if obj.type != "MESH":
        return
    group = obj.vertex_groups.new(name=bone_name)
    group.add([v.index for v in obj.data.vertices], 1.0, "ADD")
    modifier = obj.modifiers.new(name="Fuxie_V4_Armature_Deform", type="ARMATURE")
    modifier.object = armature
    obj.parent = armature


def key_bone(armature: bpy.types.Object, name: str, frame: int, loc=None, rot=None, scale=None) -> None:
    bone = armature.pose.bones[name]
    if loc is not None:
        bone.location = loc
        bone.keyframe_insert("location", frame=frame)
    if rot is not None:
        bone.rotation_euler = rot
        bone.keyframe_insert("rotation_euler", frame=frame)
    if scale is not None:
        bone.scale = scale
        bone.keyframe_insert("scale", frame=frame)


def key_shape(shape: bpy.types.ShapeKey, frame: int, value: float) -> None:
    shape.value = value
    shape.keyframe_insert("value", frame=frame)


def stash_action(owner: bpy.types.ID, clip_name: str, action: bpy.types.Action, frames: int) -> None:
    action.name = clip_name
    anim = owner.animation_data_create()
    track = anim.nla_tracks.new()
    track.name = clip_name
    strip = track.strips.new(clip_name, 1, action)
    strip.frame_start = 1
    strip.frame_end = frames


def make_clip(armature: bpy.types.Object, clip_name: str, frames: int, animator, shape_keys: Iterable[bpy.types.ShapeKey]) -> None:
    if armature.animation_data:
        armature.animation_data.action = None
    action = bpy.data.actions.new(f"Fuxie_V4_{clip_name}_Armature")
    armature.animation_data_create().action = action
    key_blocks = []
    for shape in shape_keys:
        key_block = shape.id_data
        if key_block not in key_blocks:
            key_blocks.append(key_block)
            key_block.animation_data_clear()
            key_block.animation_data_create().action = bpy.data.actions.new(f"Fuxie_V4_{clip_name}_{key_block.name}")
    animator()
    stash_action(armature, clip_name, action, frames)
    armature.animation_data.action = None
    for key_block in key_blocks:
        if key_block.animation_data and key_block.animation_data.action:
            stash_action(key_block, clip_name, key_block.animation_data.action, frames)
            key_block.animation_data.action = None


def build_character(char_col: bpy.types.Collection, ref_col: bpy.types.Collection) -> tuple[bpy.types.Object, dict[str, bpy.types.ShapeKey]]:
    add_image_plane("Fuxie_V4_Reference_Front", FRONT_REFERENCE, 2.30, (-1.15, 0.72, 0.05), ref_col, hide_render=False)
    add_image_plane("Fuxie_V4_Reference_Side", SIDE_REFERENCE, 2.10, (2.95, 0.85, 0.18), ref_col, hide_render=True)
    add_image_plane("Fuxie_V4_Reference_Back", BACK_REFERENCE, 2.10, (-3.20, 0.85, 0.18), ref_col, hide_render=True)
    add_image_plane("Fuxie_V4_Reference_Faces", FACES_REFERENCE, 0.88, (0.55, 0.86, 2.78), ref_col, hide_render=True)
    add_image_plane("Fuxie_V4_Reference_Tail", TAIL_REFERENCE, 0.70, (0.55, 0.86, -0.72), ref_col, hide_render=True)

    mats = {
        "fur": material("Fuxie_V4_Blue_Fur", (0.055, 0.45, 0.82, 1)),
        "fur_dark": material("Fuxie_V4_Deep_Blue_Fur", (0.025, 0.27, 0.56, 1)),
        "cream": material("Fuxie_V4_Cream_White_Fur", (0.95, 0.94, 0.90, 1)),
        "inner": material("Fuxie_V4_Warm_Inner_Ear", (0.83, 0.60, 0.54, 1)),
        "teal": material("Fuxie_V4_Teal_Jacket", (0.08, 0.67, 0.64, 1)),
        "teal_dark": material("Fuxie_V4_Jacket_Shadow_Teal", (0.03, 0.45, 0.48, 1)),
        "navy": material("Fuxie_V4_Bandana_And_Shorts", (0.02, 0.25, 0.58, 1)),
        "shoe": material("Fuxie_V4_Sneaker_Blue", (0.02, 0.35, 0.78, 1)),
        "gold": material("Fuxie_V4_Amber_Gold_Eyes", (0.94, 0.55, 0.08, 1), 0.36),
        "black": material("Fuxie_V4_Glossy_Black", (0.008, 0.012, 0.016, 1), 0.30),
        "white": material("Fuxie_V4_Bright_White", (1, 0.99, 0.95, 1), 0.50),
        "pink": material("Fuxie_V4_Mouth_And_Blush", (0.82, 0.30, 0.24, 1), 0.66),
        "line": material("Fuxie_V4_Face_Line", (0.025, 0.06, 0.08, 1), 0.55),
        "shadow": material("Fuxie_V4_Ground_Shadow", (0.04, 0.13, 0.18, 0.36), 0.90),
    }

    armature = create_armature(char_col)
    meshes: list[tuple[bpy.types.Object, str]] = []

    # Body, jacket, shorts: compact chibi proportions measured against the front crop.
    body = add_uv("Fuxie_V4_Body_Cream_Core", (0.55, -0.02, 0.92), (0.35, 0.25, 0.43), mats["cream"], char_col, 36, 16)
    jacket_l = add_uv("Fuxie_V4_Jacket_Left_RoundedPanel", (0.40, -0.155, 0.97), (0.18, 0.10, 0.42), mats["teal"], char_col, 28, 12, rotation=(0, 0, -0.08))
    jacket_r = add_uv("Fuxie_V4_Jacket_Right_RoundedPanel", (0.70, -0.155, 0.97), (0.18, 0.10, 0.42), mats["teal"], char_col, 28, 12, rotation=(0, 0, 0.08))
    hood = add_uv("Fuxie_V4_Hood_Back_Teal", (0.55, 0.06, 1.30), (0.45, 0.22, 0.25), mats["teal_dark"], char_col, 32, 12)
    collar = add_uv("Fuxie_V4_Hood_Collar_Ring", (0.55, -0.105, 1.34), (0.40, 0.23, 0.105), mats["teal_dark"], char_col, 36, 10)
    zipper = add_box("Fuxie_V4_Jacket_Zipper", (0.55, -0.276, 0.94), (0.010, 0.014, 0.35), mats["white"], char_col, bevel=0.004)
    pocket_l = add_box("Fuxie_V4_Jacket_Pocket_L", (0.30, -0.286, 0.87), (0.060, 0.010, 0.012), mats["cream"], char_col, rotation=(0, 0, -0.55), bevel=0.006)
    pocket_r = add_box("Fuxie_V4_Jacket_Pocket_R", (0.80, -0.286, 0.87), (0.060, 0.010, 0.012), mats["cream"], char_col, rotation=(0, 0, 0.55), bevel=0.006)
    shorts = add_uv("Fuxie_V4_Shorts_Navy", (0.55, -0.005, 0.50), (0.34, 0.21, 0.16), mats["navy"], char_col, 32, 10)
    bandana = add_cone("Fuxie_V4_Bandana_Triangle_Blue", (0.55, -0.296, 1.29), 0.22, 0.025, 0.30, mats["navy"], char_col, vertices=3, rotation=(math.pi / 2, 0, math.radians(60)))
    badge = add_cylinder_between("Fuxie_V4_Bandana_Badge_Gold", (0.55, -0.318, 1.30), (0.55, -0.354, 1.30), 0.045, mats["gold"], char_col, 32)
    logo = add_cone("Fuxie_V4_Bandana_White_FoxLogo", (0.55, -0.362, 1.305), 0.030, 0.008, 0.040, mats["white"], char_col, vertices=3, rotation=(math.pi / 2, 0, math.radians(30)))

    # Head and face: large rounded fox head, white mask, amber eyes and black nose.
    head = add_uv("Fuxie_V4_Head_Blue_Rounded", (0.55, -0.02, 1.82), (0.56, 0.42, 0.46), mats["fur"], char_col, 48, 22)
    face = add_uv("Fuxie_V4_Face_White_Mask", (0.55, -0.385, 1.73), (0.39, 0.055, 0.25), mats["cream"], char_col, 36, 12)
    muzzle = add_uv("Fuxie_V4_Muzzle_White_Rounded", (0.55, -0.432, 1.61), (0.20, 0.075, 0.105), mats["cream"], char_col, 32, 12)
    cheek_l = add_uv("Fuxie_V4_Cheek_L_White_Puff", (0.25, -0.402, 1.65), (0.15, 0.05, 0.090), mats["cream"], char_col, 24, 10, rotation=(0, 0, -0.20))
    cheek_r = add_uv("Fuxie_V4_Cheek_R_White_Puff", (0.85, -0.402, 1.65), (0.15, 0.05, 0.090), mats["cream"], char_col, 24, 10, rotation=(0, 0, 0.20))
    side_l = add_cone("Fuxie_V4_SideFur_L_Blue", (0.07, -0.045, 1.66), 0.10, 0.014, 0.26, mats["fur_dark"], char_col, vertices=3, rotation=(0.07, 0.10, -1.50))
    side_r = add_cone("Fuxie_V4_SideFur_R_Blue", (1.03, -0.045, 1.66), 0.10, 0.014, 0.26, mats["fur_dark"], char_col, vertices=3, rotation=(0.07, -0.10, 1.50))
    nose = add_uv("Fuxie_V4_Nose_Black", (0.55, -0.490, 1.70), (0.065, 0.035, 0.043), mats["black"], char_col, 24, 10)
    mouth = add_uv("Fuxie_V4_Mouth_Open_Dark", (0.55, -0.485, 1.52), (0.090, 0.015, 0.050), mats["line"], char_col, 24, 8)
    tongue = add_uv("Fuxie_V4_Tongue_Pink", (0.55, -0.500, 1.500), (0.052, 0.008, 0.023), mats["pink"], char_col, 16, 6)
    smile = add_curve("Fuxie_V4_Smile_Line", [(0.42, -0.505, 1.60), (0.49, -0.515, 1.55), (0.55, -0.518, 1.54), (0.61, -0.515, 1.55), (0.68, -0.505, 1.60)], mats["line"], char_col, 0.007)
    brow_l = add_curve("Fuxie_V4_Brow_L", [(0.35, -0.450, 1.99), (0.42, -0.470, 2.02), (0.49, -0.462, 2.00)], mats["line"], char_col, 0.008)
    brow_r = add_curve("Fuxie_V4_Brow_R", [(0.61, -0.462, 2.00), (0.68, -0.470, 2.02), (0.75, -0.450, 1.99)], mats["line"], char_col, 0.008)

    for side, x in [("L", 0.39), ("R", 0.71)]:
        eye_white = add_uv(f"Fuxie_V4_EyeWhite_{side}", (x, -0.420, 1.82), (0.105, 0.020, 0.130), mats["white"], char_col, 32, 10)
        iris = add_uv(f"Fuxie_V4_EyeAmber_{side}", (x, -0.443, 1.81), (0.065, 0.012, 0.092), mats["gold"], char_col, 32, 10)
        pupil = add_uv(f"Fuxie_V4_Pupil_{side}", (x + (0.010 if side == "R" else -0.010), -0.455, 1.81), (0.038, 0.007, 0.060), mats["black"], char_col, 24, 8)
        highlight = add_uv(f"Fuxie_V4_EyeHighlight_{side}", (x + 0.025, -0.462, 1.87), (0.018, 0.004, 0.024), mats["white"], char_col, 16, 6)
        meshes.extend([(eye_white, "head"), (iris, "head"), (pupil, "head"), (highlight, "head")])
        if side == "L":
            blink_l = add_shape_key_scale(iris, "blink", (1, 1, 0.08))
        else:
            blink_r = add_shape_key_scale(iris, "blink", (1, 1, 0.08))

    blush_l = add_uv("Fuxie_V4_Blush_L", (0.22, -0.435, 1.61), (0.050, 0.010, 0.026), mats["pink"], char_col, 16, 6)
    blush_r = add_uv("Fuxie_V4_Blush_R", (0.88, -0.435, 1.61), (0.050, 0.010, 0.026), mats["pink"], char_col, 16, 6)

    # Ears and fur tuft. Ears are intentionally taller and wider to match the approved crop.
    ear_l = add_cone("Fuxie_V4_Ear_L_Blue", (0.23, -0.02, 2.25), 0.18, 0.035, 0.68, mats["fur"], char_col, vertices=44, rotation=(0.08, 0.40, -0.28), scale_after=(0.72, 1.0, 1.0))
    ear_r = add_cone("Fuxie_V4_Ear_R_Blue", (0.87, -0.02, 2.25), 0.18, 0.035, 0.68, mats["fur"], char_col, vertices=44, rotation=(0.08, -0.40, 0.28), scale_after=(0.72, 1.0, 1.0))
    inner_l = add_uv("Fuxie_V4_InnerEar_L_Warm", (0.21, -0.230, 2.24), (0.090, 0.016, 0.225), mats["inner"], char_col, 24, 8, rotation=(0.05, 0.06, -0.20))
    inner_r = add_uv("Fuxie_V4_InnerEar_R_Warm", (0.89, -0.230, 2.24), (0.090, 0.016, 0.225), mats["inner"], char_col, 24, 8, rotation=(0.05, -0.06, 0.20))
    ear_fluff_l = add_uv("Fuxie_V4_EarFluff_L_White", (0.30, -0.244, 2.11), (0.055, 0.014, 0.070), mats["cream"], char_col, 16, 6)
    ear_fluff_r = add_uv("Fuxie_V4_EarFluff_R_White", (0.80, -0.244, 2.11), (0.055, 0.014, 0.070), mats["cream"], char_col, 16, 6)
    tuft_c = add_cone("Fuxie_V4_Forelock_Center", (0.55, -0.22, 2.28), 0.070, 0.018, 0.22, mats["fur_dark"], char_col, vertices=24, rotation=(0.40, 0, 0))
    tuft_l = add_cone("Fuxie_V4_Forelock_L", (0.48, -0.205, 2.24), 0.052, 0.014, 0.17, mats["fur"], char_col, vertices=24, rotation=(0.35, 0.22, -0.22))
    tuft_r = add_cone("Fuxie_V4_Forelock_R", (0.62, -0.205, 2.24), 0.052, 0.014, 0.17, mats["fur"], char_col, vertices=24, rotation=(0.35, -0.22, 0.22))

    # Limbs, hands, shoes and tail.
    draw_l = add_curve("Fuxie_V4_Drawstring_L", [(0.44, -0.318, 1.22), (0.40, -0.340, 1.08), (0.42, -0.335, 0.98)], mats["white"], char_col, 0.010)
    draw_r = add_curve("Fuxie_V4_Drawstring_R", [(0.66, -0.318, 1.22), (0.70, -0.340, 1.08), (0.68, -0.335, 0.98)], mats["white"], char_col, 0.010)
    draw_end_l = add_uv("Fuxie_V4_Drawstring_End_L", (0.42, -0.350, 0.96), (0.022, 0.010, 0.030), mats["white"], char_col, 12, 6)
    draw_end_r = add_uv("Fuxie_V4_Drawstring_End_R", (0.68, -0.350, 0.96), (0.022, 0.010, 0.030), mats["white"], char_col, 12, 6)

    arm_ul = add_cylinder_between("Fuxie_V4_UpperArm_L_Teal", (0.17, -0.03, 1.20), (-0.03, -0.10, 0.93), 0.085, mats["teal"], char_col)
    arm_fl = add_cylinder_between("Fuxie_V4_Forearm_L_Blue", (-0.03, -0.10, 0.93), (-0.11, -0.14, 0.67), 0.078, mats["fur"], char_col)
    hand_l = add_uv("Fuxie_V4_Hand_L_Blue", (-0.14, -0.165, 0.58), (0.095, 0.070, 0.080), mats["fur"], char_col, 20, 8)
    arm_ur = add_cylinder_between("Fuxie_V4_UpperArm_R_Teal", (0.93, -0.03, 1.20), (1.15, -0.08, 0.98), 0.085, mats["teal"], char_col)
    arm_fr = add_cylinder_between("Fuxie_V4_Forearm_R_Blue", (1.15, -0.08, 0.98), (1.07, -0.14, 0.74), 0.078, mats["fur"], char_col)
    hand_r = add_uv("Fuxie_V4_Hand_R_Blue", (1.03, -0.165, 0.66), (0.095, 0.070, 0.080), mats["fur"], char_col, 20, 8)

    leg_ul = add_cylinder_between("Fuxie_V4_UpperLeg_L_Navy", (0.37, -0.005, 0.45), (0.34, -0.035, 0.28), 0.090, mats["navy"], char_col)
    shin_l = add_cylinder_between("Fuxie_V4_Shin_L_Cream", (0.34, -0.035, 0.28), (0.32, -0.080, 0.15), 0.070, mats["cream"], char_col)
    shoe_l = add_uv("Fuxie_V4_Shoe_L_Blue", (0.25, -0.215, 0.09), (0.175, 0.110, 0.065), mats["shoe"], char_col, 28, 8)
    sole_l = add_box("Fuxie_V4_ShoeSole_L_White", (0.25, -0.270, 0.045), (0.180, 0.045, 0.022), mats["white"], char_col, bevel=0.022)
    lace_l = add_box("Fuxie_V4_ShoeLace_L", (0.25, -0.318, 0.125), (0.066, 0.007, 0.008), mats["white"], char_col, bevel=0.003)
    leg_ur = add_cylinder_between("Fuxie_V4_UpperLeg_R_Navy", (0.73, -0.005, 0.45), (0.76, -0.035, 0.28), 0.090, mats["navy"], char_col)
    shin_r = add_cylinder_between("Fuxie_V4_Shin_R_Cream", (0.76, -0.035, 0.28), (0.78, -0.080, 0.15), 0.070, mats["cream"], char_col)
    shoe_r = add_uv("Fuxie_V4_Shoe_R_Blue", (0.85, -0.215, 0.09), (0.175, 0.110, 0.065), mats["shoe"], char_col, 28, 8)
    sole_r = add_box("Fuxie_V4_ShoeSole_R_White", (0.85, -0.270, 0.045), (0.180, 0.045, 0.022), mats["white"], char_col, bevel=0.022)
    lace_r = add_box("Fuxie_V4_ShoeLace_R", (0.85, -0.318, 0.125), (0.066, 0.007, 0.008), mats["white"], char_col, bevel=0.003)

    tail1 = add_uv("Fuxie_V4_Tail_01_BlueRoot", (1.02, 0.30, 0.88), (0.16, 0.24, 0.18), mats["fur_dark"], char_col, 28, 10, rotation=(0.28, 0.65, -0.18))
    tail2 = add_uv("Fuxie_V4_Tail_02_FluffyBlue", (1.18, 0.46, 1.08), (0.22, 0.31, 0.26), mats["fur"], char_col, 32, 12, rotation=(0.36, 0.42, -0.25))
    tail3 = add_uv("Fuxie_V4_TailTip_White", (1.28, 0.44, 1.30), (0.18, 0.22, 0.22), mats["cream"], char_col, 32, 12, rotation=(0.32, 0.25, -0.16))

    shadow = add_uv("Fuxie_V4_SoftShadow", (0.55, -0.03, 0.015), (0.72, 0.10, 0.025), mats["shadow"], char_col, 32, 6)

    meshes.extend([
        (body, "hips"), (jacket_l, "hips"), (jacket_r, "hips"), (hood, "chest"), (collar, "chest"), (zipper, "hips"),
        (pocket_l, "hips"), (pocket_r, "hips"), (shorts, "hips"), (bandana, "chest"), (badge, "chest"), (logo, "chest"),
        (head, "head"), (face, "head"), (muzzle, "head"), (cheek_l, "head"), (cheek_r, "head"), (side_l, "head"), (side_r, "head"),
        (nose, "head"), (mouth, "head"), (tongue, "head"), (smile, "head"), (brow_l, "head"), (brow_r, "head"),
        (blush_l, "head"), (blush_r, "head"), (ear_l, "ear.L"), (ear_r, "ear.R"), (inner_l, "ear.L"), (inner_r, "ear.R"),
        (ear_fluff_l, "ear.L"), (ear_fluff_r, "ear.R"), (tuft_c, "head"), (tuft_l, "head"), (tuft_r, "head"),
        (draw_l, "chest"), (draw_r, "chest"), (draw_end_l, "chest"), (draw_end_r, "chest"),
        (arm_ul, "upper_arm.L"), (arm_fl, "forearm.L"), (hand_l, "hand.L"),
        (arm_ur, "upper_arm.R"), (arm_fr, "forearm.R"), (hand_r, "hand.R"),
        (leg_ul, "upper_leg.L"), (shin_l, "shin.L"), (shoe_l, "foot.L"), (sole_l, "foot.L"), (lace_l, "foot.L"),
        (leg_ur, "upper_leg.R"), (shin_r, "shin.R"), (shoe_r, "foot.R"), (sole_r, "foot.R"), (lace_r, "foot.R"),
        (tail1, "tail.01"), (tail2, "tail.02"), (tail3, "tail.03"), (shadow, "root"),
    ])

    for obj, bone_name in meshes:
        bind(obj, armature, bone_name)

    mouth_open = add_shape_key_scale(mouth, "talkOpen", (1.05, 1.0, 2.0))
    return armature, {"blink_l": blink_l, "blink_r": blink_r, "mouth": mouth_open}


def animate(armature: bpy.types.Object, shapes: dict[str, bpy.types.ShapeKey]) -> None:
    def blink(frames):
        for frame, value in frames:
            key_shape(shapes["blink_l"], frame, value)
            key_shape(shapes["blink_r"], frame, value)

    def idle() -> None:
        for frame, z, sway in [(1, 0.00, 0.00), (30, 0.030, -0.018), (60, 0.00, 0.00), (90, 0.030, 0.018), (120, 0.00, 0.00)]:
            key_bone(armature, "root", frame, loc=(0, 0, z))
            key_bone(armature, "head", frame, rot=(0.018 * math.sin(frame * 0.12), 0, -sway))
            key_bone(armature, "ear.L", frame, rot=(0.02, 0.03 * math.sin(frame * 0.08), -0.02))
            key_bone(armature, "ear.R", frame, rot=(0.02, -0.03 * math.sin(frame * 0.08), 0.02))
            key_bone(armature, "tail.01", frame, rot=(0.04, 0.08, 0.11 * math.sin(frame * 0.10)))
            key_bone(armature, "tail.02", frame, rot=(0.03, 0.05, -0.12 * math.sin(frame * 0.10)))
            key_bone(armature, "tail.03", frame, rot=(0.02, 0.03, 0.08 * math.sin(frame * 0.10)))
        blink([(1, 0), (46, 0), (49, 1), (52, 0), (120, 0)])
        key_shape(shapes["mouth"], 1, 0.0)
        key_shape(shapes["mouth"], 120, 0.0)

    def wave() -> None:
        for frame, z in [(1, 0), (24, 0.030), (48, 0), (72, 0.030), (96, 0)]:
            key_bone(armature, "root", frame, loc=(0, 0, z))
            key_bone(armature, "head", frame, rot=(0.03, 0, 0.03 * math.sin(frame * 0.12)))
        for frame, upper, fore, hand in [
            (1, (0, 0, 0), (0, 0, 0), (0, 0, 0)),
            (18, (-0.48, -0.10, -1.00), (-0.25, -0.05, -0.55), (0.00, 0.15, -0.25)),
            (36, (-0.56, -0.12, -1.22), (-0.20, -0.20, -0.38), (0.06, 0.20, 0.20)),
            (54, (-0.46, -0.10, -1.02), (-0.25, -0.05, -0.55), (0.00, 0.15, -0.25)),
            (72, (-0.56, -0.12, -1.22), (-0.20, -0.20, -0.38), (0.06, 0.20, 0.20)),
            (96, (0, 0, 0), (0, 0, 0), (0, 0, 0)),
        ]:
            key_bone(armature, "upper_arm.R", frame, rot=upper)
            key_bone(armature, "forearm.R", frame, rot=fore)
            key_bone(armature, "hand.R", frame, rot=hand)
        blink([(1, 0), (60, 0), (63, 1), (66, 0), (96, 0)])
        key_shape(shapes["mouth"], 1, 0.15)
        key_shape(shapes["mouth"], 96, 0.15)

    def talk() -> None:
        for frame in range(1, 121, 12):
            key_bone(armature, "head", frame, rot=(0.035 * math.sin(frame * 0.20), 0, 0.028 * math.sin(frame * 0.13)))
            key_shape(shapes["mouth"], frame, 0.85 if (frame // 12) % 2 else 0.12)
        blink([(1, 0), (82, 0), (85, 1), (88, 0), (120, 0)])

    shape_keys = [shapes["blink_l"], shapes["blink_r"], shapes["mouth"]]
    make_clip(armature, "idle", 120, idle, shape_keys)
    make_clip(armature, "wave", 96, wave, shape_keys)
    make_clip(armature, "talk", 120, talk, shape_keys)


def setup_scene() -> None:
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.render.fps = 60
    scene.frame_start = 1
    scene.frame_end = 120
    scene.render.resolution_x = 1400
    scene.render.resolution_y = 1100
    scene.render.film_transparent = False
    try:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    except TypeError:
        scene.render.engine = "BLENDER_EEVEE"
    scene.world = scene.world or bpy.data.worlds.new("Fuxie_V4_World")
    scene.world.color = (0.94, 0.98, 1.0)
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "Medium High Contrast"
    bpy.ops.object.light_add(type="AREA", location=(0.4, -4.0, 4.0))
    light = bpy.context.object
    light.name = "Fuxie_V4_KeyLight"
    light.data.energy = 520
    light.data.size = 4.6
    bpy.ops.object.light_add(type="POINT", location=(1.8, -2.2, 2.2))
    fill = bpy.context.object
    fill.name = "Fuxie_V4_Eye_Fill"
    fill.data.energy = 80
    bpy.ops.object.camera_add(location=(0.28, -6.2, 1.36))
    camera = bpy.context.object
    camera.name = "Fuxie_V4_Comparison_Camera"
    camera.rotation_euler = (Vector((0.25, 0, 1.32)) - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = 3.35
    scene.camera = camera


def select_export(col: bpy.types.Collection) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    for obj in col.objects:
        obj.select_set(True)
    armature = next((obj for obj in col.objects if obj.type == "ARMATURE"), None)
    if armature:
        bpy.context.view_layer.objects.active = armature


def export_assets(char_col: bpy.types.Collection) -> None:
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
    select_export(char_col)
    props = bpy.ops.export_scene.gltf.get_rna_type().properties.keys()
    kwargs = {"filepath": str(GLB_PATH), "export_format": "GLB", "use_selection": True, "export_yup": True, "export_animations": True}
    if "export_animation_mode" in props:
        kwargs["export_animation_mode"] = "NLA_TRACKS"
    if "export_nla_strips" in props:
        kwargs["export_nla_strips"] = True
    if "export_force_sampling" in props:
        kwargs["export_force_sampling"] = True
    bpy.ops.export_scene.gltf(**kwargs)
    select_export(char_col)
    bpy.ops.export_scene.fbx(filepath=str(FBX_PATH), use_selection=True, object_types={"ARMATURE", "MESH"}, add_leaf_bones=False, bake_anim=True, bake_anim_use_nla_strips=True, bake_anim_use_all_actions=False, apply_unit_scale=True)
    for obj in char_col.objects:
        if obj.type == "ARMATURE":
            if obj.animation_data:
                for track in obj.animation_data.nla_tracks:
                    track.mute = True
            for pose_bone in obj.pose.bones:
                pose_bone.location = (0, 0, 0)
                pose_bone.rotation_euler = (0, 0, 0)
                pose_bone.scale = (1, 1, 1)
        if obj.type == "MESH" and obj.data.shape_keys:
            for key in obj.data.shape_keys.key_blocks:
                key.value = 0
    bpy.context.scene.frame_set(1)
    bpy.context.scene.render.image_settings.file_format = "PNG"
    bpy.context.scene.render.filepath = str(PREVIEW_PATH)
    bpy.ops.render.render(write_still=True)


def write_manifest(char_col: bpy.types.Collection, ref_col: bpy.types.Collection) -> None:
    meshes = [obj for obj in char_col.objects if obj.type == "MESH"]
    armature = next((obj for obj in char_col.objects if obj.type == "ARMATURE"), None)
    manifest = {
        "name": "Fuxie_Character_v4_true3d",
        "source_note": "True 3D stylized approximation matched against cropped approved Fuxie 3D render references. It is not an exact reconstruction.",
        "references": [str(p.relative_to(ROOT)).replace("\\", "/") for p in [FRONT_REFERENCE, SIDE_REFERENCE, BACK_REFERENCE, FACES_REFERENCE, TAIL_REFERENCE] if p.exists()],
        "outputs": {
            "blend": str(BLEND_PATH.relative_to(ROOT)).replace("\\", "/"),
            "glb": str(GLB_PATH.relative_to(ROOT)).replace("\\", "/"),
            "fbx": str(FBX_PATH.relative_to(ROOT)).replace("\\", "/"),
            "preview": str(PREVIEW_PATH.relative_to(ROOT)).replace("\\", "/"),
        },
        "stats": {
            "mesh_objects": len(meshes),
            "vertices_before_export_modifiers": sum(len(obj.data.vertices) for obj in meshes),
            "faces_before_export_modifiers": sum(len(obj.data.polygons) for obj in meshes),
            "bones": [bone.name for bone in armature.data.bones] if armature else [],
            "reference_planes": [obj.name for obj in ref_col.objects],
            "fps": bpy.context.scene.render.fps,
            "clips": CLIPS,
        },
        "next_step": "Review the comparison preview against V3/reference, then either polish mesh silhouette or wire this V4 GLB into a dev-only runtime QA path.",
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")


def main() -> None:
    ensure_dirs()
    clear_scene()
    setup_scene()
    char_col = collection("Fuxie_V4_True3D_GameExport")
    ref_col = collection("Fuxie_V4_Cropped_References")
    armature, shapes = build_character(char_col, ref_col)
    animate(armature, shapes)
    export_assets(char_col)
    write_manifest(char_col, ref_col)
    print(f"Saved V4 Blender file: {BLEND_PATH}")
    print(f"Exported V4 GLB: {GLB_PATH}")
    print(f"Exported V4 FBX: {FBX_PATH}")
    print(f"Rendered V4 preview: {PREVIEW_PATH}")


if __name__ == "__main__":
    main()
