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


BLEND_PATH = BLENDER_DIR / "Fuxie_Character_v15_source_locked_skinned_rig.blend"
GLB_PATH = MODEL_DIR / "Fuxie_Character_v15_source_locked_skinned_rig.glb"
FBX_PATH = MODEL_DIR / "Fuxie_Character_v15_source_locked_skinned_rig.fbx"
PREVIEW_PATH = BLENDER_DIR / "Fuxie_preview_v15_source_locked_skinned_rig.png"
MANIFEST_PATH = BLENDER_DIR / "Fuxie_Character_v15_source_locked_skinned_rig_manifest.json"
PUBLIC_GLB_PATH = PUBLIC_LIVE_DIR / "fuxie-source-locked-skinned-rig-v15.glb"
PUBLIC_POSTER_PATH = PUBLIC_LIVE_DIR / "fuxie-source-locked-skinned-rig-v15-poster.png"
PUBLIC_MANIFEST_PATH = PUBLIC_LIVE_DIR / "fuxie-source-locked-skinned-rig-v15.json"
LAYER_DIR = BLENDER_DIR / "generated" / "v15_source_locked_skinned_layers"


CLIPS = {
    "idle": {"frames": 120, "description": "60fps source-locked idle with breathing, ear focus, and tail chain sway."},
    "wave": {"frames": 96, "description": "60fps multi-bone skinned arm wave; upper arm, forearm, and hand are weighted separately."},
    "talk": {"frames": 120, "description": "60fps talk loop with jaw/mouth overlay, head nod, and small hand gesture."},
    "listen": {"frames": 120, "description": "60fps attentive listen with head/chest tilt, ear twitch, and tail counter motion."},
    "reward": {"frames": 96, "description": "60fps reward hop with squash/stretch and both arms raised."},
    "tryAgain": {"frames": 120, "description": "60fps encouragement loop with gentle nod and natural hand cue."},
}


WEIGHT_CHAINS: dict[str, list[tuple[str, float]]] = {
    "Fuxie_Arm_L": [("upper_arm.L", 0.00), ("forearm.L", 0.45), ("hand.L", 1.00)],
    "Fuxie_Arm_R": [("upper_arm.R", 0.00), ("forearm.R", 0.45), ("hand.R", 1.00)],
    "Fuxie_Leg_L": [("upper_leg.L", 0.00), ("shin.L", 0.58), ("foot.L", 1.00)],
    "Fuxie_Leg_R": [("upper_leg.R", 0.00), ("shin.R", 0.58), ("foot.R", 1.00)],
    "Fuxie_Tail": [("tail.01", 0.00), ("tail.02", 0.50), ("tail.03", 1.00)],
    "Fuxie_Body_Hoodie": [("hips", 0.00), ("spine", 0.45), ("chest", 1.00)],
    "Fuxie_Head": [("neck", 0.00), ("head", 1.00)],
    "Fuxie_Mouth_TalkOverlay": [("jaw", 0.00), ("jaw", 1.00)],
    "Fuxie_Chest_Token": [("chest", 0.00), ("chest", 1.00)],
}


