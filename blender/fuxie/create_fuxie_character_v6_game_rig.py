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

SOURCE_REFERENCE = REFERENCE_DIR / "fuxie_ref_front_cutout.png"
FRONT_REFERENCE = REFERENCE_DIR / "fuxie_ref_front.png"
THREE_QUARTER_REFERENCE = REFERENCE_DIR / "fuxie_ref_three_quarter.png"
SIDE_REFERENCE = REFERENCE_DIR / "fuxie_ref_side.png"
BACK_REFERENCE = REFERENCE_DIR / "fuxie_ref_back.png"
FACES_REFERENCE = REFERENCE_DIR / "fuxie_ref_faces.png"
TAIL_REFERENCE = REFERENCE_DIR / "fuxie_ref_tail_material.png"

BLEND_PATH = BLENDER_DIR / "Fuxie_Character_v6_game_rig.blend"
GLB_PATH = MODEL_DIR / "Fuxie_Character_v6_game_rig.glb"
FBX_PATH = MODEL_DIR / "Fuxie_Character_v6_game_rig.fbx"
PREVIEW_PATH = BLENDER_DIR / "Fuxie_preview_v6_game_rig.png"
MANIFEST_PATH = BLENDER_DIR / "Fuxie_Character_v6_game_rig_manifest.json"
PUBLIC_GLB_PATH = PUBLIC_LIVE_DIR / "fuxie-game-rig-v6.glb"
PUBLIC_POSTER_PATH = PUBLIC_LIVE_DIR / "fuxie-game-rig-v6-poster.png"
PUBLIC_MANIFEST_PATH = PUBLIC_LIVE_DIR / "fuxie-game-rig-v6.json"

SOURCE_WIDTH = 330
SOURCE_HEIGHT = 540
WORLD_HEIGHT = 2.72
SCALE = WORLD_HEIGHT / SOURCE_HEIGHT

CLIPS = {
    "idle": {"frames": 120, "description": "Breathing, head bob, tail sway, and ear twitch at 60fps."},
    "wave": {"frames": 96, "description": "Right-arm greeting wave with body sway and tail counter-motion."},
    "talk": {"frames": 120, "description": "Head nod, jaw/mouth bounce, hand gesture, and breathing loop."},
    "listen": {"frames": 120, "description": "Head tilt, ear focus, soft tail sway, and attentive posture."},
    "reward": {"frames": 96, "description": "In-place hop, arms up, squash/stretch, and fast tail wag."},
    "tryAgain": {"frames": 120, "description": "Gentle encouraging nod and small hand motion."},
}

PARTS = [
    {
        "name": "Fuxie_Base_FullBody",
        "bone": "root",
        "rect": (0, 0, 330, 540),
        "layer": 0.090,
        "order": -1,
    },
    {
        "name": "Fuxie_Tail",
        "bone": "tail.02",
        "rect": (204, 292, 330, 452),
        "poly": [(212, 304), (262, 302), (318, 330), (329, 372), (314, 428), (248, 456), (205, 430), (238, 382)],
        "layer": 0.055,
        "order": 0,
    },
    {
        "name": "Fuxie_Leg_L",
        "bone": "shin.L",
        "rect": (72, 384, 154, 532),
        "poly": [(86, 388), (152, 388), (154, 455), (145, 526), (78, 526), (88, 455)],
        "layer": 0.018,
        "order": 1,
    },
    {
        "name": "Fuxie_Leg_R",
        "bone": "shin.R",
        "rect": (164, 384, 250, 532),
        "poly": [(174, 388), (238, 388), (250, 526), (183, 526), (172, 455)],
        "layer": 0.018,
        "order": 1,
    },
    {
        "name": "Fuxie_Body_Hoodie",
        "bone": "chest",
        "rect": (54, 226, 272, 422),
        "poly": [(78, 228), (252, 228), (278, 330), (250, 410), (202, 416), (166, 402), (128, 416), (72, 410), (54, 336)],
        "layer": 0.006,
        "order": 2,
    },
    {
        "name": "Fuxie_Arm_L",
        "bone": "forearm.L",
        "rect": (42, 265, 120, 438),
        "poly": [(56, 268), (104, 280), (116, 392), (94, 436), (58, 420), (42, 335)],
        "layer": -0.010,
        "order": 3,
    },
    {
        "name": "Fuxie_Arm_R",
        "bone": "forearm.R",
        "rect": (212, 260, 302, 420),
        "poly": [(224, 266), (278, 292), (292, 382), (268, 418), (226, 390), (212, 320)],
        "layer": -0.012,
        "order": 3,
    },
    {
        "name": "Fuxie_Head",
        "bone": "head",
        "rect": (16, 5, 310, 264),
        "layer": -0.024,
        "order": 4,
    },
    {
        "name": "Fuxie_Mouth_TalkOverlay",
        "bone": "jaw",
        "rect": (116, 150, 211, 218),
        "poly": [(120, 166), (140, 150), (190, 150), (210, 166), (207, 204), (190, 218), (140, 218), (120, 204)],
        "layer": -0.038,
        "order": 5,
    },
    {
        "name": "Fuxie_Chest_Token",
        "bone": "chest",
        "rect": (123, 250, 197, 322),
        "poly": [(128, 254), (188, 254), (198, 304), (165, 328), (120, 304)],
        "layer": -0.045,
        "order": 6,
    },
]


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


