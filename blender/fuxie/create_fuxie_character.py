from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Iterable

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
BLENDER_DIR = ROOT / "blender" / "fuxie"
MODEL_DIR = ROOT / "assets" / "models"
PUBLIC_MASCOT_DIR = ROOT / "apps" / "web" / "public" / "mascot-3d"

BLEND_PATH = BLENDER_DIR / "Fuxie_Character.blend"
GLB_PATH = MODEL_DIR / "Fuxie_Character.glb"
FBX_PATH = MODEL_DIR / "Fuxie_Character.fbx"
PREVIEW_PATH = BLENDER_DIR / "Fuxie_preview.png"
REPORT_PATH = BLENDER_DIR / "Fuxie_Character_manifest.json"

REFERENCE_IMAGES = [
    PUBLIC_MASCOT_DIR / "concept" / "fuxie-3d-master-style-sheet.png",
    PUBLIC_MASCOT_DIR / "concept" / "fuxie-3d-coach-pose-pack.png",
    PUBLIC_MASCOT_DIR / "core" / "fuxie-3d-core-happy-wave.png",
    PUBLIC_MASCOT_DIR / "core" / "fuxie-3d-game-fucoin-reward.png",
]

CLIPS = {
    "idle": {"frames": 96, "description": "60fps-friendly breathing loop with ears, tail and blink."},
    "wave": {"frames": 80, "description": "Simple friendly wave for runtime testing."},
    "talk": {"frames": 96, "description": "Mouth open/close with gentle head motion."},
}


def ensure_dirs() -> None:
    BLENDER_DIR.mkdir(parents=True, exist_ok=True)
    MODEL_DIR.mkdir(parents=True, exist_ok=True)


def clear_scene() -> None:
    bpy.ops.object.mode_set(mode="OBJECT") if bpy.ops.object.mode_set.poll() else None
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for block in (
        bpy.data.meshes,
        bpy.data.materials,
        bpy.data.armatures,
        bpy.data.actions,
        bpy.data.collections,
        bpy.data.curves,
    ):
        for item in list(block):
            if item.users == 0:
                block.remove(item)


def make_collection(name: str) -> bpy.types.Collection:
    collection = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(collection)
    return collection


def link_to_collection(obj: bpy.types.Object, collection: bpy.types.Collection) -> bpy.types.Object:
    if obj.name not in collection.objects:
        collection.objects.link(obj)
    for existing in list(obj.users_collection):
        if existing != collection:
            existing.objects.unlink(obj)
    return obj


def material(
    name: str,
    color: tuple[float, float, float, float],
    roughness: float = 0.72,
    metallic: float = 0.0,
) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        if "Base Color" in bsdf.inputs:
            bsdf.inputs["Base Color"].default_value = color
        if "Roughness" in bsdf.inputs:
            bsdf.inputs["Roughness"].default_value = roughness
        if "Metallic" in bsdf.inputs:
            bsdf.inputs["Metallic"].default_value = metallic
    return mat


def image_material(name: str, image_path: Path) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.blend_method = "BLEND"
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    image_node = nodes.new("ShaderNodeTexImage")
    image_node.image = bpy.data.images.load(str(image_path), check_existing=True)
    if bsdf:
        mat.node_tree.links.new(image_node.outputs["Color"], bsdf.inputs["Base Color"])
        if "Alpha" in image_node.outputs and "Alpha" in bsdf.inputs:
            mat.node_tree.links.new(image_node.outputs["Alpha"], bsdf.inputs["Alpha"])
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


def add_subdivision(obj: bpy.types.Object, levels: int = 1) -> None:
    modifier = obj.modifiers.new(name="Fuxie low subdivision preview", type="SUBSURF")
    modifier.levels = levels
    modifier.render_levels = levels


def add_uv(
    name: str,
    loc: tuple[float, float, float],
    scale: tuple[float, float, float],
    mat: bpy.types.Material,
    collection: bpy.types.Collection,
    segments: int = 32,
    rings: int = 16,
    rotation: tuple[float, float, float] = (0, 0, 0),
    subdivision: bool = False,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=segments,
        ring_count=rings,
        radius=1,
        location=loc,
        rotation=rotation,
        scale=scale,
    )
    obj = bpy.context.object
    obj.name = name
    obj.data.name = f"{name}_Mesh"
    obj.data.materials.append(mat)
    link_to_collection(obj, collection)
    shade_smooth(obj)
    apply_transform(obj)
    if subdivision:
        add_subdivision(obj, 1)
    return obj


