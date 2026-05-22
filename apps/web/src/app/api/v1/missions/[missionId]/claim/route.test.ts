import { NextRequest } from 'next/server'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { POST } from './route'
import { getServerUser } from '@/lib/auth/server-auth'
import { claimMissionReward, MissionClaimError } from '@/lib/gamification/missions'
import { invalidateLearnerProgressCaches } from '@/lib/progress/cache-invalidation'

vi.mock('@/lib/auth/server-auth', () => ({
    getServerUser: vi.fn(),
}))

vi.mock('@/lib/gamification/missions', () => ({
    claimMissionReward: vi.fn(),
    MissionClaimError: class MissionClaimError extends Error {
        status: number
        constructor(message: string, status = 400) {
            super(message)
            this.name = 'MissionClaimError'
            this.status = status
        }
    },
}))

vi.mock('@/lib/progress/cache-invalidation', () => ({
    invalidateLearnerProgressCaches: vi.fn(() => Promise.resolve()),
}))

describe('POST /api/v1/missions/[missionId]/claim', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should return 401 if user is not authenticated', async () => {
        vi.mocked(getServerUser).mockResolvedValue(null)
        const req = new NextRequest('http://localhost/api/v1/missions/m1/claim', { method: 'POST' })
        const res = await POST(req, { params: Promise.resolve({ missionId: 'm1' }) })

        expect(res.status).toBe(401)
        const json = await res.json()
        expect(json.success).toBe(false)
    })

    it('should claim mission and return 200 on success', async () => {
        vi.mocked(getServerUser).mockResolvedValue({ userId: 'user-1', email: 'test@example.com', role: 'LEARNER', firebaseUid: 'mock', uiLanguage: 'vi' })
        vi.mocked(claimMissionReward).mockResolvedValue({
            claimed: true,
            mission: { id: 'm1', status: 'claimed' } as any,
            missionBoard: {} as any,
        })

        const req = new NextRequest('http://localhost/api/v1/missions/m1/claim', { method: 'POST' })
        const res = await POST(req, { params: Promise.resolve({ missionId: 'm1' }) })

        expect(res.status).toBe(200)
        const json = await res.json()
        expect(json.success).toBe(true)
        expect(json.data.claimed).toBe(true)
        expect(claimMissionReward).toHaveBeenCalledWith('user-1', 'm1')
        expect(invalidateLearnerProgressCaches).toHaveBeenCalledWith('user-1')
    })

    it('should return 400 if mission is already claimed (MissionClaimError)', async () => {
        vi.mocked(getServerUser).mockResolvedValue({ userId: 'user-1', email: 'test@example.com', role: 'LEARNER', firebaseUid: 'mock', uiLanguage: 'vi' })
        vi.mocked(claimMissionReward).mockRejectedValue(new MissionClaimError('Mission already claimed for this period', 400))

        const req = new NextRequest('http://localhost/api/v1/missions/m1/claim', { method: 'POST' })
        const res = await POST(req, { params: Promise.resolve({ missionId: 'm1' }) })

        expect(res.status).toBe(400)
        const json = await res.json()
        expect(json.success).toBe(false)
        expect(json.error).toBe('Mission already claimed for this period')
    })

    it('should return 500 on unexpected error', async () => {
        vi.mocked(getServerUser).mockResolvedValue({ userId: 'user-1', email: 'test@example.com', role: 'LEARNER', firebaseUid: 'mock', uiLanguage: 'vi' })
        vi.mocked(claimMissionReward).mockRejectedValue(new Error('DB connection failed'))

        const req = new NextRequest('http://localhost/api/v1/missions/m1/claim', { method: 'POST' })
        const res = await POST(req, { params: Promise.resolve({ missionId: 'm1' }) })

        expect(res.status).toBe(500)
        const json = await res.json()
        expect(json.success).toBe(false)
        expect(json.error).toBe('Failed to claim mission')
    })
})
