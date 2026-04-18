'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Image from 'next/image'
import { playSound } from '@/hooks/use-audio-player'
import { ExerciseProgress } from './exercise-progress'
import { ExerciseResults } from './exercise-results'
import { BottomFeedback } from './bottom-feedback'
import { IntroSlide } from './intro-slide'
import { useExerciseTimer } from '@/hooks/use-exercise-timer'
import { useSubmitExercise } from '@/hooks/use-submit-exercise'
import type { ExerciseAnswer } from '@/hooks/use-submit-exercise'
import { Mascot } from '@/components/ui/mascot'

interface MixedQuestion {
    id: string
    exerciseComponent: 'intro' | 'mc'
    type: string
    wordId: string
    word: string
    meaningNative: string
    prompt?: string
    promptImage?: string | null
    promptAudio?: string | null
    options?: string[]
    imageUrl?: string | null
    audioUrl?: string | null
    exampleSentence1?: string | null
    exampleTranslation1?: string | null
}

interface MixedExerciseProps {
    questions: MixedQuestion[]
    cefrLevel: string
    themeName: string
    themeSlug: string
    onExit: () => void
    onComplete: (results: any) => void
}

export function MixedExercise({ questions, cefrLevel, themeName, themeSlug, onExit, onComplete }: MixedExerciseProps) {
    const [activeQuestions, setActiveQuestions] = useState([...questions])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
    const [isRevealed, setIsRevealed] = useState(false)
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
    const [answers, setAnswers] = useState<ExerciseAnswer[]>([])
    
    // Heart System (Gamification)
    const MAX_HEARTS = 5
    const [hearts, setHearts] = useState(MAX_HEARTS)
    const [gameOver, setGameOver] = useState(false)

    const { timer, stopTimer, resetTimer } = useExerciseTimer()
    const { submitResult, isSubmitting, phase, submitAnswers, resetSubmit } = useSubmitExercise({
        exerciseType: 'mixed',
        themeSlug,
        cefrLevel,
        xpPerCorrect: 10,
    })

    const question = activeQuestions[currentIndex]

    // Audio auto play for MC audio variant
    useEffect(() => {
        if (question?.exerciseComponent === 'mc' && question.type === 'audio_to_word' && question.promptAudio) {
            playSound(question.promptAudio)
        }
    }, [currentIndex, question])

    const handleSelect = useCallback((option: string) => {
        if (isRevealed || !question) return
        setSelectedAnswer(option)
        setIsRevealed(true)

        const correctAnswer = question.type === 'de_to_native'
            ? question.meaningNative
            : question.word  // native_to_de, image_to_word, audio_to_word

        const correct = option === correctAnswer
        setIsCorrect(correct)

        const newAnswers: ExerciseAnswer[] = [...answers, {
            questionId: question.id,
            answer: option,
            correctAnswer,
            wordId: question.wordId,
            questionType: question.type,
        }]
        setAnswers(newAnswers)

        // Phạt nếu Sai
        if (!correct) {
            const nextHearts = hearts - 1
            setHearts(nextHearts)
            if (nextHearts <= 0) {
                // Hết máu -> Game Over sau vài giây
            } else {
                // Đẩy xuống cuối bài
                setActiveQuestions(prev => [...prev, { ...question, id: question.id + '_retry' }])
            }
        }
    }, [isRevealed, answers, question, hearts])

    const handleContinue = useCallback(() => {
        if (hearts <= 0) {
            setGameOver(true)
            stopTimer()
            return
        }

        if (currentIndex < activeQuestions.length - 1) {
            setCurrentIndex(i => i + 1)
            setSelectedAnswer(null)
            setIsRevealed(false)
            setIsCorrect(null)
        } else {
            // Hoàn thành
            stopTimer()
            submitAnswers(answers, timer)
        }
    }, [currentIndex, activeQuestions.length, stopTimer, submitAnswers, answers, timer, hearts])

    // Lặp lại nếu Retry
    const handleRetry = () => {
        setActiveQuestions([...questions])
        setCurrentIndex(0)
        setSelectedAnswer(null)
        setIsRevealed(false)
        setIsCorrect(null)
        setAnswers([])
        setHearts(MAX_HEARTS)
        setGameOver(false)
        resetSubmit()
        resetTimer()
    }

    if (gameOver) {
        return (
            <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col items-center justify-center p-6 animate-fade-in text-center">
                <Mascot variant="encouragement" size={120} className="mb-6 grayscale mix-blend-multiply" />
                <h1 className="text-4xl font-black text-gray-900 mb-2">Hết Mạng (Game Over)</h1>
                <p className="text-lg text-gray-500 mb-10">Đừng bỏ cuộc, hãy làm lại thật cẩn thận nhé!</p>
                <div className="flex gap-4 w-full max-w-sm flex-col">
                    <button onClick={handleRetry} className="py-4 px-6 rounded-2xl bg-[#004E89] text-white font-bold text-lg hover:bg-blue-800 shadow-lg shadow-blue-200 uppercase">
                        Thử lại ngay
                    </button>
                    <button onClick={onExit} className="py-4 px-6 rounded-2xl bg-white border-2 border-gray-200 text-gray-500 font-bold hover:bg-gray-50 uppercase">
                        Về trang chủ
                    </button>
                </div>
            </div>
        )
    }

    if (phase === 'results' && submitResult) {
        return (
            <ExerciseResults
                totalQuestions={submitResult.totalQuestions}
                correctCount={submitResult.correctCount}
                accuracy={submitResult.accuracy}
                xpEarned={submitResult.xpEarned}
                timeTaken={timer}
                results={submitResult.results}
                onRetry={handleRetry}
                onNewTheme={onExit}
            />
        )
    }

    if (!question) return null

    // Helper render Header (Hiển thị Progress + Mạng)
    const renderHeader = () => (
        <div className="flex flex-col">
            <div className="flex justify-center py-2 bg-white">
                <div className="flex items-center gap-1">
                    {Array.from({ length: MAX_HEARTS }).map((_, i) => (
                        <svg key={i} className={`w-8 h-8 transition-colors ${i < hearts ? 'text-red-500' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                    ))}
                </div>
            </div>
            <ExerciseProgress current={currentIndex + 1} total={activeQuestions.length} onClose={onExit} timer={timer} cefrLevel={cefrLevel} />
        </div>
    )

    // Render INTRO SLIDE
    if (question.exerciseComponent === 'intro') {
        return (
            <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col">
                {renderHeader()}
                <div className="flex-1 flex overflow-y-auto">
                    <IntroSlide
                        word={question.word}
                        meaningNative={question.meaningNative}
                        imageUrl={question.imageUrl ?? null}
                        audioUrl={question.audioUrl ?? null}
                        onContinue={handleContinue}
                    />
                </div>
            </div>
        )
    }

    // Render MC SLIDE (Multiple Choice)
    const getQuestionLabel = () => {
        switch (question.type) {
            case 'de_to_native': return `Was bedeutet "${question.prompt}"?`
            case 'native_to_de': return `"${question.prompt}" auf Deutsch?`
            case 'image_to_word': return 'Welches Wort passt zum Bild?'
            case 'audio_to_word': return 'Welches Wort hörst du?'
            default: return question.prompt
        }
    }

    return (
        <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col">
            {renderHeader()}
            <div className="flex-1 flex items-center justify-center overflow-y-auto">
                <div className="max-w-2xl w-full px-6 py-8">
                    {/* Y hệt như MC-Exercise */}
                    <div className="text-center mb-8">
                        {question.type === 'image_to_word' && question.promptImage && (
                            <div className="mb-4 flex justify-center">
                                <Image src={question.promptImage} alt="Prompt" width={160} height={160} className="rounded-2xl object-cover shadow-md" />
                            </div>
                        )}
                        {question.type === 'audio_to_word' && (
                            <button onClick={() => playSound(question.promptAudio)} className="mb-4 w-24 h-24... bg-[#004E89] text-white flex items-center justify-center mx-auto rounded-full">
                                🎧
                            </button>
                        )}
                        {(question.type === 'de_to_native' || question.type === 'native_to_de') && (
                            <div className="mb-4">
                                <p className="text-4xl font-black text-gray-900 leading-tight">{question.prompt}</p>
                                {question.type === 'de_to_native' && question.promptAudio && (
                                    <button onClick={() => playSound(question.promptAudio)} className="mt-2 text-[#004E89]">🔊 Anhören</button>
                                )}
                            </div>
                        )}
                        <p className="text-gray-500 font-bold uppercase tracking-wide text-xs">{getQuestionLabel()}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {question.options?.map((option, i) => {
                            const isSelected = selectedAnswer === option
                            let btnClass = 'bg-white border-2 border-gray-200 text-gray-800 hover:border-[#004E89] hover:bg-blue-50'

                            if (isRevealed) {
                                btnClass = isSelected ? 'bg-blue-50 border-2 border-[#004E89] text-[#004E89]' : 'bg-gray-50 border-2 border-gray-100 text-gray-400'
                            }

                            return (
                                <button key={i} onClick={() => handleSelect(option)} disabled={isRevealed} className={`py-6 px-4 rounded-2xl font-bold text-lg transition-all ${btnClass}`}>
                                    {option}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {isRevealed && isCorrect !== null && (
                <BottomFeedback
                    isCorrect={isCorrect}
                    correctAnswer={question.type === 'de_to_native' ? question.meaningNative : question.word}
                    onContinue={handleContinue}
                />
            )}
        </div>
    )
}
