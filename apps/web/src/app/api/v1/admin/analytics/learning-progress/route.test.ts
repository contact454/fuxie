import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const {
    getServerUserMock,
    analyticsEventFindManyMock,
} = vi.hoisted(() => ({
    getServerUserMock: vi.fn(),
    analyticsEventFindManyMock: vi.fn(),
}))

vi.mock('@/lib/auth/server-auth', () => ({
    getServerUser: getServerUserMock,
}))

vi.mock('@fuxie/database', () => ({
    prisma: {
        analyticsEvent: {
            findMany: analyticsEventFindManyMock,
        },
    },
}))

import { GET } from './route'

describe('GET /api/v1/admin/analytics/learning-progress', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        getServerUserMock.mockResolvedValue({
            userId: 'admin-1',
            role: 'ADMIN',
        })
    })

    it('rejects non-admin callers', async () => {
        getServerUserMock.mockResolvedValueOnce({
            userId: 'learner-1',
            role: 'LEARNER',
        })

        const response = await GET(request('2026-05-12', '2026-05-18'))

        expect(response.status).toBe(403)
        expect(analyticsEventFindManyMock).not.toHaveBeenCalled()
    })

    it('rejects unauthenticated callers', async () => {
        getServerUserMock.mockResolvedValueOnce(null)

        const response = await GET(request('2026-05-12', '2026-05-18'))

        expect(response.status).toBe(403)
        expect(analyticsEventFindManyMock).not.toHaveBeenCalled()
    })

    it('rejects malformed date params', async () => {
        const response = await GET(request('2026-5-12', '2026-05-18'))

        expect(response.status).toBe(400)
        expect(analyticsEventFindManyMock).not.toHaveBeenCalled()
    })

    it('rejects inverted date ranges', async () => {
        const response = await GET(request('2026-05-18', '2026-05-12'))

        expect(response.status).toBe(400)
        expect(analyticsEventFindManyMock).not.toHaveBeenCalled()
    })

    it('returns weekly progress and retention readout', async () => {
        analyticsEventFindManyMock
            .mockResolvedValueOnce([
                event({ userId: 'learner-1', eventName: 'onboarding_completed' }),
                event({ userId: 'learner-2', eventName: 'onboarding_completed' }),
            ])
            .mockResolvedValueOnce([
                event({ userId: 'learner-1', eventName: 'meaningful_action_completed', actionId: 'a1', actionType: 'reading_task', level: 'A1', skill: 'reading' }),
                event({ userId: 'learner-1', eventName: 'meaningful_action_completed', actionId: 'a2', actionType: 'listening_task', level: 'A1', skill: 'listening' }),
                event({ userId: 'learner-1', eventName: 'meaningful_action_completed', actionId: 'a3', actionType: 'srs_review', level: 'A1', skill: 'vocabulary' }),
            ])
            .mockResolvedValueOnce([
                event({ userId: 'learner-1', eventName: 'activation_completed' }),
            ])
            .mockResolvedValueOnce([
                event({
                    userId: 'learner-1',
                    eventName: 'meaningful_action_completed',
                    createdAt: new Date('2026-05-13T12:00:00.000Z'),
                }),
            ])

        const response = await GET(request('2026-05-12', '2026-05-18'))

        expect(response.status).toBe(200)
        const body = await response.json()
        expect(body).toMatchObject({
            success: true,
            data: {
                weeklyProgress: {
                    counts: {
                        eligibleLearners: 2,
                        reachedWeeklyProgressUsers: 1,
                    },
                    rate: 50,
                },
                retention: {
                    activatedLearners: 1,
                    d1: {
                        retainedUsers: 1,
                        rate: 100,
                    },
                },
            },
        })
        expect(analyticsEventFindManyMock).toHaveBeenNthCalledWith(1, expect.objectContaining({
            where: expect.objectContaining({
                role: 'LEARNER',
                eventName: 'onboarding_completed',
            }),
        }))
    })
})

function request(from: string, to: string) {
    return new NextRequest(`http://localhost/api/v1/admin/analytics/learning-progress?from=${from}&to=${to}`)
}

function event(overrides: Record<string, unknown>) {
    return {
        id: 'event-1',
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
