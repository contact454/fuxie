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

describe('GET /api/v1/admin/analytics/activation', () => {
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

        const response = await GET(request('2026-05-12', '2026-05-12'))

        expect(response.status).toBe(403)
        expect(analyticsEventFindManyMock).not.toHaveBeenCalled()
    })

    it('returns activation funnel counts, rates, median time, and action split', async () => {
        analyticsEventFindManyMock
            .mockResolvedValueOnce([
                event({ userId: 'learner-1', eventName: 'onboarding_completed' }),
                event({ userId: 'learner-2', eventName: 'onboarding_completed' }),
            ])
            .mockResolvedValueOnce([
                event({ userId: 'learner-1', eventName: 'dashboard_next_action_clicked' }),
            ])
            .mockResolvedValueOnce([
                event({ userId: 'learner-1', eventName: 'meaningful_action_completed' }),
                event({ userId: 'learner-2', eventName: 'meaningful_action_completed' }),
            ])
            .mockResolvedValueOnce([
                event({
                    userId: 'learner-1',
                    eventName: 'activation_completed',
                    actionType: 'reading_task',
                    metadata: { hours_to_activation: 2.5, activation_action_type: 'reading_task' },
                }),
            ])

        const response = await GET(request('2026-05-12', '2026-05-12'))

        expect(response.status).toBe(200)
        await expect(response.json()).resolves.toEqual({
            success: true,
            data: {
                range: {
                    from: '2026-05-12T00:00:00.000Z',
                    to: '2026-05-12T23:59:59.999Z',
                },
                counts: {
                    onboardedLearners: 2,
                    dashboardPrimaryClickUsers: 1,
                    meaningfulCompletionUsers: 2,
                    activatedUsers: 1,
                },
                rates: {
                    dashboardClickRate: 50,
                    meaningfulCompletionRate: 100,
                    activationRate: 50,
                },
                medianHoursToActivation: 2.5,
                activationByActionType: [
                    { actionType: 'reading_task', activatedUsers: 1 },
                ],
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
    return new NextRequest(`http://localhost/api/v1/admin/analytics/activation?from=${from}&to=${to}`)
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