def add_cone(
    name: str,
    loc: tuple[float, float, float],
    radius1: float,
    radius2: float,
    depth: float,
    mat: bpy.types.Material,
    collection: bpy.types.Collection,
    vertices: int = 32,
    rotation: tuple[float, float, float] = (0, 0, 0),
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cone_add(
        vertices=vertices,
        radius1=radius1,
        radius2=radius2,
        depth=depth,
        location=loc,
        rotation=rotation,
    )
    obj = bpy.context.object
    obj.name = name
    obj.data.name = f"{name}_Mesh"
    obj.data.materials.append(mat)
    link_to_collection(obj, collection)
    shade_smooth(obj)
    return apply_transform(obj)


def add_cylinder_between(
    name: str,
    start: tuple[float, float, float],
    end: tuple[float, float, float],
    radius: float,
    mat: bpy.types.Material,
    collection: bpy.types.Collection,
    vertices: int = 24,
) -> bpy.types.Object:
    start_v = Vector(start)
    end_v = Vector(end)
    direction = end_v - start_v
    length = direction.length
    midpoint = start_v + direction * 0.5
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices,
        radius=radius,
        depth=length,
        location=midpoint,
    )
    obj = bpy.context.object
    obj.name = name
    obj.data.name = f"{name}_Mesh"
    obj.rotation_euler = direction.to_track_quat("Z", "Y").to_euler()
    obj.data.materials.append(mat)
    link_to_collection(obj, collection)
    shade_smooth(obj)
    return apply_transform(obj)


def add_disc(
    name: str,
    loc: tuple[float, float, float],
    scale: tuple[float, float, float],
    mat: bpy.types.Material,
    collection: bpy.types.Collection,
) -> bpy.types.Object:
    return add_uv(
        name,
        loc,
        scale,
        mat,
        collection,
        segments=32,
        rings=12,
        subdivision=False,
    )


def add_curve_smile(
    name: str,
    points: list[tuple[float, float, float]],
    mat: bpy.types.Material,
    collection: bpy.types.Collection,
    bevel_depth: float = 0.012,
) -> bpy.types.Object:
    curve = bpy.data.curves.new(name=f"{name}_Curve", type="CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 16
    curve.bevel_depth = bevel_depth
    curve.bevel_resolution = 3
    spline = curve.splines.new("POLY")
    spline.points.add(len(points) - 1)
    for point, coord in zip(spline.points, points):
        point.co = (coord[0], coord[1], coord[2], 1.0)
    obj = bpy.data.objects.new(name, curve)
    collection.objects.link(obj)
    obj.data.materials.append(mat)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target="MESH")
    obj = bpy.context.object
    obj.name = name
    obj.data.name = f"{name}_Mesh"
    shade_smooth(obj)
    return obj


def add_reference_plane(
    image_path: Path,
    name: str,
    loc: tuple[float, float, float],
    height: float,
    collection: bpy.types.Collection,
) -> bpy.types.Object | None:
    if not image_path.exists():
        return None

    image = bpy.data.images.load(str(image_path), check_existing=True)
    width_px, height_px = image.size[0], image.size[1]
    aspect = width_px / height_px if height_px else 1.0
    width = height * aspect
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    verts = [
        (-width / 2, 0, -height / 2),
        (width / 2, 0, -height / 2),
        (width / 2, 0, height / 2),
        (-width / 2, 0, height / 2),
    ]
    mesh.from_pydata(verts, [], [(0, 1, 2, 3)])
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    obj.location = loc
    obj.data.materials.append(image_material(f"{name}_Material", image_path))
    collection.objects.link(obj)
    obj.hide_render = True
    return obj


def add_shape_key_scale(
    obj: bpy.types.Object,
    key_name: str,
    scale_xyz: tuple[float, float, float],
) -> bpy.types.ShapeKey:
    if not obj.data.shape_keys:
        obj.shape_key_add(name="Basis")
    key = obj.shape_key_add(name=key_name)
    center = sum((v.co for v in obj.data.vertices), Vector()) / len(obj.data.vertices)
    for index, vertex in enumerate(obj.data.vertices):
        offset = vertex.co - center
        key.data[index].co = center + Vector(
            (
                offset.x * scale_xyz[0],
                offset.y * scale_xyz[1],
                offset.z * scale_xyz[2],
            )
        )
    key.value = 0
    return key


