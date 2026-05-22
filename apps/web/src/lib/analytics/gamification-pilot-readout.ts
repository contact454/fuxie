import { Prisma, ShopRedeemRequestStatus, prisma } from '@fuxie/database'

import type { AnalyticsEventName } from './events'
import { buildMasteryAdminReadout } from '@/lib/gamification/skill-mastery'

export interface GamificationPilotReadoutInput {
    from: Date
    to: Date
    now?: Date
    db?: GamificationPilotDbClient
}

export type GamificationPilotDbClient = typeof prisma | Prisma.TransactionClient

const PILOT_EVENT_NAMES: AnalyticsEventName[] = [
    'dashboard_secondary_action_clicked',
    'meaningful_action_completed',
    'mission_claimed',
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
    'streak_advanced',
    'streak_freeze_used',
]

const REWARD_ONLY_WARNING_RATE = 20
const SPEND_TO_EARN_WARNING_RATE = 80
const PENDING_SLA_HOURS = 48

type PilotWarningCode =
    | 'reward_only_rate_high'
    | 'spend_to_earn_rate_high'
    | 'pending_reward_queue_over_sla'

type PilotWarningLevel = 'green' | 'yellow' | 'red'

export async function getGamificationPilotReadout(input: GamificationPilotReadoutInput) {
    const db = input.db ?? prisma
    const now = input.now ?? new Date()
    const pendingSlaCutoff = new Date(now.getTime() - PENDING_SLA_HOURS * 60 * 60 * 1000)

    const [events, shopRequests] = await Promise.all([
        db.analyticsEvent.findMany({
            where: {
                role: 'LEARNER',
                eventName: { in: PILOT_EVENT_NAMES },
                createdAt: {
                    gte: input.from,
                    lte: input.to,
                },
            },
        }),
        db.shopRedeemRequest.findMany({
            where: {
                OR: [
                    { requestedAt: { gte: input.from, lte: input.to } },
                    { reviewedAt: { gte: input.from, lte: input.to } },
                    { fulfilledAt: { gte: input.from, lte: input.to } },
                    { status: ShopRedeemRequestStatus.PENDING },
                    {
                        status: ShopRedeemRequestStatus.APPROVED,
                        fulfilledAt: null,
                    },
                ],
            },
            select: {
                id: true,
                userId: true,
                itemId: true,
                itemTitle: true,
                itemCategory: true,
                cost: true,
                status: true,
                statusReason: true,
                requestedAt: true,
                reviewedAt: true,
                fulfilledAt: true,
            },
        }),
    ])

    const meaningfulActions = events.filter((event) => event.eventName === 'meaningful_action_completed')
    const rewardRequestEvents = events.filter((event) => event.eventName === 'reward_redeem_requested')
    const interventionShownEvents = events.filter((event) => event.eventName === 'gamification_intervention_shown')
    const interventionClickedEvents = events.filter((event) => event.eventName === 'gamification_intervention_clicked')
    const episodeEvents = events.filter((event) => event.eventName.startsWith('quest_episode_'))
    const firstSessionPathEvents = events.filter((event) => (
        event.eventName === 'dashboard_secondary_action_clicked'
        && metadataRecord(event.metadata)?.pathId === 'a1-first-contact'
    ))
    const writingAiFeedbackEvents = events.filter((event) => (
        (event.eventName === 'ai_feedback_generated' || event.eventName === 'ai_feedback_failed')
        && (event.skill === 'SCHREIBEN' || event.skill === 'writing' || metadataRecord(event.metadata)?.flow === 'writing')
    ))
    const speakingPronunciationEvents = events.filter((event) => (
        (event.eventName === 'ai_feedback_generated' || event.eventName === 'ai_feedback_failed')
        && (event.skill === 'SPRECHEN' || event.skill === 'speaking' || metadataRecord(event.metadata)?.flow === 'speaking')
    ))
    const activeLearnerIds = uniqueUserIds([
        ...events,
        ...shopRequests.filter((request) => inRange(request.requestedAt, input)).map((request) => ({ userId: request.userId })),
    ])
    const meaningfulUserIds = uniqueUserIds(meaningfulActions)
    const rewardRequestUserIds = uniqueUserIds([
        ...rewardRequestEvents,
        ...shopRequests.filter((request) => inRange(request.requestedAt, input)).map((request) => ({ userId: request.userId })),
    ])
    const rewardOnlyUsers = rewardRequestUserIds.filter((userId) => !meaningfulUserIds.includes(userId))
    const totalFucoinEarned = sumMetadataNumber(events, 'fucoin_earned', 'amount')
    const approvedSpendRequests = shopRequests.filter((request) => (
        request.status === ShopRedeemRequestStatus.APPROVED
        && inRange(request.reviewedAt, input)
    ))
    const totalFucoinSpent = approvedSpendRequests.reduce((sum, request) => sum + request.cost, 0)
    const rewardOnlyRate = percent(rewardOnlyUsers.length, activeLearnerIds.length)
    const spendToEarnRate = totalFucoinEarned > 0
        ? percent(totalFucoinSpent, totalFucoinEarned)
        : totalFucoinSpent > 0 ? 100 : 0
    const pendingOverSla = shopRequests.filter((request) => (
        request.status === ShopRedeemRequestStatus.PENDING
        && request.requestedAt <= pendingSlaCutoff
    ))
    const warnings: PilotWarningCode[] = [
        ...(rewardOnlyRate > REWARD_ONLY_WARNING_RATE ? ['reward_only_rate_high' as const] : []),
        ...(totalFucoinSpent > 0 && spendToEarnRate > SPEND_TO_EARN_WARNING_RATE ? ['spend_to_earn_rate_high' as const] : []),
        ...(pendingOverSla.length > 0 ? ['pending_reward_queue_over_sla' as const] : []),
    ]
    const actions = buildPilotActions({
        warnings,
        rewardOnlyRate,
        spendToEarnRate,
        pendingOverSlaCount: pendingOverSla.length,
    })
    const summary = buildPilotSummary(actions, input)

    return {
        range: {
            from: input.from.toISOString(),
            to: input.to.toISOString(),
        },
        thresholds: {
            rewardOnlyWarningRate: REWARD_ONLY_WARNING_RATE,
            spendToEarnWarningRate: SPEND_TO_EARN_WARNING_RATE,
            pendingSlaHours: PENDING_SLA_HOURS,
        },
        counts: {
            activeLearners: activeLearnerIds.length,
            meaningfulActionUsers: meaningfulUserIds.length,
            meaningfulActions: meaningfulActions.length,
            rewardOnlyUsers: rewardOnlyUsers.length,
        },
        learningLoop: {
            lessonCompletionRate: percent(meaningfulUserIds.length, activeLearnerIds.length),
            repeatStudyWithin7DaysUsers: repeatStudyWithin7DaysUsers(meaningfulActions).length,
            repeatStudyWithin7DaysRate: percent(repeatStudyWithin7DaysUsers(meaningfulActions).length, meaningfulUserIds.length),
            missionClaimRate: percent(uniqueUserIds(events.filter((event) => event.eventName === 'mission_claimed')).length, activeLearnerIds.length),
            missionClaims: countEvents(events, 'mission_claimed'),
            streakAdvances: countEvents(events, 'streak_advanced'),
            streakFreezeUsed: countEvents(events, 'streak_freeze_used'),
        },
        interventions: {
            shown: interventionShownEvents.length,
            clicked: interventionClickedEvents.length,
            clickThroughRate: percent(uniqueUserIds(interventionClickedEvents).length, uniqueUserIds(interventionShownEvents).length),
            followThroughUsers: interventionFollowThroughUsers(interventionShownEvents, meaningfulActions).length,
            followThroughRate: percent(interventionFollowThroughUsers(interventionShownEvents, meaningfulActions).length, uniqueUserIds(interventionShownEvents).length),
            byCode: splitEvents(interventionShownEvents, (event) => String(metadataRecord(event.metadata)?.interventionCode ?? 'unknown')),
        },
        mastery: buildMasteryAdminReadout(events),
        questEpisodes: buildQuestEpisodeReadout(episodeEvents, meaningfulActions),
        lessonGameplay: buildLessonGameplayReadout(episodeEvents, firstSessionPathEvents),
        writingFeedback: buildWritingFeedbackReadout(writingAiFeedbackEvents, episodeEvents, meaningfulActions),
        speakingPronunciation: buildSpeakingPronunciationReadout(speakingPronunciationEvents, episodeEvents, meaningfulActions),
        economy: {
            fucoinEarned: totalFucoinEarned,
            fucoinSpent: totalFucoinSpent,
            spendToEarnRate,
            averageEarnedPerActiveLearner: average(totalFucoinEarned, activeLearnerIds.length),
            averageSpentPerActiveLearner: average(totalFucoinSpent, activeLearnerIds.length),
            rewardOnlyRate,
        },
        rewards: {
            requested: shopRequests.filter((request) => inRange(request.requestedAt, input)).length,
            pending: shopRequests.filter((request) => request.status === ShopRedeemRequestStatus.PENDING).length,
            pendingOverSla: pendingOverSla.length,
            approvedSpends: approvedSpendRequests.length,
            awaitingFulfillment: shopRequests.filter((request) => (
                request.status === ShopRedeemRequestStatus.APPROVED
                && !request.fulfilledAt
            )).length,
            fulfilled: shopRequests.filter((request) => inRange(request.fulfilledAt, input)).length,
            rejected: shopRequests.filter((request) => (
                request.status === ShopRedeemRequestStatus.REJECTED
                && inRange(request.reviewedAt, input)
            )).length,
        },
        health: {
            rewardOnly: healthStatus(rewardOnlyRate > REWARD_ONLY_WARNING_RATE),
            spendToEarn: healthStatus(totalFucoinSpent > 0 && spendToEarnRate > SPEND_TO_EARN_WARNING_RATE),
            pendingSla: healthStatus(pendingOverSla.length > 0),
            warnings,
            actions,
            warningLevel: summary.warningLevel,
            warningReason: summary.warningReason,
            recommendedAction: summary.recommendedAction,
            cohortLabel: summary.cohortLabel,
        },
        splits: {
            skill: splitEvents(meaningfulActions, (event) => event.skill ?? 'unknown'),
            level: splitEvents(meaningfulActions, (event) => event.level ?? 'unknown'),
            rewardRequestsByCategory: splitRequests(shopRequests.filter((request) => inRange(request.requestedAt, input)), (request) => request.itemCategory),
            rewardApprovalsByCategory: splitRequests(approvedSpendRequests, (request) => request.itemCategory),
            rewardFulfillmentsByCategory: splitRequests(shopRequests.filter((request) => inRange(request.fulfilledAt, input)), (request) => request.itemCategory),
            rejectedReasons: splitRequests(
                shopRequests.filter((request) => request.status === ShopRedeemRequestStatus.REJECTED && inRange(request.reviewedAt, input)),
                (request) => normalizeReason(request.statusReason),
            ),
        },
        opsPolicy: {
            approveOnlyRequestableDigitalRewards: true,
            rejectReasonRequiredForUnsupportedItems: true,
            fulfillmentReceiptRequired: true,
            realGiftLocked: true,
        },
    }
}

