'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { Mascot } from '@/components/ui/mascot'
import { FuxieCoach, QuestProgressHero, RewardPreview } from '@/components/gamification/quest-visuals'
import { FuxieLevelTabs, FuxiePanel, FuxieProgressBar, FuxieQuestCard, fuxieButtonClass } from '@/components/ui/fuxie-ui'
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
            }).catch(console.error)
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
            .then(res => res.json())
            .then(data => {
                finishReview(data.data?.xpEarned ?? 0)
            })
            .catch(err => {
                console.error(err)
                setIsSubmitting(false)
            })

    }, [srsCards, srsIndex, isSubmitting])

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
                        <p className="text-xs text-gray-500">{studyTheme?.nameNative} • {studyCards.length} từ</p>
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
                                Trước
                            </button>

                            {!isFlipped && (
                                <button
                                    onClick={() => setIsFlipped(true)}
                                    className={fuxieButtonClass('primary', 'lg', 'rounded-xl px-6 shadow-lg shadow-sky-200')}
                                >
                                    Lật thẻ ↻
                                </button>
                            )}

                            <button
                                onClick={nextCard}
                                disabled={currentIndex >= studyCards.length - 1}
                                className={fuxieButtonClass('primary', 'lg', 'rounded-xl shadow-lg disabled:opacity-30')}
                            >
                                Tiếp
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>

                        {/* Keyboard hint */}
                        <p className="text-xs text-gray-400 text-center mt-4">
                            Chạm vào thẻ để lật.
                        </p>
                    </>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Chủ đề này chưa có từ.</p>
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
                <div className="max-w-md mx-auto flex flex-col items-center py-8 animate-fade-in-up">
                    <Mascot
                        variant={mascotVariant}
                        size={120}
                        speechBubble={accuracy >= 80 ? 'Thành tích đáng nể! 🎉' : accuracy >= 50 ? 'Giữ vững phong độ! 🌟' : 'Không sao cả, thử lại lần nữa nhé! 💪'}
                    />

                    <RewardPreview
                        className="mt-6 w-full"
                        rewards={[
                            { type: 'xp', label: `+${srsStats.xpEarned} XP`, detail: 'phiên ôn hôm nay' },
                            { type: 'streak', label: 'Memory saved', detail: `${srsStats.totalReviewed} thẻ đã ôn` },
                            { type: 'badge', label: `${accuracy}% đúng`, detail: 'độ chắc trí nhớ' },
                        ]}
                    />

                    <div className="grid grid-cols-3 gap-3 mt-8 w-full">
                        <FuxiePanel variant="soft" className="p-4 text-center">
                            <p className="text-xs text-gray-500 mb-1">✅ Đúng</p>
                            <p className="text-2xl font-bold text-emerald-600">{srsStats.correct}</p>
                        </FuxiePanel>
                        <FuxiePanel variant="default" className="p-4 text-center ring-1 ring-red-100">
                            <p className="text-xs text-gray-500 mb-1">❌ Luyện lại</p>
                            <p className="text-2xl font-bold text-red-500">{srsStats.again}</p>
                        </FuxiePanel>
                        <FuxiePanel variant="default" className="p-4 text-center ring-1 ring-amber-100">
                            <p className="text-xs text-gray-500 mb-1">⭐ XP</p>
                            <p className="text-2xl font-bold text-amber-600">+{srsStats.xpEarned}</p>
                        </FuxiePanel>
                    </div>

                    <div className="flex gap-3 mt-8">
                        <button onClick={backToThemes} className={fuxieButtonClass('ghost', 'lg', 'rounded-xl')}>
                            Tổng quan
                        </button>
                        <button onClick={() => startSrsReview()} className={fuxieButtonClass('primary', 'lg', 'rounded-xl shadow-lg shadow-sky-200')}>
                            Học tiếp →
                        </button>
                    </div>
                </div>
            )
        }

        const srsCard = srsCards[srsIndex]
        const srsProgress = srsCards.length > 0 ? ((srsIndex) / srsCards.length) * 100 : 0

        return (
            <div className="max-w-2xl mx-auto">
                {/* Back + header */}
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={backToThemes} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-gray-700 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div className="flex-1">
                        <h2 className="text-lg font-bold text-gray-900">Ôn SRS</h2>
                        <p className="text-xs text-gray-500">Ôn các thẻ đến hạn</p>
                    </div>
                    <span className="text-sm font-bold text-text-brand">+{srsStats.xpEarned} XP</span>
                </div>

                {/* Progress */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-gray-500">{srsIndex + 1} / {srsCards.length}</span>
                    </div>
                    <FuxieProgressBar value={srsProgress} />
                </div>

                {isLoadingCards ? (
                    <div className="flex items-center justify-center py-20">
                        <Mascot variant="loading" size={80} />
                    </div>
                ) : srsCard ? (
                    <div className="flex flex-col items-center gap-6">
                        <Flashcard
                            vocabulary={srsCard.vocabularyItem}
                            isFlipped={srsFlipped}
                            onFlip={() => setSrsFlipped(f => !f)}
                        />

                        {srsFlipped && (
                            <div className="w-full max-w-lg animate-fade-in-up">
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
                                Chạm vào thẻ để xem đáp án.
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-4 py-6 lg:grid-cols-[1fr_280px]">
                        <FuxieCoach
                            role="reward"
                            eyebrow="Daily review clear"
                            title="Không có thẻ đến hạn"
                            message="Tốt rồi, trí nhớ hôm nay đang an toàn. Bước hợp lý tiếp theo là học thêm một chủ đề nhỏ hoặc quay về tổng quan."
                        />
                        <FuxiePanel className="rounded-3xl p-5 ring-1 ring-slate-100">
                            <RewardPreview
                                layout="stack"
                                rewards={[
                                    { type: 'streak', label: 'Streak safe', detail: 'không nợ thẻ' },
                                    { type: 'unlock', label: 'Next topic', detail: 'mở thêm từ mới' },
                                    { type: 'xp', label: '+XP sau', detail: 'khi thẻ đến hạn' },
                                ]}
                            />
                            <button onClick={backToThemes} className={fuxieButtonClass('primary', 'lg', 'mt-4 w-full rounded-2xl shadow-lg shadow-sky-100')}>
                                Quay lại tổng quan
                            </button>
                        </FuxiePanel>
                    </div>
                )}
            </div>
        )
    }

    // ═════════════════════════════════════════════════
    //  RENDER: THEME OVERVIEW (default)
    // ═════════════════════════════════════════════════
    return (
        <div>
            <QuestProgressHero
                variant="review"
                eyebrow="Daily review ritual"
                title={`Giữ trí nhớ ${currentLevel} luôn nóng`}
                message="Mỗi lượt ôn là một vòng giữ từ vựng khỏi rơi khỏi trí nhớ. Fuxie ưu tiên thẻ đến hạn, rồi gợi ý chủ đề tiếp theo nếu hôm nay đã sạch nợ."
                stats={[
                    { label: 'Đến hạn', value: String(dueInCurrentLevel), detail: `${currentTotalDue} thẻ toàn bộ` },
                    { label: 'Đã nhớ', value: String(learnedWords), detail: `${memoryProgress}% kho từ ${currentLevel}` },
                    { label: 'Chủ đề có tiến độ', value: String(activeThemes), detail: `${currentThemes.length} chủ đề` },
                ]}
                rewards={[
                    { type: 'streak', label: 'Streak safe', detail: 'giữ nhịp ôn ngày' },
                    { type: 'xp', label: '+10 XP/thẻ', detail: 'khi nhớ đúng' },
                    { type: 'badge', label: 'Memory badge', detail: 'tăng độ bền từ vựng' },
                ]}
                className="mb-6"
            >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    {dueInCurrentLevel > 0 ? (
                        <button
                            onClick={() => startSrsReview()}
                            className={fuxieButtonClass('primary', 'lg', 'rounded-2xl active:scale-[0.98]')}
                        >
                            Ôn {dueInCurrentLevel} thẻ đến hạn
                            <span className="rounded-lg bg-white/20 px-2 py-0.5 text-xs">+XP</span>
                        </button>
                    ) : currentThemes[0] ? (
                        <button
                            onClick={() => startStudy(currentThemes[0]!)}
                            className={fuxieButtonClass('primary', 'lg', 'rounded-2xl active:scale-[0.98]')}
                        >
                            Học chủ đề tiếp theo
                            <span className="rounded-lg bg-white/20 px-2 py-0.5 text-xs">+từ mới</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => switchLevel(availableLevels[0] ?? currentLevel)}
                            className={fuxieButtonClass('secondary', 'lg', 'rounded-2xl bg-white/75')}
                        >
                            Chọn cấp độ khác
                        </button>
                    )}
                    <div className="text-xs font-bold text-text-brand">
                        {dueInCurrentLevel > 0 ? 'Ưu tiên thẻ đang đến hạn trước khi học thêm.' : 'Hôm nay chưa có thẻ đến hạn ở cấp độ này.'}
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
                ariaLabel="Review CEFR level filter"
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
                                    <span className="text-xs text-gray-500 font-medium">{theme.wordCount} từ</span>
                                    {theme.srsProgress.due > 0 && (
                                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 font-bold">
                                            {theme.srsProgress.due} cần ôn
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
                        eyebrow="Memory route"
                        title="Cấp độ này chưa có chủ đề ôn"
                        message={t('srsEmptyTip')}
                    />
                    <FuxiePanel className="rounded-3xl border-dashed border-slate-200 p-5">
                        <p className="text-xs font-black uppercase tracking-wide text-text-brand">Next best action</p>
                        <h3 className="mt-2 text-xl font-black text-slate-950">Chọn một cấp độ khác</h3>
                        <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
                            Cấp độ có chủ đề sẽ hiện số thẻ và tiến độ SRS ngay trong tab.
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
