'use client'

import Image from 'next/image'
import {
    ArrowRight,
    BookOpen,
    Brain,
    CalendarClock,
    CheckCircle2,
    Coins,
    Gift,
    Headphones,
    Loader2,
    LockKeyhole,
    RotateCcw,
    ShieldCheck,
    Sparkles,
    Target,
    Timer,
} from 'lucide-react'
import { useState, useTransition, type ComponentType } from 'react'
import { useTranslations } from 'next-intl'
import { MeasuredLink } from '@/components/performance/measured-link'
import { FUXIE_3D_ASSETS, FuxieCoach, FuxieRoleMascot, RewardPreview, RewardRevealMoment, type RewardPreviewItem } from '@/components/gamification/quest-visuals'
import { REWARD_ASSETS, getCefrBadgeAssetSrc, getShopItemAssetSrc } from '@/components/gamification/reward-assets'
import { FuxieBadge, FuxieProgressBar, FuxieQuestCard, fuxieButtonClass } from '@/components/ui/fuxie-ui'
import { CEFR_LEVELS, getCefrTheme } from '@/lib/constants/cefr'
import { StatCard, MiniStat } from './stat-card'
import { QuickAction } from './quick-action'
import type { TodayPlan } from '@/lib/personalization/today-plan'
import { buildDashboardMissionHub, type DashboardQuest } from '@/lib/dashboard/quest-adapter'
import type { MissionBoardData, MissionBoardItem, MissionBoardPeriod } from '@/lib/gamification/mission-types'

// ===== TYPES =====

export interface DashboardData {
    greeting: string
    profile: {
        displayName: string
        currentLevel: string
        targetLevel: string
        targetExam: string | null
        targetExamDate: string | null
        examDaysLeft: number | null
        totalXp: number
        totalWordsLearned: number
        totalLessonsCompleted: number
        totalStudyMinutes: number
        studyGoalMinutes: number
        fuxieLevel: number
        fuxieTitle: string
    }
    streak: {
        currentStreak: number
        longestStreak: number
        lastActivityDate: string | null
        freezesAvailable: number
        freezesUsed: number
    }
    srs: {
        dueCount: number
        totalCards: number
        reviewedToday: number
    }
    todayActivity: {
        totalMinutes: number
        xpEarned: number
        lessonsCompleted: number
        exercisesCompleted: number
        srsReviewed: number
        wordsLearned: number
    }
    weeklyActivity: Array<{
        day: string
        date: string
        xp: number
        minutes: number
    }>
    skills: Array<{
        key: string
        label: string
        score: number
        level: string
    }>
    achievements: Array<{
        id: string
        title: string
        titleDe: string | null
        iconUrl: string | null
        category: string
        earnedAt: string
    }>
    listening: {
        totalLessons: number
        completedLessons: number
        totalAttempts: number
        bestScore: number | null
    }
    grammar: {
        totalTopics: number
        totalLessons: number
        completedLessons: number
        totalStars: number
        maxStars: number
    }
    todayPlan?: TodayPlan | null
    missionBoard?: MissionBoardData | null
    streakFreezeTimeline?: Array<{
        id: string
        usedAt: string
        protectedStreak: number
        freezesRemaining: number
        missedDays: number
        sourceType: string
        sourceId: string
    }>
}

// ===== CONSTANTS =====



const SKILL_COLORS: Record<string, string> = {
    HOEREN: 'var(--color-skill-hoeren)',
    LESEN: 'var(--color-skill-lesen)',
    SCHREIBEN: 'var(--color-skill-schreiben)',
    SPRECHEN: 'var(--color-skill-sprechen)',
    GRAMMATIK: 'var(--color-skill-grammatik)',
    WORTSCHATZ: 'var(--color-skill-wortschatz)',
}

const SKILL_ICONS: Record<string, string> = {
    HOEREN: '🎧',
    LESEN: '📖',
    SCHREIBEN: '✍️',
    SPRECHEN: '🗣️',
    GRAMMATIK: '📝',
    WORTSCHATZ: '📚',
}

const ACHIEVEMENT_ICONS: Record<string, string> = {
    streak: '🔥',
    vocabulary: '📚',
    grammar: '📝',
    exam: '🎯',
    xp: '⭐',
    lesson: '🏆',
    default: '🥇',
}

// ===== MAIN COMPONENT =====

export function DashboardClient({ data, section }: { data: DashboardData; section?: 'header' | 'stats' | 'content' }) {
    const currentIdx = CEFR_LEVELS.indexOf(data.profile.currentLevel as typeof CEFR_LEVELS[number])
    const targetIdx = CEFR_LEVELS.indexOf(data.profile.targetLevel as typeof CEFR_LEVELS[number])
    const cefrProgress = targetIdx > 0 ? Math.round((currentIdx / targetIdx) * 100) : 0

    const studyGoalPercent = data.profile?.studyGoalMinutes > 0
        ? Math.min(100, Math.round(((data.todayActivity?.totalMinutes ?? 0) / data.profile.studyGoalMinutes) * 100))
        : 0

    const maxWeeklyXp = Math.max(...(data.weeklyActivity ?? []).map((d) => d.xp), 1)

    // If no section specified, render everything (backward compat)
    if (!section) {
        return (
            <div className="min-h-[100dvh] p-4 sm:p-6 lg:p-8">
                <HeaderSection data={data} />
                <ContentSection data={data} cefrProgress={cefrProgress} maxWeeklyXp={maxWeeklyXp} currentIdx={currentIdx} />
                <StatsSection data={data} studyGoalPercent={studyGoalPercent} />
            </div>
        )
    }

    if (section === 'header') {
        return (
            <div className="p-4 sm:p-6 lg:p-8 pb-0">
                <HeaderSection data={data} />
            </div>
        )
    }

    if (section === 'stats') {
        return (
            <div className="px-4 sm:px-6 lg:px-8">
                <StatsSection data={data} studyGoalPercent={studyGoalPercent} />
            </div>
        )
    }

    // section === 'content'
    return (
        <div className="px-4 sm:px-6 lg:px-8 pb-8">
            <ContentSection data={data} cefrProgress={cefrProgress} maxWeeklyXp={maxWeeklyXp} currentIdx={currentIdx} />
        </div>
    )
}

function HeaderSection({ data }: { data: DashboardData }) {
    const t = useTranslations('Dashboard')
    const cefrBadgeSrc = getCefrBadgeAssetSrc(data.profile.currentLevel)
    const cefrTheme = getCefrTheme(data.profile.currentLevel)

    return (
        <header className="mb-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                        {data.greeting}, {data.profile.displayName}!
                        <Image src={FUXIE_3D_ASSETS.happyWave} alt="Fuxie" width={36} height={36} priority className="inline-block object-contain" />
                    </h1>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                        <span
                            className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold shadow-sm"
                            style={{
                                backgroundColor: cefrTheme.bg,
                                borderColor: cefrTheme.border,
                                color: cefrTheme.text,
                            }}
                        >
                            <Image
                                src={cefrBadgeSrc}
                                alt=""
                                width={22}
                                height={22}
                                className="h-5 w-5 object-contain"
                            />
                            {data.profile.currentLevel}
                        </span>
                        <span>·</span> {/* locale-allow */}
                        <span className="font-medium text-gray-700">
                            Lv.{data.profile.fuxieLevel} {data.profile.fuxieTitle}
                        </span>
                        <span>·</span> {/* locale-allow */}
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#EAFBF8] px-2.5 py-0.5 text-xs font-black text-[#148F7D] ring-1 ring-[#2EC4B6]/25">
                            <ShieldCheck className="h-3 w-3" />
                            {data.streak?.freezesAvailable ?? 0} Freeze
                        </span>
                        {data.profile.targetExam && (
                            <>
                                <span>·</span>
                                <span>{t('targetExam', { exam: data.profile.targetExam, level: data.profile.targetLevel })}</span>
                            </>
                        )}
                    </div>
                </div>
                {data.profile.examDaysLeft !== null && (
                    <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-fuxie-primary/10 to-fuxie-secondary/10 px-4 py-2.5 text-sm">
                        <span className="text-lg">🎯</span>
                        <div>
                            <p className="font-semibold text-gray-900">
                                {data.profile.examDaysLeft} ngày
                            </p>
                            <p className="text-xs text-gray-500">{t('daysToExam')}</p>
                        </div>
                    </div>
                )}
            </div>
        </header>
    )
}