function buildLessonGameplayReadout(
    episodeEvents: AnalyticsEventRecord[],
    firstSessionPathEvents: AnalyticsEventRecord[],
) {
    const microgameEvents = episodeEvents.filter((event) => Boolean(metadataRecord(event.metadata)?.microgameId))
    const roleplayEvents = episodeEvents.filter((event) => Boolean(metadataRecord(event.metadata)?.scenarioId))
    const campaignEvents = episodeEvents.filter((event) => Boolean(metadataRecord(event.metadata)?.campaignNodeId))
    const microgameStarted = microgameEvents.filter((event) => event.eventName === 'quest_episode_started')
    const microgameCompleted = microgameEvents.filter((event) => event.eventName === 'quest_episode_completed')
    const roleplayStarted = roleplayEvents.filter((event) => event.eventName === 'quest_episode_started')
    const roleplayCompleted = roleplayEvents.filter((event) => event.eventName === 'quest_episode_completed')
    const roleplayPracticeNotes = roleplayEvents.filter((event) => event.eventName === 'quest_episode_practice_note')
    const firstSessionStarts = firstSessionPathEvents.filter((event) => event.eventName === 'dashboard_secondary_action_clicked')

    return {
        firstSessionPath: {
            starts: firstSessionStarts.length,
            users: uniqueUserIds(firstSessionStarts).length,
            bossToRoleplayFollowThroughUsers: bossToRoleplayFollowThroughUsers(firstSessionStarts, roleplayEvents).length,
            byStep: splitEvents(firstSessionPathEvents, (event) => String(metadataRecord(event.metadata)?.stepId ?? 'unknown')),
        },
        microgames: {
            started: microgameStarted.length,
            completed: microgameCompleted.length,
            completionRate: percent(uniqueUserIds(microgameCompleted).length, uniqueUserIds(microgameStarted).length),
            byGame: splitEvents(microgameEvents, (event) => String(metadataRecord(event.metadata)?.microgameId ?? 'unknown')),
            byTheme: splitEvents(microgameEvents, (event) => String(metadataRecord(event.metadata)?.themeSlug ?? 'unknown')),
        },
        roleplay: {
            started: roleplayStarted.length,
            completed: roleplayCompleted.length,
            practiceNotes: roleplayPracticeNotes.length,
            completionRate: percent(uniqueUserIds(roleplayCompleted).length, uniqueUserIds(roleplayStarted).length),
            byScenario: splitEvents(roleplayEvents, (event) => String(metadataRecord(event.metadata)?.scenarioId ?? 'unknown')),
            byReceiptState: splitEvents(roleplayEvents, (event) => String(metadataRecord(event.metadata)?.receiptState ?? (event.eventName === 'quest_episode_completed' ? 'completed_scored' : event.eventName === 'quest_episode_practice_note' ? 'practice_note' : 'started'))),
            byScoreBand: splitEvents(roleplayCompleted, (event) => String(metadataRecord(event.metadata)?.accuracyBand ?? scoreBandFromMetadata(event.metadata))),
        },
        campaign: {
            nodeStarts: campaignEvents.filter((event) => event.eventName === 'quest_episode_started').length,
            byNode: splitEvents(campaignEvents, (event) => String(metadataRecord(event.metadata)?.campaignNodeId ?? 'unknown')),
            byPath: splitEvents(campaignEvents, (event) => String(metadataRecord(event.metadata)?.campaignPathId ?? 'unknown')),
        },
    }
}

