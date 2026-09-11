'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface UseLevelSwitcherOptions<T> {
    /** Initial CEFR level */
    initialLevel: string
    /** API endpoint template — use `{level}` placeholder. E.g. `/api/v1/reading?level={level}` */
    apiEndpoint: string
    /**
     * Transform raw API response data into your component's data shape.
     * Typed as `any` for backward compatibility with existing skill hubs.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transformData: (data: any) => T
    /** Called when API response is successful after transformation */
    onSuccess?: (data: T, level: string) => void
}

interface UseLevelSwitcherReturn<T> {
    currentLevel: string
    isLevelLoading: boolean
    switchLevel: (level: string) => Promise<void>
    /** Level that failed to load (for retry UI); null when healthy */
    failedLevel: string | null
    /** Human-readable load error; null when healthy */
    error: string | null
    clearError: () => void
}

/**
 * Shared hook for CEFR level switching across skill pages.
 *
 * Handles:
 * - AbortController to cancel in-flight requests when user switches quickly
 * - Loading state management
 * - Race condition prevention (response from stale request is ignored)
 * - Failure rollback to the previous successful level
 * - Retry after HTTP / payload failures
 * - Safe unmount (abort + no post-unmount state updates / onSuccess)
 */
export function useLevelSwitcher<T>({
    initialLevel,
    apiEndpoint,
    transformData,
    onSuccess,
}: UseLevelSwitcherOptions<T>): UseLevelSwitcherReturn<T> {
    const [currentLevel, setCurrentLevel] = useState(initialLevel)
    const [isLevelLoading, setIsLevelLoading] = useState(false)
    const [failedLevel, setFailedLevel] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const abortControllerRef = useRef<AbortController | null>(null)
    /** Last level successfully shown / being requested */
    const activeLevelRef = useRef(initialLevel)
    /** Last level that successfully loaded data (rollback target) */
    const committedLevelRef = useRef(initialLevel)
    const requestSeqRef = useRef(0)
    const mountedRef = useRef(true)

    useEffect(() => {
        mountedRef.current = true
        return () => {
            mountedRef.current = false
            abortControllerRef.current?.abort()
        }
    }, [])

    const clearError = useCallback(() => {
        if (!mountedRef.current) return
        setFailedLevel(null)
        setError(null)
    }, [])

    const switchLevel = useCallback(
        async (level: string) => {
            // Allow switching while a request is in-flight (abort previous).
            if (level === activeLevelRef.current) return

            const previousLevel = committedLevelRef.current
            const requestId = ++requestSeqRef.current

            abortControllerRef.current?.abort()
            const controller = new AbortController()
            abortControllerRef.current = controller

            activeLevelRef.current = level
            if (mountedRef.current) {
                setCurrentLevel(level)
                setIsLevelLoading(true)
                setFailedLevel(null)
                setError(null)
            }

            try {
                const url = apiEndpoint.replace('{level}', encodeURIComponent(level))
                const res = await fetch(url, { signal: controller.signal })

                if (
                    !mountedRef.current ||
                    requestSeqRef.current !== requestId ||
                    activeLevelRef.current !== level
                ) {
                    return
                }

                let payload: unknown = null
                try {
                    payload = await res.json()
                } catch {
                    payload = null
                }

                if (
                    !mountedRef.current ||
                    requestSeqRef.current !== requestId ||
                    activeLevelRef.current !== level
                ) {
                    return
                }

                const successFlag =
                    payload &&
                    typeof payload === 'object' &&
                    'success' in payload &&
                    (payload as { success?: unknown }).success === true

                if (!res.ok || !successFlag) {
                    activeLevelRef.current = previousLevel
                    if (mountedRef.current) {
                        setCurrentLevel(previousLevel)
                        setFailedLevel(level)
                        setError(
                            !res.ok
                                ? `Failed to load level ${level} (${res.status})`
                                : `Failed to load level ${level}`,
                        )
                    }
                    return
                }

                const transformed = transformData(payload)
                if (
                    !mountedRef.current ||
                    requestSeqRef.current !== requestId ||
                    activeLevelRef.current !== level
                ) {
                    return
                }

                committedLevelRef.current = level
                setFailedLevel(null)
                setError(null)
                onSuccess?.(transformed, level)
            } catch (err) {
                // Abort must not surface as an error (switch/unmount)
                if (err instanceof DOMException && err.name === 'AbortError') {
                    return
                }
                if (
                    !mountedRef.current ||
                    requestSeqRef.current !== requestId ||
                    activeLevelRef.current !== level
                ) {
                    return
                }
                console.error('[useLevelSwitcher] fetch error:', err)
                activeLevelRef.current = previousLevel
                setCurrentLevel(previousLevel)
                setFailedLevel(level)
                setError(`Failed to load level ${level}`)
            } finally {
                if (!mountedRef.current) return
                if (requestSeqRef.current === requestId) {
                    setIsLevelLoading(false)
                }
            }
        },
        [apiEndpoint, transformData, onSuccess],
    )

    return {
        currentLevel,
        isLevelLoading,
        switchLevel,
        failedLevel,
        error,
        clearError,
    }
}
