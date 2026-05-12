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

FRONT_REFERENCE = REFERENCE_DIR / "fuxie_ref_front.png"
THREE_QUARTER_REFERENCE = REFERENCE_DIR / "fuxie_ref_three_quarter.png"
SIDE_REFERENCE = REFERENCE_DIR / "fuxie_ref_side.png"
BACK_REFERENCE = REFERENCE_DIR / "fuxie_ref_back.png"
FACES_REFERENCE = REFERENCE_DIR / "fuxie_ref_faces.png"
TAIL_REFERENCE = REFERENCE_DIR / "fuxie_ref_tail_material.png"

BLEND_PATH = BLENDER_DIR / "Fuxie_Character_v5_image_source.blend"
GLB_PATH = MODEL_DIR / "Fuxie_Character_v5_image_source.glb"
FBX_PATH = MODEL_DIR / "Fuxie_Character_v5_image_source.fbx"
PREVIEW_PATH = BLENDER_DIR / "Fuxie_preview_v5_image_source.png"
MANIFEST_PATH = BLENDER_DIR / "Fuxie_Character_v5_image_source_manifest.json"

CLIPS = {
    "idle": {"frames": 120, "description": "60fps breathing on the approved Fuxie image source."},
    "wave": {"frames": 96, "description": "Gentle greeting sway on the approved Fuxie image source."},
    "talk": {"frames": 120, "description": "Subtle speaking bounce on the approved Fuxie image source."},
}


def clear_scene() -> None:
    bpy.ops.object.mode_set(mode="OBJECT") if bpy.ops.object.mode_set.poll() else None
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def ensure_dirs() -> None:
    BLENDER_DIR.mkdir(parents=True, exist_ok=True)
    MODEL_DIR.mkdir(parents=True, exist_ok=True)


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
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.blend_method = "OPAQUE"
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    image_node = nodes.new("ShaderNodeTexImage")
    image_node.image = bpy.data.images.load(str(image_path), check_existing=True)
    image_node.extension = "CLIP"
    if bsdf:
        mat.node_tree.links.new(image_node.outputs["Color"], bsdf.inputs["Base Color"])
        bsdf.inputs["Roughness"].default_value = 0.82
    return mat


def solid_material(name: str, color: tuple[float, float, float, float]) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Roughness"].default_value = 0.80
        if "Alpha" in bsdf.inputs:
            bsdf.inputs["Alpha"].default_value = color[3]
    mat.blend_method = "BLEND" if color[3] < 1 else "OPAQUE"
    return mat


def add_image_plane(
    name: str,
    image_path: Path,
    height: float,
    loc: tuple[float, float, float],
    collection: bpy.types.Collection,
    hide_render: bool = False,
) -> bpy.types.Object:
    image = bpy.data.images.load(str(image_path), check_existing=True)
    width = height * image.size[0] / image.size[1]
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    verts = [(-width / 2, 0, 0), (width / 2, 0, 0), (width / 2, 0, height), (-width / 2, 0, height)]
    mesh.from_pydata(verts, [], [(0, 1, 2, 3)])
    mesh.update()
    uv = mesh.uv_layers.new(name="Fuxie_ImageSource_UV")
    coords = [(0, 0), (1, 0), (1, 1), (0, 1)]
    for polygon in mesh.polygons:
        for loop_index in polygon.loop_indices:
            uv.data[loop_index].uv = coords[mesh.loops[loop_index].vertex_index]
    obj = bpy.data.objects.new(name, mesh)
    obj.location = loc
    obj.data.materials.append(image_material(f"{name}_Material", image_path))
    collection.objects.link(obj)
    obj.hide_render = hide_render
    return obj


def add_shadow(collection: bpy.types.Collection) -> bpy.types.Object:
    mat = solid_material("Fuxie_V5_SoftShadow", (0.02, 0.12, 0.18, 0.30))
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=12, location=(0, -0.035, 0.030), scale=(0.78, 0.095, 0.026))
    obj = bpy.context.object
    obj.name = "Fuxie_V5_ImageSource_Shadow"
    obj.data.name = "Fuxie_V5_ImageSource_Shadow_Mesh"
    obj.data.materials.append(mat)
    link_only(obj, collection)
    return obj


