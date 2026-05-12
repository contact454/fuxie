'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import {
    ArrowRight,
    BookOpenCheck,
    CheckCircle2,
    ClipboardCheck,
    Clock3,
    Flame,
    Gauge,
    Headphones,
    Home,
    Mic,
    PenLine,
    RotateCcw,
    Sparkles,
    Star,
    Target,
    Trophy,
} from 'lucide-react'

import {
    FUXIE_3D_ASSETS,
    FuxieCoach,
    RewardPreview,
    RewardRevealMoment,
    type RewardPreviewItem,
} from '@/components/gamification/quest-visuals'
import {
    FuxieBadge,
    FuxieProgressBar,
    fuxieButtonClass,
    fx,
} from '@/components/ui/fuxie-ui'

type ResultRewardLoopSkill = 'vocabulary' | 'listening' | 'reading' | 'writing' | 'speaking' | 'exam'
type ResultActionVariant = 'primary' | 'secondary' | 'ghost' | 'reward'

export interface ResultRewardLoopAction {
    label: string
    href?: string
    onClick?: () => void
    icon?: ReactNode
    variant?: ResultActionVariant
    ariaLabel?: string
}

export interface ResultRewardLoopMetric {
    label: string
    value: string
    detail?: string
    icon?: ReactNode
}

export interface ResultRewardLoopStreakReceipt {
    freezeUsed: boolean
    currentStreak: number
    freezesAvailable: number
    freezesUsed: number
}

interface ResultRewardLoopProps {
    skill: ResultRewardLoopSkill
    title: string
    message: string
    scoreLabel: string
    scoreDetail: string
    accuracy: number
    xpEarned: number
    graded?: boolean
    attemptMeta?: ResultRewardLoopMetric[]
    rewardPreview: RewardPreviewItem[]
    streakReceipt?: ResultRewardLoopStreakReceipt
    primaryAction: ResultRewardLoopAction
    secondaryAction: ResultRewardLoopAction
    dashboardAction?: ResultRewardLoopAction
    coachTitle?: string
    coachMessage?: string
    className?: string
}

const SKILL_CONFIG: Record<ResultRewardLoopSkill, {
    label: string
    icon: typeof BookOpenCheck
    accent: string
    surface: string
    mascot: string
}> = {
    vocabulary: {
        label: 'Vocabulary quest',
        icon: BookOpenCheck,
        accent: '#2EC4B6',
        surface: 'from-[#F3FBFF] via-white to-[#D8F0F0]',
        mascot: FUXIE_3D_ASSETS.happyWave,
    },
    listening: {
        label: 'Listening quest',
        icon: Headphones,
        accent: '#60A8E4',
        surface: 'from-[#F3FBFF] via-white to-[#CCE4F0]',
        mascot: FUXIE_3D_ASSETS.radioHost,
    },
    reading: {
        label: 'Reading quest',
        icon: Target,
        accent: '#3C78A8',
        surface: 'from-[#F3FBFF] via-white to-[#CCE4F0]',
        mascot: FUXIE_3D_ASSETS.librarian,
    },
    writing: {
        label: 'Writing quest',
        icon: PenLine,
        accent: '#2EC4B6',
        surface: 'from-[#F3FBFF] via-white to-[#EAFBF8]',
        mascot: FUXIE_3D_ASSETS.postOffice,
    },
    speaking: {
        label: 'Speaking quest',
        icon: Mic,
        accent: '#2EC4B6',
        surface: 'from-[#F3FBFF] via-white to-[#EAFBF8]',
        mascot: FUXIE_3D_ASSETS.speakingCoach,
    },
    exam: {
        label: 'Exam quest',
        icon: ClipboardCheck,
        accent: '#3C78A8',
        surface: 'from-[#F3FBFF] via-white to-[#CCE4F0]',
        mascot: FUXIE_3D_ASSETS.examGuide,
    },
}