function buildSpeakingPronunciationReadout(
    speakingPronunciationEvents: AnalyticsEventRecord[],
    episodeEvents: AnalyticsEventRecord[],
    meaningfulActions: AnalyticsEventRecord[],
) {
    const generated = speakingPronunciationEvents.filter((event) => event.eventName === 'ai_feedback_generated')
    const failed = speakingPronunciationEvents.filter((event) => event.eventName === 'ai_feedback_failed')
    const speakingCompletedEpisodes = episodeEvents.filter((event) => (
        event.eventName === 'quest_episode_completed'
        && (event.skill === 'speaking' || metadataRecord(event.metadata)?.skill === 'speaking')
    ))

    return {
        submitted: generated.length + failed.length,
        evaluated: generated.length,
        feedbackGenerated: generated.length,
        feedbackFailed: failed.length,
        failureRate: percent(failed.length, generated.length + failed.length),
        meaningfulFollowThroughUsers: episodeFollowThroughUsers(speakingCompletedEpisodes, meaningfulActions).length,
        byFeedbackStatus: splitEvents(speakingPronunciationEvents, (event) => event.eventName.replace('ai_feedback_', '')),
        byErrorType: splitEvents(failed, (event) => String(metadataRecord(event.metadata)?.error_type ?? 'unknown')),
        byScoreBand: splitEvents(generated, (event) => scoreBandFromMetadata(event.metadata)),
    }
}

