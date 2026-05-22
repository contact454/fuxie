import { ShopRedeemRequestStatus } from '@fuxie/database'
import { describe, expect, it, vi } from 'vitest'

import { getGamificationPilotReadout } from './gamification-pilot-readout'

describe('getGamificationPilotReadout', () => {
    it('summarizes learning, economy, reward queue, and health warnings', async () => {
        const analyticsFindMany = vi.fn().mockResolvedValue([
            event({
                userId: 'learner-1',
                eventName: 'meaningful_action_completed',
                actionId: 'lesson-1',
                actionType: 'lesson_session',
                skill: 'reading',
                level: 'A1',
                createdAt: new Date('2026-05-01T09:00:00.000Z'),
            }),
            event({
                userId: 'learner-1',
                eventName: 'meaningful_action_completed',
                actionId: 'lesson-2',
                actionType: 'lesson_session',
                skill: 'reading',
                level: 'A1',
                createdAt: new Date('2026-05-03T09:00:00.000Z'),
            }),
            event({
                userId: 'learner-2',
                eventName: 'reward_redeem_requested',
                metadata: { category: 'support' },
            }),
            event({
                userId: 'learner-1',
                eventName: 'mission_claimed',
            }),
            event({
                userId: 'learner-1',
                eventName: 'fucoin_earned',
                metadata: { amount: 100 },
            }),
            event({
                userId: 'learner-1',
                eventName: 'streak_advanced',
            }),
            event({
                userId: 'learner-1',
                eventName: 'badge_unlocked',
                actionId: 'badge-1',
                skill: 'reading',
                level: 'A1',
                metadata: { badgeId: 'first-quest', receiptState: 'newly_unlocked' },
            }),
            event({
                userId: 'learner-1',
                eventName: 'ai_feedback_generated',
                actionId: 'W-A1-EMAIL-001',
                actionType: 'writing_submission',
                skill: 'SCHREIBEN',
                level: 'A1',
                metadata: { flow: 'writing', score_percent: 72, provider_status: 'success' },
            }),
            event({
                userId: 'learner-1',
                eventName: 'ai_feedback_failed',
                actionId: 'W-A1-EMAIL-002',
                actionType: 'writing_submission',
                skill: 'SCHREIBEN',
                level: 'A1',
                metadata: { flow: 'writing', error_type: 'service_status' },
            }),
            event({
                userId: 'learner-1',
                eventName: 'ai_feedback_generated',
                actionId: 'nachsprechen:A1',
                actionType: 'speaking_submission',
                skill: 'SPRECHEN',
                level: 'A1',
                metadata: { flow: 'speaking', score_percent: 82, provider_status: 'success', exercise_type: 'nachsprechen' },
            }),
            event({
                userId: 'learner-1',
                eventName: 'ai_feedback_failed',
                actionId: 'nachsprechen:A1',
                actionType: 'speaking_submission',
                skill: 'SPRECHEN',
                level: 'A1',
                metadata: { flow: 'speaking', error_type: 'provider_or_parse_failure', exercise_type: 'nachsprechen' },
            }),
            event({
                userId: 'learner-1',
                eventName: 'mastery_progress_viewed',
            }),
            event({
                userId: 'learner-1',
                eventName: 'quest_episode_started',
                actionId: 'vocab-episode:A1:essen',
                actionType: 'vocabulary_practice',
                skill: 'WORTSCHATZ',
                level: 'A1',
                metadata: { episodeId: 'vocab-episode:A1:essen', themeSlug: 'essen', checkpointId: 'discover' },
            }),
            event({
                userId: 'learner-1',
                eventName: 'quest_episode_checkpoint_reached',
                actionId: 'vocab-episode:A1:essen',
                actionType: 'vocabulary_practice',
                skill: 'WORTSCHATZ',
                level: 'A1',
                metadata: { episodeId: 'vocab-episode:A1:essen', themeSlug: 'essen', checkpointId: 'recall' },
            }),
            event({
                userId: 'learner-1',
                eventName: 'quest_episode_completed',
                actionId: 'vocab-episode:A1:essen',
                actionType: 'vocabulary_practice',
                skill: 'WORTSCHATZ',
                level: 'A1',
                metadata: { episodeId: 'vocab-episode:A1:essen', themeSlug: 'essen', checkpointId: 'lock_in', accuracyBand: 'clear' },
                createdAt: new Date('2026-05-01T08:30:00.000Z'),
            }),
            event({
                userId: 'learner-4',
                eventName: 'quest_episode_started',
                actionId: 'listening-episode:A1:L-A1-GOETHE-001-T1',
                actionType: 'listening_task',
                skill: 'listening',
                level: 'A1',
                metadata: { episodeId: 'listening-episode:A1:L-A1-GOETHE-001-T1', skill: 'listening', lessonId: 'L-A1-GOETHE-001-T1', checkpointId: 'preview' },
            }),
            event({
                userId: 'learner-1',
                eventName: 'meaningful_action_completed',
                actionId: 'lesson-after-episode',
                actionType: 'vocabulary_practice',
                skill: 'WORTSCHATZ',
                level: 'A1',
                createdAt: new Date('2026-05-01T08:40:00.000Z'),
            }),
            event({
                userId: 'learner-2',
                eventName: 'gamification_intervention_shown',
                metadata: { interventionCode: 'adaptive_reward_only_risk' },
                createdAt: new Date('2026-05-01T08:00:00.000Z'),
            }),
            event({
                userId: 'learner-2',
                eventName: 'gamification_intervention_clicked',
                metadata: { interventionCode: 'adaptive_reward_only_risk' },
                createdAt: new Date('2026-05-01T08:02:00.000Z'),
            }),
            event({
                userId: 'learner-4',
                eventName: 'gamification_intervention_shown',
                metadata: { interventionCode: 'adaptive_low_repeat_study' },
                createdAt: new Date('2026-05-01T08:05:00.000Z'),
            }),
            event({
                userId: 'learner-4',
                eventName: 'meaningful_action_completed',
                actionId: 'lesson-4',
                actionType: 'lesson_session',
                skill: 'grammar',
                level: 'A1',
                createdAt: new Date('2026-05-01T08:10:00.000Z'),
            }),
        ])
        const shopFindMany = vi.fn().mockResolvedValue([
            request({
                userId: 'learner-2',
                status: ShopRedeemRequestStatus.PENDING,
                requestedAt: new Date('2026-04-28T09:00:00.000Z'),
            }),
            request({
                id: 'redeem-2',
                userId: 'learner-1',
                status: ShopRedeemRequestStatus.APPROVED,
                cost: 90,
                reviewedAt: new Date('2026-05-02T09:00:00.000Z'),
                fulfilledAt: null,
            }),
            request({
                id: 'redeem-3',
                userId: 'learner-3',
                status: ShopRedeemRequestStatus.REJECTED,
                itemCategory: 'real_gift',
                statusReason: 'Real gift locked',
                reviewedAt: new Date('2026-05-02T10:00:00.000Z'),
            }),
        ])

        const readout = await getGamificationPilotReadout({
            from: new Date('2026-05-01T00:00:00.000Z'),
            to: new Date('2026-05-07T23:59:59.999Z'),
            now: new Date('2026-05-03T12:00:00.000Z'),
            db: dbMock(analyticsFindMany, shopFindMany),
        })

        expect(readout).toMatchObject({
            counts: {
                activeLearners: 4,
                meaningfulActionUsers: 2,
                meaningfulActions: 4,
                rewardOnlyUsers: 2,
            },
            learningLoop: {
                lessonCompletionRate: 50,
                repeatStudyWithin7DaysUsers: 1,
                repeatStudyWithin7DaysRate: 50,
                missionClaimRate: 25,
                missionClaims: 1,
                streakAdvances: 1,
            },
            interventions: {
                shown: 2,
                clicked: 1,
                clickThroughRate: 50,
                followThroughUsers: 1,
                followThroughRate: 50,
            },
            mastery: {
                badgeUnlocks: 1,
                persistentBadgeUnlocks: 1,
                viewed: 1,
                badgeUnlocksByBadge: [{ key: 'first-quest', events: 1, users: 1 }],
                badgeUnlocksBySkill: [{ key: 'reading', events: 1, users: 1 }],
            },
            questEpisodes: {
                started: 2,
                checkpointReached: 1,
                completed: 1,
                completionRate: 50,
                checkpointDropoff: 1,
                repeatStudyAfterEpisodeUsers: 1,
                repeatStudyAfterEpisodeRate: 100,
                bySkill: [
                    { key: 'WORTSCHATZ', events: 3, users: 1 },
                    { key: 'listening', events: 1, users: 1 },
                ],
                byTheme: [
                    { key: 'essen', events: 3, users: 1 },
                    { key: 'unknown', events: 1, users: 1 },
                ],
                byAccuracyBand: [{ key: 'clear', events: 1, users: 1 }],
            },
            writingFeedback: {
                submitted: 2,
                graded: 1,
                feedbackGenerated: 1,
                feedbackFailed: 1,
                failureRate: 50,
                byFeedbackStatus: [
                    { key: 'failed', events: 1, users: 1 },
                    { key: 'generated', events: 1, users: 1 },
                ],
                byErrorType: [{ key: 'service_status', events: 1, users: 1 }],
            },
            speakingPronunciation: {
                submitted: 2,
                evaluated: 1,
                feedbackGenerated: 1,
                feedbackFailed: 1,
                failureRate: 50,
                byFeedbackStatus: [
                    { key: 'failed', events: 1, users: 1 },
                    { key: 'generated', events: 1, users: 1 },
                ],
                byErrorType: [{ key: 'provider_or_parse_failure', events: 1, users: 1 }],
                byScoreBand: [{ key: 'clear', events: 1, users: 1 }],
            },
            economy: {
                fucoinEarned: 100,
                fucoinSpent: 90,
                spendToEarnRate: 90,
                rewardOnlyRate: 50,
            },
            rewards: {
                pending: 1,
                pendingOverSla: 1,
                approvedSpends: 1,
                awaitingFulfillment: 1,
                rejected: 1,
            },
            health: {
                rewardOnly: 'warning',
                spendToEarn: 'warning',
                pendingSla: 'warning',
                warnings: ['reward_only_rate_high', 'spend_to_earn_rate_high', 'pending_reward_queue_over_sla'],
                warningLevel: 'red',
                cohortLabel: '2026-05-01 to 2026-05-07',
                recommendedAction: 'Escalate the admin queue, approve or reject supported digital rewards, and require fulfillment or rejection notes before pilot launch.',
            },
        })
        expect(readout.health.actions).toEqual([
            expect.objectContaining({
                code: 'reward_only_rate_high',
                warningLevel: 'yellow',
                owner: 'Product Manager EdTech + Gamification Designer',
            }),
            expect.objectContaining({
                code: 'spend_to_earn_rate_high',
                warningLevel: 'yellow',
                owner: 'Gamification Designer + Data / Analytics Engineer',
            }),
            expect.objectContaining({
                code: 'pending_reward_queue_over_sla',
                warningLevel: 'red',
                owner: 'Operations/Admin Owner + Project Manager',
            }),
        ])
        expect(readout.splits.skill).toEqual([
            { key: 'reading', events: 2, users: 1 },
            { key: 'grammar', events: 1, users: 1 },
            { key: 'WORTSCHATZ', events: 1, users: 1 },
        ])
        expect(readout.interventions.byCode).toEqual([
            { key: 'adaptive_low_repeat_study', events: 1, users: 1 },
            { key: 'adaptive_reward_only_risk', events: 1, users: 1 },
        ])
        expect(readout.splits.rewardApprovalsByCategory).toEqual([{ key: 'support', events: 1, users: 1 }])
        expect(readout.splits.rejectedReasons).toEqual([{ key: 'Real gift locked', events: 1, users: 1 }])
        expect(shopFindMany).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({
                OR: expect.any(Array),
            }),
        }))
    })

    it('returns a green weekly action when pilot guardrails are healthy', async () => {
        const analyticsFindMany = vi.fn().mockResolvedValue([
            event({
                userId: 'learner-1',
                eventName: 'meaningful_action_completed',
                actionId: 'lesson-1',
                createdAt: new Date('2026-05-01T09:00:00.000Z'),
            }),
            event({
                userId: 'learner-1',
                eventName: 'fucoin_earned',
                metadata: { amount: 100 },
            }),
        ])
        const shopFindMany = vi.fn().mockResolvedValue([])

        const readout = await getGamificationPilotReadout({
            from: new Date('2026-05-01T00:00:00.000Z'),
            to: new Date('2026-05-07T23:59:59.999Z'),
            now: new Date('2026-05-03T12:00:00.000Z'),
            db: dbMock(analyticsFindMany, shopFindMany),
        })

        expect(readout.health).toMatchObject({
            warnings: [],
            actions: [],
            warningLevel: 'green',
            warningReason: 'Pilot guardrails are healthy for the selected cohort window.',
            recommendedAction: 'Run the weekly readout ritual, keep catalog prices and Fucoin cap fixed, and continue steering learners to the next quest.',
            cohortLabel: '2026-05-01 to 2026-05-07',
        })
    })

    it('aggregates six-skill quest episode evidence for pilot readout', async () => {
        const skills = ['vocabulary', 'listening', 'reading', 'grammar', 'writing', 'speaking']
        const analyticsFindMany = vi.fn().mockResolvedValue(skills.flatMap((skill, index) => [
            event({
                userId: `learner-${index + 1}`,
                eventName: 'quest_episode_started',
                actionId: `${skill}-episode:A1:fixture`,
                actionType: `${skill}_episode`,
                skill,
                level: 'A1',
                metadata: { skill, episodeId: `${skill}-episode:A1:fixture`, checkpointId: 'start' },
            }),
            event({
                userId: `learner-${index + 1}`,
                eventName: 'quest_episode_completed',
                actionId: `${skill}-episode:A1:fixture`,
                actionType: `${skill}_episode`,
                skill,
                level: 'A1',
                metadata: { skill, episodeId: `${skill}-episode:A1:fixture`, accuracyBand: 'clear' },
                createdAt: new Date(`2026-05-01T0${index}:30:00.000Z`),
            }),
            event({
                userId: `learner-${index + 1}`,
                eventName: 'meaningful_action_completed',
                actionId: `${skill}-follow-through`,
                actionType: `${skill}_episode`,
                skill,
                level: 'A1',
                createdAt: new Date(`2026-05-01T0${index}:40:00.000Z`),
            }),
        ]))
        const shopFindMany = vi.fn().mockResolvedValue([])

        const readout = await getGamificationPilotReadout({
            from: new Date('2026-05-01T00:00:00.000Z'),
            to: new Date('2026-05-07T23:59:59.999Z'),
            now: new Date('2026-05-03T12:00:00.000Z'),
            db: dbMock(analyticsFindMany, shopFindMany),
        })

        expect(readout.questEpisodes).toMatchObject({
            started: 6,
            completed: 6,
            completionRate: 100,
            repeatStudyAfterEpisodeUsers: 6,
            repeatStudyAfterEpisodeRate: 100,
        })
        expect(readout.questEpisodes.bySkill).toEqual([...skills].sort().map((skill) => ({
            key: skill,
            events: 2,
            users: 1,
        })))
    })

    it('aggregates lesson gameplay expansion evidence', async () => {
        const analyticsFindMany = vi.fn().mockResolvedValue([
            event({
                userId: 'learner-1',
                eventName: 'dashboard_secondary_action_clicked',
                actionId: 'first-contact:boss-review',
                actionType: 'vocabulary_practice',
                skill: 'vocabulary',
                level: 'A1',
                metadata: { pathId: 'a1-first-contact', stepId: 'boss-review' },
            }),
            event({
                userId: 'learner-1',
                eventName: 'dashboard_secondary_action_clicked',
                actionId: 'first-contact:speed-match',
                actionType: 'vocabulary_practice',
                skill: 'vocabulary',
                level: 'A1',
                metadata: { pathId: 'a1-first-contact', stepId: 'speed-match' },
            }),
            event({
                userId: 'learner-1',
                eventName: 'quest_episode_started',
                actionId: 'microgame:speed-match:a1-person',
                actionType: 'vocabulary_practice',
                skill: 'vocabulary',
                level: 'A1',
                metadata: { microgameId: 'speed-match', themeSlug: 'a1-person' },
            }),
            event({
                userId: 'learner-1',
                eventName: 'quest_episode_completed',
                actionId: 'microgame:speed-match:a1-person',
                actionType: 'vocabulary_practice',
                skill: 'vocabulary',
                level: 'A1',
                metadata: { microgameId: 'speed-match', themeSlug: 'a1-person', accuracyBand: 'clear' },
            }),
            event({
                userId: 'learner-1',
                eventName: 'quest_episode_started',
                actionId: 'roleplay:self-intro:A1',
                actionType: 'speaking_submission',
                skill: 'speaking',
                level: 'A1',
                metadata: { scenarioId: 'self-intro', checkpointCount: 3 },
            }),
            event({
                userId: 'learner-1',
                eventName: 'quest_episode_completed',
                actionId: 'roleplay:self-intro:A1',
                actionType: 'speaking_submission',
                skill: 'speaking',
                level: 'A1',
                metadata: { scenarioId: 'self-intro', accuracyBand: 'practice_again', scorePercent: 60 },
            }),
            event({
                userId: 'learner-4',
                eventName: 'quest_episode_practice_note',
                actionId: 'roleplay:cafe-order:A1',
                actionType: 'speaking_submission',
                skill: 'speaking',
                level: 'A1',
                metadata: { scenarioId: 'cafe-order', receiptState: 'practice_note', scoredResponses: 0 },
            }),
            event({
                userId: 'learner-3',
                eventName: 'quest_episode_started',
                actionId: 'campaign:a1-cafe',
                actionType: 'speaking_submission',
                skill: 'speaking',
                level: 'A1',
                metadata: { campaignNodeId: 'a1-cafe', campaignPathId: 'a1-starter' },
            }),
        ])
        const shopFindMany = vi.fn().mockResolvedValue([])

        const readout = await getGamificationPilotReadout({
            from: new Date('2026-05-01T00:00:00.000Z'),
            to: new Date('2026-05-07T23:59:59.999Z'),
            now: new Date('2026-05-03T12:00:00.000Z'),
            db: dbMock(analyticsFindMany, shopFindMany),
        })

        expect(readout.lessonGameplay).toMatchObject({
            firstSessionPath: {
                starts: 2,
                users: 1,
                bossToRoleplayFollowThroughUsers: 1,
                byStep: [
                    { key: 'boss-review', events: 1, users: 1 },
                    { key: 'speed-match', events: 1, users: 1 },
                ],
            },
            microgames: {
                started: 1,
                completed: 1,
                completionRate: 100,
                byGame: [{ key: 'speed-match', events: 2, users: 1 }],
                byTheme: [{ key: 'a1-person', events: 2, users: 1 }],
            },
            roleplay: {
                started: 1,
                completed: 1,
                practiceNotes: 1,
                completionRate: 100,
                byScenario: [
                    { key: 'self-intro', events: 2, users: 1 },
                    { key: 'cafe-order', events: 1, users: 1 },
                ],
                byReceiptState: [
                    { key: 'completed_scored', events: 1, users: 1 },
                    { key: 'practice_note', events: 1, users: 1 },
                    { key: 'started', events: 1, users: 1 },
                ],
                byScoreBand: [{ key: 'practice_again', events: 1, users: 1 }],
            },
            campaign: {
                nodeStarts: 1,
                byNode: [{ key: 'a1-cafe', events: 1, users: 1 }],
                byPath: [{ key: 'a1-starter', events: 1, users: 1 }],
            },
        })
    })
})

