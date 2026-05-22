import { useEffect, useState } from 'react'
import type { RefObject } from 'react'

/**
 * Trailing-edge debounce window (in ms) applied to size emissions.
 *
 * Per Requirement 9.4 and Property 17 of the Learning World spec, a burst of
 * resize events within any 100ms window followed by 100ms of silence MUST
 * produce exactly one observable size emission. This constant is the source
 * of truth for that window.
 */
export const RESIZE_DEBOUNCE_MS = 100

/**
 * A debounced size observation, in CSS pixels.
 *
 * - `width`: element width in CSS pixels (`getBoundingClientRect().width` or
 *   the `ResizeObserverEntry.contentRect.width`).
 * - `height`: element height in CSS pixels.
 */
export interface ObservedSize {
  readonly width: number
  readonly height: number
}

/**
 * Pure helper used by Property 17 of the Learning World property-test suite.
 *
 * Given a list of event timestamps in milliseconds, sorted ascending, and a
 * debounce window `windowMs`, returns the count of distinct emissions a
 * `windowMs`-trailing-edge-debounced subscriber would observe.
 *
 * ## Semantics
 *
 * The debouncer fires AFTER `windowMs` of silence following any burst.
 * Concretely, two consecutive events `events[i]` and `events[i + 1]` are part
 * of the same burst iff `events[i + 1] - events[i] <= windowMs`. Each maximal
 * burst contributes exactly one emission.
 *
 * Equivalent semantic: `emissions = 1 + (number of indices i such that
 * events[i + 1] - events[i] > windowMs)`, with `emissions = 0` when the
 * events list is empty.
 *
 * The helper is intentionally DOM-free and side-effect-free so it can be
 * unit-tested without jsdom, fake timers, or a `ResizeObserver` polyfill.
 *
 * ## Examples
 *
 * - `debounceCoalesceCount([], 100)` → `0`
 * - `debounceCoalesceCount([0], 100)` → `1`
 * - `debounceCoalesceCount([0, 50, 90], 100)` → `1`
 *   (one burst, all gaps `<= 100`)
 * - `debounceCoalesceCount([0, 50, 90, 200], 100)` → `2`
 *   (gap `200 - 90 = 110 > 100` splits into two bursts)
 *
 * @param events  Event timestamps in milliseconds, sorted ascending.
 * @param windowMs The debounce window in milliseconds. Must be `>= 0`.
 */
export function debounceCoalesceCount(
  events: readonly number[],
  windowMs: number,
): number {
  if (events.length === 0) {
    return 0
  }
  let bursts = 1
  for (let i = 1; i < events.length; i++) {
    if (events[i] - events[i - 1] > windowMs) {
      bursts++
    }
  }
  return bursts
}

/**
 * Returns the type of timer handle the runtime's `setTimeout` produces.
 *
 * In Node typings `setTimeout` returns `NodeJS.Timeout`; in DOM typings it
 * returns `number`. We accept both at runtime.
 */
type TimerHandle = ReturnType<typeof setTimeout>

/**
 * React hook that observes the size of a DOM element with a 100ms
 * trailing-edge debounce.
 *
 * The hook prefers the global `ResizeObserver` when available and falls
 * back to a `window.addEventListener('resize', ...)` debouncer (driven by
 * `element.getBoundingClientRect()`) when it is not.
 *
 * ## Behavior
 *
 * - Returns `null` until the first observation fires (one debounce tick
 *   after the first reported size change).
 * - Coalesces bursts of size changes into a single state update per
 *   `RESIZE_DEBOUNCE_MS` of silence (Requirement 9.4, Property 17).
 * - SSR-safe: does not touch `window` or `ResizeObserver` at module load
 *   time. The hook simply does nothing during server rendering and during
 *   the first client render before the effect runs.
 * - On unmount, the pending debounce timeout is cleared, the
 *   `ResizeObserver` is disconnected, and the window `'resize'` listener is
 *   removed. The hook never updates state after unmount.
 *
 * @param ref A React ref to the element whose size should be observed. The
 *   ref's current value may be `null` (e.g., before the element is
 *   mounted); the hook handles that case gracefully and re-checks on every
 *   tick.
 */
export function useResizeObserver(
  ref: RefObject<HTMLElement | null>,
): ObservedSize | null {
  const [size, setSize] = useState<ObservedSize | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const element = ref.current
    if (element === null) {
      return
    }

    let cancelled = false
    let timeoutHandle: TimerHandle | null = null
    let pendingSize: ObservedSize | null = null

    const flush = (): void => {
      timeoutHandle = null
      if (cancelled) {
        return
      }
      if (pendingSize === null) {
        return
      }
      const next = pendingSize
      pendingSize = null
      setSize((prev) => {
        if (
          prev !== null &&
          prev.width === next.width &&
          prev.height === next.height
        ) {
          return prev
        }
        return next
      })
    }

    const schedule = (next: ObservedSize): void => {
      pendingSize = next
      if (timeoutHandle !== null) {
        clearTimeout(timeoutHandle)
      }
      timeoutHandle = setTimeout(flush, RESIZE_DEBOUNCE_MS)
    }

    const ResizeObserverCtor =
      typeof window !== 'undefined'
        ? (window as Window & { ResizeObserver?: typeof ResizeObserver })
            .ResizeObserver
        : undefined

    if (typeof ResizeObserverCtor === 'function') {
      const observer = new ResizeObserverCtor((entries) => {
        const entry = entries[entries.length - 1]
        if (entry === undefined) {
          return
        }
        const rect = entry.contentRect
        schedule({ width: rect.width, height: rect.height })
      })
      observer.observe(element)
      return () => {
        cancelled = true
        if (timeoutHandle !== null) {
          clearTimeout(timeoutHandle)
          timeoutHandle = null
        }
        observer.disconnect()
      }
    }

    // Fallback: window 'resize' debouncer driven by getBoundingClientRect.
    const readSize = (): ObservedSize => {
      const rect = element.getBoundingClientRect()
      return { width: rect.width, height: rect.height }
    }

    // Seed the first size synchronously so the fallback path matches the
    // ResizeObserver path's "first emission after one debounce tick" model.
    schedule(readSize())

    const handleWindowResize = (): void => {
      schedule(readSize())
    }
    window.addEventListener('resize', handleWindowResize)

    return () => {
      cancelled = true
      if (timeoutHandle !== null) {
        clearTimeout(timeoutHandle)
        timeoutHandle = null
      }
      window.removeEventListener('resize', handleWindowResize)
    }
  }, [ref])

  return size
}