function getResultBadge(accuracy: number, graded: boolean) {
    if (!graded) {
        return { tone: 'brand' as const, label: 'Đã lưu' }
    }

    if (accuracy >= 90) return { tone: 'reward' as const, label: 'Perfect run' }
    if (accuracy >= 70) return { tone: 'success' as const, label: 'Quest clear' }
    if (accuracy >= 50) return { tone: 'brand' as const, label: 'Đang tiến bộ' }
    return { tone: 'danger' as const, label: 'Cần luyện lại' }
}

function actionClass(action: ResultRewardLoopAction, fallbackVariant: ResultActionVariant) {
    return fuxieButtonClass(
        action.variant ?? fallbackVariant,
        'lg',
        'min-h-12 w-full whitespace-normal text-center sm:w-auto'
    )
}

function ResultAction({
    action,
    fallbackVariant,
    defaultIcon,
}: {
    action: ResultRewardLoopAction
    fallbackVariant: ResultActionVariant
    defaultIcon: ReactNode
}) {
    const content = (
        <>
            {action.icon ?? defaultIcon}
            <span>{action.label}</span>
        </>
    )

    if (action.href) {
        return (
            <Link href={action.href} className={actionClass(action, fallbackVariant)} aria-label={action.ariaLabel}>
                {content}
            </Link>
        )
    }

    return (
        <button
            type="button"
            onClick={action.onClick}
            className={actionClass(action, fallbackVariant)}
            aria-label={action.ariaLabel}
        >
            {content}
        </button>
    )
}

const REWARD_RECEIPT_MARKERS = [
    '+0',
    'already',
    'cap',
    'capped',
    'pending',
    'wait',
    'da nhan',
    'du fucoin',
    'duoc cap nhat',
    'cho',
    'dang cho',
    'da luu',
    'đã nhận',
    'đủ',
    'chờ',
    'đang chờ',
    'đã lưu',
]

function isFreshReward(reward: RewardPreviewItem) {
    const label = reward.label.trim()
    const haystack = `${reward.label} ${reward.detail}`.toLowerCase()

    if (REWARD_RECEIPT_MARKERS.some((marker) => haystack.includes(marker))) {
        return false
    }

    if (/^\+\s*[1-9]/.test(label)) {
        return true
    }

    return reward.type === 'badge' || reward.type === 'unlock' || reward.type === 'exam'
}

