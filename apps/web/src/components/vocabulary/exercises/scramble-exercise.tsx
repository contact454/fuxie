'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useSuppressLearnerMainChrome } from '@/hooks/use-suppress-chrome'
import { FrostedPanel, PrimaryCta } from '@fuxie/ui/components'
import { ExerciseProgress } from './exercise-progress'
import { ExerciseResults } from './exercise-results'
import { BottomFeedback } from './bottom-feedback'
import { useExerciseTimer } from '@/hooks/use-exercise-timer'
import { useSubmitExercise, type ExerciseAnswer } from '@/hooks/use-submit-exercise'
import {
    exerciseCenterStageClass,
    exerciseConstructionZoneClass,
    exerciseHintPanelClass,
    exercisePrimaryActionClass,
    exerciseScreenClass,
    exerciseSecondaryActionClass,
    exerciseStageInnerClass,
    exerciseTokenClass,
} from './exercise-ui'

// ─── Types ──────────────────────────────────────────
interface ScrambleQuestion {
    id: string
    type: string
    scrambledWords: string[]
    translation: string | null
    original: string
    wordId: string
}

interface ScrambleExerciseProps {
    questions: ScrambleQuestion[]
    cefrLevel: string
    themeName: string
    themeSlug: string
    onExit: () => void
    onComplete: () => void
}

