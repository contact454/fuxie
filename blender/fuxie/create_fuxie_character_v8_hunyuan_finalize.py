from __future__ import annotations

import json
import math
import shutil
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
BLENDER_DIR = ROOT / "blender" / "fuxie"
HUNYUAN_DIR = BLENDER_DIR / "hunyuan_v8"
CANDIDATE_DIR = HUNYUAN_DIR / "candidates"
MODEL_DIR = ROOT / "assets" / "models"
PUBLIC_LIVE_DIR = ROOT / "apps" / "web" / "public" / "mascot-3d" / "live"

CONFIG_PATH = ROOT / "scripts" / "fuxie-v8" / "fuxie_v8_pipeline_config.json"
DEFAULT_CANDIDATE = CANDIDATE_DIR / "fuxie_hunyuan_v8_selected.glb"

CLEAN_BLEND_PATH = BLENDER_DIR / "Fuxie_Character_v8_hunyuan_clean.blend"
RIG_BLEND_PATH = BLENDER_DIR / "Fuxie_Character_v8_unirig.blend"
ANIMATED_BLEND_PATH = BLENDER_DIR / "Fuxie_Character_v8_hunyuan_animated.blend"
GLB_PATH = MODEL_DIR / "Fuxie_Character_v8_hunyuan_animated.glb"
FBX_PATH = MODEL_DIR / "Fuxie_Character_v8_hunyuan_animated.fbx"
PREVIEW_PATH = BLENDER_DIR / "Fuxie_preview_v8_hunyuan_animated.png"
MANIFEST_PATH = BLENDER_DIR / "Fuxie_Character_v8_hunyuan_animated_manifest.json"
PUBLIC_GLB_PATH = PUBLIC_LIVE_DIR / "fuxie-hunyuan-v8.glb"
PUBLIC_POSTER_PATH = PUBLIC_LIVE_DIR / "fuxie-hunyuan-v8-poster.png"
PUBLIC_MANIFEST_PATH = PUBLIC_LIVE_DIR / "fuxie-hunyuan-v8.json"

TARGET_WEB_VERTICES = 45000
REFERENCE_IMAGE_PATHS = [
    BLENDER_DIR / "references" / "fuxie_ref_front.png",
    BLENDER_DIR / "references" / "fuxie_ref_three_quarter.png",
    BLENDER_DIR / "references" / "fuxie_ref_side.png",
    BLENDER_DIR / "references" / "fuxie_ref_back.png",
    BLENDER_DIR / "references" / "parts" / "fuxie_ref_part_front_head_face.png",
    BLENDER_DIR / "references" / "parts" / "fuxie_ref_part_front_eyes_brows.png",
    BLENDER_DIR / "references" / "parts" / "fuxie_ref_part_front_muzzle_mouth.png",
    BLENDER_DIR / "references" / "parts" / "fuxie_ref_part_front_ears.png",
    BLENDER_DIR / "references" / "parts" / "fuxie_ref_part_front_hoodie_bandana_token.png",
    BLENDER_DIR / "references" / "parts" / "fuxie_ref_part_front_left_hand.png",
    BLENDER_DIR / "references" / "parts" / "fuxie_ref_part_front_shoes.png",
    BLENDER_DIR / "references" / "parts" / "fuxie_ref_part_three_quarter_tail.png",
]

CLIPS = {
    "idle": 120,
    "wave": 96,
    "talk": 120,
    "listen": 120,
    "reward": 96,
    "tryAgain": 120,
}


def clear_scene() -> None:
    if bpy.ops.object.mode_set.poll():
        bpy.ops.object.mode_set(mode="OBJECT")
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def make_collection(name: str) -> bpy.types.Collection:
    collection = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(collection)
    return collection


def link_only(obj: bpy.types.Object, collection: bpy.types.Collection) -> None:
    collection.objects.link(obj)
    for existing in list(obj.users_collection):
        if existing != collection:
            existing.objects.unlink(obj)


