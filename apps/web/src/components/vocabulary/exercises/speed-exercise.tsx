'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { ExerciseResults } from './exercise-results'
import { useExerciseTimer } from '@/hooks/use-exercise-timer'
import { useSubmitExercise, type ExerciseAnswer } from '@/hooks/use-submit-exercise'

// ─── Types ──────────────────────────────────────────
interface SpeedQuestion {
    id: string
    type: string
    prompt: string
    promptImage: string | null
    promptAudio: string | null
    options: string[]
    wordId: string
    word: string
    meaningVi: string
}

interface SpeedExerciseProps {
    questions: SpeedQuestion[]
    cefrLevel: string
    themeName: string
    themeSlug: string
    onExit: () => void
    onComplete: () => void
}

const COUNTDOWN_MAX = 8 // seconds per question

// ─── Component ──────────────────────────────────────
export function SpeedExercise({ questions, cefrLevel, themeName, themeSlug, onExit, onComplete }: SpeedExerciseProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
    const [isRevealed, setIsRevealed] = useState(false)
    const [countdown, setCountdown] = useState(COUNTDOWN_MAX)
    const [answers, setAnswers] = useState<ExerciseAnswer[]>([])
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const submitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Use shared hooks — same as other 5 exercises
    const { timer, stopTimer, resetTimer } = useExerciseTimer()
    const { submitResult, phase, submitAnswers, resetSubmit } = useSubmitExercise({
        exerciseType: 'speed',
        themeSlug,
        cefrLevel,
        xpPerCorrect: 10,
    })

    const question = questions[currentIndex]

    // Refs for countdown closure (speed-specific: 0.1s intervals need fresh state)
    const currentIndexRef = useRef(currentIndex)
    const answersRef = useRef(answers)
    const isRevealedRef = useRef(isRevealed)
    const questionRef = useRef(question)
    currentIndexRef.current = currentIndex
    answersRef.current = answers
    isRevealedRef.current = isRevealed
    questionRef.current = question

    const timerRef = useRef(timer)
    timerRef.current = timer

    // Countdown per question — speed-specific logic (0.1s tick, auto-timeout)
    useEffect(() => {
        setCountdown(COUNTDOWN_MAX)
        if (countdownRef.current) clearInterval(countdownRef.current)
        if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current)
        countdownRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 0.1) {
                    // Time's up — use refs for fresh state
                    if (!isRevealedRef.current) {
                        setIsRevealed(true)
                        const q = questionRef.current
                        const timeoutCorrect = q?.type === 'de_to_vi' ? (q?.meaningVi || '') : (q?.word || '')
                        const newAnswers: ExerciseAnswer[] = [...answersRef.current, {
                            questionId: q?.id || '',
                            answer: '__timeout__',
                            correctAnswer: timeoutCorrect,
                            wordId: q?.wordId,
                            questionType: q?.type,
                        }]
                        setAnswers(newAnswers)
                        // Advance or finish
                        if (currentIndexRef.current < questions.length - 1) {
                            setCurrentIndex(i => i + 1)
                            setSelectedAnswer(null)
                            setIsRevealed(false)
                        } else {
                            if (countdownRef.current) clearInterval(countdownRef.current)
                            stopTimer()
                            submitTimeoutRef.current = setTimeout(() => {
                                submitAnswers(newAnswers, timerRef.current)
                            }, 0)
                        }
                    }
                    return COUNTDOWN_MAX
                }
                return Number((prev - 0.1).toFixed(1))
            })
        }, 100)
        return () => {
            if (countdownRef.current) clearInterval(countdownRef.current)
            if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current)
        }
    }, [currentIndex, questions.length, stopTimer, submitAnswers])

    useEffect(() => {
        return () => {
            if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current)
            if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current)
        }
    }, [])

    const handleSelect = useCallback((option: string) => {
        if (isRevealed || !question) return
        if (countdownRef.current) clearInterval(countdownRef.current)
        setSelectedAnswer(option)
        setIsRevealed(true)

        const correctAnswer = question.type === 'de_to_vi' ? question.meaningVi : question.word
        const newAnswers: ExerciseAnswer[] = [...answers, {
            questionId: question.id,
            answer: option,
            correctAnswer,
            wordId: question.wordId,
            questionType: question.type,
        }]
        setAnswers(newAnswers)

        if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current)
        advanceTimeoutRef.current = setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(i => i + 1)
                setSelectedAnswer(null)
                setIsRevealed(false)
            } else {
                stopTimer()
                submitAnswers(newAnswers, timerRef.current)
            }
        }, 800)
    }, [isRevealed, question, answers, currentIndex, questions.length, stopTimer, submitAnswers])

    // ─── Results ────────────────────────────────────
    if (phase === 'results' && submitResult) {
        return (
            <ExerciseResults
                totalQuestions={submitResult.totalQuestions}
                correctCount={submitResult.correctCount}
                accuracy={submitResult.accuracy}
                xpEarned={submitResult.xpEarned}
                timeTaken={timer}
                results={submitResult.results}
                onRetry={() => {
                    setCurrentIndex(0); setSelectedAnswer(null); setIsRevealed(false)
                    setCountdown(COUNTDOWN_MAX)
                    setAnswers([])
                    resetSubmit()
                    resetTimer()
                }}
                onNewTheme={onExit}
            />
        )
    }

    if (!question) return null

    // ─── UI Calculations ────────────────────────────
    const countdownPercent = (countdown / COUNTDOWN_MAX) * 100
    const countdownColor = countdown > 4 ? '#10B981' : countdown > 2 ? '#F59E0B' : '#EF4444'
    return (
        <div className="fixed inset-0 z-50 bg-gray-900 text-white flex flex-col">
            {/* Top bar */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-800 border-b border-gray-700">
                <button
                    onClick={onExit}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700 transition-colors text-gray-400"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Countdown bar */}
                <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-100 ease-linear"
                        style={{ width: `${countdownPercent}%`, backgroundColor: countdownColor }}
                    />
                </div>

                <span className="text-sm font-mono text-gray-400 w-10 text-right">
                    {countdown.toFixed(1)}s
                </span>

                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-600">
                    {cefrLevel}
                </span>
            </div>

            {/* Stats row */}
            <div className="flex justify-center gap-4 px-4 py-3">
                {/* Question counter */}
                <span className="text-xs text-gray-500 font-mono self-center">
                    {currentIndex + 1}/{questions.length}
                </span>
            </div>

            {/* Question prompt */}
            <div className="max-w-xl mx-auto px-4 py-6">
                <div className="text-center mb-8">
                    <p className="text-3xl font-black text-white mb-2">{question.prompt || question.word}</p>
                    <p className="text-sm text-gray-500">
                        {question.type === 'de_to_vi' ? 'Was bedeutet das?' : 'Auf Deutsch?'}
                    </p>
                </div>

                {/* 2x2 grid options */}
                <div className="grid grid-cols-2 gap-3">
                    {question.options.map((option, i) => {
                        const isSelected = selectedAnswer === option

                        let btnClass = 'bg-gray-800 border-2 border-gray-700 text-gray-200 hover:border-blue-500 hover:bg-gray-750'
                        if (isRevealed) {
                            btnClass = isSelected
                                ? 'bg-blue-900/50 border-2 border-blue-500 text-blue-300'
                                : 'bg-gray-800/50 border-2 border-gray-700 text-gray-600'
                        }

                        return (
                            <button
                                key={i}
                                onClick={() => handleSelect(option)}
                                disabled={isRevealed}
                                className={`py-4 px-4 rounded-xl font-bold text-sm transition-all ${btnClass}`}
                            >
                                {option}
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
