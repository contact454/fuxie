from __future__ import annotations

import json
import math
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
CANDIDATE_DIR = ROOT / "blender" / "fuxie" / "hunyuan_v8" / "candidates"
PREVIEW_DIR = ROOT / "blender" / "fuxie" / "hunyuan_v8" / "previews"
REPORT_PATH = ROOT / "blender" / "fuxie" / "hunyuan_v8" / "Fuxie_hunyuan_v8_candidate_previews.json"


def clear_scene() -> None:
    if bpy.ops.object.mode_set.poll():
        bpy.ops.object.mode_set(mode="OBJECT")
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def setup_scene() -> None:
    scene = bpy.context.scene
    scene.render.resolution_x = 900
    scene.render.resolution_y = 900
    try:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    except TypeError:
        scene.render.engine = "BLENDER_EEVEE"
    scene.world = scene.world or bpy.data.worlds.new("Fuxie_V8_Candidate_World")
    scene.world.color = (0.98, 0.99, 1.0)
    bpy.ops.object.light_add(type="AREA", location=(0, -4.0, 4.0))
    light = bpy.context.object
    light.name = "Fuxie_V8_Candidate_KeyLight"
    light.data.energy = 420
    light.data.size = 4.0
    bpy.ops.object.camera_add(location=(0, -5.2, 1.35))
    camera = bpy.context.object
    camera.name = "Fuxie_V8_Candidate_Camera"
    camera.rotation_euler = (Vector((0, 0, 1.28)) - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = 2.85
    scene.camera = camera


def make_material() -> bpy.types.Material:
    material = bpy.data.materials.new("Fuxie_V8_Candidate_Teal")
    material.diffuse_color = (0.10, 0.57, 0.68, 1.0)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (0.10, 0.57, 0.68, 1.0)
        bsdf.inputs["Roughness"].default_value = 0.58
    return material


def normalize_meshes(meshes: list[bpy.types.Object]) -> None:
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


def render_candidate(path: Path) -> dict[str, object]:
    clear_scene()
    setup_scene()
    bpy.ops.import_scene.gltf(filepath=str(path))
    meshes = [obj for obj in bpy.context.selected_objects if obj.type == "MESH"]
    if not meshes:
        raise RuntimeError(f"No meshes in {path}")
    material = make_material()
    for obj in meshes:
        obj.name = f"Fuxie_V8_Preview_{path.stem}_{obj.name}"
        obj.data.materials.clear()
        obj.data.materials.append(material)
        try:
            bpy.context.view_layer.objects.active = obj
            obj.select_set(True)
            bpy.ops.object.shade_smooth()
            obj.select_set(False)
        except RuntimeError:
            pass
    normalize_meshes(meshes)
    output = PREVIEW_DIR / f"{path.stem}_preview.png"
    bpy.context.scene.render.image_settings.file_format = "PNG"
    bpy.context.scene.render.filepath = str(output)
    bpy.ops.render.render(write_still=True)
    return {
        "candidate": str(path.relative_to(ROOT)).replace("\\", "/"),
        "preview": str(output.relative_to(ROOT)).replace("\\", "/"),
        "mesh_objects": len(meshes),
        "vertices": sum(len(obj.data.vertices) for obj in meshes),
        "faces": sum(len(obj.data.polygons) for obj in meshes),
        "bytes": path.stat().st_size,
    }


def main() -> None:
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    candidates = sorted(CANDIDATE_DIR.glob("fuxie_hunyuan_v8_c*.glb"))
    report = [render_candidate(path) for path in candidates]
    REPORT_PATH.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
