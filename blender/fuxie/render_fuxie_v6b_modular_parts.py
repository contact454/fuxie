from __future__ import annotations

import json
import math
import shutil
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
BLENDER_DIR = ROOT / "blender" / "fuxie"
PART_RENDER_DIR = BLENDER_DIR / "modular_parts" / "v6b"
PUBLIC_PART_RENDER_DIR = ROOT / "apps" / "web" / "public" / "mascot-3d" / "modular-parts" / "v6b"
SOURCE_BLEND = BLENDER_DIR / "Fuxie_Character_v6b_game_rig_cleanup.blend"
MANIFEST_PATH = PART_RENDER_DIR / "fuxie_v6b_modular_parts_manifest.json"
PUBLIC_MANIFEST_PATH = PUBLIC_PART_RENDER_DIR / "fuxie_v6b_modular_parts_manifest.json"
CONTACT_SHEET_PATH = PART_RENDER_DIR / "fuxie_v6b_modular_parts_contact_sheet.png"
PUBLIC_CONTACT_SHEET_PATH = PUBLIC_PART_RENDER_DIR / "fuxie_v6b_modular_parts_contact_sheet.png"


PARTS = [
    {
        "id": "head_face",
        "label": "head face",
        "objects": ["Fuxie_Head", "Fuxie_Mouth_TalkOverlay"],
        "ortho_scale": 1.55,
    },
    {
        "id": "tail",
        "label": "tail",
        "objects": ["Fuxie_Tail"],
        "ortho_scale": 1.25,
    },
    {
        "id": "body_hoodie_token",
        "label": "body hoodie token",
        "objects": ["Fuxie_Body_Hoodie", "Fuxie_Chest_Token"],
        "ortho_scale": 1.45,
    },
    {
        "id": "left_arm_hand",
        "label": "left arm hand",
        "objects": ["Fuxie_Arm_L"],
        "ortho_scale": 1.0,
    },
    {
        "id": "right_arm_hand",
        "label": "right arm hand",
        "objects": ["Fuxie_Arm_R"],
        "ortho_scale": 1.0,
    },
    {
        "id": "left_leg_shoe",
        "label": "left leg shoe",
        "objects": ["Fuxie_Leg_L"],
        "ortho_scale": 1.05,
    },
    {
        "id": "right_leg_shoe",
        "label": "right leg shoe",
        "objects": ["Fuxie_Leg_R"],
        "ortho_scale": 1.05,
    },
    {
        "id": "mouth_overlay",
        "label": "mouth overlay",
        "objects": ["Fuxie_Mouth_TalkOverlay"],
        "ortho_scale": 0.55,
    },
    {
        "id": "chest_token",
        "label": "chest token",
        "objects": ["Fuxie_Chest_Token"],
        "ortho_scale": 0.62,
    },
]


def ensure_dirs() -> None:
    PART_RENDER_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_PART_RENDER_DIR.mkdir(parents=True, exist_ok=True)


def setup_render() -> bpy.types.Object:
    scene = bpy.context.scene
    scene.frame_set(1)
    scene.render.resolution_x = 768
    scene.render.resolution_y = 768
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"
    scene.world = scene.world or bpy.data.worlds.new("Fuxie_Modular_Parts_World")
    scene.world.color = (1, 1, 1)
    try:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    except TypeError:
        scene.render.engine = "BLENDER_EEVEE"

    for obj in list(scene.objects):
        if obj.type == "LIGHT":
            bpy.data.objects.remove(obj, do_unlink=True)

    bpy.ops.object.light_add(type="AREA", location=(0, -3.2, 4.0))
    light = bpy.context.object
    light.name = "Fuxie_Modular_Parts_KeyLight"
    light.data.energy = 360
    light.data.size = 4.2

    camera = scene.camera
    if camera is None:
        bpy.ops.object.camera_add()
        camera = bpy.context.object
        scene.camera = camera
    camera.name = "Fuxie_Modular_Parts_Camera"
    camera.data.type = "ORTHO"
    return camera


def target_objects(names: list[str]) -> list[bpy.types.Object]:
    objects = []
    for name in names:
        obj = bpy.data.objects.get(name)
        if obj is None:
            raise RuntimeError(f"Missing modular part object: {name}")
        objects.append(obj)
    return objects


def set_visibility(visible_objects: list[bpy.types.Object]) -> None:
    visible_names = {obj.name for obj in visible_objects}
    for obj in bpy.context.scene.objects:
        if obj.type in {"CAMERA", "LIGHT"}:
            obj.hide_render = False
            obj.hide_viewport = False
            continue
        visible = obj.name in visible_names
        obj.hide_render = not visible
        obj.hide_viewport = not visible


def bounds(objects: list[bpy.types.Object]) -> tuple[Vector, Vector]:
    min_corner = Vector((math.inf, math.inf, math.inf))
    max_corner = Vector((-math.inf, -math.inf, -math.inf))
    for obj in objects:
        for corner in obj.bound_box:
            world = obj.matrix_world @ Vector(corner)
            min_corner.x = min(min_corner.x, world.x)
            min_corner.y = min(min_corner.y, world.y)
            min_corner.z = min(min_corner.z, world.z)
            max_corner.x = max(max_corner.x, world.x)
            max_corner.y = max(max_corner.y, world.y)
            max_corner.z = max(max_corner.z, world.z)
    return min_corner, max_corner


