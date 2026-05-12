from __future__ import annotations

import argparse
import ctypes
import gc
import json
import os
import sys
import time
from pathlib import Path

import torch
import trimesh


ROOT = Path(__file__).resolve().parents[2]
HUNYUAN_ROOT = ROOT / ".ai3d" / "external" / "Hunyuan3D-2.1"
HUNYUAN_SHAPE_ROOT = HUNYUAN_ROOT / "hy3dshape"
CANDIDATE_DIR = ROOT / "blender" / "fuxie" / "hunyuan_v8" / "candidates"
INPUT_MANIFEST = ROOT / "blender" / "fuxie" / "hunyuan_v8" / "input" / "Fuxie_hunyuan_v8_input_manifest.json"
OUTPUT_MANIFEST = ROOT / "blender" / "fuxie" / "hunyuan_v8" / "Fuxie_hunyuan_v8_candidates_manifest.json"


def rel(path: Path) -> str:
    return str(path.relative_to(ROOT)).replace("\\", "/")


def pick_primary_image() -> Path:
    manifest = json.loads(INPUT_MANIFEST.read_text(encoding="utf-8"))
    for item in manifest["references"]:
        if item["group"] == "primary" and "front" in item["target"] and item["status"] == "copied":
            return ROOT / item["target"]
    raise FileNotFoundError("Could not find primary front Fuxie V8 reference in input manifest")


def next_candidate_index() -> int:
    existing = sorted(CANDIDATE_DIR.glob("fuxie_hunyuan_v8_c*.glb"))
    indexes: list[int] = []
    for path in existing:
        stem = path.stem.rsplit("_c", 1)[-1]
        if stem.isdigit():
            indexes.append(int(stem))
    return max(indexes, default=0) + 1


def load_existing_candidates() -> list[dict[str, object]]:
    if not OUTPUT_MANIFEST.exists():
        return []
    try:
        manifest = json.loads(OUTPUT_MANIFEST.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []
    candidates = manifest.get("candidates", [])
    return candidates if isinstance(candidates, list) else []


def detect_ram_gb() -> float | None:
    if hasattr(os, "sysconf"):
        try:
            return round(os.sysconf("SC_PAGE_SIZE") * os.sysconf("SC_PHYS_PAGES") / (1024 ** 3), 1)
        except (OSError, ValueError):
            return None
    try:
        class MemoryStatus(ctypes.Structure):
            _fields_ = [
                ("dwLength", ctypes.c_ulong),
                ("dwMemoryLoad", ctypes.c_ulong),
                ("ullTotalPhys", ctypes.c_ulonglong),
                ("ullAvailPhys", ctypes.c_ulonglong),
                ("ullTotalPageFile", ctypes.c_ulonglong),
                ("ullAvailPageFile", ctypes.c_ulonglong),
                ("ullTotalVirtual", ctypes.c_ulonglong),
                ("ullAvailVirtual", ctypes.c_ulonglong),
                ("sullAvailExtendedVirtual", ctypes.c_ulonglong),
            ]

        status = MemoryStatus()
        status.dwLength = ctypes.sizeof(status)
        if ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(status)):
            return round(status.ullTotalPhys / (1024 ** 3), 1)
    except (AttributeError, OSError):
        return None
    return None


