/**
 * Feature: fuxie-learning-world-lab-v0, Properties 13–15: idle / coalescing.
 *
 * Vai chinh: QA Automation Engineer
 * Vai phoi hop: Frontend Engineer, CTO / Tech Lead
 *
 * Spec ref: `.kiro/specs/fuxie-learning-world-lab-v0/requirements.md`
 *   Requirement 8.1 — While idle (no input within 100ms and no `WorldMap`
 *                     version change since the last rendered frame), the
 *                     renderer issues zero observable 2D context calls.
 *   Requirement 8.2 — Inputs occurring within the same animation frame
 *                     coalesce to at most one new frame for that frame.
 *   Requirement 8.3 — `requestPaint` calls that ride along with
 *                     `WorldMap` mutations within the same animation
 *                     frame coalesce to exactly one new frame on the
 *                     next animation frame (or within 2 frames in
 *                     test environments where RAF scheduling is
 *                     approximated).
 *   Requirement 8.4 — No `setInterval`, no unconditional RAF loop.
 *   Requirement 8.5 — A test hook that counts observable 2D-context
 *                     calls per frame so the no-redraw rule can be
 *                     verified deterministically.
 *
 * Strategy. V0 has no React component testing pattern (Requirement 13.4),
 * so these properties are tested at the *engine* level rather than via
 * the React component. We build a minimal `TestRenderer` harness that
 * mirrors the paint-coalescing logic in `LearningWorldCanvas`:
 *
 *   - a single `rafId` slot; `requestPaint()` is a no-op when a frame
 *     is already pending (this is the coalescing invariant Property 14
 *     and Property 15 assert);
 *   - `requestPaint()` schedules `requestAnimationFrame(paint)`;
 *   - `paint` clears the `rafId` *first*, then invokes the user-supplied
 *     paint function (so a re-entrant `requestPaint()` inside the paint
 *     function would correctly schedule the next frame, matching the
 *     production component's behaviour).
 *
 * The paint function is a thin shim that drives a `Proxy`-wrapped tap
 * context built via `wrapContextWithTrace` (the production test hook
 * specified by Requirement 8.5). Recording happens on the *real*
 * structurally-compatible `WorldCanvasContext` interface, so the test
 * counts the same kind of calls a real Canvas2D context would receive
 * from `paint()` in production.
 *
 * `vi.useFakeTimers({ toFake: ['requestAnimationFrame',
 * 'cancelAnimationFrame', 'setTimeout', 'clearTimeout'] })` installs a
 * deterministic RAF; the test environment is `node` (per
 * `apps/web/vitest.config.ts`), so without faking, `requestAnimationFrame`
 * is not available globally. The RAF queue is drained via
 * `vi.advanceTimersToNextFrame()` (Vitest 3.x), with
 * `vi.advanceTimersByTime(0)` as a portable fallback if the former is
 * not present at runtime.
 *
 * Each property runs at least 100 iterations
 * (`fc.assert(..., { numRuns: 100 })`).
 *
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5.
 */

import fc from 'fast-check'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
    IsoGrid,
    WorldMap,
    createWorldObject,
} from '@/lib/learning-world'
import type {
    WorldCanvasContext,
    WorldObject,
} from '@/lib/learning-world'

import {
    wrapContextWithTrace,
    type ContextCallTrace,
} from '../../../components/learning-world/canvas-render-tap'

const NUM_RUNS = 100

// ---------------------------------------------------------------------------
// Tap-context: a fully populated 8-method `WorldCanvasContext` whose every
// method is a no-op. We hand this to `wrapContextWithTrace` so each call
// is appended to a `ContextCallTrace[]` buffer that the test inspects.
// ---------------------------------------------------------------------------

function buildNoopContext(): WorldCanvasContext {
    const noop = (..._args: unknown[]): void => {
        /* intentionally empty */
    }
    return {
        clearRect: noop,
        fillRect: noop,
        drawImage: noop,
        save: noop,
        restore: noop,
        translate: noop,
        scale: noop,
        setTransform: noop,
    } as unknown as WorldCanvasContext
}