function StatsSection({ data, studyGoalPercent }: { data: DashboardData; studyGoalPercent: number }) {
    return (
        <div className="mb-6 grid gap-3 grid-cols-2 lg:grid-cols-4">
            <StatCard
                label="Chuỗi ngày"
                value={data.streak?.currentStreak ?? 0}
                icon="🔥"
                suffix="ngày"
                detail={`Kỷ lục: ${data.streak?.longestStreak ?? 0}`}
                gradient="from-sky-500/10 to-cyan-500/5"
                color="#60A8E4"
                pulse={(data.streak?.currentStreak ?? 0) > 0}
                index={0}
            />
            <StatCard
                label="XP hôm nay"
                value={data.todayActivity?.xpEarned ?? 0}
                icon="⭐"
                detail={`Tổng: ${data.profile.totalXp.toLocaleString()}`}
                gradient="from-blue-500/10 to-indigo-500/5"
                color="#3C78A8"
                index={1}
            />
            <StatCard
                label="SRS cần ôn"
                value={data.srs?.dueCount ?? 0}
                icon="📚"
                detail={`${data.srs?.totalCards ?? 0} thẻ · ${data.srs?.reviewedToday ?? 0} hôm nay`}
                gradient="from-teal-500/10 to-emerald-500/5"
                color="#2EC4B6"
                urgent={(data.srs?.dueCount ?? 0) > 20}
                index={2}
            />
            <StatCard
                label="Thời gian học"
                value={data.todayActivity?.totalMinutes ?? 0}
                icon="⏱️"
                suffix="min"
                detail={`Mục tiêu: ${data.profile.studyGoalMinutes} phút (${studyGoalPercent}%)`}
                gradient="from-purple-500/10 to-pink-500/5"
                color="#9C27B0"
                index={3}
                goalPercent={studyGoalPercent}
            />
        </div>
    )
}

