# STYLE LOCK — Codex (gpt-image-2) prompt reference

The patchy look comes from assets that don't share one visual grammar. The fix is a fixed
prefix on every prompt plus a reference-image inheritance trick. Read this before drafting
any image prompt.

## 1. STYLE LOCK prefix — paste verbatim at the top of EVERY prompt

```
STYLE LOCK (mandatory, identical across all images):
- 2.5D dimetric isometric, true 2:1 angle (~26.57°), single light source top-left, soft shadow lower-right.
- Flat color blocks + ONE soft shadow layer + subtle inner stroke. NO photorealism, NO complex gradients, NO texture photos.
- Palette ONLY these hex: bg #F3FBFF, sky-blue #54A8E4 & #60A8E4, deep blue #3C78A8, deep ink #173B56, teal #2EC4B6, white #FFFFFF, accent #FF8A3D (≤5% area), reward amber #FFB703 (reward objects only).
- Warm, premium-minimal, cozy German village. Generous negative space. Rounded, tactile shapes.
- Mascot "Fuxie": a friendly fox-like coach, SAME proportions every time — BRIGHT SKY-BLUE fur (#60A8E4, shading #3C78A8), WHITE face/chest/belly/inner-ears/tail-tip, TEAL hoodie (#2EC4B6), warm eyes, soft rounded ears. Flat 2.5D matching the world. Fuxie is NOT an orange or brown fox.
NEGATIVE: no text/letters in image, no UI chrome, no drop-shadow harshness, no neon, no clutter, no realistic lighting, no multiple light sources, NO orange or brown fox, no realistic fur.
```

## 2. Sequencing rule (the anti-patchwork core)
1. Render ONE style frame (hero screen, usually world map). Get approval.
2. Only after approval, render the rest — and pass the approved frame as a reference image
   so new assets inherit its look:
   ```bash
   gpt-image -p "[STYLE LOCK] <new scene>" -i approved-style-frame.png --size portrait --quality high
   ```
3. Never batch-render before the frame is approved. A wrong style caught at frame stage
   costs one image; caught after a batch it costs the batch.

## 3. Per-asset prompt patterns
- **Style frame / world map:** `[STYLE LOCK] isometric German learning village game map, winding path between location buildings, clean empty rounded node spots on the path (no icons), Fuxie near the market waving. portrait.`
- **Location close-up (lesson intro):** `[STYLE LOCK] close iso view of <building>, Fuxie presenting, blank chalkboard sign (no text). portrait. -i approved-style-frame.png`
- **Gameplay backdrop:** `[STYLE LOCK] minimal iso study nook, lots of empty space for a card, Fuxie small lower-right cheering. portrait. -i ...`
- **Reward objects:** `[STYLE LOCK] set of 4 village reward objects on transparent bg, reward amber #FFB703 allowed. square, isolated, even spacing.`
- **Mascot pose sheet:** `[STYLE LOCK] Fuxie fox, 4 poses, identical proportions, transparent bg: idle-wave, correct-cheer, wrong-oops, level-up-jump. square.`
- **Vocab item icon:** `[STYLE LOCK] single object "<word>" centered, transparent bg. 512x512.`
- **Full-screen MOCKUP (reference target, not spec):** `[STYLE LOCK] full mobile screen mockup (portrait 1080x2340) of <screen>: <layout>. Use placeholder shapes for text (no real letters). Show hierarchy, spacing rhythm, color usage.`

## 4. gpt-image flags worth knowing
`-p` prompt · `-f` output file · `-i` reference image (repeatable — the consistency lever) ·
`-m` PNG mask for localized inpainting · `--size portrait|landscape|1k|2k|4k` (mobile =
`1024x1536`) · `--quality low|medium|high` (low for sweeps, high for shipping assets) ·
`-n` count · `--format png|jpeg|webp`.

## 5. Hard rule on text
gpt-image renders text and fine UI imprecisely. Mockups always use placeholder shapes for
text. Real copy and exact measurements come from tokens + the spec, never from the image.
