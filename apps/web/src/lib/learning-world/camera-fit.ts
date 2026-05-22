/**
 * Original Fuxie code (no Mykonos lift). Carries no MIT/Mykonos header
 * per Requirement 6 (10+ contiguous adapted lines is the trigger; this
 * file is a Fuxie-original auto-fit helper that contains zero adapted
 * lines).
 *
 * Pure auto-fit camera math. Given the visual bounds of a scene's objects
 * and a target viewport, compute the (zoom, panX, panY) that frames the
 * entire scene with a configurable padding so no object touches the
 * canvas edges.
 *
 * Framework-agnostic: no React, Next, or DOM identifiers. The lab page
 * supplies object world-space rectangles measured at paint time; this
 * helper converts them into camera state. Designed for property-based
 * testing — every public function is pure and totally specified.
 *
 * Validates: Visual-pass-2 task 1 (auto-fit camera). The math is
 * exercised via property tests in `__tests__/camera-fit.test.ts`.
 */

import { LearningWorldError } from './errors'

/**
 * Axis-aligned bounding rectangle in world (= unscaled screen) space.
 * `minX <= maxX` and `minY <= maxY` after construction.
 */
export interface SceneBounds {
    readonly minX: number
    readonly minY: number
    readonly maxX: number
    readonly maxY: number
}

/**
 * Result of `computeAutoFitCamera`. The host applies these values via
 * `WorldCamera.setZoom` and `WorldCamera.setPan`.
 *
 * - `zoom` is clamped to the camera's `[minZoom, maxZoom]` range.
 * - `panX`, `panY` are world-space coordinates such that drawing at
 *   `(panX, panY)` lands at viewport pixel `(0, 0)` after the
 *   `scale(zoom)` then `translate(-pan)` transform composed by `paint`.
 */
export interface AutoFitResult {
    readonly zoom: number
    readonly panX: number
    readonly panY: number
}

/** Configuration for `computeAutoFitCamera`. */
export interface AutoFitConfig {
    /** CSS-pixel viewport width. Must be a finite positive number. */
    readonly viewportWidth: number
    /** CSS-pixel viewport height. Must be a finite positive number. */
    readonly viewportHeight: number
    /** Minimum zoom (inclusive). Must be > 0 and finite. */
    readonly minZoom: number
    /** Maximum zoom (inclusive). Must satisfy `maxZoom >= minZoom` and be finite. */
    readonly maxZoom: number
    /**
     * Padding on each side of the viewport, in CSS pixels. Optional;
     * defaults to 32 px. Must be finite, non-negative, and small enough
     * that `viewportWidth - 2 * padding > 0` (otherwise auto-fit cannot
     * produce a positive zoom and the helper falls back to `minZoom`).
     */
    readonly padding?: number
}

const DEFAULT_PADDING_PX = 32

function isFiniteNumber(v: unknown): v is number {
    return typeof v === 'number' && Number.isFinite(v)
}

function invalidConfig(message: string): LearningWorldError {
    return new LearningWorldError(
        'INVALID_CAMERA_CONFIG',
        `computeAutoFitCamera: ${message}`,
    )
}

/**
 * Combine a list of object world-space rectangles into a single
 * `SceneBounds`. Each rectangle is `{ x, y, w, h }` where `(x, y)` is the
 * top-left and `w`, `h` are positive CSS-pixel-equivalent extents in
 * world coordinates.
 *
 * Returns `null` when `rects` is empty. The caller decides what to do in
 * that case (typically: skip auto-fit and keep the camera default).
 */
export function combineRects(
    rects: ReadonlyArray<{
        readonly x: number
        readonly y: number
        readonly w: number
        readonly h: number
    }>,
): SceneBounds | null {
    if (rects.length === 0) return null

    let minX = Number.POSITIVE_INFINITY
    let minY = Number.POSITIVE_INFINITY
    let maxX = Number.NEGATIVE_INFINITY
    let maxY = Number.NEGATIVE_INFINITY

    for (const r of rects) {
        if (
            !isFiniteNumber(r.x) ||
            !isFiniteNumber(r.y) ||
            !isFiniteNumber(r.w) ||
            !isFiniteNumber(r.h)
        ) {
            // Skip non-finite rects rather than throw; this lets the
            // host pass partial measurements during async image loads.
            continue
        }
        if (r.w < 0 || r.h < 0) continue
        if (r.x < minX) minX = r.x
        if (r.y < minY) minY = r.y
        if (r.x + r.w > maxX) maxX = r.x + r.w
        if (r.y + r.h > maxY) maxY = r.y + r.h
    }

    if (
        !Number.isFinite(minX) ||
        !Number.isFinite(minY) ||
        !Number.isFinite(maxX) ||
        !Number.isFinite(maxY)
    ) {
        return null
    }
    return { minX, minY, maxX, maxY }
}

