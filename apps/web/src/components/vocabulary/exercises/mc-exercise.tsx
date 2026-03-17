'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { ExerciseProgress } from './exercise-progress'
import { ExerciseResults } from './exercise-results'

// ─── Types ──────────────────────────────────────────
interface McQuestion {
    id: string
    type: string // 'de_to_vi' | 'vi_to_de' | 'image_to_word' | 'audio_to_word'
    prompt: string
    promptImage: string | null
    promptAudio: string | null
    correctAnswer: string
    options: string[]
    wordId: string
    word: string
    meaningVi: string
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

// ─── Audio utils ────────────────────────────────────
function playAudio(url: string | null) {
    if (!url) return
    try {
        const audio = new Audio(url)
        audio.play().catch(() => {})
    } catch { /* silent */ }
}

// ─── Component ──────────────────────────────────────
export function McExercise({ questions, cefrLevel, themeName, themeSlug, onExit, onComplete }: McExerciseProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
    const [isRevealed, setIsRevealed] = useState(false)
    const [answers, setAnswers] = useState<Array<{ questionId: string; answer: string; correctAnswer: string }>>([])
    const [phase, setPhase] = useState<'playing' | 'results'>('playing')
    const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null)
    const [timer, setTimer] = useState(0)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const question = questions[currentIndex]!

    // Timer
    useEffect(() => {
        timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
        return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }, [])

    // Auto play audio for audio_to_word variant
    useEffect(() => {
        if (question.type === 'audio_to_word' && question.promptAudio) {
            playAudio(question.promptAudio)
        }
    }, [currentIndex, question.type, question.promptAudio])