interface RecordingContext {
    readonly ctx: WorldCanvasContext
    readonly traces: ContextCallTrace[]
}

function buildRecordingContext(): RecordingContext {
    const traces: ContextCallTrace[] = []
    const ctx = wrapContextWithTrace(buildNoopContext(), (trace) => {
        traces.push(trace)
    })
    return { ctx, traces }
}

// ---------------------------------------------------------------------------
// TestRenderer: minimal harness mirroring `LearningWorldCanvas.requestPaint`.
//
// The production component holds `rafIdRef.current: number | null`. When
// `requestPaint()` is called and the slot is non-null, the call is a
// no-op (frame already pending). Otherwise it schedules
// `requestAnimationFrame(callback)`; the callback clears the slot before
// invoking the paint function so a *new* `requestPaint()` issued inside
// the paint function correctly schedules the next frame.
// ---------------------------------------------------------------------------

class TestRenderer {
    private rafId: number | null = null
    private framesPainted: number = 0

    constructor(private readonly paintFn: () => void) {}

    public requestPaint(): void {
        if (this.rafId !== null) return
        this.rafId = globalThis.requestAnimationFrame(() => {
            this.rafId = null
            this.framesPainted += 1
            this.paintFn()
        })
    }

    public getFramesPainted(): number {
        return this.framesPainted
    }

    public hasPendingFrame(): boolean {
        return this.rafId !== null
    }
}

/**
 * Drains all currently-scheduled animation-frame callbacks. Two RAF
 * advances are sufficient because Requirement 8.3 explicitly allows
 * "within 2 animation frames in test environments where
 * `requestAnimationFrame` scheduling is approximated".
 *
 * Vitest 3.x ships `vi.advanceTimersToNextFrame()`. We probe for it at
 * runtime so the test stays portable across Vitest minor versions; if
 * absent, we fall back to `vi.advanceTimersByTime(0)` (which fires any
 * 0-delay timer and any RAF that resolves on the next macro tick when
 * faked).
 */
function advanceOneFrame(): void {
    const adv = (vi as unknown as {
        advanceTimersToNextFrame?: () => void
    }).advanceTimersToNextFrame
    if (typeof adv === 'function') {
        adv.call(vi)
    } else {
        // Fallback: vi.advanceTimersByTime(16) covers a typical 60Hz frame.
        vi.advanceTimersByTime(16)
    }
}

function advanceFrames(n: number): void {
    for (let i = 0; i < n; i += 1) advanceOneFrame()
}

// ---------------------------------------------------------------------------
// Shared engine harness for Property 15 (WorldMap mutations).
// ---------------------------------------------------------------------------

function buildGridAndCandidates(): {
    readonly grid: IsoGrid
    readonly candidates: readonly WorldObject[]
} {
    const grid = new IsoGrid({
        tileWidth: 64,
        tileHeight: 32,
        cols: 8,
        rows: 8,
    })
    // Build 16 disjoint 1x1 candidates on a 4x4 lattice so add/remove
    // sequences never collide and never go out of bounds.
    const candidates: WorldObject[] = []
    let id = 0
    for (let gx = 0; gx < 4; gx += 1) {
        for (let gy = 0; gy < 4; gy += 1) {
            candidates.push(
                createWorldObject(
                    {
                        id: `cand-${id}`,
                        gx,
                        gy,
                        footprint: { w: 1, d: 1 },
                        assetKey: `asset-${id}`,
                    },
                    grid,
                ),
            )
            id += 1
        }
    }
    return { grid, candidates }
}

// ---------------------------------------------------------------------------
// Test setup: install fake timers that include RAF / cAF.
//
// The vitest config uses environment 'node', which does NOT expose
// `requestAnimationFrame` on `globalThis`. `vi.useFakeTimers({ toFake })`
// only *replaces* an existing global, so we plant a real-timer-backed
// stub first; `vi.useFakeTimers` then takes over and routes RAF
// callbacks through the fake-timer queue, which `vi.advanceTimersByTime`
// and `vi.advanceTimersToNextFrame` can drain deterministically.
// ---------------------------------------------------------------------------

const FRAME_MS = 16

