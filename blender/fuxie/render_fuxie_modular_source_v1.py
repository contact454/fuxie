from __future__ import annotations

import json
import math
import shutil
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "blender" / "fuxie" / "modular_source" / "v1"
PUBLIC_OUT_DIR = ROOT / "apps" / "web" / "public" / "mascot-3d" / "modular-source" / "v1"
MANIFEST_PATH = OUT_DIR / "fuxie_modular_source_v1_manifest.json"
PUBLIC_MANIFEST_PATH = PUBLIC_OUT_DIR / "fuxie_modular_source_v1_manifest.json"
CONTACT_SHEET_PATH = OUT_DIR / "fuxie_modular_source_v1_contact_sheet.png"
PUBLIC_CONTACT_SHEET_PATH = PUBLIC_OUT_DIR / "fuxie_modular_source_v1_contact_sheet.png"


COLORS = {
    "fur_blue": (0.05, 0.55, 0.86, 1),
    "fur_blue_dark": (0.02, 0.24, 0.55, 1),
    "fur_blue_light": (0.30, 0.78, 0.97, 1),
    "cream": (0.95, 0.88, 0.78, 1),
    "inner_ear": (1.0, 0.82, 0.78, 1),
    "hoodie": (0.03, 0.63, 0.68, 1),
    "hoodie_dark": (0.02, 0.40, 0.58, 1),
    "scarf": (0.02, 0.18, 0.56, 1),
    "shoe": (0.03, 0.27, 0.66, 1),
    "sole": (0.86, 0.88, 0.88, 1),
    "eye": (0.04, 0.025, 0.018, 1),
    "iris": (0.70, 0.38, 0.10, 1),
    "nose": (0.02, 0.02, 0.02, 1),
    "mouth": (0.62, 0.08, 0.07, 1),
    "white": (1, 1, 1, 1),
    "coin": (1.0, 0.66, 0.14, 1),
}


PARTS = [
    ("head_face", "head face with ears", "head_face"),
    ("left_ear", "left ear", "left_ear"),
    ("right_ear", "right ear", "right_ear"),
    ("body_hoodie_token", "body hoodie token", "body"),
    ("left_arm_hand", "left arm hand", "left_arm"),
    ("right_arm_hand", "right arm hand", "right_arm"),
    ("left_leg_shoe", "left leg shoe", "left_leg"),
    ("right_leg_shoe", "right leg shoe", "right_leg"),
    ("tail", "tail", "tail"),
    ("chest_token", "chest token", "token"),
]


def ensure_dirs() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_OUT_DIR.mkdir(parents=True, exist_ok=True)


def mat(name: str, color: tuple[float, float, float, float]) -> bpy.types.Material:
    material = bpy.data.materials.get(name)
    if material is not None:
        return material
    material = bpy.data.materials.new(name)
    material.diffuse_color = color
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if bsdf is not None:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Alpha"].default_value = color[3]
        if "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = color
        if "Emission Strength" in bsdf.inputs:
            bsdf.inputs["Emission Strength"].default_value = 0.18
        if "Roughness" in bsdf.inputs:
            bsdf.inputs["Roughness"].default_value = 0.72
        if "Metallic" in bsdf.inputs:
            bsdf.inputs["Metallic"].default_value = 0.0
    return material


def mats() -> dict[str, bpy.types.Material]:
    return {name: mat(f"Fuxie_Modular_{name}", color) for name, color in COLORS.items()}


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    bpy.data.meshes.remove if False else None


def setup_world() -> bpy.types.Object:
    scene = bpy.context.scene
    scene.render.resolution_x = 768
    scene.render.resolution_y = 768
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"
    try:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    except TypeError:
        scene.render.engine = "BLENDER_EEVEE"
    scene.world = scene.world or bpy.data.worlds.new("Fuxie_Modular_Source_World")
    scene.world.color = (1, 1, 1)
    bpy.ops.object.light_add(type="AREA", location=(0, -3.5, 5.0))
    light = bpy.context.object
    light.name = "Fuxie_Modular_Source_KeyLight"
    light.data.energy = 620
    light.data.size = 4.4
    bpy.ops.object.light_add(type="AREA", location=(0, -4.2, 1.4))
    fill = bpy.context.object
    fill.name = "Fuxie_Modular_Source_FillLight"
    fill.data.energy = 360
    fill.data.size = 5.6
    bpy.ops.object.camera_add(location=(0, -6.0, 0.4), rotation=(math.radians(86), 0, 0))
    camera = bpy.context.object
    camera.name = "Fuxie_Modular_Source_Camera"
    camera.data.type = "ORTHO"
    scene.camera = camera
    return camera


