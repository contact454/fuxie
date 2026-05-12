from __future__ import annotations

import importlib.util
import json
import math
import shutil
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
BLENDER_DIR = ROOT / "blender" / "fuxie"
MODEL_DIR = ROOT / "assets" / "models"
PUBLIC_LIVE_DIR = ROOT / "apps" / "web" / "public" / "mascot-3d" / "live"
BASE_SCRIPT = BLENDER_DIR / "create_fuxie_character_v7_true_mesh_rig.py"


def load_base():
    spec = importlib.util.spec_from_file_location("fuxie_v7_base", BASE_SCRIPT)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load base V7 script: {BASE_SCRIPT}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


v7 = load_base()

REFERENCE_DIR = BLENDER_DIR / "references"
FRONT_REFERENCE = REFERENCE_DIR / "fuxie_ref_front.png"
THREE_QUARTER_REFERENCE = REFERENCE_DIR / "fuxie_ref_three_quarter.png"
SIDE_REFERENCE = REFERENCE_DIR / "fuxie_ref_side.png"
BACK_REFERENCE = REFERENCE_DIR / "fuxie_ref_back.png"
FACES_REFERENCE = REFERENCE_DIR / "fuxie_ref_faces.png"
TAIL_REFERENCE = REFERENCE_DIR / "fuxie_ref_tail_material.png"

BLEND_PATH = BLENDER_DIR / "Fuxie_Character_v13_deform_rig.blend"
GLB_PATH = MODEL_DIR / "Fuxie_Character_v13_deform_rig.glb"
FBX_PATH = MODEL_DIR / "Fuxie_Character_v13_deform_rig.fbx"
PREVIEW_PATH = BLENDER_DIR / "Fuxie_preview_v13_deform_rig.png"
MANIFEST_PATH = BLENDER_DIR / "Fuxie_Character_v13_deform_rig_manifest.json"
PUBLIC_GLB_PATH = PUBLIC_LIVE_DIR / "fuxie-deform-rig-v13.glb"
PUBLIC_POSTER_PATH = PUBLIC_LIVE_DIR / "fuxie-deform-rig-v13-poster.png"
PUBLIC_MANIFEST_PATH = PUBLIC_LIVE_DIR / "fuxie-deform-rig-v13.json"

CLIPS = {
    "idle": {"frames": 120, "description": "60fps deform rig idle with breathing, head bob, ear twitch, and tail sway."},
    "wave": {"frames": 96, "description": "60fps deform rig wave: upper arm, forearm, wrist, and torso counter-motion."},
    "talk": {"frames": 120, "description": "60fps talk loop with jaw mesh motion, head nod, and natural hand cue."},
    "listen": {"frames": 120, "description": "60fps listen with head tilt, ear focus, and soft tail chain motion."},
    "reward": {"frames": 96, "description": "60fps reward hop with squash/stretch and arm-chain lift."},
    "tryAgain": {"frames": 120, "description": "60fps encouraging nod with subtle arm and tail chain motion."},
}

COLORS = {
    **v7.COLORS,
    "tongue": (0.78, 0.28, 0.24, 1.0),
    "shadow": (0.02, 0.12, 0.18, 0.22),
}


def install_globals() -> None:
    v7.FRONT_REFERENCE = FRONT_REFERENCE
    v7.THREE_QUARTER_REFERENCE = THREE_QUARTER_REFERENCE
    v7.SIDE_REFERENCE = SIDE_REFERENCE
    v7.BACK_REFERENCE = BACK_REFERENCE
    v7.FACES_REFERENCE = FACES_REFERENCE
    v7.TAIL_REFERENCE = TAIL_REFERENCE
    v7.BLEND_PATH = BLEND_PATH
    v7.GLB_PATH = GLB_PATH
    v7.FBX_PATH = FBX_PATH
    v7.PREVIEW_PATH = PREVIEW_PATH
    v7.MANIFEST_PATH = MANIFEST_PATH
    v7.PUBLIC_GLB_PATH = PUBLIC_GLB_PATH
    v7.PUBLIC_POSTER_PATH = PUBLIC_POSTER_PATH
    v7.PUBLIC_MANIFEST_PATH = PUBLIC_MANIFEST_PATH
    v7.CLIPS = CLIPS


