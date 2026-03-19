'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * Shared timer hook for vocabulary exercises.
 * Handles start, stop, reset with proper cleanup to prevent interval leaks.
 *
 * Usage:
 *   const { timer, stopTimer, resetTimer } = useExerciseTimer()
 *   // timer auto-starts on mount
 *   // call stopTimer() when exercise completes
 *   // call resetTimer() in onRetry
 */
export function useExerciseTimer() {
    const [timer, setTimer] = useState(0)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const startTimer = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current)
        timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
    }, [])

    const stopTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
        }
    }, [])

    const resetTimer = useCallback(() => {
        stopTimer()
        setTimer(0)
        startTimer()
    }, [stopTimer, startTimer])

    // Auto-start on mount, auto-cleanup on unmount
    useEffect(() => {
        startTimer()
        return () => stopTimer()
    }, [startTimer, stopTimer])

    return { timer, stopTimer, resetTimer }
}
