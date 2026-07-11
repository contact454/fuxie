import { useEffect } from 'react'

/**
 * Ref-count for concurrent consumers of `data-gameplay-in-progress`.
 * Multiple active mounts (or Strict Mode remounts) must not clear the
 * body dataset until the last consumer releases it.
 */
let activeConsumers = 0

/** Test-only helper — not part of the public runtime API. */
export function __resetSuppressChromeConsumersForTests() {
    activeConsumers = 0
    if (typeof document !== 'undefined') {
        delete document.body.dataset.gameplayInProgress
    }
}

export function __getSuppressChromeConsumersForTests() {
    return activeConsumers
}

export function useSuppressLearnerMainChrome(isActive: boolean) {
    useEffect(() => {
        if (typeof document === 'undefined') return
        if (!isActive) return

        activeConsumers += 1
        document.body.dataset.gameplayInProgress = 'true'

        return () => {
            activeConsumers = Math.max(0, activeConsumers - 1)
            if (activeConsumers === 0) {
                delete document.body.dataset.gameplayInProgress
            }
        }
    }, [isActive])
}
