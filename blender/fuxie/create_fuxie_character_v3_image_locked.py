from __future__ import annotations

import json
import math
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
BLENDER_DIR = ROOT / "blender" / "fuxie"
REFERENCE_DIR = BLENDER_DIR / "references"
MODEL_DIR = ROOT / "assets" / "models"

FRONT_CUTOUT = REFERENCE_DIR / "fuxie_ref_front_cutout.png"
FRONT_REFERENCE = REFERENCE_DIR / "fuxie_ref_front.png"
THREE_QUARTER_REFERENCE = REFERENCE_DIR / "fuxie_ref_three_quarter.png"
SIDE_REFERENCE = REFERENCE_DIR / "fuxie_ref_side.png"
BACK_REFERENCE = REFERENCE_DIR / "fuxie_ref_back.png"
FACES_REFERENCE = REFERENCE_DIR / "fuxie_ref_faces.png"
TAIL_REFERENCE = REFERENCE_DIR / "fuxie_ref_tail_material.png"

BLEND_PATH = BLENDER_DIR / "Fuxie_Character_v3_image_locked.blend"
GLB_PATH = MODEL_DIR / "Fuxie_Character_v3_image_locked.glb"
FBX_PATH = MODEL_DIR / "Fuxie_Character_v3_image_locked.fbx"
PREVIEW_PATH = BLENDER_DIR / "Fuxie_preview_v3_image_locked.png"
MANIFEST_PATH = BLENDER_DIR / "Fuxie_Character_v3_image_locked_manifest.json"

CLIPS = {
    "idle": {"frames": 120, "description": "Image-locked 60fps breathing proxy from approved Fuxie render."},
    "wave": {"frames": 90, "description": "Image-locked mascot wave proxy; used only to validate runtime identity."},
    "talk": {"frames": 120, "description": "Image-locked talk bounce proxy; production mouth rig remains future work."},
}


def ensure_dirs() -> None:
    BLENDER_DIR.mkdir(parents=True, exist_ok=True)
    MODEL_DIR.mkdir(parents=True, exist_ok=True)


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


def image_material(name: str, image_path: Path, alpha: bool = True) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.blend_method = "BLEND" if alpha else "OPAQUE"
    mat.use_screen_refraction = False
    mat.show_transparent_back = True

    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    image_node = nodes.new("ShaderNodeTexImage")
    image_node.image = bpy.data.images.load(str(image_path), check_existing=True)
    image_node.extension = "CLIP"
    if bsdf:
        mat.node_tree.links.new(image_node.outputs["Color"], bsdf.inputs["Base Color"])
        if alpha and "Alpha" in image_node.outputs and "Alpha" in bsdf.inputs:
            mat.node_tree.links.new(image_node.outputs["Alpha"], bsdf.inputs["Alpha"])
        if "Roughness" in bsdf.inputs:
            bsdf.inputs["Roughness"].default_value = 0.72
    return mat


def solid_material(name: str, color: tuple[float, float, float, float]) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Roughness"].default_value = 0.76
    return mat


def add_image_plane(
    name: str,
    image_path: Path,
    height: float,
    loc: tuple[float, float, float],
    collection: bpy.types.Collection,
    alpha: bool = True,
    hide_render: bool = False,
) -> bpy.types.Object:
    image = bpy.data.images.load(str(image_path), check_existing=True)
    width_px, height_px = image.size
    width = height * (width_px / height_px)
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    verts = [
        (-width / 2, 0, 0),
        (width / 2, 0, 0),
        (width / 2, 0, height),
        (-width / 2, 0, height),
    ]
    faces = [(0, 1, 2, 3)]
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    uv = mesh.uv_layers.new(name="Fuxie_Image_UV")
    coords = [(0, 0), (1, 0), (1, 1), (0, 1)]
    for poly in mesh.polygons:
        for loop_index in poly.loop_indices:
            uv.data[loop_index].uv = coords[mesh.loops[loop_index].vertex_index]
    obj = bpy.data.objects.new(name, mesh)
    obj.location = loc
    obj.data.materials.append(image_material(f"{name}_Material", image_path, alpha=alpha))
    collection.objects.link(obj)
    obj.hide_render = hide_render
    return obj


def add_shadow(collection: bpy.types.Collection) -> bpy.types.Object:
    mat = solid_material("Fuxie_V3_Soft_Ground_Shadow", (0.06, 0.20, 0.28, 0.24))
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=12, location=(0.0, -0.055, 0.02), scale=(0.78, 0.12, 0.035))
    shadow = bpy.context.object
    shadow.name = "Fuxie_ImageLocked_SoftShadow"
    shadow.data.name = "Fuxie_ImageLocked_SoftShadow_Mesh"
    shadow.data.materials.append(mat)
    link_only(shadow, collection)
    return shadow


