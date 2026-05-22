/**
 * Original Fuxie code (no Mykonos lift). Carries no MIT/Mykonos header per
 * Requirement 6 (10+ contiguous adapted lines is the trigger; this file is
 * a Fuxie-original React shell over the typed Learning_World_Core).
 *
 * Thin React wrapper that mounts a `<canvas>`, adapts a real
 * `CanvasRenderingContext2D` to the structural `WorldCanvasContext` seam,
 * drives idle-cheap rendering, and renders the semantic `<HotspotList>`
 * fallback. The component is a Client Component for hydration purposes,
 * but its outer shell — the `<canvas>` element + the `<HotspotList>`
 * child — is server-renderable so screen readers and headless screenshot
 * tools see the destination links immediately, before hydration
 * (Requirements 4.1, 4.2, 4.7).
 *
 * Idle-frame discipline (Requirement 8): no `setInterval`, no
 * unconditional `requestAnimationFrame` loop, no `useSyncExternalStore`
 * subscription. All paints flow through `requestPaint()`, which coalesces
 * overlapping triggers within one frame using a single `rafIdRef`.
 *
 * Read-only learner-state (Requirements 7, 16): the component performs no
 * writes to `localStorage`, `sessionStorage`, cookies, or IndexedDB; no
 * mutating HTTP request originates from this file. A dev-only `fetch`
 * shim warns when `POST` / `PUT` / `PATCH` / `DELETE` is observed and is
 * uninstalled on unmount.
 */

'use client'

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import type { CSSProperties, ReactElement } from 'react'

import {
    IsoGrid,
    LearningWorldError,
    WorldCamera,
    WorldMap,
    combineRects,
    computeAutoFitCamera,
    paint,
} from '@/lib/learning-world'
import type {
    RenderInputs,
    Viewport,
    WorldCanvasContext,
    WorldImageSource,
    WorldScene,
} from '@/lib/learning-world'

import { HotspotList } from './HotspotList'
import {
    wrapContextWithTrace,
    type ContextCallTrace,
} from './canvas-render-tap'
import { useDevicePixelRatio } from './useDevicePixelRatio'
import { useReducedMotion } from './useReducedMotion'
import { useResizeObserver } from './useResizeObserver'

/**
 * Props for the `LearningWorldCanvas` component.
 *
 * The component is the sole owner of `<HotspotList>` for the scene; the
 * lab page MUST NOT render an additional `<HotspotList>` (Requirement 4.1).
 *
 * V0 image-loading strategy:
 *   - `images` (optional): a host-supplied map of `assetKey -> WorldImageSource`.
 *     When present, the component does not load images itself; it paints
 *     with this map directly. Useful for tests and for hosts that
 *     pre-resolve all image bytes (e.g. SSR pre-render with embedded data).
 *   - `imageLoader` (optional): a host-supplied resolver from `assetKey`
 *     to a URL string. When present (and `images` is absent), the
 *     component constructs `Image` instances per unique `assetKey`,
 *     listens for `load`/`error`, and re-paints as images arrive.
 *   - Neither prop: the component paints with an empty image map. The
 *     canvas is non-blank (the background `fillRect` runs) and the
 *     `<HotspotList>` provides the visible scene destinations.
 *
 * `onContextCall` is a test hook: when provided, the real 2D context is
 * wrapped via `wrapContextWithTrace` so every method invocation is
 * observable for idle / coalescing tests (Requirement 8.5).
 */
export interface LearningWorldCanvasProps {
    readonly scene: WorldScene
    readonly images?: ReadonlyMap<string, WorldImageSource>
    readonly imageLoader?: (assetKey: string) => string
    /**
     * Plain `assetKey -> public URL` map. Server-Component-friendly
     * alternative to `imageLoader` (functions cannot cross the Server →
     * Client boundary in Next.js App Router; plain objects can). When
     * present, the component uses this map to resolve every unique
     * `assetKey` referenced by the scene before invoking the internal
     * image loader. Takes priority only over `imageLoader` when both are
     * provided.
     */
    readonly imageSrcMap?: Readonly<Record<string, string>>
    readonly onContextCall?: (call: ContextCallTrace) => void
    readonly className?: string
}