function buildWritingFeedbackReadout(
    writingAiFeedbackEvents: AnalyticsEventRecord[],
    episodeEvents: AnalyticsEventRecord[],
    meaningfulActions: AnalyticsEventRecord[],
) {
    const generated = writingAiFeedbackEvents.filter((event) => event.eventName === 'ai_feedback_generated')
    const failed = writingAiFeedbackEvents.filter((event) => event.eventName === 'ai_feedback_failed')
    const writingCompletedEpisodes = episodeEvents.filter((event) => (
        event.eventName === 'quest_episode_completed'
        && (event.skill === 'writing' || metadataRecord(event.metadata)?.skill === 'writing')
    ))

    return {
        submitted: generated.length + failed.length,
        graded: generated.length,
        feedbackGenerated: generated.length,
        feedbackFailed: failed.length,
        failureRate: percent(failed.length, generated.length + failed.length),
        meaningfulFollowThroughUsers: episodeFollowThroughUsers(writingCompletedEpisodes, meaningfulActions).length,
        byFeedbackStatus: splitEvents(writingAiFeedbackEvents, (event) => event.eventName.replace('ai_feedback_', '')),
        byErrorType: splitEvents(failed, (event) => String(metadataRecord(event.metadata)?.error_type ?? 'unknown')),
    }
}

