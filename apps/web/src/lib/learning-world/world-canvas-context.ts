/**
 * Adapted in spirit from Mykonos `Camera` / canvas usage.
 * MIT License, see THIRD_PARTY_NOTICES.
 *
 * Structural seam between the framework-agnostic core and any DOM host.
 * Method set is EXACTLY the eight methods listed below. Adding a method here
 * is a public-API change and must be intentional.
 */
export interface WorldCanvasContext {
    clearRect(x: number, y: number, w: number, h: number): void
    fillRect(x: number, y: number, w: number, h: number): void
    drawImage(
        image: WorldImageSource,
        dx: number,
        dy: number,
        dw?: number,
        dh?: number,
    ): void
    save(): void
    restore(): void
    translate(x: number, y: number): void
    scale(sx: number, sy: number): void
    setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void
}

/**
 * Bag of pixels the core can paint. The host (React layer) loads images and
 * passes them in. The core never imports HTMLImageElement / ImageBitmap.
 */
export interface WorldImageSource {
    readonly width: number
    readonly height: number
    /** Implementation detail; opaque to the core. */
    readonly __brand?: never
}

export function isWorldCanvasContext(value: unknown): value is WorldCanvasContext {
    if (value === null || typeof value !== 'object') return false
    const c = value as Record<string, unknown>
    return [
        'clearRect',
        'fillRect',
        'drawImage',
        'save',
        'restore',
        'translate',
        'scale',
        'setTransform',
    ].every((m) => typeof c[m] === 'function')
}
