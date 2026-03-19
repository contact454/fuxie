'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Mascot } from '@/components/ui/mascot'
import { useLevelSwitcher } from '@/hooks/use-level-switcher'

// ─── Types ──────────────────────────────────────────
interface LessonItem {
    id: string
    lessonId: string
    title: string
    topic: string
    taskType: string
    audioDuration: number | null
    questionCount: number
    completion: { bestScore: number; totalQuestions: number; attempts: number } | null
}

interface Teil {
    teil: number
    teilName: string
    lessons: LessonItem[]
}

interface ListeningClientProps {
    teile: Teil[]
    totalLessons: number
    totalCompleted: number
    availableLevels: string[]
    initialLevel: string
}

// ─── Constants ──────────────────────────────────────
const CEFR_COLORS: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
    A1: { bg: '#DCFCE7', text: '#166534', border: '#86EFAC', gradient: 'from-green-500 to-emerald-600' },
    A2: { bg: '#D9F99D', text: '#3F6212', border: '#BEF264', gradient: 'from-lime-500 to-green-600' },
    B1: { bg: '#FED7AA', text: '#9A3412', border: '#FDBA74', gradient: 'from-orange-400 to-amber-600' },
    B2: { bg: '#FECACA', text: '#991B1B', border: '#FCA5A5', gradient: 'from-red-500 to-orange-600' },
    C1: { bg: '#E9D5FF', text: '#6B21A8', border: '#C084FC', gradient: 'from-purple-500 to-violet-600' },
    C2: { bg: '#DDD6FE', text: '#4C1D95', border: '#A78BFA', gradient: 'from-violet-600 to-purple-800' },
}

const TEIL_ICONS: Record<number, string> = {
    1: '🎧',
    2: '📢',
    3: '📞',
    4: '🎙️',
}

