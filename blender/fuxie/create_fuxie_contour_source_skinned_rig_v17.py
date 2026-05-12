from __future__ import annotations

import importlib.util
import json
import math
import shutil
from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
BLENDER_DIR = ROOT / "blender" / "fuxie"
MODEL_DIR = ROOT / "assets" / "models"
PUBLIC_LIVE_DIR = ROOT / "apps" / "web" / "public" / "mascot-3d" / "live"

V16_SCRIPT = BLENDER_DIR / "create_fuxie_unified_source_skinned_rig_v16.py"
spec = importlib.util.spec_from_file_location("fuxie_v16_base", V16_SCRIPT)
if spec is None or spec.loader is None:
    raise RuntimeError(f"Cannot load V16 base rig script: {V16_SCRIPT}")
v16 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(v16)
v6b = v16.v6b


BLEND_PATH = BLENDER_DIR / "Fuxie_Character_v17_contour_source_skinned_rig.blend"
GLB_PATH = MODEL_DIR / "Fuxie_Character_v17_contour_source_skinned_rig.glb"
FBX_PATH = MODEL_DIR / "Fuxie_Character_v17_contour_source_skinned_rig.fbx"
PREVIEW_PATH = BLENDER_DIR / "Fuxie_preview_v17_contour_source_skinned_rig.png"
MANIFEST_PATH = BLENDER_DIR / "Fuxie_Character_v17_contour_source_skinned_rig_manifest.json"
PUBLIC_GLB_PATH = PUBLIC_LIVE_DIR / "fuxie-contour-source-skinned-rig-v17.glb"
PUBLIC_POSTER_PATH = PUBLIC_LIVE_DIR / "fuxie-contour-source-skinned-rig-v17-poster.png"
PUBLIC_MANIFEST_PATH = PUBLIC_LIVE_DIR / "fuxie-contour-source-skinned-rig-v17.json"
GENERATED_DIR = BLENDER_DIR / "generated" / "v17_contour_source"
UNIFIED_SOURCE_ATLAS = GENERATED_DIR / "Fuxie_V17_ContourSourceClean.png"

SOURCE_WIDTH = v16.SOURCE_WIDTH
SOURCE_HEIGHT = v16.SOURCE_HEIGHT
GRID_COLS = 66
GRID_ROWS = 108
CLIPS = v16.CLIPS


def install_globals() -> None:
    v6b.BLEND_PATH = BLEND_PATH
    v6b.GLB_PATH = GLB_PATH
    v6b.FBX_PATH = FBX_PATH
    v6b.PREVIEW_PATH = PREVIEW_PATH
    v6b.MANIFEST_PATH = MANIFEST_PATH
    v6b.PUBLIC_GLB_PATH = PUBLIC_GLB_PATH
    v6b.PUBLIC_POSTER_PATH = PUBLIC_POSTER_PATH
    v6b.PUBLIC_MANIFEST_PATH = PUBLIC_MANIFEST_PATH
    v6b.CLIPS = CLIPS
    v16.UNIFIED_SOURCE_ATLAS = UNIFIED_SOURCE_ATLAS


def ensure_dirs() -> None:
    BLENDER_DIR.mkdir(parents=True, exist_ok=True)
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_LIVE_DIR.mkdir(parents=True, exist_ok=True)
    GENERATED_DIR.mkdir(parents=True, exist_ok=True)


def source_material() -> bpy.types.Material:
    mat = bpy.data.materials.new("Fuxie_V17_ContourSource_Material")
    mat.use_nodes = True
    mat.blend_method = "BLEND"
    if hasattr(mat, "surface_render_method"):
        mat.surface_render_method = "BLENDED"
    if hasattr(mat, "show_transparent_back"):
        mat.show_transparent_back = False
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    image_node = nodes.new("ShaderNodeTexImage")
    image_node.name = "Fuxie_V17_ContourSource_Texture"
    image_node.image = bpy.data.images.load(str(UNIFIED_SOURCE_ATLAS), check_existing=True)
    image_node.image.alpha_mode = "STRAIGHT"
    image_node.extension = "CLIP"
    if bsdf:
        mat.node_tree.links.new(image_node.outputs["Color"], bsdf.inputs["Base Color"])
        mat.node_tree.links.new(image_node.outputs["Alpha"], bsdf.inputs["Alpha"])
        bsdf.inputs["Roughness"].default_value = 0.82
        if "Metallic" in bsdf.inputs:
            bsdf.inputs["Metallic"].default_value = 0.0
    return mat


