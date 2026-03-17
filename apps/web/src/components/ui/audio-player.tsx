'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface AudioPlayerProps {
    /** Pre-existing audio URL (e.g., from database) */
    src?: string | null
    /** German text to speak on-demand via TTS if no src */
    text?: string | null
    /** Speaking speed (0.5–2.0) */
    speed?: number
    size?: 'sm' | 'md' | 'lg'
    label?: string
    className?: string
}

/**
 * Mini audio player for vocabulary pronunciation.
 * Supports two modes:
 * 1. Pre-existing audio URL (src prop)
 * 2. On-demand TTS via /api/v1/tts (text prop)
 */
export function AudioPlayer({ src, text, speed = 1.0, size = 'md', label, className = '' }: AudioPlayerProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isLoadingAudio, setIsLoadingAudio] = useState(false)
    const [hasError, setHasError] = useState(false)

    const sizeConfig = {
        sm: { button: 'w-8 h-8', icon: 'w-4 h-4', text: 'text-xs' },
        md: { button: 'w-10 h-10', icon: 'w-5 h-5', text: 'text-sm' },
        lg: { button: 'w-12 h-12', icon: 'w-6 h-6', text: 'text-base' },
    }

    const config = sizeConfig[size]

    // Determine the audio source URL
    const audioSrc = src ?? (text ? `/api/v1/tts?text=${encodeURIComponent(text)}&speed=${speed}` : null)

    // Reset audio element when source changes (e.g., new flashcard word)
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current = null
        }
        setIsPlaying(false)
        setIsLoadingAudio(false)
        setHasError(false)
    }, [audioSrc])

    const handlePlay = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation() // Prevent flashcard flip
        if (!audioSrc || hasError) return

        if (!audioRef.current) {
            setIsLoadingAudio(true)
            audioRef.current = new Audio(audioSrc)
            audioRef.current.addEventListener('ended', () => setIsPlaying(false))
            audioRef.current.addEventListener('canplaythrough', () => setIsLoadingAudio(false))
            audioRef.current.addEventListener('error', () => {
                setHasError(true)
                setIsPlaying(false)
                setIsLoadingAudio(false)
            })
        }

        if (isPlaying) {
            audioRef.current.pause()
            audioRef.current.currentTime = 0
            setIsPlaying(false)
        } else {
            try {
                await audioRef.current.play()
                setIsPlaying(true)
                setIsLoadingAudio(false)
            } catch {
                setHasError(true)
            }
        }
    }, [audioSrc, isPlaying, hasError])

    // Show nothing if no audio source available
    if (!audioSrc) return null

    return (
        <button
            onClick={handlePlay}
            disabled={hasError}
            className={`
                inline-flex items-center gap-1.5 rounded-full
                transition-all duration-200 group
                ${hasError
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : isPlaying
                        ? 'bg-fuxie-primary/15 text-fuxie-primary scale-105'
                        : isLoadingAudio
                            ? 'bg-fuxie-primary/10 text-fuxie-primary animate-pulse'
                            : 'bg-gray-100 text-gray-600 hover:bg-fuxie-primary/10 hover:text-fuxie-primary active:scale-95'
                }
                ${label ? 'px-3 py-1.5' : config.button}
                ${label ? '' : 'items-center justify-center'}
                ${className}
            `}
            aria-label={hasError ? 'Audio nicht verfügbar' : isPlaying ? 'Audio stoppen' : 'Audio abspielen'}
        >
            {/* Speaker icon */}
            <svg
                className={`${config.icon} ${isPlaying ? 'animate-pulse' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
            >
                {isPlaying ? (
                    <>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H2v6h4l5 4V5z" />
                    </>
                ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M11 5L6 9H2v6h4l5 4V5z" />
                )}
            </svg>

            {label && (
                <span className={config.text}>{label}</span>
            )}
        </button>
    )
}