function buildQuestEpisodeReadout(
    episodeEvents: AnalyticsEventRecord[],
    meaningfulActions: AnalyticsEventRecord[],
) {
    const started = episodeEvents.filter((event) => event.eventName === 'quest_episode_started')
    const checkpointReached = episodeEvents.filter((event) => event.eventName === 'quest_episode_checkpoint_reached')
    const completed = episodeEvents.filter((event) => event.eventName === 'quest_episode_completed')
    const startedUsers = uniqueUserIds(started)
    const completedUsers = uniqueUserIds(completed)
    const followThroughUsers = episodeFollowThroughUsers(completed, meaningfulActions)

    return {
        started: started.length,
        checkpointReached: checkpointReached.length,
        completed: completed.length,
        completionRate: percent(completedUsers.length, startedUsers.length),
        checkpointDropoff: Math.max(0, started.length - completed.length),
        repeatStudyAfterEpisodeUsers: followThroughUsers.length,
        repeatStudyAfterEpisodeRate: percent(followThroughUsers.length, completedUsers.length),
        bySkill: splitEvents(episodeEvents, (event) => event.skill ?? String(metadataRecord(event.metadata)?.skill ?? 'unknown')),
        byTheme: splitEvents(episodeEvents, (event) => String(metadataRecord(event.metadata)?.themeSlug ?? metadataRecord(event.metadata)?.theme_slug ?? 'unknown')),
        byLevel: splitEvents(episodeEvents, (event) => event.level ?? String(metadataRecord(event.metadata)?.cefrLevel ?? 'unknown')),
        byAccuracyBand: splitEvents(completed, (event) => String(metadataRecord(event.metadata)?.accuracyBand ?? 'unknown')),
        checkpointById: splitEvents(checkpointReached, (event) => String(metadataRecord(event.metadata)?.checkpointId ?? 'unknown')),
    }
}

type AnalyticsEventRecord = Awaited<ReturnType<GamificationPilotDbClient['analyticsEvent']['findMany']>>[number]
interface ShopRequestRecord {
    id: string
    userId: string
    itemId: string
    itemTitle: string
    itemCategory: string
    cost: number
    status: ShopRedeemRequestStatus
    statusReason: string | null
    requestedAt: Date
    reviewedAt: Date | null
    fulfilledAt: Date | null
}

function inRange(date: Date | null, input: { from: Date; to: Date }) {
    return Boolean(date && date >= input.from && date <= input.to)
}

function countEvents(events: AnalyticsEventRecord[], eventName: AnalyticsEventName) {
    return events.filter((event) => event.eventName === eventName).length
}

function sumMetadataNumber(events: AnalyticsEventRecord[], eventName: AnalyticsEventName, key: string) {
    return events
        .filter((event) => event.eventName === eventName)
        .reduce((sum, event) => {
            const value = metadataRecord(event.metadata)?.[key]
            return sum + (typeof value === 'number' ? value : 0)
        }, 0)
}