/**
 * Discrete zoom step applied to wheel / button input (Requirement 16.4).
 * Multiplicative so that consecutive steps feel uniform across the
 * `[minZoom, maxZoom]` range.
 */
const ZOOM_STEP = 1.1

/**
 * Window during which a `<canvas>` `getContext('2d')` returning `null`
 * SHOULD flip the component into the `<HotspotList>` fallback path
 * (Requirement 9.6 documents 2 seconds; we set state immediately on the
 * first effect run when `null` is observed, which is well within the
 * 2000ms window).
 */

const HTTP_MUTATING_METHODS: ReadonlySet<string> = new Set([
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
])

/**
 * Pure helper: collect the set of unique `assetKey` strings referenced
 * by the scene's foreground objects. Terrain is not included because V0
 * ships zero terrain entries; future slices that add terrain MAY extend
 * this helper.
 */
function collectAssetKeys(scene: WorldScene): readonly string[] {
    const seen = new Set<string>()
    for (const o of scene.objects) {
        if (typeof o.assetKey === 'string' && o.assetKey.length > 0) {
            seen.add(o.assetKey)
        }
    }
    return Array.from(seen)
}

/**
 * Pure helper: returns `true` iff `process.env.NODE_ENV` is anything
 * other than `'production'`. Gated through `typeof process` so the
 * browser bundle stays defensive even when Next.js' build-time
 * substitution is bypassed.
 */
function isDevEnvironment(): boolean {
    return (
        typeof process !== 'undefined' &&
        process.env !== undefined &&
        process.env.NODE_ENV !== 'production'
    )
}

/**
 * Server-renderable shell: a wrapping `<div>`, an empty `<canvas>` element
 * carrying the scene's accessible name, an inline `role="status"` line for
 * failed-asset announcements, and a single `<HotspotList>` child. All
 * client-side behavior (context acquisition, paint, RAF, listeners) runs
 * inside `useEffect` so the SSR pass produces this exact DOM.
 */
