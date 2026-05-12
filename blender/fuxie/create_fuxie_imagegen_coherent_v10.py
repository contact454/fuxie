from __future__ import annotations

import json
import math
import shutil
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
BLENDER_DIR = ROOT / "blender" / "fuxie"
LAYER_DIR = BLENDER_DIR / "generated" / "v10_layers"
SOURCE_PATH = BLENDER_DIR / "imagegen_fullbody" / "v10" / "fuxie_imagegen_fullbody_v10_source.png"
MODEL_DIR = ROOT / "assets" / "models"
PUBLIC_LIVE_DIR = ROOT / "apps" / "web" / "public" / "mascot-3d" / "live"

BLEND_PATH = BLENDER_DIR / "Fuxie_Character_v10_imagegen_coherent.blend"
GLB_PATH = MODEL_DIR / "Fuxie_Character_v10_imagegen_coherent.glb"
FBX_PATH = MODEL_DIR / "Fuxie_Character_v10_imagegen_coherent.fbx"
PREVIEW_PATH = BLENDER_DIR / "Fuxie_preview_v10_imagegen_coherent.png"
MANIFEST_PATH = BLENDER_DIR / "Fuxie_Character_v10_imagegen_coherent_manifest.json"
PUBLIC_GLB_PATH = PUBLIC_LIVE_DIR / "fuxie-imagegen-coherent-v10.glb"
PUBLIC_POSTER_PATH = PUBLIC_LIVE_DIR / "fuxie-imagegen-coherent-v10-poster.png"
PUBLIC_MANIFEST_PATH = PUBLIC_LIVE_DIR / "fuxie-imagegen-coherent-v10.json"

SOURCE_WIDTH = 1024
SOURCE_HEIGHT = 1536
WORLD_HEIGHT = 2.95
SCALE = WORLD_HEIGHT / SOURCE_HEIGHT

CLIPS = {
    "idle": {"frames": 120, "description": "Subtle 60fps breathing, head bob, and tail sway from coherent V10 layers."},
    "wave": {"frames": 96, "description": "Soft arm wave with body bounce while preserving coherent full-body target."},
    "talk": {"frames": 120, "description": "Head nod and subtle head squash for talk loop."},
    "listen": {"frames": 120, "description": "Head tilt, ear focus, and tail attention motion."},
    "reward": {"frames": 96, "description": "Happy hop with arm lift and tail wag."},
    "tryAgain": {"frames": 120, "description": "Gentle encouraging nod and small hand motion."},
}

