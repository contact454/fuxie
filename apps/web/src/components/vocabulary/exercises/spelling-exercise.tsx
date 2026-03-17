'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { ExerciseProgress } from './exercise-progress'
import { ExerciseResults } from './exercise-results'

// ─── Types ──────────────────────────────────────────
interface SpellingQuestion {
    id: string
    type: string
    prompt: string           // Vietnamese meaning
    promptImage: string | null
    promptAudio: string | null
    correctAnswer: string    // German word
    article: string | null   // MASKULIN / FEMININ / NEUTRUM
    wordId: string
    hint: string             // first 2 chars
}

interface SpellingExerciseProps {
    questions: SpellingQuestion[]
    cefrLevel: string
    themeName: string
    themeSlug: string
    onExit: () => void
    onComplete: () => void
}

// German special characters keyboard
const SPECIAL_CHARS = ['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü']

function playAudio(url: string | null) {
    if (!url) return
    try { new Audio(url).play().catch(() => {}) } catch { /* silent */ }
}

// ─── Component ──────────────────────────────────────
export function SpellingExercise({ questions, cefrLevel, themeName, themeSlug, onExit, onComplete }: SpellingExerciseProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [userInput, setUserInput] = useState('')
    const [isRevealed, setIsRevealed] = useState(false)
    const [isCorrect, setIsCorrect] = useState(false)
    const [showHint, setShowHint] = useState(false)
    const [answers, setAnswers] = useState<Array<{ questionId: string; answer: string; correctAnswer: string }>>([])
    const [phase, setPhase] = useState<'playing' | 'results'>('playing')
    const [submitResult, setSubmitResult] = useState<any>(null)
    const [timer, setTimer] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const question = questions[currentIndex]!

    // Timer
    useEffect(() => {
        timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
        return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }, [])

    // Focus input on new question
    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 100)
    }, [currentIndex])

    const getArticle = (article: string | null) => {
        if (!article) return ''
        switch (article) {
            case 'MASKULIN': return 'der'
            case 'FEMININ': return 'die'
            case 'NEUTRUM': return 'das'
            default: return ''
        }
    }

    const checkAnswer = useCallback(() => {
        if (isRevealed || !userInput.trim()) return

        const correct = userInput.trim().toLowerCase() === question.correctAnswer.toLowerCase()
        setIsCorrect(correct)
        setIsRevealed(true)

        const newAnswers = [...answers, {
            questionId: question.id,
            answer: userInput.trim(),
            correctAnswer: question.correctAnswer,
        }]
        setAnswers(newAnswers)

        // Auto advance after 2s
        setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(i => i + 1)
                setUserInput('')
                setIsRevealed(false)
                setIsCorrect(false)
                setShowHint(false)
            } else {
                submitAnswers(newAnswers)
            }
        }, 2000)
    }, [isRevealed, userInput, question, answers, currentIndex, questions.length])

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

    const submitAnswers = async (finalAnswers: typeof answers) => {
        if (timerRef.current) clearInterval(timerRef.current)
        const localResults = finalAnswers.map(a => ({
            questionId: a.questionId,
            isCorrect: a.answer.toLowerCase() === a.correctAnswer.toLowerCase(),
            userAnswer: a.answer,
            correctAnswer: a.correctAnswer,
        }))
        const cc = localResults.filter(r => r.isCorrect).length
        const localFallback = {
            totalQuestions: finalAnswers.length,
            correctCount: cc,
            accuracy: finalAnswers.length > 0 ? (cc / finalAnswers.length) * 100 : 0,
            xpEarned: cc * 7,
            results: localResults,
        }
        try {
            const res = await fetch('/api/v1/vocabulary/practice/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    exerciseType: 'spelling',
                    themeSlug,
                    cefrLevel,
                    timeTaken: timer,
                    answers: finalAnswers,
                }),
            })
            const data = await res.json()
            if (data.success) setSubmitResult(data.data)
            else setSubmitResult(localFallback)
        } catch {
            setSubmitResult(localFallback)
        }
        setPhase('results')
    }

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
                    setCurrentIndex(0); setUserInput(''); setIsRevealed(false); setIsCorrect(false)
                    setShowHint(false); setAnswers([]); setPhase('playing'); setSubmitResult(null)
                    setTimer(0); timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
                }}
                onNewTheme={onExit}
            />
        )
    }

    // ─── Playing ────────────────────────────────────
    const articleText = getArticle(question.article)

    return (
        <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col">
            <ExerciseProgress
                current={currentIndex + 1}
                total={questions.length}
                onClose={onExit}
                timer={timer}
                cefrLevel={cefrLevel}
            />

            <div className="flex-1 flex items-center justify-center overflow-y-auto">
                <div className="max-w-2xl w-full px-6 py-8">
                    {/* Prompt area */}
                    <div className="text-center mb-8">
                        {/* Image */}
                        {question.promptImage && (
                            <div className="mb-4 flex justify-center">
                                <img
                                    src={question.promptImage}
                                    alt="Vocabulary hint"
                                    className="w-44 h-44 rounded-2xl object-cover shadow-md"
                                />
                            </div>
                        )}

                        {/* Audio button */}
                        {question.promptAudio && (
                            <button
                                onClick={() => playAudio(question.promptAudio)}
                                className="mb-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-[#004E89] hover:bg-blue-100 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                                </svg>
                                Anhören
                            </button>
                        )}

                        {/* Vietnamese meaning */}
                        <p className="text-2xl font-bold text-gray-800 mb-1">{question.prompt}</p>
                        <p className="text-sm text-gray-400">Schreibe das deutsche Wort</p>

                        {/* Article badge if noun */}
                        {articleText && (
                            <span className="inline-block mt-2 px-3 py-1 rounded-lg bg-blue-100 text-[#004E89] text-sm font-bold">
                                {articleText} ...
                            </span>
                        )}
                    </div>

                    {/* Input */}
                    <div className="mb-4">
                        <div className={`relative rounded-2xl border-2 transition-all overflow-hidden ${
                            isRevealed
                                ? isCorrect
                                    ? 'border-emerald-400 bg-emerald-50'
                                    : 'border-red-400 bg-red-50'
                                : 'border-gray-200 bg-white focus-within:border-[#004E89] focus-within:shadow-lg focus-within:shadow-blue-100'
                        }`}>
                            <input
                                ref={inputRef}
                                type="text"
                                value={userInput}
                                onChange={e => setUserInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isRevealed}
                                placeholder="Tippe das Wort..."
                                autoComplete="off"
                                autoCapitalize="off"
                                spellCheck={false}
                                className="w-full py-4 px-6 text-xl font-semibold text-center bg-transparent outline-none placeholder-gray-300"
                            />
                            {isRevealed && (
                                <div className="text-center pb-3">
                                    {isCorrect ? (
                                        <span className="text-emerald-600 font-bold text-sm">✅ Richtig!</span>
                                    ) : (
                                        <span className="text-red-600 text-sm">
                                            ❌ Richtig: <strong>{articleText ? `${articleText} ${question.correctAnswer}` : question.correctAnswer}</strong>
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Special chars keyboard */}
                    <div className="flex justify-center gap-2 mb-4">
                        {SPECIAL_CHARS.map(ch => (
                            <button
                                key={ch}
                                onClick={() => insertChar(ch)}
                                disabled={isRevealed}
                                className="w-10 h-10 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-bold text-base hover:border-[#004E89] hover:bg-blue-50 transition-all disabled:bg-gray-100 disabled:text-gray-300 disabled:border-gray-100 disabled:cursor-not-allowed"
                            >
                                {ch}
                            </button>
                        ))}
                    </div>

                    {/* Hint + Submit row */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowHint(true)}
                            disabled={isRevealed || showHint}
                            className="px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-500 text-sm font-medium hover:bg-gray-50 transition-all disabled:bg-gray-100 disabled:text-gray-300 disabled:border-gray-100 disabled:cursor-not-allowed"
                        >
                            💡 Tipp
                        </button>
                        <button
                            onClick={checkAnswer}
                            disabled={isRevealed || !userInput.trim()}
                            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                                isRevealed || !userInput.trim()
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-[#004E89] to-blue-600 text-white hover:shadow-lg hover:shadow-blue-200 hover:scale-[1.02] active:scale-[0.98]'
                            }`}
                        >
                            Prüfen
                        </button>
                    </div>

                    {/* Hint display */}
                    {showHint && !isRevealed && (
                        <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
                            <span className="text-sm text-amber-700">
                                💡 Anfang: <strong>{question.hint}...</strong>
                                <span className="text-amber-400 ml-2">({question.correctAnswer.length} Buchstaben)</span>
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
