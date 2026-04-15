'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface VoiceInputProps {
    onTranscript: (text: string) => void
    disabled?: boolean
}

/* eslint-disable @typescript-eslint/no-explicit-any */
// SpeechRecognition types are not well-defined in all TS versions.
// We use `any` here because the Web Speech API is vendor-prefixed.

function getSpeechRecognitionConstructor(): (new () => any) | undefined {
    if (typeof window === 'undefined') return undefined
    return (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
}

export function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
    const [isListening, setIsListening] = useState(false)
    const [interimText, setInterimText] = useState('')
    const [isSupported, setIsSupported] = useState(false)
    const recognitionRef = useRef<any>(null)

    useEffect(() => {
        setIsSupported(!!getSpeechRecognitionConstructor())
    }, [])

    const stopListening = useCallback(() => {
        recognitionRef.current?.stop()
        setIsListening(false)
        setInterimText('')
    }, [])

    useEffect(() => {
        return () => {
            recognitionRef.current?.stop()
        }
    }, [])

    const startListening = useCallback(() => {
        const SpeechRecognition = getSpeechRecognitionConstructor()
        if (!SpeechRecognition || disabled) return

        const recognition = new SpeechRecognition()
        recognition.lang = 'de-DE'
        recognition.interimResults = true
        recognition.continuous = false
        recognition.maxAlternatives = 1

        recognition.onstart = () => setIsListening(true)

        recognition.onresult = (event: any) => {
            let interim = ''
            let final = ''

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript
                if (event.results[i].isFinal) {
                    final += transcript
                } else {
                    interim += transcript
                }
            }

            setInterimText(interim)
            if (final) {
                onTranscript(final)
                setInterimText('')
            }
        }

        recognition.onerror = (event: any) => {
            console.error('[VoiceInput] Error:', event.error)
            setIsListening(false)
            setInterimText('')
        }

        recognition.onend = () => {
            setIsListening(false)
        }

        recognitionRef.current = recognition
        recognition.start()
    }, [onTranscript, disabled])

    // Don't render if browser doesn't support Speech Recognition
    if (!isSupported) return null

    return (
        <div className="relative">
            <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                disabled={disabled}
                className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0
                    transition-all duration-200
                    ${isListening
                        ? 'bg-red-500 text-white shadow-lg shadow-red-200 scale-110'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                    }
                    disabled:opacity-40 disabled:cursor-not-allowed`}
                title={isListening ? 'Dừng nghe' : 'Nhập bằng giọng nói (Deutsch)'}
            >
                {isListening ? (
                    <div className="relative">
                        {/* Pulse rings */}
                        <div className="absolute inset-0 w-full h-full rounded-full bg-red-400 animate-ping opacity-30" />
                        <svg className="w-5 h-5 relative z-10" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="6" width="12" height="12" rx="2" />
                        </svg>
                    </div>
                ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="22" />
                    </svg>
                )}
            </button>

            {/* Interim transcript tooltip */}
            {interimText && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                    px-3 py-1.5 rounded-lg bg-gray-800 text-white text-xs
                    whitespace-nowrap max-w-[200px] truncate shadow-lg
                    animate-[fadeIn_0.15s_ease-out]">
                    {interimText}
                    <div className="absolute top-full left-1/2 -translate-x-1/2
                        border-4 border-transparent border-t-gray-800" />
                </div>
            )}
        </div>
    )
}
