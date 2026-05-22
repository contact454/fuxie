import { prisma, type Prisma, type UserRole } from '@fuxie/database'

export const ANALYTICS_EVENT_NAMES = [
    'dashboard_next_action_clicked',
    'dashboard_secondary_action_clicked',
    'onboarding_completed',
    'meaningful_action_completed',
    'activation_completed',
    'mission_claimed',
    'streak_advanced',
    'streak_freeze_used',
    'streak_reset',
    'fucoin_earned',
    'reward_redeem_requested',
    'reward_redeem_approved',
    'reward_redeem_rejected',
    'reward_redeem_fulfilled',
    'gamification_intervention_shown',
    'gamification_intervention_clicked',
    'mastery_progress_viewed',
    'badge_unlocked',
    'badge_receipt_clicked',
    'quest_episode_started',
    'quest_episode_checkpoint_reached',
    'quest_episode_practice_note',
    'quest_episode_completed',
    'ai_feedback_generated',
    'ai_feedback_failed',
    'quest_cta_clicked',
] as const

export const ANALYTICS_ACTION_TYPES = [
    'srs_review',
    'vocabulary_practice',
    'reading_task',
    'listening_task',
    'writing_submission',
    'speaking_submission',
    'exam_practice',
    'lesson_session',
    'first_session_path',
] as const

export type AnalyticsEventName = typeof ANALYTICS_EVENT_NAMES[number]
export type AnalyticsActionType = typeof ANALYTICS_ACTION_TYPES[number]

export type AnalyticsDbClient = typeof prisma | Prisma.TransactionClient

export interface RecordAnalyticsEventInput {
    userId: string
    role: UserRole
    eventName: AnalyticsEventName
    source?: string | null
    sessionId?: string | null
    route?: string | null
    actionId?: string | null
    actionType?: AnalyticsActionType | null
    level?: string | null
    skill?: string | null
    metadata?: Prisma.InputJsonValue | null
    createdAt?: Date
}

const FORBIDDEN_METADATA_KEY = /(answer|audio|chat|content|message|prompt|secret|stack|submission|text|token|transcript)/i
const MAX_METADATA_STRING_LENGTH = 256

export async function recordAnalyticsEvent(
    db: AnalyticsDbClient,
    input: RecordAnalyticsEventInput,
) {
    const metadata = sanitizeAnalyticsMetadata(input.metadata)

    return db.analyticsEvent.create({
        data: {
            userId: input.userId,
            role: input.role,
            eventName: input.eventName,
            source: input.source ?? null,
            sessionId: input.sessionId ?? null,
            route: input.route ?? null,
            actionId: input.actionId ?? null,
            actionType: input.actionType ?? null,
            level: input.level ?? null,
            skill: input.skill ?? null,
            ...(metadata === null ? {} : { metadata }),
            ...(input.createdAt ? { createdAt: input.createdAt } : {}),
        },
    })
}

export async function findFirstActivationCompletion(input: {
    userId: string
    onboardingCompletedAt: Date
    db?: AnalyticsDbClient
}) {
    const db = input.db ?? prisma
    const windowEnd = new Date(input.onboardingCompletedAt)
    windowEnd.setHours(windowEnd.getHours() + 24)

    return db.analyticsEvent.findFirst({
        where: {
            userId: input.userId,
            role: 'LEARNER',
            eventName: 'meaningful_action_completed',
            createdAt: {
                gte: input.onboardingCompletedAt,
                lte: windowEnd,
            },
        },
        orderBy: { createdAt: 'asc' },
    })
}

export async function deriveAndRecordActivation(input: {
    userId: string
    db?: AnalyticsDbClient
}) {
    const db = input.db ?? prisma
    const existingActivation = await db.analyticsEvent.findFirst({
        where: {
            userId: input.userId,
            role: 'LEARNER',
            eventName: 'activation_completed',
        },
        orderBy: { createdAt: 'asc' },
    })

    if (existingActivation) {
        return { activated: false, reason: 'already_activated' as const, event: existingActivation }
    }

    const onboarding = await db.analyticsEvent.findFirst({
        where: {
            userId: input.userId,
            role: 'LEARNER',
            eventName: 'onboarding_completed',
        },
        orderBy: { createdAt: 'asc' },
    })

    if (!onboarding) {
        return { activated: false, reason: 'missing_onboarding' as const, event: null }
    }

    const completion = await findFirstActivationCompletion({
        userId: input.userId,
        onboardingCompletedAt: onboarding.createdAt,
        db,
    })

    if (!completion) {
        return { activated: false, reason: 'missing_completion' as const, event: null }
    }

    const hoursToActivation = roundToTwoDecimals(
        (completion.createdAt.getTime() - onboarding.createdAt.getTime()) / (1000 * 60 * 60)
    )
    const activationActionType = completion.actionType ?? 'unknown'
    const event = await recordAnalyticsEvent(db, {
        userId: input.userId,
        role: 'LEARNER',
        eventName: 'activation_completed',
        source: 'activation.derivation',
        actionId: completion.actionId,
        actionType: completion.actionType as AnalyticsActionType | null,
        level: completion.level,
        skill: completion.skill,
        metadata: {
            activation_action_type: activationActionType,
            hours_to_activation: hoursToActivation,
            cohort_date: toDateKey(onboarding.createdAt),
            activation_source: completion.source ?? null,
        },
    })

    return { activated: true, reason: 'created' as const, event }
}

function roundToTwoDecimals(value: number) {
    return Math.round(value * 100) / 100
}

function toDateKey(date: Date) {
    return date.toISOString().slice(0, 10)
}

export function isAnalyticsEventName(value: unknown): value is AnalyticsEventName {
    return typeof value === 'string' && ANALYTICS_EVENT_NAMES.includes(value as AnalyticsEventName)
}

export function isAnalyticsActionType(value: unknown): value is AnalyticsActionType {
    return typeof value === 'string' && ANALYTICS_ACTION_TYPES.includes(value as AnalyticsActionType)
}

export function sanitizeAnalyticsMetadata(value: Prisma.InputJsonValue | null | undefined): Prisma.InputJsonValue | null {
    if (value === undefined || value === null) return null
    assertSafeMetadata(value, [])
    return value
}

function assertSafeMetadata(value: Prisma.InputJsonValue, path: string[]) {
    if (value === null || typeof value === 'number' || typeof value === 'boolean') return
    if (typeof value === 'string') {
        if (value.length > MAX_METADATA_STRING_LENGTH) {
            throw new Error(`Analytics metadata string too long at ${path.join('.') || 'metadata'}`)
        }
        return
    }
    if (Array.isArray(value)) {
        for (const [index, item] of value.entries()) {
            assertSafeMetadata(item as Prisma.InputJsonValue, [...path, String(index)])
        }
        return
    }

    for (const [key, item] of Object.entries(value)) {
        if (FORBIDDEN_METADATA_KEY.test(key)) {
            throw new Error(`Analytics metadata key is not allowed: ${key}`)
        }
        assertSafeMetadata(item as Prisma.InputJsonValue, [...path, key])
    }
}
