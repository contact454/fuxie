from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Callable

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
PUBLIC_DIR = ROOT / "apps" / "web" / "public" / "mascot-3d" / "live"
SOURCE_DIR = ROOT / "assets" / "fuxie-3d-source"

ASSET_NAME = "fuxie-rigged-v1"
BLEND_PATH = SOURCE_DIR / f"{ASSET_NAME}.blend"
GLB_PATH = PUBLIC_DIR / f"{ASSET_NAME}.glb"
POSTER_PATH = PUBLIC_DIR / f"{ASSET_NAME}-poster.png"
MANIFEST_PATH = PUBLIC_DIR / f"{ASSET_NAME}.json"

PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
SOURCE_DIR.mkdir(parents=True, exist_ok=True)


CLIPS = {
    "idle": {"frames": 72, "description": "Breathing, blink, soft ears and tail."},
    "wave": {"frames": 64, "description": "Friendly greeting wave."},
    "talk": {"frames": 72, "description": "Mouth phoneme loop with light head nods."},
    "listen": {"frames": 64, "description": "Head tilt and ear focus pose."},
    "reward": {"frames": 72, "description": "Celebration jump with raised hands."},
    "tryAgain": {"frames": 72, "description": "Gentle encouragement and reset nod."},
}


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def material(name: str, color: tuple[float, float, float, float], roughness: float = 0.72) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Roughness"].default_value = roughness
    return mat


def apply_transform(obj: bpy.types.Object) -> bpy.types.Object:
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return obj


