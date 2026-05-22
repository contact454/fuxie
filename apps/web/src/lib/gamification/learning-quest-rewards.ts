import type { AwardFucoinResult } from './fucoin'
import type { BadgeProgress, BadgeReceiptState, SkillMasteryProgress } from './skill-mastery'
import type { LearningActivityResult } from '@/lib/progress/learning-activity'

export type LearningQuestSkill =
    | 'vocabulary'
    | 'listening'
    | 'reading'
    | 'grammar'
    | 'writing'
    | 'speaking'
    | 'exam'

export interface LearningQuestRewardPreviewItem {
    type: 'xp' | 'fucoin' | 'streak' | 'badge' | 'unlock' | 'exam'
    label: string
    detail: string
}

export interface LearningQuestRewardPayload {
    fucoinEarned?: number
    walletBalance?: number
    fucoinDuplicate?: boolean
    fucoinIntended?: number
    fucoinDailyCap?: number
    fucoinDailyEarned?: number
    fucoinDailyRemaining?: number
    fucoinCapReached?: boolean
    streakReceipt?: {
        freezeUsed: boolean
        currentStreak: number
        freezesAvailable: number
        freezesUsed: number
    }
    skillMasteryProgress?: SkillMasteryProgress
    nextBadgePreview?: BadgeProgress | null
    badgeReceipt?: BadgeProgress | null
    badgeReceiptState?: BadgeReceiptState
    masteryReason?: string
    rewardPreview: LearningQuestRewardPreviewItem[]
    nextQuestHref: string
}

const DEFAULT_NEXT_QUEST_HREF: Record<LearningQuestSkill, string> = {
    vocabulary: '/vocabulary/practice',
    listening: '/listening',
    reading: '/reading',
    grammar: '/grammar',
    writing: '/writing',
    speaking: '/speaking',
    exam: '/exam',
}

const SKILL_LABEL: Record<LearningQuestSkill, string> = {
    vocabulary: 'Vocabulary quest',
    listening: 'Listening quest',
    reading: 'Reading quest',
    grammar: 'Grammar quest',
    writing: 'Writing quest',
    speaking: 'Speaking quest',
    exam: 'Exam quest',
}

export function buildLearningQuestRewardPayload(input: {
    skill: LearningQuestSkill
    xpEarned: number
    streak?: LearningActivityResult['streak'] | null
    fucoin?: AwardFucoinResult | null
    graded?: boolean
    nextQuestHref?: string
    skillMasteryProgress?: SkillMasteryProgress | null
    nextBadgePreview?: BadgeProgress | null
    badgeReceipt?: BadgeProgress | null
    badgeReceiptState?: BadgeReceiptState | null
    masteryReason?: string | null
}): LearningQuestRewardPayload {
    const rewardPreview: LearningQuestRewardPreviewItem[] = [
        {
            type: 'xp',
            label: input.graded === false ? 'XP pending' : `+${input.xpEarned} XP`,
            detail: input.graded === false ? 'Updates after grading syncs' : SKILL_LABEL[input.skill],
        },
    ]

    const fucoinPayload = input.fucoin ? buildFucoinPayload(input.fucoin) : null
    if (input.fucoin) {
        rewardPreview.push({
            type: 'fucoin',
            label: `+${input.fucoin.fucoinEarned} Fucoin`,
            detail: getFucoinRewardDetail(input.fucoin),
        })
    } else if (input.graded === false) {
        rewardPreview.push({
            type: 'fucoin',
            label: 'Fucoin pending',
            detail: 'Reward appears after grading syncs',
        })
    }

    const streakReceipt = input.streak ? buildStreakReceipt(input.streak) : null
    if (input.streak) {
        rewardPreview.push({
            type: 'streak',
            label: input.streak.isNewDay
                ? `${input.streak.currentStreak}-day streak`
                : 'Streak safe',
            detail: input.streak.freezeUsed ? 'Freeze protected the streak' : 'Meaningful learning recorded',
        })
    }

    if (input.skillMasteryProgress) {
        rewardPreview.push({
            type: 'unlock',
            label: `${input.skillMasteryProgress.progress}% mastery`,
            detail: input.skillMasteryProgress.masteryReason,
        })
    }

    if (input.badgeReceipt) {
        rewardPreview.push({
            type: 'badge',
            label: input.badgeReceipt.title,
            detail: 'Badge unlocked from meaningful learning',
        })
    } else if (input.nextBadgePreview) {
        rewardPreview.push({
            type: 'badge',
            label: `${input.nextBadgePreview.progress}% ${input.nextBadgePreview.title}`,
            detail: input.nextBadgePreview.requirement,
        })
    }

    return {
        ...(fucoinPayload ?? {}),
        ...(streakReceipt ? { streakReceipt } : {}),
        ...(input.skillMasteryProgress ? { skillMasteryProgress: input.skillMasteryProgress } : {}),
        ...(input.nextBadgePreview !== undefined ? { nextBadgePreview: input.nextBadgePreview } : {}),
        ...(input.badgeReceipt !== undefined ? { badgeReceipt: input.badgeReceipt } : {}),
        ...(input.badgeReceiptState ? { badgeReceiptState: input.badgeReceiptState } : {}),
        ...(input.masteryReason ? { masteryReason: input.masteryReason } : {}),
        rewardPreview,
        nextQuestHref: input.nextQuestHref ?? DEFAULT_NEXT_QUEST_HREF[input.skill],
    }
}

function buildFucoinPayload(fucoin: AwardFucoinResult) {
    return {
        fucoinEarned: fucoin.fucoinEarned,
        walletBalance: fucoin.walletBalance,
        fucoinDuplicate: fucoin.duplicate,
        fucoinIntended: fucoin.intendedAmount,
        fucoinDailyCap: fucoin.dailyCap,
        fucoinDailyEarned: (fucoin.dailyEarnedBefore ?? 0) + fucoin.fucoinEarned,
        fucoinDailyRemaining: fucoin.dailyRemainingAfter,
        fucoinCapReached: fucoin.capReached,
    }
}

function buildStreakReceipt(streak: LearningActivityResult['streak']) {
    return {
        freezeUsed: streak.freezeUsed,
        currentStreak: streak.currentStreak,
        freezesAvailable: streak.freezesAvailable,
        freezesUsed: streak.freezesUsed,
    }
}

function getFucoinRewardDetail(fucoin: AwardFucoinResult) {
    if (fucoin.duplicate) return 'Reward already recorded'
    if (fucoin.capReached && fucoin.fucoinEarned <= 0) return 'Daily Fucoin cap reached'
    if (fucoin.dailyCap !== undefined && fucoin.dailyEarnedBefore !== undefined) {
        return `${fucoin.dailyEarnedBefore + fucoin.fucoinEarned}/${fucoin.dailyCap} today`
    }
    return 'Learning wallet updated'
}
