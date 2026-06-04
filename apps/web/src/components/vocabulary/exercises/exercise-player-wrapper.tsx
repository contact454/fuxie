'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Mascot } from '@/components/ui/mascot'
import { FuxiePanel, fuxieButtonClass } from '@/components/ui/fuxie-ui'
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
    const t = useTranslations('Vocabulary')
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
            <div className="flex min-h-[100dvh] items-center justify-center bg-[#F3FBFF] px-4">
                <FuxiePanel variant="soft" className="flex w-full max-w-sm flex-col items-center p-8 text-center">
                    <Mascot variant="loading" size={88} />
                    <p className="mt-4 text-sm font-bold text-text-brand">{t('loadingExercise')}</p>
                    <div className="mt-5 h-2 w-36 overflow-hidden rounded-full bg-[#CCE4F0]/70">
                        <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-[#60A8E4] to-[#2EC4B6]" />
                    </div>
                </FuxiePanel>
            </div>
        )
    }

    // Error state
    if (error || !questions || !exerciseData) {
        return (
            <div className="flex min-h-[100dvh] items-center justify-center bg-[#F3FBFF] px-4">
                <FuxiePanel variant="default" className="flex w-full max-w-sm flex-col items-center p-8 text-center">
                    <Mascot variant="encourage" size={88} />
                    <p className="mt-4 text-sm font-bold text-red-500">{error || 'Etwas ist schiefgelaufen'}</p>
                    <button
                        onClick={loadQuestions}
                        className={fuxieButtonClass('primary', 'md', 'mt-5')}
                    >
                        Thử lại
                    </button>
                    <button
                        onClick={handleExit}
                        className={fuxieButtonClass('ghost', 'sm', 'mt-2')}
                    >
                        Về tổng quan
                    </button>
                </FuxiePanel>
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
                    nextEpisodeHref={exerciseData.nextEpisodeHref}
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
                <div className="flex min-h-[100dvh] items-center justify-center bg-[#F3FBFF] px-4">
                    <FuxiePanel variant="default" className="flex w-full max-w-sm flex-col items-center p-8 text-center">
                        <Mascot variant="studying" size={88} />
                        <p className="mt-4 text-gray-500 font-medium">
                            Dạng bài &quot;{type}&quot; sẽ sớm có!
                        </p>
                        <button
                            onClick={handleExit}
                            className={fuxieButtonClass('primary', 'md', 'mt-4')}
                        >
                            Quay lại
                        </button>
                    </FuxiePanel>
                </div>
            )
    }
}
