'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Mascot } from '@/components/ui/mascot'

// ─── Types ──────────────────────────────────────────
interface ExerciseItem {
    id: string
    exerciseId: string
    topic: string
    questionCount: number
    wordCount: number | null
    completion: { bestScore: number; totalQuestions: number; attempts: number } | null
}

interface Teil {
    teil: number
    teilName: string
    exercises: ExerciseItem[]
}

interface ReadingClientProps {
    teile: Teil[]
    totalExercises: number
    totalCompleted: number
    availableLevels: string[]
    initialLevel: string
}

// ─── Constants ──────────────────────────────────────
const CEFR_COLORS: Record<string, { bg: string; text: string; border: string; gradient: string; css: string; shadow: string }> = {
    A1: { bg: '#DCFCE7', text: '#166534', border: '#86EFAC', gradient: 'from-green-500 to-emerald-600', css: 'linear-gradient(135deg, #22C55E, #059669)', shadow: 'rgba(34,197,94,0.3)' },
    A2: { bg: '#D9F99D', text: '#3F6212', border: '#BEF264', gradient: 'from-lime-500 to-green-600', css: 'linear-gradient(135deg, #84CC16, #16A34A)', shadow: 'rgba(132,204,22,0.3)' },
    B1: { bg: '#FED7AA', text: '#9A3412', border: '#FDBA74', gradient: 'from-orange-400 to-amber-600', css: 'linear-gradient(135deg, #F97316, #D97706)', shadow: 'rgba(249,115,22,0.3)' },
    B2: { bg: '#FECACA', text: '#991B1B', border: '#FCA5A5', gradient: 'from-red-500 to-orange-600', css: 'linear-gradient(135deg, #EF4444, #EA580C)', shadow: 'rgba(239,68,68,0.3)' },
    C1: { bg: '#E9D5FF', text: '#6B21A8', border: '#C084FC', gradient: 'from-purple-500 to-violet-600', css: 'linear-gradient(135deg, #A855F7, #7C3AED)', shadow: 'rgba(168,85,247,0.3)' },
    C2: { bg: '#DDD6FE', text: '#4C1D95', border: '#A78BFA', gradient: 'from-violet-600 to-purple-800', css: 'linear-gradient(135deg, #7C3AED, #6B21A8)', shadow: 'rgba(124,58,237,0.3)' },
}

const TEIL_ICONS: Record<number, string> = {
    1: '📧',   // Kurze Texte / Emails
    2: '📋',   // Anzeigen / Infotafel
    3: '🪧',   // Schilder / Kleinanzeigen
    4: '🗓️',   // Fahrplan / Leserbriefe
    5: '📰',   // Infoblatt
}

// ─── Progress Ring ──────────────────────────────────
function ProgressRing({ progress, size = 40, strokeWidth = 3.5 }: { progress: number; size?: number; strokeWidth?: number }) {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (progress / 100) * circumference
    return (
        <svg width={size} height={size} className="transform -rotate-90">
            <circle cx={size / 2} cy={size / 2} r={radius} stroke="#E5E7EB" strokeWidth={strokeWidth} fill="none" />
            <circle
                cx={size / 2} cy={size / 2} r={radius}
                stroke={progress >= 100 ? '#10B981' : '#FF6B35'}
                strokeWidth={strokeWidth} fill="none"
                strokeDasharray={circumference} strokeDashoffset={offset}
                strokeLinecap="round" className="transition-all duration-700 ease-out"
            />
        </svg>
    )
}