function formatDuration(seconds: number | null): string {
    if (!seconds) return '—'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
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
export function ListeningClient({ teile, totalLessons, totalCompleted, availableLevels, initialLevel }: ListeningClientProps) {
    const router = useRouter()
    const [currentTeile, setCurrentTeile] = useState(teile)
    const [currentTotal, setCurrentTotal] = useState(totalLessons)
    const [currentCompleted, setCurrentCompleted] = useState(totalCompleted)
    const [expandedTeil, setExpandedTeil] = useState<number | null>(teile[0]?.teil ?? null)

    const { currentLevel, isLevelLoading, switchLevel } = useLevelSwitcher({
        initialLevel,
        apiEndpoint: '/api/v1/listening?level={level}',
        transformData: (data: any) => data,
        onSuccess: useCallback((data: any) => {
            setCurrentTeile(data.data.teile.map((t: any) => ({
                teil: t.teil,
                teilName: t.teilName,
                lessons: t.lessons.map((l: any) => ({
                    id: l.id,
                    lessonId: l.lessonId,
                    title: l.title,
                    topic: l.topic,
                    taskType: l.taskType,
                    audioDuration: l.audioDuration,
                    questionCount: l._count?.questions ?? 0,
                    completion: null,
                })),
            })))
            setCurrentTotal(data.data.totalLessons)
            setCurrentCompleted(0)
            setExpandedTeil(data.data.teile[0]?.teil ?? null)
        }, []),
    })

    const cefrColors = CEFR_COLORS[currentLevel] ?? CEFR_COLORS.A1!
    const overallProgress = currentTotal > 0 ? Math.round((currentCompleted / currentTotal) * 100) : 0

    const toggleTeil = (teil: number) => {
        setExpandedTeil(expandedTeil === teil ? null : teil)
    }

    return (
        <div className="max-w-5xl mx-auto">

            {/* ═══ HERO BANNER ═══ */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
                {/* CEFR Level Tabs */}
                {availableLevels.length > 0 && (
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
                    <Mascot variant="hoeren" size={56} />
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-gray-900">Hörverstehen {currentLevel}</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            <span className="font-semibold text-gray-700">{currentCompleted}</span> von {currentTotal} abgeschlossen
                        </p>
                    </div>
                    {currentTotal > 0 && (
                        <button
                            onClick={() => {
                                // Find first uncompleted lesson
                                for (const teil of currentTeile) {
                                    for (const lesson of teil.lessons) {
                                        if (!lesson.completion) {
                                            router.push(`/listening/${lesson.lessonId}`)
                                            return
                                        }
                                    }
                                }
                            }}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r ${cefrColors?.gradient ?? 'from-[#FF6B35] to-orange-500'} text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg whitespace-nowrap`}
                        >
                            <span>🎧</span>
                            Weiterlernen
                        </button>
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

            {/* ═══ TEIL CARDS ═══ */}
            {isLevelLoading ? (
                <div className="flex items-center justify-center py-16">
                    <Mascot variant="loading" size={64} />
                </div>
            ) : currentTeile.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center">
                    <Mascot variant="thinking" size={80} />
                    <h2 className="text-lg font-bold text-gray-700 mt-4">Noch keine Lektionen</h2>
                    <p className="text-sm text-gray-500 mt-2">
                        Für dieses Level gibt es noch keine Hörverstehen-Lektionen.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {currentTeile.map((teil) => {
                        const completedInTeil = teil.lessons.filter(l => l.completion !== null).length
                        const teilProgress = teil.lessons.length > 0
                            ? Math.round((completedInTeil / teil.lessons.length) * 100)
                            : 0
                        const isExpanded = expandedTeil === teil.teil

                        return (
                            <div key={teil.teil} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all">
                                {/* Teil Header — clickable */}
                                <button
                                    onClick={() => toggleTeil(teil.teil)}
                                    className="w-full flex items-center gap-4 p-5 hover:bg-gray-50/50 transition-colors text-left"
                                >
                                    {/* Teil icon */}
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                                        style={{ backgroundColor: `${cefrColors.bg}` }}
                                    >
                                        {TEIL_ICONS[teil.teil] || '🎧'}
                                    </div>
                                    {/* Teil info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base font-bold text-gray-900">
                                            Teil {teil.teil} — {teil.teilName}
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-0.5">
                                            {teil.lessons.length} Lektionen • {completedInTeil} abgeschlossen
                                        </p>
                                    </div>
                                    {/* Progress ring */}
                                    <div className="relative flex items-center gap-3">
                                        <ProgressRing progress={teilProgress} size={44} strokeWidth={4} />
                                        <span className="text-sm font-bold text-gray-700 absolute inset-0 flex items-center justify-center" style={{ width: 44 }}>
                                            {teilProgress}%
                                        </span>
                                        {/* Expand chevron */}
                                        <svg
                                            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </button>

                                {/* Lesson List — expanded */}
                                {isExpanded && (
                                    <div className="px-5 pb-4 animate-fade-in-up">
                                        <div className="border-t border-gray-100 pt-3 space-y-2">
                                            {teil.lessons.map((lesson, idx) => {
                                                const isDone = lesson.completion !== null
                                                const scoreDisplay = isDone
                                                    ? `${lesson.completion!.bestScore}/${lesson.completion!.totalQuestions}`
                                                    : null
                                                // Find first uncompleted lesson
                                                const firstUncompleted = teil.lessons.findIndex(l => !l.completion)
                                                const isCurrent = idx === firstUncompleted
                                                const isLocked = !isDone && idx > firstUncompleted && firstUncompleted !== -1

                                                return (
                                                    <button
                                                        key={lesson.id}
                                                        onClick={() => {
                                                            if (!isLocked) {
                                                                router.push(`/listening/${lesson.lessonId}`)
                                                            }
                                                        }}
                                                        disabled={isLocked}
                                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left
                                                            ${isDone
                                                                ? 'bg-green-50/50 border border-green-100 hover:shadow-sm'
                                                                : isCurrent
                                                                    ? 'bg-orange-50 border-2 border-[#FF6B35] shadow-sm shadow-orange-100'
                                                                    : isLocked
                                                                        ? 'bg-gray-50 border border-gray-100 opacity-50 cursor-not-allowed'
                                                                        : 'bg-gray-50 border border-gray-100 hover:shadow-sm'
                                                            }`}
                                                    >
                                                        {/* Number badge */}
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0
                                                            ${isDone ? 'bg-green-500 text-white' : isCurrent ? 'bg-[#FF6B35] text-white' : 'bg-gray-200 text-gray-500'}`}
                                                        >
                                                            {isDone ? '✓' : idx + 1}
                                                        </div>
                                                        {/* Lesson info */}
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-sm font-semibold truncate ${isDone ? 'text-green-800' : isLocked ? 'text-gray-400' : 'text-gray-900'}`}>
                                                                {lesson.topic}
                                                            </p>
                                                            <p className={`text-xs mt-0.5 ${isDone ? 'text-green-600' : 'text-gray-400'}`}>
                                                                {lesson.taskType} • {formatDuration(lesson.audioDuration)}
                                                                {lesson.questionCount > 0 && ` • ${lesson.questionCount} Fragen`}
                                                            </p>
                                                        </div>
                                                        {/* Score / status */}
                                                        <div className="shrink-0">
                                                            {isDone ? (
                                                                <span className="text-sm font-bold text-green-600 bg-green-100 px-2.5 py-1 rounded-lg">
                                                                    {scoreDisplay}
                                                                </span>
                                                            ) : isCurrent ? (
                                                                <span className="text-xs font-bold text-[#FF6B35] bg-orange-100 px-2.5 py-1 rounded-lg">
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