def ensure_dirs() -> None:
    BLENDER_DIR.mkdir(parents=True, exist_ok=True)
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_LIVE_DIR.mkdir(parents=True, exist_ok=True)


def rename_armature(armature: bpy.types.Object) -> None:
    armature.name = "Fuxie_V13_DeformRig_Armature"
    armature.data.name = "Fuxie_V13_DeformRig_Skeleton"


def add_armature_modifier(obj: bpy.types.Object, armature: bpy.types.Object) -> None:
    modifier = obj.modifiers.new(name="Fuxie_V13_DeformRig_Armature", type="ARMATURE")
    modifier.object = armature
    obj.parent = armature


def bind_whole_mesh(obj: bpy.types.Object, armature: bpy.types.Object, bone_name: str) -> bpy.types.Object:
    group = obj.vertex_groups.new(name=bone_name)
    group.add([vertex.index for vertex in obj.data.vertices], 1.0, "ADD")
    add_armature_modifier(obj, armature)
    return obj


def add_bound_sphere(
    name: str,
    loc: tuple[float, float, float],
    scale: tuple[float, float, float],
    mat: bpy.types.Material,
    collection: bpy.types.Collection,
    armature: bpy.types.Object,
    bone_name: str,
    segments: int = 28,
    rings: int = 14,
) -> bpy.types.Object:
    obj = v7.add_uv_sphere(name, loc, scale, mat, collection, segments, rings)
    return bind_whole_mesh(obj, armature, bone_name)


def add_bound_cube(
    name: str,
    loc: tuple[float, float, float],
    scale: tuple[float, float, float],
    mat: bpy.types.Material,
    collection: bpy.types.Collection,
    armature: bpy.types.Object,
    bone_name: str,
    bevel: float = 0.02,
) -> bpy.types.Object:
    obj = v7.add_cube(name, loc, scale, mat, collection, bevel)
    return bind_whole_mesh(obj, armature, bone_name)


def add_bound_cone(
    name: str,
    loc: tuple[float, float, float],
    radius1: float,
    depth: float,
    mat: bpy.types.Material,
    collection: bpy.types.Collection,
    armature: bpy.types.Object,
    bone_name: str,
    rotation: tuple[float, float, float],
    vertices: int = 40,
) -> bpy.types.Object:
    obj = v7.add_cone(name, loc, radius1, depth, mat, collection, rotation, vertices)
    return bind_whole_mesh(obj, armature, bone_name)


def add_bound_torus(
    name: str,
    loc: tuple[float, float, float],
    major_radius: float,
    minor_radius: float,
    mat: bpy.types.Material,
    collection: bpy.types.Collection,
    armature: bpy.types.Object,
    bone_name: str,
    rotation: tuple[float, float, float],
) -> bpy.types.Object:
    obj = v7.add_torus(name, loc, major_radius, minor_radius, mat, collection, rotation)
    return bind_whole_mesh(obj, armature, bone_name)


def lerp_vector(a: Vector, b: Vector, t: float) -> Vector:
    return a.lerp(b, max(0.0, min(1.0, t)))


def chain_position(points: list[Vector], distances: list[float], distance: float) -> tuple[Vector, int, float]:
    if distance <= 0:
        return points[0], 0, 0.0
    for index in range(len(points) - 1):
        start = distances[index]
        end = distances[index + 1]
        if distance <= end or index == len(points) - 2:
            t = (distance - start) / max(end - start, 1e-6)
            return lerp_vector(points[index], points[index + 1], t), index, t
    return points[-1], len(points) - 2, 1.0


def ring_weights(bones: list[str], segment_index: int, segment_t: float, blend_zone: float = 0.32) -> dict[str, float]:
    weights = {bones[segment_index]: 1.0}
    if segment_t < blend_zone and segment_index > 0:
        w_prev = (blend_zone - segment_t) / blend_zone * 0.50
        weights[bones[segment_index]] = 1.0 - w_prev
        weights[bones[segment_index - 1]] = w_prev
    if segment_t > 1.0 - blend_zone and segment_index < len(bones) - 1:
        w_next = (segment_t - (1.0 - blend_zone)) / blend_zone * 0.50
        weights[bones[segment_index]] = 1.0 - w_next
        weights[bones[segment_index + 1]] = w_next
    return weights


