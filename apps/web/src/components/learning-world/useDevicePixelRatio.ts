'use client'

import { useEffect, useState } from 'react'

/**
 * Pure helper: clamps a number to a finite, positive value, falling back to `1`
 * for `NaN`, `±Infinity`, non-numeric, zero, or negative inputs.
 *
 * Used to defensively normalize `devicePixelRatio` and CSS dimensions before
 * sizing the canvas backing store (see Requirement 9.1, 9.5; design §"React layer").
 */
function toFiniteOrOne(x: unknown): number {
    return typeof x === 'number' && Number.isFinite(x) && x > 0 ? x : 1
}

/**
 * Backing-store size in device pixels for a `<canvas>` element.
 *
 * Always integer, always at least `1` per dimension (a `0`-sized backing store
 * would silently fail to rasterize on some browsers).
 */
export interface BackingStoreSize {
    readonly width: number
    readonly height: number
}

/**
 * Pure helper that maps CSS dimensions and a device pixel ratio onto integer
 * backing-store dimensions, capped at `dpr = 3` to bound memory growth on
 * extreme-DPI displays (Requirement 9.1).
 *
 * Defensive against `NaN`, `±Infinity`, `undefined`, zero, and negative inputs:
 * any non-finite or non-positive value is coerced to `1` via `toFiniteOrOne`.
 *
 * - `width  = max(1, floor(cssWidth  × min(toFiniteOrOne(dpr), 3)))`
 * - `height = max(1, floor(cssHeight × min(toFiniteOrOne(dpr), 3)))`
 *
 * Validates: Requirements 9.1, 9.5
 */
export function computeBackingStoreSize(
    cssWidth: number,
    cssHeight: number,
    dpr: number,
): BackingStoreSize {
    const safeDpr = Math.min(toFiniteOrOne(dpr), 3)
    const safeCssW = toFiniteOrOne(cssWidth)
    const safeCssH = toFiniteOrOne(cssHeight)
    return {
        width: Math.max(1, Math.floor(safeCssW * safeDpr)),
        height: Math.max(1, Math.floor(safeCssH * safeDpr)),
    }
}

/**
 * Reads the current device pixel ratio, capped at `3` to bound canvas backing
 * store memory on high-DPI displays (Requirement 9.1).
 *
 * - SSR-safe: returns `1` during server render and on hosts without `window`.
 * - Reacts to monitor migration via `matchMedia('(resolution: <current>dppx)')`
 *   change events, which fire when the browser detects a DPR change (e.g. the
 *   window is dragged to a different-density display).
 * - If `matchMedia` is unavailable or throws, the hook keeps the last known
 *   value and degrades gracefully (design §"React-layer failure paths":
 *   `useDevicePixelRatio` returns `1` when `matchMedia` is unavailable).
 *
 * Validates: Requirements 9.1, 9.5
 */
export function useDevicePixelRatio(): number {
    const [dpr, setDpr] = useState<number>(1)

    useEffect(() => {
        if (typeof window === 'undefined') {
            return
        }

        let cancelled = false
        let activeMql: MediaQueryList | null = null
        let activeListener: (() => void) | null = null

        const readDpr = (): number => {
            const raw = typeof window.devicePixelRatio === 'number' ? window.devicePixelRatio : 1
            const safe = Number.isFinite(raw) && raw > 0 ? raw : 1
            return Math.min(safe, 3)
        }

        const teardown = () => {
            if (activeMql && activeListener) {
                activeMql.removeEventListener('change', activeListener)
            }
            activeMql = null
            activeListener = null
        }

        const subscribe = (current: number) => {
            if (typeof window.matchMedia !== 'function') {
                return
            }
            let mql: MediaQueryList
            try {
                // Listen for DPR changes (monitor migration, browser zoom shifting
                // pixel density). When this query stops matching, the live DPR is
                // different from `current`, so we re-read and re-subscribe at the
                // new value.
                mql = window.matchMedia(`(resolution: ${current}dppx)`)
            } catch {
                return
            }

            const onChange = () => {
                if (cancelled) return
                const next = readDpr()
                setDpr(next)
                teardown()
                subscribe(next)
            }

            mql.addEventListener('change', onChange)
            activeMql = mql
            activeListener = onChange
        }

        const initial = readDpr()
        setDpr(initial)
        subscribe(initial)

        return () => {
            cancelled = true
            teardown()
        }
    }, [])

    return dpr
}