def smooth(obj: bpy.types.Object) -> bpy.types.Object:
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    try:
        bpy.ops.object.shade_smooth()
    except RuntimeError:
        pass
    obj.select_set(False)
    return obj


def sphere(name: str, material: bpy.types.Material, loc=(0, 0, 0), scale=(1, 1, 1), segments=48) -> bpy.types.Object:
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=24, radius=1, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    obj.data.materials.append(material)
    return smooth(obj)


def cyl(name: str, material: bpy.types.Material, loc=(0, 0, 0), radius=0.1, depth=1.0, rot=(0, 0, 0), vertices=48) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc, rotation=rot)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(material)
    return smooth(obj)


def torus(name: str, material: bpy.types.Material, loc=(0, 0, 0), major=0.5, minor=0.05, rot=(0, 0, 0), scale=(1, 1, 1)) -> bpy.types.Object:
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, major_segments=72, minor_segments=12, location=loc, rotation=rot)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    obj.data.materials.append(material)
    return smooth(obj)


def triangle(name: str, material: bpy.types.Material, points: list[tuple[float, float, float]]) -> bpy.types.Object:
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(points, [], [(0, 1, 2)])
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(material)
    return obj


def add_eye(prefix: str, x: float, z: float, m: dict[str, bpy.types.Material]) -> None:
    sphere(f"{prefix}_Eye_Outer", m["eye"], (x, -0.66, z), (0.155, 0.045, 0.205))
    sphere(f"{prefix}_Eye_Iris", m["iris"], (x, -0.695, z - 0.01), (0.082, 0.020, 0.118), 32)
    sphere(f"{prefix}_Eye_Glint", m["white"], (x + 0.045, -0.715, z + 0.07), (0.030, 0.010, 0.045), 24)


def add_ear(prefix: str, side: float, m: dict[str, bpy.types.Material], center_x=0.0, center_z=0.0) -> None:
    x = center_x + side * 0.47
    z = center_z + 0.52
    outer = [
        (x - side * 0.23, -0.11, z - 0.24),
        (x + side * 0.17, -0.11, z - 0.18),
        (x + side * 0.02, -0.11, z + 0.46),
    ]
    inner = [
        (x - side * 0.12, -0.13, z - 0.13),
        (x + side * 0.09, -0.13, z - 0.10),
        (x + side * 0.005, -0.13, z + 0.26),
    ]
    triangle(f"{prefix}_Outer", m["fur_blue"], outer)
    triangle(f"{prefix}_Inner", m["inner_ear"], inner)
    sphere(f"{prefix}_Base_Fur", m["fur_blue_dark"], (x - side * 0.05, -0.10, z - 0.23), (0.19, 0.045, 0.08), 24)


def add_token(prefix: str, m: dict[str, bpy.types.Material], loc=(0, -0.73, -0.05), scale=1.0) -> None:
    cyl(f"{prefix}_Coin", m["coin"], loc, radius=0.18 * scale, depth=0.035 * scale, rot=(math.radians(90), 0, 0), vertices=64)
    triangle(
        f"{prefix}_Fox_Mark_L",
        m["white"],
        [
            (loc[0] - 0.070 * scale, loc[1] - 0.025, loc[2] + 0.025 * scale),
            (loc[0] - 0.020 * scale, loc[1] - 0.025, loc[2] + 0.010 * scale),
            (loc[0] - 0.055 * scale, loc[1] - 0.025, loc[2] + 0.105 * scale),
        ],
    )
    triangle(
        f"{prefix}_Fox_Mark_R",
        m["white"],
        [
            (loc[0] + 0.070 * scale, loc[1] - 0.025, loc[2] + 0.025 * scale),
            (loc[0] + 0.020 * scale, loc[1] - 0.025, loc[2] + 0.010 * scale),
            (loc[0] + 0.055 * scale, loc[1] - 0.025, loc[2] + 0.105 * scale),
        ],
    )
    sphere(f"{prefix}_Fox_Mark_Muzzle", m["white"], (loc[0], loc[1] - 0.035, loc[2] - 0.030 * scale), (0.055 * scale, 0.012 * scale, 0.035 * scale), 24)


