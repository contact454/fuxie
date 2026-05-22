'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { ExerciseProgress } from './exercise-progress'
import { ExerciseResults } from './exercise-results'
import { useExerciseTimer } from '@/hooks/use-exercise-timer'
import { useSubmitExercise, type ExerciseAnswer } from '@/hooks/use-submit-exercise'
import { getFirstSessionNextStep } from '@/lib/gamification/lesson-gameplay-expansion'
import {
    exerciseCenterStageClass,
    exerciseHintPanelClass,
    exercisePrimaryActionClass,
    exerciseScreenClass,
    exerciseSpecialCharClass,
    exerciseStageInnerClass,
    exerciseTextInputClass,
} from './exercise-ui'

// ─── Types ──────────────────────────────────────────
interface ClozeQuestion {
    id: string
    type: string
    sentence: string         // "Lisa _____ heute Nachmittag in den Supermarkt"
    translation: string | null // Vietnamese translation
    wordType: string         // VERB, NOMEN, etc.
    wordId: string
}

interface ClozeExerciseProps {
    questions: ClozeQuestion[]
    cefrLevel: string
    themeName: string
    themeSlug: string
    onExit: () => void
    onComplete: () => void
}

const SPECIAL_CHARS = ['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü']

const WORD_TYPE_LABELS: Record<string, string> = {
    NOMEN: 'Nomen',
    VERB: 'Verb',
    ADJEKTIV: 'Adjektiv',
    ADVERB: 'Adverb',
    PRAEPOSITION: 'Präposition',
    KONJUNKTION: 'Konjunktion',
    PRONOMEN: 'Pronomen',
    ARTIKEL: 'Artikel',
    PARTIKEL: 'Partikel',
    NUMERALE: 'Numerale',
    PHRASE: 'Ausdruck',
}

const WORD_TYPE_COLORS: Record<string, string> = {
    NOMEN: 'bg-[#EEF7FF] text-text-brand ring-[#60A8E4]/20',
    VERB: 'bg-[#EAFBF8] text-text-success ring-[#2EC4B6]/30',
    ADJEKTIV: 'bg-[#F3FBFF] text-text-brand ring-[#60A8E4]/20',
    ADVERB: 'bg-[#EAFBF8] text-text-success ring-[#2EC4B6]/30',
    PRAEPOSITION: 'bg-[#FFF7D6] text-text-warning ring-[#FFD166]/60',
    PHRASE: 'bg-[#F3FBFF] text-text-brand ring-[#60A8E4]/20',
}

