import { describe, expect, it, vi } from 'vitest'
import { getLearningProgressReadout } from './learning-progress-readout'

describe('getLearningProgressReadout', () => {
    it('counts learners with at least three deduped meaningful completions as weekly progress', async () => {
        const findManyMock = vi.fn()
            .mockResolvedValueOnce([
                event({ userId: 'learner-1', eventName: 'onboarding_completed' }),
                event({ userId: 'learner-2', eventName: 'onboarding_completed' }),
                event({ userId: 'learner-3', eventName: 'onboarding_completed' }),
            ])
            .mockResolvedValueOnce([
                event({
                    userId: 'learner-1',
                    eventName: 'meaningful_action_completed',
                    actionId: 'reading-1',
                    actionType: 'reading_task',
                    level: 'A1',
                    skill: 'reading',
                }),
                event({
                    userId: 'learner-1',
                    eventName: 'meaningful_action_completed',
                    actionId: 'reading-1',
                    actionType: 'reading_task',
                    level: 'A1',
                    skill: 'reading',
                }),
                event({
                    userId: 'learner-1',
                    eventName: 'meaningful_action_completed',
                    actionId: 'listening-1',
                    actionType: 'listening_task',
                    level: 'A1',
                    skill: 'listening',
                }),
                event({
                    userId: 'learner-1',
                    eventName: 'meaningful_action_completed',
                    actionId: 'srs-1',
                    actionType: 'srs_review',
                    level: 'A1',
                    skill: 'vocabulary',
                }),
                event({
                    userId: 'learner-2',
                    eventName: 'meaningful_action_completed',
                    actionId: 'reading-2',
                    actionType: 'reading_task',
                    level: 'A2',
                    skill: 'reading',
                }),
                event({
                    userId: 'learner-2',
                    eventName: 'meaningful_action_completed',
                    actionId: 'listening-2',
                    actionType: 'listening_task',
                    level: 'A2',
                    skill: 'listening',
                }),
            ])
            .mockResolvedValueOnce([])

        const readout = await getLearningProgressReadout({
            from: new Date('2026-05-12T00:00:00.000Z'),
            to: new Date('2026-05-18T23:59:59.999Z'),
            db: dbMock(findManyMock),
        })

        expect(readout.weeklyProgress).toEqual({
            counts: {
                eligibleLearners: 3,
                reachedWeeklyProgressUsers: 1,
            },
            rate: 33.33,
            medianActionCount: 2,
            distribution: {
                zero: 1,
                one: 0,
                two: 1,
                threePlus: 1,
            },
            actionMix: [
                { key: 'listening_task', completions: 2, users: 2 },
                { key: 'reading_task', completions: 2, users: 2 },
                { key: 'srs_review', completions: 1, users: 1 },
            ],
            levelSplit: [
                { key: 'A1', completions: 3, users: 1 },
                { key: 'A2', completions: 2, users: 1 },
            ],
            skillSplit: [
                { key: 'listening', completions: 2, users: 2 },
                { key: 'reading', completions: 2, users: 2 },
                { key: 'vocabulary', completions: 1, users: 1 },
            ],
        })
    })

    it('excludes teacher/admin events through learner-only queries', async () => {
        const findManyMock = vi.fn()
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([])

        await getLearningProgressReadout({
            from: new Date('2026-05-12T00:00:00.000Z'),
            to: new Date('2026-05-18T23:59:59.999Z'),
            db: dbMock(findManyMock),
        })

        expect(findManyMock).toHaveBeenNthCalledWith(1, expect.objectContaining({
            where: expect.objectContaining({ role: 'LEARNER' }),
        }))
        expect(findManyMock).toHaveBeenNthCalledWith(2, expect.objectContaining({
            where: expect.objectContaining({ role: 'LEARNER' }),
        }))
        expect(findManyMock).toHaveBeenNthCalledWith(3, expect.objectContaining({
            where: expect.objectContaining({ role: 'LEARNER' }),
        }))
    })

    it('calculates D1/D7/D30 retention from activation anchors', async () => {
        const activationAt = new Date('2026-05-12T08:00:00.000Z')
        const findManyMock = vi.fn()
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([
                event({
                    userId: 'learner-1',
                    eventName: 'activation_completed',
                    createdAt: activationAt,
                }),
                event({
                    userId: 'learner-2',
                    eventName: 'activation_completed',
                    createdAt: activationAt,
                }),
            ])
            .mockResolvedValueOnce([
                event({
                    userId: 'learner-1',
                    eventName: 'meaningful_action_completed',
                    createdAt: new Date('2026-05-13T09:00:00.000Z'),
                }),
                event({
                    userId: 'learner-1',
                    eventName: 'meaningful_action_completed',
                    createdAt: new Date('2026-05-19T09:00:00.000Z'),
                }),
                event({
                    userId: 'learner-2',
                    eventName: 'meaningful_action_completed',
                    createdAt: new Date('2026-06-11T09:00:00.000Z'),
                }),
            ])

        const readout = await getLearningProgressReadout({
            from: new Date('2026-05-12T00:00:00.000Z'),
            to: new Date('2026-05-12T23:59:59.999Z'),
            db: dbMock(findManyMock),
        })

        expect(readout.retention).toEqual({
            activatedLearners: 2,
            d1: { retainedUsers: 1, rate: 50 },
            d7: { retainedUsers: 1, rate: 50 },
            d30: { retainedUsers: 1, rate: 50 },
        })
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
        eventName: 'onboarding_completed',
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
