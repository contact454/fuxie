'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Mascot } from '@/components/ui/mascot'
import { FuxieCoach, QuestProgressHero, RewardPreview } from '@/components/gamification/quest-visuals'
import { FuxieLevelTabs, FuxiePanel, FuxieProgressBar, FuxieQuestCard, fuxieButtonClass } from '@/components/ui/fuxie-ui'
import { PrimaryCta } from '@/components/ui/primary-cta'
import { useSuppressLearnerMainChrome } from '@/hooks/use-suppress-chrome'
import { getCefrTheme } from '@/lib/constants/cefr'

// ─── Types ──────────────────────────────────────────
interface Theme {
    id: string
    slug: string
    name: string
    nameNative: string | null
    cefrLevel: string
    imageUrl: string | null
    wordCount: number
    srsProgress: { total: number; learned: number; due: number }
}

type ThemeApiResponse = Omit<Theme, 'srsProgress'> & {
    srsProgress?: Theme['srsProgress']
}

interface VocabCard {
    id: string
    word: string
    article: string | null
    plural: string | null
    wordType: string
    translations: Record<string, string> | null
    exampleSentence1: string | null
    exampleTranslation1: string | null
    exampleSentence2: string | null
    exampleTranslation2: string | null
    notes: string | null
    conjugation: Record<string, unknown> | null
    audioUrl?: string | null
    imageUrl?: string | null
}

interface SrsCard {
    id: string
    interval: number
    repetitions: number
    easeFactor: number
    state: number
    lapseCount: number
    vocabularyItem: VocabCard
}

interface ReviewClientProps {
    themes: Theme[]
    availableLevels: string[]
    initialLevel: string
    dueCounts: Record<string, number>
    totalDueAll: number
}

type ViewMode = 'themes' | 'study' | 'srs'
type Rating = 'AGAIN' | 'HARD' | 'GOOD' | 'EASY'

const Flashcard = dynamic(() => import('./flashcard').then(mod => mod.Flashcard), {
    ssr: false,
    loading: () => <div className="mx-auto h-[360px] w-full max-w-lg rounded-2xl bg-gray-100 animate-pulse" />,
})

const RatingButtons = dynamic(() => import('./rating-buttons').then(mod => mod.RatingButtons), {
    ssr: false,
})

// ─── Constants ──────────────────────────────────────


