from __future__ import annotations

import json
import shutil
from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "blender" / "fuxie" / "imagegen_fullbody" / "v10" / "fuxie_imagegen_fullbody_v10_source.png"
OUT_DIR = ROOT / "blender" / "fuxie" / "generated" / "v10_layers"
PUBLIC_DIR = ROOT / "apps" / "web" / "public" / "mascot-3d" / "imagegen-fullbody" / "v10"
MANIFEST = OUT_DIR / "fuxie_v10_layers_manifest.json"


PARTS = [
    {
        "name": "Fuxie_V10_Tail",
        "label": "tail",
        "rect": (650, 810, 960, 1258),
        "poly": [(670, 860), (785, 820), (920, 880), (958, 1038), (895, 1230), (710, 1255), (650, 1135), (705, 1008)],
        "bg_key": (250, 12),
    },
    {
        "name": "Fuxie_V10_Leg_L",
        "label": "left leg shoe",
        "rect": (230, 1038, 500, 1438),
        "poly": [(275, 1045), (460, 1045), (490, 1330), (425, 1438), (245, 1418), (232, 1280)],
        "bg_key": (250, 12),
    },
    {
        "name": "Fuxie_V10_Leg_R",
        "label": "right leg shoe",
        "rect": (510, 1038, 815, 1445),
        "poly": [(560, 1045), (740, 1045), (810, 1308), (760, 1438), (535, 1435), (515, 1260)],
        "bg_key": (250, 12),
    },
    {
        "name": "Fuxie_V10_Body_Hoodie",
        "label": "body hoodie",
        "rect": (175, 590, 842, 1145),
        "poly": [(300, 600), (715, 600), (795, 745), (818, 985), (740, 1118), (535, 1138), (320, 1120), (210, 980), (232, 745)],
    },
    {
        "name": "Fuxie_V10_Arm_L",
        "label": "left arm hand",
        "rect": (150, 600, 390, 1125),
        "poly": [(210, 610), (338, 620), (370, 920), (352, 1080), (242, 1118), (175, 1015), (152, 790)],
    },
    {
        "name": "Fuxie_V10_Arm_R",
        "label": "right arm hand",
        "rect": (675, 600, 858, 1125),
        "poly": [(695, 610), (808, 620), (850, 815), (835, 1035), (760, 1118), (690, 1068), (682, 870)],
    },
    {
        "name": "Fuxie_V10_Head",
        "label": "head face",
        "rect": (130, 70, 875, 760),
        "poly": [(155, 175), (285, 72), (405, 118), (500, 110), (620, 118), (785, 72), (870, 175), (860, 470), (755, 700), (515, 758), (260, 708), (142, 470)],
        "preserve_white_subject": True,
    },
    {
        "name": "Fuxie_V10_Mouth_Overlay",
        "label": "mouth overlay",
        "rect": (420, 530, 610, 660),
        "poly": [(428, 552), (475, 532), (558, 534), (606, 560), (585, 642), (515, 660), (448, 640)],
    },
]


def is_bg(r: int, g: int, b: int, bg_min: int = 245, bg_diff: int = 18) -> bool:
    return min(r, g, b) > bg_min and (max(r, g, b) - min(r, g, b)) < bg_diff


def foreground_alpha(image: Image.Image, bg_min: int = 245, bg_diff: int = 18) -> Image.Image:
    rgba = image.convert("RGBA")
    width, height = rgba.size
    pixels = rgba.load()
    seen = [[False for _ in range(width)] for _ in range(height)]
    queue: deque[tuple[int, int]] = deque()

    def seed(x: int, y: int) -> None:
        if seen[y][x]:
            return
        r, g, b, _ = pixels[x, y]
        if is_bg(r, g, b, bg_min, bg_diff):
            seen[y][x] = True
            queue.append((x, y))

    for x in range(width):
        seed(x, 0)
        seed(x, height - 1)
    for y in range(height):
        seed(0, y)
        seed(width - 1, y)

    while queue:
        cx, cy = queue.popleft()
        r, g, b, _ = pixels[cx, cy]
        pixels[cx, cy] = (r, g, b, 0)
        for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
            if nx < 0 or nx >= width or ny < 0 or ny >= height or seen[ny][nx]:
                continue
            nr, ng, nb, _ = pixels[nx, ny]
            if is_bg(nr, ng, nb, bg_min, bg_diff):
                seen[ny][nx] = True
                queue.append((nx, ny))
    return rgba