def add_deform_tube(
    name: str,
    points_raw: list[tuple[float, float, float]],
    bones: list[str],
    radii: list[tuple[float, float]],
    mat: bpy.types.Material,
    collection: bpy.types.Collection,
    armature: bpy.types.Object,
    ring_count: int = 18,
    sides: int = 14,
) -> bpy.types.Object:
    points = [Vector(point) for point in points_raw]
    distances = [0.0]
    for index in range(1, len(points)):
        distances.append(distances[-1] + (points[index] - points[index - 1]).length)
    total = distances[-1]
    verts: list[tuple[float, float, float]] = []
    faces: list[tuple[int, ...]] = []
    weights_by_vertex: list[dict[str, float]] = []

    for ring_index in range(ring_count):
        distance = total * ring_index / max(ring_count - 1, 1)
        position, segment_index, segment_t = chain_position(points, distances, distance)
        prev_point = chain_position(points, distances, max(0.0, distance - 0.02))[0]
        next_point = chain_position(points, distances, min(total, distance + 0.02))[0]
        tangent = (next_point - prev_point).normalized()
        depth_axis = Vector((0.0, 1.0, 0.0))
        width_axis = depth_axis.cross(tangent)
        if width_axis.length < 1e-5:
            width_axis = Vector((1.0, 0.0, 0.0))
        width_axis.normalize()
        local_r0 = radii[segment_index]
        local_r1 = radii[min(segment_index + 1, len(radii) - 1)]
        radius_width = local_r0[0] + (local_r1[0] - local_r0[0]) * segment_t
        radius_depth = local_r0[1] + (local_r1[1] - local_r0[1]) * segment_t
        # Tiny taper at caps avoids blocky ends without needing separate cutout caps.
        cap_scale = min(1.0, max(0.35, min(ring_index + 1, ring_count - ring_index) / 3.0))
        for side_index in range(sides):
            angle = math.tau * side_index / sides
            offset = width_axis * (math.cos(angle) * radius_width * cap_scale)
            offset += depth_axis * (math.sin(angle) * radius_depth * cap_scale)
            verts.append(tuple(position + offset))
            weights_by_vertex.append(ring_weights(bones, segment_index, segment_t))

    for ring_index in range(ring_count - 1):
        for side_index in range(sides):
            current = ring_index * sides + side_index
            right = ring_index * sides + (side_index + 1) % sides
            next_current = (ring_index + 1) * sides + side_index
            next_right = (ring_index + 1) * sides + (side_index + 1) % sides
            faces.append((current, next_current, next_right, right))
    faces.append(tuple(range(sides - 1, -1, -1)))
    start = (ring_count - 1) * sides
    faces.append(tuple(start + side_index for side_index in range(sides)))

    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    obj.data.materials.append(mat)
    collection.objects.link(obj)
    for bone_name in bones:
        obj.vertex_groups.new(name=bone_name)
    for vertex_index, weights in enumerate(weights_by_vertex):
        for bone_name, weight in weights.items():
            obj.vertex_groups[bone_name].add([vertex_index], weight, "ADD")
    add_armature_modifier(obj, armature)
    v7.shade_smooth(obj)
    obj["fuxie_v13_deformation"] = "multi-ring mesh with blended bone weights"
    return obj


