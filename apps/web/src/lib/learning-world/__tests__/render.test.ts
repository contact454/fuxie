// Feature: fuxie-learning-world-lab-v0, Property 11: paint() rejects
// non-conformant WorldCanvasContext.
//
// Vai chinh: QA Automation Engineer
// Vai phoi hop: Frontend Engineer
//
// Spec ref: `.kiro/specs/fuxie-learning-world-lab-v0/requirements.md`
// Requirement 3.7  — paint() rejects null / undefined / non-conformant
//                    `WorldCanvasContext` BEFORE invoking any method on
//                    `ctx` and BEFORE mutating any input. The rejection
//                    surfaces as `LearningWorldError('INVALID_CONTEXT', ...)`.
//
// Test plan (mirrors task 7.2):
//
//   Property 11 — paint() rejects non-conformant WorldCanvasContext:
//     For every iteration, generate a non-conformant context variant by
//     either:
//       (a) taking a fully-populated 8-method base mock and breaking
//           exactly one of the eight methods (delete it, or set it to a
//           non-function: null / undefined / string / number);
//       (b) using `null` or `undefined` as the entire ctx argument.
//     For each variant:
//       - Wrap the variant in a `Proxy` that records every method
//         invocation; the test holds a strict reference to the raw
//         invocation counter so it cannot be tampered with from inside
//         `paint`.
//       - Snapshot `WorldMap.getVersion()` before the call.
//       - Call `paint(variant, inputs)` and assert it throws a
//         `LearningWorldError` whose `code === 'INVALID_CONTEXT'`.
//       - Assert the recorded invocation count is exactly 0 (no method
//         on the variant was called).
//       - Assert `WorldMap.getVersion()` is unchanged.
//     Sanity (not part of Property 11): a fully-populated 8-method
//     context, wrapped by the same Proxy recorder, must let `paint`
//     succeed and the recorder must observe a positive invocation
//     count. This proves the Proxy actually records invocations, so the
//     "zero invocations" assertion in Property 11 is meaningful.
//     Validates: Requirement 3.7.
//
// Validates: Requirements 3.7.

import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import {
    IsoGrid,
    LearningWorldError,
    WorldCamera,
    WorldMap,
    createWorldObject,
    paint,
} from '@/lib/learning-world'
import type {
    RenderInputs,
    Viewport,
    WorldCanvasContext,
    WorldImageSource,
    WorldScene,
} from '@/lib/learning-world'

const NUM_RUNS = 100

// ---------------------------------------------------------------------------
// Method set of the WorldCanvasContext seam (kept in sync with the source).
// ---------------------------------------------------------------------------

const WORLD_CANVAS_METHODS = [
    'clearRect',
    'fillRect',
    'drawImage',
    'save',
    'restore',
    'translate',
    'scale',
    'setTransform',
] as const

type WorldCanvasMethod = (typeof WORLD_CANVAS_METHODS)[number]

// ---------------------------------------------------------------------------
// Minimum valid RenderInputs.
//
// We need a `RenderInputs` instance that `paint` would happily consume on
// the success path. Property 11 only ever exercises the rejection path, so
// the inputs are never read by `paint` once a non-conformant context is
// passed -- but `paint` does destructure `inputs` after the validation
// gate, so the shape must still type-check at runtime. The sanity test at
// the bottom of this file additionally relies on these inputs to drive a
// full `paint` traversal, including the object pass.
// ---------------------------------------------------------------------------

interface RenderHarness {
    readonly inputs: RenderInputs
    readonly map: WorldMap
}

