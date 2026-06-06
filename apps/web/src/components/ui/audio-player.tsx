'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAudioPlayer } from '@/hooks/use-audio-player'
import { cancelBrowserTTS, speakWithBrowserTTS } from '@/lib/audio/browser-tts'

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

const SIZE_CONFIG = {
    sm: { button: 'w-11 h-11 sm:w-8 sm:h-8', icon: 'w-5 h-5 sm:w-4 sm:h-4', text: 'text-xs' },
    md: { button: 'w-12 h-12 sm:w-10 sm:h-10', icon: 'w-6 h-6 sm:w-5 sm:h-5', text: 'text-sm' },
    lg: { button: 'w-14 h-14 sm:w-12 sm:h-12', icon: 'w-7 h-7 sm:w-6 sm:h-6', text: 'text-base' },
}

/**
 * Mini audio player for vocabulary pronunciation.
 * Supports two modes:
 * 1. Pre-existing audio URL (src prop)
 * 2. Browser SpeechSynthesis fallback (text prop)
 */
export function AudioPlayer({ src, text, speed = 1.0, size = 'md', label, className = '' }: AudioPlayerProps) {
    const config = SIZE_CONFIG[size]
    const hasAudioFile = !!src
    const hasBrowserFallback = !src && !!text
    const [isBrowserPlaying, setIsBrowserPlaying] = useState(false)
    const [browserHasError, setBrowserHasError] = useState(false)
    const isMountedRef = useRef(true)

    const browserRate = useMemo(() => Math.min(2, Math.max(0.5, speed)), [speed])

    // Use shared audio lifecycle hook only for real audio files.
    const audioSrc = hasAudioFile ? src : null
    const audio = useAudioPlayer(audioSrc)

    useEffect(() => {
        return () => {
            isMountedRef.current = false
            cancelBrowserTTS()
        }
    }, [])

    useEffect(() => {
        setBrowserHasError(false)
        setIsBrowserPlaying(false)
    }, [text, browserRate])

    const isPlaying = hasAudioFile ? audio.isPlaying : isBrowserPlaying
    const isLoading = hasAudioFile ? audio.isLoading : false
    const hasError = hasAudioFile ? audio.hasError : browserHasError

    const handlePlay = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation() // Prevent flashcard flip
        if (hasAudioFile) {
            await audio.play()
            return
        }

        if (!text) return

        if (isBrowserPlaying) {
            cancelBrowserTTS()
            setIsBrowserPlaying(false)
            return
        }

        setBrowserHasError(false)
        setIsBrowserPlaying(true)
        const started = speakWithBrowserTTS(text, {
            rate: browserRate,
            onEnd: () => {
                if (isMountedRef.current) setIsBrowserPlaying(false)
            },
        })
        if (!started) {
            setBrowserHasError(true)
            setIsBrowserPlaying(false)
        }
    }, [audio, browserRate, hasAudioFile, isBrowserPlaying, text])

    // Show nothing if no audio source available
    if (!hasAudioFile && !hasBrowserFallback) return null

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
                        : isLoading
                            ? 'bg-fuxie-primary/10 text-fuxie-primary animate-pulse'
                            : 'bg-gray-100 text-gray-600 hover:bg-fuxie-primary/10 hover:text-fuxie-primary active:scale-95'
                }
                ${label ? 'px-3 py-1.5' : config.button}
                ${label ? '' : 'items-center justify-center'}
                ${className}
            `}
            aria-label={hasError ? 'Không phát được audio / Audio-Wiedergabe fehlgeschlagen' : isPlaying ? 'Dừng audio / Audio stoppen' : 'Phát audio / Audio abspielen'}
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