// ─── Component ──────────────────────────────────────
export function ClozeExercise({ questions, cefrLevel, themeName: _themeName, themeSlug, onExit, onComplete: _onComplete }: ClozeExerciseProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [userInput, setUserInput] = useState('')
    const [isRevealed, setIsRevealed] = useState(false)
    const [answers, setAnswers] = useState<ExerciseAnswer[]>([])
    const inputRef = useRef<HTMLInputElement>(null)
    const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const { timer, stopTimer, resetTimer } = useExerciseTimer()
    const { submitResult, phase, submitAnswers, resetSubmit } = useSubmitExercise({
        exerciseType: 'cloze',
        themeSlug,
        cefrLevel,
        xpPerCorrect: 7,
    })

    const question = questions[currentIndex]!

    // Focus input on new question
    useEffect(() => {
        if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current)
        focusTimeoutRef.current = setTimeout(() => inputRef.current?.focus(), 100)
    }, [currentIndex])

    useEffect(() => {
        return () => {
            if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current)
            if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current)
        }
    }, [])

    const checkAnswer = useCallback(() => {
        if (isRevealed || !userInput.trim()) return

        setIsRevealed(true)

        const newAnswers = [...answers, {
            questionId: question.id,
            answer: userInput.trim(),
            correctAnswer: userInput.trim(),  // Server derives from wordId via deriveCorrectAnswer
            wordId: question.wordId,
            questionType: question.type,
        }]
        setAnswers(newAnswers)

        // Auto advance
        if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current)
        advanceTimeoutRef.current = setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(i => i + 1)
                setUserInput('')
                setIsRevealed(false)
            } else {
                stopTimer()
                submitAnswers(newAnswers, timer)
            }
        }, 2000)
    }, [isRevealed, userInput, question, answers, currentIndex, questions.length, stopTimer, submitAnswers, timer])

    const insertChar = (ch: string) => {
        setUserInput(prev => prev + ch)
        inputRef.current?.focus()
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            checkAnswer()
        }
    }

    // ─── Results ────────────────────────────────────
    if (phase === 'results' && submitResult) {
        const nextStep = themeSlug === 'a1-person'
            ? getFirstSessionNextStep('cloze-streak')
            : null

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
                gameplayNextStep={nextStep
                    ? {
                        label: `Tiep theo: ${nextStep.title}`,
                        href: nextStep.href.replace('level=A1', `level=${cefrLevel}`),
                        reason: 'Cloze da luyen recall; Boss Review kiem tra mixed mastery truoc khi dua vao speaking.',
                        stepId: nextStep.id,
                    }
                    : undefined}
                onRetry={() => {
                    setCurrentIndex(0); setUserInput(''); setIsRevealed(false)
                    setAnswers([])
                    resetSubmit()
                    resetTimer()
                }}
                onNewTheme={onExit}
            />
        )
    }

    // ─── Render sentence with blank ─────────────────
    const renderSentence = () => {
        const parts = question.sentence.split('_____')
        return (
            <p className="text-xl font-semibold leading-relaxed text-slate-800">
                {parts.map((part, i) => (
                    <span key={i}>
                        <span>{part}</span>
                        {i < parts.length - 1 && (
                            <span className="mx-1 inline-block min-w-[96px] rounded-xl border-2 border-[#60A8E4] bg-[#EEF7FF] px-3 py-1 text-center font-black text-text-brand shadow-inner">
                                {isRevealed
                                    ? userInput
                                    : userInput || '___'
                                }
                            </span>
                        )}
                    </span>
                ))}
            </p>
        )
    }

    const typeColor = WORD_TYPE_COLORS[question.wordType] || 'bg-slate-100 text-slate-600 ring-slate-200'
    const typeLabel = WORD_TYPE_LABELS[question.wordType] || question.wordType

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
                        <p className="text-sm font-black uppercase text-text-brand">Điền từ còn thiếu</p>
                        {/* Word type badge */}
                        <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-black ring-1 ${typeColor}`}>
                            {typeLabel}
                        </span>
                    </div>

                    {/* Sentence card */}
                    <div className="mb-6 rounded-2xl border border-[#60A8E4]/15 bg-white p-6 shadow-lg shadow-sky-900/8">
                        {renderSentence()}

                        {/* Vietnamese translation hint */}
                        {question.translation && (
                            <p className="mt-4 border-t border-[#CCE4F0]/70 pt-3 text-sm font-semibold italic text-slate-500">
                                🇻🇳 {question.translation}
                            </p>
                        )}
                    </div>

                    {/* Feedback */}
                    {isRevealed && (
                        <div className={exerciseHintPanelClass('mb-4 border-[#60A8E4]/25 bg-[#EEF7FF] text-text-brand')}>
                            <span className="text-sm text-text-brand font-semibold">Đã lưu câu trả lời</span>
                        </div>
                    )}

                    {/* Input area */}
                    <div className="mb-4">
                        <input
                            ref={inputRef}
                            type="text"
                            value={userInput}
                            onChange={e => setUserInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isRevealed}
                            placeholder="Viết từ còn thiếu..."
                            autoComplete="off"
                            autoCapitalize="off"
                            spellCheck={false}
                            className={exerciseTextInputClass({
                                revealed: isRevealed,
                                className: 'w-full px-6 py-4 text-lg font-bold text-slate-950 outline-none placeholder:text-slate-300',
                            })}
                        />
                    </div>

                    {/* Special chars */}
                    <div className="mb-4 flex justify-center gap-2">
                        {SPECIAL_CHARS.map(ch => (
                            <button
                                key={ch}
                                onClick={() => insertChar(ch)}
                                disabled={isRevealed}
                                className={exerciseSpecialCharClass()}
                            >
                                {ch}
                            </button>
                        ))}
                    </div>

                    {/* Submit */}
                    <button
                        onClick={checkAnswer}
                        disabled={isRevealed || !userInput.trim()}
                        className={exercisePrimaryActionClass(isRevealed || !userInput.trim(), 'w-full')}
                    >
                        Prüfen
                    </button>
                </div>
            </div>
        </div>
    )
}