export function LearningWorldCanvas(
    props: LearningWorldCanvasProps,
): ReactElement {
    const { scene, images, imageLoader, imageSrcMap, onContextCall, className } = props

    const containerRef = useRef<HTMLDivElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)

    // RAF coalescing handle; null means no frame is scheduled.
    const rafIdRef = useRef<number | null>(null)

    // Stable ref to the latest `requestPaint` so effects (e.g. auto-fit)
    // can trigger a repaint without participating in the dependency
    // array, which would re-bind every render.
    const requestPaintRef = useRef<(() => void) | null>(null)

    // Live-payload ref so `requestPaint` always reads the latest engine
    // objects without re-binding listeners on every render.
    const enginePayloadRef = useRef<EnginePayload | null>(null)

    // Pointer-drag state. Held in a ref because pointer move handlers run
    // outside React's render cycle and must not trigger re-renders.
    const dragStateRef = useRef<DragState | null>(null)

    // Track which asset keys have failed to load; surfaced in the
    // `role="status"` announcement (Requirement 1.5). Stored as
    // `readonly string[]` (sorted) so identity changes only when the set
    // actually changes.
    const [failedAssetKeys, setFailedAssetKeys] = useState<readonly string[]>(
        [],
    )

    // True once the canvas has rendered at least one successful paint.
    // Drives the `data-fuxie-lab-ready` attribute used by Codex polling.
    const [ready, setReady] = useState<boolean>(false)

    // True iff the component decided to fall back to the
    // `<HotspotList>`-only mode because `getContext('2d')` returned null
    // or because the canvas element was unavailable.
    const [canvasUnavailable, setCanvasUnavailable] = useState<boolean>(false)

    const reducedMotion = useReducedMotion()
    const dpr = useDevicePixelRatio()
    const observedSize = useResizeObserver(containerRef)

    // Internal image map populated by the on-demand loader. We keep it in
    // state so a `load` event triggers a re-render and a fresh paint.
    const [internalImages, setInternalImages] = useState<
        ReadonlyMap<string, WorldImageSource>
    >(() => new Map())

    // Resolve the image map paint will see this render. Host-supplied
    // `images` wins when present; otherwise we use whatever the internal
    // loader has accumulated.
    const effectiveImages: ReadonlyMap<string, WorldImageSource> =
        images ?? internalImages

    // ---------------------------------------------------------------
    // Internal image loader (only when `images` is not host-supplied).
    // Each unique assetKey loads independently; per-asset onerror adds
    // the key to `failedAssetKeys` (Requirement 1.5).
    //
    // Resolution priority for each assetKey:
    //   1. `imageLoader(key)` if provided (function form)
    //   2. `imageSrcMap[key]` if provided (plain-data form, Server-Component-safe)
    //   3. Otherwise the key is skipped (no internal load attempt).
    // ---------------------------------------------------------------
    useEffect(() => {
        if (images !== undefined) return
        if (typeof window === 'undefined') return
        const hasLoader = typeof imageLoader === 'function'
        const hasMap = imageSrcMap !== undefined && imageSrcMap !== null
        if (!hasLoader && !hasMap) return

        const keys = collectAssetKeys(scene)
        if (keys.length === 0) return

        let cancelled = false
        const inflight: Array<{
            img: HTMLImageElement
            onLoad: () => void
            onError: () => void
        }> = []

        for (const key of keys) {
            let url: string | undefined
            try {
                if (hasLoader) {
                    url = imageLoader!(key)
                } else if (hasMap) {
                    url = imageSrcMap![key]
                }
            } catch {
                if (!cancelled) {
                    setFailedAssetKeys((prev) =>
                        prev.includes(key) ? prev : [...prev, key].sort(),
                    )
                }
                continue
            }
            if (typeof url !== 'string' || url.length === 0) {
                if (!cancelled) {
                    setFailedAssetKeys((prev) =>
                        prev.includes(key) ? prev : [...prev, key].sort(),
                    )
                }
                continue
            }

            const img = new window.Image()
            const onLoad = (): void => {
                if (cancelled) return
                setInternalImages((prev) => {
                    if (prev.has(key)) return prev
                    const next = new Map(prev)
                    next.set(key, img as unknown as WorldImageSource)
                    return next
                })
            }
            const onError = (): void => {
                if (cancelled) return
                setFailedAssetKeys((prev) =>
                    prev.includes(key) ? prev : [...prev, key].sort(),
                )
            }
            img.addEventListener('load', onLoad)
            img.addEventListener('error', onError)
            img.src = url
            inflight.push({ img, onLoad, onError })
        }

        return () => {
            cancelled = true
            for (const { img, onLoad, onError } of inflight) {
                img.removeEventListener('load', onLoad)
                img.removeEventListener('error', onError)
            }
        }
    }, [images, imageLoader, imageSrcMap, scene])

    // ---------------------------------------------------------------
    // Build the engine payload (IsoGrid / WorldCamera / WorldMap +
    // wrapped 2D context) once per scene. Recreated when the scene
    // identity, the host-supplied `onContextCall`, or the canvas
    // element changes (the canvas element changing is a remount, which
    // also re-runs this effect).
    // ---------------------------------------------------------------
    useEffect(() => {
        if (typeof window === 'undefined') return
        const canvasEl = canvasRef.current
        if (canvasEl === null) {
            setCanvasUnavailable(true)
            return
        }

        let raw2d: CanvasRenderingContext2D | null = null
        try {
            raw2d = canvasEl.getContext('2d')
        } catch {
            raw2d = null
        }
        if (raw2d === null) {
            // Per Requirement 9.6 / 4.7: surface the `<HotspotList>`
            // fallback within 2 seconds. Setting state immediately is
            // well within the window and keeps tests deterministic.
            setCanvasUnavailable(true)
            return
        }

        // Real `CanvasRenderingContext2D` is structurally compatible with
        // `WorldCanvasContext` (eight required methods all present).
        const baseCtx: WorldCanvasContext =
            raw2d as unknown as WorldCanvasContext
        const ctx: WorldCanvasContext =
            typeof onContextCall === 'function'
                ? wrapContextWithTrace(baseCtx, onContextCall)
                : baseCtx

        // Build engine objects. `IsoGrid` and `WorldCamera` constructors
        // throw `LearningWorldError` on bad config; if the scene is
        // invalid, fall back to the Hotspot_List path rather than
        // crashing the whole tree.
        let grid: IsoGrid
        let camera: WorldCamera
        let map: WorldMap
        try {
            grid = new IsoGrid(scene.grid)
            camera = new WorldCamera(
                scene.camera ?? { minZoom: 0.5, maxZoom: 2.0, initialZoom: 1.0 },
            )
            map = new WorldMap({ grid })
            // `scene.objects` is already validated by `createWorldObject`
            // at scene-build time. Re-add them via `WorldMap.add` to
            // populate the occupancy index for paint.
            for (const o of scene.objects) {
                map.add(o)
            }
        } catch (e) {
            if (e instanceof LearningWorldError) {
                console.error('LearningWorldCanvas: engine init failed', e)
            } else {
                console.error('LearningWorldCanvas: engine init failed', e)
            }
            setCanvasUnavailable(true)
            return
        }

        const payload: EnginePayload = { canvasEl, ctx, grid, camera, map }
        enginePayloadRef.current = payload

        return () => {
            enginePayloadRef.current = null
        }
    }, [scene, onContextCall])

    // ---------------------------------------------------------------
    // requestPaint(): coalesce overlapping triggers within one frame.
    // Returns early when a frame is already pending.
    // ---------------------------------------------------------------
    const requestPaint = useCallback((): void => {
        if (typeof window === 'undefined') return
        if (rafIdRef.current !== null) return
        const payload = enginePayloadRef.current
        if (payload === null) return

        rafIdRef.current = window.requestAnimationFrame(() => {
            rafIdRef.current = null
            const live = enginePayloadRef.current
            if (live === null) return

            // Read CSS size from the WRAPPER (containerRef), not from the
            // canvas itself. Reading clientWidth/clientHeight from the
            // canvas creates a feedback loop: writing `canvas.width` /
            // `canvas.height` (backing-store attributes) when the canvas
            // has no fixed CSS size makes the layout engine treat those
            // pixel counts as the new CSS size, which we then read back
            // on the next frame and double again. Codex QA observed this
            // bug as a 22M×22M canvas at viewport 1280×800. The wrapper
            // has a deterministic CSS size (set via inline style below
            // and clamped by `useResizeObserver`), so reading from it is
            // stable across frames.
            const containerEl = containerRef.current
            const cssWidth =
                containerEl !== null && containerEl.clientWidth > 0
                    ? containerEl.clientWidth
                    : observedSize?.width ?? 0
            const cssHeight =
                containerEl !== null && containerEl.clientHeight > 0
                    ? containerEl.clientHeight
                    : observedSize?.height ?? 0

            // Defensive: if the wrapper has not been laid out yet (e.g.
            // first paint before the resize observer fires), skip this
            // frame entirely. The next requestPaint triggered by
            // `useResizeObserver` will land once the wrapper has a real
            // size. Never paint into an uninitialised viewport.
            if (cssWidth <= 0 || cssHeight <= 0) return

            const safeDpr = Math.max(1, Math.min(dpr, 3))

            // Backing-store dimensions in device pixels. Pin the canvas's
            // own CSS size to the wrapper's CSS size via the `style`
            // attribute so the layout engine never grows the canvas to
            // match the backing-store attribute.
            const targetW = Math.max(1, Math.floor(cssWidth * safeDpr))
            const targetH = Math.max(1, Math.floor(cssHeight * safeDpr))
            if (live.canvasEl.width !== targetW) live.canvasEl.width = targetW
            if (live.canvasEl.height !== targetH) {
                live.canvasEl.height = targetH
            }
            // Pin CSS size in inline style. Always writes the latest
            // wrapper size so the canvas tracks responsive resizes.
            live.canvasEl.style.width = `${cssWidth}px`
            live.canvasEl.style.height = `${cssHeight}px`

            const viewport: Viewport = {
                cssWidth,
                cssHeight,
                devicePixelRatio: safeDpr,
            }

            const inputs: RenderInputs = {
                scene,
                grid: live.grid,
                camera: live.camera,
                map: live.map,
                images: effectiveImages,
                viewport,
            }

            try {
                paint(live.ctx, inputs)
                if (!ready) setReady(true)
            } catch (e) {
                // Keep the last successful frame; surface the error for
                // developers but never throw from a RAF callback.
                console.error('LearningWorldCanvas: paint threw', e)
            }
        })
    }, [dpr, scene, effectiveImages, ready])

    // ---------------------------------------------------------------
    // Sync `requestPaintRef` so non-callback effects (auto-fit, etc.)
    // can trigger a paint without taking `requestPaint` as a dep.
    // ---------------------------------------------------------------
    useEffect(() => {
        requestPaintRef.current = requestPaint
    }, [requestPaint])

    // ---------------------------------------------------------------
    // First-paint trigger: kicks once the engine payload is ready, the
    // canvas is mounted, and at least one of (DPR, observed size,
    // reduced motion) has been observed by the hooks.
    // ---------------------------------------------------------------
    useEffect(() => {
        requestPaint()
    }, [requestPaint, observedSize, dpr, reducedMotion, effectiveImages])

    // ---------------------------------------------------------------
    // Auto-fit camera. Re-runs whenever the engine payload, viewport,
    // or loaded images change — the bounds depend on per-asset
    // `width`/`height`, so we cannot fit until at least one image has
    // resolved. Until then the camera stays at its default; the
    // background gradient + iso-tile field still renders so the canvas
    // is non-blank.
    //
    // Re-fitting on every loaded image is intentional: as more sprites
    // arrive, the bounds may grow, and we want the visible composition
    // to settle into a frame that contains every required object.
    // ---------------------------------------------------------------
    useEffect(() => {
        if (typeof window === 'undefined') return
        const payload = enginePayloadRef.current
        if (payload === null) return
        const containerEl = containerRef.current
        if (containerEl === null) return

        const cssWidth = containerEl.clientWidth
        const cssHeight = containerEl.clientHeight
        if (cssWidth <= 0 || cssHeight <= 0) return

        // Build per-object world-space rects from the images we have.
        // An object whose image is still loading contributes nothing
        // to the bounds; that is fine because every required object's
        // gx/gy is fixed at scene-build time, so once any image lands
        // the camera is already centered on the scene's grid extent
        // (we synthesize a fallback bound from grid cell positions
        // below).
        const rects: Array<{ x: number; y: number; w: number; h: number }> = []
        for (const o of scene.objects) {
            const img = effectiveImages.get(o.assetKey)
            if (img === undefined) continue
            const screen = payload.grid.cellToScreen(o.gx, o.gy)
            rects.push({
                x: screen.x,
                y: screen.y,
                w: img.width,
                h: img.height,
            })
        }

        // Fallback bounds: even with zero loaded images, fit the camera
        // to the grid's full cell extent so the iso-tile field appears
        // reasonably framed during the load. This stops the
        // "blank black canvas with stage edges" fallback Codex flagged.
        if (rects.length === 0) {
            const corners = [
                payload.grid.cellToScreen(0, 0),
                payload.grid.cellToScreen(payload.grid.cols - 1, 0),
                payload.grid.cellToScreen(0, payload.grid.rows - 1),
                payload.grid.cellToScreen(
                    payload.grid.cols - 1,
                    payload.grid.rows - 1,
                ),
            ]
            const minX = Math.min(...corners.map((c) => c.x))
            const maxX = Math.max(...corners.map((c) => c.x))
            const minY = Math.min(...corners.map((c) => c.y))
            const maxY = Math.max(...corners.map((c) => c.y))
            // Add half-tile padding so the diamond corners aren't clipped.
            const padX = payload.grid.tileWidth / 2
            const padY = payload.grid.tileHeight
            rects.push({
                x: minX - padX,
                y: minY,
                w: maxX - minX + 2 * padX,
                h: maxY - minY + padY,
            })
        }

        const bounds = combineRects(rects)
        if (bounds === null) return

        try {
            const fit = computeAutoFitCamera(bounds, {
                viewportWidth: cssWidth,
                viewportHeight: cssHeight,
                minZoom: payload.camera.minZoom,
                maxZoom: payload.camera.maxZoom,
                padding: 24,
            })
            if (fit === null) return
            payload.camera.setZoom(fit.zoom)
            payload.camera.setPan(fit.panX, fit.panY)
            // Trigger a repaint with the new camera state.
            // requestPaint is stable per-render via useCallback, so we
            // can safely call it from here.
            requestPaintRef.current?.()
        } catch (e) {
            console.warn('LearningWorldCanvas: auto-fit failed', e)
        }
    }, [scene, effectiveImages, observedSize])

    // ---------------------------------------------------------------
    // Pointer / wheel / keyboard input handlers. Single-pointer pan
    // only (Requirement 16.4); discrete zoom step only.
    // ---------------------------------------------------------------
    useEffect(() => {
        if (typeof window === 'undefined') return
        const canvasEl = canvasRef.current
        if (canvasEl === null) return

        const onPointerDown = (e: PointerEvent): void => {
            // Single-pointer pan only — ignore additional pointers in a
            // multi-touch gesture.
            if (dragStateRef.current !== null) return
            const payload = enginePayloadRef.current
            if (payload === null) return
            try {
                canvasEl.setPointerCapture(e.pointerId)
            } catch {
                // setPointerCapture can throw if the pointer is already
                // released; ignore.
            }
            const pan = payload.camera.getPan()
            dragStateRef.current = {
                pointerId: e.pointerId,
                startClientX: e.clientX,
                startClientY: e.clientY,
                startPanX: pan.x,
                startPanY: pan.y,
            }
        }

        const onPointerMove = (e: PointerEvent): void => {
            const drag = dragStateRef.current
            if (drag === null) return
            if (e.pointerId !== drag.pointerId) return
            const payload = enginePayloadRef.current
            if (payload === null) return
            const zoom = payload.camera.getZoom() || 1
            const dxScreen = e.clientX - drag.startClientX
            const dyScreen = e.clientY - drag.startClientY
            // Pan is in world units; convert from screen delta by
            // dividing by zoom.
            payload.camera.setPan(
                drag.startPanX - dxScreen / zoom,
                drag.startPanY - dyScreen / zoom,
            )
            requestPaint()
        }

        const onPointerUp = (e: PointerEvent): void => {
            const drag = dragStateRef.current
            if (drag === null) return
            if (e.pointerId !== drag.pointerId) return
            try {
                canvasEl.releasePointerCapture(e.pointerId)
            } catch {
                // Already released; ignore.
            }
            dragStateRef.current = null
            requestPaint()
        }

        const onWheel = (e: WheelEvent): void => {
            const payload = enginePayloadRef.current
            if (payload === null) return
            // Discrete step only — no momentum (Requirement 16.4).
            const direction = e.deltaY > 0 ? 1 / ZOOM_STEP : ZOOM_STEP
            const next = payload.camera.getZoom() * direction
            payload.camera.setZoom(next)
            requestPaint()
            // Prevent the page from scrolling while zooming the canvas.
            if (e.cancelable) e.preventDefault()
        }

        canvasEl.addEventListener('pointerdown', onPointerDown)
        canvasEl.addEventListener('pointermove', onPointerMove)
        canvasEl.addEventListener('pointerup', onPointerUp)
        canvasEl.addEventListener('pointercancel', onPointerUp)
        canvasEl.addEventListener('wheel', onWheel, { passive: false })

        return () => {
            canvasEl.removeEventListener('pointerdown', onPointerDown)
            canvasEl.removeEventListener('pointermove', onPointerMove)
            canvasEl.removeEventListener('pointerup', onPointerUp)
            canvasEl.removeEventListener('pointercancel', onPointerUp)
            canvasEl.removeEventListener('wheel', onWheel)
        }
    }, [requestPaint])

    // ---------------------------------------------------------------
    // Dev-only fetch shim. Captures `originalFetch`, replaces it with a
    // wrapper that warns on mutating methods, restores on cleanup.
    // Only mounts when `process.env.NODE_ENV !== 'production'`.
    // ---------------------------------------------------------------
    useEffect(() => {
        if (typeof window === 'undefined') return
        if (!isDevEnvironment()) return
        if (typeof window.fetch !== 'function') return

        const originalFetch: typeof window.fetch = window.fetch.bind(window)
        const wrappedFetch: typeof window.fetch = (
            input: RequestInfo | URL,
            init?: RequestInit,
        ): Promise<Response> => {
            const method = init?.method?.toUpperCase()
            if (method !== undefined && HTTP_MUTATING_METHODS.has(method)) {
                console.warn(
                    `LearningWorldCanvas: dev-only fetch shim observed mutating ${method} request`,
                    input,
                )
            }
            return originalFetch(input, init)
        }
        window.fetch = wrappedFetch

        return () => {
            // Only restore if no later effect wrapped the fetch on top
            // of ours; idempotent restoration is safer than a blind
            // overwrite.
            if (window.fetch === wrappedFetch) {
                window.fetch = originalFetch
            }
        }
    }, [])

    // ---------------------------------------------------------------
    // Cleanup: cancel any pending RAF on unmount.
    // ---------------------------------------------------------------
    useEffect(() => {
        return () => {
            if (typeof window === 'undefined') return
            if (rafIdRef.current !== null) {
                window.cancelAnimationFrame(rafIdRef.current)
                rafIdRef.current = null
            }
        }
    }, [])

    // ---------------------------------------------------------------
    // Render the server-renderable shell. The `<canvas>` itself stays
    // empty in SSR; hydration kicks in the effects above.
    // ---------------------------------------------------------------
    const failedListId = useMemo(
        () =>
            failedAssetKeys.length > 0
                ? failedAssetKeys.join(',')
                : '',
        [failedAssetKeys],
    )

    const wrapperClassName =
        typeof className === 'string' && className.length > 0
            ? `learning-world-canvas ${className}`
            : 'learning-world-canvas'

    // Inline styles ensure deterministic CSS sizing without depending on
    // global stylesheets or Tailwind classes that may not be wired into
    // the lab route. The OUTER frame holds the canvas (clipped) and a
    // visible Hotspot_List companion panel side by side at desktop, or
    // stacked at mobile, so the destinations panel is never clipped by
    // the canvas's overflow:hidden (Codex visual-pass-2 finding 4).
    // V1 polish-1: tightened proportions so desktop 1280×800 shows the
    // full canvas, the panel heading, AND the first row of destinations
    // above the fold (Codex finding #3). Outer max width capped at 1080
    // so the canvas does not crowd the viewport. Stage uses 16:9 instead
    // of 16:10 to win back ~60 vertical px on desktop while keeping
    // mobile portrait fit (358×201 cf. Pythagorean math in the smoke
    // results).
    const outerStyle: CSSProperties = {
        width: '100%',
        maxWidth: 1080,
        margin: '0 auto',
        padding: 12,
        background:
            'radial-gradient(ellipse at top, #2a3a55 0%, #16202f 70%, #0c1320 100%)',
        borderRadius: 12,
        boxShadow:
            'inset 0 0 0 1px rgba(255, 255, 255, 0.06), 0 8px 32px rgba(0, 0, 0, 0.3)',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr)',
        gridTemplateRows: 'auto auto',
        gap: 10,
        position: 'relative',
    }

    // Wrapper holds the canvas only. `overflow: hidden` keeps painted
    // content inside the lab frame; the hotspot panel lives outside this
    // wrapper to stay visible.
    const wrapperStyle: CSSProperties = {
        width: '100%',
        aspectRatio: '16 / 9',
        position: 'relative',
        background: '#1a1f2e',
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow:
            'inset 0 0 0 1px rgba(255, 255, 255, 0.05), 0 2px 12px rgba(0, 0, 0, 0.4)',
    }

    const canvasStyle: CSSProperties = {
        display: 'block',
        width: '100%',
        height: '100%',
        maxWidth: '100%',
        maxHeight: '100%',
    }

    // Visible hotspot panel (companion to the semantic <HotspotList>).
    // Internal-lab styling: compact strip below the canvas at desktop,
    // wraps to multi-row at narrow widths. Cards <= 8px radius per the
    // task spec.
    const panelStyle: CSSProperties = {
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 8,
        padding: 12,
    }

    const panelHeadingStyle: CSSProperties = {
        margin: 0,
        marginBottom: 8,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color: 'rgba(255, 255, 255, 0.7)',
    }

    return (
        <div
            className={wrapperClassName}
            data-fuxie-lab-ready={ready ? 'true' : undefined}
            style={outerStyle}
        >
            <div
                ref={containerRef}
                className="learning-world-canvas__stage"
                style={wrapperStyle}
            >
                <canvas
                    ref={canvasRef}
                    aria-label={scene.canvasAriaLabel}
                    aria-labelledby={scene.canvasAriaLabelledBy}
                    className="learning-world-canvas__surface"
                    data-fuxie-lab-ready={ready ? 'true' : undefined}
                    style={canvasStyle}
                />
                {failedAssetKeys.length > 0 ? (
                    <div
                        role="status"
                        className="learning-world-canvas__failed-assets"
                        data-failed-asset-keys={failedListId}
                        style={{
                            position: 'absolute',
                            bottom: 8,
                            left: 8,
                            right: 8,
                            background: 'rgba(0, 0, 0, 0.6)',
                            color: '#ffd2d2',
                            fontSize: 12,
                            padding: '6px 10px',
                            borderRadius: 6,
                        }}
                    >
                        {`Some assets failed to load: ${failedAssetKeys.join(
                            ', ',
                        )}`}
                    </div>
                ) : null}
            </div>

            {/*
              Hotspot panel rendered OUTSIDE the overflow-hidden canvas
              wrapper so it is always visually present (Codex
              visual-pass-2 finding 4). The semantic `<HotspotList>` is
              the same component the V0 design specified — every
              interactive WorldObject still produces exactly one
              focusable, keyboard-activatable item (Requirement 4.1).
            */}
            <div
                className="learning-world-canvas__panel"
                style={panelStyle}
            >
                <h2 style={panelHeadingStyle}>Scene destinations</h2>
                <HotspotList
                    scene={scene}
                    canvasUnavailable={canvasUnavailable}
                />
            </div>
        </div>
    )
}

/**
 * Engine objects assembled on hydration. Stored together so the live RAF
 * callback can read them via a single ref.
 */
interface EnginePayload {
    readonly canvasEl: HTMLCanvasElement
    readonly ctx: WorldCanvasContext
    readonly grid: IsoGrid
    readonly camera: WorldCamera
    readonly map: WorldMap
}

/**
 * Single-pointer drag state. Captured at `pointerdown` and consumed by
 * `pointermove` / `pointerup`. Stored in a ref to avoid triggering React
 * re-renders on every move event.
 */
interface DragState {
    readonly pointerId: number
    readonly startClientX: number
    readonly startClientY: number
    readonly startPanX: number
    readonly startPanY: number
}