def build_head_face(m: dict[str, bpy.types.Material]) -> None:
    sphere("Fuxie_Source_Head_Blue", m["fur_blue"], (0, 0, 0.02), (0.66, 0.58, 0.62))
    add_ear("Fuxie_Source_Ear_L", -1, m)
    add_ear("Fuxie_Source_Ear_R", 1, m)
    sphere("Fuxie_Source_Face_Mask", m["cream"], (0, -0.60, -0.08), (0.54, 0.08, 0.31))
    sphere("Fuxie_Source_Cheek_L", m["cream"], (-0.26, -0.62, -0.17), (0.28, 0.075, 0.19))
    sphere("Fuxie_Source_Cheek_R", m["cream"], (0.26, -0.62, -0.17), (0.28, 0.075, 0.19))
    add_eye("Fuxie_Source_Left", -0.23, 0.12, m)
    add_eye("Fuxie_Source_Right", 0.23, 0.12, m)
    sphere("Fuxie_Source_Nose", m["nose"], (0, -0.72, -0.15), (0.105, 0.040, 0.070), 32)
    sphere("Fuxie_Source_Mouth", m["mouth"], (0, -0.74, -0.31), (0.145, 0.028, 0.060), 32)
    sphere("Fuxie_Source_Tuft_1", m["fur_blue_light"], (0, -0.15, 0.66), (0.10, 0.08, 0.20), 24)
    sphere("Fuxie_Source_Tuft_2", m["fur_blue_light"], (-0.11, -0.14, 0.61), (0.07, 0.06, 0.16), 24)
    sphere("Fuxie_Source_Tuft_3", m["fur_blue_light"], (0.11, -0.14, 0.61), (0.07, 0.06, 0.16), 24)


def build_single_ear(m: dict[str, bpy.types.Material], side: float) -> None:
    add_ear("Fuxie_Source_Ear", side, m, center_x=-side * 0.45, center_z=-0.35)


def build_body(m: dict[str, bpy.types.Material]) -> None:
    sphere("Fuxie_Source_Body_Hoodie", m["hoodie"], (0, 0, 0), (0.52, 0.42, 0.69))
    sphere("Fuxie_Source_Belly_Cream", m["cream"], (0, -0.43, -0.06), (0.35, 0.045, 0.44))
    torus("Fuxie_Source_Hood_Rim", m["hoodie_dark"], (0, -0.34, 0.48), major=0.35, minor=0.045, rot=(math.radians(90), 0, 0), scale=(1.0, 0.62, 1))
    triangle("Fuxie_Source_Bandana", m["scarf"], [(-0.34, -0.50, 0.42), (0.34, -0.50, 0.42), (0, -0.51, 0.08)])
    cyl("Fuxie_Source_Drawstring_L", m["white"], (-0.22, -0.58, 0.22), radius=0.012, depth=0.40, rot=(0, 0, math.radians(-8)), vertices=16)
    cyl("Fuxie_Source_Drawstring_R", m["white"], (0.22, -0.58, 0.22), radius=0.012, depth=0.40, rot=(0, 0, math.radians(8)), vertices=16)
    add_token("Fuxie_Source_Chest_Token", m, loc=(0, -0.58, 0.22), scale=0.75)


def build_arm(m: dict[str, bpy.types.Material], side: float) -> None:
    cyl("Fuxie_Source_Arm_Sleeve", m["hoodie"], (0, 0, 0.15), radius=0.13, depth=0.72, rot=(0, math.radians(side * 14), 0), vertices=40)
    sphere("Fuxie_Source_Arm_Cuff", m["hoodie_dark"], (side * 0.08, -0.02, -0.22), (0.16, 0.13, 0.09), 32)
    sphere("Fuxie_Source_Hand", m["fur_blue_dark"], (side * 0.12, -0.03, -0.40), (0.17, 0.13, 0.16), 32)
    cyl("Fuxie_Source_Cuff_Stripe", m["white"], (side * 0.06, -0.13, -0.18), radius=0.105, depth=0.015, rot=(math.radians(90), 0, 0), vertices=40)