def cell_visible(col: int, row: int) -> bool:
    samples = [
        ((col + 0.50) / GRID_COLS, (row + 0.50) / GRID_ROWS),
        ((col + 0.22) / GRID_COLS, (row + 0.22) / GRID_ROWS),
        ((col + 0.78) / GRID_COLS, (row + 0.22) / GRID_ROWS),
        ((col + 0.22) / GRID_COLS, (row + 0.78) / GRID_ROWS),
        ((col + 0.78) / GRID_COLS, (row + 0.78) / GRID_ROWS),
    ]
    hits = 0
    for u, v in samples:
        px = SOURCE_WIDTH * u
        py = SOURCE_HEIGHT * (1.0 - v)
        if v16.inside_character_mask(px, py, 1.0):
            hits += 1
    return hits >= 2


def create_contour_mesh(collection: bpy.types.Collection, armature: bpy.types.Object) -> bpy.types.Object:
    scale = v6b.SCALE
    used: dict[tuple[int, int], int] = {}
    verts: list[tuple[float, float, float]] = []
    uvs: list[tuple[float, float]] = []
    pixels: list[tuple[float, float]] = []
    faces: list[tuple[int, int, int, int]] = []

    def add_vertex(col: int, row: int) -> int:
        key = (col, row)
        existing = used.get(key)
        if existing is not None:
            return existing
        u = col / GRID_COLS
        v = row / GRID_ROWS
        px = SOURCE_WIDTH * u
        py = SOURCE_HEIGHT * (1.0 - v)
        x = (px - SOURCE_WIDTH / 2) * scale
        z = (SOURCE_HEIGHT - py) * scale
        crown = math.sin(math.pi * u) * math.sin(math.pi * v) * 0.014
        index = len(verts)
        used[key] = index
        verts.append((x, -0.012 - crown, z))
        uvs.append((u, v))
        pixels.append((px, py))
        return index

    for row in range(GRID_ROWS):
        for col in range(GRID_COLS):
            if not cell_visible(col, row):
                continue
            faces.append((
                add_vertex(col, row),
                add_vertex(col + 1, row),
                add_vertex(col + 1, row + 1),
                add_vertex(col, row + 1),
            ))

    mesh = bpy.data.meshes.new("Fuxie_V17_ContourSourceSkinned_Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    uv_layer = mesh.uv_layers.new(name="Fuxie_V17_ContourSourceUV")
    for polygon in mesh.polygons:
        for loop_index in polygon.loop_indices:
            uv_layer.data[loop_index].uv = uvs[mesh.loops[loop_index].vertex_index]

    obj = bpy.data.objects.new("Fuxie_V17_ContourSourceSkinned", mesh)
    obj.data.materials.append(source_material())
    obj["fuxie_v17_role"] = "single_source_atlas_contour_cut_skinned_mesh"
    collection.objects.link(obj)

    group_cache: dict[str, bpy.types.VertexGroup] = {}
    for vertex in obj.data.vertices:
        px, py = pixels[vertex.index]
        for bone, weight in v16.region_weights(px, py).items():
            group = group_cache.get(bone)
            if group is None:
                group = obj.vertex_groups.new(name=bone)
                group_cache[bone] = group
            group.add([vertex.index], weight, "ADD")

    modifier = obj.modifiers.new(name="Fuxie_V17_ContourSource_Armature_Deform", type="ARMATURE")
    modifier.object = armature
    obj.parent = armature
    return obj


def write_manifest(character_collection: bpy.types.Collection, reference_collection: bpy.types.Collection) -> None:
    meshes = [obj for obj in character_collection.objects if obj.type == "MESH"]
    armature = next((obj for obj in character_collection.objects if obj.type == "ARMATURE"), None)
    manifest = {
        "name": "Fuxie_Character_v17_contour_source_skinned_rig",
        "status": "contour_cut_source_identity_skinned_rig_candidate",
        "source_note": "V17 keeps the approved Fuxie 3D render as a single source atlas, but cuts the skinned mesh to the character silhouette instead of exporting the full rectangular atlas plane. This preserves V16 identity, reduces empty alpha geometry, and is better for game-style rig QA. It is still a 2.5D approximation, not a recovered original 3D mesh.",
        "references": [
            str(path.relative_to(ROOT)).replace("\\", "/")
            for path in [
                v6b.SOURCE_REFERENCE,
                v6b.FRONT_REFERENCE,
                v6b.THREE_QUARTER_REFERENCE,
                v6b.SIDE_REFERENCE,
                v6b.BACK_REFERENCE,
                v6b.FACES_REFERENCE,
                v6b.TAIL_REFERENCE,
            ]
            if Path(path).exists()
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
            "grid": {"cols": GRID_COLS, "rows": GRID_ROWS},
            "source_atlas": str(v6b.SOURCE_REFERENCE.relative_to(ROOT)).replace("\\", "/"),
            "cleaned_source_atlas": str(UNIFIED_SOURCE_ATLAS.relative_to(ROOT)).replace("\\", "/"),
            "reference_planes": [obj.name for obj in reference_collection.objects],
            "fps": bpy.context.scene.render.fps,
            "clips": CLIPS,
            "target_runtime": "60fps WebGL contour-cut source mesh with skin weights",
        },
        "limits": [
            "V17 is cleaner than V16 for silhouette/empty geometry, but still only has front-source surfaces.",
            "Strong rotations can still stretch because hidden side/back volume is not reconstructed.",
            "Next production step remains manual/full-volume modeling or image-to-3D retopo using this approved identity as texture guide.",
        ],
        "next_step": "Browser QA V17 against V16. If V17 reads cleaner visually and keeps 60fps, use it as the current candidate.",
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")


def copy_public_assets() -> None:
    shutil.copy2(GLB_PATH, PUBLIC_GLB_PATH)
    shutil.copy2(PREVIEW_PATH, PUBLIC_POSTER_PATH)
    shutil.copy2(MANIFEST_PATH, PUBLIC_MANIFEST_PATH)


def main() -> None:
    install_globals()
    ensure_dirs()
    v6b.clear_scene()
    v16.setup_scene()

    character_collection = v6b.make_collection("Fuxie_V17_ContourSourceSkinnedRig_Export")
    reference_collection = v6b.make_collection("Fuxie_V17_Source_References")
    v16.write_clean_source_atlas()
    armature = v6b.create_armature(character_collection)
    v16.rename_armature(armature)
    armature.name = "Fuxie_V17_ContourSourceSkinnedRig_Armature"
    armature.data.name = "Fuxie_V17_ContourSourceSkinnedRig_Skeleton"

    create_contour_mesh(character_collection, armature)
    shadow = v6b.add_shadow(character_collection)
    v6b.bind_to_bone(shadow, armature, "root")

    v16.add_reference_planes(reference_collection)
    v16.animate(armature)
    v6b.export_assets(character_collection)
    write_manifest(character_collection, reference_collection)
    copy_public_assets()
    print(f"Saved V17 contour source skinned rig Blender file: {BLEND_PATH}")
    print(f"Exported V17 contour source skinned rig GLB: {GLB_PATH}")
    print(f"Exported V17 contour source skinned rig FBX: {FBX_PATH}")
    print(f"Rendered V17 contour source skinned rig preview: {PREVIEW_PATH}")


if __name__ == "__main__":
    main()
