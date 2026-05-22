'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, type ReactNode } from 'react'
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
    dataRewardStateForPhase,
    type ResultRewardLoopPhase,
} from '@/components/gamification/result-reward-loop-fsm'
import { useResultRewardLoop } from '@/components/gamification/use-result-reward-loop'
import {
    FuxieBadge,
    FuxieProgressBar,
    fuxieButtonClass,
    fx,
} from '@/components/ui/fuxie-ui'
import { PrimaryCta } from '@/components/ui/primary-cta'
import { FUXIE_UI_FRAMES } from '@/lib/mascot/fuxie-assets'

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
    /**
     * Optional FSM driver per design §D / task 6.2. When provided, the
     * loop runs the saving → earned → receipt state machine, auto-advancing
     * after `earnedDurationMs` ms. Errors transition into a retry-capped
     * `error` phase with a "Thử lại" CTA, and after `MAX_RETRY_ATTEMPTS`
     * (= 3) failures the loop transitions to a terminal `blocked` phase
     * that downgrades the Primary_CTA to a "Về Dashboard" secondary path.
     *
     * If omitted, the component renders in legacy presentational mode
     * (existing behavior) — current call sites (`exercise-results.tsx`,
     * `lesson-player.tsx`) keep working without modification.
     *
     * Validates: Requirements 7.1, 7.2, 7.5, 7.6, 7.7
     */
    fsm?: ResultRewardLoopFSMOptions
}

/**
 * Options that switch the loop into FSM-driven mode (design §D).
 *
 * The component owns the timer and retry counter via `useResultRewardLoop`,
 * but exposes the current phase to the parent through `onPhaseChange` so
 * upstream surfaces (skill players, exam) can react (e.g. unmount the loop
 * once `receipt` is acknowledged).
 */
export interface ResultRewardLoopFSMOptions {
    /** Async save action. Resolved → `earned`, rejected → `error`. */
    onSave: () => Promise<void>
    /** Earned-phase duration in ms — clamped to [1200, 2000]. Default 1500. */
    earnedDurationMs?: number
    /** Honour `prefers-reduced-motion: reduce` (Requirement 7.5). */
    reducedMotion?: boolean
    /** Notified after every FSM phase transition. */
    onPhaseChange?: (phase: ResultRewardLoopPhase) => void
    /**
     * Copy and CTA labels for the error / blocked phases. The retry CTA
     * uses `errorAction.label` (default: "Thử lại"); when blocked, the
     * `blockedAction` is used instead (default label: "Về Dashboard").
     */
    errorAction?: ResultRewardLoopAction
    blockedAction?: ResultRewardLoopAction
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
        mascot: FUXIE_3D_ASSETS.questPlanner,
    },
    listening: {
        label: 'Listening quest',
        icon: Headphones,
        accent: '#60A8E4',
        surface: 'from-[#F3FBFF] via-white to-[#CCE4F0]',
        mascot: FUXIE_3D_ASSETS.listeningFocus,
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
        mascot: FUXIE_3D_ASSETS.writingDelivery,
    },
    speaking: {
        label: 'Speaking quest',
        icon: Mic,
        accent: '#2EC4B6',
        surface: 'from-[#F3FBFF] via-white to-[#EAFBF8]',
        mascot: FUXIE_3D_ASSETS.speakingRecord,
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
        return { tone: 'brand' as const, label: 'Đã phong ấn' }
    }

    if (accuracy >= 90) return { tone: 'reward' as const, label: 'Bá chủ chiến địa 🔥' }
    if (accuracy >= 70) return { tone: 'success' as const, label: 'Đạp đổ chướng ngại!' }
    if (accuracy >= 50) return { tone: 'brand' as const, label: 'Lửa đang bén' }
    return { tone: 'danger' as const, label: 'Củng cố kiến thức' }
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

    const resolvedVariant = action.variant ?? fallbackVariant

    // Primary_CTA path delegates to the design-system <PrimaryCta>
    // primitive so the receipt phase (and any other primary action) emits
    // `data-role="primary-cta"`. This restores the single-Primary_CTA
    // invariant (Property 8 / Req 7.4 / Req 11.5) while keeping the
    // visual contract intact: <PrimaryCta variant="primary"> uses the
    // same Bright Sky `--fuxie-action` token family that
    // `fuxieButtonClass('primary')` paints with.
    if (resolvedVariant === 'primary') {
        const sharedClassName = 'min-h-12 w-full whitespace-normal text-center sm:w-auto'

        if (action.href) {
            return (
                <PrimaryCta
                    variant="primary"
                    asChild
                    className={sharedClassName}
                    aria-label={action.ariaLabel}
                >
                    <Link href={action.href}>{content}</Link>
                </PrimaryCta>
            )
        }

        return (
            <PrimaryCta
                variant="primary"
                onClick={action.onClick}
                className={sharedClassName}
                aria-label={action.ariaLabel}
            >
                {content}
            </PrimaryCta>
        )
    }

    // Secondary / ghost / reward stay on the legacy button path. These
    // intentionally do NOT carry `data-role="primary-cta"` so the
    // single-Primary_CTA invariant is preserved.
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

