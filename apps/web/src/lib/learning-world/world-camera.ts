/**
 * Adapted from Mykonos `Camera` (lib/camera/camera.js).
 * MIT License, see THIRD_PARTY_NOTICES.
 *
 * Pure pan/zoom camera with invertible screen <-> world transforms.
 * No DOM access. No React. No top-level browser globals.
 */

import { LearningWorldError } from './errors'

/**
 * Configuration for `WorldCamera`. `minZoom` and `maxZoom` define the
 * inclusive zoom interval. The optional `onError` callback receives
 * `LearningWorldError('INVALID_CAMERA_INPUT', ...)` when `setZoom` (or
 * `setPan`) is fed an invalid value; it lets hosts surface a typed error
 * signal without forcing the camera to throw on every mistyped input.
 */
export interface CameraConfig {
    readonly minZoom: number
    readonly maxZoom: number
    readonly initialZoom?: number
    readonly initialPanX?: number
    readonly initialPanY?: number
    readonly onError?: (e: LearningWorldError) => void
}

export interface WorldPoint {
    readonly wx: number
    readonly wy: number
}

export interface ScreenPoint {
    readonly x: number
    readonly y: number
}

const COORD_LIMIT = 1e6

function isFiniteNumber(v: unknown): v is number {
    return typeof v === 'number' && Number.isFinite(v)
}

function isInRange(v: number, limit: number): boolean {
    return v >= -limit && v <= limit
}

export class WorldCamera {
    public readonly minZoom: number
    public readonly maxZoom: number

    private zoom: number
    private panX: number
    private panY: number
    private readonly onError: ((e: LearningWorldError) => void) | undefined

    constructor(config: CameraConfig) {
        if (config === null || typeof config !== 'object') {
            throw new LearningWorldError(
                'INVALID_CAMERA_CONFIG',
                'CameraConfig must be an object',
            )
        }

        const { minZoom, maxZoom } = config

        if (!isFiniteNumber(minZoom) || !isFiniteNumber(maxZoom)) {
            throw new LearningWorldError(
                'INVALID_CAMERA_CONFIG',
                `minZoom and maxZoom must be finite numbers (got minZoom=${String(minZoom)}, maxZoom=${String(maxZoom)})`,
            )
        }

        if (minZoom <= 0) {
            throw new LearningWorldError(
                'INVALID_CAMERA_CONFIG',
                `minZoom must be > 0 (got ${minZoom})`,
            )
        }

        if (maxZoom < minZoom) {
            throw new LearningWorldError(
                'INVALID_CAMERA_CONFIG',
                `maxZoom must be >= minZoom (got minZoom=${minZoom}, maxZoom=${maxZoom})`,
            )
        }

        this.minZoom = minZoom
        this.maxZoom = maxZoom
        this.onError = config.onError

        // Initial zoom: clamp finite numeric input into bounds; otherwise default to minZoom.
        const initialZoom = isFiniteNumber(config.initialZoom)
            ? config.initialZoom
            : minZoom
        this.zoom = clampToRange(initialZoom, minZoom, maxZoom)

        // Initial pan: accept finite numerics, otherwise default to 0.
        this.panX = isFiniteNumber(config.initialPanX) ? config.initialPanX : 0
        this.panY = isFiniteNumber(config.initialPanY) ? config.initialPanY : 0
    }

    getZoom(): number {
        return this.zoom
    }

    getPan(): { readonly x: number; readonly y: number } {
        return { x: this.panX, y: this.panY }
    }

    /**
     * Set zoom. Numeric finite input is clamped into `[minZoom, maxZoom]`.
     * `NaN`, `±Infinity`, `null`, `undefined`, or non-numeric values leave
     * state unchanged and invoke `onError` (when provided) with a
     * `LearningWorldError('INVALID_CAMERA_INPUT', ...)`.
     */
    setZoom(z: unknown): void {
        if (!isFiniteNumber(z)) {
            this.signalInvalidInput(`setZoom received non-finite value: ${String(z)}`)
            return
        }
        this.zoom = clampToRange(z, this.minZoom, this.maxZoom)
    }

    /**
     * Set pan. Both coordinates must be finite numbers. Invalid input leaves
     * pan unchanged and signals `INVALID_CAMERA_INPUT` via `onError` when
     * provided. (Mirrors `setZoom`'s tolerant philosophy so the camera never
     * throws from input handlers.)
     */
    setPan(x: unknown, y: unknown): void {
        if (!isFiniteNumber(x) || !isFiniteNumber(y)) {
            this.signalInvalidInput(
                `setPan received non-finite values: x=${String(x)}, y=${String(y)}`,
            )
            return
        }
        this.panX = x
        this.panY = y
    }

    /**
     * Pure: screen-space point -> world-space point.
     * Accepts finite numerics in `[-1e6, 1e6]`. Never mutates camera state.
     * Throws `INVALID_CAMERA_INPUT` for out-of-range or non-finite input.
     */
    screenToWorld(sx: number, sy: number): WorldPoint {
        assertFiniteCoord(sx, 'sx')
        assertFiniteCoord(sy, 'sy')
        const wx = sx / this.zoom + this.panX
        const wy = sy / this.zoom + this.panY
        return { wx, wy }
    }

    /**
     * Pure: world-space point -> screen-space point.
     * Accepts finite numerics in `[-1e6, 1e6]`. Never mutates camera state.
     * Throws `INVALID_CAMERA_INPUT` for out-of-range or non-finite input.
     */
    worldToScreen(wx: number, wy: number): ScreenPoint {
        assertFiniteCoord(wx, 'wx')
        assertFiniteCoord(wy, 'wy')
        const x = (wx - this.panX) * this.zoom
        const y = (wy - this.panY) * this.zoom
        return { x, y }
    }

    private signalInvalidInput(message: string): void {
        if (this.onError) {
            this.onError(new LearningWorldError('INVALID_CAMERA_INPUT', message))
        }
    }
}

function clampToRange(value: number, min: number, max: number): number {
    if (value < min) return min
    if (value > max) return max
    return value
}

function assertFiniteCoord(value: number, name: string): void {
    if (!isFiniteNumber(value)) {
        throw new LearningWorldError(
            'INVALID_CAMERA_INPUT',
            `${name} must be a finite number (got ${String(value)})`,
        )
    }
    if (!isInRange(value, COORD_LIMIT)) {
        throw new LearningWorldError(
            'INVALID_CAMERA_INPUT',
            `${name} must be within [-1e6, 1e6] (got ${value})`,
        )
    }
}
