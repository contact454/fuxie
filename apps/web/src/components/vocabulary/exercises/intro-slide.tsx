'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { playSound } from '@/hooks/use-audio-player'

export interface IntroSlideProps {
    word: string
    meaningVi: string
    imageUrl: string | null
    audioUrl: string | null
    onContinue: () => void
}

export function IntroSlide({ word, meaningVi, imageUrl, audioUrl, onContinue }: IntroSlideProps) {
    // Auto play audio when introducing the word
    useEffect(() => {
        if (audioUrl) {
            playSound(audioUrl)
        }
        
        // Push Enter to continue
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault()
                onContinue()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [audioUrl, onContinue])

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 animate-fade-in-up">
            <h2 className="text-xl font-bold text-[#FF6B35] mb-8 uppercase tracking-wider text-center">
                Neues Wort! (Từ mới)
            </h2>

            <div className="bg-white rounded-3xl p-8 border-2 border-orange-100 shadow-xl shadow-orange-50 max-w-sm w-full text-center hover:scale-[1.02] transition-transform">
                {imageUrl ? (
                    <div className="mb-6 flex justify-center">
                        <Image
                            src={imageUrl}
                            alt={word}
                            width={220}
                            height={220}
                            className="rounded-2xl object-cover shadow-sm border border-gray-100"
                        />
                    </div>
                ) : (
                    <div className="w-full aspect-square bg-blue-50 rounded-2xl mb-6 flex items-center justify-center text-6xl">
                        📖
                    </div>
                )}

                {audioUrl && (
                    <button
                        onClick={() => playSound(audioUrl)}
                        className="mb-4 w-14 h-14 rounded-full bg-[#004E89] text-white flex items-center justify-center mx-auto shadow-md hover:scale-110 hover:bg-blue-800 transition-all"
                    >
                        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                        </svg>
                    </button>
                )}

                <p className="text-4xl font-black text-gray-900 mb-2">{word}</p>
                <p className="text-lg font-semibold text-gray-500">{meaningVi}</p>
            </div>

            <button
                onClick={onContinue}
                className="mt-12 w-full max-w-sm py-4 rounded-2xl bg-[#004E89] text-white font-bold text-lg hover:bg-blue-800 transition-colors shadow-lg shadow-blue-200"
            >
                Weiter (Tiếp tục)
            </button>
        </div>
    )
}