def create_armature(collection: bpy.types.Collection) -> bpy.types.Object:
    bpy.ops.object.armature_add(enter_editmode=True, location=(0, 0, 0))
    armature = bpy.context.object
    armature.name = "Fuxie_Armature"
    armature.data.name = "Fuxie_GameReady_Skeleton"
    armature.show_in_front = True
    link_to_collection(armature, collection)

    edit_bones = armature.data.edit_bones
    edit_bones.remove(edit_bones[0])

    specs: dict[str, tuple[tuple[float, float, float], tuple[float, float, float], str | None]] = {
        "root": ((0, 0, 0.05), (0, 0, 0.35), None),
        "hips": ((0, 0, 0.65), (0, 0, 1.03), "root"),
        "spine": ((0, 0, 1.03), (0, 0, 1.35), "hips"),
        "chest": ((0, 0, 1.35), (0, 0, 1.55), "spine"),
        "neck": ((0, 0, 1.55), (0, 0, 1.72), "chest"),
        "head": ((0, 0, 1.72), (0, 0, 2.23), "neck"),
        "ear.L": ((-0.25, -0.03, 2.14), (-0.52, -0.02, 2.62), "head"),
        "ear.R": ((0.25, -0.03, 2.14), (0.52, -0.02, 2.62), "head"),
        "upper_arm.L": ((-0.43, -0.02, 1.43), (-0.72, -0.10, 1.25), "chest"),
        "forearm.L": ((-0.72, -0.10, 1.25), (-0.90, -0.16, 1.03), "upper_arm.L"),
        "hand.L": ((-0.90, -0.16, 1.03), (-1.02, -0.18, 0.94), "forearm.L"),
        "upper_arm.R": ((0.43, -0.02, 1.43), (0.72, -0.10, 1.25), "chest"),
        "forearm.R": ((0.72, -0.10, 1.25), (0.90, -0.16, 1.03), "upper_arm.R"),
        "hand.R": ((0.90, -0.16, 1.03), (1.02, -0.18, 0.94), "forearm.R"),
        "upper_leg.L": ((-0.22, 0, 0.74), (-0.28, -0.03, 0.43), "hips"),
        "shin.L": ((-0.28, -0.03, 0.43), (-0.30, -0.07, 0.22), "upper_leg.L"),
        "foot.L": ((-0.30, -0.07, 0.22), (-0.42, -0.26, 0.18), "shin.L"),
        "upper_leg.R": ((0.22, 0, 0.74), (0.28, -0.03, 0.43), "hips"),
        "shin.R": ((0.28, -0.03, 0.43), (0.30, -0.07, 0.22), "upper_leg.R"),
        "foot.R": ((0.30, -0.07, 0.22), (0.42, -0.26, 0.18), "shin.R"),
        "tail.01": ((0.24, 0.27, 0.96), (0.52, 0.50, 1.12), "hips"),
        "tail.02": ((0.52, 0.50, 1.12), (0.80, 0.65, 1.38), "tail.01"),
        "tail.03": ((0.80, 0.65, 1.38), (0.92, 0.58, 1.68), "tail.02"),
    }

    created: dict[str, bpy.types.EditBone] = {}
    for bone_name, (head, tail, parent) in specs.items():
        bone = edit_bones.new(bone_name)
        bone.head = head
        bone.tail = tail
        bone.roll = 0
        if parent:
            bone.parent = created[parent]
            bone.use_connect = False
        created[bone_name] = bone

    bpy.ops.object.mode_set(mode="POSE")
    for bone in armature.pose.bones:
        bone.rotation_mode = "XYZ"
    bpy.ops.object.mode_set(mode="OBJECT")
    return armature


def bind_object_to_bone(obj: bpy.types.Object, armature: bpy.types.Object, bone_name: str) -> None:
    if obj.type != "MESH":
        return
    group = obj.vertex_groups.new(name=bone_name)
    group.add([v.index for v in obj.data.vertices], 1.0, "ADD")
    modifier = obj.modifiers.new(name="Fuxie_Armature_Deform", type="ARMATURE")
    modifier.object = armature
    obj.parent = armature


def key_bone(
    armature: bpy.types.Object,
    bone_name: str,
    frame: int,
    loc: tuple[float, float, float] | None = None,
    rot: tuple[float, float, float] | None = None,
    scale: tuple[float, float, float] | None = None,
) -> None:
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


def key_shape(shape_key: bpy.types.ShapeKey, frame: int, value: float) -> None:
    shape_key.value = value
    shape_key.keyframe_insert("value", frame=frame)


def stash_action(owner: bpy.types.ID, clip_name: str, action: bpy.types.Action, frames: int) -> None:
    action.name = f"Fuxie_{clip_name}"
    if hasattr(owner, "animation_data_create"):
        anim_data = owner.animation_data_create()
        track = anim_data.nla_tracks.new()
        track.name = clip_name
        strip = track.strips.new(clip_name, 1, action)
        strip.frame_start = 1
        strip.frame_end = frames
        track.mute = False


