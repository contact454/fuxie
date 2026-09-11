import { beforeEach, describe, expect, it, vi } from 'vitest'

const { withDbAuthMock, completeSessionMock } = vi.hoisted(() => ({
    withDbAuthMock: vi.fn(),
    completeSessionMock: vi.fn(),
}))

vi.mock('@/lib/auth/middleware', () => ({
    withDbAuth: withDbAuthMock,
    AuthError: class AuthError extends Error {},
    NotFoundError: class NotFoundError extends Error {},
}))

vi.mock('@/lib/session/attempt-service', () => ({
    completeSession: completeSessionMock,
}))

import { SessionError } from '@/lib/session/errors'
import { POST } from './route'

const attemptId = '11111111-1111-4111-8111-111111111111'
const publicRevision = '22222222-2222-4222-8222-222222222222'
const receipt = {
    attemptId,
    status: 'COMPLETED',
    reason: 'all_answered',
    level: 'A1',
    gradedCount: 1,
    correctCount: 1,
    acknowledgedCount: 0,
    baseXpEarned: 10,
    streakBonusXp: 0,
    xpEarned: 10,
    heartsRemaining: 5,
    completionEligible: true,
    wordsLearned: 0,
    srsReviewed: 1,
    savedAt: '2026-09-11T10:00:00.000Z',
    contractVersion: 2,
    gradingVersion: 'session-v2',
}

const request = (body: unknown) => ({ json: async () => body }) as any

describe('POST /api/v1/session/complete — v2 contract', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        withDbAuthMock.mockResolvedValue({ userId: 'db-user-1', firebaseUid: 'firebase-1', email: 'learner@example.test', role: 'LEARNER' })
        completeSessionMock.mockResolvedValue(receipt)
    })

    it('delegates completion to the server-authoritative attempt service for the authenticated DB user', async () => {
        const response = await POST(request({ contractVersion: 2, attemptId, publicRevision }))

        expect(response.status).toBe(200)
        await expect(response.json()).resolves.toEqual({ success: true, data: { receipt } })
        expect(completeSessionMock).toHaveBeenCalledExactlyOnceWith('db-user-1', {
            contractVersion: 2,
            attemptId,
            publicRevision,
        })
    })

    it.each([
        { contractVersion: 1, attemptId, publicRevision },
        { contractVersion: 2, attemptId: 'not-a-uuid', publicRevision },
        { contractVersion: 2, attemptId, publicRevision: 'not-a-uuid' },
        { contractVersion: 2, attemptId },
    ])('rejects an invalid v2 completion payload before calling the service', async (body) => {
        const response = await POST(request(body))

        expect(response.status).toBe(400)
        await expect(response.json()).resolves.toMatchObject({
            success: false,
            error: { code: 'VALIDATION_ERROR' },
        })
        expect(completeSessionMock).not.toHaveBeenCalled()
    })

    it('preserves a session-domain conflict code from the service', async () => {
        completeSessionMock.mockRejectedValue(new SessionError(409, 'SESSION_INCOMPLETE', 'Session is not ready to complete'))

        const response = await POST(request({ contractVersion: 2, attemptId, publicRevision }))

        expect(response.status).toBe(409)
        await expect(response.json()).resolves.toEqual({
            success: false,
            error: { code: 'SESSION_INCOMPLETE', message: 'Session is not ready to complete' },
        })
    })

    it('never accepts legacy client-supplied XP/results as a completion contract', async () => {
        const response = await POST(request({
            results: [],
            totalXp: 999999,
            heartsRemaining: 5,
            level: 'A1',
        }))

        expect(response.status).toBe(400)
        expect(completeSessionMock).not.toHaveBeenCalled()
    })
})
