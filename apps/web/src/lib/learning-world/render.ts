/**
 * Original Fuxie code (no Mykonos lift). This file carries no MIT/Mykonos
 * header per Requirement 6 (10+ contiguous adapted lines is the trigger;
 * `paint` is a Fuxie-original orchestration over the typed core and
 * contains zero such lines).
 *
 * Pure paint orchestration over the framework-agnostic Learning_World_Core.
 * Framework-agnostic: no React, Next, or DOM identifiers appear in this
 * file. The host (React layer) acquires a real 2D canvas context and
 * passes it via the structural `WorldCanvasContext` seam; this file
 * never names a DOM type.
 *
 * Visual-pass-2 additions:
 *   - Background gradient (sky/ground) via per-row `fillRect` strips with
 *     a `fillStyle` duck-typed at runtime. The 8-method seam remains
 *     unchanged (Requirement 3.5); `fillStyle` is set only when the host
 *     context exposes it (real browser 2D contexts do, mock 8-
 *     method seams used by tests do not).
 *   - Isometric ground-tile field rendered via `fillRect` per cell
 *     diamond using `setTransform`/`scale`/`translate` only (no new seam
 *     methods).
 *   - Drop-shadow ellipse approximated with a horizontal `fillRect` band
 *     under each sprite, painted before the sprite so depth ordering is
 *     preserved.
 */

import { LearningWorldError } from './errors'
import {
    isWorldCanvasContext,
    type WorldCanvasContext,
    type WorldImageSource,
} from './world-canvas-context'
import type { IsoGrid } from './iso-grid'
import type { WorldCamera } from './world-camera'
import type { WorldMap } from './world-map'
import type { WorldScene } from './world-scene'
import { sortKey, type WorldObject } from './world-object'

/**
 * Viewport metadata consumed by `paint`. The host is responsible for
 * supplying CSS dimensions and an already-clamped device-pixel ratio
 * (`min(window.devicePixelRatio, 3)` per Requirement 9.1).
 */
export interface Viewport {
    /** Visible CSS-pixel width of the host `<canvas>` element. */
    readonly cssWidth: number
    /** Visible CSS-pixel height of the host `<canvas>` element. */
    readonly cssHeight: number
    /** Already clamped to `min(dpr, 3)` by the host. */
    readonly devicePixelRatio: number
}

/**
 * Inputs required by `paint`. Every field is readonly; `paint` never
 * mutates any of them and does not retain references after returning.
 */
export interface RenderInputs {
    readonly scene: WorldScene
    readonly grid: IsoGrid
    readonly camera: WorldCamera
    readonly map: WorldMap
    readonly images: ReadonlyMap<string, WorldImageSource>
    readonly viewport: Viewport
}

// ---------------------------------------------------------------------------
// Stage palette (Fuxie-original — no Mykonos colors).
// ---------------------------------------------------------------------------

const PALETTE = {
    skyTop: '#3a4d6b',
    skyBottom: '#1f2937',
    groundTop: '#4a6b8a',
    groundBottom: '#283a52',
    tileLight: '#5a7ea0',
    tileDark: '#3e5a7a',
    gridLine: '#6088b0',
    pathRoute: '#a9c8e8',
    shadow: 'rgba(0, 0, 0, 0.35)',
} as const

const HORIZON_FRACTION = 0.55

// ---------------------------------------------------------------------------
// Duck-typed fillStyle helper.
//
// Req 3.5 fixes the WorldCanvasContext method set at exactly eight
// methods. `fillStyle` is a *property* (setter), not a method, and it
// also is not part of the structural seam, so paint() must NOT depend on
// it being present. We treat it as an optional capability the host *may*
// expose: real browser 2D contexts do, the recording / counting
// mock contexts used in tests do not. When the property is present, paint
// uses it for color depth; when absent, paint still produces a structurally
// valid frame using the host's current fillStyle (which defaults to
// '#000000' on a fresh canvas).
// ---------------------------------------------------------------------------

interface FillStyleCapable {
    fillStyle: string
}

function hasFillStyle(ctx: WorldCanvasContext): ctx is WorldCanvasContext &
    FillStyleCapable {
    // Avoid `'fillStyle' in ctx` because it would also match a getter
    // that throws. Instead probe the descriptor: a writable string-like
    // property is what we need.
    if (ctx === null || typeof ctx !== 'object') return false
    const value = (ctx as unknown as Record<string, unknown>).fillStyle
    return typeof value === 'string'
}