function buildHarness(): RenderHarness {
    const grid = new IsoGrid({ tileWidth: 64, tileHeight: 32, cols: 8, rows: 8 })
    const camera = new WorldCamera({
        minZoom: 0.5,
        maxZoom: 2.0,
        initialZoom: 1.0,
    })
    const map = new WorldMap({ grid })

    // Two distinct, non-colliding objects. We register them so the
    // version counter is non-zero before paint runs; if paint were to
    // mistakenly mutate the map (it shouldn't; it only reads via
    // `.objects()`), the version would drift and the assertion would
    // catch it.
    const objA = createWorldObject(
        {
            id: 'obj-a',
            gx: 1,
            gy: 1,
            footprint: { w: 1, d: 1 },
            assetKey: 'asset-a',
        },
        grid,
    )
    const objB = createWorldObject(
        {
            id: 'obj-b',
            gx: 4,
            gy: 4,
            footprint: { w: 2, d: 2 },
            assetKey: 'asset-b',
        },
        grid,
    )
    map.add(objA)
    map.add(objB)

    // V0 ships an empty terrain array. We mirror that here. For the
    // sanity-check success path we provide an empty image map; paint
    // skips objects whose assetKey is missing from `images`, so the
    // object pass still walks the loop body (the `images.get` lookup +
    // the `continue`), but never reaches `drawImage`. That's fine: the
    // sanity check only needs *some* method invocations to be recorded
    // (clearRect, fillRect, setTransform, scale, translate), not
    // drawImage specifically.
    const scene: WorldScene = {
        grid: { tileWidth: 64, tileHeight: 32, cols: 8, rows: 8 },
        terrain: [],
        objects: [objA, objB],
        canvasAriaLabel: 'render-test scene',
    }
    const images = new Map<string, WorldImageSource>()
    const viewport: Viewport = {
        cssWidth: 320,
        cssHeight: 240,
        devicePixelRatio: 2,
    }

    const inputs: RenderInputs = {
        scene,
        grid,
        camera,
        map,
        images,
        viewport,
    }
    return { inputs, map }
}

// ---------------------------------------------------------------------------
// Recording Proxy.
//
// The Proxy wraps a target object and counts every method invocation. The
// counter lives in a closure outside the Proxy so it can be inspected
// even if the wrapped target is otherwise opaque.
//
// Why a Proxy and not a plain spy: the task explicitly asks for a
// `Proxy`-wrapped 8-method mock so that any property access -- including
// access to a method that has been deleted or set to a non-function --
// is observable. A Proxy lets the test confirm that `paint` performs
// only the *predicate* property reads done by `isWorldCanvasContext`
// (which uses `typeof c[m] === 'function'`) and never *invokes* any
// method on the variant.
//
// Implementation detail: the `get` trap returns the raw property when it
// is not a function; when it is a function, the trap returns a wrapper
// that increments the counter then forwards the call. The wrapper is
// only ever installed for present-and-callable properties; deleted /
// null / undefined / non-function properties surface to the caller as
// the underlying value, which is exactly what `isWorldCanvasContext`'s
// `typeof === 'function'` test needs to see.
// ---------------------------------------------------------------------------

interface ProxyRecorder {
    readonly proxy: unknown
    readonly getInvocationCount: () => number
}

function recordingProxy(target: object): ProxyRecorder {
    let invocations = 0
    const proxy = new Proxy(target, {
        get(t, prop, receiver) {
            const value = Reflect.get(t, prop, receiver)
            if (typeof value === 'function') {
                // Return a wrapper that records the invocation. We bind to
                // the original target so any internal `this` reads still
                // see the underlying object.
                return (...args: unknown[]) => {
                    invocations += 1
                    return (value as (...a: unknown[]) => unknown).apply(t, args)
                }
            }
            return value
        },
    })
    return {
        proxy,
        getInvocationCount: () => invocations,
    }
}

// ---------------------------------------------------------------------------
// Variant construction.
//
// A "variant" is a non-conformant ctx argument. We enumerate two families:
//   (1) Object variants: a base 8-method mock with exactly one method
//       broken. Five breakage modes per method: delete, null, undefined,
//       string, number. 8 * 5 = 40 object variants.
//   (2) Whole-ctx variants: `null` and `undefined`. The Proxy wrapping is
//       skipped for these because Proxy requires a non-null object
//       target; instead, we hand the raw value directly to `paint` and
//       assert with a stub recorder.
// ---------------------------------------------------------------------------

