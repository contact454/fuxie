import { prisma } from '@fuxie/database'
import type { AnalyticsDbClient } from './events'

export interface LearningProgressReadoutInput {
    from: Date
    to: Date
    db?: AnalyticsDbClient
}

export async function getLearningProgressReadout(input: LearningProgressReadoutInput) {
    const db = input.db ?? prisma

    const [onboardingEvents, progressCompletions, activationEvents] = await Promise.all([
        db.analyticsEvent.findMany({
            where: {
                role: 'LEARNER',
                eventName: 'onboarding_completed',
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
        db.analyticsEvent.findMany({
            where: {
                role: 'LEARNER',
                eventName: 'activation_completed',
                createdAt: {
                    gte: input.from,
                    lte: input.to,
                },
            },
            orderBy: { createdAt: 'asc' },
        }),
    ])

    const eligibleUserIds = uniqueUserIds([...onboardingEvents, ...progressCompletions])
    const dedupedProgressCompletions = dedupeMeaningfulActions(progressCompletions)
    const weeklyProgress = buildWeeklyProgressReadout({
        eligibleUserIds,
        completions: dedupedProgressCompletions,
    })
    const retention = await buildRetentionReadout({
        db,
        activationEvents,
    })

    return {
        range: {
            from: input.from.toISOString(),
            to: input.to.toISOString(),
        },
        weeklyProgress,
        retention,
    }
}

type AnalyticsEventRecord = Awaited<ReturnType<AnalyticsDbClient['analyticsEvent']['findMany']>>[number]

function buildWeeklyProgressReadout(input: {
    eligibleUserIds: string[]
    completions: AnalyticsEventRecord[]
}) {
    const countsByUser = new Map(input.eligibleUserIds.map((userId) => [userId, 0]))

    for (const completion of input.completions) {
        countsByUser.set(completion.userId, (countsByUser.get(completion.userId) ?? 0) + 1)
    }

    const actionCounts = [...countsByUser.values()]
    const reachedUsers = actionCounts.filter((count) => count >= 3).length
    const eligibleLearners = input.eligibleUserIds.length

    return {
        counts: {
            eligibleLearners,
            reachedWeeklyProgressUsers: reachedUsers,
        },
        rate: percent(reachedUsers, eligibleLearners),
        medianActionCount: median(actionCounts),
        distribution: {
            zero: actionCounts.filter((count) => count === 0).length,
            one: actionCounts.filter((count) => count === 1).length,
            two: actionCounts.filter((count) => count === 2).length,
            threePlus: actionCounts.filter((count) => count >= 3).length,
        },
        actionMix: splitEvents(input.completions, (event) => event.actionType ?? 'unknown'),
        levelSplit: splitEvents(input.completions, (event) => event.level ?? 'unknown'),
        skillSplit: splitEvents(input.completions, (event) => event.skill ?? 'unknown'),
    }
}

async function buildRetentionReadout(input: {
    db: AnalyticsDbClient
    activationEvents: AnalyticsEventRecord[]
}) {
    const activationsByUser = firstEventByUser(input.activationEvents)
    const activatedUserIds = [...activationsByUser.keys()]

    if (activatedUserIds.length === 0) {
        return emptyRetentionReadout()
    }

    const latestRetentionEnd = maxDate(
        [...activationsByUser.values()].map((event) => addDays(event.createdAt, 31))
    )

    const completions = await input.db.analyticsEvent.findMany({
        where: {
            userId: { in: activatedUserIds },
            role: 'LEARNER',
            eventName: 'meaningful_action_completed',
            createdAt: {
                gte: minDate([...activationsByUser.values()].map((event) => event.createdAt)),
                lt: latestRetentionEnd,
            },
        },
    })

    return {
        activatedLearners: activatedUserIds.length,
        d1: retentionBucket(activationsByUser, completions, 1),
        d7: retentionBucket(activationsByUser, completions, 7),
        d30: retentionBucket(activationsByUser, completions, 30),
    }
}

function retentionBucket(
    activationsByUser: Map<string, AnalyticsEventRecord>,
    completions: AnalyticsEventRecord[],
    dayOffset: number,
) {
    const retainedUserIds = new Set<string>()

    for (const [userId, activation] of activationsByUser) {
        const windowStart = addDays(activation.createdAt, dayOffset)
        const windowEnd = addDays(activation.createdAt, dayOffset + 1)
        const retained = completions.some((completion) =>
            completion.userId === userId
            && completion.createdAt >= windowStart
            && completion.createdAt < windowEnd
        )

        if (retained) retainedUserIds.add(userId)
    }

    return {
        retainedUsers: retainedUserIds.size,
        rate: percent(retainedUserIds.size, activationsByUser.size),
    }
}

function emptyRetentionReadout() {
    return {
        activatedLearners: 0,
        d1: { retainedUsers: 0, rate: 0 },
        d7: { retainedUsers: 0, rate: 0 },
        d30: { retainedUsers: 0, rate: 0 },
    }
}

function dedupeMeaningfulActions(events: AnalyticsEventRecord[]) {
    const unique = new Map<string, AnalyticsEventRecord>()

    for (const event of events) {
        const actionId = event.actionId ?? 'missing_action'
        const actionType = event.actionType ?? 'unknown'
        const key = `${event.userId}:${actionId}:${actionType}`
        const existing = unique.get(key)

        if (!existing || event.createdAt < existing.createdAt) {
            unique.set(key, event)
        }
    }

    return [...unique.values()]
}

function splitEvents(
    events: AnalyticsEventRecord[],
    getKey: (event: AnalyticsEventRecord) => string,
) {
    const buckets = new Map<string, { completions: number; users: Set<string> }>()

    for (const event of events) {
        const key = getKey(event)
        const bucket = buckets.get(key) ?? { completions: 0, users: new Set<string>() }
        bucket.completions += 1
        bucket.users.add(event.userId)
        buckets.set(key, bucket)
    }

    return [...buckets.entries()]
        .map(([key, value]) => ({
            key,
            completions: value.completions,
            users: value.users.size,
        }))
        .sort((a, b) => b.completions - a.completions || a.key.localeCompare(b.key))
}

function uniqueUserIds(events: AnalyticsEventRecord[]) {
    return [...new Set(events.map((event) => event.userId))]
}

function firstEventByUser(events: AnalyticsEventRecord[]) {
    const result = new Map<string, AnalyticsEventRecord>()

    for (const event of events) {
        const existing = result.get(event.userId)
        if (!existing || event.createdAt < existing.createdAt) {
            result.set(event.userId, event)
        }
    }

    return result
}

function percent(numerator: number, denominator: number) {
    if (denominator <= 0) return 0
    return Math.round((numerator / denominator) * 10000) / 100
}

function median(values: number[]) {
    if (values.length === 0) return null
    const sorted = [...values].sort((a, b) => a - b)
    const middle = Math.floor(sorted.length / 2)

    if (sorted.length % 2 === 1) {
        return sorted[middle]!
    }

    return Math.round(((sorted[middle - 1]! + sorted[middle]!) / 2) * 100) / 100
}

function addDays(date: Date, days: number) {
    const next = new Date(date)
    next.setUTCDate(next.getUTCDate() + days)
    return next
}

function minDate(values: Date[]) {
    return new Date(Math.min(...values.map((value) => value.getTime())))
}

function maxDate(values: Date[]) {
    return new Date(Math.max(...values.map((value) => value.getTime())))
}
