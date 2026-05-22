import { prisma } from '@fuxie/database'
import type { AnalyticsDbClient } from './events'

export interface MotivationLoopReadoutInput {
    from: Date
    to: Date
    db?: AnalyticsDbClient
}

const MOTIVATION_EVENT_NAMES = [
    'mission_claimed',
    'streak_advanced',
    'streak_freeze_used',
    'streak_reset',
    'fucoin_earned',
    'reward_redeem_requested',
    'reward_redeem_approved',
    'reward_redeem_rejected',
    'reward_redeem_fulfilled',
] as const

export async function getMotivationLoopReadout(input: MotivationLoopReadoutInput) {
    const db = input.db ?? prisma
    const [motivationEvents, meaningfulActions] = await Promise.all([
        db.analyticsEvent.findMany({
            where: {
                role: 'LEARNER',
                eventName: { in: [...MOTIVATION_EVENT_NAMES] },
                createdAt: {
                    gte: input.from,
                    lte: input.to,
                },
            },
        }),
        db.analyticsEvent.findMany({
            where: {
                role: 'LEARNER',
                eventName: 'meaningful_action_completed',
                createdAt: {
                    gte: input.from,
                    lte: input.to,
                },
            },
        }),
    ])

    const eventUsers = usersByEvent(motivationEvents)
    const meaningfulUserIds = uniqueUserIds(meaningfulActions)
    const weeklyProgressUserIds = weeklyProgressUsers(meaningfulActions)
    const rewardUsers = eventUsers.reward_redeem_requested
    const motivationUserIds = uniqueUserIds(motivationEvents)

    return {
        range: {
            from: input.from.toISOString(),
            to: input.to.toISOString(),
        },
        counts: {
            motivationUsers: motivationUserIds.length,
            meaningfulActionUsers: meaningfulUserIds.length,
            rewardOnlyUsers: rewardUsers.filter((userId) => !meaningfulUserIds.includes(userId)).length,
            weeklyProgressOverlapUsers: motivationUserIds.filter((userId) => weeklyProgressUserIds.includes(userId)).length,
        },
        missions: {
            claims: countEvents(motivationEvents, 'mission_claimed'),
            users: eventUsers.mission_claimed.length,
        },
        streaks: {
            advanced: countEvents(motivationEvents, 'streak_advanced'),
            advancedUsers: eventUsers.streak_advanced.length,
            freezeUsed: countEvents(motivationEvents, 'streak_freeze_used'),
            freezeUsedUsers: eventUsers.streak_freeze_used.length,
            reset: countEvents(motivationEvents, 'streak_reset'),
            resetUsers: eventUsers.streak_reset.length,
        },
        fucoin: {
            earnedEvents: countEvents(motivationEvents, 'fucoin_earned'),
            earnedUsers: eventUsers.fucoin_earned.length,
            totalEarned: sumMetadataNumber(motivationEvents, 'fucoin_earned', 'amount'),
            capReachedUsers: usersWithMetadataFlag(motivationEvents, 'fucoin_earned', 'cap_reached').length,
        },
        rewards: {
            redeemRequests: countEvents(motivationEvents, 'reward_redeem_requested'),
            redeemRequestUsers: rewardUsers.length,
            approvedSpends: countEvents(motivationEvents, 'reward_redeem_approved'),
            approvedSpendUsers: eventUsers.reward_redeem_approved.length,
            fulfilledRewards: countEvents(motivationEvents, 'reward_redeem_fulfilled'),
            fulfilledRewardUsers: eventUsers.reward_redeem_fulfilled.length,
            rejectedRequests: countEvents(motivationEvents, 'reward_redeem_rejected'),
            rejectedRequestUsers: eventUsers.reward_redeem_rejected.length,
            totalFucoinSpent: sumMetadataNumber(motivationEvents, 'reward_redeem_approved', 'cost'),
            rewardOnlyUsers: rewardUsers.filter((userId) => !meaningfulUserIds.includes(userId)).length,
        },
        splits: {
            missionClaimsByPeriod: splitMetadata(motivationEvents, 'mission_claimed', 'period'),
            fucoinEarnedBySourceType: splitMetadata(motivationEvents, 'fucoin_earned', 'source_type'),
            rewardRequestsByCategory: splitMetadata(motivationEvents, 'reward_redeem_requested', 'category'),
            rewardApprovalsByCategory: splitMetadata(motivationEvents, 'reward_redeem_approved', 'category'),
            rewardFulfillmentsByCategory: splitMetadata(motivationEvents, 'reward_redeem_fulfilled', 'category'),
            rewardRejectionsByCategory: splitMetadata(motivationEvents, 'reward_redeem_rejected', 'category'),
        },
    }
}

type AnalyticsEventRecord = Awaited<ReturnType<AnalyticsDbClient['analyticsEvent']['findMany']>>[number]
type MotivationEventName = typeof MOTIVATION_EVENT_NAMES[number]

function usersByEvent(events: AnalyticsEventRecord[]): Record<MotivationEventName, string[]> {
    return Object.fromEntries(
        MOTIVATION_EVENT_NAMES.map((eventName) => [
            eventName,
            uniqueUserIds(events.filter((event) => event.eventName === eventName)),
        ])
    ) as Record<MotivationEventName, string[]>
}

function countEvents(events: AnalyticsEventRecord[], eventName: MotivationEventName) {
    return events.filter((event) => event.eventName === eventName).length
}

function uniqueUserIds(events: AnalyticsEventRecord[]) {
    return [...new Set(events.map((event) => event.userId))]
}

function weeklyProgressUsers(events: AnalyticsEventRecord[]) {
    const counts = new Map<string, Set<string>>()

    for (const event of events) {
        const actionId = event.actionId ?? 'missing_action'
        const actionType = event.actionType ?? 'unknown'
        const key = `${actionId}:${actionType}`
        const current = counts.get(event.userId) ?? new Set<string>()
        current.add(key)
        counts.set(event.userId, current)
    }

    return [...counts.entries()]
        .filter(([, actionKeys]) => actionKeys.size >= 3)
        .map(([userId]) => userId)
}

function sumMetadataNumber(
    events: AnalyticsEventRecord[],
    eventName: MotivationEventName,
    key: string,
) {
    return events
        .filter((event) => event.eventName === eventName)
        .reduce((sum, event) => {
            const value = metadataRecord(event.metadata)?.[key]
            return sum + (typeof value === 'number' ? value : 0)
        }, 0)
}

function usersWithMetadataFlag(
    events: AnalyticsEventRecord[],
    eventName: MotivationEventName,
    key: string,
) {
    return uniqueUserIds(events.filter((event) => (
        event.eventName === eventName
        && metadataRecord(event.metadata)?.[key] === true
    )))
}

function splitMetadata(
    events: AnalyticsEventRecord[],
    eventName: MotivationEventName,
    key: string,
) {
    const buckets = new Map<string, { events: number; users: Set<string> }>()

    for (const event of events.filter((item) => item.eventName === eventName)) {
        const value = metadataRecord(event.metadata)?.[key]
        const bucketKey = typeof value === 'string' ? value : 'unknown'
        const bucket = buckets.get(bucketKey) ?? { events: 0, users: new Set<string>() }
        bucket.events += 1
        bucket.users.add(event.userId)
        buckets.set(bucketKey, bucket)
    }

    return [...buckets.entries()]
        .map(([key, value]) => ({
            key,
            events: value.events,
            users: value.users.size,
        }))
        .sort((a, b) => b.events - a.events || a.key.localeCompare(b.key))
}

function metadataRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null
    return value as Record<string, unknown>
}