def pixel_to_world(px: float, py: float) -> tuple[float, float]:
    return ((px - SOURCE_WIDTH / 2) * SCALE, (SOURCE_HEIGHT - py) * SCALE)


def rect_to_world(rect: tuple[int, int, int, int]) -> tuple[float, float, float, float, float, float]:
    x0, y0, x1, y1 = rect
    left, top = pixel_to_world(x0, y0)
    right, bottom = pixel_to_world(x1, y1)
    width = right - left
    height = top - bottom
    center_x = (left + right) / 2
    center_z = (top + bottom) / 2
    return left, right, bottom, top, center_x, center_z


def uv_rect(rect: tuple[int, int, int, int]) -> list[tuple[float, float]]:
    x0, y0, x1, y1 = rect
    u0 = x0 / SOURCE_WIDTH
    u1 = x1 / SOURCE_WIDTH
    v0 = 1 - y1 / SOURCE_HEIGHT
    v1 = 1 - y0 / SOURCE_HEIGHT
    return [(u0, v0), (u1, v0), (u1, v1), (u0, v1)]


def image_material(name: str, image_path: Path) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.blend_method = "BLEND"
    if hasattr(mat, "surface_render_method"):
        mat.surface_render_method = "BLENDED"
    if hasattr(mat, "show_transparent_back"):
        mat.show_transparent_back = False
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    image_node = nodes.new("ShaderNodeTexImage")
    image_node.name = f"{name}_SourceTexture"
    image_node.image = bpy.data.images.load(str(image_path), check_existing=True)
    image_node.image.alpha_mode = "STRAIGHT"
    image_node.extension = "CLIP"
    if bsdf:
        mat.node_tree.links.new(image_node.outputs["Color"], bsdf.inputs["Base Color"])
        mat.node_tree.links.new(image_node.outputs["Alpha"], bsdf.inputs["Alpha"])
        bsdf.inputs["Roughness"].default_value = 0.78
        if "Metallic" in bsdf.inputs:
            bsdf.inputs["Metallic"].default_value = 0.0
    return mat


def solid_material(name: str, color: tuple[float, float, float, float]) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.blend_method = "BLEND" if color[3] < 1 else "OPAQUE"
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Alpha"].default_value = color[3]
        bsdf.inputs["Roughness"].default_value = 0.86
    return mat