def add_uv(
    name: str,
    loc: tuple[float, float, float],
    scale: tuple[float, float, float],
    mat: bpy.types.Material,
    segments: int = 48,
    rings: int = 24,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    obj.data.materials.append(mat)
    return apply_transform(obj)


def add_cone(
    name: str,
    loc: tuple[float, float, float],
    radius1: float,
    radius2: float,
    depth: float,
    mat: bpy.types.Material,
    rotation: tuple[float, float, float] = (0, 0, 0),
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cone_add(
        vertices=48,
        radius1=radius1,
        radius2=radius2,
        depth=depth,
        location=loc,
        rotation=rotation,
    )
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    return apply_transform(obj)


def add_cylinder(
    name: str,
    loc: tuple[float, float, float],
    radius: float,
    depth: float,
    mat: bpy.types.Material,
    rotation: tuple[float, float, float] = (0, 0, 0),
    vertices: int = 36,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices,
        radius=radius,
        depth=depth,
        location=loc,
        rotation=rotation,
    )
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    return apply_transform(obj)


def shade_smooth(objects: list[bpy.types.Object]) -> None:
    for obj in objects:
        bpy.ops.object.select_all(action="DESELECT")
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        try:
            bpy.ops.object.shade_smooth()
        except RuntimeError:
            pass
        obj.select_set(False)


def create_armature() -> bpy.types.Object:
    bpy.ops.object.armature_add(enter_editmode=True, location=(0, 0, 0))
    armature = bpy.context.object
    armature.name = "Fuxie_Rigged_v1_Armature"
    armature.data.name = "Fuxie_Rigged_v1_Skeleton"
    armature.show_in_front = True

    edit_bones = armature.data.edit_bones
    edit_bones.remove(edit_bones[0])

    bone_specs = {
        "root": ((0, 0, 0.34), (0, 0, 0.88), None),
        "body": ((0, 0, 0.82), (0, 0, 1.50), "root"),
        "head": ((0, 0, 1.62), (0, 0, 2.28), "body"),
        "ear.L": ((-0.30, 0, 2.26), (-0.48, 0, 2.62), "head"),
        "ear.R": ((0.30, 0, 2.26), (0.48, 0, 2.62), "head"),
        "upper_arm.L": ((-0.42, -0.02, 1.48), (-0.77, -0.12, 1.78), "body"),
        "upper_arm.R": ((0.42, -0.02, 1.48), (0.77, -0.12, 1.78), "body"),
        "hand.L": ((-0.77, -0.12, 1.78), (-0.86, -0.18, 1.88), "upper_arm.L"),
        "hand.R": ((0.77, -0.12, 1.78), (0.86, -0.18, 1.88), "upper_arm.R"),
        "leg.L": ((-0.20, 0, 0.78), (-0.26, -0.06, 0.42), "root"),
        "leg.R": ((0.20, 0, 0.78), (0.26, -0.06, 0.42), "root"),
        "foot.L": ((-0.26, -0.06, 0.42), (-0.32, -0.20, 0.36), "leg.L"),
        "foot.R": ((0.26, -0.06, 0.42), (0.32, -0.20, 0.36), "leg.R"),
        "tail.1": ((0.42, 0.20, 1.08), (0.72, 0.42, 1.20), "body"),
        "tail.2": ((0.72, 0.42, 1.20), (0.92, 0.58, 1.32), "tail.1"),
    }

    created: dict[str, bpy.types.EditBone] = {}
    for name, (head, tail, parent) in bone_specs.items():
        bone = edit_bones.new(name)
        bone.head = head
        bone.tail = tail
        bone.roll = 0
        if parent:
            bone.parent = created[parent]
            bone.use_connect = False
        created[name] = bone

    bpy.ops.object.mode_set(mode="POSE")
    for pose_bone in armature.pose.bones:
        pose_bone.rotation_mode = "XYZ"
    bpy.ops.object.mode_set(mode="OBJECT")
    return armature


def bind_to_bone(obj: bpy.types.Object, armature: bpy.types.Object, bone_name: str) -> None:
    group = obj.vertex_groups.new(name=bone_name)
    group.add([vertex.index for vertex in obj.data.vertices], 1.0, "ADD")
    modifier = obj.modifiers.new(name="Fuxie armature bind", type="ARMATURE")
    modifier.object = armature
    obj.parent = armature


def add_shape_key_mesh_scale(
    obj: bpy.types.Object,
    key_name: str,
    scale_xyz: tuple[float, float, float],
    center: Vector | None = None,
) -> bpy.types.ShapeKey:
    basis = obj.shape_key_add(name="Basis")
    key = obj.shape_key_add(name=key_name)
    center = center or sum((vertex.co for vertex in obj.data.vertices), Vector()) / len(obj.data.vertices)
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
    basis.value = 0
    return key


def build_fuxie(armature: bpy.types.Object) -> dict[str, bpy.types.Object | bpy.types.ShapeKey]:
    sky = material("Fuxie sky blue", (0.22, 0.63, 0.88, 1))
    teal = material("Fuxie teal hoodie", (0.10, 0.73, 0.68, 1))
    deep = material("Deep blue details", (0.09, 0.22, 0.33, 1))
    cream = material("Soft cream fur", (0.96, 0.98, 1.0, 1))
    amber = material("Fucoin amber", (1.0, 0.72, 0.08, 1), roughness=0.58)
    blush = material("Warm blush", (1.0, 0.45, 0.38, 1))
    black = material("Warm black eyes", (0.03, 0.07, 0.1, 1))

    parts: dict[str, bpy.types.Object | bpy.types.ShapeKey] = {}
    body_parts: list[tuple[bpy.types.Object, str]] = [
        (add_uv("body_hoodie", (0, 0, 1.15), (0.55, 0.38, 0.72), teal), "body"),
        (add_uv("belly_patch", (0, -0.285, 1.12), (0.30, 0.075, 0.40), cream), "body"),
        (add_uv("head", (0, 0, 2.02), (0.58, 0.48, 0.46), sky), "head"),
        (add_uv("face_patch", (0, -0.365, 1.96), (0.38, 0.105, 0.28), cream), "head"),
        (add_cone("left_ear", (-0.38, 0, 2.42), 0.18, 0.03, 0.48, sky, rotation=(0.12, 0.20, -0.36)), "ear.L"),
        (add_cone("right_ear", (0.38, 0, 2.42), 0.18, 0.03, 0.48, sky, rotation=(0.12, -0.20, 0.36)), "ear.R"),
        (add_cone("left_inner_ear", (-0.38, -0.03, 2.40), 0.10, 0.02, 0.34, cream, rotation=(0.12, 0.20, -0.36)), "ear.L"),
        (add_cone("right_inner_ear", (0.38, -0.03, 2.40), 0.10, 0.02, 0.34, cream, rotation=(0.12, -0.20, 0.36)), "ear.R"),
        (add_uv("left_eye", (-0.18, -0.43, 2.04), (0.055, 0.035, 0.07), black, segments=32, rings=16), "head"),
        (add_uv("right_eye", (0.18, -0.43, 2.04), (0.055, 0.035, 0.07), black, segments=32, rings=16), "head"),
        (add_uv("left_eye_spark", (-0.20, -0.455, 2.07), (0.018, 0.010, 0.018), cream, segments=16, rings=8), "head"),
        (add_uv("right_eye_spark", (0.16, -0.455, 2.07), (0.018, 0.010, 0.018), cream, segments=16, rings=8), "head"),
        (add_uv("nose", (0, -0.50, 1.91), (0.055, 0.030, 0.040), deep, segments=24, rings=12), "head"),
        (add_uv("mouth", (0, -0.505, 1.80), (0.09, 0.018, 0.026), deep, segments=24, rings=12), "head"),
        (add_uv("left_blush", (-0.34, -0.42, 1.88), (0.060, 0.020, 0.040), blush, segments=24, rings=12), "head"),
        (add_uv("right_blush", (0.34, -0.42, 1.88), (0.060, 0.020, 0.040), blush, segments=24, rings=12), "head"),
        (add_cylinder("left_arm", (-0.53, -0.04, 1.48), 0.075, 0.62, sky, rotation=(0.35, 0.18, 0.42)), "upper_arm.L"),
        (add_cylinder("right_arm", (0.53, -0.04, 1.48), 0.075, 0.62, sky, rotation=(0.35, -0.18, -0.42)), "upper_arm.R"),
        (add_uv("left_hand", (-0.70, -0.20, 1.72), (0.11, 0.09, 0.11), cream, segments=32, rings=16), "hand.L"),
        (add_uv("right_hand", (0.70, -0.20, 1.72), (0.11, 0.09, 0.11), cream, segments=32, rings=16), "hand.R"),
        (add_cylinder("left_leg", (-0.22, 0.02, 0.68), 0.08, 0.36, sky, rotation=(0.08, 0.02, -0.08)), "leg.L"),
        (add_cylinder("right_leg", (0.22, 0.02, 0.68), 0.08, 0.36, sky, rotation=(0.08, -0.02, 0.08)), "leg.R"),
        (add_uv("left_foot", (-0.24, -0.08, 0.43), (0.18, 0.14, 0.10), deep, segments=32, rings=16), "foot.L"),
        (add_uv("right_foot", (0.24, -0.08, 0.43), (0.18, 0.14, 0.10), deep, segments=32, rings=16), "foot.R"),
        (add_cylinder("tail_base", (0.58, 0.32, 1.10), 0.13, 0.62, sky, rotation=(1.05, 0.08, -0.60)), "tail.1"),
        (add_uv("tail_tip", (0.86, 0.55, 1.28), (0.18, 0.12, 0.16), cream, segments=32, rings=16), "tail.2"),
        (add_cylinder("fucoin_token", (0.0, -0.64, 1.38), 0.16, 0.055, amber, rotation=(math.pi / 2, 0, 0), vertices=48), "body"),
    ]

    shade_smooth([obj for obj, _bone in body_parts])
    for obj, bone_name in body_parts:
        bind_to_bone(obj, armature, bone_name)
        parts[obj.name] = obj

    left_eye = parts["left_eye"]
    right_eye = parts["right_eye"]
    mouth = parts["mouth"]
    if isinstance(left_eye, bpy.types.Object) and isinstance(right_eye, bpy.types.Object) and isinstance(mouth, bpy.types.Object):
        parts["left_eye_blink"] = add_shape_key_mesh_scale(left_eye, "blink", (1.12, 1.0, 0.12))
        parts["right_eye_blink"] = add_shape_key_mesh_scale(right_eye, "blink", (1.12, 1.0, 0.12))
        parts["mouth_talk"] = add_shape_key_mesh_scale(mouth, "talkOpen", (0.72, 1.0, 2.35))

    return parts


def reset_pose(armature: bpy.types.Object, shape_keys: list[bpy.types.ShapeKey]) -> None:
    bpy.ops.object.mode_set(mode="OBJECT")
    for bone in armature.pose.bones:
        bone.location = (0, 0, 0)
        bone.rotation_euler = (0, 0, 0)
        bone.scale = (1, 1, 1)
    for key in shape_keys:
        key.value = 0


def key_bone(
    armature: bpy.types.Object,
    bone_name: str,
    frame: int,
    loc: tuple[float, float, float] | None = None,
    rot: tuple[float, float, float] | None = None,
    scale: tuple[float, float, float] | None = None,
) -> None:
    scene = bpy.context.scene
    scene.frame_set(frame)
    bone = armature.pose.bones[bone_name]
    if loc is not None:
        bone.location = loc
        bone.keyframe_insert(data_path="location", frame=frame)
    if rot is not None:
        bone.rotation_euler = rot
        bone.keyframe_insert(data_path="rotation_euler", frame=frame)
    if scale is not None:
        bone.scale = scale
        bone.keyframe_insert(data_path="scale", frame=frame)


def key_shape(shape_key: bpy.types.ShapeKey, frame: int, value: float) -> None:
    bpy.context.scene.frame_set(frame)
    shape_key.value = value
    shape_key.keyframe_insert(data_path="value", frame=frame)


def set_linear_or_eased(action: bpy.types.Action) -> None:
    if hasattr(action, "fcurves"):
        fcurves = list(action.fcurves)
    else:
        fcurves = [
            fcurve
            for layer in getattr(action, "layers", [])
            for strip in getattr(layer, "strips", [])
            for channelbag in getattr(strip, "channelbags", [])
            for fcurve in getattr(channelbag, "fcurves", [])
        ]

    for fcurve in fcurves:
        for keyframe in fcurve.keyframe_points:
            keyframe.interpolation = "BEZIER"


def stash_action(owner: bpy.types.ID, clip_name: str, action: bpy.types.Action, frames: int) -> None:
    if not owner.animation_data:
        owner.animation_data_create()
    owner.animation_data.action = action
    track = owner.animation_data.nla_tracks.new()
    track.name = clip_name
    strip = track.strips.new(clip_name, 1, action)
    strip.frame_start = 1
    strip.frame_end = frames
    owner.animation_data.action = None


def make_clip(
    armature: bpy.types.Object,
    clip_name: str,
    shape_keys: list[bpy.types.ShapeKey],
    animator: Callable[[], None],
) -> None:
    frames = CLIPS[clip_name]["frames"]
    bpy.context.scene.frame_start = 1
    bpy.context.scene.frame_end = frames
    reset_pose(armature, shape_keys)

    if not armature.animation_data:
        armature.animation_data_create()
    arm_action = bpy.data.actions.new(name=clip_name)
    arm_action.frame_range = (1, frames)
    armature.animation_data.action = arm_action

    key_owner = shape_keys[0].id_data if shape_keys else None
    face_action = None
    if key_owner:
        if not key_owner.animation_data:
            key_owner.animation_data_create()
        face_action = bpy.data.actions.new(name=f"{clip_name}_face")
        face_action.frame_range = (1, frames)
        key_owner.animation_data.action = face_action

    animator()

    set_linear_or_eased(arm_action)
    stash_action(armature, clip_name, arm_action, frames)

    if key_owner and face_action:
        set_linear_or_eased(face_action)
        stash_action(key_owner, clip_name, face_action, frames)


def animate(armature: bpy.types.Object, parts: dict[str, bpy.types.Object | bpy.types.ShapeKey]) -> None:
    shape_keys = [
        value for value in parts.values()
        if isinstance(value, bpy.types.ShapeKey)
    ]
    left_blink = parts["left_eye_blink"]
    right_blink = parts["right_eye_blink"]
    mouth_talk = parts["mouth_talk"]
    assert isinstance(left_blink, bpy.types.ShapeKey)
    assert isinstance(right_blink, bpy.types.ShapeKey)
    assert isinstance(mouth_talk, bpy.types.ShapeKey)

    def blink(frames: list[tuple[int, float]]) -> None:
        for frame, value in frames:
            key_shape(left_blink, frame, value)
            key_shape(right_blink, frame, value)

    def idle() -> None:
        for frame, z, tilt in [(1, 0.0, 0.0), (18, 0.045, -0.025), (36, 0.0, 0.0), (54, 0.045, 0.025), (72, 0.0, 0.0)]:
            key_bone(armature, "root", frame, loc=(0, 0, z), rot=(0, 0, tilt))
            key_bone(armature, "body", frame, rot=(0.015 * math.sin(frame), 0, tilt * 0.4))
            key_bone(armature, "head", frame, rot=(-0.02 * math.sin(frame * 0.2), 0, -tilt * 0.8))
            key_bone(armature, "tail.1", frame, rot=(0.08, 0.08 * math.sin(frame * 0.17), -0.10 * math.sin(frame * 0.11)))
            key_bone(armature, "tail.2", frame, rot=(0.03, 0.05 * math.cos(frame * 0.14), -0.12 * math.sin(frame * 0.13)))
            key_bone(armature, "ear.L", frame, rot=(0.02, -0.03 * math.sin(frame * 0.2), -0.03))
            key_bone(armature, "ear.R", frame, rot=(0.02, 0.03 * math.sin(frame * 0.2), 0.03))
        blink([(1, 0), (28, 0), (31, 1), (34, 0), (72, 0)])
        for frame in [1, 72]:
            key_shape(mouth_talk, frame, 0)

    def wave() -> None:
        for frame, z in [(1, 0), (16, 0.04), (32, 0.0), (48, 0.04), (64, 0)]:
            key_bone(armature, "root", frame, loc=(0, 0, z))
            key_bone(armature, "head", frame, rot=(0.02, 0, 0.05 * math.sin(frame * 0.2)))
            key_bone(armature, "tail.1", frame, rot=(0.05, 0.12, -0.16 * math.sin(frame * 0.15)))
        for frame, rot in [
            (1, (0.0, 0.0, 0.0)),
            (12, (-0.45, -0.12, 1.10)),
            (24, (-0.25, -0.25, 0.62)),
            (36, (-0.48, -0.12, 1.14)),
            (48, (-0.24, -0.22, 0.66)),
            (64, (0.0, 0.0, 0.0)),
        ]:
            key_bone(armature, "upper_arm.L", frame, rot=rot)
            key_bone(armature, "hand.L", frame, rot=(0.05, 0.25 * math.sin(frame), 0.18 * math.cos(frame)))
        blink([(1, 0), (40, 0), (43, 1), (46, 0), (64, 0)])
        for frame in [1, 64]:
            key_shape(mouth_talk, frame, 0.18)

    def talk() -> None:
        for frame, head_x in [(1, 0.00), (18, 0.08), (36, 0.00), (54, 0.06), (72, 0.00)]:
            key_bone(armature, "root", frame, loc=(0, 0, 0.02 * math.sin(frame)))
            key_bone(armature, "head", frame, rot=(head_x, 0, 0.03 * math.sin(frame * 0.23)))
            key_bone(armature, "upper_arm.L", frame, rot=(-0.05, 0, 0.16 * math.sin(frame * 0.12)))
            key_bone(armature, "upper_arm.R", frame, rot=(-0.05, 0, -0.16 * math.sin(frame * 0.12)))
        for frame in range(1, 73, 6):
            value = 0.78 if (frame // 6) % 2 else 0.16
            key_shape(mouth_talk, frame, value)
        blink([(1, 0), (58, 0), (61, 1), (64, 0), (72, 0)])

    def listen() -> None:
        for frame, tilt in [(1, 0.0), (16, -0.20), (44, -0.20), (64, 0.0)]:
            key_bone(armature, "head", frame, rot=(0.04, 0.0, tilt))
            key_bone(armature, "ear.L", frame, rot=(-0.08, 0.04, -0.18))
            key_bone(armature, "ear.R", frame, rot=(-0.02, 0.12, 0.12))
            key_bone(armature, "upper_arm.R", frame, rot=(-0.24, -0.10, -0.42))
            key_bone(armature, "hand.R", frame, rot=(0.04, -0.10, -0.16))
            key_bone(armature, "tail.1", frame, rot=(0.04, 0.06, -0.08))
        blink([(1, 0), (32, 0), (35, 1), (38, 0), (64, 0)])
        key_shape(mouth_talk, 1, 0)
        key_shape(mouth_talk, 64, 0)

    def reward() -> None:
        for frame, z, scale in [(1, 0, 1), (18, 0.30, 1.05), (36, 0.02, 0.98), (54, 0.18, 1.03), (72, 0, 1)]:
            key_bone(armature, "root", frame, loc=(0, 0, z), scale=(scale, scale, scale))
            key_bone(armature, "head", frame, rot=(-0.08, 0, 0.08 * math.sin(frame * 0.2)))
            key_bone(armature, "tail.1", frame, rot=(0.18, 0.22, -0.34 * math.sin(frame * 0.18)))
            key_bone(armature, "tail.2", frame, rot=(0.08, 0.12, -0.26 * math.sin(frame * 0.2)))
        for frame, left_rot, right_rot in [
            (1, (0, 0, 0), (0, 0, 0)),
            (18, (-0.80, -0.20, 0.96), (-0.80, 0.20, -0.96)),
            (36, (-0.50, -0.10, 0.78), (-0.50, 0.10, -0.78)),
            (54, (-0.84, -0.18, 1.05), (-0.84, 0.18, -1.05)),
            (72, (0, 0, 0), (0, 0, 0)),
        ]:
            key_bone(armature, "upper_arm.L", frame, rot=left_rot)
            key_bone(armature, "upper_arm.R", frame, rot=right_rot)
        blink([(1, 0), (72, 0)])
        for frame, value in [(1, 0.20), (18, 0.92), (36, 0.38), (54, 0.88), (72, 0.18)]:
            key_shape(mouth_talk, frame, value)

    def try_again() -> None:
        for frame, z, head_z in [(1, 0, 0.0), (18, 0.025, 0.12), (36, 0.0, -0.08), (54, 0.025, 0.08), (72, 0, 0.0)]:
            key_bone(armature, "root", frame, loc=(0, 0, z))
            key_bone(armature, "head", frame, rot=(0.10, 0, head_z))
            key_bone(armature, "upper_arm.L", frame, rot=(-0.12, -0.05, 0.32))
            key_bone(armature, "upper_arm.R", frame, rot=(-0.12, 0.05, -0.32))
            key_bone(armature, "tail.1", frame, rot=(0.03, 0.02, -0.05 * math.sin(frame * 0.12)))
        blink([(1, 0), (22, 0), (25, 1), (28, 0), (72, 0)])
        for frame, value in [(1, 0.08), (36, 0.26), (72, 0.08)]:
            key_shape(mouth_talk, frame, value)

    make_clip(armature, "idle", shape_keys, idle)
    make_clip(armature, "wave", shape_keys, wave)
    make_clip(armature, "talk", shape_keys, talk)
    make_clip(armature, "listen", shape_keys, listen)
    make_clip(armature, "reward", shape_keys, reward)
    make_clip(armature, "tryAgain", shape_keys, try_again)


def setup_scene() -> None:
    scene = bpy.context.scene
    try:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    except TypeError:
        scene.render.engine = "BLENDER_EEVEE"
    if hasattr(scene, "eevee"):
        scene.eevee.taa_render_samples = 32
    scene.render.resolution_x = 512
    scene.render.resolution_y = 512
    scene.render.film_transparent = True
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "Medium High Contrast"
    scene.world = bpy.data.worlds.new("Fuxie rig soft world") if scene.world is None else scene.world
    scene.world.color = (1.0, 1.0, 1.0)

    bpy.ops.object.light_add(type="AREA", location=(0, -3.8, 4.2))
    key_light = bpy.context.object
    key_light.name = "softbox_key"
    key_light.data.energy = 540
    key_light.data.size = 4.2

    bpy.ops.object.camera_add(location=(0, -6.2, 1.55))
    camera = bpy.context.object
    bpy.context.scene.camera = camera
    camera.rotation_euler = (Vector((0, 0, 1.50)) - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = 3.15


def export_glb() -> None:
    operator_props = bpy.ops.export_scene.gltf.get_rna_type().properties.keys()
    kwargs = {
        "filepath": str(GLB_PATH),
        "export_format": "GLB",
        "export_animations": True,
        "export_yup": True,
    }
    if "export_animation_mode" in operator_props:
        kwargs["export_animation_mode"] = "NLA_TRACKS"
    if "export_nla_strips" in operator_props:
        kwargs["export_nla_strips"] = True
    if "export_force_sampling" in operator_props:
        kwargs["export_force_sampling"] = True
    if "export_frame_range" in operator_props:
        kwargs["export_frame_range"] = False
    bpy.ops.export_scene.gltf(**kwargs)


def export_assets() -> None:
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
    export_glb()

    scene = bpy.context.scene
    scene.frame_set(12)
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = str(POSTER_PATH)
    bpy.ops.render.render(write_still=True)

    manifest = {
        "name": ASSET_NAME,
        "model": f"/mascot-3d/live/{ASSET_NAME}.glb",
        "poster": f"/mascot-3d/live/{ASSET_NAME}-poster.png",
        "clips": CLIPS,
        "rig": {
            "type": "segmented-armature",
            "bones": [
                "root",
                "body",
                "head",
                "ear.L",
                "ear.R",
                "upper_arm.L",
                "upper_arm.R",
                "hand.L",
                "hand.R",
                "leg.L",
                "leg.R",
                "foot.L",
                "foot.R",
                "tail.1",
                "tail.2",
            ],
            "shapeKeys": ["blink", "talkOpen"],
        },
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")


def main() -> None:
    clear_scene()
    setup_scene()
    armature = create_armature()
    parts = build_fuxie(armature)
    animate(armature, parts)
    export_assets()


if __name__ == "__main__":
    main()
