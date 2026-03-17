'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { ExerciseProgress } from './exercise-progress'
import { ExerciseResults } from './exercise-results'

// ─── Types ──────────────────────────────────────────
interface MatchPair {
    id: string
    word: string
    meaning: string
    wordId: string
    imageUrl: string | null
}

interface MatchingExerciseProps {
    pairs: MatchPair[]
    cefrLevel: string
    themeName: string
    themeSlug: string
    onExit: () => void
    onComplete: () => void
}

// ─── Component ──────────────────────────────────────
export function MatchingExercise({ pairs, cefrLevel, themeName, themeSlug, onExit, onComplete }: MatchingExerciseProps) {
    const [selectedWord, setSelectedWord] = useState<string | null>(null)
    const [selectedMeaning, setSelectedMeaning] = useState<string | null>(null)
    const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set())
    const [wrongPair, setWrongPair] = useState<{ word: string; meaning: string } | null>(null)
    const [timer, setTimer] = useState(0)
    const [phase, setPhase] = useState<'playing' | 'results'>('playing')
    const [mistakes, setMistakes] = useState(0)
    const [submitResult, setSubmitResult] = useState<{
        totalQuestions: number
        correctCount: number
        accuracy: number
        xpEarned: number
        results: Array<{ questionId: string; isCorrect: boolean; userAnswer: string; correctAnswer: string }>
    } | null>(null)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    // Shuffled columns
    const [shuffledWords] = useState(() =>
        [...pairs].sort(() => Math.random() - 0.5)
    )
    const [shuffledMeanings] = useState(() =>
        [...pairs].sort(() => Math.random() - 0.5)
    )

    // Timer
    useEffect(() => {
        timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
        return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }, [])

    const handleWordClick = useCallback((pairId: string) => {
        if (matchedPairs.has(pairId)) return
        setSelectedWord(pairId)
        setWrongPair(null)

        // Check if meaning already selected
        if (selectedMeaning) {
            checkMatch(pairId, selectedMeaning)
        }
    }, [matchedPairs, selectedMeaning])

    const handleMeaningClick = useCallback((pairId: string) => {
        if (matchedPairs.has(pairId)) return
        setSelectedMeaning(pairId)
        setWrongPair(null)

        // Check if word already selected
        if (selectedWord) {
            checkMatch(selectedWord, pairId)
        }
    }, [matchedPairs, selectedWord])

    const checkMatch = (wordId: string, meaningId: string) => {
        if (wordId === meaningId) {
            // Correct match!
            const newMatched = new Set(matchedPairs)
            newMatched.add(wordId)
            setMatchedPairs(newMatched)
            setSelectedWord(null)
            setSelectedMeaning(null)

            // Check if all matched
            if (newMatched.size === pairs.length) {
                setTimeout(() => finishExercise(newMatched.size), 500)
            }
        } else {
            // Wrong match
            setMistakes(m => m + 1)
            const wordPair = pairs.find(p => p.id === wordId)
            const meaningPair = pairs.find(p => p.id === meaningId)
            setWrongPair({ word: wordId, meaning: meaningId })

            setTimeout(() => {
                setSelectedWord(null)
                setSelectedMeaning(null)
                setWrongPair(null)
            }, 800)
        }
    }

    const finishExercise = async (totalMatched: number) => {
        if (timerRef.current) clearInterval(timerRef.current)

        const totalAttempts = totalMatched + mistakes
        const accuracy = totalAttempts > 0 ? (totalMatched / totalAttempts) * 100 : 100
        const localFallback = {
            totalQuestions: pairs.length,
            correctCount: pairs.length,
            accuracy: Math.round(accuracy),
            xpEarned: pairs.length * 5 + (mistakes === 0 ? 20 : 0),
            results: pairs.map(p => ({
                questionId: p.id,
                isCorrect: true,
                userAnswer: p.meaning,
                correctAnswer: p.meaning,
            })),
        }

        try {
            const answers = pairs.map(p => ({
                questionId: p.id,
                answer: p.meaning,
                correctAnswer: p.meaning,
            }))
            const res = await fetch('/api/v1/vocabulary/practice/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    exerciseType: 'matching',
                    themeSlug,
                    cefrLevel,
                    timeTaken: timer,
                    answers,
                }),
            })
            const data = await res.json()
            if (data.success) {
                setSubmitResult(data.data)
            } else {
                setSubmitResult(localFallback)
            }
        } catch {
            setSubmitResult(localFallback)
        }
        setPhase('results')
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
                    setMatchedPairs(new Set())
                    setSelectedWord(null)
                    setSelectedMeaning(null)
                    setWrongPair(null)
                    setTimer(0)
                    setMistakes(0)
                    setPhase('playing')
                    setSubmitResult(null)
                    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
                }}
                onNewTheme={onExit}
            />
        )
    }

    // ─── Playing Phase ──────────────────────────────
    return (
        <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col">
            {/* Progress */}
            <ExerciseProgress
                current={matchedPairs.size}
                total={pairs.length}
                onClose={onExit}
                timer={timer}
                cefrLevel={cefrLevel}
            />

            <div className="flex-1 flex items-center justify-center overflow-y-auto">
                <div className="max-w-2xl w-full px-6 py-8">
                    {/* Title */}
                    <div className="text-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Finde die Paare</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {matchedPairs.size}/{pairs.length} gefunden
                            {mistakes > 0 && <span className="text-red-400 ml-2">• {mistakes} Fehler</span>}
                        </p>
                    </div>

                    {/* Two columns */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* German words column */}
                        <div className="space-y-3">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-center mb-2">Deutsch</p>
                            {shuffledWords.map(pair => {
                                const isMatched = matchedPairs.has(pair.id)
                                const isSelected = selectedWord === pair.id
                                const isWrong = wrongPair?.word === pair.id

                                let cardClass = 'border-2 border-gray-200 bg-white text-gray-800 hover:border-[#004E89] hover:shadow-sm'
                                if (isMatched) cardClass = 'border-2 border-emerald-300 bg-emerald-50 text-emerald-600 opacity-60'
                                else if (isWrong) cardClass = 'border-2 border-red-400 bg-red-50 text-red-600 animate-shake'
                                else if (isSelected) cardClass = 'border-2 border-[#004E89] bg-blue-50 text-[#004E89] shadow-md ring-2 ring-blue-200'

                                return (
                                    <button
                                        key={`w-${pair.id}`}
                                        onClick={() => handleWordClick(pair.id)}
                                        disabled={isMatched}
                                        className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm transition-all ${cardClass}`}
                                    >
                                        {isMatched && <span className="mr-1">✓</span>}
                                        {pair.word}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Vietnamese meanings column */}
                        <div className="space-y-3">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-center mb-2">Tiếng Việt</p>
                            {shuffledMeanings.map(pair => {
                                const isMatched = matchedPairs.has(pair.id)
                                const isSelected = selectedMeaning === pair.id
                                const isWrong = wrongPair?.meaning === pair.id

                                let cardClass = 'border-2 border-gray-200 bg-white text-gray-800 hover:border-[#FF6B35] hover:shadow-sm'
                                if (isMatched) cardClass = 'border-2 border-emerald-300 bg-emerald-50 text-emerald-600 opacity-60'
                                else if (isWrong) cardClass = 'border-2 border-red-400 bg-red-50 text-red-600 animate-shake'
                                else if (isSelected) cardClass = 'border-2 border-[#FF6B35] bg-orange-50 text-[#FF6B35] shadow-md ring-2 ring-orange-200'

                                return (
                                    <button
                                        key={`m-${pair.id}`}
                                        onClick={() => handleMeaningClick(pair.id)}
                                        disabled={isMatched}
                                        className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm transition-all ${cardClass}`}
                                    >
                                        {isMatched && <span className="mr-1">✓</span>}
                                        {pair.meaning}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
