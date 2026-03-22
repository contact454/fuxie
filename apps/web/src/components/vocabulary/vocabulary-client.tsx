'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

import { Mascot } from '@/components/ui/mascot'
import { AudioPlayer } from '@/components/ui/audio-player'

// ─── Types ──────────────────────────────────────────
interface Theme {
    id: string
    slug: string
    name: string
    nameVi: string | null
    nameEn: string | null
    cefrLevel: string
    imageUrl: string | null
    wordCount: number
    srsProgress: { total: number; learned: number; due: number }
}

interface VocabItem {
    id: string
    word: string
    article: string | null
    plural: string | null
    wordType: string
    meaningVi: string
    meaningEn: string | null
    notes: string | null
    conjugation: Record<string, unknown> | null
    audioUrl?: string | null
    imageUrl?: string | null
    exampleSentence1?: string | null
    exampleTranslation1?: string | null
    theme: { slug: string; name: string } | null
}

interface VocabularyClientProps {
    themes: Theme[]
    totalWords: number
    totalDue: number
    availableLevels: string[]
    initialLevel: string
}

// ─── Constants ──────────────────────────────────────
const ARTICLE_COLORS: Record<string, string> = {
    MASKULIN: '#3B82F6',
    FEMININ: '#EC4899',
    NEUTRUM: '#10B981',
}

const ARTICLE_TEXT: Record<string, string> = {
    MASKULIN: 'der',
    FEMININ: 'die',
    NEUTRUM: 'das',
}

const WORD_TYPE_LABELS: Record<string, string> = {
    NOMEN: 'Nomen', VERB: 'Verb', ADJEKTIV: 'Adj.',
    ADVERB: 'Adv.', PRAEPOSITION: 'Präp.', KONJUNKTION: 'Konj.',
    PARTIKEL: 'Part.', PRONOMEN: 'Pron.', PHRASE: 'Phrase',
}

const CEFR_COLORS: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
    A1: { bg: '#DCFCE7', text: '#166534', border: '#86EFAC', gradient: 'from-green-500 to-emerald-600' },
    A2: { bg: '#D9F99D', text: '#3F6212', border: '#BEF264', gradient: 'from-lime-500 to-green-600' },
    B1: { bg: '#FED7AA', text: '#9A3412', border: '#FDBA74', gradient: 'from-orange-400 to-amber-600' },
    B2: { bg: '#FECACA', text: '#991B1B', border: '#FCA5A5', gradient: 'from-red-500 to-orange-600' },
    C1: { bg: '#E9D5FF', text: '#6B21A8', border: '#C084FC', gradient: 'from-purple-500 to-violet-600' },
    C2: { bg: '#DDD6FE', text: '#4C1D95', border: '#A78BFA', gradient: 'from-violet-600 to-purple-800' },
}

// ─── Progress Ring SVG ──────────────────────────────
function ProgressRing({ progress, size = 32, strokeWidth = 3 }: { progress: number; size?: number; strokeWidth?: number }) {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (progress / 100) * circumference

    return (
        <svg width={size} height={size} className="transform -rotate-90">
            <circle
                cx={size / 2} cy={size / 2} r={radius}
                stroke="#E5E7EB" strokeWidth={strokeWidth} fill="none"
            />
            <circle
                cx={size / 2} cy={size / 2} r={radius}
                stroke={progress >= 100 ? '#10B981' : '#FF6B35'}
                strokeWidth={strokeWidth} fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
            />
        </svg>
    )
}

