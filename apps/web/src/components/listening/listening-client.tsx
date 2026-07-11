'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import {
    CheckCircle2,
    Headphones,
    Lock,
    Megaphone,
    PhoneCall,
    Play,
    Radio,
    Volume2,
    type LucideIcon,
} from 'lucide-react'
import { MeasuredLink } from '@/components/performance/measured-link'
import { FUXIE_3D_ASSETS, FuxieRoleMascot } from '@/components/gamification/quest-visuals'
import { Mascot } from '@/components/ui/mascot'
import { useLevelSwitcher } from '@/hooks/use-level-switcher'
import { getCefrTheme } from '@/lib/constants/cefr'
import { FUXIE_WORLD_PROPS } from '@/lib/mascot/fuxie-assets'
import { FrostedPanel, PrimaryCta } from '@fuxie/ui/components'

interface LessonCompletion {
    bestScore: number
    totalQuestions: number
    attempts: number
}

interface LessonItem {
    id: string
    lessonId: string
    title: string
    topic: string
    taskType: string
    audioDuration: number | null
    questionCount: number
    completion: LessonCompletion | null
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

interface ListeningApiPayload {
    success: boolean
    data: {
        level: string
        totalLessons: number
        totalCompleted: number
        teile: Array<{
            teil: number
            teilName: string
            lessons: Array<{
                id: string
                lessonId: string
                title: string
                topic: string
                taskType: string
                audioDuration: number | null
                questionCount?: number
                _count?: { questions?: number }
                completion: LessonCompletion | null
            }>
        }>
    }
}

interface ListeningHubData {
    teile: Teil[]
    totalLessons: number
    totalCompleted: number
}

const TEIL_ICONS: Record<number, LucideIcon> = {
    1: Headphones,
    2: Megaphone,
    3: PhoneCall,
    4: Radio,
}

function formatDuration(seconds: number | null): string {
    if (!seconds) return '-'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
}

function formatLessonMeta(
    lesson: LessonItem,
    t: (key: string, values?: Record<string, string | number>) => string,
): string {
    return [
        lesson.taskType,
        lesson.audioDuration ? formatDuration(lesson.audioDuration) : null,
        lesson.questionCount > 0 ? t('questionsCount', { count: lesson.questionCount }) : null,
    ]
        .filter(Boolean)
        .join(' - ')
}

function mapApiTeile(
    teile: ListeningApiPayload['data']['teile'],
): Teil[] {
    return teile.map((teil) => ({
        teil: teil.teil,
        teilName: teil.teilName,
        lessons: teil.lessons.map((lesson) => ({
            id: lesson.id,
            lessonId: lesson.lessonId,
            title: lesson.title,
            topic: lesson.topic,
            taskType: lesson.taskType,
            audioDuration: lesson.audioDuration,
            questionCount: lesson.questionCount ?? lesson._count?.questions ?? 0,
            completion: lesson.completion ?? null,
        })),
    }))
}

function ProgressRing({
    progress,
    size = 40,
    strokeWidth = 3.5,
}: {
    progress: number
    size?: number
    strokeWidth?: number
}) {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (progress / 100) * circumference
    return (
        <svg
            width={size}
            height={size}
            className="transform -rotate-90 motion-reduce:transition-none"
            aria-hidden="true"
            focusable="false"
        >
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#E5E7EB"
                strokeWidth={strokeWidth}
                fill="none"
            />
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
                className="transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
            />
        </svg>
    )
}

export function ListeningClient({
    teile,
    totalLessons,
    totalCompleted,
    availableLevels,
    initialLevel,
}: ListeningClientProps) {
    const t = useTranslations('Gamification')
    const tUI = useTranslations('UI')
    const tListening = useTranslations('Listening')
    const router = useRouter()
    const [currentTeile, setCurrentTeile] = useState(teile)
    const [currentTotal, setCurrentTotal] = useState(totalLessons)
    const [currentCompleted, setCurrentCompleted] = useState(totalCompleted)
    const [expandedTeil, setExpandedTeil] = useState<number | null>(teile[0]?.teil ?? null)

    const handleLevelSuccess = useCallback((data: ListeningHubData) => {
        setCurrentTeile(data.teile)
        setCurrentTotal(data.totalLessons)
        setCurrentCompleted(data.totalCompleted)
        setExpandedTeil(data.teile[0]?.teil ?? null)
    }, [])

    const transformData = useCallback((raw: unknown): ListeningHubData => {
        const payload = raw as ListeningApiPayload
        return {
            teile: mapApiTeile(payload.data.teile),
            totalLessons: payload.data.totalLessons,
            totalCompleted: payload.data.totalCompleted,
        }
    }, [])

    const {
        currentLevel,
        isLevelLoading,
        switchLevel,
        failedLevel,
        error,
        clearError,
    } = useLevelSwitcher<ListeningHubData>({
        initialLevel,
        apiEndpoint: '/api/v1/listening?level={level}',
        transformData,
        onSuccess: handleLevelSuccess,
    })

    const cefrColors = getCefrTheme(currentLevel)
    const overallProgress =
        currentTotal > 0 ? Math.round((currentCompleted / currentTotal) * 100) : 0

    const toggleTeil = (teil: number) => {
        setExpandedTeil(expandedTeil === teil ? null : teil)
    }

    const nextLesson = currentTeile.flatMap((teil) => teil.lessons).find((lesson) => !lesson.completion)
    const nextLessonHref = nextLesson ? `/listening/${nextLesson.lessonId}` : null
    const prefetchHrefs = useMemo(() => {
        const hrefs = new Set<string>()
        for (const teil of currentTeile) {
            const firstUncompleted = teil.lessons.findIndex((lesson) => !lesson.completion)
            teil.lessons.forEach((lesson, idx) => {
                const isDone = lesson.completion !== null
                const isLocked = !isDone && idx > firstUncompleted && firstUncompleted !== -1
                if (!isLocked && (isDone || idx === firstUncompleted || firstUncompleted === -1)) {
                    hrefs.add(`/listening/${lesson.lessonId}`)
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

    const handleRetry = () => {
        if (failedLevel) {
            void switchLevel(failedLevel)
        } else {
            clearError()
        }
    }

    return (
        <div className="max-w-5xl mx-auto">
            <FrostedPanel className="mb-6 overflow-hidden !p-0">
                <div className="h-1" style={{ background: cefrColors.cssGradient }} />

                <div className="p-6">
                    {availableLevels.length > 0 && (
                        <div
                            className="flex gap-2 mb-5 flex-wrap"
                            role="group"
                            aria-label={tListening('skillName')}
                        >
                            {availableLevels.map((level) => {
                                const colors = getCefrTheme(level)
                                const isActive = level === currentLevel
                                return (
                                    <button
                                        key={level}
                                        type="button"
                                        onClick={() => switchLevel(level)}
                                        disabled={isLevelLoading}
                                        aria-pressed={isActive}
                                        className={`min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl text-sm font-bold transition-[transform,background-color,box-shadow,opacity] active:translate-y-[2px] motion-reduce:transition-none motion-reduce:active:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fuxie-blue-700)] ${
                                            isActive
                                                ? 'text-white shadow-md'
                                                : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 shadow-[0_4px_0_0_#e5e5e5] active:shadow-[0_2px_0_0_#e5e5e5]'
                                        } ${isLevelLoading ? 'opacity-50 cursor-wait' : ''}`}
                                        style={
                                            isActive
                                                ? {
                                                      backgroundColor: 'var(--fuxie-action)',
                                                      boxShadow:
                                                          '0 4px 0px var(--fuxie-lip-action), 0 4px 12px rgba(0, 0, 0, 0.1)',
                                                  }
                                                : undefined
                                        }
                                    >
                                        {level}
                                    </button>
                                )
                            })}
                        </div>
                    )}

                    {(error || failedLevel) && (
                        <div
                            role="alert"
                            className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                        >
                            <p>
                                {tListening('levelLoadError', {
                                    level: failedLevel ?? currentLevel,
                                })}
                            </p>
                            {failedLevel && (
                                <button
                                    type="button"
                                    onClick={handleRetry}
                                    disabled={isLevelLoading}
                                    className="min-h-[44px] shrink-0 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fuxie-blue-700)] disabled:opacity-50"
                                >
                                    {tListening('retryLevel', { level: failedLevel })}
                                </button>
                            )}
                        </div>
                    )}

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <FuxieRoleMascot
                            src={FUXIE_3D_ASSETS.radioHost}
                            alt={tUI('altListeningCoach')}
                            size={64}
                            motion="coach"
                        />
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-gray-900">
                                {t('practiceSkill', {
                                    skill: tListening('skillName'),
                                    level: currentLevel,
                                })}
                            </h1>
                            <p className="text-sm text-gray-500 mt-0.5">
                                {tListening('hubProgress', {
                                    completed: currentCompleted,
                                    total: currentTotal,
                                })}
                            </p>
                        </div>
                        <Image
                            src={FUXIE_WORLD_PROPS.radioBoothConsole}
                            alt=""
                            width={96}
                            height={96}
                            className="ml-auto hidden h-20 w-20 shrink-0 object-contain drop-shadow-sm md:block"
                        />
                        {nextLessonHref && (
                            <PrimaryCta asChild className="shrink-0">
                                <MeasuredLink
                                    href={nextLessonHref}
                                    flow="listening.list.next"
                                    source={nextLesson?.lessonId}
                                    className="flex items-center justify-center gap-2 whitespace-nowrap !h-[48px]"
                                >
                                    <Volume2 className="h-4 w-4" />
                                    {t('continueLearningAction')}
                                </MeasuredLink>
                            </PrimaryCta>
                        )}
                    </div>
                    <div className="mt-4">
                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none"
                                style={{
                                    width: `${overallProgress}%`,
                                    background: cefrColors.cssGradient,
                                }}
                                data-progress={overallProgress}
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-1.5 text-right">
                            {t('percentCompleted', { percent: overallProgress })}
                        </p>
                    </div>
                </div>
            </FrostedPanel>

            {isLevelLoading ? (
                <div
                    className="flex flex-col items-center justify-center py-16 gap-3"
                    aria-busy="true"
                    aria-live="polite"
                >
                    <Mascot variant="loading" size={64} />
                    <p className="text-sm text-gray-500">{tListening('levelLoading')}</p>
                </div>
            ) : currentTeile.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center">
                    <Mascot variant="thinking" size={80} />
                    <h2 className="text-lg font-bold text-gray-700 mt-4">{t('listeningEmpty')}</h2>
                    <p className="text-sm text-gray-500 mt-2">{t('listeningEmptyDesc')}</p>
                    <PrimaryCta asChild className="mt-5">
                        <MeasuredLink
                            href="/course"
                            flow="listening.empty.course"
                            source={currentLevel}
                            data-role="listening-empty-cta"
                            className="inline-flex min-h-[44px] items-center justify-center"
                        >
                            {t('backToCourse')}
                        </MeasuredLink>
                    </PrimaryCta>
                </div>
            ) : (
                <div className="space-y-4">
                    {currentTeile.map((teil) => {
                        const completedInTeil = teil.lessons.filter((l) => l.completion !== null).length
                        const teilProgress =
                            teil.lessons.length > 0
                                ? Math.round((completedInTeil / teil.lessons.length) * 100)
                                : 0
                        const isExpanded = expandedTeil === teil.teil
                        const TeilIcon = TEIL_ICONS[teil.teil] ?? Headphones
                        const accordionId = `listening-teil-${teil.teil}-trigger`
                        const panelId = `listening-teil-${teil.teil}-panel`

                        return (
                            <FrostedPanel key={teil.teil} className="!p-0 overflow-hidden mb-4">
                                <button
                                    id={accordionId}
                                    type="button"
                                    onClick={() => toggleTeil(teil.teil)}
                                    aria-expanded={isExpanded}
                                    aria-controls={panelId}
                                    className="w-full flex items-center gap-4 p-5 hover:bg-gray-50/50 transition-[background-color] text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fuxie-blue-700)]"
                                >
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                                        style={{ backgroundColor: `${cefrColors.bg}` }}
                                    >
                                        <TeilIcon className="h-5 w-5" style={{ color: cefrColors.text }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base font-bold text-gray-900">
                                            {t('part', { part: teil.teil })} - {teil.teilName}
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-0.5">
                                            {t('lessonsCompletedListening', {
                                                total: teil.lessons.length,
                                                completed: completedInTeil,
                                            })}
                                        </p>
                                    </div>
                                    <div className="relative flex items-center gap-3">
                                        <ProgressRing progress={teilProgress} size={44} strokeWidth={4} />
                                        <span
                                            className="text-sm font-bold text-gray-700 absolute inset-0 flex items-center justify-center"
                                            style={{ width: 44 }}
                                        >
                                            {teilProgress}%
                                        </span>
                                        <svg
                                            className={`w-5 h-5 text-gray-400 transition-transform duration-200 motion-reduce:transition-none ${isExpanded ? 'rotate-180' : ''}`}
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                            aria-hidden="true"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M19 9l-7 7-7-7"
                                            />
                                        </svg>
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div
                                        id={panelId}
                                        role="region"
                                        aria-labelledby={accordionId}
                                        className="px-5 pb-4 animate-fade-in-up motion-reduce:animate-none"
                                        data-role="listening-teil-panel"
                                    >
                                        <div className="border-t border-gray-100 pt-3 space-y-2">
                                            {teil.lessons
                                                .filter((lesson, idx) => {
                                                    const firstUncompleted = teil.lessons.findIndex(
                                                        (l) => !l.completion,
                                                    )
                                                    return (
                                                        lesson.completion ||
                                                        firstUncompleted === -1 ||
                                                        idx <= firstUncompleted + 2
                                                    )
                                                })
                                                .map((lesson) => {
                                                    const originalIndex = teil.lessons.findIndex(
                                                        (l) => l.id === lesson.id,
                                                    )
                                                    const isDone = lesson.completion !== null
                                                    const scoreDisplay = isDone
                                                        ? `${lesson.completion!.bestScore}/${lesson.completion!.totalQuestions}`
                                                        : null
                                                    const firstUncompleted = teil.lessons.findIndex(
                                                        (l) => !l.completion,
                                                    )
                                                    const isCurrent = originalIndex === firstUncompleted
                                                    const isLocked =
                                                        !isDone &&
                                                        originalIndex > firstUncompleted &&
                                                        firstUncompleted !== -1

                                                    return (
                                                        <MeasuredLink
                                                            key={lesson.id}
                                                            href={
                                                                isLocked
                                                                    ? '#'
                                                                    : `/listening/${lesson.lessonId}`
                                                            }
                                                            flow="listening.list.lesson"
                                                            source={lesson.lessonId}
                                                            prefetch={!isLocked}
                                                            aria-disabled={isLocked}
                                                            tabIndex={isLocked ? -1 : undefined}
                                                            data-lesson-state={
                                                                isDone
                                                                    ? 'done'
                                                                    : isCurrent
                                                                      ? 'current'
                                                                      : isLocked
                                                                        ? 'locked'
                                                                        : 'open'
                                                            }
                                                            onClick={(event) => {
                                                                if (isLocked) event.preventDefault()
                                                            }}
                                                            className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-[transform,box-shadow,background-color] text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fuxie-blue-700)] motion-reduce:transition-none motion-reduce:hover:translate-x-0
                                                                ${
                                                                    isDone
                                                                        ? 'bg-green-50/50 border border-green-100 hover:shadow-sm hover:translate-x-0.5 motion-reduce:hover:translate-x-0'
                                                                        : isCurrent
                                                                          ? 'border-2 shadow-sm'
                                                                          : isLocked
                                                                            ? 'bg-gray-55 border border-gray-100 opacity-70 cursor-not-allowed text-gray-300'
                                                                            : 'bg-gray-50 border border-gray-100 hover:shadow-sm'
                                                                }`}
                                                            style={
                                                                isCurrent
                                                                    ? {
                                                                          borderColor: cefrColors.text,
                                                                          backgroundColor: `${cefrColors.bg}33`,
                                                                          boxShadow: `0 2px 8px ${cefrColors.shadow}`,
                                                                      }
                                                                    : undefined
                                                            }
                                                        >
                                                            <div
                                                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0
                                                                ${isDone ? 'bg-green-500 text-white' : isCurrent ? 'text-white' : 'bg-gray-200 text-gray-500'}`}
                                                                style={
                                                                    isCurrent
                                                                        ? { background: cefrColors.cssGradient }
                                                                        : undefined
                                                                }
                                                            >
                                                                {isDone ? (
                                                                    <CheckCircle2 className="h-4 w-4" />
                                                                ) : (
                                                                    originalIndex + 1
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p
                                                                    className={`text-sm font-semibold truncate ${isDone ? 'text-green-800' : isLocked ? 'text-gray-400' : 'text-gray-900'}`}
                                                                >
                                                                    {lesson.topic}
                                                                </p>
                                                                <p
                                                                    className={`text-xs mt-0.5 ${isDone ? 'text-green-600' : 'text-gray-400'}`}
                                                                >
                                                                    {formatLessonMeta(lesson, t)}
                                                                </p>
                                                            </div>
                                                            <div className="shrink-0">
                                                                {isDone ? (
                                                                    <span className="text-sm font-bold text-green-600 bg-green-100 px-2.5 py-1 rounded-lg">
                                                                        {scoreDisplay}
                                                                    </span>
                                                                ) : isCurrent ? (
                                                                    <span
                                                                        className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg"
                                                                        style={{
                                                                            color: cefrColors.text,
                                                                            backgroundColor: cefrColors.bg,
                                                                        }}
                                                                    >
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
                                                const firstUncompleted = teil.lessons.findIndex(
                                                    (l) => !l.completion,
                                                )
                                                if (firstUncompleted === -1) return null
                                                const hiddenCount = teil.lessons.filter(
                                                    (lesson, idx) =>
                                                        !lesson.completion &&
                                                        idx > firstUncompleted + 2,
                                                ).length
                                                if (hiddenCount === 0) return null
                                                return (
                                                    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                                                        {t('unlockNext', { count: hiddenCount })}
                                                    </div>
                                                )
                                            })()}
                                        </div>
                                    </div>
                                )}
                            </FrostedPanel>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
