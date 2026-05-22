import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const {
    getServerUserMock,
    getGamificationPilotReadoutMock,
} = vi.hoisted(() => ({
    getServerUserMock: vi.fn(),
    getGamificationPilotReadoutMock: vi.fn(),
}))

vi.mock('@/lib/auth/server-auth', () => ({
    getServerUser: getServerUserMock,
}))

vi.mock('@/lib/analytics/gamification-pilot-readout', () => ({
    getGamificationPilotReadout: getGamificationPilotReadoutMock,
}))

import { GET } from './route'

describe('GET /api/v1/admin/analytics/gamification-pilot', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        getServerUserMock.mockResolvedValue({
            userId: 'admin-1',
            role: 'ADMIN',
        })
        getGamificationPilotReadoutMock.mockResolvedValue({
            counts: { activeLearners: 2 },
            health: { warnings: [] },
        })
    })

    it('rejects unauthenticated callers', async () => {
        getServerUserMock.mockResolvedValueOnce(null)

        const response = await GET(request('2026-05-01', '2026-05-07'))

        expect(response.status).toBe(403)
        expect(getGamificationPilotReadoutMock).not.toHaveBeenCalled()
    })

    it('rejects non-admin callers', async () => {
        getServerUserMock.mockResolvedValueOnce({
            userId: 'learner-1',
            role: 'LEARNER',
        })

        const response = await GET(request('2026-05-01', '2026-05-07'))

        expect(response.status).toBe(403)
        expect(getGamificationPilotReadoutMock).not.toHaveBeenCalled()
    })

    it('rejects invalid date params', async () => {
        const response = await GET(request('2026-05-07', '2026-05-01'))

        expect(response.status).toBe(400)
        expect(getGamificationPilotReadoutMock).not.toHaveBeenCalled()
    })

    it('returns the gamification pilot readout', async () => {
        const response = await GET(request('2026-05-01', '2026-05-07'))

        expect(response.status).toBe(200)
        const body = await response.json()
        expect(body).toMatchObject({
            success: true,
            data: {
                counts: { activeLearners: 2 },
                health: { warnings: [] },
            },
        })
        expect(getGamificationPilotReadoutMock).toHaveBeenCalledWith({
            from: new Date('2026-05-01T00:00:00.000Z'),
            to: new Date('2026-05-07T23:59:59.999Z'),
        })
    })
})

function request(from: string, to: string) {
    return new NextRequest(`http://localhost/api/v1/admin/analytics/gamification-pilot?from=${from}&to=${to}`)
}
