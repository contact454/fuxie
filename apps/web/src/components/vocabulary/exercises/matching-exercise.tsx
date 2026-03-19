'use client'

import { useState, useCallback } from 'react'
import { ExerciseProgress } from './exercise-progress'
import { ExerciseResults } from './exercise-results'
import { useExerciseTimer } from '@/hooks/use-exercise-timer'
import { useSubmitExercise } from '@/hooks/use-submit-exercise'
import type { ExerciseAnswer } from '@/hooks/use-submit-exercise'

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
    const [mistakes, setMistakes] = useState(0)

    const { timer, stopTimer, resetTimer } = useExerciseTimer()
    const { submitResult, phase, submitAnswers, resetSubmit } = useSubmitExercise({
        exerciseType: 'matching',
        themeSlug,
        cefrLevel,
        xpPerCorrect: 5,
    })

    // Shuffled columns
    const [shuffledWords] = useState(() =>
        [...pairs].sort(() => Math.random() - 0.5)
    )
    const [shuffledMeanings] = useState(() =>
        [...pairs].sort(() => Math.random() - 0.5)
    )

    const finishExercise = useCallback(async () => {
        stopTimer()

        const answers: ExerciseAnswer[] = pairs.map(p => ({
            questionId: p.id,
            answer: p.meaning,
            correctAnswer: p.meaning,
        }))

        await submitAnswers(answers, timer)
    }, [stopTimer, pairs, submitAnswers, timer])

    const checkMatch = useCallback((wordId: string, meaningId: string) => {
        if (wordId === meaningId) {
            // Correct match!
            const newMatched = new Set(matchedPairs)
            newMatched.add(wordId)
            setMatchedPairs(newMatched)
            setSelectedWord(null)
            setSelectedMeaning(null)

            // Check if all matched
            if (newMatched.size === pairs.length) {
                setTimeout(() => finishExercise(), 500)
            }
        } else {
            // Wrong match
            setMistakes(m => m + 1)
            setWrongPair({ word: wordId, meaning: meaningId })

            setTimeout(() => {
                setSelectedWord(null)
                setSelectedMeaning(null)
                setWrongPair(null)
            }, 800)
        }
    }, [matchedPairs, pairs.length, finishExercise])

    const handleWordClick = useCallback((pairId: string) => {
        if (matchedPairs.has(pairId)) return
        setSelectedWord(pairId)
        setWrongPair(null)

        // Check if meaning already selected
        if (selectedMeaning) {
            checkMatch(pairId, selectedMeaning)
        }
    }, [matchedPairs, selectedMeaning, checkMatch])

    const handleMeaningClick = useCallback((pairId: string) => {
        if (matchedPairs.has(pairId)) return
        setSelectedMeaning(pairId)
        setWrongPair(null)

        // Check if word already selected
        if (selectedWord) {
            checkMatch(selectedWord, pairId)
        }
    }, [matchedPairs, selectedWord, checkMatch])

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
                    setMistakes(0)
                    resetSubmit()
                    resetTimer()
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