def create_part_mesh(
    part: dict[str, object],
    collection: bpy.types.Collection,
    material: bpy.types.Material,
) -> bpy.types.Object:
    rect = part["rect"]
    assert isinstance(rect, tuple)
    y = float(part["layer"])
    mesh = bpy.data.meshes.new(f"{part['name']}_Mesh")
    polygon = part.get("poly")
    if polygon:
        verts = []
        uv_values = []
        for px, py in polygon:
            x, z = pixel_to_world(px, py)
            verts.append((x, y, z))
            uv_values.append((px / SOURCE_WIDTH, 1 - py / SOURCE_HEIGHT))
    else:
        left, right, bottom, top, _, _ = rect_to_world(rect)
        verts = [(left, y, bottom), (right, y, bottom), (right, y, top), (left, y, top)]
        uv_values = uv_rect(rect)
    mesh.from_pydata(verts, [], [tuple(range(len(verts)))])
    mesh.update()
    uv_layer = mesh.uv_layers.new(name="Fuxie_V6_SourceUV")
    for polygon in mesh.polygons:
        for loop_index in polygon.loop_indices:
            uv_layer.data[loop_index].uv = uv_values[mesh.loops[loop_index].vertex_index]
    obj = bpy.data.objects.new(str(part["name"]), mesh)
    obj.data.materials.append(material)
    obj["fuxie_source_rect"] = ",".join(str(value) for value in rect)
    obj["fuxie_source_note"] = "UV crop from approved Fuxie 3D cutout reference"
    collection.objects.link(obj)
    return obj


def add_shadow(collection: bpy.types.Collection) -> bpy.types.Object:
    mat = solid_material("Fuxie_V6_SoftShadow_Material", (0.04, 0.15, 0.22, 0.25))
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=12, location=(0, 0.082, 0.055), scale=(0.74, 0.08, 0.030))
    obj = bpy.context.object
    obj.name = "Fuxie_Shadow"
    obj.data.name = "Fuxie_Shadow_Mesh"
    obj.data.materials.append(mat)
    link_only(obj, collection)
    return obj


def add_reference_plane(
    name: str,
    image_path: Path,
    height: float,
    location: tuple[float, float, float],
    collection: bpy.types.Collection,
) -> bpy.types.Object:
    image = bpy.data.images.load(str(image_path), check_existing=True)
    width = height * image.size[0] / image.size[1]
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    verts = [(-width / 2, 0, 0), (width / 2, 0, 0), (width / 2, 0, height), (-width / 2, 0, height)]
    mesh.from_pydata(verts, [], [(0, 1, 2, 3)])
    mesh.update()
    uv_layer = mesh.uv_layers.new(name="ReferenceUV")
    for polygon in mesh.polygons:
        for loop_index in polygon.loop_indices:
            uv_layer.data[loop_index].uv = [(0, 0), (1, 0), (1, 1), (0, 1)][mesh.loops[loop_index].vertex_index]
    obj = bpy.data.objects.new(name, mesh)
    obj.location = location
    obj.hide_render = True
    obj.hide_viewport = True
    obj.data.materials.append(image_material(f"{name}_Material", image_path))
    collection.objects.link(obj)
    return obj


