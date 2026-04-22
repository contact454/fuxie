import os
from PIL import Image

def remove_background(image_path):
    try:
        img = Image.open(image_path).convert("RGBA")
        
        # Get the color of the top-left pixel
        # We assume the background is uniform and exists at (0,0)
        bg_color = img.getpixel((0, 0))
        
        # We only remove background if it's white or very close to white
        # If it's already transparent, we skip
        if bg_color[3] == 0:
            print(f"Skipping {image_path}: already transparent.")
            return

        # Flood fill to replace background with transparent
        from PIL import ImageDraw
        ImageDraw.floodfill(img, xy=(0, 0), value=(255, 255, 255, 0), thresh=20)
        
        # Also floodfill from other corners just in case the background is disconnected
        width, height = img.size
        ImageDraw.floodfill(img, xy=(width-1, 0), value=(255, 255, 255, 0), thresh=20)
        ImageDraw.floodfill(img, xy=(0, height-1), value=(255, 255, 255, 0), thresh=20)
        ImageDraw.floodfill(img, xy=(width-1, height-1), value=(255, 255, 255, 0), thresh=20)

        img.save(image_path, "PNG")
        print(f"Processed {image_path}")
    except Exception as e:
        print(f"Error processing {image_path}: {e}")

directory = "apps/web/public/mascot/core"
for filename in os.listdir(directory):
    if filename.endswith(".png"):
        remove_background(os.path.join(directory, filename))