function repeatStudyWithin7DaysUsers(events: AnalyticsEventRecord[]) {
    const daysByUser = new Map<string, string[]>()

    for (const event of events) {
        const day = event.createdAt.toISOString().slice(0, 10)
        const days = daysByUser.get(event.userId) ?? []
        if (!days.includes(day)) days.push(day)
        daysByUser.set(event.userId, days.sort())
    }

    return [...daysByUser.entries()]
        .filter(([, days]) => {
            for (let start = 0; start < days.length; start += 1) {
                for (let end = start + 1; end < days.length; end += 1) {
                    if (daysApart(days[start]!, days[end]!) <= 7) return true
                }
            }
            return false
        })
        .map(([userId]) => userId)
}

function daysApart(start: string, end: string) {
    const startDate = new Date(`${start}T00:00:00.000Z`)
    const endDate = new Date(`${end}T00:00:00.000Z`)
    return Math.round((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))
}

function splitEvents(events: AnalyticsEventRecord[], getKey: (event: AnalyticsEventRecord) => string) {
    const buckets = new Map<string, { events: number; users: Set<string> }>()

    for (const event of events) {
        const key = getKey(event)
        const bucket = buckets.get(key) ?? { events: 0, users: new Set<string>() }
        bucket.events += 1
        bucket.users.add(event.userId)
        buckets.set(key, bucket)
    }

    return formatBuckets(buckets)
}

function splitRequests(requests: ShopRequestRecord[], getKey: (request: ShopRequestRecord) => string) {
    const buckets = new Map<string, { events: number; users: Set<string> }>()

    for (const request of requests) {
        const key = getKey(request)
        const bucket = buckets.get(key) ?? { events: 0, users: new Set<string>() }
        bucket.events += 1
        bucket.users.add(request.userId)
        buckets.set(key, bucket)
    }

    return formatBuckets(buckets)
}

function interventionFollowThroughUsers(
    interventionShownEvents: AnalyticsEventRecord[],
    meaningfulActions: AnalyticsEventRecord[],
) {
    const firstShownByUser = new Map<string, Date>()

    for (const event of interventionShownEvents) {
        const existing = firstShownByUser.get(event.userId)
        if (!existing || event.createdAt < existing) {
            firstShownByUser.set(event.userId, event.createdAt)
        }
    }

    const followedThrough = new Set<string>()
    for (const action of meaningfulActions) {
        const firstShownAt = firstShownByUser.get(action.userId)
        if (firstShownAt && action.createdAt >= firstShownAt) {
            followedThrough.add(action.userId)
        }
    }

    return [...followedThrough]
}

function episodeFollowThroughUsers(
    completedEvents: AnalyticsEventRecord[],
    meaningfulActions: AnalyticsEventRecord[],
) {
    const firstCompletedByUser = new Map<string, Date>()

    for (const event of completedEvents) {
        const existing = firstCompletedByUser.get(event.userId)
        if (!existing || event.createdAt < existing) {
            firstCompletedByUser.set(event.userId, event.createdAt)
        }
    }

    const followedThrough = new Set<string>()
    for (const action of meaningfulActions) {
        const completedAt = firstCompletedByUser.get(action.userId)
        if (completedAt && action.createdAt > completedAt) {
            followedThrough.add(action.userId)
        }
    }

    return [...followedThrough]
}

function bossToRoleplayFollowThroughUsers(
    firstSessionPathEvents: AnalyticsEventRecord[],
    roleplayEvents: AnalyticsEventRecord[],
) {
    const bossClickedByUser = new Map<string, Date>()

    for (const event of firstSessionPathEvents) {
        if (metadataRecord(event.metadata)?.stepId !== 'boss-review') continue
        const existing = bossClickedByUser.get(event.userId)
        if (!existing || event.createdAt < existing) {
            bossClickedByUser.set(event.userId, event.createdAt)
        }
    }

    const followedThrough = new Set<string>()
    for (const event of roleplayEvents) {
        if (metadataRecord(event.metadata)?.scenarioId !== 'self-intro') continue
        const clickedAt = bossClickedByUser.get(event.userId)
        if (clickedAt && event.createdAt >= clickedAt) {
            followedThrough.add(event.userId)
        }
    }

    return [...followedThrough]
}

