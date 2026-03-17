'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Flashcard } from './flashcard'
import { RatingButtons } from './rating-buttons'
import { Mascot } from '@/components/ui/mascot'

// ─── Types ──────────────────────────────────────────
interface Theme {
    id: string
    slug: string
    name: string
    nameVi: string | null
    cefrLevel: string
    imageUrl: string | null
    wordCount: number
    srsProgress: { total: number; learned: number; due: number }
}

interface VocabCard {
    id: string
    word: string
    article: string | null
    plural: string | null
    wordType: string
    meaningVi: string
    meaningEn: string | null
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
    easeFactor: number
    state: number
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

// ─── Constants ──────────────────────────────────────
const CEFR_COLORS: Record<string, { gradient: string }> = {
    A1: { gradient: 'from-green-500 to-emerald-600' },
    A2: { gradient: 'from-lime-500 to-green-600' },
    B1: { gradient: 'from-orange-400 to-amber-600' },
    B2: { gradient: 'from-red-500 to-orange-600' },
    C1: { gradient: 'from-purple-500 to-violet-600' },
    C2: { gradient: 'from-violet-600 to-purple-800' },
}

// ─── Main Component ─────────────────────────────────
export function ReviewClient({ themes, availableLevels, initialLevel, dueCounts, totalDueAll }: ReviewClientProps) {
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
    const [currentDueCounts, setCurrentDueCounts] = useState(dueCounts)
    const [currentTotalDue, setCurrentTotalDue] = useState(totalDueAll)

    const cefrColors = CEFR_COLORS[currentLevel] ?? CEFR_COLORS.A1!

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
                setCurrentThemes(data.data.map((t: any) => ({
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

    const handleRate = useCallback(async (rating: Rating) => {
        const card = srsCards[srsIndex]
        if (!card || isSubmitting) return
        setIsSubmitting(true)
        setLastRating(rating)

        try {
            const res = await fetch('/api/v1/srs/review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cardId: card.id, rating }),
            })
            const data = await res.json()
            const xp = data.data?.xpEarned ?? 0

            setSrsStats(prev => ({
                totalReviewed: prev.totalReviewed + 1,
                correct: rating !== 'AGAIN' ? prev.correct + 1 : prev.correct,
                again: rating === 'AGAIN' ? prev.again + 1 : prev.again,
                xpEarned: prev.xpEarned + xp,
            }))

            setTimeout(() => {
                if (srsIndex + 1 < srsCards.length) {
                    setSrsIndex(i => i + 1)
                    setSrsFlipped(false)
                    setLastRating(null)
                } else {
                    setSrsComplete(true)
                }
            }, 600)
        } catch (err) {
            console.error(err)
        } finally {
            setIsSubmitting(false)
        }
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
                        <p className="text-xs text-gray-500">{studyTheme?.nameVi} • {studyCards.length} Wörter</p>
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
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className={`h-full bg-gradient-to-r ${cefrColors.gradient} rounded-full transition-all duration-500 ease-out`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
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
                                className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                </svg>
                                Zurück
                            </button>

                            {!isFlipped && (
                                <button
                                    onClick={() => setIsFlipped(true)}
                                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#004E89] to-blue-600 text-white font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-blue-200"
                                >
                                    Umdrehen ↻
                                </button>
                            )}

                            <button
                                onClick={nextCard}
                                disabled={currentIndex >= studyCards.length - 1}
                                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all ${
                                    currentIndex >= studyCards.length - 1
                                        ? 'border-2 border-gray-200 text-gray-400 cursor-not-allowed opacity-30'
                                        : `bg-gradient-to-r ${cefrColors.gradient} text-white hover:opacity-90 shadow-lg`
                                }`}
                            >
                                Weiter
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>

                        {/* Keyboard hint */}
                        <p className="text-xs text-gray-400 text-center mt-4">
                            Tippe auf die Karte, um sie umzudrehen
                        </p>
                    </>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Keine Wörter in diesem Thema.</p>
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
            const mascotVariant = accuracy >= 80 ? 'celebrate' : accuracy >= 50 ? 'correct' : 'encouragement'

            return (
                <div className="max-w-md mx-auto flex flex-col items-center py-8 animate-fade-in-up">
                    <Mascot
                        variant={mascotVariant}
                        size={120}
                        speechBubble={accuracy >= 80 ? 'Toll gemacht! 🎉' : accuracy >= 50 ? 'Gut gemacht! 👏' : 'Weiter üben! 💪'}
                    />

                    <div className="grid grid-cols-3 gap-3 mt-8 w-full">
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100 text-center">
                            <p className="text-xs text-gray-500 mb-1">✅ Richtig</p>
                            <p className="text-2xl font-bold text-emerald-600">{srsStats.correct}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-red-100 text-center">
                            <p className="text-xs text-gray-500 mb-1">❌ Nochmal</p>
                            <p className="text-2xl font-bold text-red-500">{srsStats.again}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-amber-100 text-center">
                            <p className="text-xs text-gray-500 mb-1">⭐ XP</p>
                            <p className="text-2xl font-bold text-amber-600">+{srsStats.xpEarned}</p>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-8">
                        <button onClick={backToThemes} className="px-5 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors">
                            Übersicht
                        </button>
                        <button onClick={() => startSrsReview()} className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#FF6B35] to-orange-500 text-white font-semibold hover:opacity-90 transition-all shadow-lg">
                            Weiter lernen →
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
                        <h2 className="text-lg font-bold text-gray-900">SRS Wiederholung</h2>
                        <p className="text-xs text-gray-500">Fällige Karten wiederholen</p>
                    </div>
                    <span className="text-sm font-bold text-[#FF6B35]">+{srsStats.xpEarned} XP</span>
                </div>

                {/* Progress */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-gray-500">{srsIndex + 1} / {srsCards.length}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#FF6B35] to-orange-400 rounded-full transition-all duration-500" style={{ width: `${srsProgress}%` }} />
                    </div>
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
                                Tippe auf die Karte, um die Antwort zu sehen
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center py-12">
                        <Mascot variant="empty" size={100} speechBubble="Keine fälligen Karten! 🎉" />
                        <p className="text-gray-500 mt-4">Alle Karten sind gelernt — komm später zurück.</p>
                        <button onClick={backToThemes} className="mt-6 px-5 py-3 rounded-xl bg-gradient-to-r from-[#FF6B35] to-orange-500 text-white font-semibold">
                            Zurück
                        </button>
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
            {/* Hero + CEFR Tabs */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
                {/* CEFR Level Tabs */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                    {availableLevels.map(level => {
                        const colors = CEFR_COLORS[level] ?? CEFR_COLORS.A1!
                        const isActive = level === currentLevel
                        const dueCount = currentDueCounts[level] || 0
                        return (
                            <button
                                key={level}
                                onClick={() => switchLevel(level)}
                                disabled={isLevelLoading}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                                    isActive
                                        ? `bg-gradient-to-r ${colors.gradient} text-white shadow-md scale-105`
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                } ${isLevelLoading ? 'opacity-50 cursor-wait' : ''}`}
                            >
                                {level}
                                {dueCount > 0 && (
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                        isActive ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-600'
                                    }`}>
                                        {dueCount}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* Title row */}
                <div className="flex items-center gap-4">
                    <Mascot variant="wortschatz" size={56} />
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-gray-900">Karteikarten {currentLevel}</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Lerne Vokabeln mit Flashcards — wähle ein Thema
                        </p>
                    </div>

                    {/* SRS Review button */}
                    {currentTotalDue > 0 && (
                        <button
                            onClick={() => startSrsReview()}
                            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#FF6B35] to-orange-500 text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-orange-200 whitespace-nowrap"
                        >
                            <span>🔄</span>
                            Fällige Karten
                            <span className="bg-white/20 rounded-lg px-2 py-0.5 text-xs">{currentTotalDue}</span>
                        </button>
                    )}
                </div>
            </div>

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
                            <button
                                key={theme.id}
                                onClick={() => startStudy(theme)}
                                className="group flex flex-col items-center p-4 rounded-2xl bg-white border-2 border-gray-100 hover:border-[#FF6B35] hover:shadow-lg hover:shadow-orange-100 transition-all duration-200"
                            >
                                {/* Image */}
                                {theme.imageUrl ? (
                                    <img
                                        src={theme.imageUrl}
                                        alt={theme.name}
                                        className="w-16 h-16 rounded-xl object-cover mb-3 group-hover:scale-105 transition-transform"
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-2xl mb-3">
                                        📖
                                    </div>
                                )}

                                {/* Name */}
                                <h3 className="text-sm font-bold text-gray-900 text-center leading-tight mb-1 group-hover:text-[#FF6B35] transition-colors line-clamp-2">
                                    {theme.name}
                                </h3>
                                <p className="text-[11px] text-gray-400 text-center line-clamp-1">{theme.nameVi}</p>

                                {/* Stats row */}
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-[11px] text-gray-500 font-medium">{theme.wordCount} Wörter</span>
                                    {theme.srsProgress.due > 0 && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 font-bold">
                                            {theme.srsProgress.due} fällig
                                        </span>
                                    )}
                                </div>

                                {/* Progress bar */}
                                {progress > 0 && (
                                    <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-400 rounded-full transition-all"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                )}
                            </button>
                        )
                    })}
                </div>
            )}

            {/* Empty state */}
            {!isLevelLoading && currentThemes.length === 0 && (
                <div className="flex flex-col items-center py-12">
                    <Mascot variant="empty" size={100} speechBubble="Keine Themen für dieses Level! 📚" />
                    <p className="text-gray-500 mt-4">Wähle ein anderes Level aus.</p>
                </div>
            )}
        </div>
    )
}