// ─── Main Component ─────────────────────────────────
export function VocabularyClient({ themes, totalWords, totalDue, availableLevels, initialLevel }: VocabularyClientProps) {
    const router = useRouter()
    const [currentLevel, setCurrentLevel] = useState(initialLevel)
    const [currentThemes, setCurrentThemes] = useState(themes)
    const [currentTotalWords, setCurrentTotalWords] = useState(totalWords)
    const [currentTotalDue, setCurrentTotalDue] = useState(totalDue)
    const [selectedThemeSlug, setSelectedThemeSlug] = useState<string>(themes[0]?.slug ?? '')
    const [words, setWords] = useState<VocabItem[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isLevelLoading, setIsLevelLoading] = useState(false)
    const [showAllWords, setShowAllWords] = useState(false)
    const [isAdding, setIsAdding] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const detailRef = useRef<HTMLDivElement>(null)
    const activeLevelRef = useRef(initialLevel)
    const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const cefrColors = CEFR_COLORS[currentLevel] || CEFR_COLORS.A1
    const selectedTheme = currentThemes.find(t => t.slug === selectedThemeSlug) ?? null
    const totalLearned = currentThemes.reduce((s, t) => s + t.srsProgress.learned, 0)
    const overallProgress = currentTotalWords > 0 ? Math.round((totalLearned / currentTotalWords) * 100) : 0

    // Load words for a specific theme + level
    const loadWordsForLevel = useCallback(async (slug: string, level: string) => {
        setIsLoading(true)
        try {
            const res = await fetch(`/api/v1/vocabulary?theme=${slug}&level=${level}&limit=100`)
            const data = await res.json()
            // Only update if this level is still the active one (avoid race condition)
            if (activeLevelRef.current === level && data.success) {
                setWords(data.data)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Switch CEFR level — no useCallback to avoid stale closures
    const switchLevel = async (level: string) => {
        if (level === activeLevelRef.current || isLevelLoading) return
        
        // Update ref immediately (sync) to guard against race conditions
        activeLevelRef.current = level
        setCurrentLevel(level)
        setIsLevelLoading(true)
        // Clear stale data immediately for visual feedback
        setWords([])
        setShowAllWords(false)
        
        try {
            const res = await fetch(`/api/v1/vocabulary/themes?level=${level}`)
            const data = await res.json()
            // Check if user has switched to another level in the meantime
            if (activeLevelRef.current !== level) return
            if (data.success) {
                const newThemes = data.data.map((t: any) => ({
                    ...t,
                    srsProgress: t.srsProgress ?? { total: 0, learned: 0, due: 0 },
                }))
                setCurrentThemes(newThemes)
                setCurrentTotalWords(newThemes.reduce((s: number, t: any) => s + t.wordCount, 0))
                setCurrentTotalDue(newThemes.reduce((s: number, t: any) => s + (t.srsProgress?.due ?? 0), 0))
                if (newThemes[0]) {
                    setSelectedThemeSlug(newThemes[0].slug)
                    loadWordsForLevel(newThemes[0].slug, level)
                } else {
                    setWords([])
                    setSelectedThemeSlug('')
                }
            }
        } catch (err) {
            console.error(err)
        } finally {
            if (activeLevelRef.current === level) {
                setIsLevelLoading(false)
            }
        }
    }

    // Load words when theme changes
    const loadWords = useCallback(async (slug: string) => {
        loadWordsForLevel(slug, activeLevelRef.current)
    }, [loadWordsForLevel])

    // Auto-load first theme
    useEffect(() => {
        if (themes[0]) loadWordsForLevel(themes[0].slug, initialLevel)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
        }
    }, [])

    const selectTheme = (slug: string) => {
        setSelectedThemeSlug(slug)
        setShowAllWords(false)
        loadWords(slug)
        // Smooth scroll to detail panel
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

    // Scroll theme selector
    const scrollThemes = (dir: 'left' | 'right') => {
        scrollRef.current?.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' })
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-6">

            {/* ╔══════════════════════════════════════════╗
                ║  SECTION 1 — Hero Banner                 ║
                ╚══════════════════════════════════════════╝ */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
                {/* CEFR Level Tabs */}
                {availableLevels.length > 1 && (
                    <div className="flex gap-2 mb-4">
                        {availableLevels.map(level => {
                            const colors = CEFR_COLORS[level] ?? CEFR_COLORS['A1']!
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
                    {currentTotalDue > 0 ? (
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
                                <span className="ml-1 bg-white/20 rounded-lg px-2 py-0.5 text-xs">{currentTotalDue}</span>
                            </Link>
                        </div>
                    ) : (
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
                                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF6B35] to-orange-500 text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-orange-200 whitespace-nowrap"
                            >
                                <span>✨</span>
                                Jetzt lernen
                            </Link>
                        </div>
                    )}
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

            {/* ╔══════════════════════════════════════════╗
                ║  SECTION 2 — Theme Selector (horizontal) ║
                ╚══════════════════════════════════════════╝ */}
            <div className="mb-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Deine Themen
                </h2>
                <div className="relative group">
                    {/* Left scroll button */}
                    <button
                        onClick={() => scrollThemes('left')}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity -ml-3"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    {/* Scrollable theme row */}
                    <div
                        ref={scrollRef}
                        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide scroll-smooth"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {currentThemes.map((theme) => {
                            const isSelected = selectedThemeSlug === theme.slug
                            const progress = theme.wordCount > 0
                                ? Math.round((theme.srsProgress.learned / theme.wordCount) * 100)
                                : 0

                            return (
                                <button
                                    key={theme.id}
                                    onClick={() => selectTheme(theme.slug)}
                                    className={`flex-shrink-0 flex flex-col items-center p-3 rounded-2xl border-2 transition-all duration-200 w-[110px]
                                        ${isSelected
                                            ? 'border-[#FF6B35] bg-orange-50 shadow-md shadow-orange-100'
                                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                                        }`}
                                >
                                    {/* Theme image */}
                                    <div className="relative mb-2">
                                        {theme.imageUrl ? (
                                            <Image
                                                src={theme.imageUrl}
                                                alt={theme.name}
                                                width={56}
                                                height={56}
                                                className="rounded-xl object-cover"
                                            />
                                        ) : (
                                            <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-2xl">
                                                📖
                                            </div>
                                        )}
                                        {/* Mini progress ring overlay */}
                                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                                            <ProgressRing progress={progress} size={22} strokeWidth={2.5} />
                                        </div>
                                    </div>
                                    {/* Theme name */}
                                    <span className={`text-xs font-medium text-center leading-tight line-clamp-2
                                        ${isSelected ? 'text-[#FF6B35]' : 'text-gray-700'}`}
                                    >
                                        {theme.name}
                                    </span>
                                </button>
                            )
                        })}
                    </div>

                    {/* Right scroll button */}
                    <button
                        onClick={() => scrollThemes('right')}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity -mr-3"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* ╔══════════════════════════════════════════╗
                ║  SECTION 3 — Theme Detail Panel          ║
                ╚══════════════════════════════════════════╝ */}
            {selectedTheme && (
                <div
                    ref={detailRef}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in-up"
                >
                    {/* Theme Header */}
                    <div className="p-6 flex items-start gap-5">
                        {/* Large theme image */}
                        {selectedTheme.imageUrl ? (
                            <Image
                                src={selectedTheme.imageUrl}
                                alt={selectedTheme.name}
                                width={96}
                                height={96}
                                className="rounded-2xl object-cover shadow-sm flex-shrink-0"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-2xl bg-gray-100 flex items-center justify-center text-4xl flex-shrink-0">
                                📖
                            </div>
                        )}

                        <div className="flex-1 min-w-0">
                            <h2 className="text-xl font-bold text-gray-900">{selectedTheme.name}</h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                {selectedTheme.nameVi} • {selectedTheme.wordCount} Wörter
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
                                        {words.slice(0, 12).map((w) => {
                                            const color = w.article ? ARTICLE_COLORS[w.article] ?? '#6B7280' : '#6B7280'
                                            const artText = w.article ? ARTICLE_TEXT[w.article] : null

                                            return (
                                                <div
                                                    key={w.id}
                                                    className="flex-shrink-0 w-[140px] bg-gray-50 rounded-xl p-3 border border-gray-100 hover:shadow-sm transition-shadow"
                                                >
                                                    {w.imageUrl && (
                                                        <div className="mb-2 flex justify-center">
                                                            <Image
                                                                src={w.imageUrl}
                                                                alt={w.word}
                                                                width={64}
                                                                height={64}
                                                                className="rounded-lg object-cover"
                                                            />
                                                        </div>
                                                    )}
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        {artText ? (
                                                            <span
                                                                className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded"
                                                                style={{ color, backgroundColor: `${color}15` }}
                                                            >
                                                                {artText}
                                                            </span>
                                                        ) : <span />}
                                                        <AudioPlayer src={w.audioUrl} text={w.word} size="sm" />
                                                    </div>
                                                    <p className="font-bold text-gray-900 text-sm leading-tight">{w.word}</p>
                                                    <p className="text-xs text-gray-500 mt-1 leading-tight">{w.meaningVi}</p>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    {words.length > 12 && (
                                        <button
                                            onClick={() => setShowAllWords(true)}
                                            className="mt-3 text-sm font-semibold text-[#FF6B35] hover:text-orange-600 transition-colors flex items-center gap-1"
                                        >
                                            Alle {selectedTheme.wordCount} Wörter anzeigen
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    )}
                                    {words.length > 0 && words.length <= 12 && (
                                        <button
                                            onClick={() => setShowAllWords(true)}
                                            className="mt-3 text-sm font-semibold text-[#FF6B35] hover:text-orange-600 transition-colors flex items-center gap-1"
                                        >
                                            Details anzeigen
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
                                    {words.map((w) => {
                                        const color = w.article ? ARTICLE_COLORS[w.article] ?? '#6B7280' : '#6B7280'
                                        const artText = w.article ? ARTICLE_TEXT[w.article] : null

                                        return (
                                            <div
                                                key={w.id}
                                                className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100 hover:bg-white hover:shadow-sm transition-all group"
                                            >
                                                {/* Word image or article color block */}
                                                {w.imageUrl ? (
                                                    <Image
                                                        src={w.imageUrl}
                                                        alt={w.word}
                                                        width={44}
                                                        height={44}
                                                        className="rounded-lg object-cover shrink-0"
                                                    />
                                                ) : (
                                                    <div
                                                        className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold"
                                                        style={{ backgroundColor: `${color}12`, color }}
                                                    >
                                                        {artText ?? w.word.charAt(0)}
                                                    </div>
                                                )}

                                                {/* Word info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-baseline gap-1.5 flex-wrap">
                                                        {artText && (
                                                            <span
                                                                className="text-[10px] font-bold px-1 py-0.5 rounded"
                                                                style={{ color, backgroundColor: `${color}15` }}
                                                            >
                                                                {artText}
                                                            </span>
                                                        )}
                                                        <span className="font-bold text-gray-900 text-sm">{w.word}</span>
                                                        {w.plural && w.plural !== '-' && (
                                                            <span className="text-[11px] text-gray-400">({w.plural})</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-600 mt-0.5">{w.meaningVi}</p>
                                                </div>

                                                {/* Type badge + audio */}
                                                <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                    <span
                                                        className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                                                        style={{ background: `${color}10`, color }}
                                                    >
                                                        {WORD_TYPE_LABELS[w.wordType] ?? w.wordType}
                                                    </span>
                                                    <AudioPlayer src={w.audioUrl} text={w.word} size="sm" />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