function ContentSection({ data, cefrProgress, maxWeeklyXp, currentIdx }: { data: DashboardData; cefrProgress: number; maxWeeklyXp: number; currentIdx: number }) {
    const t = useTranslations('Dashboard')
    return (
        <>
            {data.todayPlan && <TodayPlanSection plan={data.todayPlan} data={data} />}
            {data.missionBoard && <MissionControlSection initialMissionBoard={data.missionBoard} />}
            <StreakFreezeAwarenessSection data={data} />

            {/* ===== CEFR PROGRESS + WEEKLY CHART ===== */}
            <div className="mb-6 grid gap-4 lg:grid-cols-5">
                {/* CEFR Roadmap */}
                <div className="lg:col-span-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 animate-fade-in-up stagger-4">
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
                        Tiến độ CEFR
                    </h2>
                    <div className="flex items-center gap-1 sm:gap-2">
                        {CEFR_LEVELS.map((level, idx) => {
                            const isActive = level === data.profile.currentLevel
                            const isPast = idx < currentIdx
                            const isTarget = level === data.profile.targetLevel
                            const color = getCefrTheme(level).css

                            return (
                                <div key={level} className="flex flex-1 flex-col items-center gap-1.5">
                                    <div
                                        className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl text-xs sm:text-sm font-bold transition-all duration-300
                                            ${isActive
                                                ? 'scale-110 text-white shadow-lg outline outline-2 outline-offset-2'
                                                : isPast
                                                    ? 'text-white opacity-80'
                                                    : 'bg-gray-100 text-gray-400'
                                            }`}
                                        style={{
                                            backgroundColor: isActive || isPast ? color : undefined,
                                            outlineColor: isActive ? color : undefined,
                                        }}
                                    >
                                        {level}
                                    </div>
                                    {isTarget && (
                                        <span className="text-[10px] font-semibold text-fuxie-primary">{t('targetTitle')}</span>
                                    )}
                                    {isActive && !isTarget && (
                                        <span className="text-[10px] font-semibold" style={{ color }}>{t('current')}</span>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {/* Progress bar */}
                    <div className="mt-5">
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                            <span>{data.profile.currentLevel} → {data.profile.targetLevel}</span>
                            <span className="font-semibold text-gray-600">{cefrProgress}%</span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-gray-100">
                            <div
                                className="h-2.5 rounded-full transition-all duration-700 animate-grow-width"
                                style={{
                                    width: `${Math.max(cefrProgress, 5)}%`,
                                    background: `linear-gradient(90deg, ${getCefrTheme(data.profile.currentLevel).css}, ${getCefrTheme(data.profile.targetLevel).css})`,
                                }}
                            />
                        </div>
                    </div>

                    {/* Mini stats row */}
                    <div className="mt-4 grid grid-cols-4 gap-3">
                        <MiniStat value={data.profile.totalWordsLearned} label="Từ" icon="📝" />
                        <MiniStat value={data.profile.totalLessonsCompleted} label="Bài học" icon="📖" />
                        <MiniStat
                            value={`${Math.floor(data.profile.totalStudyMinutes / 60)}h`}
                            label="Thời gian học"
                            icon="⏱️"
                        />
                        <MiniStat
                            value={`${data.listening?.completedLessons ?? 0}/${data.listening?.totalLessons ?? 0}`}
                            label="Hören"
                            icon="🎧"
                        />
                        <MiniStat
                            value={`${data.grammar?.completedLessons ?? 0}/${data.grammar?.totalLessons ?? 0}`}
                            label="Grammatik"
                            icon="📝"
                        />
                    </div>
                </div>

                {/* Weekly Activity Chart */}
                <div className="lg:col-span-2 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 animate-fade-in-up stagger-5">
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
                        Hoạt động tuần
                    </h2>
                    <div className="flex items-end gap-1.5 h-32">
                        {(data.weeklyActivity ?? []).map((day, i) => {
                            const heightPercent = maxWeeklyXp > 0 ? (day.xp / maxWeeklyXp) * 100 : 0
                            const isToday = i === (data.weeklyActivity ?? []).length - 1
                            return (
                                <div key={day.date} className="group relative flex flex-1 flex-col items-center gap-1">
                                    {/* Tooltip */}
                                    <div className="absolute -top-10 hidden group-hover:flex items-center justify-center rounded-lg bg-gray-800 px-2 py-1 text-[10px] text-white whitespace-nowrap z-10">
                                        {day.xp} XP · {day.minutes} min
                                    </div>
                                    {/* Bar */}
                                    <div className="w-full flex items-end justify-center h-24">
                                        <div
                                            className="w-full max-w-8 rounded-t-md transition-all duration-500 chart-bar"
                                            style={{
                                                height: `${Math.max(heightPercent, 4)}%`,
                                                backgroundColor: isToday ? '#60A8E4' : '#dbeafe',
                                                animationDelay: `${i * 0.08}s`,
                                            }}
                                        />
                                    </div>
                                    {/* Label */}
                                    <span className={`text-[10px] font-medium ${isToday ? 'text-fuxie-primary font-bold' : 'text-gray-400'}`}>
                                        {day.day}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                    {/* Weekly total */}
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-400 border-t border-gray-50 pt-2">
                        <span>{t('thisWeek')}</span>
                        <span className="font-semibold text-gray-600">
                            {(data.weeklyActivity ?? []).reduce((s, d) => s + d.xp, 0)} XP
                        </span>
                    </div>
                </div>
            </div>

            {/* ===== SKILLS + QUICK ACTIONS + ACHIEVEMENTS ===== */}
            <div className="grid gap-4 lg:grid-cols-3">
                {/* Skills Overview */}
                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 animate-fade-in-up stagger-5">
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
                        Skills
                    </h2>
                    <div className="space-y-3">
                        {(data.skills ?? []).map((skill) => (
                            <div key={skill.key} className="group">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                                        <span className="text-sm">{SKILL_ICONS[skill.key]}</span>
                                        {skill.label}
                                    </span>
                                    <span className="text-xs font-semibold text-gray-400">
                                        {skill.score > 0 ? `${skill.score}%` : '–'}
                                    </span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-gray-100">
                                    <div
                                        className="h-2 rounded-full transition-all duration-700 animate-grow-width"
                                        style={{
                                            width: skill.score > 0 ? `${skill.score}%` : '0%',
                                            backgroundColor: SKILL_COLORS[skill.key] ?? '#9E9E9E',
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 animate-fade-in-up stagger-6">
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
                        Bắt đầu nhanh
                    </h2>
                    <div className="space-y-2">
                        <QuickAction
                            href="/review"
                            icon="🔄"
                            label="Ôn SRS"
                            sublabel={(data.srs?.dueCount ?? 0) > 0 ? `${data.srs.dueCount} thẻ cần ôn` : 'Không có thẻ cần ôn'}
                            color="#2EC4B6"
                            badge={(data.srs?.dueCount ?? 0) > 0 ? data.srs.dueCount : undefined}
                        />
                        <QuickAction
                            href="/listening"
                            icon="🎧"
                            label="Luyện nghe"
                            sublabel={(data.listening?.completedLessons ?? 0) > 0
                                ? `${data.listening.completedLessons}/${data.listening.totalLessons} bài`
                                : `${data.listening?.totalLessons ?? 0} bài có sẵn`
                            }
                            color="#2EC4B6"
                            badge={(data.listening?.totalLessons ?? 0) - (data.listening?.completedLessons ?? 0) > 0
                                ? data.listening.totalLessons - data.listening.completedLessons
                                : undefined}
                        />
                        <QuickAction
                            href="/vocabulary"
                            icon="📚"
                            label="Từ mới"
                            sublabel="Mở rộng từ vựng"
                            color="#54A8E4"
                        />
                        <QuickAction
                            href="/grammar"
                            icon="📝"
                            label="Grammatik"
                            sublabel={(data.grammar?.completedLessons ?? 0) > 0
                                ? `${data.grammar.completedLessons}/${data.grammar.totalLessons} bài · ${data.grammar.totalStars} ⭐`
                                : `${data.grammar?.totalTopics ?? 0} chủ đề có sẵn`
                            }
                            color="#3C78A8"
                            badge={(data.grammar?.totalLessons ?? 0) - (data.grammar?.completedLessons ?? 0) > 0
                                ? data.grammar.totalLessons - data.grammar.completedLessons
                                : undefined}
                        />
                        <QuickAction
                            href="/exam"
                            icon="🎯"
                            label="Luyện thi thử"
                            sublabel={data.profile.targetExam
                                ? `${data.profile.targetExam} ${data.profile.targetLevel}`
                                : 'Bắt đầu thi thử'
                            }
                            color="#9C27B0"
                        />
                    </div>
                </div>

                {/* Achievements */}
                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 animate-fade-in-up stagger-6">
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
                        Thành tựu
                    </h2>
                    {(data.achievements ?? []).length > 0 ? (
                        <div className="space-y-2.5">
                            {data.achievements.map((a) => (
                                <div
                                    key={a.id}
                                    className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 p-3"
                                >
                                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-lg shadow-sm">
                                        {a.iconUrl ? '🏅' : ACHIEVEMENT_ICONS[a.category] ?? ACHIEVEMENT_ICONS.default}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800 truncate">
                                            {a.titleDe ?? a.title}
                                        </p>
                                        <p className="text-[10px] text-gray-400">
                                            {new Date(a.earnedAt).toLocaleDateString('vi-VN', {
                                                day: 'numeric',
                                                month: 'short',
                                            })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <Image src={FUXIE_3D_ASSETS.happyWave} alt="Fuxie" width={48} height={48} className="mb-2 object-contain" />
                            <p className="text-sm text-gray-500">{t('noAchievements')}</p>
                            <p className="text-xs text-gray-400 mt-1">{t('noAchievementsDesc')}</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

function MissionControlSection({ initialMissionBoard }: { initialMissionBoard: MissionBoardData }) {
    const t = useTranslations('Dashboard')
    const [missionBoard, setMissionBoard] = useState(initialMissionBoard)
    const [activePeriod, setActivePeriod] = useState<MissionBoardPeriod>('daily')
    const [claimingMissionId, setClaimingMissionId] = useState<string | null>(null)
    const [claimError, setClaimError] = useState<string | null>(null)
    const [claimCelebration, setClaimCelebration] = useState<ClaimCelebration | null>(null)
    const [isPending, startTransition] = useTransition()
    const activePeriodData = missionBoard.periods.find((period) => period.period === activePeriod) ?? missionBoard.periods[0]
    const xpIntoLevel = Math.max(0, missionBoard.xpLevel.totalXp - missionBoard.xpLevel.currentLevelXp)

    const claimMission = (mission: MissionBoardItem) => {
        if (mission.status !== 'claimable' || claimingMissionId) return

        setClaimingMissionId(mission.id)
        setClaimError(null)
        setClaimCelebration(null)
        startTransition(async () => {
            try {
                const res = await fetch(`/api/v1/missions/${mission.id}/claim`, { method: 'POST' })
                const json = await res.json()

                if (!res.ok || !json.success) {
                    throw new Error(json.error || 'Không nhận được thưởng mission')
                }

                setMissionBoard(json.data.missionBoard)
                setClaimCelebration({
                    missionId: mission.id,
                    title: mission.title,
                    fucoinReward: mission.fucoinReward,
                    xpReward: mission.xpReward,
                })
            } catch (error) {
                setClaimError(error instanceof Error ? error.message : 'Không nhận được thưởng mission')
            } finally {
                setClaimingMissionId(null)
            }
        })
    }

    return (
        <section className="mb-6 overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-[#CCE4F0]/80 animate-fade-in-up stagger-4">
            <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="min-w-0 p-5 sm:p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                                <FuxieBadge tone="brand">
                                    <Coins className="h-3.5 w-3.5" />
                                    Fuxie Economy
                                </FuxieBadge>
                                <FuxieBadge tone="reward" className="normal-case tracking-normal">
                                    {missionBoard.wallet.balance.toLocaleString('vi-VN')} Fucoin
                                </FuxieBadge>
                            </div>
                            <h2 className="text-2xl font-black text-[#173B56] sm:text-3xl">Mission Control</h2>
                            <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-[#3C78A8]">
                                XP tăng level học tập, Fucoin là phần thưởng có thể dùng cho shop và unlock ở các batch sau.
                            </p>
                        </div>

                        <div className="grid gap-2 sm:min-w-[360px] sm:grid-cols-3">
                            <MiniMissionStat label="Wallet" value={missionBoard.wallet.balance.toLocaleString('vi-VN')} detail="Fucoin" />
                            <MiniMissionStat label="Earned" value={missionBoard.wallet.lifetimeEarned.toLocaleString('vi-VN')} detail="Lifetime" />
                            <MiniMissionStat label="Today" value={`${missionBoard.dailyFucoin.earnedToday}/${missionBoard.dailyFucoin.dailyCap}`} detail="Daily cap" />
                        </div>
                    </div>

                    <div className="mt-5 rounded-2xl bg-[#F3FBFF] p-4 ring-1 ring-[#CCE4F0]/70">
                        <div className="flex flex-wrap items-end justify-between gap-3">
                            <div>
                                <p className="text-xs font-black uppercase tracking-wide text-[#3C78A8]/70">
                                    Level {missionBoard.xpLevel.level} · {missionBoard.xpLevel.title}
                                </p>
                                <p className="mt-1 text-sm font-bold text-[#173B56]">
                                    {xpIntoLevel.toLocaleString('vi-VN')}/{missionBoard.xpLevel.nextLevelXp.toLocaleString('vi-VN')} XP tới level kế tiếp
                                </p>
                            </div>
                            <span className="text-sm font-black text-[#3C78A8]">{missionBoard.xpLevel.progress}%</span>
                        </div>
                        <FuxieProgressBar value={missionBoard.xpLevel.progress} className="mt-3" />
                    </div>

                    <div className="mt-3 rounded-2xl bg-[#FFF7D6]/65 p-4 ring-1 ring-[#FFD166]/45">
                        <div className="mb-2 flex items-center justify-between gap-3 text-xs font-black text-[#C67A00]">
                            <span>{t('fucoinToday')}</span>
                            <span>{missionBoard.dailyFucoin.earnedToday}/{missionBoard.dailyFucoin.dailyCap}</span>
                        </div>
                        <FuxieProgressBar
                            value={missionBoard.dailyFucoin.dailyCap > 0 ? Math.round((missionBoard.dailyFucoin.earnedToday / missionBoard.dailyFucoin.dailyCap) * 100) : 0}
                            tone="reward"
                        />
                        <p className="mt-2 text-xs font-semibold text-[#8A5A00]">
                            {missionBoard.dailyFucoin.capReached
                                ? 'Em đã nhận đủ Fucoin học tập hôm nay. XP và tiến độ vẫn tiếp tục được ghi.'
                                : `Còn ${missionBoard.dailyFucoin.remaining} Fucoin học tập có thể nhận hôm nay.`}
                        </p>
                    </div>

                    <div className="mt-5 flex gap-2 overflow-x-auto rounded-2xl bg-[#F3FBFF] p-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {missionBoard.periods.map((period) => {
                            const active = period.period === activePeriod
                            return (
                                <button
                                    key={period.period}
                                    type="button"
                                    onClick={() => setActivePeriod(period.period)}
                                    className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition-all ${active ? 'bg-[#60A8E4] text-white shadow-sm' : 'bg-white text-[#3C78A8] ring-1 ring-[#CCE4F0]'}`}
                                >
                                    {period.label}
                                    {period.claimableCount > 0 && (
                                        <span className={active ? 'rounded-full bg-white/20 px-2 py-0.5 text-xs text-white' : 'rounded-full bg-[#FFF4D6] px-2 py-0.5 text-xs text-[#C67A00]'}>
                                            {period.claimableCount}
                                        </span>
                                    )}
                                </button>
                            )
                        })}
                    </div>

                    {claimError && (
                        <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 ring-1 ring-red-100">
                            {claimError}
                        </p>
                    )}

                    {claimCelebration && (
                        <RewardClaimCelebration celebration={claimCelebration} />
                    )}

                    <div className="mt-4 grid gap-3 xl:grid-cols-3">
                        {(activePeriodData?.missions ?? []).map((mission) => (
                            <MissionCard
                                key={mission.id}
                                mission={mission}
                                disabled={isPending || Boolean(claimingMissionId)}
                                claiming={claimingMissionId === mission.id}
                                justClaimed={claimCelebration?.missionId === mission.id}
                                onClaim={() => claimMission(mission)}
                            />
                        ))}
                    </div>
                </div>

                <div className="border-t border-[#CCE4F0]/65 bg-gradient-to-br from-[#F3FBFF] via-white to-[#FFF7D6] p-5 sm:p-6 lg:border-l lg:border-t-0">
                    <FuxieCoach
                        role="reward"
                        eyebrow="Shop catalog"
                        title="Fucoin shop v1" // locale-allow
                        mascotSrc={FUXIE_3D_ASSETS.shopkeeper}
                        message="Catalog đã có giá, quyền lợi và tiến độ tích Fucoin. Redeem thật vẫn khóa để bảo toàn economy."
                    />
                    <MeasuredLink
                        href="/rewards/shop"
                        flow="dashboard.shop.open"
                        source="mission-control-shop"
                        className={fuxieButtonClass('reward', 'md', 'mt-4 w-full')}
                    >
                        <Gift className="h-4 w-4" />
                        Xem shop catalog
                    </MeasuredLink>

                    <div className="mt-4 space-y-2">
                        {missionBoard.shopPreview.map((item) => {
                            const assetSrc = getShopItemAssetSrc(item.id, item.category)

                            return (
                            <div key={item.id} className="rounded-2xl bg-white/80 p-3 ring-1 ring-white">
                                <div className="flex items-start gap-3">
                                    <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm ring-1 ring-white ${item.canAfford ? 'bg-[#FFF4D6]' : 'bg-[#F3FBFF]'}`}>
                                        <Image
                                            src={assetSrc}
                                            alt=""
                                            width={46}
                                            height={46}
                                            className="h-11 w-11 object-contain drop-shadow-sm"
                                        />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="text-sm font-black text-slate-950">{item.title}</h3>
                                            <span className="shrink-0 text-xs font-black text-[#C67A00]">{item.cost} Fu</span>
                                        </div>
                                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                            <span className="rounded-full bg-[#F3FBFF] px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#3C78A8] ring-1 ring-[#CCE4F0]/70">
                                                {item.categoryLabel}
                                            </span>
                                            <span className="rounded-full bg-[#FFF7D6] px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#C67A00] ring-1 ring-[#FFD166]/45">
                                                {item.statusLabel}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-500">{item.description}</p>
                                        <p className="mt-1 text-[11px] font-bold text-[#3C78A8]">{item.benefit}</p>
                                        <FuxieProgressBar value={item.walletProgress} tone={item.canAfford ? 'reward' : 'brand'} className="mt-2 h-1.5" />
                                    </div>
                                    <div className="mt-1 flex shrink-0 flex-col items-center gap-1">
                                        <LockKeyhole className="h-4 w-4 text-slate-400" />
                                        <span className="text-[10px] font-black text-slate-400">{item.walletProgress}%</span>
                                    </div>
                                </div>
                            </div>
                        )})}
                    </div>

                    <div className="mt-5 rounded-2xl bg-white/70 p-4 ring-1 ring-white">
                        <div className="mb-3 flex items-center justify-between gap-2">
                            <h3 className="text-sm font-black text-[#173B56]">{t('walletRecent')}</h3>
                            <span className="text-xs font-bold text-[#3C78A8]">{missionBoard.wallet.balance.toLocaleString('vi-VN')} Fu</span>
                        </div>
                        <div className="space-y-2">
                            {missionBoard.recentLedger.length > 0 ? missionBoard.recentLedger.map((entry) => (
                                <div key={entry.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#F3FBFF] px-3 py-2 ring-1 ring-[#CCE4F0]/55">
                                    <div className="min-w-0">
                                        <p className="truncate text-xs font-black text-slate-900">{formatLedgerSource(entry.sourceType)}</p>
                                        <p className="truncate text-[11px] font-semibold text-slate-500">{entry.reason}</p>
                                    </div>
                                    <span className={`inline-flex shrink-0 items-center gap-1 text-xs font-black ${entry.amount >= 0 ? 'text-[#C67A00]' : 'text-red-500'}`}>
                                        {entry.amount >= 0 && (
                                            <Image
                                                src={REWARD_ASSETS.fucoin}
                                                alt=""
                                                width={20}
                                                height={20}
                                                className="h-5 w-5 object-contain"
                                            />
                                        )}
                                        {entry.amount >= 0 ? '+' : ''}{entry.amount} Fu
                                    </span>
                                </div>
                            )) : (
                                <p className="rounded-xl bg-[#F3FBFF] px-3 py-2 text-xs font-semibold text-[#3C78A8] ring-1 ring-[#CCE4F0]/55">
                                    Chưa có giao dịch Fucoin. Hoàn thành một quest để ví bắt đầu sáng lên.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

function formatLedgerSource(sourceType: string) {
    if (sourceType === 'mission') return 'Mission claim'
    if (sourceType.includes('vocabulary')) return 'Vocabulary'
    if (sourceType.includes('listening')) return 'Listening'
    if (sourceType.includes('reading')) return 'Reading'
    if (sourceType.includes('writing')) return 'Writing'
    if (sourceType.includes('exam')) return 'Exam'
    return 'Fucoin'
}

function StreakFreezeAwarenessSection({ data }: { data: DashboardData }) {
    const t = useTranslations('Dashboard')
    const timeline = data.streakFreezeTimeline ?? []
    const latestUsage = timeline[0]
    const freezesAvailable = data.streak?.freezesAvailable ?? 0
    const freezesUsed = data.streak?.freezesUsed ?? 0
    const currentStreak = data.streak?.currentStreak ?? 0
    const hasFreezeReady = freezesAvailable > 0
    const coachTitle = latestUsage
        ? `Fuxie vua cuu streak ${latestUsage.protectedStreak} ngay`
        : hasFreezeReady
            ? 'Streak Freeze dang san sang'
            : 'Hay tich them Freeze bao ve streak'
    const coachMessage = latestUsage
        ? `Gan nhat, Freeze da bao ve chuoi hoc sau ${latestUsage.missedDays} ngay bi lo. Em van con ${latestUsage.freezesRemaining} Freeze de du phong.`
        : hasFreezeReady
            ? `Em dang co ${freezesAvailable} Freeze. Cu hoc deu hom nay de giu streak ${currentStreak} ngay va tiet kiem Freeze cho luc can that.`
            : 'Khi co Streak Freeze, he thong co the bao ve chuoi hoc neu em lo mot ngay. Vao shop hoac hoan thanh mission de chuan bi them.'

    return (
        <section className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="overflow-hidden rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-[#CCE4F0]/75 animate-fade-in-up stagger-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#EAFBF8] px-3 py-1 text-xs font-black uppercase tracking-wide text-[#148F7D] ring-1 ring-[#2EC4B6]/25">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Streak safety
                        </div>
                        <h2 className="text-xl font-black text-[#173B56]">{t('streakFreezeHistory')}</h2>
                        <p className="mt-1 max-w-2xl text-sm font-semibold leading-relaxed text-[#3C78A8]">
                            Freeze la lop bao hiem cho thoi quen hoc. Dashboard hien ca so Freeze con lai va nhung lan da cuu streak gan nhat.
                        </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 md:min-w-[340px]">
                        <MiniMissionStat label="Ready" value={freezesAvailable.toLocaleString('vi-VN')} detail="Freeze" />
                        <MiniMissionStat label="Used" value={freezesUsed.toLocaleString('vi-VN')} detail="Total" />
                        <MiniMissionStat label="Streak" value={currentStreak.toLocaleString('vi-VN')} detail="days" />
                    </div>
                </div>

                {timeline.length > 0 ? (
                    <div className="mt-4 grid gap-3 lg:grid-cols-3">
                        {timeline.map((item) => (
                            <div key={item.id} className="rounded-2xl bg-[#F3FBFF] p-4 ring-1 ring-[#CCE4F0]/70">
                                <div className="flex items-start gap-3">
                                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#EAFBF8] text-[#148F7D] ring-1 ring-[#2EC4B6]/25">
                                        <ShieldCheck className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-black text-[#173B56]">
                                            Saved {item.protectedStreak}-day streak
                                        </p>
                                        <p className="mt-1 text-xs font-semibold leading-relaxed text-[#3C78A8]">
                                            Missed {item.missedDays} day{item.missedDays === 1 ? '' : 's'}.
                                            {' '}
                                            {item.freezesRemaining} Freeze left.
                                        </p>
                                        <p className="mt-2 truncate text-[11px] font-bold uppercase tracking-wide text-[#3C78A8]/65">
                                            {formatFreezeUsageSource(item.sourceType)} · {item.sourceId}
                                        </p>
                                        <p className="mt-1 text-[11px] font-semibold text-slate-400">
                                            {new Date(item.usedAt).toLocaleString('vi-VN')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="mt-4 rounded-2xl bg-[#F3FBFF] p-4 ring-1 ring-[#CCE4F0]/70">
                        <div className="flex items-start gap-3">
                            <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-white ${hasFreezeReady ? 'bg-[#2EC4B6]' : 'bg-[#60A8E4]'}`}>
                                {hasFreezeReady ? <ShieldCheck className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                            </div>
                            <div>
                                <p className="text-sm font-black text-[#173B56]">
                                    {hasFreezeReady ? 'Chua can dung Freeze nao' : 'Chua co Freeze timeline'}
                                </p>
                                <p className="mt-1 text-sm font-semibold leading-relaxed text-[#3C78A8]">
                                    {hasFreezeReady
                                        ? 'Tot lam. Freeze van con nguyen trong inventory, san sang bao ve neu co mot ngay ban.'
                                        : 'Khi Streak Freeze duoc dung de bao ve streak, receipt se hien o day de hoc vien thay gia tri that cua reward.'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <FuxieCoach
                role={latestUsage ? 'reward' : hasFreezeReady ? 'coach' : 'locked'}
                eyebrow="Fuxie safety coach"
                title={coachTitle}
                message={coachMessage}
                mascotSrc={latestUsage || hasFreezeReady ? FUXIE_3D_ASSETS.streakFreezeSaved : undefined}
                priority={Boolean(latestUsage || hasFreezeReady)}
                className="h-full"
            />
        </section>
    )
}

function formatFreezeUsageSource(sourceType: string) {
    if (sourceType === 'lesson') return 'Lesson'
    if (sourceType === 'exercise') return 'Exercise'
    return 'Learning'
}

type ClaimCelebration = {
    missionId: string
    title: string
    fucoinReward: number
    xpReward: number
}

function RewardClaimCelebration({ celebration }: { celebration: ClaimCelebration }) {
    const rewards: RewardPreviewItem[] = [
        { type: 'fucoin', label: `+${celebration.fucoinReward} Fucoin`, detail: 'Mission claim' },
        { type: 'xp', label: `+${celebration.xpReward} XP`, detail: 'Level progress' },
        { type: 'badge', label: 'Mission proof', detail: 'Ngay / thang / quy' },
    ]

    return (
        <div
            className="fuxie-reward-claim-panel mt-3 overflow-hidden rounded-2xl bg-gradient-to-r from-[#EAFBF8] via-white to-[#FFF7D6] p-3 shadow-sm ring-1 ring-[#2EC4B6]/25"
            role="status"
            aria-live="polite"
        >
            <div className="flex items-center gap-3">
                <FuxieRoleMascot
                    src={FUXIE_3D_ASSETS.fucoinReward}
                    alt="Fuxie Fucoin reward" // locale-allow
                    size={58}
                    motion="reward"
                    className="rounded-2xl bg-white/75 p-1 ring-1 ring-white"
                />
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase tracking-wide text-[#148F7D]">Reward claimed</p>
                    <p className="mt-0.5 line-clamp-2 text-sm font-black text-[#173B56]">
                        Da nhan thuong mission: {celebration.title}
                    </p>
                    <RewardRevealMoment
                        rewards={rewards}
                        title="Mission reward reveal" // locale-allow
                        detail="Fucoin va XP vua duoc claim, san sang day em toi phan thuong tiep theo."
                        mode="earned"
                        className="mt-2"
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF4D6] px-2.5 py-1 text-xs font-black text-[#C67A00] ring-1 ring-[#FFD166]/55">
                            <Image
                                src={REWARD_ASSETS.fucoin}
                                alt=""
                                width={18}
                                height={18}
                                className="h-[18px] w-[18px] object-contain"
                            />
                            +{celebration.fucoinReward} Fucoin
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#F3FBFF] px-2.5 py-1 text-xs font-black text-[#3C78A8] ring-1 ring-[#CCE4F0]">
                            <Sparkles className="h-3.5 w-3.5" />
                            +{celebration.xpReward} XP
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

function MissionCard({
    mission,
    disabled,
    claiming,
    justClaimed,
    onClaim,
}: {
    mission: MissionBoardItem
    disabled: boolean
    claiming: boolean
    justClaimed: boolean
    onClaim: () => void
}) {
    const isClaimable = mission.status === 'claimable'
    const isClaimed = mission.status === 'claimed'
    const isLocked = mission.status === 'locked'
    const statusLabel = isClaimed ? 'Đã nhận' : isClaimable ? 'Claim' : isLocked ? 'Locked' : mission.progress > 0 ? 'Đang làm' : 'Sẵn sàng'

    return (
        <FuxieQuestCard
            interactive={false}
            data-reward-state={justClaimed ? 'earned' : isClaimable ? 'preview' : undefined}
            className={`relative overflow-hidden p-4 ring-1 ${justClaimed ? 'fuxie-claim-card-pop border-[#FFB703]/60 ring-[#FFD166]/65' : isClaimable ? 'border-[#FFB703]/45 ring-[#FFD166]/55' : isClaimed ? 'border-[#2EC4B6]/35 ring-[#2EC4B6]/30' : 'ring-slate-100'}`}
        >
            {justClaimed && (
                <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                        <span
                            key={index}
                            className="fuxie-coin-burst absolute h-2.5 w-2.5 rounded-full bg-[#FFB703] shadow-[0_0_0_3px_rgba(255,183,3,0.18)]"
                            style={{
                                left: `${18 + index * 12}%`,
                                top: index % 2 === 0 ? '20%' : '68%',
                                animationDelay: `${index * 90}ms`,
                            }}
                        />
                    ))}
                </div>
            )}
            <div className="flex h-full min-w-0 flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white ${isClaimed ? 'bg-[#2EC4B6]' : isClaimable ? 'fuxie-claim-gift-pulse bg-[#FFB703]' : 'bg-[#60A8E4]'}`}>
                        {isClaimed ? <CheckCircle2 className="h-5 w-5" /> : isClaimable ? <Gift className="h-5 w-5" /> : <Target className="h-5 w-5" />} // locale-allow
                    </span>
                    <FuxieBadge tone={isClaimed ? 'success' : isClaimable ? 'reward' : isLocked ? 'danger' : 'brand'} className="normal-case tracking-normal">
                        {statusLabel}
                    </FuxieBadge>
                </div>
                <div className="min-w-0">
                    <h3 className="line-clamp-2 min-h-[2.5rem] text-base font-black leading-tight text-slate-950">
                        {mission.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-xs font-semibold leading-relaxed text-slate-500">
                        {mission.description}
                    </p>
                </div>
                <div className="mt-auto">
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-xs font-bold text-slate-500">
                        <span>{mission.currentValue}/{mission.targetValue}</span>
                        <span>{mission.progress}%</span>
                    </div>
                    <FuxieProgressBar value={mission.progress} tone={isClaimed ? 'success' : isClaimable ? 'reward' : 'brand'} />
                    <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="inline-flex min-w-0 items-center gap-1.5 text-xs font-black text-[#C67A00]">
                            <Image
                                src={REWARD_ASSETS.fucoin}
                                alt=""
                                width={20}
                                height={20}
                                className="h-5 w-5 shrink-0 object-contain"
                            />
                            <span className="truncate">+{mission.fucoinReward} Fu · +{mission.xpReward} XP</span>
                        </span>
                        {isClaimable ? (
                            <button
                                type="button"
                                disabled={disabled}
                                onClick={onClaim}
                                className={fuxieButtonClass('reward', 'sm', 'shrink-0 overflow-hidden')}
                            >
                                {claiming ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        Dang nhan
                                    </>
                                ) : (
                                    'Nhận'
                                )}
                            </button>
                        ) : mission.href && !isClaimed && !isLocked ? (
                            <MeasuredLink href={mission.href} flow="dashboard.mission.action" source={mission.slug} className={fuxieButtonClass('secondary', 'sm', 'shrink-0')}>
                                {mission.progress > 0 ? 'Tiếp' : 'Bắt đầu'}
                            </MeasuredLink>
                        ) : (
                            <span className="text-xs font-bold text-slate-400">{isClaimed ? 'Done' : isLocked ? 'Locked' : 'Đang làm'}</span>
                        )}
                    </div>
                </div>
            </div>
        </FuxieQuestCard>
    )
}

function TodayPlanSection({ plan, data }: { plan: TodayPlan; data: DashboardData }) {
    return <TodayPlanQuestSection plan={plan} data={data} />
}

function TodayPlanQuestSection({ plan, data }: { plan: TodayPlan; data: DashboardData }) {
    const t = useTranslations('Dashboard')
    const mission = buildDashboardMissionHub(plan, {
        currentStreak: data.streak.currentStreak,
        srsDueCount: data.srs.dueCount,
        srsReviewedToday: data.srs.reviewedToday,
        totalXp: data.profile.totalXp,
        totalAchievements: data.achievements.length,
    })
    const primaryQuest = mission.primaryQuest
    const primaryMeta = dashboardQuestMeta(primaryQuest, 0)
    const PrimaryIcon = primaryMeta.icon
    const primaryCta = mission.primaryCta
    const secondaryQuests = mission.secondaryQuests
    const coachRole = primaryQuest.status === 'completed'
        ? 'reward'
        : mission.isFreshStart
            ? 'feedback'
            : 'coach'
    const missionMinutes = Math.max(primaryQuest.estimatedMinutes, plan.remainingMinutes || primaryQuest.estimatedMinutes)

    return (
        <section className="mb-6 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#F3FBFF] via-white to-[#CCE4F0] shadow-[0_24px_70px_rgba(60,120,168,0.16)] ring-1 ring-white/80 animate-fade-in-up stagger-4">
            <div className="relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(96,168,228,0.35),transparent_34%),radial-gradient(circle_at_top_right,rgba(46,196,182,0.22),transparent_30%)]" />
                <div className="relative grid grid-cols-1 gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.25fr)_360px]">
                    <div className="min-w-0">
                        <div className="mb-5 flex flex-wrap items-center gap-2">
                            <FuxieBadge tone={mission.isFreshStart ? 'reward' : 'brand'}>
                                <Target className="h-3.5 w-3.5" />
                                {mission.isFreshStart ? 'Ngày 1' : 'Mission Hub'}
                            </FuxieBadge>
                            <FuxieBadge tone="neutral" className="normal-case tracking-normal">
                                <Timer className="h-3.5 w-3.5" />
                                {missionMinutes} min
                            </FuxieBadge>
                            {plan.signals.examDaysLeft !== null && (
                                <FuxieBadge tone="reward" className="normal-case tracking-normal">
                                    <CalendarClock className="h-3.5 w-3.5" />
                                    {plan.signals.examDaysLeft} ngày đến kỳ thi
                                </FuxieBadge>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_128px] lg:items-start">
                            <div className="min-w-0">
                                <p className="text-sm font-black uppercase tracking-wide text-[#3C78A8]">
                                    Nhiệm vụ hôm nay
                                </p>
                                <h2 className="mt-2 text-3xl font-black leading-tight tracking-normal text-[#173B56] sm:text-4xl">
                                    {primaryQuest.title}
                                </h2>
                                <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-[#3C78A8] sm:text-base">
                                    {[formatMissionReason(primaryQuest.reason), 'Fuxie chọn quest này để bạn thấy rõ việc cần làm, phần thưởng, và bước mở khóa tiếp theo.'].filter(Boolean).join(' ')}
                                </p>
                            </div>
                            <div className="hidden justify-self-end rounded-[24px] bg-white/75 p-3 shadow-sm ring-1 ring-white/90 lg:block">
                                <div className="flex h-24 w-24 items-center justify-center rounded-2xl text-white shadow-lg" style={{ backgroundColor: primaryMeta.color }}>
                                    <PrimaryIcon className="h-10 w-10" />
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 rounded-2xl bg-white/72 p-3 shadow-sm ring-1 ring-white/90 backdrop-blur">
                            <RewardPreview rewards={primaryQuest.rewardPreview} />
                        </div>

                        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                            <MeasuredLink
                                href={primaryCta.href}
                                flow="dashboard.quest.primary"
                                source={primaryCta.source}
                                className={fuxieButtonClass('primary', 'lg', 'w-full sm:w-auto')}
                            >
                                {primaryCta.label}
                                <ArrowRight className="h-4 w-4" />
                            </MeasuredLink>
                            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-white/65 px-4 py-3 text-sm font-bold text-[#3C78A8] ring-1 ring-white/90">
                                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#2EC4B6]" />
                                <span className="min-w-0 leading-snug">{primaryCta.supportingCopy}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex min-w-0 flex-col gap-4">
                        <FuxieCoach
                            role={coachRole}
                            eyebrow={mission.isFreshStart ? 'Fresh start' : 'Next best action'}
                            title={t('focusQuest')}
                            message={mission.coachMessage}
                            className="bg-white"
                        />

                        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-white/90">
                            <div className="flex items-end justify-between gap-4">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">{t('todayGoal')}</p>
                                    <p className="mt-1 text-3xl font-black text-slate-950">{mission.goalProgress}%</p>
                                </div>
                                <div className="text-right text-sm font-bold text-slate-500">
                                    <p>{plan.currentMinutes}/{plan.goalMinutes} min</p>
                                    <p>{plan.dueSrsCount} {t('srsToReview')}</p>
                                </div>
                            </div>
                            <FuxieProgressBar value={mission.goalProgress} className="mt-3" />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <MiniMissionStat label="XP" value={data.profile.totalXp.toLocaleString('vi-VN')} detail="Tổng" />
                            <MiniMissionStat label="Streak" value={`${data.streak.currentStreak}`} detail="ngày" />
                            <MiniMissionStat label="Review" value={`${data.srs.reviewedToday}/${Math.max(data.srs.dueCount + data.srs.reviewedToday, 1)}`} detail="SRS" />
                        </div>
                    </div>
                </div>

                {secondaryQuests.length > 0 && (
                <div className="relative border-t border-white/75 bg-white/48 px-5 py-4 sm:px-6">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-black uppercase tracking-wide text-[#3C78A8]">{t('nextQuest')}</p>
                            <p className="text-sm font-semibold text-slate-500">{t('secondaryCtaTip')}</p>
                        </div>
                        <FuxieBadge tone="success" className="hidden sm:inline-flex">
                            {secondaryQuests.length} quest
                        </FuxieBadge>
                    </div>
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                        {secondaryQuests.map((quest, index) => (
                            <DashboardQuestLink
                                key={quest.id}
                                quest={quest}
                                index={index}
                                isPrimary={false}
                            />
                        ))}
                    </div>
                </div>
                )}
            </div>
        </section>
    )
}

function MiniMissionStat({ label, value, detail }: { label: string; value: string; detail: string }) {
    return (
        <div className="min-w-0 rounded-2xl bg-white/80 px-3 py-2.5 text-center shadow-sm ring-1 ring-white/90">
            <p className="text-[10px] font-black uppercase tracking-wide text-[#3C78A8]/70">{label}</p>
            <p className="mt-0.5 truncate text-base font-black text-slate-950">{value}</p>
            <p className="truncate text-[10px] font-semibold text-slate-500">{detail}</p>
        </div>
    )
}

function formatMissionReason(reason: string) {
    const cleanReason = reason.trim().replace(/[.!?。]+$/u, '')
    return cleanReason ? `${cleanReason}.` : ''
}

function DashboardQuestLink({ quest, index, isPrimary }: { quest: DashboardQuest; index: number; isPrimary: boolean }) {
    const meta = dashboardQuestMeta(quest, index)
    const Icon = meta.icon

    return (
        <MeasuredLink
            href={quest.href}
            flow={isPrimary ? 'dashboard.quest.card.primary' : 'dashboard.quest.card.secondary'}
            source={quest.id}
            className="group block h-full"
        >
            <FuxieQuestCard
                interactive={false}
                className={`h-full p-4 ring-1 ${isPrimary ? 'border-[#60A8E4]/30 ring-[#60A8E4]/20' : 'ring-white/80'} group-hover:-translate-y-0.5 group-hover:shadow-lg group-hover:shadow-sky-900/10`}
            >
                <div className="flex h-full min-w-0 flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm" style={{ backgroundColor: meta.color }}>
                            <Icon className="h-5 w-5" />
                        </span>
                        <QuestStatusPill status={quest.status} />
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-xs font-black uppercase tracking-wide text-[#3C78A8]/70">
                            {quest.badge ?? meta.label}
                        </p>
                        <h3 className="mt-1 line-clamp-2 min-h-[2.5rem] text-base font-black leading-tight text-slate-950">
                            {quest.title}
                        </h3>
                        <p className="mt-2 line-clamp-2 text-xs font-semibold leading-relaxed text-slate-500">
                            {quest.reason}
                        </p>
                    </div>
                    <div className="mt-auto">
                        <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-slate-500">
                            <span>{quest.estimatedMinutes} min</span>
                            <span>{quest.progress}%</span>
                        </div>
                        <FuxieProgressBar
                            value={quest.progress}
                            tone={quest.status === 'completed' ? 'success' : quest.type === 'assignment' ? 'reward' : 'brand'}
                        />
                    </div>
                </div>
            </FuxieQuestCard>
        </MeasuredLink>
    )
}

function QuestStatusPill({ status }: { status: DashboardQuest['status'] }) {
    const t = useTranslations('Dashboard')
    if (status === 'completed') {
        return <FuxieBadge tone="success" className="normal-case tracking-normal">{t('statusDone')}</FuxieBadge>
    }
    if (status === 'active') {
        return <FuxieBadge tone="brand" className="normal-case tracking-normal">{t('statusOpen')}</FuxieBadge>
    }
    if (status === 'locked') {
        return <FuxieBadge tone="neutral" className="normal-case tracking-normal">{t('statusLocked')}</FuxieBadge>
    }
    return <FuxieBadge tone="neutral" className="normal-case tracking-normal">{t('statusNext')}</FuxieBadge>
}

function dashboardQuestMeta(quest: DashboardQuest, index: number): { icon: ComponentType<{ className?: string }>; color: string; label: string } {
    if (quest.type === 'fresh-start') return { icon: Sparkles, color: '#2EC4B6', label: 'Fresh start' }
    if (quest.type === 'srs') return { icon: RotateCcw, color: '#2EC4B6', label: 'SRS' }
    if (quest.type === 'assignment') return { icon: BookOpen, color: '#54A8E4', label: 'Assignment' }
    if (quest.type === 'exam') return { icon: Target, color: '#3C78A8', label: 'Exam' }
    return [
        { icon: Brain, color: '#3C78A8', label: 'Skill' },
        { icon: Headphones, color: '#2EC4B6', label: 'Practice' },
        { icon: BookOpen, color: '#60A8E4', label: 'Lesson' },
    ][index] ?? { icon: Brain, color: '#3C78A8', label: 'Skill' }
}

function _TodayPlanQuestSectionPrevious({ plan }: { plan: TodayPlan }) {
    const t = useTranslations('Dashboard')
    const topActions = plan.actions.slice(0, 3)

    if (topActions.length === 0) {
        return null
    }

    const primaryAction = topActions[0]!
    const secondaryActions = topActions.slice(1)
    const planProgress = plan.goalMinutes > 0
        ? Math.min(100, Math.round((plan.currentMinutes / plan.goalMinutes) * 100))
        : 0
    const remainingMinutes = Math.max(plan.remainingMinutes, primaryAction.estimatedMinutes)
    const estimatedXp = Math.max(15, primaryAction.estimatedMinutes * 3)
    const coachMessage = plan.remainingMinutes > 0
        ? `Còn ${plan.remainingMinutes} phút để chạm mục tiêu ngày. Làm quest này trước để giữ nhịp học.`
        : 'Mục tiêu ngày đã xong. Làm thêm quest nhỏ để đẩy nhanh tiến độ CEFR.'
    const rewards: RewardPreviewItem[] = [
        { type: 'xp', label: `+${estimatedXp} XP`, detail: 'Thưởng dự kiến' },
        {
            type: plan.remainingMinutes > 0 ? 'streak' : 'badge',
            label: plan.remainingMinutes > 0 ? 'Streak safe' : 'Bonus badge',
            detail: plan.remainingMinutes > 0 ? `${remainingMinutes} min mission` : 'Hoc them trong ngay',
        },
        {
            type: primaryAction.type === 'exam' ? 'exam' : 'unlock',
            label: primaryAction.type === 'exam' ? 'Exam ready' : 'Mở bước tiếp',
            detail: `${plan.currentLevel}${plan.targetLevel ? ` -> ${plan.targetLevel}` : ''}`,
        },
    ]

    return (
        <section className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#F3FBFF] via-[#E4F0F0] to-[#CCE4F0] shadow-xl shadow-sky-900/10 ring-1 ring-white/80 animate-fade-in-up stagger-4">
            <div className="relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(96,168,228,0.38),transparent_32%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.86),transparent_30%)]" />
                <div className="relative grid gap-5 p-5 sm:p-6 lg:grid-cols-[1.25fr_0.75fr]">
                    <div className="min-w-0">
                        <div className="mb-5 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/75 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#3C78A8] shadow-sm ring-1 ring-white/90">
                                <Target className="h-3.5 w-3.5 text-[#FFD166]" />
                                Daily Quest
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/75 px-3 py-1 text-xs font-bold text-[#3C78A8] shadow-sm ring-1 ring-white/90">
                                <Timer className="h-3.5 w-3.5 text-[#54A8E4]" />
                                {remainingMinutes} min
                            </span>
                            {plan.signals.examDaysLeft !== null && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/75 px-3 py-1 text-xs font-bold text-[#3C78A8] shadow-sm ring-1 ring-white/90">
                                    <CalendarClock className="h-3.5 w-3.5 text-[#FF8A3D]" />
                                    {plan.signals.examDaysLeft} ngày đến kỳ thi
                                </span>
                            )}
                        </div>

                        <div className="max-w-2xl">
                            <p className="text-sm font-bold uppercase tracking-wide text-[#3C78A8]">
                                Hôm nay học gì?
                            </p>
                            <h2 className="mt-2 text-3xl font-black leading-tight text-[#173B56] sm:text-4xl">
                                {primaryAction.title}
                            </h2>
                            <p className="mt-3 text-sm font-semibold leading-relaxed text-[#3C78A8] sm:text-base">
                                {primaryAction.reason}. Fuxie đề xuất quest này để bạn thấy ngay việc cần làm, phần thưởng, và bước mở khóa tiếp theo.
                            </p>
                        </div>

                        <div className="mt-5 rounded-2xl bg-white/70 p-3 shadow-sm ring-1 ring-white/90 backdrop-blur">
                            <RewardPreview rewards={rewards} />
                        </div>

                        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                            <MeasuredLink
                                href={primaryAction.href}
                                flow="dashboard.today_plan.primary"
                                source={primaryAction.id}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#54A8E4] px-5 py-3 text-sm font-black text-white shadow-lg shadow-sky-700/20 transition hover:-translate-y-0.5 hover:bg-[#3C93D1]"
                            >
                                Học tiếp
                                <ArrowRight className="h-4 w-4" />
                            </MeasuredLink>
                            <div className="flex items-center gap-2 text-sm font-semibold text-[#3C78A8]">
                                <span className="h-2 w-2 rounded-full bg-[#60A8E4]" />
                                {plan.currentMinutes}/{plan.goalMinutes} min hôm nay
                            </div>
                        </div>
                    </div>

                    <div className="flex min-w-0 flex-col gap-4">
                        <FuxieCoach
                            role="coach"
                            eyebrow="Next best action"
                            title={t('focusQuest')}
                            message={coachMessage}
                            className="bg-white"
                        />

                        <div className="rounded-2xl bg-white p-4 shadow-sm">
                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('todayGoal')}</p>
                                    <p className="mt-1 text-3xl font-black text-slate-950">{planProgress}%</p>
                                </div>
                                <div className="text-right text-sm font-semibold text-slate-500">
                                    <p>{plan.currentMinutes}/{plan.goalMinutes} min</p>
                                    <p>{plan.dueSrsCount} {t('srsToReview')}</p>
                                </div>
                            </div>
                                <div className="mt-3 h-3 overflow-hidden rounded-full bg-[#E4F0F0]">
                                    <div
                                    className="h-full rounded-full bg-gradient-to-r from-[#54A8E4] via-[#60A8E4] to-[#2EC4B6] transition-all duration-700"
                                    style={{ width: `${Math.max(planProgress, 5)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {secondaryActions.length > 0 && (
                    <div className="relative border-t border-white/70 bg-white/45 px-5 py-4 sm:px-6">
                        <div className="grid gap-3 sm:grid-cols-2">
                            {secondaryActions.map((action, index) => {
                                const meta = todayPlanActionMeta(action.type, index)
                                const Icon = meta.icon

                                return (
                                    <MeasuredLink
                                        key={action.id}
                                        href={action.href}
                                        flow="dashboard.today_plan.secondary"
                                        source={action.id}
                                        className="group flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                                    >
                                        <span className="flex min-w-0 items-center gap-3">
                                            <span
                                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                                                style={{ backgroundColor: meta.color }}
                                            >
                                                <Icon className="h-4 w-4" />
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block truncate text-sm font-black text-slate-900">{action.title}</span>
                                                <span className="block truncate text-xs font-semibold text-slate-500">{action.reason}</span>
                                            </span>
                                        </span>
                                        <span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700">
                                            {action.estimatedMinutes}m
                                        </span>
                                    </MeasuredLink>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        </section>
    )
}

function _TodayPlanSectionLegacy({ plan }: { plan: TodayPlan }) {
    const t = useTranslations('Dashboard')
    const topActions = plan.actions.slice(0, 3)

    if (topActions.length === 0) {
        return null
    }

    const primaryAction = topActions[0]!
    const secondaryActions = topActions.slice(1)
    const planProgress = plan.goalMinutes > 0
        ? Math.min(100, Math.round((plan.currentMinutes / plan.goalMinutes) * 100))
        : 0

    return (
        <section className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 animate-fade-in-up stagger-4">
            <div className="grid gap-0 lg:grid-cols-[1.4fr_0.8fr]">
                <div className="p-5 sm:p-6">
                    <div className="mb-5 flex items-start justify-between gap-4">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-wider text-[#3C78A8]">
                                Hôm nay học gì?
                            </p>
                            <h2 className="mt-1 text-2xl font-bold text-gray-950">
                                Kế hoạch {plan.remainingMinutes > 0 ? plan.remainingMinutes : plan.goalMinutes} phút
                            </h2>
                            <p className="mt-2 max-w-xl text-sm text-gray-500">
                                Fuxie chọn một việc quan trọng nhất để bạn học tiếp mà không phải tự dò từng module.
                            </p>
                        </div>
                        <Image src={FUXIE_3D_ASSETS.dailyMission} alt="Fuxie" width={48} height={48} className="hidden shrink-0 object-contain sm:block" />
                    </div>

                    <MeasuredLink
                        href={primaryAction.href}
                        flow="dashboard.today_plan.primary"
                        source={primaryAction.id}
                            className="group block rounded-2xl border border-[#CCE4F0] bg-gradient-to-br from-[#F3FBFF] to-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-sky-100"
                    >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                    {primaryAction.badge ?? primaryAction.skill}
                                </p>
                                <h3 className="mt-1 text-xl font-bold text-gray-950">
                                    {primaryAction.title}
                                </h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    Vì bạn đang ở {plan.currentLevel} · {primaryAction.reason}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm">
                                    {primaryAction.estimatedMinutes} min
                                </span>
                                <span className="rounded-xl bg-[#54A8E4] px-5 py-3 text-sm font-bold text-white shadow-sm transition group-hover:bg-[#3C93D1]">
                                    Học tiếp
                                </span>
                            </div>
                        </div>
                    </MeasuredLink>

                    {secondaryActions.length > 0 && (
                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            {secondaryActions.map((action, index) => (
                                <MeasuredLink
                                    key={action.id}
                                    href={action.href}
                                    flow="dashboard.today_plan.secondary"
                                    source={action.id}
                                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-4 py-3 text-sm transition hover:border-gray-200 hover:bg-gray-50"
                                >
                                    <span className="min-w-0 truncate font-semibold text-gray-800">
                                        {action.title}
                                    </span>
                                    <span
                                        className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold text-white"
                                        style={{ backgroundColor: todayPlanColor(action.type, index) }}
                                    >
                                        {action.estimatedMinutes}m
                                    </span>
                                </MeasuredLink>
                            ))}
                        </div>
                    )}
                </div>

                <div className="border-t border-gray-100 bg-gray-50/70 p-5 sm:p-6 lg:border-l lg:border-t-0">
                    <p className="text-sm font-semibold text-gray-900">{t('todayGoal')}</p>
                    <div className="mt-4">
                        <div className="flex items-end justify-between">
                            <span className="text-3xl font-black text-gray-950">{plan.currentMinutes}</span>
                            <span className="text-sm font-semibold text-gray-500">/ {plan.goalMinutes} phút</span>
                        </div>
                        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white">
                            <div
                                className="h-full rounded-full bg-[#10B981] transition-all duration-700"
                                style={{ width: `${Math.max(planProgress, 4)}%` }}
                            />
                        </div>
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-xl bg-white p-3">
                            <p className="font-bold text-gray-950">{plan.dueSrsCount}</p>
                            <p className="mt-1 text-xs text-gray-500">{t('srsToReview')}</p>
                        </div>
                        <div className="rounded-xl bg-white p-3">
                            <p className="font-bold text-gray-950">{plan.signals.pendingAssignments}</p>
                            <p className="mt-1 text-xs text-gray-500">{t('assignedLessons')}</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

function todayPlanColor(type: string, index: number) {
    if (type === 'srs') return '#2EC4B6'
    if (type === 'assignment') return '#FF8A3D'
    if (type === 'exam') return '#9C27B0'
    return ['#3C78A8', '#2EC4B6', '#54A8E4'][index] ?? '#3C78A8'
}

function todayPlanActionMeta(type: string, index: number): { icon: ComponentType<{ className?: string }>; color: string } {
    if (type === 'srs') return { icon: RotateCcw, color: '#2EC4B6' }
    if (type === 'assignment') return { icon: BookOpen, color: '#FF8A3D' }
    if (type === 'exam') return { icon: Target, color: '#7C3AED' }
    return [
        { icon: Brain, color: '#3C78A8' },
        { icon: Headphones, color: '#2EC4B6' },
        { icon: BookOpen, color: '#54A8E4' },
    ][index] ?? { icon: Brain, color: '#3C78A8' }
}
