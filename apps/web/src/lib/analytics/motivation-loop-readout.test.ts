import { describe, expect, it, vi } from 'vitest'
import { getMotivationLoopReadout } from './motivation-loop-readout'

describe('getMotivationLoopReadout', () => {
    it('summarizes motivation events and separates reward-only engagement', async () => {
        const findManyMock = vi.fn()
            .mockResolvedValueOnce([
                event({
                    userId: 'learner-1',
                    eventName: 'mission_claimed',
                    metadata: { period: 'daily' },
                }),
                event({
                    userId: 'learner-1',
                    eventName: 'streak_advanced',
                    metadata: { current_streak: 2 },
                }),
                event({
                    userId: 'learner-2',
                    eventName: 'streak_freeze_used',
                    metadata: { current_streak: 5 },
                }),
                event({
                    userId: 'learner-3',
                    eventName: 'streak_reset',
                    metadata: { current_streak: 1 },
                }),
                event({
                    userId: 'learner-1',
                    eventName: 'fucoin_earned',
                    metadata: {
                        amount: 5,
                        cap_reached: false,
                        source_type: 'learning:vocabulary',
                    },
                }),
                event({
                    userId: 'learner-2',
                    eventName: 'fucoin_earned',
                    metadata: {
                        amount: 1,
                        cap_reached: true,
                        source_type: 'learning:listening',
                    },
                }),
                event({
                    userId: 'learner-3',
                    eventName: 'reward_redeem_requested',
                    metadata: { category: 'support' },
                }),
                event({
                    userId: 'learner-1',
                    eventName: 'reward_redeem_requested',
                    metadata: { category: 'support' },
                }),
                event({
                    userId: 'learner-1',
                    eventName: 'reward_redeem_approved',
                    metadata: { category: 'support', cost: 120 },
                }),
                event({
                    userId: 'learner-1',
                    eventName: 'reward_redeem_fulfilled',
                    metadata: { category: 'support', automatic_grant: true },
                }),
                event({
                    userId: 'learner-3',
                    eventName: 'reward_redeem_rejected',
                    metadata: { category: 'real_gift', cost: 900 },
                }),
            ])
            .mockResolvedValueOnce([
                event({ userId: 'learner-1', eventName: 'meaningful_action_completed', actionId: 'a1', actionType: 'reading_task' }),
                event({ userId: 'learner-1', eventName: 'meaningful_action_completed', actionId: 'a2', actionType: 'listening_task' }),
                event({ userId: 'learner-1', eventName: 'meaningful_action_completed', actionId: 'a3', actionType: 'srs_review' }),
                event({ userId: 'learner-2', eventName: 'meaningful_action_completed', actionId: 'b1', actionType: 'reading_task' }),
            ])

        const readout = await getMotivationLoopReadout({
            from: new Date('2026-05-12T00:00:00.000Z'),
            to: new Date('2026-05-18T23:59:59.999Z'),
            db: dbMock(findManyMock),
        })

        expect(readout).toMatchObject({
            counts: {
                motivationUsers: 3,
                meaningfulActionUsers: 2,
                rewardOnlyUsers: 1,
                weeklyProgressOverlapUsers: 1,
            },
            missions: {
                claims: 1,
                users: 1,
            },
            streaks: {
                advanced: 1,
                advancedUsers: 1,
                freezeUsed: 1,
                freezeUsedUsers: 1,
                reset: 1,
                resetUsers: 1,
            },
            fucoin: {
                earnedEvents: 2,
                earnedUsers: 2,
                totalEarned: 6,
                capReachedUsers: 1,
            },
            rewards: {
                redeemRequests: 2,
                redeemRequestUsers: 2,
                approvedSpends: 1,
                approvedSpendUsers: 1,
                fulfilledRewards: 1,
                fulfilledRewardUsers: 1,
                rejectedRequests: 1,
                rejectedRequestUsers: 1,
                totalFucoinSpent: 120,
                rewardOnlyUsers: 1,
            },
            splits: {
                missionClaimsByPeriod: [
                    { key: 'daily', events: 1, users: 1 },
                ],
                rewardRequestsByCategory: [
                    { key: 'support', events: 2, users: 2 },
                ],
                rewardApprovalsByCategory: [
                    { key: 'support', events: 1, users: 1 },
                ],
                rewardFulfillmentsByCategory: [
                    { key: 'support', events: 1, users: 1 },
                ],
                rewardRejectionsByCategory: [
                    { key: 'real_gift', events: 1, users: 1 },
                ],
            },
        })
        expect(findManyMock).toHaveBeenNthCalledWith(1, expect.objectContaining({
            where: expect.objectContaining({
                role: 'LEARNER',
                eventName: {
                    in: expect.arrayContaining(['mission_claimed', 'reward_redeem_requested', 'reward_redeem_approved']),
                },
            }),
        }))
    })
})

function dbMock(findMany: ReturnType<typeof vi.fn>) {
    return {
        analyticsEvent: {
            findMany,
        },
    } as any
}

function event(overrides: Record<string, unknown>) {
    return {
        id: `${overrides.userId ?? 'learner-1'}-${overrides.eventName ?? 'event'}-${overrides.actionId ?? 'none'}`,
        userId: 'learner-1',
        role: 'LEARNER',
        eventName: 'mission_claimed',
        source: null,
        sessionId: null,
        route: null,
        actionId: null,
        actionType: null,
        level: null,
        skill: null,
        metadata: null,
        createdAt: new Date('2026-05-12T10:00:00.000Z'),
        ...overrides,
    }
}
