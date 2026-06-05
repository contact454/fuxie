import React, { useState } from 'react'
import { Headphones } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { SessionItem } from '@/lib/session/builder'
import type { VocabExerciseData, GrammarExerciseData } from '@/lib/session/types'

export function MultipleChoice({ 
    item, 
    onNext,
    stepIndex = 0,
    totalSteps = 8
}: { 
    item: SessionItem, 
    onNext: (correct: boolean) => void,
    stepIndex?: number,
    totalSteps?: number
}) {
    const t = useTranslations('UI')
    const isGrammar = item.type === 'GRAMMAR'
    const grammarData = item.data as GrammarExerciseData
    const vocabData = item.data as VocabExerciseData
    
    let options: string[] = []
    let correctIndex = 0

    if (isGrammar) {
        options = grammarData.options || []
        correctIndex = grammarData.correctIndex ?? 0
    } else if (vocabData.options && vocabData.options.length > 0) {
        options = vocabData.options
        correctIndex = vocabData.correctIndex ?? 0
    } else {
        // Fallback deterministic for vocabulary:
        // correct answer = vocabData.meaning (Vietnamese meaning)
        const correctWord = vocabData.meaning || 'học'

        // Deterministic list of fallback distractors (Vietnamese translations of common items)
        const fallbackDistractors = [
            'quả táo', 'quả chuối', 'sữa', 'bánh mì', 
            'nước', 'nước hoa quả', 'trà', 'cà phê', 
            'quyển sách', 'cái bút', 'trường học', 'ngôi nhà',
            'quả cam', 'xe đạp', 'bóng đá', 'bức tranh'
        ]

        // Filter out correct word to avoid duplicates
        const filtered = fallbackDistractors.filter(
            d => d.toLowerCase() !== correctWord.toLowerCase() && 
                 !d.toLowerCase().includes(correctWord.toLowerCase())
        )

        // Select 3 distractors deterministically based on term characters
        const seed = vocabData.term.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        
        const selectedDistractors: string[] = []
        let offset = 0
        while (selectedDistractors.length < 3 && offset < filtered.length) {
            const candidate = filtered[(seed + offset) % filtered.length]
            if (candidate && !selectedDistractors.includes(candidate)) {
                selectedDistractors.push(candidate)
            }
            offset++
        }
        while (selectedDistractors.length < 3) {
            selectedDistractors.push('bánh mì')
        }

        // Determine correct index deterministically
        correctIndex = seed % 4

        options = []
        let distractorIdx = 0
        for (let i = 0; i < 4; i++) {
            if (i === correctIndex) {
                options.push(correctWord)
            } else {
                options.push(selectedDistractors[distractorIdx++] ?? 'bánh mì')
            }
        }
    }

    const hasAudio = !isGrammar && !!vocabData.audioUrl

    const audioRef = React.useRef<HTMLAudioElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)

    // Autoplay audio on mount or when the item id / audio source changes
    React.useEffect(() => {
        if (hasAudio && audioRef.current) {
            audioRef.current.currentTime = 0
            setIsPlaying(false)
            
            const playPromise = audioRef.current.play()
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        setIsPlaying(true)
                    })
                    .catch(error => {
                        console.log("Autoplay was prevented or failed:", error)
                        setIsPlaying(false)
                    })
            }
        }
    }, [item.id, vocabData.audioUrl, hasAudio])

    let question = ''
    let subTitle = ''

    if (isGrammar) {
        question = grammarData.questionDe
        subTitle = grammarData.questionNative ?? ''
    } else if (hasAudio) {
        question = 'Höre und wähle das richtige Wort'
        subTitle = 'Wähle das Wort, das du hörst.'
    } else {
        question = `Nghĩa của từ "${vocabData.term}" là gì?`
        subTitle = t('chooseCorrectAnswer') || 'Wähle die richtige Antwort'
    }

    const [selected, setSelected] = useState<number | null>(null)
    const [checked, setChecked] = useState(false)

    const isCorrect = selected === correctIndex

    const handleCheck = () => {
        if (selected === null) return
        if (!checked) {
            setChecked(true)
        } else {
            onNext(isCorrect)
        }
    }

    // Dynamic badge text and icon
    let badgeText = 'WORTSCHATZ'
    let badgeIcon: React.ReactNode = null
    if (isGrammar) {
        badgeText = 'GRAMMATIK'
    } else if (hasAudio) {
        badgeText = 'HÖREN'
        badgeIcon = <Headphones className="w-3 h-3" />
    }

    return (
        <div className="flex flex-col h-full animate-fade-in-up">
            {/* Header: Schritt and Badge */}
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#3C78A8]">
                    Schritt <span className="text-[#173b56] font-black">{stepIndex + 1}</span> von {totalSteps}
                </span>
                <span className="flex items-center gap-1 bg-[#2EC4B6]/15 text-[#2EC4B6] text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {badgeIcon}
                    {badgeText}
                </span>
            </div>

            {/* Progress line nodes */}
            <div className="flex items-center gap-2 mb-6">
                {Array.from({ length: totalSteps }).map((_, idx) => {
                    const step = idx + 1
                    const isCurrent = idx === stepIndex
                    const isCompleted = idx < stepIndex
                    return (
                        <React.Fragment key={step}>
                            <div
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                    isCurrent
                                        ? 'bg-[#2EC4B6] ring-4 ring-[#2EC4B6]/20'
                                        : isCompleted
                                        ? 'bg-[#2EC4B6]'
                                        : 'bg-[#CCE4F0]/60'
                                }`}
                            />
                            {step < totalSteps && (
                                <div
                                    className={`flex-1 h-[2px] transition-all duration-300 ${
                                        idx < stepIndex ? 'bg-[#2EC4B6]' : 'bg-[#CCE4F0]/30'
                                    }`}
                                />
                            )}
                        </React.Fragment>
                    )
                })}
                <span className="text-xs text-[#3C78A8] ml-1">🏁</span>
            </div>

            {/* Question headings */}
            <div className="text-center mb-6">
                <h2 className="text-xl md:text-2xl font-black text-[#173b56] leading-tight">
                    {question}
                </h2>
                <p className="text-xs md:text-sm text-[#3C78A8] font-bold mt-1">
                    {subTitle}
                </p>
            </div>

            {/* Big Speaker Button */}
            {hasAudio ? (
                <div className="flex flex-col items-center justify-center gap-4 mb-6">
                    <audio
                        ref={audioRef}
                        src={vocabData.audioUrl ?? undefined}
                        preload="auto"
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onEnded={() => setIsPlaying(false)}
                    />
                    <button 
                        type="button"
                        onClick={() => {
                            if (audioRef.current) {
                                if (isPlaying) {
                                    audioRef.current.pause()
                                } else {
                                    audioRef.current.play().catch(error => {
                                        console.log("Speaker click play failed:", error)
                                    })
                                }
                            }
                        }}
                        className="w-20 h-20 rounded-full bg-[#F3FBFF] border border-[#CCE4F0]/50 shadow-md flex items-center justify-center text-[#2EC4B6] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                        </svg>
                    </button>

                    {/* Simulated Audio Waveform */}
                    <div className="flex items-center gap-1 h-8">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((bar) => {
                            const heights = [12, 24, 16, 8, 20, 14, 28, 18, 10, 22, 16, 26, 12, 8, 18, 14, 24, 10, 16, 12]
                            const h = heights[bar - 1] || 12
                            return (
                                <div
                                    key={bar}
                                    className={`w-[3px] bg-[#2EC4B6] rounded-full transition-all duration-300 ${
                                        isPlaying ? 'animate-pulse' : 'opacity-40'
                                    }`}
                                    style={{ 
                                        height: `${h}px`,
                                        animationDelay: isPlaying ? `${bar * 50}ms` : undefined 
                                    }}
                                />
                            )
                        })}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center mb-6">
                    <div className="bg-[#F3FBFF] border border-[#CCE4F0]/60 rounded-3xl px-8 py-6 shadow-sm text-center max-w-sm w-full">
                        <span className="text-3xl mb-2 block">🦊</span>
                        <p className="text-[9px] font-black uppercase text-[#3C78A8] tracking-widest mb-1">DEUTSCH</p>
                        <h3 className="text-xl md:text-2xl font-black text-[#2E7EC4]">{vocabData.term}</h3>
                        {vocabData.partOfSpeech && (
                            <span className="inline-block mt-2 bg-[#2E7EC4]/10 text-[#2E7EC4] text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                                {vocabData.partOfSpeech}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Choices Grid - Horizontal inline row or grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {options.map((opt: string, idx: number) => {
                    let btnStyle = "border-2 border-[#CCE4F0]/60 hover:bg-gray-50 text-[#173b56] bg-white font-bold"
                    
                    if (checked) {
                        if (idx === correctIndex) {
                            btnStyle = "bg-emerald-50 border-emerald-400 text-emerald-700 font-bold"
                        } else if (idx === selected) {
                            btnStyle = "bg-red-50 border-red-400 text-red-700 font-bold"
                        } else {
                            btnStyle = "border-[#CCE4F0]/40 opacity-40 bg-white"
                        }
                    } else if (selected === idx) {
                        btnStyle = "border-[#2EC4B6] bg-[#F3FBFF] text-[#2EC4B6] shadow-sm font-extrabold"
                    }

                    return (
                        <button
                            key={idx}
                            data-choice-btn
                            disabled={checked}
                            onClick={() => setSelected(idx)}
                            className={`p-3 rounded-2xl text-center transition-all duration-200 text-xs md:text-sm shadow-sm cursor-pointer ${btnStyle}`}
                        >
                            {opt}
                        </button>
                    )
                })}
            </div>

            {/* Grammar Explanation after checked (replaces tip bar) */}
            {checked && isGrammar && grammarData.explanation && (
                <div className="p-3 bg-[#F3FBFF] border border-[#CCE4F0]/50 rounded-2xl text-xs text-[#173b56] font-bold text-center mb-6 animate-fade-in-up">
                    <span className="text-[#2E7EC4] mr-1">{t('explanationLabel')}</span>
                    {grammarData.explanation}
                </div>
            )}

            {/* Bottom Button inside Card */}
            <div className="mt-auto pt-4 border-t border-[#CCE4F0]/30">
                {checked && (
                    <div className="mb-4 text-center">
                        <div className={`font-black text-lg mb-1 ${isCorrect ? 'text-emerald-600' : 'text-red-600'}`}>
                            {isCorrect ? t('correctFeedback') : t('incorrectFeedback')}
                        </div>
                        {!isCorrect && (
                            <div className="text-red-700 text-xs font-bold">
                                {t('correctAnswerLabel')} <strong>{options[correctIndex]}</strong>
                            </div>
                        )}
                    </div>
                )}
                
                <button
                    onClick={handleCheck}
                    disabled={selected === null && !checked}
                    className="w-full py-4 bg-[#2EC4B6] hover:bg-[#25b5a7] active:bg-[#1fa093] text-white text-base font-black rounded-2xl transition-all duration-300 shadow-md shadow-[#2EC4B6]/25 hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    <span>{checked ? t('nextLabel') : t('checkLabel')}</span>
                    <span>→</span>
                </button>
            </div>
        </div>
    )
}

