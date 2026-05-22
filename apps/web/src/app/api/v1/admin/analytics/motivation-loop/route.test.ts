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

describe('GET /api/v1/admin/analytics/motivation-loop', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        getServerUserMock.mockResolvedValue({
            userId: 'admin-1',
            role: 'ADMIN',
        })
    })

    it('rejects unauthenticated callers', async () => {
        getServerUserMock.mockResolvedValueOnce(null)

        const response = await GET(request('2026-05-12', '2026-05-18'))

        expect(response.status).toBe(403)
        expect(analyticsEventFindManyMock).not.toHaveBeenCalled()
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

    it('rejects invalid date params', async () => {
        const response = await GET(request('2026-05-18', '2026-05-12'))

        expect(response.status).toBe(400)
        expect(analyticsEventFindManyMock).not.toHaveBeenCalled()
    })

    it('returns motivation loop counts and reward-only users', async () => {
        analyticsEventFindManyMock
            .mockResolvedValueOnce([
                event({ userId: 'learner-1', eventName: 'mission_claimed', metadata: { period: 'daily' } }),
                event({ userId: 'learner-2', eventName: 'reward_redeem_requested', metadata: { category: 'support' } }),
            ])
            .mockResolvedValueOnce([
                event({ userId: 'learner-1', eventName: 'meaningful_action_completed', actionId: 'a1', actionType: 'reading_task' }),
            ])

        const response = await GET(request('2026-05-12', '2026-05-18'))

        expect(response.status).toBe(200)
        const body = await response.json()
        expect(body).toMatchObject({
            success: true,
            data: {
                counts: {
                    motivationUsers: 2,
                    meaningfulActionUsers: 1,
                    rewardOnlyUsers: 1,
                },
                missions: {
                    claims: 1,
                    users: 1,
                },
                rewards: {
                    redeemRequests: 1,
                    redeemRequestUsers: 1,
                    rewardOnlyUsers: 1,
                },
            },
        })
    })
})

function request(from: string, to: string) {
    return new NextRequest(`http://localhost/api/v1/admin/analytics/motivation-loop?from=${from}&to=${to}`)
}

function event(overrides: Record<string, unknown>) {
    return {
        id: 'event-1',
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