type BreakageMode = 'delete' | 'null' | 'undefined' | 'string' | 'number'
const BREAKAGE_MODES: readonly BreakageMode[] = [
    'delete',
    'null',
    'undefined',
    'string',
    'number',
]

function buildFullMock(): Record<WorldCanvasMethod, (...args: unknown[]) => void> {
    return {
        clearRect: () => {},
        fillRect: () => {},
        drawImage: () => {},
        save: () => {},
        restore: () => {},
        translate: () => {},
        scale: () => {},
        setTransform: () => {},
    }
}

/**
 * Builds an object that has the seven other 8-method functions intact and
 * the named method broken according to `mode`.
 */
function buildMissingMethodMock(
    method: WorldCanvasMethod,
    mode: BreakageMode,
): Record<string, unknown> {
    const variant: Record<string, unknown> = buildFullMock()
    switch (mode) {
        case 'delete':
            delete variant[method]
            break
        case 'null':
            variant[method] = null
            break
        case 'undefined':
            variant[method] = undefined
            break
        case 'string':
            variant[method] = 'not-a-function'
            break
        case 'number':
            variant[method] = 42
            break
    }
    return variant
}

// One arbitrary that yields a description of the variant. Object variants
// dominate the search space; null/undefined are sampled with weight 1
// each so they show up reliably across 100 runs.
type VariantSpec =
    | { readonly kind: 'object'; readonly method: WorldCanvasMethod; readonly mode: BreakageMode }
    | { readonly kind: 'null' }
    | { readonly kind: 'undefined' }

const arbVariant: fc.Arbitrary<VariantSpec> = fc.oneof(
    {
        weight: 8,
        arbitrary: fc
            .record({
                method: fc.constantFrom(...WORLD_CANVAS_METHODS),
                mode: fc.constantFrom(...BREAKAGE_MODES),
            })
            .map(
                ({ method, mode }): VariantSpec => ({
                    kind: 'object',
                    method,
                    mode,
                }),
            ),
    },
    { weight: 1, arbitrary: fc.constant<VariantSpec>({ kind: 'null' }) },
    { weight: 1, arbitrary: fc.constant<VariantSpec>({ kind: 'undefined' }) },
)

// ---------------------------------------------------------------------------
// Property 11
// ---------------------------------------------------------------------------