def make_clip(
    armature: bpy.types.Object,
    clip_name: str,
    frames: int,
    animator,
    shape_owners: Iterable[bpy.types.ShapeKey] = (),
) -> None:
    bpy.context.scene.frame_start = 1
    bpy.context.scene.frame_end = frames

    if armature.animation_data:
        armature.animation_data.action = None
    action = bpy.data.actions.new(name=f"Fuxie_{clip_name}_Armature")
    armature.animation_data_create().action = action

    key_blocks = [shape.id_data for shape in shape_owners]
    unique_key_blocks = []
    for key_block in key_blocks:
        if key_block not in unique_key_blocks:
            unique_key_blocks.append(key_block)
        key_block.animation_data_clear()
        key_block.animation_data_create().action = bpy.data.actions.new(name=f"Fuxie_{clip_name}_{key_block.name}")

    animator()

    stash_action(armature, clip_name, action, frames)
    armature.animation_data.action = None
    for key_block in unique_key_blocks:
        if key_block.animation_data and key_block.animation_data.action:
            stash_action(key_block, clip_name, key_block.animation_data.action, frames)
            key_block.animation_data.action = None


def build_character(
    character_collection: bpy.types.Collection,
    reference_collection: bpy.types.Collection,
) -> tuple[bpy.types.Object, dict[str, bpy.types.Object | bpy.types.ShapeKey]]:
    for index, image_path in enumerate(REFERENCE_IMAGES):
        add_reference_plane(
            image_path,
            f"Fuxie_Reference_{index + 1}_{image_path.stem}",
            loc=(-3.6 + index * 2.4, 1.85, 1.35),
            height=1.9,
            collection=reference_collection,
        )

    mats = {
        "sky": material("Fuxie_SkyBlue_Fur", (0.18, 0.63, 0.88, 1.0), 0.78),
        "teal": material("Fuxie_Teal_Hoodie", (0.04, 0.70, 0.66, 1.0), 0.74),
        "cream": material("Fuxie_Cream_Face_Belly", (0.94, 0.97, 0.95, 1.0), 0.82),
        "deep": material("Fuxie_DeepBlue_Details", (0.03, 0.13, 0.22, 1.0), 0.68),
        "black": material("Fuxie_Glossy_Black_Eyes", (0.01, 0.025, 0.035, 1.0), 0.35),
        "white": material("Fuxie_Eye_Highlight", (1.0, 1.0, 0.96, 1.0), 0.4),
        "blush": material("Fuxie_Coral_Blush", (1.0, 0.38, 0.34, 1.0), 0.70),
        "gold": material("Fuxie_Fucoin_Gold", (1.0, 0.68, 0.08, 1.0), 0.46, 0.05),
        "line": material("Fuxie_Face_Line", (0.03, 0.12, 0.18, 1.0), 0.52),
    }

    armature = create_armature(character_collection)

    parts: dict[str, bpy.types.Object | bpy.types.ShapeKey] = {}

    mesh_specs: list[tuple[bpy.types.Object, str]] = []

    body = add_uv("Fuxie_Body_TealHoodie", (0, 0, 1.02), (0.50, 0.35, 0.58), mats["teal"], character_collection)
    belly = add_disc("Fuxie_Belly_CreamPatch", (0, -0.335, 1.02), (0.30, 0.045, 0.36), mats["cream"], character_collection)
    hood = add_uv("Fuxie_Hood_Rim", (0, -0.06, 1.46), (0.46, 0.32, 0.19), mats["teal"], character_collection, 32, 12)
    head = add_uv("Fuxie_Head_SkyBlue", (0, -0.02, 1.86), (0.55, 0.44, 0.48), mats["sky"], character_collection, 40, 18)
    face = add_disc("Fuxie_Face_CreamMask", (0, -0.405, 1.80), (0.38, 0.042, 0.30), mats["cream"], character_collection)
    muzzle = add_disc("Fuxie_Muzzle_Cream", (0, -0.438, 1.69), (0.22, 0.034, 0.12), mats["cream"], character_collection)

    left_ear = add_cone(
        "Fuxie_Ear_L_SkyBlue",
        (-0.34, -0.02, 2.28),
        0.20,
        0.03,
        0.58,
        mats["sky"],
        character_collection,
        vertices=3,
        rotation=(0.18, 0.34, -0.30),
    )
    right_ear = add_cone(
        "Fuxie_Ear_R_SkyBlue",
        (0.34, -0.02, 2.28),
        0.20,
        0.03,
        0.58,
        mats["sky"],
        character_collection,
        vertices=3,
        rotation=(0.18, -0.34, 0.30),
    )
    inner_l = add_disc("Fuxie_InnerEar_L_Cream", (-0.38, -0.135, 2.30), (0.095, 0.018, 0.22), mats["cream"], character_collection)
    inner_r = add_disc("Fuxie_InnerEar_R_Cream", (0.38, -0.135, 2.30), (0.095, 0.018, 0.22), mats["cream"], character_collection)

    eye_l = add_disc("Fuxie_Eye_L", (-0.17, -0.445, 1.86), (0.065, 0.020, 0.092), mats["black"], character_collection)
    eye_r = add_disc("Fuxie_Eye_R", (0.17, -0.445, 1.86), (0.065, 0.020, 0.092), mats["black"], character_collection)
    highlight_l = add_disc("Fuxie_EyeHighlight_L", (-0.145, -0.466, 1.90), (0.020, 0.007, 0.026), mats["white"], character_collection)
    highlight_r = add_disc("Fuxie_EyeHighlight_R", (0.195, -0.466, 1.90), (0.020, 0.007, 0.026), mats["white"], character_collection)
    nose = add_disc("Fuxie_Nose", (0, -0.468, 1.72), (0.044, 0.014, 0.028), mats["deep"], character_collection)
    mouth = add_uv("Fuxie_Mouth_OpenShape", (0, -0.472, 1.62), (0.070, 0.010, 0.032), mats["line"], character_collection, 24, 8)
    smile = add_curve_smile(
        "Fuxie_Mouth_SmileLine",
        [(-0.11, -0.478, 1.66), (-0.055, -0.485, 1.625), (0, -0.488, 1.615), (0.055, -0.485, 1.625), (0.11, -0.478, 1.66)],
        mats["line"],
        character_collection,
        0.007,
    )
    blush_l = add_disc("Fuxie_Blush_L", (-0.29, -0.452, 1.72), (0.060, 0.010, 0.034), mats["blush"], character_collection)
    blush_r = add_disc("Fuxie_Blush_R", (0.29, -0.452, 1.72), (0.060, 0.010, 0.034), mats["blush"], character_collection)

    token = add_cylinder_between("Fuxie_Fucoin_ChestToken", (0, -0.390, 1.16), (0, -0.450, 1.16), 0.125, mats["gold"], character_collection, 40)
    token_line = add_cylinder_between("Fuxie_Fucoin_Mark", (-0.045, -0.459, 1.17), (0.045, -0.459, 1.17), 0.010, mats["deep"], character_collection, 12)

    arm_ul = add_cylinder_between("Fuxie_UpperArm_L", (-0.43, -0.04, 1.36), (-0.70, -0.12, 1.18), 0.095, mats["teal"], character_collection)
    arm_fl = add_cylinder_between("Fuxie_Forearm_L", (-0.70, -0.12, 1.18), (-0.88, -0.18, 1.01), 0.082, mats["sky"], character_collection)
    hand_l = add_uv("Fuxie_Hand_L_Cream", (-0.96, -0.20, 0.95), (0.105, 0.080, 0.092), mats["cream"], character_collection, 24, 12)
    arm_ur = add_cylinder_between("Fuxie_UpperArm_R", (0.43, -0.04, 1.36), (0.70, -0.12, 1.18), 0.095, mats["teal"], character_collection)
    arm_fr = add_cylinder_between("Fuxie_Forearm_R", (0.70, -0.12, 1.18), (0.88, -0.18, 1.01), 0.082, mats["sky"], character_collection)
    hand_r = add_uv("Fuxie_Hand_R_Cream", (0.96, -0.20, 0.95), (0.105, 0.080, 0.092), mats["cream"], character_collection, 24, 12)

    leg_ul = add_cylinder_between("Fuxie_UpperLeg_L", (-0.19, 0, 0.66), (-0.25, -0.04, 0.42), 0.095, mats["teal"], character_collection)
    shin_l = add_cylinder_between("Fuxie_Shin_L", (-0.25, -0.04, 0.42), (-0.29, -0.08, 0.24), 0.082, mats["sky"], character_collection)
    foot_l = add_uv("Fuxie_Foot_L_Cream", (-0.36, -0.20, 0.17), (0.18, 0.12, 0.070), mats["cream"], character_collection, 24, 10)
    leg_ur = add_cylinder_between("Fuxie_UpperLeg_R", (0.19, 0, 0.66), (0.25, -0.04, 0.42), 0.095, mats["teal"], character_collection)
    shin_r = add_cylinder_between("Fuxie_Shin_R", (0.25, -0.04, 0.42), (0.29, -0.08, 0.24), 0.082, mats["sky"], character_collection)
    foot_r = add_uv("Fuxie_Foot_R_Cream", (0.36, -0.20, 0.17), (0.18, 0.12, 0.070), mats["cream"], character_collection, 24, 10)

    tail_1 = add_uv("Fuxie_Tail_01_SkyBlue", (0.48, 0.38, 1.10), (0.16, 0.24, 0.23), mats["sky"], character_collection, 28, 12, rotation=(0.25, 0.55, -0.25))
    tail_2 = add_uv("Fuxie_Tail_02_SkyBlue", (0.72, 0.54, 1.36), (0.18, 0.23, 0.29), mats["sky"], character_collection, 28, 12, rotation=(0.45, 0.40, -0.35))
    tail_3 = add_uv("Fuxie_TailTip_Cream", (0.86, 0.50, 1.62), (0.15, 0.18, 0.22), mats["cream"], character_collection, 28, 12, rotation=(0.40, 0.25, -0.20))

    mesh_specs.extend(
        [
            (body, "hips"),
            (belly, "hips"),
            (hood, "chest"),
            (head, "head"),
            (face, "head"),
            (muzzle, "head"),
            (left_ear, "ear.L"),
            (right_ear, "ear.R"),
            (inner_l, "ear.L"),
            (inner_r, "ear.R"),
            (eye_l, "head"),
            (eye_r, "head"),
            (highlight_l, "head"),
            (highlight_r, "head"),
            (nose, "head"),
            (mouth, "head"),
            (smile, "head"),
            (blush_l, "head"),
            (blush_r, "head"),
            (token, "chest"),
            (token_line, "chest"),
            (arm_ul, "upper_arm.L"),
            (arm_fl, "forearm.L"),
            (hand_l, "hand.L"),
            (arm_ur, "upper_arm.R"),
            (arm_fr, "forearm.R"),
            (hand_r, "hand.R"),
            (leg_ul, "upper_leg.L"),
            (shin_l, "shin.L"),
            (foot_l, "foot.L"),
            (leg_ur, "upper_leg.R"),
            (shin_r, "shin.R"),
            (foot_r, "foot.R"),
            (tail_1, "tail.01"),
            (tail_2, "tail.02"),
            (tail_3, "tail.03"),
        ]
    )

    for obj, bone_name in mesh_specs:
        bind_object_to_bone(obj, armature, bone_name)

    eye_l_blink = add_shape_key_scale(eye_l, "blink", (1.0, 1.0, 0.08))
    eye_r_blink = add_shape_key_scale(eye_r, "blink", (1.0, 1.0, 0.08))
    mouth_open = add_shape_key_scale(mouth, "talkOpen", (1.05, 1.0, 2.25))

    parts.update(
        {
            "body": body,
            "head": head,
            "eye_l_blink": eye_l_blink,
            "eye_r_blink": eye_r_blink,
            "mouth_open": mouth_open,
        }
    )

    return armature, parts


