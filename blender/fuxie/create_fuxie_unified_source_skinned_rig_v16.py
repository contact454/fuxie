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

BASE_SCRIPT = BLENDER_DIR / "create_fuxie_character_v6b_game_rig_cleanup.py"
spec = importlib.util.spec_from_file_location("fuxie_v6b_base", BASE_SCRIPT)
if spec is None or spec.loader is None:
    raise RuntimeError(f"Cannot load base V6B rig script: {BASE_SCRIPT}")
v6b = importlib.util.module_from_spec(spec)
spec.loader.exec_module(v6b)


BLEND_PATH = BLENDER_DIR / "Fuxie_Character_v16_unified_source_skinned_rig.blend"
GLB_PATH = MODEL_DIR / "Fuxie_Character_v16_unified_source_skinned_rig.glb"
FBX_PATH = MODEL_DIR / "Fuxie_Character_v16_unified_source_skinned_rig.fbx"
PREVIEW_PATH = BLENDER_DIR / "Fuxie_preview_v16_unified_source_skinned_rig.png"
MANIFEST_PATH = BLENDER_DIR / "Fuxie_Character_v16_unified_source_skinned_rig_manifest.json"
PUBLIC_GLB_PATH = PUBLIC_LIVE_DIR / "fuxie-unified-source-skinned-rig-v16.glb"
PUBLIC_POSTER_PATH = PUBLIC_LIVE_DIR / "fuxie-unified-source-skinned-rig-v16-poster.png"
PUBLIC_MANIFEST_PATH = PUBLIC_LIVE_DIR / "fuxie-unified-source-skinned-rig-v16.json"
GENERATED_DIR = BLENDER_DIR / "generated" / "v16_unified_source"
UNIFIED_SOURCE_ATLAS = GENERATED_DIR / "Fuxie_V16_UnifiedSourceClean.png"

SOURCE_WIDTH = 330
SOURCE_HEIGHT = 540
GRID_COLS = 54
GRID_ROWS = 88

CLIPS = {
    "idle": {"frames": 120, "description": "60fps unified source mesh idle with breathing, ear focus, and tail sway."},
    "wave": {"frames": 96, "description": "60fps unified source mesh wave with weighted upper-arm/forearm/hand deformation."},
    "talk": {"frames": 120, "description": "60fps talk loop using jaw-weighted vertices on the same source atlas."},
    "listen": {"frames": 120, "description": "60fps head/chest listen tilt with ears and tail moving from the unified mesh."},
    "reward": {"frames": 96, "description": "60fps reward hop with squash/stretch and arm lift."},
    "tryAgain": {"frames": 120, "description": "60fps encouragement nod and hand cue."},
}


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


def ensure_dirs() -> None:
    BLENDER_DIR.mkdir(parents=True, exist_ok=True)
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_LIVE_DIR.mkdir(parents=True, exist_ok=True)
    GENERATED_DIR.mkdir(parents=True, exist_ok=True)


def part_by_name(name: str) -> dict[str, object]:
    for part in v6b.PARTS:
        if part["name"] == name:
            return part
    raise KeyError(name)


PARTS = {str(part["name"]): part for part in v6b.PARTS}


def in_part(name: str, px: float, py: float) -> bool:
    part = PARTS[name]
    rect = part["rect"]
    assert isinstance(rect, tuple)
    x0, y0, x1, y1 = rect
    if not (x0 <= px <= x1 and y0 <= py <= y1):
        return False
    poly = part.get("poly")
    if poly:
        return v6b.point_in_poly(px, py, poly)
    return True


def smooth_weights(chain: list[tuple[str, float]], t: float) -> dict[str, float]:
    if t <= chain[0][1]:
        return {chain[0][0]: 1.0}
    if t >= chain[-1][1]:
        return {chain[-1][0]: 1.0}
    for (bone_a, pos_a), (bone_b, pos_b) in zip(chain, chain[1:]):
        if pos_a <= t <= pos_b:
            span = max(pos_b - pos_a, 1e-6)
            local = (t - pos_a) / span
            eased = local * local * (3.0 - 2.0 * local)
            return {bone_a: 1.0 - eased, bone_b: eased}
    return {chain[-1][0]: 1.0}


def rect_t(name: str, px: float, py: float, mode: str = "vertical") -> float:
    rect = PARTS[name]["rect"]
    assert isinstance(rect, tuple)
    x0, y0, x1, y1 = rect
    if mode == "horizontal":
        return max(0.0, min(1.0, (px - x0) / max(x1 - x0, 1e-6)))
    return max(0.0, min(1.0, (py - y0) / max(y1 - y0, 1e-6)))