function dbMock(analyticsFindMany: ReturnType<typeof vi.fn>, shopFindMany: ReturnType<typeof vi.fn>) {
    return {
        analyticsEvent: {
            findMany: analyticsFindMany,
        },
        shopRedeemRequest: {
            findMany: shopFindMany,
        },
    } as any
}

function event(overrides: Record<string, unknown>) {
    return {
        id: `${overrides.userId ?? 'learner'}-${overrides.eventName ?? 'event'}-${overrides.actionId ?? 'none'}`,
        userId: 'learner-1',
        role: 'LEARNER',
        eventName: 'meaningful_action_completed',
        source: null,
        sessionId: null,
        route: null,
        actionId: null,
        actionType: null,
        level: null,
        skill: null,
        metadata: null,
        createdAt: new Date('2026-05-01T10:00:00.000Z'),
        ...overrides,
    }
}

function request(overrides: Record<string, unknown>) {
    return {
        id: 'redeem-1',
        userId: 'learner-1',
        itemId: 'streak-freeze',
        itemTitle: 'Streak Freeze',
        itemCategory: 'support',
        cost: 120,
        status: ShopRedeemRequestStatus.PENDING,
        statusReason: null,
        requestedAt: new Date('2026-05-01T11:00:00.000Z'),
        reviewedAt: null,
        fulfilledAt: null,
        ...overrides,
    }
}