def create_deform_character(collection: bpy.types.Collection, armature: bpy.types.Object) -> list[bpy.types.Object]:
    mats = {key: v7.material(f"Fuxie_V13_{key}", value) for key, value in COLORS.items()}
    objects: list[bpy.types.Object] = []

    # Core volume: still stylized/chibi, but no source-image cutout parts are exported.
    objects.append(add_bound_sphere("Fuxie_Body_Hoodie", (0, -0.01, 1.00), (0.40, 0.25, 0.44), mats["hoodie"], collection, armature, "chest", 32, 16))
    objects.append(add_bound_sphere("Fuxie_Belly_Cream", (0, -0.235, 0.96), (0.22, 0.046, 0.31), mats["cream"], collection, armature, "chest", 24, 12))
    objects.append(add_bound_cube("Fuxie_Jacket_Left_Panel", (-0.14, -0.266, 0.96), (0.105, 0.018, 0.33), mats["hoodie"], collection, armature, "chest", 0.030))
    objects.append(add_bound_cube("Fuxie_Jacket_Right_Panel", (0.14, -0.266, 0.96), (0.105, 0.018, 0.33), mats["hoodie"], collection, armature, "chest", 0.030))
    objects.append(add_bound_sphere("Fuxie_Bandana_Blue", (0, -0.266, 1.30), (0.27, 0.035, 0.15), mats["fur_shadow"], collection, armature, "chest", 24, 10))
    objects.append(add_bound_torus("Fuxie_Hood_Rim", (0, -0.218, 1.39), 0.31, 0.022, mats["hoodie_shadow"], collection, armature, "chest", (math.pi / 2, 0, 0)))
    objects.append(add_bound_sphere("Fuxie_Chest_Token", (0, -0.302, 1.26), (0.062, 0.018, 0.062), mats["token"], collection, armature, "chest", 24, 10))
    objects.append(add_bound_sphere("Fuxie_Token_Mark", (0, -0.322, 1.27), (0.028, 0.006, 0.037), mats["white"], collection, armature, "chest", 16, 8))
    objects.append(add_bound_cube("Fuxie_Shorts_L", (-0.15, -0.015, 0.62), (0.16, 0.19, 0.13), mats["pants"], collection, armature, "hips", 0.045))
    objects.append(add_bound_cube("Fuxie_Shorts_R", (0.15, -0.015, 0.62), (0.16, 0.19, 0.13), mats["pants"], collection, armature, "hips", 0.045))

    objects.append(add_bound_sphere("Fuxie_Head", (0, -0.02, 1.82), (0.51, 0.405, 0.46), mats["fur_blue"], collection, armature, "head", 40, 20))
    objects.append(add_bound_sphere("Fuxie_FaceMask", (0, -0.405, 1.67), (0.33, 0.060, 0.205), mats["cream"], collection, armature, "head", 28, 12))
    objects.append(add_bound_sphere("Fuxie_Cheek_L", (-0.21, -0.410, 1.65), (0.20, 0.050, 0.12), mats["cream"], collection, armature, "head", 24, 10))
    objects.append(add_bound_sphere("Fuxie_Cheek_R", (0.21, -0.410, 1.65), (0.20, 0.050, 0.12), mats["cream"], collection, armature, "head", 24, 10))
    objects.append(add_bound_sphere("Fuxie_Muzzle", (0, -0.465, 1.61), (0.20, 0.075, 0.12), mats["cream"], collection, armature, "jaw", 24, 12))
    objects.append(add_bound_sphere("Fuxie_Nose", (0, -0.545, 1.70), (0.062, 0.035, 0.040), mats["black"], collection, armature, "head", 18, 8))
    objects.append(add_bound_sphere("Fuxie_Mouth", (0, -0.540, 1.54), (0.088, 0.017, 0.034), mats["black"], collection, armature, "jaw", 18, 8))
    objects.append(add_bound_sphere("Fuxie_Tongue", (0, -0.558, 1.515), (0.060, 0.010, 0.024), mats["tongue"], collection, armature, "jaw", 14, 7))
    objects.append(add_bound_cone("Fuxie_Ear_L_Outer", (-0.35, -0.005, 2.22), 0.18, 0.70, mats["fur_blue"], collection, armature, "ear.L.01", (0.28, -0.32, 0.36), 40))
    objects.append(add_bound_cone("Fuxie_Ear_R_Outer", (0.35, -0.005, 2.22), 0.18, 0.70, mats["fur_blue"], collection, armature, "ear.R.01", (0.28, 0.32, -0.36), 40))
    objects.append(add_bound_cone("Fuxie_Ear_L_Inner", (-0.35, -0.052, 2.18), 0.105, 0.50, mats["ear_inner"], collection, armature, "ear.L.01", (0.28, -0.32, 0.36), 30))
    objects.append(add_bound_cone("Fuxie_Ear_R_Inner", (0.35, -0.052, 2.18), 0.105, 0.50, mats["ear_inner"], collection, armature, "ear.R.01", (0.28, 0.32, -0.36), 30))

    for side, x in [("L", -0.17), ("R", 0.17)]:
        objects.append(add_bound_sphere(f"Fuxie_Eye_{side}_White", (x, -0.455, 1.83), (0.092, 0.020, 0.118), mats["white"], collection, armature, "head", 22, 10))
        objects.append(add_bound_sphere(f"Fuxie_Eye_{side}_Iris", (x, -0.475, 1.81), (0.049, 0.009, 0.068), mats["amber"], collection, armature, "head", 16, 8))
        objects.append(add_bound_sphere(f"Fuxie_Eye_{side}_Pupil", (x, -0.486, 1.805), (0.030, 0.006, 0.046), mats["black"], collection, armature, "head", 14, 7))
        objects.append(add_bound_sphere(f"Fuxie_Eye_{side}_Highlight", (x - 0.023, -0.493, 1.857), (0.016, 0.003, 0.022), mats["white"], collection, armature, "head", 10, 5))

    # Deforming limb chains: these are continuous skinned mesh tubes, not image planes.
    for side, sign in [("L", -1), ("R", 1)]:
        objects.append(add_deform_tube(
            f"Fuxie_DeformArm_{side}",
            [(sign * 0.36, -0.02, 1.25), (sign * 0.55, -0.035, 1.02), (sign * 0.70, -0.052, 0.70)],
            [f"upper_arm.{side}", f"forearm.{side}"],
            [(0.095, 0.082), (0.090, 0.076), (0.078, 0.066)],
            mats["hoodie"],
            collection,
            armature,
            18,
            14,
        ))
        objects.append(add_bound_sphere(f"Fuxie_DeformHand_{side}", (sign * 0.73, -0.070, 0.56), (0.105, 0.080, 0.102), mats["fur_blue"], collection, armature, f"hand.{side}", 20, 10))
        objects.append(add_deform_tube(
            f"Fuxie_DeformLeg_{side}",
            [(sign * 0.18, -0.005, 0.66), (sign * 0.25, -0.01, 0.39), (sign * 0.33, -0.030, 0.14)],
            [f"upper_leg.{side}", f"shin.{side}"],
            [(0.120, 0.095), (0.100, 0.080), (0.078, 0.064)],
            mats["pants"] if side == "L" else mats["cream"],
            collection,
            armature,
            18,
            14,
        ))
        objects.append(add_bound_sphere(f"Fuxie_DeformShoe_{side}", (sign * 0.34, -0.20, 0.095), (0.18, 0.13, 0.072), mats["shoe"], collection, armature, f"foot.{side}", 20, 8))
        objects.append(add_bound_sphere(f"Fuxie_DeformShoeToe_{side}", (sign * 0.38, -0.30, 0.095), (0.16, 0.07, 0.055), mats["white"], collection, armature, f"foot.{side}", 18, 8))

    objects.append(add_deform_tube(
        "Fuxie_DeformTail",
        [(0.30, 0.10, 0.82), (0.55, 0.13, 1.03), (0.81, 0.12, 1.22), (1.02, 0.10, 1.37)],
        ["tail.01", "tail.02", "tail.03"],
        [(0.16, 0.12), (0.25, 0.15), (0.30, 0.17), (0.17, 0.10)],
        mats["fur_blue"],
        collection,
        armature,
        26,
        16,
    ))
    objects.append(add_bound_sphere("Fuxie_DeformTail_Tip_Cream", (1.05, 0.08, 1.39), (0.18, 0.10, 0.13), mats["white"], collection, armature, "tail.03", 20, 10))
    objects.append(add_bound_sphere("Fuxie_Shadow", (0, 0.05, 0.035), (0.72, 0.10, 0.020), mats["shadow"], collection, armature, "root", 32, 8))
    return objects


