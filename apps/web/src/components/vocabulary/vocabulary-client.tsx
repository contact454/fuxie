'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { Mascot } from '@/components/ui/mascot'
import { getCefrTheme } from '@/lib/constants/cefr'
import { useLevelSwitcher } from '@/hooks/use-level-switcher'

import { type Theme, type VocabItem } from './vocabulary-types'
import { ThemeSelector } from './ThemeSelector'
import { WordCard } from './WordCard'

// ─── Props ──────────────────────────────────────────
interface VocabularyClientProps {
    themes: Theme[]
    totalWords: number
    totalDue: number
    availableLevels: string[]
    initialLevel: string
}

// ─── Main Component ─────────────────────────────────
export function VocabularyClient({ themes, totalWords, totalDue, availableLevels, initialLevel }: VocabularyClientProps) {
    const router = useRouter()
    const [currentThemes, setCurrentThemes] = useState(themes)
    const [currentTotalWords, setCurrentTotalWords] = useState(totalWords)
    const [currentTotalDue, setCurrentTotalDue] = useState(totalDue)
    const [selectedThemeSlug, setSelectedThemeSlug] = useState<string>(themes[0]?.slug ?? '')
    const [words, setWords] = useState<VocabItem[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [showAllWords, setShowAllWords] = useState(false)
    const [isAdding, setIsAdding] = useState(false)
    const detailRef = useRef<HTMLDivElement>(null)
    const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // ── useLevelSwitcher hook ──
    const { currentLevel, isLevelLoading, switchLevel } = useLevelSwitcher<Theme[]>({
        initialLevel,
        apiEndpoint: '/api/v1/vocabulary/themes?level={level}',
        transformData: (data: { success: boolean; data: Theme[] }) => {
            if (!data.success) return []
            return data.data.map((t: Theme) => ({
                ...t,
                srsProgress: t.srsProgress ?? { total: 0, learned: 0, due: 0 },
            }))
        },
        onSuccess: (newThemes, level) => {
            setCurrentThemes(newThemes)
            setCurrentTotalWords(newThemes.reduce((s, t) => s + t.wordCount, 0))
            setCurrentTotalDue(newThemes.reduce((s, t) => s + (t.srsProgress?.due ?? 0), 0))
            setWords([])
            setShowAllWords(false)
            if (newThemes[0]) {
                setSelectedThemeSlug(newThemes[0].slug)
                loadWordsForLevel(newThemes[0].slug, level)
            } else {
                setWords([])
                setSelectedThemeSlug('')
            }
        },
    })

    const cefrColors = getCefrTheme(currentLevel)
    const selectedTheme = currentThemes.find(t => t.slug === selectedThemeSlug) ?? null
    const totalLearned = currentThemes.reduce((s, t) => s + t.srsProgress.learned, 0)
    const overallProgress = currentTotalWords > 0 ? Math.round((totalLearned / currentTotalWords) * 100) : 0

    // ── Data fetching ──
    const loadWordsForLevel = useCallback(async (slug: string, level: string) => {
        setIsLoading(true)
        try {
            const res = await fetch(`/api/v1/vocabulary?theme=${slug}&level=${level}&limit=100`)
            const data = await res.json()
            if (data.success) setWords(data.data)
        } catch (err) {
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }, [])

    const loadWords = useCallback(async (slug: string) => {
        loadWordsForLevel(slug, currentLevel)
    }, [loadWordsForLevel, currentLevel])

    // Auto-load first theme
    useEffect(() => {
        if (themes[0]) loadWordsForLevel(themes[0].slug, initialLevel)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
        }
    }, [])

    // ── Handlers ──
    const selectTheme = (slug: string) => {
        setSelectedThemeSlug(slug)
        setShowAllWords(false)
        loadWords(slug)
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
        scrollTimeoutRef.current = setTimeout(() => {
            detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }, 100)
    }

    const addToSrsAndPractice = async () => {
        if (!selectedTheme) return
        setIsAdding(true)
        try {
            await fetch('/api/v1/srs/cards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ themeSlug: selectedTheme.slug }),
            })
            router.push('/review')
        } catch (err) {
            console.error(err)
        } finally {
            setIsAdding(false)
        }
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-6">

            {/* ══════ SECTION 1 — Hero Banner ══════ */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
                {/* CEFR Level Tabs */}
                {availableLevels.length > 1 && (
                    <div className="flex gap-2 mb-4">
                        {availableLevels.map(level => {
                            const colors = getCefrTheme(level)
                            const isActive = level === currentLevel
                            return (
                                <button
                                    key={level}
                                    onClick={() => switchLevel(level)}
                                    disabled={isLevelLoading}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${isActive
                                        ? `bg-gradient-to-r ${colors.gradient} text-white shadow-md scale-105`
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                        } ${isLevelLoading ? 'opacity-50 cursor-wait' : ''}`}
                                >
                                    {level}
                                </button>
                            )
                        })}
                    </div>
                )}
                <div className="flex items-center gap-4">
                    <Mascot variant="wortschatz" size={56} />
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-gray-900">Wortschatz {currentLevel}</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            <span className="font-semibold text-gray-700">{totalLearned}</span> von {currentTotalWords} gelernt
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link
                            href="/vocabulary/practice"
                            className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-[#004E89] text-[#004E89] font-bold text-sm hover:bg-[#004E89]/5 transition-all whitespace-nowrap"
                        >
                            <span>🎯</span>
                            Üben
                        </Link>
                        <Link
                            href="/review"
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r ${cefrColors?.gradient ?? 'from-[#FF6B35] to-orange-500'} text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg whitespace-nowrap`}
                        >
                            <span>✨</span>
                            Jetzt lernen
                            {currentTotalDue > 0 && (
                                <span className="ml-1 bg-white/20 rounded-lg px-2 py-0.5 text-xs">{currentTotalDue}</span>
                            )}
                        </Link>
                    </div>
                </div>
                {/* Overall progress bar */}
                <div className="mt-4">
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-[#FF6B35] to-orange-400 rounded-full transition-all duration-700"
                            style={{ width: `${Math.max(overallProgress, 1)}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5 text-right">{overallProgress}% abgeschlossen</p>
                </div>
            </div>

            {/* ══════ SECTION 2 — Theme Selector ══════ */}
            <ThemeSelector
                themes={currentThemes}
                selectedSlug={selectedThemeSlug}
                onSelect={selectTheme}
            />

            {/* ══════ SECTION 3 — Theme Detail Panel ══════ */}
            {selectedTheme && (
                <div
                    ref={detailRef}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in-up"
                >
                    {/* Theme Header */}
                    <div className="p-6 flex items-start gap-5">
                        <div className="w-24 h-24 rounded-2xl bg-gray-100 flex items-center justify-center text-4xl flex-shrink-0 overflow-hidden">
                            {selectedTheme.imageUrl ? (
                                <img
                                    src={selectedTheme.imageUrl}
                                    alt={selectedTheme.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : '📖'}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h2 className="text-xl font-bold text-gray-900">{selectedTheme.name}</h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                {selectedTheme.nameNative} • {selectedTheme.wordCount} Wörter
                            </p>

                            {/* Progress */}
                            <div className="mt-3">
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                    <span>{selectedTheme.srsProgress.learned}/{selectedTheme.wordCount} gelernt</span>
                                    <span>
                                        {selectedTheme.wordCount > 0
                                            ? Math.round((selectedTheme.srsProgress.learned / selectedTheme.wordCount) * 100)
                                            : 0}%
                                    </span>
                                </div>
                                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                                        style={{
                                            width: `${Math.max(
                                                selectedTheme.wordCount > 0
                                                    ? (selectedTheme.srsProgress.learned / selectedTheme.wordCount) * 100
                                                    : 0
                                                , 2)}%`
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={() => setShowAllWords(!showAllWords)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold border-2 transition-all
                                        ${showAllWords
                                            ? 'border-[#004E89] bg-[#004E89]/5 text-[#004E89]'
                                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <span>📖</span>
                                    Wörter durchsehen
                                </button>
                                <button
                                    onClick={addToSrsAndPractice}
                                    disabled={isAdding}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#FF6B35] to-orange-500 text-white hover:opacity-90 transition-all shadow-sm disabled:opacity-50"
                                >
                                    <span>🎯</span>
                                    {isAdding ? 'Wird geladen...' : 'Thema üben'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Word Preview — horizontal scroll */}
                    {!showAllWords && (
                        <div className="px-6 pb-5">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                Wortvorschau
                            </p>
                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Mascot variant="loading" size={56} />
                                </div>
                            ) : (
                                <>
                                    <div
                                        className="flex gap-3 overflow-x-auto pb-2 scroll-smooth"
                                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                    >
                                        {words.slice(0, 12).map((w) => (
                                            <WordCard key={w.id} word={w} variant="preview" />
                                        ))}
                                    </div>
                                    {words.length > 0 && (
                                        <button
                                            onClick={() => setShowAllWords(true)}
                                            className="mt-3 text-sm font-semibold text-[#FF6B35] hover:text-orange-600 transition-colors flex items-center gap-1"
                                        >
                                            {words.length > 12
                                                ? `Alle ${selectedTheme.wordCount} Wörter anzeigen`
                                                : 'Details anzeigen'
                                            }
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* Full Word List — expanded */}
                    {showAllWords && (
                        <div className="px-6 pb-6 animate-fade-in-up">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    Alle Wörter ({words.length})
                                </p>
                                <button
                                    onClick={() => setShowAllWords(false)}
                                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                                    </svg>
                                    Einklappen
                                </button>
                            </div>

                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Mascot variant="loading" size={64} />
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                    {words.map((w) => (
                                        <WordCard key={w.id} word={w} variant="list" />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
