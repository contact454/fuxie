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

describe('GET /api/v1/admin/analytics/ai-eval', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        getServerUserMock.mockResolvedValue({
            userId: 'admin-1',
            role: 'ADMIN',
        })
        analyticsEventFindManyMock.mockResolvedValue([])
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

    it('returns AI eval readout JSON for admins', async () => {
        analyticsEventFindManyMock.mockResolvedValueOnce([
            event({
                userId: 'learner-1',
                eventName: 'ai_feedback_generated',
                metadata: { flow: 'writing', score_percent: 88 },
            }),
            event({
                userId: 'learner-2',
                eventName: 'ai_feedback_failed',
                metadata: { flow: 'speaking', error_type: 'provider_or_parse_failure' },
            }),
        ])

        const response = await GET(request('2026-05-12', '2026-05-18'))

        expect(response.status).toBe(200)
        const body = await response.json()
        expect(body).toMatchObject({
            success: true,
            data: {
                counts: {
                    aiEvalUsers: 2,
                    generatedEvents: 1,
                    failedEvents: 1,
                },
                rates: {
                    failureRate: 50,
                },
            },
        })
        expect(analyticsEventFindManyMock).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({
                role: 'LEARNER',
                eventName: {
                    in: ['ai_feedback_generated', 'ai_feedback_failed'],
                },
            }),
        }))
    })
})

function request(from: string, to: string) {
    return new NextRequest(`http://localhost/api/v1/admin/analytics/ai-eval?from=${from}&to=${to}`)
}

function event(overrides: Record<string, unknown>) {
    return {
        id: 'event-1',
        userId: 'learner-1',
        role: 'LEARNER',
        eventName: 'ai_feedback_generated',
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