def create_armature(collection: bpy.types.Collection) -> bpy.types.Object:
    bpy.ops.object.armature_add(enter_editmode=True, location=(0, 0, 0))
    armature = bpy.context.object
    armature.name = "Fuxie_V6_GameRig_Armature"
    armature.data.name = "Fuxie_V6_GameRig_Skeleton"
    armature.show_in_front = True
    link_only(armature, collection)

    edit_bones = armature.data.edit_bones
    edit_bones.remove(edit_bones[0])
    specs = {
        "root": ((0.00, 0.00, 0.05), (0.00, 0.00, 0.32), None),
        "hips": ((0.00, 0.00, 0.62), (0.00, 0.00, 0.92), "root"),
        "spine": ((0.00, 0.00, 0.92), (0.00, 0.00, 1.30), "hips"),
        "chest": ((0.00, 0.00, 1.30), (0.00, 0.00, 1.56), "spine"),
        "neck": ((0.00, 0.00, 1.56), (0.00, 0.00, 1.70), "chest"),
        "head": ((0.00, 0.00, 1.70), (0.00, 0.00, 2.24), "neck"),
        "jaw": ((0.00, -0.01, 1.76), (0.00, -0.01, 1.60), "head"),
        "ear.L.01": ((-0.38, 0.00, 2.15), (-0.60, 0.00, 2.58), "head"),
        "ear.R.01": ((0.38, 0.00, 2.15), (0.60, 0.00, 2.58), "head"),
        "upper_arm.L": ((-0.38, 0.00, 1.30), (-0.60, 0.00, 1.10), "chest"),
        "forearm.L": ((-0.60, 0.00, 1.10), (-0.76, 0.00, 0.70), "upper_arm.L"),
        "hand.L": ((-0.76, 0.00, 0.70), (-0.82, 0.00, 0.54), "forearm.L"),
        "upper_arm.R": ((0.38, 0.00, 1.30), (0.62, 0.00, 1.12), "chest"),
        "forearm.R": ((0.62, 0.00, 1.12), (0.78, 0.00, 0.78), "upper_arm.R"),
        "hand.R": ((0.78, 0.00, 0.78), (0.86, 0.00, 0.62), "forearm.R"),
        "upper_leg.L": ((-0.18, 0.00, 0.70), (-0.27, 0.00, 0.42), "hips"),
        "shin.L": ((-0.27, 0.00, 0.42), (-0.35, 0.00, 0.13), "upper_leg.L"),
        "foot.L": ((-0.35, 0.00, 0.13), (-0.50, 0.00, 0.08), "shin.L"),
        "upper_leg.R": ((0.18, 0.00, 0.70), (0.27, 0.00, 0.42), "hips"),
        "shin.R": ((0.27, 0.00, 0.42), (0.35, 0.00, 0.13), "upper_leg.R"),
        "foot.R": ((0.35, 0.00, 0.13), (0.50, 0.00, 0.08), "shin.R"),
        "tail.01": ((0.28, 0.02, 0.85), (0.58, 0.02, 1.05), "hips"),
        "tail.02": ((0.58, 0.02, 1.05), (0.82, 0.02, 1.24), "tail.01"),
        "tail.03": ((0.82, 0.02, 1.24), (0.99, 0.02, 1.43), "tail.02"),
    }
    controls = {
        "CTRL_root": ((-1.08, 0.00, 0.08), (1.08, 0.00, 0.08), None),
        "CTRL_body": ((-0.72, 0.00, 1.08), (0.72, 0.00, 1.08), None),
        "CTRL_head": ((-0.56, 0.00, 2.26), (0.56, 0.00, 2.26), None),
        "CTRL_hand.L": ((-0.96, 0.00, 0.88), (-0.82, 0.00, 0.88), None),
        "CTRL_hand.R": ((0.82, 0.00, 0.88), (0.96, 0.00, 0.88), None),
        "CTRL_tail": ((0.72, 0.02, 1.50), (1.10, 0.02, 1.62), None),
    }
    created = {}
    for name, (head, tail, parent) in {**specs, **controls}.items():
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
    modifier = obj.modifiers.new(name="Fuxie_V6_GameRig_Armature_Deform", type="ARMATURE")
    modifier.object = armature
    obj.parent = armature


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
    action = bpy.data.actions.new(f"Fuxie_V6_GameRig_{name}")
    armature.animation_data_create().action = action
    reset_pose(armature, 1)
    animator()
    reset_pose(armature, frames)
    stash_action(armature, name, action, frames)
    armature.animation_data.action = None


