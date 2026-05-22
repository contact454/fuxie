'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import {
    BookOpen,
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    Lock,
    Mail,
    Newspaper,
    Play,
    Signpost,
    type LucideIcon,
} from 'lucide-react'
import { MeasuredLink } from '@/components/performance/measured-link'
import { FUXIE_3D_ASSETS, FuxieRoleMascot } from '@/components/gamification/quest-visuals'
import { Mascot } from '@/components/ui/mascot'
import { FuxieBadge, FuxiePanel, FuxieProgressBar, fuxieButtonClass } from '@/components/ui/fuxie-ui'
import { useLevelSwitcher } from '@/hooks/use-level-switcher'
import { getCefrTheme } from '@/lib/constants/cefr'
import { FUXIE_WORLD_PROPS } from '@/lib/mascot/fuxie-assets'

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

const TEIL_ICONS: Record<number, LucideIcon> = {
    1: Mail,
    2: ClipboardList,
    3: Signpost,
    4: CalendarDays,
    5: Newspaper,
}

function ProgressRing({ progress, size = 40, strokeWidth = 3.5 }: { progress: number; size?: number; strokeWidth?: number }) {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (progress / 100) * circumference
    return (
        <svg width={size} height={size} className="transform -rotate-90">
            <circle cx={size / 2} cy={size / 2} r={radius} stroke="#E5E7EB" strokeWidth={strokeWidth} fill="none" />
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={progress >= 100 ? '#10B981' : '#60A8E4'}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
            />
        </svg>
    )
}

function getReadingWordCount(meta: any): number | null {
    if (typeof meta?.word_count === 'number') return meta.word_count

    const segmentCounts = [
        meta?.word_count_text_a,
        meta?.word_count_text_b,
        meta?.word_count_text_c,
        meta?.word_count_text_d,
    ].filter((count): count is number => typeof count === 'number')

    return segmentCounts.length > 0
        ? segmentCounts.reduce((sum, count) => sum + count, 0)
        : null
}

