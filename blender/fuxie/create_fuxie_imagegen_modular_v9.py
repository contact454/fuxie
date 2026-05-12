from __future__ import annotations

import json
import math
import shutil
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
BLENDER_DIR = ROOT / "blender" / "fuxie"
SOURCE_DIR = BLENDER_DIR / "imagegen_parts" / "v2" / "parts"
MODEL_DIR = ROOT / "assets" / "models"
PUBLIC_LIVE_DIR = ROOT / "apps" / "web" / "public" / "mascot-3d" / "live"

BLEND_PATH = BLENDER_DIR / "Fuxie_Character_v9_imagegen_modular.blend"
GLB_PATH = MODEL_DIR / "Fuxie_Character_v9_imagegen_modular.glb"
FBX_PATH = MODEL_DIR / "Fuxie_Character_v9_imagegen_modular.fbx"
PREVIEW_PATH = BLENDER_DIR / "Fuxie_preview_v9_imagegen_modular.png"
MANIFEST_PATH = BLENDER_DIR / "Fuxie_Character_v9_imagegen_modular_manifest.json"
PUBLIC_GLB_PATH = PUBLIC_LIVE_DIR / "fuxie-imagegen-modular-v9.glb"
PUBLIC_POSTER_PATH = PUBLIC_LIVE_DIR / "fuxie-imagegen-modular-v9-poster.png"
PUBLIC_MANIFEST_PATH = PUBLIC_LIVE_DIR / "fuxie-imagegen-modular-v9.json"

CLIPS = {
    "idle": {"frames": 120, "description": "60fps breathing, head bob, ear focus, and tail sway."},
    "wave": {"frames": 96, "description": "Left hand wave with body bounce and tail counter-motion."},
    "talk": {"frames": 120, "description": "Head nod and jaw/body talk rhythm using the imagegen head source."},
    "listen": {"frames": 120, "description": "Attentive head tilt, ears forward, soft tail motion."},
    "reward": {"frames": 96, "description": "Happy hop, arm raise, squash/stretch, and tail wag."},
    "tryAgain": {"frames": 120, "description": "Gentle encouragement nod and small hand motion."},
}