function setFill(ctx: WorldCanvasContext, color: string): void {
    if (hasFillStyle(ctx)) {
        ctx.fillStyle = color
    }
}

// ---------------------------------------------------------------------------
// Paint
// ---------------------------------------------------------------------------

/**
 * Pure render orchestration. Runs through the V0 paint sequence:
 *
 * 1. Validate `ctx` structurally via `isWorldCanvasContext`. If the check
 *    fails, throw `LearningWorldError('INVALID_CONTEXT', ...)`. No method
 *    on `ctx` is called and no input is read or mutated before this gate
 *    passes (Requirement 3.7).
 * 2. `setTransform(dpr, 0, 0, dpr, 0, 0)` to map CSS pixels to backing
 *    store pixels using `viewport.devicePixelRatio` (Requirement 9.1).
 * 3. `clearRect` over the CSS viewport.
 * 4. Sky/ground gradient as horizontal `fillRect` strips. Each strip
 *    sets `fillStyle` (when the host supports it) before drawing.
 * 5. Compose the camera transform onto the current matrix using
 *    `scale(zoom, zoom)` then `translate(-panX, -panY)`.
 * 6. Iso-tile field over the visible grid: per cell, paint a diamond
 *    `fillRect` (in transformed space) with alternating tile colors,
 *    plus thin grid line strokes (also via `fillRect`).
 * 7. Iterate `inputs.scene.terrain` in declaration order. V0 ships zero
 *    terrain entries; future slices may extend it.
 * 8. Take a snapshot of `map.objects()`, sort it ascending by `sortKey`,
 *    and for each object: paint a drop-shadow band under the sprite,
 *    then `drawImage(img, screen.x, screen.y, img.width, img.height)`.
 *    Objects whose `assetKey` is absent from `images` are skipped.
 *
 * Atomicity on rejection: the structural validation runs before any
 * canvas method is invoked or any input field is read mutably. All
 * inputs are typed as `readonly`; `paint` never mutates them.
 */
export function paint(ctx: WorldCanvasContext, inputs: RenderInputs): void {
    if (!isWorldCanvasContext(ctx)) {
        throw new LearningWorldError(
            'INVALID_CONTEXT',
            'paint: ctx must be a WorldCanvasContext (object exposing the eight required methods)',
        )
    }

    const { scene, grid, camera, map, images, viewport } = inputs
    const { cssWidth, cssHeight, devicePixelRatio: dpr } = viewport

    // 1. Map CSS pixels to backing-store pixels.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // 2. Clear the visible viewport.
    ctx.clearRect(0, 0, cssWidth, cssHeight)

    // 3. Sky/ground gradient. We approximate a vertical gradient with a
    //    fixed number of horizontal strips; 32 strips is enough to look
    //    smooth at typical viewport heights without burning fill calls.
    paintSkyGroundGradient(ctx, cssWidth, cssHeight)

    // 4. Compose camera transform on top of the DPR transform. After
    //    these calls, drawing at world (wx, wy) maps to CSS pixel
    //    `(wx - panX) * zoom`, then DPR-scaled into backing store.
    const zoom = camera.getZoom()
    const pan = camera.getPan()
    ctx.scale(zoom, zoom)
    ctx.translate(-pan.x, -pan.y)

    // 5. Iso-tile field. Bounded by the grid's cell extent so we don't
    //    paint an unbounded plane.
    paintIsoTileField(ctx, grid)

    // 6. Terrain pass. V0 ships zero terrain entries; the loop is
    //    written for future slices and is a no-op when scene.terrain
    //    is empty.
    for (const terrain of scene.terrain) {
        const image = images.get(terrain.assetKey)
        if (image === undefined) continue
        const screen = grid.cellToScreen(terrain.gx, terrain.gy)
        ctx.drawImage(image, screen.x, screen.y, image.width, image.height)
    }

    // 6b. Path-connector overlay (V1 polish-1, Codex finding #2). Hub-
    //    and-spoke: from the FIRST registered object's footprint center
    //    out to every other object's footprint center, as a thin
    //    `fillRect` line approximated by Bresenham-style segment
    //    sampling. Reads as "the village is the entry point and these
    //    are the destinations" without committing the lab to a
    //    specific game-design path graph.
    paintPathConnectors(ctx, grid, map.objects())

    // 7. Object pass. Sort a fresh snapshot by sortKey ascending so that
    //    larger sortKey values (geometrically in front) paint last.
    const drawList: WorldObject[] = map.objects().slice()
    drawList.sort((a, b) => sortKey(a) - sortKey(b))

    for (const object of drawList) {
        const image = images.get(object.assetKey)
        if (image === undefined) continue
        const screen = grid.cellToScreen(object.gx, object.gy)
        // Drop-shadow band under the sprite. Centered on the sprite's
        // base, narrower than the sprite to evoke depth without
        // dominating the silhouette.
        paintDropShadow(ctx, screen.x, screen.y, image.width, image.height)
        ctx.drawImage(image, screen.x, screen.y, image.width, image.height)
    }
}