export function ReadingClient({ teile, totalExercises, totalCompleted, availableLevels, initialLevel }: ReadingClientProps) {
    const t = useTranslations('Gamification')
    const router = useRouter()
    const [currentTeile, setCurrentTeile] = useState(teile)
    const [currentTotal, setCurrentTotal] = useState(totalExercises)
    const [currentCompleted, setCurrentCompleted] = useState(totalCompleted)
    const [expandedTeil, setExpandedTeil] = useState<number | null>(teile[0]?.teil ?? null)

    const { currentLevel, isLevelLoading, switchLevel } = useLevelSwitcher({
        initialLevel,
        apiEndpoint: '/api/v1/reading?level={level}',
        transformData: (data: any) => data,
        onSuccess: useCallback((data: any) => {
            setCurrentTeile(data.data.teile.map((t: any) => ({
                teil: t.teil,
                teilName: t.teilName,
                exercises: t.exercises.map((ex: any) => ({
                    id: ex.id,
                    exerciseId: ex.exerciseId,
                    topic: ex.topic,
                    questionCount: ex._count?.questions ?? 0,
                    wordCount: getReadingWordCount(ex.metadataJson),
                    completion: null,
                })),
            })))
            setCurrentTotal(data.data.totalExercises)
            setCurrentCompleted(0)
            setExpandedTeil(data.data.teile[0]?.teil ?? null)
        }, []),
    })

    const cefrColors = getCefrTheme(currentLevel)
    const overallProgress = currentTotal > 0 ? Math.round((currentCompleted / currentTotal) * 100) : 0

    const toggleTeil = (teil: number) => {
        setExpandedTeil(expandedTeil === teil ? null : teil)
    }

    const nextExercise = currentTeile.flatMap(teil => teil.exercises).find(ex => !ex.completion)
    const nextExerciseHref = nextExercise ? `/reading/${nextExercise.exerciseId}` : null
    const prefetchHrefs = useMemo(() => {
        const hrefs = new Set<string>()
        for (const teil of currentTeile) {
            const firstUncompleted = teil.exercises.findIndex(e => !e.completion)
            teil.exercises.forEach((ex, idx) => {
                const isDone = ex.completion !== null
                const isLocked = !isDone && idx > firstUncompleted && firstUncompleted !== -1
                if (!isLocked && (isDone || idx === firstUncompleted || firstUncompleted === -1)) {
                    hrefs.add(`/reading/${ex.exerciseId}`)
                }
            })
        }
        return Array.from(hrefs).slice(0, 6)
    }, [currentTeile])

    useEffect(() => {
        for (const href of prefetchHrefs) {
            router.prefetch(href)
        }
    }, [prefetchHrefs, router])

    return (
        <div className="max-w-5xl mx-auto">
            <FuxiePanel variant="hero" className="mb-6 overflow-hidden">
                <div className="h-1" style={{ background: cefrColors.cssGradient }} />

                <div className="p-6">
                    {availableLevels.length > 0 && (
                        <div className="flex gap-2 mb-5 flex-wrap">
                            {availableLevels.map(level => {
                                const colors = getCefrTheme(level)
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
                                        style={isActive ? { background: colors.cssGradient, boxShadow: `0 4px 12px ${colors.shadow}` } : undefined}
                                    >
                                        {level}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <FuxieRoleMascot src={FUXIE_3D_ASSETS.librarian} alt="Fuxie reading coach" size={64} motion="coach" />
                        <div className="flex-1">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                                <FuxieBadge tone="brand">Reading quest</FuxieBadge>
                                <FuxieBadge tone={overallProgress >= 100 ? 'success' : 'neutral'}>{overallProgress}%</FuxieBadge>
                            </div>
                            <h1 className="text-2xl font-black text-text-primary">{t('practiceSkill', { skill: 'đọc', level: currentLevel })}</h1>
                            <p className="text-sm font-semibold text-text-brand mt-0.5">
                                <span className="font-black">{currentCompleted}</span> / {currentTotal} bài đã xong
                            </p>
                        </div>
                        <Image
                            src={FUXIE_WORLD_PROPS.readingLibraryDesk}
                            alt=""
                            width={96}
                            height={96}
                            className="ml-auto hidden h-20 w-20 shrink-0 object-contain drop-shadow-sm md:block"
                        />
                        {nextExerciseHref && (
                            <MeasuredLink
                                href={nextExerciseHref}
                                flow="reading.list.next"
                                source={nextExercise?.exerciseId}
                                className={fuxieButtonClass('primary', 'lg', 'whitespace-nowrap')}
                            >
                                <BookOpen className="h-4 w-4" />
                                {t('continueLearningAction')}
                            </MeasuredLink>
                        )}
                    </div>
                    <div className="mt-4">
                        <FuxieProgressBar value={overallProgress} tone={overallProgress >= 100 ? 'success' : 'brand'} />
                        <p className="text-xs font-semibold text-text-brand/70 mt-1.5 text-right">{t('percentCompleted', { percent: overallProgress })}</p>
                    </div>
                </div>
            </FuxiePanel>

            {isLevelLoading ? (
                <div className="flex items-center justify-center py-16">
                    <Mascot variant="loading" size={64} />
                </div>
            ) : currentTeile.length === 0 ? (
                <FuxiePanel className="p-12 text-center">
                    <Mascot variant="thinking" size={80} />
                    <h2 className="text-lg font-black text-text-primary mt-4">{t('readingEmpty')}</h2>
                    <p className="text-sm font-medium text-slate-500 mt-2">
                        {t('readingEmptyDesc')}
                    </p>
                    <MeasuredLink
                        href="/course"
                        flow="reading.empty.course"
                        source={currentLevel}
                        className={fuxieButtonClass('primary', 'md', 'mt-5')}
                    >
                        {t('backToCourse')}
                    </MeasuredLink>
                </FuxiePanel>
            ) : (
                <div className="space-y-4">
                    {currentTeile.map((teil) => {
                        const completedInTeil = teil.exercises.filter(e => e.completion !== null).length
                        const teilProgress = teil.exercises.length > 0
                            ? Math.round((completedInTeil / teil.exercises.length) * 100)
                            : 0
                        const isExpanded = expandedTeil === teil.teil
                        const TeilIcon = TEIL_ICONS[teil.teil] ?? BookOpen

                        return (
                            <FuxiePanel key={teil.teil} variant="interactive" className="overflow-hidden">
                                <button
                                    onClick={() => toggleTeil(teil.teil)}
                                    className="w-full flex items-center gap-4 p-5 hover:bg-[#F3FBFF]/70 transition-colors text-left"
                                >
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                                        style={{ backgroundColor: `${cefrColors.bg}` }}
                                    >
                                        <TeilIcon className="h-5 w-5" style={{ color: cefrColors.text }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base font-bold text-gray-900">
                                            {t('part', { part: teil.teil })} - {teil.teilName}
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-0.5">
                                            {t('lessonsCompleted', { total: teil.exercises.length, completed: completedInTeil })}
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

                                {isExpanded && (
                                    <div className="px-5 pb-4 animate-fade-in-up">
                                        <div className="border-t border-gray-100 pt-3 space-y-2">
                                            {teil.exercises
                                                .filter((ex, idx) => {
                                                    const firstUncompleted = teil.exercises.findIndex(e => !e.completion)
                                                    return ex.completion || firstUncompleted === -1 || idx <= firstUncompleted + 2
                                                })
                                                .map((ex) => {
                                                    const originalIndex = teil.exercises.findIndex(e => e.id === ex.id)
                                                    const isDone = ex.completion !== null
                                                    const scoreDisplay = isDone
                                                        ? `${ex.completion!.bestScore}/${ex.completion!.totalQuestions}`
                                                        : null
                                                    const firstUncompleted = teil.exercises.findIndex(e => !e.completion)
                                                    const isCurrent = originalIndex === firstUncompleted
                                                    const isLocked = !isDone && originalIndex > firstUncompleted && firstUncompleted !== -1

                                                    return (
                                                        <MeasuredLink
                                                            key={ex.id}
                                                            href={isLocked ? '#' : `/reading/${ex.exerciseId}`}
                                                            flow="reading.list.exercise"
                                                            source={ex.exerciseId}
                                                            prefetch={!isLocked}
                                                            aria-disabled={isLocked}
                                                            tabIndex={isLocked ? -1 : undefined}
                                                            onClick={(event) => {
                                                                if (isLocked) event.preventDefault()
                                                            }}
                                                            className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all text-left
                                                                ${isDone
                                                                    ? 'bg-green-50/50 border border-green-100 hover:shadow-sm hover:translate-x-0.5'
                                                                    : isCurrent
                                                                        ? 'border-2 shadow-sm'
                                                                        : isLocked
                                                                            ? 'bg-gray-50 border border-gray-100 opacity-70 cursor-not-allowed'
                                                                            : 'bg-gray-50 border border-gray-100 hover:shadow-sm'
                                                                }`}
                                                            style={isCurrent ? { borderColor: cefrColors.text, backgroundColor: `${cefrColors.bg}33`, boxShadow: `0 2px 8px ${cefrColors.shadow}` } : undefined}
                                                        >
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 transition-all
                                                                ${isDone ? 'bg-green-500 text-white' : isCurrent ? 'text-white' : 'bg-gray-200 text-gray-500'}`}
                                                                style={isCurrent ? { background: cefrColors.cssGradient } : undefined}
                                                            >
                                                                {isDone ? <CheckCircle2 className="h-4 w-4" /> : originalIndex + 1}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className={`text-sm font-semibold truncate ${isDone ? 'text-green-800' : isLocked ? 'text-gray-400' : 'text-gray-900'}`}>
                                                                    {ex.topic}
                                                                </p>
                                                                <p className={`text-xs mt-0.5 ${isDone ? 'text-green-600' : 'text-gray-400'}`}>
                                                                    {t('questionsCount', { count: ex.questionCount })}
                                                                    {ex.wordCount && ` - ${t('wordCountApprox', { count: ex.wordCount })}`}
                                                                </p>
                                                            </div>
                                                            <div className="shrink-0">
                                                                {isDone ? (
                                                                    <span className="text-sm font-bold text-green-600 bg-green-100 px-2.5 py-1 rounded-lg">
                                                                        {scoreDisplay}
                                                                    </span>
                                                                ) : isCurrent ? (
                                                                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg"
                                                                        style={{ color: cefrColors.text, backgroundColor: cefrColors.bg }}>
                                                                        <Play className="h-3 w-3" />
                                                                        {t('startAction')}
                                                                    </span>
                                                                ) : isLocked ? (
                                                                    <Lock className="h-4 w-4 text-gray-300" />
                                                                ) : null}
                                                            </div>
                                                        </MeasuredLink>
                                                    )
                                                })}
                                            {(() => {
                                                const firstUncompleted = teil.exercises.findIndex(e => !e.completion)
                                                if (firstUncompleted === -1) return null
                                                const hiddenCount = teil.exercises.filter((ex, idx) => !ex.completion && idx > firstUncompleted + 2).length
                                                if (hiddenCount === 0) return null
                                                return (
                                                    <FuxiePanel variant="soft" className="border-dashed px-4 py-3 text-sm font-semibold text-text-brand">
                                                        {t('unlockNext', { count: hiddenCount })}
                                                    </FuxiePanel>
                                                )
                                            })()}
                                        </div>
                                    </div>
                                )}
                            </FuxiePanel>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
