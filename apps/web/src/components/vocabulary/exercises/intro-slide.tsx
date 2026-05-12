'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { playSound } from '@/hooks/use-audio-player'
import { FuxieBadge, FuxiePanel, fuxieButtonClass } from '@/components/ui/fuxie-ui'

export interface IntroSlideProps {
    word: string
    meaningNative: string
    imageUrl: string | null
    audioUrl: string | null
    onContinue: () => void
}

export function IntroSlide({ word, meaningNative, imageUrl, audioUrl, onContinue }: IntroSlideProps) {
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
            <FuxieBadge tone="brand" className="mb-6">
                Từ mới!
            </FuxieBadge>

            <FuxiePanel variant="hero" className="max-w-sm w-full p-8 text-center transition-transform hover:scale-[1.02]">
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
                    <div className="mb-6 flex aspect-square w-full items-center justify-center rounded-2xl bg-[#F3FBFF] text-6xl ring-1 ring-[#60A8E4]/15">
                        📖
                    </div>
                )}

                {audioUrl && (
                    <button
                        onClick={() => playSound(audioUrl)}
                        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#60A8E4] text-white shadow-lg shadow-sky-900/15 transition-all hover:scale-110 hover:bg-[#3C78A8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A8E4]/40"
                    >
                        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                        </svg>
                    </button>
                )}

                <p className="text-4xl font-black text-gray-900 mb-2">{word}</p>
                <p className="text-lg font-semibold text-gray-500">{meaningNative}</p>
            </FuxiePanel>

            <button
                onClick={onContinue}
                className={fuxieButtonClass('primary', 'lg', 'mt-12 w-full max-w-sm rounded-2xl py-4 text-lg')}
            >
                Tiếp tục
            </button>
        </div>
    )
}