def create_armature(collection: bpy.types.Collection) -> bpy.types.Object:
    bpy.ops.object.armature_add(enter_editmode=True, location=(0, 0, 0))
    armature = bpy.context.object
    armature.name = "Fuxie_ImageLocked_Armature"
    armature.data.name = "Fuxie_ImageLocked_GameReady_Skeleton"
    armature.show_in_front = True
    link_only(armature, collection)

    edit_bones = armature.data.edit_bones
    edit_bones.remove(edit_bones[0])
    specs = {
        "root": ((0, 0, 0.05), (0, 0, 0.36), None),
        "hips": ((0, 0, 0.66), (0, 0, 1.02), "root"),
        "spine": ((0, 0, 1.02), (0, 0, 1.32), "hips"),
        "chest": ((0, 0, 1.32), (0, 0, 1.52), "spine"),
        "neck": ((0, 0, 1.52), (0, 0, 1.72), "chest"),
        "head": ((0, 0, 1.72), (0, 0, 2.32), "neck"),
        "ear.L": ((-0.28, 0, 2.10), (-0.54, 0, 2.66), "head"),
        "ear.R": ((0.28, 0, 2.10), (0.54, 0, 2.66), "head"),
        "upper_arm.L": ((-0.42, 0, 1.32), (-0.70, 0, 1.03), "chest"),
        "forearm.L": ((-0.70, 0, 1.03), (-0.86, 0, 0.76), "upper_arm.L"),
        "hand.L": ((-0.86, 0, 0.76), (-0.94, 0, 0.64), "forearm.L"),
        "upper_arm.R": ((0.42, 0, 1.32), (0.70, 0, 1.03), "chest"),
        "forearm.R": ((0.70, 0, 1.03), (0.86, 0, 0.76), "upper_arm.R"),
        "hand.R": ((0.86, 0, 0.76), (0.94, 0, 0.64), "forearm.R"),
        "upper_leg.L": ((-0.20, 0, 0.65), (-0.26, 0, 0.38), "hips"),
        "shin.L": ((-0.26, 0, 0.38), (-0.31, 0, 0.18), "upper_leg.L"),
        "foot.L": ((-0.31, 0, 0.18), (-0.45, 0, 0.10), "shin.L"),
        "upper_leg.R": ((0.20, 0, 0.65), (0.26, 0, 0.38), "hips"),
        "shin.R": ((0.26, 0, 0.38), (0.31, 0, 0.18), "upper_leg.R"),
        "foot.R": ((0.31, 0, 0.18), (0.45, 0, 0.10), "shin.R"),
        "tail.01": ((0.34, 0, 0.88), (0.58, 0, 1.04), "hips"),
        "tail.02": ((0.58, 0, 1.04), (0.82, 0, 1.24), "tail.01"),
        "tail.03": ((0.82, 0, 1.24), (0.96, 0, 1.46), "tail.02"),
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


def bind_to_root(obj: bpy.types.Object, armature: bpy.types.Object) -> None:
    group = obj.vertex_groups.new(name="root")
    group.add([vertex.index for vertex in obj.data.vertices], 1.0, "ADD")
    modifier = obj.modifiers.new(name="Fuxie_ImageLocked_Armature_Deform", type="ARMATURE")
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


def stash_action(owner: bpy.types.ID, clip_name: str, action: bpy.types.Action, frames: int) -> None:
    action.name = clip_name
    anim_data = owner.animation_data_create()
    track = anim_data.nla_tracks.new()
    track.name = clip_name
    strip = track.strips.new(clip_name, 1, action)
    strip.frame_start = 1
    strip.frame_end = frames


def make_clip(armature: bpy.types.Object, clip_name: str, frames: int, animator) -> None:
    if armature.animation_data:
        armature.animation_data.action = None
    action = bpy.data.actions.new(name=f"Fuxie_ImageLocked_{clip_name}")
    armature.animation_data_create().action = action
    animator()
    stash_action(armature, clip_name, action, frames)
    armature.animation_data.action = None


def animate(armature: bpy.types.Object) -> None:
    def idle() -> None:
        for frame, z, tilt in [(1, 0.00, 0.00), (30, 0.035, -0.018), (60, 0.00, 0.00), (90, 0.035, 0.018), (120, 0.00, 0.00)]:
            key_bone(armature, "root", frame, loc=(0, 0, z), rot=(0, 0, tilt), scale=(1.0, 1.0, 1.0 + abs(tilt) * 0.25))

    def wave() -> None:
        for frame, z, tilt in [(1, 0.00, 0.00), (18, 0.040, -0.030), (36, 0.00, 0.040), (54, 0.040, -0.040), (72, 0.00, 0.030), (90, 0.00, 0.00)]:
            key_bone(armature, "root", frame, loc=(0, 0, z), rot=(0, 0, tilt))

    def talk() -> None:
        for frame in range(1, 121, 10):
            bounce = 0.025 if (frame // 10) % 2 else 0.0
            key_bone(armature, "root", frame, loc=(0, 0, bounce), rot=(0, 0, 0.012 * math.sin(frame * 0.2)))

    make_clip(armature, "idle", 120, idle)
    make_clip(armature, "wave", 90, wave)
    make_clip(armature, "talk", 120, talk)


def setup_scene() -> None:
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.render.fps = 60
    scene.frame_start = 1
    scene.frame_end = 120
    scene.render.resolution_x = 1200
    scene.render.resolution_y = 1200
    scene.render.film_transparent = False
    try:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    except TypeError:
        scene.render.engine = "BLENDER_EEVEE"
    scene.world = scene.world or bpy.data.worlds.new("Fuxie_ImageLocked_World")
    scene.world.color = (0.96, 0.985, 1.0)
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "Medium High Contrast"

    bpy.ops.object.light_add(type="AREA", location=(0, -4, 4.0))
    light = bpy.context.object
    light.name = "Fuxie_ImageLocked_KeyLight"
    light.data.energy = 320
    light.data.size = 4.2

    bpy.ops.object.camera_add(location=(0, -5.0, 1.35))
    camera = bpy.context.object
    camera.name = "Fuxie_ImageLocked_PreviewCamera"
    camera.rotation_euler = (Vector((0, 0, 1.35)) - camera.location).to_track_quat("-Z", "Y").to_euler()
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

    bpy.context.scene.frame_set(24)
    bpy.context.scene.render.image_settings.file_format = "PNG"
    bpy.context.scene.render.filepath = str(PREVIEW_PATH)
    bpy.ops.render.render(write_still=True)


def write_manifest(character_collection: bpy.types.Collection, reference_collection: bpy.types.Collection) -> None:
    meshes = [obj for obj in character_collection.objects if obj.type == "MESH"]
    vertices = sum(len(obj.data.vertices) for obj in meshes)
    faces = sum(len(obj.data.polygons) for obj in meshes)
    armature = next((obj for obj in character_collection.objects if obj.type == "ARMATURE"), None)
    manifest = {
        "name": "Fuxie_Character_v3_image_locked",
        "source_note": "Image-locked Fuxie proxy using cropped approved Fuxie 3D render as the visible source of truth. This is not an exact reconstructed 3D mesh.",
        "references": [
            str(path.relative_to(ROOT)).replace("\\", "/")
            for path in [FRONT_CUTOUT, FRONT_REFERENCE, THREE_QUARTER_REFERENCE, SIDE_REFERENCE, BACK_REFERENCE, FACES_REFERENCE, TAIL_REFERENCE]
            if path.exists()
        ],
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
            "bones": [bone.name for bone in armature.data.bones] if armature else [],
            "reference_planes": [obj.name for obj in reference_collection.objects],
            "fps": bpy.context.scene.render.fps,
            "clips": CLIPS,
        },
        "next_step": "Use this image-locked proxy as the direct visual yardstick, then rebuild the true 3D sculpt/mesh by matching it instead of describing it from memory.",
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")


def main() -> None:
    ensure_dirs()
    clear_scene()
    setup_scene()
    character_collection = make_collection("Fuxie_ImageLocked_GameExport")
    reference_collection = make_collection("Fuxie_Cropped_Image_References")

    armature = create_armature(character_collection)
    front = add_image_plane("Fuxie_ImageLocked_FrontImage", FRONT_REFERENCE, 2.55, (0, -0.035, 0.02), character_collection, alpha=False)
    shadow = add_shadow(character_collection)
    bind_to_root(front, armature)
    bind_to_root(shadow, armature)

    add_image_plane("Fuxie_Reference_Front_ExactCrop", FRONT_REFERENCE, 2.55, (-1.95, 0.22, 0.02), reference_collection, alpha=False, hide_render=True)
    add_image_plane("Fuxie_Reference_ThreeQuarter_ExactCrop", THREE_QUARTER_REFERENCE, 2.55, (1.95, 0.22, 0.02), reference_collection, alpha=False, hide_render=True)
    add_image_plane("Fuxie_Reference_Side_ExactCrop", SIDE_REFERENCE, 2.25, (3.55, 0.22, 0.10), reference_collection, alpha=False, hide_render=True)
    add_image_plane("Fuxie_Reference_Back_ExactCrop", BACK_REFERENCE, 2.25, (-3.55, 0.22, 0.10), reference_collection, alpha=False, hide_render=True)
    add_image_plane("Fuxie_Reference_Faces_ExpressionSheet", FACES_REFERENCE, 1.0, (0, 0.24, 2.85), reference_collection, alpha=False, hide_render=True)
    add_image_plane("Fuxie_Reference_Tail_Material", TAIL_REFERENCE, 0.85, (0, 0.24, -0.98), reference_collection, alpha=False, hide_render=True)

    animate(armature)
    export_assets(character_collection)
    write_manifest(character_collection, reference_collection)
    print(f"Saved image-locked Blender file: {BLEND_PATH}")
    print(f"Exported image-locked GLB: {GLB_PATH}")
    print(f"Exported image-locked FBX: {FBX_PATH}")
    print(f"Rendered image-locked preview: {PREVIEW_PATH}")


if __name__ == "__main__":
    main()
