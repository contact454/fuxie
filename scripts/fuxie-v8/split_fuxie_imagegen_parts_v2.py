from __future__ import annotations

import json
import shutil
from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "blender" / "fuxie" / "imagegen_parts" / "v2" / "fuxie_imagegen_parts_v2_sheet.png"
OUT_DIR = ROOT / "blender" / "fuxie" / "imagegen_parts" / "v2" / "parts"
PUBLIC_OUT_DIR = ROOT / "apps" / "web" / "public" / "mascot-3d" / "imagegen-parts" / "v2" / "parts"
MANIFEST = OUT_DIR / "fuxie_imagegen_parts_v2_manifest.json"
PUBLIC_MANIFEST = PUBLIC_OUT_DIR / "fuxie_imagegen_parts_v2_manifest.json"
CONTACT_SHEET = OUT_DIR / "fuxie_imagegen_parts_v2_contact_sheet.png"
PUBLIC_CONTACT_SHEET = PUBLIC_OUT_DIR / "fuxie_imagegen_parts_v2_contact_sheet.png"


PART_BY_REGION = [
    ("head_face", "head face", (0, 0, 570, 500)),
    ("left_ear", "left ear", (570, 0, 900, 470)),
    ("right_ear", "right ear", (900, 0, 1254, 470)),
    ("body_hoodie_token", "body hoodie token", (0, 470, 570, 860)),
    ("left_arm_hand", "left arm hand", (570, 470, 850, 850)),
    ("right_arm_hand", "right arm hand", (850, 470, 1254, 850)),
    ("left_leg_shoe", "left leg shoe", (0, 850, 310, 1254)),
    ("right_leg_shoe", "right leg shoe", (310, 850, 610, 1254)),
    ("tail", "tail", (610, 850, 970, 1254)),
    ("bandana_token", "bandana token", (970, 850, 1254, 1254)),
]


def ensure_dirs() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_OUT_DIR.mkdir(parents=True, exist_ok=True)


def subject_mask(image: Image.Image) -> bytearray:
    rgb = image.convert("RGB")
    width, height = rgb.size
    pixels = rgb.load()
    mask = bytearray(width * height)
    for y in range(height):
        for x in range(width):
            r, g, b = pixels[x, y]
            # The generated sheet has a white studio background. Keep subtle fur
            # edge antialiasing, but drop the near-white canvas.
            if min(r, g, b) < 248 and (255 - r) + (255 - g) + (255 - b) > 18:
                mask[y * width + x] = 1
    return mask


def components(mask: bytearray, width: int, height: int) -> list[tuple[int, tuple[int, int, int, int]]]:
    seen = bytearray(width * height)
    found: list[tuple[int, tuple[int, int, int, int]]] = []
    for y in range(height):
        for x in range(width):
            idx = y * width + x
            if not mask[idx] or seen[idx]:
                continue
            queue = deque([(x, y)])
            seen[idx] = 1
            min_x = max_x = x
            min_y = max_y = y
            count = 0
            while queue:
                cx, cy = queue.popleft()
                count += 1
                min_x = min(min_x, cx)
                max_x = max(max_x, cx)
                min_y = min(min_y, cy)
                max_y = max(max_y, cy)
                for nx in (cx - 1, cx, cx + 1):
                    for ny in (cy - 1, cy, cy + 1):
                        if nx < 0 or nx >= width or ny < 0 or ny >= height:
                            continue
                        nidx = ny * width + nx
                        if mask[nidx] and not seen[nidx]:
                            seen[nidx] = 1
                            queue.append((nx, ny))
            if count > 1000:
                found.append((count, (min_x, min_y, max_x, max_y)))
    return found


def intersects(a: tuple[int, int, int, int], b: tuple[int, int, int, int]) -> bool:
    return not (a[2] < b[0] or b[2] < a[0] or a[3] < b[1] or b[3] < a[1])


def is_background_candidate(r: int, g: int, b: int) -> bool:
    return min(r, g, b) > 242 and (255 - r) + (255 - g) + (255 - b) < 42


