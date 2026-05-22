'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { ExerciseProgress } from './exercise-progress'
import { ExerciseResults } from './exercise-results'
import { useExerciseTimer } from '@/hooks/use-exercise-timer'
import { useSubmitExercise } from '@/hooks/use-submit-exercise'
import type { ExerciseAnswer } from '@/hooks/use-submit-exercise'
import {
    exerciseCenterStageClass,
    exercisePairCardClass,
    exerciseScreenClass,
    exerciseStageInnerClass,
} from './exercise-ui'

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

function stableShuffle<T extends { id: string }>(items: T[], salt: string) {
    const hash = (value: string) => {
        let result = 0
        for (let i = 0; i < value.length; i++) {
            result = (result * 31 + value.charCodeAt(i)) >>> 0
        }
        return result
    }

    return [...items].sort((a, b) => {
        const scoreA = hash(`${salt}:${a.id}`)
        const scoreB = hash(`${salt}:${b.id}`)
        return scoreA - scoreB || a.id.localeCompare(b.id)
    })
}

// ─── Component ──────────────────────────────────────
export function MatchingExercise({ pairs, cefrLevel, themeName: _themeName, themeSlug, onExit, onComplete: _onComplete }: MatchingExerciseProps) {
    const [selectedWord, setSelectedWord] = useState<string | null>(null)
    const [selectedMeaning, setSelectedMeaning] = useState<string | null>(null)
    const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set())
    const [wrongPair, setWrongPair] = useState<{ word: string; meaning: string } | null>(null)
    const [mistakes, setMistakes] = useState(0)
    const finishTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const wrongPairTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const { timer, stopTimer, resetTimer } = useExerciseTimer()
    const { submitResult, phase, submitAnswers, resetSubmit } = useSubmitExercise({
        exerciseType: 'matching',
        themeSlug,
        cefrLevel,
        xpPerCorrect: 5,
    })

    const shuffledWords = useMemo(() => stableShuffle(pairs, 'words'), [pairs])
    const shuffledMeanings = useMemo(() => stableShuffle(pairs, 'meanings'), [pairs])

    useEffect(() => {
        return () => {
            if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current)
            if (wrongPairTimeoutRef.current) clearTimeout(wrongPairTimeoutRef.current)
        }
    }, [])

    const finishExercise = useCallback(async () => {
        stopTimer()

        const answers: ExerciseAnswer[] = pairs.map(p => ({
            questionId: p.id,
            answer: p.meaning,
            correctAnswer: p.meaning,
            wordId: p.wordId,
            questionType: 'pair',
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
                if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current)
                finishTimeoutRef.current = setTimeout(() => finishExercise(), 500)
            }
        } else {
            // Wrong match
            setMistakes(m => m + 1)
            setWrongPair({ word: wordId, meaning: meaningId })

            if (wrongPairTimeoutRef.current) clearTimeout(wrongPairTimeoutRef.current)
            wrongPairTimeoutRef.current = setTimeout(() => {
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
        <div className={exerciseScreenClass}>
            {/* Progress */}
            <ExerciseProgress
                current={matchedPairs.size}
                total={pairs.length}
                onClose={onExit}
                timer={timer}
                cefrLevel={cefrLevel}
            />

            <div className={exerciseCenterStageClass}>
                <div className={exerciseStageInnerClass}>
                    {/* Title */}
                    <div className="text-center mb-6">
                        <h2 className="text-xl font-black text-slate-950">Finde die Paare</h2>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                            {matchedPairs.size}/{pairs.length} gefunden
                            {mistakes > 0 && <span className="text-red-400 ml-2">• {mistakes} Fehler</span>}
                        </p>
                    </div>

                    {/* Two columns */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* German words column */}
                        <div className="space-y-3">
                            <p className="mb-2 text-center text-xs font-black uppercase text-text-brand">Deutsch</p>
                            {shuffledWords.map(pair => {
                                const isMatched = matchedPairs.has(pair.id)
                                const isSelected = selectedWord === pair.id
                                const isWrong = wrongPair?.word === pair.id

                                return (
                                    <button
                                        key={`w-${pair.id}`}
                                        onClick={() => handleWordClick(pair.id)}
                                        disabled={isMatched}
                                        className={exercisePairCardClass({ matched: isMatched, selected: isSelected, wrong: isWrong })}
                                    >
                                        {isMatched && <span className="mr-1">✓</span>}
                                        {pair.word}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Vietnamese meanings column */}
                        <div className="space-y-3">
                            <p className="mb-2 text-center text-xs font-black uppercase text-text-brand">Tiếng Việt</p>
                            {shuffledMeanings.map(pair => {
                                const isMatched = matchedPairs.has(pair.id)
                                const isSelected = selectedMeaning === pair.id
                                const isWrong = wrongPair?.meaning === pair.id

                                return (
                                    <button
                                        key={`m-${pair.id}`}
                                        onClick={() => handleMeaningClick(pair.id)}
                                        disabled={isMatched}
                                        className={exercisePairCardClass({ matched: isMatched, selected: isSelected, wrong: isWrong })}
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
