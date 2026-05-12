'use client'

import Image from 'next/image'
import type { ComponentType, ReactNode } from 'react'
import {
    Award,
    BadgeCheck,
    BookOpen,
    ClipboardCheck,
    Coins,
    Flame,
    Headphones,
    LockKeyhole,
    PenLine,
    RotateCcw,
    Sparkles,
    Star,
    Trophy,
    Zap,
} from 'lucide-react'

import { REWARD_ASSETS } from '@/components/gamification/reward-assets'
import { FuxieRewardList, type FuxieRewardListItem } from '@/components/ui/fuxie-ui'

type IconComponent = ComponentType<{ className?: string }>

export type FuxieCoachRole = 'coach' | 'feedback' | 'reward' | 'locked'

export const FUXIE_3D_ASSETS = {
    happyWave: '/mascot-3d/optimized/fuxie-3d-core-happy-wave-512.webp',
    dailyMission: '/mascot-3d/optimized/fuxie-3d-core-daily-mission-512.webp',
    fucoinReward: '/mascot-3d/optimized/fuxie-3d-game-fucoin-reward-512.webp',
    streakFreezeSaved: '/mascot-3d/optimized/fuxie-3d-game-streak-freeze-saved-512.webp',
    shopkeeper: '/mascot-3d/optimized/fuxie-3d-role-shopkeeper-512.webp',
    librarian: '/mascot-3d/optimized/fuxie-3d-role-librarian-512.webp',
    radioHost: '/mascot-3d/optimized/fuxie-3d-role-radio-host-512.webp',
    postOffice: '/mascot-3d/optimized/fuxie-3d-role-post-office-512.webp',
    examGuide: '/mascot-3d/optimized/fuxie-3d-role-exam-guide-512.webp',
    speakingCoach: '/mascot-3d/optimized/fuxie-3d-role-speaking-coach-512.webp',
    celebration: '/mascot-3d/optimized/fuxie-3d-core-celebration-512.webp',
} as const

export const FUXIE_LIVING_3D_ASSETS = {
    model: '/mascot-3d/live/fuxie-living-prototype.glb',
    poster: '/mascot-3d/live/fuxie-living-prototype-poster.png',
    frames: [
        '/mascot-3d/live/fuxie-living-prototype-frame-1.webp',
        '/mascot-3d/live/fuxie-living-prototype-frame-2.webp',
        '/mascot-3d/live/fuxie-living-prototype-frame-3.webp',
        '/mascot-3d/live/fuxie-living-prototype-frame-4.webp',
    ],
} as const

export type FuxieMascotMotion = 'none' | 'idle' | 'coach' | 'reward' | 'speak'

const FUXIE_MASCOT_MOTION_CLASS: Record<FuxieMascotMotion, string> = {
    none: '',
    idle: 'fuxie-mascot-motion-idle',
    coach: 'fuxie-mascot-motion-coach',
    reward: 'fuxie-mascot-motion-reward',
    speak: 'fuxie-mascot-motion-speak',
}

export function fuxieMascotMotionClass(motion: FuxieMascotMotion = 'idle') {
    return FUXIE_MASCOT_MOTION_CLASS[motion]
}

interface FuxieRoleMascotProps {
    src: string
    alt?: string
    size?: number
    motion?: FuxieMascotMotion
    priority?: boolean
    className?: string
    imageClassName?: string
}

export function FuxieRoleMascot({
    src,
    alt = 'Fuxie',
    size = 80,
    motion = 'idle',
    priority = false,
    className = '',
    imageClassName = '',
}: FuxieRoleMascotProps) {
    return (
        <span
            className={`inline-flex shrink-0 items-center justify-center ${className}`}
            style={{ width: size, height: size }}
        >
            <Image
                src={src}
                alt={alt}
                width={size}
                height={size}
                priority={priority}
                className={`h-full w-full object-contain ${fuxieMascotMotionClass(motion)} ${imageClassName}`}
            />
        </span>
    )
}

interface FuxieMascot3DProps {
    src?: string
    alt?: string
    size?: number
    live?: boolean
    mode?: 'asset' | 'prototype'
    priority?: boolean
    className?: string
    imageClassName?: string
}