def create_armature(collection: bpy.types.Collection) -> bpy.types.Object:
    bpy.ops.object.armature_add(enter_editmode=True, location=(0, 0, 0))
    armature = bpy.context.object
    armature.name = "Fuxie_V5_ImageSource_Armature"
    armature.data.name = "Fuxie_V5_ImageSource_Skeleton"
    armature.show_in_front = True
    link_only(armature, collection)

    edit_bones = armature.data.edit_bones
    edit_bones.remove(edit_bones[0])
    specs = {
        "root": ((0, 0, 0.04), (0, 0, 0.38), None),
        "hips": ((0, 0, 0.62), (0, 0, 1.00), "root"),
        "spine": ((0, 0, 1.00), (0, 0, 1.34), "hips"),
        "chest": ((0, 0, 1.34), (0, 0, 1.55), "spine"),
        "neck": ((0, 0, 1.55), (0, 0, 1.72), "chest"),
        "head": ((0, 0, 1.72), (0, 0, 2.38), "neck"),
        "ear.L": ((-0.30, 0, 2.08), (-0.60, 0, 2.65), "head"),
        "ear.R": ((0.30, 0, 2.08), (0.60, 0, 2.65), "head"),
        "upper_arm.L": ((-0.42, 0, 1.28), (-0.70, 0, 0.98), "chest"),
        "forearm.L": ((-0.70, 0, 0.98), (-0.88, 0, 0.66), "upper_arm.L"),
        "hand.L": ((-0.88, 0, 0.66), (-0.96, 0, 0.56), "forearm.L"),
        "upper_arm.R": ((0.42, 0, 1.28), (0.70, 0, 0.98), "chest"),
        "forearm.R": ((0.70, 0, 0.98), (0.88, 0, 0.66), "upper_arm.R"),
        "hand.R": ((0.88, 0, 0.66), (0.96, 0, 0.56), "forearm.R"),
        "upper_leg.L": ((-0.20, 0, 0.62), (-0.26, 0, 0.34), "hips"),
        "shin.L": ((-0.26, 0, 0.34), (-0.32, 0, 0.14), "upper_leg.L"),
        "foot.L": ((-0.32, 0, 0.14), (-0.48, 0, 0.08), "shin.L"),
        "upper_leg.R": ((0.20, 0, 0.62), (0.26, 0, 0.34), "hips"),
        "shin.R": ((0.26, 0, 0.34), (0.32, 0, 0.14), "upper_leg.R"),
        "foot.R": ((0.32, 0, 0.14), (0.48, 0, 0.08), "shin.R"),
        "tail.01": ((0.35, 0, 0.88), (0.60, 0, 1.08), "hips"),
        "tail.02": ((0.60, 0, 1.08), (0.82, 0, 1.30), "tail.01"),
        "tail.03": ((0.82, 0, 1.30), (0.95, 0, 1.52), "tail.02"),
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
    group.add([v.index for v in obj.data.vertices], 1.0, "ADD")
    modifier = obj.modifiers.new(name="Fuxie_V5_ImageSource_Armature_Deform", type="ARMATURE")
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
    action = bpy.data.actions.new(f"Fuxie_V5_ImageSource_{name}")
    armature.animation_data_create().action = action
    animator()
    stash_action(armature, name, action, frames)
    armature.animation_data.action = None


def animate(armature: bpy.types.Object) -> None:
    def idle() -> None:
        for frame, z, tilt, scale_y in [(1, 0.00, 0.00, 1.0), (30, 0.028, -0.012, 1.012), (60, 0.00, 0.00, 1.0), (90, 0.028, 0.012, 1.012), (120, 0.00, 0.00, 1.0)]:
            key_bone(armature, "root", frame, loc=(0, 0, z), rot=(0, 0, tilt), scale=(1.0, scale_y, 1.0))

    def wave() -> None:
        for frame, z, tilt in [(1, 0, 0), (18, 0.035, -0.030), (36, 0, 0.035), (54, 0.035, -0.035), (72, 0, 0.030), (96, 0, 0)]:
            key_bone(armature, "root", frame, loc=(0, 0, z), rot=(0, 0, tilt))

    def talk() -> None:
        for frame in range(1, 121, 10):
            bounce = 0.020 if (frame // 10) % 2 else 0.0
            scale = 1.008 if (frame // 10) % 2 else 1.0
            key_bone(armature, "root", frame, loc=(0, 0, bounce), rot=(0, 0, 0.010 * math.sin(frame * 0.2)), scale=(1.0, scale, 1.0))

    make_clip(armature, "idle", 120, idle)
    make_clip(armature, "wave", 96, wave)
    make_clip(armature, "talk", 120, talk)


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
    scene.world = scene.world or bpy.data.worlds.new("Fuxie_V5_ImageSource_World")
    scene.world.color = (0.96, 0.985, 1.0)
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "Medium High Contrast"

    bpy.ops.object.light_add(type="AREA", location=(0, -4.0, 4.0))
    light = bpy.context.object
    light.name = "Fuxie_V5_ImageSource_KeyLight"
    light.data.energy = 260
    light.data.size = 5.0

    bpy.ops.object.camera_add(location=(0, -5.0, 1.35))
    camera = bpy.context.object
    camera.name = "Fuxie_V5_ImageSource_Camera"
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
    props = bpy.ops.export_scene.gltf.get_rna_type().properties.keys()
    gltf_kwargs = {
        "filepath": str(GLB_PATH),
        "export_format": "GLB",
        "use_selection": True,
        "export_yup": True,
        "export_animations": True,
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


def write_manifest(character_collection: bpy.types.Collection, reference_collection: bpy.types.Collection) -> None:
    meshes = [obj for obj in character_collection.objects if obj.type == "MESH"]
    armature = next((obj for obj in character_collection.objects if obj.type == "ARMATURE"), None)
    manifest = {
        "name": "Fuxie_Character_v5_image_source",
        "status": "approved_identity_baseline_candidate",
        "source_note": "Image-source Fuxie rig: the visible character is the approved cropped Fuxie 3D render. This is an image/projection asset, not a reconstructed 3D sculpt.",
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
        },
        "stats": {
            "mesh_objects": len(meshes),
            "vertices_before_export_modifiers": sum(len(obj.data.vertices) for obj in meshes),
            "faces_before_export_modifiers": sum(len(obj.data.polygons) for obj in meshes),
            "bones": [bone.name for bone in armature.data.bones] if armature else [],
            "reference_planes": [obj.name for obj in reference_collection.objects],
            "fps": bpy.context.scene.render.fps,
            "clips": CLIPS,
        },
        "next_step": "Use this image-source baseline for runtime QA, then plan a separate artist sculpt pass if a full 3D mesh is still required.",
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")


def main() -> None:
    ensure_dirs()
    clear_scene()
    setup_scene()

    character_collection = make_collection("Fuxie_V5_ImageSource_GameExport")
    reference_collection = make_collection("Fuxie_V5_Cropped_References")

    armature = create_armature(character_collection)
    front = add_image_plane("Fuxie_V5_ImageSource_Front", FRONT_REFERENCE, 2.55, (0, -0.035, 0.02), character_collection)
    shadow = add_shadow(character_collection)
    bind_to_root(front, armature)
    bind_to_root(shadow, armature)

    add_image_plane("Fuxie_V5_Reference_Front", FRONT_REFERENCE, 2.55, (-1.95, 0.22, 0.02), reference_collection, hide_render=True)
    add_image_plane("Fuxie_V5_Reference_ThreeQuarter", THREE_QUARTER_REFERENCE, 2.55, (1.95, 0.22, 0.02), reference_collection, hide_render=True)
    add_image_plane("Fuxie_V5_Reference_Side", SIDE_REFERENCE, 2.20, (3.55, 0.22, 0.10), reference_collection, hide_render=True)
    add_image_plane("Fuxie_V5_Reference_Back", BACK_REFERENCE, 2.20, (-3.55, 0.22, 0.10), reference_collection, hide_render=True)
    add_image_plane("Fuxie_V5_Reference_Faces", FACES_REFERENCE, 1.0, (0, 0.24, 2.86), reference_collection, hide_render=True)
    add_image_plane("Fuxie_V5_Reference_Tail", TAIL_REFERENCE, 0.82, (0, 0.24, -0.98), reference_collection, hide_render=True)

    animate(armature)
    export_assets(character_collection)
    write_manifest(character_collection, reference_collection)
    print(f"Saved V5 image-source Blender file: {BLEND_PATH}")
    print(f"Exported V5 image-source GLB: {GLB_PATH}")
    print(f"Exported V5 image-source FBX: {FBX_PATH}")
    print(f"Rendered V5 image-source preview: {PREVIEW_PATH}")


if __name__ == "__main__":
    main()