def export_mesh(mesh: trimesh.Trimesh | trimesh.Scene, output: Path) -> dict[str, int | str]:
    output.parent.mkdir(parents=True, exist_ok=True)
    if isinstance(mesh, trimesh.Scene):
        mesh.export(output)
        vertices = sum(len(geom.vertices) for geom in mesh.geometry.values())
        faces = sum(len(geom.faces) for geom in mesh.geometry.values())
    else:
        mesh.export(output)
        vertices = len(mesh.vertices)
        faces = len(mesh.faces)
    return {"path": rel(output), "vertices": vertices, "faces": faces, "bytes": output.stat().st_size}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--count", type=int, default=3)
    parser.add_argument("--steps", type=int, default=30)
    parser.add_argument("--octree-resolution", type=int, default=256)
    parser.add_argument("--guidance-scale", type=float, default=5.0)
    parser.add_argument("--seed", type=int, default=86021)
    parser.add_argument("--start-index", type=int)
    parser.add_argument("--append-manifest", action="store_true")
    parser.add_argument("--no-update-selected", action="store_true")
    parser.add_argument("--model-path", default="tencent/Hunyuan3D-2.1")
    parser.add_argument("--subfolder", default="hunyuan3d-dit-v2-1")
    parser.add_argument("--device", default="cuda")
    args = parser.parse_args()

    os.environ.setdefault("HF_HOME", str(ROOT / ".ai3d" / "cache" / "huggingface"))
    os.environ.setdefault("TRANSFORMERS_CACHE", str(ROOT / ".ai3d" / "cache" / "huggingface" / "transformers"))
    os.environ.setdefault("HUGGINGFACE_HUB_CACHE", str(ROOT / ".ai3d" / "cache" / "huggingface" / "hub"))

    sys.path.insert(0, str(HUNYUAN_SHAPE_ROOT))
    from hy3dshape.pipelines import Hunyuan3DDiTFlowMatchingPipeline

    image_path = pick_primary_image()
    CANDIDATE_DIR.mkdir(parents=True, exist_ok=True)

    started = time.time()
    start_index = args.start_index if args.start_index is not None else next_candidate_index()
    existing_candidates = load_existing_candidates() if args.append_manifest else []

    report: dict[str, object] = {
        "name": "Fuxie_hunyuan_v8_candidates",
        "source_note": "Generated approximation from Fuxie 3D render references, not a recovered original source mesh.",
        "input_image": rel(image_path),
        "model_path": args.model_path,
        "subfolder": args.subfolder,
        "settings": {
            "count": args.count,
            "steps": args.steps,
            "octree_resolution": args.octree_resolution,
            "guidance_scale": args.guidance_scale,
            "seed": args.seed,
            "start_index": start_index,
            "append_manifest": args.append_manifest,
            "update_selected": not args.no_update_selected,
            "device": args.device,
            "ram_gb_detected": detect_ram_gb(),
        },
        "environment": {
            "torch": torch.__version__,
            "cuda_available": torch.cuda.is_available(),
            "cuda_device": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
        },
        "candidates": [],
    }

    pipe = Hunyuan3DDiTFlowMatchingPipeline.from_pretrained(
        args.model_path,
        subfolder=args.subfolder,
        device=args.device,
        dtype=torch.float16,
        variant="fp16",
    )

    candidates: list[dict[str, object]] = list(existing_candidates)
    new_candidates: list[dict[str, object]] = []
    for offset in range(args.count):
        index = start_index + offset
        seed = args.seed + offset
        generator = torch.Generator(device=args.device).manual_seed(seed)
        output_path = CANDIDATE_DIR / f"fuxie_hunyuan_v8_c{index:02d}.glb"
        print(f"[Fuxie V8] Generating candidate c{index:02d} ({offset + 1}/{args.count}): {output_path} seed={seed}", flush=True)
        meshes = pipe(
            image=str(image_path),
            num_inference_steps=args.steps,
            guidance_scale=args.guidance_scale,
            generator=generator,
            octree_resolution=args.octree_resolution,
            output_type="trimesh",
            enable_pbar=True,
        )
        mesh = meshes[0] if isinstance(meshes, list) else meshes
        stats = export_mesh(mesh, output_path)
        candidate = {
            "index": index,
            "seed": seed,
            "status": "generated",
            **stats,
        }
        candidates.append(candidate)
        new_candidates.append(candidate)
        torch.cuda.empty_cache()
        gc.collect()

    selected = CANDIDATE_DIR / "fuxie_hunyuan_v8_selected.glb"
    if new_candidates and not args.no_update_selected:
        selected_source = ROOT / str(new_candidates[0]["path"])
        selected.write_bytes(selected_source.read_bytes())
        report["selected_candidate"] = rel(selected)
    elif selected.exists():
        report["selected_candidate"] = rel(selected)

    report["candidates"] = candidates
    report["new_candidates"] = new_candidates
    report["elapsed_seconds"] = round(time.time() - started, 2)
    OUTPUT_MANIFEST.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2), flush=True)


if __name__ == "__main__":
    main()