export function FuxieMascot3D({
    src = FUXIE_3D_ASSETS.happyWave,
    alt = 'Fuxie animated 3D mascot',
    size = 112,
    live = true,
    mode = 'asset',
    priority = false,
    className = '',
    imageClassName = '',
}: FuxieMascot3DProps) {
    if (mode === 'asset') {
        return (
            <span
                className={`fuxie-live-asset relative inline-flex shrink-0 items-center justify-center overflow-visible ${className}`}
                style={{ width: size, height: size }}
                data-model-src={FUXIE_LIVING_3D_ASSETS.model}
            >
                <Image
                    src={src}
                    alt={alt}
                    width={size}
                    height={size}
                    priority={priority}
                    className={`fuxie-live-asset-image h-full w-full object-contain ${live ? 'fuxie-live-asset-motion' : ''} ${imageClassName}`}
                />
                {live ? (
                    <>
                        <span className="fuxie-live-asset-shadow absolute bottom-1 left-1/2 h-3 w-3/5 -translate-x-1/2 rounded-full bg-[#3C78A8]/12 blur-sm" aria-hidden="true" />
                        <span className="fuxie-live-asset-spark fuxie-live-asset-spark-1 absolute rounded-full bg-[#FFD166]" aria-hidden="true" />
                        <span className="fuxie-live-asset-spark fuxie-live-asset-spark-2 absolute rounded-full bg-[#2EC4B6]" aria-hidden="true" />
                    </>
                ) : null}
            </span>
        )
    }

    return (
        <span
            className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden ${className}`}
            style={{ width: size, height: size }}
            data-model-src={FUXIE_LIVING_3D_ASSETS.model}
        >
            {live ? (
                FUXIE_LIVING_3D_ASSETS.frames.map((src, index) => (
                    <Image
                        key={src}
                        src={src}
                        alt={index === 0 ? alt : ''}
                        width={size}
                        height={size}
                        priority={priority && index === 0}
                        aria-hidden={index === 0 ? undefined : true}
                        className={`fuxie-live-3d-frame fuxie-live-3d-frame-${index + 1} absolute inset-0 h-full w-full object-contain ${imageClassName}`}
                    />
                ))
            ) : (
                <Image
                    src={FUXIE_LIVING_3D_ASSETS.poster}
                    alt={alt}
                    width={size}
                    height={size}
                    priority={priority}
                    className={`h-full w-full object-contain ${imageClassName}`}
                />
            )}
        </span>
    )
}

interface FuxieCoachProps {
    role?: FuxieCoachRole
    eyebrow?: string
    title: string
    message: string
    mascotSrc?: string
    motion?: FuxieMascotMotion
    className?: string
}

const FUXIE_ROLE_CONFIG: Record<FuxieCoachRole, { src: string; gradient: string; icon: IconComponent }> = {
    coach: {
        src: FUXIE_3D_ASSETS.dailyMission,
        gradient: 'from-[#F3FBFF] via-white to-[#CCE4F0]',
        icon: Sparkles,
    },
    feedback: {
        src: FUXIE_3D_ASSETS.happyWave,
        gradient: 'from-[#E4F0F0] via-white to-[#F3FBFF]',
        icon: Zap,
    },
    reward: {
        src: FUXIE_3D_ASSETS.fucoinReward,
        gradient: 'from-[#FFF6D6] via-white to-[#E4F0F0]',
        icon: Trophy,
    },
    locked: {
        src: FUXIE_3D_ASSETS.happyWave,
        gradient: 'from-[#F3FBFF] via-white to-[#E4F0F0]',
        icon: LockKeyhole,
    },
}

export function FuxieCoach({
    role = 'coach',
    eyebrow = 'Fuxie coach',
    title,
    message,
    mascotSrc,
    motion,
    className = '',
}: FuxieCoachProps) {
    const config = FUXIE_ROLE_CONFIG[role]
    const Icon = config.icon
    const mascotMotion = motion ?? (role === 'reward' ? 'reward' : role === 'coach' ? 'coach' : 'idle')

    return (
        <div
            className={`relative overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-br ${config.gradient} p-4 shadow-sm ring-1 ring-slate-100 ${className}`}
        >
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#60A8E4]/15" />
            <div className="relative flex items-center gap-4">
                <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <Image src={mascotSrc ?? config.src} alt="Fuxie" width={76} height={76} className={`object-contain ${fuxieMascotMotionClass(mascotMotion)}`} />
                    <span className="absolute -right-1 -top-1 rounded-full bg-[#54A8E4] p-1.5 text-white shadow-sm">
                        <Icon className="h-3.5 w-3.5" />
                    </span>
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#3C78A8]">{eyebrow}</p>
                    <h3 className="mt-1 text-base font-black text-slate-950 sm:text-lg">{title}</h3>
                    <p className="mt-1 text-sm font-medium leading-relaxed text-slate-600">{message}</p>
                </div>
            </div>
        </div>
    )
}

export type RewardPreviewType = 'xp' | 'fucoin' | 'streak' | 'badge' | 'unlock' | 'exam'

export interface RewardPreviewItem {
    type: RewardPreviewType
    label: string
    detail: string
}

interface RewardPreviewProps {
    rewards: RewardPreviewItem[]
    className?: string
    layout?: 'row' | 'stack'
}

interface RewardRevealMomentProps {
    rewards: RewardPreviewItem[]
    title?: string
    detail?: string
    mode?: 'earned' | 'receipt' | 'pending'
    className?: string
}

const REWARD_CONFIG: Record<RewardPreviewType, { icon: IconComponent; tone: FuxieRewardListItem['tone'] }> = {
    xp: { icon: Star, tone: 'reward' },
    fucoin: { icon: Coins, tone: 'reward' },
    streak: { icon: Flame, tone: 'streak' },
    badge: { icon: Award, tone: 'badge' },
    unlock: { icon: BadgeCheck, tone: 'success' },
    exam: { icon: Trophy, tone: 'brand' },
}

const REWARD_TYPE_ASSETS: Partial<Record<RewardPreviewType, string>> = {
    xp: REWARD_ASSETS.xpStar,
    fucoin: REWARD_ASSETS.fucoin,
    streak: REWARD_ASSETS.streakFreeze,
    badge: REWARD_ASSETS.cefrBadges,
    unlock: REWARD_ASSETS.unlockKey,
}

function rewardVisualForType(type: RewardPreviewType, className = 'h-8 w-8') {
    const assetSrc = REWARD_TYPE_ASSETS[type]
    const config = REWARD_CONFIG[type]
    const Icon = config.icon

    if (assetSrc) {
        return (
            <Image
                src={assetSrc}
                alt=""
                width={40}
                height={40}
                className={`${className} object-contain drop-shadow-sm`}
            />
        )
    }

    return <Icon className={className} />
}

export function RewardPreview({ rewards, className = '', layout = 'row' }: RewardPreviewProps) {
    const items = rewards.map((reward): FuxieRewardListItem => {
        const config = REWARD_CONFIG[reward.type]
        const Icon = config.icon
        const assetSrc = REWARD_TYPE_ASSETS[reward.type]

        return {
            id: `${reward.type}-${reward.label}`,
            icon: assetSrc ? rewardVisualForType(reward.type) : <Icon className="h-4 w-4" />,
            label: reward.label,
            detail: reward.detail,
            tone: config.tone,
        }
    })

    return <FuxieRewardList items={items} layout={layout} className={className} />
}

export function RewardRevealMoment({
    rewards,
    title = 'Reward unlocked',
    detail = 'Phan thuong da duoc ghi nhan cho nhiem vu nay.',
    mode = 'earned',
    className = '',
}: RewardRevealMomentProps) {
    if (rewards.length === 0) return null

    const isEarned = mode === 'earned'
    const panelClass = isEarned
        ? 'bg-gradient-to-r from-[#EAFBF8] via-white to-[#FFF7D6] ring-[#FFD166]/45'
        : mode === 'pending'
            ? 'bg-gradient-to-r from-[#F3FBFF] via-white to-[#EAFBF8] ring-[#CCE4F0]/80'
            : 'bg-gradient-to-r from-[#F3FBFF] via-white to-[#E4F0F0] ring-[#CCE4F0]/80'
    const eyebrowClass = isEarned ? 'text-[#C67A00]' : mode === 'pending' ? 'text-[#3C78A8]' : 'text-[#148F7D]'
    const tokenClass = isEarned
        ? 'fuxie-reveal-main-token bg-white/90 ring-white'
        : 'bg-white/82 ring-[#CCE4F0]/65'
    const miniTokenClass = isEarned
        ? 'fuxie-reveal-mini-token bg-white ring-[#CCE4F0]/65'
        : 'bg-white/80 ring-[#CCE4F0]/60'
    const mainReward = rewards.find((reward) => reward.type === 'fucoin')
        ?? rewards.find((reward) => reward.type === 'xp')
        ?? rewards[0]!
    const visibleRewards = rewards.slice(0, 4)

    return (
        <div
            className={`fuxie-reward-reveal relative overflow-hidden rounded-2xl p-3 shadow-sm ring-1 ${panelClass} ${className}`}
            role="status"
            aria-live="polite"
        >
            {isEarned ? (
                <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                        <span
                            key={index}
                            className="fuxie-reveal-spark absolute h-1.5 w-1.5 rounded-full bg-[#FFB703]"
                            style={{
                                left: `${12 + index * 15}%`,
                                top: index % 2 === 0 ? '20%' : '72%',
                                animationDelay: `${index * 70}ms`,
                            }}
                        />
                    ))}
                </div>
            ) : null}
            <div className="relative flex items-center gap-3">
                <div className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl p-2 shadow-sm ring-1 ${tokenClass}`}>
                    {rewardVisualForType(mainReward.type, 'h-12 w-12')}
                </div>
                <div className="min-w-0 flex-1">
                    <p className={`text-[11px] font-black uppercase tracking-wide ${eyebrowClass}`}>
                        {title}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-base font-black text-[#173B56]">
                        {mainReward.label}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs font-semibold leading-relaxed text-[#3C78A8]">
                        {detail}
                    </p>
                </div>
                <div className="hidden shrink-0 items-center -space-x-2 sm:flex">
                    {visibleRewards.map((reward, index) => (
                        <span
                            key={`${reward.type}-${reward.label}`}
                            className={`grid h-10 w-10 place-items-center rounded-xl p-1 shadow-sm ring-1 ${miniTokenClass}`}
                            style={{ animationDelay: `${120 + index * 90}ms` }}
                            title={reward.label}
                        >
                            {rewardVisualForType(reward.type, 'h-8 w-8')}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    )
}

export interface QuestHeroStat {
    label: string
    value: string
    detail?: string
}

interface QuestProgressHeroProps {
    variant: 'exam' | 'review'
    eyebrow: string
    title: string
    message: string
    stats: QuestHeroStat[]
    rewards: RewardPreviewItem[]
    children?: ReactNode
    mascotSrc?: string
    className?: string
}

const QUEST_HERO_CONFIG: Record<QuestProgressHeroProps['variant'], {
    icon: IconComponent
    mascot: string
    surface: string
    accent: string
    panel: string
    halo: string
}> = {
    exam: {
        icon: ClipboardCheck,
        mascot: FUXIE_3D_ASSETS.celebration,
        surface: 'bg-gradient-to-br from-[#F3FBFF] via-[#E4F0F0] to-[#CCE4F0]',
        accent: '#FFB703',
        panel: 'bg-white/75 ring-white/90',
        halo: 'rgba(255,183,3,0.32)',
    },
    review: {
        icon: RotateCcw,
        mascot: FUXIE_3D_ASSETS.streakFreezeSaved,
        surface: 'bg-gradient-to-br from-[#F3FBFF] via-[#D8F0F0] to-[#CCE4F0]',
        accent: '#2EC4B6',
        panel: 'bg-white/75 ring-white/90',
        halo: 'rgba(46,196,182,0.32)',
    },
}

export function QuestProgressHero({
    variant,
    eyebrow,
    title,
    message,
    stats,
    rewards,
    children,
    mascotSrc,
    className = '',
}: QuestProgressHeroProps) {
    const config = QUEST_HERO_CONFIG[variant]
    const Icon = config.icon

    return (
        <section className={`relative overflow-hidden rounded-[28px] ${config.surface} p-5 text-[#173B56] shadow-[0_24px_70px_rgba(60,120,168,0.18)] ring-1 ring-white/80 sm:p-6 ${className}`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(96,168,228,0.38),transparent_32%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.9),transparent_30%)]" />
            <div className="absolute -bottom-24 right-16 h-56 w-56 rounded-full blur-3xl" style={{ backgroundColor: config.halo }} />

            <div className="relative grid gap-5 lg:grid-cols-[1fr_340px] lg:items-stretch">
                <div className="flex min-w-0 flex-col justify-between gap-5">
                    <div>
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-[#3C78A8] shadow-sm ring-1 ring-white/90">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full text-white" style={{ backgroundColor: config.accent }}>
                                <Icon className="h-3.5 w-3.5" />
                            </span>
                            {eyebrow}
                        </div>
                        <h1 className="max-w-2xl text-3xl font-black tracking-normal text-[#173B56] sm:text-4xl">
                            {title}
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-[#3C78A8] sm:text-base">
                            {message}
                        </p>
                    </div>

                    {children}

                    <div className="grid gap-2 sm:grid-cols-3">
                        {stats.map((stat) => (
                            <div key={`${stat.label}-${stat.value}`} className="rounded-2xl bg-white/70 px-4 py-3 shadow-sm ring-1 ring-white/90">
                                <p className="text-[11px] font-black uppercase tracking-wide text-[#3C78A8]/70">{stat.label}</p>
                                <p className="mt-1 text-2xl font-black text-[#173B56]">{stat.value}</p>
                                {stat.detail && (
                                    <p className="mt-0.5 truncate text-xs font-semibold text-[#3C78A8]/75">{stat.detail}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className={`flex min-w-0 flex-col justify-between gap-4 rounded-3xl p-4 ring-1 ${config.panel}`}>
                    <div className="flex items-center gap-4">
                        <div className="relative h-24 w-24 shrink-0 rounded-3xl bg-white shadow-lg">
                            <Image
                                src={mascotSrc ?? config.mascot}
                                alt="Fuxie"
                                fill
                                sizes="96px"
                                className={`object-contain p-1 ${fuxieMascotMotionClass(variant === 'exam' ? 'coach' : 'idle')}`}
                            />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-black uppercase tracking-wide text-[#3C78A8]/70">Reward preview</p>
                            <h2 className="mt-1 text-lg font-black text-[#173B56]">Hoàn thành để nhận thưởng</h2>
                            <p className="mt-1 text-xs font-semibold leading-relaxed text-[#3C78A8]/75">
                                Phần thưởng hiện trước khi học giúp học viên thấy rõ lý do bấm tiếp.
                            </p>
                        </div>
                    </div>
                    <RewardPreview rewards={rewards} layout="stack" />
                </div>
            </div>
        </section>
    )
}

export type SkillMotivationKind = 'reading' | 'listening' | 'writing'

export interface SkillMotivationMetric {
    label: string
    value: string
}

interface SkillMotivationRailProps {
    skill: SkillMotivationKind
    phaseLabel: string
    title: string
    message: string
    progressLabel: string
    progressPercent: number
    metrics: SkillMotivationMetric[]
    rewards: RewardPreviewItem[]
    className?: string
}

const SKILL_MOTIVATION_CONFIG: Record<SkillMotivationKind, {
    icon: IconComponent
    label: string
    accent: string
    bg: string
}> = {
    reading: {
        icon: BookOpen,
        label: 'Reading quest',
        accent: '#3C78A8',
        bg: 'from-[#F3FBFF] via-white to-[#CCE4F0]',
    },
    listening: {
        icon: Headphones,
        label: 'Listening quest',
        accent: '#2EC4B6',
        bg: 'from-[#E4F0F0] via-white to-[#F3FBFF]',
    },
    writing: {
        icon: PenLine,
        label: 'Writing quest',
        accent: '#FF8A3D',
        bg: 'from-[#F3FBFF] via-white to-[#FFE8D6]',
    },
}

export function SkillMotivationRail({
    skill,
    phaseLabel,
    title,
    message,
    progressLabel,
    progressPercent,
    metrics,
    rewards,
    className = '',
}: SkillMotivationRailProps) {
    const config = SKILL_MOTIVATION_CONFIG[skill]
    const Icon = config.icon
    const safeProgress = Math.max(2, Math.min(100, progressPercent))

    return (
        <aside className={`flex min-w-0 flex-col gap-3 lg:sticky lg:top-6 lg:self-start ${className}`}>
            <div className={`overflow-hidden rounded-2xl border border-white/80 bg-gradient-to-br ${config.bg} p-4 shadow-sm ring-1 ring-slate-100`}>
                <div className="flex items-center gap-3">
                    <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                        style={{ backgroundColor: config.accent }}
                    >
                        <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                        <p className="text-xs font-black uppercase tracking-wide" style={{ color: config.accent }}>
                            {config.label}
                        </p>
                        <h3 className="truncate text-base font-black text-slate-950">{phaseLabel}</h3>
                    </div>
                </div>

                <div className="mt-4">
                    <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-500">
                        <span>{progressLabel}</span>
                        <span>{Math.round(progressPercent)}%</span>
                    </div>
                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/80">
                        <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${safeProgress}%`, backgroundColor: config.accent }}
                        />
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                    {metrics.map((metric) => (
                        <div key={`${metric.label}-${metric.value}`} className="rounded-xl bg-white/75 px-3 py-2 ring-1 ring-white">
                            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{metric.label}</p>
                            <p className="mt-0.5 truncate text-sm font-black text-slate-900">{metric.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            <FuxieCoach
                role="feedback"
                eyebrow="Focus mission"
                title={title}
                message={message}
                className="bg-white"
            />

            <div className="rounded-2xl bg-gradient-to-br from-[#F3FBFF] to-[#CCE4F0] p-3 shadow-sm ring-1 ring-white/80">
                <RewardPreview layout="stack" rewards={rewards} />
            </div>
        </aside>
    )
}
