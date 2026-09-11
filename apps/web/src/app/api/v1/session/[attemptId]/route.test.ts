import { beforeEach, describe, expect, it, vi } from 'vitest'

const { withDbAuthMock, readSessionAttemptMock } = vi.hoisted(() => ({
    withDbAuthMock: vi.fn(),
    readSessionAttemptMock: vi.fn(),
}))

vi.mock('@/lib/auth/middleware', () => ({
    withDbAuth: withDbAuthMock,
    AuthError: class AuthError extends Error {},
    NotFoundError: class NotFoundError extends Error {},
}))

vi.mock('@/lib/session/attempt-service', () => ({ readSessionAttempt: readSessionAttemptMock }))

import { GET } from './route'

const attemptId = '11111111-1111-4111-8111-111111111111'
const view = { state: 'ready', attemptId, contractVersion: 2 }

describe('GET /api/v1/session/[attemptId] — v2 contract', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        withDbAuthMock.mockResolvedValue({ userId: 'db-user-1', firebaseUid: 'firebase-1', email: 'learner@example.test', role: 'LEARNER' })
        readSessionAttemptMock.mockResolvedValue(view)
    })

    it('reads only through the authenticated user-scoped service', async () => {
        const response = await GET({} as any, { params: Promise.resolve({ attemptId }) })
        expect(response.status).toBe(200)
        await expect(response.json()).resolves.toEqual({ success: true, data: view })
        expect(readSessionAttemptMock).toHaveBeenCalledExactlyOnceWith('db-user-1', attemptId)
    })

    it('rejects malformed attempt identifiers before the service', async () => {
        const response = await GET({} as any, { params: Promise.resolve({ attemptId: 'not-a-uuid' }) })
        expect(response.status).toBe(400)
        await expect(response.json()).resolves.toMatchObject({ success: false, error: { code: 'VALIDATION_ERROR' } })
        expect(readSessionAttemptMock).not.toHaveBeenCalled()
    })
})