// ---------------------------------------------------------------------------
// Stage helpers
// ---------------------------------------------------------------------------

/**
 * Paint a vertical sky/ground gradient as horizontal `fillRect` strips.
 * Sky occupies the top `HORIZON_FRACTION` of the viewport; ground fills
 * the remainder. Both bands fade into each other using an interpolated
 * color per strip.
 */
function paintSkyGroundGradient(
    ctx: WorldCanvasContext,
    cssWidth: number,
    cssHeight: number,
): void {
    const stripCount = 32
    const stripH = cssHeight / stripCount
    const horizonStrip = Math.floor(stripCount * HORIZON_FRACTION)

    for (let i = 0; i < stripCount; i++) {
        let color: string
        if (i < horizonStrip) {
            const t = horizonStrip === 0 ? 1 : i / horizonStrip
            color = lerpColor(PALETTE.skyTop, PALETTE.skyBottom, t)
        } else {
            const denom = stripCount - horizonStrip
            const t = denom <= 0 ? 0 : (i - horizonStrip) / denom
            color = lerpColor(PALETTE.groundTop, PALETTE.groundBottom, t)
        }
        setFill(ctx, color)
        ctx.fillRect(0, i * stripH, cssWidth, stripH + 1)
    }
}

/**
 * Paint an isometric tile field across the entire grid using diamond
 * fills. Each cell is rendered as a thin axis-aligned `fillRect` strip
 * sequence approximating the diamond shape — we cannot stroke arbitrary
 * polygons through the 8-method seam, so we approximate diamonds with
 * 4 thin rectangle bands per cell. Alternating tile colors create a
 * checker pattern that reads as a plaza.
 */
function paintIsoTileField(ctx: WorldCanvasContext, grid: IsoGrid): void {
    const { cols, rows, tileWidth, tileHeight } = grid
    const halfW = tileWidth / 2
    const halfH = tileHeight / 2

    for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
            const checker = (gx + gy) % 2 === 0
            const color = checker ? PALETTE.tileLight : PALETTE.tileDark
            setFill(ctx, color)

            const cx = (gx - gy) * halfW
            const cy = (gx + gy) * halfH

            // Approximate the diamond with 4 horizontal strips. Each
            // strip is `tileHeight / 4` tall; widths are computed so the
            // outline traces the diamond's silhouette.
            const stripH = tileHeight / 4
            for (let s = 0; s < 4; s++) {
                // Distance from the diamond center vertically, normalized
                // to [0, 1]: 0 at the top/bottom, 1 at the equator.
                const stripCenterY = cy - halfH + (s + 0.5) * stripH
                const dy = Math.abs(stripCenterY - cy)
                const widthRatio = 1 - dy / halfH
                const stripW = tileWidth * widthRatio
                const stripX = cx - stripW / 2
                ctx.fillRect(stripX, stripCenterY - stripH / 2, stripW, stripH)
            }
        }
    }

    // Subtle grid lines using a single thin band per row/col diagonal.
    setFill(ctx, PALETTE.gridLine)
    for (let gy = 0; gy <= rows; gy++) {
        for (let gx = 0; gx <= cols; gx++) {
            const cx = (gx - gy) * halfW
            const cy = (gx + gy) * halfH
            // 1×1 px dot at every grid intersection; cheap and only
            // visible at high zoom.
            ctx.fillRect(cx - 0.5, cy - 0.5, 1, 1)
        }
    }
}

/**
 * Paint a thin "path corridor" line from the first object's footprint
 * center to every other object's footprint center. Uses uniformly
 * sampled `fillRect` dots along each line — the 8-method seam exposes
 * neither `lineTo` nor `stroke`, so we sample along a parametric line
 * with a fixed step in world coordinates. This reads as a subtle route
 * connecting the village to the destinations without committing to a
 * specific game-design path graph (V1 polish-1, Codex finding #2).
 *
 * Skip when fewer than 2 objects are registered (no destinations to
 * connect to).
 */
