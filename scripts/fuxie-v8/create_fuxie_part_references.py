from __future__ import annotations

import json
import shutil
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[2]
REFERENCE_DIR = ROOT / "blender" / "fuxie" / "references"
PART_DIR = REFERENCE_DIR / "parts"
PUBLIC_PART_DIR = ROOT / "apps" / "web" / "public" / "mascot-3d" / "reference-parts"
MANIFEST_PATH = PART_DIR / "fuxie_part_references_manifest.json"
CONTACT_SHEET_PATH = PART_DIR / "fuxie_part_references_contact_sheet.png"
PUBLIC_CONTACT_SHEET_PATH = PUBLIC_PART_DIR / "fuxie_part_references_contact_sheet.png"


PARTS = [
    {
        "id": "front_full_body",
        "source": "fuxie_ref_front.png",
        "box": (0, 0, 330, 540),
        "note": "Source-of-truth front proportion: head, hoodie, shorts, legs, shoes.",
    },
    {
        "id": "front_head_face",
        "source": "fuxie_ref_front.png",
        "box": (15, 0, 315, 242),
        "note": "Head silhouette, face mask, eyes, brows, ears, hair tuft.",
    },
    {
        "id": "front_eyes_brows",
        "source": "fuxie_ref_front.png",
        "box": (64, 92, 266, 190),
        "note": "Large amber eyes, black pupils, white highlights, short brows.",
    },
    {
        "id": "front_muzzle_mouth",
        "source": "fuxie_ref_front.png",
        "box": (76, 148, 254, 235),
        "note": "Cream cheeks, black nose, open smiling mouth, tongue.",
    },
    {
        "id": "front_ears",
        "source": "fuxie_ref_front.png",
        "box": (10, 0, 320, 148),
        "note": "Tall fox ears, blue outer rim, pink inner ear, white inner fluff.",
    },
    {
        "id": "front_hoodie_bandana_token",
        "source": "fuxie_ref_front.png",
        "box": (58, 212, 272, 363),
        "note": "Teal hoodie, blue scarf/bandana, white fox token mark, drawstrings.",
    },
    {
        "id": "front_left_hand",
        "source": "fuxie_ref_front.png",
        "box": (38, 312, 92, 392),
        "padding": 6,
        "note": "Visible relaxed blue hand shape and wrist proportion.",
    },
    {
        "id": "front_right_arm_cuff",
        "source": "fuxie_ref_front.png",
        "box": (250, 252, 330, 382),
        "padding": 6,
        "note": "Bent arm, hoodie cuff, hand placement against hip.",
    },
    {
        "id": "front_shoes",
        "source": "fuxie_ref_front.png",
        "box": (42, 414, 292, 540),
        "note": "Blue sneakers, white soles, laces, ankle socks.",
    },
    {
        "id": "three_quarter_tail",
        "source": "fuxie_ref_three_quarter.png",
        "box": (210, 275, 345, 505),
        "padding": 4,
        "note": "Large curved tail, blue gradient, white tip from 3/4 view.",
    },
    {
        "id": "side_tail_profile",
        "source": "fuxie_ref_side.png",
        "box": (126, 170, 260, 415),
        "padding": 4,
        "note": "Tail volume and white tip in side profile.",
    },
    {
        "id": "tail_material",
        "source": "fuxie_ref_tail_material.png",
        "box": (0, 0, 512, 512),
        "note": "Tail color/material reference pack.",
    },
]


def crop_with_padding(image: Image.Image, box: tuple[int, int, int, int], padding: int = 18) -> Image.Image:
    left, top, right, bottom = box
    left = max(0, left - padding)
    top = max(0, top - padding)
    right = min(image.width, right + padding)
    bottom = min(image.height, bottom + padding)
    return image.crop((left, top, right, bottom))


def fit_square(image: Image.Image, size: int = 512) -> Image.Image:
    canvas = Image.new("RGB", (size, size), (246, 251, 255))
    image = image.convert("RGB")
    image.thumbnail((size - 48, size - 48), Image.Resampling.LANCZOS)
    x = (size - image.width) // 2
    y = (size - image.height) // 2
    canvas.paste(image, (x, y))
    return canvas


def make_contact_sheet(items: list[dict[str, str]]) -> None:
    tile = 256
    label_h = 46
    cols = 4
    rows = (len(items) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * tile, rows * (tile + label_h)), (255, 255, 255))
    draw = ImageDraw.Draw(sheet)
    for index, item in enumerate(items):
        image = Image.open(ROOT / item["workspace_path"]).convert("RGB")
        image.thumbnail((tile - 24, tile - 24), Image.Resampling.LANCZOS)
        col = index % cols
        row = index // cols
        x0 = col * tile
        y0 = row * (tile + label_h)
        sheet.paste(image, (x0 + (tile - image.width) // 2, y0 + 12))
        draw.text((x0 + 12, y0 + tile + 8), item["id"], fill=(20, 45, 65))
    sheet.save(CONTACT_SHEET_PATH)
    shutil.copy2(CONTACT_SHEET_PATH, PUBLIC_CONTACT_SHEET_PATH)


def main() -> None:
    PART_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_PART_DIR.mkdir(parents=True, exist_ok=True)
    manifest_items: list[dict[str, str]] = []

    for part in PARTS:
        source_path = REFERENCE_DIR / part["source"]
        image = Image.open(source_path)
        crop = crop_with_padding(image, part["box"], padding=int(part.get("padding", 18)))
        final = fit_square(crop)
        filename = f"fuxie_ref_part_{part['id']}.png"
        out_path = PART_DIR / filename
        public_path = PUBLIC_PART_DIR / filename
        final.save(out_path)
        shutil.copy2(out_path, public_path)
        manifest_items.append({
            "id": part["id"],
            "source": str(source_path.relative_to(ROOT)).replace("\\", "/"),
            "workspace_path": str(out_path.relative_to(ROOT)).replace("\\", "/"),
            "public_path": str(public_path.relative_to(ROOT)).replace("\\", "/"),
            "note": part["note"],
        })

    manifest = {
        "name": "fuxie_part_references",
        "source_note": "Direct crops from approved Fuxie 3D render references. These are the modeling source of truth; generated helper images must not replace them.",
        "items": manifest_items,
        "contact_sheet": str(CONTACT_SHEET_PATH.relative_to(ROOT)).replace("\\", "/"),
        "public_contact_sheet": str(PUBLIC_CONTACT_SHEET_PATH.relative_to(ROOT)).replace("\\", "/"),
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    make_contact_sheet(manifest_items)
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
