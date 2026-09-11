import { beforeEach, describe, expect, it, vi } from 'vitest'

const { withDbAuthMock, checkSessionAnswerMock } = vi.hoisted(() => ({
    withDbAuthMock: vi.fn(),
    checkSessionAnswerMock: vi.fn(),
}))

vi.mock('@/lib/auth/middleware', () => ({
    withDbAuth: withDbAuthMock,
    AuthError: class AuthError extends Error {},
    NotFoundError: class NotFoundError extends Error {},
}))

vi.mock('@/lib/session/attempt-service', () => ({ checkSessionAnswer: checkSessionAnswerMock }))

import { SessionError } from '@/lib/session/errors'
import { POST } from './route'

const attemptId = '11111111-1111-4111-8111-111111111111'
const publicRevision = '22222222-2222-4222-8222-222222222222'
const questionId = '33333333-3333-4333-8333-333333333333'
const optionId = '44444444-4444-4444-8444-444444444444'
const request = (body: unknown) => ({ json: async () => body }) as any
const context = (id = attemptId) => ({ params: Promise.resolve({ attemptId: id }) })

const view = { state: 'ready', attemptId, contractVersion: 2, publicRevision }

describe('POST /api/v1/session/[attemptId]/answers — v2 contract', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        withDbAuthMock.mockResolvedValue({ userId: 'db-user-1', firebaseUid: 'firebase-1', email: 'learner@example.test', role: 'LEARNER' })
        checkSessionAnswerMock.mockResolvedValue(view)
    })

    it('checks an answer through the authenticated user-scoped service', async () => {
        const body = {
            contractVersion: 2,
            publicRevision,
            questionId,
            answer: { kind: 'option', optionId },
        }
        const response = await POST(request(body), context())

        expect(response.status).toBe(200)
        await expect(response.json()).resolves.toEqual({ success: true, data: view })
        expect(checkSessionAnswerMock).toHaveBeenCalledExactlyOnceWith('db-user-1', attemptId, body)
    })

    it('rejects malformed attempt identifiers before the service', async () => {
        const response = await POST(request({
            contractVersion: 2,
            publicRevision,
            questionId,
            answer: { kind: 'option', optionId },
        }), context('not-a-uuid'))

        expect(response.status).toBe(400)
        expect(checkSessionAnswerMock).not.toHaveBeenCalled()
    })

    it.each([
        { contractVersion: 1, publicRevision, questionId, answer: { kind: 'option', optionId } },
        { contractVersion: 2, publicRevision: 'bad', questionId, answer: { kind: 'option', optionId } },
        { contractVersion: 2, publicRevision, questionId: 'bad', answer: { kind: 'option', optionId } },
        { contractVersion: 2, publicRevision, questionId, answer: { kind: 'text', text: '' } },
    ])('rejects invalid answer input before the service', async (body) => {
        const response = await POST(request(body), context())
        expect(response.status).toBe(400)
        expect(checkSessionAnswerMock).not.toHaveBeenCalled()
    })

    it('preserves stale-revision conflicts as a learner-recoverable session error', async () => {
        checkSessionAnswerMock.mockRejectedValue(new SessionError(409, 'SESSION_REVISION_CHANGED', 'Session revision does not match'))

        const response = await POST(request({
            contractVersion: 2,
            publicRevision,
            questionId,
            answer: { kind: 'option', optionId },
        }), context())

        expect(response.status).toBe(409)
        await expect(response.json()).resolves.toEqual({
            success: false,
            error: { code: 'SESSION_REVISION_CHANGED', message: 'Session revision does not match' },
        })
    })
})