export function ResultRewardLoop(props: ResultRewardLoopProps) {
    if (props.fsm) {
        return <ResultRewardLoopFSM {...props} fsm={props.fsm} />
    }
    return <ResultRewardLoopLegacy {...props} />
}

/**
 * FSM-driven wrapper (design §D / task 6.2).
 *
 * Layers the Result_Reward_Loop FSM on top of the legacy presentational
 * component:
 *
 *   - while `phase === 'saving'` we render a save-pending shell that does
 *     NOT set `data-reward-state` (Requirement 7.6 — error/loading must
 *     not expose reward amber);
 *   - while `phase === 'earned'` we render the legacy component with
 *     `data-reward-state="earned"` so the reveal animation may run inside
 *     the reward-amber containment subtree;
 *   - while `phase === 'receipt'` we render the legacy component with
 *     `data-reward-state="receipt"` and the parent-supplied `primaryAction`;
 *   - while `phase === 'error'` we replace the Primary_CTA with the
 *     retry action and surface the remaining attempts;
 *   - while `phase === 'blocked'` we replace the Primary_CTA with the
 *     `blockedAction` (default: "Về Dashboard") and show the connection
 *     hint message.
 *
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7
 */
function ResultRewardLoopFSM(
    props: ResultRewardLoopProps & { fsm: ResultRewardLoopFSMOptions },
) {
    const { fsm: fsmOptions, primaryAction, secondaryAction, dashboardAction } = props

    const { state, phase, remainingRetries, retry } = useResultRewardLoop({
        onSave: fsmOptions.onSave,
        earnedDurationMs: fsmOptions.earnedDurationMs,
        reducedMotion: fsmOptions.reducedMotion,
    })

    // Forward phase changes to the surface owner.
    const lastPhaseRef = useRef<ResultRewardLoopPhase | null>(null)
    useEffect(() => {
        if (lastPhaseRef.current === phase) return
        lastPhaseRef.current = phase
        fsmOptions.onPhaseChange?.(phase)
    }, [phase, fsmOptions])

    const dataRewardState = dataRewardStateForPhase(phase)

    // While saving we render a minimal shell so the loop does not flash
    // the legacy hero. The component still mounts in the DOM (with
    // `data-loop-phase="saving"`) so callers can attach analytics.
    if (phase === 'saving') {
        return (
            <section
                data-loop-phase="saving"
                data-result-reward-loop="true"
                aria-live="polite"
                className={fx(
                    'relative overflow-hidden rounded-[28px] border border-white/80 bg-white p-6 text-center shadow-sm ring-1 ring-[#CCE4F0]/70',
                    props.className,
                )}
            >
                <p className="text-sm font-bold text-[#3C78A8]">Đang lưu kết quả…</p>
            </section>
        )
    }

    // Error / blocked share the same skeleton — only the CTA differs.
    if (phase === 'error' || phase === 'blocked') {
        const isBlocked = phase === 'blocked'
        const blockedAction: ResultRewardLoopAction = fsmOptions.blockedAction ?? {
            ...(dashboardAction ?? secondaryAction),
            label: dashboardAction?.label ?? 'Về Dashboard',
            variant: 'secondary',
        }
        const retryAction: ResultRewardLoopAction = fsmOptions.errorAction ?? {
            label: 'Thử lại',
            onClick: retry,
            icon: <RotateCcw className="h-4 w-4" />,
            variant: 'primary',
        }
        const errorAction: ResultRewardLoopAction = isBlocked
            ? blockedAction
            : { ...retryAction, onClick: retryAction.onClick ?? retry }

        return (
            <section
                data-loop-phase={phase}
                data-result-reward-loop="true"
                aria-live="assertive"
                className={fx(
                    'relative overflow-hidden rounded-[28px] border border-[#F4D8D8] bg-white p-6 shadow-sm ring-1 ring-[#F4D8D8]/70',
                    props.className,
                )}
            >
                <h2 className="text-lg font-black text-[#173B56]">
                    {isBlocked
                        ? 'Chưa lưu được kết quả'
                        : 'Lưu kết quả gặp trục trặc'}
                </h2>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-[#3C78A8]">
                    {isBlocked
                        ? 'Vui lòng kiểm tra kết nối và thử lại sau. Tiến độ buổi học vẫn được giữ nguyên.'
                        : `Kết quả chưa được lưu. ${remainingRetries > 0 ? `Còn ${remainingRetries} lượt thử lại.` : ''}`}
                </p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <ResultAction
                        action={errorAction}
                        fallbackVariant={isBlocked ? 'secondary' : 'primary'}
                        defaultIcon={
                            isBlocked ? (
                                <Home className="h-4 w-4" />
                            ) : (
                                <RotateCcw className="h-4 w-4" />
                            )
                        }
                    />
                </div>
            </section>
        )
    }

    // Earned + receipt both use the legacy renderer underneath. The
    // `data-reward-state` attribute is set on the wrapping container so
    // the reward-amber containment rule (Req 6.9 / Req 16) is satisfied.
    return (
        <div
            data-loop-phase={phase}
            data-result-reward-loop="true"
            data-reward-state={dataRewardState ?? undefined}
            data-reduced-motion={state.reducedMotion ? 'true' : undefined}
        >
            {/* Earned phase: legacy hero is reused for visual continuity. The
                container above carries the `data-reward-state="earned"` so
                the reveal animation may use `--fuxie-reward`. */}
            <ResultRewardLoopLegacy
                {...props}
                primaryAction={
                    phase === 'receipt'
                        ? primaryAction
                        : { ...primaryAction, onClick: undefined, href: undefined }
                }
            />
        </div>
    )
}

function ResultRewardLoopLegacy({
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
    coachTitle = 'Thao trường tiếp theo đã sẵn sàng',
    coachMessage = 'Ngọn lửa trong em đã cháy thêm một ngày — đó mới là điều thiêng liêng nhất. Thu thập chiến lợi phẩm và vung kiếm bước vào chiến dịch tiếp theo khi nhiệt huyết còn đang sục sôi.',
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
        ? 'Chiến Lợi Phẩm'
        : revealMode === 'pending'
            ? 'Phong Ấn Chờ Mở'
            : 'Biên Bản Khế Ước'
    const revealDetail = revealMode === 'earned'
        ? 'XP, Fucoin và vô số đặc quyền đã bị khuất phục — đây là chiến lợi phẩm vinh quang của em!'
        : revealMode === 'pending'
            ? 'Năng lượng đang hội tụ — phần thưởng sẽ bùng nổ ngay khi Fuxie phán xét xong.'
            : 'Mồ hôi đã rơi, dấu ấn đã khắc — phần thưởng có thể đang âm thầm chảy vào kho chứa.'
    const stats = [
        {
            label: 'XP earned',
            value: graded ? `+${xpEarned} XP` : 'Đang tụ khí',
            detail: graded ? 'Kinh nghiệm hấp thụ' : 'Đợi phán quyết cuối',
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
            <Image
                src={FUXIE_UI_FRAMES.resultRevealFrame}
                alt=""
                width={180}
                height={180}
                aria-hidden="true"
                className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 object-contain opacity-[0.12]"
            />
            <Image
                src={FUXIE_UI_FRAMES.letterReceiptFrame}
                alt=""
                width={148}
                height={148}
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-12 left-2 hidden h-32 w-32 object-contain opacity-[0.10] sm:block"
            />
            <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-stretch">
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
                            className="relative mx-auto flex h-36 w-36 shrink-0 items-center justify-center rounded-full p-2 shadow-inner"
                            style={{
                                background: graded
                                    ? `conic-gradient(${circleColor} ${safeAccuracy * 3.6}deg, rgba(204,228,240,0.78) 0deg)`
                                    : 'linear-gradient(135deg, #F3FBFF, #CCE4F0)',
                            }}
                        >
                            <Image
                                src={FUXIE_UI_FRAMES.letterReceiptFrame}
                                alt=""
                                width={128}
                                height={128}
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-1 h-[calc(100%-0.5rem)] w-[calc(100%-0.5rem)] object-contain opacity-[0.10]"
                            />
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
                                            {streakReceipt.freezeUsed ? 'Khiên bảo vệ đã phát huy tác dụng' : 'Ngọn lửa học tập vẫn rực cháy'}
                                        </p>
                                        <p className="mt-1 text-xs font-semibold leading-relaxed opacity-85">
                                            {streakReceipt.freezeUsed
                                                ? `Hệ thống đã đốt 1 Khiên để giữ mạng cho chuỗi ${streakReceipt.currentStreak} ngày. Còn ${streakReceipt.freezesAvailable} Khiên dự phòng.`
                                                : `Chuỗi học hiện tại đạt ${streakReceipt.currentStreak} ngày. Kho vũ khí đang có ${streakReceipt.freezesAvailable} Khiên bảo hộ.`}
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
                                ? FUXIE_3D_ASSETS.resultCelebration
                                : FUXIE_3D_ASSETS.gentleCorrection
                        }
                        className="h-full"
                    />
                    <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-2xl bg-white/75 p-3 ring-1 ring-white/90">
                            <div className="flex items-center gap-2 text-[#3C78A8]">
                                <Gauge className="h-4 w-4" />
                                <span className="text-xs font-black">Chỉ Đạo Tiếp Theo</span>
                            </div>
                            <p className="mt-1 text-sm font-black text-slate-950">
                                {graded && safeAccuracy < 70 ? 'Luyện lại một vòng' : 'Tiếp đà hành trình'}
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