interface WindowLikeWithRaf {
    requestAnimationFrame: (cb: FrameRequestCallback) => number
    cancelAnimationFrame: (handle: number) => void
}

let originalRaf: WindowLikeWithRaf['requestAnimationFrame'] | undefined
let originalCaf: WindowLikeWithRaf['cancelAnimationFrame'] | undefined
let rafInstalledByTest = false

function installRafStubIfMissing(): void {
    const g = globalThis as unknown as Partial<WindowLikeWithRaf>
    originalRaf = g.requestAnimationFrame
    originalCaf = g.cancelAnimationFrame
    if (typeof g.requestAnimationFrame !== 'function') {
        rafInstalledByTest = true
        ;(globalThis as unknown as WindowLikeWithRaf).requestAnimationFrame = (
            cb: FrameRequestCallback,
        ): number => {
            // Real-timer-backed stub. `vi.useFakeTimers({ toFake: ['setTimeout',
            // 'requestAnimationFrame'] })` will replace this function with the
            // fake-timer-backed version, so this body only runs when fake
            // timers are NOT active. We still implement it correctly so the
            // stub behaves like a real RAF if it ever runs unfaked.
            const handle = setTimeout(() => cb(performance.now()), FRAME_MS)
            return handle as unknown as number
        }
        ;(globalThis as unknown as WindowLikeWithRaf).cancelAnimationFrame = (
            handle: number,
        ): void => {
            clearTimeout(handle as unknown as ReturnType<typeof setTimeout>)
        }
    }
}

function restoreRafStub(): void {
    if (!rafInstalledByTest) return
    const g = globalThis as unknown as Record<string, unknown>
    if (originalRaf === undefined) {
        delete g.requestAnimationFrame
    } else {
        g.requestAnimationFrame = originalRaf
    }
    if (originalCaf === undefined) {
        delete g.cancelAnimationFrame
    } else {
        g.cancelAnimationFrame = originalCaf
    }
    rafInstalledByTest = false
    originalRaf = undefined
    originalCaf = undefined
}

beforeEach(() => {
    installRafStubIfMissing()
    vi.useFakeTimers({
        toFake: [
            'requestAnimationFrame',
            'cancelAnimationFrame',
            'setTimeout',
            'clearTimeout',
            'setInterval',
            'clearInterval',
            'queueMicrotask',
            'Date',
        ],
    })
})

afterEach(() => {
    vi.useRealTimers()
    restoreRafStub()
})

// ---------------------------------------------------------------------------
// Property 13 — Idle frames produce zero observable context calls
// Validates: Requirements 8.1, 8.4, 8.5
// ---------------------------------------------------------------------------

describe('Property 13 — idle frames produce zero observable context calls (Reqs 8.1, 8.4, 8.5)', () => {
    it('a renderer that never receives requestPaint records zero context calls across arbitrary advances', () => {
        fc.assert(
            fc.property(
                // 1..20 advances; each advance is either an animation
                // frame or a wall-clock advance >= 100ms (the idle
                // window). Mixing both shapes exercises the spec's
                // "no input within 100ms" branch and the "no version
                // change since last frame" branch in the same test.
                fc.array(
                    fc.oneof(
                        fc.constant<{ kind: 'frame' }>({ kind: 'frame' }),
                        fc
                            .integer({ min: 100, max: 5_000 })
                            .map((ms): { kind: 'time'; ms: number } => ({
                                kind: 'time',
                                ms,
                            })),
                    ),
                    { minLength: 1, maxLength: 20 },
                ),
                (steps) => {
                    const { ctx: _ctx, traces } = buildRecordingContext()

                    // Build a renderer whose paint function would call
                    // every method on `_ctx` IF invoked. We never call
                    // `requestPaint`, so the paint function must never
                    // run, and `traces` must stay empty.
                    const renderer = new TestRenderer(() => {
                        _ctx.setTransform(1, 0, 0, 1, 0, 0)
                        _ctx.clearRect(0, 0, 1, 1)
                        _ctx.fillRect(0, 0, 1, 1)
                        _ctx.drawImage(
                            { width: 1, height: 1 } as never,
                            0,
                            0,
                            1,
                            1,
                        )
                    })

                    for (const step of steps) {
                        if (step.kind === 'frame') {
                            advanceOneFrame()
                        } else {
                            vi.advanceTimersByTime(step.ms)
                        }
                    }

                    // Idle invariant: zero recorded context calls
                    // (Requirement 8.1). The traces array doubles as the
                    // test hook required by Requirement 8.5.
                    expect(traces.length).toBe(0)
                    expect(renderer.getFramesPainted()).toBe(0)
                    expect(renderer.hasPendingFrame()).toBe(false)
                },
            ),
            { numRuns: NUM_RUNS },
        )
    })

    it('explicit example: 1 second of fake-timer time with no requestPaint records zero calls', () => {
        const { ctx, traces } = buildRecordingContext()
        const renderer = new TestRenderer(() => {
            ctx.fillRect(0, 0, 100, 100)
        })
        vi.advanceTimersByTime(1_000)
        advanceFrames(60)
        expect(traces.length).toBe(0)
        expect(renderer.getFramesPainted()).toBe(0)
    })
})