PARTS = [
    {
        "name": "Fuxie_V9_Tail",
        "bone": "tail.02",
        "image": "fuxie_imagegen_parts_v2_tail.png",
        "height": 0.92,
        "center": (0.54, 0.060, 0.78),
        "order": 0,
    },
    {
        "name": "Fuxie_V9_Leg_L",
        "bone": "shin.L",
        "image": "fuxie_imagegen_parts_v2_left_leg_shoe.png",
        "height": 0.64,
        "center": (-0.24, -0.012, 0.34),
        "order": 1,
    },
    {
        "name": "Fuxie_V9_Leg_R",
        "bone": "shin.R",
        "image": "fuxie_imagegen_parts_v2_right_leg_shoe.png",
        "height": 0.64,
        "center": (0.24, -0.014, 0.34),
        "order": 1,
    },
    {
        "name": "Fuxie_V9_Body_Hoodie",
        "bone": "chest",
        "image": "fuxie_imagegen_parts_v2_body_hoodie_token.png",
        "height": 1.18,
        "center": (0.00, -0.030, 1.04),
        "order": 2,
    },
    {
        "name": "Fuxie_V9_Arm_L",
        "bone": "forearm.L",
        "image": "fuxie_imagegen_parts_v2_left_arm_hand.png",
        "height": 0.82,
        "center": (-0.63, -0.044, 1.02),
        "order": 3,
    },
    {
        "name": "Fuxie_V9_Arm_R",
        "bone": "forearm.R",
        "image": "fuxie_imagegen_parts_v2_right_arm_hand.png",
        "height": 0.82,
        "center": (0.63, -0.046, 1.02),
        "order": 3,
    },
    {
        "name": "Fuxie_V9_Head_Face",
        "bone": "head",
        "image": "fuxie_imagegen_parts_v2_head_face.png",
        "height": 1.23,
        "center": (0.00, -0.070, 1.86),
        "order": 4,
    },
    {
        "name": "Fuxie_V9_Bandana_Token_SourceOnly",
        "bone": "chest",
        "image": "fuxie_imagegen_parts_v2_bandana_token.png",
        "height": 0.38,
        "center": (0.00, -0.092, 1.32),
        "order": 5,
        "source_only": True,
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


def image_material(name: str, image_path: Path) -> bpy.types.Material:
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    material.blend_method = "BLEND"
    if hasattr(material, "surface_render_method"):
        material.surface_render_method = "BLENDED"
    if hasattr(material, "show_transparent_back"):
        material.show_transparent_back = False
    nodes = material.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    image_node = nodes.new("ShaderNodeTexImage")
    image_node.image = bpy.data.images.load(str(image_path), check_existing=True)
    image_node.image.alpha_mode = "STRAIGHT"
    image_node.extension = "CLIP"
    if bsdf:
        material.node_tree.links.new(image_node.outputs["Color"], bsdf.inputs["Base Color"])
        material.node_tree.links.new(image_node.outputs["Alpha"], bsdf.inputs["Alpha"])
        bsdf.inputs["Roughness"].default_value = 0.78
        if "Metallic" in bsdf.inputs:
            bsdf.inputs["Metallic"].default_value = 0.0
    return material


def solid_material(name: str, color: tuple[float, float, float, float]) -> bpy.types.Material:
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    material.blend_method = "BLEND" if color[3] < 1 else "OPAQUE"
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Alpha"].default_value = color[3]
        bsdf.inputs["Roughness"].default_value = 0.85
    return material


def create_part_mesh(part: dict[str, object], collection: bpy.types.Collection) -> bpy.types.Object:
    image_path = SOURCE_DIR / str(part["image"])
    if not image_path.exists():
        raise FileNotFoundError(image_path)
    image = bpy.data.images.load(str(image_path), check_existing=True)
    height = float(part["height"])
    width = height * image.size[0] / max(1, image.size[1])
    cx, y, cz = part["center"]
    cx = float(cx)
    y = float(y)
    cz = float(cz)
    left = cx - width / 2
    right = cx + width / 2
    bottom = cz - height / 2
    top = cz + height / 2
    mesh = bpy.data.meshes.new(f"{part['name']}_Mesh")
    mesh.from_pydata(
        [(left, y, bottom), (right, y, bottom), (right, y, top), (left, y, top)],
        [],
        [(0, 1, 2, 3)],
    )
    mesh.update()
    uv_layer = mesh.uv_layers.new(name="Fuxie_ImagegenPartUV")
    uv_values = [(0, 0), (1, 0), (1, 1), (0, 1)]
    for polygon in mesh.polygons:
        for loop_index in polygon.loop_indices:
            uv_layer.data[loop_index].uv = uv_values[mesh.loops[loop_index].vertex_index]
    obj = bpy.data.objects.new(str(part["name"]), mesh)
    obj.data.materials.append(image_material(f"{part['name']}_Material", image_path))
    obj["fuxie_source_image"] = str(image_path.relative_to(ROOT)).replace("\\", "/")
    obj["fuxie_source_note"] = "Codex imagegen modular part v2, used as a rigged image plane source"
    collection.objects.link(obj)
    return obj


def add_shadow(collection: bpy.types.Collection) -> bpy.types.Object:
    material = solid_material("Fuxie_V9_SoftShadow_Material", (0.04, 0.15, 0.22, 0.18))
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=12, location=(0, 0.095, 0.055), scale=(0.78, 0.08, 0.030))
    obj = bpy.context.object
    obj.name = "Fuxie_V9_Shadow"
    obj.data.name = "Fuxie_V9_Shadow_Mesh"
    obj.data.materials.append(material)
    link_only(obj, collection)
    return obj


def create_armature(collection: bpy.types.Collection) -> bpy.types.Object:
    bpy.ops.object.armature_add(enter_editmode=True, location=(0, 0, 0))
    armature = bpy.context.object
    armature.name = "Fuxie_V9_ImagegenModular_Armature"
    armature.data.name = "Fuxie_V9_ImagegenModular_Skeleton"
    armature.show_in_front = True
    link_only(armature, collection)
    edit_bones = armature.data.edit_bones
    edit_bones.remove(edit_bones[0])
    specs = {
        "root": ((0.00, 0.00, 0.05), (0.00, 0.00, 0.30), None),
        "hips": ((0.00, 0.00, 0.55), (0.00, 0.00, 0.86), "root"),
        "spine": ((0.00, 0.00, 0.86), (0.00, 0.00, 1.18), "hips"),
        "chest": ((0.00, 0.00, 1.18), (0.00, 0.00, 1.43), "spine"),
        "neck": ((0.00, 0.00, 1.43), (0.00, 0.00, 1.56), "chest"),
        "head": ((0.00, 0.00, 1.56), (0.00, 0.00, 2.24), "neck"),
        "jaw": ((0.00, -0.01, 1.66), (0.00, -0.01, 1.52), "head"),
        "ear.L.01": ((-0.36, 0.00, 2.05), (-0.55, 0.00, 2.50), "head"),
        "ear.R.01": ((0.36, 0.00, 2.05), (0.55, 0.00, 2.50), "head"),
        "upper_arm.L": ((-0.34, 0.00, 1.25), (-0.55, 0.00, 1.08), "chest"),
        "forearm.L": ((-0.55, 0.00, 1.08), (-0.74, 0.00, 0.68), "upper_arm.L"),
        "hand.L": ((-0.74, 0.00, 0.68), (-0.82, 0.00, 0.52), "forearm.L"),
        "upper_arm.R": ((0.34, 0.00, 1.25), (0.55, 0.00, 1.08), "chest"),
        "forearm.R": ((0.55, 0.00, 1.08), (0.74, 0.00, 0.68), "upper_arm.R"),
        "hand.R": ((0.74, 0.00, 0.68), (0.82, 0.00, 0.52), "forearm.R"),
        "upper_leg.L": ((-0.17, 0.00, 0.70), (-0.25, 0.00, 0.43), "hips"),
        "shin.L": ((-0.25, 0.00, 0.43), (-0.34, 0.00, 0.13), "upper_leg.L"),
        "foot.L": ((-0.34, 0.00, 0.13), (-0.52, 0.00, 0.08), "shin.L"),
        "upper_leg.R": ((0.17, 0.00, 0.70), (0.25, 0.00, 0.43), "hips"),
        "shin.R": ((0.25, 0.00, 0.43), (0.34, 0.00, 0.13), "upper_leg.R"),
        "foot.R": ((0.34, 0.00, 0.13), (0.52, 0.00, 0.08), "shin.R"),
        "tail.01": ((0.26, 0.02, 0.74), (0.48, 0.02, 0.92), "hips"),
        "tail.02": ((0.48, 0.02, 0.92), (0.72, 0.02, 1.05), "tail.01"),
        "tail.03": ((0.72, 0.02, 1.05), (0.94, 0.02, 1.18), "tail.02"),
    }
    created = {}
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


def bind_to_bone(obj: bpy.types.Object, armature: bpy.types.Object, bone_name: str) -> None:
    group = obj.vertex_groups.new(name=bone_name)
    group.add([vertex.index for vertex in obj.data.vertices], 1.0, "ADD")
    modifier = obj.modifiers.new(name="Fuxie_V9_Armature_Deform", type="ARMATURE")
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
    action = bpy.data.actions.new(f"Fuxie_V9_ImagegenModular_{name}")
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
            (30, 0.022, -0.010, 0.010, 0.10),
            (60, 0.00, 0.00, 0.00, 0.00),
            (90, 0.022, 0.010, -0.010, -0.10),
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
            (12, -0.50, -0.16, -0.03, 0.025),
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
            mouth = 1.0 + (0.06 if phase % 2 else 0.0)
            nod = 0.018 * math.sin(frame * 0.18)
            hand = 0.11 * math.sin(frame * 0.28)
            key_bone(armature, "root", frame, loc=(0, 0, 0.012 if phase % 2 else 0.0))
            key_bone(armature, "head", frame, rot=(0, 0, nod), scale=(1, mouth, 1))
            key_bone(armature, "jaw", frame, scale=(1.0, mouth, 1.0), loc=(0, 0, -0.010 if phase % 2 else 0.0))
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
            (12, -0.018, 0.96, -0.20, 0.20, -0.15),
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
    scene.world = scene.world or bpy.data.worlds.new("Fuxie_V9_ImagegenModular_World")
    scene.world.color = (0.96, 0.985, 1.0)
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "Medium High Contrast"
    bpy.ops.object.light_add(type="AREA", location=(0, -4.2, 4.4))
    light = bpy.context.object
    light.name = "Fuxie_V9_ImagegenModular_KeyLight"
    light.data.energy = 250
    light.data.size = 5.0
    bpy.ops.object.camera_add(location=(0, -5.0, 1.28))
    camera = bpy.context.object
    camera.name = "Fuxie_V9_ImagegenModular_Camera"
    camera.rotation_euler = (Vector((0, 0, 1.28)) - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = 2.85
    scene.camera = camera


def select_collection(collection: bpy.types.Collection) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    for obj in collection.objects:
        obj.select_set(True)
    armature = next((obj for obj in collection.objects if obj.type == "ARMATURE"), None)
    if armature:
        bpy.context.view_layer.objects.active = armature


def export_assets(collection: bpy.types.Collection) -> None:
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
    select_collection(collection)
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

    select_collection(collection)
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


def write_manifest(collection: bpy.types.Collection) -> None:
    meshes = [obj for obj in collection.objects if obj.type == "MESH"]
    armature = next((obj for obj in collection.objects if obj.type == "ARMATURE"), None)
    manifest = {
        "name": "Fuxie_Character_v9_imagegen_modular",
        "status": "imagegen_modular_rig_candidate",
        "source_note": "Assembled from Codex-generated modular Fuxie body-part renders v2. This is a rigged image-plane modular asset for animation QA, not a full reconstructed volumetric 3D sculpt.",
        "source_parts": str(SOURCE_DIR.relative_to(ROOT)).replace("\\", "/"),
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
            "parts": PARTS,
            "fps": bpy.context.scene.render.fps,
            "clips": CLIPS,
        },
        "limits": [
            "The head source already includes ears, so ear bones are present for rig contract but the visible ear motion is mostly carried by the head plane in this first pass.",
            "The model is intentionally lightweight billboard geometry for fast web QA; a later pass can convert approved parts into fuller 3D mesh pieces.",
            "Visual identity depends on the generated part sheet; if a part is rejected, regenerate just that part and rerun this assembler.",
        ],
        "next_step": "QA V9 identity and motion, then regenerate weak parts or proceed to a fuller mesh assembly pass.",
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")


def copy_public_assets() -> None:
    shutil.copy2(GLB_PATH, PUBLIC_GLB_PATH)
    shutil.copy2(PREVIEW_PATH, PUBLIC_POSTER_PATH)
    shutil.copy2(MANIFEST_PATH, PUBLIC_MANIFEST_PATH)


def main() -> None:
    ensure_dirs()
    clear_scene()
    setup_scene()
    collection = make_collection("Fuxie_V9_ImagegenModular_Export")
    armature = create_armature(collection)
    for part in PARTS:
        if part.get("source_only"):
            continue
        obj = create_part_mesh(part, collection)
        bind_to_bone(obj, armature, str(part["bone"]))
    shadow = add_shadow(collection)
    bind_to_bone(shadow, armature, "root")
    animate(armature)
    export_assets(collection)
    write_manifest(collection)
    copy_public_assets()
    print(f"Saved V9 Blender file: {BLEND_PATH}")
    print(f"Exported V9 GLB: {GLB_PATH}")
    print(f"Rendered V9 preview: {PREVIEW_PATH}")


if __name__ == "__main__":
    main()
