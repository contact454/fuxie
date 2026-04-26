import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const {
    getTokensMock,
    findUserMock,
} = vi.hoisted(() => ({
    getTokensMock: vi.fn(),
    findUserMock: vi.fn(),
}))

vi.mock('next-firebase-auth-edge', () => ({
    getTokens: getTokensMock,
}))

vi.mock('./config', () => ({
    authConfig: {},
}))

vi.mock('@fuxie/database', () => ({
    prisma: {
        user: {
            findFirst: findUserMock,
        },
    },
}))

import { NotFoundError, withAuth, withDbAuth } from './middleware'

describe('API auth middleware', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        getTokensMock.mockResolvedValue({
            decodedToken: {
                uid: 'firebase-uid-1',
                email: 'learner@fuxie.test',
            },
        })
        findUserMock.mockResolvedValue({
            id: 'db-user-1',
            firebaseUid: 'firebase-uid-1',
            email: 'learner@fuxie.test',
            role: 'LEARNER',
        })
    })

    it('keeps withAuth as Firebase-token auth for routes that need firebaseUid', async () => {
        const auth = await withAuth(request())

        expect(auth).toEqual({
            userId: 'firebase-uid-1',
            email: 'learner@fuxie.test',
        })
    })

    it('maps Firebase auth to the database user id for persistence routes', async () => {
        const auth = await withDbAuth(request())

        expect(findUserMock).toHaveBeenCalledWith({
            where: {
                firebaseUid: 'firebase-uid-1',
                deletedAt: null,
            },
            select: {
                id: true,
                firebaseUid: true,
                email: true,
                role: true,
            },
        })
        expect(auth).toEqual({
            userId: 'db-user-1',
            firebaseUid: 'firebase-uid-1',
            email: 'learner@fuxie.test',
            role: 'LEARNER',
        })
    })

    it('throws NotFoundError when Firebase auth has no active DB user', async () => {
        findUserMock.mockResolvedValueOnce(null)

        await expect(withDbAuth(request())).rejects.toBeInstanceOf(NotFoundError)
    })
})

function request() {
    return new NextRequest('http://localhost/api/v1/test')
}
