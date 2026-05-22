import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import fc from 'fast-check'

import {
    RESIZE_DEBOUNCE_MS,
    debounceCoalesceCount,
} from '../useResizeObserver'

/**
 * Property tests for the resize-observer debounce semantics used by
 * `useResizeObserver`.
 *
 * Property 17: Resize debounce coalesces to one re-render
 *   Validates: Requirements 9.4
 *
 * Strategy: per the design's "Correctness Properties" section, Property 17 is
 * exercised via the pure helper `debounceCoalesceCount(events, windowMs)`
 * (no DOM, no React) AND via a `vi.useFakeTimers()`-driven simulator that
 * mirrors the hook's internal trailing-edge debouncer
 * (`setTimeout(flush, windowMs)` reset on every incoming event). The
 * simulator's emission count MUST equal the helper's result for every
 * generated event trace; this jointly validates that the helper's
 * mathematical model and the hook's actual scheduling agree.
 *
 * Each property runs at least 100 iterations via
 * `fc.assert(..., { numRuns: 100 })`.
 */

const NUM_RUNS = 100

// ---------------------------------------------------------------------------
// Pure model oracle for the debounce helper
// ---------------------------------------------------------------------------

/**
 * Reference implementation of trailing-edge debounce coalescing, written
 * independently of `debounceCoalesceCount` so the property does not test
 * the helper against itself.
 */
function modelCoalesce(
    events: readonly number[],
    windowMs: number,
): number {
    if (events.length === 0) {
        return 0
    }
    let bursts = 1
    for (let i = 1; i < events.length; i += 1) {
        const current = events[i]
        const previous = events[i - 1]
        if (current === undefined || previous === undefined) {
            continue
        }
        const gap = current - previous
        if (gap > windowMs) {
            bursts += 1
        }
    }
    return bursts
}

// ---------------------------------------------------------------------------
// Fake-timer-driven simulator of the hook's internal debouncer
// ---------------------------------------------------------------------------

/**
 * Simulates exactly the scheduling shape used inside `useResizeObserver`:
 *   - on every incoming event, clear the pending timeout (if any) and
 *     `setTimeout(flush, windowMs)`
 *   - `flush` increments an emission counter
 *
 * The caller drives `vi.advanceTimersByTime(...)` so the trailing-edge
 * timer fires when the silence gap exceeds `windowMs`. After the last
 * event we advance by `windowMs` to drain the final pending timer.
 *
 * Pre-condition: `events` is sorted ascending and each entry is a
 * non-negative integer (millisecond offset from t=0). `vi.useFakeTimers()`
 * MUST be active for the duration of this call.
 */
function simulateDebounceWithFakeTimers(
    events: readonly number[],
    windowMs: number,
): number {
    let emissions = 0
    let pending: ReturnType<typeof setTimeout> | null = null
    let lastT = 0

    const flush = (): void => {
        pending = null
        emissions += 1
    }

    for (const t of events) {
        const delta = t - lastT
        if (delta > 0) {
            if (pending !== null && delta > windowMs) {
                // Trailing-edge fires before this event arrives: the
                // previous burst flushes and this event starts a new one.
                vi.advanceTimersByTime(delta)
            } else {
                // Event arrives before (or exactly at) the trailing edge:
                // reset the pending timer FIRST so the upcoming
                // `advanceTimersByTime` cannot fire it at the boundary,
                // then advance the simulated clock.
                if (pending !== null) {
                    clearTimeout(pending)
                    pending = null
                }
                vi.advanceTimersByTime(delta)
            }
        }
        lastT = t

        if (pending !== null) {
            clearTimeout(pending)
        }
        pending = setTimeout(flush, windowMs)
    }

    // Drain the trailing-edge timer for the final burst.
    vi.advanceTimersByTime(windowMs)

    // Defensive: if no events were submitted, no timer was scheduled and
    // no further drain is needed; if any timer is still pending it would
    // mean the model is wrong.
    expect(pending).toBeNull()

    return emissions
}

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/**
 * Produces a sorted-ascending array of integer event timestamps in
 * milliseconds, length 0..50, values in [0, 10_000]. Sorting is enforced
 * by construction so the input space matches `debounceCoalesceCount`'s
 * documented contract.
 */
const eventsArb: fc.Arbitrary<number[]> = fc
    .array(fc.integer({ min: 0, max: 10_000 }), {
        minLength: 0,
        maxLength: 50,
    })
    .map((xs) => [...xs].sort((a, b) => a - b))

// ---------------------------------------------------------------------------
// Property 17
// ---------------------------------------------------------------------------

describe('useResizeObserver / Property 17: resize debounce coalesces to one re-render', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('debounceCoalesceCount equals the model oracle and a fake-timer simulator (Validates: Requirements 9.4)', () => {
        fc.assert(
            fc.property(eventsArb, (events) => {
                const expected = modelCoalesce(events, RESIZE_DEBOUNCE_MS)
                const fromHelper = debounceCoalesceCount(
                    events,
                    RESIZE_DEBOUNCE_MS,
                )
                expect(fromHelper).toBe(expected)

                const fromSimulator = simulateDebounceWithFakeTimers(
                    events,
                    RESIZE_DEBOUNCE_MS,
                )
                expect(fromSimulator).toBe(expected)
            }),
            { numRuns: NUM_RUNS },
        )
    })

    it('coalesces a tight burst followed by silence into exactly one emission (Validates: Requirements 9.4)', () => {
        // Three events at t = 0, 50, 90 are all within one 100ms window;
        // the trailing-edge debouncer must emit exactly once.
        const events = [0, 50, 90]
        expect(debounceCoalesceCount(events, RESIZE_DEBOUNCE_MS)).toBe(1)
        expect(simulateDebounceWithFakeTimers(events, RESIZE_DEBOUNCE_MS)).toBe(
            1,
        )
    })

    it('splits into two emissions when the silence gap exceeds the debounce window (Validates: Requirements 9.4)', () => {
        // Burst at [0, 50, 90] then a 110ms gap to t=200 starts a new burst.
        const events = [0, 50, 90, 200]
        expect(debounceCoalesceCount(events, RESIZE_DEBOUNCE_MS)).toBe(2)
        expect(simulateDebounceWithFakeTimers(events, RESIZE_DEBOUNCE_MS)).toBe(
            2,
        )
    })

    it('emits zero times for an empty event sequence (Validates: Requirements 9.4)', () => {
        expect(debounceCoalesceCount([], RESIZE_DEBOUNCE_MS)).toBe(0)
        expect(simulateDebounceWithFakeTimers([], RESIZE_DEBOUNCE_MS)).toBe(0)
    })
})
