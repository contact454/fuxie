'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Mascot } from '@/components/ui/mascot'

interface ExercisePlayerWrapperProps {
    type: string
    theme: string
    level: string
}

const exerciseLoading = () => (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50">
        <div className="h-12 w-12 rounded-full border-4 border-[#004E89] border-t-transparent animate-spin" />
    </div>
)

const McExercise = dynamic(() => import('./mc-exercise').then(mod => mod.McExercise), { ssr: false, loading: exerciseLoading })
const MatchingExercise = dynamic(() => import('./matching-exercise').then(mod => mod.MatchingExercise), { ssr: false, loading: exerciseLoading })
const SpellingExercise = dynamic(() => import('./spelling-exercise').then(mod => mod.SpellingExercise), { ssr: false, loading: exerciseLoading })
const ClozeExercise = dynamic(() => import('./cloze-exercise').then(mod => mod.ClozeExercise), { ssr: false, loading: exerciseLoading })
const ScrambleExercise = dynamic(() => import('./scramble-exercise').then(mod => mod.ScrambleExercise), { ssr: false, loading: exerciseLoading })
const SpeedExercise = dynamic(() => import('./speed-exercise').then(mod => mod.SpeedExercise), { ssr: false, loading: exerciseLoading })
const MixedExercise = dynamic(() => import('./mixed-exercise').then(mod => mod.MixedExercise), { ssr: false, loading: exerciseLoading })

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
            <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-gray-50">
                <Mascot variant="loading" size={80} />
                <p className="mt-4 text-gray-500 font-medium">Übung wird geladen...</p>
            </div>
        )
    }

    // Error state
    if (error || !questions || !exerciseData) {
        return (
            <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-gray-50">
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
        case 'mixed':
            return (
                <MixedExercise
                    questions={questions}
                    cefrLevel={level}
                    themeName={themeName}
                    themeSlug={theme}
                    onExit={handleExit}
                    onComplete={() => {}}
                />
            )

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
                <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-gray-50">
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
