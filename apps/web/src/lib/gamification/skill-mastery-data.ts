import { Prisma, prisma } from '@fuxie/database'

import type { AnalyticsActionType } from '@/lib/analytics/events'
import { getPersistentBadgeMasteryPayload } from './persistent-badges'
import {
    buildSkillMasterySnapshot,
    type BadgeReceiptState,
    type BadgeProgress,
    type MasterySkill,
    type SkillMasteryProgress,
} from './skill-mastery'

export type SkillMasteryDbClient = typeof prisma | Prisma.TransactionClient

export interface LearningQuestMasteryPayload {
    skillMasteryProgress?: SkillMasteryProgress
    nextBadgePreview?: BadgeProgress | null
    badgeReceipt?: BadgeProgress | null
    badgeReceiptState?: BadgeReceiptState
    masteryReason?: string
}

export async function getLearningQuestMasteryPayload(input: {
    userId: string
    skill: MasterySkill
    currentLevel?: string | null
    sourceActionId?: string
    sourceActionType?: AnalyticsActionType
    source?: string
    persistBadgeUnlock?: boolean
    db?: SkillMasteryDbClient
}): Promise<LearningQuestMasteryPayload> {
    const db = input.db ?? prisma

    if (input.persistBadgeUnlock && input.sourceActionId && input.sourceActionType) {
        return getPersistentBadgeMasteryPayload({
            userId: input.userId,
            skill: input.skill,
            currentLevel: input.currentLevel,
            sourceActionId: input.sourceActionId,
            sourceActionType: input.sourceActionType,
            source: input.source,
            db,
        })
    }

    const since = new Date()
    since.setDate(since.getDate() - 89)

    const [events, achievements] = await Promise.all([
        db.analyticsEvent.findMany({
            where: {
                userId: input.userId,
                role: 'LEARNER',
                eventName: 'meaningful_action_completed',
                createdAt: { gte: since },
            },
            select: {
                userId: true,
                eventName: true,
                actionId: true,
                actionType: true,
                level: true,
                skill: true,
                metadata: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'asc' },
        }),
        db.userAchievement.findMany({
            where: { userId: input.userId },
            select: {
                achievement: {
                    select: { slug: true },
                },
            },
        }),
    ])
    const snapshot = buildSkillMasterySnapshot({
        events,
        earnedBadgeSlugs: achievements.map((item) => item.achievement.slug),
        currentLevel: input.currentLevel,
    })
    const skillMasteryProgress = snapshot.skills.find((skill) => skill.skill === input.skill)

    return {
        ...(skillMasteryProgress ? { skillMasteryProgress } : {}),
        nextBadgePreview: snapshot.nextBadgePreview ? { ...snapshot.nextBadgePreview, receiptState: 'preview' } : null,
        badgeReceipt: snapshot.badgeReceipt ? { ...snapshot.badgeReceipt, receiptState: 'preview' } : null,
        badgeReceiptState: 'preview',
        masteryReason: snapshot.masteryReason,
    }
}
