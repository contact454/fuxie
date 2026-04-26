import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
    getServerUserMock,
    findUserMock,
    updateUserMock,
} = vi.hoisted(() => ({
    getServerUserMock: vi.fn(),
    findUserMock: vi.fn(),
    updateUserMock: vi.fn(),
}))

vi.mock('@/lib/auth/server-auth', () => ({
    getServerUser: getServerUserMock,
}))

vi.mock('@fuxie/database', () => ({
    prisma: {
        user: {
            findUnique: findUserMock,
            update: updateUserMock,
        },
    },
    UserRole: {
        LEARNER: 'LEARNER',
        TEACHER: 'TEACHER',
        ADMIN: 'ADMIN',
        CONTENT_CREATOR: 'CONTENT_CREATOR',
    },
}))

import { PATCH } from './route'

describe('PATCH /api/v1/admin/users/role', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        getServerUserMock.mockResolvedValue({
            email: 'admin@fuxie.test',
            role: 'ADMIN',
        })
        findUserMock.mockResolvedValue({
            id: 'user-1',
            email: 'teacher@fuxie.test',
        })
        updateUserMock.mockResolvedValue({
            id: 'user-1',
            email: 'teacher@fuxie.test',
            role: 'TEACHER',
        })
    })

    it('rejects non-admin callers', async () => {
        getServerUserMock.mockResolvedValueOnce({
            email: 'teacher@fuxie.test',
            role: 'TEACHER',
        })

        const response = await PATCH(roleRequest({
            email: 'learner@fuxie.test',
            role: 'LEARNER',
        }))

        expect(response.status).toBe(403)
        expect(updateUserMock).not.toHaveBeenCalled()
    })

    it('rejects invalid payloads before mutating users', async () => {
        const response = await PATCH(roleRequest({
            email: 'not-an-email',
            role: 'ROOT',
        }))

        expect(response.status).toBe(400)
        expect(updateUserMock).not.toHaveBeenCalled()
    })

    it('prevents admins from demoting their own account', async () => {
        const response = await PATCH(roleRequest({
            email: 'admin@fuxie.test',
            role: 'TEACHER',
        }))

        expect(response.status).toBe(400)
        expect(updateUserMock).not.toHaveBeenCalled()
    })

    it('updates the target user role with a limited response shape', async () => {
        const response = await PATCH(roleRequest({
            email: 'teacher@fuxie.test',
            role: 'TEACHER',
        }))

        expect(response.status).toBe(200)
        await expect(response.json()).resolves.toMatchObject({
            success: true,
            user: {
                id: 'user-1',
                email: 'teacher@fuxie.test',
                role: 'TEACHER',
            },
        })
        expect(updateUserMock).toHaveBeenCalledWith({
            where: { email: 'teacher@fuxie.test' },
            data: { role: 'TEACHER' },
            select: {
                id: true,
                email: true,
                role: true,
                updatedAt: true,
            },
        })
    })
})

function roleRequest(body: unknown) {
    return new Request('http://localhost/api/v1/admin/users/role', {
        method: 'PATCH',
        body: JSON.stringify(body),
        headers: { 'content-type': 'application/json' },
    })
}
