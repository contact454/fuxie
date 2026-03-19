'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
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
}

interface PracticeHubProps {
    themes: Theme[]
    availableLevels: string[]
    initialLevel: string
}

// ─── Constants ──────────────────────────────────────
const EXERCISE_TYPES = [
    {
        key: 'mc',
        icon: '🔤',
        name: 'Multiple Choice',
        desc: 'Wähle die richtige Antwort',
        available: true,
    },
    {
        key: 'matching',
        icon: '🔗',
        name: 'Matching',
        desc: 'Finde die passenden Paare',
        available: true,
    },
    {
        key: 'spelling',
        icon: '✍️',
        name: 'Spelling',
        desc: 'Schreibe das richtige Wort',
        available: true,
    },
    {
        key: 'cloze',
        icon: '📝',
        name: 'Lückentext',
        desc: 'Fülle die Lücke im Satz',
        available: true,
    },
    {
        key: 'scramble',
        icon: '🧩',
        name: 'Satzpuzzle',
        desc: 'Ordne die Wörter richtig',
        available: true,
    },
    {
        key: 'speed',
        icon: '⚡',
        name: 'Speed Review',
        desc: 'Antworte so schnell wie möglich',
        available: true,
    },
]

const CEFR_COLORS: Record<string, { gradient: string }> = {
    A1: { gradient: 'from-green-500 to-emerald-600' },
    A2: { gradient: 'from-lime-500 to-green-600' },
    B1: { gradient: 'from-orange-400 to-amber-600' },
    B2: { gradient: 'from-red-500 to-orange-600' },
    C1: { gradient: 'from-purple-500 to-violet-600' },
    C2: { gradient: 'from-violet-600 to-purple-800' },
}

// ─── Component ──────────────────────────────────────
export function PracticeHub({ themes, availableLevels, initialLevel }: PracticeHubProps) {
    const router = useRouter()
    const [currentLevel, setCurrentLevel] = useState(initialLevel)
    const [currentThemes, setCurrentThemes] = useState(themes)
    const [selectedThemeSlug, setSelectedThemeSlug] = useState(themes[0]?.slug ?? '')
    const [isLevelLoading, setIsLevelLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    const selectedTheme = currentThemes.find(t => t.slug === selectedThemeSlug)

    // Switch CEFR level
    const switchLevel = useCallback(async (level: string) => {
        if (level === currentLevel) return
        setIsLevelLoading(true)
        setCurrentLevel(level)
        try {
            const res = await fetch(`/api/v1/vocabulary/themes?level=${level}`)
            const data = await res.json()
            if (data.success) {
                const newThemes = data.data.map((t: any) => ({
                    id: t.id,
                    slug: t.slug,
                    name: t.name,
                    nameVi: t.nameVi,
                    cefrLevel: t.cefrLevel,
                    imageUrl: t.imageUrl,
                    wordCount: t.wordCount ?? t._count?.items ?? 0,
                }))
                setCurrentThemes(newThemes)
                if (newThemes[0]) setSelectedThemeSlug(newThemes[0].slug)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setIsLevelLoading(false)
        }
    }, [currentLevel])

    const startExercise = (type: string) => {
        if (!selectedThemeSlug) return
        router.push(`/vocabulary/practice/${type}?theme=${selectedThemeSlug}&level=${currentLevel}`)
    }

    const scrollThemes = (dir: 'left' | 'right') => {
        scrollRef.current?.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' })
    }

    return (
        <div className="max-w-5xl mx-auto">
            {/* ═══ Header ═══ */}
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
                        <h1 className="text-2xl font-bold text-gray-900">Wortschatz üben</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Wähle ein Thema und eine Übungsart
                        </p>
                    </div>
                    <a
                        href="/vocabulary"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
                    >
                        📖 Wörter durchsehen
                    </a>
                </div>
            </div>

            {/* ═══ Theme Selector ═══ */}
            <div className="mb-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Thema wählen
                </h2>
                <div className="relative group">
                    <button
                        onClick={() => scrollThemes('left')}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity -ml-3"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <div
                        ref={scrollRef}
                        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide scroll-smooth"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {currentThemes.map(theme => {
                            const isSelected = selectedThemeSlug === theme.slug
                            return (
                                <button
                                    key={theme.id}
                                    onClick={() => setSelectedThemeSlug(theme.slug)}
                                    className={`flex-shrink-0 flex flex-col items-center p-3 rounded-2xl border-2 transition-all duration-200 w-[110px]
                                        ${isSelected
                                            ? 'border-[#004E89] bg-blue-50 shadow-md shadow-blue-100'
                                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                                        }`}
                                >
                                    {theme.imageUrl ? (
                                        <Image
                                            src={theme.imageUrl}
                                            alt={theme.name}
                                            width={56}
                                            height={56}
                                            className="rounded-xl object-cover mb-2"
                                        />
                                    ) : (
                                        <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-2xl mb-2">📖</div>
                                    )}
                                    <span className={`text-xs font-medium text-center leading-tight line-clamp-2
                                        ${isSelected ? 'text-[#004E89]' : 'text-gray-700'}`}
                                    >
                                        {theme.name}
                                    </span>
                                    <span className="text-[10px] text-gray-400 mt-0.5">{theme.wordCount} Wörter</span>
                                </button>
                            )
                        })}
                    </div>

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

            {/* ═══ Exercise Type Grid ═══ */}
            <div className="mb-8">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Übungsart wählen
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {EXERCISE_TYPES.map(ex => (
                        <button
                            key={ex.key}
                            onClick={() => ex.available && startExercise(ex.key)}
                            disabled={!ex.available || !selectedThemeSlug}
                            className={`relative p-5 rounded-2xl border-2 text-left transition-all duration-300 group overflow-hidden ${
                                ex.available
                                    ? 'border-gray-200 bg-white hover:border-[#004E89] hover:shadow-xl hover:shadow-blue-100/50 hover:-translate-y-1 hover:scale-[1.03] cursor-pointer active:scale-[0.98] active:shadow-md'
                                    : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                            }`}
                        >
                            {/* Hover gradient overlay */}
                            {ex.available && (
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-[#004E89]/[0.04] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />
                            )}

                            {/* Coming soon badge */}
                            {!ex.available && (
                                <span className="absolute top-2 right-2 text-[10px] font-bold bg-gray-200 text-gray-500 rounded-full px-2 py-0.5">
                                    Bald
                                </span>
                            )}

                            <span className="text-3xl mb-3 block transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">{ex.icon}</span>
                            <h3 className={`font-bold text-base mb-1 transition-colors duration-200 ${
                                ex.available ? 'text-gray-900 group-hover:text-[#004E89]' : 'text-gray-500'
                            }`}>
                                {ex.name}
                            </h3>
                            <p className="text-xs text-gray-500 transition-colors duration-200 group-hover:text-gray-600">{ex.desc}</p>

                            {ex.available && selectedThemeSlug && (
                                <div className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#004E89] transition-all duration-200 group-hover:gap-2">
                                    Starten
                                    <svg className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* ═══ Selected Theme Info ═══ */}
            {selectedTheme && (
                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 text-sm text-[#004E89]">
                    <span className="font-bold">Ausgewähltes Thema:</span> {selectedTheme.name}
                    {selectedTheme.nameVi && <span className="text-blue-400"> — {selectedTheme.nameVi}</span>}
                    <span className="text-blue-300 ml-2">({selectedTheme.wordCount} Wörter)</span>
                </div>
            )}
        </div>
    )
}