    const handleSelect = useCallback((option: string) => {
        if (isRevealed) return
        setSelectedAnswer(option)
        setIsRevealed(true)

        const newAnswers = [...answers, {
            questionId: question.id,
            answer: option,
            correctAnswer: question.correctAnswer,
        }]
        setAnswers(newAnswers)

        // Auto-advance after 1.5s
        setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(i => i + 1)
                setSelectedAnswer(null)
                setIsRevealed(false)
            } else {
                // Submit
                submitAnswers(newAnswers)
            }
        }, 1500)
    }, [isRevealed, answers, currentIndex, questions.length, question])

    const submitAnswers = async (finalAnswers: typeof answers) => {
        if (timerRef.current) clearInterval(timerRef.current)
        setIsSubmitting(true)

        // Build local results as fallback
        const localResults = finalAnswers.map(a => ({
            questionId: a.questionId,
            isCorrect: a.answer === a.correctAnswer,
            userAnswer: a.answer,
            correctAnswer: a.correctAnswer,
        }))
        const localCorrectCount = localResults.filter(r => r.isCorrect).length
        const localFallback: SubmitResult = {
            totalQuestions: finalAnswers.length,
            correctCount: localCorrectCount,
            accuracy: finalAnswers.length > 0 ? (localCorrectCount / finalAnswers.length) * 100 : 0,
            xpEarned: localCorrectCount * 5,
            results: localResults,
        }

        try {
            const res = await fetch('/api/v1/vocabulary/practice/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    exerciseType: 'mc',
                    themeSlug,
                    cefrLevel,
                    timeTaken: timer,
                    answers: finalAnswers,
                }),
            })
            const data = await res.json()
            if (data.success) {
                setSubmitResult(data.data)
            } else {
                // API returned error — use local fallback
                console.warn('Submit API returned error, using local results:', data)
                setSubmitResult(localFallback)
            }
        } catch (err) {
            console.error('Submit fetch failed:', err)
            setSubmitResult(localFallback)
        } finally {
            setIsSubmitting(false)
            setPhase('results')
        }
    }

    // ─── Variant Labels ─────────────────────────────
    const getQuestionLabel = () => {
        switch (question.type) {
            case 'de_to_vi': return `Was bedeutet "${question.prompt}"?`
            case 'vi_to_de': return `"${question.prompt}" auf Deutsch?`
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
                timeTaken={timer}
                results={submitResult.results}
                onRetry={() => {
                    setCurrentIndex(0)
                    setSelectedAnswer(null)
                    setIsRevealed(false)
                    setAnswers([])
                    setPhase('playing')
                    setSubmitResult(null)
                    setTimer(0)
                    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
                }}
                onNewTheme={onExit}
            />
        )
    }

    // ─── Playing Phase ──────────────────────────────
    return (
        <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col">
            {/* Progress bar */}
            <ExerciseProgress
                current={currentIndex + 1}
                total={questions.length}
                onClose={onExit}
                timer={timer}
                cefrLevel={cefrLevel}
            />

            {/* Exercise content — vertically centered */}
            <div className="flex-1 flex items-center justify-center overflow-y-auto">
                <div className="max-w-2xl w-full px-6 py-8">
                    {/* Prompt area */}
                    <div className="text-center mb-8">
                        {/* Image prompt (image_to_word only) */}
                        {question.type === 'image_to_word' && question.promptImage && (
                            <div className="mb-4 flex justify-center">
                                <img
                                    src={question.promptImage}
                                    alt="Vocabulary image"
                                    className="w-40 h-40 rounded-2xl object-cover shadow-md"
                                />
                            </div>
                        )}

                        {/* Audio prompt (audio_to_word only) */}
                        {question.type === 'audio_to_word' && (
                            <button
                                onClick={() => playAudio(question.promptAudio)}
                                className="mb-4 w-24 h-24 rounded-full bg-gradient-to-br from-[#004E89] to-blue-600 text-white flex items-center justify-center mx-auto shadow-lg hover:scale-105 transition-transform"
                            >
                                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                                </svg>
                            </button>
                        )}

                        {/* Text prompt (de_to_vi, vi_to_de) */}
                        {(question.type === 'de_to_vi' || question.type === 'vi_to_de') && (
                            <div className="mb-4">
                                <p className="text-3xl font-black text-gray-900">{question.prompt}</p>
                                {/* Audio button for de_to_vi */}
                                {question.type === 'de_to_vi' && question.promptAudio && (
                                    <button
                                        onClick={() => playAudio(question.promptAudio)}
                                        className="mt-2 inline-flex items-center gap-1 text-[#004E89] hover:text-blue-700 transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                                        </svg>
                                        <span className="text-sm font-medium">Anhören</span>
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Question label */}
                        <p className="text-gray-500 text-sm">{getQuestionLabel()}</p>
                    </div>

                    {/* Options — 2×2 grid */}
                    <div className="grid grid-cols-2 gap-3">
                        {question.options.map((option, i) => {
                            const isSelected = selectedAnswer === option
                            const isCorrect = option === question.correctAnswer
                            let btnClass = 'bg-white border-2 border-gray-200 text-gray-800 hover:border-[#004E89] hover:bg-blue-50 hover:shadow-md'

                            if (isRevealed) {
                                if (isCorrect) {
                                    btnClass = 'bg-emerald-50 border-2 border-emerald-400 text-emerald-800 shadow-emerald-100 shadow-md'
                                } else if (isSelected && !isCorrect) {
                                    btnClass = 'bg-red-50 border-2 border-red-400 text-red-800'
                                } else {
                                    btnClass = 'bg-gray-50 border-2 border-gray-100 text-gray-400'
                                }
                            }

                            return (
                                <button
                                    key={i}
                                    onClick={() => handleSelect(option)}
                                    disabled={isRevealed}
                                    className={`py-4 px-5 rounded-xl font-semibold text-base transition-all text-center ${btnClass}`}
                                >
                                    {isRevealed && isCorrect && (
                                        <span className="text-emerald-500 mr-1">✓</span>
                                    )}
                                    {isRevealed && isSelected && !isCorrect && (
                                        <span className="text-red-500 mr-1">✗</span>
                                    )}
                                    <span>{option}</span>
                                </button>
                            )
                        })}
                    </div>

                    {/* Loading indicator */}
                    {isSubmitting && (
                        <div className="text-center mt-8 text-gray-400">
                            <div className="inline-flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-gray-300 border-t-[#004E89] rounded-full animate-spin" />
                                Wird ausgewertet...
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