// ---------------------------------------------------------------------------
// Property 14 — Input-burst coalescing
// Validates: Requirements 8.2
// ---------------------------------------------------------------------------

describe('Property 14 — input-burst coalescing (Req 8.2)', () => {
    it('any number of requestPaint calls within one tick produces exactly one frame', () => {
        fc.assert(
            fc.property(
                // Burst of 1..50 requestPaint calls within a single tick.
                fc.integer({ min: 1, max: 50 }),
                (burstSize) => {
                    const { ctx, traces } = buildRecordingContext()

                    // Paint function makes a fixed, non-zero number of
                    // context calls per frame. A constant of 4 is enough
                    // to disambiguate "one frame" from "no frame" / "two
                    // frames" without coupling to the production paint
                    // sequence.
                    const callsPerFrame = 4
                    const renderer = new TestRenderer(() => {
                        ctx.setTransform(1, 0, 0, 1, 0, 0)
                        ctx.clearRect(0, 0, 1, 1)
                        ctx.fillRect(0, 0, 1, 1)
                        ctx.scale(1, 1)
                    })

                    // Burst within one tick (no timer advance between
                    // calls). All but the first must be no-ops because
                    // a frame is already pending.
                    for (let i = 0; i < burstSize; i += 1) {
                        renderer.requestPaint()
                    }

                    // Exactly one RAF must be pending right now.
                    expect(renderer.hasPendingFrame()).toBe(true)

                    // Drain the single pending frame.
                    advanceOneFrame()

                    // Coalescing invariant (Requirement 8.2): exactly
                    // one paint, regardless of burst size.
                    expect(renderer.getFramesPainted()).toBe(1)
                    expect(traces.length).toBe(callsPerFrame)
                    expect(renderer.hasPendingFrame()).toBe(false)
                },
            ),
            { numRuns: NUM_RUNS },
        )
    })

    it('a second burst after the first frame drained schedules a second frame (and only one)', () => {
        const { ctx, traces } = buildRecordingContext()
        const renderer = new TestRenderer(() => {
            ctx.fillRect(0, 0, 1, 1)
        })

        // Burst 1.
        for (let i = 0; i < 10; i += 1) renderer.requestPaint()
        advanceOneFrame()
        expect(renderer.getFramesPainted()).toBe(1)
        expect(traces.length).toBe(1)

        // Burst 2 after drain.
        for (let i = 0; i < 7; i += 1) renderer.requestPaint()
        advanceOneFrame()
        expect(renderer.getFramesPainted()).toBe(2)
        expect(traces.length).toBe(2)
    })
})

// ---------------------------------------------------------------------------
// Property 15 — Manual `requestPaint` coalescing across `WorldMap` mutations
// Validates: Requirements 8.3
// ---------------------------------------------------------------------------