def setup_scene() -> None:
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.frame_start = 1
    scene.frame_end = 120
    scene.render.fps = 60
    scene.render.resolution_x = 1200
    scene.render.resolution_y = 1200
    try:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    except TypeError:
        scene.render.engine = "BLENDER_EEVEE"
    scene.world = scene.world or bpy.data.worlds.new("Fuxie_V8_World")
    scene.world.color = (0.965, 0.985, 1.0)
    bpy.ops.object.light_add(type="AREA", location=(0, -4.2, 4.4))
    light = bpy.context.object
    light.name = "Fuxie_V8_KeyLight"
    light.data.energy = 460
    light.data.size = 4.5
    bpy.ops.object.camera_add(location=(0, -5.4, 1.35))
    camera = bpy.context.object
    camera.name = "Fuxie_V8_Camera"
    camera.rotation_euler = (Vector((0, 0, 1.35)) - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = 2.9
    scene.camera = camera


def import_candidate(path: Path, collection: bpy.types.Collection) -> list[bpy.types.Object]:
    if not path.exists():
        raise FileNotFoundError(f"Missing Hunyuan selected candidate: {path}")
    bpy.ops.import_scene.gltf(filepath=str(path))
    imported = list(bpy.context.selected_objects)
    meshes: list[bpy.types.Object] = []
    for obj in imported:
        obj.name = f"Fuxie_V8_{obj.name}"
        link_only(obj, collection)
        if obj.type == "MESH":
            meshes.append(obj)
            obj.data.name = f"{obj.name}_Mesh"
            bpy.context.view_layer.objects.active = obj
            obj.select_set(True)
            try:
                bpy.ops.object.shade_smooth()
            except RuntimeError:
                pass
            obj.select_set(False)
    return meshes


def add_reference_planes(collection: bpy.types.Collection) -> list[str]:
    imported: list[str] = []
    for index, image_path in enumerate(REFERENCE_IMAGE_PATHS):
        if not image_path.exists():
            continue
        col = index % 4
        row = index // 4
        x = -2.1 + col * 1.4
        z = 1.98 - row * 0.72
        bpy.ops.object.empty_add(type="IMAGE", location=(x, 0.72, z))
        empty = bpy.context.object
        empty.name = f"Fuxie_V8_Reference_{image_path.stem}"
        empty.empty_display_size = 0.88 if index < 4 else 0.48
        empty.data = bpy.data.images.load(str(image_path), check_existing=True)
        empty.hide_render = True
        empty.hide_select = True
        link_only(empty, collection)
        imported.append(str(image_path.relative_to(ROOT)).replace("\\", "/"))
    return imported


def assign_runtime_materials(meshes: list[bpy.types.Object]) -> None:
    material = make_material("Fuxie_V8_Hunyuan_Runtime_Material", (0.10, 0.57, 0.68, 1.0), roughness=0.58)
    for obj in meshes:
        if not obj.data.materials:
            obj.data.materials.append(material)


def make_material(name: str, color: tuple[float, float, float, float], roughness: float = 0.5, metallic: float = 0.0) -> bpy.types.Material:
    material = bpy.data.materials.new(name)
    material.diffuse_color = color
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = metallic
    return material


def finish_overlay_object(obj: bpy.types.Object, material: bpy.types.Material, collection: bpy.types.Collection) -> bpy.types.Object:
    obj.name = f"Fuxie_V8_{obj.name}"
    obj.data.name = f"{obj.name}_Mesh"
    obj.data.materials.append(material)
    link_only(obj, collection)
    try:
        bpy.ops.object.shade_smooth()
    except RuntimeError:
        pass
    return obj


def add_ellipsoid(
    collection: bpy.types.Collection,
    name: str,
    location: tuple[float, float, float],
    scale: tuple[float, float, float],
    material: bpy.types.Material,
    segments: int = 32,
    rings: int = 16,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish_overlay_object(obj, material, collection)


def create_identity_overlays(collection: bpy.types.Collection) -> list[bpy.types.Object]:
    cream = make_material("Fuxie_V8_Cream_Fur_Material", (0.96, 0.89, 0.76, 1.0), roughness=0.62)
    eye = make_material("Fuxie_V8_Glossy_Eye_Material", (0.035, 0.06, 0.075, 1.0), roughness=0.18)
    highlight = make_material("Fuxie_V8_Eye_Highlight_Material", (1.0, 1.0, 0.94, 1.0), roughness=0.22)
    nose = make_material("Fuxie_V8_Nose_Mouth_Material", (0.035, 0.08, 0.09, 1.0), roughness=0.38)
    gold = make_material("Fuxie_V8_Fucoin_Gold_Material", (1.0, 0.72, 0.18, 1.0), roughness=0.36, metallic=0.08)
    coin_mark = make_material("Fuxie_V8_Fucoin_Mark_Material", (1.0, 0.96, 0.72, 1.0), roughness=0.42)

    overlays: list[bpy.types.Object] = []
    overlays.append(add_ellipsoid(collection, "Face_Mask", (0.0, -0.62, 1.55), (0.33, 0.040, 0.22), cream))
    overlays.append(add_ellipsoid(collection, "Muzzle", (0.0, -0.66, 1.38), (0.20, 0.035, 0.10), cream))
    overlays.append(add_ellipsoid(collection, "Eye_L", (-0.17, -0.70, 1.60), (0.065, 0.020, 0.092), eye, 24, 12))
    overlays.append(add_ellipsoid(collection, "Eye_R", (0.17, -0.70, 1.60), (0.065, 0.020, 0.092), eye, 24, 12))
    overlays.append(add_ellipsoid(collection, "Eye_Highlight_L", (-0.145, -0.722, 1.635), (0.020, 0.008, 0.024), highlight, 16, 8))
    overlays.append(add_ellipsoid(collection, "Eye_Highlight_R", (0.195, -0.722, 1.635), (0.020, 0.008, 0.024), highlight, 16, 8))
    overlays.append(add_ellipsoid(collection, "Nose", (0.0, -0.715, 1.44), (0.055, 0.025, 0.042), nose, 20, 10))
    overlays.append(add_ellipsoid(collection, "Mouth_Shadow", (0.0, -0.695, 1.31), (0.080, 0.016, 0.038), nose, 20, 10))
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=0.13, depth=0.026, location=(0.0, -0.64, 0.93), rotation=(math.pi / 2, 0, 0))
    token = bpy.context.object
    token.name = "Fucoin_Token"
    overlays.append(finish_overlay_object(token, gold, collection))

    bpy.ops.object.text_add(location=(0.0, -0.657, 0.892), rotation=(math.pi / 2, 0, 0))
    mark = bpy.context.object
    mark.name = "Fucoin_F_Mark"
    mark.data.body = "F"
    mark.data.align_x = "CENTER"
    mark.data.align_y = "CENTER"
    mark.data.size = 0.17
    mark.data.extrude = 0.002
    bpy.ops.object.convert(target="MESH")
    overlays.append(finish_overlay_object(bpy.context.object, coin_mark, collection))

    return overlays


def cleanup_meshes(meshes: list[bpy.types.Object]) -> dict[str, float | int]:
    before_vertices = sum(len(obj.data.vertices) for obj in meshes)
    before_faces = sum(len(obj.data.polygons) for obj in meshes)
    decimate_ratio = 1.0
    if before_vertices > TARGET_WEB_VERTICES:
        decimate_ratio = max(0.05, TARGET_WEB_VERTICES / before_vertices)

    for obj in meshes:
        bpy.ops.object.select_all(action="DESELECT")
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        if before_vertices > TARGET_WEB_VERTICES and len(obj.data.vertices) > 1500:
            modifier = obj.modifiers.new(name="Fuxie_V8_Web_Budget_Decimate", type="DECIMATE")
            modifier.ratio = decimate_ratio
            modifier.use_collapse_triangulate = True
            try:
                bpy.ops.object.modifier_apply(modifier=modifier.name)
            except RuntimeError:
                obj.modifiers.remove(modifier)
        try:
            bpy.ops.object.mode_set(mode="EDIT")
            bpy.ops.mesh.select_all(action="SELECT")
            bpy.ops.mesh.normals_make_consistent(inside=False)
            bpy.ops.object.mode_set(mode="OBJECT")
        except RuntimeError:
            if bpy.ops.object.mode_set.poll():
                bpy.ops.object.mode_set(mode="OBJECT")
        try:
            bpy.ops.object.shade_smooth()
        except RuntimeError:
            pass
        obj.select_set(False)

    assign_runtime_materials(meshes)
    after_vertices = sum(len(obj.data.vertices) for obj in meshes)
    after_faces = sum(len(obj.data.polygons) for obj in meshes)
    return {
        "target_vertices": TARGET_WEB_VERTICES,
        "decimate_ratio": round(decimate_ratio, 4),
        "vertices_before_cleanup": before_vertices,
        "faces_before_cleanup": before_faces,
        "vertices_after_cleanup": after_vertices,
        "faces_after_cleanup": after_faces,
    }


def normalize_meshes(meshes: list[bpy.types.Object]) -> None:
    if not meshes:
        raise RuntimeError("No mesh objects found in selected Hunyuan candidate")
    min_corner = Vector((math.inf, math.inf, math.inf))
    max_corner = Vector((-math.inf, -math.inf, -math.inf))
    for obj in meshes:
        for corner in obj.bound_box:
            world = obj.matrix_world @ Vector(corner)
            min_corner.x = min(min_corner.x, world.x)
            min_corner.y = min(min_corner.y, world.y)
            min_corner.z = min(min_corner.z, world.z)
            max_corner.x = max(max_corner.x, world.x)
            max_corner.y = max(max_corner.y, world.y)
            max_corner.z = max(max_corner.z, world.z)
    center = (min_corner + max_corner) * 0.5
    size = max_corner - min_corner
    scale = 2.35 / max(size.x, size.y, size.z)
    for obj in meshes:
        obj.location = (obj.location - center) * scale
        obj.scale = tuple(value * scale for value in obj.scale)
        obj.location.z += 1.18
        obj.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    bpy.ops.object.select_all(action="DESELECT")


def create_fallback_armature(collection: bpy.types.Collection) -> bpy.types.Object:
    bpy.ops.object.armature_add(enter_editmode=True, location=(0, 0, 0))
    armature = bpy.context.object
    armature.name = "Fuxie_V8_UniRig_Armature"
    armature.data.name = "Fuxie_V8_UniRig_Skeleton"
    armature.show_in_front = True
    link_only(armature, collection)
    bones = armature.data.edit_bones
    bones.remove(bones[0])
    specs = {
        "root": ((0, 0, 0.05), (0, 0, 0.35), None),
        "hips": ((0, 0, 0.62), (0, 0, 0.92), "root"),
        "spine": ((0, 0, 0.92), (0, 0, 1.22), "hips"),
        "chest": ((0, 0, 1.22), (0, 0, 1.47), "spine"),
        "neck": ((0, 0, 1.47), (0, 0, 1.62), "chest"),
        "head": ((0, 0, 1.62), (0, 0, 2.12), "neck"),
        "jaw": ((0, -0.16, 1.66), (0, -0.17, 1.52), "head"),
        "ear.L": ((-0.34, 0, 2.05), (-0.58, 0, 2.58), "head"),
        "ear.R": ((0.34, 0, 2.05), (0.58, 0, 2.58), "head"),
        "upper_arm.L": ((-0.34, 0, 1.27), (-0.56, 0, 1.03), "chest"),
        "forearm.L": ((-0.56, 0, 1.03), (-0.68, 0, 0.72), "upper_arm.L"),
        "hand.L": ((-0.68, 0, 0.72), (-0.72, 0, 0.56), "forearm.L"),
        "upper_arm.R": ((0.34, 0, 1.27), (0.56, 0, 1.03), "chest"),
        "forearm.R": ((0.56, 0, 1.03), (0.68, 0, 0.72), "upper_arm.R"),
        "hand.R": ((0.68, 0, 0.72), (0.72, 0, 0.56), "forearm.R"),
        "upper_leg.L": ((-0.17, 0, 0.65), (-0.24, 0, 0.38), "hips"),
        "shin.L": ((-0.24, 0, 0.38), (-0.28, 0, 0.16), "upper_leg.L"),
        "foot.L": ((-0.28, -0.06, 0.16), (-0.42, -0.24, 0.10), "shin.L"),
        "upper_leg.R": ((0.17, 0, 0.65), (0.24, 0, 0.38), "hips"),
        "shin.R": ((0.24, 0, 0.38), (0.28, 0, 0.16), "upper_leg.R"),
        "foot.R": ((0.28, -0.06, 0.16), (0.42, -0.24, 0.10), "shin.R"),
        "tail.01": ((0.30, 0.10, 0.82), (0.58, 0.12, 1.02), "hips"),
        "tail.02": ((0.58, 0.12, 1.02), (0.80, 0.10, 1.22), "tail.01"),
        "tail.03": ((0.80, 0.10, 1.22), (0.98, 0.08, 1.38), "tail.02"),
    }
    created = {}
    for name, (head, tail, parent) in specs.items():
        bone = bones.new(name)
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


def bind_meshes(meshes: list[bpy.types.Object], armature: bpy.types.Object) -> None:
    for obj in meshes:
        modifier = obj.modifiers.new(name="Fuxie_V8_Armature_Deform", type="ARMATURE")
        modifier.object = armature
        group = obj.vertex_groups.new(name="root")
        group.add([vertex.index for vertex in obj.data.vertices], 1.0, "ADD")
        obj.parent = armature


def key_bone(armature: bpy.types.Object, bone_name: str, frame: int, loc=None, rot=None, scale=None) -> None:
    if bone_name not in armature.pose.bones:
        return
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
    armature.animation_data_create().action = bpy.data.actions.new(f"Fuxie_V8_{name}")
    reset_pose(armature, 1)
    animator()
    reset_pose(armature, frames)
    stash_action(armature, name, armature.animation_data.action, frames)
    armature.animation_data.action = None


def animate(armature: bpy.types.Object) -> None:
    make_clip(armature, "idle", 120, lambda: [
        key_bone(armature, "root", frame, loc=(0, 0, lift), scale=(1, 1 + lift * 0.55, 1))
        for frame, lift in [(1, 0), (30, 0.025), (60, 0), (90, 0.025), (120, 0)]
    ])
    make_clip(armature, "wave", 96, lambda: [
        key_bone(armature, "forearm.L", frame, rot=(0, 0, value))
        for frame, value in [(1, 0), (24, -1.25), (36, -0.72), (48, -1.28), (72, -0.78), (96, 0)]
    ])
    make_clip(armature, "talk", 120, lambda: [
        key_bone(armature, "jaw", frame, scale=(1, 1.25 if frame % 16 else 1, 1), loc=(0, -0.01 if frame % 16 else 0, -0.012 if frame % 16 else 0))
        for frame in range(1, 121, 8)
    ])
    make_clip(armature, "listen", 120, lambda: [
        key_bone(armature, "head", frame, rot=(0, 0, tilt))
        for frame, tilt in [(1, 0), (25, -0.12), (60, -0.18), (95, -0.12), (120, 0)]
    ])
    make_clip(armature, "reward", 96, lambda: [
        key_bone(armature, "root", frame, loc=(0, 0, lift), scale=(1 / squash, squash, 1))
        for frame, lift, squash in [(1, 0, 1), (12, -0.02, 0.95), (24, 0.15, 1.09), (36, 0.03, 0.98), (48, 0.12, 1.07), (96, 0, 1)]
    ])
    make_clip(armature, "tryAgain", 120, lambda: [
        key_bone(armature, "head", frame, rot=(0, 0, nod))
        for frame, nod in [(1, 0), (30, 0.055), (60, -0.035), (90, 0.045), (120, 0)]
    ])


def export_assets(collection: bpy.types.Collection) -> None:
    bpy.ops.wm.save_as_mainfile(filepath=str(ANIMATED_BLEND_PATH))
    bpy.ops.object.select_all(action="DESELECT")
    for obj in collection.objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = next((obj for obj in collection.objects if obj.type == "ARMATURE"), None)
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
    bpy.context.scene.render.image_settings.file_format = "PNG"
    bpy.context.scene.render.filepath = str(PREVIEW_PATH)
    bpy.ops.render.render(write_still=True)


def write_manifest(
    meshes: list[bpy.types.Object],
    armature: bpy.types.Object,
    candidate: Path,
    cleanup_stats: dict[str, float | int],
    reference_images: list[str],
) -> None:
    manifest = {
        "name": "Fuxie_Character_v8_hunyuan_animated",
        "status": "hunyuan_unirig_pipeline_output",
        "source_note": "Generated approximation from Fuxie 3D render references; not a recovered original source mesh.",
        "selected_candidate": str(candidate.relative_to(ROOT)).replace("\\", "/"),
        "reference_images": reference_images,
        "outputs": {
            "animated_blend": str(ANIMATED_BLEND_PATH.relative_to(ROOT)).replace("\\", "/"),
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
            "cleanup": cleanup_stats,
            "bones": [bone.name for bone in armature.data.bones],
            "fps": bpy.context.scene.render.fps,
            "clips": CLIPS,
        },
        "limits": [
            "UniRig output may require manual weight-paint polish for production deformation.",
            "If vertex count exceeds the web budget, create a dedicated LOD/web GLB before rollout.",
        ],
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")


def copy_public_assets() -> None:
    shutil.copy2(GLB_PATH, PUBLIC_GLB_PATH)
    shutil.copy2(PREVIEW_PATH, PUBLIC_POSTER_PATH)
    shutil.copy2(MANIFEST_PATH, PUBLIC_MANIFEST_PATH)


def main() -> None:
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_LIVE_DIR.mkdir(parents=True, exist_ok=True)
    candidate = Path(bpy.app.driver_namespace.get("fuxie_v8_candidate", DEFAULT_CANDIDATE))
    clear_scene()
    setup_scene()
    collection = make_collection("Fuxie_V8_Hunyuan_Export")
    reference_collection = make_collection("Fuxie_V8_Image_References_Not_Exported")
    reference_images = add_reference_planes(reference_collection)
    meshes = import_candidate(candidate, collection)
    normalize_meshes(meshes)
    cleanup_stats = cleanup_meshes(meshes)
    identity_overlays = create_identity_overlays(collection)
    export_meshes = meshes + identity_overlays
    bpy.ops.wm.save_as_mainfile(filepath=str(CLEAN_BLEND_PATH))
    armature = create_fallback_armature(collection)
    bind_meshes(export_meshes, armature)
    bpy.ops.wm.save_as_mainfile(filepath=str(RIG_BLEND_PATH))
    animate(armature)
    export_assets(collection)
    write_manifest(export_meshes, armature, candidate, cleanup_stats, reference_images)
    copy_public_assets()
    print(f"Exported Fuxie V8 animated GLB: {GLB_PATH}")


if __name__ == "__main__":
    main()
