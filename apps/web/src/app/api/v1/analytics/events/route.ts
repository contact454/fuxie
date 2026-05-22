import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma, type Prisma } from '@fuxie/database'
import { withDbAuth } from '@/lib/auth/middleware'
import { handleApiError } from '@/lib/api/error-handler'
import {
    ANALYTICS_ACTION_TYPES,
    recordAnalyticsEvent,
    sanitizeAnalyticsMetadata,
} from '@/lib/analytics/events'

const CLIENT_ANALYTICS_EVENT_NAMES = [
    'dashboard_next_action_clicked',
    'dashboard_secondary_action_clicked',
    'gamification_intervention_shown',
    'gamification_intervention_clicked',
    'mastery_progress_viewed',
    'badge_receipt_clicked',
    'quest_episode_started',
    'quest_episode_checkpoint_reached',
    'quest_episode_practice_note',
    'quest_episode_completed',
] as const

const analyticsEventSchema = z.object({
    eventName: z.enum(CLIENT_ANALYTICS_EVENT_NAMES),
    source: z.string().max(120).nullable().optional(),
    sessionId: z.string().max(120).nullable().optional(),
    route: z.string().max(240).nullable().optional(),
    actionId: z.string().max(180).nullable().optional(),
    actionType: z.enum(ANALYTICS_ACTION_TYPES).nullable().optional(),
    level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).nullable().optional(),
    skill: z.string().max(40).nullable().optional(),
    metadata: z.unknown().nullable().optional(),
})

export async function POST(req: NextRequest) {
    try {
        const auth = await withDbAuth(req)
        const body = await req.json()
        const data = analyticsEventSchema.parse(body)
        let metadata: Prisma.InputJsonValue | null
        try {
            metadata = sanitizeAnalyticsMetadata(data.metadata as Prisma.InputJsonValue | null | undefined)
        } catch {
            return NextResponse.json(
                { success: false, error: { code: 'UNSAFE_METADATA', message: 'Analytics metadata is not allowed' } },
                { status: 400 },
            )
        }

        await recordAnalyticsEvent(prisma, {
            userId: auth.userId,
            role: auth.role,
            eventName: data.eventName,
            source: data.source ?? defaultSource(data.eventName),
            sessionId: data.sessionId ?? null,
            route: data.route ?? null,
            actionId: data.actionId ?? null,
            actionType: data.actionType ?? null,
            level: data.level ?? null,
            skill: data.skill ?? null,
            metadata,
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return handleApiError(error)
    }
}

function defaultSource(eventName: string) {
    if (eventName === 'dashboard_next_action_clicked') return 'dashboard.quest.primary'
    if (eventName === 'dashboard_secondary_action_clicked') return 'dashboard.quest.card.secondary'
    if (eventName === 'gamification_intervention_shown') return 'dashboard.quest.intervention.shown'
    if (eventName === 'gamification_intervention_clicked') return 'dashboard.quest.intervention.clicked'
    if (eventName === 'mastery_progress_viewed') return 'dashboard.mastery.viewed'
    if (eventName === 'badge_receipt_clicked') return 'dashboard.mastery.badge_receipt.clicked'
    if (eventName === 'quest_episode_started') return 'vocabulary.quest_episode.started'
    if (eventName === 'quest_episode_checkpoint_reached') return 'vocabulary.quest_episode.checkpoint'
    if (eventName === 'quest_episode_practice_note') return 'speaking.roleplay.practice_note'
    if (eventName === 'quest_episode_completed') return 'vocabulary.quest_episode.completed'
    return null
}