def add_alpha(crop: Image.Image) -> Image.Image:
    rgba = crop.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    seen = [[False for _ in range(width)] for _ in range(height)]
    queue: deque[tuple[int, int]] = deque()

    def maybe_seed(x: int, y: int) -> None:
        if seen[y][x]:
            return
        r, g, b, _ = pixels[x, y]
        if is_background_candidate(r, g, b):
            seen[y][x] = True
            queue.append((x, y))

    for x in range(width):
        maybe_seed(x, 0)
        maybe_seed(x, height - 1)
    for y in range(height):
        maybe_seed(0, y)
        maybe_seed(width - 1, y)

    while queue:
        cx, cy = queue.popleft()
        r, g, b, _ = pixels[cx, cy]
        pixels[cx, cy] = (r, g, b, 0)
        for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
            if nx < 0 or nx >= width or ny < 0 or ny >= height or seen[ny][nx]:
                continue
            nr, ng, nb, _ = pixels[nx, ny]
            if is_background_candidate(nr, ng, nb):
                seen[ny][nx] = True
                queue.append((nx, ny))
    return rgba


def padded(box: tuple[int, int, int, int], width: int, height: int, pad: int = 34) -> tuple[int, int, int, int]:
    return (
        max(0, box[0] - pad),
        max(0, box[1] - pad),
        min(width - 1, box[2] + pad),
        min(height - 1, box[3] + pad),
    )


def split_parts() -> list[dict[str, object]]:
    image = Image.open(SOURCE).convert("RGBA")
    width, height = image.size
    comps = components(subject_mask(image), width, height)
    items: list[dict[str, object]] = []
    used: set[tuple[int, int, int, int]] = set()
    for part_id, label, region in PART_BY_REGION:
        candidates = [(count, box) for count, box in comps if intersects(box, region) and box not in used]
        if not candidates:
            raise RuntimeError(f"No generated component found for {part_id}")
        _, box = max(candidates, key=lambda item: item[0])
        used.add(box)
        crop_box = padded(box, width, height)
        crop = add_alpha(image.crop((crop_box[0], crop_box[1], crop_box[2] + 1, crop_box[3] + 1)))
        output = OUT_DIR / f"fuxie_imagegen_parts_v2_{part_id}.png"
        public_output = PUBLIC_OUT_DIR / output.name
        crop.save(output)
        shutil.copy2(output, public_output)
        items.append(
            {
                "id": part_id,
                "label": label,
                "source_component_box": list(box),
                "crop_box": list(crop_box),
                "workspace_path": str(output.relative_to(ROOT)).replace("\\", "/"),
                "public_path": str(public_output.relative_to(ROOT)).replace("\\", "/"),
            }
        )
    return items


def make_contact_sheet(items: list[dict[str, object]]) -> None:
    tile = 260
    label_height = 34
    cols = 5
    rows = (len(items) + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * tile, rows * (tile + label_height)), (255, 255, 255, 255))
    draw = ImageDraw.Draw(sheet)
    for index, item in enumerate(items):
        part = Image.open(ROOT / str(item["workspace_path"])).convert("RGBA")
        part.thumbnail((tile - 36, tile - 48), Image.Resampling.LANCZOS)
        col = index % cols
        row = index // cols
        x0 = col * tile
        y0 = row * (tile + label_height)
        sheet.paste(part, (x0 + (tile - part.width) // 2, y0 + 16), part)
        draw.text((x0 + 14, y0 + tile + 5), str(item["label"]), fill=(15, 55, 80, 255))
    sheet.convert("RGB").save(CONTACT_SHEET)
    shutil.copy2(CONTACT_SHEET, PUBLIC_CONTACT_SHEET)


def main() -> None:
    ensure_dirs()
    if not SOURCE.exists():
        raise FileNotFoundError(SOURCE)
    items = split_parts()
    make_contact_sheet(items)
    manifest = {
        "name": "fuxie_imagegen_parts_v2",
        "source_sheet": str(SOURCE.relative_to(ROOT)).replace("\\", "/"),
        "source_note": "Codex image generation output based on Fuxie 3D references. These are newly generated modular body-part renders, not crops from the original Fuxie images.",
        "usage_note": "Use this as the visual source pack for the next modular assembly and rig pass; keep V6B as runtime fallback until approved.",
        "items": items,
        "contact_sheet": str(CONTACT_SHEET.relative_to(ROOT)).replace("\\", "/"),
        "public_contact_sheet": str(PUBLIC_CONTACT_SHEET.relative_to(ROOT)).replace("\\", "/"),
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    shutil.copy2(MANIFEST, PUBLIC_MANIFEST)
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
