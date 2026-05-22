'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { ExerciseResults } from './exercise-results'
import { useExerciseTimer } from '@/hooks/use-exercise-timer'
import { useSubmitExercise, type ExerciseAnswer } from '@/hooks/use-submit-exercise'
import { getFirstSessionNextStep } from '@/lib/gamification/lesson-gameplay-expansion'
import {
    exerciseOptionClass,
    exerciseScreenClass,
} from './exercise-ui'

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
    meaningNative: string
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
export function SpeedExercise({ questions, cefrLevel, themeName: _themeName, themeSlug, onExit, onComplete: _onComplete }: SpeedExerciseProps) {
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
                        const timeoutCorrect = q?.type === 'de_to_native' ? (q?.meaningNative || '') : (q?.word || '')
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

        const correctAnswer = question.type === 'de_to_native' ? question.meaningNative : question.word
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
        const nextStep = themeSlug === 'a1-person'
            ? getFirstSessionNextStep('speed-match')
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
                        reason: 'Speed Match giup nhan dien nhanh; Cloze Streak chuyen sang recall trong ngu canh.',
                        stepId: nextStep.id,
                    }
                    : undefined}
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
    const countdownColor = countdown > 4 ? '#2EC4B6' : countdown > 2 ? '#FFB703' : '#EF4444'
    const timerTone = countdown > 4
        ? 'bg-[#EAFBF8] text-text-success ring-[#2EC4B6]/30'
        : countdown > 2
            ? 'bg-[#FFF7D6] text-text-warning ring-[#FFD166]/60'
            : 'bg-red-50 text-red-600 ring-red-200/70'
    return (
        <div className={exerciseScreenClass}>
            {/* Top bar */}
            <div className="flex items-center gap-3 border-b border-[#60A8E4]/15 bg-white/95 px-4 py-3 shadow-sm shadow-sky-900/5">
                <button
                    onClick={onExit}
                    aria-label="Close exercise"
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F3FBFF] text-text-brand ring-1 ring-[#60A8E4]/20 transition-colors hover:bg-[#CCE4F0]/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A8E4]/40"
                >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Countdown bar */}
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#CCE4F0]/65">
                    <div
                        className="h-full rounded-full transition-all duration-100 ease-linear"
                        style={{ width: `${countdownPercent}%`, backgroundColor: countdownColor }}
                    />
                </div>

                <span className={`w-14 rounded-full px-2 py-1 text-center text-xs font-black tabular-nums ring-1 ${timerTone}`}>
                    {countdown.toFixed(1)}s
                </span>

                <span className="rounded-full bg-[#EEF7FF] px-2.5 py-1 text-xs font-black text-text-brand ring-1 ring-[#60A8E4]/20">
                    {cefrLevel}
                </span>
            </div>

            {/* Stats row */}
            <div className="flex justify-center gap-4 px-4 py-3">
                {/* Question counter */}
                <span className="self-center rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500 ring-1 ring-[#CCE4F0]">
                    {currentIndex + 1}/{questions.length}
                </span>
            </div>

            {/* Question prompt */}
            <div className="mx-auto w-full max-w-2xl px-5 py-6 sm:px-6">
                <div className="text-center mb-8">
                    <div className="mx-auto mb-4 inline-flex rounded-full bg-[#EAFBF8] px-3 py-1 text-xs font-black uppercase text-text-success ring-1 ring-[#2EC4B6]/30">
                        Speed Challenge
                    </div>
                    <p className="mb-2 text-3xl font-black text-slate-950">{question.prompt || question.word}</p>
                    <p className="text-sm font-semibold text-slate-500">
                        {question.type === 'de_to_native' ? 'Was bedeutet das?' : 'Auf Deutsch?'}
                    </p>
                </div>

                {/* 2x2 grid options */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {question.options.map((option, i) => {
                        const isSelected = selectedAnswer === option

                        return (
                            <button
                                key={i}
                                onClick={() => handleSelect(option)}
                                disabled={isRevealed}
                                className={exerciseOptionClass({
                                    selected: isSelected,
                                    revealed: isRevealed,
                                    className: 'py-5 text-base',
                                })}
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
