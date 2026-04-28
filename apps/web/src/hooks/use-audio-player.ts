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
            audio.pause()
            audio.currentTime = 0
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
    const isMountedRef = useRef(true)
    const playTokenRef = useRef(0)
    const lastPlayTimeRef = useRef(0)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [hasError, setHasError] = useState(false)

    const cleanupAudio = useCallback(() => {
        if (!audioRef.current) return
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        audioRef.current.src = ''
        audioRef.current = null
    }, [])

    useEffect(() => {
        return () => {
            isMountedRef.current = false
            cleanupAudio()
        }
    }, [cleanupAudio])

    // Reset state when the source changes, but do not fetch audio until play.
    useEffect(() => {
        playTokenRef.current += 1
        cleanupAudio()
        setIsPlaying(false)
        setIsLoading(false)
        setHasError(false)
    }, [src, cleanupAudio])

    const createAudio = useCallback(() => {
        if (!src) return null

        const audio = new Audio()
        audio.preload = 'none'
        audio.src = src
        const updateIfCurrent = (fn: () => void) => {
            if (!isMountedRef.current || audioRef.current !== audio) return
            fn()
        }

        const onEnded = () => updateIfCurrent(() => setIsPlaying(false))
        const onPause = () => updateIfCurrent(() => setIsPlaying(false))
        const onCanPlay = () => updateIfCurrent(() => setIsLoading(false))
        const onError = () => {
            updateIfCurrent(() => {
                setHasError(true)
                setIsPlaying(false)
                setIsLoading(false)
            })
        }

        audio.addEventListener('ended', onEnded)
        audio.addEventListener('pause', onPause)
        audio.addEventListener('canplaythrough', onCanPlay)
        audio.addEventListener('error', onError)
        audioRef.current = audio

        return audio
    }, [src])

    const play = useCallback(async () => {
        if (!src || hasError) return

        // Debounce rapid taps (300ms) to prevent main thread blocking on mobile
        const now = Date.now()
        if (now - lastPlayTimeRef.current < 300) return
        lastPlayTimeRef.current = now

        if (isPlaying) {
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current.currentTime = 0
            }
            setIsPlaying(false)
        } else {
            const audio = audioRef.current ?? createAudio()
            if (!audio) return

            const playToken = playTokenRef.current + 1
            playTokenRef.current = playToken
            setIsLoading(true)
            try {
                await audio.play()
                if (!isMountedRef.current || playTokenRef.current !== playToken || audioRef.current !== audio) return
                setIsPlaying(true)
                setIsLoading(false)
            } catch {
                if (!isMountedRef.current || playTokenRef.current !== playToken || audioRef.current !== audio) return
                setHasError(true)
                setIsLoading(false)
            }
        }
    }, [src, isPlaying, hasError, createAudio])

    const stop = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.currentTime = 0
            setIsPlaying(false)
        }
    }, [])

    return { isPlaying, isLoading, hasError, play, stop }
}