export function ResultRewardLoop({
    skill,
    title,
    message,
    scoreLabel,
    scoreDetail,
    accuracy,
    xpEarned,
    graded = true,
    attemptMeta = [],
    rewardPreview,
    streakReceipt,
    primaryAction,
    secondaryAction,
    dashboardAction,
    coachTitle = 'Fuxie đã mở nhiệm vụ tiếp theo',
    coachMessage = 'Xem nhanh phần thưởng, giữ nhịp học hôm nay và chọn hành động tiếp theo ngay khi động lực còn cao.',
    className = '',
}: ResultRewardLoopProps) {
    const config = SKILL_CONFIG[skill]
    const Icon = config.icon
    const safeAccuracy = Math.max(0, Math.min(100, accuracy))
    const badge = getResultBadge(safeAccuracy, graded)
    const progressTone = graded && safeAccuracy < 50 ? 'danger' : 'brand'
    const circleColor = graded && safeAccuracy < 50 ? '#EF4444' : config.accent
    const fucoinReward = rewardPreview.find((reward) => reward.type === 'fucoin')
    const revealMode = !graded
        ? 'pending'
        : rewardPreview.some(isFreshReward)
            ? 'earned'
            : 'receipt'
    const revealTitle = revealMode === 'earned'
        ? 'Quest reward reveal'
        : revealMode === 'pending'
            ? 'Reward pending'
            : 'Reward receipt'
    const revealDetail = revealMode === 'earned'
        ? 'XP, Fucoin va unlock duoc gom lai de em thay ro thanh qua vua dat duoc.'
        : revealMode === 'pending'
            ? 'Ket qua da luu; reward se cap nhat khi diem duoc dong bo.'
            : 'Luot hoc da duoc ghi nhan; reward moi co the da nhan truoc do hoac cham cap hom nay.'
    const stats = [
        {
            label: 'XP earned',
            value: graded ? `+${xpEarned} XP` : 'Đang chờ',
            detail: graded ? 'Phần thưởng lượt này' : 'Sẽ cộng khi chấm xong',
            icon: <Star className="h-4 w-4" />,
        },
        ...attemptMeta,
    ]

    return (
        <section
            className={fx(
                `relative overflow-hidden rounded-[28px] border border-white/80 bg-gradient-to-br ${config.surface} p-4 shadow-[0_24px_70px_rgba(60,120,168,0.14)] ring-1 ring-[#CCE4F0]/70 sm:p-5`,
                className
            )}
        >
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-stretch">
                <div className="min-w-0">
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        <span
                            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
                            style={{ backgroundColor: config.accent }}
                        >
                            <Icon className="h-5 w-5" />
                        </span>
                        <FuxieBadge tone={badge.tone}>{badge.label}</FuxieBadge>
                        <span className="rounded-full bg-white/75 px-3 py-1 text-xs font-black text-[#3C78A8] ring-1 ring-white/90">
                            {config.label}
                        </span>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-center">
                        <div
                            className="mx-auto flex h-36 w-36 shrink-0 items-center justify-center rounded-full p-2 shadow-inner"
                            style={{
                                background: graded
                                    ? `conic-gradient(${circleColor} ${safeAccuracy * 3.6}deg, rgba(204,228,240,0.78) 0deg)`
                                    : 'linear-gradient(135deg, #F3FBFF, #CCE4F0)',
                            }}
                        >
                            <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white text-center shadow-sm">
                                {graded ? (
                                    <span className="text-3xl font-black text-[#173B56]">{Math.round(safeAccuracy)}%</span>
                                ) : (
                                    <CheckCircle2 className="h-9 w-9 text-[#2EC4B6]" />
                                )}
                                <span className="mt-1 text-sm font-black text-slate-900">{scoreLabel}</span>
                                <span className="text-[11px] font-semibold text-slate-500">{scoreDetail}</span>
                            </div>
                        </div>

                        <div className="min-w-0">
                            <h2 className="text-2xl font-black text-[#173B56] sm:text-3xl">{title}</h2>
                            <p className="mt-2 text-sm font-semibold leading-relaxed text-[#3C78A8] sm:text-base">{message}</p>

                            <div className="mt-4">
                                <div className="mb-2 flex items-center justify-between gap-3 text-xs font-bold text-[#3C78A8]">
                                    <span>Tiến độ nhiệm vụ</span>
                                    <span>{graded ? `${Math.round(safeAccuracy)}%` : 'Đã lưu'}</span>
                                </div>
                                <FuxieProgressBar value={graded ? safeAccuracy : 100} tone={progressTone} />
                            </div>

                            <RewardRevealMoment
                                rewards={rewardPreview}
                                title={revealTitle}
                                detail={revealDetail}
                                mode={revealMode}
                                className="mt-4"
                            />

                            <div className="mt-4 grid gap-2 sm:grid-cols-3">
                                {stats.map((stat) => (
                                    <div key={`${stat.label}-${stat.value}`} className="flex min-w-0 items-center gap-3 rounded-2xl bg-white/75 px-3 py-2.5 ring-1 ring-white/90">
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EAFBF8] text-[#2EC4B6]">
                                            {stat.icon ?? <Sparkles className="h-4 w-4" />}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-sm font-black leading-tight text-slate-950">{stat.value}</p>
                                            <p className="text-[11px] font-semibold leading-tight text-slate-500">{stat.label}</p>
                                            {stat.detail ? (
                                                <p className="text-[11px] font-semibold leading-tight text-[#3C78A8]/80">{stat.detail}</p>
                                            ) : null}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-5">
                        <RewardPreview rewards={rewardPreview} layout="row" />
                    </div>

                    {streakReceipt ? (
                        <div className={fx(
                            'mt-4 rounded-2xl p-4 ring-1',
                            streakReceipt.freezeUsed
                                ? 'bg-[#FFF7D6] text-[#8A5A00] ring-[#FFD166]/55'
                                : 'bg-[#EAFBF8] text-[#148F7D] ring-[#2EC4B6]/25'
                        )}>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex min-w-0 items-start gap-3">
                                    <span className={fx(
                                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white',
                                        streakReceipt.freezeUsed ? 'bg-[#FFB703]' : 'bg-[#2EC4B6]'
                                    )}>
                                        <Flame className="h-5 w-5" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-black">
                                            {streakReceipt.freezeUsed ? 'Streak Freeze da cuu chuoi hoc' : 'Streak van an toan'}
                                        </p>
                                        <p className="mt-1 text-xs font-semibold leading-relaxed opacity-85">
                                            {streakReceipt.freezeUsed
                                                ? `He thong da dung 1 Freeze de giu streak ${streakReceipt.currentStreak} ngay. Con ${streakReceipt.freezesAvailable} Freeze.`
                                                : `Streak hien tai ${streakReceipt.currentStreak} ngay. Con ${streakReceipt.freezesAvailable} Freeze du phong.`}
                                        </p>
                                    </div>
                                </div>
                                <span className="shrink-0 rounded-full bg-white/70 px-3 py-1 text-xs font-black ring-1 ring-white/80">
                                    {streakReceipt.freezesUsed} used
                                </span>
                            </div>
                        </div>
                    ) : null}

                    <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                        <ResultAction action={primaryAction} fallbackVariant="primary" defaultIcon={<ArrowRight className="h-4 w-4" />} />
                        <ResultAction action={secondaryAction} fallbackVariant="ghost" defaultIcon={<RotateCcw className="h-4 w-4" />} />
                        {dashboardAction ? (
                            <ResultAction action={dashboardAction} fallbackVariant="secondary" defaultIcon={<Home className="h-4 w-4" />} />
                        ) : null}
                    </div>
                </div>

                <div className="flex min-w-0 flex-col justify-between gap-3">
                    <FuxieCoach
                        role={graded && safeAccuracy >= 70 ? 'reward' : 'feedback'}
                        eyebrow="Next quest"
                        title={coachTitle}
                        message={coachMessage}
                        mascotSrc={
                            graded && safeAccuracy >= 70
                                ? FUXIE_3D_ASSETS.celebration
                                : config.mascot
                        }
                        className="h-full"
                    />
                    <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-2xl bg-white/75 p-3 ring-1 ring-white/90">
                            <div className="flex items-center gap-2 text-[#3C78A8]">
                                <Gauge className="h-4 w-4" />
                                <span className="text-xs font-black">Focus</span>
                            </div>
                            <p className="mt-1 text-sm font-black text-slate-950">
                                {graded && safeAccuracy < 70 ? 'Luyện lại điểm yếu' : 'Tăng nhịp học'}
                            </p>
                        </div>
                        <div className="rounded-2xl bg-white/75 p-3 ring-1 ring-white/90">
                            <div className="flex items-center gap-2 text-[#C67A00]">
                                <Trophy className="h-4 w-4" />
                                <span className="text-xs font-black">Reward</span>
                            </div>
                            <p className="mt-1 text-sm font-black text-slate-950">
                                {graded
                                    ? fucoinReward
                                        ? `+${xpEarned} XP / ${fucoinReward.label}`
                                        : `+${xpEarned} XP`
                                    : 'Chờ đồng bộ'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export const resultRewardIcons = {
    Clock3,
    Flame,
    Headphones,
    Star,
    Target,
    Trophy,
}
