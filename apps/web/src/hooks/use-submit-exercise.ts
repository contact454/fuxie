'use client'

import { useState, useCallback } from 'react'

// ─── Types ──────────────────────────────────────────
export interface ExerciseAnswer {
    questionId: string
    answer: string
    correctAnswer: string
    wordId?: string
    questionType?: string
}

export interface SubmitResult {
    totalQuestions: number
    correctCount: number
    accuracy: number
    xpEarned: number
    graded?: boolean
    results: Array<{
        questionId: string
        isCorrect: boolean | null
        userAnswer: string
        correctAnswer: string
    }>
}

interface UseSubmitExerciseOptions {
    exerciseType: string
    themeSlug: string
    cefrLevel: string
    /** XP multiplier per correct answer for local fallback (default: 5) */
    xpPerCorrect?: number
    /** Custom answer comparison function (default: case-insensitive) */
    compareFn?: (answer: string, correct: string) => boolean
}

/**
 * Shared submit hook for vocabulary exercises.
 * Handles POST to API with local fallback on failure.
 *
 * Usage:
 *   const { submitResult, isSubmitting, phase, submitAnswers, resetSubmit } =
 *       useSubmitExercise({ exerciseType: 'cloze', themeSlug, cefrLevel })
 */
export function useSubmitExercise({
    exerciseType,
    themeSlug,
    cefrLevel,
    xpPerCorrect = 5,
    compareFn,
}: UseSubmitExerciseOptions) {
    const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [phase, setPhase] = useState<'playing' | 'results'>('playing')

    const defaultCompare = (a: string, b: string) =>
        a.trim().toLowerCase() === b.trim().toLowerCase()
    const compare = compareFn ?? defaultCompare

    const buildLocalFallback = useCallback(
        (answers: ExerciseAnswer[]): SubmitResult => {
            const canGradeLocally = answers.every((answer) => answer.correctAnswer.trim().length > 0)
            const results = answers.map(a => ({
                questionId: a.questionId,
                isCorrect: canGradeLocally ? compare(a.answer, a.correctAnswer) : null,
                userAnswer: a.answer,
                correctAnswer: a.correctAnswer || 'Serverbewertung erforderlich',
            }))
            const correctCount = results.filter(r => r.isCorrect).length
            return {
                totalQuestions: answers.length,
                correctCount: canGradeLocally ? correctCount : 0,
                accuracy: canGradeLocally && answers.length > 0 ? (correctCount / answers.length) * 100 : 0,
                xpEarned: canGradeLocally ? correctCount * xpPerCorrect : 0,
                graded: canGradeLocally,
                results,
            }
        },
        [xpPerCorrect, compare]
    )

    const submitAnswers = useCallback(
        async (answers: ExerciseAnswer[], timeTaken: number) => {
            setIsSubmitting(true)
            const localFallback = buildLocalFallback(answers)

            try {
                const res = await fetch('/api/v1/vocabulary/practice/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        exerciseType,
                        themeSlug,
                        cefrLevel,
                        timeTaken,
                        answers,
                    }),
                })
                const data = await res.json()
                if (data.success) {
                    setSubmitResult({
                        ...data.data,
                        graded: true,
                    })
                } else {
                    console.warn('[useSubmitExercise] API returned error, using local fallback:', data)
                    setSubmitResult(localFallback)
                }
            } catch (err) {
                console.error('[useSubmitExercise] Fetch failed, using local fallback:', err)
                setSubmitResult(localFallback)
            } finally {
                setIsSubmitting(false)
                setPhase('results')
            }
        },
        [exerciseType, themeSlug, cefrLevel, buildLocalFallback]
    )

    const resetSubmit = useCallback(() => {
        setSubmitResult(null)
        setIsSubmitting(false)
        setPhase('playing')
    }, [])

    return { submitResult, isSubmitting, phase, submitAnswers, resetSubmit }
}
