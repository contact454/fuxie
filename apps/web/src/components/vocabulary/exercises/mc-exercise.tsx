'use client'

import { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useSuppressLearnerMainChrome } from '@/hooks/use-suppress-chrome'
import { useAudioPlayer } from '@/hooks/use-audio-player'
import { ExerciseProgress } from './exercise-progress'
import { ExerciseResults } from './exercise-results'
import { BottomFeedback } from './bottom-feedback'
import { useExerciseTimer } from '@/hooks/use-exercise-timer'
import { useSubmitExercise } from '@/hooks/use-submit-exercise'
import type { ExerciseAnswer } from '@/hooks/use-submit-exercise'
import { OptionTile, AudioButton, FrostedPanel, PrimaryCta } from '@fuxie/ui/components'
import { FuxiePose } from './fuxie-pose'
import {
    exerciseCenterStageClass,
    exerciseScreenClass,
    exerciseStageInnerClass,
    exercisePromptImageClass,
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
    showResults?: boolean
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
export function McExercise({ questions, cefrLevel, themeName, themeSlug, onExit, onComplete: _onComplete, showResults = false }: McExerciseProps) {
    const t = useTranslations('UI')
    const tVocab = useTranslations('Vocabulary')
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

    useSuppressLearnerMainChrome(!showResults && phase !== 'results')

    const searchParams = useSearchParams()
    const mockState = searchParams?.get('mockState')

    const question = activeQuestions[currentIndex]!

    useEffect(() => {
        if (mockState === 'selected' && question && !selectedAnswer && !isRevealed) {
            setSelectedAnswer(question.options[0]!)
        }
    }, [mockState, question, selectedAnswer, isRevealed])

    useEffect(() => {
        if (mockState === 'correct' && question && !isRevealed) {
            const correctAnswer = question.type === 'de_to_native'
                ? question.meaningNative
                : question.word
            setSelectedAnswer(correctAnswer)
            setIsCorrect(true)
            setIsRevealed(true)
            setAnswers([{
                questionId: question.id,
                answer: correctAnswer,
                correctAnswer,
                wordId: question.wordId,
                questionType: question.type,
            }])
        }
    }, [mockState, question, isRevealed])

    useEffect(() => {
        if (mockState === 'wrong' && question && !isRevealed) {
            const correctAnswer = question.type === 'de_to_native'
                ? question.meaningNative
                : question.word
            const wrongAnswer = question.options.find(o => o !== correctAnswer) || question.options[0]!
            setSelectedAnswer(wrongAnswer)
            setIsCorrect(false)
            setIsRevealed(true)
            setAnswers([{
                questionId: question.id,
                answer: wrongAnswer,
                correctAnswer,
                wordId: question.wordId,
                questionType: question.type,
            }])
        }
    }, [mockState, question, isRevealed])

    const effectivePhase = showResults ? 'results' : phase
    const effectiveSubmitResult = showResults ? {
        totalQuestions: questions.length,
        correctCount: questions.length,
        accuracy: 100,
        xpEarned: questions.length * 5,
        fucoinEarned: 15,
        walletBalance: 120,
        fucoinDuplicate: false,
        fucoinIntended: 15,
        fucoinDailyCap: 100,
        fucoinDailyEarned: 35,
        fucoinDailyRemaining: 65,
        fucoinCapReached: false,
        streak: {
            currentStreak: 7,
            isNewDay: true,
            freezeUsed: false,
            freezesAvailable: 2,
            freezesUsed: 0,
        },
        results: questions.map((q) => {
            const correctAnswer = q.type === 'de_to_native'
                ? q.meaningNative
                : q.word
            return {
                questionId: q.id,
                isCorrect: true,
                userAnswer: correctAnswer,
                correctAnswer: correctAnswer,
            }
        })
    } : submitResult

    // Full audio lifecycle hooks for the question prompt
    const { isPlaying, play, stop } = useAudioPlayer(question.promptAudio)

    // Auto play audio for audio_to_word variant
    useEffect(() => {
        if (question.type === 'audio_to_word' && question.promptAudio) {
            play()
        }
        return () => {
            stop()
        }
    }, [currentIndex, question.type, question.promptAudio, play, stop])

    const handleSelect = useCallback((option: string) => {
        if (isRevealed) return
        setSelectedAnswer(option)
    }, [isRevealed])

    const checkAnswer = useCallback(() => {
        if (isRevealed || !selectedAnswer) return
        setIsRevealed(true)

        const correctAnswer = question.type === 'de_to_native'
            ? question.meaningNative
            : question.word  // native_to_de, image_to_word, audio_to_word

        const correct = selectedAnswer === correctAnswer
        setIsCorrect(correct)

        const newAnswers: ExerciseAnswer[] = [...answers, {
            questionId: question.id,
            answer: selectedAnswer,
            correctAnswer,
            wordId: question.wordId,
            questionType: question.type,
        }]
        setAnswers(newAnswers)

        // Soft vibration on incorrect, respecting prefers-reduced-motion
        if (!correct) {
            if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
                const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
                if (!prefersReducedMotion) {
                    window.navigator.vibrate(100)
                }
            }
        }

        // If wrong, push to the end
        if (!correct) {
            setActiveQuestions(prev => [...prev, { ...question, id: question.id + '_retry' }])
        }
    }, [isRevealed, selectedAnswer, answers, question])

    const handleContinue = useCallback(() => {
        stop()
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
    }, [currentIndex, activeQuestions.length, stopTimer, submitAnswers, answers, timer, stop])

    // ─── Variant Labels ─────────────────────────────
    const getQuestionLabel = () => {
        switch (question.type) {
            case 'de_to_native': return tVocab('questionDeToNative', { word: question.prompt })
            case 'native_to_de': return tVocab('questionNativeToDe', { word: question.prompt })
            case 'image_to_word': return tVocab('questionImageToWord')
            case 'audio_to_word': return tVocab('questionAudioToWord')
            default: return question.prompt
        }
    }

    // ─── Results Phase ──────────────────────────────
    if (effectivePhase === 'results' && effectiveSubmitResult) {
        return (
            <ExerciseResults
                totalQuestions={effectiveSubmitResult.totalQuestions}
                correctCount={effectiveSubmitResult.correctCount}
                accuracy={effectiveSubmitResult.accuracy}
                xpEarned={effectiveSubmitResult.xpEarned}
                fucoinEarned={effectiveSubmitResult.fucoinEarned}
                walletBalance={effectiveSubmitResult.walletBalance}
                fucoinDuplicate={effectiveSubmitResult.fucoinDuplicate}
                fucoinIntended={effectiveSubmitResult.fucoinIntended}
                fucoinDailyCap={effectiveSubmitResult.fucoinDailyCap}
                fucoinDailyEarned={effectiveSubmitResult.fucoinDailyEarned}
                fucoinDailyRemaining={effectiveSubmitResult.fucoinDailyRemaining}
                fucoinCapReached={effectiveSubmitResult.fucoinCapReached}
                streak={effectiveSubmitResult.streak}
                timeTaken={timer}
                results={effectiveSubmitResult.results}
                themeName={themeName}
                themeSlug={themeSlug}
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

    // Determine correct answer for OptionTile display status
    const correctAnswer = question.type === 'de_to_native'
        ? question.meaningNative
        : question.word

    // Determine current mascot pose
    const currentPose = isRevealed
        ? isCorrect
            ? 'correct-cheer'
            : 'wrong-oops'
        : 'idle-wave'

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
                    <FrostedPanel className="text-center mb-8 flex flex-col items-center justify-center p-6 w-full gap-4 shadow-[var(--fuxie-shadow-iso)] border-2 border-[var(--fuxie-blue-200)]/70">
                        {/* Image prompt (image_to_word only) */}
                        {question.type === 'image_to_word' && question.promptImage && (
                            <div className="mb-2 flex justify-center">
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
                            <div className="mb-2 flex justify-center">
                                <AudioButton
                                    state={isPlaying ? 'playing' : 'idle'}
                                    ariaLabel={t('listenAudio')}
                                    onClick={play}
                                    className="w-16 h-16"
                                />
                            </div>
                        )}

                        {/* Text prompt (de_to_native, native_to_de) */}
                        {(question.type === 'de_to_native' || question.type === 'native_to_de') && (
                            <div className="mb-2 flex flex-col items-center">
                                <p className="text-3xl font-black text-slate-950">{question.prompt}</p>
                                {/* Audio button for de_to_native */}
                                {question.type === 'de_to_native' && question.promptAudio && (
                                    <div className="mt-3 flex justify-center">
                                        <AudioButton
                                            state={isPlaying ? 'playing' : 'idle'}
                                            ariaLabel={t('listenAudio')}
                                            onClick={play}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Question label */}
                        <p className="text-sm font-semibold text-slate-500 mt-1">{getQuestionLabel()}</p>
                    </FrostedPanel>

                    {/* Options — 2×2 grid */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {question.options.map((option, i) => {
                            const isSelected = selectedAnswer === option
                            let status: 'idle' | 'selected' | 'correct' | 'incorrect' = 'idle'
                            if (isRevealed) {
                                if (option === correctAnswer) {
                                    status = 'correct'
                                } else if (isSelected) {
                                    status = 'incorrect'
                                }
                            } else if (isSelected) {
                                status = 'selected'
                            }
                            return (
                                <OptionTile
                                    key={i}
                                    text={option}
                                    status={status}
                                    onClick={() => handleSelect(option)}
                                    disabled={isRevealed}
                                />
                            )
                        })}
                    </div>

                    {/* Check Button */}
                    {!isRevealed && (
                        <div className="mt-8 w-full">
                            <PrimaryCta
                                onClick={checkAnswer}
                                disabled={!selectedAnswer}
                                className="w-full"
                            >
                                {tVocab('checkBtn')}
                            </PrimaryCta>
                        </div>
                    )}

                    {/* Fuxie Mascot reacting inside center stage */}
                    <div className="mt-8 flex justify-center">
                        <FuxiePose
                            pose={currentPose}
                            size={110}
                            className="transform hover:scale-105 transition-transform duration-300"
                        />
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