GRID_DENSITY = {
    "Fuxie_Arm_L": (8, 18),
    "Fuxie_Arm_R": (8, 18),
    "Fuxie_Leg_L": (8, 18),
    "Fuxie_Leg_R": (8, 18),
    "Fuxie_Tail": (18, 14),
    "Fuxie_Body_Hoodie": (14, 16),
    "Fuxie_Head": (18, 16),
    "Fuxie_Mouth_TalkOverlay": (6, 6),
    "Fuxie_Chest_Token": (6, 6),
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
    v6b.LAYER_DIR = LAYER_DIR
    v6b.CLIPS = CLIPS


def ensure_dirs() -> None:
    BLENDER_DIR.mkdir(parents=True, exist_ok=True)
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_LIVE_DIR.mkdir(parents=True, exist_ok=True)
    LAYER_DIR.mkdir(parents=True, exist_ok=True)


def create_skinned_part_mesh(part: dict[str, object], collection: bpy.types.Collection, image_path: Path) -> bpy.types.Object:
    name = str(part["name"])
    rect = part["rect"]
    assert isinstance(rect, tuple)
    cols, rows = GRID_DENSITY.get(name, (8, 8))
    y = float(part["layer"])
    left, right, bottom, top, _, _ = v6b.rect_to_world(rect)

    verts: list[tuple[float, float, float]] = []
    uvs: list[tuple[float, float]] = []
    for row in range(rows + 1):
        v = row / rows
        z = bottom + (top - bottom) * v
        for col in range(cols + 1):
            u = col / cols
            x = left + (right - left) * u
            # Tiny convexity keeps the source image readable but less cardboard-flat in WebGL lighting.
            crown = math.sin(math.pi * u) * math.sin(math.pi * v) * 0.010
            verts.append((x, y - crown, z))
            uvs.append((u, v))

    faces: list[tuple[int, int, int, int]] = []
    for row in range(rows):
        for col in range(cols):
            i = row * (cols + 1) + col
            faces.append((i, i + 1, i + cols + 2, i + cols + 1))

    mesh = bpy.data.meshes.new(f"{name}_SkinnedMesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    uv_layer = mesh.uv_layers.new(name="Fuxie_V15_SourceLockedUV")
    for polygon in mesh.polygons:
        for loop_index in polygon.loop_indices:
            uv_layer.data[loop_index].uv = uvs[mesh.loops[loop_index].vertex_index]

    obj = bpy.data.objects.new(f"{name}_V15Skinned", mesh)
    obj.data.materials.append(v6b.image_material(f"{name}_V15_SourceMaterial", image_path))
    obj["fuxie_v15_role"] = "source_locked_subdivided_skinned_texture_mesh"
    obj["fuxie_source_rect"] = ",".join(str(value) for value in rect)
    collection.objects.link(obj)
    return obj


def chain_weights(chain: list[tuple[str, float]], t: float) -> dict[str, float]:
    if len(chain) == 1:
        return {chain[0][0]: 1.0}
    if t <= chain[0][1]:
        return {chain[0][0]: 1.0}
    if t >= chain[-1][1]:
        return {chain[-1][0]: 1.0}

    for (bone_a, pos_a), (bone_b, pos_b) in zip(chain, chain[1:]):
        if pos_a <= t <= pos_b:
            span = max(pos_b - pos_a, 1e-6)
            local = (t - pos_a) / span
            # Smoothstep avoids hard hinges while still letting the joint read.
            eased = local * local * (3.0 - 2.0 * local)
            return {bone_a: 1.0 - eased, bone_b: eased}
    return {chain[-1][0]: 1.0}


def bind_skinned_to_chain(obj: bpy.types.Object, armature: bpy.types.Object, part_name: str) -> None:
    chain = WEIGHT_CHAINS[part_name]
    groups = {bone: obj.vertex_groups.new(name=bone) for bone, _ in chain}
    z_values = [vertex.co.z for vertex in obj.data.vertices]
    z_min = min(z_values)
    z_max = max(z_values)
    span = max(z_max - z_min, 1e-6)

    for vertex in obj.data.vertices:
        # Top of the image part is the attachment point for limbs, so invert the vertical fraction.
        t_from_bottom = (vertex.co.z - z_min) / span
        t = 1.0 - t_from_bottom if part_name in {"Fuxie_Arm_L", "Fuxie_Arm_R", "Fuxie_Leg_L", "Fuxie_Leg_R"} else t_from_bottom
        if part_name == "Fuxie_Tail":
            xs = [v.co.x for v in obj.data.vertices]
            x_span = max(max(xs) - min(xs), 1e-6)
            t = (vertex.co.x - min(xs)) / x_span
        for bone, weight in chain_weights(chain, t).items():
            groups[bone].add([vertex.index], weight, "ADD")

    modifier = obj.modifiers.new(name="Fuxie_V15_SourceLocked_Armature_Deform", type="ARMATURE")
    modifier.object = armature
    obj.parent = armature


def rename_armature(armature: bpy.types.Object) -> None:
    armature.name = "Fuxie_V15_SourceLockedSkinnedRig_Armature"
    armature.data.name = "Fuxie_V15_SourceLockedSkinnedRig_Skeleton"


def key_bone(armature: bpy.types.Object, bone_name: str, frame: int, loc=None, rot=None, scale=None) -> None:
    v6b.key_bone(armature, bone_name, frame, loc=loc, rot=rot, scale=scale)


def make_clip(armature: bpy.types.Object, name: str, frames: int, animator) -> None:
    v6b.make_clip(armature, name, frames, animator)


def animate(armature: bpy.types.Object) -> None:
    def idle() -> None:
        for frame, lift, body, head, tail, ear in [
            (1, 0.00, 0.00, 0.00, 0.00, 0.00),
            (30, 0.024, -0.010, 0.012, 0.10, 0.05),
            (60, 0.00, 0.00, 0.00, -0.02, 0.00),
            (90, 0.024, 0.010, -0.012, -0.10, -0.05),
            (120, 0.00, 0.00, 0.00, 0.00, 0.00),
        ]:
            key_bone(armature, "root", frame, loc=(0, 0, lift), rot=(0, 0, body), scale=(1, 1 + lift * 0.40, 1))
            key_bone(armature, "head", frame, rot=(0, 0, head))
            key_bone(armature, "tail.01", frame, rot=(0, 0, tail * 0.40))
            key_bone(armature, "tail.02", frame, rot=(0, 0, tail))
            key_bone(armature, "tail.03", frame, rot=(0, 0, tail * 0.72))
            key_bone(armature, "ear.L.01", frame, rot=(0, 0, -ear))
            key_bone(armature, "ear.R.01", frame, rot=(0, 0, ear))

    def wave() -> None:
        for frame, upper, fore, hand, body, lift in [
            (1, 0.00, 0.00, 0.00, 0.00, 0.00),
            (12, -0.24, -0.50, -0.18, -0.03, 0.022),
            (24, -0.42, -0.94, 0.42, 0.02, 0.044),
            (36, -0.32, -0.70, -0.36, -0.02, 0.018),
            (48, -0.46, -1.02, 0.48, 0.024, 0.044),
            (60, -0.32, -0.70, -0.34, -0.02, 0.018),
            (72, -0.42, -0.94, 0.42, 0.024, 0.038),
            (96, 0.00, 0.00, 0.00, 0.00, 0.00),
        ]:
            key_bone(armature, "root", frame, loc=(0, 0, lift), rot=(0, 0, body), scale=(1, 1 + lift * 0.30, 1))
            key_bone(armature, "upper_arm.L", frame, rot=(0, 0, upper))
            key_bone(armature, "forearm.L", frame, rot=(0, 0, fore))
            key_bone(armature, "hand.L", frame, rot=(0, 0, hand))
            key_bone(armature, "head", frame, rot=(0, 0, -body * 0.55))
            key_bone(armature, "tail.01", frame, rot=(0, 0, -body * 1.20))
            key_bone(armature, "tail.02", frame, rot=(0, 0, -body * 2.20))
            key_bone(armature, "tail.03", frame, rot=(0, 0, -body * 1.70))

    def talk() -> None:
        for frame in range(1, 121, 8):
            phase = frame // 8
            mouth = 1.0 + (0.20 if phase % 2 else 0.0)
            nod = 0.020 * math.sin(frame * 0.18)
            gesture = 0.10 * math.sin(frame * 0.26)
            key_bone(armature, "root", frame, loc=(0, 0, 0.012 if phase % 2 else 0.0))
            key_bone(armature, "head", frame, rot=(0, 0, nod))
            key_bone(armature, "jaw", frame, scale=(1.0, mouth, 1.0), loc=(0, 0, -0.014 if phase % 2 else 0.0))
            key_bone(armature, "upper_arm.R", frame, rot=(0, 0, gesture * 0.45))
            key_bone(armature, "forearm.R", frame, rot=(0, 0, gesture))

    def listen() -> None:
        for frame, head, chest, ear_l, ear_r, tail in [
            (1, 0.00, 0.00, 0.00, 0.00, 0.00),
            (25, -0.10, -0.03, 0.11, 0.05, 0.08),
            (60, -0.16, -0.04, 0.18, 0.08, -0.05),
            (95, -0.10, -0.03, 0.11, 0.05, 0.08),
            (120, 0.00, 0.00, 0.00, 0.00, 0.00),
        ]:
            key_bone(armature, "head", frame, rot=(0, 0, head))
            key_bone(armature, "chest", frame, rot=(0, 0, chest))
            key_bone(armature, "ear.L.01", frame, rot=(0, 0, ear_l))
            key_bone(armature, "ear.R.01", frame, rot=(0, 0, ear_r))
            key_bone(armature, "tail.01", frame, rot=(0, 0, tail * 0.45))
            key_bone(armature, "tail.02", frame, rot=(0, 0, tail))
            key_bone(armature, "tail.03", frame, rot=(0, 0, tail * 0.65))

    def reward() -> None:
        for frame, lift, squash, arm_l, arm_r, fore_l, fore_r, tail in [
            (1, 0.00, 1.00, 0.00, 0.00, 0.00, 0.00, 0.00),
            (12, -0.020, 0.96, -0.08, 0.08, -0.18, 0.18, -0.16),
            (24, 0.120, 1.08, -0.46, 0.46, -0.78, 0.78, 0.34),
            (36, 0.020, 0.98, -0.28, 0.28, -0.52, 0.52, -0.34),
            (48, 0.090, 1.06, -0.48, 0.48, -0.88, 0.88, 0.32),
            (72, 0.020, 0.99, -0.20, 0.20, -0.34, 0.34, -0.18),
            (96, 0.00, 1.00, 0.00, 0.00, 0.00, 0.00, 0.00),
        ]:
            key_bone(armature, "root", frame, loc=(0, 0, lift), scale=(1 / squash, squash, 1), rot=(0, 0, 0.04 * math.sin(frame)))
            key_bone(armature, "upper_arm.L", frame, rot=(0, 0, arm_l))
            key_bone(armature, "upper_arm.R", frame, rot=(0, 0, arm_r))
            key_bone(armature, "forearm.L", frame, rot=(0, 0, fore_l))
            key_bone(armature, "forearm.R", frame, rot=(0, 0, fore_r))
            key_bone(armature, "head", frame, rot=(0, 0, -0.05 * math.sin(frame * 0.22)))
            key_bone(armature, "tail.01", frame, rot=(0, 0, tail * 0.35))
            key_bone(armature, "tail.02", frame, rot=(0, 0, tail))
            key_bone(armature, "tail.03", frame, rot=(0, 0, tail * 0.85))

    def try_again() -> None:
        for frame, nod, upper, fore, hand, tail in [
            (1, 0.00, 0.00, 0.00, 0.00, 0.00),
            (30, 0.05, -0.03, -0.16, -0.05, 0.07),
            (60, -0.03, 0.04, 0.12, 0.04, -0.04),
            (90, 0.04, -0.02, -0.10, -0.03, 0.05),
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
    bpy.context.scene.camera.name = "Fuxie_V15_SourceLockedSkinnedRig_Camera"
    bpy.context.scene.camera.data.ortho_scale = 3.10


def add_reference_planes(reference_collection: bpy.types.Collection) -> None:
    refs = [
        ("Fuxie_V15_Reference_Front", v6b.FRONT_REFERENCE, 2.55, (-2.12, 0.24, 0.04)),
        ("Fuxie_V15_Reference_ThreeQuarter", v6b.THREE_QUARTER_REFERENCE, 2.55, (2.12, 0.24, 0.04)),
        ("Fuxie_V15_Reference_Faces", v6b.FACES_REFERENCE, 1.0, (0, 0.24, 2.86)),
        ("Fuxie_V15_Reference_Tail", v6b.TAIL_REFERENCE, 0.82, (0, 0.24, -0.98)),
    ]
    for name, path, height, location in refs:
        if Path(path).exists():
            v6b.add_reference_plane(name, path, height, location, reference_collection)


def write_manifest(character_collection: bpy.types.Collection, reference_collection: bpy.types.Collection) -> None:
    meshes = [obj for obj in character_collection.objects if obj.type == "MESH"]
    armature = next((obj for obj in character_collection.objects if obj.type == "ARMATURE"), None)
    manifest = {
        "name": "Fuxie_Character_v15_source_locked_skinned_rig",
        "status": "source_identity_locked_skinned_rig_candidate",
        "source_note": "V15 uses the approved Fuxie 3D render cutout as the visual source of truth, but replaces the old one-bone flat parts with subdivided skinned meshes and multi-bone vertex weights for arms, legs, body, head, and tail. It is still a 2.5D source-locked approximation, not a recovered original 3D mesh.",
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
            "weighted_chains": WEIGHT_CHAINS,
            "grid_density": GRID_DENSITY,
            "reference_planes": [obj.name for obj in reference_collection.objects],
            "fps": bpy.context.scene.render.fps,
            "clips": CLIPS,
            "generated_layers": str(LAYER_DIR.relative_to(ROOT)).replace("\\", "/"),
            "target_runtime": "60fps WebGL source-identity rig with true skin weights",
        },
        "limits": [
            "V15 is much closer to the source identity than procedural mesh variants because it uses the approved render texture directly.",
            "It is not yet a full volumetric 3D character; hidden side/back surfaces still require sculpt/retopo from a 3D generation pipeline or manual modeling.",
            "Joint deformation is real skinning, but production quality still needs hand-painted weights, mesh cleanup around elbows/knees, and facial blendshapes.",
        ],
        "next_step": "QA V15 against V6B and V14. If identity is approved, continue with weight-paint polish and replace flat source layers with UV-painted volume mesh.",
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")


def copy_public_assets() -> None:
    shutil.copy2(GLB_PATH, PUBLIC_GLB_PATH)
    shutil.copy2(PREVIEW_PATH, PUBLIC_POSTER_PATH)
    shutil.copy2(MANIFEST_PATH, PUBLIC_MANIFEST_PATH)


def main() -> None:
    install_globals()
    ensure_dirs()
    v6b.ensure_dirs()
    v6b.clear_scene()
    setup_scene()

    character_collection = v6b.make_collection("Fuxie_V15_SourceLockedSkinnedRig_Export")
    reference_collection = v6b.make_collection("Fuxie_V15_Source_References")
    layer_paths = v6b.generate_layer_textures()

    armature = v6b.create_armature(character_collection)
    rename_armature(armature)

    for part in v6b.PARTS:
        part_name = str(part["name"])
        obj = create_skinned_part_mesh(part, character_collection, layer_paths[part_name])
        bind_skinned_to_chain(obj, armature, part_name)

    shadow = v6b.add_shadow(character_collection)
    v6b.bind_to_bone(shadow, armature, "root")

    add_reference_planes(reference_collection)
    animate(armature)
    v6b.export_assets(character_collection)
    write_manifest(character_collection, reference_collection)
    copy_public_assets()
    print(f"Saved V15 source-locked skinned rig Blender file: {BLEND_PATH}")
    print(f"Exported V15 source-locked skinned rig GLB: {GLB_PATH}")
    print(f"Exported V15 source-locked skinned rig FBX: {FBX_PATH}")
    print(f"Rendered V15 source-locked skinned rig preview: {PREVIEW_PATH}")


if __name__ == "__main__":
    main()
