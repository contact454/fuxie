'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface ExamAudioPlayerProps {
    /** Pre-recorded audio URL */
    src?: string | null
    /** Text for TTS fallback */
    transcript?: string | null
    /** Max number of plays allowed (0 = unlimited) */
    maxPlays?: number
    /** Label displayed next to controls */
    label?: string
}

export function ExamAudioPlayer({ src, transcript, maxPlays = 2, label }: ExamAudioPlayerProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [playCount, setPlayCount] = useState(0)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const progressRef = useRef<HTMLDivElement>(null)

    const audioSrc = src ?? (transcript ? `/api/v1/tts?text=${encodeURIComponent(transcript.slice(0, 500))}&speed=0.9` : null)
    const isDisabled = maxPlays > 0 && playCount >= maxPlays

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current = null
            }
        }
    }, [])

    // Reset play count when audio source changes (new task)
    useEffect(() => {
        setPlayCount(0)
        setCurrentTime(0)
        setDuration(0)
        setIsPlaying(false)
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current = null
        }
    }, [audioSrc])

    const togglePlay = useCallback(async () => {
        if (!audioSrc || isDisabled) return

        if (isPlaying && audioRef.current) {
            audioRef.current.pause()
            setIsPlaying(false)
            return
        }

        // Create new audio if needed
        if (!audioRef.current) {
            setIsLoading(true)
            const audio = new Audio(audioSrc)

            audio.onloadedmetadata = () => {
                setDuration(audio.duration)
                setIsLoading(false)
            }
            audio.ontimeupdate = () => setCurrentTime(audio.currentTime)
            audio.onended = () => {
                setIsPlaying(false)
                setPlayCount(prev => prev + 1)
                setCurrentTime(0)
                audioRef.current = null
            }
            audio.onerror = () => {
                setIsLoading(false)
                setIsPlaying(false)
            }

            audioRef.current = audio
        }

        try {
            await audioRef.current.play()
            setIsPlaying(true)
        } catch {
            setIsPlaying(false)
        }
    }, [audioSrc, isPlaying, isDisabled])

    const seekTo = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!audioRef.current || !progressRef.current || isDisabled) return
        const rect = progressRef.current.getBoundingClientRect()
        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
        audioRef.current.currentTime = pct * duration
        setCurrentTime(pct * duration)
    }, [duration, isDisabled])

    const formatTime = (s: number) => {
        const min = Math.floor(s / 60)
        const sec = Math.floor(s % 60)
        return `${min}:${String(sec).padStart(2, '0')}`
    }

    if (!audioSrc) return null

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0

    return (
        <div className={`flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl px-4 py-3 mb-4 ring-1 ring-blue-100 transition-all ${isDisabled ? 'opacity-50' : ''}`}>
            {/* Play/Pause button */}
            <button
                onClick={togglePlay}
                disabled={isDisabled || isLoading}
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all
                    ${isDisabled
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : isPlaying
                            ? 'bg-blue-500 text-white shadow-md shadow-blue-200'
                            : 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md'
                    }`}
            >
                {isLoading ? (
                    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeLinecap="round" />
                    </svg>
                ) : isPlaying ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <rect x="6" y="4" width="4" height="16" rx="1" />
                        <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                ) : (
                    <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                )}
            </button>

            {/* Progress bar + time */}
            <div className="flex-1 min-w-0">
                <div
                    ref={progressRef}
                    onClick={seekTo}
                    className="h-2 bg-blue-100 rounded-full cursor-pointer relative overflow-hidden"
                >
                    <div
                        className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-200"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-blue-400 font-mono">{formatTime(currentTime)}</span>
                    <span className="text-[10px] text-blue-400 font-mono">{duration > 0 ? formatTime(duration) : '--:--'}</span>
                </div>
            </div>

            {/* Play count + label */}
            <div className="flex items-center gap-2 shrink-0">
                {maxPlays > 0 && (
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full
                        ${isDisabled
                            ? 'bg-gray-200 text-gray-500'
                            : 'bg-blue-100 text-blue-600'
                        }`}
                    >
                        🎧 {playCount}/{maxPlays}
                    </span>
                )}
                {label && (
                    <span className="text-xs text-blue-500 font-medium">{label}</span>
                )}
            </div>
        </div>
    )
}
