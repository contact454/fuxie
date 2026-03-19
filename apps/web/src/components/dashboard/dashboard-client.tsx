'use client'

import Link from 'next/link'
import Image from 'next/image'

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
}

// ===== CONSTANTS =====

const CEFR_COLORS: Record<string, string> = {
    A1: 'var(--color-cefr-a1)', A2: 'var(--color-cefr-a2)',
    B1: 'var(--color-cefr-b1)', B2: 'var(--color-cefr-b2)',
    C1: 'var(--color-cefr-c1)', C2: 'var(--color-cefr-c2)',
}

const CEFR_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const

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
    const currentIdx = CEFR_ORDER.indexOf(data.profile.currentLevel as typeof CEFR_ORDER[number])
    const targetIdx = CEFR_ORDER.indexOf(data.profile.targetLevel as typeof CEFR_ORDER[number])
    const cefrProgress = targetIdx > 0 ? Math.round((currentIdx / targetIdx) * 100) : 0

    const studyGoalPercent = data.profile?.studyGoalMinutes > 0
        ? Math.min(100, Math.round(((data.todayActivity?.totalMinutes ?? 0) / data.profile.studyGoalMinutes) * 100))
        : 0

    const maxWeeklyXp = Math.max(...(data.weeklyActivity ?? []).map((d) => d.xp), 1)

    // If no section specified, render everything (backward compat)
    if (!section) {
        return (
            <div className="min-h-screen p-4 sm:p-6 lg:p-8">
                <HeaderSection data={data} />
                <StatsSection data={data} studyGoalPercent={studyGoalPercent} />
                <ContentSection data={data} cefrProgress={cefrProgress} maxWeeklyXp={maxWeeklyXp} currentIdx={currentIdx} />
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
    return (
        <header className="mb-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                        {data.greeting}, {data.profile.displayName}!
                        <Image src="/mascot/core/fuxie-core-happy-wave.png" alt="Fuxie" width={36} height={36} className="inline-block object-contain" />
                    </h1>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                        <span
                            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
                            style={{ backgroundColor: CEFR_COLORS[data.profile.currentLevel] }}
                        >
                            {data.profile.currentLevel}
                        </span>
                        <span>·</span>
                        <span className="font-medium text-gray-700">
                            Lv.{data.profile.fuxieLevel} {data.profile.fuxieTitle}
                        </span>
                        {data.profile.targetExam && (
                            <>
                                <span>·</span>
                                <span>Ziel: {data.profile.targetExam} {data.profile.targetLevel}</span>
                            </>
                        )}
                    </div>
                </div>
                {data.profile.examDaysLeft !== null && (
                    <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-fuxie-primary/10 to-fuxie-secondary/10 px-4 py-2.5 text-sm">
                        <span className="text-lg">🎯</span>
                        <div>
                            <p className="font-semibold text-gray-900">
                                {data.profile.examDaysLeft} Tage
                            </p>
                            <p className="text-xs text-gray-500">bis zur Prüfung</p>
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
                label="Streak"
                value={data.streak?.currentStreak ?? 0}
                icon="🔥"
                suffix="Tage"
                detail={`Rekord: ${data.streak?.longestStreak ?? 0}`}
                gradient="from-orange-500/10 to-red-500/5"
                color="#FF6B35"
                pulse={(data.streak?.currentStreak ?? 0) > 0}
                index={0}
            />
            <StatCard
                label="XP Heute"
                value={data.todayActivity?.xpEarned ?? 0}
                icon="⭐"
                detail={`Gesamt: ${data.profile.totalXp.toLocaleString()}`}
                gradient="from-blue-500/10 to-indigo-500/5"
                color="#004E89"
                index={1}
            />
            <StatCard
                label="SRS fällig"
                value={data.srs?.dueCount ?? 0}
                icon="📚"
                detail={`${data.srs?.totalCards ?? 0} Karten · ${data.srs?.reviewedToday ?? 0} heute`}
                gradient="from-teal-500/10 to-emerald-500/5"
                color="#2EC4B6"
                urgent={(data.srs?.dueCount ?? 0) > 20}
                index={2}
            />
            <StatCard
                label="Lernzeit"
                value={data.todayActivity?.totalMinutes ?? 0}
                icon="⏱️"
                suffix="min"
                detail={`Ziel: ${data.profile.studyGoalMinutes} min (${studyGoalPercent}%)`}
                gradient="from-purple-500/10 to-pink-500/5"
                color="#9C27B0"
                index={3}
                goalPercent={studyGoalPercent}
            />
        </div>
    )
}

function ContentSection({ data, cefrProgress, maxWeeklyXp, currentIdx }: { data: DashboardData; cefrProgress: number; maxWeeklyXp: number; currentIdx: number }) {
    return (
        <>
            {/* ===== CEFR PROGRESS + WEEKLY CHART ===== */}
            <div className="mb-6 grid gap-4 lg:grid-cols-5">
                {/* CEFR Roadmap */}
                <div className="lg:col-span-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 animate-fade-in-up stagger-4">
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
                        CEFR Fortschritt
                    </h2>
                    <div className="flex items-center gap-1 sm:gap-2">
                        {CEFR_ORDER.map((level, idx) => {
                            const isActive = level === data.profile.currentLevel
                            const isPast = idx < currentIdx
                            const isTarget = level === data.profile.targetLevel
                            const color = CEFR_COLORS[level] ?? '#9E9E9E'

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
                                        <span className="text-[10px] font-semibold text-fuxie-primary">🎯 Ziel</span>
                                    )}
                                    {isActive && !isTarget && (
                                        <span className="text-[10px] font-semibold" style={{ color }}>Jetzt</span>
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
                                    background: `linear-gradient(90deg, ${CEFR_COLORS[data.profile.currentLevel]}, ${CEFR_COLORS[data.profile.targetLevel]})`,
                                }}
                            />
                        </div>
                    </div>

                    {/* Mini stats row */}
                    <div className="mt-4 grid grid-cols-4 gap-3">
                        <MiniStat value={data.profile.totalWordsLearned} label="Wörter" icon="📝" />
                        <MiniStat value={data.profile.totalLessonsCompleted} label="Lektionen" icon="📖" />
                        <MiniStat
                            value={`${Math.floor(data.profile.totalStudyMinutes / 60)}h`}
                            label="Lernzeit"
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
                        Wochenaktivität
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
                                                backgroundColor: isToday ? '#FF6B35' : '#e0e7ff',
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
                        <span>Diese Woche</span>
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
                        Schnellstart
                    </h2>
                    <div className="space-y-2">
                        <QuickAction
                            href="/review"
                            icon="🔄"
                            label="SRS Wiederholen"
                            sublabel={(data.srs?.dueCount ?? 0) > 0 ? `${data.srs.dueCount} Karten fällig` : 'Keine Karten fällig'}
                            color="#2EC4B6"
                            badge={(data.srs?.dueCount ?? 0) > 0 ? data.srs.dueCount : undefined}
                        />
                        <QuickAction
                            href="/listening"
                            icon="🎧"
                            label="Hörverstehen"
                            sublabel={(data.listening?.completedLessons ?? 0) > 0
                                ? `${data.listening.completedLessons}/${data.listening.totalLessons} Lektionen`
                                : `${data.listening?.totalLessons ?? 0} Lektionen verfügbar`
                            }
                            color="#2EC4B6"
                            badge={(data.listening?.totalLessons ?? 0) - (data.listening?.completedLessons ?? 0) > 0
                                ? data.listening.totalLessons - data.listening.completedLessons
                                : undefined}
                        />
                        <QuickAction
                            href="/vocabulary"
                            icon="📚"
                            label="Neue Wörter"
                            sublabel="Wortschatz erweitern"
                            color="#FF6B35"
                        />
                        <QuickAction
                            href="/grammar"
                            icon="📝"
                            label="Grammatik"
                            sublabel={(data.grammar?.completedLessons ?? 0) > 0
                                ? `${data.grammar.completedLessons}/${data.grammar.totalLessons} Lektionen · ${data.grammar.totalStars} ⭐`
                                : `${data.grammar?.totalTopics ?? 0} Themen verfügbar`
                            }
                            color="#004E89"
                            badge={(data.grammar?.totalLessons ?? 0) - (data.grammar?.completedLessons ?? 0) > 0
                                ? data.grammar.totalLessons - data.grammar.completedLessons
                                : undefined}
                        />
                        <QuickAction
                            href="/exam"
                            icon="🎯"
                            label="Prüfung üben"
                            sublabel={data.profile.targetExam
                                ? `${data.profile.targetExam} ${data.profile.targetLevel}`
                                : 'Mock exam starten'
                            }
                            color="#9C27B0"
                        />
                    </div>
                </div>

                {/* Achievements */}
                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 animate-fade-in-up stagger-6">
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
                        Erfolge
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
                                            {new Date(a.earnedAt).toLocaleDateString('de-DE', {
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
                            <Image src="/mascot/core/fuxie-core-happy-wave.png" alt="Fuxie" width={48} height={48} className="mb-2 object-contain" />
                            <p className="text-sm text-gray-500">Noch keine Erfolge</p>
                            <p className="text-xs text-gray-400 mt-1">Lerne weiter, um Erfolge zu verdienen!</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

// ===== SUB-COMPONENTS =====

function StatCard({
    label,
    value,
    icon,
    suffix,
    detail,
    gradient,
    color,
    pulse,
    urgent,
    index,
    goalPercent,
}: {
    label: string
    value: number
    icon: string
    suffix?: string
    detail: string
    gradient: string
    color: string
    pulse?: boolean
    urgent?: boolean
    index: number
    goalPercent?: number
}) {
    return (
        <div
            className={`card-hover group relative overflow-hidden rounded-2xl bg-white p-4 sm:p-5 shadow-sm ring-1 ring-gray-100 animate-fade-in-up stagger-${index + 1}`}
        >
            {/* Background decoration */}
            <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br ${gradient} opacity-60 transition-transform group-hover:scale-125`} />

            {/* Label */}
            <p className="text-xs sm:text-sm font-medium text-gray-400 relative z-10">{label}</p>

            {/* Value */}
            <div className="mt-1 flex items-baseline gap-1 relative z-10">
                <span
                    className="text-3xl sm:text-4xl font-bold animate-count-up"
                    style={{ color }}
                >
                    {value}
                </span>
                {suffix && (
                    <span className="text-sm font-normal text-gray-400">{suffix}</span>
                )}
                <span className={`ml-1 text-xl sm:text-2xl ${pulse ? 'animate-pulse-fire' : ''}`}>
                    {icon}
                </span>
            </div>

            {/* Detail */}
            <p className="mt-1 text-[10px] sm:text-xs text-gray-400 relative z-10">{detail}</p>

            {/* Goal progress bar (for study time card) */}
            {goalPercent !== undefined && (
                <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100 relative z-10">
                    <div
                        className="h-1.5 rounded-full transition-all duration-700"
                        style={{
                            width: `${goalPercent}%`,
                            backgroundColor: goalPercent >= 100 ? '#4CAF50' : color,
                        }}
                    />
                </div>
            )}

            {/* Urgent badge */}
            {urgent && (
                <div className="absolute top-2 right-2 flex h-2 w-2 z-10">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </div>
            )}
        </div>
    )
}

function MiniStat({ value, label, icon }: { value: number | string; label: string; icon: string }) {
    return (
        <div className="rounded-xl bg-gray-50 p-2.5 text-center transition-colors hover:bg-gray-100">
            <p className="text-lg sm:text-xl font-bold text-gray-800">
                <span className="mr-0.5 text-sm">{icon}</span> {value}
            </p>
            <p className="text-[10px] text-gray-400">{label}</p>
        </div>
    )
}

function QuickAction({
    href,
    icon,
    label,
    sublabel,
    color,
    badge,
}: {
    href: string
    icon: string
    label: string
    sublabel: string
    color: string
    badge?: number
}) {
    return (
        <Link
            href={href}
            className="card-hover group relative flex items-center gap-3 rounded-xl p-3 transition-all"
            style={{
                background: `linear-gradient(135deg, ${color}08, ${color}04)`,
            }}
        >
            <span
                className="flex h-9 w-9 items-center justify-center rounded-lg text-base text-white transition-transform group-hover:scale-110"
                style={{ backgroundColor: color }}
            >
                {icon}
            </span>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{label}</p>
                <p className="text-[10px] text-gray-400">{sublabel}</p>
            </div>
            {badge !== undefined && badge > 0 && (
                <span
                    className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white"
                    style={{ backgroundColor: color }}
                >
                    {badge}
                </span>
            )}
            <svg
                className="h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
        </Link>
    )
}
