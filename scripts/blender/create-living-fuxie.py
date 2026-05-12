from __future__ import annotations

import math
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
PUBLIC_DIR = ROOT / "apps" / "web" / "public" / "mascot-3d" / "live"
SOURCE_DIR = ROOT / "assets" / "fuxie-3d-source"

PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
SOURCE_DIR.mkdir(parents=True, exist_ok=True)


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


def add_uv(name: str, loc: tuple[float, float, float], scale: tuple[float, float, float], mat: bpy.types.Material) -> bpy.types.Object:
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    obj.data.materials.append(mat)
    return obj


def add_cone(
    name: str,
    loc: tuple[float, float, float],
    radius1: float,
    radius2: float,
    depth: float,
    mat: bpy.types.Material,
    rotation: tuple[float, float, float] = (0, 0, 0),
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cone_add(vertices=48, radius1=radius1, radius2=radius2, depth=depth, location=loc, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    return obj


def add_cylinder(
    name: str,
    loc: tuple[float, float, float],
    radius: float,
    depth: float,
    mat: bpy.types.Material,
    rotation: tuple[float, float, float] = (0, 0, 0),
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cylinder_add(vertices=36, radius=radius, depth=depth, location=loc, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    return obj


def shade_smooth(objects: list[bpy.types.Object]) -> None:
    for obj in objects:
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        try:
            bpy.ops.object.shade_smooth()
        except RuntimeError:
            pass
        obj.select_set(False)


def parent_to(root: bpy.types.Object, objects: list[bpy.types.Object]) -> None:
    for obj in objects:
        obj.parent = root


def key(obj: bpy.types.Object, frame: int, loc=None, rot=None, scale=None) -> None:
    bpy.context.scene.frame_set(frame)
    if loc is not None:
        obj.location = loc
        obj.keyframe_insert(data_path="location", frame=frame)
    if rot is not None:
        obj.rotation_euler = rot
        obj.keyframe_insert(data_path="rotation_euler", frame=frame)
    if scale is not None:
        obj.scale = scale
        obj.keyframe_insert(data_path="scale", frame=frame)


def build_fuxie() -> tuple[bpy.types.Object, list[bpy.types.Object]]:
    sky = material("Fuxie sky blue", (0.22, 0.63, 0.88, 1))
    teal = material("Fuxie teal hoodie", (0.10, 0.73, 0.68, 1))
    deep = material("Deep blue details", (0.09, 0.22, 0.33, 1))
    cream = material("Soft cream fur", (0.96, 0.98, 1.0, 1))
    amber = material("Fucoin amber", (1.0, 0.72, 0.08, 1), roughness=0.58)
    blush = material("Warm blush", (1.0, 0.45, 0.38, 1))
    black = material("Warm black eyes", (0.03, 0.07, 0.1, 1))

    root = bpy.data.objects.new("Fuxie_living_root", None)
    bpy.context.collection.objects.link(root)

    parts: list[bpy.types.Object] = []
    parts.append(add_uv("body_hoodie", (0, 0, 1.15), (0.55, 0.38, 0.72), teal))
    parts.append(add_uv("belly_patch", (0, -0.28, 1.12), (0.30, 0.08, 0.40), cream))
    parts.append(add_uv("head", (0, 0, 2.02), (0.58, 0.48, 0.46), sky))
    parts.append(add_uv("face_patch", (0, -0.36, 1.96), (0.38, 0.12, 0.28), cream))
    parts.append(add_cone("left_ear", (-0.38, 0, 2.42), 0.18, 0.03, 0.48, sky, rotation=(0.12, 0.20, -0.36)))
    parts.append(add_cone("right_ear", (0.38, 0, 2.42), 0.18, 0.03, 0.48, sky, rotation=(0.12, -0.20, 0.36)))
    parts.append(add_cone("left_inner_ear", (-0.38, -0.03, 2.40), 0.10, 0.02, 0.34, cream, rotation=(0.12, 0.20, -0.36)))
    parts.append(add_cone("right_inner_ear", (0.38, -0.03, 2.40), 0.10, 0.02, 0.34, cream, rotation=(0.12, -0.20, 0.36)))
    parts.append(add_uv("left_eye", (-0.18, -0.43, 2.04), (0.055, 0.035, 0.07), black))
    parts.append(add_uv("right_eye", (0.18, -0.43, 2.04), (0.055, 0.035, 0.07), black))
    parts.append(add_uv("left_eye_spark", (-0.20, -0.455, 2.07), (0.018, 0.010, 0.018), cream))
    parts.append(add_uv("right_eye_spark", (0.16, -0.455, 2.07), (0.018, 0.010, 0.018), cream))
    parts.append(add_uv("nose", (0, -0.50, 1.91), (0.055, 0.030, 0.040), deep))
    parts.append(add_uv("left_blush", (-0.34, -0.42, 1.88), (0.060, 0.020, 0.040), blush))
    parts.append(add_uv("right_blush", (0.34, -0.42, 1.88), (0.060, 0.020, 0.040), blush))

    left_arm = add_cylinder("left_arm_wave", (-0.53, -0.04, 1.48), 0.075, 0.62, sky, rotation=(0.35, 0.18, 0.42))
    right_arm = add_cylinder("right_arm_coach", (0.53, -0.04, 1.48), 0.075, 0.62, sky, rotation=(0.35, -0.18, -0.42))
    left_hand = add_uv("left_hand", (-0.70, -0.20, 1.72), (0.11, 0.09, 0.11), cream)
    right_hand = add_uv("right_hand", (0.70, -0.20, 1.72), (0.11, 0.09, 0.11), cream)
    tail = add_cylinder("tail_soft_sway", (0.58, 0.32, 1.10), 0.13, 0.88, sky, rotation=(1.05, 0.08, -0.60))
    tail_tip = add_uv("tail_tip", (0.86, 0.55, 1.28), (0.18, 0.12, 0.16), cream)
    parts.extend([left_arm, right_arm, left_hand, right_hand, tail, tail_tip])

    parts.append(add_uv("left_foot", (-0.24, -0.08, 0.43), (0.18, 0.14, 0.10), deep))
    parts.append(add_uv("right_foot", (0.24, -0.08, 0.43), (0.18, 0.14, 0.10), deep))
    parts.append(add_cylinder("fucoin_token", (0.0, -0.64, 1.38), 0.16, 0.055, amber, rotation=(math.pi / 2, 0, 0)))

    shade_smooth(parts)
    parent_to(root, parts)

    return root, [left_arm, left_hand, right_arm, right_hand, tail, tail_tip, *parts]


def animate(root: bpy.types.Object, animated_parts: list[bpy.types.Object]) -> None:
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end = 72
    scene.frame_set(1)
    scene.render.fps = 24

    left_arm, left_hand, right_arm, right_hand, tail, tail_tip = animated_parts[:6]

    for frame, z, tilt in [(1, 0.0, 0.0), (18, 0.055, -0.025), (36, 0.0, 0.0), (54, 0.055, 0.025), (72, 0.0, 0.0)]:
        key(root, frame, loc=(0, 0, z), rot=(0, 0, tilt))

    wave_frames = [
        (1, (0.35, 0.18, 0.42), (-0.70, -0.20, 1.72)),
        (18, (0.25, 0.30, 0.95), (-0.84, -0.24, 1.98)),
        (36, (0.45, 0.10, 0.70), (-0.78, -0.26, 1.86)),
        (54, (0.25, 0.32, 0.98), (-0.85, -0.24, 1.98)),
        (72, (0.35, 0.18, 0.42), (-0.70, -0.20, 1.72)),
    ]
    for frame, rot, hand_loc in wave_frames:
        key(left_arm, frame, rot=rot)
        key(left_hand, frame, loc=hand_loc)

    for frame, rot, hand_loc in [
        (1, (0.35, -0.18, -0.42), (0.70, -0.20, 1.72)),
        (36, (0.55, -0.12, -0.24), (0.66, -0.22, 1.62)),
        (72, (0.35, -0.18, -0.42), (0.70, -0.20, 1.72)),
    ]:
        key(right_arm, frame, rot=rot)
        key(right_hand, frame, loc=hand_loc)

    for frame, rot in [(1, (1.05, 0.08, -0.60)), (36, (1.00, 0.18, -0.80)), (72, (1.05, 0.08, -0.60))]:
        key(tail, frame, rot=rot)
        key(tail_tip, frame, loc=(0.86 + 0.04 * math.sin(frame), 0.55, 1.28))

    for obj in [root, left_arm, left_hand, right_arm, right_hand, tail, tail_tip]:
        if not obj.animation_data or not obj.animation_data.action:
            continue
        fcurves = getattr(obj.animation_data.action, "fcurves", None)
        if not fcurves:
            continue
        for fc in fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "BEZIER"


def setup_scene() -> None:
    scene = bpy.context.scene
    try:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    except TypeError:
        scene.render.engine = "BLENDER_EEVEE"
    scene.eevee.taa_render_samples = 32
    scene.render.resolution_x = 512
    scene.render.resolution_y = 512
    scene.render.film_transparent = True
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "Medium High Contrast"
    scene.world = bpy.data.worlds.new("Fuxie soft sky world") if scene.world is None else scene.world
    scene.world.color = (1.0, 1.0, 1.0)

    bpy.ops.object.light_add(type="AREA", location=(0, -3.8, 4.2))
    key_light = bpy.context.object
    key_light.name = "softbox_key"
    key_light.data.energy = 520
    key_light.data.size = 4.2

    bpy.ops.object.camera_add(location=(0, -6.2, 1.55))
    camera = bpy.context.object
    bpy.context.scene.camera = camera
    camera.rotation_euler = (Vector((0, 0, 1.48)) - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = 3.15


def export_assets() -> None:
    blend_path = SOURCE_DIR / "fuxie-living-prototype.blend"
    glb_path = PUBLIC_DIR / "fuxie-living-prototype.glb"
    poster_path = PUBLIC_DIR / "fuxie-living-prototype-poster.png"

    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
    bpy.ops.export_scene.gltf(
        filepath=str(glb_path),
        export_format="GLB",
        export_animations=True,
        export_frame_range=True,
        export_yup=True,
    )

    scene = bpy.context.scene
    scene.frame_set(12)
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = str(poster_path)
    bpy.ops.render.render(write_still=True)

    scene.render.image_settings.file_format = "WEBP"
    scene.render.image_settings.quality = 82
    for index, frame in enumerate([1, 18, 36, 54], start=1):
        scene.frame_set(frame)
        scene.render.filepath = str(PUBLIC_DIR / f"fuxie-living-prototype-frame-{index}.webp")
        bpy.ops.render.render(write_still=True)


def main() -> None:
    clear_scene()
    setup_scene()
    root, animated_parts = build_fuxie()
    animate(root, animated_parts)
    export_assets()


if __name__ == "__main__":
    main()
