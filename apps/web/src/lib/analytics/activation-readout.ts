import { prisma } from '@fuxie/database'
import type { AnalyticsDbClient } from './events'

export interface ActivationReadoutInput {
    from: Date
    to: Date
    db?: AnalyticsDbClient
}

export async function getActivationReadout(input: ActivationReadoutInput) {
    const db = input.db ?? prisma
    const cohortWindowEnd = new Date(input.to)
    cohortWindowEnd.setHours(cohortWindowEnd.getHours() + 24)

    const onboardingEvents = await db.analyticsEvent.findMany({
        where: {
            role: 'LEARNER',
            eventName: 'onboarding_completed',
            createdAt: {
                gte: input.from,
                lte: input.to,
            },
        },
        orderBy: { createdAt: 'asc' },
    })

    const onboardedUserIds = [...new Set(onboardingEvents.map((event) => event.userId))]

    if (onboardedUserIds.length === 0) {
        return emptyActivationReadout(input.from, input.to)
    }

    const [dashboardClicks, completions, activations] = await Promise.all([
        db.analyticsEvent.findMany({
            where: {
                userId: { in: onboardedUserIds },
                role: 'LEARNER',
                eventName: 'dashboard_next_action_clicked',
                createdAt: {
                    gte: input.from,
                    lte: cohortWindowEnd,
                },
            },
        }),
        db.analyticsEvent.findMany({
            where: {
                userId: { in: onboardedUserIds },
                role: 'LEARNER',
                eventName: 'meaningful_action_completed',
                createdAt: {
                    gte: input.from,
                    lte: cohortWindowEnd,
                },
            },
        }),
        db.analyticsEvent.findMany({
            where: {
                userId: { in: onboardedUserIds },
                role: 'LEARNER',
                eventName: 'activation_completed',
            },
            orderBy: { createdAt: 'asc' },
        }),
    ])

    const firstOnboardingByUser = firstEventByUser(onboardingEvents)
    const eligibleDashboardClicks = dashboardClicks.filter((event) =>
        isWithinUserActivationWindow(event, firstOnboardingByUser)
    )
    const eligibleCompletions = completions.filter((event) =>
        isWithinUserActivationWindow(event, firstOnboardingByUser)
    )
    const activatedUserIds = uniqueUsers(activations)
    const onboardedLearners = onboardedUserIds.length

    return {
        range: {
            from: input.from.toISOString(),
            to: input.to.toISOString(),
        },
        counts: {
            onboardedLearners,
            dashboardPrimaryClickUsers: uniqueUsers(eligibleDashboardClicks).length,
            meaningfulCompletionUsers: uniqueUsers(eligibleCompletions).length,
            activatedUsers: activatedUserIds.length,
        },
        rates: {
            dashboardClickRate: percent(uniqueUsers(eligibleDashboardClicks).length, onboardedLearners),
            meaningfulCompletionRate: percent(uniqueUsers(eligibleCompletions).length, onboardedLearners),
            activationRate: percent(activatedUserIds.length, onboardedLearners),
        },
        medianHoursToActivation: median(activations.map(hoursToActivation).filter(isNumber)),
        activationByActionType: actionTypeSplit(activations),
    }
}

function emptyActivationReadout(from: Date, to: Date) {
    return {
        range: {
            from: from.toISOString(),
            to: to.toISOString(),
        },
        counts: {
            onboardedLearners: 0,
            dashboardPrimaryClickUsers: 0,
            meaningfulCompletionUsers: 0,
            activatedUsers: 0,
        },
        rates: {
            dashboardClickRate: 0,
            meaningfulCompletionRate: 0,
            activationRate: 0,
        },
        medianHoursToActivation: null,
        activationByActionType: [] as Array<{ actionType: string; activatedUsers: number }>,
    }
}

type AnalyticsEventRecord = Awaited<ReturnType<AnalyticsDbClient['analyticsEvent']['findMany']>>[number]

function uniqueUsers(events: AnalyticsEventRecord[]) {
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

function isWithinUserActivationWindow(
    event: AnalyticsEventRecord,
    firstOnboardingByUser: Map<string, AnalyticsEventRecord>
) {
    const onboarding = firstOnboardingByUser.get(event.userId)
    if (!onboarding) return false

    const windowEnd = new Date(onboarding.createdAt)
    windowEnd.setHours(windowEnd.getHours() + 24)

    return event.createdAt >= onboarding.createdAt && event.createdAt <= windowEnd
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

function hoursToActivation(event: AnalyticsEventRecord) {
    const value = metadataRecord(event.metadata)?.hours_to_activation
    return typeof value === 'number' ? value : null
}

function actionTypeSplit(events: AnalyticsEventRecord[]) {
    const uniqueByUser = new Map<string, AnalyticsEventRecord>()
    for (const event of events) {
        if (!uniqueByUser.has(event.userId)) {
            uniqueByUser.set(event.userId, event)
        }
    }

    const counts = new Map<string, number>()
    for (const event of uniqueByUser.values()) {
        const actionType = event.actionType
            ?? stringValue(metadataRecord(event.metadata)?.activation_action_type)
            ?? 'unknown'
        counts.set(actionType, (counts.get(actionType) ?? 0) + 1)
    }

    return [...counts.entries()]
        .map(([actionType, activatedUsers]) => ({ actionType, activatedUsers }))
        .sort((a, b) => b.activatedUsers - a.activatedUsers || a.actionType.localeCompare(b.actionType))
}

function metadataRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null
    return value as Record<string, unknown>
}

function stringValue(value: unknown) {
    return typeof value === 'string' ? value : null
}

function isNumber(value: number | null): value is number {
    return typeof value === 'number'
}
