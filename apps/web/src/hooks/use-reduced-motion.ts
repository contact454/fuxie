'use client'

import { useEffect, useState } from 'react'

/**
 * Returns whether the user prefers reduced motion.
 *
 * - Reflects the `prefers-reduced-motion: reduce` media query.
 * - SSR-safe: initial value is always `false` (no `window` access during render).
 * - Subscribes to `MediaQueryList` change events and cleans up on unmount.
 *
 * Implementation matches design §G of the gamified-ui-asset-rollout spec.
 *
 * Validates: Requirements 13.2, 13.6
 */
export function useReducedMotion(): boolean {
    const [reduced, setReduced] = useState<boolean>(false)

    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
            return
        }

        const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
        const update = () => setReduced(mql.matches)

        // Sync state with current media query value on mount.
        update()

        mql.addEventListener('change', update)
        return () => mql.removeEventListener('change', update)
    }, [])

    return reduced
}
