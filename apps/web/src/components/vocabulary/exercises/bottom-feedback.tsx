'use client'

import { useEffect } from 'react'
import { playSound } from '@/hooks/use-audio-player'

interface BottomFeedbackProps {
    isCorrect: boolean
    correctAnswer?: string | null
    onContinue: () => void
}

export function BottomFeedback({ isCorrect, correctAnswer, onContinue }: BottomFeedbackProps) {
    // Play SFX on mount
    useEffect(() => {
        if (isCorrect) {
            // Placeholder: playSound('/sounds/correct.mp3')
        } else {
            // Placeholder: playSound('/sounds/wrong.mp3')
        }
        
        // Handle Enter key to continue
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault()
                onContinue()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isCorrect, onContinue])

    const bgColor = isCorrect ? 'bg-[#d7ffb8]' : 'bg-[#ffdfe0]'
    const textColor = isCorrect ? 'text-[#58a700]' : 'text-[#ea2b2b]'
    const btnColor = isCorrect ? 'bg-[#58a700] hover:bg-[#468500]' : 'bg-[#ea2b2b] hover:bg-[#c42525]'
    
    return (
        <div className={`fixed bottom-0 left-0 right-0 p-4 border-t-2 ${isCorrect ? 'border-[#c6f3a3]' : 'border-[#ffc7c9]'} ${bgColor} z-[100] transition-transform animate-in slide-in-from-bottom-full`}>
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center bg-white shadow-sm ${textColor}`}>
                        {isCorrect ? (
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                    </div>
                    <div>
                        <h3 className={`text-2xl font-black ${textColor}`}>
                            {isCorrect ? 'Richtig!' : 'Falsch!'}
                        </h3>
                        {!isCorrect && correctAnswer && (
                            <p className={`text-base font-medium ${textColor} mt-1`}>
                                Richtige Antwort: <span className="font-bold">{correctAnswer}</span>
                            </p>
                        )}
                    </div>
                </div>
                
                <button
                    onClick={onContinue}
                    className={`px-8 py-3.5 rounded-2xl text-white font-bold text-lg shadow-sm transition-all focus:outline-none focus:ring-4 ${btnColor} focus:ring-opacity-50 min-w-[150px]`}
                >
                    Weiter
                </button>
            </div>
        </div>
    )
}
