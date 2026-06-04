'use client'

import { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { playSound } from '@/hooks/use-audio-player'
import { ExerciseProgress } from './exercise-progress'
import { ExerciseResults } from './exercise-results'
import { BottomFeedback } from './bottom-feedback'
import { useExerciseTimer } from '@/hooks/use-exercise-timer'
import { useSubmitExercise } from '@/hooks/use-submit-exercise'
import type { ExerciseAnswer } from '@/hooks/use-submit-exercise'
import {
    exerciseAudioButtonClass,
    exerciseCenterStageClass,
    exerciseInlineAudioClass,
    exerciseOptionClass,
    exercisePromptImageClass,
    exerciseScreenClass,
    exerciseStageInnerClass,
} from './exercise-ui'

// ─── Types ──────────────────────────────────────────
interface McQuestion {
    id: string
    type: string // 'de_to_native' | 'native_to_de' | 'image_to_word' | 'audio_to_word'
    prompt: string
    promptImage: string | null
    promptAudio: string | null
    options: string[]
    wordId: string
    word: string
    meaningNative: string
}

interface McExerciseProps {
    questions: McQuestion[]
    cefrLevel: string
    themeName: string
    themeSlug: string
    onExit: () => void
    onComplete: (results: SubmitResult) => void
}

interface SubmitResult {
    totalQuestions: number
    correctCount: number
    accuracy: number
    xpEarned: number
    results: Array<{
        questionId: string
        isCorrect: boolean
        userAnswer: string
        correctAnswer: string
    }>
}



// ─── Component ──────────────────────────────────────
export function McExercise({ questions, cefrLevel, themeName: _themeName, themeSlug, onExit, onComplete: _onComplete }: McExerciseProps) {
    const t = useTranslations('UI')
    const [activeQuestions, setActiveQuestions] = useState([...questions])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
    const [isRevealed, setIsRevealed] = useState(false)
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
    const [answers, setAnswers] = useState<ExerciseAnswer[]>([])

    const { timer, stopTimer, resetTimer } = useExerciseTimer()
    const { submitResult, isSubmitting, phase, submitAnswers, resetSubmit } = useSubmitExercise({
        exerciseType: 'mc',
        themeSlug,
        cefrLevel,
        xpPerCorrect: 5,
    })

    const question = activeQuestions[currentIndex]!

    // Auto play audio for audio_to_word variant
    useEffect(() => {
        if (question.type === 'audio_to_word' && question.promptAudio) {
            playSound(question.promptAudio)
        }
    }, [currentIndex, question.type, question.promptAudio])

    const handleSelect = useCallback((option: string) => {
        if (isRevealed) return
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

        // If wrong, push to the end
        if (!correct) {
            setActiveQuestions(prev => [...prev, { ...question, id: question.id + '_retry' }])
        }
    }, [isRevealed, answers, question])

    const handleContinue = useCallback(() => {
        if (currentIndex < activeQuestions.length - 1) {
            setCurrentIndex(i => i + 1)
            setSelectedAnswer(null)
            setIsRevealed(false)
            setIsCorrect(null)
        } else {
            // Submit
            stopTimer()
            submitAnswers(answers, timer)
        }
    }, [currentIndex, activeQuestions.length, stopTimer, submitAnswers, answers, timer])

    // ─── Variant Labels ─────────────────────────────
    const getQuestionLabel = () => {
        switch (question.type) {
            case 'de_to_native': return `Was bedeutet "${question.prompt}"?`
            case 'native_to_de': return `"${question.prompt}" auf Deutsch?`
            case 'image_to_word': return 'Welches Wort passt zum Bild?'
            case 'audio_to_word': return 'Welches Wort hörst du?'
            default: return question.prompt
        }
    }

    // ─── Results Phase ──────────────────────────────
    if (phase === 'results' && submitResult) {
        return (
            <ExerciseResults
                totalQuestions={submitResult.totalQuestions}
                correctCount={submitResult.correctCount}
                accuracy={submitResult.accuracy}
                xpEarned={submitResult.xpEarned}
                fucoinEarned={submitResult.fucoinEarned}
                walletBalance={submitResult.walletBalance}
                fucoinDuplicate={submitResult.fucoinDuplicate}
                fucoinIntended={submitResult.fucoinIntended}
                fucoinDailyCap={submitResult.fucoinDailyCap}
                fucoinDailyEarned={submitResult.fucoinDailyEarned}
                fucoinDailyRemaining={submitResult.fucoinDailyRemaining}
                fucoinCapReached={submitResult.fucoinCapReached}
                streak={submitResult.streak}
                timeTaken={timer}
                results={submitResult.results}
                onRetry={() => {
                    setActiveQuestions([...questions])
                    setCurrentIndex(0)
                    setSelectedAnswer(null)
                    setIsRevealed(false)
                    setIsCorrect(null)
                    setAnswers([])
                    resetSubmit()
                    resetTimer()
                }}
                onNewTheme={onExit}
            />
        )
    }

    // ─── Playing Phase ──────────────────────────────
    return (
        <div className={exerciseScreenClass}>
            {/* Progress bar */}
            <ExerciseProgress
                current={currentIndex + 1}
                total={activeQuestions.length}
                onClose={onExit}
                timer={timer}
                cefrLevel={cefrLevel}
            />

            {/* Exercise content — vertically centered */}
            <div className={exerciseCenterStageClass}>
                <div className={exerciseStageInnerClass}>
                    {/* Prompt area */}
                    <div className="text-center mb-8">
                        {/* Image prompt (image_to_word only) */}
                        {question.type === 'image_to_word' && question.promptImage && (
                            <div className="mb-4 flex justify-center">
                                <Image
                                    src={question.promptImage}
                                    alt="Vocabulary image"
                                    width={160}
                                    height={160}
                                    className={exercisePromptImageClass()}
                                />
                            </div>
                        )}

                        {/* Audio prompt (audio_to_word only) */}
                        {question.type === 'audio_to_word' && (
                            <button
                                onClick={() => playSound(question.promptAudio)}
                                className={exerciseAudioButtonClass()}
                            >
                                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                                </svg>
                            </button>
                        )}

                        {/* Text prompt (de_to_native, native_to_de) */}
                        {(question.type === 'de_to_native' || question.type === 'native_to_de') && (
                            <div className="mb-4">
                                <p className="text-3xl font-black text-slate-950">{question.prompt}</p>
                                {/* Audio button for de_to_native */}
                                {question.type === 'de_to_native' && question.promptAudio && (
                                    <button
                                        onClick={() => playSound(question.promptAudio)}
                                        className={exerciseInlineAudioClass()}
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                                        </svg>
                                        <span className="text-sm font-medium">{t('listenAudio')}</span>
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Question label */}
                        <p className="text-sm font-semibold text-slate-500">{getQuestionLabel()}</p>
                    </div>

                    {/* Options — 2×2 grid */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {question.options.map((option, i) => {
                            const isSelected = selectedAnswer === option
                            return (
                                <button
                                    key={i}
                                    onClick={() => handleSelect(option)}
                                    disabled={isRevealed}
                                    className={exerciseOptionClass({ selected: isSelected, revealed: isRevealed })}
                                >
                                    {isRevealed && isSelected && (
                                        <span className="text-text-brand mr-1">•</span>
                                    )}
                                    <span>{option}</span>
                                </button>
                            )
                        })}
                    </div>

                    {/* Loading indicator */}
                    {isSubmitting && (
                        <div className="mt-8 text-center text-slate-400">
                            <div className="inline-flex items-center gap-2">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#CCE4F0] border-t-[#60A8E4]" />
                                Wird ausgewertet...
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Feedback Bar */}
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
