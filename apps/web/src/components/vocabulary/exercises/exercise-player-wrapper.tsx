'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { McExercise } from './mc-exercise'
import { MatchingExercise } from './matching-exercise'
import { SpellingExercise } from './spelling-exercise'
import { ClozeExercise } from './cloze-exercise'
import { ScrambleExercise } from './scramble-exercise'
import { SpeedExercise } from './speed-exercise'
import { Mascot } from '@/components/ui/mascot'

interface ExercisePlayerWrapperProps {
    type: string
    theme: string
    level: string
}

export function ExercisePlayerWrapper({ type, theme, level }: ExercisePlayerWrapperProps) {
    const router = useRouter()
    const [questions, setQuestions] = useState<any[] | null>(null)
    const [exerciseData, setExerciseData] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadQuestions = useCallback(async () => {
        setIsLoading(true)
        setError(null)
        try {
            const res = await fetch(
                `/api/v1/vocabulary/practice?type=${type}&theme=${theme}&level=${level}&count=10`
            )
            const data = await res.json()
            if (data.success) {
                setQuestions(data.data.questions)
                setExerciseData(data.data)
            } else {
                setError(data.error || 'Failed to load exercise')
            }
        } catch (err) {
            setError('Verbindungsfehler. Bitte versuche es erneut.')
        } finally {
            setIsLoading(false)
        }
    }, [type, theme, level])

    useEffect(() => {
        loadQuestions()
    }, [loadQuestions])

    const handleExit = () => {
        router.push('/vocabulary/practice')
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <Mascot variant="loading" size={80} />
                <p className="mt-4 text-gray-500 font-medium">Übung wird geladen...</p>
            </div>
        )
    }

    // Error state
    if (error || !questions || !exerciseData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <Mascot variant="encouragement" size={80} />
                <p className="mt-4 text-red-500 font-medium">{error || 'Etwas ist schiefgelaufen'}</p>
                <button
                    onClick={loadQuestions}
                    className="mt-4 px-6 py-2 rounded-xl bg-[#004E89] text-white font-semibold hover:opacity-90 transition"
                >
                    Erneut versuchen
                </button>
                <button
                    onClick={handleExit}
                    className="mt-2 text-gray-500 hover:text-gray-700 text-sm"
                >
                    Zurück zur Übersicht
                </button>
            </div>
        )
    }

    const themeName = exerciseData.theme?.name || theme

    // Render exercise based on type
    switch (type) {
        case 'mc':
            return (
                <McExercise
                    questions={questions}
                    cefrLevel={level}
                    themeName={themeName}
                    themeSlug={theme}
                    onExit={handleExit}
                    onComplete={() => {}}
                />
            )

        case 'matching':
            return (
                <MatchingExercise
                    pairs={questions}
                    cefrLevel={level}
                    themeName={themeName}
                    themeSlug={theme}
                    onExit={handleExit}
                    onComplete={() => {}}
                />
            )

        case 'spelling':
            return (
                <SpellingExercise
                    questions={questions}
                    cefrLevel={level}
                    themeName={themeName}
                    themeSlug={theme}
                    onExit={handleExit}
                    onComplete={() => {}}
                />
            )

        case 'cloze':
            return (
                <ClozeExercise
                    questions={questions}
                    cefrLevel={level}
                    themeName={themeName}
                    themeSlug={theme}
                    onExit={handleExit}
                    onComplete={() => {}}
                />
            )

        case 'scramble':
            return (
                <ScrambleExercise
                    questions={questions}
                    cefrLevel={level}
                    themeName={themeName}
                    themeSlug={theme}
                    onExit={handleExit}
                    onComplete={() => {}}
                />
            )

        case 'speed':
            return (
                <SpeedExercise
                    questions={questions}
                    cefrLevel={level}
                    themeName={themeName}
                    themeSlug={theme}
                    onExit={handleExit}
                    onComplete={() => {}}
                />
            )

        default:
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                    <Mascot variant="studying" size={80} />
                    <p className="mt-4 text-gray-500 font-medium">
                        Übungstyp &quot;{type}&quot; kommt bald!
                    </p>
                    <button
                        onClick={handleExit}
                        className="mt-4 px-6 py-2 rounded-xl bg-[#004E89] text-white font-semibold hover:opacity-90 transition"
                    >
                        Zurück
                    </button>
                </div>
            )
    }
}
