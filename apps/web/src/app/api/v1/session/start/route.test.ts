import { beforeEach, describe, expect, it, vi } from 'vitest'

const { withDbAuthMock, startSessionMock } = vi.hoisted(() => ({
    withDbAuthMock: vi.fn(),
    startSessionMock: vi.fn(),
}))

vi.mock('@/lib/auth/middleware', () => ({
    withDbAuth: withDbAuthMock,
    AuthError: class AuthError extends Error {},
    NotFoundError: class NotFoundError extends Error {},
}))

vi.mock('@/lib/session/attempt-service', () => ({ startSession: startSessionMock }))

import { POST } from './route'

const clientStartKey = '11111111-1111-4111-8111-111111111111'
const attemptId = '22222222-2222-4222-8222-222222222222'
const publicRevision = '33333333-3333-4333-8333-333333333333'
const request = (body: unknown) => ({ json: async () => body }) as any

const ready = {
    state: 'ready',
    attemptId,
    contractVersion: 2,
    publicRevision,
    level: 'A1',
    status: 'IN_PROGRESS',
    expiresAt: '2026-09-11T11:00:00.000Z',
    items: [],
    checkedAnswers: [],
    nextQuestionId: null,
    heartsRemaining: 5,
    completionAvailable: false,
    receipt: null,
}

describe('POST /api/v1/session/start — v2 contract', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        withDbAuthMock.mockResolvedValue({ userId: 'db-user-1', firebaseUid: 'firebase-1', email: 'learner@example.test', role: 'LEARNER' })
        startSessionMock.mockResolvedValue(ready)
    })

    it('starts/resumes by authenticated DB user and client idempotency key', async () => {
        const response = await POST(request({ contractVersion: 2, clientStartKey }))

        expect(response.status).toBe(200)
        await expect(response.json()).resolves.toEqual({ success: true, data: ready })
        expect(startSessionMock).toHaveBeenCalledExactlyOnceWith('db-user-1', { contractVersion: 2, clientStartKey })
    })

    it.each([
        { contractVersion: 1, clientStartKey },
        { contractVersion: 2, clientStartKey: 'not-a-uuid' },
        { contractVersion: 2 },
        { contractVersion: 2, clientStartKey, unexpected: true },
    ])('rejects invalid start input before the service', async (body) => {
        const response = await POST(request(body))
        expect(response.status).toBe(400)
        await expect(response.json()).resolves.toMatchObject({ success: false, error: { code: 'VALIDATION_ERROR' } })
        expect(startSessionMock).not.toHaveBeenCalled()
    })
})