def animate(armature: bpy.types.Object) -> None:
    def idle() -> None:
        for frame, lift, tilt, head, tail in [
            (1, 0.00, 0.00, 0.00, 0.00),
            (30, 0.025, -0.010, 0.012, 0.10),
            (60, 0.00, 0.00, 0.00, 0.00),
            (90, 0.025, 0.010, -0.012, -0.10),
            (120, 0.00, 0.00, 0.00, 0.00),
        ]:
            key_bone(armature, "root", frame, loc=(0, 0, lift), rot=(0, 0, tilt), scale=(1, 1 + lift * 0.45, 1))
            key_bone(armature, "head", frame, rot=(0, 0, head))
            key_bone(armature, "tail.02", frame, rot=(0, 0, tail))
            key_bone(armature, "ear.L.01", frame, rot=(0, 0, -tail * 0.25))
            key_bone(armature, "ear.R.01", frame, rot=(0, 0, tail * 0.25))

    def wave() -> None:
        for frame, arm, hand, body, lift in [
            (1, 0.00, 0.00, 0.00, 0.00),
            (12, -0.58, -0.20, -0.03, 0.025),
            (24, -0.96, 0.42, 0.02, 0.045),
            (36, -0.76, -0.34, -0.02, 0.020),
            (48, -1.03, 0.46, 0.025, 0.045),
            (60, -0.76, -0.34, -0.02, 0.020),
            (72, -0.96, 0.42, 0.025, 0.040),
            (96, 0.00, 0.00, 0.00, 0.00),
        ]:
            key_bone(armature, "root", frame, loc=(0, 0, lift), rot=(0, 0, body), scale=(1, 1 + lift * 0.35, 1))
            key_bone(armature, "upper_arm.L", frame, rot=(0, 0, arm * 0.45))
            key_bone(armature, "forearm.L", frame, rot=(0, 0, arm))
            key_bone(armature, "hand.L", frame, rot=(0, 0, hand))
            key_bone(armature, "head", frame, rot=(0, 0, -body * 0.55))
            key_bone(armature, "tail.02", frame, rot=(0, 0, -body * 3.0))

    def talk() -> None:
        for frame in range(1, 121, 8):
            phase = frame // 8
            mouth = 1.0 + (0.18 if phase % 2 else 0.0)
            nod = 0.018 * math.sin(frame * 0.18)
            hand = 0.11 * math.sin(frame * 0.28)
            key_bone(armature, "root", frame, loc=(0, 0, 0.012 if phase % 2 else 0.0))
            key_bone(armature, "head", frame, rot=(0, 0, nod))
            key_bone(armature, "jaw", frame, scale=(1.0, mouth, 1.0), loc=(0, 0, -0.012 if phase % 2 else 0.0))
            key_bone(armature, "forearm.R", frame, rot=(0, 0, hand))

    def listen() -> None:
        for frame, tilt, ear, tail in [
            (1, 0.00, 0.00, 0.00),
            (25, -0.12, 0.10, 0.06),
            (60, -0.16, 0.18, -0.04),
            (95, -0.12, 0.10, 0.06),
            (120, 0.00, 0.00, 0.00),
        ]:
            key_bone(armature, "head", frame, rot=(0, 0, tilt))
            key_bone(armature, "chest", frame, rot=(0, 0, tilt * 0.25))
            key_bone(armature, "ear.L.01", frame, rot=(0, 0, ear))
            key_bone(armature, "ear.R.01", frame, rot=(0, 0, ear * 0.35))
            key_bone(armature, "tail.02", frame, rot=(0, 0, tail))

    def reward() -> None:
        for frame, lift, squash, arm_l, arm_r, tail in [
            (1, 0.00, 1.00, 0.00, 0.00, 0.00),
            (12, -0.020, 0.96, -0.20, 0.20, -0.15),
            (24, 0.120, 1.08, -0.90, 0.90, 0.28),
            (36, 0.020, 0.98, -0.55, 0.55, -0.30),
            (48, 0.090, 1.06, -0.95, 0.95, 0.30),
            (72, 0.020, 0.99, -0.35, 0.35, -0.16),
            (96, 0.00, 1.00, 0.00, 0.00, 0.00),
        ]:
            key_bone(armature, "root", frame, loc=(0, 0, lift), scale=(1 / squash, squash, 1), rot=(0, 0, 0.04 * math.sin(frame)))
            key_bone(armature, "forearm.L", frame, rot=(0, 0, arm_l))
            key_bone(armature, "forearm.R", frame, rot=(0, 0, arm_r))
            key_bone(armature, "head", frame, rot=(0, 0, -0.05 * math.sin(frame * 0.22)))
            key_bone(armature, "tail.02", frame, rot=(0, 0, tail))

    def try_again() -> None:
        for frame, nod, hand, tail in [
            (1, 0.00, 0.00, 0.00),
            (30, 0.05, -0.16, 0.06),
            (60, -0.03, 0.12, -0.04),
            (90, 0.04, -0.10, 0.04),
            (120, 0.00, 0.00, 0.00),
        ]:
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
    scene.world = scene.world or bpy.data.worlds.new("Fuxie_V6_GameRig_World")
    scene.world.color = (0.96, 0.985, 1.0)
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "Medium High Contrast"

    bpy.ops.object.light_add(type="AREA", location=(0, -4.2, 4.4))
    light = bpy.context.object
    light.name = "Fuxie_V6_GameRig_KeyLight"
    light.data.energy = 290
    light.data.size = 5.0

    bpy.ops.object.camera_add(location=(0, -5.0, 1.36))
    camera = bpy.context.object
    camera.name = "Fuxie_V6_GameRig_Camera"
    camera.rotation_euler = (Vector((0, 0, 1.36)) - camera.location).to_track_quat("-Z", "Y").to_euler()
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
    gltf_kwargs = {
        "filepath": str(GLB_PATH),
        "export_format": "GLB",
        "use_selection": True,
        "export_yup": True,
        "export_animations": True,
        "export_skins": True,
    }
    if "export_animation_mode" in props:
        gltf_kwargs["export_animation_mode"] = "NLA_TRACKS"
    if "export_nla_strips" in props:
        gltf_kwargs["export_nla_strips"] = True
    if "export_force_sampling" in props:
        gltf_kwargs["export_force_sampling"] = True
    bpy.ops.export_scene.gltf(**gltf_kwargs)

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
        "name": "Fuxie_Character_v6_game_rig",
        "status": "game_rig_prototype_candidate",
        "source_note": "Segmented image-locked game rig. Visible parts are UV crops from the approved Fuxie 3D cutout reference, not a full 3D sculpt reconstruction.",
        "references": [
            str(path.relative_to(ROOT)).replace("\\", "/")
            for path in [SOURCE_REFERENCE, FRONT_REFERENCE, THREE_QUARTER_REFERENCE, SIDE_REFERENCE, BACK_REFERENCE, FACES_REFERENCE, TAIL_REFERENCE]
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
            "target_runtime": "60fps WebGL game-style segmented rig",
        },
        "limits": [
            "This is a source-image segmented rig, so it preserves identity better than procedural primitives but is not a final full-volume 3D sculpt.",
            "Facial motion is a first-pass mouth overlay; production facial animation should use cleaned mouth/eyelid texture layers or a true 3D face mesh.",
            "Part rectangles may need artist cleanup to remove overlap seams before production rollout.",
        ],
        "next_step": "Visual approve V6 silhouette/motion, then move to V7 true mesh sculpt and weight-paint pass if full 3D volume is required.",
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")