PARTS = [
    {"name": "Fuxie_V10_Tail", "bone": "tail.02", "image": "Fuxie_V10_Tail.png", "rect": (650, 810, 960, 1258), "layer": 0.056, "order": 0},
    {"name": "Fuxie_V10_Leg_L", "bone": "shin.L", "image": "Fuxie_V10_Leg_L.png", "rect": (230, 1038, 500, 1438), "layer": 0.020, "order": 1},
    {"name": "Fuxie_V10_Leg_R", "bone": "shin.R", "image": "Fuxie_V10_Leg_R.png", "rect": (510, 1038, 815, 1445), "layer": 0.018, "order": 1},
    {"name": "Fuxie_V10_Body_Hoodie", "bone": "chest", "image": "Fuxie_V10_Body_Hoodie.png", "rect": (175, 590, 842, 1145), "layer": -0.005, "order": 2},
    {"name": "Fuxie_V10_Arm_L", "bone": "forearm.L", "image": "Fuxie_V10_Arm_L.png", "rect": (150, 600, 390, 1125), "layer": -0.030, "order": 3},
    {"name": "Fuxie_V10_Arm_R", "bone": "forearm.R", "image": "Fuxie_V10_Arm_R.png", "rect": (675, 600, 858, 1125), "layer": -0.032, "order": 3},
    {"name": "Fuxie_V10_Head", "bone": "head", "image": "Fuxie_V10_Head.png", "rect": (130, 70, 875, 760), "layer": -0.055, "order": 4},
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


def rect_to_world(rect: tuple[int, int, int, int]) -> tuple[float, float, float, float]:
    x0, y0, x1, y1 = rect
    left, top = pixel_to_world(x0, y0)
    right, bottom = pixel_to_world(x1, y1)
    return left, right, bottom, top


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
    tex = nodes.new("ShaderNodeTexImage")
    tex.image = bpy.data.images.load(str(image_path), check_existing=True)
    tex.image.alpha_mode = "STRAIGHT"
    tex.extension = "CLIP"
    if bsdf:
        material.node_tree.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
        material.node_tree.links.new(tex.outputs["Alpha"], bsdf.inputs["Alpha"])
        bsdf.inputs["Roughness"].default_value = 0.78
        if "Metallic" in bsdf.inputs:
            bsdf.inputs["Metallic"].default_value = 0
    return material


def solid_material(name: str, color: tuple[float, float, float, float]) -> bpy.types.Material:
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    material.blend_method = "BLEND"
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Alpha"].default_value = color[3]
        bsdf.inputs["Roughness"].default_value = 0.86
    return material


def create_part_mesh(part: dict[str, object], collection: bpy.types.Collection) -> bpy.types.Object:
    rect = part["rect"]
    assert isinstance(rect, tuple)
    y = float(part["layer"])
    left, right, bottom, top = rect_to_world(rect)
    mesh = bpy.data.meshes.new(f"{part['name']}_Mesh")
    mesh.from_pydata([(left, y, bottom), (right, y, bottom), (right, y, top), (left, y, top)], [], [(0, 1, 2, 3)])
    mesh.update()
    uv_layer = mesh.uv_layers.new(name="Fuxie_V10_CoherentUV")
    uv_values = [(0, 0), (1, 0), (1, 1), (0, 1)]
    for polygon in mesh.polygons:
        for loop_index in polygon.loop_indices:
            uv_layer.data[loop_index].uv = uv_values[mesh.loops[loop_index].vertex_index]
    obj = bpy.data.objects.new(str(part["name"]), mesh)
    image_path = LAYER_DIR / str(part["image"])
    obj.data.materials.append(image_material(f"{part['name']}_Material", image_path))
    obj["fuxie_source_image"] = str(image_path.relative_to(ROOT)).replace("\\", "/")
    obj["fuxie_source_note"] = "Segmented from one coherent Codex imagegen full-body Fuxie V10 render"
    collection.objects.link(obj)
    return obj


def add_shadow(collection: bpy.types.Collection) -> bpy.types.Object:
    material = solid_material("Fuxie_V10_SoftShadow_Material", (0.04, 0.15, 0.22, 0.18))
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=12, location=(0, 0.085, 0.055), scale=(0.78, 0.08, 0.030))
    obj = bpy.context.object
    obj.name = "Fuxie_V10_Shadow"
    obj.data.name = "Fuxie_V10_Shadow_Mesh"
    obj.data.materials.append(material)
    link_only(obj, collection)
    return obj


def add_reference_plane(collection: bpy.types.Collection) -> None:
    if not SOURCE_PATH.exists():
        return
    height = WORLD_HEIGHT
    width = height * SOURCE_WIDTH / SOURCE_HEIGHT
    mesh = bpy.data.meshes.new("Fuxie_V10_SourceReference_Mesh")
    verts = [(-width / 2, 0, 0), (width / 2, 0, 0), (width / 2, 0, height), (-width / 2, 0, height)]
    mesh.from_pydata(verts, [], [(0, 1, 2, 3)])
    mesh.update()
    uv_layer = mesh.uv_layers.new(name="ReferenceUV")
    for polygon in mesh.polygons:
        for loop_index in polygon.loop_indices:
            uv_layer.data[loop_index].uv = [(0, 0), (1, 0), (1, 1), (0, 1)][mesh.loops[loop_index].vertex_index]
    obj = bpy.data.objects.new("Fuxie_V10_SourceReference", mesh)
    obj.location = (2.4, 0.28, 0)
    obj.hide_render = True
    obj.hide_viewport = True
    obj.data.materials.append(image_material("Fuxie_V10_SourceReference_Material", SOURCE_PATH))
    collection.objects.link(obj)