// ─── Main Component ─────────────────────────────────
export function ReviewClient({ themes, availableLevels, initialLevel, dueCounts, totalDueAll }: ReviewClientProps) {
    const t = useTranslations('Gamification')
    const tSrs = useTranslations('SRS')
    const searchParams = useSearchParams()
    const mockState = searchParams?.get('mockState')
    const isVisualQa = searchParams?.get('fixture') === 'visual-qa'

    // State
    const [currentLevel, setCurrentLevel] = useState(initialLevel)
    const [currentThemes, setCurrentThemes] = useState(themes)
    const [viewMode, setViewMode] = useState<ViewMode>('themes')
    const [isLevelLoading, setIsLevelLoading] = useState(false)
    const activeLevelRef = useRef(initialLevel)

    // Flashcard study state
    const [studyTheme, setStudyTheme] = useState<Theme | null>(null)
    const [studyCards, setStudyCards] = useState<VocabCard[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isFlipped, setIsFlipped] = useState(false)
    const [isLoadingCards, setIsLoadingCards] = useState(false)

    // SRS review state
    const [srsCards, setSrsCards] = useState<SrsCard[]>([])
    const [srsIndex, setSrsIndex] = useState(0)
    const [srsFlipped, setSrsFlipped] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [lastRating, setLastRating] = useState<Rating | null>(null)
    const [srsStats, setSrsStats] = useState({ totalReviewed: 0, correct: 0, again: 0, xpEarned: 0 })
    const [srsComplete, setSrsComplete] = useState(false)
    const [failedSyncs, setFailedSyncs] = useState<Array<{ cardId: string; rating: Rating; word: string }>>([])
    const [isRetryingSync, setIsRetryingSync] = useState(false)
    const [currentDueCounts] = useState(dueCounts)
    const [currentTotalDue] = useState(totalDueAll)
    const srsAdvanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const cefrColors = getCefrTheme(currentLevel)
    const totalWords = currentThemes.reduce((sum, theme) => sum + theme.wordCount, 0)
    const learnedWords = currentThemes.reduce((sum, theme) => sum + theme.srsProgress.learned, 0)
    const dueInCurrentLevel = currentDueCounts[currentLevel] ?? 0
    const activeThemes = currentThemes.filter(theme => theme.srsProgress.learned > 0).length
    const memoryProgress = totalWords > 0 ? Math.round((learnedWords / totalWords) * 100) : 0

    const workerRef = useRef<Worker | null>(null)

    // Suppress chrome during active review session (but NOT when completed)
    // Suppress chrome for the full SRS session (loading / active / empty-due).
    // Restore only on complete, back-to-overview (viewMode leaves 'srs'), or unmount.
    useSuppressLearnerMainChrome(viewMode === 'srs' && !srsComplete)

    // Handle Playwright visual-qa mocking
    useEffect(() => {
        if (isVisualQa && mockState) {
            if (mockState === 'srs-front' || mockState === 'srs-back') {
                setViewMode('srs')
                setSrsCards([
                    {
                        id: 'card-1',
                        interval: 1,
                        repetitions: 0,
                        easeFactor: 2.5,
                        state: 0,
                        lapseCount: 0,
                        vocabularyItem: {
                            id: 'vocab-1',
                            word: 'Apfel',
                            article: 'MASKULIN',
                            plural: 'Äpfel',
                            wordType: 'NOMEN',
                            translations: { vi: 'quả táo', de: 'Apfel' },
                            exampleSentence1: 'Ich esse einen Apfel.',
                            exampleTranslation1: 'Tôi ăn một quả táo.',
                            exampleSentence2: null,
                            exampleTranslation2: null,
                            notes: 'Quả táo chín đỏ',
                            conjugation: null,
                            audioUrl: null,
                            imageUrl: null
                        }
                    }
                ])
                setSrsIndex(0)
                setSrsFlipped(mockState === 'srs-back')
                setSrsComplete(false)
            } else if (mockState === 'srs-complete') {
                setViewMode('srs')
                setSrsComplete(true)
                setSrsStats({
                    totalReviewed: 5,
                    correct: 4,
                    again: 1,
                    xpEarned: 40
                })
            }
        }
    }, [isVisualQa, mockState])

    useEffect(() => {
        return () => {
            if (srsAdvanceTimeoutRef.current) clearTimeout(srsAdvanceTimeoutRef.current)
            workerRef.current?.terminate()
        }
    }, [])

    // ─── Level switching ────────────────────────────
    const switchLevel = async (level: string) => {
        if (level === activeLevelRef.current || isLevelLoading) return
        activeLevelRef.current = level
        setCurrentLevel(level)
        setIsLevelLoading(true)
        setViewMode('themes')

        try {
            const res = await fetch(`/api/v1/vocabulary/themes?level=${level}`)
            const data = await res.json()
            if (activeLevelRef.current !== level) return
            if (data.success) {
                setCurrentThemes((data.data as ThemeApiResponse[]).map((t) => ({
                    ...t,
                    srsProgress: t.srsProgress ?? { total: 0, learned: 0, due: 0 },
                })))
            }
        } catch (err) {
            console.error(err)
        } finally {
            if (activeLevelRef.current === level) setIsLevelLoading(false)
        }
    }

    // ─── Study Mode — Browse all words as flashcards ────
    const startStudy = async (theme: Theme) => {
        setStudyTheme(theme)
        setIsLoadingCards(true)
        setViewMode('study')
        setCurrentIndex(0)
        setIsFlipped(false)

        try {
            const res = await fetch(`/api/v1/vocabulary?theme=${theme.slug}&level=${theme.cefrLevel}&limit=100`)
            const data = await res.json()
            if (data.success) {
                setStudyCards(data.data)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setIsLoadingCards(false)
        }
    }

    const nextCard = () => {
        if (currentIndex < studyCards.length - 1) {
            setCurrentIndex(i => i + 1)
            setIsFlipped(false)
        }
    }

    const prevCard = () => {
        if (currentIndex > 0) {
            setCurrentIndex(i => i - 1)
            setIsFlipped(false)
        }
    }

    // ─── SRS Review Mode ────────────────────────────
    const startSrsReview = async (level?: string) => {
        const lvl = level ?? currentLevel
        workerRef.current ??= new Worker(new URL('../../workers/srs.worker.ts', import.meta.url))
        setIsLoadingCards(true)
        setViewMode('srs')
        setSrsIndex(0)
        setSrsFlipped(false)
        setSrsComplete(false)
        setSrsStats({ totalReviewed: 0, correct: 0, again: 0, xpEarned: 0 })
        setLastRating(null)

        try {
            const res = await fetch(`/api/v1/srs/due?level=${lvl}&limit=20`)
            const data = await res.json()
            if (data.success) {
                setSrsCards(data.data)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setIsLoadingCards(false)
        }
    }

    const handleRate = useCallback((rating: Rating) => {
        const card = srsCards[srsIndex]
        if (!card || isSubmitting) return
        setIsSubmitting(true)
        setLastRating(rating)

        const finishReview = (xp: number) => {
            setSrsStats(prev => ({
                totalReviewed: prev.totalReviewed + 1,
                correct: rating !== 'AGAIN' ? prev.correct + 1 : prev.correct,
                again: rating === 'AGAIN' ? prev.again + 1 : prev.again,
                xpEarned: prev.xpEarned + xp,
            }))

            if (srsAdvanceTimeoutRef.current) clearTimeout(srsAdvanceTimeoutRef.current)
            srsAdvanceTimeoutRef.current = setTimeout(() => {
                if (srsIndex + 1 < srsCards.length) {
                    setSrsIndex(i => i + 1)
                    setSrsFlipped(false)
                    setLastRating(null)
                    setIsSubmitting(false)
                } else {
                    setSrsComplete(true)
                    setIsSubmitting(false)
                }
            }, 600)
        }

        // Fire-and-forget sync to server securely
        const syncToServer = () => {
            fetch('/api/v1/srs/review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cardId: card.id, rating, responseTimeMs: 0 }),
            })
                .then(async (res) => {
                    if (!res.ok) {
                        throw new Error('Sync failed')
                    }
                    const data = await res.json()
                    if (!data.success) {
                        throw new Error(data.error || 'Sync failed')
                    }
                })
                .catch((err) => {
                    console.error(err)
                    setFailedSyncs(prev => {
                        if (prev.some(item => item.cardId === card.id)) return prev
                        return [...prev, { cardId: card.id, rating, word: card.vocabularyItem.word }]
                    })
                })
        }

        // 1. Optimistic Fast UI with Web Worker if available
        if (workerRef.current) {
            workerRef.current.postMessage({
                type: 'CALCULATE_REVIEW',
                payload: {
                    cardId: card.id,
                    rating,
                    cardState: {
                        interval: card.interval,
                        repetitions: card.repetitions,
                        easeFactor: card.easeFactor,
                        state: card.state,
                        lapseCount: card.lapseCount
                    }
                }
            })

            // Instantly transition UI (XP for correct is hardcoded to 10 for optimistic calc)
            finishReview(rating === 'AGAIN' ? 0 : 10)
            syncToServer()
            return
        }

        // 2. Fallback if Worker fails
        fetch('/api/v1/srs/review', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cardId: card.id, rating, responseTimeMs: 0 }),
        })
            .then(res => {
                if (!res.ok) {
                    throw new Error('Sync failed')
                }
                return res.json()
            })
            .then(data => {
                if (data.success) {
                    finishReview(data.data?.xpEarned ?? 0)
                } else {
                    throw new Error(data.error || 'Sync failed')
                }
            })
            .catch(err => {
                console.error(err)
                setFailedSyncs(prev => {
                    if (prev.some(item => item.cardId === card.id)) return prev
                    return [...prev, { cardId: card.id, rating, word: card.vocabularyItem.word }]
                })
                finishReview(rating === 'AGAIN' ? 0 : 10)
            })
            .finally(() => {
                setIsSubmitting(false)
            })

    }, [srsCards, srsIndex, isSubmitting])

    const retrySync = useCallback(async () => {
        if (failedSyncs.length === 0 || isRetryingSync) return
        setIsRetryingSync(true)
        const itemsToRetry = [...failedSyncs]
        const remaining: Array<{ cardId: string; rating: Rating; word: string }> = []

        for (const item of itemsToRetry) {
            try {
                const res = await fetch('/api/v1/srs/review', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cardId: item.cardId, rating: item.rating, responseTimeMs: 0 }),
                })
                if (!res.ok) {
                    throw new Error('Sync failed')
                }
                const data = await res.json()
                if (!data.success) {
                    throw new Error(data.error || 'Sync failed')
                }
            } catch (err) {
                console.error('Failed to sync card', item.cardId, err)
                remaining.push(item)
            }
        }

        setFailedSyncs(remaining)
        setIsRetryingSync(false)
    }, [failedSyncs, isRetryingSync])

    // ─── Back to themes ─────────────────────────────
    const backToThemes = () => {
        setViewMode('themes')
        setStudyCards([])
        setStudyTheme(null)
        setSrsCards([])
        setSrsComplete(false)
    }

    // ═════════════════════════════════════════════════
    //  RENDER: STUDY MODE — Flashcard browser
    // ═════════════════════════════════════════════════
    if (viewMode === 'study') {
        const card = studyCards[currentIndex]
        const progress = studyCards.length > 0 ? ((currentIndex + 1) / studyCards.length) * 100 : 0

        return (
            <div className="max-w-2xl mx-auto">
                {failedSyncs.length > 0 && (
                    <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                        <div className="flex-1">
                            <h3 className="text-sm font-bold text-amber-800">⚠️ {tSrs('syncFailedTitle', { count: failedSyncs.length })}</h3>
                            <p className="text-xs text-amber-600">
                                {tSrs('syncFailedDetail', { words: failedSyncs.map(f => f.word).join(', ') })}
                            </p>
                        </div>
                        <button
                            onClick={retrySync}
                            disabled={isRetryingSync}
                            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-[background-color,opacity] shadow-sm shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fuxie-blue-700)]"
                        >
                            {isRetryingSync ? tSrs('syncSaving') : tSrs('syncRetry')}
                        </button>
                    </div>
                )}
                {/* Back button + theme header */}
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={backToThemes}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div className="flex-1">
                        <h2 className="text-lg font-bold text-gray-900">{studyTheme?.name}</h2>
                        <p className="text-xs text-gray-500">{studyTheme?.nameNative} • {tSrs('wordCountLabel', { count: studyCards.length })}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${cefrColors.gradient} text-white`}>
                        {currentLevel}
                    </span>
                </div>

                {/* Progress bar */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-gray-500">{currentIndex + 1} / {studyCards.length}</span>
                    </div>
                    <FuxieProgressBar value={progress} barClassName={`bg-gradient-to-r ${cefrColors.gradient}`} />
                </div>

                {/* Flashcard */}
                {isLoadingCards ? (
                    <div className="flex items-center justify-center py-20">
                        <Mascot variant="loading" size={80} />
                    </div>
                ) : card ? (
                    <>
                        <Flashcard
                            vocabulary={card}
                            isFlipped={isFlipped}
                            onFlip={() => setIsFlipped(f => !f)}
                        />

                        {/* Navigation buttons */}
                        <div className="flex items-center justify-center gap-4 mt-6">
                            <button
                                onClick={prevCard}
                                disabled={currentIndex === 0}
                                className={fuxieButtonClass('ghost', 'lg', 'rounded-xl disabled:opacity-30')}
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                </svg>
                                {tSrs('prevBtn')}
                            </button>

                            {!isFlipped && (
                                <button
                                    onClick={() => setIsFlipped(true)}
                                    className={fuxieButtonClass('primary', 'lg', 'rounded-xl px-6 shadow-lg shadow-sky-200')}
                                >
                                    {tSrs('flipCard')}
                                </button>
                            )}

                            <button
                                onClick={nextCard}
                                disabled={currentIndex >= studyCards.length - 1}
                                className={fuxieButtonClass('primary', 'lg', 'rounded-xl shadow-lg disabled:opacity-30')}
                            >
                                {tSrs('nextBtn')}
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>

                        {/* Keyboard hint */}
                        <p className="text-xs text-gray-400 text-center mt-4">
                            {tSrs('tapToFlipDetail')}
                        </p>
                    </>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-500">{tSrs('noWordsInTopic')}</p>
                    </div>
                )}
            </div>
        )
    }

    // ═════════════════════════════════════════════════
    //  RENDER: SRS REVIEW MODE
    // ═════════════════════════════════════════════════
    if (viewMode === 'srs') {
        // SRS Complete
        if (srsComplete) {
            const accuracy = srsStats.totalReviewed > 0
                ? Math.round((srsStats.correct / srsStats.totalReviewed) * 100) : 0
            const mascotVariant = accuracy >= 80 ? 'celebrate' : accuracy >= 50 ? 'correct' : 'encourage'

            return (
                <div className="min-h-screen w-full fuxie-learn-bg relative flex flex-col items-center justify-between pb-8 pt-4 overflow-x-hidden overflow-y-auto animate-fade-in-up">
                    <div className="relative z-10 w-full max-w-md px-4 flex flex-col items-center flex-1 justify-center my-auto">
                        <Mascot
                            variant={mascotVariant}
                            size={120}
                            speechBubble={accuracy >= 80 ? tSrs('speechBubbleExcellent') : accuracy >= 50 ? tSrs('speechBubbleGood') : tSrs('speechBubbleTryAgain')}
                        />

                        <div className="mt-6 w-full bg-white/95 backdrop-blur-md border-2 border-[var(--fuxie-blue-200)] p-5 rounded-[24px] shadow-[var(--fuxie-shadow-card)]">
                            <RewardPreview
                                className="w-full"
                                rewards={[
                                    { type: 'xp', label: tSrs('xpEarnedLabel', { xp: srsStats.xpEarned }), detail: tSrs('sessionXpDetail') },
                                    { type: 'streak', label: tSrs('memorySavedLabel'), detail: tSrs('cardsReviewedDetail', { count: srsStats.totalReviewed }) },
                                    { type: 'badge', label: tSrs('accuracyPercentLabel', { percent: accuracy }), detail: tSrs('accuracyDetail') },
                                ]}
                            />

                            <div className="grid grid-cols-3 gap-3 mt-4 w-full">
                                <FuxiePanel variant="soft" className="p-3 text-center">
                                    <p className="text-[10px] text-gray-500 mb-1">{tSrs('correct')}</p>
                                    <p className="text-xl font-black text-emerald-600">{srsStats.correct}</p>
                                </FuxiePanel>
                                <FuxiePanel variant="default" className="p-3 text-center ring-1 ring-red-100 bg-white">
                                    <p className="text-[10px] text-gray-500 mb-1">{tSrs('practiceAgain')}</p>
                                    <p className="text-xl font-black text-red-500">{srsStats.again}</p>
                                </FuxiePanel>
                                <FuxiePanel variant="default" className="p-3 text-center ring-1 ring-amber-100 bg-white">
                                    <p className="text-[10px] text-gray-500 mb-1">⭐ {tSrs('xpEarnedShort')}</p>
                                    <p className="text-xl font-black text-amber-600">+{srsStats.xpEarned}</p>
                                </FuxiePanel>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <PrimaryCta asChild variant="secondary" className="flex-1">
                                    <button onClick={backToThemes}>{tSrs('backToVillage')}</button>
                                </PrimaryCta>
                                <PrimaryCta asChild variant="primary" className="flex-1">
                                    <button onClick={() => startSrsReview()}>{tSrs('studyMore')}</button>
                                </PrimaryCta>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }

        const srsCard = srsCards[srsIndex]
        const srsProgress = srsCards.length > 0 ? ((srsIndex) / srsCards.length) * 100 : 0

        return (
            <div className="fixed inset-0 z-50 flex flex-col fuxie-gameplay-bg text-slate-950 overflow-y-auto">
                {/* Header progress bar */}
                <div className="w-full max-w-2xl mx-auto px-5 py-4 sm:px-6 flex items-center gap-3">
                    <button
                        onClick={backToThemes}
                        aria-label={tSrs('closeReviewSession')}
                        className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fuxie-blue-700)]"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <div className="flex-1">
                        <FuxieProgressBar
                            value={srsProgress}
                            className="h-1.5 bg-[var(--fuxie-blue-100)] rounded-full overflow-hidden"
                            barClassName="bg-[var(--fuxie-success)] bg-none rounded-full"
                        />
                    </div>
                    <span className="whitespace-nowrap text-sm font-black text-slate-500">
                        {tSrs('cardProgress', { current: srsIndex + 1, total: srsCards.length })}
                    </span>
                    <span className="whitespace-nowrap text-sm font-black text-text-brand shrink-0">
                        {tSrs('xpEarnedLabel', { xp: srsStats.xpEarned })}
                    </span>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center p-4">
                    {failedSyncs.length > 0 && (
                    <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left w-full max-w-lg">
                        <div className="flex-1">
                            <h3 className="text-sm font-bold text-amber-800">⚠️ {tSrs('syncFailedTitle', { count: failedSyncs.length })}</h3>
                            <p className="text-xs text-amber-600">
                                {tSrs('syncFailedDetail', { words: failedSyncs.map(f => f.word).join(', ') })}
                            </p>
                        </div>
                        <button
                            onClick={retrySync}
                            disabled={isRetryingSync}
                            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-[background-color,opacity] shadow-sm shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fuxie-blue-700)]"
                        >
                            {isRetryingSync ? tSrs('syncSaving') : tSrs('syncRetry')}
                        </button>
                    </div>
                )}

                    {isLoadingCards ? (
                        <div className="flex items-center justify-center py-20">
                            <Mascot variant="loading" size={80} />
                        </div>
                    ) : srsCard ? (
                        <div className="flex flex-col items-center gap-6 w-full max-w-lg">
                            <Flashcard
                                vocabulary={srsCard.vocabularyItem}
                                isFlipped={srsFlipped}
                                onFlip={() => setSrsFlipped(f => !f)}
                            />

                            {srsFlipped && (
                                <div className="w-full animate-fade-in-up">
                                    <RatingButtons
                                        onRate={handleRate}
                                        disabled={isSubmitting}
                                        currentInterval={srsCard.interval}
                                        easeFactor={srsCard.easeFactor}
                                    />
                                </div>
                            )}

                            {!srsFlipped && !lastRating && (
                                <p className="text-sm text-gray-400 animate-pulse">
                                    {tSrs('tapToSeeAnswer')}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="grid gap-4 py-6 lg:grid-cols-[1fr_280px] w-full max-w-3xl">
                            <FuxieCoach
                                role="reward"
                                eyebrow={tSrs('emptyDueEyebrow')}
                                title={tSrs('noDueCards')}
                                message={tSrs('emptyDueMessage')}
                            />
                            <FuxiePanel className="rounded-3xl p-5 ring-1 ring-slate-100 bg-white">
                                <RewardPreview
                                    layout="stack"
                                    rewards={[
                                        { type: 'streak', label: tSrs('emptyDueStreakLabel'), detail: tSrs('emptyDueStreakDetail') },
                                        { type: 'unlock', label: tSrs('emptyDueNextTopic'), detail: tSrs('emptyDueNextTopicDetail') },
                                        { type: 'xp', label: tSrs('emptyDueXpLater'), detail: tSrs('emptyDueXpLaterDetail') },
                                    ]}
                                />
                                <PrimaryCta asChild variant="primary" className="mt-4 w-full">
                                    <button onClick={backToThemes}>
                                        {tSrs('backToOverview')}
                                    </button>
                                </PrimaryCta>
                            </FuxiePanel>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // ═════════════════════════════════════════════════
    //  RENDER: THEME OVERVIEW (default)
    // ═════════════════════════════════════════════════
    return (
        <div>
            {failedSyncs.length > 0 && (
                    <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                        <div className="flex-1">
                            <h3 className="text-sm font-bold text-amber-800">⚠️ {tSrs('syncFailedTitle', { count: failedSyncs.length })}</h3>
                            <p className="text-xs text-amber-600">
                                {tSrs('syncFailedDetail', { words: failedSyncs.map(f => f.word).join(', ') })}
                            </p>
                        </div>
                        <button
                            onClick={retrySync}
                            disabled={isRetryingSync}
                            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-[background-color,opacity] shadow-sm shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fuxie-blue-700)]"
                        >
                            {isRetryingSync ? tSrs('syncSaving') : tSrs('syncRetry')}
                        </button>
                    </div>
                )}
            <QuestProgressHero
                variant="review"
                eyebrow={tSrs('overviewEyebrow')}
                title={tSrs('overviewTitle', { level: currentLevel })}
                message={tSrs('overviewMessage')}
                stats={[
                    { label: tSrs('statDueLabel'), value: String(dueInCurrentLevel), detail: tSrs('statDueDetail', { count: currentTotalDue }) },
                    { label: tSrs('statLearnedLabel'), value: String(learnedWords), detail: tSrs('statLearnedDetail', { percent: memoryProgress, level: currentLevel }) },
                    { label: tSrs('statActiveThemesLabel'), value: String(activeThemes), detail: tSrs('statActiveThemesDetail', { count: currentThemes.length }) },
                ]}
                rewards={[
                    { type: 'streak', label: tSrs('rewardStreakSafe'), detail: tSrs('rewardStreakSafeDetail') },
                    { type: 'xp', label: tSrs('rewardXpPerCard'), detail: tSrs('rewardXpPerCardDetail') },
                    { type: 'badge', label: tSrs('rewardMemoryBadge'), detail: tSrs('rewardMemoryBadgeDetail') },
                ]}
                className="mb-6"
            >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    {dueInCurrentLevel > 0 ? (
                        <button
                            onClick={() => startSrsReview()}
                            className={fuxieButtonClass('primary', 'lg', 'rounded-2xl active:scale-[0.98]')}
                        >
                            {tSrs('reviewDueCardsBtn', { count: dueInCurrentLevel })}
                            <span className="rounded-lg bg-white/20 px-2 py-0.5 text-xs">+XP</span>
                        </button>
                    ) : currentThemes[0] ? (
                        <button
                            onClick={() => startStudy(currentThemes[0]!)}
                            className={fuxieButtonClass('primary', 'lg', 'rounded-2xl active:scale-[0.98]')}
                        >
                            {tSrs('studyNextTopicBtn')}
                            <span className="rounded-lg bg-white/20 px-2 py-0.5 text-xs">+{tSrs('addWord')}</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => switchLevel(availableLevels[0] ?? currentLevel)}
                            className={fuxieButtonClass('secondary', 'lg', 'rounded-2xl bg-white/75')}
                        >
                            {tSrs('selectDifferentLevel')}
                        </button>
                    )}
                    <div className="text-xs font-bold text-text-brand">
                        {dueInCurrentLevel > 0 ? tSrs('hintDuePriority') : tSrs('hintNoDueToday')}
                    </div>
                </div>
            </QuestProgressHero>

            {/* CEFR Tabs */}
            <FuxieLevelTabs
                items={availableLevels}
                activeItem={currentLevel}
                onSelect={switchLevel}
                disabled={isLevelLoading}
                getCount={(level) => currentDueCounts[level] || 0}
                getActiveClassName={(level) => {
                    const colors = getCefrTheme(level)
                    return `bg-gradient-to-r ${colors.gradient} text-white scale-105`
                }}
                ariaLabel={tSrs('levelFilterAria')}
                className="mb-6"
            />

            {/* Theme Grid */}
            {isLevelLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Mascot variant="loading" size={80} />
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {currentThemes.map(theme => {
                        const progress = theme.wordCount > 0
                            ? Math.round((theme.srsProgress.learned / theme.wordCount) * 100) : 0

                        return (
                            <FuxieQuestCard
                                as="button"
                                key={theme.id}
                                onClick={() => startStudy(theme)}
                                className="flex flex-col items-center p-4 text-center"
                            >
                                {/* Image */}
                                {theme.imageUrl ? (
                                    <Image
                                        src={theme.imageUrl}
                                        alt={theme.name}
                                        width={64}
                                        height={64}
                                        className="rounded-xl object-cover mb-3 group-hover:scale-105 transition-transform"
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-2xl mb-3">
                                        📖
                                    </div>
                                )}

                                {/* Name */}
                                <h3 className="text-sm font-bold text-gray-900 text-center leading-tight mb-1 group-hover:text-text-brand transition-colors line-clamp-2">
                                    {theme.name}
                                </h3>
                                <p className="text-xs text-gray-400 text-center line-clamp-1">{theme.nameNative}</p>

                                {/* Stats row */}
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs text-gray-500 font-medium">{tSrs('wordCountLabel', { count: theme.wordCount })}</span>
                                    {theme.srsProgress.due > 0 && (
                                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 font-bold">
                                            {tSrs('dueReviewBadge', { count: theme.srsProgress.due })}
                                        </span>
                                    )}
                                </div>

                                {/* Progress bar */}
                                {progress > 0 && (
                                    <FuxieProgressBar value={progress} tone="success" className="mt-2 h-1.5 w-full" />
                                )}
                            </FuxieQuestCard>
                        )
                    })}
                </div>
            )}

            {/* Empty state */}
            {!isLevelLoading && currentThemes.length === 0 && (
                <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
                    <FuxieCoach
                        role="locked"
                        eyebrow={tSrs('nextBestAction')}
                        title={tSrs('noTopicsInLevel')}
                        message={t('srsEmptyTip')}
                    />
                    <FuxiePanel className="rounded-3xl border-dashed border-slate-200 p-5">
                        <p className="text-xs font-black uppercase tracking-wide text-text-brand">{tSrs('nextBestAction')}</p>
                        <h3 className="mt-2 text-xl font-black text-slate-950">{tSrs('selectDifferentLevel')}</h3>
                        <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
                            {tSrs('emptyLevelHint')}
                        </p>
                        <div className="mt-5 flex flex-wrap gap-2">
                            {availableLevels.map(level => (
                                <button
                                    key={level}
                                    onClick={() => switchLevel(level)}
                                    className={fuxieButtonClass('secondary', 'sm', 'rounded-xl')}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </FuxiePanel>
                </div>
            )}
        </div>
    )
}
