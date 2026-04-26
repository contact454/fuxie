import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const {
    withDbAuthMock,
} = vi.hoisted(() => ({
    withDbAuthMock: vi.fn(),
}))

vi.mock('@/lib/auth/middleware', () => ({
    withDbAuth: withDbAuthMock,
}))

vi.mock('@fuxie/database', () => ({
    prisma: {
        classroom: {
            findUnique: vi.fn(),
        },
    },
}))

import { requireTeacher } from './teacher-guard'

describe('requireTeacher', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        withDbAuthMock.mockResolvedValue({
            userId: 'db-teacher-1',
            firebaseUid: 'firebase-teacher-1',
            email: 'teacher@fuxie.test',
            role: 'TEACHER',
        })
    })

    it('returns the database user id for teacher-owned resources', async () => {
        const user = await requireTeacher(request())

        expect(user).toMatchObject({
            userId: 'db-teacher-1',
            firebaseUid: 'firebase-teacher-1',
            role: 'TEACHER',
        })
    })

    it('allows admins to use teacher endpoints', async () => {
        withDbAuthMock.mockResolvedValueOnce({
            userId: 'db-admin-1',
            firebaseUid: 'firebase-admin-1',
            email: 'admin@fuxie.test',
            role: 'ADMIN',
        })

        const user = await requireTeacher(request())

        expect(user.userId).toBe('db-admin-1')
    })

    it('rejects learners', async () => {
        withDbAuthMock.mockResolvedValueOnce({
            userId: 'db-learner-1',
            firebaseUid: 'firebase-learner-1',
            email: 'learner@fuxie.test',
            role: 'LEARNER',
        })

        await expect(requireTeacher(request())).rejects.toMatchObject({ status: 403 })
    })
})

function request() {
    return new NextRequest('http://localhost/api/v1/teacher/classrooms')
}
