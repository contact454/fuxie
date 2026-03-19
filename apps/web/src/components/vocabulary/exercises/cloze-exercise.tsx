'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { ExerciseProgress } from './exercise-progress'
import { ExerciseResults } from './exercise-results'
import { useExerciseTimer } from '@/hooks/use-exercise-timer'
import { useSubmitExercise, type ExerciseAnswer } from '@/hooks/use-submit-exercise'

// ─── Types ──────────────────────────────────────────
interface ClozeQuestion {
    id: string
    type: string
    sentence: string         // "Lisa _____ heute Nachmittag in den Supermarkt"
    translation: string | null // Vietnamese translation
    correctAnswer: string    // "geht"
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
    NOMEN: 'bg-blue-100 text-blue-700',
    VERB: 'bg-green-100 text-green-700',
    ADJEKTIV: 'bg-purple-100 text-purple-700',
    ADVERB: 'bg-teal-100 text-teal-700',
    PRAEPOSITION: 'bg-orange-100 text-orange-700',
    PHRASE: 'bg-pink-100 text-pink-700',
}

// ─── Component ──────────────────────────────────────
export function ClozeExercise({ questions, cefrLevel, themeName, themeSlug, onExit, onComplete }: ClozeExerciseProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [userInput, setUserInput] = useState('')
    const [isRevealed, setIsRevealed] = useState(false)
    const [isCorrect, setIsCorrect] = useState(false)
    const [answers, setAnswers] = useState<ExerciseAnswer[]>([])
    const inputRef = useRef<HTMLInputElement>(null)

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
        setTimeout(() => inputRef.current?.focus(), 100)
    }, [currentIndex])

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

        // Auto advance
        setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(i => i + 1)
                setUserInput('')
                setIsRevealed(false)
                setIsCorrect(false)
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
            <p className="text-xl leading-relaxed text-gray-800">
                {parts.map((part, i) => (
                    <span key={i}>
                        <span>{part}</span>
                        {i < parts.length - 1 && (
                            <span className={`inline-block mx-1 px-2 py-0.5 rounded-lg border-b-2 font-bold min-w-[80px] text-center ${
                                isRevealed
                                    ? isCorrect
                                        ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
                                        : 'bg-red-100 border-red-400 text-red-700'
                                    : 'bg-blue-100 border-[#004E89] text-[#004E89]'
                            }`}>
                                {isRevealed
                                    ? isCorrect ? userInput : question.correctAnswer
                                    : userInput || '___'
                                }
                            </span>
                        )}
                    </span>
                ))}
            </p>
        )
    }

    const typeColor = WORD_TYPE_COLORS[question.wordType] || 'bg-gray-100 text-gray-600'
    const typeLabel = WORD_TYPE_LABELS[question.wordType] || question.wordType

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
                        <p className="text-sm text-gray-400 uppercase tracking-wider font-semibold">Ergänze das fehlende Wort</p>
                        {/* Word type badge */}
                        <span className={`inline-block mt-2 px-3 py-1 rounded-lg text-xs font-bold ${typeColor}`}>
                            {typeLabel}
                        </span>
                    </div>

                    {/* Sentence card */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
                        {renderSentence()}

                        {/* Vietnamese translation hint */}
                        {question.translation && (
                            <p className="mt-4 text-sm text-gray-400 italic border-t border-gray-100 pt-3">
                                🇻🇳 {question.translation}
                            </p>
                        )}
                    </div>

                    {/* Feedback */}
                    {isRevealed && !isCorrect && (
                        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-center">
                            <span className="text-sm text-red-600">
                                Deine Antwort: <span className="line-through">{userInput}</span> → Richtig: <strong>{question.correctAnswer}</strong>
                            </span>
                        </div>
                    )}
                    {isRevealed && isCorrect && (
                        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                            <span className="text-sm text-emerald-600 font-semibold">✅ Richtig!</span>
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
                            placeholder="Schreibe das fehlende Wort..."
                            autoComplete="off"
                            autoCapitalize="off"
                            spellCheck={false}
                            className={`w-full py-4 px-6 text-lg font-semibold rounded-2xl border-2 outline-none transition-all ${
                                isRevealed
                                    ? isCorrect
                                        ? 'border-emerald-400 bg-emerald-50'
                                        : 'border-red-400 bg-red-50'
                                    : 'border-gray-200 bg-white focus:border-[#004E89] focus:shadow-lg focus:shadow-blue-100'
                            }`}
                        />
                    </div>

                    {/* Special chars */}
                    <div className="flex justify-center gap-2 mb-4">
                        {SPECIAL_CHARS.map(ch => (
                            <button
                                key={ch}
                                onClick={() => insertChar(ch)}
                                disabled={isRevealed}
                                className="w-10 h-10 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-bold hover:border-[#004E89] hover:bg-blue-50 transition-all disabled:bg-gray-100 disabled:text-gray-300 disabled:border-gray-100 disabled:cursor-not-allowed"
                            >
                                {ch}
                            </button>
                        ))}
                    </div>

                    {/* Submit */}
                    <button
                        onClick={checkAnswer}
                        disabled={isRevealed || !userInput.trim()}
                        className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${
                            isRevealed || !userInput.trim()
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-[#004E89] to-blue-600 text-white hover:shadow-lg hover:shadow-blue-200 hover:scale-[1.02] active:scale-[0.98]'
                        }`}
                    >
                        Prüfen
                    </button>
                </div>
            </div>
        </div>
    )
}