// ─── Main Component ─────────────────────────────────
export function ReadingClient({ teile, totalExercises, totalCompleted, availableLevels, initialLevel }: ReadingClientProps) {
    const router = useRouter()
    const [currentLevel, setCurrentLevel] = useState(initialLevel)
    const [currentTeile, setCurrentTeile] = useState(teile)
    const [currentTotal, setCurrentTotal] = useState(totalExercises)
    const [currentCompleted, setCurrentCompleted] = useState(totalCompleted)
    const [isLevelLoading, setIsLevelLoading] = useState(false)
    const [expandedTeil, setExpandedTeil] = useState<number | null>(teile[0]?.teil ?? null)

    const cefrColors = CEFR_COLORS[currentLevel] ?? CEFR_COLORS.A1!
    const overallProgress = currentTotal > 0 ? Math.round((currentCompleted / currentTotal) * 100) : 0

    // Switch CEFR level
    const switchLevel = useCallback(async (level: string) => {
        if (level === currentLevel) return
        setIsLevelLoading(true)
        setCurrentLevel(level)
        try {
            const res = await fetch(`/api/v1/reading?level=${level}`)
            const data = await res.json()
            if (data.success) {
                setCurrentTeile(data.data.teile.map((t: any) => ({
                    teil: t.teil,
                    teilName: t.teilName,
                    exercises: t.exercises.map((ex: any) => ({
                        id: ex.id,
                        exerciseId: ex.exerciseId,
                        topic: ex.topic,
                        questionCount: ex._count?.questions ?? 0,
                        wordCount: (ex.metadataJson as any)?.word_count ?? null,
                        completion: null,
                    })),
                })))
                setCurrentTotal(data.data.totalExercises)
                setCurrentCompleted(0)
                setExpandedTeil(data.data.teile[0]?.teil ?? null)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setIsLevelLoading(false)
        }
    }, [currentLevel])

    const toggleTeil = (teil: number) => {
        setExpandedTeil(expandedTeil === teil ? null : teil)
    }

    return (
        <div className="max-w-5xl mx-auto">

            {/* ═══ HERO BANNER ═══ */}
            <div className="rounded-2xl border border-gray-100 shadow-sm mb-6 overflow-hidden" style={{ background: `linear-gradient(180deg, ${cefrColors.bg}22 0%, #FFFFFF 100%)` }}>
                {/* Level color stripe */}
                <div className="h-1" style={{ background: cefrColors.css }} />

                <div className="p-6">
                    {/* CEFR Level Tabs */}
                    {availableLevels.length > 0 && (
                        <div className="flex gap-2 mb-5">
                            {availableLevels.map(level => {
                                const colors = CEFR_COLORS[level] ?? CEFR_COLORS['A1']!
                                const isActive = level === currentLevel
                                return (
                                    <button
                                        key={level}
                                        onClick={() => switchLevel(level)}
                                        disabled={isLevelLoading}
                                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${isActive
                                            ? 'text-white shadow-md scale-105'
                                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                            } ${isLevelLoading ? 'opacity-50 cursor-wait' : ''}`}
                                        style={isActive ? { background: colors.css, boxShadow: `0 4px 12px ${colors.shadow}` } : undefined}
                                    >
                                        {level}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                    <div className="flex items-center gap-4">
                        <Mascot variant="lesen" size={56} />
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-gray-900">Leseverstehen {currentLevel}</h1>
                            <p className="text-sm text-gray-500 mt-0.5">
                                <span className="font-semibold" style={{ color: cefrColors.text }}>{currentCompleted}</span> von {currentTotal} abgeschlossen
                            </p>
                        </div>
                        {currentTotal > 0 && (
                            <button
                                onClick={() => {
                                    for (const teil of currentTeile) {
                                        for (const ex of teil.exercises) {
                                            if (!ex.completion) {
                                                router.push(`/reading/${ex.exerciseId}`)
                                                return
                                            }
                                        }
                                    }
                                }}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg whitespace-nowrap"
                                style={{ background: cefrColors.css, boxShadow: `0 4px 16px ${cefrColors.shadow}` }}
                            >
                                <span>📖</span>
                                Weiterlernen
                            </button>
                        )}
                    </div>
                    {/* Overall progress bar — level-colored */}
                    <div className="mt-4">
                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-700 ease-out"
                                style={{ width: `${Math.max(overallProgress, 1)}%`, background: cefrColors.css }}
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-1.5 text-right">{overallProgress}% abgeschlossen</p>
                    </div>
                </div>
            </div>

            {/* ═══ TEIL CARDS ═══ */}
            {isLevelLoading ? (
                <div className="flex items-center justify-center py-16">
                    <Mascot variant="loading" size={64} />
                </div>
            ) : currentTeile.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center">
                    <Mascot variant="thinking" size={80} />
                    <h2 className="text-lg font-bold text-gray-700 mt-4">Noch keine Aufgaben</h2>
                    <p className="text-sm text-gray-500 mt-2">
                        Für dieses Level gibt es noch keine Leseverstehen-Aufgaben.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {currentTeile.map((teil) => {
                        const completedInTeil = teil.exercises.filter(e => e.completion !== null).length
                        const teilProgress = teil.exercises.length > 0
                            ? Math.round((completedInTeil / teil.exercises.length) * 100)
                            : 0
                        const isExpanded = expandedTeil === teil.teil

                        return (
                            <div key={teil.teil} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
                                {/* Teil Header */}
                                <button
                                    onClick={() => toggleTeil(teil.teil)}
                                    className="w-full flex items-center gap-4 p-5 hover:bg-gray-50/50 transition-colors text-left"
                                >
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                                        style={{ backgroundColor: `${cefrColors.bg}` }}
                                    >
                                        {TEIL_ICONS[teil.teil] || '📖'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base font-bold text-gray-900">
                                            Teil {teil.teil} — {teil.teilName}
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-0.5">
                                            {teil.exercises.length} Aufgaben • <span style={{ color: cefrColors.text, fontWeight: 600 }}>{completedInTeil}</span> abgeschlossen
                                        </p>
                                    </div>
                                    <div className="relative flex items-center gap-3">
                                        <ProgressRing progress={teilProgress} size={44} strokeWidth={4} />
                                        <span className="text-sm font-bold text-gray-700 absolute inset-0 flex items-center justify-center" style={{ width: 44 }}>
                                            {teilProgress}%
                                        </span>
                                        <svg
                                            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </button>

                                {/* Exercise List */}
                                {isExpanded && (
                                    <div className="px-5 pb-4 animate-fade-in-up">
                                        <div className="border-t border-gray-100 pt-3 space-y-2">
                                            {teil.exercises.map((ex, idx) => {
                                                const isDone = ex.completion !== null
                                                const scoreDisplay = isDone
                                                    ? `${ex.completion!.bestScore}/${ex.completion!.totalQuestions}`
                                                    : null
                                                const firstUncompleted = teil.exercises.findIndex(e => !e.completion)
                                                const isCurrent = idx === firstUncompleted
                                                const isLocked = !isDone && idx > firstUncompleted && firstUncompleted !== -1

                                                return (
                                                    <button
                                                        key={ex.id}
                                                        onClick={() => {
                                                            if (!isLocked) router.push(`/reading/${ex.exerciseId}`)
                                                        }}
                                                        disabled={isLocked}
                                                        className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all text-left
                                                            ${isDone
                                                                ? 'bg-green-50/50 border border-green-100 hover:shadow-sm hover:translate-x-0.5'
                                                                : isCurrent
                                                                    ? 'border-2 shadow-sm'
                                                                    : isLocked
                                                                        ? 'bg-gray-50 border border-gray-100 opacity-50 cursor-not-allowed'
                                                                        : 'bg-gray-50 border border-gray-100 hover:shadow-sm'
                                                            }`}
                                                    style={isCurrent ? { borderColor: cefrColors.text, backgroundColor: `${cefrColors.bg}33`, boxShadow: `0 2px 8px ${cefrColors.shadow}` } : undefined}
                                                    >
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 transition-all
                                                            ${isDone ? 'bg-green-500 text-white' : isCurrent ? 'text-white' : 'bg-gray-200 text-gray-500'}`}
                                                            style={isCurrent ? { background: cefrColors.css } : undefined}
                                                        >
                                                            {isDone ? '✓' : idx + 1}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-sm font-semibold truncate ${isDone ? 'text-green-800' : isLocked ? 'text-gray-400' : 'text-gray-900'}`}>
                                                                {ex.topic}
                                                            </p>
                                                            <p className={`text-xs mt-0.5 ${isDone ? 'text-green-600' : 'text-gray-400'}`}>
                                                                {ex.questionCount} Fragen
                                                                {ex.wordCount && ` • ~${ex.wordCount} Wörter`}
                                                            </p>
                                                        </div>
                                                        <div className="shrink-0">
                                                            {isDone ? (
                                                                <span className="text-sm font-bold text-green-600 bg-green-100 px-2.5 py-1 rounded-lg">
                                                                    {scoreDisplay}
                                                                </span>
                                                            ) : isCurrent ? (
                                                                <span className="text-xs font-bold px-2.5 py-1 rounded-lg"
                                                                    style={{ color: cefrColors.text, backgroundColor: cefrColors.bg }}>
                                                                    Starten
                                                                </span>
                                                            ) : isLocked ? (
                                                                <span className="text-gray-300 text-lg">🔒</span>
                                                            ) : null}
                                                        </div>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
