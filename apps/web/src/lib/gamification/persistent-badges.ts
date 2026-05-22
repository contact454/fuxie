import { Prisma, prisma } from '@fuxie/database'

import { recordAnalyticsEvent, type AnalyticsActionType } from '@/lib/analytics/events'
import {
    PILOT_BADGE_CATALOG,
    buildSkillMasterySnapshot,
    type BadgeProgress,
    type BadgeReceiptState,
    type MasteryEvent,
    type MasterySkill,
} from './skill-mastery'

export type PersistentBadgeDbClient = typeof prisma | Prisma.TransactionClient

export interface PersistentBadgeUnlockInput {
    userId: string
    skill: MasterySkill
    currentLevel?: string | null
    sourceActionId: string
    sourceActionType: AnalyticsActionType
    source?: string
    db?: PersistentBadgeDbClient
}

export interface PersistentBadgeUnlockResult {
    skillMasteryProgress?: ReturnType<typeof buildSkillMasterySnapshot>['skills'][number]
    nextBadgePreview?: BadgeProgress | null
    badgeReceipt?: BadgeProgress | null
    badgeReceiptState: BadgeReceiptState
    masteryReason?: string
}

const PILOT_BADGE_SLUGS = new Set(PILOT_BADGE_CATALOG.map((badge) => badge.id))

export async function getPersistentBadgeMasteryPayload(
    input: PersistentBadgeUnlockInput,
): Promise<PersistentBadgeUnlockResult> {
    const db = input.db ?? prisma
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

    const earnedBadgeSlugs = achievements.map((item) => item.achievement.slug)
    const snapshot = buildSkillMasterySnapshot({
        events: events as MasteryEvent[],
        earnedBadgeSlugs,
        currentLevel: input.currentLevel,
    })
    const skillMasteryProgress = snapshot.skills.find((skill) => skill.skill === input.skill)
    const eligibleReceipt = snapshot.badgeReceipt

    if (!eligibleReceipt || !PILOT_BADGE_SLUGS.has(eligibleReceipt.id)) {
        return {
            ...(skillMasteryProgress ? { skillMasteryProgress } : {}),
            nextBadgePreview: withReceiptState(snapshot.nextBadgePreview, 'preview'),
            badgeReceipt: null,
            badgeReceiptState: 'preview',
            masteryReason: snapshot.masteryReason,
        }
    }

    const persisted = await persistPilotBadgeUnlock(db, {
        userId: input.userId,
        badge: eligibleReceipt,
        skill: input.skill,
        currentLevel: input.currentLevel,
        sourceActionId: input.sourceActionId,
        sourceActionType: input.sourceActionType,
        source: input.source,
    })

    return {
        ...(skillMasteryProgress ? { skillMasteryProgress } : {}),
        nextBadgePreview: withReceiptState(snapshot.nextBadgePreview, 'preview'),
        badgeReceipt: withReceiptState(eligibleReceipt, persisted.state),
        badgeReceiptState: persisted.state,
        masteryReason: snapshot.masteryReason,
    }
}

async function persistPilotBadgeUnlock(
    db: PersistentBadgeDbClient,
    input: {
        userId: string
        badge: BadgeProgress
        skill: MasterySkill
        currentLevel?: string | null
        sourceActionId: string
        sourceActionType: AnalyticsActionType
        source?: string
    },
) {
    const achievement = await db.achievement.upsert({
        where: { slug: input.badge.id },
        update: pilotBadgeAchievementData(input.badge),
        create: {
            slug: input.badge.id,
            ...pilotBadgeAchievementData(input.badge),
        },
        select: {
            id: true,
            slug: true,
        },
    })

    const created = await db.userAchievement.createMany({
        data: [{
            userId: input.userId,
            achievementId: achievement.id,
        }],
        skipDuplicates: true,
    })

    if (created.count <= 0) {
        return { state: 'already_earned' as const }
    }

    await recordAnalyticsEvent(db, {
        userId: input.userId,
        role: 'LEARNER',
        eventName: 'badge_unlocked',
        source: input.source ?? 'gamification.badge.persistence',
        actionId: achievement.slug,
        actionType: input.sourceActionType,
        level: (input.badge.cefrLevel ?? input.currentLevel ?? null)?.toUpperCase() ?? null,
        skill: input.badge.skill ?? input.skill,
        metadata: {
            badgeId: achievement.slug,
            skill: input.badge.skill ?? input.skill,
            cefrLevel: (input.badge.cefrLevel ?? input.currentLevel ?? null)?.toUpperCase() ?? null,
            sourceActionId: input.sourceActionId,
            receiptState: 'newly_unlocked',
        },
    })

    return { state: 'newly_unlocked' as const }
}

function pilotBadgeAchievementData(badge: BadgeProgress) {
    return {
        title: badge.title,
        titleDe: null,
        description: badge.description,
        descriptionDe: null,
        iconUrl: null,
        category: badge.category,
        conditionType: 'pilot_badge',
        conditionValue: 0,
        xpReward: 0,
    }
}

function withReceiptState<T extends BadgeProgress | null | undefined>(
    badge: T,
    state: BadgeReceiptState,
): T {
    if (!badge) return badge
    return {
        ...badge,
        receiptState: state,
    } as T
}