// ─── Component ──────────────────────────────────────
export function ScrambleExercise({ questions, cefrLevel, themeName: _themeName, themeSlug, onExit, onComplete: _onComplete }: ScrambleExerciseProps) {
    const t = useTranslations('Vocabulary')
    const [currentIndex, setCurrentIndex] = useState(0)
    const [availableWords, setAvailableWords] = useState<string[]>([])
    const [selectedWords, setSelectedWords] = useState<string[]>([])
    const [isRevealed, setIsRevealed] = useState(false)
    const [answers, setAnswers] = useState<ExerciseAnswer[]>([])
    const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const { timer, stopTimer, resetTimer } = useExerciseTimer()
    const { submitResult, phase, submitAnswers, resetSubmit } = useSubmitExercise({
        exerciseType: 'scramble',
        themeSlug,
        cefrLevel,
        xpPerCorrect: 8,
        compareFn: (a, b) => {
            const normalize = (s: string) => s.replace(/[.!?;,]+$/g, '').trim().toLowerCase()
            return normalize(a) === normalize(b)
        },
    })

    useSuppressLearnerMainChrome(phase !== 'results')

    const [isCorrect, setIsCorrect] = useState<boolean | null>(null)

    const question = questions[currentIndex]!

    // Reset available words on new question
    useEffect(() => {
        setAvailableWords([...question.scrambledWords])
        setSelectedWords([])
    }, [currentIndex, question.scrambledWords])

    useEffect(() => {
        return () => {
            if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current)
        }
    }, [])

    const addWord = useCallback((word: string, index: number) => {
        if (isRevealed) return
        setSelectedWords(prev => [...prev, word])
        setAvailableWords(prev => {
            const next = [...prev]
            next.splice(index, 1)
            return next
        })
    }, [isRevealed])

    const removeWord = useCallback((index: number) => {
        if (isRevealed) return
        const word = selectedWords[index]!
        setSelectedWords(prev => {
            const next = [...prev]
            next.splice(index, 1)
            return next
        })
        setAvailableWords(prev => [...prev, word])
    }, [isRevealed, selectedWords])

    const checkAnswer = useCallback(() => {
        if (isRevealed || selectedWords.length === 0) return

        const userSentence = selectedWords.join(' ')
        const normalize = (s: string) => s.replace(/[.!?;,]+$/g, '').trim().toLowerCase()
        const correct = normalize(userSentence) === normalize(question.original)
        setIsCorrect(correct)
        setIsRevealed(true)

        const newAnswers: ExerciseAnswer[] = [...answers, {
            questionId: question.id,
            answer: userSentence,
            correctAnswer: question.original,
            wordId: question.wordId,
            questionType: question.type,
        }]
        setAnswers(newAnswers)
    }, [isRevealed, selectedWords, question, answers])

    const handleContinue = useCallback(() => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(i => i + 1)
            setIsRevealed(false)
            setIsCorrect(null)
            setAvailableWords([...questions[currentIndex + 1]!.scrambledWords])
            setSelectedWords([])
        } else {
            stopTimer()
            submitAnswers(answers, timer)
        }
    }, [currentIndex, questions, stopTimer, submitAnswers, answers, timer])

    // ─── Results ────────────────────────────────────
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
                    setCurrentIndex(0); setSelectedWords([]); setIsRevealed(false)
                    setAnswers([])
                    resetSubmit()
                    resetTimer()
                }}
                onNewTheme={onExit}
            />
        )
    }

    // ─── Playing ────────────────────────────────────
    return (
        <div className={exerciseScreenClass}>
            <ExerciseProgress
                current={currentIndex + 1}
                total={questions.length}
                onClose={onExit}
                timer={timer}
                cefrLevel={cefrLevel}
            />

            <div className={exerciseCenterStageClass}>
                <div className={exerciseStageInnerClass}>
                    {/* Briefing Card wrapped in FrostedPanel */}
                    <FrostedPanel className="mb-6 p-5 text-center flex flex-col gap-3 shadow-[var(--fuxie-shadow-iso)] border-2 border-[var(--fuxie-blue-200)]/70">
                        <div>
                            <h2 className="text-lg font-black text-slate-950">{t('scrambleTitle')}</h2>
                            <p className="mt-1 text-sm font-semibold text-slate-500">{t('scrambleInstruction')}</p>
                        </div>
                        {question.translation && (
                            <div className="border-t border-[var(--fuxie-blue-200)]/70 pt-3 font-semibold text-text-brand">
                                <span>🇻🇳 {question.translation}</span>
                            </div>
                        )}
                    </FrostedPanel>

                    {/* Construction zone — selected words */}
                    <div className={exerciseConstructionZoneClass({ active: selectedWords.length > 0, revealed: isRevealed, className: 'mb-6' })}>
                        {selectedWords.length === 0 ? (
                            <p className="py-2 text-center text-sm font-semibold text-slate-400">{t('scrambleHint')}</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {selectedWords.map((word, i) => (
                                    <button
                                        key={`sel-${i}`}
                                        onClick={() => removeWord(i)}
                                        disabled={isRevealed}
                                        className={exerciseTokenClass({ selected: true, revealed: isRevealed })}
                                    >
                                        {word}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Feedback */}
                        {isRevealed && (
                            <div className="mt-3 pt-3 border-t border-current/10">
                                <p className="text-sm font-semibold text-text-brand">{t('savedAnswer')}</p>
                            </div>
                        )}
                    </div>

                    {/* Available word tiles */}
                    <div className="mb-6 flex flex-wrap justify-center gap-2">
                        {availableWords.map((word, i) => (
                            <button
                                key={`avail-${i}-${word}`}
                                onClick={() => addWord(word, i)}
                                disabled={isRevealed}
                                className={exerciseTokenClass({ selected: false })}
                            >
                                {word}
                            </button>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <PrimaryCta
                            onClick={() => {
                                setAvailableWords([...question.scrambledWords])
                                setSelectedWords([])
                            }}
                            disabled={isRevealed || selectedWords.length === 0}
                            variant="secondary"
                            className="px-4"
                        >
                            🔄 {t('resetBtn')}
                        </PrimaryCta>
                        <PrimaryCta
                            onClick={checkAnswer}
                            disabled={isRevealed || selectedWords.length === 0}
                            className="flex-1"
                        >
                            {t('checkBtn')}
                        </PrimaryCta>
                    </div>
                </div>
            </div>

            {/* Bottom Feedback Bar */}
            {isRevealed && isCorrect !== null && (
                <BottomFeedback
                    isCorrect={isCorrect}
                    correctAnswer={question.original}
                    onContinue={handleContinue}
                />
            )}
        </div>
    )
}
