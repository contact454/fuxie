'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { fx } from '@/components/ui/fuxie-ui'
import { PrimaryCta } from '@fuxie/ui/components'

interface BottomFeedbackProps {
    isCorrect: boolean
    correctAnswer?: string | null
    onContinue: () => void
}

export function BottomFeedback({ isCorrect, correctAnswer, onContinue }: BottomFeedbackProps) {
    const t = useTranslations('Vocabulary')

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
        ? 'border-[#a5e27a] bg-[#d7ffb8]'
        : 'border-[#ffb5b5] bg-[#ffdfe0]'
    const iconClass = isCorrect
        ? 'text-[#58a700] ring-[#58cc02]/25 bg-white'
        : 'text-[#ea2b2b] ring-[#ff4b4b]/25 bg-white'
    const textColor = isCorrect ? 'text-[#58a700]' : 'text-[#ea2b2b]'
    
    const btnCta = isCorrect ? (
        <PrimaryCta
            onClick={onContinue}
            className="bg-[#58cc02] border-[#58cc02] border-b-[#58a700] hover:bg-[#61e002] text-white min-w-[160px] active:translate-y-[2px] active:border-b-[2px]"
        >
            {t('continueBtn')}
        </PrimaryCta>
    ) : (
        <PrimaryCta
            onClick={onContinue}
            className="bg-[#ff4b4b] border-[#ff4b4b] border-b-[#ea2b2b] hover:bg-[#ff6666] text-white min-w-[160px] active:translate-y-[2px] active:border-b-[2px]"
        >
            {t('continueBtn')}
        </PrimaryCta>
    )

    return (
        <div className={fx('fixed bottom-0 left-0 right-0 z-[100] border-t p-6 shadow-[0_-10px_25px_rgba(23,59,86,0.08)] transition-transform animate-in slide-in-from-bottom-full duration-150', surfaceClass)}>
            <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-4">
                <div className="flex items-center gap-4">
                    <div className={fx('flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm ring-1', iconClass)}>
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
                            {isCorrect ? t('feedbackCorrect') : t('feedbackIncorrect')}
                        </h3>
                        {!isCorrect && correctAnswer && (
                            <p className="text-base font-semibold text-slate-700 mt-1">
                                {t('correctAnswerLabel')} <span className="font-extrabold text-[#ea2b2b] underline decoration-wavy decoration-1">{correctAnswer}</span>
                            </p>
                        )}
                    </div>
                </div>
                
                <div className="sm:self-center">
                    {btnCta}
                </div>
            </div>
        </div>
    )
}
