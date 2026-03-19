'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface UseLevelSwitcherOptions<T> {
    /** Initial CEFR level */
    initialLevel: string
    /** API endpoint template — use `{level}` placeholder. E.g. `/api/v1/reading?level={level}` */
    apiEndpoint: string
    /** Transform raw API response data into your component's data shape */
    transformData: (data: any) => T
    /** Called when API response is successful after transformation */
    onSuccess?: (data: T, level: string) => void
}

interface UseLevelSwitcherReturn<T> {
    currentLevel: string
    isLevelLoading: boolean
    switchLevel: (level: string) => Promise<void>
}

/**
 * Shared hook for CEFR level switching across skill pages.
 *
 * Handles:
 * - AbortController to cancel in-flight requests when user switches quickly
 * - Loading state management
 * - Race condition prevention (response from stale request is ignored)
 *
 * Usage:
 *   const { currentLevel, isLevelLoading, switchLevel } = useLevelSwitcher({
 *     initialLevel: 'A1',
 *     apiEndpoint: '/api/v1/reading?level={level}',
 *     transformData: (data) => data.teile,
 *     onSuccess: (teile, level) => { setTeile(teile); ... },
 *   })
 */
export function useLevelSwitcher<T>({
    initialLevel,
    apiEndpoint,
    transformData,
    onSuccess,
}: UseLevelSwitcherOptions<T>): UseLevelSwitcherReturn<T> {
    const [currentLevel, setCurrentLevel] = useState(initialLevel)
    const [isLevelLoading, setIsLevelLoading] = useState(false)
    const abortControllerRef = useRef<AbortController | null>(null)
    const activeLevelRef = useRef(initialLevel)

    // Cleanup abort controller on unmount
    useEffect(() => {
        return () => {
            abortControllerRef.current?.abort()
        }
    }, [])

    const switchLevel = useCallback(
        async (level: string) => {
            if (level === activeLevelRef.current || isLevelLoading) return

            // Abort any in-flight request
            abortControllerRef.current?.abort()
            const controller = new AbortController()
            abortControllerRef.current = controller

            // Update immediately for UI responsiveness
            activeLevelRef.current = level
            setCurrentLevel(level)
            setIsLevelLoading(true)

            try {
                const url = apiEndpoint.replace('{level}', encodeURIComponent(level))
                const res = await fetch(url, { signal: controller.signal })
                const data = await res.json()

                // Guard: user already switched to a different level
                if (activeLevelRef.current !== level) return

                if (data.success !== false) {
                    const transformed = transformData(data)
                    onSuccess?.(transformed, level)
                }
            } catch (err) {
                // Ignore aborted requests
                if (err instanceof DOMException && err.name === 'AbortError') return
                console.error('[useLevelSwitcher] fetch error:', err)
            } finally {
                if (activeLevelRef.current === level) {
                    setIsLevelLoading(false)
                }
            }
        },
        [apiEndpoint, transformData, onSuccess, isLevelLoading]
    )

    return { currentLevel, isLevelLoading, switchLevel }
}