def animate(armature: bpy.types.Object, parts: dict[str, bpy.types.Object | bpy.types.ShapeKey]) -> None:
    blink_l = parts["eye_l_blink"]
    blink_r = parts["eye_r_blink"]
    mouth_open = parts["mouth_open"]
    assert isinstance(blink_l, bpy.types.ShapeKey)
    assert isinstance(blink_r, bpy.types.ShapeKey)
    assert isinstance(mouth_open, bpy.types.ShapeKey)
    shape_keys = [blink_l, blink_r, mouth_open]

    def blink(frames: list[tuple[int, float]]) -> None:
        for frame, value in frames:
            key_shape(blink_l, frame, value)
            key_shape(blink_r, frame, value)

    def idle() -> None:
        for frame, z, sway in [(1, 0.0, 0.00), (24, 0.035, -0.025), (48, 0.0, 0.00), (72, 0.035, 0.025), (96, 0.0, 0.00)]:
            key_bone(armature, "root", frame, loc=(0, 0, z))
            key_bone(armature, "hips", frame, rot=(0.015, 0, sway))
            key_bone(armature, "chest", frame, rot=(-0.012, 0, sway * 0.6))
            key_bone(armature, "head", frame, rot=(0.02 * math.sin(frame * 0.08), 0, -sway * 1.15))
            key_bone(armature, "ear.L", frame, rot=(0.02, -0.03 * math.sin(frame * 0.09), -0.04))
            key_bone(armature, "ear.R", frame, rot=(0.02, 0.03 * math.sin(frame * 0.09), 0.04))
            key_bone(armature, "tail.01", frame, rot=(0.04, 0.08, 0.12 * math.sin(frame * 0.12)))
            key_bone(armature, "tail.02", frame, rot=(0.02, 0.06, -0.14 * math.sin(frame * 0.12)))
            key_bone(armature, "tail.03", frame, rot=(0.01, 0.04, 0.10 * math.sin(frame * 0.12)))
        blink([(1, 0), (38, 0), (41, 1), (44, 0), (96, 0)])
        key_shape(mouth_open, 1, 0.0)
        key_shape(mouth_open, 96, 0.0)

    def wave() -> None:
        for frame, z in [(1, 0), (20, 0.03), (40, 0), (60, 0.03), (80, 0)]:
            key_bone(armature, "root", frame, loc=(0, 0, z))
            key_bone(armature, "head", frame, rot=(0.03, 0, 0.04 * math.sin(frame * 0.16)))
            key_bone(armature, "tail.01", frame, rot=(0.05, 0.10, 0.18 * math.sin(frame * 0.14)))
            key_bone(armature, "tail.02", frame, rot=(0.03, 0.06, -0.20 * math.sin(frame * 0.14)))
        for frame, upper, fore, hand in [
            (1, (0, 0, 0), (0, 0, 0), (0, 0, 0)),
            (14, (-0.42, 0.05, -1.05), (-0.24, 0.10, -0.55), (0, 0.15, -0.26)),
            (28, (-0.56, 0.00, -1.25), (-0.18, 0.26, -0.35), (0.08, 0.20, 0.22)),
            (42, (-0.42, 0.05, -1.05), (-0.24, 0.10, -0.55), (0, 0.15, -0.26)),
            (56, (-0.56, 0.00, -1.25), (-0.18, 0.26, -0.35), (0.08, 0.20, 0.22)),
            (80, (0, 0, 0), (0, 0, 0), (0, 0, 0)),
        ]:
            key_bone(armature, "upper_arm.R", frame, rot=upper)
            key_bone(armature, "forearm.R", frame, rot=fore)
            key_bone(armature, "hand.R", frame, rot=hand)
        blink([(1, 0), (48, 0), (51, 1), (54, 0), (80, 0)])
        for frame, value in [(1, 0.05), (28, 0.20), (56, 0.16), (80, 0.05)]:
            key_shape(mouth_open, frame, value)

    def talk() -> None:
        for frame in [1, 16, 32, 48, 64, 80, 96]:
            key_bone(armature, "head", frame, rot=(0.04 * math.sin(frame * 0.17), 0, 0.035 * math.sin(frame * 0.11)))
            key_bone(armature, "upper_arm.L", frame, rot=(-0.08, 0.05, 0.16 * math.sin(frame * 0.10)))
            key_bone(armature, "upper_arm.R", frame, rot=(-0.08, -0.05, -0.16 * math.sin(frame * 0.10)))
        for frame in range(1, 97, 6):
            key_shape(mouth_open, frame, 0.80 if (frame // 6) % 2 else 0.15)
        blink([(1, 0), (70, 0), (73, 1), (76, 0), (96, 0)])

    make_clip(armature, "idle", 96, idle, shape_keys)
    make_clip(armature, "wave", 80, wave, shape_keys)
    make_clip(armature, "talk", 96, talk, shape_keys)


def setup_scene() -> None:
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0
    scene.frame_start = 1
    scene.frame_end = 96
    scene.render.fps = 60
    scene.render.resolution_x = 1200
    scene.render.resolution_y = 1200
    scene.render.film_transparent = True
    try:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    except TypeError:
        scene.render.engine = "BLENDER_EEVEE"
    if hasattr(scene, "eevee"):
        try:
            scene.eevee.taa_render_samples = 64
        except Exception:
            pass
    scene.view_settings.view_transform = "Filmic"
    scene.view_settings.look = "Medium High Contrast"
    scene.world = scene.world or bpy.data.worlds.new("Fuxie_World")
    scene.world.color = (0.94, 0.97, 1.0)

    bpy.ops.object.light_add(type="AREA", location=(-2.2, -3.8, 4.0))
    key = bpy.context.object
    key.name = "Fuxie_KeyLight_Softbox"
    key.data.energy = 580
    key.data.size = 4.8

    bpy.ops.object.light_add(type="POINT", location=(2.6, -2.5, 2.4))
    fill = bpy.context.object
    fill.name = "Fuxie_EyeSpark_Fill"
    fill.data.energy = 85

    bpy.ops.object.camera_add(location=(0, -6.2, 1.45))
    camera = bpy.context.object
    camera.name = "Fuxie_Preview_Camera"
    camera.rotation_euler = (Vector((0, 0, 1.35)) - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = 3.0
    scene.camera = camera


def select_export_objects(collection: bpy.types.Collection) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    for obj in collection.objects:
        obj.select_set(True)
    if collection.objects:
        bpy.context.view_layer.objects.active = next((obj for obj in collection.objects if obj.type == "ARMATURE"), collection.objects[0])


def export_outputs(character_collection: bpy.types.Collection) -> None:
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))

    select_export_objects(character_collection)
    gltf_props = bpy.ops.export_scene.gltf.get_rna_type().properties.keys()
    gltf_kwargs = {
        "filepath": str(GLB_PATH),
        "export_format": "GLB",
        "use_selection": True,
        "export_yup": True,
        "export_animations": True,
    }
    if "export_animation_mode" in gltf_props:
        gltf_kwargs["export_animation_mode"] = "NLA_TRACKS"
    if "export_nla_strips" in gltf_props:
        gltf_kwargs["export_nla_strips"] = True
    if "export_force_sampling" in gltf_props:
        gltf_kwargs["export_force_sampling"] = True
    if "export_frame_range" in gltf_props:
        gltf_kwargs["export_frame_range"] = False
    bpy.ops.export_scene.gltf(**gltf_kwargs)

    select_export_objects(character_collection)
    bpy.ops.export_scene.fbx(
        filepath=str(FBX_PATH),
        use_selection=True,
        add_leaf_bones=False,
        bake_anim=True,
        bake_anim_use_nla_strips=True,
        bake_anim_use_all_actions=False,
        apply_unit_scale=True,
        object_types={"ARMATURE", "MESH"},
    )

    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.scene.frame_set(24)
    bpy.context.scene.render.image_settings.file_format = "PNG"
    bpy.context.scene.render.filepath = str(PREVIEW_PATH)
    bpy.ops.render.render(write_still=True)


def write_manifest(character_collection: bpy.types.Collection, reference_collection: bpy.types.Collection) -> None:
    meshes = [obj for obj in character_collection.objects if obj.type == "MESH"]
    vertices = sum(len(obj.data.vertices) for obj in meshes)
    faces = sum(len(obj.data.polygons) for obj in meshes)
    armatures = [obj for obj in character_collection.objects if obj.type == "ARMATURE"]
    bones = []
    if armatures:
        bones = [bone.name for bone in armatures[0].data.bones]

    manifest = {
        "name": "Fuxie_Character",
        "source_note": "Stylized approximation from existing Fuxie 3D render images; not an exact 3D reconstruction.",
        "references": [str(path.relative_to(ROOT)).replace("\\", "/") for path in REFERENCE_IMAGES if path.exists()],
        "outputs": {
            "blend": str(BLEND_PATH.relative_to(ROOT)).replace("\\", "/"),
            "glb": str(GLB_PATH.relative_to(ROOT)).replace("\\", "/"),
            "fbx": str(FBX_PATH.relative_to(ROOT)).replace("\\", "/"),
            "preview": str(PREVIEW_PATH.relative_to(ROOT)).replace("\\", "/"),
        },
        "stats": {
            "mesh_objects": len(meshes),
            "vertices_before_export_modifiers": vertices,
            "faces_before_export_modifiers": faces,
            "bones": bones,
            "reference_planes": [obj.name for obj in reference_collection.objects],
            "fps": bpy.context.scene.render.fps,
            "clips": CLIPS,
        },
        "artist_next_steps": [
            "Sculpt final silhouette and face planes from orthographic reference.",
            "Retopology into one skinned mesh if deforming limbs/facial animation is required.",
            "UV unwrap and texture paint from approved Fuxie palette.",
            "Weight paint continuous joints and add corrective shapes.",
            "Build production animation set and runtime LODs.",
        ],
    }
    REPORT_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")


def main() -> None:
    ensure_dirs()
    clear_scene()
    setup_scene()

    character_collection = make_collection("Fuxie_Character_GameExport")
    reference_collection = make_collection("Fuxie_Image_References")
    armature, parts = build_character(character_collection, reference_collection)
    animate(armature, parts)

    export_outputs(character_collection)
    write_manifest(character_collection, reference_collection)
    print(f"Saved Blender file: {BLEND_PATH}")
    print(f"Exported GLB: {GLB_PATH}")
    print(f"Exported FBX: {FBX_PATH}")
    print(f"Rendered preview: {PREVIEW_PATH}")


if __name__ == "__main__":
    main()
