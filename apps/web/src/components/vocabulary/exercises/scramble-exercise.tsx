'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { ExerciseProgress } from './exercise-progress'
import { ExerciseResults } from './exercise-results'
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
        setIsRevealed(true)

        const newAnswers: ExerciseAnswer[] = [...answers, {
            questionId: question.id,
            answer: userSentence,
            correctAnswer: userSentence,  // Server derives from wordId via deriveCorrectAnswer
            wordId: question.wordId,
            questionType: question.type,
        }]
        setAnswers(newAnswers)

        if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current)
        advanceTimeoutRef.current = setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(i => i + 1)
                setIsRevealed(false)
            } else {
                stopTimer()
                submitAnswers(newAnswers, timer)
            }
        }, 2500)
    }, [isRevealed, selectedWords, question, answers, currentIndex, questions.length, stopTimer, submitAnswers, timer])

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
                    {/* Instruction */}
                    <div className="text-center mb-6">
                        <h2 className="text-lg font-black text-slate-950">Sắp xếp các từ</h2>
                        <p className="mt-1 text-sm font-semibold text-slate-500">Bilde den richtigen Satz</p>
                    </div>

                    {/* Vietnamese translation hint */}
                    {question.translation && (
                        <div className={exerciseHintPanelClass('mb-6')}>
                            <span>🇻🇳 {question.translation}</span>
                        </div>
                    )}

                    {/* Construction zone — selected words */}
                    <div className={exerciseConstructionZoneClass({ active: selectedWords.length > 0, revealed: isRevealed, className: 'mb-6' })}>
                        {selectedWords.length === 0 ? (
                            <p className="py-2 text-center text-sm font-semibold text-slate-400">Chạm vào các từ bên dưới</p>
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
                                <p className="text-sm font-semibold text-[#3C78A8]">Đã lưu câu trả lời</p>
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
                        <button
                            onClick={() => {
                                setAvailableWords([...question.scrambledWords])
                                setSelectedWords([])
                            }}
                            disabled={isRevealed || selectedWords.length === 0}
                            className={exerciseSecondaryActionClass(isRevealed || selectedWords.length === 0, 'px-4')}
                        >
                            🔄 Reset
                        </button>
                        <button
                            onClick={checkAnswer}
                            disabled={isRevealed || selectedWords.length === 0}
                            className={exercisePrimaryActionClass(isRevealed || selectedWords.length === 0, 'flex-1')}
                        >
                            Prüfen
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
