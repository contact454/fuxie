// Feature: fuxie-learning-world-lab-v0 visual-pass-2, paint() drawImage count
//
// Vai chinh: QA Automation Engineer
// Vai phoi hop: Frontend Engineer
//
// Spec ref: visual-pass-2 task 5 — assert that for the V0 lab scene,
// `paint()` issues at least one `drawImage` call per registered
// foreground object once images are present in the resolver map.
//
// This is a focused integration test against the framework-agnostic
// renderer: we build the lab scene, hydrate a `WorldMap`, give `paint()`
// an `images` map containing a stub `WorldImageSource` for every
// referenced `assetKey`, and count the `drawImage` invocations on a
// recording context. The acceptance criterion (>= 6) reflects the V0
// requirement that all 6 required World_Object slots are rendered.

import { describe, expect, it } from 'vitest'

import {
    IsoGrid,
    WorldCamera,
    WorldMap,
    paint,
    type RenderInputs,
    type Viewport,
    type WorldCanvasContext,
    type WorldImageSource,
} from '@/lib/learning-world'
import { buildLabScene } from '@/app/fuxie-world-lab/lab-scene'

interface DrawCallTrace {
    readonly method: string
    readonly args: readonly unknown[]
}

function buildRecordingCtx(): {
    ctx: WorldCanvasContext
    calls: DrawCallTrace[]
} {
    const calls: DrawCallTrace[] = []
    const record = (method: string) =>
        ((...args: unknown[]) => {
            calls.push({ method, args })
        }) as never

    const ctx: WorldCanvasContext & { fillStyle?: string } = {
        clearRect: record('clearRect'),
        fillRect: record('fillRect'),
        drawImage: record('drawImage'),
        save: record('save'),
        restore: record('restore'),
        translate: record('translate'),
        scale: record('scale'),
        setTransform: record('setTransform'),
        // Real browser 2D contexts expose fillStyle; stub it so the
        // duck-typed setter in render.ts engages and we exercise the
        // gradient/tile-fill code paths exactly as the production host
        // would.
        fillStyle: '#000000',
    }

    return { ctx, calls }
}

function buildStubImage(width = 256, height = 256): WorldImageSource {
    return { width, height } as unknown as WorldImageSource
}

describe('paint() drawImage count for the V0 lab scene', () => {
    it('issues at least one drawImage per registered foreground object', () => {
        const scene = buildLabScene()
        const grid = new IsoGrid(scene.grid)
        const camera = new WorldCamera(scene.camera ?? {
            minZoom: 0.5,
            maxZoom: 2.0,
            initialZoom: 1.0,
        })
        const map = new WorldMap({ grid })
        for (const o of scene.objects) {
            map.add(o)
        }

        // Build an `images` map that contains a stub for every unique
        // `assetKey` referenced by the scene. Real images are not
        // available in the node test environment; stubs are
        // structurally compatible (`width`, `height` numerics).
        const images = new Map<string, WorldImageSource>()
        for (const o of scene.objects) {
            if (!images.has(o.assetKey)) {
                images.set(o.assetKey, buildStubImage())
            }
        }

        const { ctx, calls } = buildRecordingCtx()
        const viewport: Viewport = {
            cssWidth: 1280,
            cssHeight: 800,
            devicePixelRatio: 2,
        }

        const inputs: RenderInputs = { scene, grid, camera, map, images, viewport }
        paint(ctx, inputs)

        const drawImageCalls = calls.filter((c) => c.method === 'drawImage')
        // V0 ships 6 required slots + optional review garden. We assert
        // >= 6 to remain robust if a future asset-registry rename causes
        // the optional garden to fall through to the placeholder.
        expect(drawImageCalls.length).toBeGreaterThanOrEqual(6)
        // Object count consistency: every foreground object with a
        // resolved image must produce exactly one drawImage call.
        const objectsWithImage = scene.objects.filter((o) =>
            images.has(o.assetKey),
        )
        expect(drawImageCalls.length).toBe(objectsWithImage.length)
    })

    it('produces multiple fillRect calls (background + tile field) so canvas is non-blank', () => {
        // Sanity check that the visual-pass-2 stage rendering actually
        // happens. Without `fillStyle` on the host context paint would
        // still run, but here we provide it so the gradient + tile-fill
        // code paths execute fully.
        const scene = buildLabScene()
        const grid = new IsoGrid(scene.grid)
        const camera = new WorldCamera(scene.camera ?? {
            minZoom: 0.5,
            maxZoom: 2.0,
            initialZoom: 1.0,
        })
        const map = new WorldMap({ grid })
        for (const o of scene.objects) {
            map.add(o)
        }
        const images = new Map<string, WorldImageSource>()
        for (const o of scene.objects) {
            images.set(o.assetKey, buildStubImage())
        }

        const { ctx, calls } = buildRecordingCtx()
        paint(ctx, {
            scene,
            grid,
            camera,
            map,
            images,
            viewport: { cssWidth: 1280, cssHeight: 800, devicePixelRatio: 2 },
        })

        const fillRectCalls = calls.filter((c) => c.method === 'fillRect')
        // Gradient: 32 strips. Tile field: 10×10 grid × 4 strips/cell =
        // 400. Grid intersections: 11×11 = 121. Drop shadow: 2 per
        // sprite × 7 = 14. Lower bound: at least the 32 sky strips
        // alone, but in practice this will be in the high hundreds.
        expect(fillRectCalls.length).toBeGreaterThanOrEqual(32)
    })
})
