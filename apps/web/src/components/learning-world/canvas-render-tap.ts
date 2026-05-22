/**
 * Canvas render tap — test-only instrumentation hook.
 *
 * Wraps a `WorldCanvasContext` with a transparent recorder that emits a
 * `ContextCallTrace` for every method invocation. The wrapper delegates each
 * call to the underlying context with the same arguments, so paint output is
 * unchanged when the wrapper is in place.
 *
 * Intended for idle / coalescing tests in the learning-world rendering layer
 * (Requirement 8.5). Not used by production paint paths.
 *
 * Timestamps use `Date.now()` for portability across browser and Vitest jsdom
 * environments. Monotonic timing (`performance.now()`) is not required because
 * traces are consumed by tests that assert call order and counts, not micro
 * timing differences.
 */

import type { WorldCanvasContext } from '@/lib/learning-world'

/** Method name on `WorldCanvasContext` that was invoked. */
export type TappedContextMethod =
  | 'clearRect'
  | 'fillRect'
  | 'drawImage'
  | 'save'
  | 'restore'
  | 'translate'
  | 'scale'
  | 'setTransform'

/** Single recorded invocation against a wrapped `WorldCanvasContext`. */
export interface ContextCallTrace {
  readonly method: TappedContextMethod
  readonly args: readonly unknown[]
  /** Wall-clock timestamp from `Date.now()` at the moment of the call. */
  readonly timestamp: number
}

/**
 * Exact list of methods on the public `WorldCanvasContext` interface. Adding a
 * method to that interface is a public-API change and must be mirrored here.
 */
const TAPPED_METHODS: readonly TappedContextMethod[] = [
  'clearRect',
  'fillRect',
  'drawImage',
  'save',
  'restore',
  'translate',
  'scale',
  'setTransform',
] as const

type AnyContextMethod = (...args: unknown[]) => unknown

/**
 * Wraps `ctx` in a structurally compatible `WorldCanvasContext` that reports
 * every method invocation to `onCall` before delegating to the underlying
 * context. Useful for asserting that the renderer is idle (no calls) or that
 * multiple frame requests within a tick are coalesced into a single paint.
 *
 * The returned object holds its own bound functions for each tapped method;
 * the original `ctx` is not mutated.
 */
export function wrapContextWithTrace(
  ctx: WorldCanvasContext,
  onCall: (trace: ContextCallTrace) => void,
): WorldCanvasContext {
  const source = ctx as unknown as Record<TappedContextMethod, AnyContextMethod>
  const wrapped: Record<string, unknown> = {}

  for (const method of TAPPED_METHODS) {
    wrapped[method] = (...args: unknown[]): unknown => {
      onCall({ method, args, timestamp: Date.now() })
      return source[method].apply(ctx, args)
    }
  }

  return wrapped as unknown as WorldCanvasContext
}