def build_leg(m: dict[str, bpy.types.Material], side: float) -> None:
    cyl("Fuxie_Source_Leg", m["scarf"], (0, 0, 0.18), radius=0.13, depth=0.52, vertices=36)
    sphere("Fuxie_Source_Shoe_Body", m["shoe"], (side * 0.05, -0.04, -0.18), (0.25, 0.16, 0.13), 40)
    sphere("Fuxie_Source_Shoe_Toe", m["shoe"], (side * 0.14, -0.13, -0.22), (0.22, 0.10, 0.09), 32)
    sphere("Fuxie_Source_Shoe_Sole", m["sole"], (side * 0.11, -0.14, -0.30), (0.25, 0.045, 0.035), 32)
    for i, z in enumerate([-0.13, -0.20]):
        cyl(f"Fuxie_Source_Shoe_Lace_{i}", m["white"], (side * 0.08, -0.205, z), radius=0.010, depth=0.18, rot=(math.radians(90), 0, math.radians(90)), vertices=12)


def build_tail(m: dict[str, bpy.types.Material]) -> None:
    sphere("Fuxie_Source_Tail_Base", m["fur_blue_dark"], (-0.35, 0, -0.20), (0.26, 0.19, 0.29), 40)
    sphere("Fuxie_Source_Tail_Mid", m["fur_blue"], (0.02, -0.02, 0.08), (0.33, 0.22, 0.44), 48)
    sphere("Fuxie_Source_Tail_Fluff", m["fur_blue_light"], (0.32, -0.03, 0.34), (0.29, 0.20, 0.38), 48)
    sphere("Fuxie_Source_Tail_Tip", m["cream"], (0.56, -0.04, 0.56), (0.20, 0.16, 0.25), 32)


def build_part(kind: str, m: dict[str, bpy.types.Material]) -> None:
    if kind == "head_face":
        build_head_face(m)
    elif kind == "left_ear":
        build_single_ear(m, -1)
    elif kind == "right_ear":
        build_single_ear(m, 1)
    elif kind == "body":
        build_body(m)
    elif kind == "left_arm":
        build_arm(m, -1)
    elif kind == "right_arm":
        build_arm(m, 1)
    elif kind == "left_leg":
        build_leg(m, -1)
    elif kind == "right_leg":
        build_leg(m, 1)
    elif kind == "tail":
        build_tail(m)
    elif kind == "token":
        add_token("Fuxie_Source_Chest_Token", m, loc=(0, -0.05, 0), scale=1.5)
    else:
        raise ValueError(f"Unknown part kind: {kind}")


def renderables() -> list[bpy.types.Object]:
    return [obj for obj in bpy.context.scene.objects if obj.type == "MESH" and not obj.hide_render]


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


