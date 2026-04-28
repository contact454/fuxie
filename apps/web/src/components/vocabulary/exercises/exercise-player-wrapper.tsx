'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Mascot } from '@/components/ui/mascot'
import { ClozeExercise } from './cloze-exercise'
import { MatchingExercise } from './matching-exercise'
import { McExercise } from './mc-exercise'
import { MixedExercise } from './mixed-exercise'
import { ScrambleExercise } from './scramble-exercise'
import { SpeedExercise } from './speed-exercise'
import { SpellingExercise } from './spelling-exercise'

interface ExercisePlayerWrapperProps {
    type: string
    theme: string
    level: string
    initialExerciseData?: any
    initialError?: string | null
}

export function ExercisePlayerWrapper({ type, theme, level, initialExerciseData, initialError = null }: ExercisePlayerWrapperProps) {
    const router = useRouter()
    const [questions, setQuestions] = useState<any[] | null>(initialExerciseData?.questions ?? null)
    const [exerciseData, setExerciseData] = useState<any>(initialExerciseData ?? null)
    const [isLoading, setIsLoading] = useState(!initialExerciseData && !initialError)
    const [error, setError] = useState<string | null>(initialError)

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
                setError(data.error || 'Không tải được bài luyện')
            }
        } catch (err) {
            setError('Lỗi kết nối. Vui lòng thử lại.')
        } finally {
            setIsLoading(false)
        }
    }, [type, theme, level])

    useEffect(() => {
        if (initialExerciseData || initialError) {
            setQuestions(initialExerciseData?.questions ?? null)
            setExerciseData(initialExerciseData ?? null)
            setError(initialError)
            setIsLoading(false)
            return
        }

        loadQuestions()
    }, [loadQuestions, initialExerciseData, initialError])

    const handleExit = () => {
        router.push('/vocabulary/practice')
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-gray-50">
                <Mascot variant="loading" size={80} />
                <p className="mt-4 text-gray-500 font-medium">Đang tải bài luyện...</p>
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
                    Thử lại
                </button>
                <button
                    onClick={handleExit}
                    className="mt-2 text-gray-500 hover:text-gray-700 text-sm"
                >
                    Về tổng quan
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
                        Dạng bài &quot;{type}&quot; sẽ sớm có!
                    </p>
                    <button
                        onClick={handleExit}
                        className="mt-4 px-6 py-2 rounded-xl bg-[#004E89] text-white font-semibold hover:opacity-90 transition"
                    >
                        Quay lại
                    </button>
                </div>
            )
    }
}