def create_armature(collection: bpy.types.Collection) -> bpy.types.Object:
    bpy.ops.object.armature_add(enter_editmode=True, location=(0, 0, 0))
    armature = bpy.context.object
    armature.name = "Fuxie_V10_ImagegenCoherent_Armature"
    armature.data.name = "Fuxie_V10_ImagegenCoherent_Skeleton"
    armature.show_in_front = True
    link_only(armature, collection)
    edit_bones = armature.data.edit_bones
    edit_bones.remove(edit_bones[0])
    specs = {
        "root": ((0, 0, 0.05), (0, 0, 0.30), None),
        "hips": ((0, 0, 0.58), (0, 0, 0.88), "root"),
        "spine": ((0, 0, 0.88), (0, 0, 1.26), "hips"),
        "chest": ((0, 0, 1.26), (0, 0, 1.55), "spine"),
        "neck": ((0, 0, 1.55), (0, 0, 1.68), "chest"),
        "head": ((0, 0, 1.68), (0, 0, 2.36), "neck"),
        "jaw": ((0, -0.01, 1.82), (0, -0.01, 1.64), "head"),
        "ear.L.01": ((-0.38, 0, 2.15), (-0.58, 0, 2.58), "head"),
        "ear.R.01": ((0.38, 0, 2.15), (0.58, 0, 2.58), "head"),
        "upper_arm.L": ((-0.34, 0, 1.32), (-0.54, 0, 1.10), "chest"),
        "forearm.L": ((-0.54, 0, 1.10), (-0.75, 0, 0.70), "upper_arm.L"),
        "hand.L": ((-0.75, 0, 0.70), (-0.82, 0, 0.55), "forearm.L"),
        "upper_arm.R": ((0.34, 0, 1.32), (0.54, 0, 1.10), "chest"),
        "forearm.R": ((0.54, 0, 1.10), (0.75, 0, 0.70), "upper_arm.R"),
        "hand.R": ((0.75, 0, 0.70), (0.82, 0, 0.55), "forearm.R"),
        "upper_leg.L": ((-0.18, 0, 0.72), (-0.27, 0, 0.44), "hips"),
        "shin.L": ((-0.27, 0, 0.44), (-0.35, 0, 0.12), "upper_leg.L"),
        "foot.L": ((-0.35, 0, 0.12), (-0.50, 0, 0.08), "shin.L"),
        "upper_leg.R": ((0.18, 0, 0.72), (0.27, 0, 0.44), "hips"),
        "shin.R": ((0.27, 0, 0.44), (0.35, 0, 0.12), "upper_leg.R"),
        "foot.R": ((0.35, 0, 0.12), (0.50, 0, 0.08), "shin.R"),
        "tail.01": ((0.28, 0.02, 0.80), (0.52, 0.02, 0.95), "hips"),
        "tail.02": ((0.52, 0.02, 0.95), (0.74, 0.02, 1.08), "tail.01"),
        "tail.03": ((0.74, 0.02, 1.08), (0.96, 0.02, 1.22), "tail.02"),
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
    modifier = obj.modifiers.new(name="Fuxie_V10_Armature_Deform", type="ARMATURE")
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
    action = bpy.data.actions.new(f"Fuxie_V10_ImagegenCoherent_{name}")
    armature.animation_data_create().action = action
    reset_pose(armature, 1)
    animator()
    reset_pose(armature, frames)
    stash_action(armature, name, action, frames)
    armature.animation_data.action = None


def animate(armature: bpy.types.Object) -> None:
    def idle() -> None:
        for frame, lift, tilt, head, tail in [(1, 0, 0, 0, 0), (30, 0.018, -0.006, 0.008, 0.07), (60, 0, 0, 0, 0), (90, 0.018, 0.006, -0.008, -0.07), (120, 0, 0, 0, 0)]:
            key_bone(armature, "root", frame, loc=(0, 0, lift), rot=(0, 0, tilt), scale=(1, 1 + lift * 0.35, 1))
            key_bone(armature, "head", frame, rot=(0, 0, head))
            key_bone(armature, "tail.02", frame, rot=(0, 0, tail))

    def wave() -> None:
        for frame, arm, hand, body, lift in [(1, 0, 0, 0, 0), (16, -0.40, -0.10, -0.02, 0.020), (32, -0.78, 0.30, 0.018, 0.040), (48, -0.62, -0.24, -0.018, 0.018), (64, -0.82, 0.34, 0.022, 0.040), (96, 0, 0, 0, 0)]:
            key_bone(armature, "root", frame, loc=(0, 0, lift), rot=(0, 0, body))
            key_bone(armature, "forearm.L", frame, rot=(0, 0, arm))
            key_bone(armature, "hand.L", frame, rot=(0, 0, hand))
            key_bone(armature, "head", frame, rot=(0, 0, -body * 0.5))
            key_bone(armature, "tail.02", frame, rot=(0, 0, -body * 2.2))

    def talk() -> None:
        for frame in range(1, 121, 8):
            phase = frame // 8
            squash = 1.0 + (0.025 if phase % 2 else 0)
            key_bone(armature, "head", frame, rot=(0, 0, 0.014 * math.sin(frame * 0.18)), scale=(1.0, squash, 1.0))
            key_bone(armature, "forearm.R", frame, rot=(0, 0, 0.08 * math.sin(frame * 0.28)))

    def listen() -> None:
        for frame, tilt, tail in [(1, 0, 0), (25, -0.10, 0.05), (60, -0.14, -0.04), (95, -0.10, 0.05), (120, 0, 0)]:
            key_bone(armature, "head", frame, rot=(0, 0, tilt))
            key_bone(armature, "chest", frame, rot=(0, 0, tilt * 0.18))
            key_bone(armature, "tail.02", frame, rot=(0, 0, tail))

    def reward() -> None:
        for frame, lift, squash, arm_l, arm_r, tail in [(1, 0, 1, 0, 0, 0), (12, -0.012, 0.97, -0.16, 0.16, -0.10), (24, 0.090, 1.06, -0.70, 0.70, 0.22), (48, 0.070, 1.04, -0.78, 0.78, -0.24), (72, 0.020, 1.0, -0.28, 0.28, 0.10), (96, 0, 1, 0, 0, 0)]:
            key_bone(armature, "root", frame, loc=(0, 0, lift), scale=(1 / squash, squash, 1))
            key_bone(armature, "forearm.L", frame, rot=(0, 0, arm_l))
            key_bone(armature, "forearm.R", frame, rot=(0, 0, arm_r))
            key_bone(armature, "tail.02", frame, rot=(0, 0, tail))

    def try_again() -> None:
        for frame, nod, hand, tail in [(1, 0, 0, 0), (30, 0.035, -0.10, 0.04), (60, -0.025, 0.08, -0.03), (90, 0.030, -0.08, 0.03), (120, 0, 0, 0)]:
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
    scene.world = scene.world or bpy.data.worlds.new("Fuxie_V10_ImagegenCoherent_World")
    scene.world.color = (0.96, 0.985, 1.0)
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "Medium High Contrast"
    bpy.ops.object.light_add(type="AREA", location=(0, -4.2, 4.4))
    light = bpy.context.object
    light.name = "Fuxie_V10_ImagegenCoherent_KeyLight"
    light.data.energy = 230
    light.data.size = 5.0
    bpy.ops.object.camera_add(location=(0, -5.0, 1.40))
    camera = bpy.context.object
    camera.name = "Fuxie_V10_ImagegenCoherent_Camera"
    camera.rotation_euler = (Vector((0, 0, 1.40)) - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = 3.04
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
    gltf_kwargs = {"filepath": str(GLB_PATH), "export_format": "GLB", "use_selection": True, "export_yup": True, "export_animations": True, "export_skins": True}
    if "export_animation_mode" in props:
        gltf_kwargs["export_animation_mode"] = "NLA_TRACKS"
    if "export_nla_strips" in props:
        gltf_kwargs["export_nla_strips"] = True
    if "export_force_sampling" in props:
        gltf_kwargs["export_force_sampling"] = True
    bpy.ops.export_scene.gltf(**gltf_kwargs)
    select_collection(collection)
    bpy.ops.export_scene.fbx(filepath=str(FBX_PATH), use_selection=True, object_types={"ARMATURE", "MESH"}, add_leaf_bones=False, bake_anim=True, bake_anim_use_nla_strips=True, bake_anim_use_all_actions=False, apply_unit_scale=True)
    bpy.context.scene.frame_set(1)
    bpy.context.scene.render.image_settings.file_format = "PNG"
    bpy.context.scene.render.filepath = str(PREVIEW_PATH)
    bpy.ops.render.render(write_still=True)


def write_manifest(collection: bpy.types.Collection) -> None:
    meshes = [obj for obj in collection.objects if obj.type == "MESH"]
    armature = next((obj for obj in collection.objects if obj.type == "ARMATURE"), None)
    manifest = {
        "name": "Fuxie_Character_v10_imagegen_coherent",
        "status": "coherent_imagegen_layered_rig_candidate",
        "source_note": "Built from one coherent Codex-generated full-body Fuxie render, then segmented into aligned layers to reduce the rough modular seam look from V9.",
        "source_fullbody": str(SOURCE_PATH.relative_to(ROOT)).replace("\\", "/"),
        "source_layers": str(LAYER_DIR.relative_to(ROOT)).replace("\\", "/"),
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
            "Still a layered image-plane rig, not a full volumetric 3D mesh.",
            "Motion is intentionally subtle to preserve the coherent target and avoid exposing seams.",
            "If this identity is approved, the next production step is curved-card deformation or true mesh reconstruction from the coherent target.",
        ],
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
    collection = make_collection("Fuxie_V10_ImagegenCoherent_Export")
    reference_collection = make_collection("Fuxie_V10_ImagegenCoherent_Reference")
    add_reference_plane(reference_collection)
    armature = create_armature(collection)
    for part in PARTS:
        obj = create_part_mesh(part, collection)
        bind_to_bone(obj, armature, str(part["bone"]))
    shadow = add_shadow(collection)
    bind_to_bone(shadow, armature, "root")
    animate(armature)
    export_assets(collection)
    write_manifest(collection)
    copy_public_assets()
    print(f"Saved V10 Blender file: {BLEND_PATH}")
    print(f"Exported V10 GLB: {GLB_PATH}")
    print(f"Rendered V10 preview: {PREVIEW_PATH}")


if __name__ == "__main__":
    main()
