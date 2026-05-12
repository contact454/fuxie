from __future__ import annotations

import json
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
CONFIG_PATH = ROOT / "scripts" / "fuxie-v8" / "fuxie_v8_pipeline_config.json"
INPUT_DIR = ROOT / "blender" / "fuxie" / "hunyuan_v8" / "input"
MANIFEST_PATH = INPUT_DIR / "Fuxie_hunyuan_v8_input_manifest.json"


def rel(path: Path) -> str:
    return str(path.relative_to(ROOT)).replace("\\", "/")


def main() -> None:
    config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    INPUT_DIR.mkdir(parents=True, exist_ok=True)

    copied: list[dict[str, str]] = []
    for group_name, paths in config["references"].items():
        for source in paths:
            source_path = ROOT / source
            if not source_path.exists():
                copied.append({"group": group_name, "source": source, "status": "missing"})
                continue
            target = INPUT_DIR / f"{group_name}_{source_path.name}"
            shutil.copy2(source_path, target)
            copied.append({
                "group": group_name,
                "source": source,
                "target": rel(target),
                "status": "copied"
            })

    manifest = {
        "name": "Fuxie_hunyuan_v8_inputs",
        "sourceNote": config["sourceNote"],
        "inputDir": rel(INPUT_DIR),
        "references": copied,
        "primaryPrompt": (
            "Cute stylized chibi blue fox mascot named Fuxie, large expressive amber eyes, "
            "cream muzzle and cheeks, tall fox ears with pink inner ear and white fluff, "
            "teal hoodie jacket, blue bandana with fox token emblem, navy shorts, blue sneakers, "
            "large fluffy blue tail with white tip, friendly game mascot proportions."
        ),
        "negativePrompt": (
            "realistic animal, horror, angry expression, long human body, thin limbs, extra fingers, "
            "extra tails, broken face, melted hoodie, missing ears, noisy texture, low quality mesh"
        )
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