function formatBuckets(buckets: Map<string, { events: number; users: Set<string> }>) {
    return [...buckets.entries()]
        .map(([key, value]) => ({
            key,
            events: value.events,
            users: value.users.size,
        }))
        .sort((a, b) => b.events - a.events || a.key.localeCompare(b.key))
}

function uniqueUserIds(records: Array<{ userId: string }>) {
    return [...new Set(records.map((record) => record.userId))]
}

function percent(numerator: number, denominator: number) {
    if (denominator <= 0) return 0
    return Math.round((numerator / denominator) * 10000) / 100
}

function average(numerator: number, denominator: number) {
    if (denominator <= 0) return 0
    return Math.round((numerator / denominator) * 100) / 100
}

function healthStatus(isWarning: boolean): 'warning' | 'healthy' {
    return isWarning ? 'warning' : 'healthy'
}

function buildPilotActions(input: {
    warnings: PilotWarningCode[]
    rewardOnlyRate: number
    spendToEarnRate: number
    pendingOverSlaCount: number
}) {
    return input.warnings.map((warning) => {
        if (warning === 'reward_only_rate_high') {
            return {
                code: warning,
                warningLevel: 'yellow' as PilotWarningLevel,
                warningReason: `Reward-only rate is ${input.rewardOnlyRate}% of active learners, above the ${REWARD_ONLY_WARNING_RATE}% pilot guardrail.`,
                recommendedAction: 'Prioritize next quest CTAs over shop CTAs, freeze shop expansion, and review mission pacing before changing prices.',
                owner: 'Product Manager EdTech + Gamification Designer',
            }
        }

        if (warning === 'spend_to_earn_rate_high') {
            return {
                code: warning,
                warningLevel: 'yellow' as PilotWarningLevel,
                warningReason: `Approved Fucoin spend is ${input.spendToEarnRate}% of earned Fucoin, above the ${SPEND_TO_EARN_WARNING_RATE}% inflation guardrail.`,
                recommendedAction: 'Keep prices and daily cap fixed, pause reward expansion, and prepare a tuning proposal from the next pilot readout.',
                owner: 'Gamification Designer + Data / Analytics Engineer',
            }
        }

        return {
            code: warning,
            warningLevel: 'red' as PilotWarningLevel,
            warningReason: `${input.pendingOverSlaCount} pending reward request(s) are older than the ${PENDING_SLA_HOURS}h operations SLA.`,
            recommendedAction: 'Escalate the admin queue, approve or reject supported digital rewards, and require fulfillment or rejection notes before pilot launch.',
            owner: 'Operations/Admin Owner + Project Manager',
        }
    })
}

function buildPilotSummary(
    actions: ReturnType<typeof buildPilotActions>,
    input: { from: Date; to: Date },
) {
    const cohortLabel = `${input.from.toISOString().slice(0, 10)} to ${input.to.toISOString().slice(0, 10)}`
    const topAction = actions.find((action) => action.warningLevel === 'red') ?? actions[0]

    if (!topAction) {
        return {
            warningLevel: 'green' as PilotWarningLevel,
            warningReason: 'Pilot guardrails are healthy for the selected cohort window.',
            recommendedAction: 'Run the weekly readout ritual, keep catalog prices and Fucoin cap fixed, and continue steering learners to the next quest.',
            cohortLabel,
        }
    }

    return {
        warningLevel: topAction.warningLevel,
        warningReason: topAction.warningReason,
        recommendedAction: topAction.recommendedAction,
        cohortLabel,
    }
}

function normalizeReason(reason: string | null) {
    const trimmed = reason?.trim()
    if (!trimmed) return 'no_reason'
    return trimmed.length > 80 ? `${trimmed.slice(0, 77)}...` : trimmed
}

function metadataRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null
    return value as Record<string, unknown>
}

function scoreBandFromMetadata(metadata: unknown) {
    const value = metadataRecord(metadata)?.score_percent ?? metadataRecord(metadata)?.scorePercent
    const score = typeof value === 'number' ? value : null
    if (score === null) return 'unknown'
    if (score >= 90) return 'mastered'
    if (score >= 70) return 'clear'
    if (score >= 50) return 'practice_again'
    return 'rebuild'
}
