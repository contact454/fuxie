import { useEffect, useState } from 'react'

/**
 * Reduced-motion preference resolved from a `MediaQueryList`-like reader.
 *
 * - `'reduce'`: the user prefers reduced motion, OR the preference could not
 *   be read (default-safe per Requirement 5.6).
 * - `'no-preference'`: the user has explicitly opted out of reduced motion
 *   (the underlying media query reported `matches === false`).
 */
export type ReducedMotionPreference = 'reduce' | 'no-preference'

/**
 * Pure helper that resolves a `ReducedMotionPreference` from a reader.
 *
 * The reader is any zero-arg function that returns a `MediaQueryList`-like
 * object exposing a boolean `.matches` property, or `null`/`undefined`, or
 * which throws.
 *
 * Resolution rules (default-safe — Requirement 5.6):
 *   - reader throws                       → `'reduce'`
 *   - reader returns `null` / `undefined` → `'reduce'`
 *   - reader returns `{ matches: false }` → `'no-preference'`
 *   - reader returns anything else        → `'reduce'`
 *
 * The helper is intentionally DOM-free so it can be unit-tested without
 * jsdom or a browser.
 */
export function resolveReducedMotionPreference(
  reader: () => { matches: boolean } | null | undefined,
): ReducedMotionPreference {
  try {
    const result = reader()
    if (result === null || result === undefined) {
      return 'reduce'
    }
    if (result.matches === false) {
      return 'no-preference'
    }
    return 'reduce'
  } catch {
    return 'reduce'
  }
}

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

/**
 * React hook that subscribes to the user's `prefers-reduced-motion` media
 * query and returns the current `ReducedMotionPreference`.
 *
 * SSR-safe: during server rendering and the first client render before the
 * effect runs, the hook returns `'reduce'` so motion-sensitive users never
 * see motion as a flash-of-unstyled-content. The first effect synchronously
 * re-reads the live preference and updates state if it differs.
 *
 * Defaults to `'reduce'` if `window.matchMedia` is unavailable or throws
 * (Requirement 5.6).
 */
export function useReducedMotion(): ReducedMotionPreference {
  const [preference, setPreference] = useState<ReducedMotionPreference>('reduce')

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const matchMedia = window.matchMedia
    if (typeof matchMedia !== 'function') {
      setPreference('reduce')
      return
    }

    let mediaQueryList: MediaQueryList | null = null
    try {
      mediaQueryList = matchMedia.call(window, REDUCED_MOTION_QUERY)
    } catch {
      setPreference('reduce')
      return
    }

    const mql = mediaQueryList
    if (mql === null || mql === undefined) {
      setPreference('reduce')
      return
    }

    setPreference(resolveReducedMotionPreference(() => mql))

    const handleChange = (): void => {
      setPreference(resolveReducedMotionPreference(() => mql))
    }

    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', handleChange)
      return () => {
        mql.removeEventListener('change', handleChange)
      }
    }

    // Legacy Safari fallback: addListener / removeListener.
    type LegacyMediaQueryList = MediaQueryList & {
      addListener?: (listener: (event: MediaQueryListEvent) => void) => void
      removeListener?: (listener: (event: MediaQueryListEvent) => void) => void
    }
    const legacy = mql as LegacyMediaQueryList
    if (typeof legacy.addListener === 'function') {
      legacy.addListener(handleChange)
      return () => {
        legacy.removeListener?.(handleChange)
      }
    }

    return undefined
  }, [])

  return preference
}