def frame_camera(camera: bpy.types.Object, objects: list[bpy.types.Object], ortho_scale: float) -> None:
    min_corner, max_corner = bounds(objects)
    center = (min_corner + max_corner) * 0.5
    camera.location = (center.x, -4.2, center.z)
    camera.rotation_euler = (Vector((center.x, 0, center.z)) - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera.data.ortho_scale = ortho_scale


def render_part(camera: bpy.types.Object, part: dict[str, object]) -> dict[str, object]:
    objects = target_objects(list(part["objects"]))
    set_visibility(objects)
    frame_camera(camera, objects, float(part["ortho_scale"]))
    output = PART_RENDER_DIR / f"fuxie_v6b_part_{part['id']}.png"
    bpy.context.scene.render.filepath = str(output)
    bpy.ops.render.render(write_still=True)
    public_output = PUBLIC_PART_RENDER_DIR / output.name
    shutil.copy2(output, public_output)
    return {
        "id": part["id"],
        "label": part["label"],
        "objects": part["objects"],
        "workspace_path": str(output.relative_to(ROOT)).replace("\\", "/"),
        "public_path": str(public_output.relative_to(ROOT)).replace("\\", "/"),
        "ortho_scale": part["ortho_scale"],
    }


def make_contact_sheet(items: list[dict[str, object]]) -> None:
    scene = bpy.context.scene
    cols = 3
    rows = (len(items) + cols - 1) // cols

    for obj in scene.objects:
        if obj.type not in {"CAMERA", "LIGHT"}:
            obj.hide_render = True
            obj.hide_viewport = True

    scene.render.resolution_x = 1200
    scene.render.resolution_y = 400 * rows
    scene.render.film_transparent = False
    scene.world = scene.world or bpy.data.worlds.new("Fuxie_Modular_Parts_World")
    scene.world.color = (1, 1, 1)

    tile_width = 2.6
    tile_height = 2.85
    image_size = 1.75
    sheet_width = cols * tile_width
    sheet_height = rows * tile_height

    for index, item in enumerate(items):
        col = index % cols
        row = index // cols
        x = (col - (cols - 1) * 0.5) * tile_width
        z = ((rows - 1) * 0.5 - row) * tile_height

        image = bpy.data.images.load(str(ROOT / str(item["workspace_path"])), check_existing=True)
        aspect = image.size[0] / max(1, image.size[1])
        plane_w = image_size if aspect >= 1 else image_size * aspect
        plane_h = image_size / aspect if aspect >= 1 else image_size

        bpy.ops.mesh.primitive_plane_add(
            size=1,
            location=(x, -0.05, z + 0.25),
            rotation=(math.radians(90), 0, 0),
        )
        plane = bpy.context.object
        plane.name = f"Fuxie_Modular_Parts_Sheet_{item['id']}"
        plane.dimensions = (plane_w, plane_h, 1)
        mat = bpy.data.materials.new(f"Fuxie_Modular_Parts_Sheet_Mat_{item['id']}")
        mat.use_nodes = True
        mat.blend_method = "BLEND"
        mat.use_screen_refraction = False
        mat.show_transparent_back = False
        nodes = mat.node_tree.nodes
        bsdf = nodes.get("Principled BSDF")
        tex = nodes.new("ShaderNodeTexImage")
        tex.image = image
        mat.node_tree.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
        mat.node_tree.links.new(tex.outputs["Alpha"], bsdf.inputs["Alpha"])
        plane.data.materials.append(mat)

        bpy.ops.object.text_add(
            location=(x - tile_width * 0.42, -0.08, z - 1.1),
            rotation=(math.radians(90), 0, 0),
        )
        text = bpy.context.object
        text.name = f"Fuxie_Modular_Parts_Label_{item['id']}"
        text.data.body = str(item["label"])
        text.data.align_x = "LEFT"
        text.data.align_y = "CENTER"
        text.data.size = 0.14
        text.data.materials.append(text_material())

    camera = scene.camera
    if camera is None:
        bpy.ops.object.camera_add()
        camera = bpy.context.object
        scene.camera = camera
    camera.location = (0, -9, 0)
    camera.rotation_euler = (math.radians(90), 0, 0)
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = max(sheet_height, sheet_width * scene.render.resolution_y / scene.render.resolution_x)

    scene.render.filepath = str(CONTACT_SHEET_PATH)
    bpy.ops.render.render(write_still=True)
    shutil.copy2(CONTACT_SHEET_PATH, PUBLIC_CONTACT_SHEET_PATH)


def text_material() -> bpy.types.Material:
    material = bpy.data.materials.get("Fuxie_Modular_Parts_Label_Mat")
    if material is not None:
        return material
    material = bpy.data.materials.new("Fuxie_Modular_Parts_Label_Mat")
    material.diffuse_color = (0.04, 0.16, 0.24, 1)
    return material


def main() -> None:
    ensure_dirs()
    if not SOURCE_BLEND.exists():
        raise FileNotFoundError(f"Missing source blend: {SOURCE_BLEND}")
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE_BLEND))
    camera = setup_render()
    items = [render_part(camera, part) for part in PARTS]
    make_contact_sheet(items)
    manifest = {
        "name": "fuxie_v6b_modular_parts",
        "source_blend": str(SOURCE_BLEND.relative_to(ROOT)).replace("\\", "/"),
        "source_note": "New transparent renders of individual modular Fuxie parts from the V6B approved baseline rig. These are not crops; they are rendered part assets for modular rig assembly/reference.",
        "items": items,
        "contact_sheet": str(CONTACT_SHEET_PATH.relative_to(ROOT)).replace("\\", "/"),
        "public_contact_sheet": str(PUBLIC_CONTACT_SHEET_PATH.relative_to(ROOT)).replace("\\", "/"),
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    shutil.copy2(MANIFEST_PATH, PUBLIC_MANIFEST_PATH)
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
