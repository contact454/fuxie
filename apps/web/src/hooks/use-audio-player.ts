'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * Fire-and-forget audio playback.
 * Creates a temporary Audio element, plays it, then releases resources.
 * Use for: SFX, pronunciation hints, exercise feedback.
 */
export function playSound(url: string | null | undefined): void {
    if (!url) return
    try {
        const audio = new Audio(url)
        const cleanup = () => {
            audio.removeEventListener('ended', cleanup)
            audio.removeEventListener('error', cleanup)
            audio.src = '' // Release media resource
        }
        audio.addEventListener('ended', cleanup)
        audio.addEventListener('error', cleanup)
        audio.play().catch(() => cleanup())
    } catch {
        /* silent — some browsers block Audio() constructor */
    }
}

/**
 * Full-lifecycle audio hook with state tracking.
 * Manages Audio element creation, event listeners, and cleanup.
 *
 * Use for: components that need play/pause, loading states, error states.
 *
 * @example
 * const { isPlaying, isLoading, hasError, play, stop } = useAudioPlayer(audioUrl)
 */
export function useAudioPlayer(src: string | null | undefined) {
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [hasError, setHasError] = useState(false)

    // Create/cleanup audio element when source changes
    useEffect(() => {
        if (!src) {
            setIsPlaying(false)
            setIsLoading(false)
            setHasError(false)
            return
        }

        setIsPlaying(false)
        setIsLoading(true)
        setHasError(false)

        const audio = new Audio(src)

        const onEnded = () => setIsPlaying(false)
        const onCanPlay = () => setIsLoading(false)
        const onError = () => {
            setHasError(true)
            setIsPlaying(false)
            setIsLoading(false)
        }

        audio.addEventListener('ended', onEnded)
        audio.addEventListener('canplaythrough', onCanPlay)
        audio.addEventListener('error', onError)
        audioRef.current = audio

        return () => {
            audio.pause()
            audio.removeEventListener('ended', onEnded)
            audio.removeEventListener('canplaythrough', onCanPlay)
            audio.removeEventListener('error', onError)
            audio.src = '' // Release media resource
            audioRef.current = null
        }
    }, [src])

    const play = useCallback(async () => {
        if (!audioRef.current || !src || hasError) return

        if (isPlaying) {
            audioRef.current.pause()
            audioRef.current.currentTime = 0
            setIsPlaying(false)
        } else {
            try {
                await audioRef.current.play()
                setIsPlaying(true)
                setIsLoading(false)
            } catch {
                setHasError(true)
            }
        }
    }, [src, isPlaying, hasError])

    const stop = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.currentTime = 0
            setIsPlaying(false)
        }
    }, [])

    return { isPlaying, isLoading, hasError, play, stop }
}
