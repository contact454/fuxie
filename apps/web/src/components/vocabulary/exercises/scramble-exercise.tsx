'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { ExerciseProgress } from './exercise-progress'
import { ExerciseResults } from './exercise-results'

// ─── Types ──────────────────────────────────────────
interface ScrambleQuestion {
    id: string
    type: string
    scrambledWords: string[]
    correctSentence: string
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
export function ScrambleExercise({ questions, cefrLevel, themeName, themeSlug, onExit, onComplete }: ScrambleExerciseProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [availableWords, setAvailableWords] = useState<string[]>([])
    const [selectedWords, setSelectedWords] = useState<string[]>([])
    const [isRevealed, setIsRevealed] = useState(false)
    const [isCorrect, setIsCorrect] = useState(false)
    const [answers, setAnswers] = useState<Array<{ questionId: string; answer: string; correctAnswer: string }>>([])
    const [phase, setPhase] = useState<'playing' | 'results'>('playing')
    const [submitResult, setSubmitResult] = useState<any>(null)
    const [timer, setTimer] = useState(0)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const question = questions[currentIndex]!

    // Timer
    useEffect(() => {
        timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
        return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }, [])

    // Reset available words on new question
    useEffect(() => {
        setAvailableWords([...question.scrambledWords])
        setSelectedWords([])
    }, [currentIndex, question.scrambledWords])

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
        // Normalize: remove trailing punctuation for comparison
        const normalize = (s: string) => s.replace(/[.!?;,]+$/g, '').trim().toLowerCase()
        const correct = normalize(userSentence) === normalize(question.correctSentence)

        setIsCorrect(correct)
        setIsRevealed(true)

        const newAnswers = [...answers, {
            questionId: question.id,
            answer: userSentence,
            correctAnswer: question.correctSentence,
        }]
        setAnswers(newAnswers)

        setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(i => i + 1)
                setIsRevealed(false)
                setIsCorrect(false)
            } else {
                submitAnswers(newAnswers)
            }
        }, 2500)
    }, [isRevealed, selectedWords, question, answers, currentIndex, questions.length])

    const submitAnswers = async (finalAnswers: typeof answers) => {
        if (timerRef.current) clearInterval(timerRef.current)
        const normalize = (s: string) => s.replace(/[.!?;,]+$/g, '').trim().toLowerCase()
        const localResults = finalAnswers.map(a => ({
            questionId: a.questionId,
            isCorrect: normalize(a.answer) === normalize(a.correctAnswer),
            userAnswer: a.answer,
            correctAnswer: a.correctAnswer,
        }))
        const cc = localResults.filter(r => r.isCorrect).length
        const localFallback = {
            totalQuestions: finalAnswers.length,
            correctCount: cc,
            accuracy: finalAnswers.length > 0 ? (cc / finalAnswers.length) * 100 : 0,
            xpEarned: cc * 8,
            results: localResults,
        }
        try {
            const res = await fetch('/api/v1/vocabulary/practice/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    exerciseType: 'scramble',
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
                    setCurrentIndex(0); setSelectedWords([]); setIsRevealed(false); setIsCorrect(false)
                    setAnswers([]); setPhase('playing'); setSubmitResult(null)
                    setTimer(0); timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
                }}
                onNewTheme={onExit}
            />
        )
    }

    // ─── Playing ────────────────────────────────────
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
                    {/* Instruction */}
                    <div className="text-center mb-6">
                        <h2 className="text-lg font-bold text-gray-800">Ordne die Wörter</h2>
                        <p className="text-sm text-gray-400 mt-1">Bilde den richtigen Satz</p>
                    </div>

                    {/* Vietnamese translation hint */}
                    {question.translation && (
                        <div className="mb-6 p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
                            <span className="text-sm text-amber-700">🇻🇳 {question.translation}</span>
                        </div>
                    )}

                    {/* Construction zone — selected words */}
                    <div className={`min-h-[80px] p-4 mb-6 rounded-2xl border-2 transition-all ${
                        isRevealed
                            ? isCorrect
                                ? 'border-emerald-400 bg-emerald-50'
                                : 'border-red-400 bg-red-50'
                            : selectedWords.length > 0
                                ? 'border-[#004E89] bg-blue-50'
                                : 'border-dashed border-gray-400 bg-gray-50/50'
                    }`}>
                        {selectedWords.length === 0 ? (
                            <p className="text-gray-400 text-center py-2">Tippe auf die Wörter unten</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {selectedWords.map((word, i) => (
                                    <button
                                        key={`sel-${i}`}
                                        onClick={() => removeWord(i)}
                                        disabled={isRevealed}
                                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                            isRevealed
                                                ? isCorrect
                                                    ? 'bg-emerald-200 text-emerald-800'
                                                    : 'bg-red-200 text-red-800'
                                                : 'bg-white text-[#004E89] border-2 border-[#004E89] hover:bg-[#004E89] hover:text-white shadow-sm'
                                        }`}
                                    >
                                        {word}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Feedback */}
                        {isRevealed && (
                            <div className="mt-3 pt-3 border-t border-current/10">
                                {isCorrect ? (
                                    <p className="text-sm text-emerald-600 font-semibold">✅ Richtig!</p>
                                ) : (
                                    <p className="text-sm text-red-600">
                                        ❌ Richtig: <strong>{question.correctSentence}</strong>
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Available word tiles */}
                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                        {availableWords.map((word, i) => (
                            <button
                                key={`avail-${i}-${word}`}
                                onClick={() => addWord(word, i)}
                                disabled={isRevealed}
                                className="px-4 py-2.5 rounded-xl bg-white border-2 border-gray-200 text-gray-700 font-semibold text-sm hover:border-[#004E89] hover:bg-blue-50 hover:text-[#004E89] transition-all shadow-sm disabled:bg-gray-100 disabled:text-gray-300 disabled:border-gray-100 disabled:cursor-not-allowed"
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
                            className="px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-500 text-sm font-medium hover:bg-gray-50 transition-all disabled:bg-gray-100 disabled:text-gray-300 disabled:border-gray-100 disabled:cursor-not-allowed"
                        >
                            🔄 Reset
                        </button>
                        <button
                            onClick={checkAnswer}
                            disabled={isRevealed || selectedWords.length === 0}
                            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                                isRevealed || selectedWords.length === 0
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-[#004E89] to-blue-600 text-white hover:shadow-lg hover:shadow-blue-200 hover:scale-[1.02] active:scale-[0.98]'
                            }`}
                        >
                            Prüfen
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