/**
 * Compute the (zoom, panX, panY) that fits `bounds` inside a
 * `viewportWidth × viewportHeight` rectangle with `padding` px on each
 * side, capped to the camera's `[minZoom, maxZoom]` range, and centers
 * the bounds inside the viewport.
 *
 * Math:
 *   contentW   = bounds.maxX - bounds.minX
 *   contentH   = bounds.maxY - bounds.minY
 *   availableW = max(1, viewportWidth  - 2 * padding)
 *   availableH = max(1, viewportHeight - 2 * padding)
 *   zoom_raw   = min(availableW / contentW, availableH / contentH)
 *   zoom       = clamp(zoom_raw, minZoom, maxZoom)
 *   centerX    = (bounds.minX + bounds.maxX) / 2
 *   centerY    = (bounds.minY + bounds.maxY) / 2
 *   panX       = centerX - viewportWidth  / (2 * zoom)
 *   panY       = centerY - viewportHeight / (2 * zoom)
 *
 * The pan formula derives directly from `WorldCamera.worldToScreen`:
 * a world point lands at `(world - pan) * zoom`. For the bounds center
 * to land at the viewport center `(viewportWidth/2, viewportHeight/2)`,
 * `pan = center - viewport/(2*zoom)`.
 *
 * Throws `INVALID_CAMERA_CONFIG` for invalid configuration. Returns
 * `null` when `bounds` is degenerate (zero or negative content area).
 */
export function computeAutoFitCamera(
    bounds: SceneBounds,
    config: AutoFitConfig,
): AutoFitResult | null {
    if (config === null || typeof config !== 'object') {
        throw invalidConfig(`config must be an object, got ${String(config)}`)
    }
    const {
        viewportWidth,
        viewportHeight,
        minZoom,
        maxZoom,
        padding = DEFAULT_PADDING_PX,
    } = config

    if (!isFiniteNumber(viewportWidth) || viewportWidth <= 0) {
        throw invalidConfig(
            `viewportWidth must be > 0 finite (got ${String(viewportWidth)})`,
        )
    }
    if (!isFiniteNumber(viewportHeight) || viewportHeight <= 0) {
        throw invalidConfig(
            `viewportHeight must be > 0 finite (got ${String(viewportHeight)})`,
        )
    }
    if (!isFiniteNumber(minZoom) || minZoom <= 0) {
        throw invalidConfig(`minZoom must be > 0 finite (got ${String(minZoom)})`)
    }
    if (!isFiniteNumber(maxZoom) || maxZoom < minZoom) {
        throw invalidConfig(
            `maxZoom must be finite and >= minZoom (got ${String(maxZoom)})`,
        )
    }
    if (!isFiniteNumber(padding) || padding < 0) {
        throw invalidConfig(
            `padding must be >= 0 finite (got ${String(padding)})`,
        )
    }

    if (
        !isFiniteNumber(bounds.minX) ||
        !isFiniteNumber(bounds.maxX) ||
        !isFiniteNumber(bounds.minY) ||
        !isFiniteNumber(bounds.maxY)
    ) {
        throw invalidConfig('bounds must contain finite numeric edges')
    }

    const contentW = bounds.maxX - bounds.minX
    const contentH = bounds.maxY - bounds.minY
    if (contentW <= 0 || contentH <= 0) return null

    const availableW = Math.max(1, viewportWidth - 2 * padding)
    const availableH = Math.max(1, viewportHeight - 2 * padding)

    const zoomRaw = Math.min(availableW / contentW, availableH / contentH)
    const zoom = clamp(zoomRaw, minZoom, maxZoom)

    const centerX = (bounds.minX + bounds.maxX) / 2
    const centerY = (bounds.minY + bounds.maxY) / 2

    const panX = centerX - viewportWidth / (2 * zoom)
    const panY = centerY - viewportHeight / (2 * zoom)

    return { zoom, panX, panY }
}

function clamp(v: number, lo: number, hi: number): number {
    if (v < lo) return lo
    if (v > hi) return hi
    return v
}