def add_reference_planes(reference_collection: bpy.types.Collection) -> None:
    refs = [
        ("Fuxie_V13_Reference_Front", FRONT_REFERENCE, 2.55, (-2.20, 0.35, 0.04)),
        ("Fuxie_V13_Reference_ThreeQuarter", THREE_QUARTER_REFERENCE, 2.55, (2.20, 0.35, 0.04)),
        ("Fuxie_V13_Reference_Side", SIDE_REFERENCE, 2.20, (3.85, 0.35, 0.10)),
        ("Fuxie_V13_Reference_Back", BACK_REFERENCE, 2.20, (-3.85, 0.35, 0.10)),
        ("Fuxie_V13_Reference_Faces", FACES_REFERENCE, 1.0, (0, 0.35, 2.86)),
        ("Fuxie_V13_Reference_Tail", TAIL_REFERENCE, 0.82, (0, 0.35, -0.98)),
    ]
    for name, path, height, loc in refs:
        if path.exists():
            v7.add_reference_plane(name, path, height, loc, reference_collection)


def write_manifest(character_collection: bpy.types.Collection, reference_collection: bpy.types.Collection) -> None:
    meshes = [obj for obj in character_collection.objects if obj.type == "MESH"]
    armature = next((obj for obj in character_collection.objects if obj.type == "ARMATURE"), None)
    blended_meshes = [obj.name for obj in meshes if obj.get("fuxie_v13_deformation")]
    manifest = {
        "name": "Fuxie_Character_v13_deform_rig",
        "status": "true_deforming_skeletal_rig_candidate",
        "source_note": "V13 uses the Fuxie 3D render set only as visual reference. Exported limbs and tail are real skinned 3D meshes with blended vertex weights, not cutout image parts.",
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
            "public_glb": str(PUBLIC_GLB_PATH.relative_to(ROOT)).replace("\\", "/"),
            "public_poster": str(PUBLIC_POSTER_PATH.relative_to(ROOT)).replace("\\", "/"),
            "public_manifest": str(PUBLIC_MANIFEST_PATH.relative_to(ROOT)).replace("\\", "/"),
        },
        "stats": {
            "mesh_objects": len(meshes),
            "deforming_multi_weight_meshes": blended_meshes,
            "vertices_before_export_modifiers": sum(len(obj.data.vertices) for obj in meshes),
            "faces_before_export_modifiers": sum(len(obj.data.polygons) for obj in meshes),
            "bones": [bone.name for bone in armature.data.bones] if armature else [],
            "deform_bones": [bone.name for bone in armature.data.bones if bone.use_deform] if armature else [],
            "control_bones": [bone.name for bone in armature.data.bones if not bone.use_deform] if armature else [],
            "reference_planes": [obj.name for obj in reference_collection.objects],
            "fps": bpy.context.scene.render.fps,
            "clips": CLIPS,
            "target_runtime": "60fps WebGL true deforming skeletal rig",
        },
        "rig_notes": [
            "No source image cutout limbs are exported in V13.",
            "Arms, legs, and tail are generated as continuous tube meshes with multiple edge loops.",
            "Vertices near elbows, knees, and tail joints are weighted across adjacent bones for visible bend deformation.",
        ],
        "limits": [
            "This is still a generated stylized approximation, not a recovered original production mesh.",
            "Facial topology is primitive-based; production blendshapes/eyelids still need a sculpted face mesh.",
            "Final production quality should retopologize the body into a unified mesh and hand-paint UV textures.",
        ],
        "next_step": "Browser QA V13 motion and compare natural joint bending against V12/V10; then polish weight envelopes and animation curves.",
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")