describe('Property 11 — paint() rejects non-conformant WorldCanvasContext (Req 3.7)', () => {
    it('throws INVALID_CONTEXT, calls no method on the variant, and leaves WorldMap.getVersion() unchanged', () => {
        fc.assert(
            fc.property(arbVariant, (spec) => {
                const { inputs, map } = buildHarness()
                const versionBefore = map.getVersion()

                // 1. Build the ctx argument we will hand to `paint`, plus
                //    a way to read the invocation counter.
                let ctxArg: unknown
                let getInvocations: () => number
                if (spec.kind === 'object') {
                    const variant = buildMissingMethodMock(spec.method, spec.mode)
                    const recorder = recordingProxy(variant)
                    ctxArg = recorder.proxy
                    getInvocations = recorder.getInvocationCount
                } else if (spec.kind === 'null') {
                    ctxArg = null
                    // No proxy wrapping for primitives; nothing to record.
                    getInvocations = () => 0
                } else {
                    ctxArg = undefined
                    getInvocations = () => 0
                }

                // 2. Call paint and capture the throw.
                let threw: unknown = null
                try {
                    paint(ctxArg as WorldCanvasContext, inputs)
                } catch (err) {
                    threw = err
                }

                // 3. Must throw a typed LearningWorldError with the
                //    documented code (Requirement 3.7).
                expect(threw, `variant=${describeVariant(spec)}`).toBeInstanceOf(
                    LearningWorldError,
                )
                expect(
                    (threw as LearningWorldError).code,
                    `variant=${describeVariant(spec)}`,
                ).toBe('INVALID_CONTEXT')

                // 4. Zero method invocations recorded on the variant
                //    (Requirement 3.7: paint must not invoke any method
                //    on a non-conformant ctx).
                expect(
                    getInvocations(),
                    `variant=${describeVariant(spec)} should have 0 invocations`,
                ).toBe(0)

                // 5. WorldMap.getVersion() unchanged (Requirement 3.7:
                //    paint must not mutate any input on rejection).
                expect(
                    map.getVersion(),
                    `variant=${describeVariant(spec)} must not bump WorldMap.version`,
                ).toBe(versionBefore)
            }),
            { numRuns: NUM_RUNS },
        )
    })

    it('explicit named cases for each method × breakage mode', () => {
        // Belt-and-suspenders coverage: the property-based run already
        // covers every (method, mode) combination with high probability,
        // but pinning each combination as an explicit example guarantees
        // that no missing-method variant is ever skipped due to a
        // generator collapse on a future fast-check upgrade.
        for (const method of WORLD_CANVAS_METHODS) {
            for (const mode of BREAKAGE_MODES) {
                const { inputs, map } = buildHarness()
                const versionBefore = map.getVersion()

                const variant = buildMissingMethodMock(method, mode)
                const recorder = recordingProxy(variant)

                let threw: unknown = null
                try {
                    paint(recorder.proxy as WorldCanvasContext, inputs)
                } catch (err) {
                    threw = err
                }

                const label = `${method}/${mode}`
                expect(threw, label).toBeInstanceOf(LearningWorldError)
                expect((threw as LearningWorldError).code, label).toBe(
                    'INVALID_CONTEXT',
                )
                expect(recorder.getInvocationCount(), label).toBe(0)
                expect(map.getVersion(), label).toBe(versionBefore)
            }
        }
    })

    it('explicit cases for whole-ctx null and undefined', () => {
        for (const ctxArg of [null, undefined] as const) {
            const { inputs, map } = buildHarness()
            const versionBefore = map.getVersion()

            let threw: unknown = null
            try {
                paint(ctxArg as unknown as WorldCanvasContext, inputs)
            } catch (err) {
                threw = err
            }

            const label = ctxArg === null ? 'null' : 'undefined'
            expect(threw, label).toBeInstanceOf(LearningWorldError)
            expect((threw as LearningWorldError).code, label).toBe(
                'INVALID_CONTEXT',
            )
            expect(map.getVersion(), label).toBe(versionBefore)
        }
    })

    // -----------------------------------------------------------------
    // Sanity check (NOT part of Property 11).
    //
    // Confirms that the recording Proxy actually observes invocations
    // on the success path. If this test ever stops registering at least
    // one invocation, the "zero invocations on rejection" assertion
    // above would be vacuous, so we pin it.
    // -----------------------------------------------------------------
    it('sanity: a fully-populated 8-method ctx, wrapped by the same Proxy, lets paint succeed and records ≥1 invocation', () => {
        const { inputs, map } = buildHarness()
        const versionBefore = map.getVersion()

        const fullMock = buildFullMock()
        const recorder = recordingProxy(fullMock)

        // Should NOT throw.
        expect(() =>
            paint(recorder.proxy as WorldCanvasContext, inputs),
        ).not.toThrow()

        // The Proxy must have observed the canvas-state setup calls
        // (setTransform / clearRect / fillRect / scale / translate).
        // We don't pin a specific count to avoid coupling to the paint
        // sequence; one or more is enough to prove the recorder is
        // functional.
        expect(recorder.getInvocationCount()).toBeGreaterThan(0)

        // paint() must not mutate the WorldMap on success either; it
        // only reads via `.objects()`.
        expect(map.getVersion()).toBe(versionBefore)
    })
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function describeVariant(spec: VariantSpec): string {
    if (spec.kind === 'object') return `object/${spec.method}/${spec.mode}`
    return spec.kind
}