def make_layer(source: Image.Image, original: Image.Image, part: dict[str, object]) -> tuple[Path, dict[str, object]]:
    rect = tuple(part["rect"])
    assert len(rect) == 4
    x0, y0, x1, y1 = rect
    if "bg_key" in part:
        bg_min, bg_diff = part["bg_key"]
        base = foreground_alpha(original, int(bg_min), int(bg_diff))
    else:
        base = original if part.get("use_original_mask") else source
    crop = base.crop((x0, y0, x1, y1)).convert("RGBA")
    polygon = [(x - x0, y - y0) for x, y in part["poly"]]
    mask = Image.new("L", crop.size, 0)
    draw = ImageDraw.Draw(mask)
    draw.polygon(polygon, fill=255)

    pixels = crop.load()
    mask_pixels = mask.load()
    width, height = crop.size
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            alpha = int(a * mask_pixels[x, y] / 255)
            pixels[x, y] = (r, g, b, alpha)

    for overlay_poly in part.get("original_overlays", []):
        overlay = original.crop((x0, y0, x1, y1)).convert("RGBA")
        overlay_mask = Image.new("L", crop.size, 0)
        overlay_draw = ImageDraw.Draw(overlay_mask)
        overlay_draw.polygon([(x - x0, y - y0) for x, y in overlay_poly], fill=255)
        overlay_pixels = overlay.load()
        overlay_mask_pixels = overlay_mask.load()
        for y in range(height):
            for x in range(width):
                overlay_alpha = overlay_mask_pixels[x, y]
                if overlay_alpha:
                    r, g, b, a = overlay_pixels[x, y]
                    pixels[x, y] = (r, g, b, int(a * overlay_alpha / 255))

    if part.get("preserve_white_subject"):
        remove_crop_edge_background(crop)

    output = OUT_DIR / f"{part['name']}.png"
    crop.save(output)
    return output, {
        "name": part["name"],
        "label": part["label"],
        "rect": list(rect),
        "workspace_path": str(output.relative_to(ROOT)).replace("\\", "/"),
    }


def remove_crop_edge_background(crop: Image.Image) -> None:
    pixels = crop.load()
    width, height = crop.size
    seen = [[False for _ in range(width)] for _ in range(height)]
    queue: deque[tuple[int, int]] = deque()

    def seed(x: int, y: int) -> None:
        if seen[y][x]:
            return
        r, g, b, a = pixels[x, y]
        if a > 0 and is_bg(r, g, b):
            seen[y][x] = True
            queue.append((x, y))

    for x in range(width):
        seed(x, 0)
        seed(x, height - 1)
    for y in range(height):
        seed(0, y)
        seed(width - 1, y)

    while queue:
        cx, cy = queue.popleft()
        r, g, b, _ = pixels[cx, cy]
        pixels[cx, cy] = (r, g, b, 0)
        for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
            if nx < 0 or nx >= width or ny < 0 or ny >= height or seen[ny][nx]:
                continue
            nr, ng, nb, na = pixels[nx, ny]
            if na > 0 and is_bg(nr, ng, nb):
                seen[ny][nx] = True
                queue.append((nx, ny))


def make_contact_sheet(items: list[dict[str, object]]) -> Path:
    tile = 240
    label_height = 34
    cols = 4
    rows = (len(items) + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * tile, rows * (tile + label_height)), (255, 255, 255, 255))
    draw = ImageDraw.Draw(sheet)
    for index, item in enumerate(items):
        image = Image.open(ROOT / str(item["workspace_path"])).convert("RGBA")
        image.thumbnail((tile - 36, tile - 44), Image.Resampling.LANCZOS)
        col = index % cols
        row = index // cols
        x0 = col * tile
        y0 = row * (tile + label_height)
        sheet.paste(image, (x0 + (tile - image.width) // 2, y0 + 12), image)
        draw.text((x0 + 12, y0 + tile + 5), str(item["label"]), fill=(15, 55, 80, 255))
    output = OUT_DIR / "fuxie_v10_layers_contact_sheet.png"
    sheet.convert("RGB").save(output)
    return output


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    if not SOURCE.exists():
        raise FileNotFoundError(SOURCE)

    original = Image.open(SOURCE).convert("RGBA")
    source = foreground_alpha(original)
    alpha_source = OUT_DIR / "fuxie_imagegen_fullbody_v10_alpha.png"
    source.save(alpha_source)
    shutil.copy2(alpha_source, PUBLIC_DIR / alpha_source.name)

    items = []
    for part in PARTS:
        output, item = make_layer(source, original, part)
        shutil.copy2(output, PUBLIC_DIR / output.name)
        items.append(item)
    contact_sheet = make_contact_sheet(items)
    shutil.copy2(contact_sheet, PUBLIC_DIR / contact_sheet.name)
    manifest = {
        "name": "fuxie_v10_coherent_layers",
        "source": str(SOURCE.relative_to(ROOT)).replace("\\", "/"),
        "alpha_source": str(alpha_source.relative_to(ROOT)).replace("\\", "/"),
        "source_note": "Layers are segmented from one coherent Codex-generated full-body Fuxie render to reduce mismatched lighting/perspective seams.",
        "items": items,
        "contact_sheet": str(contact_sheet.relative_to(ROOT)).replace("\\", "/"),
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    shutil.copy2(MANIFEST, PUBLIC_DIR / MANIFEST.name)
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