def frame_camera(camera: bpy.types.Object, pad=1.34) -> None:
    objects = renderables()
    min_corner, max_corner = bounds(objects)
    center = (min_corner + max_corner) * 0.5
    width = max_corner.x - min_corner.x
    height = max_corner.z - min_corner.z
    camera.location = (center.x, -5.5, center.z)
    camera.rotation_euler = (Vector((center.x, 0, center.z)) - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera.data.ortho_scale = max(width, height) * pad


def render_part(part_id: str, label: str, kind: str) -> dict[str, object]:
    clear_scene()
    m = mats()
    camera = setup_world()
    build_part(kind, m)
    frame_camera(camera)
    output = OUT_DIR / f"fuxie_modular_source_v1_{part_id}.png"
    public_output = PUBLIC_OUT_DIR / output.name
    bpy.context.scene.render.filepath = str(output)
    bpy.ops.render.render(write_still=True)
    shutil.copy2(output, public_output)
    return {
        "id": part_id,
        "label": label,
        "kind": kind,
        "workspace_path": str(output.relative_to(ROOT)).replace("\\", "/"),
        "public_path": str(public_output.relative_to(ROOT)).replace("\\", "/"),
    }


def make_contact_sheet(items: list[dict[str, object]]) -> None:
    clear_scene()
    scene = bpy.context.scene
    scene.render.resolution_x = 1200
    rows = math.ceil(len(items) / 3)
    scene.render.resolution_y = 400 * rows
    scene.render.film_transparent = False
    scene.world = scene.world or bpy.data.worlds.new("Fuxie_Modular_Source_Sheet_World")
    scene.world.color = (1, 1, 1)
    bpy.ops.object.light_add(type="AREA", location=(0, -5, 6))
    light = bpy.context.object
    light.data.energy = 420
    light.data.size = 5
    bpy.ops.object.light_add(type="AREA", location=(0, -5.5, 1.5))
    fill = bpy.context.object
    fill.data.energy = 260
    fill.data.size = 5.8

    label_mat = mat("Fuxie_Modular_Source_Label", (0.04, 0.16, 0.24, 1))
    cols = 3
    tile_w = 2.65
    tile_h = 2.9
    for index, item in enumerate(items):
        col = index % cols
        row = index // cols
        x = (col - 1) * tile_w
        z = ((rows - 1) * 0.5 - row) * tile_h
        image = bpy.data.images.load(str(ROOT / str(item["workspace_path"])), check_existing=True)
        aspect = image.size[0] / max(1, image.size[1])
        plane_h = 1.75
        plane_w = plane_h * aspect
        bpy.ops.mesh.primitive_plane_add(size=1, location=(x, -0.05, z + 0.22), rotation=(math.radians(90), 0, 0))
        plane = bpy.context.object
        plane.name = f"Fuxie_Modular_Source_Sheet_{item['id']}"
        plane.dimensions = (plane_w, plane_h, 1)
        image_mat = bpy.data.materials.new(f"Fuxie_Modular_Source_Sheet_Mat_{item['id']}")
        image_mat.use_nodes = True
        image_mat.blend_method = "BLEND"
        nodes = image_mat.node_tree.nodes
        bsdf = nodes.get("Principled BSDF")
        tex = nodes.new("ShaderNodeTexImage")
        tex.image = image
        image_mat.node_tree.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
        image_mat.node_tree.links.new(tex.outputs["Alpha"], bsdf.inputs["Alpha"])
        plane.data.materials.append(image_mat)

        bpy.ops.object.text_add(location=(x - 0.92, -0.08, z - 1.08), rotation=(math.radians(90), 0, 0))
        text = bpy.context.object
        text.name = f"Fuxie_Modular_Source_Label_{item['id']}"
        text.data.body = str(item["label"])
        text.data.size = 0.14
        text.data.align_x = "LEFT"
        text.data.align_y = "CENTER"
        text.data.materials.append(label_mat)

    bpy.ops.object.camera_add(location=(0, -9, 0), rotation=(math.radians(90), 0, 0))
    camera = bpy.context.object
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = max(rows * tile_h, cols * tile_w * scene.render.resolution_y / scene.render.resolution_x)
    scene.camera = camera
    scene.render.filepath = str(CONTACT_SHEET_PATH)
    bpy.ops.render.render(write_still=True)
    shutil.copy2(CONTACT_SHEET_PATH, PUBLIC_CONTACT_SHEET_PATH)


def main() -> None:
    ensure_dirs()
    bpy.ops.wm.read_factory_settings(use_empty=True)
    items = [render_part(part_id, label, kind) for part_id, label, kind in PARTS]
    make_contact_sheet(items)
    manifest = {
        "name": "fuxie_modular_source_v1",
        "source_note": "Fresh Blender-rendered modular Fuxie body-part source pack. These are newly rendered part assets, not crops. They are stylized approximations guided by the approved V6B identity and Fuxie 3D references.",
        "usage_note": "Use these as modular visual targets for the next assembled mesh/rig pass; keep V6B as the current app fallback until the rigged assembly is approved.",
        "items": items,
        "contact_sheet": str(CONTACT_SHEET_PATH.relative_to(ROOT)).replace("\\", "/"),
        "public_contact_sheet": str(PUBLIC_CONTACT_SHEET_PATH.relative_to(ROOT)).replace("\\", "/"),
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    shutil.copy2(MANIFEST_PATH, PUBLIC_MANIFEST_PATH)
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