def region_weights(px: float, py: float) -> dict[str, float]:
    if in_part("Fuxie_Mouth_TalkOverlay", px, py):
        return {"head": 0.35, "jaw": 0.65}
    if in_part("Fuxie_Chest_Token", px, py):
        return {"chest": 1.0}
    if in_part("Fuxie_Arm_L", px, py):
        return smooth_weights([("upper_arm.L", 0.0), ("forearm.L", 0.52), ("hand.L", 1.0)], rect_t("Fuxie_Arm_L", px, py))
    if in_part("Fuxie_Arm_R", px, py):
        return smooth_weights([("upper_arm.R", 0.0), ("forearm.R", 0.52), ("hand.R", 1.0)], rect_t("Fuxie_Arm_R", px, py))
    if in_part("Fuxie_Leg_L", px, py):
        return smooth_weights([("upper_leg.L", 0.0), ("shin.L", 0.60), ("foot.L", 1.0)], rect_t("Fuxie_Leg_L", px, py))
    if in_part("Fuxie_Leg_R", px, py):
        return smooth_weights([("upper_leg.R", 0.0), ("shin.R", 0.60), ("foot.R", 1.0)], rect_t("Fuxie_Leg_R", px, py))
    if in_part("Fuxie_Tail", px, py):
        return smooth_weights([("tail.01", 0.0), ("tail.02", 0.48), ("tail.03", 1.0)], rect_t("Fuxie_Tail", px, py, "horizontal"))
    if in_part("Fuxie_Body_Hoodie", px, py):
        return smooth_weights([("chest", 0.0), ("spine", 0.55), ("hips", 1.0)], rect_t("Fuxie_Body_Hoodie", px, py))

    if py < 128 and px < 102:
        return {"head": 0.28, "ear.L.01": 0.72}
    if py < 128 and px > 228:
        return {"head": 0.28, "ear.R.01": 0.72}
    if py < 268:
        return {"head": 1.0}
    if py < 396:
        return {"chest": 0.78, "spine": 0.22}
    return {"hips": 0.55, "root": 0.45}


def inside_character_mask(px: float, py: float, alpha: float) -> bool:
    if alpha <= 0.035:
        return False
    for name in [
        "Fuxie_Head",
        "Fuxie_Body_Hoodie",
        "Fuxie_Arm_L",
        "Fuxie_Arm_R",
        "Fuxie_Leg_L",
        "Fuxie_Leg_R",
        "Fuxie_Tail",
        "Fuxie_Mouth_TalkOverlay",
        "Fuxie_Chest_Token",
    ]:
        if in_part(name, px, py):
            return True
    return False


def write_clean_source_atlas() -> Path:
    source = bpy.data.images.load(str(v6b.SOURCE_REFERENCE), check_existing=True)
    source.alpha_mode = "STRAIGHT"
    source_width, source_height = source.size
    source_pixels = list(source.pixels)
    cleaned_pixels: list[float] = []

    for row_from_bottom in range(source_height):
        py = source_height - 1 - row_from_bottom
        for px in range(source_width):
            index = (row_from_bottom * source_width + px) * 4
            r, g, b, a = source_pixels[index:index + 4]
            if inside_character_mask(px + 0.5, py + 0.5, a):
                cleaned_pixels.extend([r, g, b, a])
            else:
                cleaned_pixels.extend([r, g, b, 0.0])

    cleaned = bpy.data.images.new("Fuxie_V16_UnifiedSourceClean", width=source_width, height=source_height, alpha=True)
    cleaned.pixels.foreach_set(cleaned_pixels)
    cleaned.filepath_raw = str(UNIFIED_SOURCE_ATLAS)
    cleaned.file_format = "PNG"
    cleaned.save()
    return UNIFIED_SOURCE_ATLAS


def source_material() -> bpy.types.Material:
    mat = bpy.data.materials.new("Fuxie_V16_UnifiedSource_Material")
    mat.use_nodes = True
    mat.blend_method = "BLEND"
    if hasattr(mat, "surface_render_method"):
        mat.surface_render_method = "BLENDED"
    if hasattr(mat, "show_transparent_back"):
        mat.show_transparent_back = False
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    image_node = nodes.new("ShaderNodeTexImage")
    image_node.name = "Fuxie_V16_UnifiedSource_Texture"
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