def copy_public_assets() -> None:
    shutil.copy2(GLB_PATH, PUBLIC_GLB_PATH)
    shutil.copy2(PREVIEW_PATH, PUBLIC_POSTER_PATH)
    shutil.copy2(MANIFEST_PATH, PUBLIC_MANIFEST_PATH)


def main() -> None:
    install_globals()
    ensure_dirs()
    v7.clear_scene()
    v7.setup_scene()
    bpy.context.scene.camera.name = "Fuxie_V13_DeformRig_Camera"
    bpy.context.scene.render.fps = 60

    character_collection = v7.make_collection("Fuxie_V13_DeformRig_Export")
    reference_collection = v7.make_collection("Fuxie_V13_Source_References")
    armature = v7.create_armature(character_collection)
    rename_armature(armature)
    create_deform_character(character_collection, armature)
    add_reference_planes(reference_collection)
    v7.animate(armature)
    v7.export_assets(character_collection)
    write_manifest(character_collection, reference_collection)
    copy_public_assets()
    print(f"Saved V13 deform rig Blender file: {BLEND_PATH}")
    print(f"Exported V13 deform rig GLB: {GLB_PATH}")
    print(f"Exported V13 deform rig FBX: {FBX_PATH}")
    print(f"Rendered V13 deform rig preview: {PREVIEW_PATH}")


if __name__ == "__main__":
    main()