def main() -> None:
    ensure_dirs()
    clear_scene()
    setup_scene()

    character_collection = make_collection("Fuxie_V6_GameRig_Export")
    reference_collection = make_collection("Fuxie_V6_Source_References")
    material = image_material("Fuxie_V6_Cutout_Texture_Material", SOURCE_REFERENCE)

    armature = create_armature(character_collection)
    for part in PARTS:
        obj = create_part_mesh(part, character_collection, material)
        bind_to_bone(obj, armature, str(part["bone"]))
    shadow = add_shadow(character_collection)
    bind_to_bone(shadow, armature, "root")

    add_reference_plane("Fuxie_V6_Reference_Front", FRONT_REFERENCE, 2.55, (-2.05, 0.24, 0.04), reference_collection)
    add_reference_plane("Fuxie_V6_Reference_ThreeQuarter", THREE_QUARTER_REFERENCE, 2.55, (2.05, 0.24, 0.04), reference_collection)
    add_reference_plane("Fuxie_V6_Reference_Side", SIDE_REFERENCE, 2.20, (3.65, 0.24, 0.10), reference_collection)
    add_reference_plane("Fuxie_V6_Reference_Back", BACK_REFERENCE, 2.20, (-3.65, 0.24, 0.10), reference_collection)
    add_reference_plane("Fuxie_V6_Reference_Faces", FACES_REFERENCE, 1.0, (0, 0.24, 2.86), reference_collection)
    add_reference_plane("Fuxie_V6_Reference_Tail", TAIL_REFERENCE, 0.82, (0, 0.24, -0.98), reference_collection)

    animate(armature)
    export_assets(character_collection)
    write_manifest(character_collection, reference_collection)
    copy_public_assets()
    print(f"Saved V6 game rig Blender file: {BLEND_PATH}")
    print(f"Exported V6 game rig GLB: {GLB_PATH}")
    print(f"Exported V6 game rig FBX: {FBX_PATH}")
    print(f"Rendered V6 game rig preview: {PREVIEW_PATH}")


if __name__ == "__main__":
    main()
