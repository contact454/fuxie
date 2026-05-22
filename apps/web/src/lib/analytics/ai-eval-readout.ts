import { prisma } from '@fuxie/database'
import type { AnalyticsDbClient } from './events'

export interface AiEvalReadoutInput {
    from: Date
    to: Date
    db?: AnalyticsDbClient
}

const AI_EVAL_EVENT_NAMES = ['ai_feedback_generated', 'ai_feedback_failed'] as const

export async function getAiEvalReadout(input: AiEvalReadoutInput) {
    const db = input.db ?? prisma
    const events = await db.analyticsEvent.findMany({
        where: {
            role: 'LEARNER',
            eventName: { in: [...AI_EVAL_EVENT_NAMES] },
            createdAt: {
                gte: input.from,
                lte: input.to,
            },
        },
    })

    const generatedEvents = events.filter((event) => event.eventName === 'ai_feedback_generated')
    const failedEvents = events.filter((event) => event.eventName === 'ai_feedback_failed')

    return {
        range: {
            from: input.from.toISOString(),
            to: input.to.toISOString(),
        },
        counts: {
            aiEvalUsers: uniqueUserIds(events).length,
            generatedEvents: generatedEvents.length,
            generatedUsers: uniqueUserIds(generatedEvents).length,
            failedEvents: failedEvents.length,
            failedUsers: uniqueUserIds(failedEvents).length,
        },
        rates: {
            failureRate: percent(failedEvents.length, events.length),
        },
        quality: {
            writing: scoreSummary(generatedEvents, 'writing'),
            speaking: scoreSummary(generatedEvents, 'speaking'),
            chat: {
                generatedEvents: flowEvents(generatedEvents, 'chat').length,
                averageCorrectionCount: averageMetadataNumber(flowEvents(generatedEvents, 'chat'), 'correction_count'),
                averageSuggestedFollowupCount: averageMetadataNumber(flowEvents(generatedEvents, 'chat'), 'suggested_followup_count'),
            },
            averageCorrectionCount: averageMetadataNumber(generatedEvents, 'correction_count'),
            averageIssueCount: averageMetadataNumber(generatedEvents, 'issue_count'),
        },
        splits: {
            byFlow: splitByMetadata(events, 'flow'),
            generatedByFlow: splitByMetadata(generatedEvents, 'flow'),
            failuresByFlow: splitByMetadata(failedEvents, 'flow'),
            byLevel: splitByField(events, (event) => event.level ?? 'unknown'),
            bySkill: splitByField(events, (event) => event.skill ?? 'unknown'),
            byModel: splitByMetadata(generatedEvents, 'model'),
            byEstimatedLevel: splitByMetadata(generatedEvents, 'estimated_level'),
            failuresByErrorType: splitByMetadata(failedEvents, 'error_type'),
        },
    }
}

type AnalyticsEventRecord = Awaited<ReturnType<AnalyticsDbClient['analyticsEvent']['findMany']>>[number]
type AiFlow = 'writing' | 'speaking' | 'chat'

function scoreSummary(events: AnalyticsEventRecord[], flow: AiFlow) {
    const scopedEvents = flowEvents(events, flow)
    const scores = scopedEvents
        .map((event) => metadataNumber(event, 'score_percent'))
        .filter(isNumber)

    return {
        generatedEvents: scopedEvents.length,
        averageScorePercent: average(scores),
        medianScorePercent: median(scores),
    }
}

function flowEvents(events: AnalyticsEventRecord[], flow: AiFlow) {
    return events.filter((event) => metadataRecord(event.metadata)?.flow === flow)
}

function splitByField(
    events: AnalyticsEventRecord[],
    getKey: (event: AnalyticsEventRecord) => string,
) {
    const buckets = new Map<string, { events: number; users: Set<string> }>()

    for (const event of events) {
        const key = getKey(event)
        const bucket = buckets.get(key) ?? { events: 0, users: new Set<string>() }
        bucket.events += 1
        bucket.users.add(event.userId)
        buckets.set(key, bucket)
    }

    return sortBuckets(buckets)
}

function splitByMetadata(events: AnalyticsEventRecord[], key: string) {
    return splitByField(events, (event) => {
        const value = metadataRecord(event.metadata)?.[key]
        return typeof value === 'string' ? value : 'unknown'
    })
}

function sortBuckets(buckets: Map<string, { events: number; users: Set<string> }>) {
    return [...buckets.entries()]
        .map(([key, value]) => ({
            key,
            events: value.events,
            users: value.users.size,
        }))
        .sort((a, b) => b.events - a.events || a.key.localeCompare(b.key))
}

function averageMetadataNumber(events: AnalyticsEventRecord[], key: string) {
    return average(events.map((event) => metadataNumber(event, key)).filter(isNumber))
}

function metadataNumber(event: AnalyticsEventRecord, key: string) {
    const value = metadataRecord(event.metadata)?.[key]
    return typeof value === 'number' ? value : null
}

function uniqueUserIds(events: AnalyticsEventRecord[]) {
    return [...new Set(events.map((event) => event.userId))]
}

function metadataRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null
    return value as Record<string, unknown>
}

function percent(numerator: number, denominator: number) {
    if (denominator <= 0) return 0
    return Math.round((numerator / denominator) * 10000) / 100
}

function average(values: number[]) {
    if (values.length === 0) return null
    return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100
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

function isNumber(value: number | null): value is number {
    return typeof value === 'number'
}
