'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import type { ComponentType, ReactNode } from 'react'
import {
    Award,
    BadgeCheck,
    BookOpen,
    CheckCircle2,
    ClipboardCheck,
    Coins,
    Flame,
    Flag,
    Headphones,
    Lightbulb,
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
import {
    FUXIE_3D_ASSETS,
    FUXIE_GAMIFICATION_MASCOTS,
    FUXIE_LIVING_3D_ASSETS,
    FUXIE_MASCOT_STATES,
    FUXIE_MODULE_MASCOTS,
    FUXIE_UI_FRAMES,
    FUXIE_WORLD_PROPS,
} from '@/lib/mascot/fuxie-assets'

// Re-export so existing consumers can keep importing from quest-visuals.
export { FUXIE_3D_ASSETS, FUXIE_LIVING_3D_ASSETS }

type IconComponent = ComponentType<{ className?: string }>

export type FuxieCoachRole = 'coach' | 'feedback' | 'reward' | 'locked'

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

function FuxieFrameAccent({
    src,
    size = 96,
    className = '',
}: {
    src: string
    size?: number
    className?: string
}) {
    return (
        <Image
            src={src}
            alt=""
            width={size}
            height={size}
            aria-hidden="true"
            className={`pointer-events-none select-none object-contain ${className}`}
            style={{ width: `${size}px`, height: `${size}px` }}
        />
    )
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
                style={{ width: '100%', height: '100%' }}
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
                    style={{ width: '100%', height: '100%' }}
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
                        style={{ width: '100%', height: '100%' }}
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
                    style={{ width: '100%', height: '100%' }}
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
    priority?: boolean
    className?: string
}

const FUXIE_ROLE_CONFIG: Record<FuxieCoachRole, { src: string; gradient: string; icon: IconComponent }> = {
    coach: {
        src: FUXIE_3D_ASSETS.dailyMission,
        gradient: 'from-[#F3FBFF] via-white to-[#CCE4F0]',
        icon: Sparkles,
    },
    feedback: {
        src: FUXIE_3D_ASSETS.gentleCorrection,
        gradient: 'from-[#E4F0F0] via-white to-[#F3FBFF]',
        icon: Zap,
    },
    reward: {
        src: FUXIE_3D_ASSETS.fucoinReward,
        gradient: 'from-[#FFF6D6] via-white to-[#E4F0F0]',
        icon: Trophy,
    },
    locked: {
        src: FUXIE_3D_ASSETS.calmEmpty,
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
    priority = false,
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
                    <Image
                        src={mascotSrc ?? config.src}
                        alt="Fuxie"
                        data-role="fuxie-coach-mascot"
                        width={76}
                        height={76}
                        priority={priority}
                        className={`object-contain ${fuxieMascotMotionClass(mascotMotion)}`}
                        style={{ width: 'auto', height: 'auto' }}
                    />
                    <span className="absolute -right-1 -top-1 rounded-full bg-[#54A8E4] p-1.5 text-white shadow-sm">
                        <Icon className="h-3.5 w-3.5" />
                    </span>
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-bold uppercase text-text-brand">{eyebrow}</p>
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
    xp: REWARD_ASSETS.xpStarVillage,
    fucoin: REWARD_ASSETS.fucoinVillage,
    streak: REWARD_ASSETS.streakFreezeSnowglobe,
    badge: REWARD_ASSETS.cefrBadgeNodeSet,
    unlock: REWARD_ASSETS.unlockKeySignpost,
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
                style={{ width: 'auto', height: 'auto' }}
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
    detail = 'Phần thưởng đã được ghi nhận cho nhiệm vụ này.',
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
    const eyebrowClass = isEarned ? 'text-text-reward' : mode === 'pending' ? 'text-text-brand' : 'text-text-success'
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
            <FuxieFrameAccent
                src={FUXIE_UI_FRAMES.resultRevealFrame}
                size={118}
                className="absolute -right-8 -top-8 opacity-20"
            />
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
                    <p className={`text-xs font-black uppercase ${eyebrowClass}`}>
                        {title}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-base font-black text-text-primary">
                        {mainReward.label}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs font-semibold leading-relaxed text-text-brand">
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

export interface QuestCheckpointVisualStep {
    id: string
    title: string
    objective: string
}

interface QuestCheckpointRailProps {
    checkpoints: QuestCheckpointVisualStep[]
    activeId: string
    completedIds?: string[]
    label?: string
    compact?: boolean
    className?: string
}

export function QuestCheckpointRail({
    checkpoints,
    activeId,
    completedIds = [],
    label = 'Checkpoint progress',
    compact = false,
    className = '',
}: QuestCheckpointRailProps) {
    if (checkpoints.length === 0) return null

    const activeIndex = Math.max(0, checkpoints.findIndex((checkpoint) => checkpoint.id === activeId))
    const progress = Math.round(((activeIndex + 1) / checkpoints.length) * 100)

    return (
        <div className={`relative overflow-hidden rounded-2xl bg-white/82 p-3 shadow-sm ring-1 ring-[#CCE4F0]/70 ${className}`}>
            <FuxieFrameAccent
                src={FUXIE_UI_FRAMES.courseCheckpointNode}
                size={92}
                className="absolute -right-6 -top-7 opacity-[0.15]"
            />
            <div className="relative mb-3 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#F3FBFF] ring-1 ring-[#CCE4F0]/70">
                        <Image
                            src={FUXIE_UI_FRAMES.courseCheckpointNode}
                            alt=""
                            width={24}
                            height={24}
                            className="h-5 w-5 object-contain"
                        />
                    </span>
                    <p className="min-w-0 truncate text-xs font-black uppercase text-text-brand">{label}</p>
                </div>
                <span className="rounded-full bg-[#EAFBF8] px-2.5 py-1 text-xs font-black text-text-success">
                    {activeIndex + 1}/{checkpoints.length}
                </span>
            </div>
            <div className="relative h-2 overflow-hidden rounded-full bg-[#D9EAF5]" aria-hidden="true">
                <div
                    className="h-full rounded-full bg-[#2EC4B6] transition-all duration-500"
                    style={{ width: `${progress}%` }}
                />
            </div>
            <div className={`relative mt-3 grid gap-2 ${compact ? '' : 'sm:grid-cols-3'}`}>
                {checkpoints.map((checkpoint, index) => {
                    const done = completedIds.includes(checkpoint.id) || index < activeIndex
                    const active = checkpoint.id === activeId
                    const Icon = done ? CheckCircle2 : active ? Flag : Lightbulb
                    const tone = done
                        ? 'bg-[#EAFBF8] text-text-success ring-[#BFEFE5]'
                        : active
                            ? 'bg-[#F3FBFF] text-text-brand ring-[#CCE4F0]'
                            : 'bg-slate-50 text-slate-400 ring-slate-100'

                    return (
                        <div
                            key={checkpoint.id}
                            className={`rounded-xl p-3 ring-1 transition ${tone} ${active ? 'shadow-sm' : ''}`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/80">
                                    <Icon className="h-4 w-4" />
                                </span>
                                <p className="min-w-0 truncate text-sm font-black">{checkpoint.title}</p>
                            </div>
                            {!compact ? (
                                <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-600">
                                    {checkpoint.objective}
                                </p>
                            ) : null}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

interface GameplayFeedbackMomentProps {
    tone?: 'success' | 'focus' | 'retry'
    title: string
    message: string
    meta?: string
    className?: string
}

export function GameplayFeedbackMoment({
    tone = 'focus',
    title,
    message,
    meta,
    className = '',
}: GameplayFeedbackMomentProps) {
    const toneClass = tone === 'success'
        ? 'from-[#EAFBF8] to-white ring-[#BFEFE5] text-text-success'
        : tone === 'retry'
            ? 'from-[#FFF6D6] to-white ring-[#FFE1A6] text-text-warning'
            : 'from-[#F3FBFF] to-white ring-[#CCE4F0] text-text-brand'

    return (
        <div className={`rounded-2xl bg-gradient-to-br ${toneClass} p-3 shadow-sm ring-1 ${className}`} role="status" aria-live="polite">
            <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/85">
                    {tone === 'success' ? <CheckCircle2 className="h-5 w-5" /> : tone === 'retry' ? <RotateCcw className="h-5 w-5" /> : <Lightbulb className="h-5 w-5" />} // locale-allow
                </span>
                <div className="min-w-0">
                    <p className="text-sm font-black text-text-primary">{title}</p>
                    <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600">{message}</p>
                    {meta ? <p className="mt-2 text-xs font-black uppercase text-current">{meta}</p> : null}
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
    worldProp: string
    surface: string
    accent: string
    panel: string
    halo: string
}> = {
    exam: {
        icon: ClipboardCheck,
        mascot: FUXIE_3D_ASSETS.celebration,
        worldProp: FUXIE_WORLD_PROPS.townHallExam,
        surface: 'bg-gradient-to-br from-[#F3FBFF] via-[#E4F0F0] to-[#CCE4F0]',
        accent: '#FFB703',
        panel: 'bg-white/75 ring-white/90',
        halo: 'rgba(255,183,3,0.32)',
    },
    review: {
        icon: RotateCcw,
        mascot: FUXIE_3D_ASSETS.streakFreezeSaved,
        worldProp: FUXIE_WORLD_PROPS.reviewGarden,
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
    const t = useTranslations('Gamification')
    const config = QUEST_HERO_CONFIG[variant]
    const Icon = config.icon

    return (
        <section className={`relative overflow-hidden rounded-[28px] ${config.surface} p-5 text-text-primary shadow-[0_24px_70px_rgba(60,120,168,0.18)] ring-1 ring-white/80 sm:p-6 ${className}`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(96,168,228,0.38),transparent_32%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.9),transparent_30%)]" />
            <div className="absolute -bottom-24 right-16 h-56 w-56 rounded-full blur-3xl" style={{ backgroundColor: config.halo }} />

            <div className="relative grid gap-5 lg:grid-cols-[1fr_340px] lg:items-stretch">
                <div className="flex min-w-0 flex-col justify-between gap-5">
                    <div>
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1.5 text-xs font-black uppercase text-text-brand shadow-sm ring-1 ring-white/90">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full text-white" style={{ backgroundColor: config.accent }}>
                                <Icon className="h-3.5 w-3.5" />
                            </span>
                            {eyebrow}
                        </div>
                        <h1 className="max-w-2xl text-3xl font-black tracking-normal text-text-primary sm:text-4xl">
                            {title}
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-text-brand sm:text-base">
                            {message}
                        </p>
                    </div>

                    {children}

                    <div className="grid gap-2 sm:grid-cols-3">
                        {stats.map((stat) => (
                            <div key={`${stat.label}-${stat.value}`} className="rounded-2xl bg-white/70 px-4 py-3 shadow-sm ring-1 ring-white/90">
                                <p className="text-xs font-black uppercase text-text-brand/70">{stat.label}</p>
                                <p className="mt-1 text-2xl font-black text-text-primary">{stat.value}</p>
                                {stat.detail && (
                                    <p className="mt-0.5 truncate text-xs font-semibold text-text-brand/75">{stat.detail}</p>
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
                            <span className="absolute -bottom-3 -right-3 grid h-12 w-12 place-items-center rounded-2xl bg-white/95 p-1.5 shadow-sm ring-1 ring-white">
                                <Image
                                    src={config.worldProp}
                                    alt=""
                                    width={44}
                                    height={44}
                                    className="h-full w-full object-contain"
                                />
                            </span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-black uppercase text-text-brand/70">Reward preview</p>
                            <h2 className="mt-1 text-lg font-black text-text-primary">{t('rewardPreviewTitle')}</h2>
                            <p className="mt-1 text-xs font-semibold leading-relaxed text-text-brand/75">
                                {t('rewardPreviewDesc')}
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
    worldProp: string
    mascot: string
    frame: string
    accent: string
    bg: string
}> = {
    reading: {
        icon: BookOpen,
        label: 'Reading quest',
        worldProp: FUXIE_WORLD_PROPS.library,
        mascot: FUXIE_3D_ASSETS.questPlanner,
        frame: FUXIE_UI_FRAMES.noticeBoard,
        accent: '#3C78A8',
        bg: 'from-[#F3FBFF] via-white to-[#CCE4F0]',
    },
    listening: {
        icon: Headphones,
        label: 'Listening quest',
        worldProp: FUXIE_WORLD_PROPS.radioBooth,
        mascot: FUXIE_3D_ASSETS.listeningFocus,
        frame: FUXIE_UI_FRAMES.audioBroadcastPanel,
        accent: '#2EC4B6',
        bg: 'from-[#E4F0F0] via-white to-[#F3FBFF]',
    },
    writing: {
        icon: PenLine,
        label: 'Writing quest',
        worldProp: FUXIE_WORLD_PROPS.postOffice,
        mascot: FUXIE_3D_ASSETS.writingDelivery,
        frame: FUXIE_UI_FRAMES.letterReceiptFrame,
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
            <div className={`relative overflow-hidden rounded-2xl border border-white/80 bg-gradient-to-br ${config.bg} p-4 shadow-sm ring-1 ring-slate-100`}>
                <FuxieFrameAccent
                    src={config.frame}
                    size={128}
                    className="absolute -bottom-8 -right-8 opacity-20"
                />
                <div className="relative flex items-center gap-3">
                    <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                        style={{ backgroundColor: config.accent }}
                    >
                        <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                        <p className="text-xs font-black uppercase" style={{ color: config.accent }}>
                            {config.label}
                        </p>
                        <h3 className="truncate text-base font-black text-slate-950">{phaseLabel}</h3>
                    </div>
                    <Image
                        src={config.worldProp}
                        alt=""
                        width={56}
                        height={56}
                        className="ml-auto hidden h-14 w-14 shrink-0 object-contain drop-shadow-sm sm:block"
                    />
                </div>

                <div className="relative mt-4">
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

                <div className="relative mt-4 grid grid-cols-2 gap-2">
                    {metrics.map((metric) => (
                        <div key={`${metric.label}-${metric.value}`} className="rounded-xl bg-white/75 px-3 py-2 ring-1 ring-white">
                            <p className="text-xs font-bold uppercase text-slate-400">{metric.label}</p>
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
                mascotSrc={config.mascot}
                className="bg-white"
            />

            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#F3FBFF] to-[#CCE4F0] p-3 shadow-sm ring-1 ring-white/80">
                <FuxieFrameAccent
                    src={FUXIE_UI_FRAMES.resultRevealFrame}
                    size={104}
                    className="absolute -right-7 -top-8 opacity-[0.16]"
                />
                <div className="relative">
                    <RewardPreview layout="stack" rewards={rewards} />
                </div>
            </div>
        </aside>
    )
}