def create_unified_mesh(collection: bpy.types.Collection, armature: bpy.types.Object) -> bpy.types.Object:
    scale = v6b.SCALE
    verts: list[tuple[float, float, float]] = []
    uvs: list[tuple[float, float]] = []
    pixels: list[tuple[float, float]] = []

    for row in range(GRID_ROWS + 1):
        v = row / GRID_ROWS
        py = SOURCE_HEIGHT * (1.0 - v)
        for col in range(GRID_COLS + 1):
            u = col / GRID_COLS
            px = SOURCE_WIDTH * u
            x = (px - SOURCE_WIDTH / 2) * scale
            z = (SOURCE_HEIGHT - py) * scale
            crown = math.sin(math.pi * u) * math.sin(math.pi * v) * 0.012
            verts.append((x, -0.012 - crown, z))
            uvs.append((u, v))
            pixels.append((px, py))

    faces: list[tuple[int, int, int, int]] = []
    for row in range(GRID_ROWS):
        for col in range(GRID_COLS):
            i = row * (GRID_COLS + 1) + col
            faces.append((i, i + 1, i + GRID_COLS + 2, i + GRID_COLS + 1))

    mesh = bpy.data.meshes.new("Fuxie_V16_UnifiedSourceSkinned_Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    uv_layer = mesh.uv_layers.new(name="Fuxie_V16_UnifiedSourceUV")
    for polygon in mesh.polygons:
        for loop_index in polygon.loop_indices:
            uv_layer.data[loop_index].uv = uvs[mesh.loops[loop_index].vertex_index]

    obj = bpy.data.objects.new("Fuxie_V16_UnifiedSourceSkinned", mesh)
    obj.data.materials.append(source_material())
    obj["fuxie_v16_role"] = "single_atlas_full_body_skinned_mesh_no_part_seams"
    collection.objects.link(obj)

    group_cache: dict[str, bpy.types.VertexGroup] = {}
    for vertex in obj.data.vertices:
        px, py = pixels[vertex.index]
        for bone, weight in region_weights(px, py).items():
            group = group_cache.get(bone)
            if group is None:
                group = obj.vertex_groups.new(name=bone)
                group_cache[bone] = group
            group.add([vertex.index], weight, "ADD")

    modifier = obj.modifiers.new(name="Fuxie_V16_UnifiedSource_Armature_Deform", type="ARMATURE")
    modifier.object = armature
    obj.parent = armature
    return obj


def rename_armature(armature: bpy.types.Object) -> None:
    armature.name = "Fuxie_V16_UnifiedSourceSkinnedRig_Armature"
    armature.data.name = "Fuxie_V16_UnifiedSourceSkinnedRig_Skeleton"


def key_bone(armature: bpy.types.Object, bone_name: str, frame: int, loc=None, rot=None, scale=None) -> None:
    v6b.key_bone(armature, bone_name, frame, loc=loc, rot=rot, scale=scale)


def make_clip(armature: bpy.types.Object, name: str, frames: int, animator) -> None:
    v6b.make_clip(armature, name, frames, animator)


def animate(armature: bpy.types.Object) -> None:
    def idle() -> None:
        for frame, lift, body, head, tail, ear in [
            (1, 0.00, 0.00, 0.00, 0.00, 0.00),
            (30, 0.022, -0.009, 0.011, 0.09, 0.05),
            (60, 0.00, 0.00, 0.00, -0.02, 0.00),
            (90, 0.022, 0.009, -0.011, -0.09, -0.05),
            (120, 0.00, 0.00, 0.00, 0.00, 0.00),
        ]:
            key_bone(armature, "root", frame, loc=(0, 0, lift), rot=(0, 0, body), scale=(1, 1 + lift * 0.38, 1))
            key_bone(armature, "head", frame, rot=(0, 0, head))
            key_bone(armature, "tail.01", frame, rot=(0, 0, tail * 0.35))
            key_bone(armature, "tail.02", frame, rot=(0, 0, tail))
            key_bone(armature, "tail.03", frame, rot=(0, 0, tail * 0.78))
            key_bone(armature, "ear.L.01", frame, rot=(0, 0, -ear))
            key_bone(armature, "ear.R.01", frame, rot=(0, 0, ear))

    def wave() -> None:
        for frame, upper, fore, hand, body, lift in [
            (1, 0.00, 0.00, 0.00, 0.00, 0.00),
            (12, -0.20, -0.46, -0.15, -0.025, 0.020),
            (24, -0.38, -0.86, 0.36, 0.020, 0.042),
            (36, -0.30, -0.64, -0.30, -0.018, 0.018),
            (48, -0.42, -0.94, 0.42, 0.022, 0.042),
            (60, -0.30, -0.64, -0.30, -0.018, 0.018),
            (72, -0.38, -0.86, 0.36, 0.022, 0.036),
            (96, 0.00, 0.00, 0.00, 0.00, 0.00),
        ]:
            key_bone(armature, "root", frame, loc=(0, 0, lift), rot=(0, 0, body), scale=(1, 1 + lift * 0.30, 1))
            key_bone(armature, "upper_arm.L", frame, rot=(0, 0, upper))
            key_bone(armature, "forearm.L", frame, rot=(0, 0, fore))
            key_bone(armature, "hand.L", frame, rot=(0, 0, hand))
            key_bone(armature, "head", frame, rot=(0, 0, -body * 0.55))
            key_bone(armature, "tail.02", frame, rot=(0, 0, -body * 2.0))
            key_bone(armature, "tail.03", frame, rot=(0, 0, -body * 1.6))

    def talk() -> None:
        for frame in range(1, 121, 8):
            phase = frame // 8
            open_mouth = 1.0 + (0.16 if phase % 2 else 0.0)
            nod = 0.018 * math.sin(frame * 0.18)
            gesture = 0.09 * math.sin(frame * 0.26)
            key_bone(armature, "root", frame, loc=(0, 0, 0.010 if phase % 2 else 0.0))
            key_bone(armature, "head", frame, rot=(0, 0, nod))
            key_bone(armature, "jaw", frame, loc=(0, 0, -0.012 if phase % 2 else 0.0), scale=(1.0, open_mouth, 1.0))
            key_bone(armature, "upper_arm.R", frame, rot=(0, 0, gesture * 0.42))
            key_bone(armature, "forearm.R", frame, rot=(0, 0, gesture))

    def listen() -> None:
        for frame, head, chest, ear_l, ear_r, tail in [
            (1, 0.00, 0.00, 0.00, 0.00, 0.00),
            (25, -0.10, -0.026, 0.10, 0.05, 0.08),
            (60, -0.15, -0.038, 0.17, 0.08, -0.05),
            (95, -0.10, -0.026, 0.10, 0.05, 0.08),
            (120, 0.00, 0.00, 0.00, 0.00, 0.00),
        ]:
            key_bone(armature, "head", frame, rot=(0, 0, head))
            key_bone(armature, "chest", frame, rot=(0, 0, chest))
            key_bone(armature, "ear.L.01", frame, rot=(0, 0, ear_l))
            key_bone(armature, "ear.R.01", frame, rot=(0, 0, ear_r))
            key_bone(armature, "tail.01", frame, rot=(0, 0, tail * 0.42))
            key_bone(armature, "tail.02", frame, rot=(0, 0, tail))
            key_bone(armature, "tail.03", frame, rot=(0, 0, tail * 0.72))

    def reward() -> None:
        for frame, lift, squash, arm_l, arm_r, fore_l, fore_r, tail in [
            (1, 0.00, 1.00, 0.00, 0.00, 0.00, 0.00, 0.00),
            (12, -0.018, 0.96, -0.06, 0.06, -0.14, 0.14, -0.14),
            (24, 0.110, 1.07, -0.40, 0.40, -0.70, 0.70, 0.30),
            (36, 0.020, 0.98, -0.24, 0.24, -0.46, 0.46, -0.30),
            (48, 0.085, 1.05, -0.42, 0.42, -0.78, 0.78, 0.30),
            (72, 0.020, 0.99, -0.18, 0.18, -0.30, 0.30, -0.16),
            (96, 0.00, 1.00, 0.00, 0.00, 0.00, 0.00, 0.00),
        ]:
            key_bone(armature, "root", frame, loc=(0, 0, lift), scale=(1 / squash, squash, 1), rot=(0, 0, 0.035 * math.sin(frame)))
            key_bone(armature, "upper_arm.L", frame, rot=(0, 0, arm_l))
            key_bone(armature, "upper_arm.R", frame, rot=(0, 0, arm_r))
            key_bone(armature, "forearm.L", frame, rot=(0, 0, fore_l))
            key_bone(armature, "forearm.R", frame, rot=(0, 0, fore_r))
            key_bone(armature, "head", frame, rot=(0, 0, -0.045 * math.sin(frame * 0.22)))
            key_bone(armature, "tail.02", frame, rot=(0, 0, tail))
            key_bone(armature, "tail.03", frame, rot=(0, 0, tail * 0.85))

    def try_again() -> None:
        for frame, nod, upper, fore, hand, tail in [
            (1, 0.00, 0.00, 0.00, 0.00, 0.00),
            (30, 0.045, -0.03, -0.14, -0.04, 0.06),
            (60, -0.028, 0.035, 0.10, 0.035, -0.04),
            (90, 0.035, -0.02, -0.09, -0.03, 0.05),
            (120, 0.00, 0.00, 0.00, 0.00, 0.00),
        ]:
            key_bone(armature, "head", frame, rot=(0, 0, nod))
            key_bone(armature, "upper_arm.L", frame, rot=(0, 0, upper))
            key_bone(armature, "forearm.L", frame, rot=(0, 0, fore))
            key_bone(armature, "hand.L", frame, rot=(0, 0, hand))
            key_bone(armature, "tail.02", frame, rot=(0, 0, tail))

    make_clip(armature, "idle", 120, idle)
    make_clip(armature, "wave", 96, wave)
    make_clip(armature, "talk", 120, talk)
    make_clip(armature, "listen", 120, listen)
    make_clip(armature, "reward", 96, reward)
    make_clip(armature, "tryAgain", 120, try_again)


def setup_scene() -> None:
    v6b.setup_scene()
    bpy.context.scene.render.fps = 60
    bpy.context.scene.camera.name = "Fuxie_V16_UnifiedSourceSkinnedRig_Camera"
    bpy.context.scene.camera.data.ortho_scale = 3.05


def add_reference_planes(reference_collection: bpy.types.Collection) -> None:
    refs = [
        ("Fuxie_V16_Reference_Front", v6b.FRONT_REFERENCE, 2.55, (-2.12, 0.24, 0.04)),
        ("Fuxie_V16_Reference_ThreeQuarter", v6b.THREE_QUARTER_REFERENCE, 2.55, (2.12, 0.24, 0.04)),
        ("Fuxie_V16_Reference_Faces", v6b.FACES_REFERENCE, 1.0, (0, 0.24, 2.86)),
        ("Fuxie_V16_Reference_Tail", v6b.TAIL_REFERENCE, 0.82, (0, 0.24, -0.98)),
    ]
    for name, path, height, location in refs:
        if Path(path).exists():
            v6b.add_reference_plane(name, path, height, location, reference_collection)


def write_manifest(character_collection: bpy.types.Collection, reference_collection: bpy.types.Collection) -> None:
    meshes = [obj for obj in character_collection.objects if obj.type == "MESH"]
    armature = next((obj for obj in character_collection.objects if obj.type == "ARMATURE"), None)
    manifest = {
        "name": "Fuxie_Character_v16_unified_source_skinned_rig",
        "status": "unified_source_identity_skinned_rig_candidate",
        "source_note": "V16 keeps the approved Fuxie 3D render as one full-body source atlas on a single subdivided skinned mesh. This removes most visible part seams from V15 while preserving real armature skinning. It is still a 2.5D source-locked approximation, not a recovered original 3D mesh.",
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
            "target_runtime": "60fps WebGL unified source mesh with skin weights",
        },
        "limits": [
            "V16 removes most source-layer seams, but it remains a flat source-locked mesh rather than a full 3D sculpt.",
            "Large rotations can still stretch the source image because hidden side surfaces do not exist.",
            "The next quality step is manual weight-paint polish or a true generated/retopologized 3D volume with UVs painted from this source.",
        ],
        "next_step": "Browser QA V16 against V15/V14/V6B, then tune weights if the unified no-seam identity pass is accepted.",
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
    setup_scene()

    character_collection = v6b.make_collection("Fuxie_V16_UnifiedSourceSkinnedRig_Export")
    reference_collection = v6b.make_collection("Fuxie_V16_Source_References")
    write_clean_source_atlas()
    armature = v6b.create_armature(character_collection)
    rename_armature(armature)

    create_unified_mesh(character_collection, armature)
    shadow = v6b.add_shadow(character_collection)
    v6b.bind_to_bone(shadow, armature, "root")

    add_reference_planes(reference_collection)
    animate(armature)
    v6b.export_assets(character_collection)
    write_manifest(character_collection, reference_collection)
    copy_public_assets()
    print(f"Saved V16 unified source skinned rig Blender file: {BLEND_PATH}")
    print(f"Exported V16 unified source skinned rig GLB: {GLB_PATH}")
    print(f"Exported V16 unified source skinned rig FBX: {FBX_PATH}")
    print(f"Rendered V16 unified source skinned rig preview: {PREVIEW_PATH}")


if __name__ == "__main__":
    main()
