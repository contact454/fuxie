'use client'

import { useEffect } from 'react'
import { fuxieButtonClass, fx } from '@/components/ui/fuxie-ui'

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

    const surfaceClass = isCorrect
        ? 'border-[#2EC4B6]/30 bg-[#EAFBF8]'
        : 'border-red-200 bg-red-50'
    const iconClass = isCorrect
        ? 'text-text-success ring-[#2EC4B6]/25'
        : 'text-red-600 ring-red-200'
    const textColor = isCorrect ? 'text-text-success' : 'text-red-600'
    const btnClass = isCorrect
        ? fuxieButtonClass('primary', 'lg', 'min-w-[150px]')
        : 'inline-flex min-w-[150px] items-center justify-center gap-2 rounded-xl bg-red-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-900/10 transition-all hover:-translate-y-0.5 hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300'
    
    return (
        <div className={fx('fixed bottom-0 left-0 right-0 z-[100] border-t p-4 shadow-[0_-18px_45px_rgba(60,120,168,0.12)] transition-transform animate-in slide-in-from-bottom-full', surfaceClass)}>
            <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <div className={fx('flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1', iconClass)}>
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
                            {isCorrect ? 'Đúng!' : 'Chưa đúng!'}
                        </h3>
                        {!isCorrect && correctAnswer && (
                            <p className={`text-base font-medium ${textColor} mt-1`}>
                                Đáp án đúng: <span className="font-bold">{correctAnswer}</span>
                            </p>
                        )}
                    </div>
                </div>
                
                <button
                    onClick={onContinue}
                    className={btnClass}
                >
                    Tiếp Bước
                </button>
            </div>
        </div>
    )
}