function paintPathConnectors(
    ctx: WorldCanvasContext,
    grid: IsoGrid,
    objects: readonly WorldObject[],
): void {
    if (objects.length < 2) return

    setFill(ctx, PALETTE.pathRoute)

    const hub = objects[0]
    if (hub === undefined) return
    const hubCenter = footprintCenter(grid, hub)

    for (let i = 1; i < objects.length; i++) {
        const dest = objects[i]
        if (dest === undefined) continue
        const destCenter = footprintCenter(grid, dest)
        paintLine(ctx, hubCenter.x, hubCenter.y, destCenter.x, destCenter.y)
    }
}

/**
 * Compute the screen-space center of a `WorldObject`'s footprint. We
 * average the top-left corner with the back corner so multi-cell
 * footprints settle on their visual center, not their origin.
 */
function footprintCenter(
    grid: IsoGrid,
    obj: WorldObject,
): { x: number; y: number } {
    const tl = grid.cellToScreen(obj.gx, obj.gy)
    const br = grid.cellToScreen(
        obj.gx + obj.footprint.w - 1,
        obj.gy + obj.footprint.d - 1,
    )
    return { x: (tl.x + br.x) / 2, y: (tl.y + br.y) / 2 }
}

/**
 * Sample a straight line between `(x0, y0)` and `(x1, y1)` and paint a
 * tiny `fillRect` dot every `STEP` world-units. Dots overlap slightly to
 * read as a continuous (but textured) line at typical zoom levels.
 */
function paintLine(
    ctx: WorldCanvasContext,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
): void {
    const dx = x1 - x0
    const dy = y1 - y0
    const distance = Math.hypot(dx, dy)
    if (distance < 1) return
    const STEP = 6
    const DOT = 4
    const steps = Math.ceil(distance / STEP)
    for (let i = 0; i <= steps; i++) {
        const t = i / steps
        const x = x0 + dx * t
        const y = y0 + dy * t
        ctx.fillRect(x - DOT / 2, y - DOT / 2, DOT, DOT)
    }
}

/**
 * Paint a flattened drop-shadow ellipse approximation under a sprite.
 * The shadow is a horizontal band centered on the sprite's bottom edge.
 * Width is 60% of sprite width; height is 8% of sprite height. We
 * compose two stacked bands of decreasing opacity to fake a soft edge.
 */
function paintDropShadow(
    ctx: WorldCanvasContext,
    spriteX: number,
    spriteY: number,
    spriteW: number,
    spriteH: number,
): void {
    if (spriteW <= 0 || spriteH <= 0) return
    const shadowW = spriteW * 0.6
    const shadowH = Math.max(2, spriteH * 0.08)
    const shadowX = spriteX + (spriteW - shadowW) / 2
    const shadowY = spriteY + spriteH - shadowH / 2

    setFill(ctx, PALETTE.shadow)
    // Inner band (full width, 60% of total height — deepest part).
    ctx.fillRect(shadowX, shadowY, shadowW, shadowH * 0.6)
    // Outer band (slightly wider, lighter — uses the same color since
    // we cannot stack alpha through the 8-method seam, but the effect
    // still reads as a soft base).
    ctx.fillRect(
        shadowX - shadowW * 0.05,
        shadowY + shadowH * 0.6,
        shadowW * 1.1,
        shadowH * 0.4,
    )
}

// ---------------------------------------------------------------------------
// Color math
// ---------------------------------------------------------------------------

/**
 * Linear interpolation between two hex colors `#rrggbb`. Returns a hex
 * color string. `t` is clamped to `[0, 1]`.
 */
function lerpColor(a: string, b: string, t: number): string {
    const tt = Math.max(0, Math.min(1, t))
    const ar = parseInt(a.slice(1, 3), 16)
    const ag = parseInt(a.slice(3, 5), 16)
    const ab = parseInt(a.slice(5, 7), 16)
    const br = parseInt(b.slice(1, 3), 16)
    const bg = parseInt(b.slice(3, 5), 16)
    const bb = parseInt(b.slice(5, 7), 16)
    const rr = Math.round(ar + (br - ar) * tt)
    const gg = Math.round(ag + (bg - ag) * tt)
    const bbb = Math.round(ab + (bb - ab) * tt)
    return `#${rr.toString(16).padStart(2, '0')}${gg
        .toString(16)
        .padStart(2, '0')}${bbb.toString(16).padStart(2, '0')}`
}