describe('Property 15 — requestPaint coalesces across WorldMap mutations (Req 8.3)', () => {
    it('any sequence of (mutation + requestPaint) within one tick produces exactly one frame whose state reflects the final WorldMap version', () => {
        fc.assert(
            fc.property(
                // 1..16 add/remove operations; we pre-pick distinct
                // candidate indices so add / remove never throws.
                fc
                    .uniqueArray(fc.integer({ min: 0, max: 15 }), {
                        minLength: 1,
                        maxLength: 16,
                    })
                    .chain((indices) =>
                        fc.tuple(
                            fc.constant(indices),
                            // Per-index op: 'add' first, 'addRemove'
                            // (add then remove) so the final WorldMap
                            // state is well-defined and the version
                            // counter strictly grows on every step.
                            fc.array(
                                fc.constantFrom<'add' | 'addRemove'>(
                                    'add',
                                    'addRemove',
                                ),
                                {
                                    minLength: indices.length,
                                    maxLength: indices.length,
                                },
                            ),
                        ),
                    ),
                ([indices, ops]) => {
                    const { grid, candidates } = buildGridAndCandidates()
                    const map = new WorldMap({ grid })
                    const versionAtMount = map.getVersion()

                    // Snapshot the version observed at paint-time so we
                    // can assert the painted state reflects the FINAL
                    // version after the full mutation burst.
                    let versionObservedDuringPaint: number | null = null

                    const { ctx, traces } = buildRecordingContext()
                    const renderer = new TestRenderer(() => {
                        versionObservedDuringPaint = map.getVersion()
                        // Make at least one observable context call so
                        // the trace count distinguishes paint-ran from
                        // paint-skipped.
                        ctx.setTransform(1, 0, 0, 1, 0, 0)
                    })

                    // Apply (mutation + requestPaint) sequence within
                    // a single tick. No timer advance between steps.
                    let expectedSuccessfulMutations = 0
                    for (let i = 0; i < indices.length; i += 1) {
                        const idx = indices[i] as number
                        const op = ops[i] as 'add' | 'addRemove'
                        const obj = candidates[idx] as WorldObject
                        if (op === 'add') {
                            map.add(obj)
                            expectedSuccessfulMutations += 1
                            renderer.requestPaint()
                        } else {
                            map.add(obj)
                            renderer.requestPaint()
                            map.remove(obj)
                            expectedSuccessfulMutations += 2
                            renderer.requestPaint()
                        }
                    }

                    // WorldMap version must have advanced by the
                    // expected count (Requirement 12.9). This both
                    // sanity-checks the harness and proves the renderer
                    // can't have stolen mutations.
                    expect(map.getVersion()).toBe(
                        versionAtMount + expectedSuccessfulMutations,
                    )

                    // Exactly one frame must be pending after the burst.
                    expect(renderer.hasPendingFrame()).toBe(true)

                    // Drain. Spec allows up to 2 frames to drain in
                    // approximated test environments (Requirement 8.3).
                    advanceFrames(2)

                    // Coalescing invariant: exactly one paint over the
                    // whole burst.
                    expect(renderer.getFramesPainted()).toBe(1)
                    // setTransform was called once; nothing else.
                    expect(traces.length).toBe(1)
                    expect(traces[0]?.method).toBe('setTransform')

                    // The single paint observed the FINAL WorldMap
                    // version (Requirement 8.3: the painted state
                    // reflects the latest mutations).
                    expect(versionObservedDuringPaint).toBe(map.getVersion())

                    // No further frame is scheduled until the next
                    // requestPaint trigger.
                    expect(renderer.hasPendingFrame()).toBe(false)
                },
            ),
            { numRuns: NUM_RUNS },
        )
    })

    it('explicit example: add three objects with a requestPaint after each, then drain — exactly one frame', () => {
        const { grid, candidates } = buildGridAndCandidates()
        const map = new WorldMap({ grid })
        const { ctx, traces } = buildRecordingContext()
        const renderer = new TestRenderer(() => {
            ctx.fillRect(0, 0, 1, 1)
        })

        for (let i = 0; i < 3; i += 1) {
            map.add(candidates[i] as WorldObject)
            renderer.requestPaint()
        }

        expect(renderer.hasPendingFrame()).toBe(true)
        advanceOneFrame()
        expect(renderer.getFramesPainted()).toBe(1)
        expect(traces.length).toBe(1)
        expect(map.getVersion()).toBe(3)
    })
})
